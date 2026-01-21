import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Eye, Settings } from 'lucide-react';
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
}

export function CompanyCard({
  id,
  name,
  logoUrl,
  layoutType,
  currency,
}: CompanyCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="group bg-card hover:shadow-lg transition-all duration-300 border border-border hover:border-accent/50 overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">{name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{layoutType.replace('_', ' ')}</p>
          </div>
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
                console.log('[CompanyCard] Navigating:', { id, layoutType, route });
                navigate(route);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate(`/admin/company/${id}`)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
