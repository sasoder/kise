// ---------------------------------------------------------------------------
// hisMotion: HisConquistadors (the clip "Sheppard_Cajamarca_infinite_KD") --
// every moving thing as pure maths (no React), so the check scripts read the
// exact motion the component draws. See HisConquistadors.tsx's header for the
// words, the gestures, the join and the sources. Positions are in the
// Cajamarca local plan (metres, x east, y south; incaShared), time in frames
// at 24 fps. Everything is read-only from the shared world:
//   ambushMotion  the 168 SPANIARDS (role, hidden / stand posts), the halls,
//                 gates and platform, the hidden rung, RISE, the waiting
//                 horseman's size and tilt
//   hundredMotion cut A (HundredAgainstHundredThousand), which this cut plays
//                 straight into: its camera (camAt, valid from F_PRE: this
//                 cut's frame f is A's frame f - A_OFFSET), the square's
//                 6,000 (plazaFrame), the plain (armyFrame), the 168's
//                 posts and idle sway (footAt / riderAt), the looks (LOOK),
//                 the "168" numeral (NUMERAL, op168)
// What is new here: the muster wave (each man's own moment) and the camera's
// pull-back (A's pre-roll plus an offset that eases to zero by F_JOIN).
// ---------------------------------------------------------------------------
import { SCREEN_CX, SCREEN_CY, clamp01, hash, makeTrack, screenOf, smoothstep, smootherstep, type Cam, type Gate, type Hall, type P2 } from "./incaShared";
import { FORT, GATES, HALLS, HIDDEN_RUNG, HORSE_WAIT_M, H_NE, H_SE, H_W, RISE, SPANIARDS, type Spaniard } from "./ambushMotion";
import { FOOT, RIDERS, camAt as camA, footAt, riderAt } from "./hundredMotion";

// ---------------------------------------------------------------------------
// TIMELINE. In-point 3.74 s on the edit timeline (the SRT; word onsets from
// the word-level re-transcription); f = round((t - 3.74) * 24).
// Cut A's in-point is 7.54 s: DURATION = round((7.54 - 3.74) * 24) =
// round(91.2) = 91 frames (f0..f90). No house tail: this cut ends where A
// begins, so this cut's frame 91 would be A's frame 0 (A_OFFSET).
// ---------------------------------------------------------------------------
export const FPS = 24;
export const IN_POINT = 3.74;
export const DURATION = 91;
export const LAST = DURATION - 1;
/** this cut's frame f is A's frame f - A_OFFSET */
export const A_OFFSET = DURATION;
export const W = {
  he: 0,
  has: 2,
  some: 7,
  n160: 12, // ends f26
  n190: 36, // ends 6.04 s
  conquistadors: 55, // ends f76
  so: 83,
  aIn: 91, // cut A's in-point
};

// ---------------------------------------------------------------------------
// small maths
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

// ---------------------------------------------------------------------------
// THE MUSTER WAVE. It leaves Pizarro's group on the platform on "some" (f7)
// and runs both ways round the ring of the trap (ambushMotion's trap path,
// reproduced read-only): along the NE and SE hall fronts from the platform,
// to the gates in the NW and SW corners, then along the west hall from both
// ends to its middle. Each man's moment = WAVE_T0 + WAVE_SPAN x (half his
// distance round the ring + half his place in the count on his side), so the
// wave is steady in the ground it covers AND in the men it ticks off (it does
// not sprint across the empty stretches nor smear a gate's 36 into one burst);
// + a hashed +-JITTER f each, so no rank lights as a line. As it reaches a man
// he rises from the hidden rung to full orange over RISE (6) f and steps from
// his hidden post to his stand post (ambushMotion's hidden / stand). Pizarro's
// own 25 are lit from f0 ("he").
// ---------------------------------------------------------------------------
export const WAVE_T0 = W.some; // f7
export const WAVE_SPAN = 43; // the last man is reached ~f50-52, full orange by ~f58
export const WAVE_ALPHA = 0.5; // ground covered vs men counted
export const JITTER = 2;
export { HIDDEN_RUNG, RISE };

const FC = FORT.centre as P2;
const front = (h: Hall) => h.front as [P2, P2];
/** the trap's ring from the platform (ambushMotion's wavePathS, read-only copy) */
const RING = (() => {
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
    /** a doorway's ring distance and side (0 = north, 1 = south) */
    hall: (h: number, p: P2): { s: number; side: number } => {
      if (h === H_NE) return { s: s0ne + along(p, neStart, neEnd), side: 0 };
      if (h === H_SE) return { s: s0se + along(p, seStart, seEnd), side: 1 };
      const a = sNW + along(p, wNW, wSW);
      const b = sSW + along(p, wSW, wNW);
      return a <= b ? { s: a, side: 0 } : { s: b, side: 1 };
    },
    gate: (g: Gate): { s: number; side: number } => {
      const dNW = len(sub(g.p as P2, wNW));
      const dSW = len(sub(g.p as P2, wSW));
      return dNW < dSW ? { s: s0ne + len(sub(neEnd, neStart)) + dNW, side: 0 } : { s: s0se + len(sub(seEnd, seStart)) + dSW, side: 1 };
    },
  };
})();

export type Muster = { id: number; role: Spaniard["role"]; side: number; s: number; t: number };
/** each man's moment (the frame the wave reaches him); Pizarro's 25: -Infinity (lit from f0) */
export const MUSTER: Muster[] = (() => {
  const fu = unit(FORT.toSquare as P2);
  const fv: P2 = [fu[1], -fu[0]];
  const ring = SPANIARDS.map((m): Muster => {
    if (m.role === "pizarro") return { id: m.id, role: m.role, side: -1, s: 0, t: -Infinity };
    if (m.role === "candia") {
      // the first ticks: the gunners beside him, split by side of the stair
      const v = dot(sub(m.stand, FC), fv);
      return { id: m.id, role: m.role, side: v < 0 ? 0 : 1, s: 0.4 * len(sub(m.stand, FC)), t: 0 };
    }
    if (m.role === "horse") {
      const p = HALLS[m.hall].doorways[m.door].p as P2;
      const q = RING.hall(m.hall, p);
      return { id: m.id, role: m.role, side: q.side, s: q.s + 0.6 * m.rank, t: 0 };
    }
    // the gate foot: the wave enters the body from the opening and runs out
    // through it into the street (each man by his depth past the opening)
    const g = GATES[m.gate];
    const q = RING.gate(g);
    const dep = dot(sub(m.stand, g.p as P2), unit(g.n as P2));
    return { id: m.id, role: m.role, side: q.side, s: q.s + 1.4 * Math.max(0, dep), t: 0 };
  });
  for (const side of [0, 1]) {
    const men = ring.filter((m) => m.side === side).sort((a, b) => a.s + 0.3 * hash(a.id, 201) - (b.s + 0.3 * hash(b.id, 201)));
    const sMax = Math.max(...men.map((m) => m.s));
    men.forEach((m, r) => {
      const u = WAVE_ALPHA * (m.s / sMax) + (1 - WAVE_ALPHA) * (r / (men.length - 1));
      const t = WAVE_T0 + WAVE_SPAN * u + JITTER * (2 * hash(m.id, 202) - 1);
      m.t = t < WAVE_T0 ? 2 * WAVE_T0 - t : t; // the jitter never runs ahead of the wave's start
    });
  }
  return ring;
})();
export const WAVE_LAST = Math.max(...MUSTER.filter((m) => m.t > -Infinity).map((m) => m.t));
export const WAVE_FIRST = Math.min(...MUSTER.filter((m) => m.t > -Infinity).map((m) => m.t));
if (MUSTER.length !== 168 || MUSTER.filter((m) => m.role === "horse").length !== 62) throw new Error("hisMotion: the 168 do not add up");
if (WAVE_LAST + RISE > 59) throw new Error(`hisMotion: the last man is full orange only on f${(WAVE_LAST + RISE).toFixed(1)}`);

/** a man's rise: 0 hidden .. 1 full orange */
export const musterRise = (id: number, f: number) => {
  const t = MUSTER[id].t;
  return t === -Infinity ? 1 : smoothstep((f - t) / RISE);
};
/** his step from the hidden post to the stand post (ambushMotion's), as an
 *  offset from the stand post (m): zero once he has stepped */
export const stepOffset = (id: number, f: number): P2 => {
  const m = SPANIARDS[id];
  const t = MUSTER[id].t;
  const e = t === -Infinity ? 1 : smootherstep((f - t) / RISE);
  return mul(sub(m.hidden, m.stand), 1 - e);
};
/** the rung (opacity) of man id at frame f */
export const rungOf = (id: number, f: number, hidden = HIDDEN_RUNG) => hidden + (1 - hidden) * musterRise(id, f);

// ---------------------------------------------------------------------------
// THE 168 ON SCREEN. Cut A draws all 168 as cased orange dots in one layer
// (FOOT order, then RIDERS order) at their posts with an idle sway (footAt /
// riderAt). This cut draws the same dots in the same order, each at A's
// position + his step offset, at his rung; the 62 horse are horse-and-rider
// glyphs (incaGlyphs' Horseman, the waiting pose, HORSE_WAIT_M = 5.2 m, world
// sized: 22 px at k 4.2) while they are big enough to read, each crossfading
// into his dot while the glyph is under ~10 px (glyph 10 px -> 7.5 px of the
// pull-back), a hashed +-2 f each; by F_GLYPHS_GONE every glyph is a dot.
// ---------------------------------------------------------------------------
export const ORANGE_ORDER: { id: number; foot: number; rider: number }[] = [
  ...FOOT.map((q, i) => ({ id: q.id, foot: i, rider: -1 })),
  ...RIDERS.map((r, i) => ({ id: r.id, foot: -1, rider: i })),
];
/** man id's world position at this cut's frame f (A's post + idle sway, + the step) */
export const orangeAt = (o: { id: number; foot: number; rider: number }, f: number): P2 => {
  const fa = f - A_OFFSET;
  const base = o.foot >= 0 ? footAt(o.foot, fa) : riderAt(RIDERS[o.rider], fa);
  return add(base, stepOffset(o.id, f));
};

// ---------------------------------------------------------------------------
// THE CAMERA. Cut A's camera, valid for negative frames, is A's pre-roll: the
// opening framing (k 1.30, the plaza's box centred on (540, 835)) creeping in
// 3.5 % with the plaza drifting left. This cut's camera IS that pre-roll plus
// an offset that eases to zero: in ln k and in the screen point of the
// platform (Pizarro's group: the pull-back pivots on him), each offset =
// D x (1 - R(f)), R the integral of one cosine-tapered velocity bump over
// PULL (f-10 .. F_JOIN). So it opens at k 4.2 on the platform corner, already
// moving on f0, pulls back in one long eased glide that follows the wave out
// round the ring, and from F_JOIN on it is A's pre-roll exactly (camA(f - 91)):
// C1 into A by construction (offset and its velocity both reach zero).
// ---------------------------------------------------------------------------
export const K_OPEN = 4.2;
/** the platform's screen point at the open: right of centre, just above the
 *  subject line, so the whole ring of the trap is in frame with a margin (the
 *  SW gate's body ~60 px in from the left edge, above the caption band) and
 *  the causeway leaves the corner toward the open country on the right */
export const PLAT_OPEN: P2 = [760, 790];
export const F_JOIN = 72;
export const PULL = { f0: -10, f1: F_JOIN, taper: 0.85 };
const RAMP = (() => {
  const t = makeTrack([[PULL.f0, PULL.f1, 1, PULL.taper]], 0, -40, 160);
  const a = t(PULL.f0);
  return (f: number) => (f <= PULL.f0 ? 0 : f >= PULL.f1 ? 1 : t(f) - a);
})();
const platA = (f: number) => screenOf(FC, camA(f - A_OFFSET));
const D_LK = (Math.log(K_OPEN) - Math.log(camA(-A_OFFSET).k)) / (1 - RAMP(0));
const P0A = platA(0);
const D_P: P2 = [(PLAT_OPEN[0] - P0A[0]) / (1 - RAMP(0)), (PLAT_OPEN[1] - P0A[1]) / (1 - RAMP(0))];
/** the authored camera at this cut's frame f (no sway) */
export const camAt = (f: number): Cam => {
  const w = 1 - RAMP(f);
  const ca = camA(f - A_OFFSET);
  if (w <= 0) return ca;
  const k = Math.exp(Math.log(ca.k) + D_LK * w);
  const pa = screenOf(FC, ca);
  const sx = pa[0] + D_P[0] * w;
  const sy = pa[1] + D_P[1] * w;
  return { k, cx: FC[0] - (sx - SCREEN_CX) / k, cy: FC[1] - (sy - SCREEN_CY) / k };
};
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));
/** the camera through the join: this cut, then A's own (for the checks) */
export const camThrough = (f: number): Cam => (f < DURATION ? camAt(f) : camA(f - A_OFFSET));
export { platA };

// the horsemen's glyph -> dot crossfade: by the glyph's on-screen size (10 px
// -> 7.5 px), or, if A's framing never gets the glyph that small, over the
// last of the pull-back down to just above its size at A's zoom
const K_JOIN = camA(F_JOIN - A_OFFSET).k;
export const GLYPH_PX = {
  from: Math.max(10, 1.22 * HORSE_WAIT_M * K_JOIN),
  to: Math.max(7.5, 1.03 * HORSE_WAIT_M * K_JOIN),
};
const frameOfK = (k: number) => {
  for (let f = 0; f <= LAST; f += 0.05) if (camAt(f).k <= k) return f;
  return LAST;
};
/** the frames the glyph is GLYPH_PX.from and GLYPH_PX.to px long */
export const F_GLYPH: [number, number] = [frameOfK(GLYPH_PX.from / HORSE_WAIT_M), frameOfK(GLYPH_PX.to / HORSE_WAIT_M)];
/** how far man id's glyph has become his dot (0 glyph .. 1 dot) */
export const dotShare = (id: number, f: number) => {
  const j = 2 * (2 * hash(id, 211) - 1);
  return smoothstep((f - F_GLYPH[0] - j) / (F_GLYPH[1] - F_GLYPH[0]));
};
export const F_GLYPHS_GONE = F_GLYPH[1] + 2;
if (F_GLYPHS_GONE > 78) throw new Error(`hisMotion: the glyphs are still crossfading on f${F_GLYPHS_GONE.toFixed(1)}`);

// "168": A's numeral, sliding up as the count completes (lands f62)
export const LABEL_F0 = 50;
