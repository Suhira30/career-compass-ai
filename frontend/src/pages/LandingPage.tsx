import React, { useState } from 'react';
import { GlassMenu } from '../components/landing/GlassMenu';

interface LandingPageProps {
  onStartAnalysis?: (role?: string, level?: string, file?: File | null) => void;
  onNavigateToGap?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartAnalysis, onNavigateToGap }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [targetRole, setTargetRole] = useState('Senior AI Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level (2–4 yrs)');
  const [selectedFileName, setSelectedFileName] = useState('resume.pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [advisorQuery, setAdvisorQuery] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const handleQuickAnalyze = () => {
    if (onNavigateToGap) {
      onNavigateToGap();
    } else if (onStartAnalysis) {
      onStartAnalysis(targetRole, experienceLevel, selectedFile);
    } else {
      const el = document.getElementById('gap');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F4F3F8] text-[#121624] antialiased selection:bg-cyan-500 selection:text-white min-h-screen">

      {/* ================= SECTION 1: HERO CONTAINER (3D QUANTUM GLASS PRISM) ================= */}
      <header id="home" className="p-3 sm:p-6 bg-[#E7E4ED]">
        <div className="relative w-full max-w-7xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-hero-quantum min-h-[640px] flex flex-col justify-between p-6 sm:p-10 border border-white/15">
          
          {/* Ambient Glow Orbs */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* TOP NAVBAR */}
          <nav className="flex items-center justify-between z-30 pb-4 border-b border-white/10 relative">
            
            {/* Left Logo */}
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner">
                <svg className="w-5 h-5 text-cyan-300 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7l2.5 5-2.5-1.5L9.5 12 12 7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 17l-2.5-5 2.5 1.5 2.5-1.5L12 17z" />
                </svg>
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block leading-tight">career compass</span>
                <span className="text-[9px] tracking-widest text-cyan-400 uppercase font-mono">QUANTUM AI</span>
              </div>
            </div>

            {/* Center Nav Links */}
            <div className="hidden md:flex items-center gap-7 text-xs font-medium text-white/80">
              <a href="#home" className="text-white hover:text-cyan-300 transition-colors">Home</a>
              <a href="#steps" className="hover:text-cyan-300 transition-colors">How It Works</a>
              <a href="#gap" className="hover:text-cyan-300 transition-colors">Vector Gap Space</a>
              <a href="#roadmap" className="hover:text-cyan-300 transition-colors">Upskill Path</a>
              <a href="#advisor" className="hover:text-cyan-300 transition-colors">AI Advisor</a>
            </div>

            {/* Right Action Button & Glass Menu */}
            <div className="flex items-center gap-3 relative">
              <button
                type="button"
                onClick={handleQuickAnalyze}
                className="hidden sm:flex px-4 py-2 rounded-full glass-pill text-xs font-semibold text-white items-center gap-2 hover:bg-white/25 transition-all border border-white/30 shadow-sm"
              >
                <span>Analyze Resume</span>
                <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-[9px] font-bold">↗</span>
              </button>

              {/* Glass Menu Toggle Button (Top Right) */}
              <button
                id="glassMenuBtn"
                type="button"
                onClick={() => setMenuOpen(true)}
                className="w-10 h-10 rounded-xl glass-pill flex flex-col items-center justify-center gap-1 text-white hover:bg-white/25 hover:border-cyan-400/50 transition-all border border-white/30 shadow-md group cursor-pointer"
                aria-label="Open Fullscreen Navigation Menu"
              >
                <span className="w-4 h-0.5 bg-white group-hover:bg-cyan-300 transition-all" />
                <span className="w-4 h-0.5 bg-white group-hover:bg-cyan-300 transition-all" />
                <span className="w-2.5 h-0.5 bg-cyan-400 self-start ml-3 transition-all" />
              </button>
            </div>

          </nav>

          {/* CENTER GIANT BRAND NAME */}
          <div className="my-auto py-10 sm:py-16 text-center z-10 select-none">
            <h1 className="text-6xl sm:text-8xl md:text-[140px] font-black tracking-[0.14em] text-white brand-giant-text uppercase leading-none opacity-95">
              COMPASS
            </h1>
            <p className="text-xs sm:text-sm tracking-[0.45em] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-purple-300 uppercase mt-2">
              Vector Space Career Navigation & Grounded Intelligence
            </p>
          </div>

          {/* BOTTOM HERO BAR: TAGLINE (LEFT) + QUICK SEARCH CARD (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end z-20 pt-4">
            
            {/* Left Tagline */}
            <div className="lg:col-span-4 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                Precision Navigation in Multi-Dimensional Career Space.
              </h2>
              <p className="text-xs text-white/70 font-light max-w-sm">
                Deconstruct candidate skills into mathematical dense embeddings, isolate critical gaps, and compute verified ATS compatibility.
              </p>
            </div>

            {/* Right Floating Quick Search Widget (Glass Prism Look) */}
            <div className="lg:col-span-8 bg-white/95 backdrop-blur-xl rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/60 text-[#121624]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                
                {/* Field 1: Target Role */}
                <div className="px-2 py-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target Role Vector</label>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-cyan-600">🎯</span>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="text-xs font-semibold text-gray-900 bg-transparent focus:outline-none w-full"
                    />
                  </div>
                </div>

                {/* Field 2: Experience / Level */}
                <div className="px-2 py-1 sm:pl-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Experience Level</label>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-purple-600">⚡</span>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="text-xs font-semibold text-gray-900 bg-transparent focus:outline-none w-full cursor-pointer"
                    >
                      <option>Mid-Level (2–4 yrs)</option>
                      <option>Entry-Level (0–2 yrs)</option>
                      <option>Senior / Lead (5+ yrs)</option>
                    </select>
                  </div>
                </div>

                {/* Field 3: Resume Input & Action Button */}
                <div className="px-2 py-1 sm:pl-4 flex items-center justify-between gap-2">
                  <div className="overflow-hidden">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer">
                      <span>Resume Embedding</span>
                      <input type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
                    </label>
                    <label className="flex items-center gap-1.5 mt-0.5 cursor-pointer">
                      <span className="text-xs text-emerald-600">📄</span>
                      <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{selectedFileName}</span>
                    </label>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleQuickAnalyze}
                    className="px-4 py-2.5 rounded-xl bg-[#0B0F1C] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg hover:shadow-cyan-500/20 transition-all whitespace-nowrap"
                  >
                    <span>Analyze</span>
                    <span className="text-cyan-400">↗</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </header>


      {/* ================= SECTION 2: HOW IT WORKS (3D QUANTUM GLASS STEPS) ================= */}
      <section id="steps" className="max-w-6xl mx-auto px-4 sm:px-8 py-20 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-700 border border-cyan-500/20">
            <span>✦ Four Algorithmic Steps</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#121624]">
            How To Use Career Compass AI
          </h3>
          <p className="text-xs sm:text-sm text-[#61687E] leading-relaxed">
            Our multi-stage intelligence pipeline transforms unstructured career experience into structured vector insights.
          </p>
        </div>

        <div className="space-y-20 sm:space-y-24">

          {/* STEP 01: NUMBER LEFT, TEXT RIGHT (TIGHT PAIRING, CENTERED) */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 max-w-3xl mx-auto">
            <div className="shrink-0 flex items-center justify-center">
              <div className="photo-number num-mask-1 text-7xl sm:text-8xl md:text-9xl">
                01
              </div>
            </div>

            <div className="w-full sm:w-[420px] space-y-2 text-left">
              <div className="flex items-center gap-3">
                <h4 className="text-lg sm:text-xl font-bold text-[#121624] tracking-tight">
                  Upload & Extract Profile
                </h4>
                <div className="accent-bar" />
              </div>
              <p className="text-xs sm:text-sm text-[#61687E] leading-relaxed font-light">
                Securely upload your existing PDF or DOCX resume. Our high-precision parser deconstructs technical stacks, soft skills, and career milestones into clean vector embeddings with PII sanitization.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DDD8E8] text-[#4A5168] text-[11px] font-semibold shadow-sm">PDF / DOCX Parsing</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DDD8E8] text-[#4A5168] text-[11px] font-semibold shadow-sm">Semantic Extraction</span>
              </div>
            </div>
          </div>

          {/* STEP 02: TEXT LEFT, NUMBER RIGHT (TIGHT PAIRING, CENTERED) */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 max-w-3xl mx-auto">
            <div className="w-full sm:w-[420px] space-y-2 text-right">
              <div className="flex items-center justify-end gap-3">
                <div className="accent-bar" />
                <h4 className="text-lg sm:text-xl font-bold text-[#121624] tracking-tight">
                  Ingest Target Job Role
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#61687E] leading-relaxed font-light">
                Paste the job description you're aiming for. The engine isolates mandatory proficiencies, secondary qualifications, and role seniority thresholds into structured schema targets.
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DDD8E8] text-[#4A5168] text-[11px] font-semibold shadow-sm">Target Role Calibration</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DDD8E8] text-[#4A5168] text-[11px] font-semibold shadow-sm">Requirement Weighting</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center">
              <div className="photo-number num-mask-2 text-7xl sm:text-8xl md:text-9xl">
                02
              </div>
            </div>
          </div>

          {/* STEP 03: NUMBER LEFT, TEXT RIGHT (TIGHT PAIRING, CENTERED) */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 max-w-3xl mx-auto">
            <div className="shrink-0 flex items-center justify-center">
              <div className="photo-number num-mask-3 text-7xl sm:text-8xl md:text-9xl">
                03
              </div>
            </div>

            <div className="w-full sm:w-[420px] space-y-2 text-left">
              <div className="flex items-center gap-3">
                <h4 className="text-lg sm:text-xl font-bold text-[#121624] tracking-tight">
                  Calculate Gap & Readiness Score
                </h4>
                <div className="accent-bar" />
              </div>
              <p className="text-xs sm:text-sm text-[#61687E] leading-relaxed font-light">
                Compare candidate vector spaces with employer expectations. Instantly categorize your qualifications into Strengths, Critical Gaps, and Secondary Gaps with calibrated ATS match probabilities.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DDD8E8] text-[#4A5168] text-[11px] font-semibold shadow-sm">Vector Cosine Metric</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DDD8E8] text-[#4A5168] text-[11px] font-semibold shadow-sm">Readiness Classifier</span>
              </div>
            </div>
          </div>

          {/* STEP 04: TEXT LEFT, NUMBER RIGHT (TIGHT PAIRING, CENTERED) */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 max-w-3xl mx-auto">
            <div className="w-full sm:w-[420px] space-y-2 text-right">
              <div className="flex items-center justify-end gap-3">
                <div className="accent-bar" />
                <h4 className="text-lg sm:text-xl font-bold text-[#121624] tracking-tight">
                  Generate Roadmap & Copilot Coaching
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#61687E] leading-relaxed font-light">
                Generate tailored, job-specific cover letters and recruiter cold emails with a single click. Engage with your AI Career Advisor for real-time interview coaching, behavioral STAR responses, and market salary benchmarks.
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DDD8E8] text-[#4A5168] text-[11px] font-semibold shadow-sm">Cover Letter Drafting</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DDD8E8] text-[#4A5168] text-[11px] font-semibold shadow-sm">AI Career Advisor</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center">
              <div className="photo-number num-mask-4 text-7xl sm:text-8xl md:text-9xl">
                04
              </div>
            </div>
          </div>

        </div>

      </section>


      {/* ================= SECTION 3: APPLICATION CAPABILITIES (INTERLOCKING CARDS) ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 space-y-12 border-t border-[#E2DEEA]">
        
        <div className="text-center space-y-2">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#121624]">
            Core Application Capabilities
          </h3>
          <p className="text-xs sm:text-sm text-[#61687E] max-w-xl mx-auto">
            Intelligent tools designed to analyze your background, identify skill gaps, and accelerate your career path.
          </p>
        </div>

        {/* CARD LAYOUT 1: Soft Muted Violet Prism Card */}
        <div id="gap" className="flex flex-col lg:flex-row items-center gap-6 scroll-mt-12">
          <div className="flex-1 bg-gradient-to-br from-[#5E689B] to-[#485282] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row gap-6 items-center border border-indigo-300/20">
            <div className="w-full md:w-1/2 h-52 rounded-2xl overflow-hidden relative shadow-md">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" alt="Skill Vector Space" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-indigo-950/25" />
            </div>

            <div className="w-full md:w-1/2 space-y-3">
              <h4 className="text-lg font-bold tracking-wide">
                Automated Resume & Job Match Analysis
              </h4>
              <p className="text-xs text-indigo-100/90 leading-relaxed font-light">
                Upload your resume and target job description to instantly calculate your ATS compatibility score, extract core technical competencies, and pinpoint critical missing skills before applying.
              </p>
              <div className="pt-2 border-t border-indigo-300/30 flex items-center justify-between text-[11px] text-indigo-200/90 font-mono">
                <span>Critical Gaps • Secondary Gaps • Core Strengths</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-72 space-y-4 text-center lg:text-left p-2">
            <p className="text-xs text-[#2A3045] font-medium leading-relaxed">
              You can view detailed match scores, skill gap breakdowns, and ATS compatibility reports on our page.
            </p>
            <button
              type="button"
              onClick={handleQuickAnalyze}
              className="px-6 py-2.5 rounded-full bg-[#DFDBE8] hover:bg-[#D5D0E0] text-xs font-semibold text-[#121624] shadow-sm transition-all border border-[#CCC6D9]"
            >
              View Report
            </button>
          </div>
        </div>

        {/* CARD LAYOUT 2: Deep Dark Obsidian Card */}
        <div id="roadmap" className="flex flex-col lg:flex-row-reverse items-center gap-6 scroll-mt-12">
          <div className="flex-1 bg-gradient-to-br from-[#121727] to-[#0A0D17] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row gap-6 items-center border border-cyan-500/20">
            <div className="w-full md:w-1/2 space-y-4">
              <h4 className="text-lg font-bold tracking-wide text-cyan-50">
                Personalized Learning Roadmaps & AI Career Coaching
              </h4>
              <p className="text-xs text-cyan-100/75 leading-relaxed font-light">
                Get a week-by-week upskilling roadmap matching your available weekly hours, paired with real-time AI coaching for STAR interview prep, salary benchmarks, cover letters, and cold recruiter emails.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button type="button" className="px-3.5 py-1.5 rounded-full glass-pill-dark text-[11px] text-cyan-300 hover:bg-white/10 transition-all border border-cyan-500/30">With Roadmap</button>
                <span className="text-[10px] text-white/40">‹ Look for ›</span>
                <button type="button" className="px-3.5 py-1.5 rounded-full glass-pill-dark text-[11px] text-purple-300 hover:bg-white/10 transition-all border border-purple-500/30">Cover Letter & Email</button>
              </div>
            </div>

            <div className="w-full md:w-1/2 h-52 rounded-2xl overflow-hidden relative shadow-md">
              <img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1000&auto=format&fit=crop" alt="AI Vector Engine" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-cyan-950/20" />
            </div>
          </div>

          <div className="w-full lg:w-72 space-y-4 text-center lg:text-right p-2">
            <p className="text-xs text-[#2A3045] font-medium leading-relaxed">
              You can generate a personalized upskilling roadmap or draft custom cover letters directly on the portal.
            </p>
            <button
              type="button"
              onClick={handleQuickAnalyze}
              className="px-6 py-2.5 rounded-full bg-[#DFDBE8] hover:bg-[#D5D0E0] text-xs font-semibold text-[#121624] shadow-sm transition-all border border-[#CCC6D9]"
            >
              Generate Roadmap
            </button>
          </div>
        </div>

      </section>


      {/* ================= SECTION 4: BOTTOM QUANTUM GLASS SEARCH BAR ================= */}
      <footer id="advisor" className="p-3 sm:p-6 bg-[#E7E4ED] scroll-mt-12">
        <div className="relative w-full max-w-7xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-footer-quantum min-h-[260px] flex items-center justify-between p-8 sm:p-12 border border-white/15">
          
          <div className="w-full max-w-lg mx-auto z-10">
            <div className="glass-pill px-5 py-3.5 rounded-full flex items-center gap-3 shadow-2xl border border-white/30">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={advisorQuery}
                onChange={(e) => setAdvisorQuery(e.target.value)}
                placeholder="Ask AI Advisor: How do I structure my STAR interview responses?"
                className="bg-transparent text-xs text-white placeholder-white/60 focus:outline-none w-full font-light"
              />
              <button
                type="button"
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-bold hover:opacity-90 transition-opacity shadow-md"
              >
                Ask
              </button>
            </div>
          </div>

          <div className="absolute right-8 bottom-6 text-right opacity-80 pointer-events-none hidden sm:block">
            <h3 className="text-xl tracking-[0.2em] font-bold text-white uppercase">CAREER COMPASS</h3>
            <p className="text-[9px] tracking-[0.35em] font-mono text-cyan-300 uppercase">QUANTUM AI PLATFORM</p>
          </div>

        </div>
      </footer>

      {/* Fullscreen Frosted Glass Menu */}
      <GlassMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(route) => {
          if (route === 'gap' && onNavigateToGap) {
            onNavigateToGap();
          }
        }}
      />

    </div>
  );
};

