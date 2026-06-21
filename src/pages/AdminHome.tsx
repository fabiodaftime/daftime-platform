import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompanyCard } from '@/components/admin/CompanyCard';
import { Plus, Search, Building2, Users, Upload, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppShell } from '@/components/layout/AppShell';

interface CompanyWithKPIs {
  id: string;
  name: string;
  logo_url: string | null;
  layout_type: string;
  currency: string;
  revenueYTD: number;
  budgetYTD: number;
  expensesYTD: number;
  hasRealData: boolean;
}

export default function AdminHome() {
  const [companies, setCompanies] = useState<CompanyWithKPIs[]>([]);
  const [genericClients, setGenericClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompaniesWithKPIs();
  }, []);

  useEffect(() => {
    supabase
      .from('clients' as any)
      .select('id, name, currency')
      .is('legacy_company_id', null) // clients génériques uniquement (pas les coquilles liées au legacy)
      .order('created_at', { ascending: false })
      .then(({ data }) => setGenericClients((data as any[]) ?? []));
  }, []);

  const fetchCompaniesWithKPIs = async () => {
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;

      // For client_viewer, skip the KPI fetch entirely (cards are minimalist).
      if (!isSuperAdmin) {
        setCompanies(
          (companiesData || []).map((company) => ({
            ...company,
            revenueYTD: 0,
            budgetYTD: 0,
            expensesYTD: 0,
            hasRealData: false,
          }))
        );
        return;
      }

      const currentYear = new Date().getFullYear();
      const companiesWithKPIs: CompanyWithKPIs[] = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { data: financials } = await supabase
            .from('monthly_financials')
            .select('revenue_actual, revenue_budget')
            .eq('company_id', company.id)
            .eq('year', currentYear);

          const revenueYTD = financials?.reduce((sum, f) => sum + Number(f.revenue_actual), 0) || 0;
          const budgetYTD = financials?.reduce((sum, f) => sum + Number(f.revenue_budget), 0) || 0;

          return {
            ...company,
            revenueYTD,
            budgetYTD,
            expensesYTD: 0,
            hasRealData: !!financials && financials.length > 0,
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

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell maxWidth="max-w-6xl">
      {/* Title and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {isSuperAdmin ? 'Mes Clients' : 'Mes Dashboards'}
              </h2>
              {isSuperAdmin && (
                <p className="text-muted-foreground">
                  {companies.length} entreprise{companies.length > 1 ? 's' : ''} gérée{companies.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            {(isSuperAdmin || companies.length > 6) && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            )}
            {isSuperAdmin && (
              <>
                <Button variant="outline" onClick={() => navigate('/admin/users')}>
                  <Users className="w-4 h-4 mr-2" />
                  Gérer Utilisateurs
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/csv-import')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/clients')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Espace IA
                </Button>
                <Button onClick={() => navigate('/admin/company/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Client
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Clients génériques (nouveau modèle / pipeline IA) */}
        {isSuperAdmin && genericClients.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Clients — nouveau modèle (pipeline IA)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {genericClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/admin/clients/${c.id}`)}
                  className="text-left border rounded-lg p-4 hover:border-primary transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded">IA</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{c.currency}</div>
                </button>
              ))}
            </div>
          </div>
        )}

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
                  showSettings={isSuperAdmin}
                  hasRealData={isSuperAdmin ? company.hasRealData : undefined}
                />
              );
            })}
          </div>
        )}
    </AppShell>
  );
}
