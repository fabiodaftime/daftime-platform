import { cn } from '@/lib/utils';

interface LabarileActionCardProps {
  priority: 'critical' | 'haute' | 'moyenne';
  icon: string;
  title: string;
  description: string;
}

export function LabarileActionCard({ priority, icon, title, description }: LabarileActionCardProps) {
  return (
    <div className="bg-gradient-to-br from-labarile-white to-labarile-ice1 rounded-xl p-5 lg:p-6 border border-labarile-border relative pl-7 lg:pl-8">
      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-labarile-primary rounded-l-xl" />
      
      <span className={cn(
        "inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase mb-3",
        priority === 'critical' && "bg-red-100 text-red-600",
        priority === 'haute' && "bg-orange-100 text-orange-600",
        priority === 'moyenne' && "bg-blue-100 text-blue-600"
      )}>
        {priority}
      </span>
      
      <h4 className="font-semibold text-base lg:text-lg mb-2 text-labarile-title">
        {icon} {title}
      </h4>
      <p className="text-sm leading-relaxed text-labarile-text">
        {description}
      </p>
    </div>
  );
}
