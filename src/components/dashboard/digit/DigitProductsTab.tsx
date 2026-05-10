import { D, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

const typeColor: Record<string, string> = {
  primary: D.primary, success: D.green, accent: D.primary, warning: D.orange,
};

export function DigitProductsTab({ data }: Props) {
  const { digitCoreKPIs, spyKPIs, spyDetail, ctKPIs, ctAlert } = data;

  return (
    <div>
      <h2 className="digit-section-title">Digit Solution (Core) — {data.monthLabel}</h2>
      <div className="digit-kpi-grid">
        {digitCoreKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <h2 className="digit-section-title">SPY — {data.monthLabel}</h2>
      <div className="digit-kpi-grid">
        {spyKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
            {kpi.chg && (
              <div className="digit-metric-comparison">
                <span className={`digit-badge ${kpi.chg.startsWith('+') ? 'positive' : 'negative'}`}>{kpi.chg}</span>
                <span style={{ fontSize: '0.75rem', color: D.textMuted }}>vs Janvier {parseFloat(kpi.chg) > 50 ? '🚀' : ''}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {(spyDetail.feb || (spyDetail as any).mar) && (
        <div className="digit-card">
          <h3 className="digit-card-title">🚀 Évolution SPY</h3>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.8 }}>
            <div><strong>Janvier :</strong> CA {spyDetail.jan} | Marge {spyDetail.janMarge}</div>
            {spyDetail.feb && <div><strong>Février :</strong> CA {spyDetail.feb} | Marge {spyDetail.febMarge}</div>}
            {(spyDetail as any).mar && <div><strong>Mars :</strong> CA {(spyDetail as any).mar} | Marge {(spyDetail as any).marMarge}</div>}
            {(spyDetail as any).apr && <div><strong>Avril :</strong> CA {(spyDetail as any).apr} | Marge {(spyDetail as any).aprMarge}</div>}
            <div style={{ color: D.green, fontWeight: 600, marginTop: '0.5rem' }}>
              <strong>Évolution :</strong> {(spyDetail as any).apr ? 'CA +129% vs Janvier (+$21,700) 🚀 | Avril +2.9% vs Mars' : (spyDetail as any).mar ? 'CA +123% vs Janvier (+$20,600) 🚀 | Marge +6.3%' : 'CA +63.0% (+$10,550) | Marge +9.1%'}
            </div>
          </div>
        </div>
      )}

      <h2 className="digit-section-title">Comment/Trust — {data.monthLabel}</h2>
      <div className="digit-kpi-grid">
        {ctKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
            {kpi.chg && (
              <div className="digit-metric-comparison">
                <span className={`digit-badge ${kpi.chg.startsWith('+') ? 'positive' : 'negative'}`}>{kpi.chg}</span>
                <span style={{ fontSize: '0.75rem', color: D.textMuted }}>vs Janvier ⚠️</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {ctAlert && (
        <div className="digit-info-box warning">
          <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>⚠️ Alerte — Comment/Trust</div>
          <div style={{ fontSize: '0.8125rem', color: D.textSecondary }}>{ctAlert}</div>
        </div>
      )}
    </div>
  );
}
