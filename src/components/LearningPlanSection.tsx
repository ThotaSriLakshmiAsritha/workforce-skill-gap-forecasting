import { useMemo, useState } from 'react';
import { BookOpen, Target, Clock, CheckCircle2, ChevronDown, ChevronUp, Copy, ExternalLink } from 'lucide-react';

// Types
interface RoleAnalysis {
  roleId: string;
  matchedRequired: string[];
  missingRequired: string[];
  matchedNiceToHave: string[];
  missingNiceToHave: string[];
  readinessScore: number;
  readinessLabel: 'Not Ready' | 'Developing' | 'Almost Ready' | 'Job Ready';
}

interface LearningResource {
  skill: string;
  estimatedHours: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  phase: "Foundation" | "Core" | "Specialization";
  prerequisites: string[];
  resources: {
    title: string;
    type: "Course" | "Documentation" | "Practice" | "Book" | "Project";
    provider: string;
    url: string;
    free: boolean;
    durationHours?: number;
  }[];
  milestones: string[];
  projectIdea: string;
}

interface LearningPlan {
  targetRole: string;
  targetRoleId: string;
  totalEstimatedWeeks: number;
  totalEstimatedHours: number;
  phases: LearningPhase[];
  prioritySkillsCount: number;
  bonusSkillsCount: number;
}

interface LearningPhase {
  name: "Foundation" | "Core" | "Specialization";
  weekStart: number;
  weekEnd: number;
  skills: LearningStep[];
}

interface LearningStep {
  skill: string;
  isRequired: boolean;
  isPrerequisite: boolean;
  estimatedHours: number;
  weekStart: number;
  weekEnd: number;
  difficulty: string;
  resources: LearningResource["resources"];
  milestones: string[];
  projectIdea: string;
}

const ROLE_TITLES: Record<string, string> = {
  'full-stack-engineer': 'Full Stack Engineer',
  'ml-engineer': 'ML Engineer',
  'data-scientist': 'Data Scientist',
  'cybersecurity-analyst': 'Cybersecurity Analyst',
  'devops-engineer': 'DevOps Engineer',
  'mobile-engineer': 'Mobile Engineer',
  'backend-engineer': 'Backend Engineer',
};

// Static Learning Resources Database
const LEARNING_RESOURCES: Record<string, LearningResource> = {
  "javascript": {
    skill: "javascript",
    estimatedHours: 60,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: ["html", "css"],
    resources: [
      { title: "The Odin Project", type: "Course", provider: "theodinproject.com", url: "https://www.theodinproject.com/paths/foundations", free: true },
      { title: "JavaScript.info", type: "Documentation", provider: "javascript.info", url: "https://javascript.info/", free: true },
      { title: "Eloquent JavaScript", type: "Book", provider: "eloquentjavascript.net", url: "https://eloquentjavascript.net/", free: true }
    ],
    milestones: ["Build a DOM-manipulation to-do app", "Understand async/await and promises", "Pass 20 Codewars katas"],
    projectIdea: "Build a weather dashboard using the Open-Meteo free API"
  },
  "typescript": {
    skill: "typescript",
    estimatedHours: 30,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["javascript"],
    resources: [
      { title: "TypeScript Official Docs", type: "Documentation", provider: "typescriptlang.org", url: "https://www.typescriptlang.org/docs/", free: true },
      { title: "Execute Program — TypeScript", type: "Course", provider: "executeprogram.com", url: "https://www.executeprogram.com/courses/typescript", free: false }
    ],
    milestones: ["Type a full CRUD REST client", "Use generics in 3 real functions", "Migrate a JS project to TS"],
    projectIdea: "Rewrite an existing JS project in TypeScript with strict mode enabled"
  },
  "react": {
    skill: "react",
    estimatedHours: 40,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["javascript", "html", "css"],
    resources: [
      { title: "React Official Docs (react.dev)", type: "Documentation", provider: "react.dev", url: "https://react.dev/", free: true },
      { title: "Scrimba React Course", type: "Course", provider: "scrimba.com", url: "https://scrimba.com/learn/learnreact", free: true }
    ],
    milestones: ["Build CRUD app with useState/useEffect", "Implement React Router", "Use Context API or Zustand for state"],
    projectIdea: "Build a multi-page personal finance tracker"
  },
  "node.js": {
    skill: "node.js",
    estimatedHours: 35,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["javascript"],
    resources: [
      { title: "Node.js Official Docs", type: "Documentation", provider: "nodejs.org", url: "https://nodejs.org/en/docs/", free: true },
      { title: "The Odin Project — NodeJS", type: "Course", provider: "theodinproject.com", url: "https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs", free: true }
    ],
    milestones: ["Build an Express REST API with 5 endpoints", "Connect to a database", "Add JWT authentication"],
    projectIdea: "Build a REST API for a blog platform with auth"
  },
  "python": {
    skill: "python",
    estimatedHours: 45,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: [],
    resources: [
      { title: "Python.org Official Tutorial", type: "Documentation", provider: "docs.python.org", url: "https://docs.python.org/3/tutorial/", free: true },
      { title: "Automate the Boring Stuff", type: "Book", provider: "automatetheboringstuff.com", url: "https://automatetheboringstuff.com/", free: true },
      { title: "CS50P", type: "Course", provider: "cs50.harvard.edu", url: "https://cs50.harvard.edu/python/2022/", free: true }
    ],
    milestones: ["Write scripts automating 3 file tasks", "Build a CLI tool", "Use classes and exceptions correctly"],
    projectIdea: "Build a CLI expense tracker that reads/writes CSV"
  },
  "machine learning": {
    skill: "machine learning",
    estimatedHours: 80,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["python", "numpy", "pandas", "statistics"],
    resources: [
      { title: "fast.ai Practical Deep Learning", type: "Course", provider: "fast.ai", url: "https://course.fast.ai/", free: true },
      { title: "Hands-On ML with Scikit-Learn — Aurélien Géron", type: "Book", provider: "oreilly.com", url: "https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/", free: false },
      { title: "Kaggle Learn — Intro to ML", type: "Course", provider: "kaggle.com", url: "https://www.kaggle.com/learn/intro-to-machine-learning", free: true }
    ],
    milestones: ["Train and evaluate 3 classification models", "Understand bias-variance tradeoff", "Submit a Kaggle competition"],
    projectIdea: "Build a house price predictor with feature engineering and cross-validation"
  },
  "docker": {
    skill: "docker",
    estimatedHours: 20,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["linux", "bash"],
    resources: [
      { title: "Docker Official Docs", type: "Documentation", provider: "docs.docker.com", url: "https://docs.docker.com/", free: true },
      { title: "Play with Docker", type: "Practice", provider: "labs.play-with-docker.com", url: "https://labs.play-with-docker.com/", free: true }
    ],
    milestones: ["Containerize a full-stack app", "Write a multi-stage Dockerfile", "Use docker-compose for a 3-service setup"],
    projectIdea: "Dockerize an existing Node.js + PostgreSQL app with docker-compose"
  },
  "kubernetes": {
    skill: "kubernetes",
    estimatedHours: 40,
    difficulty: "Advanced",
    phase: "Specialization",
    prerequisites: ["docker", "linux", "bash"],
    resources: [
      { title: "Kubernetes Official Docs", type: "Documentation", provider: "kubernetes.io", url: "https://kubernetes.io/docs/", free: true },
      { title: "KillerCoda interactive labs", type: "Practice", provider: "killercoda.com", url: "https://killercoda.com/", free: true },
      { title: "CKA Study Guide — Benjamin Muschko", type: "Book", provider: "oreilly.com", url: "https://www.oreilly.com/library/view/certified-kubernetes-administrator/9781492083733/", free: false }
    ],
    milestones: ["Deploy a 3-tier app on a local cluster", "Configure services, ingress, configmaps", "Set up HPA autoscaling"],
    projectIdea: "Deploy a microservices app on Minikube with Ingress and rolling updates"
  },
  "sql": {
    skill: "sql",
    estimatedHours: 25,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: [],
    resources: [
      { title: "SQLZoo", type: "Practice", provider: "sqlzoo.net", url: "https://sqlzoo.net/", free: true },
      { title: "Mode SQL Tutorial", type: "Course", provider: "mode.com", url: "https://mode.com/sql-tutorial/", free: true },
      { title: "PostgreSQL Official Docs", type: "Documentation", provider: "postgresql.org", url: "https://www.postgresql.org/docs/", free: true }
    ],
    milestones: ["Write 10 complex JOIN queries", "Design a normalized schema with 5 tables", "Use window functions in 3 queries"],
    projectIdea: "Design and query a database for an e-commerce order management system"
  },
  "aws": {
    skill: "aws",
    estimatedHours: 50,
    difficulty: "Intermediate",
    phase: "Specialization",
    prerequisites: ["linux", "bash", "networking basics"],
    resources: [
      { title: "AWS Free Tier Hands-On", type: "Practice", provider: "aws.amazon.com", url: "https://aws.amazon.com/free/", free: true },
      { title: "AWS Skill Builder", type: "Course", provider: "skillbuilder.aws", url: "https://skillbuilder.aws/", free: true },
      { title: "A Cloud Guru — AWS Solutions Architect", type: "Course", provider: "acloudguru.com", url: "https://acloudguru.com/course/aws-certified-solutions-architect-associate", free: false }
    ],
    milestones: ["Deploy a static site on S3 + CloudFront", "Launch an EC2 instance and SSH in", "Set up RDS and connect an app"],
    projectIdea: "Deploy a full-stack app to AWS using EC2, RDS, and S3"
  },
  "linux": {
    skill: "linux",
    estimatedHours: 20,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: [],
    resources: [
      { title: "The Linux Command Line — William Shotts", type: "Book", provider: "linuxcommand.org", url: "http://linuxcommand.org/tlcl.php", free: true },
      { title: "OverTheWire Bandit", type: "Practice", provider: "overthewire.org", url: "https://overthewire.org/wargames/bandit/", free: true }
    ],
    milestones: ["Navigate filesystem and manage permissions", "Write 5 shell scripts", "Set up a web server on a fresh VM"],
    projectIdea: "Set up a LAMP stack on a fresh Ubuntu server from scratch"
  },
  "git": {
    skill: "git",
    estimatedHours: 10,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: [],
    resources: [
      { title: "Pro Git Book", type: "Book", provider: "git-scm.com", url: "https://git-scm.com/book/en/v2", free: true },
      { title: "Learn Git Branching", type: "Practice", provider: "learngitbranching.js.app", url: "https://learngitbranching.js.org/", free: true }
    ],
    milestones: ["Use branching and merging in a team workflow", "Resolve 3 merge conflicts", "Set up a GitHub Actions workflow"],
    projectIdea: "Contribute to an open-source repo with a proper PR and branch strategy"
  },
  "ci/cd": {
    skill: "ci/cd",
    estimatedHours: 20,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["git", "docker"],
    resources: [
      { title: "GitHub Actions Docs", type: "Documentation", provider: "docs.github.com", url: "https://docs.github.com/en/actions", free: true },
      { title: "GitLab CI Tutorial", type: "Documentation", provider: "docs.gitlab.com", url: "https://docs.gitlab.com/ee/ci/", free: true }
    ],
    milestones: ["Set up a pipeline with lint, test, build stages", "Auto-deploy to a staging environment", "Add secrets management"],
    projectIdea: "Set up a full CI/CD pipeline for a Node.js app with GitHub Actions"
  },
  "tensorflow": {
    skill: "tensorflow",
    estimatedHours: 35,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["python", "machine learning", "numpy"],
    resources: [
      { title: "TensorFlow Official Tutorials", type: "Documentation", provider: "tensorflow.org", url: "https://www.tensorflow.org/tutorials", free: true },
      { title: "Coursera Deep Learning Specialization", type: "Course", provider: "coursera.org", url: "https://www.coursera.org/specializations/deep-learning", free: false }
    ],
    milestones: ["Train a CNN on MNIST", "Build a custom training loop", "Save, load, and serve a model"],
    projectIdea: "Build an image classifier for a custom 5-class dataset"
  },
  "pytorch": {
    skill: "pytorch",
    estimatedHours: 35,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["python", "machine learning", "numpy"],
    resources: [
      { title: "PyTorch Official Tutorials", type: "Documentation", provider: "pytorch.org", url: "https://pytorch.org/tutorials/", free: true },
      { title: "fast.ai Course", type: "Course", provider: "fast.ai", url: "https://course.fast.ai/", free: true }
    ],
    milestones: ["Implement a neural net from scratch", "Use DataLoader for custom dataset", "Fine-tune a pretrained model"],
    projectIdea: "Fine-tune a HuggingFace model on a custom text classification task"
  },
  "network security": {
    skill: "network security",
    estimatedHours: 50,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["linux", "tcp/ip"],
    resources: [
      { title: "CompTIA Security+ Study Guide", type: "Book", provider: "comptia.org", url: "https://www.comptia.org/training/books/security-sy0-701-study-guide", free: false },
      { title: "Professor Messer Security+", type: "Course", provider: "professormesser.com", url: "https://www.youtube.com/c/ProfessorMesser", free: true },
      { title: "TryHackMe — Pre-Security Path", type: "Practice", provider: "tryhackme.com", url: "https://tryhackme.com/path/presecurity", free: true }
    ],
    milestones: ["Analyze a pcap with Wireshark", "Set up a firewall ruleset", "Complete 10 TryHackMe rooms"],
    projectIdea: "Set up a home lab with pfSense and monitor traffic with Wireshark"
  },
  "penetration testing": {
    skill: "penetration testing",
    estimatedHours: 60,
    difficulty: "Advanced",
    phase: "Specialization",
    prerequisites: ["linux", "network security", "python"],
    resources: [
      { title: "Hack The Box Academy", type: "Practice", provider: "academy.hackthebox.com", url: "https://academy.hackthebox.com/", free: true },
      { title: "The Web Application Hacker's Handbook", type: "Book", provider: "amazon.com", url: "https://www.amazon.com/Web-Application-Hackers-Handbook-Exploiting/dp/1118026470", free: false },
      { title: "TryHackMe — Jr Penetration Tester", type: "Course", provider: "tryhackme.com", url: "https://tryhackme.com/path/jrpentester", free: false }
    ],
    milestones: ["Complete 5 HackTheBox easy machines", "Perform a full recon-to-exploit on a CTF box", "Write a pentest report"],
    projectIdea: "Set up a vulnerable VM (VulnHub) and write a full penetration test report"
  },
  "terraform": {
    skill: "terraform",
    estimatedHours: 25,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: ["aws", "linux"],
    resources: [
      { title: "Terraform Official Tutorials", type: "Documentation", provider: "developer.hashicorp.com", url: "https://developer.hashicorp.com/terraform/tutorials", free: true },
      { title: "Terraform: Up & Running — Yevgeniy Brikman", type: "Book", provider: "oreilly.com", url: "https://www.oreilly.com/library/view/terraform-up-and/9781098116736/", free: false }
    ],
    milestones: ["Provision a VPC + EC2 with Terraform", "Use modules and variables", "Store state remotely in S3"],
    projectIdea: "Provision a 3-tier AWS infrastructure entirely via Terraform"
  },
  "numpy": {
    skill: "numpy",
    estimatedHours: 15,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: ["python"],
    resources: [
      { title: "NumPy Official Docs", type: "Documentation", provider: "numpy.org", url: "https://numpy.org/doc/stable/", free: true },
      { title: "Kaggle Learn — Python", type: "Course", provider: "kaggle.com", url: "https://www.kaggle.com/learn/pandas", free: true }
    ],
    milestones: ["Perform array slicing and broadcasting", "Implement linear algebra operations", "Vectorize a loop-based computation"],
    projectIdea: "Implement a simple neural network forward pass using only NumPy"
  },
  "pandas": {
    skill: "pandas",
    estimatedHours: 20,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: ["python", "numpy"],
    resources: [
      { title: "Pandas Official Docs", type: "Documentation", provider: "pandas.pydata.org", url: "https://pandas.pydata.org/docs/", free: true },
      { title: "Kaggle Learn — Pandas", type: "Course", provider: "kaggle.com", url: "https://www.kaggle.com/learn/pandas", free: true }
    ],
    milestones: ["Clean a messy real-world CSV dataset", "Perform groupby aggregations", "Merge 3 DataFrames correctly"],
    projectIdea: "Analyze a public dataset (e.g. NYC taxi trips) and produce 5 business insights"
  },
  "statistics": {
    skill: "statistics",
    estimatedHours: 30,
    difficulty: "Intermediate",
    phase: "Foundation",
    prerequisites: [],
    resources: [
      { title: "StatQuest with Josh Starmer", type: "Course", provider: "youtube.com/statquest", url: "https://www.youtube.com/c/joshstarmer", free: true },
      { title: "Think Stats — Allen Downey", type: "Book", provider: "greenteapress.com", url: "https://www.greenteapress.com/thinkstats/", free: true }
    ],
    milestones: ["Explain p-values and confidence intervals", "Run a hypothesis test on real data", "Calculate and interpret correlation vs causation"],
    projectIdea: "Run an A/B test simulation on a synthetic e-commerce dataset"
  },
  "swift": {
    skill: "swift",
    estimatedHours: 45,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: [],
    resources: [
      { title: "Swift.org Official Docs", type: "Documentation", provider: "swift.org", url: "https://docs.swift.org/swift-book/", free: true },
      { title: "100 Days of SwiftUI — Paul Hudson", type: "Course", provider: "hackingwithswift.com", url: "https://www.hackingwithswift.com/100/swiftui", free: true }
    ],
    milestones: ["Build a SwiftUI app with navigation", "Persist data with CoreData", "Consume a REST API"],
    projectIdea: "Build a habit tracker iOS app with local notifications"
  },
  "kotlin": {
    skill: "kotlin",
    estimatedHours: 40,
    difficulty: "Intermediate",
    phase: "Core",
    prerequisites: [],
    resources: [
      { title: "Kotlin Official Docs", type: "Documentation", provider: "kotlinlang.org", url: "https://kotlinlang.org/docs/", free: true },
      { title: "Android Basics with Compose — Google", type: "Course", provider: "developer.android.com", url: "https://developer.android.com/courses/kotlin-android-fundamentals/overview", free: true }
    ],
    milestones: ["Build a Jetpack Compose UI app", "Handle lifecycle and ViewModel", "Consume a REST API with Retrofit"],
    projectIdea: "Build a news reader Android app using Retrofit + Jetpack Compose"
  },
  "html": {
    skill: "html",
    estimatedHours: 15,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: [],
    resources: [
      { title: "MDN HTML Guide", type: "Documentation", provider: "developer.mozilla.org", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", free: true },
      { title: "The Odin Project — Foundations", type: "Course", provider: "theodinproject.com", url: "https://www.theodinproject.com/paths/foundations/courses/foundations", free: true }
    ],
    milestones: ["Mark up a full webpage semantically", "Build accessible forms", "Understand the DOM tree"],
    projectIdea: "Build a semantic personal portfolio page, no frameworks"
  },
  "css": {
    skill: "css",
    estimatedHours: 20,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: ["html"],
    resources: [
      { title: "CSS Tricks Complete Guide to Flexbox", type: "Documentation", provider: "css-tricks.com", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", free: true },
      { title: "Kevin Powell on YouTube", type: "Course", provider: "youtube.com", url: "https://www.youtube.com/kepowob", free: true }
    ],
    milestones: ["Build a responsive layout with Flexbox/Grid", "Implement a dark mode toggle", "Animate 3 UI elements"],
    projectIdea: "Build a fully responsive landing page from a Figma-style wireframe"
  },
  "bash": {
    skill: "bash",
    estimatedHours: 15,
    difficulty: "Beginner",
    phase: "Foundation",
    prerequisites: ["linux"],
    resources: [
      { title: "Bash Guide — mywiki.wooledge.org", type: "Documentation", provider: "mywiki.wooledge.org", url: "https://mywiki.wooledge.org/BashGuide", free: true },
      { title: "ShellCheck linter", type: "Practice", provider: "shellcheck.net", url: "https://www.shellcheck.net/", free: true }
    ],
    milestones: ["Write scripts for backups, log rotation, cron jobs", "Use pipes and redirections fluently", "Debug a broken script with set -x"],
    projectIdea: "Write a bash script that monitors disk usage and sends an email alert"
  }
};

// Normalize skill name
function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().trim();
  const aliases: Record<string, string> = {
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
  return aliases[lower] || lower;
}

// Generate learning plan
function generateLearningPlan(
  extractedSkills: string[],
  allRoleAnalyses: RoleAnalysis[],
  selectedRoleId?: string
): LearningPlan {
  if (extractedSkills.length === 0 || allRoleAnalyses.length === 0) {
    throw new Error('No data available');
  }

  // Step 1: Determine target role
  let targetAnalysis: RoleAnalysis;
  if (selectedRoleId) {
    targetAnalysis = allRoleAnalyses.find(a => a.roleId === selectedRoleId)!;
  } else {
    targetAnalysis = allRoleAnalyses.reduce((best, current) =>
      current.readinessScore > best.readinessScore ? current : best
    );
  }

  // Get role title
  const ROLES: Record<string, string> = {
    'full-stack-engineer': 'Full Stack Engineer',
    'ml-engineer': 'ML Engineer',
    'data-scientist': 'Data Scientist',
    'cybersecurity-analyst': 'Cybersecurity Analyst',
    'devops-engineer': 'DevOps Engineer',
    'mobile-engineer': 'Mobile Engineer',
    'backend-engineer': 'Backend Engineer',
  };

  // Step 2: Collect skills to learn
  const primarySkills = targetAnalysis.missingRequired;
  const bonusSkills = targetAnalysis.missingNiceToHave;

  // Step 3: Resolve prerequisites
  const normalizedExtracted = extractedSkills.map(normalizeSkill);
  const orderedSkills: string[] = [];
  const addedSkills = new Set<string>();

  const addSkillWithPrereqs = (skill: string) => {
    if (addedSkills.has(skill)) return;
    const resource = LEARNING_RESOURCES[normalizeSkill(skill)];
    if (resource) {
      resource.prerequisites.forEach(prereq => {
        if (!normalizedExtracted.includes(normalizeSkill(prereq)) && !primarySkills.includes(prereq)) {
          addSkillWithPrereqs(prereq);
        }
      });
    }
    orderedSkills.push(skill);
    addedSkills.add(skill);
  };

  primarySkills.forEach(skill => addSkillWithPrereqs(skill));
  bonusSkills.forEach(skill => addSkillWithPrereqs(skill));

  // Step 4: Assign phases and weeks
  const phaseGroups = orderedSkills.reduce((groups, skill) => {
    const resource = LEARNING_RESOURCES[normalizeSkill(skill)];
    const phase = resource?.phase || 'Core';
    if (!groups[phase]) groups[phase] = [];
    groups[phase].push(skill);
    return groups;
  }, {} as Record<string, string[]>);

  const phases: LearningPhase[] = [];
  let runningWeeks = 0;

  ['Foundation', 'Core', 'Specialization'].forEach(phaseName => {
    const skills = phaseGroups[phaseName] || [];
    if (skills.length === 0) return;

    const phaseSkills: LearningStep[] = skills.map(skill => {
      const resource = LEARNING_RESOURCES[normalizeSkill(skill)];
      const hours = resource?.estimatedHours || 20;
      const weeks = Math.ceil(hours / 10);
      const step: LearningStep = {
        skill,
        isRequired: primarySkills.includes(skill),
        isPrerequisite: !primarySkills.includes(skill) && !bonusSkills.includes(skill),
        estimatedHours: hours,
        weekStart: runningWeeks + 1,
        weekEnd: runningWeeks + weeks,
        difficulty: resource?.difficulty || 'Intermediate',
        resources: resource?.resources || [],
        milestones: resource?.milestones || [],
        projectIdea: resource?.projectIdea || `Build a small project using ${skill} to solidify your understanding.`
      };
      runningWeeks += weeks;
      return step;
    });

    phases.push({
      name: phaseName as "Foundation" | "Core" | "Specialization",
      weekStart: phaseSkills[0].weekStart,
      weekEnd: phaseSkills[phaseSkills.length - 1].weekEnd,
      skills: phaseSkills
    });
  });

  const totalHours = orderedSkills.reduce((sum, skill) => {
    const resource = LEARNING_RESOURCES[normalizeSkill(skill)];
    return sum + (resource?.estimatedHours || 20);
  }, 0);

  return {
    targetRole: ROLES[targetAnalysis.roleId] || targetAnalysis.roleId,
    targetRoleId: targetAnalysis.roleId,
    totalEstimatedWeeks: runningWeeks,
    totalEstimatedHours: totalHours,
    phases,
    prioritySkillsCount: primarySkills.length,
    bonusSkillsCount: bonusSkills.length
  };
}

// Component props
interface LearningPlanProps {
  extractedSkills: string[];
  allRoleAnalyses: RoleAnalysis[];
  selectedRoleId?: string;
  onRoleChange?: (roleId: string) => void;
}

// Main component
export default function LearningPlanSection({ extractedSkills, allRoleAnalyses, selectedRoleId, onRoleChange }: LearningPlanProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['Foundation']));
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  const plan = useMemo(() => {
    try {
      return generateLearningPlan(extractedSkills, allRoleAnalyses, selectedRoleId);
    } catch {
      return null;
    }
  }, [extractedSkills, allRoleAnalyses, selectedRoleId]);

  const togglePhase = (phaseName: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseName)) {
      newExpanded.delete(phaseName);
    } else {
      newExpanded.add(phaseName);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleSkill = (skillName: string) => {
    const newExpanded = new Set(expandedSkills);
    if (newExpanded.has(skillName)) {
      newExpanded.delete(skillName);
    } else {
      newExpanded.add(skillName);
    }
    setExpandedSkills(newExpanded);
  };

  const copySummary = () => {
    if (!plan) return;
    const summary = `Learning Plan for ${plan.targetRole}
Total: ~${plan.totalEstimatedWeeks} weeks · ${plan.totalEstimatedHours} hours

${plan.phases.map(phase => `${phase.name} (Week ${phase.weekStart}-${phase.weekEnd}):
${phase.skills.map(skill => `• ${skill.skill} (~${skill.estimatedHours}hrs) — Resources: ${skill.resources.slice(0, 2).map(r => r.title).join(', ')}`).join('\n')}`).join('\n\n')}`;

    navigator.clipboard.writeText(summary);
  };

  if (!plan) {
    return (
      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-brand-textTer mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-brand-textPri mb-2">Learning Plan</h3>
          <p className="text-sm text-brand-textSec">Complete your resume analysis and skill gap review first to generate your learning plan.</p>
        </div>
      </section>
    );
  }

  if (plan.phases.length === 0) {
    return (
      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-brand-textTer mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-brand-textPri mb-2">Ready for your target role</h3>
          <p className="text-sm text-brand-textSec">
            Your current skills already match {plan.targetRole}. No additional learning plan is needed for this role.
          </p>
        </div>
      </section>
    );
  }

  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + plan.totalEstimatedWeeks * 7);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand-textPri mb-2">Your Personalized Learning Roadmap</h2>
          <p className="text-sm text-brand-textSec">A structured plan to bridge your skill gaps and reach your target role.</p>
        </div>
      </section>

      {/* Role Selector */}
      {onRoleChange && (
        <section className="glass-panel card-float rounded-[30px] p-6">
          <div className="mb-4">
            <label htmlFor="learning-role-select" className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-textTer block mb-3">
              Choose target role for learning plan
            </label>
            <div className="relative inline-block min-w-[280px]">
              <select
                id="learning-role-select"
                value={selectedRoleId || ''}
                onChange={(event) => onRoleChange(event.target.value)}
                className="w-full appearance-none rounded-[18px] border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-textPri outline-none transition focus:border-brand-textPri"
                aria-label="Select target role for learning plan"
              >
                {allRoleAnalyses.map((analysis) => {
                  const role = ROLE_TITLES[analysis.roleId] || analysis.roleId;
                  return (
                    <option key={analysis.roleId} value={analysis.roleId}>
                      {role} ({analysis.readinessScore}%)
                    </option>
                  );
                })}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-brand-textTer">
                ▼
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Plan Summary */}
      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <Target className="h-6 w-6 text-brand-textTer mx-auto mb-2" />
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">Target Role</div>
            <div className="text-lg font-bold text-brand-textPri">{plan.targetRole}</div>
          </div>
          <div className="text-center">
            <Clock className="h-6 w-6 text-brand-textTer mx-auto mb-2" />
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">Total Time</div>
            <div className="text-lg font-bold text-brand-textPri">~{plan.totalEstimatedWeeks} weeks</div>
            <div className="text-xs text-brand-textSec">{plan.totalEstimatedHours} hrs</div>
          </div>
          <div className="text-center">
            <CheckCircle2 className="h-6 w-6 text-brand-textTer mx-auto mb-2" />
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">Skills to Learn</div>
            <div className="text-lg font-bold text-brand-textPri">{plan.prioritySkillsCount + plan.bonusSkillsCount}</div>
            <div className="text-xs text-brand-textSec">{plan.prioritySkillsCount} required · {plan.bonusSkillsCount} bonus</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-textTer">Est. Completion</div>
            <div className="text-lg font-bold text-brand-textPri">{completionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
      </section>

      {/* Phases */}
      {plan.phases.map(phase => (
        <section key={phase.name} className="glass-panel card-float rounded-[30px] overflow-hidden">
          <button
            onClick={() => togglePhase(phase.name)}
            className="w-full flex items-center justify-between p-6 border-b border-brand-border hover:bg-brand-surface transition"
            aria-expanded={expandedPhases.has(phase.name)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                phase.name === 'Foundation' ? 'bg-amber-400' :
                phase.name === 'Core' ? 'bg-blue-400' : 'bg-purple-400'
              }`} />
              <h3 className="text-xl font-bold text-brand-textPri">{phase.name}</h3>
              <span className="text-sm text-brand-textSec">Week {phase.weekStart}-{phase.weekEnd}</span>
              <span className="text-xs bg-brand-surface px-2 py-1 rounded-full">{phase.skills.length} skills</span>
            </div>
            {expandedPhases.has(phase.name) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {expandedPhases.has(phase.name) && (
            <div className="p-6 space-y-4">
              {phase.skills.map(skill => (
                <div key={skill.skill} className="border border-brand-border rounded-[20px] overflow-hidden">
                  <div className="p-4 border-b border-brand-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-brand-textPri">{skill.skill}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          skill.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-400' :
                          skill.difficulty === 'Intermediate' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-purple-500/10 text-purple-400'
                        }`}>{skill.difficulty}</span>
                        <span className="text-sm text-brand-textSec">Week {skill.weekStart}-{skill.weekEnd}</span>
                        <span className="text-sm text-brand-textSec">~{skill.estimatedHours} hrs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        skill.isRequired ? 'bg-red-500/10 text-red-400' :
                        skill.isPrerequisite ? 'bg-orange-500/10 text-orange-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>
                        {skill.isRequired ? 'Required' : skill.isPrerequisite ? 'Prerequisite' : 'Bonus'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-brand-surface rounded-full text-brand-textSec">{phase.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skill.resources.slice(0, 3).map((resource, i) => (
                        <a
                          key={i}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-brand-surface rounded-full hover:bg-brand-elevated transition"
                        >
                          {resource.title} · {resource.provider}
                          {resource.free ? <span className="text-green-400">Free</span> : <span className="text-amber-400">Paid</span>}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSkill(skill.skill)}
                    className="w-full p-4 text-left hover:bg-brand-surface transition"
                    aria-expanded={expandedSkills.has(skill.skill)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">View milestones & project</span>
                      {expandedSkills.has(skill.skill) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {expandedSkills.has(skill.skill) && (
                    <div className="px-4 pb-4 space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold mb-2">Milestones</h5>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-brand-textSec">
                          {skill.milestones.map((milestone, i) => (
                            <li key={i}>{milestone}</li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          💡 Project Idea
                        </h5>
                        <p className="text-sm text-brand-textSec">{skill.projectIdea}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Progress Tracker */}
      <section className="glass-panel card-float rounded-[30px] p-6">
        <h3 className="text-lg font-bold text-brand-textPri mb-4">Progress Timeline</h3>
        <div className="space-y-2">
          {plan.phases.map(phase => (
            <div key={phase.name} className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                phase.name === 'Foundation' ? 'bg-amber-400' :
                phase.name === 'Core' ? 'bg-blue-400' : 'bg-purple-400'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{phase.name}</span>
                  <span className="text-xs text-brand-textSec">Week {phase.weekStart}-{phase.weekEnd}</span>
                </div>
                <div className="relative h-2 bg-brand-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      phase.name === 'Foundation' ? 'bg-amber-400' :
                      phase.name === 'Core' ? 'bg-blue-400' : 'bg-purple-400'
                    }`}
                    style={{ width: `${(phase.weekEnd - phase.weekStart + 1) / plan.totalEstimatedWeeks * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Export */}
      <section className="glass-panel card-float rounded-[30px] p-6">
        <div className="text-center">
          <p className="text-sm text-brand-textSec mb-4">Copy this plan to your notes or share it with your manager.</p>
          <button
            onClick={copySummary}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-textPri text-black rounded-full hover:bg-brand-textPri/90 transition"
          >
            <Copy className="h-4 w-4" />
            Copy Summary
          </button>
        </div>
      </section>
    </div>
  );
}
