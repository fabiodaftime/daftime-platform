import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, TrendingUp, TrendingDown, Eye, Settings } from 'lucide-react';
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
  revenueYTD = 0,
  revenueVariance = 0,
  margin = 0,
}: CompanyCardProps) {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

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

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Revenue YTD</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(revenueYTD)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">vs Budget</p>
            <div className="flex items-center gap-1">
              {revenueVariance >= 0 ? (
                <TrendingUp className="w-4 h-4 text-kpi-positive" />
              ) : (
                <TrendingDown className="w-4 h-4 text-kpi-negative" />
              )}
              <span className={`text-lg font-semibold ${revenueVariance >= 0 ? 'text-kpi-positive' : 'text-kpi-negative'}`}>
                {formatPercent(revenueVariance)}
              </span>
            </div>
          </div>
        </div>

        {/* Margin bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Marge</p>
            <p className="text-sm font-medium text-foreground">{margin.toFixed(1)}%</p>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={() => {
              let route = `/dashboard/${id}`;
              if (layoutType === 'bocuse') route = `/dashboard-bocuse/${id}`;
              if (layoutType === 'labarile') route = `/dashboard-labarile/${id}`;
              if (layoutType === 'richissime') route = `/dashboard-richissime/${id}`;
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
      </CardContent>
    </Card>
  );
}
