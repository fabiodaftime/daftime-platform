// État vide affiché quand la configuration PCGroup en BDD est vide.
// Invite le super_admin à configurer les entités / mois.

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings2, AlertCircle } from 'lucide-react';
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
    title: 'Chargement de la configuration…',
    body: 'Récupération des entités, mois et données manuelles depuis la base.',
  },
};

export function EmptyConfigState({ reason, isSuperAdmin }: EmptyConfigStateProps) {
  const navigate = useNavigate();
  const { title, body } = MESSAGES[reason];

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
            onClick={() => navigate('/')}
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
