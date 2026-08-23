// ═══════════════════════════════════════════════════════════════════════════
//  Landing DAFTIME PORTUGAL — cible : entrepreneurs français installés au Portugal.
//
//  Une seule page, une seule action : réserver 20 minutes.
//  4 publicités Meta pointent ici ; `?a=1..4` change UNIQUEMENT le titre du hero
//  pour que chaque annonce retrouve sa promesse à l'arrivée. Défaut : 1.
//
//  Toutes les valeurs à renseigner sont dans `src/landing-portugal/config.ts`.
//  Tous les textes sont dans `src/landing-portugal/content.ts`.
// ═══════════════════════════════════════════════════════════════════════════
import { useMemo, useState } from 'react';
import {
  ArrowRight, Check, Clock, FileCheck2, Languages, ShieldCheck, Stamp, Users,
} from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { Button } from '@/components/ui/button';

import { EINVOICING_DEADLINE, FLAGS, HOST, LEGAL, LINKS, PRICING } from '@/landing-portugal/config';
import {
  DUO, EINVOICING, FAQ, HERO_REASSURANCE, HERO_SUBTITLE, HERO_VARIANTS, PROBLEMS, RNH, SERVICES,
  type HeroVariantKey,
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

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ───────────────────────────────────────────────────────── En-tête ── */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-5">
          <img
            src={daftimeLogo}
            alt="Daftime"
            width={96}
            height={22}
            className="h-[22px] w-auto"
          />
          <span className="h-4 w-px bg-border" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            Portugal
          </span>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-5 pb-12 pt-10 sm:pb-16 sm:pt-14">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            {hero.eyebrow}
          </span>
          <h1 className="mt-5 text-[32px] font-semibold leading-[1.12] tracking-tight sm:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {HERO_SUBTITLE}
          </p>
          <div className="mt-8">
            <CtaButton placement="hero" />
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>{HERO_REASSURANCE}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── Problème ── */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:py-16">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Ce qui coince, quand on dirige une société portugaise depuis la France
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="rounded-xl border bg-card p-5">
                <h3 className="text-[15px] font-semibold leading-snug">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── Ce qu'on fait ── */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-16">
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Ce qu’on prend en charge
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Un forfait mensuel, et l’ensemble des obligations comptables et déclaratives de ta
          société portugaise à l’intérieur. Déclarations annuelles comprises.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-xl border bg-card p-5">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold">
                <Check className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Le binôme */}
        <div className="mt-10 rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
          <h3 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
            <Users className="h-5 w-5 text-accent" />
            {DUO.title}
          </h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {DUO.members.map((m, i) => (
              <div key={m.label} className={i === 0 ? 'sm:border-r sm:border-white/15 sm:pr-6' : ''}>
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  {i === 0 ? <Stamp className="h-4 w-4" /> : <Languages className="h-4 w-4" />}
                  {m.label}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── Tarifs ── */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tarifs</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Un forfait mensuel, tout compris. Pas de ligne surprise au moment des déclarations
            annuelles.
          </p>

          <div className="mt-7 rounded-2xl border bg-card p-6 sm:p-8">
            <p className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">À partir de</span>
              <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                {PRICING.from} {PRICING.currency}
              </span>
              <span className="text-sm text-muted-foreground">{PRICING.period}</span>
            </p>

            <p className="mt-6 flex items-center gap-2 text-sm font-semibold">
              <FileCheck2 className="h-4 w-4 text-emerald-600" />
              Compris dans le forfait
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {PRICING.included.map((x) => (
                <li key={x} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  {x}
                </li>
              ))}
            </ul>

            <p className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              {PRICING.footnote}
            </p>
          </div>

          {/* CTA milieu de page */}
          <div className="mt-8">
            <CtaButton placement="tarifs" />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── RNH ── */}
      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-14">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-900">
            <Clock className="h-3.5 w-3.5" />
            10 ans, non renouvelables
          </span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">{RNH.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-950/85">{RNH.body}</p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-amber-950">{RNH.kicker}</p>
          <div className="mt-6">
            <CtaButton placement="rnh" />
          </div>
        </div>
      </section>

      {/* ────────────────────────────────── Facturation électronique (FLAG) ── */}
      {/* Bloc éphémère : basculer FLAGS.showEInvoicing à false début 2027. */}
      {FLAGS.showEInvoicing && (
        <section className="border-y bg-secondary/40">
          <div className="mx-auto max-w-3xl px-5 py-12 sm:py-14">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              Échéance {EINVOICING_DEADLINE}
            </span>
            <h2 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
              {EINVOICING.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{EINVOICING.body}</p>
            <ul className="mt-4 space-y-2">
              {EINVOICING.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────── FAQ ── */}
      <section className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Questions fréquentes</h2>
        <div className="mt-7 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl border bg-card p-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-medium">
                {f.q}
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────── CTA de fin de page ── */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-4 px-5 py-14 sm:items-center sm:py-16 sm:text-center">
          <ShieldCheck className="h-8 w-8 text-accent" />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Vingt minutes pour savoir où tu en es
          </h2>
          <p className="max-w-lg text-primary-foreground/80">
            On regarde ta situation, tes échéances et ce que ça représente. En français. Tu
            repars avec une réponse claire, que tu travailles avec nous ou non.
          </p>
          <div className="w-full sm:w-auto">
            <CtaButton placement="final" variant="secondary" />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── Réservation ── */}
      <section id={BOOKING_ANCHOR} className="scroll-mt-4">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Choisis ton créneau
          </h2>
          <p className="mt-3 text-muted-foreground">
            20 minutes, en visio, en français. Nom et e-mail suffisent.
          </p>
          {booked && (
            <p
              role="status"
              className="mt-5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
            >
              Rendez-vous confirmé. Tu reçois l’invitation et le lien de visio par e-mail.
            </p>
          )}
          <div className="mt-6">
            <CalEmbed onBooked={() => setBooked(true)} />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── Pied ── */}
      <footer className="bg-primary text-primary-foreground/70">
        <div className="mx-auto max-w-5xl px-5 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 text-sm">
              <img
                src={daftimeLogoWhite}
                alt="Daftime"
                width={112}
                height={28}
                className="mb-4 h-7 w-auto"
              />
              <p className="font-semibold text-primary-foreground">{LEGAL.name}</p>
              <p>{LEGAL.qualifier}</p>
              <p>
                {LEGAL.address} — {LEGAL.country}
              </p>
              <p>
                <a href={`mailto:${LEGAL.email}`} className="underline underline-offset-2">
                  {LEGAL.email}
                </a>
              </p>
              <p className="pt-2 text-xs text-primary-foreground/50">Hébergement : {HOST}</p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <Button
                asChild
                variant="secondary"
                className="h-11 px-5"
              >
                <a href={LINKS.mainSite} target="_blank" rel="noopener noreferrer">
                  Découvrir Daftime
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <a
                href={LINKS.privacy}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline underline-offset-2"
              >
                Politique de confidentialité
              </a>
            </div>
          </div>

          <p className="mt-8 border-t border-white/10 pt-6 text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} {LEGAL.name}. Tous droits réservés. Les informations
            fiscales et réglementaires présentées sur cette page sont données à titre indicatif et
            ne constituent pas un conseil personnalisé.
          </p>
        </div>
      </footer>

      {consent === 'unknown' && <ConsentBanner onAccept={accept} onRefuse={refuse} />}
    </div>
  );
}
