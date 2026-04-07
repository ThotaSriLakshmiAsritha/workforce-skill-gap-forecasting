import { useMemo, useState } from 'react';
import {
  Send,
  Bot,
  User,
  Users,
  Sparkles,
  Loader2,
  CheckCircle2,
  ClipboardPenLine,
  Gauge,
  Timer,
  TriangleAlert,
  UserRoundSearch,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MatchedEmployee {
  id: string;
  name: string;
  job_title?: string;
  match_score: number;
  matched_skills: string[];
  gap_skills: string[];
}

interface ExternalCandidate {
  id: string;
  candidate_name: string;
  candidate_email?: string | null;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  experience_years?: number | null;
  ai_summary?: string | null;
}

type LearningPathMap = Record<
  string,
  Array<{
    skill: string;
    course_name: string;
    platform: string;
    estimated_hours: number;
    url?: string;
    deadline?: string;
  }>
>;

const quickStarts = [
  {
    label: 'Product launch pod',
    name: 'Q3 Product Launch',
    description: 'Need a cross-functional pod for release planning, backend delivery, and QA hardening.',
    skills: 'React, Node.js, Product Strategy, QA Automation',
    teamSize: 4,
    timelineWeeks: 8,
  },
  {
    label: 'Analytics squad',
    name: 'Customer Insights Revamp',
    description: 'Looking for data and BI talent to rebuild reporting and adoption dashboards.',
    skills: 'SQL, Power BI, Python, Stakeholder Communication',
    teamSize: 3,
    timelineWeeks: 6,
  },
  {
    label: 'Cloud migration',
    name: 'Infra Modernization',
    description: 'Need engineers for phased migration, DevOps automation, and cloud cost optimization.',
    skills: 'AWS, Terraform, DevOps, Security',
    teamSize: 5,
    timelineWeeks: 10,
  },
];

export default function ProjectAllocator() {
  const { user, profile } = useAuth();
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am the AI Allocation Agent. Describe the project and I will propose the best-fit team.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchedEmployee[]>([]);
  const [externalCandidates, setExternalCandidates] = useState<ExternalCandidate[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPathMap>({});
  const [shortage, setShortage] = useState<boolean>(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [teamSize, setTeamSize] = useState(3);
  const [timelineWeeks, setTimelineWeeks] = useState(6);
  const [requiredSkills, setRequiredSkills] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const canConfirmTeam = profile?.role === 'hr_manager' || profile?.role === 'org_admin';

  const skillChips = requiredSkills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  const normalizedRequiredSkills = Array.from(
    new Set(skillChips.map((skill) => skill.trim().toLowerCase()).filter(Boolean))
  );

  const qualifiedInternalMatches = matches
    .filter((match) => match.match_score >= 50)
    .slice(0, teamSize);

  const remainingSeats = Math.max(teamSize - qualifiedInternalMatches.length, 0);

  const uniqueMatchedSkills = new Set(
    qualifiedInternalMatches.flatMap((match) =>
      match.matched_skills.map((skill) => skill.trim().toLowerCase()).filter(Boolean)
    )
  );

  const coveredRequiredSkills = normalizedRequiredSkills.filter((skill) => uniqueMatchedSkills.has(skill));
  const uncoveredRequiredSkills = normalizedRequiredSkills.filter((skill) => !uniqueMatchedSkills.has(skill));

  const averageMatch = matches.length
    ? Math.round(matches.reduce((total, match) => total + match.match_score, 0) / matches.length)
    : 0;
  const gapSkillCount = uncoveredRequiredSkills.length;

  const shortlistExternalCandidates = async (seatCount: number) => {
    if (seatCount <= 0) {
      setExternalCandidates([]);
      return;
    }

    const { data, error } = await supabase
      .from('resume_uploads')
      .select(
        'id, candidate_name, candidate_email, match_score, matched_skills, missing_skills, experience_years, ai_summary, status'
      )
      .in('status', ['screened', 'shortlisted'])
      .gte('match_score', 50)
      .order('match_score', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Failed to load external candidates:', error);
      setExternalCandidates([]);
      return;
    }

    const ranked = (data || [])
      .map((candidate) => {
        const normalizedMatched = (candidate.matched_skills || [])
          .map((skill: string) => skill.trim().toLowerCase())
          .filter(Boolean);
        const overlapCount = normalizedRequiredSkills.length
          ? normalizedMatched.filter((skill: string) => normalizedRequiredSkills.includes(skill)).length
          : normalizedMatched.length;

        return {
          ...candidate,
          overlapCount,
        };
      })
      .filter((candidate) => candidate.overlapCount > 0)
      .sort((a, b) => {
        if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount;
        return (b.match_score || 0) - (a.match_score || 0);
      })
      .slice(0, seatCount)
      .map(({ overlapCount: _overlapCount, ...candidate }) => candidate as ExternalCandidate);

    setExternalCandidates(ranked);
  };

  const runAllocation = async (userMsg: string) => {
    if (!userMsg.trim() || loading || intakeLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      let localProjectId = projectId;
      const isDemoMode = Boolean(sessionStorage.getItem('mockRole'));
      if (!localProjectId && !isDemoMode) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + timelineWeeks * 7);

        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: projectName || 'New Project',
            description,
            team_size: teamSize,
            start_date: startDate.toISOString().slice(0, 10),
            end_date: endDate.toISOString().slice(0, 10),
            created_by: user?.id || null,
          })
          .select('id')
          .single();

        if (projectError) {
          console.warn('Project persistence failed, continuing with allocation-only flow:', projectError.message);
        } else if (project?.id) {
          localProjectId = project.id;
          setProjectId(project.id);
        }

        if (skillChips.length > 0 && localProjectId) {
          const { data: skills } = await supabase.from('skills').select('id, name').in('name', skillChips);

          const skillRows = (skills || []).map((skill) => ({
            project_id: localProjectId,
            skill_id: skill.id,
            importance: 'required',
          }));

          if (skillRows.length > 0) {
            const { error: skillInsertError } = await supabase.from('project_skills').insert(skillRows);
            if (skillInsertError) {
              console.warn('Project skills persistence failed:', skillInsertError.message);
            }
          }
        }
      }

      const { data, error } = await supabase.functions.invoke('allocate-project', {
        body: {
          message: userMsg,
          project_name: projectName || 'New Project',
          description: description || userMsg,
          required_skills: skillChips,
          team_size: teamSize,
          timeline_weeks: timelineWeeks,
          session_id: sessionId,
        },
      });

      if (error) throw error;

      const clarificationMessage =
        data?.clarification_needed && Array.isArray(data?.clarification_questions)
          ? `I need a bit more detail:\n- ${data.clarification_questions.join('\n- ')}`
          : null;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: clarificationMessage || data.allocation_reasoning || 'Here is the best team based on your requirements.',
        },
      ]);
      const internalMatches = data.matched_employees || [];
      const qualifiedInternal = internalMatches.filter((match: MatchedEmployee) => match.match_score >= 50).slice(0, teamSize);
      setMatches(internalMatches);
      const filteredLearningPaths = Object.fromEntries(
        Object.entries(data.learning_paths || {}).filter(([employeeId]) =>
          qualifiedInternal.some((match: MatchedEmployee) => match.id === employeeId)
        )
      ) as LearningPathMap;
      setLearningPaths(filteredLearningPaths);
      const openSeats = Math.max(teamSize - qualifiedInternal.length, 0);
      await shortlistExternalCandidates(openSeats);
      setShortage(Boolean(data.workforce_shortage) || openSeats > 0);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '[Error: Unable to reach AI agent. Ensure edge functions are deployed.]',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    await runAllocation(userMsg);
  };

  const handleIntakeSubmit = async () => {
    const autoMessage =
      `Allocate team for project "${projectName || 'New Project'}". ` +
      `Description: ${description || 'N/A'}. ` +
      `Team size: ${teamSize}. ` +
      `Timeline weeks: ${timelineWeeks}. ` +
      `Required skills: ${requiredSkills || 'N/A'}.`;

    setIntakeLoading(true);
    try {
      await runAllocation(autoMessage);
    } finally {
      setIntakeLoading(false);
    }
  };

  const applyQuickStart = (template: (typeof quickStarts)[number]) => {
    setProjectName(template.name);
    setDescription(template.description);
    setRequiredSkills(template.skills);
    setTeamSize(template.teamSize);
    setTimelineWeeks(template.timelineWeeks);
  };

  const confirmTeam = async () => {
    if (qualifiedInternalMatches.length === 0 || confirming) return;
    setConfirming(true);

    try {
      const isDemoMode = Boolean(sessionStorage.getItem('mockRole'));
      if (isDemoMode) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Demo mode: team confirmation simulated successfully.' }]);
        return;
      }

      const { data, error } = await supabase.functions.invoke('confirm-team', {
        body: {
          project_id: projectId,
          project_name: projectName || 'New Project',
          description,
          required_skills: skillChips,
          team_size: teamSize,
          timeline_weeks: timelineWeeks,
          session_id: sessionId,
          matched_employees: qualifiedInternalMatches.map((match) => ({ id: match.id, role_in_project: match.job_title || 'Team Member' })),
          learning_paths: learningPaths,
        },
      });

      if (error) throw error;

      if (data?.project_id) setProjectId(data.project_id);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Internal team confirmed. Created ${data?.assigned_count ?? qualifiedInternalMatches.length} assignments.`,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Team confirmation failed: ${err?.message || 'Unknown error'}`,
        },
      ]);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[28px] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">AI Staffing Studio</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Project Allocator</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Turn project briefs into team recommendations, identify missing capabilities, and generate upskilling paths before commitments are made.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SummaryPill label="Target Team" value={`${teamSize}`} icon={Users} />
            <SummaryPill label="Timeline" value={`${timelineWeeks}w`} icon={Timer} />
            <SummaryPill label="Avg Match" value={matches.length ? `${averageMatch}%` : '--'} icon={Gauge} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[28px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Project Intake</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start from a blank brief or use one of the quick-start templates below.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickStarts.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => applyQuickStart(template)}
                className="rounded-full border bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:bg-secondary/80"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Project Name</label>
            <input
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#10131b] px-3 py-2.5 text-white placeholder:text-white/30"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Customer success platform overhaul"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Team Size</label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#10131b] px-3 py-2.5 text-white placeholder:text-white/30"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Timeline (weeks)</label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#10131b] px-3 py-2.5 text-white placeholder:text-white/30"
              value={timelineWeeks}
              onChange={(e) => setTimelineWeeks(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Required Skills</label>
            <input
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#10131b] px-3 py-2.5 text-white placeholder:text-white/30"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="React, Node.js, Power BI"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Project Description</label>
            <textarea
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#10131b] px-3 py-2.5 text-white placeholder:text-white/30"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the delivery scope, business goals, and constraints."
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Project Snapshot</p>
            <div className="flex flex-wrap gap-2">
              {skillChips.length > 0 ? (
                skillChips.map((skill) => (
                  <span key={skill} className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Add a few required skills to improve the recommendation quality.</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleIntakeSubmit}
            disabled={loading || intakeLoading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
          >
            {intakeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPenLine className="h-4 w-4" />}
            {intakeLoading ? 'Generating Team...' : 'Generate Team From Intake'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel flex min-h-[640px] flex-col overflow-hidden rounded-[28px]">
          <div className="flex h-16 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-5 font-semibold text-[#00d4aa]">
            <Bot className="h-5 w-5" />
            Allocation Agent
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'rounded-tr-md bg-primary text-primary-foreground'
                      : 'rounded-tl-md bg-secondary text-secondary-foreground'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-3xl rounded-tl-md bg-secondary px-4 py-3 text-secondary-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing workforce coverage...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/10 bg-[#0d0e14]/65 px-5 py-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for team refinements, tradeoffs, or backup recommendations..."
              className="flex-1 rounded-2xl border border-white/10 bg-[#10131b] px-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 ring-[#00d4aa]/30"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Recommended Team
            </h3>
            <button
              onClick={confirmTeam}
              disabled={!canConfirmTeam || confirming || qualifiedInternalMatches.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {remainingSeats > 0 ? 'Confirm Internal Team' : 'Confirm Team'}
            </button>
          </div>

            <div className="grid gap-4 md:grid-cols-4">
              <AnalyticsCard title="Internal Team" value={qualifiedInternalMatches.length} detail="Employees above the 50% match threshold" />
              <AnalyticsCard title="Covered Skills" value={coveredRequiredSkills.length} detail="Required skills covered by the internal team" />
              <AnalyticsCard title="External Backfill" value={externalCandidates.length} detail="Resume candidates filling the remaining seats" />
              <AnalyticsCard title="Missing Skills" value={gapSkillCount} detail="Required skills still not covered internally" />
            </div>

          {matches.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed bg-white/80 text-center text-muted-foreground">
              <Users className="mb-3 h-12 w-12 opacity-40" />
              <p className="font-medium">Describe a project to see team recommendations.</p>
              <p className="mt-1 max-w-sm text-sm">The agent will rank employees, explain the match, and suggest learning paths where coverage is weak.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shortage && (
                <div className="rounded-[24px] border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  <div className="flex items-center gap-2 font-semibold">
                    <TriangleAlert className="h-4 w-4" />
                    Internal workforce shortage detected
                  </div>
                  <p className="mt-1">
                    Only employees with a 50%+ match are counted toward the internal team. Remaining seats are backfilled from screened resume candidates below.
                  </p>
                </div>
              )}

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
                Internal staffing rule: only employees with a 50% or higher match are considered assignable. If seats remain open, resume-screened outsiders with 50%+ match are recommended as external backfill.
              </div>

              {qualifiedInternalMatches.map((match) => (
                <div key={match.id} className="glass-panel card-float rounded-[28px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold">{match.name}</h4>
                      <div className="text-sm text-muted-foreground">{match.job_title || 'Team Member'}</div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        match.match_score >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {match.match_score}% Match
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Matched Skills
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {match.matched_skills.map((skill) => (
                            <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80">
                              {skill}
                            </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Gap / Upskill Required
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {match.gap_skills.length > 0 ? (
                          match.gap_skills.map((skill) => (
                            <span key={skill} className="rounded-full border border-red-400/15 bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-200">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-green-700">No critical gap skills detected.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {learningPaths[match.id] && learningPaths[match.id].length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Recommended Learning Path
                      </div>
                      <div className="space-y-2">
                        {learningPaths[match.id].map((learningPath, index) => (
                          <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                            <div className="font-semibold">
                              {learningPath.skill}: {learningPath.course_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {learningPath.platform} · {learningPath.estimated_hours || 0} hrs ·{' '}
                              {learningPath.deadline || 'No deadline'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {remainingSeats > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <UserRoundSearch className="h-5 w-5 text-primary" />
                    External Resume Backfill
                  </div>
                  {externalCandidates.length > 0 ? (
                    externalCandidates.map((candidate) => (
                      <div key={candidate.id} className="rounded-[28px] border border-sky-400/15 bg-sky-400/10 p-5 shadow-sm backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-bold">{candidate.candidate_name || 'External Candidate'}</h4>
                            <div className="text-sm text-muted-foreground">
                              External resume candidate
                              {candidate.candidate_email ? ` · ${candidate.candidate_email}` : ''}
                            </div>
                          </div>
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                            {candidate.match_score}% Match
                          </span>
                        </div>

                        {candidate.ai_summary && <p className="mt-3 text-sm text-muted-foreground">{candidate.ai_summary}</p>}

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Resume-Matched Skills
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {candidate.matched_skills.map((skill) => (
                                <span key={skill} className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Remaining Gaps
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {candidate.missing_skills.length > 0 ? (
                                candidate.missing_skills.map((skill) => (
                                  <span key={skill} className="rounded-full border border-red-400/15 bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-200">
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-green-700">No critical gaps detected.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                      No screened resume candidates above 50% were found to fill the remaining {remainingSeats} seat{remainingSeats === 1 ? '' : 's'}.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-white/45">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
    </div>
  );
}

function AnalyticsCard({ title, value, detail }: { title: string; value: number; detail: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-sm backdrop-blur-xl">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{title}</div>
      <div className="mt-2 text-3xl font-extrabold text-white">{value}</div>
      <p className="mt-2 text-sm text-white/55">{detail}</p>
    </div>
  );
}
