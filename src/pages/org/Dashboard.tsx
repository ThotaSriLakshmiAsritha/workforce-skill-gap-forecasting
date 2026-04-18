import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Users, CheckCircle, TrendingUp, BookOpen, CalendarClock, Activity } from 'lucide-react';

const COLORS = ['#FFFFFF', '#A3A3A3', '#5C5C5C', '#2E2E2E', '#111111'];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['org-stats'],
    queryFn: async () => {
      const { data: employeeProfiles, error: err1 } = await supabase
        .from('profiles')
        .select('id, department, full_name, job_title')
        .eq('role', 'employee');
      if (err1) throw err1;

      const employees = employeeProfiles || [];
      const totalEmployees = employees.length;
      const employeeIds = employees.map((employee) => employee.id);

      const { data: availabilityRows, error: availabilityError } = await supabase
        .from('employee_availability')
        .select('employee_id, status')
        .in('employee_id', employeeIds.length > 0 ? employeeIds : ['00000000-0000-0000-0000-000000000000']);
      if (availabilityError) throw availabilityError;

      const availabilityByEmployee = new Map(
        (availabilityRows || []).map((row) => [row.employee_id, row.status])
      );

      let availableCount = 0;
      let inProjectCount = 0;
      let onLeaveCount = 0;
      let unavailableCount = 0;

      for (const employee of employees) {
        const status = availabilityByEmployee.get(employee.id) || 'available';
        if (status === 'in_project') {
          inProjectCount += 1;
        } else if (status === 'on_leave') {
          onLeaveCount += 1;
        } else if (status === 'unavailable') {
          unavailableCount += 1;
        } else {
          availableCount += 1;
        }
      }

      const { count: totalLearning } = await supabase
        .from('learning_paths')
        .select('*', { count: 'exact', head: true });

      const { count: completedLearning } = await supabase
        .from('learning_paths')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const trainingCompletion = totalLearning && totalLearning > 0
        ? Math.round(((completedLearning || 0) / totalLearning) * 100)
        : 0;

      const deptCounts = employees.reduce((acc: any, curr) => {
        if (!curr.department) return acc;
        acc[curr.department] = (acc[curr.department] || 0) + 1;
        return acc;
      }, {}) || {};
      const deptData = Object.keys(deptCounts).map((key) => ({ name: key, value: deptCounts[key] })).filter((item) => item.name);

      const { data: latestSnapshot } = await supabase
        .from('skill_gap_snapshots')
        .select('snapshot_date')
        .order('snapshot_date', { ascending: false })
        .limit(1);

      let skillGapTiles: any[] = [];
      if (latestSnapshot && latestSnapshot.length > 0) {
        const date = latestSnapshot[0].snapshot_date;
        const { data: gaps } = await supabase
          .from('skill_gap_snapshots')
          .select('skill_id, coverage_percentage, gap_severity, skills(name)')
          .eq('snapshot_date', date)
          .limit(200);
        skillGapTiles = gaps || [];
      }

      const gapIndex = skillGapTiles.length > 0
        ? Math.round((skillGapTiles.filter((gap) => gap.gap_severity === 'critical' || gap.gap_severity === 'moderate').length / skillGapTiles.length) * 100)
        : 0;

      return {
        totalEmployees: totalEmployees || 0,
        availableCount: availableCount || 0,
        inProjectCount: inProjectCount || 0,
        onLeaveCount: onLeaveCount || 0,
        unavailableCount: unavailableCount || 0,
        skillGapIndex: gapIndex,
        trainingCompletion,
        deptData: deptData.length > 0 ? deptData : [],
        employees: employees.slice(0, 20),
        skillGapTiles,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel shimmer h-36 rounded-[30px]" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-panel shimmer h-32 rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  const availabilityData = [
    { name: 'Available', value: stats?.availableCount || 0 },
    { name: 'In Project', value: stats?.inProjectCount || 0 },
    { name: 'On Leave', value: stats?.onLeaveCount || 0 },
    { name: 'Unavailable', value: stats?.unavailableCount || 0 },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-brand-border bg-brand-surface p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-textTer">CONTROL ROOM</div>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em]">Workforce Overview</h2>
            <p className="mt-3 max-w-2xl text-sm text-brand-textSec">
              Live visibility into workforce health, department spread, skill coverage, and the learning momentum behind your delivery pipeline.
            </p>
          </div>
          <div className="rounded-[24px] border border-brand-border bg-brand-elevated px-5 py-4">
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">Latest Snapshot</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-brand-textSec">
              <CalendarClock className="h-4 w-4 text-brand-textPri" />
              Workforce data refreshed for executive review
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Employees" value={stats?.totalEmployees || 0} icon={<Users className="h-5 w-5" />} />
        <MetricCard title="Available Staff" value={stats?.availableCount || 0} icon={<CheckCircle className="h-5 w-5" />} />
        <MetricCard title="Skill Gap Index" value={`${stats?.skillGapIndex || 0}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard title="Training Completion" value={`${stats?.trainingCompletion || 0}%`} icon={<BookOpen className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="card-float min-w-0 rounded-[30px] border border-brand-border bg-brand-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Department Spread</div>
              <h3 className="mt-2 text-2xl font-bold">Team distribution</h3>
            </div>
            <Activity className="h-5 w-5 text-brand-textPri" />
          </div>
          <div className="h-[320px]">
            {stats?.deptData && stats.deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
                <PieChart>
                  <Pie data={stats.deptData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                    {stats.deptData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0A0A0A',
                      border: '1px solid #1F1F1F',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontFamily: 'DM Mono',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-brand-textTer">No department data available</div>
            )}
          </div>
        </section>

        <section className="card-float min-w-0 rounded-[30px] border border-brand-border bg-brand-surface p-6">
          <div className="mb-5">
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Availability Mix</div>
            <h3 className="mt-2 text-2xl font-bold">Bench readiness</h3>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
              <BarChart data={availabilityData}>
                <XAxis dataKey="name" stroke="#1F1F1F" tickLine={false} axisLine={false} tick={{ fill: '#5C5C5C', fontFamily: 'DM Mono' }} />
                <YAxis stroke="#1F1F1F" tickLine={false} axisLine={false} tick={{ fill: '#5C5C5C', fontFamily: 'DM Mono' }} />
                <Tooltip
                  contentStyle={{
                    background: '#0A0A0A',
                    border: '1px solid #1F1F1F',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontFamily: 'DM Mono',
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#FFFFFF" animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card-float rounded-[30px] border border-brand-border bg-brand-surface p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Skill Gap Grid</div>
            <h3 className="mt-2 text-2xl font-bold">Coverage heatmap</h3>
          </div>
          <div className="font-mono text-sm text-brand-textTer">Animated severity view</div>
        </div>
        {stats?.skillGapTiles?.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {stats.skillGapTiles.map((tile: any, index: number) => (
              <div
                key={`${tile.skill_id}-${tile.coverage_percentage}`}
                className={`card-float rounded-[22px] border p-4 text-xs font-medium ${
                  tile.gap_severity === 'critical'
                    ? 'border-brand-borderHi bg-brand-elevated text-brand-textSec'
                    : tile.gap_severity === 'moderate'
                    ? 'border-brand-border bg-brand-textTer/10 text-brand-textSec'
                    : 'border-brand-textPri/20 bg-brand-textPri/10 text-brand-textSec'
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="font-semibold">{tile.skills?.name || 'Skill'}</div>
                <div className="mt-2 text-[11px] opacity-80">Coverage: {tile.coverage_percentage || 0}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-brand-textTer">No snapshots yet. Run the snapshot function to populate this view.</div>
        )}
      </section>

      <section className="overflow-hidden rounded-[30px] border border-brand-border bg-brand-surface">
        <div className="border-b border-brand-border px-6 py-5">
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Roster View</div>
          <h3 className="mt-2 text-2xl font-bold">Employee roster</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-elevated text-brand-textSec">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Job Title</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats?.employees?.length ? (
                stats.employees.map((employee: any) => (
                  <tr key={employee.id} className="border-t border-brand-border transition hover:bg-brand-elevated">
                    <td className="px-6 py-4 font-semibold text-brand-textPri">{employee.full_name}</td>
                    <td className="px-6 py-4 text-brand-textSec">{employee.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-brand-textSec">{employee.job_title || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded border border-brand-border bg-brand-elevated px-4 py-2 font-mono text-xs font-semibold text-brand-textSec transition hover:border-brand-borderHi hover:text-brand-textPri">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-brand-textTer">
                    No employees found. Seed data or add employees to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-float rounded-[28px] border border-brand-border bg-brand-surface p-5 hover:border-brand-borderHi">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-textTer">{title}</div>
        <div className="text-brand-textPri">{icon}</div>
      </div>
      <div className="mt-5 font-display text-4xl font-bold text-brand-textPri">{value}</div>
    </div>
  );
}
