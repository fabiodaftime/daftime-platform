// ═══════════════════════════════════════════════════════════════════════════
//  Landing DAFTIME PORTUGAL — cible : entrepreneurs français installés au Portugal.
//
//  Une seule page, une seule action : réserver 20 minutes.
//  4 publicités Meta pointent ici ; `?a=1..4` change UNIQUEMENT le titre du hero
//  pour que chaque annonce retrouve sa promesse à l'arrivée. Défaut : 1.
//
//  Toutes les valeurs à renseigner sont dans `src/landing-portugal/config.ts`.
//  Tous les textes sont dans `src/landing-portugal/content.ts`.
//
//  ── Parti pris de design ───────────────────────────────────────────────────
//  Pattern « Trust & Authority + Conversion » : hero → PREUVE → problème →
//  solution → prix → chemin de conversion. La preuve passe avant le problème,
//  et les credentials de la contabilista sont visibles dès le premier écran :
//  les enterrer est l'anti-pattern n°1 de ce pattern sur un service financier
//  réglementé.
//
//  Deux tics de page générée sont évités, comme sur les LP e-commerce du repo
//  (cf. commits « dé-IA visuel ») : aucun carré d'icône teinté, et aucune série
//  de cartes jumelles — les listes sont des blocs à séparateurs.
//
//  L'accent jaune est réservé aux points d'appui (filet du hero, credentials,
//  CTA sur fond navy). Il ne sert jamais de décor.
//
//  Pas d'apparition au scroll, alors que le design system la recommande : elle
//  rend la visibilité du contenu dépendante de l'exécution d'un effet React et
//  d'un IntersectionObserver. Testé, le mode de défaillance est une page vide.
//  L'essentiel du trafic arrive par la webview Instagram, l'environnement JS le
//  plus hostile qui soit — un fondu de 12 px ne vaut pas ce risque.
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Clock, ShieldCheck, Stamp } from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { Button } from '@/components/ui/button';
import { trackFaqOpen, trackViewContent } from '@/lib/tracking';

import { EINVOICING_DEADLINE, FLAGS, HOST, LEGAL, LINKS, PRICING } from '@/landing-portugal/config';
import {
  DUO, EINVOICING, FAQ, HERO_REASSURANCE, HERO_SUBTITLE, HERO_VARIANTS, PROBLEMS, PROOF, RNH,
  SERVICES, type HeroVariantKey,
} from '@/landing-portugal/content';
import { BOOKING_ANCHOR, CtaButton } from '@/landing-portugal/CtaButton';
import { CalEmbed } from '@/landing-portugal/CalEmbed';
import { ConsentBanner } from '@/landing-portugal/ConsentBanner';
import { useConsent } from '@/landing-portugal/useConsent';

/** `?a=1..4` → variante de hero. Paramètre absent ou invalide → variante 1. */
function useHeroVariant() {
  return useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('a');
    const n = Number(raw);
    const key: HeroVariantKey = n === 2 || n === 3 || n === 4 ? n : 1;
    return HERO_VARIANTS[key];
  }, []);
}

export default function LandingPortugal() {
  const hero = useHeroVariant();
  const { consent, accept, refuse } = useConsent();
  const [booked, setBooked] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  // Barre CTA mobile + signal d'intérêt à mi-page (convention des LP du repo).
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setShowSticky(y > window.innerHeight * 0.6);
      if (h > 0 && y / h >= 0.5) trackViewContent({ page: 'portugal' });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ───────────────────────────────────────────────────────── En-tête ── */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-5">
          <img src={daftimeLogo} alt="Daftime" width={96} height={22} className="h-[22px] w-auto" />
          <span className="h-4 w-px bg-border" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            Portugal
          </span>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── Hero ──
          Rendu directement, sans aucune condition JS. */}
      <section className="mx-auto max-w-3xl px-5 pb-11 pt-10 sm:pb-14 sm:pt-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {hero.eyebrow}
        </p>
        <span className="mt-3 block h-1 w-14 rounded-full bg-accent" aria-hidden />
        <h1 className="mt-5 text-[32px] font-semibold leading-[1.14] tracking-tight sm:text-5xl">
          {hero.title}
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground sm:text-xl">
          {HERO_SUBTITLE}
        </p>
        <div className="mt-8">
          <CtaButton placement="hero" />
          <p className="mt-3 flex items-start gap-2 text-[15px] leading-relaxed text-muted-foreground">
            <Check className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden />
            <span>{HERO_REASSURANCE}</span>
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────── Preuve (position 2) ──
          Credentials avant tout argumentaire. Rien d'inventé : la cédula est
          vérifiable auprès de l'OCC, le reste décrit le service tel qu'il est. */}
      <section className="border-y bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-5 py-7">
          <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROOF.map((p) => (
              <li key={p.label}>
                <p className="flex items-start gap-2 text-[13px] font-semibold text-accent">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                  {p.label}
                </p>
                <p className="mt-1 pl-[22px] text-[13px] leading-snug text-primary-foreground/75">
                  {p.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── Problème ──
          Un bloc à séparateurs plutôt que trois cartes jumelles. */}
      <section className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ce qui coince, quand on dirige une société portugaise depuis la France
        </h2>
        <div className="mt-7 divide-y rounded-2xl border bg-card">
          {PROBLEMS.map((p, i) => (
            <div key={p.title} className="flex gap-4 p-5 sm:p-6">
              <span className="mt-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-[15px] font-semibold leading-snug">{p.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── Ce qu'on fait ── */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ce qu’on prend en charge
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Un forfait mensuel, et l’ensemble des obligations comptables et déclaratives de ta
            société portugaise à l’intérieur.
          </p>

          <dl className="mt-7 divide-y rounded-2xl border bg-card">
            {SERVICES.map((s) => (
              <div key={s.title} className="p-5 sm:flex sm:gap-6 sm:p-6">
                <dt className="text-[15px] font-semibold sm:w-52 sm:flex-shrink-0">{s.title}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground sm:mt-0">
                  {s.body}
                </dd>
              </div>
            ))}
          </dl>

          {/* Le binôme — pièce maîtresse de crédibilité */}
          <div className="mt-8 rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
            <h3 className="text-xl font-semibold tracking-tight">{DUO.title}</h3>
            <div className="mt-6 space-y-6 sm:grid sm:grid-cols-2 sm:gap-8 sm:space-y-0">
              {DUO.members.map((m) => (
                <div key={m.label}>
                  <p className="text-[13px] font-semibold uppercase tracking-wider text-accent">
                    {m.label}
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-primary-foreground/80">
                    {m.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── Tarifs ── */}
      <section className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tarifs</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Un forfait mensuel, tout compris. Pas de ligne surprise au moment des déclarations
          annuelles.
        </p>

        <div className="mt-7 rounded-2xl border bg-card p-6 sm:p-8">
          <p className="flex items-baseline gap-2">
            <span className="text-[15px] text-muted-foreground">À partir de</span>
            <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {PRICING.from} {PRICING.currency}
            </span>
            <span className="text-[15px] text-muted-foreground">{PRICING.period}</span>
          </p>

          <ul className="mt-6 space-y-2.5 border-t pt-6">
            {PRICING.included.map((x) => (
              <li key={x} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                <Check className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden />
                {x}
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t pt-4 text-[13px] leading-relaxed text-muted-foreground">
            {PRICING.footnote}
          </p>
        </div>

        {/* CTA milieu de page */}
        <div className="mt-8">
          <CtaButton placement="tarifs" />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── RNH ── */}
      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            10 ans, non renouvelables
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{RNH.title}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{RNH.body}</p>
          <p className="mt-4 border-l-2 border-accent pl-4 text-[15px] font-medium leading-relaxed">
            {RNH.kicker}
          </p>
          <div className="mt-7">
            <CtaButton placement="rnh" />
          </div>
        </div>
      </section>

      {/* ────────────────────────────────── Facturation électronique (FLAG) ──
          Bloc éphémère : basculer FLAGS.showEInvoicing à false début 2027. */}
      {FLAGS.showEInvoicing && (
        <section className="border-t">
          <div className="mx-auto max-w-3xl px-5 py-12 sm:py-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Échéance {EINVOICING_DEADLINE}
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              {EINVOICING.title}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              {EINVOICING.body}
            </p>
            <ul className="mt-4 space-y-2">
              {EINVOICING.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-[15px] leading-relaxed text-muted-foreground"
                >
                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────── FAQ ──
          <details> natif plutôt qu'un accordéon Radix : zéro JS, accessible au
          clavier par défaut, et c'est ce qu'utilisent les deux autres LP.
          L'ouverture est instrumentée (Clarity + Meta) comme sur /ecommerce-2 :
          c'est la FAQ qui concentre le temps passé, donc l'information utile. */}
      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Questions fréquentes</h2>
          <div className="mt-7 space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                onToggle={(e) => {
                  if (e.currentTarget.open) trackFaqOpen(f.q, 'portugal');
                }}
                className="group rounded-xl border bg-card"
              >
                <summary className="flex cursor-pointer touch-manipulation list-none items-start justify-between gap-4 p-5 text-[15px] font-medium">
                  {f.q}
                  <ArrowRight
                    className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
                    aria-hidden
                  />
                </summary>
                <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── CTA de fin de page ── */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-5 py-14 sm:items-center sm:py-16 sm:text-center">
          <ShieldCheck className="h-8 w-8 text-accent" aria-hidden />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Vingt minutes pour savoir où tu en es
          </h2>
          <p className="max-w-lg text-[15px] leading-relaxed text-primary-foreground/80">
            On regarde ta situation, tes échéances et ce que ça représente. En français. Tu repars
            avec une réponse claire, que tu travailles avec nous ou non.
          </p>
          <div className="w-full sm:w-auto">
            <CtaButton placement="final" variant="secondary" />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── Réservation ── */}
      <section id={BOOKING_ANCHOR} className="scroll-mt-4">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Choisis ton créneau</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            20 minutes, en visio, en français. Nom et e-mail suffisent.
          </p>
          {booked && (
            <p
              role="status"
              className="mt-5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 py-3 text-[15px] font-medium text-emerald-900"
            >
              Rendez-vous confirmé. Tu reçois l’invitation et le lien de visio par e-mail.
            </p>
          )}
          <div className="mt-6">
            <CalEmbed onBooked={() => setBooked(true)} />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── Pied ──
          pb-24 sur mobile : la barre CTA collante ne doit pas masquer les
          mentions légales. */}
      <footer className="bg-primary text-primary-foreground/75">
        <div className="mx-auto max-w-5xl px-5 py-10 pb-24 sm:pb-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 text-[13px] leading-relaxed">
              <img
                src={daftimeLogoWhite}
                alt="Daftime"
                width={112}
                height={28}
                className="mb-4 h-7 w-auto"
              />
              <p className="flex items-center gap-1.5 font-semibold text-primary-foreground">
                <Stamp className="h-3.5 w-3.5 text-accent" aria-hidden />
                {LEGAL.name}
              </p>
              <p>{LEGAL.qualifier}</p>
              <p>
                {LEGAL.address} — {LEGAL.country}
              </p>
              <p>
                <a
                  href={`mailto:${LEGAL.email}`}
                  className="underline underline-offset-2 hover:text-primary-foreground"
                >
                  {LEGAL.email}
                </a>
              </p>
              <p className="pt-2 text-primary-foreground/60">Hébergement : {HOST}</p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <Button asChild variant="secondary" className="h-11 touch-manipulation px-5">
                <a href={LINKS.mainSite} target="_blank" rel="noopener noreferrer">
                  Découvrir Daftime
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </a>
              </Button>
              <a
                href={LINKS.privacy}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center text-[13px] underline underline-offset-2 hover:text-primary-foreground"
              >
                Politique de confidentialité
              </a>
            </div>
          </div>

          <p className="mt-8 border-t border-white/10 pt-6 text-xs leading-relaxed text-primary-foreground/60">
            © {new Date().getFullYear()} {LEGAL.name}. Tous droits réservés. Les informations
            fiscales et réglementaires présentées sur cette page sont données à titre indicatif et
            ne constituent pas un conseil personnalisé.
          </p>
        </div>
      </footer>

      {/* ──────────────────────────────────── Barre CTA collante (mobile) ──
          Même libellé, même action : ce n'est pas un second CTA, c'est le CTA
          unique rendu atteignable en permanence sur le format où arrive
          l'essentiel du trafic Meta. FLAGS.stickyMobileCta pour la retirer.
          Masquée tant que le bandeau de consentement est affiché (elles
          occuperaient le même bas d'écran). */}
      {FLAGS.stickyMobileCta && (
        <div
          aria-hidden={!showSticky || consent === 'unknown'}
          className={`fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-3 backdrop-blur transition-transform duration-200 motion-reduce:transition-none sm:hidden ${
            showSticky && consent !== 'unknown' ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <CtaButton placement="sticky" />
        </div>
      )}

      {consent === 'unknown' && <ConsentBanner onAccept={accept} onRefuse={refuse} />}
    </div>
  );
}
