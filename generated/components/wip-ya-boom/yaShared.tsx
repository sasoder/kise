// ---------------------------------------------------------------------------
// ya boom (wip-ya-boom): the clip's shared MATERIALS, on top of the Works in Progress kit
// (generated/components/kits/works-in-progress/wipShared.tsx; import it, never edit it).
//
// This clip's direction (animation_source/notes/COMMON.md): stripped down, messier, image-led. Real photos and real book
// covers as black-and-white PHOTOCOPIES, cut out by hand with scissors, slapped crooked onto the off-white page and held by
// masking tape; one spot ink, RED, used only as the editor's red felt-tip. Messy is in the material, never in the motion.
//
//   THEME, PAPER, INK, MARKER_RED, MARKER_INK   the page and its one spot ink
//   XeroxCutOut   a photo (kind "person", cut round its matte) or a cover (kind "cover", a rectangle) as a photocopy with a
//                 hand-scissored copy-paper border, optional tape, optional slap
//   Tape          a strip of masking tape (also placed by XeroxCutOut's `tape`)
//   slapDown      a paste dealt onto the page: arrives at full size, lands at `contact` with a short press and a tiny skid
//   MarkerText    a real figure written on in red felt-tip, left to right       (on an `ink` WipPlane)
//   MarkerPath    a ring / underline / line / arrow drawn by the felt-tip's tip  (on an `ink` WipPlane)
//   MonoLabel     a small mono label (names, years), slides up while fading in
//
// API notes: animation_source/notes/YA_SHARED_READY.md. Probe: ./YaSharedProbe.tsx. Changes to an export after release:
// keep the old name working and log it in animation_source/notes/SHARED_CHANGES.md.
// ---------------------------------------------------------------------------
import { loadFont as loadMarker } from "@remotion/google-fonts/NanumPenScript";
import React, { useId } from "react";
import { Easing, interpolate, random, staticFile, Img } from "remotion";
import { MONO, RED, THEMES, WipTheme, inkOn, textRise } from "../kits/works-in-progress/wipShared";

// -- the page ------------------------------------------------------------------------
export const THEME: WipTheme = "offwhite";
export const PAPER = THEMES.offwhite.paper;
export const INK = THEMES.offwhite.ink;
/** The felt-tip's red as it shows on the page (the kit's RED). */
export const MARKER_RED = RED;
/** What the felt-tip lays down on an `ink` plane so that, multiplied into this paper, the page shows MARKER_RED. */
export const MARKER_INK = inkOn(RED, THEME);
/** The copy paper a photocopy is printed on: a cooler, flatter white than the page, so a scissored border reads. */
export const COPY_WHITE = "#F3F2EC";
/** Toner black and the copier's white: the two ends of every photocopy. */
export const TONER_BLACK = "#151514";
export const TONER_WHITE = "#F1F0EA";
/** Masking tape. */
export const TAPE = "#ECE2C6";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const seedInt = (seed: string | number, salt: string) => 1 + Math.floor(random(`${seed}-${salt}`) * 9973);
const useFilterId = (name: string) => `ya-${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

// -- slapDown ------------------------------------------------------------------------------
/** The family of paste speeds: frames in the air, frames of skid, frames of press. */
export const SLAP_DUR = 9;
export const SKID_DUR = 6;
export const PRESS_DUR = 5;

export type Slap = {
  /** world offset from the paste's rest position */
  dx: number;
  dy: number;
  /** degrees added to the paste's own rotation */
  rotate: number;
  /** 1 at rest; a lifted paste is a touch bigger (nearer the lens), a pressed one a hair smaller */
  scale: number;
  /** 1 in the air .. 0 touching: the contact shadow spreads and drifts down with it */
  lift: number;
  /** 0..1..0 over PRESS_DUR frames after contact: the shadow tightens */
  press: number;
  /** false before it starts moving (render nothing) */
  shown: boolean;
};
export const SLAP_REST: Slap = { dx: 0, dy: 0, rotate: 0, scale: 1, lift: 0, press: 0, shown: true };

/**
 * A paste dealt onto the page. `contact` = the frame it touches (write it in the header). Before that it travels for `dur`
 * frames from `from` (a world offset: put it off frame, or {x: 0, y: 0} with `drop` for a paste lowered from above), at
 * full size and full opacity, fast and slowing only a little, so the stop on the page is a slap. At contact it is `skid`
 * world px short of its rest and skids on in the same direction over SKID_DUR frames, decelerating; the shadow tightens
 * with a short press. No bounce. `spin` = degrees of extra rotation at the start, gone by rest. `drop` = how much bigger it
 * is in the air (0.04 for a deal across the page, ~0.12 for a paste lowered straight down).
 */
export const slapDown = (
  frame: number,
  contact: number,
  {
    from = { x: 0, y: -1400 },
    dur = SLAP_DUR,
    skid = 9,
    spin = 0,
    drop = 0.04,
  }: { from?: { x: number; y: number }; dur?: number; skid?: number; spin?: number; drop?: number } = {},
): Slap => {
  const start = contact - dur;
  if (frame < start) return { dx: from.x, dy: from.y, rotate: spin, scale: 1 + drop, lift: 1, press: 0, shown: false };
  const dist = Math.hypot(from.x, from.y);
  // u: 0 at `from` .. 1 at rest, one curve for position and spin. e = the part of the path left for the skid.
  const e = dist > 0 ? Math.min(0.5, skid / dist) : 0;
  let u: number;
  let lift: number;
  if (frame < contact) {
    const t = (frame - start) / dur;
    // fast, slowing a little: at contact it still moves at ~0.3 of its mean speed, then the page stops it
    const p = 0.7 * (1 - (1 - t) ** 2.4) + 0.3 * t;
    u = (1 - e) * p;
    lift = 1 - t * t * (3 - 2 * t) * 0.35 - t * 0.65;
  } else {
    const s = Math.min(1, (frame - contact) / SKID_DUR);
    u = 1 - e * (1 - s) * (1 - s);
    lift = 0;
  }
  const press = frame < contact ? 0 : Math.sin(Math.min(1, (frame - contact) / PRESS_DUR) * Math.PI);
  return {
    dx: from.x * (1 - u),
    dy: from.y * (1 - u),
    rotate: spin * (1 - u),
    scale: 1 + drop * Math.max(0, lift) - 0.006 * press,
    lift: Math.max(0, lift),
    press,
    shown: true,
  };
};

/** The paste's soft contact shadow as CSS drop-shadows on an unrotated wrapper: low, never a hard offset. */
export const pasteShadow = (lift = 0, press = 0, strength = 1) => {
  const a1 = 0.34 * (1 - 0.55 * lift) * (1 + 0.25 * press) * strength;
  const a2 = 0.2 * (1 - 0.25 * lift) * strength;
  const near = `drop-shadow(0px ${(1.4 + 12 * lift - 0.6 * press).toFixed(2)}px ${(1.6 + 9 * lift - 0.7 * press).toFixed(2)}px rgba(18,16,14,${a1.toFixed(3)}))`;
  const far = `drop-shadow(0px ${(5 + 34 * lift).toFixed(2)}px ${(7 + 28 * lift - 2 * press).toFixed(2)}px rgba(18,16,14,${a2.toFixed(3)}))`;
  return `${near} ${far}`;
};

// -- the photocopy grade ---------------------------------------------------------------------
/** The copier's curve: levels in, a hard S, crushed blacks; onto toner black .. copier white. */
const xeroxTable = (contrast: number, gamma: number, from: number, to: number) => {
  const lo = 0.05 + 0.17 * contrast;
  const hi = 0.95 - 0.13 * contrast;
  return Array.from({ length: 33 }, (_, i) => {
    let t = Math.min(1, Math.max(0, (i / 32 - lo) / (hi - lo)));
    t = t ** gamma;
    const s = t * t * (3 - 2 * t);
    t = s * (0.45 + 0.4 * contrast) + t * (0.55 - 0.4 * contrast);
    return (from + (to - from) * t).toFixed(4);
  }).join(" ");
};

/**
 * The SVG primitives of a photocopy, in = SourceGraphic, out = `result`: greyscale, the copier's hard curve, a faint toner
 * haze in the whites, sparse toner specks, a few drop-outs in the blacks, and the darkened rim a copier gives an original's
 * edges. Px values are the filtered element's own px.
 */
const XeroxGrade: React.FC<{ result: string; seed: string | number; contrast: number; gamma: number; speckle: number; edge: number; edgeR: number }> = ({
  result,
  seed,
  contrast,
  gamma,
  speckle,
  edge,
  edgeR,
}) => {
  const b = hexRgb(TONER_BLACK);
  const w = hexRgb(TONER_WHITE);
  const th = 0.8 - 0.05 * speckle; // speck threshold on the noise
  return (
    <>
      <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="grey" />
      <feComponentTransfer in="grey" result="toned0">
        <feFuncR type="table" tableValues={xeroxTable(contrast, gamma, b[0], w[0])} />
        <feFuncG type="table" tableValues={xeroxTable(contrast, gamma, b[1], w[1])} />
        <feFuncB type="table" tableValues={xeroxTable(contrast, gamma, b[2], w[2])} />
      </feComponentTransfer>
      {/* toner haze: a faint uneven grey over the whites (the glass is never clean) */}
      <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves={2} seed={seedInt(seed, "haze")} result="hz0" />
      <feColorMatrix in="hz0" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="hz" />
      <feComposite in="toned0" in2="hz" operator="arithmetic" k1={0.16} k2={0.92} k3={0} k4={0} result="toned1" />
      {/* drop-outs: where the toner did not take, the darks open to grey */}
      <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves={1} seed={seedInt(seed, "drop")} result="dn" />
      <feColorMatrix in="dn" type="matrix" values={`0 0 0 0 0.42  0 0 0 0 0.42  0 0 0 0 0.41  ${22} 0 0 0 ${-22 * (th + 0.02)}`} result="drops" />
      <feBlend in="toned1" in2="drops" mode="lighten" result="toned2" />
      {/* toner specks: sparse dark dots, more of them in the lights' grain */}
      <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves={1} seed={seedInt(seed, "speck")} result="sn" />
      <feColorMatrix in="sn" type="matrix" values={`0 0 0 0 ${b[0]}  0 0 0 0 ${b[1]}  0 0 0 0 ${b[2]}  ${20} 0 0 0 ${-20 * th}`} result="specks" />
      <feComposite in="specks" in2="toned2" operator="over" result="toned3" />
      {/* the darker rim of the copied original */}
      <feGaussianBlur in="SourceAlpha" stdDeviation={edgeR} result="ea" />
      <feColorMatrix in="ea" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="em" />
      <feComposite in="toned3" in2="em" operator="arithmetic" k1={edge} k2={1 - edge} k3={0} k4={0} result="toned4" />
      <feComposite in="toned4" in2="SourceAlpha" operator="in" result={result} />
    </>
  );
};

// -- the scissor outline of a rectangle --------------------------------------------------------
/**
 * A hand-scissored outline round a w x h rectangle (its own px, origin top-left): a few straight cuts per side, each a
 * little off the last, the margin between `border * 0.35` and `border * 1.7`, corners snipped. Never cuts into the rectangle.
 */
export const scissorPath = (w: number, h: number, border: number, seed: string | number) => {
  const r = (k: string) => random(`${seed}-sc-${k}`);
  const off = (k: string) => border * (0.35 + 1.35 * r(k));
  const pts: [number, number][] = [];
  const side = (n: number, at: (u: number, o: number) => [number, number], key: string) => {
    for (let i = 0; i < n; i++) {
      const u = (i + 0.2 + 0.6 * r(`${key}u${i}`)) / n;
      pts.push(at(u, off(`${key}${i}`)));
    }
  };
  // a corner is one cut's end and the next cut's start: a single point off both sides, so the paper corner is never square
  const corner = (x: number, y: number, sx: number, sy: number, key: string) => {
    pts.push([x + sx * off(`${key}x`) * 0.8, y + sy * off(`${key}y`) * 0.8]);
  };
  const nx = 1 + Math.floor(r("nx") * 2);
  const ny = 2 + Math.floor(r("ny") * 2);
  // clockwise from the top-left corner
  corner(0, 0, -1, -1, "c0");
  side(nx, (u, o) => [u * w, -o], "t");
  corner(w, 0, 1, -1, "c1");
  side(ny, (u, o) => [w + o, u * h], "r");
  corner(w, h, 1, 1, "c2");
  side(nx, (u, o) => [w - u * w, h + o], "b");
  corner(0, h, -1, 1, "c3");
  side(ny, (u, o) => [-o, h - u * h], "l");
  return `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L")} Z`;
};

// -- tape -------------------------------------------------------------------------------------
/**
 * A strip of masking tape: translucent warm off-white, both ends torn, a faint fibre along its length, a hair of shadow.
 * (x, y) = its centre in the parent's px, `len` x `width`, `angle` degrees (0 = horizontal). Place it at a corner or an
 * edge of a paste, crossing onto the page. Deterministic per `seed`.
 */
export const Tape: React.FC<{ x: number; y: number; len?: number; width?: number; angle?: number; seed?: string | number; opacity?: number }> = ({
  x,
  y,
  len = 130,
  width = 40,
  angle = 0,
  seed = "tape",
  opacity = 0.8,
}) => {
  const id = useFilterId("tape");
  const pad = 8;
  const L = len;
  const Wd = width;
  const teeth = Math.max(4, Math.round(Wd / 5.5));
  const end = (x0: number, dir: 1 | -1, key: string) => {
    const pts: string[] = [];
    for (let i = 0; i <= teeth; i++) {
      const yy = -Wd / 2 + (i / teeth) * Wd;
      const tear = (random(`${seed}-${key}-${i}`) * 0.8 + (i % 2) * 0.6) * 4.5;
      pts.push(`${(x0 + dir * tear).toFixed(2)} ${yy.toFixed(2)}`);
    }
    return pts;
  };
  const left = end(-L / 2, 1, "l"); // top to bottom
  const right = end(L / 2, -1, "r").reverse(); // bottom to top
  const d = `M${left.join(" L")} L${right.join(" L")} Z`;
  const t = hexRgb(TAPE);
  return (
    <svg
      width={L + 2 * pad}
      height={Wd + 2 * pad}
      viewBox={`${-L / 2 - pad} ${-Wd / 2 - pad} ${L + 2 * pad} ${Wd + 2 * pad}`}
      style={{
        position: "absolute",
        left: x - L / 2 - pad,
        top: y - Wd / 2 - pad,
        overflow: "visible",
        transform: `rotate(${angle}deg)`,
        filter: "drop-shadow(0px 0.8px 0.9px rgba(30,24,14,0.22))",
      }}
    >
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB" x="-10%" y="-30%" width="120%" height="160%">
          {/* the crepe's fibre runs along the strip */}
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.42" numOctaves={2} seed={seedInt(seed, "fib")} result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values={`0 0 0 0 ${t[0]}  0 0 0 0 ${t[1]}  0 0 0 0 ${t[2]}  -1.1 0 0 0 1.25`}
            result="fibre"
          />
          <feComposite in="fibre" in2="SourceGraphic" operator="in" result="fib" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="fib" />
          </feMerge>
        </filter>
      </defs>
      <path d={d} fill={TAPE} fillOpacity={opacity * 0.82} filter={`url(#${id})`} />
      {/* the long edges catch a little more */}
      <line x1={-L / 2 + 4} y1={-Wd / 2 + 0.6} x2={L / 2 - 4} y2={-Wd / 2 + 0.6} stroke="rgba(120,100,60,0.18)" strokeWidth={1.1} />
      <line x1={-L / 2 + 4} y1={Wd / 2 - 0.6} x2={L / 2 - 4} y2={Wd / 2 - 0.6} stroke="rgba(120,100,60,0.14)" strokeWidth={1.1} />
    </svg>
  );
};

/** Where a strip goes on a paste: a corner (across it diagonally) or an edge (across it). `along` 0..1 on an edge. */
export type TapeAt = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";
export type TapeSpec = TapeAt | { at: TapeAt; along?: number; len?: number; width?: number; angle?: number };

const tapePlacement = (spec: TapeSpec, w: number, h: number, seed: string, i: number) => {
  const s = typeof spec === "string" ? { at: spec } : spec;
  const j = (k: string, a: number) => (random(`${seed}-tp${i}-${k}`) - 0.5) * 2 * a;
  const len = s.len ?? Math.min(170, Math.max(96, Math.min(w, h) * 0.36));
  const width = s.width ?? 40;
  const along = s.along ?? 0.5 + j("al", 0.12);
  const inset = 0.12 * len; // a corner strip sits mostly over the paste, its end on the page
  const pos: Record<TapeAt, [number, number, number]> = {
    tl: [inset * 0.7, inset * 0.7, -45],
    tr: [w - inset * 0.7, inset * 0.7, 45],
    bl: [inset * 0.7, h - inset * 0.7, 45],
    br: [w - inset * 0.7, h - inset * 0.7, -45],
    t: [w * along, 0, 90],
    b: [w * along, h, 90],
    l: [0, h * along, 0],
    r: [w, h * along, 0],
  };
  const [x, y, a] = pos[s.at];
  return { x: x + j("x", 4), y: y + j("y", 4), len, width, angle: s.angle ?? a + j("a", 9) };
};

// -- the photocopy cut-out --------------------------------------------------------------------
/**
 * A real photo or cover as a hand-cut PHOTOCOPY pasted on the page. (x, y) = centre (world px), `w` wide, `aspect` = w / h.
 *   kind "cover"   a rectangle: the image fills it (object-fit cover, `position`), a scissored copy-paper margin round it
 *                  (scissorPath), optional `skew` (deg, keep under ~2). Use for covers, prints, pages.
 *   kind "person"  `src` is a PNG with alpha (bake-photo.py --matte): cut round the matte with an uneven paper margin.
 *   border         the mean scissor margin, world px (cover default 13, person 9).
 *   contrast 0..1  how hard the copier's curve is (default 0.6); `gamma` > 1 darkens the mid-tones, < 1 opens a dark subject.
 *   speckle 0..1   toner specks and drop-outs (default 0.5). `edge` 0..1 the darkened rim (default 0.3).
 *   colour         true: the photo keeps its own colours (bake it with bake-photo.py --colour); no photocopy grade, the
 *                  scissored paper margin, tape and shadow stay. Default false (the b&w photocopy).
 *   tape           strips stuck on it, e.g. ["tl", "br"] or [{at: "t", along: 0.3}]. They travel with it.
 *   slap           slapDown(frame, contact, {...}): its offset, spin, lift and press. Without it the paste lies still.
 *   lift / shadow  a still paste's lift (0 flat .. 1 carried) and the shadow's strength.
 * Paint order is the parent's: later pastes cover earlier ones.
 */
export const XeroxCutOut: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  aspect: number;
  kind?: "cover" | "person";
  rotate?: number;
  skew?: number;
  flipX?: boolean;
  position?: string;
  border?: number;
  contrast?: number;
  gamma?: number;
  speckle?: number;
  edge?: number;
  colour?: boolean;
  tape?: TapeSpec[];
  slap?: Slap;
  lift?: number;
  shadow?: number;
  seed?: string | number;
}> = ({
  src,
  x,
  y,
  w,
  aspect,
  kind = "cover",
  rotate = 0,
  skew = 0,
  flipX = false,
  position = "50% 50%",
  border,
  contrast = 0.6,
  gamma = 1,
  speckle = 0.5,
  edge = 0.3,
  colour = false,
  tape = [],
  slap = SLAP_REST,
  lift,
  shadow = 1,
  seed = src,
}) => {
  const gradeId = useFilterId("xerox");
  const cutId = useFilterId("cutline");
  if (!slap.shown) return null;
  const s = String(seed);
  const h = w / aspect;
  const b = border ?? (kind === "cover" ? 13 : 9);
  const pad = b * 2.4;
  const L = lift ?? slap.lift;
  const edgeR = Math.max(3, Math.min(w, h) * 0.03);
  const photo = (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, filter: colour ? undefined : `url(#${gradeId})` }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: 0,
          width: w,
          height: h,
          maxWidth: "none",
          objectFit: kind === "cover" ? "cover" : "fill",
          objectPosition: position,
          transform: flipX ? "scaleX(-1)" : undefined,
        }}
      />
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x + slap.dx - w / 2,
        top: y + slap.dy - h / 2,
        width: w,
        height: h,
        filter: shadow > 0 ? pasteShadow(L, slap.press, shadow) : undefined,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={gradeId} colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
            <XeroxGrade result="out" seed={s} contrast={contrast} gamma={gamma} speckle={speckle} edge={edge} edgeR={edgeR} />
          </filter>
          {kind === "person" ? (
            <filter id={cutId} colorInterpolationFilters="sRGB" x="-25%" y="-25%" width="150%" height="150%">
              <feMorphology in="SourceAlpha" operator="dilate" radius={b * 1.15} result="fat" />
              <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves={2} seed={seedInt(s, "cut")} result="cn" />
              <feDisplacementMap in="fat" in2="cn" scale={b * 1.5} xChannelSelector="R" yChannelSelector="G" result="fat2" />
              {/* scissors leave a clean edge: re-threshold the displaced margin */}
              <feComponentTransfer in="fat2" result="fat3">
                <feFuncA type="linear" slope={6} intercept={-2.5} />
              </feComponentTransfer>
              <feFlood floodColor={COPY_WHITE} result="paper" />
              <feComposite in="paper" in2="fat3" operator="in" />
            </filter>
          ) : null}
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `rotate(${rotate + slap.rotate}deg) skewX(${skew}deg) scale(${slap.scale})`,
        }}
      >
        {kind === "cover" ? (
          <svg
            width={w + 2 * pad}
            height={h + 2 * pad}
            viewBox={`${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`}
            style={{ position: "absolute", left: -pad, top: -pad }}
          >
            <path d={scissorPath(w, h, b, s)} fill={COPY_WHITE} />
          </svg>
        ) : (
          <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, filter: `url(#${cutId})` }}>
            <Img
              src={staticFile(src)}
              style={{ position: "absolute", inset: 0, width: w, height: h, maxWidth: "none", transform: flipX ? "scaleX(-1)" : undefined }}
            />
          </div>
        )}
        {photo}
        {tape.map((t, i) => {
          const p = tapePlacement(t, w, h, s, i);
          return <Tape key={i} x={p.x} y={p.y} len={p.len} width={p.width} angle={p.angle} seed={`${s}-tape${i}`} />;
        })}
      </div>
    </div>
  );
};

// -- the red felt-tip -----------------------------------------------------------------------------
const { fontFamily: markerFamily } = loadMarker("normal", { weights: ["400"], subsets: ["latin"] });
/** The felt-tip hand: Nanum Pen Script thickened by MARKER_STROKE_EM (picked in the probe against Caveat Brush, Gochi Hand,
 * Kalam, Reenie Beanie, Covered By Your Grace, Just Another Hand, Permanent Marker: the others read comic or ballpoint). */
export const MARKER_FONT = markerFamily;
/** The nib family, world px: a ring or line drawn with MarkerPath matches MarkerText at about size / 9. */
export const MARKER_NIB = 13;
/** The hand is a fine pen; a stroke of this many em in the same ink thickens it to the felt tip's nib. */
export const MARKER_STROKE_EM = 0.022;

/** A pen's drawing ease: quick off the mark, a short ease into the lift. */
export const penEase = Easing.bezier(0.42, 0, 0.28, 1);
/** 0..1 drawing progress from `start` over `dur` frames. */
export const penDraw = (frame: number, start: number, dur: number) => interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: penEase });

const MarkerRough: React.FC<{ id: string; scale: number; seed: string }> = ({ id, scale, seed }) => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <filter id={id} colorInterpolationFilters="sRGB" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves={2} seed={seedInt(seed, "mk")} result="mn" />
        <feDisplacementMap in="SourceGraphic" in2="mn" scale={scale} xChannelSelector="R" yChannelSelector="G" result="mw" />
        {/* a felt tip's ink is not even: a faint density variation along the stroke */}
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seedInt(seed, "md")} result="dn" />
        <feColorMatrix in="dn" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.45 0 0 0 0.78" result="dens" />
        <feComposite in="mw" in2="dens" operator="in" />
      </filter>
    </defs>
  </svg>
);

/**
 * The hand's "1" is a bare bar in this font ("100M" reads "IOOM"), so every "1" gets a short flag at the top of its stem, as a
 * hooked hand-written one: a rounded stroke in the text's own ink, inside the glyph's box, so the pen mask, the rough edge and
 * the stroke thickening treat it as part of the letter. `right`: the flag's tip end as a fraction of the glyph's advance from
 * its right side (the stem's middle); the rest in em of the font size (Nanum Pen Script). A "1" after another letter gets
 * `room` em more space so its flag does not touch it. Short and steep, so a tilted "1" never reads as a 7.
 */
export const ONE_FLAG = { right: 0.46, top: 0.215, len: 0.15, weight: 0.058, angle: -52, room: 0.07 };
const OneFlag: React.FC = () => (
  <span
    aria-hidden
    style={{
      position: "absolute",
      right: `${ONE_FLAG.right * 100}%`,
      top: `${ONE_FLAG.top}em`,
      width: `${ONE_FLAG.len}em`,
      height: `${ONE_FLAG.weight}em`,
      borderRadius: `${ONE_FLAG.weight / 2}em`,
      background: "currentColor",
      transform: `rotate(${ONE_FLAG.angle}deg)`,
      transformOrigin: "100% 50%",
    }}
  />
);

/**
 * A real figure written in red felt-tip, ON AN `ink` WipPlane (it multiplies into the paper and any photo under it).
 * (x, y) = the text's centre (anchor "center") or its left middle (anchor "left"), world px. `size` = font size (the
 * hand's x-height is small: 130-170 reads on a phone). Written on left to right by a mask that follows the pen from
 * `start` over `dur` frames (default ~2.2 frames per character); `progress` overrides it. Each letter sits a little off a
 * straight baseline. `rotate` tilts the whole line (a hand writes a degree or two uphill).
 */
export const MarkerText: React.FC<{
  text: string;
  x: number;
  y: number;
  frame: number;
  start: number;
  dur?: number;
  progress?: number;
  size?: number;
  anchor?: "center" | "left";
  rotate?: number;
  seed?: string | number;
  theme?: WipTheme;
}> = ({ text, x, y, frame, start, dur, progress, size = 150, anchor = "center", rotate = -2, seed = text, theme = THEME }) => {
  const id = useFilterId("mtext");
  const chars = [...text];
  const d = dur ?? Math.max(6, Math.round(chars.length * 2.2));
  const p = progress ?? penDraw(frame, start, d);
  if (p <= 0) return null;
  const s = String(seed);
  const soft = 14; // % of the line: the pen's wet edge
  const at = p * (100 + soft) - soft;
  const mask = `linear-gradient(90deg, #000 0%, #000 ${at.toFixed(2)}%, transparent ${(at + soft).toFixed(2)}%)`;
  const ph = random(`${s}-ph`) * 6.28;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${anchor === "center" ? "-50%" : "0"}, -50%) rotate(${rotate}deg)`,
        transformOrigin: anchor === "center" ? "50% 50%" : "0 50%",
        mixBlendMode: "multiply",
        whiteSpace: "nowrap",
      }}
    >
      <MarkerRough id={id} scale={Math.max(1.6, size * 0.018)} seed={s} />
      <div
        style={{
          fontFamily: MARKER_FONT,
          fontSize: size,
          lineHeight: 1,
          color: inkOn(MARKER_RED, theme),
          WebkitTextStroke: `${(size * MARKER_STROKE_EM).toFixed(2)}px ${inkOn(MARKER_RED, theme)}`,
          filter: `url(#${id})`,
          maskImage: p >= 1 ? undefined : mask,
          WebkitMaskImage: p >= 1 ? undefined : mask,
          padding: `${size * 0.08}px ${size * 0.06}px`,
        }}
      >
        {chars.map((c, i) => {
          const wob = Math.sin(i * 1.7 + ph) * size * 0.022 + (random(`${s}-y${i}`) - 0.5) * size * 0.03;
          const rot = (random(`${s}-r${i}`) - 0.5) * 5;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                position: c === "1" ? "relative" : undefined,
                marginLeft: c === "1" && i > 0 ? `${ONE_FLAG.room}em` : undefined,
                transform: `translateY(${wob.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`,
                whiteSpace: "pre",
              }}
            >
              {c}
              {c === "1" ? <OneFlag /> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** The shapes the felt-tip draws, in world px. */
export type MarkerShape =
  /** a loose ring round something: centre, radii, `turns` (1.1-1.25: it overshoots its start), `tilt` deg, `from` start angle (rad, 0 = right, -PI/2 = top) */
  | { kind: "ring"; cx: number; cy: number; rx: number; ry: number; turns?: number; tilt?: number; from?: number; ccw?: boolean }
  /** a quick underline from (x0, y0) to (x1, y1); `bow` = sag as a fraction of its length */
  | { kind: "underline"; x0: number; y0: number; x1: number; y1: number; bow?: number }
  /** a free line through `points` (smoothed), e.g. a falling line on a chart */
  | { kind: "line"; points: [number, number][] }
  /** an arrow from (x0, y0) to its tip (x1, y1), bowed; the head is a second stroke, a V over the tip */
  | { kind: "arrow"; x0: number; y0: number; x1: number; y1: number; bow?: number; head?: number };

type Pt = [number, number];
const bowCurve = (x0: number, y0: number, x1: number, y1: number, bow: number, seed: string): Pt[] => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(8, Math.ceil(len / 3));
  const nx = -(y1 - y0) / (len || 1);
  const ny = (x1 - x0) / (len || 1);
  const ph = random(`${seed}-bw`) * 6.28;
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const sag = bow * len * 4 * u * (1 - u) + Math.sin(u * 9 + ph) * Math.min(2.2, len * 0.004);
    out.push([x0 + (x1 - x0) * u + nx * sag, y0 + (y1 - y0) * u + ny * sag]);
  }
  return out;
};
const catmull = (pts: Pt[]): Pt[] => {
  if (pts.length < 3) return pts;
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

/** The pen's strokes for a shape: one or more polylines, drawn in order (a pen lift between them). */
export const markerStrokes = (shape: MarkerShape, seed: string): Pt[][] => {
  if (shape.kind === "ring") {
    const turns = shape.turns ?? 1.18;
    const tilt = ((shape.tilt ?? -8) * Math.PI) / 180;
    const a0 = shape.from ?? -2.2;
    const dir = shape.ccw === false ? 1 : -1;
    const per = Math.PI * (shape.rx + shape.ry);
    const n = Math.max(40, Math.ceil((per * turns) / 3));
    const [p1, p2] = [random(`${seed}-r1`) * 6.28, random(`${seed}-r2`) * 6.28];
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const th = a0 + dir * Math.PI * 2 * turns * u;
      const rf = 1 + 0.035 * Math.sin(2 * th + p1) + 0.018 * Math.sin(3 * th + p2) + (u - 0.45) * 0.08;
      const ex = Math.cos(th) * shape.rx * rf;
      const ey = Math.sin(th) * shape.ry * rf;
      pts.push([shape.cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), shape.cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)]);
    }
    // the overshoot crosses the start: draw it as its own stroke so the crossing doubles the ink
    const cut = Math.round(n / turns);
    return [pts.slice(0, cut + 1), pts.slice(cut)];
  }
  if (shape.kind === "underline") return [bowCurve(shape.x0, shape.y0, shape.x1, shape.y1, shape.bow ?? 0.035, seed)];
  if (shape.kind === "line") return [catmull(shape.points)];
  const shaft = bowCurve(shape.x0, shape.y0, shape.x1, shape.y1, shape.bow ?? 0.06, seed);
  const k = shaft.length - 1;
  const dx = shaft[k][0] - shaft[k - 2][0];
  const dy = shaft[k][1] - shaft[k - 2][1];
  const dl = Math.hypot(dx, dy) || 1;
  const head = shape.head ?? Math.min(90, Math.max(40, Math.hypot(shape.x1 - shape.x0, shape.y1 - shape.y0) * 0.22));
  const back = Math.atan2(-dy / dl, -dx / dl);
  const sp = 0.5 + (random(`${seed}-hs`) - 0.5) * 0.12;
  const barb = (a: number): Pt => [shape.x1 + Math.cos(back + a) * head, shape.y1 + Math.sin(back + a) * head];
  return [shaft, [...bowCurve(...barb(sp), shape.x1, shape.y1, 0.02, `${seed}-h1`), ...bowCurve(shape.x1, shape.y1, ...barb(-sp * 1.05), -0.02, `${seed}-h2`).slice(1)]];
};

const strokeOutline = (pts: Pt[], upTo: number, total0: number, totalAll: number, nib: number, seed: string) => {
  // the felt tip's pressure: a slow swell and a finer flutter, thinner where it lands and where it lifts
  const [a, b, c] = [random(`${seed}-pa`) * 6.28, random(`${seed}-pb`) * 6.28, random(`${seed}-pc`) * 6.28];
  const hw = (sAll: number) => {
    const n = 0.55 * Math.sin(sAll / 41 + a) + 0.3 * Math.sin(sAll / 13 + b) + 0.15 * Math.sin(sAll / 6.1 + c);
    const land = Math.min(1, 0.6 + (0.4 * (sAll - total0)) / (nib * 1.6));
    const liftOff = Math.min(1, 0.62 + (0.38 * (totalAll - sAll)) / (nib * 2.4));
    return (nib / 2) * (0.86 + 0.14 * n) * Math.max(0.5, land) * Math.max(0.55, liftOff);
  };
  const L: Pt[] = [];
  const R: Pt[] = [];
  let s = total0;
  let tip: Pt = pts[0];
  let tipW = hw(s);
  for (let i = 0; i < pts.length; i++) {
    let p = pts[i];
    if (i > 0) {
      const seg = Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      if (s + seg > upTo) {
        const f = (upTo - s) / (seg || 1);
        p = [pts[i - 1][0] + (p[0] - pts[i - 1][0]) * f, pts[i - 1][1] + (p[1] - pts[i - 1][1]) * f];
        s = upTo;
      } else s += seg;
    }
    const q0 = pts[Math.max(0, i - 1)];
    const q1 = pts[Math.min(pts.length - 1, i + 1)];
    const tl = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
    const nx = -(q1[1] - q0[1]) / tl;
    const ny = (q1[0] - q0[0]) / tl;
    const wv = hw(s);
    L.push([p[0] + nx * wv, p[1] + ny * wv]);
    R.push([p[0] - nx * wv, p[1] - ny * wv]);
    tip = p;
    tipW = wv;
    if (s >= upTo) break;
  }
  const f = (q: Pt) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
  const body = L.length > 1 ? `M${L.map(f).join(" L")} L${R.reverse().map(f).join(" L")} Z` : "";
  return { body, start: pts[0], startW: hw(total0), tip, tipW };
};

/**
 * The red felt-tip drawing a ring, underline, line or arrow by its tip, ON AN `ink` WipPlane. One smooth path per
 * stroke, uneven pressure (width wobble), a rough edge; where the stroke crosses itself (a ring's overshoot, an arrow's
 * head) the ink doubles. Drawn from `start` over `dur` frames on penEase (`progress` overrides). `nib` world px
 * (MARKER_NIB, the family's width; ~10-16).
 */
export const MarkerPath: React.FC<{
  shape: MarkerShape;
  frame: number;
  start: number;
  dur?: number;
  progress?: number;
  nib?: number;
  seed?: string | number;
  theme?: WipTheme;
}> = ({ shape, frame, start, dur = 12, progress, nib = MARKER_NIB, seed = "marker", theme = THEME }) => {
  const id = useFilterId("mpath");
  const p = progress ?? penDraw(frame, start, dur);
  if (p <= 0) return null;
  const s = String(seed);
  const strokes = markerStrokes(shape, s);
  const lens = strokes.map((pts) => pts.reduce((acc, q, i) => (i ? acc + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0));
  const gap = strokes.length > 1 ? nib * 3 : 0; // the pen lift between strokes costs a little time
  const total = lens.reduce((a, b) => a + b, 0) + gap * (strokes.length - 1);
  const reach = p * total;
  const colour = inkOn(MARKER_RED, theme);
  let acc = 0;
  const parts: React.ReactNode[] = [];
  strokes.forEach((pts, i) => {
    const s0 = acc;
    acc += lens[i];
    if (reach > s0) {
      const o = strokeOutline(pts, Math.min(reach, acc), s0, acc, nib, `${s}-${i}`);
      parts.push(
        <g key={i} opacity={0.9}>
          {o.body ? <path d={o.body} /> : null}
          <circle cx={o.start[0]} cy={o.start[1]} r={o.startW} />
          <circle cx={o.tip[0]} cy={o.tip[1]} r={o.tipW} />
        </g>,
      );
    }
    acc += gap;
  });
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", mixBlendMode: "multiply" }}>
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves={2} seed={seedInt(s, "mp")} result="mn" />
          <feDisplacementMap in="SourceGraphic" in2="mn" scale={Math.max(1.6, nib * 0.2)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g fill={colour} filter={`url(#${id})`}>
        {parts}
      </g>
    </svg>
  );
};

// -- the mono label -------------------------------------------------------------------------------
/**
 * A small mono label (a name, a year), mixed case, ink colour, weight 300-400. (x, y) = its left top (align "left") or top
 * centre (align "center"), world px. Slides up while fading in from `start` (textRise). Never the spoken line.
 */
export const MonoLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  frame: number;
  start: number;
  size?: number;
  weight?: 300 | 400;
  align?: "left" | "center";
  color?: string;
}> = ({ text, x, y, frame, start, size = 34, weight = 400, align = "left", color = INK }) => (
  <div
    style={{
      position: "absolute",
      left: align === "center" ? x - 600 : x,
      top: y,
      width: align === "center" ? 1200 : undefined,
      textAlign: align,
      whiteSpace: "nowrap",
      fontFamily: MONO,
      fontWeight: weight,
      fontSize: size,
      letterSpacing: -0.2,
      color,
      ...textRise(frame, start),
    }}
  >
    {text}
  </div>
);
