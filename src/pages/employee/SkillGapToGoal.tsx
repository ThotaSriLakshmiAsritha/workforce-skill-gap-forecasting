import { useState, useEffect } from 'react';
import { Target, Cpu, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function SkillGapToGoal() {
  const { user } = useAuth();
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any[] | null>(null);
  const [roles, setRoles] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const loadRoles = async () => {
      const { data } = await supabase.from('job_requirements').select('id, title').eq('is_active', true);
      setRoles(data || []);
    };
    loadRoles();
  }, []);

  const generateRoadmap = async () => {
    if (!role || !user?.id) return;
    setLoading(true);

    try {
      const { data } = await supabase.functions.invoke('generate-learning-path', {
        body: { employee_id: user.id, target_role: role },
      });
      setRoadmap(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentVsTarget = [
    { label: 'Core role fit', current: 62, target: 92 },
    { label: 'Delivery confidence', current: 58, target: 86 },
    { label: 'Technical breadth', current: 64, target: 90 },
    { label: 'Leadership signal', current: 45, target: 78 },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#00d4aa]">
              <Sparkles className="h-3.5 w-3.5" />
              Career Futures
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.03em]">Skill Gap to Goal</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Compare your current capability profile to a future role, identify the real gaps, and generate an AI roadmap with milestones and learning resources.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-panel card-float rounded-[30px] p-6">
          <h3 className="mb-5 flex items-center gap-2 text-xl font-bold">
            <Target className="h-5 w-5 text-[#00d4aa]" />
            Select Your Target Role
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">Future Role</label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-[#13141c]/90 px-4 py-3 text-white outline-none transition focus:border-[#00d4aa]/50"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select a role</option>
                {roles.map((item) => (
                  <option key={item.id} value={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generateRoadmap}
              disabled={!role || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#7c6af7] px-5 py-3 text-sm font-semibold text-[#0d0e14] transition hover:translate-y-[-1px] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              Generate Roadmap
            </button>
          </div>

          <div className="mt-8">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f0a500]">Gap Analysis</div>
            <div className="mt-4 space-y-4">
              {currentVsTarget.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-white/78">{item.label}</span>
                    <span className="text-white/45">
                      {item.current}% → {item.target}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="bar-grow h-full rounded-full bg-[#7c6af7]" style={{ width: `${item.current}%` }} />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="bar-grow h-full rounded-full bg-[#00d4aa]" style={{ width: `${item.target}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="glass-panel rounded-[30px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0a500]">Roadmap Output</div>
                <h3 className="mt-2 text-2xl font-bold">Milestones to unlock the role</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60">
                {roadmap?.length || 0} milestones
              </span>
            </div>
          </div>

          {roadmap && roadmap.length > 0 ? (
            roadmap.map((step, index) => (
              <div key={index} className="glass-panel card-float rounded-[30px] p-5">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00d4aa]/12 text-sm font-black text-[#00d4aa]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-white">{step.skill || step.title}</h4>
                        <p className="mt-2 text-sm text-white/58">
                          {step.course_name || step.description || 'Recommended learning step.'}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/65">
                        {step.estimated_hours || step.estimate || 'N/A'}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10">
                        View Resources
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-3 py-1 text-xs font-semibold text-[#00d4aa]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Skill unlock milestone
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel rounded-[28px] p-10 text-center text-white/45">
              Choose a future role and generate your AI roadmap to see milestones here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
