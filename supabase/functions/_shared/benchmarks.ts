// Référentiels SECTORIELS — transforme une valeur brute en VERDICT (bon / moyen / alerte) + repère.
// C'est la couche de JUGEMENT qui manquait : comme « GOP 31,6 % → fourchette luxe 30-38 % » sur un
// dashboard hôtelier, on dit ici si un ROAS, une conversion, une marge… est saine ou non POUR LE SECTEUR.

export type Verdict = { level: "good" | "warn" | "bad"; note: string };

type B = { dir: "high" | "low"; good: number; warn: number; ref: string };

// E-commerce : les KPIs qui ont un repère de marché clair.
const ECOM: Record<string, B> = {
  conversion_rate:    { dir: "high", good: 2.5, warn: 1.5, ref: "repère 2-3 %" },
  add_to_cart_rate:   { dir: "high", good: 10,  warn: 6,   ref: "repère ~10 %" },
  roas:               { dir: "high", good: 3,   warn: 2,   ref: "rentable > 3-4" },
  refund_rate:        { dir: "low",  good: 3,   warn: 6,   ref: "sain < 3 %" },
  repeat_rate:        { dir: "high", good: 25,  warn: 12,  ref: "fidélisation > 25 %" },
  new_customer_share: { dir: "low",  good: 65,  warn: 85,  ref: "trop de nouveaux = pas de réachat" },
  purchase_frequency: { dir: "high", good: 1.5, warn: 1.1, ref: "réachat > 1,5" },
  taux_marge_brute:   { dir: "high", good: 45,  warn: 30,  ref: "e-commerce 40-60 %" },
  marge_ebitda:       { dir: "high", good: 10,  warn: 0,   ref: "viser > 10 %" },
  marge_nette:        { dir: "high", good: 8,   warn: 0,   ref: "viser > 8 %" },
};

// Repères génériques (toute activité) — surtout les marges.
const DEFAULT: Record<string, B> = {
  taux_marge_brute: { dir: "high", good: 40, warn: 25, ref: "cible > 40 %" },
  marge_ebitda:     { dir: "high", good: 10, warn: 0,  ref: "viser > 10 %" },
  marge_nette:      { dir: "high", good: 8,  warn: 0,  ref: "viser > 8 %" },
  gop_margin:       { dir: "high", good: 30, warn: 18, ref: "hôtellerie 30-38 %" },
};

const TABLES: Record<string, Record<string, B>> = { ecommerce: ECOM, default: DEFAULT };

const VERB: Record<"high" | "low", Record<Verdict["level"], string>> = {
  high: { good: "sain", warn: "à surveiller", bad: "sous le seuil" },
  low: { good: "maîtrisé", warn: "à surveiller", bad: "trop élevé" },
};

/** Verdict sectoriel pour un indicateur, ou null s'il n'a pas de repère connu. */
export function assess(id: string, value: number | null | undefined, activity?: string): Verdict | null {
  if (value == null || !isFinite(value)) return null;
  const b = (TABLES[activity ?? ""] ?? {})[id] ?? DEFAULT[id];
  if (!b) return null;
  const ok = b.dir === "high" ? value >= b.good : value <= b.good;
  const mid = b.dir === "high" ? value >= b.warn : value <= b.warn;
  const level: Verdict["level"] = ok ? "good" : mid ? "warn" : "bad";
  return { level, note: `${VERB[b.dir][level]} · ${b.ref}` };
}
