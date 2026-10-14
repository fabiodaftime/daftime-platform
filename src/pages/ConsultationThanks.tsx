// Page /consultation-ecommerce/merci — cible du « Redirect on booking » cal.com.
//
// Deux contextes :
//  - plein onglet (webview Instagram/Facebook, repli « ouvrir dans le navigateur »,
//    ou cal.com qui redirige la page entière) → on envoie « Schedule » ici ;
//  - dans l'iframe de la landing (cal.com redirige l'iframe) → pas de pixel ici
//    (voir consultation-ecommerce/index.html), on prévient la page parente.
//
// L'uid de réservation et les utm_* sont lus par le script inline du <head>, qui
// nettoie l'URL AVANT le pixel : cal.com renvoie aussi nom et e-mail du client en
// paramètres, ils ne doivent pas partir chez Meta avec l'URL de la page.
import { useEffect } from 'react';
import { CalendarCheck } from 'lucide-react';
import daftimeLogoWhite from '@/assets/daftime-logo-white-sm.png';
import { PAGE_PATH } from '@/landing-consultation/config';
import { THANKS } from '@/landing-consultation/content';
import { fireSchedule, THANKS_MESSAGE } from '@/landing-consultation/schedule';

declare global {
  interface Window {
    __dftBooking?: { uid?: string };
    __dftFramed?: boolean;
  }
}

export default function ConsultationThanks() {
  const framed = window.__dftFramed ?? window.self !== window.top;

  useEffect(() => {
    document.title = 'Rendez-vous confirmé — Daftime Advisory';
    const uid = window.__dftBooking?.uid || undefined;
    if (framed) {
      try { window.parent.postMessage({ type: THANKS_MESSAGE, uid }, window.location.origin); } catch { /* noop */ }
      return;
    }
    fireSchedule('merci', uid);
  }, [framed]);

  if (framed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center text-primary">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent">
          <CalendarCheck className="h-6 w-6 text-accent-foreground" aria-hidden />
        </span>
        <p className="text-xl font-semibold">{THANKS.title}</p>
        <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">{THANKS.text}</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-primary text-primary-foreground antialiased">
      <div className="mx-auto w-full max-w-3xl px-5 pt-6">
        <img src={daftimeLogoWhite} alt="Daftime Advisory" width={116} height={32} className="h-8 w-auto" />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          <span className="box-decoration-clone rounded-md bg-accent px-2 text-accent-foreground">{THANKS.title}</span>
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-primary-foreground/80">{THANKS.text}</p>
        <a
          href={PAGE_PATH}
          className="mt-10 inline-flex min-h-[44px] items-center text-[15px] font-medium text-primary-foreground underline underline-offset-4"
        >
          ← {THANKS.back}
        </a>
      </div>
    </main>
  );
}
