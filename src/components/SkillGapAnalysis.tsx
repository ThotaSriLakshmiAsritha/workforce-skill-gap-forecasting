import React, { useMemo } from 'react';
import { TrendingUp, Target } from 'lucide-react';

// Role definitions
interface Role {
  id: string;
  title: string;
  icon: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
}

const ROLES: Role[] = [
  {
    id: 'full-stack-engineer',
    title: 'Full Stack Engineer',
    icon: '⚡',
    requiredSkills: ['javascript', 'typescript', 'react', 'node.js', 'sql', 'git', 'rest api', 'html', 'css'],
    niceToHaveSkills: ['docker', 'graphql', 'redis', 'aws', 'ci/cd', 'next.js', 'testing'],
  },
  {
    id: 'ml-engineer',
    title: 'ML Engineer',
    icon: '🧠',
    requiredSkills: ['python', 'machine learning', 'tensorflow', 'pytorch', 'numpy', 'pandas', 'scikit-learn', 'statistics'],
    niceToHaveSkills: ['mlops', 'docker', 'spark', 'sql', 'deep learning', 'transformers', 'hugging face', 'aws sagemaker'],
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    icon: '📊',
    requiredSkills: ['python', 'statistics', 'sql', 'pandas', 'numpy', 'data visualization', 'machine learning', 'r'],
    niceToHaveSkills: ['tableau', 'power bi', 'spark', 'a/b testing', 'jupyter', 'scikit-learn', 'deep learning'],
  },
  {
    id: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    icon: '🔒',
    requiredSkills: ['network security', 'siem', 'incident response', 'penetration testing', 'firewalls', 'vulnerability assessment', 'linux', 'tcp/ip'],
    niceToHaveSkills: ['splunk', 'python', 'ethical hacking', 'iso 27001', 'cloud security', 'soc', 'threat intelligence'],
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    icon: '🚀',
    requiredSkills: ['docker', 'kubernetes', 'ci/cd', 'aws', 'linux', 'terraform', 'bash', 'git'],
    niceToHaveSkills: ['ansible', 'azure', 'gcp', 'monitoring', 'prometheus', 'grafana', 'helm', 'jenkins'],
  },
  {
    id: 'mobile-engineer',
    title: 'Mobile Engineer',
    icon: '📱',
    requiredSkills: ['swift', 'kotlin', 'react native', 'mobile ui', 'rest api', 'git', 'app store deployment'],
    niceToHaveSkills: ['flutter', 'firebase', 'unit testing', 'ci/cd', 'push notifications', 'offline storage', 'performance profiling'],
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer',
    icon: '⚙️',
    requiredSkills: ['node.js', 'python', 'java', 'sql', 'rest api', 'microservices', 'git', 'authentication'],
    niceToHaveSkills: ['docker', 'kafka', 'redis', 'grpc', 'graphql', 'aws', 'nosql', 'caching'],
  },
];

// Component props
interface SkillGapAnalysisProps {
  extractedSkills: string[];
  allRoleAnalyses: RoleAnalysis[];
  selectedRoleId: string;
  onRoleChange: (roleId: string) => void;
}

// Main component
export default function SkillGapAnalysis({ extractedSkills, allRoleAnalyses, selectedRoleId, onRoleChange }: SkillGapAnalysisProps) {
  const analyses = allRoleAnalyses;

  const bestMatch = useMemo(() => {
    if (analyses.length === 0) return null;
    return analyses.reduce((best, current) => current.readinessScore > best.readinessScore ? current : best);
  }, [analyses]);

  const selectedRoleAnalysis = useMemo(() => {
    if (analyses.length === 0) return null;
    return analyses.find(analysis => analysis.roleId === selectedRoleId) || analyses[0];
  }, [analyses, selectedRoleId]);

  const selectedRole = useMemo(() => {
    return ROLES.find(role => role.id === selectedRoleId) || ROLES[0];
  }, [selectedRoleId]);

  const getReadinessColor = (label: string) => {
    switch (label) {
      case 'Not Ready': return 'text-red-400 bg-red-500/10 border-red-500/25';
      case 'Developing': return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      case 'Almost Ready': return 'text-blue-400 bg-blue-500/10 border-blue-500/25';
      case 'Job Ready': return 'text-green-400 bg-green-500/10 border-green-500/25';
      default: return 'text-brand-textSec bg-brand-elevated border-brand-border';
    }
  };

  if (extractedSkills.length === 0) {
    return (
      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-brand-textTer mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-brand-textPri mb-2">Skill Gap Analysis</h3>
          <p className="text-sm text-brand-textSec">Upload and analyze a resume first to see skill gap analysis.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-textPri/20 bg-brand-textPri/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-textPri mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            Skill Gap Analysis
          </div>
          <h2 className="text-2xl font-bold text-brand-textPri mb-2">How your skills match top engineering roles</h2>
          <p className="text-sm text-brand-textSec">Based on your extracted skills, choose a role and compare your strengths to that position.</p>
        </div>
      </section>

      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="mb-5">
          <label htmlFor="role-select" className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer block mb-3">
            Choose a role
          </label>
          <div className="relative inline-block min-w-[240px]">
            <select
              id="role-select"
              value={selectedRoleId}
              onChange={(event) => onRoleChange(event.target.value)}
              className="w-full appearance-none rounded-[18px] border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-textPri outline-none transition focus:border-brand-textPri"
              aria-label="Select role for skill gap analysis"
            >
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-brand-textTer">
              ▼
            </span>
          </div>
        </div>

        {selectedRoleAnalysis && (
          <div className="rounded-[20px] border border-brand-border bg-brand-elevated p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer">Selected Role</div>
                <h3 className="mt-2 text-xl font-bold text-brand-textPri">{selectedRole.icon} {selectedRole.title}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${getReadinessColor(selectedRoleAnalysis.readinessLabel)}`}>
                  {selectedRoleAnalysis.readinessLabel}
                </div>
                <div className="text-5xl font-black text-brand-textPri">{selectedRoleAnalysis.readinessScore}%</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[18px] border border-brand-border bg-brand-surface p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-brand-textTer mb-2">Required skills matched</div>
                <div className="text-2xl font-bold text-brand-textPri">{selectedRoleAnalysis.matchedRequired.length} / {selectedRole.requiredSkills.length}</div>
              </div>
              <div className="rounded-[18px] border border-brand-border bg-brand-surface p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-brand-textTer mb-2">Bonus skills matched</div>
                <div className="text-2xl font-bold text-brand-textPri">{selectedRoleAnalysis.matchedNiceToHave.length} / {selectedRole.niceToHaveSkills.length}</div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[{
                label: 'Required match ratio',
                value: selectedRoleAnalysis.matchedRequired.length / selectedRole.requiredSkills.length,
                color: 'bg-brand-textPri',
              }, {
                label: 'Bonus match ratio',
                value: selectedRole.niceToHaveSkills.length > 0 ? selectedRoleAnalysis.matchedNiceToHave.length / selectedRole.niceToHaveSkills.length : 0,
                color: 'bg-blue-400',
              }].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-brand-textTer mb-2">
                    <span>{item.label}</span>
                    <span>{Math.round(item.value * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-brand-surface">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.value * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-brand-textPri mb-2">Skills you have</div>
                <div className="flex flex-wrap gap-2">
                  {selectedRoleAnalysis.matchedRequired.map(skill => (
                    <span key={skill} className="inline-block rounded-full bg-green-500/10 border border-green-500/25 text-green-400 px-2 py-1 text-xs">
                      {skill}
                    </span>
                  ))}
                  {selectedRoleAnalysis.matchedNiceToHave.map(skill => (
                    <span key={skill} className="inline-block rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 px-2 py-1 text-xs">
                      {skill} <span className="opacity-75">bonus</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-brand-textPri mb-2">Skills to develop</div>
                <div className="flex flex-wrap gap-2">
                  {selectedRoleAnalysis.missingRequired.map(skill => (
                    <span key={skill} className="inline-block rounded-full bg-red-500/10 border border-red-500/25 text-red-400 px-2 py-1 text-xs">
                      {skill} <span className="opacity-75">required</span>
                    </span>
                  ))}
                  {selectedRoleAnalysis.missingNiceToHave.map(skill => (
                    <span key={skill} className="inline-block rounded-full bg-gray-500/10 border border-gray-500/25 text-gray-400 px-2 py-1 text-xs">
                      {skill} <span className="opacity-75">nice to have</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Best Match Banner */}
      {bestMatch && (
        <section className="glass-panel card-float rounded-[30px] p-6">
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-textTer mb-2">Your Best Match</div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl">{ROLES.find(r => r.id === bestMatch.roleId)?.icon}</span>
              <h3 className="text-2xl font-bold text-brand-textPri">{ROLES.find(r => r.id === bestMatch.roleId)?.title}</h3>
            </div>
            <div className="text-6xl font-black text-brand-textPri mb-2">{bestMatch.readinessScore}</div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getReadinessColor(bestMatch.readinessLabel)}`}>
              {bestMatch.readinessLabel}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}