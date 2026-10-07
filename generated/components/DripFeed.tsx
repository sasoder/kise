import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BRATTAHLID,
  DARK,
  INK,
  INK_CONTEXT,
  LAND,
  LANSE,
  Longhouse,
  MapStack,
  NorseRoute,
  PaperTop,
  ROUTE_VINLAND,
  SEA,
  SettlementMark,
  WorldSvg,
  clamp01,
  landAt,
  makeCamera,
  mixColor,
  smootherstep,
  smoothstep,
  swayCam,
  type Cam,
  type P2,
} from "./vikAtlanticShared";

// ---------------------------------------------------------------------------
// DripFeed: cut E of "Sheppard_Vikings" (Dwarkesh with Si Sheppard),
// 51_DripFeed.mov. Dwarkesh map style on the North Atlantic world
// (vikAtlanticShared, builder D's; this is cut D's picture, developed). Opaque,
// 1080x1920, 24 fps. No labels, no numbers.
//
// THE LINE: "(If the Vikings had been able to claim a long-term presence in the
// new world, they may have been able to) drip feed European technology,
// European beasts of burden, and above all, European diseases slowly into the
// Americas."
// In 51.176 s, out 57.516 s of the sequence (23.976 fps: seq f1227 .. f1379) =
// 152 frames + 2 tail frames holding the last state: DURATION 154.
//
// THE MECHANISM: the foothold cut D saw extinguished now stands, alight in
// orange, and the sea route to it is a live orange line; things come down that
// line one at a time, like drops, and seep slowly inland.
// ORANGE = WHAT IS PASSED ON: the drip feed (the line, the drops, the stain).
// All geography is cream.
//
// THE GESTURES (local frames; word onsets from cut_frames.md). Nothing else moves.
//   f0     opening state: the route Greenland -> Labrador coast -> the tip of
//          Newfoundland is a solid orange line; the longhouse at L'Anse aux
//          Meadows stands in steady orange (cut D's hall, D's place); the first
//          drop is already on the line, about a third of the way down ("drip
//          (-3) feed (4)" straddles the cut). The camera is already drifting.
//   DROPS  an orange bead-ring on a dark core carrying one orange line glyph
//          slides down the line, speeding up as a drop does, slips behind the
//          hall and comes out below it smaller, braking in one eased settle to
//          its place on the peninsula just inland, where it stays as a mark:
//     1. "European (12) technology (23-36)": a Norse bearded axe (the site had
//        a smithy). 150 px ring. At the hall f27, settled by ~f52.
//     2. "European (41) beasts (49) of burden (63-71)": a standing horse (the
//        incaGlyphs horse, no rider, as line). 150 px. At the hall f62.
//     3. "and above (76) all (82), European (91) diseases (97-111)": a pox
//        mark, a cluster of pustule rings. 202 px (1.35 x). At the hall f100,
//        settled f107.
//     Three equal marks (78 px rings) accumulate, evenly spaced from the hall
//     down the peninsula into the island: pox, horse, axe (first = furthest).
//   BEADS  between the three, tiny plain orange beads keep dripping down the
//          line on the same law and vanish into the hall, to the last frame.
//   f101-154 "slowly (111) into (131) the Americas (141)": from the foothold an
//          orange stain seeps into the land by distance: one front expanding
//          radially (a touch faster south-west), fine orange hatch on land
//          only, strongest at the foothold and thinning toward the front,
//          whose last ~60 px break into sparse short strokes (no outline, no
//          fill). Down the peninsula into Newfoundland, over the strait onto
//          the Labrador / Quebec shore, further land only as the radius gets
//          there. Still advancing at the last frame (~8.5 px / f on screen).
//   f95-150 ONE eased camera move pulls back and drifts south-west: the
//          foothold upper right, the body of the continent the stain is
//          seeping into centre-left. Before it (f0-95) and after it (f150-154)
//          the camera only creeps.
//
// SOURCES (CLIP_SPEC.md "Verified facts"): L'Anse aux Meadows 51.596 N
// 55.533 W, the only confirmed Norse site in North America: eight turf
// buildings incl. three halls and a smithy (bog-iron working); occupied AD
// 1021 (Kuitems et al., Nature 2022). The saga route Greenland -> Davis Strait
// -> Helluland -> Markland -> Vinland as builder D's sea line (unlabelled). The
// Greenland Norse kept cattle, sheep, goats and horses and smelted / worked
// iron. The line is a counterfactual ("if ... they may have been able to"):
// the stain is the speaker's hypothetical, not a historical extent. Map:
// Natural Earth 10m (public domain), no borders.
// ---------------------------------------------------------------------------
export const FPS = 24;
export const DURATION = 154;

export const schema = z.object({
  vignette: z.number().min(0).max(1),
  glyphInk: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, glyphInk: ACCENT });

// ---------------------------------------------------------------------------
// THE PLACE
// ---------------------------------------------------------------------------
const R = ROUTE_VINLAND;
/** cut D's hall: the middle of its foot (triedToColonizeMotion's HALL_AT) */
const HALL_AT: P2 = [429.8, 1050.0];
const HALL_REF_K = 1.78;
const hallSizeAt = (k: number) => 168 * Math.pow(k / HALL_REF_K, 0.22); // 168 px at the opening, 152 px in the end wide
// the longhouse's body in its 100-unit frame (vikAtlanticShared's LH_BODY): an opaque ground of our own
// under the shared glyph, so a drop passing behind the hall does not show through it
const HALL_BODY = "M-50,0 L-47.5,-9 C-41,-22 -27,-30 0,-31 C27,-30 41,-22 47.5,-9 L50,0 Z";
const HALL_GROUND = mixColor(LAND, DARK, 0.66);

// the way inland: from the landing down the middle of the Great Northern Peninsula (on land, checked below)
const INLAND_KEYS: P2[] = [
  [LANSE[0], LANSE[1]],
  [421, 1060],
  [410, 1071],
  [392, 1092],
  [378, 1120],
  [372, 1150],
  [382, 1180],
  [402, 1206],
  [428, 1226],
  [455, 1234],
];
const INLAND: { pts: P2[]; cum: number[]; len: number } = (() => {
  // Catmull-Rom through the keys, sampled
  const K = INLAND_KEYS;
  const pts: P2[] = [];
  for (let i = 0; i < K.length - 1; i++) {
    const p0 = K[Math.max(0, i - 1)];
    const p1 = K[i];
    const p2 = K[i + 1];
    const p3 = K[Math.min(K.length - 1, i + 2)];
    for (let j = 0; j < 12; j++) {
      const t = j / 12;
      const t2 = t * t;
      const t3 = t2 * t;
      pts.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  pts.push(K[K.length - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
})();
const inlandAt = (d: number): P2 => {
  const t = Math.max(0, Math.min(INLAND.len, d));
  let i = 1;
  while (i < INLAND.cum.length - 1 && INLAND.cum[i] < t) i++;
  const u = (t - INLAND.cum[i - 1]) / (INLAND.cum[i] - INLAND.cum[i - 1] || 1);
  const a = INLAND.pts[i - 1];
  const b = INLAND.pts[i];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
};
/** a point of the drops' road: q <= 0 on the sea route (q = -distance to the landing), q > 0 inland */
const roadAt = (q: number): P2 => (q <= 0 ? R.pointAt(R.len + q) : inlandAt(q));

// ---------------------------------------------------------------------------
// THE DROPS
// ---------------------------------------------------------------------------
type Kind = "axe" | "horse" | "pox";
type Drop = { kind: Kind; fHall: number; vEnd: number; acc: number; slot: number; dia: number };
const V_MIN = 7; // world px / f far up the line
const BRAKE_AT = 40; // world px before the landing: the settle begins
const DROPS: Drop[] = [
  { kind: "axe", fHall: 27, vEnd: 15.5, acc: 0.24, slot: 236, dia: 150 },
  { kind: "horse", fHall: 62, vEnd: 20, acc: 0.36, slot: 152, dia: 150 },
  { kind: "pox", fHall: 100, vEnd: 19, acc: 0.34, slot: 68, dia: 202 },
];
for (const d of DROPS) {
  const [x, y] = inlandAt(d.slot);
  if (!landAt(x, y)) throw new Error(`DripFeed: the ${d.kind} mark is not on land`);
}
/** distance still to run to the landing, tau frames before the (unbraked) landing: a drop speeds up as it comes */
const fallDist = (tau: number, vEnd: number, acc: number) => {
  if (tau <= 0) return vEnd * tau;
  const tc = (vEnd - V_MIN) / acc;
  if (tau <= tc) return vEnd * tau - 0.5 * acc * tau * tau;
  return vEnd * tc - 0.5 * acc * tc * tc + V_MIN * (tau - tc);
};
/** a drop's road coordinate q at frame f (see roadAt), and whether it has settled */
const dropQ = (d: Drop, f: number) => {
  // the frame at which it reaches the brake point
  const tc = (d.vEnd - V_MIN) / d.acc;
  let tauB = BRAKE_AT / d.vEnd;
  for (let i = 0; i < 6; i++) tauB = (BRAKE_AT + 0.5 * d.acc * Math.min(tauB, tc) ** 2) / d.vEnd;
  const fB = d.fHall - tauB;
  if (f <= fB) return { q: -fallDist(d.fHall - f, d.vEnd, d.acc), settle: 0 };
  const vB = d.vEnd - d.acc * tauB;
  const D = BRAKE_AT + d.slot;
  const n = (1.5 * D) / vB; // frames of the settle: one eased brake from vB to rest
  const u = clamp01((f - fB) / n);
  const p = D * (3 * u * u - 2 * u * u * u) + vB * n * (u * u * u - 2 * u * u + u);
  return { q: -BRAKE_AT + p, settle: u };
};
// tiny plain beads between the three: the frame each one reaches the hall
export const BEAD_HALL = [9, 44, 80, 118, 131, 144, 157, 170, 183, 196, 209, 222, 235, 248, 261, 274, 287];
const BEAD = { vEnd: 19, acc: 0.34 };
const BEAD_R = 5.6; // screen px

// the mark a drop leaves: its ring at MARK_SCALE of the drop (and a little smaller as the camera pulls back)
const MARK_DIA = 78; // screen px, the same for all three, at every zoom

// ---------------------------------------------------------------------------
// THE GLYPHS: one family. Ring units: the ring's outer radius = 50; the glyph
// lives inside r ~36. One stroke weight, round joins, no fills (the ring's dark
// core is the only fill).
// ---------------------------------------------------------------------------
const CORE = "#15120E";
// a Norse bearded axe: a haft, the eye at its top, the blade's long edge hanging below the eye (the beard)
const AXE_D = [
  "M-7.5,36 L-7.5,-36 L-0.5,-36 L-0.5,36 Z", // the haft
  "M-0.5,-29 C9,-29 18,-32 27,-41 C37,-27 37,-7 28,8 C23,-3 15,-12 7,-15.5 L-0.5,-16.5", // the head
];
// a standing horse in profile (incaGlyphs' H_BODY outline, its STAND legs as lines, no rider)
const HORSE_BODY =
  "M-20,-1.5 C-21,-6.6 -18.6,-10.6 -13.6,-11.2 C-9.6,-11.6 -5,-9.8 -0.6,-9.8 C3.6,-9.8 7.6,-11.4 11,-12.4 " +
  "C15.6,-15.4 20.4,-21.4 24.6,-25.8 L24.4,-29.8 L27,-26.6 C30.4,-24.2 34.6,-19.2 37.6,-15.4 C38.8,-13.8 38,-11.6 36,-11.6 " +
  "C33.6,-11.8 31.2,-13 29.2,-14.6 C28.4,-15.2 27.8,-15.6 27.4,-15.4 " +
  "C25.2,-11.6 22.8,-6.6 20.6,-2.2 C19.6,1.8 17.2,4.6 13.8,6 C7.6,7.8 -2.4,8 -9.2,7 " +
  "C-14,6.2 -17.6,4.6 -19.2,2.2 C-19.8,0.9 -20,-0.2 -20,-1.5 Z";
const HORSE_D = [
  HORSE_BODY,
  "M-19.4,-7.4 C-25.6,-8.6 -30.6,-5 -32.6,4.6", // the tail
  "M16.2,4.6 L17.4,12.4 L18.6,21 M10.6,6.6 L9.6,13.4 L8.6,21", // fore legs
  "M-11.6,6.6 L-12.6,13 L-10.4,21 M-17.4,4 L-19.6,12 L-19.2,21", // hind legs
];
// a pox mark: a cluster of pustules (small rings, the larger ones with their pit)
const POX: [number, number, number, boolean][] = [
  [-13, -13, 9.2, true],
  [9.5, -19, 7.2, true],
  [19, 2.5, 9.4, true],
  [-1.5, 6.5, 7.6, true],
  [-21.5, 10, 6.2, false],
  [6, 24.5, 6.6, false],
  [-6, -29.5, 4.6, false],
];

const DropGlyph: React.FC<{
  kind: Kind | "plain";
  x: number;
  y: number;
  cam: Cam;
  dia: number; // screen px, the ring's outer diameter
  ink: string;
  core?: number; // the dark core's opacity
}> = ({ kind, x, y, cam, dia, ink, core = 0.95 }) => {
  if (dia <= 0.5) return null;
  const u = dia / 100 / cam.k; // world px per ring unit
  const sw = 100 / dia; // 1 screen px in ring units
  const ringW = Math.max(2.8, Math.min(6, dia * 0.042)) * sw;
  const glyphW = Math.max(2.3, Math.min(5.4, dia * 0.036)) * sw;
  const stroke = { fill: "none", stroke: ink, strokeWidth: glyphW, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${u.toFixed(6)})`}>
      <circle r={50 + 2.2 * sw} fill={DARK} fillOpacity={0.6} />
      {kind === "plain" ? <circle r={50} fill={ACCENT} /> : null}
      <circle r={50 - ringW / 2} fill={CORE} fillOpacity={core} />
      <circle r={50 - ringW / 2} fill="none" stroke={ACCENT} strokeWidth={ringW} />
      {kind === "axe" ? (
        <g transform="rotate(28) translate(-11 3) scale(0.88)">
          {AXE_D.map((d, i) => (
            <path key={i} d={d} {...stroke} />
          ))}
        </g>
      ) : null}
      {kind === "horse" ? (
        <g transform="translate(-2.5 2.5) scale(0.95)">
          {HORSE_D.map((d, i) => (
            <path key={i} d={d} {...stroke} />
          ))}
        </g>
      ) : null}
      {kind === "pox" ? (
        <g transform="translate(1 2) scale(1.06)">
          {POX.map(([px, py, r, pit], i) => (
            <g key={i}>
              <circle cx={px} cy={py} r={r} {...stroke} />
              {pit ? <circle cx={px} cy={py} r={glyphW * 0.55} fill={ink} /> : null}
            </g>
          ))}
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE STAIN: a seep by DISTANCE from the foothold. One front expands radially
// from L'Anse aux Meadows (a touch faster to the south-west), shown on land
// only: down the Great Northern Peninsula into Newfoundland, over the narrow
// strait onto the nearest Labrador / Quebec shore, and onto further land only
// when the radius gets there. World-anchored 45 deg hatch (octave-stable
// through the zoom), strongest at the foothold and thinning toward the front;
// the last ~60 screen px break into sparse short strokes. No outline: the
// leading edge is where the hatch ends.
// ---------------------------------------------------------------------------
const STAIN_AT: P2 = [LANSE[0], LANSE[1]];
const F_STAIN = 101; // the third drop has just passed the hall
const STAIN_V = 7.65; // world px / f in the fastest direction, once under way (8.5 screen px / f in the end framing)
const STAIN_TAU = 3;
/** the front's reach (world px, fastest direction) at frame f: eases off from rest, then a steady creep */
const stainReach = (f: number) => {
  const t = f - F_STAIN;
  return t <= 0 ? 0 : STAIN_V * (t - STAIN_TAU * (1 - Math.exp(-t / STAIN_TAU)));
};
const FAST_A = Math.atan2(0.7071, -0.7071); // south-west (screen convention)
/** the cost of a point: its distance from the foothold over the local speed (1 south-west .. 0.9 north-east) */
const stainCost = (x: number, y: number) => {
  const dx = x - STAIN_AT[0];
  const dy = y - STAIN_AT[1];
  const r = Math.hypot(dx, dy);
  if (r < 1e-6) return 0;
  return r / (0.95 + 0.05 * Math.cos(Math.atan2(dy, dx) - FAST_A));
};
const SQ = Math.SQRT1_2;
const HATCH_SP = 3; // world px between hatch lines at the finest (the mid lines fade with the octave)
const HATCH_W = 1.8; // screen px
const N_BUCKET = 14;
const EDGE_PX = 60; // screen px behind the front over which the hatch breaks into short strokes
const DASH = 6.5; // world px: one short stroke's cell
const stainOpacity = (q: number) => 1 - 0.85 * Math.pow(q, 0.75); // full at the foothold .. 0.15 at the front // q 0 at the foothold .. 1 at the front
const cellHash = (n: number, c: number) => {
  const v = Math.sin(n * 127.1 + c * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const buildStain = (reach: number, k: number) => {
  if (reach <= 0.5) return null;
  const L2 = Math.log2(k);
  const mid = clamp01(L2 - Math.floor(L2)); // the odd lines' weight in this octave
  const sp = HATCH_SP / Math.pow(2, Math.floor(L2));
  const ds = 1.3;
  const rb = reach + 2;
  const uo = (STAIN_AT[0] + STAIN_AT[1]) * SQ;
  const vo = (STAIN_AT[0] - STAIN_AT[1]) * SQ;
  const even: string[] = Array.from({ length: N_BUCKET }, () => "");
  const odd: string[] = Array.from({ length: N_BUCKET }, () => "");
  const n0 = Math.ceil((uo - rb) / sp);
  const n1 = Math.floor((uo + rb) / sp);
  const m0 = Math.ceil((vo - rb) / ds);
  const m1 = Math.floor((vo + rb) / ds);
  const P = (u: number, v: number) => `${((u + v) * SQ).toFixed(2)},${((u - v) * SQ).toFixed(2)}`;
  const edge = EDGE_PX / k;
  for (let n = n0; n <= n1; n++) {
    const isOdd = ((n % 2) + 2) % 2 === 1;
    if (isOdd && mid < 0.02) continue;
    const out = isOdd ? odd : even;
    const u = n * sp;
    let runStart = 0;
    let runBucket = -1;
    for (let m = m0; m <= m1 + 1; m++) {
      const v = m * ds;
      let b = -1;
      if (m <= m1) {
        const x = (u + v) * SQ;
        const y = (u - v) * SQ;
        const c = stainCost(x, y);
        if (c < reach && landAt(x, y)) {
          let a = stainOpacity(c / reach);
          const z = (reach - c) / edge; // 0 at the front .. 1 where the hatch is whole
          if (z < 1) {
            // short strokes: each cell of the line comes in as the front leaves it behind
            const cell = Math.floor(v / DASH);
            const inCell = v / DASH - cell;
            const keep = 0.1 + 0.9 * smoothstep(z);
            const h = cellHash(n, cell);
            a *= inCell < 0.3 + 0.7 * smoothstep(z * 1.15) ? smoothstep((keep - h) / 0.16) : 0;
          }
          b = Math.min(N_BUCKET - 1, Math.round(a * N_BUCKET) - 1);
        }
      }
      if (b !== runBucket) {
        if (runBucket >= 0) out[runBucket] += `M${P(u, runStart)}L${P(u, v - ds * 0.5)}`;
        runStart = v - ds * 0.5;
        runBucket = b;
      }
    }
  }
  return { even, odd, mid };
};

// ---------------------------------------------------------------------------
// THE CAMERA: authored, keyed on the foothold's place on screen. A creep while
// the drops fall, ONE eased move f95 -> 150 (pull back + drift south-west), a
// creep after it.
// ---------------------------------------------------------------------------
export const cameraAt = makeCamera([
  { f: 0, k: 1.74, wx: LANSE[0], wy: LANSE[1], sx: 566, sy: 796 },
  { f: 95, k: 1.82, wx: LANSE[0], wy: LANSE[1], sx: 572, sy: 772 },
  { f: 150, k: 1.12, wx: LANSE[0], wy: LANSE[1], sx: 846, sy: 756 },
  { f: 200, k: 1.075, wx: LANSE[0], wy: LANSE[1], sx: 856, sy: 748 },
]);

/**
 * What DripFeedLong (47_DripFeed.mov) adds BEFORE this cut's f0; absent (undefined) the scene is this cut's own.
 *   headS   how far the orange line has been redrawn from Greenland (world px along the route); ahead of it
 *           the route is cut D's faint cream dashed trace, and nothing rides the line there
 *   nib     0..1 the pen's nib at the head of the line
 *   hallLit 0 cut D's cream ghost .. 1 the hall alight in orange
 */
export type Prelude = { headS: number; nib: number; hallLit: number };
/** cut D leaves the hall a cream ghost at this ink opacity */
const GHOST_OP = 0.42;

/**
 * THE SCENE on its own clock: `frame` is this cut's local frame (it may be negative: the camera's first key
 * extends back linearly, the drops and beads are further up the line). DripFeed plays it from f0; DripFeedLong
 * plays it from f-100 with a `prelude` and earlier beads.
 */
export const DripFeedScene: React.FC<Props & { frame: number; beadHall?: number[]; prelude?: Prelude }> = ({
  vignette,
  glyphInk,
  frame,
  beadHall = BEAD_HALL,
  prelude,
}) => {
  const cam = swayCam(cameraAt(frame), frame);
  // nothing rides the line ahead of the pen that is redrawing it
  const live = (dist: number) => (prelude ? smoothstep((prelude.headS - (R.len - dist)) / 24) : 1);
  const k = cam.k;
  const px = (v: number) => v / k;

  // the stain
  const reach = stainReach(frame);
  const stain = buildStain(reach, k);
  const stainIn = smoothstep((frame - F_STAIN) / 8);

  // the tiny beads
  const beads: { x: number; y: number; r: number }[] = [];
  for (const fh of beadHall) {
    const dist = fallDist(fh - frame, BEAD.vEnd, BEAD.acc);
    if (dist <= 0 || dist >= R.len) continue;
    const [x, y] = R.pointAt(R.len - dist);
    // born at the Greenland settlement, gone into the hall
    const s = smoothstep(dist / 16) * smoothstep((R.len - dist) / 20) * live(dist);
    beads.push({ x, y, r: BEAD_R * s });
  }

  // the three drops
  const hallSize = hallSizeAt(k);
  const drops = DROPS.map((d) => {
    const { q, settle } = dropQ(d, frame);
    const [x, y] = roadAt(q);
    // it shrinks to its mark as it passes the hall: full size until 46 world px out, the mark 30 px in
    const shrink = smootherstep((q + 46) / 76);
    // far up the line it is a plain bead like the others; it swells to its ring as it nears the frame
    // (full 470 world px out, above the frame's top edge in the opening framing), so two rings never share the frame
    const swell = 1 - smoothstep((-q - 470) / 110);
    const full = d.dia + (MARK_DIA - d.dia) * shrink;
    const dia = (2 * BEAD_R + (full - 2 * BEAD_R) * swell) * (q < 0 ? live(-q) : 1);
    return { d, x, y, dia, plain: swell < 0.02, core: 0.95 - 0.12 * shrink, visible: -q < R.len - 20, settle };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        {/* the stain: hatch on land, thinning toward the front */}
        {stain ? (
          <g opacity={stainIn}>
            <g fill="none" stroke={ACCENT} strokeWidth={px(HATCH_W)} strokeLinecap="butt">
              {stain.even.map((d, b) => (d ? <path key={`e${b}`} d={d} strokeOpacity={(b + 1) / N_BUCKET} /> : null))}
              {stain.odd.map((d, b) => (d ? <path key={`o${b}`} d={d} strokeOpacity={((b + 1) / N_BUCKET) * stain.mid} /> : null))}
            </g>
          </g>
        ) : null}
        {/* the live line, Greenland -> the foothold */}
        {prelude && prelude.headS < R.len ? (
          <NorseRoute cam={cam} from={prelude.headS / R.len} color={INK} dashed opacity={INK_CONTEXT} width={3.4} />
        ) : null}
        <NorseRoute cam={cam} width={5.2} progress={prelude ? prelude.headS / R.len : 1} />
        {prelude && prelude.nib > 0.002 && prelude.headS > 0.5 ? (
          <NorseRoute cam={cam} progress={prelude.headS / R.len} from={Math.max(0, prelude.headS - 0.5) / R.len} head opacity={prelude.nib} width={5.2} />
        ) : null}
        <SettlementMark x={BRATTAHLID[0]} y={BRATTAHLID[1]} cam={cam} />
        {beads.map((b, i) =>
          b.r > 0.3 ? (
            <g key={`b${i}`}>
              <circle cx={b.x} cy={b.y} r={px(b.r + 1.7)} fill={DARK} fillOpacity={0.62} />
              <circle cx={b.x} cy={b.y} r={px(b.r)} fill={ACCENT} />
            </g>
          ) : null,
        )}
        {/* the drops and the marks they leave (earlier marks under later drops) */}
        {drops.map((q) => (q.visible ? <DropGlyph key={q.d.kind} kind={q.plain ? "plain" : q.d.kind} x={q.x} y={q.y} cam={cam} dia={q.dia} ink={glyphInk} core={q.core} /> : null))}
        {/* the foothold: cut D's hall, alight */}
        <path
          d={HALL_BODY}
          transform={`translate(${HALL_AT[0]} ${HALL_AT[1]}) scale(${(hallSize / 100 / k).toFixed(6)})`}
          fill={HALL_GROUND}
        />
        {prelude && prelude.hallLit < 1 ? (
          <Longhouse
            x={HALL_AT[0]}
            y={HALL_AT[1]}
            cam={cam}
            size={hallSize}
            ground={0}
            ink={mixColor(INK, ACCENT, prelude.hallLit)}
            opacity={GHOST_OP + (1 - GHOST_OP) * prelude.hallLit}
          />
        ) : (
          <Longhouse x={HALL_AT[0]} y={HALL_AT[1]} cam={cam} size={hallSize} ground={0} />
        )}
      </WorldSvg>
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

const DripFeed: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  return <DripFeedScene {...props} frame={frame} />;
};

export default DripFeed;
