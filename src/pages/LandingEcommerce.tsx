// Landing E-COMMERCE dédiée aux campagnes publicitaires (trafic froid → prise de RDV).
// Objectif unique : convertir un e-commerçant en rendez-vous. Optimisée CRO :
// promesse spécifique, preuve sociale, bénéfices chiffrés, levée d'objections, tracking.
//
// 👉 À REMPLIR avant de lancer les ads : PRICE_FROM, STATS, LOGOS, TESTIMONIALS (données RÉELLES).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck, X, ArrowRight, ShieldCheck, Check, TrendingUp, Wallet, Target,
  Percent, RefreshCw, Megaphone, FileSpreadsheet, Sparkles, LineChart, Lock, Star,
} from 'lucide-react';
import { BrandLockup } from '@/components/layout/BrandLockup';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { BOOKING_SCHEDULE_URL } from '@/lib/config';
import { trackLead } from '@/lib/tracking';

// ─────────────────────────────────────────────────────────────────────────────
// À REMPLIR — données RÉELLES (ne rien inventer : la fausse preuve tue la confiance)
const PRICE_FROM = 'XXX'; // ex. '490' → « À partir de 490 €/mois »
const STATS = [
  { value: '[XX]', label: 'marques e-commerce accompagnées' }, // À REMPLIR
  { value: '[X,X M€]', label: 'de CA piloté' },                 // À REMPLIR
  { value: '[4,9/5]', label: 'satisfaction client' },          // À REMPLIR
];
const LOGOS = ['[Logo 1]', '[Logo 2]', '[Logo 3]', '[Logo 4]', '[Logo 5]']; // À REMPLIR (images clients)
const TESTIMONIALS = [
  { quote: '[Verbatim client réel — ce que Daftime a changé pour eux, idéalement avec un chiffre.]', name: '[Prénom Nom]', role: '[Fondateur·rice, Marque]' },
  { quote: '[Verbatim client réel — gain de clarté / décision prise grâce au dashboard.]', name: '[Prénom Nom]', role: '[CEO, Marque]' },
];
// ─────────────────────────────────────────────────────────────────────────────

const PAINS = [
  'Votre CA monte mais le compte en banque ne suit pas',
  'Impossible de savoir si vos pubs sont vraiment rentables',
  'Votre marge réelle (après pub, frais Stripe, logistique) reste un mystère',
  'Vos données sont éclatées entre Shopify, Stripe, la pub et la banque',
];

const BENEFITS = [
  { icon: Megaphone, t: 'Pub vraiment rentable', d: 'Votre ROAS relié à la marge réelle, pas au ROAS de la plateforme. On vous dit si votre acquisition gagne ou perd de l’argent.' },
  { icon: Percent, t: 'Votre vraie marge', d: 'Marge nette après COGS, pub, frais PSP (Stripe/PayPal) et logistique. La rentabilité réelle, pas le CA.' },
  { icon: Wallet, t: 'Trésorerie & BFR', d: 'Trésorerie, besoin en fonds de roulement, frais et versements PSP : anticipez les tensions de cash.' },
  { icon: RefreshCw, t: 'Fidélisation & LTV', d: 'Panier moyen, taux de retour, part de nouveaux clients vs réachat : où se cache votre croissance durable.' },
  { icon: Target, t: 'Verdicts par indicateur', d: 'Chaque KPI noté bon / à surveiller / alerte selon les repères e-commerce — personnalisables pour votre marque.' },
  { icon: LineChart, t: 'L’analyse d’un expert', d: 'Pas qu’un dashboard : chaque mois, la lecture et les recommandations d’un professionnel du conseil financier.' },
];

const STEPS = [
  { icon: FileSpreadsheet, t: 'Vous déposez vos exports', d: 'Shopify, Stripe/PayPal, régies pub, relevés bancaires. 10 minutes, une fois par mois.' },
  { icon: Sparkles, t: 'On fiabilise & on réconcilie', d: 'On normalise et recoupe toutes vos sources — zéro double-comptage, des chiffres justes.' },
  { icon: TrendingUp, t: 'Vous recevez dashboard + analyse', d: 'Un dashboard clair et personnalisé, plus l’analyse et les conseils d’un expert pour décider.' },
];

const FAQ = [
  { q: 'Combien de temps ça me prend chaque mois ?', a: 'Environ 10 minutes : vous déposez vos exports, on s’occupe du reste. Vous recevez votre dashboard et l’analyse.' },
  { q: 'Mes données sont-elles en sécurité ?', a: 'Oui. Espace sécurisé, accès restreint, conformité RGPD. Vos fichiers ne servent qu’à produire vos rapports.' },
  { q: 'Quelles sources gérez-vous ?', a: 'Shopify, Stripe, PayPal, Whop, régies publicitaires (Meta/Google), exports comptables et relevés bancaires. On s’adapte à votre stack.' },
  { q: 'Est-ce adapté à ma taille ?', a: 'Si vous faites de la pub et voulez piloter votre rentabilité réelle, oui — de la marque en croissance au e-commerce établi.' },
  { q: 'Quel est le tarif ?', a: `À partir de ${PRICE_FROM} €/mois, sans engagement. On en parle ensemble pendant l’audit offert pour caler la bonne formule.` },
];

export default function LandingEcommerce() {
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);

  const book = (source: string) => { trackLead(source); setBookingOpen(true); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLockup />
          <Button size="sm" onClick={() => book('nav')} className="hidden sm:inline-flex">
            <CalendarCheck className="w-4 h-4 mr-2" /> Audit offert
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-12 grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1.5">
              <ShoppingBagDot /> Pour les marques e-commerce
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
              Votre e-commerce fait du CA.<br />
              Mais gagne-t-il <span className="relative whitespace-nowrap">vraiment<span className="absolute left-0 -bottom-1 w-full h-2.5 bg-accent/40 -z-10" /></span> de l'argent&nbsp;?
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-xl">
              Daftime réconcilie Shopify, Stripe, votre pub et votre banque en un dashboard clair —
              et un expert vous dit chaque mois où vous gagnez et où vous perdez&nbsp;:
              <strong className="text-foreground"> marge réelle, ROAS rentable, BFR, trésorerie.</strong>
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button onClick={() => book('hero')} className="h-12 px-6 text-base">
                <CalendarCheck className="w-4 h-4 mr-2" /> Réserver mon audit gratuit
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')} className="h-12 px-6 text-base">
                Accéder à mon espace <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Audit de 30 min · 100&nbsp;% gratuit · sans engagement
            </p>
            {/* Bandeau de confiance */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-accent text-accent" /> {STATS[2].value} {STATS[2].label}</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> {STATS[0].value} {STATS[0].label}</span>
            </div>
          </div>

          {/* Visuel produit : aperçu de dashboard (verdicts) */}
          <DashboardPreview />
        </div>
      </section>

      {/* Preuve sociale — logos + chiffres */}
      <section className="border-y bg-secondary/40">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ils pilotent leur rentabilité avec Daftime</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {LOGOS.map((l, i) => (
              <span key={i} className="text-sm font-semibold text-muted-foreground">{l}</span>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center rounded-xl bg-card border p-5">
                <div className="text-3xl font-semibold tracking-tight">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problème */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Le CA ne dit pas si vous êtes rentable.</h2>
          <p className="text-muted-foreground mt-3">Comme la plupart des e-commerçants, vous pilotez sans doute à l'instinct&nbsp;:</p>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {PAINS.map((p) => (
            <div key={p} className="flex items-start gap-3 rounded-xl border bg-card p-5">
              <span className="mt-0.5 w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0"><X className="w-3.5 h-3.5" /></span>
              <span className="text-sm">{p}</span>
            </div>
          ))}
        </div>
        <p className="mt-8 text-lg font-medium">Daftime transforme ce flou en décisions claires.</p>
      </section>

      {/* Comment ça marche */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">Votre pilotage financier en 3 étapes</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.t} className="rounded-xl bg-card border p-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><s.icon className="w-5 h-5" /></div>
                  <span className="text-sm font-semibold text-muted-foreground">Étape {i + 1}</span>
                </div>
                <h3 className="font-semibold text-lg mt-4">{s.t}</h3>
                <p className="text-muted-foreground text-sm mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bénéfices */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Ce que vous voyez enfin clairement</h2>
          <p className="text-muted-foreground mt-3">Des indicateurs e-commerce qui comptent vraiment — avec le verdict qui va avec.</p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.t} className="rounded-xl border bg-card p-6 transition hover:shadow-md hover:border-primary/30">
              <div className="w-11 h-11 rounded-xl bg-accent/15 text-primary flex items-center justify-center mb-4"><b.icon className="w-5 h-5" /></div>
              <h3 className="font-semibold text-lg">{b.t}</h3>
              <p className="text-muted-foreground text-sm mt-2">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignages */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">Ce qu'en disent les marques accompagnées</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="rounded-xl bg-card border p-6">
                <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="w-4 h-4 fill-accent text-accent" />)}</div>
                <blockquote className="text-[15px] leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-sm"><span className="font-semibold">{t.name}</span> · <span className="text-muted-foreground">{t.role}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Offre / prix */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Un pilotage de niveau DAF, sans recruter de DAF</h2>
        <p className="text-muted-foreground mt-3">Dashboard personnalisé + analyse mensuelle d'un expert. Tout compris.</p>
        <div className="mt-6 inline-flex items-baseline gap-2">
          <span className="text-muted-foreground">À partir de</span>
          <span className="text-4xl font-semibold tracking-tight">{PRICE_FROM} €</span>
          <span className="text-muted-foreground">/ mois</span>
        </div>
        <ul className="mt-6 inline-flex flex-col gap-2 text-left text-sm">
          {['Dashboard sur-mesure adapté à votre marque', 'Analyse & recommandations chaque mois', 'Toutes vos sources réconciliées', 'Sans engagement, résiliable à tout moment'].map((x) => (
            <li key={x} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {x}</li>
          ))}
        </ul>
        <div className="mt-8">
          <Button onClick={() => book('pricing')} className="h-12 px-6 text-base">
            <CalendarCheck className="w-4 h-4 mr-2" /> Réserver mon audit gratuit
          </Button>
          <p className="text-sm text-muted-foreground mt-3 flex items-center justify-center gap-2"><Lock className="w-3.5 h-3.5" /> Données sécurisées · RGPD · sans engagement</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl border bg-card p-5">
                <summary className="flex items-center justify-between cursor-pointer font-medium list-none">
                  {f.q}
                  <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="text-muted-foreground text-sm mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="max-w-3xl mx-auto px-6 py-16 relative flex flex-col items-center text-center gap-5">
          <ShieldCheck className="w-8 h-8 text-accent" />
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Sachez en 30 minutes où va votre argent</h2>
          <p className="text-primary-foreground/75 max-w-lg">Audit offert : on regarde vos chiffres ensemble et on vous montre votre vraie rentabilité. Sans engagement.</p>
          <Button onClick={() => book('cta_final')} variant="secondary" className="h-12 px-6 text-base">
            <CalendarCheck className="w-4 h-4 mr-2" /> Réserver mon audit gratuit
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground/60 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={daftimeLogoWhite} alt="Daftime" className="h-7 w-auto" />
          <p className="text-sm">© 2026 Daftime Advisory. Tous droits réservés.</p>
        </div>
      </footer>

      {/* Modale RDV */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setBookingOpen(false)}>
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setBookingOpen(false)} aria-label="Fermer" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/90 border flex items-center justify-center hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
            <iframe src={BOOKING_SCHEDULE_URL} title="Prendre rendez-vous" className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
}

// Petit aperçu de dashboard pour le hero (montre le produit + les verdicts).
function DashboardPreview() {
  const kpis = [
    { l: 'CA du mois', v: '13 684 €', dot: '', note: '' },
    { l: 'ROAS', v: '1,98', dot: 'bg-red-500', note: 'sous le seuil rentable' },
    { l: 'Marge nette', v: '-23 %', dot: 'bg-red-500', note: 'à corriger' },
    { l: 'Conversion', v: '3,06 %', dot: 'bg-emerald-500', note: 'sain' },
  ];
  return (
    <div className="relative">
      <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
        <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-60">E-commerce · Avril 2026</div>
            <div className="font-semibold">Votre marque</div>
          </div>
          <LineChart className="w-5 h-5 opacity-80" />
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {kpis.map((k) => (
            <div key={k.l} className="rounded-xl border p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{k.l}</div>
              <div className="text-xl font-bold mt-1 tabular-nums">{k.v}</div>
              {k.note && <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><span className={`w-1.5 h-1.5 rounded-full ${k.dot}`} />{k.note}</div>}
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <div className="rounded-xl border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Du CA au résultat</div>
            <div className="flex items-end gap-1.5 h-16">
              {[100, 76, 56, 30].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 3 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))', opacity: 0.85 - i * 0.12 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-3 -left-3 bg-card border rounded-xl shadow-lg px-3 py-2 text-xs font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" /> Diagnostic : 2 forces · 5 alertes
      </div>
    </div>
  );
}

// Petit point décoratif e-commerce (évite d'importer une icône de plus).
function ShoppingBagDot() {
  return <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />;
}
