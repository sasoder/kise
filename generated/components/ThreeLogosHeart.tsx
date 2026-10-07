import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camEase,
  clamp,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// The Premiere slot is 30.583-33.625 s = 3.042 s. 3.042 s x 24 = 73.0 -> 73
// frames exactly, no tail: the edit cuts away on frame 73.
export const DURATION = 73;

// ---------------------------------------------------------------------------
// "THREE LOGOS, ONE HEART". Core memory podcast graphic standard; the sibling
// of `OpenAIBoughtTBPN` (same paper ground, same hard shadow, same damped
// camera).
//
// CHECK LINE — what the viewer can say after this cut:
//   "TBPN is what you get when SportsCenter, CNBC and X get together."
//
// THE MOTION, one job: three logos come together around one heart. The cut
// opens slightly tight with the SportsCenter wordmark already sliding down
// from the top while the camera eases back; CNBC slides in from the left and X
// from the right, on the same ease. As X lands the three lean in toward the
// middle and a heart pops up between them, chain colours first, white last, so
// the colours sit as a crown behind it. The heart gives one beat and the
// picture holds, barely creeping, until the cut.
//
// THE WORDS, frames at 24 fps from composition start. They guide one
// continuous gathering; nothing is one gesture per word.
//   SportsCenter  0-16    its wordmark slides down into place (lands ~f16)
//   CNBC          21-35   slides in from the left (f17 -> f32)
//   and           41      X is on its way in from the right (f38 -> f50)
//   X             44-51
//   had a         51-58   the squeeze (f48 on); the heart's colours rise
//   threesome     59-71   the white heart has landed (f62); one beat
//   (cut)         73
//
// THE MATERIAL, as the sibling: `public/paper-supaclean-still.png` turned 90
// deg to cover portrait, `brightness(0.88) blur(3px)` on the image only, its
// own plane at parallax 0.15 with the -0.3 px/frame drift, root #C0C0C0.
//
// THE COLOURS, raw hex, no filter, blend, gradient, glow or opacity fade:
//   ink #FFFFFF, every white shape on a hard black copy at +4/+4 WORLD px
//   (an SVG copy of the shape, never a CSS drop-shadow).
//   orange #FFB765, purple #BC37FF, blue #0046FF: used once, as the stacked
//   heart silhouettes behind the white heart.
//
// NO TEXT. The only letters are the three real marks, inlined as paths (never
// <image>: it flashes on the first frames) and redrawn all white.
//
// THE GEOMETRY, world px; at the rest camera (k 1, cx 540, cy 960) world =
// screen. Everything ends above y 1050, clear of the caption strip
// (y 1080-1250). See the constants below for the resting triangle.
//
// THE CAMERA — the sibling's `runCamera2` (house CAM_STIFF / CAM_DAMP), run
// from f-10 so the damper is already moving on frame 0.
//   PULL   f-10..28  k K_OPEN -> 1.00, eased (warp 0.85).
//   CREEP  f34..73   k 1.00 -> K_END, pinned on the group's bottom edge so
//                    nothing slides toward the caption strip.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";
const BG_OVERSIZE = 1.6;

// public/tbpn/sportscenter-logo.svg, viewBox 0 0 395.23 44.63. Its paths live
// under two nested transforms, kept as they are. The first path is the ring.
const SC_VB_W = 395.22925;
const SC_VB_H = 44.631062;
const SC_INNER = "matrix(1.25 0 0 -1.25 -184 517) matrix(.5 0 0 .5 153 198)";
const SC_INNER_SCALE = 0.625;
const SC_PATHS = [
  "m311 427c-17.3 0-31.3-14-31.3-31.3s14-31.3 31.3-31.3 31.3 14 31.3 31.3-14 31.3-31.3 31.3m0-67c-19.7 0-35.7 16-35.7 35.7s16 35.7 35.7 35.7 35.7-16 35.7-35.7-16-35.7-35.7-35.7",
  "m21 399h-16.1c-8.59 0-9.45 1.69-9.45 5.84 0 5.84 2.75 6.62 13.7 6.62h5.77c14.4 0 14.4-1.21 14.5-7.01l0.01-0.533h6.18v1.93c0 6.88-2.91 11.1-17.4 11.1h-11.7c-10.9 0-17.2-1.92-17.2-11.8 0-11.2 5.85-12.2 22.6-12.2h10.3c6.61 0 8.23-1.14 8.23-5.78 0-5.41-2.08-6.89-9.67-6.89h-16.9c-6.94 0-8.34 2.02-8.34 5.28v3.37h-6.19v-3.48c0-9.43 7.82-10.7 15.5-10.7h15.1c8.45 0 16.7 0.857 16.7 11.1v2.61c0 7.21-4.81 10.4-15.6 10.4",
  "m51.6 411h25.8c5.01 0 6.78-1.41 6.78-5.39v-3.83c0-3.58-1.96-5.17-6.34-5.17h-26.3v14.4zm27.1 5.53h-33.6v-41.3h6.52v15.8h26c12.5 0 13.1 5.05 13.1 14 0 9.59-4.41 11.5-12 11.5",
  "m142 403v-15.1c0-5.61-2.66-8-8.89-8h-22c-6.23 0-8.89 2.39-8.89 8v15.1c0 5.61 2.66 8 8.89 8h22c6.23 0 8.89-2.39 8.89-8m-8.34 13.5h-23.1c-10.6 0-14.9-4.51-14.9-15.6v-11c0-11.1 4.3-15.6 14.9-15.6h23.1c10.6 0 14.9 4.51 14.9 15.6v11c0 11.1-4.31 15.6-14.9 15.6",
  "m164 411h24.2c7.97 0 9.39-1.41 9.39-5.39v-3.66c0-3.17-1.37-5.28-8.06-5.28h-25.5v14.3zm26.1 5.53h-32.7v-41.3h6.52v15.9h26c5.15 0 7.45-0.942 7.45-6.51v-9.36h6.19v10.8c0 3.9-1.57 6.28-5.04 7.5 2.91 0.722 5.53 2.58 5.53 7.77v3.27c0 7.91-2.16 11.9-14 11.9",
  "m208 411h20.3v-35.7h6.52v35.7h20.3v5.53h-47.1v-5.53",
  "m291 399h-16.1c-8.59 0-9.45 1.69-9.45 5.84 0 5.84 2.75 6.62 13.7 6.62h5.77c14.4 0 14.4-1.21 14.5-7.01l0.009-0.533h6.18v1.93c0 6.88-2.91 11.1-17.4 11.1h-11.7c-10.9 0-17.2-1.92-17.2-11.8 0-11.2 5.85-12.2 22.6-12.2h10.3c6.61 0 8.22-1.14 8.22-5.78 0-5.41-2.08-6.89-9.67-6.89h-16.9c-6.94 0-8.34 2.02-8.34 5.28v3.37h-6.19v-3.48c0-9.43 7.82-10.7 15.5-10.7h15.1c8.45 0 16.7 0.857 16.7 11.1v2.61c0 7.21-4.81 10.4-15.6 10.4",
  "m357 386c0-5.12-1.83-6.45-8.89-6.45h-19c-6.23 0-8.89 2.39-8.89 8v15.1c0 5.61 2.66 8 8.89 8h18.9c5.23 0 8.67-0.461 8.67-6.62v-2.37h5.86v3.98c0 6.99-4.42 10.5-13.1 10.5h-20.8c-10.6 0-14.9-4.51-14.9-15.6v-11c0-11.1 4.3-15.6 14.9-15.6h20.5c11.8 0 14.1 4.31 14.1 11.8v3.26h-6.19v-3.04",
  "m378 393h32.7v5.53h-32.7v11.7h34v5.52h-40.5v-41.3h40.8v5.52h-34.2v13",
  "m464 382-36 34.6h-8.86v-41.3h6.52v34.6l36-34.6h8.87v41.3h-6.52v-34.6",
  "m475 411h20.3v-35.7h6.52v35.7h20.3v5.53h-47.1v-5.53",
  "m534 393h32.7v5.53h-32.7v11.7h34v5.52h-40.5v-41.3h40.8v5.52h-34.2v13",
  "m581 411h24.2c7.97 0 9.39-1.41 9.39-5.39v-3.66c0-3.17-1.37-5.28-8.06-5.28h-25.5v14.3zm26.1 5.53h-32.7v-41.3h6.52v15.9h26c5.15 0 7.45-0.942 7.45-6.51v-9.36h6.19v10.8c0 3.9-1.57 6.28-5.03 7.5 2.91 0.722 5.53 2.58 5.53 7.77v3.27c0 7.91-2.16 11.9-14 11.9",
];
// public/tbpn/cnbc-logo.svg, viewBox 0 0 587.225 187.645 (every path white,
// the blue notch included).
const CNBC_VB_W = 587.225;
const CNBC_VB_H = 187.645;
const CNBC_PATHS = [
  "m142.995 159.955-21.715-21.96c-3.305 3.012-6.298 5.518-9.493 7.86-8.067 5.914-14.827 8.106-19.797 9.17-3.578.766-7.372 1.14-11.44 1.14-9.487 0-17.52-2.868-23.737-6.934a44 44 0 0 1-10.7-9.911c-8.77-11.382-10.453-24.007-10.453-31.797v-.438c0-6.72 1.271-16.43 6.734-25.91 3.462-6.008 8.905-12.542 17.378-17.144 5.325-2.89 12.33-5.186 20.778-5.186a51 51 0 0 1 9.108.82c2.513.46 5.57 1.205 9.138 2.616 4.274 1.69 8.215 3.929 11.79 6.389s6.783 5.142 9.594 7.68l21.698-25.031c-.751-.772-5.342-5.418-11.525-9.748-5.518-3.942-11.117-6.737-16.386-8.734-5.447-2.064-10.844-3.353-15.838-4.154-7.028-1.127-13-1.28-17.356-1.28-3.629 0-7.038.185-10.438.573-12.633 1.44-23.564 5.558-32.334 10.794a76.5 76.5 0 0 0-22.107 19.9C8.726 68.239 3.86 79.361 1.547 91.278.523 96.559 0 101.797 0 107.524v.445c0 8.433 1.242 19.504 5.964 31.136 4.256 10.483 10.221 18.854 16.606 25.324 4.711 4.774 11.334 10.25 20.061 14.639 5.362 2.697 11.905 5.299 20.279 6.957a85 85 0 0 0 16.532 1.62c6.762 0 14.018-.628 20.068-1.881 6.05-1.255 11.892-3.147 16.983-5.58 8.107-3.875 16.627-9.629 26.502-20.229",
  "M152.38 30.034v154.93h33.67V87.575l97.39 97.39h23.87v-23.763L186.24 40.136l-.365-.41-9.685-9.692Z",
  "M307.265 30.035V161.19l23.77 23.775 49.929.01c8.708.002 16.6-.87 23.756-2.64s13.318-4.47 18.409-8.01c2.663-1.853 5.807-4.545 8.588-8.263a34.5 34.5 0 0 0 5.108-9.76c1.42-4.224 2.135-8.921 2.135-13.905v-.245c0-2.93-.194-7.163-1.359-11.677-.746-2.892-1.886-5.844-3.6-8.738a31.5 31.5 0 0 0-4.597-5.98c-2.975-3.045-6.845-5.907-11.86-8.475a74 74 0 0 0-7.545-3.325c2.735-1.443 5.484-3.466 6.94-4.623 8.316-6.606 10.744-13.909 11.601-16.534 1.108-3.393 1.795-7.491 1.795-12.238v-.445c0-4.073-.54-7.892-1.591-11.442a34 34 0 0 0-4.325-9.204c-2.145-3.223-4.802-6.071-7.809-8.467-5.359-4.27-11.83-7.25-19.488-9.04-6.688-1.562-13.152-1.929-18.229-1.929ZM340.48 59.96h33.621c1.954 0 5.64.07 9.476 1.04 4.99 1.26 9.609 3.842 11.716 8.815.724 1.707 1.147 3.7 1.147 6.058v.445c0 5.896-2.514 9.504-5.64 11.792-5.64 4.13-14.27 4.57-18.908 4.57H340.48Zm0 61.085h39.577c4.008 0 7.676.326 11.125 1.152 4.125.988 7.616 2.674 10.076 5.289 2.993 3.18 3.822 7.049 3.822 10.358v.446c0 2.571-.484 4.889-1.41 6.9-2.029 4.4-5.992 6.856-10.23 8.211-3.523 1.127-7.828 1.683-12.677 1.684H340.48Z",
  "m587.225 159.955-21.715-21.96c-3.305 3.012-6.298 5.518-9.493 7.86-8.067 5.914-14.827 8.106-19.797 9.17-3.578.766-7.372 1.14-11.44 1.14-9.487 0-17.52-2.868-23.737-6.934a44 44 0 0 1-10.7-9.911c-8.77-11.382-10.453-24.007-10.453-31.797v-.438c0-6.72 1.271-16.43 6.734-25.91 3.462-6.008 8.905-12.542 17.378-17.144 5.325-2.89 12.33-5.186 20.778-5.186a51 51 0 0 1 9.108.82c2.514.46 5.57 1.205 9.137 2.616 4.275 1.69 8.216 3.929 11.79 6.389 3.575 2.46 6.784 5.142 9.595 7.68l21.699-25.031c-.752-.772-5.343-5.418-11.526-9.748-5.518-3.942-11.117-6.737-16.386-8.734-5.447-2.064-10.844-3.353-15.838-4.154-7.028-1.127-13-1.28-17.356-1.28-3.629 0-7.038.185-10.438.573-12.633 1.44-23.564 5.558-32.334 10.794a76.5 76.5 0 0 0-22.108 19.899c-7.167 9.57-12.033 20.692-14.345 32.609-1.025 5.281-1.548 10.519-1.548 16.246v.445c0 8.433 1.242 19.504 5.964 31.136 4.256 10.483 10.221 18.854 16.606 25.324 4.711 4.774 11.334 10.25 20.061 14.639 5.362 2.697 11.905 5.299 20.279 6.957a85 85 0 0 0 16.532 1.62c6.762 0 14.018-.628 20.068-1.881 6.05-1.255 11.892-3.147 16.983-5.58 8.107-3.875 16.627-9.629 26.502-20.229",
  "M286.09 110.045V0H176.06Z",
];
// public/tbpn/x-logo.svg, 300 x 271.
const X_VB_W = 300;
const X_VB_H = 271;
const X_PATH = "m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z";
// A flat symmetric heart in unit space: x -1..1, y about -0.9..1, origin at
// its visual centre.
const HEART_PATH =
  "M0 -0.48C-0.24 -0.98 -1 -0.96 -1 -0.32C-1 0.28 -0.36 0.6 0 1C0.36 0.6 1 0.28 1 -0.32C1 -0.96 0.24 -0.98 0 -0.48Z";

export const schema = z.object({
  paperSrc: z.string(),
  parallax: z.number(),
  paperDim: z.number(),
  paperBlur: z.number(),
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  // the hard shadow, in WORLD px
  shadowOffset: z.number(),
  // extra same-white stroke on the thin SportsCenter wordmark, WORLD px
  scStroke: z.number(),
  beats: z.object({
    cnbc: z.number(), // "CNBC"  — starts sliding in from the left
    x: z.number(), // "X"        — starts sliding in from the right
    squeeze: z.number(), // the three lean in; the heart's first colour rises
    heart: z.number(), // the white heart starts rising
    beat: z.number(), // the heart's one beat starts (the picture is complete)
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  paperSrc: "paper-supaclean-still.png",
  parallax: 0.15,
  paperDim: 0.88,
  paperBlur: 3,
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  scStroke: 3,
  beats: { cnbc: 17, x: 38, squeeze: 48, heart: 53, beat: 62 },
});

// ---------------------------------------------------------------------------
// THE GEOMETRY — the resting triangle (after the squeeze)
// ---------------------------------------------------------------------------
const CX = FRAME_W / 2;
const REST_CY = FRAME_H / 2;

export const SC_W = 900;
export const SC_REST = { x: CX, y: 512 };
export const CNBC_W = 400;
export const CNBC_REST = { x: 305, y: 960 };
export const X_H = 190;
export const X_REST = { x: 790, y: 950 };
export const HEART = { x: CX, y: 752, half: 116 };
export const GROUP_BOTTOM = 1049;

// The squeeze: each logo lands this far OUT from its rest and leans in.
const SC_SQUEEZE = { dx: 0, dy: -30, rot: 0 };
const CNBC_SQUEEZE = { dx: -26, dy: 16, rot: -3 };
const X_SQUEEZE = { dx: 26, dy: 16, rot: 3 };
const SQUEEZE_FRAMES = 12;

// The slides. All three on the same ease: fast off the mark, long ease out.
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const SC_F0 = -7;
const SC_F1 = 17;
const SC_FROM_Y = -90;
const CNBC_FRAMES = 15;
const CNBC_FROM_X = -230;
const X_FRAMES = 12;
const X_FROM_X = FRAME_W + 140;

// The heart's chain.
export const CROWN_STEP = 18;
const CHAIN_STAGGER = 2;
const HEART_TRAVEL = 9;
const HEART_RISE = 80; // it comes up from this far below its rest
const HEART_S0 = 0.25;
const BEAT_FRAMES = 9;
const BEAT_AMOUNT = 0.06;

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
export const K_OPEN = 1.1;
export const K_REST = 1.0;
export const K_END = 1.025;
const OPEN_CY = 780; // at open the camera looks at the top of the triangle
const PULL_F0 = -10;
const PULL_F1 = 28;
const PULL_WARP = 0.85;
const CREEP_F0 = 34;
const CREEP_F1 = DURATION;

const buildCamera = () => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CXS: number[] = [];
  for (let f = PULL_F0; f <= PULL_F1; f++) {
    const g = camEase((f - PULL_F0) / (PULL_F1 - PULL_F0), PULL_WARP);
    F.push(f);
    K.push(K_OPEN + (K_REST - K_OPEN) * g);
    CY.push(OPEN_CY + (REST_CY - OPEN_CY) * g);
    CXS.push(CX);
  }
  for (let f = CREEP_F0; f <= CREEP_F1; f++) {
    const g = camEase((f - CREEP_F0) / (CREEP_F1 - CREEP_F0), 1);
    const k = K_REST + (K_END - K_REST) * g;
    F.push(f);
    K.push(k);
    // the group's bottom edge stays where it is on screen
    CY.push(GROUP_BOTTOM - (GROUP_BOTTOM - REST_CY) / k);
    CXS.push(CX);
  }
  return { F, K, CY, CX: CXS };
};
export const CAM = buildCamera();

// The sibling's `runCamera2` (same tracker, same constants), started from the
// first key's frame so the camera is already in motion on frame 0.
export const runCamera2 = (upto: number, F: number[], CY: number[], CXK: number[], K: number[]) => {
  let cy = CY[0];
  let cx = CXK[0];
  let k = K[0];
  let vy = 0;
  let vx = 0;
  let vk = 0;
  for (let f = F[0] + 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tx = interpolate(f, F, CXK, clamp);
    const tk = interpolate(f, F, K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, cx, k };
};

// ---------------------------------------------------------------------------
// THE GROUND — the sibling's `PaperGround`, unchanged.
// ---------------------------------------------------------------------------
const PaperGround: React.FC<{
  src: string;
  frame: number;
  cy: number;
  cyRest: number;
  cx: number;
  cxRest: number;
  k: number;
  parallax: number;
  dim: number;
  blur: number;
}> = ({ src, frame, cy, cyRest, cx, cxRest, k, parallax, dim, blur }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgX = -(cx - cxRest) * k * parallax;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE,
          height: FRAME_W * BG_OVERSIZE,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

// One mark, drawn twice by the caller: the black copy at +4/+4, then the ink.
// It turns about its own centre. `stroke` is in WORLD px.
const Mark: React.FC<{
  paths: string[];
  vbW: number;
  vbH: number;
  inner?: string;
  innerScale?: number;
  width: number;
  x: number;
  y: number;
  rot: number;
  off: number;
  fill: string;
  stroke?: number;
  ringFirst?: boolean;
}> = ({ paths, vbW, vbH, inner, innerScale = 1, width, x, y, rot, off, fill, stroke = 0, ringFirst }) => {
  const s = width / vbW;
  const sw = stroke / (s * innerScale);
  return (
    <g
      transform={`translate(${x + off}, ${y + off}) rotate(${rot}) scale(${s}) translate(${-vbW / 2}, ${-vbH / 2})`}
    >
      <g
        transform={inner}
        fill={fill}
        stroke={stroke > 0 ? fill : "none"}
        strokeLinejoin="round"
      >
        {paths.map((d, i) => (
          // the ring (first path) is already crowded by the S and C: half the extra weight
          <path key={i} d={d} strokeWidth={ringFirst && i === 0 ? sw * 0.4 : sw} />
        ))}
      </g>
    </g>
  );
};

const ThreeLogosHeart: React.FC<Props> = ({
  paperSrc,
  parallax,
  paperDim,
  paperBlur,
  ink,
  shadow,
  orange,
  purple,
  blue,
  shadowOffset,
  scStroke,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera2(frame, CAM.F, CAM.CY, CAM.CX, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the squeeze: 1 = landed apart, 0 = leaning in at rest --------------------
  const apart =
    1 -
    interpolate(frame, [beats.squeeze, beats.squeeze + SQUEEZE_FRAMES], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
  // a hair of life once everything has landed
  const live = (phase: number) => ({
    dx: 1.6 * Math.sin(frame / 5.5 + phase),
    dy: 1.8 * Math.cos(frame / 6.5 + phase * 1.7),
    rot: 0.25 * Math.sin(frame / 7 + phase * 2.3),
  });
  const slide = (f0: number, f1: number) =>
    interpolate(frame, [f0, f1], [0, 1], { easing: EASE_LAND, ...clamp });

  const place = (
    rest: { x: number; y: number },
    sq: { dx: number; dy: number; rot: number },
    phase: number,
  ) => {
    const l = live(phase);
    return {
      x: rest.x + sq.dx * apart + l.dx,
      y: rest.y + sq.dy * apart + l.dy,
      rot: sq.rot * (1 - apart) + l.rot,
    };
  };

  // -- the three ------------------------------------------------------------------
  const sc = place(SC_REST, SC_SQUEEZE, 0);
  const scLand = SC_REST.y + SC_SQUEEZE.dy;
  sc.y += (SC_FROM_Y - scLand) * (1 - slide(SC_F0, SC_F1));

  const cnbc = place(CNBC_REST, CNBC_SQUEEZE, 2.1);
  const cnbcLand = CNBC_REST.x + CNBC_SQUEEZE.dx;
  cnbc.x += (CNBC_FROM_X - cnbcLand) * (1 - slide(beats.cnbc, beats.cnbc + CNBC_FRAMES));

  const xm = place(X_REST, X_SQUEEZE, 4.2);
  const xLand = X_REST.x + X_SQUEEZE.dx;
  xm.x += (X_FROM_X - xLand) * (1 - slide(beats.x, beats.x + X_FRAMES));

  const X_W = (X_H * X_VB_W) / X_VB_H;

  const marks = [
    {
      key: "sc",
      show: true,
      paths: SC_PATHS,
      vbW: SC_VB_W,
      vbH: SC_VB_H,
      inner: SC_INNER,
      innerScale: SC_INNER_SCALE,
      width: SC_W,
      stroke: scStroke,
      ringFirst: true,
      ...sc,
    },
    {
      key: "cnbc",
      show: frame >= beats.cnbc,
      paths: CNBC_PATHS,
      vbW: CNBC_VB_W,
      vbH: CNBC_VB_H,
      width: CNBC_W,
      ...cnbc,
    },
    {
      key: "x",
      show: frame >= beats.x,
      paths: [X_PATH],
      vbW: X_VB_W,
      vbH: X_VB_H,
      width: X_W,
      ...xm,
    },
  ];

  // -- the heart --------------------------------------------------------------------
  const beatU = interpolate(frame, [beats.beat, beats.beat + BEAT_FRAMES], [0, 1], clamp);
  const beat = 1 + BEAT_AMOUNT * Math.pow(Math.sin(Math.PI * beatU), 2);
  const heartAt = (start: number, lift: number, off: number) => {
    const t = interpolate(frame, [start, start + HEART_TRAVEL], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
    const s = HEART.half * (HEART_S0 + (1 - HEART_S0) * t) * beat;
    const y = HEART.y + HEART_RISE * (1 - t) - lift * t;
    return `translate(${HEART.x + off}, ${y + off}) scale(${s})`;
  };
  const chain = [
    { color: orange, start: beats.squeeze, lift: 3 * CROWN_STEP },
    { color: purple, start: beats.squeeze + CHAIN_STAGGER, lift: 2 * CROWN_STEP },
    { color: blue, start: beats.squeeze + 2 * CHAIN_STAGGER, lift: CROWN_STEP },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={REST_CY}
        cx={cx}
        cxRest={CX}
        k={k}
        parallax={parallax}
        dim={paperDim}
        blur={paperBlur}
      />

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* THE HEART: shadow, then the chain, then the white core. */}
            {frame >= beats.heart ? (
              <path d={HEART_PATH} transform={heartAt(beats.heart, 0, shadowOffset)} fill={shadow} />
            ) : null}
            {chain.map((c) =>
              frame >= c.start ? (
                <path key={c.color} d={HEART_PATH} transform={heartAt(c.start, c.lift, 0)} fill={c.color} />
              ) : null,
            )}
            {frame >= beats.heart ? (
              <path d={HEART_PATH} transform={heartAt(beats.heart, 0, 0)} fill={ink} />
            ) : null}

            {/* THE THREE, each on its own hard black copy. */}
            {marks.map((m) =>
              m.show ? (
                <g key={m.key}>
                  <Mark {...m} off={shadowOffset} fill={shadow} />
                  <Mark {...m} off={0} fill={ink} />
                </g>
              ) : null,
            )}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ThreeLogosHeart;
