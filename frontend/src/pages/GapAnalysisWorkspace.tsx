import React, { useEffect, useState } from 'react';
import { UserNavPill } from '../components/auth/UserNavPill';
import { ExtractedProfileReview } from '../components/gap-analysis/ExtractedProfileReview';
import { InteractiveAnalyzeButton } from '../components/gap-analysis/InteractiveAnalyzeButton';
import { JobDescriptionInput, SAMPLE_AI_JD } from '../components/gap-analysis/JobDescriptionInput';
import { ResumeUploader } from '../components/gap-analysis/ResumeUploader';
import { SkillGapDashboard } from '../components/gap-analysis/SkillGapDashboard';
import { useAuth } from '../context/AuthContext';
import { apiService, parseApiError } from '../services/api';
import {
    GapAnalysisResponse,
    JobExtractResponse,
    ResumeUploadResponse,
    UserProfileInput,
} from '../types';
import { storageAdapter } from '../utils/storageAdapter';

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
  const { user } = useAuth();
  const isAuth = Boolean(user);

  // Cloud Profile for Returning Logged-In Users
  const [userCloudProfile, setUserCloudProfile] = useState<any | null>(null);
  const [usingExistingResume, setUsingExistingResume] = useState<boolean>(false);

  const prevUserIdRef = React.useRef<string | null | undefined>(user?.id);

  // Restore state: sessionStorage for guests, localStorage for authenticated users (user-scoped)
  const [extractedResume, setExtractedResume] = useState<ResumeUploadResponse | null>(() => {
    return storageAdapter.getExtractedResume(Boolean(user), user?.id);
  });

  const [profileId, setProfileId] = useState<string | null>(() => {
    return storageAdapter.getProfileId(Boolean(user), user?.id);
  });

  const [jobTitle, setJobTitle] = useState<string>(() => {
    return storageAdapter.getActiveJobTitle(Boolean(user), user?.id);
  });

  const [rawJd, setRawJd] = useState<string>(() => {
    return storageAdapter.getRawJd(Boolean(user), user?.id);
  });

  const [currentJobId, setCurrentJobId] = useState<string | null>(() => {
    return storageAdapter.getJobId(Boolean(user), user?.id);
  });

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [analysisData, setAnalysisData] = useState<GapAnalysisResponse | null>(() => {
    return storageAdapter.getAnalysisData(Boolean(user), user?.id);
  });

  // Fetch Cloud Profile for returning authenticated users
  useEffect(() => {
    if (!user?.id) return;
    apiService
      .getProfile(user.id)
      .then((p) => {
        if (p && (p.skills?.length || p.full_name)) {
          setUserCloudProfile(p);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Synchronize state on user switch / login / logout & auto-sync active user data
  useEffect(() => {
    if (prevUserIdRef.current !== user?.id) {
      prevUserIdRef.current = user?.id;
      // Identity changed: reload clean slate or user-scoped persisted data
      const currentResume = storageAdapter.getExtractedResume(isAuth, user?.id);
      const currentPid = storageAdapter.getProfileId(isAuth, user?.id);
      const currentTitle = storageAdapter.getActiveJobTitle(isAuth, user?.id);
      const currentJd = storageAdapter.getRawJd(isAuth, user?.id);
      const currentJid = storageAdapter.getJobId(isAuth, user?.id);
      const currentAnalysis = storageAdapter.getAnalysisData(isAuth, user?.id);

      setExtractedResume(currentResume);
      setProfileId(currentPid);
      setJobTitle(currentTitle);
      setRawJd(currentJd);
      setCurrentJobId(currentJid);
      setAnalysisData(currentAnalysis);
      setUsingExistingResume(false);
      setUserCloudProfile(null);
      setAnalysisError(null);
      return;
    }

    // Auto-sync current user state
    storageAdapter.setExtractedResume(isAuth, extractedResume, user?.id);
    storageAdapter.setProfileId(isAuth, profileId, user?.id);
    storageAdapter.setActiveJobTitle(isAuth, jobTitle, user?.id);
    storageAdapter.setRawJd(isAuth, rawJd, user?.id);
    storageAdapter.setJobId(isAuth, currentJobId, user?.id);
    storageAdapter.setAnalysisData(isAuth, analysisData, user?.id);
  }, [user?.id, isAuth, extractedResume, profileId, jobTitle, rawJd, currentJobId, analysisData]);

  const handleExtractionSuccess = (data: ResumeUploadResponse) => {
    setExtractedResume(data);
    setUsingExistingResume(false);
    setAnalysisError(null);
  };

  const handleRemoveFile = () => {
    setExtractedResume(null);
    setProfileId(null);
    setAnalysisData(null);
    setAnalysisError(null);
    setUsingExistingResume(false);
    storageAdapter.clearLegacyUnscopedKeys();
    storageAdapter.setExtractedResume(isAuth, null, user?.id);
    storageAdapter.setProfileId(isAuth, null, user?.id);
    storageAdapter.setAnalysisData(isAuth, null, user?.id);
    storageAdapter.setActiveAnalysisId(isAuth, null, user?.id);
  };

  const handleStartNewAnalysis = () => {
    setExtractedResume(null);
    setProfileId(null);
    setAnalysisData(null);
    setAnalysisError(null);
    setRawJd('');
    setJobTitle('');
    setCurrentJobId(null);
    setUsingExistingResume(false);
    storageAdapter.clearLegacyUnscopedKeys();
    if (!isAuth) {
      storageAdapter.clearGuestSession();
    } else {
      storageAdapter.setExtractedResume(true, null, user?.id);
      storageAdapter.setAnalysisData(true, null, user?.id);
      storageAdapter.setRawJd(true, '', user?.id);
      storageAdapter.setActiveJobTitle(true, '', user?.id);
      storageAdapter.setJobId(true, null, user?.id);
      storageAdapter.setActiveAnalysisId(true, null, user?.id);
    }
  };

  const handleUseExistingResume = () => {
    if (!userCloudProfile) return;
    const synthesized: ResumeUploadResponse = {
      file_name: `${(userCloudProfile.full_name || user?.name || 'Active_Resume').replace(/\s+/g, '_')}.pdf`,
      extracted_data: {
        technical_skills: userCloudProfile.skills || [],
        soft_skills: userCloudProfile.soft_skills || [],
        work_experience: userCloudProfile.work_experiences || [],
        education: userCloudProfile.education || [],
        certifications: userCloudProfile.certifications || [],
        projects: [],
        links: userCloudProfile.social_profiles || {},
      },
    };
    setExtractedResume(synthesized);
    setProfileId(userCloudProfile.profile_id || user?.id || 'usr_active');
    setUsingExistingResume(true);
    setAnalysisError(null);
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
              user_id: user?.id,
              full_name: user?.name || 'Candidate Profile',
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
      const jobExtractResult: JobExtractResponse = await apiService.extractJobDescription(rawJd, user?.id);
      targetJobId = jobExtractResult.job_id;
      setCurrentJobId(targetJobId);

      // Step 3: Execute Skill Gap & Match Analysis
      const result = await apiService.performGapAnalysis(activeProfileId, targetJobId, user?.id);
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

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* New / Reset Analysis Button */}
            {(extractedResume || rawJd || analysisData) && (
              <button
                type="button"
                onClick={handleStartNewAnalysis}
                className="glass-pill px-3.5 py-1.5 rounded-full text-xs text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title={isAuth ? 'Start a fresh analysis with a new target job' : 'Clear ephemeral session data'}
              >
                <span>🔄</span>
                <span>New Analysis</span>
              </button>
            )}

            {isAuth && (
              <button
                type="button"
                onClick={() => onNavigateRoadmap?.([], undefined, null, jobTitle)}
                className="glass-pill px-3.5 py-1.5 rounded-full text-xs text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/15 border border-cyan-400/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="View your saved learning roadmaps"
              >
                <span>🗺️</span>
                <span className="hidden sm:inline">My Roadmaps</span>
              </button>
            )}

            <UserNavPill />

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

        {/* ================= RETURNING AUTHENTICATED USER: ACTIVE RESUME ON FILE ================= */}
        {isAuth && userCloudProfile && !extractedResume && (
          <div className="glass-frame rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[#131b2e]/60 to-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-cyan-950/30">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 text-cyan-300 text-lg">
                📄
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                    Cloud Resume on File
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ready for 1-Click Match
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {userCloudProfile.full_name || user?.name || 'Your Active Profile'}
                  {userCloudProfile.current_role ? ` • ${userCloudProfile.current_role}` : ''}
                </h4>
                <p className="text-xs text-slate-300/80 mt-0.5">
                  {(userCloudProfile.skills?.length || 0)} skills on record
                  {userCloudProfile.target_role ? ` • Aiming for ${userCloudProfile.target_role}` : ''}
                  . You can analyze against a new job description directly or upload an updated CV below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleUseExistingResume}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>⚡</span>
                <span>Use Active Resume</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= ACTIVE RESUME LOADED BANNER ================= */}
        {usingExistingResume && extractedResume && (
          <div className="glass-pill rounded-xl px-4 py-2.5 border border-cyan-400/40 bg-cyan-950/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">⚡ Active Cloud Resume:</span>
              <span className="text-white font-medium">{extractedResume.file_name}</span>
              <span className="text-cyan-300/70 font-mono text-[11px]">
                ({extractedResume.extracted_data?.technical_skills?.length || 0} skills)
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-slate-400 hover:text-amber-300 transition-colors text-[11px] underline underline-offset-2 cursor-pointer"
            >
              Upload Different Resume Instead
            </button>
          </div>
        )}

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
            storageAdapter.setActiveJobTitle(isAuth, role, user?.id);
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
