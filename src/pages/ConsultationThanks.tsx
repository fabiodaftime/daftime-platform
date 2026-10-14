// Page /consultation-ecommerce/merci — page de confirmation simple.
//
// AUCUN événement de conversion ici : la redirection cal.com vers cette page n'est
// pas activée (option payante) et « Schedule » est envoyé côté serveur par Make
// (API Conversions Meta). Le pixel n'y envoie que PageView, comme la landing.
import { useEffect } from 'react';
import daftimeLogoWhite from '@/assets/daftime-logo-white-sm.png';
import { PAGE_PATH } from '@/landing-consultation/config';
import { THANKS } from '@/landing-consultation/content';

export default function ConsultationThanks() {
  useEffect(() => {
    document.title = 'Rendez-vous confirmé — Daftime Advisory';
  }, []);

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
