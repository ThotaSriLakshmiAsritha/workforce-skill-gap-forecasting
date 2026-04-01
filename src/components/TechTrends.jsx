import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import trendsData from '../data/trends.json';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const industries = Object.keys(trendsData.industryTrends);

const urgencyClass = {
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Watch: 'badge-low',
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border p-3 text-xs" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
      <p className="mono mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="mono" style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
}

export default function TechTrends() {
  const [industry, setIndustry] = useState('IT');
  const { globalDemand, emergingTech, skillGrowthHistory, industryTrends } = trendsData;

  return (
    <div className="page-shell animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tech Trends</h1>
          <p className="page-subtitle">Market demand intelligence and emerging capability signals for workforce planning.</p>
        </div>
      </div>

      <section className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="card-kicker">Market Demand Over Time</p>
            <h2 className="text-lg font-semibold">Core Skill Index (2020-2026)</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: industry === ind ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: industry === ind ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={skillGrowthHistory}>
            <defs>
              <linearGradient id="techArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#22262F" strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fill: '#555B6A', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555B6A', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="AI_ML" stroke="var(--chart-1)" fill="url(#techArea)" strokeWidth={2} name="AI / ML" />
            <Area type="monotone" dataKey="Cloud" stroke="var(--chart-2)" fillOpacity={0} strokeWidth={2} name="Cloud" />
            <Area type="monotone" dataKey="Cybersecurity" stroke="var(--chart-3)" fillOpacity={0} strokeWidth={2} name="Cybersecurity" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-2">
          <p className="card-kicker mb-3">Industry Focus</p>
          <h3 className="mb-4 text-base font-semibold">{industry} Skill Demand Snapshot</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={industryTrends[industry]} layout="vertical" margin={{ top: 8, right: 8, left: 16, bottom: 8 }}>
              <CartesianGrid stroke="#22262F" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#555B6A', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis type="category" dataKey="skill" tick={{ fill: '#8B91A0', fontSize: 10 }} width={96} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="demand" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {emergingTech.slice(0, 9).map((tech, index) => {
            const source = globalDemand[index % globalDemand.length];
            const demandScore = source.demand;
            const positiveTrend = demandScore >= 70;

            return (
              <article key={tech.name} className="card card-interactive p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="text-2xl">{tech.icon}</div>
                  <span className={`status-pill ${urgencyClass[tech.urgency] || 'badge-medium'}`}>{tech.urgency}</span>
                </div>
                <h4 className="text-sm font-semibold">{tech.name}</h4>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tech.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="card-kicker">Demand</p>
                    <p className="mono text-sm" style={{ color: 'var(--text-primary)' }}>{demandScore}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs mono" style={{ color: positiveTrend ? 'var(--success)' : 'var(--danger)' }}>
                    {positiveTrend ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {source.growth}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
