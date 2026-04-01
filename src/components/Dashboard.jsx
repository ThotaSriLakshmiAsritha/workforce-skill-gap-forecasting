import { Link } from 'react-router-dom';
import { Users, AlertTriangle, TrendingUp, BookCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import skillsData from '../data/skills.json';
import employees from '../data/employees.json';

const stats = [
  { label: 'Total Employees', value: '20', icon: Users, delta: '+3.2%', up: true },
  { label: 'Skills at Risk', value: '12', icon: AlertTriangle, delta: '+1.4%', up: false },
  { label: 'Gap Alerts', value: '47', icon: TrendingUp, delta: '+8.0%', up: false },
  { label: 'Completed Courses', value: '128', icon: BookCheck, delta: '+12.7%', up: true },
];

const topRiskEmployees = [...employees]
  .sort((a, b) => b.gapScore - a.gapScore)
  .slice(0, 5);

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="rounded-lg border p-3 text-xs"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
    >
      <p className="mb-2 mono" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="mono" style={{ color: item.color }}>
          {item.name}: {item.value}%
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { demandVsCapability, departmentGaps } = skillsData;

  return (
    <div className="page-shell animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workforce Dashboard</h1>
          <p className="page-subtitle">Enterprise visibility into workforce capability, risk, and readiness.</p>
        </div>
        <button className="btn-primary">Generate Executive Snapshot</button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="card card-interactive p-5">
            <div className="mb-3 flex items-start justify-between">
              <item.icon size={24} style={{ color: 'var(--accent)' }} />
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
                style={{
                  background: item.up ? '#f0f0f0' : '#d8d8d8',
                  color: '#000000',
                }}
              >
                {item.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {item.delta}
              </span>
            </div>
            <p className="card-kicker">{item.label}</p>
            <p className="kpi-value">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-3">
          <div className="mb-4">
            <p className="card-kicker">Capability Trajectory</p>
            <h2 className="text-lg font-semibold">Demand vs Internal Capacity</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={demandVsCapability} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id="capabilityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#22262F" strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fill: '#555B6A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555B6A', fontSize: 11 }} domain={[40, 100]} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="demand" stroke="var(--chart-1)" fill="url(#demandFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="capability" stroke="var(--chart-3)" fill="url(#capabilityFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card xl:col-span-2">
          <div className="mb-4">
            <p className="card-kicker">Department Health</p>
            <h2 className="text-lg font-semibold">Skill Risk Radar</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={departmentGaps.slice(0, 6)}>
              <PolarGrid stroke="#22262F" />
              <PolarAngleAxis dataKey="department" tick={{ fill: '#8B91A0', fontSize: 10 }} />
              <Radar dataKey="gapScore" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.25} />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="card-kicker">Immediate Action</p>
            <h2 className="text-lg font-semibold">At-Risk Employees</h2>
          </div>
          <Link to="/analyzer" className="btn-ghost">View All</Link>
        </div>
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th className="text-right">Gap Score</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {topRiskEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{employee.experience}</p>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{employee.role}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{employee.department}</td>
                  <td className="text-right mono" style={{ color: employee.gapScore >= 65 ? 'var(--danger)' : employee.gapScore >= 35 ? 'var(--warning)' : 'var(--success)' }}>
                    {employee.gapScore}%
                  </td>
                  <td>
                    <span className={`status-pill ${employee.gapScore >= 65 ? 'badge-critical' : employee.gapScore >= 35 ? 'badge-high' : 'badge-low'}`}>
                      {employee.gapScore >= 65 ? 'Critical' : employee.gapScore >= 35 ? 'High' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
