import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLoading } from '@/components/layout/AppLoading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) return <AppLoading />;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
