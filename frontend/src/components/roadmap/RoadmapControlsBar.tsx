import React from 'react';

interface RoadmapControlsBarProps {
  weeklyHours: number;
  setWeeklyHours: (hours: number) => void;
  durationWeeks: number;
  setDurationWeeks: (weeks: number) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  totalMilestones: number;
  totalTasks: number;
  totalResources: number;
  paceMode?: 'week' | 'day';
  setPaceMode?: (mode: 'week' | 'day') => void;
  activeRoleTitle?: string;
  activeCompany?: string;
}

export const RoadmapControlsBar: React.FC<RoadmapControlsBarProps> = ({
  weeklyHours,
  setWeeklyHours,
  durationWeeks,
  setDurationWeeks,
  onRegenerate,
  isGenerating,
  totalMilestones,
  totalTasks,
  totalResources,
  paceMode = 'week',
  setPaceMode,
  activeRoleTitle,
  activeCompany,
}) => {
  const durations = [2, 4, 8, 12];
  const dailyHours = (weeklyHours / 5).toFixed(1);

  return (
    <div className="glass-frame rounded-3xl p-6 sm:p-7 space-y-5">
      {/* Role Subheader & Pace Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-semibold">
              Roadmap Tuning
            </span>
            {activeRoleTitle && (
              <span className="text-xs text-white/60 font-medium">
                • {activeCompany ? `${activeCompany} — ` : ''}
                {activeRoleTitle}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-white mt-0.5">Study Pacing & Weekly Budget</h3>
        </div>

        {/* Day / Week Commitment Switcher */}
        {setPaceMode && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <span className="text-xs text-white/60">View Pace:</span>
            <div className="glass-pill-dark p-1 rounded-xl flex items-center gap-1 border border-white/15">
              <button
                type="button"
                onClick={() => setPaceMode('week')}
                className={`px-3 py-1 rounded-lg text-xs transition cursor-pointer ${
                  paceMode === 'week'
                    ? 'font-semibold bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                    : 'font-medium text-white/60 hover:text-white'
                }`}
              >
                Weekly View
              </button>
              <button
                type="button"
                onClick={() => setPaceMode('day')}
                className={`px-3 py-1 rounded-lg text-xs transition cursor-pointer ${
                  paceMode === 'day'
                    ? 'font-semibold bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                    : 'font-medium text-white/60 hover:text-white'
                }`}
              >
                Daily Target (~{dailyHours}h/day)
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Weekly Study Hours Slider */}
        <div className="w-full lg:w-1/3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-white/90 flex items-center gap-1.5">
              <span>⏱</span> Available Study Commitment
            </label>
            <span className="font-mono text-cyan-300 font-bold px-2 py-0.5 rounded-md glass-pill-dark border border-cyan-400/30">
              {paceMode === 'week' ? `${weeklyHours} hrs / week` : `~${dailyHours} hrs / day (${weeklyHours}h/wk)`}
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="25"
            value={weeklyHours}
            step="1"
            onChange={(e) => setWeeklyHours(Number(e.target.value))}
            disabled={isGenerating}
            className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-white/40 font-mono">
            <span>2 hrs (Light)</span>
            <span>10 hrs (Standard)</span>
            <span>25 hrs (Intensive)</span>
          </div>
        </div>

        {/* Duration Selector Pills */}
        <div className="w-full lg:w-1/3 space-y-2">
          <label className="text-xs font-semibold text-white/90 block flex items-center gap-1.5">
            <span>📅</span> Target Duration Timeline
          </label>
          <div className="grid grid-cols-4 gap-2">
            {durations.map((w) => {
              const isSelected = durationWeeks === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setDurationWeeks(w)}
                  disabled={isGenerating}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 border-cyan-400/50 shadow-sm'
                      : 'text-white/60 border-white/15 glass-pill-dark hover:border-white/30 hover:text-white'
                  }`}
                >
                  {w} Wks
                </button>
              );
            })}
          </div>
        </div>

        {/* Regenerate Action Button */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 self-end">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold tracking-wide glow-cyan-btn flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{isGenerating ? '⚡ Synthesizing Milestones...' : '⚡ Re-synthesize'}</span>
            <span
              className={`w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs ${
                isGenerating ? 'animate-spin' : ''
              }`}
            >
              ↻
            </span>
          </button>
        </div>
      </div>

      {/* Quick Summary Footprint */}
      <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-white/60 gap-3">
        <div className="flex items-center gap-2">
          <span>Target Budget:</span>
          <strong className="text-cyan-300 font-mono">
            {durationWeeks} Weeks × {weeklyHours} Hours = {durationWeeks * weeklyHours} Total Study Hours
          </strong>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-emerald-400">● {totalMilestones} Milestones</span>
          <span className="text-white/30">•</span>
          <span className="text-cyan-300">● {totalTasks} Practical Tasks</span>
          <span className="text-white/30">•</span>
          <span className="text-purple-300">● {totalResources} Verified Resources</span>
        </div>
      </div>
    </div>
  );
};
