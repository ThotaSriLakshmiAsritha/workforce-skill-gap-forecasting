import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/database';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

function getDefaultRouteForRole(role: UserRole): string {
  if (role === 'employee') {
    return '/employee/profile';
  }

  return '/org/dashboard';
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
    const role = profile?.role;

    if (!role) {
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to={getDefaultRouteForRole(role)} replace />;
    }
  }

  return <Outlet />;
}
