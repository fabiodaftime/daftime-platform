import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { C, fmtF, fmt, PCA_AVAILABLE_MONTHS, getPCAMonthData, type PCAMonthData, type PCAMonthId } from './PrimeCircleAgencyData';
import { PCATooltip } from './PCAShared';

interface Props { data: PCAMonthData; }

export function PCAYTDTab({ data }: Props) {
  // Months from Jan up to (and including) the currently selected one.
  const ytdMonthIds = (() => {
    const ids = PCA_AVAILABLE_MONTHS.map((m) => m.id as PCAMonthId);
    const idx = ids.indexOf(data.monthId);
    return idx >= 0 ? ids.slice(0, idx + 1) : ids;
  })();
  const ytdMonths: PCAMonthData[] = ytdMonthIds.map((id) => getPCAMonthData(id));
  const currentLabel = data.monthShort.replace(' ', '-');
  const periodLabel =
    ytdMonths.length === 1
      ? ytdMonths[0].monthLabel
      : `${ytdMonths[0].monthLabel} — ${ytdMonths[ytdMonths.length - 1].monthLabel}`;

  // YTD totals (recomputed from each month's own data).
  const ytdGross = ytdMonths.reduce((s, m) => s + m.gross, 0);
  const ytdExpenses = ytdMonths.reduce((s, m) => s + m.expenses, 0);
  const ytdNet = ytdMonths.reduce((s, m) => s + m.net, 0);
  const ytdPcaShare = ytdMonths.reduce((s, m) => s + m.pcaShare, 0);
  const ytdMediaSpend = ytdMonths.reduce((s, m) => s + m.mediaSpend, 0);
  const ytdTransactions = ytdMonths.reduce((s, m) => s + m.transactions, 0);

  const ytdChartData = data.monthlyTrend.slice(0, ytdMonths.length).map((m) => ({
    month: m.month,
    'Gross Revenue': m.gross,
    Expenses: m.expenses,
    'Net Revenue': m.net,
    'PCA Share': Math.round(m.net / 2),
  }));

  const buildBreakdown = (sub: string) =>
    ytdMonths.map((m) => `${m.monthShort} ${sub}`).join(' · ');

  return (
    <div>
      <div className="pca-section-header">YTD Performance — 2026</div>
      <div className="pca-ytd-grid">
        <div className="pca-ytd-card">
          <div className="pca-ytd-label">YTD Gross Revenue</div>
          <div className="pca-ytd-value">{fmtF(ytdGross)}</div>
          <div className="pca-ytd-detail">{ytdMonths.map((m) => `${m.monthShort} ${fmtF(m.gross)}`).join(' + ')}</div>
        </div>
        <div className="pca-ytd-card">
          <div className="pca-ytd-label">YTD Total Expenses</div>
          <div className="pca-ytd-value">{fmtF(ytdExpenses)}</div>
          <div className="pca-ytd-detail">{ytdMonths.map((m) => `${m.monthShort} ${fmtF(m.expenses)}`).join(' + ')}</div>
        </div>
      </div>
      <div className="pca-ytd-grid">
        <div className="pca-ytd-card">
          <div className="pca-ytd-label">YTD Net Revenue</div>
          <div className="pca-ytd-value">{fmtF(ytdNet)}</div>
          <div className="pca-ytd-detail">{ytdMonths.map((m) => `${m.monthShort} ${fmtF(m.net)}`).join(' + ')}</div>
        </div>
        <div className="pca-ytd-card">
          <div className="pca-ytd-label">YTD PCA Share</div>
          <div className="pca-ytd-value">{fmtF(ytdPcaShare)}</div>
          <div className="pca-ytd-detail">{ytdMonths.map((m) => `${m.monthShort} ${fmtF(m.pcaShare)}`).join(' + ')}</div>
        </div>
      </div>

      <div className="pca-section">
        <h3 className="pca-section-title">Synthèse YTD</h3>
        <p className="pca-section-subtitle">{periodLabel}</p>
        <table className="pca-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Métrique</th>
              {ytdMonths.map((m) => (
                <th
                  key={m.monthId}
                  style={{
                    textAlign: 'right',
                    background: m.monthId === data.monthId ? 'rgba(30, 86, 160, 0.10)' : undefined,
                  }}
                >
                  {m.monthShort.replace(' ', '-')}{m.monthId === data.monthId ? ' ★' : ''}
                </th>
              ))}
              <th style={{ textAlign: 'right' }}>YTD 2026</th>
              <th style={{ textAlign: 'right' }}>Poids {currentLabel} (%)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Gross Revenue', vals: ytdMonths.map((m) => m.gross), total: ytdGross, current: data.gross },
              { label: 'Total Expenses', vals: ytdMonths.map((m) => m.expenses), total: ytdExpenses, current: data.expenses },
              { label: 'Net Revenue', vals: ytdMonths.map((m) => m.net), total: ytdNet, current: data.net },
              { label: 'PCA Share (50%)', vals: ytdMonths.map((m) => m.pcaShare), total: ytdPcaShare, current: data.pcaShare },
              { label: 'Media Spend', vals: ytdMonths.map((m) => m.mediaSpend), total: ytdMediaSpend, current: data.mediaSpend, fmtFn: fmt },
              { label: 'Transactions', vals: ytdMonths.map((m) => m.transactions), total: ytdTransactions, current: data.transactions, raw: true },
            ].map((row, i) => {
              const fmtFn = row.raw ? (n: number) => String(n) : (row.fmtFn || fmtF);
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 700, textAlign: 'left' }}>{row.label}</td>
                  {row.vals.map((v, j) => (
                    <td
                      key={j}
                      style={{
                        textAlign: 'right',
                        background: ytdMonths[j].monthId === data.monthId ? 'rgba(30, 86, 160, 0.06)' : undefined,
                        fontWeight: ytdMonths[j].monthId === data.monthId ? 600 : 400,
                      }}
                    >
                      {fmtFn(v)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtFn(row.total)}</td>
                  <td style={{ textAlign: 'right' }}>{row.total ? ((row.current / row.total) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ytdChartData.length > 1 && (
        <div className="pca-section">
          <h3 className="pca-section-title">YTD — Gross Revenue vs Expenses vs Net</h3>
          <p className="pca-section-subtitle">Répartition par mois</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ytdChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <Tooltip content={<PCATooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Gross Revenue" fill={C.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill={C.red} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net Revenue" fill={C.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="PCA Share" fill={C.purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
