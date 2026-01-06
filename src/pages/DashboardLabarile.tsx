import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Receipt, 
  PieChart, 
  Target,
  ArrowLeft,
  Building2
} from 'lucide-react';

// Labarile Components
import { LabarileSidebar } from '@/components/dashboard/labarile/LabarileSidebar';
import { LabarileKPICard } from '@/components/dashboard/labarile/LabarileKPICard';
import { LabarileRevenueChart } from '@/components/dashboard/labarile/LabarileRevenueChart';
import { LabarileExpenseChart } from '@/components/dashboard/labarile/LabarileExpenseChart';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  layout_type: string;
  currency: string;
}

// Demo Data
const LABARILE_REVENUE_DATA = [
  { month: 'Jan', actual: 145000, budget: 140000 },
  { month: 'Fév', actual: 158000, budget: 150000 },
  { month: 'Mar', actual: 162000, budget: 155000 },
  { month: 'Avr', actual: 171000, budget: 165000 },
  { month: 'Mai', actual: 168000, budget: 170000 },
  { month: 'Juin', actual: 185000, budget: 175000 },
];

const LABARILE_EXPENSE_DATA = [
  { name: 'Personnel', value: 320000, color: 'hsl(180, 40%, 75%)' },
  { name: 'Achats', value: 180000, color: 'hsl(180, 42%, 54%)' },
  { name: 'Loyer', value: 95000, color: 'hsl(160, 50%, 52%)' },
  { name: 'Marketing', value: 45000, color: 'hsl(15, 75%, 64%)' },
  { name: 'IT & Outils', value: 35000, color: 'hsl(180, 45%, 85%)' },
  { name: 'Autres', value: 25000, color: 'hsl(0, 0%, 70%)' },
];

export default function DashboardLabarile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const { toast } = useToast();

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

  const totalRevenue = LABARILE_REVENUE_DATA.reduce((sum, m) => sum + m.actual, 0);
  const totalBudget = LABARILE_REVENUE_DATA.reduce((sum, m) => sum + m.budget, 0);
  const totalExpenses = LABARILE_EXPENSE_DATA.reduce((sum, e) => sum + e.value, 0);
  const netIncome = totalRevenue - totalExpenses;
  const margin = (netIncome / totalRevenue) * 100;
  const budgetVariance = ((totalRevenue - totalBudget) / totalBudget) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: company.currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const navItems = [
    { id: 'overview', label: "Vue d'Ensemble", icon: LayoutDashboard },
    { id: 'revenue', label: 'Chiffre d\'Affaires', icon: TrendingUp },
    { id: 'expenses', label: 'Charges', icon: Receipt },
    { id: 'analysis', label: 'Analyse', icon: PieChart },
    { id: 'kpis', label: 'KPIs', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-labarile-light-gray flex">
      {/* Sidebar */}
      <LabarileSidebar
        companyName={company.name}
        logoUrl={company.logo_url}
        navItems={navItems}
        activePage={activePage}
        onPageChange={setActivePage}
        onBack={() => navigate('/')}
      />

      {/* Main Content */}
      <div className="flex-1 ml-[260px]">
        {/* Header */}
        <header className="h-[70px] bg-labarile-white border-b border-labarile-border flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h1 className="font-bebas text-2xl tracking-wide text-labarile-text">
              {activePage === 'overview' && "Vue d'Ensemble"}
              {activePage === 'revenue' && "Chiffre d'Affaires"}
              {activePage === 'expenses' && "Charges"}
              {activePage === 'analysis' && "Analyse"}
              {activePage === 'kpis' && "KPIs & Ratios"}
            </h1>
            <p className="text-sm text-labarile-muted">
              {activePage === 'overview' && "KPIs et indicateurs clés"}
              {activePage === 'revenue' && "Évolution et détails du CA"}
              {activePage === 'expenses' && "Suivi des dépenses"}
              {activePage === 'analysis' && "Analyse financière"}
              {activePage === 'kpis' && "Indicateurs de performance"}
            </p>
          </div>
          <p className="text-sm text-labarile-muted">Données YTD 2025</p>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {/* Overview Page */}
          {activePage === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <LabarileKPICard
                  label="Chiffre d'Affaires"
                  value={formatCurrency(totalRevenue)}
                  subtext="YTD 2025"
                  variant="primary"
                />
                <LabarileKPICard
                  label="vs Budget"
                  value={`${budgetVariance >= 0 ? '+' : ''}${budgetVariance.toFixed(1)}%`}
                  subtext={formatCurrency(totalRevenue - totalBudget)}
                  variant={budgetVariance >= 0 ? 'success' : 'warning'}
                />
                <LabarileKPICard
                  label="Charges Totales"
                  value={formatCurrency(totalExpenses)}
                  subtext={`${((totalExpenses / totalRevenue) * 100).toFixed(1)}% du CA`}
                />
                <LabarileKPICard
                  label="Marge Nette"
                  value={`${margin.toFixed(1)}%`}
                  subtext={formatCurrency(netIncome)}
                  variant={margin > 10 ? 'success' : 'warning'}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-labarile-white border border-labarile-border rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-labarile-border">
                    <h3 className="font-semibold text-labarile-text">Évolution CA</h3>
                  </div>
                  <div className="p-6">
                    <LabarileRevenueChart data={LABARILE_REVENUE_DATA} />
                  </div>
                </div>

                <div className="bg-labarile-white border border-labarile-border rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-labarile-border">
                    <h3 className="font-semibold text-labarile-text">Répartition des Charges</h3>
                  </div>
                  <div className="p-6">
                    <LabarileExpenseChart data={LABARILE_EXPENSE_DATA} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Page */}
          {activePage === 'revenue' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <LabarileKPICard
                  label="CA Total"
                  value={formatCurrency(totalRevenue)}
                  variant="primary"
                />
                <LabarileKPICard
                  label="Budget"
                  value={formatCurrency(totalBudget)}
                />
                <LabarileKPICard
                  label="Écart"
                  value={formatCurrency(totalRevenue - totalBudget)}
                  variant={totalRevenue >= totalBudget ? 'success' : 'warning'}
                />
              </div>
              <div className="bg-labarile-white border border-labarile-border rounded-xl p-6">
                <LabarileRevenueChart data={LABARILE_REVENUE_DATA} showBudget />
              </div>
            </div>
          )}

          {/* Expenses Page */}
          {activePage === 'expenses' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {LABARILE_EXPENSE_DATA.slice(0, 3).map((expense) => (
                  <LabarileKPICard
                    key={expense.name}
                    label={expense.name}
                    value={formatCurrency(expense.value)}
                    subtext={`${((expense.value / totalRevenue) * 100).toFixed(1)}% du CA`}
                  />
                ))}
              </div>
              <div className="bg-labarile-white border border-labarile-border rounded-xl p-6">
                <LabarileExpenseChart data={LABARILE_EXPENSE_DATA} />
              </div>
            </div>
          )}

          {/* Analysis & KPIs Pages */}
          {(activePage === 'analysis' || activePage === 'kpis') && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <LabarileKPICard
                  label="Marge Brute"
                  value="65,2%"
                  subtext="Benchmark: 60-70%"
                  variant="success"
                />
                <LabarileKPICard
                  label="Marge Opérationnelle"
                  value="18,5%"
                  subtext="EBIT / CA"
                  variant="success"
                />
                <LabarileKPICard
                  label="Ratio Personnel"
                  value="32,1%"
                  subtext="Benchmark: 30-40%"
                  variant="primary"
                />
                <LabarileKPICard
                  label="Croissance"
                  value="+12,4%"
                  subtext="vs N-1"
                  variant="success"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
