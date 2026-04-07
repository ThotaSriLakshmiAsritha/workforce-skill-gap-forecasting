import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Users, CheckCircle, TrendingUp, BookOpen, CalendarClock, Activity } from 'lucide-react';

const COLORS = ['#00d4aa', '#7c6af7', '#f0a500', '#ff7a59', '#4fd1ff'];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['org-stats'],
    queryFn: async () => {
      const { count: totalEmployees, error: err1 } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'employee');
      if (err1) throw err1;

      const { count: availableCount } = await supabase
        .from('employee_availability')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available');

      const { count: inProjectCount } = await supabase
        .from('employee_availability')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_project');

      const { count: onLeaveCount } = await supabase
        .from('employee_availability')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'on_leave');

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

      const { data: depts } = await supabase.from('profiles').select('department').eq('role', 'employee');
      const deptCounts = depts?.reduce((acc: any, curr) => {
        if (!curr.department) return acc;
        acc[curr.department] = (acc[curr.department] || 0) + 1;
        return acc;
      }, {}) || {};
      const deptData = Object.keys(deptCounts).map((key) => ({ name: key, value: deptCounts[key] })).filter((item) => item.name);

      const { data: employees } = await supabase
        .from('profiles')
        .select('id, full_name, department, job_title')
        .eq('role', 'employee')
        .limit(20);

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
        skillGapIndex: gapIndex,
        trainingCompletion,
        deptData: deptData.length > 0 ? deptData : [],
        employees: employees || [],
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
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">Organization Pulse</div>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em]">Workforce Overview</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/60">
              Live visibility into workforce health, department spread, skill coverage, and the learning momentum behind your delivery pipeline.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Latest Snapshot</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
              <CalendarClock className="h-4 w-4 text-[#f0a500]" />
              Workforce data refreshed for executive review
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Employees" value={stats?.totalEmployees || 0} icon={<Users className="h-5 w-5" />} tone="teal" />
        <MetricCard title="Available Staff" value={stats?.availableCount || 0} icon={<CheckCircle className="h-5 w-5" />} tone="green" />
        <MetricCard title="Skill Gap Index" value={`${stats?.skillGapIndex || 0}%`} icon={<TrendingUp className="h-5 w-5" />} tone="amber" />
        <MetricCard title="Training Completion" value={`${stats?.trainingCompletion || 0}%`} icon={<BookOpen className="h-5 w-5" />} tone="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel card-float rounded-[30px] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00d4aa]">Department Spread</div>
              <h3 className="mt-2 text-2xl font-bold">Team distribution</h3>
            </div>
            <Activity className="h-5 w-5 text-[#00d4aa]" />
          </div>
          <div className="h-[320px]">
            {stats?.deptData && stats.deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.deptData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                    {stats.deptData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#13141c',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-white/45">No department data available</div>
            )}
          </div>
        </section>

        <section className="glass-panel card-float rounded-[30px] p-6">
          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0a500]">Availability Mix</div>
            <h3 className="mt-2 text-2xl font-bold">Bench readiness</h3>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={availabilityData}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#13141c',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#7c6af7" animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0a500]">Skill Gap Grid</div>
            <h3 className="mt-2 text-2xl font-bold">Coverage heatmap</h3>
          </div>
          <div className="text-sm text-white/50">Animated severity view</div>
        </div>
        {stats?.skillGapTiles?.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {stats.skillGapTiles.map((tile: any, index: number) => (
              <div
                key={`${tile.skill_id}-${tile.coverage_percentage}`}
                className={`card-float rounded-[22px] border p-4 text-xs font-medium ${
                  tile.gap_severity === 'critical'
                    ? 'border-red-400/20 bg-red-400/10 text-red-200'
                    : tile.gap_severity === 'moderate'
                    ? 'border-[#f0a500]/20 bg-[#f0a500]/10 text-[#ffd88a]'
                    : 'border-[#00d4aa]/20 bg-[#00d4aa]/10 text-[#88f2dd]'
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="font-semibold">{tile.skills?.name || 'Skill'}</div>
                <div className="mt-2 text-[11px] opacity-80">Coverage: {tile.coverage_percentage || 0}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/45">No snapshots yet. Run the snapshot function to populate this view.</div>
        )}
      </section>

      <section className="glass-panel overflow-hidden rounded-[30px]">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00d4aa]">Roster View</div>
          <h3 className="mt-2 text-2xl font-bold">Employee roster</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-white/55">
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
                  <tr key={employee.id} className="border-t border-white/6 transition hover:bg-white/[0.03]">
                    <td className="px-6 py-4 font-semibold text-white">{employee.full_name}</td>
                    <td className="px-6 py-4 text-white/55">{employee.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-white/70">{employee.job_title || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-white/45">
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
  tone,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone: 'teal' | 'green' | 'amber' | 'violet';
}) {
  const toneClass =
    tone === 'green'
      ? 'from-[#00d4aa]/16 to-[#00d4aa]/4 text-[#93f5e0]'
      : tone === 'amber'
      ? 'from-[#f0a500]/16 to-[#f0a500]/4 text-[#ffd88a]'
      : tone === 'violet'
      ? 'from-[#7c6af7]/16 to-[#7c6af7]/4 text-[#c6bcff]'
      : 'from-[#4fd1ff]/16 to-[#4fd1ff]/4 text-[#9be6ff]';

  return (
    <div className={`card-float rounded-[28px] border border-white/10 bg-gradient-to-br ${toneClass} p-5`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{title}</div>
        <div>{icon}</div>
      </div>
      <div className="mt-5 text-4xl font-black text-white">{value}</div>
    </div>
  );
}
