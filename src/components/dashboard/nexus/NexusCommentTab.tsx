import { commentKPIs, commentWaterfall } from './NexusData';
import { PCGroupWaterfall } from '../pcgroup/PCGroupWaterfall';

export function NexusCommentTab() {
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
        <PCGroupWaterfall data={commentWaterfall} title="💰 Waterfall ReviewBoost" />
      </div>
    </div>
  );
}
