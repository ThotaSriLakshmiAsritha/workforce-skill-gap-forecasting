import { useState, useCallback, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  Filter,
  Loader2,
  BadgeCheck,
  TriangleAlert,
  TimerReset,
  BriefcaseBusiness,
  Trophy,
  Users,
  ScanSearch,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Candidate {
  id: string;
  candidate_name: string;
  email: string;
  experience_years: number;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  status: string;
  summary?: string;
}

interface JobRequirement {
  id: string;
  title: string;
}

type ReviewFilter = 'all' | 'shortlist' | 'review';

const mockSkillLibrary: Record<string, string[]> = {
  'software engineer': ['JavaScript', 'React', 'Node.js', 'REST APIs', 'SQL', 'Git'],
  'data analyst': ['SQL', 'Power BI', 'Excel', 'Python', 'Data Visualization'],
  'cloud engineer': ['AWS', 'Terraform', 'Docker', 'CI/CD', 'Linux'],
  default: ['Communication', 'Problem Solving', 'Excel', 'SQL', 'APIs'],
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function buildMockCandidate(file: File, roleTitle: string, requiredSkills: string[]): Candidate {
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const seed = Array.from(file.name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const fallbackSkills = mockSkillLibrary[normalizeName(roleTitle)] || mockSkillLibrary.default;
  const targetSkills = requiredSkills.length > 0 ? requiredSkills : fallbackSkills;

  const matchedSkills = targetSkills.filter((_, index) => ((seed + index) % 3) !== 0).slice(0, Math.max(2, Math.ceil(targetSkills.length * 0.6)));
  const missingSkills = targetSkills.filter((skill) => !matchedSkills.includes(skill));
  const scoreBase = targetSkills.length > 0 ? Math.round((matchedSkills.length / targetSkills.length) * 100) : 58;
  const matchScore = Math.max(42, Math.min(91, scoreBase + (seed % 7) - 3));
  const experienceYears = (seed % 6) + 2;

  return {
    id: `mock-${file.name}-${Date.now()}`,
    candidate_name: baseName.replace(/[_-]+/g, ' '),
    email: 'demo-candidate@example.com',
    experience_years: experienceYears,
    match_score: matchScore,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    status: 'screened',
    summary: `Demo screening result for ${baseName}. Strongest fit areas: ${matchedSkills.slice(0, 3).join(', ') || 'general capability'}.`,
  };
}

export default function ResumeScreener() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobRequirements, setJobRequirements] = useState<JobRequirement[]>([]);
  const [jobId, setJobId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [minScore, setMinScore] = useState(50);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [batchSize, setBatchSize] = useState(3);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const loadJobReqs = async () => {
      const { data } = await supabase.from('job_requirements').select('id, title').eq('is_active', true);
      setJobRequirements(data || []);
      if (data && data.length > 0) setJobId(data[0].id);
    };
    loadJobReqs();
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setUploadError('');

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [jobId, projectName]
  );

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handleFiles = async (files: File[]) => {
    if (!jobId) {
      setUploadError('Select a target job role before uploading resumes.');
      return;
    }
    if (files.length === 0) {
      setUploadError('Choose at least one resume file to screen.');
      return;
    }

    setUploadError('');
    setUploading(true);
    const nextCandidates: Candidate[] = [];
    const currentRequirement = jobRequirements.find((requirement) => requirement.id === jobId);
    const requiredSkillsFromTitle = (currentRequirement?.title || '')
      .split(/[\/,&]| and /i)
      .map((skill) => skill.trim())
      .filter(Boolean);
    const isDemoMode = Boolean(sessionStorage.getItem('mockRole'));

    try {
      if (isDemoMode) {
        const mockCandidates = files.map((file) =>
          buildMockCandidate(file, currentRequirement?.title || 'General Role', requiredSkillsFromTitle)
        );
        setCandidates((prev) => [...mockCandidates, ...prev].sort((a, b) => b.match_score - a.match_score));
        return;
      }

      for (const file of files) {
        const filePath = `${jobId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data, error } = await supabase.functions.invoke('screen-resume', {
          body: { storage_path: filePath, job_requirement_id: jobId },
        });

        if (error) throw error;

        nextCandidates.push({
          id: Math.random().toString(),
          candidate_name: data.name || file.name,
          email: data.email || 'unknown',
          experience_years: data.total_experience_years || 0,
          match_score: data.match_score || 0,
          matched_skills: data.matched_skills || [],
          missing_skills: data.missing_skills || [],
          status: 'screened',
          summary: data.summary,
        });
      }

      setCandidates((prev) =>
        [...nextCandidates, ...prev].sort((a, b) => b.match_score - a.match_score)
      );
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Resume upload failed. Please try again and check that the selected files are valid.';

      if (err?.context) {
        try {
          const body = await err.context.json();
          errorMessage = body?.error || body?.message || errorMessage;
        } catch {
          try {
            const text = await err.context.text();
            if (text) errorMessage = text;
          } catch {
            // ignore body parsing failure
          }
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      const normalizedError = String(errorMessage).toLowerCase();
      if (
        normalizedError.includes('invalid jwt') ||
        normalizedError.includes('not authenticated') ||
        normalizedError.includes('missing authorization') ||
        normalizedError.includes('functionshttperror')
      ) {
        const mockCandidates = files.map((file) =>
          buildMockCandidate(file, currentRequirement?.title || 'General Role', requiredSkillsFromTitle)
        );
        setCandidates((prev) => [...mockCandidates, ...prev].sort((a, b) => b.match_score - a.match_score));
        setUploadError('Live resume screening is unavailable for this session, so demo screening results were generated locally.');
        return;
      }

      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const openFilePicker = () => {
    setUploadError('');
    fileInputRef.current?.click();
  };

  const updateCandidateStatus = (candidateId: string, status: 'shortlisted' | 'rejected') => {
    setCandidates((prev) =>
      prev.map((candidate) => (candidate.id === candidateId ? { ...candidate, status } : candidate))
    );
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const scorePass = candidate.match_score >= minScore;
    const statusPass =
      reviewFilter === 'all' ||
      (reviewFilter === 'shortlist' && candidate.status === 'shortlisted') ||
      (reviewFilter === 'review' && candidate.status !== 'shortlisted');
    return scorePass && statusPass;
  });

  const rankedCandidates = [...candidates].sort((a, b) => b.match_score - a.match_score);
  const bestCandidates = rankedCandidates
    .filter((candidate) => candidate.match_score >= minScore)
    .slice(0, batchSize);

  const shortlistedCount = candidates.filter((candidate) => candidate.status === 'shortlisted').length;
  const reviewCount = candidates.filter((candidate) => candidate.match_score >= minScore).length;
  const avgScore = candidates.length
    ? Math.round(candidates.reduce((total, candidate) => total + candidate.match_score, 0) / candidates.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 border-green-500 bg-green-50';
    if (score >= 60) return 'text-amber-600 border-amber-500 bg-amber-50';
    return 'text-red-600 border-red-500 bg-red-50';
  };

  const currentRequirement = jobRequirements.find((requirement) => requirement.id === jobId);
  const isDemoMode = Boolean(sessionStorage.getItem('mockRole'));

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[28px] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Hiring Intelligence</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Resume Screener</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Screen a batch of resumes against one role, rank the strongest matches, and quickly pick the best candidates for a project.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Avg Match" value={`${avgScore}%`} icon={BadgeCheck} />
            <MetricCard label="Qualified" value={`${reviewCount}`} icon={Filter} />
            <MetricCard label="Shortlisted" value={`${shortlistedCount}`} icon={CheckCircle2} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-panel rounded-[28px] p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <BriefcaseBusiness className="h-4 w-4 text-primary" />
              Screening Setup
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block font-medium">Project Name</label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-[#10131b] px-3 py-2.5 text-white placeholder:text-white/30"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Customer Support Intelligence Hub"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium">Target Job Role</label>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-[#10131b] px-3 py-2.5 text-white"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                >
                  {jobRequirements.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium">Top Picks to Highlight</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="w-full rounded-2xl border border-white/10 bg-[#10131b] px-3 py-2.5 text-white placeholder:text-white/30"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/50">
                Batch mode screens all uploaded resumes against <span className="font-semibold text-foreground">{currentRequirement?.title || 'the selected role'}</span> and surfaces the strongest candidates first.
                {isDemoMode ? ' Demo mode uses local mock scoring instead of the live edge function.' : ''}
              </div>
            </div>
          </div>

          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`rounded-[28px] border-2 border-dashed p-8 text-center transition-colors ${
              isDragging ? 'border-[#00d4aa] bg-[#00d4aa]/6' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06]'
            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFileSelect}
              accept=".pdf,.doc,.docx,.txt"
            />
            {uploading ? (
              <>
                <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
                <p className="font-semibold">Screening resume batch...</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ranking candidates for {projectName || 'your project'} against the selected requirement.
                </p>
              </>
            ) : (
              <>
                <UploadCloud className="mx-auto mb-4 h-10 w-10 text-primary" />
                <p className="font-semibold">Upload a batch of resumes</p>
                <p className="mt-1 text-sm text-muted-foreground">Drop multiple PDF, DOCX, or TXT files and we’ll score them together.</p>
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="mt-5 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  Browse Resume Batch
                </button>
              </>
            )}
          </div>

          {uploadError && (
            <div className="rounded-[20px] border border-red-400/15 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {uploadError}
            </div>
          )}

          <div className="glass-panel rounded-[28px] p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <Filter className="h-4 w-4 text-primary" />
              Candidate Filters
            </h3>
            <div className="space-y-5 text-sm">
              <div>
                <div className="mb-1 flex items-center justify-between font-medium">
                  <label>Minimum Match Score</label>
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">{minScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-[#00d4aa]"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
              <div>
                <label className="mb-2 block font-medium">Review View</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'shortlist', label: 'Shortlisted' },
                    { value: 'review', label: 'Needs Review' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReviewFilter(option.value as ReviewFilter)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                        reviewFilter === option.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-3">
            <InsightCard
              title="Best Fits"
              value={bestCandidates.length}
              note="Top ranked resumes for the selected requirement"
              tone="success"
              icon={Trophy}
            />
            <InsightCard
              title="Above threshold"
              value={reviewCount}
              note="Candidates meeting the current match bar"
              tone="primary"
              icon={BadgeCheck}
            />
            <InsightCard
              title="Need review"
              value={candidates.filter((candidate) => candidate.match_score < minScore).length}
              note="Profiles that need manual review or another role"
              tone="warning"
              icon={TriangleAlert}
            />
          </div>

          <div className="glass-panel rounded-[28px] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <ScanSearch className="h-4 w-4" />
                  Best Candidates For {projectName || 'This Project'}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  The strongest resumes from this batch for <span className="font-semibold text-foreground">{currentRequirement?.title || 'the selected role'}</span>.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Picking top {batchSize} above {minScore}%
              </div>
            </div>

            {bestCandidates.length > 0 ? (
              <div className="mt-5 grid gap-4">
                {bestCandidates.map((candidate, index) => (
                  <div key={candidate.id} className="rounded-[24px] border border-[#00d4aa]/15 bg-[#00d4aa]/10 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <h3 className="text-lg font-bold">{candidate.candidate_name}</h3>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {candidate.experience_years} years experience
                          {candidate.email !== 'unknown' ? ` · ${candidate.email}` : ''}
                        </p>
                        {candidate.summary && <p className="mt-2 text-sm text-muted-foreground">{candidate.summary}</p>}
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-bold text-[#9af4df] shadow-sm">
                        {candidate.match_score}% Match
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {candidate.matched_skills.map((skill) => (
                        <span key={skill} className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/45">
                Upload a batch of resumes to start ranking the best candidates for this requirement.
              </div>
            )}
          </div>

          <div className="glass-panel flex items-center justify-between rounded-[24px] px-5 py-4">
            <div className="text-sm font-medium text-white/55">
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Users className="h-4 w-4" />
              Batch threshold: {minScore}% and above
            </div>
          </div>

          {candidates.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-12 text-center text-white/45">
              <FileText className="mb-4 h-12 w-12 opacity-30" />
              <p className="font-medium">No resumes screened yet.</p>
              <p className="text-sm">Upload a batch to rank candidates and pick the best ones for your requirement.</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-12 text-center text-white/45">
              <TimerReset className="mb-4 h-10 w-10 opacity-40" />
              <p className="font-medium">No candidates match the current filters.</p>
              <p className="text-sm">Lower the threshold or switch the review view to broaden the list.</p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="glass-panel card-float rounded-[28px] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 text-xl font-extrabold ${getScoreColor(
                      candidate.match_score
                    )}`}
                  >
                    {candidate.match_score}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-bold leading-tight">{candidate.candidate_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {candidate.experience_years} years experience
                          {candidate.email !== 'unknown' ? ` · ${candidate.email}` : ''}
                        </p>
                        {candidate.summary && <p className="mt-2 text-sm text-muted-foreground">{candidate.summary}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1.5 text-sm font-semibold text-green-700 transition hover:bg-green-500/20"
                          onClick={() => updateCandidateStatus(candidate.id, 'shortlisted')}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Shortlist
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-500/20"
                          onClick={() => updateCandidateStatus(candidate.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Matched Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {candidate.matched_skills.length > 0 ? (
                            candidate.matched_skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No matched skills returned yet.</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Missing Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {candidate.missing_skills.length > 0 ? (
                            candidate.missing_skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full border border-red-400/15 bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-200"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-green-700">No critical gaps detected.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-white/75">
                        Project: {projectName || 'Unspecified'}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Status: {candidate.status}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Threshold: {minScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
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

function InsightCard({
  title,
  value,
  note,
  tone,
  icon: Icon,
}: {
  title: string;
  value: number;
  note: string;
  tone: 'primary' | 'success' | 'warning';
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClasses =
    tone === 'success'
      ? 'bg-green-50 text-green-700 border-green-100'
      : tone === 'warning'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-sky-50 text-sky-700 border-sky-100';

  return (
    <div className={`rounded-[24px] border p-4 shadow-sm ${toneClasses}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em]">{title}</div>
          <div className="mt-2 text-3xl font-extrabold">{value}</div>
        </div>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm opacity-80">{note}</p>
    </div>
  );
}
