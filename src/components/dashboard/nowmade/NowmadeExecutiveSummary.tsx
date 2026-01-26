import { kpis, formatAED, formatUSD, EXCHANGE_RATE } from './NowmadeData';

export function NowmadeExecutiveSummary() {
  return (
    <div className="nowmade-exec-summary">
      <div className="nowmade-insight-card full-width">
        <h3><span>🎯</span> Investment Thesis</h3>
        <p>
          <strong>Nowmade (Cosy Hills JBR)</strong> is a hostel property in Dubai's prestigious JBR area 
          delivering strong financial performance in 2025. The property achieved an{' '}
          <strong>annual EBITDA of AED 394,159 (USD 107,335)</strong> with a blended margin of 33.3%.
        </p>
        <div className="nowmade-highlight-stat">
          <div className="stat-value">+138%</div>
          <div className="stat-label">EBITDA growth from Jan (AED 41K) to Nov 2025 (AED 98K)</div>
        </div>
      </div>

      <div className="nowmade-insight-card">
        <h3><span>📈</span> Key Strengths</h3>
        <ul>
          <li><span className="nowmade-tag strength">STRENGTH</span> Exceptional Q4 performance: Nov reached AED 164K revenue with 59.7% margin</li>
          <li><span className="nowmade-tag strength">STRENGTH</span> Strong occupancy: averaged 80.6% with peaks at 95.7% (Nov)</li>
          <li><span className="nowmade-tag strength">STRENGTH</span> ADR recovery in Q4: reached AED 157 in Dec vs AED 76 in Jul</li>
          <li><span className="nowmade-tag strength">STRENGTH</span> Stable capacity of 1,080 beds/month with proven demand</li>
          <li><span className="nowmade-tag strength">STRENGTH</span> 9 profitable months out of 12</li>
        </ul>
      </div>

      <div className="nowmade-insight-card">
        <h3><span>⚠️</span> Risks & Considerations</h3>
        <ul>
          <li><span className="nowmade-tag risk">RISK</span> Summer losses: Jun-Aug showed negative EBITDA (AED -16.8K combined)</li>
          <li><span className="nowmade-tag risk">RISK</span> March underperformance: only 0.6% margin during Ramadan</li>
          <li><span className="nowmade-tag risk">RISK</span> ADR volatility: ranged from AED 76 (Jul) to AED 157 (Dec)</li>
          <li><span className="nowmade-tag opportunity">OPPORTUNITY</span> December margin (40%) lower than Nov (60%) despite higher ADR</li>
        </ul>
      </div>

      <div className="nowmade-insight-card">
        <h3><span>🔄</span> Seasonality Pattern</h3>
        <p>Clear Dubai hospitality seasonality with strong recovery in Q4:</p>
        <ul>
          <li><strong>Peak Season (Sep–Dec):</strong> 32-60% margins, occupancy 77-96%</li>
          <li><strong>Shoulder Season (Jan–May):</strong> 0.6-39% margins, variable performance</li>
          <li><strong>Low Season (Jun–Aug):</strong> Negative margins, 60-65% occupancy</li>
        </ul>
        <div className="nowmade-highlight-stat">
          <div className="stat-value">3.7x</div>
          <div className="stat-label">Peak-to-trough revenue ratio (Nov vs June)</div>
        </div>
      </div>

      <div className="nowmade-insight-card">
        <h3><span>💡</span> Growth Opportunities</h3>
        <ul>
          <li><span className="nowmade-tag opportunity">OPPORTUNITY</span> Summer optimization: reduce losses through packages/events</li>
          <li><span className="nowmade-tag opportunity">OPPORTUNITY</span> Services revenue strong: AED 4,140 in Nov (2.5% of revenue)</li>
          <li><span className="nowmade-tag opportunity">OPPORTUNITY</span> ADR optimization: Dec ADR at AED 157 shows pricing power</li>
          <li><span className="nowmade-tag opportunity">OPPORTUNITY</span> Cost control: Operating expenses reduced significantly in H2</li>
        </ul>
      </div>

      <div className="nowmade-insight-card">
        <h3><span>📊</span> 2025 Financial Summary</h3>
        <p>Full year 2025 actuals demonstrate strong operational performance:</p>
        <ul>
          <li><strong>Annual Revenue:</strong> AED 1.18M (USD 322K)</li>
          <li><strong>Annual EBITDA:</strong> AED 394K (USD 107K)</li>
          <li><strong>Total Expenses:</strong> AED 789K (USD 215K)</li>
          <li><strong>Blended Margin:</strong> 33.3%</li>
        </ul>
        <div className="nowmade-highlight-stat">
          <div className="stat-value">33.3%</div>
          <div className="stat-label">Full Year 2025 EBITDA Margin</div>
        </div>
      </div>

      <div className="nowmade-insight-card full-width">
        <h3><span>✅</span> Investor Summary</h3>
        <p>
          Nowmade (Cosy Hills JBR) delivered <strong>solid 2025 performance</strong> with demonstrated 
          ability to generate strong profits during peak season that more than offset summer losses.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="nowmade-highlight-stat">
            <div className="stat-value">AED 1.18M</div>
            <div className="stat-label">2025 Annual Revenue</div>
          </div>
          <div className="nowmade-highlight-stat">
            <div className="stat-value">AED 394K</div>
            <div className="stat-label">2025 Annual EBITDA</div>
          </div>
          <div className="nowmade-highlight-stat">
            <div className="stat-value">80.6%</div>
            <div className="stat-label">Average Occupancy</div>
          </div>
          <div className="nowmade-highlight-stat">
            <div className="stat-value">59.7%</div>
            <div className="stat-label">Peak Margin (Nov)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
