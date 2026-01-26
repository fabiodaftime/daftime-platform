import { kpis, EXCHANGE_RATE, formatAED, formatUSD, formatPercent } from './NowmadeData';

interface NowmadeKPIGridProps {
  currency: 'AED' | 'USD';
}

export function NowmadeKPIGrid({ currency }: NowmadeKPIGridProps) {
  const isAED = currency === 'AED';
  const format = isAED ? formatAED : formatUSD;
  const convert = (val: number) => isAED ? val : val / EXCHANGE_RATE;

  if (isAED) {
    return (
      <div className="nowmade-kpi-grid">
        <div className="nowmade-kpi-card highlight">
          <div className="nowmade-kpi-label">Annual Revenue 2025</div>
          <div className="nowmade-kpi-value">{format(kpis.annualRevenueAED)}</div>
          <div className="nowmade-kpi-change positive">Full Year 2025</div>
        </div>
        <div className="nowmade-kpi-card">
          <div className="nowmade-kpi-label">Annual EBITDA</div>
          <div className="nowmade-kpi-value">{format(kpis.annualEBITDAAED)}</div>
          <div className="nowmade-kpi-change positive">↑ Margin: 33.3%</div>
        </div>
        <div className="nowmade-kpi-card">
          <div className="nowmade-kpi-label">Peak Month Revenue</div>
          <div className="nowmade-kpi-value">{format(kpis.peakRevenue)}</div>
          <div className="nowmade-kpi-change">{kpis.peakRevenueMonth}</div>
        </div>
        <div className="nowmade-kpi-card">
          <div className="nowmade-kpi-label">Peak Profit Margin</div>
          <div className="nowmade-kpi-value">{formatPercent(kpis.peakMargin)}</div>
          <div className="nowmade-kpi-change positive">{kpis.peakMarginMonth}</div>
        </div>
        <div className="nowmade-kpi-card">
          <div className="nowmade-kpi-label">Avg. Occupancy</div>
          <div className="nowmade-kpi-value">{formatPercent(kpis.avgOccupancy)}</div>
          <div className="nowmade-kpi-change">12-month average</div>
        </div>
        <div className="nowmade-kpi-card">
          <div className="nowmade-kpi-label">Peak Occupancy</div>
          <div className="nowmade-kpi-value">{formatPercent(kpis.peakOccupancy)}</div>
          <div className="nowmade-kpi-change">{kpis.peakOccupancyMonth}</div>
        </div>
      </div>
    );
  }

  // USD view KPIs
  const avgMonthlyRevenue = kpis.annualRevenueAED / EXCHANGE_RATE / 12;
  const avgMonthlyEBITDA = kpis.annualEBITDAAED / EXCHANGE_RATE / 12;

  return (
    <div className="nowmade-kpi-grid">
      <div className="nowmade-kpi-card highlight">
        <div className="nowmade-kpi-label">Annual Revenue 2025</div>
        <div className="nowmade-kpi-value">{formatUSD(kpis.annualRevenueAED / EXCHANGE_RATE)}</div>
        <div className="nowmade-kpi-change positive">Full Year 2025</div>
      </div>
      <div className="nowmade-kpi-card">
        <div className="nowmade-kpi-label">Annual EBITDA</div>
        <div className="nowmade-kpi-value">{formatUSD(kpis.annualEBITDAAED / EXCHANGE_RATE)}</div>
        <div className="nowmade-kpi-change positive">↑ Margin: 33.3%</div>
      </div>
      <div className="nowmade-kpi-card">
        <div className="nowmade-kpi-label">Peak Month Revenue</div>
        <div className="nowmade-kpi-value">{formatUSD(kpis.peakRevenue / EXCHANGE_RATE)}</div>
        <div className="nowmade-kpi-change">{kpis.peakRevenueMonth}</div>
      </div>
      <div className="nowmade-kpi-card">
        <div className="nowmade-kpi-label">Peak Profit Margin</div>
        <div className="nowmade-kpi-value">{formatPercent(kpis.peakMargin)}</div>
        <div className="nowmade-kpi-change positive">{kpis.peakMarginMonth}</div>
      </div>
      <div className="nowmade-kpi-card">
        <div className="nowmade-kpi-label">Avg. Monthly Revenue</div>
        <div className="nowmade-kpi-value">{formatUSD(avgMonthlyRevenue)}</div>
        <div className="nowmade-kpi-change">12-month average</div>
      </div>
      <div className="nowmade-kpi-card">
        <div className="nowmade-kpi-label">Avg. Monthly EBITDA</div>
        <div className="nowmade-kpi-value">{formatUSD(avgMonthlyEBITDA)}</div>
        <div className="nowmade-kpi-change">12-month average</div>
      </div>
    </div>
  );
}
