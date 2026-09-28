// CARTE DES FLUX → RÈGLES DU MOTEUR. Module PUR (partagé edge / tests).
// La carte publiée (relue et validée par le conseiller) n'est pas un document décoratif : elle fixe
//  1) le PÉRIMÈTRE DE TRÉSORERIE : un compte marqué « hors trésorerie » (ex. compte perso qui paie des dépenses
//     du shop) garde ses dépenses dans le résultat, mais ni son solde ni ses flux ne comptent dans la trésorerie
//     du shop (solde de fin, contrôle, projection 13 semaines, leviers) ;
//  2) des RÈGLES BANCAIRES (sorties qui portent un mot-clé du relevé `match`) — après les décisions explicites
//     du conseiller, avant le playbook et le dictionnaire global ;
//  3) les ÉCARTS carte ↔ classement (un coût mal classé fausse la cascade) ;
//  4) les LEVIERS DE DÉCALAGE : un levier par poste pub / stock / logistique payé depuis la trésorerie, décrit avec
//     le rythme et les conditions dits en call.
import type { FlowMap, FlowOut, OutCategory } from "./flowMap.ts";
import type { LeverDef } from "./paymentLevers.ts";

/** Catégorie de la carte → catégorie du moteur (classifyDebit). */
export const ENGINE_CAT: Record<OutCategory, string> = {
  pub: "ads", stock: "stock", logistique: "logistics", "équipe": "payroll", "impôts & taxes": "tax",
  financement: "loan", outils: "tools", interne: "internal", autre: "other",
};
// Classements compatibles avec la carte (pas d'écart) — ex. la TVA reversée est un « impôt & taxe » de la carte.
const COMPATIBLE: Record<OutCategory, string[]> = {
  pub: ["ads"], stock: ["stock"], logistique: ["logistics"], "équipe": ["payroll", "social"], "impôts & taxes": ["tax", "vat"],
  financement: ["loan"], outils: ["tools"], interne: ["internal", "ignore"], autre: ["other", "bankfees", "fx"],
};

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const has = (text: string, key: string) => !!key && ` ${text} `.includes(` ${key} `);

// ── 1) Périmètre de trésorerie ────────────────────────────────────────────────────────────────────────────
export interface TreasuryPerimeter { out: string[]; in: string[] } // noms de comptes normalisés (sérialisable → empreinte)
export function treasuryPerimeter(map: FlowMap | null | undefined): TreasuryPerimeter | undefined {
  if (!map?.accounts?.length) return undefined;
  const out = map.accounts.filter((a) => !a.in_treasury).map((a) => norm(a.name)).filter(Boolean);
  return out.length ? { out, in: map.accounts.filter((a) => a.in_treasury).map((a) => norm(a.name)).filter(Boolean) } : undefined;
}
/** Compte du relevé explicitement hors trésorerie selon la carte. Un compte que la carte ne cite pas reste DEDANS. */
export function isOutOfTreasury(account: string | null | undefined, p: TreasuryPerimeter | undefined): boolean {
  if (!p || !account) return false;
  const n = norm(account);
  if (!n || p.in.includes(n)) return false;
  return p.out.some((m) => m === n || (m.length >= 6 && n.length >= 6 && (n.includes(m) || m.includes(n))));
}

// ── 2) Règles bancaires issues de la carte ───────────────────────────────────────────────────────────────
export interface MapRule { match: string; category: string; amount?: number; label: string; source: "carte" }
export function rulesFromMap(map: FlowMap | null | undefined): MapRule[] {
  return (map?.outflows ?? []).filter((o) => o.match && norm(o.match).length >= 3).map((o) => ({
    // « Impôts & taxes » qui est de la TVA (ex. « DGFIP (TVA) ») → reversement de TVA, pas un impôt du résultat.
    match: o.match!.toLowerCase().replace(/\s+/g, " ").trim(),
    category: o.category === "impôts & taxes" && /\btva\b|\bvat\b/i.test(`${o.payee} ${o.note ?? ""}`) ? "vat" : ENGINE_CAT[o.category],
    ...(typeof o.amount === "number" && o.amount > 0 ? { amount: o.amount } : {}), label: `${o.payee} (carte des flux)`, source: "carte" as const,
  }));
}

// ── Rattachement d'un débit à une sortie de la carte ─────────────────────────────────────────────────────
const STOP = new Set(["sarl", "sas", "sasu", "group", "groupe", "france", "paiement", "payment", "abonnement", "abonnements", "services", "service",
  "autres", "fees", "frais", "prelevement", "virement", "compte", "business", "trading", "fzco", "limited", "outils", "freelances", "consultants",
  "pour", "avec", "carte", "remuneration", "dirigeants", "management", "emballages", "bancaires"]);
function keysOf(o: FlowOut): string[] {
  if (o.match) return [norm(o.match)];
  const ks = o.via ? [norm(o.via)] : [];
  for (const t of norm(o.payee.replace(/\([^)]*\)/g, " ")).split(" ")) if (t.length >= 4 && !STOP.has(t)) ks.push(t);
  return [...new Set(ks)].filter(Boolean);
}
export interface MapDebit { amount: number; cat: string; text: string } // text = libellé + contrepartie
/** Sorties de la carte qui correspondent au débit ; la première compatible avec son classement si elle existe. */
export function attribute(map: FlowMap, d: MapDebit): { out: FlowOut; compatible: boolean } | null {
  const t = norm(d.text);
  const cands = map.outflows.filter((o) => keysOf(o).some((k) => has(t, k)));
  if (!cands.length) return null;
  const ok = cands.find((o) => COMPATIBLE[o.category].includes(d.cat));
  return ok ? { out: ok, compatible: true } : { out: cands[0], compatible: false };
}

// ── 3) Écarts carte ↔ classement ────────────────────────────────────────────────────────────────────────
export interface MapGap { payee: string; expected: OutCategory; found: string; amount: number; count: number }
export function mapDiscrepancies(map: FlowMap | null | undefined, debits: MapDebit[], minAmount = 1000): MapGap[] {
  if (!map?.outflows?.length) return [];
  const g = new Map<string, MapGap>();
  for (const d of debits) {
    if (d.amount >= 0 || d.cat === "refund" || d.cat === "fx") continue;
    const a = attribute(map, d);
    if (!a || a.compatible) continue;
    const k = `${a.out.payee}§${d.cat}`;
    const x = g.get(k) ?? { payee: a.out.payee, expected: a.out.category, found: d.cat, amount: 0, count: 0 };
    x.amount += -d.amount; x.count++; g.set(k, x);
  }
  return [...g.values()].filter((x) => x.amount >= minAmount).map((x) => ({ ...x, amount: Math.round(x.amount) })).sort((a, b) => b.amount - a.amount);
}

// ── 4) Leviers de décalage décrits par la carte ─────────────────────────────────────────────────────────
const LEVER_TXT: Partial<Record<OutCategory, string>> = {
  pub: "facturation mensuelle de la régie (paiement à 30 jours)",
  stock: "paiement à 30 jours après livraison, ou acompte réduit",
  logistique: "facture mensuelle payée à 30 jours",
};
export function leverDefsFromMap(map: FlowMap | null | undefined): LeverDef[] | null {
  if (!map?.outflows?.length) return null;
  const inTreasury = (accId: string) => map.accounts.find((a) => a.id === accId)?.in_treasury ?? true;
  const outs = map.outflows.filter((o) => LEVER_TXT[o.category] && !/ponctuel/i.test(o.rhythm) && inTreasury(o.account));
  if (!outs.length) return null;
  return outs.map((o, i) => ({
    key: `carte_${i}`,
    label: o.via ? `${o.payee} (via ${o.via})` : o.payee,
    test: (d) => d.cat === ENGINE_CAT[o.category] && attribute(map, { amount: d.amount, cat: d.cat, text: `${d.label ?? ""} ${d.counterparty ?? ""}` })?.out === o,
    how: (n) => `${o.rhythm}${o.terms && !/^inconnu/i.test(o.terms) ? ` · ${o.terms}` : ""} — ${n} paiement${n > 1 ? "s" : ""} ce mois`,
    lever: LEVER_TXT[o.category]!,
  }));
}
