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
import { ThemeToggle } from '../ThemeToggle';

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
  switchHref?: string;
  switchLabel?: string;
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
    () => {
      const actions = [
        ...navItems.map((item) => ({
          id: item.to,
          label: item.label,
          description: `Go to ${item.label}`,
          action: () => navigate(item.to),
        })),
        {
          id: homeHref,
          label: 'Return Home',
          description: 'Open the landing page',
          action: () => navigate(homeHref),
        },
      ];

      if (switchHref && switchLabel) {
        actions.push({
          id: switchHref,
          label: switchLabel,
          description: 'Switch workspace perspective',
          action: () => navigate(switchHref),
        });
      }

      return actions.filter((item) =>
        [item.label, item.description].join(' ').toLowerCase().includes(query.trim().toLowerCase())
      );
    },
    [homeHref, navItems, navigate, query, switchHref, switchLabel]
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-textPri">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-12%] h-80 w-80 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute right-[-10%] top-[8%] h-96 w-96 rounded-full bg-white/6 blur-3xl" />
        <div className="absolute bottom-[-14%] left-[24%] h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={`hidden border-r border-brand-border bg-brand-surface backdrop-blur-xl transition-all duration-300 md:flex md:flex-col ${
            collapsed ? 'w-24' : 'w-80'
          }`}
        >
          <div className="flex items-center justify-between border-b border-brand-border px-5 py-5">
            <Link to="/" className={`inline-flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-textPri font-mono text-sm font-black text-brand-bg">
                SS
              </div>
              {!collapsed && (
                <div>
                  <div className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-brand-textSec">{badge}</div>
                  <div className="text-lg font-bold">{title}</div>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="rounded border border-brand-border bg-brand-elevated p-2 text-brand-textSec transition hover:border-brand-borderHi hover:text-brand-textPri"
            >
              <ChevronsLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {!collapsed && (
            <div className="border-b border-brand-border px-5 py-5">
              <p className="text-sm text-brand-textSec">{subtitle}</p>
            </div>
          )}

          <nav className="flex-1 space-y-2 px-4 py-5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded px-4 py-3 font-mono text-sm font-medium transition ${
                    isActive
                      ? 'border border-brand-borderHi bg-brand-elevated text-brand-textPri shadow-[0_0_0_1px_#2E2E2E]'
                      : 'border border-transparent text-brand-textSec hover:border-brand-border hover:bg-brand-elevated hover:text-brand-textPri'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-brand-border px-4 py-4">
            {switchHref && switchLabel ? (
              <Link
                to={switchHref}
                className={`mb-3 flex items-center gap-3 rounded border border-brand-border bg-brand-elevated px-4 py-3 font-mono text-sm font-medium text-brand-textSec transition hover:border-brand-borderHi hover:text-brand-textPri ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-brand-textPri" />
                {!collapsed && switchLabel}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={signOut}
              className={`flex w-full items-center gap-3 rounded border border-brand-border bg-brand-elevated px-4 py-3 font-mono text-sm font-medium text-brand-textSec transition hover:border-brand-borderHi hover:text-brand-textPri ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && 'Sign Out'}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-brand-border bg-brand-bg/85 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
              <div>
                <div className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-brand-textTer">{roleLabel}</div>
                <div className="text-xl font-bold">{profile?.full_name || 'SkillSync User'}</div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="hidden min-w-[280px] items-center gap-3 rounded border border-brand-border bg-brand-elevated px-4 py-3 font-mono text-sm text-brand-textTer transition hover:border-brand-borderHi md:flex"
                >
                  <Search className="h-4 w-4" />
                  Search skills, people, projects
                  <span className="ml-auto inline-flex items-center gap-1 rounded border border-brand-border bg-brand-bg px-2 py-1 text-[11px] uppercase tracking-[0.2em]">
                    <Command className="h-3 w-3" />K
                  </span>
                </button>
                <div className="relative inline-flex h-11 w-11 items-center justify-center rounded border border-brand-border bg-brand-elevated text-brand-textSec">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-brand-textPri" />
                </div>
                <ThemeToggle compact />
                <div className="hidden rounded border border-brand-border bg-brand-elevated px-4 py-3 font-mono text-sm font-medium text-brand-textSec md:block">
                  {profile?.role || roleLabel}
                </div>
                <Link
                  to={homeHref}
                  className="rounded border border-brand-textPri bg-brand-textPri px-4 py-3 font-mono text-sm font-medium text-brand-bg transition hover:bg-brand-bg hover:text-brand-textPri"
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
          <div className="w-full max-w-2xl rounded-[28px] border border-brand-border bg-brand-elevated/95 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-3 border-b border-brand-border px-5 py-4">
              <Search className="h-4 w-4 text-white/45" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to dashboards, pages, or actions..."
                className="flex-1 bg-transparent font-mono text-sm text-brand-textPri outline-none placeholder:text-brand-textTer"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="rounded border border-brand-border bg-brand-surface p-2 text-brand-textSec transition hover:border-brand-borderHi hover:text-brand-textPri"
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
                    className="flex w-full items-center justify-between rounded px-4 py-3 text-left transition hover:bg-brand-surface"
                  >
                    <div>
                      <div className="font-mono font-medium text-brand-textPri">{item.label}</div>
                      <div className="mt-1 text-sm text-brand-textTer">{item.description}</div>
                    </div>
                    <ArrowHint />
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-brand-textTer">No matching actions found.</div>
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
    <div className="inline-flex items-center gap-1 rounded border border-brand-border bg-brand-surface px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-textTer">
      Enter
    </div>
  );
}
