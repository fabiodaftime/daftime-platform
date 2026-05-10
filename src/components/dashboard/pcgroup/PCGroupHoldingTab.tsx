import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { type PCGroupMonthData, type PCGComparisonRow, cell } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';
import { PCGroupComparisonTable } from './PCGroupComparisonTable';

interface Props { data: PCGroupMonthData; }

export function PCGroupHoldingTab({ data }: Props) {
  const { holdingKPIs, holdingComparison, holdingSynthese, holdingPieData, directors, holdingNetResult, monthLabel } = data;

  return (
    <div>
      <div className="pcg-kpi-grid">
        {holdingKPIs.map((kpi, i) => (
          <div key={i} className={`pcg-kpi-card ${kpi.color}`}>
            <div className="pcg-kpi-label">{kpi.label}</div>
            <div className="pcg-kpi-value">{kpi.value}</div>
            <div className="pcg-kpi-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      {holdingComparison && (() => {
        const rows = holdingComparison as PCGComparisonRow[];
        const hasMar = rows.some((r) => Boolean(r.mar));
        const hasAvr = rows.some((r) => Boolean(r.avr));
        const hasYtd = rows.some((r) => Boolean(r.ytd));
        const variationLabel = hasAvr ? ' (Mars→Avril)' : hasMar ? ' (Fév→Mars)' : '';
        const headers = [
          'Indicateur', 'Janvier', 'Février',
          ...(hasMar ? ['Mars'] : []),
          ...(hasAvr ? ['Avril'] : []),
          `Variation${variationLabel}`,
          ...(hasYtd ? ['YTD'] : []),
        ];
        const titleSuffix = hasAvr
          ? 'Janvier → Avril Holding'
          : hasMar
            ? 'Janvier / Février / Mars Holding'
            : 'M-1 Holding';
        return (
          <PCGroupComparisonTable
            title={`📊 Comparatif ${titleSuffix}`}
            mappingContext={`Onglet Holding · ${monthLabel}`}
            headers={headers}
            rows={rows.map((r) => {
              const cells = [
                r.indicator, cell(r.jan), cell(r.feb),
                ...(hasMar ? [cell(r.mar)] : []),
                ...(hasAvr ? [cell(r.avr)] : []),
                cell(r.variation),
                ...(hasYtd ? [cell(r.ytd)] : []),
              ];
              return { cells, varIndex: 3 + (hasMar ? 1 : 0) + (hasAvr ? 1 : 0), varType: r.varType };
            })}
          />
        );
      })()}

      <div className="pcg-section">
        <div className="pcg-section-header">
          <div>
            <h3 className="pcg-section-title">👥 Répartition Dirigeants - {monthLabel}</h3>
            <p className="pcg-section-subtitle">100% du résultat net holding = {holdingNetResult}</p>
          </div>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-directors-grid">
            {directors.map((d, i) => (
              <div key={i} className="pcg-director-card" style={{ background: d.gradient }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
                <div className="pcg-director-name">{d.name}</div>
                <div className="pcg-director-pct">{d.pct}</div>
                <div className="pcg-director-amount">{d.amount}</div>
                {d.subtitle && (
                  <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem' }}>{d.subtitle}</div>
                )}
                <div className="pcg-director-bar">
                  <div style={{ width: d.pct, height: '100%', background: '#C9A227', borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📊 Synthèse Flux Holding</h3>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-charts-row">
            <PCGroupWaterfall data={holdingSynthese} title="" />
            <div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={holdingPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
                      {holdingPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginTop: 8 }}>
                Répartition du Résultat Net Groupe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
