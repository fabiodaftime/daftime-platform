import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { z } from 'zod';
import daftimeLogoWhite from '@/assets/daftime-logo-white-en.png';
import daftimeLogo from '@/assets/daftime-logo.jpg';

const emailSchema = z.string().email('Email invalide');
const passwordSchema = z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères');

const FEATURES = [
  { icon: TrendingUp, title: 'CFO & Advisory', desc: 'Conseil financier stratégique pour grandir sereinement' },
  { icon: BarChart3, title: 'Reporting clair', desc: 'Des dashboards lisibles pour décider vite et bien' },
  { icon: PieChart, title: 'Accompagnement sur-mesure', desc: 'Un suivi adapté à vos objectifs' },
];

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const validateInputs = (isSignUp: boolean) => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (isSignUp && !fullName.trim()) throw new Error('Le nom complet est requis');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: 'Erreur de validation', description: error.errors[0].message, variant: 'destructive' });
      } else if (error instanceof Error) {
        toast({ title: 'Erreur de validation', description: error.message, variant: 'destructive' });
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(false)) return;
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(true)) return;
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    setIsLoading(false);
    if (error) {
      let message = 'Une erreur est survenue';
      if (error.message.includes('already registered')) message = 'Cet email est déjà utilisé';
      toast({ title: 'Erreur d\'inscription', description: message, variant: 'destructive' });
    } else {
      toast({ title: 'Inscription réussie', description: 'Bienvenue ! Vous êtes maintenant connecté.' });
    }
  };

  const fieldClass = 'h-11';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Panneau de marque */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-32 -right-24 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative">
          <img src={daftimeLogoWhite} alt="Daftime Advisory" className="h-10 w-auto" />
        </div>

        <div className="relative space-y-10">
          <div>
            <h1 className="text-3xl xl:text-4xl font-semibold leading-tight">
              Votre partenaire pour<br />structurer votre activité
            </h1>
            <p className="text-primary-foreground/70 mt-4 text-lg">
              Pilotage financier, reporting clair, accompagnement sur-mesure.
            </p>
          </div>

          <div className="space-y-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-accent/15 text-accent shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium">{f.title}</h3>
                  <p className="text-sm text-primary-foreground/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-primary-foreground/40">© 2026 Daftime Advisory. Tous droits réservés.</p>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src={daftimeLogo} alt="Daftime" className="h-12 w-auto mx-auto mb-5 lg:hidden rounded" />
            <h2 className="text-2xl font-semibold text-foreground">Bienvenue</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Connectez-vous pour accéder à vos dashboards</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" placeholder="vous@exemple.com" className={fieldClass}
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <Link to="/auth/reset-password" className="text-sm text-primary hover:underline">Mot de passe oublié ?</Link>
                  </div>
                  <Input id="signin-password" type="password" placeholder="••••••••" className={fieldClass}
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                  {isLoading ? 'Connexion…' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input id="signup-name" type="text" placeholder="Jean Dupont" className={fieldClass}
                    value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="vous@exemple.com" className={fieldClass}
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" className={fieldClass}
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                  {isLoading ? 'Inscription…' : 'Créer un compte'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Propulsé par <span className="font-medium text-foreground">Daftime Advisory</span>
          </p>
        </div>
      </div>
    </div>
  );
}
