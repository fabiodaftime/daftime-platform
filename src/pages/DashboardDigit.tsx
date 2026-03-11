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
import { DigitProductsTab } from '@/components/dashboard/digit/DigitProductsTab';
import { DigitEvolutionTab } from '@/components/dashboard/digit/DigitEvolutionTab';
import { DigitCommentsTab } from '@/components/dashboard/digit/DigitCommentsTab';
import { ConsolidatedAccessButton } from '@/components/dashboard/ConsolidatedAccessButton';
import './DashboardDigit.css';

const tabs = [
  { id: "overview", label: "📊 Vue d'ensemble" },
  { id: "ytd", label: "📈 YTD 2026" },
  { id: "revenue", label: "💰 Analyse CA" },
  { id: "costs", label: "📉 Analyse Charges" },
  { id: "products", label: "🌐 Produits" },
  { id: "evolution", label: "📊 Évolution MoM" },
  { id: "comments", label: "💬 Commentaires" },
];

export default function DashboardDigit() {
  const [tab, setTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState<DigitMonthId>('feb-2026');
  const navigate = useNavigate();

  const monthData = getDigitMonthData(selectedMonth);

  return (
    <div className="digit-dashboard">
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet" />

      <header className="digit-header">
        <div className="digit-header-inner">
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} style={{ color: '#536471' }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <ConsolidatedAccessButton />
          </div>
          <div className="digit-header-main">
            <div>
              <h1 className="digit-title">Digit <span className="italic">Solution</span></h1>
              <div className="digit-subtitle">Dashboard Financier</div>
              <div style={{ marginTop: 8 }}>
                <MonthSelector
                  months={DIGIT_AVAILABLE_MONTHS}
                  selectedMonth={selectedMonth}
                  onMonthChange={(id) => setSelectedMonth(id as DigitMonthId)}
                  variant="blue"
                />
              </div>
            </div>
            <div className="digit-period-badge">{monthData.monthLabel}</div>
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
        {tab === "products" && <DigitProductsTab data={monthData} />}
        {tab === "evolution" && <DigitEvolutionTab data={monthData} />}
        {tab === "comments" && <DigitCommentsTab />}
      </div>

      <footer className="digit-footer">
        Dashboard Digit Solution — {monthData.monthLabel} | Données financières
      </footer>
    </div>
  );
}
