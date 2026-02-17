import { LabarileKPICard } from './LabarileKPICard';
import { TAXES_KPI, TAXES_Q4_DETAIL, CT_BY_SCENARIO } from './LabarileData';
import { cn } from '@/lib/utils';

export function LabarileTaxesPage() {
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Total Taxes Q4 2025" value={TAXES_KPI.totalTaxesQ4} subtext="Corporate + TVA UAE + TVA EU" variant="primary" />
        <LabarileKPICard label="TVA EU Q4" value={TAXES_KPI.tvaEuQ4} subtext="85% du total taxes" variant="warning" />
        <LabarileKPICard label="Provision Mensuelle 2026" value={TAXES_KPI.provisionMensuelle2026} subtext="Scénario Optimiste" variant="warning" />
        <LabarileKPICard label="Besoin Total Q1" value={TAXES_KPI.besoinTotalQ1} subtext="Burn 230k + Taxes 122k" variant="warning" />
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
              {TAXES_Q4_DETAIL.map((tax, idx) => (
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

      {/* Corporate Tax by Scenario */}
      <div className="bg-labarile-white border-2 border-blue-500 rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-blue-600 mb-4 tracking-wide">
          💰 Provisions Mensuelles 2026 par Scénario
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-orange-100 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold text-orange-600 mb-2">PRUDENT</p>
            <p className="font-bebas text-2xl text-orange-600">88k AED</p>
            <p className="text-xs text-labarile-muted mt-1">Total taxes/mois</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-4 text-center border-2 border-blue-500">
            <p className="text-xs font-semibold text-blue-600 mb-2">BASE</p>
            <p className="font-bebas text-2xl text-blue-600">100k AED</p>
            <p className="text-xs text-labarile-muted mt-1">Total taxes/mois</p>
          </div>
          <div className="bg-emerald-100 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold text-emerald-600 mb-2">OPTIMISTE</p>
            <p className="font-bebas text-2xl text-emerald-600">122k AED</p>
            <p className="text-xs text-labarile-muted mt-1">Total taxes/mois</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-labarile-ice1">
                <th className="px-3 py-3 text-left text-xs font-bold border-b-2 border-labarile-border">Scénario</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">EBITDA 2026</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Profit Imposable</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Corporate Tax</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Mensuel</th>
              </tr>
            </thead>
            <tbody>
              {CT_BY_SCENARIO.map((row, idx) => (
                <tr key={idx} className={cn("hover:bg-labarile-light-gray", row.highlight && "bg-labarile-ice1")}>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border font-semibold">{row.scenario}</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.ebitda} AED</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.profit} AED</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.ct} AED</td>
                  <td className="px-3 py-3 text-sm border-b border-labarile-border text-right">{row.mensuel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Points */}
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
            Réduit significativement la charge. Taux effectif ~7-8% vs 9% théorique.</p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm"><strong className="text-blue-600">📊 Besoin Total Mensuel Q1 2026</strong><br/>
            230k burn + 122k taxes = <strong>352k AED/mois</strong> en scénario optimiste.</p>
          </div>
          <div className="bg-labarile-white rounded-lg p-3">
            <p className="text-sm"><strong className="text-amber-600">⚠️ Provisions Obligatoires</strong><br/>
            TVA UAE mensuelle, TVA EU trimestrielle, Corporate Tax annuelle. Ne JAMAIS utiliser provisions pour autre chose.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
