// Contrôles croisés du mois + indice de fiabilité (/100), calculés par le moteur à la standardisation.
// Chaque contrôle : OK · écart (montants, explication, action) · non contrôlable (pièce à fournir).
import type { Control, Reliability } from '../../../supabase/functions/_shared/controls';

const STATUS: Record<Control['status'], { label: string; cls: string }> = {
  ok: { label: 'OK', cls: 'bg-emerald-100 text-emerald-800' },
  ecart: { label: 'Écart', cls: 'bg-amber-100 text-amber-800' },
  non_controlable: { label: 'Non contrôlable', cls: 'bg-muted text-muted-foreground' },
};
export const reliabilityTone = (s: number) => (s >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : s >= 70 ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200');

export function ControlsPanel({ controls, reliability }: { controls?: Control[] | null; reliability?: Reliability | null }) {
  if (!controls?.length && !reliability) return null;
  const order = { ecart: 0, non_controlable: 1, ok: 2 } as const;
  const list = [...(controls ?? [])].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <div className="mb-5 border rounded-lg bg-background">
      <div className="flex flex-wrap items-center gap-3 px-3 py-2.5 border-b">
        <div className="text-sm font-medium">Contrôles du mois</div>
        {reliability && (
          <div className={`ml-auto inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded border text-sm ${reliabilityTone(reliability.score)}`}
            title={`Complétude des sources ${Math.round(reliability.completeness * 100)} % × contrôles ${Math.round(reliability.controls * 100)} % × débits classés ${Math.round(reliability.classified * 100)} %`}>
            <span className="text-xs">Fiabilité</span><b className="tabular-nums text-base">{reliability.score}</b><span className="text-xs">/100</span>
          </div>
        )}
      </div>
      {reliability && reliability.score < 90 && (
        <p className="px-3 pt-2 text-xs text-muted-foreground">
          Cible avant envoi au client : 90. {reliability.missing.length ? <>Sources manquantes : <b>{reliability.missing.join(', ')}</b>. </> : null}
          Complétude {Math.round(reliability.completeness * 100)} % · contrôles {Math.round(reliability.controls * 100)} % · débits classés {Math.round(reliability.classified * 100)} %.
        </p>
      )}
      <ul className="divide-y">
        {list.map((c) => (
          <li key={c.id} className="px-3 py-2 text-sm flex flex-wrap gap-x-3 gap-y-1">
            <span className={`text-[11px] px-1.5 py-0.5 rounded h-fit whitespace-nowrap ${STATUS[c.status].cls}`}>{STATUS[c.status].label}</span>
            <div className="flex-1 min-w-[220px]">
              <div className="font-medium">{c.label}</div>
              <div className="text-muted-foreground text-xs">{c.detail}</div>
              {c.action && <div className="text-xs mt-0.5">→ {c.action}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
