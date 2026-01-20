import { ReactNode } from 'react';

interface RichissimeChartContainerProps {
  title: string;
  subtitle?: string;
  badge?: { label: string; type: 'success' | 'warning' | 'info' | 'danger' };
  children: ReactNode;
  tall?: boolean;
  footer?: ReactNode;
}

export function RichissimeChartContainer({
  title,
  subtitle,
  badge,
  children,
  tall = false,
  footer
}: RichissimeChartContainerProps) {
  const badgeColors = {
    success: 'bg-richissime-success-light text-richissime-success',
    warning: 'bg-richissime-warning-light text-richissime-warning',
    info: 'bg-richissime-info-light text-richissime-info',
    danger: 'bg-richissime-danger-light text-richissime-danger'
  };

  return (
    <div className="bg-white rounded-[14px] p-6 border border-richissime-border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-playfair text-base text-richissime-navy font-semibold">
            {title}
          </div>
          {subtitle && (
            <div className="text-[11px] text-richissime-muted mt-1">
              {subtitle}
            </div>
          )}
        </div>
        {badge && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${badgeColors[badge.type]}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className={tall ? 'h-[280px] lg:h-[350px]' : 'h-[280px]'}>
        {children}
      </div>
      {footer && (
        <div className="mt-4">
          {footer}
        </div>
      )}
    </div>
  );
}
