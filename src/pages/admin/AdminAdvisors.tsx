// Gestion des conseillers (advisors) : créer / éditer / supprimer, et voir le nombre de clients assignés.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, Headset } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

interface Advisor { id?: string; name: string; email: string; whatsapp: string; photo_url: string; booking_url: string; _draft?: boolean }

export default function AdminAdvisors() {
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: ad }, { data: cl }] = await Promise.all([
      supabase.from('advisors' as any).select('*').order('name'),
      supabase.from('clients' as any).select('advisor_id'),
    ]);
    setAdvisors(((ad as any[]) ?? []).map((a) => ({ name: '', email: '', whatsapp: '', photo_url: '', booking_url: '', ...a })));
    const c: Record<string, number> = {};
    for (const r of ((cl as any[]) ?? [])) if (r.advisor_id) c[r.advisor_id] = (c[r.advisor_id] ?? 0) + 1;
    setCounts(c);
  }, []);
  useEffect(() => { load(); }, [load]);

  const setField = (i: number, k: keyof Advisor, v: string) =>
    setAdvisors((a) => a.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));

  const addDraft = () =>
    setAdvisors((a) => [...a, { name: '', email: '', whatsapp: '', photo_url: '', booking_url: '', _draft: true }]);

  const save = (i: number) => {
    const a = advisors[i];
    if (!a.name.trim()) { setError('Le nom est requis.'); return; }
    setBusy(`s${i}`); setError(null);
    const row = { name: a.name.trim(), email: a.email || null, whatsapp: a.whatsapp || null, photo_url: a.photo_url || null, booking_url: a.booking_url || null };
    (async () => {
      const res = a.id
        ? await supabase.from('advisors' as any).update(row).eq('id', a.id)
        : await supabase.from('advisors' as any).insert(row);
      setBusy(null);
      if (res.error) setError(res.error.message); else load();
    })();
  };

  const remove = (i: number) => {
    const a = advisors[i];
    if (!a.id) { setAdvisors((arr) => arr.filter((_, idx) => idx !== i)); return; }
    if (!confirm(`Supprimer le conseiller « ${a.name} » ? Les clients assignés seront détachés.`)) return;
    setBusy(`d${i}`);
    (async () => {
      const { error } = await supabase.from('advisors' as any).delete().eq('id', a.id);
      setBusy(null);
      if (error) setError(error.message); else load();
    })();
  };

  return (
    <AppShell title="Conseillers" maxWidth="max-w-4xl" onBack={() => navigate('/')}
      actions={<Button variant="ghost" size="sm" onClick={addDraft} className="text-primary-foreground hover:bg-white/10"><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>}>
      <div className="space-y-4">
        {error && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}
        {advisors.length === 0 && <p className="text-sm text-muted-foreground">Aucun conseiller. Cliquez « Ajouter ».</p>}

        {advisors.map((a, i) => (
          <section key={a.id ?? `draft${i}`} className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              {a.photo_url
                ? <img src={a.photo_url} alt={a.name} className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 rounded-full bg-accent/15 text-primary flex items-center justify-center"><Headset className="w-4 h-4" /></div>}
              <div className="flex-1">
                <div className="font-medium">{a.name || 'Nouveau conseiller'}</div>
                {a.id && <div className="text-xs text-muted-foreground">{counts[a.id] ?? 0} client(s) assigné(s)</div>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nom</Label><Input value={a.name} onChange={(e) => setField(i, 'name', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={a.email} onChange={(e) => setField(i, 'email', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={a.whatsapp} onChange={(e) => setField(i, 'whatsapp', e.target.value)} placeholder="+9715…" /></div>
              <div className="space-y-1.5"><Label>Lien RDV (Cal.com)</Label><Input value={a.booking_url} onChange={(e) => setField(i, 'booking_url', e.target.value)} placeholder="https://cal.com/…" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Photo (URL)</Label><Input value={a.photo_url} onChange={(e) => setField(i, 'photo_url', e.target.value)} placeholder="https://…" /></div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button size="sm" onClick={() => save(i)} disabled={busy === `s${i}`}><Save className="w-4 h-4 mr-1.5" /> {busy === `s${i}` ? '…' : 'Enregistrer'}</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(i)} disabled={busy === `d${i}`} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4 mr-1" /> Supprimer</Button>
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
