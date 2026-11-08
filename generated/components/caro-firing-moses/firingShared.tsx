// ---------------------------------------------------------------------------
// firingShared: the show's own hydra pictogram (caro-firing-moses), redrawn as vectors from the 4K frames of the
// original 16:9 graphics (<clip>/animation_source/notes/reference/hydra_seqf*.png, hydraHands_seqf*.png) so the
// three hydra cuts (HydraDozenHeads, TwelvePosts, HydraHands) and builder C's new pieces read as one drawing.
//
// Look (sampled from the 4K PNGs): flat mid-grey ground 74 with a fine grain on the GROUND ONLY (std ~3 at 4K,
// ~2.3 at 1080 wide; the silhouettes and whites are flat: hand 242 std 0.5, ink 15 std 0.3); flat near-black
// silhouettes 15; whites 242 (hands, strings, scissors) and 246 (eyes); a soft white bloom round the whites
// (+20 on the ground 15 px out at 4K, +9 at 40, gone by ~70); the label "the Mayor" in a letter-spaced
// Times-like italic (closest Google face: Tinos Italic 400).
//
// Parts that come from the originals: the hand outlines (MayorHand, GovernorHand) and the head outline are traced
// from hydraHands_seqf700.png / hydra_seqf418.png (median 5, threshold, approxPolyDP eps 2-2.5 px, strings cut off
// by a morphological opening); the scissors are rebuilt from measured lengths (seqf700). Every traced part draws in
// the ORIGINAL'S 4K PIXEL UNITS: pass a world position and a scale s (world px per 4K px).
//
// The hydra itself is re-staged for 9:16 (one compact fan centred on x 540): 12 necks on fixed world polylines,
// each scaled about its root by its own `grow` (0 = hidden in the body, 1 = out), with a slow sway driven by the
// GLOBAL frame G of the three-cut world (G = frame in HydraDozenHeads, 62 + frame in TwelvePosts, 220 + frame in
// HydraHands), so the joins are pixel-identical.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Tinos";

const { fontFamily: SERIF_FAMILY } = loadFont("italic", { weights: ["400"], subsets: ["latin"] });
export const SERIF = SERIF_FAMILY;

// ---- tones (the grain sits on the ground only, so these are the rendered values) ------------------------------
const grey = (v: number) => `rgb(${v},${v},${v})`;
export const F_GROUND = grey(74);
export const F_INK = grey(15);
export const F_WHITE = grey(242);
export const F_EYE = grey(246);
export const F_CREASE = grey(206);

// ---- the three-cut world clock -----------------------------------------------------------------------------------
export const HDH_DURATION = 63;
export const TP_DURATION = 159;
export const HH_DURATION = 144;
export const TP_G0 = HDH_DURATION - 1; // TwelvePosts f0 = HydraDozenHeads' last frame
export const HH_G0 = TP_G0 + TP_DURATION - 1; // HydraHands f0 = TwelvePosts' last frame

const n = (v: number) => Math.round(v * 1000) / 1000;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const D2R = Math.PI / 180;

// ---------------------------------------------------------------------------------------------------------------
// Ground + grain (screen space, new pattern every global frame) and the white bloom
// ---------------------------------------------------------------------------------------------------------------

export const FiringGround: React.FC<{ G: number }> = ({ G }) => {
  const seed = Math.round(G) + 11;
  return (
    <AbsoluteFill style={{ backgroundColor: F_GROUND }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <filter id={`firingGrain${seed}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves={1} seed={seed} result="t" />
          {/* grey = 74/255 + K (t - 0.5); K tuned so the rendered ground std is ~2.5 */}
          <feColorMatrix
            in="t"
            type="matrix"
            values="0.095 0 0 0 0.2427  0.095 0 0 0 0.2427  0.095 0 0 0 0.2427  0 0 0 0 1"
          />
        </filter>
        <rect x={0} y={0} width={1080} height={1920} filter={`url(#firingGrain${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// The bloom: alpha from luminance above ~0.6 (whites only, the ink and ground add nothing), two blurs under the
// source. Put <FiringGlowDefs/> in the world <svg> and wrap the world in <g filter={`url(#${FIRING_GLOW})`}>.
export const FIRING_GLOW = "firingGlow";
export const FiringGlowDefs: React.FC = () => (
  <defs>
    <filter
      id={FIRING_GLOW}
      filterUnits="userSpaceOnUse"
      x={-200}
      y={-200}
      width={1480}
      height={2320}
      colorInterpolationFilters="sRGB"
    >
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.8 0.8 0.8 0 -1.5"
        result="lum"
      />
      <feGaussianBlur in="lum" stdDeviation={4} result="tight" />
      <feGaussianBlur in="lum" stdDeviation={11} result="wide" />
      <feComponentTransfer in="tight" result="tightA">
        <feFuncA type="linear" slope={0.34} />
      </feComponentTransfer>
      <feComponentTransfer in="wide" result="wideA">
        <feFuncA type="linear" slope={0.28} />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="wideA" />
        <feMergeNode in="tightA" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// FIRING_GLINT: a stronger version of the bloom (kept for compatibility; since Hydra rev 2 nothing draws with it, the
// glint's light is the exp falloff in Hydra.tsx).
export const FIRING_GLINT = "firingGlint";
export const FiringGlintDefs: React.FC = () => (
  <defs>
    <filter
      id={FIRING_GLINT}
      filterUnits="userSpaceOnUse"
      x={-200}
      y={-200}
      width={1480}
      height={2320}
      colorInterpolationFilters="sRGB"
    >
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.8 0.8 0.8 0 -1.5"
        result="lum"
      />
      <feGaussianBlur in="lum" stdDeviation={6} result="tight" />
      <feGaussianBlur in="lum" stdDeviation={17} result="wide" />
      <feComponentTransfer in="tight" result="tightA">
        <feFuncA type="linear" slope={0.95} />
      </feComponentTransfer>
      <feComponentTransfer in="wide" result="wideA">
        <feFuncA type="linear" slope={0.85} />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="wideA" />
        <feMergeNode in="wideA" />
        <feMergeNode in="tightA" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------------------------------------------
// The hands (traced from hydraHands_seqf700.png). 4K units, origin = the FINGERTIP (where the strings leave), the
// Mayor's fingers point to +x (he enters from the left), the Governor's to -x (from the right). The dark sleeve is
// the original's cuff (57 x 247 at 4K) lengthened by `arm` 4K px away from the fingers so the arm can run off the
// frame edge. The white part (shirt cuff + hand) is one flat 242 shape; the two creases are faint 206 wedges.
// Native size of the white part: Mayor 472 x 287, Governor 490 x 287 (4K px); sleeve 57 / 52 x 247 / 250.
// ---------------------------------------------------------------------------------------------------------------

const MAYOR_BODY =
  "M-472 -125 L-464 80 L-459 84 L-406 77 L-399 69 L-296 83 L-222 76 L-191 97 L-173 120 L-161 126 L-143 114 L-147 80 L-176 50 L-168 50 L-155 65 L-136 77 L-130 76 L-116 64 L-115 57 L-122 26 L-105 7 L-109 -23 L-101 -19 L-77 5 L-63 9 L-46 5 L-24 21 L-18 18 L-23 10 L-21 8 L-12 12 L-6 11 L0 0 L-1 -6 L-13 -12 L-12 -15 L-5 -14 L-1 -17 L-5 -31 L-56 -36 L-95 -83 L-119 -92 L-204 -144 L-297 -161 L-363 -126 L-395 -116 L-410 -124 L-463 -129 Z";
const MAYOR_CREASES = [
  "M-146 -50 L-139 -43 L-118 -32 L-114 -27 L-113 -20 L-111 -26 L-104 -25 L-120 -41 Z",
  "M-212 27 L-211 32 L-194 37 L-178 53 L-178 48 L-171 46 L-207 26 Z",
];
const MAYOR_SLEEVE = { x: -514, y: -143, w: 57, h: 247 };
const GOV_BODY =
  "M490 -116 L486 -119 L434 -114 L425 -112 L419 -105 L384 -115 L316 -150 L224 -135 L208 -128 L150 -89 L112 -73 L73 -25 L3 -15 L0 0 L8 4 L4 9 L5 15 L23 14 L17 19 L17 25 L23 26 L47 15 L43 26 L49 29 L65 17 L75 21 L97 17 L129 -17 L131 -12 L124 16 L140 35 L134 74 L152 88 L168 81 L171 83 L164 93 L160 122 L163 127 L180 137 L198 123 L202 113 L240 84 L298 93 L317 93 L417 80 L427 88 L478 94 L484 90 Z";
const GOV_CREASES = [
  "M171 -43 L138 -32 L126 -19 L132 -19 L134 -15 L137 -20 L170 -39 Z",
  "M232 40 L227 36 L219 39 L181 63 L169 78 L174 80 L174 85 L209 51 L230 43 Z",
];
const GOV_SLEEVE = { x: 479, y: -136, w: 52, h: 250 };

// where the strings leave, relative to the fingertip (4K px): the pinch between thumb and finger
export const MAYOR_STRING_ORIGIN: [number, number] = [-8, -12];
export const GOVERNOR_STRING_ORIGIN: [number, number] = [8, -10];
// the white part's extent from the fingertip (4K px), for layout
export const MAYOR_HAND_BOX = { left: -514, right: 0, top: -161, bottom: 126 };
export const GOVERNOR_HAND_BOX = { left: 0, right: 531, top: -150, bottom: 137 };

type HandProps = { x: number; y: number; s: number; rot?: number; arm?: number };
const handT = (x: number, y: number, s: number, rot: number) =>
  `translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})`;

/** The Mayor's hand: (x, y) = the fingertip in world px, s = world px per 4K px, fingers point to +x. */
export const MayorHand: React.FC<HandProps> = ({ x, y, s, rot = 0, arm = 900 }) => (
  <g transform={handT(x, y, s, rot)}>
    <rect
      x={MAYOR_SLEEVE.x - arm}
      y={MAYOR_SLEEVE.y}
      width={MAYOR_SLEEVE.w + arm + 6}
      height={MAYOR_SLEEVE.h}
      fill={F_INK}
    />
    <path d={MAYOR_BODY} fill={F_WHITE} />
    {MAYOR_CREASES.map((d) => (
      <path key={d} d={d} fill={F_CREASE} />
    ))}
  </g>
);

/** The Governor's hand: (x, y) = the fingertip in world px, s = world px per 4K px, fingers point to -x. */
export const GovernorHand: React.FC<HandProps> = ({ x, y, s, rot = 0, arm = 900 }) => (
  <g transform={handT(x, y, s, rot)}>
    <rect x={GOV_SLEEVE.x - 6} y={GOV_SLEEVE.y} width={GOV_SLEEVE.w + arm + 6} height={GOV_SLEEVE.h} fill={F_INK} />
    <path d={GOV_BODY} fill={F_WHITE} />
    {GOV_CREASES.map((d) => (
      <path key={d} d={d} fill={F_CREASE} />
    ))}
  </g>
);

/** World position of a hand's string origin, given the fingertip (x, y), scale s and rotation. */
export const stringOrigin = (
  who: "mayor" | "governor",
  x: number,
  y: number,
  s: number,
  rot = 0,
): [number, number] => {
  const [ox, oy] = who === "mayor" ? MAYOR_STRING_ORIGIN : GOVERNOR_STRING_ORIGIN;
  const c = Math.cos(rot * D2R);
  const si = Math.sin(rot * D2R);
  return [x + s * (ox * c - oy * si), y + s * (ox * si + oy * c)];
};

// ---------------------------------------------------------------------------------------------------------------
// Labels: white italic serif, letter-spaced, typed on letter by letter like the original ("th", "the M", ...).
// (x, y) = the baseline anchor; anchor start | middle | end. `shown` = letters visible (fractional = floor).
// Cap height = 0.66 x size (Tinos).
// ---------------------------------------------------------------------------------------------------------------

export const SERIF_CAP = 0.66;
export const SERIF_TRACK = 0.04; // em
export const SerifLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  anchor?: "start" | "middle" | "end";
  shown?: number;
}> = ({ text, x, y, size, anchor = "start", shown }) => {
  const k = shown === undefined ? text.length : Math.max(0, Math.floor(shown));
  if (k <= 0) return null;
  return (
    <text
      x={n(x)}
      y={n(y)}
      textAnchor={anchor}
      fontFamily={SERIF}
      fontStyle="italic"
      fontWeight={400}
      fontSize={size}
      letterSpacing={`${SERIF_TRACK}em`}
      fill={F_WHITE}
      style={{ fontKerning: "normal" }}
    >
      {text.split("").map((ch, i) => (
        <tspan key={i} fillOpacity={i < k ? 1 : 0}>
          {ch}
        </tspan>
      ))}
    </text>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Strings: white lines of constant width, drawn from the hand by a moving tip (grow 0..1).
// ---------------------------------------------------------------------------------------------------------------

export const STRING_W = 2.6;
export const HString: React.FC<{ from: [number, number]; to: [number, number]; grow?: number; w?: number }> = ({
  from,
  to,
  grow = 1,
  w = STRING_W,
}) => {
  const g = clamp01(grow);
  if (g <= 0) return null;
  const x2 = from[0] + (to[0] - from[0]) * g;
  const y2 = from[1] + (to[1] - from[1]) * g;
  return (
    <line x1={n(from[0])} y1={n(from[1])} x2={n(x2)} y2={n(y2)} stroke={F_WHITE} strokeWidth={w} strokeLinecap="round" />
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The scissors (white, as in the original seqf680-720): two halves crossing at the pivot, each a long narrow blade
// on one side and a handle to a hollow ring on the other. 4K units, anchored at the pivot, blades along -x.
// Blade 610, ring centres (297, +-91), ring r 93 / hole 50, handle 26 wide, pivot dot r 15 dark. open 0..1 =
// each half 1.5..17 deg off the axis.
// ---------------------------------------------------------------------------------------------------------------

export const SC_BLADE = 610;
const SC_RING: [number, number] = [297, 91];
const SC_RING_R = 93;
const SC_HOLE_R = 50;
// the upper blade (cutting edge on y 0); its own ring is the LOWER one (a half is one rigid lever through the pivot)
const SC_BLADE_PATH = "M-610 0 L-420 -7 L-160 -15 L-10 -19 L22 -14 L26 0 Z";
const ScHalf: React.FC = () => {
  const [rx, ry] = SC_RING;
  const d = Math.hypot(rx, ry);
  const ex = rx - (rx / d) * (SC_RING_R - 8);
  const ey = ry - (ry / d) * (SC_RING_R - 8);
  return (
    <g>
      <path d={SC_BLADE_PATH} fill={F_WHITE} />
      <path d={`M-6 -2 L${n(ex)} ${n(ey)}`} stroke={F_WHITE} strokeWidth={26} strokeLinecap="round" fill="none" />
      <path
        d={`M${rx + SC_RING_R} ${ry} A${SC_RING_R} ${SC_RING_R} 0 1 1 ${rx - SC_RING_R} ${ry} A${SC_RING_R} ${SC_RING_R} 0 1 1 ${rx + SC_RING_R} ${ry} Z M${rx + SC_HOLE_R} ${ry} A${SC_HOLE_R} ${SC_HOLE_R} 0 1 0 ${rx - SC_HOLE_R} ${ry} A${SC_HOLE_R} ${SC_HOLE_R} 0 1 0 ${rx + SC_HOLE_R} ${ry} Z`}
        fill={F_WHITE}
        fillRule="evenodd"
      />
    </g>
  );
};
/** (x, y) = the pivot in world px; rot = the blades' direction offset (0 = blades point to -x). */
export const WhiteScissors: React.FC<{ x: number; y: number; s: number; rot?: number; open: number }> = ({
  x,
  y,
  s,
  rot = 0,
  open,
}) => {
  const half = 1.5 + 15.5 * clamp01(open);
  return (
    <g transform={`translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})`}>
      <g transform={`rotate(${n(half)})`}>
        <ScHalf />
      </g>
      <g transform={`rotate(${n(-half)}) scale(1 -1)`}>
        <ScHalf />
      </g>
      <circle cx={0} cy={0} r={15} fill={F_INK} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The hydra. Head traced from hydra_seqf418.png (4K units, origin = the neck join, pointing up; 144 x 290; the
// eye a 246 dot r 15 at (-30, -125)). Necks: flat ink polylines (13.5 px wide = the original's 45 at 4K x 0.3)
// on a trunk that widens to 30 px into the body. Body: the original's flat-topped dome, re-proportioned.
// ---------------------------------------------------------------------------------------------------------------

export const HEAD_S = 0.36; // world px per 4K px for heads (head ~104 px long)
const HEAD_PATH =
  "M-30 -290 L-78 -143 L-73 -20 L-67 -19 L-24 -30 L-23 2 L22 -2 L21 -25 L23 -28 L57 -18 L61 -21 L66 -153 L35 -283 L31 -282 L-3 -197 L-7 -194 L-27 -289 Z";
const EYE: [number, number] = [-30, -125];
const EYE_R = 15;
export const HEAD_LEN = 290 * HEAD_S;

export const HX = 540;
// The whole hydra sits HYDRA_DY lower than the first pass (coordinator, Nov 7): the fan's top tips at y ~490-510,
// and the body is the creature's back rising from below the frame: a broad dome that widens down and runs off the
// bottom edge, as the original's body is cut by its frame.
export const HYDRA_DY = 160;
export const BODY_TOP = 944 + HYDRA_DY;
export const BODY_BASE = 1990; // off the bottom of the frame
const BODY_PTS: [number, number][] = [
  [-150, BODY_TOP],
  [150, BODY_TOP],
  [218, BODY_TOP + 30],
  [292, BODY_TOP + 90],
  [366, BODY_TOP + 200],
  [436, BODY_TOP + 400],
  [500, BODY_BASE],
  [-500, BODY_BASE],
  [-436, BODY_TOP + 400],
  [-366, BODY_TOP + 200],
  [-292, BODY_TOP + 90],
  [-218, BODY_TOP + 30],
];
const NECK_W = 16; // the original's 45 at 4K, for a head of 104
const TRUNK_W0 = 40; // a pair's shared trunk, into the body
const TRUNK_W1 = 26; // ... at the fork

type NeckDef = { end: [number, number]; dir: number };
// the 12 neck ends (head joins) and head directions (deg, 0 = up, -90 = left), left to right
const NECK_DEFS: NeckDef[] = [
  { end: [238, 836 + HYDRA_DY], dir: -97 },
  { end: [230, 712 + HYDRA_DY], dir: -66 },
  { end: [254, 600 + HYDRA_DY], dir: -46 },
  { end: [322, 512 + HYDRA_DY], dir: -27 },
  { end: [420, 466 + HYDRA_DY], dir: -12 },
  { end: [512, 440 + HYDRA_DY], dir: -3 },
  { end: [600, 454 + HYDRA_DY], dir: 7 },
  { end: [690, 478 + HYDRA_DY], dir: 19 },
  { end: [774, 534 + HYDRA_DY], dir: 33 },
  { end: [830, 618 + HYDRA_DY], dir: 52 },
  { end: [822, 720 + HYDRA_DY], dir: 66 },
  { end: [812, 842 + HYDRA_DY], dir: 95 },
];
export const NECK_COUNT = NECK_DEFS.length;

// The necks fork in pairs (0-1, 2-3, ... 10-11) out of six trunks, like the original's branching: a trunk rises
// out of the body leaning out (the outer ones almost sideways), forks at the knee, and each neck runs on to a short
// last segment lined up with its head (the original's second kink).
export type Neck = { root: [number, number]; knee: [number, number]; pre: [number, number]; end: [number, number]; dir: number };
export const NECKS: Neck[] = NECK_DEFS.map((d, i) => {
  const pair = Math.floor(i / 2);
  const tp = (pair - 2.5) / 2.5;
  const root: [number, number] = [HX + tp * 128, 1000 + HYDRA_DY];
  const e0 = NECK_DEFS[pair * 2].end;
  const e1 = NECK_DEFS[pair * 2 + 1].end;
  const mx = (e0[0] + e1[0]) / 2;
  const my = (e0[1] + e1[1]) / 2;
  const a = 0.32 + 0.3 * Math.abs(tp);
  const b = 0.5 - 0.24 * Math.abs(tp);
  const knee: [number, number] = [root[0] + (mx - root[0]) * a, root[1] + (my - root[1]) * b];
  const ux = Math.sin(d.dir * D2R);
  const uy = -Math.cos(d.dir * D2R);
  const pre: [number, number] = [d.end[0] - 40 * ux, d.end[1] - 40 * uy];
  return { root, knee, pre, end: d.end, dir: d.dir };
});

// sway: each trunk turns about its root, each neck about its fork, each head tilts a little; slow sines of the
// global frame on their own periods
export const SWAY_DEG = 0.9;
const EMERGE = 140;
const trunkSway = (i: number, G: number) => {
  const p = Math.floor(i / 2);
  return 0.5 * Math.sin((2 * Math.PI * G) / (71 + 6 * (p % 3)) + p * 2.1);
};
const swayAngle = (i: number, G: number) => SWAY_DEG * Math.sin((2 * Math.PI * G) / (58 + 9 * (i % 4)) + i * 1.7);
const headTilt = (i: number, G: number) => 2.2 * Math.sin((2 * Math.PI * G) / (47 + 5 * (i % 3)) + i * 2.3);

const rotAbout = (p: [number, number], c: [number, number], deg: number): [number, number] => {
  const a = deg * D2R;
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};

export type NeckPose = { pts: [number, number][]; head: [number, number]; ang: number };
/** The posed neck i at global frame G with grow g (scale about the root) and an extra head angle. */
export const neckPose = (i: number, G: number, g: number, extraAng = 0, bend = 0): NeckPose => {
  const nk = NECKS[i];
  const ts = trunkSway(i, G);
  const sw = swayAngle(i, G) + bend;
  // while growing, the neck also rises out of the body (EMERGE px lower at g 0, so the head starts hidden in it)
  const lift = EMERGE * (1 - Math.min(1, g));
  const gr = (p: [number, number]): [number, number] => [
    nk.root[0] + (p[0] - nk.root[0]) * g,
    nk.root[1] + (p[1] - nk.root[1]) * g + lift,
  ];
  const knee = rotAbout(gr(nk.knee), nk.root, ts);
  const root: [number, number] = [nk.root[0], nk.root[1] + lift];
  const up = (p: [number, number]) => rotAbout(rotAbout(gr(p), nk.root, ts), knee, sw);
  const pts = [root, knee, up(nk.pre), up(nk.end)];
  return { pts, head: pts[3], ang: nk.dir + ts + sw + headTilt(i, G) + extraAng };
};

/** A point at fraction u (0 root .. 1 head) along the posed neck's polyline (for strings, scissors). */
export const neckPoint = (pose: NeckPose, u: number): [number, number] => {
  const p = pose.pts;
  const lens = [1, 2, 3].map((k) => Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]));
  let t = clamp01(u) * (lens[0] + lens[1] + lens[2]);
  for (let k = 0; k < 3; k++) {
    if (t <= lens[k] || k === 2) {
      const f = lens[k] > 0 ? Math.min(1, t / lens[k]) : 0;
      return [p[k][0] + (p[k + 1][0] - p[k][0]) * f, p[k][1] + (p[k + 1][1] - p[k][1]) * f];
    }
    t -= lens[k];
  }
  return p[3];
};

// the head's world transform
const headT = (pose: NeckPose, scale: number) =>
  `translate(${n(pose.head[0])} ${n(pose.head[1])}) rotate(${n(pose.ang)}) scale(${n(HEAD_S * scale)})`;

// a glint swells the eye to 3x its radius (a lit head's eye is 1.75x); the light it casts is the caller's (Hydra.tsx)
export const GLINT_GROW = 2;
export const HydraHead: React.FC<{ pose: NeckPose; lit?: number; scale?: number; glint?: number }> = ({
  pose,
  lit = 0,
  scale = 1,
  glint = 0,
}) => (
  <g transform={headT(pose, scale)}>
    <path d={HEAD_PATH} fill={F_INK} />
    <circle cx={EYE[0]} cy={EYE[1]} r={n(EYE_R * Math.max(1 + 0.75 * clamp01(lit), 1 + GLINT_GROW * clamp01(glint)))} fill={F_EYE} />
  </g>
);

const NeckShape: React.FC<{ pose: NeckPose }> = ({ pose }) => {
  const [r, k] = pose.pts;
  const dx = k[0] - r[0];
  const dy = k[1] - r[1];
  const L = Math.hypot(dx, dy) || 1;
  const px = -dy / L;
  const py = dx / L;
  const w0 = TRUNK_W0 / 2;
  const w1 = TRUNK_W1 / 2;
  // the trunk ends square at the fork, a little past the knee, so the step to the thinner neck shows (the kink)
  const kx = k[0] + (dx / L) * 6;
  const ky = k[1] + (dy / L) * 6;
  const trunk = `M${n(r[0] + px * w0)} ${n(r[1] + py * w0)} L${n(kx + px * w1)} ${n(ky + py * w1)} L${n(kx - px * w1)} ${n(ky - py * w1)} L${n(r[0] - px * w0)} ${n(r[1] - py * w0)} Z`;
  const line = pose.pts
    .slice(1)
    .map((p, j) => `${j ? "L" : "M"}${n(p[0])} ${n(p[1])}`)
    .join(" ");
  return (
    <g>
      <path d={trunk} fill={F_INK} />
      <path d={line} fill="none" stroke={F_INK} strokeWidth={NECK_W} strokeLinejoin="miter" strokeMiterlimit={3} strokeLinecap="square" />
    </g>
  );
};

export const HydraBody: React.FC = () => (
  <path d={`M${BODY_PTS.map((p) => `${HX + p[0]} ${p[1]}`).join(" L")} Z`} fill={F_INK} />
);

// ---------------------------------------------------------------------------------------------------------------
// Tags: a small blank white luggage tag on a short string, hanging (world-vertical) from the head join. It enters
// by swinging out from behind its own head (tag 0 = pointing along the head, hidden by it; 1 = hanging), with a
// damped swing, then sways with the head.
// ---------------------------------------------------------------------------------------------------------------

export const TAG_W = 24;
export const TAG_H = 35;
export const TAG_STRING = 9;
const TAG_PATH = `M${-TAG_W / 2 + 5} 0 L${TAG_W / 2 - 5} 0 L${TAG_W / 2} 5 L${TAG_W / 2} ${TAG_H} L${-TAG_W / 2} ${TAG_H} L${-TAG_W / 2} 5 Z`;

/** The angle (deg, 0 = hanging straight down, positive = swung counter-clockwise on screen) for a tag state. */
export const tagSwing = (i: number, local: number, G: number) => {
  // local = frames since the swing began; out = a spring from the head's direction to hanging
  // the tag hangs along +y rotated by ang (SVG, clockwise): it points along the head when ang = dir + 180; left
  // heads swing out through the left (ang falls from dir+180 to 0 via +90), right heads through the right
  const d = NECKS[i].dir + trunkSway(i, G) + swayAngle(i, G) + headTilt(i, G);
  const start = i < 6 ? d + 180 : d - 180;
  const sp = spring({ frame: local, fps: 24, config: { damping: 7, stiffness: 120, mass: 0.6 } });
  const life = 4 * Math.sin((2 * Math.PI * G) / 41 + i * 1.3);
  return start * (1 - sp) + life * clamp01(local / 12);
};

export const HydraTag: React.FC<{ at: [number, number]; ang: number }> = ({ at, ang }) => (
  <g transform={`translate(${n(at[0])} ${n(at[1])}) rotate(${n(ang)})`}>
    <line x1={0} y1={0} x2={0} y2={TAG_STRING + 2} stroke={F_WHITE} strokeWidth={1.6} />
    <g transform={`translate(0 ${TAG_STRING})`}>
      <path d={TAG_PATH} fill={F_WHITE} />
      <circle cx={0} cy={6} r={2.6} fill={F_INK} />
    </g>
  </g>
);

// ---------------------------------------------------------------------------------------------------------------
// The whole hydra. heads[i]: grow (0..~1.05), lit (0..1), nod (deg), tag: frames since its tag began to swing out
// (undefined = no tag). `underTags` draws above the necks, below tags/heads (labels flying into their tags).
// ---------------------------------------------------------------------------------------------------------------

// glint (0..1, optional): the eye alone flares (no head scale), for the count-off in the merged Hydra cut.
// bend (deg, optional): the upper neck turns about its fork (a flinch); the head follows.
export type HeadState = { grow: number; lit?: number; nod?: number; tag?: number; glint?: number; bend?: number };
/** World position and radius of head's eye (for the glint halo). */
export const eyeWorld = (pose: NeckPose, scale = 1): { x: number; y: number; r: number } => {
  const a = (pose.ang * Math.PI) / 180;
  const s = HEAD_S * scale;
  const ex = EYE[0] * s;
  const ey = EYE[1] * s;
  return { x: pose.head[0] + ex * Math.cos(a) - ey * Math.sin(a), y: pose.head[1] + ex * Math.sin(a) + ey * Math.cos(a), r: EYE_R * s };
};

export const Hydra: React.FC<{ G: number; heads: HeadState[]; underTags?: React.ReactNode; overHeads?: React.ReactNode }> = ({
  G,
  heads,
  underTags,
  overHeads,
}) => {
  const poses = heads.map((h, i) => neckPose(i, G, h.grow, h.nod ?? 0, h.bend ?? 0));
  return (
    <g>
      {poses.map((p, i) => (heads[i].grow > 0.001 ? <NeckShape key={`n${i}`} pose={p} /> : null))}
      {underTags}
      {poses.map((p, i) => {
        const t = heads[i].tag;
        if (t === undefined || t < 0 || heads[i].grow < 0.5) return null;
        return <HydraTag key={`t${i}`} at={p.head} ang={tagSwing(i, t, G)} />;
      })}
      {poses.map((p, i) =>
        heads[i].grow > 0.001 ? (
          <HydraHead
            key={`h${i}`}
            pose={p}
            lit={heads[i].lit ?? 0}
            scale={1 + 0.08 * clamp01(heads[i].lit ?? 0)}
            glint={heads[i].glint ?? 0}
          />
        ) : null,
      )}
      <HydraBody />
      {overHeads}
    </g>
  );
};

/** Grow of head i at global frame G in the opening (HydraDozenHeads): a sweep left to right, all out by G ~23. */
export const GROW_ORDER = [1, 0, 2, 3, 5, 4, 6, 7, 9, 8, 10, 11];
export const growAt = (i: number, G: number) => {
  const start = -3 + GROW_ORDER.indexOf(i) * 1.5;
  return spring({ frame: G - start, fps: 24, config: { damping: 14, stiffness: 150, mass: 0.55 } });
};
