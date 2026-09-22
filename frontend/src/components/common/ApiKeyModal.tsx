import React, { useEffect, useState } from 'react';

interface ApiKeyModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialReason?: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialReason = null,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(propIsOpen || false);
  const [reason, setReason] = useState<string | null>(initialReason);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load existing key from localStorage on mount
  useEffect(() => {
    try {
      const existing = localStorage.getItem('career_compass_custom_gemini_key');
      if (existing) {
        setSavedKey(existing);
        setApiKey(existing);
      }
    } catch {}
  }, []);

  // Synchronize prop changes
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
  }, [propIsOpen]);

  // Listen for global quota exhaustion events
  useEffect(() => {
    const handleOpenEvent = (e: any) => {
      setIsOpen(true);
      if (e?.detail?.message) {
        setReason(e.detail.message);
      } else {
        setReason('The shared server AI quota has been temporarily exhausted. Please provide your own free Gemini API key to continue.');
      }
    };

    window.addEventListener('open-api-key-modal', handleOpenEvent);
    return () => window.removeEventListener('open-api-key-modal', handleOpenEvent);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setSaveSuccess(false);
    setReason(null);
    propOnClose?.();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) return;

    try {
      localStorage.setItem('career_compass_custom_gemini_key', cleanKey);
      setSavedKey(cleanKey);
      setSaveSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      console.warn('Could not save API key:', err);
    }
  };

  const handleRemove = () => {
    try {
      localStorage.removeItem('career_compass_custom_gemini_key');
      setSavedKey(null);
      setApiKey('');
      setSaveSuccess(false);
    } catch {}
  };

  if (!isOpen) return null;

  const maskedKey = savedKey
    ? `${savedKey.substring(0, 7)}••••••••${savedKey.substring(savedKey.length - 4)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
      {/* Modal Container */}
      <div className="relative w-full max-w-xl glass-frame rounded-3xl p-6 sm:p-8 border border-white/20 bg-gradient-to-b from-[#131b2e]/95 via-[#0c1220]/95 to-[#080c16]/98 shadow-2xl shadow-cyan-950/50 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-lg shadow-inner">
              🔑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Google Gemini API Key
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Bring your own key for unlimited personal resume parsing & roadmaps
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full glass-pill hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quota Exhaustion Alert (if triggered by 429) */}
        {reason && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200 leading-relaxed shadow-sm">
            <span className="text-base shrink-0">⚠️</span>
            <div>
              <strong className="font-semibold text-amber-300">Shared Server Credit Limit Reached:</strong>{' '}
              {reason}
            </div>
          </div>
        )}

        {/* 3-Step Guide Card */}
        <div className="glass-frame rounded-2xl p-4 border border-white/10 bg-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
              ✦ How to Get Your Free Key in 30 Seconds
            </span>
            <span className="text-[11px] text-white/40">No credit card needed</span>
          </div>

          <ol className="space-y-2.5 text-xs text-zinc-300">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 border border-cyan-400/40">
                1
              </span>
              <div>
                Visit{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 inline-flex items-center gap-1"
                >
                  <span>Google AI Studio</span>
                  <span className="text-[10px]">↗</span>
                </a>{' '}
                and sign in with your Google account.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 border border-cyan-400/40">
                2
              </span>
              <div>
                Click <strong className="text-white font-medium">"Create API key"</strong> and select or create a project.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 border border-cyan-400/40">
                3
              </span>
              <div>
                Copy the key (begins with <code className="px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-[11px]">AIzaSy...</code>) and paste it below.
              </div>
            </li>
          </ol>
        </div>

        {/* Current Saved Status */}
        {savedKey && (
          <div className="glass-pill rounded-xl px-4 py-2.5 border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-zinc-300">Active Custom Key:</span>
              <span className="font-mono text-emerald-300 font-semibold truncate">{maskedKey}</span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-zinc-400 hover:text-red-400 transition-colors text-[11px] underline underline-offset-2 shrink-0 ml-2 cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 block">
              Enter Your Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                required
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3.5 py-2.5 pr-20 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400 hover:text-white transition px-2 py-1"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[11px] text-white/40">
              🔒 Your key is stored strictly on your device (in browser local storage) and is sent directly to Google. It is never stored in any database.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="glass-pill px-4 py-2 rounded-xl text-xs text-white/80 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!apiKey.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <span>✓</span>
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save & Apply Key</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

