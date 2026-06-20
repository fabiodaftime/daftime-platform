// Landing page publique Daftime — première page à l'arrivée sur le site (visiteur non connecté).
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, LineChart, ShieldCheck, Lock } from 'lucide-react';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import daftimeLogo from '@/assets/daftime-logo.jpg';
import { WorldMap } from '@/components/landing/WorldMap';

const FEATURES = [
  { icon: Users, title: "Accompagnement d'experts", desc: 'Des professionnels du conseil financier à vos côtés au quotidien.' },
  { icon: LineChart, title: 'Une vision claire', desc: 'Des dashboards lisibles qui transforment vos chiffres en décisions.' },
  { icon: ShieldCheck, title: 'Espace sécurisé', desc: 'Déposez vos documents et consultez vos rapports en toute confiance.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Barre de navigation */}
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={daftimeLogo} alt="Daftime Advisory" className="h-12 w-auto rounded-md" />
          <Button onClick={() => navigate('/auth')} className="h-10">
            Connexion <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
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
          <Button onClick={() => navigate('/auth')} className="h-12 px-6 text-base">
            Accéder à mon espace <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          <Button variant="outline" onClick={() => navigate('/auth')} className="h-12 px-6 text-base">
            Se connecter
          </Button>
        </div>
      </section>

      {/* Atouts */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl bg-card border p-6">
              <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-muted-foreground text-sm mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bandeau CTA */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="max-w-6xl mx-auto px-6 py-16 relative flex flex-col items-center text-center gap-6">
          <Lock className="w-8 h-8 text-accent" />
          <h2 className="text-2xl sm:text-3xl font-semibold">Prêt à piloter votre activité ?</h2>
          <p className="text-primary-foreground/70 max-w-lg">
            Connectez-vous à votre espace pour consulter vos dashboards et déposer vos documents.
          </p>
          <Button onClick={() => navigate('/auth')} variant="secondary" className="h-12 px-6 text-base">
            Connexion <ArrowRight className="w-4 h-4 ml-1.5" />
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
    </div>
  );
}
