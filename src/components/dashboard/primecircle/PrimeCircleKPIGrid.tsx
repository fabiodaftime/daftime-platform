import { formatCurrency, type PCMonthData } from './PrimeCircleData';

interface Props { data: PCMonthData; }

export function PrimeCircleKPIGrid({ data }: Props) {
  const { kpis, m1Comparison } = data;
  const prevLabel = m1Comparison?.prevMonthLabel ?? 'Jan';

  const dirClass = (n: number) => (n >= 0 ? 'positive' : 'negative');
  const arrow = (n: number) => (n >= 0 ? '▲' : '▼');
  const sign = (n: number) => (n >= 0 ? '+' : '');

  return (
    <>
      <div className="pc-section-title">{data.monthLabel} — Key Metrics</div>
      <div className="pc-kpi-grid">
        <div className="pc-kpi-card blue">
          <div className="pc-kpi-label">Total Customers</div>
          <div className="pc-kpi-value">{kpis.totalCustomers}</div>
          <div className="pc-kpi-detail">All handled by Nathan</div>
          {m1Comparison && (
            <div className={`pc-kpi-comparison ${dirClass(m1Comparison.customers.diff)}`}>
              <span>{arrow(m1Comparison.customers.diff)} {sign(m1Comparison.customers.diff)}{m1Comparison.customers.diff}</span>
              <span className="label">vs {prevLabel} ({sign(m1Comparison.customers.pct)}{m1Comparison.customers.pct}%)</span>
            </div>
          )}
        </div>
        <div className="pc-kpi-card green">
          <div className="pc-kpi-label">Total Turnover</div>
          <div className="pc-kpi-value">{formatCurrency(kpis.totalTurnover)}</div>
          <div className="pc-kpi-detail">Avg. {formatCurrency(kpis.avgPerCustomer)} / customer</div>
          {m1Comparison && (
            <div className={`pc-kpi-comparison ${dirClass(m1Comparison.turnover.diff)}`}>
              <span>{arrow(m1Comparison.turnover.diff)} {sign(m1Comparison.turnover.diff)}{formatCurrency(m1Comparison.turnover.diff)}</span>
              <span className="label">vs {prevLabel} ({sign(m1Comparison.turnover.pct)}{m1Comparison.turnover.pct}%)</span>
            </div>
          )}
        </div>
        <div className="pc-kpi-card orange">
          <div className="pc-kpi-label">Net Profit</div>
          <div className="pc-kpi-value">{formatCurrency(kpis.netProfit)}</div>
          <div className="pc-kpi-detail">{kpis.netMarginRate}% net margin</div>
          {m1Comparison && (
            <div className={`pc-kpi-comparison ${m1Comparison.netProfit.direction}`}>
              <span>{m1Comparison.netProfit.direction === 'negative' ? '▼' : '▲'} {sign(m1Comparison.netProfit.diff)}{formatCurrency(m1Comparison.netProfit.diff)}</span>
              <span className="label">vs {prevLabel} ({sign(m1Comparison.netProfit.pct)}{m1Comparison.netProfit.pct}%)</span>
            </div>
          )}
        </div>
        <div className="pc-kpi-card purple">
          <div className="pc-kpi-label">Completed Services</div>
          <div className="pc-kpi-value">{kpis.completedServices}</div>
          <div className="pc-kpi-detail">{kpis.inProgressServices} in progress{kpis.cancelledServices > 0 ? `, ${kpis.cancelledServices} cancelled` : ''}</div>
          {m1Comparison && (
            <div className={`pc-kpi-comparison ${dirClass(m1Comparison.completed.diff)}`}>
              <span>{arrow(m1Comparison.completed.diff)} {sign(m1Comparison.completed.diff)}{m1Comparison.completed.diff}</span>
              <span className="label">vs {prevLabel} ({sign(m1Comparison.completed.pct)}{m1Comparison.completed.pct}%)</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
