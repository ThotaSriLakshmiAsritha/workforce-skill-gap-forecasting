import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import {
  Users, CheckCircle, TrendingUp, BookOpen,
  CalendarClock, Activity, AlertCircle, Clock,
} from 'lucide-react';

const CHART_COLORS_LIGHT = ['#2d6946', '#3d8a5c', '#5aad79', '#85c99a', '#b8e0c8'];

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

      const trainingCompletion =
        totalLearning && totalLearning > 0
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

      const gapIndex =
        skillGapTiles.length > 0
          ? Math.round(
              (skillGapTiles.filter(
                (gap) => gap.gap_severity === 'critical' || gap.gap_severity === 'moderate'
              ).length /
                skillGapTiles.length) *
                100
            )
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
      <div className="space-y-5">
        {/* Hero skeleton */}
        <div className="shimmer h-52 rounded-2xl" />
        {/* Cards skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-28 rounded-2xl" />
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="shimmer h-80 rounded-2xl" />
          <div className="shimmer h-80 rounded-2xl" />
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

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, '. ');

  return (
    <div className="space-y-5">

      {/* ── Hero Section ── */}
      <section
        className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface"
        style={{ minHeight: '200px' }}
      >
        {/* Green blob accent */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 overflow-hidden">
          <div
            className="blob-orb absolute right-[-60px] top-[-60px] h-[320px] w-[320px]"
            style={{
              background:
                'radial-gradient(circle at 40% 40%, rgba(45,105,70,0.50) 0%, rgba(72,160,100,0.30) 45%, rgba(100,200,140,0.10) 70%, transparent 100%)',
              borderRadius: '42% 58% 53% 47% / 44% 42% 58% 56%',
            }}
          />
        </div>

        <div className="relative z-10 p-8 md:p-10">
          <h1 className="text-5xl font-black tracking-tight text-brand-textPri leading-[1.1] md:text-6xl">
            Workforce<br />Overview
          </h1>
          <p className="mt-3 max-w-xl text-base text-brand-textSec leading-7">
            Live visibility into workforce health, skill coverage, and the learning momentum behind your delivery pipeline.
          </p>

          {/* Date + filter chips */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-elevated px-4 py-2 text-sm font-semibold text-brand-textSec">
              <CalendarClock className="h-4 w-4 text-brand-accent" />
              {today}
            </span>
            <span className="rounded-full border border-brand-accent/25 bg-brand-accent/8 px-4 py-2 text-sm font-semibold text-brand-accent">
              Live Data
            </span>
            <span className="rounded-full border border-brand-border bg-brand-elevated px-4 py-2 text-sm font-semibold text-brand-textSec">
              All Departments ↓
            </span>
          </div>
        </div>
      </section>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          subtitle="Workforce headcount"
          icon={<Users className="h-5 w-5" />}
          color="accent"
        />
        <MetricCard
          title="Available Staff"
          value={stats?.availableCount || 0}
          subtitle="Ready for assignment"
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Skill Gap Index"
          value={`${stats?.skillGapIndex || 0}%`}
          subtitle="Skills below threshold"
          icon={<TrendingUp className="h-5 w-5" />}
          color="amber"
        />
        <MetricCard
          title="Training Completion"
          value={`${stats?.trainingCompletion || 0}%`}
          subtitle="Learning path progress"
          icon={<BookOpen className="h-5 w-5" />}
          color="accent"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Department Spread */}
        <section className="surface-card card-float rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer mb-1">Department Spread</div>
              <h3 className="text-xl font-bold text-brand-textPri">Team distribution</h3>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent/10">
              <Activity className="h-4 w-4 text-brand-accent" />
            </div>
          </div>
          <div className="h-[300px]">
            {stats?.deptData && stats.deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
                <PieChart>
                  <Pie
                    data={stats.deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.deptData.map((_entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS_LIGHT[index % CHART_COLORS_LIGHT.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e0e4e0',
                      borderRadius: '12px',
                      color: '#111811',
                      fontFamily: 'Inter',
                      fontSize: '13px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-brand-textTer">
                No department data available
              </div>
            )}
          </div>
        </section>

        {/* Availability Mix */}
        <section className="surface-card card-float rounded-2xl p-6">
          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer mb-1">Availability Mix</div>
            <h3 className="text-xl font-bold text-brand-textPri">Bench readiness</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={availabilityData} barCategoryGap="30%">
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#82948A', fontFamily: 'Inter', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#82948A', fontFamily: 'Inter', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e0e4e0',
                    borderRadius: '12px',
                    color: '#111811',
                    fontFamily: 'Inter',
                    fontSize: '13px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  }}
                  cursor={{ fill: 'rgba(45,105,70,0.06)' }}
                />
                <Bar
                  dataKey="value"
                  radius={[10, 10, 0, 0]}
                  fill="#2d6946"
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* ── Skill Gap Grid ── */}
      {stats?.skillGapTiles?.length ? (
        <section className="surface-card rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer mb-1">Skill Gap Grid</div>
              <h3 className="text-xl font-bold text-brand-textPri">Coverage heatmap</h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-brand-textTer">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80 inline-block" /> Critical
              </span>
              <span className="flex items-center gap-1.5 text-brand-textTer">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 inline-block" /> Moderate
              </span>
              <span className="flex items-center gap-1.5 text-brand-textTer">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-accent/60 inline-block" /> Healthy
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {stats.skillGapTiles.map((tile: any, index: number) => (
              <div
                key={`${tile.skill_id}-${tile.coverage_percentage}`}
                className={`card-float rounded-xl border p-4 text-xs font-medium cursor-default ${
                  tile.gap_severity === 'critical'
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400'
                    : tile.gap_severity === 'moderate'
                    ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-400'
                    : 'border-brand-accent/20 bg-brand-accent/6 text-brand-accent'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="font-semibold truncate">{tile.skills?.name || 'Skill'}</div>
                <div className="mt-2 opacity-80">
                  {tile.coverage_percentage || 0}% coverage
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Employee Roster ── */}
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer mb-1">Roster View</div>
            <h3 className="text-xl font-bold text-brand-textPri">Employee roster</h3>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-elevated">
            <Users className="h-4 w-4 text-brand-textSec" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border" style={{ background: 'rgb(var(--brand-elevated))' }}>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-textTer">Name</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-textTer">Department</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-textTer">Job Title</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-brand-textTer">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats?.employees?.length ? (
                stats.employees.map((employee: any) => (
                  <tr
                    key={employee.id}
                    className="border-t border-brand-border transition-colors hover:bg-brand-elevated"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10 text-xs font-bold text-brand-accent">
                          {employee.full_name?.charAt(0) || 'E'}
                        </div>
                        <span className="font-semibold text-brand-textPri">{employee.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-brand-textSec">{employee.department || '—'}</td>
                    <td className="px-6 py-4 text-brand-textSec">{employee.job_title || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg border border-brand-border bg-brand-elevated px-3 py-1.5 text-xs font-semibold text-brand-textSec transition hover:border-brand-borderHi hover:text-brand-textPri">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-brand-textTer">
                      <AlertCircle className="h-8 w-8 opacity-40" />
                      <span className="text-sm">No employees found. Seed data or add employees to get started.</span>
                    </div>
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
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'accent' | 'green' | 'amber';
}) {
  const colorMap = {
    accent: 'bg-brand-accent/10 text-brand-accent',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <div className="surface-card card-float rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer">{title}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-4xl font-black text-brand-textPri">{value}</div>
      <div className="mt-1 text-xs text-brand-textTer">{subtitle}</div>
    </div>
  );
}
