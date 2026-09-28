// Cockpit — onglet « Flux » : l'IA rédige la cartographie (brouillon), le conseiller la corrige puis la publie.
// Seule la version PUBLIÉE est visible dans l'espace client (filtrage par ligne côté base).
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Eye, EyeOff, Pencil, Save, X } from 'lucide-react';
import { invokeFn } from '@/lib/genericApi';
import { FlowMapView } from './FlowMapView';
import { sanitizeFlowMap, type FlowMap } from '../../../supabase/functions/_shared/flowMap';

type Row = { status: 'draft' | 'published'; data: FlowMap; updated_at: string };
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '');

export function FlowMapPanel({ clientId, currency }: { clientId: string; currency?: string }) {
  const [draft, setDraft] = useState<Row | null>(null);
  const [pub, setPub] = useState<Row | null>(null);
  const [busy, setBusy] = useState<null | 'generate' | 'save' | 'publish' | 'unpublish'>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('client_flow_maps' as any).select('status, data, updated_at').eq('client_id', clientId);
    const rows = (data ?? []) as unknown as Row[];
    setDraft(rows.find((r) => r.status === 'draft') ?? null);
    setPub(rows.find((r) => r.status === 'published') ?? null);
  }, [clientId]);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (draft && !confirm('Régénérer remplace le brouillon actuel (la version publiée ne change pas). Continuer ?')) return;
    setBusy('generate'); setError(null);
    try { await invokeFn('flow-map', { client_id: clientId }, 200_000); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };
  const upsert = async (status: 'draft' | 'published', data: FlowMap) => {
    const { data: u } = await supabase.auth.getUser();
    const { error: err } = await supabase.from('client_flow_maps' as any)
      .upsert({ client_id: clientId, status, data, updated_at: new Date().toISOString(), updated_by: u.user?.id ?? null }, { onConflict: 'client_id,status' });
    if (err) throw err;
  };
  const save = async () => {
    setBusy('save'); setError(null);
    try { const parsed = sanitizeFlowMap(JSON.parse(text)); await upsert('draft', { ...parsed, generated_at: draft?.data.generated_at }); setEditing(false); await load(); }
    catch (e) { setError(e instanceof SyntaxError ? `JSON invalide : ${e.message}` : e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };
  const publish = async () => {
    if (!draft) return;
    setBusy('publish'); setError(null);
    try { await upsert('published', draft.data); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };
  const unpublish = async () => {
    if (!confirm('Retirer la cartographie de l\'espace client ?')) return;
    setBusy('unpublish'); setError(null);
    try { const { error: err } = await supabase.from('client_flow_maps' as any).delete().eq('client_id', clientId).eq('status', 'published'); if (err) throw err; await load(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };
  const inSync = !!draft && !!pub && JSON.stringify(draft.data) === JSON.stringify(pub.data);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="text-sm">
          <div className="font-medium">Cartographie des flux</div>
          <div className="text-muted-foreground text-xs mt-0.5">
            {draft ? `Brouillon du ${when(draft.updated_at)}` : 'Pas encore de brouillon'}
            {' · '}
            {pub ? (inSync ? `publiée pour le client (${when(pub.updated_at)})` : `version publiée du ${when(pub.updated_at)} — le brouillon a changé depuis`) : 'non publiée (invisible pour le client)'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={generate} disabled={!!busy}>
            {busy === 'generate' ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />L'IA cartographie… (≈ 1 min)</> : <><Sparkles className="w-4 h-4 mr-1.5" />{draft ? 'Régénérer avec l\'IA' : 'Générer avec l\'IA'}</>}
          </Button>
          {draft && !editing && <Button size="sm" variant="outline" onClick={() => { setText(JSON.stringify(draft.data, null, 2)); setEditing(true); }} disabled={!!busy}><Pencil className="w-4 h-4 mr-1.5" />Modifier</Button>}
          {draft && !inSync && <Button size="sm" onClick={publish} disabled={!!busy || editing}>{busy === 'publish' ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Eye className="w-4 h-4 mr-1.5" />}{pub ? 'Publier la mise à jour' : 'Publier pour le client'}</Button>}
          {pub && <Button size="sm" variant="ghost" onClick={unpublish} disabled={!!busy}><EyeOff className="w-4 h-4 mr-1.5" />Retirer</Button>}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Rédigée à partir du contexte (calls), des consignes, des règles bancaires validées et des relevés des 3 derniers mois. Relis les lignes « à confirmer » avant de publier.</p>

      {editing ? (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Édition directe : résumé, entités (id, parent), comptes (id, in_treasury), entrées / sorties (account = id d'un compte, certainty = « confirmé » ou « à confirmer »), interco, questions.</p>
          <textarea className="w-full h-[480px] font-mono text-xs rounded-md border bg-background p-3" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={!!busy}>{busy === 'save' ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}Enregistrer le brouillon</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-1.5" />Annuler</Button>
          </div>
        </div>
      ) : draft ? <FlowMapView map={draft.data} currency={currency} /> : (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Lance la génération : l'IA prépare un brouillon que tu pourras corriger avant de le publier au client.</div>
      )}
    </div>
  );
}
