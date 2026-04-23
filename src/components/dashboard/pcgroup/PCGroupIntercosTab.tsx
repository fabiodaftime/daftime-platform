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

  const { kpis, alert, table, scenarios, calendar, recap, marsNote } = intercos;

  return (
    <div>
      {/* KPI Hero */}
      <div className="pcg-hero-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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

      {/* Alerte */}
      <div
        className="pcg-section"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <div className="pcg-section-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem' }}>⚠️</div>
          <div>
            <div style={{ fontWeight: 700, color: '#EF4444', marginBottom: '0.25rem' }}>{alert.title}</div>
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>{alert.body}</div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.5rem' }}>
              Taux de recouvrement : <strong style={{ color: '#EF4444' }}>{alert.rate}</strong> | Solde dû :{' '}
              <strong style={{ color: '#EF4444' }}>{alert.balance}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau Détail Remontées */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📊 Détail des Remontées Attendues vs Reçues</h3>
          <span className="pcg-section-subtitle">Remontées = 90% de la marge nette filiale</span>
        </div>
        <div className="pcg-section-body">
          <table className="pcg-comparison-table">
            <thead>
              <tr>
                <th>Entité</th>
                <th>Janvier</th>
                <th>Février</th>
                <th style={{ background: 'rgba(16, 185, 129, 0.15)' }}>Total Exigible</th>
                <th style={{ background: 'rgba(245, 158, 11, 0.15)' }}>Mars (Avr.)</th>
                <th>Cumul YTD</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.entity}</td>
                  <td>{r.jan}</td>
                  <td>{r.feb}</td>
                  <td style={{ background: 'rgba(16, 185, 129, 0.1)', fontWeight: 600 }}>{r.exigible}</td>
                  <td style={{ background: 'rgba(245, 158, 11, 0.1)' }}>{r.mars}</td>
                  <td>{r.ytd}</td>
                </tr>
              ))}
              <tr className="pcg-comparison-total">
                <td>{table.total.entity}</td>
                <td>{table.total.jan}</td>
                <td>{table.total.feb}</td>
                <td style={{ background: '#1E3A5F', color: '#fff' }}>{table.total.exigible}</td>
                <td style={{ background: 'rgba(245, 158, 11, 0.3)' }}>{table.total.mars}</td>
                <td style={{ fontWeight: 700 }}>{table.total.ytd}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '1rem', fontStyle: 'italic' }}>
            Note : Les remontées se font en M+1. Janvier exigible en Février, Février exigible en Mars, Mars exigible en Avril.
          </p>
        </div>
      </div>

      {/* Scénarios */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">💰 Analyse de la Situation Financière</h3>
          <span className="pcg-section-subtitle">Deux scénarios de calcul du solde dû</span>
        </div>
        <div className="pcg-section-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
            {[
              { s: scenarios.base, num: 1, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', totalBg: 'rgba(239, 68, 68, 0.15)', rateBg: 'rgba(239, 68, 68, 0.1)' },
              { s: scenarios.apport, num: 2, color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', totalBg: 'rgba(245, 158, 11, 0.15)', rateBg: 'rgba(16, 185, 129, 0.1)' },
            ].map(({ s, num, color, bg, border, totalBg, rateBg }, i) => (
              <div
                key={i}
                style={{
                  background: `linear-gradient(135deg, ${bg} 0%, ${bg.replace('0.08', '0.02')} 100%)`,
                  border: `2px solid ${border}`,
                  borderRadius: 16,
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: 32, height: 32, background: color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{num}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.title}</div>
                </div>
                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                  <tbody>
                    {s.lines.map((line: any, j: number) => (
                      <tr key={j} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '0.5rem 0', color: line.type === 'positive' ? '#10B981' : '#475569' }}>{line.label}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: line.type === 'negative' ? '#EF4444' : line.type === 'positive' ? '#10B981' : '#0F172A' }}>{line.value}</td>
                      </tr>
                    ))}
                    <tr style={{ background: totalBg }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>{s.total.label}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: num === 1 ? '#EF4444' : '#F59E0B', fontSize: '1.2rem' }}>{s.total.value}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: rateBg, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>{s.rateLabel}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 700, color }}>{s.rate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                <td>Mars (non exigible)</td>
                <td colSpan={2} style={{ textAlign: 'center', color: '#F59E0B' }}>{marsNote}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
