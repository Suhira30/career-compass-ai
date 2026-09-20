import React, { useCallback, useRef, useState } from 'react';

export const SAMPLE_AI_JD = `Role: Senior AI & Systems Engineer (Scale AI / Anthropic)
Seeking engineer with deep expertise in Python, LangGraph stateful orchestration, dense/sparse hybrid search (BM25 + Cohere rerankers), distributed caching with Redis, and automated evaluation harnesses (Ragas). Must demonstrate production experience with latency-constrained LLM inference pipelines, multi-turn agent guardrails, and asynchronous event-driven streaming architecture.`;

interface JobDescriptionInputProps {
  jobTitle: string;
  setJobTitle: (val: string) => void;
  rawJd: string;
  setRawJd: (val: string) => void;
  onLoadSample?: () => void;
  errorMessage?: string | null;
  isAnalyzing?: boolean;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  jobTitle,
  setJobTitle,
  rawJd,
  setRawJd,
  onLoadSample,
  errorMessage,
  isAnalyzing = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Subtle interactive cursor spotlight on the card frame
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--card-mouse-x', `${x}px`);
    card.style.setProperty('--card-mouse-y', `${y}px`);
  }, []);

  const handleDefaultLoadSample = () => {
    if (onLoadSample) {
      onLoadSample();
    } else {
      setJobTitle('Senior AI & Systems Engineer');
      setRawJd(SAMPLE_AI_JD);
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative glass-frame rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 h-full overflow-hidden transition-all duration-300 group"
    >
      {/* Interactive Subtle Cursor Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle 300px at var(--card-mouse-x, 50%) var(--card-mouse-y, 50%), rgba(168, 85, 247, 0.12) 0%, transparent 70%)`,
        }}
      />

      <div className="space-y-4 relative z-10">
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
              onClick={handleDefaultLoadSample}
              disabled={isAnalyzing}
              className="glass-pill hover:bg-white/20 text-xs font-semibold text-purple-300 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
            disabled={isAnalyzing}
            spellCheck={false}
            placeholder="e.g. Senior AI / ML Platform Engineer"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/70 focus:bg-slate-900/80 text-xs text-white font-medium focus:outline-none focus:border-purple-400 border border-white/15 transition-all disabled:opacity-50"
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
            disabled={isAnalyzing}
            spellCheck={false}
            placeholder="Paste target job description, requirements, and tech stack here..."
            className="w-full p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/70 focus:bg-slate-900/80 text-xs text-white/90 leading-relaxed focus:outline-none focus:border-purple-400 border border-white/15 resize-none font-mono transition-all disabled:opacity-50"
          />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Symmetrical Card Footer matching ResumeUploader */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50 relative z-10">
        <span>
          Target Role:{' '}
          <strong className="text-white">
            {jobTitle.trim() ? jobTitle : 'Custom Role'}
          </strong>
        </span>
        <span className="text-purple-300 font-medium">
          {rawJd.trim().length > 0 ? `${rawJd.trim().length} chars entered` : 'Awaiting Input'}
        </span>
      </div>
    </div>
  );
};
