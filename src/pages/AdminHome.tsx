// Plateforme staff Daftime : menu (Accueil / Production / Clients / Configuration)
// + Accueil performance cabinet + suivi de production mensuelle. Legacy et IA unifiés.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Search, Plus, Users, Upload, Building2, ChevronRight, ChevronDown, Settings,
  Home, Briefcase, FileCheck2, Clock, Activity as ActivityIcon, ClipboardList, Headset, Boxes, AlertTriangle, Target,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { CountUp, GrowBar, Item, PageFade, Shimmer, Stagger, motion } from '@/components/motion';
import { LOCATIONS, legacyDashboardRoute } from '@/lib/staff';
import { currentPeriod, periodLabel, STATUS_LABELS } from '@/lib/genericApi';
import { DocChecklistPanel } from '@/components/generic/DocChecklistPanel';
import { reliabilityTone } from '@/components/generic/ControlsPanel';
import { DOC_CHECKLIST } from '@/lib/docChecklist';

interface Client {
  id: string; name: string; currency: string; location: string;
  advisor_id: string | null; legacy_company_id: string | null; activity_types?: { name?: string } | null;
  category?: string; cadence?: string; cadence_months?: number[] | null;
}

// Filtres de la vue Clients : implantations + catégories transverses.
const CLIENT_FILTERS = [
  ...LOCATIONS,
  { key: 'a_categoriser', label: 'À catégoriser', flag: '🏷️' },
  { key: 'test', label: 'Test & fictifs', flag: '🧪' },
  { key: 'ponctuel', label: 'Ponctuel', flag: '📌' },
];

const STATUS_STYLE: Record<string, string> = {
  a_produire: 'bg-amber-100 text-amber-700',
  a_traiter: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  draft_ia: 'bg-blue-100 text-blue-700',
  revue: 'bg-blue-100 text-blue-700',
  valide: 'bg-indigo-100 text-indigo-700',
  supervision: 'bg-indigo-100 text-indigo-700',
  publie: 'bg-emerald-100 text-emerald-700',
};
const LOCAL_LABELS: Record<string, string> = { a_produire: 'À produire', en_cours: 'En cours' };
const statusLabel = (s: string) => LOCAL_LABELS[s] ?? STATUS_LABELS[s] ?? s;
const PROD_ORDER = ['a_produire', 'a_traiter', 'en_cours', 'draft_ia', 'revue', 'valide', 'supervision', 'publie'];
// Statuts proposés pour le suivi manuel (clients legacy).
const LEGACY_STATUS_OPTIONS = ['a_produire', 'en_cours', 'revue', 'valide', 'publie'];

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
  const [prodStatusByClient, setProdStatusByClient] = useState<Record<string, string>>({});
  const [missingByClient, setMissingByClient] = useState<Record<string, number>>({});
  // Indice de fiabilité du mois (/100, moteur) : repère les dossiers à risque avant l'envoi.
  const [reliabilityByClient, setReliabilityByClient] = useState<Record<string, number>>({});
  const [advisorById, setAdvisorById] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<any[]>([]);
  // Onglet actif (view) + filtre (loc) stockés dans l'URL : le bouton « retour » du navigateur
  // restaure ainsi la vue d'où l'on vient (ex. Clients → Test & fictifs) au lieu de repartir à zéro.
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') ?? 'accueil') as 'accueil' | 'production' | 'clients' | 'commercial';
  const loc = searchParams.get('filter') ?? 'dubai';
  const setView = (v: 'accueil' | 'production' | 'clients' | 'commercial') =>
    setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set('view', v); return p; }, { replace: true });
  // Sélection d'un onglet Clients : écrit view + filtre en une seule mise à jour d'URL.
  const goClients = (filter: string) =>
    setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set('view', 'clients'); p.set('filter', filter); return p; }, { replace: true });
  const [open, setOpen] = useState<{ clients: boolean; config: boolean }>(() => ({ clients: view === 'clients', config: false }));
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [checklistSlug, setChecklistSlug] = useState('ecommerce'); // vue Commercial : activité sélectionnée

  useEffect(() => {
    (async () => {
      const period = currentPeriod();
      const [{ data: cl }, { data: co }, { data: dash }, { data: ps }, { data: sd }, { data: ad }, { data: act }] = await Promise.all([
        supabase.from('clients' as any).select('id, name, currency, location, advisor_id, legacy_company_id, category, cadence, cadence_months, activity_types:activity_type_id(name)').order('name'),
        supabase.from('companies').select('id, layout_type'),
        supabase.from('dashboards' as any).select('client_id, status').eq('is_current', true).eq('period', period),
        supabase.from('production_status' as any).select('client_id, status').eq('period', period),
        supabase.from('standardized_data' as any).select('client_id, missing_items, reliability:data->reliability').eq('is_current', true).eq('period', period),
        supabase.from('advisors' as any).select('id, name'),
        supabase.from('activity_log' as any).select('id, action, created_at, metadata, client_id, clients:client_id(name)').order('created_at', { ascending: false }).limit(8),
      ]);
      setClients((cl as any[]) ?? []);
      const cmap: Record<string, string> = {}; for (const c of ((co as any[]) ?? [])) cmap[c.id] = c.layout_type; setLayoutByCompany(cmap);
      const smap: Record<string, string> = {}; for (const d of ((dash as any[]) ?? [])) smap[d.client_id] = d.status; setStatusByClient(smap);
      const psmap: Record<string, string> = {}; for (const p of ((ps as any[]) ?? [])) psmap[p.client_id] = p.status; setProdStatusByClient(psmap);
      const mmap: Record<string, number> = {}; for (const s of ((sd as any[]) ?? [])) mmap[s.client_id] = Array.isArray(s.missing_items) ? s.missing_items.length : 0; setMissingByClient(mmap);
      const rmap: Record<string, number> = {}; for (const s of ((sd as any[]) ?? [])) if (typeof s.reliability?.score === 'number') rmap[s.client_id] = s.reliability.score; setReliabilityByClient(rmap);
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
  // Classement rapide d'un client « à catégoriser » (sort de l'inbox une fois classé).
  const changeCategory = async (clientId: string, category: string) => {
    setClients((cs) => cs.map((c) => (c.id === clientId ? { ...c, category } : c)));
    await supabase.from('clients' as any).update({ category }).eq('id', clientId);
  };

  const monthNum = Number(currentPeriod().slice(5, 7));
  const isProd = (c: Client) => (c.category ?? 'production') === 'production';
  const dueThisMonth = (c: Client) => isProd(c) && (c.cadence !== 'quarterly' || (c.cadence_months ?? []).includes(monthNum));
  const matchesFilter = (c: Client, key: string) => {
    if (key === 'a_categoriser') return c.category === 'a_categoriser';
    if (key === 'test') return c.category === 'test';
    if (key === 'ponctuel') return c.category === 'ponctuel';
    return isProd(c) && (c.location ?? 'dubai') === key;
  };
  const countForFilter = (key: string) => clients.filter((c) => matchesFilter(c, key)).length;
  const currentFilter = CLIENT_FILTERS.find((l) => l.key === loc) ?? CLIENT_FILTERS[0];
  const group = useMemo(() => clients.filter((c) => matchesFilter(c, currentFilter.key) && c.name.toLowerCase().includes(q.toLowerCase())), [clients, currentFilter.key, q]); // filtre inconnu dans l'URL → même repli que le titre

  const prodCount = clients.filter(isProd).length;
  const testCount = clients.filter((c) => c.category === 'test').length;
  const ponctCount = clients.filter((c) => c.category === 'ponctuel').length;
  const toClassifyCount = clients.filter((c) => c.category === 'a_categoriser').length;

  // Production mensuelle = clients IA, en production, dus ce mois (mensuels + trimestriels du mois).
  const statusFor = (c: Client) => (c.legacy_company_id ? (prodStatusByClient[c.id] ?? 'a_produire') : (statusByClient[c.id] ?? 'a_produire'));
  const dueProd = clients.filter(dueThisMonth);
  const publishedCount = dueProd.filter((c) => statusFor(c) === 'publie').length;
  const missingClients = dueProd.filter((c) => (missingByClient[c.id] ?? 0) > 0).length;
  const activeLocs = LOCATIONS.filter((l) => countForFilter(l.key) > 0).length;
  const todo = dueProd
    .filter((c) => statusFor(c) !== 'publie')
    .sort((a, b) => PROD_ORDER.indexOf(statusFor(a)) - PROD_ORDER.indexOf(statusFor(b)))
    .slice(0, 6);

  const setLegacyStatus = async (clientId: string, status: string) => {
    setProdStatusByClient((m) => ({ ...m, [clientId]: status }));
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('production_status' as any).upsert(
      { client_id: clientId, period: currentPeriod(), status, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,period' },
    );
  };

  const prodCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of dueProd) { const s = statusFor(c); m[s] = (m[s] ?? 0) + 1; }
    return m;
  }, [clients, statusByClient, prodStatusByClient]);

  const prodRows = useMemo(() => {
    return dueProd
      .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
      .map((c) => ({ c, legacy: !!c.legacy_company_id, status: statusFor(c), missing: missingByClient[c.id] ?? 0, advisor: c.advisor_id ? advisorById[c.advisor_id] : null }))
      .sort((a, b) => PROD_ORDER.indexOf(a.status) - PROD_ORDER.indexOf(b.status));
  }, [clients, statusByClient, prodStatusByClient, missingByClient, advisorById, q]);

  const item = (active: boolean, icon: React.ReactNode, label: string, onClick: () => void, right?: React.ReactNode) => (
    <button onClick={onClick} aria-current={active ? 'page' : undefined}
      className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'}`}>
      {active && <motion.span layoutId="home-nav" className="absolute inset-0 rounded-lg bg-card border shadow-[var(--shadow-card)]" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
      <span className="relative flex items-center gap-2.5 flex-1 text-left">{icon} {label}</span> {right && <span className="relative">{right}</span>}
    </button>
  );
  const subLink = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors">{icon} {label}</button>
  );
  const pill = (s: string) => <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[s] ?? 'bg-muted text-muted-foreground'}`}>{statusLabel(s)}</span>;
  const legacyTag = <span className="ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 align-middle">legacy</span>;
  const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const searchBox = (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer…" className="h-10 w-full sm:w-60 rounded-xl border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition" />
    </div>
  );
  const pct = dueProd.length ? Math.round((publishedCount / dueProd.length) * 100) : 0;

  return (
    <AppShell maxWidth="max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-[228px_1fr] gap-8">
        {/* Menu */}
        <aside className="lg:sticky lg:top-24 self-start space-y-4">
          <nav className="space-y-0.5" aria-label="Sections">
            {item(view === 'accueil', <Home className="w-4 h-4 shrink-0" />, 'Accueil', () => setView('accueil'))}
            {item(view === 'production', <ClipboardList className="w-4 h-4 shrink-0" />, 'Production', () => setView('production'))}
            {item(view === 'clients', <Briefcase className="w-4 h-4 shrink-0" />, 'Clients',
              () => { setOpen((o) => ({ ...o, clients: !o.clients })); setView('clients'); },
              <ChevronDown className={`w-4 h-4 transition-transform ${open.clients ? 'rotate-180' : ''}`} />)}
            {open.clients && (
              <div className="pl-3 space-y-0.5 border-l ml-5">
                {CLIENT_FILTERS.map((l) => {
                  const active = view === 'clients' && loc === l.key;
                  return (
                    <button key={l.key} onClick={() => goClients(l.key)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'}`}>
                      <span className="text-base leading-none">{l.flag}</span> {l.label}<span className="ml-auto font-mono text-[11px]">{countForFilter(l.key)}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {item(view === 'commercial', <Target className="w-4 h-4 shrink-0" />, 'Commercial', () => setView('commercial'))}
            {item(false, <Settings className="w-4 h-4 shrink-0" />, 'Configuration',
              () => setOpen((o) => ({ ...o, config: !o.config })),
              <ChevronDown className={`w-4 h-4 transition-transform ${open.config ? 'rotate-180' : ''}`} />)}
            {open.config && (
              <div className="pl-3 space-y-0.5 border-l ml-5">
                {subLink(<Headset className="w-4 h-4" />, 'Conseillers', () => navigate('/admin/advisors'))}
                {subLink(<Boxes className="w-4 h-4" />, 'Activités & templates', () => navigate('/admin/activities'))}
                {subLink(<Users className="w-4 h-4" />, 'Utilisateurs', () => navigate('/admin/users'))}
                {subLink(<Upload className="w-4 h-4" />, 'Imports', () => navigate('/admin/csv-import'))}
                {subLink(<Settings className="w-4 h-4" />, 'Outils legacy', () => navigate('/admin/data-sources'))}
              </div>
            )}
          </nav>
          <Button className="w-full rounded-xl" onClick={() => navigate('/admin/clients')}><Plus className="w-4 h-4 mr-2" /> Nouveau client</Button>
        </aside>

        {/* Contenu */}
        <PageFade id={view} className="space-y-5 min-w-0">
          {/* ───────── ACCUEIL ───────── */}
          {view === 'accueil' && (
            <Stagger className="space-y-5">
              <Item>
                <section className="brand-panel p-6 sm:p-8">
                  <div className="relative z-[1]">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <div className="text-[10.5px] tracking-[0.12em] uppercase text-white/50 font-mono">Performance du cabinet</div>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1 capitalize">{periodLabel(currentPeriod())}</h1>
                      </div>
                      <button onClick={() => setView('production')} className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/15 transition">
                        Suivre la production <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      {[
                        { label: 'Clients', v: clients.length, sub: `${prodCount} en prod${toClassifyCount ? ` · ${toClassifyCount} à classer` : ''}` },
                        { label: 'À produire ce mois', v: dueProd.length, sub: `${testCount} test · ${ponctCount} ponctuel` },
                        { label: 'Publiés ce mois', v: publishedCount, sub: `sur ${dueProd.length} · ${pct} %` },
                        { label: 'Pièces manquantes', v: missingClients, sub: 'clients concernés' },
                      ].map((k) => (
                        <div key={k.label}>
                          <div className="text-white/60 text-xs">{k.label}</div>
                          <CountUp value={k.v} format={(x) => Math.round(x).toLocaleString('fr-FR')} className="num block text-4xl font-semibold mt-1" />
                          <div className="text-white/50 text-xs mt-1">{k.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <div className="flex justify-between text-xs text-white/60 mb-1.5"><span>Avancement de la production</span><span className="font-mono">{publishedCount}/{dueProd.length}</span></div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden"><GrowBar pct={pct} className="h-full rounded-full bg-[hsl(var(--accent))]" /></div>
                    </div>
                  </div>
                </section>
              </Item>

              {todo.length > 0 && (
                <Item>
                  <section className="surface p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div><span className="eyebrow">Priorités</span><h2 className="font-semibold mt-0.5">À traiter en priorité</h2></div>
                      <button onClick={() => setView('production')} className="text-xs text-primary hover:underline">Toute la production</button>
                    </div>
                    <ul className="divide-y">
                      {todo.map((c) => (
                        <li key={c.id}>
                          <button onClick={() => openClient(c)} className="w-full flex items-center justify-between gap-3 py-2.5 text-sm group">
                            <span className="flex items-center gap-3 min-w-0">
                              <span className="h-8 w-8 shrink-0 rounded-lg bg-muted grid place-items-center text-[11px] font-semibold text-primary">{initials(c.name)}</span>
                              <span className="font-medium truncate">{c.name}{c.legacy_company_id && legacyTag}</span>
                            </span>
                            <span className="flex items-center gap-2 shrink-0">{pill(statusFor(c))}<ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" /></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                </Item>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Item>
                  <section className="surface p-5 sm:p-6 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div><span className="eyebrow">Production</span><h2 className="font-semibold mt-0.5">Où en est le mois</h2></div>
                      <button onClick={() => setView('production')} className="text-xs text-primary hover:underline">Voir le détail</button>
                    </div>
                    {Object.keys(prodCounts).length === 0 ? <p className="text-sm text-muted-foreground">Aucun client IA pour l'instant.</p> : (
                      <div className="space-y-3">
                        {PROD_ORDER.filter((s) => prodCounts[s]).map((s, i) => (
                          <div key={s}>
                            <div className="flex items-center justify-between text-sm mb-1">{pill(s)}<span className="num text-muted-foreground">{prodCounts[s]}</span></div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden"><GrowBar pct={(prodCounts[s] / Math.max(dueProd.length, 1)) * 100} delay={i * 0.06} className="h-full rounded-full bg-primary" /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </Item>
                <Item>
                  <section className="surface p-5 sm:p-6 h-full">
                    <span className="eyebrow">Implantations</span><h2 className="font-semibold mt-0.5 mb-4">Répartition des clients en production</h2>
                    <div className="space-y-3">
                      {LOCATIONS.map((l, i) => {
                        const n = countForFilter(l.key); const w = prodCount ? (n / prodCount) * 100 : 0;
                        return (
                          <button key={l.key} onClick={() => { goClients(l.key); setOpen((o) => ({ ...o, clients: true })); }} className="w-full text-left group">
                            <div className="flex justify-between text-sm mb-1"><span>{l.flag} {l.label}</span><span className="num text-muted-foreground">{n}</span></div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden"><GrowBar pct={w > 0 ? Math.max(w, 2) : 0} delay={i * 0.06} className="h-full rounded-full bg-primary group-hover:bg-[hsl(var(--accent))] transition-colors" /></div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </Item>
              </div>

              <Item>
                <section className="surface p-5 sm:p-6">
                  <span className="eyebrow">Fil d'activité</span><h2 className="font-semibold mt-0.5 mb-4">Activité récente</h2>
                  {activity.length === 0 ? <p className="text-sm text-muted-foreground">Aucune activité récente.</p> : (
                    <ol className="relative border-l pl-5 space-y-4">
                      {activity.map((a) => (
                        <li key={a.id} className="text-sm">
                          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-background" />
                          <div>{labelAct(a)}{a.clients?.name && <span className="text-muted-foreground"> · {a.clients.name}</span>}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{new Date(a.created_at).toLocaleString('fr-FR')}</div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </Item>
            </Stagger>
          )}

          {/* ───────── PRODUCTION ───────── */}
          {view === 'production' && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="eyebrow">Production mensuelle</span>
                  <h1 className="text-2xl font-semibold tracking-tight mt-1 capitalize">{periodLabel(currentPeriod())}</h1>
                  <p className="text-sm text-muted-foreground">IA (automatique) et legacy (suivi manuel)</p>
                </div>
                {searchBox}
              </div>
              {prodRows.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-2xl"><ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">Aucun client IA.</p></div>
              ) : (
                <div className="surface overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left border-b bg-muted/40">
                        <th className="px-4 py-2.5 eyebrow font-normal">Client</th><th className="px-4 py-2.5 eyebrow font-normal hidden sm:table-cell">Activité</th>
                        <th className="px-4 py-2.5 eyebrow font-normal hidden md:table-cell">Conseiller</th><th className="px-4 py-2.5 eyebrow font-normal">Statut</th>
                        <th className="px-4 py-2.5 eyebrow font-normal text-center">Pièces · fiabilité</th><th className="px-4 py-2.5"></th>
                      </tr></thead>
                      <tbody>
                        {prodRows.map(({ c, legacy, status, missing, advisor }) => (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 font-medium">
                              <span className="flex items-center gap-3"><span className="h-8 w-8 shrink-0 rounded-lg bg-muted grid place-items-center text-[11px] font-semibold text-primary">{initials(c.name)}</span><span>{c.name}{legacy && legacyTag}</span></span>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{c.activity_types?.name ?? (legacy ? 'Sur-mesure' : '—')}</td>
                            <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{advisor ?? '—'}</td>
                            <td className="px-4 py-3">
                              {legacy
                                ? <select value={status} onChange={(e) => setLegacyStatus(c.id, e.target.value)} className="text-xs h-8 rounded-lg border bg-background px-2 outline-none">
                                    {LEGACY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                                  </select>
                                : pill(status)}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">{missing > 0 ? <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{missing}</span> : <span className="text-muted-foreground">—</span>}
                              {reliabilityByClient[c.id] != null && (
                                <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded border font-mono ${reliabilityTone(reliabilityByClient[c.id])}`} title="Indice de fiabilité du mois (cible ≥ 90 avant envoi)">{reliabilityByClient[c.id]}/100</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right"><button onClick={() => openClient(c)} className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">Ouvrir <ChevronRight className="w-3 h-3" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ───────── CLIENTS ───────── */}
          {view === 'clients' && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="eyebrow">Clients</span>
                  <h1 className="text-2xl font-semibold tracking-tight mt-1 flex items-center gap-2"><span>{currentFilter.flag}</span> {currentFilter.label}</h1>
                  <p className="text-sm text-muted-foreground">{countForFilter(loc)} client{countForFilter(loc) > 1 ? 's' : ''}</p>
                </div>
                {searchBox}
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <Shimmer key={i} className="h-32 rounded-xl" />)}</div>
              ) : group.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-2xl"><Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">{q ? 'Aucun client ne correspond.' : `Aucun client dans « ${currentFilter.label} ».`}</p></div>
              ) : (
                <Stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.map((c) => {
                    const legacy = !!c.legacy_company_id;
                    const st = statusFor(c);
                    return (
                      <Item key={c.id}>
                        <div className="surface surface-hover p-4 h-full flex flex-col">
                          <button onClick={() => openClient(c)} className="text-left w-full flex items-start gap-3">
                            <span className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">{initials(c.name)}</span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start justify-between gap-2">
                                <span className="font-semibold truncate">{c.name}</span>
                                <span className={`shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-mono ${legacy ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>{legacy ? 'Legacy' : 'IA'}</span>
                              </span>
                              <span className="block text-xs text-muted-foreground mt-0.5 truncate">{c.activity_types?.name ?? (legacy ? 'Dashboard sur-mesure' : 'Activité non définie')} · {c.currency}{c.cadence === 'quarterly' ? ' · Trimestriel' : ''}</span>
                              {isProd(c) && <span className="mt-2 inline-block">{pill(st)}</span>}
                            </span>
                          </button>
                          {/* flex-wrap : sur une carte étroite, « Classer… » + « Ouvrir » passent à la ligne au lieu de déborder */}
                          <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <select value={c.location ?? 'dubai'} onChange={(e) => changeLocation(c.id, e.target.value)} className="text-xs h-8 rounded-lg border bg-background px-2 outline-none">
                                {LOCATIONS.map((l) => <option key={l.key} value={l.key}>{l.flag} {l.label}</option>)}
                              </select>
                              {c.category === 'a_categoriser' && (
                                <select value={c.category} onChange={(e) => changeCategory(c.id, e.target.value)}
                                  className="text-xs h-8 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-2 outline-none">
                                  <option value="a_categoriser" disabled>🏷️ Classer…</option>
                                  <option value="production">✅ Production</option>
                                  <option value="test">🧪 Test</option>
                                  <option value="ponctuel">📌 Ponctuel</option>
                                </select>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              <button onClick={() => navigate(`/admin/clients/${c.id}/settings`)} title="Réglages" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><Settings className="w-3.5 h-3.5" /></button>
                              <button onClick={() => openClient(c)} className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">Ouvrir <ChevronRight className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      </Item>
                    );
                  })}
                </Stagger>
              )}
            </>
          )}

          {/* ───────── COMMERCIAL ───────── */}
          {view === 'commercial' && (
            <>
              <div>
                <span className="eyebrow">Commercial</span>
                <h1 className="text-2xl font-semibold tracking-tight mt-1">Checklists documents</h1>
                <p className="text-sm text-muted-foreground">Ce qu'il faut demander au prospect, par activité. Copie-colle pour l'envoyer.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DOC_CHECKLIST).map(([slug, c]) => (
                  <button key={slug} onClick={() => setChecklistSlug(slug)}
                    className={`px-3.5 py-1.5 rounded-full text-sm border transition ${checklistSlug === slug ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="surface p-5 sm:p-6">
                <DocChecklistPanel activitySlug={checklistSlug} />
              </div>
            </>
          )}
        </PageFade>
      </div>
    </AppShell>
  );
}
