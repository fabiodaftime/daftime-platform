import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  EMPTY_ENTITY_ROUTES,
  getMonthData,
  getPCGroupAvailableMonths,
  type MonthId,
  type PCGroupEntityRoutes,
} from '@/components/dashboard/pcgroup/PCGroupData';
import { PCGroupOverviewTab } from '@/components/dashboard/pcgroup/PCGroupOverviewTab';
import { PCGroupYTDTab } from '@/components/dashboard/pcgroup/PCGroupYTDTab';
import { PCGroupEntitiesAccordion } from '@/components/dashboard/pcgroup/PCGroupEntitiesAccordion';
import { PCGroupIntercosTab } from '@/components/dashboard/pcgroup/PCGroupIntercosTab';
import { usePCGroupConfig } from '@/components/dashboard/pcgroup/config/usePCGroupConfig';
import { useLivePCGroupConfig } from '@/components/dashboard/pcgroup/config/useLivePCGroupConfig';
import { EmptyConfigState } from '@/components/dashboard/pcgroup/config/EmptyConfigState';
import { buildHeaderSubtitle } from '@/components/dashboard/pcgroup/pcGroupHeaderLabels';
import { useEntityInputs } from '@/lib/entityInputs/hooks';
import './DashboardPCGroup.css';

const tabs = [
  { id: 'overview', icon: '📊', label: 'Vue Groupe' },
  { id: 'ytd', icon: '📈', label: 'YTD 2026' },
  { id: 'entities', icon: '🏢', label: 'Détail entités' },
  { id: 'intercos', icon: '💸', label: 'Flux Intercos' },
];

export default function DashboardPCGroup() {
  // Hydrate le store PCGroup depuis Supabase (entités, mois, règles, manuel).
  // Tout edit admin → invalidate → re-render automatique du dashboard.
  const cfgQuery = usePCGroupConfig();
  const liveConfig = useLivePCGroupConfig();
  const { isSuperAdmin } = useAuth();
  // Hydrate canonical entity inputs (Digit pilot) → propagated into the
  // consolidated aggregator via the sync store.
  useEntityInputs('digit');

  // Mois disponibles = intersection (sources + bloc manuel) ∩ mois actifs en BDD.
  const activeMonthIds = new Set(
    liveConfig.months.filter((m) => m.is_active).map((m) => m.month_id),
  );
  const availableMonths = getPCGroupAvailableMonths().filter((m) => activeMonthIds.has(m.id));
  const activeEntities = liveConfig.entities.filter((e) => e.is_active);
  const entitiesCount = activeEntities.length;

  const defaultMonth = (availableMonths[availableMonths.length - 1]?.id ?? 'mar-2026') as MonthId;
  const [tab, setTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState<MonthId>(defaultMonth);

  // Si le mois sélectionné disparaît (admin l’a désactivé), bascule sur le dernier dispo.
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.some((m) => m.id === selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1].id as MonthId);
    }
  }, [availableMonths, selectedMonth]);
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

  // État vide : config pas encore configurée (entités ou mois disponibles).
  if (cfgQuery.isLoading && !cfgQuery.data) {
    return <EmptyConfigState reason="loading" isSuperAdmin={isSuperAdmin} />;
  }
  if (entitiesCount === 0) {
    return <EmptyConfigState reason="no-entities" isSuperAdmin={isSuperAdmin} />;
  }
  if (availableMonths.length === 0) {
    return <EmptyConfigState reason="no-months" isSuperAdmin={isSuperAdmin} />;
  }

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
              <p className="subtitle">
                {buildHeaderSubtitle(liveConfig.entities, availableMonths.length)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isSuperAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/pcgroup-entities')}
                  title="Gérer les filiales (super admin)"
                  style={{ borderColor: '#D4A85555', color: '#D4A855', background: 'transparent' }}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Filiales
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/pcgroup-diagnostics')}
                  title="Checks de cohérence (super admin)"
                  style={{ borderColor: '#D4A85555', color: '#D4A855', background: 'transparent' }}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Diagnostics
                </Button>
              </>
            )}
            <MonthSelector
              months={availableMonths}
              selectedMonth={selectedMonth}
              onMonthChange={(id) => setSelectedMonth(id as MonthId)}
              variant="gold"
            />
          </div>
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
        {tab === 'overview' && <PCGroupOverviewTab data={monthData} entityRoutes={entityRoutes} monthId={selectedMonth} entitiesCount={entitiesCount} />}
        {tab === 'ytd' && <PCGroupYTDTab data={monthData} />}
        {tab === 'entities' && <PCGroupEntitiesAccordion data={monthData} entityRoutes={entityRoutes} />}
        {tab === 'intercos' && <PCGroupIntercosTab data={monthData} />}
        {tab === 'history' && <RestatementHistoryTab accent="gold" />}
      </main>

      <footer className="pcg-footer">
        <strong>Prime Circle Group</strong> — Dashboard Consolidé | {monthData.monthLabel} | Confidentiel
      </footer>
    </div>
  );
}
