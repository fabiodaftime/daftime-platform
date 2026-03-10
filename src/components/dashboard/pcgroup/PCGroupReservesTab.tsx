import { reservesHero, reservesEntityTable, reservesEntityTotal, reservesCards } from './PCGroupData';

export function PCGroupReservesTab() {
  return (
    <div>
      {/* Hero KPIs */}
      <div className="pcg-hero-grid">
        {reservesHero.map((kpi, i) => (
          <div key={i} className={`pcg-hero-card ${kpi.color}`}>
            <div className="pcg-hero-label">{kpi.label}</div>
            <div className="pcg-hero-value">{kpi.value}</div>
            <div className="pcg-hero-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      {/* Suivi Réserves par Entité */}
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
                <th>Entité</th>
                <th>Réserve Jan</th>
                <th>Réserve Fév</th>
                <th>Cumul YTD</th>
              </tr>
            </thead>
            <tbody>
              {reservesEntityTable.map((row, i) => (
                <tr key={i}>
                  <td>{row.entity}</td>
                  <td>{row.jan}</td>
                  <td>{row.feb}</td>
                  <td>{row.ytd}</td>
                </tr>
              ))}
              <tr className="pcg-comparison-total">
                <td>{reservesEntityTotal.entity}</td>
                <td>{reservesEntityTotal.jan}</td>
                <td>{reservesEntityTotal.feb}</td>
                <td>{reservesEntityTotal.ytd}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Répartition Réserves YTD */}
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
