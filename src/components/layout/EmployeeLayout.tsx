import { FileSearch, UserCircle2 } from "lucide-react";
import { WorkspaceShell } from "./WorkspaceShell";

const navItems = [
  { to: "/employee/profile", label: "My Profile", icon: UserCircle2 },
  {
    to: "/employee/resume-screener",
    label: "Resume Screener",
    icon: FileSearch,
  },
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
