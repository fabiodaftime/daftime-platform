// LES 3 POINTS DU MOIS — relecture et réécriture par le conseiller avant envoi au client.
// Enregistrer re-rend le rapport (même mise en page) ; « Revenir aux points calculés » remet ceux du moteur.
import { useEffect, useState } from 'react';
import { invokeFn } from '@/lib/genericApi';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';

type Tone = 'good' | 'warn' | 'info';
type Point = { text: string; tone: Tone };
const TONES: { k: Tone; label: string; dot: string }[] = [
  { k: 'good', label: 'Positif', dot: 'bg-[hsl(var(--good))]' },
  { k: 'warn', label: 'À surveiller', dot: 'bg-[hsl(var(--warn))]' },
  { k: 'info', label: 'Info', dot: 'bg-sky-400' },
];

export function PointsEditor({ dash, onSaved }: { dash: { id: string; data_json?: any }; onSaved: (d: any) => void }) {
  const dj = dash.data_json ?? {};
  const fromDash = (): Point[] => {
    const pts = ((dj.points ?? []) as { text?: string; tone?: string }[]).slice(0, 3).map((p) => ({ text: p.text ?? '', tone: (['good', 'warn', 'info'].includes(p.tone ?? '') ? p.tone : 'info') as Tone }));
    while (pts.length < 3) pts.push({ text: '', tone: 'info' });
    return pts;
  };
  const [pts, setPts] = useState<Point[]>(fromDash);
  const [busy, setBusy] = useState<'save' | 'reset' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setPts(fromDash()); setMsg(null); }, [dash.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = JSON.stringify(pts.filter((p) => p.text.trim())) !== JSON.stringify(fromDash().filter((p) => p.text.trim()));
  const run = async (action: 'set_points' | 'reset_points') => {
    setBusy(action === 'set_points' ? 'save' : 'reset'); setMsg(null);
    try {
      const r = await invokeFn<{ dashboard: any; summary: string }>('dashboard-chat', { dashboard_id: dash.id, action, ...(action === 'set_points' ? { points: pts.filter((p) => p.text.trim()) } : {}) });
      setMsg(r.summary); onSaved(r.dashboard);
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {dj.points_manual ? 'Points réécrits à la main. ' : 'Points calculés par le moteur (chiffres garantis). '}
        Une ligne chacun : constat chiffré + ce qu'il faut regarder. Une régénération du rapport remet les points calculés.
      </p>
      {pts.map((p, i) => (
        <div key={i} className="flex gap-3">
          <span className="mt-2 h-6 w-6 shrink-0 rounded-full bg-muted grid place-items-center text-xs font-semibold font-mono">{i + 1}</span>
          <div className="flex-1 space-y-1.5">
            <textarea value={p.text} rows={2} onChange={(e) => setPts(pts.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              placeholder={i === 0 ? 'Le shop gagne-t-il de l’argent, et où ?' : i === 1 ? 'L’acquisition est-elle rentable ?' : 'Le point à regarder ce mois-ci'}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-primary/25" />
            <div className="flex gap-1.5">
              {TONES.map((t) => (
                <button key={t.k} type="button" onClick={() => setPts(pts.map((x, j) => (j === i ? { ...x, tone: t.k } : x)))}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition ${p.tone === t.k ? 'bg-muted font-medium border-foreground/20' : 'text-muted-foreground hover:bg-muted/60'}`}>
                  <span className={`h-2 w-2 rounded-full ${t.dot}`} />{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" onClick={() => run('set_points')} disabled={!!busy || !dirty || !pts.some((p) => p.text.trim())}>
          {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Enregistrer les 3 points'}
        </Button>
        {dj.points_manual && (
          <Button size="sm" variant="ghost" onClick={() => run('reset_points')} disabled={!!busy}>
            {busy === 'reset' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><RotateCcw className="w-3.5 h-3.5 mr-1.5" />Revenir aux points calculés</>}
          </Button>
        )}
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
