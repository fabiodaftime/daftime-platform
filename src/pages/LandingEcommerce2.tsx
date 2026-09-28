// Landing E-COMMERCE v2 — orientée CONVERSION CLASSIQUE / attention faible.
// Distincte de /ecommerce : simple, émotionnelle, gros CTA, zéro jargon technique.
// Même funnel (call-first cal.com), même offre (1er dashboard offert). Ton direct, tutoiement.
// Habillage v2 (28/09/2026) : mêmes textes, même tracking ; ordre mobile inchangé, ordinateur en 2 colonnes
// avec l'aperçu de l'espace client ; animations en CSS pur (components/landing/lp.tsx) pour rester légère.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Check, ShieldCheck, Percent, Megaphone, Wallet, Clock, Lock,
} from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { BookingModal } from '@/components/booking/BookingModal';
import { trackLead, trackViewContent, trackFaqOpen } from '@/lib/tracking';
import { initCalTracking } from '@/lib/cal';
import { resolveBooking } from '@/lib/config';
import { ProductPreview, Reveal } from '@/components/landing/lp';

const CTA = 'Recevoir mon audit gratuit';

const PAINS = [
  '« Mon CA monte, mais mon compte en banque suit pas. »',
  '« Mes pubs tournent… mais elles me font gagner ou perdre ? Aucune idée. »',
  '« Ma vraie marge, une fois tout payé ? Je saurais pas te dire. »',
  '« Mes chiffres sont éclatés entre Shopify, Stripe, la pub, la banque… »',
];

const BENEFITS = [
  { icon: Percent, t: 'Ta vraie marge', d: 'Après pub, frais de paiement, livraison. Ce qu’il te reste vraiment dans la poche.' },
  { icon: Megaphone, t: 'Tes pubs, rentables ou pas', d: 'On relie ton ROAS à ta marge réelle. On te dit si tu gagnes… ou si tu brûles du cash.' },
  { icon: Wallet, t: 'Ton cash', d: 'Combien tu as, combien tu vas avoir, et quand ça va serrer. Fini les surprises.' },
];

const STEPS = [
  { n: 1, t: 'Tu réserves ton call', d: '20 min pour faire le point sur ton shop.' },
  { n: 2, t: 'On branche tes outils', d: 'Shopify, Stripe, Meta Ads, banque. On te guide, 5 min.' },
  { n: 3, t: 'Tu reçois ton audit', d: 'Livré sous 2 jours + 1h avec un expert pour tout t’expliquer.' },
];

const FAQ = [
  { q: 'Ça coûte combien ?', a: 'Ton audit financier est offert. Ensuite, à partir de 700 $/mois si tu veux un suivi continu (ton directeur financier externalisé) — sans engagement.' },
  { q: 'C’est offert, c’est quoi le piège ?', a: 'Aucun. On t’offre l’audit pour te prouver la valeur — tu repars avec, quoi qu’il arrive. Tu continues seulement si ça t’apporte quelque chose.' },
  { q: 'Je sais sortir le même dashboard avec l’IA. Pourquoi payer ?', a: [
    'Et tu as raison — la visualisation, c’est la couche facile.',
    'Le vrai enjeu est en dessous : réconcilier tes différentes sources, mapper ta structure comme il faut et sortir une data consolidée correcte et propre. Une réconciliation approximative ou un mauvais mapping, et l’IA te sort une visualisation impeccable… basée sur du faux.',
    'Ce que tu paies, c’est un expert qui structure ta data pour qu’elle soit cohérente, puis l’analyse, la comprend et te l’explique — en te recommandant ce qui compte vraiment de suivre.',
    'Il situe ta marge, ton ROAS et ton AOV face à ton secteur, et te propose les bons leviers : si c’est l’emailing, TikTok Shop ou Google Ads, il t’oriente vers le spécialiste adéquat.',
    'Bref : de l’expertise, du temps, de l’interprétation, du conseil et de l’aide au pilotage. Le travail d’un directeur financier — pour le prix de moins d’une journée du sien, par mois.',
  ] },
  { q: 'Ça me prend combien de temps ?', a: '1 à 2h par mois en call avec ton expert, plus des points ponctuels si besoin de clarifier ou d’un coup de main. On gère tout le reste.' },
  { q: 'Mes chiffres sont un bordel, c’est grave ?', a: 'Non. C’est le cas de 90 % des shops qu’on reprend.' },
  { q: 'Je dois changer d’outils ?', a: 'Non. On s’adapte à ce que tu utilises déjà.' },
  { q: 'C’est pour moi ?', a: 'Si tu fais au moins 1 000 $/jour de CA et que tu fais de la pub, oui.' },
];

// Aperçu du livrable (preuve de valeur). On montre l'ANALYSE d'un expert (verdict + recos chiffrées), pas de la data brute.
const DOT: Record<string, string> = { red: 'bg-[hsl(var(--bad))]', amber: 'bg-[hsl(var(--warn))]', emerald: 'bg-[hsl(var(--good))]' };
const VERDICT = 'Résultat : −2 700 €/mois. Et ce n’est pas ton CA le problème — chaque vente supplémentaire te coûte plus qu’elle ne te rapporte.';
const AUDIT_ACTIONS = [
  { c: 'red', t: 'Ton point mort pub, c’est un ROAS de 2,4. Deux campagnes Meta tournent à 1,8 depuis 3 semaines : elles achètent du CA à perte.', g: 'Coupe-les, bascule le budget sur ton retargeting (ROAS 4,1) → ≈ +1 800 €/mois' },
  { c: 'amber', t: 'Ta gamme lin dégage 3× la marge du coton, mais capte à peine 20 % de ton budget pub. Tu pousses tes produits les moins rentables.', g: 'Rééquilibre le mix → +5 pts de marge, à CA constant' },
  { c: 'emerald', t: 'Tu encaisses à J+3 mais paies tes fournisseurs comptant : chaque grosse commande te met dans le rouge avant de rapporter.', g: 'Négocie 30 j fournisseur → 3 semaines de trésorerie regagnées' },
];

// CTA jaune (= l'action) sur fond bleu nuit ; bleu nuit sur fond clair.
const CTA_ON_DARK = 'h-14 text-lg font-semibold rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))] hover:brightness-105 shadow-[0_10px_30px_-10px_hsl(59_97%_43%/0.6)] group';
const CTA_ON_LIGHT = 'h-14 text-lg font-semibold rounded-xl group';
const H2 = 'text-3xl lg:text-[2.6rem] font-semibold tracking-[-0.02em] leading-[1.1] text-balance';

export default function LandingEcommerce2({ advisor }: { advisor?: string } = {}) {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  const openLead = (source: string) => { trackLead(advisor ? `${source}_${advisor}` : source); setBooking(true); };

  useEffect(() => { initCalTracking(resolveBooking(advisor).url); }, [advisor]);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setShowSticky(y > window.innerHeight * 0.6);
      if (h > 0 && y / h >= 0.5) trackViewContent({ page: 'ecommerce-2' });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const arrow = <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-0.5" />;

  return (
    <div className="v2 min-h-screen">
      {/* HEADER — ordinateur seulement : sur mobile (trafic pub), pas de bandeau, le logo est dans le haut de page */}
      <header className="hidden md:block glass sticky top-0 z-30 border-b">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <img src={daftimeLogo} alt="Daftime Advisory" className="h-7 w-auto" />
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('/auth')} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Accéder à mon espace
            </button>
            <Button onClick={() => openLead('header')} className="hidden md:inline-flex h-10 rounded-lg px-4">{CTA}</Button>
          </div>
        </div>
      </header>

      {/* HERO — bleu nuit ; sur ordinateur, l'espace client à droite */}
      <section className="brand-panel !rounded-none !shadow-none">
        <img src={daftimeLogo} alt="Daftime Advisory" className="md:hidden absolute z-[1] top-6 left-1/2 -translate-x-1/2 h-6 w-auto brightness-0 invert" />
        <div className="relative z-[1] max-w-6xl mx-auto px-5 pt-16 md:pt-10 pb-12 lg:py-20 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center min-h-[100dvh] md:min-h-[calc(100dvh-4rem)] lg:min-h-0">
          <div className="max-w-lg mx-auto lg:mx-0 flex flex-col items-center text-center lg:items-start lg:text-left">
            <span className="eyebrow !text-[hsl(var(--accent))] !text-[11px]">Marques e-commerce</span>
            <h1 className="mt-4 text-[2.1rem] sm:text-[2.7rem] lg:text-[3.4rem] leading-[1.04] font-semibold tracking-[-0.03em] text-balance">
              Ton shop fait du CA.<br />
              Mais <span className="text-[hsl(var(--accent))]">toi</span>, tu gagnes combien&nbsp;?
            </h1>
            <p className="mt-5 text-lg text-white/75 leading-relaxed">
              Ton directeur financier externalisé, spécialisé e-commerce&nbsp;: on regarde tes vrais chiffres et on te dit, en clair, où tu gagnes, où tu perds, et quoi changer.
            </p>
            <Button onClick={() => openLead('hero')} className={`mt-8 w-full sm:w-auto sm:px-8 ${CTA_ON_DARK}`}>{CTA}{arrow}</Button>
            <p className="mt-3 text-sm text-white/65">Gratuit · 20 min · zéro pitch de vente</p>
            <p className="mt-8 text-xs text-white/55 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]" /> +40 shops accompagnés · 50 M€ de CA suivi
            </p>
          </div>
          <div className="hidden lg:block">
            <ProductPreview className="max-w-[460px] ml-auto" />
            <p className="mt-4 max-w-[460px] ml-auto text-center text-xs text-white/45">Exemple sur données anonymisées.</p>
          </div>
        </div>
      </section>

      {/* PROBLÈME — agiter */}
      <section className="px-5 py-16 lg:py-24">
        <div className="max-w-lg lg:max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-16 items-start">
          <Reveal>
            <span className="eyebrow !text-primary">Ça te parle ?</span>
            <h2 className={`mt-2 ${H2}`}>Le CA, tout le monde le voit. Le reste, personne.</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-3">
            {PAINS.map((p, i) => (
              <Reveal key={p} delay={i * 80} className="surface p-5 text-[15px] font-medium leading-snug">{p}</Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LE VERDICT — sur mobile : l'espace client (sur ordinateur, il est déjà dans le haut de page) */}
      <section className="lg:hidden px-5 pb-6">
        <div className="max-w-md mx-auto">
          <ProductPreview />
          <p className="mt-4 text-center text-xs text-muted-foreground">Exemple sur données anonymisées.</p>
        </div>
      </section>

      {/* SOLUTION — bénéfices simples */}
      <section className="px-5 py-16 lg:py-20">
        <div className="max-w-lg lg:max-w-6xl mx-auto">
          <Reveal className="text-center">
            <h2 className={H2}>Nous, on te sort le vrai chiffre.</h2>
            <p className="mt-3 text-muted-foreground text-lg">Pas 40 métriques. Ce qui compte, en clair.</p>
          </Reveal>
          <div className="mt-10 grid lg:grid-cols-3 gap-4">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.t} delay={i * 90} className="surface surface-hover p-6 flex lg:flex-col gap-4 items-start">
                <span className="w-11 h-11 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0"><b.icon className="w-5 h-5" strokeWidth={2.2} /></span>
                <div>
                  <h3 className="font-semibold text-lg">{b.t}</h3>
                  <p className="text-muted-foreground text-[15px] mt-1 leading-relaxed">{b.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CE QUE TU REÇOIS — l'analyse d'un expert (preuve de valeur) */}
      <section className="px-5 pb-16 lg:py-20">
        <div className="max-w-lg lg:max-w-6xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-center">
          <Reveal className="text-center lg:text-left">
            <span className="eyebrow !text-primary">Concret</span>
            <h2 className={`mt-2 ${H2}`}>Voilà ce que tu reçois.</h2>
            <p className="mt-4 text-muted-foreground text-lg">Pas un export de data. L’analyse d’un expert&nbsp;: ce qui cloche, et quoi faire — chiffré.</p>
            <p className="hidden lg:flex mt-6 items-center gap-2 text-sm font-medium"><Check className="w-4 h-4 text-[hsl(var(--good))]" /> Lu et expliqué en visio par un expert e-commerce. Jamais un algo.</p>
          </Reveal>

          <Reveal delay={100}>
            <div className="surface !rounded-2xl overflow-hidden shadow-[var(--shadow-lift)]">
              {/* le verdict — la phrase qu'un expert te dit */}
              <div className="brand-panel !rounded-none !shadow-none px-6 py-6">
                <div className="relative z-[1]">
                  <div className="eyebrow !text-white/55">Le verdict · exemple</div>
                  <p className="mt-2 text-[17px] lg:text-lg font-semibold leading-snug">« {VERDICT} »</p>
                </div>
              </div>
              {/* les recommandations chiffrées — la force de proposition */}
              <div className="px-6 py-6">
                <div className="eyebrow">Ce qu’on te recommande, ce mois-ci</div>
                <ol className="mt-4 space-y-5">
                  {AUDIT_ACTIONS.map((a, i) => (
                    <li key={a.t} className="flex gap-3.5">
                      <span className="relative mt-0.5 w-6 h-6 rounded-full bg-muted grid place-items-center text-[11px] font-semibold shrink-0">
                        {i + 1}<span className={`absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full ring-2 ring-card ${DOT[a.c]}`} />
                      </span>
                      <div>
                        <div className="text-[15px] leading-snug">{a.t}</div>
                        <div className="mt-1.5 text-sm font-semibold text-primary leading-snug">{a.g}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="lg:hidden border-t bg-muted/50 px-6 py-3 text-center text-[13px] font-medium text-muted-foreground">
                Lu et expliqué en visio par un expert e-commerce. Jamais un algo.
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">Exemple anonymisé. Ton analyse est faite à partir de tes vrais chiffres.</p>
          </Reveal>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-secondary/60 border-y px-5 py-16 lg:py-20">
        <div className="max-w-lg lg:max-w-5xl mx-auto">
          <Reveal><h2 className={`${H2} text-center`}>Simple comme bonjour.</h2></Reveal>
          <ol className="mt-10 ml-3 lg:ml-0 border-l-2 lg:border-l-0 border-primary/20 space-y-7 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6 relative">
            <span aria-hidden className="hidden lg:block absolute top-[14px] left-[16%] right-[16%] h-px bg-primary/20" />
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 110} className="relative pl-7 lg:pl-0 lg:text-center">
                <span className="absolute -left-[15px] -top-0.5 lg:relative lg:left-auto lg:top-auto lg:mx-auto lg:mb-4 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-sm ring-4 ring-secondary">{s.n}</span>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="text-muted-foreground text-sm mt-1">{s.d}</p>
              </Reveal>
            ))}
          </ol>
          <p className="mt-8 text-center text-sm font-semibold text-primary flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" /> Ton audit livré sous 2 jours.
          </p>
        </div>
      </section>

      {/* OFFRE + RISK REVERSAL */}
      <section className="px-5 py-16 lg:py-24">
        <Reveal className="max-w-xl mx-auto surface !rounded-2xl p-7 sm:p-10 text-center shadow-[var(--shadow-lift)]">
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-[-0.02em]">Ton audit financier, offert.</h2>
          <p className="mt-3 text-lg text-muted-foreground">Le suivi continu, c'est <b className="text-foreground">à partir de 700 $/mois</b>. L'audit est <b className="text-foreground">gratuit</b>.</p>
          <ul className="mt-6 inline-flex flex-col gap-2.5 text-left">
            {['Ton audit financier complet', '1h de revue de ton audit, en visio avec un expert', 'Tu repars avec, quoi qu’il arrive'].map((x) => (
              <li key={x} className="flex items-center gap-3 text-[15px]"><Check className="w-5 h-5 text-[hsl(var(--good))] shrink-0" /> {x}</li>
            ))}
          </ul>
          <Button onClick={() => openLead('offer')} className={`mt-8 w-full ${CTA_ON_LIGHT}`}>{CTA}{arrow}</Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Tu continues à partir de 700 $/mois <b className="text-foreground">seulement si ça t’aide</b>. Sinon, tu ne dois rien.
          </p>
        </Reveal>
      </section>

      {/* FONDATEUR — l'humain */}
      <section className="bg-secondary/60 border-y px-5 py-14 lg:py-16">
        <Reveal className="max-w-md lg:max-w-3xl mx-auto flex flex-col lg:flex-row items-center gap-5 lg:gap-10 text-center lg:text-left">
          <Avatar />
          <div>
            <div className="font-semibold text-lg">Fabio Vieira</div>
            <div className="text-xs text-muted-foreground">Founder · Daftime Advisory</div>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              C’est un humain qui connaît l’e-commerce — moi ou un de nos analystes — qui regarde tes chiffres et te les explique. Jamais un algo.
            </p>
            <p className="mt-4 font-semibold text-lg">« Un founder, sa place c’est sur son produit. Pas dans un tableur. »</p>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="px-5 py-16 lg:py-20">
        <div className="max-w-lg lg:max-w-2xl mx-auto">
          <h2 className={`${H2} text-center mb-8`}>Les questions qui reviennent.</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} onToggle={(e) => { if (e.currentTarget.open) trackFaqOpen(f.q, 'ecommerce2'); }} className="group surface p-5 open:shadow-[var(--shadow-lift)] transition-shadow">
                <summary className="flex items-center justify-between gap-3 cursor-pointer font-semibold list-none">
                  {f.q}
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                {Array.isArray(f.a)
                  ? <div className="mt-3 space-y-2.5">{f.a.map((p, i) => <p key={i} className="text-muted-foreground text-[15px] leading-relaxed">{p}</p>)}</div>
                  : <p className="text-muted-foreground text-[15px] mt-3 leading-relaxed">{f.a}</p>}
              </details>
            ))}
          </div>
          {/* CTA au pic d'intention : juste après la levée d'objections. */}
          <Button onClick={() => openLead('faq')} className={`mt-8 w-full ${CTA_ON_LIGHT}`}>{CTA}{arrow}</Button>
          <p className="mt-3 text-center text-sm text-muted-foreground">Gratuit · 20 min · zéro pitch · tu repars avec ton audit.</p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="brand-panel !rounded-none !shadow-none px-5 py-20">
        <Reveal className="relative z-[1] max-w-lg mx-auto flex flex-col items-center text-center gap-4">
          <ShieldCheck className="w-9 h-9 text-[hsl(var(--accent))]" />
          <h2 className={H2}>Arrête de piloter à l’aveugle.</h2>
          <p className="text-white/75 text-lg">On te livre ton vrai bilan, gratuitement. Tu verras enfin où va ton argent.</p>
          <Button onClick={() => openLead('cta_final')} className={`mt-2 w-full sm:w-auto sm:px-8 ${CTA_ON_DARK}`}>{CTA}{arrow}</Button>
          <p className="text-sm text-white/65 flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Sans engagement · RGPD</p>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="bg-[hsl(238_58%_12%)] text-white/55 pb-24 sm:pb-8">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <img src={daftimeLogoWhite} alt="Daftime" className="h-7 w-auto" />
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <button onClick={() => navigate('/mentions-legales')} className="hover:text-white transition-colors">Mentions légales</button>
            <button onClick={() => navigate('/confidentialite')} className="hover:text-white transition-colors">Politique de confidentialité</button>
            <a href="mailto:fabio@daftime.ae" className="hover:text-white transition-colors">Contact</a>
            <button onClick={() => navigate('/auth')} className="md:hidden hover:text-white transition-colors">Accéder à mon espace</button>
          </nav>
          <p className="text-xs">© 2026 Daftime Advisory - FZCO · Dubai. Tous droits réservés.</p>
        </div>
      </footer>

      {/* STICKY CTA MOBILE */}
      <div className={`sm:hidden fixed inset-x-0 bottom-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[hsl(238_58%_14%/0.92)] backdrop-blur-md border-t border-white/10 transition-transform duration-300 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <Button onClick={() => openLead('sticky')} className={`w-full !h-12 !text-base ${CTA_ON_DARK}`}>{CTA}</Button>
        <p className="text-center text-[11px] text-white/65 mt-1.5">Gratuit · 20 min · zéro pitch de vente</p>
      </div>

      <BookingModal open={booking} onClose={() => setBooking(false)} advisor={advisor} />
    </div>
  );
}

// Photo Fabio (bucket public Supabase) — repli sur initiales.
const FABIO_PHOTO = 'https://emsixhbnlvnhpfleecln.supabase.co/storage/v1/object/public/advisors/fabiophoto.jpeg';
function Avatar() {
  const [err, setErr] = useState(false);
  if (err) return <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold shrink-0">FV</div>;
  return <img src={FABIO_PHOTO} alt="Fabio Vieira" loading="lazy" onError={() => setErr(true)} className="w-24 h-24 rounded-full object-cover ring-4 ring-card shadow-[var(--shadow-card)] shrink-0" />;
}
