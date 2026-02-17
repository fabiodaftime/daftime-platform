import { LabarileKPICard } from './LabarileKPICard';
import { LabarileChartContainer } from './LabarileChartContainer';
import { LabarileMonthlyCostsChart } from './LabarileCharts';
import { COSTS_Q4_SUMMARY, MONTHLY_COSTS, COSTS_Q4_DETAIL, COSTS_Q4_INSIGHTS, type Scenario } from './LabarileData';
import { cn } from '@/lib/utils';

interface LabarileCostsPageProps {
  scenario: Scenario;
}

export function LabarileCostsPage({ scenario }: LabarileCostsPageProps) {
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Total Charges Q4" value={COSTS_Q4_SUMMARY.totalCharges} subtext={COSTS_Q4_SUMMARY.totalChargesPct + ' du CA Q4'} />
        <LabarileKPICard label="Coaches Q4 Réel" value={COSTS_Q4_SUMMARY.coachesQ4} subtext={COSTS_Q4_SUMMARY.coachesPct + ' du CA'} variant="warning" />
        <LabarileKPICard label="Marketing Q4 Réel" value={COSTS_Q4_SUMMARY.marketingQ4} subtext={COSTS_Q4_SUMMARY.marketingPct + ' du CA'} variant="primary" />
        <LabarileKPICard label="Stripe Q4 Réel" value={COSTS_Q4_SUMMARY.stripeQ4} subtext={COSTS_Q4_SUMMARY.stripePct + ' du CA'} />
      </div>

      {/* Monthly Cost Charts with Comments */}
      {MONTHLY_COSTS.map((monthData, idx) => (
        <div key={idx} className="bg-labarile-white border border-labarile-border rounded-xl p-5 lg:p-7">
          <h3 className="font-bebas text-lg lg:text-xl text-labarile-title mb-4 tracking-wide">
            📊 {monthData.month} - Réel vs Prévu (CA: {(monthData.revenue / 1000).toFixed(1)} kAED)
          </h3>
          <LabarileMonthlyCostsChart actual={monthData.actual} revenue={monthData.revenue} scenario={scenario} />
          
          {/* Comments */}
          <div className={cn(
            "mt-4 rounded-lg p-4 border-l-4",
            monthData.commentType === 'warning' && "bg-amber-50 border-l-amber-500",
            monthData.commentType === 'success' && "bg-emerald-50 border-l-emerald-500",
            monthData.commentType === 'critical' && "bg-red-50 border-l-red-400",
          )}>
            <p className={cn(
              "font-bold text-sm mb-2",
              monthData.commentType === 'warning' && "text-amber-700",
              monthData.commentType === 'success' && "text-emerald-700",
              monthData.commentType === 'critical' && "text-red-700",
            )}>
              {monthData.commentTitle}
            </p>
            <ul className="space-y-1.5 ml-4 list-disc">
              {monthData.comments.map((comment, cidx) => (
                <li key={cidx} className="text-sm leading-relaxed text-labarile-text">{comment}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* Q4 Synthesis */}
      <div className="bg-gradient-to-br from-labarile-ice1 to-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary-dark mb-4 tracking-wide">
          📋 SYNTHÈSE Q4 2025 - COMPARATIF GLOBAL
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
            <p className="text-xs text-labarile-muted mt-1">46.3% du CA</p>
          </div>
          <div>
            <p className="text-sm font-bold text-labarile-title mb-1">EBITDA Q4:</p>
            <p className="font-bebas text-2xl text-labarile-success">701,431 AED</p>
            <p className="text-xs text-labarile-muted mt-1">53.7% marge</p>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-labarile-white rounded-lg p-4">
          <p className="font-bold text-sm text-labarile-title mb-3">🎯 Points Clés Q4:</p>
          <div className="space-y-2">
            {COSTS_Q4_INSIGHTS.map((insight, idx) => (
              <div key={idx} className={cn(
                "p-2 rounded-md text-sm",
                insight.type === 'warning' && "bg-amber-50",
                insight.type === 'success' && "bg-emerald-50",
                insight.type === 'info' && "bg-blue-50",
              )}>
                {insight.text}
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Charges Breakdown */}
        <div className="mt-4 bg-amber-50 border-l-4 border-l-amber-500 rounded-lg p-4">
          <p className="font-bold text-sm text-amber-700 mb-2">📊 Détail Charges Q4 par Catégorie:</p>
          <div className="text-sm text-labarile-text space-y-1">
            {COSTS_Q4_DETAIL.map((cat, idx) => (
              <div key={idx}>{cat.category}: {cat.amount} ({cat.pct}){cat.note ? ` — ${cat.note}` : ''}</div>
            ))}
            <div className="mt-2 pt-2 border-t border-amber-300 font-bold">TOTAL: 603.8k (46.3%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
