export interface UserProfileInput {
  full_name: string;
  education_degree?: string;
  institution?: string;
  graduation_year?: number;
  current_role: string;
  target_role: string;
  skills: string[];
  soft_skills?: string[];
  career_interests?: string[];
}

export interface UserProfileDetail extends UserProfileInput {
  profile_id: string;
  created_at: string;
  status: string;
}

export interface ExtractedEducation {
  degree?: string;
  institution?: string;
  year?: number;
}

export interface ExtractedWorkExperience {
  company?: string;
  role?: string;
  duration?: string;
  highlights: string[];
}

export interface ExtractedProject {
  title: string;
  description?: string;
}

export interface ExtractedCertification {
  title: string;
  verification_link?: string;
}

export interface ExtractedLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface ExtractedResumeData {
  technical_skills: string[];
  soft_skills: string[];
  education: ExtractedEducation[];
  work_experience: ExtractedWorkExperience[];
  projects: ExtractedProject[];
  certifications: ExtractedCertification[];
  links: ExtractedLinks;
}

export interface ResumeUploadResponse {
  file_name: string;
  extracted_data: ExtractedResumeData;
}

export interface ExtractedJobData {
  job_title: string;
  required_skills: string[];
  preferred_skills: string[];
  required_experience: string;
  education_requirements: string;
  responsibilities: string[];
  work_mode: string;
  location: string;
  salary_range: string;
}

export interface JobExtractResponse {
  job_id: string;
  extracted_job: ExtractedJobData;
}

export interface SkillMatrix {
  matched_skills: string[];
  missing_skills: string[];
  partially_available_skills: string[];
}

export interface QualitativeAssessment {
  strengths: string[];
  skill_gaps: string[];
  potential_weaknesses: string[];
  recommended_improvements: string[];
}

export interface GapAnalysisResponse {
  analysis_id: string;
  readiness_category: 'High Match' | 'Moderate Match' | 'Low Match' | string;
  match_score_percentage: number;
  skill_matrix: SkillMatrix;
  assessment: QualitativeAssessment;
}

export interface PrioritizationBadges {
  priority_1_critical: string[];
  priority_2_high: string[];
  priority_3_secondary: string[];
}

export interface WeeklyMilestone {
  week: number;
  focus_skill: string;
  target_hours: number;
  tasks: string[];
  resources: string[];
}

export interface RoadmapGenerateResponse {
  roadmap_id: string;
  prioritization_badges: PrioritizationBadges;
  weekly_milestones: WeeklyMilestone[];
}

type str = string;

