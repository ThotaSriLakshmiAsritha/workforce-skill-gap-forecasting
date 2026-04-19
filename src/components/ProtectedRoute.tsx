import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/database';
import { getDefaultWorkspaceRoute } from '../lib/workspaceRoutes';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-brand-textPri" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length) {
    const role = profile?.role ?? 'employee';

    if (!allowedRoles.includes(role)) {
      return <Navigate to={getDefaultWorkspaceRoute(role)} replace />;
    }
  }

  return <Outlet />;
}
