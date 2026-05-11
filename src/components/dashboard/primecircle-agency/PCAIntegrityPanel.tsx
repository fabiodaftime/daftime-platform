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

function fmtVal(n: number, unit: 'usd' | 'pct') {
  return unit === 'pct' ? fmtPct(n) : fmtUsd(n);
}

function RecomputeModal({ onClose }: { onClose: () => void }) {
  const report = useMemo(() => recomputePCA(), []);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(report.patch);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,20,25,0.55)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        fontFamily: 'IBM Plex Sans, sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, maxWidth: 920, width: '100%',
          maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 16, color: '#0F1419' }}>Recalcul & correction PCA</strong>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {report.totalCorrections === 0
                ? 'Aucune correction nécessaire — toutes les valeurs dérivées et YTD sont alignées.'
                : `${report.totalCorrections} valeur${report.totalCorrections > 1 ? 's' : ''} à corriger sur ${report.months.length} mois.`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 22px', overflow: 'auto', flex: 1 }}>
          {report.months.map((m: PCAMonthRecompute) => (
            <div key={m.monthId} style={{ marginBottom: 14, border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <strong style={{ fontSize: 13, color: '#0F1419' }}>{m.label}</strong>
                <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'IBM Plex Mono, monospace' }}>
                  Source : gross {fmtUsd(m.gross)} · expenses {fmtUsd(m.expenses)}
                </span>
              </div>
              {m.corrections.length === 0 ? (
                <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Tous les champs dérivés et YTD sont déjà alignés.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                      <th style={{ padding: '4px 6px' }}>Champ</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Saisi</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Recalculé</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.corrections.map((c: PCAFieldCorrection) => (
                      <tr key={c.field} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '4px 6px', color: '#0F1419', fontWeight: 600 }}>{c.field}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>{fmtVal(c.declared, c.unit)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: '#10B981', fontWeight: 700 }}>{fmtVal(c.recomputed, c.unit)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: '#DC2626', fontWeight: 700 }}>{fmtDelta(c.delta, c.unit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: 13, color: '#0F1419' }}>Patch à appliquer (PrimeCircleAgencyData.ts)</strong>
              <button
                onClick={copy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  background: copied ? '#10B981' : '#1E56A0', color: '#fff', border: 'none',
                  borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copié' : 'Copier le patch'}
              </button>
            </div>
            <pre
              style={{
                background: '#0F1419', color: '#E2E8F0', padding: '12px 14px', borderRadius: 8,
                fontSize: 11, lineHeight: 1.55, fontFamily: 'IBM Plex Mono, monospace',
                overflow: 'auto', maxHeight: 280, margin: 0,
              }}
            >
              {report.patch}
            </pre>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
              Les valeurs ci-dessus sont régénérées à partir des seules sources fiables
              (<code>gross</code> et <code>expenses</code>). Coller dans la définition du mois
              correspondant remplace tous les champs dérivés et YTD pour garantir l'alignement
              avant persistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PCAIntegrityPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const report = useMemo(() => validatePCAIntegrity(), []);
  const [collapsed, setCollapsed] = useState(!defaultOpen);
  const [recomputeOpen, setRecomputeOpen] = useState(false);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px' }}>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, background: 'transparent',
            border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, flex: 1,
          }}
        >
          <span
            style={{
              width: 10, height: 10, borderRadius: 999,
              background: headerColor, boxShadow: `0 0 0 4px ${headerColor}25`,
            }}
          />
          <strong style={{ fontSize: 15, color: '#0F1419' }}>
            Contrôle d'intégrité PCA — Alignement & YTD recalculé
          </strong>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            {summary.ok}/{summary.total} OK · {summary.warnings} mois en écart
          </span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setRecomputeOpen(true)}
            title="Régénère ytdGross/ytdNet/ytdExpenses/ytdPcaShare et recalcule les champs dérivés à partir des valeurs mensuelles"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              background: summary.warnings > 0 ? '#F59E0B' : '#1E56A0',
              color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
            }}
          >
            <Wand2 size={14} />
            Recalculer et corriger
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex' }}
          >
            {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

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

      {recomputeOpen && <RecomputeModal onClose={() => setRecomputeOpen(false)} />}
    </section>
  );
}
