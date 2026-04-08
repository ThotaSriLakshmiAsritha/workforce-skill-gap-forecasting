import { Briefcase, GraduationCap, Target, UserCircle2 } from 'lucide-react';
import { WorkspaceShell } from './WorkspaceShell';

const navItems = [
  { to: '/employee/profile', label: 'My Profile', icon: UserCircle2 },
  { to: '/employee/learning', label: 'Learning Path', icon: GraduationCap },
  { to: '/employee/projects', label: 'My Projects', icon: Briefcase },
  { to: '/employee/skill-goal', label: 'Skill Gap to Goal', icon: Target },
];

export const EmployeeLayout = () => {
  return (
    <WorkspaceShell
      badge="Career Studio"
      title="Employee Growth Hub"
      subtitle="Track active work, sharpen your capability map, and turn future roles into an executable roadmap."
      roleLabel="Employee"
      homeHref="/"
      navItems={navItems}
    />
  );
};
