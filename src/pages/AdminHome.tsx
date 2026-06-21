// Plateforme staff Daftime : menu (Accueil / Production / Clients / Configuration)
// + Accueil performance cabinet + suivi de production mensuelle. Legacy et IA unifiés.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Search, Plus, Users, Upload, Building2, ChevronRight, ChevronDown, Settings,
  Home, Briefcase, FileCheck2, Activity as ActivityIcon, ClipboardList, Headset, Boxes, AlertTriangle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LOCATIONS, legacyDashboardRoute } from '@/lib/staff';
import { currentPeriod, periodLabel, STATUS_LABELS } from '@/lib/genericApi';

interface Client {
  id: string; name: string; currency: string; location: string;
  advisor_id: string | null; legacy_company_id: string | null; activity_types?: { name?: string } | null;
  category?: string; cadence?: string; cadence_months?: number[] | null;
}

// Filtres de la vue Clients : implantations + catégories transverses.
const CLIENT_FILTERS = [
  ...LOCATIONS,
  { key: 'test', label: 'Test & fictifs', flag: '🧪' },
  { key: 'ponctuel', label: 'Ponctuel', flag: '📌' },
];

const STATUS_STYLE: Record<string, string> = {
  a_produire: 'bg-amber-100 text-amber-700',
  a_traiter: 'bg-amber-100 text-amber-700',
  draft_ia: 'bg-blue-100 text-blue-700',
  revue: 'bg-blue-100 text-blue-700',
  valide: 'bg-indigo-100 text-indigo-700',
  supervision: 'bg-indigo-100 text-indigo-700',
  publie: 'bg-emerald-100 text-emerald-700',
};
const statusLabel = (s: string) => (s === 'a_produire' ? 'À produire' : STATUS_LABELS[s] ?? s);
const PROD_ORDER = ['a_produire', 'a_traiter', 'draft_ia', 'revue', 'valide', 'supervision', 'publie'];

function labelAct(a: any): string {
  if (a.action === 'file_uploaded') return `Document déposé${a.metadata?.name ? ` : ${a.metadata.name}` : ''}`;
  if (a.action === 'dashboard_published') return 'Rapport publié';
  return a.action;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [layoutByCompany, setLayoutByCompany] = useState<Record<string, string>>({});
  const [statusByClient, setStatusByClient] = useState<Record<string, string>>({});
  const [missingByClient, setMissingByClient] = useState<Record<string, number>>({});
  const [advisorById, setAdvisorById] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<any[]>([]);
  const [view, setView] = useState<'accueil' | 'production' | 'clients'>('accueil');
  const [loc, setLoc] = useState<string>('dubai');
  const [open, setOpen] = useState<{ clients: boolean; config: boolean }>({ clients: false, config: false });
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const period = currentPeriod();
      const [{ data: cl }, { data: co }, { data: dash }, { data: sd }, { data: ad }, { data: act }] = await Promise.all([
        supabase.from('clients' as any).select('id, name, currency, location, advisor_id, legacy_company_id, category, cadence, cadence_months, activity_types:activity_type_id(name)').order('name'),
        supabase.from('companies').select('id, layout_type'),
        supabase.from('dashboards' as any).select('client_id, status').eq('is_current', true).eq('period', period),
        supabase.from('standardized_data' as any).select('client_id, missing_items').eq('is_current', true).eq('period', period),
        supabase.from('advisors' as any).select('id, name'),
        supabase.from('activity_log' as any).select('id, action, created_at, metadata, client_id, clients:client_id(name)').order('created_at', { ascending: false }).limit(8),
      ]);
      setClients((cl as any[]) ?? []);
      const cmap: Record<string, string> = {}; for (const c of ((co as any[]) ?? [])) cmap[c.id] = c.layout_type; setLayoutByCompany(cmap);
      const smap: Record<string, string> = {}; for (const d of ((dash as any[]) ?? [])) smap[d.client_id] = d.status; setStatusByClient(smap);
      const mmap: Record<string, number> = {}; for (const s of ((sd as any[]) ?? [])) mmap[s.client_id] = Array.isArray(s.missing_items) ? s.missing_items.length : 0; setMissingByClient(mmap);
      const amap: Record<string, string> = {}; for (const a of ((ad as any[]) ?? [])) amap[a.id] = a.name; setAdvisorById(amap);
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

  const monthNum = Number(currentPeriod().slice(5, 7));
  const isProd = (c: Client) => (c.category ?? 'production') === 'production';
  const dueThisMonth = (c: Client) => isProd(c) && (c.cadence !== 'quarterly' || (c.cadence_months ?? []).includes(monthNum));
  const matchesFilter = (c: Client, key: string) => {
    if (key === 'test') return c.category === 'test';
    if (key === 'ponctuel') return c.category === 'ponctuel';
    return isProd(c) && (c.location ?? 'dubai') === key;
  };
  const countForFilter = (key: string) => clients.filter((c) => matchesFilter(c, key)).length;
  const currentFilter = CLIENT_FILTERS.find((l) => l.key === loc) ?? CLIENT_FILTERS[0];
  const group = useMemo(() => clients.filter((c) => matchesFilter(c, loc) && c.name.toLowerCase().includes(q.toLowerCase())), [clients, loc, q]);

  const prodCount = clients.filter(isProd).length;
  const testCount = clients.filter((c) => c.category === 'test').length;
  const ponctCount = clients.filter((c) => c.category === 'ponctuel').length;

  // Production mensuelle = clients IA, en production, dus ce mois (mensuels + trimestriels du mois).
  const dueIA = clients.filter((c) => !c.legacy_company_id && dueThisMonth(c));
  const publishedCount = dueIA.filter((c) => (statusByClient[c.id] ?? 'a_produire') === 'publie').length;
  const missingClients = dueIA.filter((c) => (missingByClient[c.id] ?? 0) > 0).length;
  const activeLocs = LOCATIONS.filter((l) => countForFilter(l.key) > 0).length;

  const prodCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of dueIA) { const s = statusByClient[c.id] ?? 'a_produire'; m[s] = (m[s] ?? 0) + 1; }
    return m;
  }, [clients, statusByClient]);

  const prodRows = useMemo(() => {
    return dueIA
      .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
      .map((c) => ({ c, status: statusByClient[c.id] ?? 'a_produire', missing: missingByClient[c.id] ?? 0, advisor: c.advisor_id ? advisorById[c.advisor_id] : null }))
      .sort((a, b) => PROD_ORDER.indexOf(a.status) - PROD_ORDER.indexOf(b.status));
  }, [clients, statusByClient, missingByClient, advisorById, q]);

  const item = (active: boolean, icon: React.ReactNode, label: string, onClick: () => void, right?: React.ReactNode) => (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground hover:bg-muted'}`}>
      {icon} <span className="flex-1 text-left">{label}</span> {right}
    </button>
  );
  const subLink = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">{icon} {label}</button>
  );

  return (
    <AppShell maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6">
        {/* Menu */}
        <aside className="space-y-4">
          <nav className="rounded-xl border bg-card p-2 space-y-1">
            {item(view === 'accueil', <Home className="w-4 h-4 shrink-0" />, 'Accueil', () => setView('accueil'))}
            {item(view === 'production', <ClipboardList className="w-4 h-4 shrink-0" />, 'Production', () => setView('production'))}

            {item(view === 'clients', <Briefcase className="w-4 h-4 shrink-0" />, 'Clients',
              () => { setOpen((o) => ({ ...o, clients: !o.clients })); setView('clients'); },
              <ChevronDown className={`w-4 h-4 transition-transform ${open.clients ? 'rotate-180' : ''}`} />)}
            {open.clients && (
              <div className="pl-3 space-y-0.5">
                {CLIENT_FILTERS.map((l) => {
                  const active = view === 'clients' && loc === l.key;
                  return (
                    <button key={l.key} onClick={() => { setView('clients'); setLoc(l.key); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                      <span className="text-base leading-none">{l.flag}</span> {l.label}<span className="ml-auto text-xs">{countForFilter(l.key)}</span>
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
                {subLink(<Headset className="w-4 h-4" />, 'Conseillers', () => navigate('/admin/advisors'))}
                {subLink(<Boxes className="w-4 h-4" />, 'Activités & templates', () => navigate('/admin/activities'))}
                {subLink(<Users className="w-4 h-4" />, 'Utilisateurs', () => navigate('/admin/users'))}
                {subLink(<Upload className="w-4 h-4" />, 'Imports', () => navigate('/admin/csv-import'))}
                {subLink(<Settings className="w-4 h-4" />, 'Outils legacy', () => navigate('/admin/data-sources'))}
              </div>
            )}
          </nav>
          <Button className="w-full" onClick={() => navigate('/admin/clients')}><Plus className="w-4 h-4 mr-2" /> Nouveau client</Button>
        </aside>

        {/* Contenu */}
        <div className="space-y-5">
          {/* ───────── ACCUEIL ───────── */}
          {view === 'accueil' && (
            <>
              <div>
                <h1 className="text-xl font-semibold">Performance du cabinet</h1>
                <p className="text-sm text-muted-foreground capitalize">{periodLabel(currentPeriod())}</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Clients', value: clients.length, sub: `${prodCount} prod · ${testCount} test · ${ponctCount} ponct.` },
                  { icon: <ClipboardList className="w-4 h-4" />, label: 'À produire ce mois', value: dueIA.length },
                  { icon: <FileCheck2 className="w-4 h-4" />, label: 'Publiés ce mois', value: publishedCount, sub: `sur ${dueIA.length}` },
                  { icon: <AlertTriangle className="w-4 h-4" />, label: 'Pièces manquantes', value: missingClients, sub: 'clients concernés' },
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
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold flex items-center gap-2"><ClipboardList className="w-4 h-4 text-accent" /> Production du mois</h2>
                    <button onClick={() => setView('production')} className="text-xs text-primary hover:underline">Voir le détail</button>
                  </div>
                  <div className="space-y-2">
                    {PROD_ORDER.filter((s) => prodCounts[s]).map((s) => (
                      <div key={s} className="flex items-center justify-between text-sm">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${STATUS_STYLE[s]}`}>{statusLabel(s)}</span>
                        <span className="tabular-nums text-muted-foreground">{prodCounts[s]}</span>
                      </div>
                    ))}
                    {Object.keys(prodCounts).length === 0 && <p className="text-sm text-muted-foreground">Aucun client IA pour l'instant.</p>}
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h2 className="font-semibold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-accent" /> Répartition par implantation</h2>
                  <div className="space-y-2.5">
                    {LOCATIONS.map((l) => {
                      const n = countForFilter(l.key); const w = prodCount ? (n / prodCount) * 100 : 0;
                      return (
                        <button key={l.key} onClick={() => { setView('clients'); setLoc(l.key); setOpen((o) => ({ ...o, clients: true })); }} className="w-full text-left group">
                          <div className="flex justify-between text-sm mb-1"><span>{l.flag} {l.label}</span><span className="tabular-nums text-muted-foreground">{n}</span></div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary group-hover:bg-primary/80" style={{ width: `${Math.max(w, 2)}%` }} /></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold mb-3 flex items-center gap-2"><ActivityIcon className="w-4 h-4 text-accent" /> Activité récente</h2>
                {activity.length === 0 ? <p className="text-sm text-muted-foreground">Aucune activité récente.</p> : (
                  <ul className="space-y-3">
                    {activity.map((a) => (
                      <li key={a.id} className="text-sm flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        <span><span className="text-foreground">{labelAct(a)}</span>{a.clients?.name && <span className="text-muted-foreground"> · {a.clients.name}</span>}
                          <span className="block text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('fr-FR')}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* ───────── PRODUCTION ───────── */}
          {view === 'production' && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold">Production mensuelle</h1>
                  <p className="text-sm text-muted-foreground capitalize">{periodLabel(currentPeriod())} · clients pipeline IA</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-56 rounded-md border pl-8 pr-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              {prodRows.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl"><ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">Aucun client IA.</p></div>
              ) : (
                <div className="rounded-xl border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-muted-foreground border-b bg-muted/30">
                      <th className="px-4 py-2">Client</th><th className="px-4 py-2 hidden sm:table-cell">Activité</th>
                      <th className="px-4 py-2 hidden md:table-cell">Conseiller</th><th className="px-4 py-2">Statut</th>
                      <th className="px-4 py-2 text-center">Pièces</th><th className="px-4 py-2"></th>
                    </tr></thead>
                    <tbody>
                      {prodRows.map(({ c, status, missing, advisor }) => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-medium">{c.name}</td>
                          <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">{c.activity_types?.name ?? '—'}</td>
                          <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">{advisor ?? '—'}</td>
                          <td className="px-4 py-2.5"><span className={`text-[11px] px-1.5 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>{statusLabel(status)}</span></td>
                          <td className="px-4 py-2.5 text-center">{missing > 0 ? <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{missing}</span> : <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-4 py-2.5 text-right"><button onClick={() => navigate(`/admin/clients/${c.id}`)} className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">Ouvrir <ChevronRight className="w-3 h-3" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ───────── CLIENTS ───────── */}
          {view === 'clients' && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold flex items-center gap-2"><span>{currentFilter.flag}</span> {currentFilter.label}</h1>
                  <p className="text-sm text-muted-foreground">{countForFilter(loc)} client{countForFilter(loc) > 1 ? 's' : ''}</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-56 rounded-md border pl-8 pr-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
              ) : group.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl"><Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">{q ? 'Aucun client ne correspond.' : `Aucun client dans « ${currentFilter.label} ».`}</p></div>
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
                          <div className="text-xs text-muted-foreground mt-1 truncate">{c.activity_types?.name ?? (legacy ? 'Dashboard sur-mesure' : 'Activité non définie')} · {c.currency}{c.cadence === 'quarterly' ? ' · Trimestriel' : ''}</div>
                        </button>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <select value={c.location ?? 'dubai'} onChange={(e) => changeLocation(c.id, e.target.value)} className="text-xs h-7 rounded border bg-background px-1.5 outline-none">
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
