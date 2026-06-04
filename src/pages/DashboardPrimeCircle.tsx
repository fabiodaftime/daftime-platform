import { useState } from 'react';
import { PrimeCircleHeader } from '@/components/dashboard/primecircle/PrimeCircleHeader';
import { PrimeCircleKPIGrid } from '@/components/dashboard/primecircle/PrimeCircleKPIGrid';
import { PrimeCircleYTDSection } from '@/components/dashboard/primecircle/PrimeCircleYTDSection';
import { PrimeCircleCostsSection } from '@/components/dashboard/primecircle/PrimeCircleCostsSection';
import { PrimeCircleCharts } from '@/components/dashboard/primecircle/PrimeCircleCharts';
import { PrimeCircleStatusGrid } from '@/components/dashboard/primecircle/PrimeCircleStatusGrid';
import { PrimeCircleTable } from '@/components/dashboard/primecircle/PrimeCircleTable';
import { getPCMonthData, PC_AVAILABLE_MONTHS, type PCMonthId } from '@/components/dashboard/primecircle/PrimeCircleData';
import './DashboardPrimeCircle.css';

export default function DashboardPrimeCircle() {
  const [selectedMonth, setSelectedMonth] = useState<PCMonthId>(
    (PC_AVAILABLE_MONTHS[PC_AVAILABLE_MONTHS.length - 1]?.id as PCMonthId) ?? 'apr-2026',
  );
  const data = getPCMonthData(selectedMonth);

  return (
    <div className="primecircle-dashboard">
      <div className="pc-container">
        <PrimeCircleHeader data={data} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        <PrimeCircleKPIGrid data={data} />
        <PrimeCircleYTDSection data={data} />
        <PrimeCircleCostsSection data={data} />
        <PrimeCircleCharts data={data} />
        <PrimeCircleStatusGrid data={data} />
        <PrimeCircleTable data={data} />
        
        <footer className="pc-footer">
          Prime Circle Banking — U.S. Business Solutions for Global Founders
        </footer>
      </div>
    </div>
  );
}
