// Réconciliation multi-sources : à partir des extractions par fichier, choisit une valeur
// par poste selon une PRIORITÉ ajustable, détecte les corroborations et les conflits.

export type SourceType =
  | "sales_export" | "ads_dashboard" | "pnl" | "bank_statement" | "payroll" | "invoice" | "other";

export interface FileExtract {
  file: string;
  type: SourceType;
  values: Record<string, number>;
  sources?: Record<string, string>;
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

export function reconcile(extracts: FileExtract[], labelOf: (id: string) => string): Reconciled {
  const cands: Record<string, { value: number; type: SourceType; file: string; loc?: string }[]> = {};
  for (const e of extracts) {
    for (const [id, val] of Object.entries(e.values ?? {})) {
      if (typeof val === "number" && isFinite(val)) {
        (cands[id] ??= []).push({ value: val, type: e.type, file: e.file, loc: e.sources?.[id] });
      }
    }
  }

  const out: Reconciled = { values: {}, sources: {}, confidence: {}, conflicts: [] };
  const tag = (c: { file: string; loc?: string }) => `${c.file}${c.loc ? ` (${c.loc})` : ""}`;

  for (const [id, list] of Object.entries(cands)) {
    list.sort((a, b) => rankOf(id, a.type) - rankOf(id, b.type));
    const top = list[0];
    out.values[id] = top.value;

    const tol = Math.max(Math.abs(top.value) * 0.02, 1); // 2% ou 1 unité
    const divergent = list.slice(1).filter((c) => Math.abs(c.value - top.value) > tol);

    if (divergent.length) {
      out.confidence[id] = "conflict";
      out.sources[id] = `${tag(top)} — retenu (priorité ${top.type})`;
      out.conflicts.push({
        id,
        severity: "warn",
        label: `Conflit sur « ${labelOf(id)} » : ${top.value} [${top.type}] vs ${divergent.map((d) => `${d.value} [${d.type}]`).join(", ")} — valeur retenue : ${top.value}.`,
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
