import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { C, fmtF, fmt, type PCAMonthData } from './PrimeCircleAgencyData';
import { PCATooltip } from './PCAShared';

interface Props { data: PCAMonthData; }

export function PCAYTDTab({ data }: Props) {
  const hasPrev = data.prevGross > 0;

  const ytdChartData = data.monthlyTrend.map(m => ({
    month: m.month,
    'Gross Revenue': m.gross,
    Expenses: m.expenses,
    'Net Revenue': m.net,
    'PCA Share': Math.round(m.net / 2),
  }));

  return (
    <div>
      <div className="pca-section-header">YTD Performance — 2026</div>
      <div className="pca-ytd-grid">
        <div className="pca-ytd-card">
          <div className="pca-ytd-label">YTD Gross Revenue</div>
          <div className="pca-ytd-value">{fmtF(data.ytdGross)}</div>
          {hasPrev && <div className="pca-ytd-detail">Jan {fmtF(data.prevGross)} + Feb {fmtF(data.gross)}</div>}
        </div>
        <div className="pca-ytd-card">
          <div className="pca-ytd-label">YTD Total Expenses</div>
          <div className="pca-ytd-value">{fmtF(data.ytdExpenses)}</div>
          {hasPrev && <div className="pca-ytd-detail">Jan {fmtF(data.prevExpenses)} + Feb {fmtF(data.expenses)}</div>}
        </div>
      </div>
      <div className="pca-ytd-grid">
        <div className="pca-ytd-card">
          <div className="pca-ytd-label">YTD Net Revenue</div>
          <div className="pca-ytd-value">{fmtF(data.ytdNet)}</div>
          {hasPrev && <div className="pca-ytd-detail">Jan {fmtF(data.prevNet)} + Feb {fmtF(data.net)}</div>}
        </div>
        <div className="pca-ytd-card">
          <div className="pca-ytd-label">YTD PCA Share</div>
          <div className="pca-ytd-value">{fmtF(data.ytdPcaShare)}</div>
          {hasPrev && <div className="pca-ytd-detail">Jan {fmtF(data.prevPcaShare)} + Feb {fmtF(data.pcaShare)}</div>}
        </div>
      </div>

      <div className="pca-section">
        <h3 className="pca-section-title">Synthèse YTD</h3>
        <p className="pca-section-subtitle">Janvier — Février 2026</p>
        <table className="pca-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Métrique</th>
              {hasPrev && <th style={{ textAlign: 'right' }}>Jan-26</th>}
              <th style={{ textAlign: 'right' }}>Feb-26</th>
              <th style={{ textAlign: 'right' }}>YTD 2026</th>
              {hasPrev && <th style={{ textAlign: 'right' }}>Poids Feb (%)</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 700, textAlign: 'left' }}>Gross Revenue</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{fmtF(data.prevGross)}</td>}
              <td style={{ textAlign: 'right' }}>{fmtF(data.gross)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(data.ytdGross)}</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{(data.gross / data.ytdGross * 100).toFixed(1)}%</td>}
            </tr>
            <tr>
              <td style={{ fontWeight: 700, textAlign: 'left' }}>Total Expenses</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{fmtF(data.prevExpenses)}</td>}
              <td style={{ textAlign: 'right' }}>{fmtF(data.expenses)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(data.ytdExpenses)}</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{(data.expenses / data.ytdExpenses * 100).toFixed(1)}%</td>}
            </tr>
            <tr>
              <td style={{ fontWeight: 700, textAlign: 'left' }}>Net Revenue</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{fmtF(data.prevNet)}</td>}
              <td style={{ textAlign: 'right' }}>{fmtF(data.net)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(data.ytdNet)}</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{(data.net / data.ytdNet * 100).toFixed(1)}%</td>}
            </tr>
            <tr>
              <td style={{ fontWeight: 700, textAlign: 'left' }}>PCA Share (50%)</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{fmtF(data.prevPcaShare)}</td>}
              <td style={{ textAlign: 'right' }}>{fmtF(data.pcaShare)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(data.ytdPcaShare)}</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{(data.pcaShare / data.ytdPcaShare * 100).toFixed(1)}%</td>}
            </tr>
            <tr>
              <td style={{ fontWeight: 700, textAlign: 'left' }}>Media Spend</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{fmtF(data.prevMediaSpend)}</td>}
              <td style={{ textAlign: 'right' }}>{fmtF(data.mediaSpend)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(data.prevMediaSpend + data.mediaSpend)}</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{(data.mediaSpend / (data.prevMediaSpend + data.mediaSpend) * 100).toFixed(1)}%</td>}
            </tr>
            <tr>
              <td style={{ fontWeight: 700, textAlign: 'left' }}>Transactions</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{data.prevTransactions}</td>}
              <td style={{ textAlign: 'right' }}>{data.transactions}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{data.prevTransactions + data.transactions}</td>
              {hasPrev && <td style={{ textAlign: 'right' }}>{(data.transactions / (data.prevTransactions + data.transactions) * 100).toFixed(1)}%</td>}
            </tr>
          </tbody>
        </table>
      </div>

      {data.monthlyTrend.length > 1 && (
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
