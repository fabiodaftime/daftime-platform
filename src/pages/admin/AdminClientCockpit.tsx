// Cockpit d'un client générique : contexte → fichiers → charte → standardisation →
// génération dashboard → workflow de statut → chat d'itération (Phase 3, jalon de preuve).
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { FileUp, Wand2, LayoutDashboard, BookOpen, Palette, Trash2, Eye, Loader2, CheckCircle2, AlertCircle, Home } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BrandPanel } from '@/components/generic/BrandPanel';
import { StandardizedTableEditor } from '@/components/generic/StandardizedTableEditor';
import { StandardizedReview } from '@/components/generic/StandardizedReview';
import { DashboardChat } from '@/components/generic/DashboardChat';
import { DashboardFrame } from '@/components/generic/DashboardFrame';
import { AssistantChat } from '@/components/generic/AssistantChat';
import { MissingItemsTable } from '@/components/generic/MissingItemsTable';
import { invokeFn, currentPeriod, DASHBOARD_STATUSES, STATUS_LABELS, logActivity, deleteClient } from '@/lib/genericApi';
import { extractTextFromFile } from '@/lib/extractText';

const BUCKET = 'client-files';

// Catégories de documents par activité (le moteur les mappe vers le bon traitement comptable).
const DOC_CATEGORIES: Record<string, { value: string; label: string }[]> = {
  ecommerce: [
    { value: '', label: 'Auto' },
    { value: 'shopify', label: 'Shopify / site' },
    { value: 'psp', label: 'PSP (Stripe, PayPal…)' },
    { value: 'bank', label: 'Banque' },
    { value: 'ads', label: 'Publicité (Meta, Google…)' },
    { value: 'accounting', label: 'Données comptables' },
    { value: 'ignore', label: 'Ignorer' },
  ],
  default: [
    { value: '', label: 'Auto' },
    { value: 'revenue', label: 'CA (facturé)' },
    { value: 'psp', label: 'Réception / PSP' },
    { value: 'bank', label: 'Banque' },
    { value: 'ads', label: 'Publicité' },
    { value: 'accounting', label: 'Données comptables' },
    { value: 'expense', label: 'Charge' },
    { value: 'internal', label: 'Interne' },
    { value: 'ignore', label: 'Ignorer' },
  ],
};

function Section({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}<h2 className="font-semibold flex-1">{title}</h2>{action}
      </div>
      {children}
    </section>
  );
}

export default function AdminClientCockpit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [client, setClient] = useState<any>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'running' | 'success' | 'error'; text: string } | null>(null);

  const [contextText, setContextText] = useState('');
  const [currentContext, setCurrentContext] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [sd, setSd] = useState<any>(null);
  const [editData, setEditData] = useState<any>({ sections: [] });
  const [dash, setDash] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [guidanceText, setGuidanceText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [tab, setTab] = useState<'home' | 'data' | 'context' | 'custom' | 'dashboard'>('home');

  // Libellés lisibles des opérations (pour le bandeau d'état).
  const OP_LABELS: Record<string, string> = {
    standardize: 'Standardisation des données', generate: 'Génération du dashboard', validate: 'Validation',
    'save-sd': 'Enregistrement', recompute: 'Recalcul', status: 'Changement de statut',
    files: 'Mise à jour des fichiers', 'answer-missing': 'Mise à jour des données',
    guidance: 'Enregistrement des consignes', ingest: 'Analyse de la transcription',
    'extract-file': 'Extraction du fichier',
  };

  // Extrait le texte d'un fichier joint (txt/md/docx/pdf) et l'ajoute au champ cible.
  const attachToField = (file: File | null | undefined, setter: (updater: (prev: string) => string) => void) =>
    run('extract-file', async () => {
      if (!file) return;
      const txt = await extractTextFromFile(file);
      if (!txt) throw new Error('Aucun texte extrait de ce fichier.');
      setter((prev) => (prev && prev.trim() ? prev + '\n\n' : '') + txt);
    });

  const run = async (key: string, fn: () => Promise<void>) => {
    const label = OP_LABELS[key] ?? key;
    setBusy(key); setError(null);
    setNotice({ kind: 'running', text: `${label} en cours…` });
    try {
      await fn();
      setNotice({ kind: 'success', text: `${label} terminé.` });
      window.setTimeout(() => setNotice((n) => (n?.kind === 'success' ? null : n)), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setNotice({ kind: 'error', text: `${label} : échec — ${msg}` });
    } finally { setBusy(null); }
  };

  const loadClient = useCallback(async () => {
    const { data } = await supabase.from('clients' as any).select('*, activity_types:activity_type_id(slug, name)').eq('id', id).maybeSingle();
    setClient(data);
  }, [id]);

  const loadContext = useCallback(async () => {
    const { data } = await supabase.from('contexts' as any).select('*').eq('client_id', id).eq('is_current', true).maybeSingle();
    setCurrentContext(data);
  }, [id]);

  const loadFiles = useCallback(async () => {
    const { data } = await supabase.from('files' as any).select('*').eq('client_id', id).eq('period', period).order('created_at');
    setFiles((data as any[]) ?? []);
  }, [id, period]);

  const loadStandardized = useCallback(async () => {
    const { data } = await supabase.from('standardized_data' as any).select('*').eq('client_id', id).eq('period', period).eq('is_current', true).maybeSingle();
    setSd(data);
    setEditData((data as any)?.data ?? { sections: [] });
  }, [id, period]);

  const loadDashboard = useCallback(async () => {
    const { data } = await supabase.from('dashboards' as any).select('*').eq('client_id', id).eq('period', period).eq('is_current', true).maybeSingle();
    setDash(data);
    if (data) {
      const { data: h } = await supabase.from('dashboard_status_history' as any).select('*').eq('dashboard_id', (data as any).id).order('created_at', { ascending: false });
      setHistory((h as any[]) ?? []);
    } else { setHistory([]); }
  }, [id, period]);

  useEffect(() => { loadClient(); loadContext(); }, [loadClient, loadContext]);
  useEffect(() => { loadFiles(); loadStandardized(); loadDashboard(); }, [loadFiles, loadStandardized, loadDashboard]);
  useEffect(() => { setGuidanceText(client?.dashboard_guidance ?? ''); }, [client]);

  // Reprise d'une tâche de fond : si une standardisation/génération a été lancée puis la page quittée,
  // on retrouve le marqueur au retour et on suit jusqu'à l'apparition du résultat.
  useEffect(() => {
    if (!id || !period) return;
    const key = `cockpit:job:${id}:${period}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    let job: { op: string; at: number };
    try { job = JSON.parse(raw); } catch { localStorage.removeItem(key); return; }
    if (Date.now() - job.at > 5 * 60 * 1000) { localStorage.removeItem(key); return; } // marqueur périmé
    const label = job.op === 'generate' ? 'Génération du dashboard' : 'Standardisation des données';
    setNotice({ kind: 'running', text: `${label} en cours en arrière-plan…` });
    let stop = false;
    const check = async () => {
      const table = job.op === 'generate' ? 'dashboards' : 'standardized_data';
      const { data } = await supabase.from(table as any).select('created_at')
        .eq('client_id', id).eq('period', period).eq('is_current', true)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      const done = data && new Date((data as any).created_at).getTime() > job.at - 3000;
      if (done && !stop) {
        localStorage.removeItem(key);
        if (job.op === 'generate') await loadDashboard(); else await loadStandardized();
        setNotice({ kind: 'success', text: `${label} terminé.` });
        window.setTimeout(() => setNotice((n) => (n?.kind === 'success' ? null : n)), 4000);
        return true;
      }
      return false;
    };
    const iv = window.setInterval(async () => { if (await check()) clearInterval(iv); }, 4000);
    check().then((d) => { if (d) clearInterval(iv); });
    return () => { stop = true; clearInterval(iv); };
  }, [id, period, loadStandardized, loadDashboard]);

  // À l'ouverture d'un client, se placer sur le dernier mois travaillé (dashboard, sinon données).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: d } = await supabase.from('dashboards' as any).select('period').eq('client_id', id).order('period', { ascending: false }).limit(1).maybeSingle();
      if (!cancelled && (d as any)?.period) { setPeriod((d as any).period); return; }
      const { data: s } = await supabase.from('standardized_data' as any).select('period').eq('client_id', id).order('period', { ascending: false }).limit(1).maybeSingle();
      if (!cancelled && (s as any)?.period) setPeriod((s as any).period);
    })();
    return () => { cancelled = true; };
  }, [id]);

  // --- actions ---
  const extractContext = () => run('context', async () => {
    if (!contextText.trim()) throw new Error('Collez du texte de contexte (ou importez un .txt/.md).');
    await invokeFn('extract-context', { client_id: id, text: contextText });
    setContextText('');
    await loadContext();
  });

  const uploadFiles = (fileList: FileList) => run('files', async () => {
    for (const f of Array.from(fileList)) {
      const path = `${id}/${period}/${f.name}`;
      const up = await supabase.storage.from(BUCKET).upload(path, f, { upsert: true, contentType: f.type || undefined });
      if (up.error) throw up.error;
      await supabase.from('files' as any).insert({
        client_id: id, period, original_name: f.name, storage_path: path, status: 'uploaded', uploaded_by: user?.id ?? null,
      });
    }
    await loadFiles();
  });

  const deleteFile = (f: any) => run('files', async () => {
    if (f.storage_path) await supabase.storage.from(BUCKET).remove([f.storage_path]);
    await supabase.from('files' as any).delete().eq('id', f.id);
    await loadFiles();
  });

  // Triage manuel : rôle comptable imposé + commentaire de contexte par fichier.
  const setFileMeta = (f: any, patch: { doc_role?: string | null; doc_note?: string | null }) => run('files', async () => {
    await supabase.from('files' as any).update(patch).eq('id', f.id);
    await loadFiles();
  });

  // Marqueur de tâche de fond (survit à la navigation) : permet de retrouver "en cours" au retour.
  const bgKey = () => (id && period ? `cockpit:job:${id}:${period}` : '');
  const markBg = (op: string) => { const k = bgKey(); if (k) localStorage.setItem(k, JSON.stringify({ op, at: Date.now() })); };
  const clearBg = () => { const k = bgKey(); if (k) localStorage.removeItem(k); };

  const standardize = () => run('standardize', async () => {
    markBg('standardize');
    try { await invokeFn('standardize-data', { client_id: id, period }); await loadStandardized(); }
    finally { clearBg(); }
  });

  const saveStandardized = () => run('save-sd', async () => {
    if (!(editData?.sections?.length)) throw new Error('Aucune donnée à enregistrer.');
    const { data: last } = await supabase.from('standardized_data' as any).select('version').eq('client_id', id).eq('period', period).order('version', { ascending: false }).limit(1).maybeSingle();
    const version = (((last as any)?.version) ?? 0) + 1;
    const { data: inserted, error: insErr } = await supabase.from('standardized_data' as any).insert({
      client_id: id, period, activity_type_id: client?.activity_type_id ?? null,
      data: editData, missing_items: sd?.missing_items ?? [], source: 'manual', version, is_current: true, created_by: user?.id ?? null,
    }).select('id').single();
    if (insErr) throw insErr;
    await supabase.from('standardized_data' as any).update({ is_current: false })
      .eq('client_id', id).eq('period', period).eq('is_current', true).neq('id', (inserted as any).id);
    await loadStandardized();
  });

  // Édition d'un input (template) : maj de la valeur + marquage "manuel".
  const setInputValue = (rowId: string, value: number | null) => {
    setEditData((d: any) => ({
      ...d,
      sections: (d?.sections ?? []).map((s: any) => ({
        ...s,
        rows: (s.rows ?? []).map((r: any) => (r.id === rowId ? { ...r, value, confidence: 'manual', source: 'saisie manuelle' } : r)),
      })),
    }));
  };

  // Recalcule les dérivés + rejoue les vérifications côté serveur (formules = source unique).
  const recompute = () => run('recompute', async () => {
    const activity = editData?.meta?.template;
    const inputs: Record<string, number> = {};
    for (const s of editData?.sections ?? []) for (const r of s.rows ?? []) if (!r.derived && typeof r.value === 'number') inputs[r.id] = r.value;
    const res = await invokeFn<{ data: any }>('template-recompute', { activity, inputs, currency: client?.currency ?? 'EUR' });
    const oldRows: Record<string, any> = {};
    for (const s of editData?.sections ?? []) for (const r of s.rows ?? []) oldRows[r.id] = r;
    const newData = res.data;
    for (const s of newData.sections ?? []) for (const r of s.rows ?? []) {
      if (!r.derived) {
        const old = oldRows[r.id];
        if (old && old.value === r.value && old.confidence && old.confidence !== 'manual') { r.confidence = old.confidence; r.source = old.source; }
        else { r.confidence = 'manual'; r.source = old?.source ?? 'saisie manuelle'; }
      }
    }
    setEditData(newData);
  });

  // Valider = porte de confiance : enregistre une version marquée "validée".
  // Insert D'ABORD (is_current), désactivation des autres ENSUITE → jamais de perte de données.
  const validate = () => run('validate', async () => {
    if (!sd || !(editData?.sections?.length)) throw new Error("Aucune donnée standardisée à valider — clique d'abord sur « Standardiser ».");
    const validated = { ...editData, meta: { ...(editData?.meta ?? {}), validated: true, validated_at: new Date().toISOString() } };
    const { data: last } = await supabase.from('standardized_data' as any).select('version').eq('client_id', id).eq('period', period).order('version', { ascending: false }).limit(1).maybeSingle();
    const version = (((last as any)?.version) ?? 0) + 1;
    const { data: inserted, error: insErr } = await supabase.from('standardized_data' as any).insert({
      client_id: id, period, activity_type_id: client?.activity_type_id ?? null,
      data: validated, missing_items: sd?.missing_items ?? [], source: 'manual', version, is_current: true, created_by: user?.id ?? null,
    }).select('id').single();
    if (insErr) throw insErr;
    await supabase.from('standardized_data' as any).update({ is_current: false })
      .eq('client_id', id).eq('period', period).eq('is_current', true).neq('id', (inserted as any).id);
    await loadStandardized();
  });

  const generate = () => run('generate', async () => {
    markBg('generate');
    try {
      const res = await invokeFn<{ dashboard?: any }>('generate-dashboard', { client_id: id, period });
      if (res?.dashboard) setDash(res.dashboard);
      else await loadDashboard();
    } finally { clearBg(); }
  });

  const changeStatus = (to: string) => run('status', async () => {
    await supabase.from('dashboards' as any).update({ status: to }).eq('id', dash.id);
    await supabase.from('dashboard_status_history' as any).insert({ dashboard_id: dash.id, from_status: dash.status, to_status: to, changed_by: user?.id ?? null });
    if (to === 'publie') await logActivity(id!, 'dashboard_published', { entity_type: 'dashboard', entity_id: dash.id });
    await loadDashboard();
  });

  // Consignes durables (reprises chaque mois) : édition directe + distillation d'une transcription de call.
  const saveGuidance = () => run('guidance', async () => {
    await supabase.from('clients' as any).update({ dashboard_guidance: guidanceText }).eq('id', id);
    await loadClient();
  });
  const ingestTranscript = () => run('ingest', async () => {
    if (!transcript.trim()) throw new Error('Colle la transcription (ou les notes) du call.');
    const res = await invokeFn<{ guidance?: string; added?: boolean; message?: string }>('distill-feedback', { client_id: id, transcript, period });
    if (res?.guidance != null) setGuidanceText(res.guidance);
    setTranscript('');
    await loadClient();
  });

  const removeClient = async () => {
    if (!confirm(`Supprimer définitivement « ${client.name} » et tout son contenu ? Action irréversible.`)) return;
    try { await deleteClient(id!); navigate('/admin/clients'); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const docCats = DOC_CATEGORIES[client?.activity_types?.slug as string] ?? DOC_CATEGORIES.default;
  const TABS = [
    { id: 'home' as const, label: 'Accueil', icon: <Home className="w-4 h-4" /> },
    { id: 'data' as const, label: 'Données', icon: <Wand2 className="w-4 h-4" /> },
    { id: 'context' as const, label: 'Contexte', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'custom' as const, label: 'Personnalisation', icon: <Palette className="w-4 h-4" /> },
    { id: 'dashboard' as const, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  ];
  const statuses = DASHBOARD_STATUSES.filter((s) => s !== 'supervision' || client?.requires_supervision);
  const missing: string[] = sd?.missing_items ?? [];
  const isTemplate = !!editData?.meta?.template;
  const validated = !!editData?.meta?.validated;
  // Synthèse pour la page d'accueil de la fiche.
  const charteSet = !!(client?.brand?.colors?.primary || (Array.isArray(client?.brand?.palette) && client.brand.palette.length));
  const steps = [
    { label: 'Fichiers déposés', done: files.length > 0 },
    { label: 'Standardisé', done: !!sd },
    { label: 'Validé', done: validated },
    { label: 'Dashboard généré', done: !!dash },
    { label: 'Publié', done: dash?.status === 'publie' },
  ];
  let _cur = false; for (const s of steps) { (s as any).current = !s.done && !_cur; if (!s.done) _cur = true; }
  const findRow = (id: string) => { for (const sec of editData?.sections ?? []) { const r = (sec.rows ?? []).find((x: any) => x.id === id); if (r) return r; } return null; };
  const homeKpis = ['ca', 'ebitda', 'resultat_net', 'cash_end'].map(findRow).filter(Boolean) as any[];
  const fmtV = (r: any) => { const v = r?.value; if (typeof v !== 'number') return '—'; const u = r.unit; if (u === '%') return v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %'; if (u === 'x') return v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + '×'; return v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + (u ? ` ${u}` : ''); };

  if (!client) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <AppShell
      title={client.name}
      maxWidth="max-w-6xl"
      onBack={() => navigate('/admin/clients')}
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/client/${id}`)} className="text-primary-foreground hover:bg-white/10">
            <Eye className="w-4 h-4 mr-1" /> Aperçu
          </Button>
          <Button variant="ghost" size="icon" onClick={removeClient} className="text-primary-foreground hover:bg-white/10" title="Supprimer le client">
            <Trash2 className="w-4 h-4" />
          </Button>
          <label className="hidden sm:flex text-sm items-center gap-1.5 text-primary-foreground/90">
            Mois
            <input type="month" value={period.slice(0, 7)} onChange={(e) => setPeriod(`${e.target.value}-01`)}
              className="text-foreground rounded px-2 py-1 text-sm" />
          </label>
        </>
      }
    >
      <div className="space-y-6">
        <p className="text-xs text-muted-foreground">
          💾 Tout est enregistré automatiquement. Tu peux fermer et revenir plus tard pour finaliser — pense à sélectionner le bon mois.
        </p>
        {notice && (
          <div className={
            'sticky top-2 z-20 rounded-lg px-4 py-3 text-sm flex items-center gap-2 shadow-sm border ' +
            (notice.kind === 'running' ? 'bg-primary/10 text-primary border-primary/30'
              : notice.kind === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-destructive/10 text-destructive border-destructive/40')
          }>
            {notice.kind === 'running' ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              : notice.kind === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{notice.text}
              {notice.kind === 'running' && <span className="block text-xs opacity-70 mt-0.5">Tu peux changer de page, le traitement continue — tu retrouveras l'état ici.</span>}
            </span>
            {notice.kind !== 'running' && (
              <button onClick={() => { setNotice(null); setError(null); }} className="text-xs underline shrink-0">fermer</button>
            )}
          </div>
        )}
        {error && !notice && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside>
            <nav className="rounded-xl border bg-card p-2 space-y-1 lg:sticky lg:top-4">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${tab === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </nav>
          </aside>
          <div className="space-y-6 min-w-0">

        {tab === 'home' && (
          <div className="space-y-5">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold">{client.name}</h2>
                  <p className="text-sm text-muted-foreground">{client.activity_types?.name ?? '—'} · {client.currency ?? 'EUR'}{client.category ? ` · ${client.category}` : ''}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-muted">{period.slice(0, 7)}</span>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <div className="text-sm font-medium mb-3">Avancement du mois</div>
              <ol className="flex flex-wrap gap-2">
                {steps.map((s, i) => (
                  <li key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${s.done ? 'bg-emerald-50 text-emerald-700' : (s as any).current ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}>
                    <span className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-xs">{s.done ? '✓' : i + 1}</span>{s.label}
                  </li>
                ))}
              </ol>
            </div>

            {homeKpis.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {homeKpis.map((r, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4">
                    <div className="text-xs text-muted-foreground">{r.label}</div>
                    <div className="text-xl font-semibold mt-1">{fmtV(r)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card p-5 text-sm space-y-2">
                <div className="font-medium mb-1">À surveiller</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Pièces manquantes</span><span className={missing.length ? 'text-amber-600 font-medium' : ''}>{missing.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Charte graphique</span>{charteSet ? <span className="text-emerald-600">définie</span> : <button className="text-primary underline" onClick={() => setTab('custom')}>à définir</button>}</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Consignes dashboard</span>{guidanceText.trim() ? <span className="text-emerald-600">oui</span> : <button className="text-primary underline" onClick={() => setTab('custom')}>ajouter</button>}</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Dashboard</span><span>{dash ? (STATUS_LABELS[dash.status] ?? dash.status) : '—'}</span></div>
              </div>
              <div className="rounded-xl border bg-card p-5 space-y-2">
                <div className="font-medium mb-1 text-sm">Accès rapides</div>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setTab('data')}><FileUp className="w-4 h-4 mr-2" />Déposer / standardiser les données</Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setTab('custom')}><Palette className="w-4 h-4 mr-2" />Charte &amp; consignes</Button>
                <Button size="sm" className="w-full justify-start" onClick={() => setTab('dashboard')} disabled={!sd}><LayoutDashboard className="w-4 h-4 mr-2" />{dash ? 'Voir le dashboard' : 'Générer le dashboard'}</Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'custom' && (
        <Section icon={<Palette className="w-4 h-4" />} title="Charte graphique">
          <BrandPanel clientId={id!} brand={client.brand} onChange={(b) => setClient({ ...client, brand: b })} />
        </Section>
        )}

        {tab === 'context' && (
        <Section icon={<BookOpen className="w-4 h-4" />} title="Contexte client"
          action={<Button size="sm" onClick={extractContext} disabled={busy === 'context'}>{busy === 'context' ? 'Extraction…' : 'Extraire le contexte'}</Button>}>
          <textarea className="w-full h-28 border rounded-md p-2 text-sm" placeholder="Collez ici le contexte (ou joignez un .txt/.md/.docx/.pdf)…"
            value={contextText} onChange={(e) => setContextText(e.target.value)} />
          <label className="inline-block mt-2 text-sm">
            <input type="file" accept=".txt,.md,.docx,.pdf" className="hidden"
              onChange={(e) => { attachToField(e.target.files?.[0], setContextText); e.currentTarget.value = ''; }} />
            <span className="underline cursor-pointer text-muted-foreground">{busy === 'extract-file' ? 'Extraction…' : 'joindre un .txt / .md / .docx / .pdf'}</span>
          </label>
          {currentContext && (
            <pre className="mt-3 bg-muted/50 rounded p-3 text-xs overflow-auto max-h-48">{JSON.stringify(currentContext.data, null, 2)}</pre>
          )}
        </Section>
        )}

        {tab === 'data' && (<>
        <Section icon={<FileUp className="w-4 h-4" />} title={`Fichiers du mois (${files.length})`}>
          <label className="inline-block">
            <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.currentTarget.value = ''; }} />
            <span className="inline-flex items-center px-3 py-2 text-sm rounded-md border cursor-pointer hover:bg-muted">
              {busy === 'files' ? 'Envoi…' : 'Déposer des fichiers'}
            </span>
          </label>
          <p className="mt-3 text-xs text-muted-foreground">Laisse « Auto » si la détection est bonne ; impose un rôle ou ajoute un commentaire si besoin.</p>
          <ul className="mt-1 text-sm divide-y">
            {files.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-2 text-muted-foreground py-1.5">
                <span className="flex-1 min-w-[160px]">• {f.original_name} <span className="text-xs">({f.status})</span></span>
                <select value={f.doc_role ?? ''} title="Catégorie du document"
                  onChange={(e) => setFileMeta(f, { doc_role: e.target.value || null })}
                  className="text-xs border rounded px-1 py-0.5 bg-background">
                  {docCats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input defaultValue={f.doc_note ?? ''} placeholder="commentaire…"
                  onBlur={(e) => { const v = e.target.value || null; if (v !== (f.doc_note ?? null)) setFileMeta(f, { doc_note: v }); }}
                  className="text-xs border rounded px-1.5 py-0.5 bg-background w-40" />
                <button className="text-xs underline hover:text-destructive" onClick={() => deleteFile(f)} disabled={busy === 'files'}>
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={<Wand2 className="w-4 h-4" />} title="Données standardisées"
          action={<div className="flex items-center gap-2">
            {validated && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">✓ Validé</span>}
            <Button size="sm" variant="outline" onClick={standardize} disabled={!!busy}>
              {busy === 'standardize' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Lecture…</> : 'Standardiser (IA)'}
            </Button>
            {isTemplate && <Button size="sm" variant="outline" onClick={recompute} disabled={!!busy || !sd}>
              {busy === 'recompute' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Calcul…</> : 'Recalculer'}
            </Button>}
            {isTemplate
              ? <Button size="sm" onClick={validate} disabled={!!busy || !sd}>
                  {busy === 'validate' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />…</> : 'Valider'}
                </Button>
              : <Button size="sm" onClick={saveStandardized} disabled={!!busy || !sd}>
                  {busy === 'save-sd' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />…</> : 'Enregistrer'}
                </Button>}
          </div>}>
          {busy === 'standardize' && <p className="text-sm text-primary mb-3 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Le moteur lit tes documents et reconstitue les chiffres — compte ~10 à 20 s.</p>}
          <MissingItemsTable
            items={missing}
            busy={busy === 'answer-missing'}
            onSubmit={(qa) => run('answer-missing', async () => {
              const msg = 'Réponses aux pièces manquantes :\n' + qa.map((x) => `- ${x.question}\n  → ${x.answer}`).join('\n');
              await invokeFn('chat-standardize', { client_id: id, period, message: msg });
              await loadStandardized();
            })}
          />
          {isTemplate
            ? <StandardizedReview data={editData} onInputChange={setInputValue} />
            : <StandardizedTableEditor value={editData} onChange={setEditData} />}
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-1">Affiner avec l'IA</div>
            <AssistantChat
              placeholder="Ex : « le CA de mars ne sera pas dispo », « ajoute une ligne marge brute = 5000 », « regroupe les charges »…"
              onSend={async (message, history) => {
                const res = await invokeFn<{ summary: string }>('chat-standardize', { client_id: id, period, message, history });
                await loadStandardized();
                return res.summary || 'Données mises à jour.';
              }}
            />
          </div>
        </Section>
        </>)}

        {tab === 'custom' && (
        <Section icon={<BookOpen className="w-4 h-4" />} title="Consignes dashboard (reprises chaque mois)">
          <p className="text-sm text-muted-foreground mb-3">
            Ces consignes sont appliquées à <strong>chaque génération</strong>, et la <strong>forme du mois précédent est conservée</strong>. Colle la transcription du call : l'IA en extrait les consignes durables et les ajoute ci-dessous.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium mb-1">Transcription / notes du call</div>
              <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={6}
                placeholder="Colle la transcription, ou joins un .txt/.md/.docx/.pdf…"
                className="w-full text-sm border rounded p-2 bg-background" />
              <div className="flex items-center gap-3 mt-2">
                <Button size="sm" variant="outline" onClick={ingestTranscript} disabled={!!busy}>
                  {busy === 'ingest' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Analyse…</> : 'Intégrer au suivi (IA)'}
                </Button>
                <label className="text-sm">
                  <input type="file" accept=".txt,.md,.docx,.pdf" className="hidden"
                    onChange={(e) => { attachToField(e.target.files?.[0], setTranscript); e.currentTarget.value = ''; }} />
                  <span className="underline cursor-pointer text-muted-foreground">{busy === 'extract-file' ? 'Extraction…' : 'joindre un fichier'}</span>
                </label>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium mb-1">Consignes durables (éditable)</div>
              <textarea value={guidanceText} onChange={(e) => setGuidanceText(e.target.value)} rows={6}
                placeholder="Les consignes reprises chaque mois apparaissent ici. Tu peux les corriger à la main."
                className="w-full text-sm border rounded p-2 bg-background" />
              <Button size="sm" className="mt-2" onClick={saveGuidance} disabled={!!busy}>
                {busy === 'guidance' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />…</> : 'Enregistrer les consignes'}
              </Button>
            </div>
          </div>
        </Section>
        )}

        {tab === 'dashboard' && (<>
        <Section icon={<LayoutDashboard className="w-4 h-4" />} title="Dashboard"
          action={<Button size="sm" onClick={generate} disabled={!!busy || !sd}>
            {busy === 'generate' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Génération…</> : 'Générer (IA)'}
          </Button>}>
          {busy === 'generate' && <p className="text-sm text-primary mb-3 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />L'IA compose le dashboard — ça peut prendre 30 s à 1 min, ne ferme pas la page.</p>}
          {!sd && <p className="text-sm text-muted-foreground mb-3">Standardisez d'abord les données pour générer un dashboard.</p>}
          {dash ? (
            <>
              <div className="flex items-center gap-3 mb-3 text-sm">
                <span>Statut :</span>
                <select className="h-9 rounded-md border bg-background px-2" value={dash.status} onChange={(e) => changeStatus(e.target.value)} disabled={busy === 'status'}>
                  {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <span className="text-muted-foreground text-xs">v{dash.version}</span>
              </div>
              <DashboardFrame html={dash.html ?? ''} />
              {history.length > 0 && (
                <details className="mt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Historique du workflow ({history.length})</summary>
                  <ul className="mt-2 space-y-1">
                    {history.map((h) => <li key={h.id}>{STATUS_LABELS[h.from_status] ?? '—'} → {STATUS_LABELS[h.to_status]} · {new Date(h.created_at).toLocaleString()}</li>)}
                  </ul>
                </details>
              )}
            </>
          ) : <p className="text-sm text-muted-foreground">Aucun dashboard généré pour ce mois.</p>}
        </Section>

        {dash && (
          <Section icon={<Palette className="w-4 h-4" />} title="Style & apparence (chat)">
            <DashboardChat dashboardId={dash.id} onUpdated={(d) => { setDash(d); loadDashboard(); }} />
          </Section>
        )}
        </>)}
        </div>
        </div>
      </div>
    </AppShell>
  );
}
