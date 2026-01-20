interface RichissimeAlertCardProps {
  type: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
}

export function RichissimeAlertCard({ type, title, description }: RichissimeAlertCardProps) {
  const styles = {
    critical: 'border-l-richissime-danger bg-gradient-to-r from-red-50 to-white',
    warning: 'border-l-richissime-warning bg-white',
    success: 'border-l-richissime-success bg-gradient-to-r from-green-50 to-white',
    info: 'border-l-richissime-info bg-gradient-to-r from-blue-50 to-white'
  };

  const badgeColors = {
    critical: 'bg-richissime-danger-light text-richissime-danger',
    warning: 'bg-richissime-warning-light text-richissime-warning',
    success: 'bg-richissime-success-light text-richissime-success',
    info: 'bg-richissime-info-light text-richissime-info'
  };

  const badgeLabels = {
    critical: 'CRITIQUE',
    warning: 'MODÉRÉ',
    success: 'SUCCÈS',
    info: 'INFO'
  };

  return (
    <div className={`rounded-[14px] p-4 pl-5 border-l-4 ${styles[type]}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-[13px] text-richissime-navy">
          {title}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${badgeColors[type]}`}>
          {badgeLabels[type]}
        </span>
      </div>
      <p className="text-xs text-richissime-text leading-relaxed">
        {description}
      </p>
    </div>
  );
}
