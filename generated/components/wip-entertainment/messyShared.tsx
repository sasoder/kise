import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadMarker } from "@remotion/google-fonts/PermanentMarker";
import React, { useId } from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile } from "remotion";
import {
  H,
  PAPER_D,
  PAPER_H,
  PAPER_W,
  PHOTO_BLACK,
  RED,
  THEMES,
  W,
  WipCam,
  WipFilmLife,
  depthTransform,
  inkOn,
} from "../kits/works-in-progress/wipShared";

// ---------------------------------------------------------------------------
// wip-entertainment: THE MESSY VARIANT of the Works in Progress look (notes/COMMON.md). Shared by every cut of the
// clip; import it, never fork it. Additions go in as new exports, logged in notes/SHARED_CHANGES.md.
// "A more stripped down and messier approach … it shouldn't look super duper polished. But still good nonetheless."
//
// STACK, bottom to top, inside <MessyFilmLife frame={frame}>:
//   <MessyPaper cam={cam} />                     the off-white sheet (heavier tooth, scuffs, one faint fold crease)
//   <WipPlane cam={cam}> RoughCutPrint, Tape     pasted things (kit's WipPlane: a normal plane)
//   <WipPlane cam={cam} ink> MarkerStroke, Scrawl the author's red marker: an `ink` plane, so it multiplies into the
//                                                 paper and the prints under it (felt tip over a photo darkens it)
// Motion: things that are PLACED (prints dealt, tape stuck) move on twos with a settle wobble (dealIn, stickOn);
// marker strokes draw on every frame from their moving tip; every hand-made line "boils" (re-jitters every 3 frames).
// Baked: scripts/clips/wip-entertainment/bake-messy-paper.py (the sheet), bake-roughcut.py (matted prints with the
// hand-cut border baked in). Probe: ./MessyProbe.tsx.
// ---------------------------------------------------------------------------

export { H, RED, W };
/** The off-white theme pair. */
export const PAPER = THEMES.offwhite.paper; // #FFF7F4
export const INK = THEMES.offwhite.ink; // #121212
/** The marker's red, compensated so that multiplied into the off-white paper it lands on RED. Use on an `ink` plane. */
export const MARKER_INK = inkOn(RED, "offwhite");
/** Near-black ink for a scrawl in pen, compensated for the paper. */
export const PEN_INK = inkOn(INK, "offwhite");
/** The photo paper of a print: a cooler, flatter white than the page, so a print's border reads against it. */
export const PRINT_WHITE = "#F8F7F2";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- fonts -------------------------------------------------------------------------
const { fontFamily: markerFamily } = loadMarker("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: caveatFamily } = loadCaveat("normal", { weights: ["700"], subsets: ["latin"] });
/** Felt-tip capitals (Permanent Marker 400): years, numbers, one or two scrawled words. */
export const MARKER_FONT = markerFamily;
/** A quicker hand (Caveat 700): a word written fast in pen. */
export const HAND_FONT = caveatFamily;

// -- time ----------------------------------------------------------------------------
/** Stop-motion: hold each pose two frames. Sample a placed thing's eased motion at onTwos(frame). */
export const onTwos = (frame: number) => Math.floor(frame / 2) * 2;
/** The boil's clock: a hand-drawn line is re-jittered every `every` frames (3 by default). */
export const boilKey = (frame: number, every = 3) => Math.floor(frame / every);
/** A hand's draw: 0..1 from `start` to `end`, quick in the middle (a marker stroke's speed). */
export const drawT = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], { ...clamp, easing: Easing.bezier(0.38, 0, 0.3, 1) });

/**
 * A print DEALT onto the page by hand, on twos: it slides in from `from` (a world offset; keep it off frame or behind
 * something: it arrives at full size and opacity) over `dur` frames from `start`, lands, and settles with a small
 * damped wobble (`wobble` deg, `settle` frames). Returns the offset, the extra rotation and `lift` (1 carried .. 0
 * lying, for RoughCutPrint's shadow). `landed` is the contact frame: write it in the header.
 */
export const dealIn = (
  frame: number,
  { start, dur = 12, from, rot = 0, wobble = 1.4, settle = 8 }: { start: number; dur?: number; from: { x: number; y: number }; rot?: number; wobble?: number; settle?: number },
) => {
  const f = onTwos(frame);
  const land = start + dur;
  const t = interpolate(f, [start, land], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.55, 0.3, 1) });
  const after = f - land;
  const s = after >= 0 && after <= settle ? Math.exp(-after / (settle * 0.35)) * Math.cos(after * 1.35) : 0;
  return {
    dx: from.x * (1 - t),
    dy: from.y * (1 - t),
    rot: rot * (1 - t) + (after >= 0 ? wobble * s : 0),
    lift: f < land ? 0.15 + 0.6 * (1 - t) : 0,
    landed: land,
  };
};

// -- the ground ------------------------------------------------------------------------
/**
 * The messy off-white sheet (baked: paper_offwhite_messy.jpg, 2200 x 3800, the kit's PaperGround geometry: world
 * centre (540, 960) at rest, depth PAPER_D). `shift` slides the sheet (world px) so cuts can show different parts of
 * it (the fold crease runs about a third down the frame at rest; shift it off frame if it fights your subject).
 * Throws if the camera outruns the sheet.
 */
export const MessyPaper: React.FC<{ cam: WipCam; d?: number; shift?: { x: number; y: number } }> = ({ cam, d = PAPER_D, shift = { x: 0, y: 0 } }) => {
  const t = depthTransform(cam, d);
  const ax = (cam.x0 ?? W / 2) - W / 2 + shift.x;
  const ay = (cam.y0 ?? H / 2) - H / 2 + shift.y;
  const left = W / 2 - PAPER_W / 2 + ax;
  const top = H / 2 - PAPER_H / 2 + ay;
  const a = t.toScreen(left, top);
  const b = t.toScreen(left + PAPER_W, top + PAPER_H);
  if (a.x > 0 || a.y > 0 || b.x < W || b.y < H) {
    throw new Error(`MessyPaper: camera (${cam.x}, ${cam.y}, k ${cam.k}) with shift (${shift.x}, ${shift.y}) leaves the sheet`);
  }
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: t.transform }}>
        <Img
          src={staticFile("wip-entertainment/paper_offwhite_messy.jpg")}
          style={{ position: "absolute", left, top, width: PAPER_W, height: PAPER_H, maxWidth: "none" }}
        />
      </div>
    </AbsoluteFill>
  );
};

/** The kit's film life on the off-white theme, grain a touch heavier (0.18). Wrap the whole scene. */
export const MessyFilmLife: React.FC<{ frame: number; children?: React.ReactNode; grain?: number; seed?: string }> = ({
  frame,
  children,
  grain = 0.18,
  seed = "messy",
}) => (
  <WipFilmLife frame={frame} theme="offwhite" grain={grain} seed={seed}>
    {children}
  </WipFilmLife>
);

// -- hand-made lines ------------------------------------------------------------------
export type Pt = { x: number; y: number };

/** Smooth 1-D value noise in -1..1 (deterministic per seed). */
export const vnoise = (seed: string, t: number) => {
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

const resample = (pts: Pt[], step: number, closed: boolean) => {
  const src = closed ? [...pts, pts[0]] : pts;
  const out: Pt[] = [src[0]];
  let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const a = src[i - 1];
    const b = src[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    let d = step - carry;
    while (d <= len) {
      out.push({ x: a.x + ((b.x - a.x) * d) / len, y: a.y + ((b.y - a.y) * d) / len });
      d += step;
    }
    carry = len - (d - step);
  }
  const last = src[src.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last.x - tail.x, last.y - tail.y) > 0.5) out.push(last);
  return out;
};

/**
 * A hand's version of a polyline: resampled every `step` px, pushed sideways by a slow wobble (`wobble` px, the hand)
 * and a fine boil (`boil` px, re-seeded every 3 frames from `frame`). World px in, world px out.
 */
export const handPath = (
  pts: Pt[],
  { seed, frame, wobble = 2.5, boil = 1.5, step = 5, closed = false }: { seed: string; frame: number; wobble?: number; boil?: number; step?: number; closed?: boolean },
) => {
  const r = resample(pts, step, closed);
  const bk = boilKey(frame);
  let s = 0;
  return r.map((p, i) => {
    if (i > 0) s += Math.hypot(p.x - r[i - 1].x, p.y - r[i - 1].y);
    const a = r[Math.max(0, i - 1)];
    const b = r[Math.min(r.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const off = wobble * (0.7 * vnoise(`${seed}-w`, s / 95) + 0.3 * vnoise(`${seed}-v`, s / 33)) + boil * vnoise(`${seed}-b${bk}`, s / 22);
    return { x: p.x + nx * off, y: p.y + ny * off };
  });
};

/** The first `t` (0..1) of a polyline by length, ending on an interpolated tip. */
export const truncate = (pts: Pt[], t: number) => {
  if (t >= 1) return pts;
  if (t <= 0 || pts.length < 2) return [];
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const target = cum[cum.length - 1] * t;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] >= target) {
      const u = (target - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
      out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u });
      return out;
    }
    out.push(pts[i]);
  }
  return out;
};

export const polyLength = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);

/** A straight stroke as a hand draws it: a slight bow (fraction of its length, seeded sign) and a quick end. */
export const handLine = (a: Pt, b: Pt, seed: string, bow = 0.012): Pt[] => {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const k = (random(`${seed}-bow`) < 0.5 ? -1 : 1) * bow * len * (0.6 + 0.8 * random(`${seed}-bowk`));
  const c = { x: (a.x + b.x) / 2 + nx * k * 2, y: (a.y + b.y) / 2 + ny * k * 2 };
  return Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    return { x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y };
  });
};

/** A ring drawn round something: starts at `startDeg`, runs past full circle (`turns`), its radius drifting so the ends don't meet. */
export const handLoop = (cx: number, cy: number, rx: number, ry: number, seed: string, { startDeg = -120, turns = 1.1, tilt = 0 } = {}): Pt[] => {
  const n = 72;
  const a0 = (startDeg * Math.PI) / 180;
  const tl = (tilt * Math.PI) / 180;
  const drift = 0.05 + 0.04 * random(`${seed}-drift`);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = a0 + t * turns * Math.PI * 2;
    const k = 1 + drift * (t - 0.5) + 0.025 * vnoise(`${seed}-r`, t * 5);
    const px = Math.cos(a) * rx * k;
    const py = Math.sin(a) * ry * k;
    return { x: cx + px * Math.cos(tl) - py * Math.sin(tl), y: cy + px * Math.sin(tl) + py * Math.cos(tl) };
  });
};

/** An arrow as three strokes: the shaft, then the two barbs (draw them in that order). */
export const handArrow = (a: Pt, b: Pt, seed: string, head = 34): Pt[][] => {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const barb = (s: number) => {
    const da = (s * (152 + 10 * random(`${seed}-h${s}`)) * Math.PI) / 180;
    return [b, { x: b.x + Math.cos(ang + da) * head, y: b.y + Math.sin(ang + da) * head }];
  };
  return [handLine(a, b, seed), barb(1), barb(-1)];
};

/**
 * A ragged torn edge from x0 to x1 about the line y = yAt(x): small jagged steps (`amp` px) on a slower wander.
 * Use it for a tear's clip polygon (both halves share the same points, so they fit like puzzle pieces).
 */
export const raggedLine = (x0: number, x1: number, yAt: (x: number) => number, seed: string, { amp = 6, step = 7 } = {}): Pt[] => {
  const n = Math.max(2, Math.ceil((x1 - x0) / step));
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / n + (i > 0 && i < n ? (random(`${seed}-dx${i}`) - 0.5) * step * 0.6 : 0);
    const y = yAt(x) + amp * (0.65 * vnoise(`${seed}-slow`, x / 60) + 0.35 * (random(`${seed}-j${i}`) * 2 - 1));
    return { x, y };
  });
};

const useFilterId = (name: string) => `messy-${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
const seedInt = (seed: string | number, salt: string) => 1 + Math.floor(random(`${seed}-${salt}`) * 9973);

/**
 * The author's red felt-tip, drawn on from its moving tip (no dash tricks: the path itself grows). `points` = the
 * stroke's control polyline in plane px (use handLine / handLoop / handArrow, or your own). `progress` 0..1 (drawT).
 * `frame` drives the boil. `dash` [dash, gap] world px for a dashed line (the pattern is anchored at the start, so it
 * never crawls). Put it on an `ink` WipPlane (the default colour MARKER_INK assumes the multiply into the paper).
 * `width` about 12-16 world px for a felt tip at rest scale.
 */
export const MarkerStroke: React.FC<{
  points: Pt[];
  frame: number;
  progress?: number;
  width?: number;
  color?: string;
  seed?: string;
  wobble?: number;
  boil?: number;
  dash?: [number, number];
  closed?: boolean;
  opacity?: number;
}> = ({ points, frame, progress = 1, width = 13, color = MARKER_INK, seed = "marker", wobble = 2.5, boil = 1.5, dash, closed = false, opacity = 0.93 }) => {
  const id = useFilterId("mk");
  if (progress <= 0 || points.length < 2) return null;
  const hp = handPath(points, { seed, frame, wobble, boil, closed });
  const vis = truncate(hp, progress);
  if (vis.length < 2) return null;
  const pad = width * 2 + 8;
  const xs = hp.map((p) => p.x);
  const ys = hp.map((p) => p.y);
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  const bw = Math.max(...xs) - x0 + pad;
  const bh = Math.max(...ys) - y0 + pad;
  const d = `M${vis.map((p) => `${(p.x - x0).toFixed(2)} ${(p.y - y0).toFixed(2)}`).join("L")}`;
  const bk = boilKey(frame);
  const head = vis[0];
  return (
    <svg width={bw} height={bh} viewBox={`0 0 ${bw} ${bh}`} style={{ position: "absolute", left: x0, top: y0, overflow: "visible", opacity }}>
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          {/* a felt tip's edge: slightly rough, re-jittered with the boil */}
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={2} seed={seedInt(seed, `e${bk}`)} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={Math.min(3, width * 0.22)} xChannelSelector="R" yChannelSelector="G" result="rough" />
          {/* uneven ink take: a fine streaky density, 80-100 % */}
          <feTurbulence type="fractalNoise" baseFrequency="0.35 0.6" numOctaves={1} seed={seedInt(seed, "take")} result="t" />
          <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.45 0 0 0 0.62" result="ta" />
          <feComposite in="rough" in2="ta" operator="in" result="out" />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash ? dash.join(" ") : undefined} />
        {/* the pen touching down leaves a little more ink at the start */}
        {dash ? null : <circle cx={head.x - x0} cy={head.y - y0} r={width * 0.56} fill={color} />}
      </g>
    </svg>
  );
};

/**
 * Handwriting, written on letter by letter from the left (a hard, slightly slanted wipe per letter, `perLetter`
 * frames each from `start`), each letter a little off the baseline and tilted, the whole word boiling every 3
 * frames. (x, y) = the word's left end at its baseline middle (CSS box: left, vertical centre). `font` "marker"
 * (felt-tip capitals, for years and numbers) or "hand" (a quick pen). Put it on an `ink` WipPlane.
 */
export const Scrawl: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  frame: number;
  start?: number;
  perLetter?: number;
  font?: "marker" | "hand";
  color?: string;
  rotate?: number;
  seed?: string;
  boil?: number;
  tracking?: number;
}> = ({ text, x, y, size, frame, start = 0, perLetter = 2.5, font = "marker", color = MARKER_INK, rotate = -3, seed = "scrawl", boil = 1.5, tracking = 0.02 }) => {
  const id = useFilterId("scrawl");
  if (frame < start) return null;
  const chars = [...text];
  const bk = boilKey(frame);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - size * 0.75,
        height: size * 1.5,
        whiteSpace: "nowrap",
        transformOrigin: `0 ${size * 0.75}px`,
        transform: `rotate(${rotate}deg)`,
        fontFamily: font === "marker" ? MARKER_FONT : HAND_FONT,
        fontWeight: font === "marker" ? 400 : 700,
        fontSize: size,
        lineHeight: `${size * 1.5}px`,
        letterSpacing: `${tracking}em`,
        color,
        filter: `url(#${id})`,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={id} x="-10%" y="-20%" width="120%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={seedInt(seed, `b${bk}`)} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={boil * 2} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      {chars.map((c, i) => {
        const u = Math.min(1, Math.max(0, (frame - start - i * perLetter) / perLetter));
        const jy = (random(`${seed}-y${i}`) - 0.5) * size * 0.08;
        const jr = (random(`${seed}-r${i}`) - 0.5) * 7;
        const edge = -30 + u * 170; // % of the letter's box: the pen's wipe, slanted
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${jy}px) rotate(${jr}deg)`,
              clipPath: u >= 1 ? undefined : `polygon(-30% -40%, ${edge + 12}% -40%, ${edge - 12}% 140%, -30% 140%)`,
              visibility: u <= 0 ? "hidden" : undefined,
            }}
          >
            {c === " " ? " " : c}
          </span>
        );
      })}
    </div>
  );
};

// -- prints ------------------------------------------------------------------------------
const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const toneTable = (black: number, white: number, gamma: number) =>
  Array.from({ length: 17 }, (_, i) => (black + (white - black) * (i / 16) ** gamma).toFixed(4)).join(" ");

/**
 * Levels onto the print's black and PRINT_WHITE (per channel), and a print grain. In: SourceGraphic. `mono`: greyscale
 * first (the b&w print of the first passes). Default colour: the user wants the colours back (Nov 8).
 */
const MessyGrade: React.FC<{ result: string; seed: string; gamma: number; grain: number; mono: boolean }> = ({ result, seed, gamma, grain, mono }) => {
  const b = hexRgb(PHOTO_BLACK);
  const w = hexRgb(PRINT_WHITE);
  return (
    <>
      <feColorMatrix in="SourceGraphic" type="saturate" values={mono ? "0" : "1"} result="grey" />
      <feComponentTransfer in="grey" result="toned">
        <feFuncR type="table" tableValues={toneTable(b[0], w[0], gamma)} />
        <feFuncG type="table" tableValues={toneTable(b[1], w[1], gamma)} />
        <feFuncB type="table" tableValues={toneTable(b[2], w[2], gamma)} />
      </feComponentTransfer>
      <feTurbulence type="fractalNoise" baseFrequency="0.6 0.9" numOctaves={2} seed={seedInt(seed, "grain")} result="n0" />
      <feColorMatrix in="n0" type="matrix" values="2.4 0 0 0 -0.7  2.4 0 0 0 -0.7  2.4 0 0 0 -0.7  0 0 0 0 1" result="n" />
      <feComposite in="toned" in2="n" operator="arithmetic" k1={2 * grain} k2={1 - grain} k3={0.36 * grain} k4={-0.18 * grain} result="grained" />
      <feComposite in="grained" in2="SourceAlpha" operator="in" result={result} />
    </>
  );
};

/** A soft contact shadow for a paper lying on the page (CSS, on an unrotated wrapper so it always falls down the page). */
export const contactShadow = (lift = 0, strength = 1) => {
  const near = `drop-shadow(0 ${(1.2 + 7 * lift).toFixed(2)}px ${(1.5 + 6 * lift).toFixed(2)}px rgba(40,24,20,${(0.3 * strength * (1 - 0.4 * lift)).toFixed(3)}))`;
  const far = `drop-shadow(0 ${(5 + 24 * lift).toFixed(2)}px ${(9 + 22 * lift).toFixed(2)}px rgba(40,24,20,${(0.17 * strength).toFixed(3)}))`;
  return `${near} ${far}`;
};

/**
 * The hand-cut border of a RECTANGULAR print, in the print's own px (0,0 = the photo window's top-left, ww x wh):
 * scissor snips, straight between corners, each vertex its own distance out (border[0]..border[1] px), corners
 * sometimes snipped off. Used by RoughCutPrint's rect mode; exported for anything that needs the same outline.
 */
export const handCutRect = (ww: number, wh: number, seed: string, border: [number, number] = [6, 18]): Pt[] => {
  const [b0, b1] = border;
  const bw = (k: string) => b0 + (b1 - b0) * random(`${seed}-${k}`);
  // corners clockwise from top-left, with the outward directions of the side before and after each
  const corners: { x: number; y: number; sx: number; sy: number }[] = [
    { x: 0, y: 0, sx: -1, sy: -1 },
    { x: ww, y: 0, sx: 1, sy: -1 },
    { x: ww, y: wh, sx: 1, sy: 1 },
    { x: 0, y: wh, sx: -1, sy: 1 },
  ];
  const pts: Pt[] = [];
  corners.forEach((c, i) => {
    const n = corners[(i + 1) % 4];
    const ox = c.x + c.sx * bw(`c${i}x`);
    const oy = c.y + c.sy * bw(`c${i}y`);
    // the side from this corner to the next: unit direction and outward normal
    const len = Math.hypot(n.x - c.x, n.y - c.y);
    const ux = (n.x - c.x) / len;
    const uy = (n.y - c.y) / len;
    const nx = uy;
    const ny = -ux;
    if (random(`${seed}-ch${i}`) < 0.35) {
      // one snip across the corner: two points instead of one
      const cc = 5 + 12 * random(`${seed}-chs${i}`);
      const p = corners[(i + 3) % 4];
      const pl = Math.hypot(c.x - p.x, c.y - p.y);
      pts.push({ x: ox - ((c.x - p.x) / pl) * cc, y: oy - ((c.y - p.y) / pl) * cc });
      pts.push({ x: ox + ux * cc, y: oy + uy * cc });
    } else {
      pts.push({ x: ox, y: oy });
    }
    // 1-2 snips along the side, each vertex its own distance out
    const k = 1 + Math.floor(random(`${seed}-n${i}`) * 2);
    for (let j = 1; j <= k; j++) {
      const t = (j - 0.5 + 0.5 * (random(`${seed}-t${i}${j}`) - 0.5)) / k;
      const o = bw(`o${i}${j}`);
      pts.push({ x: c.x + (n.x - c.x) * t + nx * o, y: c.y + (n.y - c.y) * t + ny * o });
    }
  });
  return pts;
};

/**
 * A photograph cut out by hand and stuck on the page: the print grade (levels onto PHOTO_BLACK .. PRINT_WHITE, print
 * grain; in colour unless `mono`, then greyscale first), an uneven scissor-cut white border, crooked (seeded ±1.5-4 deg unless `rotate`), a soft contact
 * shadow that grows with `lift` (0 lying flat .. 1 carried). (x, y) = centre in plane px.
 *
 * Two modes:
 *  - baked (default): `src` is a PNG from scripts/clips/wip-entertainment/bake-roughcut.py: a matted subject with its
 *    hand-cut white border already in the alpha. `w` = the PNG's full width in world px, `aspect` = the PNG's w / h
 *    (the script prints it).
 *  - `rect`: any photo, cropped to a rectangle (`fit`/`position` as object-fit), the hand-cut border drawn at render
 *    time round it (`border` [min, max] world px). `w` / `aspect` = the PHOTO WINDOW (the border is outside it).
 */
export const RoughCutPrint: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  aspect: number;
  rect?: boolean;
  border?: [number, number];
  rotate?: number;
  flipX?: boolean;
  lift?: number;
  shadow?: number;
  gamma?: number;
  grain?: number;
  fit?: "cover" | "contain";
  position?: string;
  seed?: string;
  mono?: boolean;
  style?: React.CSSProperties;
}> = ({ src, x, y, w, aspect, rect = false, border = [5, 22], rotate, flipX = false, lift = 0, shadow = 1, gamma = 1, grain = 0.12, fit = "cover", position = "50% 50%", seed = src, mono = false, style }) => {
  const id = useFilterId("print");
  const h = w / aspect;
  const rot = rotate ?? (random(`${seed}-rs`) < 0.5 ? -1 : 1) * (1.5 + 2.5 * random(`${seed}-rm`));
  const grade = (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <MessyGrade result="out" seed={seed} gamma={gamma} grain={grain} mono={mono} />
        </filter>
      </defs>
    </svg>
  );
  const photo = (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        maxWidth: "none",
        objectFit: rect ? fit : undefined,
        objectPosition: rect ? position : undefined,
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    />
  );
  let body: React.ReactNode;
  if (rect) {
    const cut = handCutRect(w, h, `${seed}-cut`, border);
    const poly = `polygon(${cut.map((p) => `${(p.x + border[1] * 2).toFixed(2)}px ${(p.y + border[1] * 2).toFixed(2)}px`).join(", ")})`;
    const o = border[1] * 2;
    body = (
      <div style={{ position: "absolute", left: -o, top: -o, width: w + 2 * o, height: h + 2 * o, clipPath: poly, backgroundColor: PRINT_WHITE }}>
        {/* the scissors never run quite parallel to the photo's own edge */}
        <div style={{ position: "absolute", left: o, top: o, width: w, height: h, overflow: "hidden", filter: `url(#${id})`, transform: `rotate(${((random(`${seed}-skew`) - 0.5) * 2.6).toFixed(3)}deg)` }}>
          {photo}
        </div>
      </div>
    );
  } else {
    body = <div style={{ position: "absolute", inset: 0, filter: `url(#${id})` }}>{photo}</div>;
  }
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, filter: shadow > 0 ? contactShadow(lift, shadow) : undefined, ...style }}>
      {grade}
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${rot}deg)` }}>{body}</div>
    </div>
  );
};

// -- tape ----------------------------------------------------------------------------------
/** A torn end of tape: a fibrous jagged edge across the strip's width, in the strip's own px (y from 0 to h). */
const tornEnd = (x: number, h: number, dir: 1 | -1, seed: string): Pt[] => {
  const n = 9 + Math.floor(random(`${seed}-n`) * 4);
  // the tear runs a little slanted across the strip
  const slant = (random(`${seed}-sl`) - 0.5) * h * 0.35;
  return Array.from({ length: n + 1 }, (_, i) => {
    const y = (h * i) / n;
    const depth = (i % 2 ? 1 : 0.25) * (2.5 + 6 * random(`${seed}-d${i}`));
    return { x: x + dir * (depth + slant * (i / n - 0.5)), y };
  });
};

/**
 * A piece of semi-opaque masking tape (warm cream, crepe texture, torn fibrous ends, a little crooked) holding a
 * print down. (x, y) = centre in plane px, `w` its length, `h` its width (about 40-60), `rotate` deg. Put it on a
 * normal plane, over the print it holds. `press` 0..1 (stickOn) brings it in by hand on twos from `from` (a world
 * offset: keep it off frame, or start it with the print it holds) and presses it flat; leave press at 1 for tape
 * that is already there.
 */
export const Tape: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  rotate?: number;
  press?: number;
  from?: { x: number; y: number };
  seed?: string;
  opacity?: number;
}> = ({ x, y, w, h = 50, rotate = 0, press = 1, from = { x: -700, y: -900 }, seed = "tape", opacity = 0.82 }) => {
  const id = useFilterId("tape");
  if (press <= 0) return null;
  const left = tornEnd(0, h, -1, `${seed}-l`);
  const right = tornEnd(w, h, 1, `${seed}-r`);
  // the long edges: very slightly uneven
  const top = Array.from({ length: 6 }, (_, i) => ({ x: (w * (i + 1)) / 7, y: (random(`${seed}-t${i}`) - 0.5) * 1.4 }));
  const bot = Array.from({ length: 6 }, (_, i) => ({ x: w - (w * (i + 1)) / 7, y: h + (random(`${seed}-b${i}`) - 0.5) * 1.4 }));
  // clockwise: along the top, down the right end, back along the bottom, up the left end
  const poly = [...top, ...right, ...bot, ...left.slice().reverse()];
  const pad = 14;
  const clip = `polygon(${poly.map((p) => `${(p.x + pad).toFixed(2)}px ${p.y.toFixed(2)}px`).join(", ")})`;
  const up = 1 - press;
  const ease = up * up;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2 - pad,
        top: y - h / 2,
        width: w + 2 * pad,
        height: h,
        transform: `translate(${from.x * ease}px, ${from.y * ease}px) rotate(${rotate}deg) scale(${1 + 0.04 * up})`,
        filter: `drop-shadow(0 ${(0.7 + 6 * up).toFixed(2)}px ${(0.9 + 6 * up).toFixed(2)}px rgba(40,24,20,${(0.2 + 0.05 * up).toFixed(3)}))`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, clipPath: clip, opacity, isolation: "isolate" }}>
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#EEE3C3" }} />
        {/* crepe: fine creases across the strip, a soft mottle, a little more body at the edges */}
        <svg width={w + 2 * pad} height={h} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "multiply" }} aria-hidden>
          <defs>
            <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.45 0.04" numOctaves={2} seed={seedInt(seed, "crepe")} result="c" />
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seedInt(seed, "mot")} result="m" />
              <feComposite in="c" in2="m" operator="arithmetic" k2={0.7} k3={0.5} k4={-0.1} result="cm" />
              <feColorMatrix in="cm" type="matrix" values="0.32 0 0 0 0.76  0.32 0 0 0 0.75  0.32 0 0 0 0.73  0 0 0 0 1" />
            </filter>
            <linearGradient id={`${id}-e`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#B9A97E" stopOpacity={0.35} />
              <stop offset="0.09" stopColor="#FFFFFF" stopOpacity={0} />
              <stop offset="0.91" stopColor="#FFFFFF" stopOpacity={0} />
              <stop offset="1" stopColor="#B9A97E" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={w + 2 * pad} height={h} filter={`url(#${id})`} />
          <rect x={0} y={0} width={w + 2 * pad} height={h} fill={`url(#${id}-e)`} />
        </svg>
      </div>
    </div>
  );
};

/** Tape being stuck on: 0 before `start`, then 0..1 over `dur` frames, on twos (so it comes in from Tape's `from`). Contact = start + dur. */
export const stickOn = (frame: number, start: number, dur = 4) => (frame < start ? 0 : interpolate(onTwos(frame), [start, start + dur], [0.001, 1], clamp));
