import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';

export default function MentionsLegales() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-14 border-b flex items-center px-4 gap-3">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/ecommerce'))} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <img src={daftimeLogo} alt="Daftime Advisory" className="h-7 w-auto ml-auto" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Mentions légales</h1>
        <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-semibold text-foreground mb-1">Éditeur du site</h2>
            <p>
              Daftime Advisory - FZCO<br />
              Jumeirah Terrace Building, Office 411, 4th Floor, Dubai, Émirats arabes unis<br />
              Licence n° 80085<br />
              Contact : <a href="mailto:fabio@daftime.ae" className="text-primary hover:underline">fabio@daftime.ae</a>
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Directeur de la publication</h2>
            <p>Fabio Vieira</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Hébergement</h2>
            <p>
              Vercel Inc.<br />
              340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com</a>
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Propriété intellectuelle</h2>
            <p>
              L’ensemble des contenus de ce site (textes, visuels, marques, logo) sont la propriété de Daftime Advisory - FZCO, sauf mention contraire.
              Toute reproduction ou utilisation sans autorisation écrite préalable est interdite.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Données personnelles</h2>
            <p>
              Le traitement de tes données est décrit dans notre{' '}
              <button onClick={() => navigate('/confidentialite')} className="text-primary hover:underline">politique de confidentialité</button>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
