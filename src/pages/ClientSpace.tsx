// Espace client : bandeau de bienvenue + conseiller, onglets (dashboard / documents / activité),
// statut du mois, plein écran & export PDF. RLS = isolation + "publié uniquement".
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { BookingButton } from '@/components/booking/BookingButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, UploadCloud, Activity, FileText, Maximize2, Printer, Headset, CheckCircle2, Clock } from 'lucide-react';
import { currentPeriod, shiftPeriod, periodLabel, logActivity } from '@/lib/genericApi';
import { ADVISOR } from '@/lib/config';

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
    const { data } = await supabase.from('clients' as any).select('id, name, currency, logo_url').eq('id', id).maybeSingle();
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
      .eq('client_id', id).order('created_at', { ascending: false }).limit(20);
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

  const printPdf = () => {
    if (!dash?.html) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(dash.html);
    w.document.close();
    w.onload = () => setTimeout(() => { w.focus(); w.print(); }, 500);
  };

  if (!client) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <AppShell title={client.name}>
      <div className="space-y-6">
        {error && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

        {/* Bandeau de bienvenue + conseiller */}
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            {client.logo_url && <img src={client.logo_url} alt={client.name} className="h-12 w-auto rounded bg-white p-1.5" />}
            <div>
              <div className="text-sm text-primary-foreground/70">Bonjour 👋</div>
              <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
              <p className="text-sm text-primary-foreground/70 mt-0.5">Votre espace Daftime Advisory</p>
            </div>
          </div>
          <div className="relative flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur shrink-0">
            <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
              <Headset className="w-4 h-4" />
            </div>
            <div className="mr-1">
              <div className="text-xs text-primary-foreground/60">Votre conseiller</div>
              <div className="font-medium text-sm leading-tight">{ADVISOR.name}</div>
            </div>
            <BookingButton label="Rendez-vous" variant="secondary" size="sm" className="h-9" />
          </div>
        </div>

        {/* Sélecteur de mois + statut */}
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

        {/* Onglets */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="documents">Mes documents</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          {/* Tableau de bord */}
          <TabsContent value="dashboard" className="mt-4">
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
                <span className="text-sm font-medium capitalize">{periodLabel(period)}</span>
                {dash && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={printPdf}><Printer className="w-4 h-4 mr-1.5" /> PDF</Button>
                    <Button variant="ghost" size="sm" onClick={openFullscreen}><Maximize2 className="w-4 h-4 mr-1.5" /> Plein écran</Button>
                  </div>
                )}
              </div>
              {dash ? (
                <iframe title="dashboard" srcDoc={dash.html ?? ''} sandbox="allow-scripts" className="w-full h-[640px] bg-white" />
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  Votre rapport pour {periodLabel(period)} est en préparation.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Mes documents */}
          <TabsContent value="documents" className="mt-4">
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
          </TabsContent>

          {/* Activité */}
          <TabsContent value="activity" className="mt-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
