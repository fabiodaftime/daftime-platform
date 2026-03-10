import { commentKPIs, commentWaterfall, commentWarning } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';

export function PCGroupCommentTab() {
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
          <h3 className="pcg-section-title">⚠️ Analyse Février</h3>
        </div>
        <div className="pcg-section-body">
          <p style={{ color: '#F59E0B', fontWeight: 600, marginBottom: '1rem' }}>
            {commentWarning}
          </p>
          <PCGroupWaterfall data={commentWaterfall} title="" />
        </div>
      </div>
    </div>
  );
}
