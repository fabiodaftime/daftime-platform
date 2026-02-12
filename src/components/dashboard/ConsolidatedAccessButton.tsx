import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { useConsolidatedAccess } from '@/hooks/useConsolidatedAccess';

export function ConsolidatedAccessButton() {
  const { hasAccess, loading, consolidatedId } = useConsolidatedAccess();
  const navigate = useNavigate();

  if (loading || !hasAccess) return null;

  return (
    <button
      onClick={() => navigate(`/dashboard-pc-group/${consolidatedId}`)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        fontSize: 13,
        fontWeight: 500,
        color: '#1E3A5F',
        background: 'linear-gradient(135deg, #F0F4FF 0%, #E8ECF5 100%)',
        border: '1px solid #CBD5E1',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #E0E8FF 0%, #D0D8EB 100%)';
        e.currentTarget.style.borderColor = '#94A3B8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #F0F4FF 0%, #E8ECF5 100%)';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
    >
      <LayoutDashboard size={14} />
      Dashboard Consolidé Groupe
    </button>
  );
}
