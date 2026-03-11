import { type PCGroupMonthData } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';

interface Props { data: PCGroupMonthData; }

export function PCGroupCommentTab({ data }: Props) {
  const { commentKPIs, commentWaterfall, commentWarning } = data;

  return (
    <div>
      <div className="pcg-kpi-grid">
        {commentKPIs.map((kpi, i) => (
          <div key={i} className={`pcg-kpi-card ${kpi.color}`}>
            <div className="pcg-kpi-label">{kpi.label}</div>
            <div className="pcg-kpi-value">{kpi.value}</div>
            <div className="pcg-kpi-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">⚠️ Analyse {data.monthLabel}</h3>
        </div>
        <div className="pcg-section-body">
          {commentWarning && (
            <p style={{ color: '#F59E0B', fontWeight: 600, marginBottom: '1rem' }}>
              {commentWarning}
            </p>
          )}
          <PCGroupWaterfall data={commentWaterfall} title="" />
        </div>
      </div>
    </div>
  );
}
