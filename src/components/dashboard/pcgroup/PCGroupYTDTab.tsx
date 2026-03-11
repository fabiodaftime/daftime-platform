import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type PCGroupMonthData } from './PCGroupData';

interface Props { data: PCGroupMonthData; }

export function PCGroupYTDTab({ data }: Props) {
  const { ytdHero, ytdMonthlyTable, ytdMonthlyTotal, ytdEntityTable, ytdEntityTotal, ytdTrendData } = data;

  return (
    <div>
      <div className="pcg-hero-grid">
        {ytdHero.map((kpi, i) => (
          <div key={i} className={`pcg-hero-card ${kpi.color}`}>
            <div className="pcg-hero-label">{kpi.label}</div>
            <div className="pcg-hero-value">{kpi.value}</div>
            <div className="pcg-hero-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📈 Évolution Mensuelle YTD</h3>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-charts-row">
            <div>
              <table className="pcg-comparison-table">
                <thead>
                  <tr><th>Mois</th><th>CA</th><th>Marge Brute</th><th>Taux</th><th>Résultat Net</th></tr>
                </thead>
                <tbody>
                  {ytdMonthlyTable.map((row, i) => (
                    <tr key={i}><td>{row.month}</td><td>{row.ca}</td><td>{row.margin}</td><td>{row.taux}</td><td>{row.net}</td></tr>
                  ))}
                  <tr className="pcg-comparison-total">
                    <td>{ytdMonthlyTotal.month}</td><td>{ytdMonthlyTotal.ca}</td><td>{ytdMonthlyTotal.margin}</td><td>{ytdMonthlyTotal.taux}</td><td>{ytdMonthlyTotal.net}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={ytdTrendData}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="ca" name="CA" fill="#1E3A5F" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="margin" name="Marge Brute" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="net" name="Résultat Net" fill="#C9A227" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">🏢 Marge Nette YTD par Entité</h3>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-comparison-table">
            <thead>
              <tr><th>Entité</th><th>Janvier</th><th>Février</th><th>YTD</th><th>% du Total</th></tr>
            </thead>
            <tbody>
              {ytdEntityTable.map((row, i) => (
                <tr key={i}><td>{row.entity}</td><td>{row.jan}</td><td>{row.feb}</td><td>{row.ytd}</td><td>{row.pct}</td></tr>
              ))}
              <tr className="pcg-comparison-total">
                <td>{ytdEntityTotal.entity}</td><td>{ytdEntityTotal.jan}</td><td>{ytdEntityTotal.feb}</td><td>{ytdEntityTotal.ytd}</td><td>{ytdEntityTotal.pct}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
