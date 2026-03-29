import { useState } from 'react';
import employees from '../data/employees.json';
import courses from '../data/courses.json';
import { getRecommendedCourses, calcFutureScore, generateLearningPath } from '../utils/scoreCalculator';
import { Clock, Star, Users, ExternalLink, CheckCircle, Circle } from 'lucide-react';

export default function RecommendationEngine() {
  const [selectedId, setSelectedId] = useState(1);
  const [progress, setProgress] = useState({});

  const employee = employees.find(e => e.id === selectedId);
  const recommended = getRecommendedCourses(employee, courses);
  const learningPath = generateLearningPath(employee, courses);
  const futureScore = calcFutureScore(employee);

  const toggleProgress = (courseId) => {
    setProgress(p => ({ ...p, [courseId]: !p[courseId] }));
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCourses = recommended.length;
  const completionPct = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

  const stageColors = { Beginner: 'green', Intermediate: 'yellow', Advanced: 'red' };
  const stageBg = { green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500' };
  const stageBadge = { green: 'badge-low', yellow: 'badge-medium', red: 'badge-critical' };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">AI Recommendation Engine</h1>
        <p className="section-subtitle">Personalized upskilling pathways powered by skill gap intelligence</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Employee Selector */}
        <div className="xl:col-span-1 space-y-3">
          <h2 className="section-title text-base">Select Employee</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {employees.map(e => (
              <button
                key={e.id}
                onClick={() => { setSelectedId(e.id); setProgress({}); }}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${selectedId === e.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-100 dark:border-gray-700 hover:border-brand-300 bg-white dark:bg-gray-800'}`}
              >
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{e.name}</p>
                <p className="text-xs text-gray-400">{e.role}</p>
                <span className={`text-xs mt-1 inline-block ${e.gapScore >= 65 ? 'badge-critical' : e.gapScore >= 35 ? 'badge-medium' : 'badge-low'}`}>
                  Gap: {e.gapScore}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-3 space-y-5">
          {/* Employee Profile Card */}
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold text-lg">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{employee.name}</h2>
                    <p className="text-sm text-gray-500">{employee.role} · {employee.department} · {employee.experience}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {employee.skills.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
              {/* Future Score Meter */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9155" fill="none"
                      stroke={futureScore >= 70 ? '#10b981' : futureScore >= 40 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3" strokeDasharray={`${futureScore} ${100 - futureScore}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{futureScore}</span>
                    <span className="text-[9px] text-gray-400">Future Score</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Readiness Index</p>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title text-base">Course Progress</h2>
              <span className="text-sm font-semibold text-brand-600">{completedCount}/{totalCourses} completed</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-1">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-accent-teal transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-right">{completionPct}% overall</p>
          </div>

          {/* Recommended Courses */}
          <div>
            <h2 className="section-title text-base mb-3">Recommended Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommended.map(course => {
                const done = progress[course.id];
                return (
                  <div key={course.id} className={`card p-4 hover:shadow-md transition-all duration-200 ${done ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                        course.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>{course.difficulty}</span>
                      <button onClick={() => toggleProgress(course.id)} className="text-brand-500 hover:scale-110 transition-transform">
                        {done ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} />}
                      </button>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 leading-tight">{course.title}</h3>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-2">{course.provider}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={12} />{course.duration}</span>
                      <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400" />{course.rating}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{(course.enrolled / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-lg">{course.skillGained}</span>
                      <a href={course.url} className="text-xs text-brand-500 hover:underline flex items-center gap-1">Enroll <ExternalLink size={10} /></a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning Path Timeline */}
          <div className="card p-5">
            <h2 className="section-title text-base mb-4">Learning Path Timeline</h2>
            <div className="relative">
              {/* Line */}
              <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-6">
                {learningPath.map(({ stage, courses: stageCourses, color }) => (
                  <div key={stage} className="relative flex gap-4">
                    <div className={`w-8 h-8 rounded-full ${stageBg[color]} flex items-center justify-center flex-shrink-0 z-10 text-white text-xs font-bold`}>
                      {stage[0]}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1.5">{stage}</p>
                      {stageCourses.length > 0 ? (
                        <div className="space-y-1.5">
                          {stageCourses.map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                              <span className={stageBadge[color]}>{stage}</span>
                              <span>{c.title}</span>
                              <span className="text-gray-400 ml-auto">{c.duration}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No specific {stage.toLowerCase()} courses identified — ready to advance!</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
