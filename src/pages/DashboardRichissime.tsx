import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';

import { RichissimeSidebar } from '@/components/dashboard/richissime/RichissimeSidebar';
import { RichissimeHeader } from '@/components/dashboard/richissime/RichissimeHeader';
import { RichissimeKPICard } from '@/components/dashboard/richissime/RichissimeKPICard';
import { RichissimeChartContainer } from '@/components/dashboard/richissime/RichissimeChartContainer';
import { RichissimeDataTable, StatusBadge, TrendBadge } from '@/components/dashboard/richissime/RichissimeDataTable';
import { RichissimeAlertCard } from '@/components/dashboard/richissime/RichissimeAlertCard';
import { RichissimeActionCard } from '@/components/dashboard/richissime/RichissimeActionCard';
import { RichissimeVarianceCard } from '@/components/dashboard/richissime/RichissimeVarianceCard';
import { RichissimeInsightCard } from '@/components/dashboard/richissime/RichissimeInsightCard';
import { RichissimeSummaryBox } from '@/components/dashboard/richissime/RichissimeSummaryBox';
import { RichissimeObjectiveItem } from '@/components/dashboard/richissime/RichissimeObjectiveItem';
import {
  RichissimeOverviewChart, RichissimeProductsDonut, RichissimeCostsDonut,
  RichissimeForecastBarChart, RichissimeVarianceChart, RichissimeYearlyChart,
  RichissimeRadarChart, RichissimeCumulativeChart, RichissimeEvolution2026Chart,
  RichissimeScenariosChart, RichissimeQuarterlyChart, RichissimeProductsPie,
  RichissimeProductsBarChart, RichissimeCostsMonthlyChart, RichissimeCostsStructureChart,
  RichissimeMarginsEvolutionChart, RichissimeMarginsComparisonChart, RichissimeWaterfallChart,
  RichissimeRoadmapChart
} from '@/components/dashboard/richissime/RichissimeCharts';
import {
  NAV_ITEMS, PAGE_TITLES, SCENARIOS, Q4_TABLE_DATA, PRODUCTS_TABLE_DATA,
  KPI_TABLE_DATA, ALERTS, ACTIONS, OBJECTIVES, VARIANCE_DATA, INSIGHTS
} from '@/components/dashboard/richissime/RichissimeData';

interface Company { id: string; name: string; logo_url: string | null; layout_type: string; currency: string; }

export default function DashboardRichissime() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scenario, setScenario] = useState('base');
  const { toast } = useToast();

  const currentScenario = SCENARIOS[scenario];

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
        if (error) throw error;
        setCompany(data);
      } catch (error) {
        toast({ title: 'Erreur', description: 'Impossible de charger les données', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-richissime-cream flex items-center justify-center"><div className="w-8 h-8 border-4 border-richissime-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!company) return <div className="min-h-screen bg-richissime-cream flex items-center justify-center text-richissime-muted">Client non trouvé</div>;

  const pageInfo = PAGE_TITLES[activePage];
  const ebitda2026 = Math.round(currentScenario.total2026 * currentScenario.margins.operating / 100);

  return (
    <div className="min-h-screen bg-richissime-cream flex font-montserrat">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white border border-richissime-border rounded-lg shadow-sm">
        <Menu className="w-5 h-5 text-richissime-text" />
      </button>
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <RichissimeSidebar companyName={company.name} logoUrl={company.logo_url} navItems={NAV_ITEMS} activePage={activePage} onPageChange={(p) => { setActivePage(p); setSidebarOpen(false); }} onBack={() => navigate('/')} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 min-w-0">
        <RichissimeHeader title={pageInfo.title} subtitle={pageInfo.subtitle} scenario={scenario} onScenarioChange={setScenario} />
        <main className="p-4 lg:p-8 max-w-[1600px]">
          {activePage === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <RichissimeKPICard label="CA Total 2025" value="868.1 k€" trend="+67% vs 2024" trendPositive variant="highlight" />
                <RichissimeKPICard label="CA Q4 2025" value="299.5 k€" trend="+3.3% vs prévu" trendPositive variant="gold" />
                <RichissimeKPICard label="EBITDA Q4" value="113.1 k€" trend="Marge: 37.8%" variant="success" />
                <RichissimeKPICard label="Clients Actifs" value="1,847" trend="+312 ce trimestre" trendPositive small />
                <RichissimeKPICard label="Ratio LTV/CAC" value="4.8x" trend="Objectif: 4.0x" variant="success" small />
              </div>
              <RichissimeChartContainer title="Évolution CA 2025 - Réel vs Prévisionnel" subtitle="Performance mensuelle" badge={{ label: '+3.3% Q4', type: 'success' }} tall><RichissimeOverviewChart /></RichissimeChartContainer>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RichissimeChartContainer title="Répartition CA par Produit"><RichissimeProductsDonut /></RichissimeChartContainer>
                <RichissimeChartContainer title="Structure des Coûts Q4"><RichissimeCostsDonut /></RichissimeChartContainer>
              </div>
              <RichissimeDataTable columns={[{ key: 'month', header: 'Mois', render: (v) => <strong>{v}</strong> }, { key: 'caReal', header: 'CA Réel' }, { key: 'caPrev', header: 'CA Prévu' }, { key: 'ecart', header: 'Écart', render: (v, r) => <span className={r.ecartPositive ? 'text-richissime-success' : 'text-richissime-warning'}>{v}</span> }, { key: 'ebitda', header: 'EBITDA' }, { key: 'margin', header: 'Marge', render: (v, r) => <span className={r.marginHighlight ? 'text-richissime-success font-semibold' : r.marginWarning ? 'text-richissime-warning' : ''}>{v}</span> }, { key: 'status', header: 'Statut', render: (v, r) => <StatusBadge status={v} type={r.statusType} /> }]} data={Q4_TABLE_DATA} />
            </div>
          )}

          {activePage === 'forecast' && (
            <div className="space-y-6 animate-fade-in">
              <RichissimeSummaryBox items={[{ value: '+9.5 k€', label: 'Écart CA Q4', color: 'success' }, { value: '+3.3%', label: 'Variance %' }, { value: '-12.9 k€', label: 'Écart EBITDA', color: 'danger' }, { value: '2/3', label: 'Mois au-dessus' }]} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RichissimeChartContainer title="CA Mensuel: Réel vs Prévu"><RichissimeForecastBarChart /></RichissimeChartContainer>
                <RichissimeChartContainer title="Écarts de Performance (%)"><RichissimeVarianceChart /></RichissimeChartContainer>
              </div>
              <RichissimeChartContainer title="Tendance Annuelle 2025" badge={{ label: '12 mois', type: 'info' }} tall><RichissimeYearlyChart /></RichissimeChartContainer>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <RichissimeVarianceCard {...VARIANCE_DATA.october} />
                <RichissimeVarianceCard {...VARIANCE_DATA.november} />
                <RichissimeVarianceCard {...VARIANCE_DATA.december} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RichissimeChartContainer title="Radar: Performance vs Objectifs"><RichissimeRadarChart /></RichissimeChartContainer>
                <RichissimeChartContainer title="Cumul CA 2025"><RichissimeCumulativeChart /></RichissimeChartContainer>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {INSIGHTS.map((insight, idx) => <RichissimeInsightCard key={idx} {...insight} />)}
              </div>
            </div>
          )}

          {activePage === 'evolution' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <RichissimeKPICard label="CA Total 2026" value={`${currentScenario.total2026.toLocaleString()} k€`} variant="gold" />
                <RichissimeKPICard label="Croissance vs 2025" value={currentScenario.growth} variant="success" />
                <RichissimeKPICard label="CA Moyen Mensuel" value={`${Math.round(currentScenario.total2026 / 12)} k€`} />
                <RichissimeKPICard label="Pic CA Prévu" value={`${Math.max(...currentScenario.forecast2026)} k€`} trend="Nov 2026" />
              </div>
              <RichissimeChartContainer title="Projection CA Mensuel 2026" tall><RichissimeEvolution2026Chart scenario={currentScenario} /></RichissimeChartContainer>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RichissimeChartContainer title="Comparaison des 3 Scénarios"><RichissimeScenariosChart /></RichissimeChartContainer>
                <RichissimeChartContainer title="CA Trimestriel 2026"><RichissimeQuarterlyChart scenario={currentScenario} /></RichissimeChartContainer>
              </div>
            </div>
          )}

          {activePage === 'products' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <RichissimeKPICard label="Liberty Cashflow" value="45%" trend="134.8 k€ Q4" variant="gold" />
                <RichissimeKPICard label="Masterclasses" value="22%" trend="65.9 k€ Q4" />
                <RichissimeKPICard label="Coaching 1-to-1" value="18%" trend="53.9 k€ Q4" />
                <RichissimeKPICard label="Podcast & Affiliation" value="15%" trend="44.9 k€ Q4" small />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RichissimeChartContainer title="Répartition CA par Produit Q4"><RichissimeProductsPie /></RichissimeChartContainer>
                <RichissimeChartContainer title="Performance: Réel vs Prévu"><RichissimeProductsBarChart /></RichissimeChartContainer>
              </div>
              <RichissimeDataTable columns={[{ key: 'name', header: 'Produit', render: (v) => <strong>{v}</strong> }, { key: 'ca', header: 'CA Q4' }, { key: 'mix', header: '% Mix' }, { key: 'marge', header: 'Marge', render: (v, r) => <span className={r.margeSuccess ? 'text-richissime-success' : ''}>{v}</span> }, { key: 'clients', header: 'Clients' }, { key: 'ticket', header: 'Ticket Moyen' }, { key: 'trend', header: 'Tendance', render: (v, r) => <TrendBadge trend={v} type={r.trendType} /> }]} data={PRODUCTS_TABLE_DATA} />
            </div>
          )}

          {activePage === 'costs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <RichissimeKPICard label="Total Charges Q4" value="186.4 k€" trend="62.2% du CA" />
                <RichissimeKPICard label="Coût Formateurs" value="16.5%" trend="+3.5% vs prévu" trendPositive={false} />
                <RichissimeKPICard label="Marketing" value="21.2%" trend="+6.2% vs prévu" trendPositive={false} variant="warning" />
                <RichissimeKPICard label="Stripe & Plateforme" value="9.0%" trend="Conforme" small />
              </div>
              <RichissimeChartContainer title="📊 Octobre 2025 (CA: 97.3 k€)" badge={{ label: 'EBITDA: 40%', type: 'success' }} footer={<div className="bg-green-50 border-l-4 border-richissime-success rounded-lg p-4"><strong className="text-richissime-success">💬 Octobre:</strong> Lancement masterclass réussi. Surcoûts compensés par CA additionnel.</div>}><RichissimeCostsMonthlyChart month="oct" /></RichissimeChartContainer>
              <RichissimeChartContainer title="📊 Novembre 2025 (CA: 112.8 k€)" badge={{ label: 'EBITDA: 45.9% ⭐', type: 'success' }} footer={<div className="bg-green-50 border-l-4 border-richissime-success rounded-lg p-4"><strong className="text-richissime-success">💬 Novembre:</strong> Record! Black Friday avec ROI marketing de 4.1x.</div>}><RichissimeCostsMonthlyChart month="nov" /></RichissimeChartContainer>
              <RichissimeChartContainer title="📊 Décembre 2025 (CA: 89.4 k€)" badge={{ label: 'EBITDA: 25.1% ⚠️', type: 'danger' }} footer={<div className="bg-red-50 border-l-4 border-richissime-danger rounded-lg p-4"><strong className="text-richissime-danger">💬 Décembre:</strong> Marketing 30% avec ROI de 1.2x. À éviter en 2026.</div>}><RichissimeCostsMonthlyChart month="dec" /></RichissimeChartContainer>
              <RichissimeSummaryBox title="📋 Synthèse Coûts Q4" items={[{ value: '299.5 k€', label: 'CA Total', color: 'gold' }, { value: '186.4 k€', label: 'Charges', color: 'warning' }, { value: '113.1 k€', label: 'EBITDA', color: 'success' }, { value: '37.8%', label: 'Marge' }]} />
              <RichissimeChartContainer title="Structure Coûts par Scénario 2026"><RichissimeCostsStructureChart /></RichissimeChartContainer>
            </div>
          )}

          {activePage === 'margins' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <RichissimeKPICard label="EBITDA 2026" value={`${ebitda2026.toLocaleString()} k€`} variant="success" />
                <RichissimeKPICard label="Marge Brute" value={`${currentScenario.margins.gross}%`} />
                <RichissimeKPICard label="Marge Opérationnelle" value={`${currentScenario.margins.operating}%`} variant="success" />
                <RichissimeKPICard label="LTV Client" value="892 €" trend="+18%" trendPositive small />
                <RichissimeKPICard label="CAC" value="187 €" trend="-12%" trendPositive small />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RichissimeChartContainer title="Évolution Marges Q4"><RichissimeMarginsEvolutionChart /></RichissimeChartContainer>
                <RichissimeChartContainer title="Marges par Scénario"><RichissimeMarginsComparisonChart /></RichissimeChartContainer>
              </div>
              <RichissimeChartContainer title="Cascade EBITDA Q4" tall><RichissimeWaterfallChart /></RichissimeChartContainer>
              <RichissimeDataTable columns={[{ key: 'kpi', header: 'KPI', render: (v) => <strong>{v}</strong> }, { key: 'q4', header: 'Q4 2025' }, { key: 'objectif', header: 'Objectif' }, { key: 'ecart', header: 'Écart', render: (v, r) => <span className={r.ecartPositive ? 'text-richissime-success' : 'text-richissime-danger'}>{v}</span> }, { key: 'benchmark', header: 'Benchmark' }, { key: 'status', header: 'Statut', render: (v, r) => <StatusBadge status={v} type={r.statusType} /> }]} data={KPI_TABLE_DATA} />
            </div>
          )}

          {activePage === 'objectives' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <RichissimeKPICard label="Objectif CA 2026" value={`${currentScenario.total2026.toLocaleString()} k€`} variant="highlight" />
                <RichissimeKPICard label="Croissance Cible" value={currentScenario.growth} variant="success" />
                <RichissimeKPICard label="Objectif EBITDA" value={`${ebitda2026.toLocaleString()} k€`} />
                <RichissimeKPICard label="Marge Cible" value={`${currentScenario.margins.operating}%`} />
              </div>
              <RichissimeSummaryBox title="🏆 Objectifs Stratégiques 2026" items={[]} />
              <div className="bg-gradient-to-r from-richissime-gold-pale to-white border-2 border-richissime-gold rounded-[14px] p-6 space-y-5">
                {OBJECTIVES.map((obj, idx) => <RichissimeObjectiveItem key={idx} {...obj} />)}
              </div>
              <RichissimeChartContainer title="Roadmap CA 2026 par Trimestre"><RichissimeRoadmapChart scenario={currentScenario} /></RichissimeChartContainer>
            </div>
          )}

          {activePage === 'alerts' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="font-playfair text-xl text-richissime-navy">🚨 Alertes Critiques</h3>
              <div className="space-y-4">{ALERTS.filter(a => a.type === 'critical').map((alert, idx) => <RichissimeAlertCard key={idx} type="critical" title={alert.title} description={alert.description} />)}</div>
              <h3 className="font-playfair text-xl text-richissime-navy mt-8">⚠️ Alertes Modérées</h3>
              <div className="space-y-4">{ALERTS.filter(a => a.type === 'warning').map((alert, idx) => <RichissimeAlertCard key={idx} type="warning" title={alert.title} description={alert.description} />)}</div>
              <div className="space-y-4">{ALERTS.filter(a => a.type === 'success').map((alert, idx) => <RichissimeAlertCard key={idx} type="success" title={alert.title} description={alert.description} />)}</div>
              <h3 className="font-playfair text-xl text-richissime-navy mt-8">🎯 Plan d'Actions</h3>
              <div className="space-y-4">{ACTIONS.map((action, idx) => <RichissimeActionCard key={idx} priority={action.priority as any} title={action.title} description={action.description} />)}</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
