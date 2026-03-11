import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Trash2 } from 'lucide-react';
import { C, type PCAMonthData } from './PrimeCircleAgencyData';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface Props { data: PCAMonthData; }

export function PCARisksTab({ data }: Props) {
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
      company_id: companyId, user_id: user.id, author_name: authorName, content: newComment.trim(),
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
      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Indicateurs Cles de Risque - {data.monthLabel}</h3>
          <p className="pca-section-subtitle">{data.riskKPIs.length} points d'attention identifies</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
          {data.riskKPIs.map((item, i) => (
            <div key={i} style={{
              background: item.c === C.redText ? C.redSoft : item.c === C.greenText ? C.greenSoft : C.orangeSoft,
              borderRadius: 12, padding: '16px 14px', textAlign: 'center',
              border: '1px solid ' + C.border,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{item.l}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.c }}>{item.v}</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{item.s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pca-section" style={{ marginTop: 18 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">💬 Commentaires</h3>
          <p className="pca-section-subtitle">Notes et observations partagées sur ce dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <Textarea
            placeholder="Écrire un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ flex: 1, minHeight: 60, borderRadius: 12, border: '1px solid ' + C.border, fontFamily: 'inherit', fontSize: 13 }}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
          />
          <Button onClick={handleSubmit} disabled={loading || !newComment.trim()} style={{ background: C.primary, borderRadius: 12, alignSelf: 'flex-end' }}>
            <Send className="w-4 h-4 mr-2" />
            Envoyer
          </Button>
        </div>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: C.textMuted, fontSize: 13 }}>
            Aucun commentaire pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ background: C.surfaceAlt, borderRadius: 12, padding: '14px 18px', border: '1px solid ' + C.borderLight }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.author_name}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {user?.id === c.user_id && (
                    <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
