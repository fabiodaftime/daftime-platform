// LES 3 POINTS DU MOIS (livrable central de la doctrine) — sélection DÉTERMINISTE par règles.
// Ordre de raisonnement contraint : (1) le shop gagne-t-il et où ? (2) l'acquisition est-elle rentable ?
// puis (3) LE point à regarder ce mois-ci. Jamais la croissance avant (1) et (2). Chaque point = un FAIT chiffré
// lu comme un analyste e-commerce (tutoiement) ; l'IA peut le reformuler mais ne produit aucun chiffre.
//  (2) distingue la rentabilité GLOBALE de la pub (MER : inclut le CA des clients qui reviennent) du coût d'un
//      NOUVEAU client (1re commande) et dit si le réachat le rembourse (cohortes 60 j) — pas d'alarme contradictoire.
//  (3) la trésorerie ne passe en tête que si la PROJECTION 13 semaines montre une tension ; sinon le signal le
//      plus coûteux en € (retours qui dérapent, canal qui perd, rupture d'un best-seller, dérive du pont d'écarts).

import type { Bridge } from "./marginBridge.ts";

export type PointKey = "gagne" | "acquisition" | "tresorerie" | "derive" | "croissance" | "retours" | "canal" | "stock";
export interface MonthPoint { key: PointKey; tone: "good" | "warn" | "info"; text: string }

type V = Record<string, number | undefined>;
type Row = { label: string; value: number; values?: Record<string, number> };
type Bk = Record<string, { label?: string; rows: Row[] }>;
export interface PointsExtra { prev?: V | null; breakdowns?: Bk | null }
const LEVEL_FR = { cm1: "marge produit", cm2: "marge après opérations", cm3: "marge après pub" } as const;

export function selectMonthPoints(v: V, bridge: Bridge | null, currency = "EUR", baseLabel?: string,
  forecast?: { start: { balance: number }; low: { date: string; balance: number }; below_zero?: string;
    plan?: { label: string; low: { date: string; balance: number }; below_zero?: string } } | null,
  extra: PointsExtra = {}): MonthPoint[] {
  const eur = (x: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(x);
  const pct = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
  const xx = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}×`;
  const dec2 = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const signed = (x: number) => `${x >= 0 ? "+" : "−"}${eur(Math.abs(x))}`;
  const n = (k: string) => (typeof v[k] === "number" && isFinite(v[k]!) ? v[k]! : null);
  const p = (k: string) => { const x = extra.prev?.[k]; return typeof x === "number" && isFinite(x) ? x : null; };
  const bk = extra.breakdowns ?? {};
  const dfr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  const out: MonthPoint[] = [];

  // (1) Le shop gagne-t-il de l'argent, et pourquoi ça a bougé ? Puis ce qu'il reste après les charges fixes.
  const lvl = n("cm3") != null ? "cm3" : n("cm2") != null ? "cm2" : n("cm1") != null ? "cm1" : null;
  if (lvl) {
    const m = n(lvl)!, rate = n(`${lvl}_rate`);
    const top = bridge && bridge.level === lvl ? bridge.effects.find((e) => Math.abs(e.value) >= 1) : undefined;
    const why = bridge && bridge.level === lvl && Math.abs(bridge.delta) >= 1
      ? ` ${bridge.delta >= 0 ? "En hausse" : "En baisse"} de ${eur(Math.abs(bridge.delta))} vs ${baseLabel ?? bridge.base}${top ? `, d'abord à cause de : ${top.label.toLowerCase()} (${signed(top.value)})` : ""}.`
      : "";
    const caveat = lvl === "cm1" ? " Logistique inconnue : on ne sait pas encore ce que le shop gagne vraiment." : lvl === "cm2" ? " Pub inconnue : ce n'est pas encore la marge finale." : "";
    const eb = n("ebitda");
    const after = lvl === "cm3" && eb != null
      ? (eb >= 0 ? ` Après tes charges fixes (${eur(m - eb)}), il te reste ${eur(eb)} de résultat d'exploitation.`
        : ` Mais tes charges fixes (${eur(m - eb)}) la dépassent : ton résultat d'exploitation est à ${eur(eb)}.`) : "";
    out.push({ key: "gagne", tone: m < 0 || (eb != null && eb < 0) || (rate != null && lvl === "cm3" && rate < 10) ? "warn" : lvl === "cm3" ? "good" : "info",
      text: `Ton shop dégage ${eur(m)} de ${LEVEL_FR[lvl]} (${lvl.toUpperCase()}${rate != null ? `, ${pct(rate)} du CA` : ""}).${why}${after}${caveat}` });
  }

  // (2) L'acquisition est-elle rentable ? Global (MER vs point mort 1/CM2) PUIS nouveau client (CM2 par commande
  // vs coût d'un nouveau client, remboursé ou non par le réachat à 60 jours).
  const mer = n("mer") ?? (n("ca") != null && n("ads_total") ? n("ca")! / n("ads_total")! : null);
  const be = n("breakeven_roas");
  const cpo = n("cm2_per_order"), cac = n("cac");
  const ratio = n("first_order_ratio") ?? (cpo != null && cac != null && cac > 0 ? cpo / cac : null);
  const cover = n("margin_60d_cac") ?? (n("orders_60d") != null && cpo != null && cac ? (n("orders_60d")! * cpo) / cac : null);
  const rep60 = n("repeat_60d");
  const pcac = p("cac");
  const cacMove = cac != null && pcac != null && pcac > 0 ? ((cac / pcac) - 1) * 100 : null;
  const cacTrend = cacMove != null && Math.abs(cacMove) >= 10 ? ` (${cacMove > 0 ? "+" : ""}${pct(cacMove)} vs le mois dernier)` : "";
  if (mer != null && be != null && mer < be) {
    out.push({ key: "acquisition", tone: "warn",
      text: `Ta pub est SOUS le point mort : ${xx(mer)} de CA par euro investi, alors qu'il faut ${xx(be)} pour couvrir tes coûts (1/CM2). Chaque euro de pub en plus te coûte de l'argent.` });
  } else if (ratio != null && cpo != null && cac != null) {
    const global = mer != null && be != null ? `Ta pub est rentable au global (MER ${xx(mer)} pour un point mort à ${xx(be)}), ` : "";
    if (ratio >= 1) {
      out.push({ key: "acquisition", tone: "good",
        text: `${global ? `${global}et chaque` : "Chaque"} nouveau client est rentable dès sa 1re commande : ${eur(cpo)} de CM2 par commande pour ${eur(cac)} de pub par nouveau client${cacTrend}.` });
    } else if (cover != null && cover >= 1) {
      out.push({ key: "acquisition", tone: cover < 1.2 || (cacMove != null && cacMove >= 15) ? "warn" : "info",
        text: `${global ? `${global}portée par tes clients qui reviennent. ` : ""}Un nouveau client te coûte ${eur(cac)} de pub${cacTrend} pour ${eur(cpo)} de marge sur sa 1re commande : il se rembourse en 60 jours grâce au réachat${rep60 != null ? ` (${pct(rep60)} des nouveaux clients recommandent)` : ""}` +
          `${cover < 1.2 ? ", sans marge d'erreur — si ce coût monte encore, il ne se rattrape plus" : ""}.` });
    } else if (cover != null) {
      out.push({ key: "acquisition", tone: "warn",
        text: `${global ? `${global}mais un` : "Un"} nouveau client ne se rembourse pas : ${eur(cac)} de pub${cacTrend} pour ${eur(cpo)} de marge sur sa 1re commande, et pas assez de réachat à 60 jours${rep60 != null ? ` (${pct(rep60)})` : ""} pour combler l'écart. Freine l'acquisition ou répare la marge.` });
    } else {
      out.push({ key: "acquisition", tone: ratio < 0.7 ? "warn" : "info",
        text: `${global ? `${global}mais la` : "La"} 1re commande d'un nouveau client ne couvre pas son coût : ${eur(cpo)} de marge pour ${eur(cac)} de pub${cacTrend} (ratio ${dec2(ratio)}). ${ratio < 0.7 ? "Écart trop large pour être rattrapé : répare la marge avant d'accélérer." : "Ça se rattrape si tes clients reviennent — à vérifier sur les cohortes avant d'accélérer."}` });
    }
  } else if (mer != null && be != null) {
    const head = (mer / be - 1) * 100;
    out.push({ key: "acquisition", tone: head < 30 ? "info" : "good",
      text: `Ta pub rapporte ${xx(mer)} de CA par euro investi (MER), pour un point mort à ${xx(be)} (1/CM2) : marge de sécurité de ${pct(head)}${head < 30 ? ", trop juste pour accélérer sereinement" : ""}.` });
  }

  // (3) LE point à regarder : trésorerie en tension (projection) > signal le plus coûteux > trésorerie sereine.
  const cashVar = n("cash_variation") ?? (n("cash_end") != null && n("cash_start") != null ? n("cash_end")! - n("cash_start")! : null);
  const cashEnd = n("cash_end");
  const tension = forecast && (forecast.below_zero || forecast.low.balance < forecast.start.balance * 0.5);
  if (tension) {
    out.push({ key: "tresorerie", tone: "warn",
      text: (forecast!.below_zero
        ? `À rythme constant, ta trésorerie passe sous zéro le ${dfr(forecast!.below_zero)} (point bas ${eur(forecast!.low.balance)} le ${dfr(forecast!.low.date)}, sur 13 semaines).`
        : `À rythme constant, ta trésorerie descend à ${eur(forecast!.low.balance)} le ${dfr(forecast!.low.date)} (point bas sur 13 semaines, contre ${eur(forecast!.start.balance)} aujourd'hui).`)
        + (forecast!.plan ? ` Selon ton ${forecast!.plan.label} : ${forecast!.plan.below_zero ? `sous zéro le ${dfr(forecast!.plan.below_zero)}` : `point bas ${eur(forecast!.plan.low.balance)} le ${dfr(forecast!.plan.low.date)}`}.` : "") });
    return out.slice(0, 3);
  }
  if (!forecast && cashVar != null && cashEnd != null && cashVar < 0 && (cashEnd <= 0 || -cashVar > Math.abs(cashEnd) * 0.1)) {
    // Sans projection : la baisse du mois reste le seul repère de survie.
    const months = cashEnd > 0 ? Math.floor(cashEnd / -cashVar) : 0;
    out.push({ key: "tresorerie", tone: "warn",
      text: `Ta trésorerie a baissé de ${eur(-cashVar)} ce mois (${eur(cashEnd)} en fin de mois)${cashEnd > 0 ? ` : à ce rythme, environ ${months} mois devant toi` : ""}.` });
    return out.slice(0, 3);
  }

  const cand: { impact: number; point: MonthPoint }[] = [];
  // Retours qui dérapent : marge perdue ≈ retours en plus × taux de CM1 (le produit revient en stock).
  const refunds = n("refunds"), gross = n("gross_sales"), prf = p("refunds"), pgr = p("gross_sales");
  if (refunds != null && gross && prf != null && pgr) {
    const rate = (refunds / gross) * 100, prate = (prf / pgr) * 100;
    if (rate > prate * 1.5 && rate - prate >= 3) {
      const cm1r = n("cm1") != null && n("ca") ? n("cm1")! / n("ca")! : 0.6;
      const lost = ((rate - prate) / 100) * gross * cm1r;
      const reasons = (bk.returns_by_reason?.rows ?? []).slice().sort((a, b) => b.value - a.value);
      const totR = reasons.reduce((s, r) => s + r.value, 0);
      const worst = (bk.returns_by_product?.rows ?? []).filter((r) => (r.values?.sold ?? 0) >= 30 && r.values?.rate != null)
        .sort((a, b) => b.values!.rate! - a.values!.rate!).slice(0, 2);
      cand.push({ impact: lost, point: { key: "retours", tone: "warn",
        text: `Tes retours ont dérapé : ${pct(rate)} de tes ventes brutes contre ${pct(prate)} le mois dernier, soit environ ${eur(lost)} de marge perdue.` +
          (reasons[0] && totR ? ` Motif n°1 : « ${reasons[0].label.toLowerCase()} » (${pct((reasons[0].value / totR) * 100)} des retours)` : "") +
          (worst.length ? `, surtout sur ${worst.map((r) => `${r.label} (${pct(r.values!.rate!)})`).join(" et ")}` : "") +
          (reasons[0] && /petit|grand|taille/i.test(reasons[0].label) ? " — revois le guide des tailles." : ".") } });
    }
  }
  // Canal qui perd de l'argent après pub (répartition au prorata de la valeur attribuée).
  const ch = (bk.channel_margin?.rows ?? []).filter((r) => (r.values?.spend ?? 0) > 0);
  const loser = ch.filter((r) => r.value < 0).sort((a, b) => a.value - b.value)[0];
  if (loser) {
    const best = ch.filter((r) => r.value > 0).sort((a, b) => b.value - a.value)[0];
    cand.push({ impact: -loser.value, point: { key: "canal", tone: "warn",
      text: `${loser.label} te fait perdre ${eur(-loser.value)} après pub ce mois (${eur(loser.values!.spend)} dépensés)${best ? `, quand ${best.label} dégage ${eur(best.value)}` : ""} : ce budget ne ramène pas assez de ventes — réoriente-le.` } });
  }
  // Rupture proche sur un best-seller : environ 2 semaines de marge de ces produits en jeu.
  const stock = bk.stock_days_by_product?.rows ?? [];
  const bestSellers = stock.slice().sort((a, b) => (b.values?.sold ?? 0) - (a.values?.sold ?? 0)).slice(0, 5);
  const tight = bestSellers.filter((r) => r.values?.days != null && r.values.days < 14 && (r.values?.sold ?? 0) > 0);
  if (tight.length && cpo != null) {
    const risk = tight.reduce((s, r) => s + (r.values!.sold! / 30) * Math.max(0, 14 - r.values!.days!) * cpo, 0);
    cand.push({ impact: risk, point: { key: "stock", tone: "warn",
      text: `Rupture imminente sur ${tight.map((r) => `${r.label} (${r.values!.days} j de stock)`).join(", ")} : lance le réassort et coupe la pub sur ces produits en attendant, sinon tu paies des clics sans rien à vendre.` } });
  }
  // Dérive la plus coûteuse du pont d'écarts (hors volume), si elle n'est pas déjà citée au point 1.
  const drift = bridge?.effects.filter((e) => e.value < 0 && e.key !== "volume" && !(out[0]?.text.includes(e.label.toLowerCase()))).sort((a, b) => a.value - b.value)[0];
  if (drift && Math.abs(drift.value) >= Math.max(500, Math.abs(n("ca") ?? 0) * 0.005))
    cand.push({ impact: -drift.value, point: { key: "derive", tone: "warn", text: `À regarder : ${drift.label.toLowerCase()} te coûte ${eur(-drift.value)} de marge vs ${baseLabel ?? bridge!.base}.` } });

  const pick = cand.sort((a, b) => b.impact - a.impact)[0];
  if (pick) out.push(pick.point);
  else if (forecast) {
    const drop = cashVar != null && cashVar < 0;
    out.push({ key: "tresorerie", tone: "good",
      text: `${drop ? `Ta trésorerie a baissé de ${eur(-cashVar!)} ce mois, mais ta` : "Ta"} projection à 13 semaines reste solide : point bas ${eur(forecast.low.balance)} le ${dfr(forecast.low.date)}.` });
  } else if (bridge) {
    const vol = bridge.effects.find((e) => e.key === "volume");
    if (vol && Math.abs(vol.value) >= 1) out.push({ key: "croissance", tone: vol.value >= 0 ? "good" : "info",
      text: `Croissance : l'effet volume pèse ${signed(vol.value)} de marge vs ${baseLabel ?? bridge.base}.` });
  }
  return out.slice(0, 3);
}

// Garde-fou « l'IA rédige, ne chiffre pas » : tout nombre du texte réécrit doit exister dans les faits.
export function numbersPreserved(facts: string, rewritten: string): boolean {
  const nums = (s: string) => (s.replace(/[\s  ]/g, "").match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(",", "."));
  const allowed = new Set(nums(facts));
  return nums(rewritten).every((x) => allowed.has(x) || /^[123]$/.test(x)); // « 1/CM2 », numéros de points
}
