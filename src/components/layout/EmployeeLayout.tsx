import { BookOpen, FileSearch, Sparkles, UserCircle2 } from "lucide-react";
import { WorkspaceShell } from "./WorkspaceShell";

const navItems = [
  { to: "/employee/profile", label: "My Profile", icon: UserCircle2 },
  { to: "/employee/resume-screener", label: "Resume Screener", icon: FileSearch },
  { to: "/employee/skill-gap", label: "Skill Gap", icon: Sparkles },
  { to: "/employee/learning-plan", label: "Learning Plan", icon: BookOpen },
];

export const EmployeeLayout = () => {
  return (
    <WorkspaceShell
      badge="Career Studio"
      title="Employee Growth Hub"
      subtitle="Upload your resume, analyze your skills, identify gaps, and get a personalized learning plan to advance your career."
      roleLabel="Employee"
      homeHref="/"
      navItems={navItems}
    />
  );
};
