import { monthlyData, MONTHS, plData } from './HotelXData';
import { Bar } from 'react-chartjs-2';

const P = { g: '#C9A84C', gr: '#2A7A54', r: '#A83232' };

export function HotelXPLTab() {
  return (
    <div>
      <div className="hx-kgrid">
        <div className="hx-kc">
          <div className="hx-kl">Total Revenue</div>
          <div className="hx-kv">AED 95.4M</div>
          <div className="hx-ks">FY 2025 consolidated · all departments</div>
        </div>
        <div className="hx-kc">
          <div className="hx-kl">Rooms Revenue</div>
          <div className="hx-kv">AED 66.3M</div>
          <div className="hx-ks">69.5% of total</div>
        </div>
        <div className="hx-kc gr">
          <div className="hx-kl">F&B Revenue</div>
          <div className="hx-kv">AED 19.6M</div>
          <div className="hx-ks">20.5% of total</div>
        </div>
        <div className="hx-kc bl">
          <div className="hx-kl">Spa & Ancillary</div>
          <div className="hx-kv">AED 9.5M</div>
          <div className="hx-ks">10.0% of total</div>
        </div>
        <div className="hx-kc rd">
          <div className="hx-kl">Total COGS</div>
          <div className="hx-kv">AED 17.6M</div>
          <div className="hx-ks">18.5% of revenue</div>
        </div>
        <div className="hx-kc gr">
          <div className="hx-kl">GOP</div>
          <div className="hx-kv">AED 30.1M</div>
          <div className="hx-ks">Margin 31.6%</div>
        </div>
        <div className="hx-kc nv">
          <div className="hx-kl">EBITDA</div>
          <div className="hx-kv">AED 19.4M</div>
          <div className="hx-ks">Margin 20.3%</div>
        </div>
        <div className="hx-kc gr">
          <div className="hx-kl">Net Profit (post-tax)</div>
          <div className="hx-kv">AED 14.4M</div>
          <div className="hx-ks">Net margin 15.1%</div>
        </div>
      </div>

      <div className="hx-g2">
        <div className="hx-cd">
          <div className="hx-ct">P&L Waterfall — Revenue to Net Profit (AED M)</div>
          <div className="hx-cht">
            <Bar data={{
              labels: ['Revenue','-COGS','-Payroll','-Utilities','-S&M','-Admin','-Maint.','= GOP','-Mgmt Fee','-Owner','= EBITDA','-D&A','-Corp Tax','= Net Profit'],
              datasets: [{
                data: [95.4,17.6,28.2,5.8,4.0,6.5,3.1,30.1,6.2,4.6,19.4,3.5,1.4,14.4],
                backgroundColor: ['rgba(201,168,76,.85)','rgba(168,50,50,.65)','rgba(168,50,50,.65)','rgba(168,50,50,.65)',
                  'rgba(168,50,50,.65)','rgba(168,50,50,.65)','rgba(168,50,50,.65)','rgba(201,168,76,.85)',
                  'rgba(168,50,50,.65)','rgba(168,50,50,.65)','rgba(201,168,76,.85)','rgba(168,50,50,.65)',
                  'rgba(168,50,50,.65)','rgba(42,122,84,.85)'],
                borderRadius: 5,
              }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">Monthly Net Profit — FY 2025 (AED '000)</div>
          <div className="hx-cht">
            <Bar data={{
              labels: MONTHS,
              datasets: [{
                label: "Net Profit",
                data: monthlyData.map(d => d.net),
                backgroundColor: monthlyData.map(d => d.net >= 0 ? 'rgba(42,122,84,.7)' : 'rgba(168,50,50,.65)'),
                borderRadius: 5,
              }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      <div className="hx-cd">
        <div className="hx-ct">Income Statement — FY 2025 (AED)</div>
        <table className="hx-tbl">
          <thead><tr>
            <th style={{width:'36%'}}>Line Item</th>
            <th className="hx-r">Amount (AED)</th>
            <th className="hx-r">% Revenue</th>
            <th className="hx-r">vs FY 2024</th>
            <th>Note</th>
          </tr></thead>
          <tbody>
            {plData.map((d, i) => {
              if (d.h) return (
                <tr key={i}>
                  <td colSpan={5} style={{padding:'.85rem 1rem .28rem',fontSize:'.67rem',letterSpacing:'.1em',textTransform:'uppercase',color:'var(--hx-gold)',fontWeight:700,borderBottom:'2px solid var(--hx-border-dk)'}}>
                    {d.h}
                  </td>
                </tr>
              );
              const isTotal = !!d.t;
              const label = d.t || d.l || '';
              const neg = (d.v || 0) < 0;
              const abs = Math.abs(d.v || 0).toLocaleString('en-US');
              const pctStr = d.pct != null ? `${d.pct > 0 ? '+' : ''}${d.pct.toFixed(1)}%` : '--';
              const yoyStr = d.yoy != null ? `${d.yoy > 0 ? '+' : ''}${d.yoy.toFixed(1)}%` : '--';
              return (
                <tr key={i} style={isTotal ? {background:'var(--hx-gold-p)'} : {}}>
                  <td style={{paddingLeft: isTotal ? '1rem' : '2rem'}}>{isTotal ? <strong>{label}</strong> : label}</td>
                  <td className={`hx-r ${neg ? 'hx-neg' : 'hx-gv'}`} style={{fontWeight: isTotal ? 600 : 400}}>{neg ? '(' : ''}{abs}{neg ? ')' : ''}</td>
                  <td className={`hx-r ${(d.pct || 0) < 0 ? 'hx-mut' : ''}`}>{pctStr}</td>
                  <td className={`hx-r ${(d.yoy || 0) > 0 ? 'hx-pos' : (d.yoy || 0) < 0 ? 'hx-neg' : 'hx-mut'}`}>{yoyStr}</td>
                  <td className="hx-mut" style={{fontSize:'.75rem'}}>{d.n || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
