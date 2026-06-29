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
  Percent, RefreshCw, Megaphone, FileSpreadsheet, Sparkles, LineChart, Lock, Star, Globe,
} from 'lucide-react';
import { BrandLockup } from '@/components/layout/BrandLockup';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { BOOKING_SCHEDULE_URL } from '@/lib/config';
import { trackLead } from '@/lib/tracking';

// ─────────────────────────────────────────────────────────────────────────────
// Valeurs RÉELLES (ne rien inventer : la fausse preuve tue la confiance)
const PRICE_FROM = '700';
const CURRENCY = '$'; // USD — devise de facturation
const STATS = [
  { value: '+40', label: 'marques accompagnées' },
  { value: '35 M€', label: 'de CA piloté' },
  { value: '5', label: 'juridictions couvertes' }, // FR · PT · UAE · US · HK
];
// Logos clients (autorisation OK) — chemins alignés sur les fichiers réels de public/logos/.
const LOGOS: { name: string; src: string }[] = [
  { name: 'TotalEnergies', src: '/logos/total.jpg' },
  { name: 'Skalis', src: '/logos/skalis.png' },
  { name: 'Bocuse', src: '/logos/bocuse.png' },
  { name: 'Chicken Street', src: '/logos/chickenstreet.png' },
  { name: 'Café Crème', src: '/logos/cafécrème.jpg' },
];
// Pas de témoignage e-commerce réel pour l'instant → section masquée (on ne met PAS de faux).
const TESTIMONIALS: { quote: string; name: string; role: string }[] = [];
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
  { icon: Wallet, t: 'Trésorerie nette & fonds de roulement', d: 'Trésorerie nette (cash + créances − dettes), BFR, et l’impact de la variation de stock sur votre résultat. Anticipez les tensions de cash.' },
  { icon: RefreshCw, t: 'Fidélisation & LTV', d: 'Panier moyen, taux de retour, part de nouveaux clients vs réachat : où se cache votre croissance durable.' },
  { icon: Target, t: 'Verdicts par indicateur', d: 'Chaque KPI noté bon / à surveiller / alerte selon les repères e-commerce — personnalisables pour votre marque.' },
  { icon: LineChart, t: 'L’analyse d’un expert', d: 'Pas qu’un dashboard : chaque mois, la lecture et les recommandations d’un professionnel du conseil financier.' },
];

const STEPS = [
  { icon: FileSpreadsheet, t: 'Récupération de vos exports', d: 'Shopify, Stripe/PayPal, FB Manager, relevés bancaires.' },
  { icon: Sparkles, t: 'On fiabilise & on réconcilie', d: 'On normalise et recoupe toutes vos sources — zéro double-comptage, des chiffres justes.' },
  { icon: TrendingUp, t: 'Call d’1h avec un expert', d: 'Présentation de la data, lecture des chiffres et aide au pilotage.' },
];

const FAQ = [
  { q: 'Dois-je changer mes outils ?', a: 'Non. On se branche sur votre stack actuelle (Shopify, Stripe/PayPal, FB Manager, banque, compta). Vous ne migrez rien, on s’occupe de tout recouper.' },
  { q: 'Mes données sont-elles en sécurité ?', a: 'Oui. Espace sécurisé, accès restreint, conformité RGPD. Vos fichiers ne servent qu’à produire vos rapports.' },
  { q: 'Quelles sources gérez-vous ?', a: 'Tout : Shopify, Stripe, PayPal, Whop, FB Manager & régies pub, exports comptables, relevés bancaires… On s’adapte à votre stack et on recoupe l’ensemble.' },
  { q: 'Est-ce adapté à ma taille ?', a: 'À partir d’environ 1 000 $/jour de CA, il y a presque toujours de quoi optimiser — et un vrai intérêt à s’entourer sur la partie finance. Si vous faites de la pub et voulez piloter votre rentabilité réelle, c’est pour vous.' },
  { q: 'Quel est le tarif ?', a: `À partir de ${PRICE_FROM} ${CURRENCY}/mois, sans engagement. On cale la bonne formule ensemble lors de l’échange.` },
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
            <CalendarCheck className="w-4 h-4 mr-2" /> Découvrir la solution
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
              Votre shop fait du CA.<br />
              Mais gagne-t-il <span className="relative whitespace-nowrap">vraiment<span className="absolute left-0 -bottom-1 w-full h-2.5 bg-accent/40 -z-10" /></span> de l'argent&nbsp;?
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-xl">
              Daftime réconcilie Shopify, Stripe, FB Manager, banques et comptabilité en un dashboard clair —
              et un expert vous dit et vous conseille chaque mois&nbsp;: où vous gagnez, où vous perdez, et comment piloter.
              <strong className="text-foreground"> Marge réelle, ROAS, BFR, AOV, trésorerie.</strong>
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button onClick={() => book('hero')} className="h-12 px-6 text-base">
                <CalendarCheck className="w-4 h-4 mr-2" /> Découvrir la solution gratuitement
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')} className="h-12 px-6 text-base">
                Accéder à mon espace <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Échange gratuit avec un expert · sans engagement
            </p>
            {/* Bandeau de confiance */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> {STATS[0].value} {STATS[0].label}</span>
              <span className="flex items-center gap-1.5"><Wallet className="w-4 h-4 text-primary" /> {STATS[1].value} {STATS[1].label}</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" /> {STATS[2].value} {STATS[2].label}</span>
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
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {LOGOS.map((l) => <Logo key={l.name} name={l.name} src={l.src} />)}
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
          <p className="text-muted-foreground mt-3">Comme vous le savez, un shop ne se pilote pas à l'instinct&nbsp;:</p>
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

      {/* Témoignages — affichés uniquement s'il en existe de réels */}
      {TESTIMONIALS.length > 0 && (
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
      )}

      {/* Offre / prix */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Un pilotage S-Tier, sans payer un CFO 100k$</h2>
        <p className="text-muted-foreground mt-3">Dashboard personnalisé + analyse mensuelle d'un expert. Tout compris.</p>
        <div className="mt-6 inline-flex items-baseline gap-2">
          <span className="text-muted-foreground">À partir de</span>
          <span className="text-4xl font-semibold tracking-tight">{PRICE_FROM} {CURRENCY}</span>
          <span className="text-muted-foreground">/ mois</span>
        </div>
        <ul className="mt-6 inline-flex flex-col gap-2 text-left text-sm">
          {['Dashboard sur-mesure adapté à votre marque', 'Analyse & recommandations chaque mois', 'Toutes vos sources réconciliées', 'Sans engagement, résiliable à tout moment'].map((x) => (
            <li key={x} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {x}</li>
          ))}
        </ul>
        <div className="mt-8">
          <Button onClick={() => book('pricing')} className="h-12 px-6 text-base">
            <CalendarCheck className="w-4 h-4 mr-2" /> Découvrir la solution gratuitement
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
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Sachez précisément où va votre argent</h2>
          <p className="text-primary-foreground/75 max-w-lg">Échange offert avec un expert : on regarde vos chiffres ensemble et on vous montre votre vraie rentabilité. Sans engagement.</p>
          <Button onClick={() => book('cta_final')} variant="secondary" className="h-12 px-6 text-base">
            <CalendarCheck className="w-4 h-4 mr-2" /> Découvrir la solution gratuitement
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

// Aperçu de dashboard pour le hero — riche et premium (KPIs + verdicts, courbe CA, charges, entonnoir).
function DashboardPreview() {
  const kpis = [
    { l: 'CA du mois', v: '136 840 €', dot: '', note: '+12 % vs M-1', noteCls: 'text-emerald-600' },
    { l: 'ROAS', v: '1,98', dot: 'bg-red-500', note: 'pub non rentable' },
    { l: 'Conversion', v: '3,06 %', dot: 'bg-emerald-500', note: 'sain' },
    { l: 'Marge nette', v: '−23 %', dot: 'bg-red-500', note: 'à corriger' },
    { l: 'Panier moyen', v: '72,79 €', dot: 'bg-amber-500', note: 'à surveiller' },
    { l: 'Trésorerie', v: '28 670 €', dot: '', note: '−340 € sur le mois', noteCls: 'text-muted-foreground' },
  ];
  return (
    <div className="relative">
      <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-60">E-commerce · Avril 2026</div>
            <div className="font-semibold text-[15px]">Votre marque</div>
          </div>
          <span className="text-[10px] font-semibold bg-white/15 rounded-full px-2.5 py-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> À jour
          </span>
        </div>

        <div className="p-4 space-y-3">
          {/* KPIs avec verdicts */}
          <div className="grid grid-cols-3 gap-2">
            {kpis.map((k) => (
              <div key={k.l} className="rounded-lg border p-2.5">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold truncate">{k.l}</div>
                <div className="text-base font-bold mt-0.5 tabular-nums leading-tight">{k.v}</div>
                {k.note && (
                  <div className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${k.noteCls ?? 'text-muted-foreground'}`}>
                    {k.dot && <span className={`w-1.5 h-1.5 rounded-full ${k.dot}`} />}{k.note}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Courbe de CA */}
          <div className="rounded-xl border p-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Chiffre d'affaires · 6 mois</span>
              <span className="text-[10px] font-semibold text-emerald-600">+12 %</span>
            </div>
            <svg viewBox="0 0 320 88" className="w-full h-20" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lpArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points="6,70 68,64 130,54 192,52 254,38 314,26 314,88 6,88" fill="url(#lpArea)" />
              <polyline points="6,70 68,64 130,54 192,52 254,38 314,26" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="314" cy="26" r="3.5" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
            </svg>
          </div>

          {/* Charges + entonnoir */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Structure des charges</div>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full flex-shrink-0" style={{ background: 'conic-gradient(hsl(var(--primary)) 0 50%, hsl(var(--accent)) 50% 80%, hsl(var(--muted-foreground)/0.35) 80% 100%)' }}>
                  <div className="absolute inset-[5px] rounded-full bg-card" />
                </div>
                <div className="text-[10px] space-y-1">
                  <Leg color="hsl(var(--primary))" label="Pub" val="50 %" />
                  <Leg color="hsl(var(--accent))" label="COGS" val="30 %" />
                  <Leg color="hsl(var(--muted-foreground)/0.35)" label="Autres" val="20 %" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Conversion</div>
              <div className="space-y-1.5">
                {[{ l: 'Sessions', v: '61 410', w: 100 }, { l: 'Paniers', v: '5 590', w: 38 }, { l: 'Commandes', v: '1 880', w: 18 }].map((f) => (
                  <div key={f.l}>
                    <div className="flex justify-between text-[9px] text-muted-foreground font-medium"><span>{f.l}</span><span className="tabular-nums">{f.v}</span></div>
                    <div className="h-2 rounded-full mt-0.5" style={{ width: `${f.w}%`, background: 'hsl(var(--primary))', opacity: 0.85 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Position financière (fonds de roulement) */}
          <div className="rounded-xl border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Position financière</div>
            <div className="grid grid-cols-3 gap-2">
              <FinStat label="Trésorerie nette" value="−9 330 €" sub="cash + créances − dettes" tone="amber" />
              <FinStat label="BFR" value="18 j" sub="de CA" tone="emerald" />
              <FinStat label="Var. de stock" value="+42 k€" sub="+42 k€ sur le résultat" tone="muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Badges flottants */}
      <div className="absolute -bottom-3 -left-3 bg-card border rounded-xl shadow-lg px-3 py-2 text-xs font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" /> Diagnostic : 2 forces · 5 alertes
      </div>
      <div className="absolute -top-3 -right-3 bg-card border rounded-xl shadow-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500" /> ROAS sous le seuil
      </div>
    </div>
  );
}

function FinStat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'amber' | 'emerald' | 'muted' }) {
  const c = tone === 'amber' ? 'text-amber-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-foreground';
  return (
    <div className="rounded-lg bg-secondary/40 p-2">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold truncate">{label}</div>
      <div className={`text-sm font-bold mt-0.5 tabular-nums ${c}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{sub}</div>
    </div>
  );
}

function Leg({ color, label, val }: { color: string; label: string; val: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold ml-auto tabular-nums">{val}</span>
    </div>
  );
}

// Logo client : image en niveaux de gris, repli sur le nom si le fichier est absent.
function Logo({ name, src }: { name: string; src: string }) {
  const [err, setErr] = useState(false);
  if (err) return <span className="text-sm font-semibold text-muted-foreground">{name}</span>;
  return (
    <img
      src={src} alt={name} title={name} loading="lazy" onError={() => setErr(true)}
      className="h-8 w-auto max-w-[120px] object-contain opacity-90 hover:opacity-100 transition"
    />
  );
}

// Petit point décoratif e-commerce (évite d'importer une icône de plus).
function ShoppingBagDot() {
  return <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />;
}
