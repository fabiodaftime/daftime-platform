import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { type PCGroupMonthData } from './PCGroupData';

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

  const { kpis, table, recap } = intercos;
  const monthLabel = (data as any).monthLabel ?? '';
  const sourceMonths = table.columns.map((c: any) => c.label).join(', ');
  const safeLabel = String(monthLabel).replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'ytd';

  const buildTableRows = () => {
    const header = ['Entité', ...table.columns.map((c: any) => c.label), 'Total à Remonter'];
    const rows = table.rows.map((r: any) => [
      r.entity,
      ...table.columns.map((c: any) => r[c.key] ?? '—'),
      r.ytd,
    ]);
    const total = [
      table.total.entity,
      ...table.columns.map((c: any) => table.total[c.key] ?? '—'),
      table.total.ytd,
    ];
    return { header, rows, total };
  };

  const buildRecapRows = () => {
    const header = ['Indicateur', 'Scénario 1 (Base)', 'Scénario 2 (+ Apport Max)'];
    const rows = recap.map((r: any) => [r.label, r.s1, r.s2]);
    return { header, rows };
  };

  const exportCSV = () => {
    const t = buildTableRows();
    const rc = buildRecapRows();
    const lines: any[][] = [];
    lines.push([`Récapitulatif Intercos — YTD ${monthLabel}`]);
    lines.push([`Mois sources: ${sourceMonths}`]);
    lines.push([]);
    lines.push(['== Détail des Remontées par Filiale ==']);
    lines.push(t.header);
    t.rows.forEach((r) => lines.push(r));
    lines.push(t.total);
    lines.push([]);
    lines.push(['== Récapitulatif Situation Intercos ==']);
    lines.push(rc.header);
    rc.rows.forEach((r) => lines.push(r));
    const csv = Papa.unparse(lines);
    downloadBlob('\uFEFF' + csv, `intercos_${safeLabel}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportPDF = () => {
    const t = buildTableRows();
    const rc = buildRecapRows();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text(`Récapitulatif Intercos — YTD ${monthLabel}`, 40, 40);
    doc.setFontSize(9);
    doc.text(`Mois sources: ${sourceMonths}`, 40, 58);

    // KPIs
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
      head: [rc.header],
      body: rc.rows,
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
                <th style={{ background: 'rgba(16, 185, 129, 0.15)' }}>Total à Remonter</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.entity}</td>
                  {table.columns.map((c: any) => (
                    <td key={c.key}>{r[c.key] ?? '—'}</td>
                  ))}
                  <td style={{ background: 'rgba(16, 185, 129, 0.1)', fontWeight: 600 }}>{r.ytd}</td>
                </tr>
              ))}
              <tr className="pcg-comparison-total">
                <td>{table.total.entity}</td>
                {table.columns.map((c: any) => (
                  <td key={c.key}>{table.total[c.key] ?? '—'}</td>
                ))}
                <td style={{ background: '#1E3A5F', color: '#fff', fontWeight: 700 }}>{table.total.ytd}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section "Analyse de la Situation Financière" retirée à la demande client */}
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
              {/* Ligne "Non exigible" retirée — vue simplifiée */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
