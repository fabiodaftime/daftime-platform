import { kpis, m1Comparison, formatCurrency } from './PrimeCircleData';

export function PrimeCircleKPIGrid() {
  return (
    <>
      <div className="pc-section-title">February 2026 — Key Metrics</div>
      <div className="pc-kpi-grid">
        <div className="pc-kpi-card blue">
          <div className="pc-kpi-label">Total Customers</div>
          <div className="pc-kpi-value">{kpis.totalCustomers}</div>
          <div className="pc-kpi-detail">All handled by Nathan</div>
          <div className="pc-kpi-comparison positive">
            <span>▲ +{m1Comparison.customers.diff}</span>
            <span className="label">vs Jan (+{m1Comparison.customers.pct}%)</span>
          </div>
        </div>
        <div className="pc-kpi-card green">
          <div className="pc-kpi-label">Total Turnover</div>
          <div className="pc-kpi-value">{formatCurrency(kpis.totalTurnover)}</div>
          <div className="pc-kpi-detail">Avg. {formatCurrency(kpis.avgPerCustomer)} / customer</div>
          <div className="pc-kpi-comparison positive">
            <span>▲ +{formatCurrency(m1Comparison.turnover.diff)}</span>
            <span className="label">vs Jan (+{m1Comparison.turnover.pct}%)</span>
          </div>
        </div>
        <div className="pc-kpi-card orange">
          <div className="pc-kpi-label">Total Margin</div>
          <div className="pc-kpi-value">{formatCurrency(kpis.totalMargin)}</div>
          <div className="pc-kpi-detail">{kpis.marginRate}% margin rate</div>
          <div className="pc-kpi-comparison positive">
            <span>▲ +{formatCurrency(m1Comparison.margin.diff)}</span>
            <span className="label">vs Jan (+{m1Comparison.margin.pct}%)</span>
          </div>
        </div>
        <div className="pc-kpi-card purple">
          <div className="pc-kpi-label">Completed Services</div>
          <div className="pc-kpi-value">{kpis.completedServices}</div>
          <div className="pc-kpi-detail">{kpis.inProgressServices} in progress, {kpis.cancelledServices} cancelled</div>
          <div className="pc-kpi-comparison positive">
            <span>▲ +{m1Comparison.completed.diff}</span>
            <span className="label">vs Jan (+{m1Comparison.completed.pct}%)</span>
          </div>
        </div>
      </div>
    </>
  );
}
