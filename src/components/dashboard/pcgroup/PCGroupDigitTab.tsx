import { useNavigate } from 'react-router-dom';
import { type PCGroupEntityRoutes, type PCGroupMonthData } from './PCGroupData';
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
        const hasMar = digitComparison.some((r: any) => r.mar);
        const hasYtd = digitComparison.some((r: any) => r.ytd);
        const headers = ['Indicateur', 'Janvier', 'Février', ...(hasMar ? ['Mars'] : []), `Variation${hasMar ? ' (Fév→Mars)' : ''}`, ...(hasYtd ? ['YTD'] : [])];
        return (
          <PCGroupComparisonTable
            title={`📊 Comparatif ${hasMar ? 'Janvier / Février / Mars' : 'M-1'}`}
            headers={headers}
            rows={digitComparison.map((r: any) => {
              const cells = [r.indicator, r.jan, r.feb, ...(hasMar ? [r.mar || '—'] : []), r.variation, ...(hasYtd ? [r.ytd || '—'] : [])];
              return { cells, varIndex: 3 + (hasMar ? 1 : 0), varType: r.varType };
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
