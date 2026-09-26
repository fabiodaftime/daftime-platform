// Tableau des pièces manquantes détectées par l'IA, avec une colonne pour y répondre.
// Les réponses sont renvoyées à l'IA (chat-standardize) pour enrichir les données.
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function MissingItemsTable({
  items,
  busy,
  onSubmit,
}: {
  items: string[];
  busy?: boolean;
  onSubmit: (qa: { question: string; answer: string }[]) => void;
}) {
  // Réponses indexées par la QUESTION (pas par la position) : quand la liste change après un
  // nouvel envoi, une réponse ne glisse pas sur une autre ligne et les anciennes ne sont plus comptées.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  if (!items || items.length === 0) return null;

  const qa = items.map((q) => ({ question: q, answer: (answers[q] ?? '').trim() })).filter((x) => x.answer);
  const submit = () => { if (qa.length) onSubmit(qa); };
  const answeredCount = qa.length;

  return (
    <div className="mb-4 border border-amber-300 rounded-md overflow-hidden">
      <div className="bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
        Pièces manquantes détectées par l'IA ({items.length}) — répondez puis envoyez
      </div>
      <table className="w-full text-sm">
        <tbody>
          {items.map((q) => (
            <tr key={q} className="border-t border-amber-100 align-top">
              <td className="px-3 py-2 w-1/2 text-amber-900">{q}</td>
              <td className="px-3 py-2">
                <textarea
                  className="w-full border rounded p-1.5 text-sm"
                  rows={2}
                  placeholder="Votre réponse…"
                  value={answers[q] ?? ''}
                  onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-amber-100 bg-amber-50/50 flex items-center gap-3">
        <Button size="sm" onClick={submit} disabled={busy || answeredCount === 0}>
          {busy ? 'Envoi à l\'IA…' : `Envoyer ${answeredCount} réponse(s) à l'IA`}
        </Button>
      </div>
    </div>
  );
}
