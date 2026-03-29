import { useState } from 'react';
import trendsData from '../data/trends.json';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line
} from 'recharts';

const industries = Object.keys(trendsData.industryTrends);
const urgencyColors = { Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800', High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800', Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800', Watch: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card p-3 text-xs shadow-xl">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}%</strong></p>)}
      </div>
    );
  }
  return null;
};

export default function TechTrends() {
  const [industry, setIndustry] = useState('IT');
  const { globalDemand, emergingTech, skillGrowthHistory, industryTrends } = trendsData;

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Job Market & Tech Trends</h1>
        <p className="section-subtitle">Explore global skill demand, industry trends, and emerging technologies</p>
      </div>

      {/* Industry Filter */}
      <div className="flex flex-wrap gap-2">
        {industries.map(ind => (
          <button
            key={ind}
            onClick={() => setIndustry(ind)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${industry === ind ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-300'}`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Global Demand vs Internal bar chart */}
        <div className="card p-5">
          <h2 className="section-title text-base mb-1">Global Demand vs Internal Availability</h2>
          <p className="section-subtitle text-xs mb-4">Top 10 in-demand skills</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={globalDemand} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="skill" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="demand" name="Global Demand" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="internal" name="Internal Availability" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Industry Radar */}
        <div className="card p-5">
          <h2 className="section-title text-base mb-1">Industry Skill Demand — {industry}</h2>
          <p className="section-subtitle text-xs mb-4">Top skills by demand score</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={industryTrends[industry]}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
              <Radar name={industry} dataKey="demand" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skill Growth History Line Chart */}
      <div className="card p-5">
        <h2 className="section-title text-base mb-1">Skill Demand Growth (2020–2026)</h2>
        <p className="section-subtitle text-xs mb-4">Historical demand index across key technology categories</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={skillGrowthHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="AI_ML" stroke="#7c3aed" strokeWidth={2} dot={false} name="AI / ML" />
            <Line type="monotone" dataKey="Cloud" stroke="#3b82f6" strokeWidth={2} dot={false} name="Cloud" />
            <Line type="monotone" dataKey="Cybersecurity" stroke="#ef4444" strokeWidth={2} dot={false} name="Cybersecurity" />
            <Line type="monotone" dataKey="DevOps" stroke="#0d9488" strokeWidth={2} dot={false} name="DevOps" />
            <Line type="monotone" dataKey="Blockchain" stroke="#f59e0b" strokeWidth={2} dot={false} name="Blockchain" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Emerging Tech Tag Cloud */}
      <div className="card p-5">
        <h2 className="section-title text-base mb-1">Emerging Technologies to Watch</h2>
        <p className="section-subtitle text-xs mb-4">Critical developments reshaping the workforce</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {emergingTech.map(tech => (
            <div key={tech.name} className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
              <div className="text-3xl mb-2">{tech.icon}</div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{tech.name}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{tech.description}</p>
              <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${urgencyColors[tech.urgency]}`}>
                {tech.urgency}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Badges */}
      <div className="card p-5">
        <h2 className="section-title text-base mb-4">Fastest Growing Skills (YoY)</h2>
        <div className="flex flex-wrap gap-3">
          {globalDemand.map(s => (
            <div key={s.skill} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.skill}</span>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">{s.growth}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
