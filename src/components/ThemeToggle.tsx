import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded border border-brand-border bg-brand-elevated px-3 py-2 font-mono text-xs font-medium uppercase tracking-[0.16em] text-brand-textSec transition hover:border-brand-borderHi hover:text-brand-textPri ${
        compact ? 'px-2.5 py-2' : ''
      }`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {!compact && (theme === 'dark' ? 'Light' : 'Dark')}
    </button>
  );
}
