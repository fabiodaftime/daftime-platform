import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Bocuse Components
import { BocuseKPICard } from '@/components/dashboard/bocuse/BocuseKPICard';
import { BocuseRevenueChart } from '@/components/dashboard/bocuse/BocuseRevenueChart';
import { BocuseExpenseChart } from '@/components/dashboard/bocuse/BocuseExpenseChart';
import { BocuseRatiosSection } from '@/components/dashboard/bocuse/BocuseRatiosSection';
import { BocuseAnalysisSection } from '@/components/dashboard/bocuse/BocuseAnalysisSection';
import { BocuseExpenseTable } from '@/components/dashboard/bocuse/BocuseExpenseTable';
import { BocuseMonthlySummary } from '@/components/dashboard/bocuse/BocuseMonthlySummary';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  layout_type: string;
  currency: string;
}

// Bocuse Abu Dhabi Demo Data (AED)
const BOCUSE_REVENUE_DATA = [
  { month: 'Jan', actual: 678532, budget: 650000 },
  { month: 'Fév', actual: 857148, budget: 700000 },
  { month: 'Mar', actual: 745230, budget: 680000 },
  { month: 'Avr', actual: 612450, budget: 600000 },
  { month: 'Mai', actual: 534890, budget: 550000 },
  { month: 'Juin', actual: 489650, budget: 500000 },
  { month: 'Juil', actual: 356780, budget: 400000 },
  { month: 'Août', actual: 307740, budget: 350000 },
  { month: 'Sep', actual: 498230, budget: 480000 },
  { month: 'Oct', actual: 702096, budget: 650000 },
];

const BOCUSE_EXPENSE_DATA = [
  { name: 'COGS', value: 1715592, color: 'hsl(0, 100%, 49%)', percent: 27.7 },
  { name: 'Loyer', value: 1511682, color: 'hsl(230, 100%, 22%)', percent: 24.5 },
  { name: 'Masse Salariale', value: 1351428, color: 'hsl(230, 80%, 35%)', percent: 21.9 },
  { name: 'IT & Télécom', value: 266664, color: 'hsl(230, 60%, 45%)', percent: 4.3 },
  { name: 'Utilities', value: 143982, color: 'hsl(230, 50%, 55%)', percent: 2.3 },
  { name: 'Frais Bancaires', value: 127932, color: 'hsl(0, 80%, 60%)', percent: 2.1 },
  { name: 'Marketing', value: 89622, color: 'hsl(230, 40%, 65%)', percent: 1.4 },
];

const BOCUSE_MONTHLY_DATA = [
  { month: 'Jan', revenue: 678532, grossMargin: 490521, netIncome: 81424, netMarginPct: 12.0 },
  { month: 'Fév', revenue: 857148, grossMargin: 619718, netIncome: 102858, netMarginPct: 12.0 },
  { month: 'Mar', revenue: 745230, grossMargin: 538801, netIncome: 89428, netMarginPct: 12.0 },
  { month: 'Avr', revenue: 612450, grossMargin: 442801, netIncome: 73494, netMarginPct: 12.0 },
  { month: 'Mai', revenue: 534890, grossMargin: 386732, netIncome: 64187, netMarginPct: 12.0 },
  { month: 'Juin', revenue: 489650, grassMargin: 354017, netIncome: 58758, netMarginPct: 12.0 },
  { month: 'Juil', revenue: 356780, grossMargin: 257952, netIncome: 42814, netMarginPct: 12.0 },
  { month: 'Août', revenue: 307740, grossMargin: 222496, netIncome: 36929, netMarginPct: 12.0 },
  { month: 'Sep', revenue: 498230, grossMargin: 360220, netIncome: 59788, netMarginPct: 12.0 },
  { month: 'Oct', revenue: 702096, grossMargin: 507615, netIncome: 84252, netMarginPct: 12.0 },
];

export default function DashboardBocuse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resume');
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
      <div className="min-h-screen bg-bocuse-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-bocuse-red border-t-transparent rounded-full animate-spin" />
          <p className="text-bocuse-gray">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-bocuse-dark flex items-center justify-center">
        <p className="text-bocuse-gray">Client non trouvé</p>
      </div>
    );
  }

  const totalRevenue = BOCUSE_REVENUE_DATA.reduce((sum, m) => sum + m.actual, 0);
  const totalExpenses = BOCUSE_EXPENSE_DATA.reduce((sum, e) => sum + e.value, 0);
  const grossMargin = totalRevenue * 0.723;
  const netIncome = totalRevenue * 0.12;
  const ebit = totalRevenue * 0.141;

  const formatCurrency = (value: number, compact = false) => {
    if (compact && value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (compact && value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-bocuse-dark">
      {/* Header */}
      <header className="bg-gradient-to-r from-bocuse-darker to-bocuse-blue px-6 py-4 border-b-4 border-bocuse-red shadow-xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="w-14 h-14 bg-gradient-to-br from-bocuse-red to-red-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="font-playfair text-2xl font-bold text-white">B</span>
            </div>
            
            <div>
              <h1 className="font-playfair text-xl font-bold text-white">
                {company.name}
              </h1>
              <p className="text-sm text-bocuse-gray">
                Dashboard Financier 2025 • Janvier – Octobre
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-bocuse-gray">Maisons Bocuse</p>
            <p className="text-xs text-bocuse-gray">Restaurants & Brasseries</p>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-bocuse-darker border-b border-white/10">
          <TabsList className="bg-transparent h-auto p-0 max-w-7xl mx-auto flex gap-0">
            <TabsTrigger 
              value="resume" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-bocuse-red data-[state=active]:bg-white/5 text-bocuse-gray data-[state=active]:text-white px-6 py-3"
            >
              📊 Résumé
            </TabsTrigger>
            <TabsTrigger 
              value="ca" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-bocuse-red data-[state=active]:bg-white/5 text-bocuse-gray data-[state=active]:text-white px-6 py-3"
            >
              💰 Chiffre d'Affaires
            </TabsTrigger>
            <TabsTrigger 
              value="charges" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-bocuse-red data-[state=active]:bg-white/5 text-bocuse-gray data-[state=active]:text-white px-6 py-3"
            >
              📉 Charges
            </TabsTrigger>
            <TabsTrigger 
              value="kpis" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-bocuse-red data-[state=active]:bg-white/5 text-bocuse-gray data-[state=active]:text-white px-6 py-3"
            >
              🎯 KPIs & Ratios
            </TabsTrigger>
            <TabsTrigger 
              value="analyse" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-bocuse-red data-[state=active]:bg-white/5 text-bocuse-gray data-[state=active]:text-white px-6 py-3"
            >
              💡 Analyse
            </TabsTrigger>
          </TabsList>
        </div>

        <main className="p-6 max-w-7xl mx-auto">
          {/* Résumé Tab */}
          <TabsContent value="resume" className="mt-0 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <BocuseKPICard
                label="Chiffre d'Affaires"
                value={`${formatCurrency(totalRevenue, true)}`}
                subtext="AED • 10 mois"
                variant="highlight"
              />
              <BocuseKPICard
                label="Marge Brute"
                value="72,3%"
                subtext={`${formatCurrency(grossMargin, true)} AED`}
                variant="success"
              />
              <BocuseKPICard
                label="EBIT"
                value="14,1%"
                subtext={`${formatCurrency(ebit, true)} AED`}
              />
              <BocuseKPICard
                label="Résultat Net"
                value={`${formatCurrency(netIncome, true)}`}
                subtext="12,0% marge"
                variant="success"
              />
              <BocuseKPICard
                label="Charges Totales"
                value="88%"
                subtext={`${formatCurrency(totalExpenses, true)} AED`}
                variant="warning"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <BocuseRevenueChart data={BOCUSE_REVENUE_DATA} title="📈 Performance Mensuelle" />
              <BocuseExpenseChart data={BOCUSE_EXPENSE_DATA} title="🥧 Répartition des Charges" />
            </div>

            <BocuseMonthlySummary data={BOCUSE_MONTHLY_DATA} />
          </TabsContent>

          {/* CA Tab */}
          <TabsContent value="ca" className="mt-0 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <BocuseKPICard
                label="CA Total 2025"
                value={formatCurrency(totalRevenue)}
                subtext="AED"
                variant="highlight"
              />
              <BocuseKPICard
                label="Meilleur Mois"
                value="Février"
                subtext="857 148 AED"
                variant="success"
              />
              <BocuseKPICard
                label="Mois le Plus Faible"
                value="Août"
                subtext="307 740 AED"
                variant="warning"
              />
              <BocuseKPICard
                label="CA Moyen Mensuel"
                value={formatCurrency(totalRevenue / 10)}
                subtext="AED / mois"
              />
            </div>

            <h3 className="font-playfair text-xl text-white mb-4 pb-2 border-b-2 border-bocuse-red inline-block">
              Évolution du Chiffre d'Affaires
            </h3>
            <BocuseRevenueChart data={BOCUSE_REVENUE_DATA} title="" showBudget />

            <div className="mt-8 bg-gradient-to-br from-bocuse-card to-bocuse-light rounded-2xl p-6 border border-white/10">
              <h4 className="text-green-400 font-semibold mb-2">💡 Insight Saisonnalité</h4>
              <p className="text-bocuse-gray text-sm">
                La saisonnalité est fortement marquée avec une amplitude de 64% entre le meilleur mois (Février) et le plus faible (Août). 
                La haute saison (Oct-Fév) génère 55% du CA annuel contre 45% pour la basse saison (Mar-Sep). 
                Stratégie recommandée : offres estivales ciblées et événements climatisés.
              </p>
            </div>
          </TabsContent>

          {/* Charges Tab */}
          <TabsContent value="charges" className="mt-0 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <BocuseKPICard
                label="COGS"
                value={formatCurrency(1715592)}
                subtext="27,7% CA"
                variant="highlight"
              />
              <BocuseKPICard
                label="Loyer"
                value={formatCurrency(1511682)}
                subtext="24,5% CA"
                variant="warning"
              />
              <BocuseKPICard
                label="Masse Salariale"
                value={formatCurrency(1351428)}
                subtext="21,9% CA"
              />
              <BocuseKPICard
                label="Autres Charges"
                value={formatCurrency(862110)}
                subtext="IT, Utilities, Marketing..."
              />
            </div>

            <BocuseExpenseTable />
          </TabsContent>

          {/* KPIs Tab */}
          <TabsContent value="kpis" className="mt-0 animate-fade-in">
            <BocuseRatiosSection />
          </TabsContent>

          {/* Analyse Tab */}
          <TabsContent value="analyse" className="mt-0 animate-fade-in">
            <BocuseAnalysisSection />
          </TabsContent>
        </main>
      </Tabs>

      {/* Footer */}
      <footer className="text-center py-6 text-bocuse-gray text-xs border-t border-white/10 mt-8">
        Dashboard Financier – {company.name} © 2025
      </footer>
    </div>
  );
}
