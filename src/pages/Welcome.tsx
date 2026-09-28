// Page d'arrivée d'un CLIENT invité (/bienvenue?token_hash=…&type=invite|magiclink).
// Valide le jeton ici même (verifyOtp) puis, pour un premier accès, fait choisir le mot de passe.
// Ensuite : redirection vers l'accueil, qui envoie le client sur son espace.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { AuthVisual } from '@/components/layout/AuthVisual';
import { BrandLockup } from '@/components/layout/BrandLockup';

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

  const rules = [{ ok: pw.length >= 8, t: '8 caractères minimum' }, { ok: pw.length > 0 && pw === pw2, t: 'Les deux saisies correspondent' }];
  const input = 'w-full h-11 rounded-xl border bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition';

  return (
    <main className="v2 min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <div className="hidden lg:block"><AuthVisual headline={'Bienvenue\ndans ton espace.'} /></div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="lg:hidden mb-8 flex justify-center"><BrandLockup /></div>
          <span className="eyebrow">Espace Daftime Advisory</span>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">Bienvenue</h1>

          {step === 'checking' && <p className="text-sm text-muted-foreground mt-6 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Vérification de ton lien…</p>}
          {step === 'error' && <p className="text-sm text-destructive mt-6">{err}</p>}
          {step === 'password' && (
            <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <p className="text-sm text-muted-foreground">Choisis ton mot de passe : tu t'en serviras pour revenir sur ton espace.</p>
              <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mot de passe" aria-label="Mot de passe" className={input} />
              <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirme le mot de passe" aria-label="Confirme le mot de passe" className={input} />
              <ul className="space-y-1 pt-1">
                {rules.map((r) => (
                  <li key={r.t} className={`text-xs flex items-center gap-1.5 transition-colors ${r.ok ? 'text-[hsl(var(--good))]' : 'text-muted-foreground'}`}>
                    <Check className={`w-3.5 h-3.5 transition-opacity ${r.ok ? 'opacity-100' : 'opacity-30'}`} /> {r.t}
                  </li>
                ))}
              </ul>
              {err && <p className="text-xs text-destructive">{err}</p>}
              <Button type="submit" className="w-full h-11 rounded-xl text-[15px] group" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Accéder à mon espace <ArrowRight className="w-4 h-4 ml-1.5 transition group-hover:translate-x-0.5" /></>}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
}
