import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronsLeft,
  Command,
  LogOut,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface WorkspaceNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

interface WorkspaceShellProps {
  badge: string;
  title: string;
  subtitle: string;
  roleLabel: string;
  homeHref: string;
  switchHref: string;
  switchLabel: string;
  navItems: WorkspaceNavItem[];
}

export function WorkspaceShell({
  badge,
  title,
  subtitle,
  roleLabel,
  homeHref,
  switchHref,
  switchLabel,
  navItems,
}: WorkspaceShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setPaletteOpen(false);
    setQuery('');
  }, [location.pathname]);

  const quickActions = useMemo(
    () =>
      [
        ...navItems.map((item) => ({
          id: item.to,
          label: item.label,
          description: `Go to ${item.label}`,
          action: () => navigate(item.to),
        })),
        {
          id: switchHref,
          label: switchLabel,
          description: 'Switch workspace perspective',
          action: () => navigate(switchHref),
        },
        {
          id: homeHref,
          label: 'Return Home',
          description: 'Open the landing page',
          action: () => navigate(homeHref),
        },
      ].filter((item) =>
        [item.label, item.description].join(' ').toLowerCase().includes(query.trim().toLowerCase())
      ),
    [homeHref, navItems, navigate, query, switchHref, switchLabel]
  );

  return (
    <div className="min-h-screen bg-[#0d0e14] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-12%] h-80 w-80 rounded-full bg-[#00d4aa]/12 blur-3xl" />
        <div className="absolute right-[-10%] top-[8%] h-96 w-96 rounded-full bg-[#7c6af7]/14 blur-3xl" />
        <div className="absolute bottom-[-14%] left-[24%] h-96 w-96 rounded-full bg-[#f0a500]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={`hidden border-r border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 md:flex md:flex-col ${
            collapsed ? 'w-24' : 'w-80'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <Link to="/" className={`inline-flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00d4aa] to-[#7c6af7] text-sm font-black text-[#0d0e14]">
                SS
              </div>
              {!collapsed && (
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">{badge}</div>
                  <div className="text-lg font-bold">{title}</div>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronsLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {!collapsed && (
            <div className="border-b border-white/10 px-5 py-5">
              <p className="text-sm text-white/65">{subtitle}</p>
            </div>
          )}

          <nav className="flex-1 space-y-2 px-4 py-5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'border border-[#00d4aa]/40 bg-[#00d4aa]/14 text-white shadow-[0_0_0_1px_rgba(0,212,170,0.08)]'
                      : 'border border-transparent text-white/65 hover:border-white/10 hover:bg-white/5 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/10 px-4 py-4">
            <Link
              to={switchHref}
              className={`mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-[#f0a500]" />
              {!collapsed && switchLabel}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className={`flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && 'Sign Out'}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d0e14]/70 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">{roleLabel}</div>
                <div className="text-xl font-bold">{profile?.full_name || 'SkillSync User'}</div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="hidden min-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55 transition hover:bg-white/10 md:flex"
                >
                  <Search className="h-4 w-4" />
                  Search skills, people, projects
                  <span className="ml-auto inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[11px] uppercase tracking-[0.2em]">
                    <Command className="h-3 w-3" />K
                  </span>
                </button>
                <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/75">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#f0a500]" />
                </div>
                <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 md:block">
                  {profile?.role || roleLabel}
                </div>
                <Link
                  to={homeHref}
                  className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#00d4aa]/25 to-[#7c6af7]/25 px-4 py-3 text-sm font-semibold text-white transition hover:from-[#00d4aa]/35 hover:to-[#7c6af7]/35"
                >
                  Home
                </Link>
              </div>
            </div>
          </header>

          <main key={location.pathname} className="page-enter relative flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>

      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-24 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#12141d]/95 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <Search className="h-4 w-4 text-white/45" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to dashboards, pages, or actions..."
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-3">
              {quickActions.length > 0 ? (
                quickActions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <div>
                      <div className="font-semibold text-white">{item.label}</div>
                      <div className="mt-1 text-sm text-white/45">{item.description}</div>
                    </div>
                    <ArrowHint />
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-white/45">No matching actions found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowHint() {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
      Enter
    </div>
  );
}
