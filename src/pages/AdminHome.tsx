import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompanyCard } from '@/components/admin/CompanyCard';
import { Plus, Search, LogOut, Building2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import daftimeLogo from '@/assets/daftime-logo.jpg';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';

interface CompanyWithKPIs {
  id: string;
  name: string;
  logo_url: string | null;
  layout_type: string;
  currency: string;
  revenueYTD: number;
  budgetYTD: number;
  expensesYTD: number;
}

export default function AdminHome() {
  const [companies, setCompanies] = useState<CompanyWithKPIs[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompaniesWithKPIs();
  }, []);

  const fetchCompaniesWithKPIs = async () => {
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;

      // Fetch financial data for each company
      const currentYear = new Date().getFullYear();
      const companiesWithKPIs: CompanyWithKPIs[] = await Promise.all(
        (companiesData || []).map(async (company, index) => {
          const { data: financials } = await supabase
            .from('monthly_financials')
            .select('revenue_actual, revenue_budget')
            .eq('company_id', company.id)
            .eq('year', currentYear);

          const revenueYTD = financials?.reduce((sum, f) => sum + Number(f.revenue_actual), 0) || 0;
          const budgetYTD = financials?.reduce((sum, f) => sum + Number(f.revenue_budget), 0) || 0;

          // For now, use demo data per company type if no financials exist
          const hasData = financials && financials.length > 0;
          
          // Different demo data based on layout type
          const demoDataByLayout: Record<string, { revenue: number; budget: number; expenses: number }> = {
            'cw_partners': { revenue: 895000, budget: 855000, expenses: 710000 },
            // Dedicated P&L package: show representative totals in the admin hub if no monthly_financials exist
            'cwp_pl_2025': { revenue: 1760000, budget: 0, expenses: 1650000 },
            'bocuse': { revenue: 5782746, budget: 5460000, expenses: 5440812 },
            'labarile': { revenue: 989000, budget: 955000, expenses: 700000 },
            'richissime': { revenue: 1262000, budget: 1180000, expenses: 890000 },
            'nowmade': { revenue: 1183137, budget: 0, expenses: 788978 },
            'default': { revenue: 750000 + index * 100000, budget: 720000 + index * 95000, expenses: 600000 + index * 80000 },
          };
          
          const demoData = demoDataByLayout[company.layout_type] || demoDataByLayout['default'];
          
          return {
            ...company,
            revenueYTD: hasData ? revenueYTD : demoData.revenue,
            budgetYTD: hasData ? budgetYTD : demoData.budget,
            expensesYTD: hasData ? 0 : demoData.expenses,
          };
        })
      );

      setCompanies(companiesWithKPIs);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={daftimeLogoWhite} 
              alt="Daftime Advisory" 
              className="h-8 w-auto"
            />
            <div className="border-l border-primary-foreground/30 pl-4">
              <p className="text-sm text-primary-foreground/70">Advisory</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-primary-foreground/70">
              {user?.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <img 
              src={daftimeLogo} 
              alt="Daftime Advisory" 
              className="h-10 w-auto"
            />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Mes Clients</h2>
              <p className="text-muted-foreground">
                {companies.length} entreprise{companies.length > 1 ? 's' : ''} gérée{companies.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            {isSuperAdmin && (
              <>
                <Button variant="outline" onClick={() => navigate('/admin/users')}>
                  <Users className="w-4 h-4 mr-2" />
                  Gérer Utilisateurs
                </Button>
                <Button onClick={() => navigate('/admin/company/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Client
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Companies grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            {companies.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Aucun client pour le moment
                </h3>
                <p className="text-muted-foreground mb-6">
                  Commencez par ajouter votre premier client
                </p>
                {isSuperAdmin && (
                  <Button onClick={() => navigate('/admin/company/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un client
                  </Button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Aucun résultat
                </h3>
                <p className="text-muted-foreground">
                  Aucun client ne correspond à "{searchQuery}"
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => {
              const revenueVariance = company.budgetYTD > 0 
                ? ((company.revenueYTD - company.budgetYTD) / company.budgetYTD) * 100 
                : 0;
              const netIncome = company.revenueYTD - company.expensesYTD;
              const margin = company.revenueYTD > 0 
                ? (netIncome / company.revenueYTD) * 100 
                : 0;

              return (
                <CompanyCard
                  key={company.id}
                  id={company.id}
                  name={company.name}
                  logoUrl={company.logo_url}
                  layoutType={company.layout_type}
                  currency={company.currency}
                  revenueYTD={company.revenueYTD}
                  revenueVariance={revenueVariance}
                  margin={margin}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
