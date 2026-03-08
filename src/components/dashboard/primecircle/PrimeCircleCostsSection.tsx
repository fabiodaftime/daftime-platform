import { costs, kpis, formatCurrency } from './PrimeCircleData';

export function PrimeCircleCostsSection() {
  return (
    <>
      <div className="pc-section-title">Costs & Profitability — February 2026</div>
      <div className="pc-expenses-grid">
        <div className="pc-expenses-card">
          <h3>Costs Breakdown (included in Margin)</h3>
          <div className="pc-expense-row">
            <div className="pc-expense-label">
              <div className="pc-expense-icon">📢</div>
              <span>Advertising (ADS)</span>
            </div>
            <div className="pc-expense-amount negative">-{formatCurrency(costs.advertising)}</div>
          </div>
          <div className="pc-expense-row">
            <div className="pc-expense-label">
              <div className="pc-expense-icon">💼</div>
              <span>Sales Commission (Nathan)</span>
            </div>
            <div className="pc-expense-amount negative">-{formatCurrency(costs.salesCommission)}</div>
          </div>
          <div className="pc-expense-row">
            <div className="pc-expense-label">
              <div className="pc-expense-icon">🏢</div>
              <span>Service/Provider Costs</span>
            </div>
            <div className="pc-expense-amount negative">-{formatCurrency(costs.serviceCosts)}</div>
          </div>
          <div className="pc-expense-row total">
            <div className="pc-expense-label">
              <strong>TOTAL COSTS</strong>
            </div>
            <div className="pc-expense-amount negative">-{formatCurrency(costs.total)}</div>
          </div>
        </div>

        <div className="pc-expenses-card pc-pnl-card">
          <h3>P&L Summary</h3>
          <div className="pc-pnl-row">
            <span>Turnover</span>
            <span className="pc-pnl-value">{formatCurrency(kpis.totalTurnover)}</span>
          </div>
          <div className="pc-pnl-row">
            <span>Total Costs</span>
            <span className="pc-pnl-value">-{formatCurrency(costs.total)}</span>
          </div>
          <div className="pc-pnl-row highlight">
            <span>NET PROFIT</span>
            <span className="pc-pnl-value">{formatCurrency(kpis.totalMargin)}</span>
          </div>
          <div className="pc-pnl-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <span>Net Margin Rate</span>
            <span className="pc-pnl-value">{kpis.marginRate}%</span>
          </div>
        </div>
      </div>
    </>
  );
}
