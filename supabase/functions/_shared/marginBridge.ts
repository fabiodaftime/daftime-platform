// PONT D'ÉCARTS de marge (doctrine : « pourquoi la marge a bougé ? »), 100 % déterministe.
// Variation de la marge du mois vs une base (M-1, ou moyenne des 3 mois précédents), décomposée en
// effets qui s'additionnent EXACTEMENT à la variation (aucun résidu caché) :
//   volume        (nb de commandes) × marge unitaire de la base
//   panier moyen  (CA par commande, avant retours) × taux de CM1 de la base
//   retours       (remboursements par commande) × taux de CM1 de la base
//   marge produit (taux de CM1 : mix, prix, remises, coûts d'achat) × CA du mois
//   logistique    (coût logistique par commande)
//   paiement      (frais de paiement + commissions par commande)
//   pub           (dépense publicitaire totale)
// Niveau : CM3 si logistique ET pub connues des deux côtés, sinon CM2, sinon CM1 (dit explicitement).
// Notation : N commandes, A panier net = CA/N, r taux de CM1, l et p coûts par commande.
//   CM1 = N·A·r ; CM2 = CM1 − N·l − N·p ; CM3 = CM2 − Pub.
//   ΔCM1 = ΔN·A₀r₀ + N₁·ΔA·r₀ + CA₁·Δr ; ΔL = ΔN·l₀ + N₁·Δl (idem p) → le volume porte ΔN·(A₀r₀ − l₀ − p₀).

export type BridgeKey = "volume" | "panier" | "retours" | "marge_produit" | "logistique" | "paiement" | "pub";
export const BRIDGE_LABELS: Record<BridgeKey, string> = {
  volume: "Volume (nombre de commandes)", panier: "Panier moyen", retours: "Retours / remboursements",
  marge_produit: "Marge produit (mix, prix, remises, coûts d'achat)", logistique: "Logistique par commande",
  paiement: "Frais de paiement / commissions par commande", pub: "Dépense publicitaire",
};
export interface BridgeEffect { key: BridgeKey; label: string; value: number; pts: number }
export interface Bridge {
  level: "cm1" | "cm2" | "cm3"; base: string;
  from: number; to: number; delta: number;
  effects: BridgeEffect[];   // triés par impact absolu décroissant
  missing?: string;          // pourquoi le niveau est limité (ex. « logistique inconnue »)
}

type V = Record<string, number | null | undefined>;
const num = (x: unknown): number | null => (typeof x === "number" && isFinite(x) ? x : null);
const r2 = (x: number) => Math.round(x * 100) / 100;

export function marginBridge(cur: V, base: V, baseLabel: string): Bridge | null {
  const need = ["ca", "cogs", "orders"];
  if (need.some((k) => num(cur[k]) == null || num(base[k]) == null) || !(num(cur.orders)! > 0) || !(num(base.orders)! > 0) || !(num(cur.ca)! > 0) || !(num(base.ca)! > 0)) return null;
  const both = (k: string) => num(cur[k]) != null && num(base[k]) != null;
  const level: Bridge["level"] = both("shipping_cost") ? (both("ads_total") ? "cm3" : "cm2") : "cm1";
  const missing = level === "cm1" ? "logistique inconnue sur l'un des deux mois : pont limité à la marge produit (CM1)"
    : level === "cm2" ? "pub inconnue sur l'un des deux mois : pont limité à la CM2" : undefined;

  const side = (v: V) => {
    const N = num(v.orders)!, ca = num(v.ca)!, cogs = num(v.cogs)!;
    const refunds = num(v.refunds);
    const fees = (num(v.payment_fees) ?? 0) + (num(v.marketplace_fees) ?? 0);
    return { N, ca, A: ca / N, r: (ca - cogs) / ca, rho: refunds != null ? refunds / N : null,
      l: level === "cm1" ? 0 : num(v.shipping_cost)! / N, p: level === "cm1" ? 0 : fees / N, ads: level === "cm3" ? num(v.ads_total)! : 0 };
  };
  const b = side(base), c = side(cur);
  const margin = (s: typeof b) => s.N * s.A * s.r - s.N * s.l - s.N * s.p - s.ads;

  const eff: Partial<Record<BridgeKey, number>> = {};
  eff.volume = (c.N - b.N) * (b.A * b.r - b.l - b.p);
  if (c.rho != null && b.rho != null) {
    // Panier AVANT retours vs retours par commande : A = A_pré − ρ.
    eff.panier = c.N * ((c.A + c.rho) - (b.A + b.rho)) * b.r;
    eff.retours = -c.N * (c.rho - b.rho) * b.r;
  } else eff.panier = c.N * (c.A - b.A) * b.r;
  eff.marge_produit = c.ca * (c.r - b.r);
  if (level !== "cm1") { eff.logistique = -c.N * (c.l - b.l); eff.paiement = -c.N * (c.p - b.p); }
  if (level === "cm3") eff.pub = -(c.ads - b.ads);

  const from = margin(b), to = margin(c);
  const effects = (Object.entries(eff) as [BridgeKey, number][])
    .filter(([k, v]) => Math.abs(v) >= 0.005 || k === "volume")
    .map(([key, v]) => ({ key, label: BRIDGE_LABELS[key], value: r2(v), pts: r2((v / c.ca) * 100) }))
    .sort((x, y) => Math.abs(y.value) - Math.abs(x.value));
  return { level, base: baseLabel, from: r2(from), to: r2(to), delta: r2(to - from), effects, ...(missing ? { missing } : {}) };
}

// Base « moyenne des 3 mois précédents » : moyenne poste par poste des mois disponibles (≥ 2).
export function averageBase(months: V[]): V | null {
  const ok = months.filter((m) => num(m.ca) != null && num(m.orders) != null);
  if (ok.length < 2) return null;
  const keys = ["ca", "cogs", "orders", "refunds", "shipping_cost", "payment_fees", "marketplace_fees", "ads_total"];
  const out: V = {};
  for (const k of keys) {
    const xs = ok.map((m) => num(m[k])).filter((x): x is number => x != null);
    // Un poste n'est moyenné que s'il est connu sur TOUS les mois de la base (sinon moyenne biaisée).
    if (xs.length === ok.length) out[k] = xs.reduce((s, x) => s + x, 0) / xs.length;
  }
  return out;
}

// Aplatit les sections d'une donnée standardisée en { id: valeur }.
export function flatValues(data: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of ((data as { sections?: { rows?: { id?: string; value?: unknown }[] }[] })?.sections ?? []))
    for (const r of s.rows ?? []) if (r.id && typeof r.value === "number" && isFinite(r.value)) out[r.id] = r.value;
  return out;
}
