import React, { useState } from 'react';
import { ExtractedProfileReview } from '../components/gap-analysis/ExtractedProfileReview';
import { JobDescriptionInput } from '../components/gap-analysis/JobDescriptionInput';
import { ResumeUploader } from '../components/gap-analysis/ResumeUploader';
import { SkillGapDashboard } from '../components/gap-analysis/SkillGapDashboard';
import { apiService } from '../services/api';
import {
    GapAnalysisResponse,
    JobExtractResponse,
    ResumeUploadResponse,
} from '../types';

interface GapAnalysisWorkspaceProps {
  onBackToLanding: () => void;
  onNavigateRoadmap?: (gaps: string[]) => void;
  onNavigateCopilot?: () => void;
  onNavigateGalaxy?: () => void;
}

export const GapAnalysisWorkspace: React.FC<GapAnalysisWorkspaceProps> = ({
  onBackToLanding,
  onNavigateRoadmap,
  onNavigateCopilot,
  onNavigateGalaxy,
}) => {
  const [extractedResume, setExtractedResume] = useState<ResumeUploadResponse | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<GapAnalysisResponse | null>(null);

  const handleExtractionSuccess = (data: ResumeUploadResponse) => {
    setExtractedResume(data);
    setAnalysisError(null);
  };

  const handleRemoveFile = () => {
    setExtractedResume(null);
    setProfileId(null);
    setAnalysisData(null);
    setAnalysisError(null);
  };

  const handleProfileSaved = (savedProfileId: string) => {
    setProfileId(savedProfileId);
    setAnalysisError(null);
  };

  const handleRunAnalysis = async (targetJobId: string, jobData?: JobExtractResponse) => {
    if (!profileId) {
      setAnalysisError('Please upload a resume and click "✓ Save Profile" first before analyzing.');
      return;
    }

    setJobId(targetJobId);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Call real backend API /api/v1/analysis/gap
      const result = await apiService.performGapAnalysis(profileId, targetJobId);
      setAnalysisData(result);
    } catch (err) {
      console.error('Analysis API failed:', err);
      setAnalysisError('Gap analysis failed. Please ensure the backend server is running and try again.');
    } finally {
      setIsAnalyzing(false);
      const element = document.getElementById('gap-results-anchor');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
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

        {/* ================= ROW 1: TOP DUAL INPUT ENGINES ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <ResumeUploader
              onExtractionSuccess={handleExtractionSuccess}
              extractedFileName={extractedResume?.file_name}
              onRemoveFile={handleRemoveFile}
            />
          </div>

          <div className="lg:col-span-6">
            <JobDescriptionInput onAnalyze={handleRunAnalysis} isAnalyzing={isAnalyzing} />
          </div>
        </div>

        {/* ================= ROW 2: EXTRACTED CANDIDATE PROFILE REVIEW ================= */}
        <ExtractedProfileReview
          extractedData={extractedResume?.extracted_data}
          onProfileSaved={handleProfileSaved}
        />

        {/* Error Notification */}
        {analysisError && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <span className="font-bold text-sm">⚠</span>
            <span>{analysisError}</span>
          </div>
        )}

        {/* Anchor for auto scroll */}
        <div id="gap-results-anchor" />

        {/* ================= ROW 3 & 4: GAP INTELLIGENCE DASHBOARD ================= */}
        <SkillGapDashboard
          analysisData={analysisData}
          onNavigateRoadmap={onNavigateRoadmap}
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

