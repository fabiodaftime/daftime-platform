import { useState } from 'react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertTriangle } from 'lucide-react';
import { type PCGroupMonthData } from './PCGroupData';
import { validateDigitConsistency, type ValidationIssue } from './digitConsistencyValidator';


import { ValidationIssueDetail } from './ValidationIssueDrawer';
import type { PCGSourceMonthId } from './sources/entityAdapters';

interface Props {
  data: PCGroupMonthData;
}

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

  const { kpis, table } = intercos;
  const monthLabel = (data as any).monthLabel ?? '';
  const sourceMonths = table.columns.map((c: any) => c.label).join(', ');
  const safeLabel = String(monthLabel).replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'ytd';

  const entityCards = (intercos as any).entityCards ?? [];
  const sourceMonthIds: PCGSourceMonthId[] = table.columns.map((c: any) => c.key);
  const validationIssues = validateDigitConsistency(sourceMonthIds);
  const hasErrors = validationIssues.some((i) => i.severity === 'error');

  const parseUSDNum = (v: string) => Number(String(v ?? '').replace(/[^\d.-]/g, '')) || 0;
  const fmtUSDStr = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
  const [issueDrawer, setIssueDrawer] = useState<ValidationIssue | null>(null);

  // Fusionne les lignes digit + spy + comment en une seule ligne "Digit Solution"
  // dans le tableau "Détail des Remontées par Filiale".
  const DIGIT_KEYS = ['digit', 'spy', 'comment'];
  const displayRows = (() => {
    const rows = (table.rows ?? []) as any[];
    const digitParts = rows.filter((r) => DIGIT_KEYS.includes(r._key));
    if (digitParts.length === 0) return rows;
    const others = rows.filter((r) => !DIGIT_KEYS.includes(r._key));
    const sumCol = (col: string) => digitParts.reduce((a, r) => a + parseUSDNum(r[col]), 0);
    const merged: any = {
      _key: 'digit-merged',
      _codes: DIGIT_KEYS,
      entity: 'Digit Solution (Core + SPY + Comment)',
    };
    table.columns.forEach((c: any) => {
      merged[c.key] = fmtUSDStr(sumCol(c.key));
    });
    const ytd = sumCol('ytd');
    const received = sumCol('received');
    merged.ytd = fmtUSDStr(ytd);
    merged.received = fmtUSDStr(received);
    merged.remaining = fmtUSDStr(Math.max(0, ytd - received));
    // Insère la ligne fusionnée à la position du premier sous-élément Digit
    const firstDigitIdx = rows.findIndex((r) => DIGIT_KEYS.includes(r._key));
    const out = [...others];
    out.splice(Math.min(firstDigitIdx, out.length), 0, merged);
    return out;
  })();

  const buildTableRows = () => {
    const header = ['Entité', ...table.columns.map((c: any) => c.label), 'Total à Remonter', 'Déjà Remonté', 'Solde Restant'];
    const rows = table.rows.map((r: any) => [
      r.entity,
      ...table.columns.map((c: any) => r[c.key] ?? '—'),
      r.ytd,
      r.received ?? '—',
      r.remaining ?? '—',
    ]);
    const total = [
      table.total.entity,
      ...table.columns.map((c: any) => table.total[c.key] ?? '—'),
      table.total.ytd,
      table.total.received ?? '—',
      table.total.remaining ?? '—',
    ];
    return { header, rows, total };
  };

  const buildCardsRows = () => {
    const header = ['Entité', 'Attendu', 'Déjà Remonté', 'Reste à Remonter', 'Recouvrement'];
    const rows = entityCards.map((c: any) => [c.entity, c.expected, c.received, c.remaining, c.rate]);
    return { header, rows };
  };

  const exportCSV = () => {
    const t = buildTableRows();
    const cards = buildCardsRows();
    const lines: any[][] = [];
    lines.push([`Récapitulatif Intercos — YTD ${monthLabel}`]);
    lines.push([`Mois sources: ${sourceMonths}`]);
    lines.push([]);
    lines.push(['== Détail des Remontées par Filiale ==']);
    lines.push(t.header);
    t.rows.forEach((r) => lines.push(r));
    lines.push(t.total);
    lines.push([]);
    lines.push(['== Solde à Remonter par Entité ==']);
    lines.push(cards.header);
    cards.rows.forEach((r: any) => lines.push(r));
    const csv = Papa.unparse(lines);
    downloadBlob('\uFEFF' + csv, `intercos_${safeLabel}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportPDF = () => {
    const t = buildTableRows();
    const cards = buildCardsRows();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text(`Récapitulatif Intercos — YTD ${monthLabel}`, 40, 40);
    doc.setFontSize(9);
    doc.text(`Mois sources: ${sourceMonths}`, 40, 58);

    autoTable(doc, {
      startY: 72,
      head: [['Indicateur', 'Valeur', 'Détail']],
      body: kpis.map((k: any) => [k.label, k.value, k.detail ?? '']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 95] },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 16,
      head: [t.header],
      body: [...t.rows, t.total],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 95] },
      didParseCell: (data) => {
        if (data.row.index === t.rows.length && data.section === 'body') {
          data.cell.styles.fillColor = [30, 58, 95];
          data.cell.styles.textColor = 255;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 16,
      head: [cards.header],
      body: cards.rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 95] },
    });

    doc.save(`intercos_${safeLabel}.pdf`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportPDF}>
          <FileText className="h-4 w-4 mr-2" /> Export PDF
        </Button>
      </div>

      {/* Rappel : remontées de cash effectives en mai */}
      <div
        style={{
          border: '1px solid #1E3A5F',
          borderLeft: '4px solid #D4A855',
          background: 'rgba(212, 168, 85, 0.08)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          fontSize: 13,
          color: '#0F1E33',
        }}
      >
        <strong style={{ color: '#1E3A5F' }}>Note —</strong>{' '}
        Les montants « reçus » affichés correspondent aux remontées de cash <strong>effectivement encaissées en mai 2025</strong>,
        intégrées au dashboard du mois d'avril pour refléter la réalité des flux interco.
      </div>

      {/* Validation cohérence Digit / SPY / Comment */}
      {validationIssues.length > 0 && (

        <div
          style={{
            border: `1px solid ${hasErrors ? '#EF4444' : '#F59E0B'}`,
            borderLeft: `4px solid ${hasErrors ? '#EF4444' : '#F59E0B'}`,
            background: hasErrors ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: hasErrors ? '#B91C1C' : '#B45309', fontWeight: 700 }}>
            <AlertTriangle className="h-5 w-5" />
            <span>
              {hasErrors ? 'Erreur de cohérence détectée' : 'Avertissement de cohérence'} —
              Digit Solution / SPY / Comment-Trust ({validationIssues.length} {validationIssues.length > 1 ? 'alertes' : 'alerte'})
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#374151' }}>
            {validationIssues.map((iss, i) => {
              const isOpen = issueDrawer === iss;
              return (
                <li key={i} style={{ marginBottom: 6 }}>
                  <span
                    onClick={() => setIssueDrawer(isOpen ? null : iss)}
                    style={{
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                      textUnderlineOffset: 3,
                    }}
                  >
                    <strong style={{ color: iss.severity === 'error' ? '#B91C1C' : '#B45309' }}>
                      [{iss.monthLabel} · {iss.entity.toUpperCase()}]
                    </strong>{' '}
                    {iss.message}{' '}
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      {isOpen ? '▲ masquer' : '▼ détail'}
                    </span>
                  </span>
                  {isOpen && (
                    <ValidationIssueDetail issue={iss} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
                <th style={{ background: 'rgba(30, 58, 95, 0.1)' }}>Total à Remonter</th>
                <th style={{ background: 'rgba(16, 185, 129, 0.15)' }}>Déjà Remonté</th>
                <th style={{ background: 'rgba(245, 158, 11, 0.15)' }}>Solde Restant</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.entity}</td>
                  {table.columns.map((c: any) => (
                    <td key={c.key}>{r[c.key] ?? '—'}</td>
                  ))}
                  <td style={{ background: 'rgba(30, 58, 95, 0.05)', fontWeight: 600 }}>{r.ytd}</td>
                  <td style={{ background: 'rgba(16, 185, 129, 0.08)', fontWeight: 600, color: '#059669' }}>
                    {r.received ?? '$0'}
                  </td>
                  <td style={{ background: 'rgba(245, 158, 11, 0.08)', fontWeight: 600, color: '#D97706' }}>
                    {r.remaining ?? '—'}
                  </td>
                </tr>
              ))}
              <tr className="pcg-comparison-total">
                <td>{table.total.entity}</td>
                {table.columns.map((c: any) => (
                  <td key={c.key}>{table.total[c.key] ?? '—'}</td>
                ))}
                <td style={{ background: '#1E3A5F', color: '#fff', fontWeight: 700 }}>{table.total.ytd}</td>
                <td style={{ background: '#059669', color: '#fff', fontWeight: 700 }}>{table.total.received}</td>
                <td style={{ background: '#D97706', color: '#fff', fontWeight: 700 }}>{table.total.remaining}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards visuelles : ce que chaque entité doit encore remonter */}
      {Array.isArray((intercos as any).entityCards) && (() => {
        const cards = (intercos as any).entityCards as any[];
        const parseUSD = (v: string) => Number(String(v ?? '').replace(/[^\d.-]/g, '')) || 0;
        const fmtUSD = (n: number) => `$${Math.round(n).toLocaleString()}`;
        const digitKeys = ['digit', 'spy', 'comment'];
        const digitSubs = cards.filter((c) => digitKeys.includes(c.key));
        const others = cards.filter((c) => !digitKeys.includes(c.key));

        let digitGroupCard: any = null;
        if (digitSubs.length > 0) {
          const expected = digitSubs.reduce((a, c) => a + parseUSD(c.expected), 0);
          const received = digitSubs.reduce((a, c) => a + parseUSD(c.received), 0);
          const remaining = Math.max(0, expected - received);
          const rate = expected > 0 ? (received / expected) * 100 : 0;
          let level: 'danger' | 'warning' | 'success' = 'danger';
          if (rate >= 80) level = 'success';
          else if (rate >= 40) level = 'warning';
          digitGroupCard = {
            key: 'digit-group',
            entity: 'Digit Group',
            subtitle: 'Digit Core + SPY + Comment/Trust',
            expected: fmtUSD(expected),
            received: fmtUSD(received),
            remaining: fmtUSD(remaining),
            rate: `${rate.toFixed(1)}%`,
            level,
            subs: digitSubs,
          };
        }

        const renderCard = (c: any) => (
          <div
            key={c.key}
            style={{
              border: `1px solid ${LEVEL_BORDER[c.level] ?? '#1E3A5F'}`,
              borderLeft: `4px solid ${COLOR[c.level] ?? '#1E3A5F'}`,
              borderRadius: 8,
              padding: 16,
              background: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E3A5F', marginBottom: 8 }}>{c.entity}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLOR[c.level] ?? '#1E3A5F', marginBottom: 4 }}>
              {c.remaining}
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>Reste à remonter</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151', borderTop: '1px solid #E5E7EB', paddingTop: 8 }}>
              <span>Attendu : <strong>{c.expected}</strong></span>
              <span>Reçu : <strong style={{ color: '#059669' }}>{c.received}</strong></span>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: COLOR[c.level], fontWeight: 600 }}>
              Recouvrement : {c.rate}
            </div>
          </div>
        );

        return (
          <div className="pcg-section">
            <div className="pcg-section-header">
              <h3 className="pcg-section-title">💼 Solde à Remonter par Entité</h3>
              <span className="pcg-section-subtitle">Hors apport Maxence — uniquement remontées effectives</span>
            </div>
            <div className="pcg-section-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {others.map(renderCard)}
              </div>

              {digitGroupCard && (
                <div
                  style={{
                    marginTop: 20,
                    border: `2px solid ${LEVEL_BORDER[digitGroupCard.level] ?? '#1E3A5F'}`,
                    borderLeft: `6px solid ${COLOR[digitGroupCard.level] ?? '#1E3A5F'}`,
                    borderRadius: 10,
                    padding: 20,
                    background: 'linear-gradient(135deg, #FAFBFC 0%, #FFFFFF 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        Vue Globale
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1E3A5F', marginBottom: 2 }}>
                        {digitGroupCard.entity}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{digitGroupCard.subtitle}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>Reste à remonter</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: COLOR[digitGroupCard.level] }}>
                          {digitGroupCard.remaining}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 12, color: '#374151' }}>
                        <div>Attendu : <strong>{digitGroupCard.expected}</strong></div>
                        <div>Reçu : <strong style={{ color: '#059669' }}>{digitGroupCard.received}</strong></div>
                        <div style={{ color: COLOR[digitGroupCard.level], fontWeight: 600, marginTop: 2 }}>
                          Recouvrement : {digitGroupCard.rate}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pas de détail reçu/attendu par sous-entité : Digit Group remonte
                      un montant global unique, pas une remontée par sous-entité. */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #E5E7EB', fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                    Périmètre : {digitGroupCard.subs.map((s: any) => s.entity).join(' + ')} — remontée groupée.
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}


    </div>
  );
}
