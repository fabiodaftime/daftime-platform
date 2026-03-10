import { spyKPIs, spyWaterfall } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';

export function PCGroupSpyTab() {
  return (
    <div>
      <div className="pcg-kpi-grid">
        {spyKPIs.map((kpi, i) => (
          <div key={i} className={`pcg-kpi-card ${kpi.color}`}>
            <div className="pcg-kpi-label">{kpi.label}</div>
            <div className="pcg-kpi-value">{kpi.value}</div>
            <div className="pcg-kpi-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">💰 Détail Charges Février</h3>
        </div>
        <div className="pcg-section-body">
          <PCGroupWaterfall data={spyWaterfall} title="" />
        </div>
      </div>
    </div>
  );
}
