interface VarianceCardProps {
  title: string;
  badge: string;
  badgeType: 'success' | 'warning' | 'danger';
  rows: Array<{
    label: string;
    actual: string;
    forecast: string;
    delta: string;
    positive: boolean;
  }>;
}

export function RichissimeVarianceCard({ title, badge, badgeType, rows }: VarianceCardProps) {
  const badgeColors = {
    success: 'bg-richissime-success-light text-richissime-success',
    warning: 'bg-richissime-warning-light text-richissime-warning',
    danger: 'bg-richissime-danger-light text-richissime-danger'
  };

  return (
    <div className="bg-white rounded-[14px] p-5 border border-richissime-border">
      <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-richissime-border">
        <div className="font-semibold text-sm text-richissime-navy">{title}</div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${badgeColors[badgeType]}`}>
          {badge}
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-3 py-2.5 border-b border-richissime-cream last:border-b-0 items-center text-sm">
            <div className="text-richissime-text">{row.label}</div>
            <div className="font-semibold text-richissime-navy">{row.actual}</div>
            <div className="text-richissime-muted">{row.forecast}</div>
            <div className={`font-semibold ${row.positive ? 'text-richissime-success' : 'text-richissime-danger'}`}>
              {row.delta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
