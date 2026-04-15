import { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LearningPlanSection from '../../components/LearningPlanSection';
import { ROLES } from './SkillGapPage';

export default function LearningPlanPage() {
  const { user } = useAuth();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(ROLES[0].id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="glass-panel overflow-hidden rounded-[32px] p-6 md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-textPri/55 to-transparent" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-textPri/20 bg-brand-textPri/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-textPri">
              <BookOpen className="h-3.5 w-3.5" />
              Learning Path
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.03em]">AI Learning Roadmap</h2>
            <p className="mt-2 text-sm text-brand-textSec max-w-xl">
              Your personalised, AI-generated study roadmap — built from your real skill gaps and industry standards for the role you're targeting.
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <Sparkles className="h-4 w-4 text-brand-textPri" />
            <span className="text-xs uppercase tracking-[0.22em] text-brand-textTer">AI Powered</span>
          </div>
        </div>
      </section>

      <LearningPlanSection
        userId={user?.id ?? null}
        selectedRoleId={selectedRoleId}
        onRoleChange={setSelectedRoleId}
      />
    </div>
  );
}
