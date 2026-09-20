import React, { useEffect } from 'react';

interface CancelRoadmapModalProps {
  isOpen: boolean;
  roleName: string;
  companyName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelRoadmapModal: React.FC<CancelRoadmapModalProps> = ({
  isOpen,
  roleName,
  companyName,
  onClose,
  onConfirm,
}) => {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="glass-frame max-w-md w-full rounded-3xl p-6 sm:p-7 space-y-5 border border-rose-500/35 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Danger Icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 text-xl font-bold flex-shrink-0 shadow-inner">
            🗑️
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">Cancel Target Roadmap?</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to cancel the roadmap for{' '}
              <span className="font-bold text-white">
                {companyName ? `${companyName} — ` : ''}
                {roleName}
              </span>
              ?
            </p>
          </div>
        </div>

        {/* Warning Notice Box */}
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <span>⚠️</span> This action cannot be undone.
          </p>
          <p className="text-[11px] text-rose-200/80 leading-relaxed">
            All weekly milestone tracking, completed task checkboxes, and tailored study hours for this specific role will be cleared.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl glass-pill text-xs font-semibold text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            Keep Roadmap
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/30 transition cursor-pointer"
          >
            Yes, Cancel Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

