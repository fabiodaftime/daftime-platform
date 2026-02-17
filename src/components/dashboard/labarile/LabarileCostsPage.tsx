import { LabarileKPICard } from './LabarileKPICard';
import { LabarileChartContainer } from './LabarileChartContainer';
import { LabarileMonthlyCostsChart } from './LabarileCharts';
import { MONTHLY_COSTS, COSTS_Q4_DETAIL, type Scenario, type MonthlyCostData } from './LabarileData';
import { cn } from '@/lib/utils';

interface LabarileCostsPageProps {
  scenario: Scenario;
}

// Generate dynamic comments based on actual data vs scenario targets
function generateDynamicComments(monthData: MonthlyCostData, scenario: Scenario): string[] {
  const rev = monthData.revenue;
  const act = monthData.actual;
  const comments: string[] = [];

  const items: { label: string; actual: number; target: number; key: string }[] = [
    { label: 'Coaches', actual: act.coaches, target: scenario.costs.coaches, key: 'coaches' },
    { label: 'Marketing', actual: act.marketing, target: scenario.costs.marketing, key: 'marketing' },
    { label: 'IT & Tools', actual: act.it, target: scenario.costs.tools, key: 'it' },
    { label: 'Stripe/Fees', actual: act.stripe, target: scenario.costs.stripe, key: 'stripe' },
    { label: 'Admin', actual: act.admin, target: scenario.costs.admin, key: 'admin' },
  ];

  if (act.autres > 0) {
    items.push({ label: 'Autres', actual: act.autres, target: 0, key: 'autres' });
  }

  for (const item of items) {
    if (item.actual === 0 && item.target === 0) continue;
    const pctActual = (item.actual / rev * 100).toFixed(1);
    const amountK = (item.actual / 1000).toFixed(1);
    const diff = parseFloat(pctActual) - item.target;

    if (diff > 3) {
      comments.push(`⚠️ ${item.label} (${pctActual}% vs ${item.target}% prévu): ${amountK}k — nettement au-dessus du target de +${diff.toFixed(1)} pts. À optimiser.`);
    } else if (diff > 0.5) {
      comments.push(`⚠️ ${item.label} (${pctActual}% vs ${item.target}% prévu): ${amountK}k — légèrement au-dessus du target.`);
    } else if (diff >= -0.5) {
      comments.push(`✅ ${item.label} (${pctActual}% vs ${item.target}% prévu): ${amountK}k — conforme aux attentes.`);
    } else if (diff >= -3) {
      comments.push(`🟢 ${item.label} (${pctActual}% vs ${item.target}% prévu): ${amountK}k — légèrement en dessous du target. Bonne optimisation.`);
    } else if (item.actual > 0) {
      comments.push(`🟢 ${item.label} (${pctActual}% vs ${item.target}% prévu): ${amountK}k — nettement en dessous du target de ${Math.abs(diff).toFixed(1)} pts. Excellente maîtrise.`);
    }
  }

  const totalCharges = Object.values(act).reduce((a, b) => a + b, 0);
  const totalPct = (totalCharges / rev * 100).toFixed(1);
  const ebitdaPct = (100 - parseFloat(totalPct)).toFixed(1);
  comments.push(`📌 Conclusion: Charges totales ${totalPct}% — Marge EBITDA ${ebitdaPct}%.`);

  return comments;
}

function getDynamicCommentType(monthData: MonthlyCostData, scenario: Scenario): 'warning' | 'success' | 'critical' {
  const rev = monthData.revenue;
  const totalCharges = Object.values(monthData.actual).reduce((a, b) => a + b, 0);
  const totalPct = totalCharges / rev * 100;
  const totalTarget = scenario.costs.coaches + scenario.costs.marketing + scenario.costs.stripe + scenario.costs.tools + scenario.costs.admin;

  if (totalPct > totalTarget + 15) return 'critical';
  if (totalPct > totalTarget + 5) return 'warning';
  return 'success';
}

export function LabarileCostsPage({ scenario }: LabarileCostsPageProps) {
  // Compute dynamic Q4 summary from scenario
  const totalCostsTarget = scenario.costs.coaches + scenario.costs.marketing + scenario.costs.stripe + scenario.costs.tools + scenario.costs.admin;
  const ebitdaTarget = (100 - totalCostsTarget).toFixed(1);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Target Charges Total" value={`${totalCostsTarget.toFixed(1)}%`} subtext={`Scénario ${scenario.name}`} />
        <LabarileKPICard label="Target Coaches" value={`${scenario.costs.coaches}%`} subtext="% du CA prévu" variant="warning" />
        <LabarileKPICard label="Target Marketing" value={`${scenario.costs.marketing}%`} subtext="% du CA prévu" variant="primary" />
        <LabarileKPICard label="Target EBITDA" value={`${ebitdaTarget}%`} subtext="Marge opérationnelle visée" variant="success" />
      </div>

      {/* Monthly Cost Charts with Dynamic Comments */}
      {MONTHLY_COSTS.map((monthData, idx) => {
        const dynamicComments = generateDynamicComments(monthData, scenario);
        const commentType = getDynamicCommentType(monthData, scenario);

        return (
          <div key={idx} className="bg-labarile-white border border-labarile-border rounded-xl p-5 lg:p-7">
            <h3 className="font-bebas text-lg lg:text-xl text-labarile-title mb-4 tracking-wide">
              📊 {monthData.month} - Réel vs Prévu [{scenario.name}] (CA: {(monthData.revenue / 1000).toFixed(1)} kAED)
            </h3>
            <LabarileMonthlyCostsChart actual={monthData.actual} revenue={monthData.revenue} scenario={scenario} />
            
            {/* Dynamic Comments based on scenario */}
            <div className={cn(
              "mt-4 rounded-lg p-4 border-l-4",
              commentType === 'warning' && "bg-amber-50 border-l-amber-500",
              commentType === 'success' && "bg-emerald-50 border-l-emerald-500",
              commentType === 'critical' && "bg-red-50 border-l-red-400",
            )}>
              <p className={cn(
                "font-bold text-sm mb-2",
                commentType === 'warning' && "text-amber-700",
                commentType === 'success' && "text-emerald-700",
                commentType === 'critical' && "text-red-700",
              )}>
                💬 Analyse vs Scénario {scenario.name} ({totalCostsTarget.toFixed(1)}% charges cibles):
              </p>
              <ul className="space-y-1.5 ml-4 list-disc">
                {dynamicComments.map((comment, cidx) => (
                  <li key={cidx} className="text-sm leading-relaxed text-labarile-text">{comment}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}

      {/* Q4 Synthesis - Dynamic */}
      <div className="bg-gradient-to-br from-labarile-ice1 to-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary-dark mb-4 tracking-wide">
          📋 SYNTHÈSE Q4 2025 - vs Scénario {scenario.name}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          <div>
            <p className="text-sm font-bold text-labarile-title mb-1">CA Total Q4 Ajusté:</p>
            <p className="font-bebas text-2xl text-labarile-primary">1,305,177 AED</p>
            <p className="text-xs text-labarile-muted mt-1">+52,977 AED revenus non comptabilisés (Dec)</p>
          </div>
          <div>
            <p className="text-sm font-bold text-labarile-title mb-1">Charges Totales Q4:</p>
            <p className="font-bebas text-2xl text-labarile-warning">603,769 AED</p>
            <p className="text-xs text-labarile-muted mt-1">46.3% du CA (target: {totalCostsTarget.toFixed(1)}%)</p>
          </div>
          <div>
            <p className="text-sm font-bold text-labarile-title mb-1">EBITDA Q4:</p>
            <p className="font-bebas text-2xl text-labarile-success">701,431 AED</p>
            <p className="text-xs text-labarile-muted mt-1">53.7% marge (target: {ebitdaTarget}%)</p>
          </div>
        </div>

        {/* Dynamic Key Insights */}
        <div className="bg-labarile-white rounded-lg p-4">
          <p className="font-bold text-sm text-labarile-title mb-3">🎯 Points Clés Q4 vs Scénario {scenario.name}:</p>
          <div className="space-y-2">
            {46.3 > totalCostsTarget ? (
              <div className="p-2 rounded-md text-sm bg-amber-50">
                ⚠️ Charges Q4 (46.3%) au-dessus du target {scenario.name} ({totalCostsTarget.toFixed(1)}%). Écart de +{(46.3 - totalCostsTarget).toFixed(1)} pts — principalement dû aux charges setup UAE d'octobre.
              </div>
            ) : (
              <div className="p-2 rounded-md text-sm bg-emerald-50">
                ✅ Charges Q4 (46.3%) conformes ou inférieures au target {scenario.name} ({totalCostsTarget.toFixed(1)}%).
              </div>
            )}
            <div className="p-2 rounded-md text-sm bg-emerald-50">
              ✅ Marge EBITDA Q4: 53.7% {parseFloat(ebitdaTarget) <= 53.7 ? `— supérieure au target ${ebitdaTarget}%` : `— inférieure au target ${ebitdaTarget}%`}. Novembre meilleur mois : 60.6%.
            </div>
            <div className="p-2 rounded-md text-sm bg-blue-50">
              💡 Performance solide — CA 1.3M + marge &gt;53% = base excellente pour atteindre l'objectif {scenario.total2026.toLocaleString()}k AED en 2026.
            </div>
          </div>
        </div>

        {/* Detailed Charges Breakdown */}
        <div className="mt-4 bg-amber-50 border-l-4 border-l-amber-500 rounded-lg p-4">
          <p className="font-bold text-sm text-amber-700 mb-2">📊 Détail Charges Q4 par Catégorie:</p>
          <div className="text-sm text-labarile-text space-y-1">
            {COSTS_Q4_DETAIL.map((cat, idx) => (
              <div key={idx}>{cat.category}: {cat.amount} ({cat.pct}){cat.note ? ` — ${cat.note}` : ''}</div>
            ))}
            <div className="mt-2 pt-2 border-t border-amber-300 font-bold">TOTAL: 603.8k (46.3%) — Target: {totalCostsTarget.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
