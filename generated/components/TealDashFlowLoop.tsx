import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// Seamless loop: 3s. Frame 0 and frame DURATION are identical states, so the
// clip can be butt-joined or looped in the edit with no visible seam.
export const DURATION = 90;

export const schema = z.object({
  accent: z.string(),
  shadow: z.string(),
  // Vertical position as a fraction of frame height, so the asset can be
  // re-aimed without touching geometry.
  y: z.number().min(0).max(1),
  thickness: z.number().min(1).max(60),
  dashLength: z.number().min(4).max(400),
  gapLength: z.number().min(4).max(400),
  // How many whole dash periods travel past in one loop. Integer only — this
  // is what makes the loop seamless, so the schema enforces it.
  cyclesPerLoop: z.number().int().min(1).max(24),
  // Soft alpha falloff at each frame edge so dashes slide in and out instead
  // of switching on at the boundary. 0 for a hard full-bleed rule.
  edgeFade: z.number().min(0).max(400),
});

export type TealDashFlowLoopProps = z.infer<typeof schema>;

export const defaultProps: TealDashFlowLoopProps = schema.parse({
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  y: 0.5,
  thickness: 9,
  dashLength: 64,
  gapLength: 56,
  // 4 periods x 120px = 480px over 3s = 160px/s. Steady, unhurried, and slow
  // enough that a single dash stays readable as an object rather than a streak.
  cyclesPerLoop: 4,
  edgeFade: 110,
});

const TealDashFlowLoop: React.FC<TealDashFlowLoopProps> = ({
  accent,
  shadow,
  y,
  thickness,
  dashLength,
  gapLength,
  cyclesPerLoop,
  edgeFade,
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();

  // One normalised cycle drives everything, so changing fps or duration
  // resamples the motion instead of retiming it.
  const cycle = (frame % durationInFrames) / durationInFrames;

  const period = dashLength + gapLength;
  // Constant velocity — no easing anywhere, since an eased loop reads as a
  // stutter every time it wraps. Modulo keeps the offset bounded.
  const offset = (cycle * cyclesPerLoop * period) % period;

  // Horizontal rules antialias unpredictably off the half-pixel grid; with an
  // odd stroke width this lands the edges on whole pixels and stops the line
  // shimmering as it moves.
  const cy = Math.round(height * y) + (thickness % 2 === 1 ? 0.5 : 0);

  // Overrun past both edges by a whole period so the dash phase is continuous
  // across the frame boundary and nothing pops into existence on screen.
  const x1 = -period * 2;
  const x2 = width + period * 2;

  const fade = Math.min(edgeFade, width / 2 - 1);
  const maskImage =
    fade > 0
      ? `linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,1) ${fade}px, rgba(0,0,0,1) ${
          width - fade
        }px, rgba(0,0,0,0) ${width}px)`
      : undefined;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          // One soft shadow over the whole graphic, for legibility against
          // arbitrary footage. Outside the mask so the fade stays clean.
          filter: `drop-shadow(0 2px 6px ${shadow})`,
        }}
      >
        <AbsoluteFill style={{maskImage, WebkitMaskImage: maskImage}}>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{position: 'absolute', left: 0, top: 0}}
          >
            <line
              x1={x1}
              y1={cy}
              x2={x2}
              y2={cy}
              stroke={accent}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${dashLength} ${gapLength}`}
              // Negative offset advances the pattern along the path, i.e. left
              // to right.
              strokeDashoffset={-offset}
            />
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default TealDashFlowLoop;
