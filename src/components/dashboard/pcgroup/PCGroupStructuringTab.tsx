import { useNavigate } from 'react-router-dom';
import { type PCGroupEntityRoutes, type PCGroupMonthData } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';
import { PCGroupComparisonTable } from './PCGroupComparisonTable';
import { ExternalLink } from 'lucide-react';

interface Props {
  data: PCGroupMonthData;
  entityRoutes: PCGroupEntityRoutes;
}

export function PCGroupStructuringTab({ data, entityRoutes }: Props) {
  const navigate = useNavigate();
  const { structuringKPIs, structuringComparison, structuringWaterfall } = data;
  const route = entityRoutes.structuring;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="pcg-entity-link-btn" onClick={() => route && navigate(route)} disabled={!route}>
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

      {structuringComparison && (() => {
        const hasMar = structuringComparison.some((r: any) => r.mar);
        const hasYtd = structuringComparison.some((r: any) => r.ytd);
        const headers = ['Indicateur', 'Janvier', 'Février', ...(hasMar ? ['Mars'] : []), `Variation${hasMar ? ' (Fév→Mars)' : ''}`, ...(hasYtd ? ['YTD'] : [])];
        return (
          <PCGroupComparisonTable
            title={`📊 Comparatif ${hasMar ? 'Janvier / Février / Mars' : 'M-1'}`}
            headers={headers}
            rows={structuringComparison.map((r: any) => {
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
          <PCGroupWaterfall data={structuringWaterfall} title="" />
        </div>
      </div>
    </div>
  );
}
