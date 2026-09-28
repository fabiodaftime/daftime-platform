// Landing page publique Daftime — première page à l'arrivée sur le site (visiteur non connecté).
// Habillage v2 (28/09/2026) : tutoiement (doctrine), carte des implantations, passerelle vers l'offre e-commerce.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Users, LineChart, ShieldCheck, CalendarCheck,
  ShoppingBag, Building2, GraduationCap, Cloud, UtensilsCrossed, Briefcase, Network, Rocket, Megaphone,
} from 'lucide-react';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import { WorldMap } from '@/components/landing/WorldMap';
import { BrandLockup } from '@/components/layout/BrandLockup';
import { BookingModal } from '@/components/booking/BookingModal';
import { ProductPreview, Reveal } from '@/components/landing/lp';

const FEATURES = [
  { icon: Users, title: "Accompagnement d'experts", desc: 'Un conseiller qui connaît ton métier, à tes côtés chaque mois.' },
  { icon: LineChart, title: 'Une vision claire', desc: 'Un rapport lisible chaque mois : ta vraie marge, ta trésorerie, les 3 points à regarder.' },
  { icon: ShieldCheck, title: 'Ton espace sécurisé', desc: 'Tes rapports et tes échanges au même endroit, accessibles en toute confiance.' },
];

const SECTORS = [
  { icon: ShoppingBag, label: 'E-commerce' },
  { icon: Building2, label: 'Immobilier' },
  { icon: GraduationCap, label: 'Formation' },
  { icon: Cloud, label: 'SaaS & Tech' },
  { icon: UtensilsCrossed, label: 'Restauration & Hôtellerie' },
  { icon: Briefcase, label: 'Conseil & Services' },
  { icon: Network, label: 'Holdings & Groupes' },
  { icon: Rocket, label: 'Startups' },
  { icon: Megaphone, label: 'Agences & Médias' },
];

const H2 = 'text-3xl lg:text-[2.5rem] font-semibold tracking-[-0.02em] leading-[1.1] text-balance';

export default function Landing() {
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <div className="v2 min-h-screen">
      {/* Barre du haut */}
      <header className="glass sticky top-0 z-30 border-b">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <BrandLockup center={false} />
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="h-10 px-3 text-sm">Accéder à mon espace</Button>
            <Button onClick={() => setBookingOpen(true)} className="hidden sm:inline-flex h-10 rounded-lg px-4">Prendre rendez-vous</Button>
          </div>
        </div>
      </header>

      {/* Hero — la promesse + la carte des implantations */}
      <section className="max-w-6xl mx-auto px-5 pt-12 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-center">
        <div className="lp-rise text-center lg:text-left">
          <span className="eyebrow !text-primary">Direction financière externalisée</span>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.04] tracking-[-0.03em] text-balance">
            Des experts et de la vision, pour{' '}
            <span className="relative whitespace-nowrap">piloter<span className="absolute left-0 -bottom-0.5 w-full h-2.5 bg-[hsl(var(--accent)/0.45)] -z-10 rounded-sm" /></span>{' '}
            ton activité.
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Un expert qui suit tes chiffres chaque mois, et un espace clair pour les lire&nbsp;: où tu gagnes, où tu perds, et quoi décider.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
            <Button onClick={() => setBookingOpen(true)} className="h-12 px-6 text-base rounded-xl">
              <CalendarCheck className="w-4 h-4 mr-2" /> Prendre rendez-vous gratuitement
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth')} className="h-12 px-6 text-base rounded-xl bg-card group">
              Accéder à mon espace <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
        <div className="lp-rise [animation-delay:.12s]">
          <WorldMap />
          <p className="mt-2 text-center eyebrow">Paris · Lisbonne · Dubaï</p>
        </div>
      </section>

      {/* Atouts */}
      <section className="bg-secondary/60 border-y">
        <div className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90} className="surface surface-hover p-6">
              <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground grid place-items-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-muted-foreground text-[15px] mt-1.5 leading-relaxed">{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Passerelle e-commerce : le produit tel que le client le voit */}
      <section className="max-w-6xl mx-auto px-5 py-16 lg:py-24">
        <div className="brand-panel px-6 py-10 sm:px-10 lg:px-14 lg:py-14 grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
          <Reveal className="relative z-[1] text-center lg:text-left">
            <span className="eyebrow !text-[hsl(var(--accent))]">Marques e-commerce</span>
            <h2 className={`mt-3 ${H2}`}>Ton shop fait du CA. Mais toi, tu gagnes combien&nbsp;?</h2>
            <p className="mt-4 text-white/75 text-lg leading-relaxed">
              Ta vraie marge après pub, ta pub face à son point mort, ta trésorerie à 13 semaines. Ton audit financier est offert.
            </p>
            <Button onClick={() => navigate('/ecommerce-2')}
              className="mt-7 h-12 px-6 text-base rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))] hover:brightness-105 group">
              Découvrir l'offre e-commerce <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Reveal>
          <div className="relative z-[1]">
            <ProductPreview className="max-w-[440px] mx-auto lg:ml-auto lg:mr-0" />
            <p className="mt-4 text-center text-xs text-white/45">Exemple sur données anonymisées.</p>
          </div>
        </div>
      </section>

      {/* Secteurs */}
      <section className="max-w-4xl mx-auto px-5 pb-20 text-center">
        <Reveal>
          <h2 className={H2}>Une expertise multi-secteurs</h2>
          <p className="text-muted-foreground mt-3 text-lg">Des indicateurs adaptés à chaque métier.</p>
        </Reveal>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {SECTORS.map((s, i) => (
            <Reveal key={s.label} delay={i * 40} className="surface !rounded-full px-4 py-2.5 flex items-center gap-2 text-sm font-medium">
              <s.icon className="w-4 h-4 text-primary" /> {s.label}
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bandeau RDV */}
      <section className="brand-panel !rounded-none !shadow-none">
        <Reveal className="relative z-[1] max-w-2xl mx-auto px-5 py-20 flex flex-col items-center text-center gap-5">
          <CalendarCheck className="w-8 h-8 text-[hsl(var(--accent))]" />
          <h2 className={H2}>Parlons de ton activité</h2>
          <p className="text-white/75 text-lg max-w-lg">
            Échange gratuitement avec un expert Daftime pour voir comment piloter ton activité plus sereinement.
          </p>
          <Button onClick={() => setBookingOpen(true)}
            className="h-12 px-6 text-base rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))] hover:brightness-105">
            <CalendarCheck className="w-4 h-4 mr-2" /> Prendre rendez-vous gratuitement
          </Button>
        </Reveal>
      </section>

      {/* Pied de page */}
      <footer className="bg-[hsl(238_58%_12%)] text-white/55">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={daftimeLogoWhite} alt="Daftime" className="h-7 w-auto" />
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <button onClick={() => navigate('/mentions-legales')} className="hover:text-white transition-colors">Mentions légales</button>
            <button onClick={() => navigate('/confidentialite')} className="hover:text-white transition-colors">Politique de confidentialité</button>
          </nav>
          <p className="text-xs">© 2026 Daftime Advisory. Tous droits réservés.</p>
        </div>
      </footer>

      {/* Modale RDV (partagée) — filet de sécurité in-app inclus. */}
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}
