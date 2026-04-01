import { Link } from 'react-router-dom';
import { Brain, TrendingUp, Users, BookOpen, BarChart2, ArrowRight, Shield } from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Forecast Skill Gaps',
    desc: 'Model workforce capability drift across 1 to 5 year planning windows with confidence indicators.',
  },
  {
    icon: Users,
    title: 'Analyze Employee Readiness',
    desc: 'Prioritize at-risk talent segments with measurable severity scoring and role-level visibility.',
  },
  {
    icon: BookOpen,
    title: 'Orchestrate Learning Paths',
    desc: 'Deploy tailored upskilling journeys by cohort, role, and strategic capability objective.',
  },
  {
    icon: BarChart2,
    title: 'Align Leadership Decisions',
    desc: 'Deliver board-ready snapshots that connect talent capability to growth strategy and risk.',
  },
];

const stats = [
  { value: '40%', label: 'employees projected to require reskilling by 2027' },
  { value: '85M', label: 'global roles disrupted by automation trends' },
  { value: '97M', label: 'new digitally enabled roles emerging by 2030' },
  { value: '6x', label: 'ROI from targeted enterprise reskilling initiatives' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <nav className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--accent-soft)' }}>
              <Brain size={18} />
            </div>
            <span className="text-lg font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>SkillSync AI</span>
          </div>
          <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
            Enter Platform
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b px-5 py-20 md:px-8" style={{ borderColor: 'var(--border)' }}>
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 20% 30%, #d6d6d6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f1f1f1 0%, transparent 45%)' }} />
        <div className="relative mx-auto max-w-[980px] text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.1em]" style={{ color: 'var(--text-secondary)' }}>Workforce Skill-Gap Intelligence</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl" style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
            Enterprise Skill Intelligence for HR and L&D Leaders
          </h1>
          <p className="mx-auto mt-6 max-w-[760px] text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
            SkillSync AI converts workforce data into actionable capability roadmaps with forecasting, risk prioritization, and learning recommendations designed for executive decision-making.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">View Dashboard <ArrowRight size={14} /></Link>
            <Link to="/forecasting" className="btn-secondary inline-flex items-center gap-2">Run Forecast</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-5 py-12 md:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <article key={item.value} className="card p-5">
              <p className="mono text-3xl" style={{ color: 'var(--accent)' }}>{item.value}</p>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-5 pb-16 md:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="card-kicker">Platform Capabilities</p>
            <h2 className="text-2xl font-semibold">Built for enterprise workforce strategy</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article key={feature.title} className="card card-interactive p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md" style={{ background: 'var(--accent-soft)' }}>
                <feature.icon size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs md:px-8" style={{ color: 'var(--text-secondary)' }}>
          <span className="inline-flex items-center gap-2"><Shield size={13} />SkillSync AI platform</span>
          <span className="mono">2026 enterprise workforce intelligence suite</span>
        </div>
      </footer>
    </div>
  );
}
