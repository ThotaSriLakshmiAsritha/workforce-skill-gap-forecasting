import { useState } from 'react';
import employees from '../data/employees.json';
import { calculateGapScore, getGapSeverity, calcFutureScore } from '../utils/scoreCalculator';
import { Download, Search, Filter } from 'lucide-react';

const departments = ['All', ...new Set(employees.map(e => e.department))];
const roles = ['All', ...new Set(employees.map(e => e.role))];
const horizons = ['1yr', '3yr', '5yr'];

function GapMeter({ score }) {
  const color = score >= 65 ? '#ef4444' : score >= 35 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>{score}%</span>
    </div>
  );
}

function exportCSV(data) {
  const headers = ['Name', 'Role', 'Department', 'Experience', 'Current Skills', 'Future Skills Required', 'Gap Score', 'Severity'];
  const rows = data.map(e => [
    e.name, e.role, e.department, e.experience,
    e.skills.join('; '), e.futureSkills.join('; '),
    e.gapScore, getGapSeverity(e.gapScore)
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'skill_gap_analysis.csv'; a.click();
}

export default function EmployeeProfile() {
  const [dept, setDept] = useState('All');
  const [role, setRole] = useState('All');
  const [horizon, setHorizon] = useState('3yr');
  const [search, setSearch] = useState('');

  const filtered = employees.filter(e => {
    const matchDept = dept === 'All' || e.department === dept;
    const matchRole = role === 'All' || e.role === role;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchRole && matchSearch;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-2xl">Skill Gap Analyzer</h1>
          <p className="section-subtitle">Employee-level gap analysis across departments</p>
        </div>
        <button className="btn-primary flex items-center gap-2 self-start" onClick={() => exportCSV(filtered)}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-8" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select className="input-field w-auto" value={dept} onChange={e => setDept(e.target.value)}>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <select className="input-field w-auto" value={role} onChange={e => setRole(e.target.value)}>
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
          {horizons.map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${horizon === h ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Critical Gaps', value: filtered.filter(e => e.gapScore >= 65).length, color: 'text-red-500' },
          { label: 'Medium Gaps', value: filtered.filter(e => e.gapScore >= 35 && e.gapScore < 65).length, color: 'text-yellow-500' },
          { label: 'Low / No Gap', value: filtered.filter(e => e.gapScore < 35).length, color: 'text-green-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-left">
                {['Employee', 'Department', 'Current Skills', 'Required Future Skills', 'Gap Score', 'Severity', 'Readiness'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map(e => {
                const severity = getGapSeverity(e.gapScore);
                const readiness = calcFutureScore(e);
                return (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{e.name}</p>
                        <p className="text-xs text-gray-400">{e.role}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{e.department}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {e.skills.slice(0, 3).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded">{s}</span>
                        ))}
                        {e.skills.length > 3 && <span className="text-xs text-gray-400">+{e.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {e.futureSkills.slice(0, 3).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs rounded">{s}</span>
                        ))}
                        {e.futureSkills.length > 3 && <span className="text-xs text-gray-400">+{e.futureSkills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 w-36">
                      <GapMeter score={e.gapScore} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={severity === 'Critical' ? 'badge-critical' : severity === 'Medium' ? 'badge-medium' : 'badge-low'}>
                        {severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{
                          background: `conic-gradient(#3b82f6 ${readiness * 3.6}deg, #e5e7eb ${readiness * 3.6}deg)`,
                        }}>
                        </div>
                        <span className="text-xs font-semibold text-brand-600">{readiness}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-400">No employees matched your filters.</div>
        )}
      </div>
    </div>
  );
}
