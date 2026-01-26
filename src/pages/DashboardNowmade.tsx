import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NowmadeHeader } from '@/components/dashboard/nowmade/NowmadeHeader';
import { NowmadeKPIGrid } from '@/components/dashboard/nowmade/NowmadeKPIGrid';
import { NowmadeRevenueCharts } from '@/components/dashboard/nowmade/NowmadeRevenueCharts';
import { NowmadeOperationalCharts } from '@/components/dashboard/nowmade/NowmadeOperationalCharts';
import { NowmadeCostCharts } from '@/components/dashboard/nowmade/NowmadeCostCharts';
import { NowmadeUSDView } from '@/components/dashboard/nowmade/NowmadeUSDView';
import { NowmadeExecutiveSummary } from '@/components/dashboard/nowmade/NowmadeExecutiveSummary';
import './DashboardNowmade.css';

export default function DashboardNowmade() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('aed');

  return (
    <div className="nowmade-dashboard min-h-screen">
      <NowmadeHeader />

      <div className="nowmade-nav-container">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="nowmade-back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="nowmade-tabs">
          <TabsList className="nowmade-tabs-list">
            <TabsTrigger value="aed" className="nowmade-tab">📊 AED View</TabsTrigger>
            <TabsTrigger value="usd" className="nowmade-tab">💵 USD View</TabsTrigger>
            <TabsTrigger value="executive" className="nowmade-tab">📋 Executive Summary</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="nowmade-main">
        {activeTab === 'aed' && (
          <div className="nowmade-tab-content">
            <NowmadeKPIGrid currency="AED" />
            <NowmadeRevenueCharts currency="AED" />
            <NowmadeOperationalCharts />
            <NowmadeCostCharts />
          </div>
        )}

        {activeTab === 'usd' && (
          <div className="nowmade-tab-content">
            <NowmadeUSDView />
          </div>
        )}

        {activeTab === 'executive' && (
          <div className="nowmade-tab-content">
            <NowmadeExecutiveSummary />
          </div>
        )}
      </main>

      <footer className="nowmade-footer">
        <p>Nowmade (Cosy Hills JBR) – Investor Dashboard | Data Period: January – December 2025</p>
        <p>Exchange Rate Applied: 1 USD = 3.6725 AED | Generated for Investor Review</p>
      </footer>
    </div>
  );
}
