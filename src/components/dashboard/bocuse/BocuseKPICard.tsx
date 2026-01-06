import { cn } from '@/lib/utils';

interface BocuseKPICardProps {
  label: string;
  value: string;
  subtext?: string;
  badge?: string;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
  small?: boolean;
}

export function BocuseKPICard({
  label,
  value,
  subtext,
  badge,
  variant = 'default',
  small = false,
}: BocuseKPICardProps) {
  return (
    <div className={cn(
      "bg-gradient-to-br from-bocuse-card to-bocuse-light rounded-2xl p-5 shadow-xl border border-white/10 relative overflow-hidden",
    )}>
      {/* Left accent bar */}
      <div className={cn(
        "absolute left-0 top-0 w-1 h-full",
        variant === 'highlight' && "bg-bocuse-red",
        variant === 'success' && "bg-green-500",
        variant === 'warning' && "bg-yellow-500",
        variant === 'default' && "bg-bocuse-gray"
      )} />
      
      <p className="text-[10px] text-bocuse-gray uppercase tracking-widest mb-1 pl-2">
        {label}
      </p>
      <p className={cn(
        "font-bold text-white pl-2",
        small ? "text-xl" : "text-2xl"
      )}>
        {value}
      </p>
      {subtext && (
        <p className="text-sm text-bocuse-gray mt-1 pl-2">{subtext}</p>
      )}
      {badge && (
        <span className={cn(
          "inline-block mt-2 ml-2 px-3 py-0.5 rounded-full text-xs font-semibold",
          variant === 'success' && "bg-green-500 text-white",
          variant === 'warning' && "bg-yellow-500 text-gray-900",
          variant === 'highlight' && "bg-bocuse-red text-white",
          variant === 'default' && "bg-bocuse-gray/30 text-white"
        )}>
          {badge}
        </span>
      )}
    </div>
  );
}
