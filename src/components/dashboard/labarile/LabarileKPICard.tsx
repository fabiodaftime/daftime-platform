import { cn } from '@/lib/utils';

interface LabarileKPICardProps {
  label: string;
  value: string;
  subtext?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function LabarileKPICard({
  label,
  value,
  subtext,
  variant = 'default',
}: LabarileKPICardProps) {
  return (
    <div className="bg-labarile-white border border-labarile-border rounded-xl p-5 lg:p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg hover:shadow-labarile-primary/10">
      <p className="text-[11px] lg:text-xs text-labarile-muted uppercase tracking-wider font-semibold mb-2">
        {label}
      </p>
      <p className={cn(
        "font-bebas text-2xl lg:text-4xl tracking-wide",
        variant === 'primary' && "text-labarile-primary",
        variant === 'success' && "text-labarile-success",
        variant === 'warning' && "text-labarile-warning",
        variant === 'default' && "text-labarile-title"
      )}>
        {value}
      </p>
      {subtext && (
        <p className="text-xs lg:text-sm text-labarile-muted mt-1 lg:mt-2">{subtext}</p>
      )}
    </div>
  );
}
