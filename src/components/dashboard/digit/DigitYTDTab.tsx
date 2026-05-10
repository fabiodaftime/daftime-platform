import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { D, YTD_PRODUCT_COLORS, fmt, type DigitMonthData, type DigitMonthId } from './DigitData';
import { DigitYTDValidationPanel } from './DigitYTDValidationPanel';

interface Props { data: DigitMonthData; month?: DigitMonthId; }

const typeColor: Record<string, string> = {
  primary: D.primary, success: D.green, accent: D.primary, warning: D.orange,
};

export function DigitYTDTab({ data }: Props) {
  const { ytdMainKPIs, ytdMonthlyKPIs, ytdProductKPIs, ytdEvolutionData, ytdProductDistribution } = data;

  return (
    <div>
      <h2 className="digit-section-title">Year-To-Date 2026 ({ytdMainKPIs[0]?.sub || ''})</h2>
      <div className="digit-kpi-grid">
        {ytdMainKPIs.map((kpi, i) => (
          <div key={i} className="digit-ytd-card">
            <div className="digit-ytd-label">{kpi.label}</div>
            <div className="digit-ytd-value">{kpi.value}</div>
            <div className="digit-ytd-detail">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <h2 className="digit-section-title">Détail Mensuel</h2>
      <div className="digit-kpi-grid">
        {ytdMonthlyKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <h2 className="digit-section-title">Répartition par Produit (YTD)</h2>
      <div className="digit-kpi-grid">
        {ytdProductKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="digit-charts-grid">
        <div className="digit-chart-container">
          <div className="digit-chart-title">Évolution Mensuelle YTD</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ytdEvolutionData}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
              <Line type="monotone" dataKey="ca" name="CA" stroke={D.primary} strokeWidth={3} dot={{ r: 6, fill: D.primary, strokeWidth: 2, stroke: '#fff' }} />
              <Line type="monotone" dataKey="marge" name="Marge" stroke={D.green} strokeWidth={3} dot={{ r: 6, fill: D.green, strokeWidth: 2, stroke: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="digit-chart-container">
          <div className="digit-chart-title">Répartition CA par Produit (YTD)</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={ytdProductDistribution} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={95} paddingAngle={3}>
                {ytdProductDistribution.map((_, i) => <Cell key={i} fill={YTD_PRODUCT_COLORS[i]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
