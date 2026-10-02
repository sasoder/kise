// ---------------------------------------------------------------------------
// ambushMotion: LetsOffTheAmbush (cut 3 of the Pizarro / Atahualpa clip) --
// every moving thing as pure maths (no React), so the check scripts read the
// exact motion the component draws. See LetsOffTheAmbush.tsx's header for the
// words, the gestures, the colour rule and the sources. All positions are in
// the Cajamarca local plan (metres, x east, y south; incaShared), time in
// frames at 24 fps.
//   the plaza    incaShared's PLAZA: three halls (northeast, west, southeast),
//                20 doorways each, the two gates (NW, SW), the ushnu platform
//                ("fortress") in the east corner with its stair on the square
//   the litter   at the centroid of the open square (the triangle of the hall
//                fronts), carried by a block of 80 bearers (FACTS 7)
//   the crowd    6,000 cream dots (1 dot = 1 man; 80 of them the bearers),
//                blue-noise packed in the square (packCrowd), then a
//                position-based crowd simulation: the press and sway toward the
//                litter, the recoil wave away from the guns and the doors, the
//                parting before the horsemen; smoothed in time
//   the 168      62 horse (three groups, one per hall: 21 / 20 / 21) + 106 foot
//                (Pizarro + 24 on the platform; Candia + 8 arquebusiers at its
//                parapet; 72 at the two gates); hidden at the 0.3 rung (the
//                horse as glyphs waiting in their halls, two deep behind the
//                middle doorways, facing them), they rise and step up on one
//                wave from the platform
//   the horses   the same glyphs burst straight out of their own doorways (all
//                at the full burst until clear of the hall), then each hall's
//                riders gather on curving paths into one loose body (a charging
//                line two or three deep) that drives toward the litter,
//                deepening as it goes and slowing in the crush; nobody ever
//                runs backward
//   the guns     two falconets on the platform (shots f73, f77) and the
//                arquebusiers' ripple (f85..f92): flashes, recoil, smoke puffs
//   the camera   four long C1 glides (creep in; to the platform; pull back over
//                the square; a push-in on the litter following the charge),
//                each a cosine-tapered velocity bump per channel (ln k, the
//                framed point), overlapping so the camera never stops, and a
//                slow push-in that holds the platform
// ---------------------------------------------------------------------------
import {
  CAM_LIFT,
  PLAZA,
  clamp01,
  hash,
  makeTrack,
  packCrowd,
  smoothstep,
  smootherstep,
  type Bump,
  type Cam,
  type Gate,
  type Hall,
  type P2,
} from "./incaShared";

// ---------------------------------------------------------------------------
// TIMELINE. In-point 71.94 s (the SRT, edit timeline); f = round((t - 71.94) * 24)
// ---------------------------------------------------------------------------
export const FPS = 24;
export const IN_POINT = 71.94;
/** "horses" ends 78.70 s: round((78.70 - 71.94) * 24) = round(162.24) = 162, + the 16-frame tail */
export const DURATION = 178;
export const LAST = DURATION - 1;
/** word onsets (frames) */
export const W = {
  thats: 0,
  when: 9,
  pizarro: 11,
  lets: 19,
  off: 25,
  the: 31,
  ambush: 33,
  he: 46,
  lets2: 49,
  fly: 53,
  with: 59,
  all: 62,
  his: 67,
  artillery: 75,
  and: 83,
  all2: 88,
  his2: 90,
  musketry: 92,
  for: 102,
  the2: 106,
  shock: 112,
  value: 118,
  unleashes: 135,
  his3: 145,
  horses: 149,
  lineEnd: 162,
};

// ---------------------------------------------------------------------------
// small vector maths
// ---------------------------------------------------------------------------
const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P2, s: number): P2 => [a[0] * s, a[1] * s];
const dot = (a: P2, b: P2) => a[0] * b[0] + a[1] * b[1];
const len = (a: P2) => Math.hypot(a[0], a[1]);
const unit = (a: P2): P2 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
const perp = (a: P2): P2 => [-a[1], a[0]];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const centroid = (pts: P2[]): P2 => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
/** the intersection of lines a0a1 and b0b1 */
const lineX = (a0: P2, a1: P2, b0: P2, b1: P2): P2 => {
  const d1 = sub(a1, a0);
  const d2 = sub(b1, b0);
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  const t = ((b0[0] - a0[0]) * d2[1] - (b0[1] - a0[1]) * d2[0]) / den;
  return add(a0, mul(d1, t));
};
// ---------------------------------------------------------------------------
// THE PLAZA (incaShared)
// ---------------------------------------------------------------------------
type Fortress = {
  rect: P2[];
  centre: P2;
  toSquare: P2;
  size: number;
  stair: { rect: P2[]; treads: [P2, P2][]; foot: P2; top: P2; w: number };
};
export const HALLS = PLAZA.halls as Hall[];
const hallIx = (name: string) => HALLS.findIndex((h) => h.name === name);
export const H_NE = hallIx("northeast");
export const H_W = hallIx("west");
export const H_SE = hallIx("southeast");
export const FORT = PLAZA.fortress as Fortress;
export const GATES = PLAZA.gates as Gate[];
export const INTERIOR = PLAZA.interior as P2[][];
const front = (h: Hall) => h.front as [P2, P2];
/** the open square's triangle: the three hall fronts' intersections */
export const V_NW = lineX(...front(HALLS[H_NE]), ...front(HALLS[H_W]));
export const V_SW = lineX(...front(HALLS[H_W]), ...front(HALLS[H_SE]));
export const V_E = lineX(...front(HALLS[H_SE]), ...front(HALLS[H_NE]));
/** Atahualpa's litter: in the middle of the square (the triangle's centroid) */
export const LITTER: P2 = centroid([V_NW, V_SW, V_E]);

// ---------------------------------------------------------------------------
// THE 168 (FACTS 1, 4): 62 horse + 106 foot
//   horse  three groups (Hernando Pizarro, Soto, Benalcazar), one per hall:
//          northeast 21, west 20, southeast 21 (Zarate's "three squadrons of 20"
//          with the modern 62); two to a doorway on the middle doors
//   foot   Pizarro + 24 on the platform (Trujillo: "en la fortaleza con 24
//          hombres"); Candia + 8 arquebusiers at its parapet with the two guns
//          (Mena: 8-9 escopeteros); the other 72 at the two gates (Xerez, Mena)
// ---------------------------------------------------------------------------
export const N_HORSE = 62;
export const N_PIZARRO = 25;
export const N_CANDIA = 9;
export const N_GATE = 72;
export const N_SPANIARDS = N_HORSE + N_PIZARRO + N_CANDIA + N_GATE;
if (N_SPANIARDS !== 168 || N_PIZARRO + N_CANDIA + N_GATE !== 106) throw new Error("the 168 do not add up");
export const RIDERS_PER_HALL = [0, 0, 0];
RIDERS_PER_HALL[H_NE] = 21;
RIDERS_PER_HALL[H_W] = 20;
RIDERS_PER_HALL[H_SE] = 21;
if (RIDERS_PER_HALL.reduce((s, v) => s + v, 0) !== N_HORSE) throw new Error("the horse do not add up");

// THE HORSEMAN GLYPH (incaGlyphs' Horseman): world sizes and its on-screen axes
export const HORSE_LEN_M = 6.8; // charging: the glyph's 76 units, in metres (30 px at k 4.4)
export const HORSE_WAIT_M = 5.2; // waiting in the halls: scaled to fit two deep in a 12 m hall
export const WAIT_STEP = 0.8; // m the waiting horsemen step up toward their doorways when the trap opens
/** the glyph's tilt: the profile is mirrored for westward travel and tilted
 *  toward its heading, clamped (tilted past ~25 deg the diagonal groups read as diving or rearing) */
export const HORSE_TILT = { gain: 0.45, max: 22 };
/** the glyph's +x and +y (glyph frame) as world directions for a heading (faceTransform's maths) */
export const glyphAxes = (heading: number) => {
  const c = Math.cos(heading);
  const s = Math.sin(heading);
  const a = (Math.atan2(s, Math.abs(c)) * 180) / Math.PI;
  const t = (Math.max(-HORSE_TILT.max, Math.min(HORSE_TILT.max, a * HORSE_TILT.gain)) * Math.PI) / 180;
  return c < 0
    ? { ex: [-Math.cos(t), Math.sin(t)] as P2, ey: [Math.sin(t), Math.cos(t)] as P2 }
    : { ex: [Math.cos(t), Math.sin(t)] as P2, ey: [-Math.sin(t), Math.cos(t)] as P2 };
};
/** the glyph's extent (m) from its centre along a world direction w, both ways */
const HORSE_BOX = { x: [-35, 39.5], y: [-31, 28.5] }; // the glyph's box in units (casing included)
const glyphExtent = (heading: number, w: P2, lenM: number): [number, number] => {
  const { ex, ey } = glyphAxes(heading);
  const sc = lenM / 76;
  const vals: number[] = [];
  for (const gx of HORSE_BOX.x) for (const gy of HORSE_BOX.y) vals.push((gx * dot(ex, w) + gy * dot(ey, w)) * sc);
  return [Math.max(...vals), -Math.min(...vals)];
};

export type Role = "horse" | "pizarro" | "candia" | "gate";
export type Spaniard = {
  id: number;
  role: Role;
  hidden: P2; // where he waits, at the hidden rung
  stand: P2; // where he steps on the wave
  waveT: number; // the frame the wave reaches him (he rises over RISE frames)
  hall: number; // horse: the hall
  door: number; // horse: the doorway index
  rank: number; // horse: 0 in the doorway, 1 behind him
  lat: number; // horse: the doorway's lateral offset from the group's axis (m)
  gate: number; // gate foot: which gate
};
export const WAVE_FROM = W.lets; // the wave leaves Pizarro's group on "lets" (f19)
export const WAVE_TO = W.off + 2; // ... and reaches the last doorway 8 f later (f27)
export const RISE = 6; // each man rises and steps over 6 f: the last lands on "ambush" (f33)
export const HIDDEN_RUNG = 0.3;

// the platform's frame: u into the square (west), v across it (to the south)
const FU = unit(FORT.toSquare);
const FV: P2 = [FU[1], -FU[0]]; // u rotated 90 deg clockwise on screen (y down): south
const FC = FORT.centre;
const onFort = (u: number, v: number): P2 => add(FC, add(mul(FU, u), mul(FV, v)));

/** the falconets: trunnion positions and headings (flanking the stair's head,
 *  each aimed a little across the square's axis, into the crowd) */
export const GUN_LEN_M = 8.0; // the glyph's 64 units, in metres
export const GUNS = [
  { p: onFort(3.3, 4.2), heading: Math.atan2(FU[1], FU[0]) + 0.15, shot: 73 }, // the south gun, aimed a little north
  { p: onFort(3.3, -4.2), heading: Math.atan2(FU[1], FU[0]) - 0.15, shot: 77 }, // the north gun, aimed a little south
];
/** Candia's arquebusiers: two ranks of four at the parapet across the stair's head */
const ARQ_SLOTS: P2[] = [];
for (const u of [5.2, 4.0]) for (const v of [-2.25, -0.75, 0.75, 2.25]) ARQ_SLOTS.push(onFort(u, v + (u < 5 ? 0.75 * 0 : 0)));
/** the ripple of the volley: north to south along the parapet, landing on "musketry" */
export const ARQ_SHOTS = ARQ_SLOTS.map((p, i) => {
  const a = Math.atan2(FU[1], FU[0]) + (hash(i, 37) - 0.5) * 0.3;
  return { p, f: W.musketry - 7 + i, dir: [Math.cos(a), Math.sin(a)] as P2 }; // f85 .. f92
});

const wavePathS = (() => {
  // the wave runs from the platform along the NE and SE hall fronts to the NW
  // and SW corners, then along the west hall from both ends to its middle
  const ne = HALLS[H_NE];
  const se = HALLS[H_SE];
  const wh = HALLS[H_W];
  const neStart = len(sub(front(ne)[0], FC)) < len(sub(front(ne)[1], FC)) ? front(ne)[0] : front(ne)[1];
  const neEnd = neStart === front(ne)[0] ? front(ne)[1] : front(ne)[0];
  const seStart = len(sub(front(se)[0], FC)) < len(sub(front(se)[1], FC)) ? front(se)[0] : front(se)[1];
  const seEnd = seStart === front(se)[0] ? front(se)[1] : front(se)[0];
  const wNW = len(sub(front(wh)[0], neEnd)) < len(sub(front(wh)[1], neEnd)) ? front(wh)[0] : front(wh)[1];
  const wSW = wNW === front(wh)[0] ? front(wh)[1] : front(wh)[0];
  const s0ne = len(sub(neStart, FC));
  const s0se = len(sub(seStart, FC));
  const sNW = s0ne + len(sub(neEnd, neStart)) + len(sub(wNW, neEnd));
  const sSW = s0se + len(sub(seEnd, seStart)) + len(sub(wSW, seEnd));
  const along = (p: P2, a: P2, b: P2) => clamp01(dot(sub(p, a), sub(b, a)) / dot(sub(b, a), sub(b, a))) * len(sub(b, a));
  return {
    hall: (h: number, p: P2) => {
      if (h === H_NE) return s0ne + along(p, neStart, neEnd);
      if (h === H_SE) return s0se + along(p, seStart, seEnd);
      return Math.min(sNW + along(p, wNW, wSW), sSW + along(p, wSW, wNW));
    },
    gate: (g: Gate) => {
      const dNW = len(sub(g.p, wNW));
      const dSW = len(sub(g.p, wSW));
      return dNW < dSW ? s0ne + len(sub(neEnd, neStart)) + dNW : s0se + len(sub(seEnd, seStart)) + dSW;
    },
    max: Math.max(sNW, sSW) + len(sub(wSW, wNW)) / 2,
  };
})();
const waveAt = (s: number) => WAVE_FROM + ((WAVE_TO - WAVE_FROM) * s) / wavePathS.max;

/** the doorways a hall's group uses: the middle ones, two men to a doorway */
const doorsUsed = (h: number) => {
  const n = HALLS[h].doorways.length;
  const m = Math.ceil(RIDERS_PER_HALL[h] / 2);
  const first = Math.floor((n - m) / 2);
  return Array.from({ length: m }, (_, i) => first + i);
};
export const SPANIARDS: Spaniard[] = (() => {
  const out: Spaniard[] = [];
  // the horse
  for (const h of [H_NE, H_W, H_SE]) {
    const hall = HALLS[h];
    const doors = doorsUsed(h);
    const mid = centroid(doors.map((d) => hall.doorways[d].p as P2));
    const along = unit(hall.along as P2);
    const ranks = [doors.map((d) => ({ d, r: 0 })), doors.map((d) => ({ d, r: 1 }))].flat().slice(0, RIDERS_PER_HALL[h]);
    // the rear rank: drop the outermost doorway if the count is odd (21 = 11 + 10)
    if (RIDERS_PER_HALL[h] % 2 === 1) {
      ranks.length = 0;
      doors.forEach((d) => ranks.push({ d, r: 0 }));
      doors.slice(0, -1).forEach((d) => ranks.push({ d, r: 1 }));
    }
    for (const { d, r } of ranks) {
      const dw = hall.doorways[d];
      const p = dw.p as P2;
      const n = unit(dw.n as P2);
      // the glyph waiting in the hall, facing its doorway: the front man's nose
      // just inside the opening, the second man against the back wall (a step
      // to one side), both stepping up 0.8 m when the trap opens
      const hd = Math.atan2(n[1], n[0]);
      const [ep, em] = glyphExtent(hd, n, HORSE_WAIT_M);
      const depth = r === 0 ? ep + 0.15 : Math.max(ep + 0.15 + 0.45 * (ep + em), hall.depth - 0.35 - em - WAIT_STEP);
      const side = r === 0 ? 0 : (d % 2 === 0 ? 1 : -1) * 1.2;
      const stand = add(sub(p, mul(n, depth)), mul(along, side));
      out.push({
        id: out.length,
        role: "horse",
        hidden: sub(stand, mul(n, WAIT_STEP)),
        stand,
        waveT: waveAt(wavePathS.hall(h, p)),
        hall: h,
        door: d,
        rank: r,
        lat: dot(sub(p, mid), along),
        gate: -1,
      });
    }
  }
  // Pizarro + 24: the back of the platform (an even blue-noise body), stepping up toward the square
  const pizStand = packCrowd(
    [onFort(-5.3, -5.4), onFort(-5.3, 5.4), onFort(-0.2, 5.4), onFort(-0.2, -5.4)],
    N_PIZARRO,
    undefined,
    13,
  );
  pizStand.forEach((stand, i) => {
    out.push({
      id: out.length,
      role: "pizarro",
      hidden: add(stand, mul(FU, -0.7)),
      stand: add(stand, mul(FU, 0.5)),
      waveT: waveAt(0) + hash(i, 33) * 0.6,
      hall: -1,
      door: -1,
      rank: 0,
      lat: 0,
      gate: -1,
    });
  });
  // Candia (between the guns) + 8 arquebusiers (the parapet)
  for (let i = 0; i < N_CANDIA; i++) {
    const stand = i === 0 ? onFort(1.0, 0) : ARQ_SLOTS[i - 1];
    out.push({
      id: out.length,
      role: "candia",
      hidden: add(stand, mul(FU, -1.8)),
      stand,
      waveT: waveAt(0) + 0.3 + hash(i, 34) * 0.6,
      hall: -1,
      door: -1,
      rank: 0,
      lat: 0,
      gate: -1,
    });
  }
  // the gates: 36 a gate, an even body in the street that steps up into the opening
  GATES.forEach((g, gi) => {
    const n = unit(g.n as P2);
    const t = perp(n);
    const c = add(g.p as P2, mul(n, 3.5));
    const ring: P2[] = Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return add(c, add(mul(t, Math.cos(a) * 4.5), mul(n, Math.sin(a) * 3.4)));
    });
    packCrowd(ring, N_GATE / GATES.length, undefined, 17 + gi).forEach((stand) => {
      const dep = dot(sub(stand, g.p as P2), n);
      out.push({
        id: out.length,
        role: "gate",
        hidden: add(stand, mul(n, 3.4)),
        stand,
        waveT: waveAt(wavePathS.gate(g)) + dep * 0.12,
        hall: -1,
        door: -1,
        rank: 0,
        lat: 0,
        gate: gi,
      });
    });
  });
  if (out.length !== N_SPANIARDS) throw new Error(`168 expected, got ${out.length}`);
  return out;
})();
export const HORSE_IDS = SPANIARDS.filter((s) => s.role === "horse").map((s) => s.id);

/** a man's rise: 0 hidden .. 1 standing in his doorway */
export const riseOf = (s: Spaniard, f: number) => smoothstep((f - s.waveT) / RISE);
/** a standing man's position (before any charge) */
export const manAt = (s: Spaniard, f: number): P2 => lerp2(s.hidden, s.stand, smootherstep((f - s.waveT) / RISE));

// ---------------------------------------------------------------------------
// THE HORSEMEN: from f0 the 62 wait in their halls as horse-and-rider glyphs
// (HORSE_WAIT_M, the standing pose, facing their doorways, two to a doorway on
// the middle doors), hidden at the 0.3 rung, brightening and stepping up 0.8 m
// on the trap's wave; at the burst (just before "unleashes", f132; the second
// man of a doorway a beat after the first) each rides straight out of his own
// doorway, growing to HORSE_LEN_M as he leaves, then each hall's riders gather
// on curving paths into one loose body (blue-noise slots in a broad, shallow
// ellipse) as they charge toward the litter: fast out of the doors, slowing in
// the crush.
// ---------------------------------------------------------------------------
export const T_GO = W.unleashes - 3; // f132
export const V_BURST = 2.0; // m/f out of the doors (~3.5 x a real gallop: the cut compresses time)
export const V_CRUSH = 0.4; // m/f in the crowd
export const CRUSH_TAU = 10; // frames the burst takes to bleed into the crush
export const START_IN = 3.9; // runDepth's origin: a front-rank glyph's centre this far inside its doorway
/** the body's tail runs at this share of the nose's pace (the body lengthens as it charges) */
export const TAIL_PACE = 0.5;
/** a rider's own pace takes over once he reaches his doorway (+PACE_AT m), blended over PACE_BLEND m */
export const PACE_AT = 0;
export const PACE_BLEND = 7;
/** the gathering into one body: while the group's nose runs from 14 m to 50 m into the square
 *  (late enough that the riders have spread in depth before they close up sideways) */
export const GATHER = [14, 50];
const DT_SUB = 4;
/** how deep (m from the hall front) a rider is t frames after he sets off */
const runDepth = (() => {
  const arr: number[] = [];
  let d = -START_IN;
  const T = 80;
  for (let i = 0; i <= T * DT_SUB; i++) {
    const t = i / DT_SUB;
    const up = smoothstep(t / 4);
    const crush = Math.exp(-Math.max(0, t - 6) / CRUSH_TAU);
    arr.push(d);
    d += (up * (V_CRUSH + (V_BURST - V_CRUSH) * crush)) / DT_SUB;
  }
  return (t: number) => {
    if (t <= 0) return -START_IN;
    const q = t * DT_SUB;
    const i = Math.min(arr.length - 2, Math.floor(q));
    return arr[i] + (arr[i + 1] - arr[i]) * (q - i);
  };
})();
type Slot = { d: number; lat: number }; // d = metres behind the group's nose, lat = metres across
/** a group's body at the end of the charge: n even blue-noise slots in a broad,
 *  shallow ellipse (a charging line two or three deep), nose on the axis */
export const BODY = { halfDepth: 8.5, halfWidth: 17 };
const groupSlots = (n: number, seed: number): Slot[] => {
  const sc = Math.sqrt(n / 21);
  const ring: P2[] = Array.from({ length: 48 }, (_, i) => {
    const t = (i / 48) * Math.PI * 2;
    return [BODY.halfDepth * sc * Math.cos(t), BODY.halfWidth * sc * Math.sin(t)] as P2;
  });
  const pts = packCrowd(ring, n, undefined, seed);
  const nose = Math.max(...pts.map((p) => p[0]));
  return pts.map((p) => ({ d: nose - p[0], lat: p[1] }));
};
/** a tiny Hungarian (min-cost assignment, square) */
const hungarian = (cost: number[][]) => {
  const n = cost.length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const ans = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j] > 0) ans[p[j] - 1] = j - 1;
  return ans;
};
export type Rider = {
  id: number; // the Spaniard id
  hall: number;
  door: P2; // the doorway point
  n: P2; // the doorway's normal (into the square)
  axis: P2; // the group's axis (unit: the hall's normal, into the square)
  side: P2; // the group's lateral unit
  base: P2; // the group's axis origin on the hall front
  doorLat: number; // where he waits: his lateral offset on the group's axis (m)
  d0: number; // ... and his depth on it (m, negative: inside the hall)
  slot: Slot; // his place in the body
  pace: number; // his share of the burst (1 at the nose .. TAIL_PACE at the tail)
  tDep: number; // sets off (inside the hall)
  phase: number; // gallop phase
};
export const RIDERS: Rider[] = (() => {
  const out: Rider[] = [];
  for (const h of [H_NE, H_W, H_SE]) {
    const men = SPANIARDS.filter((s) => s.role === "horse" && s.hall === h);
    const hall = HALLS[h];
    const doors = doorsUsed(h);
    const base = centroid(doors.map((d) => hall.doorways[d].p as P2));
    // the group runs along its hall's normal (every rider starts inside his own
    // doorway); the gathered body centres on the litter's line
    const axis = unit(hall.toSquare as P2);
    const side = perp(axis);
    const latL = dot(sub(LITTER, base), side);
    const slots = groupSlots(men.length, 23 + h).map((q) => ({ d: q.d, lat: q.lat + latL }));
    const dMax = Math.max(...slots.map((q) => q.d)) || 1;
    // who takes which slot: lateral order kept (compressed), the central
    // doorways and the first man of a doorway toward the nose
    const maxLat = Math.max(...men.map((m) => Math.abs(m.lat))) || 1;
    const pri = men.map((m) => (Math.abs(m.lat) / maxLat) * 0.7 + m.rank * 0.3);
    const cost = men.map((m, i) => {
      const ml = dot(sub(m.stand, base), side);
      return slots.map((q) => (ml * 0.45 + latL * 0.55 - q.lat) ** 2 + 150 * (pri[i] - q.d / dMax) ** 2);
    });
    const asg = hungarian(cost);
    // a doorway's second man never sits ahead of its first (he would ride through him)
    men.forEach((m, i) => {
      if (m.rank !== 1) return;
      const j = men.findIndex((o) => o.rank === 0 && o.door === m.door);
      if (j >= 0 && slots[asg[i]].d < slots[asg[j]].d) [asg[i], asg[j]] = [asg[j], asg[i]];
    });
    men.forEach((m, i) => {
      const dw = hall.doorways[m.door];
      const slot = slots[asg[i]];
      out.push({
        id: m.id,
        hall: h,
        door: dw.p as P2,
        n: unit(dw.n as P2),
        axis,
        side,
        base,
        doorLat: dot(sub(m.stand, base), side),
        d0: dot(sub(m.stand, base), axis),
        slot,
        pace: 1 - (1 - TAIL_PACE) * (slot.d / dMax),
        tDep: T_GO + m.rank * 1.6 + hash(m.id, 41) * 1.4,
        phase: hash(m.id, 42),
      });
    });
  }
  return out;
})();
const RIDER_OF = new Map(RIDERS.map((r) => [r.id, r]));
export const riderOf = (id: number) => RIDER_OF.get(id);
/** the rider's position at frame f (null before he sets off): straight out of
 *  his doorway, then into his place in the body (lateral and depth offsets
 *  blended by the gathering; a little personal drift, so no rider is a lattice point) */
export const riderPos = (r: Rider, f: number): P2 | null => {
  if (f < r.tDep) return null;
  // his depth: his share of the burst; the gathering: ONE clock for the whole
  // group (its nose's progress, from GATHER[0] to GATHER[1] m into the square),
  // so the riders' lateral order holds at every frame and nobody crosses another
  // every rider leaves his hall at the full burst; past the doorway his own
  // pace takes over (a smooth blend over PACE_BLEND m, C1)
  const P = runDepth(f - r.tDep) + START_IN;
  const c = -r.d0 + PACE_AT;
  const t = (P - c) / PACE_BLEND;
  const S = t <= 0 ? 0 : t >= 1 ? t - 0.5 : t * t * t - (t * t * t * t) / 2;
  const own = r.d0 + r.pace * P + (1 - r.pace) * (P - PACE_BLEND * S);
  const nose = runDepth(f - T_GO);
  const gc = smootherstep((nose - GATHER[0]) / (GATHER[1] - GATHER[0]));
  const jl = (hash(r.id, 43) - 0.5) * 1.3 + 0.35 * Math.sin(f * (0.05 + 0.03 * hash(r.id, 44)) + 6.28 * hash(r.id, 45));
  const jd = (hash(r.id, 46) - 0.5) * 1.2 + 0.3 * Math.sin(f * (0.045 + 0.03 * hash(r.id, 47)) + 6.28 * hash(r.id, 48));
  // nobody runs backward: the body's depth comes from the riders' speeds (the
  // nose at the full burst, the back rows slower), the gathering is lateral
  const depth = own - gc * jd;
  const lat = lerp(r.doorLat, r.slot.lat + jl, gc);
  return add(r.base, add(mul(r.axis, depth), mul(r.side, lat)));
};
/** heading (radians, screen convention) from the motion over +-1 f */
export const riderHeading = (r: Rider, f: number) => {
  const a = riderPos(r, Math.max(r.tDep, f - 1)) ?? r.door;
  const b = riderPos(r, f + 1) ?? r.door;
  const d = sub(b, a);
  if (len(d) < 1e-4) return Math.atan2(r.axis[1], r.axis[0]);
  return Math.atan2(d[1], d[0]);
};
/** the gallop pose (0..2): a stride of ~9 frames */
export const riderPose = (r: Rider, f: number) => Math.floor((((f - r.tDep) / 3 + r.phase * 3) % 3 + 3) % 3);
/** a horseman's draw state at frame f: waiting in his hall (the standing pose,
 *  facing his doorway, a slow shift of weight; `rise` 0 hidden .. 1 revealed)
 *  or charging (the gallop, growing from HORSE_WAIT_M to HORSE_LEN_M as he leaves) */
export const riderGlyph = (r: Rider, f: number) => {
  const man = SPANIARDS[r.id];
  if (f < r.tDep) {
    const p = manAt(man, f);
    const idle = 1.3 * Math.sin(f * (0.045 + 0.025 * hash(r.id, 91)) + 6.28 * hash(r.id, 92));
    return { x: p[0], y: p[1], heading: Math.atan2(r.n[1], r.n[0]), size: HORSE_WAIT_M, stand: true, pose: 0, pitch: idle, rise: riseOf(man, f) };
  }
  const p = riderPos(r, f) as P2;
  const g = smoothstep((f - r.tDep) / 7);
  return { x: p[0], y: p[1], heading: riderHeading(r, f), size: lerp(HORSE_WAIT_M, HORSE_LEN_M, g), stand: false, pose: riderPose(r, f), pitch: 0, rise: 1 };
};
/** how much of the rider is out of his hall (0 at the start, 1 once the glyph
 *  has cleared the front line) */
export const riderOut = (r: Rider, f: number) => {
  const p = riderPos(r, f);
  if (!p) return 0;
  return clamp01((dot(sub(p, r.door), r.n) + START_IN) / (START_IN + 4.8)); // 1 = the whole (tilted) glyph is clear
};

// ---------------------------------------------------------------------------
// THE GUNS: shots, recoil, flashes; the arquebus volley
// ---------------------------------------------------------------------------
/** the gun's run-back (glyph units) after its shot */
export const gunRecoil = (shot: number, f: number) => {
  const t = f - shot;
  if (t < 0) return 0;
  return t < 1.5 ? 3.2 * (t / 1.5) : 3.2 * Math.exp(-(t - 1.5) / 5);
};

// ---------------------------------------------------------------------------
// SMOKE: puffs emitted from the muzzles, billowing, drifting, thinning
// ---------------------------------------------------------------------------
export type Puff = { f0: number; p: P2; v: P2; r0: number; r1: number; peak: number; seed: number; tau: number; grow: number };
export const WIND: P2 = [-0.035, 0.012]; // m/f: a slow drift over the square
const puffList = (): Puff[] => {
  const out: Puff[] = [];
  const muzzle = (g: (typeof GUNS)[number]): P2 => add(g.p, mul([Math.cos(g.heading), Math.sin(g.heading)], GUN_LEN_M * 0.43));
  GUNS.forEach((g, gi) => {
    const m = muzzle(g);
    for (let i = 0; i < 9; i++) {
      const sp = (hash(gi * 40 + i, 51) - 0.5) * 1.0;
      const a = g.heading + sp;
      const v0 = 2 + 2.6 * hash(gi * 40 + i, 52) * (1 - Math.abs(sp));
      out.push({
        f0: g.shot + i * 0.45,
        p: m,
        v: mul([Math.cos(a), Math.sin(a)], v0),
        r0: 1.2,
        r1: 4.8 + 4.2 * hash(gi * 40 + i, 53),
        peak: 0.08 + 0.03 * hash(gi * 40 + i, 54),
        seed: gi * 40 + i,
        tau: 8 + 4 * hash(gi * 40 + i, 55),
        grow: 0.03 + 0.02 * hash(gi * 40 + i, 56),
      });
    }
  });
  ARQ_SHOTS.forEach((s, i) => {
    for (let j = 0; j < 2; j++) {
      const a = Math.atan2(FU[1], FU[0]) + (hash(i * 7 + j, 57) - 0.5) * 0.5;
      out.push({
        f0: s.f + 0.6 + j * 0.8,
        p: add(s.p, mul(FU, 0.5)),
        v: mul([Math.cos(a), Math.sin(a)], 0.7 + 0.6 * hash(i * 7 + j, 58)),
        r0: 0.5,
        r1: 1.8 + 0.9 * hash(i * 7 + j, 59),
        peak: 0.12,
        seed: 300 + i * 7 + j,
        tau: 5,
        grow: 0.012,
      });
    }
  });
  return out;
};
export const PUFFS = puffList();
/** a puff's state at frame f (null before it is emitted) */
export const puffAt = (q: Puff, f: number) => {
  const t = f - q.f0;
  if (t < 0) return null;
  const travel = 1 - Math.exp(-t / q.tau);
  const p = add(q.p, add(mul(q.v, q.tau * travel), mul(WIND, t)));
  const r = q.r0 + (q.r1 - q.r0) * (1 - Math.exp(-t / (q.tau * 1.4))) + q.grow * t;
  const op = q.peak * Math.min(1, t / 1.5) * (0.35 + 0.65 * Math.exp(-t / 30)) * (1 - smoothstep((t - 50) / 60) * 0.4);
  return { p, r, op, roll: 0.012 * t + hash(q.seed, 61) * 6.28 };
};

// ---------------------------------------------------------------------------
// THE CAMERA: four long glides, each a cosine-tapered velocity bump (makeTrack,
// C1) in every channel (ln k and the framed point S, the world point at screen
// (540, 835)), overlapping so the camera never stops; a slow push-in holds the
// platform between the glides. cy = S.y + CAM_LIFT / k.
//   creep    f-8..40   the litter, k 4.45 -> 4.80 (tension before the release)
//   fort     f28..76   to the platform and the near crowd, k -> 7.7 (k 7.6 by f68)
//   (hold)   f60..100  the platform, pushing in 4 %
//   wide     f88..138  pull back over the whole square, k -> 4.3: the litter at
//                      (540, 745), the square's box y ~293 .. 1149
//   push-in  f128..    follow the charge: a gentle push-in pivoting on the
//                      litter (it holds (540, 745)), eased in from rest, +13.5 %
//                      from f132 to f177 and still accelerating on the last frame
// ---------------------------------------------------------------------------
export const K_OPEN = 4.45;
export const K_CREEP = 4.8;
export const K_FORT = 7.7;
export const K_WIDE = 4.3;
export const PUSH_IN = 1.135; // k(177) / k(132)
/** the litter's screen point in the wide and through the push-in */
export const LITTER_SCREEN: P2 = [540, 745];
/** the plaza's box (the enclosure), for framing it in the caption-safe band */
const ENC = PLAZA.enclosure as P2[];
export const PLAZA_BOX = {
  x0: Math.min(...ENC.map((p) => p[0])),
  x1: Math.max(...ENC.map((p) => p[0])),
  y0: Math.min(...ENC.map((p) => p[1])),
  y1: Math.max(...ENC.map((p) => p[1])),
};
/** the world point at screen (540, 835) that puts world point p at screen (sx, sy) at zoom k */
const sFor = (p: P2, k: number, sx: number, sy: number): P2 => [p[0] - (sx - 540) / k, p[1] + (835 - sy) / k];
// the open and the creep: the litter on the frame's axis, the plaza's box in the
// caption-safe band (its gates at y ~250 and ~1140 at the creep's k 4.8)
const S_OPEN: P2 = sFor(LITTER, K_OPEN, 540, 702);
const S_CREEP: P2 = sFor(LITTER, K_CREEP, 545, 722);
// the platform and the near crowd: the platform at (820, 835)
const S_FORT: P2 = sFor([FC[0], FC[1] - 1.5], K_FORT, 820, 835);
// the whole square, held on the litter
const S_WIDE: P2 = sFor(LITTER, K_WIDE, LITTER_SCREEN[0], LITTER_SCREEN[1]);
const TAPER = 0.72;
export const GLIDES = { creep: [-8, 40], fort: [28, 76], hold: [60, 100], wide: [88, 138], push: [128, 226] } as const;
const glide = (w: readonly [number, number], area: number): Bump => [w[0], w[1], area, TAPER];
const LK_BASE: Bump[] = [
  glide(GLIDES.creep, Math.log(K_CREEP / K_OPEN)),
  glide(GLIDES.fort, Math.log(K_FORT / K_CREEP)),
  [GLIDES.hold[0], GLIDES.hold[1], 0.04, 1],
  glide(GLIDES.wide, Math.log(K_WIDE / K_FORT) - 0.04),
];
const LK0 = Math.log(K_OPEN) + Math.log(K_CREEP / K_OPEN) * 0.12;
/** the push-in: a raised-cosine velocity bump over GLIDES.push (its peak falls
 *  after the last frame, so the zoom is still gathering speed on f177); its
 *  area solved so k(177) / k(132) = PUSH_IN */
const PUSH_AREA = (() => {
  const unitBump = makeTrack([[GLIDES.push[0], GLIDES.push[1], 1, 1]], 0);
  const base = makeTrack(LK_BASE, LK0);
  const want = Math.log(PUSH_IN) - (base(177) - base(132));
  return want / (unitBump(177) - unitBump(132));
})();
const LK = makeTrack([...LK_BASE, [GLIDES.push[0], GLIDES.push[1], PUSH_AREA, 1]], LK0);
const SXc = makeTrack(
  [
    glide(GLIDES.creep, S_CREEP[0] - S_OPEN[0]),
    glide(GLIDES.fort, S_FORT[0] - S_CREEP[0]),
    glide(GLIDES.wide, S_WIDE[0] - S_FORT[0]),
  ],
  S_OPEN[0] + (S_CREEP[0] - S_OPEN[0]) * 0.12,
);
/** S.y through the push-in: the same bump shape, its area solved so the litter
 *  still sits on LITTER_SCREEN at the end (it drifts < 1 px between) */
const SY_BASE: Bump[] = [
  glide(GLIDES.creep, S_CREEP[1] - S_OPEN[1]),
  glide(GLIDES.fort, S_FORT[1] - S_CREEP[1]),
  glide(GLIDES.wide, S_WIDE[1] - S_FORT[1]),
];
const SY0 = S_OPEN[1] + (S_CREEP[1] - S_OPEN[1]) * 0.12;
const SY_PUSH = (() => {
  const unitBump = makeTrack([[GLIDES.push[0], GLIDES.push[1], 1, 1]], 0);
  const base = makeTrack(SY_BASE, SY0);
  const want = LITTER[1] + (835 - LITTER_SCREEN[1]) / Math.exp(LK(LAST)) - base(LAST);
  return want / unitBump(LAST);
})();
const SYc = makeTrack([...SY_BASE, [GLIDES.push[0], GLIDES.push[1], SY_PUSH, 1]], SY0);
/** the authored camera at frame f (no sway) */
export const camAt = (f: number): Cam => {
  const k = Math.exp(LK(f));
  return { k, cx: SXc(f), cy: SYc(f) + CAM_LIFT / k };
};
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));
export { CAM_LIFT };

// ---------------------------------------------------------------------------
// THE CROWD: 6,000 (FACTS 2: "five or six thousand"), 1 dot = 1 man
// ---------------------------------------------------------------------------
export const N_CROWD = 6000;
export const N_BEARERS = 80; // "borne by eighty chiefs" (FACTS 7)
export const DOT_R_M = 0.42; // a crowd dot's radius (m)
export const MAN_R_M = 0.5; // a Spaniard's dot (m): the accent, a touch heavier than the crowd's
/** dot radii at zoom k (world m): world-sized, never under a screen floor in the
 *  wide shots (the house dotRadius idea), so the trap's 168 read on a phone */
export const crowdR = (k: number) => Math.max(DOT_R_M, 1.95 / k);
export const manR = (k: number) => Math.max(MAN_R_M, 3.2 / k);
export const BEARER_AX: P2 = [6.2, 4.0]; // the bearers' block (semi-axes, m)
const ellipseRing = (c: P2, a: number, b: number, n = 48): P2[] =>
  Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return [c[0] + Math.cos(t) * a, c[1] + Math.sin(t) * b] as P2;
  });
export const BEARERS: P2[] = packCrowd(ellipseRing(LITTER, BEARER_AX[0], BEARER_AX[1]), N_BEARERS, undefined, 5);
const CROWD_START: P2[] = packCrowd(
  [INTERIOR[0], ellipseRing(LITTER, BEARER_AX[0] + 0.9, BEARER_AX[1] + 0.9)],
  N_CROWD - N_BEARERS,
  undefined,
  9,
);
/** every dot's start (bearers first: index < N_BEARERS) */
export const CROWD0: P2[] = [...BEARERS, ...CROWD_START];
const ringArea = (r: P2[]) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
  return Math.abs(a / 2);
};
/** the packing's natural spacing (m) */
export const SPACING = Math.sqrt((ringArea(INTERIOR[0]) - Math.PI * (BEARER_AX[0] + 0.9) * (BEARER_AX[1] + 0.9)) / ((N_CROWD - N_BEARERS) * 0.866));

// ---------------------------------------------------------------------------
// THE CROWD SIMULATION (position-based, one step a frame, then smoothed in time)
//   inputs (all smooth ramps, never impulses): the press toward the litter
//   (f0..f100, tiny); the recoil: a fear front leaves the guns at f97 and runs
//   across the square at 5.5 m/f, each man fleeing away from the guns, off the
//   hall fronts (the doorways) and toward the gates once it reaches him, his
//   urge decaying to a steady shove; the horsemen: a bow wave that pushes men
//   aside ahead of each rider, a flight away from the riders, and each glyph's
//   footprint kept clear
//   constraints: spacing (it tightens in the crush), the square's walls (a
//   signed distance field of PLAZA.interior), the bearers (fixed), the riders
// ---------------------------------------------------------------------------
const NB = N_BEARERS;
const NC = N_CROWD;
export const F_SIM0 = -14;
export const F_SIM1 = LAST + 8;
const R_WALL = DOT_R_M + 0.08;
// the walls: a signed distance field of the interior (positive inside), 0.5 m cells
const SDF = (() => {
  const ring = INTERIOR[0];
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of ring) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const s = 0.5;
  x0 -= 4;
  y0 -= 4;
  x1 += 4;
  y1 += 4;
  const w = Math.ceil((x1 - x0) / s) + 1;
  const h = Math.ceil((y1 - y0) / s) + 1;
  const g = new Float32Array(w * h);
  const inside = (x: number, y: number) => {
    let c = false;
    for (const r of INTERIOR)
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i];
        const [xj, yj] = r[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
    return c;
  };
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const x = x0 + i * s;
      const y = y0 + j * s;
      let best = Infinity;
      for (const r of INTERIOR)
        for (let a = 0, b = r.length - 1; a < r.length; b = a++) {
          const [ax, ay] = r[b];
          const [bx, by] = r[a];
          const ex = bx - ax;
          const ey = by - ay;
          const t = clamp01(((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1));
          const d = Math.hypot(x - ax - ex * t, y - ay - ey * t);
          if (d < best) best = d;
        }
      g[j * w + i] = inside(x, y) ? best : -best;
    }
  const at = (x: number, y: number) => {
    const fx = (x - x0) / s;
    const fy = (y - y0) / s;
    const i = Math.max(0, Math.min(w - 2, Math.floor(fx)));
    const j = Math.max(0, Math.min(h - 2, Math.floor(fy)));
    const u = Math.max(0, Math.min(1, fx - i));
    const v = Math.max(0, Math.min(1, fy - j));
    const a = g[j * w + i];
    const b = g[j * w + i + 1];
    const c = g[(j + 1) * w + i];
    const d = g[(j + 1) * w + i + 1];
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
  return { at, x0, y0, x1, y1 };
})();
export const wallDist = SDF.at;

/** the recoil's source: the guns' midpoint on the platform */
export const RECOIL_SRC: P2 = centroid(GUNS.map((g) => g.p));
export const T_RECOIL = 97; // the fear front leaves the guns (after the volley, before "for" f102)
export const C_RECOIL = 5; // m/f: it crosses the square (~135 m) by f124
export const TAU_RECOIL = 14; // frames each man's flight takes to play out
export const RECOIL_A0 = 40; // m: how far the men at the guns run (radially away from them)
export const RECOIL_RHO = 172; // m: ... falling to nothing at this distance
export const GATE_PUSH = 7; // m: the press toward the nearest gate (within 55 m of it)
export const DOOR_MARGIN = 2.4; // m: the crowd shrinks back from the doorways (within 7 m)
const GATE_P = GATES.map((g) => g.p as P2);
/** the flight's flow: radially away from the guns, deflected round the litter's
 *  block (potential flow past a cylinder of LITTER_R), so the men part round
 *  Atahualpa's litter and close in behind it (no wake, no seam) */
export const LITTER_R = 6.5;
const flowAt = (x: number, y: number): P2 => {
  const gx = x - RECOIL_SRC[0];
  const gy = y - RECOIL_SRC[1];
  const gl = Math.hypot(gx, gy) || 1;
  const ca = gx / gl;
  const sa = gy / gl;
  const zx = x - LITTER[0];
  const zy = y - LITTER[1];
  const r = Math.max(LITTER_R, Math.hypot(zx, zy));
  const th = Math.atan2(zy, zx);
  const q = (LITTER_R * LITTER_R) / (r * r);
  // u = cos a - q cos(a - 2 th), v = sin a + q sin(a - 2 th)
  const c2 = Math.cos(2 * th);
  const s2 = Math.sin(2 * th);
  const cam2 = ca * c2 + sa * s2; // cos(a - 2 th)
  const sam2 = sa * c2 - ca * s2; // sin(a - 2 th)
  return [ca - q * cam2, sa + q * sam2];
};
/** each man's flight: his displacement (m) once it has played out, and when it starts */
const FLIGHT = CROWD0.map((p, i) => {
  if (i < NB) return { dx: 0, dy: 0, t0: 1e9 };
  const rho = Math.hypot(p[0] - RECOIL_SRC[0], p[1] - RECOIL_SRC[1]) || 1;
  const A = RECOIL_A0 * Math.pow(Math.max(0, 1 - rho / RECOIL_RHO), 1.6);
  // carried A metres along the flow (midpoint steps of <= 0.5 m)
  let x = p[0];
  let y = p[1];
  const steps = Math.max(1, Math.ceil(A / 0.5));
  const h = A / steps;
  for (let k = 0; k < steps; k++) {
    const [u1, v1] = flowAt(x, y);
    const [u2, v2] = flowAt(x + u1 * h * 0.5, y + v1 * h * 0.5);
    x += u2 * h;
    y += v2 * h;
  }
  let dx = x - p[0];
  let dy = y - p[1];
  // the exits: toward the nearest gate
  let gb = Infinity;
  let gi = 0;
  GATE_P.forEach((g, k) => {
    const d = Math.hypot(g[0] - p[0], g[1] - p[1]);
    if (d < gb) [gb, gi] = [d, k];
  });
  if (gb < 55) {
    const w = GATE_PUSH * (1 - gb / 55) ** 1.5;
    dx += ((GATE_P[gi][0] - p[0]) / gb) * w;
    dy += ((GATE_P[gi][1] - p[1]) / gb) * w;
  }
  // off the doorways, where the armed men stand
  for (const hh of HALLS) {
    const [a] = front(hh);
    const n = unit(hh.toSquare as P2);
    const dd = (p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1];
    if (dd < 7) {
      dx += n[0] * DOOR_MARGIN * (1 - dd / 7);
      dy += n[1] * DOOR_MARGIN * (1 - dd / 7);
    }
  }
  return { dx, dy, t0: T_RECOIL + rho / C_RECOIL + (hash(i, 81) - 0.5) * 2 };
});
/** the tiny press toward the litter before the guns (m, fully on by f60, let go on the guns) */
const PRESS = CROWD0.map((p, i) => {
  if (i < NB) return [0, 0] as P2;
  const lx = LITTER[0] - p[0];
  const ly = LITTER[1] - p[1];
  const ld = Math.hypot(lx, ly) || 1;
  const a = 0.75 * Math.max(0, 1 - ld / 90);
  return [(lx / ld) * a, (ly / ld) * a] as P2;
});
const pressW = (f: number) => smoothstep((f + 10) / 70) * (1 - smoothstep((f - 92) / 14));

type RiderState = { x: number; y: number; vx: number; vy: number; hx: number; hy: number; c: number; s: number; out: number };
/** the riders' state at frame f (for the crowd): position, velocity, heading
 *  unit, the glyph's on-screen long axis (cos, sin) and how far out of the hall */
const ridersAt = (f: number): RiderState[] => {
  const out: RiderState[] = [];
  for (const r of RIDERS) {
    const p = riderPos(r, f);
    if (!p) continue;
    const q = riderPos(r, f + 1) ?? p;
    const hd = riderHeading(r, f);
    const hx = Math.cos(hd);
    const hy = Math.sin(hd);
    const a = Math.atan2(hy, Math.abs(hx));
    const tilt = Math.max(-HORSE_TILT.max, Math.min(HORSE_TILT.max, ((a * 180) / Math.PI) * HORSE_TILT.gain)) * (Math.PI / 180);
    const ang = hx < 0 ? Math.PI - tilt : tilt;
    out.push({ x: p[0], y: p[1], vx: q[0] - p[0], vy: q[1] - p[1], hx, hy, c: Math.cos(ang), s: Math.sin(ang), out: riderOut(r, f) });
  }
  return out;
};
/** the clear footprint round a rider glyph (m): semi-axes along / across its long axis */
export const RIDER_CLEAR: P2 = [HORSE_LEN_M * 0.5 + 0.2, HORSE_LEN_M * 0.32 + 0.2];

const SIM = (() => {
  const n = NC;
  const X = new Float64Array(n);
  const Y = new Float64Array(n);
  CROWD0.forEach((p, i) => {
    X[i] = p[0];
    Y[i] = p[1];
  });
  const PX = new Float64Array(n);
  const PY = new Float64Array(n);
  const VX = new Float64Array(n);
  const VY = new Float64Array(n);
  const fixed = new Uint8Array(n);
  for (let i = 0; i < NB; i++) fixed[i] = 1;
  const CELL = 1.4;
  const gx0 = SDF.x0;
  const gy0 = SDF.y0;
  const GW = Math.ceil((SDF.x1 - gx0) / CELL) + 1;
  const GH = Math.ceil((SDF.y1 - gy0) / CELL) + 1;
  const cellStart = new Int32Array(GW * GH + 1);
  const cellIdx = new Int32Array(n);
  const cellOfDot = new Int32Array(n);
  const fillPtr = new Int32Array(GW * GH);
  const buildGrid = () => {
    cellStart.fill(0);
    for (let i = 0; i < n; i++) {
      const ci = Math.max(0, Math.min(GW - 1, Math.floor((X[i] - gx0) / CELL)));
      const cj = Math.max(0, Math.min(GH - 1, Math.floor((Y[i] - gy0) / CELL)));
      const c = cj * GW + ci;
      cellOfDot[i] = c;
      cellStart[c + 1]++;
    }
    for (let c = 0; c < GW * GH; c++) cellStart[c + 1] += cellStart[c];
    fillPtr.set(cellStart.subarray(0, GW * GH));
    for (let i = 0; i < n; i++) cellIdx[fillPtr[cellOfDot[i]]++] = i;
  };
  const DX = new Float64Array(n);
  const DY = new Float64Array(n);
  const near = new Float64Array(n); // proximity to the nearest rider (0 far .. 1 close)
  const outX: Float32Array[] = [];
  const outY: Float32Array[] = [];
  for (let f = F_SIM0; f <= F_SIM1; f++) {
    const riders = f >= T_GO - 1 ? ridersAt(f) : [];
    const crush = smoothstep((f - 100) / 24);
    const sep = SPACING * (0.88 - 0.12 * crush);
    const pw = pressW(f);
    near.fill(0);
    // 1. the urges (m/f): a spring toward each man's target, and the riders
    for (let i = NB; i < n; i++) {
      const fl = FLIGHT[i];
      const e = smootherstep((f - fl.t0) / TAU_RECOIL);
      const tx = CROWD0[i][0] + PRESS[i][0] * pw + fl.dx * e;
      const ty = CROWD0[i][1] + PRESS[i][1] * pw + fl.dy * e;
      let ux = 0;
      let uy = 0;
      let px = 0;
      for (const r of riders) {
        if (r.out < 0.2) continue;
        const ex = X[i] - r.x;
        const ey = Y[i] - r.y;
        if (Math.abs(ex) > 10 || Math.abs(ey) > 10) continue;
        const d = Math.hypot(ex, ey);
        if (d > 10 || d < 1e-6) continue;
        px = Math.max(px, (1 - d / 10) * r.out);
        const sp = Math.hypot(r.vx, r.vy);
        // the flight from a rider
        const fw = 0.05 * (1 - d / 10) ** 2 * r.out;
        ux += (ex / d) * fw;
        uy += (ey / d) * fw;
        // the bow wave: men ahead of him are shoved aside
        const ahead = ex * r.hx + ey * r.hy;
        const lat = -ex * r.hy + ey * r.hx;
        if (ahead > -1.5 && ahead < 8 && Math.abs(lat) < 4.2) {
          const w = 0.5 * sp * (1 - Math.max(0, ahead) / 8) * (1 - Math.abs(lat) / 4.2) * r.out;
          const sg = lat >= 0 ? 1 : -1;
          ux += -r.hy * sg * w + r.hx * w * 0.2;
          uy += r.hx * sg * w + r.hy * w * 0.2;
        }
      }
      near[i] = px;
      // the spring (stronger while the flight plays out; let go near a rider)
      const kap = (0.1 + 0.16 * (e > 0 && e < 1 ? 1 : 0)) * (1 - 0.6 * px);
      let sx = (tx - X[i]) * kap;
      let sy = (ty - Y[i]) * kap;
      const vcap = 0.1 + 2.3 * (e > 0 && e < 1 ? Math.sin(Math.PI * e) : 0);
      const sl = Math.hypot(sx, sy);
      if (sl > vcap) {
        sx *= vcap / sl;
        sy *= vcap / sl;
      }
      ux += sx;
      uy += sy;
      VX[i] = VX[i] * 0.55 + ux * 0.45;
      VY[i] = VY[i] * 0.55 + uy * 0.45;
    }
    for (let i = 0; i < n; i++) {
      PX[i] = X[i];
      PY[i] = Y[i];
      if (fixed[i]) continue;
      X[i] += VX[i];
      Y[i] += VY[i];
    }
    // 2. constraints
    for (let it = 0; it < 3; it++) {
      buildGrid();
      DX.fill(0);
      DY.fill(0);
      const s2 = sep * sep;
      for (let i = 0; i < n; i++) {
        const ci = cellOfDot[i] % GW;
        const cj = (cellOfDot[i] - ci) / GW;
        for (let dj = -1; dj <= 1; dj++) {
          const jj = cj + dj;
          if (jj < 0 || jj >= GH) continue;
          for (let di = -1; di <= 1; di++) {
            const ii = ci + di;
            if (ii < 0 || ii >= GW) continue;
            const c = jj * GW + ii;
            for (let q = cellStart[c]; q < cellStart[c + 1]; q++) {
              const j = cellIdx[q];
              if (j <= i) continue;
              if (fixed[i] && fixed[j]) continue;
              const ex = X[j] - X[i];
              const ey = Y[j] - Y[i];
              const d2 = ex * ex + ey * ey;
              if (d2 >= s2) continue;
              const d = Math.sqrt(d2) || 1e-6;
              const m = (0.5 * (sep - d)) / d;
              const wi = fixed[i] ? 0 : fixed[j] ? 2 : 1;
              const wj = fixed[j] ? 0 : fixed[i] ? 2 : 1;
              DX[i] -= ex * m * 0.5 * wi;
              DY[i] -= ey * m * 0.5 * wi;
              DX[j] += ex * m * 0.5 * wj;
              DY[j] += ey * m * 0.5 * wj;
            }
          }
        }
      }
      for (let i = NB; i < n; i++) {
        X[i] += DX[i];
        Y[i] += DY[i];
      }
      // the riders' footprints
      for (const r of riders) {
        if (r.out < 0.15) continue;
        const A = RIDER_CLEAR[0] * (0.6 + 0.4 * r.out);
        const B = RIDER_CLEAR[1] * (0.6 + 0.4 * r.out);
        const i0 = Math.floor((r.x - A - gx0) / CELL);
        const i1 = Math.floor((r.x + A - gx0) / CELL);
        const j0 = Math.floor((r.y - A - gy0) / CELL);
        const j1 = Math.floor((r.y + A - gy0) / CELL);
        for (let jj = Math.max(0, j0); jj <= Math.min(GH - 1, j1); jj++)
          for (let ii = Math.max(0, i0); ii <= Math.min(GW - 1, i1); ii++) {
            const c = jj * GW + ii;
            for (let q = cellStart[c]; q < cellStart[c + 1]; q++) {
              const i = cellIdx[q];
              if (fixed[i]) continue;
              const ex = X[i] - r.x;
              const ey = Y[i] - r.y;
              const a = (ex * r.c + ey * r.s) / A;
              const b = (-ex * r.s + ey * r.c) / B;
              const rho = Math.hypot(a, b);
              if (rho >= 1) continue;
              const na = rho < 1e-6 ? 1 : a / rho;
              const nb = rho < 1e-6 ? 0 : b / rho;
              const tx = na * A * r.c - nb * B * r.s;
              const ty = na * A * r.s + nb * B * r.c;
              X[i] = r.x + lerp(ex, tx, 0.75);
              Y[i] = r.y + lerp(ey, ty, 0.75);
            }
          }
      }
      // the walls
      for (let i = NB; i < n; i++) {
        const d = SDF.at(X[i], Y[i]);
        if (d >= R_WALL) continue;
        const e = 0.25;
        const gx = SDF.at(X[i] + e, Y[i]) - SDF.at(X[i] - e, Y[i]);
        const gy = SDF.at(X[i], Y[i] + e) - SDF.at(X[i], Y[i] - e);
        const gl = Math.hypot(gx, gy) || 1;
        X[i] += (gx / gl) * (R_WALL - d);
        Y[i] += (gy / gl) * (R_WALL - d);
      }
    }
    // 3. the velocity the constraints left (damped)
    for (let i = NB; i < n; i++) {
      VX[i] = (X[i] - PX[i]) * 0.8;
      VY[i] = (Y[i] - PY[i]) * 0.8;
    }
    outX.push(Float32Array.from(X));
    outY.push(Float32Array.from(Y));
  }
  return { outX, outY };
})();

// smoothing in time (gaussian, sigma 1.3 f)
const SIG_T = 1.3;
const TAPS_T = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((j) => ({ j, w: Math.exp(-(j * j) / (2 * SIG_T * SIG_T)) }));
const TAP_SUM = TAPS_T.reduce((s, t) => s + t.w, 0);
const simIx = (f: number) => Math.max(0, Math.min(SIM.outX.length - 1, Math.round(f) - F_SIM0));
/** the crowd at frame f as a flat [x0, y0, x1, y1, ...] (m), smoothed, with the
 *  sway (a tiny lean toward / away from the litter on each man's own phase) */
export const crowdAt = (f: number): Float32Array => {
  const out = new Float32Array(NC * 2);
  for (const { j, w } of TAPS_T) {
    const ix = simIx(f + j);
    const xs = SIM.outX[ix];
    const ys = SIM.outY[ix];
    for (let i = 0; i < NC; i++) {
      out[2 * i] += xs[i] * w;
      out[2 * i + 1] += ys[i] * w;
    }
  }
  const calm = 1 - 0.6 * smoothstep((f - 98) / 10);
  for (let i = 0; i < NC; i++) {
    let x = out[2 * i] / TAP_SUM;
    let y = out[2 * i + 1] / TAP_SUM;
    const lx = LITTER[0] - x;
    const ly = LITTER[1] - y;
    const ld = Math.hypot(lx, ly) || 1;
    const lean = 0.19 * Math.sin(f * (0.07 + 0.03 * hash(i, 71)) + 6.283 * hash(i, 72)) * calm;
    const ax = 0.13 * Math.sin(f * (0.05 + 0.04 * hash(i, 73)) + 6.283 * hash(i, 74));
    const ay = 0.13 * Math.sin(f * (0.045 + 0.045 * hash(i, 75)) + 6.283 * hash(i, 76));
    x += (lx / ld) * lean + ax;
    y += (ly / ld) * lean + ay;
    out[2 * i] = x;
    out[2 * i + 1] = y;
  }
  return out;
};
/** the raw simulated position (unsmoothed), for the check scripts */
export const crowdRaw = (i: number, f: number): P2 => {
  const ix = simIx(f);
  return [SIM.outX[ix][i], SIM.outY[ix][i]];
};
