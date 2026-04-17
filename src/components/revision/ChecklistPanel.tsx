import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, AlertTriangle } from 'lucide-react';
import type { RevisionChecklistItem, RevisionChecklistStatus } from './types';
import { cn } from '@/lib/utils';

interface Props {
  items: RevisionChecklistItem[];
  onChange: () => void;
}

export function ChecklistPanel({ items, onChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const setStatus = async (id: string, status: RevisionChecklistStatus) => {
    const patch: any = { status };
    if (status === 'done') {
      patch.done_by = user?.id;
      patch.done_at = new Date().toISOString();
    } else {
      patch.done_by = null;
      patch.done_at = null;
    }
    const { error } = await supabase.from('revision_checklist_items').update(patch).eq('id', id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else onChange();
  };

  const saveNote = async (id: string) => {
    await supabase.from('revision_checklist_items').update({ note: noteDraft }).eq('id', id);
    setOpenNote(null);
    setNoteDraft('');
    onChange();
  };

  if (!items.length) {
    return <div className="text-sm text-muted-foreground p-4">Aucun item de checklist.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div
          key={it.id}
          className={cn(
            'flex items-start gap-3 p-3 rounded-md border bg-card',
            it.status === 'done' && 'border-green-500/30 bg-green-500/5',
            it.status === 'anomaly' && 'border-red-500/30 bg-red-500/5',
          )}
        >
          <Checkbox
            checked={it.status === 'done'}
            onCheckedChange={(v) => setStatus(it.id, v ? 'done' : 'todo')}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-sm font-medium', it.status === 'done' && 'line-through text-muted-foreground')}>
                {it.label}
              </span>
              {it.is_mandatory && <Badge variant="outline" className="text-[10px]">Obligatoire</Badge>}
              {it.evidence_required && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Paperclip className="w-3 h-3" /> Justificatif
                </Badge>
              )}
            </div>
            {it.note && <p className="text-xs text-muted-foreground mt-1">📝 {it.note}</p>}
            {openNote === it.id && (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Note..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveNote(it.id)}>Enregistrer</Button>
                  <Button size="sm" variant="ghost" onClick={() => setOpenNote(null)}>Annuler</Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setOpenNote(it.id); setNoteDraft(it.note || ''); }}
            >
              Note
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStatus(it.id, 'na')}
              className={cn(it.status === 'na' && 'bg-muted')}
            >
              N/A
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStatus(it.id, 'anomaly')}
              className={cn('text-red-600', it.status === 'anomaly' && 'bg-red-500/10')}
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
