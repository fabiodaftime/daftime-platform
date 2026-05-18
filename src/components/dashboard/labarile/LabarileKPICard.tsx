import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, Activity, Wallet, BarChart3 } from 'lucide-react';

interface LabarileKPICardProps {
  label: string;
  value: string;
  subtext?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  icon?: LucideIcon;
}

const variantStyles: Record<NonNullable<LabarileKPICardProps['variant']>, {
  text: string;
  bar: string;
  iconBg: string;
  iconColor: string;
  glow: string;
  defaultIcon: LucideIcon;
}> = {
  primary: {
    text: 'text-labarile-primary-dark',
    bar: 'from-labarile-primary-dark to-labarile-primary',
    iconBg: 'bg-labarile-ice1',
    iconColor: 'text-labarile-primary-dark',
    glow: 'hover:shadow-labarile-primary/25',
    defaultIcon: BarChart3,
  },
  success: {
    text: 'text-labarile-success',
    bar: 'from-emerald-500 to-labarile-success',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-labarile-success',
    glow: 'hover:shadow-emerald-400/25',
    defaultIcon: TrendingUp,
  },
  warning: {
    text: 'text-labarile-warning',
    bar: 'from-orange-400 to-labarile-warning',
    iconBg: 'bg-orange-50',
    iconColor: 'text-labarile-warning',
    glow: 'hover:shadow-orange-300/25',
    defaultIcon: Wallet,
  },
  default: {
    text: 'text-labarile-title',
    bar: 'from-slate-300 to-slate-400',
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-600',
    glow: 'hover:shadow-slate-300/30',
    defaultIcon: Activity,
  },
};

export function LabarileKPICard({
  label,
  value,
  subtext,
  variant = 'default',
  icon,
}: LabarileKPICardProps) {
  const styles = variantStyles[variant];
  const Icon = icon ?? styles.defaultIcon;

  return (
    <div
      className={cn(
        'group relative overflow-hidden bg-gradient-to-br from-labarile-white to-labarile-light-gray/40',
        'border border-labarile-border rounded-2xl p-5 lg:p-6',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        styles.glow,
      )}
    >
      {/* Top accent bar */}
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', styles.bar)} />

      {/* Decorative blur */}
      <div
        className={cn(
          'pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-70',
          styles.iconBg,
        )}
      />

      <div className="relative flex items-start justify-between gap-3 mb-3">
        <p className="text-[11px] lg:text-xs text-labarile-muted uppercase tracking-[0.12em] font-semibold">
          {label}
        </p>
        <div
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110',
            styles.iconBg,
          )}
        >
          <Icon className={cn('w-4 h-4', styles.iconColor)} />
        </div>
      </div>

      <p className={cn('relative font-bebas text-3xl lg:text-4xl tracking-wide leading-none', styles.text)}>
        {value}
      </p>

      {subtext && (
        <p className="relative text-xs lg:text-sm text-labarile-muted mt-2 lg:mt-3">{subtext}</p>
      )}
    </div>
  );
}
