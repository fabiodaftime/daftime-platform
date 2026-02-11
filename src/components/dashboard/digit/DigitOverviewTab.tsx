import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { D, overviewKPIs, waterfallOverview, economicSplit, PIE_COLORS, fmt } from './DigitData';

export function DigitOverviewTab() {
  const colorMap: Record<string, string> = {
    green: D.green, red: D.red, orange: D.orange, neutral: D.textMuted, accent: D.accent,
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
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
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
              <Pie data={economicSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}
                label={(e) => `${e.name.split(' ')[0]} ${(e.percent * 100).toFixed(0)}%`} labelLine={{ stroke: D.textMuted }}>
                {economicSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
