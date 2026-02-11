import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { C, fmtF, expenseBreakdown, clientLifecycle, waterfallRows } from './PrimeCircleAgencyData';
import { PCATooltip } from './PCAShared';

export function PCAOverviewTab() {
  const bgMap: Record<string, string> = {
    primarySoft: C.primarySoft, redSoft: C.redSoft, greenSoft: C.greenSoft, purpleSoft: C.purpleSoft,
  };

  return (
    <div>
      <div className="pca-kpi-grid">
        {[
          { label: "Gross Revenue", value: "$10,726", icon: "💰", sub: "Sub + Setup" },
          { label: "Total Depenses", value: "$6,237", icon: "📉", sub: "58.2% du revenue" },
          { label: "Net Revenue", value: "$4,489", icon: "📈", sub: "Marge 41.8%" },
          { label: "PCA Share (50%)", value: "$2,245", icon: "🤝", sub: "Du a Blink" },
          { label: "Transactions", value: "59", icon: "📋", sub: "21 New - 20 Trial" },
          { label: "Clients Actifs", value: "47", icon: "✅", sub: "12 Stopped" },
          { label: "Total Encaisse", value: "$28,975", icon: "🏦", sub: "Incl. CL media" },
          { label: "Media Gere", value: "$279.7K", icon: "📡", sub: "33 ad accounts" },
        ].map((kpi, i) => (
          <div key={i} className="pca-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="pca-kpi-label">{kpi.label}</div>
                <div className="pca-kpi-value">{kpi.value}</div>
                <div className="pca-kpi-sub">{kpi.sub}</div>
              </div>
              <span className="pca-kpi-icon">{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pca-two-col">
        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">Waterfall Revenue - Net</h3>
            <p className="pca-section-subtitle">Decomposition du P&L Janvier 2026</p>
          </div>
          <table className="pca-table">
            <tbody>
              {waterfallRows.map((r, i) => {
                if (r.v === null) return <tr key={i}><td colSpan={2} style={{ height: 8, border: 'none' }}></td></tr>;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: r.b ? 700 : 400, background: r.bg ? bgMap[r.bg] : 'transparent', textAlign: 'left' }}>{r.l}</td>
                    <td style={{ fontWeight: r.b ? 700 : 400, background: r.bg ? bgMap[r.bg] : 'transparent', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {typeof r.v === 'number' ? (r.v < 0 ? `(${fmtF(Math.abs(r.v))})` : fmtF(r.v)) : r.v}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">Repartition des Depenses</h3>
            <p className="pca-section-subtitle">$6,237 total - Chris Referral = 42.2%</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3}
                label={(e) => `${e.name} ${(e.percent * 100).toFixed(0)}%`} labelLine={{ stroke: C.textLight }}>
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={[C.accent, C.primary, C.orange, C.cyan, C.textLight][i]} />)}
              </Pie>
              <Tooltip content={<PCATooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pca-alert" style={{ background: C.orangeSoft, border: `1px solid rgba(245,158,11,0.15)`, color: C.orangeText }}>
            Chris Referral ($2,633) represente 42.2% des charges et depasse le salary ($1,200)
          </div>
        </div>
      </div>

      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Client Lifecycle - Janvier 2026</h3>
          <p className="pca-section-subtitle">62 transactions : 21 New, 20 Trial, 20 Renewed, 1 Upgraded</p>
        </div>
        <div className="pca-lifecycle-grid">
          {clientLifecycle.map((c, i) => {
            const soft = c.color === C.green ? C.greenSoft : c.color === C.orange ? C.orangeSoft : c.color === C.primary ? C.primarySoft : C.purpleSoft;
            return (
              <div key={i} className="pca-lifecycle-card" style={{ background: soft }}>
                <div className="pca-lifecycle-count" style={{ color: c.color }}>{c.count}</div>
                <div className="pca-lifecycle-label">{c.status}</div>
                <div className="pca-lifecycle-pct">{Math.round(c.count / 62 * 100)}% des tx</div>
              </div>
            );
          })}
          <div className="pca-lifecycle-card" style={{ background: C.redSoft }}>
            <div className="pca-lifecycle-count" style={{ color: C.red }}>14</div>
            <div className="pca-lifecycle-label">Stopped</div>
            <div className="pca-lifecycle-pct">23% des tx</div>
          </div>
        </div>
      </div>
    </div>
  );
}
