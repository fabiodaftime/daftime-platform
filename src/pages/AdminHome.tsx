// Plateforme staff Daftime : sidebar (Clients / Configuration) + clients groupés par
// implantation (Dubaï / France / Portugal), legacy et nouveau modèle unifiés.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Search, Plus, Users, Upload, Building2, ChevronRight, LayoutGrid, Settings } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LOCATIONS, legacyDashboardRoute } from '@/lib/staff';

interface Client {
  id: string;
  name: string;
  currency: string;
  location: string;
  legacy_company_id: string | null;
  activity_types?: { name?: string } | null;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [layoutByCompany, setLayoutByCompany] = useState<Record<string, string>>({});
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: cl }, { data: co }] = await Promise.all([
        supabase.from('clients' as any).select('id, name, currency, location, legacy_company_id, activity_types:activity_type_id(name)').order('name'),
        supabase.from('companies').select('id, layout_type'),
      ]);
      setClients((cl as any[]) ?? []);
      const map: Record<string, string> = {};
      for (const c of ((co as any[]) ?? [])) map[c.id] = c.layout_type;
      setLayoutByCompany(map);
      setLoading(false);
    })();
  }, []);

  const open = (c: Client) => {
    if (c.legacy_company_id) navigate(legacyDashboardRoute(layoutByCompany[c.legacy_company_id], c.legacy_company_id));
    else navigate(`/admin/clients/${c.id}`);
  };

  const changeLocation = async (clientId: string, location: string) => {
    setClients((cs) => cs.map((c) => (c.id === clientId ? { ...c, location } : c)));
    await supabase.from('clients' as any).update({ location }).eq('id', clientId);
  };

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())),
    [clients, q],
  );

  const navItem = (icon: React.ReactNode, label: string, onClick: () => void, active = false) => (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground hover:bg-muted'}`}>
      {icon} {label}
    </button>
  );

  return (
    <AppShell maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-4">
          <nav className="rounded-xl border bg-card p-2 space-y-1">
            {navItem(<LayoutGrid className="w-4 h-4 shrink-0" />, 'Clients', () => {}, true)}
          </nav>
          <div className="rounded-xl border bg-card p-2 space-y-1">
            <div className="px-3 pt-1.5 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Configuration</div>
            {navItem(<Users className="w-4 h-4 shrink-0" />, 'Utilisateurs', () => navigate('/admin/users'))}
            {navItem(<Upload className="w-4 h-4 shrink-0" />, 'Imports', () => navigate('/admin/csv-import'))}
            {navItem(<Settings className="w-4 h-4 shrink-0" />, 'Outils legacy', () => navigate('/admin/data-sources'))}
          </div>
          <Button className="w-full" onClick={() => navigate('/admin/clients')}>
            <Plus className="w-4 h-4 mr-2" /> Nouveau client
          </Button>
        </aside>

        {/* Contenu : clients par implantation */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Clients</h1>
              <p className="text-sm text-muted-foreground">{clients.length} client{clients.length > 1 ? 's' : ''} · {LOCATIONS.length} implantations</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…"
                className="h-9 w-56 rounded-md border pl-8 pr-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : (
            LOCATIONS.map((loc) => {
              const group = filtered.filter((c) => (c.location ?? 'dubai') === loc.key);
              return (
                <section key={loc.key}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{loc.flag}</span>
                    <h2 className="font-semibold">{loc.label}</h2>
                    <span className="text-xs text-muted-foreground">{group.length}</span>
                  </div>
                  {group.length === 0 ? (
                    <p className="text-sm text-muted-foreground border border-dashed rounded-xl px-4 py-6 text-center">Aucun client dans cette implantation.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {group.map((c) => {
                        const legacy = !!c.legacy_company_id;
                        return (
                          <div key={c.id} className="rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/30 transition">
                            <button onClick={() => open(c)} className="text-left w-full">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium truncate">{c.name}</span>
                                <span className={`shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${legacy ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                                  {legacy ? 'Legacy' : 'IA'}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                {c.activity_types?.name ?? (legacy ? 'Dashboard sur-mesure' : 'Activité non définie')} · {c.currency}
                              </div>
                            </button>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <select value={c.location ?? 'dubai'} onChange={(e) => changeLocation(c.id, e.target.value)}
                                className="text-xs h-7 rounded border bg-background px-1.5 outline-none">
                                {LOCATIONS.map((l) => <option key={l.key} value={l.key}>{l.flag} {l.label}</option>)}
                              </select>
                              <div className="flex items-center gap-1">
                                <button onClick={() => navigate(`/admin/clients/${c.id}/settings`)} title="Réglages"
                                  className="p-1 text-muted-foreground hover:text-foreground"><Settings className="w-3.5 h-3.5" /></button>
                                <button onClick={() => open(c)} className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">
                                  Ouvrir <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })
          )}

          {!loading && clients.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun client pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
