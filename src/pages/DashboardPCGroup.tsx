import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { supabase } from '@/integrations/supabase/client';
import {
  AVAILABLE_MONTHS,
  EMPTY_ENTITY_ROUTES,
  getMonthData,
  type MonthId,
  type PCGroupEntityRoutes,
} from '@/components/dashboard/pcgroup/PCGroupData';
import { PCGroupOverviewTab } from '@/components/dashboard/pcgroup/PCGroupOverviewTab';
import { PCGroupYTDTab } from '@/components/dashboard/pcgroup/PCGroupYTDTab';
import { PCGroupAgencyTab } from '@/components/dashboard/pcgroup/PCGroupAgencyTab';
import { PCGroupStructuringTab } from '@/components/dashboard/pcgroup/PCGroupStructuringTab';
import { PCGroupDigitTab } from '@/components/dashboard/pcgroup/PCGroupDigitTab';
import { PCGroupSpyTab } from '@/components/dashboard/pcgroup/PCGroupSpyTab';
import { PCGroupCommentTab } from '@/components/dashboard/pcgroup/PCGroupCommentTab';
import { PCGroupHoldingTab } from '@/components/dashboard/pcgroup/PCGroupHoldingTab';
import './DashboardPCGroup.css';

const tabs = [
  { id: 'overview', icon: '📊', label: 'Vue Groupe' },
  { id: 'ytd', icon: '📈', label: 'YTD 2026' },
  { id: 'agency', icon: '📢', label: 'Agency' },
  { id: 'structuring', icon: '🏛️', label: 'Structuring' },
  { id: 'digit', icon: '💻', label: 'Digit Solution' },
  { id: 'spy', icon: '🔍', label: 'SPY' },
  { id: 'comment', icon: '💬', label: 'Comment' },
  { id: 'holding', icon: '🏛️', label: 'Holding' },
];

export default function DashboardPCGroup() {
  const [tab, setTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState<MonthId>('feb-2026');
  const [entityRoutes, setEntityRoutes] = useState<PCGroupEntityRoutes>(EMPTY_ENTITY_ROUTES);
  const navigate = useNavigate();

  useEffect(() => {
    const loadEntityRoutes = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, layout_type')
        .in('layout_type', ['prime_circle_agency', 'prime_circle', 'digit']);

      if (error || !data) {
        console.error('[DashboardPCGroup] Unable to load entity routes:', error);
        return;
      }

      const nextRoutes: PCGroupEntityRoutes = { ...EMPTY_ENTITY_ROUTES };

      for (const company of data) {
        if (company.layout_type === 'prime_circle_agency' && !nextRoutes.agency) {
          nextRoutes.agency = `/dashboard-prime-circle-agency/${company.id}`;
        }
        if (company.layout_type === 'prime_circle' && !nextRoutes.structuring) {
          nextRoutes.structuring = `/dashboard-prime-circle/${company.id}`;
        }
        if (company.layout_type === 'digit' && !nextRoutes.digit) {
          nextRoutes.digit = `/dashboard-digit/${company.id}`;
        }
      }

      setEntityRoutes(nextRoutes);
    };

    loadEntityRoutes();
  }, []);

  const monthData = getMonthData(selectedMonth);

  // Dynamic tab amounts from selected month data
  const tabAmounts: Record<string, string> = {
    ytd: monthData.ytdHero[1]?.value || '',
    agency: monthData.agencyKPIs[2]?.value || '',
    structuring: monthData.structuringKPIs[1]?.value || '',
    digit: monthData.digitKPIs[1]?.value || '',
    spy: monthData.spyKPIs[1]?.value || '',
    comment: monthData.commentKPIs[1]?.value || '',
    holding: monthData.holdingKPIs[1]?.value || '',
    reserves: monthData.reservesHero[monthData.reservesHero.length > 2 ? 2 : 1]?.value || '',
  };

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
          <MonthSelector
            months={AVAILABLE_MONTHS}
            selectedMonth={selectedMonth}
            onMonthChange={(id) => setSelectedMonth(id as MonthId)}
            variant="gold"
          />
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
              {tabAmounts[t.id] && <span className="pcg-tab-amount">{tabAmounts[t.id]}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="pcg-main">
        {tab === 'overview' && <PCGroupOverviewTab data={monthData} entityRoutes={entityRoutes} />}
        {tab === 'ytd' && <PCGroupYTDTab data={monthData} />}
        {tab === 'agency' && <PCGroupAgencyTab data={monthData} entityRoutes={entityRoutes} />}
        {tab === 'structuring' && <PCGroupStructuringTab data={monthData} entityRoutes={entityRoutes} />}
        {tab === 'digit' && <PCGroupDigitTab data={monthData} entityRoutes={entityRoutes} />}
        {tab === 'spy' && <PCGroupSpyTab data={monthData} />}
        {tab === 'comment' && <PCGroupCommentTab data={monthData} />}
        {tab === 'holding' && <PCGroupHoldingTab data={monthData} />}
      </main>

      <footer className="pcg-footer">
        <strong>Prime Circle Group</strong> — Dashboard Consolidé | {monthData.monthLabel} | Confidentiel
      </footer>
    </div>
  );
}
