// TRÉSORERIE À 13 SEMAINES (doctrine : « je tiens ? » — le POINT BAS et sa date). Module PUR.
// À partir des transactions bancaires BRUTES du registre (flux au jour) :
//  - ÉCHÉANCES FIXES : contrepartie payée 1 à 3 fois par mois, présente ≥ 2 des 3 derniers mois
//    (emprunt, salaires, 3PL, logiciels, carte…) → replanifiée aux mêmes jours du mois, montant médian ;
//  - FLUX CONTINUS : tout le reste (pub, PSP, stock, remboursements) → rythme hebdomadaire des 8 dernières semaines ;
//  - ENCAISSEMENTS : rythme hebdomadaire des 8 dernières semaines (PSP, virements clients).
// C'est une PROJECTION à rythme constant (hypothèse), pas une prévision : saisonnalité, gros achats de
// stock ou levée ne sont pas anticipés — dit explicitement dans « hypotheses ».

export interface Tx { tx_date: string; amount: number; counterparty?: string | null; label?: string | null }
export interface Scheduled { counterparty: string; days: number[]; amount: number }
export interface CashForecast {
  start: { date: string; balance: number };
  weeks: { week_start: string; inflow: number; outflow: number; balance: number }[];
  low: { date: string; balance: number };
  below_zero?: string;               // première date sous zéro, si elle existe
  run_rate: { inflow_week: number; outflow_week: number };
  scheduled: Scheduled[];
  hypotheses: string[];
}

const r0 = (x: number) => Math.round(x);
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const key = (t: Tx) => (t.counterparty || t.label || "?").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 40);

export function forecastCash(txs: Tx[], asOf: string, startBalance: number, opts: { horizonDays?: number; lookbackWeeks?: number } = {}): CashForecast | null {
  const horizon = opts.horizonDays ?? 91, lb = opts.lookbackWeeks ?? 8;
  const from = addDays(asOf, -lb * 7 + 1), from3m = addDays(asOf, -90);
  const recent = txs.filter((t) => t.tx_date >= from3m && t.tx_date <= asOf);
  if (!recent.length || !recent.some((t) => t.tx_date >= addDays(asOf, -7))) return null; // relevé qui ne couvre pas la fin de période

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

  // 2) Rythmes hebdomadaires (8 dernières semaines), hors échéances fixes.
  const win = txs.filter((t) => t.tx_date >= from && t.tx_date <= asOf);
  const inflowWeek = win.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0) / lb;
  const outflowWeek = -win.filter((t) => t.amount < 0 && !schedKeys.has(key(t))).reduce((s, t) => s + t.amount, 0) / lb;

  // 3) Projection au jour, agrégée par semaine ; point bas au jour.
  let bal = startBalance, low = { date: asOf, balance: startBalance }; let belowZero: string | undefined;
  const weeks: CashForecast["weeks"] = [];
  let wIn = 0, wOut = 0, wStart = addDays(asOf, 1);
  for (let i = 1; i <= horizon; i++) {
    const day = addDays(asOf, i), dom = Number(day.slice(8, 10));
    const last = new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)), 0)).getUTCDate();
    const fixed = scheduled.reduce((s, x) => s + (x.days.some((d) => Math.min(d, last) === dom) ? x.amount : 0), 0);
    const inD = inflowWeek / 7, outD = outflowWeek / 7 + fixed;
    bal += inD - outD; wIn += inD; wOut += outD;
    if (bal < low.balance) low = { date: day, balance: bal };
    if (bal < 0 && !belowZero) belowZero = day;
    if (i % 7 === 0 || i === horizon) { weeks.push({ week_start: wStart, inflow: r0(wIn), outflow: r0(wOut), balance: r0(bal) }); wIn = 0; wOut = 0; wStart = addDays(day, 1); }
  }
  return {
    start: { date: asOf, balance: r0(startBalance) }, weeks, low: { date: low.date, balance: r0(low.balance) }, ...(belowZero ? { below_zero: belowZero } : {}),
    run_rate: { inflow_week: r0(inflowWeek), outflow_week: r0(outflowWeek) }, scheduled: scheduled.sort((a, b) => b.amount * b.days.length - a.amount * a.days.length),
    hypotheses: [
      `Encaissements au rythme des ${lb} dernières semaines (${r0(inflowWeek).toLocaleString("fr-FR")} par semaine), sans saisonnalité.`,
      `Dépenses variables (pub, stock, remboursements…) au rythme des ${lb} dernières semaines (${r0(outflowWeek).toLocaleString("fr-FR")} par semaine).`,
      `${scheduled.length} échéance(s) fixe(s) replanifiée(s) aux mêmes jours du mois (emprunt, salaires, prestataires, abonnements…).`,
      "Non anticipé : gros achat de stock ponctuel, saison, levée, décalage de TVA — à ajuster par le conseiller.",
    ],
  };
}
