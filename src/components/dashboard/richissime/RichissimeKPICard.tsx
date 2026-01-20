import { ReactNode } from 'react';

interface RichissimeKPICardProps {
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  variant?: 'default' | 'highlight' | 'gold' | 'success' | 'warning';
  small?: boolean;
}

export function RichissimeKPICard({
  label,
  value,
  trend,
  trendPositive,
  variant = 'default',
  small = false
}: RichissimeKPICardProps) {
  const isHighlight = variant === 'highlight';

  return (
    <div
      className={`
        relative rounded-[14px] p-5 border transition-all duration-300
        overflow-hidden group
        ${isHighlight
          ? 'bg-gradient-to-br from-richissime-navy to-richissime-navy-light border-transparent'
          : 'bg-white border-richissime-border hover:shadow-lg hover:-translate-y-1'
        }
      `}
    >
      {/* Top accent bar */}
      {!isHighlight && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-richissime-gold to-richissime-gold-light opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <div className={`text-[10px] uppercase tracking-[1.2px] font-semibold mb-2 ${isHighlight ? 'text-richissime-gold-light' : 'text-richissime-muted'}`}>
        {label}
      </div>

      <div
        className={`
          font-playfair font-semibold
          ${small ? 'text-2xl' : 'text-[28px]'}
          ${isHighlight ? 'text-richissime-gold' : ''}
          ${variant === 'gold' ? 'text-richissime-gold-dark' : ''}
          ${variant === 'success' ? 'text-richissime-success' : ''}
          ${variant === 'warning' ? 'text-richissime-warning' : ''}
          ${variant === 'default' && !isHighlight ? 'text-richissime-navy' : ''}
        `}
      >
        {value}
      </div>

      {trend && (
        <div
          className={`
            text-[11px] font-medium mt-1.5
            ${isHighlight ? 'text-white/70' : ''}
            ${trendPositive === true ? 'text-richissime-success' : ''}
            ${trendPositive === false ? 'text-richissime-danger' : ''}
            ${trendPositive === undefined && !isHighlight ? 'text-richissime-muted' : ''}
          `}
        >
          {trendPositive === true && '↑ '}{trendPositive === false && '↓ '}{trend}
        </div>
      )}
    </div>
  );
}
