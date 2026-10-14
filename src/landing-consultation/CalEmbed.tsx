// Prise de RDV cal.com INLINE — même parti pris que src/landing-portugal/CalEmbed.tsx
// (iframe brute, pas d'embed.js, montage à l'approche du viewport), avec deux ajouts :
//   - les utm_* / fbclid de la page sont transmis à cal.com (iframe ET repli plein onglet) ;
//   - la confirmation cal.com affiche juste un bandeau « C'est réservé » : AUCUN
//     événement Meta ici, Schedule est envoyé côté serveur par Make (voir ./params.ts).
import { useEffect, useMemo, useRef, useState } from 'react';
import { isInAppBrowser } from '@/lib/inApp';
import { CAL } from './config';
import { withForwardParams } from './params';

export function CalEmbed({ onBooked }: { onBooked?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inApp = isInAppBrowser();
  const src = useMemo(() => withForwardParams(CAL.url), []);
  const fullUrl = useMemo(() => withForwardParams(CAL.fullUrl), []);

  const onBookedRef = useRef(onBooked);
  onBookedRef.current = onBooked;

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

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (!(ev.origin || '').toLowerCase().endsWith('cal.com')) return;
      const data = ev.data;
      const asText =
        typeof data === 'string' ? data : data && typeof data === 'object' ? JSON.stringify(data) : '';
      if (!asText.includes('bookingSuccessful')) return;
      onBookedRef.current?.();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div ref={hostRef} className="overflow-hidden rounded-2xl border border-[#1A1D56]/10 bg-white">
      {inApp && (
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] items-center justify-center gap-1.5 bg-accent px-4 py-2.5 text-center text-[13px] font-semibold text-accent-foreground"
        >
          Le calendrier ne s’affiche pas ? Appuie ici pour l’ouvrir →
        </a>
      )}

      <div className="relative h-[700px] overscroll-contain sm:h-[720px]">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary motion-reduce:animate-none" />
            <p className="text-sm text-muted-foreground">Chargement du calendrier…</p>
          </div>
        )}
        {visible && (
          <iframe
            src={src}
            title="Réserver 20 minutes avec Daftime Advisory"
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className="relative h-full w-full border-0"
          />
        )}
      </div>

      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-t border-[#1A1D56]/10 bg-secondary py-3 text-center text-[13px] text-muted-foreground"
      >
        Le calendrier ne s’affiche pas ?{' '}
        <span className="font-semibold text-primary underline underline-offset-2">Ouvrir dans ton navigateur →</span>
      </a>
    </div>
  );
}
