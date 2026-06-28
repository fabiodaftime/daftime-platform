// Réconciliation multi-sources : à partir des extractions par fichier, choisit une valeur
// par poste selon une PRIORITÉ ajustable, détecte les corroborations et les conflits.
// Les postes MONÉTAIRES sont convertis dans la devise de reporting AVANT toute comparaison.

import { convert } from "./fx.ts";

export type SourceType =
  | "sales_export" | "ads_dashboard" | "pnl" | "bank_statement" | "payroll" | "invoice" | "other";

export interface FileExtract {
  file: string;
  type: SourceType;
  values: Record<string, number>;
  sources?: Record<string, string>;
  currency?: string; // devise principale du fichier (ISO : EUR/AED/USD/GBP)
}

// Priorité par défaut (validée) : export plateforme > compta (P&L) > relevé bancaire > reste.
// Ajustable ici ; dépend en partie de la méthode comptable du client.
const BASE_PRIORITY: SourceType[] = ["sales_export", "ads_dashboard", "pnl", "bank_statement", "payroll", "invoice", "other"];

// Exceptions par métrique (là où une source fait foi).
const METRIC_PRIORITY: Record<string, SourceType[]> = {
  cash_end: ["bank_statement", "pnl"],
  cash_start: ["bank_statement", "pnl"],
  cash_variation: ["bank_statement", "pnl"],
  ads_total: ["ads_dashboard", "pnl", "bank_statement"],
  ads_meta: ["ads_dashboard"],
  ads_google: ["ads_dashboard"],
  impressions: ["ads_dashboard"],
  clicks: ["ads_dashboard"],
  sessions: ["ads_dashboard", "other"],
};

const rankOf = (id: string, type: SourceType): number => {
  const order = METRIC_PRIORITY[id] ?? BASE_PRIORITY;
  const i = order.indexOf(type);
  return i < 0 ? 99 : i;
};

export interface Reconciled {
  values: Record<string, number>;
  sources: Record<string, string>;
  confidence: Record<string, "single" | "corroborated" | "conflict">;
  conflicts: { id: string; label: string; severity: "warn" }[];
}

export interface ReconcileOpts {
  factor?: Record<string, number>; // table de conversion devise -> reporting
  monetaryIds?: Set<string>; // postes à convertir (les autres = comptes/ratios, intacts)
  reporting?: string; // devise de reporting (pour les libellés)
}

const fmtNum = (n: number) => (Math.abs(n) >= 100 ? Math.round(n).toLocaleString("fr-FR") : String(Math.round(n * 100) / 100));

export function reconcile(extracts: FileExtract[], labelOf: (id: string) => string, opts: ReconcileOpts = {}): Reconciled {
  const factor = opts.factor ?? {};
  const monetary = opts.monetaryIds;
  const rep = (opts.reporting ?? "EUR").toUpperCase();

  type Cand = { raw: number; value: number; cur: string; converted: boolean; type: SourceType; file: string; loc?: string };
  const cands: Record<string, Cand[]> = {};
  for (const e of extracts) {
    const cur = (e.currency ?? rep).toUpperCase();
    for (const [id, val] of Object.entries(e.values ?? {})) {
      if (typeof val === "number" && isFinite(val)) {
        const isMoney = monetary ? monetary.has(id) : true;
        const value = isMoney ? convert(val, cur, factor) : val;
        (cands[id] ??= []).push({ raw: val, value, cur, converted: isMoney && cur !== rep, type: e.type, file: e.file, loc: e.sources?.[id] });
      }
    }
  }

  const out: Reconciled = { values: {}, sources: {}, confidence: {}, conflicts: [] };
  const tag = (c: Cand) => {
    const where = `${c.file}${c.loc ? ` (${c.loc})` : ""}`;
    return c.converted ? `${where} [${fmtNum(c.raw)} ${c.cur} → ${fmtNum(c.value)} ${rep}]` : where;
  };

  for (const [id, list] of Object.entries(cands)) {
    list.sort((a, b) => rankOf(id, a.type) - rankOf(id, b.type));
    const top = list[0];
    out.values[id] = top.value;

    const tol = Math.max(Math.abs(top.value) * 0.02, 1); // 2% ou 1 unité (sur valeurs converties)
    const divergent = list.slice(1).filter((c) => Math.abs(c.value - top.value) > tol);

    if (divergent.length) {
      out.confidence[id] = "conflict";
      out.sources[id] = `${tag(top)} — retenu (priorité ${top.type})`;
      out.conflicts.push({
        id,
        severity: "warn",
        label: `Conflit sur « ${labelOf(id)} » : ${fmtNum(top.value)} ${rep} [${top.type}] vs ${divergent.map((d) => `${fmtNum(d.value)} ${rep} [${d.type}]`).join(", ")} — valeur retenue : ${fmtNum(top.value)} ${rep}.`,
      });
    } else if (list.length >= 2) {
      out.confidence[id] = "corroborated";
      out.sources[id] = `${tag(top)} (corroboré par ${list.length - 1} autre(s) source(s))`;
    } else {
      out.confidence[id] = "single";
      out.sources[id] = tag(top);
    }
  }

  return out;
}
