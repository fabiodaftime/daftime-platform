import { ArrowRight } from 'lucide-react';
import { readDigitDashboard, type ValidationIssue } from './digitConsistencyValidator';
import { digitFacts, type PCGSourceMonthId } from './sources/entityAdapters';
import { MANUAL_ENTITIES } from './manualEntities';

const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const fmtDelta = (n: number) =>
  `${n >= 0 ? '+' : ''}$${Math.round(n).toLocaleString('en-US')}`;

interface Row {
  label: string;
  pcgValue: number;
  dashValue: number;
  source: string;
}

function buildRows(month: PCGSourceMonthId, field: string): Row[] {
  const dash = readDigitDashboard(month);
  if (!dash) return [];
  const dFacts = digitFacts(month);
  const spy = MANUAL_ENTITIES[month]?.spy;
  const cmt = MANUAL_ENTITIES[month]?.comment;
  const isMarge = field === 'marge_sum' || field.includes('marge');
  return [
    {
      label: 'Digit Solution (Core)',
      pcgValue: isMarge ? dFacts?.margeNette ?? 0 : dFacts?.ca ?? 0,
      dashValue: isMarge ? dash.coreMarge : dash.coreCa,
      source: 'inputs.digit (ca_core / marge_core)',
    },
    {
      label: 'SPY',
      pcgValue: isMarge ? spy?.margeNette ?? 0 : spy?.ca ?? 0,
      dashValue: isMarge ? dash.spyMarge : dash.spyCa,
      source: 'pcgroup_manual_facts (spy)',
    },
    {
      label: 'Comment-Trust',
      pcgValue: isMarge ? cmt?.margeNette ?? 0 : cmt?.ca ?? 0,
      dashValue: isMarge ? dash.ctMarge : dash.ctCa,
      source: 'pcgroup_manual_facts (comment)',
    },
  ];
}

export function ValidationIssueDetail({ issue }: { issue: ValidationIssue }) {
  const rows = buildRows(issue.month, issue.field);
  const sumPCG = rows.reduce((a, r) => a + r.pcgValue, 0);
  const sumDash = rows.reduce((a, r) => a + r.dashValue, 0);
  const totalDelta = sumPCG - sumDash;
  const isError = issue.severity === 'error';
  const accent = isError ? '#EF4444' : '#F59E0B';
  const accentDark = isError ? '#B91C1C' : '#B45309';
  const offRows = rows.filter((r) => Math.abs(r.pcgValue - r.dashValue) > 50);

  return (
    <div
      style={{
        marginTop: 8,
        marginBottom: 8,
        padding: 12,
        background: '#fff',
        border: `1px solid ${accent}55`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 6,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#64748B', textAlign: 'left' }}>
            <th style={{ padding: '4px 6px' }}>Sous-entité</th>
            <th style={{ padding: '4px 6px', textAlign: 'right' }}>PCGroup</th>
            <th style={{ padding: '4px 6px', textAlign: 'right' }}>Dashboard Digit</th>
            <th style={{ padding: '4px 6px', textAlign: 'right' }}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const delta = r.pcgValue - r.dashValue;
            const off = Math.abs(delta) > 50;
            return (
              <tr key={r.label} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '6px' }}>
                  <div style={{ fontWeight: 600, color: '#0F1B3D' }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{r.source}</div>
                </td>
                <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                  {fmt(r.pcgValue)}
                </td>
                <td style={{ padding: '6px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#64748B' }}>
                  {fmt(r.dashValue)}
                </td>
                <td
                  style={{
                    padding: '6px',
                    textAlign: 'right',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    color: off ? accentDark : '#10B981',
                  }}
                >
                  {fmtDelta(delta)}
                </td>
              </tr>
            );
          })}
          <tr style={{ borderTop: `2px solid ${accent}`, background: `${accent}10` }}>
            <td style={{ padding: '8px 6px', fontWeight: 700, color: '#0F1B3D' }}>Σ Total</td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
              {fmt(sumPCG)}
            </td>
            <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#64748B' }}>
              {fmt(sumDash)}
            </td>
            <td
              style={{
                padding: '8px 6px',
                textAlign: 'right',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 800,
                color: accentDark,
              }}
            >
              {fmtDelta(totalDelta)}
            </td>
          </tr>
        </tbody>
      </table>

      {(offRows.length > 0 || Math.abs(totalDelta) > 50) && (
        <div
          style={{
            marginTop: 10,
            padding: 8,
            background: '#F8FAFC',
            borderRadius: 4,
            fontSize: 11,
            color: '#475569',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, color: '#0F1B3D', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowRight size={11} color={accent} /> Pistes de correction
          </div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {offRows.map((r) => (
              <li key={r.label}>
                <strong>{r.label}</strong> diverge de {fmtDelta(r.pcgValue - r.dashValue)} — vérifier{' '}
                <code style={{ fontSize: 10 }}>{r.source}</code>.
              </li>
            ))}
            {offRows.length === 0 && (
              <li>Sommes incohérentes sans divergence individuelle — possible doublon ou ligne manquante.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
