import { D, globalKPIs, globalTicketMoyens, globalVariableCosts, globalFixedCosts, globalSynthesis } from './DigitData';

export function DigitGlobalTab() {
  const typeColor: Record<string, string> = {
    primary: D.primary, success: D.green, accent: D.accent, warning: D.orange, indigo: D.indigo,
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
      <h2 className="digit-section-title">Digit Solution - Main Product (Setup + Ad Account)</h2>
      {renderKPIs(globalKPIs)}

      <h2 className="digit-section-title">Tickets Moyens par Type</h2>
      {renderKPIs(globalTicketMoyens)}

      <h2 className="digit-section-title">Coûts Variables</h2>
      {renderKPIs(globalVariableCosts)}

      <h2 className="digit-section-title">Coûts Fixes & Opérationnels</h2>
      {renderKPIs(globalFixedCosts)}

      <h2 className="digit-section-title">Synthèse Financière</h2>
      {renderKPIs(globalSynthesis)}
    </div>
  );
}
