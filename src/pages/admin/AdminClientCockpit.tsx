// Cockpit d'un client générique : contexte → fichiers → charte → standardisation →
// génération dashboard → workflow de statut → chat d'itération (Phase 3, jalon de preuve).
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { FileUp, Wand2, LayoutDashboard, BookOpen, Palette, Trash2, Eye, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BrandPanel } from '@/components/generic/BrandPanel';
import { StandardizedTableEditor } from '@/components/generic/StandardizedTableEditor';
import { StandardizedReview } from '@/components/generic/StandardizedReview';
import { DashboardChat } from '@/components/generic/DashboardChat';
import { AssistantChat } from '@/components/generic/AssistantChat';
import { MissingItemsTable } from '@/components/generic/MissingItemsTable';
import { invokeFn, currentPeriod, DASHBOARD_STATUSES, STATUS_LABELS, logActivity, deleteClient } from '@/lib/genericApi';

const BUCKET = 'client-files';

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

  // Libellés lisibles des opérations (pour le bandeau d'état).
  const OP_LABELS: Record<string, string> = {
    standardize: 'Standardisation des données', generate: 'Génération du dashboard', validate: 'Validation',
    'save-sd': 'Enregistrement', recompute: 'Recalcul', status: 'Changement de statut',
    files: 'Mise à jour des fichiers', 'answer-missing': 'Mise à jour des données',
  };

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
    const { data } = await supabase.from('clients' as any).select('*').eq('id', id).maybeSingle();
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

  const standardize = () => run('standardize', async () => {
    await invokeFn('standardize-data', { client_id: id, period });
    await loadStandardized();
  });

  const saveStandardized = () => run('save-sd', async () => {
    await supabase.from('standardized_data' as any).update({ is_current: false }).eq('client_id', id).eq('period', period).eq('is_current', true);
    const { data: last } = await supabase.from('standardized_data' as any).select('version').eq('client_id', id).eq('period', period).order('version', { ascending: false }).limit(1).maybeSingle();
    const version = (((last as any)?.version) ?? 0) + 1;
    await supabase.from('standardized_data' as any).insert({
      client_id: id, period, activity_type_id: client?.activity_type_id ?? null,
      data: editData, missing_items: sd?.missing_items ?? [], source: 'manual', version, is_current: true, created_by: user?.id ?? null,
    });
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
  const validate = () => run('validate', async () => {
    const validated = { ...editData, meta: { ...(editData?.meta ?? {}), validated: true, validated_at: new Date().toISOString() } };
    await supabase.from('standardized_data' as any).update({ is_current: false }).eq('client_id', id).eq('period', period).eq('is_current', true);
    const { data: last } = await supabase.from('standardized_data' as any).select('version').eq('client_id', id).eq('period', period).order('version', { ascending: false }).limit(1).maybeSingle();
    const version = (((last as any)?.version) ?? 0) + 1;
    await supabase.from('standardized_data' as any).insert({
      client_id: id, period, activity_type_id: client?.activity_type_id ?? null,
      data: validated, missing_items: sd?.missing_items ?? [], source: 'validated', version, is_current: true, created_by: user?.id ?? null,
    });
    await loadStandardized();
  });

  const generate = () => run('generate', async () => {
    const res = await invokeFn<{ dashboard?: any }>('generate-dashboard', { client_id: id, period });
    if (res?.dashboard) setDash(res.dashboard);
    else await loadDashboard();
  });

  const changeStatus = (to: string) => run('status', async () => {
    await supabase.from('dashboards' as any).update({ status: to }).eq('id', dash.id);
    await supabase.from('dashboard_status_history' as any).insert({ dashboard_id: dash.id, from_status: dash.status, to_status: to, changed_by: user?.id ?? null });
    if (to === 'publie') await logActivity(id!, 'dashboard_published', { entity_type: 'dashboard', entity_id: dash.id });
    await loadDashboard();
  });

  const removeClient = async () => {
    if (!confirm(`Supprimer définitivement « ${client.name} » et tout son contenu ? Action irréversible.`)) return;
    try { await deleteClient(id!); navigate('/admin/clients'); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const statuses = DASHBOARD_STATUSES.filter((s) => s !== 'supervision' || client?.requires_supervision);
  const missing: string[] = sd?.missing_items ?? [];
  const isTemplate = !!editData?.meta?.template;
  const validated = !!editData?.meta?.validated;

  if (!client) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <AppShell
      title={client.name}
      maxWidth="max-w-5xl"
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
            <span className="flex-1">{notice.text}</span>
            {notice.kind !== 'running' && (
              <button onClick={() => { setNotice(null); setError(null); }} className="text-xs underline shrink-0">fermer</button>
            )}
          </div>
        )}
        {error && !notice && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

        <Section icon={<Palette className="w-4 h-4" />} title="Charte graphique">
          <BrandPanel clientId={id!} brand={client.brand} onChange={(b) => setClient({ ...client, brand: b })} />
        </Section>

        <Section icon={<BookOpen className="w-4 h-4" />} title="Contexte client"
          action={<Button size="sm" onClick={extractContext} disabled={busy === 'context'}>{busy === 'context' ? 'Extraction…' : 'Extraire le contexte'}</Button>}>
          <textarea className="w-full h-28 border rounded-md p-2 text-sm" placeholder="Collez ici le contexte (ou importez un .txt/.md)…"
            value={contextText} onChange={(e) => setContextText(e.target.value)} />
          <label className="inline-block mt-2 text-sm">
            <input type="file" accept=".txt,.md,text/plain" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setContextText(await f.text()); e.currentTarget.value = ''; }} />
            <span className="underline cursor-pointer text-muted-foreground">importer un .txt/.md</span>
          </label>
          {currentContext && (
            <pre className="mt-3 bg-muted/50 rounded p-3 text-xs overflow-auto max-h-48">{JSON.stringify(currentContext.data, null, 2)}</pre>
          )}
        </Section>

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
                <select value={f.doc_role ?? ''} title="Rôle comptable du document"
                  onChange={(e) => setFileMeta(f, { doc_role: e.target.value || null })}
                  className="text-xs border rounded px-1 py-0.5 bg-background">
                  <option value="">Auto</option>
                  <option value="revenue">CA (facturé)</option>
                  <option value="payment">Réception paiement</option>
                  <option value="bank">Banque</option>
                  <option value="expense">Charge</option>
                  <option value="internal">Interne</option>
                  <option value="ignore">Ignorer</option>
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
              <iframe title="dashboard" srcDoc={dash.html ?? ''} sandbox="allow-scripts"
                className="w-full h-[600px] border rounded-lg bg-white" />
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
          <Section icon={<Wand2 className="w-4 h-4" />} title="Affiner par chat">
            <DashboardChat dashboardId={dash.id} onUpdated={(d) => { setDash(d); loadDashboard(); }} />
          </Section>
        )}
      </div>
    </AppShell>
  );
}
