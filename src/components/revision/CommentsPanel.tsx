import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RevisionComment } from './types';

interface Props {
  cycleId: string;
  fileId: string;
  comments: RevisionComment[];
  onChange: () => void;
}

export function CommentsPanel({ cycleId, fileId, comments, onChange }: Props) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [reviewNote, setReviewNote] = useState(false);

  const submit = async () => {
    if (!body.trim() || !user) return;
    await supabase.from('revision_comments').insert({
      cycle_id: cycleId,
      revision_file_id: fileId,
      author_id: user.id,
      author_name: user.email?.split('@')[0] || 'Utilisateur',
      body: body.trim(),
      is_review_note: reviewNote,
    });
    setBody('');
    setReviewNote(false);
    onChange();
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Commentaires ({comments.length})
      </h4>

      <div className="space-y-2">
        <Textarea placeholder="Ajouter un commentaire..." value={body} onChange={(e) => setBody(e.target.value)} rows={2} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={reviewNote} onCheckedChange={(v) => setReviewNote(!!v)} />
            Note de revue (manager)
          </label>
          <Button size="sm" onClick={submit} disabled={!body.trim()}>Publier</Button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-auto">
        {comments.map((c) => (
          <div key={c.id} className={cn('p-2 rounded-md border text-sm', c.is_review_note && 'border-blue-500/30 bg-blue-500/5')}>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-medium text-foreground">{c.author_name}</span>
              <span>{new Date(c.created_at).toLocaleString('fr-FR')}</span>
            </div>
            <p className="whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
