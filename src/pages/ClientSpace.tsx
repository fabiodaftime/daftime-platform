// Espace client : dashboard publié du mois (lecture seule) + navigation par mois,
// dépôt de fichiers, et feed d'activité. Accessible au client (son propre client)
// et au staff (aperçu). Le RLS garantit l'isolation et "publié uniquement" pour le client.
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileUp, LogOut } from 'lucide-react';
import { currentPeriod, shiftPeriod, periodLabel, logActivity } from '@/lib/genericApi';

const BUCKET = 'client-files';

function labelActivity(a: any): string {
  if (a.action === 'file_uploaded') return `Document déposé : ${a.metadata?.name ?? ''}`;
  if (a.action === 'dashboard_published') return 'Dashboard publié';
  return a.action;
}

export default function ClientSpace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [client, setClient] = useState<any>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [dash, setDash] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClient = useCallback(async () => {
    const { data } = await supabase.from('clients' as any).select('id, name, currency').eq('id', id).maybeSingle();
    setClient(data);
  }, [id]);

  const loadDashboard = useCallback(async () => {
    const { data } = await supabase.from('dashboards' as any).select('*')
      .eq('client_id', id).eq('period', period).eq('status', 'publie').eq('is_current', true).maybeSingle();
    setDash(data);
  }, [id, period]);

  const loadActivity = useCallback(async () => {
    const { data } = await supabase.from('activity_log' as any).select('*')
      .eq('client_id', id).order('created_at', { ascending: false }).limit(20);
    setActivity((data as any[]) ?? []);
  }, [id]);

  useEffect(() => { loadClient(); loadActivity(); }, [loadClient, loadActivity]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // S'ouvrir sur le dernier mois publié.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('dashboards' as any).select('period')
        .eq('client_id', id).eq('status', 'publie').eq('is_current', true).order('period', { ascending: false }).limit(1).maybeSingle();
      if (!cancelled && (data as any)?.period) setPeriod((data as any).period);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const upload = async (files: FileList) => {
    setBusy(true); setError(null);
    try {
      for (const f of Array.from(files)) {
        const path = `${id}/${period}/${f.name}`;
        const up = await supabase.storage.from(BUCKET).upload(path, f, { upsert: true, contentType: f.type || undefined });
        if (up.error) throw up.error;
        await supabase.from('files' as any).insert({
          client_id: id, period, original_name: f.name, storage_path: path, status: 'uploaded', uploaded_by: user?.id ?? null,
        });
        await logActivity(id!, 'file_uploaded', { entity_type: 'file', metadata: { name: f.name, period } });
      }
      await loadActivity();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const doSignOut = async () => { await signOut(); navigate('/auth'); };

  if (!client) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="font-semibold flex-1">{client.name}</span>
          <span className="text-sm text-primary-foreground/70">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={doSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setPeriod(shiftPeriod(period, -1))}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-medium capitalize w-44 text-center">{periodLabel(period)}</span>
          <Button variant="outline" size="sm" onClick={() => setPeriod(shiftPeriod(period, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>

        {dash ? (
          <iframe title="dashboard" srcDoc={dash.html ?? ''} sandbox="allow-scripts" className="w-full h-[600px] border rounded-lg bg-white" />
        ) : (
          <div className="text-center text-muted-foreground border rounded-lg py-16">Aucun dashboard publié pour ce mois.</div>
        )}

        <section className="border rounded-lg p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><FileUp className="w-4 h-4" /> Déposer mes documents — {periodLabel(period)}</h2>
          <label className="inline-block">
            <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.currentTarget.value = ''; }} />
            <span className="inline-flex items-center px-3 py-2 text-sm rounded-md border cursor-pointer hover:bg-muted">{busy ? 'Envoi…' : 'Choisir des fichiers'}</span>
          </label>
        </section>

        <section className="border rounded-lg p-5">
          <h2 className="font-semibold mb-3">Mon activité</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {activity.map((a) => (
                <li key={a.id} className="text-muted-foreground">• {labelActivity(a)} — {new Date(a.created_at).toLocaleString('fr-FR')}</li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
