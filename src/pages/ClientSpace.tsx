// Espace client : dashboard publié du mois (lecture seule) + navigation par mois,
// dépôt de fichiers + liste des documents déposés, et feed d'activité.
// RLS = isolation + "publié uniquement" pour le client.
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, UploadCloud, Activity, FileText, Maximize2 } from 'lucide-react';
import { currentPeriod, shiftPeriod, periodLabel, logActivity } from '@/lib/genericApi';

const BUCKET = 'client-files';

function labelActivity(a: any): string {
  if (a.action === 'file_uploaded') return `Document déposé : ${a.metadata?.name ?? ''}`;
  if (a.action === 'dashboard_published') return 'Nouveau dashboard publié';
  return a.action;
}

export default function ClientSpace() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [client, setClient] = useState<any>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [dash, setDash] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClient = useCallback(async () => {
    const { data } = await supabase.from('clients' as any).select('id, name, currency').eq('id', id).maybeSingle();
    setClient(data);
  }, [id]);

  const loadAvailable = useCallback(async () => {
    const { data } = await supabase.from('dashboards' as any).select('period')
      .eq('client_id', id).eq('status', 'publie').eq('is_current', true).order('period', { ascending: false });
    const periods = [...new Set(((data as any[]) ?? []).map((d) => d.period))];
    setAvailablePeriods(periods);
    if (periods.length) setPeriod((p) => (periods.includes(p) ? p : periods[0]));
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
      .eq('client_id', id).order('created_at', { ascending: false }).limit(15);
    setActivity((data as any[]) ?? []);
  }, [id]);

  useEffect(() => { loadClient(); loadAvailable(); loadActivity(); }, [loadClient, loadAvailable, loadActivity]);
  useEffect(() => { loadDashboard(); loadFiles(); }, [loadDashboard, loadFiles]);

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

  const openFullscreen = () => {
    if (!dash?.html) return;
    const url = URL.createObjectURL(new Blob([dash.html], { type: 'text/html' }));
    window.open(url, '_blank');
  };

  if (!client) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <AppShell title={client.name}>
      <div className="space-y-6">
        {error && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

        {/* En-tête + navigation par mois */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Votre tableau de bord</h1>
            <p className="text-sm text-muted-foreground">{client.name}</p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Dashboard publié */}
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
            <span className="text-sm font-medium capitalize">{periodLabel(period)}</span>
            {dash && (
              <Button variant="ghost" size="sm" onClick={openFullscreen}>
                <Maximize2 className="w-4 h-4 mr-1.5" /> Plein écran
              </Button>
            )}
          </div>
          {dash ? (
            <iframe title="dashboard" srcDoc={dash.html ?? ''} sandbox="allow-scripts" className="w-full h-[640px] bg-white" />
          ) : (
            <div className="text-center text-muted-foreground py-20">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Aucun dashboard publié pour {periodLabel(period)}.
            </div>
          )}
        </div>

        {/* Dépôt + activité */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold mb-1 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-accent" /> Déposer mes documents</h2>
            <p className="text-xs text-muted-foreground mb-3">Pour {periodLabel(period)}</p>
            <label className="block">
              <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.currentTarget.value = ''; }} />
              <span className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-8 cursor-pointer hover:border-primary hover:bg-muted/40 transition">
                <UploadCloud className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{busy ? 'Envoi…' : 'Cliquez pour choisir des fichiers'}</span>
              </span>
            </label>
            {files.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {files.map((f) => (
                  <li key={f.id} className="text-sm flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-primary/60" /> <span className="truncate">{f.original_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-accent" /> Mon activité</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
            ) : (
              <ul className="space-y-2.5">
                {activity.map((a) => (
                  <li key={a.id} className="text-sm flex gap-2">
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
        </div>
      </div>
    </AppShell>
  );
}
