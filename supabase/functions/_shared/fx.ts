// Taux de change vers la devise de reporting du client.
// Source : BCE (eurofxref, base EUR) + parité USD/AED (le dirham est arrimé au dollar : 1 USD = 3,6725 AED).
// Repli : taux internes fournis (overrides, ex. via le contexte du dossier) puis constantes de secours.
// Renvoie factor[CUR] = nombre d'unités de la devise de reporting pour 1 unité de CUR.

const PEG_USD_AED = 3.6725;
const FALLBACK_EUR: Record<string, number> = { EUR: 1, USD: 1.08, GBP: 0.85 }; // 1 EUR = X (repli si BCE indispo)

async function ecbEurRates(dateISO: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const xml = await res.text();
    const days = [...xml.matchAll(/<Cube time="([0-9-]+)">([\s\S]*?)<\/Cube>/g)].map((m) => ({ d: m[1], body: m[2] }));
    if (!days.length) return null;
    days.sort((a, b) => (a.d < b.d ? 1 : -1)); // décroissant
    const day = days.find((x) => x.d <= dateISO) ?? days[days.length - 1];
    const rates: Record<string, number> = { EUR: 1 };
    for (const m of day.body.matchAll(/currency="([A-Z]{3})"\s+rate="([0-9.]+)"/g)) rates[m[1]] = parseFloat(m[2]);
    return Object.keys(rates).length > 1 ? rates : null;
  } catch { return null; }
}

export async function ratesToReporting(
  period: string,
  reporting: string,
  overrides?: Record<string, number>,
): Promise<{ factor: Record<string, number>; source: string }> {
  const rep = (reporting || "EUR").toUpperCase();
  const dateISO = `${period.slice(0, 8)}28`; // ~fin de période
  let eur = await ecbEurRates(dateISO);
  const source = eur ? "BCE" : "repli";
  if (!eur) eur = { ...FALLBACK_EUR };
  if (eur.AED == null && eur.USD != null) eur.AED = eur.USD * PEG_USD_AED; // AED via parité USD

  const repPerEur = eur[rep] ?? 1;
  const factor: Record<string, number> = {};
  for (const [cur, eurRate] of Object.entries(eur)) if (eurRate > 0) factor[cur] = (1 / eurRate) * repPerEur; // 1 cur -> EUR -> rep
  factor[rep] = 1;

  if (overrides) for (const [k, v] of Object.entries(overrides)) if (typeof v === "number" && isFinite(v) && v > 0) factor[k.toUpperCase()] = v;
  return { factor, source: overrides && Object.keys(overrides).length ? `${source}+interne` : source };
}

// Convertit un montant d'une devise vers la devise de reporting via la table de facteurs.
export function convert(amount: number, currency: string | undefined, factor: Record<string, number>): number {
  const f = currency ? factor[currency.toUpperCase()] : undefined;
  return typeof f === "number" ? amount * f : amount; // devise inconnue → on laisse tel quel (signalé ailleurs)
}
