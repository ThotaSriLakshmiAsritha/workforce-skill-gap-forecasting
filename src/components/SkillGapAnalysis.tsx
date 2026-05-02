import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  ChevronDown,
  Loader2,
  Brain,
  History,
  RefreshCw,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ROLES, Role } from '../pages/employee/SkillGapPage';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchedRequiredSkill {
  skill: string;
  proficiency: string;
  relevance: string;
}

interface MissingRequiredSkill {
  skill: string;
  importance: 'critical' | 'high' | 'medium';
  why: string;
}

interface MatchedBonusSkill {
  skill: string;
  value: string;
}

interface LearningPriority {
  skill: string;
  reason: string;
  urgency: 'immediate' | 'short-term' | 'long-term';
}

interface AIAnalysis {
  readiness_score: number;
  readiness_label: 'Not Ready' | 'Developing' | 'Almost Ready' | 'Job Ready';
  matched_required_skills: MatchedRequiredSkill[];
  missing_required_skills: MissingRequiredSkill[];
  matched_bonus_skills: MatchedBonusSkill[];
  missing_bonus_skills: { skill: string }[];
  ai_insights: string;
  top_learning_priorities: LearningPriority[];
  _cached?: boolean;
  _analysed_at?: string;
  _model?: string;
}

interface AnalysisLogEntry {
  id: string;
  role_id: string;
  role_title: string;
  readiness_score: number;
  readiness_label: string;
  model_used: string;
  created_at: string;
  result: AIAnalysis;
}

interface SkillGapAnalysisProps {
  userId: string | null;
  selectedRoleId: string;
  onRoleChange: (roleId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getReadinessColors(label: string) {
  switch (label) {
    case 'Not Ready':    return { badge: 'text-red-400 bg-red-500/10 border-red-500/25',     bar: 'from-red-600 to-red-400',    dot: 'bg-red-400' };
    case 'Developing':  return { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/25', bar: 'from-amber-600 to-amber-400', dot: 'bg-amber-400' };
    case 'Almost Ready':return { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/25',    bar: 'from-blue-600 to-blue-400',   dot: 'bg-blue-400' };
    case 'Job Ready':   return { badge: 'text-green-400 bg-green-500/10 border-green-500/25', bar: 'from-green-600 to-green-400',  dot: 'bg-green-400' };
    default:            return { badge: 'text-brand-textSec bg-brand-elevated border-brand-border', bar: 'from-brand-textPri to-brand-textSec', dot: 'bg-brand-textTer' };
  }
}

function urgencyConfig(urgency: string) {
  switch (urgency) {
    case 'immediate':  return { label: 'Immediate',  color: 'text-red-400 border-red-500/25 bg-red-500/10',    icon: <Zap   className="h-3 w-3" /> };
    case 'short-term': return { label: 'Short-term', color: 'text-amber-400 border-amber-500/25 bg-amber-500/10', icon: <Clock className="h-3 w-3" /> };
    default:           return { label: 'Long-term',  color: 'text-blue-400 border-blue-500/25 bg-blue-500/10',  icon: <Target className="h-3 w-3" /> };
  }
}

function importanceColor(importance: string) {
  switch (importance) {
    case 'critical': return 'text-red-400 border-red-500/25 bg-red-500/10';
    case 'high':     return 'text-amber-400 border-amber-500/25 bg-amber-500/10';
    default:         return 'text-blue-400 border-blue-500/25 bg-blue-500/10';
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SkillGapAnalysis({ userId, selectedRoleId, onRoleChange }: SkillGapAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analysedRoleId, setAnalysedRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AnalysisLogEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const selectedRole: Role = ROLES.find(r => r.id === selectedRoleId) || ROLES[0];
  const isCurrentRoleAnalysed = analysedRoleId === selectedRoleId;

  // ── Load history log on mount (no API calls, just DB reads) ─────────────
  useEffect(() => {
    if (!userId) return;
    fetchLogs();
  }, [userId]);

  const fetchLogs = async () => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('skill_gap_analyses')
        .select('id, role_id, role_title, readiness_score, readiness_label, model_used, created_at, result')
        .eq('employee_id', userId)
        .order('created_at', { ascending: false });
      setLogs((data as AnalysisLogEntry[]) || []);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── When role changes, auto-fill from cached log if available ───────────
  useEffect(() => {
    const cached = logs.find(l => l.role_id === selectedRoleId);
    if (cached) {
      setAnalysis({ ...cached.result, _cached: true, _analysed_at: cached.created_at, _model: cached.model_used });
      setAnalysedRoleId(selectedRoleId);
      setError(null);
    } else {
      setAnalysis(null);
      setAnalysedRoleId(null);
      setError(null);
    }
  }, [selectedRoleId, logs]);

  // ── Trigger AI analysis (with optional force-refresh) ───────────────────
  const handleAnalyse = async (forceRefresh = false) => {
    if (!userId) { setError('You must be logged in.'); return; }
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-skill-gap', {
        body: { employee_id: userId, role_id: selectedRole.id, role_title: selectedRole.title, force_refresh: forceRefresh },
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw new Error(fnError.message || 'Function invocation failed');
      }

      if (data?.error) {
        console.error('API error response:', data.error);
        throw new Error(data.error);
      }

      setAnalysis(data as AIAnalysis);
      setAnalysedRoleId(selectedRoleId);

      // Refresh the log list to reflect the new/updated entry
      await fetchLogs();
    } catch (err: any) {
      console.error('Skill gap analysis error:', err);
      setError(err.message || 'Failed to analyse skill gap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const colors = analysis ? getReadinessColors(analysis.readiness_label) : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── History Log Panel ───────────────────────────────────────────── */}
      {logs.length > 0 && (
        <section className="glass-panel card-float rounded-[30px] overflow-hidden">
          <button
            id="toggle-history-btn"
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-brand-elevated/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-brand-textPri/10 border border-brand-textPri/20 flex items-center justify-center">
                <History className="h-3.5 w-3.5 text-brand-textPri" />
              </div>
              <span className="text-sm font-bold text-brand-textPri uppercase tracking-[0.18em]">
                Analysis History
              </span>
              <span className="rounded-full bg-brand-textPri/10 border border-brand-textPri/20 px-2 py-0.5 text-xs font-semibold text-brand-textPri">
                {loadingHistory ? '…' : logs.length}
              </span>
            </div>
            <ChevronRight className={`h-4 w-4 text-brand-textTer transition-transform ${showHistory ? 'rotate-90' : ''}`} />
          </button>

          {showHistory && (
            <div className="border-t border-brand-border px-6 pb-5 pt-4">
              <div className="space-y-3">
                {logs.map(log => {
                  const c = getReadinessColors(log.readiness_label);
                  const role = ROLES.find(r => r.id === log.role_id);
                  const isSelected = log.role_id === selectedRoleId;
                  return (
                    <button
                      key={log.id}
                      onClick={() => { onRoleChange(log.role_id); setShowHistory(false); }}
                      className={`w-full text-left rounded-[18px] border px-4 py-3 flex items-center justify-between gap-3 transition hover:border-brand-textPri/40 ${
                        isSelected ? 'border-brand-textPri/40 bg-brand-textPri/5' : 'border-brand-border bg-brand-elevated/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg">{role?.icon ?? '🎯'}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-brand-textPri truncate">{log.role_title}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Calendar className="h-3 w-3 text-brand-textTer" />
                            <span className="text-xs text-brand-textTer">{formatDate(log.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`h-2 w-2 rounded-full ${c.dot}`} />
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.badge}`}>
                          {log.readiness_score}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Role Selector + Trigger ─────────────────────────────────────── */}
      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label htmlFor="role-select" className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer block mb-3">
              Target Role
            </label>
            <div className="relative inline-block w-full max-w-xs">
              <select
                id="role-select"
                value={selectedRoleId}
                onChange={e => onRoleChange(e.target.value)}
                className="w-full appearance-none rounded-[18px] border border-brand-border bg-brand-surface px-4 py-3 pr-10 text-sm text-brand-textPri outline-none transition focus:border-brand-textPri"
                aria-label="Select target role"
              >
                {ROLES.map(role => (
                  <option key={role.id} value={role.id}>{role.icon}  {role.title}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-brand-textTer" />
            </div>
          </div>

          <div className="flex gap-2">
            {/* Re-analyse (force refresh) — only shown when a cached result is displayed */}
            {isCurrentRoleAnalysed && analysis?._cached !== false && (
              <button
                id="reanalyse-btn"
                onClick={() => handleAnalyse(true)}
                disabled={loading}
                title="Re-run AI analysis (uses a new API call)"
                className="inline-flex items-center gap-2 rounded-[18px] border border-brand-border bg-brand-elevated px-4 py-3 text-sm font-semibold text-brand-textSec transition hover:border-brand-textPri/40 hover:text-brand-textPri disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Re-analyse
              </button>
            )}

            <button
              id="analyse-skill-gap-btn"
              onClick={() => handleAnalyse(false)}
              disabled={loading}
              className="inline-flex items-center gap-2.5 rounded-[18px] bg-brand-textPri px-6 py-3 text-sm font-bold text-brand-bg transition hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
              ) : isCurrentRoleAnalysed ? (
                <><Sparkles className="h-4 w-4" /> View Analysis</>
              ) : (
                <><Brain className="h-4 w-4" /> Analyse with AI</>
              )}
            </button>
          </div>
        </div>

        {/* Idle hint */}
        {!loading && !analysis && !error && (
          <p className="mt-4 text-xs text-brand-textTer">
            Select a role and click <strong className="text-brand-textSec">Analyse with AI</strong>. Results are saved — no repeat API calls for the same role.
          </p>
        )}
      </section>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && !loading && (
        <section className="glass-panel card-float rounded-[30px] p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </section>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <section className="glass-panel card-float rounded-[30px] p-8">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full border-2 border-brand-textPri/20 bg-brand-elevated flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-brand-textPri animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-brand-textPri">AI is analysing your skill profile…</p>
              <p className="mt-1 text-sm text-brand-textSec">
                Comparing against industry standards for <span className="text-brand-textPri font-medium">{selectedRole.icon} {selectedRole.title}</span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Analysis Results ─────────────────────────────────────────────── */}
      {analysis && !loading && (
        <>
          {/* Cached badge */}
          {analysis._cached && (
            <div className="flex items-center gap-2 px-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <span className="text-xs text-brand-textTer">
                Loaded from saved analysis · {analysis._analysed_at ? formatDate(analysis._analysed_at) : ''}{' '}
                {analysis._model && <span className="opacity-60">· {analysis._model}</span>}
              </span>
            </div>
          )}

          {/* Score Card */}
          <section className="glass-panel card-float rounded-[30px] p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-textPri/20 bg-brand-textPri/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-textPri">
                  <TrendingUp className="h-3.5 w-3.5" />
                  AI Analysis · {selectedRole.icon} {selectedRole.title}
                </div>
                <h2 className="text-3xl font-black text-brand-textPri tracking-[-0.03em]">
                  {analysis.readiness_score}% Ready
                </h2>
                <span className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-bold ${colors!.badge}`}>
                  {analysis.readiness_label}
                </span>
              </div>

              <div className="flex gap-4 flex-wrap">
                <div className="rounded-[20px] border border-brand-border bg-brand-elevated p-4 text-center min-w-[120px]">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer mb-1">Required</div>
                  <div className="text-2xl font-black text-brand-textPri">
                    {analysis.matched_required_skills.length}
                    <span className="text-sm text-brand-textTer font-normal">/{analysis.matched_required_skills.length + analysis.missing_required_skills.length}</span>
                  </div>
                  <div className="text-xs text-brand-textTer mt-0.5">matched</div>
                </div>
                <div className="rounded-[20px] border border-brand-border bg-brand-elevated p-4 text-center min-w-[120px]">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer mb-1">Bonus</div>
                  <div className="text-2xl font-black text-brand-textPri">
                    {analysis.matched_bonus_skills.length}
                    <span className="text-sm text-brand-textTer font-normal">/{analysis.matched_bonus_skills.length + (analysis.missing_bonus_skills?.length || 0)}</span>
                  </div>
                  <div className="text-xs text-brand-textTer mt-0.5">matched</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="h-2.5 w-full rounded-full bg-brand-surface overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colors!.bar} transition-all duration-700`}
                  style={{ width: `${analysis.readiness_score}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-brand-textTer">Not Ready</span>
                <span className="text-xs text-brand-textTer">Job Ready</span>
              </div>
            </div>
          </section>

          {/* AI Insights */}
          <section className="glass-panel card-float rounded-[30px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-brand-textPri/10 border border-brand-textPri/20 flex items-center justify-center">
                <Brain className="h-4 w-4 text-brand-textPri" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-textPri">AI Expert Assessment</h3>
            </div>
            <p className="text-sm text-brand-textSec leading-relaxed">{analysis.ai_insights}</p>
          </section>

          {/* Skills Grid */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Skills you have */}
            <section className="glass-panel card-float rounded-[30px] p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-textPri">Skills You Have</h3>
              </div>
              <div className="space-y-2">
                {analysis.matched_required_skills.map(item => (
                  <div key={item.skill} className="rounded-[14px] border border-green-500/20 bg-green-500/5 px-3 py-2 flex items-start justify-between gap-2">
                    <div>
                      <span className="block text-sm font-semibold text-green-400 capitalize">{item.skill}</span>
                      <span className="text-xs text-brand-textTer">{item.relevance}</span>
                    </div>
                    <span className="shrink-0 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 capitalize">
                      {item.proficiency}
                    </span>
                  </div>
                ))}
                {analysis.matched_bonus_skills.map(item => (
                  <div key={item.skill} className="rounded-[14px] border border-blue-500/20 bg-blue-500/5 px-3 py-2">
                    <span className="block text-sm font-semibold text-blue-400 capitalize">{item.skill}</span>
                    <span className="text-xs text-brand-textTer">{item.value} · <span className="italic opacity-75">bonus</span></span>
                  </div>
                ))}
                {analysis.matched_required_skills.length === 0 && analysis.matched_bonus_skills.length === 0 && (
                  <p className="text-sm text-brand-textTer">No matching skills found yet.</p>
                )}
              </div>
            </section>

            {/* Skills to develop */}
            <section className="glass-panel card-float rounded-[30px] p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-textPri">Skills to Develop</h3>
              </div>
              <div className="space-y-2">
                {analysis.missing_required_skills.map(item => (
                  <div key={item.skill} className="rounded-[14px] border border-brand-border bg-brand-elevated px-3 py-2">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-brand-textPri capitalize">{item.skill}</span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${importanceColor(item.importance)}`}>
                        {item.importance}
                      </span>
                    </div>
                    <p className="text-xs text-brand-textTer">{item.why}</p>
                  </div>
                ))}
                {(analysis.missing_bonus_skills || []).map(item => (
                  <div key={item.skill} className="rounded-[14px] border border-brand-border/50 bg-brand-surface/50 px-3 py-2">
                    <span className="text-sm text-brand-textSec capitalize">{item.skill}</span>
                    <span className="ml-2 text-xs text-brand-textTer italic">nice to have</span>
                  </div>
                ))}
                {analysis.missing_required_skills.length === 0 && (
                  <p className="text-sm text-green-400 font-medium">All required skills matched! 🎉</p>
                )}
              </div>
            </section>
          </div>

          {/* Learning Priorities */}
          {analysis.top_learning_priorities?.length > 0 && (
            <section className="glass-panel card-float rounded-[30px] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="h-4 w-4 text-brand-textPri" />
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-textPri">Top Learning Priorities</h3>
              </div>
              <div className="space-y-3">
                {analysis.top_learning_priorities.map((item, idx) => {
                  const uc = urgencyConfig(item.urgency);
                  return (
                    <div key={item.skill} className="flex items-start gap-4 rounded-[18px] border border-brand-border bg-brand-elevated p-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface border border-brand-border text-xs font-bold text-brand-textSec">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-brand-textPri capitalize">{item.skill}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${uc.color}`}>
                            {uc.icon}{uc.label}
                          </span>
                        </div>
                        <p className="text-xs text-brand-textSec">{item.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!analysis && !loading && !error && (
        <section className="glass-panel card-float rounded-[30px] p-10">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-textPri/10 border border-brand-textPri/20 flex items-center justify-center">
              <Target className="h-7 w-7 text-brand-textPri" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-textPri">Ready to Analyse?</h3>
              <p className="mt-1 text-sm text-brand-textSec max-w-sm">
                Choose a target role and click <strong>Analyse with AI</strong>. Results are saved — switching back to an analysed role loads instantly with no extra API calls.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}