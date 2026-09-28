// Briques d'animation du front v2 (Framer Motion). Sobres, courtes, et coupées quand le système demande
// moins d'animations (prefers-reduced-motion) : on affiche alors directement l'état final.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useInView, useReducedMotion, type Variants } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

// Conteneur qui fait apparaître ses enfants <Item> en cascade.
const parent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const child: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} variants={parent} initial={reduce ? false : 'hidden'} animate="show">{children}</motion.div>;
}
export function Item({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} variants={child}>{children}</motion.div>;
}

// Transition entre vues (onglets) : fondu + léger glissement.
export function PageFade({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div key={id} className={className} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
      {children}
    </motion.div>
  );
}

// Nombre qui « compte » jusqu'à sa valeur quand il devient visible.
export function CountUp({ value, format, duration = 1.1, className }: { value: number; format: (v: number) => string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setShown(value); return; }
    if (!inView) return;
    const c = animate(0, value, { duration, ease: EASE, onUpdate: (v) => setShown(v) });
    return () => c.stop();
  }, [inView, value, duration, reduce]);
  return <span ref={ref} className={className}>{format(shown)}</span>;
}

// Barre horizontale qui se remplit (pourcentage 0-100).
export function GrowBar({ pct, className, delay = 0 }: { pct: number; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { width: 0 }} whileInView={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE, delay }} style={reduce ? { width: `${pct}%` } : undefined} />
  );
}

// Apparition au défilement (sections plus bas dans la page).
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

// Squelette de chargement (reflet qui balaie).
export function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted ${className ?? ''}`}>
      <motion.div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} />
    </div>
  );
}

export { motion, useReducedMotion, EASE };
