import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export interface MonthOption {
  id: string;
  label: string;
}

interface MonthSelectorProps {
  months: MonthOption[];
  selectedMonth: string;
  onMonthChange: (monthId: string) => void;
  variant?: 'gold' | 'primary' | 'accent' | 'blue';
}

export function MonthSelector({ months, selectedMonth, onMonthChange, variant = 'gold' }: MonthSelectorProps) {
  const currentIndex = months.findIndex(m => m.id === selectedMonth);
  const currentLabel = months[currentIndex]?.label || '';
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < months.length - 1;

  const variantStyles: Record<string, { bg: string; text: string; border: string; hoverBg: string }> = {
    gold: { bg: 'linear-gradient(135deg, #C9A227 0%, #A68A1F 100%)', text: '#0F1E33', border: 'rgba(201,162,39,0.4)', hoverBg: 'rgba(201,162,39,0.15)' },
    primary: { bg: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', text: '#fff', border: 'rgba(79,91,213,0.4)', hoverBg: 'rgba(79,91,213,0.15)' },
    accent: { bg: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)', text: '#fff', border: 'rgba(217,70,168,0.4)', hoverBg: 'rgba(217,70,168,0.15)' },
    blue: { bg: 'linear-gradient(135deg, #1E56A0 0%, #164075 100%)', text: '#fff', border: 'rgba(30,86,160,0.4)', hoverBg: 'rgba(30,86,160,0.15)' },
  };

  const s = variantStyles[variant] || variantStyles.gold;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => canPrev && onMonthChange(months[currentIndex - 1].id)}
        disabled={!canPrev}
        style={{
          background: canPrev ? s.hoverBg : 'transparent',
          border: 'none',
          borderRadius: 4,
          padding: '6px 4px',
          cursor: canPrev ? 'pointer' : 'default',
          opacity: canPrev ? 1 : 0.3,
          color: variant === 'gold' ? '#0F1E33' : 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s',
        }}
      >
        <ChevronLeft size={16} />
      </button>

      <div style={{
        background: s.bg,
        padding: '0.6rem 1.2rem',
        borderRadius: 4,
        fontWeight: 700,
        fontSize: '0.85rem',
        color: s.text,
        letterSpacing: '1px',
        textTransform: 'uppercase' as const,
        boxShadow: `0 2px 8px ${s.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        userSelect: 'none' as const,
        minWidth: 160,
        justifyContent: 'center',
      }}>
        <Calendar size={14} />
        {currentLabel}
      </div>

      <button
        onClick={() => canNext && onMonthChange(months[currentIndex + 1].id)}
        disabled={!canNext}
        style={{
          background: canNext ? s.hoverBg : 'transparent',
          border: 'none',
          borderRadius: 4,
          padding: '6px 4px',
          cursor: canNext ? 'pointer' : 'default',
          opacity: canNext ? 1 : 0.3,
          color: variant === 'gold' ? '#0F1E33' : 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s',
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
