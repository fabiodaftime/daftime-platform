import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { DIGIT_AVAILABLE_MONTHS, getDigitMonthData, type DigitMonthId } from '@/components/dashboard/digit/DigitData';
import { DigitOverviewTab } from '@/components/dashboard/digit/DigitOverviewTab';
import { DigitYTDTab } from '@/components/dashboard/digit/DigitYTDTab';
import { DigitRevenueTab } from '@/components/dashboard/digit/DigitRevenueTab';
import { DigitCostsTab } from '@/components/dashboard/digit/DigitCostsTab';
import { DigitGlobalTab } from '@/components/dashboard/digit/DigitGlobalTab';
import { DigitSpyTab } from '@/components/dashboard/digit/DigitSpyTab';
import { DigitCommentTrustTab } from '@/components/dashboard/digit/DigitCommentTrustTab';
import { DigitCommentsTab } from '@/components/dashboard/digit/DigitCommentsTab';
import { ConsolidatedAccessButton } from '@/components/dashboard/ConsolidatedAccessButton';
import './DashboardDigit.css';

const tabs = [
  { id: "overview", label: "📊 Vue d'ensemble" },
  { id: "ytd", label: "📈 YTD 2026" },
  { id: "revenue", label: "💰 Analyse CA" },
  { id: "costs", label: "📉 Analyse Charges" },
  { id: "global", label: "🌐 Digit Solution" },
  { id: "spy", label: "🔍 SPY" },
  { id: "comment-trust", label: "💬 Comment/Trust" },
  { id: "comments", label: "💬 Commentaires" },
];

export default function DashboardDigit() {
  const [tab, setTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState<DigitMonthId>('feb-2026');
  const navigate = useNavigate();

  const monthData = getDigitMonthData(selectedMonth);

  return (
    <div className="digit-dashboard">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <header className="digit-header">
        <div className="digit-header-inner">
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} style={{ color: '#6b7280' }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <ConsolidatedAccessButton />
          </div>
          <h1 className="digit-title">Digit - Dashboard Financier</h1>
          <div className="digit-subtitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div />
            <MonthSelector
              months={DIGIT_AVAILABLE_MONTHS}
              selectedMonth={selectedMonth}
              onMonthChange={(id) => setSelectedMonth(id as DigitMonthId)}
              variant="accent"
            />
          </div>
        </div>
      </header>

      <div className="digit-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`digit-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="digit-tab-content">
        {tab === "overview" && <DigitOverviewTab data={monthData} />}
        {tab === "ytd" && <DigitYTDTab data={monthData} />}
        {tab === "revenue" && <DigitRevenueTab data={monthData} />}
        {tab === "costs" && <DigitCostsTab data={monthData} />}
        {tab === "global" && <DigitGlobalTab data={monthData} />}
        {tab === "spy" && <DigitSpyTab data={monthData} />}
        {tab === "comment-trust" && <DigitCommentTrustTab data={monthData} />}
        {tab === "comments" && <DigitCommentsTab />}
      </div>

      <footer className="digit-footer">
        <p><strong>Digit</strong> — Dashboard Financier CFO | {monthData.monthLabel} | Confidentiel</p>
      </footer>
    </div>
  );
}
