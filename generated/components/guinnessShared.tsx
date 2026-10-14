// GUINNESS_SHARED_READY
import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import type { Cam } from "./outgrowShared";
import { COLOR, ElevationShadow, STROKE, StoutStage, bloomFilter, clamp01, mixHex, type Elevation } from "./stoutShared";

// ===========================================================================
// guinnessShared — the vocabulary of the Cheeky Pint S4E02 clip "will - guinness invented the t-test"
// (Will O'Brien), in the stout system (stoutShared.tsx: every colour, stroke, shadow and bloom below is one
// of its tokens; palette B1).
//
//   HopCone   a hop cone (Humulus lupulus strobile) seen from the side: an elongated ovoid of papery,
//             pointed bracts in staggered rows (four ranks: a row with one bract facing you and two in
//             profile at the edges, then a row with two bracts side by side), the upper rows overlapping
//             the lower like shingles, a short stem at the top, optionally one small leaf. Card material
//             lit by the stout key (above, slightly left): every bract is a TONE STEP (the shadowed band
//             where the bract above overlaps it, then its lit face), the left of the cone lighter than the
//             right, the top lighter than the foot; a thin edge line in a deep tone of the same colour on
//             each bract's free edge (it fades out below ~40 screen px so a small hop is pure tone).
//             No filters inside it: hundreds can be drawn per frame.
//   TONES     amber = the stout amber band (the good hops, the product; bloom it per GROUP with
//             bloomFilter(k) — or `glow` on a single big one); kraft = the dimmed board tone (spent /
//             context); cream = card.
//   hopSilhouette()  the cone's outline as ONE world path (for a union shadow of a heap: pass many to
//             one ElevationShadow).
//
// THE GEOMETRY is built once at module load in a unit box (HOP_UNIT tall, centred on 0,0) and placed with
// one transform per hop, so a hop costs ~45 short paths and no defs.
// ===========================================================================

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();

// --- the unit cone ----------------------------------------------------------------------------------
/** The unit box's height (the cone + stem); width = HOP_ASPECT x height. */
export const HOP_UNIT = 1000;
const STEM_TOP = -500; // the stem's cut end (unit y; the box is centred on 0)
const BODY_TOP = -405; // where the bracts close over the strig
const BODY_BOT = 500; // the bottom bract's tip
const BODY_L = BODY_BOT - BODY_TOP;
const R_MAX = 268; // the body's widest half-width (unit px), before the bracts flare
const FLARE = 0.17; // how far a bract's free tip stands off the body (of r)
/** The body's half-width at t (0 = top, 1 = the bottom tip): a blunt top, widest a little above the
 *  middle, a rounded point at the foot. */
const radiusAt = (t: number) => {
  const u = clamp01(t);
  return R_MAX * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.86)), 0.62) * (1 - 0.1 * u);
};
const yOf = (t: number) => BODY_TOP + t * BODY_L;

/** Bract rows (tip t), top to bottom; alternate rows are turned 45 deg (four ranks). */
const ROWS = 6;
const TIP0 = 0.27; // the top row's tips
const ROW_STEP = (1 - TIP0) / (ROWS - 1);
const BRACT_H = 0.34; // a bract's length (t): it runs up under the row above
const HALF_SPAN = (56 * Math.PI) / 180; // a bract wraps 112 deg of the body (neighbours overlap)
const RISE = 0.78; // how far up the free edge climbs at the bract's sides (of its length)
const SAMPLES = 15;

type Pt = [number, number];
type Bract = {
  row: number;
  theta: number; // the bract's centre angle (0 = facing us; - = the left, lit side)
  depth: number; // cos(theta): draw order within a row and the lateral light
  outline: Pt[]; // the whole bract (unit px)
  face: Pt[]; // its lit face: the free part below the overlap of the row above
  edge: Pt[]; // its free edge (the line)
  midT: number; // where it sits on the body (for the top-to-foot tone)
};

/** Project a point on the bract (angle phi, body position t, flare f) to the side view. */
const proj = (phi: number, t: number, flare: number): Pt => {
  const p = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, phi));
  return [radiusAt(t) * (1 + flare) * Math.sin(p), yOf(t)];
};
const edgeT = (tipT: number, s: number) => tipT - BRACT_H * RISE * Math.pow(Math.abs(s), 1.4);
const flareAt = (tipT: number, t: number) => FLARE * clamp01(1 - (tipT - t) / (BRACT_H * 0.9));

const makeBract = (row: number, theta: number): Bract => {
  const tipT = Math.min(1, TIP0 + row * ROW_STEP);
  const topT = tipT - BRACT_H;
  const edge: Pt[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const s = -1 + (2 * i) / SAMPLES;
    const t = edgeT(tipT, s);
    edge.push(proj(theta + s * HALF_SPAN, t, flareAt(tipT, t)));
  }
  const top: Pt[] = [];
  for (let i = SAMPLES; i >= 0; i--) {
    const s = -1 + (2 * i) / SAMPLES;
    top.push(proj(theta + s * HALF_SPAN, Math.max(0, topT), 0));
  }
  // the lit face: a petal inside the bract, scaled toward its tip and shifted to the lit (left) side; its
  // top is hidden under the row above, so what shows is a lighter tongue down the bract's middle
  const tip = proj(theta, tipT, flareAt(tipT, tipT));
  const face: Pt[] = [...edge, ...top].map(([px, py]) => [tip[0] + (px - tip[0]) * 0.62 - 0.05 * R_MAX * Math.cos(theta), tip[1] + (py - tip[1]) * 0.8 - 0.035 * BODY_L * BRACT_H] as Pt);
  return { row, theta, depth: Math.cos(theta), outline: [...edge, ...top], face, edge, midT: tipT - BRACT_H * 0.4 };
};

/** Every bract, in draw order: the bottom row first (each row overlaps the one below), back to front. */
const BRACTS: Bract[] = (() => {
  const out: Bract[] = [];
  for (let row = ROWS - 1; row >= 0; row--) {
    // the bottom row faces us (one bract closes the tip); rows alternate up from there
    const list = (ROWS - 1 - row) % 2 === 0 ? [-Math.PI / 2, Math.PI / 2, 0] : [-Math.PI / 4, Math.PI / 4];
    list
      .map((th) => makeBract(row, th))
      .sort((a, b) => a.depth - b.depth)
      .forEach((b) => out.push(b));
  }
  return out;
})();

const pathOf = (pts: Pt[], close = true) =>
  pts.map((p, i) => `${i ? "L" : "M"}${f2(p[0])} ${f2(p[1])}`).join("") + (close ? "Z" : "");
/** Smooth open polyline (quadratic midpoints): the edge lines. */
const smoothOf = (pts: Pt[]) => {
  let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${f2(pts[i][0])} ${f2(pts[i][1])} ${f2(mx)} ${f2(my)}`;
  }
  const L = pts[pts.length - 1];
  return d + `L${f2(L[0])} ${f2(L[1])}`;
};
/** Closed smooth path through points (for bract bodies: no polygon facets at 192 px). */
const smoothClosed = (pts: Pt[]) => {
  const n = pts.length;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f2(m0[0])} ${f2(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${f2(pts[i][0])} ${f2(pts[i][1])} ${f2(m[0])} ${f2(m[1])}`;
  }
  return d + "Z";
};

// the stem: a short tapered stalk curving a little to the right, its cut end square with soft corners
const STEM: Pt[] = [
  [-26, BODY_TOP + 40],
  [-22, BODY_TOP - 20],
  [-12, STEM_TOP + 30],
  [-4, STEM_TOP + 4],
  [6, STEM_TOP],
  [24, STEM_TOP + 6],
  [26, STEM_TOP + 30],
  [20, BODY_TOP - 20],
  [26, BODY_TOP + 40],
];
// the optional leaf: one small pointed leaf off the stem, to the right, with a midrib
const LEAF: Pt[] = [
  [18, STEM_TOP + 56],
  [70, STEM_TOP - 6],
  [150, STEM_TOP - 30],
  [232, STEM_TOP + 2],
  [150, STEM_TOP + 58],
  [76, STEM_TOP + 74],
];
const LEAF_RIB: Pt[] = [
  [24, STEM_TOP + 54],
  [110, STEM_TOP + 26],
  [214, STEM_TOP + 6],
];

const BRACT_D = BRACTS.map((b) => ({ ...b, dOutline: smoothClosed(b.outline), dFace: smoothClosed(b.face), dEdge: smoothOf(b.edge) }));
/** The bracts grouped by row, bottom row first (the draw order). */
const ROW_D = (() => {
  const out: (typeof BRACT_D)[] = [];
  for (const b of BRACT_D) {
    const last = out[out.length - 1];
    if (last && last[0].row === b.row) last.push(b);
    else out.push([b]);
  }
  return out;
})();
const STEM_D = smoothClosed(STEM);
const LEAF_D = smoothClosed(LEAF);
const LEAF_RIB_D = smoothOf(LEAF_RIB);
/** The cone's silhouette in unit px (bract outlines' union is approximated by its envelope + the stem). */
const ENVELOPE: Pt[] = (() => {
  const right: Pt[] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const y = BODY_TOP + 10 + ((BODY_BOT - BODY_TOP - 10) * i) / N;
    let xm = 0;
    for (const b of BRACTS) {
      const pts = b.outline;
      for (let j = 0; j < pts.length; j++) {
        const a = pts[j];
        const c = pts[(j + 1) % pts.length];
        if ((a[1] - y) * (c[1] - y) <= 0 && a[1] !== c[1]) {
          const x = a[0] + ((y - a[1]) / (c[1] - a[1])) * (c[0] - a[0]);
          xm = Math.max(xm, Math.abs(x));
        }
      }
    }
    right.push([xm, y]);
  }
  const left = right.map(([x, y]) => [-x, y] as Pt).reverse();
  return [[-24, STEM_TOP + 20], [24, STEM_TOP + 20], ...right, ...left];
})();
const ENVELOPE_D = pathOf(ENVELOPE);
/** The body alone (no stem), a little inside the bracts' outer tips. */
const ENVELOPE_BODY_D = smoothClosed(ENVELOPE.slice(2).map(([px, py]) => [px * 0.97, py] as Pt));
const HALF_W = Math.max(...ENVELOPE.map((p) => Math.abs(p[0])), 0);

/** The cone's width / height (the whole glyph box, without the optional leaf). */
export const HOP_ASPECT = (2 * HALF_W) / HOP_UNIT;
/** Where the cone's body centre sits in the box (of size, from the box centre; + = down). */
export const HOP_BODY_CY = (BODY_TOP + BODY_BOT) / 2 / HOP_UNIT;

// --- tones ------------------------------------------------------------------------------------------
export type HopTone = "amber" | "kraft" | "cream";
type ToneSet = { top: string; foot: string; shade: string; lit: string; line: string; stem: string };
/** The three materials' tone steps (all from stoutShared COLOR). */
export const HOP_TONES: Record<HopTone, ToneSet> = {
  amber: {
    top: COLOR.amberTop,
    foot: COLOR.amberFoot,
    shade: mixHex(COLOR.amberFoot, COLOR.rung, 0.42),
    lit: mixHex(COLOR.amberTop, COLOR.amberHot, 0.34),
    line: COLOR.rung,
    stem: mixHex(COLOR.amberFoot, COLOR.rung, 0.62),
  },
  kraft: {
    top: COLOR.board,
    foot: COLOR.boardFoot,
    shade: mixHex(COLOR.boardFoot, COLOR.shadow, 0.24),
    lit: mixHex(COLOR.board, COLOR.cream, 0.16),
    line: mixHex(COLOR.boardFoot, COLOR.inkDark, 0.5),
    stem: mixHex(COLOR.boardFoot, COLOR.inkDark, 0.3),
  },
  cream: {
    top: COLOR.cream,
    foot: COLOR.creamFoot,
    shade: mixHex(COLOR.creamFoot, COLOR.board, 0.5),
    lit: mixHex(COLOR.cream, COLOR.edge, 0.4),
    line: mixHex(COLOR.creamFoot, COLOR.inkDark, 0.42),
    stem: mixHex(COLOR.creamFoot, COLOR.board, 0.75),
  },
};
const mixTones = (a: ToneSet, b: ToneSet, t: number): ToneSet => ({
  top: mixHex(a.top, b.top, t),
  foot: mixHex(a.foot, b.foot, t),
  shade: mixHex(a.shade, b.shade, t),
  lit: mixHex(a.lit, b.lit, t),
  line: mixHex(a.line, b.line, t),
  stem: mixHex(a.stem, b.stem, t),
});
/** The key light's direction across the body (rad, - = from the left). */
const LIGHT = -0.62;
/** Per bract: its shadowed band and its lit face, from the body's top-to-foot tone and the side light. */
const bractColors = (ts: ToneSet, b: Bract) => {
  const vert = mixHex(ts.top, ts.foot, clamp01(b.midT * 1.05));
  const side = Math.cos(b.theta - LIGHT); // 1 = facing the key, ~0.2 = the far (right) profile
  const body = side > 0.75 ? mixHex(vert, ts.lit, (side - 0.75) * 1.2) : mixHex(vert, ts.shade, (0.75 - side) * 0.75);
  const face = mixHex(body, ts.lit, 0.18 + 0.42 * clamp01(side));
  return { body, face };
};
/** The shadow a row casts on the row below (unit px offset, the key from above-left) and its strength. */
const CAST = { dx: 6, dy: 18, a: 0.24 } as const;

// --- the component ----------------------------------------------------------------------------------
export type HopConeProps = {
  /** the glyph box's centre (world px) */
  x: number;
  y: number;
  /** height of the whole glyph (cone + stem), world px */
  size: number;
  tone?: HopTone;
  /** a change of state BY TONE: `toTone` mixed in by `mix` 0..1 (drive it eased over ~12 f) */
  toTone?: HopTone;
  mix?: number;
  /** degrees, about the box centre (0 = stem up) */
  rotate?: number;
  /** mirror left-right (variety in a heap; the light stays baked from the left, so use sparingly) */
  flip?: boolean;
  /** its own stout shadow at `elevation` (default off: a heap draws ONE union shadow via hopSilhouette) */
  shadow?: boolean;
  elevation?: Elevation;
  lift?: number;
  /** one small leaf off the stem */
  leaf?: boolean;
  /** the camera's k (for the edge lines' screen weight; default 1) */
  k?: number;
  /** bloom this one hop (amber; a big single hop only — bloom heaps per group with bloomFilter(k)) */
  glow?: boolean;
};

/**
 * HopCone — one hop cone (see the header). (x, y) is the centre of its box (HOP_ASPECT * size wide,
 * size tall); `rotate` turns it about that centre.
 */
export const HopCone: React.FC<HopConeProps> = ({
  x,
  y,
  size,
  tone = "amber",
  toTone,
  mix = 0,
  rotate = 0,
  flip = false,
  shadow = false,
  elevation = "rest",
  lift = 0,
  leaf = false,
  k = 1,
  glow = false,
}) => {
  const ts = toTone && mix > 0 ? mixTones(HOP_TONES[tone], HOP_TONES[toTone], clamp01(mix)) : HOP_TONES[tone];
  const sc = size / HOP_UNIT;
  const screen = size * k;
  // the edge lines: the house hairline in screen px, fading out as the hop gets small (pure tone below ~36 px)
  const lineA = clamp01((screen - 34) / 40);
  const lineW = Math.min(STROKE.HAIRLINE / k, size * 0.014) / sc;
  const stemW = Math.max(1, Math.min(1.8, 70 / Math.max(1, screen)));
  const uid = `hop${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const tf = `translate(${fx(x)} ${fx(y)}) rotate(${fx(rotate)}) scale(${fx(flip ? -sc : sc)} ${fx(sc)})`;
  const body = (
    <g transform={tf}>
      <defs>
        {/* userSpaceOnUse in the hop's own (unit) space: the cast shadows' translate is undone by the clip's */}
        <clipPath id={uid}>
          <path d={ENVELOPE_BODY_D} transform={`translate(${-CAST.dx} ${-CAST.dy})`} />
        </clipPath>
      </defs>
      {leaf ? (
        <>
          <path d={LEAF_D} fill={mixHex(ts.foot, ts.shade, 0.3)} />
          {lineA > 0 ? <path d={LEAF_RIB_D} fill="none" stroke={ts.line} strokeOpacity={0.7 * lineA} strokeWidth={f2(lineW)} strokeLinecap="round" /> : null}
        </>
      ) : null}
      {/* the stem keeps a readable width on a small hop (thickened up to 1.8x below ~70 screen px) */}
      <path d={STEM_D} fill={ts.stem} transform={stemW > 1 ? `scale(${fx(stemW)} 1)` : undefined} />
      {/* the body under the bracts (so no gap between two bracts ever shows the ground) */}
      <path d={ENVELOPE_BODY_D} fill={ts.shade} />
      {ROW_D.map((row, ri) => (
        <g key={ri}>
          {/* the shadow this row casts on the row below: a tone step, clipped to the cone */}
          {ri > 0 ? (
            <g clipPath={`url(#${uid})`} transform={`translate(${CAST.dx} ${CAST.dy})`} fill={COLOR.shadow} fillOpacity={CAST.a}>
              {row.map((b, i) => (
                <path key={i} d={b.dOutline} />
              ))}
            </g>
          ) : null}
          {row.map((b, i) => {
            const c = bractColors(ts, b);
            return (
              <g key={i}>
                <path d={b.dOutline} fill={c.body} />
                <path d={b.dFace} fill={c.face} />
                {lineA > 0 ? <path d={b.dEdge} fill="none" stroke={ts.line} strokeOpacity={f2(0.78 * lineA)} strokeWidth={f2(lineW)} strokeLinecap="round" /> : null}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
  return (
    <g>
      {shadow ? <ElevationShadow silhouette={[{ d: hopSilhouette(x, y, size, rotate, flip) }]} elevation={elevation} lift={lift} /> : null}
      {glow ? <g style={{ filter: bloomFilter(k) }}>{body}</g> : body}
    </g>
  );
};

/** The lite body: the envelope a little inside, shifted toward the key (its lit side) — for HopConeLite. */
const LITE_FACE_D = smoothClosed(ENVELOPE.slice(2).map(([px, py]) => [px * 0.7 - 34, py * 0.8 - 40] as Pt));
/**
 * HopConeLite — the same hop for tiny sizes (under ~18 screen px, where HopCone's bracts are a pixel or two):
 * three paths, the same silhouette, stem and average tones (shade body, lit face up and to the left).
 * Same props as HopCone except the edge lines, shadow and leaf. Use it per hop below a screen size (dither the
 * switch per hop over a few px so a zoom never switches a whole field on one frame).
 */
export const HopConeLite: React.FC<Pick<HopConeProps, "x" | "y" | "size" | "tone" | "toTone" | "mix" | "rotate" | "flip" | "k">> = ({
  x,
  y,
  size,
  tone = "amber",
  toTone,
  mix = 0,
  rotate = 0,
  flip = false,
  k = 1,
}) => {
  const ts = toTone && mix > 0 ? mixTones(HOP_TONES[tone], HOP_TONES[toTone], clamp01(mix)) : HOP_TONES[tone];
  const sc = size / HOP_UNIT;
  const stemW = Math.max(1, Math.min(1.8, 70 / Math.max(1, size * k)));
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) rotate(${fx(rotate)}) scale(${fx(flip ? -sc : sc)} ${fx(sc)})`}>
      <path d={STEM_D} fill={ts.stem} transform={`scale(${fx(stemW)} 1)`} />
      <path d={ENVELOPE_BODY_D} fill={mixHex(ts.foot, ts.shade, 0.45)} />
      <path d={LITE_FACE_D} fill={mixHex(ts.top, ts.foot, 0.35)} />
    </g>
  );
};

/** The cone's outline as ONE world path (a hop at x, y, size, rotate): pass many to one ElevationShadow
 *  for a heap's union shadow. */
export const hopSilhouette = (x: number, y: number, size: number, rotate = 0, flip = false) => {
  const sc = size / HOP_UNIT;
  const a = (rotate * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  return pathOf(
    ENVELOPE.map(([u, v]) => {
      const px = (flip ? -u : u) * sc;
      const py = v * sc;
      return [x + px * ca - py * sa, y + px * sa + py * ca] as Pt;
    }),
  );
};
/** The unit silhouette path (for clip paths in a unit transform). */
export const HOP_ENVELOPE_D = ENVELOPE_D;

// ===========================================================================
// THE STYLE FRAME (a still; registered by src/Root.HundredsOfHops.tsx as "HopStyleFrame"): the hop at
// 24 / 48 / 96 / 192 px in all three tones, plus the in-between states a cut uses.
// ===========================================================================
export const HopStyleFrame: React.FC = () => {
  const cam: Cam = { x: 540, y: 960, k: 1 };
  const k = cam.k;
  const tones: HopTone[] = ["amber", "kraft", "cream"];
  const sizes = [24, 48, 96, 192];
  const colX = [220, 540, 860];
  const rowY = [250, 380, 590, 950];
  return (
    <AbsoluteFill>
      <StoutStage S={0} cam={cam} pool={{ x: 540, y: 800 }} sway={false}>
        {tones.map((t, ci) =>
          sizes.map((s, ri) => (
            <g key={`${t}${s}`} style={t === "amber" ? { filter: bloomFilter(k) } : undefined}>
              <HopCone x={colX[ci]} y={rowY[ri]} size={s} tone={t} k={k} shadow={s >= 48} leaf={s === 192 && ci === 0} />
            </g>
          )),
        )}
        {/* a tone change half way (amber -> kraft), rotations, a small heap with one union shadow */}
        <g style={{ filter: bloomFilter(k) }}>
          <HopCone x={150} y={1300} size={120} tone="amber" k={k} rotate={-24} shadow />
        </g>
        <HopCone x={330} y={1300} size={120} tone="amber" toTone="kraft" mix={0.5} k={k} rotate={12} shadow />
        <HopCone x={480} y={1300} size={120} tone="kraft" k={k} rotate={90} shadow />
        {(() => {
          const heap: { x: number; y: number; r: number }[] = [];
          for (let row = 0; row < 4; row++) {
            const n = 7 - row;
            for (let i = 0; i < n; i++) heap.push({ x: 640 + (i - (n - 1) / 2) * 44 + 80, y: 1360 - row * 34, r: ((i * 37 + row * 53) % 70) - 35 });
          }
          return (
            <g>
              <ElevationShadow silhouette={heap.map((h) => ({ d: hopSilhouette(h.x, h.y, 56, h.r) }))} elevation="rest" />
              <g style={{ filter: bloomFilter(k) }}>
                {heap.map((h, i) => (
                  <HopCone key={i} x={h.x} y={h.y} size={56} tone="amber" rotate={h.r} k={k} />
                ))}
              </g>
            </g>
          );
        })()}
        {/* tiny hops in a row (stream scale) */}
        {Array.from({ length: 12 }).map((_, i) => (
          <g key={i} style={i < 6 ? { filter: bloomFilter(k) } : undefined}>
            <HopCone x={110 + i * 78} y={1560} size={30} tone={i < 6 ? "amber" : "kraft"} rotate={i * 30} k={k} />
          </g>
        ))}
      </StoutStage>
    </AbsoluteFill>
  );
};
