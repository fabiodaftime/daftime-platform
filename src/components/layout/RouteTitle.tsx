// Titre d'onglet par page. Sans lui, toute l'application affichait le titre de la landing pub
// (« Ta vraie marge e-commerce ») — illisible quand plusieurs dossiers sont ouverts en onglets.
// Les landings gardent le titre d'index.html (SEO / partage), on ne le remplace que hors landing.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE = 'Daftime Advisory';
const LANDING_TITLE = typeof document !== 'undefined' ? document.title : BASE;

const RULES: [RegExp, string | null][] = [
  [/^\/ecommerce/, null],
  [/^\/admin\/clients\/[^/]+\/settings/, 'Réglages du dossier'],
  [/^\/admin\/clients\/[^/]+/, 'Cockpit client'],
  [/^\/admin\/clients/, 'Clients'],
  [/^\/admin\/users/, 'Utilisateurs'],
  [/^\/admin\/advisors/, 'Conseillers'],
  [/^\/admin\/activities/, 'Activités'],
  [/^\/admin\//, 'Administration'],
  [/^\/client\//, 'Mon espace'],
  [/^\/dashboard/, 'Tableau de bord'],
  [/^\/profile/, 'Mon profil'],
  [/^\/bienvenue/, 'Bienvenue'],
  [/^\/auth/, 'Connexion'],
  [/^\/mentions-legales/, 'Mentions légales'],
  [/^\/confidentialite/, 'Confidentialité'],
  [/^\/shopify/, 'Connexion Shopify'],
  [/^\/$/, 'Accueil'],
];

export function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const rule = RULES.find(([re]) => re.test(pathname));
    if (rule && rule[1] === null) { document.title = LANDING_TITLE; return; }
    document.title = rule ? `${rule[1]} · ${BASE}` : BASE;
  }, [pathname]);
  return null;
}
