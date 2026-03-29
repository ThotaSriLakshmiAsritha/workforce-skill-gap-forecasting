import { useState } from 'react';
import { predictSkillGaps } from '../utils/scoreCalculator';
import { BarChart2, Download, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const industries = ['IT', 'Finance', 'Healthcare', 'Manufacturing', 'Education'];
const companySizes = ['Startup (1–50)', 'SME (51–500)', 'Enterprise (500+)'];
const growthTargets = ['Conservative', 'Moderate', 'Aggressive'];
const horizons = ['1yr', '3yr', '5yr'];

const riskColor = (risk) => risk >= 80 ? '#ef4444' : risk >= 65 ? '#f59e0b' : '#10b981';

function exportCSV(predictions, industry) {
  const headers = ['Skill', 'Risk Score', 'Horizon', 'Recommended Action'];
  const rows = predictions.map(p => [p.skill, p.risk + '%', p.horizon, p.action]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${industry}_forecast_report.csv`; a.click();
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

  const filteredResults = results?.filter(r => {
    if (horizon === '1yr') return r.horizon === '1yr';
    if (horizon === '3yr') return r.horizon === '1yr' || r.horizon === '2yr';
    return true;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Forecasting Engine</h1>
        <p className="section-subtitle">Predict future skill gaps based on your industry and growth strategy</p>
      </div>

      {/* Input Form */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={20} className="text-brand-500" />
          <h2 className="section-title text-base">Configure Forecast Parameters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Industry Vertical</label>
            <select className="input-field" value={industry} onChange={e => setIndustry(e.target.value)}>
              {industries.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Company Size</label>
            <select className="input-field" value={companySize} onChange={e => setCompanySize(e.target.value)}>
              {companySizes.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Growth Target</label>
            <select className="input-field" value={growthTarget} onChange={e => setGrowthTarget(e.target.value)}>
              {growthTargets.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Time Horizon</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
              {horizons.map(h => (
                <button key={h} onClick={() => setHorizon(h)} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${horizon === h ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{h}</button>
              ))}
            </div>
          </div>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={handleForecast}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <><BarChart2 size={16} /> Run Forecast</>
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-base">
              Top Skill Gap Predictions — {industry} Industry ({growthTarget} Growth)
            </h2>
            <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => exportCSV(results, industry)}>
              <Download size={14} /> Export Report
            </button>
          </div>

          {/* Bar Chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Risk Score by Skill Gap</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={filteredResults || results}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="skill" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Risk Score']} />
                <Bar dataKey="risk" name="Risk Score" radius={[6, 6, 0, 0]}>
                  {(filteredResults || results).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={riskColor(entry.risk)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(filteredResults || results).map((p, idx) => (
              <div key={idx} className="card p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: riskColor(p.risk) }}>
                    #{idx + 1}
                  </div>
                  <span className="text-2xl font-bold" style={{ color: riskColor(p.risk) }}>{p.risk}%</span>
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">{p.skill}</h3>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${p.risk}%`, background: riskColor(p.risk) }} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <ChevronRight size={12} />
                    Horizon: <strong className="text-gray-700 dark:text-gray-200">{p.horizon}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg font-medium text-xs ${
                    p.action.includes('Reskill') ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' :
                    p.action.includes('Hire') ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>{p.action}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Insight summary */}
          <div className="card p-5 border-l-4 border-brand-500">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">📊 AI Insight Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Based on <strong>{growthTarget}</strong> growth targets in the <strong>{industry}</strong> sector with 
              {' '}<strong>{companySize}</strong> headcount: your organization faces significant skill shortages primarily in 
              {' '}<strong>{results[0]?.skill}</strong> and <strong>{results[1]?.skill}</strong>. 
              {' '}We recommend initiating reskilling programs immediately for high-risk categories and strategic hiring for niche skills with a {horizon} planning horizon.
            </p>
          </div>
        </div>
      )}

      {!results && !loading && (
        <div className="card p-12 text-center">
          <BarChart2 size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Configure parameters above and click "Run Forecast" to see predictions</p>
        </div>
      )}
    </div>
  );
}
