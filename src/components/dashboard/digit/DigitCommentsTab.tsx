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
  section: string;
}

const SECTIONS = [
  { id: 'alexandre', label: '👤 Commentaires Alexandre', color: D.primary },
  { id: 'prime_circle', label: '🏢 Commentaires Prime Circle Management', color: D.accent },
  { id: 'daftime', label: '📊 Commentaires Fabio / Daftime', color: D.green },
];

export function DigitCommentsTab() {
  const { id: companyId } = useParams();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComments, setNewComments] = useState<Record<string, string>>({ alexandre: '', prime_circle: '', daftime: '' });
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) fetchComments();
  }, [companyId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('dashboard_comments')
      .select('*')
      .eq('company_id', companyId!)
      .order('created_at', { ascending: false });
    if (data) setComments(data.map(c => ({ ...c, section: (c as any).section || 'alexandre' })) as Comment[]);
  };

  const handleSubmit = async (sectionId: string) => {
    const text = newComments[sectionId];
    if (!text?.trim() || !user || !companyId) return;
    setLoading(sectionId);
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
    const authorName = profile?.full_name || profile?.email || user.email || 'Anonyme';
    const { error } = await supabase.from('dashboard_comments').insert({
      company_id: companyId,
      user_id: user.id,
      author_name: authorName,
      content: text.trim(),
      section: sectionId,
    } as any);
    if (!error) { setNewComments(prev => ({ ...prev, [sectionId]: '' })); fetchComments(); }
    setLoading(null);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from('dashboard_comments').delete().eq('id', commentId);
    fetchComments();
  };

  return (
    <div>
      <h2 className="digit-section-title">Commentaires - Janvier 2026</h2>

      {SECTIONS.map((section) => {
        const sectionComments = comments.filter(c => c.section === section.id);
        return (
          <div key={section.id} className="digit-chart-container" style={{ marginBottom: 24 }}>
            <h3 style={{ color: section.color, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{section.label}</h3>

            <div style={{ display: 'flex', gap: 12 }}>
              <Textarea
                placeholder={`Écrire un commentaire dans "${section.label.replace(/^[^ ]+ /, '')}"...`}
                value={newComments[section.id]}
                onChange={(e) => setNewComments(prev => ({ ...prev, [section.id]: e.target.value }))}
                style={{ flex: 1, minHeight: 70, borderRadius: 8, border: '2px solid ' + D.borderLight, fontFamily: 'inherit', fontSize: 14 }}
                onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleSubmit(section.id); }}
              />
              <Button onClick={() => handleSubmit(section.id)} disabled={loading === section.id || !newComments[section.id]?.trim()}
                style={{ background: section.color, borderRadius: 8, alignSelf: 'flex-end', fontWeight: 600 }}>
                <Send className="w-4 h-4 mr-2" /> Envoyer
              </Button>
            </div>

            {sectionComments.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px solid ' + D.border }}>
                {sectionComments.map((c) => (
                  <div key={c.id} style={{
                    background: D.surfaceAlt, padding: '12px 16px', borderRadius: 8, marginBottom: 8,
                    borderLeft: '3px solid ' + section.color,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{c.author_name}</span>
                        <span style={{ fontSize: 12, color: D.textSecondary }}>
                          {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

            {sectionComments.length === 0 && (
              <p style={{ marginTop: 12, fontSize: 13, color: D.textMuted, fontStyle: 'italic' }}>Aucun commentaire pour le moment.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
