// TRÉSORERIE À 13 SEMAINES (doctrine : « je tiens ? » — le POINT BAS et sa date). Module PUR.
// À partir des transactions bancaires BRUTES du registre (flux au jour) :
//  - NEUTRALISÉS : virements entre comptes du dossier (montant opposé sur un autre compte à ±3 j) et flux
//    exclus par règle (« interne », interco) — ils ne font ni entrer ni sortir d'argent du groupe ;
//  - ÉCHÉANCES FIXES : contrepartie payée 1 à 3 fois par mois, présente ≥ 2 des 3 derniers mois
//    (emprunt, salaires, 3PL, logiciels, carte…) → replanifiée aux mêmes jours du mois, montant médian ;
//  - SORTIES PONCTUELLES : contrepartie nouvelle, 1 ou 2 débits, poids notable → NON reconduite chaque semaine
//    (un virement exceptionnel de 33 k€ n'est pas une dépense hebdomadaire) — listée dans « oneoffs » ;
//  - FLUX CONTINUS : tout le reste (pub, PSP, stock, remboursements) → rythme hebdomadaire des 8 dernières semaines ;
//  - ENCAISSEMENTS : rythme hebdomadaire des 8 dernières semaines (PSP, virements clients).
// Scénario « PLAN » optionnel : encaissements ET dépenses variables suivent le CA prévu (facteur par mois) —
// les échéances fixes ne bougent pas. C'est une PROJECTION (hypothèse), pas une prévision : dit dans « hypotheses ».

export interface Tx { tx_date: string; amount: number; counterparty?: string | null; label?: string | null; account?: string | null }
export interface Scheduled { counterparty: string; days: number[]; amount: number }
export interface CashScenario {
  label: string;
  weeks: { week_start: string; balance: number }[];
  low: { date: string; balance: number };
  below_zero?: string;
}
export interface CashForecast {
  start: { date: string; balance: number };
  weeks: { week_start: string; inflow: number; outflow: number; balance: number }[];
  low: { date: string; balance: number };
  below_zero?: string;               // première date sous zéro, si elle existe
  run_rate: { inflow_week: number; outflow_week: number };
  scheduled: Scheduled[];
  oneoffs?: { counterparty: string; amount: number }[];   // sorties ponctuelles non reconduites
  neutralized?: number;                                   // virements internes / interco écartés (fenêtre)
  plan?: CashScenario;                                    // scénario « selon ton plan »
  hypotheses: string[];
}
export interface ForecastOpts {
  horizonDays?: number; lookbackWeeks?: number;
  exclude?: (t: Tx) => boolean;                           // flux à neutraliser (règle « interne », interco)
  plan?: { label: string; factor: (ym: string) => number }; // facteur de CA par mois vs rythme récent
}

const r0 = (x: number) => Math.round(x);
const fr = (x: number) => r0(x).toLocaleString("fr-FR");
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dayDiff = (a: string, b: string) => Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000;
const key = (t: Tx) => (t.counterparty || t.label || "?").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 40);

// Virements entre deux comptes du dossier : débit sur A, crédit du même montant sur B (≠ A) à ±3 jours.
export function internalPairs(txs: Tx[]): Set<Tx> {
  const paired = new Set<Tx>();
  const byAmt = new Map<number, Tx[]>();
  for (const t of txs) if (t.account) { const k = Math.round(Math.abs(t.amount) * 100); (byAmt.get(k) ?? byAmt.set(k, []).get(k)!).push(t); }
  for (const group of byAmt.values()) {
    if (group.length < 2) continue;
    for (const out of group) {
      if (out.amount >= 0 || paired.has(out)) continue;
      const inn = group.find((u) => u.amount > 0 && !paired.has(u) && u.account !== out.account && dayDiff(u.tx_date, out.tx_date) <= 3);
      if (inn) { paired.add(out); paired.add(inn); }
    }
  }
  return paired;
}

export function forecastCash(txsAll: Tx[], asOf: string, startBalance: number, opts: ForecastOpts = {}): CashForecast | null {
  const horizon = opts.horizonDays ?? 91, lb = opts.lookbackWeeks ?? 8;
  const from = addDays(asOf, -lb * 7 + 1), from3m = addDays(asOf, -90);
  if (!txsAll.some((t) => t.tx_date >= addDays(asOf, -7) && t.tx_date <= asOf)) return null; // relevé qui ne couvre pas la fin de période

  // 0) Neutralisations (virements internes appariés + règles).
  const pairs = internalPairs(txsAll.filter((t) => t.tx_date >= from3m && t.tx_date <= asOf));
  const isNeutral = (t: Tx) => pairs.has(t) || !!opts.exclude?.(t);
  const neutralized = txsAll.filter((t) => t.tx_date >= from && t.tx_date <= asOf && t.amount < 0 && isNeutral(t)).reduce((s, t) => s - t.amount, 0);
  const txs = txsAll.filter((t) => !isNeutral(t));
  const recent = txs.filter((t) => t.tx_date >= from3m && t.tx_date <= asOf);
  if (!recent.length) return null;

  // 1) Échéances fixes : par contrepartie, occurrences par mois sur les 3 derniers mois.
  const months = [0, 1, 2].map((i) => { const d = new Date(`${asOf}T00:00:00Z`); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); return d.toISOString().slice(0, 7); });
  const byCp = new Map<string, Tx[]>();
  for (const t of recent) if (t.amount < 0) (byCp.get(key(t)) ?? byCp.set(key(t), []).get(key(t))!).push(t);
  const scheduled: Scheduled[] = []; const schedKeys = new Set<string>();
  for (const [k, ts] of byCp) {
    const perMonth = months.map((m) => ts.filter((t) => t.tx_date.slice(0, 7) === m));
    const present = perMonth.filter((x) => x.length > 0);
    if (present.length < 2 || present.some((x) => x.length > 3)) continue;
    const last = perMonth.find((x) => x.length) ?? [];
    const days = [...new Set(last.map((t) => Number(t.tx_date.slice(8, 10))))].sort((a, b) => a - b);
    const amount = median(present.map((x) => -x.reduce((s, t) => s + t.amount, 0))) / Math.max(1, days.length);
    scheduled.push({ counterparty: ts[0].counterparty || k, days, amount: r0(amount) }); schedKeys.add(k);
  }

  // 2) Rythmes hebdomadaires (8 dernières semaines), hors échéances fixes et hors sorties ponctuelles.
  const win = txs.filter((t) => t.tx_date >= from && t.tx_date <= asOf);
  const winOut = -win.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0) || 1;
  const oneoffs: { counterparty: string; amount: number }[] = []; const oneKeys = new Set<string>();
  const winByCp = new Map<string, Tx[]>();
  for (const t of win) if (t.amount < 0 && !schedKeys.has(key(t))) (winByCp.get(key(t)) ?? winByCp.set(key(t), []).get(key(t))!).push(t);
  for (const [k, ts] of winByCp) {
    const tot = -ts.reduce((s, t) => s + t.amount, 0);
    const seenBefore = recent.some((t) => t.tx_date < from && t.amount < 0 && key(t) === k);
    if (ts.length <= 2 && !seenBefore && tot >= Math.max(1000, 0.02 * winOut)) { oneoffs.push({ counterparty: ts[0].counterparty || k, amount: r0(tot) }); oneKeys.add(k); }
  }
  const inflowWeek = win.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0) / lb;
  const outflowWeek = -win.filter((t) => t.amount < 0 && !schedKeys.has(key(t)) && !oneKeys.has(key(t))).reduce((s, t) => s + t.amount, 0) / lb;

  // 3) Projection au jour, agrégée par semaine ; point bas au jour. Scénario plan en parallèle.
  const run = (factor: (ym: string) => number) => {
    let bal = startBalance, low = { date: asOf, balance: startBalance }; let belowZero: string | undefined;
    const weeks: CashForecast["weeks"] = [];
    let wIn = 0, wOut = 0, wStart = addDays(asOf, 1);
    for (let i = 1; i <= horizon; i++) {
      const day = addDays(asOf, i), dom = Number(day.slice(8, 10)), k = factor(day.slice(0, 7));
      const last = new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)), 0)).getUTCDate();
      const fixed = scheduled.reduce((s, x) => s + (x.days.some((d) => Math.min(d, last) === dom) ? x.amount : 0), 0);
      const inD = k * inflowWeek / 7, outD = k * outflowWeek / 7 + fixed;
      bal += inD - outD; wIn += inD; wOut += outD;
      if (bal < low.balance) low = { date: day, balance: bal };
      if (bal < 0 && !belowZero) belowZero = day;
      if (i % 7 === 0 || i === horizon) { weeks.push({ week_start: wStart, inflow: r0(wIn), outflow: r0(wOut), balance: r0(bal) }); wIn = 0; wOut = 0; wStart = addDays(day, 1); }
    }
    return { weeks, low: { date: low.date, balance: r0(low.balance) }, ...(belowZero ? { below_zero: belowZero } : {}) };
  };
  const base = run(() => 1);
  const plan = opts.plan ? run(opts.plan.factor) : null;
  const oneTot = oneoffs.reduce((s, o) => s + o.amount, 0);
  return {
    start: { date: asOf, balance: r0(startBalance) }, ...base,
    run_rate: { inflow_week: r0(inflowWeek), outflow_week: r0(outflowWeek) }, scheduled: scheduled.sort((a, b) => b.amount * b.days.length - a.amount * a.days.length),
    ...(oneoffs.length ? { oneoffs: oneoffs.sort((a, b) => b.amount - a.amount) } : {}),
    ...(neutralized > 0 ? { neutralized: r0(neutralized) } : {}),
    ...(plan ? { plan: { label: opts.plan!.label, weeks: plan.weeks.map((w) => ({ week_start: w.week_start, balance: w.balance })), low: plan.low, ...(plan.below_zero ? { below_zero: plan.below_zero } : {}) } } : {}),
    hypotheses: [
      `Encaissements au rythme des ${lb} dernières semaines (${fr(inflowWeek)} par semaine), sans saisonnalité.`,
      `Dépenses variables (pub, stock, remboursements…) au rythme des ${lb} dernières semaines (${fr(outflowWeek)} par semaine).`,
      `${scheduled.length} échéance(s) fixe(s) replanifiée(s) aux mêmes jours du mois (emprunt, salaires, prestataires, abonnements…).`,
      ...(oneoffs.length ? [`Sorties ponctuelles non reconduites (${fr(oneTot)}) : ${oneoffs.slice(0, 4).map((o) => `${o.counterparty} ${fr(o.amount)}`).join(", ")} — à confirmer.`] : []),
      ...(neutralized > 0 ? [`Virements entre tes comptes / interco neutralisés (${fr(neutralized)} sur la période) : l'argent reste dans le groupe.`] : []),
      ...(opts.plan ? [`Scénario « ${opts.plan.label} » : encaissements et dépenses variables suivent le CA prévu ; charges fixes inchangées.`] : []),
      "Non anticipé : gros achat de stock ponctuel à venir, levée, décalage de TVA — à ajuster par le conseiller.",
    ],
  };
}
