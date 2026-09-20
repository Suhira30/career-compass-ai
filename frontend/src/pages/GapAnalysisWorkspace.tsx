import React, { useEffect, useState } from 'react';
import { ExtractedProfileReview } from '../components/gap-analysis/ExtractedProfileReview';
import { InteractiveAnalyzeButton } from '../components/gap-analysis/InteractiveAnalyzeButton';
import { JobDescriptionInput, SAMPLE_AI_JD } from '../components/gap-analysis/JobDescriptionInput';
import { ResumeUploader } from '../components/gap-analysis/ResumeUploader';
import { SkillGapDashboard } from '../components/gap-analysis/SkillGapDashboard';
import { apiService, parseApiError } from '../services/api';
import {
  GapAnalysisResponse,
  JobExtractResponse,
  ResumeUploadResponse,
  UserProfileInput,
} from '../types';

interface GapAnalysisWorkspaceProps {
  onBackToLanding: () => void;
  onNavigateRoadmap?: (
    gaps: string[],
    analysisId?: string,
    analysisData?: GapAnalysisResponse | null,
    jobTitle?: string | null
  ) => void;
  onNavigateCopilot?: () => void;
  onNavigateGalaxy?: () => void;
}

export const GapAnalysisWorkspace: React.FC<GapAnalysisWorkspaceProps> = ({
  onBackToLanding,
  onNavigateRoadmap,
  onNavigateCopilot,
  onNavigateGalaxy,
}) => {
  // Restore all state across page navigations and browser refreshes
  const [extractedResume, setExtractedResume] = useState<ResumeUploadResponse | null>(() => {
    try {
      const saved = localStorage.getItem('career_compass_extracted_resume');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [profileId, setProfileId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('career_compass_profile_id');
    } catch {}
    return null;
  });

  const [jobTitle, setJobTitle] = useState<string>(() => {
    try {
      return localStorage.getItem('career_compass_active_job_title') || '';
    } catch {}
    return '';
  });

  const [rawJd, setRawJd] = useState<string>(() => {
    try {
      return localStorage.getItem('career_compass_raw_jd') || '';
    } catch {}
    return '';
  });

  const [currentJobId, setCurrentJobId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('career_compass_job_id');
    } catch {}
    return null;
  });

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [analysisData, setAnalysisData] = useState<GapAnalysisResponse | null>(() => {
    try {
      const saved = localStorage.getItem('career_compass_analysis_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Auto-sync resume to localStorage
  useEffect(() => {
    try {
      if (extractedResume) {
        localStorage.setItem('career_compass_extracted_resume', JSON.stringify(extractedResume));
      } else {
        localStorage.removeItem('career_compass_extracted_resume');
      }
    } catch {}
  }, [extractedResume]);

  // Auto-sync profileId
  useEffect(() => {
    try {
      if (profileId) {
        localStorage.setItem('career_compass_profile_id', profileId);
      }
    } catch {}
  }, [profileId]);

  // Auto-sync jobTitle
  useEffect(() => {
    try {
      if (jobTitle) {
        localStorage.setItem('career_compass_active_job_title', jobTitle);
      }
    } catch {}
  }, [jobTitle]);

  // Auto-sync raw JD text
  useEffect(() => {
    try {
      if (rawJd) {
        localStorage.setItem('career_compass_raw_jd', rawJd);
      }
    } catch {}
  }, [rawJd]);

  // Auto-sync jobId
  useEffect(() => {
    try {
      if (currentJobId) {
        localStorage.setItem('career_compass_job_id', currentJobId);
      }
    } catch {}
  }, [currentJobId]);

  // Auto-sync analysis results
  useEffect(() => {
    try {
      if (analysisData) {
        localStorage.setItem('career_compass_analysis_data', JSON.stringify(analysisData));
      } else {
        localStorage.removeItem('career_compass_analysis_data');
      }
    } catch {}
  }, [analysisData]);

  const handleExtractionSuccess = (data: ResumeUploadResponse) => {
    setExtractedResume(data);
    setAnalysisError(null);
  };

  const handleRemoveFile = () => {
    setExtractedResume(null);
    setProfileId(null);
    setAnalysisData(null);
    setAnalysisError(null);
    try {
      localStorage.removeItem('career_compass_extracted_resume');
      localStorage.removeItem('career_compass_profile_id');
      localStorage.removeItem('career_compass_analysis_data');
      localStorage.removeItem('career_compass_active_analysis_id');
    } catch {}
  };

  const handleProfileSaved = (savedProfileId: string) => {
    setProfileId(savedProfileId);
    setAnalysisError(null);
  };

  const handleLoadSampleJd = () => {
    setJobTitle('Senior AI & Systems Engineer');
    setRawJd(SAMPLE_AI_JD);
    setAnalysisError(null);
  };

  const handleTriggerUnifiedAnalysis = async () => {
    // Validation checks
    if (!extractedResume) {
      setAnalysisError('Please upload your resume (or load the sample resume) on the left.');
      return;
    }

    if (!rawJd.trim() || rawJd.trim().length < 20) {
      setAnalysisError('Please enter a target job description (at least 20 characters) on the right.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Step 1: Ensure Candidate Profile is persisted in backend
      let activeProfileId = profileId;
      if (!activeProfileId) {
        if (extractedResume?.extracted_data) {
          try {
            const ext = extractedResume.extracted_data;
            const payload: UserProfileInput = {
              full_name: 'Candidate Profile',
              current_role: ext.work_experience?.[0]?.role || 'Software Engineer',
              target_role: jobTitle.trim() || 'Software Engineer',
              skills: ext.technical_skills || [],
              education_degree: ext.education?.[0]?.degree,
              institution: ext.education?.[0]?.institution,
              graduation_year:
                typeof ext.education?.[0]?.graduation_year === 'number'
                  ? ext.education[0].graduation_year
                  : undefined,
            };
            const saved = await apiService.createProfile(payload);
            activeProfileId = saved.profile_id;
            setProfileId(activeProfileId);
          } catch (saveErr) {
            console.error('Auto profile creation failed:', saveErr);
            throw new Error('Could not persist candidate profile. Please verify your profile below.');
          }
        } else {
          throw new Error('Resume data not found. Please re-upload your resume.');
        }
      }

      // Step 2: Extract structured Job Description
      let targetJobId = currentJobId;
      const jobExtractResult: JobExtractResponse = await apiService.extractJobDescription(rawJd);
      targetJobId = jobExtractResult.job_id;
      setCurrentJobId(targetJobId);

      // Step 3: Execute Skill Gap & Match Analysis
      const result = await apiService.performGapAnalysis(activeProfileId, targetJobId);
      setAnalysisData(result);

      // Step 4: Smooth scroll down to results
      setTimeout(() => {
        const element = document.getElementById('gap-results-anchor');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: unknown) {
      console.error('Analysis workflow failed:', err);
      setAnalysisError(parseApiError(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-hero-quantum text-[#F1F5F9] min-h-screen antialiased p-3 sm:p-6 lg:p-8 flex flex-col justify-between">
      {/* ================= TOP FLOATING NAVIGATION BAR ================= */}
      <header className="max-w-7xl w-full mx-auto pb-5 mb-6">
        <div className="glass-frame rounded-full px-5 py-3 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <svg
                className="w-4 h-4 text-cyan-400 transform -rotate-45"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 7l2.5 5-2.5-1.5L9.5 12 12 7z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 17l-2.5-5 2.5 1.5 2.5-1.5L12 17z"
                />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                Career Compass AI
              </span>
              <span className="text-[10px] text-cyan-300 ml-2 font-mono uppercase tracking-wider">
                Gap Analysis
              </span>
            </div>
          </div>

          {/* Back to Landing Action */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToLanding}
              className="glass-pill px-4 py-1.5 rounded-full text-xs text-white/90 hover:text-white hover:bg-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span>
              <span>Back to Landing</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN WORKSPACE CONTENT ================= */}
      <main className="max-w-7xl w-full mx-auto space-y-6">
        {/* Workspace Title & Accent Bar */}
        <div className="space-y-2">
          <div className="accent-bar" />
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Skill Gap Analysis Workspace
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-2xl font-light mt-1">
                Compare your resume against your target job description to reveal your match score,
                verified strengths, and critical gaps.
              </p>
            </div>
            <div className="glass-pill rounded-full px-3.5 py-1 text-xs text-cyan-300 font-medium self-start sm:self-auto border border-cyan-400/30">
              ✦ Dual Input Engine
            </div>
          </div>
        </div>

        {/* ================= DUAL INPUT ENGINES WITH INTERACTIVE SPOTLIGHT ================= */}
        <div className="space-y-6">
          {/* Dual Input Cards: Left = Resume Ingestion, Right = Target Job Description */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: CV / Resume Uploader */}
            <div className="lg:col-span-6 flex flex-col">
              <ResumeUploader
                onExtractionSuccess={handleExtractionSuccess}
                extractedFileName={extractedResume?.file_name}
                onRemoveFile={handleRemoveFile}
              />
            </div>

            {/* Right: Job Description Uploader */}
            <div className="lg:col-span-6 flex flex-col">
              <JobDescriptionInput
                jobTitle={jobTitle}
                setJobTitle={setJobTitle}
                rawJd={rawJd}
                setRawJd={setRawJd}
                onLoadSample={handleLoadSampleJd}
                isAnalyzing={isAnalyzing}
              />
            </div>
          </div>

          {/* ================= BOTTOM OF BOTH: INTERACTIVE CURSOR-REACTIVE ANALYZE BUTTON ================= */}
          <InteractiveAnalyzeButton
            onClick={handleTriggerUnifiedAnalysis}
            isAnalyzing={isAnalyzing}
            hasResume={!!extractedResume}
            hasJobDescription={rawJd.trim().length >= 20}
            errorMessage={analysisError}
          />
        </div>

        {/* ================= ROW 2: EXTRACTED CANDIDATE PROFILE REVIEW ================= */}
        <ExtractedProfileReview
          extractedData={extractedResume?.extracted_data}
          onProfileSaved={handleProfileSaved}
        />

        {/* Anchor for auto scroll */}
        <div id="gap-results-anchor" />

        {/* ================= ROW 3 & 4: GAP INTELLIGENCE DASHBOARD ================= */}
        <SkillGapDashboard
          analysisData={analysisData}
          onNavigateRoadmap={(gaps, aId) => {
            const role = jobTitle.trim() || 'Target Opportunity';
            try {
              localStorage.setItem('career_compass_active_job_title', role);
            } catch {}
            onNavigateRoadmap?.(gaps, aId || analysisData?.analysis_id, analysisData, role);
          }}
          onNavigateCopilot={onNavigateCopilot}
          onNavigateGalaxy={onNavigateGalaxy}
        />
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="max-w-7xl w-full mx-auto pt-6 mt-8 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
        <span>Career Compass AI • Gap Analysis Workspace</span>
        <span>Quantum Glass Prism Architecture</span>
      </footer>
    </div>
  );
};
