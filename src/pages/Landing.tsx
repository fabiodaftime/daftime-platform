// Landing page publique Daftime — première page à l'arrivée sur le site (visiteur non connecté).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Users, LineChart, ShieldCheck, CalendarCheck, X,
  ShoppingBag, Building2, GraduationCap, Cloud, UtensilsCrossed, Briefcase, Network, Rocket,
} from 'lucide-react';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import { WorldMap } from '@/components/landing/WorldMap';

// Calendrier Cal.com (relié au Google Calendar), thémé Daftime via les réglages Cal.com.
const SCHEDULE_URL = 'https://cal.com/fabio-vieira-daftime-advisory/rendez-vous-decouverte-daftime-advisory-30min?embed=true&theme=light';

const FEATURES = [
  { icon: Users, title: "Accompagnement d'experts", desc: 'Des professionnels du conseil financier à vos côtés au quotidien.' },
  { icon: LineChart, title: 'Une vision claire', desc: 'Des dashboards lisibles qui transforment vos chiffres en décisions.' },
  { icon: ShieldCheck, title: 'Espace sécurisé', desc: 'Déposez vos documents et consultez vos rapports en toute confiance.' },
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
];

export default function Landing() {
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Barre de navigation */}
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-center">
          <div className="flex flex-col items-center leading-none">
            <img src={daftimeLogo} alt="Daftime Advisory" className="h-[22px] w-auto" />
            {/* trait central : distances égales (logo détouré, sans fond blanc) */}
            <div className="h-px w-10 bg-primary/40 my-1.5" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold leading-none">Advisory</span>
          </div>
        </div>
      </header>

      {/* Hero — la carte en premier */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          <WorldMap />
        </div>

        <h1 className="mt-10 text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-tight">
          Des experts et de la vision,<br />pour{' '}
          <span className="relative whitespace-nowrap">
            piloter
            <span className="absolute left-0 -bottom-1 w-full h-2 bg-accent/40 -z-10" />
          </span>{' '}votre activité
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
          Daftime Advisory réunit l'accompagnement de professionnels du conseil et des dashboards clairs, pour transformer vos chiffres en décisions.
        </p>
        <div className="flex flex-wrap gap-3 mt-8 justify-center">
          <Button onClick={() => setBookingOpen(true)} className="h-12 px-6 text-base">
            <CalendarCheck className="w-4 h-4 mr-2" /> Prendre rendez-vous gratuitement
          </Button>
          <Button variant="outline" onClick={() => navigate('/auth')} className="h-12 px-6 text-base">
            Accéder à mon espace <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </section>

      {/* Atouts */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl bg-card border p-6 transition hover:shadow-md hover:border-primary/30">
              <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-muted-foreground text-sm mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Secteurs d'expertise */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Une expertise multi-secteurs</h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Nous accompagnons des entreprises de profils variés, avec des indicateurs adaptés à chaque métier.
        </p>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {SECTORS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border bg-card p-5 flex flex-col items-center gap-3 transition hover:shadow-md hover:border-primary/30"
            >
              <div className="w-11 h-11 rounded-xl bg-accent/15 text-primary flex items-center justify-center">
                <s.icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bandeau CTA */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="max-w-6xl mx-auto px-6 py-16 relative flex flex-col items-center text-center gap-6">
          <CalendarCheck className="w-8 h-8 text-accent" />
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Discutons de votre accompagnement</h2>
          <p className="text-primary-foreground/70 max-w-lg">
            Échangez gratuitement avec un expert Daftime pour découvrir comment piloter votre activité plus sereinement.
          </p>
          <Button onClick={() => setBookingOpen(true)} variant="secondary" className="h-12 px-6 text-base">
            <CalendarCheck className="w-4 h-4 mr-2" /> Prendre rendez-vous gratuitement
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

      {/* Modale de prise de rendez-vous (planning Google Calendar intégré) */}
      {bookingOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setBookingOpen(false)}
        >
          <div
            className="relative bg-card rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setBookingOpen(false)}
              aria-label="Fermer"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/90 border flex items-center justify-center hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <iframe src={SCHEDULE_URL} title="Prendre rendez-vous" className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
}
