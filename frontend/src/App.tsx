import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { GapAnalysisWorkspace } from './pages/GapAnalysisWorkspace';
import { LandingPage } from './pages/LandingPage';
import { RoadmapWorkspace } from './pages/RoadmapWorkspace';
import { GapAnalysisResponse } from './types';

export const AppContent: React.FC = () => {
  // Restore current page state across browser refreshes
  const [currentPage, setCurrentPage] = useState<'landing' | 'gap-analysis' | 'roadmap'>(() => {
    try {
      const savedPage = localStorage.getItem('career_compass_current_page');
      if (savedPage === 'gap-analysis' || savedPage === 'roadmap') {
        return savedPage;
      }
    } catch {}
    return 'landing';
  });

  // Restore active analysis session across browser refreshes
  const [roadmapAnalysisId, setRoadmapAnalysisId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('career_compass_active_analysis_id');
    } catch {}
    return null;
  });

  const [roadmapAnalysisData, setRoadmapAnalysisData] = useState<GapAnalysisResponse | null>(() => {
    try {
      const saved = localStorage.getItem('career_compass_analysis_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [roadmapJobTitle, setRoadmapJobTitle] = useState<string>(() => {
    try {
      return localStorage.getItem('career_compass_active_job_title') || '';
    } catch {}
    return '';
  });

  const navigateTo = (page: 'landing' | 'gap-analysis' | 'roadmap') => {
    setCurrentPage(page);
    try {
      localStorage.setItem('career_compass_current_page', page);
    } catch {}
  };

  const handleNavigateRoadmap = (
    analysisId?: string | null,
    analysisData?: GapAnalysisResponse | null,
    jobTitle?: string | null
  ) => {
    const id = analysisId || null;
    setRoadmapAnalysisId(id);
    setRoadmapAnalysisData(analysisData || null);
    if (jobTitle) {
      setRoadmapJobTitle(jobTitle);
      try {
        localStorage.setItem('career_compass_active_job_title', jobTitle);
      } catch {}
    }
    try {
      if (id) {
        localStorage.setItem('career_compass_active_analysis_id', id);
      }
    } catch {}
    navigateTo('roadmap');
  };

  if (currentPage === 'roadmap') {
    return (
      <RoadmapWorkspace
        onBackToGapAnalysis={() => navigateTo('gap-analysis')}
        analysisId={roadmapAnalysisId}
        analysisData={roadmapAnalysisData}
        jobTitle={roadmapJobTitle}
        onNavigateCopilot={() =>
          alert('Launching Career Copilot: AI Interview practice & STAR scenario generator!')
        }
      />
    );
  }

  if (currentPage === 'gap-analysis') {
    return (
      <GapAnalysisWorkspace
        onBackToLanding={() => navigateTo('landing')}
        onNavigateRoadmap={(_gaps, analysisId, analysisData, jobTitle) =>
          handleNavigateRoadmap(analysisId, analysisData, jobTitle)
        }
        onNavigateCopilot={() =>
          alert('Launching Career Copilot: AI Interview practice & STAR scenario generator!')
        }
        onNavigateGalaxy={() =>
          alert('Launching 3D Career Vector Space: Interactive Orbital Galaxy!')
        }
      />
    );
  }

  return (
    <LandingPage
      onNavigateToGap={() => navigateTo('gap-analysis')}
      onStartAnalysis={() => navigateTo('gap-analysis')}
    />
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
