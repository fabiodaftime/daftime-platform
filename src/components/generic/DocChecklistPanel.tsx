// Aide-mémoire CLOSER : la liste exacte des documents à demander au client, par activité.
// Interne (pas la liste indicative montrée au client), avec copier-coller pour l'envoi.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { DOC_CHECKLIST, checklistToText } from '@/lib/docChecklist';

export function DocChecklistPanel({ activitySlug }: { activitySlug?: string }) {
  const [copied, setCopied] = useState(false);
  const c = activitySlug ? DOC_CHECKLIST[activitySlug] : undefined;
  if (!c) return <p className="text-sm text-muted-foreground">Pas de checklist pour cette activité.</p>;
  const copy = async () => {
    try { await navigator.clipboard.writeText(checklistToText(activitySlug!)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard indispo */ }
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">Aide-mémoire interne — la liste exacte à demander au prospect ({c.label}).</p>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}{copied ? 'Copié' : 'Copier pour le client'}
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {c.docs.map((g, i) => (
          <div key={i} className="border rounded-lg p-3 bg-background">
            <div className="text-xs font-semibold mb-2">{g.cat}</div>
            <ul className="space-y-1.5">
              {g.items.map((it, j) => (
                <li key={j} className="flex gap-2 text-sm">
                  <span className={`mt-[6px] w-2 h-2 rounded-[2px] shrink-0 ${it.req ? 'bg-primary' : 'border border-muted-foreground/40'}`} />
                  <span><span className="font-medium">{it.t}</span>{it.note && <span className="text-muted-foreground text-xs"> — {it.note}</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {!!c.params?.length && (
        <div className="border rounded-lg p-3 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-500 mb-1.5">À définir ensemble (pas des documents — onboarding)</div>
          <ul className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {c.params.map((p, i) => (
              <li key={i} className="flex gap-2"><span className="mt-[6px] w-2 h-2 rotate-45 bg-amber-500 shrink-0" /><span>{p}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
