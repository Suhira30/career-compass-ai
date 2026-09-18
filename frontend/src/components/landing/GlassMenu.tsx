import { X } from 'lucide-react';
import React, { useEffect } from 'react';

const MENU_ITEMS = [
  { label: 'Overview', href: '#home' },
  { label: 'Gap Analysis', href: '#gap' },
  { label: 'Learning Roadmap', href: '#roadmap' },
  { label: 'Career Copilot', href: '#advisor' },
];

interface GlassMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export const GlassMenu: React.FC<GlassMenuProps> = ({ open, onClose, onNavigate }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 md:p-12 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 20%, rgba(15, 22, 45, 0.88) 0%, rgba(5, 8, 18, 0.95) 100%)',
        backdropFilter: 'blur(36px) saturate(190%)',
        WebkitBackdropFilter: 'blur(36px) saturate(190%)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      {/* Ambient vector glow orbs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-6 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner">
            <span className="text-cyan-300 font-bold text-base">✦</span>
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white block leading-tight">career compass</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/25 hover:border-cyan-400/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all shadow-lg group cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
        </button>
      </div>

      {/* Center Navigation: Left-Aligned Sleek Headings (Reduced Font Size) */}
      <div className="my-auto py-6 space-y-6 sm:space-y-8 z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 flex flex-col items-start">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.href}
            type="button"
            onClick={() => {
              onClose();
              if (onNavigate) {
                const route = item.href.replace('#', '');
                onNavigate(route);
              }
            }}
            className="text-2xl sm:text-4xl md:text-5xl font-bold text-white/90 hover:text-cyan-300 tracking-tight transition-all duration-200 hover:translate-x-2.5 inline-block text-left cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10 text-xs text-white/50 font-mono w-full max-w-6xl mx-auto px-4 sm:px-8">
        <span>Career Compass AI</span>
        <span>Press [ESC] to return</span>
      </div>
    </div>
  );
};
