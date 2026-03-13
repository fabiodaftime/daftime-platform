import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart } from 'recharts';
import { C, fmtF, fmt, pctChg, PIE_COLORS, type PCAMonthData } from './PrimeCircleAgencyData';
import { PCATooltip } from './PCAShared';

interface Props { data: PCAMonthData; }

export function PCAOverviewTab({ data }: Props) {
  const hasPrev = data.prevGross > 0;

  const adsCost = data.expenseBreakdown.find(r => r.name === "Ads");
  const setupCost = data.expenseBreakdown.find(r => r.name === "Setup Cost");

  // Costs comparison data for bar chart
  const costsCompData = [
    { name: "Setup Cost", jan: data.waterfallRows.find(r => r.l === "Setup Cost")?.prev ? Math.abs(data.waterfallRows.find(r => r.l === "Setup Cost")!.prev) : 0, feb: setupCost?.value || 0 },
    { name: "Salary", jan: 1200, feb: 1200 },
    { name: "Ads", jan: data.waterfallRows.find(r => r.l === "Ads")?.prev ? Math.abs(data.waterfallRows.find(r => r.l === "Ads")!.prev) : 0, feb: adsCost?.value || 0 },
    { name: "Referrals", jan: data.waterfallRows.find(r => r.l === "Master Referral")?.prev ? Math.abs(data.waterfallRows.find(r => r.l === "Master Referral")!.prev) : 0, feb: (data.expenseBreakdown.find(r => r.name === "Master Referral")?.value || 0) + (data.expenseBreakdown.find(r => r.name === "No Limit Referral")?.value || 0) },
  ];

  // Margin data
  const marginData = data.monthlyTrend.map(m => ({
    month: m.month,
    gross: m.gross,
    expenses: m.expenses,
    marginPct: Number(((m.net / m.gross) * 100).toFixed(1)),
  }));

  // Media CC/CL comparison
  const mediaMoM = data.monthlyTrend.map(m => ({
    month: m.month,
    cc: m.ccMedia,
    cl: m.clMedia,
  }));

  // Transactions MoM
  const txMoM = data.monthlyTrend.map(m => ({
    month: m.month,
    new: m.newClients,
    renewed: m.renewed,
    upgraded: m.upgraded,
    trial: m.trial,
  }));

  // Revenue chart data (horizontal bar: Gross Revenue only)
  const revBarData = data.monthlyTrend.map(m => ({
    month: m.month,
    'Gross Revenue': m.gross,
  }));

  return (
    <div>
      {/* ── SECTION 1: REVENUE ── */}
      <div className="pca-section-header">Revenue</div>
      <div className="pca-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="pca-kpi-card pca-kpi-accent-green">
          <div className="pca-kpi-label">Gross Revenue</div>
          <div className="pca-kpi-value">{fmtF(data.gross)}</div>
          <div className="pca-kpi-sub">{hasPrev ? <span className="pca-change-badge">{pctChg(data.gross, data.prevGross)}</span> : null} {hasPrev ? `vs Jan (${fmtF(data.prevGross)})` : 'Sub + Setup'}</div>
        </div>
        <div className="pca-kpi-card pca-kpi-accent-blue">
          <div className="pca-kpi-label">Transactions</div>
          <div className="pca-kpi-value">{data.transactions}</div>
          <div className="pca-kpi-sub">{hasPrev ? <span className="pca-change-badge">{pctChg(data.transactions, data.prevTransactions)}</span> : null} {hasPrev ? `vs Jan (${data.prevTransactions})` : ''}</div>
        </div>
        <div className="pca-kpi-card pca-kpi-accent-orange">
          <div className="pca-kpi-label">Media Géré</div>
          <div className="pca-kpi-value">{fmt(data.mediaSpend)}</div>
          <div className="pca-kpi-sub">{hasPrev && data.prevMediaSpend > 0 ? <span className="pca-change-badge">{pctChg(data.mediaSpend, data.prevMediaSpend)}</span> : null} {hasPrev && data.prevMediaSpend > 0 ? `vs Jan (${fmt(data.prevMediaSpend)})` : ''}</div>
        </div>
      </div>

      {hasPrev && (
        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">Revenue — Jan vs Feb</h3>
            <p className="pca-section-subtitle">Gross Revenue (source : Summary of Financial Balance)</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <YAxis type="category" dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<PCATooltip />} />
              <Bar dataKey="Gross Revenue" radius={[0, 4, 4, 0]}>
                {revBarData.map((_, i) => (
                  <Cell key={i} fill={i === revBarData.length - 1 ? C.primary : C.textMuted} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── SECTION 2: COSTS ── */}
      <div className="pca-section-header">Costs</div>
      <div className="pca-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="pca-kpi-card pca-kpi-accent-red">
          <div className="pca-kpi-label">Total Expenses</div>
          <div className="pca-kpi-value">{fmtF(data.expenses)}</div>
          <div className="pca-kpi-sub">{hasPrev ? <span className="pca-change-badge">{pctChg(data.expenses, data.prevExpenses)}</span> : null} {hasPrev ? `vs Jan (${fmtF(data.prevExpenses)})` : ''}</div>
        </div>
        <div className="pca-kpi-card pca-kpi-accent-red">
          <div className="pca-kpi-label">Ads</div>
          <div className="pca-kpi-value">{fmtF(adsCost?.value || 0)}</div>
          <div className="pca-kpi-sub">{hasPrev && data.waterfallRows.find(r => r.l === "Ads")?.prev ? <span className="pca-change-badge">{pctChg(adsCost?.value || 0, Math.abs(data.waterfallRows.find(r => r.l === "Ads")!.prev))}</span> : null}</div>
        </div>
        <div className="pca-kpi-card pca-kpi-accent-orange">
          <div className="pca-kpi-label">Setup Cost</div>
          <div className="pca-kpi-value">{fmtF(setupCost?.value || 0)}</div>
          <div className="pca-kpi-sub">{hasPrev && data.waterfallRows.find(r => r.l === "Setup Cost")?.prev ? <span className="pca-change-badge">{pctChg(setupCost?.value || 0, Math.abs(data.waterfallRows.find(r => r.l === "Setup Cost")!.prev))}</span> : null}</div>
        </div>
        <div className="pca-kpi-card pca-kpi-accent-blue">
          <div className="pca-kpi-label">Expense Ratio</div>
          <div className="pca-kpi-value">{data.expenseRatio}%</div>
          <div className="pca-kpi-sub">{hasPrev ? `vs ${(data.prevExpenses / data.prevGross * 100).toFixed(1)}% en Jan` : ''}</div>
        </div>
      </div>

      <div className="pca-two-col">
        <div className="pca-section">
          <h3 className="pca-section-title">Répartition des Charges</h3>
          <p className="pca-section-subtitle">{fmtF(data.expenses)} total — Ads = {((adsCost?.value || 0) / data.expenses * 100).toFixed(0)}%</p>
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

        {hasPrev && (
          <div className="pca-section">
            <h3 className="pca-section-title">Charges — Jan vs Feb</h3>
            <p className="pca-section-subtitle">Évolution par poste</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={costsCompData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
                <XAxis dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <Tooltip content={<PCATooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="jan" name="Jan-26" fill="#8899A6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="feb" name="Feb-26" fill={C.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── SECTION 3: GROSS MARGIN ── */}
      <div className="pca-section-header">Gross Margin</div>
      <div className="pca-two-col">
        <div className="pca-section">
          <table className="pca-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}></th>
                {hasPrev && <th style={{ textAlign: 'right' }}>Jan-26</th>}
                <th style={{ textAlign: 'right' }}>Feb-26</th>
                {hasPrev && <th style={{ textAlign: 'right' }}>Variation</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, textAlign: 'left' }}>Gross Revenue</td>
                {hasPrev && <td style={{ textAlign: 'right' }}>{fmtF(data.prevGross)}</td>}
                <td style={{ textAlign: 'right' }}>{fmtF(data.gross)}</td>
                {hasPrev && <td style={{ textAlign: 'right' }}><span className="pca-change-badge">{pctChg(data.gross, data.prevGross)}</span></td>}
              </tr>
              <tr>
                <td style={{ fontWeight: 700, textAlign: 'left' }}>Total Expenses</td>
                {hasPrev && <td style={{ textAlign: 'right' }}>{fmtF(data.prevExpenses)}</td>}
                <td style={{ textAlign: 'right' }}>{fmtF(data.expenses)}</td>
                {hasPrev && <td style={{ textAlign: 'right' }}><span className="pca-change-badge">{pctChg(data.expenses, data.prevExpenses)}</span></td>}
              </tr>
              <tr style={{ background: C.surfaceAlt }}>
                <td style={{ fontWeight: 700, textAlign: 'left' }}>Gross Margin ($)</td>
                {hasPrev && <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(data.prevNet)}</td>}
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(data.net)}</td>
                {hasPrev && <td style={{ textAlign: 'right' }}><span className="pca-change-badge">{pctChg(data.net, data.prevNet)}</span></td>}
              </tr>
              <tr style={{ background: C.surfaceAlt }}>
                <td style={{ fontWeight: 700, textAlign: 'left' }}>Gross Margin (%)</td>
                {hasPrev && <td style={{ textAlign: 'right', fontWeight: 700 }}>{(data.prevNet / data.prevGross * 100).toFixed(1)}%</td>}
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{data.marginPct}%</td>
                {hasPrev && <td style={{ textAlign: 'right' }}><span className="pca-change-badge">+{(data.marginPct - data.prevNet / data.prevGross * 100).toFixed(1)} pts</span></td>}
              </tr>
            </tbody>
          </table>
        </div>

        {hasPrev && (
          <div className="pca-section">
            <h3 className="pca-section-title">Marge Brute — Jan vs Feb</h3>
            <p className="pca-section-subtitle">En montant et en pourcentage</p>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
                <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: C.greenText, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip content={<PCATooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gross" name="Gross Revenue" fill={C.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={C.red} radius={[4, 4, 0, 0]} opacity={0.7} />
                <Line yAxisId="right" dataKey="marginPct" name="Marge %" type="monotone" stroke={C.green} strokeWidth={3} dot={{ r: 5, fill: C.green, strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── SECTION 4: NET RESULT ── */}
      <div className="pca-section-header">Net Result</div>
      <div className="pca-waterfall-section">
        <div style={{ marginBottom: 16, fontWeight: 700, fontSize: 15, color: '#fff' }}>P&L Waterfall — {data.monthLabel}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Gross Revenue & Expenses : Summary of Financial Balance. Detail Sub/Setup/Disc : indicatif (Client Master)</div>
        <table className="pca-waterfall-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Ligne</th>
              <th style={{ textAlign: 'right' }}>{data.monthShort.replace(' ', '-')}</th>
              {hasPrev && <th style={{ textAlign: 'right' }}>Jan-26</th>}
              {hasPrev && <th style={{ textAlign: 'right' }}>Variation</th>}
            </tr>
          </thead>
          <tbody>
            {data.waterfallRows.map((r, i) => (
              <tr key={i} className={r.b ? 'pca-wf-highlight' : ''}>
                <td style={{ textAlign: 'left' }}>{r.l}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: r.b ? 700 : 400 }}>
                  {r.v < 0 ? `-${fmtF(Math.abs(r.v))}` : fmtF(r.v)}
                </td>
                {hasPrev && (
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.prev !== 0 ? (r.prev < 0 ? `-${fmtF(Math.abs(r.prev))}` : fmtF(r.prev)) : '—'}
                  </td>
                )}
                {hasPrev && (
                  <td style={{ textAlign: 'right' }}>
                    {r.prev !== 0 ? pctChg(Math.abs(r.v), Math.abs(r.prev)) : 'NEW'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pca-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="pca-kpi-card pca-kpi-accent-blue">
          <div className="pca-kpi-label">Net Revenue</div>
          <div className="pca-kpi-value">{fmtF(data.net)}</div>
          <div className="pca-kpi-sub">{hasPrev ? <span className="pca-change-badge">{pctChg(data.net, data.prevNet)}</span> : null} {hasPrev ? `vs Jan (${fmtF(data.prevNet)})` : ''}</div>
        </div>
        <div className="pca-kpi-card pca-kpi-accent-purple">
          <div className="pca-kpi-label">PCA Share (50%)</div>
          <div className="pca-kpi-value">{fmtF(data.pcaShare)}</div>
          <div className="pca-kpi-sub">{hasPrev ? <span className="pca-change-badge">{pctChg(data.pcaShare, data.prevPcaShare)}</span> : null} {hasPrev ? `vs Jan (${fmtF(data.prevPcaShare)})` : ''}</div>
        </div>
        <div className="pca-kpi-card pca-kpi-accent-green">
          <div className="pca-kpi-label">Net Margin</div>
          <div className="pca-kpi-value">{data.marginPct}%</div>
          <div className="pca-kpi-sub">{hasPrev ? `vs ${(data.prevNet / data.prevGross * 100).toFixed(1)}% en Jan (+${(data.marginPct - data.prevNet / data.prevGross * 100).toFixed(1)} pts)` : ''}</div>
        </div>
      </div>

      {/* ── SECTION 5: MoM EVOLUTION ── */}
      {data.monthlyTrend.length > 1 && (
        <>
          <div className="pca-section-header">MoM Evolution</div>
          <div className="pca-section">
            <h3 className="pca-section-title">Revenu Brut, Net et Charges — Jan vs Feb</h3>
            <p className="pca-section-subtitle">Comparatif mensuel</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
                <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <Tooltip content={<PCATooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gross" name="Revenu Brut" fill={C.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Charges" fill={C.red} radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Revenu Net" fill={C.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pca-two-col">
            <div className="pca-section">
              <h3 className="pca-section-title">Media Spend — Jan vs Feb</h3>
              <p className="pca-section-subtitle">Évolution du volume géré</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mediaMoM}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
                  <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                  <Tooltip content={<PCATooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="cc" name="CC Spend" fill={C.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cl" name="CL Spend" fill={C.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pca-section">
              <h3 className="pca-section-title">Transactions — Jan vs Feb</h3>
              <p className="pca-section-subtitle">Volume d'activité</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={txMoM}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
                  <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<PCATooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="new" name="New" fill={C.green} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="renewed" name="Renewed" fill={C.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="upgraded" name="Upgraded" fill={C.purple} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="trial" name="Trial" fill={C.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ── CLIENT LIFECYCLE ── */}
      <div className="pca-section-header">Client Lifecycle — {data.monthLabel}</div>
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
  );
}
