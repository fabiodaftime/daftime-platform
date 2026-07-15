// Landing E-COMMERCE (Meta Ads → 100 % mobile). Conçue MOBILE-FIRST (375px d'abord).
// Offre : premier dashboard financier OFFERT (formulaire lead), pas de call de vente.
// Sans témoignage → la DÉMONSTRATION du produit est la preuve. Ton direct, tutoiement.
import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  X, ArrowRight, Check, Loader2, ShieldCheck, Lock,
} from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { supabase } from '@/integrations/supabase/client';
import { trackLead, trackViewContent } from '@/lib/tracking';

const CTA = 'Recevoir mon dashboard gratuit';

const REVENUE_OPTIONS = [
  { value: '<30k', label: 'Moins de 30k€ / mois' },
  { value: '30-100k', label: '30k€ – 100k€ / mois' },
  { value: '100-300k', label: '100k€ – 300k€ / mois' },
  { value: '300k+', label: 'Plus de 300k€ / mois' },
];

const STEPS = [
  { n: 1, t: 'Tu nous donnes tes accès', d: 'Shopify, Stripe, Meta Ads, relevés bancaires. C’est tout ce qu’on te demande.' },
  { n: 2, t: 'On fiabilise et on réconcilie', d: 'On normalise tout. Zéro double-comptage. Des chiffres justes.' },
  { n: 3, t: 'Tu reçois ton dashboard + un call d’1h', d: 'On te présente ta vraie situation. Où tu gagnes, où tu perds, quoi faire le mois prochain.' },
];

const FAQ = [
  { q: 'Ça me prend combien de temps chaque mois ?', a: '30 min. Tu nous envoies tes exports, on fait le reste.' },
  { q: 'Mes chiffres sont un bordel total, c’est grave ?', a: 'Non. C’est le cas de 90 % des shops qu’on reprend.' },
  { q: 'Je dois changer d’outils ?', a: 'Non. On s’adapte à ce que tu utilises déjà.' },
  { q: 'Et si je veux arrêter ?', a: 'Sans engagement. Tu résilies quand tu veux, tu gardes tes dashboards.' },
  { q: 'Mes données sont en sécurité ?', a: 'Oui. Espace sécurisé, accès restreint, conformité RGPD. Tes fichiers ne servent qu’à produire tes rapports.' },
  { q: 'Vous êtes qui exactement ?', a: 'Un cabinet comptable spécialisé e-commerce. La personne qui regarde tes chiffres, c’est Fabio (section plus haut).' },
];

export default function LandingEcommerce() {
  const navigate = useNavigate();
  const [lead, setLead] = useState<{ open: boolean; source: string }>({ open: false, source: '' });
  const [showSticky, setShowSticky] = useState(false);

  const openLead = (source: string) => setLead({ open: true, source });

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
          <button onClick={() => navigate('/auth')} className="text-sm text-muted-foreground hover:text-foreground">
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
            On réconcilie Shopify, Stripe, Meta Ads, ta banque et ta compta. Chaque mois, un expert te dit où tu gagnes, où tu perds, et quoi faire.
          </p>

          <Button onClick={() => openLead('hero')} className="mt-6 w-full h-12 text-base font-semibold">
            {CTA}
          </Button>
          <p className="mt-2.5 text-xs text-muted-foreground text-center">
            Pensé pour les shops qui passent 30k€/mois. En dessous, un tableur suffit.
          </p>

          {/* Teaser 3 KPI — voir le produit avant de scroller */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            <TeaserKpi label="Marge nette" value="−2 %" tone="bad" />
            <TeaserKpi label="ROAS" value="1,98" tone="bad" />
            <TeaserKpi label="Trésorerie" value="−9 400 €" tone="warn" />
          </div>
        </div>
      </section>

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
            <div className="text-xs font-semibold uppercase tracking-wide text-red-600">Marge nette : −2 %</div>
            <ul className="mt-3 space-y-2.5 text-[15px] leading-snug">
              <Reason>Tu perds <b>2 700 €</b> ce mois-ci. Alors que ton CA monte de <b>+12 %</b>.</Reason>
              <Reason>La cause : <b>51 %</b> de ton CA part en pub, pour un ROAS de <b>1,98</b>.</Reason>
              <Reason>À ce niveau de marge brute, il te faut un ROAS de <b>2,8 minimum</b>.</Reason>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Personne n’achète un graphique. Ce que tu achètes, c’est que quelqu’un lise tes chiffres à ta place.
            </p>
          </div>

          {/* AVANT / APRÈS sur 3 mois */}
          <div className="mt-8 max-w-2xl mx-auto">
            <h3 className="text-center text-lg font-semibold">Le même shop, 3 mois plus tard.</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <BeforeAfter title="Avril" tone="bad" rows={[['Marge', '−2 %'], ['ROAS', '1,98'], ['Trésorerie', '28 670 €']]} />
              <BeforeAfter title="Juillet" tone="good" rows={[['Marge', '+7 %'], ['ROAS', '3,1'], ['Trésorerie', '61 200 €']]} />
            </div>
            <div className="mt-4 rounded-2xl border bg-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Les 3 décisions prises</div>
              <ul className="space-y-2.5 text-sm">
                <Decision n={1}>Coupé 2 campagnes à ROAS &lt; 1,5 <span className="text-muted-foreground">(−8 400 €/mois de pub)</span></Decision>
                <Decision n={2}>Renégocié le COGS fournisseur <span className="text-muted-foreground">(−4 pts)</span></Decision>
                <Decision n={3}>Relevé le panier moyen via bundle <span className="text-muted-foreground">(+11 €)</span></Decision>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── ORIGIN STORY (manifeste) ── */}
      <section className="px-4 py-14">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xl sm:text-2xl font-medium leading-relaxed tracking-tight">
            On est le cabinet comptable de <b>+40 e-commerçants</b>. On voit passer <b>35 M€ de CA</b> par an.
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
          <p className="mt-2 text-muted-foreground text-[15px] leading-relaxed max-w-md">
            Cabinet comptable, +40 e-commerçants accompagnés. DSCG, basé entre Dubaï et le Portugal.
            Je bricole pas des tableurs&nbsp;: je lis des shops toute la journée.
          </p>
          <p className="mt-4 font-medium">« C’est moi qui regarde tes chiffres. »</p>
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
          <p className="mt-6 text-center text-sm font-semibold text-primary">Premier dashboard livré sous 7 jours.</p>
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
          <ul className="mt-5 inline-flex flex-col gap-2 text-left text-sm">
            {['Dashboard sur-mesure', 'Analyse & reco chaque mois', 'Toutes tes sources réconciliées', 'Sans engagement'].map((x) => (
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

      <LeadModal open={lead.open} source={lead.source} onClose={() => setLead({ open: false, source: '' })} />
    </div>
  );
}

// ───────────────────────── Formulaire lead (modale) ─────────────────────────
function LeadModal({ open, source, onClose }: { open: boolean; source: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [shop, setShop] = useState('');
  const [rev, setRev] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('sending');
    const { error } = await supabase.from('ecommerce_leads' as any).insert({
      email: email.trim(),
      shop_url: shop.trim() || null,
      monthly_revenue: rev || null,
      source,
    });
    if (error) { setState('error'); return; }
    trackLead(source);
    setState('done');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60" onClick={onClose}>
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 w-9 h-9 rounded-full border flex items-center justify-center hover:bg-muted">
          <X className="w-4 h-4" />
        </button>

        {state === 'done' ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4"><Check className="w-7 h-7" /></div>
            <h3 className="text-xl font-semibold">Bien reçu 🎉</h3>
            <p className="mt-2 text-muted-foreground text-sm">On te livre ton dashboard sous 7 jours. Check tes mails, on revient vers toi pour tes accès.</p>
            <Button onClick={onClose} className="mt-5 w-full h-11">Fermer</Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 className="text-xl font-semibold pr-8">Reçois ton dashboard gratuit</h3>
            <p className="mt-1 text-sm text-muted-foreground">3 infos, et on s’occupe du reste.</p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@ton-shop.com"
                  className="mt-1 w-full h-11 rounded-lg border bg-background px-3 text-[15px] outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">URL de ton shop</label>
                <input type="text" value={shop} onChange={(e) => setShop(e.target.value)} placeholder="ton-shop.com"
                  className="mt-1 w-full h-11 rounded-lg border bg-background px-3 text-[15px] outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">CA mensuel approx.</label>
                <select value={rev} onChange={(e) => setRev(e.target.value)}
                  className="mt-1 w-full h-11 rounded-lg border bg-background px-3 text-[15px] outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">— Choisis —</option>
                  {REVENUE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {state === 'error' && <p className="mt-3 text-sm text-destructive">Oups, une erreur. Réessaie dans un instant.</p>}

            <Button type="submit" disabled={state === 'sending' || !email.trim()} className="mt-5 w-full h-12 text-base font-semibold">
              {state === 'sending' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi…</> : CTA}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground text-center">Livré sous 7 jours. Tu le gardes, même si tu ne prends rien.</p>
          </form>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Dashboard démo (mobile-first) ─────────────────────────
function DashboardDemo() {
  const kpis = [
    { l: 'CA du mois', v: '136 840 €', verdict: '+12 % vs M-1', tone: 'good' as const },
    { l: 'Marge nette', v: '−2 %', verdict: 'vs +4 % le mois dernier', tone: 'bad' as const },
    { l: 'ROAS', v: '1,98', verdict: 'trop faible vs tes coûts', tone: 'bad' as const },
    { l: 'Conversion', v: '3,06 %', verdict: 'sain', tone: 'good' as const },
    { l: 'Panier moyen', v: '72,79 €', verdict: 'à surveiller', tone: 'warn' as const },
    { l: 'Trésorerie nette', v: '−9 330 €', verdict: 'cash + créances − dettes', tone: 'warn' as const },
  ];
  const costs = [
    { label: 'Publicité', val: '51 %', color: 'hsl(var(--primary))' },
    { label: 'Achats (COGS)', val: '27 %', color: 'hsl(var(--accent))' },
    { label: 'Logistique', val: '13 %', color: '#14b8a6' },
    { label: 'PSP & autres', val: '9 %', color: 'hsl(var(--muted-foreground)/0.4)' },
  ];
  return (
    <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
      {/* En-tête */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-60">E-commerce · Avril 2026</div>
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
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Coûts · % du CA</div>
          <div className="flex items-center gap-4">
            {/* Donut : desktop seulement (illisible en petit) */}
            <div className="relative w-16 h-16 shrink-0 hidden sm:block" style={{ background: 'conic-gradient(hsl(var(--primary)) 0 51%, hsl(var(--accent)) 51% 78%, #14b8a6 78% 91%, hsl(var(--muted-foreground)/0.4) 91% 100%)', borderRadius: '9999px' }}>
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

function TeaserKpi({ label, value, tone }: { label: string; value: string; tone: 'bad' | 'warn' | 'good' }) {
  return (
    <div className="rounded-xl border bg-card p-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold truncate">{label}</div>
      <div className={`text-lg font-bold mt-0.5 tabular-nums ${toneCls(tone)}`}>{value}</div>
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

// Photo Fabio — placeholder /fabio.jpg, repli sur initiales si absente.
function Avatar() {
  const [err, setErr] = useState(false);
  if (err) {
    return <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">FV</div>;
  }
  return <img src="/fabio.jpg" alt="Fabio Vieira" onError={() => setErr(true)} className="w-24 h-24 rounded-full object-cover border" />;
}
