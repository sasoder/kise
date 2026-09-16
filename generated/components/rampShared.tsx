// SHARED_READY
import React from "react";
import outlineJson from "../../public/us-solar/us_outline_z6.json";
import { CAM_LIFT, clamp01, hash } from "./fieldShared";
import {
  COIN_DOLLAR,
  COIN_GRAD_HI,
  COIN_GRAD_LO,
  TILE_GRAD_BOTTOM,
  TILE_GRAD_TOP,
  TILE_SHADOW,
} from "./d1Shared";

// ---------------------------------------------------------------------------
// rampShared — the ONE WORLD of the Eric Glyman / Ramp clip ("the 98 percent of
// spend that is not on ramp"). Three cuts are seconds apart in one edit, so
// everything that decides what the world IS lives here and no cut restates a
// value from it.
//
// THE CLIP'S ONE RULE
//   A transaction is a coin. The United States is a field of coins. Amber is
//   what Ramp has touched, and nothing else.
//     white coin  = a card transaction NOT on Ramp
//     amber coin  = one on Ramp
//     the mark    = Ramp
//     a thread    = Ramp reaching something
//
// Style is Cheeky Pint (MEMORY.md): kraft sheet, one white tile material with
// the figure knocked out, two tones of one amber, the damped `runCamera`, the
// d1Shared depth recipe, `Vignette` 0.55. Palette, camera and depth come from
// fieldShared / d1Shared; only what is NEW to this clip is here.
// ---------------------------------------------------------------------------

export const FPS = 24;

// ---------------------------------------------------------------------------
// THE RAMP MARK.
//
// The real logo is a lime disc with a black "ramp" swoosh on it: a thick curved
// band rising left -> right, plus a small wedge at its foot. The house rule for
// a brand mark (d1Shared's `D1Mark`) is INK TILE, FIGURE KNOCKED OUT — so here
// the disc is the white tile material and the swoosh is a hole the kraft shows
// through. Figure/ground is the logo's; only the colour is ours. Ramp's lime is
// deliberately NOT used: amber is the one accent in this clip and it means
// "Ramp has touched this", so a second colour on the mark would break the rule.
//
// GEOMETRY, measured off the icon (`ramp-touch.png` -> a 1440 px figure mask),
// in a 268-unit box so it sits in the same coordinate system as `D1_TILE`:
//   figure bbox  x 67.0-202.7, y 67.0-184.6   (the swoosh sits a shade high of
//                                              the disc's centre, as it does in
//                                              the real mark)
// The scan trace in the brief is a 53-point polygon with scan-line jaggies. It
// is cleaned here by fitting, not by hand-nudging: least squares over the two
// long boundaries gives two circles,
//   inner (upper-left) edge  centre (50.90, 47.08) r 118.37  max residual 1.65
//   outer (lower-right) edge centre (74.43, 71.11) r 113.78  max residual 0.67
// so the band is an annulus sector with two straight cut ends — the foot cut
// (28.5 long, the band's own width) and the top, which the raster shows is a
// 4.6-wide flat tip at y 66.8 and then one clean 45 deg cut down to the outer
// arc at (187.66, 82.27). The wedge's four sides come off the same raster: top
// y 163.7 from x 155.4 to 185.6, sides at -50.5 deg and +43.8 deg, base y 184.6
// (the source rounds the two base corners over ~3.5 units; a crisp trapezoid is
// what the brief asks for, and at MARK_SIZE_RAMP that rounding is 1.4 px).
// ---------------------------------------------------------------------------
export const RAMP_TILE = 268; // source units; the mark is drawn in this box and scaled
export const RAMP_DISC_R = 134; // the lime disc, edge to edge of the box
export const MARK_SIZE_RAMP = 108; // world px — the house size for a brand mark

export const RAMP_SWOOSH_PATHS: string[] = [
  // the band: inner arc down to the foot, the foot cut, outer arc back up to
  // the shoulder, the 45 deg top cut, the flat tip
  "M 167.61 66.80 A 118.37 118.37 0 0 1 65.43 164.56 L 85.99 184.30 A 113.78 113.78 0 0 0 187.66 82.27 L 172.19 66.80 Z",
  // the wedge at its foot: four points, nothing else
  "M 155.40 163.70 L 185.60 163.70 L 204.80 184.60 L 131.00 184.60 Z",
];

export const RampMark: React.FC<{
  x: number; // world px, centre of the disc
  y: number;
  size?: number;
  k: number; // camera zoom, for the tile shadow in screen px
  opacity?: number;
  // the house ink click, for the one object in a cut that takes one: the tile's
  // gradient collapses to flat white for the click's few frames. A brightness
  // lift on a tile that is ALREADY white has almost nowhere to go on opacity
  // alone (0.9 -> 1 over kraft is 5% of 255), so the click is carried by the
  // foot of the disc going TILE_GRAD_BOTTOM -> TILE_GRAD_TOP, which is 23%.
  bright?: boolean;
}> = ({ x, y, size = MARK_SIZE_RAMP, k, opacity = 1, bright = false }) => {
  const s = size / RAMP_TILE;
  const id = `ramp-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}
      style={{ filter: TILE_SHADOW(k * s) }}
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={RAMP_TILE} height={RAMP_TILE}>
          <rect width={RAMP_TILE} height={RAMP_TILE} fill="#fff" />
          {RAMP_SWOOSH_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#000" />
          ))}
        </mask>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TILE_GRAD_TOP} />
          <stop offset="100%" stopColor={bright ? TILE_GRAD_TOP : TILE_GRAD_BOTTOM} />
        </linearGradient>
      </defs>
      <circle
        cx={RAMP_TILE / 2}
        cy={RAMP_TILE / 2}
        r={RAMP_DISC_R}
        fill={`url(#${id}-g)`}
        opacity={opacity}
        mask={`url(#${id})`}
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE MAP. The contiguous-US outline from `public/us-solar/us_outline_z6.json`
// (the same file `PowerTheEntireUs` traces), mapped UNIFORMLY into a box 880
// world px wide starting at x 100, top edge y 599. The height falls out of the
// plate's own aspect — it is solved here, not typed, and exported.
// ---------------------------------------------------------------------------
const RAW_POINTS = (outlineJson as unknown as { points: [number, number][] }).points;
const PLATE = (() => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of RAW_POINTS) {
    if (p[0] < x0) x0 = p[0];
    if (p[0] > x1) x1 = p[0];
    if (p[1] < y0) y0 = p[1];
    if (p[1] > y1) y1 = p[1];
  }
  return { x0, x1, y0, y1 };
})();

export const MAP_W = 880;
export const MAP_SCALE = MAP_W / (PLATE.x1 - PLATE.x0); // 0.334983
export const MAP = {
  X0: 100,
  X1: 100 + MAP_W,
  Y0: 599,
  Y1: 599 + (PLATE.y1 - PLATE.y0) * MAP_SCALE, // 1070.87
  CX: 100 + MAP_W / 2, // 540
  CY: 599 + ((PLATE.y1 - PLATE.y0) * MAP_SCALE) / 2, // 834.94
} as const;

export const mapX = (px: number) => MAP.X0 + (px - PLATE.x0) * MAP_SCALE;
export const mapY = (py: number) => MAP.Y0 + (py - PLATE.y0) * MAP_SCALE;

/** The outline in world px. Nothing draws it (no stroke around the map) — it is
 *  the fence the field is cut against, and it is exported so a later cut can
 *  ask where the coast is. */
export const MAP_POLY: [number, number][] = RAW_POINTS.map((p) => [mapX(p[0]), mapY(p[1])]);

const inside = (x: number, y: number) => {
  let win = false;
  for (let i = 0, j = MAP_POLY.length - 1; i < MAP_POLY.length; j = i++) {
    const [xi, yi] = MAP_POLY[i];
    const [xj, yj] = MAP_POLY[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) win = !win;
  }
  return win;
};

// ---------------------------------------------------------------------------
// THE FIELD. A coin at every hex cell whose centre is inside the outline. Hex
// rather than square because a square lattice reads as a screen door and its
// front would spread as a diamond; hex gives a round front and an even density.
// ---------------------------------------------------------------------------
export const FIELD_PITCH = 11;
export const FIELD_ROW_PITCH = (FIELD_PITCH * Math.sqrt(3)) / 2; // 9.5263
export const FIELD_COIN_R = 4.6;
// V2 (user, 2026-09-16): "some of them are overlapping … more aligned with
// consistent spacing on all of them". The ±1.2 px jitter on an 11 px pitch let
// neighbours collide (coin diameter 9.2, so only 1.8 px of gap to spend). Zero:
// a clean hex lattice, every neighbour exactly one pitch away, the same gap
// everywhere, in all three cuts.
export const FIELD_JITTER = 0;
export const ORDER_JITTER = 0.35; // light-up order = hop + this * hash; was 0.8 in the first preview
export const ADJ_MAX = 1.15 * FIELD_PITCH; // 12.65 — the six hex neighbours

export type FieldCoinData = { x: number; y: number; hop: number; order: number };

/** Where Ramp is: New York. The seed is the coin nearest this world point. */
export const SEED_TARGET = { x: 877, y: 778 } as const;

const FIELD = (() => {
  // --- the cells ---------------------------------------------------------
  const xs: number[] = [];
  const ys: number[] = [];
  for (let r = 0; ; r++) {
    const y = MAP.Y0 + r * FIELD_ROW_PITCH;
    if (y > MAP.Y1) break;
    const off = (r % 2) * (FIELD_PITCH / 2);
    for (let c = 0; ; c++) {
      const x = MAP.X0 + off + c * FIELD_PITCH;
      if (x > MAP.X1) break;
      if (inside(x, y)) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  const n = xs.length;
  // the jitter goes on AFTER the fence test, so a coin may sit a hair outside
  // the coast — which is what a coast made of money looks like.
  for (let i = 0; i < n; i++) {
    xs[i] += (hash(i, 3) * 2 - 1) * FIELD_JITTER;
    ys[i] += (hash(i, 4) * 2 - 1) * FIELD_JITTER;
  }

  // --- the seed ----------------------------------------------------------
  let seed = 0;
  let best = Infinity;
  for (let i = 0; i < n; i++) {
    const d = (xs[i] - SEED_TARGET.x) ** 2 + (ys[i] - SEED_TARGET.y) ** 2;
    if (d < best) {
      best = d;
      seed = i;
    }
  }

  // --- adjacency, on a bucket grid ---------------------------------------
  const cell = ADJ_MAX;
  const buckets = new Map<number, number[]>();
  const key = (gx: number, gy: number) => gx * 100000 + gy;
  const gx = (x: number) => Math.floor((x - MAP.X0) / cell);
  const gy = (y: number) => Math.floor((y - MAP.Y0) / cell);
  for (let i = 0; i < n; i++) {
    const kk = key(gx(xs[i]), gy(ys[i]));
    const b = buckets.get(kk);
    if (b) b.push(i);
    else buckets.set(kk, [i]);
  }
  const near = (i: number, radiusCells: number) => {
    const out: number[] = [];
    const cx = gx(xs[i]);
    const cy = gy(ys[i]);
    for (let a = -radiusCells; a <= radiusCells; a++) {
      for (let b = -radiusCells; b <= radiusCells; b++) {
        const bb = buckets.get(key(cx + a, cy + b));
        if (bb) out.push(...bb);
      }
    }
    return out;
  };
  const adj: number[][] = [];
  for (let i = 0; i < n; i++) {
    const list: number[] = [];
    for (const j of near(i, 1)) {
      if (j === i) continue;
      if (Math.hypot(xs[j] - xs[i], ys[j] - ys[i]) <= ADJ_MAX) list.push(j);
    }
    adj.push(list);
  }

  // --- BFS, with every island stitched to its nearest reachable coin ------
  // The jitter can stretch a hex edge past ADJ_MAX, and a one-coin-wide neck
  // (Cape Cod, the Delmarva, the Florida keys) can lose its last bridge. The
  // brief's rule: every coin must be reachable, so an unreachable island is
  // connected to the nearest coin that is.
  const hop = new Int32Array(n).fill(-1);
  hop[seed] = 0;
  let queue: number[] = [seed];
  let reached = 1;
  let stitches = 0;
  for (;;) {
    while (queue.length) {
      const next: number[] = [];
      for (const i of queue) {
        for (const j of adj[i]) {
          if (hop[j] === -1) {
            hop[j] = hop[i] + 1;
            reached++;
            next.push(j);
          }
        }
      }
      queue = next;
    }
    if (reached === n) break;
    // the closest (unreached, reached) pair anywhere in the field
    let bu = -1;
    let bv = -1;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      if (hop[i] !== -1) continue;
      for (let r = 2; r <= 40; r++) {
        let found = false;
        for (const j of near(i, r)) {
          if (hop[j] === -1) continue;
          const d = Math.hypot(xs[j] - xs[i], ys[j] - ys[i]);
          found = true;
          if (d < bd) {
            bd = d;
            bu = i;
            bv = j;
          }
        }
        if (found) break;
      }
    }
    if (bu === -1) break; // cannot happen with a non-empty reached set
    adj[bu].push(bv);
    adj[bv].push(bu);
    hop[bu] = hop[bv] + 1;
    reached++;
    stitches++;
    queue = [bu];
  }

  // --- the light-up order ------------------------------------------------
  // Ranked on DISTANCE from the seed in ring widths, plus ORDER_JITTER * hash so
  // the rim is ragged and never a drawn circle. Director's revision after the
  // first preview: the order was `hop + jitter * hash`, and with jitter < 1 that
  // is just (hop, then hash) — the jitter can never lift a coin past a whole
  // ring, so it did nothing — while BFS `hop` itself overshoots geometry (the
  // ±1.2 px jitter drops some hex edges past ADJ_MAX, so a coin is reached the
  // long way round and lights a ring late, an enclosed white hole inside the
  // amber). Distance takes the enclosed holes to zero on every frame; the
  // jitter (0.35 ring ≈ ±3.9 px, under one coin diameter) is now exactly the
  // rim's raggedness. `hop` is kept on the data for the record only.
  const rank = Array.from({ length: n }, (_, i) => i);
  const keyOf = (i: number) =>
    Math.hypot(xs[i] - xs[seed], ys[i] - ys[seed]) / FIELD_PITCH + ORDER_JITTER * hash(i, 7);
  rank.sort((a, b) => keyOf(a) - keyOf(b));
  const order = new Int32Array(n);
  rank.forEach((i, o) => {
    order[i] = o;
  });

  const coins: FieldCoinData[] = [];
  for (let i = 0; i < n; i++) coins.push({ x: xs[i], y: ys[i], hop: hop[i], order: order[i] });

  // distance from the seed, indexed BY ORDER, and its prefix sum — so
  // `orderRadius` is O(1) and the velocity scan can walk it per frame.
  const distByOrder = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    distByOrder[order[i]] = Math.hypot(xs[i] - xs[seed], ys[i] - ys[seed]);
  }
  const prefix = new Float64Array(n + 1);
  for (let o = 0; o < n; o++) prefix[o + 1] = prefix[o] + distByOrder[o];

  return { coins, n, seed, stitches, maxHop: Math.max(...Array.from(hop)), prefix };
})();

export const FIELD_COINS: FieldCoinData[] = FIELD.coins;
export const N_FIELD = FIELD.n;
export const N_LIT = Math.round(0.02 * N_FIELD);
export const SEED = FIELD.seed;
export const SEED_POS = { x: FIELD_COINS[SEED].x, y: FIELD_COINS[SEED].y } as const;
export const FIELD_STITCHES = FIELD.stitches; // islands the BFS had to bridge
export const FIELD_MAX_HOP = FIELD.maxHop;

/** The front's radius when `n` coins are lit: the mean distance from the seed
 *  of the last 20 coins to light. The camera and the velocity scan both read
 *  the spread off this, never off a radius that was typed. */
export const ORDER_WINDOW = 20;
export const orderRadius = (n: number) => {
  const hi = Math.max(1, Math.min(N_FIELD, Math.round(n)));
  const lo = Math.max(0, hi - ORDER_WINDOW);
  return (FIELD.prefix[hi] - FIELD.prefix[lo]) / (hi - lo);
};

// ---------------------------------------------------------------------------
// DRAWING A FIELD COIN. ~2,500 coins a frame, so there is ONE `<defs>` with one
// mask and three discs in it and every coin is a `<use>`: no filter per coin,
// no gradient per coin, no mask per coin.
//
// The "$" is the one thing that cannot survive all the way out: at the resolved
// k its stroke is 0.6 screen px, which is a grey smudge rather than a dollar
// sign, and it costs a mask evaluation. `CoinDefs` therefore takes `k` and
// drops the knockout below DOLLAR_K, where the stroke is already under one
// screen px and nothing visibly changes. The `<use>` sites never change.
// ---------------------------------------------------------------------------
export type CoinState = "ink" | "amber" | "passed";
export const COIN_SYMBOL: Record<CoinState, string> = {
  ink: "rc-ink",
  amber: "rc-amber",
  passed: "rc-passed",
};
export const COIN_DOLLAR_FRACTION = 0.62; // the 24-unit "$" fills this much of the coin
export const COIN_DOLLAR_STROKE = 2.6;
export const DOLLAR_K = 1.6; // below this the "$" stroke is under 1 screen px

export const CoinDefs: React.FC<{ k: number; r?: number }> = ({ k, r = FIELD_COIN_R }) => {
  const s = (r * 2 * COIN_DOLLAR_FRACTION) / 24;
  const o = -12 * s;
  const mask = k >= DOLLAR_K ? "url(#rc-dollar)" : undefined;
  return (
    <defs>
      <mask id="rc-dollar" maskUnits="userSpaceOnUse" x={-r} y={-r} width={r * 2} height={r * 2}>
        <rect x={-r} y={-r} width={r * 2} height={r * 2} fill="#fff" />
        <g
          transform={`translate(${o} ${o}) scale(${s})`}
          fill="none"
          stroke="#000"
          strokeWidth={COIN_DOLLAR_STROKE}
          strokeLinecap="square"
          dangerouslySetInnerHTML={{ __html: COIN_DOLLAR }}
        />
      </mask>
      <radialGradient id="rc-g-ink" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor={TILE_GRAD_TOP} />
        <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
      </radialGradient>
      <radialGradient id="rc-g-amber" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor={COIN_GRAD_HI} />
        <stop offset="100%" stopColor={COIN_GRAD_LO} />
      </radialGradient>
      <radialGradient id="rc-g-passed" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F2EFE8" />
      </radialGradient>
      <g id="rc-ink">
        <circle r={r} fill="url(#rc-g-ink)" mask={mask} />
      </g>
      <g id="rc-amber">
        <circle r={r} fill="url(#rc-g-amber)" mask={mask} />
      </g>
      <g id="rc-passed">
        <circle r={r} fill="url(#rc-g-passed)" mask={mask} />
      </g>
    </defs>
  );
};

/** One coin. `scale` is about its own centre, so a pop never moves it. */
export const FieldCoin = ({
  i,
  state,
  scale = 1,
  opacity,
  dx = 0,
  dy = 0,
}: {
  i: number;
  state: CoinState;
  scale?: number;
  opacity?: number;
  dx?: number;
  dy?: number;
}) => {
  const c = FIELD_COINS[i];
  const t = `translate(${(c.x + dx).toFixed(2)} ${(c.y + dy).toFixed(2)})${
    scale === 1 ? "" : ` scale(${scale.toFixed(3)})`
  }`;
  return <use key={i} href={`#${COIN_SYMBOL[state]}`} transform={t} opacity={opacity} />;
};

// ---------------------------------------------------------------------------
// THE MARK'S PLACE. Above the map, off the Maine coast, inside the content
// band. The thread leaves the disc's bottom edge, `originX` style — never a
// knot in mid-air — and runs to the seed.
// ---------------------------------------------------------------------------
export const MARK_POS = { x: 958, y: 560 } as const;
export const THREAD_FROM = { x: 958, y: MARK_POS.y + MARK_SIZE_RAMP / 2 } as const; // 614
export { THREAD_IDLE, THREAD_LIVE, THREAD_W } from "./d1Shared";

// ---------------------------------------------------------------------------
// MOTION HELPERS. Shared so the three cuts breathe and strain identically.
// ---------------------------------------------------------------------------

/** `Easing.out(Easing.back(0.75))`, written out so the shared module does not
 *  depend on remotion's easing table. Its slope at u = 1 is exactly zero, so
 *  the overshoot lands without a velocity step; it peaks 2.04% past 1 at
 *  u = 0.714. This is the hurricane's callout pop. */
export const backOut075 = (u: number) => {
  const v = 1 - clamp01(u);
  return 1 - v * v * (1.75 * v - 0.75);
};

export const COIN_LIT_FRAMES = 5;
export const COIN_LIT_FROM = 0.6;
/** The 5-frame scale-in of a coin turning amber. `age` is frames since it lit. */
export const coinLitBump = (age: number) =>
  COIN_LIT_FROM + (1 - COIN_LIT_FROM) * backOut075(age / COIN_LIT_FRAMES);

export const BREATH_AMP = 0.03; // 3%, the house ceiling for a held object
export const BREATH_RATE = 0.09;
/** A coin is never dead still. Individual phase, so a field never pulses. */
export const coinBreath = (frame: number, i: number) =>
  1 + BREATH_AMP * Math.sin(frame * BREATH_RATE + hash(i, 13) * Math.PI * 2);

export const STRAIN_AMP = 1.5; // world px
export const STRAIN_PERIOD = 33;
/** The outer ring's lean toward the next ring: signed world px, to be applied
 *  along the outward radial. Phase by hash, so the ring undulates. */
export const strain = (frame: number, i: number) =>
  STRAIN_AMP *
  Math.sin((2 * Math.PI * (frame - hash(i, 19) * STRAIN_PERIOD)) / STRAIN_PERIOD);

// ---------------------------------------------------------------------------
// CUT 1'S RESOLVED STATE. Cut 2 opens on exactly this camera and this field.
//
// Solved, not typed: the content of the resolved frame is the map (x 100-980,
// y 599-1070.87) plus the mark's disc (x 904-1012, y 506-614), so the picture
// spans 912 x 564.87 world px. The house band is x 60-1020 / y 200-1450 and the
// brief asks for >= 40 px of air inside it, and `sway` moves the camera +/- 3
// px in x and +/- 5 in y, so the picture gets 960 - 80 - 6 = 874 screen px of
// width and 1250 - 80 - 10 = 1160 of height. Width binds: 874 / 912 = 0.9583.
//
// DEVIATION from the cut brief, which types the resolved centre as (540, 835):
// that is the MAP's centre, and the mark hangs 32 px off its right. At cx 540
// the mark's right edge lands at screen 1012 — 8 px of air, not 40 — so the
// camera centres on the PICTURE's centre, x 556, instead. 16 px of world.
// ---------------------------------------------------------------------------
export const BAND = { X0: 60, X1: 1020, Y0: 200, Y1: 1450 } as const;
export const BAND_AIR = 40;
export const SWAY_X = 3;
export const SWAY_Y = 5;

export const CONTENT = {
  x0: Math.min(MAP.X0, MARK_POS.x - MARK_SIZE_RAMP / 2),
  x1: Math.max(MAP.X1, MARK_POS.x + MARK_SIZE_RAMP / 2),
  y0: Math.min(MAP.Y0, MARK_POS.y - MARK_SIZE_RAMP / 2),
  y1: Math.max(MAP.Y1, MARK_POS.y + MARK_SIZE_RAMP / 2),
} as const;

export const K_FINAL =
  Math.floor(
    1000 *
      Math.min(
        (BAND.X1 - BAND.X0 - 2 * BAND_AIR - 2 * SWAY_X) / (CONTENT.x1 - CONTENT.x0),
        (BAND.Y1 - BAND.Y0 - 2 * BAND_AIR - 2 * SWAY_Y) / (CONTENT.y1 - CONTENT.y0),
      ),
  ) / 1000;
export const CX_FINAL = (CONTENT.x0 + CONTENT.x1) / 2;
/** The content centre the resolved frame sits on; `CY_FINAL` is the camera's
 *  own cy, which carries `CAM_LIFT` so that centre lands on screen y 835. */
export const CONTENT_CY_FINAL = (CONTENT.y0 + CONTENT.y1) / 2;
export const CY_FINAL = CONTENT_CY_FINAL + CAM_LIFT / K_FINAL;

export const LIT_FINAL = N_LIT;
export const CONTINUE_FROM = 178; // cut 2 opens on this frame of cut 1

// ---------------------------------------------------------------------------
// ADDED AFTER `SHARED_READY` — additive only, nothing above was renamed or
// re-solved. The lit patch's own centroid: what a camera should land on when it
// lands "on the amber", rather than on the seed. New York is on the coast and
// the front spreads inland, so the patch's centre of mass walks ~13 px north
// west of the seed as it grows — and the difference is 170 screen px at cut 1's
// dive, which is the difference between a full frame and a frame half of which
// is the Atlantic.
// ---------------------------------------------------------------------------
const BY_ORDER: FieldCoinData[] = (() => {
  const out: FieldCoinData[] = new Array(N_LIT);
  for (const c of FIELD_COINS) if (c.order < N_LIT) out[c.order] = c;
  return out;
})();

/** The centroid of the first `n` coins to light. */
export const patchCentroid = (n: number) => {
  const m = Math.max(1, Math.min(N_LIT, Math.round(n)));
  let sx = 0;
  let sy = 0;
  for (let o = 0; o < m; o++) {
    sx += BY_ORDER[o].x;
    sy += BY_ORDER[o].y;
  }
  return { x: sx / m, y: sy / m };
};

/** The resolved patch: where the 2% sits, once all of it is lit. */
export const PATCH_POS = patchCentroid(N_LIT);
