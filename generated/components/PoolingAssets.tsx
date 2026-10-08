import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, smoothstep, sway } from "./fieldShared";
import {
  ACCENT,
  Arms,
  BAR_RISE,
  BAR_W,
  DARK,
  Engraved,
  GoldBars,
  Horse,
  HORSE_UNITS,
  INK,
  PURSE_PARTS,
  Ship,
  barOutline,
  manParts,
  stackBars,
  type ManOpts,
} from "./PoolingAssetsGlyphs";

// ---------------------------------------------------------------------------
// PoolingAssets: one cut of the clip "Sheppard: East India kings" (Dwarkesh with
// Si Sheppard), on the Spanish conquistadors as business partnerships.
// Dwarkesh map style, the non-map page (engraved cream objects on the umber
// land backdrop, after PriorYearRecessionV2 / InterestRatesGoDownV2).
// 1080x1920, opaque, 24000/1001 fps.
//
// SPOKEN LINE (Si Sheppard), word onsets in frames from f0:
//   not f0 · soldados f5 · So f22 · this f23 · whole f31 · operation f40 ·
//   was f53 · if you like f68-72 · the f81 · most f84 · raw f90 ·
//   unbridled f107 · capitalism f118 · at f130 · its f135 · finest f137 ·
//   pooling f147 · assets f152 · to f161 · derive f173 · enormous f184 ·
//   profits f194 · (cut to the speaker f206: "from very risky ventures")
// DURATION = sequence frames 2271 -> 2477 = 206 frames at 24000/1001 fps
//   (8.59 s); the edit fixes it.
// CHECK LINE: "A conquest ran like a company: partners pooled horses, arms and
//   ships into one venture and split the gold by what each had put in."
//
// THE MOTION (one, continuous). Four companeros stand at the corners of the
// page, each with his stake beside him: a ship, a horse, sword and crossbow, a
// purse. From f0 the stakes leave their owners along drawn cream lines and
// merge in the middle into ONE ship, which is fitted out as each arrives
// (a sail set per stake); the lines stay as each partner's share, their
// thickness the size of his stake. The ship sails away up the page, small and
// far by f122, comes about and returns heaped with gold (orange); the gold
// lands as one big stack in the middle (whole f162) and is paid straight back
// out along the same lines (f164-186), which run orange, to four stacks sized
// by the thickness of each line (15 / 12 / 8 / 6 bars of 41), done as he says
// "enormous" (f184). Then a settled frame: slow creep, a glint over the gold.
//
// ORANGE = the profit (the gold) and nothing else. No text, no numbers.
//
// SCHEMATIC, not a record: the four partners and their stakes stand for the
// way the companies of the conquest were financed (men were paid in shares of
// the booty by what they brought: a horseman's share was larger than a
// footman's, and backers who fitted out the ships took theirs). The stack
// sizes show proportion to stake only; no real division is depicted.
// PERIOD: morions / flat caps, slashed doublets and paned trunk hose of the
// 1520s-30s, a merchant's long gown for the backer; a nao with square fore and
// main sails and a lateen mizzen; a war saddle with high cantle and pommel; a
// spanned steel crossbow and a cross-hilted sword.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 206;
export const W = 1080;
export const H = 1920;

export const schema = z.object({
  backdropSrc: z.string(),
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  vignette: 0.34,
});

type P2 = [number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (f: number, f0: number, f1: number) => smoothstep((f - f0) / (f1 - f0));

// ---------------------------------------------------------------------------
// Curves (world px), sampled once with arc length
// ---------------------------------------------------------------------------
type Curve = { pts: P2[]; s: number[]; len: number };
const measure = (pts: P2[]): Curve => {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, s, len: s[s.length - 1] };
};
const cubic = (a: P2, c1: P2, c2: P2, b: P2, n = 100): Curve =>
  measure(
    Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n;
      const u = 1 - t;
      return [
        u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
        u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1],
      ] as P2;
    }),
  );
/** the point a fraction u (by arc length) along a curve */
const at = (c: Curve, u: number): P2 => {
  const target = clamp01(u) * c.len;
  let i = 1;
  while (i < c.s.length - 1 && c.s[i] < target) i++;
  const t = (target - c.s[i - 1]) / (c.s[i] - c.s[i - 1] || 1);
  return [lerp(c.pts[i - 1][0], c.pts[i][0], t), lerp(c.pts[i - 1][1], c.pts[i][1], t)];
};
const dOf = (pts: P2[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");

// ---------------------------------------------------------------------------
// THE PAGE (world px == screen px at k 1)
// ---------------------------------------------------------------------------
const HUB: P2 = [535, 1005]; // the venture: the ship's waterline amidships
const SHIP_FULL = 3.5; // px per ship unit when fitted out (hull + bowsprit ~420 px)
const GROUND_UP = 600;
const GROUND_LOW = 1650;
const MAN_PX = 2.75; // a man ~280 px tall
const HEAP_K = 1.28; // a partner's bars, and the returning stack's: ~64 px each

type Share = {
  id: "ship" | "horse" | "arms" | "purse";
  hand: P2; // where the share line starts: at the partner
  c1: P2;
  c2: P2;
  homeT: number; // where along the line his stake stands (and his gold is stacked)
  lift: number; // the standing stake's centre above the line (px)
  w: number; // the share line's thickness = the size of the stake
  go: readonly [number, number]; // the stake's journey, frames
  man: { x: number; y: number; flip: boolean; opts: ManOpts };
  ground: number; // the base of the partner's gold
  rows: number[]; // his gold, bars per row
};
export const SHARES: Share[] = [
  {
    id: "ship",
    hand: [170, 455],
    c1: [520, 425],
    c2: [190, 1010],
    homeT: 0.33,
    lift: 0,
    w: 20,
    go: [-6, 32],
    man: { x: 100, y: GROUND_UP, flip: false, opts: { hat: "cap", gown: true } },
    ground: GROUND_UP,
    rows: [5, 4, 3, 2, 1],
  },
  {
    id: "horse",
    hand: [910, 440],
    c1: [560, 400],
    c2: [890, 1010],
    homeT: 0.33,
    lift: 81,
    w: 16,
    go: [10, 52],
    man: { x: 980, y: GROUND_UP, flip: true, opts: { hat: "morion", cape: true, sword: true } },
    ground: GROUND_UP,
    rows: [5, 4, 3],
  },
  {
    id: "arms",
    hand: [170, 1500],
    c1: [470, 1680],
    c2: [500, 1260],
    homeT: 0.2,
    lift: 14,
    w: 11,
    go: [30, 70],
    man: { x: 100, y: GROUND_LOW, flip: false, opts: { hat: "morion", cuirass: true, sword: true } },
    ground: GROUND_LOW,
    rows: [4, 3, 1],
  },
  {
    id: "purse",
    hand: [910, 1500],
    c1: [610, 1680],
    c2: [570, 1260],
    homeT: 0.2,
    lift: -33,
    w: 8,
    go: [50, 88],
    man: { x: 980, y: GROUND_LOW, flip: true, opts: { hat: "cap", cape: true } },
    ground: GROUND_LOW,
    rows: [3, 2, 1],
  },
];
// a share line runs from the partner's hand, past where his stake stands, to
// the hub: one smooth curve. The stake travels it from STUB_U on.
const FULL = SHARES.map((s) => cubic(s.hand, s.c1, s.c2, HUB, 140));
const HOME_N = SHARES.map((s) => Math.round(s.homeT * 140));
const STUB_U = SHARES.map((_, i) => FULL[i].s[HOME_N[i]] / FULL[i].len);
const HEAP_AT: P2[] = SHARES.map((s, i) => [FULL[i].pts[HOME_N[i]][0], s.ground]);
const lineU = (i: number, f: number) => STUB_U[i] + (1 - STUB_U[i]) * stakeU(i, f);
const LINES_BACK = FULL.map((c) => measure(c.pts.slice().reverse()));
const HORSE_PX = 320 / HORSE_UNITS;
const ARMS_PX = 2.4;
const PURSE_PX = 2.9;
const SHIP_HOME = 2.1;

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
export const T = {
  arrive: [32, 52, 70, 88] as const, // ship, horse, arms, purse reach the hub
  out: [90, 124] as const, // the voyage out
  turn: [122, 134] as const, // coming about, far off
  back: [130, 156] as const, // the voyage home
  land: [150, 162] as const, // the gold lands in the middle
  pay: [164, 186] as const, // paid out along the share lines
  glint: [184, 214] as const,
};
/** each stake's progress along its line, 0..1 */
export const stakeU = (i: number, f: number) => ease(f, SHARES[i].go[0], SHARES[i].go[1]);
const FAR: P2 = [690, 205];
const SHIP_FAR = 2.1; // still ~250 px wide at its farthest
const VOY_OUT = cubic(HUB, [610, 820], [712, 500], FAR);
const VOY_BACK = cubic(FAR, [598, 380], [528, 700], HUB);

export const shipState = (f: number) => {
  // to the hub, growing as each stake comes aboard
  const u0 = stakeU(0, f);
  let pos = at(FULL[0], lineU(0, f));
  let px = lerp(SHIP_HOME, 2.84, u0) + 0.22 * (ease(f, T.arrive[1] - 7, T.arrive[1] + 7) + ease(f, T.arrive[2] - 7, T.arrive[2] + 7) + ease(f, T.arrive[3] - 7, T.arrive[3] + 7));
  let flip = 1;
  if (f > T.out[0]) {
    const uo = ease(f, T.out[0], T.out[1]);
    const ub = ease(f, T.back[0], T.back[1]);
    pos = ub > 0 ? at(VOY_BACK, ub) : at(VOY_OUT, uo);
    // it shrinks with distance (by height gained), and grows home again
    const far = ub > 0 ? 1 - ub : uo;
    px = lerp(SHIP_FULL, SHIP_FAR, Math.pow(far, 0.85));
    flip = Math.cos(Math.PI * ease(f, T.turn[0], T.turn[1]));
  }
  const sails: [number, number, number] = [
    ease(f, T.arrive[1] - 8, T.arrive[1] + 8),
    ease(f, T.arrive[2] - 8, T.arrive[2] + 8),
    ease(f, T.arrive[3] - 8, T.arrive[3] + 6),
  ];
  const aboard = {
    horse: ease(f, T.arrive[1] - 10, T.arrive[1] - 3),
    arms: ease(f, T.arrive[2] - 10, T.arrive[2] - 3),
    coin: ease(f, T.arrive[3] - 10, T.arrive[3] - 3),
  };
  const under = ease(f, T.out[0] - 6, T.out[0] + 10); // under way: it rides the swell
  const roll = (0.5 + 1.3 * under) * Math.sin(f * 0.2);
  const heave = (0.4 + 1.6 * under) * Math.sin(f * 0.17 + 1);
  return { pos, px, flip, sails, aboard, roll, heave };
};

// ---------------------------------------------------------------------------
// THE GOLD
// ---------------------------------------------------------------------------
const BIG_ROWS = [9, 8, 7, 6, 5, 4, 2]; // 41 bars
const BIG = stackBars(BIG_ROWS);
const BIG_K = HEAP_K;
const BIG_BASE: P2 = [540, 1068];
const HEAPS = SHARES.map((s) => stackBars(s.rows));
export const TOTAL_BARS = BIG.length;
/** the order the big stack is paid out: from the top down, the outside of a row first */
const BIG_LEAVE = BIG.map((b, i) => ({ i, key: -b.row * 100 - Math.abs(b.x) / BAR_W }))
  .sort((p, q) => p.key - q.key)
  .map((e) => e.i);
const BIG_RANK: number[] = [];
BIG_LEAVE.forEach((i, rank) => {
  BIG_RANK[i] = rank;
});
export const bigPresent = (i: number, f: number) =>
  1 - smoothstep((f - (T.pay[0] + 1 + ((T.pay[1] - T.pay[0] - 3.5) * BIG_RANK[i]) / TOTAL_BARS)) / 2.5);
export const heapPresent = (h: number, j: number, f: number) =>
  smoothstep((f - (T.pay[0] + 7 + ((T.pay[1] - T.pay[0] - 10.5) * j) / HEAPS[h].length)) / 3);
/** the orange running out along share line h, 0..1 from the hub */
export const flowU = (h: number, f: number) => {
  const u = clamp01((f - T.pay[0]) / 11);
  return 1 - (1 - u) * (1 - u);
};

// ---------------------------------------------------------------------------
// THE CAMERA: a coarse keyed track [f, cx, cy, k] through a damped follow
// ---------------------------------------------------------------------------
const CAM_KEYS: [number, number, number, number][] = [
  [-60, 540, 1005, 0.94],
  [-8, 540, 1000, 0.955],
  [36, 540, 978, 1.0],
  [84, 546, 928, 1.04],
  [102, 572, 850, 1.01],
  [118, 590, 790, 0.97],
  [132, 584, 800, 0.97],
  [152, 540, 962, 0.99],
  [164, 540, 986, 0.95],
  [180, 540, 986, 0.955],
  [240, 540, 986, 1.03],
];
const camTarget = (f: number): [number, number, number] => {
  let i = 1;
  while (i < CAM_KEYS.length - 1 && CAM_KEYS[i][0] < f) i++;
  const a = CAM_KEYS[i - 1];
  const b = CAM_KEYS[i];
  const t = clamp01((f - a[0]) / (b[0] - a[0]));
  return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
};
const CAM_TABLE: [number, number, number][] = (() => {
  const OMEGA = 0.26; // per frame: the follow lags ~8 frames and never pops
  const SUB = 4;
  const F0 = -60;
  const out: [number, number, number][] = [];
  const x = camTarget(F0).slice() as [number, number, number];
  const v = [0, 0, 0];
  for (let n = 0; n <= (DURATION + 2 - F0) * SUB; n++) {
    const f = F0 + n / SUB;
    if (f >= 0 && n % SUB === 0) out.push([x[0], x[1], x[2]]);
    const tg = camTarget(f);
    for (let d = 0; d < 3; d++) {
      v[d] += ((OMEGA * OMEGA * (tg[d] - x[d]) - 2 * OMEGA * v[d]) * 1) / SUB;
      x[d] += v[d] / SUB;
    }
  }
  return out;
})();
export const cameraAt = (f: number) => {
  const c = CAM_TABLE[Math.max(0, Math.min(CAM_TABLE.length - 1, Math.round(f)))];
  return { cx: c[0], cy: c[1], k: c[2] };
};

// ---------------------------------------------------------------------------
// The wake: a few engraved wave strokes left on the page where the ship passed
// ---------------------------------------------------------------------------
type Wake = { p: P2; f: number; size: number };
const WAKES: Wake[] = (() => {
  const out: Wake[] = [];
  let lastP: P2 | null = null;
  for (let f = T.out[0] + 4; f < T.back[1] - 8; f += 0.5) {
    const st = shipState(f);
    if (f > T.turn[0] - 2 && f < T.turn[1] + 2) continue;
    const gap = 30 + 26 * (st.px / SHIP_FULL);
    if (lastP && Math.hypot(st.pos[0] - lastP[0], st.pos[1] - lastP[1]) < gap) continue;
    lastP = st.pos;
    const side = out.length % 2 === 0 ? -1 : 1;
    out.push({ p: [st.pos[0] + side * 16 * st.px, st.pos[1] + 9 * st.px], f: f + 2.5, size: st.px / SHIP_FULL });
  }
  return out;
})();

const Line: React.FC<{ c: Curve; u: number; w: number; color: string; casing?: number }> = ({ c, u, w, color, casing = 0.5 }) => {
  if (u <= 0.002) return null;
  const d = dOf(c.pts);
  const dash = `${(c.len * u).toFixed(1)} ${(c.len + 40).toFixed(1)}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={casing} strokeWidth={w + 6} strokeDasharray={dash} />
      <path d={d} stroke={color} strokeWidth={w} strokeDasharray={dash} />
    </g>
  );
};

const PoolingAssets: React.FC<Props> = ({ backdropSrc, vignette }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const tx = W / 2 - cam.cx * k + drift.dx * 0.6;
  const ty = H / 2 - cam.cy * k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;

  const ship = shipState(frame);
  const [shx, shy] = ship.pos;

  // the gold: aboard from the turn, landing as one stack in the middle
  const goldIn = ease(frame, T.turn[0] + 6, T.turn[0] + 13);
  const land = ease(frame, T.land[0], T.land[1]);
  const deckK = (0.4 * ship.px) / SHIP_FULL;
  const bigK = lerp(deckK, BIG_K, land) * (0.5 + 0.5 * goldIn);
  const bigX = lerp(shx, BIG_BASE[0], land);
  const bigY = lerp(shy - 13 * ship.px + ship.heave, BIG_BASE[1], land);

  const glintU = (frame - T.glint[0]) / (T.glint[1] - T.glint[0]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* the umber page, world space, oversized so the camera never finds its edge */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${k})` }}>
        <Img src={staticFile(backdropSrc)} style={{ position: "absolute", left: -260, top: -440, width: 1600, height: 2800 }} />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          {HEAPS.map((bars, h) => (
            <clipPath key={h} id={`paGlint${h}`}>
              <path d={bars.map(barOutline).join(" ")} />
            </clipPath>
          ))}
          <linearGradient id="paGlintGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFF1C8" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFF1C8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFF1C8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={camT}>
          {/* the wake */}
          {WAKES.map((wk, i) => {
            const o = ease(frame, wk.f, wk.f + 4) * (1 - ease(frame, wk.f + 8, wk.f + 30));
            if (o <= 0.01) return null;
            const a = 5 * wk.size + 2.4;
            const w = 9 * wk.size + 4;
            let d = `M${(wk.p[0] - 2 * w).toFixed(1)},${wk.p[1].toFixed(1)}`;
            for (let n = 0; n < 4; n++) d += ` q${(w / 2).toFixed(1)},${(-a).toFixed(1)} ${w.toFixed(1)},0`;
            return (
              <g key={i} opacity={o * 0.8} fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} stroke={DARK} strokeOpacity={0.5} strokeWidth={2.4 * wk.size + 5} />
                <path d={d} stroke={INK} strokeWidth={2.4 * wk.size + 1.6} />
              </g>
            );
          })}

          {/* the share lines: drawn by the stakes, then run orange from the hub */}
          {SHARES.map((s, i) => (
            <Line key={s.id} c={FULL[i]} u={lineU(i, frame)} w={s.w} color={INK} />
          ))}
          {SHARES.map((s, i) => (
            <Line key={s.id} c={LINES_BACK[i]} u={flowU(i, frame)} w={s.w} color={ACCENT} casing={0.35} />
          ))}

          {/* the partners */}
          {SHARES.map((s) => (
            <g key={s.id} transform={`translate(${s.man.x} ${s.man.y}) scale(${s.man.flip ? -MAN_PX : MAN_PX} ${MAN_PX})`}>
              <Engraved parts={manParts(s.man.opts)} px={MAN_PX * k} />
            </g>
          ))}

          {/* the venture */}
          <g transform={`translate(${shx.toFixed(2)} ${(shy + ship.heave).toFixed(2)}) rotate(${ship.roll.toFixed(3)}) scale(${(ship.px * ship.flip).toFixed(4)} ${ship.px.toFixed(4)})`}>
            <Ship px={ship.px * k} sails={ship.sails} aboard={ship.aboard} frame={frame} />
          </g>

          {/* the stakes on their way in (the ship is the venture itself); they go aboard over it */}
          {SHARES.map((s, i) => {
            if (s.id === "ship") return null;
            const u = stakeU(i, frame);
            const fade = 1 - smoothstep((u - 0.76) / 0.16);
            if (fade <= 0.01) return null;
            const sc = 1 - 0.55 * smoothstep((u - 0.62) / 0.38);
            const [x, y0] = at(FULL[i], lineU(i, frame));
            // it leaves the line for the deck as it comes aboard
            const y = y0 - s.lift * (1 - smoothstep(u / 0.8)) - (s.id === "horse" ? 70 : 0) * smoothstep((u - 0.55) / 0.4);
            const moving = smoothstep(u / 0.12) * (1 - smoothstep((u - 0.9) / 0.1));
            if (s.id === "horse") {
              const px = HORSE_PX * sc;
              return (
                <g key={s.id} opacity={fade} transform={`translate(${x} ${y}) scale(${-px} ${px}) rotate(${(9 * moving).toFixed(2)})`}>
                  <Horse px={px * k} phase={(frame - s.go[0]) / 3.2} gait={moving} />
                </g>
              );
            }
            if (s.id === "arms") {
              const px = ARMS_PX * sc;
              return (
                <g key={s.id} opacity={fade} transform={`translate(${x} ${y}) scale(${px}) rotate(${(16 * smoothstep(u)).toFixed(2)})`}>
                  <Arms px={px * k} />
                </g>
              );
            }
            const px = PURSE_PX * sc;
            return (
              <g key={s.id} opacity={fade} transform={`translate(${x} ${y}) scale(${px}) rotate(${(-7 * Math.sin(Math.PI * u)).toFixed(2)})`}>
                <Engraved parts={PURSE_PARTS} px={px * k} />
              </g>
            );
          })}

          {/* the gold it brings home, then pays out */}
          {goldIn > 0.01 ? (
            <g transform={`translate(${bigX.toFixed(2)} ${bigY.toFixed(2)}) scale(${bigK.toFixed(4)})`} opacity={Math.min(1, goldIn * 1.5)}>
              <GoldBars bars={BIG} present={(i) => bigPresent(i, frame)} px={bigK * k} />
            </g>
          ) : null}
          {SHARES.map((s, h) => {
            const bars = HEAPS[h];
            const wHeap = s.rows[0] * BAR_W;
            const gx = -wHeap / 2 - 70 + (wHeap + 140) * glintU + (h % 2) * 30;
            return (
              <g key={s.id} transform={`translate(${HEAP_AT[h][0].toFixed(1)} ${HEAP_AT[h][1]}) scale(${HEAP_K})`}>
                <GoldBars bars={bars} present={(j) => heapPresent(h, j, frame)} px={HEAP_K * k} />
                {glintU > 0 && glintU < 1 ? (
                  <g clipPath={`url(#paGlint${h})`}>
                    <rect x={gx - 34} y={-s.rows.length * BAR_RISE - 40} width={68} height={s.rows.length * BAR_RISE + 60} fill="url(#paGlintGrad)" transform={`skewX(-18)`} />
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 48%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(vignette * 0.5).toFixed(3)}) 82%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default PoolingAssets;
