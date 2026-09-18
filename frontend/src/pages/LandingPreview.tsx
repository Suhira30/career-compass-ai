import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { GlassMenu } from '../components/landing/GlassMenu';
import { LadderScene, STEP_LABELS } from '../components/landing/LadderScene';

export const LandingPreview: React.FC = () => {
  const [progress, setProgress] = useState(0.08);
  const [menuOpen, setMenuOpen] = useState(false);
  const progressRef = useRef(0.08);
  const targetRef = useRef(0.08);
  const rafRef = useRef<number | null>(null);
  const interactedRef = useRef(false);
  const rootRef = useRef<HTMLElement>(null);

  const tick = useCallback(() => {
    const current = progressRef.current;
    const target = targetRef.current;
    const next = current + (target - current) * 0.14;

    if (Math.abs(next - target) < 0.001) {
      progressRef.current = target;
      setProgress(target);
      rafRef.current = null;
      return;
    }

    progressRef.current = next;
    setProgress(next);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const scheduleProgress = useCallback(
    (value: number) => {
      targetRef.current = Math.max(0.05, Math.min(1, value));
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [tick]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (menuOpen) return;
      e.preventDefault();
      interactedRef.current = true;
      scheduleProgress(targetRef.current + e.deltaY * -0.0012);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [menuOpen, scheduleProgress]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (interactedRef.current || menuOpen) return;
      const t = Date.now() / 1000;
      scheduleProgress(0.12 + Math.sin(t * 0.55) * 0.05);
    }, 50);
    return () => window.clearInterval(id);
  }, [menuOpen, scheduleProgress]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (menuOpen) return;
    const el = rootRef.current;
    if (!el) return;
    interactedRef.current = true;
    const rect = el.getBoundingClientRect();
    const fromBottom = 1 - (e.clientY - rect.top) / rect.height;
    scheduleProgress(fromBottom);
  };

  const stepIndex = Math.min(
    STEP_LABELS.length - 1,
    Math.floor(progress * STEP_LABELS.length)
  );

  return (
    <section
      ref={rootRef}
      className="landing"
      onPointerMove={onPointerMove}
    >
      <div className="landing__grain" aria-hidden="true" />

      <header className="landing__chrome">
        <span className="landing__wordmark">Career Compass AI</span>
        <button
          type="button"
          className="landing__menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </header>

      <div className="landing__stage">
        <LadderScene progress={progress} />
      </div>

      <div className="landing__copy">
        <h1 className="landing__brand">Career Compass AI</h1>
        <p className="landing__tagline">
          Your path is built as you climb — move the cursor to rise.
        </p>
        <div className="landing__actions">
          <a href="#start" className="landing__cta">
            Begin ascent
          </a>
          <span className="landing__hint" aria-live="polite">
            Step {stepIndex + 1}: {STEP_LABELS[stepIndex]}
          </span>
        </div>
      </div>

      <GlassMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </section>
  );
};
