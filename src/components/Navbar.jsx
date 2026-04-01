import { Bell, Search, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageNames = {
  '/dashboard': 'Dashboard',
  '/analyzer': 'Skill Gap Analyzer',
  '/pathways': 'Recommendation Engine',
  '/trends': 'Tech Trends',
  '/admin': 'Admin View',
  '/forecasting': 'Forecasting Engine',
};

export default function Navbar({ sidebarCollapsed, setSidebarCollapsed, notifications }) {
  const location = useLocation();

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-20" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-md transition-colors md:hidden hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-xs tracking-[0.01em]" style={{ color: 'var(--text-secondary)' }}>SkillSync / {pageNames[location.pathname] || 'Workspace'}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search employees, skills, courses" className="input-field w-72 pl-9" />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button className="relative rounded-md p-2 transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]" style={{ color: 'var(--text-secondary)' }}>
            <Bell size={18} />
            {notifications > 0 && (
              <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[10px] mono flex items-center justify-center" style={{ background: 'var(--danger)', color: '#fff' }}>
                {notifications}
              </span>
            )}
          </button>
        </div>

        {/* Avatar */}
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs mono ml-1" style={{ background: 'var(--accent-soft)' }}>
          AD
        </div>
      </div>
    </header>
  );
}
