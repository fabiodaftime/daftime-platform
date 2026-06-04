import { type PCGroupMonthData } from './PCGroupData';

interface Props { data: PCGroupMonthData; }

export function PCGroupReservesTab({ data }: Props) {
  const { reservesHero, reservesEntityTable, reservesEntityTotal, reservesCards } = data;
  const total = reservesEntityTotal as any;
  const hasMar = Boolean(total.mar) || reservesEntityTable.some((r: any) => r.mar);
  const hasAvr = Boolean(total.avr) || reservesEntityTable.some((r: any) => r.avr);
  const hasMai = Boolean(total.mai) || reservesEntityTable.some((r: any) => r.mai);

  return (
    <div>
      <div className="pcg-hero-grid">
        {reservesHero.map((kpi, i) => (
          <div key={i} className={`pcg-hero-card ${kpi.color}`}>
            <div className="pcg-hero-label">{kpi.label}</div>
            <div className="pcg-hero-value">{kpi.value}</div>
            <div className="pcg-hero-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <div>
            <h3 className="pcg-section-title">💰 Suivi Réserves par Entité</h3>
            <p className="pcg-section-subtitle">10% de la marge nette conservé dans chaque filiale</p>
          </div>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-comparison-table">
            <thead>
              <tr>
                <th>Entité</th><th>Réserve Jan</th><th>Réserve Fév</th>
                {hasMar && <th>Réserve Mars</th>}
                {hasAvr && <th>Réserve Avril</th>}
                {hasMai && <th>Réserve Mai</th>}
                <th>Cumul YTD</th>
              </tr>
            </thead>
            <tbody>
              {reservesEntityTable.map((row: any, i) => (
                <tr key={i}>
                  <td>{row.entity}</td><td>{row.jan ?? '—'}</td><td>{row.feb ?? '—'}</td>
                  {hasMar && <td>{row.mar ?? '—'}</td>}
                  {hasAvr && <td>{row.avr ?? '—'}</td>}
                  {hasMai && <td>{row.mai ?? '—'}</td>}
                  <td>{row.ytd}</td>
                </tr>
              ))}
              <tr className="pcg-comparison-total">
                <td>{total.entity}</td><td>{total.jan ?? '—'}</td><td>{total.feb ?? '—'}</td>
                {hasMar && <td>{total.mar ?? '—'}</td>}
                {hasAvr && <td>{total.avr ?? '—'}</td>}
                {hasMai && <td>{total.mai ?? '—'}</td>}
                <td>{total.ytd}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📊 Répartition Réserves YTD</h3>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-reserve-grid">
            {reservesCards.map((card, i) => (
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
  );
}
