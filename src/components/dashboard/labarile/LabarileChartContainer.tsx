import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tall?: boolean;
  action?: ReactNode;
}

export function LabarileChartContainer({ title, subtitle, children, tall, action }: ChartContainerProps) {
  return (
    <div className="group relative bg-gradient-to-br from-labarile-white to-labarile-light-gray/30 border border-labarile-border rounded-2xl p-5 lg:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Subtle top accent */}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-labarile-primary/40 to-transparent" />

      <div className="flex items-start justify-between gap-3 mb-4 lg:mb-5">
        <div className="flex items-center gap-3">
          <span className="inline-block w-1 h-7 rounded-full bg-gradient-to-b from-labarile-primary-dark to-labarile-primary" />
          <div>
            <h3 className="font-bebas text-lg lg:text-xl text-labarile-title tracking-wide leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-labarile-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn(tall && 'h-[350px] lg:h-[400px]')}>{children}</div>
    </div>
  );
}
