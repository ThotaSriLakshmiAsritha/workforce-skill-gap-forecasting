import { useState } from 'react';
import employees from '../data/employees.json';
import skillsData from '../data/skills.json';
import { Bell, AlertTriangle, Info, BookOpen, TrendingDown, CheckCircle } from 'lucide-react';

const atRiskEmployees = employees.filter((e) => e.gapScore >= 65);

const notifications = [
  { id: 1, type: 'alert', icon: AlertTriangle, message: "Priya Nair's Excel and SQL skills are becoming obsolete in Data Science by 2025.", time: '2h ago', unread: true },
  { id: 2, type: 'nudge', icon: BookOpen, message: "Anil Kumar has not started AI Analytics course, 3 weeks overdue.", time: '5h ago', unread: true },
  { id: 3, type: 'alert', icon: TrendingDown, message: 'Operations department gap score increased by 8% this quarter.', time: '1d ago', unread: true },
  { id: 4, type: 'nudge', icon: BookOpen, message: 'Meena Krishnan was assigned People Analytics for HR Leaders.', time: '1d ago', unread: false },
  { id: 5, type: 'alert', icon: AlertTriangle, message: "Lakshmi Rao's role requires Predictive Analytics skills by Q2 2025.", time: '2d ago', unread: false },
  { id: 6, type: 'success', icon: CheckCircle, message: 'Aditi Singh completed UI and UX Design with AI Tools and improved to 25% gap.', time: '3d ago', unread: false },
  { id: 7, type: 'info', icon: Info, message: 'Industry bulletin: Generative AI skills are now critical across departments.', time: '4d ago', unread: false },
];

const notifClass = {
  alert: 'badge-critical',
  nudge: 'badge-high',
  success: 'badge-low',
  info: 'badge-medium',
};

export default function AdminView() {
  const [activeFilter, setActiveFilter] = useState('all');
  const filteredNotifs = activeFilter === 'all' ? notifications : notifications.filter((n) => n.type === activeFilter);
  const avgGap = Math.round(employees.reduce((sum, e) => sum + e.gapScore, 0) / employees.length);

  return (
    <div className="page-shell animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin View</h1>
          <p className="page-subtitle">Organization-wide risk snapshot, notification feed, and department capability table.</p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Headcount', value: employees.length },
          { label: 'Critical Risk', value: atRiskEmployees.length },
          { label: 'Average Gap', value: `${avgGap}%` },
          { label: 'Departments', value: skillsData.departmentGaps.length },
        ].map((stat) => (
          <article key={stat.label} className="card p-5">
            <p className="card-kicker">{stat.label}</p>
            <p className="kpi-value">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={16} style={{ color: 'var(--accent)' }} />
            <p className="card-kicker">Notification Feed</p>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {['all', 'alert', 'nudge', 'success', 'info'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
                style={{
                  background: activeFilter === f ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: activeFilter === f ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredNotifs.map((item) => (
              <article key={item.id} className="rounded-md border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <item.icon size={14} style={{ color: 'var(--text-secondary)' }} className="mt-0.5" />
                    <p className="text-sm leading-relaxed">{item.message}</p>
                  </div>
                  {item.unread && <span className="mt-1 h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`status-pill ${notifClass[item.type]}`}>{item.type}</span>
                  <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>{item.time}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="card xl:col-span-3 p-0">
          <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
            <p className="card-kicker">Department Risk Table</p>
            <h2 className="text-base font-semibold">Capability Gaps by Department</h2>
          </div>
          <div className="table-shell max-h-[620px]">
            <table className="table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th className="text-right">Employees</th>
                  <th className="text-right">Gap Score</th>
                  <th>Risk</th>
                  <th>Critical Skills</th>
                </tr>
              </thead>
              <tbody>
                {skillsData.departmentGaps.map((row) => {
                  const level = row.gapScore >= 70 ? 'Critical' : row.gapScore >= 50 ? 'High' : row.gapScore >= 35 ? 'Medium' : 'Low';
                  return (
                    <tr key={row.department}>
                      <td className="font-medium">{row.department}</td>
                      <td className="text-right mono" style={{ color: 'var(--text-secondary)' }}>{row.employees}</td>
                      <td className="text-right mono" style={{ color: row.gapScore >= 70 ? 'var(--danger)' : row.gapScore >= 50 ? 'var(--warning)' : 'var(--success)' }}>{row.gapScore}%</td>
                      <td>
                        <span className={`status-pill ${level === 'Critical' ? 'badge-critical' : level === 'High' ? 'badge-high' : level === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                          {level}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {row.criticalSkills.map((s) => (
                            <span key={s} className="rounded px-2 py-0.5 text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
