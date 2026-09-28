// Panneau de marque des pages d'accès (connexion, bienvenue) : promesse Daftime + aperçu animé du produit.
// Chiffres ILLUSTRATIFS (aucun client réel).
import { BrandLockup } from '@/components/layout/BrandLockup';
import { CountUp, motion, useReducedMotion } from '@/components/motion';

const PILLARS = [
  { t: 'Ta vraie marge', d: 'Du chiffre d\'affaires à ce qu\'il te reste après produits, logistique et pub.' },
  { t: 'Ta pub face à son point mort', d: 'Ce que rapporte 1 € investi, comparé à ce qu\'il faut pour être rentable.' },
  { t: 'Ta trésorerie à 13 semaines', d: 'Le point bas à venir, et les délais à négocier pour le relever.' },
];

export function AuthVisual({ headline = 'Pilote ta marge,\npas ton chiffre d\'affaires.' }: { headline?: string }) {
  const reduce = useReducedMotion();
  const eur = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  const bars = [62, 48, 71, 55, 83, 77, 94];
  return (
    <div className="brand-panel !rounded-none h-full min-h-screen p-10 xl:p-14 flex flex-col justify-between">
      <div className="relative z-[1]"><BrandLockup variant="light" center={false} /></div>

      <div className="relative z-[1] grid gap-10">
        <motion.h1 initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.05] whitespace-pre-line text-balance">{headline}</motion.h1>

        {/* Aperçu produit (illustratif) */}
        <motion.div initial={reduce ? false : { opacity: 0, y: 24, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: -1 }} transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md rounded-2xl bg-white/[0.07] ring-1 ring-white/15 p-5 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between text-[10.5px] tracking-[0.12em] uppercase text-white/50 font-mono">
            <span>Ce mois-ci</span><span className="rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] px-2 py-0.5 tracking-normal normal-case font-sans font-semibold">Nouveau rapport</span>
          </div>
          <div className="mt-3 text-white/60 text-sm">Marge après pub</div>
          <CountUp value={28450} format={eur} duration={1.6} className="num block text-4xl font-semibold mt-0.5" />
          <div className="mt-4 flex items-end gap-1.5 h-16">
            {bars.map((h, i) => (
              <motion.div key={i} className={`flex-1 rounded-t ${i === bars.length - 1 ? 'bg-[hsl(var(--accent))]' : 'bg-white/25'}`}
                initial={reduce ? false : { height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.8, delay: 0.4 + i * 0.06, ease: [0.22, 1, 0.36, 1] }} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-400/15 text-emerald-200 px-2.5 py-1">Pub au-dessus du point mort</span>
            <span className="rounded-full bg-white/10 text-white/80 px-2.5 py-1">Point bas tréso : 64 k€</span>
          </div>
        </motion.div>

        <ul className="grid gap-4 max-w-md">
          {PILLARS.map((p, i) => (
            <motion.li key={p.t} initial={reduce ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] shrink-0" />
              <div><div className="font-medium">{p.t}</div><div className="text-sm text-white/60">{p.d}</div></div>
            </motion.li>
          ))}
        </ul>
      </div>

      <p className="relative z-[1] text-xs text-white/40">© {new Date().getFullYear()} Daftime Advisory · Aperçu illustratif</p>
    </div>
  );
}
