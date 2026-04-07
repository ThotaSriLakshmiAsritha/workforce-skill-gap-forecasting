export type UserRole = 'org_admin' | 'hr_manager' | 'team_lead' | 'employee';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';
export type AssignmentStatus = 'active' | 'completed' | 'withdrawn';
export type AvailabilityStatus = 'available' | 'in_project' | 'on_leave' | 'unavailable';
export type LearningStatus = 'recommended' | 'in_progress' | 'completed';
export type ResumeStatus = 'pending' | 'screened' | 'shortlisted' | 'rejected' | 'error';
export type SkillCategory = 'technical' | 'soft' | 'domain';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  target_role?: string | null;
  years_of_experience?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description?: string | null;
  market_demand_score?: number | null;
}

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_id: string;
  proficiency: ProficiencyLevel;
  self_rated?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  team_size: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface LearningPath {
  id: string;
  employee_id: string;
  skill_id: string;
  project_id?: string | null;
  course_name: string;
  platform?: string | null;
  url?: string | null;
  estimated_hours?: number | null;
  priority: PriorityLevel;
  status: LearningStatus;
  deadline?: string | null;
}

export interface AllocationLearningPathItem {
  skill: string;
  course_name: string;
  platform: string;
  estimated_hours: number;
  url?: string;
  deadline?: string;
}

export interface AllocationResult {
  matched_employees: Array<{
    id: string;
    name: string;
    job_title?: string;
    match_score: number;
    matched_skills: string[];
    gap_skills: string[];
  }>;
  learning_paths: Record<string, AllocationLearningPathItem[]>;
  workforce_shortage: boolean;
  shortage_count: number;
  allocation_reasoning: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  allocation_result?: AllocationResult;
}
