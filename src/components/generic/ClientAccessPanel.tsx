// Accès du CLIENT à son espace : inviter une personne (lien à lui envoyer soi-même), voir qui a accès, retirer.
import { useCallback, useEffect, useState } from 'react';
import { invokeFn } from '@/lib/genericApi';
import { Button } from '@/components/ui/button';
import { Check, Copy, Loader2, UserPlus, X } from 'lucide-react';

type Person = { user_id: string; email: string; since: string; last_sign_in_at: string | null };
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : 'jamais');

export function ClientAccessPanel({ clientId, published }: { clientId: string; published: boolean }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const r = await invokeFn<{ people: Person[] }>('client-access', { action: 'list', client_id: clientId }); setPeople(r?.people ?? []); }
    catch { /* liste indisponible : l'invitation reste possible */ }
  }, [clientId]);
  useEffect(() => { load(); }, [load]);

  const invite = async (target: string) => {
    setBusy(`invite:${target}`); setErr(null); setLink(null); setCopied(false);
    try {
      const r = await invokeFn<{ link: string; email: string }>('client-access', { action: 'invite', client_id: clientId, email: target, origin: window.location.origin });
      setLink({ email: r.email, url: r.link }); setEmail(''); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };
  const revoke = async (p: Person) => {
    setBusy(`revoke:${p.user_id}`);
    try { await invokeFn('client-access', { action: 'revoke', client_id: clientId, user_id: p.user_id }); await load(); }
    finally { setBusy(null); }
  };

  return (
    <div className="border rounded-lg bg-background p-3">
      <div className="text-sm font-medium flex items-center gap-1.5 mb-2"><UserPlus className="w-4 h-4" />Accès client à son espace</div>
      {!published && <p className="text-xs text-amber-700 mb-2">Le client ne voit que les dashboards <b>publiés</b> : publie celui du mois avant de lui envoyer le lien.</p>}
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (email.trim()) invite(email.trim()); }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@client.com"
          className="flex-1 min-w-[200px] h-8 rounded border bg-background px-2 text-sm" />
        <Button size="sm" type="submit" disabled={!!busy || !email.trim()}>{busy?.startsWith('invite:') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Créer le lien d’accès'}</Button>
      </form>
      {err && <p className="text-xs text-destructive mt-2">{err}</p>}
      {link && (
        <div className="mt-2 rounded border bg-muted/40 p-2 text-xs space-y-1">
          <div>Lien pour <b>{link.email}</b> — valable <b>7 jours</b>, à usage unique (un nouveau lien annule le précédent). Envoie-le toi-même (WhatsApp, e-mail…).</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate">{link.url}</code>
            <Button size="sm" variant="outline" className="h-7" onClick={async () => { await navigator.clipboard.writeText(link.url); setCopied(true); }}>
              {copied ? <><Check className="w-3.5 h-3.5 mr-1" />Copié</> : <><Copy className="w-3.5 h-3.5 mr-1" />Copier</>}
            </Button>
          </div>
        </div>
      )}
      {people.length > 0 && (
        <ul className="mt-3 divide-y text-sm">
          {people.map((p) => (
            <li key={p.user_id} className="py-1.5 flex flex-wrap items-center gap-2">
              <span>{p.email}</span>
              <span className="text-xs text-muted-foreground">accès depuis le {when(p.since)} · dernière connexion {when(p.last_sign_in_at)}</span>
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" disabled={!!busy} onClick={() => invite(p.email)}>Nouveau lien</Button>
              <button className="text-muted-foreground hover:text-destructive" title="Retirer l'accès" disabled={!!busy} onClick={() => revoke(p)}><X className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
