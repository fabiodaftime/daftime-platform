import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Wand2, Copy, X, Check } from 'lucide-react';
import { validatePCAIntegrity, type PCAMonthIntegrity } from './pcaIntegrityValidator';
import { recomputePCA, type PCAMonthRecompute, type PCAFieldCorrection } from './pcaRecompute';

const fmtUsd = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtDelta = (n: number, unit: 'usd' | 'pct') => {
  const sign = n >= 0 ? '+' : '−';
  if (unit === 'pct') return `${sign}${Math.abs(n).toFixed(2)} pt`;
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
};

function MonthBlock({ m }: { m: PCAMonthIntegrity }) {
  const [open, setOpen] = useState(m.status !== 'ok');
  const color = m.status === 'ok' ? '#10B981' : '#F59E0B';
  const bg = m.status === 'ok' ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.08)';
  const Icon = m.status === 'ok' ? CheckCircle2 : AlertTriangle;
  const issueCount = m.alignment.length + m.ytd.length;

  return (
    <div style={{ border: `1px solid ${color}33`, background: bg, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon size={16} color={color} />
          <strong style={{ fontSize: 14, color: '#0F1419' }}>{m.label}</strong>
          {m.status === 'ok' ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>OK</span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>
              {issueCount} écart{issueCount > 1 ? 's' : ''}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'IBM Plex Mono, monospace' }}>
            YTD recalc · Gross {fmtUsd(m.recomputedYtd.ytdGross)} · Exp {fmtUsd(m.recomputedYtd.ytdExpenses)} · Net {fmtUsd(m.recomputedYtd.ytdNet)} · PCA {fmtUsd(m.recomputedYtd.ytdPcaShare)}
          </span>
        </div>
        {open ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </div>

      {open && issueCount > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${color}55`, fontSize: 12, color: '#334155' }}>
          {m.alignment.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, color: '#0F1419', marginBottom: 4 }}>
                Contrôle d'alignement (gross / net / expenses)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px' }}>Règle</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Attendu</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Saisi</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {m.alignment.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '4px 6px', color: '#0F1419', fontWeight: 600 }}>{a.rule}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>
                        {a.unit === 'pct' ? fmtPct(a.expected) : fmtUsd(a.expected)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>
                        {a.unit === 'pct' ? fmtPct(a.actual) : fmtUsd(a.actual)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: '#DC2626', fontWeight: 700 }}>
                        {fmtDelta(a.delta, a.unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {m.ytd.length > 0 && (
            <div style={{ marginTop: m.alignment.length > 0 ? 12 : 0 }}>
              <div style={{ fontWeight: 700, color: '#0F1419', marginBottom: 4 }}>
                YTD recalculé automatiquement
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px' }}>Champ</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Saisi</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Recalculé</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {m.ytd.map((y) => (
                    <tr key={y.field} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '4px 6px', color: '#0F1419', fontWeight: 600 }}>{y.field}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>{fmtUsd(y.declared)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>{fmtUsd(y.recomputed)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: '#DC2626', fontWeight: 700 }}>
                        {fmtDelta(y.delta, 'usd')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PCAIntegrityPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const report = useMemo(() => validatePCAIntegrity(), []);
  const [collapsed, setCollapsed] = useState(!defaultOpen);
  const { summary } = report;
  const headerColor = summary.warnings > 0 ? '#F59E0B' : '#10B981';

  return (
    <section
      style={{
        margin: '16px auto 0',
        maxWidth: 1280,
        background: '#fff',
        borderRadius: 12,
        border: `1px solid ${headerColor}40`,
        boxShadow: '0 1px 3px rgba(15,20,25,0.06)',
        overflow: 'hidden',
        fontFamily: 'IBM Plex Sans, sans-serif',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: headerColor,
              boxShadow: `0 0 0 4px ${headerColor}25`,
            }}
          />
          <strong style={{ fontSize: 15, color: '#0F1419' }}>
            Contrôle d'intégrité PCA — Alignement & YTD recalculé
          </strong>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            {summary.ok}/{summary.total} OK · {summary.warnings} mois en écart
          </span>
        </span>
        {collapsed ? <ChevronDown size={18} color="#64748B" /> : <ChevronUp size={18} color="#64748B" />}
      </button>

      {!collapsed && (
        <div style={{ padding: '4px 18px 16px' }}>
          {report.months.map((m) => (
            <MonthBlock key={m.monthId} m={m} />
          ))}
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '6px 2px 0', lineHeight: 1.5 }}>
            Recalculé à chaque rendu après import / restatement. Tolérances : ±$1 sur les
            montants, ±0,2 pt sur les pourcentages. Aucun écart = saisie cohérente avec la
            cascade waterfall et les cumuls YTD.
          </p>
        </div>
      )}
    </section>
  );
}
