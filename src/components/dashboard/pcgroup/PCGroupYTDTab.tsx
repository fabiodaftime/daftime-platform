import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type PCGroupMonthData } from './PCGroupData';

interface Props { data: PCGroupMonthData; }

export function PCGroupYTDTab({ data }: Props) {
  const { ytdHero, ytdMonthlyTable, ytdMonthlyTotal, ytdEntityTable, ytdEntityTotal, ytdTrendData, reservesEntityTable, reservesEntityTotal } = data;

  const hasMar = Boolean((ytdEntityTotal as any).mar);
  const hasAvr = Boolean((ytdEntityTotal as any).avr);
  const monthsCount = 2 + (hasMar ? 1 : 0) + (hasAvr ? 1 : 0);
  const colSpan = monthsCount + 2; // label + months + ytd
  const titleSuffix = hasAvr
    ? 'Janvier / Février / Mars / Avril / YTD 2026'
    : hasMar
      ? 'Janvier / Février / Mars / YTD 2026'
      : 'Janvier / Février / YTD 2026';

  // Mois courant = dernier mois renseigné
  const currentKey: 'jan' | 'feb' | 'mar' | 'avr' = hasAvr ? 'avr' : hasMar ? 'mar' : 'feb';
  const currentLabel = { jan: 'Janvier', feb: 'Février', mar: 'Mars', avr: 'Avril' }[currentKey];
  const HL_BG = 'rgba(212, 168, 85, 0.12)';
  const HL_BORDER = '2px solid var(--pcg-gold)';
  const hlCell = (key: 'jan' | 'feb' | 'mar' | 'avr', extra: React.CSSProperties = {}): React.CSSProperties =>
    key === currentKey
      ? { background: HL_BG, borderLeft: HL_BORDER, borderRight: HL_BORDER, ...extra }
      : extra;
  const hlHeader = (key: 'jan' | 'feb' | 'mar' | 'avr'): React.CSSProperties =>
    key === currentKey
      ? {
          textAlign: 'right',
          background: 'var(--pcg-gold)',
          color: 'var(--pcg-navy)',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          fontWeight: 700,
        }
      : { textAlign: 'right' };

  const monthCells = (row: any, color?: string) => (
    <>
      <td style={hlCell('jan', { textAlign: 'right', color: color ?? undefined })}>{row.jan ?? '—'}</td>
      <td style={hlCell('feb', { textAlign: 'right', color: color ?? undefined })}>{row.feb ?? '—'}</td>
      {hasMar && <td style={hlCell('mar', { textAlign: 'right', color: color ?? undefined })}>{row.mar ?? '—'}</td>}
      {hasAvr && <td style={hlCell('avr', { textAlign: 'right', color: color ?? undefined })}>{row.avr ?? '—'}</td>}
    </>
  );

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

      {/* Évolution Mensuelle */}
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

      {/* Full P&L Consolidé Table */}
      {ytdMonthlyTable.length > 1 && (
        <div className="pcg-section">
          <div className="pcg-section-header">
            <h3 className="pcg-section-title">📊 P&L Consolidé — {titleSuffix}</h3>
          </div>
          <div className="pcg-section-body">
            <table className="pcg-comparison-table" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Ligne</th>
                  <th style={{ textAlign: 'right' }}>Janvier</th>
                  <th style={{ textAlign: 'right' }}>Février</th>
                  {hasMar && <th style={{ textAlign: 'right' }}>Mars</th>}
                  {hasAvr && <th style={{ textAlign: 'right' }}>Avril</th>}
                  <th style={{ textAlign: 'right' }}>YTD 2026</th>
                </tr>
              </thead>
              <tbody>
                {/* Marges par entité */}
                <tr style={{ background: 'rgba(30, 58, 95, 0.05)' }}>
                  <td colSpan={colSpan} style={{ fontWeight: 600, color: '#1E3A5F', paddingTop: '1rem' }}>MARGES NETTES PAR ENTITÉ</td>
                </tr>
                {ytdEntityTable.map((r: any, i) => (
                  <tr key={`entity-${i}`}>
                    <td style={{ paddingLeft: '1.5rem' }}>{r.entity}</td>
                    {monthCells(r)}
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.ytd}</td>
                  </tr>
                ))}
                <tr className="pcg-comparison-total" style={{ background: '#1E3A5F', color: 'white' }}>
                  <td>{ytdEntityTotal.entity === 'TOTAL GROUPE' ? 'MARGE BRUTE GROUPE' : ytdEntityTotal.entity}</td>
                  {monthCells(ytdEntityTotal)}
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{ytdEntityTotal.ytd}</td>
                </tr>

                {/* Mécanisme Holding */}
                <tr style={{ background: 'rgba(30, 58, 95, 0.05)' }}>
                  <td colSpan={colSpan} style={{ fontWeight: 600, color: '#1E3A5F', paddingTop: '1rem' }}>MÉCANISME HOLDING</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '1.5rem' }}>Réserves Filiales (10%)</td>
                  <td style={{ textAlign: 'right', color: '#EF4444' }}>{reservesEntityTotal.jan ? `-${reservesEntityTotal.jan}` : '—'}</td>
                  <td style={{ textAlign: 'right', color: '#EF4444' }}>{reservesEntityTotal.feb ? `-${reservesEntityTotal.feb}` : '—'}</td>
                  {hasMar && <td style={{ textAlign: 'right', color: '#EF4444' }}>{(reservesEntityTotal as any).mar ? `-${(reservesEntityTotal as any).mar}` : '—'}</td>}
                  {hasAvr && <td style={{ textAlign: 'right', color: '#EF4444' }}>{(reservesEntityTotal as any).avr ? `-${(reservesEntityTotal as any).avr}` : '—'}</td>}
                  <td style={{ textAlign: 'right', color: '#EF4444' }}>-{reservesEntityTotal.ytd}</td>
                </tr>
                <tr style={{ fontWeight: 600 }}>
                  <td style={{ paddingLeft: '1.5rem' }}>Remontée Holding (90%)</td>
                  <td style={{ textAlign: 'right', color: '#10B981' }}>{calcRemontee(ytdEntityTotal.jan, reservesEntityTotal.jan)}</td>
                  <td style={{ textAlign: 'right', color: '#10B981' }}>{calcRemontee(ytdEntityTotal.feb || '', reservesEntityTotal.feb || '')}</td>
                  {hasMar && <td style={{ textAlign: 'right', color: '#10B981' }}>{calcRemontee((ytdEntityTotal as any).mar || '', (reservesEntityTotal as any).mar || '')}</td>}
                  {hasAvr && <td style={{ textAlign: 'right', color: '#10B981' }}>{calcRemontee((ytdEntityTotal as any).avr || '', (reservesEntityTotal as any).avr || '')}</td>}
                  <td style={{ textAlign: 'right', color: '#10B981' }}>{calcRemontee(ytdEntityTotal.ytd, reservesEntityTotal.ytd)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marge Nette YTD par Entité */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">🏢 Marge Nette YTD par Entité</h3>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-comparison-table">
            <thead>
              <tr>
                <th>Entité</th><th>Janvier</th><th>Février</th>
                {hasMar && <th>Mars</th>}
                {hasAvr && <th>Avril</th>}
                <th>YTD</th><th>% du Total</th>
              </tr>
            </thead>
            <tbody>
              {ytdEntityTable.map((row: any, i) => (
                <tr key={i}>
                  <td>{row.entity}</td><td>{row.jan ?? '—'}</td><td>{row.feb ?? '—'}</td>
                  {hasMar && <td>{row.mar ?? '—'}</td>}
                  {hasAvr && <td>{row.avr ?? '—'}</td>}
                  <td>{row.ytd}</td><td>{row.pct}</td>
                </tr>
              ))}
              <tr className="pcg-comparison-total">
                <td>{ytdEntityTotal.entity}</td><td>{ytdEntityTotal.jan ?? '—'}</td><td>{ytdEntityTotal.feb ?? '—'}</td>
                {hasMar && <td>{(ytdEntityTotal as any).mar ?? '—'}</td>}
                {hasAvr && <td>{(ytdEntityTotal as any).avr ?? '—'}</td>}
                <td>{ytdEntityTotal.ytd}</td><td>{ytdEntityTotal.pct}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Réserves par Entité */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <div>
            <h3 className="pcg-section-title">💰 Suivi Réserves par Entité</h3>
            <p className="pcg-section-subtitle">10% de la marge nette conservé dans chaque filiale</p>
          </div>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-charts-row">
            <div>
              <table className="pcg-comparison-table">
                <thead>
                  <tr>
                    <th>Entité</th><th>Réserve Jan</th><th>Réserve Fév</th>
                    {hasMar && <th>Réserve Mars</th>}
                    {hasAvr && <th>Réserve Avril</th>}
                    <th>Cumul YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {reservesEntityTable.map((row: any, i) => (
                    <tr key={i}>
                      <td>{row.entity}</td><td>{row.jan ?? '—'}</td><td>{row.feb ?? '—'}</td>
                      {hasMar && <td>{row.mar ?? '—'}</td>}
                      {hasAvr && <td>{row.avr ?? '—'}</td>}
                      <td>{row.ytd}</td>
                    </tr>
                  ))}
                  <tr className="pcg-comparison-total">
                    <td>{reservesEntityTotal.entity}</td><td>{reservesEntityTotal.jan ?? '—'}</td><td>{reservesEntityTotal.feb ?? '—'}</td>
                    {hasMar && <td>{(reservesEntityTotal as any).mar ?? '—'}</td>}
                    {hasAvr && <td>{(reservesEntityTotal as any).avr ?? '—'}</td>}
                    <td>{reservesEntityTotal.ytd}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <div className="pcg-reserve-grid">
                {data.reservesCards.map((card, i) => (
                  <div key={i} className="pcg-reserve-card">
                    <div className="pcg-reserve-entity">{card.name}</div>
                    <div className="pcg-reserve-amount">{card.amount}</div>
                    <div className="pcg-reserve-detail">{card.pct} du total</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to parse "$89,607" -> 89607
function parseNum(s: string): number {
  return Number(s.replace(/[$,]/g, '')) || 0;
}

// Helper to calculate remontée = total - reserves
function calcRemontee(total: string, reserves: string): string {
  const t = parseNum(total);
  const r = parseNum(reserves);
  if (!t) return '—';
  return '$' + (t - r).toLocaleString();
}
