import { ReactNode } from 'react';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => ReactNode;
}

interface RichissimeDataTableProps {
  columns: Column[];
  data: any[];
}

export function RichissimeDataTable({ columns, data }: RichissimeDataTableProps) {
  return (
    <div className="bg-white rounded-[14px] border border-richissime-border overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-gradient-to-r from-richissime-navy to-richissime-navy-light">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 lg:px-5 py-3.5 text-left text-[10px] uppercase tracking-[1.2px] text-richissime-gold font-semibold"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-richissime-cream transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 lg:px-5 py-3.5 border-t border-richissime-border text-sm">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Status Badge Component
export function StatusBadge({ status, type }: { status: string; type: 'success' | 'warning' | 'danger' | 'info' }) {
  const colors = {
    success: 'bg-richissime-success-light text-richissime-success',
    warning: 'bg-richissime-warning-light text-richissime-warning',
    danger: 'bg-richissime-danger-light text-richissime-danger',
    info: 'bg-richissime-info-light text-richissime-info'
  };

  const icons = {
    success: '✓',
    warning: '⚠',
    danger: '✗',
    info: 'ℹ'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${colors[type]}`}>
      {icons[type]} {status}
    </span>
  );
}

// Trend Badge Component  
export function TrendBadge({ trend, type }: { trend: string; type: 'success' | 'warning' | 'danger' }) {
  const colors = {
    success: 'bg-richissime-success-light text-richissime-success',
    warning: 'bg-richissime-warning-light text-richissime-warning',
    danger: 'bg-richissime-danger-light text-richissime-danger'
  };

  const icons = {
    success: '↑',
    warning: '→',
    danger: '↓'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${colors[type]}`}>
      {icons[type]} {trend}
    </span>
  );
}
