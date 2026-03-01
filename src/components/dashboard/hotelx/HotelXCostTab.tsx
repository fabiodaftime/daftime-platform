import { monthlyData, MONTHS, costCategories, costValues, payrollDepts, payrollValues } from './HotelXData';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

const P = { g: '#C9A84C', gS: 'rgba(201,168,76,.14)', r: '#A83232', rS: 'rgba(168,50,50,.11)', b: '#2C5F8A', gr: '#2A7A54' };
const CL = [P.g, '#A83232', '#8B6914', P.b, P.gr, '#4E7A8A', '#9B7040', '#B0A898'];

export function HotelXCostTab() {
  return (
    <div>
      <div className="hx-kgrid">
        <div className="hx-kc">
          <div className="hx-kl">Total Operating Costs</div>
          <div className="hx-kv">AED 65.2M</div>
          <div className="hx-ks">COGS + all operating expenses</div>
        </div>
        <div className="hx-kc rd">
          <div className="hx-kl">Payroll (incl. benefits)</div>
          <div className="hx-kv">29.6%</div>
          <div className="hx-ks">of total revenue · AED 28.2M</div>
          <div className="hx-kt hx-fl">→ Benchmark: 28–32%</div>
        </div>
        <div className="hx-kc gr">
          <div className="hx-kl">F&B Cost Ratio</div>
          <div className="hx-kv">28.4%</div>
          <div className="hx-ks">F&B COGS ÷ F&B Revenue</div>
          <div className="hx-kt hx-up">↑ Below 30–32% target</div>
        </div>
        <div className="hx-kc">
          <div className="hx-kl">Energy & Utilities</div>
          <div className="hx-kv">6.1%</div>
          <div className="hx-ks">of revenue · AED 5.8M</div>
        </div>
        <div className="hx-kc nv">
          <div className="hx-kl">Brand Management Fee</div>
          <div className="hx-kv">6.5%</div>
          <div className="hx-ks">Base 3% + Incentive 3.5%</div>
        </div>
        <div className="hx-kc bl">
          <div className="hx-kl">Maintenance & CapEx</div>
          <div className="hx-kv">3.2%</div>
          <div className="hx-ks">FF&E reserve + repairs · AED 3.1M</div>
        </div>
      </div>

      <div className="hx-g2">
        <div className="hx-cd">
          <div className="hx-ct">Cost Breakdown — Top Categories (AED '000)</div>
          <div className="hx-cht">
            <Bar data={{
              labels: costCategories,
              datasets: [{ data: costValues, backgroundColor: CL, borderRadius: 5 }]
            }} options={{ indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">Operating Cost Distribution</div>
          <div className="hx-cht">
            <Doughnut data={{
              labels: costCategories,
              datasets: [{ data: costValues, backgroundColor: CL, borderWidth: 3, borderColor: '#FFF' }]
            }} options={{ responsive: true, maintainAspectRatio: false, cutout: '55%' }} />
          </div>
        </div>
      </div>

      <div className="hx-g2e">
        <div className="hx-cd">
          <div className="hx-ct">Payroll by Department (AED '000)</div>
          <div className="hx-ch">
            <Bar data={{
              labels: payrollDepts,
              datasets: [{ data: payrollValues, backgroundColor: 'rgba(201,168,76,.65)', borderRadius: 4 }]
            }} options={{ indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">Revenue vs Total Costs — Monthly (AED '000)</div>
          <div className="hx-ch">
            <Line data={{
              labels: MONTHS,
              datasets: [
                { label: 'Total Revenue', data: monthlyData.map(d => d.tot), borderColor: P.g, backgroundColor: P.gS, fill: true, borderWidth: 2.5, tension: .4, pointRadius: 4, pointBackgroundColor: P.g },
                { label: 'Total Costs', data: monthlyData.map(d => d.costs), borderColor: P.r, backgroundColor: P.rS, fill: true, borderWidth: 2, tension: .4, pointRadius: 3, borderDash: [4, 3] },
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="hx-cd">
        <div className="hx-ct">Key Cost Ratios — Actual vs Industry Benchmark</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2.5rem',marginTop:'.5rem'}}>
          <div>
            {[
              {label:'Payroll / Revenue',value:29.6,cls:'r'},
              {label:'F&B Cost / F&B Revenue',value:28.4,cls:'g'},
              {label:'Rooms Dept. Cost / Room Rev.',value:22.1,cls:'g'},
              {label:'Utilities / Revenue',value:6.1,cls:'b'},
            ].map((r, i) => (
              <div key={i} className="hx-prr">
                <div className="hx-prl"><span>{r.label}</span><span>{r.value}%</span></div>
                <div className="hx-prt"><div className={`hx-prf ${r.cls}`} style={{width:`${r.value}%`}} /></div>
              </div>
            ))}
          </div>
          <div>
            {[
              {label:'Sales & Marketing / Revenue',value:4.2,cls:'b'},
              {label:'Maintenance & CapEx / Revenue',value:3.2,cls:''},
              {label:'Admin & General / Revenue',value:6.8,cls:''},
              {label:'Brand Mgmt. Fee / Revenue',value:6.5,cls:'r'},
            ].map((r, i) => (
              <div key={i} className="hx-prr">
                <div className="hx-prl"><span>{r.label}</span><span>{r.value}%</span></div>
                <div className="hx-prt"><div className={`hx-prf ${r.cls}`} style={{width:`${r.value}%`}} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
