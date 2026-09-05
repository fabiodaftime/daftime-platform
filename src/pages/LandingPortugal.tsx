// ═══════════════════════════════════════════════════════════════════════════
//  Landing DAFTIME PORTUGAL — cible : entrepreneurs français installés au Portugal.
//
//  Une seule page, une seule action : réserver 20 minutes.
//  2 publicités Meta pointent ici ; `?a=1` et `?a=3` changent UNIQUEMENT le
//  titre du hero pour que chaque annonce retrouve sa promesse à l'arrivée.
//  Toute autre valeur, ou l'absence de paramètre, donne la variante 1.
//
//  Toutes les valeurs à renseigner sont dans `src/landing-portugal/config.ts`.
//  Tous les textes sont dans `src/landing-portugal/content.ts`.
//
//  ── Parti pris de design ───────────────────────────────────────────────────
//  Structure : pattern « Trust & Authority + Conversion ». Hero → PREUVE →
//  problème → solution → équipe → prix → FAQ → réservation. La preuve passe
//  avant le problème, et les credentials de la contabilista sont visibles dès
//  le premier écran : les enterrer est l'anti-pattern n°1 de ce pattern sur un
//  service financier réglementé.
//
//  MISE EN PAGE ÉDITORIALE, PAS UNE PILE DE CARTES. Trois règles, tenues
//  partout, parce que leur violation est ce qui fait « page générée » :
//
//   1. Un seul objet encadré sur toute la page : le bloc tarifaire. C'est le
//      point de bascule, il mérite d'être le seul à attirer l'œil. Le reste —
//      problème, services, FAQ — est séparé par des FILETS, pas par des
//      conteneurs. Pas de `rounded-2xl border bg-card` répété.
//   2. Aucune série de blocs jumeaux. Les listes sont des listes : une colonne
//      d'intitulés, une colonne de texte, des hairlines entre les lignes.
//   3. Aucun carré d'icône teinté (cf. commits « dé-IA visuel » des LP
//      e-commerce). Les icônes servent de ponctuation, jamais de décor.
//
//  Le navy structure le rythme : bandeau de preuve, bloc tarifaire, CTA final.
//  Trois apparitions espacées. L'accent jaune reste réservé aux points d'appui.
//
//  Pas d'apparition au scroll, alors que le design system la recommande : elle
//  rend la visibilité du contenu dépendante de l'exécution d'un effet React et
//  d'un IntersectionObserver. Testé, le mode de défaillance est une page vide.
//  L'essentiel du trafic arrive par la webview Instagram, l'environnement JS le
//  plus hostile qui soit — un fondu de 12 px ne vaut pas ce risque.
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ShieldCheck, Stamp } from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { Button } from '@/components/ui/button';
import { trackFaqOpen, trackViewContent } from '@/lib/tracking';

import { FLAGS, HOST, LEGAL, LINKS, PRICING } from '@/landing-portugal/config';
import {
  ARGUMENTS, COVERED, CTA_REASSURANCE, DUO, FAQ, HERO_REASSURANCE, HERO_SUBTITLE, HERO_VARIANTS,
  PROOF, type HeroVariantKey,
} from '@/landing-portugal/content';
import { BOOKING_ANCHOR, CtaButton } from '@/landing-portugal/CtaButton';
import { CalEmbed } from '@/landing-portugal/CalEmbed';

/** `?a=1|3` → variante de hero. Paramètre absent ou invalide → variante 1. */
function useHeroVariant() {
  return useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('a');
    const n = Number(raw);
    const key: HeroVariantKey = n === 3 ? n : 1;
    return HERO_VARIANTS[key];
  }, []);
}

/** Titre de section — une seule échelle typographique sur toute la page. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="max-w-2xl text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-[34px]">
      {children}
    </h2>
  );
}

export default function LandingPortugal() {
  const hero = useHeroVariant();
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
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-5">
          <img src={daftimeLogo} alt="Daftime" width={96} height={22} className="h-[22px] w-auto" />
          <span className="h-4 w-px bg-border" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            Portugal
          </span>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── Hero ──
          Rendu directement, sans aucune condition JS. */}
      <section className="mx-auto max-w-4xl px-5 pb-12 pt-12 sm:pb-16 sm:pt-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {hero.eyebrow}
        </p>
        <span className="mt-3.5 block h-1 w-14 rounded-full bg-accent" aria-hidden />
        <h1 className="mt-6 max-w-3xl text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[52px]">
          {hero.title}
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground sm:text-xl">
          {HERO_SUBTITLE}
        </p>
        <div className="mt-9">
          <CtaButton placement="hero" />
          <p className="mt-3.5 flex items-start gap-2 text-[15px] leading-relaxed text-muted-foreground">
            <Check className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden />
            <span>{HERO_REASSURANCE}</span>
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────── Preuve (position 2) ──
          Credentials avant tout argumentaire. Rien d'inventé : la cédula est
          vérifiable auprès de l'OCC, le reste décrit le service tel qu'il est. */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-5 py-7">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
            {PROOF.map((p) => (
              <li key={p.label}>
                <p className="text-[13px] font-semibold text-accent">{p.label}</p>
                <p className="mt-1.5 text-[13px] leading-snug text-primary-foreground/70">
                  {p.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ────────────────────────────────────── Friction → réponse (fusionné) ──
          Une seule section : la citation à gauche, la réponse à droite sur
          desktop, empilées sur mobile. Séparées, ces deux sections pesaient
          29 % de la hauteur de la page et obligeaient le lecteur à retenir
          l'ordre pour faire le lien. */}
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
        <SectionTitle>Ce qu’on entend, et ce qu’on en fait</SectionTitle>
        <ul className="mt-8 border-t sm:mt-10">
          {ARGUMENTS.map((a) => (
            <li
              key={a.quote}
              className="grid gap-x-10 gap-y-2.5 border-b py-6 sm:grid-cols-2 sm:py-7"
            >
              <p className="text-[17px] font-medium leading-snug tracking-tight sm:text-lg">
                {a.quote}
              </p>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{a.answer}.</span> {a.detail}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">{COVERED}</p>
      </section>

      {/* ────────────────────────────────────────────────────────────── Équipe ──
          Deux colonnes de texte, pas deux cartes. Le filet jaune sous chaque
          nom remplace le cadre. */}
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
        <SectionTitle>{DUO.title}</SectionTitle>
        <div className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-2 sm:gap-12">
          {DUO.members.map((m) => (
            <div key={m.label}>
              <h3 className="text-lg font-semibold tracking-tight">{m.label}</h3>
              <span className="mt-3 block h-0.5 w-9 bg-accent" aria-hidden />
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── Tarifs ──
          LE seul objet encadré de la page, et il est en navy : c'est le point
          de bascule, il doit être le seul à arrêter l'œil. */}
      <section className="border-y bg-secondary">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
          <SectionTitle>Tarifs</SectionTitle>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Un forfait mensuel, tout compris. Pas de ligne surprise au moment des déclarations
            annuelles.
          </p>

          <div className="mt-10 rounded-2xl bg-primary p-7 text-primary-foreground sm:p-11">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[15px] text-primary-foreground/65">À partir de</span>
              <span className="text-[46px] font-semibold leading-none tracking-tight tabular-nums sm:text-[64px]">
                {PRICING.from} {PRICING.currency}
              </span>
              <span className="text-[15px] text-primary-foreground/65">{PRICING.period}</span>
            </p>

            <ul className="mt-9 space-y-3.5 border-t border-white/15 pt-8">
              {PRICING.included.map((x) => (
                <li key={x} className="flex items-start gap-3 text-[15px] leading-relaxed">
                  <Check className="mt-1 h-4 w-4 flex-shrink-0 text-accent" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-[13px] leading-relaxed text-primary-foreground/60">
              {PRICING.footnote}
            </p>

            {/* CTA milieu de page, dans l'objet qui porte l'offre */}
            <div className="mt-9">
              <CtaButton placement="tarifs" variant="secondary" />
              <p className="mt-3.5 text-[15px] leading-relaxed text-primary-foreground/70">
                {CTA_REASSURANCE}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────── FAQ ──
          <details> natif plutôt qu'un accordéon Radix : zéro JS, accessible au
          clavier par défaut, et c'est ce qu'utilisent les deux autres LP.
          Filets simples, pas huit cartes bordées. L'ouverture est instrumentée
          (Clarity + Meta) comme sur /ecommerce-2 : c'est la FAQ qui concentre
          le temps passé, donc l'information utile. */}
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
        <SectionTitle>Questions fréquentes</SectionTitle>
        <div className="mt-10 border-t">
          {FAQ.map((f) => (
            <details
              key={f.q}
              onToggle={(e) => {
                if (e.currentTarget.open) trackFaqOpen(f.q, 'portugal');
              }}
              className="group border-b"
            >
              <summary className="flex cursor-pointer touch-manipulation list-none items-start justify-between gap-5 py-5 text-base font-medium leading-snug">
                {f.q}
                <ArrowRight
                  className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
                  aria-hidden
                />
              </summary>
              <p className="max-w-2xl pb-6 pr-9 text-[15px] leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>

        {/* CTA après la FAQ : le visiteur vient de lever ses objections,
            c'est le pic d'intention. Même choix que /ecommerce-2. */}
        <div className="mt-12">
          <CtaButton placement="apres_faq" />
          <p className="mt-3.5 text-[15px] leading-relaxed text-muted-foreground">
            {CTA_REASSURANCE}
          </p>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── CTA de fin de page ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-5 px-5 py-12 sm:py-16">
          <ShieldCheck className="h-8 w-8 text-accent" aria-hidden />
          <h2 className="max-w-xl text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-[34px]">
            Vingt minutes pour savoir où tu en es
          </h2>
          <p className="max-w-lg text-[15px] leading-relaxed text-primary-foreground/75">
            On regarde ta situation, tes échéances et ce que ça représente. En français. Tu repars
            avec une réponse claire, que tu travailles avec nous ou non.
          </p>
          <div className="w-full sm:w-auto">
            <CtaButton placement="final" variant="secondary" />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── Réservation ── */}
      <section id={BOOKING_ANCHOR} className="border-b bg-secondary scroll-mt-4">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
          <SectionTitle>Choisis ton créneau</SectionTitle>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            20 minutes, en visio, en français. Nom et e-mail suffisent.
          </p>
          {booked && (
            <p
              role="status"
              className="mt-6 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-[15px] font-medium text-emerald-900"
            >
              Rendez-vous confirmé. Tu reçois l’invitation et le lien de visio par e-mail.
            </p>
          )}
          <div className="mt-8">
            <CalEmbed onBooked={() => setBooked(true)} />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── Pied ──
          pb-24 sur mobile : la barre CTA collante ne doit pas masquer les
          mentions légales. */}
      <footer className="bg-primary text-primary-foreground/75">
        <div className="mx-auto max-w-4xl px-5 py-10 pb-24 sm:pb-10">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-0.5 text-[13px] leading-relaxed">
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
                  className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-primary-foreground"
                >
                  {LEGAL.email}
                </a>
              </p>
              <p className="text-[11px] leading-relaxed text-primary-foreground/50">
                Hébergement : {HOST}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:flex-col sm:items-start">
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

          <p className="mt-8 border-t border-white/10 pt-5 text-[11px] leading-relaxed text-primary-foreground/50">
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

          `invisible` en plus de translate-y-full : sans elle, le bouton reste
          dans l'ordre de tabulation alors que la barre est aria-hidden — un
          manquement WCAG 4.1.2. */}
      {FLAGS.stickyMobileCta && (
        <div
          aria-hidden={!showSticky}
          className={`fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-3 backdrop-blur transition-transform duration-200 motion-reduce:transition-none sm:hidden ${
            showSticky ? 'translate-y-0' : 'invisible translate-y-full'
          }`}
        >
          <CtaButton placement="sticky" />
        </div>
      )}
    </div>
  );
}
