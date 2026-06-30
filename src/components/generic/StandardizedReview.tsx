// Revue/AUDIT des données standardisées (template) : provenance visible par chiffre, documents
// analysés (rôle + source), détail des calculs (formule + substitution), inputs éditables.
// Le recalcul des dérivés + la validation sont gérés par le parent (édition → nouvelle version → régénération).
import { AlertTriangle, Info, ShieldCheck, CircleHelp, GitMerge, FileText, FunctionSquare } from 'lucide-react';

interface Row {
  id: string; label: string; value: number | string | null; unit?: string;
  derived?: boolean; formula?: string; type?: string; note?: string; source?: string;
  confidence?: 'parsed' | 'single' | 'corroborated' | 'conflict' | 'manual';
}
interface Section { key: string; label: string; rows: Row[] }
interface Flag { id: string; label: string; severity: 'error' | 'warn' | 'info' }
interface Classif { parser?: string; file?: string; role?: string; effRole?: string; manual?: boolean; revenueCandidate?: number | null; note?: string }

const CONF: Record<string, { label: string; cls: string; Icon: typeof Info }> = {
  parsed: { label: 'fichier (exact)', cls: 'bg-teal-100 text-teal-700', Icon: ShieldCheck },
  corroborated: { label: 'corroboré', cls: 'bg-emerald-100 text-emerald-700', Icon: ShieldCheck },
  single: { label: '1 source', cls: 'bg-muted text-muted-foreground', Icon: Info },
  conflict: { label: 'conflit', cls: 'bg-red-100 text-red-700', Icon: GitMerge },
  manual: { label: 'manuel', cls: 'bg-blue-100 text-blue-700', Icon: CircleHelp },
};

const ROLE: Record<string, string> = {
  revenue: 'CA (facturé)', payment: 'Réception (encaissements)', bank: 'Banque',
  internal: 'Mouvement interne', analytics: 'Analytics', ads: 'Publicité', accounting: 'Comptable',
};

const nf = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
function fmt(v: number | string | null, unit?: string) {
  if (v == null || v === '') return '—';
  const n = typeof v === 'number' ? v : Number(v);
  const num = Number.isFinite(n) ? nf(n) : String(v);
  return unit ? `${num} ${unit}` : num;
}

// Réécrit une formule en remplaçant les ids de métriques par leur valeur → calcul lisible.
const FUNCS = new Set(['present', 'coalesce', 'min', 'max', 'abs', 'round', 'true', 'false', 'null']);
function expand(formula: string, valById: Record<string, number>): string {
  return formula.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (tok) => {
    if (FUNCS.has(tok)) return tok;
    const v = valById[tok];
    return typeof v === 'number' && Number.isFinite(v) ? nf(v) : tok;
  });
}

export function StandardizedReview({
  data,
  onInputChange,
}: {
  data: any;
  onInputChange: (id: string, value: number | null) => void;
}) {
  const sections: Section[] = Array.isArray(data?.sections) ? data.sections : [];
  const flags: Flag[] = Array.isArray(data?.flags) ? data.flags : [];
  if (sections.length === 0) return <p className="text-sm text-muted-foreground">Aucune donnée standardisée pour ce mois.</p>;

  const errors = flags.filter((f) => f.severity === 'error');
  const warns = flags.filter((f) => f.severity === 'warn');
  const infos = flags.filter((f) => f.severity === 'info');
  const meta = data?.meta ?? {};
  const classif: Classif[] = Array.isArray(meta.classification) ? meta.classification : [];
  const fx = meta.fx as { reporting?: string; source?: string; detected?: string[] } | undefined;

  // Carte id → valeur (pour développer les formules).
  const valById: Record<string, number> = {};
  for (const s of sections) for (const r of s.rows) if (typeof r.value === 'number') valById[r.id] = r.value;

  return (
    <div className="space-y-4">
      {/* Alertes */}
      {(errors.length > 0 || warns.length > 0) && (
        <div className="space-y-2">
          {errors.map((f, i) => (
            <div key={`e${i}`} className="flex items-start gap-2 text-sm rounded-md border border-red-200 bg-red-50 text-red-800 px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {f.label}
            </div>
          ))}
          {warns.map((f, i) => (
            <div key={`w${i}`} className="flex items-start gap-2 text-sm rounded-md border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {f.label}
            </div>
          ))}
        </div>
      )}

      {/* Documents analysés (provenance au niveau fichier) */}
      {(classif.length > 0 || fx) && (
        <details className="border rounded-lg overflow-hidden" open>
          <summary className="bg-muted/50 px-3 py-2 border-b font-semibold text-sm cursor-pointer flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documents analysés ({classif.length}) {meta.sources_count ? `· ${meta.sources_count} source(s)` : ''}
          </summary>
          <div className="divide-y">
            {classif.map((c, i) => (
              <div key={i} className="px-3 py-2 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">{c.file ?? '—'}</span>
                {c.effRole && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{ROLE[c.effRole] ?? c.effRole}{c.manual ? ' · imposé' : ''}</span>}
                <span className="text-xs text-muted-foreground">via {c.parser ?? 'IA'}</span>
                {typeof c.revenueCandidate === 'number' && <span className="text-xs text-muted-foreground">→ CA candidat {nf(c.revenueCandidate)}</span>}
                {c.note && <span className="text-xs text-muted-foreground italic">{c.note}</span>}
              </div>
            ))}
            {fx && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Devise de reporting : <b>{fx.reporting}</b> · taux {fx.source}{fx.detected?.length ? ` · devises détectées : ${fx.detected.join(', ')}` : ''}
              </div>
            )}
          </div>
        </details>
      )}

      {/* Tableau par section : valeur éditable, confiance, origine / calcul */}
      {sections.map((section, si) => (
        <div key={si} className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b font-semibold text-sm">{section.label}</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b">
                <th className="text-left px-3 py-1.5 font-semibold">Indicateur</th>
                <th className="text-right px-3 py-1.5 font-semibold w-40">Valeur</th>
                <th className="text-left px-3 py-1.5 font-semibold w-28">Fiabilité</th>
                <th className="text-left px-3 py-1.5 font-semibold">Origine / calcul</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, ri) => {
                const conf = row.confidence ? CONF[row.confidence] : null;
                return (
                  <tr key={ri} className={`border-b last:border-0 align-top ${row.type === 'total' ? 'font-semibold bg-muted/20' : ''}`}>
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        {row.label}
                        {row.note && <span title={row.note}><Info className="w-3.5 h-3.5 text-muted-foreground/60" /></span>}
                      </span>
                      <span className="block text-[10px] text-muted-foreground/70 font-normal">{row.id}</span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {row.derived ? (
                        <span className="tabular-nums">{fmt(row.value, row.unit)}</span>
                      ) : (
                        <span className="inline-flex items-center justify-end gap-1">
                          <input
                            className="w-24 bg-background border rounded px-2 py-0.5 text-right tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
                            value={row.value ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(',', '.');
                              const n = Number(raw);
                              onInputChange(row.id, raw !== '' && Number.isFinite(n) ? n : null);
                            }}
                          />
                          {row.unit && <span className="text-xs text-muted-foreground w-8 text-left">{row.unit}</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      {conf && (
                        <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full ${conf.cls}`}>
                          <conf.Icon className="w-3 h-3" /> {conf.label}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">
                      {row.derived && row.formula ? (
                        <span className="inline-flex items-start gap-1.5">
                          <FunctionSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                          <span>
                            <code className="text-[11px] text-foreground/80">{row.formula}</code>
                            {typeof row.value === 'number' && <span className="block text-[11px]">= {expand(row.formula, valById)} = <b className="text-foreground">{nf(row.value)}</b></span>}
                          </span>
                        </span>
                      ) : (
                        <span title={row.source ?? ''}>{row.source ?? '—'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {infos.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Notes & informations ({infos.length})</summary>
          <ul className="mt-1 space-y-1 list-disc pl-5">{infos.map((f, i) => <li key={i}>{f.label}</li>)}</ul>
        </details>
      )}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" /> Les lignes calculées affichent leur formule et le détail du calcul. Modifiez un chiffre saisi → les dérivés se recalculent, et le dashboard se met à jour à la régénération.
      </p>
    </div>
  );
}
