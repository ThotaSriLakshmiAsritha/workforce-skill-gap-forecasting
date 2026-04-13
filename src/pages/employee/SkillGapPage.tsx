import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SkillGapAnalysis from '../../components/SkillGapAnalysis';

// Role definitions — used for the role picker only (no local analysis logic)
export interface Role {
  id: string;
  title: string;
  icon: string;
}

export const ROLES: Role[] = [
  { id: 'full-stack-engineer',    title: 'Full Stack Engineer',    icon: '⚡' },
  { id: 'ml-engineer',            title: 'ML Engineer',            icon: '🧠' },
  { id: 'data-scientist',         title: 'Data Scientist',         icon: '📊' },
  { id: 'cybersecurity-analyst',  title: 'Cybersecurity Analyst',  icon: '🔒' },
  { id: 'devops-engineer',        title: 'DevOps Engineer',        icon: '🚀' },
  { id: 'mobile-engineer',        title: 'Mobile Engineer',        icon: '📱' },
  { id: 'backend-engineer',       title: 'Backend Engineer',       icon: '⚙️' },
  { id: 'cloud-architect',        title: 'Cloud Architect',        icon: '☁️' },
  { id: 'data-engineer',          title: 'Data Engineer',          icon: '🔧' },
  { id: 'product-manager',        title: 'Product Manager',        icon: '🎯' },
];

export default function SkillGapPage() {
  const { user } = useAuth();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(ROLES[0].id);

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden rounded-[32px] p-6 md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-textPri/55 to-transparent" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-textPri/20 bg-brand-textPri/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-textPri">
              <Sparkles className="h-3.5 w-3.5" />
              AI Skill Gap Explorer
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.03em]">Career Role Match</h2>
            <p className="mt-2 text-sm text-brand-textSec max-w-xl">
              Choose a target role and let our AI analyse your skill profile against real industry expectations — on demand.
            </p>
          </div>
        </div>
      </section>

      <SkillGapAnalysis
        userId={user?.id ?? null}
        selectedRoleId={selectedRoleId}
        onRoleChange={setSelectedRoleId}
      />
    </div>
  );
}
