import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { C, fmtF, topSpenders, currencyMix } from './PrimeCircleAgencyData';
import { PCATooltip } from './PCAShared';

export function PCAMediaTab() {
  return (
    <div>
      <div className="pca-kpi-grid">
        {[
          { label: "Total Media Spend", value: "$279.7K", icon: "📡", sub: "x4.3 vs decembre" },
          { label: "CC Spend", value: "$258.7K", icon: "✅", sub: "92.5% - sans risque" },
          { label: "CL Spend", value: "$21.0K", icon: "📊", sub: "7.5% du total" },
          { label: "Ad Accounts Actifs", value: "33", icon: "📊" },
        ].map((kpi, i) => (
          <div key={i} className="pca-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="pca-kpi-label">{kpi.label}</div>
                <div className="pca-kpi-value">{kpi.value}</div>
                {kpi.sub && <div className="pca-kpi-sub">{kpi.sub}</div>}
              </div>
              <span className="pca-kpi-icon">{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Top 10 Comptes par Media Spend</h3>
          <p className="pca-section-subtitle">Janvier 2026 - ALERTE concentration extreme</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topSpenders.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 26, fontSize: 13, fontWeight: 700, color: i < 3 ? C.accent : C.textMuted, textAlign: 'center' }}>#{i + 1}</span>
              <span style={{ width: 170, fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
              <div className="pca-bar-track">
                <div className="pca-bar-fill" style={{
                  background: i === 0 ? `linear-gradient(90deg, ${C.accent}, #FF6B9D)` : i < 3 ? `linear-gradient(90deg, ${C.primary}, #7C8CF5)` : `linear-gradient(90deg, ${C.cyan}, #7DD3E8)`,
                  width: `${Math.min(s.pct * 1.6, 100)}%`
                }}>
                  <span className="pca-bar-label">{fmtF(s.spend)}</span>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.redText : C.textSecondary, width: 50, textAlign: 'right' }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pca-two-col">
        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">Exposition Devises</h3>
            <p className="pca-section-subtitle">$279.7K repartis sur 6 devises</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={currencyMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={2}
                label={(e) => `${e.name} ${(e.percent * 100).toFixed(0)}%`} labelLine={{ stroke: C.textLight }}>
                {[C.primary, C.purple, C.orange, C.green, C.textLight].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<PCATooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">CC vs CL Media</h3>
            <p className="pca-section-subtitle">Repartition du risque</p>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            <div style={{ flex: 2.5, background: C.greenSoft, borderRadius: 14, padding: 24, textAlign: 'center', border: '1px solid ' + C.border }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: C.greenText }}>92.5%</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 6 }}>CC - $258.7K</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Client paie directement</div>
            </div>
            <div style={{ flex: 1, background: C.redSoft, borderRadius: 14, padding: 24, textAlign: 'center', border: '1px solid ' + C.border }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: C.redText }}>7.5%</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 6 }}>CL - $21.0K</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>PCA avance le media</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
