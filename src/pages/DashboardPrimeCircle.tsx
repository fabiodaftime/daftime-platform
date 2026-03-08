import { PrimeCircleHeader } from '@/components/dashboard/primecircle/PrimeCircleHeader';
import { PrimeCircleKPIGrid } from '@/components/dashboard/primecircle/PrimeCircleKPIGrid';
import { PrimeCircleYTDSection } from '@/components/dashboard/primecircle/PrimeCircleYTDSection';
import { PrimeCircleCostsSection } from '@/components/dashboard/primecircle/PrimeCircleCostsSection';
import { PrimeCircleCharts } from '@/components/dashboard/primecircle/PrimeCircleCharts';
import { PrimeCircleStatusGrid } from '@/components/dashboard/primecircle/PrimeCircleStatusGrid';
import { PrimeCircleTable } from '@/components/dashboard/primecircle/PrimeCircleTable';
import './DashboardPrimeCircle.css';

export default function DashboardPrimeCircle() {
  return (
    <div className="primecircle-dashboard">
      <div className="pc-container">
        <PrimeCircleHeader />
        <PrimeCircleKPIGrid />
        <PrimeCircleYTDSection />
        <PrimeCircleCostsSection />
        <PrimeCircleCharts />
        <PrimeCircleStatusGrid />
        <PrimeCircleTable />
        
        <footer className="pc-footer">
          Prime Circle Banking — U.S. Business Solutions for Global Founders
        </footer>
      </div>
    </div>
  );
}
