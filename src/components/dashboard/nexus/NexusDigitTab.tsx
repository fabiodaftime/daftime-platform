import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { digitKPIs, digitWaterfall, digitRevenueBreakdown, digitRevenueChart } from './NexusData';
import { PCGroupWaterfall } from '../pcgroup/PCGroupWaterfall';

export function NexusDigitTab() {
  return (
    <div>
      <div className="pcg-kpi-grid">
        {digitKPIs.map((kpi, i) => (
          <div key={i} className={`pcg-kpi-card ${kpi.color}`}>
            <div className="pcg-kpi-label">{kpi.label}</div>
            <div className="pcg-kpi-value">{kpi.value}</div>
            <div className="pcg-kpi-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="pcg-charts-row">
        <PCGroupWaterfall data={digitWaterfall} title="💰 Waterfall P&L" />
        <div className="pcg-section">
          <div className="pcg-section-header">
            <h3 className="pcg-section-title">📊 Répartition CA</h3>
          </div>
          <div className="pcg-section-body">
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={digitRevenueChart}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {digitRevenueChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📈 Détail par Type de Produit</h3>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-data-table">
            <thead>
              <tr><th>Produit</th><th>CA</th><th>Deals</th><th>Ticket Moyen</th></tr>
            </thead>
            <tbody>
              {digitRevenueBreakdown.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td className="pcg-amount positive">${p.value.toLocaleString()}</td>
                  <td>{p.deals}</td>
                  <td>{p.ticket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
