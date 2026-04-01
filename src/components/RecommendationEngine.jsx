import { useState } from 'react';
import employees from '../data/employees.json';
import courses from '../data/courses.json';
import { getRecommendedCourses, calcFutureScore, generateLearningPath } from '../utils/scoreCalculator';
import { Clock, Star, Users, ExternalLink, CheckCircle, Circle } from 'lucide-react';

const stageBadge = {
  Beginner: 'badge-low',
  Intermediate: 'badge-medium',
  Advanced: 'badge-critical',
};

export default function RecommendationEngine() {
  const [selectedId, setSelectedId] = useState(1);
  const [progress, setProgress] = useState({});

  const employee = employees.find((e) => e.id === selectedId);
  const recommended = getRecommendedCourses(employee, courses);
  const learningPath = generateLearningPath(employee, courses);
  const futureScore = calcFutureScore(employee);

  const toggleProgress = (courseId) => {
    setProgress((p) => ({ ...p, [courseId]: !p[courseId] }));
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCourses = recommended.length;
  const completionPct = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

  return (
    <div className="page-shell animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recommendation Engine</h1>
          <p className="page-subtitle">Personalized learning pathways aligned with projected role and skill trajectories.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="card xl:col-span-3">
          <p className="card-kicker mb-3">Employee Directory</p>
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {employees.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  setSelectedId(e.id);
                  setProgress({});
                }}
                className="w-full rounded-md border px-3 py-3 text-left transition-all duration-150"
                style={{
                  borderColor: selectedId === e.id ? 'var(--accent)' : 'var(--border)',
                  background: selectedId === e.id ? 'var(--accent-soft)' : 'var(--bg-surface)',
                }}
              >
                <p className="text-sm font-medium">{e.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{e.role}</p>
                <p className="mono mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Gap {e.gapScore}%</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-5 xl:col-span-9">
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="card-kicker">Selected Employee</p>
                <h2 className="text-xl font-semibold">{employee.name}</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{employee.role} · {employee.department} · {employee.experience}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {employee.skills.map((s) => (
                    <span key={s} className="rounded px-2 py-0.5 text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <p className="card-kicker">Future Readiness</p>
                <div className="relative mt-2 h-24 w-24">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#22262F" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke={futureScore >= 70 ? 'var(--success)' : futureScore >= 40 ? 'var(--warning)' : 'var(--danger)'}
                      strokeWidth="3"
                      strokeDasharray={`${futureScore} ${100 - futureScore}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center mono text-lg">{futureScore}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="card-kicker">Progress Overview</p>
                <h3 className="text-base font-semibold">Learning Completion</h3>
              </div>
              <p className="mono text-sm" style={{ color: 'var(--text-secondary)' }}>{completedCount}/{totalCourses}</p>
            </div>
            <div className="h-3 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-3 rounded-full transition-all duration-150" style={{ width: `${completionPct}%`, background: 'var(--accent)' }} />
            </div>
          </div>

          <div className="card">
            <p className="card-kicker mb-3">Learning Path</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {learningPath.map((stage, index) => (
                <div key={stage.stage} className="rounded-md border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <p className="mono text-xs" style={{ color: 'var(--text-muted)' }}>Step {index + 1}</p>
                  <h4 className="mt-1 text-sm font-semibold">{stage.stage}</h4>
                  <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {stage.courses.length > 0 ? `${stage.courses.length} recommended courses` : 'No courses required'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="card-kicker mb-2">Courses</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recommended.map((course) => {
                const done = progress[course.id];
                return (
                  <div key={course.id} className="card card-interactive p-4">
                    <div className="mb-3 h-24 w-full rounded-md" style={{ background: 'linear-gradient(135deg, #d9d9d9 0%, #f5f5f5 100%)' }} />
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={`status-pill ${stageBadge[course.difficulty] || 'badge-medium'}`}>{course.difficulty}</span>
                      <button onClick={() => toggleProgress(course.id)} className="btn-ghost p-1">
                        {done ? <CheckCircle size={18} style={{ color: 'var(--success)' }} /> : <Circle size={18} style={{ color: 'var(--text-secondary)' }} />}
                      </button>
                    </div>
                    <h3 className="text-sm font-semibold leading-snug">{course.title}</h3>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{course.provider}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="inline-flex items-center gap-1"><Clock size={12} />{course.duration}</span>
                      <span className="inline-flex items-center gap-1"><Star size={12} />{course.rating}</span>
                      <span className="inline-flex items-center gap-1"><Users size={12} />{(course.enrolled / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full px-2 py-1 text-[11px]" style={{ background: 'var(--accent-soft)', color: 'var(--text-primary)' }}>{course.skillGained}</span>
                      <a href={course.url} className="btn-ghost inline-flex items-center gap-1 px-0">
                        Open
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
