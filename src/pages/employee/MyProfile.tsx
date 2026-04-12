import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Pencil, Sparkles, UserCircle2 } from 'lucide-react';
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
      case 'expert':
        return 100;
      case 'advanced':
        return 75;
      case 'intermediate':
        return 50;
      case 'beginner':
        return 25;
      default:
        return 0;
    }
  };

  const showcaseProjects: ShowcaseProject[] = [
    ...((assignedProjects || []).map((assignment) => {
      const start = assignment.projects?.start_date;
      const end = assignment.projects?.end_date;
      const timeline = start && end
        ? `${start} -> ${end}`
        : start
          ? `Started ${start}`
          : 'Timeline TBD';

      return {
        id: `assigned-${assignment.id}`,
        name: assignment.projects?.name || 'Assigned Project',
        description: assignment.projects?.description || 'No project description provided.',
        status: assignment.projects?.status || assignment.status || 'active',
        source: 'Assigned' as const,
        role: assignment.role_in_project || 'Contributor',
        technologies: [],
        timeline,
      };
    })),
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

  const verifiedCount = (skills || []).filter((skill) => !skill.self_rated).length;
  const selfRatedCount = (skills || []).filter((skill) => skill.self_rated).length;
  const avgProficiency = skills && skills.length > 0
    ? Math.round(skills.reduce((sum, skill) => sum + getLevelValue(skill.proficiency), 0) / skills.length)
    : 0;

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden rounded-[32px] p-6 md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-textPri/55 to-transparent" />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-textPri/20 bg-brand-textPri/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-textPri">
              <Sparkles className="h-3.5 w-3.5" />
              Employee Identity
            </div>
            <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-brand-border bg-brand-elevated text-brand-textPri">
                <UserCircle2 className="h-14 w-14" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-[-0.03em]">{profile?.full_name || 'Employee Profile'}</h2>
                <p className="mt-2 text-sm text-brand-textSec">
                  {profile?.job_title || 'Growth-focused contributor'} · {profile?.department || 'Engineering'} · Joined 2026
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-brand-textPri/25 bg-brand-textPri/10 px-3 py-1.5 text-xs font-semibold text-brand-textPri">
                    Verified skills: {verifiedCount}
                  </span>
                  <span className="rounded-full border border-brand-border bg-brand-elevated px-3 py-1.5 text-xs font-semibold text-brand-textSec">
                    Self-rated skills: {selfRatedCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <ProfileMetric label="Skill Signals" value={`${skills?.length || 0}`} detail="Capabilities tracked" />
            <ProfileMetric label="Average Strength" value={`${avgProficiency}%`} detail="Current competency baseline" />
            <ProfileMetric label="Readiness" value={avgProficiency >= 70 ? 'High' : avgProficiency >= 45 ? 'Building' : 'Early'} detail="Current role fit confidence" />
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        <section className="glass-panel card-float overflow-hidden rounded-[30px]">
          <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Skills Matrix</div>
              <h3 className="mt-2 text-2xl font-bold">Verified Skills Ledger</h3>
            </div>
          </div>

          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-elevated text-brand-textSec">
                <tr>
                  <th className="px-6 py-4 font-medium">Skill</th>
                  <th className="px-6 py-4 font-medium">Domain</th>
                  <th className="px-6 py-4 font-medium">Level</th>
                  <th className="px-6 py-4 text-right font-medium">Validation</th>
                </tr>
              </thead>
              <tbody>
                {(skills || []).map((skill) => (
                  <tr key={skill.id} className="border-t border-brand-border transition hover:bg-brand-elevated">
                    <td className="px-6 py-4 font-semibold text-brand-textPri">{skill.skills?.name}</td>
                    <td className="px-6 py-4 text-brand-textSec">{skill.skills?.category}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-brand-border bg-brand-elevated px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-textSec">
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
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand-textPri/20 bg-brand-textPri/10 px-3 py-1 text-xs font-semibold text-brand-textPri">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        )}
                        <button className="rounded-full border border-brand-border bg-brand-elevated p-2 text-brand-textTer transition hover:border-brand-borderHi hover:text-brand-textPri">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-brand-textTer">
                      Loading profile skills...
                    </td>
                  </tr>
                )}
                {!isLoading && (!skills || skills.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-brand-textTer">
                      No skills recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="glass-panel card-float overflow-hidden rounded-[30px]">
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Project Showcase</div>
            <h3 className="mt-2 text-2xl font-bold">All Skills & Projects in Action</h3>
          </div>
          <div className="rounded-full border border-brand-border bg-brand-elevated px-3 py-1 text-xs font-semibold text-brand-textSec">
            Total Projects: {showcaseProjects.length}
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {showcaseProjects.map((project) => (
            <article key={project.id} className="rounded-[24px] border border-brand-border bg-brand-elevated p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full border border-brand-textPri/25 bg-brand-textPri/10 px-2.5 py-1 text-xs font-semibold text-brand-textPri">
                  {project.source}
                </span>
                <span className="rounded-full border border-brand-border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-textSec">
                  {project.status}
                </span>
              </div>

              <h4 className="text-lg font-bold text-brand-textPri">{project.name}</h4>
              <p className="mt-2 line-clamp-3 text-sm text-brand-textSec">{project.description}</p>

              <div className="mt-4 space-y-2 text-xs text-brand-textTer">
                <div>Role: {project.role}</div>
                <div>{project.timeline}</div>
              </div>

              {project.technologies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.technologies.slice(0, 5).map((tech) => (
                    <span key={`${project.id}-${tech}`} className="rounded-full border border-brand-border px-2.5 py-1 text-xs text-brand-textSec">
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
                  className="mt-4 inline-flex text-sm font-semibold text-brand-textPri hover:underline"
                >
                  Open project link
                </a>
              )}
            </article>
          ))}

          {(assignedProjectsLoading || portfolioProjectsLoading) && (
            <div className="col-span-full rounded-[24px] border border-dashed border-brand-border bg-brand-elevated p-8 text-center text-sm text-brand-textTer">
              Loading project showcase...
            </div>
          )}

          {!assignedProjectsLoading && !portfolioProjectsLoading && showcaseProjects.length === 0 && (
            <div className="col-span-full rounded-[24px] border border-dashed border-brand-border bg-brand-elevated p-8 text-center text-sm text-brand-textTer">
              No projects available yet. Upload a resume or get assigned to a project to populate this showcase.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProfileMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-brand-border bg-brand-elevated p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">{label}</div>
      <div className="mt-2 text-3xl font-black text-brand-textPri">{value}</div>
      <div className="mt-2 text-sm text-brand-textSec">{detail}</div>
    </div>
  );
}
