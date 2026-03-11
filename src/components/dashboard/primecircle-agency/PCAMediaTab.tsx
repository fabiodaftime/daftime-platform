import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { C, fmt, fmtF, PIE_COLORS, type PCAMonthData } from './PrimeCircleAgencyData';
import { PCATooltip } from './PCAShared';

interface Props { data: PCAMonthData; }

export function PCAMediaTab({ data }: Props) {
  return (
    <div>
      <div className="pca-kpi-grid">
        {data.mediaKPIs.map((kpi, i) => (
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
          <h3 className="pca-section-title">Top 10 Spenders - {data.monthLabel}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.topSpenders.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 180, fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
              <div className="pca-bar-track">
                <div className="pca-bar-fill" style={{
                  background: i === 0 ? `linear-gradient(90deg, ${C.accent}, #FF6B9D)` : i < 3 ? `linear-gradient(90deg, ${C.primary}, #7C8CF5)` : `linear-gradient(90deg, ${C.cyan}, #7DD3E8)`,
                  width: `${Math.min(s.pct / 30 * 100, 100)}%`
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.text, width: 80, textAlign: 'right' }}>{fmt(s.spend)}</span>
              <span style={{ fontSize: 11, color: C.textMuted, width: 45 }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pca-two-col">
        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">Exposition Devises</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.currencyMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={85} paddingAngle={3}
                label={(e) => `${e.name} ${((e.percent || 0) * 100).toFixed(0)}%`} labelLine={{ stroke: C.borderLight }}>
                {data.currencyMix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<PCATooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">CC vs CL Split</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div style={{ background: C.primarySoft, borderRadius: 12, padding: 20, textAlign: 'center', border: '1px solid ' + C.border }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.primary }}>{data.ccSpend}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>CC ({data.ccSpendPct}%)</div>
              {data.ccSpendPctPrev && <div style={{ fontSize: 10, color: C.textMuted }}>{data.ccSpendPctPrev}</div>}
            </div>
            <div style={{ background: C.orangeSoft, borderRadius: 12, padding: 20, textAlign: 'center', border: '1px solid ' + C.border }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.orangeText }}>{data.clSpend}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>CL ({data.clSpendPct}%)</div>
              {data.clSpendPctPrev && <div style={{ fontSize: 10, color: C.textMuted }}>{data.clSpendPctPrev}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
