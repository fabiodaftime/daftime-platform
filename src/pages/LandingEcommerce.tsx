// Landing E-COMMERCE (Meta Ads → 100 % mobile). Conçue MOBILE-FIRST (375px d'abord).
// Offre : premier dashboard financier OFFERT (formulaire lead), pas de call de vente.
// Sans témoignage → la DÉMONSTRATION du produit est la preuve. Ton direct, tutoiement.
import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, ShieldCheck, Lock, Video, Target, Compass, type LucideIcon } from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { BookingModal } from '@/components/booking/BookingModal';
import { trackLead, trackViewContent } from '@/lib/tracking';
import { initCalTracking } from '@/lib/cal';

const CTA = 'Recevoir mon dashboard gratuit';

const STEPS = [
  { n: 1, t: 'Tu réserves ton call', d: '20 min pour faire le point sur ton shop. On voit ensemble ce qui coince.' },
  { n: 2, t: 'On récupère tes accès', d: 'Shopify, Stripe, Meta Ads, relevés bancaires. On te guide, ça prend 5 min.' },
  { n: 3, t: 'On le décortique ensemble', d: 'Ton dashboard livré sous 2 jours, puis 1h de revue avec ton analyste : où tu gagnes, où tu perds, sur quoi agir. Tu le gardes.' },
];

const FAQ = [
  { q: 'Ça me prend combien de temps chaque mois ?', a: '1 à 2h en visio avec ton analyste, c’est tout. Le reste — récupération des données, génération du dashboard — c’est géré de notre côté.' },
  { q: 'Mes chiffres sont un bordel total, c’est grave ?', a: 'Non. C’est le cas de 90 % des shops qu’on reprend.' },
  { q: 'Je dois changer d’outils ?', a: 'Non. On s’adapte à ce que tu utilises déjà.' },
  { q: 'Et si je veux arrêter ?', a: 'Sans engagement. Tu résilies quand tu veux, tu gardes tes dashboards.' },
  { q: 'Mes données sont en sécurité ?', a: 'Oui. Espace sécurisé, accès restreint, conformité RGPD. Tes fichiers ne servent qu’à produire tes rapports.' },
  { q: 'Vous êtes qui exactement ?', a: 'La branche conseil d’un cabinet comptable, spécialisée e-commerce. La personne qui regarde tes chiffres, c’est Fabio (section plus haut).' },
];

export default function LandingEcommerce() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  // Le "dashboard gratuit" démarre par un call de cadrage → on ouvre le calendrier cal.com.
  // Clic = intention (Meta "Lead") ; RDV confirmé = conversion (Meta "Schedule", via initCalTracking).
  const openLead = (source: string) => { trackLead(source); setBooking(true); };

  useEffect(() => { initCalTracking(); }, []);

  // Sticky CTA après le 1er scroll + ViewContent au scroll 50 % (une fois).
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setShowSticky(y > window.innerHeight * 0.6);
      if (h > 0 && y / h >= 0.5) trackViewContent({ page: 'ecommerce' });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── HEADER sticky compact (56px) ── */}
      <header className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <img src={daftimeLogo} alt="Daftime Advisory" className="h-8 w-auto" />
          <button onClick={() => navigate('/auth')} className="text-[13px] font-normal text-muted-foreground/70 hover:text-foreground transition-colors">
            Accéder à mon espace
          </button>
        </div>
      </header>

      {/* ── HERO — tient dans le premier écran (dvh) ── */}
      <section className="px-4 pt-6 pb-8 flex flex-col justify-center min-h-[calc(100dvh-3.5rem)]">
        <div className="max-w-lg mx-auto w-full">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Pour les marques e-commerce
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-semibold leading-[1.12] tracking-tight">
            Ton shop fait du CA.<br />
            Mais est-ce qu’il gagne <span className="relative whitespace-nowrap">vraiment<span className="absolute left-0 -bottom-0.5 w-full h-2 bg-accent/40 -z-10" /></span> de l’argent&nbsp;?
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            On réconcilie Shopify, Stripe, Meta Ads, ta banque et ta compta. Chaque mois, un expert t’aide à décrypter tes chiffres : où tu gagnes, où tu perds, sur quoi agir.
          </p>

          <Button onClick={() => openLead('hero')} className="mt-6 w-full h-12 text-base font-semibold">
            {CTA}
          </Button>
          <p className="mt-2.5 text-xs text-center text-muted-foreground">
            <span className="text-foreground font-medium">20 min de call</span>, puis ton dashboard livré sous 2 jours. <span className="text-foreground font-medium">Offert</span> <span className="whitespace-nowrap">(normalement 700 $/mois)</span> — zéro pitch, tu décides après.
          </p>
          <p className="mt-1 text-xs text-muted-foreground text-center">
            Pensé pour les shops qui font 1 000 $/jour et plus. En dessous, un tableur suffit.
          </p>

          {/* Teaser 3 KPI — voir le produit avant de scroller */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            <TeaserKpi label="ROAS" value="1,98" sub="point mort : 2,8" tone="bad" />
            <TeaserKpi label="Marge" value="−2 %" sub="vs +4 % M-1" tone="bad" />
            <TeaserKpi label="AOV" value="72,79 €" sub="−4 % vs M-1" tone="warn" />
          </div>
        </div>
      </section>

      {/* ── Barre de confiance ── */}
      <div className="border-y bg-secondary/30">
        <p className="max-w-lg mx-auto px-4 py-3 text-center text-xs text-muted-foreground">
          <b className="text-foreground">+40 shops</b> accompagnés · <b className="text-foreground">50 M€</b> de CA e-commerce suivi
        </p>
      </div>

      {/* ── DASHBOARD DÉMO — la pièce maîtresse ── */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Voilà ce qu’on te livre.</h2>
            <p className="mt-2 text-muted-foreground text-sm">Un vrai dashboard, lu et commenté par un expert. Pas un graphique de plus à interpréter seul.</p>
          </div>

          <div className="mt-8"><DashboardDemo /></div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Exemple sur données anonymisées.</p>

          {/* Le raisonnement annoté — c'est ça qui vend */}
          <div className="mt-8 max-w-2xl mx-auto rounded-2xl border bg-card p-5 sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">La lecture du mois</div>
            <ul className="mt-3 space-y-2.5 text-[15px] leading-snug">
              <Reason><b>+12 % de CA</b>, et pourtant tu perds <b>2 700 €</b>. Le CA raconte une histoire, la marge dit la vérité.</Reason>
              <Reason>Ton ROAS tourne à <b>1,98</b>. Ton point mort, lui, est à <b>2,8</b> (= 1 ÷ ta marge après produit, livraison et frais de paiement).</Reason>
              <Reason>Sous ce seuil, <b>chaque euro de pub creuse le trou</b>. Tu ne scales pas ta marque, tu scales une fuite.</Reason>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Personne n’achète un graphique. Ce que tu achètes, c’est quelqu’un qui interprète tes chiffres pour toi et t’aide à piloter.
            </p>
          </div>

          {/* AVANT / APRÈS sur 3 mois */}
          <div className="mt-8 max-w-2xl mx-auto">
            <h3 className="text-center text-lg font-semibold">Le même shop, 3 mois plus tard.</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <BeforeAfter title="Juin" tone="bad" rows={[['Marge', '−2 %'], ['ROAS', '1,98'], ['Cash', '28 670 €']]} />
              <BeforeAfter title="Septembre" tone="good" rows={[['Marge', '+7 %'], ['ROAS', '3,1'], ['Cash', '61 200 €']]} />
            </div>
            <div className="mt-4 rounded-2xl border bg-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Les 3 décisions prises</div>
              <ul className="space-y-2.5 text-sm">
                <Decision n={1}>Réalloué le budget vers les angles au-dessus du point mort, coupé ce qui perdait <span className="text-muted-foreground">(ROAS blended 1,98 → 3,1)</span></Decision>
                <Decision n={2}>Renégocié le COGS fournisseur <span className="text-muted-foreground">(+4 pts de marge par commande)</span></Decision>
                <Decision n={3}>Monté l’AOV avec un bundle <span className="text-muted-foreground">(+11 € → le point mort pub redescend)</span></Decision>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── L'ACCOMPAGNEMENT (l'humain + le quotidien) ── */}
      <section className="px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Bien plus qu’un dashboard.</h2>
            <p className="mt-2 text-muted-foreground text-sm">Un vrai point chaque mois, et de quoi garder la main au quotidien — sans te noyer dans les chiffres.</p>
          </div>
          <div className="mt-8 space-y-4">
            <RitualRow icon={Video} t="Un gros point chaque mois — 1h en visio" d="On décortique ton dashboard ensemble, ligne par ligne. Les 3 points d’attention du mois, et un plan pour le mois d’après. Tu poses toutes tes questions." />
            <RitualRow icon={Target} t="Les KPI à suivre au quotidien, de ton côté" d="On te dit quels 3-4 chiffres regarder chaque jour (2 min), adaptés à TON shop. Tu gardes la main, sans checker 40 métriques." />
            <RitualRow icon={Compass} t="Un humain qui t’aide à piloter" d="Moi ou un analyste spécialisé e-commerce, qui interprète tes chiffres pour toi et t’aide à décider. Jamais un algo, jamais un template." />
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">Le dashboard, c’est l’outil. La vraie valeur, c’est l’interprétation et les décisions qu’on prend ensemble.</p>
        </div>
      </section>

      {/* ── ORIGIN STORY (manifeste) ── */}
      <section className="px-4 py-14">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xl sm:text-2xl font-medium leading-relaxed tracking-tight">
            On est la branche conseil d’un cabinet comptable qui suit <b>+40 e-commerçants</b>. Rien que dans l’e-commerce, on voit passer <b>50 M€ de CA</b> par an.
            Et on s’est rendu compte d’un truc&nbsp;: presque aucun d’eux ne connaît sa vraie marge.
            <span className="block mt-3 text-primary">Alors on a construit ce dashboard.</span>
          </p>
        </div>
      </section>

      {/* ── SECTION HUMAINE ── */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          <Avatar />
          <div className="mt-4 font-semibold text-lg">Fabio Vieira</div>
          <div className="text-xs text-muted-foreground">Founder · Daftime Advisory</div>
          <p className="mt-3 text-muted-foreground text-[15px] leading-relaxed max-w-md">
            Spécialisé e-commerce, issu de l’expertise comptable. Entre Dubaï, Lisbonne et Lyon.
          </p>
          <p className="mt-4 font-medium max-w-md">« Un founder doit passer son temps sur son produit et son acquisition. Pas dans un tableur. »</p>
        </div>
      </section>

      {/* ── 3 ÉTAPES (côté effort client) ── */}
      <section className="px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">Comment ça se passe</h2>
          <div className="mt-8 space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 rounded-2xl border bg-card p-5">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-semibold">{s.n}</div>
                <div>
                  <h3 className="font-semibold">{s.t}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm font-semibold text-primary">Premier dashboard livré sous 2 jours.</p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-md mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Un pilotage S-Tier, sans payer un CFO 100k$</h2>
          <div className="mt-6 rounded-2xl border bg-card p-5 text-left space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>CFO externe</span>
              <span className="tabular-nums line-through">1 000 $ / jour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Daftime</span>
              <span className="tabular-nums font-semibold text-xl">700 $ <span className="text-sm font-normal text-muted-foreground">/ mois</span></span>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            <b className="text-foreground">Ton premier dashboard est offert.</b> Tu le gardes quoi qu'il arrive — tu continues à 700 $/mois seulement si ça t'apporte de la valeur.
          </p>
          <ul className="mt-5 inline-flex flex-col gap-2 text-left text-sm">
            {['Dashboard sur-mesure chaque mois', '1h de revue en visio avec ton analyste', 'Les 3 points d’attention + ton plan', 'Toutes tes sources réconciliées', 'Sans engagement'].map((x) => (
              <li key={x} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> {x}</li>
            ))}
          </ul>
          <Button onClick={() => openLead('pricing')} className="mt-7 w-full h-12 text-base font-semibold">{CTA}</Button>
          <p className="mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Données sécurisées · RGPD · sans engagement</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-8">Les vraies questions</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border bg-card p-5">
                <summary className="flex items-center justify-between gap-3 cursor-pointer font-medium list-none">
                  {f.q}
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="text-muted-foreground text-sm mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-md mx-auto px-4 py-14 flex flex-col items-center text-center gap-4">
          <ShieldCheck className="w-8 h-8 text-accent" />
          <h2 className="text-2xl font-semibold tracking-tight">Sache exactement où va ton argent.</h2>
          <p className="text-primary-foreground/75 text-sm">On te livre ton premier dashboard financier réel. Tu le gardes, même si tu ne prends rien ensuite.</p>
          <Button onClick={() => openLead('cta_final')} variant="secondary" className="w-full h-12 text-base font-semibold">{CTA}</Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-primary text-primary-foreground/60 border-t border-white/10 pb-20 sm:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <img src={daftimeLogoWhite} alt="Daftime" className="h-7 w-auto" />
          <p className="text-xs">© 2026 Daftime Advisory. Tous droits réservés.</p>
        </div>
      </footer>

      {/* ── STICKY CTA MOBILE ── */}
      <div className={`sm:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-primary/95 backdrop-blur border-t border-white/10 transition-transform duration-300 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <Button onClick={() => openLead('sticky')} variant="secondary" className="w-full h-12 text-base font-semibold">{CTA}</Button>
      </div>

      <BookingModal open={booking} onClose={() => setBooking(false)} />
    </div>
  );
}

// ───────────────────────── Dashboard démo (mobile-first) ─────────────────────────
function DashboardDemo() {
  const kpis = [
    { l: 'CA du mois', v: '136 840 €', verdict: '+12 % vs M-1', tone: 'good' as const },
    { l: 'Marge nette · CM3', v: '−2 %', verdict: 'vs +4 % M-1', tone: 'bad' as const },
    { l: 'ROAS', v: '1,98', verdict: 'point mort : 2,8', tone: 'bad' as const },
    { l: 'AOV', v: '72,79 €', verdict: '−4 % vs M-1', tone: 'warn' as const },
    { l: 'Part de réachat', v: '22 %', verdict: 'ta croissance durable', tone: 'good' as const },
    { l: 'Cash', v: '28 670 €', verdict: '−9 330 € ce mois · point bas à venir', tone: 'warn' as const },
  ];
  const costs = [
    { label: 'Achats produit (COGS)', val: '40 %', color: 'hsl(var(--primary))' },
    { label: 'Publicité', val: '38 %', color: 'hsl(var(--accent))' },
    { label: 'Livraison', val: '15 %', color: '#14b8a6' },
    { label: 'Frais de paiement', val: '9 %', color: 'hsl(var(--muted-foreground)/0.4)' },
  ];
  return (
    <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
      {/* En-tête */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-60">E-commerce · Juin 2026</div>
          <div className="font-semibold text-sm">Ta marque</div>
        </div>
        <span className="text-[10px] font-semibold bg-white/15 rounded-full px-2.5 py-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> À jour
        </span>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* KPIs : 1 colonne sur mobile, jamais écrasés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {kpis.map((k) => (
            <div key={k.l} className="rounded-xl border p-3 flex items-center justify-between sm:block">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{k.l}</div>
                <div className="text-xl font-bold mt-0.5 tabular-nums leading-none sm:mt-1">{k.v}</div>
              </div>
              <div className={`text-[11px] font-semibold flex items-center gap-1.5 sm:mt-1.5 ${toneCls(k.tone)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotCls(k.tone)}`} /> {k.verdict}
              </div>
            </div>
          ))}
        </div>

        {/* Cascade de marge CM1 → CM2 → CM3 — le cœur de la lecture */}
        <div className="rounded-xl border p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Ta marge en cascade · sur 100 € de CA</div>
          <div className="space-y-2">
            <CascadeRow label="CM1 · après achat produit" val="60 €" pct={60} tone="good" />
            <CascadeRow label="CM2 · après livraison + paiement" val="36 €" pct={36} tone="warn" note="→ point mort pub = 1 ÷ 36 % = 2,8" />
            <CascadeRow label="CM3 · après pub" val="−2 €" pct={4} tone="bad" note="le vrai chiffre : tu perds sur chaque 100 € vendus" />
          </div>
        </div>

        {/* CA réel vs prévu — ne déborde pas */}
        <div className="rounded-xl border p-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">CA · réel vs prévu</span>
            <span className="text-[11px] font-semibold text-amber-600">−6 % vs prév.</span>
          </div>
          <svg viewBox="0 0 320 80" className="w-full h-16" preserveAspectRatio="none">
            <defs>
              <linearGradient id="dArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points="6,64 70,56 132,50 194,44 256,36 314,26 314,80 6,80" fill="url(#dArea)" />
            <polyline points="6,58 70,50 132,42 194,36 256,26 314,16" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.8" strokeDasharray="4 3" strokeLinecap="round" />
            <polyline points="6,64 70,56 132,50 194,44 256,36 314,26" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1"><span className="inline-block w-3.5 h-[2px] rounded" style={{ background: 'hsl(var(--primary))' }} /> Réel</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3.5 border-t-2 border-dashed" style={{ borderColor: 'hsl(var(--accent))' }} /> Prévu</span>
          </div>
        </div>

        {/* Coûts en % du CA : liste chiffrée (mobile) + donut (desktop) */}
        <div className="rounded-xl border p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Où part chaque 100 € de CA</div>
          <div className="flex items-center gap-4">
            {/* Donut : desktop seulement (illisible en petit) */}
            <div className="relative w-16 h-16 shrink-0 hidden sm:block" style={{ background: 'conic-gradient(hsl(var(--primary)) 0 39%, hsl(var(--accent)) 39% 76%, #14b8a6 76% 91%, hsl(var(--muted-foreground)/0.4) 91% 100%)', borderRadius: '9999px' }}>
              <div className="absolute inset-[6px] rounded-full bg-card" />
            </div>
            <div className="flex-1 space-y-1.5">
              {costs.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-[13px]">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="ml-auto font-semibold tabular-nums">{c.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t text-[12px] font-medium text-red-600">
            102 € dépensés pour 100 € vendus → tu perds 2 € à chaque vente.
          </div>
        </div>
      </div>
    </div>
  );
}

function toneCls(t: 'good' | 'bad' | 'warn') {
  return t === 'good' ? 'text-emerald-600' : t === 'bad' ? 'text-red-600' : 'text-amber-600';
}
function dotCls(t: 'good' | 'bad' | 'warn') {
  return t === 'good' ? 'bg-emerald-500' : t === 'bad' ? 'bg-red-500' : 'bg-amber-500';
}

function TeaserKpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: 'bad' | 'warn' | 'good' }) {
  return (
    <div className="rounded-xl border bg-card p-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold truncate">{label}</div>
      <div className={`text-lg font-bold mt-0.5 tabular-nums ${toneCls(tone)}`}>{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{sub}</div>}
    </div>
  );
}

function RitualRow({ icon: Icon, t, d }: { icon: LucideIcon; t: string; d: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border bg-card p-5">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-accent/15 text-primary flex items-center justify-center"><Icon className="w-5 h-5" /></div>
      <div>
        <h3 className="font-semibold">{t}</h3>
        <p className="text-muted-foreground text-sm mt-1">{d}</p>
      </div>
    </div>
  );
}

function CascadeRow({ label, val, pct, tone, note }: { label: string; val: string; pct: number; tone: 'good' | 'warn' | 'bad'; note?: string }) {
  const bar = tone === 'good' ? 'bg-emerald-500' : tone === 'warn' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-bold tabular-nums ${toneCls(tone)}`}>{val}</span>
      </div>
      <div className="h-2 rounded-full bg-muted mt-1 overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
      {note && <div className="text-[10px] text-muted-foreground mt-0.5">{note}</div>}
    </div>
  );
}

function Reason({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1" />
      <span>{children}</span>
    </li>
  );
}

function Decision({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="w-5 h-5 shrink-0 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center">{n}</span>
      <span>{children}</span>
    </li>
  );
}

function BeforeAfter({ title, tone, rows }: { title: string; tone: 'bad' | 'good'; rows: [string, string][] }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === 'good' ? 'bg-emerald-50/60 border-emerald-200' : 'bg-card'}`}>
      <div className={`text-sm font-semibold ${tone === 'good' ? 'text-emerald-700' : 'text-muted-foreground'}`}>{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className={`font-bold tabular-nums ${tone === 'good' ? 'text-emerald-700' : ''}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Photo Fabio (bucket public Supabase) — repli sur initiales si l'image ne charge pas.
const FABIO_PHOTO = 'https://emsixhbnlvnhpfleecln.supabase.co/storage/v1/object/public/advisors/fabiophoto.jpeg';
function Avatar() {
  const [err, setErr] = useState(false);
  if (err) {
    return <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">FV</div>;
  }
  return <img src={FABIO_PHOTO} alt="Fabio Vieira" loading="lazy" onError={() => setErr(true)} className="w-24 h-24 rounded-full object-cover border" />;
}
