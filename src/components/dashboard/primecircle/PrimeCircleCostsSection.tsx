import { formatCurrency, type PCMonthData } from './PrimeCircleData';

interface Props { data: PCMonthData; }

export function PrimeCircleCostsSection({ data }: Props) {
  const { costs, kpis } = data;

  return (
    <>
      <div className="pc-section-title">Costs & Profitability — {data.monthLabel}</div>
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
          {costs.referralCommission && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">🤝</div>
                <span>Referral Commission</span>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.referralCommission)}</div>
            </div>
          )}
          {costs.events && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">🎪</div>
                <span>Events</span>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.events)}</div>
            </div>
          )}
          {costs.bankFees != null && costs.bankFees > 0 && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">🏦</div>
                <span>Bank Fees</span>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.bankFees)}</div>
            </div>
          )}
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
