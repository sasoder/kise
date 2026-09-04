import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile} from 'remotion';
import {z} from 'zod';

// Shared stage for the Dylan "Elon arbitrage" cutaways.
//
// Every scene in this set is the same treatment — a dimmed grid backdrop, a
// damped camera moving through a tall world, one soft drop shadow — so it lives
// here once instead of being re-derived ten times. Each scene component only
// authors its own mechanism and its own camera keys.

export const FPS = 24;

export const INK = '#FFFFFF';
export const ACCENT = '#48D9FF';

export const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Stable per-index scatter: organic, but identical every frame so nothing
// flickers.
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// Captions are burned in along the bottom, so content lives in the band above
// it, centred at y 835 of 1920.
export const SAFE_CENTRE = 835;

/**
 * Line weights, in SCREEN pixels.
 *
 * These used to be authored in world units, which is why the set looked
 * inconsistent: with camera zoom running from 0.72 to 1.35 across scenes, the
 * same nominal `strokeWidth` rendered anywhere from 2px to 14px on screen.
 * Author the weight you want to SEE and divide by the zoom — `sw()` below.
 *
 * Four tiers, nothing in between:
 *   context   — ground lines, axes, anything the eye should read past
 *   structure — links, arcs, containers, the connective tissue
 *   subject   — the thing the beat is about
 *   emphasis  — the single resolved statement of a scene
 */
export const WEIGHT = {context: 4, structure: 8, subject: 13, emphasis: 20} as const;

/** A screen-space weight (or size) in world units at the current zoom. */
export const sw = (screenPx: number, k: number) => screenPx / k;

// Shared solid geometry, in world units. Kept identical across the set — with
// camera zoom held in a narrow band, a compute block is the same block in every
// scene rather than being re-invented per scene.
export const BLOCK = {w: 196, h: 42, gap: 10, r: 7} as const;
/** Diameter of an actor node. Large enough that the thinnest mark survives. */
export const NODE_D = 148;

// ---------------------------------------------------------------------------
// Motion vocabulary. Every scene uses these rather than its own ad-hoc springs,
// which is most of what separates a finished piece from a demo of one.
// ---------------------------------------------------------------------------

/** An entrance with weight: 0 → overshoot → 1. */
export const enter = (frame: number, at: number, fps: number) =>
  spring({frame: frame - at, fps, config: {damping: 11, stiffness: 150, mass: 0.8}});

/** A softer settle for things that slide rather than pop. */
export const settle = (frame: number, at: number, fps: number) =>
  spring({frame: frame - at, fps, config: {damping: 15, stiffness: 120, mass: 0.9}});

/** An impulse for the word a beat lands on: fast up, slower down, 0..1..0. */
export const hit = (frame: number, at: number, len = 16) => {
  const t = (frame - at) / len;
  if (t < 0 || t > 1) {
    return 0;
  }
  return Math.sin(t * Math.PI) * (1 - t * 0.4);
};

/** Resting life. Never let a resolved element sit perfectly still. */
export const breathe = (frame: number, seed: number, amp = 2.5, speed = 0.045) =>
  Math.sin(frame * speed + seed * 6.3) * amp;

/** Cubic ease-out for travel along a path. */
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) => {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};

/**
 * A ring that leaves the thing a beat just landed on: expands and fades. The
 * same gesture on every hit across the set, so the beats read as one language.
 */
export const HitRing: React.FC<{
  x: number;
  y: number;
  r0: number;
  at: number;
  frame: number;
  k: number;
  color: string;
  len?: number;
}> = ({x, y, r0, at, frame, k, color, len = 18}) => {
  const t = (frame - at) / len;
  if (t < 0 || t > 1) {
    return null;
  }
  const e = easeOut(t);
  return (
    <circle
      cx={x}
      cy={y}
      r={r0 + sw(84, k) * e}
      fill="none"
      stroke={color}
      strokeWidth={sw(WEIGHT.structure, k) * (1 - 0.6 * e)}
      opacity={0.75 * (1 - e)}
    />
  );
};

/**
 * A moving dot with a short fading trail, for anything travelling along a
 * path. `pos(t)` maps 0..1 to a point; `p` is where the head is now.
 */
export const Comet: React.FC<{
  pos: (t: number) => {x: number; y: number};
  p: number;
  r: number;
  color: string;
  opacity?: number;
  trail?: number;
}> = ({pos, p, r, color, opacity = 1, trail = 0.07}) => (
  <g>
    {Array.from({length: 4}, (_, i) => {
      const q = p - (i + 1) * (trail / 4);
      if (q < 0) {
        return null;
      }
      const pt = pos(q);
      return (
        <circle
          key={`t${i}`}
          cx={pt.x}
          cy={pt.y}
          r={r * (1 - (i + 1) * 0.18)}
          fill={color}
          opacity={opacity * (0.42 - i * 0.1)}
        />
      );
    })}
    {(() => {
      const pt = pos(p);
      return <circle cx={pt.x} cy={pt.y} r={r} fill={color} opacity={opacity} />;
    })()}
  </g>
);

/**
 * A compute block landing. `t` is an `enter()` spring: below 1 it is still
 * falling, above 1 it is in overshoot. Volume-preserving squash on landing, so
 * the blocks have weight rather than fading into place.
 */
export const Block: React.FC<{
  x: number;
  baseY: number;
  t: number;
  fill: string;
  opacity?: number;
  drop?: number;
}> = ({x, baseY, t, fill, opacity = 0.9, drop = 46}) => {
  if (t <= 0.002) {
    return null;
  }
  const c = clamp01(t);
  const over = Math.max(0, t - 1);
  const sx = 1 + 0.1 * (1 - c) - 0.16 * over;
  const sy = 1 - 0.1 * (1 - c) + 0.16 * over;
  const w = BLOCK.w * sx;
  const h = BLOCK.h * sy;
  return (
    <rect
      x={x - w / 2}
      y={baseY - h + (1 - c) * drop}
      width={w}
      height={h}
      rx={BLOCK.r}
      fill={fill}
      opacity={opacity * clamp01(c * 1.7)}
    />
  );
};

// Turn a world-space content centre into the camera centre that puts it in the
// caption-safe band at zoom k.
export const safeCy = (contentCentre: number, k: number) => contentCentre + 125 / k;

export const stageSchema = {
  ink: z.string(),
  accent: z.string(),
  grid: z.string(),
  gridBlur: z.number().min(0).max(40),
  gridBrightness: z.number().min(0).max(1),
  gridBase: z.string(),
  shadow: z.string(),
};

export const stageDefaults = {
  ink: INK,
  accent: ACCENT,
  grid: 'grid-background.jpg',
  gridBlur: 13,
  gridBrightness: 0.32,
  gridBase: '#232323',
  shadow: 'rgba(0, 0, 0, 0.22)',
};

export type Cam = {cx: number; cy: number; k: number};

const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;

/**
 * Build a damped camera from a coarse keyframe track.
 *
 * The camera is authored as its own track and never derived from the subject —
 * chasing an animated subject bobs and jerks at every speed change. Integrating
 * a spring over the keys rounds every corner and makes the camera trail the
 * action slightly, the way an operator does. The final pull-back is just another
 * key on the same track so it inherits the same continuity.
 */
export const makeCamera = (
  keys: {f: number[]; cx: number[]; cy: number[]; k: number[]},
) => {
  const cache: Cam[] = [];
  return (upto: number): Cam => {
    if (cache[upto]) {
      return cache[upto];
    }
    let cx = keys.cx[0];
    let cy = keys.cy[0];
    let k = keys.k[0];
    let vx = 0;
    let vy = 0;
    let vk = 0;
    cache[0] = {cx, cy, k};
    for (let f = 1; f <= upto; f++) {
      const tx = interpolate(f, keys.f, keys.cx, clamp);
      const ty = interpolate(f, keys.f, keys.cy, clamp);
      const tk = interpolate(f, keys.f, keys.k, clamp);
      vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
      cx += vx;
      vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
      cy += vy;
      vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
      k += vk;
      cache[f] = {cx, cy, k};
    }
    return cache[upto];
  };
};

const BG_OVERSIZE = 1.8;

export const GridBackdrop: React.FC<{
  grid: string;
  gridBlur: number;
  gridBrightness: number;
  gridBase: string;
  cam: Cam;
  frame: number;
}> = ({grid, gridBlur, gridBrightness, gridBase, cam, frame}) => {
  // The grid sits on its own plane at ~0.15 of the camera and ~0.3 of the zoom,
  // so travel reads as depth rather than a layer sliding around. The constant
  // drift keeps it alive during a camera hold.
  const bgX = (540 - cam.cx) * 0.15 + frame * 0.09;
  const bgY = (960 - cam.cy) * 0.15 + frame * 0.05;
  const bgScale = 1 + (cam.k - 1) * 0.3;
  return (
    <AbsoluteFill style={{backgroundColor: gridBase, overflow: 'hidden'}}>
      <Img
        src={staticFile(grid)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1080 * BG_OVERSIZE,
          height: 1920 * BG_OVERSIZE,
          objectFit: 'cover',
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(
            2,
          )}px) scale(${bgScale.toFixed(4)})`,
          filter: `blur(${gridBlur}px) brightness(${gridBrightness})`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * The world layer. Children are drawn in world coordinates; this applies the
 * camera transform that maps the camera centre to the middle of the frame.
 */
export const World: React.FC<{cam: Cam; shadow: string; children: React.ReactNode}> = ({
  cam,
  shadow,
  children,
}) => (
  <AbsoluteFill
    style={{
      transform: `translate(${(540 - cam.cx * cam.k).toFixed(2)}px, ${(
        960 -
        cam.cy * cam.k
      ).toFixed(2)}px) scale(${cam.k.toFixed(4)})`,
      transformOrigin: '0 0',
      filter: `drop-shadow(0 2px 9px ${shadow})`,
    }}
  >
    {children}
  </AbsoluteFill>
);

// Numerals and the occasional label. Roboto Condensed 700, uppercase, tracked
// out — with the compensating negative margin so the tracking does not throw
// centred pairs off axis.
export const typeStyle = (size: number, color: string): React.CSSProperties => ({
  fontFamily: 'Roboto Condensed',
  fontWeight: 700,
  fontSize: size,
  color,
  textTransform: 'uppercase',
  letterSpacing: '0.11em',
  marginRight: '-0.11em',
  lineHeight: 1,
  whiteSpace: 'nowrap',
});

const srgb = (hex: string) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

/**
 * Tint filters for the company marks. An feColorMatrix forces RGB to a flat
 * target colour and passes alpha straight through, so a full-colour logo
 * becomes house ink or house accent without touching its silhouette.
 *
 * Render this once per scene; `Mark` refers to the filters by id.
 */
export const TintDefs: React.FC<{ink: string; accent: string}> = ({ink, accent}) => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <defs>
      {(
        [
          ['tint-ink', ink],
          ['tint-accent', accent],
        ] as const
      ).map(([id, hex]) => {
        const [r, g, b] = srgb(hex);
        return (
          <filter key={id} id={id} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 1 0`}
            />
          </filter>
        );
      })}
    </defs>
  </svg>
);

/**
 * The cast, as one normalised pack (Simple Icons — every glyph built to the
 * same 24x24 construction, so no wordmark ever sits next to a glyph).
 *
 * `scale` is the fraction of the node's diameter the mark spans, tuned per mark
 * rather than shared: SpaceX's swoosh is wide and thin, Anthropic's letterform
 * is solid and compact, and matching their *boxes* would leave them looking
 * nothing like a set. Matching their optical mass is what makes them one.
 */
export const ACTORS = {
  meta: {src: 'si-meta.svg', scale: 0.5},
  spacex: {src: 'si-spacex.svg', scale: 0.66},
  anthropic: {src: 'si-anthropic.svg', scale: 0.44},
  openai: {src: 'si-openai.svg', scale: 0.5},
  // Roles, not companies: the house person glyph and its siblings, so a
  // customer or a pool of capital sits in the same ring as a brand does.
  customer: {src: 'person.png', scale: 0.5},
  capital: {src: 'money.png', scale: 0.52},
  cloud: {src: 'compute.png', scale: 0.54},
} as const;

export type ActorName = keyof typeof ACTORS;

/**
 * An actor: its mark inside the shared container. Everything about the node is
 * identical between companies; only the glyph inside changes.
 */
export const ActorNode: React.FC<{
  actor: ActorName;
  k: number;
  d?: number;
  tint?: 'ink' | 'accent';
  color: string;
  opacity?: number;
  filled?: number;
  /** Scale, typically from `enter()`: the node irises in with overshoot. */
  scale?: number;
  /** A per-node phase for the resting breath. */
  seed?: number;
  frame?: number;
}> = ({
  actor,
  k,
  d = NODE_D,
  tint = 'ink',
  color,
  opacity = 1,
  filled = 0,
  scale = 1,
  seed = 0,
  frame = 0,
}) => {
  const a = ACTORS[actor];
  const life = 1 + 0.012 * Math.sin(frame * 0.05 + seed * 6.3);
  return (
    <div
      style={{
        width: d,
        height: d,
        borderRadius: d,
        border: `${sw(WEIGHT.structure, k)}px solid ${color}`,
        background: filled > 0 ? `${color}${Math.round(filled * 38).toString(16).padStart(2, '0')}` : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        opacity,
        transform: `scale(${(scale * life).toFixed(4)})`,
      }}
    >
      <Img
        src={staticFile(a.src)}
        style={{
          width: d * a.scale,
          height: d * a.scale,
          objectFit: 'contain',
          filter: `url(#tint-${tint})`,
        }}
      />
    </div>
  );
};

/**
 * A company mark on its own, for the rare case a node container is wrong.
 * Drawn with Remotion's <Img> so the frame waits for it to load.
 */
export const Mark: React.FC<{
  src: string;
  width: number;
  height: number;
  tint?: 'ink' | 'accent';
  opacity?: number;
  style?: React.CSSProperties;
}> = ({src, width, height, tint = 'ink', opacity = 1, style}) => (
  <Img
    src={staticFile(src)}
    style={{
      width,
      height,
      objectFit: 'contain',
      opacity,
      filter: `url(#tint-${tint})`,
      ...style,
    }}
  />
);
