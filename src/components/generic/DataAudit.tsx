// Vue AUDIT (lecture seule) : dump brut et exhaustif de la donnée standardisée pour vérification.
// Tout y est : chaque chiffre, sa provenance, sa fiabilité, le détail des calculs ; documents
// analysés ; alertes ; breakdowns ; et le JSON brut. Filtrable + export CSV. L'édition reste dans « Données ».
import { useMemo, useState } from 'react';
import { FileText, ShieldCheck, Info, CircleHelp, GitMerge, FunctionSquare, Copy, Check, AlertTriangle } from 'lucide-react';

interface Trace { src: string; value: number }
interface Row {
  id: string; label: string; value: number | string | null; unit?: string;
  derived?: boolean; formula?: string; type?: string; note?: string; source?: string; trace?: Trace[];
  confidence?: 'parsed' | 'single' | 'corroborated' | 'conflict' | 'manual';
}
interface Classif { parser?: string; file?: string; role?: string; effRole?: string; manual?: boolean; revenueCandidate?: number | null; note?: string }

const CONF: Record<string, { label: string; cls: string; Icon: typeof Info }> = {
  parsed: { label: 'fichier', cls: 'bg-teal-100 text-teal-700', Icon: ShieldCheck },
  corroborated: { label: 'corroboré', cls: 'bg-emerald-100 text-emerald-700', Icon: ShieldCheck },
  single: { label: '1 source', cls: 'bg-muted text-muted-foreground', Icon: Info },
  conflict: { label: 'conflit', cls: 'bg-red-100 text-red-700', Icon: GitMerge },
  manual: { label: 'manuel', cls: 'bg-blue-100 text-blue-700', Icon: CircleHelp },
};
const ROLE: Record<string, string> = {
  revenue: 'CA (facturé)', payment: 'Réception', bank: 'Banque', internal: 'Interne',
  analytics: 'Analytics', ads: 'Publicité', accounting: 'Comptable',
};
const FUNCS = new Set(['present', 'coalesce', 'min', 'max', 'abs', 'round', 'true', 'false', 'null']);
const nf = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const fmt = (v: number | string | null, unit?: string) => {
  if (v == null || v === '') return '—';
  const n = typeof v === 'number' ? v : Number(v);
  const s = Number.isFinite(n) ? nf(n) : String(v);
  return unit ? `${s} ${unit}` : s;
};
const expand = (formula: string, valById: Record<string, number>) =>
  formula.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (t) => (FUNCS.has(t) ? t : (typeof valById[t] === 'number' && Number.isFinite(valById[t]) ? nf(valById[t]) : t)));

export function DataAudit({ data }: { data: any }) {
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);

  const sections: { key?: string; label: string; rows: Row[] }[] = Array.isArray(data?.sections) ? data.sections : [];
  const flags: { id?: string; label: string; severity: string }[] = Array.isArray(data?.flags) ? data.flags : [];
  const meta = data?.meta ?? {};
  const classif: Classif[] = Array.isArray(meta.classification) ? meta.classification : [];
  const fx = meta.fx as { reporting?: string; source?: string; detected?: string[] } | undefined;
  const breakdowns: Record<string, { label?: string; rows?: { label: string; value: number }[] }> = data?.breakdowns ?? {};

  const valById = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of sections) for (const r of s.rows) if (typeof r.value === 'number') m[r.id] = r.value;
    return m;
  }, [sections]);

  const allRows = useMemo(() => sections.flatMap((s) => s.rows.map((r) => ({ ...r, section: s.label }))), [sections]);
  const rowById = useMemo(() => { const m: Record<string, Row> = {}; for (const s of sections) for (const r of s.rows) m[r.id] = r; return m; }, [sections]);
  const fileOf = (src: string) => src.split(' — ')[0].split(' (')[0].trim();
  const inputsOf = (formula: string) => [...new Set((formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? []).filter((t) => !FUNCS.has(t)))];
  // Remonte (récursivement) les documents qui nourrissent une formule.
  const docsOf = (formula: string, seen = new Set<string>()): string[] => {
    const files = new Set<string>();
    for (const id of inputsOf(formula)) {
      if (seen.has(id)) continue; seen.add(id);
      const row = rowById[id];
      if (row?.derived && row.formula) docsOf(row.formula, seen).forEach((f) => files.add(f));
      else if (row?.trace?.length) row.trace.forEach((t) => files.add(fileOf(t.src)));
      else if (row?.source) files.add(fileOf(row.source));
    }
    return [...files];
  };
  const ql = q.trim().toLowerCase();
  const rows = ql ? allRows.filter((r) => `${r.label} ${r.id} ${r.section}`.toLowerCase().includes(ql)) : allRows;

  const copyCsv = () => {
    const head = ['Section', 'id', 'Libellé', 'Valeur', 'Unité', 'Type', 'Fiabilité', 'Origine / Formule'];
    const lines = allRows.map((r) => [r.section, r.id, r.label, r.value ?? '', r.unit ?? '', r.derived ? 'calculé' : 'saisi', r.confidence ?? '', r.derived ? (r.formula ?? '') : (r.source ?? '')]);
    const csv = [head, ...lines].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    navigator.clipboard.writeText(csv).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  if (!sections.length) return <p className="text-sm text-muted-foreground">Aucune donnée standardisée à auditer pour ce mois.</p>;

  const errs = flags.filter((f) => f.severity === 'error');
  const warns = flags.filter((f) => f.severity === 'warn');
  const infos = flags.filter((f) => f.severity === 'info');

  return (
    <div className="space-y-4 text-sm">
      {/* Résumé */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {meta.entity && <span><b>{meta.entity}</b></span>}
        {meta.period && <span className="text-muted-foreground">Période {meta.period}</span>}
        {meta.currency && <span className="text-muted-foreground">Devise {meta.currency}</span>}
        <span className="text-muted-foreground">{allRows.length} indicateurs</span>
        {typeof meta.sources_count === 'number' && <span className="text-muted-foreground">{meta.sources_count} source(s)</span>}
        {meta.validation && (
          <span className={`px-2 py-0.5 rounded-full ${meta.validation.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {meta.validation.ok ? '✓ validable' : 'bloquant'}
          </span>
        )}
      </div>

      {/* Alertes */}
      {[...errs, ...warns].length > 0 && (
        <div className="space-y-1.5">
          {errs.map((f, i) => <div key={`e${i}`} className="flex items-start gap-2 text-xs rounded-md border border-red-200 bg-red-50 text-red-800 px-3 py-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{f.label}</div>)}
          {warns.map((f, i) => <div key={`w${i}`} className="flex items-start gap-2 text-xs rounded-md border border-amber-200 bg-amber-50 text-amber-800 px-3 py-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{f.label}</div>)}
        </div>
      )}

      {/* Documents analysés */}
      {(classif.length > 0 || fx) && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b font-semibold text-xs flex items-center gap-2"><FileText className="w-4 h-4" />Documents analysés ({classif.length})</div>
          <div className="divide-y">
            {classif.map((c, i) => (
              <div key={i} className="px-3 py-1.5 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">{c.file ?? '—'}</span>
                {c.effRole && <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{ROLE[c.effRole] ?? c.effRole}{c.manual ? ' · imposé' : ''}</span>}
                <span className="text-muted-foreground">via {c.parser ?? 'IA'}</span>
                {typeof c.revenueCandidate === 'number' && <span className="text-muted-foreground">→ CA candidat {nf(c.revenueCandidate)}</span>}
                {c.note && <span className="text-muted-foreground italic">{c.note}</span>}
              </div>
            ))}
            {fx && <div className="px-3 py-1.5 text-xs text-muted-foreground">Reporting {fx.reporting} · taux {fx.source}{fx.detected?.length ? ` · détecté : ${fx.detected.join(', ')}` : ''}</div>}
          </div>
        </div>
      )}

      {/* Barre d'outils */}
      <div className="flex items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer un indicateur (nom ou id)…"
          className="flex-1 bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/30" />
        <button onClick={copyCsv} className="text-xs inline-flex items-center gap-1.5 border rounded px-2.5 py-1.5 hover:bg-muted">
          {copied ? <><Check className="w-3.5 h-3.5 text-emerald-600" />Copié</> : <><Copy className="w-3.5 h-3.5" />Copier (CSV)</>}
        </button>
      </div>

      {/* Table à plat */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b">
              <th className="text-left px-3 py-1.5">Section</th>
              <th className="text-left px-3 py-1.5">Indicateur</th>
              <th className="text-right px-3 py-1.5">Valeur</th>
              <th className="text-left px-3 py-1.5">Type</th>
              <th className="text-left px-3 py-1.5">Fiabilité</th>
              <th className="text-left px-3 py-1.5">Origine / formule</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const conf = r.confidence ? CONF[r.confidence] : null;
              return (
                <tr key={i} className="border-b last:border-0 align-top hover:bg-muted/20">
                  <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">{r.section}</td>
                  <td className="px-3 py-1.5">{r.label}<span className="block text-[10px] text-muted-foreground/70 font-mono">{r.id}</span></td>
                  <td className="px-3 py-1.5 text-right tabular-nums whitespace-nowrap">{fmt(r.value, r.unit)}</td>
                  <td className="px-3 py-1.5">{r.derived ? <span className="text-muted-foreground">calculé</span> : 'saisi'}</td>
                  <td className="px-3 py-1.5">{conf && <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${conf.cls}`}><conf.Icon className="w-3 h-3" />{conf.label}</span>}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {r.derived && r.formula ? (
                      <span className="inline-flex items-start gap-1.5">
                        <FunctionSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                        <span>
                          <code className="text-[11px] text-foreground/80">{r.formula}</code>
                          {typeof r.value === 'number' && <span className="block text-[11px]">= {expand(r.formula, valById)} = <b className="text-foreground">{nf(r.value)}</b></span>}
                          {(() => { const d = docsOf(r.formula); return d.length ? <span className="block text-[10px] text-muted-foreground/70">à partir de : {d.join(', ')}</span> : null; })()}
                        </span>
                      </span>
                    ) : r.trace?.length ? (
                      <span>
                        {r.trace.length > 1 && <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Cumul · {r.trace.length} docs</span>}
                        {r.trace.map((t, j) => <span key={j} className="block text-[11px]">{t.src} <b className="text-foreground tabular-nums">{nf(t.value)}</b></span>)}
                      </span>
                    ) : (r.source ?? '—')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Breakdowns dimensionnels */}
      {Object.keys(breakdowns).length > 0 && (
        <details className="border rounded-lg overflow-hidden">
          <summary className="bg-muted/50 px-3 py-2 border-b font-semibold text-xs cursor-pointer">Données dimensionnelles ({Object.keys(breakdowns).length})</summary>
          <div className="divide-y">
            {Object.entries(breakdowns).map(([k, b]) => (
              <div key={k} className="px-3 py-2 text-xs">
                <div className="font-medium">{b.label ?? k} <span className="text-muted-foreground font-mono">({k})</span></div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-muted-foreground">
                  {(b.rows ?? []).slice(0, 20).map((row, j) => <span key={j} className="tabular-nums">{row.label}: <b className="text-foreground">{nf(row.value)}</b></span>)}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* JSON brut */}
      <details className="border rounded-lg overflow-hidden">
        <summary className="bg-muted/50 px-3 py-2 border-b font-semibold text-xs cursor-pointer">JSON brut (source de vérité)</summary>
        <pre className="text-[11px] p-3 overflow-x-auto max-h-96 leading-relaxed">{JSON.stringify(data, null, 2)}</pre>
      </details>

      {infos.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Notes & informations ({infos.length})</summary>
          <ul className="mt-1 space-y-1 list-disc pl-5">{infos.map((f, i) => <li key={i}>{f.label}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
