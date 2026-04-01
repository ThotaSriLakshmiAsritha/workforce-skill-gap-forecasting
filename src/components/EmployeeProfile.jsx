import { useState } from 'react';
import employees from '../data/employees.json';
import { getGapSeverity, calcFutureScore } from '../utils/scoreCalculator';
import { Download, Search, Filter, ChevronDown } from 'lucide-react';

const departments = ['All', ...new Set(employees.map((e) => e.department))];
const roles = ['All', ...new Set(employees.map((e) => e.role))];
const horizons = ['1yr', '3yr', '5yr'];
const severities = ['All', 'Critical', 'Medium', 'Low'];

function exportCSV(data) {
  const headers = ['Name', 'Role', 'Department', 'Experience', 'Current Skills', 'Future Skills Required', 'Gap Score', 'Severity'];
  const rows = data.map((e) => [
    e.name,
    e.role,
    e.department,
    e.experience,
    e.skills.join('; '),
    e.futureSkills.join('; '),
    e.gapScore,
    getGapSeverity(e.gapScore),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'skill_gap_analysis.csv';
  a.click();
}

function GapMeter({ score }) {
  const color = score >= 65 ? 'var(--danger)' : score >= 35 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-24 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
        <div className="h-2.5 rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="mono w-12 text-right text-xs" style={{ color }}>{score}%</span>
    </div>
  );
}

export default function EmployeeProfile() {
  const [dept, setDept] = useState('All');
  const [role, setRole] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [horizon, setHorizon] = useState('3yr');
  const [search, setSearch] = useState('');

  const filtered = employees.filter((e) => {
    const matchDept = dept === 'All' || e.department === dept;
    const matchRole = role === 'All' || e.role === role;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severity === 'All' || getGapSeverity(e.gapScore) === severity;
    return matchDept && matchRole && matchSearch && matchSeverity;
  });

  return (
    <div className="page-shell animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Skill Gap Analyzer</h1>
          <p className="page-subtitle">Employee-level gap visibility across departments, roles, and risk severity.</p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => exportCSV(filtered)}>
          <Download size={16} />
          Bulk Export
        </button>
      </div>

      <section className="card p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input-field w-full pl-8"
              placeholder="Search employee name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative lg:col-span-2">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <select className="input-field w-full pl-8 appearance-none" value={dept} onChange={(e) => setDept(e.target.value)}>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          </div>

          <div className="relative lg:col-span-2">
            <select className="input-field w-full appearance-none" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r}>{r}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          </div>

          <div className="relative lg:col-span-2">
            <select className="input-field w-full appearance-none" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              {severities.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          </div>

          <div className="lg:col-span-2">
            <div className="flex h-9 overflow-hidden rounded-md border" style={{ borderColor: 'var(--border)' }}>
              {horizons.map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className="flex-1 text-xs font-medium transition-colors"
                  style={{
                    background: horizon === h ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: horizon === h ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Critical Gaps', value: filtered.filter((e) => e.gapScore >= 65).length, color: 'var(--danger)' },
          { label: 'Medium Gaps', value: filtered.filter((e) => e.gapScore >= 35 && e.gapScore < 65).length, color: 'var(--warning)' },
          { label: 'Low Gaps', value: filtered.filter((e) => e.gapScore < 35).length, color: 'var(--success)' },
        ].map((item) => (
          <div key={item.label} className="card p-5">
            <p className="card-kicker">{item.label}</p>
            <p className="kpi-value" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </section>

      <section className="card p-0">
        <div className="table-shell max-h-[560px]">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Current Skills</th>
                <th>Future Skills</th>
                <th className="text-right">Gap</th>
                <th>Severity</th>
                <th className="text-right">Readiness</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const severityLabel = getGapSeverity(e.gapScore);
                const readiness = calcFutureScore(e);
                return (
                  <tr key={e.id}>
                    <td>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{e.role}</p>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.department}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {e.skills.slice(0, 3).map((s) => (
                          <span key={s} className="rounded px-1.5 py-0.5 text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {e.futureSkills.slice(0, 3).map((s) => (
                          <span key={s} className="rounded px-1.5 py-0.5 text-xs" style={{ background: 'var(--accent-soft)', color: 'var(--text-primary)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-right">
                      <GapMeter score={e.gapScore} />
                    </td>
                    <td>
                      <span className={`status-pill ${severityLabel === 'Critical' ? 'badge-critical' : severityLabel === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                        {severityLabel}
                      </span>
                    </td>
                    <td className="text-right mono" style={{ color: readiness >= 70 ? 'var(--success)' : readiness >= 45 ? 'var(--warning)' : 'var(--danger)' }}>
                      {readiness}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-10 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No workforce records match the selected filters.</div>}
        </div>
      </section>
    </div>
  );
}
