import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-elevated text-brand-textSec transition hover:border-brand-borderHi hover:text-brand-textPri ${
        compact ? 'h-9 w-9 justify-center' : 'px-3 py-2 text-xs font-medium'
      }`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
    </button>
  );
}
