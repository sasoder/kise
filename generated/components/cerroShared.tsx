import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { CAM_DAMP, CAM_STIFF, camEase, clamp, sway } from "./fieldShared";
import { PERSON_DATA_URL } from "./cerroAssets";

// ---------------------------------------------------------------------------
// CERRO GORDO TRAILER — the shared module (owner: builder A).
//
// Core Memory podcast, Ashlee Vance x Brent Underwood. Six opaque 16:9 cuts in
// the "core memory podcast graphic standard": PeakForSolar's paper, ink, hard
// shadow, chain crown and damped camera, laid out for 1920 x 1080 at 24 fps.
// A piece decides what happens; this file decides what it is made of.
//
// BASE (stable, see out/cerro/BASE_READY.md):
//   FRAME_W / FRAME_H / FPS, the colours and ladders, `fontFamily` + `type()`,
//   `PaperGround`, `Inked` (hard shadow), `ShadowText`, `textRise` /
//   `RiseText`, `ChainEcho` (the crown), `Person`, and the 16:9 camera:
//   `CAM_LIFT_169`, `camMove169`, `runCamera2`, `worldTransform169`, plus
//   re-exports of `camEase`, `clamp`, `sway`, `CAM_STIFF`, `CAM_DAMP`.
// MINE (see out/cerro/MINE_READY.md): further down, after the base.
//
// Rules this file enforces so the six cuts cannot drift apart:
//   * WHITE #FFFFFF is the ink. Every white thing sits on a hard #000000 copy
//     of itself at +4/+4 WORLD px, zero blur — never a CSS drop-shadow.
//   * The chain (orange #FFB765, purple #BC37FF, blue #0046FF) is only ever an
//     ECHO: the shape's own silhouette, stacked orange (back) -> purple -> blue
//     -> core, resting as a CROWN of 12 px steps in one column. Nothing in the
//     chain fades; a layer exists or it does not.
//   * One stroke weight (6 world px), one opacity ladder (1.0 / 0.55 / 0.3).
//   * Type is Barlow 800/900 uppercase. Text slides up ~24 SCREEN px while it
//     fades 0 -> 1 over 12 frames, ease-out. A numeral changing in place may
//     hard-tick.
// ---------------------------------------------------------------------------

export const FRAME_W = 1920;
export const FRAME_H = 1080;
export const FPS = 24;

// -- ink and colour ----------------------------------------------------------
export const INK = "#FFFFFF";
export const WHITE = INK;
export const SHADOW = "#000000";
export const BLACK = SHADOW;
export const ORANGE = "#FFB765";
export const PURPLE = "#BC37FF";
export const BLUE = "#0046FF";
/** back -> front. The core (INK) sits in front of all three. */
export const CHAIN = [ORANGE, PURPLE, BLUE] as const;
/** the dimmed photograph's own mean, behind it so a frame can never show through */
export const PAPER_BASE = "#C0C0C0";

export const SHADOW_OFF = 4; // world px, +x and +y
export const STROKE = 6; // world px, the one line weight
export const OP_FULL = 1.0;
export const OP_MID = 0.55;
export const OP_LOW = 0.3;

// -- motion constants ---------------------------------------------------------
/** quick off the mark, a long ease into place: every rise, drop and slide */
export const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
export const CHAIN_TRAVEL = 22; // frames a chain layer travels
export const CHAIN_STAGGER = 2; // frames between chain layers
export const CROWN_STEP = 12; // world px per colour at rest
export const TEXT_RISE_PX = 24; // SCREEN px the text slides up
export const TEXT_RISE_FRAMES = 12;
const EASE_OUT = Easing.out(Easing.cubic);

// -- type --------------------------------------------------------------------
const { fontFamily: barlow } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});
export const fontFamily = barlow;
/** Barlow's ink metrics per em, measured off the shipped webfont (PeakForSolar). */
export const BARLOW_CAP = 0.7;
export const type = (size: number, weight: 800 | 900, tracking = 0) =>
  ({
    fontFamily,
    fontWeight: weight,
    fontSize: size,
    textTransform: "uppercase",
    letterSpacing: tracking ? `${tracking}em` : undefined,
  }) as const;

// -- the ground --------------------------------------------------------------
// `public/paper-supaclean-still.png` is 3864 x 2164 LANDSCAPE, so on a 16:9
// frame it is NOT rotated. The box is 1920*1.6 x 1080*1.6 = 3072 x 1728,
// objectFit cover -> max(3072/3864, 1728/2164) = 0.7985 of source; it stays
// under 1.0x of source up to bgScale 1.252, i.e. camera k <= 1.84 (bgScale is
// 1 + (k - 1) * 0.3). A cut that goes tighter than k 1.84 must say so.
// Filter `brightness(0.88) blur(3px)` on the image ONLY. Parallax 0.15 in both
// axes off the camera's rest, drift -0.3 px/frame (on the GLOBAL frame if the
// piece is cut out of a master, so butt joins are continuous).
export const BG_OVERSIZE = 1.6;
export const PAPER_SRC = "paper-supaclean-still.png";
export const PAPER_PARALLAX = 0.15;
export const PAPER_DIM = 0.88;
export const PAPER_BLUR = 3;

export const PaperGround: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  cxRest: number;
  cyRest: number;
  k: number;
  src?: string;
  parallax?: number;
  dim?: number;
  blur?: number;
  /** OPTIONAL overrides (added by A for the 21x map fly-in; nothing else
   *  changes when they are omitted): a screen-px offset replacing the
   *  parallax term (the drift is still added), and the image scale. */
  offset?: { x: number; y: number };
  scale?: number;
}> = ({
  frame,
  cx,
  cy,
  cxRest,
  cyRest,
  k,
  src = PAPER_SRC,
  parallax = PAPER_PARALLAX,
  dim = PAPER_DIM,
  blur = PAPER_BLUR,
  offset,
  scale,
}) => {
  const bgY = (offset ? offset.y : -(cy - cyRest) * k * parallax) - frame * 0.3;
  const bgX = offset ? offset.x : -(cx - cxRest) * k * parallax;
  const bgScale = scale ?? 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_W * BG_OVERSIZE,
          height: FRAME_H * BG_OVERSIZE,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
        }}
      />
    </AbsoluteFill>
  );
};

// -- the hard shadow -----------------------------------------------------------
/**
 * A white thing on its hard black copy. `render(fill)` draws the shape (SVG,
 * world coords) in the fill it is handed; `Inked` draws it twice — SHADOW at
 * +off/+off behind, INK in front. Pass `ink` to draw the front in another
 * colour (e.g. black text on a white card is drawn without `Inked`).
 */
export const Inked: React.FC<{
  render: (fill: string) => React.ReactNode;
  off?: number;
  ink?: string;
  shadow?: string;
  opacity?: number;
}> = ({ render, off = SHADOW_OFF, ink = INK, shadow = SHADOW, opacity = 1 }) => (
  <g opacity={opacity === 1 ? undefined : opacity}>
    <g transform={`translate(${off} ${off})`}>{render(shadow)}</g>
    {render(ink)}
  </g>
);

// -- text --------------------------------------------------------------------
/** SVG text on its hard shadow. `y` is the BASELINE. Tracking is compensated
 *  so a tracked word stays centred on `x` with textAnchor middle. */
export const ShadowText: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  weight?: 800 | 900;
  anchor?: "start" | "middle" | "end";
  tracking?: number;
  ink?: string;
  opacity?: number;
}> = ({ text, x, y, size, weight = 900, anchor = "middle", tracking = 0, ink = INK, opacity = 1 }) => {
  const comp = tracking && anchor === "middle" ? (-tracking * size) / 2 : 0;
  return (
    <Inked
      ink={ink}
      opacity={opacity}
      render={(fill) => (
        <text x={x + comp} y={y} textAnchor={anchor} fill={fill} style={type(size, weight, tracking)}>
          {text}
        </text>
      )}
    />
  );
};

/** The text entrance: 24 SCREEN px up (so divide by the camera k) while the
 *  opacity goes 0 -> 1, over 12 frames, ease-out. Returns the world-px dy to
 *  ADD to the rest baseline and the opacity. Before f0: opacity 0.
 *  `out` gives the mirror exit (slides DOWN + fades) starting at out. */
export const textRise = (
  frame: number,
  f0: number,
  k = 1,
  opts: { px?: number; frames?: number; out?: number; outFrames?: number } = {},
) => {
  const px = opts.px ?? TEXT_RISE_PX;
  const frames = opts.frames ?? TEXT_RISE_FRAMES;
  const t = interpolate(frame, [f0, f0 + frames], [0, 1], { easing: EASE_OUT, ...clamp });
  let dy = ((1 - t) * px) / k;
  let opacity = t;
  if (opts.out !== undefined) {
    const of = opts.outFrames ?? frames;
    const u = interpolate(frame, [opts.out, opts.out + of], [0, 1], {
      easing: Easing.in(Easing.cubic),
      ...clamp,
    });
    dy += (u * px) / k;
    opacity *= 1 - u;
  }
  return { dy, opacity };
};

/** ShadowText that slides up + fades in at `f0` (and optionally out at `out`). */
export const RiseText: React.FC<{
  frame: number;
  f0: number;
  k: number;
  text: string;
  x: number;
  y: number;
  size: number;
  weight?: 800 | 900;
  anchor?: "start" | "middle" | "end";
  tracking?: number;
  opacity?: number; // the ladder rung it rests at
  out?: number;
}> = ({ frame, f0, k, opacity = 1, out, y, ...rest }) => {
  const r = textRise(frame, f0, k, { out });
  if (r.opacity <= 0) return null;
  return <ShadowText {...rest} y={y + r.dy} opacity={r.opacity * opacity} />;
};

// -- the chain echo ----------------------------------------------------------
/**
 * THE CROWN. `render(fill)` draws the shape at rest (world coords). The echo
 * is three copies of that silhouette, orange (back) / purple / blue, at rest
 * translated `step`, 2*step, 3*step along `dir` (default straight UP), so the
 * resolved shape wears three 12 px stripes in one column — never a fan.
 *
 * Each layer travels in from `from` (an offset from its rest, world px) over
 * `travel` frames on EASE_LAND. Order:
 *   order "colorsLead": orange at `start`, purple +2, blue +4, core +6 — the
 *     PeakForSolar rise: the leading colour rides ahead as a band.
 *   order "coreLeads": core at `start`, blue +2, purple +4, orange +6 — the
 *     colours TRAIL the core (a drop: they hang behind it and close up).
 * core:
 *   "travel" — the core (and its shadow) travel with the echo,
 *   "static" — the core and its shadow sit at rest all along (drawn here),
 *   "none"   — the caller draws the core; only the three colours are drawn
 *              (put this BEHIND the caller's core in paint order).
 * The shadow is the core's only (at +SHADOW_OFF), at the very back, on the
 * core's own timing. Nothing fades.
 */
export const ChainEcho: React.FC<{
  frame: number;
  start: number;
  render: (fill: string) => React.ReactNode;
  from?: { dx: number; dy: number };
  dir?: { dx: number; dy: number };
  step?: number;
  stagger?: number;
  travel?: number;
  order?: "colorsLead" | "coreLeads";
  core?: "travel" | "static" | "none";
  ink?: string;
  shadow?: string;
  off?: number;
}> = ({
  frame,
  start,
  render,
  from = { dx: 0, dy: 0 },
  dir = { dx: 0, dy: -1 },
  step = CROWN_STEP,
  stagger = CHAIN_STAGGER,
  travel = CHAIN_TRAVEL,
  order = "colorsLead",
  core = "travel",
  ink = INK,
  shadow = SHADOW,
  off = SHADOW_OFF,
}) => {
  // start frames: index 0..2 = orange, purple, blue; 3 = core
  const starts =
    order === "colorsLead"
      ? [start, start + stagger, start + 2 * stagger, start + 3 * stagger]
      : [start + 3 * stagger, start + 2 * stagger, start + stagger, start];
  const pos = (i: number) => {
    const t = interpolate(frame, [starts[i], starts[i] + travel], [0, 1], { easing: EASE_LAND, ...clamp });
    return { x: (1 - t) * from.dx, y: (1 - t) * from.dy };
  };
  const layer = (i: number, fill: string, extra: { x: number; y: number }) => {
    const p = pos(i);
    return (
      <g key={`${fill}-${i}`} transform={`translate(${p.x + extra.x} ${p.y + extra.y})`}>
        {render(fill)}
      </g>
    );
  };
  const coreIn = core === "static" || (core === "travel" && frame >= starts[3]);
  const coreP = core === "static" ? { x: 0, y: 0 } : pos(3);
  return (
    <g>
      {coreIn ? (
        <g transform={`translate(${coreP.x + off} ${coreP.y + off})`}>{render(shadow)}</g>
      ) : null}
      {CHAIN.map((c, i) => {
        if (frame < starts[i]) return null;
        const n = 3 - i; // orange 3 steps, purple 2, blue 1
        return layer(i, c, { x: dir.dx * step * n, y: dir.dy * step * n });
      })}
      {coreIn ? <g transform={`translate(${coreP.x} ${coreP.y})`}>{render(ink)}</g> : null}
    </g>
  );
};

// -- people ------------------------------------------------------------------
/** `public/person.png` (512 x 512, flat head-and-shoulders) as an inline data
 *  URL, tinted white on its hard black copy. (x, y) is the box's top-left,
 *  `size` its side in world px. */
export const PERSON_SRC = PERSON_DATA_URL;
export const Person: React.FC<{
  x: number;
  y: number;
  size: number;
  idPrefix: string; // unique per SVG, for the two tint filters
  ink?: string;
  opacity?: number;
}> = ({ x, y, size, idPrefix, ink = INK, opacity = 1 }) => {
  const fW = `${idPrefix}-person-ink`;
  const fB = `${idPrefix}-person-shadow`;
  const rgb = (h: string) => {
    const n = parseInt(h.replace("#", ""), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  const [r, g, b] = rgb(ink);
  return (
    <g opacity={opacity === 1 ? undefined : opacity}>
      <defs>
        <filter id={fW} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 1 0`} />
        </filter>
        <filter id={fB} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        </filter>
      </defs>
      <image
        href={PERSON_SRC}
        x={x + SHADOW_OFF}
        y={y + SHADOW_OFF}
        width={size}
        height={size}
        filter={`url(#${fB})`}
      />
      <image href={PERSON_SRC} x={x} y={y} width={size} height={size} filter={`url(#${fW})`} />
    </g>
  );
};

// -- the camera, 16:9 ------------------------------------------------------------
// Same house tracker (CAM_STIFF / CAM_DAMP) as every piece, with an x channel
// (PeakForSolar's `runCamera2`). The content centre lands on screen y
// FRAME_H/2 - CAM_LIFT_169 = 520 at every k, which keeps the bottom ~110 px
// (YouTube chrome) quiet.
export { CAM_DAMP, CAM_STIFF, camEase, clamp, sway };
export const CONTENT_SCREEN_Y = 520;
export const CAM_LIFT_169 = FRAME_H / 2 - CONTENT_SCREEN_Y; // 20

/** Where the world sits on screen for a camera at (cx, cy, k), 1920 x 1080. */
export const worldTransform169 = (cx: number, cy: number, k: number) => ({
  tx: FRAME_W / 2 - cx * k,
  ty: FRAME_H / 2 - cy * k,
});

/** fieldShared's `camMove` with the 16:9 lift and an x channel: one key per
 *  frame on the warped smoothstep; cy = content centre + lift / k off the SAME
 *  eased k, so zoom and framing settle together. */
export const camMove169 = ({
  f0,
  f1,
  k0,
  k1,
  c0,
  c1,
  x0,
  x1,
  warp = 1,
  lift = CAM_LIFT_169,
}: {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  x0: number;
  x1: number;
  warp?: number;
  lift?: number;
}) => {
  if (f1 <= f0) {
    throw new Error(`camMove169: f${f0}-${f1} is not a forward move`);
  }
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  const span = f1 - f0;
  for (let i = 0; i <= span; i++) {
    const g = camEase(i / span, warp);
    const k = k0 + (k1 - k0) * g;
    F.push(f0 + i);
    K.push(k);
    CY.push(c0 + (c1 - c0) * g + lift / k);
    CX.push(x0 + (x1 - x0) * g);
  }
  return { F, K, CY, CX };
};

/** The damped tracker with an x channel. O(upto) per call — fine at these
 *  lengths. Start state = the first key (a picture at f0, no settle). */
export const runCamera2 = (upto: number, F: number[], CY: number[], CX: number[], K: number[]) => {
  let cy = CY[0];
  let cx = CX[0];
  let k = K[0];
  let vy = 0;
  let vx = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tx = interpolate(f, F, CX, clamp);
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

/** The world layer: a 1920 x 1080 SVG under translate + scale(k). */
export const World: React.FC<{
  cx: number;
  cy: number;
  k: number;
  children: React.ReactNode;
}> = ({ cx, cy, k, children }) => {
  const { tx, ty } = worldTransform169(cx, cy, k);
  return (
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
          {children}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ===========================================================================
// MINE — THE MOUNTAIN IN SECTION (see out/cerro/MINE_READY.md)
//
// One mountain, one shaft, a few levels. WORLD px, origin = THE COLLAR (the
// top of the shaft, where cut 1's pin stood), +y down. The section is drawn at
// the scale cut 2 resolves at, SECTION_K (screen px per world px); at the
// collar close-up cut 2 opens on, k is 1.25.
//
//   * The SKY is the paper: nothing is drawn above the profile.
//   * The EARTH is one white shape below the profile, on its hard shadow at
//     +SHADOW_OFF/+SHADOW_OFF world px, extending far past any frame.
//   * The SHAFT and the LEVELS (drifts) are paper-coloured slots cut INTO the
//     earth (an SVG mask), so the earth's own shadow shows as a 4 px black
//     inset along each slot's top and left walls — no extra drawing.
//   * The bench: the collar sits on a flat terrace (y = 0) from BENCH.x0 to
//     BENCH.x1; the peak is up-left of it. No depth numbers anywhere.
// ===========================================================================

/** The ridge line, left to right, through the collar. Interpolated with a
 *  monotone cubic, so the bench stays exactly flat and nothing overshoots. */
export const SECTION_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [-7000, 2300],
  [-3600, 1300],
  [-2300, 720],
  [-1450, 260],
  [-900, -120],
  [-560, -330],
  [-400, -385], // THE PEAK
  [-270, -330],
  [-170, -120],
  [-120, 0], // bench start
  [780, 0], // bench end
  [1060, 110],
  [1500, 380],
  [2300, 760],
  [3600, 1300],
  [7000, 2300],
];
export const PEAK = { x: -400, y: -385 };
export const BENCH = { x0: -120, x1: 780, y: 0 };
export const COLLAR = { x: 0, y: 0 };
export const SHAFT_X = 0; // centre line
export const SHAFT_W = 100;
export const SHAFT_LEFT = SHAFT_X - SHAFT_W / 2;
export const SHAFT_RIGHT = SHAFT_X + SHAFT_W / 2;
export const COLLAR_Y = 0;
export const SHAFT_BOTTOM = 1900; // the sump; cut 2 never sees below ~+880
export const DRIFT_H = 40; // a level's slot height
/** The levels: `y` = the drift's TOP edge, `side` +1 = east (right), -1 = west,
 *  `len` from the shaft wall. Spacing widens with depth. */
export const LEVELS: ReadonlyArray<{ y: number; side: 1 | -1; len: number }> = [
  { y: 230, side: 1, len: 300 },
  { y: 470, side: -1, len: 380 },
  { y: 730, side: 1, len: 440 },
  { y: 1030, side: -1, len: 420 },
  { y: 1360, side: 1, len: 480 },
  { y: 1720, side: -1, len: 400 },
];
/** cut 2's resolved world scale (screen px per world px) */
export const SECTION_K = 0.72;

// monotone cubic (Fritsch-Carlson) through SECTION_PROFILE
const PX = SECTION_PROFILE.map((p) => p[0]);
const PY = SECTION_PROFILE.map((p) => p[1]);
const PM = (() => {
  const n = PX.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((PY[i + 1] - PY[i]) / (PX[i + 1] - PX[i]));
  const m: number[] = [d[0]];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return m;
})();

/** The ground's y at world x (the top of the earth). */
export const profileY = (x: number) => {
  if (x <= PX[0]) return PY[0];
  if (x >= PX[PX.length - 1]) return PY[PY.length - 1];
  let i = 0;
  while (x > PX[i + 1]) i++;
  const h = PX[i + 1] - PX[i];
  const t = (x - PX[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * PY[i] +
    (t3 - 2 * t2 + t) * h * PM[i] +
    (-2 * t3 + 3 * t2) * PY[i + 1] +
    (t3 - t2) * h * PM[i + 1]
  );
};

const EARTH_X0 = -7000;
const EARTH_X1 = 7000;
const EARTH_FLOOR = 9000;
const EARTH_STEP = 16;
const EARTH_PTS = (() => {
  const pts: string[] = [];
  for (let x = EARTH_X0; x <= EARTH_X1; x += EARTH_STEP) pts.push(`${x} ${profileY(x).toFixed(2)}`);
  return pts;
})();
/** The earth as one closed path: the profile, then down and round. `lift`
 *  raises the whole ridge line by that many world px (cut 2's wipe uses it). */
export const earthPath = (lift = 0) => {
  if (lift === 0) {
    return `M${EARTH_PTS.join(" L")} L${EARTH_X1} ${EARTH_FLOOR} L${EARTH_X0} ${EARTH_FLOOR} Z`;
  }
  const pts: string[] = [];
  for (let x = EARTH_X0; x <= EARTH_X1; x += EARTH_STEP) pts.push(`${x} ${(profileY(x) - lift).toFixed(2)}`);
  return `M${pts.join(" L")} L${EARTH_X1} ${EARTH_FLOOR} L${EARTH_X0} ${EARTH_FLOOR} Z`;
};

export type Hole = { x: number; y: number; w: number; h: number };

/** How much of a level is open when the shaft front is at `open` (world px
 *  below the collar): it unrolls sideways as the front passes it, over a
 *  stretch of front travel equal to its own length. 0..1. */
export const levelOpen = (open: number, level: { y: number; len: number }) => {
  const u = clamp01Local((open - (level.y + DRIFT_H)) / level.len);
  return 1 - (1 - u) * (1 - u); // ease-out
};
const clamp01Local = (v: number) => Math.max(0, Math.min(1, v));

/** The holes for a given shaft front: the shaft from the collar down to
 *  `open`, and every level the front has passed, unrolled by `levelOpen`. */
export const sectionHoles = (open: number = Infinity): Hole[] => {
  const holes: Hole[] = [];
  const depth = Math.min(open, SHAFT_BOTTOM);
  if (depth > 0) holes.push({ x: SHAFT_LEFT, y: COLLAR_Y, w: SHAFT_W, h: depth });
  for (const L of LEVELS) {
    const len = L.len * levelOpen(open, L);
    if (len <= 0.5) continue;
    holes.push(
      L.side === 1
        ? { x: SHAFT_RIGHT - 1, y: L.y, w: len + 1, h: DRIFT_H }
        : { x: SHAFT_LEFT - len, y: L.y, w: len + 1, h: DRIFT_H },
    );
  }
  return holes;
};

/**
 * THE EARTH IN SECTION: white, on its hard shadow, with the slots cut in.
 *   idPrefix   unique per SVG (the mask id)
 *   lift       raises the ridge line (0 = rest)
 *   open       the shaft front, world px below the collar (default: all open)
 *   extraHoles any more slots to cut (a cut's own drift, a stope, a chamber)
 * Draw it FIRST in the world, before anything that stands on or in it.
 */
export const SectionEarth: React.FC<{
  idPrefix: string;
  lift?: number;
  open?: number;
  extraHoles?: Hole[];
  off?: number;
  ink?: string;
  shadow?: string;
}> = ({ idPrefix, lift = 0, open = Infinity, extraHoles = [], off = SHADOW_OFF, ink = INK, shadow = SHADOW }) => {
  const id = `${idPrefix}-earth-slots`;
  const holes = [...sectionHoles(open), ...extraHoles];
  const d = earthPath(lift);
  return (
    <g>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={EARTH_X0 - 100} y={-6000} width={EARTH_X1 - EARTH_X0 + 200} height={EARTH_FLOOR + 6100}>
          <rect x={EARTH_X0 - 100} y={-6000} width={EARTH_X1 - EARTH_X0 + 200} height={EARTH_FLOOR + 6100} fill="#FFFFFF" />
          {holes.map((h, i) => (
            <rect key={i} x={h.x} y={h.y} width={h.w} height={h.h} fill="#000000" />
          ))}
        </mask>
      </defs>
      <g transform={`translate(${off} ${off})`}>
        <path d={d} fill={shadow} mask={`url(#${id})`} />
      </g>
      <path d={d} fill={ink} mask={`url(#${id})`} />
    </g>
  );
};
