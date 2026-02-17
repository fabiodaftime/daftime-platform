import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Pencil, Send, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  author_name: string;
  user_id: string;
  section: string;
  created_at: string;
}

interface LabarileCommentsPageProps {
  companyId: string;
}

const SECTIONS = [
  { id: 'labarile', label: 'Labarile', color: 'bg-labarile-primary', textColor: 'text-labarile-primary-dark', bgLight: 'bg-labarile-ice1', border: 'border-labarile-primary' },
  { id: 'daftime', label: 'Daftime', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-400' },
];

export function LabarileCommentsPage({ companyId }: LabarileCommentsPageProps) {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState<Record<string, string>>({ labarile: '', daftime: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [companyId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('dashboard_comments')
      .select('*')
      .eq('company_id', companyId)
      .in('section', ['labarile', 'daftime'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  const handlePost = async (section: string) => {
    const content = newComment[section]?.trim();
    if (!content || !user) return;

    const { error } = await supabase.from('dashboard_comments').insert({
      company_id: companyId,
      user_id: user.id,
      author_name: user.email || 'Utilisateur',
      section,
      content,
    });

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de poster le commentaire', variant: 'destructive' });
    } else {
      setNewComment(prev => ({ ...prev, [section]: '' }));
      fetchComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from('dashboard_comments').delete().eq('id', commentId);
    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    } else {
      fetchComments();
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    const { error } = await supabase.from('dashboard_comments').update({ content: editContent.trim() }).eq('id', commentId);
    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de modifier', variant: 'destructive' });
    } else {
      setEditingId(null);
      fetchComments();
    }
  };

  const canEditComment = (comment: Comment) => isSuperAdmin || comment.user_id === user?.id;
  const canDeleteComment = (comment: Comment) => isSuperAdmin || comment.user_id === user?.id;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-labarile-primary-dark border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {SECTIONS.map((section) => {
        const sectionComments = comments.filter(c => c.section === section.id);
        return (
          <div key={section.id} className={cn("rounded-xl border-2 overflow-hidden", section.border)}>
            {/* Section Header */}
            <div className={cn("px-5 py-3 flex items-center gap-3", section.bgLight)}>
              <div className={cn("w-3 h-3 rounded-full", section.color)} />
              <h3 className={cn("font-bebas text-xl tracking-wide", section.textColor)}>
                💬 Commentaires {section.label}
              </h3>
              <span className="ml-auto text-xs font-medium text-labarile-muted">{sectionComments.length} commentaire{sectionComments.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Post new comment */}
            <div className="p-4 border-b border-labarile-border bg-labarile-white">
              <div className="flex gap-2">
                <textarea
                  value={newComment[section.id] || ''}
                  onChange={(e) => setNewComment(prev => ({ ...prev, [section.id]: e.target.value }))}
                  placeholder={`Écrire un commentaire ${section.label}...`}
                  className="flex-1 min-h-[60px] p-3 border border-labarile-border rounded-lg text-sm resize-y focus:outline-none focus:border-labarile-primary"
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handlePost(section.id); }}
                />
                <button
                  onClick={() => handlePost(section.id)}
                  disabled={!newComment[section.id]?.trim()}
                  className={cn(
                    "self-end p-3 rounded-lg transition-colors",
                    newComment[section.id]?.trim()
                      ? "bg-labarile-primary text-white hover:bg-labarile-primary-dark"
                      : "bg-labarile-light-gray text-labarile-muted cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-labarile-muted mt-1">⌘+Entrée pour envoyer</p>
            </div>

            {/* Comments list */}
            <div className="divide-y divide-labarile-border">
              {sectionComments.length === 0 ? (
                <div className="p-6 text-center text-sm text-labarile-muted">Aucun commentaire pour le moment.</div>
              ) : (
                sectionComments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-labarile-white hover:bg-labarile-light-gray/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-labarile-title">{comment.author_name}</span>
                          <span className="text-[10px] text-labarile-muted">{formatDate(comment.created_at)}</span>
                        </div>
                        {editingId === comment.id ? (
                          <div className="flex gap-2 items-start">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="flex-1 min-h-[50px] p-2 border border-labarile-primary rounded-lg text-sm resize-y focus:outline-none"
                              autoFocus
                            />
                            <button onClick={() => handleEdit(comment.id)} className="p-1.5 text-labarile-success hover:bg-emerald-50 rounded"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-labarile-muted hover:bg-labarile-light-gray rounded"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <p className="text-sm text-labarile-text whitespace-pre-wrap">{comment.content}</p>
                        )}
                      </div>
                      {editingId !== comment.id && (
                        <div className="flex gap-1 shrink-0">
                          {canEditComment(comment) && (
                            <button
                              onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                              className="p-1.5 text-labarile-muted hover:text-labarile-primary hover:bg-labarile-ice1 rounded transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDeleteComment(comment) && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="p-1.5 text-labarile-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
