import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { digitKPIs, digitWaterfall, digitRevenueBreakdown, digitRevenueChart, ENTITY_ROUTES } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';
import { ExternalLink } from 'lucide-react';

export function PCGroupDigitTab() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="pcg-entity-link-btn" onClick={() => navigate(ENTITY_ROUTES.digit)}>
          <ExternalLink size={14} /> Ouvrir le dashboard Digit complet
        </button>
      </div>

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
        <PCGroupWaterfall data={digitWaterfall} title="💰 Waterfall Complet" />
        <div className="pcg-section">
          <div className="pcg-section-header">
            <h3 className="pcg-section-title">📊 CA par Catégorie</h3>
          </div>
          <div className="pcg-section-body">
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={digitRevenueChart}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#D946A8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📈 Répartition du CA par Produit</h3>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>CA</th>
                <th>% Total</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {digitRevenueBreakdown.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td className="pcg-amount positive">${p.value.toLocaleString()}</td>
                  <td>{p.pct}</td>
                  <td><span className={`pcg-status-badge ${p.type === 'One-time' ? 'success' : p.type === 'Recurring' ? 'warning' : 'success'}`}>{p.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
