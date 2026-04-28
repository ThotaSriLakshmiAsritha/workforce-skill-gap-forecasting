import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Briefcase,
  Code2,
  User,
  GraduationCap,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

type ParseStatus = 'idle' | 'uploading' | 'parsing' | 'done' | 'error';

interface ParseResult {
  skills: number;
  experiences: number;
  projects: number;
  job_title: string | null;
  experience_years: number | null;
  education: string | null;
  summary: string | null;
  extracted_skills: ExtractedSkill[];
  extracted_experiences: ExtractedExperience[];
  extracted_projects: ExtractedProject[];
}

interface ExtractedSkill {
  name: string;
  category: string;
  proficiency: string;
}

interface ExtractedExperience {
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

interface ExtractedProject {
  name: string;
  description: string | null;
  technologies: string[];
  url: string | null;
}

interface ParseRecord {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  extracted_skills: ExtractedSkill[];
  extracted_experiences: ExtractedExperience[];
  extracted_projects: ExtractedProject[];
  extracted_job_title: string | null;
  extracted_experience_years: number | null;
  extracted_education: string | null;
  extracted_summary: string | null;
  error_message: string | null;
}

const PROFICIENCY_COLORS: Record<string, string> = {
  expert: 'border-brand-textPri/40 bg-brand-textPri/15 text-brand-textPri',
  advanced: 'border-green-500/30 bg-green-500/10 text-green-400',
  intermediate: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  beginner: 'border-brand-border bg-brand-elevated text-brand-textSec',
};

const CATEGORY_STYLE: Record<string, { border: string; bg: string; label: string }> = {
  technical: { border: 'border-brand-textPri/25', bg: 'bg-brand-textPri/10', label: 'Technical' },
  soft: { border: 'border-amber-400/25', bg: 'bg-amber-400/10', label: 'Soft Skills' },
  domain: { border: 'border-blue-400/25', bg: 'bg-blue-400/10', label: 'Domain' },
};

export default function EmployeeResumeScreener() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ParseStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [latestParse, setLatestParse] = useState<ParseRecord | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const { data: parseHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['employee-resume-parses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('employee_resume_parses')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) {
        const missingTable = error.message.includes('Could not find the table') || error.code === '42P01';
        if (missingTable) return [];
        throw error;
      }
      return (data || []) as ParseRecord[];
    },
    enabled: !!user?.id,
  });

  const processFile = useCallback(async (file: File) => {
    if (!user?.id) return;

    const allowedTypes = ['application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|docx)$/i)) {
      setError('Please upload a PDF, DOCX, or TXT file.');
      setStatus('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit.');
      setStatus('error');
      return;
    }

    setError(null);
    setResult(null);
    setLatestParse(null);

    // Step 1: Upload to storage
    setStatus('uploading');
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `employee-resumes/${user.id}/${timestamp}-${safeFilename}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, file, { upsert: true });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setStatus('error');
      return;
    }

    // Step 2: Call edge function first.
    // The function creates the employee profile with service-role access before we save parse history.
    setStatus('parsing');
    const { data: fnResult, error: fnError } = await supabase.functions.invoke('parse-employee-resume', {
      body: { storage_path: storagePath },
    });

    if (fnError || fnResult?.error) {
      let errorMessage = fnResult?.error || fnError?.message || 'Parsing failed. Please try again.';

      if (fnError?.context) {
        try {
          const errorBody = await fnError.context.json();
          errorMessage = errorBody?.error || errorBody?.message || errorMessage;
        } catch {
          try {
            const errorText = await fnError.context.text();
            if (errorText) errorMessage = errorText;
          } catch {
            // ignore body parsing failure
          }
        }
      }

      if (String(errorMessage).includes('401') || String(errorMessage).toLowerCase().includes('unauthorized')) {
        setError('Unauthorized request. Please sign out, sign back in, and try again.');
      } else {
        setError(String(errorMessage));
      }
      setStatus('error');
      return;
    }

    setResult(fnResult as ParseResult);

    // Step 3: Save parse history after the parser has already created the profile.
    const parsePayload = {
      employee_id: user.id,
      storage_path: storagePath,
      file_name: file.name,
      extracted_skills: fnResult?.extracted_skills ?? [],
      extracted_experiences: fnResult?.extracted_experiences ?? [],
      extracted_projects: fnResult?.extracted_projects ?? [],
      extracted_job_title: fnResult?.job_title ?? null,
      extracted_experience_years: fnResult?.experience_years ?? null,
      extracted_education: fnResult?.education ?? null,
      extracted_summary: fnResult?.summary ?? null,
      status: 'completed',
    };

    const { data: existingParse } = await supabase
      .from('employee_resume_parses')
      .select('id')
      .eq('employee_id', user.id)
      .eq('storage_path', storagePath)
      .maybeSingle();

    const saveParse = existingParse?.id
      ? supabase
          .from('employee_resume_parses')
          .update(parsePayload)
          .eq('id', existingParse.id)
          .select()
          .single()
      : supabase
          .from('employee_resume_parses')
          .insert(parsePayload)
          .select()
          .single();

    const { data: parseRecord, error: insertError } = await saveParse;

    if (insertError) {
      setError(`Could not save parse history: ${insertError.message}`);
      setStatus('error');
      await queryClient.invalidateQueries({ queryKey: ['employee-resume-parses', user.id] });
      return;
    }

    if (parseRecord) {
      setLatestParse(parseRecord as ParseRecord);
    }

    setStatus('done');
    // Refresh queries
    await queryClient.invalidateQueries({ queryKey: ['employee-resume-parses', user.id] });
    await queryClient.invalidateQueries({ queryKey: ['employee-skills', user.id] });
  }, [user?.id, queryClient]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const groupedSkills = latestParse?.extracted_skills
    ? latestParse.extracted_skills.reduce<Record<string, ExtractedSkill[]>>((acc, skill) => {
        const cat = skill.category || 'technical';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(skill);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="glass-panel overflow-hidden rounded-[32px] p-6 md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-textPri/55 to-transparent" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-textPri/20 bg-brand-textPri/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-textPri">
              <Sparkles className="h-3.5 w-3.5" />
              AI Resume Parser
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.03em]">Resume Screener</h2>
            <p className="mt-2 text-sm text-brand-textSec max-w-xl">
              Upload your resume and our AI will automatically extract your skills, work experience, and projects — instantly populating your profile.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">Powered by</div>
            <div className="text-lg font-bold text-brand-textPri">Groq</div>
            <div className="text-xs text-brand-textSec">Google AI</div>
          </div>
        </div>
      </section>

      {/* Upload / Status area */}
      {status === 'idle' || status === 'error' ? (
        <section className="glass-panel card-float rounded-[30px] p-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[22px] border-2 border-dashed p-12 transition-all ${
              isDragging
                ? 'border-brand-textPri bg-brand-textPri/10'
                : 'border-brand-border bg-brand-elevated hover:border-brand-borderHi hover:bg-brand-surface'
            }`}
          >
            <div className={`flex h-16 w-16 items-center justify-center rounded-[18px] border transition-colors ${
              isDragging ? 'border-brand-textPri bg-brand-textPri/20' : 'border-brand-border bg-brand-surface'
            }`}>
              <Upload className={`h-7 w-7 ${isDragging ? 'text-brand-textPri' : 'text-brand-textSec'}`} />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-brand-textPri">
                {isDragging ? 'Drop it here!' : 'Drop your resume here or click to browse'}
              </div>
              <div className="mt-1 text-sm text-brand-textTer">Supports PDF, DOCX, TXT · Max 10 MB</div>
            </div>
            <div className="flex gap-2">
              {['PDF', 'DOCX', 'TXT'].map((fmt) => (
                <span key={fmt} className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-textSec">
                  {fmt}
                </span>
              ))}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileChange}
          />

          {status === 'error' && error && (
            <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-red-500/25 bg-red-500/10 px-5 py-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <div className="font-semibold text-red-400">Parsing failed</div>
                <div className="mt-1 text-sm text-red-400/80">{error}</div>
              </div>
            </div>
          )}
        </section>
      ) : status === 'uploading' || status === 'parsing' ? (
        <section className="glass-panel card-float rounded-[30px] p-12">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-brand-textPri/30 bg-brand-textPri/10">
              <Loader2 className="h-9 w-9 animate-spin text-brand-textPri" />
            </div>
            <div>
              <div className="text-xl font-bold text-brand-textPri">
                {status === 'uploading' ? 'Uploading your resume...' : 'AI is parsing your resume...'}
              </div>
              <div className="mt-2 text-sm text-brand-textSec">
                {status === 'uploading'
                  ? 'Securely transferring your file'
                  : 'Extracting skills, experiences, and projects'}
              </div>
            </div>
            {status === 'parsing' && (
              <div className="flex gap-2">
                {['Extracting skills', 'Reading experiences', 'Finding projects', 'Updating profile'].map((step, i) => (
                  <span
                    key={step}
                    className="rounded-full border border-brand-border bg-brand-elevated px-3 py-1.5 text-xs font-medium text-brand-textSec animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {step}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Results */}
      {status === 'done' && result && latestParse && (
        <div className="space-y-6">
          {/* Success banner */}
          <div className="flex items-center gap-3 rounded-[20px] border border-brand-textPri/25 bg-brand-textPri/10 px-6 py-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-textPri" />
            <div className="flex-1">
              <span className="font-semibold text-brand-textPri">Resume parsed successfully</span>
              <span className="mx-2 text-brand-textPri/40">·</span>
              <span className="text-sm text-brand-textSec">
                {result.skills} skills · {result.experiences} experiences · {result.projects} projects added to your profile
              </span>
            </div>
            <button
              onClick={() => { setStatus('idle'); setResult(null); setLatestParse(null); }}
              className="rounded-full border border-brand-textPri/25 bg-brand-textPri/10 px-4 py-2 text-xs font-semibold text-brand-textPri transition hover:bg-brand-textPri/20"
            >
              Upload Another
            </button>
          </div>

          {/* Summary card */}
          <section className="glass-panel card-float rounded-[30px] p-6">
            <div className="mb-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Profile Summary</div>
              <h3 className="mt-2 text-2xl font-bold">Extracted Overview</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard icon={User} label="Job Title" value={result.job_title || '—'} />
              <SummaryCard icon={Clock} label="Experience" value={result.experience_years ? `${result.experience_years} years` : '—'} />
              <SummaryCard icon={GraduationCap} label="Education" value={result.education || '—'} />
              <SummaryCard icon={Sparkles} label="Skills Found" value={`${result.skills} skills`} />
            </div>
            {result.summary && (
              <div className="mt-5 rounded-[18px] border border-brand-border bg-brand-elevated p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer mb-2">AI Summary</div>
                <p className="text-sm text-brand-textSec leading-relaxed">{result.summary}</p>
              </div>
            )}
          </section>

          {/* Skills */}
          {Object.keys(groupedSkills).length > 0 && (
            <section className="glass-panel card-float rounded-[30px] p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Skills Extracted</div>
                <h3 className="mt-2 text-2xl font-bold">Your Skill Set</h3>
              </div>
              <div className="space-y-5">
                {Object.entries(groupedSkills).map(([category, skills]) => {
                  const style = CATEGORY_STYLE[category] || CATEGORY_STYLE.technical;
                  return (
                    <div key={category}>
                      <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${style.border} ${style.bg}`}>
                        <Code2 className="h-3 w-3" />
                        {style.label}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <div
                            key={skill.name}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${PROFICIENCY_COLORS[skill.proficiency] || PROFICIENCY_COLORS.beginner}`}
                          >
                            <span>{skill.name}</span>
                            <span className="opacity-60 capitalize">{skill.proficiency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Work Experiences */}
          {latestParse.extracted_experiences && latestParse.extracted_experiences.length > 0 && (
            <section className="glass-panel card-float rounded-[30px] p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Work History</div>
                <h3 className="mt-2 text-2xl font-bold">Experience Timeline</h3>
              </div>
              <div className="space-y-4">
                {latestParse.extracted_experiences.map((exp, i) => (
                  <div key={i} className="relative flex gap-4 rounded-[20px] border border-brand-border bg-brand-elevated p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-brand-border bg-brand-surface">
                      <Briefcase className="h-5 w-5 text-brand-textSec" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-brand-textPri">{exp.role}</div>
                          <div className="text-sm text-brand-textSec">{exp.company}</div>
                        </div>
                        {(exp.start_date || exp.end_date) && (
                          <span className="shrink-0 rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-textTer">
                            {[exp.start_date, exp.end_date].filter(Boolean).join(' – ')}
                          </span>
                        )}
                      </div>
                      {exp.description && (
                        <p className="mt-2 text-sm text-brand-textSec leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {latestParse.extracted_projects && latestParse.extracted_projects.length > 0 && (
            <section className="glass-panel card-float rounded-[30px] p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Projects</div>
                <h3 className="mt-2 text-2xl font-bold">Your Projects</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {latestParse.extracted_projects.map((project, i) => (
                  <div key={i} className="rounded-[20px] border border-brand-border bg-brand-elevated p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-brand-textPri">{project.name}</div>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-xs text-brand-textTer underline hover:text-brand-textPri"
                        >
                          Link
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="mt-2 text-sm text-brand-textSec leading-relaxed line-clamp-3">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 8).map((tech) => (
                          <span key={tech} className="rounded-full border border-brand-border bg-brand-surface px-2.5 py-1 text-xs text-brand-textSec">
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 8 && (
                          <span className="rounded-full border border-brand-border bg-brand-surface px-2.5 py-1 text-xs text-brand-textTer">
                            +{project.technologies.length - 8}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Parse History */}
      {!historyLoading && parseHistory && parseHistory.length > 0 && status !== 'uploading' && status !== 'parsing' && (
        <section className="glass-panel card-float overflow-hidden rounded-[30px]">
          <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">History</div>
              <h3 className="mt-2 text-2xl font-bold">Previous Parses</h3>
            </div>
          </div>
          <div className="divide-y divide-brand-border">
            {parseHistory.map((parse) => (
              <div key={parse.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-brand-textSec" />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-brand-textPri text-sm">{parse.file_name}</div>
                      <div className="text-xs text-brand-textTer">
                        {new Date(parse.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={parse.status} />
                    {parse.status === 'completed' && (
                      <button
                        onClick={() => setExpandedHistory(expandedHistory === parse.id ? null : parse.id)}
                        className="rounded-full border border-brand-border bg-brand-elevated p-1.5 text-brand-textSec hover:border-brand-borderHi hover:text-brand-textPri"
                      >
                        {expandedHistory === parse.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {expandedHistory === parse.id && parse.status === 'completed' && (
                  <div className="mt-4 rounded-[16px] border border-brand-border bg-brand-elevated p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-[12px] border border-brand-border bg-brand-surface p-3">
                        <div className="text-2xl font-black text-brand-textPri">{parse.extracted_skills?.length || 0}</div>
                        <div className="text-xs text-brand-textTer mt-1">Skills</div>
                      </div>
                      <div className="rounded-[12px] border border-brand-border bg-brand-surface p-3">
                        <div className="text-2xl font-black text-brand-textPri">{parse.extracted_experiences?.length || 0}</div>
                        <div className="text-xs text-brand-textTer mt-1">Experiences</div>
                      </div>
                      <div className="rounded-[12px] border border-brand-border bg-brand-surface p-3">
                        <div className="text-2xl font-black text-brand-textPri">{parse.extracted_projects?.length || 0}</div>
                        <div className="text-xs text-brand-textTer mt-1">Projects</div>
                      </div>
                    </div>
                    {parse.extracted_job_title && (
                      <div className="text-sm text-brand-textSec">
                        <span className="text-brand-textTer">Role: </span>{parse.extracted_job_title}
                        {parse.extracted_experience_years && <span className="ml-2 text-brand-textTer">· {parse.extracted_experience_years} yrs exp</span>}
                      </div>
                    )}
                  </div>
                )}

                {parse.status === 'error' && parse.error_message && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    {parse.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-brand-border bg-brand-elevated p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-base font-bold text-brand-textPri line-clamp-2">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { cls: string; label: string }> = {
    completed: { cls: 'border-brand-textPri/25 bg-brand-textPri/10 text-brand-textPri', label: 'Completed' },
    processing: { cls: 'border-blue-400/25 bg-blue-400/10 text-blue-300', label: 'Processing' },
    pending: { cls: 'border-brand-border bg-brand-elevated text-brand-textSec', label: 'Pending' },
    error: { cls: 'border-red-500/25 bg-red-500/10 text-red-400', label: 'Failed' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
  );
}
