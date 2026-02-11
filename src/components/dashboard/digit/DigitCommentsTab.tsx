import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Trash2 } from 'lucide-react';
import { D } from './DigitData';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  user_id: string;
}

export function DigitCommentsTab() {
  const { id: companyId } = useParams();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companyId) fetchComments();
  }, [companyId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('dashboard_comments')
      .select('*')
      .eq('company_id', companyId!)
      .order('created_at', { ascending: false });
    if (data) setComments(data as Comment[]);
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !user || !companyId) return;
    setLoading(true);
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
    const authorName = profile?.full_name || profile?.email || user.email || 'Anonyme';
    const { error } = await supabase.from('dashboard_comments').insert({
      company_id: companyId,
      user_id: user.id,
      author_name: authorName,
      content: newComment.trim(),
    });
    if (!error) { setNewComment(''); fetchComments(); }
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from('dashboard_comments').delete().eq('id', commentId);
    fetchComments();
  };

  return (
    <div>
      <h2 className="digit-section-title">Commentaires - Janvier 2026</h2>

      <div className="digit-chart-container" style={{ marginBottom: 24 }}>
        <h3 style={{ color: D.primary, fontSize: 18, fontWeight: 600, marginBottom: 16 }}>💬 Écrire un commentaire</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <Textarea
            placeholder="Saisir votre commentaire ici..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ flex: 1, minHeight: 80, borderRadius: 8, border: '2px solid ' + D.borderLight, fontFamily: 'inherit', fontSize: 14 }}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
          />
          <Button onClick={handleSubmit} disabled={loading || !newComment.trim()}
            style={{ background: `linear-gradient(135deg, ${D.primary}, ${D.accent})`, borderRadius: 8, alignSelf: 'flex-end', fontWeight: 600 }}>
            <Send className="w-4 h-4 mr-2" /> Envoyer
          </Button>
        </div>

        {comments.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '2px solid ' + D.border }}>
            {comments.map((c) => (
              <div key={c.id} style={{
                background: D.surfaceAlt, padding: '14px 18px', borderRadius: 8, marginBottom: 10,
                borderLeft: '3px solid ' + D.accent,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{c.author_name}</span>
                    <span style={{ fontSize: 12, color: D.textSecondary, fontWeight: 500 }}>
                      📅 {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {user?.id === c.user_id && (
                    <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.red, padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 14, color: D.text, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
