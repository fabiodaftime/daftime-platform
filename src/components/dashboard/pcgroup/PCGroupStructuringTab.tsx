import { useNavigate } from 'react-router-dom';
import { ENTITY_ROUTES, type PCGroupMonthData } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';
import { PCGroupComparisonTable } from './PCGroupComparisonTable';
import { ExternalLink } from 'lucide-react';

interface Props { data: PCGroupMonthData; }

export function PCGroupStructuringTab({ data }: Props) {
  const navigate = useNavigate();
  const { structuringKPIs, structuringComparison, structuringWaterfall } = data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="pcg-entity-link-btn" onClick={() => navigate(ENTITY_ROUTES.structuring)}>
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

      {structuringComparison && (
        <PCGroupComparisonTable
          title="📊 Comparatif M-1"
          headers={['Indicateur', 'Janvier', 'Février', 'Variation']}
          rows={structuringComparison.map((r: any) => ({
            cells: [r.indicator, r.jan, r.feb, r.variation],
            varIndex: 3,
            varType: r.varType,
          }))}
        />
      )}

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
