// Espace client : en-tête compact, navigation (onglets défilants sur mobile, menu latéral sur ordinateur),
// accueil « marge d'abord » (les 3 points du mois, marge après pub, pub vs point mort, marge par commande,
// trésorerie et point bas), rapport complet, flux, documents, questions. RLS = isolation + « publié uniquement ».
// Ton : tutoiement (doctrine Daftime).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { BookingButton } from '@/components/booking/BookingButton';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, UploadCloud, Activity, FileText, CheckCircle2, Clock, LayoutDashboard, FolderOpen,
  MessageCircle, Send, FileBarChart2, ArrowRight, TrendingUp, Mail, Phone, Sunrise, Waypoints, Sparkles,
} from 'lucide-react';
import { FlowMapView } from '@/components/flows/FlowMapView';
import type { FlowMap } from '../../supabase/functions/_shared/flowMap';
import { DashboardFrame } from '@/components/generic/DashboardFrame';
import { DailyView } from '@/components/generic/DailyView';
import { KpiPins } from '@/components/generic/KpiPins';
import { ErrorBoundary } from '@/components/generic/ErrorBoundary';
import { currentPeriod, shiftPeriod, periodLabel, logActivity } from '@/lib/genericApi';
import { legacyDashboardRoute } from '@/lib/staff';
import { ADVISOR } from '@/lib/config';

const BUCKET = 'client-files';
const STAFF_ROLES = ['admin', 'manager', 'collaborateur', 'super_admin'];

type TabKey = 'accueil' | 'quotidien' | 'dashboard' | 'flux' | 'documents' | 'assistant' | 'activity';
const NAV: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'accueil', label: 'Accueil', icon: LayoutDashboard },
  { key: 'dashboard', label: 'Rapport complet', icon: FileBarChart2 },
  { key: 'flux', label: 'Mes flux', icon: Waypoints },
  { key: 'quotidien', label: 'Au quotidien', icon: Sunrise },
  { key: 'assistant', label: 'Poser une question', icon: MessageCircle },
  { key: 'documents', label: 'Envoyer un document', icon: FolderOpen },
  { key: 'activity', label: 'Activité', icon: Activity },
];

// Questions suggérées : langage e-commerce quand la cascade de marges existe, générique sinon.
const SUGGESTIONS_ECOM = [
  'Combien je gagne par commande après la pub ?',
  'Ma pub est-elle rentable ce mois-ci ?',
  'Quand ma trésorerie sera-t-elle au plus bas ?',
];
const SUGGESTIONS_GENERIC = [
  "Quel est mon chiffre d'affaires ce mois-ci ?",
  'Quel est mon poste de dépense le plus élevé ?',
  "Comment a évolué ma marge par rapport au mois dernier ?",
];

function labelActivity(a: any): string {
  if (a.action === 'file_uploaded') return `Document déposé : ${a.metadata?.name ?? ''}`;
  if (a.action === 'dashboard_published') return 'Nouveau rapport publié';
  return a.action;
}

// Valeur d'un indicateur du rapport publié, par son IDENTIFIANT (sections[].rows[].id) — jamais par libellé.
type Row = { id?: string; value?: unknown; unit?: string };
function metricById(dataJson: any, id: string): number | null {
  for (const s of (dataJson?.sections ?? []) as { rows?: Row[] }[]) {
    const r = (s.rows ?? []).find((x) => x.id === id);
    if (r && typeof r.value === 'number' && isFinite(r.value)) return r.value;
  }
  return null;
}
const TREND_IDS = ['ca', 'cm3', 'cm3_rate', 'ebitda', 'resultat_net'] as const;

const money = (v: number, currency = 'EUR') => {
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v); }
  catch { return `${Math.round(v).toLocaleString('fr-FR')} ${currency}`; }
};
const num1 = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const shortMonth = (p: string) => { try { return new Date(p).toLocaleDateString('fr-FR', { month: 'short' }); } catch { return p; } };

// ---- Blocs de l'accueil ---------------------------------------------------------------------------------

function Points({ points }: { points: { tone?: string; text: string }[] }) {
  const dot = (t?: string) => (t === 'good' ? 'bg-emerald-500' : t === 'warn' ? 'bg-amber-500' : 'bg-sky-500');
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> Les 3 points du mois</h2>
      <ol className="mt-3 space-y-2.5">
        {points.slice(0, 3).map((p, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-snug">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">{i + 1}</span>
            <span className="flex-1">{p.text}</span>
            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dot(p.tone)}`} aria-hidden />
          </li>
        ))}
      </ol>
    </section>
  );
}

type Kpi = { label: string; value: string; sub?: string; delta?: number | null; lowerIsBetter?: boolean; status?: { ok: boolean; text: string } };
function KpiCard({ k }: { k: Kpi }) {
  const good = k.delta == null ? null : k.lowerIsBetter ? k.delta <= 0 : k.delta >= 0;
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col">
      <div className="text-xs text-muted-foreground">{k.label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{k.value}</div>
      {k.sub && <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>}
      <div className="mt-auto pt-2 flex flex-wrap items-center gap-2">
        {k.status && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${k.status.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{k.status.text}</span>
        )}
        {k.delta != null && (
          <span className={`text-[11px] ${good ? 'text-emerald-600' : 'text-red-600'}`}>{k.delta >= 0 ? '▲' : '▼'} {num1(Math.abs(k.delta))} % vs mois précédent</span>
        )}
      </div>
    </div>
  );
}

// Évolution : CA et marge après pub (à défaut résultat) par mois publié.
function MonthlyTrend({ series, currency }: { series: Array<{ period: string; values: Record<string, number | null> }>; currency: string }) {
  const pts = series.filter((s) => s.values.ca != null);
  if (pts.length < 2) return null;
  const mKey = pts.some((s) => s.values.cm3 != null) ? 'cm3' : pts.some((s) => s.values.ebitda != null) ? 'ebitda' : 'resultat_net';
  const mLabel = mKey === 'cm3' ? 'Marge après pub' : mKey === 'ebitda' ? "Résultat d'exploitation" : 'Résultat net';
  const max = Math.max(...pts.flatMap((s) => [Math.abs(s.values.ca ?? 0), Math.abs(s.values[mKey] ?? 0)]), 1);
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
        <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> Mois après mois</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary/30" /> Chiffre d'affaires</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> {mLabel}</span>
        </div>
      </div>
      <div className="flex items-end gap-3 sm:gap-4 h-40 mt-4">
        {pts.map((s) => {
          const m = s.values[mKey] ?? 0;
          return (
            <div key={s.period} className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="flex-1 w-full flex items-end justify-center gap-1">
                <div className="w-3.5 rounded-t bg-primary/30" style={{ height: `${Math.max(((s.values.ca ?? 0) / max) * 100, 2)}%` }} title={`CA : ${money(s.values.ca ?? 0, currency)}`} />
                <div className={`w-3.5 rounded-t ${m >= 0 ? 'bg-primary' : 'bg-red-400'}`} style={{ height: `${Math.max((Math.abs(m) / max) * 100, 2)}%` }} title={`${mLabel} : ${money(m, currency)}`} />
              </div>
              <span className="text-[11px] text-muted-foreground capitalize">{shortMonth(s.period)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Un seul mois publié : la cascade du CA à la marge après pub.
function MonthCascade({ dataJson, currency, period }: { dataJson: any; currency: string; period: string }) {
  const steps = [
    { id: 'ca', label: "Chiffre d'affaires net" }, { id: 'cm1', label: 'Après coût des produits (CM1)' },
    { id: 'cm2', label: 'Après logistique & paiement (CM2)' }, { id: 'cm3', label: 'Après pub (CM3)' },
  ].map((s) => ({ ...s, v: metricById(dataJson, s.id) })).filter((s) => s.v != null) as { id: string; label: string; v: number }[];
  if (steps.length < 2) return null;
  const max = Math.max(...steps.map((s) => Math.abs(s.v)), 1);
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> Du chiffre d'affaires à la marge</h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-4">Ce qu'il reste à chaque étape en {periodLabel(period).toLowerCase()}</p>
      <div className="space-y-3">
        {steps.map((b) => (
          <div key={b.id}>
            <div className="flex justify-between items-baseline text-sm mb-1 gap-2">
              <span className="truncate">{b.label}</span>
              <span className="tabular-nums font-medium shrink-0">{money(b.v, currency)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${b.v >= 0 ? 'bg-primary' : 'bg-red-400'}`} style={{ width: `${Math.max((Math.abs(b.v) / max) * 100, 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChatPanel({ chat, input, setInput, busy, onSend, suggestions, compact = false }: {
  chat: Array<{ role: 'user' | 'assistant'; content: string }>; input: string; setInput: (v: string) => void;
  busy: boolean; onSend: (q: string) => void; suggestions: string[]; compact?: boolean;
}) {
  return (
    <div className="flex flex-col flex-1">
      <div className={`flex-1 overflow-y-auto space-y-3 mb-3 ${compact ? 'max-h-44 min-h-[110px]' : 'min-h-[240px] max-h-[50vh]'}`}>
        {chat.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Par exemple :</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => onSend(s)}
                  className="text-xs rounded-full border px-3 py-1.5 hover:bg-muted hover:border-primary/40 transition text-left">{s}</button>
              ))}
            </div>
          </div>
        ) : chat.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="text-xs text-muted-foreground">Je regarde tes chiffres…</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSend(input); }} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={suggestions[0] ? `Ex. ${suggestions[0]}` : 'Ta question'}
          className="flex-1 min-w-0 h-11 rounded-lg border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <Button type="submit" disabled={busy || !input.trim()} className="h-11 px-4" aria-label="Envoyer"><Send className="w-4 h-4" /></Button>
      </form>
    </div>
  );
}

export default function ClientSpace() {
  const { id } = useParams<{ id: string }>();
  const { user, roles } = useAuth();
  const isStaff = (roles ?? []).some((r: { role: string }) => STAFF_ROLES.includes(r.role));
  const navigate = useNavigate();
  // Client legacy : son dashboard vient de la génération legacy → redirection vers sa route dédiée.
  const [legacyRedirecting, setLegacyRedirecting] = useState(false);

  const [tab, setTab] = useState<TabKey>('accueil');
  const [client, setClient] = useState<any>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]); // mois publiés, du plus récent au plus ancien
  const [periodsLoaded, setPeriodsLoaded] = useState(false);
  const [docPeriod, setDocPeriod] = useState(shiftPeriod(currentPeriod(), -1));
  const [dash, setDash] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [hasDaily, setHasDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNew, setHasNew] = useState(false); // nouveau rapport publié non encore vu
  const [series, setSeries] = useState<Array<{ period: string; values: Record<string, number | null> }>>([]);
  const [chat, setChat] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [flowMap, setFlowMap] = useState<FlowMap | null>(null);

  const sendQuestion = async (q: string) => {
    const question = q.trim();
    if (!question || chatBusy) return;
    const history = chat.map((m) => ({ role: m.role, content: m.content }));
    setChat((c) => [...c, { role: 'user', content: question }]);
    setChatInput(''); setChatBusy(true);
    try {
      const { data, error: err } = await supabase.functions.invoke('client-chat', { body: { client_id: id, question, history } });
      setChat((c) => [...c, { role: 'assistant', content: err ? "Désolé, une erreur est survenue. Réessaie ou écris à ton conseiller." : (data?.answer ?? '—') }]);
    } catch {
      setChat((c) => [...c, { role: 'assistant', content: 'Désolé, une erreur est survenue.' }]);
    } finally { setChatBusy(false); }
  };

  const loadClient = useCallback(async () => {
    const { data } = await supabase.from('clients' as any)
      .select('id, name, currency, logo_url, legacy_company_id, activity_types:activity_type_id(slug, config), advisor:advisor_id(name, email, whatsapp, photo_url, booking_url)')
      .eq('id', id).maybeSingle();
    const legacyId = (data as { legacy_company_id?: string | null } | null)?.legacy_company_id;
    if (legacyId) {
      setLegacyRedirecting(true);
      const { data: co } = await supabase.from('companies').select('layout_type').eq('id', legacyId).maybeSingle();
      navigate(legacyDashboardRoute((co as { layout_type?: string } | null)?.layout_type, legacyId), { replace: true });
      return;
    }
    setClient(data);
  }, [id, navigate]);

  const loadAvailable = useCallback(async () => {
    const { data } = await supabase.from('dashboards' as any).select('period')
      .eq('client_id', id).eq('status', 'publie').eq('is_current', true).order('period', { ascending: false });
    const periods = [...new Set(((data as any[]) ?? []).map((d) => d.period as string))];
    setAvailablePeriods(periods); setPeriodsLoaded(true);
    if (periods.length) {
      setPeriod((p) => (periods.includes(p) ? p : periods[0]));
      setDocPeriod(shiftPeriod(periods[0], 1)); // documents : pour le prochain rapport
      let seen: string | null = null;
      try { seen = localStorage.getItem(`daftime_lastseen_${id}`); } catch { /* stockage indisponible */ }
      setHasNew(seen !== periods[0]);
    }
  }, [id]);

  const loadDashboard = useCallback(async () => {
    const { data } = await supabase.from('dashboards' as any).select('*')
      .eq('client_id', id).eq('period', period).eq('status', 'publie').eq('is_current', true).maybeSingle();
    setDash(data);
  }, [id, period]);

  const loadFiles = useCallback(async () => {
    const { data } = await supabase.from('files' as any).select('*').eq('client_id', id).eq('period', docPeriod).order('created_at', { ascending: false });
    setFiles((data as any[]) ?? []);
  }, [id, docPeriod]);

  const loadActivity = useCallback(async () => {
    const { data } = await supabase.from('activity_log' as any).select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(20);
    setActivity((data as any[]) ?? []);
  }, [id]);

  const loadTrend = useCallback(async () => {
    const { data } = await supabase.from('dashboards' as any).select('period, data_json')
      .eq('client_id', id).eq('status', 'publie').eq('is_current', true).order('period', { ascending: true });
    setSeries(((data as any[]) ?? []).map((d) => ({ period: d.period, values: Object.fromEntries(TREND_IDS.map((k) => [k, metricById(d.data_json, k)])) })));
  }, [id]);

  // Cartographie des flux : seule la version PUBLIÉE est lisible (RLS) ; onglet masqué sinon.
  const loadFlowMap = useCallback(async () => {
    const { data } = await supabase.from('client_flow_maps' as any).select('data').eq('client_id', id).eq('status', 'published').maybeSingle();
    setFlowMap(((data as { data?: FlowMap } | null)?.data) ?? null);
  }, [id]);

  // « Au quotidien » : affiché seulement s'il y a des chiffres du jour ou des indicateurs suivis.
  const loadDaily = useCallback(async () => {
    const [{ count: d }, { count: p }] = await Promise.all([
      supabase.from('daily_metrics' as any).select('day', { count: 'exact', head: true }).eq('client_id', id),
      supabase.from('client_kpi_pins' as any).select('metric_id', { count: 'exact', head: true }).eq('client_id', id),
    ]);
    setHasDaily((d ?? 0) > 0 || (p ?? 0) > 0);
  }, [id]);

  useEffect(() => { loadClient(); loadAvailable(); loadActivity(); loadTrend(); loadFlowMap(); loadDaily(); }, [loadClient, loadAvailable, loadActivity, loadTrend, loadFlowMap, loadDaily]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadFiles(); }, [loadFiles]);

  // Marque le dernier rapport comme vu quand il est consulté.
  useEffect(() => {
    const latest = availablePeriods[0];
    if (tab === 'dashboard' && latest && period === latest) {
      try { localStorage.setItem(`daftime_lastseen_${id}`, latest); } catch { /* stockage indisponible */ }
      setHasNew(false);
    }
  }, [tab, period, availablePeriods, id]);

  const upload = async (fileList: FileList) => {
    setBusy(true); setError(null);
    try {
      for (const f of Array.from(fileList)) {
        const path = `${id}/${docPeriod}/${f.name}`;
        const up = await supabase.storage.from(BUCKET).upload(path, f, { upsert: true, contentType: f.type || undefined });
        if (up.error) throw up.error;
        await supabase.from('files' as any).insert({ client_id: id, period: docPeriod, original_name: f.name, storage_path: path, status: 'uploaded', uploaded_by: user?.id ?? null });
        await logActivity(id!, 'file_uploaded', { entity_type: 'file', metadata: { name: f.name, period: docPeriod } });
      }
      await Promise.all([loadFiles(), loadActivity()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const dj = dash?.data_json;
  const isEcom = metricById(dj, 'cm3') != null || series.some((s) => s.values.cm3 != null);

  // Indicateurs clés de l'accueil (marge d'abord), avec repli générique pour les autres activités.
  const kpis = useMemo<Kpi[]>(() => {
    if (!dj || !client) return [];
    const cur = client.currency ?? 'EUR';
    const idx = series.findIndex((s) => s.period === period);
    const prev = idx > 0 ? series[idx - 1].values : null;
    const delta = (key: string, v: number | null) => { const p = prev?.[key]; return v != null && p != null && p !== 0 ? ((v - p) / Math.abs(p)) * 100 : null; };
    const g = (k: string) => metricById(dj, k);
    const out: Kpi[] = [];
    const cm3 = g('cm3'), cm3r = g('cm3_rate'), mer = g('mer'), be = g('breakeven_roas'), cpo = g('cm3_per_order'), aov = g('aov'), cash = g('cash_end');
    if (cm3 != null) out.push({ label: 'Marge après pub', value: money(cm3, cur), sub: cm3r != null ? `${num1(cm3r)} % du chiffre d'affaires` : undefined, delta: delta('cm3', cm3) });
    if (mer != null) out.push({ label: 'CA généré par 1 € de pub', value: `${num1(mer)} €`, sub: be != null ? `point mort à ${num1(be)} €` : undefined,
      status: be != null ? (mer >= be ? { ok: true, text: `au-dessus du point mort` } : { ok: false, text: 'sous le point mort' }) : undefined });
    if (cpo != null) out.push({ label: 'Gagné par commande après pub', value: money(cpo, cur), sub: aov != null ? `panier moyen ${money(aov, cur)}` : undefined });
    if (cash != null) {
      const low = dj?.cash_forecast?.low as { date: string; balance: number } | undefined;
      out.push({ label: 'Trésorerie fin de mois', value: money(cash, cur), sub: low ? `point bas prévu ${money(low.balance, cur)} le ${ddmm(low.date)}` : undefined,
        status: low ? (low.balance < 0 ? { ok: false, text: 'passe sous zéro' } : low.balance < cash * 0.5 ? { ok: false, text: 'à surveiller' } : { ok: true, text: 'tient sur 3 mois' }) : undefined });
    }
    if (out.length < 2) { // activités sans cascade : CA, résultat
      const ca = g('ca'), eb = g('ebitda') ?? g('resultat_net');
      if (ca != null) out.unshift({ label: "Chiffre d'affaires", value: money(ca, cur), delta: delta('ca', ca) });
      if (eb != null) out.push({ label: g('ebitda') != null ? "Résultat d'exploitation" : 'Résultat net', value: money(eb, cur), delta: delta(g('ebitda') != null ? 'ebitda' : 'resultat_net', eb) });
    }
    return out.slice(0, 4);
  }, [dj, client, series, period]);

  if (!client) return <div className="p-8 text-muted-foreground">{legacyRedirecting ? 'Ouverture de ton espace…' : 'Chargement…'}</div>;

  const advisor = (client as any)?.advisor as { name: string; email?: string; whatsapp?: string; photo_url?: string; booking_url?: string } | null | undefined;
  const advisorName = advisor?.name ?? ADVISOR.name;
  const advisorInitials = advisorName.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const points = ((dj?.points ?? []) as { tone?: string; text: string }[]).filter((p) => p?.text);
  const suggestions = isEcom ? SUGGESTIONS_ECOM : SUGGESTIONS_GENERIC;
  const noReportYet = periodsLoaded && availablePeriods.length === 0;

  const visibleNav = NAV.filter((n) => (n.key === 'flux' ? !!flowMap : n.key === 'quotidien' ? hasDaily : n.key === 'activity' ? activity.length > 0 : true));
  const go = (k: TabKey) => { setTab(k); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* */ } };

  // Navigation entre les MOIS PUBLIÉS uniquement (plus de pages vides « en préparation »).
  const pIdx = availablePeriods.indexOf(period);
  const older = pIdx >= 0 && pIdx < availablePeriods.length - 1 ? availablePeriods[pIdx + 1] : null;
  const newer = pIdx > 0 ? availablePeriods[pIdx - 1] : null;
  const MonthBar = availablePeriods.length > 0 ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => older && setPeriod(older)} disabled={!older} aria-label="Mois précédent"><ChevronLeft className="w-4 h-4" /></Button>
      <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Mois"
        className="h-9 rounded-md border bg-background px-3 text-sm font-medium capitalize min-w-[150px]">
        {availablePeriods.map((p) => <option key={p} value={p}>{periodLabel(p)}</option>)}
      </select>
      <Button variant="outline" size="icon" onClick={() => newer && setPeriod(newer)} disabled={!newer} aria-label="Mois suivant"><ChevronRight className="w-4 h-4" /></Button>
      {period === availablePeriods[0] && <span className="text-xs text-muted-foreground">dernier rapport</span>}
    </div>
  ) : null;

  const AdvisorCard = (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        {advisor?.photo_url
          ? <img src={advisor.photo_url} alt={advisorName} className="w-10 h-10 rounded-full object-cover shrink-0" />
          : <div className="w-10 h-10 rounded-full bg-accent/15 text-primary flex items-center justify-center shrink-0 font-medium text-sm">{advisorInitials}</div>}
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Ton conseiller</div>
          <div className="font-medium text-sm leading-tight truncate">{advisorName}</div>
        </div>
      </div>
      {advisor?.email && (
        <a href={`mailto:${advisor.email}`} className="mt-3 text-xs flex items-center gap-2 text-muted-foreground hover:text-foreground transition truncate">
          <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{advisor.email}</span>
        </a>
      )}
      {advisor?.whatsapp && (
        <a href={`https://wa.me/${advisor.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${advisorName}, ici ${client.name} (espace Daftime).`)}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full mt-3 inline-flex items-center justify-center gap-2 h-9 rounded-md bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-medium transition">
          <Phone className="w-4 h-4" /> Écrire sur WhatsApp
        </a>
      )}
      <BookingButton label="Prendre rendez-vous" size="sm" variant="outline" className="w-full mt-2" url={advisor?.booking_url ?? undefined} />
    </div>
  );

  const EmptyFirstReport = (
    <section className="rounded-xl border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm text-amber-700"><Clock className="w-4 h-4" /> Ton premier rapport est en préparation</div>
      <h2 className="text-xl font-semibold mt-2">Bienvenue dans ton espace, {client.name}</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-xl">Chaque mois, tu retrouveras ici ce que ton shop gagne vraiment, si ta pub est rentable et comment évolue ta trésorerie.</p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { t: 'On récupère tes données', d: "Shopify, banque, compta : on s'en occupe, tu n'as rien à faire." },
          { t: 'On analyse', d: `${advisorName} vérifie et construit ton rapport.` },
          { t: 'Tu reçois ton rapport', d: 'Les 3 points du mois, tes marges, ta trésorerie.' },
        ].map((s, i) => (
          <li key={i} className="rounded-lg border bg-background p-4">
            <div className="text-xs font-semibold text-muted-foreground">Étape {i + 1}</div>
            <div className="font-medium mt-1">{s.t}</div>
            <p className="text-xs text-muted-foreground mt-1">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );

  // Mois proposés pour le dépôt : les 3 derniers mois + le mois à venir + les mois publiés.
  const docPeriods = [...new Set([shiftPeriod(currentPeriod(), 0), shiftPeriod(currentPeriod(), -1), shiftPeriod(currentPeriod(), -2), shiftPeriod(currentPeriod(), -3), docPeriod, ...availablePeriods])]
    .sort((a, b) => (a < b ? 1 : -1));

  return (
    <AppShell title={client.name}>
      <div className="space-y-5 min-w-0 overflow-x-hidden">
        {isStaff && (
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
            <ChevronLeft className="w-4 h-4" /> Retour (vue équipe)
          </button>
        )}
        {error && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

        {/* En-tête compact */}
        <header className="flex flex-wrap items-center gap-4">
          {client.logo_url && <img src={client.logo_url} alt={client.name} className="h-11 w-auto rounded border bg-white p-1.5" />}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">{client.name}</h1>
            <p className="text-sm text-muted-foreground">Ton espace Daftime Advisory</p>
          </div>
          {hasNew && availablePeriods[0] && (
            <button onClick={() => { setPeriod(availablePeriods[0]); go('dashboard'); }}
              className="sm:ml-auto inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent/15 text-foreground hover:bg-accent/25 transition">
              <CheckCircle2 className="w-3.5 h-3.5" /> Nouveau rapport : {periodLabel(availablePeriods[0])}
            </button>
          )}
        </header>

        {/* Navigation mobile : onglets défilants */}
        <nav className="lg:hidden max-w-full overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Sections">
          <div className="flex gap-2 w-max">
            {visibleNav.map((item) => (
              <button key={item.key} onClick={() => go(item.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap border transition ${tab === item.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}>
                <item.icon className="w-4 h-4" /> {item.label}
                {item.key === 'dashboard' && hasNew && <span className="w-2 h-2 rounded-full bg-accent" />}
              </button>
            ))}
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Menu latéral (ordinateur) + conseiller */}
          <aside className="hidden lg:block space-y-4">
            <nav className="rounded-xl border bg-card p-2 space-y-1" aria-label="Sections">
              {visibleNav.map((item) => (
                <button key={item.key} onClick={() => go(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${tab === item.key ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground hover:bg-muted'}`}>
                  <item.icon className="w-4 h-4 shrink-0" /> {item.label}
                  {item.key === 'dashboard' && hasNew && <span className="ml-auto w-2 h-2 rounded-full bg-accent" title="Nouveau rapport" />}
                </button>
              ))}
            </nav>
            {AdvisorCard}
          </aside>

          <div className="space-y-4 min-w-0">
            {(tab === 'accueil' || tab === 'dashboard') && MonthBar}

            {tab === 'accueil' && (noReportYet ? EmptyFirstReport : (
              <div className="space-y-4">
                {points.length > 0 && <Points points={points} />}
                {kpis.length > 0 && <div className={`grid grid-cols-1 sm:grid-cols-2 ${kpis.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-4`}>{kpis.map((k) => <KpiCard key={k.label} k={k} />)}</div>}
                {series.filter((s) => s.values.ca != null).length >= 2
                  ? <MonthlyTrend series={series} currency={client.currency} />
                  : <MonthCascade dataJson={dj} currency={client.currency} period={period} />}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 lg:self-start rounded-xl border bg-card p-5 flex flex-col">
                    <h2 className="font-semibold mb-1 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-accent" /> Une question sur tes chiffres ?</h2>
                    <p className="text-xs text-muted-foreground mb-3">Réponses factuelles, tirées de tes données. Pour un conseil, écris à {advisorName}.</p>
                    <ChatPanel chat={chat} input={chatInput} setInput={setChatInput} busy={chatBusy} onSend={sendQuestion} suggestions={suggestions} compact />
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border bg-card p-5">
                      <h2 className="font-semibold mb-2 flex items-center gap-2"><FileBarChart2 className="w-4 h-4 text-accent" /> Ton rapport complet</h2>
                      <p className="text-sm text-muted-foreground mb-3">Le détail de <span className="font-medium text-foreground">{periodLabel(period).toLowerCase()}</span> : marges, pub, produits, trésorerie.</p>
                      <Button onClick={() => go('dashboard')} className="w-full" disabled={!dash}>Ouvrir le rapport <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
                    </div>
                    {flowMap && (
                      <button onClick={() => go('flux')} className="w-full text-left rounded-xl border bg-card p-5 hover:border-primary/40 transition">
                        <h2 className="font-semibold flex items-center gap-2"><Waypoints className="w-4 h-4 text-accent" /> La carte de tes flux</h2>
                        <p className="text-sm text-muted-foreground mt-1">Qui te paye, qui tu payes, et depuis quel compte.</p>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {tab === 'quotidien' && (
              <ErrorBoundary label="quotidien">
                <div className="space-y-4">
                  <KpiPins clientId={id!} currency={client.currency} />
                  <DailyView clientId={id!} currency={client.currency} />
                </div>
              </ErrorBoundary>
            )}

            {tab === 'dashboard' && (dash
              ? <DashboardFrame html={dash.html ?? ''} />
              : noReportYet ? EmptyFirstReport : (
                <div className="rounded-xl border bg-card text-center text-muted-foreground py-16">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" /> Chargement du rapport…
                </div>
              ))}

            {tab === 'flux' && flowMap && (
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-5">
                  <h2 className="font-semibold flex items-center gap-2"><Waypoints className="w-4 h-4 text-accent" /> La carte de tes flux</h2>
                  <p className="text-sm text-muted-foreground mt-1">Qui est qui, où est ton argent, d'où il vient et où il part — préparée avec {advisorName}.</p>
                </div>
                <FlowMapView map={flowMap} currency={client?.currency} />
              </div>
            )}

            {tab === 'documents' && (
              <div className="space-y-4">
                <section className="rounded-xl border bg-card p-6">
                  <h2 className="font-semibold mb-1 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-accent" /> Envoyer un document</h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">On récupère nous-mêmes tes données (Shopify, banque, compta…) : <span className="text-foreground font-medium">tu n'as rien à déposer</span>. Ce dépôt sert seulement si tu veux transmettre un document précis à {advisorName} (contrat, facture, devis…).</p>
                  <div className="flex flex-wrap items-center gap-2 mt-4 mb-4 text-sm">
                    <span className="text-muted-foreground">Il concerne</span>
                    <select value={docPeriod} onChange={(e) => setDocPeriod(e.target.value)} aria-label="Mois des documents"
                      className="h-9 rounded-md border bg-background px-3 text-sm font-medium capitalize">
                      {docPeriods.map((p) => <option key={p} value={p}>{periodLabel(p)}</option>)}
                    </select>
                  </div>
                  <label className="block max-w-xl">
                    <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.currentTarget.value = ''; }} />
                    <span className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-10 cursor-pointer hover:border-primary hover:bg-muted/40 transition">
                      <UploadCloud className="w-7 h-7 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{busy ? 'Envoi…' : 'Clique pour choisir tes fichiers'}</span>
                    </span>
                  </label>
                  {files.length > 0 && (
                    <div className="mt-6">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Déjà envoyés pour {periodLabel(docPeriod).toLowerCase()} ({files.length})</div>
                      <ul className="space-y-1.5">
                        {files.map((f) => (
                          <li key={f.id} className="text-sm flex items-center gap-2 text-muted-foreground"><FileText className="w-3.5 h-3.5 shrink-0 text-primary/60" /> <span className="truncate">{f.original_name}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              </div>
            )}

            {tab === 'assistant' && (
              <section className="rounded-xl border bg-card p-6 flex flex-col">
                <h2 className="font-semibold mb-1 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-accent" /> Pose une question à tes chiffres</h2>
                <p className="text-xs text-muted-foreground mb-4">Réponses factuelles sur tes données (un poste, un indicateur, une évolution). Pour une analyse ou un conseil, écris à {advisorName}.</p>
                <ChatPanel chat={chat} input={chatInput} setInput={setChatInput} busy={chatBusy} onSend={sendQuestion} suggestions={suggestions} />
              </section>
            )}

            {tab === 'activity' && (
              <section className="rounded-xl border bg-card p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /> Ton activité</h2>
                <ul className="space-y-3">
                  {activity.map((a) => (
                    <li key={a.id} className="text-sm flex gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span><span className="text-foreground">{labelActivity(a)}</span><span className="block text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('fr-FR')}</span></span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Conseiller en bas sur mobile */}
            <div className="lg:hidden">{AdvisorCard}</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
