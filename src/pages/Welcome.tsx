// Page d'arrivée d'un CLIENT invité (/bienvenue?token_hash=…&type=invite|magiclink).
// Valide le jeton ici même (verifyOtp) puis, pour un premier accès, fait choisir le mot de passe.
// Ensuite : redirection vers l'accueil, qui envoie le client sur son espace.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'checking' | 'password' | 'error'>('checking');
  const [err, setErr] = useState<string | null>(null);
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [saving, setSaving] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return; done.current = true;
    const p = new URLSearchParams(window.location.search);
    const token_hash = p.get('token_hash'); const type = p.get('type') === 'magiclink' ? 'magiclink' : 'invite';
    if (!token_hash) { setStep('error'); setErr('Lien incomplet.'); return; }
    supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (error) { setStep('error'); setErr('Ce lien a expiré ou a déjà servi. Demande un nouveau lien à ton conseiller Daftime.'); return; }
      window.history.replaceState({}, '', '/bienvenue'); // le jeton ne reste pas dans l'historique
      if (type === 'invite') setStep('password'); else navigate('/', { replace: true });
    });
  }, [navigate]);

  const save = async () => {
    if (pw.length < 8) { setErr('8 caractères minimum.'); return; }
    if (pw !== pw2) { setErr('Les deux mots de passe ne correspondent pas.'); return; }
    setSaving(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    navigate('/', { replace: true });
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full border rounded-xl p-6 space-y-4 bg-card">
        <h1 className="text-lg font-semibold">Bienvenue sur ton espace Daftime</h1>
        {step === 'checking' && <p className="text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Vérification du lien…</p>}
        {step === 'error' && <p className="text-sm text-destructive">{err}</p>}
        {step === 'password' && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <p className="text-sm text-muted-foreground">Choisis ton mot de passe : tu t'en serviras pour te reconnecter.</p>
            <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mot de passe"
              className="w-full h-10 rounded border bg-background px-3 text-sm" />
            <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirme le mot de passe"
              className="w-full h-10 rounded border bg-background px-3 text-sm" />
            {err && <p className="text-xs text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accéder à mon espace'}</Button>
          </form>
        )}
      </div>
    </main>
  );
}
