import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HotelXOverviewTab } from '@/components/dashboard/hotelx/HotelXOverviewTab';
import { HotelXRevParTab } from '@/components/dashboard/hotelx/HotelXRevParTab';
import { HotelXPLTab } from '@/components/dashboard/hotelx/HotelXPLTab';
import { HotelXCostTab } from '@/components/dashboard/hotelx/HotelXCostTab';
import { HotelXTaxTab } from '@/components/dashboard/hotelx/HotelXTaxTab';
import { HotelXBenchmarkTab } from '@/components/dashboard/hotelx/HotelXBenchmarkTab';
import { HotelXMarketTab } from '@/components/dashboard/hotelx/HotelXMarketTab';
import './DashboardHotelX.css';

const tabs = [
  { id: 'overview', icon: '🏨', label: 'Overview' },
  { id: 'revpar', icon: '📊', label: 'RevPAR & Rooms' },
  { id: 'pl', icon: '💰', label: 'P&L Statement' },
  { id: 'cost', icon: '⚙️', label: 'Cost Structure' },
  { id: 'tax', icon: '🏦', label: 'Tax & Compliance' },
  { id: 'benchmark', icon: '📈', label: 'Benchmarks & Outlook' },
  { id: 'market', icon: '📝', label: 'Market Commentary' },
];

export default function DashboardHotelX() {
  const [tab, setTab] = useState('overview');
  const navigate = useNavigate();

  return (
    <div className="hx-dashboard">
      <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <header className="hx-header">
        <div className="hx-header-accent" />
        <div className="hx-header-body">
          <div>
            <Button variant="ghost" size="sm" onClick={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))} style={{color:'rgba(245,240,232,.6)',marginBottom:'.3rem'}}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="hx-name"><em>Hotel X</em> — Al Hamra Beachfront</div>
            <div className="hx-tag">Ras Al Khaimah · UAE · Luxury Resort · 350 Keys · [Strictly Confidential]</div>
          </div>
          <div className="hx-right">
            <div className="hx-period">Financial Dashboard — FY 2025</div>
            <div className="hx-sub"><span className="hx-dot" />Updated March 2025 · All amounts in AED unless stated</div>
          </div>
        </div>
      </header>

      <div className="hx-disc">
        <strong>⚠ Recalibrated data (v3):</strong> Weighted ADR AED 729 · RevPAR AED 519 · Total Revenue AED 95.4M — calibrated against STR/CoStar RAK 2024-2025 actuals & OTA observed rates.
      </div>

      <nav className="hx-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`hx-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <main className="hx-main" key={tab}>
        {tab === 'overview' && <HotelXOverviewTab />}
        {tab === 'revpar' && <HotelXRevParTab />}
        {tab === 'pl' && <HotelXPLTab />}
        {tab === 'cost' && <HotelXCostTab />}
        {tab === 'tax' && <HotelXTaxTab />}
        {tab === 'benchmark' && <HotelXBenchmarkTab />}
        {tab === 'market' && <HotelXMarketTab />}
      </main>

      <footer className="hx-footer">
        <div><span>Hotel X — Al Hamra Beachfront</span> · Internal Financial Dashboard · Strictly Confidential</div>
        <div>Prepared by Finance & Controlling · Advisory Services · © 2025</div>
        <div>Sources: <span>CoStar/STR · Knight Frank MENA 2025 · Gulf Insider · FTA UAE · RAK TDA</span></div>
      </footer>
    </div>
  );
}
