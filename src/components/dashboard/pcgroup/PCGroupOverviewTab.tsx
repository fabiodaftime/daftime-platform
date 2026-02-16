import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { overviewHero, entityCards, consolidatedPL, pieData, ENTITY_ROUTES } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';

export function PCGroupOverviewTab() {
  const navigate = useNavigate();

  const handleEntityClick = (entityId: string) => {
    const route = ENTITY_ROUTES[entityId as keyof typeof ENTITY_ROUTES];
    if (route) navigate(route);
  };

  return (
    <div>
      {/* Hero KPIs */}
      <div className="pcg-hero-grid">
        {overviewHero.map((kpi, i) => (
          <div key={i} className={`pcg-hero-card ${kpi.color}`}>
            <div className="pcg-hero-label">{kpi.label}</div>
            <div className="pcg-hero-value">{kpi.value}</div>
            <div className="pcg-hero-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      {/* Entity Cards - 5 columns */}
      <div className="pcg-entities-grid pcg-entities-5">
        {entityCards.map((entity) => (
          <div key={entity.id} className={`pcg-entity-card ${entity.cssClass}`}>
            <div className="pcg-entity-header" style={{ background: entity.gradient }}>
              <span className="pcg-entity-name">{entity.name}</span>
              <span className="pcg-entity-badge">{entity.badge}</span>
            </div>
            <div className="pcg-entity-body">
              <div className="pcg-entity-metrics pcg-entity-metrics-single">
                {entity.metrics.map((m, j) => (
                  <div key={j} className="pcg-entity-metric">
                    <div className="pcg-entity-metric-label">{m.label}</div>
                    <div className={`pcg-entity-metric-value ${m.colorClass || ''}`}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="pcg-entity-footer">
                <div className="pcg-entity-margin">
                  <div className="pcg-margin-bar">
                    <div className={`pcg-margin-fill ${entity.marginLevel}`} style={{ width: `${entity.margin}%` }} />
                  </div>
                  <span className="pcg-margin-text">{entity.margin}%</span>
                </div>
                {ENTITY_ROUTES[entity.id as keyof typeof ENTITY_ROUTES] ? (
                  <span className="pcg-entity-link" onClick={() => handleEntityClick(entity.id)}>→</span>
                ) : (
                  <span className="pcg-entity-link" style={{ visibility: 'hidden' }}>→</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* P&L Consolidé */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <div>
            <h3 className="pcg-section-title">📈 P&L Consolidé - Janvier 2026</h3>
            <p className="pcg-section-subtitle">Synthèse financière des 3 entités</p>
          </div>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-charts-row">
            <PCGroupWaterfall data={consolidatedPL} title="" />
            <div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginTop: 8 }}>
                Contribution à la Marge Groupe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
