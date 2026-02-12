import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/dashboard/charts/RevenueChart';
import { ExpenseDonutChart } from '@/components/dashboard/charts/ExpenseDonutChart';
import { CashFlowChart } from '@/components/dashboard/charts/CashFlowChart';
import { DrillDownDrawer } from '@/components/dashboard/DrillDownDrawer';
import { DollarSign, TrendingUp, Wallet, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  layout_type: string;
  currency: string;
}

// Demo data - will be replaced with real data from database
const DEMO_REVENUE_DATA = [
  { month: 'Jan', actual: 120000, budget: 115000, priorYear: 100000 },
  { month: 'Feb', actual: 135000, budget: 125000, priorYear: 110000 },
  { month: 'Mar', actual: 142000, budget: 140000, priorYear: 125000 },
  { month: 'Apr', actual: 155000, budget: 145000, priorYear: 135000 },
  { month: 'May', actual: 168000, budget: 160000, priorYear: 145000 },
  { month: 'Jun', actual: 175000, budget: 170000, priorYear: 155000 },
];

const DEMO_EXPENSE_DATA = [
  { name: 'Salaries', value: 450000, color: 'hsl(45, 70%, 50%)' },
  { name: 'Consulting', value: 180000, color: 'hsl(210, 80%, 55%)' },
  { name: 'Admin', value: 95000, color: 'hsl(142, 70%, 45%)' },
  { name: 'Marketing', value: 75000, color: 'hsl(280, 70%, 55%)' },
  { name: 'IT', value: 65000, color: 'hsl(0, 72%, 51%)' },
  { name: 'Other', value: 45000, color: 'hsl(220, 10%, 45%)' },
];

const DEMO_CASH_DATA = [
  { month: 'Jan', balance: 250000 },
  { month: 'Feb', balance: 285000 },
  { month: 'Mar', balance: 310000 },
  { month: 'Apr', balance: 295000 },
  { month: 'May', balance: 340000 },
  { month: 'Jun', balance: 380000 },
];

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('executive');
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
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
      
      // Redirect to the correct specialized dashboard if layout_type doesn't match this generic dashboard
      const layoutRoutes: Record<string, string> = {
        bocuse: `/dashboard-bocuse/${id}`,
        labarile: `/dashboard-labarile/${id}`,
        richissime: `/dashboard-richissime/${id}`,
        cwp_pl_2025: `/dashboard-cwp-pl-2025/${id}`,
        nowmade: `/dashboard-nowmade/${id}`,
        prime_circle: `/dashboard-prime-circle/${id}`,
        prime_circle_agency: `/dashboard-prime-circle-agency/${id}`,
        digit: `/dashboard-digit/${id}`,
        prime_circle_group: `/dashboard-pc-group/${id}`,
      };
      if (data?.layout_type && layoutRoutes[data.layout_type]) {
        navigate(layoutRoutes[data.layout_type], { replace: true });
        return;
      }
      
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du client',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKPIClick = (kpiType: string) => {
    const mockData = {
      title: `${kpiType} Details`,
      currency: company?.currency || 'EUR',
      data: [
        { label: 'Q1', actual: 397000, budget: 380000, variance: 4.5 },
        { label: 'Q2', actual: 498000, budget: 475000, variance: 4.8 },
        { label: 'Total YTD', actual: 895000, budget: 855000, variance: 4.7 },
      ],
    };
    setDrillDownData(mockData);
    setDrillDownOpen(true);
  };

  const handleExpenseClick = (category: string) => {
    const mockData = {
      title: `${category} Expense Details`,
      currency: company?.currency || 'EUR',
      data: [
        { label: 'Jan', actual: 75000, budget: 72000, variance: 4.2 },
        { label: 'Feb', actual: 78000, budget: 75000, variance: 4.0 },
        { label: 'Mar', actual: 82000, budget: 78000, variance: 5.1 },
        { label: 'Apr', actual: 76000, budget: 74000, variance: 2.7 },
        { label: 'May', actual: 69000, budget: 71000, variance: -2.8 },
        { label: 'Jun', actual: 70000, budget: 70000, variance: 0 },
      ],
    };
    setDrillDownData(mockData);
    setDrillDownOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-dashboard-text-muted">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <p className="text-dashboard-text-muted">Client non trouvé</p>
      </div>
    );
  }

  // Calculate demo KPIs
  const totalRevenue = DEMO_REVENUE_DATA.reduce((sum, m) => sum + m.actual, 0);
  const totalBudget = DEMO_REVENUE_DATA.reduce((sum, m) => sum + m.budget, 0);
  const totalExpenses = DEMO_EXPENSE_DATA.reduce((sum, e) => sum + e.value, 0);
  const netIncome = totalRevenue - totalExpenses;
  const margin = (netIncome / totalRevenue) * 100;
  const revenueVariance = ((totalRevenue - totalBudget) / totalBudget) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: company.currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-dashboard-bg dashboard-scrollbar">
      <DashboardHeader 
        companyName={company.name} 
        logoUrl={company.logo_url}
      />

      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-dashboard-card border border-dashboard-border mb-6">
            <TabsTrigger value="executive" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Executive
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="profitability" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Profitability
            </TabsTrigger>
            <TabsTrigger value="cash" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Cash
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="animate-fade-in">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard
                title="Revenue YTD"
                value={formatCurrency(totalRevenue)}
                variance={revenueVariance}
                varianceLabel="vs Budget"
                icon={<DollarSign className="w-5 h-5" />}
                onClick={() => handleKPIClick('Revenue')}
              />
              <KPICard
                title="Total Expenses"
                value={formatCurrency(totalExpenses)}
                variance={-2.3}
                varianceLabel="vs Budget"
                icon={<PieChart className="w-5 h-5" />}
                onClick={() => handleKPIClick('Expenses')}
              />
              <KPICard
                title="Net Income"
                value={formatCurrency(netIncome)}
                variance={12.5}
                varianceLabel="vs PY"
                icon={<TrendingUp className="w-5 h-5" />}
                onClick={() => handleKPIClick('Net Income')}
              />
              <KPICard
                title="Cash Position"
                value={formatCurrency(DEMO_CASH_DATA[DEMO_CASH_DATA.length - 1].balance)}
                subtitle="End of Period"
                icon={<Wallet className="w-5 h-5" />}
                onClick={() => handleKPIClick('Cash')}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={DEMO_REVENUE_DATA} currency={company.currency} />
              <ExpenseDonutChart 
                data={DEMO_EXPENSE_DATA} 
                currency={company.currency}
                onSliceClick={handleExpenseClick}
              />
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <KPICard
                title="Revenue YTD"
                value={formatCurrency(totalRevenue)}
                variance={revenueVariance}
                varianceLabel="vs Budget"
              />
              <KPICard
                title="Budget YTD"
                value={formatCurrency(totalBudget)}
              />
              <KPICard
                title="Prior Year YTD"
                value={formatCurrency(DEMO_REVENUE_DATA.reduce((sum, m) => sum + m.priorYear, 0))}
              />
            </div>
            <RevenueChart data={DEMO_REVENUE_DATA} currency={company.currency} />
          </TabsContent>

          <TabsContent value="expenses" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <KPICard
                title="Total Expenses"
                value={formatCurrency(totalExpenses)}
                variance={-2.3}
                varianceLabel="vs Budget"
              />
              <KPICard
                title="Expense Ratio"
                value={`${((totalExpenses / totalRevenue) * 100).toFixed(1)}%`}
                subtitle="of Revenue"
              />
            </div>
            <ExpenseDonutChart 
              data={DEMO_EXPENSE_DATA} 
              currency={company.currency}
              onSliceClick={handleExpenseClick}
            />
          </TabsContent>

          <TabsContent value="profitability" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <KPICard
                title="Gross Profit"
                value={formatCurrency(totalRevenue * 0.65)}
                variance={8.2}
                varianceLabel="vs PY"
              />
              <KPICard
                title="Operating Income"
                value={formatCurrency(netIncome)}
                variance={12.5}
                varianceLabel="vs PY"
              />
              <KPICard
                title="Net Margin"
                value={`${margin.toFixed(1)}%`}
                variance={2.1}
                varianceLabel="vs PY"
              />
            </div>
          </TabsContent>

          <TabsContent value="cash" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <KPICard
                title="Opening Balance"
                value={formatCurrency(DEMO_CASH_DATA[0].balance)}
              />
              <KPICard
                title="Current Balance"
                value={formatCurrency(DEMO_CASH_DATA[DEMO_CASH_DATA.length - 1].balance)}
                variance={52}
                varianceLabel="vs Opening"
              />
              <KPICard
                title="Avg Monthly Cash"
                value={formatCurrency(DEMO_CASH_DATA.reduce((sum, m) => sum + m.balance, 0) / DEMO_CASH_DATA.length)}
              />
            </div>
            <CashFlowChart data={DEMO_CASH_DATA} currency={company.currency} />
          </TabsContent>
        </Tabs>
      </main>

      <DrillDownDrawer
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        data={drillDownData}
      />
    </div>
  );
}
