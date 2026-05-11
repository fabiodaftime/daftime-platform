import { type PCGroupMonthData } from './PCGroupData';

interface Props {
  data: PCGroupMonthData;
}

const KPI_BG: Record<string, string> = {
  navy: 'linear-gradient(135deg, #0F1E33 0%, #1E3A5F 100%)',
  danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
};

const LEVEL_BORDER: Record<string, string> = {
  danger: '#EF4444',
  warning: '#F59E0B',
  navy: '#1E3A5F',
};

const COLOR: Record<string, string> = {
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  navy: '#1E3A5F',
};

export function PCGroupIntercosTab({ data }: Props) {
  const intercos = (data as any).intercos;
  if (!intercos) return null;

  const { kpis, table, calendar, recap } = intercos;

  return (
    <div>
      {/* KPI Hero */}
      <div className="pcg-hero-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {kpis.map((k: any, i: number) => (
          <div
            key={i}
            className="pcg-hero-card"
            style={{ background: KPI_BG[k.color], color: '#fff' }}
          >
            <div className="pcg-hero-label" style={{ color: 'rgba(255,255,255,0.85)' }}>{k.label}</div>
            <div className="pcg-hero-value">{k.value}</div>
            <div className="pcg-hero-detail" style={{ color: 'rgba(255,255,255,0.75)' }}>{k.detail}</div>
          </div>
        ))}
      </div>

      {/* Tableau Détail Remontées — colonnes dynamiques (1 par mois source) */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📊 Détail des Remontées par Filiale</h3>
          <span className="pcg-section-subtitle">Remontées = 90% de la marge nette filiale</span>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-comparison-table">
            <thead>
              <tr>
                <th>Entité</th>
                {table.columns.map((c: any) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th style={{ background: 'rgba(16, 185, 129, 0.15)' }}>Total à Remonter</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.entity}</td>
                  {table.columns.map((c: any) => (
                    <td key={c.key}>{r[c.key] ?? '—'}</td>
                  ))}
                  <td style={{ background: 'rgba(16, 185, 129, 0.1)', fontWeight: 600 }}>{r.ytd}</td>
                </tr>
              ))}
              <tr className="pcg-comparison-total">
                <td>{table.total.entity}</td>
                {table.columns.map((c: any) => (
                  <td key={c.key}>{table.total[c.key] ?? '—'}</td>
                ))}
                <td style={{ background: '#1E3A5F', color: '#fff', fontWeight: 700 }}>{table.total.ytd}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section "Analyse de la Situation Financière" retirée à la demande client */}
      {/* Calendrier d'exigibilité */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📅 Calendrier d'Exigibilité</h3>
        </div>
        <div className="pcg-section-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {calendar.map((c: any, i: number) => {
              const isNavy = c.level === 'navy';
              return (
                <div
                  key={i}
                  style={{
                    background: isNavy ? 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)' : '#F8F9FC',
                    color: isNavy ? '#fff' : '#0F172A',
                    borderRadius: 12,
                    padding: '1.25rem',
                    textAlign: 'center',
                    borderLeft: isNavy ? 'none' : `4px solid ${LEVEL_BORDER[c.level]}`,
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: isNavy ? 'rgba(255,255,255,0.7)' : '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>{c.month}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0' }}>{c.amount}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isNavy ? 'rgba(255,255,255,0.8)' : COLOR[c.level] }}>{c.status}</div>
                  <div style={{ fontSize: '0.7rem', color: isNavy ? 'rgba(255,255,255,0.6)' : '#94A3B8', marginTop: '0.25rem' }}>{c.tag}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📋 Récapitulatif Situation Intercos</h3>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-comparison-table">
            <thead>
              <tr>
                <th>Indicateur</th>
                <th>Scénario 1 (Base)</th>
                <th>Scénario 2 (+ Apport Max)</th>
              </tr>
            </thead>
            <tbody>
              {recap.map((r: any, i: number) => (
                <tr key={i} style={r.highlight ? { background: 'rgba(239, 68, 68, 0.05)' } : undefined}>
                  <td style={{ fontWeight: r.bold ? 700 : 400 }}>{r.label}</td>
                  <td style={{ color: r.s1Color ? COLOR[r.s1Color] : undefined, fontWeight: r.bold ? 700 : 400 }}>{r.s1}</td>
                  <td style={{ color: r.s2Color ? COLOR[r.s2Color] : undefined, fontWeight: r.bold ? 700 : 400 }}>{r.s2}</td>
                </tr>
              ))}
              <tr style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
                <td>Non exigible</td>
                <td colSpan={2} style={{ textAlign: 'center', color: '#F59E0B' }}>{marsNote}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
