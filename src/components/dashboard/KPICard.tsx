import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  variance?: number;
  varianceLabel?: string;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  variance,
  varianceLabel,
  icon,
  onClick,
  className,
}: KPICardProps) {
  const hasVariance = variance !== undefined;
  const isPositive = variance && variance > 0;
  const isNegative = variance && variance < 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-dashboard-card rounded-lg p-5 border border-dashboard-border',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-dashboard-card-hover hover:border-accent/30',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-dashboard-text-muted uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <div className="text-accent">
            {icon}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-dashboard-text mb-1">
        {value}
      </p>

      {subtitle && (
        <p className="text-sm text-dashboard-text-muted mb-2">
          {subtitle}
        </p>
      )}

      {hasVariance && (
        <div className="flex items-center gap-1.5 mt-2">
          {isPositive && <TrendingUp className="w-4 h-4 text-kpi-positive" />}
          {isNegative && <TrendingDown className="w-4 h-4 text-kpi-negative" />}
          {!isPositive && !isNegative && <Minus className="w-4 h-4 text-kpi-neutral" />}
          
          <span className={cn(
            'text-sm font-medium',
            isPositive && 'text-kpi-positive',
            isNegative && 'text-kpi-negative',
            !isPositive && !isNegative && 'text-kpi-neutral'
          )}>
            {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
          </span>
          
          {varianceLabel && (
            <span className="text-xs text-dashboard-text-muted">
              {varianceLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
