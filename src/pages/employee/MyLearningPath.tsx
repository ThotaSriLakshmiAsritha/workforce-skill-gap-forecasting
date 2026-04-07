import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, PlayCircle, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function MyLearningPath() {
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: courses, refetch } = useQuery({
    queryKey: ['learning-paths', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('learning_paths')
        .select('id, course_name, platform, estimated_hours, status, priority, deadline, url, skills(name), projects(name)')
        .eq('employee_id', user.id)
        .order('priority', { ascending: true });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('learning_paths').update({ status }).eq('id', id);
    refetch();
  };

  const refreshAI = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      await supabase.functions.invoke('generate-learning-path', {
        body: {
          employee_id: user.id,
          target_role: profile?.target_role || null,
        },
      });
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const streakCells = Array.from({ length: 28 }, (_, index) => {
    const course = (courses || [])[index % Math.max((courses || []).length, 1)];
    const intensity = !course
      ? 0
      : course.status === 'completed'
      ? 3
      : course.status === 'in_progress'
      ? 2
      : 1;
    return intensity;
  });

  const completed = (courses || []).filter((course: any) => course.status === 'completed').length;
  const inProgress = (courses || []).filter((course: any) => course.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#00d4aa]">
              <Sparkles className="h-3.5 w-3.5" />
              Career Momentum
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.03em]">My Learning Path</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Personalized courses, milestone pacing, and AI-refreshed recommendations designed around your current role and future growth targets.
            </p>
          </div>
          <button
            onClick={refreshAI}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#7c6af7] px-5 py-3 text-sm font-semibold text-[#0d0e14] transition hover:translate-y-[-1px] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            AI Refresh
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <LearningMetric label="Courses" value={`${courses?.length || 0}`} detail="Learning items in your queue" />
          <LearningMetric label="In Progress" value={`${inProgress}`} detail="Currently active milestones" />
          <LearningMetric label="Completed" value={`${completed}`} detail="Courses already finished" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel card-float rounded-[30px] p-6">
          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0a500]">Completion Streak</div>
            <h3 className="mt-2 text-2xl font-bold">Learning consistency map</h3>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {streakCells.map((intensity, index) => (
              <div
                key={index}
                className={`aspect-square rounded-xl border border-white/5 ${
                  intensity === 3
                    ? 'bg-[#00d4aa]'
                    : intensity === 2
                    ? 'bg-[#7c6af7]'
                    : intensity === 1
                    ? 'bg-[#f0a500]/70'
                    : 'bg-white/5'
                }`}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-white/55">
            A stronger grid means you are turning recommended learning into real skill acquisition over time.
          </p>
        </section>

        <section className="space-y-4">
          {(courses && courses.length > 0) ? courses.map((course: any, index: number) => (
            <div key={course.id} className="glass-panel card-float rounded-[30px] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[#00d4aa]">
                  <span className="text-sm font-black">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{course.platform || 'Platform'}</div>
                      <h3 className="mt-2 text-xl font-bold">{course.course_name}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Skill: {course.skills?.name || 'Skill'}
                        </span>
                        {course.projects?.name && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Project: {course.projects.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {course.priority === 'high' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#f0a500]/20 bg-[#f0a500]/10 px-3 py-1 text-xs font-semibold text-[#f0a500]">
                          <AlertCircle className="h-3.5 w-3.5" />
                          High Priority
                        </span>
                      )}
                      <StatusBadge status={course.status} />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/55">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {course.estimated_hours || 0} hrs
                    </div>
                    {course.deadline && <div>Due {course.deadline}</div>}
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`bar-grow h-full rounded-full ${
                        course.status === 'completed'
                          ? 'w-full bg-[#00d4aa]'
                          : course.status === 'in_progress'
                          ? 'w-2/3 bg-[#7c6af7]'
                          : 'w-1/3 bg-[#f0a500]'
                      }`}
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {course.status !== 'completed' && (
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                        onClick={() => updateStatus(course.id, 'in_progress')}
                      >
                        <BookOpen className="h-4 w-4" />
                        Start
                      </button>
                    )}
                    {course.status === 'in_progress' && (
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-[#00d4aa] px-4 py-2 text-sm font-semibold text-[#0d0e14]"
                        onClick={() => updateStatus(course.id, 'completed')}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="glass-panel rounded-[28px] p-10 text-center text-white/45">
              No learning paths yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LearningMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-2 text-sm text-white/52">{detail}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-3 py-1 text-xs font-semibold text-[#00d4aa]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#7c6af7]/20 bg-[#7c6af7]/10 px-3 py-1 text-xs font-semibold text-[#b7adff]">
        <PlayCircle className="h-3.5 w-3.5" />
        In Progress
      </span>
    );
  }

  return (
    <span className="rounded-full border border-[#f0a500]/20 bg-[#f0a500]/10 px-3 py-1 text-xs font-semibold text-[#f0a500]">
      Recommended
    </span>
  );
}
