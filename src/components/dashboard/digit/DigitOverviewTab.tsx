import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { D, PIE_COLORS, fmt, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

const typeColor: Record<string, string> = {
  primary: D.primary, success: D.green, accent: D.primary, warning: D.orange,
};

export function DigitOverviewTab({ data }: Props) {
  const { overviewKPIs, overviewProducts, overviewChartData, comparisonM1 } = data;

  return (
    <div>
      <h2 className="digit-section-title">Performance {data.monthLabel}</h2>
      <div className="digit-kpi-grid">
        {overviewKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
            {comparisonM1 && i === 0 && (
              <div className="digit-metric-comparison">
                <span className="digit-badge positive">+11.7%</span>
                <span style={{ fontSize: '0.75rem', color: D.textMuted }}>vs Janvier (+$15,751)</span>
              </div>
            )}
            {comparisonM1 && i === 1 && (
              <div className="digit-metric-comparison">
                <span className="digit-badge positive">+2.1%</span>
                <span style={{ fontSize: '0.75rem', color: D.textMuted }}>vs Janvier (+$955)</span>
              </div>
            )}
            {comparisonM1 && i === 2 && (
              <div className="digit-metric-comparison">
                <span className="digit-badge negative">-12</span>
                <span style={{ fontSize: '0.75rem', color: D.textMuted }}>vs Janvier (225 deals)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="digit-section-title">Répartition par Produit</h2>
      <div className="digit-kpi-grid">
        {overviewProducts.map((p, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[p.type] || D.primary }}>
            <div className="digit-metric-label">{p.label}</div>
            <div className="digit-metric-value">{p.value}</div>
            <div className="digit-metric-sub">{p.sub}</div>
            {p.chg && (
              <div className="digit-metric-comparison">
                <span className={`digit-badge ${p.chg.startsWith('+') ? 'positive' : 'negative'}`}>{p.chg}</span>
                <span style={{ fontSize: '0.75rem', color: D.textMuted }}>vs Janvier {p.chg.startsWith('+') && parseFloat(p.chg) > 50 ? '🚀' : p.chg.startsWith('-') ? '⚠️' : ''}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {overviewChartData && (
        <div className="digit-chart-container">
          <div className="digit-chart-title">Évolution CA & Marge (Janvier vs Février)</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={overviewChartData.labels.map((l, i) => ({ name: l, 'CA Total': overviewChartData.ca[i], 'Marge Totale': overviewChartData.marge[i] }))}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Bar dataKey="CA Total" fill={D.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Marge Totale" fill={D.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
