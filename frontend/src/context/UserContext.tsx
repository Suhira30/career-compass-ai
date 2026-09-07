import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  UserProfileDetail,
  JobExtractResponse,
  GapAnalysisResponse,
  RoadmapGenerateResponse,
  UserProfileInput,
} from '../types';
import { apiService, parseApiError } from '../services/api';

interface UserContextType {
  // Global State Variables
  activeProfile: UserProfileDetail | null;
  activeJob: JobExtractResponse | null;
  activeAnalysis: GapAnalysisResponse | null;
  activeRoadmap: RoadmapGenerateResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  clearError: () => void;
  setUserProfile: (profile: UserProfileDetail) => void;
  createProfile: (profileInput: UserProfileInput) => Promise<UserProfileDetail | null>;
  uploadResume: (file: File) => Promise<UserProfileInput | null>;
  extractJob: (rawText: string) => Promise<JobExtractResponse | null>;
  runGapAnalysis: (profileId?: string, jobId?: string) => Promise<GapAnalysisResponse | null>;
  generateRoadmap: (
    analysisId?: string,
    hoursPerWeek?: number,
    durationWeeks?: number
  ) => Promise<RoadmapGenerateResponse | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeProfile, setActiveProfile] = useState<UserProfileDetail | null>(null);
  const [activeJob, setActiveJob] = useState<JobExtractResponse | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<GapAnalysisResponse | null>(null);
  const [activeRoadmap, setActiveRoadmap] = useState<RoadmapGenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const setUserProfile = (profile: UserProfileDetail) => {
    setActiveProfile(profile);
  };

  const createProfile = async (profileInput: UserProfileInput): Promise<UserProfileDetail | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await apiService.createProfile(profileInput);
      setActiveProfile(created);
      return created;
    } catch (err) {
      setError(parseApiError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadResume = async (file: File): Promise<UserProfileInput | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.uploadResume(file);
      const extracted = res.extracted_data;
      const draftProfile: UserProfileInput = {
        full_name: 'Extracted Candidate',
        current_role: extracted.work_experience?.[0]?.role || 'Professional',
        target_role: 'Target Role',
        education_degree: extracted.education?.[0]?.degree || '',
        institution: extracted.education?.[0]?.institution || '',
        graduation_year: extracted.education?.[0]?.year,
        skills: extracted.technical_skills || [],
        soft_skills: extracted.soft_skills || [],
      };
      return draftProfile;
    } catch (err) {
      setError(parseApiError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const extractJob = async (rawText: string): Promise<JobExtractResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.extractJobDescription(rawText);
      setActiveJob(res);
      return res;
    } catch (err) {
      setError(parseApiError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const runGapAnalysis = async (
    profileId?: string,
    jobId?: string
  ): Promise<GapAnalysisResponse | null> => {
    const targetProfileId = profileId || activeProfile?.profile_id;
    const targetJobId = jobId || activeJob?.job_id;

    if (!targetProfileId) {
      setError('Please create or select a user profile first.');
      return null;
    }
    if (!targetJobId) {
      setError('Please submit a target job description first.');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.performGapAnalysis(targetProfileId, targetJobId);
      setActiveAnalysis(res);
      return res;
    } catch (err) {
      setError(parseApiError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoadmap = async (
    analysisId?: string,
    hoursPerWeek: number = 5,
    durationWeeks: number = 4
  ): Promise<RoadmapGenerateResponse | null> => {
    const targetAnalysisId = analysisId || activeAnalysis?.analysis_id;
    if (!targetAnalysisId) {
      setError('Please run skill gap analysis before generating a learning roadmap.');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.generateRoadmap(targetAnalysisId, hoursPerWeek, durationWeeks);
      setActiveRoadmap(res);
      return res;
    } catch (err) {
      setError(parseApiError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        activeProfile,
        activeJob,
        activeAnalysis,
        activeRoadmap,
        isLoading,
        error,
        clearError,
        setUserProfile,
        createProfile,
        uploadResume,
        extractJob,
        runGapAnalysis,
        generateRoadmap,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

