import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { type PCGroupEntityRoutes, type PCGroupMonthData } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';

interface Props {
  data: PCGroupMonthData;
  entityRoutes: PCGroupEntityRoutes;
}

export function PCGroupOverviewTab({ data, entityRoutes }: Props) {
  const navigate = useNavigate();
  const { overviewHero, entityCards, consolidatedPL, pieData, overviewComparison, overviewComparisonTotal, monthLabel } = data;

  const handleEntityClick = (entityId: string) => {
    const route = entityRoutes[entityId as keyof PCGroupEntityRoutes];
    if (route) navigate(route);
  };

  return (
    <div>
      <div className="pcg-hero-grid">
        {overviewHero.map((kpi, i) => (
          <div key={i} className={`pcg-hero-card ${kpi.color}`}>
            <div className="pcg-hero-label">{kpi.label}</div>
            <div className="pcg-hero-value">{kpi.value}</div>
            <div className="pcg-hero-detail">{kpi.detail}</div>
            {kpi.variance && (
              <div className={`pcg-hero-var ${kpi.varType}`}>{kpi.variance}</div>
            )}
          </div>
        ))}
      </div>

      {overviewComparison && overviewComparisonTotal && (() => {
        const hasMar = Boolean((overviewComparisonTotal as any).mar);
        const title = hasMar
          ? '📊 Comparatif Janvier / Février / Mars 2026'
          : '📊 Comparatif Janvier vs Février 2026';
        return (
          <div className="pcg-section">
            <div className="pcg-section-header">
              <h3 className="pcg-section-title">{title}</h3>
            </div>
            <div className="pcg-section-body">
              <table className="pcg-comparison-table">
                <thead>
                  <tr>
                    <th>Entité</th><th>Janvier</th><th>Février</th>
                    {hasMar && <th>Mars</th>}
                    <th>Variation{hasMar ? ' (Fév→Mars)' : ''}</th><th>YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewComparison.map((row: any, i: number) => (
                    <tr key={i}>
                      <td>{row.entity}</td><td>{row.jan}</td><td>{row.feb}</td>
                      {hasMar && <td>{row.mar}</td>}
                      <td className={`pcg-var-${row.varType}`}>{row.variation}</td><td>{row.ytd}</td>
                    </tr>
                  ))}
                  <tr className="pcg-comparison-total">
                    <td>{overviewComparisonTotal.entity}</td><td>{overviewComparisonTotal.jan}</td><td>{overviewComparisonTotal.feb}</td>
                    {hasMar && <td>{(overviewComparisonTotal as any).mar}</td>}
                    <td className={`pcg-var-${overviewComparisonTotal.varType}`}>{overviewComparisonTotal.variation}</td><td>{overviewComparisonTotal.ytd}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      <div className="pcg-entities-grid pcg-entities-5">
        {entityCards.map((entity) => {
          const route = entityRoutes[entity.id as keyof PCGroupEntityRoutes];
          const isLinked = Boolean(route);

          return (
            <div key={entity.id} className={`pcg-entity-card ${entity.cssClass}`}>
              <div className="pcg-entity-header" style={{ background: entity.gradient }}>
                <span className="pcg-entity-name">{entity.name}</span>
                <span className="pcg-entity-badge">{entity.badge}</span>
              </div>
              <div className="pcg-entity-body">
                <div className="pcg-entity-metrics pcg-entity-metrics-single" style={{ gridTemplateColumns: '1fr' }}>
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
                  {isLinked ? (
                    <span className="pcg-entity-link" onClick={() => handleEntityClick(entity.id)}>→</span>
                  ) : (
                    <span className="pcg-entity-link" style={{ visibility: 'hidden' }}>→</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <div>
            <h3 className="pcg-section-title">📈 P&L Consolidé - {monthLabel}</h3>
            <p className="pcg-section-subtitle">Synthèse financière des 5 entités</p>
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
