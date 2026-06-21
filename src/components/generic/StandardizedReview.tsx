// Revue des données standardisées (pilotées par template) : alertes, confiance par chiffre,
// provenance, dérivés en lecture seule, inputs éditables. Le recalcul/validation est géré par le parent.
import { AlertTriangle, Info, ShieldCheck, CircleHelp, GitMerge } from 'lucide-react';

interface Row {
  id: string; label: string; value: number | string | null; unit?: string;
  derived?: boolean; type?: string; note?: string; source?: string;
  confidence?: 'single' | 'corroborated' | 'conflict' | 'manual';
}
interface Section { key: string; label: string; rows: Row[] }
interface Flag { id: string; label: string; severity: 'error' | 'warn' }

const CONF: Record<string, { label: string; cls: string; Icon: typeof Info }> = {
  corroborated: { label: 'corroboré', cls: 'bg-emerald-100 text-emerald-700', Icon: ShieldCheck },
  single: { label: '1 source', cls: 'bg-muted text-muted-foreground', Icon: Info },
  conflict: { label: 'conflit', cls: 'bg-red-100 text-red-700', Icon: GitMerge },
  manual: { label: 'manuel', cls: 'bg-blue-100 text-blue-700', Icon: CircleHelp },
};

function fmt(v: number | string | null, unit?: string) {
  if (v == null || v === '') return '—';
  const n = typeof v === 'number' ? v : Number(v);
  const num = Number.isFinite(n) ? n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : String(v);
  return unit ? `${num} ${unit}` : num;
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

  return (
    <div className="space-y-4">
      {/* Bandeau d'alertes */}
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

      {sections.map((section, si) => (
        <div key={si} className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b font-semibold text-sm">{section.label}</div>
          <table className="w-full text-sm">
            <tbody>
              {section.rows.map((row, ri) => {
                const conf = row.confidence ? CONF[row.confidence] : null;
                return (
                  <tr key={ri} className={`border-b last:border-0 ${row.type === 'total' ? 'font-semibold bg-muted/20' : ''}`}>
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        {row.label}
                        {row.note && <span title={row.note}><Info className="w-3.5 h-3.5 text-muted-foreground/60" /></span>}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 w-40 text-right">
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
                    <td className="px-3 py-1.5 w-28">
                      {conf && (
                        <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full ${conf.cls}`}
                          title={row.source ?? ''}>
                          <conf.Icon className="w-3 h-3" /> {conf.label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" /> Les lignes grisées sont calculées automatiquement. Survolez un badge pour voir la provenance.
      </p>
    </div>
  );
}
