// Landing page publique Daftime — première page à l'arrivée sur le site (visiteur non connecté).
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, LineChart, ShieldCheck, Sparkles, FileText, TrendingUp, Lock } from 'lucide-react';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import daftimeLogo from '@/assets/daftime-logo.jpg';
import { WorldMap } from '@/components/landing/WorldMap';

const FEATURES = [
  { icon: LineChart, title: 'Pilotage financier', desc: 'Vos indicateurs clés suivis mois après mois, sans tableur à maintenir.' },
  { icon: FileText, title: 'Reporting & dashboards', desc: 'Des dashboards clairs et à votre image, prêts à présenter.' },
  { icon: ShieldCheck, title: 'Espace client sécurisé', desc: 'Déposez vos documents et consultez vos rapports en toute confidentialité.' },
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

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-accent/15 text-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> Conseil financier & reporting
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-tight">
            Votre partenaire pour <span className="relative whitespace-nowrap">structurer
              <span className="absolute left-0 -bottom-1 w-full h-2 bg-accent/40 -z-0" /></span><br />
            votre activité
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-md">
            Daftime Advisory réunit expertise comptable et conseil pour piloter votre entreprise avec des dashboards clairs et un accompagnement sur-mesure.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button onClick={() => navigate('/auth')} className="h-12 px-6 text-base">
              Accéder à mon espace <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth')} className="h-12 px-6 text-base">
              Se connecter
            </Button>
          </div>
        </div>

        {/* Aperçu décoratif */}
        <div className="relative">
          <div className="absolute -inset-6 bg-accent/10 blur-3xl rounded-full -z-10" />
          <div className="rounded-2xl border bg-card shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium">Tableau de bord — Juin 2026</div>
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[['CA', '158 k€'], ['Marge', '61 k€'], ['Trésorerie', '+12%']].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted/60 p-3">
                  <div className="text-[11px] text-muted-foreground">{k}</div>
                  <div className="text-lg font-semibold tabular-nums">{v}</div>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-2 h-28">
              {[40, 62, 55, 78, 70, 92].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-primary/85" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
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

      {/* Implantations */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-accent/15 text-foreground mb-4">
          Implantations
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold">Présents à Paris, Dubaï &amp; Lisbonne</h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Une expertise locale, un accompagnement international.
        </p>
        <div className="mt-12 max-w-3xl mx-auto">
          <WorldMap />
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
