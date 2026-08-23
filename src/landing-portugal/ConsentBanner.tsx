// Bandeau de consentement RGPD.
//
// Contraintes respectées :
//   - aucun traceur n'est déposé avant l'action du visiteur ;
//   - refuser prend UN clic, exactement comme accepter ;
//   - les deux boutons ont la même taille et le même poids visuel ;
//   - la finalité est nommée (mesure d'audience publicitaire Meta) ;
//   - lien vers la politique de confidentialité.
//
// Positionné en `fixed` : aucun décalage de mise en page (CLS = 0).

import { Button } from '@/components/ui/button';
import { LINKS } from './config';

export function ConsentBanner({
  onAccept,
  onRefuse,
}: {
  onAccept: () => void;
  onRefuse: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Gestion des traceurs"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/98 backdrop-blur supports-[backdrop-filter]:bg-card/90"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          On utilise un traceur de mesure d’audience publicitaire (Meta) pour savoir quelles
          annonces amènent des rendez-vous. Il n’est déposé que si tu l’acceptes, et refuser
          ne change rien à l’usage de la page.{' '}
          <a
            href={LINKS.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            Politique de confidentialité
          </a>
        </p>
        <div className="flex flex-shrink-0 gap-2">
          <Button variant="outline" className="h-11 flex-1 touch-manipulation sm:flex-none" onClick={onRefuse}>
            Refuser
          </Button>
          <Button className="h-11 flex-1 touch-manipulation sm:flex-none" onClick={onAccept}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
