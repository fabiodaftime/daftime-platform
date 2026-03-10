import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PCGroupOverviewTab } from '@/components/dashboard/pcgroup/PCGroupOverviewTab';
import { PCGroupYTDTab } from '@/components/dashboard/pcgroup/PCGroupYTDTab';
import { PCGroupAgencyTab } from '@/components/dashboard/pcgroup/PCGroupAgencyTab';
import { PCGroupStructuringTab } from '@/components/dashboard/pcgroup/PCGroupStructuringTab';
import { PCGroupDigitTab } from '@/components/dashboard/pcgroup/PCGroupDigitTab';
import { PCGroupSpyTab } from '@/components/dashboard/pcgroup/PCGroupSpyTab';
import { PCGroupCommentTab } from '@/components/dashboard/pcgroup/PCGroupCommentTab';
import { PCGroupHoldingTab } from '@/components/dashboard/pcgroup/PCGroupHoldingTab';
import { PCGroupReservesTab } from '@/components/dashboard/pcgroup/PCGroupReservesTab';
import './DashboardPCGroup.css';

const tabs = [
  { id: 'overview', icon: '📊', label: 'Vue Groupe' },
  { id: 'ytd', icon: '📈', label: 'YTD 2026', amount: '$202K' },
  { id: 'agency', icon: '📢', label: 'Agency', amount: '$12.2K' },
  { id: 'structuring', icon: '🏛️', label: 'Structuring', amount: '$53.3K' },
  { id: 'digit', icon: '💻', label: 'Digit Solution', amount: '$43.2K' },
  { id: 'spy', icon: '🔍', label: 'SPY', amount: '$3.6K' },
  { id: 'comment', icon: '💬', label: 'Comment', amount: '$52' },
  { id: 'holding', icon: '🏛️', label: 'Holding', amount: '$94.1K' },
  { id: 'reserves', icon: '💰', label: 'Réserves', amount: '$20.2K' },
];

export default function DashboardPCGroup() {
  const [tab, setTab] = useState('overview');
  const navigate = useNavigate();

  return (
    <div className="pcg-dashboard">
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet" />

      <header className="pcg-header">
        <div className="pcg-header-top">
          <div className="pcg-brand">
            <div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="pcg-back-btn">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="pcg-logo-main">Prime <span className="italic">Circle</span></div>
              <div className="pcg-logo-sub">Group</div>
            </div>
            <div className="pcg-header-divider" />
            <div className="pcg-header-title">
              <h1>Dashboard Consolidé</h1>
              <p className="subtitle">6 Entités • Holding Model</p>
            </div>
          </div>
          <div className="pcg-period-badge">Février 2026</div>
        </div>

        <nav className="pcg-nav-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`pcg-nav-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span>
              {t.label}
              {t.amount && <span className="pcg-tab-amount">{t.amount}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="pcg-main">
        {tab === 'overview' && <PCGroupOverviewTab />}
        {tab === 'ytd' && <PCGroupYTDTab />}
        {tab === 'agency' && <PCGroupAgencyTab />}
        {tab === 'structuring' && <PCGroupStructuringTab />}
        {tab === 'digit' && <PCGroupDigitTab />}
        {tab === 'spy' && <PCGroupSpyTab />}
        {tab === 'comment' && <PCGroupCommentTab />}
        {tab === 'holding' && <PCGroupHoldingTab />}
        {tab === 'reserves' && <PCGroupReservesTab />}
      </main>

      <footer className="pcg-footer">
        <strong>Prime Circle Group</strong> — Dashboard Consolidé | Février 2026 | Confidentiel
      </footer>
    </div>
  );
}
