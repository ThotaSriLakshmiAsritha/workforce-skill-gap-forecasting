import { useState } from 'react';
import employees from '../data/employees.json';
import skillsData from '../data/skills.json';
import { Bell, AlertTriangle, Info, BookOpen, TrendingDown, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#7c3aed', '#0d9488', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316'];

const atRiskEmployees = employees.filter(e => e.gapScore >= 65);
const notStartedCourses = employees.filter(e => e.gapScore >= 35).slice(0, 6);

const notifications = [
  { id: 1, type: 'alert', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800', message: 'Priya Nair\'s Excel and SQL skills are becoming obsolete in Data Science by 2025.', time: '2h ago' },
  { id: 2, type: 'nudge', icon: BookOpen, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-800', message: 'Anil Kumar hasn\'t started "AI Analytics" course — 3 weeks overdue.', time: '5h ago' },
  { id: 3, type: 'alert', icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800', message: 'Operations department gap score increased by 8% this quarter.', time: '1d ago' },
  { id: 4, type: 'nudge', icon: BookOpen, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-800', message: 'Meena Krishnan recommended "People Analytics for HR Leaders" course.', time: '1d ago' },
  { id: 5, type: 'alert', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800', message: 'Lakshmi Rao\'s role requires Predictive Analytics skills by Q2 2025.', time: '2d ago' },
  { id: 6, type: 'success', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800', message: 'Aditi Singh completed "UI/UX Design with AI Tools" — gap score improved to 25%.', time: '3d ago' },
  { id: 7, type: 'info', icon: Info, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800', message: 'New industry report: Generative AI skills in critical demand across all departments.', time: '4d ago' },
];

const deptPieData = skillsData.departmentGaps.map((d, i) => ({ name: d.department, value: d.gapScore, color: COLORS[i % COLORS.length] }));

export default function AdminView() {
  const [activeFilter, setActiveFilter] = useState('all');
  const filteredNotifs = activeFilter === 'all' ? notifications : notifications.filter(n => n.type === activeFilter);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Admin — Organization View</h1>
        <p className="section-subtitle">Workforce skill distribution, risk intelligence, and notifications</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Headcount', value: employees.length, color: 'bg-brand-500' },
          { label: 'At Risk (Critical Gap)', value: atRiskEmployees.length, color: 'bg-red-500' },
          { label: 'Avg. Gap Score', value: Math.round(employees.reduce((a, b) => a + b.gapScore, 0) / employees.length) + '%', color: 'bg-yellow-500' },
          { label: 'Depts Monitored', value: skillsData.departmentGaps.length, color: 'bg-green-500' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <div className={`w-2 h-2 rounded-full ${s.color} mx-auto mb-2`} />
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie Chart Workforce Distribution */}
        <div className="card p-5">
          <h2 className="section-title text-base mb-4">Skill Gap Distribution by Department</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={deptPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {deptPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {deptPieData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Employees */}
        <div className="card p-5">
          <h2 className="section-title text-base mb-4">Employees at Critical Risk</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {atRiskEmployees.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{e.name}</p>
                  <p className="text-xs text-gray-500">{e.role} · {e.department}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {e.futureSkills.slice(0, 2).map(s => (
                      <span key={s} className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge-critical">{e.gapScore}%</span>
                  <p className="text-xs text-gray-400 mt-1">gap score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Hiring vs Reskilling */}
      <div className="card p-5">
        <h2 className="section-title text-base mb-4">Hiring vs Reskilling Recommendations by Department</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={skillsData.departmentGaps} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="department" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="employees" name="Team Size" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gapScore" name="Gap Score %" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Notifications Panel */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-brand-500" />
            <h2 className="section-title text-base">Notifications & Alerts</h2>
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{notifications.length}</span>
          </div>
          <div className="flex gap-2">
            {['all', 'alert', 'nudge', 'success', 'info'].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeFilter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filteredNotifs.map(n => (
            <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl border ${n.bg}`}>
              <n.icon size={16} className={`flex-shrink-0 mt-0.5 ${n.color}`} />
              <p className="text-sm text-gray-700 dark:text-gray-200 flex-1">{n.message}</p>
              <span className="text-xs text-gray-400 whitespace-nowrap">{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
