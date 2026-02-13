import { D, commentTrustKPIs, commentVariableCosts, commentSynthesis } from './DigitData';

export function DigitCommentTrustTab() {
  const typeColor: Record<string, string> = {
    primary: D.primary, success: D.green, accent: D.accent, warning: D.orange,
  };

  const renderKPIs = (items: { label: string; value: string; sub: string; type: string }[]) => (
    <div className="digit-kpi-grid">
      {items.map((kpi, i) => (
        <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
          <div className="digit-metric-label">{kpi.label}</div>
          <div className="digit-metric-value">{kpi.value}</div>
          <div className="digit-metric-sub">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <h2 className="digit-section-title">Comment / Trustpilot - Services d'Engagement</h2>
      {renderKPIs(commentTrustKPIs)}

      <h2 className="digit-section-title">Coûts Variables</h2>
      {renderKPIs(commentVariableCosts)}

      <h2 className="digit-section-title">Synthèse Financière</h2>
      {renderKPIs(commentSynthesis)}
    </div>
  );
}
