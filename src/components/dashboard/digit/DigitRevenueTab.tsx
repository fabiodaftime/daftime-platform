import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { D, REVENUE_PIE_COLORS, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

const typeColor: Record<string, string> = {
  primary: D.primary, success: D.green, accent: D.primary, warning: D.orange,
};

export function DigitRevenueTab({ data }: Props) {
  const { revenueKPIs, revenueComparison, revenueDistribution } = data;

  return (
    <div>
      <h2 className="digit-section-title">Analyse CA — {data.monthLabel}</h2>
      <div className="digit-kpi-grid">
        {revenueKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="digit-chart-container">
        <div className="digit-chart-title">Répartition CA par Produit</div>
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Pie data={revenueDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3}
              label={(e) => `${e.name}`} labelLine={{ stroke: D.textMuted }}>
              {revenueDistribution.map((_, i) => <Cell key={i} fill={REVENUE_PIE_COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {revenueComparison && (
        <div className="digit-card">
          <h3 className="digit-card-title">📊 Comparaison M-1 (Janvier 2026)</h3>
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div><strong>Setup :</strong> {revenueComparison.setup}</div>
            <div><strong>Ad Account :</strong> {revenueComparison.ad}</div>
            <div><strong>SPY :</strong> {revenueComparison.spy}</div>
            <div><strong>Comment/Trust :</strong> {revenueComparison.ct}</div>
          </div>
        </div>
      )}
    </div>
  );
}
