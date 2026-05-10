// Drawer (Sheet) qui affiche la décomposition brute d'une métrique consolidée
// pour un mois donné. Ouvert depuis un clic sur une ligne d'écart du panneau
// de validation.

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { PCGSourceMonthId } from './sources/entityAdapters';
import { buildMetricBreakdown, type BreakdownMetric } from './pcGroupBreakdown';

interface MetricBreakdownDrawerProps {
  metric: BreakdownMetric | null;
  monthId: PCGSourceMonthId | null;
  monthLabel: string;
  expected?: number;
  actual?: number;
  open: boolean;
  onClose: () => void;
}

const fmtUSD = (v: number) =>
  v < 1
    ? v.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : `$${Math.round(v).toLocaleString('en-US')}`;

export function MetricBreakdownDrawer({
  metric,
  monthId,
  monthLabel,
  expected,
  actual,
  open,
  onClose,
}: MetricBreakdownDrawerProps) {
  const breakdown = metric && monthId ? buildMetricBreakdown(metric, monthId) : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" style={{ width: 'min(560px, 100vw)', overflowY: 'auto' }}>
        <SheetHeader>
          <SheetTitle style={{ fontFamily: 'Playfair Display, serif', color: '#0F1B3D' }}>
            {metric ?? 'Décomposition'}
          </SheetTitle>
          <SheetDescription>
            {monthLabel} · lignes brutes composant ce total consolidé
          </SheetDescription>
        </SheetHeader>

        {!breakdown ? (
          <p style={{ marginTop: 24, fontSize: 13, color: '#64748B' }}>
            Aucune donnée disponible pour cette métrique.
          </p>
        ) : (
          <div style={{ marginTop: 20, fontFamily: 'DM Sans, sans-serif' }}>
            {/* Comparaison attendu / calculé */}
            {expected !== undefined && actual !== undefined && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  marginBottom: 16,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                {[
                  { label: 'Attendu (référence)', value: expected, color: '#64748B' },
                  { label: 'Calculé (live)', value: actual, color: '#0F1B3D' },
                  {
                    label: 'Écart',
                    value: actual - expected,
                    color: Math.abs(actual - expected) > 0 ? '#EF4444' : '#10B981',
                    showSign: true,
                  },
                ].map((c) => (
                  <div key={c.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#94A3B8' }}>
                      {c.label}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: c.color, marginTop: 2 }}>
                      {(c as any).showSign && c.value >= 0 ? '+' : ''}
                      {fmtUSD(c.value)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                fontSize: 11,
                color: '#475569',
                background: '#FEF7E5',
                border: '1px solid #D4A85533',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: '#0F1B3D' }}>Formule :</strong> {breakdown.formula}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '6px 8px' }}>Ligne</th>
                  <th style={{ padding: '6px 8px' }}>Source</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.rows.map((r, idx) => {
                  const isTotal = r.source === 'Total';
                  return (
                    <tr
                      key={`${r.label}-${idx}`}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: isTotal ? 'rgba(212,168,85,0.08)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '6px 8px', color: '#0F1B3D', fontWeight: isTotal ? 700 : 500 }}>
                        {r.label}
                        {r.note && (
                          <div style={{ fontSize: 10, color: '#94A3B8', fontStyle: 'italic' }}>{r.note}</div>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px', color: '#64748B', fontSize: 11 }}>{r.source ?? '—'}</td>
                      <td
                        style={{
                          padding: '6px 8px',
                          textAlign: 'right',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: isTotal ? 700 : 500,
                          color: r.sign === '-' ? '#EF4444' : isTotal ? '#0F1B3D' : '#0F1B3D',
                        }}
                      >
                        {r.sign === '-' ? '−' : r.sign === '+' ? '+' : ''}
                        {fmtUSD(r.value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 14, lineHeight: 1.5 }}>
              Les valeurs sont recalculées en direct depuis les sources Agency / Structuring / Digit
              et le bloc manuel SPY / Comment / Holding stocké en base.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
