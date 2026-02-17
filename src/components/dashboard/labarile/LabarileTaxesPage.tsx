import { LabarileKPICard } from './LabarileKPICard';
import { TAXES_KPI, TAXES_Q4_DETAIL, SCENARIOS, type Scenario } from './LabarileData';
import { cn } from '@/lib/utils';

interface LabarileTaxesPageProps {
  scenario: Scenario;
}

function computeCT(scenario: Scenario) {
  const ebitda = Math.round(scenario.total2026 * scenario.margins.operating / 100);
  const profit = Math.max(0, ebitda - 375);
  const ct = Math.round(profit * 0.09);
  const mensuel = Math.round(ct / 12);
  return { ebitda, profit, ct, mensuel };
}

function computeAllCT(scenarios: Record<string, Scenario>) {
  return [
    { key: 'prudent', scenario: 'Prudent', highlight: false, ...computeCT(scenarios.prudent || scenarios.base) },
    { key: 'base', scenario: 'Base', highlight: true, ...computeCT(scenarios.base) },
    { key: 'optimiste', scenario: 'Optimiste', highlight: false, ...computeCT(scenarios.optimiste || scenarios.base) },
  ];
}

export function LabarileTaxesPage({ scenario }: LabarileTaxesPageProps) {
  const ctRows = computeAllCT(SCENARIOS);
  const activeCT = computeCT(scenario);

  // Dynamic KPIs based on active scenario
  const provisionMensuelle = `${activeCT.mensuel}k AED/mois`;
  const besoinQ1 = `${230 + activeCT.mensuel}k AED/mois`;

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Total Taxes Q4 2025" value={TAXES_KPI.totalTaxesQ4} subtext="Corporate + TVA UAE + TVA EU" variant="primary" />
        <LabarileKPICard label="TVA EU Q4" value={TAXES_KPI.tvaEuQ4} subtext="85% du total taxes" variant="warning" />
        <LabarileKPICard label="Provision CT Mensuelle" value={provisionMensuelle} subtext={`Scénario ${scenario.name} (Sep 26 - Août 27)`} variant="warning" />
        <LabarileKPICard label="Besoin Total Q1" value={besoinQ1} subtext={`Burn 230k + CT ${activeCT.mensuel}k`} variant="warning" />
      </div>

      {/* Q4 Taxes Recap */}
      <div className="bg-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-4 tracking-wide">
          📊 Taxes Q4 2025 - Récapitulatif
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

      {/* Corporate Tax by Scenario - Dynamic */}
      <div className="bg-labarile-white border-2 border-blue-500 rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-blue-600 mb-4 tracking-wide">
          💰 Corporate Tax 2026 — Provisions par Scénario
        </h3>

        <div className="bg-blue-50 border-l-4 border-l-blue-500 rounded-lg p-4 mb-5">
          <p className="text-sm text-blue-800">
            <strong>📅 Échéance:</strong> La Corporate Tax 2026 est due au <strong>30/09/2027</strong>. Les provisions s'étalent sur 12 mois, de <strong>septembre 2026 à août 2027</strong> pour un paiement complet en septembre 2027. Aucune provision CT à prévoir avant septembre 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {ctRows.map((row, idx) => {
            const colors = [
              { bg: 'bg-orange-100', text: 'text-orange-600', border: '' },
              { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-2 border-blue-500' },
              { bg: 'bg-emerald-100', text: 'text-emerald-600', border: '' },
            ];
            const c = colors[idx];
            return (
              <div key={row.key} className={cn(c.bg, c.border, "rounded-lg p-4 text-center")}>
                <p className={cn("text-xs font-semibold mb-2", c.text)}>{row.scenario.toUpperCase()}</p>
                <p className={cn("font-bebas text-2xl", c.text)}>{row.mensuel}k AED</p>
                <p className="text-xs text-labarile-muted mt-1">CT/mois (Sep 26 - Août 27)</p>
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-labarile-ice1">
                <th className="px-3 py-3 text-left text-xs font-bold border-b-2 border-labarile-border">Scénario</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">EBITDA 2026</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Profit Imposable</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Corporate Tax</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Provision/mois (×12)</th>
              </tr>
            </thead>
            <tbody>
              {ctRows.map((row) => (
                <tr key={row.key} className={cn("hover:bg-labarile-light-gray", row.highlight && "bg-labarile-ice1")}>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border font-semibold">{row.scenario}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.ebitda.toLocaleString()}k AED</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.profit.toLocaleString()}k AED</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.ct.toLocaleString()}k AED</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.mensuel}k/mois</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Points - Dynamic */}
      <div className="bg-gradient-to-br from-labarile-ice1 to-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-4 tracking-wide">
          📌 Points Clés Fiscalité
        </h3>
        <div className="space-y-3">
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm"><strong className="text-labarile-primary">💰 TVA EU = Poste Principal</strong><br/>
            Représente 79% des provisions taxes. Paiement trimestriel. À provisionner chaque mois sans exception.</p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm"><strong className="text-labarile-success">✅ Abattement 375k Optimise Corporate Tax</strong><br/>
            Réduit significativement la charge. Taux effectif ~{((activeCT.ct / activeCT.ebitda) * 100).toFixed(1)}% vs 9% théorique (scénario {scenario.name}).</p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm"><strong className="text-blue-600">📊 Besoin Total Mensuel Q1 2026</strong><br/>
            230k burn + {activeCT.mensuel}k CT = <strong>{230 + activeCT.mensuel}k AED/mois</strong> (scénario {scenario.name}). Pas de provision CT avant septembre 2026.</p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm"><strong className="text-amber-600">⚠️ Provisions Obligatoires</strong><br/>
            TVA UAE mensuelle, TVA EU trimestrielle. Corporate Tax: provisionnement de <strong>septembre 2026 à août 2027</strong> (12 mois, échéance 30/09/2027). Ne JAMAIS utiliser provisions pour autre chose.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
