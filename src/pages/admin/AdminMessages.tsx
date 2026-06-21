// Boîte de réception staff : conversations client ↔ conseiller, tous clients confondus.
// Le staff voit tout (RLS) ; chaque client a une conversation. Fil + réponse via <Conversation>.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessagesSquare, Search } from 'lucide-react';
import { Conversation } from '@/components/messaging/Conversation';

type Summary = { body: string; sender_kind: 'client' | 'staff'; created_at: string };

const SEEN_KEY = 'daftime_staff_seen';
const loadSeen = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch { return {}; }
};

export default function AdminMessages() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [seen, setSeen] = useState<Record<string, string>>(loadSeen);

  useEffect(() => {
    (async () => {
      const [{ data: cl }, { data: ms }] = await Promise.all([
        supabase.from('clients' as any).select('id, name').order('name'),
        supabase.from('messages' as any).select('client_id, body, sender_kind, created_at')
          .order('created_at', { ascending: false }).limit(1000),
      ]);
      setClients((cl as any[]) ?? []);
      const sum: Record<string, Summary> = {};
      for (const m of ((ms as any[]) ?? [])) if (!sum[m.client_id]) sum[m.client_id] = m;
      setSummaries(sum);
    })();
  }, []);

  const select = (clientId: string) => {
    setSelected(clientId);
    const next = { ...seen, [clientId]: new Date().toISOString() };
    setSeen(next);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const isUnread = (clientId: string) => {
    const last = summaries[clientId];
    return !!last && last.sender_kind === 'client' && (!seen[clientId] || last.created_at > seen[clientId]);
  };

  const list = useMemo(() => clients
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    .map((c) => ({ ...c, last: summaries[c.id] }))
    .sort((a, b) => {
      if (a.last && b.last) return a.last.created_at < b.last.created_at ? 1 : -1;
      if (a.last) return -1;
      if (b.last) return 1;
      return a.name.localeCompare(b.name);
    }), [clients, summaries, q]);

  const selectedClient = clients.find((c) => c.id === selected);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="w-4 h-4 mr-2" /> Accueil
          </Button>
          <MessagesSquare className="w-5 h-5" />
          <span className="font-semibold">Messagerie clients</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* Liste des conversations */}
          <aside className="border rounded-lg overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client…"
                  className="w-full h-9 rounded-md border pl-8 pr-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y">
              {list.map((c) => (
                <button key={c.id} onClick={() => select(c.id)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-muted transition flex items-center gap-2 ${selected === c.id ? 'bg-muted' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      {c.name}
                      {isUnread(c.id) && <span className="w-2 h-2 rounded-full bg-accent shrink-0" title="Nouveau message" />}
                    </div>
                    {c.last && (
                      <div className="text-xs text-muted-foreground truncate">
                        {c.last.sender_kind === 'staff' ? 'Vous : ' : ''}{c.last.body}
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {list.length === 0 && <div className="px-3 py-6 text-sm text-muted-foreground text-center">Aucun client.</div>}
            </div>
          </aside>

          {/* Fil sélectionné */}
          <section className="border rounded-lg p-5">
            {selectedClient ? (
              <>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <MessagesSquare className="w-4 h-4 text-accent" /> {selectedClient.name}
                </h2>
                <Conversation clientId={selectedClient.id} senderKind="staff"
                  emptyHint="Aucun message. Écrivez le premier message à ce client." />
              </>
            ) : (
              <div className="text-center text-muted-foreground py-20">
                <MessagesSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                Sélectionnez une conversation à gauche.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
