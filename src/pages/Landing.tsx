import { Link } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, ScanSearch, Sparkles, Target, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const statCards = [
  { value: '94%', label: 'Skill Match Rate', icon: TrendingUp },
  { value: '2.3×', label: 'Faster Staffing', icon: CheckCircle },
  { value: '128', label: 'Employees Mapped', icon: Users },
];

const featureCards = [
  {
    icon: BarChart3,
    title: 'Workforce Overview',
    text: 'Track department readiness, skill gaps, training progress, and availability in one executive dashboard.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'AI Project Allocation',
    text: 'Turn project briefs into ranked internal teams, shortage alerts, and external backfill suggestions.',
  },
  {
    icon: ScanSearch,
    title: 'Resume Screening',
    text: 'Screen groups of resumes against a requirement, rank the strongest profiles, and shortlist quickly.',
  },
  {
    icon: Target,
    title: 'Employee Growth Paths',
    text: 'Help employees see competency gaps, role goals, and personalized learning roadmaps.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'rgb(var(--brand-bg))' }}>
      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 border-b border-brand-border bg-brand-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-4 px-5 py-3.5 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent font-bold text-sm text-white">
              SS
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-textTer">SkillSync</div>
              <div className="text-sm font-bold text-brand-textPri leading-tight">Workforce Intelligence</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-textSec hover:bg-brand-elevated hover:text-brand-textPri transition-all">
              Features
            </a>
            <a href="#workflows" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-textSec hover:bg-brand-elevated hover:text-brand-textPri transition-all">
              Workflows
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-xl border border-brand-border bg-brand-elevated px-4 py-2 text-sm font-semibold text-brand-textSec hover:border-brand-borderHi hover:text-brand-textPri transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/org/dashboard"
              className="btn-accent hidden md:inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Open Workspace
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-[1300px] px-4 pb-20 pt-8 md:px-8">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden rounded-[28px] border border-brand-border bg-brand-surface px-8 py-14 md:py-20 md:px-14 mb-6">
          {/* Abstract blob background */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 overflow-hidden rounded-r-[28px]">
            <div
              className="blob-orb absolute right-[-80px] top-[-80px] h-[420px] w-[420px]"
              style={{
                background: 'radial-gradient(circle at 40% 40%, rgba(45,105,70,0.55) 0%, rgba(72,160,100,0.35) 40%, rgba(100,200,140,0.15) 70%, transparent 100%)',
                borderRadius: '42% 58% 53% 47% / 44% 42% 58% 56%',
              }}
            />
            <div
              className="absolute right-[60px] top-[80px] h-[280px] w-[280px] opacity-60"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(45,105,70,0.3) 0%, transparent 70%)',
                borderRadius: '50% 50% 61% 39% / 54% 37% 63% 46%',
                filter: 'blur(30px)',
              }}
            />
          </div>

          <div className="relative z-10 max-w-[580px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/25 bg-brand-accent/8 px-4 py-1.5 text-xs font-semibold text-brand-accent mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Workforce Intelligence Reimagined
            </div>
            <h1 className="text-5xl font-black tracking-tight text-brand-textPri leading-[1.1] md:text-7xl">
              Elevate Your
              <span className="block text-brand-accent">Workforce</span>
              Intelligence
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-brand-textSec">
              SkillSync brings staffing, skills intelligence, resume screening, and employee growth into one premium command center for modern teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/org/dashboard"
                className="btn-accent inline-flex items-center gap-2"
              >
                Get Started Free
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/employee/profile"
                className="btn-ghost inline-flex items-center gap-2"
              >
                Employee Workspace
              </Link>
            </div>
          </div>

          {/* Date pills like in reference */}
          <div className="absolute bottom-6 right-8 hidden md:flex items-center gap-2">
            <span className="rounded-full border border-brand-border bg-brand-elevated px-4 py-2 text-xs font-semibold text-brand-textSec shadow-card">
              Live Dashboard
            </span>
            <span className="rounded-full border border-brand-accent/25 bg-brand-accent/8 px-4 py-2 text-xs font-semibold text-brand-accent shadow-card">
              AI-Powered
            </span>
          </div>
        </section>

        {/* ── Stat Cards ── */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {statCards.map((card) => (
            <div key={card.label} className="surface-card card-float rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer">{card.label}</div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/10">
                  <card.icon className="h-4 w-4 text-brand-accent" />
                </div>
              </div>
              <div className="text-4xl font-black text-brand-textPri">{card.value}</div>
            </div>
          ))}
        </div>

        {/* ── Feature Cards ── */}
        <section id="features" className="py-10">
          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-textTer mb-2">Feature Surface</div>
            <h2 className="text-3xl font-black text-brand-textPri md:text-4xl">
              One platform for planning, hiring, and growth
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="surface-card card-float rounded-2xl p-6 group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent/10 mb-5 group-hover:bg-brand-accent/18 transition-colors">
                  <feature.icon className="h-5 w-5 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold text-brand-textPri">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-brand-textSec">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Workflows ── */}
        <section id="workflows" className="py-6">
          <div
            className="rounded-[28px] border border-brand-accent/15 p-8 md:p-12"
            style={{ background: 'linear-gradient(135deg, rgba(45,105,70,0.06) 0%, rgba(45,105,70,0.02) 100%)' }}
          >
            <div className="max-w-xl mb-10">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-textTer mb-2">Core Workflows</div>
              <h2 className="text-3xl font-black text-brand-textPri md:text-4xl">
                From workforce visibility to skills action
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <WorkflowStep
                step="01"
                title="See live workforce health"
                text="Monitor availability, capability coverage, training completion, and roster readiness."
              />
              <WorkflowStep
                step="02"
                title="Staff projects intelligently"
                text="Match internal talent first, surface shortages, and backfill gaps with screened candidates."
              />
              <WorkflowStep
                step="03"
                title="Grow employees continuously"
                text="Translate skill gaps into learning plans, target roles, and measurable progress milestones."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function WorkflowStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="surface-card rounded-2xl p-6">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/10 text-xs font-black text-brand-accent mb-4">
        {step}
      </div>
      <h3 className="text-lg font-bold text-brand-textPri">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-brand-textSec">{text}</p>
    </div>
  );
}
