import { monthlyData, MONTHS, budgetOcc } from './HotelXData';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const P = { g: '#C9A84C', gS: 'rgba(201,168,76,.14)', gr: '#2A7A54', grS: 'rgba(42,122,84,.14)' };

export function HotelXOverviewTab() {
  return (
    <div>
      <div className="hx-kgrid">
        <div className="hx-kc">
          <div className="hx-kl">Total Revenue (FY)</div>
          <div className="hx-kv">AED 95.4M</div>
          <div className="hx-ks">All departments · full year</div>
          <div className="hx-kt hx-up">↑ +9.1% vs FY 2024</div>
        </div>
        <div className="hx-kc gr">
          <div className="hx-kl">Occupancy Rate</div>
          <div className="hx-kv">71.1%</div>
          <div className="hx-ks">Annual avg · 350 keys · 127,750 avail. nights</div>
          <div className="hx-kt hx-up">↑ +4.6 pts vs 2024</div>
        </div>
        <div className="hx-kc">
          <div className="hx-kl">ADR — Avg Daily Rate</div>
          <div className="hx-kv">AED 729</div>
          <div className="hx-ks">Weighted annual avg · excl. VAT</div>
          <div className="hx-kt hx-up">↑ +6.6% vs 2024</div>
        </div>
        <div className="hx-kc nv">
          <div className="hx-kl">RevPAR</div>
          <div className="hx-kv">AED 519</div>
          <div className="hx-ks">Room rev / available room · ≈ USD 141</div>
          <div className="hx-kt hx-up">↑ +11.5% vs 2024</div>
        </div>
        <div className="hx-kc gr">
          <div className="hx-kl">TRevPAR</div>
          <div className="hx-kv">AED 747</div>
          <div className="hx-ks">Total rev / available room · all depts</div>
          <div className="hx-kt hx-up">↑ +10.4% vs 2024</div>
        </div>
        <div className="hx-kc">
          <div className="hx-kl">GOP Margin</div>
          <div className="hx-kv">31.6%</div>
          <div className="hx-ks">Gross Operating Profit · AED 30.1M</div>
          <div className="hx-kt hx-fl">→ UAE luxury range: 30–38%</div>
        </div>
        <div className="hx-kc bl">
          <div className="hx-kl">GOPPAR</div>
          <div className="hx-kv">AED 236</div>
          <div className="hx-ks">GOP / available room / day</div>
          <div className="hx-kt hx-up">↑ +12.1% vs 2024</div>
        </div>
        <div className="hx-kc gr">
          <div className="hx-kl">Net Margin (post-tax)</div>
          <div className="hx-kv">15.1%</div>
          <div className="hx-ks">After UAE Corporate Tax 9% · AED 14.4M</div>
          <div className="hx-kt hx-up">↑ +1.8 pts vs 2024</div>
        </div>
      </div>

      <p className="hx-sn" style={{marginBottom:'1rem'}}>¹ Source: CoStar/STR RAK Market Report 2025 · Gulf Insider</p>

      <div className="hx-g2">
        <div className="hx-cd">
          <div className="hx-ct">Monthly Total Revenue & Net Profit — FY 2025 (AED '000)</div>
          <div className="hx-cht">
            <Bar data={{
              labels: MONTHS,
              datasets: [
                { label: 'Total Revenue', data: monthlyData.map(d => d.tot), backgroundColor: 'rgba(201,168,76,.65)', borderRadius: 5 },
                { label: 'Net Profit', data: monthlyData.map(d => d.net), type: 'line', borderColor: P.gr, backgroundColor: P.grS, fill: true, borderWidth: 2.5, tension: .4, pointRadius: 4, pointBackgroundColor: P.gr } as any,
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">Revenue Mix by Department</div>
          <div className="hx-cht">
            <Doughnut data={{
              labels: ['Rooms (69.5%)','F&B (20.5%)','Spa (5.6%)','MICE (2.9%)','Other (1.5%)'],
              datasets: [{ data: [69.5,20.5,5.6,2.9,1.5], backgroundColor: [P.g,'#4E8F6A','#2C5F8A','#9B7040','#B0A898'], borderWidth: 3, borderColor: '#FFF' }]
            }} options={{ responsive: true, maintainAspectRatio: false, cutout: '58%' }} />
          </div>
        </div>
      </div>

      <div className="hx-g3">
        <div className="hx-cd">
          <div className="hx-ct">Monthly Occupancy — Actual vs Budget</div>
          <div className="hx-ch">
            <Line data={{
              labels: MONTHS,
              datasets: [
                { label: 'Actual', data: monthlyData.map(d => d.occ), borderColor: P.g, backgroundColor: P.gS, fill: true, borderWidth: 2.5, tension: .4, pointRadius: 4, pointBackgroundColor: P.g },
                { label: 'Budget', data: budgetOcc, borderColor: '#B0A898', borderDash: [5,4], borderWidth: 2, tension: .4, pointRadius: 3 },
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">ADR Evolution — Actual vs Budget (AED)</div>
          <div className="hx-ch">
            <Bar data={{
              labels: MONTHS,
              datasets: [
                { label: 'Actual ADR', data: monthlyData.map(d => d.adr), backgroundColor: 'rgba(201,168,76,.65)', borderRadius: 5 },
                { label: 'Budget ADR', data: [1000,940,720,640,500,380,360,350,495,580,800,950], backgroundColor: 'rgba(176,168,152,.35)', borderRadius: 5 },
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">Seasonality Index (annual avg = 100)</div>
          <div className="hx-ch">
            <Bar data={{
              labels: MONTHS,
              datasets: [{
                label: 'Seasonality',
                data: monthlyData.map(d => Math.round(d.tot / (monthlyData.reduce((s, x) => s + x.tot, 0) / 12) * 100)),
                backgroundColor: monthlyData.map(d => {
                  const idx = Math.round(d.tot / (monthlyData.reduce((s, x) => s + x.tot, 0) / 12) * 100);
                  return idx >= 130 ? 'rgba(201,168,76,.75)' : idx >= 100 ? 'rgba(42,122,84,.6)' : idx >= 70 ? 'rgba(44,95,138,.5)' : 'rgba(168,50,50,.55)';
                }),
                borderRadius: 5,
              }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      <div className="hx-cd">
        <div className="hx-ct">Seasonality Pattern — RAK Luxury Beachfront Resort</div>
        <div className="hx-smap">
          {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].map((m, i) => {
            const cls = [0,1,10,11].includes(i) ? 'hx-pk' : [2,3,9].includes(i) ? 'hx-hi' : [4,8].includes(i) ? 'hx-mi' : 'hx-lo';
            const label = [0,1,10,11].includes(i) ? 'Peak' : [2,3,9].includes(i) ? 'High' : [4,8].includes(i) ? 'Mid' : 'Low';
            return <div key={m} className={`hx-sm ${cls}`}>{m}<br/>{label}</div>;
          })}
        </div>
        <div style={{display:'flex',gap:'2rem',marginTop:'.9rem',fontSize:'.72rem',flexWrap:'wrap'}}>
          <span style={{color:'var(--hx-gold)'}}><strong>Peak</strong> — Occ 88–91% · ADR AED 980–1,050</span>
          <span style={{color:'var(--hx-green)'}}><strong>High</strong> — Occ 78–86% · ADR AED 680–840</span>
          <span style={{color:'var(--hx-blue)'}}><strong>Mid</strong> — Occ 62–65% · ADR AED 520–530</span>
          <span style={{color:'var(--hx-red)'}}><strong>Low</strong> — Occ 42–48% · ADR AED 370–400</span>
        </div>
      </div>
    </div>
  );
}
