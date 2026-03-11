import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { D, REVENUE_PIE_COLORS, fmt, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

export function DigitRevenueTab({ data }: Props) {
  const { revenueKPIsRow1, revenueKPIsRow2, revenueByCategory, revenueDistribution } = data;
  const typeColor: Record<string, string> = { primary: D.primary, success: D.green, accent: D.accent, warning: D.orange };

  const renderKPIs = (items: { label: string; value: string; sub: string; type: string }[]) => (
    <div className="digit-kpi-grid">
      {items.map((kpi, i) => (
        <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] }}>
          <div className="digit-metric-label">{kpi.label}</div>
          <div className="digit-metric-value">{kpi.value}</div>
          <div className="digit-metric-sub">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {renderKPIs(revenueKPIsRow1)}
      <div style={{ marginTop: '1.5rem' }}>{renderKPIs(revenueKPIsRow2)}</div>
      <h2 className="digit-section-title">Répartition du CA</h2>
      <div className="digit-charts-grid">
        <div className="digit-chart-container">
          <div className="digit-chart-title">CA par Catégorie de Produit</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByCategory}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
              <Bar dataKey="value" fill={D.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="digit-chart-container">
          <div className="digit-chart-title">Distribution du CA</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={revenueDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}
                label={(e) => `${e.name}`} labelLine={{ stroke: D.textMuted }}>
                {revenueDistribution.map((_, i) => <Cell key={i} fill={REVENUE_PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
