interface RichissimeActionCardProps {
  priority: 'critical' | 'haute' | 'moyenne' | 'basse';
  title: string;
  description: string;
}

export function RichissimeActionCard({ priority, title, description }: RichissimeActionCardProps) {
  const priorityColors = {
    critical: 'bg-richissime-danger-light text-richissime-danger',
    haute: 'bg-richissime-warning-light text-richissime-warning',
    moyenne: 'bg-richissime-gold-pale text-richissime-gold-dark',
    basse: 'bg-richissime-info-light text-richissime-info'
  };

  const priorityLabels = {
    critical: 'IMMÉDIAT',
    haute: 'HAUTE',
    moyenne: 'MOYENNE',
    basse: 'BASSE'
  };

  return (
    <div className="relative bg-gradient-to-r from-white to-richissime-gold-pale rounded-[14px] p-4 pl-6 border border-richissime-border">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-richissime-gold rounded-l-[14px]" />

      <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider mb-2.5 ${priorityColors[priority]}`}>
        {priorityLabels[priority]}
      </span>

      <div className="font-bold text-[13px] text-richissime-navy mb-1.5">
        {title}
      </div>

      <p className="text-xs text-richissime-text leading-relaxed">
        {description}
      </p>
    </div>
  );
}
