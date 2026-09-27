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
];
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

  const load = useCallback(async () => {
    const { data } = await supabase.from('src_connections' as never).select('provider, status, last_synced_at, created_at, last_error').eq('client_id', clientId);
    setConns((data ?? []) as Conn[]);
  }, [clientId]);
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
              <Button size="sm" variant="outline" className="ml-auto h-7" disabled={!!busy} onClick={() => connect(p.key)}>
                {busy === p.key ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Connexion…</> : c ? 'Reconnecter' : 'Connecter'}
              </Button>
            </li>
          );
        })}
      </ul>
      {msg && <p className={`text-xs mt-2 ${msg.kind === 'err' ? 'text-destructive' : 'text-emerald-700'}`}>{msg.text}</p>}
      <p className="text-xs text-muted-foreground mt-2">Le client (ou toi avec ses accès) autorise l'accès en lecture dans la fenêtre Nango. Aucun mot de passe ni jeton ne transite par Daftime.</p>
    </div>
  );
}
