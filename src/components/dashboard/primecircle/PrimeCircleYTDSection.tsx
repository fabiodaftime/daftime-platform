import { ytdData, monthlyComparison, formatCurrency } from './PrimeCircleData';

export function PrimeCircleYTDSection() {
  return (
    <>
      <div className="pc-section-title">Year-to-Date (Jan–Feb 2026)</div>
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
          <div className="pc-kpi-label">YTD Margin</div>
          <div className="pc-kpi-value">{formatCurrency(ytdData.margin)}</div>
          <div className="pc-kpi-detail">{ytdData.marginRate}% avg margin rate</div>
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
              <th>Margin</th>
              <th>Margin Rate</th>
              <th>ADS</th>
              <th>Commission</th>
              <th>Var. Turnover</th>
            </tr>
          </thead>
          <tbody>
            {monthlyComparison.map((m, i) => (
              <tr key={i}>
                <td className="pc-month-label">{m.month}</td>
                <td>{m.customers}</td>
                <td className="pc-amount turnover">{formatCurrency(m.turnover)}</td>
                <td className="pc-amount margin">{formatCurrency(m.margin)}</td>
                <td>{m.marginRate}%</td>
                <td>{formatCurrency(m.ads)}</td>
                <td>{formatCurrency(m.commission)}</td>
                <td>
                  {m.varTurnover ? (
                    <span className="pc-var-badge positive">▲ +{m.varTurnover}%</span>
                  ) : '—'}
                </td>
              </tr>
            ))}
            <tr className="pc-ytd-row">
              <td className="pc-month-label">YTD TOTAL</td>
              <td><strong>{ytdData.customers}</strong></td>
              <td className="pc-amount turnover"><strong>{formatCurrency(ytdData.turnover)}</strong></td>
              <td className="pc-amount margin"><strong>{formatCurrency(ytdData.margin)}</strong></td>
              <td><strong>{ytdData.marginRate}%</strong></td>
              <td><strong>{formatCurrency(7482)}</strong></td>
              <td><strong>{formatCurrency(9635)}</strong></td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
