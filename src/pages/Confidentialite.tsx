import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';

export default function Confidentialite() {
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
        <h1 className="text-3xl font-semibold tracking-tight">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted-foreground">On collecte le minimum, on te dit exactement quoi et pourquoi.</p>

        <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-semibold text-foreground mb-1">Responsable du traitement</h2>
            <p>Daftime Advisory - FZCO — Dubai, Émirats arabes unis. Contact : <a href="mailto:fabio@daftime.ae" className="text-primary hover:underline">fabio@daftime.ae</a>.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Données que nous collectons</h2>
            <p>
              Les informations que tu nous transmets lors de la prise de rendez-vous (email, nom, URL de ton shop, chiffre d’affaires approximatif, échanges),
              ainsi que des données de navigation (via cookies et le Pixel Meta décrit ci-dessous).
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Finalités</h2>
            <p>
              Répondre à ta demande et te livrer ton dashboard ; assurer et améliorer le service ;
              mesurer et optimiser nos campagnes publicitaires.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Base légale</h2>
            <p>Ton consentement et/ou notre intérêt légitime à te répondre et à faire connaître nos services.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Publicité — Pixel Meta</h2>
            <p>
              Ce site utilise le Pixel Meta (Facebook / Instagram) pour mesurer l’efficacité de nos publicités et te proposer des contenus pertinents.
              Il dépose des cookies et transmet certaines données à Meta Platforms. Tu peux t’y opposer via les paramètres de ton navigateur
              ou de ton compte Meta (préférences publicitaires).
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Durée de conservation</h2>
            <p>Tes données sont conservées le temps nécessaire au traitement de ta demande et à nos obligations, puis supprimées.</p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Tes droits</h2>
            <p>
              Tu peux demander l’accès, la rectification, l’effacement de tes données, ou t’opposer à leur traitement.
              Il te suffit d’écrire à <a href="mailto:fabio@daftime.ae" className="text-primary hover:underline">fabio@daftime.ae</a>.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground mb-1">Sécurité</h2>
            <p>Accès restreint, données chiffrées en transit. Tes fichiers ne servent qu’à produire tes rapports.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
