import axios, { AxiosError } from 'axios';
import {
  GapAnalysisResponse,
  JobExtractResponse,
  ResumeUploadResponse,
  RoadmapGenerateResponse,
  UserProfileDetail,
  UserProfileInput,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for LLM processing
});

// Dynamic Client API Key Injection (BYOK)
apiClient.interceptors.request.use((config) => {
  try {
    const customKey = localStorage.getItem('career_compass_custom_gemini_key');
    if (customKey && customKey.trim()) {
      config.headers['X-Gemini-API-Key'] = customKey.trim();
    }
  } catch {}
  return config;
});

// Intercept 429 Quota Exhaustion errors and trigger BYOK guidance modal
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data: any = error.response?.data;
      if (status === 429 || data?.error_code === 'LLM_QUOTA_EXHAUSTED' || data?.detail?.error_code === 'LLM_QUOTA_EXHAUSTED') {
        const msg = data?.message || data?.detail?.message || 'Shared AI service quota reached.';
        window.dispatchEvent(
          new CustomEvent('open-api-key-modal', {
            detail: { message: msg },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

// Centralized error response extractor
export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string | { msg: string }[] }>;
    if (axiosError.response?.data?.detail) {
      const detail = axiosError.response.data.detail;
      if (typeof detail === 'string') {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail.map((d) => d.msg).join(', ');
      }
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  return 'An unexpected error occurred. Please try again.';
}

// API Service Endpoints
export const apiService = {
  // 1. Profile Management
  async createProfile(profileData: UserProfileInput): Promise<UserProfileDetail> {
    const response = await apiClient.post<UserProfileDetail>('/profile', profileData);
    return response.data;
  },

  async getProfile(profileId: string): Promise<UserProfileDetail> {
    const response = await apiClient.get<UserProfileDetail>(`/profile/${profileId}`);
    return response.data;
  },

  // 2. Resume Upload & Extraction
  async uploadResume(file: File): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ResumeUploadResponse>('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 3. Job Description Parsing
  async extractJobDescription(rawJobDescription: string, userId?: string | null): Promise<JobExtractResponse> {
    const response = await apiClient.post<JobExtractResponse>('/jobs/extract', {
      raw_job_description: rawJobDescription,
      user_id: userId || undefined,
    });
    return response.data;
  },

  // 4. Skill Gap Analysis
  async performGapAnalysis(profileId: string, jobId: string, userId?: string | null): Promise<GapAnalysisResponse> {
    const response = await apiClient.post<GapAnalysisResponse>('/analysis/gap', {
      profile_id: profileId,
      job_id: jobId,
      user_id: userId || undefined,
    });
    return response.data;
  },

  // 5. Personalized Learning Roadmap Generator
  async generateRoadmap(
    analysisId: string,
    availableHoursPerWeek: number = 5,
    preferredDurationWeeks: number = 4,
    gapAnalysisData?: any
  ): Promise<RoadmapGenerateResponse> {
    const response = await apiClient.post<RoadmapGenerateResponse>('/roadmap/generate', {
      analysis_id: analysisId,
      available_hours_per_week: availableHoursPerWeek,
      preferred_duration_weeks: preferredDurationWeeks,
      gap_analysis_data: gapAnalysisData || null,
    });
    return response.data;
  },

  // 6. Multi-Roadmap Cloud Persistence (Supabase & Two-Tier Sync)
  async getUserRoadmaps(userId: string): Promise<any[]> {
    const response = await apiClient.get(`/roadmap/user/${userId}`);
    return response.data;
  },

  async saveRoadmap(roadmap: any, userId?: string): Promise<{ status: string }> {
    const rd = roadmap.roadmap_data || {};
    const response = await apiClient.post('/roadmap/save', {
      roadmap_id: roadmap.id,
      user_id: userId || null,
      analysis_id: typeof roadmap.id === 'string' && roadmap.id.startsWith('anl_') ? roadmap.id : null,
      company_name: roadmap.company_name || 'Target Opportunity',
      job_title: roadmap.job_title || 'AI Role',
      ats_score_percentage: Math.round(roadmap.ats_score_percentage || 75),
      weekly_hours: roadmap.weekly_hours || 5,
      duration_weeks: roadmap.duration_weeks || 4,
      prioritization_badges: rd.prioritization_badges || {
        priority_1_critical: [],
        priority_2_high: [],
        priority_3_secondary: [],
      },
      weekly_milestones: rd.weekly_milestones || [],
    });
    return response.data;
  },

  async toggleRoadmapTask(
    roadmapId: string,
    taskKey: string,
    isCompleted: boolean,
    userId?: string
  ): Promise<{ status: string }> {
    const response = await apiClient.post(`/roadmap/${roadmapId}/task`, {
      task_key: taskKey,
      is_completed: isCompleted,
      user_id: userId || null,
    });
    return response.data;
  },

  async deleteRoadmap(roadmapId: string): Promise<{ status: string }> {
    const response = await apiClient.delete(`/roadmap/${roadmapId}`);
    return response.data;
  },
};

