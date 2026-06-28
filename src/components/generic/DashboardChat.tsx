// Assistant CONVERSATIONNEL du dashboard — répond aux questions sur les chiffres ET modifie
// le dashboard (widgets, pages, titres, style). Appelle dashboard-chat.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { invokeFn } from '@/lib/genericApi';

interface Turn { role: 'user' | 'assistant'; content: string }

export function DashboardChat({
  dashboardId,
  onUpdated,
}: {
  dashboardId: string;
  onUpdated: (dashboard: any) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const message = input.trim();
    if (!message || busy) return;
    setInput('');
    setError(null);
    const nextTurns: Turn[] = [...turns, { role: 'user', content: message }];
    setTurns(nextTurns);
    setBusy(true);
    try {
      const res = await invokeFn<{ action: 'answer' | 'edit'; answer?: string; dashboard?: any; summary?: string }>('dashboard-chat', {
        dashboard_id: dashboardId,
        message,
        history: turns,
      });
      if (res.action === 'edit') {
        setTurns((t) => [...t, { role: 'assistant', content: res.summary || 'Dashboard mis à jour.' }]);
        if (res.dashboard) onUpdated(res.dashboard);
      } else {
        setTurns((t) => [...t, { role: 'assistant', content: res.answer || res.summary || 'Je n\'ai pas de réponse à partir des données disponibles.' }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-80 border rounded-lg">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {turns.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Posez une question ou demandez un ajustement : « quelle est la marge nette ? », « pourquoi l'EBITDA baisse ? », « ajoute un graphe des ventes par pays », « mets le CA en avant », « renomme la page 2 », « passe en style sombre »…
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'text-right' : 'text-left'}>
            <span className={`inline-block rounded-lg px-3 py-1.5 text-sm ${t.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {t.content}
            </span>
          </div>
        ))}
        {busy && <p className="text-sm text-muted-foreground">L'IA réfléchit…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex gap-2 border-t p-2">
        <input
          className="flex-1 bg-transparent outline-none px-2 text-sm"
          placeholder="Votre instruction…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          disabled={busy}
        />
        <Button size="sm" onClick={send} disabled={busy || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
