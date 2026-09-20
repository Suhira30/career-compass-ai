import React from 'react';
import { GapAnalysisResponse } from '../../types';

interface SkillGapDashboardProps {
  analysisData?: GapAnalysisResponse | null;
  onNavigateRoadmap?: (gaps: string[], analysisId?: string) => void;
  onNavigateCopilot?: () => void;
  onNavigateGalaxy?: () => void;
}

export const SkillGapDashboard: React.FC<SkillGapDashboardProps> = ({
  analysisData,
  onNavigateRoadmap,
  onNavigateCopilot,
  onNavigateGalaxy,
}) => {
  if (!analysisData) {
    return (
      <div className="glass-frame rounded-3xl p-8 sm:p-12 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-xl shadow-inner">
          📊
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Awaiting Gap Analysis
        </h3>
        <p className="text-xs sm:text-sm text-white/50 max-w-lg mx-auto font-light">
          Upload your resume and click <strong className="text-white">"Analyze Match & Skill Gaps"</strong> above to calculate your exact ATS match score, critical missing skills, and strengths.
        </p>
      </div>
    );
  }

  const matchScore = analysisData.match_score_percentage;
  const readinessCategory = analysisData.readiness_category;
  const matchedSkills = analysisData.skill_matrix?.matched_skills || [];
  const missingSkills = analysisData.skill_matrix?.missing_skills || [];
  const partialSkills = analysisData.skill_matrix?.partially_available_skills || [];
  const criticalGaps = missingSkills.length > 0 ? missingSkills : ['Target Requirement Gaps'];

  const scoreAngle = Math.round((matchScore / 100) * 360);

  return (
    <div className="space-y-6">
      {/* ================= ROW 3: BENCHMARK MATCH + ATS GAP INTELLIGENCE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= LEFT: MATCH COMPATIBILITY SCORE (COL 4) ================= */}
        <div className="lg:col-span-4 glass-frame rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Match Compatibility</h3>
                <p className="text-[11px] text-white/50">ATS alignment score</p>
              </div>
              <span className="glass-pill px-3 py-1 rounded-full text-xs font-bold text-cyan-300 border border-cyan-400/30">
                {readinessCategory}
              </span>
            </div>

            {/* Circular Score Visualizer */}
            <div className="my-6 flex justify-center">
              <div
                className="relative w-40 h-40 rounded-full p-3 flex items-center justify-center shadow-2xl"
                style={{
                  background: `conic-gradient(#06b6d4 0deg, #3b82f6 ${scoreAngle * 0.6}deg, #8b5cf6 ${scoreAngle}deg, rgba(255, 255, 255, 0.08) ${scoreAngle}deg)`,
                }}
              >
                <div className="w-full h-full rounded-full bg-[#080D1D] flex flex-col items-center justify-center text-center border border-white/15 shadow-inner">
                  <span className="text-4xl font-black text-cyan-300 leading-none">{matchScore}%</span>
                  <span className="text-[10px] uppercase text-white/60 tracking-wider mt-1 font-bold">
                    MATCH SCORE
                  </span>
                </div>
              </div>
            </div>

            {/* Alignment Progress Bars */}
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Required Skills Overlap</span>
                  <span className="text-cyan-400 font-bold">{matchedSkills.length} Matched</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.round((matchedSkills.length / Math.max(1, matchedSkills.length + missingSkills.length)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Identified Gaps</span>
                  <span className="text-rose-400 font-bold">{missingSkills.length} Missing</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.round((missingSkills.length / Math.max(1, matchedSkills.length + missingSkills.length)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {partialSkills.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/80">Partially Available</span>
                    <span className="text-amber-400 font-bold">{partialSkills.length}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 text-xs text-white/60 leading-relaxed">
            <strong className="text-white">Analysis Status:</strong> Evaluated with calibrated skill matrix and qualitative AI assessment.
          </div>
        </div>

        {/* ================= RIGHT: SKILL GAP BREAKDOWN (COL 8) ================= */}
        <div className="lg:col-span-8 glass-frame rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Identified Skill Gaps & Strengths
                </h3>
                <p className="text-[11px] text-white/50">Categorized competency diagnostic</p>
              </div>
              <span className="glass-pill px-3 py-1 rounded-full text-xs font-bold text-rose-300 border border-rose-500/30">
                {missingSkills.length} Gaps Found
              </span>
            </div>

            {/* Grid of Dynamic Diagnostic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Missing Skills Cards */}
              {missingSkills.slice(0, 2).map((skill, idx) => (
                <div
                  key={`missing-${idx}`}
                  className="rounded-2xl p-4 bg-rose-950/20 border border-rose-500/35 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        CRITICAL GAP
                      </span>
                      <span className="text-xs text-rose-400 font-bold">Priority {idx + 1}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{skill}</h4>
                    <p className="text-xs text-white/65 leading-relaxed">
                      {analysisData.assessment?.skill_gaps?.[idx] ||
                        'Required competency specified in target job description but missing from profile.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-rose-500/20 text-xs font-semibold text-cyan-300">
                    Recommended Upskilling Focus
                  </div>
                </div>
              ))}

              {/* Matched Skills / Core Strength */}
              {matchedSkills.slice(0, 1).map((skill, idx) => (
                <div
                  key={`matched-${idx}`}
                  className="rounded-2xl p-4 bg-emerald-950/20 border border-emerald-500/35 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        CORE STRENGTH
                      </span>
                      <span className="text-xs text-emerald-400 font-bold">+ Strong Match</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{skill}</h4>
                    <p className="text-xs text-white/65 leading-relaxed">
                      {analysisData.assessment?.strengths?.[idx] ||
                        'Directly matches key qualifications in the employer job description.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-emerald-500/20 text-xs text-emerald-300/80">
                    Verified Competency
                  </div>
                </div>
              ))}

              {/* Recommendations / Secondary Gap */}
              {analysisData.assessment?.recommended_improvements?.[0] && (
                <div className="rounded-2xl p-4 bg-amber-950/20 border border-amber-500/35 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        RECOMMENDATION
                      </span>
                      <span className="text-xs text-amber-400 font-bold">Action Item</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Target Improvement</h4>
                    <p className="text-xs text-white/65 leading-relaxed">
                      {analysisData.assessment.recommended_improvements[0]}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-amber-500/20 text-xs text-amber-300/80">
                    Curriculum Priority
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
            <span>
              Readiness Tier: <strong className="text-emerald-400">{readinessCategory}</strong>
            </span>
            <span className="text-cyan-300">Ready to bridge gaps</span>
          </div>
        </div>
      </div>

      {/* ================= ROW 4: ACTION BRIDGES ================= */}
      <div className="glass-frame rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1 border-b border-white/10 pb-3">
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            Next Steps: Close Your Gaps & Accelerate
          </h3>
          <p className="text-xs text-white/60">
            Transition directly from analysis into targeted learning or AI-guided interview coaching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Generate Learning Roadmap */}
          <div className="glass-pill-dark rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-cyan-400/50 hover:bg-white/[0.08] transition-all border border-white/15">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-2xl">🗺️</span>
                <span className="glass-pill px-2.5 py-0.5 rounded-full text-cyan-300 font-bold text-[11px] border border-cyan-400/30">
                  Target Roadmap
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Generate Learning Roadmap</h4>
              <p className="text-xs text-white/65 leading-relaxed">
                Create a customized curriculum targeting your missing skills: {criticalGaps.slice(0, 2).join(', ')}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateRoadmap?.(criticalGaps, analysisData?.analysis_id)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Generate Roadmap</span>
              <span>→</span>
            </button>
          </div>

          {/* Column 2: Prepare Interview & Cover Letter */}
          <div className="glass-pill-dark rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-purple-400/50 hover:bg-white/[0.08] transition-all border border-white/15">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-2xl">🤖</span>
                <span className="glass-pill px-2.5 py-0.5 rounded-full text-purple-300 font-bold text-[11px] border border-purple-400/30">
                  AI Copilot
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Interview Practice & Cover Letter</h4>
              <p className="text-xs text-white/65 leading-relaxed">
                Practice tailored STAR interview questions and draft a high-impact cover letter for this role.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateCopilot}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Start Practice</span>
              <span>→</span>
            </button>
          </div>

          {/* Column 3: Explore Career Galaxy */}
          <div className="glass-pill-dark rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-400/50 hover:bg-white/[0.08] transition-all border border-white/15">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-2xl">✦</span>
                <span className="glass-pill px-2.5 py-0.5 rounded-full text-emerald-300 font-bold text-[11px] border border-emerald-400/30">
                  Career Galaxy
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Explore Career Galaxy</h4>
              <p className="text-xs text-white/65 leading-relaxed">
                Explore adjacent roles and career paths in the interactive 3D vector space.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateGalaxy}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Explore Roles</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
