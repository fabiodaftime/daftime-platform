// ═══════════════════════════════════════════════════════════════════════════
//  Landing CONSULTATION E-COMMERCE — 20 min offertes avec Fabio (campagne Meta Ads).
//  Route : /consultation-ecommerce (entrée HTML autonome, cf. vite.config.ts).
//  Une seule action : réserver. Valeurs à renseigner : src/landing-consultation/config.ts.
//  Textes : src/landing-consultation/content.ts.
//
//  Charte : bleu nuit #1A1D56 (primary), jaune #D6D303 (accent), blanc, gris-bleu
//  pour le texte secondaire (muted-foreground). Le jaune n'est JAMAIS du texte sur
//  fond clair : sur fond clair il est un aplat (bouton, surligneur) avec texte
//  bleu nuit ; il n'apparaît en texte que sur le bleu nuit.
//
//  Suivi Meta : PageView seulement (head). Schedule = serveur (Make → API Conversions).
//
//  Mobile d'abord (90 % du trafic = webview Meta) : pas d'animation conditionnant
//  l'affichage, pas de librairie lourde, images locales de quelques ko.
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarCheck, Check } from 'lucide-react';
import daftimeLogoWhite from '@/assets/daftime-logo-white-sm.png';
import { ADVISOR, FLAGS, LEGAL, LINKS } from '@/landing-consultation/config';
import {
  ABOUT, BOOKING, COUNTRIES, CTA_LABEL, FAQ, HERO, PAINS, STEPS,
} from '@/landing-consultation/content';
import { CalEmbed } from '@/landing-consultation/CalEmbed';

const BOOKING_ANCHOR = 'reserver';

/** Le CTA unique : défilement vers le calendrier. */
function Cta({ className = '' }: { className?: string }) {
  const go = () => {
    const target = document.getElementById(BOOKING_ANCHOR);
    if (!target) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  return (
    <button
      type="button"
      onClick={go}
      className={`inline-flex h-14 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-accent px-7 text-base font-semibold text-accent-foreground shadow-[0_6px_20px_-8px_rgba(214,211,3,0.7)] transition-[filter,transform] hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary motion-reduce:transition-none sm:w-auto ${className}`}
    >
      <CalendarCheck className="h-5 w-5" aria-hidden />
      {CTA_LABEL}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-balance text-[26px] font-semibold leading-[1.15] tracking-tight text-primary sm:text-[34px]">
      {children}
    </h2>
  );
}

export default function LandingConsultation() {
  const [booked, setBooked] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [bookingInView, setBookingInView] = useState(false);
  const bookingRef = useRef<HTMLElement>(null);

  // Barre CTA mobile après le hero.
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // La barre se retire quand le calendrier est à l'écran : elle masquerait le bas de l'iframe.
  useEffect(() => {
    const el = bookingRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setBookingInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showSticky = FLAGS.stickyMobileCta && pastHero && !bookingInView;

  return (
    <div className="min-h-screen bg-white text-primary antialiased">
      {/* ─────────────────────────────────────────────────────────── 1. Hero ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 pb-12 pt-6 sm:pb-20">
          <img src={daftimeLogoWhite} alt="Daftime Advisory" width={116} height={32} className="h-8 w-auto" />

          <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent sm:mt-16">
            {HERO.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-[31px] font-semibold leading-[1.14] tracking-tight sm:text-[50px] sm:leading-[1.08]">
            {/* « e-commerce » insécable : sinon le titre se coupe au tiret sur mobile. */}
            {HERO.title.split('e-commerce').map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="whitespace-nowrap">e-commerce</span>}
                {part}
              </span>
            ))}{' '}
            <span className="box-decoration-clone whitespace-nowrap rounded-md bg-accent px-2 text-accent-foreground">
              {HERO.titleHighlight}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-primary-foreground/80 sm:text-xl">
            {HERO.subtitle}
          </p>
          <div className="mt-8">
            <Cta />
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-primary-foreground/75">
            {HERO.reassurance.map((r) => (
              <li key={r} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────────────────────────────────────────── 2. Ça te parle ? ── */}
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
        <SectionTitle>{PAINS.title}</SectionTitle>
        <ul className="mt-7 border-t border-primary/10">
          {PAINS.items.map((p) => (
            <li key={p} className="flex items-start gap-3.5 border-b border-primary/10 py-4">
              <span className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-accent">
                <Check className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={3} aria-hidden />
              </span>
              <span className="text-[16px] leading-snug sm:text-[17px]">{p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[15px] font-medium text-muted-foreground">{PAINS.outro}</p>
      </section>

      {/* ──────────────────────────────────────── 3. Comment ça se passe ── */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
          <SectionTitle>{STEPS.title}</SectionTitle>
          {/* Vraie séquence : la numérotation porte l'ordre. */}
          <ol className="mt-8 grid gap-0 sm:grid-cols-3 sm:gap-8">
            {STEPS.items.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 pb-8 last:pb-0 sm:flex-col sm:pb-0">
                {i < STEPS.items.length - 1 && (
                  <span aria-hidden className="absolute left-[17px] top-10 h-[calc(100%-2.5rem)] w-px bg-primary/15 sm:hidden" />
                )}
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-primary text-[15px] font-semibold text-accent">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[17px] font-semibold leading-snug">{s.title}</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── 4. Pays ── */}
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
        <SectionTitle>{COUNTRIES.title}</SectionTitle>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted-foreground">{COUNTRIES.intro}</p>
        <ul className="mt-8 grid grid-cols-2 border-l border-t border-primary/10 sm:grid-cols-4">
          {COUNTRIES.items.map((c) => (
            <li
              key={c.name}
              className="flex min-h-[68px] flex-col justify-center gap-1 border-b border-r border-primary/10 px-4 py-3"
            >
              <span className="text-[16px] font-semibold">{c.name}</span>
              <span className="text-[12px] text-muted-foreground">
                {c.direct ? (
                  <span className="rounded bg-accent px-1.5 py-0.5 font-semibold text-accent-foreground">Daftime en direct</span>
                ) : (
                  'Partenaire sur place'
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────────────────────────────────────── 5. Qui est derrière ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
          <h2 className="text-balance text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-[34px]">
            {ABOUT.title}
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-primary-foreground/80">{ABOUT.firm}</p>

          <div className="mt-8 flex items-center gap-4">
            <img
              src={ADVISOR.photo}
              alt={ADVISOR.name}
              width={80}
              height={80}
              loading="lazy"
              decoding="async"
              className="h-20 w-20 flex-shrink-0 rounded-full object-cover ring-2 ring-accent"
            />
            <div>
              <p className="text-[18px] font-semibold">{ADVISOR.name}</p>
              <p className="text-[14px] text-primary-foreground/70">Daftime Advisory · Dubaï</p>
            </div>
          </div>
          {ADVISOR.bio ? (
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-primary-foreground/85">{ADVISOR.bio}</p>
          ) : (
            import.meta.env.DEV && (
              <p className="mt-5 border border-dashed border-accent/60 px-3 py-2 text-[13px] text-accent">
                [TEXTE BIO] — à renseigner dans src/landing-consultation/config.ts (masqué en ligne tant que vide)
              </p>
            )
          )}

          <p className="mt-10 text-[15px] font-medium text-primary-foreground/80">{ABOUT.servicesLead}</p>
          <ul className="mt-3 space-y-2.5">
            {ABOUT.services.map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-[15px] leading-snug">
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Cta />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── 6. FAQ ── */}
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
        <SectionTitle>Questions fréquentes</SectionTitle>
        <div className="mt-7 border-t border-primary/10">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group border-b border-primary/10"
            >
              <summary className="flex min-h-[56px] cursor-pointer touch-manipulation list-none items-center justify-between gap-5 py-4 text-[16px] font-medium leading-snug [&::-webkit-details-marker]:hidden">
                {f.q}
                <ArrowRight
                  className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
                  aria-hidden
                />
              </summary>
              <p className="max-w-2xl pb-5 pr-9 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────── 7. CTA final + réservation ── */}
      <section id={BOOKING_ANCHOR} ref={bookingRef} className="scroll-mt-2 bg-secondary">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
          <SectionTitle>{BOOKING.title}</SectionTitle>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{BOOKING.text}</p>
          {booked && (
            <p
              role="status"
              className="mt-6 flex items-start gap-2.5 rounded-lg bg-accent px-4 py-3 text-[15px] font-medium text-accent-foreground"
            >
              <CalendarCheck className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
              {BOOKING.confirmed}
            </p>
          )}
          <div className="mt-7">
            <CalEmbed onBooked={() => setBooked(true)} />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── Pied ──
          pb-24 sur mobile : la barre collante ne doit pas masquer les mentions. */}
      <footer className="bg-primary text-primary-foreground/70">
        <div className="mx-auto max-w-4xl px-5 py-10 pb-24 text-[13px] leading-relaxed sm:pb-10">
          <img src={daftimeLogoWhite} alt="Daftime Advisory" width={102} height={28} className="mb-4 h-7 w-auto" />
          <p className="font-semibold text-primary-foreground">{LEGAL.name}</p>
          <p>{LEGAL.address}</p>
          <p>
            <a href={`mailto:${LEGAL.email}`} className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-primary-foreground">
              {LEGAL.email}
            </a>
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6">
            <a href={LINKS.legal} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-primary-foreground">
              Mentions légales
            </a>
            <a href={LINKS.privacy} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-primary-foreground">
              Confidentialité
            </a>
            <a href={LINKS.mainSite} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-primary-foreground">
              daftime.ae
            </a>
          </div>
          <p className="mt-6 border-t border-white/10 pt-5 text-[11px] text-primary-foreground/50">
            © {new Date().getFullYear()} {LEGAL.name}. Les informations de cette page ne constituent pas un conseil personnalisé.
          </p>
        </div>
      </footer>

      {/* ──────────────────────────────────── Barre CTA collante (mobile) ── */}
      {FLAGS.stickyMobileCta && (
        <div
          aria-hidden={!showSticky}
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-white/95 p-3 backdrop-blur transition-transform duration-200 motion-reduce:transition-none sm:hidden ${
            showSticky ? 'translate-y-0' : 'invisible translate-y-full'
          }`}
        >
          <Cta />
        </div>
      )}
    </div>
  );
}
