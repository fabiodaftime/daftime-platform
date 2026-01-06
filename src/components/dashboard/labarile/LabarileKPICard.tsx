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
    <div className={cn(
      "bg-labarile-white border border-labarile-border rounded-xl p-5 relative overflow-hidden",
    )}>
      {/* Top accent bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[3px]",
        variant === 'primary' && "bg-labarile-primary",
        variant === 'success' && "bg-labarile-success",
        variant === 'warning' && "bg-labarile-warning",
        variant === 'default' && "bg-labarile-primary"
      )} />
      
      <p className="text-xs text-labarile-muted uppercase tracking-wider font-medium mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-labarile-text">
        {value}
      </p>
      {subtext && (
        <p className="text-sm text-labarile-muted mt-1">{subtext}</p>
      )}
    </div>
  );
}
