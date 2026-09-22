import React, { useEffect, useState } from 'react';
import { AuthModal } from './components/auth/AuthModal';
import { CareerChatWidget } from './components/chat/CareerChatWidget';
import { ApiKeyModal } from './components/common/ApiKeyModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CareerCopilotWorkspace } from './pages/CareerCopilotWorkspace';
import { GapAnalysisWorkspace } from './pages/GapAnalysisWorkspace';
import { LandingPage } from './pages/LandingPage';
import { RoadmapWorkspace } from './pages/RoadmapWorkspace';
import { GapAnalysisResponse } from './types';
import { storageAdapter } from './utils/storageAdapter';

export const AppContent: React.FC = () => {
  const { user, isAuthModalOpen, closeAuthModal, openAuthModal } = useAuth();

  // Purge legacy guest data accidentally left in localStorage from older builds
  useEffect(() => {
    storageAdapter.purgeLegacyGuestLocalStorage();
  }, []);

  // Restore current page state
  const [currentPage, setCurrentPage] = useState<'landing' | 'gap-analysis' | 'roadmap' | 'copilot'>(() => {
    try {
      // If user is not authenticated, start fresh on landing page unless there's an active in-tab session
      const authUser = localStorage.getItem('career_compass_auth_user');
      if (!authUser) {
        const inFlightSession = sessionStorage.getItem('career_compass_analysis_data');
        if (inFlightSession) {
          const savedPage = sessionStorage.getItem('career_compass_current_page');
          if (savedPage === 'gap-analysis' || savedPage === 'copilot') return savedPage;
        }
        return 'landing';
      }

      const savedPage = localStorage.getItem('career_compass_current_page');
      if (savedPage === 'gap-analysis' || savedPage === 'roadmap' || savedPage === 'copilot') {
        return savedPage;
      }
    } catch {}
    return 'landing';
  });

  const prevAppUserIdRef = React.useRef<string | null | undefined>(user?.id);

  // Restore active analysis session across browser refreshes (user-scoped)
  const [roadmapAnalysisId, setRoadmapAnalysisId] = useState<string | null>(() => {
    try {
      return storageAdapter.getActiveAnalysisId(Boolean(user), user?.id);
    } catch {}
    return null;
  });

  const [roadmapAnalysisData, setRoadmapAnalysisData] = useState<GapAnalysisResponse | null>(() => {
    try {
      return storageAdapter.getAnalysisData(Boolean(user), user?.id);
    } catch {}
    return null;
  });

  const [roadmapJobTitle, setRoadmapJobTitle] = useState<string>(() => {
    try {
      return storageAdapter.getActiveJobTitle(Boolean(user), user?.id) || '';
    } catch {}
    return '';
  });

  // Synchronize roadmap state when user account changes / logs in / logs out
  useEffect(() => {
    if (prevAppUserIdRef.current !== user?.id) {
      prevAppUserIdRef.current = user?.id;
      setRoadmapAnalysisId(storageAdapter.getActiveAnalysisId(Boolean(user), user?.id));
      setRoadmapAnalysisData(storageAdapter.getAnalysisData(Boolean(user), user?.id));
      setRoadmapJobTitle(storageAdapter.getActiveJobTitle(Boolean(user), user?.id));
    }
  }, [user?.id, user]);

  const navigateTo = (page: 'landing' | 'gap-analysis' | 'roadmap' | 'copilot') => {
    setCurrentPage(page);
    try {
      if (user) {
        localStorage.setItem('career_compass_current_page', page);
      } else {
        sessionStorage.setItem('career_compass_current_page', page);
      }
    } catch {}
  };

  const handleNavigateRoadmap = (
    analysisId?: string | null,
    analysisData?: GapAnalysisResponse | null,
    jobTitle?: string | null
  ) => {
    const id = analysisId || null;
    const role = jobTitle?.trim() || 'Target Opportunity';

    // CONVERSION VALUE GATE: Gated by login
    if (!user) {
      // 1. Stash in-flight analysis
      storageAdapter.stashAnalysis({
        analysisId: id,
        analysisData: analysisData || null,
        jobTitle: role,
      });

      // 2. Open AuthModal with conversion prompt & success callback
      openAuthModal(
        'Create a free account or sign in to save your personalized roadmap, track weekly milestones, and sync across devices.',
        () => {
          const stashed = storageAdapter.popStashedAnalysis();
          const targetId = stashed?.analysisId || id;
          const targetData = stashed?.analysisData || analysisData || null;
          const targetRole = stashed?.jobTitle || role;

          setRoadmapAnalysisId(targetId);
          setRoadmapAnalysisData(targetData);
          setRoadmapJobTitle(targetRole);

          const currentAuth = localStorage.getItem('career_compass_auth_user');
          const currentUserId = currentAuth ? JSON.parse(currentAuth)?.id : undefined;

          storageAdapter.setActiveAnalysisId(true, targetId, currentUserId);
          storageAdapter.setAnalysisData(true, targetData, currentUserId);
          storageAdapter.setActiveJobTitle(true, targetRole, currentUserId);

          navigateTo('roadmap');
        }
      );
      return;
    }

    // Authenticated user: navigate directly
    setRoadmapAnalysisId(id);
    setRoadmapAnalysisData(analysisData || null);
    setRoadmapJobTitle(role);
    storageAdapter.setActiveAnalysisId(true, id, user.id);
    storageAdapter.setAnalysisData(true, analysisData || null, user.id);
    storageAdapter.setActiveJobTitle(true, role, user.id);
    navigateTo('roadmap');
  };

  return (
    <>
      {currentPage === 'copilot' && (
        <CareerCopilotWorkspace
          onBackToRoadmap={() => navigateTo('roadmap')}
          onBackToGapAnalysis={() => navigateTo('gap-analysis')}
          analysisId={roadmapAnalysisId}
          analysisData={roadmapAnalysisData}
          jobTitle={roadmapJobTitle}
        />
      )}

      {currentPage === 'roadmap' && (
        <>
          <RoadmapWorkspace
            onBackToGapAnalysis={() => navigateTo('gap-analysis')}
            analysisId={roadmapAnalysisId}
            analysisData={roadmapAnalysisData}
            jobTitle={roadmapJobTitle}
            onNavigateCopilot={() => navigateTo('copilot')}
          />
          <CareerChatWidget
            analysisId={roadmapAnalysisId}
            analysisData={roadmapAnalysisData}
            jobTitle={roadmapJobTitle}
            onExpandToFullWorkspace={() => navigateTo('copilot')}
          />
        </>
      )}

      {currentPage === 'gap-analysis' && (
        <>
          <GapAnalysisWorkspace
            onBackToLanding={() => navigateTo('landing')}
            onNavigateRoadmap={(_gaps, analysisId, analysisData, jobTitle) =>
              handleNavigateRoadmap(analysisId, analysisData, jobTitle)
            }
            onNavigateCopilot={() => navigateTo('copilot')}
            onNavigateGalaxy={() =>
              alert('Launching 3D Career Vector Space: Interactive Orbital Galaxy!')
            }
          />
          <CareerChatWidget
            analysisId={roadmapAnalysisId}
            analysisData={roadmapAnalysisData}
            jobTitle={roadmapJobTitle}
            onExpandToFullWorkspace={() => navigateTo('copilot')}
          />
        </>
      )}

      {currentPage === 'landing' && (
        <LandingPage
          onNavigateToGap={() => navigateTo('gap-analysis')}
          onStartAnalysis={() => navigateTo('gap-analysis')}
          onNavigateToRoadmap={() => {
            if (!user) {
              openAuthModal(
                'Sign in or create a free account to access your personalized learning roadmaps and track weekly milestones.',
                () => navigateTo('roadmap')
              );
            } else {
              navigateTo('roadmap');
            }
          }}
          onNavigateToCopilot={() => navigateTo('copilot')}
        />
      )}

      {/* Global Auth Modal for all workspaces */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />

      {/* Global Bring-Your-Own-Key (BYOK) Modal */}
      <ApiKeyModal />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
