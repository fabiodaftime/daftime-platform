import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompanyCardProps {
  id: string;
  name: string;
  logoUrl?: string | null;
  layoutType: string;
  currency: string;
  revenueYTD?: number;
  revenueVariance?: number;
  margin?: number;
  showSettings?: boolean;
  hasRealData?: boolean;
}

export function CompanyCard({
  id,
  name,
  layoutType,
  showSettings = true,
  hasRealData,
}: CompanyCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="group bg-card hover:shadow-lg transition-all duration-300 border border-border hover:border-accent/50 overflow-hidden">
      <CardContent className="p-6">
        {/* Title + data status */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <h3 className="font-semibold text-lg text-foreground truncate">{name}</h3>
          {hasRealData === true && (
            <Badge variant="outline" className="shrink-0 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Données réelles
            </Badge>
          )}
          {/* Badge "Aucune donnée" volontairement retiré : on n'affiche plus rien
              quand monthly_financials est vide pour garder les cards épurées. */}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={() => {
                let route = `/dashboard/${id}`;
                if (layoutType === 'bocuse') route = `/dashboard-bocuse/${id}`;
                if (layoutType === 'labarile') route = `/dashboard-labarile/${id}`;
                if (layoutType === 'richissime') route = `/dashboard-richissime/${id}`;
                if (layoutType === 'cwp_pl_2025') route = `/dashboard-cwp-pl-2025/${id}`;
                if (layoutType === 'nowmade') route = `/dashboard-nowmade/${id}`;
                if (layoutType === 'prime_circle') route = `/dashboard-prime-circle/${id}`;
                if (layoutType === 'prime_circle_agency') route = `/dashboard-prime-circle-agency/${id}`;
                if (layoutType === 'digit') route = `/dashboard-digit/${id}`;
                if (layoutType === 'prime_circle_group') route = `/dashboard-pc-group/${id}`;
                if (layoutType === 'nexus_test') route = `/dashboard-nexus/${id}`;
                if (layoutType === 'hotel_x') route = `/dashboard-hotel-x/${id}`;
                if (layoutType === 'skalis') route = `/dashboard-skalis/${id}`;
                console.log('[CompanyCard] Navigating:', { id, layoutType, route });
                navigate(route);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir Dashboard
            </Button>
            {showSettings && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate(`/admin/company/${id}`)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
