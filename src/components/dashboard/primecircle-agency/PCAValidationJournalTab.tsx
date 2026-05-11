import { useMemo, useState } from 'react';
import { Clock, Download, Filter } from 'lucide-react';
import {
  getJournal,
  formatJournalDate,
  formatJournalDelta,
  formatJournalValue,
  type JournalEntry,
  type JournalOperation,
} from './pcaValidationJournal';
import { PCA_AVAILABLE_MONTHS, type PCAMonthId } from './PrimeCircleAgencyData';

const OP_META: Record<JournalOperation, { label: string; bg: string; color: string }> = {
  import:     { label: 'Import',     bg: 'rgba(30,86,160,0.10)',  color: '#1E56A0' },
  correction: { label: 'Correction', bg: 'rgba(245,158,11,0.12)', color: '#D97706' },
  audit:      { label: 'Audit',      bg: 'rgba(16,185,129,0.10)', color: '#10B981' },
};

function exportCsv(entries: JournalEntry[]) {
  const rows = [
    ['timestamp', 'operation', 'monthId', 'monthLabel', 'operator', 'reason', 'field', 'declared', 'recomputed', 'delta', 'unit'].join(','),
  ];
  for (const e of entries) {
    if (e.discrepancies.length === 0) {
      rows.push([
        e.timestamp, e.operation, e.monthId, JSON.stringify(e.monthLabel),
        JSON.stringify(e.operator), JSON.stringify(e.reason), '', '', '', '', '',
      ].join(','));
    } else {
      for (const d of e.discrepancies) {
        rows.push([
          e.timestamp, e.operation, e.monthId, JSON.stringify(e.monthLabel),
          JSON.stringify(e.operator), JSON.stringify(e.reason),
          d.field, String(d.declared), String(d.recomputed), String(d.delta), d.unit,
        ].join(','));
      }
    }
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pca-validation-journal-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PCAValidationJournalTab() {
  const all = useMemo(() => getJournal(), []);
  const [monthFilter, setMonthFilter] = useState<PCAMonthId | 'all'>('all');
  const [opFilter, setOpFilter] = useState<JournalOperation | 'all'>('all');

  const filtered = all.filter(
    (e) =>
      (monthFilter === 'all' || e.monthId === monthFilter) &&
      (opFilter === 'all' || e.operation === opFilter),
  );

  const totalDiscrepancies = filtered.reduce((s, e) => s + e.discrepancies.length, 0);

  return (
    <section style={{ fontFamily: 'IBM Plex Sans, sans-serif', padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F1419', margin: 0 }}>
            Journal de validation PCA
          </h2>
          <p style={{ fontSize: 13, color: '#536471', margin: '4px 0 0' }}>
            Trace append-only des opérations d'import / correction / audit avec écarts détectés
            (saisi vs recomputé) et horodatage. {filtered.length} opération
            {filtered.length > 1 ? 's' : ''} · {totalDiscrepancies} écart
            {totalDiscrepancies > 1 ? 's' : ''}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={14} color="#536471" />
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value as PCAMonthId | 'all')}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #CFD9DE', background: '#fff', fontSize: 12 }}
          >
            <option value="all">Tous les mois</option>
            {PCA_AVAILABLE_MONTHS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <select
            value={opFilter}
            onChange={(e) => setOpFilter(e.target.value as JournalOperation | 'all')}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #CFD9DE', background: '#fff', fontSize: 12 }}
          >
            <option value="all">Toutes opérations</option>
            <option value="import">Import</option>
            <option value="correction">Correction</option>
            <option value="audit">Audit</option>
          </select>
          <button
            onClick={() => exportCsv(filtered)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              background: '#1E56A0', color: '#fff', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          Aucune entrée de journal pour ce filtre.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((e) => {
            const meta = OP_META[e.operation];
            return (
              <article
                key={e.id}
                style={{
                  background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
                  padding: '14px 18px', boxShadow: '0 1px 2px rgba(15,20,25,0.04)',
                }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                        borderRadius: 999, background: meta.bg, color: meta.color,
                        fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase',
                      }}
                    >
                      {meta.label}
                    </span>
                    <strong style={{ fontSize: 14, color: '#0F1419' }}>{e.monthLabel}</strong>
                    <span style={{ fontSize: 12, color: '#64748B' }}>· {e.operator}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontFamily: 'IBM Plex Mono, monospace' }}>
                    <Clock size={12} /> {formatJournalDate(e.timestamp)}
                  </div>
                </header>

                <p style={{ fontSize: 13, color: '#334155', margin: '0 0 10px' }}>{e.reason}</p>

                {e.discrepancies.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                    ✓ Aucun écart détecté à cette opération.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '4px 6px' }}>Champ</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right' }}>Saisi</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right' }}>Recomputé</th>
                        <th style={{ padding: '4px 6px', textAlign: 'right' }}>Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.discrepancies.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '4px 6px', color: '#0F1419', fontWeight: 600 }}>{d.field}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>{formatJournalValue(d.declared, d.unit)}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: '#10B981', fontWeight: 700 }}>{formatJournalValue(d.recomputed, d.unit)}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: d.delta >= 0 ? '#10B981' : '#DC2626', fontWeight: 700 }}>{formatJournalDelta(d.delta, d.unit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 14, lineHeight: 1.5 }}>
        Append-only : chaque opération d'import ou correction ajoute une nouvelle entrée
        en haut du journal. Les entrées historiques ne sont jamais modifiées pour préserver
        la piste d'audit.
      </p>
    </section>
  );
}
