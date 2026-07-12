// Page de confirmation de RDV — cible de la redirection cal.com après réservation.
// Étant sur NOTRE domaine, le Pixel Meta y déclenche de façon fiable l'événement de conversion
// « Schedule » (RDV réellement pris), ce qui est impossible depuis l'iframe cal.com (cross-origin).
import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { trackSchedule } from '@/lib/tracking';

export default function RdvConfirme() {
  useEffect(() => {
    trackSchedule({ source: 'cal.com_redirect' });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-5" />
        <h1 className="text-2xl font-semibold mb-3">Rendez-vous confirmé 🎉</h1>
        <p className="text-muted-foreground">
          Merci ! Vous allez recevoir l'invitation et un rappel par email. À très vite pour découvrir votre pilotage financier.
        </p>
      </div>
    </div>
  );
}
