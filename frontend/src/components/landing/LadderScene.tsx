import React from 'react';

export const STEP_LABELS = [
  'Profile',
  'Job Target',
  'Gap Analysis',
  'Roadmap',
  'Growth',
] as const;

/** Vertical positions along the artwork (0 = top, 1 = bottom of climb path). */
const STEP_POSITIONS = [0.78, 0.62, 0.48, 0.34, 0.2];

interface LadderSceneProps {
  progress: number;
}

export const LadderScene: React.FC<LadderSceneProps> = ({ progress }) => {
  const activeCount = Math.min(
    STEP_LABELS.length,
    Math.floor(progress * STEP_LABELS.length + 0.15)
  );

  // Camera climbs with the cursor: start framed on the climber, rise toward the top.
  const scale = 1.08 + progress * 0.22;
  const climbOffset = 6 - progress * 20;
  const reveal = 12 + progress * 88;
  const markerTop = 86 - progress * 66;

  return (
    <div className="landing-scene" aria-hidden="true">
      <div
        className="landing-scene__camera"
        style={{
          transform: `translate3d(-50%, calc(-50% + ${climbOffset}%), 0) scale(${scale})`,
        }}
      >
        <img
          className="landing-scene__art"
          src="/landing-ladder.png"
          alt=""
          draggable={false}
        />
      </div>

      {/* Soft veil lifts as you climb — artwork stays exact underneath */}
      <div
        className="landing-scene__veil"
        style={{
          background: `linear-gradient(
            to top,
            transparent 0%,
            transparent ${Math.max(0, reveal - 28)}%,
            rgba(40, 70, 68, 0.22) ${reveal}%,
            rgba(40, 70, 68, 0.45) 100%
          )`,
        }}
      />

      <div
        className="landing-scene__marker"
        style={{ top: `${markerTop}%` }}
      />

      <ul className="landing-scene__steps">
        {STEP_LABELS.map((label, i) => {
          const visible = i < activeCount;
          return (
            <li
              key={label}
              className={`landing-scene__step ${visible ? 'landing-scene__step--in' : ''}`}
              style={{ top: `${STEP_POSITIONS[i] * 100}%` }}
            >
              <span className="landing-scene__step-dot" />
              <span className="landing-scene__step-label">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
