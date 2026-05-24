import { LabarileKPICard } from './LabarileKPICard';
import { useLabarileMonthly } from './useLabarileMonthly';

// Hypothèses transparentes
const ASSUMPTIONS = {
  vatEuRatePctOfCA: 11.4,
  vatUaeRatePctOfCA: 0.28,
  ctRate: 9,
  ctAbattementAED: 375_000,
};

// TVA EU effectivement payée début mai 2026 (83k EUR) — étalée linéairement
// sur Jan→Mar 2026 (hypothèse de rattachement à valider avec Anissa).
// Le provisionnement % du CA est désactivé pour ces 3 mois pour éviter le double-comptage.
const TVA_EU_PAID_MAY_EUR = 83_000;
const EUR_TO_AED = 4.30;
const TVA_EU_PAID_MAY_AED = TVA_EU_PAID_MAY_EUR * EUR_TO_AED;
const TVA_EU_ALLOCATION_MONTHS = ['JANVIER', 'FÉVRIER', 'FEVRIER', 'MARS'];
const TVA_EU_ALLOCATED_PER_MONTH = TVA_EU_PAID_MAY_AED / 3; // ~119k AED/mois

const fmtK = (aed: number) => `${Math.round(aed / 1000).toLocaleString()}k AED`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function isAllocatedMonth(monthLabel: string): boolean {
  const upper = monthLabel.toUpperCase();
  return TVA_EU_ALLOCATION_MONTHS.some((m) => upper.startsWith(m));
}

function buildYtd2026Taxes(
  ytdData: { months: number; caTotal: number; netProfit: number },
  monthlyVatEuTotal: number,
) {
  const ca = ytdData.caTotal;
  const months = ytdData.months;
  const netProfit = ytdData.netProfit;

  // TVA EU = somme des allocations mensuelles (paiement réel mai étalé Jan→Mar)
  // + estimation % CA pour les mois non couverts par le paiement de mai.
  const vatEu = monthlyVatEuTotal;
  const vatUae = ca * (ASSUMPTIONS.vatUaeRatePctOfCA / 100);

  const caAnnualRunRate = months > 0 ? ca * (12 / months) : 0;
  const profitAnnualRunRate = months > 0 ? netProfit * (12 / months) : 0;
  const taxableAnnual = Math.max(0, profitAnnualRunRate - ASSUMPTIONS.ctAbattementAED);
  const ctAnnualEstimate = taxableAnnual * (ASSUMPTIONS.ctRate / 100);
  const ctYtdProrata = months > 0 ? ctAnnualEstimate * (months / 12) : 0;
  const ctMonthlyProvision = ctAnnualEstimate / 12;

  const totalYtd = vatEu + vatUae + ctYtdProrata;

  return { ca, months, netProfit, vatEu, vatUae, ctYtdProrata, ctAnnualEstimate, ctMonthlyProvision, caAnnualRunRate, profitAnnualRunRate, taxableAnnual, totalYtd };
}

function buildMonthlyTaxRows(monthly: Array<{ month: string; revenue: number; actual: Record<string, number> }>) {
  return monthly.map((m) => {
    const charges = (Object.values(m.actual) as number[]).reduce((a, b) => a + b, 0);
    const ebitda = m.revenue - charges;
    const allocated = isAllocatedMonth(m.month);
    // Si le mois est couvert par le paiement mai 2026 → allocation réelle, pas d'estimation.
    const vatEu = allocated ? TVA_EU_ALLOCATED_PER_MONTH : m.revenue * (ASSUMPTIONS.vatEuRatePctOfCA / 100);
    const vatUae = m.revenue * (ASSUMPTIONS.vatUaeRatePctOfCA / 100);
    return { month: m.month, revenue: m.revenue, ebitda, vatEu, vatUae, total: vatEu + vatUae, allocated };
  });
}

export function LabarileTaxesPage() {
  const { monthlyCosts2026, ytd2026 } = useLabarileMonthly(2026);
  const ytd = buildYtd2026Taxes(ytd2026);
  const monthly = buildMonthlyTaxRows(monthlyCosts2026);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* KPIs YTD 2026 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Total Taxes YTD 2026" value={fmtK(ytd.totalYtd)} subtext={`Jan → Avr (${ytd.months} mois) — TVA + CT prorata`} variant="primary" />
        <LabarileKPICard label="TVA EU estimée YTD" value={fmtK(ytd.vatEu)} subtext={`${fmtPct(ASSUMPTIONS.vatEuRatePctOfCA)} du CA`} variant="warning" />
        <LabarileKPICard label="TVA UAE estimée YTD" value={fmtK(ytd.vatUae)} subtext={`${fmtPct(ASSUMPTIONS.vatUaeRatePctOfCA)} du CA (ventes UAE)`} />
        <LabarileKPICard label="CT 2026 — Estimatif annuel" value={fmtK(ytd.ctAnnualEstimate)} subtext="9% × (profit run-rate − 375k abattement)" variant="success" />
      </div>

      {/* TVA EU payée mai 2026 */}
      <div className="bg-emerald-50 border-l-4 border-l-emerald-500 rounded-lg p-4">
        <p className="font-bold text-sm text-emerald-700 mb-2">💸 TVA EU déjà payée début mai 2026</p>
        <p className="text-sm text-labarile-text leading-relaxed">
          Paiement effectué début mai 2026 pour les périodes précédentes : <strong>{TVA_EU_PAID_MAY_EUR.toLocaleString('fr-FR')} EUR</strong>{' '}
          (≈ <strong>{fmtK(TVA_EU_PAID_MAY_AED)}</strong> au taux EUR/AED {EUR_TO_AED}). Ce montant est <strong>déjà sorti de la trésorerie</strong>{' '}
          et n'est plus à provisionner. L'estimatif TVA EU YTD ci-dessus ({fmtK(ytd.vatEu)}) couvre l'activité 2026 et reste à provisionner pour les prochaines échéances.
        </p>
      </div>

      {/* Hypothèses */}
      <div className="bg-blue-50 border-l-4 border-l-blue-500 rounded-lg p-4">
        <p className="font-bold text-sm text-blue-800 mb-2">🧮 Hypothèses de calcul :</p>
        <ul className="text-sm text-blue-900 space-y-1 ml-4 list-disc">
          <li>TVA EU ≈ <strong>{fmtPct(ASSUMPTIONS.vatEuRatePctOfCA)} du CA</strong> — calé sur le mix Q4 2025. À affiner avec le split ventes par juridiction 2026.</li>
          <li>TVA UAE ≈ <strong>{fmtPct(ASSUMPTIONS.vatUaeRatePctOfCA)} du CA</strong> — 5% sur ventes domestiques.</li>
          <li>Corporate Tax UAE : <strong>{ASSUMPTIONS.ctRate}%</strong> après abattement <strong>375 000 AED</strong>. Échéance : <strong>30/09/2027</strong> pour 2026.</li>
        </ul>
      </div>

      {/* Estimatif YTD 2026 détaillé */}
      <div className="bg-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-4 tracking-wide">
          📊 Estimatif Taxes YTD 2026 (Janvier → Avril)
        </h3>

        <div className="overflow-x-auto mb-5">
          <table className="w-full">
            <thead>
              <tr className="bg-labarile-ice1">
                <th className="px-3 py-3 text-left text-xs font-bold border-b-2 border-labarile-border">Mois</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">CA</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">EBITDA</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">TVA EU est.</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">TVA UAE est.</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Total TVA</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((r) => (
                <tr key={r.month} className="hover:bg-labarile-light-gray">
                  <td className="px-3 py-3 text-sm border-b border-labarile-border font-semibold">{r.month}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{fmtK(r.revenue)}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{fmtK(r.ebitda)}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{fmtK(r.vatEu)}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{fmtK(r.vatUae)}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right font-semibold">{fmtK(r.total)}</td>
                </tr>
              ))}
              <tr className="bg-labarile-ice1">
                <td className="px-3 py-3 text-sm font-bold">TOTAL YTD ({ytd.months} mois)</td>
                <td className="px-3 py-3 text-sm text-right font-bold">{fmtK(ytd.ca)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold">{fmtK(ytd.netProfit)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold">{fmtK(ytd.vatEu)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold">{fmtK(ytd.vatUae)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold">{fmtK(ytd.vatEu + ytd.vatUae)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-orange-50 border-l-4 border-l-orange-500 rounded-lg p-4">
            <p className="text-xs font-semibold text-orange-700 mb-1">CT — Provision YTD (prorata)</p>
            <p className="font-bebas text-2xl text-orange-700">{fmtK(ytd.ctYtdProrata)}</p>
            <p className="text-xs text-labarile-muted mt-1">À mettre en réserve pour échéance Sep 2027</p>
          </div>
          <div className="bg-blue-50 border-l-4 border-l-blue-500 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">CT — Estimatif annuel 2026</p>
            <p className="font-bebas text-2xl text-blue-700">{fmtK(ytd.ctAnnualEstimate)}</p>
            <p className="text-xs text-labarile-muted mt-1">Base : run-rate {fmtK(ytd.profitAnnualRunRate)} − 375k</p>
          </div>
          <div className="bg-emerald-50 border-l-4 border-l-emerald-500 rounded-lg p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-1">Provision CT mensuelle</p>
            <p className="font-bebas text-2xl text-emerald-700">{fmtK(ytd.ctMonthlyProvision)}</p>
            <p className="text-xs text-labarile-muted mt-1">Étalement Sep 26 → Août 27</p>
          </div>
        </div>
      </div>

      {/* Points clés */}
      <div className="bg-gradient-to-br from-labarile-ice1 to-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-4 tracking-wide">📌 Points clés Fiscalité</h3>
        <div className="space-y-3">
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm">
              <strong className="text-emerald-600">✅ TVA EU mai 2026 réglée.</strong><br />
              {TVA_EU_PAID_MAY_EUR.toLocaleString('fr-FR')} EUR (≈ {fmtK(TVA_EU_PAID_MAY_AED)}) payés début mai pour les périodes précédentes.
            </p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm">
              <strong className="text-labarile-primary">💧 TVA 2026 à provisionner.</strong><br />
              Sur Jan→Avr 2026, TVA EU + UAE estimée à <strong>{fmtK(ytd.vatEu + ytd.vatUae)}</strong> sur un CA de {fmtK(ytd.ca)} (≈ {fmtPct(((ytd.vatEu + ytd.vatUae) / Math.max(1, ytd.ca)) * 100)}).
            </p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm">
              <strong className="text-blue-600">📅 Corporate Tax 2026.</strong><br />
              Run-rate YTD ({fmtK(ytd.caAnnualRunRate)} CA / {fmtK(ytd.profitAnnualRunRate)} profit) → CT estimée <strong>{fmtK(ytd.ctAnnualEstimate)}</strong>, à provisionner <strong>{fmtK(ytd.ctMonthlyProvision)}/mois</strong> dès Sep 2026.
            </p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm">
              <strong className="text-amber-600">⚠️ À fiabiliser.</strong><br />
              Le split ventes par juridiction (UAE / FR / autres UE) doit être consolidé mensuellement pour remplacer le mix Q4 2025 par des données réelles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
