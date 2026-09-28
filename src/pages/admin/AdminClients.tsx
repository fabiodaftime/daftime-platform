// Liste + création des clients du modèle générique (Phase 3).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { deleteClient } from '@/lib/genericApi';
import { AppShell } from '@/components/layout/AppShell';
import { Shimmer } from '@/components/motion';

function slugify(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [activityTypeId, setActivityTypeId] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [requiresSupervision, setRequiresSupervision] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: at }] = await Promise.all([
      supabase.from('clients' as any).select('*').is('legacy_company_id', null).order('created_at', { ascending: false }),
      supabase.from('activity_types' as any).select('*').eq('is_active', true).order('name'),
    ]);
    setClients((c as any[]) ?? []);
    setActivityTypes((at as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true); setError(null);
    const { data, error } = await supabase.from('clients' as any).insert({
      name: name.trim(),
      slug: slugify(name),
      activity_type_id: activityTypeId || null,
      currency,
      requires_supervision: requiresSupervision,
    }).select('id').single();
    setCreating(false);
    if (error) { setError(error.message); return; }
    navigate(`/admin/clients/${(data as any).id}`);
  };

  const removeClient = async (c: any) => {
    if (!confirm(`Supprimer définitivement « ${c.name} » et tout son contenu ?`)) return;
    setError(null);
    try { await deleteClient(c.id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <AppShell title="Clients — pipeline IA" onBack={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))}>
      <div className="space-y-8">
        <section className="surface p-6 sm:p-7">
          <span className="eyebrow">Créer un dossier</span>
          <h1 className="text-2xl font-semibold tracking-tight mt-1 mb-5 flex items-center gap-2"><Plus className="w-5 h-5" /> Nouveau client</h1>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Nom</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Demo Coach" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Type d'activité</label>
              <select className="w-full h-10 rounded-xl border bg-card px-3 text-sm"
                value={activityTypeId} onChange={(e) => setActivityTypeId(e.target.value)}>
                <option value="">—</option>
                {activityTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Devise</label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className="w-32" />
            </div>
            <label className="flex items-center gap-2 mt-6 text-sm">
              <input type="checkbox" checked={requiresSupervision} onChange={(e) => setRequiresSupervision(e.target.checked)} />
              Étape de supervision requise
            </label>
          </div>
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
          <Button className="mt-5 rounded-xl" onClick={create} disabled={creating || !name.trim()}>
            {creating ? 'Création…' : 'Créer le client'}
          </Button>
        </section>

        <section>
          <div className="mb-3"><span className="eyebrow">Pipeline IA</span><h2 className="font-semibold mt-0.5">Clients ({clients.length})</h2></div>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">{[1, 2, 3].map((i) => <Shimmer key={i} className="h-20 rounded-xl" />)}</div>
          ) : clients.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun client générique pour l'instant.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {clients.map((c) => (
                <div key={c.id} className="surface surface-hover p-4 flex items-start justify-between gap-2">
                  <button onClick={() => navigate(`/admin/clients/${c.id}`)} className="text-left flex-1">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.currency}{c.requires_supervision ? ' · supervision' : ''}</div>
                  </button>
                  <button onClick={() => removeClient(c)} title="Supprimer" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
