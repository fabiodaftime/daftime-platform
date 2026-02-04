import { kpis, formatCurrency } from './PrimeCircleData';

export function PrimeCircleKPIGrid() {
  return (
    <>
      <div className="pc-section-title">Key Metrics</div>
      <div className="pc-kpi-grid">
        <div className="pc-kpi-card blue">
          <div className="pc-kpi-label">Total Customers</div>
          <div className="pc-kpi-value">{kpis.totalCustomers}</div>
          <div className="pc-kpi-detail">All handled by Nathan</div>
        </div>
        <div className="pc-kpi-card green">
          <div className="pc-kpi-label">Total Turnover</div>
          <div className="pc-kpi-value">{formatCurrency(kpis.totalTurnover)}</div>
          <div className="pc-kpi-detail">Avg. {formatCurrency(kpis.avgPerCustomer)} / customer</div>
        </div>
        <div className="pc-kpi-card orange">
          <div className="pc-kpi-label">Total Margin</div>
          <div className="pc-kpi-value">{formatCurrency(kpis.totalMargin)}</div>
          <div className="pc-kpi-detail">{kpis.marginRate}% margin rate</div>
        </div>
        <div className="pc-kpi-card purple">
          <div className="pc-kpi-label">Completed Services</div>
          <div className="pc-kpi-value">{kpis.completedServices}</div>
          <div className="pc-kpi-detail">{kpis.inProgressServices} in progress</div>
        </div>
      </div>
    </>
  );
}
