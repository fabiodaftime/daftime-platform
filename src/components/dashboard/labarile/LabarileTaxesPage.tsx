import { LabarileKPICard } from './LabarileKPICard';
import {
  TAXES_Q4_DETAIL,
  SCENARIOS,
  type Scenario,
} from './LabarileData';
import { cn } from '@/lib/utils';
import { useLabarileMonthly } from './useLabarileMonthly';

interface LabarileTaxesPageProps {
  scenario: Scenario;
}

// ---------- Hypothèses de calcul (transparence) ----------
const ASSUMPTIONS = {
  vatEuRatePctOfCA: 11.4,   // calé sur Q4 2025 : 148.3k / 1 305k de CA
  vatUaeRatePctOfCA: 0.28,  // calé sur Q4 2025 : 3.7k / 1 305k
  ctRate: 9,                // Corporate Tax UAE
  ctAbattementAED: 375_000, // abattement annuel
};

const fmtK = (aed: number) => `${Math.round(aed / 1000).toLocaleString()}k AED`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// ---------- YTD 2026 : taxes estimées sur la période ----------
function buildYtd2026Taxes() {
  const ca = YTD_2026.caTotal; // AED
  const months = YTD_2026.months; // 4
  const netProfit = YTD_2026.netProfit; // AED

  const vatEu = ca * (ASSUMPTIONS.vatEuRatePctOfCA / 100);
  const vatUae = ca * (ASSUMPTIONS.vatUaeRatePctOfCA / 100);

  // Run-rate annuel à partir du YTD
  const caAnnualRunRate = ca * (12 / months);
  const profitAnnualRunRate = netProfit * (12 / months);
  const taxableAnnual = Math.max(0, profitAnnualRunRate - ASSUMPTIONS.ctAbattementAED);
  const ctAnnualEstimate = taxableAnnual * (ASSUMPTIONS.ctRate / 100);
  // Provision YTD au prorata (4/12 de la CT annuelle)
  const ctYtdProrata = ctAnnualEstimate * (months / 12);
  // Provision mensuelle théorique pour étaler la CT annuelle
  const ctMonthlyProvision = ctAnnualEstimate / 12;

  const totalYtd = vatEu + vatUae + ctYtdProrata;

  return {
    ca,
    months,
    netProfit,
    vatEu,
    vatUae,
    ctYtdProrata,
    ctAnnualEstimate,
    ctMonthlyProvision,
    caAnnualRunRate,
    profitAnnualRunRate,
    taxableAnnual,
    totalYtd,
  };
}

// ---------- Détail mensuel YTD 2026 ----------
function buildMonthlyTaxRows() {
  return MONTHLY_COSTS_2026.map((m) => {
    const charges = Object.values(m.actual).reduce((a, b) => a + b, 0);
    const ebitda = m.revenue - charges;
    const vatEu = m.revenue * (ASSUMPTIONS.vatEuRatePctOfCA / 100);
    const vatUae = m.revenue * (ASSUMPTIONS.vatUaeRatePctOfCA / 100);
    return {
      month: m.month,
      revenue: m.revenue,
      ebitda,
      vatEu,
      vatUae,
      total: vatEu + vatUae,
    };
  });
}

function computeCT(s: Scenario) {
  const ebitda = Math.round(s.total2026 * s.margins.operating / 100); // k AED
  const profit = Math.max(0, ebitda - 375); // k AED, abattement 375k
  const ct = Math.round(profit * 0.09);
  const mensuel = Math.round(ct / 12);
  return { ebitda, profit, ct, mensuel };
}

export function LabarileTaxesPage({ scenario }: LabarileTaxesPageProps) {
  const ytd = buildYtd2026Taxes();
  const monthly = buildMonthlyTaxRows();
  const ctScenarios = [
    { key: 'prudent', label: 'Prudent', ...computeCT(SCENARIOS.prudent), highlight: false },
    { key: 'base', label: 'Base', ...computeCT(SCENARIOS.base), highlight: true },
    { key: 'optimiste', label: 'Optimiste', ...computeCT(SCENARIOS.optimiste), highlight: false },
  ];
  const activeCT = computeCT(scenario);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* KPIs YTD 2026 — données fiables sur la période */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard
          label="Total Taxes YTD 2026"
          value={fmtK(ytd.totalYtd)}
          subtext={`Jan → Avr (${ytd.months} mois) — TVA + CT prorata`}
          variant="primary"
        />
        <LabarileKPICard
          label="TVA EU estimée YTD"
          value={fmtK(ytd.vatEu)}
          subtext={`${fmtPct(ASSUMPTIONS.vatEuRatePctOfCA)} du CA (hypothèse mix Q4 25)`}
          variant="warning"
        />
        <LabarileKPICard
          label="TVA UAE estimée YTD"
          value={fmtK(ytd.vatUae)}
          subtext={`${fmtPct(ASSUMPTIONS.vatUaeRatePctOfCA)} du CA (5% ventes UAE)`}
        />
        <LabarileKPICard
          label="CT 2026 — Estimatif annuel"
          value={fmtK(ytd.ctAnnualEstimate)}
          subtext={`9% × (profit run-rate − 375k abattement)`}
          variant="success"
        />
      </div>

      {/* Hypothèses */}
      <div className="bg-blue-50 border-l-4 border-l-blue-500 rounded-lg p-4">
        <p className="font-bold text-sm text-blue-800 mb-2">🧮 Hypothèses de calcul (transparence) :</p>
        <ul className="text-sm text-blue-900 space-y-1 ml-4 list-disc">
          <li>TVA EU ≈ <strong>{fmtPct(ASSUMPTIONS.vatEuRatePctOfCA)} du CA</strong> — calé sur le mix Q4 2025 (148.3k AED / 1 305k AED). À affiner dès que le split ventes par juridiction 2026 est disponible.</li>
          <li>TVA UAE ≈ <strong>{fmtPct(ASSUMPTIONS.vatUaeRatePctOfCA)} du CA</strong> — taux 5% appliqué uniquement aux ventes domestiques (faibles).</li>
          <li>Corporate Tax UAE : <strong>{ASSUMPTIONS.ctRate}%</strong> sur profit imposable, après abattement annuel de <strong>375 000 AED</strong>. Échéance : <strong>30/09/2027</strong> pour l'exercice 2026, provisionnement à étaler de Sep 2026 à Août 2027.</li>
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
            <p className="text-xs font-semibold text-orange-700 mb-1">CT — Provision YTD (prorata 4/12)</p>
            <p className="font-bebas text-2xl text-orange-700">{fmtK(ytd.ctYtdProrata)}</p>
            <p className="text-xs text-labarile-muted mt-1">À mettre en réserve pour échéance Sep 2027</p>
          </div>
          <div className="bg-blue-50 border-l-4 border-l-blue-500 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">CT — Estimatif annuel 2026</p>
            <p className="font-bebas text-2xl text-blue-700">{fmtK(ytd.ctAnnualEstimate)}</p>
            <p className="text-xs text-labarile-muted mt-1">
              Base : profit run-rate {fmtK(ytd.profitAnnualRunRate)} − abattement 375k
            </p>
          </div>
          <div className="bg-emerald-50 border-l-4 border-l-emerald-500 rounded-lg p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-1">Provision CT mensuelle conseillée</p>
            <p className="font-bebas text-2xl text-emerald-700">{fmtK(ytd.ctMonthlyProvision)}</p>
            <p className="text-xs text-labarile-muted mt-1">Étalement sur 12 mois (Sep 26 → Août 27)</p>
          </div>
        </div>
      </div>

      {/* Q4 2025 — Recap réel */}
      <div className="bg-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-4 tracking-wide">
          📊 Taxes Q4 2025 — Récapitulatif (Réel)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-labarile-ice1">
                <th className="px-3 py-3 text-left text-xs font-bold border-b-2 border-labarile-border">Type de Taxe</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Montant</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">% Total</th>
                <th className="px-3 py-3 text-left text-xs font-bold border-b-2 border-labarile-border">Détails</th>
              </tr>
            </thead>
            <tbody>
              {TAXES_Q4_DETAIL.map((tax: any, idx: number) => (
                <tr key={idx} className="hover:bg-labarile-light-gray">
                  <td className="px-3 py-3 text-sm border-b border-labarile-border font-semibold">{tax.type}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{tax.montant}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{tax.pct}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-labarile-muted">{tax.details}</td>
                </tr>
              ))}
              <tr className="bg-labarile-ice1">
                <td className="px-3 py-3 text-sm font-bold">TOTAL Q4 2025</td>
                <td className="px-3 py-3 text-sm text-right font-bold">174,078 AED</td>
                <td className="px-3 py-3 text-sm text-right font-bold">100%</td>
                <td className="px-3 py-3 text-sm text-labarile-muted">13.3% du CA Q4</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Corporate Tax — Scénarios annuels */}
      <div className="bg-labarile-white border-2 border-blue-500 rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-blue-600 mb-4 tracking-wide">
          💰 Corporate Tax 2026 — Projections par scénario
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-labarile-ice1">
                <th className="px-3 py-3 text-left text-xs font-bold border-b-2 border-labarile-border">Scénario</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">EBITDA 2026</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Profit imposable</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Corporate Tax</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Provision /mois</th>
              </tr>
            </thead>
            <tbody>
              {ctScenarios.map((row) => (
                <tr key={row.key} className={cn('hover:bg-labarile-light-gray', row.highlight && 'bg-labarile-ice1')}>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border font-semibold">{row.label}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.ebitda.toLocaleString()}k AED</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.profit.toLocaleString()}k AED</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.ct.toLocaleString()}k AED</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.mensuel}k/mois</td>
                </tr>
              ))}
              <tr className="bg-emerald-50">
                <td className="px-3 py-3 text-sm font-bold text-emerald-700">YTD run-rate (réel)</td>
                <td className="px-3 py-3 text-sm text-right font-bold">{fmtK(ytd.profitAnnualRunRate)} EBITDA proxy</td>
                <td className="px-3 py-3 text-sm text-right font-bold">{fmtK(ytd.taxableAnnual)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold">{fmtK(ytd.ctAnnualEstimate)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold">{fmtK(ytd.ctMonthlyProvision)}/mois</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-labarile-muted mt-3">
          Scénario actif : <strong>{scenario.name}</strong> → CT annuel projeté <strong>{activeCT.ct}k AED</strong> ({activeCT.mensuel}k/mois). Échéance paiement : 30/09/2027.
        </p>
      </div>

      {/* Points clés */}
      <div className="bg-gradient-to-br from-labarile-ice1 to-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-4 tracking-wide">
          📌 Points clés Fiscalité
        </h3>
        <div className="space-y-3">
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm">
              <strong className="text-labarile-primary">💧 TVA = poste mensuel principal.</strong><br />
              Sur la période Jan→Avr 2026, TVA EU + UAE estimée à <strong>{fmtK(ytd.vatEu + ytd.vatUae)}</strong> sur un CA de {fmtK(ytd.ca)} (≈ {fmtPct((ytd.vatEu + ytd.vatUae) / ytd.ca * 100)}). À provisionner chaque mois sans exception.
            </p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm">
              <strong className="text-blue-600">📅 Corporate Tax 2026 — Estimation fiable.</strong><br />
              Sur la base du run-rate YTD ({fmtK(ytd.caAnnualRunRate)} CA / {fmtK(ytd.profitAnnualRunRate)} profit), CT annuelle estimée à <strong>{fmtK(ytd.ctAnnualEstimate)}</strong>. À provisionner <strong>{fmtK(ytd.ctMonthlyProvision)}/mois</strong> dès septembre 2026 (12 mois jusqu'à échéance 30/09/2027).
            </p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm">
              <strong className="text-emerald-600">✅ Abattement 375k optimise la CT.</strong><br />
              Taux effectif sur l'EBITDA run-rate ≈ <strong>{fmtPct((ytd.ctAnnualEstimate / Math.max(1, ytd.profitAnnualRunRate)) * 100)}</strong> vs 9% théorique.
            </p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm">
              <strong className="text-amber-600">⚠️ À fiabiliser.</strong><br />
              Le split ventes par juridiction (UAE / France / autre UE) doit être consolidé chaque mois pour passer d'un estimatif (basé sur le mix Q4 2025) à une donnée réelle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
