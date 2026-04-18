import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness, CalendarDays, Users, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ProjectMember = {
  id: string;
  full_name: string;
  job_title?: string | null;
  role_in_project?: string | null;
};

type ProjectSkill = {
  id: string;
  name: string;
};

type ProjectCardData = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  team_size: number;
  start_date?: string | null;
  end_date?: string | null;
  members: ProjectMember[];
  skills: ProjectSkill[];
};

const formatDate = (value?: string | null) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function Projects() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-projects'],
    queryFn: async () => {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          status,
          team_size,
          start_date,
          end_date,
          project_assignments(
            project_id,
            role_in_project,
            status,
            employee:profiles!project_assignments_employee_id_fkey(
              id,
              full_name,
              job_title
            )
          ),
          project_skills(
            project_id,
            skill:skills(
              id,
              name
            )
          )
        `)
        .in('status', ['planning', 'active', 'on_hold'])
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      return ((projects as any[]) || [])
        .map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          team_size: project.team_size,
          start_date: project.start_date,
          end_date: project.end_date,
          members: ((project.project_assignments as any[]) || [])
            .filter((assignment) => assignment.status === 'active' && assignment.employee?.id)
            .map((assignment) => ({
              id: assignment.employee.id,
              full_name: assignment.employee.full_name,
              job_title: assignment.employee.job_title,
              role_in_project: assignment.role_in_project,
            })),
          skills: ((project.project_skills as any[]) || [])
            .filter((projectSkill) => projectSkill.skill?.id)
            .map((projectSkill) => ({
              id: projectSkill.skill.id,
              name: projectSkill.skill.name,
            })),
        }))
        .filter((project) => project.members.length > 0) as ProjectCardData[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel shimmer h-36 rounded-[30px]" />
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-panel shimmer h-72 rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-brand-borderHi bg-brand-elevated p-6 text-brand-textPri">
        Unable to load projects right now. Please refresh and try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-brand-border bg-brand-surface p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-textTer">PROJECT DESK</div>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em]">Ongoing Projects</h2>
            <p className="mt-3 max-w-2xl text-sm text-brand-textSec">
              Track live delivery work, see who is assigned, review the required skills, and keep the project brief visible without leaving the control room.
            </p>
          </div>
          <div className="rounded-[24px] border border-brand-border bg-brand-elevated px-5 py-4">
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">Open Initiatives</div>
            <div className="mt-2 text-3xl font-black text-brand-textPri">{data?.length || 0}</div>
          </div>
        </div>
      </section>

      {data && data.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {data.map((project) => (
            <article key={project.id} className="card-float rounded-[30px] border border-brand-border bg-brand-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-elevated px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-textSec">
                    <Sparkles className="h-3.5 w-3.5" />
                    {project.status.replace('_', ' ')}
                  </div>
                  <h3 className="mt-3 text-2xl font-bold">{project.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-brand-textSec">
                    {project.description || 'No project description added yet.'}
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-brand-textSec">
                  <div className="inline-flex items-center gap-2 rounded-[18px] border border-brand-border bg-brand-elevated px-4 py-3">
                    <Users className="h-4 w-4 text-brand-textPri" />
                    {project.members.length}/{project.team_size} members
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-[18px] border border-brand-border bg-brand-elevated px-4 py-3">
                    <CalendarDays className="h-4 w-4 text-brand-textPri" />
                    {formatDate(project.start_date)} - {formatDate(project.end_date)}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[24px] border border-brand-border bg-brand-elevated p-4">
                  <div className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">
                    <BriefcaseBusiness className="h-4 w-4" />
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.skills.length > 0 ? (
                      project.skills.map((skill) => (
                        <span key={skill.id} className="rounded-full border border-brand-borderHi bg-brand-surface px-3 py-1.5 text-xs font-medium text-brand-textPri">
                          {skill.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-brand-textTer">No skills linked yet.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-brand-border bg-brand-elevated p-4">
                  <div className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">
                    <Users className="h-4 w-4" />
                    Members
                  </div>
                  <div className="space-y-3">
                    {project.members.length > 0 ? (
                      project.members.map((member) => (
                        <div key={member.id} className="rounded-[18px] border border-brand-border bg-brand-surface px-4 py-3">
                          <div className="font-semibold text-brand-textPri">{member.full_name}</div>
                          <div className="mt-1 text-sm text-brand-textSec">
                            {member.role_in_project || member.job_title || 'Team Member'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-brand-textTer">No members assigned yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[30px] border border-brand-border bg-brand-surface p-10 text-center text-brand-textSec">
          No allotted projects found yet. Confirm a team from the allocator to see projects here.
        </div>
      )}
    </div>
  );
}
