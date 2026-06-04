import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { type PCGroupEntityRoutes, type PCGroupMonthData, type PCGOverviewComparisonRow, cell, type MonthId } from './PCGroupData';
import { PCGroupColumnMappingTrigger, buildDefaultColumnMapping } from './PCGroupColumnMapping';
import { PCGroupWaterfall } from './PCGroupWaterfall';
import { validateAllMonths } from './pcGroupValidator';

interface Props {
  data: PCGroupMonthData;
  entityRoutes: PCGroupEntityRoutes;
  monthId?: MonthId;
  /** Nombre d'entités actives (live config) pour rafraîchir dynamiquement le détail "X entités consolidées". */
  entitiesCount?: number;
}

type KPIStatus = 'ok' | 'warning' | 'missing' | 'unknown';

const STATUS_BADGE: Record<KPIStatus, { color: string; bg: string; label: string; Icon: typeof CheckCircle2 } | null> = {
  ok: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'OK', Icon: CheckCircle2 },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: 'Écarts', Icon: AlertTriangle },
  missing: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', label: 'Manquant', Icon: XCircle },
  unknown: null,
};

// Mapping label de KPI → métrique tracée par le validateur.
function metricForKpiLabel(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes('ca groupe') || (l.includes('ca') && l.includes('groupe'))) return 'CA Groupe';
  if (l.includes('marge brute')) return 'Marge Brute Groupe';
  if (l.includes('résultat net') || l.includes('resultat net')) return 'Résultat Net Holding';
  if (l.includes('réserves') || l.includes('reserves')) return 'Réserves Filiales';
  return null;
}

export function PCGroupOverviewTab({ data, entityRoutes, monthId, entitiesCount }: Props) {
  const navigate = useNavigate();
  const { overviewHero, entityCards, consolidatedPL, pieData, overviewComparison, overviewComparisonTotal, monthLabel } = data;

  // Statut de validation pour le mois sélectionné (présence sources + écarts vs référence figée).
  const monthValidation = useMemo(() => {
    if (!monthId) return null;
    const report = validateAllMonths();
    return report.months.find((m) => m.monthId === monthId) ?? null;
  }, [monthId]);

  const statusForKpi = (label: string): KPIStatus => {
    if (!monthValidation) return 'unknown';
    if (monthValidation.status === 'missing') return 'missing';
    const metric = metricForKpiLabel(label);
    if (!metric) return monthValidation.status === 'ok' ? 'ok' : 'unknown';
    const hasDelta = monthValidation.deltas.some((d) => d.metric === metric);
    if (hasDelta) return 'warning';
    return monthValidation.status === 'ok' ? 'ok' : 'ok';
  };

  const handleEntityClick = (entityId: string) => {
    const route = entityRoutes[entityId as keyof PCGroupEntityRoutes];
    if (route) navigate(route);
  };

  return (
    <div>
      <div className="pcg-hero-grid">
        {overviewHero.map((kpi, i) => {
          const status = statusForKpi(kpi.label);
          const badge = STATUS_BADGE[status];
          return (
            <div key={i} className={`pcg-hero-card ${kpi.color}`} style={{ position: 'relative' }}>
              {badge && (
                <span
                  title={`Validation : ${badge.label}`}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: badge.bg,
                    color: badge.color,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    border: `1px solid ${badge.color}55`,
                  }}
                >
                  <badge.Icon size={11} />
                  {badge.label}
                </span>
              )}
              <div className="pcg-hero-label">{kpi.label}</div>
              <div className="pcg-hero-value">{kpi.value}</div>
              <div className="pcg-hero-detail">
                {typeof entitiesCount === 'number' && metricForKpiLabel(kpi.label) === 'CA Groupe'
                  ? `${entitiesCount} entité${entitiesCount > 1 ? 's' : ''} consolidée${entitiesCount > 1 ? 's' : ''}`
                  : kpi.detail}
              </div>
              {kpi.variance && (
                <div className={`pcg-hero-var ${kpi.varType}`}>{kpi.variance}</div>
              )}
            </div>
          );
        })}
      </div>

      {overviewComparison && overviewComparisonTotal && (() => {
        const rows = overviewComparison as PCGOverviewComparisonRow[];
        const total = overviewComparisonTotal as PCGOverviewComparisonRow;
        const hasMar = Boolean(total.mar) || rows.some((r) => Boolean(r.mar));
        const hasAvr = Boolean(total.avr) || rows.some((r) => Boolean(r.avr));
        const hasMai = Boolean(total.mai) || rows.some((r) => Boolean(r.mai));
        const hasYtd = Boolean(total.ytd) || rows.some((r) => Boolean(r.ytd));
        const variationLabel = hasMai
          ? ' (Avril→Mai)'
          : hasAvr
            ? ' (Mars→Avril)'
            : hasMar ? ' (Fév→Mars)' : '';
        const title = hasMai
          ? '📊 Comparatif Janvier / Février / Mars / Avril / Mai 2026'
          : hasAvr
            ? '📊 Comparatif Janvier / Février / Mars / Avril 2026'
            : hasMar
              ? '📊 Comparatif Janvier / Février / Mars 2026'
              : '📊 Comparatif Janvier vs Février 2026';
        const mappingHeaders = [
          'Entité', 'Janvier', 'Février',
          ...(hasMar ? ['Mars'] : []),
          ...(hasAvr ? ['Avril'] : []),
          ...(hasMai ? ['Mai'] : []),
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
                    {hasMai && <th>Mai</th>}
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
                      {hasMai && <td>{cell(row.mai)}</td>}
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
                    {hasMai && <td>{cell(total.mai)}</td>}
                    <td className={`pcg-var-${total.varType}`}>{cell(total.variation)}</td>
                    {hasYtd && <td>{cell(total.ytd)}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      <div className="pcg-entities-grid">
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
                {entity.id === 'digit' && (
                  <div
                    title="Les chiffres affichés intègrent déjà SPY et Comment/Trustpilot. Ne pas additionner ces entités au total Digit pour éviter le double comptage."
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      marginBottom: 8,
                      borderRadius: 999,
                      background: 'rgba(217,70,168,0.10)',
                      color: '#B83A8E',
                      border: '1px solid rgba(217,70,168,0.35)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                      cursor: 'help',
                      width: 'fit-content',
                    }}
                  >
                    <CheckCircle2 size={11} />
                    Consolidé · inclut SPY & Comment
                  </div>
                )}
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

      <div className="pcg-section pcg-pl-section">
        <div
          className="pcg-section-header"
          style={{
            background: 'linear-gradient(90deg, rgba(30,58,95,0.06) 0%, rgba(212,168,85,0.05) 60%, transparent 100%)',
            borderLeft: '4px solid var(--pcg-gold)',
          }}
        >
          <div>
            <h3 className="pcg-section-title" style={{ fontSize: '1.05rem' }}>
              <span style={{ fontSize: '1.1rem' }}>📈</span> P&L Consolidé · {monthLabel}
            </h3>
            <p className="pcg-section-subtitle">
              Synthèse financière groupe — Agency, Structuring, Digit Solution (SPY & Comment inclus dans Digit)
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(30,58,95,0.08)',
              border: '1px solid rgba(30,58,95,0.18)',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--pcg-navy)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            <CheckCircle2 size={13} /> Anti double-comptage
          </div>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-charts-row">
            <PCGroupWaterfall data={consolidatedPL} title="" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(30,58,95,0.04) 0%, rgba(212,168,85,0.06) 100%)',
                  border: '1px solid var(--pcg-border)',
                  borderRadius: 14,
                  padding: '14px 16px 6px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: 'var(--pcg-text-muted)',
                    }}
                  >
                    Contribution à la Marge Groupe
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--pcg-text-secondary)' }}>
                    {monthLabel}
                  </span>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={100}
                        paddingAngle={2}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => `$${v.toLocaleString()}`}
                        contentStyle={{
                          borderRadius: 10,
                          border: '1px solid var(--pcg-border)',
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {(() => {
                const totalMarge = pieData.reduce((s, p) => s + (p.value || 0), 0);
                const top = [...pieData].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
                const topPct = totalMarge > 0 && top ? Math.round((top.value / totalMarge) * 100) : 0;
                const heroByLabel = (key: string) =>
                  overviewHero.find((h: any) => h.label.toLowerCase().includes(key.toLowerCase()));
                const ca = heroByLabel('CA Groupe');
                const margeBrute = heroByLabel('Marge Brute');
                const resultatNet = heroByLabel('Résultat Net');
                const reserves = heroByLabel('Réserves');
                const tauxMarge =
                  ca && margeBrute
                    ? (() => {
                        const caN = parseFloat(String(ca.value).replace(/[^0-9.-]/g, '')) || 0;
                        const mbN = parseFloat(String(margeBrute.value).replace(/[^0-9.-]/g, '')) || 0;
                        return caN > 0 ? Math.round((mbN / caN) * 100) : 0;
                      })()
                    : 0;

                const stat = (
                  label: string,
                  value: string,
                  detail: string,
                  accent: string,
                ) => (
                  <div
                    style={{
                      background: 'var(--pcg-surface)',
                      border: '1px solid var(--pcg-border)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      borderLeft: `3px solid ${accent}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                        color: 'var(--pcg-text-muted)',
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: 'var(--pcg-text)',
                      }}
                    >
                      {value}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--pcg-text-secondary)' }}>{detail}</div>
                  </div>
                );

                return (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 10,
                    }}
                  >
                    {stat(
                      'Top Contributeur',
                      top?.name ?? '—',
                      `${topPct}% de la marge groupe`,
                      'var(--pcg-gold)',
                    )}
                    {stat(
                      'Taux de Marge',
                      `${tauxMarge}%`,
                      'Marge brute / CA',
                      'var(--pcg-success)',
                    )}
                    {resultatNet &&
                      stat(
                        'Résultat Net Holding',
                        String(resultatNet.value),
                        'Après frais & remontée 90%',
                        'var(--pcg-navy)',
                      )}
                    {reserves &&
                      stat(
                        'Réserves Filiales',
                        String(reserves.value),
                        '10% marge brute conservée',
                        'var(--pcg-primary)',
                      )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
