import React, { useState } from 'react';
import { GapAnalysisWorkspace } from './pages/GapAnalysisWorkspace';
import { LandingPage } from './pages/LandingPage';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'gap-analysis'>('landing');

  if (currentPage === 'gap-analysis') {
    return (
      <GapAnalysisWorkspace
        onBackToLanding={() => setCurrentPage('landing')}
        onNavigateRoadmap={(gaps) =>
          alert(`Opening Learning Roadmap with target gaps:\n• ${gaps.join('\n• ')}`)
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
      onNavigateToGap={() => setCurrentPage('gap-analysis')}
      onStartAnalysis={() => setCurrentPage('gap-analysis')}
    />
  );
};
