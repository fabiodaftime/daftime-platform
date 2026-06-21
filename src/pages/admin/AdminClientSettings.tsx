// Réglages unifiés d'un client (legacy ou nouveau modèle) : tout au même endroit —
// nom, activité, devise, implantation, conseiller assigné, supervision, logo.
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, ExternalLink, Save } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LOCATIONS, legacyDashboardRoute } from '@/lib/staff';

export default function AdminClientSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [layoutType, setLayoutType] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Champs éditables
  const [form, setForm] = useState<any>({});

  const load = useCallback(async () => {
    const [{ data: c }, { data: at }, { data: ad }] = await Promise.all([
      supabase.from('clients' as any).select('*').eq('id', id).maybeSingle(),
      supabase.from('activity_types' as any).select('id, name').eq('is_active', true).order('name'),
      supabase.from('advisors' as any).select('id, name').order('name'),
    ]);
    setClient(c);
    setActivityTypes((at as any[]) ?? []);
    setAdvisors((ad as any[]) ?? []);
    setForm({
      name: (c as any)?.name ?? '',
      activity_type_id: (c as any)?.activity_type_id ?? '',
      currency: (c as any)?.currency ?? 'EUR',
      location: (c as any)?.location ?? 'dubai',
      advisor_id: (c as any)?.advisor_id ?? '',
      requires_supervision: !!(c as any)?.requires_supervision,
      logo_url: (c as any)?.logo_url ?? '',
    });
    if ((c as any)?.legacy_company_id) {
      const { data: co } = await supabase.from('companies').select('layout_type').eq('id', (c as any).legacy_company_id).maybeSingle();
      setLayoutType((co as any)?.layout_type ?? null);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: any) => { setForm((f: any) => ({ ...f, [k]: v })); setSaved(false); };

  const save = async () => {
    setBusy(true); setError(null);
    const { error } = await supabase.from('clients' as any).update({
      name: form.name?.trim() || null,
      activity_type_id: form.activity_type_id || null,
      currency: (form.currency || 'EUR').toUpperCase(),
      location: form.location || 'dubai',
      advisor_id: form.advisor_id || null,
      requires_supervision: !!form.requires_supervision,
      logo_url: form.logo_url?.trim() || null,
    }).eq('id', id);
    setBusy(false);
    if (error) setError(error.message);
    else { setSaved(true); load(); }
  };

  if (!client) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  const legacy = !!client.legacy_company_id;
  const openDashboard = () => legacy
    ? navigate(legacyDashboardRoute(layoutType, client.legacy_company_id))
    : navigate(`/admin/clients/${id}`);

  return (
    <AppShell
      title={`Réglages — ${client.name}`}
      maxWidth="max-w-3xl"
      onBack={() => navigate('/')}
      actions={
        <Button variant="ghost" size="sm" onClick={openDashboard} className="text-primary-foreground hover:bg-white/10">
          {legacy ? <ExternalLink className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
          {legacy ? 'Dashboard' : 'Cockpit'}
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${legacy ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
            {legacy ? 'Legacy — dashboard sur-mesure' : 'Nouveau modèle — pipeline IA'}
          </span>
        </div>

        <section className="rounded-xl border bg-card p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Implantation</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={form.location} onChange={(e) => set('location', e.target.value)}>
                {LOCATIONS.map((l) => <option key={l.key} value={l.key}>{l.flag} {l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Type d'activité</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={form.activity_type_id} onChange={(e) => set('activity_type_id', e.target.value)}>
                <option value="">— Non défini —</option>
                {activityTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Devise</Label>
              <Input value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} className="w-32" />
            </div>
            <div className="space-y-1.5">
              <Label>Conseiller assigné</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={form.advisor_id} onChange={(e) => set('advisor_id', e.target.value)}>
                <option value="">— Aucun —</option>
                {advisors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Logo (URL)</Label>
              <Input value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.requires_supervision} onChange={(e) => set('requires_supervision', e.target.checked)} />
            Étape de supervision requise avant publication
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={save} disabled={busy}>
              <Save className="w-4 h-4 mr-1.5" /> {busy ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            {saved && <span className="text-sm text-emerald-600">✓ Enregistré</span>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
