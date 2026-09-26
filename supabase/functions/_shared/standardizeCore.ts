// Cœur PUR de la standardisation (sans I/O) : fusion des extractions par fichier, branchement des
// paramètres d'onboarding, réconciliation avec l'IA de secours, calcul et tri des absences.
// Séparé de l'edge function pour être rejoué à l'identique sur un banc de test (fichiers réels).

import type { Breakdown, ParsedExtract } from "./parsers.ts";
import { reconcile, type FileExtract } from "./reconcile.ts";
import { buildStandardized, EXPECTED_BREAKDOWNS, inputLines, type Catalog } from "./templates.ts";
import { classifyGap } from "./conceptSources.ts";

export interface SkuCost { sku: string; name?: string; product_cost?: number; packaging?: number; inbound_transport?: number; duties?: number }
export interface CostParams {
  sku_costs?: SkuCost[];
  fulfillment?: { pick_pack_per_order?: number; shipping_cost_model?: string };
  bank_anchors?: { account: string; date: string; balance: number }[];
}
export type Flag = { id: string; severity: "info" | "warn" | "error"; label: string };
type Trace = { src: string; value: number };

// Rôle comptable canonique (le triage manuel prime sur la détection automatique).
const CANON: Record<string, string> = {
  shopify: "revenue", site: "revenue", invoicing: "revenue", quaderno: "revenue", revenue: "revenue",
  psp: "payment", payment: "payment", bank: "bank", banque: "bank", ads: "ads", publicite: "ads",
  accounting: "pnl", comptable: "pnl", pnl: "pnl", expense: "expense", internal: "internal", ignore: "ignore",
};
const r2 = (x: number) => Math.round(x * 100) / 100;
const fmt = (x: number) => Math.round(x).toLocaleString("fr-FR");
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export interface Merged {
  values: Record<string, number>;
  sources: Record<string, string>;
  traces: Record<string, Trace[]>;
  confidence: Record<string, string>;
  flags: Flag[];
  breakdowns: Record<string, Breakdown>;
  kept: ParsedExtract[];
  revenueDocs: ParsedExtract[];
  effRoleOf: (e: ParsedExtract) => string;
  questions: string[]; // questions ciblées ajoutées aux « pièces manquantes » (réponses → règles)
}

// 1) FUSION des extractions déterministes.
//  - additives (factures, relevés) : sommées ;
//  - EXCLUSIVES (rapports d'analytics qui décrivent le même fait) : la plus prioritaire fait foi,
//    les autres servent de contrôle croisé (jamais additionnées → plus de double comptage) ;
//  - CA : uniquement depuis les documents au rôle « revenue ».
export function mergeParsed(parsed: ParsedExtract[], manualByName: Map<string, { role?: string; note?: string }>, labelOf: (id: string) => string, reporting: string): Merged {
  const effRoleOf = (e: ParsedExtract) => { const raw = (manualByName.get(e.file ?? "")?.role || e.role) as string; return CANON[raw] ?? raw; };
  // Doublons connus (même facture ré-exportée, Stripe multi-mois…) : on garde le plus complet.
  const best = new Map<string, ParsedExtract>();
  for (const e of parsed) if (e.dedupGroup) { const c = best.get(e.dedupGroup); if (!c || (e.count ?? 0) > (c.count ?? 0)) best.set(e.dedupGroup, e); }
  const kept = parsed.filter((e) => !e.dedupGroup || best.get(e.dedupGroup) === e);
  const dropped = parsed.filter((e) => !kept.includes(e));

  const values: Record<string, number> = {}, sources: Record<string, string> = {}, confidence: Record<string, string> = {};
  const traces: Record<string, Trace[]> = {};
  const flags: Flag[] = [];
  const srcOf = (e: ParsedExtract, k: string) => (e.sources[k] ? `${e.file} — ${e.sources[k]}` : `${e.file} (${e.parser})`);

  // Additives
  for (const e of kept) if (!e.exclusive) for (const [k, val] of Object.entries(e.values)) {
    if (k === "ca") continue;
    values[k] = r2((values[k] ?? 0) + val);
    if (!sources[k]) sources[k] = e.sources[k] ?? e.parser;
    (traces[k] ??= []).push({ src: srcOf(e, k), value: r2(val) });
  }
  // Exclusives : meilleure priorité par poste.
  const cand: Record<string, { v: number; e: ParsedExtract }[]> = {};
  for (const e of kept) if (e.exclusive) for (const [k, val] of Object.entries(e.values)) if (k !== "ca") (cand[k] ??= []).push({ v: val, e });
  for (const [k, list] of Object.entries(cand)) {
    list.sort((a, b) => (b.e.priority ?? 0) - (a.e.priority ?? 0));
    const top = list[0];
    // Deux rapports Shopify n'ont pas toujours exactement la même définition (ex. brut « AOV over time »
    // vs « Total sales over time » : ~0,6 %) → corroboré jusqu'à 1 %, alerte seulement au-delà de 5 %.
    const tol = Math.max(Math.abs(top.v) * 0.01, 1);
    const others = list.slice(1);
    const divergent = others.filter((o) => Math.abs(o.v - top.v) > tol);
    const major = divergent.some((o) => Math.abs(o.v - top.v) > Math.abs(top.v) * 0.05);
    if (values[k] != null) { // un additif existe aussi : l'agrégat de référence prime, l'additif sert de contrôle
      if (Math.abs(values[k] - top.v) > tol) flags.push({ id: `_xcheck_${k}`, severity: "info", label: `Contrôle « ${labelOf(k)} » : ${fmt(top.v)} ${reporting} (rapport) vs ${fmt(values[k])} ${reporting} (somme des pièces) — le rapport est retenu.` });
    }
    values[k] = r2(top.v); sources[k] = top.e.sources[k] ?? top.e.parser;
    traces[k] = [{ src: srcOf(top.e, k), value: r2(top.v) }, ...others.map((o) => ({ src: `${srcOf(o.e, k)} (contrôle)`, value: r2(o.v) }))];
    confidence[k] = major ? "conflict" : others.length ? "corroborated" : "parsed";
    if (divergent.length) flags.push({ id: `_conflict_${k}`, severity: major ? "warn" : "info", label: `Écart sur « ${labelOf(k)} » : ${fmt(top.v)} (${top.e.file}) vs ${divergent.map((d) => `${fmt(d.v)} (${d.e.file})`).join(", ")} — ${fmt(top.v)} retenu (rapport de référence).` });
  }
  for (const k of Object.keys(values)) if (!confidence[k]) confidence[k] = "parsed";

  // CA = documents au rôle « revenue ». Pièces additives (facturation type Quaderno) prioritaires ;
  // sinon le meilleur rapport exclusif (Shopify « Total sales over time », « Net sales by order »…).
  const revenueDocs = kept.filter((e) => effRoleOf(e) === "revenue" && typeof e.revenueCandidate === "number");
  const addRev = revenueDocs.filter((e) => !e.exclusive), exRev = revenueDocs.filter((e) => e.exclusive).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  if (addRev.length) {
    values.ca = r2(addRev.reduce((s, e) => s + (e.revenueCandidate ?? 0), 0));
    sources.ca = addRev.map((e) => e.sources.ca ?? e.parser).join(" + ");
    traces.ca = addRev.map((e) => ({ src: srcOf(e, "ca"), value: r2(e.revenueCandidate ?? 0) }));
    confidence.ca = "parsed";
    if (addRev.length > 1) flags.push({ id: "_multi_revenue", severity: "warn", label: `${addRev.length} sources de CA cumulées (${addRev.map((e) => e.parser).join(", ")}) — risque de double comptage. Mets en « réception » celles qui ne sont pas le CA facturé.` });
    if (exRev.length && Math.abs(exRev[0].revenueCandidate! - values.ca) > Math.max(values.ca * 0.02, 1))
      flags.push({ id: "_xcheck_ca", severity: "info", label: `Contrôle CA : ${fmt(values.ca)} (facturation) vs ${fmt(exRev[0].revenueCandidate!)} (${exRev[0].file}).` });
  } else if (exRev.length) {
    const top = exRev[0];
    values.ca = r2(top.revenueCandidate!); sources.ca = top.sources.ca ?? top.parser;
    traces.ca = [{ src: srcOf(top, "ca"), value: values.ca }, ...exRev.slice(1).map((e) => ({ src: `${srcOf(e, "ca")} (contrôle)`, value: r2(e.revenueCandidate!) }))];
    const div = exRev.slice(1).filter((e) => Math.abs(e.revenueCandidate! - values.ca) > Math.max(values.ca * 0.005, 1));
    confidence.ca = div.length ? "conflict" : exRev.length > 1 ? "corroborated" : "parsed";
    if (div.length) flags.push({ id: "_conflict_ca", severity: "warn", label: `Écart sur le CA : ${fmt(values.ca)} (${top.file}) vs ${div.map((e) => `${fmt(e.revenueCandidate!)} (${e.file})`).join(", ")} — ${fmt(values.ca)} retenu.` });
  }

  // Répartitions : additives → sommées par libellé ; exclusives → la plus prioritaire.
  const breakdowns: Record<string, Breakdown> = {};
  const bkPrio: Record<string, number> = {};
  for (const e of kept) for (const [k, b] of Object.entries(e.breakdowns ?? {})) {
    const cur = breakdowns[k];
    if (!cur) { breakdowns[k] = JSON.parse(JSON.stringify(b)); bkPrio[k] = e.exclusive ? (e.priority ?? 0) : -1; continue; }
    if (!e.exclusive && bkPrio[k] === -1 && !b.columns && !cur.columns) {
      const m: Record<string, number> = {}; for (const r of [...cur.rows, ...b.rows]) m[r.label] = (m[r.label] ?? 0) + r.value;
      cur.rows = Object.entries(m).sort((a, c) => c[1] - a[1]).slice(0, 12).map(([label, value]) => ({ label, value: r2(value) }));
    } else if (e.exclusive && (e.priority ?? 0) > bkPrio[k]) { breakdowns[k] = JSON.parse(JSON.stringify(b)); bkPrio[k] = e.priority ?? 0; }
  }

  // Notes des parsers (une par fichier) + doublons écartés.
  kept.forEach((e, i) => { if (e.note) flags.push({ id: `_note_${e.parser}_${i}`, severity: "info", label: e.note }); });
  if (dropped.length) flags.push({ id: "_dups", severity: "info", label: `Doublon(s) écarté(s) : ${dropped.map((e) => e.file).join(", ")} (même pièce déjà lue).` });
  const und = kept.map((e) => e.aux?.undatedCredits as { n: number; amount: number } | undefined).filter((x): x is { n: number; amount: number } => !!x);
  if (und.length) flags.push({ id: "_undated", severity: "info", label: `${und.reduce((s, x) => s + x.n, 0)} ligne(s) d'avoir logistique sans date (${r2(und.reduce((s, x) => s + x.amount, 0))} ${reporting}) non rattachées à un mois — négligeable.` });
  const questions: string[] = [];

  // Débits bancaires non qualifiés : on NE les range PAS d'office en charges (achats de stock, virements
  // au dirigeant, remboursements d'emprunt… fausseraient le P&L) → on les liste avec la marche à suivre.
  for (const e of kept) {
    const u = e.aux?.unqualifiedDebits as { label: string; value: number }[] | undefined;
    const tot = e.aux?.unqualifiedTotal as number | undefined;
    if (u?.length && tot) {
      const pp = u.find((x) => /paypal/i.test(x.label));
      flags.push({ id: `_unqualified_${e.parser}`, severity: "warn",
        label: `Débits bancaires à qualifier : ${fmt(tot)} ${reporting} non classés — hors charges tant qu'ils ne sont pas qualifiés, donc le résultat peut être SURESTIMÉ. Principaux : ${u.slice(0, 6).map((x) => `${x.label} ${fmt(x.value)}`).join(" · ")}.${pp ? " Les prélèvements PayPal servent souvent à payer Meta/TikTok Ads." : ""}` });
      questions.push(`Débits bancaires à qualifier (${fmt(tot)} ${reporting}) : ${u.slice(0, 8).map((x) => `${x.label} ${fmt(x.value)}`).join(", ")}. Dis ce que c'est, en une phrase (ex. « PayPal = pub Meta, Hanayaka = achats de stock, BP Rives de Paris = emprunt, Zaoui = rémunération dirigeant ») — ce sera mémorisé comme règle pour tous les mois.`);
    }
  }
  return { values, sources, traces, confidence, flags, breakdowns, kept, revenueDocs, effRoleOf, questions };
}

// 2) BRANCHEMENT de l'onboarding (Paramètres shop) — ce que les exports ne contiennent pas.
export function applyCostParams(m: Merged, cp: CostParams | null | undefined, reporting: string): void {
  if (!cp) return;
  // COGS : lignes de vente sans coût Shopify → complétées par le coût de revient SKU (1 unité / ligne).
  const cogsEx = m.kept.find((e) => e.aux?.cogsZeroLines);
  const zero = (cogsEx?.aux?.cogsZeroLines ?? {}) as Record<string, number>;
  if (cogsEx && m.values.cogs != null && Object.keys(zero).length && cp.sku_costs?.length) {
    const costByName = new Map<string, number>();
    for (const s of cp.sku_costs) { const n = norm(s.name ?? s.sku ?? ""); if (n && typeof s.product_cost === "number" && s.product_cost > 0 && !costByName.has(n)) costByName.set(n, s.product_cost); }
    let add = 0, lines = 0, miss = 0;
    for (const [title, count] of Object.entries(zero)) {
      const c = costByName.get(norm(title));
      if (c != null) { add += c * count; lines += count; } else miss += count;
    }
    if (add > 0) {
      m.values.cogs = r2(m.values.cogs + add);
      (m.traces.cogs ??= []).push({ src: `complément coûts SKU (onboarding) : ${lines} ligne(s) sans coût Shopify × coût de revient, 1 unité par ligne (estimation)`, value: r2(add) });
      m.sources.cogs = `${m.sources.cogs ?? ""} + complément coûts SKU onboarding (${lines} ligne(s))`;
      m.confidence.cogs = "estimated";
    }
    if (miss) m.flags.push({ id: "_cogs_gap", severity: "warn", label: `COGS : ${miss} ligne(s) de vente sans coût ni dans Shopify ni dans tes coûts SKU — COGS encore sous-estimé. Complète « Coûts de revient par SKU » (Paramètres shop).` });
  }
  // Logistique : facture 3PL = fait ; sinon paramètre pick & pack × commandes = hypothèse.
  const pp = cp.fulfillment?.pick_pack_per_order;
  if (typeof pp === "number" && pp > 0 && m.values.orders) {
    if (m.values.shipping_cost == null) {
      m.values.shipping_cost = r2(pp * m.values.orders);
      m.sources.shipping_cost = `hypothèse : ${pp} ${reporting}/commande (onboarding) × ${m.values.orders} commandes`;
      m.traces.shipping_cost = [{ src: m.sources.shipping_cost, value: m.values.shipping_cost }];
      m.confidence.shipping_cost = "estimated";
      m.flags.push({ id: "_shipping_param", severity: "info", label: `Logistique estimée depuis ton paramètre onboarding (${pp} ${reporting}/commande) — ajoute les factures du 3PL pour le montant réel.` });
    } else {
      const real = m.values.shipping_cost / m.values.orders;
      m.flags.push({ id: "_shipping_check", severity: Math.abs(real - pp) / pp > 0.2 ? "warn" : "info",
        label: `Logistique réelle : ${real.toFixed(2)} ${reporting}/commande (factures) vs ${pp} ${reporting}/commande (paramètre onboarding)${Math.abs(real - pp) / pp > 0.2 ? " — écart > 20 %, mets à jour le paramètre" : ""}.` });
    }
  }
}

// 3) FINALISATION : fusion IA (ne comble que les trous), calcul, flags, tri des absences.
export interface FinalizeInput {
  tpl: Catalog; activity: string; currency: string; period: string; entity: string | null;
  merged: Merged; llmExtracts: FileExtract[]; factor: Record<string, number>; fxSource: string;
  skipped: { name: string; reason: string }[];
  expectedBreakdowns?: { key: string; label: string }[];
}
export function finalize(inp: FinalizeInput): { data: Record<string, unknown>; missing: string[]; blocking: string[] } {
  const { tpl, currency, merged: m } = inp;
  const lines = inputLines(tpl);
  const labelOf = (id: string) => tpl.lines.find((l) => l.id === id)?.label ?? id;
  const NON_MONEY = new Set(["%", "x", "u", "nb", "ratio", "pts", "j", "jours", "mois", "q", "score"]);
  const monetaryIds = new Set(lines.filter((l) => !l.unit || !NON_MONEY.has(l.unit.trim())).map((l) => l.id));
  const recLLM = reconcile(inp.llmExtracts, labelOf, { factor: inp.factor, monetaryIds, reporting: currency });
  for (const ex of inp.llmExtracts) for (const [k, val] of Object.entries(ex.values)) {
    if (m.values[k] != null) continue;
    (m.traces[k] ??= []).push({ src: ex.sources?.[k] ?? `${ex.file} (IA)`, value: val });
  }
  const values = { ...recLLM.values, ...m.values };
  const sources = { ...recLLM.sources, ...m.sources };
  const confidence: Record<string, string> = { ...recLLM.confidence, ...m.confidence };

  const built = buildStandardized(tpl, values, sources, currency, m.traces);
  const data = built.data as { sections: { rows: Record<string, unknown>[] }[]; flags: unknown[]; meta?: Record<string, unknown>; breakdowns?: unknown };
  for (const sec of data.sections) for (const row of sec.rows) { const c = confidence[row.id as string]; if (c) row.confidence = c; }

  const flags: Flag[] = [...(data.flags as Flag[] ?? [])];
  if (inp.skipped.length) {
    const byReason = new Map<string, string[]>();
    for (const d of inp.skipped) byReason.set(d.reason, [...(byReason.get(d.reason) ?? []), d.name]);
    flags.push({ id: "_skipped", severity: "warn", label: `Fichiers non lus (${inp.skipped.length}) — ${[...byReason.entries()].map(([r, ns]) => `${r} : ${ns.join(", ")}`).join(" · ")}.` });
  }
  flags.push({ id: "_fx", severity: "info", label: `Devises converties vers ${currency} (taux ${inp.fxSource}).` });
  const uniq = (xs: string[]) => xs.filter((x, i, a) => a.indexOf(x) === i).join(", ") || "—";
  const byRole = (role: string) => uniq(m.kept.filter((e) => m.effRoleOf(e) === role && role !== "revenue").map((e) => e.parser));
  flags.push({ id: "_classif", severity: "info", label: `Documents classés — CA : ${uniq(m.revenueDocs.map((e) => `${e.file}`))} · Banque : ${byRole("bank")} · Charges : ${byRole("expense")}.` });
  if (!m.revenueDocs.length) flags.push({ id: "_no_revenue", severity: "warn", label: "Aucune source de CA (rôle « CA ») — dépose l'export Shopify « Total sales over time » ou classe un document en « CA »." });
  flags.push(...m.flags, ...(recLLM.conflicts as Flag[]));

  // Tri des absences (doctrine) : seuls les vrais « bugs » bloquent.
  const gaps = lines.filter((l) => l.core && values[l.id] == null).map((l) => { const g = classifyGap(l.id); return { concept: l.id, label: l.label, statut: g.statut, ask: g.ask ?? null }; });
  const errorIssues = flags.filter((f) => f.severity === "error").map((f) => f.label);
  const blocking = [...gaps.filter((g) => g.statut === "missing_bug").map((g) => `Champ clé introuvable : ${g.label}${g.ask ? ` — ${g.ask}` : ""}`), ...errorIssues];
  if (blocking.length) flags.push({ id: "_invalid", severity: "error", label: `Bloquant (à corriger) : ${blocking.join(" · ")}.` });
  const paramGaps = gaps.filter((g) => g.statut === "missing_param");
  if (paramGaps.length) flags.push({ id: "_param_needed", severity: "warn", label: `À paramétrer (onboarding) : ${paramGaps.map((g) => g.label).join(", ")}. Le dashboard s'affiche en partiel en attendant.` });
  const askGaps = gaps.filter((g) => g.statut === "missing_obtainable");
  if (askGaps.length) flags.push({ id: "_ask_client", severity: "warn", label: `À fournir : ${askGaps.map((g) => `${g.label}${g.ask ? ` (${g.ask})` : ""}`).join(" · ")}.` });

  const breakdowns = m.breakdowns;
  if (Object.keys(breakdowns).length) data.breakdowns = breakdowns;
  const expected = inp.expectedBreakdowns ?? EXPECTED_BREAKDOWNS[inp.activity] ?? [];
  const completeness = expected.length ? { expected: expected.map((e) => e.key), present: expected.filter((e) => breakdowns[e.key]).map((e) => e.key), missing: expected.filter((e) => !breakdowns[e.key]).map((e) => e.key) } : undefined;
  if (completeness?.missing.length) flags.push({ id: "_completeness", severity: "info", label: `Vues sectorielles manquantes ce mois : ${expected.filter((e) => !breakdowns[e.key]).map((e) => e.label).join(", ")}.` });
  data.flags = flags;
  data.meta = { ...(data.meta ?? {}), fx: { reporting: currency, source: inp.fxSource, factor: inp.factor },
    classification: m.kept.map((e) => ({ parser: e.parser, file: e.file, role: e.role, effRole: m.effRoleOf(e), revenueCandidate: e.revenueCandidate ?? null, note: e.note })),
    sources_count: m.kept.length + inp.llmExtracts.length, period: inp.period, currency, entity: inp.entity, gaps,
    validation: { ok: blocking.length === 0, blocking }, ...(completeness ? { completeness } : {}) };

  const missing = gaps.map((g) =>
    g.statut === "missing_param" ? `${g.label} — à paramétrer${g.ask ? ` : ${g.ask}` : ""}`
    : g.statut === "missing_obtainable" ? `${g.label} — à fournir${g.ask ? ` : ${g.ask}` : ""}`
    : g.statut === "needs_history" ? `${g.label} — nécessite de l'historique`
    : g.statut === "derived" ? `${g.label} — non calculé (dépend d'un input manquant)`
    : `${g.label} — introuvable dans les fichiers${g.ask ? ` : ${g.ask}` : ""}`);
  missing.push(...m.questions);
  return { data: data as Record<string, unknown>, missing, blocking };
}
