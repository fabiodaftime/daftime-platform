import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthVisual } from '@/components/layout/AuthVisual';
import { z } from 'zod';
import { BrandLockup } from '@/components/layout/BrandLockup';

const emailSchema = z.string().email('Email invalide');
const passwordSchema = z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères');

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

  // Réinitialise les bandeaux de bienvenue : ils se réafficheront après cette connexion.
  useEffect(() => {
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith('daftime_welcome_'))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch { /* ignore */ }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      const msg = error instanceof z.ZodError ? error.errors[0].message : 'Identifiants invalides';
      toast({ title: 'Erreur de validation', description: msg, variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      let message = 'Une erreur est survenue';
      if (error.message.includes('Invalid login credentials')) message = 'Email ou mot de passe incorrect';
      else if (error.message.includes('Email not confirmed')) message = 'Veuillez confirmer votre email avant de vous connecter';
      toast({ title: 'Erreur de connexion', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="v2 min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <div className="hidden lg:block"><AuthVisual /></div>

      {/* Formulaire de connexion */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="lg:hidden mb-8 flex justify-center"><BrandLockup /></div>
          <span className="eyebrow">Espace Daftime Advisory</span>
          <h2 className="text-3xl font-semibold tracking-tight mt-2">Content de te revoir</h2>
          <p className="text-muted-foreground mt-2 text-sm">Connecte-toi pour retrouver ton rapport du mois.</p>

          <form onSubmit={handleSignIn} className="space-y-4 mt-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="toi@tonshop.com" className="h-11 rounded-xl bg-card"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link to="/auth/reset-password" className="text-sm text-primary hover:underline">Mot de passe oublié ?</Link>
              </div>
              <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" className="h-11 rounded-xl bg-card"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-11 text-[15px] rounded-xl group" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Se connecter <ArrowRight className="w-4 h-4 ml-1.5 transition group-hover:translate-x-0.5" /></>}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-8">Accès réservé : tes identifiants te sont fournis par ton conseiller Daftime.</p>
        </motion.div>
      </div>
    </div>
  );
}
