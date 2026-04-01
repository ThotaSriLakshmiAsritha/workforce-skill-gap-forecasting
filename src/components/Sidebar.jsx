import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, TrendingUp, BookOpen,
  Brain, BarChart2, Shield
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/analyzer', icon: Users, label: 'Skill Gap Analyzer' },
  { path: '/trends', icon: TrendingUp, label: 'Job Market Trends' },
  { path: '/pathways', icon: BookOpen, label: 'Upskilling Pathways' },
  { path: '/admin', icon: Shield, label: 'Admin View' },
  { path: '/forecasting', icon: BarChart2, label: 'Forecasting Engine' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[220px] flex-shrink-0 border-r transition-transform duration-150 md:static ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-soft)' }}>
          <Brain size={18} className="text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">SkillSync</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setCollapsed(true)}
              className="group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-all duration-150 hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              style={{
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-soft)' : 'transparent',
              }}
            >
              <span
                className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r"
                style={{ background: active ? 'var(--accent)' : 'transparent' }}
              />
              <Icon size={18} className="flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 rounded-md px-2 py-2" style={{ background: 'var(--bg-elevated)' }}>
          <div className="h-8 w-8 rounded-full flex items-center justify-center mono text-xs" style={{ background: 'var(--accent-soft)', color: 'var(--text-primary)' }}>
            AD
          </div>
          <div>
            <p className="text-sm font-medium">Aditi Das</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>VP, People Analytics</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
