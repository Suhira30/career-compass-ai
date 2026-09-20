import React, { useRef } from 'react';
import { TrackedRoadmapItem } from '../../types';

interface RoadmapCarouselHeaderProps {
  roadmaps: TrackedRoadmapItem[];
  activeRoadmapId: string;
  onSelectRoadmap: (id: string) => void;
  onPromptCancelRoadmap: (id: string) => void;
  onAddNewRole: () => void;
  paceMode: 'week' | 'day';
}

export const RoadmapCarouselHeader: React.FC<RoadmapCarouselHeaderProps> = ({
  roadmaps,
  activeRoadmapId,
  onSelectRoadmap,
  onPromptCancelRoadmap,
  onAddNewRole,
  paceMode,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const scrollAmount = 320;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="space-y-2">
      {/* Subheader controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase text-white/50 tracking-wider">
            Target Role Deck
          </span>
          <span className="text-[11px] text-white/40 hidden sm:inline">
            • Select a role card to switch active workspace
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            title="Scroll Left"
            className="w-8 h-8 rounded-full glass-pill hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer text-xs"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            title="Scroll Right"
            className="w-8 h-8 rounded-full glass-pill hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer text-xs"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {roadmaps.map((rm) => {
          const isActive = rm.id === activeRoadmapId;

          // Compute task stats
          const milestones = rm.roadmap_data?.weekly_milestones || [];
          const totalTasks = milestones.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);
          const completedCount = Object.values(rm.completed_tasks || {}).filter(Boolean).length;
          const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

          // ATS Badge Colors
          let atsColorClass = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/35';
          if (rm.ats_score_percentage < 70) {
            atsColorClass = 'text-amber-400 bg-amber-500/15 border-amber-500/35';
          }

          const dailyHours = (rm.weekly_hours / 5).toFixed(1);
          const commitmentLabel =
            paceMode === 'week'
              ? `${rm.duration_weeks} Wks • ${rm.weekly_hours}h/wk`
              : `${rm.duration_weeks} Wks • ~${dailyHours}h/day`;

          return (
            <div
              key={rm.id}
              onClick={() => onSelectRoadmap(rm.id)}
              className={`flex-shrink-0 w-72 sm:w-80 rounded-2xl p-4 transition-all duration-300 cursor-pointer snap-start relative ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-500/20 via-slate-900/90 to-purple-600/15 border border-cyan-400/60 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30'
                  : 'bg-slate-900/50 hover:bg-slate-900/70 border border-white/15 hover:border-white/30 opacity-80 hover:opacity-100 hover:-translate-y-0.5'
              }`}
            >
              {/* Header: ATS Score & Cancel Button */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${atsColorClass}`}
                >
                  {rm.ats_score_percentage}% ATS Match
                </span>
                <div className="flex items-center gap-1.5">
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-cyan-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      ACTIVE
                    </span>
                  )}
                  <button
                    type="button"
                    title="Cancel this Roadmap"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPromptCancelRoadmap(rm.id);
                    }}
                    className="w-6 h-6 rounded-full hover:bg-rose-500/30 text-white/40 hover:text-rose-300 flex items-center justify-center text-xs transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Role & Company */}
              <div className="space-y-0.5 mb-3">
                <span className="text-[11px] font-mono uppercase text-white/50 block truncate">
                  {rm.company_name || 'Target Opportunity'}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white truncate leading-tight">
                  {rm.job_title}
                </h4>
              </div>

              {/* Schedule & Commitment Pill */}
              <div className="flex items-center justify-between text-xs text-white/70 py-1.5 px-2.5 rounded-xl bg-black/30 border border-white/10 mb-3">
                <span className="font-mono text-[11px] text-cyan-300">🗓 {commitmentLabel}</span>
                <span className="text-[10px] text-white/50">
                  {milestones.length} Milestones
                </span>
              </div>

              {/* Progress Bar & Count */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-white/70">
                  <span>Task Progress</span>
                  <span className="font-mono font-semibold text-white">
                    {completedCount}/{totalTasks} ({progressPct}%)
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Append "+ Track Another Role" Card */}
        <div
          onClick={onAddNewRole}
          className="flex-shrink-0 w-64 rounded-2xl p-5 border border-dashed border-white/20 hover:border-cyan-400/50 hover:bg-cyan-500/5 transition-all duration-300 cursor-pointer snap-start flex flex-col items-center justify-center text-center space-y-2 group"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-cyan-500/20 text-white group-hover:text-cyan-300 flex items-center justify-center text-lg font-bold transition">
            +
          </div>
          <span className="text-xs font-bold text-white group-hover:text-cyan-300">
            Track Another Role
          </span>
          <span className="text-[10px] text-white/40 max-w-[160px] leading-relaxed">
            Run Gap Analysis on a new JD to append another tailored roadmap
          </span>
        </div>
      </div>
    </section>
  );
};

