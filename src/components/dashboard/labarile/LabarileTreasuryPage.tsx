import { LabarileKPICard } from './LabarileKPICard';
import { LabarileChartContainer } from './LabarileChartContainer';
import { LabarileTreasuryDonut, LabarileDebtChart } from './LabarileCharts';
import { TREASURY_DETAIL, TREASURY_RATIOS, TVA_EU_Q4 } from './LabarileData';
import { cn } from '@/lib/utils';

export function LabarileTreasuryPage() {
  // Position trésorerie fin avril 2026 (estimée d'après brief client + EBITDA YTD)
  const TRESO_FIN_AVRIL_AED = 1_500_000;
  const DISTRIBUTABLE_PCT = 60;
  const DISTRIBUTABLE_AED = Math.round(TRESO_FIN_AVRIL_AED * (DISTRIBUTABLE_PCT / 100));

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Trésorerie au 30/04/2026" value="≈ 1 500 kAED" subtext="Estimation brief client — à valider sur relevés bancaires consolidés" variant="primary" />
        <LabarileKPICard label="Provision TVA (Saving)" value="150 kAED" subtext="Bloqué Wio Saving — couverture TVA EU/UAE" variant="warning" />
        <LabarileKPICard label="Tréso opérationnelle" value="≈ 1 350 kAED" subtext="Disponible hors provision TVA" variant="success" />
        <LabarileKPICard label="Capacité distributive" value={`≈ ${Math.round(DISTRIBUTABLE_AED / 1000)} kAED`} subtext={`~${DISTRIBUTABLE_PCT}% de la tréso fin avril (Luc + Simon)`} variant="success" />
      </div>

      {/* Bandeau capacité distributive Luc/Simon */}
      <div className="bg-gradient-to-br from-emerald-50 to-amber-50 border-l-4 border-l-emerald-500 rounded-lg p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="font-bold text-sm text-emerald-700">💎 Capacité de sortie en salaire / dividende — Luc & Simon</p>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">À arbitrer</span>
        </div>
        <p className="text-sm text-labarile-text leading-relaxed">
          Position trésorerie estimée au 30/04/2026 : <strong>~{(TRESO_FIN_AVRIL_AED / 1000).toLocaleString('fr-FR')} kAED</strong>.
          Après mise de côté de la provision TVA bloquée (150k) et d'un coussin opérationnel (~2 mois de charges variables), une enveloppe d'environ <strong>{DISTRIBUTABLE_PCT}% de la tréso disponible</strong> peut être envisagée en sortie associés.
          <br />
          <span className="inline-block mt-2 px-3 py-1.5 rounded-md bg-white border border-emerald-200 font-bebas text-lg text-emerald-700">
            ≈ {DISTRIBUTABLE_AED.toLocaleString('fr-FR')} AED sortables (salaire + dividende, à répartir Luc/Simon)
          </span>
          <br />
          <span className="text-xs text-labarile-muted">
            📌 Arbitrage à faire : <strong>mix salaire/dividende</strong> en fonction de l'optimisation fiscale UAE (CT 9% au-delà de 375k AED de profit) et de la résidence fiscale des associés. À confirmer avec le tax advisor avant exécution.
          </span>
        </p>
      </div>

      <div className="bg-emerald-50 border-l-4 border-l-emerald-500 rounded-lg p-4">
        <p className="font-bold text-sm text-emerald-700 mb-1">💡 Évolution trésorerie depuis le 31/12/2025</p>
        <p className="text-sm text-labarile-text">
          De ~500k AED (31/12/2025) à ~1 500k AED (30/04/2026) : <strong>+1 000k AED</strong> en 4 mois, en phase avec l'EBITDA YTD 2026 (~1 457k AED) net des paiements TVA (~360k AED) et besoins de fonctionnement. Le détail historique ci-dessous reste celui du 31/12/2025 pour traçabilité.
        </p>
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
