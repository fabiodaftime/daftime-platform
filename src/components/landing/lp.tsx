// Briques des landing pages (front v2) : apparition au défilement, compteur, aperçu produit.
// Volontairement SANS framer-motion : la LP pub est dans le bundle principal, elle doit rester légère
// (vitesse d'affichage = coût par lead). Tout est en CSS (index.css, section « Landing v2 »).
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** true dès que l'élément entre dans l'écran (une seule fois). */
export function useInView<T extends Element>(margin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [inView, margin]);
  return [ref, inView] as const;
}

/** Bloc qui apparaît en fondu en entrant dans l'écran. `delay` en ms pour échelonner une liste. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <Tag ref={ref as never} className={`lp-reveal ${inView ? 'in' : ''} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}

/** Nombre qui monte jusqu'à `value` quand `run` passe à true (immédiat si l'utilisateur limite les animations). */
export function useCountUp(value: number, run: boolean, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(value); return; }
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const p = Math.min(1, (t - t0) / ms); setV(value * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, run, ms]);
  return v;
}

export const eur = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

// ── Aperçu produit : l'espace client tel que le client le voit (données FICTIVES, cohérentes avec l'exemple de la LP). ──
const CASCADE = [
  { l: "Chiffre d'affaires", v: 136840, pct: 100 },
  { l: 'Après coût des produits', v: 82100, pct: 60 },
  { l: 'Après logistique & paiement', v: 49260, pct: 36 },
  { l: 'Après pub', v: -2700, pct: 2, bad: true },
];
const POINTS = [
  { c: 'bg-[hsl(var(--bad))]', t: 'Ta pub achète du CA à perte : 2 campagnes à 1,8 pour un point mort à 2,4.' },
  { c: 'bg-[hsl(var(--warn))]', t: 'Ta gamme lin marge 3× plus que le coton, mais ne reçoit que 20 % du budget.' },
  { c: 'bg-[hsl(var(--good))]', t: 'Paie tes fournisseurs à 30 jours : 3 semaines de trésorerie regagnées.' },
];

export function ProductPreview({ className = '' }: { className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>('0px');
  const cm3 = useCountUp(-2700, inView, 1600);
  return (
    <div ref={ref} className={`lp-product ${inView ? 'in' : ''} ${className}`} aria-label="Aperçu de l'espace client Daftime (exemple fictif)">
      <div className="rounded-2xl bg-card text-foreground shadow-[0_40px_80px_-30px_hsl(238_60%_8%/0.7)] ring-1 ring-black/5 overflow-hidden">
        {/* barre de fenêtre */}
        <div className="flex items-center gap-1.5 px-4 h-9 border-b bg-muted/60">
          <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" /><span className="w-2.5 h-2.5 rounded-full bg-foreground/15" /><span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
          <span className="ml-3 text-[11px] text-muted-foreground font-mono">Ton espace · Daftime</span>
        </div>
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full border px-3 py-1 text-xs font-medium">Juin</span>
            <span className="rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] px-2.5 py-1 text-[11px] font-semibold">Nouveau rapport</span>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Ce que ton shop a vraiment gagné</div>
            <div className="num text-4xl sm:text-[2.6rem] font-semibold tracking-tight text-[hsl(var(--bad))] leading-tight">{eur(Math.round(cm3))}</div>
            <div className="text-xs text-muted-foreground mt-0.5">après pub · pour 136 840 € de CA (+12 %)</div>
          </div>
          <div className="space-y-2.5">
            {CASCADE.map((c, i) => (
              <div key={c.l}>
                <div className="flex justify-between text-[12px]"><span className={c.bad ? 'font-semibold' : 'text-muted-foreground'}>{c.l}</span><span className={`num font-medium ${c.bad ? 'text-[hsl(var(--bad))]' : ''}`}>{eur(c.v)}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`lp-bar h-full rounded-full ${c.bad ? 'bg-[hsl(var(--bad))]' : 'bg-primary'}`} style={{ width: `${c.pct}%`, transitionDelay: `${300 + i * 120}ms` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="eyebrow">Les 3 points du mois</div>
            <ol className="mt-2.5 space-y-2">
              {POINTS.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-[12.5px] leading-snug"><span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${p.c}`} />{p.t}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
