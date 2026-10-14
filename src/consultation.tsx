// Point d'entrée dédié à la landing « consultation e-commerce » (et à sa page /merci).
//
// Même principe que `portugal.tsx` : pas de react-router, pas de Supabase, pas
// d'auth — React + les composants de la page, rien d'autre (FCP mobile).
import { createRoot } from 'react-dom/client';
import LandingConsultation from './pages/LandingConsultation';
import ConsultationThanks from './pages/ConsultationThanks';
import './index.css';

const isThanks = /\/merci\/?$/.test(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  isThanks ? <ConsultationThanks /> : <LandingConsultation />,
);
