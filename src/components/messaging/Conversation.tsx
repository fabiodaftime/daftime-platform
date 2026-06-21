// Fil de discussion client ↔ conseiller, réutilisé côté espace client et côté staff.
// senderKind = le "camp" de l'utilisateur courant ('client' ou 'staff') : ses messages
// s'affichent à droite, ceux de l'autre à gauche. Temps réel via Supabase Realtime.
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

type Msg = { id: string; sender_kind: 'client' | 'staff'; body: string; created_at: string };

export function Conversation({
  clientId,
  senderKind,
  heightClass = 'h-[460px]',
  emptyHint = 'Aucun message pour le moment. Écrivez le premier message.',
}: {
  clientId: string;
  senderKind: 'client' | 'staff';
  heightClass?: string;
  emptyHint?: string;
}) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('messages' as any)
      .select('id, sender_kind, body, created_at')
      .eq('client_id', clientId).order('created_at', { ascending: true });
    setMsgs((data as unknown as Msg[]) ?? []);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  // Temps réel : on ajoute les nouveaux messages (dédupliqués) sans recharger.
  useEffect(() => {
    const ch = supabase.channel(`messages:${clientId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clientId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    const { data, error } = await supabase.from('messages' as any)
      .insert({ client_id: clientId, sender_id: user?.id, sender_kind: senderKind, body })
      .select('id, sender_kind, body, created_at').single();
    setSending(false);
    if (!error && data) {
      setInput('');
      const m = data as unknown as Msg;
      setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
      // Notifie le conseiller sur WhatsApp (best-effort ; no-op si non configuré/non déployé).
      if (senderKind === 'client') {
        supabase.functions.invoke('wa-notify', { body: { message_id: m.id } }).catch(() => { /* ignore */ });
      }
    }
  };

  return (
    <div className="flex flex-col">
      <div className={`flex-1 overflow-y-auto space-y-3 ${heightClass} pr-1`}>
        {msgs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        ) : msgs.map((m) => {
          const mine = m.sender_kind === senderKind;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {m.body}
                <span className={`block text-[10px] mt-1 ${mine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {new Date(m.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 mt-3">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 h-11 rounded-lg border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <Button type="submit" disabled={sending || !input.trim()} className="h-11 px-4" aria-label="Envoyer">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
