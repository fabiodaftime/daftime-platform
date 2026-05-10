import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { type PCGroupEntityRoutes, type PCGroupMonthData, type PCGOverviewComparisonRow, cell } from './PCGroupData';
import { PCGroupColumnMappingTrigger, buildDefaultColumnMapping } from './PCGroupColumnMapping';
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
        const rows = overviewComparison as PCGOverviewComparisonRow[];
        const total = overviewComparisonTotal as PCGOverviewComparisonRow;
        const hasMar = Boolean(total.mar) || rows.some((r) => Boolean(r.mar));
        const hasAvr = Boolean(total.avr) || rows.some((r) => Boolean(r.avr));
        const hasYtd = Boolean(total.ytd) || rows.some((r) => Boolean(r.ytd));
        const variationLabel = hasAvr ? ' (Mars→Avril)' : hasMar ? ' (Fév→Mars)' : '';
        const title = hasAvr
          ? '📊 Comparatif Janvier / Février / Mars / Avril 2026'
          : hasMar
            ? '📊 Comparatif Janvier / Février / Mars 2026'
            : '📊 Comparatif Janvier vs Février 2026';
        const mappingHeaders = [
          'Entité', 'Janvier', 'Février',
          ...(hasMar ? ['Mars'] : []),
          ...(hasAvr ? ['Avril'] : []),
          `Variation${variationLabel}`,
          ...(hasYtd ? ['YTD'] : []),
        ];
        return (
          <div className="pcg-section">
            <div className="pcg-section-header pcg-section-header-row">
              <h3 className="pcg-section-title">{title}</h3>
              <PCGroupColumnMappingTrigger
                context={`Vue Groupe · ${monthLabel}`}
                entries={buildDefaultColumnMapping(mappingHeaders)}
              />
            </div>
            <div className="pcg-section-body">
              <table className="pcg-comparison-table">
                <thead>
                  <tr>
                    <th>Entité</th><th>Janvier</th><th>Février</th>
                    {hasMar && <th>Mars</th>}
                    {hasAvr && <th>Avril</th>}
                    <th>Variation{variationLabel}</th>
                    {hasYtd && <th>YTD</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.entity}</td>
                      <td>{cell(row.jan)}</td>
                      <td>{cell(row.feb)}</td>
                      {hasMar && <td>{cell(row.mar)}</td>}
                      {hasAvr && <td>{cell(row.avr)}</td>}
                      <td className={`pcg-var-${row.varType}`}>{cell(row.variation)}</td>
                      {hasYtd && <td>{cell(row.ytd)}</td>}
                    </tr>
                  ))}
                  <tr className="pcg-comparison-total">
                    <td>{total.entity}</td>
                    <td>{cell(total.jan)}</td>
                    <td>{cell(total.feb)}</td>
                    {hasMar && <td>{cell(total.mar)}</td>}
                    {hasAvr && <td>{cell(total.avr)}</td>}
                    <td className={`pcg-var-${total.varType}`}>{cell(total.variation)}</td>
                    {hasYtd && <td>{cell(total.ytd)}</td>}
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
