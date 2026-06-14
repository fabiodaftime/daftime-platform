// Cockpit d'un client générique : contexte → fichiers → charte → standardisation →
// génération dashboard → workflow de statut → chat d'itération (Phase 3, jalon de preuve).
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileUp, Wand2, LayoutDashboard, BookOpen, Palette } from 'lucide-react';
import { BrandPanel } from '@/components/generic/BrandPanel';
import { StandardizedTableEditor } from '@/components/generic/StandardizedTableEditor';
import { DashboardChat } from '@/components/generic/DashboardChat';
import { AssistantChat } from '@/components/generic/AssistantChat';
import { invokeFn, currentPeriod, DASHBOARD_STATUSES, STATUS_LABELS } from '@/lib/genericApi';

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

  const [contextText, setContextText] = useState('');
  const [currentContext, setCurrentContext] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [sd, setSd] = useState<any>(null);
  const [editData, setEditData] = useState<any>({ sections: [] });
  const [dash, setDash] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
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

  const generate = () => run('generate', async () => {
    await invokeFn('generate-dashboard', { client_id: id, period });
    await loadDashboard();
  });

  const changeStatus = (to: string) => run('status', async () => {
    await supabase.from('dashboards' as any).update({ status: to }).eq('id', dash.id);
    await supabase.from('dashboard_status_history' as any).insert({ dashboard_id: dash.id, from_status: dash.status, to_status: to, changed_by: user?.id ?? null });
    await loadDashboard();
  });

  const statuses = DASHBOARD_STATUSES.filter((s) => s !== 'supervision' || client?.requires_supervision);
  const missing: string[] = sd?.missing_items ?? [];

  if (!client) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/clients')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="w-4 h-4 mr-2" /> Clients
          </Button>
          <span className="font-semibold flex-1">{client.name}</span>
          <label className="text-sm flex items-center gap-2">
            Mois
            <input type="month" value={period.slice(0, 7)} onChange={(e) => setPeriod(`${e.target.value}-01`)}
              className="text-foreground rounded px-2 py-1 text-sm" />
          </label>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

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
          <ul className="mt-3 text-sm space-y-1">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-muted-foreground">
                <span className="flex-1">• {f.original_name} <span className="text-xs">({f.status})</span></span>
                <button className="text-xs underline hover:text-destructive" onClick={() => deleteFile(f)} disabled={busy === 'files'}>
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={<Wand2 className="w-4 h-4" />} title="Données standardisées"
          action={<div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={standardize} disabled={busy === 'standardize'}>{busy === 'standardize' ? 'IA…' : 'Standardiser (IA)'}</Button>
            <Button size="sm" onClick={saveStandardized} disabled={busy === 'save-sd' || !sd}>Enregistrer</Button>
          </div>}>
          {missing.length > 0 && (
            <div className="mb-3 border border-amber-400 bg-amber-50 rounded-md p-3 text-sm">
              <div className="font-medium text-amber-800">Pièces manquantes signalées par l'IA :</div>
              <ul className="list-disc ml-5 text-amber-900">{missing.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          )}
          <StandardizedTableEditor value={editData} onChange={setEditData} />
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
          action={<Button size="sm" onClick={generate} disabled={busy === 'generate' || !sd}>{busy === 'generate' ? 'Génération…' : 'Générer (IA)'}</Button>}>
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
      </main>
    </div>
  );
}
