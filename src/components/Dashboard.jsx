import { Users, AlertTriangle, TrendingUp, BookCheck } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, Cell
} from 'recharts';
import skillsData from '../data/skills.json';

const stats = [
  { label: 'Total Employees', value: '20', icon: Users, color: 'bg-brand-500', delta: '+3 this month' },
  { label: 'Skills at Risk', value: '12', icon: AlertTriangle, color: 'bg-red-500', delta: '↑ 4 this quarter' },
  { label: 'Skill Gaps Detected', value: '47', icon: TrendingUp, color: 'bg-yellow-500', delta: 'Across 10 depts' },
  { label: 'Courses Completed', value: '128', icon: BookCheck, color: 'bg-green-500', delta: '+22 this month' },
];

const COLORS = ['#3b82f6', '#7c3aed', '#0d9488', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card p-3 text-xs shadow-xl border border-brand-100 dark:border-brand-900">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}%</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { demandVsCapability, departmentGaps } = skillsData;

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Workforce Dashboard</h1>
        <p className="section-subtitle">Real-time overview of your organization's skill health</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card hover:shadow-lg transition-shadow duration-200">
            <div className={`${s.color} w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.delta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="card p-5">
          <h2 className="section-title text-base mb-1">Projected Demand vs Capability</h2>
          <p className="section-subtitle text-xs mb-4">2024–2030 Forecast</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={demandVsCapability}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[40, 100]} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="demand" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} name="Skill Demand" />
              <Line type="monotone" dataKey="capability" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 5" name="Workforce Capability" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department Gap Bar Chart (Heatmap-style) */}
        <div className="card p-5">
          <h2 className="section-title text-base mb-1">Department Skill Gap Risk</h2>
          <p className="section-subtitle text-xs mb-4">Gap score by department (higher = more at risk)</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={departmentGaps} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="gapScore" name="Gap Score" radius={[0, 6, 6, 0]}>
                {departmentGaps.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.gapScore >= 70 ? '#ef4444' : entry.gapScore >= 50 ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Risk Table */}
      <div className="card p-5">
        <h2 className="section-title text-base mb-4">Department Risk Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                <th className="pb-3 text-gray-500 dark:text-gray-400 font-medium">Department</th>
                <th className="pb-3 text-gray-500 dark:text-gray-400 font-medium">Employees</th>
                <th className="pb-3 text-gray-500 dark:text-gray-400 font-medium">Gap Score</th>
                <th className="pb-3 text-gray-500 dark:text-gray-400 font-medium">Risk Level</th>
                <th className="pb-3 text-gray-500 dark:text-gray-400 font-medium">Critical Skills Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {departmentGaps.map((d) => (
                <tr key={d.department} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{d.department}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-300">{d.employees}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 w-24">
                        <div
                          className={`h-2 rounded-full ${d.gapScore >= 70 ? 'bg-red-500' : d.gapScore >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${d.gapScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{d.gapScore}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={d.gapScore >= 70 ? 'badge-critical' : d.gapScore >= 50 ? 'badge-medium' : 'badge-low'}>
                      {d.gapScore >= 70 ? 'Critical' : d.gapScore >= 50 ? 'Medium' : 'Low'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {d.criticalSkills.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 text-xs rounded-lg">{s}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
