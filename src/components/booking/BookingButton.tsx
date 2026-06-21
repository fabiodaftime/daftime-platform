// Bouton de prise de rendez-vous autonome : ouvre une modale avec le calendrier Cal.com.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarCheck, X } from 'lucide-react';
import { BOOKING_ADVISOR_URL } from '@/lib/config';

export function BookingButton({
  label = 'Prendre rendez-vous',
  className = '',
  variant,
  size,
  url,
}: {
  label?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
  url?: string;
}) {
  const [open, setOpen] = useState(false);
  // Lien du conseiller si fourni (on s'assure des paramètres d'embed), sinon lien clientèle par défaut.
  const src = url
    ? `${url}${url.includes('?') ? '&' : '?'}embed=true&theme=light`
    : BOOKING_ADVISOR_URL;
  return (
    <>
      <Button onClick={() => setOpen(true)} className={className} variant={variant} size={size}>
        <CalendarCheck className="w-4 h-4 mr-2" /> {label}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setOpen(false)}>
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/90 border flex items-center justify-center hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <iframe src={src} title="Prendre rendez-vous" className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </>
  );
}
