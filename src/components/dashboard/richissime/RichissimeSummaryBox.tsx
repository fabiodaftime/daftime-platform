interface SummaryBoxProps {
  title?: string;
  items: Array<{
    value: string;
    label: string;
    color?: 'gold' | 'success' | 'warning' | 'danger' | 'default';
  }>;
}

export function RichissimeSummaryBox({ title, items }: SummaryBoxProps) {
  const valueColors = {
    gold: 'text-richissime-gold-dark',
    success: 'text-richissime-success',
    warning: 'text-richissime-warning',
    danger: 'text-richissime-danger',
    default: 'text-richissime-navy'
  };

  return (
    <div className="bg-gradient-to-r from-richissime-gold-pale to-white border-2 border-richissime-gold rounded-[14px] p-6">
      {title && (
        <h3 className="font-playfair text-lg text-richissime-gold-dark mb-5">{title}</h3>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {items.map((item, idx) => (
          <div key={idx} className="text-center">
            <div className={`font-playfair text-2xl font-bold ${valueColors[item.color || 'default']}`}>
              {item.value}
            </div>
            <div className="text-[11px] text-richissime-muted uppercase tracking-wider mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
