import { formatCurrency, type PCMonthData } from './PrimeCircleData';

interface Props { data: PCMonthData; }

export function PrimeCircleStatusGrid({ data }: Props) {
  return (
    <div className="pc-status-grid">
      <div className="pc-status-card">
        <h3>Service Status — {data.monthLabel.split(' ')[0]}</h3>
        <div className="pc-status-item">
          <div className="pc-status-label">
            <span className="pc-status-dot completed"></span>
            <span>Completed</span>
          </div>
          <div className="pc-status-values">
            <span className="pc-status-count">{data.statusData.completed.count} services</span>
            <span className="pc-status-amount">{formatCurrency(data.statusData.completed.amount)}</span>
          </div>
        </div>
        <div className="pc-status-item">
          <div className="pc-status-label">
            <span className="pc-status-dot progress"></span>
            <span>In Progress</span>
          </div>
          <div className="pc-status-values">
            <span className="pc-status-count">{data.statusData.inProgress.count} services</span>
            <span className="pc-status-amount">{formatCurrency(data.statusData.inProgress.amount)}</span>
          </div>
        </div>
      </div>
      
      <div className="pc-status-card">
        <h3>Top Services by Turnover</h3>
        {data.serviceCategories.slice(0, 4).map((service, index) => (
          <div key={index} className="pc-status-item">
            <span>{service.name}</span>
            <span className="pc-status-amount">{formatCurrency(service.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
