import { compSet, trendData } from './HotelXData';
import { Bar, Line } from 'react-chartjs-2';

const P = { g: '#C9A84C', gS: 'rgba(201,168,76,.14)' };

export function HotelXBenchmarkTab() {
  return (
    <div>
      <div className="hx-stitle">RAK Market Benchmarks — Hotel X Positioning</div>

      <div className="hx-brow">
        <div className="hx-bc ours">
          <div className="hx-bcl">Hotel X · 350 keys</div>
          <div className="hx-bcv" style={{fontSize:'1.1rem',color:'var(--hx-gold)'}}>Our Property</div>
          <div className="hx-bcm">5★ luxury beachfront</div>
        </div>
        <div className="hx-bc">
          <div className="hx-bcl">Occupancy</div>
          <div className="hx-bcv">71.1%</div>
          <div className="hx-bcm">RAK market: 72–76%</div>
          <div className="hx-bcr hx-fl">→ Slightly below market avg</div>
        </div>
        <div className="hx-bc">
          <div className="hx-bcl">ADR (AED)</div>
          <div className="hx-bcv">729</div>
          <div className="hx-bcm">RAK all-seg avg: AED 479</div>
          <div className="hx-bcr hx-up">↑ +52% vs full market avg</div>
        </div>
        <div className="hx-bc">
          <div className="hx-bcl">RevPAR (AED)</div>
          <div className="hx-bcv">519</div>
          <div className="hx-bcm">RAK provincial avg: AED 353</div>
          <div className="hx-bcr hx-up">↑ +47% — luxury premium</div>
        </div>
        <div className="hx-bc">
          <div className="hx-bcl">GOP Margin</div>
          <div className="hx-bcv">31.6%</div>
          <div className="hx-bcm">UAE luxury: 30–38%</div>
          <div className="hx-bcr hx-fl">→ Within range</div>
        </div>
      </div>

      <div className="hx-g2">
        <div className="hx-cd">
          <div className="hx-ct">Competitive Set — RevPAR Comparison (AED)</div>
          <div className="hx-cht">
            <Bar data={{
              labels: compSet.map(c => c.name),
              datasets: [{
                data: compSet.map(c => c.revpar),
                backgroundColor: ['rgba(201,168,76,.85)','rgba(78,142,106,.65)','rgba(44,95,138,.65)','rgba(168,50,50,.5)','rgba(176,168,152,.6)','rgba(176,168,152,.35)'],
                borderRadius: 6,
              }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">3-Year RevPAR Trend — Hotel X vs RAK Market Average</div>
          <div className="hx-cht">
            <Line data={{
              labels: trendData.map(t => t.year),
              datasets: [
                { label: 'Hotel X - RevPAR (AED)', data: trendData.map(t => t.hotelX), borderColor: P.g, backgroundColor: P.gS, fill: true, borderWidth: 2.5, tension: .4, pointRadius: 6, pointBackgroundColor: P.g },
                { label: 'RAK Market Avg (AED)', data: trendData.map(t => t.market), borderColor: '#C8C0B4', borderDash: [5,4], borderWidth: 2, tension: .4, pointRadius: 4 },
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="hx-g3">
        <div className="hx-cd">
          <div className="hx-ct">2026 Outlook — Key Assumptions</div>
          <div className="hx-ir"><div className="hx-irl">Projected Occupancy</div><div className="hx-irv"><span className="hx-bdg hx-bg">73–77%</span></div></div>
          <div className="hx-ir"><div className="hx-irl">Projected ADR</div><div className="hx-irv"><span className="hx-bdg hx-bgr">AED 770–810</span></div></div>
          <div className="hx-ir"><div className="hx-irl">Projected RevPAR</div><div className="hx-irv"><span className="hx-bdg hx-bgr">AED 562–624</span></div></div>
          <div className="hx-ir"><div className="hx-irl">Revenue growth est.</div><div className="hx-irv">+8% to +12%</div></div>
          <div className="hx-ir"><div className="hx-irl">Wynn RAK (casino resort)</div><div className="hx-irv"><span className="hx-bdg hx-bnv">Opening 2026</span></div></div>
          <div className="hx-ir"><div className="hx-irl">RAK pipeline (to 2030)</div><div className="hx-irv">+9,500 keys est.</div></div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">SWOT Summary</div>
          <div className="hx-ir"><div className="hx-irl">💪 Strength</div><div className="hx-irv" style={{fontSize:'.8rem',textAlign:'right'}}>Brand loyalty & premium positioning</div></div>
          <div className="hx-ir"><div className="hx-irl">💪 Strength</div><div className="hx-irv" style={{fontSize:'.8rem',textAlign:'right'}}>Beachfront asset — scarce in RAK</div></div>
          <div className="hx-ir"><div className="hx-irl">⚠ Weakness</div><div className="hx-irv" style={{fontSize:'.8rem',textAlign:'right'}}>Severe summer trough (Occ 42–48%)</div></div>
          <div className="hx-ir"><div className="hx-irl">🚀 Opportunity</div><div className="hx-irv" style={{fontSize:'.8rem',textAlign:'right'}}>Wynn RAK demand uplift 2026+</div></div>
          <div className="hx-ir"><div className="hx-irl">🚀 Opportunity</div><div className="hx-irv" style={{fontSize:'.8rem',textAlign:'right'}}>MICE & corporate segment expansion</div></div>
          <div className="hx-ir"><div className="hx-irl">⚡ Threat</div><div className="hx-irv" style={{fontSize:'.8rem',textAlign:'right'}}>+9,500 keys in RAK pipeline to 2030</div></div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">Investment KPIs</div>
          <div className="hx-ir"><div className="hx-irl">Estimated Asset Value</div><div className="hx-irv">AED 320M</div></div>
          <div className="hx-ir"><div className="hx-irl">Cap Rate (NOI / Asset)</div><div className="hx-irv hx-gv">6.1%</div></div>
          <div className="hx-ir"><div className="hx-irl">EBITDA Multiple</div><div className="hx-irv">16.5×</div></div>
          <div className="hx-ir"><div className="hx-irl">Revenue per Key</div><div className="hx-irv">AED 272,500</div></div>
          <div className="hx-ir"><div className="hx-irl">GOPPAR (annual)</div><div className="hx-irv">AED 236 / avail. room</div></div>
          <div className="hx-ir"><div className="hx-irl">Net Profit per Key</div><div className="hx-irv">AED 41,122</div></div>
        </div>
      </div>
    </div>
  );
}
