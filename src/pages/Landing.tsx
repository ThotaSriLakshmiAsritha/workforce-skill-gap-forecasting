import { Link } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, ScanSearch, Sparkles, Target, Users } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const statCards = [
  { value: '94%', label: 'Skill Match Rate' },
  { value: '2.3x', label: 'Faster Staffing Decisions' },
  { value: '128', label: 'Employees Mapped' },
];

const featureCards = [
  {
    icon: BarChart3,
    title: 'Workforce overview',
    text: 'Track department readiness, skill gaps, training progress, and availability in one executive dashboard.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'AI project allocation',
    text: 'Turn project briefs into ranked internal teams, shortage alerts, and external backfill suggestions.',
  },
  {
    icon: ScanSearch,
    title: 'Batch resume screening',
    text: 'Screen groups of resumes against a requirement, rank the strongest profiles, and shortlist quickly.',
  },
  {
    icon: Target,
    title: 'Employee growth paths',
    text: 'Help employees see competency gaps, role goals, and personalized learning roadmaps.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-brand-bg text-brand-textPri">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute right-[-8rem] top-[2rem] h-[28rem] w-[28rem] rounded-full bg-white/6 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[28%] h-[24rem] w-[24rem] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1300px] px-4 pb-16 pt-6 md:px-8">
        <header className="mb-10 flex items-center justify-between border-b border-brand-border bg-brand-bg px-2 py-4 md:px-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-textPri font-mono text-sm font-bold text-brand-bg">
              SS
            </div>
            <div>
              <div className="font-mono text-xs font-medium uppercase tracking-[0.26em] text-brand-textSec">SkillSync</div>
              <div className="text-sm text-brand-textSec">Workforce Intelligence Platform</div>
            </div>
          </Link>
          <div className="hidden items-center gap-3 font-mono text-sm text-brand-textSec md:flex">
            <a href="#features" className="underline-offset-4 transition hover:text-brand-textPri hover:underline">
              Features
            </a>
            <a href="#workflows" className="underline-offset-4 transition hover:text-brand-textPri hover:underline">
              Workflows
            </a>
            <ThemeToggle />
            <Link to="/org/dashboard" className="rounded border border-brand-textPri bg-brand-textPri px-4 py-2 font-mono font-medium text-brand-bg transition hover:bg-brand-bg hover:text-brand-textPri">
              Open Workspace
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 pb-14 pt-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 border border-brand-textPri bg-transparent px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-brand-textPri">
              <Sparkles className="h-3.5 w-3.5" />
              Workforce Intelligence Reimagined
            </div>
            <h1 className="hero-heading mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-[-0.04em] md:text-7xl">
              Elevate Your
              <span className="block text-brand-textPri">
                Workforce Intelligence
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-brand-textSec">
              SkillSync brings together staffing, skills intelligence, resume screening, and employee growth into one premium command center for modern teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/org/dashboard"
                className="inline-flex items-center gap-2 rounded border border-brand-textPri bg-brand-textPri px-6 py-3 font-mono text-sm font-medium text-brand-bg transition hover:bg-brand-bg hover:text-brand-textPri"
              >
                Get Started Free
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/employee/profile"
                className="rounded border border-brand-borderHi bg-transparent px-6 py-3 font-mono text-sm font-medium text-brand-textPri transition hover:bg-brand-elevated"
              >
                Enter Employee Workspace
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {statCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-brand-border bg-brand-surface p-5 transition hover:border-brand-borderHi">
                  <div className="font-display text-4xl font-bold text-brand-textPri">{card.value}</div>
                  <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-textTer">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-white/10 via-transparent to-white/5 blur-3xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-brand-border bg-brand-surface p-6 backdrop-blur-2xl">
              <div className="relative space-y-4">
                <div className="rounded-[28px] border border-brand-border bg-brand-surface p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-brand-textTer">CONTROL ROOM</div>
                      <div className="mt-2 text-2xl font-medium text-brand-textPri">Organization Pulse</div>
                    </div>
                    <Users className="h-10 w-10 text-brand-textPri" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniMetric label="Employees" value="128" />
                    <MiniMetric label="Available" value="81%" />
                    <MiniMetric label="Coverage" value="72%" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[28px] border border-brand-border bg-brand-elevated p-5">
                    <div className="text-sm font-semibold text-white">Project Allocator</div>
                    <div className="mt-3 space-y-3">
                      <div className="rounded-2xl border border-brand-border bg-brand-elevated p-4 text-sm text-brand-textSec">
                        Ranked internal team with shortage detection and upskilling recommendations.
                      </div>
                      <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 text-sm text-brand-textTer">
                        External backfill recommendations appear when bench coverage drops below the threshold.
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-brand-border bg-brand-elevated p-5">
                    <div className="text-sm font-semibold text-white">Learning Path</div>
                    <div className="mt-4 space-y-3">
                      <div className="h-2 rounded-full bg-brand-border">
                        <div className="h-2 w-2/3 rounded-full bg-brand-textPri" />
                      </div>
                      <div className="text-sm text-brand-textSec">Role goal roadmap, skill unlocks, and milestone tracking.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-10">
          <div className="mb-8 max-w-2xl">
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-brand-textSec">Feature Surface</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] md:text-5xl">One platform for planning, hiring, and growth</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => (
              <div key={feature.title} className="rounded-[30px] border border-brand-border bg-brand-surface p-6 backdrop-blur-xl transition hover:translate-y-[-4px] hover:border-brand-borderHi">
                <feature.icon className="h-10 w-10 text-brand-textPri" />
                <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflows" className="py-10">
          <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-white/6 to-white/3 p-7 backdrop-blur-xl md:p-10">
            <div className="max-w-3xl">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-brand-textTer">Core Workflows</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] md:text-5xl">From workforce visibility to skills action</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-elevated p-3">
      <div className="font-mono text-lg font-bold text-brand-textPri">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-textTer">{label}</div>
    </div>
  );
}

function WorkflowStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-brand-border bg-brand-elevated p-6">
      <div className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-brand-textTer">{step}</div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  );
}
