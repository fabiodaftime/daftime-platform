import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { C, fmtF, fmt, pctChg, expenseBreakdown, clientLifecycle, waterfallRows, monthlyTrend, PIE_COLORS, janData, febData, ytdData } from './PrimeCircleAgencyData';
import { PCATooltip } from './PCAShared';

export function PCAOverviewTab() {
  const bgMap: Record<string, string> = {
    primarySoft: C.primarySoft, redSoft: C.redSoft, greenSoft: C.greenSoft, purpleSoft: C.purpleSoft, accentSoft: C.accentSoft,
  };

  return (
    <div>
      <div className="pca-kpi-grid">
        {[
          { label: "Gross Revenue", value: "$35,080", icon: "💰", sub: `${pctChg(35080, 10726)} vs Jan ($10,726)` },
          { label: "Total Expenses", value: "$10,606", icon: "📉", sub: `${pctChg(10606, 6237)} vs Jan ($6,237)` },
          { label: "Net Revenue", value: "$24,473", icon: "🏆", sub: `${pctChg(24473, 4489)} vs Jan ($4,489)` },
          { label: "PCA Share (50%)", value: "$12,237", icon: "🤝", sub: `${pctChg(12237, 2244)} vs Jan` },
          { label: "Transactions", value: "145", icon: "📋", sub: `${pctChg(145, 62)} vs Jan (62)` },
          { label: "Media Gere", value: "$516.0K", icon: "📡", sub: `${pctChg(515952, 279691)} vs Jan ($279.7K)` },
          { label: "YTD Net Rev", value: "$28,962", icon: "📅", sub: "Jan + Feb 2026" },
          { label: "YTD PCA Share", value: "$14,481", icon: "💎", sub: "Jan + Feb 2026" },
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
            <h3 className="pca-section-title">P&L Waterfall - Fevrier 2026</h3>
            <p className="pca-section-subtitle">Du revenu brut au split PCA</p>
          </div>
          <table className="pca-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Ligne</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th style={{ textAlign: 'right' }}>vs Jan</th>
              </tr>
            </thead>
            <tbody>
              {waterfallRows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: r.b ? 700 : 400, background: r.bg ? bgMap[r.bg] : 'transparent', textAlign: 'left' }}>{r.l}</td>
                  <td style={{ fontWeight: r.b ? 700 : 400, background: r.bg ? bgMap[r.bg] : 'transparent', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.v < 0 ? `-${fmtF(Math.abs(r.v))}` : fmtF(r.v)}
                  </td>
                  <td style={{ textAlign: 'right', color: C.textMuted, fontSize: 11, background: r.bg ? bgMap[r.bg] : 'transparent' }}>
                    {r.jan !== 0 ? pctChg(Math.abs(r.v), Math.abs(r.jan)) : "NEW"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">Charges Operationnelles</h3>
            <p className="pca-section-subtitle">{`$10,606 total - Ads = ${(6666/10606*100).toFixed(0)}%`}</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={3}
                label={(e) => `${e.name} $${e.value.toLocaleString()}`} labelLine={{ stroke: C.textLight }}>
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<PCATooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Comparatif Jan vs Feb 2026</h3>
          <p className="pca-section-subtitle">Revenu brut, net et charges</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
            <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
            <Tooltip content={<PCATooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="gross" name="Revenu Brut" fill={C.primary} radius={[5, 5, 0, 0]} barSize={22} />
            <Bar dataKey="expenses" name="Charges" fill={C.red} radius={[5, 5, 0, 0]} barSize={22} opacity={0.6} />
            <Line dataKey="net" name="Revenu Net" type="monotone" stroke={C.green} strokeWidth={3} dot={{ r: 5, fill: C.green, strokeWidth: 2, stroke: "#fff" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Client Lifecycle - Fevrier 2026</h3>
          <p className="pca-section-subtitle">145 transactions : 116 New, 20 Renewed, 6 Upgraded, 3 Trial</p>
        </div>
        <div className="pca-lifecycle-grid">
          {clientLifecycle.map((c, i) => (
            <div key={i} className="pca-lifecycle-card" style={{ background: c.color + "10" }}>
              <div className="pca-lifecycle-count" style={{ color: c.color }}>{c.count}</div>
              <div className="pca-lifecycle-label">{c.status}</div>
              <div className="pca-lifecycle-pct">{Math.round(c.count / 145 * 100)}% des tx</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
