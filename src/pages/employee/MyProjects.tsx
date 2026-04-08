import { useQuery } from '@tanstack/react-query';
import { Calendar, Sparkles, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function MyProjects() {
  const { user } = useAuth();

  const { data: assignments } = useQuery({
    queryKey: ['my-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('project_assignments')
        .select('status, role_in_project, assigned_at, projects(name, description, start_date, end_date, team_size)')
        .eq('employee_id', user.id)
        .order('assigned_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const current = assignments?.find((assignment: any) => assignment.status === 'active');
  const past = (assignments || []).filter((assignment: any) => assignment.status !== 'active');
  const currentProject = Array.isArray(current?.projects) ? current?.projects[0] : current?.projects;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-textPri/20 bg-brand-textPri/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-textPri">
              <Sparkles className="h-3.5 w-3.5" />
              Delivery Portfolio
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.03em]">My Projects</h2>
            <p className="mt-2 max-w-2xl text-sm text-brand-textSec">
              Follow your current assignment, see where your time is invested, and keep a clean timeline of the projects shaping your growth.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel card-float overflow-hidden rounded-[32px] p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textPri">Current Assignment</div>
            <h3 className="mt-2 text-2xl font-bold">Active workstream</h3>
          </div>
          <div className="rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-xs font-semibold text-brand-textSec">
            {current ? 'Live Project' : 'Unassigned'}
          </div>
        </div>

        {current ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-brand-textPri/18 bg-brand-textPri/10 p-6">
              <h4 className="text-3xl font-black tracking-[-0.03em] text-brand-textPri">{currentProject?.name}</h4>
              <p className="mt-2 text-sm font-semibold text-brand-textPri">{current.role_in_project || 'Team Member'}</p>

              <div className="mt-6 flex flex-wrap gap-4 text-sm text-brand-textSec">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-textTer" />
                  {currentProject?.start_date} - {currentProject?.end_date}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-textSec" />
                  Team of {currentProject?.team_size || 0}
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-brand-border">
                <div className="bar-grow h-full w-2/3 rounded-full bg-brand-textPri" />
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">Project Overview</div>
                <p className="mt-3 text-sm leading-7 text-brand-textSec">{currentProject?.description}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ProjectMetric label="Project Status" value="Active" detail="Currently assigned and delivering" />
              <ProjectMetric label="Role Focus" value={current.role_in_project || 'Team Member'} detail="Primary contribution lane" />
              <ProjectMetric label="Timeline" value={currentProject?.end_date || 'TBD'} detail="Projected completion date" />
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-brand-border bg-brand-surface p-10 text-center text-brand-textTer">
            You have no active assignments right now.
          </div>
        )}
      </section>

      <section className="glass-panel overflow-hidden rounded-[32px]">
        <div className="border-b border-brand-border px-6 py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Project History</div>
          <h3 className="mt-2 text-2xl font-bold">Past engagements</h3>
        </div>
        <div className="space-y-4 p-6">
          {past.length > 0 ? (
            past.map((assignment: any, index: number) => {
              const project = Array.isArray(assignment.projects) ? assignment.projects[0] : assignment.projects;
              return (
                <div key={index} className="card-float rounded-[26px] border border-brand-border bg-brand-surface p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-xl font-bold">{project?.name}</h4>
                      <p className="mt-2 text-sm font-semibold text-brand-textSec">{assignment.role_in_project || 'Team Member'}</p>
                      <p className="mt-3 text-sm leading-7 text-brand-textSec">{project?.description}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-xs font-semibold text-brand-textSec">
                      <Calendar className="h-4 w-4 text-brand-textTer" />
                      {project?.start_date} - {project?.end_date}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[26px] border border-dashed border-brand-border bg-brand-surface p-10 text-center text-brand-textTer">
              No past projects yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProjectMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-brand-border bg-brand-surface p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
      <div className="mt-2 text-sm text-brand-textSec">{detail}</div>
    </div>
  );
}
