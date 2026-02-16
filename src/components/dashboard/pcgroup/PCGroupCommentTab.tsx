import { commentKPIs, commentWaterfall } from './PCGroupData';
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

      <div className="pcg-charts-row">
        <PCGroupWaterfall data={commentWaterfall} title="💰 Waterfall Comment/Trustpilot" />
      </div>
    </div>
  );
}
