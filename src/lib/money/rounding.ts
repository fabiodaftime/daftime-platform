// ============================================================================
// MONEY ROUNDING & PRECISION — règles partagées
// ----------------------------------------------------------------------------
// Définit les règles canoniques d'arrondi pour les métriques financières
// (CA, charges, marge, marge %, évolution) par devise.
//
// Devises supportées (toutes à 2 décimales / "subunit = centime") :
//   - USD (Digit, PCGroup)
//   - EUR (Prime Circle)
//   - AED (Nowmade, Labarile, Skalis)
//
// Règles :
//   1. Arrondi "bankers' rounding" demi-pair INTERDIT — on utilise
//      l'arrondi commercial "half away from zero" (cohérent avec ce que
//      les clients lisent dans Excel).
//   2. La précision interne est en cents (entiers) pour éviter les
//      artefacts flottants. On ne ré-arrondit JAMAIS un nombre déjà
//      arrondi (idempotence).
//   3. Marge % : arrondie à 0.01 % près. Si CA = 0 → 0 (jamais NaN).
//   4. Évolution M/M-1 : delta absolu arrondi au centime ; delta %
//      arrondi à 0.01 % près ; si prev = 0 et curr ≠ 0 → null (non
//      défini, jamais Infinity).
// ============================================================================

export type SupportedCurrency = 'USD' | 'EUR' | 'AED';

export const CURRENCY_DECIMALS: Record<SupportedCurrency, number> = {
  USD: 2,
  EUR: 2,
  AED: 2,
};

/** Arrondit "half away from zero" à `decimals` décimales. */
export function roundHalfAwayFromZero(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  const sign = value < 0 ? -1 : 1;
  // +Number.EPSILON pour neutraliser 0.005 → 0.00499999...
  return (sign * Math.round(Math.abs(value) * factor + Number.EPSILON)) / factor;
}

/** Arrondit un montant à la précision de la devise (centime). */
export function roundMoney(value: number, currency: SupportedCurrency): number {
  return roundHalfAwayFromZero(value, CURRENCY_DECIMALS[currency]);
}

/** Somme une liste de montants en travaillant en cents entiers. */
export function sumMoney(values: number[], currency: SupportedCurrency): number {
  const d = CURRENCY_DECIMALS[currency];
  const factor = Math.pow(10, d);
  const cents = values.reduce((s, v) => s + Math.round(v * factor + Number.EPSILON), 0);
  return cents / factor;
}

/** Marge % arrondie à 0.01 %. Renvoie 0 si CA = 0. */
export function marginPct(marge: number, ca: number): number {
  if (!Number.isFinite(ca) || ca === 0) return 0;
  return roundHalfAwayFromZero((marge / ca) * 100, 2);
}

/** Évolution absolue arrondie à la devise. */
export function evolutionAbs(curr: number, prev: number, currency: SupportedCurrency): number {
  return roundMoney(curr - prev, currency);
}

/** Évolution % arrondie à 0.01 %. null si prev = 0 (non défini). */
export function evolutionPct(curr: number, prev: number): number | null {
  if (!Number.isFinite(prev) || prev === 0) return null;
  return roundHalfAwayFromZero(((curr - prev) / Math.abs(prev)) * 100, 2);
}
