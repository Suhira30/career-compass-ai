import React, { useEffect, useState } from 'react';
import { apiService, parseApiError } from '../../services/api';
import { CoverLetterRequest, CoverLetterResponse, MatchingProject } from '../../types';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  targetRole?: string;
  companyName?: string;
  jobDescription?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  projects?: MatchingProject[];
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
  isOpen,
  onClose,
  candidateName = '',
  targetRole = 'Senior Software Engineer',
  companyName = '',
  jobDescription = '',
  matchedSkills = [],
  missingSkills = [],
  projects = [],
}) => {
  const [generationType, setGenerationType] = useState<'cover_letter' | 'application_email' | 'recruiter_email'>('cover_letter');
  const [tone, setTone] = useState<'confident' | 'formal' | 'enthusiastic' | 'concise'>('confident');
  const [roleInput, setRoleInput] = useState<string>(targetRole);
  const [companyInput, setCompanyInput] = useState<string>(companyName);
  
  // Selected projects to highlight
  const [selectedProjects, setSelectedProjects] = useState<MatchingProject[]>(projects);
  const [newProjectTitle, setNewProjectTitle] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  const [showAddProject, setShowAddProject] = useState<boolean>(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoverLetterResponse | null>(null);
  const [copiedSubject, setCopiedSubject] = useState<boolean>(false);
  const [copiedContent, setCopiedContent] = useState<boolean>(false);
  const [editableContent, setEditableContent] = useState<string>('');
  const [editableSubject, setEditableSubject] = useState<string>('');

  // Sync props when modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setRoleInput(targetRole || 'Software Engineer');
      setCompanyInput(companyName || '');
      setSelectedProjects(projects.length > 0 ? projects : []);
      setError(null);
    }
  }, [isOpen, targetRole, companyName, projects]);

  if (!isOpen) return null;

  const handleToggleProject = (proj: MatchingProject) => {
    const exists = selectedProjects.some((p) => p.title === proj.title);
    if (exists) {
      setSelectedProjects(selectedProjects.filter((p) => p.title !== proj.title));
    } else {
      setSelectedProjects([...selectedProjects, proj]);
    }
  };

  const handleAddCustomProject = () => {
    if (!newProjectTitle.trim()) return;
    const customProj: MatchingProject = {
      title: newProjectTitle.trim(),
      description: newProjectDesc.trim() || undefined,
    };
    setSelectedProjects([...selectedProjects, customProj]);
    setNewProjectTitle('');
    setNewProjectDesc('');
    setShowAddProject(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const payload: CoverLetterRequest = {
        candidate_name: candidateName || undefined,
        target_role: roleInput.trim() || targetRole,
        company_name: companyInput.trim() || undefined,
        job_description: jobDescription || undefined,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
        projects: selectedProjects,
        generation_type: generationType,
        tone: tone,
      };

      const res = await apiService.generateCoverLetter(payload);
      setResult(res);
      setEditableContent(res.content);
      setEditableSubject(res.subject_line || '');
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, isSubject: boolean) => {
    navigator.clipboard.writeText(text);
    if (isSubject) {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!editableContent) return;
    let fullText = '';
    if (editableSubject) {
      fullText += `Subject: ${editableSubject}\n\n`;
    }
    fullText += editableContent;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeRole = (roleInput || 'Application').replace(/\s+/g, '_');
    link.download = `${safeRole}_${generationType}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="glass-frame rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-white/20 shadow-2xl overflow-hidden bg-slate-900/90 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ================= HEADER ================= */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-lg shadow-inner">
              ✉️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  Cover Letter & Outreach Generator
                </h3>
                <span className="glass-pill px-2.5 py-0.5 rounded-full text-[10px] font-bold text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Synthesize matching project details & verified skills into high-converting application materials
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-pill hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* ================= BODY (SCROLLABLE) ================= */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-white/20">

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button 
                type="button" 
                onClick={() => setError(null)} 
                className="underline hover:text-white ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. Format Selector (3 Modes) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 tracking-wider uppercase">
              1. Select Outreach Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'cover_letter', label: '📄 Tailored Cover Letter', desc: 'Persuasive 3-4 paragraphs with project highlights' },
                { id: 'application_email', label: '💼 Application Email', desc: 'Formal submission email with subject & body' },
                { id: 'recruiter_email', label: '🎯 Cold Recruiter Outreach', desc: 'Punchy 100-140 words hook + call to action' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGenerationType(opt.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    generationType === opt.id
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-bold text-xs sm:text-sm text-white">{opt.label}</div>
                  <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Calibration & Tone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Target Role
              </label>
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-zinc-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Company Name (Optional)
              </label>
              <input
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                placeholder="e.g. Acme Corp / Your Team"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-zinc-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Tone & Writing Style
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 focus:border-cyan-400 focus:outline-none text-xs text-white transition-all cursor-pointer"
              >
                <option value="confident">Confident & Direct (Recommended)</option>
                <option value="formal">Formal & Traditional</option>
                <option value="enthusiastic">Enthusiastic & High-Energy</option>
                <option value="concise">Concise & Executive</option>
              </select>
            </div>
          </div>

          {/* 3. Matching Project Details (The Requested Feature) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-zinc-300 tracking-wider uppercase">
                  2. Select Matching Projects to Weave Into Letter
                </label>
                <p className="text-[11px] text-zinc-400">
                  Select projects from your resume or add custom project metrics to highlight concrete achievements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProject(!showAddProject)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                {showAddProject ? '✕ Cancel' : '+ Add Project'}
              </button>
            </div>

            {/* Custom Project Input Form */}
            {showAddProject && (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-cyan-500/30 space-y-3 animate-fade-in">
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="Project Title (e.g. Distributed Task Queue)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <textarea
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Summary & Key Metrics (e.g. Built async worker with FastAPI and Redis handling 10k jobs/min)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/20 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomProject}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all"
                >
                  Save & Include Project
                </button>
              </div>
            )}

            {/* Project List Chips */}
            {selectedProjects.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/15 text-center text-xs text-zinc-400">
                No matching projects added yet. Click <span className="text-cyan-400 font-semibold cursor-pointer" onClick={() => setShowAddProject(true)}>+ Add Project</span> to highlight specific technical systems.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedProjects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/5 border border-white/15 flex items-start justify-between gap-3 group hover:border-cyan-400/40 transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 text-xs">🚀</span>
                        <h5 className="font-bold text-xs text-white">{proj.title}</h5>
                      </div>
                      {proj.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {proj.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleProject(proj)}
                      className="text-zinc-500 hover:text-rose-400 text-xs transition-colors shrink-0 cursor-pointer"
                      title="Remove from selection"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer ${
                isGenerating
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 cursor-wait'
                  : 'glass-pill bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 hover:border-cyan-400/60 text-white hover:scale-[1.01] active:scale-[0.99] shadow-cyan-500/10 hover:shadow-cyan-400/25'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Matching Projects & Generating Material...</span>
                </>
              ) : (
                <>
                  <span>✦</span>
                  <span>Generate Tailored {generationType === 'cover_letter' ? 'Cover Letter' : generationType === 'application_email' ? 'Application Email' : 'Recruiter Outreach'}</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </div>

          {/* ================= 4. GENERATED RESULT PANEL ================= */}
          {result && (
            <div className="p-5 rounded-2xl glass-frame border border-cyan-500/40 bg-slate-950/70 space-y-4 animate-fade-in mt-4">
              
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-base">✓</span>
                  <span className="font-bold text-xs sm:text-sm text-white">
                    Generated Content Ready for Submission
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-xl glass-pill bg-white/5 hover:bg-white/15 text-xs text-zinc-300 hover:text-white border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>📥</span>
                    <span>Download (.txt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(editableContent, false)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <span>{copiedContent ? '✓ Copied!' : '📋 Copy Letter'}</span>
                  </button>
                </div>
              </div>

              {/* Subject Line (if email mode) */}
              {editableSubject && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-cyan-400">Subject Line:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(editableSubject, true)}
                      className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer text-[11px]"
                    >
                      {copiedSubject ? '✓ Copied Subject' : 'Copy Subject'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 focus:outline-none text-xs text-white font-mono"
                  />
                </div>
              )}

              {/* Editable Body Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-cyan-400">Content Body (Editable):</span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {editableContent.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={12}
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 focus:outline-none text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-white/20 resize-y"
                />
              </div>

              {/* Highlighted Projects & Strengths Badges */}
              {(result.matching_projects_highlighted.length > 0 || result.key_strengths_referenced.length > 0) && (
                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">Woven In:</span>
                  {result.matching_projects_highlighted.map((proj, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      🚀 {proj}
                    </span>
                  ))}
                  {result.key_strengths_referenced.map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      ⚡ {skill}
                    </span>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-3.5 border-t border-white/10 flex items-center justify-between bg-white/[0.01] shrink-0 text-xs text-zinc-400">
          <span>Grounded in Candidate Resume & Vector Matching</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl glass-pill hover:bg-white/10 text-white transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
