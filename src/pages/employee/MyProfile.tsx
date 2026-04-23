import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Pencil, Sparkles, UserCircle2, FolderKanban, ExternalLink, Briefcase, TrendingUp, Target, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

type EmployeeSkillRow = {
  id: string;
  proficiency: string;
  self_rated: boolean;
  skills?: {
    name?: string;
    category?: string;
  } | null;
};

type AssignedProjectRow = {
  id: string;
  role_in_project?: string | null;
  status?: string | null;
  assigned_at?: string | null;
  projects?: {
    id?: string;
    name?: string;
    description?: string | null;
    status?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
};

type EmployeeProjectRow = {
  id: string;
  name: string;
  description?: string | null;
  technologies?: string[] | null;
  url?: string | null;
  created_at?: string | null;
};

type ShowcaseProject = {
  id: string;
  name: string;
  description: string;
  status: string;
  source: 'Assigned' | 'Portfolio';
  role?: string;
  technologies: string[];
  timeline: string;
  url?: string;
};

export default function MyProfile() {
  const { user, profile } = useAuth();

  const { data: skills, isLoading } = useQuery({
    queryKey: ['employee-skills', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('employee_skills')
        .select('id, proficiency, self_rated, skills(name, category)')
        .eq('employee_id', user.id);
      return (data as EmployeeSkillRow[]) || [];
    },
    enabled: !!user?.id,
  });

  const { data: assignedProjects, isLoading: assignedProjectsLoading } = useQuery({
    queryKey: ['employee-assigned-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('project_assignments')
        .select('id, role_in_project, status, assigned_at, projects(id, name, description, status, start_date, end_date)')
        .eq('employee_id', user.id)
        .order('assigned_at', { ascending: false });
      return (data as AssignedProjectRow[]) || [];
    },
    enabled: !!user?.id,
  });

  const { data: portfolioProjects, isLoading: portfolioProjectsLoading } = useQuery({
    queryKey: ['employee-portfolio-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('employee_projects')
        .select('id, name, description, technologies, url, created_at')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });
      return (data as EmployeeProjectRow[]) || [];
    },
    enabled: !!user?.id,
  });

  const getLevelValue = (level: string) => {
    switch (level) {
      case 'expert': return 100;
      case 'advanced': return 75;
      case 'intermediate': return 50;
      case 'beginner': return 25;
      default: return 0;
    }
  };

  const showcaseProjects: ShowcaseProject[] = [
    ...((portfolioProjects || []).map((project) => ({
      id: `portfolio-${project.id}`,
      name: project.name,
      description: project.description || 'No project description provided.',
      status: 'portfolio',
      source: 'Portfolio' as const,
      role: 'Owner',
      technologies: project.technologies || [],
      timeline: project.created_at ? `Added ${project.created_at.slice(0, 10)}` : 'Timeline TBD',
      url: project.url || undefined,
    }))),
  ];

  const verifiedCount = (skills || []).filter((s) => !s.self_rated).length;
  const selfRatedCount = (skills || []).filter((s) => s.self_rated).length;
  const avgProficiency =
    skills && skills.length > 0
      ? Math.round(skills.reduce((sum, s) => sum + getLevelValue(s.proficiency), 0) / skills.length)
      : 0;

  const firstLetter = profile?.full_name?.charAt(0)?.toUpperCase() || 'E';

  return (
    <div className="space-y-5">

      {/* ── Profile Hero ── */}
      <section className="surface-card relative overflow-hidden rounded-2xl p-6 md:p-8">
        {/* Green gradient strip */}
        <div
          className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, #2d6946, #5aad79, #2d6946)' }}
        />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left — identity */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/25 bg-brand-accent/8 px-4 py-1.5 text-xs font-semibold text-brand-accent mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              Employee Profile
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              {/* Avatar */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-accent text-white text-3xl font-black shadow-md">
                {firstLetter}
              </div>

              <div>
                <h2 className="text-3xl font-black text-brand-textPri tracking-tight">
                  {profile?.full_name || 'Employee Profile'}
                </h2>
                <p className="mt-1.5 text-sm text-brand-textSec">
                  {profile?.job_title || 'Growth-focused contributor'} &middot;{' '}
                  {profile?.department || 'Engineering'} &middot; Joined 2026
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="accent-badge">
                    ✓ {verifiedCount} verified
                  </span>
                  <span className="rounded-full border border-brand-border bg-brand-elevated px-3 py-1 text-xs font-semibold text-brand-textSec">
                    {selfRatedCount} self-rated
                  </span>
                  {(assignedProjects || []).length > 0 && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
                      {assignedProjects!.length} active project{assignedProjects!.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right — metrics */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <ProfileMetric
              icon={<Star className="h-4 w-4" />}
              label="Skill Signals"
              value={`${skills?.length || 0}`}
              detail="Capabilities tracked"
            />
            <ProfileMetric
              icon={<TrendingUp className="h-4 w-4" />}
              label="Avg. Strength"
              value={`${avgProficiency}%`}
              detail="Current competency baseline"
            />
            <ProfileMetric
              icon={<Target className="h-4 w-4" />}
              label="Readiness"
              value={avgProficiency >= 70 ? 'High' : avgProficiency >= 45 ? 'Building' : 'Early'}
              detail="Role fit confidence"
            />
          </div>
        </div>

        {/* Currently Working On */}
        {(assignedProjects || []).length > 0 && (
          <div className="mt-6 pt-6 border-t border-brand-border">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <FolderKanban className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
                Currently Working On
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(assignedProjects || []).map((assignment) => {
                const start = assignment.projects?.start_date;
                const end = assignment.projects?.end_date;
                const timeline =
                  start && end ? `${start} → ${end}` : start ? `Started ${start}` : 'Timeline TBD';
                const projectStatus = assignment.projects?.status || assignment.status || 'active';

                return (
                  <div
                    key={assignment.id}
                    className="group relative overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 transition-all hover:border-emerald-200 dark:border-emerald-900/30 dark:bg-emerald-900/8"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border bg-brand-surface">
                          <Briefcase className="h-4 w-4 text-brand-textSec" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-brand-textPri text-sm">
                            {assignment.projects?.name || 'Assigned Project'}
                          </h4>
                          <span className="text-xs text-brand-textTer">
                            {assignment.role_in_project || 'Contributor'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          projectStatus === 'active' || projectStatus === 'in_progress'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'border border-brand-border bg-brand-surface text-brand-textSec'
                        }`}
                      >
                        {projectStatus === 'in_progress' ? 'Active' : projectStatus}
                      </span>
                    </div>
                    {assignment.projects?.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-brand-textSec">
                        {assignment.projects.description}
                      </p>
                    )}
                    <div className="mt-3 text-xs text-brand-textTer">{timeline}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(assignedProjects || []).length === 0 && !assignedProjectsLoading && (
          <div className="mt-6 pt-6 border-t border-brand-border">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-elevated">
                <FolderKanban className="h-4 w-4 text-brand-textTer" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">
                Currently Working On
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-brand-border bg-brand-elevated p-5 text-center text-sm text-brand-textTer">
              No active project assignments yet. You'll see your projects here once assigned.
            </div>
          </div>
        )}
      </section>

      {/* ── Skills Matrix ── */}
      <section className="surface-card card-float overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer mb-1">Skills Matrix</div>
            <h3 className="text-xl font-bold text-brand-textPri">Verified Skills Ledger</h3>
          </div>
          <span className="accent-badge">{skills?.length || 0} skills</span>
        </div>

        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border" style={{ background: 'rgb(var(--brand-elevated))' }}>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-textTer">Skill</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-textTer">Domain</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-textTer">Level</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-brand-textTer">Validation</th>
              </tr>
            </thead>
            <tbody>
              {(skills || []).map((skill) => (
                <tr key={skill.id} className="border-t border-brand-border transition-colors hover:bg-brand-elevated">
                  <td className="px-6 py-4 font-semibold text-brand-textPri">{skill.skills?.name}</td>
                  <td className="px-6 py-4 text-brand-textSec">{skill.skills?.category}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border border-brand-border bg-brand-elevated px-3 py-1 text-xs font-semibold uppercase text-brand-textSec">
                      {skill.proficiency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {skill.self_rated ? (
                        <span className="rounded-full border border-brand-border bg-brand-elevated px-3 py-1 text-xs font-semibold text-brand-textSec">
                          Self Rated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-brand-accent/25 bg-brand-accent/8 px-3 py-1 text-xs font-semibold text-brand-accent">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                      <button className="rounded-lg border border-brand-border bg-brand-elevated p-1.5 text-brand-textTer transition hover:border-brand-borderHi hover:text-brand-textPri">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-brand-textTer text-sm">
                    Loading profile skills…
                  </td>
                </tr>
              )}
              {!isLoading && (!skills || skills.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-brand-textTer text-sm">
                    No skills recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Portfolio Showcase ── */}
      <section className="surface-card card-float overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer mb-1">Portfolio Showcase</div>
            <h3 className="text-xl font-bold text-brand-textPri">Personal &amp; Side Projects</h3>
          </div>
          <span className="rounded-full border border-brand-border bg-brand-elevated px-3 py-1 text-xs font-semibold text-brand-textSec">
            {showcaseProjects.length} projects
          </span>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {showcaseProjects.map((project) => (
            <article key={project.id} className="surface-elevated card-float rounded-xl p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="accent-badge">{project.source}</span>
                <span className="rounded-full border border-brand-border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-textSec">
                  {project.status}
                </span>
              </div>

              <h4 className="text-base font-bold text-brand-textPri">{project.name}</h4>
              <p className="mt-2 line-clamp-3 text-sm text-brand-textSec leading-6">{project.description}</p>

              <div className="mt-3 space-y-1 text-xs text-brand-textTer">
                <div>Role: {project.role}</div>
                <div>{project.timeline}</div>
              </div>

              {project.technologies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 5).map((tech) => (
                    <span
                      key={`${project.id}-${tech}`}
                      className="rounded-full border border-brand-border px-2.5 py-1 text-xs text-brand-textSec"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline"
                >
                  Open project
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </article>
          ))}

          {portfolioProjectsLoading && (
            <div className="col-span-full rounded-xl border border-dashed border-brand-border bg-brand-elevated p-8 text-center text-sm text-brand-textTer">
              Loading portfolio projects…
            </div>
          )}

          {!portfolioProjectsLoading && showcaseProjects.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-brand-border bg-brand-elevated p-8 text-center text-sm text-brand-textTer">
              No portfolio projects yet. Upload a resume to populate this showcase with your personal and side projects.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

function ProfileMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="surface-elevated rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent">
          {icon}
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer">{label}</div>
      </div>
      <div className="text-2xl font-black text-brand-textPri">{value}</div>
      <div className="mt-1 text-xs text-brand-textSec">{detail}</div>
    </div>
  );
}
