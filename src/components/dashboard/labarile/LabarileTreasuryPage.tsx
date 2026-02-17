import { LabarileKPICard } from './LabarileKPICard';
import { LabarileChartContainer } from './LabarileChartContainer';
import { LabarileTreasuryDonut, LabarileDebtChart } from './LabarileCharts';
import { TREASURY_KPI, TREASURY_DETAIL, TREASURY_RATIOS, TVA_EU_Q4 } from './LabarileData';
import { cn } from '@/lib/utils';

export function LabarileTreasuryPage() {
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Trésorerie Banque" value={TREASURY_KPI.tresorerieBanque} subtext="Relevé bancaire 31/12" variant="primary" />
        <LabarileKPICard label="Stripe en attente" value={TREASURY_KPI.stripeEnAttente} subtext="Payout sous 2-3j" variant="success" />
        <LabarileKPICard label="Trésorerie Disponible" value={TREASURY_KPI.tresorerieDisponible} subtext="Hors provision TVA 150k" variant="success" />
        <LabarileKPICard label="Total Dettes" value={TREASURY_KPI.totalDettes} subtext="Incl. 150k TVA EU" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <LabarileChartContainer title="Composition Trésorerie">
          <LabarileTreasuryDonut />
        </LabarileChartContainer>
        <LabarileChartContainer title="Répartition des Dettes">
          <LabarileDebtChart />
        </LabarileChartContainer>
      </div>

      {/* Treasury Detail Table */}
      <div className="bg-labarile-white border border-labarile-border rounded-xl overflow-hidden">
        <h3 className="px-5 py-4 font-bebas text-lg lg:text-xl text-labarile-primary-dark tracking-wide">
          💰 Détail Trésorerie & Dettes au 31/12/2025
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-labarile-ice1 to-labarile-ice2">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">Poste</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">Montant (AED)</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {TREASURY_DETAIL.map((section, sIdx) => (
                <tr key={`section-${sIdx}`}>
                  <td colSpan={3} className={cn(
                    "px-4 py-2 font-bold text-sm",
                    section.section === 'ACTIFS' && "bg-emerald-50",
                    section.section === 'CRÉANCES' && "bg-emerald-50",
                    section.section === 'PASSIFS' && "bg-red-50",
                    section.section === 'PROVISION' && "bg-amber-50",
                  )}>
                    {section.section}
                  </td>
                </tr>
              )).flatMap((sectionRow, sIdx) => [
                sectionRow,
                ...TREASURY_DETAIL[sIdx].items.map((item, iIdx) => (
                  <tr key={`item-${sIdx}-${iIdx}`} className={cn(
                    "hover:bg-labarile-light-gray transition-colors",
                    (item as any).warning && "bg-amber-50",
                    (item as any).danger && "bg-red-50",
                  )}>
                    <td className={cn("px-4 py-3 text-sm border-t border-labarile-border", (item as any).bold && "font-bold")}>
                      {item.poste}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-sm border-t border-labarile-border text-right",
                      (item as any).bold && "font-bold",
                      (item as any).warning && "text-labarile-warning",
                      (item as any).danger && "text-red-600 font-bold",
                    )}>
                      {item.montant.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm border-t border-labarile-border text-labarile-muted">
                      {item.notes}
                    </td>
                  </tr>
                ))
              ])}
            </tbody>
          </table>
        </div>
      </div>

      {/* Treasury Ratios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TREASURY_RATIOS.map((ratio, idx) => (
          <div key={idx} className={cn(
            "bg-labarile-white rounded-xl p-5 border-2",
            ratio.color === 'warning' && "border-labarile-warning",
            ratio.color === 'danger' && "border-red-600",
            ratio.color === 'success' && "border-labarile-success",
          )}>
            <p className="text-xs text-labarile-muted mb-2">{ratio.label}</p>
            <p className={cn(
              "font-bebas text-3xl",
              ratio.color === 'warning' && "text-labarile-warning",
              ratio.color === 'danger' && "text-red-600",
              ratio.color === 'success' && "text-labarile-success",
            )}>
              {ratio.value}
            </p>
            <p className="text-xs text-labarile-muted mt-1">{ratio.sub}</p>
          </div>
        ))}
      </div>

      {/* TVA EU Analysis */}
      <div className="bg-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-4 tracking-wide">
          🇪🇺 Analyse TVA EU - Encaissements Q4 2025
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-labarile-ice1 rounded-lg p-4 text-center">
            <p className="text-xs text-labarile-muted mb-2">TVA Collectée Q4</p>
            <p className="font-bebas text-2xl text-labarile-primary">{TVA_EU_Q4.total.toLocaleString()} AED</p>
            <p className="text-xs text-labarile-muted mt-1">34,480 EUR</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <p className="text-xs text-labarile-muted mb-2">Provision Balance Sheet</p>
            <p className="font-bebas text-2xl text-amber-500">{TVA_EU_Q4.provision.toLocaleString()} AED</p>
            <p className="text-xs text-labarile-muted mt-1">Réservée</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <p className="text-xs text-labarile-muted mb-2">Écart</p>
            <p className="font-bebas text-2xl text-labarile-success">+{TVA_EU_Q4.ecart.toLocaleString()} AED</p>
            <p className="text-xs text-labarile-success mt-1">Provision suffisante</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-labarile-ice1">
                <th className="px-3 py-2 text-left text-xs font-bold border-b-2 border-labarile-border">Mois</th>
                <th className="px-3 py-2 text-right text-xs font-bold border-b-2 border-labarile-border">CA TTC Encaissé</th>
                <th className="px-3 py-2 text-right text-xs font-bold border-b-2 border-labarile-border">CA HT</th>
                <th className="px-3 py-2 text-right text-xs font-bold border-b-2 border-labarile-border">TVA Collectée</th>
              </tr>
            </thead>
            <tbody>
              {TVA_EU_Q4.months.map((m, idx) => (
                <tr key={idx} className="hover:bg-labarile-light-gray">
                  <td className="px-3 py-2 text-sm border-b border-labarile-border font-semibold">{m.month}</td>
                  <td className="px-3 py-2 text-sm border-b border-labarile-border text-right">{m.caTtc} AED</td>
                  <td className="px-3 py-2 text-sm border-b border-labarile-border text-right">{m.caHt} AED</td>
                  <td className="px-3 py-2 text-sm border-b border-labarile-border text-right font-bold">{m.tva} AED</td>
                </tr>
              ))}
              <tr className="bg-labarile-ice1">
                <td className="px-3 py-2 text-sm font-bold">TOTAL Q4 2025</td>
                <td className="px-3 py-2 text-sm text-right font-bold">914,864 AED</td>
                <td className="px-3 py-2 text-sm text-right font-bold">766,598 AED</td>
                <td className="px-3 py-2 text-sm text-right font-bold">148,266 AED</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-emerald-50 border-l-4 border-l-emerald-500 rounded-lg p-4">
          <p className="font-bold text-sm text-emerald-700 mb-2">✅ Validation Provision TVA</p>
          <ul className="ml-4 list-disc text-sm text-labarile-text space-y-1">
            <li>TVA calculée basée sur <strong>encaissements réels Q4</strong></li>
            <li>128 ventes France (TVA 20%) + 1 vente Belgique (TVA 21%) + 3 ventes B2B (pas de TVA)</li>
            <li>Provision de 150k AED couvre exactement la TVA Q4 (148.3k) + marge de 1.7k</li>
            <li>Les 150k doivent rester <strong>immobilisés</strong> jusqu'au paiement TVA EU</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
