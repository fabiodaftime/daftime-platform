import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart } from 'recharts';
import { C, fmtF, fmt, pctChg, PIE_COLORS, PCA_AVAILABLE_MONTHS, getPCAMonthData, type PCAMonthData, type PCAMonthId } from './PrimeCircleAgencyData';
import { PCATooltip } from './PCAShared';

interface Props { data: PCAMonthData; }

export function PCAOverviewTab({ data }: Props) {
  const hasPrev = data.prevGross > 0;

  // YTD months up to and including the currently selected one
  const ytdMonthIds = (() => {
    const ids = PCA_AVAILABLE_MONTHS.map((m) => m.id as PCAMonthId);
    const idx = ids.indexOf(data.monthId);
    return idx >= 0 ? ids.slice(0, idx + 1) : ids;
  })();
  const ytdMonths: PCAMonthData[] = ytdMonthIds.map((id) => getPCAMonthData(id));

  // Aggregated YTD expense breakdown across all months up to current
  const ytdExpenseBreakdown = (() => {
    const acc = new Map<string, number>();
    ytdMonths.forEach((m) => {
      m.expenseBreakdown.forEach((e) => acc.set(e.name, (acc.get(e.name) || 0) + e.value));
    });
    return Array.from(acc.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();
  const ytdExpensesTotal = ytdExpenseBreakdown.reduce((s, e) => s + e.value, 0);
  const ytdAdsValue = ytdExpenseBreakdown.find((e) => e.name === 'Ads')?.value || 0;

  const adsCost = data.expenseBreakdown.find(r => r.name === "Ads");
  const setupCost = data.expenseBreakdown.find(r => r.name === "Setup Cost");

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
          <h3 className="pca-section-title">Répartition des Charges — YTD</h3>
          <p className="pca-section-subtitle">{fmtF(ytdExpensesTotal)} cumulés ({ytdMonths.length} mois) — Ads = {ytdExpensesTotal ? ((ytdAdsValue / ytdExpensesTotal) * 100).toFixed(0) : 0}%</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={ytdExpenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={3}
                label={(e) => `${e.name} $${e.value.toLocaleString()}`} labelLine={{ stroke: C.textLight }}>
                {ytdExpenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<PCATooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {hasPrev && (() => {
          const expensesYTD = data.monthlyTrend.map((m) => ({
            month: m.month,
            expenses: m.expenses,
            ratio: m.gross > 0 ? Number(((m.expenses / m.gross) * 100).toFixed(1)) : 0,
          }));
          const totalYTD = expensesYTD.reduce((s, m) => s + m.expenses, 0);
          const avgYTD = expensesYTD.length ? totalYTD / expensesYTD.length : 0;
          return (
            <div className="pca-section">
              <h3 className="pca-section-title">Charges — YTD mensualisé</h3>
              <p className="pca-section-subtitle">
                Total YTD {fmtF(totalYTD)} · Moyenne {fmtF(avgYTD)} / mois
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={expensesYTD}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
                  <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<PCATooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="expenses" name="Charges" fill={C.red} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="ratio" name="% du CA" stroke={C.primary} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          );
        })()}
      </div>

      {/* ── SECTION 3: GROSS MARGIN ── */}
      <div className="pca-section-header">Gross Margin</div>
      <div className="pca-two-col">
        <div className="pca-section">
          <h3 className="pca-section-title">Gross Margin — YTD mensualisé</h3>
          <p className="pca-section-subtitle">Détail mois par mois + total YTD</p>
          {(() => {
            const trend = data.monthlyTrend.slice(0, ytdMonths.length);
            const tot = trend.reduce(
              (s, m) => ({ gross: s.gross + m.gross, expenses: s.expenses + m.expenses, net: s.net + m.net }),
              { gross: 0, expenses: 0, net: 0 },
            );
            return (
              <table className="pca-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Mois</th>
                    <th style={{ textAlign: 'right' }}>Gross Rev.</th>
                    <th style={{ textAlign: 'right' }}>Expenses</th>
                    <th style={{ textAlign: 'right' }}>Gross Margin</th>
                    <th style={{ textAlign: 'right' }}>Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, textAlign: 'left' }}>{m.month}</td>
                      <td style={{ textAlign: 'right' }}>{fmtF(m.gross)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtF(m.expenses)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtF(m.net)}</td>
                      <td style={{ textAlign: 'right' }}>{m.gross > 0 ? ((m.net / m.gross) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                  ))}
                  <tr style={{ background: C.surfaceAlt }}>
                    <td style={{ fontWeight: 700, textAlign: 'left' }}>YTD</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(tot.gross)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(tot.expenses)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(tot.net)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{tot.gross > 0 ? ((tot.net / tot.gross) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                </tbody>
              </table>
            );
          })()}
        </div>

        {hasPrev && (
          <div className="pca-section">
            <h3 className="pca-section-title">Marge Brute — YTD mensualisé</h3>
            <p className="pca-section-subtitle">Évolution mois par mois (montants & %)</p>
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
