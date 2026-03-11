import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { D, fmt, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

export function DigitCostsTab({ data }: Props) {
  const { costsKPIs, blinkDetail, fullWaterfall } = data;
  const typeColor: Record<string, string> = { primary: D.primary, success: D.green, accent: D.accent, warning: D.orange, indigo: D.indigo };
  const colorMap: Record<string, string> = { green: D.green, red: D.red, orange: D.orange, neutral: D.textMuted, accent: D.accent, indigo: D.indigo, neutralLight: "#9ca3af" };

  const barData = fullWaterfall.map(w => ({ name: w.label, value: Math.abs(w.value), fill: colorMap[w.color] }));

  const renderKPIs = (items: { label: string; value: string; sub: string; type: string }[]) => (
    <div className="digit-kpi-grid">
      {items.map((kpi, i) => (
        <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
          <div className="digit-metric-label">{kpi.label}</div>
          <div className="digit-metric-value">{kpi.value}</div>
          <div className="digit-metric-sub">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {renderKPIs(costsKPIs)}
      <h2 className="digit-section-title">Détail Blink Commission</h2>
      {renderKPIs(blinkDetail)}
      <h2 className="digit-section-title">Waterfall des Charges</h2>
      <div className="digit-chart-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="digit-chart-title">Du CA à la Marge - Détail de toutes les charges</div>
        <ResponsiveContainer width="100%" height={300}>
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
    </div>
  );
}
