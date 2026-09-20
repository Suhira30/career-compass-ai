import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

interface InteractiveAnalyzeButtonProps {
  onClick: () => void;
  isAnalyzing: boolean;
  hasResume: boolean;
  hasJobDescription: boolean;
  errorMessage?: string | null;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const InteractiveAnalyzeButton: React.FC<InteractiveAnalyzeButtonProps> = ({
  onClick,
  isAnalyzing,
  hasResume,
  hasJobDescription,
  errorMessage,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleCounter = useRef(0);

  // High-performance direct DOM manipulation for 60/120fps cursor tracking without React state lag
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Set CSS custom properties for radial gradient spotlight
    button.style.setProperty('--mouse-x', `${x}px`);
    button.style.setProperty('--mouse-y', `${y}px`);

    // 3D Magnetic tilt physics
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -((y - centerY) / centerY) * 7; // Max tilt 7 deg
    const rotateY = ((x - centerX) / centerX) * 7;

    button.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    const button = buttonRef.current;
    if (button) {
      // Smoothly reset 3D transform
      button.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isAnalyzing) return;

    // Create ripple effect at click coordinates
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const newRipple: Ripple = {
        id: rippleCounter.current++,
        x: x - size / 2,
        y: y - size / 2,
        size,
      };

      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 700);
    }

    onClick();
  };

  const isReady = hasResume && hasJobDescription;

  return (
    <div className="w-full flex flex-col items-center space-y-3 pt-2">
      {/* Interactive Cursor-Reactive Action Button */}
      <div className="relative w-full max-w-2xl group">
        {/* Ambient Outer Aurora Glow following cursor */}
        <div
          className={`absolute -inset-1 rounded-3xl transition-opacity duration-500 blur-xl ${
            isHovered
              ? 'opacity-80 bg-gradient-to-r from-cyan-500/50 via-blue-600/50 to-purple-600/50'
              : 'opacity-30 bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-purple-600/20'
          }`}
          style={{
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          }}
        />

        <button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={isAnalyzing}
          style={{
            transition: 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.25s ease',
          }}
          className={`relative w-full overflow-hidden rounded-2xl py-4 sm:py-5 px-6 sm:px-8 
            border border-white/25 backdrop-blur-2xl cursor-pointer select-none
            flex flex-col sm:flex-row items-center justify-between gap-4
            shadow-[0_10px_40px_rgba(0,0,0,0.45)]
            ${
              isReady
                ? 'bg-gradient-to-r from-cyan-500/80 via-blue-600/85 to-purple-600/80 text-white'
                : 'bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-indigo-950/90 text-white/90'
            }
            ${isAnalyzing ? 'opacity-80 cursor-wait' : ''}
          `}
        >
          {/* Interactive Mouse-following Spotlight Layer */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(circle 260px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.22) 0%, rgba(56, 189, 248, 0.3) 35%, transparent 70%)`,
            }}
          />

          {/* Shimmering Animated Prismatic Edge */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-cyan-300/30 opacity-60 mix-blend-overlay" />

          {/* Click Ripple Sparks */}
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="pointer-events-none absolute rounded-full bg-white/35 animate-ping"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                animationDuration: '700ms',
              }}
            />
          ))}

          {/* Left Side: Dynamic Status Badges */}
          <div className="relative z-10 flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
                isReady
                  ? 'bg-white/20 border-white/40 text-cyan-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                  : 'bg-white/10 border-white/20 text-white/60'
              }`}
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
              ) : (
                <Sparkles className={`w-5 h-5 ${isHovered ? 'animate-pulse text-amber-300' : ''}`} />
              )}
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white drop-shadow">
                  {isAnalyzing ? 'Analyzing Skills & Gaps...' : 'Analyze Gap & Matches'}
                </h3>
                {isReady && !isAnalyzing && (
                  <span className="glass-pill px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-white/70 font-light">
                {isAnalyzing
                  ? 'Executing dual-vector matching & deterministic score analysis'
                  : isReady
                  ? 'Compare your profile against requirements for deep match score'
                  : 'Upload resume and enter job description to unlock analysis'}
              </p>
            </div>
          </div>

          {/* Right Side: Dual-Input Readiness Indicators + Action Arrow */}
          <div className="relative z-10 flex items-center gap-3 self-end sm:self-auto">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
              <span
                className={`px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                  hasResume
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                {hasResume ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                CV
              </span>
              <span
                className={`px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                  hasJobDescription
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                {hasJobDescription ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                JD
              </span>
            </div>

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                isReady
                  ? 'bg-white/20 border-white/40 text-white group-hover:bg-white group-hover:text-blue-600 group-hover:scale-110 shadow-lg'
                  : 'bg-white/10 border-white/15 text-white/40'
              }`}
            >
              <ArrowRight
                className={`w-5 h-5 transition-transform duration-300 ${
                  isHovered ? 'translate-x-1' : ''
                }`}
              />
            </div>
          </div>
        </button>
      </div>

      {/* Validation / Error Message if triggered before ready */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in max-w-2xl w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

