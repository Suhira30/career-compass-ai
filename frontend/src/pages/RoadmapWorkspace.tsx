import React, { useCallback, useEffect, useState } from 'react';
import { UserNavPill } from '../components/auth/UserNavPill';
import { CancelRoadmapModal } from '../components/roadmap/CancelRoadmapModal';
import { PriorityBadgesOverview } from '../components/roadmap/PriorityBadgesOverview';
import { RoadmapCarouselHeader } from '../components/roadmap/RoadmapCarouselHeader';
import { RoadmapControlsBar } from '../components/roadmap/RoadmapControlsBar';
import { WeeklyTimelineStepper } from '../components/roadmap/WeeklyTimelineStepper';
import { useAuth } from '../context/AuthContext';
import { apiService, parseApiError } from '../services/api';
import { GapAnalysisResponse, TrackedRoadmapItem } from '../types';
import { resolveRoadmapResource, sanitizeTrackedRoadmaps } from '../utils/roadmapLinkResolver';
import { storageAdapter } from '../utils/storageAdapter';

interface RoadmapWorkspaceProps {
  onBackToGapAnalysis: () => void;
  onNavigateCopilot?: () => void;
  analysisId?: string | null;
  analysisData?: GapAnalysisResponse | null;
  jobTitle?: string | null;
}

const DUMMY_SEED_IDS = ['rdm_scale_ai', 'rdm_anthropic', 'rdm_meta', 'rdm_sample'];

export const RoadmapWorkspace: React.FC<RoadmapWorkspaceProps> = ({
  onBackToGapAnalysis,
  onNavigateCopilot,
  analysisId,
  analysisData,
  jobTitle,
}) => {
  const { user } = useAuth();
  const isAuth = Boolean(user);
  const prevUserIdRef = React.useRef<string | null | undefined>(user?.id);

  // Load tracked roadmaps from storageAdapter, strictly filtering out any fake seeds
  const [roadmaps, setRoadmaps] = useState<TrackedRoadmapItem[]>(() => {
    try {
      const saved = storageAdapter.getSavedRoadmaps(isAuth, user?.id);
      if (Array.isArray(saved)) {
        const realOnly = saved.filter((r) => !DUMMY_SEED_IDS.includes(r.id));
        return sanitizeTrackedRoadmaps(realOnly);
      }
    } catch (err) {
      console.warn('Could not parse saved roadmaps:', err);
    }
    return [];
  });

  // Track active roadmap ID
  const [activeRoadmapId, setActiveRoadmapId] = useState<string>(() => {
    try {
      const savedActive = storageAdapter.getActiveRoadmapId(isAuth, user?.id);
      if (savedActive && !DUMMY_SEED_IDS.includes(savedActive)) return savedActive;
    } catch {}
    return roadmaps[0]?.id || '';
  });

  const [paceMode, setPaceMode] = useState<'week' | 'day'>('week');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancellation Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  // Get active roadmap item
  const activeRoadmap = roadmaps.find((r) => r.id === activeRoadmapId) || roadmaps[0] || null;

  // Fetch roadmap from backend API for a specific session using Groq
  const fetchBackendRoadmap = useCallback(
    async (targetAnalysisId: string, hours: number, weeks: number) => {
      setIsGenerating(true);
      setErrorMessage(null);

      try {
        const response = await apiService.generateRoadmap(targetAnalysisId, hours, weeks, analysisData);
        setRoadmaps((prev) =>
          prev.map((r) => {
            if (r.id === targetAnalysisId) {
              const updated = {
                ...r,
                weekly_hours: hours,
                duration_weeks: weeks,
                roadmap_data: response,
              };
              if (user?.id) {
                apiService.saveRoadmap(updated, user.id).catch(() => {});
              }
              return updated;
            }
            return r;
          })
        );
      } catch (err: unknown) {
        console.error('Failed to generate roadmap from API:', err);
        setErrorMessage(parseApiError(err));
      } finally {
        setIsGenerating(false);
      }
    },
    [user?.id]
  );

  // Handle incoming real Gap Analysis session
  useEffect(() => {
    if (!analysisId || !analysisData) return;

    const realJobTitle = jobTitle?.trim() || 'Target AI Opportunity';
    const atsScore = Math.round(analysisData.match_score_percentage || 0);

    setRoadmaps((prev) => {
      // Purge any dummy seeds
      const cleaned = prev.filter((r) => !DUMMY_SEED_IDS.includes(r.id));
      const existing = cleaned.find((r) => r.id === analysisId);

      if (!existing) {
        const newEntry: TrackedRoadmapItem = {
          id: analysisId,
          company_name: 'Target Opportunity',
          job_title: realJobTitle,
          ats_score_percentage: atsScore,
          readiness_category: analysisData.readiness_category,
          weekly_hours: 5,
          duration_weeks: 4,
          created_at: new Date().toISOString(),
          completed_tasks: {},
          roadmap_data: {
            roadmap_id: analysisId,
            prioritization_badges: {
              priority_1_critical: analysisData.skill_matrix?.missing_skills?.slice(0, 2) || [],
              priority_2_high: analysisData.skill_matrix?.partially_available_skills?.slice(0, 2) || [],
              priority_3_secondary: analysisData.skill_matrix?.missing_skills?.slice(2, 4) || [],
            },
            weekly_milestones: [],
          },
        };
        return [newEntry, ...cleaned];
      } else {
        return cleaned.map((r) =>
          r.id === analysisId
            ? { ...r, job_title: realJobTitle, ats_score_percentage: atsScore }
            : r
        );
      }
    });

    setActiveRoadmapId(analysisId);

    // Call backend API (Groq) to generate real milestones only if not already present
    const saved = storageAdapter.getSavedRoadmaps(isAuth, user?.id);
    let hasMilestones = false;
    if (Array.isArray(saved)) {
      const match = saved.find((r) => r.id === analysisId);
      if (match?.roadmap_data?.weekly_milestones && match.roadmap_data.weekly_milestones.length > 0) {
        hasMilestones = true;
      }
    }

    if (!hasMilestones) {
      fetchBackendRoadmap(analysisId, 5, 4);
    }
  }, [analysisId, analysisData, jobTitle, fetchBackendRoadmap]);

  // Synchronize roadmaps on account switch & persist scoped to active user
  useEffect(() => {
    if (prevUserIdRef.current !== user?.id) {
      prevUserIdRef.current = user?.id;
      // Account changed: reload roadmaps scoped to this user
      const userRoadmaps = storageAdapter.getSavedRoadmaps(isAuth, user?.id);
      const realOnly = userRoadmaps.filter((r) => !DUMMY_SEED_IDS.includes(r.id));
      const sanitized = sanitizeTrackedRoadmaps(realOnly);
      setRoadmaps(sanitized);

      const userActiveId = storageAdapter.getActiveRoadmapId(isAuth, user?.id);
      setActiveRoadmapId(userActiveId || sanitized[0]?.id || '');

      // If user is authenticated, sync their cloud roadmaps from backend
      if (user?.id) {
        apiService
          .getUserRoadmaps(user.id)
          .then((cloudRoadmaps) => {
            const validCloud = Array.isArray(cloudRoadmaps)
              ? cloudRoadmaps.filter((r) => !DUMMY_SEED_IDS.includes(r.id))
              : [];

            if (validCloud.length > 0) {
              setRoadmaps(validCloud);
              setActiveRoadmapId(validCloud[0].id);
              storageAdapter.setSavedRoadmaps(true, validCloud, user.id);
              storageAdapter.setActiveRoadmapId(true, validCloud[0].id, user.id);
            }
          })
          .catch((err) => {
            console.warn('Could not sync cloud roadmaps:', err);
          });
      }
      return;
    }

    // Persist active user roadmaps
    try {
      const realOnly = roadmaps.filter((r) => !DUMMY_SEED_IDS.includes(r.id));
      storageAdapter.setSavedRoadmaps(isAuth, realOnly, user?.id);
    } catch (err) {
      console.warn('Could not persist roadmaps array:', err);
    }

    if (activeRoadmapId && !DUMMY_SEED_IDS.includes(activeRoadmapId)) {
      try {
        storageAdapter.setActiveRoadmapId(isAuth, activeRoadmapId, user?.id);
      } catch {}
    }
  }, [user?.id, isAuth, roadmaps, activeRoadmapId]);

  // Toggle checkbox for a task on the active roadmap
  const handleToggleTask = (taskId: string) => {
    if (!activeRoadmap) return;

    const newCompleted = !activeRoadmap.completed_tasks?.[taskId];

    setRoadmaps((prev) =>
      prev.map((rm) => {
        if (rm.id === activeRoadmap.id) {
          const updatedTasks = {
            ...rm.completed_tasks,
            [taskId]: newCompleted,
          };
          return {
            ...rm,
            completed_tasks: updatedTasks,
          };
        }
        return rm;
      })
    );

    // Sync task state to Supabase in background
    apiService.toggleRoadmapTask(activeRoadmap.id, taskId, newCompleted, user?.id).catch((err) => {
      console.warn('Background Supabase task toggle sync error (cached offline):', err);
    });
  };

  // Update weekly hours on active roadmap
  const handleSetWeeklyHours = (hours: number) => {
    if (!activeRoadmap) return;
    setRoadmaps((prev) =>
      prev.map((rm) => {
        if (rm.id === activeRoadmap.id) {
          const updated = { ...rm, weekly_hours: hours };
          apiService.saveRoadmap(updated, user?.id).catch(() => {});
          return updated;
        }
        return rm;
      })
    );
  };

  // Update duration weeks on active roadmap
  const handleSetDurationWeeks = (weeks: number) => {
    if (!activeRoadmap) return;
    setRoadmaps((prev) =>
      prev.map((rm) => {
        if (rm.id === activeRoadmap.id) {
          const updated = { ...rm, duration_weeks: weeks };
          apiService.saveRoadmap(updated, user?.id).catch(() => {});
          return updated;
        }
        return rm;
      })
    );
  };

  // Regenerate action
  const handleRegenerate = () => {
    if (!activeRoadmap) return;
    fetchBackendRoadmap(activeRoadmap.id, activeRoadmap.weekly_hours, activeRoadmap.duration_weeks);
  };

  // Cancel modal triggers
  const handlePromptCancelRoadmap = (targetId: string) => {
    setPendingCancelId(targetId);
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setPendingCancelId(null);
  };

  const handleConfirmCancelRoadmap = () => {
    if (!pendingCancelId) return;

    const remaining = roadmaps.filter((r) => r.id !== pendingCancelId);
    setRoadmaps(remaining);

    // Sync deletion to Supabase in background
    apiService.deleteRoadmap(pendingCancelId).catch((err) => {
      console.warn('Background Supabase deletion sync error:', err);
    });

    // If currently active roadmap was deleted, switch to the first remaining
    if (activeRoadmapId === pendingCancelId) {
      if (remaining.length > 0) {
        setActiveRoadmapId(remaining[0].id);
      }
    }

    handleCloseCancelModal();
  };

  // Export plan as Markdown
  const handleExportPlan = () => {
    if (!activeRoadmap) return;
    const rd = activeRoadmap.roadmap_data;
    const lines = [
      `# Career Compass AI — Learning Roadmap: ${activeRoadmap.company_name} (${activeRoadmap.job_title})`,
      `ATS Match Score: ${activeRoadmap.ats_score_percentage}%`,
      `Duration: ${activeRoadmap.duration_weeks} Weeks | Study Commitment: ${activeRoadmap.weekly_hours} hrs/week`,
      ``,
      `## Priority 1 Critical Skills:`,
      ...(rd.prioritization_badges?.priority_1_critical || []).map((s) => `- ${s}`),
      ``,
      `## Priority 2 Core Competencies:`,
      ...(rd.prioritization_badges?.priority_2_high || []).map((s) => `- ${s}`),
      ``,
      `## Weekly Milestones:`,
      ...(rd.weekly_milestones || []).map(
        (m) =>
          `### Week ${m.week}: ${m.focus_skill} (${m.target_hours} hrs)\n` +
          m.tasks.map((t) => `- [ ] ${t}`).join('\n') +
          (() => {
            const valid = (m.resources || [])
              .map((r) => resolveRoadmapResource(r, m.focus_skill))
              .filter((res): res is NonNullable<typeof res> => Boolean(res));
            return valid.length > 0
              ? `\nVerified Documentation & Resources:\n` +
                  valid.map((res) => `- [${res.label}](${res.url})`).join('\n')
              : '';
          })()
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    alert(`Learning Roadmap for ${activeRoadmap.job_title} copied to clipboard!`);
  };

  // Computed metrics for active roadmap
  const activeMilestones = activeRoadmap?.roadmap_data?.weekly_milestones || [];
  const totalTasks = activeMilestones.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);
  const totalResources = activeMilestones.reduce((acc, m) => acc + (m.resources?.length || 0), 0);
  const completedTasksMap = activeRoadmap?.completed_tasks || {};
  const completedCount = Object.values(completedTasksMap).filter(Boolean).length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const targetCancelItem = roadmaps.find((r) => r.id === pendingCancelId);

  return (
    <div className="bg-hero-quantum text-[#F1F5F9] min-h-screen antialiased p-3 sm:p-6 lg:p-8 flex flex-col justify-between">
      {/* ================= TOP FLOATING NAVIGATION BAR ================= */}
      <header className="max-w-7xl w-full mx-auto pb-4 mb-4">
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
                Multi-Roadmap Deck
              </span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5">
            {/* Unified User Profile & Cloud Sync Pill */}
            <UserNavPill />

            <button
              type="button"
              onClick={onBackToGapAnalysis}
              className="glass-pill px-3.5 py-1.5 rounded-full text-xs text-white/90 hover:text-white hover:bg-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span>
              <span className="hidden md:inline">Back to Gap Analysis</span>
              <span className="md:hidden">Back</span>
            </button>
            <button
              type="button"
              onClick={handleExportPlan}
              disabled={!activeRoadmap}
              className="glass-pill px-3.5 py-1.5 rounded-full text-xs text-cyan-300 hover:bg-white/20 transition-all font-semibold flex items-center gap-1.5 cursor-pointer border border-cyan-400/30 disabled:opacity-50"
            >
              <span>📥</span> Export Plan
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN WORKSPACE CONTENT ================= */}
      <main className="max-w-7xl w-full mx-auto space-y-6">
        {/* Workspace Title & Live Progress Header */}
        <div className="space-y-2">
          <div className="accent-bar" />
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Target Role Roadmaps
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {roadmaps.length} Active Targets
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/70 max-w-2xl font-light mt-1">
                Swipe between the opportunities you are targeting. Each roadmap tracks independent
                milestones, ATS match scores, and daily study commitments.
              </p>
            </div>

            {/* Live Progress Pill for Active Roadmap */}
            {activeRoadmap && (
              <div className="glass-frame rounded-2xl px-5 py-3 flex items-center gap-4 border border-white/20 self-start lg:self-auto">
                <div className="text-left">
                  <span className="text-[10px] font-mono uppercase text-cyan-300 block">
                    Active Role Progress
                  </span>
                  <span className="text-base font-extrabold text-white">
                    {completedCount} / {totalTasks} Tasks ({progressPct}%)
                  </span>
                </div>
                <div className="w-24 bg-white/10 h-2 rounded-full overflow-hidden border border-white/15">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">⚠</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-3 py-1 rounded-lg bg-rose-500/30 text-rose-200 text-xs font-semibold hover:bg-rose-500/40 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ================= MULTI-ROADMAP SWIPEABLE CAROUSEL ================= */}
        {roadmaps.length > 0 && (
          <RoadmapCarouselHeader
            roadmaps={roadmaps}
            activeRoadmapId={activeRoadmapId}
            onSelectRoadmap={(id) => setActiveRoadmapId(id)}
            onPromptCancelRoadmap={handlePromptCancelRoadmap}
            onAddNewRole={onBackToGapAnalysis}
            paceMode={paceMode}
          />
        )}

        {/* If user cancelled all roadmaps */}
        {roadmaps.length === 0 && (
          <div className="glass-frame rounded-3xl p-10 text-center space-y-4">
            <span className="text-4xl block">🎯</span>
            <h3 className="text-lg font-bold text-white">No Target Roadmaps Tracked</h3>
            <p className="text-xs text-white/60 max-w-md mx-auto">
              You currently have no active learning curriculums. Paste a target job description in Gap
              Analysis to synthesize a tailored roadmap.
            </p>
            <button
              type="button"
              onClick={onBackToGapAnalysis}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xs transition cursor-pointer"
            >
              + Create New Target Roadmap
            </button>
          </div>
        )}

        {/* ================= CONTROLS BAR ================= */}
        {activeRoadmap && (
          <RoadmapControlsBar
            weeklyHours={activeRoadmap.weekly_hours}
            setWeeklyHours={handleSetWeeklyHours}
            durationWeeks={activeRoadmap.duration_weeks}
            setDurationWeeks={handleSetDurationWeeks}
            onRegenerate={handleRegenerate}
            isGenerating={isGenerating}
            totalMilestones={activeMilestones.length}
            totalTasks={totalTasks}
            totalResources={totalResources}
            paceMode={paceMode}
            setPaceMode={setPaceMode}
            activeRoleTitle={activeRoadmap.job_title}
            activeCompany={activeRoadmap.company_name}
          />
        )}

        {/* ================= PRIORITY GAP BADGES OVERVIEW ================= */}
        {activeRoadmap?.roadmap_data?.prioritization_badges && (
          <PriorityBadgesOverview badges={activeRoadmap.roadmap_data.prioritization_badges} />
        )}

        {/* ================= WEEKLY TIMELINE STEPPER ================= */}
        {isGenerating ? (
          <div className="glass-frame rounded-3xl p-12 text-center space-y-4 border border-cyan-400/35 shadow-xl shadow-cyan-500/10">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto shadow-lg shadow-cyan-500/30" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                Synthesizing Your Tailored Learning Curriculum...
              </h4>
              <p className="text-xs text-white/60 max-w-md mx-auto">
                Analyzing your verified missing skills and structuring customized weekly milestones, practical tasks, and documentation resources.
              </p>
            </div>
          </div>
        ) : activeMilestones.length > 0 ? (
          <WeeklyTimelineStepper
            milestones={activeMilestones}
            completedTasks={completedTasksMap}
            onToggleTask={handleToggleTask}
          />
        ) : (
          activeRoadmap && (
            <div className="glass-frame rounded-3xl p-10 text-center space-y-3">
              <span className="text-3xl block">🗺️</span>
              <h4 className="text-base font-bold text-white">No Roadmap Milestones Synthesized Yet</h4>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                Click "⚡ Re-synthesize" above to generate your customized curriculum milestones.
              </p>
            </div>
          )
        )}

        {/* ================= NEXT STEP ACTION CALLOUT ================= */}
        {activeRoadmap && (
          <div className="glass-frame rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-bold text-white">
                Ready to interview for {activeRoadmap.company_name || 'this role'}?
              </h4>
              <p className="text-xs text-white/60">
                Practice tailored STAR scenarios and technical interview questions with Career Copilot AI.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateCopilot}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>Launch Career Copilot</span>
              <span>→</span>
            </button>
          </div>
        )}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="max-w-7xl w-full mx-auto pt-6 mt-8 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
        <span>Career Compass AI • Multi-Roadmap Swipe Deck & ATS Tracker</span>
        <span>Quantum Glass Prism Architecture</span>
      </footer>

      {/* ================= FROSTED GLASS CANCELLATION MODAL ================= */}
      <CancelRoadmapModal
        isOpen={cancelModalOpen}
        roleName={targetCancelItem?.job_title || 'Target Role'}
        companyName={targetCancelItem?.company_name || ''}
        onClose={handleCloseCancelModal}
        onConfirm={handleConfirmCancelRoadmap}
      />
    </div>
  );
};
