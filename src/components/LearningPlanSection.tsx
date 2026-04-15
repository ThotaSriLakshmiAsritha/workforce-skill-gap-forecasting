import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Target, Clock, CheckCircle2,
  ChevronDown, ChevronUp, Copy, ExternalLink,
  Sparkles, Brain, Loader2, RefreshCw, AlertTriangle,
  Calendar, Zap, Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ROLES } from '../pages/employee/SkillGapPage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LearningResource {
  title: string;
  type: 'Course' | 'Documentation' | 'Practice' | 'Book' | 'Project';
  provider: string;
  url: string;
  free: boolean;
  durationHours?: number | null;
}

interface LearningStep {
  skill: string;
  isRequired: boolean;
  isPrerequisite: boolean;
  estimatedHours: number;
  weekStart: number;
  weekEnd: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  resources: LearningResource[];
  milestones: string[];
  projectIdea: string;
}

interface LearningPhase {
  name: 'Foundation' | 'Core' | 'Specialization';
  weekStart: number;
  weekEnd: number;
  skills: LearningStep[];
}

interface LearningPlan {
  targetRole: string;
  targetRoleId: string;
  totalEstimatedWeeks: number;
  totalEstimatedHours: number;
  phases: LearningPhase[];
  prioritySkillsCount: number;
  bonusSkillsCount: number;
  _cached?: boolean;
  _generated_at?: string;
  _model?: string;
}

interface CachedSkillGap {
  missing_required_skills: { skill: string }[];
  missing_bonus_skills: { skill: string }[];
}

// ─── Component Props ──────────────────────────────────────────────────────────

interface LearningPlanProps {
  userId: string | null;
  selectedRoleId: string;
  onRoleChange: (roleId: string) => void;
}

async function extractFunctionError(fnError: any): Promise<string> {
  if (!fnError) return 'Function error';

  if (fnError?.context) {
    try {
      const body = await fnError.context.json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } catch {
      try {
        const text = await fnError.context.text();
        if (text) return text;
      } catch {
        // Ignore parse/read failures and fall back to the function error message.
      }
    }
  }

  return fnError?.message || 'Function error';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function phaseColor(name: string) {
  if (name === 'Foundation') return { dot: 'bg-amber-400', bar: 'bg-amber-400', ring: 'border-amber-400/40 bg-amber-400/10 text-amber-400' };
  if (name === 'Core') return { dot: 'bg-blue-400', bar: 'bg-blue-400', ring: 'border-blue-400/40 bg-blue-400/10 text-blue-400' };
  return { dot: 'bg-purple-400', bar: 'bg-purple-400', ring: 'border-purple-400/40 bg-purple-400/10 text-purple-400' };
}

function difficultyColor(d: string) {
  if (d === 'Beginner') return 'bg-green-500/10 text-green-400 border-green-500/25';
  if (d === 'Advanced') return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
  return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
}

function resourceTypeIcon(type: string) {
  switch (type) {
    case 'Course':        return '🎓';
    case 'Documentation': return '📄';
    case 'Practice':      return '⚙️';
    case 'Book':          return '📚';
    case 'Project':       return '🛠️';
    default:              return '🔗';
  }
}

const ROLE_TITLES: Record<string, string> = {
  'full-stack-engineer': 'Full Stack Engineer',
  'ml-engineer': 'ML Engineer',
  'data-scientist': 'Data Scientist',
  'cybersecurity-analyst': 'Cybersecurity Analyst',
  'devops-engineer': 'DevOps Engineer',
  'mobile-engineer': 'Mobile Engineer',
  'backend-engineer': 'Backend Engineer',
  'cloud-architect': 'Cloud Architect',
  'data-engineer': 'Data Engineer',
  'product-manager': 'Product Manager',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LearningPlanSection({ userId, selectedRoleId, onRoleChange }: LearningPlanProps) {
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noSkillGap, setNoSkillGap] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['Foundation', 'Core']));
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  const selectedRole = ROLES.find(r => r.id === selectedRoleId) || ROLES[0];

  // ── Fetch the cached skill gap to get gap skills, then call the edge fn ──
  const fetchPlan = useCallback(async (forceRefresh = false) => {
    if (!userId) { setError('You must be logged in.'); return; }
    setLoading(true);
    setError(null);
    setNoSkillGap(false);
    setPlan(null);

    try {
      // 1. Read cached skill gap analysis for this role
      const { data: gapRow } = await supabase
        .from('skill_gap_analyses')
        .select('result')
        .eq('employee_id', userId)
        .eq('role_id', selectedRoleId)
        .maybeSingle();

      if (!gapRow?.result) {
        // No skill gap analysis exists yet; prompt the user
        setNoSkillGap(true);
        setPlan(null);
        setLoading(false);
        return;
      }

      const gap: CachedSkillGap = gapRow.result;
      const missingRequired = (gap.missing_required_skills || []).map((s: { skill: string }) => s.skill);
      const missingNiceToHave = (gap.missing_bonus_skills || []).map((s: { skill: string }) => s.skill);

      // 2. Call generate-learning-path edge function (handles its own cache)
      const { data, error: fnError } = await supabase.functions.invoke('generate-learning-path', {
        body: {
          employee_id: userId,
          role_id: selectedRoleId,
          role_title: selectedRole.title,
          missing_required: missingRequired,
          missing_nice_to_have: missingNiceToHave,
          force_refresh: forceRefresh,
        },
      });

      if (fnError) throw new Error(await extractFunctionError(fnError));
      if (data?.error) throw new Error(data.error);

      // Normalise — ensure every array-field is always an array
      const safePlan: LearningPlan = {
        ...data,
        phases: (data.phases || []).map((ph: LearningPhase) => ({
          ...ph,
          skills: (ph.skills || []).map((sk: LearningStep) => ({
            ...sk,
            resources: sk.resources || [],
            milestones: sk.milestones || [],
            projectIdea: sk.projectIdea || '',
          })),
        })),
      };

      setPlan(safePlan);
      setExpandedPhases(new Set(['Foundation', 'Core']));
    } catch (err: any) {
      setError(err.message || 'Failed to generate learning plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedRoleId, selectedRole.title]);

  // ── When role changes, reset and auto-load ───────────────────────────────
  useEffect(() => {
    setPlan(null);
    setError(null);
    setNoSkillGap(false);
    setExpandedSkills(new Set());
    if (userId) fetchPlan(false);
  }, [selectedRoleId, userId]);

  // ── Toggle helpers ────────────────────────────────────────────────────────
  const togglePhase = (name: string) => {
    const s = new Set(expandedPhases);
    s.has(name) ? s.delete(name) : s.add(name);
    setExpandedPhases(s);
  };

  const toggleSkill = (name: string) => {
    const s = new Set(expandedSkills);
    s.has(name) ? s.delete(name) : s.add(name);
    setExpandedSkills(s);
  };

  // ── Copy summary to clipboard ─────────────────────────────────────────────
  const copySummary = () => {
    if (!plan) return;
    const phases = plan.phases || [];
    const text = `AI Learning Plan — ${plan.targetRole ?? ''}
Total: ~${plan.totalEstimatedWeeks ?? 0} weeks · ${plan.totalEstimatedHours ?? 0} hours
Generated by ${plan._model ?? 'AI'} on ${plan._generated_at ? formatDate(plan._generated_at) : 'unknown date'}

${phases.map(ph =>
  `${ph.name} (Week ${ph.weekStart}–${ph.weekEnd}):\n` +
  (ph.skills || []).map(sk =>
    `  • ${sk.skill} (~${sk.estimatedHours ?? 0} hrs, ${sk.difficulty ?? ''})\n` +
    `    Resources: ${(sk.resources || []).slice(0, 2).map(r => r.title).join(', ')}\n` +
    `    Project: ${sk.projectIdea ?? ''}`
  ).join('\n')
).join('\n\n')}`;
    navigator.clipboard.writeText(text);
  };

  const completionDate = plan
    ? new Date(Date.now() + (plan.totalEstimatedWeeks ?? 0) * 7 * 24 * 60 * 60 * 1000)
    : null;

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">

      {/* ── Role Selector + Controls ──────────────────────────────────────── */}
      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label htmlFor="learning-role-select" className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer block mb-3">
              Target Role
            </label>
            <div className="relative inline-block w-full max-w-xs">
              <select
                id="learning-role-select"
                value={selectedRoleId}
                onChange={e => onRoleChange(e.target.value)}
                className="w-full appearance-none rounded-[18px] border border-brand-border bg-brand-surface px-4 py-3 pr-10 text-sm text-brand-textPri outline-none transition focus:border-brand-textPri"
                aria-label="Select target role for learning plan"
              >
                {ROLES.map(role => (
                  <option key={role.id} value={role.id}>{role.icon}  {role.title}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-brand-textTer" />
            </div>
          </div>

          <div className="flex gap-2">
            {/* Re-generate — only when a plan exists and it's cached */}
            {plan && plan._cached && (
              <button
                id="regenerate-plan-btn"
                onClick={() => fetchPlan(true)}
                disabled={loading}
                title="Re-generate with AI (uses a fresh API call)"
                className="inline-flex items-center gap-2 rounded-[18px] border border-brand-border bg-brand-elevated px-4 py-3 text-sm font-semibold text-brand-textSec transition hover:border-brand-textPri/40 hover:text-brand-textPri disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Re-generate
              </button>
            )}

            <button
              id="generate-plan-btn"
              onClick={() => fetchPlan(false)}
              disabled={loading}
              className="inline-flex items-center gap-2.5 rounded-[18px] bg-brand-textPri px-6 py-3 text-sm font-bold text-brand-bg transition hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : plan ? (
                <><BookOpen className="h-4 w-4" /> View Plan</>
              ) : (
                <><Brain className="h-4 w-4" /> Generate with AI</>
              )}
            </button>
          </div>
        </div>

        {/* Idle hint */}
        {!loading && !plan && !error && !noSkillGap && (
          <p className="mt-4 text-xs text-brand-textTer">
            Select a role and click <strong className="text-brand-textSec">Generate with AI</strong>. Plans are saved — revisiting a role loads instantly.
          </p>
        )}
      </section>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <section className="glass-panel card-float rounded-[30px] p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </section>
      )}

      {/* ── No Skill Gap analysis yet ─────────────────────────────────────── */}
      {noSkillGap && !loading && (
        <section className="glass-panel card-float rounded-[30px] p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center">
              <Info className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-textPri">Run a Skill Gap Analysis First</h3>
              <p className="mt-1 text-sm text-brand-textSec max-w-sm">
                The AI learning plan is personalised to your skill gaps for <strong>{selectedRole.icon} {selectedRole.title}</strong>. Head to the <strong>Skill Gap</strong> tab, run an analysis for this role, then come back here.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      {loading && (
        <section className="glass-panel card-float rounded-[30px] p-8">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-brand-textPri/20 animate-ping" />
              <div className="h-16 w-16 rounded-full border-2 border-brand-textPri/30 bg-brand-elevated flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-brand-textPri animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-brand-textPri">AI is building your learning roadmap…</p>
              <p className="mt-1 text-sm text-brand-textSec">
                Crafting a personalised plan for <span className="text-brand-textPri font-medium">{selectedRole.icon} {selectedRole.title}</span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Plan ─────────────────────────────────────────────────────────── */}
      {plan && !loading && (
        <>
          {/* Cache / model badge */}
          <div className="flex items-center gap-2 px-1">
            <div className={`h-1.5 w-1.5 rounded-full ${plan._cached ? 'bg-green-400' : 'bg-brand-textPri'}`} />
            <span className="text-xs text-brand-textTer">
              {plan._cached ? 'Loaded from saved plan' : 'AI-generated plan'}{' '}
              {plan._generated_at && <>· {formatDate(plan._generated_at)}</>}{' '}
              {plan._model && <span className="opacity-60">· {plan._model}</span>}
            </span>
          </div>

          {/* ── Summary Card ─────────────────────────────────────────────── */}
          <section className="glass-panel card-float rounded-[30px] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-8 w-8 rounded-full bg-brand-textPri/10 border border-brand-textPri/20 flex items-center justify-center">
                <Brain className="h-4 w-4 text-brand-textPri" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-textPri">Your AI Learning Roadmap</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-[18px] border border-brand-border bg-brand-elevated p-4 text-center">
                <Target className="h-5 w-5 text-brand-textTer mx-auto mb-2" />
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer mb-1">Target Role</div>
                <div className="text-sm font-bold text-brand-textPri leading-tight">{plan.targetRole}</div>
              </div>
              <div className="rounded-[18px] border border-brand-border bg-brand-elevated p-4 text-center">
                <Clock className="h-5 w-5 text-brand-textTer mx-auto mb-2" />
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer mb-1">Total Time</div>
                <div className="text-lg font-black text-brand-textPri">~{plan.totalEstimatedWeeks} wks</div>
                <div className="text-xs text-brand-textSec">{plan.totalEstimatedHours} hrs</div>
              </div>
              <div className="rounded-[18px] border border-brand-border bg-brand-elevated p-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-brand-textTer mx-auto mb-2" />
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer mb-1">Skills to Learn</div>
                <div className="text-lg font-black text-brand-textPri">{(plan.prioritySkillsCount ?? 0) + (plan.bonusSkillsCount ?? 0)}</div>
                <div className="text-xs text-brand-textSec">{plan.prioritySkillsCount ?? 0} required · {plan.bonusSkillsCount ?? 0} bonus</div>
              </div>
              <div className="rounded-[18px] border border-brand-border bg-brand-elevated p-4 text-center">
                <Calendar className="h-5 w-5 text-brand-textTer mx-auto mb-2" />
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer mb-1">Est. Completion</div>
                <div className="text-sm font-bold text-brand-textPri">
                  {completionDate?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          </section>

          {/* ── Phase Timeline Bar ────────────────────────────────────────── */}
          {(plan.phases || []).length > 0 && (
            <section className="glass-panel card-float rounded-[30px] p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-textPri mb-4">Progress Timeline</h3>
              <div className="space-y-3">
                {(plan.phases || []).map(phase => {
                  const c = phaseColor(phase.name);
                  const totalWks = plan.totalEstimatedWeeks ?? 0;
                  const widthPct = totalWks > 0
                    ? ((phase.weekEnd - phase.weekStart + 1) / totalWks) * 100
                    : 0;
                  return (
                    <div key={phase.name} className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-brand-textPri">{phase.name}</span>
                          <span className="text-xs text-brand-textSec">Week {phase.weekStart}–{phase.weekEnd}</span>
                        </div>
                        <div className="relative h-2 bg-brand-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Phase Details ─────────────────────────────────────────────── */}
          {(plan.phases || []).map(phase => {
            const c = phaseColor(phase.name);
            const isOpen = expandedPhases.has(phase.name);
            return (
              <section key={phase.name} className="glass-panel card-float rounded-[30px] overflow-hidden">
                <button
                  id={`phase-toggle-${phase.name.toLowerCase()}`}
                  onClick={() => togglePhase(phase.name)}
                  className="w-full flex items-center justify-between p-6 border-b border-brand-border hover:bg-brand-surface/50 transition"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                    <h3 className="text-xl font-bold text-brand-textPri">{phase.name}</h3>
                    <span className="text-sm text-brand-textSec">Week {phase.weekStart}–{phase.weekEnd}</span>
                    <span className={`text-xs rounded-full border px-2.5 py-0.5 font-semibold ${c.ring}`}>
                      {phase.skills.length} skill{phase.skills.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-brand-textTer" /> : <ChevronDown className="h-5 w-5 text-brand-textTer" />}
                </button>

                {isOpen && (
                  <div className="p-6 space-y-4">
                    {(phase.skills || []).map(skill => {
                      const isSkillOpen = expandedSkills.has(skill.skill);
                      return (
                        <div key={skill.skill} className="border border-brand-border rounded-[20px] overflow-hidden">

                          {/* Skill header */}
                          <div className="p-4 border-b border-brand-border">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className="text-base font-bold text-brand-textPri capitalize">{skill.skill}</h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${difficultyColor(skill.difficulty)}`}>
                                  {skill.difficulty}
                                </span>
                                <span className="text-xs text-brand-textSec">Wk {skill.weekStart}–{skill.weekEnd}</span>
                                <span className="text-xs text-brand-textSec">~{skill.estimatedHours} hrs</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              {skill.isRequired && (
                                <span className="px-2 py-0.5 text-xs rounded-full border border-red-500/25 bg-red-500/10 text-red-400 font-medium">
                                  Required
                                </span>
                              )}
                              {skill.isPrerequisite && (
                                <span className="px-2 py-0.5 text-xs rounded-full border border-orange-500/25 bg-orange-500/10 text-orange-400 font-medium">
                                  Prerequisite
                                </span>
                              )}
                              {!skill.isRequired && !skill.isPrerequisite && (
                                <span className="px-2 py-0.5 text-xs rounded-full border border-brand-border bg-brand-surface text-brand-textSec font-medium">
                                  Bonus
                                </span>
                              )}
                              <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${c.ring}`}>
                                {phase.name}
                              </span>
                            </div>

                            {/* Resources */}
                            <div className="flex flex-wrap gap-2">
                              {(skill.resources || []).slice(0, 3).map((res, i) => (
                                <a
                                  key={i}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-surface rounded-full hover:bg-brand-elevated border border-brand-border transition group"
                                >
                                  <span>{resourceTypeIcon(res.type)}</span>
                                  <span className="font-medium text-brand-textPri">{res.title}</span>
                                  <span className="text-brand-textTer">· {res.provider}</span>
                                  <span className={res.free ? 'text-green-400' : 'text-amber-400'}>
                                    {res.free ? 'Free' : 'Paid'}
                                  </span>
                                  <ExternalLink className="h-3 w-3 text-brand-textTer group-hover:text-brand-textPri transition" />
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* Milestones + Project expand toggle */}
                          <button
                            id={`skill-toggle-${skill.skill.replace(/\s+/g, '-')}`}
                            onClick={() => toggleSkill(skill.skill)}
                            className="w-full p-4 text-left hover:bg-brand-surface/50 transition"
                            aria-expanded={isSkillOpen}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-brand-textSec flex items-center gap-1.5">
                                <Zap className="h-3.5 w-3.5" />
                                View milestones &amp; project idea
                              </span>
                              {isSkillOpen
                                ? <ChevronUp className="h-4 w-4 text-brand-textTer" />
                                : <ChevronDown className="h-4 w-4 text-brand-textTer" />
                              }
                            </div>
                          </button>

                          {isSkillOpen && (
                            <div className="px-4 pb-4 space-y-4 border-t border-brand-border/50 pt-4">
                              {skill.milestones?.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold text-brand-textPri mb-2">Milestones</h5>
                                  <ol className="list-decimal list-inside space-y-1">
                                    {skill.milestones.map((m, i) => (
                                      <li key={i} className="text-sm text-brand-textSec">{m}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                              {skill.projectIdea && (
                                <div className="rounded-[14px] border border-brand-textPri/15 bg-brand-textPri/5 p-3">
                                  <h5 className="text-sm font-semibold text-brand-textPri mb-1 flex items-center gap-2">
                                    💡 Project Idea
                                  </h5>
                                  <p className="text-sm text-brand-textSec">{skill.projectIdea}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {/* ── Empty Plan ────────────────────────────────────────────────── */}
          {(plan.phases || []).length === 0 && (
            <section className="glass-panel card-float rounded-[30px] p-8">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-brand-textPri mb-2">You're ready for {plan.targetRole}! 🎉</h3>
                <p className="text-sm text-brand-textSec">
                  The AI found no significant skill gaps for this role based on your current profile.
                </p>
              </div>
            </section>
          )}

          {/* ── Export ───────────────────────────────────────────────────── */}
          <section className="glass-panel card-float rounded-[30px] p-6">
            <div className="text-center">
              <p className="text-sm text-brand-textSec mb-4">
                Copy this AI-generated plan to your notes or share it with your manager.
              </p>
              <button
                id="copy-learning-plan-btn"
                onClick={copySummary}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-textPri text-brand-bg rounded-full text-sm font-bold hover:opacity-90 transition active:scale-95"
              >
                <Copy className="h-4 w-4" />
                Copy Plan Summary
              </button>
            </div>
          </section>
        </>
      )}

      {/* ── Initial empty state (no plan, no error, not loading) ─────────── */}
      {!plan && !loading && !error && !noSkillGap && (
        <section className="glass-panel card-float rounded-[30px] p-10">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-textPri/10 border border-brand-textPri/20 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-brand-textPri" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-textPri">Ready to Build Your Roadmap?</h3>
              <p className="mt-1 text-sm text-brand-textSec max-w-sm">
                Select a target role and click <strong>Generate with AI</strong>. The AI will craft a personalised, phased learning plan from your skill gaps.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}