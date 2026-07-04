// État vide affiché quand la configuration PCGroup en BDD est vide.
// Invite le super_admin à configurer les entités / mois.
// Le cas "loading" utilise un visuel distinct (skeleton + spinner) pour ne
// PAS être confondu avec un message d'erreur.

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyConfigStateProps {
  reason: 'no-entities' | 'no-months' | 'loading';
  isSuperAdmin: boolean;
}

const MESSAGES: Record<EmptyConfigStateProps['reason'], { title: string; body: string }> = {
  'no-entities': {
    title: 'Aucune entité configurée',
    body: 'La consolidation Prime Circle Group nécessite au moins une entité active. Configurez les entités du groupe pour démarrer.',
  },
  'no-months': {
    title: 'Aucun mois disponible',
    body: 'Aucun mois actif ne contient l’ensemble des données nécessaires à la consolidation (sources entités + bloc manuel SPY/Comment/Holding).',
  },
  loading: {
    title: 'Chargement du dashboard consolidé',
    body: 'Récupération des entités, mois et données manuelles…',
  },
};

// ----------------------------- Skeleton de chargement -----------------------------
// Reprend la silhouette du dashboard (header + tabs + KPIs + tableau) pour donner
// un feedback visuel rassurant pendant l'hydratation Supabase, sans look d'alerte.
function LoadingSkeleton({ body }: { body: string }) {
  const shimmer: React.CSSProperties = {
    background:
      'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(212,168,85,0.18) 50%, rgba(255,255,255,0.04) 100%)',
    backgroundSize: '200% 100%',
    animation: 'pcg-shimmer 1.6s ease-in-out infinite',
    borderRadius: 8,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F1B3D 0%, #1E3A5F 100%)',
        color: '#F5F0E8',
        padding: '32px 32px 48px',
      }}
    >
      <style>{`
        @keyframes pcg-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pcg-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>

      {/* Header skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...shimmer, width: 220, height: 28, marginBottom: 10 }} />
          <div style={{ ...shimmer, width: 320, height: 14, opacity: 0.7 }} />
        </div>
        <div style={{ ...shimmer, width: 160, height: 36 }} />
      </div>

      {/* Tabs skeleton */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ ...shimmer, width: 110, height: 36 }} />
        ))}
      </div>

      {/* KPI cards skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(212,168,85,0.18)',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ ...shimmer, width: '60%', height: 12 }} />
            <div style={{ ...shimmer, width: '80%', height: 28 }} />
            <div style={{ ...shimmer, width: '40%', height: 11, opacity: 0.7 }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(212,168,85,0.18)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ ...shimmer, width: 240, height: 18, marginBottom: 6 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ ...shimmer, width: '100%', height: 14, opacity: 0.85 }} />
        ))}
      </div>

      {/* Pastille de statut discrète, pas un look d'alerte */}
      <div
        style={{
          marginTop: 28,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          borderRadius: 999,
          background: 'rgba(212,168,85,0.10)',
          border: '1px solid rgba(212,168,85,0.30)',
          color: '#E8D29A',
          fontSize: 13,
          animation: 'pcg-fade-in 200ms ease-out',
        }}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {body}
      </div>
    </div>
  );
}

export function EmptyConfigState({ reason, isSuperAdmin }: EmptyConfigStateProps) {
  const navigate = useNavigate();
  const { title, body } = MESSAGES[reason];

  // Loading → skeleton, pas de carte d'alerte (évite le faux air d'erreur).
  if (reason === 'loading') {
    return <LoadingSkeleton body={body} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F1B3D 0%, #1E3A5F 100%)',
        color: '#F5F0E8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 24,
      }}
    >
      <div
        style={{
          maxWidth: 560,
          textAlign: 'center',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(212,168,85,0.25)',
          borderRadius: 16,
          padding: '40px 32px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <AlertCircle className="w-10 h-10 mx-auto" style={{ color: '#D4A855', marginBottom: 16 }} />
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>{title}</h1>
        <p style={{ opacity: 0.85, lineHeight: 1.55, marginBottom: 28 }}>{body}</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))}
            style={{ color: '#F5F0E8' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          {isSuperAdmin && (
            <Button
              size="sm"
              onClick={() => navigate('/admin/pcgroup-config')}
              style={{ background: '#D4A855', color: '#0F1B3D' }}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Configurer les entités
            </Button>
          )}
        </div>

        {!isSuperAdmin && (
          <p style={{ marginTop: 24, fontSize: 12, opacity: 0.6 }}>
            Contactez un administrateur Daftime Advisory pour activer la consolidation.
          </p>
        )}
      </div>
    </div>
  );
}
