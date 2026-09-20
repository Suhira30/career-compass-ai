import React from 'react';
import { WeeklyMilestone } from '../../types';

interface WeeklyTimelineStepperProps {
  milestones: WeeklyMilestone[];
  completedTasks: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
}

export const WeeklyTimelineStepper: React.FC<WeeklyTimelineStepperProps> = ({
  milestones,
  completedTasks,
  onToggleTask,
}) => {
  // Color theme generator per week index
  const getWeekColorTheme = (weekIdx: number) => {
    const themes = [
      {
        badgeBg: 'bg-cyan-500/20',
        badgeText: 'text-cyan-300',
        badgeBorder: 'border-cyan-400/30',
        bulletBorder: 'border-cyan-400',
        bulletShadow: 'shadow-[0_0_12px_#38bdf8]',
        bulletText: 'text-cyan-300',
        cardHoverBorder: 'hover:border-cyan-400/40',
        accentColor: 'text-cyan-300',
        accentBg: 'bg-cyan-500/10',
        accentBorder: 'border-cyan-500/30',
      },
      {
        badgeBg: 'bg-blue-500/20',
        badgeText: 'text-blue-300',
        badgeBorder: 'border-blue-400/30',
        bulletBorder: 'border-blue-400',
        bulletShadow: 'shadow-[0_0_12px_#3b82f6]',
        bulletText: 'text-blue-300',
        cardHoverBorder: 'hover:border-blue-400/40',
        accentColor: 'text-blue-300',
        accentBg: 'bg-blue-500/10',
        accentBorder: 'border-blue-500/30',
      },
      {
        badgeBg: 'bg-purple-500/20',
        badgeText: 'text-purple-300',
        badgeBorder: 'border-purple-400/30',
        bulletBorder: 'border-purple-400',
        bulletShadow: 'shadow-[0_0_12px_#8b5cf6]',
        bulletText: 'text-purple-300',
        cardHoverBorder: 'hover:border-purple-400/40',
        accentColor: 'text-purple-300',
        accentBg: 'bg-purple-500/10',
        accentBorder: 'border-purple-500/30',
      },
      {
        badgeBg: 'bg-pink-500/20',
        badgeText: 'text-pink-300',
        badgeBorder: 'border-pink-400/30',
        bulletBorder: 'border-pink-400',
        bulletShadow: 'shadow-[0_0_12px_#ec4899]',
        bulletText: 'text-pink-300',
        cardHoverBorder: 'hover:border-pink-400/40',
        accentColor: 'text-pink-300',
        accentBg: 'bg-pink-500/10',
        accentBorder: 'border-pink-500/30',
      },
    ];
    return themes[weekIdx % themes.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>📅</span> Week-by-Week Learning Execution Plan
        </h3>
        <span className="text-xs text-white/50">Check off tasks as you complete them</span>
      </div>

      {/* Timeline Stepper Container */}
      <div className="relative pl-6 sm:pl-10 space-y-6">
        {/* Connecting Vertical Luminous Beam */}
        <div className="absolute left-2 sm:left-4 top-4 bottom-4 w-1 timeline-beam rounded-full pointer-events-none" />

        {milestones.map((milestone, mIdx) => {
          const theme = getWeekColorTheme(mIdx);
          const weekTasks = milestone.tasks || [];
          const weekResources = milestone.resources || [];

          return (
            <div
              key={milestone.week || mIdx}
              className={`relative glass-frame rounded-3xl p-6 sm:p-7 space-y-4 border border-white/20 transition-all ${theme.cardHoverBorder}`}
            >
              {/* Timeline Node Bullet */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-7 w-7 h-7 rounded-full bg-[#0c1224] border-2 ${theme.bulletBorder} flex items-center justify-center text-[10px] font-bold ${theme.bulletText} ${theme.bulletShadow}`}
              >
                {milestone.week || mIdx + 1}
              </div>

              {/* Milestone Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase font-extrabold px-2.5 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                    >
                      WEEK {String(milestone.week || mIdx + 1).padStart(2, '0')}
                    </span>
                    <span className="glass-pill px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 border border-emerald-400/30">
                      Active Sprint
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                    {milestone.focus_skill}
                  </h4>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="glass-pill px-3 py-1 rounded-xl text-xs font-mono font-bold text-cyan-300 border border-white/15">
                    ⏱ {milestone.target_hours || 5} Hours Allocated
                  </span>
                </div>
              </div>

              {/* Practical Engineering Milestones Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60 block">
                  Practical Engineering Milestones
                </span>
                <div className="space-y-2">
                  {weekTasks.map((task, tIdx) => {
                    const taskId = `w${milestone.week || mIdx + 1}-t${tIdx}`;
                    const isDone = !!completedTasks[taskId];

                    return (
                      <label
                        key={tIdx}
                        onClick={() => onToggleTask(taskId)}
                        className={`flex items-start gap-3 p-3 rounded-xl glass-pill-dark border transition-all cursor-pointer select-none ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}} // Handled by label click
                          className="mt-0.5 w-4 h-4 rounded text-cyan-500 accent-cyan-400 cursor-pointer"
                        />
                        <span
                          className={`text-xs leading-relaxed transition-all ${
                            isDone ? 'line-through text-white/40' : 'text-white/90'
                          }`}
                        >
                          {task}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Verified Documentation & Learning Resources */}
              {weekResources.length > 0 && (
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white/50 text-[11px]">Recommended Docs:</span>
                    {weekResources.map((res, rIdx) => {
                      const isUrl = res.startsWith('http');
                      const label = isUrl
                        ? res.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
                        : res;

                      return (
                        <a
                          key={rIdx}
                          href={isUrl ? res : `https://www.google.com/search?q=${encodeURIComponent(res)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-pill px-2.5 py-1 rounded-lg text-cyan-300 hover:text-white transition-all text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                        >
                          <span>📖</span> {label} ↗
                        </a>
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Target: High Confidence</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

