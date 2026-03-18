import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Settings } from 'lucide-react';
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
  layoutType,
}: CompanyCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="group bg-card hover:shadow-lg transition-all duration-300 border border-border hover:border-accent/50 overflow-hidden">
      <CardContent className="p-6">
        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground truncate mb-4">{name}</h3>

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
