// Thème du front v2 (clair par défaut, sombre, ou celui du système), mémorisé par navigateur. Appliqué sur <html>
// avant l'affichage (pas de flash entre deux écrans) et retiré au démontage (les anciens dashboards restent clairs).
import { useLayoutEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
const THEME_KEY = 'daftime.theme';

export function useV2Theme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => { try { return (localStorage.getItem(THEME_KEY) as Theme) || 'light'; } catch { return 'light'; } });
  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('v2-dark', theme === 'dark' || (theme === 'system' && mq.matches));
    apply(); mq.addEventListener('change', apply);
    return () => { mq.removeEventListener('change', apply); document.documentElement.classList.remove('v2-dark'); };
  }, [theme]);
  return [theme, (t) => { setTheme(t); try { localStorage.setItem(THEME_KEY, t); } catch { /* stockage indisponible */ } }];
}
