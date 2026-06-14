import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminHome from './AdminHome';

const STAFF_ROLES = ['admin', 'manager', 'collaborateur', 'super_admin'];

const Index = () => {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('user_roles' as any).select('role, client_id').eq('user_id', user.id);
      const roles = (data as any[]) ?? [];
      const isStaff = roles.some((r) => STAFF_ROLES.includes(r.role));
      if (!isStaff) {
        const c = roles.find((r) => r.role === 'client' && r.client_id);
        if (!cancelled && c) setClientId(c.client_id);
      }
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || (user && checking)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (clientId) return <Navigate to={`/client/${clientId}`} replace />;
  return <AdminHome />;
};

export default Index;
