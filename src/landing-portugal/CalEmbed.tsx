// Prise de RDV cal.com INLINE dans la page (pas de modale, pas de redirection).
//
// Même parti pris que le reste du repo (cf. src/lib/cal.ts et le commit
// « fix(cal): supprime embed.js ») : on affiche une iframe cal.com BRUTE et on
// capte la confirmation via le postMessage émis par cal.com. On n'utilise PAS
// embed.js — inutile ici, et son listener postMessage global casse dès qu'une
// iframe cal.com qu'il n'a pas créée lui-même est présente sur la page.
//
// Trois conséquences utiles :
//   - ~100 ko de JS tiers en moins, ce qui aide le budget FCP mobile ;
//   - l'iframe n'est montée qu'à l'approche du viewport (IntersectionObserver) ;
//   - la conversion Meta « Schedule » part sur la VRAIE confirmation, via
//     trackSchedule() qui garantit un seul événement par chargement de page.
//
// Navigateurs in-app (Instagram / Facebook) : c'est l'essentiel du trafic Meta
// mobile, et les iframes tierces y sont souvent bridées. On affiche donc en
// permanence une porte de sortie « ouvrir dans le navigateur », et une bannière
// proactive quand on détecte une webview — même logique que BookingModal.

import { useEffect, useRef, useState } from 'react';
import { isInAppBrowser } from '@/lib/inApp';
import { trackSchedule } from '@/lib/tracking';
import { CAL } from './config';

export function CalEmbed({ onBooked }: { onBooked?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inApp = isInAppBrowser();

  // Le parent passe une lambda : on la garde dans un ref pour ne pas réarmer
  // l'observer ni le listener à chaque rendu.
  const onBookedRef = useRef(onBooked);
  onBookedRef.current = onBooked;

  // Montage paresseux de l'iframe : rien n'est chargé tant que la section de
  // réservation n'approche pas du viewport.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // Confirmation de réservation → conversion. trackSchedule() est un no-op tant
  // que le pixel n'est pas chargé, donc rien ne part sans consentement.
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (!(ev.origin || '').toLowerCase().endsWith('cal.com')) return;
      const data = ev.data;
      const asText =
        typeof data === 'string' ? data : data && typeof data === 'object' ? JSON.stringify(data) : '';
      if (!asText.includes('bookingSuccessful')) return;
      trackSchedule({ source: 'cal.com', page: 'portugal' });
      onBookedRef.current?.();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div ref={hostRef} className="overflow-hidden rounded-2xl border bg-card">
      {inApp && (
        <a
          href={CAL.fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800"
        >
          📱 Le calendrier ne s’affiche pas ? Appuie ici pour l’ouvrir →
        </a>
      )}

      <div className="relative h-[680px] sm:h-[720px]">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">Chargement du calendrier…</p>
          </div>
        )}
        {visible && (
          <iframe
            src={CAL.url}
            title="Réserver 20 minutes avec Daftime Portugal"
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className="relative h-full w-full border-0"
          />
        )}
      </div>

      <a
        href={CAL.fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-t bg-muted/40 py-2.5 text-center text-xs text-muted-foreground hover:text-primary"
      >
        Le calendrier ne s’affiche pas ?{' '}
        <span className="font-medium text-primary">Ouvrir dans ton navigateur →</span>
      </a>
    </div>
  );
}
