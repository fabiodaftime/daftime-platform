import { useNavigate } from 'react-router-dom';
import { type PCGroupEntityRoutes, type PCGroupMonthData, type PCGComparisonRow, cell } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';
import { PCGroupComparisonTable } from './PCGroupComparisonTable';
import { ExternalLink } from 'lucide-react';

interface Props {
  data: PCGroupMonthData;
  entityRoutes: PCGroupEntityRoutes;
}

export function PCGroupDigitTab({ data, entityRoutes }: Props) {
  const navigate = useNavigate();
  const { digitKPIs, digitComparison, digitWaterfall } = data;
  const route = entityRoutes.digit;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="pcg-entity-link-btn" onClick={() => route && navigate(route)} disabled={!route}>
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

      {digitComparison && (() => {
        const rows = digitComparison as PCGComparisonRow[];
        const hasMar = rows.some((r) => Boolean(r.mar));
        const hasAvr = rows.some((r) => Boolean(r.avr));
        const hasMai = rows.some((r) => Boolean(r.mai));
        const hasYtd = rows.some((r) => Boolean(r.ytd));
        const variationLabel = hasMai ? ' (Avril→Mai)' : hasAvr ? ' (Mars→Avril)' : hasMar ? ' (Fév→Mars)' : '';
        const titleSuffix = hasMai
          ? 'Janvier / Février / Mars / Avril / Mai 2026'
          : hasAvr
            ? 'Janvier / Février / Mars / Avril 2026'
            : hasMar
              ? 'Janvier / Février / Mars 2026'
              : 'M-1';
        const headers = ['Indicateur', 'Janvier', 'Février',
          ...(hasMar ? ['Mars'] : []),
          ...(hasAvr ? ['Avril'] : []),
          ...(hasMai ? ['Mai'] : []),
          `Variation${variationLabel}`,
          ...(hasYtd ? ['YTD'] : [])];
        return (
          <PCGroupComparisonTable
            title={`📊 Comparatif ${titleSuffix}`}
            mappingContext={`Onglet Digit Solution · ${data.monthLabel}`}
            headers={headers}
            rows={rows.map((r) => {
              const cells = [r.indicator, cell(r.jan), cell(r.feb),
                ...(hasMar ? [cell(r.mar)] : []),
                ...(hasAvr ? [cell(r.avr)] : []),
                ...(hasMai ? [cell(r.mai)] : []),
                cell(r.variation),
                ...(hasYtd ? [cell(r.ytd)] : [])];
              return { cells, varIndex: 3 + (hasMar ? 1 : 0) + (hasAvr ? 1 : 0) + (hasMai ? 1 : 0), varType: r.varType };
            })}
          />
        );
      })()}

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">💰 Détail Charges {data.monthLabel}</h3>
        </div>
        <div className="pcg-section-body">
          <PCGroupWaterfall data={digitWaterfall} title="" />
        </div>
      </div>
    </div>
  );
}
