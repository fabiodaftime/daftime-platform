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
import { useIntercosCashSources } from './useIntercosCashSources';

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
  const cashSources = useIntercosCashSources(sourceMonthIds as string[]);

  const parseUSDNum = (v: string) => Number(String(v ?? '').replace(/[^\d.-]/g, '')) || 0;
  const fmtUSDStr = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
  const [issueDrawer, setIssueDrawer] = useState<ValidationIssue | null>(null);

  // Affiche les filiales en lignes distinctes — DG Solutions (Core), SPY et
  // Comment/Trust sont des entités séparées et ne doivent PAS être fusionnées
  // dans le tableau "Détail des Remontées par Filiale".
  const displayRows = (table.rows ?? []) as any[];


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

      {/* Note auto-générée : décomposition des remontées par mois d'encaissement réel */}
      {cashSources.buckets.length > 0 && (
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
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: '#1E3A5F' }}>Note —</strong>{' '}
          Décomposition des montants « reçus » par mois d'encaissement réel
          {' '}(source : <code>pcgroup_intercos_cash</code>, taux fixe AED→USD {cashSources.fxAedPerUsd}) :
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            {cashSources.buckets.map((b) => (
              <li key={b.label} style={{ marginBottom: 4 }}>
                <strong style={{ textTransform: 'capitalize' }}>{b.label}</strong> —{' '}
                {b.byEntity.map((e, i) => (
                  <span key={e.entity}>
                    {i > 0 ? ', ' : ''}
                    {e.entity} ≈ <strong>${Math.round(e.usd).toLocaleString('en-US')}</strong>
                    {' '}(AED {Math.round(e.aed).toLocaleString('en-US')})
                  </span>
                ))}
                {b.byEntity.length > 1 && (
                  <> — total <strong>~${Math.round(b.totalUsd).toLocaleString('en-US')}</strong></>
                )}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 6, fontSize: 11, color: '#6B7280' }}>
            Classement basé sur la mention du mois dans la note Supabase, sinon sur la date de
            dernière mise à jour de la ligne.
          </div>
        </div>
      )}

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

      {/* ============================================================ */}
      {/* SECTIONS MÉTIER — Phases MaxScale / DG Solutions / SPY isolé */}
      {/* ============================================================ */}
      {(() => {
        const maxScale = (intercos as any).maxScalePhase;
        const dgPhase = (intercos as any).dgSolutionsPhase;
        const spy = (intercos as any).spyIsolated;
        const sectionWrap: React.CSSProperties = {
          border: '1px solid #1E3A5F',
          borderRadius: 8,
          background: '#fff',
          marginTop: 24,
          overflow: 'hidden',
        };
        const headerStyle = (bg: string): React.CSSProperties => ({
          background: bg,
          color: '#fff',
          padding: '12px 16px',
          fontWeight: 700,
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        });
        const rowStyle: React.CSSProperties = {
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid #F1F5F9',
          fontSize: 13,
        };
        const valueStyle: React.CSSProperties = { fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' };

        return (
          <>
            {maxScale && (
              <div style={sectionWrap}>
                <div style={headerStyle('linear-gradient(135deg, #6B4423 0%, #92591E 100%)')}>
                  <span>🗂️ Section A — Historique / Transition MaxScale</span>
                  <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>{maxScale.periodLabel}</span>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, fontStyle: 'italic' }}>{maxScale.note}</div>
                  <div style={rowStyle}>
                    <span>Total résultat MaxScale (DG + Comment + SPY)</span>
                    <span style={valueStyle}>{maxScale.totalResultat}</span>
                  </div>
                  <div style={rowStyle}>
                    <span>Montant théorique à remonter ({maxScale.rate})</span>
                    <span style={valueStyle}>{maxScale.theorique}</span>
                  </div>
                  <div style={rowStyle}>
                    <span>Montant réellement remonté</span>
                    <span style={{ ...valueStyle, color: '#059669' }}>{maxScale.recu}</span>
                  </div>
                  <div style={{ ...rowStyle, borderBottom: 'none', background: 'rgba(245, 158, 11, 0.08)', marginTop: 4 }}>
                    <strong>Écart / régularisation</strong>
                    <strong style={{ ...valueStyle, color: '#D97706' }}>{maxScale.ecart}</strong>
                  </div>
                </div>
              </div>
            )}

            {dgPhase && (
              <div style={sectionWrap}>
                <div style={headerStyle('linear-gradient(135deg, #0F1E33 0%, #1E3A5F 100%)')}>
                  <span>🏢 Section B — DG Solutions (Mars+)</span>
                  <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>{dgPhase.periodLabel}</span>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, fontStyle: 'italic' }}>{dgPhase.note}</div>
                  <div style={rowStyle}>
                    <span>DG activity (marge nette)</span>
                    <span style={valueStyle}>{dgPhase.dgActivity}</span>
                  </div>
                  <div style={rowStyle}>
                    <span>CommentTrust (marge nette)</span>
                    <span style={valueStyle}>{dgPhase.commentTrust}</span>
                  </div>
                  <div style={{ ...rowStyle, background: 'rgba(30, 58, 95, 0.05)' }}>
                    <strong>Base de calcul (DG + Comment)</strong>
                    <strong style={valueStyle}>{dgPhase.base}</strong>
                  </div>
                  <div style={{ ...rowStyle, background: 'rgba(30, 58, 95, 0.1)' }}>
                    <strong>Total DG remontable ({dgPhase.rate})</strong>
                    <strong style={{ ...valueStyle, color: '#1E3A5F' }}>{dgPhase.remontable}</strong>
                  </div>
                  <div style={rowStyle}>
                    <span>Déjà remonté</span>
                    <span style={{ ...valueStyle, color: '#059669' }}>{dgPhase.recu}</span>
                  </div>
                  <div style={{ ...rowStyle, borderBottom: 'none', background: 'rgba(245, 158, 11, 0.08)', marginTop: 4 }}>
                    <strong>Solde à remonter</strong>
                    <strong style={{ ...valueStyle, color: '#D97706' }}>{dgPhase.solde}</strong>
                  </div>
                </div>
              </div>
            )}

            {spy && (
              <div style={{ ...sectionWrap, borderColor: '#9333EA' }}>
                <div style={headerStyle('linear-gradient(135deg, #6B21A8 0%, #9333EA 100%)')}>
                  <span>🔒 Section C — SPY (Isolé · Mars+)</span>
                  <span style={{
                    fontSize: 10,
                    background: 'rgba(255,255,255,0.2)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}>
                    HORS PÉRIMÈTRE CALCUL DG
                  </span>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, fontStyle: 'italic' }}>{spy.note}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 12, background: '#FAFAFA' }}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Revenue SPY</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1E3A5F' }}>{spy.revenue}</div>
                    </div>
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 12, background: '#FAFAFA' }}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Costs SPY</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626' }}>{spy.costs}</div>
                    </div>
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 12, background: '#FAFAFA' }}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Profit SPY ({spy.marginPct})</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>{spy.profit}</div>
                    </div>
                  </div>
                  <div style={{ ...rowStyle, borderBottom: 'none', background: 'rgba(147, 51, 234, 0.06)' }}>
                    <span>Flux SPY remonté (info uniquement)</span>
                    <span style={{ ...valueStyle, color: '#7C3AED' }}>{spy.cashRecu}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Détail technique consolidé (legacy, conservé pour traçabilité) */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '2px dashed #E5E7EB' }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
          ▼ Détail consolidé par filiale (traçabilité)
        </div>
      </div>

      {/* Cards visuelles : chaque filiale (Agency, Structuring, DG Solutions,
          SPY, Comment/Trust) est affichée séparément — pas de regroupement
          "Digit Group". */}

      {Array.isArray((intercos as any).entityCards) && (() => {
        const cards = (intercos as any).entityCards as any[];

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
                {cards.map(renderCard)}
              </div>
            </div>
          </div>
        );
      })()}



    </div>
  );
}
