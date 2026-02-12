import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { agencyKPIs, agencyWaterfall, agencyExpensesPie, agencyRisks, ENTITY_ROUTES } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';
import { ExternalLink } from 'lucide-react';

export function PCGroupAgencyTab() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="pcg-entity-link-btn" onClick={() => navigate(ENTITY_ROUTES.agency)}>
          <ExternalLink size={14} /> Ouvrir le dashboard Agency complet
        </button>
      </div>

      <div className="pcg-kpi-grid">
        {agencyKPIs.map((kpi, i) => (
          <div key={i} className={`pcg-kpi-card ${kpi.color}`}>
            <div className="pcg-kpi-label">{kpi.label}</div>
            <div className="pcg-kpi-value">{kpi.value}</div>
            <div className="pcg-kpi-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="pcg-charts-row">
        <PCGroupWaterfall data={agencyWaterfall} title="💰 Waterfall Revenue" />
        <div className="pcg-section">
          <div className="pcg-section-header">
            <h3 className="pcg-section-title">📊 Répartition Dépenses</h3>
          </div>
          <div className="pcg-section-body">
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={agencyExpensesPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
                    {agencyExpensesPie.map((e, i) => <Cell key={i} fill={e.color} />)}
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
          <h3 className="pcg-section-title">⚠️ Points de Vigilance</h3>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {agencyRisks.map((r, i) => (
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
