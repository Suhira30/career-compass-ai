import React from 'react';
import { Compass, Sparkles, User, Briefcase, BarChart3, Map, AlertCircle, CheckCircle } from 'lucide-react';
import { useUser } from './context/UserContext';

export const App: React.FC = () => {
  const { activeProfile, activeJob, activeAnalysis, activeRoadmap, error, clearError } = useUser();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Career Compass AI
              <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                v1.0.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">AI-Powered Career Navigation & Upskilling Platform</p>
          </div>
        </div>

        {/* User Status Bar */}
        <div className="flex items-center space-x-4 text-sm text-slate-300">
          <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <User className="w-4 h-4 text-indigo-400" />
            <span>{activeProfile ? activeProfile.full_name : 'No Profile Loaded'}</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <span>{activeJob ? activeJob.extracted_job.job_title : 'No Job Selected'}</span>
          </div>
        </div>
      </header>

      {/* Global Alert Notification */}
      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 px-6 py-3 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-rose-400 hover:text-white font-semibold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Welcome Hero Card */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Frontend Foundation Initialized</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome to Career Compass AI</h2>
            <p className="text-slate-300 text-sm max-w-2xl">
              Upload your resume, paste target job descriptions, analyze skill gaps with multi-provider AI resilience, and generate personalized learning roadmaps.
            </p>
          </div>
        </div>

        {/* Dashboard Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1: User Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-indigo-500/50 transition">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <User className="w-5 h-5" />
              </div>
              {activeProfile ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <span className="text-xs text-slate-500 font-mono">Step 1</span>
              )}
            </div>
            <h3 className="font-semibold text-white">1. User Profile</h3>
            <p className="text-xs text-slate-400">Create profile or extract details ephemerally from resume.</p>
          </div>

          {/* Step 2: Job Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-emerald-500/50 transition">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </div>
              {activeJob ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <span className="text-xs text-slate-500 font-mono">Step 2</span>
              )}
            </div>
            <h3 className="font-semibold text-white">2. Job Target</h3>
            <p className="text-xs text-slate-400">Parse raw job descriptions into structured required criteria.</p>
          </div>

          {/* Step 3: Skill Gap Analysis */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-amber-500/50 transition">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              {activeAnalysis ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <span className="text-xs text-slate-500 font-mono">Step 3</span>
              )}
            </div>
            <h3 className="font-semibold text-white">3. Gap Analysis</h3>
            <p className="text-xs text-slate-400">Calculate 3-way skill matrix and readiness match tier score.</p>
          </div>

          {/* Step 4: Learning Roadmap */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-purple-500/50 transition">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <Map className="w-5 h-5" />
              </div>
              {activeRoadmap ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <span className="text-xs text-slate-500 font-mono">Step 4</span>
              )}
            </div>
            <h3 className="font-semibold text-white">4. Upskilling Roadmap</h3>
            <p className="text-xs text-slate-400">Generate week-by-week learning plan matching weekly hours.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

