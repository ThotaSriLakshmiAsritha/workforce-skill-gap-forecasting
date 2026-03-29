/**
 * SkillSync AI – Score Calculator Utilities
 * Simulates AI logic using weighted scoring functions
 */

// Calculate gap score between current skills and required future skills
export function calculateGapScore(currentSkills, futureSkills) {
  if (!futureSkills || futureSkills.length === 0) return 0;
  const matched = futureSkills.filter(fs =>
    currentSkills.some(cs => cs.toLowerCase() === fs.toLowerCase())
  ).length;
  const gap = ((futureSkills.length - matched) / futureSkills.length) * 100;
  return Math.round(gap);
}

// Calculate future readiness score (inverse of gap, weighted by experience)
export function calcFutureScore(employee) {
  const { gapScore, experience } = employee;
  const expWeight = experience === 'Advanced' ? 1.2 : experience === 'Intermediate' ? 1.0 : 0.8;
  const base = Math.max(0, 100 - gapScore);
  return Math.min(100, Math.round(base * expWeight));
}

// Get gap severity label
export function getGapSeverity(score) {
  if (score < 35) return 'Low';
  if (score < 65) return 'Medium';
  return 'Critical';
}

// Get recommended courses based on skill gaps
export function getRecommendedCourses(employee, courses) {
  const { futureSkills, skills: currentSkills } = employee;
  const missingSkills = futureSkills.filter(fs =>
    !currentSkills.some(cs => cs.toLowerCase() === fs.toLowerCase())
  );
  const recommended = courses.filter(course =>
    missingSkills.some(ms =>
      course.skillGained.toLowerCase().includes(ms.toLowerCase()) ||
      ms.toLowerCase().includes(course.skillGained.toLowerCase())
    )
  );
  // Add top general courses if few matches
  if (recommended.length < 3) {
    courses.slice(0, 3).forEach(c => {
      if (!recommended.find(r => r.id === c.id)) recommended.push(c);
    });
  }
  return recommended.slice(0, 6);
}

// Predict top skill gaps for given industry / company profile
export function predictSkillGaps(industry, companySize, growthTarget) {
  const predictions = {
    IT: [
      { skill: 'Generative AI / LLMs', risk: 92, horizon: '1yr', action: 'Reskill' },
      { skill: 'MLOps & AIOps', risk: 85, horizon: '1yr', action: 'Reskill' },
      { skill: 'Kubernetes & Platform Eng.', risk: 78, horizon: '2yr', action: 'Upskill' },
      { skill: 'Zero Trust Security', risk: 74, horizon: '2yr', action: 'Hire + Upskill' },
      { skill: 'Quantum Algorithms', risk: 60, horizon: '5yr', action: 'Watch & Plan' },
    ],
    Finance: [
      { skill: 'AI-driven Risk Analytics', risk: 88, horizon: '1yr', action: 'Reskill' },
      { skill: 'Blockchain & DeFi', risk: 80, horizon: '2yr', action: 'Upskill' },
      { skill: 'RPA & Hyperautomation', risk: 76, horizon: '1yr', action: 'Hire' },
      { skill: 'Predictive Compliance', risk: 70, horizon: '3yr', action: 'Upskill' },
      { skill: 'Quantum Cryptography', risk: 55, horizon: '5yr', action: 'Watch & Plan' },
    ],
    Healthcare: [
      { skill: 'AI-assisted Diagnostics', risk: 90, horizon: '1yr', action: 'Hire' },
      { skill: 'Health Data Analytics', risk: 84, horizon: '1yr', action: 'Reskill' },
      { skill: 'IoMT Security', risk: 75, horizon: '2yr', action: 'Upskill' },
      { skill: 'NLP for Clinical Notes', risk: 68, horizon: '2yr', action: 'Reskill' },
      { skill: 'Genomic Data Science', risk: 58, horizon: '5yr', action: 'Watch & Plan' },
    ],
    Manufacturing: [
      { skill: 'AI Quality Control', risk: 91, horizon: '1yr', action: 'Hire + Reskill' },
      { skill: 'Digital Twin Engineering', risk: 82, horizon: '2yr', action: 'Upskill' },
      { skill: 'Industrial IoT', risk: 78, horizon: '1yr', action: 'Reskill' },
      { skill: '6G & Edge Networking', risk: 65, horizon: '3yr', action: 'Watch & Plan' },
      { skill: 'Autonomous Robotics', risk: 60, horizon: '5yr', action: 'Hire' },
    ],
    Education: [
      { skill: 'AI-personalized Learning', risk: 87, horizon: '1yr', action: 'Reskill' },
      { skill: 'EdTech Platform Dev', risk: 78, horizon: '2yr', action: 'Hire' },
      { skill: 'Data-driven Curriculum', risk: 72, horizon: '2yr', action: 'Upskill' },
      { skill: 'VR/AR Immersive Education', risk: 65, horizon: '3yr', action: 'Watch & Plan' },
      { skill: 'Adaptive Assessment AI', risk: 58, horizon: '5yr', action: 'Partnership' },
    ],
  };
  const base = predictions[industry] || predictions['IT'];
  // Adjust risk scores based on growth target
  const multiplier = growthTarget === 'Aggressive' ? 1.1 : growthTarget === 'Conservative' ? 0.9 : 1;
  return base.map(p => ({ ...p, risk: Math.min(100, Math.round(p.risk * multiplier)) }));
}

// Generate learning path stages
export function generateLearningPath(employee, courses) {
  const rec = getRecommendedCourses(employee, courses);
  const beginnerCourses = rec.filter(c => c.difficulty === 'Beginner').slice(0, 2);
  const intermediateCourses = rec.filter(c => c.difficulty === 'Intermediate').slice(0, 2);
  const advancedCourses = rec.filter(c => c.difficulty === 'Advanced').slice(0, 2);
  return [
    { stage: 'Beginner', courses: beginnerCourses, color: 'green' },
    { stage: 'Intermediate', courses: intermediateCourses, color: 'yellow' },
    { stage: 'Advanced', courses: advancedCourses, color: 'red' },
  ];
}
