import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { C, fmtF, fmt, pctChg, PIE_COLORS, type PCAMonthData } from './PrimeCircleAgencyData';
import { PCATooltip } from './PCAShared';

interface Props { data: PCAMonthData; }

export function PCAOverviewTab({ data }: Props) {
  const bgMap: Record<string, string> = {
    primarySoft: C.primarySoft, redSoft: C.redSoft, greenSoft: C.greenSoft, purpleSoft: C.purpleSoft, accentSoft: C.accentSoft,
  };

  const hasPrev = data.prevGross > 0;
  const kpis = [
    { label: "Gross Revenue", value: fmtF(data.gross), icon: "💰", sub: hasPrev ? `${pctChg(data.gross, data.prevGross)} vs M-1 (${fmtF(data.prevGross)})` : "Sub + Setup" },
    { label: "Total Expenses", value: fmtF(data.expenses), icon: "📉", sub: hasPrev ? `${pctChg(data.expenses, data.prevExpenses)} vs M-1 (${fmtF(data.prevExpenses)})` : `${(data.expenses / data.gross * 100).toFixed(1)}% du revenue` },
    { label: "Net Revenue", value: fmtF(data.net), icon: "🏆", sub: hasPrev ? `${pctChg(data.net, data.prevNet)} vs M-1 (${fmtF(data.prevNet)})` : `Marge ${data.marginPct}%` },
    { label: "PCA Share (50%)", value: fmtF(data.pcaShare), icon: "🤝", sub: hasPrev ? `${pctChg(data.pcaShare, data.prevPcaShare)} vs M-1` : "Du a Blink" },
    { label: "Transactions", value: String(data.transactions), icon: "📋", sub: hasPrev ? `${pctChg(data.transactions, data.prevTransactions)} vs M-1 (${data.prevTransactions})` : `${data.clientLifecycle[0]?.count} New` },
    { label: "Media Gere", value: fmt(data.mediaSpend), icon: "📡", sub: hasPrev ? `${pctChg(data.mediaSpend, data.prevMediaSpend)} vs M-1 (${fmt(data.prevMediaSpend)})` : `${data.adAccounts} ad accounts` },
    { label: "YTD Net Rev", value: fmtF(data.ytdNet), icon: "📅", sub: "YTD 2026" },
    { label: "YTD PCA Share", value: fmtF(data.ytdPcaShare), icon: "💎", sub: "YTD 2026" },
  ];

  return (
    <div>
      <div className="pca-kpi-grid">
        {kpis.map((kpi, i) => (
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
            <h3 className="pca-section-title">P&L Waterfall - {data.monthLabel}</h3>
            <p className="pca-section-subtitle">Du revenu brut au split PCA</p>
          </div>
          <table className="pca-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Ligne</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                {hasPrev && <th style={{ textAlign: 'right' }}>vs M-1</th>}
              </tr>
            </thead>
            <tbody>
              {data.waterfallRows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: r.b ? 700 : 400, background: r.bg ? bgMap[r.bg] || 'transparent' : 'transparent', textAlign: 'left' }}>{r.l}</td>
                  <td style={{ fontWeight: r.b ? 700 : 400, background: r.bg ? bgMap[r.bg] || 'transparent' : 'transparent', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.v < 0 ? `-${fmtF(Math.abs(r.v))}` : fmtF(r.v)}
                  </td>
                  {hasPrev && (
                    <td style={{ textAlign: 'right', color: C.textMuted, fontSize: 11, background: r.bg ? bgMap[r.bg] || 'transparent' : 'transparent' }}>
                      {r.prev !== 0 ? pctChg(Math.abs(r.v), Math.abs(r.prev)) : "NEW"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">Charges Operationnelles</h3>
            <p className="pca-section-subtitle">{`${fmtF(data.expenses)} total`}</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={3}
                label={(e) => `${e.name} $${e.value.toLocaleString()}`} labelLine={{ stroke: C.textLight }}>
                {data.expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<PCATooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.monthlyTrend.length > 1 && (
        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">Comparatif Mensuel</h3>
            <p className="pca-section-subtitle">Revenu brut, net et charges</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data.monthlyTrend}>
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
      )}

      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Client Lifecycle - {data.monthLabel}</h3>
          <p className="pca-section-subtitle">{data.transactions} transactions</p>
        </div>
        <div className="pca-lifecycle-grid">
          {data.clientLifecycle.map((c, i) => (
            <div key={i} className="pca-lifecycle-card" style={{ background: c.color + "10" }}>
              <div className="pca-lifecycle-count" style={{ color: c.color }}>{c.count}</div>
              <div className="pca-lifecycle-label">{c.status}</div>
              <div className="pca-lifecycle-pct">{Math.round(c.count / data.transactions * 100)}% des tx</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
