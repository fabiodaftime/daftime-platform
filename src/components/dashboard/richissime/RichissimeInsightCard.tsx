interface InsightCardProps {
  type: 'success' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
}

export function RichissimeInsightCard({ type, icon, title, description }: InsightCardProps) {
  const iconBgColors = {
    success: 'bg-richissime-success-light',
    warning: 'bg-richissime-warning-light',
    info: 'bg-richissime-info-light'
  };

  const progressColors = {
    success: 'bg-richissime-success',
    warning: 'bg-richissime-warning',
    info: 'bg-richissime-gold'
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-richissime-border">
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-lg mb-2.5 ${iconBgColors[type]}`}>
        {icon}
      </div>
      <div className="font-semibold text-sm text-richissime-navy mb-1.5">{title}</div>
      <p className="text-xs text-richissime-muted leading-relaxed">{description}</p>
      <div className="h-1.5 bg-gray-200 rounded-full mt-2.5 overflow-hidden">
        <div className={`h-full rounded-full ${progressColors[type]}`} style={{ width: type === 'info' ? '96%' : '100%' }} />
      </div>
    </div>
  );
}
