import { commentKPIs, commentWaterfall, commentComparison } from './PCGroupData';
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
        <div className="pcg-section">
          <div className="pcg-section-header">
            <h3 className="pcg-section-title">🏆 Produit le plus rentable</h3>
          </div>
          <div className="pcg-section-body">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🥇</div>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--pcg-success)', fontFamily: "'JetBrains Mono', monospace" }}>90.0%</div>
              <div style={{ fontSize: '1rem', color: 'var(--pcg-text-secondary)', marginTop: '0.5rem' }}>Marge la plus élevée du groupe</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📊 Comparaison Marges par Produit</h3>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>CA</th>
                <th>Margin</th>
                <th>Taux</th>
              </tr>
            </thead>
            <tbody>
              {commentComparison.map((p, i) => (
                <tr key={i} style={p.highlight ? { background: 'rgba(16, 185, 129, 0.1)' } : undefined}>
                  <td>{p.highlight ? <strong>{p.name}</strong> : p.name}</td>
                  <td className="pcg-amount">{p.ca}</td>
                  <td className="pcg-amount positive">{p.margin}</td>
                  <td><span className={`pcg-status-badge ${p.badgeType}`}>{p.taux}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
