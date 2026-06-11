import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DashboardAmpfora() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F6F7FA' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E4EF',
        }}
      >
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div style={{ fontWeight: 600, color: '#1A1D56' }}>
          Ampfora Real Estate — Valorisation du portefeuille
        </div>
      </div>
      <iframe
        src="/dashboards/ampfora-valorisation.html"
        title="Ampfora Real Estate — Valorisation"
        style={{ flex: 1, width: '100%', border: 'none' }}
      />
    </div>
  );
}
