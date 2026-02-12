import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { structuringKPIs, structuringWaterfall, structuringServices, structuringServicesChart, ENTITY_ROUTES } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';
import { ExternalLink } from 'lucide-react';

export function PCGroupStructuringTab() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="pcg-entity-link-btn" onClick={() => navigate(ENTITY_ROUTES.structuring)}>
          <ExternalLink size={14} /> Ouvrir le dashboard Structuring complet
        </button>
      </div>

      <div className="pcg-kpi-grid">
        {structuringKPIs.map((kpi, i) => (
          <div key={i} className={`pcg-kpi-card ${kpi.color}`}>
            <div className="pcg-kpi-label">{kpi.label}</div>
            <div className="pcg-kpi-value">{kpi.value}</div>
            <div className="pcg-kpi-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="pcg-charts-row">
        <PCGroupWaterfall data={structuringWaterfall} title="💰 P&L Summary" />
        <div className="pcg-section">
          <div className="pcg-section-header">
            <h3 className="pcg-section-title">📊 Revenue par Service</h3>
          </div>
          <div className="pcg-section-body">
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={structuringServicesChart}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {structuringServicesChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📋 Top Services by Turnover</h3>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Turnover</th>
                <th>% Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {structuringServices.map((s, i) => (
                <tr key={i}>
                  <td>{s.name}</td>
                  <td className="pcg-amount positive">${s.value.toLocaleString()}</td>
                  <td>{s.pct}</td>
                  <td><span className={`pcg-status-badge ${s.status === 'Top' ? 'success' : 'warning'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
