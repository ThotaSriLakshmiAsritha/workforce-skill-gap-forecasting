import type { UserRole } from '../types/database';

export function getDefaultWorkspaceRoute(role?: UserRole | null): string {
  if (role === 'employee') {
    return '/employee/profile';
  }

  if (role === 'org_admin' || role === 'hr_manager' || role === 'team_lead') {
    return '/org/dashboard';
  }

  return '/employee/profile';
}
