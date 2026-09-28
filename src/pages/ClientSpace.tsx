// Espace client (front v2) : bandeau du mois (marge après pub + les 3 points), indicateurs animés, tendance,
// rapport complet, flux, questions, envoi de document. Navigation via le shell (menu latéral / onglets mobiles).
// RLS = isolation + « publié uniquement ». Ton : tutoiement (doctrine Daftime).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppShell, type ShellNavItem } from '@/components/layout/AppShell';
import { BookingButton } from '@/components/booking/BookingButton';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, UploadCloud, Activity, FileText, Clock, LayoutDashboard, FolderOpen,
  MessageCircle, Send, FileBarChart2, ArrowRight, ArrowUpRight, Mail, Phone, Sunrise, Waypoints, Sparkles, CheckCircle2,
} from 'lucide-react';
import { FlowMapView } from '@/components/flows/FlowMapView';
import type { FlowMap } from '../../supabase/functions/_shared/flowMap';
import { DashboardFrame } from '@/components/generic/DashboardFrame';
import { DailyView } from '@/components/generic/DailyView';
import { KpiPins } from '@/components/generic/KpiPins';
import { ErrorBoundary } from '@/components/generic/ErrorBoundary';
import { CountUp, GrowBar, Item, PageFade, Reveal, Shimmer, Stagger, motion } from '@/components/motion';
import { currentPeriod, shiftPeriod, periodLabel, logActivity } from '@/lib/genericApi';
import { legacyDashboardRoute } from '@/lib/staff';
import { ADVISOR } from '@/lib/config';

const BUCKET = 'client-files';
const STAFF_ROLES = ['admin', 'manager', 'collaborateur', 'super_admin'];

type TabKey = 'accueil' | 'quotidien' | 'dashboard' | 'flux' | 'documents' | 'assistant' | 'activity';
const NAV: { key: TabKey; label: string; short?: string; icon: ShellNavItem['icon'] }[] = [
  { key: 'accueil', label: 'Accueil', icon: LayoutDashboard },
  { key: 'dashboard', label: 'Rapport', icon: FileBarChart2 },
  { key: 'flux', label: 'Mes flux', icon: Waypoints },
  { key: 'assistant', label: 'Questions', icon: MessageCircle },
  { key: 'quotidien', label: 'Au quotidien', short: 'Quotidien', icon: Sunrise },
  { key: 'documents', label: 'Envoyer un document', short: 'Document', icon: FolderOpen },
  { key: 'activity', label: 'Activité', icon: Activity },
];

// Questions suggérées : langage e-commerce quand la cascade de marges existe, générique sinon.
const SUGGESTIONS_ECOM = ['Combien je gagne par commande après la pub ?', 'Ma pub est-elle rentable ce mois-ci ?', 'Quand ma trésorerie sera-t-elle au plus bas ?'];
const SUGGESTIONS_GENERIC = ["Quel est mon chiffre d'affaires ce mois-ci ?", 'Quel est mon poste de dépense le plus élevé ?', 'Comment a évolué ma marge par rapport au mois dernier ?'];

function labelActivity(a: any): string {
  if (a.action === 'file_uploaded') return `Document envoyé : ${a.metadata?.name ?? ''}`;
  if (a.action === 'dashboard_published') return 'Nouveau rapport publié';
  return a.action;
}

// Valeur d'un indicateur du rapport publié, par son IDENTIFIANT (sections[].rows[].id) — jamais par libellé.
function metricById(dataJson: any, id: string): number | null {
  for (const s of (dataJson?.sections ?? []) as { rows?: { id?: string; value?: unknown }[] }[]) {
    const r = (s.rows ?? []).find((x) => x.id === id);
    if (r && typeof r.value === 'number' && isFinite(r.value)) return r.value;
  }
  return null;
}
const TREND_IDS = ['ca', 'cm3', 'cm3_rate', 'ebitda', 'resultat_net'] as const;

const moneyFmt = (currency = 'EUR') => (v: number) => {
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v); }
  catch { return `${Math.round(v).toLocaleString('fr-FR')} ${currency}`; }
};
const num1 = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const shortMonth = (p: string) => { try { return new Date(p).toLocaleDateString('fr-FR', { month: 'short' }); } catch { return p; } };

type Kpi = { key: string; label: string; raw: number; fmt: (v: number) => string; sub?: string; delta?: number | null; status?: { ok: boolean; text: string } };

// ---- Blocs ---------------------------------------------------------------------------------------------

function Delta({ d }: { d: number }) {
  return <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${d >= 0 ? 'text-[hsl(var(--good))]' : 'text-[hsl(var(--bad))]'}`}>{d >= 0 ? '▲' : '▼'} {num1(Math.abs(d))} %</span>;
}

function KpiCard({ k }: { k: Kpi }) {
  return (
    <div className="surface surface-hover p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <span className="eyebrow">{k.label}</span>
      </div>
      <CountUp value={k.raw} format={k.fmt} className="num text-[28px] leading-none font-semibold mt-3" />
      {k.sub && <div className="text-xs text-muted-foreground mt-2">{k.sub}</div>}
      <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
        {k.status && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${k.status.ok ? 'text-[hsl(var(--good))] bg-[hsl(var(--good)/0.08)] border-[hsl(var(--good)/0.2)]' : 'text-[hsl(var(--warn))] bg-[hsl(var(--warn)/0.08)] border-[hsl(var(--warn)/0.25)]'}`}>{k.status.text}</span>
        )}
        {k.delta != null && <><Delta d={k.delta} /><span className="text-[11px] text-muted-foreground">vs mois précédent</span></>}
      </div>
    </div>
  );
}

// Évolution mensuelle : CA (clair) et marge (plein) par mois publié.
function MonthlyTrend({ series, currency }: { series: Array<{ period: string; values: Record<string, number | null> }>; currency: string }) {
  const pts = series.filter((s) => s.values.ca != null);
  if (pts.length < 2) return null;
  const mKey = pts.some((s) => s.values.cm3 != null) ? 'cm3' : pts.some((s) => s.values.ebitda != null) ? 'ebitda' : 'resultat_net';
  const mLabel = mKey === 'cm3' ? 'Marge après pub' : mKey === 'ebitda' ? "Résultat d'exploitation" : 'Résultat net';
  const max = Math.max(...pts.flatMap((s) => [Math.abs(s.values.ca ?? 0), Math.abs(s.values[mKey] ?? 0)]), 1);
  const money = moneyFmt(currency);
  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div><span className="eyebrow">Tendance</span><h2 className="font-semibold mt-1">Mois après mois</h2></div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary/20" /> Chiffre d'affaires</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> {mLabel}</span>
        </div>
      </div>
      <div className="flex items-end gap-3 sm:gap-5 h-44 mt-6">
        {pts.map((s, i) => {
          const m = s.values[mKey] ?? 0;
          return (
            <div key={s.period} className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="flex-1 w-full flex items-end justify-center gap-1">
                <motion.div className="w-4 rounded-t-md bg-primary/20" initial={{ height: 0 }} whileInView={{ height: `${Math.max(((s.values.ca ?? 0) / max) * 100, 2)}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.05 }} title={`CA : ${money(s.values.ca ?? 0)}`} />
                <motion.div className={`w-4 rounded-t-md ${m >= 0 ? 'bg-primary' : 'bg-[hsl(var(--bad))]'}`} initial={{ height: 0 }} whileInView={{ height: `${Math.max((Math.abs(m) / max) * 100, 2)}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }} title={`${mLabel} : ${money(m)}`} />
              </div>
              <span className="text-[11px] text-muted-foreground capitalize font-mono">{shortMonth(s.period)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Un seul mois publié : ce qu'il reste à chaque étape, du CA à la marge après pub.
function MonthCascade({ dataJson, currency, period }: { dataJson: any; currency: string; period: string }) {
  const steps = [
    { id: 'ca', label: "Chiffre d'affaires net", hint: 'ce que tu encaisses, hors taxes, remises et retours' },
    { id: 'cm1', label: 'Après coût des produits', hint: 'CM1' },
    { id: 'cm2', label: 'Après logistique & paiement', hint: 'CM2' },
    { id: 'cm3', label: 'Après pub', hint: 'CM3 — ce que le shop gagne vraiment' },
  ].map((s) => ({ ...s, v: metricById(dataJson, s.id) })).filter((s) => s.v != null) as { id: string; label: string; hint: string; v: number }[];
  if (steps.length < 2) return null;
  const max = Math.max(...steps.map((s) => Math.abs(s.v)), 1);
  const money = moneyFmt(currency);
  return (
    <section className="surface p-5 sm:p-6">
      <span className="eyebrow">La cascade · {periodLabel(period).toLowerCase()}</span>
      <h2 className="font-semibold mt-1">Du chiffre d'affaires à ce qu'il te reste</h2>
      <div className="mt-5 space-y-4">
        {steps.map((b, i) => {
          const last = i === steps.length - 1;
          return (
            <div key={b.id}>
              <div className="flex justify-between items-baseline gap-3 text-sm mb-1.5">
                <span className="min-w-0"><span className={last ? 'font-semibold' : ''}>{b.label}</span> <span className="text-xs text-muted-foreground hidden sm:inline">· {b.hint}</span></span>
                <span className={`num shrink-0 ${last ? 'font-semibold' : 'font-medium'}`}>{money(b.v)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <GrowBar pct={(Math.abs(b.v) / max) * 100} delay={i * 0.08} className={`h-full rounded-full ${b.v < 0 ? 'bg-[hsl(var(--bad))]' : last ? 'bg-[hsl(var(--accent))]' : 'bg-primary'}`} />
              </div>
            </div>
          );
        })}
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
      <div className={`flex-1 overflow-y-auto space-y-3 mb-3 ${compact ? 'max-h-52' : 'min-h-[260px] max-h-[55vh]'}`}>
        {chat.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => onSend(s)}
                className="group text-[13px] rounded-full border bg-background px-3.5 py-2 hover:border-primary/40 hover:bg-card hover:shadow-[var(--shadow-card)] transition text-left inline-flex items-center gap-1.5">
                {s} <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        ) : chat.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>{m.content}</div>
          </motion.div>
        ))}
        {busy && (
          <div className="flex gap-1 px-2 py-2" aria-label="Réponse en cours">
            {[0, 1, 2].map((d) => <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />)}
          </div>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSend(input); }} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pose ta question sur tes chiffres…"
          className="flex-1 min-w-0 h-11 rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition" />
        <Button type="submit" disabled={busy || !input.trim()} className="h-11 w-11 p-0 rounded-xl" aria-label="Envoyer"><Send className="w-4 h-4" /></Button>
      </form>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="v2 min-h-screen">
      <div className="h-16 border-b" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-4">
        <Shimmer className="h-56 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Shimmer className="h-36" /><Shimmer className="h-36" /><Shimmer className="h-36" /></div>
        <Shimmer className="h-64" />
      </div>
    </div>
  );
}

export default function ClientSpace() {
  const { id } = useParams<{ id: string }>();
  const { user, roles } = useAuth();
  const isStaff = (roles ?? []).some((r: { role: string }) => STAFF_ROLES.includes(r.role));
  const navigate = useNavigate();
  const [legacyRedirecting, setLegacyRedirecting] = useState(false);

  const [tab, setTab] = useState<TabKey>('accueil');
  const [client, setClient] = useState<any>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]); // mois publiés, du plus récent au plus ancien
  const [periodsLoaded, setPeriodsLoaded] = useState(false);
  const [docPeriod, setDocPeriod] = useState(shiftPeriod(currentPeriod(), -1));
  const [dash, setDash] = useState<any>(null);
  const [dashLoaded, setDashLoaded] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [hasDaily, setHasDaily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNew, setHasNew] = useState(false);
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
      setDocPeriod(shiftPeriod(periods[0], 1));
      let seen: string | null = null;
      try { seen = localStorage.getItem(`daftime_lastseen_${id}`); } catch { /* stockage indisponible */ }
      setHasNew(seen !== periods[0]);
    }
  }, [id]);

  const loadDashboard = useCallback(async () => {
    const { data } = await supabase.from('dashboards' as any).select('*')
      .eq('client_id', id).eq('period', period).eq('status', 'publie').eq('is_current', true).maybeSingle();
    setDash(data); setDashLoaded(true);
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

  const loadFlowMap = useCallback(async () => {
    const { data } = await supabase.from('client_flow_maps' as any).select('data').eq('client_id', id).eq('status', 'published').maybeSingle();
    setFlowMap(((data as { data?: FlowMap } | null)?.data) ?? null);
  }, [id]);

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

  useEffect(() => {
    const latest = availablePeriods[0];
    if (tab === 'dashboard' && latest && period === latest) {
      try { localStorage.setItem(`daftime_lastseen_${id}`, latest); } catch { /* stockage indisponible */ }
      setHasNew(false);
    }
  }, [tab, period, availablePeriods, id]);

  const upload = async (fileList: FileList) => {
    setBusy(true); setError(null); setSent(false);
    try {
      for (const f of Array.from(fileList)) {
        const path = `${id}/${docPeriod}/${f.name}`;
        const up = await supabase.storage.from(BUCKET).upload(path, f, { upsert: true, contentType: f.type || undefined });
        if (up.error) throw up.error;
        await supabase.from('files' as any).insert({ client_id: id, period: docPeriod, original_name: f.name, storage_path: path, status: 'uploaded', uploaded_by: user?.id ?? null });
        await logActivity(id!, 'file_uploaded', { entity_type: 'file', metadata: { name: f.name, period: docPeriod } });
      }
      await Promise.all([loadFiles(), loadActivity()]);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const dj = dash?.data_json;
  const isEcom = metricById(dj, 'cm3') != null || series.some((s) => s.values.cm3 != null);

  // Indicateurs (marge d'abord) ; le 1er devient le chiffre du bandeau. Repli CA / résultat hors e-commerce.
  const kpis = useMemo<Kpi[]>(() => {
    if (!dj || !client) return [];
    const money = moneyFmt(client.currency ?? 'EUR');
    const idx = series.findIndex((s) => s.period === period);
    const prev = idx > 0 ? series[idx - 1].values : null;
    const delta = (key: string, v: number | null) => { const p = prev?.[key]; return v != null && p != null && p !== 0 ? ((v - p) / Math.abs(p)) * 100 : null; };
    const g = (k: string) => metricById(dj, k);
    const out: Kpi[] = [];
    const cm3 = g('cm3'), cm3r = g('cm3_rate'), mer = g('mer'), be = g('breakeven_roas'), cpo = g('cm3_per_order'), aov = g('aov'), cash = g('cash_end');
    if (cm3 != null) out.push({ key: 'cm3', label: 'Marge après pub', raw: cm3, fmt: money, sub: cm3r != null ? `${num1(cm3r)} % de ton chiffre d'affaires` : undefined, delta: delta('cm3', cm3) });
    if (mer != null) out.push({ key: 'mer', label: 'CA pour 1 € de pub', raw: mer, fmt: (v) => `${num1(v)} €`, sub: be != null ? `point mort à ${num1(be)} €` : undefined,
      status: be != null ? (mer >= be ? { ok: true, text: 'au-dessus du point mort' } : { ok: false, text: 'sous le point mort' }) : undefined });
    if (cpo != null) out.push({ key: 'cpo', label: 'Gagné par commande', raw: cpo, fmt: money, sub: aov != null ? `après pub · panier moyen ${money(aov)}` : 'après pub' });
    if (cash != null) {
      const low = dj?.cash_forecast?.low as { date: string; balance: number } | undefined;
      out.push({ key: 'cash', label: 'Trésorerie', raw: cash, fmt: money, sub: low ? `point bas prévu ${money(low.balance)} le ${ddmm(low.date)}` : 'fin de mois',
        status: low ? (low.balance < 0 ? { ok: false, text: 'passe sous zéro' } : low.balance < cash * 0.5 ? { ok: false, text: 'à surveiller' } : { ok: true, text: 'tient sur 3 mois' }) : undefined });
    }
    if (out.length < 2) {
      const ca = g('ca'), ebk = g('ebitda') != null ? 'ebitda' : 'resultat_net', eb = g(ebk);
      if (ca != null) out.unshift({ key: 'ca', label: "Chiffre d'affaires", raw: ca, fmt: money, delta: delta('ca', ca) });
      if (eb != null) out.push({ key: ebk, label: ebk === 'ebitda' ? "Résultat d'exploitation" : 'Résultat net', raw: eb, fmt: money, delta: delta(ebk, eb) });
    }
    return out.slice(0, 4);
  }, [dj, client, series, period]);

  if (!client) return legacyRedirecting ? <div className="p-8 text-muted-foreground">Ouverture de ton espace…</div> : <PageSkeleton />;

  const advisor = (client as any)?.advisor as { name: string; email?: string; whatsapp?: string; photo_url?: string; booking_url?: string } | null | undefined;
  const advisorName = advisor?.name ?? ADVISOR.name;
  const advisorInitials = advisorName.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const points = ((dj?.points ?? []) as { tone?: string; text: string }[]).filter((p) => p?.text).slice(0, 3);
  const suggestions = isEcom ? SUGGESTIONS_ECOM : SUGGESTIONS_GENERIC;
  const noReportYet = periodsLoaded && availablePeriods.length === 0;
  const hero = kpis[0], rest = kpis.slice(1);
  const money = moneyFmt(client.currency ?? 'EUR');

  const visibleNav = NAV.filter((n) => (n.key === 'flux' ? !!flowMap : n.key === 'quotidien' ? hasDaily : n.key === 'activity' ? activity.length > 0 : true))
    .map((n) => ({ ...n, badge: n.key === 'dashboard' && hasNew }));
  const go = (k: string) => { setTab(k as TabKey); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* */ } };

  // Navigation entre les MOIS PUBLIÉS uniquement.
  const pIdx = availablePeriods.indexOf(period);
  const older = pIdx >= 0 && pIdx < availablePeriods.length - 1 ? availablePeriods[pIdx + 1] : null;
  const newer = pIdx > 0 ? availablePeriods[pIdx - 1] : null;
  const MonthSwitch = ({ dark = false }: { dark?: boolean }) => availablePeriods.length > 0 ? (
    <div className={`inline-flex items-center rounded-full p-1 ${dark ? 'bg-white/10 ring-1 ring-white/15' : 'bg-card border shadow-[var(--shadow-card)]'}`}>
      <button onClick={() => older && setPeriod(older)} disabled={!older} aria-label="Mois précédent" className={`h-8 w-8 grid place-items-center rounded-full transition disabled:opacity-30 ${dark ? 'hover:bg-white/15' : 'hover:bg-muted'}`}><ChevronLeft className="w-4 h-4" /></button>
      <div className="relative">
        <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Mois"
          className={`appearance-none bg-transparent px-3 h-8 text-sm font-medium capitalize cursor-pointer focus:outline-none ${dark ? 'text-white [&>option]:text-foreground' : ''}`}>
          {availablePeriods.map((p) => <option key={p} value={p}>{periodLabel(p)}</option>)}
        </select>
      </div>
      <button onClick={() => newer && setPeriod(newer)} disabled={!newer} aria-label="Mois suivant" className={`h-8 w-8 grid place-items-center rounded-full transition disabled:opacity-30 ${dark ? 'hover:bg-white/15' : 'hover:bg-muted'}`}><ChevronRight className="w-4 h-4" /></button>
    </div>
  ) : null;

  const AdvisorCard = (
    <div className="surface p-4">
      <div className="flex items-center gap-3">
        {advisor?.photo_url
          ? <img src={advisor.photo_url} alt={advisorName} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-accent/40" />
          : <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 font-semibold text-sm ring-2 ring-accent/40">{advisorInitials}</div>}
        <div className="min-w-0">
          <div className="eyebrow">Ton conseiller</div>
          <div className="font-medium text-sm leading-tight truncate mt-0.5">{advisorName}</div>
        </div>
      </div>
      {advisor?.email && (
        <a href={`mailto:${advisor.email}`} className="mt-3 text-xs flex items-center gap-2 text-muted-foreground hover:text-foreground transition truncate"><Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{advisor.email}</span></a>
      )}
      {advisor?.whatsapp && (
        <a href={`https://wa.me/${advisor.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${advisorName}, ici ${client.name} (espace Daftime).`)}`}
          target="_blank" rel="noopener noreferrer" className="w-full mt-3 inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-medium transition">
          <Phone className="w-4 h-4" /> Écrire sur WhatsApp
        </a>
      )}
      <BookingButton label="Prendre rendez-vous" size="sm" variant="outline" className="w-full mt-2" url={advisor?.booking_url ?? undefined} />
    </div>
  );

  const EmptyFirstReport = (
    <Stagger className="space-y-4">
      <Item>
        <section className="brand-panel p-7 sm:p-10">
          <div className="relative z-[1] max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15"><Clock className="w-3.5 h-3.5" /> Ton premier rapport est en préparation</span>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-4 text-balance">Bienvenue, {client.name}.</h1>
            <p className="text-white/70 mt-3 text-[15px] leading-relaxed">Chaque mois, tu verras ici ce que ton shop gagne vraiment, si ta pub est rentable et comment évolue ta trésorerie.</p>
          </div>
        </section>
      </Item>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { t: 'On récupère tes données', d: "Shopify, banque, compta : on s'en occupe, tu n'as rien à faire." },
          { t: 'On analyse', d: `${advisorName} vérifie tout et construit ton rapport.` },
          { t: 'Tu reçois ton rapport', d: 'Les 3 points du mois, tes marges, ta trésorerie.' },
        ].map((s, i) => (
          <Item key={i}>
            <div className="surface p-5 h-full">
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              <div className="font-semibold mt-2">{s.t}</div>
              <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
            </div>
          </Item>
        ))}
      </div>
    </Stagger>
  );

  const dot = (t?: string) => (t === 'good' ? 'bg-emerald-400' : t === 'warn' ? 'bg-amber-400' : 'bg-sky-300');
  const docPeriods = [...new Set([shiftPeriod(currentPeriod(), 0), shiftPeriod(currentPeriod(), -1), shiftPeriod(currentPeriod(), -2), shiftPeriod(currentPeriod(), -3), docPeriod, ...availablePeriods])]
    .sort((a, b) => (a < b ? 1 : -1));

  return (
    <AppShell title={client.name} nav={visibleNav} active={tab} onNav={go} aside={AdvisorCard}>
      {isStaff && (
        <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
          <ChevronLeft className="w-4 h-4" /> Retour (vue équipe)
        </button>
      )}
      {error && <div className="mb-4 border border-destructive/40 bg-destructive/5 text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

      <PageFade id={tab}>
        {tab === 'accueil' && (noReportYet ? EmptyFirstReport : !dashLoaded ? (
          <div className="space-y-4"><Shimmer className="h-64 rounded-2xl" /><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Shimmer className="h-36" /><Shimmer className="h-36" /><Shimmer className="h-36" /></div></div>
        ) : (
          <Stagger className="space-y-5">
            {/* Bandeau du mois */}
            <Item>
              <section className="brand-panel p-6 sm:p-8">
                <div className="relative z-[1] grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-end">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <MonthSwitch dark />
                      {hasNew && availablePeriods[0] === period && (
                        <button onClick={() => go('dashboard')} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:brightness-105 transition">
                          <Sparkles className="w-3.5 h-3.5" /> Nouveau rapport
                        </button>
                      )}
                    </div>
                    {hero ? (
                      <div className="mt-8">
                        <div className="text-white/60 text-sm">{hero.key === 'cm3' ? 'Ce que ton shop a vraiment gagné' : hero.label}</div>
                        <CountUp value={hero.raw} format={hero.fmt} duration={1.4} className="num block text-[44px] sm:text-6xl font-semibold tracking-tight mt-1 leading-none" />
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
                          <span>{hero.key === 'cm3' ? 'de marge après pub' : ''}{hero.sub ? `${hero.key === 'cm3' ? ' · ' : ''}${hero.sub}` : ''}</span>
                          {hero.delta != null && <span className={`font-medium ${hero.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{hero.delta >= 0 ? '▲' : '▼'} {num1(Math.abs(hero.delta))} % vs mois précédent</span>}
                        </div>
                      </div>
                    ) : <h1 className="mt-8 text-3xl font-semibold">{client.name}</h1>}
                  </div>
                  {points.length > 0 && (
                    <div className="rounded-xl bg-white/[0.06] ring-1 ring-white/10 p-4 sm:p-5 backdrop-blur-sm">
                      <div className="text-[10.5px] tracking-[0.12em] uppercase text-white/50 font-mono">Les 3 points du mois</div>
                      <ol className="mt-3 space-y-3">
                        {points.map((p, i) => (
                          <li key={i} className="flex gap-3 text-[14.5px] leading-snug text-white/90">
                            <span className="mt-[3px] relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold font-mono">{i + 1}
                              <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[hsl(238_58%_16%)] ${dot(p.tone)}`} /></span>
                            <span>{p.text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </section>
            </Item>

            {rest.length > 0 && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${rest.length >= 3 ? 'lg:grid-cols-3' : ''} gap-4`}>
                {rest.map((k) => <Item key={k.key}><KpiCard k={k} /></Item>)}
              </div>
            )}

            <Item>
              {series.filter((s) => s.values.ca != null).length >= 2
                ? <MonthlyTrend series={series} currency={client.currency} />
                : <MonthCascade dataJson={dj} currency={client.currency} period={period} />}
            </Item>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <Reveal className="lg:col-span-3">
                <section className="surface p-5 sm:p-6 h-full flex flex-col">
                  <span className="eyebrow">Assistant</span>
                  <h2 className="font-semibold mt-1">Une question sur tes chiffres ?</h2>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Réponses factuelles, tirées de tes données. Pour un conseil, écris à {advisorName}.</p>
                  <ChatPanel chat={chat} input={chatInput} setInput={setChatInput} busy={chatBusy} onSend={sendQuestion} suggestions={suggestions} compact />
                </section>
              </Reveal>
              <Reveal className="lg:col-span-2 space-y-4" delay={0.08}>
                <button onClick={() => go('dashboard')} disabled={!dash} className="surface surface-hover w-full text-left p-5 group disabled:opacity-60">
                  <div className="flex items-center justify-between"><span className="eyebrow">Rapport complet</span><ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" /></div>
                  <div className="font-semibold mt-2">Le détail de {periodLabel(period).toLowerCase()}</div>
                  <p className="text-sm text-muted-foreground mt-1">Marges, pub, produits, retours, trésorerie à 13 semaines.</p>
                </button>
                {flowMap && (
                  <button onClick={() => go('flux')} className="surface surface-hover w-full text-left p-5 group">
                    <div className="flex items-center justify-between"><span className="eyebrow">Mes flux</span><ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" /></div>
                    <div className="font-semibold mt-2">La carte de ton argent</div>
                    <p className="text-sm text-muted-foreground mt-1">Qui te paye, qui tu payes, et depuis quel compte.</p>
                  </button>
                )}
              </Reveal>
            </div>
          </Stagger>
        ))}

        {tab === 'quotidien' && (
          <ErrorBoundary label="quotidien">
            <div className="space-y-4">
              <KpiPins clientId={id!} currency={client.currency} />
              <DailyView clientId={id!} currency={client.currency} />
            </div>
          </ErrorBoundary>
        )}

        {tab === 'dashboard' && (noReportYet ? EmptyFirstReport : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><span className="eyebrow">Rapport mensuel</span><h1 className="text-xl font-semibold capitalize mt-0.5">{periodLabel(period)}</h1></div>
              <MonthSwitch />
            </div>
            {dash ? <div className="surface overflow-hidden p-1 sm:p-2"><DashboardFrame html={dash.html ?? ''} /></div> : <Shimmer className="h-[70vh]" />}
          </div>
        ))}

        {tab === 'flux' && flowMap && (
          <div className="space-y-4">
            <div><span className="eyebrow">Cartographie</span><h1 className="text-xl font-semibold mt-0.5">La carte de tes flux</h1>
              <p className="text-sm text-muted-foreground mt-1">Qui est qui, où est ton argent, d'où il vient et où il part — préparée avec {advisorName}.</p></div>
            <FlowMapView map={flowMap} currency={client?.currency} />
          </div>
        )}

        {tab === 'documents' && (
          <section className="surface p-6 sm:p-8 max-w-3xl">
            <span className="eyebrow">Envoyer un document</span>
            <h1 className="text-xl font-semibold mt-1">Tu n'as rien à déposer</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">On récupère nous-mêmes tes données (Shopify, banque, compta…). Ce dépôt sert seulement si tu veux transmettre un document précis à {advisorName} : contrat, facture, devis…</p>
            <div className="flex flex-wrap items-center gap-2 mt-6 mb-3 text-sm">
              <span className="text-muted-foreground">Il concerne</span>
              <select value={docPeriod} onChange={(e) => setDocPeriod(e.target.value)} aria-label="Mois du document" className="h-9 rounded-lg border bg-background px-3 text-sm font-medium capitalize">
                {docPeriods.map((p) => <option key={p} value={p}>{periodLabel(p)}</option>)}
              </select>
            </div>
            <label className="block">
              <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.currentTarget.value = ''; }} />
              <span className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-12 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition">
                <UploadCloud className="w-7 h-7 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{busy ? 'Envoi…' : 'Clique pour choisir tes fichiers'}</span>
              </span>
            </label>
            {sent && <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-sm text-[hsl(var(--good))] inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Envoyé à {advisorName}.</motion.div>}
            {files.length > 0 && (
              <div className="mt-6">
                <div className="eyebrow mb-2">Déjà envoyés · {periodLabel(docPeriod).toLowerCase()}</div>
                <ul className="divide-y rounded-lg border">
                  {files.map((f) => <li key={f.id} className="text-sm flex items-center gap-2 px-3 py-2"><FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> <span className="truncate">{f.original_name}</span></li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        {tab === 'assistant' && (
          <section className="surface p-6 sm:p-8 flex flex-col max-w-3xl">
            <span className="eyebrow">Assistant</span>
            <h1 className="text-xl font-semibold mt-1">Pose une question à tes chiffres</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Réponses factuelles sur tes données (un poste, un indicateur, une évolution). Pour une analyse ou un conseil, écris à {advisorName}.</p>
            <ChatPanel chat={chat} input={chatInput} setInput={setChatInput} busy={chatBusy} onSend={sendQuestion} suggestions={suggestions} />
          </section>
        )}

        {tab === 'activity' && (
          <section className="surface p-6 sm:p-8 max-w-3xl">
            <span className="eyebrow">Historique</span>
            <h1 className="text-xl font-semibold mt-1 mb-5">Ton activité</h1>
            <ol className="relative border-l pl-5 space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-background" />
                  <div>{labelActivity(a)}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{new Date(a.created_at).toLocaleString('fr-FR')}</div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Conseiller en bas sur mobile */}
        <div className="lg:hidden mt-6">{AdvisorCard}</div>
      </PageFade>
    </AppShell>
  );
}
