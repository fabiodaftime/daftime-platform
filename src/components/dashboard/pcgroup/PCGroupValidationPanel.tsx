import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { validateAllMonths, type MonthValidation } from './pcGroupValidator';

const STATUS_META = {
  ok: { color: '#10B981', bg: 'rgba(16,185,129,0.10)', label: 'OK', Icon: CheckCircle2 },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Écarts', Icon: AlertTriangle },
  missing: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Manquant', Icon: XCircle },
} as const;

function PresenceDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      title={`${label} : ${ok ? 'présent' : 'absent'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        color: ok ? '#10B981' : '#EF4444',
        padding: '2px 8px',
        borderRadius: 999,
        background: ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: ok ? '#10B981' : '#EF4444',
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}

function MonthRow({ m }: { m: MonthValidation }) {
  const [open, setOpen] = useState(m.status !== 'ok');
  const meta = STATUS_META[m.status];
  const Icon = meta.Icon;
  return (
    <div
      style={{
        border: `1px solid ${meta.color}33`,
        background: meta.bg,
        borderRadius: 10,
        padding: '10px 14px',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Icon size={18} color={meta.color} />
          <strong style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, color: '#0F1B3D' }}>
            {m.label}
          </strong>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: meta.color,
              padding: '2px 8px',
              borderRadius: 4,
              background: '#fff',
              border: `1px solid ${meta.color}55`,
            }}
          >
            {meta.label}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <PresenceDot ok={m.presence.agency} label="Agency" />
            <PresenceDot ok={m.presence.structuring} label="Structuring" />
            <PresenceDot ok={m.presence.digit} label="Digit" />
            <PresenceDot ok={m.presence.manual} label="SPY / Cmt / Holding" />
          </div>
          {!m.hasExpected && m.status !== 'missing' && (
            <span style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
              (pas de référence figée — drift non vérifié)
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </div>

      {open && (m.issues.length > 0 || m.deltas.length > 0) && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${meta.color}55` }}>
          {m.issues.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
              {m.issues.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          )}
          {m.deltas.length > 0 && (
            <table style={{ width: '100%', marginTop: 10, borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '4px 6px' }}>Métrique</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right' }}>Attendu</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right' }}>Calculé</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right' }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {m.deltas.map((d) => (
                  <tr key={d.metric} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '4px 6px', color: '#0F1B3D', fontWeight: 600 }}>{d.metric}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                      ${Math.round(d.expected).toLocaleString('en-US')}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                      ${Math.round(d.actual).toLocaleString('en-US')}
                    </td>
                    <td
                      style={{
                        padding: '4px 6px',
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        color: Math.abs(d.delta) > 0 ? '#EF4444' : '#10B981',
                      }}
                    >
                      {d.delta >= 0 ? '+' : ''}${Math.round(d.delta).toLocaleString('en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export function PCGroupValidationPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const report = useMemo(() => validateAllMonths(), []);
  const { summary } = report;
  const hasIssues = summary.warnings + summary.missing > 0;
  const headerColor = summary.missing > 0 ? '#EF4444' : summary.warnings > 0 ? '#F59E0B' : '#10B981';

  return (
    <section
      style={{
        margin: '16px 24px 0',
        background: '#fff',
        borderRadius: 12,
        border: `1px solid ${headerColor}40`,
        boxShadow: '0 1px 3px rgba(15,27,61,0.06)',
        overflow: 'hidden',
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
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: headerColor,
              boxShadow: `0 0 0 4px ${headerColor}25`,
            }}
          />
          <strong style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#0F1B3D' }}>
            Validation croisée des sources
          </strong>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            {summary.ok}/{summary.total} OK · {summary.warnings} écart{summary.warnings > 1 ? 's' : ''} · {summary.missing} manquant{summary.missing > 1 ? 's' : ''}
          </span>
          {!hasIssues && (
            <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
              Toutes les entités cohérentes ✓
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown size={18} color="#64748B" /> : <ChevronUp size={18} color="#64748B" />}
      </button>

      {!collapsed && (
        <div style={{ padding: '4px 18px 16px' }}>
          {report.months.map((m) => (
            <MonthRow key={m.monthId} m={m} />
          ))}
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '6px 2px 0', lineHeight: 1.5 }}>
            La validation compare les totaux calculés en direct (Agency + Structuring + Digit + bloc manuel SPY/Comment/Holding)
            aux totaux figés historiquement dans <code>PCGroupData</code>. Tolérance : $5 d'arrondi.
          </p>
        </div>
      )}
    </section>
  );
}
