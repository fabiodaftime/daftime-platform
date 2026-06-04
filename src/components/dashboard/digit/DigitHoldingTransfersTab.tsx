// Onglet "Remontées Holding" — dashboard Digit.
// Vue Splittée par sous-activité (Core / SPY / Comment-Trust) :
//   • 3 cartes de balance (à remonter / remonté / solde + taux)
//   • Tableau historique mensuel par activité (marge nette → 90% → reçu → solde)
//   • Total agrégé en bas
import { useMemo } from 'react';
import { computeDigitHoldingTransfers, type SubActivitySummary } from './digitHoldingTransfers';
import { D } from './DigitData';
import type { PCGSourceMonthId } from '../pcgroup/sources/entityAdapters';

interface Props {
  selectedMonth: PCGSourceMonthId;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  paid: { bg: D.greenSoft, color: D.greenText, label: '✓ Couvert' },
  partial: { bg: D.orangeSoft, color: D.orangeText, label: '◐ Partiel' },
  pending: { bg: D.redSoft, color: D.redText, label: '○ Dû' },
  overpaid: { bg: D.greenSoft, color: D.greenText, label: '↑ Avance' },
};

function BalanceCard({ s, fmt }: { s: SubActivitySummary; fmt: (n: number) => string }) {
  const rate = s.recoveryRate;
  const level = rate >= 80 ? 'success' : rate >= 40 ? 'warning' : 'danger';
  const ringColor = level === 'success' ? D.green : level === 'warning' ? D.orange : D.red;
  return (
    <div className="digit-metric-card" style={{ borderLeftColor: s.color }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="digit-metric-label">{s.label}</div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: ringColor,
            background: `${ringColor}15`,
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          {rate.toFixed(1)}%
        </span>
      </div>
      <div className="digit-metric-value" style={{ color: s.totalRemaining > 0 ? D.red : D.green }}>
        {fmt(s.totalRemaining)}
      </div>
      <div className="digit-metric-sub">Solde dû à la Holding</div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${D.border}`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontSize: '0.78rem',
        }}
      >
        <div>
          <div style={{ color: D.textMuted }}>À remonter</div>
          <div style={{ fontWeight: 600, color: D.text }}>{fmt(s.totalExpected)}</div>
        </div>
        <div>
          <div style={{ color: D.textMuted }}>Reçu</div>
          <div style={{ fontWeight: 600, color: D.green }}>{fmt(s.totalReceived)}</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.7rem', color: D.textMuted }}>
        Base : marge nette {fmt(s.totalMargin)} × 90%
      </div>
    </div>
  );
}

function HistoryTable({ s, fmt }: { s: SubActivitySummary; fmt: (n: number) => string }) {
  return (
    <div
      style={{
        background: D.surface,
        border: `1px solid ${D.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${D.border}`,
          background: D.surfaceAlt,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
          <strong style={{ color: D.text }}>{s.label}</strong>
          <span style={{ fontSize: '0.75rem', color: D.textMuted }}>
            Historique mensuel — recouvrement {s.recoveryRate.toFixed(1)}%
          </span>
        </div>
        <span style={{ fontSize: '0.85rem', color: D.text }}>
          Solde : <strong style={{ color: s.totalRemaining > 0 ? D.red : D.green }}>{fmt(s.totalRemaining)}</strong>
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: D.surfaceAlt, color: D.textSecondary }}>
            <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 600 }}>Mois</th>
            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 600 }}>Marge nette</th>
            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 600 }}>À remonter (90%)</th>
            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 600 }}>Reçu (mois)</th>
            <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 600 }}>Solde (FIFO)</th>
            <th style={{ textAlign: 'center', padding: '8px 16px', fontWeight: 600 }}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {s.rows.map((r) => {
            const st = STATUS_STYLES[r.status];
            return (
              <tr key={r.month} style={{ borderTop: `1px solid ${D.border}` }}>
                <td style={{ padding: '10px 16px', color: D.text }}>{r.longLabel}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', color: D.text }}>{fmt(r.margin)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', color: D.text, fontWeight: 600 }}>
                  {fmt(r.expected)}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', color: r.received > 0 ? D.green : D.textMuted }}>
                  {fmt(r.received)}
                </td>
                <td
                  style={{
                    padding: '10px 16px',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: r.balance > 0 ? D.red : D.green,
                  }}
                >
                  {fmt(r.balance)}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span
                    style={{
                      background: st.bg,
                      color: st.color,
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {st.label}
                  </span>
                </td>
              </tr>
            );
          })}
          <tr style={{ borderTop: `2px solid ${D.border}`, background: D.surfaceAlt }}>
            <td style={{ padding: '10px 16px', fontWeight: 700, color: D.text }}>Total</td>
            <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: D.text }}>
              {fmt(s.totalMargin)}
            </td>
            <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: D.text }}>
              {fmt(s.totalExpected)}
            </td>
            <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: D.green }}>
              {fmt(s.totalReceived)}
            </td>
            <td
              style={{
                padding: '10px 16px',
                textAlign: 'right',
                fontWeight: 800,
                color: s.totalRemaining > 0 ? D.red : D.green,
              }}
            >
              {fmt(s.totalRemaining)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function DigitHoldingTransfersTab({ selectedMonth }: Props) {
  const data = useMemo(() => computeDigitHoldingTransfers(selectedMonth), [selectedMonth]);
  const { fmt, upToLabel } = data;

  // Split aligné sur la Conso :
  //  - Digit Solution (Core) = Digit + Comment + SPY Jan/Fév (mêmes règles que pcGroupIntercosCompute)
  //  - SPY isolé = à partir de Mars, suivi séparément
  //  - Comment/Trust = intégré dans Core, pas de remontée propre → masqué ici
  const digitGroup = data.subActivities.filter((s) => s.key !== 'spy' && s.transferRate > 0);
  const spy = data.subActivities.find((s) => s.key === 'spy');

  const digitTotals = digitGroup.reduce(
    (acc, s) => ({
      margin: acc.margin + s.totalMargin,
      expected: acc.expected + s.totalExpected,
      received: acc.received + s.totalReceived,
      remaining: acc.remaining + s.totalRemaining,
    }),
    { margin: 0, expected: 0, received: 0, remaining: 0 },
  );
  const digitRecoveryRate = digitTotals.expected > 0 ? (digitTotals.received / digitTotals.expected) * 100 : 0;

  return (
    <div>
      <h2 className="digit-section-title">Remontées Holding Digit — Aligné Conso</h2>
      <p style={{ color: D.textSecondary, marginTop: -8, marginBottom: 20, fontSize: '0.9rem' }}>
        Suivi des 90% de marge nette à remonter à la <strong>Holding Digit</strong> selon la règle Prime Circle :{' '}
        <strong>Digit Solution (Core)</strong> agrège Digit + Comment/Trust (tous mois) + SPY (Jan/Fév, phase
        MaxScale). <strong>SPY</strong> est isolé à partir de Mars (holding propre) et affiché à part. Cumul
        Janvier → {upToLabel}. Imputation FIFO : les encaissements couvrent en priorité les mois les plus anciens.
        Mêmes chiffres que le dashboard consolidé.
      </p>


      {/* Cartes balance — Holding Digit (Core + Comment) */}
      <div className="digit-kpi-grid" style={{ marginBottom: 24 }}>
        {digitGroup.map((s) => (
          <BalanceCard key={s.key} s={s} fmt={fmt} />
        ))}
      </div>

      {/* Total agrégé — Holding Digit uniquement */}
      <div
        style={{
          background: `linear-gradient(135deg, ${D.primary}, ${D.indigo})`,
          color: '#fff',
          borderRadius: 12,
          padding: '18px 22px',
          marginBottom: 28,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Total à remonter (Holding Digit)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{fmt(digitTotals.expected)}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>Digit + Comment + SPY Jan/Fév</div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Total remonté</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{fmt(digitTotals.received)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Solde Holding Digit</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{fmt(digitTotals.remaining)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Taux de recouvrement</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{digitRecoveryRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Historique par activité — Core + Comment */}
      <h3 className="digit-section-title" style={{ fontSize: '1.05rem' }}>
        Historique mensuel — Holding Digit
      </h3>
      {digitGroup.map((s) => (
        <HistoryTable key={s.key} s={s} fmt={fmt} />
      ))}

      {/* Section SPY — indépendante, informationnelle */}
      {spy && (
        <>
          <div
            style={{
              marginTop: 32,
              padding: '14px 18px',
              background: '#F4F0FA',
              border: `1px solid ${spy.color}40`,
              borderLeft: `4px solid ${spy.color}`,
              borderRadius: 8,
              fontSize: '0.85rem',
              color: D.textSecondary,
              marginBottom: 16,
            }}
          >
            ℹ️ <strong>SPY</strong> est une entité <strong>indépendante de Digit</strong> : elle remonte ses
            marges à <strong>son propre holding</strong>, pas à la Holding Digit. Ces chiffres sont affichés à
            titre informatif et <strong>ne sont pas inclus</strong> dans le total Holding Digit ci-dessus.
          </div>
          <h3 className="digit-section-title" style={{ fontSize: '1.05rem' }}>
            SPY — Remontée vers son holding propre (hors périmètre Digit)
          </h3>
          <div className="digit-kpi-grid" style={{ marginBottom: 16 }}>
            <BalanceCard s={spy} fmt={fmt} />
          </div>
          <HistoryTable s={spy} fmt={fmt} />
        </>
      )}
    </div>
  );
}
