import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BriefcaseBusiness, ScanSearch, Sparkles, Target, Users } from 'lucide-react';

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
    <div className="min-h-screen overflow-hidden bg-[#0d0e14] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#f0a500]/14 blur-3xl" />
        <div className="absolute right-[-8rem] top-[2rem] h-[28rem] w-[28rem] rounded-full bg-[#00d4aa]/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[28%] h-[24rem] w-[24rem] rounded-full bg-[#7c6af7]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1300px] px-4 pb-16 pt-6 md:px-8">
        <header className="mb-10 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00d4aa] to-[#7c6af7] font-black text-[#0d0e14]">
              SS
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">SkillSync</div>
              <div className="text-sm text-white/75">Workforce Intelligence Platform</div>
            </div>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-white/65 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#workflows" className="transition hover:text-white">
              Workflows
            </a>
            <Link to="/login" className="rounded-full border border-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/10">
              Sign In
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 pb-14 pt-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00d4aa]/25 bg-[#00d4aa]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">
              <Sparkles className="h-3.5 w-3.5" />
              Workforce Intelligence Reimagined
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight tracking-[-0.04em] md:text-7xl">
              Elevate Your
              <span className="block bg-gradient-to-r from-[#ffffff] via-[#00d4aa] to-[#f0a500] bg-clip-text text-transparent">
                Workforce Intelligence
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
              SkillSync brings together staffing, skills intelligence, resume screening, and employee growth into one premium command center for modern teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#7c6af7] px-6 py-3 text-sm font-semibold text-[#0d0e14] shadow-[0_20px_60px_rgba(0,212,170,0.18)] transition hover:translate-y-[-2px]"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login?demo=hr"
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Enter Demo Workspace
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {statCards.map((card) => (
                <div key={card.label} className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="text-3xl font-black text-white">{card.value}</div>
                  <div className="mt-2 text-sm text-white/60">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-[#f0a500]/25 via-transparent to-[#00d4aa]/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div className="absolute right-[-6rem] top-[-6rem] h-56 w-56 animate-[spin_24s_linear_infinite] rounded-[40%_60%_52%_48%/46%_42%_58%_54%] bg-gradient-to-br from-[#f0a500] via-[#00d4aa] to-[#7c6af7] opacity-75 blur-[2px]" />
              <div className="relative space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-[#13141c]/80 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00d4aa]">Control Room</div>
                      <div className="mt-2 text-2xl font-bold">Organization Pulse</div>
                    </div>
                    <Users className="h-10 w-10 text-[#f0a500]" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniMetric label="Employees" value="128" />
                    <MiniMetric label="Available" value="81%" />
                    <MiniMetric label="Coverage" value="72%" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[28px] border border-white/10 bg-[#13141c]/80 p-5">
                    <div className="text-sm font-semibold text-white">Project Allocator</div>
                    <div className="mt-3 space-y-3">
                      <div className="rounded-2xl border border-[#00d4aa]/20 bg-[#00d4aa]/10 p-4 text-sm text-white/80">
                        Ranked internal team with shortage detection and upskilling recommendations.
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
                        External backfill recommendations appear when bench coverage drops below the threshold.
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-[#13141c]/80 p-5">
                    <div className="text-sm font-semibold text-white">Learning Path</div>
                    <div className="mt-4 space-y-3">
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#7c6af7]" />
                      </div>
                      <div className="text-sm text-white/60">Role goal roadmap, skill unlocks, and milestone tracking.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-10">
          <div className="mb-8 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">Feature Surface</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] md:text-5xl">One platform for planning, hiring, and growth</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => (
              <div key={feature.title} className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:translate-y-[-4px] hover:border-[#00d4aa]/30">
                <feature.icon className="h-10 w-10 text-[#00d4aa]" />
                <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflows" className="py-10">
          <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-white/6 to-white/3 p-7 backdrop-blur-xl md:p-10">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f0a500]">Core Workflows</div>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
    </div>
  );
}

function WorkflowStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#13141c]/70 p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">{step}</div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  );
}
