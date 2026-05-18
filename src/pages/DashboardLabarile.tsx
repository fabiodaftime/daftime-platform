import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';

import { LabarileSidebar } from '@/components/dashboard/labarile/LabarileSidebar';
import { LabarileHeader } from '@/components/dashboard/labarile/LabarileHeader';
import { LabarileKPICard } from '@/components/dashboard/labarile/LabarileKPICard';
import { LabarileChartContainer } from '@/components/dashboard/labarile/LabarileChartContainer';
import { LabarileBreakdownPage } from '@/components/dashboard/labarile/LabarileBreakdownPage';
import { LabarileCostsPage } from '@/components/dashboard/labarile/LabarileCostsPage';
import { LabarileTreasuryPage } from '@/components/dashboard/labarile/LabarileTreasuryPage';
import { LabarileTaxesPage } from '@/components/dashboard/labarile/LabarileTaxesPage';
import { LabarileConfigPage } from '@/components/dashboard/labarile/LabarileConfigPage';
import { LabarileDividendsPage } from '@/components/dashboard/labarile/LabarileDividendsPage';
import { LabarileDonutChart } from '@/components/dashboard/labarile/LabarileCharts';
import { LabarileActual2026Chart } from '@/components/dashboard/labarile/LabarileActual2026Chart';
import { useLabarileMonthly } from '@/components/dashboard/labarile/useLabarileMonthly';

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
  { id: 'dividends', label: 'Résultat & Dividendes', icon: '💎' },
  { id: 'config', label: 'Configuration', icon: '⚙️' },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Vue d'Ensemble Financière", subtitle: "Réel YTD 2026 — Janvier → Avril" },
  evolution: { title: "Évolution du Chiffre d'Affaires", subtitle: "CA mensuel réel 2026" },
  breakdown: { title: "Breakdown Ventes 2026", subtitle: "Performance mensuelle Jan → Avr" },
  costs: { title: "Charges & Structure de Coûts", subtitle: "Réel mensuel 2026" },
  treasury: { title: "Trésorerie & Dettes", subtitle: "Position au 30/04/2026 (Balance Sheet)" },
  taxes: { title: "Taxes & Provisions", subtitle: "Fiscalité réelle YTD 2026" },
  dividends: { title: "Résultat & Dividendes", subtitle: "Reprise 2025 + résultat 2026 → capacité distributive" },
  config: { title: "Configuration Dashboard", subtitle: "Paramètres" },
};

export default function DashboardLabarile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { monthlyCosts2026, ytd2026, actuals2026 } = useLabarileMonthly(2026);

  useEffect(() => {
    fetchCompany();
  }, [id]);

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

  // ---------- Agrégats Réel YTD 2026 ----------
  const caYtd = ytd2026.caTotal;
  const ebitdaYtd = monthlyCosts2026.reduce((acc, m) => {
    const charges = Object.values(m.actual).reduce((a, b) => a + b, 0);
    return acc + (m.revenue - charges);
  }, 0);
  const totalCharges = caYtd - ebitdaYtd;
  const marginPct = caYtd > 0 ? (ebitdaYtd / caYtd) * 100 : 0;
  const avgMonthly = ytd2026.months > 0 ? caYtd / ytd2026.months : 0;
  const bestMonth = [...monthlyCosts2026].sort((a, b) => b.revenue - a.revenue)[0];

  // Structure de coûts réelle 2026 (donut)
  const costAgg = monthlyCosts2026.reduce(
    (acc, m) => ({
      coaches: acc.coaches + m.actual.coaches,
      marketing: acc.marketing + m.actual.marketing,
      it: acc.it + m.actual.it,
      stripe: acc.stripe + m.actual.stripe,
      admin: acc.admin + m.actual.admin,
      autres: acc.autres + m.actual.autres,
    }),
    { coaches: 0, marketing: 0, it: 0, stripe: 0, admin: 0, autres: 0 },
  );
  const totalCostAgg = Object.values(costAgg).reduce((a, b) => a + b, 0) || 1;
  const costsDonutData2026 = [
    { name: 'Coaches', value: Math.round((costAgg.coaches / totalCostAgg) * 100), color: '#E87E60' },
    { name: 'Marketing', value: Math.round((costAgg.marketing / totalCostAgg) * 100), color: '#7CC9CC' },
    { name: 'Admin', value: Math.round((costAgg.admin / totalCostAgg) * 100), color: '#4EB79F' },
    { name: 'Stripe/Fees', value: Math.round((costAgg.stripe / totalCostAgg) * 100), color: '#9DD8DA' },
    { name: 'IT & Tools', value: Math.round((costAgg.it / totalCostAgg) * 100), color: '#C9EDEF' },
    { name: 'Autres', value: Math.round((costAgg.autres / totalCostAgg) * 100), color: '#E4F5F7' },
  ].filter((d) => d.value > 0);

  const pageInfo = PAGE_TITLES[activePage] || PAGE_TITLES.overview;
  const fmtK = (n: number) => `${Math.round(n / 1000).toLocaleString('fr-FR')} kAED`;

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
        <LabarileHeader title={pageInfo.title} subtitle={pageInfo.subtitle} />

        <main className="p-4 lg:p-8 xl:p-10 max-w-[1600px]">
          {/* Vue d'ensemble — Réel 2026 uniquement */}
          {activePage === 'overview' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard label="CA YTD 2026" value={fmtK(caYtd)} subtext={`${ytd2026.months} mois — Jan → Avr`} variant="primary" />
                <LabarileKPICard label="EBITDA YTD 2026" value={fmtK(ebitdaYtd)} subtext={`Marge ${marginPct.toFixed(1)}%`} variant="success" />
                <LabarileKPICard label="CA Moyen Mensuel" value={fmtK(avgMonthly)} subtext={`Meilleur mois : ${bestMonth ? bestMonth.month.split(' ')[0] : '—'}`} />
                <LabarileKPICard label="Charges YTD" value={fmtK(totalCharges)} subtext={`${(100 - marginPct).toFixed(1)}% du CA`} variant="warning" />
              </div>

              <LabarileChartContainer title="Évolution CA Mensuel Réel 2026 (Jan → Avr)" tall>
                <LabarileActual2026Chart actuals2026Override={actuals2026} />
              </LabarileChartContainer>

              <LabarileChartContainer title="Structure des Coûts Réelle YTD 2026">
                <LabarileDonutChart data={costsDonutData2026} />
              </LabarileChartContainer>

              {/* Synthèse mensuelle Jan-Avr */}
              <div className="bg-labarile-white border border-labarile-border rounded-xl overflow-hidden">
                <h3 className="px-5 py-4 font-bebas text-lg lg:text-xl text-labarile-primary-dark tracking-wide">
                  📊 Performance mensuelle Réel 2026
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-labarile-ice1 to-labarile-ice2">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs uppercase font-bold text-labarile-primary-dark">Mois</th>
                        <th className="px-4 py-3 text-right text-xs uppercase font-bold text-labarile-primary-dark">CA (kAED)</th>
                        <th className="px-4 py-3 text-right text-xs uppercase font-bold text-labarile-primary-dark">Charges (kAED)</th>
                        <th className="px-4 py-3 text-right text-xs uppercase font-bold text-labarile-primary-dark">EBITDA (kAED)</th>
                        <th className="px-4 py-3 text-right text-xs uppercase font-bold text-labarile-primary-dark">Marge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyCosts2026.map((m) => {
                        const charges = Object.values(m.actual).reduce((a, b) => a + b, 0);
                        const ebitda = m.revenue - charges;
                        const margin = m.revenue > 0 ? (ebitda / m.revenue) * 100 : 0;
                        return (
                          <tr key={m.month} className="hover:bg-labarile-light-gray border-t border-labarile-border">
                            <td className="px-4 py-3 text-sm font-semibold">{m.month}</td>
                            <td className="px-4 py-3 text-sm text-right">{(m.revenue / 1000).toFixed(1)}</td>
                            <td className="px-4 py-3 text-sm text-right text-labarile-warning">{(charges / 1000).toFixed(1)}</td>
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${ebitda < 0 ? 'text-red-600' : 'text-labarile-success'}`}>
                              {(ebitda / 1000).toFixed(1)}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${margin < 0 ? 'text-red-600' : 'text-labarile-success'}`}>
                              {margin.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-labarile-ice1 font-bold border-t-2 border-labarile-primary">
                        <td className="px-4 py-3 text-sm">TOTAL YTD</td>
                        <td className="px-4 py-3 text-sm text-right">{(caYtd / 1000).toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm text-right text-labarile-warning">{(totalCharges / 1000).toFixed(1)}</td>
                        <td className={`px-4 py-3 text-sm text-right ${ebitdaYtd < 0 ? 'text-red-600' : 'text-labarile-success'}`}>
                          {(ebitdaYtd / 1000).toFixed(1)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right ${marginPct < 0 ? 'text-red-600' : 'text-labarile-success'}`}>
                          {marginPct.toFixed(1)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Évolution CA — Réel 2026 uniquement */}
          {activePage === 'evolution' && (
            <div className="space-y-6 lg:space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <LabarileKPICard label="CA YTD 2026" value={fmtK(caYtd)} subtext={`${ytd2026.months} mois réels`} variant="primary" />
                <LabarileKPICard label="CA Moyen Mensuel" value={fmtK(avgMonthly)} subtext="Sur la période YTD" />
                <LabarileKPICard label="Meilleur mois" value={bestMonth ? `${(bestMonth.revenue / 1000).toFixed(0)}k` : '—'} subtext={bestMonth?.month ?? ''} variant="success" />
                <LabarileKPICard label="Run-rate annualisé" value={fmtK(avgMonthly * 12)} subtext="Extrapolation YTD × 12 mois" variant="warning" />
              </div>

              <LabarileChartContainer title="CA Mensuel Réel 2026 (Jan → Avr)" tall>
                <LabarileActual2026Chart actuals2026Override={actuals2026} />
              </LabarileChartContainer>

              <div className="bg-emerald-50 border-l-4 border-l-emerald-500 rounded-lg p-5">
                <p className="font-bold text-sm text-emerald-700 mb-2">💡 Lecture de la période</p>
                <p className="text-sm text-labarile-text leading-relaxed">
                  CA cumulé Jan→Avr : <strong>{fmtK(caYtd)}</strong> ({(caYtd / 1000).toFixed(0)}k AED), moyenne mensuelle <strong>{fmtK(avgMonthly)}</strong>.
                  EBITDA YTD <strong>{fmtK(ebitdaYtd)}</strong> (marge {marginPct.toFixed(1)}%). Run-rate annualisé : <strong>{fmtK(avgMonthly * 12)}</strong>.
                </p>
              </div>
            </div>
          )}

          {activePage === 'breakdown' && <LabarileBreakdownPage />}
          {activePage === 'costs' && <LabarileCostsPage />}
          {activePage === 'treasury' && <LabarileTreasuryPage />}
          {activePage === 'taxes' && <LabarileTaxesPage />}
          {activePage === 'dividends' && <LabarileDividendsPage />}
          {activePage === 'config' && (
            <LabarileConfigPage companyId={company.id} onScenariosUpdate={() => {}} />
          )}
        </main>
      </div>
    </div>
  );
}
