// Édition des REPÈRES (verdicts bon/moyen/alerte) PAR CLIENT. Surcharge les défauts sectoriels :
// pilote la couleur affichée sous chaque KPI ET l'analyse IA. Sauvegarde dans clients.benchmarks,
// puis ré-affiche le dashboard courant pour voir l'impact tout de suite.
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invokeFn } from '@/lib/genericApi';

type Ov = { dir?: 'high' | 'low'; good?: number; warn?: number; ref?: string; off?: boolean };
type Def = { dir: 'high' | 'low'; good: number; warn: number; ref: string };

// Doit refléter supabase/functions/_shared/benchmarks.ts (placeholders + lignes pré-remplies).
const DEF: Record<string, Record<string, Def>> = {
  ecommerce: {
    conversion_rate: { dir: 'high', good: 2.5, warn: 1.5, ref: 'repère 2-3 %' },
    add_to_cart_rate: { dir: 'high', good: 10, warn: 6, ref: 'repère ~10 %' },
    roas: { dir: 'high', good: 3, warn: 2, ref: 'rentable > 3-4' },
    refund_rate: { dir: 'low', good: 3, warn: 6, ref: 'sain < 3 %' },
    repeat_rate: { dir: 'high', good: 25, warn: 12, ref: 'fidélisation > 25 %' },
    new_customer_share: { dir: 'low', good: 65, warn: 85, ref: 'trop de nouveaux = pas de réachat' },
    purchase_frequency: { dir: 'high', good: 1.5, warn: 1.1, ref: 'réachat > 1,5' },
    taux_marge_brute: { dir: 'high', good: 45, warn: 30, ref: 'e-commerce 40-60 %' },
    marge_ebitda: { dir: 'high', good: 10, warn: 0, ref: 'viser > 10 %' },
    marge_nette: { dir: 'high', good: 8, warn: 0, ref: 'viser > 8 %' },
  },
  default: {
    taux_marge_brute: { dir: 'high', good: 40, warn: 25, ref: 'cible > 40 %' },
    marge_ebitda: { dir: 'high', good: 10, warn: 0, ref: 'viser > 10 %' },
    marge_nette: { dir: 'high', good: 8, warn: 0, ref: 'viser > 8 %' },
    gop_margin: { dir: 'high', good: 30, warn: 18, ref: 'hôtellerie 30-38 %' },
  },
};
const defFor = (activity: string | undefined, id: string): Def | null => DEF[activity ?? '']?.[id] ?? DEF.default[id] ?? null;

export function BenchmarksPanel({ clientId, activity, metrics, benchmarks, dashboardId, onApplied }: {
  clientId: string;
  activity?: string;
  metrics: { id: string; label: string }[];
  benchmarks: Record<string, Ov>;
  dashboardId?: string;
  onApplied?: () => void;
}) {
  const [edited, setEdited] = useState<Record<string, Ov>>(() => ({ ...benchmarks }));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const rows = useMemo(() => {
    const present = new Set(metrics.map((m) => m.id));
    const ids = new Set<string>();
    Object.keys(DEF[activity ?? ''] ?? {}).forEach((i) => present.has(i) && ids.add(i));
    Object.keys(DEF.default).forEach((i) => present.has(i) && ids.add(i));
    Object.keys(benchmarks ?? {}).forEach((i) => present.has(i) && ids.add(i));
    return metrics.filter((m) => ids.has(m.id));
  }, [metrics, activity, benchmarks]);

  const set = (id: string, patch: Ov) => { setDone(false); setEdited((e) => ({ ...e, [id]: { ...e[id], ...patch } })); };

  const save = async () => {
    setBusy(true); setDone(false);
    const clean: Record<string, Ov> = {};
    for (const [id, o] of Object.entries(edited)) {
      const x: Ov = {};
      if (o.off) x.off = true;
      if (o.dir) x.dir = o.dir;
      if (o.good != null && !Number.isNaN(Number(o.good))) x.good = Number(o.good);
      if (o.warn != null && !Number.isNaN(Number(o.warn))) x.warn = Number(o.warn);
      if (o.ref?.trim()) x.ref = o.ref.trim();
      if (Object.keys(x).length) clean[id] = x;
    }
    try {
      await supabase.from('clients' as any).update({ benchmarks: clean }).eq('id', clientId);
      if (dashboardId) { try { await invokeFn('restyle-dashboard', { dashboard_id: dashboardId, message: '' }); } catch { /* re-render best-effort */ } }
      setDone(true);
      onApplied?.();
    } finally { setBusy(false); }
  };

  if (!rows.length) return <p className="text-sm text-muted-foreground">Aucun indicateur à repère pour ce client (générez d'abord des données standardisées).</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Ajustez les seuils <span className="text-green-600 font-medium">vert</span> / <span className="text-amber-600 font-medium">orange</span> par indicateur.
        Laissez vide pour garder le repère sectoriel (valeur grisée). Ces seuils pilotent la couleur sous chaque KPI <strong>et</strong> l'analyse de l'IA.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs text-muted-foreground border-b">
              <th className="text-left py-1.5 pr-2">Indicateur</th>
              <th className="text-left px-2">Sens</th>
              <th className="text-left px-2">Seuil 🟢</th>
              <th className="text-left px-2">Seuil 🟠</th>
              <th className="text-left px-2">Libellé repère</th>
              <th className="text-center px-2">Off</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const d = defFor(activity, m.id);
              const o = edited[m.id] ?? {};
              const dir = o.dir ?? d?.dir ?? 'high';
              return (
                <tr key={m.id} className={`border-b last:border-0 ${o.off ? 'opacity-45' : ''}`}>
                  <td className="py-1.5 pr-2 font-medium">{m.label}<div className="text-[10px] text-muted-foreground font-normal">{m.id}</div></td>
                  <td className="px-2">
                    <select value={dir} onChange={(e) => set(m.id, { dir: e.target.value as 'high' | 'low' })}
                      className="h-8 rounded border bg-background text-xs px-1">
                      <option value="high">▲ plus haut = mieux</option>
                      <option value="low">▼ plus bas = mieux</option>
                    </select>
                  </td>
                  <td className="px-2"><input type="number" step="any" value={o.good ?? ''} placeholder={d ? String(d.good) : '—'}
                    onChange={(e) => set(m.id, { good: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="h-8 w-20 rounded border bg-background px-2 text-xs" /></td>
                  <td className="px-2"><input type="number" step="any" value={o.warn ?? ''} placeholder={d ? String(d.warn) : '—'}
                    onChange={(e) => set(m.id, { warn: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="h-8 w-20 rounded border bg-background px-2 text-xs" /></td>
                  <td className="px-2"><input type="text" value={o.ref ?? ''} placeholder={d?.ref ?? 'repère…'}
                    onChange={(e) => set(m.id, { ref: e.target.value })}
                    className="h-8 w-44 rounded border bg-background px-2 text-xs" /></td>
                  <td className="px-2 text-center"><input type="checkbox" checked={!!o.off} onChange={(e) => set(m.id, { off: e.target.checked })} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Application…</> : 'Enregistrer & appliquer'}
        </Button>
        {done && <span className="text-xs text-green-600">Repères appliqués — le dashboard a été ré-affiché.</span>}
      </div>
    </div>
  );
}
