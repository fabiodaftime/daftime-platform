import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { D, fmt, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

const typeColor: Record<string, string> = {
  primary: D.primary, success: D.green, accent: D.primary, warning: D.orange,
};

export function DigitCostsTab({ data }: Props) {
  const { costsKPIs, costsDetail, costsTotal, costsChartData, spyCostsKPIs, spyCostsBreakdown, spyCostsTotal, ctCostsKPIs, ctCostsBreakdown, ctCostsTotal } = data;

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

      <h2 className="digit-section-title">Digit Solution (Core Business)</h2>

      <div className="digit-card">
        <h3 className="digit-card-title">📋 Détail des Charges Digit</h3>
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

      {/* SPY Costs Section */}
      {spyCostsKPIs && (
        <>
          <h2 className="digit-section-title">SPY — Coûts Spécifiques</h2>
          <div className="digit-kpi-grid">
            {spyCostsKPIs.map((kpi: any, i: number) => (
              <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
                <div className="digit-metric-label">{kpi.label}</div>
                <div className="digit-metric-value">{kpi.value}</div>
                <div className="digit-metric-sub">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {spyCostsBreakdown && (
            <div className="digit-card">
              <h3 className="digit-card-title">📋 Breakdown SPY</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {spyCostsBreakdown.map((item: any, i: number) => (
                  <div key={i} className="digit-cost-row">
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 600, color: item.negative ? D.red : undefined }}>{item.value}</span>
                  </div>
                ))}
                <div className="digit-cost-row total">
                  <span>MARGE SPY</span>
                  <span>{spyCostsTotal}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CT Costs Section */}
      {ctCostsKPIs && (
        <>
          <h2 className="digit-section-title">Comment/Trust — Coûts Spécifiques</h2>
          <div className="digit-kpi-grid">
            {ctCostsKPIs.map((kpi: any, i: number) => (
              <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
                <div className="digit-metric-label">{kpi.label}</div>
                <div className="digit-metric-value">{kpi.value}</div>
                <div className="digit-metric-sub">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {ctCostsBreakdown && (
            <div className="digit-card">
              <h3 className="digit-card-title">📋 Breakdown Comment/Trust</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {ctCostsBreakdown.map((item: any, i: number) => (
                  <div key={i} className="digit-cost-row">
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 600, color: item.negative ? D.red : undefined }}>{item.value}</span>
                  </div>
                ))}
                <div className="digit-cost-row total">
                  <span>MARGE CT</span>
                  <span>{ctCostsTotal}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="digit-chart-container">
        <div className="digit-chart-title">Répartition des Charges (Digit Core)</div>
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
