// Modale de prise de RDV (cal.com) partagée par les landings.
// - montée uniquement à l'ouverture (pas d'overlay permanent → scroll mobile intact) ;
// - spinner de chargement pendant que cal.com charge ;
// - FILET DE SÉCURITÉ : lien « ouvrir dans le navigateur » (plein onglet) toujours présent, et
//   bannière proactive si on détecte un navigateur in-app (Insta/FB) où l'iframe peut coincer.
import { X } from 'lucide-react';
import { BOOKING_SCHEDULE_URL, BOOKING_SCHEDULE_FULL_URL } from '@/lib/config';
import { isInAppBrowser } from '@/lib/inApp';

export function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const inApp = isInAppBrowser();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-background/90 border flex items-center justify-center hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>

        {inApp && (
          <a
            href={BOOKING_SCHEDULE_FULL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-12 bg-amber-50 text-amber-800 border-b border-amber-200"
          >
            📱 Le calendrier ne s'affiche pas ? Appuyez ici pour l'ouvrir →
          </a>
        )}

        <div className="relative flex-1">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <iframe src={BOOKING_SCHEDULE_URL} title="Prendre rendez-vous" className="relative w-full h-full border-0" />
        </div>

        <a
          href={BOOKING_SCHEDULE_FULL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-center text-xs py-2 border-t bg-muted/40 text-muted-foreground hover:text-primary"
        >
          Le calendrier ne s'affiche pas ? <span className="text-primary font-medium">Ouvrir dans votre navigateur →</span>
        </a>
      </div>
    </div>
  );
}
