import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  companyName: string;
  logoUrl?: string | null;
  period?: string;
}

export function DashboardHeader({ companyName, logoUrl, period = 'YTD 2024' }: DashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-dashboard-bg border-b border-dashboard-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))}
            className="text-dashboard-text hover:bg-dashboard-card-hover"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {logoUrl && (
            <img src={logoUrl} alt={companyName} className="h-10 w-auto" />
          )}
          
          <div>
            <h1 className="text-xl font-bold text-dashboard-text">{companyName}</h1>
            <p className="text-sm text-dashboard-text-muted">Financial Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dashboard-card rounded-lg">
            <Calendar className="w-4 h-4 text-dashboard-text-muted" />
            <span className="text-sm font-medium text-dashboard-text">{period}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-dashboard-border text-dashboard-text hover:bg-dashboard-card-hover"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </header>
  );
}
