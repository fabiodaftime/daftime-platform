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
  const [answers, setAnswers] = useState<Record<number, string>>({});
  if (!items || items.length === 0) return null;

  const submit = () => {
    const qa = items
      .map((q, i) => ({ question: q, answer: (answers[i] ?? '').trim() }))
      .filter((x) => x.answer);
    if (qa.length) onSubmit(qa);
  };

  const answeredCount = Object.values(answers).filter((a) => a.trim()).length;

  return (
    <div className="mb-4 border border-amber-300 rounded-md overflow-hidden">
      <div className="bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
        Pièces manquantes détectées par l'IA ({items.length}) — répondez puis envoyez
      </div>
      <table className="w-full text-sm">
        <tbody>
          {items.map((q, i) => (
            <tr key={i} className="border-t border-amber-100 align-top">
              <td className="px-3 py-2 w-1/2 text-amber-900">{q}</td>
              <td className="px-3 py-2">
                <textarea
                  className="w-full border rounded p-1.5 text-sm"
                  rows={2}
                  placeholder="Votre réponse…"
                  value={answers[i] ?? ''}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
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
