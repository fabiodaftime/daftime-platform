import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { PCAOverviewTab } from '@/components/dashboard/primecircle-agency/PCAOverviewTab';
import { PCAClientsTab } from '@/components/dashboard/primecircle-agency/PCAClientsTab';
import { PCAMediaTab } from '@/components/dashboard/primecircle-agency/PCAMediaTab';
import { PCABlinkTab } from '@/components/dashboard/primecircle-agency/PCABlinkTab';

import { C, PCA_AVAILABLE_MONTHS, getPCAMonthData, type PCAMonthId } from '@/components/dashboard/primecircle-agency/PrimeCircleAgencyData';
import { ConsolidatedAccessButton } from '@/components/dashboard/ConsolidatedAccessButton';
import pcaLogo from '@/assets/prime-circle-agency-logo.png';
import './DashboardPrimeCircleAgency.css';

const tabs = [
  { id: "overview", label: "Vue d'ensemble", icon: "📊" },
  { id: "clients", label: "Clients", icon: "👥" },
  { id: "media", label: "Media Spend", icon: "📡" },
  { id: "blink", label: "Suivi Blink", icon: "🏦" },
];

export default function DashboardPrimeCircleAgency() {
  const [tab, setTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState<PCAMonthId>('feb-2026');
  const navigate = useNavigate();

  const data = getPCAMonthData(selectedMonth);

  return (
    <div className="pca-dashboard">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap" rel="stylesheet" />

      <header className="pca-header">
        <div className="pca-header-inner">
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="pca-back-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <ConsolidatedAccessButton />
          </div>
          <div className="pca-header-top">
            <div className="pca-logo-area">
              <img src={pcaLogo} alt="Prime Circle Agency" style={{ height: 50 }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pca-badge" style={{ background: C.accentSoft, color: C.accent }}>{data.monthShort}</span>
                  <MonthSelector
                    months={PCA_AVAILABLE_MONTHS}
                    selectedMonth={selectedMonth}
                    onMonthChange={(id) => setSelectedMonth(id as PCAMonthId)}
                    variant="accent"
                  />
                </div>
                <p className="pca-subtitle">Dashboard Financier & Operationnel Mensuel</p>
              </div>
            </div>
            <div className="pca-month-badge">
              <div className="pca-month-label">NET REVENUE</div>
              <div className="pca-month-value">${data.net.toLocaleString()}</div>
              {data.prevNet > 0 && (
                <div style={{ fontSize: 10, color: C.greenText, fontWeight: 700 }}>
                  {((data.net - data.prevNet) / data.prevNet * 100).toFixed(0)}% vs M-1
                </div>
              )}
            </div>
          </div>
          <div className="pca-tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`pca-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="pca-container">
        {tab === "overview" && <PCAOverviewTab data={data} />}
        {tab === "clients" && <PCAClientsTab data={data} />}
        {tab === "media" && <PCAMediaTab data={data} />}
        {tab === "blink" && <PCABlinkTab data={data} />}
        {tab === "risks" && <PCARisksTab data={data} />}
      </main>
    </div>
  );
}
