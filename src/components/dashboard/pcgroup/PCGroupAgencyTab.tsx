import { useNavigate } from 'react-router-dom';
import { ENTITY_ROUTES, type PCGroupMonthData } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';
import { PCGroupComparisonTable } from './PCGroupComparisonTable';
import { ExternalLink } from 'lucide-react';

interface Props { data: PCGroupMonthData; }

export function PCGroupAgencyTab({ data }: Props) {
  const navigate = useNavigate();
  const { agencyKPIs, agencyComparison, agencyWaterfall } = data;

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

      {agencyComparison && (
        <PCGroupComparisonTable
          title="📊 Comparatif M-1"
          headers={['Indicateur', 'Janvier', 'Février', 'Variation']}
          rows={agencyComparison.map((r: any) => ({
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
          <PCGroupWaterfall data={agencyWaterfall} title="" />
        </div>
      </div>
    </div>
  );
}
