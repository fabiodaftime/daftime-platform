import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { PCAOverviewTab } from '@/components/dashboard/primecircle-agency/PCAOverviewTab';
import { PCAYTDTab } from '@/components/dashboard/primecircle-agency/PCAYTDTab';
import { PCAClientsTab } from '@/components/dashboard/primecircle-agency/PCAClientsTab';
import { PCAMediaTab } from '@/components/dashboard/primecircle-agency/PCAMediaTab';
import { PCABlinkTab } from '@/components/dashboard/primecircle-agency/PCABlinkTab';
import { RestatementHistoryTab } from '@/components/dashboard/pcgroup/RestatementHistoryTab';
import { PCAIntegrityPanel } from '@/components/dashboard/primecircle-agency/PCAIntegrityPanel';

import { C, PCA_AVAILABLE_MONTHS, getPCAMonthData, type PCAMonthId } from '@/components/dashboard/primecircle-agency/PrimeCircleAgencyData';
import { ConsolidatedAccessButton } from '@/components/dashboard/ConsolidatedAccessButton';
import pcaLogo from '@/assets/prime-circle-agency-logo.png';
import './DashboardPrimeCircleAgency.css';

const tabs = [
  { id: "overview", label: "Vue d'ensemble", icon: "📊" },
  { id: "ytd", label: "YTD 2026", icon: "📈" },
  { id: "clients", label: "Clients", icon: "👥" },
  { id: "media", label: "Media Spend", icon: "📡" },
  { id: "blink", label: "Suivi Blink", icon: "🏦" },
  { id: "history", label: "Historique", icon: "📋" },
];

export default function DashboardPrimeCircleAgency() {
  const [tab, setTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState<PCAMonthId>('apr-2026');
  const navigate = useNavigate();

  const data = getPCAMonthData(selectedMonth);

  return (
    <div className="pca-dashboard">
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet" />

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
                <div className="pca-title-main">
                  Prime Circle <span className="pca-title-accent">Agency</span>
                </div>
                <div className="pca-subtitle">Dashboard Financier</div>
                <div style={{ marginTop: 8 }}>
                  <MonthSelector
                    months={PCA_AVAILABLE_MONTHS}
                    selectedMonth={selectedMonth}
                    onMonthChange={(id) => setSelectedMonth(id as PCAMonthId)}
                    variant="blue"
                  />
                </div>
              </div>
            </div>
            <div className="pca-month-badge">
              <div className="pca-nr-box">
                <div className="pca-month-label">NET REVENUE</div>
                <div className="pca-month-value">${data.net.toLocaleString()}</div>
                {data.prevNet > 0 && (
                  <div style={{ fontSize: 11, color: C.greenText, fontWeight: 600 }}>
                    +{((data.net - data.prevNet) / data.prevNet * 100).toFixed(0)}% vs Jan
                  </div>
                )}
              </div>
              <div className="pca-period-badge">{data.monthLabel}</div>
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

      <PCAIntegrityPanel />

      <main className="pca-container">
        {tab === "overview" && <PCAOverviewTab data={data} />}
        {tab === "ytd" && <PCAYTDTab data={data} />}
        {tab === "clients" && <PCAClientsTab data={data} />}
        {tab === "media" && <PCAMediaTab data={data} />}
        {tab === "blink" && <PCABlinkTab data={data} />}
        {tab === "history" && <RestatementHistoryTab restrictEntity="agency" accent="navy" />}
      </main>

      <div className="pca-footer" style={{ maxWidth: 1280, margin: '0 auto' }}>
        Prime Circle Agency — Dashboard Financier & Opérationnel — {data.monthLabel}
      </div>
    </div>
  );
}
