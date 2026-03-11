import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { D, fmt, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

const typeColor: Record<string, string> = {
  primary: D.primary, success: D.green, accent: D.primary, warning: D.orange,
};

export function DigitCostsTab({ data }: Props) {
  const { costsKPIs, costsDetail, costsTotal, costsChartData } = data;

  const chartLabels = ['Provider', 'To Blink', 'Salary', 'Business Exp', 'Tools', 'Fees', 'Other'];

  return (
    <div>
      <h2 className="digit-section-title">Analyse Charges — {data.monthLabel}</h2>
      <div className="digit-kpi-grid">
        {costsKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="digit-card">
        <h3 className="digit-card-title">📋 Détail des Charges</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {costsDetail.map((item, i) => (
            <div key={i} className="digit-cost-row">
              <span>{item.label}</span>
              <span style={{ fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
          <div className="digit-cost-row total">
            <span>TOTAL COST</span>
            <span>{costsTotal}</span>
          </div>
        </div>
      </div>

      <div className="digit-chart-container">
        <div className="digit-chart-title">Répartition des Charges</div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartLabels.map((l, i) => ({ name: l, value: costsChartData[i] }))} layout="vertical">
            <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fontWeight: 600 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} width={110} />
            <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
            <Bar dataKey="value" fill={D.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
