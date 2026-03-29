import { Bell, Sun, Moon, Search, Menu } from 'lucide-react';

export default function Navbar({ darkMode, toggleDark, sidebarCollapsed, setSidebarCollapsed, notifications }) {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees, skills..."
            className="input-field pl-9 w-64 py-2 text-xs"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 relative">
            <Bell size={18} />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                {notifications}
              </span>
            )}
          </button>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white text-xs font-bold ml-1 cursor-pointer">
          AD
        </div>
      </div>
    </header>
  );
}
