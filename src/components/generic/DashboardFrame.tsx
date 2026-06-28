// Cadre d'affichage du dashboard (HTML généré) — IDENTIQUE côté admin et côté client.
// - rendu large (remplit la largeur dispo), hauteur généreuse 16:9-friendly
// - vrai "Plein écran" via l'API Fullscreen (présentation client nette)
// - export PDF (impression du HTML) optionnel
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Printer, ExternalLink } from 'lucide-react';

export function DashboardFrame({ html, showPdf = true, className = '' }: { html: string; showPdf?: boolean; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFull = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch { /* navigateur sans Fullscreen API → fallback nouvel onglet */
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      window.open(url, '_blank');
    }
  }, [html]);

  const openTab = useCallback(() => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(url, '_blank');
  }, [html]);

  const printPdf = useCallback(() => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => setTimeout(() => { w.focus(); w.print(); }, 500);
  }, [html]);

  return (
    <div
      ref={wrapRef}
      className={`relative bg-white ${full ? 'h-screen w-screen' : `rounded-xl border overflow-hidden shadow-sm ${className || 'h-[78vh] min-h-[520px]'}`}`}
    >
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
        {showPdf && (
          <Button variant="secondary" size="sm" onClick={printPdf} className="shadow-sm bg-white/90 backdrop-blur hover:bg-white">
            <Printer className="w-4 h-4 mr-1.5" /> PDF
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={openTab} className="shadow-sm bg-white/90 backdrop-blur hover:bg-white" title="Ouvrir dans un onglet">
          <ExternalLink className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={toggleFull} className="shadow-sm bg-white/90 backdrop-blur hover:bg-white">
          {full ? <><Minimize2 className="w-4 h-4 mr-1.5" /> Quitter</> : <><Maximize2 className="w-4 h-4 mr-1.5" /> Plein écran</>}
        </Button>
      </div>
      <iframe title="dashboard" srcDoc={html} sandbox="allow-scripts" className="w-full h-full bg-white border-0" />
    </div>
  );
}
