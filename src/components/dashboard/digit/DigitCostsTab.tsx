import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { D, costsKPIs, costsKPIs2, fullWaterfall, fmt } from './DigitData';

export function DigitCostsTab() {
  const typeColor: Record<string, string> = {
    primary: D.primary, success: D.green, accent: D.accent, warning: D.orange, indigo: D.indigo,
  };

  const colorMap: Record<string, string> = {
    green: D.green, red: D.red, orange: D.orange, neutral: D.textMuted, accent: D.accent, indigo: D.indigo,
  };

  const barData = fullWaterfall.map(w => ({
    name: w.label,
    value: Math.abs(w.value),
    fill: colorMap[w.color],
  }));

  return (
    <div>
      <div className="digit-kpi-grid">
        {costsKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="digit-kpi-grid" style={{ marginTop: 16 }}>
        {costsKPIs2.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <h2 className="digit-section-title">Du CA au Profit Net</h2>
      <div className="digit-chart-container" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="digit-chart-title">Waterfall Complet : CA → Company Margin → Profit Net</div>
        <ResponsiveContainer width="100%" height={300}>
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
    </div>
  );
}
