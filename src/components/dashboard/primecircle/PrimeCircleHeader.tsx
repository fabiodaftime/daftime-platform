import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ConsolidatedAccessButton } from '@/components/dashboard/ConsolidatedAccessButton';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { PC_AVAILABLE_MONTHS, type PCMonthId, type PCMonthData } from './PrimeCircleData';

interface Props {
  data: PCMonthData;
  selectedMonth: PCMonthId;
  onMonthChange: (id: PCMonthId) => void;
}

export function PrimeCircleHeader({ data, selectedMonth, onMonthChange }: Props) {
  const navigate = useNavigate();

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="pc-back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <ConsolidatedAccessButton />
      </div>

      <header className="pc-header">
        <div className="pc-header-left">
          <div className="pc-logo">
            <div className="pc-logo-main">Prime <span className="italic">Circle</span></div>
            <div className="pc-logo-sub">Banking</div>
          </div>
          <div className="pc-divider"></div>
          <div className="pc-header-title">
            <h1>Banking Dashboard</h1>
            <p className="subtitle">U.S. Business Infrastructure Performance</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MonthSelector
            months={PC_AVAILABLE_MONTHS}
            selectedMonth={selectedMonth}
            onMonthChange={(id) => onMonthChange(id as PCMonthId)}
            variant="blue"
          />
        </div>
      </header>
    </>
  );
}
