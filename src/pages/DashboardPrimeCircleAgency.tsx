import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PCAOverviewTab } from '@/components/dashboard/primecircle-agency/PCAOverviewTab';
import { PCAClientsTab } from '@/components/dashboard/primecircle-agency/PCAClientsTab';
import { PCAMediaTab } from '@/components/dashboard/primecircle-agency/PCAMediaTab';
import { PCARisksTab } from '@/components/dashboard/primecircle-agency/PCARisksTab';
import { C } from '@/components/dashboard/primecircle-agency/PrimeCircleAgencyData';
import './DashboardPrimeCircleAgency.css';

const tabs = [
  { id: "overview", label: "Vue d'ensemble", icon: "📊" },
  { id: "clients", label: "Clients", icon: "👥" },
  { id: "media", label: "Media Spend", icon: "📡" },
  { id: "risks", label: "Risques et Commentaires", icon: "⚠️" },
];

export default function DashboardPrimeCircleAgency() {
  const [tab, setTab] = useState("overview");
  const navigate = useNavigate();

  return (
    <div className="pca-dashboard">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap" rel="stylesheet" />

      <header className="pca-header">
        <div className="pca-header-inner">
          <div style={{ marginBottom: 12 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="pca-back-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
          <div className="pca-header-top">
            <div className="pca-logo-area">
              <div className="pca-logo-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2" fill="none" /><circle cx="10" cy="10" r="3" fill="white" /></svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pca-title-main">Prime Circle</span>
                  <span className="pca-title-main pca-title-accent">Agency</span>
                  <span className="pca-badge" style={{ background: C.accentSoft, color: C.accent }}>JANVIER 2026</span>
                </div>
                <p className="pca-subtitle">Monthly Financial & Operational Dashboard</p>
              </div>
            </div>
            <div className="pca-month-badge">
              <div className="pca-month-label">MOIS</div>
              <div className="pca-month-value">JAN 2026</div>
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
        {tab === "overview" && <PCAOverviewTab />}
        {tab === "clients" && <PCAClientsTab />}
        {tab === "media" && <PCAMediaTab />}
        {tab === "risks" && <PCARisksTab />}
      </main>
    </div>
  );
}
