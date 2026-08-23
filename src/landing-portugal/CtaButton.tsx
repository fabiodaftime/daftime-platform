// Le CTA unique de la page. Un seul libellé, une seule action : amener à la
// section de réservation. Aucune autre conversion n'existe sur cette page.

import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackLead } from '@/lib/tracking';
import { CTA_LABEL } from './content';

export const BOOKING_ANCHOR = 'reserver';

export function CtaButton({
  placement,
  variant = 'default',
  className = '',
}: {
  /** Où se trouve ce bouton (hero, tarifs, rnh, final) — remonté au tracking. */
  placement: string;
  variant?: 'default' | 'secondary';
  className?: string;
}) {
  const go = () => {
    // Convention du repo : « Lead » = intention (clic CTA), « Schedule » = RDV
    // réellement confirmé. No-op tant que le pixel n'est pas chargé.
    trackLead(`portugal_${placement}`);
    const target = document.getElementById(BOOKING_ANCHOR);
    if (!target) return;
    // Defilement instantane si l'utilisateur a desactive les animations systeme.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <Button
      onClick={go}
      variant={variant}
      className={`h-14 w-full touch-manipulation px-7 text-base font-semibold sm:h-12 sm:w-auto ${className}`}
    >
      <CalendarCheck className="mr-2 h-5 w-5" />
      {CTA_LABEL}
    </Button>
  );
}
