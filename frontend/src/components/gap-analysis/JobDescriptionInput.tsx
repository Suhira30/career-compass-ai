import React, { useState } from 'react';
import { apiService, parseApiError } from '../../services/api';
import { JobExtractResponse } from '../../types';

interface JobDescriptionInputProps {
  onAnalyze: (jobId: string, jobData?: JobExtractResponse) => void;
  isAnalyzing: boolean;
}

const SAMPLE_AI_JD = `Role: Senior AI & Systems Engineer (Scale AI / Anthropic)
Seeking engineer with deep expertise in Python, LangGraph stateful orchestration, dense/sparse hybrid search (BM25 + Cohere rerankers), distributed caching with Redis, and automated evaluation harnesses (Ragas). Must demonstrate production experience with latency-constrained LLM inference pipelines, multi-turn agent guardrails, and asynchronous event-driven streaming architecture.`;

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  onAnalyze,
  isAnalyzing,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [rawJd, setRawJd] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoadSample = () => {
    setJobTitle('Senior AI & Systems Engineer');
    setRawJd(SAMPLE_AI_JD);
    setErrorMessage(null);
  };

  const handleTriggerAnalysis = async () => {
    if (!rawJd.trim() || rawJd.trim().length < 20) {
      setErrorMessage('Please provide a complete job description (at least 20 characters).');
      return;
    }

    setErrorMessage(null);

    try {
      // Call backend /api/v1/jobs/extract
      const extractResult = await apiService.extractJobDescription(rawJd);
      onAnalyze(extractResult.job_id, extractResult);
    } catch (err) {
      console.error('Job extraction API failed:', err);
      setErrorMessage(parseApiError(err));
    }
  };

  return (
    <div className="glass-frame rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 text-sm">
              🎯
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Target Job Description</h3>
              <p className="text-[11px] text-white/50">Define the position you want to target</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="glass-pill hover:bg-white/20 text-xs font-semibold text-purple-300 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚡</span> Load Sample JD
            </button>
          </div>
        </div>

        {/* Target Job Role Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/80 block">Target Job Title</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior AI / ML Platform Engineer"
            className="w-full px-3.5 py-2.5 rounded-xl glass-pill-dark text-xs text-white font-medium focus:outline-none focus:border-purple-400 border border-white/15"
          />
        </div>

        {/* JD Textarea Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/80 block">
            Job Description & Requirements
          </label>
          <textarea
            rows={5}
            value={rawJd}
            onChange={(e) => setRawJd(e.target.value)}
            placeholder="Paste target job description, requirements, and tech stack here..."
            className="w-full p-3.5 rounded-xl glass-pill-dark text-xs text-white/90 leading-relaxed focus:outline-none focus:border-purple-400 border border-white/15 resize-none font-mono"
          />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Action Trigger Button */}
      <div className="pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={handleTriggerAnalysis}
          disabled={isAnalyzing}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold tracking-wide glow-cyan-btn flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{isAnalyzing ? 'Analyzing Skills & Gaps...' : 'Analyze Match & Skill Gaps'}</span>
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
            →
          </span>
        </button>
      </div>
    </div>
  );
};
