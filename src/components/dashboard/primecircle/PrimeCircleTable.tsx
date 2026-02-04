import { useState } from 'react';
import { transactions, Transaction, formatCurrency } from './PrimeCircleData';

type FilterType = 'all' | 'Closed' | 'In progress';

export function PrimeCircleTable() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === filter);

  const closedCount = transactions.filter(t => t.status === 'Closed').length;
  const inProgressCount = transactions.filter(t => t.status === 'In progress').length;

  return (
    <>
      <div className="pc-section-title">Transactions</div>
      <div className="pc-table-card">
        <div className="pc-table-header">
          <h3>All Services — January 2026</h3>
          <div className="pc-table-filters">
            <button 
              className={`pc-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({transactions.length})
            </button>
            <button 
              className={`pc-filter-btn ${filter === 'Closed' ? 'active' : ''}`}
              onClick={() => setFilter('Closed')}
            >
              Completed ({closedCount})
            </button>
            <button 
              className={`pc-filter-btn ${filter === 'In progress' ? 'active' : ''}`}
              onClick={() => setFilter('In progress')}
            >
              In Progress ({inProgressCount})
            </button>
          </div>
        </div>
        
        <table className="pc-data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
              <th>Status</th>
              <th>Turnover</th>
              <th>Margin</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t, index) => (
              <tr key={index}>
                <td className="pc-customer-name">{t.name}</td>
                <td><span className="pc-service-tag">{t.service}</span></td>
                <td>
                  <span className={`pc-status-badge ${t.status === 'Closed' ? 'completed' : 'progress'}`}>
                    {t.status === 'Closed' ? 'Completed' : 'In Progress'}
                  </span>
                </td>
                <td className="pc-amount turnover">{formatCurrency(t.turnover)}</td>
                <td className="pc-amount margin">{formatCurrency(t.margin)}</td>
                <td className="pc-margin-rate">
                  {t.turnover > 0 ? Math.round((t.margin / t.turnover) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
