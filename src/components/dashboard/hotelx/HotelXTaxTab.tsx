import { Bar } from 'react-chartjs-2';

const P = { g: '#C9A84C', gr: '#2A7A54', r: '#A83232', b: '#2C5F8A' };

export function HotelXTaxTab() {
  return (
    <div>
      <div className="hx-kgrid">
        <div className="hx-kc bl">
          <div className="hx-kl">UAE VAT Rate</div>
          <div className="hx-kv">5%</div>
          <div className="hx-ks">On taxable supplies — registered with FTA</div>
        </div>
        <div className="hx-kc">
          <div className="hx-kl">Tourism Dirham (RAK)</div>
          <div className="hx-kv">AED 15</div>
          <div className="hx-ks">Per room per night · 90,881 nights = AED 1.36M</div>
        </div>
        <div className="hx-kc nv">
          <div className="hx-kl">Municipality Fee</div>
          <div className="hx-kv">4%</div>
          <div className="hx-ks">On room revenue · 4% × AED 66.3M = AED 2.65M</div>
        </div>
        <div className="hx-kc">
          <div className="hx-kl">Service Charge</div>
          <div className="hx-kv">10%</div>
          <div className="hx-ks">On F&B & room charges · distributed to staff</div>
        </div>
        <div className="hx-kc gr">
          <div className="hx-kl">Corporate Tax (UAE)</div>
          <div className="hx-kv">9%</div>
          <div className="hx-ks">Effective FY 2023+ on taxable income</div>
        </div>
        <div className="hx-kc bl">
          <div className="hx-kl">Effective CT Rate</div>
          <div className="hx-kv">9.0%</div>
          <div className="hx-ks">On adjusted taxable income AED 15.99M</div>
        </div>
      </div>

      <div className="hx-g2e">
        <div>
          <div className="hx-txb">
            <div className="hx-txh">VAT Position — FY 2025</div>
            <div className="hx-txl"><span>Output VAT — Rooms (5% × AED 66.28M)</span><span style={{color:'var(--hx-red)'}}>+ AED 3,314,000</span></div>
            <div className="hx-txl"><span>Output VAT — F&B (5% × AED 19.55M)</span><span style={{color:'var(--hx-red)'}}>+ AED 977,500</span></div>
            <div className="hx-txl"><span>Output VAT — Spa & Ancillary (5% × AED 9.54M)</span><span style={{color:'var(--hx-red)'}}>+ AED 477,000</span></div>
            <div className="hx-txl hx-bld"><span>Total Output VAT Collected</span><span>AED 4,768,500</span></div>
            <div className="hx-txl hx-txs"><span>Input Tax Credit (purchases, utilities, maintenance)</span><span style={{color:'var(--hx-green)'}}>− AED 1,311,000</span></div>
            <div className="hx-txl hx-txt"><span>NET VAT PAYABLE TO FTA</span><span>AED 3,457,500</span></div>
          </div>
          <div className="hx-txb">
            <div className="hx-txh">Tourism & Municipality Levies</div>
            <div className="hx-txl"><span>Room Nights Sold (FY 2025)</span><span>90,881 nights</span></div>
            <div className="hx-txl"><span>Tourism Dirham @ AED 15 / night</span><span>AED 1,363,215</span></div>
            <div className="hx-txl"><span>Municipality Fee (4% × AED 66.28M room rev.)</span><span>AED 2,651,200</span></div>
            <div className="hx-txl"><span>Service Charge (10% × AED 19.55M F&B rev.)</span><span>AED 1,955,000</span></div>
            <div className="hx-txl hx-txt"><span>TOTAL LEVIES & CHARGES</span><span>AED 5,969,415</span></div>
          </div>
        </div>
        <div>
          <div className="hx-txb">
            <div className="hx-txh">Corporate Tax Calculation — FY 2025</div>
            <div className="hx-txl"><span>Accounting Profit (EBIT)</span><span>AED 15,832,000</span></div>
            <div className="hx-txl hx-txs"><span>+ Non-deductible expenses</span><span>280,000</span></div>
            <div className="hx-txl hx-txs"><span>− Exempt income</span><span>(120,000)</span></div>
            <div className="hx-txl hx-bld"><span>Taxable Income</span><span>AED 15,992,000</span></div>
            <div className="hx-txl hx-txs"><span>UAE Corporate Tax Rate</span><span>9%</span></div>
            <div className="hx-txl hx-txt"><span>CORPORATE TAX PAYABLE</span><span>AED 1,439,280</span></div>
            <div className="hx-txl" style={{marginTop:'.5rem'}}><span>Net Profit After Tax</span><span style={{color:'var(--hx-green)',fontWeight:700}}>AED 14,392,720</span></div>
            <p className="hx-sn" style={{marginTop:'.5rem'}}>CT = AED 15,992,000 × 9% = AED 1,439,280. Net margin = 15.1%</p>
          </div>
          <div className="hx-txb">
            <div className="hx-txh">Sample Guest Invoice — 1 Room Night (avg. rate)</div>
            <div className="hx-txl"><span>Published Room Rate (avg. ADR)</span><span>AED 729.00</span></div>
            <div className="hx-txl hx-txs"><span>+ VAT 5%</span><span>AED 36.45</span></div>
            <div className="hx-txl hx-txs"><span>+ Tourism Dirham (RAK fixed)</span><span>AED 15.00</span></div>
            <div className="hx-txl hx-txs"><span>+ Municipality Fee 4%</span><span>AED 29.16</span></div>
            <div className="hx-txl hx-txt"><span>TOTAL GUEST CHARGE / NIGHT</span><span>AED 809.61</span></div>
          </div>
        </div>
      </div>

      <div className="hx-cd">
        <div className="hx-ct">Total Tax & Levy Burden — FY 2025 (AED '000)</div>
        <div className="hx-ch">
          <Bar data={{
            labels: ['Net Profit (retained)','Corporate Tax 9%','VAT Net Payable','Municipality Fee 4%','Tourism Dirham','Service Charge (F&B)'],
            datasets: [{ data: [14393,1439,3457,2651,1363,1955], backgroundColor: [P.gr,P.r,P.b,P.g,P.gr,'#B0A898'], borderRadius: 5 }]
          }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>
        <p className="hx-sn">Net Profit AED 14,393K after all taxes and levies. Total cash outflows to authorities: AED 10,826K.</p>
      </div>
    </div>
  );
}
