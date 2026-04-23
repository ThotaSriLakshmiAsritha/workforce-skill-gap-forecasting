import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Command,
  LogOut,
  Search,
  Sparkles,
  UserCircle2,
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
  roleLabel,
  homeHref,
  switchHref,
  switchLabel,
  navItems,
}: WorkspaceShellProps) {
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
      if (event.key === 'Escape') setPaletteOpen(false);
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

  const firstLetter = profile?.full_name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--brand-bg))' }}>
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-surface/90 backdrop-blur-xl shadow-nav">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-5 py-3">

          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 mr-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent font-bold text-sm text-white shadow-sm">
              SS
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-textTer">
                {badge}
              </div>
              <div className="text-sm font-bold text-brand-textPri leading-tight">{title}</div>
            </div>
          </Link>

          {/* Nav pills */}
          <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-accent/10 text-brand-accent font-semibold'
                      : 'text-brand-textSec hover:bg-brand-elevated hover:text-brand-textPri'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Search */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden lg:flex items-center gap-2 rounded-xl border border-brand-border bg-brand-elevated px-3 py-2 text-sm text-brand-textTer hover:border-brand-borderHi hover:text-brand-textSec transition-all"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">Search…</span>
              <span className="ml-1 flex items-center gap-0.5 rounded-md border border-brand-border bg-brand-surface px-1.5 py-0.5 text-[10px] font-mono text-brand-textTer">
                <Command className="h-2.5 w-2.5" />K
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-brand-elevated text-brand-textSec hover:text-brand-textPri transition-all"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Bell */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-brand-elevated text-brand-textSec">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-accent" />
            </div>

            {/* Theme toggle */}
            <ThemeToggle compact />

            {/* Switch workspace */}
            {switchHref && switchLabel && (
              <Link
                to={switchHref}
                className="hidden md:flex items-center gap-1.5 rounded-xl border border-brand-accent/30 bg-brand-accent/8 px-3 py-2 text-xs font-semibold text-brand-accent hover:bg-brand-accent/15 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{switchLabel}</span>
              </Link>
            )}

            {/* Sign out */}
            <button
              type="button"
              onClick={signOut}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-brand-elevated text-brand-textTer hover:text-brand-textPri hover:border-brand-borderHi transition-all"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* User chip */}
            <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-elevated pl-1 pr-3 py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-accent text-white text-xs font-bold">
                {firstLetter}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-brand-textPri leading-tight truncate max-w-[100px]">
                  {profile?.full_name?.split(' ')[0] || 'User'}
                </div>
                <div className="text-[10px] text-brand-textTer leading-tight">{roleLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main
        key={location.pathname}
        className="page-enter mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8"
      >
        <Outlet />
      </main>

      {/* ── Command Palette ── */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-20 backdrop-blur-sm"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-brand-border bg-brand-surface shadow-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-brand-border px-4 py-3">
              <Search className="h-4 w-4 text-brand-textTer" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to a page or action…"
                className="flex-1 bg-transparent text-sm text-brand-textPri outline-none placeholder:text-brand-textTer"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="rounded-lg border border-brand-border bg-brand-elevated p-1.5 text-brand-textSec hover:text-brand-textPri transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2">
              {quickActions.length > 0 ? (
                quickActions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:bg-brand-elevated"
                  >
                    <div>
                      <div className="text-sm font-semibold text-brand-textPri">{item.label}</div>
                      <div className="mt-0.5 text-xs text-brand-textTer">{item.description}</div>
                    </div>
                    <UserCircle2 className="h-4 w-4 text-brand-textTer" />
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-brand-textTer">
                  No matching actions found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
