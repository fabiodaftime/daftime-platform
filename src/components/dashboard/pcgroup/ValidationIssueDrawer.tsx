import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { readDigitDashboard, type ValidationIssue } from './digitConsistencyValidator';
import { digitFacts, type PCGSourceMonthId } from './sources/entityAdapters';
import { MANUAL_ENTITIES } from './manualEntities';

interface Props {
  issue: ValidationIssue | null;
  onClose: () => void;
}

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
      source: 'pcgroup_manual_facts (entity_code = spy)',
    },
    {
      label: 'Comment-Trust',
      pcgValue: isMarge ? cmt?.margeNette ?? 0 : cmt?.ca ?? 0,
      dashValue: isMarge ? dash.ctMarge : dash.ctCa,
      source: 'pcgroup_manual_facts (entity_code = comment)',
    },
  ];
}

export function ValidationIssueDrawer({ issue, onClose }: Props) {
  const open = issue !== null;
  const rows = issue ? buildRows(issue.month, issue.field) : [];
  const sumPCG = rows.reduce((a, r) => a + r.pcgValue, 0);
  const sumDash = rows.reduce((a, r) => a + r.dashValue, 0);
  const totalDelta = sumPCG - sumDash;
  const isError = issue?.severity === 'error';
  const accent = isError ? '#EF4444' : '#F59E0B';
  const accentDark = isError ? '#B91C1C' : '#B45309';

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent style={{ width: 560, maxWidth: '95vw', overflowY: 'auto' }}>
        <SheetHeader>
          <SheetTitle style={{ display: 'flex', alignItems: 'center', gap: 8, color: accentDark }}>
            <AlertTriangle size={18} />
            Source de l'écart
          </SheetTitle>
          <SheetDescription>
            {issue ? `${issue.monthLabel} — ${issue.entity.toUpperCase()} · ${issue.field}` : ''}
          </SheetDescription>
        </SheetHeader>

        {issue && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                background: `${accent}10`,
                border: `1px solid ${accent}40`,
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                color: '#1F2937',
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              {issue.message}
            </div>

            <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#0F1B3D' }}>
              Décomposition par sous-entité
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#64748B', textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px' }}>Sous-entité</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>PCGroup</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Dashboard Digit</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const delta = r.pcgValue - r.dashValue;
                  const off = Math.abs(delta) > 50;
                  return (
                    <tr key={r.label} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 4px' }}>
                        <div style={{ fontWeight: 600, color: '#0F1B3D' }}>{r.label}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{r.source}</div>
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                        {fmt(r.pcgValue)}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#64748B' }}>
                        {fmt(r.dashValue)}
                      </td>
                      <td
                        style={{
                          padding: '8px 4px',
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
                <tr style={{ borderTop: `2px solid ${accent}`, background: `${accent}08` }}>
                  <td style={{ padding: '10px 4px', fontWeight: 700, color: '#0F1B3D' }}>
                    Σ Total
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                    {fmt(sumPCG)}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#64748B' }}>
                    {fmt(sumDash)}
                  </td>
                  <td
                    style={{
                      padding: '10px 4px',
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

            <div
              style={{
                marginTop: 20,
                padding: 12,
                background: '#F8FAFC',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                fontSize: 12,
                color: '#475569',
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 700, color: '#0F1B3D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowRight size={13} color={accent} />
                Pistes de correction
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {rows
                  .filter((r) => Math.abs(r.pcgValue - r.dashValue) > 50)
                  .map((r) => (
                    <li key={r.label}>
                      <strong>{r.label}</strong> diverge de {fmtDelta(r.pcgValue - r.dashValue)} —
                      vérifier <code style={{ fontSize: 11 }}>{r.source}</code> pour {issue.monthLabel}.
                    </li>
                  ))}
                {Math.abs(totalDelta) > 50 && rows.every((r) => Math.abs(r.pcgValue - r.dashValue) <= 50) && (
                  <li>
                    Aucune sous-entité ne diverge individuellement, mais la somme s'écarte du total
                    dashboard : un montant pourrait être saisi deux fois ou manquer.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
