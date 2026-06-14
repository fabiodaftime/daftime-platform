// Chat assistant générique : délègue l'envoi à onSend(message, history) qui renvoie un résumé.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface Turn { role: 'user' | 'assistant'; content: string }

export function AssistantChat({
  placeholder,
  height = 'h-64',
  onSend,
}: {
  placeholder?: string;
  height?: string;
  onSend: (message: string, history: Turn[]) => Promise<string>;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const message = input.trim();
    if (!message || busy) return;
    setInput(''); setError(null);
    const history = turns;
    setTurns((t) => [...t, { role: 'user', content: message }]);
    setBusy(true);
    try {
      const summary = await onSend(message, history);
      setTurns((t) => [...t, { role: 'assistant', content: summary || 'Fait.' }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  return (
    <div className={`flex flex-col ${height} border rounded-lg`}>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {turns.length === 0 && <p className="text-sm text-muted-foreground">{placeholder}</p>}
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
          placeholder="Votre message…"
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
