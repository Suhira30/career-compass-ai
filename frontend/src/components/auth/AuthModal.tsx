import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, authModalSubtitle, triggerAuthSuccess } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Simulate authentication / Supabase Auth session
    setTimeout(() => {
      login(email, fullName || email.split('@')[0]);
      setIsLoading(false);
      onClose();
      triggerAuthSuccess();
      if (onSuccess) onSuccess();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="glass-frame max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 border border-cyan-400/30 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-sm">
              🔐
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isSignUp ? 'Create Your Account' : 'Sign In to Career Compass'}
              </h3>
              <p className="text-[11px] text-cyan-300/80 leading-snug max-w-[280px]">
                {authModalSubtitle || 'Sync roadmaps, ATS scores, and tasks across devices'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full glass-pill hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="glass-pill-dark p-1 rounded-xl flex items-center gap-1 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              !isSignUp ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              isSignUp ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'text-white/60 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-medium block">Full Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/15 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 text-white text-xs outline-none transition"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-white/70 font-medium block">Email Address</label>
            <input
              type="email"
              placeholder="candidate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/15 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 text-white text-xs outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/70 font-medium block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/15 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 text-white text-xs outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Guest Mode Notice */}
        <div className="pt-3 border-t border-white/10 text-center space-y-1">
          <p className="text-[11px] text-white/40">
            Prefer not to sign in right now?
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-cyan-300 hover:text-cyan-200 underline font-semibold transition cursor-pointer"
          >
            Continue in Offline Guest Mode →
          </button>
        </div>
      </div>
    </div>
  );
};

