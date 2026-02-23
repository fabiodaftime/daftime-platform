import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NexusOverviewTab } from '@/components/dashboard/nexus/NexusOverviewTab';
import { NexusAgencyTab } from '@/components/dashboard/nexus/NexusAgencyTab';
import { NexusStructuringTab } from '@/components/dashboard/nexus/NexusStructuringTab';
import { NexusDigitTab } from '@/components/dashboard/nexus/NexusDigitTab';
import { NexusSpyTab } from '@/components/dashboard/nexus/NexusSpyTab';
import { NexusCommentTab } from '@/components/dashboard/nexus/NexusCommentTab';
import { NexusHoldingTab } from '@/components/dashboard/nexus/NexusHoldingTab';
import './DashboardPCGroup.css';

const tabs = [
  { id: 'overview', icon: '📊', label: 'Vue Groupe' },
  { id: 'agency', icon: '📡', label: 'Media Agency', amount: '$3.1K' },
  { id: 'structuring', icon: '🏦', label: 'Finance Corp', amount: '$38.2K' },
  { id: 'digit', icon: '⚡', label: 'Tech Solutions', amount: '$44.7K' },
  { id: 'spy', icon: '🔍', label: 'DataTools', amount: '$4.8K' },
  { id: 'comment', icon: '💬', label: 'ReviewBoost', amount: '$2.9K' },
  { id: 'holding', icon: '🏛️', label: 'Holding', amount: '$8.8K' },
];

export default function DashboardNexus() {
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
              <div className="pcg-logo-main">Nexus <span className="italic">Ventures</span></div>
              <div className="pcg-logo-sub">Group</div>
            </div>
            <div className="pcg-header-divider" />
            <div className="pcg-header-title">
              <h1>Dashboard Consolidé</h1>
              <p className="subtitle">Vue Financière Groupe</p>
            </div>
          </div>
          <div className="pcg-period-badge">Janvier 2026</div>
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
        {tab === 'overview' && <NexusOverviewTab />}
        {tab === 'agency' && <NexusAgencyTab />}
        {tab === 'structuring' && <NexusStructuringTab />}
        {tab === 'digit' && <NexusDigitTab />}
        {tab === 'spy' && <NexusSpyTab />}
        {tab === 'comment' && <NexusCommentTab />}
        {tab === 'holding' && <NexusHoldingTab />}
      </main>

      <footer className="pcg-footer">
        <strong>Nexus Ventures Group</strong> — Dashboard Consolidé | Janvier 2026 | Confidentiel
      </footer>
    </div>
  );
}
