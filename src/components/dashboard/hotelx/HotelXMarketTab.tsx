import { Bar, Doughnut, Line } from 'react-chartjs-2';

const P = { g: '#C9A84C', gS: 'rgba(201,168,76,.14)', b: '#2C5F8A', r: '#A83232', gr: '#2A7A54' };

export function HotelXMarketTab() {
  return (
    <div>
      {/* UAE MACRO */}
      <div className="hx-stitle">UAE Hospitality Macro — 2025 Overview</div>

      <div className="hx-mc-intro">
        The UAE has consolidated its position as the Middle East's premier hospitality market in 2025.
        With <strong>213,928 hotel rooms</strong> across the federation and revenues surpassing <strong>AED 89 billion (~$24.2B)</strong>,
        the sector is operating at record levels. National occupancy reached <strong>79.3%</strong> YTD through October 2025,
        while RevPAR and ADR both grew <strong>+11.9% YoY</strong>. Only <strong>+0.6% net new supply</strong> was added year-to-date
        across the GCC — giving existing operators unprecedented pricing power.
      </div>

      <div className="hx-mc-kpi-row">
        {[
          {v:'213,928',l:'UAE hotel rooms (2025)'},
          {v:'79.3%',l:'UAE avg. occupancy YTD Oct 2025'},
          {v:'+11.9%',l:'RevPAR & ADR growth YoY 2025'},
          {v:'USD 147',l:'UAE trailing RevPAR mid-2025'},
          {v:'AED 32.2B',l:'Tourism investment 2024'},
          {v:'235,674',l:'Projected rooms by 2030'},
        ].map((kpi, i) => (
          <div key={i} className="hx-mc-kpi">
            <div className="hx-mc-kv">{kpi.v}</div>
            <div className="hx-mc-kl">{kpi.l}</div>
          </div>
        ))}
      </div>

      <div className="hx-g3">
        <div className="hx-cd">
          <div className="hx-ct">UAE RevPAR by Emirate — Trailing 12M (USD)</div>
          <div className="hx-ch">
            <Bar data={{
              labels: ['Dubai','Abu Dhabi','Ras Al Khaimah','UAE Avg','Sharjah','Ajman'],
              datasets: [{ data: [154,152,141,147,85,70], backgroundColor: ['rgba(44,95,138,.75)','rgba(44,95,138,.55)','rgba(201,168,76,.85)','rgba(176,168,152,.6)','rgba(176,168,152,.45)','rgba(176,168,152,.35)'], borderRadius: 6 }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
          <p className="hx-sn">Source: CoStar / mmcginvest.com · July 2025</p>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">UAE Segment Mix — Existing Rooms (2025)</div>
          <div className="hx-ch">
            <Doughnut data={{
              labels: ['Upscale (26%)','Luxury (22%)','Upper Upscale (21%)','Midscale (18%)','Economy (13%)'],
              datasets: [{ data: [26,22,21,18,13], backgroundColor: [P.g,'#4E8F6A',P.b,'#9B7040','#B0A898'], borderWidth: 3, borderColor: '#FFF' }]
            }} options={{ responsive: true, maintainAspectRatio: false, cutout: '55%' }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">UAE RevPAR Recovery 2015–2025 (USD)</div>
          <div className="hx-ch">
            <Line data={{
              labels: ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025e'],
              datasets: [{ label: 'UAE RevPAR (USD)', data: [140.8,128,120,118,116,69,99,120,132,138,147], borderColor: P.g, backgroundColor: P.gS, fill: true, borderWidth: 2.5, tension: .4, pointRadius: 5, pointBackgroundColor: P.g }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      <div className="hx-mc-section-bar">UAE MARKET CONTEXT — COMPETITIVE POSITIONING</div>

      <div className="hx-g2e">
        <div className="hx-cd">
          <div className="hx-ct">UAE Emirate Comparison — Key Metrics (2025)</div>
          <table className="hx-tbl">
            <thead><tr><th>Emirate</th><th className="hx-r">RevPAR (USD)</th><th className="hx-r">ADR (USD)</th><th className="hx-r">Occupancy</th><th className="hx-r">Growth YoY</th></tr></thead>
            <tbody>
              <tr><td><strong>Dubai</strong></td><td className="hx-r hx-gv">$154</td><td className="hx-r">$193</td><td className="hx-r">79.6%</td><td className="hx-r hx-pos">+4.2%</td></tr>
              <tr><td><strong>Abu Dhabi</strong></td><td className="hx-r hx-gv">~$152</td><td className="hx-r">~$185</td><td className="hx-r">~78%</td><td className="hx-r hx-pos">+24.0%</td></tr>
              <tr><td><strong>Ras Al Khaimah</strong></td><td className="hx-r" style={{color:'var(--hx-gold)'}}>~$141</td><td className="hx-r" style={{color:'var(--hx-gold)'}}>AED 729+</td><td className="hx-r" style={{color:'var(--hx-gold)'}}>71.1%</td><td className="hx-r hx-pos">+10.0%</td></tr>
              <tr><td><strong>UAE Provincial Avg</strong></td><td className="hx-r">$96</td><td className="hx-r">$130</td><td className="hx-r">~73%</td><td className="hx-r hx-pos">+9.1%</td></tr>
              <tr><td><strong>Ajman</strong></td><td className="hx-r">~$70</td><td className="hx-r">~$90</td><td className="hx-r">~76%</td><td className="hx-r hx-pos">+7–9%</td></tr>
            </tbody>
          </table>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">Investment Pipeline — UAE Hotel Rooms Under Construction</div>
          <div className="hx-ch">
            <Bar data={{
              labels: ['Dubai','RAK + Northern','Abu Dhabi','Other Emirates'],
              datasets: [{ label: 'Rooms under construction', data: [11100,3200,830,863], backgroundColor: ['rgba(44,95,138,.7)','rgba(201,168,76,.85)','rgba(42,122,84,.65)','rgba(176,168,152,.6)'], borderRadius: 6 }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      {/* RAK MACRO */}
      <div className="hx-stitle">Ras Al Khaimah — Emirate Overview & Economic Context</div>

      <div className="hx-mc-intro">
        Ras Al Khaimah is the UAE's northernmost emirate and its fastest-growing economy. With a
        <strong> GDP growth projection of 4.2% annually through 2027</strong> (S&P Global),
        RAK has been upgraded to <strong>A/A-1</strong> by S&P and <strong>A+</strong> by Fitch in 2024.
        The emirate welcomed <strong>1.28 million overnight visitors in 2024</strong> (+5.1% YoY).
        RAKTDA targets <strong>3.5 million visitors by 2030</strong>.
      </div>

      <div className="hx-mc-kpi-row">
        {[
          {v:'1.28M',l:'Overnight visitors 2024 (record)'},
          {v:'3.5M',l:'Visitor target by 2030'},
          {v:'4.2%',l:'GDP growth p.a. to 2027 (S&P)'},
          {v:'A/A-1',l:'S&P sovereign credit rating 2024'},
          {v:'$5.1B',l:'Wynn Al Marjan — total project value'},
          {v:'30,000+',l:'Companies in RAKEZ free zone'},
        ].map((kpi, i) => (
          <div key={i} className="hx-mc-kpi">
            <div className="hx-mc-kv">{kpi.v}</div>
            <div className="hx-mc-kl">{kpi.l}</div>
          </div>
        ))}
      </div>

      <div className="hx-g2e">
        <div className="hx-cd">
          <div className="hx-ct">RAK Economy — GDP Composition (est. 2024)</div>
          <div className="hx-ch">
            <Doughnut data={{
              labels: ['Manufacturing (22%)','Wholesale & Trade (18%)','Construction & RE (15%)','Tourism & Hospitality (4%)','Other Services (41%)'],
              datasets: [{ data: [22,18,15,4,41], backgroundColor: [P.b,'#4E8F6A','#9B7040',P.g,'#B0A898'], borderWidth: 3, borderColor: '#FFF' }]
            }} options={{ responsive: true, maintainAspectRatio: false, cutout: '52%' }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">RAK Visitor Arrivals — Actual & Target (000s)</div>
          <div className="hx-ch">
            <Bar data={{
              labels: ['2020','2021','2022','2023','2024','2025e','2026e','2027e','2030 target'],
              datasets: [{ label: 'Visitors (000s)', data: [650,780,1050,1220,1280,1350,1600,2200,3500], backgroundColor: 'rgba(201,168,76,.65)', borderRadius: 5 }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      {/* RAK Hotel Market */}
      <div className="hx-stitle">RAK Hotel Market — Detailed Analysis</div>

      <div className="hx-mc-kpi-row">
        {[
          {v:'55',l:'Operational hotels (2025)'},
          {v:'~9,000',l:'Keys in operation (2025)'},
          {v:'AED 592',l:'Market ADR FY 2024'},
          {v:'71.2%',l:'Market occupancy FY 2024'},
          {v:'AED 822M',l:'Hospitality revenues 2024'},
          {v:'+9,500',l:'Keys in pipeline to 2030'},
        ].map((kpi, i) => (
          <div key={i} className="hx-mc-kpi">
            <div className="hx-mc-kv">{kpi.v}</div>
            <div className="hx-mc-kl">{kpi.l}</div>
          </div>
        ))}
      </div>

      <div className="hx-g2">
        <div className="hx-cd">
          <div className="hx-ct">RAK Hotel Market — ADR & Occupancy 2022–2026</div>
          <div className="hx-cht">
            <Bar data={{
              labels: ['FY 2022','FY 2023','FY 2024','FY 2025 (Hotel X)','FY 2026 (proj.)'],
              datasets: [
                { label: 'Market ADR (AED)', data: [480,530,592,null,640], backgroundColor: 'rgba(176,168,152,.5)', borderRadius: 4 },
                { label: 'Hotel X ADR (AED)', data: [null,null,null,729,790], backgroundColor: 'rgba(201,168,76,.8)', borderRadius: 4 },
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">RAK Hotel Supply Pipeline — Keys by Category (to 2030)</div>
          <div className="hx-cht">
            <Bar data={{
              labels: ['5★ Ultra-Luxury','5★ Luxury','4★ Upper Upscale','3★ Mid-Scale','Eco / Boutique'],
              datasets: [{ label: 'Keys in Pipeline', data: [2800,4900,1100,500,200], backgroundColor: ['rgba(201,168,76,.85)','rgba(44,95,138,.7)','rgba(42,122,84,.6)','rgba(176,168,152,.55)','rgba(78,142,106,.5)'], borderRadius: 6 }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      <div className="hx-g3">
        <div className="hx-cd">
          <div className="hx-ct">RAK — Key Pipeline Projects (2025–2030)</div>
          <div className="hx-ir"><div className="hx-irl">🌟 Wynn Al Marjan Island</div><div className="hx-irv"><span className="hx-bdg hx-bnv">2027 · 1,542 rooms · $5.1B</span></div></div>
          <div className="hx-ir"><div className="hx-irl">🌟 Four Seasons Mina</div><div className="hx-irv"><span className="hx-bdg hx-bg">2026 · 150 rooms</span></div></div>
          <div className="hx-ir"><div className="hx-irl">🌟 Earth Shore Marjan</div><div className="hx-irv"><span className="hx-bdg hx-bgr">2025 · 265 rooms</span></div></div>
          <div className="hx-ir"><div className="hx-irl">🌟 Saij (Jebel Jais)</div><div className="hx-irv"><span className="hx-bdg hx-bgr">2025 · 70 cabins</span></div></div>
          <div className="hx-ir"><div className="hx-irl">+ 20 additional hotels</div><div className="hx-irv" style={{fontSize:'.8rem'}}>planned 2025–2027</div></div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">RAK Market Peak — Eid al-Fitr 31 March 2025</div>
          <div className="hx-ir"><div className="hx-irl">Peak Night ADR</div><div className="hx-irv hx-gv">AED 1,184.36</div></div>
          <div className="hx-ir"><div className="hx-irl">Peak Night RevPAR</div><div className="hx-irv hx-gv">AED 1,100.43</div></div>
          <div className="hx-ir"><div className="hx-irl">Peak Night Occupancy</div><div className="hx-irv">92.9%</div></div>
          <div className="hx-ir"><div className="hx-irl">Annual ADR (Hotel X, weighted)</div><div className="hx-irv" style={{color:'var(--hx-gold)'}}>AED 729</div></div>
          <div className="hx-ir"><div className="hx-irl">Hotel X ADR premium</div><div className="hx-irv hx-pos">+23% vs market</div></div>
        </div>
        <div className="hx-cd">
          <div className="hx-ct">RAK Market — Demand Profile</div>
          <div className="hx-ir"><div className="hx-irl">Primary demand driver</div><div className="hx-irv">Leisure / beachfront</div></div>
          <div className="hx-ir"><div className="hx-irl">Growing segments</div><div className="hx-irv">MICE +36% · Weddings</div></div>
          <div className="hx-ir"><div className="hx-irl">International share</div><div className="hx-irv">50% of arrivals</div></div>
          <div className="hx-ir"><div className="hx-irl">Key source markets</div><div className="hx-irv" style={{fontSize:'.78rem',textAlign:'right'}}>GCC, UK, Russia/CIS, India, Germany</div></div>
          <div className="hx-ir"><div className="hx-irl">Future diversifier</div><div className="hx-irv">Wynn gaming clientele (2027+)</div></div>
        </div>
      </div>

      {/* ANALYST COMMENTARY */}
      <div className="hx-mc-section-bar">ANALYST COMMENTARY — HOTEL X POSITIONING WITHIN THE RAK MARKET</div>

      <div className="hx-mc-block">
        <div className="hx-mc-block-title">📊 Pricing Calibration — How Hotel X Compares to the Market</div>
        <div className="hx-mc-block-body">
          The RAK hotel market in 2024 recorded a market-wide ADR of <strong>AED 592</strong> at an occupancy of 71.2%.
          Hotel X operates at a <strong>weighted ADR of AED 729</strong> — a <strong>23% premium</strong> over the all-segment
          market average, consistent with the luxury tier.
        </div>
      </div>

      <div className="hx-mc-block">
        <div className="hx-mc-block-title">🔭 Outlook — Wynn Effect & Market Transformation (2026–2030)</div>
        <div className="hx-mc-block-body">
          The <strong>Wynn Al Marjan Island</strong> ($5.1B, 1,542 rooms, opening 2027) is the single most significant
          demand catalyst in RAK's history. For Hotel X, Wynn's arrival creates a dual dynamic:
          <strong> opportunity</strong> through rising premium demand and <strong>competitive pressure</strong> from
          its 1,542-room supply addition (~17% of current RAK inventory).
          RAKTDA's target of <strong>3.5 million visitors by 2030</strong> implies a 174% increase over six years.
        </div>
      </div>

      <div className="hx-mc-block">
        <div className="hx-mc-block-title">⚠️ Key Risks to Monitor</div>
        <div className="hx-mc-block-body" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
          <div>
            <strong style={{color:'var(--hx-red)'}}>Supply Oversaturation (2027–2030)</strong><br/>
            +9,500 keys in pipeline represents ~106% of current 9,000-key inventory.
            <br/><br/>
            <strong style={{color:'var(--hx-red)'}}>Summer Trough Structural Issue</strong><br/>
            Jun–Aug occupancy of 42–48% creates significant cash flow seasonality.
          </div>
          <div>
            <strong style={{color:'var(--hx-red)'}}>Geopolitical & Regional Risk</strong><br/>
            RAK's 50% international visitor base is exposed to regional instability.
            <br/><br/>
            <strong style={{color:'var(--hx-red)'}}>Infrastructure Gap</strong><br/>
            RAK is "a little behind in real estate, schools, and hospitals" relative to its growth pace.
          </div>
        </div>
      </div>

      <div className="hx-src-box">
        <div className="hx-src-title">Sources & Data References</div>
        <div className="hx-src-grid">
          <div><strong>CoStar / STR</strong> — UAE & RAK hotel performance data (April 2025)</div>
          <div><strong>Real Estate X / HOTSTATS</strong> — RAK FY2024 Market Update</div>
          <div><strong>Knight Frank MENA</strong> — UAE Hospitality Review Autumn 2025</div>
          <div><strong>mmcginvest.com</strong> — UAE Hospitality: Performance & Outlook 2015–2029</div>
          <div><strong>Economy Middle East</strong> — UAE hotel revenues $24.2B (Oct 2025)</div>
          <div><strong>S&P Global / AGBI</strong> — RAK sovereign credit upgrade A/A-1</div>
          <div><strong>Savills Middle East</strong> — RAK residential & hospitality report (May 2025)</div>
          <div><strong>Travel & Tour World</strong> — RAK hotel sector surge 2025</div>
          <div><strong>The National</strong> — Wynn Al Marjan Island (May 2025)</div>
          <div><strong>RAKTDA / CEO-Insight</strong> — Strategic tourism targets (Apr 2025)</div>
        </div>
      </div>
    </div>
  );
}
