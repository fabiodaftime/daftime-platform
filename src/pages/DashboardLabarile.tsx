import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';

// Labarile Components
import { LabarileSidebar } from '@/components/dashboard/labarile/LabarileSidebar';
import { LabarileHeader } from '@/components/dashboard/labarile/LabarileHeader';
import { LabarileKPICard } from '@/components/dashboard/labarile/LabarileKPICard';
import { LabarileChartContainer } from '@/components/dashboard/labarile/LabarileChartContainer';
import { LabarileAlertCard } from '@/components/dashboard/labarile/LabarileAlertCard';
import { LabarileActionCard } from '@/components/dashboard/labarile/LabarileActionCard';
import { LabarileDataTable } from '@/components/dashboard/labarile/LabarileDataTable';
import { LabarileObjectiveCard } from '@/components/dashboard/labarile/LabarileObjectiveCard';
import { 
  LabarileMainRevenueChart, 
  LabarileDonutChart, 
  LabarileEvolutionChart,
  LabarileServicesMixChart,
  LabarileCostsChart,
  LabarileMarginsChart
} from '@/components/dashboard/labarile/LabarileCharts';
import { 
  SCENARIOS, 
  Q4_DATA, 
  ALERTS, 
  ACTIONS, 
  OBJECTIVES,
  Scenario
} from '@/components/dashboard/labarile/LabarileData';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  layout_type: string;
  currency: string;
}

const NAV_ITEMS = [
  { id: 'overview', label: "Vue d'Ensemble", icon: '📊' },
  { id: 'evolution', label: 'Évolution CA', icon: '📈' },
  { id: 'services', label: 'CA par Services', icon: '🎯' },
  { id: 'costs', label: 'Charges & Coûts', icon: '💰' },
  { id: 'margins', label: 'Marges & Rentabilité', icon: '💹' },
  { id: 'objectives', label: 'Objectifs 2026', icon: '🎖️' },
  { id: 'alerts', label: 'Alertes & Actions', icon: '⚠️' },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Vue d'Ensemble Financière", subtitle: "Q4 2025 • Données Ajustées" },
  evolution: { title: "Évolution du Chiffre d'Affaires", subtitle: "Tendance mensuelle 2026" },
  services: { title: "Répartition CA par Services", subtitle: "Mix produits et scalabilité" },
  costs: { title: "Charges & Structure de Coûts", subtitle: "Optimisation des coûts" },
  margins: { title: "Marges & Rentabilité", subtitle: "Performance financière" },
  objectives: { title: "Objectifs & Projections 2026", subtitle: "Plan stratégique" },
  alerts: { title: "Alertes & Actions Prioritaires", subtitle: "Points d'attention urgents" },
};

export default function DashboardLabarile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scenario, setScenario] = useState('base');
  const [period, setPeriod] = useState('q4-2025');
  const { toast } = useToast();

  const currentScenario: Scenario = SCENARIOS[scenario];

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-labarile-light-gray flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-labarile-primary-dark border-t-transparent rounded-full animate-spin" />
          <p className="text-labarile-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-labarile-light-gray flex items-center justify-center">
        <p className="text-labarile-muted">Client non trouvé</p>
      </div>
    );
  }

  // Computed values
  const ebitda2026 = Math.round(currentScenario.total2026 * currentScenario.margins.operating / 100);
  const avgMonthly = Math.round(currentScenario.total2026 / 12);
  const peakRevenue = Math.max(...currentScenario.forecast2026);
  const scalability = currentScenario.servicesMix.collective + currentScenario.servicesMix.elearning;

  // Donut data
  const servicesDonutData = [
    { name: 'Coaching Individuel', value: currentScenario.servicesMix.individual, color: '#7CC9CC' },
    { name: 'Coaching Collectif', value: currentScenario.servicesMix.collective, color: '#4EB79F' },
    { name: 'E-learning', value: currentScenario.servicesMix.elearning, color: '#9DD8DA' },
  ];

  const costsDonutData = [
    { name: 'Coaches', value: currentScenario.costs.coaches, color: '#E87E60' },
    { name: 'Marketing', value: currentScenario.costs.marketing, color: '#7CC9CC' },
    { name: 'Admin', value: currentScenario.costs.admin, color: '#4EB79F' },
    { name: 'Stripe', value: currentScenario.costs.stripe, color: '#9DD8DA' },
    { name: 'Outils', value: currentScenario.costs.tools, color: '#C9EDEF' },
  ];

  const pageInfo = PAGE_TITLES[activePage] || PAGE_TITLES.overview;

  return (
    <div className="min-h-screen bg-labarile-light-gray flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-labarile-white border border-labarile-border rounded-lg shadow-sm"
      >
        <Menu className="w-5 h-5 text-labarile-text" />
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-20
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <LabarileSidebar
          companyName={company.name}
          logoUrl={company.logo_url}
          navItems={NAV_ITEMS}
          activePage={activePage}
          onPageChange={(page) => {
            setActivePage(page);
            setSidebarOpen(false);
          }}
          onBack={() => navigate('/')}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 min-w-0">
        {/* Header */}
        <LabarileHeader
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          scenario={scenario}
          onScenarioChange={setScenario}
          period={period}
          onPeriodChange={setPeriod}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-8 xl:p-10 max-w-[1600px]">
          {/* Overview Page */}
          {activePage === 'overview' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard
                  label="Run Rate Annualisé"
                  value="5,008 kAED"
                  subtext="Basé sur Q4 2025"
                />
                <LabarileKPICard
                  label="CA Total Q4 2025"
                  value="1,252 kAED"
                  subtext="-64 kAED ajustements"
                  variant="primary"
                />
                <LabarileKPICard
                  label="CA 2026 Prévu"
                  value={`${currentScenario.total2026.toLocaleString()} kAED`}
                  subtext={`${currentScenario.growth} vs 2025`}
                  variant="success"
                />
                <LabarileKPICard
                  label="Marge EBITDA Q4"
                  value="37.5%"
                  subtext="Objectif: 35%"
                  variant="success"
                />
              </div>

              {/* Main Revenue Chart */}
              <LabarileChartContainer title="Évolution CA Mensuel Q4 2025 & Projections 2026" tall>
                <LabarileMainRevenueChart scenario={currentScenario} />
              </LabarileChartContainer>

              {/* Two Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <LabarileChartContainer title="Répartition CA par Service">
                  <LabarileDonutChart data={servicesDonutData} />
                </LabarileChartContainer>

                <LabarileChartContainer title="Structure des Coûts">
                  <LabarileDonutChart data={costsDonutData} />
                </LabarileChartContainer>
              </div>

              {/* Data Table */}
              <LabarileDataTable data={Q4_DATA} />
            </div>
          )}

          {/* Evolution Page */}
          {activePage === 'evolution' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard
                  label="CA Total 2026"
                  value={`${currentScenario.total2026.toLocaleString()} kAED`}
                  variant="primary"
                />
                <LabarileKPICard
                  label="Croissance vs 2025"
                  value={currentScenario.growth}
                  variant="success"
                />
                <LabarileKPICard
                  label="CA Moyen Mensuel 2026"
                  value={`${avgMonthly} kAED`}
                />
                <LabarileKPICard
                  label="Pic de CA Prévu"
                  value={`${peakRevenue} kAED`}
                />
              </div>

              <LabarileChartContainer title="Évolution Détaillée CA 2026" tall>
                <LabarileEvolutionChart scenario={currentScenario} />
              </LabarileChartContainer>
            </div>
          )}

          {/* Services Page */}
          {activePage === 'services' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard
                  label="Coaching Individuel"
                  value={`${currentScenario.servicesMix.individual}%`}
                  variant="primary"
                />
                <LabarileKPICard
                  label="Coaching Collectif"
                  value={`${currentScenario.servicesMix.collective}%`}
                  variant="success"
                />
                <LabarileKPICard
                  label="E-learning"
                  value={`${currentScenario.servicesMix.elearning}%`}
                />
                <LabarileKPICard
                  label="Scalabilité"
                  value={`${scalability}%`}
                  subtext="Collectif + E-learning"
                  variant="success"
                />
              </div>

              <LabarileChartContainer title="Mix Services par Scénario" tall>
                <LabarileServicesMixChart />
              </LabarileChartContainer>
            </div>
          )}

          {/* Costs Page */}
          {activePage === 'costs' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard
                  label="Total Charges Q4"
                  value="782 kAED"
                />
                <LabarileKPICard
                  label="Coût Coaches"
                  value={`${currentScenario.costs.coaches}%`}
                  variant="warning"
                />
                <LabarileKPICard
                  label="Marketing"
                  value={`${currentScenario.costs.marketing}%`}
                  variant="primary"
                />
                <LabarileKPICard
                  label="Stripe / PSP"
                  value={`${currentScenario.costs.stripe}%`}
                />
              </div>

              <LabarileChartContainer title="Structure des Coûts par Scénario" tall>
                <LabarileCostsChart />
              </LabarileChartContainer>
            </div>
          )}

          {/* Margins Page */}
          {activePage === 'margins' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard
                  label="EBITDA 2026"
                  value={`${ebitda2026.toLocaleString()} kAED`}
                  variant="success"
                />
                <LabarileKPICard
                  label="Marge Brute"
                  value={`${currentScenario.margins.gross}%`}
                  variant="primary"
                />
                <LabarileKPICard
                  label="Marge Opérationnelle"
                  value={`${currentScenario.margins.operating}%`}
                  variant="success"
                />
                <LabarileKPICard
                  label="EBITDA Mensuel Moyen"
                  value={`${Math.round(ebitda2026 / 12)} kAED`}
                />
              </div>

              <LabarileChartContainer title="Comparaison Marges par Scénario" tall>
                <LabarileMarginsChart />
              </LabarileChartContainer>
            </div>
          )}

          {/* Objectives Page */}
          {activePage === 'objectives' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard
                  label="Objectif CA 2026"
                  value={`${currentScenario.total2026.toLocaleString()} kAED`}
                  variant="primary"
                />
                <LabarileKPICard
                  label="Progression Requise"
                  value={currentScenario.growth}
                  variant="success"
                />
                <LabarileKPICard
                  label="Objectif Marge Op."
                  value={`${currentScenario.margins.operating}%`}
                />
                <LabarileKPICard
                  label="Mois Restants"
                  value="12"
                  subtext="Toute l'année 2026"
                />
              </div>

              <LabarileChartContainer title="🎯 Objectifs Stratégiques 2026">
                <div className="space-y-4">
                  {OBJECTIVES.map((obj, idx) => (
                    <LabarileObjectiveCard key={idx} {...obj} />
                  ))}
                </div>
              </LabarileChartContainer>
            </div>
          )}

          {/* Alerts Page */}
          {activePage === 'alerts' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Alerts Column */}
                <div>
                  <h3 className="font-bebas text-xl lg:text-2xl text-labarile-title mb-4 lg:mb-6 tracking-wide">
                    ⚠️ Alertes Opérationnelles
                  </h3>
                  <div className="space-y-4">
                    {ALERTS.map((alert, idx) => (
                      <LabarileAlertCard 
                        key={idx} 
                        type={alert.type as 'warning' | 'critical'} 
                        title={alert.title} 
                        description={alert.description} 
                      />
                    ))}
                  </div>
                </div>

                {/* Actions Column */}
                <div>
                  <h3 className="font-bebas text-xl lg:text-2xl text-labarile-title mb-4 lg:mb-6 tracking-wide">
                    🎯 Actions Recommandées
                  </h3>
                  <div className="space-y-4">
                    {ACTIONS.map((action, idx) => (
                      <LabarileActionCard 
                        key={idx}
                        priority={action.priority as 'critical' | 'haute' | 'moyenne'}
                        icon={action.icon}
                        title={action.title}
                        description={action.description}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
