import { D, commentTrustKPIs, marginComparison } from './DigitData';

export function DigitCommentTrustTab() {
  const typeColor: Record<string, string> = {
    primary: D.primary, success: D.green, accent: D.accent, warning: D.orange,
  };

  return (
    <div>
      <h2 className="digit-section-title">Comment / Trustpilot - Services d'Engagement</h2>
      <div className="digit-kpi-grid">
        {commentTrustKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="digit-chart-container" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: D.primary, marginBottom: 16 }}>💡 Analyse Comment/Trustpilot</h3>
        <p style={{ lineHeight: 1.8, color: D.text }}>
          Les services Comment/Trustpilot affichent une <strong>marge exceptionnelle de 90.0%</strong>.
          Aucun coût de produit, seulement une commission sales de <strong>10.0%</strong>.
          Ce produit est le plus rentable du portefeuille avec un CA de <strong>$2,813</strong>.
        </p>
      </div>

      <h2 className="digit-section-title">Comparaison avec autres produits</h2>
      <div className="digit-kpi-grid">
        {marginComparison.map((item, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: item.color }}>
            <div className="digit-metric-label">{item.label}</div>
            <div className="digit-metric-value">{item.value}</div>
            <div className="digit-metric-sub">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
