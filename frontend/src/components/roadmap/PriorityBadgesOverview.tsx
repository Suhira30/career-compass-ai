import React from 'react';
import { PrioritizationBadges } from '../../types';

interface PriorityBadgesOverviewProps {
  badges: PrioritizationBadges;
}

export const PriorityBadgesOverview: React.FC<PriorityBadgesOverviewProps> = ({ badges }) => {
  return (
    <div className="glass-frame rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase">
            Curriculum Skill Prioritization Breakdown
          </h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-300">Ranked by Job Relevancy</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Priority 1 Critical */}
        <div className="p-4 rounded-2xl glass-pill-dark border border-rose-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-rose-300 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30">
              Priority 1 • Critical Prerequisites
            </span>
            <span className="text-xs font-bold text-rose-400">Week 1–2</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {badges.priority_1_critical && badges.priority_1_critical.length > 0 ? (
              badges.priority_1_critical.map((skill, idx) => (
                <span
                  key={idx}
                  className="glass-pill px-2.5 py-1 rounded-lg text-xs font-medium text-white border border-rose-400/30"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-white/40 italic">No critical prerequisite gaps</span>
            )}
          </div>
        </div>

        {/* Priority 2 High */}
        <div className="p-4 rounded-2xl glass-pill-dark border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30">
              Priority 2 • Core Competencies
            </span>
            <span className="text-xs font-bold text-cyan-400">Week 3–4</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {badges.priority_2_high && badges.priority_2_high.length > 0 ? (
              badges.priority_2_high.map((skill, idx) => (
                <span
                  key={idx}
                  className="glass-pill px-2.5 py-1 rounded-lg text-xs font-medium text-white border border-cyan-400/30"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-white/40 italic">No core competency gaps</span>
            )}
          </div>
        </div>

        {/* Priority 3 Secondary */}
        <div className="p-4 rounded-2xl glass-pill-dark border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
              Priority 3 • Secondary Optimization
            </span>
            <span className="text-xs font-bold text-purple-400">Post-Target</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {badges.priority_3_secondary && badges.priority_3_secondary.length > 0 ? (
              badges.priority_3_secondary.map((skill, idx) => (
                <span
                  key={idx}
                  className="glass-pill px-2.5 py-1 rounded-lg text-xs font-medium text-white border border-purple-400/30"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-white/40 italic">No secondary bonus gaps</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

