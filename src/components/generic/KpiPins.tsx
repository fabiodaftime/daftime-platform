// Ratios épinglés par le conseiller (Lot 6) : 3-6 indicateurs clés à suivre, avec objectif,
// statut (sain/vigilance/alerte vs objectif) et le commentaire du conseiller (pourquoi ça compte).
// Valeur courante lue depuis le dernier dashboard visible (RLS : le client ne voit que le publié).
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Target } from 'lucide-react';

type Pin = { metric_id: string; target: number | null; direction: string; comment: string | null; display_order: number };
type MetaRow = { value: number; label: string; unit?: string };

const fmtVal = (v: number, unit?: string, currency = 'EUR') => {
  if (unit === '%') return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
  if (unit === 'j') return `${Math.round(v).toLocaleString('fr-FR')} j`;
  if (unit === 'x') return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}×`;
  if (!unit) return v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: unit.length === 3 ? unit : currency, maximumFractionDigits: 0 }).format(v); }
  catch { return `${Math.round(v).toLocaleString('fr-FR')} ${unit}`; }
};

function statusOf(cur: number, target: number | null, dir: string): 'good' | 'warn' | 'bad' {
  if (target == null || target === 0) return 'warn';
  const ratio = dir === 'down' ? target / cur : cur / target;
  return ratio >= 1 ? 'good' : ratio >= 0.75 ? 'warn' : 'bad';
}
const stColor: Record<string, string> = { good: 'text-emerald-600', warn: 'text-amber-600', bad: 'text-red-600' };
const stDot: Record<string, string> = { good: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-red-500' };

export function KpiPins({ clientId, currency = 'EUR' }: { clientId: string; currency?: string }) {
  const [pins, setPins] = useState<Pin[] | null>(null);
  const [metrics, setMetrics] = useState<Record<string, MetaRow>>({});

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('client_kpi_pins' as any)
        .select('metric_id, target, direction, comment, display_order')
        .eq('client_id', clientId).order('display_order', { ascending: true });
      setPins(((p as any[]) ?? []) as Pin[]);
      const { data: d } = await supabase.from('dashboards' as any).select('data_json')
        .eq('client_id', clientId).eq('is_current', true).order('period', { ascending: false }).limit(1).maybeSingle();
      const map: Record<string, MetaRow> = {};
      const sections = (d as any)?.data_json?.sections ?? [];
      for (const s of sections) for (const r of (s?.rows ?? [])) if (r?.id && typeof r.value === 'number') map[r.id] = { value: r.value, label: r.label, unit: r.unit };
      setMetrics(map);
    })();
  }, [clientId]);

  if (!pins || !pins.length) return null;
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-accent" /> Tes indicateurs clés</h2>
      <p className="text-xs text-muted-foreground mt-0.5">Les ratios qu'on suit ensemble — avec ton objectif et pourquoi ils comptent.</p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pins.map((pin) => {
          const m = metrics[pin.metric_id];
          const st = m ? statusOf(m.value, pin.target, pin.direction) : 'warn';
          return (
            <div key={pin.metric_id} className="rounded-lg border p-3 bg-background">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground truncate">{m?.label ?? pin.metric_id}</div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${stDot[st]}`} />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className={`text-xl font-semibold tabular-nums ${m ? stColor[st] : ''}`}>{m ? fmtVal(m.value, m.unit, currency) : 'n/d'}</div>
                {pin.target != null && <div className="text-[11px] text-muted-foreground">obj. {fmtVal(pin.target, m?.unit, currency)}</div>}
              </div>
              {pin.comment && <p className="text-[11px] text-muted-foreground mt-2 leading-snug">{pin.comment}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
