import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BriefcaseBusiness,
  ScanSearch,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  CheckCircle,
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

const statCards = [
  { value: "94%", label: "Skill Match Rate", icon: TrendingUp },
  { value: "2.3×", label: "Faster Staffing", icon: CheckCircle },
  { value: "128", label: "Employees Mapped", icon: Users },
];

const featureCards = [
  {
    icon: BarChart3,
    title: "Workforce Overview",
    text: "Track department readiness, skill gaps, training progress, and availability in one executive dashboard.",
  },
  {
    icon: BriefcaseBusiness,
    title: "AI Project Allocation",
    text: "Turn project briefs into ranked internal teams, shortage alerts, and external backfill suggestions.",
  },
  {
    icon: ScanSearch,
    title: "Resume Screening",
    text: "Screen groups of resumes against a requirement, rank the strongest profiles, and shortlist quickly.",
  },
  {
    icon: Target,
    title: "Employee Growth Paths",
    text: "Help employees see competency gaps, role goals, and personalized learning roadmaps.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const softScale = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1 },
};

export default function Landing() {
  const shouldReduceMotion = useReducedMotion();
  const initialState = shouldReduceMotion ? false : "hidden";
  const viewport = { once: true, amount: 0.22 };
  const transition = {
    duration: shouldReduceMotion ? 0 : 0.45,
    ease: "easeOut",
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{ background: "rgb(var(--brand-bg))" }}
    >
      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 border-b border-brand-border bg-brand-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-4 px-5 py-3.5 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent font-bold text-sm text-white">
              SS
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-textTer">
                SkillSync
              </div>
              <div className="text-sm font-bold text-brand-textPri leading-tight">
                Workforce Intelligence
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="#features"
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-textSec hover:bg-brand-elevated hover:text-brand-textPri transition-all"
            >
              Features
            </a>
            <a
              href="#workflows"
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-textSec hover:bg-brand-elevated hover:text-brand-textPri transition-all"
            >
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
        <motion.section
          className="relative overflow-hidden rounded-[28px] border border-brand-border bg-brand-surface px-8 py-14 md:py-20 md:px-14 mb-6"
          initial={initialState}
          animate="visible"
          variants={softScale}
          transition={transition}
        >
          {/* Abstract blob background */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 overflow-hidden rounded-r-[28px]">
            <motion.div
              className="blob-orb absolute right-[-80px] top-[-80px] h-[420px] w-[420px]"
              animate={
                shouldReduceMotion
                  ? undefined
                  : { y: [0, 8, 0], rotate: [0, 2, 0] }
              }
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, rgba(45,105,70,0.55) 0%, rgba(72,160,100,0.35) 40%, rgba(100,200,140,0.15) 70%, transparent 100%)",
                borderRadius: "42% 58% 53% 47% / 44% 42% 58% 56%",
              }}
            />
            <div
              className="absolute right-[60px] top-[80px] h-[280px] w-[280px] opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(45,105,70,0.3) 0%, transparent 70%)",
                borderRadius: "50% 50% 61% 39% / 54% 37% 63% 46%",
                filter: "blur(30px)",
              }}
            />
          </div>

          <motion.div
            className="relative z-10 max-w-[580px]"
            initial={initialState}
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 },
              },
            }}
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-brand-accent/25 bg-brand-accent/8 px-4 py-1.5 text-xs font-semibold text-brand-accent mb-6"
              variants={fadeUp}
              transition={transition}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Workforce Intelligence Reimagined
            </motion.div>
            <motion.h1
              className="text-5xl font-black tracking-tight text-brand-textPri leading-[1.1] md:text-7xl"
              variants={fadeUp}
              transition={transition}
            >
              Elevate Your
              <span className="block text-brand-accent">Workforce</span>
              Intelligence
            </motion.h1>
            <motion.p
              className="mt-6 max-w-xl text-lg leading-8 text-brand-textSec"
              variants={fadeUp}
              transition={transition}
            >
              SkillSync brings staffing, skills intelligence, resume screening,
              and employee growth into one premium command center for modern
              teams.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              variants={fadeUp}
              transition={transition}
            >
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
            </motion.div>
          </motion.div>

          {/* Date pills like in reference */}
          <div className="absolute bottom-6 right-8 hidden md:flex items-center gap-2">
            <span className="rounded-full border border-brand-border bg-brand-elevated px-4 py-2 text-xs font-semibold text-brand-textSec shadow-card">
              Live Dashboard
            </span>
            <span className="rounded-full border border-brand-accent/25 bg-brand-accent/8 px-4 py-2 text-xs font-semibold text-brand-accent shadow-card">
              AI-Powered
            </span>
          </div>
        </motion.section>

        {/* ── Stat Cards ── */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {statCards.map((card, index) => (
            <motion.div
              key={card.label}
              className="surface-card card-float rounded-2xl p-6"
              initial={initialState}
              whileInView="visible"
              viewport={viewport}
              variants={fadeUp}
              transition={{
                ...transition,
                delay: shouldReduceMotion ? 0 : index * 0.06,
              }}
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-textTer">
                  {card.label}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/10">
                  <card.icon className="h-4 w-4 text-brand-accent" />
                </div>
              </div>
              <div className="text-4xl font-black text-brand-textPri">
                {card.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Feature Cards ── */}
        <motion.section
          id="features"
          className="py-10"
          initial={initialState}
          whileInView="visible"
          viewport={viewport}
          variants={fadeUp}
          transition={transition}
        >
          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-textTer mb-2">
              Feature Surface
            </div>
            <h2 className="text-3xl font-black text-brand-textPri md:text-4xl">
              One platform for planning, hiring, and growth
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="surface-card card-float rounded-2xl p-6 group"
                initial={initialState}
                whileInView="visible"
                viewport={viewport}
                variants={fadeUp}
                transition={{
                  ...transition,
                  delay: shouldReduceMotion ? 0 : index * 0.05,
                }}
                whileHover={shouldReduceMotion ? undefined : { y: -4 }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent/10 mb-5 group-hover:bg-brand-accent/18 transition-colors">
                  <feature.icon className="h-5 w-5 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold text-brand-textPri">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-brand-textSec">
                  {feature.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Workflows ── */}
        <motion.section
          id="workflows"
          className="py-6"
          initial={initialState}
          whileInView="visible"
          viewport={viewport}
          variants={fadeUp}
          transition={transition}
        >
          <motion.div
            className="rounded-[28px] border border-brand-accent/15 p-8 md:p-12"
            style={{
              background:
                "linear-gradient(135deg, rgba(45,105,70,0.06) 0%, rgba(45,105,70,0.02) 100%)",
            }}
            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          >
            <div className="max-w-xl mb-10">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-textTer mb-2">
                Core Workflows
              </div>
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
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}

function WorkflowStep({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="surface-card rounded-2xl p-6"
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/10 text-xs font-black text-brand-accent mb-4">
        {step}
      </div>
      <h3 className="text-lg font-bold text-brand-textPri">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-brand-textSec">{text}</p>
    </motion.div>
  );
}
