// Landing E-COMMERCE v2 — orientée CONVERSION CLASSIQUE / attention faible.
// Distincte de /ecommerce : simple, émotionnelle, gros CTA, zéro jargon technique.
// Même funnel (call-first cal.com), même offre (1er dashboard offert). Ton direct, tutoiement.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Check, ShieldCheck, Percent, Megaphone, Wallet, Clock, Lock,
} from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { BookingModal } from '@/components/booking/BookingModal';
import { trackLead, trackViewContent } from '@/lib/tracking';
import { initCalTracking } from '@/lib/cal';

const CTA = 'Recevoir mon dashboard gratuit';

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
  { n: 3, t: 'Tu reçois ton dashboard', d: 'Livré sous 2 jours + 1h avec un expert pour tout t’expliquer.' },
];

const FAQ = [
  { q: 'Ça coûte combien ?', a: 'Ton premier dashboard est offert. Ensuite, 700 $/mois si tu veux continuer — sans engagement.' },
  { q: 'Ça me prend combien de temps ?', a: '1h par mois, la revue avec ton expert. On gère tout le reste.' },
  { q: 'Mes chiffres sont un bordel, c’est grave ?', a: 'Non. C’est le cas de 90 % des shops qu’on reprend.' },
  { q: 'Je dois changer d’outils ?', a: 'Non. On s’adapte à ce que tu utilises déjà.' },
  { q: 'C’est pour moi ?', a: 'Si tu fais au moins 1 000 $/jour de CA et que tu fais de la pub, oui.' },
];

export default function LandingEcommerce2() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  const openLead = (source: string) => { trackLead(source); setBooking(true); };

  useEffect(() => { initCalTracking(); }, []);
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <img src={daftimeLogo} alt="Daftime Advisory" className="h-8 w-auto" />
          <button onClick={() => navigate('/auth')} className="text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors">
            Accéder à mon espace
          </button>
        </div>
      </header>

      {/* HERO — navy, gros, émotionnel */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-lg mx-auto px-5 pt-10 pb-12 flex flex-col items-center text-center min-h-[calc(100dvh-3.5rem)] justify-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Marques e-commerce</span>
          <h1 className="mt-4 text-[2.5rem] leading-[1.05] font-extrabold tracking-tight">
            Ton shop fait du CA.<br />
            Mais <span className="text-accent">toi</span>, tu gagnes combien&nbsp;?
          </h1>
          <p className="mt-5 text-lg text-primary-foreground/80 leading-relaxed">
            On regarde tes vrais chiffres et on te dit, en clair&nbsp;: où tu gagnes, où tu perds, et quoi changer.
          </p>
          <Button onClick={() => openLead('hero')} variant="secondary" className="mt-7 w-full h-14 text-lg font-bold">
            {CTA}
          </Button>
          <p className="mt-3 text-sm text-primary-foreground/70">Gratuit · 20 min · zéro pitch de vente</p>
          <p className="mt-8 text-xs text-primary-foreground/60 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" /> +40 shops accompagnés · 50 M€ de CA suivi
          </p>
        </div>
      </section>

      {/* PROBLÈME — agiter */}
      <section className="px-5 py-14">
        <div className="max-w-lg mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Ça te parle ?</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Le CA, tout le monde le voit. Le reste, personne.</h2>
          <div className="mt-7 space-y-3">
            {PAINS.map((p) => (
              <div key={p} className="rounded-2xl border bg-card p-4 text-[15px] font-medium">{p}</div>
            ))}
          </div>
        </div>
      </section>

      {/* LE VERDICT — 1 visuel simple et choc */}
      <section className="px-5 pb-4">
        <div className="max-w-md mx-auto rounded-3xl bg-primary text-primary-foreground p-7 text-center shadow-xl">
          <div className="text-xs uppercase tracking-widest text-primary-foreground/60">Ton bilan · juin</div>
          <div className="mt-4 flex items-center justify-between text-sm text-primary-foreground/80">
            <span>Chiffre d’affaires</span><span className="font-bold tabular-nums">136 840 € <span className="text-emerald-400">+12 %</span></span>
          </div>
          <div className="mt-5 pt-5 border-t border-white/10">
            <div className="text-sm text-primary-foreground/70">Ce qu’il te reste vraiment</div>
            <div className="mt-1 text-5xl font-extrabold text-red-400 tabular-nums">−2 700 €</div>
            <div className="mt-3 text-[15px] font-semibold text-accent">→ Tu perds de l’argent en scalant. Et tu le savais pas.</div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Exemple sur données anonymisées.</p>
      </section>

      {/* SOLUTION — bénéfices simples */}
      <section className="px-5 py-14">
        <div className="max-w-lg mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">Nous, on te sort le vrai chiffre.</h2>
            <p className="mt-3 text-muted-foreground">Pas 40 métriques. Ce qui compte, en clair.</p>
          </div>
          <div className="mt-8 space-y-4">
            {BENEFITS.map((b) => (
              <div key={b.t} className="flex gap-4 rounded-2xl border bg-card p-5">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-accent/15 text-primary flex items-center justify-center"><b.icon className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">{b.t}</h3>
                  <p className="text-muted-foreground text-[15px] mt-1">{b.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-secondary/50 border-y px-5 py-14">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-center">Simple comme bonjour.</h2>
          <div className="mt-8 space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 items-center rounded-2xl bg-card border p-5">
                <div className="w-11 h-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">{s.n}</div>
                <div>
                  <h3 className="font-bold">{s.t}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm font-bold text-primary flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" /> Ton dashboard livré sous 2 jours.
          </p>
        </div>
      </section>

      {/* OFFRE + RISK REVERSAL */}
      <section className="px-5 py-14">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Ton premier dashboard, offert.</h2>
          <p className="mt-3 text-lg text-muted-foreground">Normalement <b className="text-foreground">700 $/mois</b>. Le premier est <b className="text-foreground">gratuit</b>.</p>
          <ul className="mt-6 inline-flex flex-col gap-2.5 text-left">
            {['Ton dashboard financier sur-mesure', '1h de revue avec un expert e-commerce', 'Tu le gardes, quoi qu’il arrive'].map((x) => (
              <li key={x} className="flex items-center gap-3 text-[15px]"><Check className="w-5 h-5 text-emerald-600 shrink-0" /> {x}</li>
            ))}
          </ul>
          <Button onClick={() => openLead('offer')} className="mt-8 w-full h-14 text-lg font-bold">{CTA}</Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Tu continues à 700 $/mois <b className="text-foreground">seulement si ça t’aide</b>. Sinon, tu ne dois rien.
          </p>
        </div>
      </section>

      {/* FONDATEUR — l'humain */}
      <section className="bg-secondary/50 border-y px-5 py-12">
        <div className="max-w-md mx-auto flex flex-col items-center text-center">
          <Avatar />
          <div className="mt-4 font-bold text-lg">Fabio Vieira</div>
          <div className="text-xs text-muted-foreground">Founder · Daftime Advisory</div>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-sm">
            C’est un humain qui connaît l’e-commerce — moi ou un de nos analystes — qui regarde tes chiffres et te les explique. Jamais un algo.
          </p>
          <p className="mt-4 font-semibold">« Un founder, sa place c’est sur son produit. Pas dans un tableur. »</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-14">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-center mb-8">Les questions qu’on te pose tout le temps.</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border bg-card p-5">
                <summary className="flex items-center justify-between gap-3 cursor-pointer font-bold list-none">
                  {f.q}
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="text-muted-foreground text-[15px] mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-primary text-primary-foreground px-5 py-16">
        <div className="max-w-md mx-auto flex flex-col items-center text-center gap-4">
          <ShieldCheck className="w-9 h-9 text-accent" />
          <h2 className="text-3xl font-extrabold tracking-tight">Arrête de piloter à l’aveugle.</h2>
          <p className="text-primary-foreground/80">On te livre ton vrai bilan, gratuitement. Tu verras enfin où va ton argent.</p>
          <Button onClick={() => openLead('cta_final')} variant="secondary" className="w-full h-14 text-lg font-bold">{CTA}</Button>
          <p className="text-sm text-primary-foreground/70 flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Sans engagement · RGPD</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary text-primary-foreground/60 border-t border-white/10 pb-20 sm:pb-8">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-4 text-center">
          <img src={daftimeLogoWhite} alt="Daftime" className="h-7 w-auto" />
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <button onClick={() => navigate('/mentions-legales')} className="hover:text-primary-foreground transition-colors">Mentions légales</button>
            <button onClick={() => navigate('/confidentialite')} className="hover:text-primary-foreground transition-colors">Politique de confidentialité</button>
            <a href="mailto:fabio@daftime.ae" className="hover:text-primary-foreground transition-colors">Contact</a>
          </nav>
          <p className="text-xs">© 2026 Daftime Advisory - FZCO · Dubai. Tous droits réservés.</p>
        </div>
      </footer>

      {/* STICKY CTA MOBILE */}
      <div className={`sm:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-primary/95 backdrop-blur border-t border-white/10 transition-transform duration-300 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <Button onClick={() => openLead('sticky')} variant="secondary" className="w-full h-12 text-base font-bold">{CTA}</Button>
      </div>

      <BookingModal open={booking} onClose={() => setBooking(false)} />
    </div>
  );
}

// Photo Fabio (bucket public Supabase) — repli sur initiales.
const FABIO_PHOTO = 'https://emsixhbnlvnhpfleecln.supabase.co/storage/v1/object/public/advisors/fabiophoto.jpeg';
function Avatar() {
  const [err, setErr] = useState(false);
  if (err) return <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">FV</div>;
  return <img src={FABIO_PHOTO} alt="Fabio Vieira" loading="lazy" onError={() => setErr(true)} className="w-24 h-24 rounded-full object-cover border" />;
}
