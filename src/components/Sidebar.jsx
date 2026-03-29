import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, TrendingUp, BookOpen,
  Settings, Bell, ChevronLeft, ChevronRight,
  Brain, BarChart2, Shield
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
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
      className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out h-screen sticky top-0 z-30`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center flex-shrink-0">
          <Brain size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
            SkillSync<span className="text-brand-500"> AI</span>
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`sidebar-link ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="px-2 pb-4 border-t border-gray-100 dark:border-gray-800 pt-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link w-full justify-center"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
