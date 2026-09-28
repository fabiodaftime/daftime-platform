// LEVIERS DE DÉCALAGE DE PAIEMENT (« je tiens ? » — l'argent que le shop avance chaque mois). Module PUR.
// FAIT : montants payés dans le mois par poste (relevé bancaire classé par contrepartie).
// HYPOTHÈSE : gain de trésorerie si le poste obtient 30 jours de délai de plus (une fois, puis le décalage se
// maintient) — il dépend d'une négociation (facturation mensuelle Meta, délai fournisseur, 3PL mensuel).
// Scénario : la projection à 13 semaines avec ces délais obtenus (le flux décalé ne sort pas pendant 30 jours).

import type { CashForecast } from "./cashForecast.ts";

// Clés par défaut (sans carte des flux) ; avec une carte publiée : « carte_<n> », un levier par poste de la carte.
export type LeverKey = "ads_paypal" | "stock" | "logistics" | `carte_${number}`;
export interface LeverItem { key: LeverKey; label: string; monthly: number; count: number; how: string; lever: string }
export interface PaymentLevers {
  period: string;
  items: LeverItem[];
  total: number;                                   // gain une fois si tous les délais sont obtenus (30 j)
  scenario?: { weeks: { week_start: string; balance: number }[]; low: { date: string; balance: number }; below_zero?: string };
  hypothesis: string;
}
export interface ClassifiedDebit { tx_date: string; amount: number; cat: string; platform?: string; counterparty?: string | null; label?: string | null }
/** Définition d'un levier : quels débits il couvre, comment ils sont payés aujourd'hui, quel délai négocier. */
export interface LeverDef { key: LeverKey; label: string; test: (d: ClassifiedDebit) => boolean; how: (n: number) => string; lever: string }

const r0 = (x: number) => Math.round(x);
const LEVER_DAYS = 30;

// excludeCounterparties : sorties ponctuelles à confirmer (ex. virement exceptionnel classé « logistique ») — pas un flux récurrent.
// defs : leviers décrits par la carte des flux (flowRules.leverDefsFromMap) ; à défaut, les 3 postes par défaut.
export function paymentLevers(debits: ClassifiedDebit[], period: string, excludeCounterparties: string[] = [], defs?: LeverDef[] | null): PaymentLevers | null {
  const ym = period.slice(0, 7);
  const ex = new Set(excludeCounterparties.map((x) => x.toLowerCase().trim()));
  const month = debits.filter((d) => d.tx_date.slice(0, 7) === ym && d.amount < 0 && !ex.has(String(d.counterparty ?? "").toLowerCase().trim()));
  const viaPaypal = (d: ClassifiedDebit) => d.cat === "ads" && /paypal/i.test(`${d.platform ?? ""} ${d.counterparty ?? ""}`);
  const list: LeverDef[] = defs?.length ? defs : [
    { key: "ads_paypal", label: "Pub Meta / TikTok (via PayPal)", test: viaPaypal, how: (n) => `prélevée au fil de la dépense (${n} prélèvements)`, lever: "facturation mensuelle de la régie (paiement à 30 jours)" },
    { key: "stock", label: "Stock (fournisseurs)", test: (d) => d.cat === "stock", how: (n) => `payé avant réception (${n} virements)`, lever: "paiement à 30 jours après livraison, ou acompte réduit" },
    { key: "logistics", label: "Logistique (3PL)", test: (d) => d.cat === "logistics", how: (n) => `${n} prélèvement${n > 1 ? "s" : ""} dans le mois`, lever: "facture mensuelle payée à 30 jours" },
  ];
  // Chaque débit compte pour UN levier (le premier qui le couvre) : pas de double comptage.
  const acc = list.map(() => ({ total: 0, n: 0 }));
  for (const d of month) { const i = list.findIndex((l) => l.test(d)); if (i >= 0) { acc[i].total -= d.amount; acc[i].n++; } }
  const items: LeverItem[] = [];
  list.forEach((l, i) => { if (acc[i].total >= 1000) items.push({ key: l.key, label: l.label, monthly: r0(acc[i].total), count: acc[i].n, how: l.how(acc[i].n), lever: l.lever }); });
  if (!items.length) return null;
  const total = items.reduce((s, i) => s + i.monthly, 0);
  return { period, items: items.sort((a, b) => b.monthly - a.monthly), total,
    hypothesis: `Hypothèse : chaque poste obtient ${LEVER_DAYS} jours de délai de plus. Le gain arrive une fois (le mois où le délai démarre), puis le décalage se maintient tant que l'activité ne baisse pas.` };
}

// Scénario sur la projection : le flux décalé ne sort pas pendant 30 jours → gain qui monte linéairement
// jusqu'au montant mensuel, puis reste acquis. Appliqué au scénario « au rythme actuel ».
export function leverScenario(f: CashForecast, total: number): PaymentLevers["scenario"] {
  const d0 = Date.parse(`${f.start.date}T00:00:00Z`);
  let low = { date: f.start.date, balance: f.start.balance }; let below: string | undefined;
  const weeks = f.weeks.map((w, i) => {
    const endDay = Math.min((i + 1) * 7, 91);
    const bal = r0(w.balance + total * Math.min(endDay, LEVER_DAYS) / LEVER_DAYS);
    const date = new Date(d0 + endDay * 86400000).toISOString().slice(0, 10);
    if (bal < low.balance) low = { date, balance: bal };
    if (bal < 0 && !below) below = date;
    return { week_start: w.week_start, balance: bal };
  });
  return { weeks, low, ...(below ? { below_zero: below } : {}) };
}
