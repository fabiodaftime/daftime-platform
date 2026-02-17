import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';

import { LabarileSidebar } from '@/components/dashboard/labarile/LabarileSidebar';
import { LabarileHeader } from '@/components/dashboard/labarile/LabarileHeader';
import { LabarileKPICard } from '@/components/dashboard/labarile/LabarileKPICard';
import { LabarileChartContainer } from '@/components/dashboard/labarile/LabarileChartContainer';
import { LabarileAlertCard } from '@/components/dashboard/labarile/LabarileAlertCard';
import { LabarileActionCard } from '@/components/dashboard/labarile/LabarileActionCard';
import { LabarileDataTable } from '@/components/dashboard/labarile/LabarileDataTable';
import { LabarileObjectiveCard } from '@/components/dashboard/labarile/LabarileObjectiveCard';
import { LabarileBreakdownPage } from '@/components/dashboard/labarile/LabarileBreakdownPage';
import { LabarileCostsPage } from '@/components/dashboard/labarile/LabarileCostsPage';
import { LabarileTreasuryPage } from '@/components/dashboard/labarile/LabarileTreasuryPage';
import { LabarileTaxesPage } from '@/components/dashboard/labarile/LabarileTaxesPage';
import { LabarileConfigPage } from '@/components/dashboard/labarile/LabarileConfigPage';
import { 
  LabarileMainRevenueChart, 
  LabarileDonutChart, 
  LabarileEvolutionChart,
  LabarileServicesMixChart,
  LabarileMarginsChart
} from '@/components/dashboard/labarile/LabarileCharts';
import { 
  SCENARIOS, 
  Q4_DATA, 
  ALERTS, 
  ACTIONS, 
  QUARTER_COMPARISON_BASE,
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
  { id: 'breakdown', label: 'Breakdown Ventes', icon: '🎯' },
  { id: 'costs', label: 'Charges & Coûts', icon: '💰' },
  { id: 'treasury', label: 'Trésorerie & Dettes', icon: '💵' },
  { id: 'taxes', label: 'Taxes & Provisions', icon: '🏛️' },
  { id: 'objectives', label: 'Objectifs 2026', icon: '🎖️' },
  { id: 'alerts', label: 'Alertes & Actions', icon: '⚠️' },
  { id: 'config', label: 'Configuration', icon: '⚙️' },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Vue d'Ensemble Financière", subtitle: "Q4 2025 • Données Ajustées" },
  evolution: { title: "Évolution du Chiffre d'Affaires", subtitle: "Tendance mensuelle 2026" },
  breakdown: { title: "Breakdown Ventes Q4 2025", subtitle: "Performance closers & programmes" },
  costs: { title: "Charges & Structure de Coûts", subtitle: "Détail mensuel Q4 2025" },
  treasury: { title: "Trésorerie & Dettes", subtitle: "Position au 31/12/2025" },
  taxes: { title: "Taxes & Provisions", subtitle: "Fiscalité Q4 2025 & Prévisions 2026" },
  objectives: { title: "Objectifs & Projections 2026", subtitle: "Plan stratégique" },
  alerts: { title: "Alertes & Actions Prioritaires", subtitle: "Points d'attention urgents" },
  config: { title: "Configuration Dashboard", subtitle: "Scénarios & structure de charges" },
};

export default function DashboardLabarile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scenario, setScenario] = useState('base');
  const [, forceUpdate] = useState(0);
  const { toast } = useToast();

  const currentScenario: Scenario = SCENARIOS[scenario];

  useEffect(() => {
    fetchCompany();
    loadSavedConfig();
  }, [id]);

  const loadSavedConfig = async () => {
    try {
      const { data } = await supabase
        .from('dashboard_configs')
        .select('config_value')
        .eq('company_id', id)
        .eq('config_key', 'labarile_scenarios');
      
      if (data && data.length > 0) {
        const config = data[0].config_value as any;
        const monthly = config.monthly || [];
        const costsData = config.costs || {};
        if (monthly.length === 12) {
          const base = [...monthly];
          const low = base.map((v: number) => Math.round(v * 0.85));
          const high = base.map((v: number) => Math.round(v * 1.15));
          const totalBase = base.reduce((a: number, b: number) => a + b, 0);
          const totalLow = low.reduce((a: number, b: number) => a + b, 0);
          const totalHigh = high.reduce((a: number, b: number) => a + b, 0);
          const q4Ann = 5221;
          const calcGrowth = (t: number) => (t >= q4Ann ? '+' : '') + Math.round((t - q4Ann) / q4Ann * 100) + '%';
          
          SCENARIOS.base = { ...SCENARIOS.base, forecast2026: base, total2026: totalBase, growth: calcGrowth(totalBase), costs: { ...SCENARIOS.base.costs, ...costsData } };
          SCENARIOS.prudent = { ...SCENARIOS.prudent, forecast2026: low, total2026: totalLow, growth: calcGrowth(totalLow), costs: { ...SCENARIOS.prudent.costs, ...costsData } };
          SCENARIOS.optimiste = { ...SCENARIOS.optimiste, forecast2026: high, total2026: totalHigh, growth: calcGrowth(totalHigh), costs: { ...SCENARIOS.optimiste.costs, ...costsData } };
          forceUpdate(n => n + 1);
        }
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
  };

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
      if (error) throw error;
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les données', variant: 'destructive' });
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

  const avgMonthly = Math.round(currentScenario.total2026 / 12);
  const peakRevenue = Math.max(...currentScenario.forecast2026);
  const ebitda2026 = Math.round(currentScenario.total2026 * currentScenario.margins.operating / 100);
  const scalability = currentScenario.servicesMix.collective + currentScenario.servicesMix.elearning;

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
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-labarile-white border border-labarile-border rounded-lg shadow-sm">
        <Menu className="w-5 h-5 text-labarile-text" />
      </button>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <LabarileSidebar
          companyName={company.name}
          logoUrl={company.logo_url}
          navItems={NAV_ITEMS}
          activePage={activePage}
          onPageChange={(page) => { setActivePage(page); setSidebarOpen(false); }}
          onBack={() => navigate('/')}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 lg:ml-0 min-w-0">
        <LabarileHeader title={pageInfo.title} subtitle={pageInfo.subtitle} scenario={scenario} onScenarioChange={setScenario} />

        <main className="p-4 lg:p-8 xl:p-10 max-w-[1600px]">
          {/* Overview */}
          {activePage === 'overview' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard label="Run Rate Annualisé" value="5,221 kAED" subtext="Q4 2025 × 4" />
                <LabarileKPICard label="CA Total Q4 2025" value="1,305 kAED" subtext="-64 kAED ajustements" variant="primary" />
                <LabarileKPICard label="CA 2026 Prévu" value={`${currentScenario.total2026.toLocaleString()} kAED`} subtext={`Objectif 2026`} variant="success" />
                <LabarileKPICard label="Marge EBITDA Q4" value="53.7%" subtext="Objectif 2026: 50%" variant="success" />
              </div>

              <LabarileChartContainer title="Évolution CA Mensuel Q4 2025 & Prévisionnel 2026" tall>
                <LabarileMainRevenueChart scenario={currentScenario} />
              </LabarileChartContainer>

              <LabarileChartContainer title="Structure des Coûts Moyenne Q4 2025">
                <LabarileDonutChart data={costsDonutData} />
              </LabarileChartContainer>

              <LabarileDataTable data={Q4_DATA} />
            </div>
          )}

          {/* Evolution */}
          {activePage === 'evolution' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard label="CA Prévisionnel 2026" value={`${currentScenario.total2026.toLocaleString()} kAED`} subtext="Objectif retenu" variant="primary" />
                <LabarileKPICard label="Q4 2025 Référence" value="1,305 kAED" subtext="Réel ajusté" />
                <LabarileKPICard label="CA Moyen Mensuel 2026" value={`${avgMonthly} kAED`} subtext="vs 435k Q4 2025" />
                <LabarileKPICard label="Croissance Requise" value={currentScenario.growth} subtext="vs Q4×4 annualisé" variant="warning" />
              </div>

              <LabarileChartContainer title="Évolution Prévisionnel CA 2026" tall>
                <LabarileEvolutionChart scenario={currentScenario} />
              </LabarileChartContainer>

              {/* Quarter Comparison Table */}
              <div className="bg-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
                <h3 className="font-bebas text-lg lg:text-xl text-labarile-primary mb-4 tracking-wide">📊 Comparaison Quarters 2026 vs Q4 2025</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-labarile-ice1">
                        <th className="px-3 py-2 text-left text-xs font-bold border-b-2 border-labarile-border">Période</th>
                        <th className="px-3 py-2 text-right text-xs font-bold border-b-2 border-labarile-border">CA Prévu</th>
                        <th className="px-3 py-2 text-right text-xs font-bold border-b-2 border-labarile-border">Q4 2025 Ref</th>
                        <th className="px-3 py-2 text-right text-xs font-bold border-b-2 border-labarile-border">Écart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {QUARTER_COMPARISON_BASE.map((row, idx) => (
                        <tr key={idx} className="hover:bg-labarile-light-gray">
                          <td className="px-3 py-2 text-sm border-b border-labarile-border font-semibold">{row.period}</td>
                          <td className="px-3 py-2 text-sm border-b border-labarile-border text-right">{row.caPrev}</td>
                          <td className="px-3 py-2 text-sm border-b border-labarile-border text-right">{row.q4Ref}</td>
                          <td className="px-3 py-2 text-sm border-b border-labarile-border text-right text-labarile-success">{row.ecart}</td>
                        </tr>
                      ))}
                      <tr className="bg-labarile-ice1">
                        <td className="px-3 py-2 text-sm font-bold">TOTAL 2026</td>
                        <td className="px-3 py-2 text-sm text-right font-bold">{currentScenario.total2026.toLocaleString()} kAED</td>
                        <td className="px-3 py-2 text-sm text-right font-bold">5,221 kAED (Q4×4)</td>
                        <td className="px-3 py-2 text-sm text-right font-bold text-labarile-success">+{(currentScenario.total2026 - 5221).toLocaleString()}k ({currentScenario.growth})</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-emerald-50 border-l-4 border-l-emerald-500 rounded-lg p-5">
                <p className="font-bold text-sm text-emerald-700 mb-2">💡 Insight Clé:</p>
                <p className="text-sm text-labarile-text leading-relaxed">
                  L'objectif {currentScenario.total2026.toLocaleString()} kAED représente une croissance de {currentScenario.growth} vs Q4 annualisé. Accélération progressive requise : {avgMonthly}k/mois en moyenne vs 435k/mois Q4 2025. Une structure de coûts maîtrisée (marge 53.7% Q4) offre une base solide pour ce scaling.
                </p>
              </div>
            </div>
          )}

          {/* Breakdown Ventes */}
          {activePage === 'breakdown' && <LabarileBreakdownPage />}

          {/* Costs */}
          {activePage === 'costs' && <LabarileCostsPage scenario={currentScenario} />}

          {/* Treasury */}
          {activePage === 'treasury' && <LabarileTreasuryPage />}

          {/* Taxes */}
          {activePage === 'taxes' && <LabarileTaxesPage scenario={currentScenario} />}

          {/* Objectives */}
          {activePage === 'objectives' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard label="Q4 2025 Annualisé (x4)" value="5,221 kAED" subtext="Référence performance Q4" />
                <LabarileKPICard label="Objectif CA 2026" value={`${currentScenario.total2026.toLocaleString()} kAED`} subtext={`Scénario ${currentScenario.name}`} variant="primary" />
                <LabarileKPICard label="Progression vs Q4x4" value={currentScenario.growth} subtext={`+${(currentScenario.total2026 - 5221).toLocaleString()} kAED`} variant="success" />
                <LabarileKPICard label="Objectif Marge" value={`${currentScenario.margins.operating}%`} subtext="vs 53.7% Q4 2025" variant="success" />
              </div>

              {/* Comparison Table - Dynamic */}
              <div className="bg-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
                <h3 className="font-bebas text-lg lg:text-xl text-labarile-primary mb-4 tracking-wide">📊 Comparaison Q4 2025 (×4) vs Objectifs 2026 — {currentScenario.name}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-labarile-ice1">
                        <th className="px-3 py-2 text-left text-xs font-bold border-b-2 border-labarile-border">Métrique</th>
                        <th className="px-3 py-2 text-right text-xs font-bold border-b-2 border-labarile-border">Q4 2025 ×4</th>
                        <th className="px-3 py-2 text-right text-xs font-bold border-b-2 border-labarile-border">Objectif 2026</th>
                        <th className="px-3 py-2 text-right text-xs font-bold border-b-2 border-labarile-border">Écart</th>
                      </tr>
                    </thead>
                    <tbody>
                    {[
                      { metrique: 'CA Annuel', q4x4: '5,221 kAED', objectif2026: `${currentScenario.total2026.toLocaleString()} kAED`, ecart: `+${(currentScenario.total2026 - 5221).toLocaleString()}k (${currentScenario.growth})` },
                      { metrique: 'EBITDA', q4x4: '2,805 kAED (53.7%)', objectif2026: `${Math.round(currentScenario.total2026 * currentScenario.margins.operating / 100).toLocaleString()} kAED (${currentScenario.margins.operating}%)`, ecart: `+${(Math.round(currentScenario.total2026 * currentScenario.margins.operating / 100) - 2805).toLocaleString()}k` },
                      { metrique: 'CA Mensuel Moyen', q4x4: '435 kAED', objectif2026: `${avgMonthly} kAED`, ecart: `+${avgMonthly - 435}k/mois` },
                      { metrique: 'Marge EBITDA', q4x4: '53.7%', objectif2026: `${currentScenario.margins.operating}%`, ecart: currentScenario.margins.operating >= 53.7 ? 'Amélioration' : 'Maintien' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-labarile-light-gray">
                        <td className="px-3 py-2 text-sm border-b border-labarile-border font-semibold">{row.metrique}</td>
                        <td className="px-3 py-2 text-sm border-b border-labarile-border text-right">{row.q4x4}</td>
                        <td className="px-3 py-2 text-sm border-b border-labarile-border text-right">{row.objectif2026}</td>
                        <td className="px-3 py-2 text-sm border-b border-labarile-border text-right text-labarile-success font-semibold">{row.ecart}</td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <LabarileChartContainer title={`🎯 Objectifs Stratégiques 2026 — ${currentScenario.name}`}>
                <div className="space-y-4">
                  <LabarileObjectiveCard
                    title={`Croissance CA: ${currentScenario.growth} vs Q4×4`}
                    description={`Atteindre ${currentScenario.total2026.toLocaleString()}k AED en 2026 avec une croissance progressive. Passer de 435k/mois à ${avgMonthly}k/mois en moyenne.`}
                  />
                  <LabarileObjectiveCard
                    title={`Maintenir Marge EBITDA: ${currentScenario.margins.operating}%`}
                    description={`Conserver la structure de coûts excellente (53.7% en Q4 2025) tout en scalant le CA. EBITDA cible: ${Math.round(currentScenario.total2026 * currentScenario.margins.operating / 100).toLocaleString()}k AED.`}
                  />
                </div>
              </LabarileChartContainer>

              <div className="bg-gradient-to-br from-labarile-ice1 to-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
                <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-4 tracking-wide">🎯 Points Clés pour 2026 — {currentScenario.name}</h3>
                <div className="space-y-3">
                  <div className="bg-labarile-white rounded-lg p-3">
                    <p className="text-sm"><strong className="text-labarile-success">🚀 Objectif {currentScenario.total2026.toLocaleString()} AED:</strong> Croissance de {currentScenario.growth} vs Q4 annualisé. Fort scaling requis : passer de 435k/mois à {avgMonthly}k/mois en moyenne 2026.</p>
                  </div>
                  <div className="bg-labarile-white rounded-lg p-3">
                    <p className="text-sm"><strong className="text-labarile-primary">💰 Maintenir Excellence Opérationnelle:</strong> Marge Q4 2025 à 53.7% — objectif {currentScenario.margins.operating}%. EBITDA visé: {Math.round(currentScenario.total2026 * currentScenario.margins.operating / 100).toLocaleString()}k AED.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {activePage === 'alerts' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="bg-labarile-ice1 rounded-xl p-8 text-center">
                <h3 className="font-bebas text-2xl text-labarile-primary mb-4">⚠️ Alertes & Actions</h3>
                <p className="text-labarile-muted">Cette section sera configurée selon vos priorités lors de la réunion.</p>
              </div>

              <div className="bg-labarile-white rounded-xl p-5 border-2 border-dashed border-labarile-border">
                <h4 className="font-bebas text-lg text-labarile-title mb-3">📝 Notes - Alertes à Définir</h4>
                <textarea 
                  className="w-full min-h-[200px] p-4 border border-labarile-border rounded-lg font-sans text-sm resize-y focus:outline-none focus:border-labarile-primary"
                  placeholder="Utilisez cet espace pour noter les alertes prioritaires pendant la réunion..."
                />
              </div>

              <div className="bg-amber-50 border-l-4 border-l-amber-500 rounded-lg p-5">
                <p className="text-sm text-labarile-muted">
                  <strong className="text-amber-700">💡 Suggestion:</strong> Utilisez cette page pour tracker les actions prioritaires identifiées lors de vos réunions stratégiques.
                </p>
              </div>
            </div>
          )}

          {/* Config */}
          {activePage === 'config' && (
            <LabarileConfigPage companyId={company.id} onScenariosUpdate={() => forceUpdate(n => n + 1)} />
          )}
        </main>
      </div>
    </div>
  );
}
