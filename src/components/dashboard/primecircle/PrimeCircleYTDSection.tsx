import { formatCurrency, type PCMonthData } from './PrimeCircleData';

interface Props { data: PCMonthData; }

export function PrimeCircleYTDSection({ data }: Props) {
  const { ytdData, monthlyComparison } = data;

  return (
    <>
      <div className="pc-section-title">Year-to-Date</div>
      <div className="pc-ytd-grid">
        <div className="pc-ytd-card">
          <div className="pc-kpi-label">YTD Customers</div>
          <div className="pc-kpi-value">{ytdData.customers}</div>
          <div className="pc-kpi-detail">Total services delivered</div>
        </div>
        <div className="pc-ytd-card">
          <div className="pc-kpi-label">YTD Turnover</div>
          <div className="pc-kpi-value">{formatCurrency(ytdData.turnover)}</div>
          <div className="pc-kpi-detail">Avg. {formatCurrency(ytdData.avgPerMonth)} / month</div>
        </div>
        <div className="pc-ytd-card">
          <div className="pc-kpi-label">YTD Net Profit</div>
          <div className="pc-kpi-value">{formatCurrency(ytdData.netProfit)}</div>
          <div className="pc-kpi-detail">{ytdData.netMarginRate}% avg net margin</div>
        </div>
        <div className="pc-ytd-card">
          <div className="pc-kpi-label">YTD Costs</div>
          <div className="pc-kpi-value">{formatCurrency(ytdData.costs)}</div>
          <div className="pc-kpi-detail">{ytdData.costsPct}% of turnover</div>
        </div>
      </div>

      <div className="pc-comparison-card">
        <h3>📊 Monthly Comparison</h3>
        <table className="pc-comparison-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Customers</th>
              <th>Turnover</th>
              <th>Total Costs</th>
              <th>Net Profit</th>
              <th>Net Margin</th>
              <th>Var. Profit</th>
            </tr>
          </thead>
          <tbody>
            {monthlyComparison.map((m, i) => (
              <tr key={i} style={m.isExclRow ? { background: 'rgba(124, 58, 237, 0.05)' } : undefined}>
                <td className="pc-month-label" style={m.isExclRow ? { fontSize: '12px', color: '#8899A6' } : undefined}>{m.month}</td>
                <td style={m.isExclRow ? { color: '#8899A6' } : undefined}>{m.customers}</td>
                <td className={`pc-amount ${m.isExclRow ? '' : 'turnover'}`} style={m.isExclRow ? { color: '#8899A6' } : undefined}>{formatCurrency(m.turnover)}</td>
                <td className="pc-amount" style={m.isExclRow ? { color: '#8899A6' } : undefined}>{formatCurrency(m.totalCosts)}</td>
                <td className={`pc-amount ${m.isExclRow ? '' : 'margin'}`} style={m.isExclRow ? { color: '#7C3AED' } : undefined}>{formatCurrency(m.netProfit)}</td>
                <td style={m.isExclRow ? { color: '#7C3AED' } : undefined}>{m.netMarginRate}%</td>
                <td>
                  {m.varProfit != null ? (
                    <span className={`pc-var-badge ${m.varProfitDirection || (m.varProfit >= 0 ? 'positive' : 'negative')}`}>
                      {m.varProfit >= 0 ? '▲' : '▼'} {m.varProfit >= 0 ? '+' : ''}{m.varProfit}%
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
            <tr className="pc-ytd-row">
              <td className="pc-month-label">YTD TOTAL</td>
              <td><strong>{ytdData.customers}</strong></td>
              <td className="pc-amount turnover"><strong>{formatCurrency(ytdData.turnover)}</strong></td>
              <td className="pc-amount"><strong>{formatCurrency(ytdData.costs)}</strong></td>
              <td className="pc-amount margin"><strong>{formatCurrency(ytdData.netProfit)}</strong></td>
              <td><strong>{ytdData.netMarginRate}%</strong></td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
