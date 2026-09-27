// Page d'arrivée de l'app Shopify « Daftime » (App URL). Shopify l'ouvre après l'installation avec
// ?shop=…&hmac=… : on fait vérifier la signature côté serveur (shopify-install), puis on ouvre Nango
// Connect prérempli avec la boutique pour donner l'accès en lecture. Page publique (le marchand n'a pas
// de compte Daftime) : aucun chiffre ni donnée n'y est affiché.
import { useEffect, useRef, useState } from 'react';
import Nango from '@nangohq/frontend';
import { supabase } from '@/integrations/supabase/client';

type State = { step: 'idle' | 'loading' | 'open' | 'done' | 'error'; text?: string; shop?: string };

export default function ShopifyInstall() {
  const [s, setS] = useState<State>({ step: 'idle' });
  const started = useRef(false);
  const query = typeof window !== 'undefined' ? window.location.search : '';
  const hasShop = new URLSearchParams(query).has('shop');

  const start = async () => {
    setS({ step: 'loading' });
    const { data, error } = await supabase.functions.invoke('shopify-install', { body: { query } });
    if (error || !data?.token) {
      let msg = 'Impossible de démarrer la connexion. Relance l’installation depuis ton admin Shopify.';
      try { const j = await (error as { context?: Response })?.context?.json?.(); if (j?.error) msg = j.error; } catch { /* message par défaut */ }
      setS({ step: 'error', text: msg }); return;
    }
    setS({ step: 'open', shop: data.shop });
    const ui = new Nango().openConnectUI({
      lang: 'fr',
      onEvent: (e) => {
        if (e.type === 'connect') setS({ step: 'done', shop: data.shop });
        else if (e.type === 'error') setS({ step: 'error', text: e.payload.errorMessage });
      },
    });
    ui.setSessionToken(data.token);
  };

  // Démarrage automatique une seule fois à l'ouverture (lien de lancement Shopify).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasShop && !started.current) { started.current = true; start(); } }, []);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full border rounded-xl p-6 space-y-3 bg-card">
        <h1 className="text-lg font-semibold">Daftime × Shopify</h1>
        {!hasShop && <p className="text-sm text-muted-foreground">Installe l’app Daftime depuis ton admin Shopify (lien envoyé par ton conseiller). Cette page s’ouvre ensuite automatiquement.</p>}
        {s.step === 'loading' && <p className="text-sm">Préparation de la connexion…</p>}
        {s.step === 'open' && <p className="text-sm">Autorise l’accès en lecture dans la fenêtre qui s’est ouverte{ s.shop ? ` pour ${s.shop}` : '' }.</p>}
        {s.step === 'done' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-700">C’est connecté.</p>
            <p className="text-sm text-muted-foreground">Ton conseiller Daftime reçoit désormais automatiquement tes chiffres de vente mensuels. Tu peux fermer cette page.</p>
          </div>
        )}
        {s.step === 'error' && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{s.text}</p>
            <button className="text-sm underline" onClick={start}>Réessayer</button>
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Accès en lecture seule aux ventes, produits, stock et versements. Aucune donnée personnelle de tes clients n’est conservée.{' '}
          <a href="/confidentialite" className="underline">Politique de confidentialité</a>
        </p>
      </div>
    </main>
  );
}
