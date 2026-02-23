import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { spyKPIs, spyWaterfall, spyCostsPie, spyAnalysis } from './NexusData';
import { PCGroupWaterfall } from '../pcgroup/PCGroupWaterfall';

export function NexusSpyTab() {
  return (
    <div>
      <div className="pcg-kpi-grid">
        {spyKPIs.map((kpi, i) => (
          <div key={i} className={`pcg-kpi-card ${kpi.color}`}>
            <div className="pcg-kpi-label">{kpi.label}</div>
            <div className="pcg-kpi-value">{kpi.value}</div>
            <div className="pcg-kpi-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="pcg-charts-row">
        <PCGroupWaterfall data={spyWaterfall} title="💰 Waterfall DataTools" />
        <div className="pcg-section">
          <div className="pcg-section-header">
            <h3 className="pcg-section-title">📊 Répartition Charges</h3>
          </div>
          <div className="pcg-section-body">
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={spyCostsPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
                    {spyCostsPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">⚠️ Analyse DataTools</h3>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {spyAnalysis.map((r, i) => (
              <div key={i} className="pcg-kpi-card" style={{ borderLeft: `4px solid var(--pcg-${r.severity})` }}>
                <div className="pcg-kpi-label">{r.label}</div>
                <div className="pcg-kpi-value" style={{ color: `var(--pcg-${r.severity})` }}>{r.value}</div>
                <div className="pcg-kpi-detail">{r.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
