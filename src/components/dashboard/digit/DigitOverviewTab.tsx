import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { D, overviewKPIs, waterfallOverview, economicSplit, chargesDetail, PIE_COLORS, fmt } from './DigitData';

export function DigitOverviewTab() {
  const colorMap: Record<string, string> = {
    green: D.green, red: D.red, orange: D.orange, neutral: D.textMuted, accent: D.accent, indigo: D.indigo, neutralLight: "#9ca3af",
  };

  const barData = waterfallOverview.map(w => ({
    name: w.label,
    value: Math.abs(w.value),
    fill: colorMap[w.color],
  }));

  const typeColor: Record<string, string> = {
    primary: D.primary, success: D.green, accent: D.accent, warning: D.orange,
  };

  return (
    <div>
      <div className="digit-kpi-grid">
        {overviewKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <h2 className="digit-section-title">Performance Globale</h2>
      <div className="digit-charts-grid">
        <div className="digit-chart-container">
          <div className="digit-chart-title">Waterfall : Du CA à la Marge</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="digit-chart-container">
          <div className="digit-chart-title">Répartition Économique</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={economicSplit} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={45} outerRadius={85} paddingAngle={2}>
                {economicSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Détail des Charges */}
      <div className="digit-chart-container" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: D.primary, marginBottom: 16 }}>💡 Détail des Charges</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {chargesDetail.map((item, i) => (
            <div key={i}>
              <strong style={{ color: item.color }}>{item.label} ({item.value})</strong><br />
              <span style={{ fontSize: 14, color: D.textSecondary }}>{item.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
