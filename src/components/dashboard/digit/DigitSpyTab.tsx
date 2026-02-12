import { D, spyKPIs, spyCommissions } from './DigitData';

export function DigitSpyTab() {
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
      <h2 className="digit-section-title">SPY - Outils d'Analyse Concurrentielle</h2>
      {renderKPIs(spyKPIs)}

      <h2 className="digit-section-title">Détail des Commissions - SPY</h2>
      {renderKPIs(spyCommissions)}

      <div className="digit-chart-container" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: D.primary, marginBottom: 16 }}>💡 Analyse SPY</h3>
        <p style={{ lineHeight: 1.8, color: D.text }}>
          Les outils SPY génèrent <strong>$16,750 de CA</strong> avec une marge de <strong>19.5%</strong>.
          Le coût produit élevé (67.2%) reflète les licences des outils d'analyse.
          Les commissions totales (Blink + Sales) représentent <strong>13.4%</strong> du CA.
        </p>
      </div>
    </div>
  );
}
