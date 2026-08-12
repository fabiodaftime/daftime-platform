// Panneau admin : liste de graphiques OBLIGATOIRES pour un client, réinjectés à chaque génération.
// Écrit dans clients.forced_widgets ; generate-dashboard les garantit (s'ils sont rendables ce mois).
import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, X, Loader2 } from 'lucide-react';

export type ForcedWidget = { type: string; title?: string; breakdown?: string; metrics?: string[] };

// Types de graphes proposés + ce qu'ils consomment (breakdown nommé, ou liste de métriques).
const TYPES: { type: string; label: string; needs: 'breakdown' | 'metrics' }[] = [
  { type: 'map', label: 'Carte géographique', needs: 'breakdown' },
  { type: 'ranking', label: 'Classement (barres)', needs: 'breakdown' },
  { type: 'share', label: 'Répartition (barre 100 %)', needs: 'breakdown' },
  { type: 'treemap', label: 'Treemap', needs: 'breakdown' },
  { type: 'donut', label: 'Camembert', needs: 'metrics' },
  { type: 'bar', label: 'Barres', needs: 'metrics' },
  { type: 'line', label: 'Courbe (tendance)', needs: 'metrics' },
  { type: 'kpi_row', label: 'Ligne de KPI', needs: 'metrics' },
];
const typeLabel = (t: string) => TYPES.find((x) => x.type === t)?.label ?? t;

export function ForcedWidgetsPanel({ clientId, dataJson, initial, onChange }: {
  clientId: string;
  dataJson: { breakdowns?: Record<string, { label?: string }>; history?: { labels?: Record<string, string> } } | null | undefined;
  initial: ForcedWidget[];
  onChange?: (list: ForcedWidget[]) => void;
}) {
  const [list, setList] = useState<ForcedWidget[]>(Array.isArray(initial) ? initial : []);
  const [type, setType] = useState('map');
  const [breakdown, setBreakdown] = useState('');
  const [metrics, setMetrics] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const breakdowns = useMemo(
    () => Object.entries(dataJson?.breakdowns ?? {}).map(([key, v]) => ({ key, label: v?.label ?? key })),
    [dataJson],
  );
  const metricOpts = useMemo(
    () => Object.entries(dataJson?.history?.labels ?? {}).map(([id, label]) => ({ id, label })),
    [dataJson],
  );
  const needs = TYPES.find((x) => x.type === type)?.needs ?? 'breakdown';

  const persist = async (next: ForcedWidget[]) => {
    setList(next); onChange?.(next); setSaving(true); setErr(null);
    const { error } = await supabase.from('clients' as never).update({ forced_widgets: next } as never).eq('id', clientId);
    setSaving(false);
    if (error) setErr(error.message);
  };
  const add = () => {
    const w: ForcedWidget = { type };
    if (needs === 'breakdown') { if (!breakdown) return; w.breakdown = breakdown; }
    else { if (!metrics.length) return; w.metrics = metrics; }
    if (title.trim()) w.title = title.trim();
    persist([...list, w]);
    setBreakdown(''); setMetrics([]); setTitle('');
  };
  const remove = (i: number) => persist(list.filter((_, j) => j !== i));

  const desc = (w: ForcedWidget) => w.breakdown
    ? (breakdowns.find((b) => b.key === w.breakdown)?.label ?? w.breakdown)
    : (w.metrics ?? []).map((m) => metricOpts.find((o) => o.id === m)?.label ?? m).join(', ');

  return (
    <div className="border rounded-lg p-3 bg-background">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Graphiques obligatoires {saving && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}</div>
        <span className="text-xs text-muted-foreground">Réappliqués à chaque génération</span>
      </div>

      {list.length === 0
        ? <p className="text-xs text-muted-foreground mb-2">Aucun. Ex. : ajoute une carte des ventes par pays.</p>
        : (
          <ul className="mb-3 space-y-1">
            {list.map((w, i) => (
              <li key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-1">
                <span className="font-medium whitespace-nowrap">{typeLabel(w.type)}</span>
                <span className="text-muted-foreground truncate">· {desc(w)}{w.title ? ` — « ${w.title} »` : ''}</span>
                <button onClick={() => remove(i)} className="ml-auto text-muted-foreground hover:text-destructive shrink-0" aria-label="Retirer">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

      <div className="flex flex-wrap items-center gap-2">
        <select value={type} onChange={(e) => { setType(e.target.value); setBreakdown(''); setMetrics([]); }}
          className="h-8 rounded border bg-background px-2 text-sm">
          {TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>

        {needs === 'breakdown' ? (
          <select value={breakdown} onChange={(e) => setBreakdown(e.target.value)}
            className="h-8 rounded border bg-background px-2 text-sm min-w-[160px]">
            <option value="">— donnée —</option>
            {breakdowns.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
        ) : (
          <select multiple value={metrics}
            onChange={(e) => setMetrics(Array.from(e.target.selectedOptions).map((o) => o.value))}
            className="rounded border bg-background px-2 text-sm min-w-[160px] h-16" title="Ctrl/Cmd pour en choisir plusieurs">
            {metricOpts.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        )}

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (optionnel)"
          className="h-8 rounded border bg-background px-2 text-sm" />
        <Button size="sm" variant="outline" onClick={add}
          disabled={saving || (needs === 'breakdown' ? !breakdown : !metrics.length)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
        </Button>
      </div>

      {breakdowns.length === 0 && metricOpts.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2">Génère d'abord un dashboard pour voir les données disponibles de ce client.</p>
      )}
      {err && <p className="text-xs text-destructive mt-2">Erreur d'enregistrement : {err}</p>}
      <p className="text-xs text-muted-foreground mt-2">💡 Un graphique n'apparaît que si sa donnée existe pour le mois. <b>Régénère</b> le dashboard pour l'appliquer.</p>
    </div>
  );
}
