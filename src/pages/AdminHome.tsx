// Plateforme staff Daftime : menu de gauche (Accueil / Clients par implantation / Configuration)
// + Accueil axé performance du cabinet. Legacy et nouveau modèle unifiés.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Search, Plus, Users, Upload, Building2, ChevronRight, ChevronDown, Settings,
  Home, Briefcase, FileCheck2, Clock, Activity as ActivityIcon,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LOCATIONS, legacyDashboardRoute } from '@/lib/staff';
import { currentPeriod, periodLabel } from '@/lib/genericApi';

interface Client {
  id: string; name: string; currency: string; location: string;
  legacy_company_id: string | null; activity_types?: { name?: string } | null;
}

function labelAct(a: any): string {
  if (a.action === 'file_uploaded') return `Document déposé${a.metadata?.name ? ` : ${a.metadata.name}` : ''}`;
  if (a.action === 'dashboard_published') return 'Rapport publié';
  return a.action;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [layoutByCompany, setLayoutByCompany] = useState<Record<string, string>>({});
  const [publishedSet, setPublishedSet] = useState<Set<string>>(new Set());
  const [activity, setActivity] = useState<any[]>([]);
  const [view, setView] = useState<'accueil' | 'clients'>('accueil');
  const [loc, setLoc] = useState<string>('dubai');
  const [open, setOpen] = useState<{ clients: boolean; config: boolean }>({ clients: false, config: false });
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const period = currentPeriod();
      const [{ data: cl }, { data: co }, { data: pub }, { data: act }] = await Promise.all([
        supabase.from('clients' as any).select('id, name, currency, location, legacy_company_id, activity_types:activity_type_id(name)').order('name'),
        supabase.from('companies').select('id, layout_type'),
        supabase.from('dashboards' as any).select('client_id').eq('status', 'publie').eq('is_current', true).eq('period', period),
        supabase.from('activity_log' as any).select('id, action, created_at, metadata, client_id, clients:client_id(name)').order('created_at', { ascending: false }).limit(8),
      ]);
      setClients((cl as any[]) ?? []);
      const map: Record<string, string> = {};
      for (const c of ((co as any[]) ?? [])) map[c.id] = c.layout_type;
      setLayoutByCompany(map);
      setPublishedSet(new Set(((pub as any[]) ?? []).map((p) => p.client_id)));
      setActivity((act as any[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const openClient = (c: Client) => {
    if (c.legacy_company_id) navigate(legacyDashboardRoute(layoutByCompany[c.legacy_company_id], c.legacy_company_id));
    else navigate(`/admin/clients/${c.id}`);
  };

  const changeLocation = async (clientId: string, location: string) => {
    setClients((cs) => cs.map((c) => (c.id === clientId ? { ...c, location } : c)));
    await supabase.from('clients' as any).update({ location }).eq('id', clientId);
  };

  const countOf = (key: string) => clients.filter((c) => (c.location ?? 'dubai') === key).length;
  const currentLoc = LOCATIONS.find((l) => l.key === loc) ?? LOCATIONS[0];
  const group = useMemo(
    () => clients.filter((c) => (c.location ?? 'dubai') === loc && c.name.toLowerCase().includes(q.toLowerCase())),
    [clients, loc, q],
  );

  // Métriques cabinet
  const iaClients = clients.filter((c) => !c.legacy_company_id);
  const legacyClients = clients.filter((c) => c.legacy_company_id);
  const pendingIA = iaClients.filter((c) => !publishedSet.has(c.id)).length;
  const activeLocs = LOCATIONS.filter((l) => countOf(l.key) > 0).length;

  const item = (active: boolean, icon: React.ReactNode, label: string, onClick: () => void, right?: React.ReactNode) => (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground hover:bg-muted'}`}>
      {icon} <span className="flex-1 text-left">{label}</span> {right}
    </button>
  );

  return (
    <AppShell maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6">
        {/* Menu */}
        <aside className="space-y-4">
          <nav className="rounded-xl border bg-card p-2 space-y-1">
            {item(view === 'accueil', <Home className="w-4 h-4 shrink-0" />, 'Accueil', () => setView('accueil'))}

            {item(view === 'clients', <Briefcase className="w-4 h-4 shrink-0" />, 'Clients',
              () => { setOpen((o) => ({ ...o, clients: !o.clients })); setView('clients'); },
              <ChevronDown className={`w-4 h-4 transition-transform ${open.clients ? 'rotate-180' : ''}`} />)}
            {open.clients && (
              <div className="pl-3 space-y-0.5">
                {LOCATIONS.map((l) => {
                  const active = view === 'clients' && loc === l.key;
                  return (
                    <button key={l.key} onClick={() => { setView('clients'); setLoc(l.key); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                      <span className="text-base leading-none">{l.flag}</span> {l.label}
                      <span className="ml-auto text-xs">{countOf(l.key)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {item(false, <Settings className="w-4 h-4 shrink-0" />, 'Configuration',
              () => setOpen((o) => ({ ...o, config: !o.config })),
              <ChevronDown className={`w-4 h-4 transition-transform ${open.config ? 'rotate-180' : ''}`} />)}
            {open.config && (
              <div className="pl-3 space-y-0.5">
                <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted"><Users className="w-4 h-4" /> Utilisateurs</button>
                <button onClick={() => navigate('/admin/csv-import')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted"><Upload className="w-4 h-4" /> Imports</button>
                <button onClick={() => navigate('/admin/data-sources')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted"><Settings className="w-4 h-4" /> Outils legacy</button>
              </div>
            )}
          </nav>

          <Button className="w-full" onClick={() => navigate('/admin/clients')}>
            <Plus className="w-4 h-4 mr-2" /> Nouveau client
          </Button>
        </aside>

        {/* Contenu */}
        <div className="space-y-5">
          {view === 'accueil' ? (
            <>
              <div>
                <h1 className="text-xl font-semibold">Performance du cabinet</h1>
                <p className="text-sm text-muted-foreground capitalize">{periodLabel(currentPeriod())}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Clients', value: clients.length, sub: `${iaClients.length} IA · ${legacyClients.length} legacy` },
                  { icon: <FileCheck2 className="w-4 h-4" />, label: 'Rapports publiés ce mois', value: publishedSet.size },
                  { icon: <Clock className="w-4 h-4" />, label: 'En attente (IA)', value: pendingIA },
                  { icon: <Building2 className="w-4 h-4" />, label: 'Implantations actives', value: `${activeLocs}/${LOCATIONS.length}` },
                ].map((k, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">{k.icon} {k.label}</div>
                    <div className="text-2xl font-semibold tabular-nums mt-1">{k.value}</div>
                    {k.sub && <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-card p-5">
                  <h2 className="font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-accent" /> Répartition par implantation</h2>
                  <div className="space-y-2.5">
                    {LOCATIONS.map((l) => {
                      const n = countOf(l.key); const pctw = clients.length ? (n / clients.length) * 100 : 0;
                      return (
                        <button key={l.key} onClick={() => { setView('clients'); setLoc(l.key); setOpen((o) => ({ ...o, clients: true })); }}
                          className="w-full text-left group">
                          <div className="flex justify-between text-sm mb-1"><span>{l.flag} {l.label}</span><span className="tabular-nums text-muted-foreground">{n}</span></div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary group-hover:bg-primary/80" style={{ width: `${Math.max(pctw, 2)}%` }} /></div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h2 className="font-semibold mb-3 flex items-center gap-2"><ActivityIcon className="w-4 h-4 text-accent" /> Activité récente</h2>
                  {activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
                  ) : (
                    <ul className="space-y-3">
                      {activity.map((a) => (
                        <li key={a.id} className="text-sm flex gap-3">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                          <span>
                            <span className="text-foreground">{labelAct(a)}</span>
                            {a.clients?.name && <span className="text-muted-foreground"> · {a.clients.name}</span>}
                            <span className="block text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('fr-FR')}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-2"><span>{currentLoc.flag}</span> {currentLoc.label}</h1>
                  <p className="text-sm text-muted-foreground">{countOf(loc)} client{countOf(loc) > 1 ? 's' : ''}</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…"
                    className="h-9 w-56 rounded-md border pl-8 pr-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
              ) : group.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl">
                  <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">{q ? 'Aucun client ne correspond.' : `Aucun client à ${currentLoc.label}.`}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.map((c) => {
                    const legacy = !!c.legacy_company_id;
                    return (
                      <div key={c.id} className="rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/30 transition">
                        <button onClick={() => openClient(c)} className="text-left w-full">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium truncate">{c.name}</span>
                            <span className={`shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${legacy ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>{legacy ? 'Legacy' : 'IA'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 truncate">{c.activity_types?.name ?? (legacy ? 'Dashboard sur-mesure' : 'Activité non définie')} · {c.currency}</div>
                        </button>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <select value={c.location ?? 'dubai'} onChange={(e) => changeLocation(c.id, e.target.value)}
                            className="text-xs h-7 rounded border bg-background px-1.5 outline-none">
                            {LOCATIONS.map((l) => <option key={l.key} value={l.key}>{l.flag} {l.label}</option>)}
                          </select>
                          <div className="flex items-center gap-1">
                            <button onClick={() => navigate(`/admin/clients/${c.id}/settings`)} title="Réglages" className="p-1 text-muted-foreground hover:text-foreground"><Settings className="w-3.5 h-3.5" /></button>
                            <button onClick={() => openClient(c)} className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">Ouvrir <ChevronRight className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
