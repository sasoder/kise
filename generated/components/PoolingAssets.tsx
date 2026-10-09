import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, smoothstep, sway } from "./fieldShared";
import {
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
  type Bar,
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
//   not f0 · soldados f5 · So this whole operation was f22-53 ·
//   if you like f68-72 · the most raw f81-90 · unbridled f107 ·
//   capitalism f118 · at its finest f130-137 · pooling f147 · assets f152 ·
//   to derive f161-173 · enormous f184 · profits f194 ·
//   (cut to the speaker f206: "from very risky ventures")
// DURATION = sequence frames 2271 -> 2477 = 206 frames at 24000/1001 fps
//   (8.59 s); the edit fixes it.
// CHECK LINE: "Many men's stakes went into one ship, and the ship came home
//   heavy with gold."
//
// THE MOTION, two unhurried beats under one slow push-in.
//  1. POOLING (f0 -> ~f118). Four companeros stand in the four corners, each
//     beside his stake: a hull, a horse, sword and crossbow, a purse. One by
//     one, overlapping gently (ship f6-34, horse f30-62, arms f58-88, purse
//     f84-112), the stakes travel to the middle along cream share lines and go
//     aboard the ONE ship, which is fitted out from them: a sail is set for
//     each arrival. Under full sail by f118, riding a few engraved waves.
//  2. PROFIT (~f128 -> f206). The ship stays; the share lines fade (f122-150),
//     the camera keeps pushing in and the partners slide out of frame. From f150 gold rises out of the hold,
//     bar on bar, the hull settling lower in the water, until by ~f188
//     ("enormous" f184) it carries a mountain of gold wider than its hull.
//     Then a settled, living hold: the waves, a slow roll, a glint on the gold.
//
// ORANGE = the gold and nothing else. No text, no numbers.
//
// SCHEMATIC, not a record: the four partners and their stakes stand for the
// way the companies of the conquest were financed (men put in horses, arms,
// ships and money and were paid in shares of the booty). No real expedition,
// cargo or sum is depicted.
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
const WATER = 5.2; // the water's level on the hull, ship units below its origin
const GROUND_UP = 600;
const GROUND_LOW = 1650;
const MAN_PX = 2.75; // a man ~280 px tall
const LINE_W = 10; // every share line the same weight

type Share = {
  id: "ship" | "horse" | "arms" | "purse";
  hand: P2; // where the share line starts: at the partner
  c1: P2;
  c2: P2;
  homeT: number; // where along the line his stake stands
  lift: number; // the standing stake's centre above the line (px)
  go: readonly [number, number]; // the stake's journey, frames
  man: { x: number; y: number; flip: boolean; opts: ManOpts };
};
export const SHARES: Share[] = [
  {
    id: "ship",
    hand: [170, 455],
    c1: [520, 425],
    c2: [190, 1010],
    homeT: 0.33,
    lift: 0,
    go: [6, 34],
    man: { x: 100, y: GROUND_UP, flip: false, opts: { hat: "cap", gown: true } },
  },
  {
    id: "horse",
    hand: [910, 440],
    c1: [560, 400],
    c2: [890, 1010],
    homeT: 0.33,
    lift: 81,
    go: [30, 62],
    man: { x: 980, y: GROUND_UP, flip: true, opts: { hat: "morion", cape: true, sword: true } },
  },
  {
    id: "arms",
    hand: [170, 1500],
    c1: [470, 1680],
    c2: [500, 1260],
    homeT: 0.2,
    lift: 14,
    go: [58, 88],
    man: { x: 100, y: GROUND_LOW, flip: false, opts: { hat: "morion", cuirass: true, sword: true } },
  },
  {
    id: "purse",
    hand: [910, 1500],
    c1: [610, 1680],
    c2: [570, 1260],
    homeT: 0.2,
    lift: -33,
    go: [84, 112],
    man: { x: 980, y: GROUND_LOW, flip: true, opts: { hat: "cap", cape: true } },
  },
];
// a share line runs from the partner's hand, past where his stake stands, to
// the hub: one smooth curve. The stake travels it from STUB_U on.
const FULL = SHARES.map((s) => cubic(s.hand, s.c1, s.c2, HUB, 140));
const HOME_N = SHARES.map((s) => Math.round(s.homeT * 140));
const STUB_U = SHARES.map((_, i) => FULL[i].s[HOME_N[i]] / FULL[i].len);
const HORSE_PX = 320 / HORSE_UNITS;
const ARMS_PX = 2.4;
const PURSE_PX = 2.9;
const SHIP_HOME = 2.1;

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
export const T = {
  gold: [150, 187] as const, // the heap rises out of the hold
  spill: [176, 189] as const, // bars slide over the gunwale
  glint: [186, 222] as const,
};
/** each stake's progress along its line, 0..1 */
export const stakeU = (i: number, f: number) => ease(f, SHARES[i].go[0], SHARES[i].go[1]);
const lineU = (i: number, f: number) => STUB_U[i] + (1 - STUB_U[i]) * stakeU(i, f);
const ARRIVE = SHARES.map((s) => s.go[1]);
/** how deep the laden hull has settled, ship units */
const SINK = 5;
export const goldU = (f: number) => clamp01((f - T.gold[0]) / (T.gold[1] - T.gold[0]));

export const shipState = (f: number) => {
  // to the hub, growing as each stake comes aboard
  const pos = at(FULL[0], lineU(0, f));
  const px =
    lerp(SHIP_HOME, SHIP_FULL - 0.6, stakeU(0, f)) +
    0.2 * (ease(f, ARRIVE[1] - 10, ARRIVE[1] + 6) + ease(f, ARRIVE[2] - 10, ARRIVE[2] + 6) + ease(f, ARRIVE[3] - 10, ARRIVE[3] + 6));
  const sails: [number, number, number] = [
    ease(f, ARRIVE[1] - 5, ARRIVE[1] + 12),
    ease(f, ARRIVE[2] - 5, ARRIVE[2] + 12),
    ease(f, ARRIVE[3] - 6, ARRIVE[3] + 6),
  ];
  const aboard = {
    horse: ease(f, ARRIVE[1] - 7, ARRIVE[1]),
    arms: ease(f, ARRIVE[2] - 7, ARRIVE[2]),
    coin: ease(f, ARRIVE[3] - 7, ARRIVE[3]),
  };
  const afloat = ease(f, 20, 60);
  const roll = (0.5 + 1.0 * afloat) * Math.sin(f * 0.15);
  const heave = (0.3 + 0.5 * afloat) * Math.sin(f * 0.13 + 1);
  const sink = SINK * smoothstep(goldU(f) * 1.04);
  return { pos, px, sails, aboard, roll, heave, sink };
};

// ---------------------------------------------------------------------------
// THE GOLD: a stack heaped on the deck from stem to stern, wider than the hull
// (world px, drawn in the ship's frame so it rolls and settles with it)
// ---------------------------------------------------------------------------
const HEAP_ROWS = [8, 7, 6, 5, 4, 3];
const HEAP: Bar[] = stackBars(HEAP_ROWS);
export const TOTAL_BARS = HEAP.length;
const HEAP_AT: P2 = [4, -13.6]; // ship units: on the waist's gunwale
export const barPresent = (i: number, f: number) => smoothstep((f - (T.gold[0] + ((T.gold[1] - T.gold[0] - 5) * i) / TOTAL_BARS)) / 5);
// the last bars, slipping off the flanks of the heap out over the rail: [x, y, tilt]
const SPILL: [number, number, number][] = [
  [-199, -29, -24],
  [199, -29, 24],
  [-150, -79, -15],
  [150, -79, 15],
];
const ONE_BAR: Bar[] = [{ x: 0, y: 0, row: 0 }];

// ---------------------------------------------------------------------------
// THE CAMERA: a coarse keyed track [f, cx, cy, k] through a damped follow.
// One push-in toward the ship, slow while the stakes come in, then on in.
// ---------------------------------------------------------------------------
const CAM_KEYS: [number, number, number, number][] = [
  [-60, 540, 1003, 0.945],
  [0, 540, 1000, 0.955],
  [60, 541, 990, 0.99],
  [112, 543, 978, 1.03],
  [132, 548, 968, 1.12],
  [156, 557, 952, 1.5],
  [178, 562, 945, 2.0],
  [190, 564, 944, 2.07],
  [260, 564, 944, 2.2],
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
  const OMEGA = 0.2; // per frame: the follow lags ~10 frames and never pops
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
      v[d] += (OMEGA * OMEGA * (tg[d] - x[d]) - 2 * OMEGA * v[d]) / SUB;
      x[d] += v[d] / SUB;
    }
  }
  return out;
})();
export const cameraAt = (f: number) => {
  const c = CAM_TABLE[Math.max(0, Math.min(CAM_TABLE.length - 1, Math.round(f)))];
  return { cx: c[0], cy: c[1], k: c[2] };
};

/** a run of engraved wave crests, n of them, w wide and a tall, starting at x */
const crests = (x: number, y: number, n: number, w: number, a: number) => {
  let d = `M${x.toFixed(2)},${y.toFixed(2)}`;
  for (let i = 0; i < n; i++) d += ` q${(w / 2).toFixed(2)},${(-a).toFixed(2)} ${w.toFixed(2)},0`;
  return d;
};

const PoolingAssets: React.FC<Props> = ({ backdropSrc, vignette }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const tx = W / 2 - cam.cx * k + drift.dx * 0.6;
  const ty = H / 2 - cam.cy * k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  // the engraved line keeps its screen weight while the page is wide, then
  // grows with the push-in so the close ship is not drawn in hairlines
  const weight = Math.pow(Math.max(1, k / 1.05), 0.85);
  const pxOf = (px: number) => (px * k) / weight;

  const ship = shipState(frame);
  const [shx, shy] = ship.pos;
  const waterY = shy + WATER * ship.px; // the sea does not sink with the hull
  const deck: P2 = [shx + 6 * ship.px, shy - 15 * ship.px];

  const gU = goldU(frame);
  const glintU = (frame - T.glint[0]) / (T.glint[1] - T.glint[0]);
  const heapW = HEAP_ROWS[0] * BAR_W;
  const heapH = HEAP_ROWS.length * BAR_RISE;

  // the sea round the hull: four rows of crests, each drifting at its own pace
  const u = ship.px; // one ship unit in world px
  const waveRows: { x0: number; y: number; n: number; w: number; a: number; v: number }[] = [
    { x0: -66, y: 0, n: 13, w: 10, a: 3.4, v: 0.11 },
    { x0: -56, y: 5.6, n: 7, w: 8, a: 3, v: -0.08 },
    { x0: 12, y: 6.4, n: 6, w: 8, a: 3, v: 0.07 },
    { x0: -30, y: 11.4, n: 7, w: 8, a: 2.8, v: -0.06 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* the umber page, world space, oversized so the camera never finds its edge */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${k})` }}>
        <Img src={staticFile(backdropSrc)} style={{ position: "absolute", left: -260, top: -440, width: 1600, height: 2800 }} />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="paAfloat">
            <rect x={-400} y={-600} width={1900} height={waterY + 600} />
          </clipPath>
          <clipPath id="paGlint">
            <path d={HEAP.map(barOutline).join(" ")} />
          </clipPath>
          <linearGradient id="paGlintGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFF1C8" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFF1C8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#FFF1C8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={camT}>
          {/* the share lines, drawn by the stakes; they fade away as beat 2 begins */}
          {SHARES.map((s, i) => {
            const lineOp = 1 - ease(frame, 122, 150);
            if (lineOp <= 0.004) return null;
            const lw = LINE_W / Math.max(1, k / 1.05);
            const c = FULL[i];
            const d = dOf(c.pts);
            const dash = `${(c.len * lineU(i, frame)).toFixed(1)} ${(c.len + 40).toFixed(1)}`;
            return (
              <g key={s.id} opacity={lineOp} fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} stroke={DARK} strokeOpacity={0.5} strokeWidth={lw + 6 / Math.max(1, k / 1.05)} strokeDasharray={dash} />
                <path d={d} stroke={INK} strokeWidth={lw} strokeDasharray={dash} />
              </g>
            );
          })}

          {/* the partners */}
          {SHARES.map((s) => (
            <g key={s.id} transform={`translate(${s.man.x} ${s.man.y}) scale(${s.man.flip ? -MAN_PX : MAN_PX} ${MAN_PX})`}>
              <Engraved parts={manParts(s.man.opts)} px={pxOf(MAN_PX)} />
            </g>
          ))}

          {/* the venture: one ship, afloat (the hull is cut at the water) */}
          <g clipPath="url(#paAfloat)">
            <g
              transform={`translate(${shx.toFixed(2)} ${(shy + (ship.heave + ship.sink) * u).toFixed(2)}) rotate(${ship.roll.toFixed(3)} 0 ${(WATER * u).toFixed(1)}) scale(${u.toFixed(4)})`}
            >
              <Ship px={pxOf(u)} sails={ship.sails} aboard={ship.aboard} frame={frame} waves={0} />
              {gU > 0 ? (
                <g>
                  {/* the heap's shadow on the hull, engraved */}
                  <path
                    d={Array.from({ length: 30 }, (_, n) => {
                      const x = -45 + n * 3.2;
                      const top = x < -33 ? -30 : x < -16 ? -23 : x < 28.4 ? -12.4 : -22.4;
                      return `M${x.toFixed(1)},${top} l2.6,${(4.2 + 1.6 * (n % 2)).toFixed(1)}`;
                    }).join(" ")}
                    fill="none"
                    stroke={DARK}
                    strokeOpacity={0.6 * smoothstep(gU * 2.2)}
                    strokeWidth={1.7 / pxOf(u)}
                    strokeLinecap="round"
                  />
                  <g transform={`translate(${HEAP_AT[0]} ${HEAP_AT[1]}) scale(${(1 / u).toFixed(5)})`}>
                    {SPILL.map(([x, y, tilt], n) => {
                      const pr = ease(frame, T.spill[0] + n * 2.5, T.spill[0] + n * 2.5 + 6);
                      if (pr <= 0.01) return null;
                      const dir = x < 0 ? 1 : -1;
                      return (
                        <g key={n} transform={`translate(${x + dir * 20 * (1 - pr)} ${y - 6 * (1 - pr)}) rotate(${(tilt * pr).toFixed(2)})`}>
                          <GoldBars bars={ONE_BAR} present={() => Math.min(1, pr * 2)} px={pxOf(1)} from={0} />
                        </g>
                      );
                    })}
                    <GoldBars bars={HEAP} present={(i) => barPresent(i, frame)} px={pxOf(1)} from={18} solid />
                    {glintU > 0 && glintU < 1 ? (
                      <g clipPath="url(#paGlint)">
                        <rect
                          x={-heapW / 2 - 120 + (heapW + 240) * glintU - 45}
                          y={-heapH - 40}
                          width={90}
                          height={heapH + 60}
                          fill="url(#paGlintGrad)"
                          transform="skewX(-18)"
                        />
                      </g>
                    ) : null}
                  </g>
                </g>
              ) : null}
            </g>
          </g>

          {/* the stakes on their way in; each shrinks into the hull as it goes aboard */}
          {SHARES.map((s, i) => {
            if (s.id === "ship") return null;
            const fa = ARRIVE[i];
            const fade = 1 - ease(frame, fa - 3, fa + 0.5);
            if (fade <= 0.01) return null;
            const su = stakeU(i, frame);
            const [lx, ly] = at(FULL[i], lineU(i, frame));
            const board = ease(frame, fa - 15, fa - 2);
            const x = lerp(lx, deck[0], board);
            const y = lerp(ly - s.lift * (1 - smoothstep(su / 0.7)), deck[1], board);
            const sc = 1 - 0.8 * ease(frame, fa - 13, fa - 1);
            const moving = smoothstep(su / 0.12) * (1 - smoothstep((su - 0.86) / 0.14));
            if (s.id === "horse") {
              const px = HORSE_PX * sc;
              return (
                <g key={s.id} opacity={fade} transform={`translate(${x} ${y}) scale(${-px} ${px}) rotate(${(8 * moving).toFixed(2)})`}>
                  <Horse px={pxOf(px)} phase={(frame - s.go[0]) / 3.4} gait={moving} />
                </g>
              );
            }
            if (s.id === "arms") {
              const px = ARMS_PX * sc;
              return (
                <g key={s.id} opacity={fade} transform={`translate(${x} ${y}) scale(${px}) rotate(${(16 * smoothstep(su)).toFixed(2)})`}>
                  <Arms px={pxOf(px)} />
                </g>
              );
            }
            const px = PURSE_PX * sc;
            return (
              <g key={s.id} opacity={fade} transform={`translate(${x} ${y}) scale(${px}) rotate(${(-7 * Math.sin(Math.PI * su)).toFixed(2)})`}>
                <Engraved parts={PURSE_PARTS} px={pxOf(px)} />
              </g>
            );
          })}

          {/* the water: the waterline across the hull, and the crests below it */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {waveRows.map((r, n) => {
              const span = r.w * u;
              const shift = (((frame * r.v) % 1) + 1) % 1; // the crests travel one wavelength and repeat
              const lift = (n === 0 ? 0.5 : 0.9) * u * Math.sin(frame * 0.14 + n * 1.7);
              const d = crests(shx + (r.x0 + (shift - 0.5) * r.w) * u, waterY + r.y * u + lift, r.n, span, r.a * u);
              const w = (n === 0 ? 1.25 : 1.05) * u;
              return (
                <g key={n}>
                  <path d={d} stroke={DARK} strokeOpacity={0.6} strokeWidth={w + 5 / k} />
                  <path d={d} stroke={INK} strokeWidth={w} />
                </g>
              );
            })}
          </g>
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
