// Point d'entrée dédié à la landing Portugal.
//
// Volontairement séparé de `main.tsx` : pas de react-router, pas de Supabase,
// pas de AuthProvider, pas de react-query, aucune des 40 pages du dashboard.
// La page n'embarque que React + ses propres composants, ce qui est la
// condition pour tenir un FCP < 2 s sur mobile 4G.
import { createRoot } from 'react-dom/client';
import LandingPortugal from './pages/LandingPortugal';
import './index.css';

createRoot(document.getElementById('root')!).render(<LandingPortugal />);
