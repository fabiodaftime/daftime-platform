import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { D, YTD_PRODUCT_COLORS, fmt, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

export function DigitYTDTab({ data }: Props) {
  const { ytdMainKPIs, ytdMonthlyKPIs, ytdProductKPIs, ytdEvolutionData, ytdProductDistribution } = data;
  const typeColor: Record<string, string> = { primary: D.primary, success: D.green, accent: D.accent, warning: D.orange };

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
      <h2 className="digit-section-title">📈 Year-To-Date 2026</h2>
      {renderKPIs(ytdMainKPIs)}
      <h2 className="digit-section-title">📊 Évolution Mensuelle</h2>
      {renderKPIs(ytdMonthlyKPIs)}
      <h2 className="digit-section-title">🎯 Répartition par Produit (YTD)</h2>
      {renderKPIs(ytdProductKPIs)}
      <div className="digit-charts-grid">
        <div className="digit-chart-container">
          <div className="digit-chart-title">Évolution CA & Marge</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ytdEvolutionData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
              <Line type="monotone" dataKey="ca" name="CA" stroke={D.primary} strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="marge" name="Marge" stroke={D.accent} strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="digit-chart-container">
          <div className="digit-chart-title">Répartition CA YTD par Produit</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={ytdProductDistribution} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={45} outerRadius={85} paddingAngle={2}>
                {ytdProductDistribution.map((_, i) => <Cell key={i} fill={YTD_PRODUCT_COLORS[i]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
