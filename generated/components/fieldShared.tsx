import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";

// ---------------------------------------------------------------------------
// What the three "secret AI societies" cuts share. They are cut into one edit
// seconds apart, so everything that decides how the field LOOKS lives here:
// the ladder, the idle traffic, the camera's damping, the background, the
// vignette. A piece decides what happens; this file decides what it is made of.
// ---------------------------------------------------------------------------

export const FRAME_W = 1080;
export const FRAME_H = 1920;
export const BG_OVERSIZE = 1.8;

// The opacity ladder. Every agent, ash line, floor or mark sits on one rung.
export const OP_UNREAD = 0.45; // present, not the subject
export const OP_READ = 0.9; // the subject; +0.1 when a thread is on it
export const OP_RECEDE = 0.3; // was the subject, is not any more
export const OP_DARK = 0.16; // wiped, or unlooked-at

// Idle thread traffic, per 1,200 agents. A field of a different size scales it.
export const IDLE_THREADS_PER_1200 = 180;
export const idleThreads = (agents: number) => Math.round((IDLE_THREADS_PER_1200 * agents) / 1200);

export const DOT_RADIUS = 5.5;
export const breath = (frame: number, seed: number) => 1 + 0.05 * Math.sin(frame * 0.11 + seed * 6.28);

export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// The camera: authored keys, followed by a damped second-order tracker so a
// move is a short ramp that settles ahead of its word. Same constants in every
// piece, so a pull-back feels the same weight everywhere.
export const CAM_STIFF = 0.09;
export const CAM_DAMP = 0.468;

export const runCamera = (upto: number, F: number[], CY: number[], K: number[]) => {
  let cy = CY[0];
  let k = K[0];
  let vy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tk = interpolate(f, F, K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

// The hand on the camera: the same slow drift in every piece.
export const sway = (frame: number) => ({
  dy: 5 * Math.sin(frame / 19),
  dx: 3 * Math.sin(frame / 23),
});

// Where the world sits on screen for a camera at (cx, cy, k).
export const worldTransform = (cx: number, cy: number, k: number) => ({
  tx: FRAME_W / 2 - cx * k,
  ty: FRAME_H / 2 - cy * k,
});

// The grid, blurred and dimmed, with parallax against the camera and a slow
// drift of its own. `cyRest` is the camera's opening cy; parallax is measured
// from there so the background never jumps at frame 0.
export const GridBackground: React.FC<{
  src: string;
  blur: number;
  dim: number;
  frame: number;
  cy: number;
  cyRest: number;
  k: number;
  parallax: number;
}> = ({ src, blur, dim, frame, cy, cyRest, k, parallax }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_W * BG_OVERSIZE,
          height: FRAME_H * BG_OVERSIZE,
          objectFit: "cover",
          transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
          filter: `blur(${blur}px) brightness(${dim})`,
        }}
      />
    </AbsoluteFill>
  );
};

// A quiet vignette over everything, for depth. Untouched out to ~30% of the
// way to the corners, then falling to `strength` at the corners. Tested on
// real frames at 0.35 / 0.5 / 0.65; 0.45 is where it reads as depth and not
// as a frame. Goes LAST in the tree.
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.45 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,${(
        strength * 0.35
      ).toFixed(3)}) 62%, rgba(0,0,0,${strength.toFixed(3)}) 100%)`,
    }}
  />
);
