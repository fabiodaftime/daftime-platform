import { formatCurrency, type PCMonthData } from './PrimeCircleData';

interface Props { data: PCMonthData; }

export function PrimeCircleCostsSection({ data }: Props) {
  const { costs, kpis } = data;
  const netProfit = kpis.totalTurnover - costs.total;

  return (
    <>
      <div className="pc-section-title">Costs & Profitability — {data.monthLabel}</div>
      <div className="pc-expenses-grid">
        <div className="pc-expenses-card">
          <h3>Costs Breakdown</h3>

          {costs.awdEvent != null && costs.awdEvent > 0 && (
            <div className="pc-expense-row" style={{ background: 'rgba(124, 58, 237, 0.05)', margin: '0 -24px', padding: '12px 24px', borderLeft: '3px solid #7C3AED' }}>
              <div className="pc-expense-label">
                <div className="pc-expense-icon" style={{ background: 'rgba(124, 58, 237, 0.15)' }}>🎪</div>
                <div>
                  <span>Affiliate World Dubai (Booth A18)</span>
                  <div style={{ fontSize: '10px', color: '#8899A6', marginTop: '2px' }}>NON-RECURRING</div>
                </div>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.awdEvent)}</div>
            </div>
          )}

          {costs.productProviderCosts != null && costs.productProviderCosts > 0 && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">🏢</div>
                <div>
                  <span>Product & Provider Costs</span>
                  {costs.productProviderDetail && (
                    <div style={{ fontSize: '10px', color: '#8899A6', marginTop: '2px' }}>{costs.productProviderDetail}</div>
                  )}
                </div>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.productProviderCosts)}</div>
            </div>
          )}

          <div className="pc-expense-row">
            <div className="pc-expense-label">
              <div className="pc-expense-icon">📢</div>
              <div>
                <span>Advertising</span>
                {costs.advertisingDetail && (
                  <div style={{ fontSize: '10px', color: '#8899A6', marginTop: '2px' }}>{costs.advertisingDetail}</div>
                )}
              </div>
            </div>
            <div className="pc-expense-amount negative">-{formatCurrency(costs.advertising)}</div>
          </div>

          {costs.marketing != null && costs.marketing > 0 && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">📣</div>
                <div>
                  <span>Marketing</span>
                  {costs.marketingDetail && (
                    <div style={{ fontSize: '10px', color: '#8899A6', marginTop: '2px' }}>{costs.marketingDetail}</div>
                  )}
                </div>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.marketing)}</div>
            </div>
          )}

          {costs.salesCommission != null && costs.salesCommission > 0 && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">💼</div>
                <span>Sales Commission (Nathan)</span>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.salesCommission)}</div>
            </div>
          )}

          {costs.referralCommission != null && costs.referralCommission > 0 && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">🤝</div>
                <span>Referral Commission</span>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.referralCommission)}</div>
            </div>
          )}

          {costs.events != null && costs.events > 0 && !costs.awdEvent && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">🎪</div>
                <span>Events</span>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.events)}</div>
            </div>
          )}

          {costs.alibabaPurchases != null && costs.alibabaPurchases > 0 && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">📦</div>
                <span>Alibaba Purchases</span>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.alibabaPurchases)}</div>
            </div>
          )}

          {costs.bankFees != null && costs.bankFees > 0 && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">🏦</div>
                <span>Bank Fees (International Transfers)</span>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.bankFees)}</div>
            </div>
          )}

          {costs.serviceCosts != null && costs.serviceCosts > 0 && (
            <div className="pc-expense-row">
              <div className="pc-expense-label">
                <div className="pc-expense-icon">🏢</div>
                <span>Service/Provider Costs</span>
              </div>
              <div className="pc-expense-amount negative">-{formatCurrency(costs.serviceCosts)}</div>
            </div>
          )}

          <div className="pc-expense-row total">
            <div className="pc-expense-label">
              <strong>TOTAL COSTS</strong>
            </div>
            <div className="pc-expense-amount negative">-{formatCurrency(costs.total)}</div>
          </div>

          {costs.recurringTotal != null && (
            <div className="pc-expense-row" style={{ borderTop: 'none', paddingTop: '8px' }}>
              <div className="pc-expense-label">
                <span style={{ color: '#8899A6', fontSize: '12px' }}>Recurring costs only (excl. AWD)</span>
              </div>
              <div className="pc-expense-amount" style={{ color: '#536471' }}>-{formatCurrency(costs.recurringTotal)}</div>
            </div>
          )}
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
            <span className="pc-pnl-value">{formatCurrency(netProfit)}</span>
          </div>
          <div className="pc-pnl-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <span>Net Margin Rate</span>
            <span className="pc-pnl-value">{((netProfit / kpis.totalTurnover) * 100).toFixed(1)}%</span>
          </div>
          {costs.recurringTotal != null && (
            <div className="pc-pnl-row" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', opacity: 0.8 }}>
              <span>Excl. AWD event</span>
              <span className="pc-pnl-value">{formatCurrency(kpis.totalTurnover - costs.recurringTotal)} ({((kpis.totalTurnover - costs.recurringTotal) / kpis.totalTurnover * 100).toFixed(1)}%)</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
