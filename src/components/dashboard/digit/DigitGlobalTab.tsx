import { D, globalKPIs, globalVariableCosts, globalFixedCosts, globalSynthesis } from './DigitData';

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
      <h2 className="digit-section-title">Digit Solutions - Setup + Ad Account</h2>
      {renderKPIs(globalKPIs)}

      <h2 className="digit-section-title">Coûts Variables</h2>
      {renderKPIs(globalVariableCosts)}

      <h2 className="digit-section-title">Coûts Fixes & Opérationnels</h2>
      {renderKPIs(globalFixedCosts)}

      <h2 className="digit-section-title">Synthèse Financière</h2>
      {renderKPIs(globalSynthesis)}

      <div className="digit-chart-container" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: D.primary, marginBottom: 16 }}>💡 Analyse Global (Main Product)</h3>
        <p style={{ lineHeight: 1.8, color: D.text }}>
          Le produit Global (Setup + Ad Account) génère <strong>$114,649 de CA</strong> sur 267 deals,
          soit un ticket moyen de <strong>$429</strong>.
          Avec une Company Margin de <strong>35.6%</strong>, c'est le produit principal de Digit.
          <br /><br />
          Les coûts fixes (Cost Salary + Tools + Business Exp + Refunds) représentent <strong>$27,907</strong>,
          soit 24.3% du CA.
        </p>
      </div>
    </div>
  );
}
