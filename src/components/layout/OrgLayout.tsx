import { BarChart3, BriefcaseBusiness, FileSearch } from 'lucide-react';
import { WorkspaceShell } from './WorkspaceShell';

const navItems = [
  { to: '/org/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/org/allocator', label: 'Project Allocator', icon: BriefcaseBusiness },
  { to: '/org/screener', label: 'Resume Screener', icon: FileSearch },
];

export const OrgLayout = () => {
  return (
    <WorkspaceShell
      badge="Workforce OS"
      title="Organization Control Room"
      subtitle="Live staffing visibility, delivery planning, and hiring intelligence in one premium command center."
      roleLabel="Organization"
      homeHref="/"
      switchHref="/employee/profile"
      switchLabel="Switch to Employee"
      navItems={navItems}
    />
  );
};
