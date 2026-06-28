// Panneau "Charte graphique" : déduit la DA du client (screenshot/PDF/URL) via extract-brand,
// affiche un aperçu éditable (couleurs + polices) et enregistre dans clients.brand.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { invokeFn, fileToBase64 } from '@/lib/genericApi';

export function BrandPanel({ clientId, brand, onChange }: { clientId: string; brand: any; onChange: (b: any) => void }) {
  const [local, setLocal] = useState<any>(brand ?? {});
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setLocal(brand ?? {}); }, [brand]);

  const colors: Record<string, string> = local?.colors ?? {};
  const fonts: Record<string, string> = local?.fonts ?? {};
  const palette: string[] = Array.isArray(local?.palette) ? local.palette : [];
  const setPalette = (p: string[]) => setLocal({ ...local, palette: p });

  const runExtract = async (payload: Record<string, unknown>) => {
    setBusy(true); setError(null);
    try {
      const res = await invokeFn<{ brand: any }>('extract-brand', { client_id: clientId, ...payload });
      setLocal(res.brand); onChange(res.brand);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const onFile = async (file: File) => {
    const b64 = await fileToBase64(file);
    if (file.type === 'application/pdf') return runExtract({ pdf_base64: b64 });
    return runExtract({ image_base64: b64, image_media_type: file.type || 'image/png' });
  };

  const saveManual = async () => {
    setBusy(true); setError(null);
    try {
      const { error } = await supabase.from('clients' as any).update({ brand: local }).eq('id', clientId);
      if (error) throw error;
      onChange(local);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex">
          <input type="file" accept="image/*,application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value=''; }} />
          <span className="inline-flex items-center px-3 py-2 text-sm rounded-md border cursor-pointer hover:bg-muted">
            Screenshot / PDF…
          </span>
        </label>
        <div className="flex items-center gap-2">
          <Input placeholder="https://site-du-client.com" value={url} onChange={(e) => setUrl(e.target.value)} className="w-64" />
          <Button variant="outline" size="sm" disabled={busy || !url.trim()} onClick={() => runExtract({ url: url.trim() })}>
            Analyser l'URL
          </Button>
        </div>
        {busy && <span className="text-sm text-muted-foreground">Analyse de la charte…</span>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Aperçu / édition */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['primary', 'secondary', 'accent', 'background', 'text'].map((k) => (
          <div key={k} className="space-y-1">
            <div className="text-xs text-muted-foreground capitalize">{k}</div>
            <div className="flex items-center gap-2">
              <input type="color" value={colors[k] ?? '#000000'}
                onChange={(e) => setLocal({ ...local, colors: { ...colors, [k]: e.target.value } })}
                className="h-8 w-8 rounded border cursor-pointer" />
              <input className="w-full text-xs bg-transparent outline-none border-b" value={colors[k] ?? ''}
                onChange={(e) => setLocal({ ...local, colors: { ...colors, [k]: e.target.value } })} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Police titres</div>
          <Input value={fonts.heading ?? ''} onChange={(e) => setLocal({ ...local, fonts: { ...fonts, heading: e.target.value } })} />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Police texte</div>
          <Input value={fonts.body ?? ''} onChange={(e) => setLocal({ ...local, fonts: { ...fonts, body: e.target.value } })} />
        </div>
      </div>
      {/* Palette des graphes */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Palette des graphes (couleurs du dashboard)</div>
        <div className="flex flex-wrap items-center gap-2">
          {palette.map((c, i) => (
            <div key={i} className="relative group">
              <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(c) ? c : '#000000'}
                onChange={(e) => { const p = [...palette]; p[i] = e.target.value; setPalette(p); }}
                className="h-8 w-8 rounded border cursor-pointer" title={c} />
              <button onClick={() => setPalette(palette.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
            </div>
          ))}
          <button onClick={() => setPalette([...palette, colors.primary ?? '#3b82f6'])}
            className="h-8 w-8 rounded border text-muted-foreground hover:bg-muted" title="Ajouter une couleur">+</button>
          {palette.length === 0 && <span className="text-xs text-muted-foreground">Aucune palette — analyse l'URL ou ajoute des couleurs.</span>}
        </div>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground">Logo</div>
        {local?.logo && <img src={local.logo} alt="logo" className="h-9 max-w-[130px] object-contain bg-white border rounded p-1" />}
        <input className="flex-1 min-w-[180px] text-xs bg-transparent outline-none border-b" placeholder="URL du logo…"
          value={local?.logo ?? ''} onChange={(e) => setLocal({ ...local, logo: e.target.value || undefined })} />
      </div>

      {(local?.googleFont || local?.font) && (
        <div className="text-xs text-muted-foreground">Police chargée : {local.googleFont ?? local.font}</div>
      )}
      {Array.isArray(local?.style) && local.style.length > 0 && (
        <div className="text-xs text-muted-foreground">Style : {local.style.join(', ')}{local.notes ? ` — ${local.notes}` : ''}</div>
      )}
      <Button size="sm" variant="outline" onClick={saveManual} disabled={busy}>Enregistrer la charte</Button>
    </div>
  );
}
