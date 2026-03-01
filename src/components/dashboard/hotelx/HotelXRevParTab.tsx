import { monthlyData, MONTHS, DAYS_IN_MONTH, KEYS, budgetOcc, budgetAdr } from './HotelXData';
import { Bar, Radar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale } from 'chart.js';

ChartJS.register(RadialLinearScale);

const P = { g: '#C9A84C', gS: 'rgba(201,168,76,.14)', b: '#2C5F8A', bS: 'rgba(44,95,138,.11)' };

export function HotelXRevParTab() {
  const totalSold = monthlyData.reduce((s, d, i) => s + Math.round(KEYS * DAYS_IN_MONTH[i] * d.occ / 100), 0);
  const totalRoomRev = monthlyData.reduce((s, d) => s + d.rooms, 0);

  return (
    <div>
      <div className="hx-kgrid">
        <div className="hx-kc nv">
          <div className="hx-kl">Available Keys</div>
          <div className="hx-kv">350</div>
          <div className="hx-ks">Total room inventory</div>
        </div>
        <div className="hx-kc gr">
          <div className="hx-kl">Room Nights Sold (FY)</div>
          <div className="hx-kv">90,881</div>
          <div className="hx-ks">vs 85,400 budgeted · 127,750 available</div>
          <div className="hx-kt hx-up">↑ +6.4% vs budget</div>
        </div>
        <div className="hx-kc">
          <div className="hx-kl">Avg Length of Stay</div>
          <div className="hx-kv">2.6 nts</div>
          <div className="hx-ks">Leisure resort profile</div>
        </div>
        <div className="hx-kc nv">
          <div className="hx-kl">RevPAR (Annual)</div>
          <div className="hx-kv">AED 519</div>
          <div className="hx-ks">= AED 66.28M ÷ 127,750 avail. nights</div>
          <div className="hx-kt hx-up">↑ +11.5% YoY</div>
        </div>
        <div className="hx-kc bl">
          <div className="hx-kl">RevPAR Index (RGI)</div>
          <div className="hx-kv">108.2</div>
          <div className="hx-ks">vs comparable 4★ / entry-5★ set avg AED 480</div>
          <div className="hx-kt hx-up">↑ Outperforming peer set</div>
        </div>
        <div className="hx-kc">
          <div className="hx-kl">Cancellation Rate</div>
          <div className="hx-kv">9.4%</div>
          <div className="hx-ks">FY average · market avg ~11%</div>
          <div className="hx-kt hx-fl">→ Below market — positive signal</div>
        </div>
      </div>

      <div className="hx-g2">
        <div className="hx-cd">
          <div className="hx-ct">Monthly RevPAR vs ADR — FY 2025 (AED)</div>
          <div className="hx-cht">
            <Bar data={{
              labels: MONTHS,
              datasets: [
                { label: 'ADR', data: monthlyData.map(d => d.adr), backgroundColor: 'rgba(201,168,76,.6)', borderRadius: 5 },
                { label: 'RevPAR', data: monthlyData.map(d => d.revpar), backgroundColor: 'rgba(44,95,138,.6)', borderRadius: 5 },
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">Occupancy / ADR / RevPAR Profile (Radar)</div>
          <div className="hx-cht">
            <Radar data={{
              labels: MONTHS,
              datasets: [
                { label: 'Occupancy %', data: monthlyData.map(d => d.occ), borderColor: P.g, backgroundColor: P.gS, borderWidth: 2 },
                { label: 'RevPAR (÷10)', data: monthlyData.map(d => d.revpar / 10), borderColor: P.b, backgroundColor: P.bS, borderWidth: 2 },
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="hx-cd">
        <div className="hx-ct">Monthly Room Performance Detail — FY 2025</div>
        <table className="hx-tbl">
          <thead><tr>
            <th>Month</th>
            <th className="hx-r">Avail. Nights</th>
            <th className="hx-r">Nights Sold</th>
            <th className="hx-r">Occupancy</th>
            <th className="hx-r">ADR (AED)</th>
            <th className="hx-r">RevPAR (AED)</th>
            <th className="hx-r">Room Revenue (AED)</th>
            <th className="hx-r">vs Budget</th>
          </tr></thead>
          <tbody>
            {monthlyData.map((d, i) => {
              const avail = KEYS * DAYS_IN_MONTH[i];
              const sold = Math.round(avail * d.occ / 100);
              const budRev = Math.round(KEYS * DAYS_IN_MONTH[i] * budgetOcc[i] / 100 * budgetAdr[i] / 1000);
              const diff = ((d.rooms - budRev) / budRev * 100).toFixed(1);
              return (
                <tr key={i}>
                  <td className="hx-bld">{MONTHS[i]}</td>
                  <td className="hx-r">{avail.toLocaleString()}</td>
                  <td className="hx-r">{sold.toLocaleString()}</td>
                  <td className={`hx-r ${d.occ >= 70 ? '' : 'hx-neg'}`}>{d.occ}%</td>
                  <td className="hx-r hx-gv">{d.adr.toLocaleString()}</td>
                  <td className="hx-r hx-bld">{d.revpar.toLocaleString()}</td>
                  <td className="hx-r">{(d.rooms * 1000).toLocaleString()}</td>
                  <td className={`hx-r ${parseFloat(diff) >= 0 ? 'hx-pos' : 'hx-neg'}`}>{parseFloat(diff) >= 0 ? '+' : ''}{diff}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'var(--hx-gold-p)'}}>
              <td colSpan={2} className="hx-bld">TOTAL / ANNUAL AVG</td>
              <td className="hx-r hx-bld">{totalSold.toLocaleString()}</td>
              <td className="hx-r hx-bld">71.1%</td>
              <td className="hx-r hx-gv hx-bld">729</td>
              <td className="hx-r hx-bld">519</td>
              <td className="hx-r hx-bld">{(totalRoomRev * 1000).toLocaleString()}</td>
              <td className="hx-r hx-pos">+6.4%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="hx-g2e">
        <div className="hx-cd">
          <div className="hx-ct">Distribution Channel Mix</div>
          <div className="hx-ch">
            <Doughnut data={{
              labels: ['OTA (Booking, Expedia)','Direct Web / Phone','Brand Loyalty','Wholesalers','Corporate Direct','Walk-in'],
              datasets: [{ data: [34,22,19,13,9,3], backgroundColor: [P.g,'#5E8B4A',P.b,'#8B4040','#4E7A8A','#B0A898'], borderWidth: 3, borderColor: '#FFF' }]
            }} options={{ responsive: true, maintainAspectRatio: false, cutout: '58%' }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">Guest Origin — Nationality</div>
          <div className="hx-ch">
            <Doughnut data={{
              labels: ['UAE Residents','GCC','European (UK, FR, DE)','South Asian','Russian / CIS','Other'],
              datasets: [{ data: [28,21,18,14,11,8], backgroundColor: [P.g,'#4E8F6A',P.b,'#8B4040','#5E8B8A','#B0A898'], borderWidth: 3, borderColor: '#FFF' }]
            }} options={{ responsive: true, maintainAspectRatio: false, cutout: '58%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
