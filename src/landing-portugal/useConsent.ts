// Consentement RGPD — état partagé de la page.
//
// Trois états :
//   'unknown' → le visiteur n'a pas encore choisi. Le bandeau s'affiche.
//                AUCUN traceur n'est chargé.
//   'granted' → traceurs autorisés. Le pixel est chargé (une seule fois).
//   'denied'  → refus. Rien n'est chargé, et le bandeau ne revient pas.
//
// Le choix est mémorisé en localStorage (pas de cookie : aucun traceur avant
// consentement, y compris pour mémoriser le refus). Refus = un seul clic.

import { useCallback, useEffect, useState } from 'react';
import { META_PIXEL_ID } from './config';
import { loadPixel } from './pixel';

export type ConsentState = 'unknown' | 'granted' | 'denied';

const STORAGE_KEY = 'daftime_pt_consent';

function read(): ConsentState {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : 'unknown';
  } catch {
    // Mode privé strict / stockage bloqué : on redemande, on ne présume rien.
    return 'unknown';
  }
}

function write(value: ConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* noop */
  }
}

export function useConsent() {
  // Lecture synchrone au premier rendu : évite que le bandeau clignote pour
  // un visiteur qui a déjà choisi.
  const [consent, setConsent] = useState<ConsentState>(() =>
    typeof window === 'undefined' ? 'unknown' : read(),
  );

  // Un visiteur déjà consentant retrouve son pixel au chargement suivant.
  useEffect(() => {
    if (consent === 'granted') loadPixel(META_PIXEL_ID);
  }, [consent]);

  const accept = useCallback(() => {
    write('granted');
    setConsent('granted');
  }, []);

  const refuse = useCallback(() => {
    write('denied');
    setConsent('denied');
  }, []);

  return { consent, accept, refuse, granted: consent === 'granted' };
}
