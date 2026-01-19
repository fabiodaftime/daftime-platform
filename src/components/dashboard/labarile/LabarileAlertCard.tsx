import { cn } from '@/lib/utils';

interface LabarileAlertCardProps {
  type: 'warning' | 'critical';
  title: string;
  description: string;
}

export function LabarileAlertCard({ type, title, description }: LabarileAlertCardProps) {
  return (
    <div className={cn(
      "bg-labarile-white rounded-xl p-5 lg:p-6 border-l-4",
      type === 'critical' ? "border-l-red-500" : "border-l-labarile-warning"
    )}>
      <h4 className="font-bold text-base lg:text-lg mb-2 text-labarile-title">
        {type === 'critical' ? '🔴' : '⚠️'} {title}
      </h4>
      <p className="text-sm lg:text-[14px] leading-relaxed text-labarile-text">
        {description}
      </p>
    </div>
  );
}
