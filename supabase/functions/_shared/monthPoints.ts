// LES 3 POINTS DU MOIS (livrable central de la doctrine) — sélection DÉTERMINISTE par règles.
// Ordre de raisonnement contraint : (1) le shop gagne-t-il et où ? (2) l'acquisition est-elle rentable ?
// puis (3) le point le plus important parmi : trésorerie (survie), dérive la plus coûteuse, croissance.
// Jamais la croissance avant (1) et (2). Chaque point = un FAIT chiffré (tutoiement, langage e-commerce) ;
// l'IA peut le reformuler mais ne produit aucun chiffre (garde-fou côté appelant).

import type { Bridge } from "./marginBridge.ts";

export type PointKey = "gagne" | "acquisition" | "tresorerie" | "derive" | "croissance";
export interface MonthPoint { key: PointKey; tone: "good" | "warn" | "info"; text: string }

type V = Record<string, number | undefined>;
const LEVEL_FR = { cm1: "marge produit (CM1)", cm2: "marge après opérations (CM2)", cm3: "marge après pub (CM3)" } as const;

export function selectMonthPoints(v: V, bridge: Bridge | null, currency = "EUR", baseLabel?: string,
  forecast?: { start: { balance: number }; low: { date: string; balance: number }; below_zero?: string } | null): MonthPoint[] {
  const eur = (x: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(x);
  const pct = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
  const xx = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}×`;
  const signed = (x: number) => `${x >= 0 ? "+" : "−"}${eur(Math.abs(x))}`;
  const n = (k: string) => (typeof v[k] === "number" && isFinite(v[k]!) ? v[k]! : null);
  const out: MonthPoint[] = [];

  // (1) Le shop gagne-t-il de l'argent, et pourquoi ça a bougé ?
  const lvl = n("cm3") != null ? "cm3" : n("cm2") != null ? "cm2" : n("cm1") != null ? "cm1" : null;
  if (lvl) {
    const m = n(lvl)!, rate = n(`${lvl}_rate`);
    const top = bridge && bridge.level === lvl ? bridge.effects.find((e) => Math.abs(e.value) >= 1) : undefined;
    const why = bridge && bridge.level === lvl && Math.abs(bridge.delta) >= 1
      ? ` ${bridge.delta >= 0 ? "En hausse" : "En baisse"} de ${eur(Math.abs(bridge.delta))} vs ${baseLabel ?? bridge.base}${top ? `, d'abord à cause de : ${top.label.toLowerCase()} (${signed(top.value)})` : ""}.`
      : "";
    const caveat = lvl === "cm1" ? " Logistique inconnue : on ne sait pas encore ce que le shop gagne vraiment." : lvl === "cm2" ? " Pub inconnue : ce n'est pas encore la marge finale." : "";
    out.push({ key: "gagne", tone: m < 0 || (rate != null && lvl === "cm3" && rate < 10) ? "warn" : lvl === "cm3" ? "good" : "info",
      text: `Ton shop dégage ${eur(m)} de ${LEVEL_FR[lvl]}${rate != null ? ` (${pct(rate)} du CA)` : ""}.${why}${caveat}` });
  }

  // (2) L'acquisition est-elle rentable ? MER face au point mort du shop (1 / CM2), jamais une norme externe.
  const mer = n("mer") ?? (n("ca") != null && n("ads_total") ? n("ca")! / n("ads_total")! : null);
  const be = n("breakeven_roas");
  if (mer != null && be != null) {
    const head = (mer / be - 1) * 100;
    out.push({ key: "acquisition", tone: head < 0 ? "warn" : head < 30 ? "info" : "good",
      text: head < 0
        ? `Ta pub est SOUS le point mort : ${xx(mer)} de CA par euro investi, alors qu'il faut ${xx(be)} pour couvrir tes coûts (1/CM2). Chaque euro de pub en plus te coûte de l'argent.`
        : `Ta pub rapporte ${xx(mer)} de CA par euro investi (MER), pour un point mort à ${xx(be)} (1/CM2) : marge de sécurité de ${pct(head)}${head < 30 ? ", trop juste pour accélérer sereinement" : ""}.` });
  }

  // (3) Le point le plus important parmi : trésorerie > dérive la plus coûteuse > croissance.
  const cashVar = n("cash_variation") ?? (n("cash_end") != null && n("cash_start") != null ? n("cash_end")! - n("cash_start")! : null);
  const cashEnd = n("cash_end");
  const drift = bridge?.effects.filter((e) => e.value < 0 && e.key !== "volume" && !(out[0]?.text.includes(e.label.toLowerCase()))).sort((a, b) => a.value - b.value)[0];
  const dfr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  if (forecast && (forecast.below_zero || forecast.low.balance < forecast.start.balance * 0.5)) {
    // Double lecture « je tiens ? » : le POINT BAS à 13 semaines prime (projection à rythme constant).
    out.push({ key: "tresorerie", tone: "warn",
      text: forecast.below_zero
        ? `À rythme constant, ta trésorerie passe sous zéro le ${dfr(forecast.below_zero)} (point bas ${eur(forecast.low.balance)} le ${dfr(forecast.low.date)}, sur 13 semaines).`
        : `À rythme constant, ta trésorerie descend à ${eur(forecast.low.balance)} le ${dfr(forecast.low.date)} (point bas sur 13 semaines, contre ${eur(forecast.start.balance)} aujourd'hui).` });
  } else if (cashVar != null && cashEnd != null && cashVar < 0 && (cashEnd <= 0 || -cashVar > Math.abs(cashEnd) * 0.1)) {
    const months = cashEnd > 0 ? Math.floor(cashEnd / -cashVar) : 0;
    out.push({ key: "tresorerie", tone: "warn",
      text: `Ta trésorerie a baissé de ${eur(-cashVar)} ce mois (${eur(cashEnd)} en fin de mois)${cashEnd > 0 ? ` : à ce rythme, environ ${months} mois devant toi` : ""}.` });
  } else if (drift && Math.abs(drift.value) >= Math.max(500, Math.abs(n("ca") ?? 0) * 0.005)) {
    out.push({ key: "derive", tone: "warn", text: `À regarder : ${drift.label.toLowerCase()} te coûte ${eur(-drift.value)} de marge vs ${baseLabel ?? bridge!.base}.` });
  } else if (bridge) {
    const vol = bridge.effects.find((e) => e.key === "volume");
    if (vol && Math.abs(vol.value) >= 1) out.push({ key: "croissance", tone: vol.value >= 0 ? "good" : "info",
      text: `Croissance : l'effet volume pèse ${signed(vol.value)} de marge vs ${baseLabel ?? bridge.base}.` });
  }
  return out.slice(0, 3);
}

// Garde-fou « l'IA rédige, ne chiffre pas » : tout nombre du texte réécrit doit exister dans les faits.
export function numbersPreserved(facts: string, rewritten: string): boolean {
  const nums = (s: string) => (s.replace(/[\s  ]/g, "").match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(",", "."));
  const allowed = new Set(nums(facts));
  return nums(rewritten).every((x) => allowed.has(x) || /^[123]$/.test(x)); // « 1/CM2 », numéros de points
}
