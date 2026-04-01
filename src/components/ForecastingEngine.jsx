import { useState } from 'react';
import { predictSkillGaps } from '../utils/scoreCalculator';
import { BarChart2, Download, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const industries = ['IT', 'Finance', 'Healthcare', 'Manufacturing', 'Education'];
const companySizes = ['Startup (1-50)', 'SME (51-500)', 'Enterprise (500+)'];
const growthTargets = ['Conservative', 'Moderate', 'Aggressive'];
const horizons = ['1yr', '3yr', '5yr'];

const riskColor = (risk) => (risk >= 80 ? 'var(--danger)' : risk >= 65 ? 'var(--warning)' : 'var(--success)');

function exportCSV(predictions, industry) {
  const headers = ['Skill', 'Risk Score', 'Horizon', 'Recommended Action'];
  const rows = predictions.map((p) => [p.skill, `${p.risk}%`, p.horizon, p.action]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${industry}_forecast_report.csv`;
  a.click();
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border p-3 text-xs" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
      <p className="mb-2">{label}</p>
      <p className="mono" style={{ color: payload[0].color }}>Risk: {payload[0].value}%</p>
    </div>
  );
}

export default function ForecastingEngine() {
  const [industry, setIndustry] = useState('IT');
  const [companySize, setCompanySize] = useState('Enterprise (500+)');
  const [growthTarget, setGrowthTarget] = useState('Moderate');
  const [horizon, setHorizon] = useState('3yr');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleForecast = () => {
    setLoading(true);
    setTimeout(() => {
      setResults(predictSkillGaps(industry, companySize, growthTarget));
      setLoading(false);
    }, 900);
  };

  const filteredResults = results?.filter((r) => {
    if (horizon === '1yr') return r.horizon === '1yr';
    if (horizon === '3yr') return r.horizon === '1yr' || r.horizon === '2yr';
    return true;
  });

  const activeResults = filteredResults || results;
  const topRisk = activeResults?.[0]?.risk || 0;

  return (
    <div className="page-shell animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Forecasting Engine</h1>
          <p className="page-subtitle">Forecast workforce risk and map high-priority capability gaps across planning horizons.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="card p-5">
          <p className="card-kicker mb-4">Forecast Controls</p>

          <label className="mb-1 block text-xs tracking-[0.01em]" style={{ color: 'var(--text-secondary)' }}>Industry</label>
          <select className="input-field mb-3 w-full" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {industries.map((i) => <option key={i}>{i}</option>)}
          </select>

          <label className="mb-1 block text-xs tracking-[0.01em]" style={{ color: 'var(--text-secondary)' }}>Company Size</label>
          <select className="input-field mb-3 w-full" value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
            {companySizes.map((s) => <option key={s}>{s}</option>)}
          </select>

          <label className="mb-1 block text-xs tracking-[0.01em]" style={{ color: 'var(--text-secondary)' }}>Growth Strategy</label>
          <select className="input-field mb-3 w-full" value={growthTarget} onChange={(e) => setGrowthTarget(e.target.value)}>
            {growthTargets.map((g) => <option key={g}>{g}</option>)}
          </select>

          <label className="mb-2 block text-xs tracking-[0.01em]" style={{ color: 'var(--text-secondary)' }}>Planning Horizon</label>
          <div className="mb-4 flex h-9 overflow-hidden rounded-md border" style={{ borderColor: 'var(--border)' }}>
            {horizons.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className="flex-1 text-xs font-medium"
                style={{ background: horizon === h ? 'var(--accent)' : 'var(--bg-elevated)', color: horizon === h ? '#fff' : 'var(--text-secondary)' }}
              >
                {h}
              </button>
            ))}
          </div>

          <button className="btn-primary inline-flex w-full items-center justify-center gap-2" onClick={handleForecast} disabled={loading}>
            {loading ? 'Analyzing' : (<><BarChart2 size={16} />Run Forecast</>)}
          </button>
        </aside>

        <section className="space-y-5">
          {results ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="card">
                  <p className="card-kicker">Forecast Risk Score</p>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 mono text-xl" style={{ borderColor: riskColor(topRisk), color: riskColor(topRisk) }}>
                      {topRisk}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Highest projected risk for the selected scope.</p>
                  </div>
                </div>

                <div className="card">
                  <p className="card-kicker">Industry</p>
                  <p className="kpi-value">{industry}</p>
                </div>

                <div className="card flex items-end justify-between">
                  <div>
                    <p className="card-kicker">Export</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Download report</p>
                  </div>
                  <button className="btn-secondary inline-flex items-center gap-2" onClick={() => exportCSV(results, industry)}>
                    <Download size={14} />
                    CSV
                  </button>
                </div>
              </div>

              <div className="card">
                <p className="card-kicker mb-3">Risk by Skill</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={activeResults}>
                    <CartesianGrid stroke="#22262F" strokeDasharray="3 3" />
                    <XAxis dataKey="skill" tick={{ fill: '#555B6A', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#555B6A', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="risk" radius={[4, 4, 0, 0]}>
                      {activeResults.map((entry, idx) => (
                        <Cell key={idx} fill={riskColor(entry.risk)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeResults.map((row, idx) => (
                  <article key={idx} className="card card-interactive p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>Priority {idx + 1}</span>
                      <span className="mono text-lg" style={{ color: riskColor(row.risk) }}>{row.risk}%</span>
                    </div>
                    <h3 className="text-sm font-semibold">{row.skill}</h3>
                    <div className="mt-2 h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="h-2 rounded-full" style={{ width: `${row.risk}%`, background: riskColor(row.risk) }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="inline-flex items-center gap-1"><ChevronRight size={12} />{row.horizon}</span>
                      <span>{row.action}</span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <BarChart2 size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Configure controls and run forecast to generate workforce risk predictions.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
