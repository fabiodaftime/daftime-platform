import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DashboardAmpfora() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#FAF7F2' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 20px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E0D3',
        }}
      >
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} style={{ color: '#0A1628' }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div style={{ fontWeight: 500, color: '#0A1628', letterSpacing: 3, textTransform: 'uppercase', fontSize: 12, fontFamily: "'Poppins', sans-serif" }}>
          Ampfora Real Estate · Valorisation du portefeuille
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
