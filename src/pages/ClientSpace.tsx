// Espace client : layout sidebar (menu à gauche), bandeau de bienvenue + conseiller,
// statut du mois, plein écran & export PDF. RLS = isolation + "publié uniquement".
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { BookingButton } from '@/components/booking/BookingButton';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, UploadCloud, Activity, FileText,
  Headset, CheckCircle2, Clock, LayoutDashboard, FolderOpen, X, MessageCircle, Send,
  FileBarChart2, ArrowRight, TrendingUp, Mail, Phone,
} from 'lucide-react';
import { DashboardFrame } from '@/components/generic/DashboardFrame';
import { currentPeriod, shiftPeriod, periodLabel, logActivity } from '@/lib/genericApi';
import { legacyDashboardRoute } from '@/lib/staff';
import { ADVISOR, DEFAULT_DOCS } from '@/lib/config';

const BUCKET = 'client-files';

const NAV = [
  { key: 'accueil', label: 'Accueil', icon: LayoutDashboard },
  { key: 'dashboard', label: 'Rapport complet', icon: FileBarChart2 },
  { key: 'documents', label: 'Mes documents', icon: FolderOpen },
  { key: 'assistant', label: 'Poser une question', icon: MessageCircle },
  { key: 'activity', label: 'Activité', icon: Activity },
] as const;

const SUGGESTIONS = [
  "Quel est mon chiffre d'affaires ce mois-ci ?",
  "Quel est mon résultat net ?",
  "Quel est mon poste de charge le plus élevé ?",
];

function labelActivity(a: any): string {
  if (a.action === 'file_uploaded') return `Document déposé : ${a.metadata?.name ?? ''}`;
  if (a.action === 'dashboard_published') return 'Nouveau dashboard publié';
  return a.action;
}

// KPIs extraits du data_json du dashboard, par mots-clés sur les libellés (1er match retenu).
// Ordre de priorité dans keywords : on tente EBITDA, sinon le résultat d'exploitation.
const KPIS = [
  { key: 'ca', label: "Chiffre d'affaires", keywords: ['chiffre d', 'chiffre affaires', 'ca total', 'revenue', 'sales'] },
  { key: 'ebitda', label: "Résultat d'exploitation", keywords: ['ebitda', 'resultat d exploitation', 'operating profit', 'resultat operationnel'] },
  { key: 'net', label: 'Résultat net', keywords: ['resultat net', 'net profit', 'net income', 'net result'] },
] as const;

const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, ' ').replace(/\s+/g, ' ');

// Ramasse récursivement tout couple { label, value:number } (pnl[], sections[].rows[], etc.).
function collectFigures(node: any, out: { label: string; value: number }[]): void {
  if (Array.isArray(node)) { for (const x of node) collectFigures(x, out); return; }
  if (node && typeof node === 'object') {
    if (typeof node.label === 'string' && typeof node.value === 'number') out.push({ label: node.label, value: node.value });
    for (const k of Object.keys(node)) collectFigures(node[k], out);
  }
}

function findMetric(dataJson: any, keywords: readonly string[]): number | null {
  const rows: { label: string; value: number }[] = [];
  collectFigures(dataJson, rows);
  for (const r of rows) if (keywords.some((k) => norm(r.label).includes(k))) return r.value;
  return null;
}

function fmtMoney(v: number, currency = 'EUR') {
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v); }
  catch { return `${Math.round(v).toLocaleString('fr-FR')} ${currency}`; }
}

function Sparkline({ values }: { values: (number | null)[] }) {
  const nums = values.map((v) => v ?? 0);
  if (nums.length < 2) return null;
  const max = Math.max(...nums), min = Math.min(...nums), range = max - min || 1;
  const pts = nums.map((v, i) => `${(i / (nums.length - 1)) * 100},${28 - ((v - min) / range) * 26}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-7 mt-2">
      <polyline points={pts} fill="none" className="stroke-accent" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function shortMonth(period: string): string {
  try { return new Date(period).toLocaleDateString('fr-FR', { month: 'short' }); } catch { return period; }
}

// Évolution mensuelle CA / résultat net (barres). Ne s'affiche qu'à partir de 2 mois.
function MonthlyTrend({ series, currency }: {
  series: Array<{ period: string; values: Record<string, number | null> }>;
  currency: string;
}) {
  const pts = series.filter((s) => s.values.ca != null);
  if (pts.length < 2) return null;
  const max = Math.max(...pts.flatMap((s) => [s.values.ca ?? 0, s.values.net ?? 0]), 1);
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
        <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> Évolution mensuelle</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> CA</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-accent" /> Résultat net</span>
        </div>
      </div>
      <div className="flex items-end gap-4 h-40 mt-4">
        {pts.map((s) => (
          <div key={s.period} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="flex-1 w-full flex items-end justify-center gap-1.5">
              <div className="w-3.5 rounded-t bg-primary" style={{ height: `${Math.max(((s.values.ca ?? 0) / max) * 100, 2)}%` }}
                title={`CA : ${fmtMoney(s.values.ca ?? 0, currency)}`} />
              <div className="w-3.5 rounded-t bg-accent" style={{ height: `${Math.max(((s.values.net ?? 0) / max) * 100, 2)}%` }}
                title={`Résultat net : ${fmtMoney(s.values.net ?? 0, currency)}`} />
            </div>
            <span className="text-[11px] text-muted-foreground capitalize">{shortMonth(s.period)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ramasse les lignes "total" du P&L (type:'total'), récursivement.
function collectTotals(node: any, out: { label: string; value: number }[]): void {
  if (Array.isArray(node)) { for (const x of node) collectTotals(x, out); return; }
  if (node && typeof node === 'object') {
    if (node.type === 'total' && typeof node.label === 'string' && typeof node.value === 'number') {
      out.push({ label: node.label, value: node.value });
    }
    for (const k of Object.keys(node)) collectTotals(node[k], out);
  }
}

// Structure du mois (1er rapport) : grands postes du P&L en barres horizontales.
function MonthStructure({ dataJson, currency, period }: { dataJson: any; currency: string; period: string }) {
  let bars: { label: string; value: number }[] = [];
  collectTotals(dataJson, bars);
  if (bars.length === 0) {
    bars = [
      { label: "Chiffre d'affaires", v: findMetric(dataJson, ['chiffre d', 'chiffre affaires', 'revenue', 'sales']) },
      { label: "Résultat d'exploitation", v: findMetric(dataJson, ['ebitda', 'resultat d exploitation', 'operating profit']) },
      { label: 'Résultat net', v: findMetric(dataJson, ['resultat net', 'net profit', 'net income']) },
    ].filter((b) => b.v != null).map((b) => ({ label: b.label, value: b.v as number }));
  }
  if (bars.length === 0) return null;
  const max = Math.max(...bars.map((b) => Math.abs(b.value)), 1);
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> Structure du mois</h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-4">Les grands postes de <span className="capitalize">{periodLabel(period)}</span></p>
      <div className="space-y-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between items-baseline text-sm mb-1 gap-2">
              <span className="truncate">{b.label}</span>
              <span className="tabular-nums font-medium shrink-0">{fmtMoney(b.value, currency)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${b.value >= 0 ? 'bg-primary' : 'bg-red-400'}`}
                style={{ width: `${Math.max((Math.abs(b.value) / max) * 100, 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Panneau de chat "questions à vos chiffres", réutilisé en version compacte (accueil) et complète.
function ChatPanel({ chat, input, setInput, busy, onSend, compact = false }: {
  chat: Array<{ role: 'user' | 'assistant'; content: string }>;
  input: string;
  setInput: (v: string) => void;
  busy: boolean;
  onSend: (q: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col flex-1">
      <div className={`flex-1 overflow-y-auto space-y-3 mb-3 ${compact ? 'max-h-44 min-h-[120px]' : 'min-h-[240px] max-h-[50vh]'}`}>
        {chat.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Exemples de questions :</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => onSend(s)}
                  className="text-xs rounded-full border px-3 py-1.5 hover:bg-muted hover:border-primary/40 transition text-left">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : chat.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-muted-foreground">L'assistant consulte vos chiffres…</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSend(input); }} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ex. Quel est mon EBITDA ce mois-ci ?"
          className="flex-1 h-11 rounded-lg border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <Button type="submit" disabled={busy || !input.trim()} className="h-11 px-4" aria-label="Envoyer">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

export default function ClientSpace() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  // Client legacy : son dashboard vient de la génération legacy (composant TSX + tables legacy),
  // pas de la table `dashboards`. On le redirige donc vers sa route legacy dédiée.
  const [legacyRedirecting, setLegacyRedirecting] = useState(false);

  const [tab, setTab] = useState<(typeof NAV)[number]['key']>('accueil');
  // Bandeau de bienvenue : affiché une fois par session de connexion (refermable).
  const bannerKey = `daftime_welcome_${id}`;
  const [showBanner, setShowBanner] = useState(() => {
    try { return !sessionStorage.getItem(bannerKey); } catch { return true; }
  });
  const [client, setClient] = useState<any>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [dash, setDash] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNew, setHasNew] = useState(false); // nouveau rapport publié non encore vu
  const [series, setSeries] = useState<Array<{ period: string; values: Record<string, number | null> }>>([]);
  // Assistant "questions à vos chiffres"
  const [chat, setChat] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  const sendQuestion = async (q: string) => {
    const question = q.trim();
    if (!question || chatBusy) return;
    const history = chat.map((m) => ({ role: m.role, content: m.content }));
    setChat((c) => [...c, { role: 'user', content: question }]);
    setChatInput('');
    setChatBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('client-chat', { body: { client_id: id, question, history } });
      const answer = error
        ? "Désolé, une erreur est survenue. Réessayez ou contactez votre conseiller Daftime."
        : (data?.answer ?? '—');
      setChat((c) => [...c, { role: 'assistant', content: answer }]);
    } catch {
      setChat((c) => [...c, { role: 'assistant', content: 'Désolé, une erreur est survenue.' }]);
    } finally {
      setChatBusy(false);
    }
  };

  const loadClient = useCallback(async () => {
    const { data } = await supabase.from('clients' as any)
      .select('id, name, currency, logo_url, legacy_company_id, activity_types:activity_type_id(slug, config), advisor:advisor_id(name, email, whatsapp, photo_url, booking_url)')
      .eq('id', id).maybeSingle();
    // Client legacy → redirection vers son dashboard legacy (généré via l'app legacy), même route que le staff.
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
    const periods = [...new Set(((data as any[]) ?? []).map((d) => d.period))];
    setAvailablePeriods(periods);
    if (periods.length) setPeriod((p) => (periods.includes(p) ? p : periods[0]));
    const latest = periods[0];
    if (latest) {
      let seen: string | null = null;
      try { seen = localStorage.getItem(`daftime_lastseen_${id}`); } catch { /* ignore */ }
      setHasNew(seen !== latest);
    }
  }, [id]);

  const loadDashboard = useCallback(async () => {
    const { data } = await supabase.from('dashboards' as any).select('*')
      .eq('client_id', id).eq('period', period).eq('status', 'publie').eq('is_current', true).maybeSingle();
    setDash(data);
  }, [id, period]);

  const loadFiles = useCallback(async () => {
    const { data } = await supabase.from('files' as any).select('*')
      .eq('client_id', id).eq('period', period).order('created_at', { ascending: false });
    setFiles((data as any[]) ?? []);
  }, [id, period]);

  const loadActivity = useCallback(async () => {
    const { data } = await supabase.from('activity_log' as any).select('*')
      .eq('client_id', id).order('created_at', { ascending: false }).limit(20);
    setActivity((data as any[]) ?? []);
  }, [id]);

  const loadTrend = useCallback(async () => {
    const { data } = await supabase.from('dashboards' as any).select('period, data_json')
      .eq('client_id', id).eq('status', 'publie').eq('is_current', true).order('period', { ascending: true });
    setSeries(((data as any[]) ?? []).map((d) => ({
      period: d.period,
      values: Object.fromEntries(KPIS.map((k) => [k.key, findMetric(d.data_json, k.keywords)])),
    })));
  }, [id]);

  useEffect(() => { loadClient(); loadAvailable(); loadActivity(); loadTrend(); }, [loadClient, loadAvailable, loadActivity, loadTrend]);
  useEffect(() => { loadDashboard(); loadFiles(); }, [loadDashboard, loadFiles]);

  // Marque le dernier rapport comme vu quand le client le consulte.
  useEffect(() => {
    const latest = availablePeriods[0];
    if (tab === 'dashboard' && latest && period === latest) {
      try { localStorage.setItem(`daftime_lastseen_${id}`, latest); } catch { /* ignore */ }
      setHasNew(false);
    }
  }, [tab, period, availablePeriods, id]);

  const upload = async (fileList: FileList) => {
    setBusy(true); setError(null);
    try {
      for (const f of Array.from(fileList)) {
        const path = `${id}/${period}/${f.name}`;
        const up = await supabase.storage.from(BUCKET).upload(path, f, { upsert: true, contentType: f.type || undefined });
        if (up.error) throw up.error;
        await supabase.from('files' as any).insert({
          client_id: id, period, original_name: f.name, storage_path: path, status: 'uploaded', uploaded_by: user?.id ?? null,
        });
        await logActivity(id!, 'file_uploaded', { entity_type: 'file', metadata: { name: f.name, period } });
      }
      await Promise.all([loadFiles(), loadActivity()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const dismissBanner = () => {
    try { sessionStorage.setItem(bannerKey, '1'); } catch { /* ignore */ }
    setShowBanner(false);
  };

  if (!client) return <div className="p-8 text-muted-foreground">{legacyRedirecting ? 'Ouverture de votre dashboard…' : 'Chargement…'}</div>;

  const cfgDocs = (client as any)?.activity_types?.config?.documents as string[] | undefined;
  const requiredDocs = (Array.isArray(cfgDocs) && cfgDocs.length) ? cfgDocs : DEFAULT_DOCS;

  const advisor = (client as any)?.advisor as
    | { name: string; email?: string; whatsapp?: string; photo_url?: string; booking_url?: string }
    | null | undefined;
  const advisorInitials = (advisor?.name ?? ADVISOR.name)
    .split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const curEntry = series.find((s) => s.period === period);
  const prevIdx = series.findIndex((s) => s.period === period) - 1;
  const prevEntry = prevIdx >= 0 ? series[prevIdx] : undefined;
  const hasKpis = !!curEntry && KPIS.some((k) => curEntry.values[k.key] != null);
  const kpiBlock = hasKpis ? (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {KPIS.map((k) => {
        const cur = curEntry?.values[k.key] ?? null;
        const prev = prevEntry?.values[k.key] ?? null;
        const delta = cur != null && prev != null && prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : null;
        return (
          <div key={k.key} className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-2xl font-semibold tabular-nums mt-1">{cur != null ? fmtMoney(cur, client.currency) : 'n/d'}</div>
            {delta != null && (
              <div className={`text-xs mt-1 ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs mois préc.
              </div>
            )}
            {k.key === 'ca' && <Sparkline values={series.map((s) => s.values.ca)} />}
          </div>
        );
      })}
    </div>
  ) : null;

  // Synthèse du mois (bandeau + ratios) à partir du dashboard courant.
  const dj = dash?.data_json;
  const sCA = findMetric(dj, ['chiffre d', 'chiffre affaires', 'ca total', 'revenue', 'sales']);
  const sNet = findMetric(dj, ['resultat net', 'net profit', 'net income']);
  const sBrute = findMetric(dj, ['marge brute', 'gross margin', 'gross profit']);
  const sCharges = findMetric(dj, ['charges d exploitation', 'operating expenses']);
  const pct = (num: number | null, den: number | null) =>
    num != null && den != null && den !== 0 ? `${((num / den) * 100).toFixed(1)} %` : null;
  const ratios = [
    { label: 'Marge nette', value: pct(sNet, sCA) },
    { label: 'Marge brute', value: pct(sBrute, sCA) },
    { label: 'Poids des charges', value: pct(sCharges, sCA) },
  ].filter((r) => r.value);
  const headline = sNet != null && sCA != null
    ? `Résultat net de ${fmtMoney(sNet, client.currency)}${pct(sNet, sCA) ? ` — soit ${pct(sNet, sCA)} du chiffre d'affaires` : ''}.`
    : null;
  const synthesisBand = dash && (headline || ratios.length > 0) ? (
    <div className="rounded-xl border bg-secondary/40 p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Votre situation</div>
      <div className="text-lg font-semibold capitalize mt-0.5">{periodLabel(period)}</div>
      {headline && <p className="text-sm text-foreground/80 mt-1">{headline}</p>}
      {ratios.length > 0 && (
        <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
          {ratios.map((r) => (
            <div key={r.label}>
              <div className="text-xl font-semibold tabular-nums">{r.value}</div>
              <div className="text-xs text-muted-foreground">{r.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;

  const MonthBar = (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="icon" onClick={() => setPeriod(shiftPeriod(period, -1))} aria-label="Mois précédent">
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm font-medium capitalize min-w-[150px]"
      >
        {!availablePeriods.includes(period) && <option value={period}>{periodLabel(period)}</option>}
        {availablePeriods.map((p) => <option key={p} value={p}>{periodLabel(p)}</option>)}
      </select>
      <Button variant="outline" size="icon" onClick={() => setPeriod(shiftPeriod(period, 1))} aria-label="Mois suivant">
        <ChevronRight className="w-4 h-4" />
      </Button>
      {dash ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> Disponible
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
          <Clock className="w-3.5 h-3.5" /> En préparation
        </span>
      )}
    </div>
  );

  return (
    <AppShell title={client.name}>
      <div className="space-y-6">
        {error && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

        {/* Bandeau de bienvenue (1 fois par session, refermable) */}
        {showBanner && (
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-accent/10 blur-3xl" />
            <button
              onClick={dismissBanner}
              aria-label="Masquer le message"
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative flex items-center gap-4 pr-8">
              {client.logo_url && <img src={client.logo_url} alt={client.name} className="h-12 w-auto rounded bg-white p-1.5" />}
              <div>
                <div className="text-sm text-primary-foreground/70">Bonjour 👋</div>
                <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
                <p className="text-sm text-primary-foreground/70 mt-0.5">Votre espace Daftime Advisory</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar : menu + conseiller */}
          <aside className="space-y-4">
            <nav className="rounded-xl border bg-card p-2 space-y-1">
              {NAV.map((item) => {
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                      active ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" /> {item.label}
                    {item.key === 'dashboard' && hasNew && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-accent" title="Nouveau rapport" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                {advisor?.photo_url ? (
                  <img src={advisor.photo_url} alt={advisor.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent/15 text-primary flex items-center justify-center shrink-0 font-medium text-sm">
                    {advisorInitials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Votre conseiller</div>
                  <div className="font-medium text-sm leading-tight truncate">{advisor?.name ?? ADVISOR.name}</div>
                </div>
              </div>

              {advisor?.email && (
                <a href={`mailto:${advisor.email}`}
                  className="mt-3 text-xs flex items-center gap-2 text-muted-foreground hover:text-foreground transition truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{advisor.email}</span>
                </a>
              )}

              {advisor?.whatsapp && (
                <a
                  href={`https://wa.me/${advisor.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${advisor.name}, ici ${client.name} (espace Daftime).`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full mt-3 inline-flex items-center justify-center gap-2 h-9 rounded-md bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-medium transition"
                >
                  <Phone className="w-4 h-4" /> Discuter sur WhatsApp
                </a>
              )}

              <BookingButton label="Prendre rendez-vous" size="sm" variant="outline" className="w-full mt-2" url={advisor?.booking_url ?? undefined} />
            </div>
          </aside>

          {/* Contenu */}
          <div className="space-y-4">
            {(tab === 'accueil' || tab === 'dashboard') && MonthBar}

            {tab === 'accueil' && (
              <div className="space-y-4">
                {synthesisBand}
                {kpiBlock}
                {series.filter((s) => s.values.ca != null).length >= 2
                  ? <MonthlyTrend series={series} currency={client.currency} />
                  : <MonthStructure dataJson={dash?.data_json} currency={client.currency} period={period} />}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Chat synthétique */}
                  <div className="lg:col-span-2 rounded-xl border bg-card p-5 flex flex-col">
                    <h2 className="font-semibold mb-1 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-accent" /> Une question sur vos chiffres ?</h2>
                    <p className="text-xs text-muted-foreground mb-3">Réponses factuelles, basées sur vos données. Pour un conseil, contactez votre conseiller.</p>
                    <ChatPanel chat={chat} input={chatInput} setInput={setChatInput} busy={chatBusy} onSend={sendQuestion} compact />
                  </div>

                  {/* Colonne droite : rapport + documents */}
                  <div className="space-y-4">
                    <div className="rounded-xl border bg-card p-5">
                      <h2 className="font-semibold mb-2 flex items-center gap-2"><FileBarChart2 className="w-4 h-4 text-accent" /> Votre rapport</h2>
                      <p className="text-sm text-muted-foreground mb-3">
                        {dash
                          ? <>Le rapport de <span className="capitalize font-medium text-foreground">{periodLabel(period)}</span> est disponible.</>
                          : <>Le rapport de {periodLabel(period)} est en préparation.</>}
                      </p>
                      <Button onClick={() => setTab('dashboard')} className="w-full" disabled={!dash}>
                        Voir le rapport complet <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                      <h2 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-accent" /> Documents recommandés</h2>
                      <ul className="space-y-1.5 mb-3">
                        {requiredDocs.slice(0, 4).map((d) => (
                          <li key={d} className="text-sm flex items-center gap-2 text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" /> {d}
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => setTab('documents')} className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
                        Déposer mes documents <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'dashboard' && (
              <div className="space-y-4">
                {dash ? (
                  <DashboardFrame html={dash.html ?? ''} />
                ) : (
                  <div className="rounded-xl border bg-card text-center text-muted-foreground py-20">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    Votre rapport pour {periodLabel(period)} est en préparation.
                  </div>
                )}
              </div>
            )}

            {tab === 'documents' && (
              <div className="space-y-4">
              <div className="rounded-xl border bg-card p-6">
                <h2 className="font-semibold mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-accent" /> Documents recommandés</h2>
                <p className="text-xs text-muted-foreground mb-3">Liste indicative pour {periodLabel(period)} — elle varie selon votre situation. Déposez ce que vous avez, votre conseiller revient vers vous si besoin.</p>
                <ul className="space-y-2">
                  {requiredDocs.map((d) => (
                    <li key={d} className="text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" /> {d}
                    </li>
                  ))}
                </ul>
              </div>
              <section className="rounded-xl border bg-card p-6">
                <h2 className="font-semibold mb-1 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-accent" /> Déposer mes documents</h2>
                <p className="text-xs text-muted-foreground mb-4">Pour {periodLabel(period)}</p>
                <label className="block max-w-xl">
                  <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.currentTarget.value = ''; }} />
                  <span className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-10 cursor-pointer hover:border-primary hover:bg-muted/40 transition">
                    <UploadCloud className="w-7 h-7 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{busy ? 'Envoi…' : 'Cliquez pour choisir des fichiers'}</span>
                  </span>
                </label>
                {files.length > 0 && (
                  <div className="mt-6">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Documents déposés ({files.length})</div>
                    <ul className="space-y-1.5">
                      {files.map((f) => (
                        <li key={f.id} className="text-sm flex items-center gap-2 text-muted-foreground">
                          <FileText className="w-3.5 h-3.5 shrink-0 text-primary/60" /> <span className="truncate">{f.original_name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
              </div>
            )}

            {tab === 'assistant' && (
              <section className="rounded-xl border bg-card p-6 flex flex-col">
                <h2 className="font-semibold mb-1 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-accent" /> Posez une question à vos chiffres</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Réponses factuelles sur vos données (un poste, un indicateur, une évolution). Pour une analyse ou un conseil, contactez votre conseiller Daftime.
                </p>
                <ChatPanel chat={chat} input={chatInput} setInput={setChatInput} busy={chatBusy} onSend={sendQuestion} />
              </section>
            )}

            {tab === 'activity' && (
              <section className="rounded-xl border bg-card p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /> Mon activité</h2>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
                ) : (
                  <ul className="space-y-3">
                    {activity.map((a) => (
                      <li key={a.id} className="text-sm flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        <span>
                          <span className="text-foreground">{labelActivity(a)}</span>
                          <span className="block text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('fr-FR')}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
