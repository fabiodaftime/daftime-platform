// Sources CONNECTÉES d'un dossier (Nango) : état des connexions + bouton pour en brancher une.
// Le jeton OAuth ne transite jamais par nous : Nango gère le consentement et stocke l'accès ;
// le webhook nango-webhook enregistre la connexion (src_connections) à la fin du parcours.
import { useCallback, useEffect, useState } from 'react';
import Nango from '@nangohq/frontend';
import { supabase } from '@/integrations/supabase/client';
import { invokeFn } from '@/lib/genericApi';
import { Button } from '@/components/ui/button';
import { Loader2, PlugZap } from 'lucide-react';

type Conn = { provider: string; status: string; last_synced_at: string | null; created_at: string; last_error: string | null };
const PROVIDERS: { key: string; label: string; hint: string }[] = [
  { key: 'shopify', label: 'Shopify', hint: 'ventes, produits, stock, versements Shopify Payments' },
  { key: 'pennylane', label: 'Pennylane', hint: 'transactions et soldes bancaires (le client colle un jeton API en lecture)' },
];
type Pending = { id: string; provider: string; shop: string | null; nango_connection_id: string; created_at: string };
const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'connectée', cls: 'bg-emerald-100 text-emerald-800' },
  pending: { label: 'en attente', cls: 'bg-amber-100 text-amber-800' },
  error: { label: 'erreur', cls: 'bg-red-100 text-red-700' },
  revoked: { label: 'révoquée', cls: 'bg-muted text-muted-foreground' },
};
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export function ConnectorsPanel({ clientId }: { clientId: string }) {
  const [conns, setConns] = useState<Conn[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [pending, setPending] = useState<Pending[]>([]);
  const load = useCallback(async () => {
    const [{ data }, { data: pend }] = await Promise.all([
      supabase.from('src_connections' as never).select('provider, status, last_synced_at, created_at, last_error').eq('client_id', clientId),
      supabase.from('src_pending_connections' as never).select('id, provider, shop, nango_connection_id, created_at').order('created_at', { ascending: false }),
    ]);
    setConns((data ?? []) as Conn[]);
    setPending((pend ?? []) as Pending[]);
  }, [clientId]);

  // Boutique installée DEPUIS Shopify (sans dossier) → rattachée à ce dossier.
  const attach = async (p: Pending) => {
    setBusy(`attach:${p.id}`); setMsg(null);
    try {
      const { data: ex } = await supabase.from('src_connections' as never).select('id').eq('client_id', clientId).eq('provider', p.provider).maybeSingle();
      const row = { client_id: clientId, provider: p.provider, nango_connection_id: p.nango_connection_id, external_account_id: p.shop, status: 'active', last_error: null };
      const { error } = ex
        ? await supabase.from('src_connections' as never).update(row as never).eq('id', (ex as { id: string }).id)
        : await supabase.from('src_connections' as never).insert(row as never);
      if (error) throw error;
      await supabase.from('src_pending_connections' as never).delete().eq('id', p.id);
      setMsg({ kind: 'ok', text: `${p.shop ?? 'Boutique'} rattachée à ce dossier. Tu peux synchroniser.` });
      await load();
    } catch (e) { setMsg({ kind: 'err', text: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(null); }
  };
  useEffect(() => { load(); }, [load]);

  const connect = async (provider: string) => {
    setBusy(provider); setMsg(null);
    try {
      const res = await invokeFn<{ token: string }>('nango-connect-session', { client_id: clientId, provider });
      if (!res?.token) throw new Error('Session Nango indisponible.');
      const ui = new Nango().openConnectUI({
        lang: 'fr',
        onEvent: (e) => {
          if (e.type === 'connect') {
            setMsg({ kind: 'ok', text: 'Connexion établie. Elle apparaît ici dans quelques secondes.' });
            window.setTimeout(load, 2500); window.setTimeout(load, 8000);
          } else if (e.type === 'error') setMsg({ kind: 'err', text: `Connexion refusée : ${e.payload.errorMessage}` });
          else if (e.type === 'close') setBusy(null);
        },
      });
      ui.setSessionToken(res.token);
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : String(e) }); setBusy(null);
    }
  };

  // Synchronisation (Shopify : ventes mensuelles ShopifyQL → registre, 13 derniers mois).
  const sync = async (provider: string) => {
    setBusy(`sync:${provider}`); setMsg(null);
    try {
      const r = await invokeFn<{ ok?: boolean; months?: string[]; facts?: number; error?: string; hint?: string }>(`${provider}-sync`, { client_id: clientId });
      if (r?.ok === false || r?.error) throw new Error(`${r.error}${r.hint ? ` — ${r.hint}` : ''}`);
      const ms = r?.months ?? [];
      setMsg({ kind: 'ok', text: ms.length ? `${ms.length} mois synchronisés (${ms[0].slice(0, 7)} → ${ms[ms.length - 1].slice(0, 7)}). Relance la standardisation d'un mois pour l'utiliser.` : 'Synchronisé : aucune vente sur la période.' });
      await load();
    } catch (e) { setMsg({ kind: 'err', text: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(null); }
  };

  return (
    <div className="mb-4 border rounded-lg bg-background p-3">
      <div className="text-sm font-medium flex items-center gap-1.5 mb-2"><PlugZap className="w-4 h-4" />Sources connectées</div>
      <ul className="divide-y">
        {PROVIDERS.map((p) => {
          const c = conns.find((x) => x.provider === p.key);
          return (
            <li key={p.key} className="py-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{p.label}</span>
              <span className="text-xs text-muted-foreground">{p.hint}</span>
              {c && <span className={`text-[11px] px-1.5 py-0.5 rounded ${(STATUS[c.status] ?? STATUS.pending).cls}`}>{(STATUS[c.status] ?? STATUS.pending).label}</span>}
              {c && <span className="text-xs text-muted-foreground">depuis le {when(c.created_at)} · dernière synchro {when(c.last_synced_at)}</span>}
              {c?.last_error && <span className="text-xs text-destructive">{c.last_error}</span>}
              {c?.status === 'active' && (
                <Button size="sm" className="ml-auto h-7" disabled={!!busy} onClick={() => sync(p.key)}>
                  {busy === `sync:${p.key}` ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Synchro…</> : 'Synchroniser'}
                </Button>
              )}
              <Button size="sm" variant="outline" className={`${c?.status === 'active' ? '' : 'ml-auto '}h-7`} disabled={!!busy} onClick={() => connect(p.key)}>
                {busy === p.key ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Connexion…</> : c ? 'Reconnecter' : 'Connecter'}
              </Button>
            </li>
          );
        })}
      </ul>
      {pending.length > 0 && (
        <div className="mt-2 border-t pt-2">
          <div className="text-xs font-medium mb-1">Installées depuis Shopify, à rattacher à un dossier</div>
          <ul className="space-y-1">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span>{p.shop ?? p.provider}</span>
                <span className="text-xs text-muted-foreground">installée le {when(p.created_at)}</span>
                <Button size="sm" variant="outline" className="ml-auto h-7" disabled={!!busy} onClick={() => attach(p)}>
                  {busy === `attach:${p.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Rattacher à ce dossier'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {msg && <p className={`text-xs mt-2 ${msg.kind === 'err' ? 'text-destructive' : 'text-emerald-700'}`}>{msg.text}</p>}
      <p className="text-xs text-muted-foreground mt-2">Le client (ou toi avec ses accès) autorise l'accès en lecture dans la fenêtre Nango. Aucun mot de passe ni jeton ne transite par Daftime.</p>
    </div>
  );
}
