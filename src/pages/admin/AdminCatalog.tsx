// Éditeur de catalogue d'indicateurs d'une activité (activity_types.config).
// Lignes (inputs + dérivés via formule), checks (expression), sections. Sauvegarde en base.
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

type Line = { id: string; label: string; section: string; unit?: string; formula?: string; total?: boolean; core?: boolean; note?: string };
type Check = { id: string; label: string; severity: string; expr: string };
type Cat = { slug?: string; sections: { key: string; label: string }[]; lines: Line[]; checks: Check[]; documents?: string[] };

export default function AdminCatalog() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [at, setAt] = useState<any>(null);
  const [cat, setCat] = useState<Cat>({ sections: [], lines: [], checks: [] });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('activity_types' as any).select('id, slug, name, config').eq('id', id).maybeSingle();
    setAt(data);
    const cfg = (data as any)?.config;
    if (cfg && Array.isArray(cfg.lines)) setCat({ slug: cfg.slug ?? (data as any)?.slug, sections: cfg.sections ?? [], lines: cfg.lines, checks: cfg.checks ?? [], documents: cfg.documents ?? [] });
    else setCat({ slug: (data as any)?.slug, sections: [], lines: [], checks: [], documents: (cfg as any)?.documents ?? [] });
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const upd = (patch: Partial<Cat>) => { setCat((c) => ({ ...c, ...patch })); setSaved(false); };
  const setLine = (i: number, p: Partial<Line>) => upd({ lines: cat.lines.map((l, idx) => (idx === i ? { ...l, ...p } : l)) });
  const setCheck = (i: number, p: Partial<Check>) => upd({ checks: cat.checks.map((c, idx) => (idx === i ? { ...c, ...p } : c)) });
  const setSection = (i: number, p: Partial<{ key: string; label: string }>) => upd({ sections: cat.sections.map((s, idx) => (idx === i ? { ...s, ...p } : s)) });

  const save = async () => {
    setBusy(true); setError(null);
    const config = { slug: cat.slug ?? at?.slug, sections: cat.sections, lines: cat.lines, checks: cat.checks, documents: cat.documents ?? [] };
    const { error } = await supabase.from('activity_types' as any).update({ config }).eq('id', id);
    setBusy(false);
    if (error) setError(error.message); else setSaved(true);
  };

  if (!at) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <AppShell title={`Catalogue — ${at.name}`} maxWidth="max-w-5xl" onBack={() => navigate('/admin/activities')}
      actions={<><span className="text-xs text-primary-foreground/70 hidden sm:inline">{cat.lines.length} lignes</span>
        <Button variant="ghost" size="sm" onClick={save} disabled={busy} className="text-primary-foreground hover:bg-white/10"><Save className="w-4 h-4 mr-1" /> {busy ? '…' : 'Enregistrer'}</Button>
        {saved && <span className="text-xs text-emerald-300">✓</span>}</>}>
      <div className="space-y-6">
        {error && <div className="border border-destructive text-destructive rounded-lg px-4 py-2 text-sm">{error}</div>}
        <p className="text-sm text-muted-foreground">
          Une ligne <strong>sans formule</strong> = donnée extraite des fichiers. Avec <strong>formule</strong> = calculée par le code (ex. <code>ca - cogs</code>, <code>sum(a, b, c)</code>, <code>aov / cac</code>). Unité <code>CUR</code> = devise du client. Les checks signalent une incohérence quand l'expression est fausse (ex. <code>present(ca) &amp;&amp; ca &gt; 0</code>).
        </p>

        {/* Documents recommandés */}
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Documents recommandés</h2>
            <Button size="sm" variant="outline" onClick={() => upd({ documents: [...(cat.documents ?? []), ''] })}><Plus className="w-4 h-4 mr-1" /> Document</Button></div>
          <p className="text-xs text-muted-foreground mb-2">Affichés au client dans « Documents à fournir ».</p>
          <div className="space-y-2">
            {(cat.documents ?? []).map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={d} onChange={(e) => upd({ documents: (cat.documents ?? []).map((x, idx) => (idx === i ? e.target.value : x)) })} className="h-8 flex-1" placeholder="Relevé bancaire du mois…" />
                <button onClick={() => upd({ documents: (cat.documents ?? []).filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {(cat.documents ?? []).length === 0 && <p className="text-sm text-muted-foreground">Aucun document — une liste générique est utilisée.</p>}
          </div>
        </section>

        {/* Sections */}
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Sections</h2>
            <Button size="sm" variant="outline" onClick={() => upd({ sections: [...cat.sections, { key: `section_${cat.sections.length + 1}`, label: 'Nouvelle section' }] })}><Plus className="w-4 h-4 mr-1" /> Section</Button></div>
          <div className="space-y-2">
            {cat.sections.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={s.key} onChange={(e) => setSection(i, { key: e.target.value })} className="h-8 w-40 font-mono text-xs" placeholder="clé" />
                <Input value={s.label} onChange={(e) => setSection(i, { label: e.target.value })} className="h-8 flex-1" placeholder="Libellé" />
                <button onClick={() => upd({ sections: cat.sections.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Lignes */}
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Indicateurs ({cat.lines.length})</h2>
            <Button size="sm" variant="outline" onClick={() => upd({ lines: [...cat.lines, { id: '', label: '', section: cat.sections[0]?.key ?? '' }] })}><Plus className="w-4 h-4 mr-1" /> Ligne</Button></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b">
                <th className="px-1 py-1 w-28">ID</th><th className="px-1 py-1">Libellé</th><th className="px-1 py-1 w-28">Section</th>
                <th className="px-1 py-1 w-16">Unité</th><th className="px-1 py-1">Formule (vide = input)</th>
                <th className="px-1 py-1 w-8" title="Total">T</th><th className="px-1 py-1 w-8" title="Cœur">C</th><th className="w-6"></th>
              </tr></thead>
              <tbody>
                {cat.lines.map((l, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-1 py-1"><Input value={l.id} onChange={(e) => setLine(i, { id: e.target.value })} className="h-7 font-mono text-xs" /></td>
                    <td className="px-1 py-1"><Input value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} className="h-7" /></td>
                    <td className="px-1 py-1">
                      <select value={l.section} onChange={(e) => setLine(i, { section: e.target.value })} className="h-7 w-full rounded border bg-background px-1 text-xs">
                        {cat.sections.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-1"><Input value={l.unit ?? ''} onChange={(e) => setLine(i, { unit: e.target.value })} className="h-7 text-xs" /></td>
                    <td className="px-1 py-1"><Input value={l.formula ?? ''} onChange={(e) => setLine(i, { formula: e.target.value || undefined })} className="h-7 font-mono text-xs" placeholder="—" /></td>
                    <td className="px-1 py-1 text-center"><input type="checkbox" checked={!!l.total} onChange={(e) => setLine(i, { total: e.target.checked })} /></td>
                    <td className="px-1 py-1 text-center"><input type="checkbox" checked={!!l.core} onChange={(e) => setLine(i, { core: e.target.checked })} /></td>
                    <td className="px-1 py-1"><button onClick={() => upd({ lines: cat.lines.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Checks */}
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Vérifications ({cat.checks.length})</h2>
            <Button size="sm" variant="outline" onClick={() => upd({ checks: [...cat.checks, { id: '', label: '', severity: 'warn', expr: '' }] })}><Plus className="w-4 h-4 mr-1" /> Vérification</Button></div>
          <div className="space-y-2">
            {cat.checks.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <select value={c.severity} onChange={(e) => setCheck(i, { severity: e.target.value })} className="h-8 rounded border bg-background px-1.5 text-xs">
                  <option value="error">Erreur</option><option value="warn">Alerte</option>
                </select>
                <Input value={c.label} onChange={(e) => setCheck(i, { label: e.target.value })} className="h-8 flex-1" placeholder="Message si incohérent" />
                <Input value={c.expr} onChange={(e) => setCheck(i, { expr: e.target.value })} className="h-8 flex-1 font-mono text-xs" placeholder="present(ca) && ca > 0" />
                <button onClick={() => upd({ checks: cat.checks.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
