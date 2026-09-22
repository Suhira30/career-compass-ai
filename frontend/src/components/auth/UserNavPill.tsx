import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface UserNavPillProps {
  compact?: boolean;
}

export const UserNavPill: React.FC<UserNavPillProps> = ({ compact = false }) => {
  const { user, isGuest, openAuthModal, logout } = useAuth();

  const handleOpenApiKeyModal = () => {
    window.dispatchEvent(new CustomEvent('open-api-key-modal'));
  };

  const apiKeyButton = (
    <button
      type="button"
      onClick={handleOpenApiKeyModal}
      className="glass-pill px-3 py-1.5 rounded-full text-xs text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10 transition-all flex items-center gap-1.5 border border-amber-400/30 shadow-sm cursor-pointer"
      title="Configure Google Gemini API Key (100% Free)"
    >
      <span>🔑</span>
      <span className={compact ? 'hidden' : 'hidden sm:inline font-medium'}>API Key</span>
    </button>
  );

  if (isGuest) {
    return (
      <div className="flex items-center gap-2">
        {apiKeyButton}
        <button
          type="button"
          onClick={() => openAuthModal()}
          className="glass-pill px-3.5 py-1.5 rounded-full text-xs text-white/90 hover:text-white hover:bg-white/20 transition-all flex items-center gap-1.5 border border-cyan-400/40 shadow-sm cursor-pointer"
          title="Sign In to sync roadmaps and gap analyses"
        >
          <span className="text-cyan-300">☁️</span>
          <span className={compact ? 'hidden' : 'hidden sm:inline font-medium'}>Sign In / Sync</span>
          <span className={compact ? 'inline font-medium' : 'sm:hidden font-medium'}>Sign In</span>
        </button>
      </div>
    );
  }

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {apiKeyButton}
      <div className="flex items-center gap-2 glass-pill px-3 py-1.5 rounded-full border border-emerald-400/40 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400 text-zinc-950 font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
          {initial}
        </div>
        <span className="text-xs text-emerald-300 font-semibold truncate max-w-[90px] sm:max-w-[130px]">
          {user?.name}
        </span>
        <button
          type="button"
          onClick={logout}
          title="Sign Out"
          className="text-zinc-400 hover:text-rose-400 transition ml-0.5 text-xs font-bold cursor-pointer p-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
