import { Link } from 'react-router-dom';
import { Brain, TrendingUp, Users, BookOpen, BarChart2, ArrowRight, CheckCircle, Star, Zap, Shield, Target } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Skill Gap Forecasting', desc: 'Predict workforce skill deficiencies 1–5 years ahead using industry trends and internal data analytics.', color: 'bg-blue-500' },
  { icon: Users, title: 'Employee Gap Analyzer', desc: 'Detailed per-employee analysis showing current vs required skills with severity scoring.', color: 'bg-purple-500' },
  { icon: BookOpen, title: 'Personalized Learning Paths', desc: "AI-curated course recommendations and learning timelines tailored to each employee's gap profile.", color: 'bg-teal-500' },
  { icon: BarChart2, title: 'Admin Intelligence', desc: 'Company-wide dashboards, risk indicators, and export-ready forecast reports for leadership teams.', color: 'bg-orange-500' },
];

const stats = [
  { value: '40%', label: 'of employees need reskilling by 2027' },
  { value: '85M', label: 'jobs displaced by automation by 2025' },
  { value: '97M', label: 'new roles emerging in tech by 2030' },
  { value: '6×', label: 'ROI on targeted reskilling programs' },
];

const testimonials = [
  { name: 'Riya Kapoor', role: 'CHRO, TechNova Solutions', quote: 'SkillSync AI transformed how we approach talent development. We identified critical gaps 18 months before they became a problem.', rating: 5 },
  { name: 'James Whitfield', role: 'VP Engineering, GlobalSys', quote: 'The forecasting engine is phenomenal. We realigned our entire L&D budget based on its predictions and saw a 40% improvement in team readiness.', rating: 5 },
  { name: 'Preethi Subramaniam', role: 'L&D Manager, HealthCore', quote: 'The personalized learning paths made our reskilling programs actually stick. Completion rates went from 34% to 82% in one quarter.', rating: 5 },
];

const howItWorks = [
  { step: '01', title: 'Connect Your Workforce Data', desc: 'Upload employee records or connect your HRMS to import skill profiles instantly.' },
  { step: '02', title: 'AI Analyzes the Gaps', desc: 'Our engine compares current capabilities against future skill demand projections.' },
  { step: '03', title: 'Get Personalized Pathways', desc: 'Each employee receives a curated learning path aligned with their target role.' },
  { step: '04', title: 'Track & Forecast', desc: 'Monitor progress in real-time and generate leadership reports with one click.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">SkillSync<span className="text-brand-400"> AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How It Works</a>
          <a href="#stats" className="hover:text-white transition-colors">Why Reskill</a>
        </div>
        <Link to="/dashboard">
          <button className="btn-primary text-sm">Explore Dashboard</button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative px-6 lg:px-16 pt-24 pb-20 text-center overflow-hidden">
        {/* Gradient Blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
          <div className="absolute top-32 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-900/40 border border-brand-700/50 rounded-full px-4 py-1.5 text-xs text-brand-300 font-medium mb-6 backdrop-blur-sm">
            <Zap size={12} /> AI-Powered Workforce Intelligence Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
            Predict Skills.<br />Empower Futures.
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            Over <strong className="text-white">40% of employees</strong> will require reskilling in 5 years. Is your organization ready?
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mb-10">
            SkillSync AI continuously analyzes job market trends, internal workforce capability, and learning outcomes to forecast skill gaps and deliver personalized upskilling pathways.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard">
              <button className="btn-primary flex items-center gap-2 px-7 py-3 text-base">
                Explore Dashboard <ArrowRight size={16} />
              </button>
            </Link>
            <Link to="/analyzer">
              <button className="bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/20 text-white font-semibold px-7 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 text-base">
                Analyze Skills <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section id="stats" className="px-6 lg:px-16 py-10 bg-white/5 border-y border-white/10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto text-center">
          {stats.map(s => (
            <div key={s.value}>
              <p className="text-3xl md:text-4xl font-extrabold text-brand-400 mb-1">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 lg:px-16 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything you need to close the skill gap</h2>
          <p className="text-gray-400 max-w-xl mx-auto">A complete intelligence platform built for forward-thinking HR and L&D teams.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(f => (
            <div key={f.title} className="rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/40 p-6 transition-all duration-300 hover:bg-white/8 group">
              <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="px-6 lg:px-16 py-20 bg-white/3">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">How SkillSync AI Works</h2>
          <p className="text-gray-400">Four steps from data to action — in minutes, not months.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {howItWorks.map((h, i) => (
            <div key={h.step} className="relative">
              {i < howItWorks.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-brand-500/40 to-transparent z-0" />
              )}
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm mx-auto mb-4">{h.step}</div>
                <h3 className="font-semibold text-sm mb-2">{h.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 lg:px-16 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Trusted by workforce leaders</h2>
          <p className="text-gray-400">Real outcomes from organizations building future-ready teams.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-brand-900/60 to-purple-900/60 border border-brand-700/40 rounded-3xl p-12 backdrop-blur-sm">
          <Shield size={36} className="text-brand-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Future-proof your workforce today</h2>
          <p className="text-gray-400 text-sm mb-8">Start identifying skill gaps and building personalized pathways for every employee in your organization.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/dashboard"><button className="btn-primary flex items-center gap-2 px-8 py-3">Explore Dashboard <ArrowRight size={14} /></button></Link>
            <Link to="/forecasting"><button className="bg-white/10 border border-white/20 hover:bg-white/15 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 transition-all">Run Forecast <Target size={14} /></button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 lg:px-16 py-8 text-center text-xs text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain size={14} className="text-brand-400" />
          <span className="font-semibold text-gray-300">SkillSync AI</span>
        </div>
        <p>© 2024 SkillSync AI · Workforce Skill Gap Forecasting Platform · Built with React + Tailwind</p>
      </footer>
    </div>
  );
}
