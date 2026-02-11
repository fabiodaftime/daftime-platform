import { C } from './PrimeCircleAgencyData';

export function PCARisksTab() {
  const riskKPIs = [
    { l: "Concentration Hugo", v: "60.8%", s: "du media spend", c: C.redText },
    { l: "CL Exposure", v: "$21.0K", s: "media avance", c: C.redText },
    { l: "Marge Nette", v: "41.8%", s: "vs 54.8% en Dec", c: C.orangeText },
    { l: "Clients Stopped", v: "14", s: "23% des tx", c: C.orangeText },
  ];

  return (
    <div>
      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Indicateurs Cles de Risque - Janvier 2026</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12 }}>
          {riskKPIs.map((item, i) => (
            <div key={i} style={{
              background: item.c === C.redText ? C.redSoft : C.orangeSoft,
              borderRadius: 12, padding: '16px 14px', textAlign: 'center',
              border: '1px solid ' + C.border,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{item.l}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.c }}>{item.v}</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{item.s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
