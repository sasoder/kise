// ---------------------------------------------------------------------------
// ideasPath — cut 26's own pieces (SmallNumberOfIdeasAway, sam-macintosh-moment): the world layout (the Dots group,
// the three stepping stones, the crowd's long slot), the stone (a dashed, not-yet-built tile with a lightbulb), the
// camera and the light pool. The people (Bust), the crowd specs (CROWD) and the Dots tile (DotsMark) come from the
// clip's shared world (macintoshShared.tsx, owned by cut 16; read-only here).
//
// WORLD: world px = the resolved frame's screen px at k = 1 (camera centre 540, 960). Every y below is a world y.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import {
  COLOR,
  BLOOM_LAYERS,
  clamp01,
  lerp,
  mixHex,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import {
  GLYPH_STROKE,
  TILE,
  makeClockCam,
  makePoolTrack,
} from "../kits/cheeky-pint/museShared";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `ip${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ---------------------------------------------------------------------------
// LAYOUT (world px = the resolved frame's screen px)
// ---------------------------------------------------------------------------
/** The Dots tile: centre x, its floor (bottom edge), its size. Its group spans y ~295-520. */
export const DOTS = { x: 460, floor: 520, size: 225 } as const;
/** People: one head radius for Dots's few and the crowd. */
export const HEAD_R = 54;
/** The Dots group's few people: offsets from the tile's centre (they stand on its floor, close beside it, pairs
 *  overlapping a little); the whole group (x ~69-851) sits inside the resolved frame with >= 40 px margins. */
export const FEW = [-306, -178, 178, 306] as const;
/** The three stones: equal, evenly spaced, one diagonal down to the right across y ~576-876. */
export const STONE = { size: 140, x0: 440, y0: 646, dx: 175, dy: 80 } as const;
export const STONES = [0, 1, 2].map((i) => ({
  x: STONE.x0 + i * STONE.dx,
  y: STONE.y0 + i * STONE.dy,
}));
/** The mainstream: ONE long row of busts, shoulders overlapping (~13-14 across the frame), running off both edges;
 *  heads centred on `headY` (hair ~904, chins ~1016), bodies running down off the bottom of the frame. Before its
 *  line it waits `drop` lower, fully below the frame's bottom edge until ~f60 at every camera state (no sliver). */
export const CROWD_ROW = {
  headY: 962,
  pitch: 80,
  x0: -460,
  n: 27,
  drop: 720,
  focus: STONES[2].x,
} as const;
export const CROWD_X = Array.from(
  { length: CROWD_ROW.n },
  (_, i) => CROWD_ROW.x0 + i * CROWD_ROW.pitch,
);
/** a fixed height variation along the row (world px): the shoulder humps step, so it reads as people, not a frieze */
export const CROWD_DY = CROWD_X.map(
  (_, i) => [0, -13, 8, -5, 14, -10, 3, -14, 10, -3, 12][i % 11],
);

// ---------------------------------------------------------------------------
// TIMING (frames from the composition's start)
// ---------------------------------------------------------------------------
/** "small number": each stone is lit as the light reaches it (f31 / 37 / 43), over 8 f, from the ground's own tone
 *  (unseen: FAINT = 0, nothing drawn before its light) to cream lo. A faint pre-drawn ghost read as a flickering
 *  placeholder under the moving pool (director review 2). */
export const FAINT = 0;
export const LIT_F = [31, 37, 43] as const;
export const LIT_FRAMES = 8;
/** "ideas": their bulbs warm to amber, the nearest first (f55 / 58 / 61), over 10 f. */
export const WARM_F = [55, 58, 61] as const;
export const WARM_FRAMES = 10;
/** The Dots tile settles onto the board over the first frames. */
export const SETTLE = { f0: -6, f1: 12 } as const;
/** "away ... from a super mainstream": the crowd rises up from below the frame into the light, a wave from the path's
 *  end out to both edges (start = f0 + spread x |x - focus| / reach), each over `each` frames: it comes up dim and
 *  takes the light over the second half of its rise, landing f85 .. f90, just after "mainstream" (f86). */
export const RISE = {
  f0: 60,
  spread: 5,
  reach: 640,
  each: 25,
  dark: 1,
} as const;
const waveDelay = (x: number) =>
  RISE.spread * Math.min(1, Math.abs(x - CROWD_ROW.focus) / RISE.reach);
export const riseStart = (x: number) => RISE.f0 + waveDelay(x);

// ---------------------------------------------------------------------------
// CAMERA + POOL
// ---------------------------------------------------------------------------
/** f0: tight on the Dots tile (~430 px wide, centred at y ~780) and its few people, already gliding back and down.
 *  f~44 (the third stone lights): k ~1.3, the path centred, every stone above the caption band. f~98: the resolved
 *  wide (k 1); then a slow creep in. */
export const K_OPEN = 2.0;
/** where the Dots tile's centre sits on screen at f0 (before the pre-roll's glide) */
const OPEN_SY = 830;
const OPEN = {
  x: DOTS.x,
  y: DOTS.floor - DOTS.size / 2 - (OPEN_SY - 960) / K_OPEN,
  k: K_OPEN,
};
const MID = { x: 520, y: 812, k: 1.27 };
const END = { x: 540, y: 960, k: 1.0 };
export const CAM = makeClockCam(
  OPEN,
  [
    { f0: -16, f1: 50, dx: MID.x - OPEN.x, dy: MID.y - OPEN.y, k: MID.k },
    { f0: 40, f1: 98, dx: END.x - MID.x, dy: END.y - MID.y, k: END.k },
    // the living hold: a slow creep in on the resolved picture
    { f0: 80, f1: 150, dy: -4, k: 1.035 },
  ],
  120,
);
export const POOL_AT = makePoolTrack(
  { x: DOTS.x, y: DOTS.floor - 110, strength: 1.5 },
  [
    { f0: 24, f1: 50, x: 615, y: 720, strength: 1.6 },
    { f0: 64, f1: 96, x: 620, y: 940, strength: 2.0 },
  ],
  120,
);

// ---------------------------------------------------------------------------
// THE STONE: a stepping-stone tile not built yet — a dashed outline drawn on the board (no card, no shadow),
// a lightbulb glyph inside (Lucide "lightbulb", ISC, at the house glyph weight), its glass warming to amber.
// ---------------------------------------------------------------------------
/** Lucide "lightbulb" (24 box): the glass (closed), the two base lines. */
const BULB_GLASS =
  "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5Z";
const BULB_BASE = ["M9 18h6", "M10 22h4"];
/** The glyph's optical box inside the stone (as GlyphMark sizes a glyph on its tile). */
const BULB_FILL = 0.74;
/** Dashes: n per side, a dash at each corner (the two sides' corner dashes meet as an L). World px at size 110. */
const DASH = { n: 4, w: 5.2 } as const;

const bloomAt = (k: number, a: number) =>
  BLOOM_LAYERS.map(
    (l) =>
      `drop-shadow(0 0 ${f3(l.blur / k)}px ${l.color.replace(/,([\d.]+)\)$/, (_m, v: string) => `,${f3(parseFloat(v) * a)})`)})`,
  ).join(" ");

/**
 * Stone — centred on (x, y), `size` wide. `lit` 0..1: from dark (the board's own tone, unseen) to drawn (cream lo, the
 * outline of a tile that is not built yet). `warm` 0..1: the bulb's glass from empty to amber, with the fixed bloom
 * coming up with it. `band` = amberBandFor(cam).
 */
export const Stone: React.FC<{
  x: number;
  y: number;
  size?: number;
  k: number;
  lit: number;
  warm: number;
  band: [number, number];
}> = ({ x, y, size = STONE.size, k, lit, warm, band }) => {
  const uid = uidOf(useId());
  const L = clamp01(lit);
  const W = clamp01(warm);
  if (L <= 0.001) return null;
  // dark -> cream lo, by tone (the unlit stone is the ground's own colour)
  const line = mixHex(COLOR.ground, COLOR.inkCreamLo, L);
  const s = size / STONE.size;
  const sw = DASH.w * s;
  const h = size / 2;
  // per side: n dashes of length d and n - 1 gaps of g, corner to corner (round caps add sw / 2 at each end)
  const d = size * 0.13;
  const g = (size - DASH.n * d) / (DASH.n - 1);
  const sides = [
    `M${f3(x - h)} ${f3(y - h)}H${f3(x + h)}`,
    `M${f3(x + h)} ${f3(y - h)}V${f3(y + h)}`,
    `M${f3(x + h)} ${f3(y + h)}H${f3(x - h)}`,
    `M${f3(x - h)} ${f3(y + h)}V${f3(y - h)}`,
  ];
  // the bulb glyph: GlyphMark's sizing (a 24-unit box, the house stroke)
  const gsz = size * 0.86;
  const sc = (gsz * BULB_FILL) / 20;
  const gsw = (GLYPH_STROKE * gsz) / TILE / sc;
  const tf = `translate(${fx(x - 12 * sc)} ${fx(y - 12.4 * sc)}) scale(${fx(sc)})`;
  const glassTop = y - 12.4 * sc + 2 * sc;
  const glassBot = y - 12.4 * sc + 14 * sc;
  void band;
  // the glass: amberTop -> amberFoot over the bulb itself (outline and fill one amber body), a thin hot top edge
  const glassStroke = mixHex(line, COLOR.amberTop, W);
  return (
    <g>
      <defs>
        <linearGradient
          id={`${uid}a`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f3(glassTop)}
          x2="0"
          y2={f3(glassBot)}
        >
          <stop
            offset="0"
            stopColor={mixHex(COLOR.ground, COLOR.amberTop, W)}
          />
          <stop
            offset="1"
            stopColor={mixHex(COLOR.ground, COLOR.amberFoot, W)}
          />
        </linearGradient>
        <linearGradient
          id={`${uid}s`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f3(glassTop)}
          x2="0"
          y2={f3(glassBot)}
        >
          <stop offset="0" stopColor={glassStroke} />
          <stop offset="1" stopColor={mixHex(line, COLOR.amberFoot, W)} />
        </linearGradient>
        <clipPath id={`${uid}h`}>
          {/* glyph units: only the outer half of the outline's crown */}
          <rect x={0} y={-4} width={24} height={6} />
        </clipPath>
      </defs>
      <g
        fill="none"
        stroke={line}
        strokeWidth={f3(sw)}
        strokeLinecap="round"
        strokeDasharray={`${f3(d)} ${f3(g)}`}
      >
        {sides.map((p, i) => (
          <path key={i} d={p} />
        ))}
      </g>
      <g
        transform={tf}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={f3(gsw)}
      >
        <g style={W > 0.01 ? { filter: bloomAt(k, 0.55 * W) } : undefined}>
          <path
            d={BULB_GLASS}
            fill={W > 0.002 ? `url(#${uid}a)` : "none"}
            stroke={W > 0.002 ? `url(#${uid}s)` : line}
          />
        </g>
        {W > 0.002 ? (
          <path
            d={BULB_GLASS}
            fill="none"
            stroke={COLOR.amberHot}
            strokeOpacity={f3(W)}
            clipPath={`url(#${uid}h)`}
          />
        ) : null}
        {BULB_BASE.map((p, i) => (
          <path key={i} d={p} fill="none" stroke={line} />
        ))}
      </g>
    </g>
  );
};

/** A crowd bust's state at frame f: how far below its place (1 = the full drop), how dark (0 = lit), its bob. */
export const crowdAt = (x: number, i: number, f: number) => {
  const u = (f - riseStart(x)) / RISE.each;
  const rise = smoothstep(u);
  const tone = smoothstep((u - 0.4) / 0.55);
  // a tiny slow bob once risen (each bust its own phase and rate)
  const ph = (i * 2.399) % (2 * Math.PI);
  const rate = 0.11 + (0.03 * ((i * 7) % 5)) / 4;
  const bob =
    3 *
    smoothstep((f - riseStart(x) - RISE.each) / 10) *
    Math.sin(f * rate + ph);
  return { sink: 1 - rise, dark: lerp(RISE.dark, 0, tone), bob };
};

export { smoothstep };
