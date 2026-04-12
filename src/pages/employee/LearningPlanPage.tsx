import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import LearningPlanSection from '../../components/LearningPlanSection';

type EmployeeSkillRow = {
  id: string;
  skills?: { name?: string } | null;
};

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

const SKILL_ALIASES: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'ml': 'machine learning',
  'node': 'node.js',
  'react.js': 'react',
  'postgres': 'sql',
  'postgresql': 'sql',
  'mysql': 'sql',
  'sqlite': 'sql',
  'tensorflow 2': 'tensorflow',
  'tf': 'tensorflow',
  'pytorch lightning': 'pytorch',
  'k8s': 'kubernetes',
  'amazon web services': 'aws',
  'gcp': 'gcp',
  'google cloud': 'gcp',
  'bash scripting': 'bash',
  'shell': 'bash',
  'shell scripting': 'bash',
  'ci/cd pipelines': 'ci/cd',
  'github actions': 'ci/cd',
  'gitlab ci': 'ci/cd',
  'vuejs': 'vue',
  'vue.js': 'vue',
  'ios': 'swift',
  'android': 'kotlin',
};

function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().trim();
  return SKILL_ALIASES[lower] || lower;
}

interface RoleAnalysis {
  roleId: string;
  matchedRequired: string[];
  missingRequired: string[];
  matchedNiceToHave: string[];
  missingNiceToHave: string[];
  readinessScore: number;
  readinessLabel: 'Not Ready' | 'Developing' | 'Almost Ready' | 'Job Ready';
}

function analyzeSkillGap(extractedSkills: string[], role: Role): RoleAnalysis {
  const normalizedExtracted = extractedSkills.map(normalizeSkill);
  const normalizedRequired = role.requiredSkills.map(normalizeSkill);
  const normalizedNiceToHave = role.niceToHaveSkills.map(normalizeSkill);

  const matchedRequired = normalizedRequired.filter(skill => normalizedExtracted.includes(skill));
  const missingRequired = normalizedRequired.filter(skill => !normalizedExtracted.includes(skill));
  const matchedNiceToHave = normalizedNiceToHave.filter(skill => normalizedExtracted.includes(skill));
  const missingNiceToHave = normalizedNiceToHave.filter(skill => !normalizedExtracted.includes(skill));

  const requiredRatio = normalizedRequired.length > 0 ? matchedRequired.length / normalizedRequired.length : 0;
  const niceRatio = normalizedNiceToHave.length > 0 ? matchedNiceToHave.length / normalizedNiceToHave.length : 0;
  const score = Math.round((requiredRatio * 0.75 + niceRatio * 0.25) * 100);

  let readinessLabel: 'Not Ready' | 'Developing' | 'Almost Ready' | 'Job Ready';
  if (score < 30) readinessLabel = 'Not Ready';
  else if (score < 60) readinessLabel = 'Developing';
  else if (score < 85) readinessLabel = 'Almost Ready';
  else readinessLabel = 'Job Ready';

  return {
    roleId: role.id,
    matchedRequired,
    missingRequired,
    matchedNiceToHave,
    missingNiceToHave,
    readinessScore: score,
    readinessLabel,
  };
}

export default function LearningPlanPage() {
  const { user } = useAuth();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(ROLES[0].id);

  const { data: skills = [] } = useQuery({
    queryKey: ['employee-skills', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as EmployeeSkillRow[];
      const { data } = await supabase
        .from('employee_skills')
        .select('id, skills(name)')
        .eq('employee_id', user.id);
      return (data as EmployeeSkillRow[]) || [];
    },
    enabled: !!user?.id,
  });

  const extractedSkills = useMemo(
    () => skills.flatMap((skill) => (skill.skills?.name ? [skill.skills.name] : [])),
    [skills]
  );

  const allRoleAnalyses = useMemo(() => {
    if (extractedSkills.length === 0) return [];
    return ROLES.map(role => analyzeSkillGap(extractedSkills, role));
  }, [extractedSkills]);

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden rounded-[32px] p-6 md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-textPri/55 to-transparent" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-textPri/20 bg-brand-textPri/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-textPri">
              <BookOpen className="h-3.5 w-3.5" />
              Learning Plan
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.03em]">Learning Path</h2>
            <p className="mt-2 text-sm text-brand-textSec max-w-xl">
              Generate a personalized study roadmap based on your current skills and target role.
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <Sparkles className="h-4 w-4 text-brand-textPri" />
            <span className="text-xs uppercase tracking-[0.22em] text-brand-textTer">Rule-based learning plan</span>
          </div>
        </div>
      </section>

      <LearningPlanSection
        extractedSkills={extractedSkills}
        allRoleAnalyses={allRoleAnalyses}
        selectedRoleId={selectedRoleId}
        onRoleChange={setSelectedRoleId}
      />
    </div>
  );
}
