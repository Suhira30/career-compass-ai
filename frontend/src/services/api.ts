import axios, { AxiosError } from 'axios';
import {
  UserProfileInput,
  UserProfileDetail,
  ResumeUploadResponse,
  JobExtractResponse,
  GapAnalysisResponse,
  RoadmapGenerateResponse,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for LLM processing
});

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
  async extractJobDescription(rawJobDescription: string): Promise<JobExtractResponse> {
    const response = await apiClient.post<JobExtractResponse>('/jobs/extract', {
      raw_job_description: rawJobDescription,
    });
    return response.data;
  },

  // 4. Skill Gap Analysis
  async performGapAnalysis(profileId: string, jobId: string): Promise<GapAnalysisResponse> {
    const response = await apiClient.post<GapAnalysisResponse>('/analysis/gap', {
      profile_id: profileId,
      job_id: jobId,
    });
    return response.data;
  },

  // 5. Personalized Learning Roadmap Generator
  async generateRoadmap(
    analysisId: string,
    availableHoursPerWeek: number = 5,
    preferredDurationWeeks: number = 4
  ): Promise<RoadmapGenerateResponse> {
    const response = await apiClient.post<RoadmapGenerateResponse>('/roadmap/generate', {
      analysis_id: analysisId,
      available_hours_per_week: availableHoursPerWeek,
      preferred_duration_weeks: preferredDurationWeeks,
    });
    return response.data;
  },
};

