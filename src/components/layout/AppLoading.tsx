// Écran d'attente unique du front v2 : même cadre que l'AppShell (barre du haut, logo, emplacements du contenu)
// + fin liseré de progression en haut. Invisible si le chargement est rapide (apparition différée), et enchaîné
// sans clignoter quand plusieurs attentes se succèdent (code de la page → session → données).
import { useEffect, useState } from 'react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import { useV2Theme } from './theme';

// Chaîne d'écrans d'attente : l'apparition différée (APPEAR_DELAY) part du PREMIER écran de la chaîne ; les suivants
// reprennent le fondu là où il en était (délai négatif) → aucun clignotement quand un écran en remplace un autre.
const APPEAR_DELAY = 220;
let active = 0, lastHidden = 0, chainStart = 0;

export function AppLoading({ nav = false, maxWidth = 'max-w-6xl' }: { nav?: boolean; maxWidth?: string }) {
  useV2Theme();
  const [delay] = useState(() => {
    const now = performance.now();
    if (active === 0 && now - lastHidden > 150) chainStart = now;
    return APPEAR_DELAY - (now - chainStart);
  });
  useEffect(() => { active++; return () => { active--; lastHidden = performance.now(); }; }, []);
  const block = 'v2-skel rounded-2xl';
  return (
    <div className="v2 v2-loading min-h-screen" style={{ animationDelay: `${Math.round(delay)}ms` }} aria-busy="true" aria-label="Chargement">
      <div className="v2-progress" />
      <header className="glass sticky top-0 z-30 border-b">
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 h-16 flex items-center gap-3`}>
          <img src={daftimeLogo} alt="Daftime" className="logo-auto h-[20px] w-auto shrink-0" />
          <div className="flex-1" />
          <div className="v2-skel h-9 w-9 rounded-full" />
        </div>
      </header>
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 ${nav ? 'lg:grid-cols-[228px_1fr]' : ''} gap-8`}>
        {nav && (
          <div className="hidden lg:block space-y-2.5 pt-1">
            {[70, 55, 62, 48, 58].map((w, i) => <div key={i} className="v2-skel h-5 rounded-md" style={{ width: `${w}%` }} />)}
          </div>
        )}
        <div className="space-y-4">
          <div className={`${block} h-56`} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className={`${block} h-32`} /><div className={`${block} h-32`} /><div className={`${block} h-32`} /></div>
          <div className={`${block} h-64`} />
        </div>
      </div>
    </div>
  );
}
