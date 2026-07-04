// Activités & templates : types d'activité, nombre de clients, et présence d'un catalogue
// d'indicateurs (template). Les catalogues détaillés sont définis dans le moteur (code) pour l'instant.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Boxes, Save, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface ActivityType { id: string; slug: string; name: string; is_active: boolean; config?: any }

export default function AdminActivities() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: at }, { data: cl }] = await Promise.all([
      supabase.from('activity_types' as any).select('id, slug, name, is_active, config').order('name'),
      supabase.from('clients' as any).select('activity_type_id'),
    ]);
    setTypes((at as any[]) ?? []);
    const c: Record<string, number> = {};
    for (const r of ((cl as any[]) ?? [])) if (r.activity_type_id) c[r.activity_type_id] = (c[r.activity_type_id] ?? 0) + 1;
    setCounts(c);
  }, []);
  useEffect(() => { load(); }, [load]);

  const setField = (i: number, k: keyof ActivityType, v: any) =>
    setTypes((t) => t.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));

  const save = (i: number) => {
    const a = types[i];
    setBusy(a.id); setError(null);
    (async () => {
      const { error } = await supabase.from('activity_types' as any).update({ name: a.name, is_active: a.is_active }).eq('id', a.id);
      setBusy(null);
      if (error) setError(error.message); else load();
    })();
  };

  return (
    <AppShell title="Activités & templates" maxWidth="max-w-4xl" onBack={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Chaque type d'activité peut porter un <strong>catalogue d'indicateurs</strong> (postes extraits + KPIs calculés) utilisé par le moteur de standardisation et de génération. Les catalogues détaillés sont pour l'instant définis dans le code.
        </p>
        {error && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground border-b bg-muted/30">
              <th className="px-4 py-2 w-1/2">Activité</th><th className="px-4 py-2">Catalogue</th>
              <th className="px-4 py-2 text-center">Clients</th><th className="px-4 py-2 text-center">Actif</th><th className="px-4 py-2"></th>
            </tr></thead>
            <tbody>
              {types.map((a, i) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5">
                    <Input value={a.name} onChange={(e) => setField(i, 'name', e.target.value)} className="h-8" />
                    <span className="text-[11px] text-muted-foreground">{a.slug}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {Array.isArray(a.config?.lines) && a.config.lines.length
                      ? <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> {a.config.lines.length} indic.</span>
                      : <span className="text-xs text-muted-foreground">générique</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center tabular-nums">{counts[a.id] ?? 0}</td>
                  <td className="px-4 py-2.5 text-center">
                    <input type="checkbox" checked={a.is_active} onChange={(e) => setField(i, 'is_active', e.target.checked)} />
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/activities/${a.id}`)}>Catalogue</Button>
                    <Button size="sm" variant="ghost" onClick={() => save(i)} disabled={busy === a.id}><Save className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
              {types.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground"><Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />Aucune activité.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
