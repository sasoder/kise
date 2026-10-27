// ---------------------------------------------------------------------------
// TonsOfTVShows (neal-stephenson-trailer, cut 45). Core Memory podcast style, the clip's ARCHIVE COLLAGE at 16:9
// (./nealShared; the books and the row: ./booksWorld). Opaque 1920x1080, 23.976 fps, 105 frames.
//
// CHECK LINE: "Neal Stephenson is the man behind Snow Crash, The Diamond Age, Cryptonomicon, the Baroque Cycle,
// Anathem, Seveneves, Termination Shock — book after famous book comes off his desk."
//
// THE LINE (Ashlee Vance, the host; on camera just before: "And if anyone should have…"):
//   "…tons of TV shows and movies based on their work, it's you."
// WORD -> FRAME (local onset): tons -1 · of 7 · TV 14 · shows 21 · and 31 · movies 36 · based 43 · on 55 · their 60 ·
//   work 64 · it's ~78 · you 88 (ends ~95) · cut 105 (the edit goes to Neal: "The whole AI revolution…").
// DURATION: the slot 45.8792 -> 50.2585 s (sequence frames 1100 -> 1205) = 4.379 s x 23.976 = 105 frames (f0..f104).
//
// THE MOTION (KellysProductionRun's, at 16:9; revision 2 made every flight one smooth path on one speed profile): one continuous dolly pull-back from a close-up of Neal's face (already
// moving at f0; one acceleration, one long deceleration landing f88, then a creep: camAt45). His seven books, in
// publication order, come out from behind his head every 6 frames from f3 (Snow Crash first): each is born hidden
// behind his brow on a deeper plane (smaller, farther off), slides out sideways past his temple (left for the three
// left slots, right for the three right slots; the centre book rises straight up over his crown), then arcs up into
// its slot, coming forward to the row's plane as it goes and leaning into its travel; a chain trail rides behind it
// and collapses into the cover as it lands. The landed books make one row of face-out covers above his head
// (booksWorld COVER_ROW, the row cut 54 opens on); all seven down by ~f75, the frame complete on "it's you" (78-95):
// Neal centred below, his seven books above. To f104: the row bobbing <= 1.4 px, the camera creeping, film life.
// Nothing overlaps in flight (auditFrame, every frame); no cover enters the caption bands (auditBands, every frame).
// CHAIN = NEAL'S OWN (the clip's one meaning): his work, as the trail of every flying book. Never on Neal himself.
// No text: the titles are on the covers, the captions carry the words.
//
// SOURCES (details: <working>/animation_source/refs/ASSETS_READY.md): Neal Stephenson, 2008, photo Bob Lee, CC BY 2.0
// (Wikimedia Commons, Neal_Stephenson_2008.jpg). Covers: the US first-edition hardcover jackets (fair use, book
// covers): Snow Crash (Bantam 1992, art Jean-François Podevin), The Diamond Age (Bantam Spectra 1995, art Bruce
// Jensen), Cryptonomicon (Avon 1999), Quicksilver (William Morrow 2003), Anathem (Morrow 2008), Seveneves (Morrow
// 2015), Termination Shock (Morrow 2021). Page counts (thickness): 470, 455, 918, 927, 937, 880, 720 (same file).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { BookCutOut, COVER_H, COVER_ROW, NEAL, NealFigure, bookBob, camAt45 } from "./booksWorld";
import { CAPTION_BANDS, CaptionBands, NealFilmLife, NealPaper, NealPlane, depthScale, depthTransform } from "./nealShared";

export const FPS = 24000 / 1001;
export const DURATION = 105;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// ---------------------------------------------------------------------------
// THE FLIGHTS (revision 2: smoother). Each book flies ONE smooth path (rest px, on the focus plane) from behind his
// brow to its slot. Left books (0-2): one cubic arc, out sideways and round up into the slot (handles 0.55: a quarter
// ellipse). The centre book (3): straight up. Right books (4-6) fill inside-out, so each later one must pass UNDER
// the one(s) already landed: it runs out along a level lane, then a wide cubic turn (starting TURN_R x the rise
// before its slot's x) bends it up into the slot; the turn's first three control points are level, so direction and
// curvature are continuous where the lane meets it (no corner). The tangent is the curve's exact derivative.
// Speed: ONE profile per flight, v(u) ~ smoother(u / RAMP_IN) x smoother((1 - u) / RAMP_OUT), u = (f - t0) / dur: from
// rest with zero acceleration, one smooth peak, into the slot with zero speed and zero acceleration (no snap, no
// bounce). Launches every 6 frames; durations 29-43 frames: longer for longer paths and for flights flown while the
// camera is still close (DUR_K), so the peak screen speeds stay in one family.
// Depth: every book is DRAWN on the focus plane (its screen path is the smooth world path: no parallax lurch); its
// depth d only sets its size (a cover at depth d: depthScale(k, d) / (d k) of its row size) and the paint order.
// d holds D0 for the first DEPTH_LAG of the flight's time, then eases to 1 by the landing (smootherstep, so the
// growth starts and ends at rate 0): small while it passes under landed books, full size in its slot.
// Lean: from the smooth sideways velocity, tanh-capped at LEAN_MAX, 0 at rest. Trail: its step opens and closes
// continuously with speed. Bob: crossfades in over ~8 frames after landing.
// ---------------------------------------------------------------------------
/** depth at birth (behind his head): the left and centre books (nothing to pass under), the right books (they pass
 *  under the landed ones, so they stay farther off, smaller, until under their slot) */
const D0_L = 2;
const D0_R = 2.6;
const D0 = [D0_L, D0_L, D0_L, D0_L, D0_R, D0_R, D0_R];
const DEPTH_LAG = 0.35; // fraction of the flight time before the book starts coming forward
const STRIDE = 6; // frames between launches
const T0 = Array.from({ length: 7 }, (_, i) => 3 + STRIDE * i); // Snow Crash first
/** flight frames = DUR_BASE + DUR_PER_PX x path length x (camera k 15 frames after launch)^DUR_K */
const DUR_BASE = 24;
const DUR_PER_PX = 0.012;
const DUR_K = 1;
const RAMP_IN = 0.55; // the speed profile's smooth rise, as a fraction of the flight (the two ramps overlap: one peak)
const RAMP_OUT = 0.55; // its smooth settle
const LEAN_MAX = 4.5; // deg: the most a book leans into its sideways travel
const LEAN_V = 22; // rest px a frame sideways at which the lean is ~3/4 of LEAN_MAX (tanh)
const TRAIL_SCREEN = 8; // chain step, screen px at full speed
const TRAIL_V = 18; // rest px a frame at which the trail is fully open (it opens and closes smoothly with speed)
/** the side each book leaves his head by: -1 left, 0 straight up, +1 right */
const SIDE = [-1, -1, -1, 0, 1, 1, 1];
/** where it is born, relative to his brow (rest px on the focus plane) */
const BORN_DX = 18;
/** right books: the turn begins TURN_R x the rise before the slot's x (the level lane runs up to there) */
const TURN_R = 1.2;
/** the turn's handles: the leaving one (level) and the arriving one (vertical), as fractions of the run and the rise */
const HX_L = 0.55;
const HY_L = 0.55;
const HX_R = 0.55;
const HY_R = 0.7;

type Pt = [number, number];
type Flight = { i: number; t0: number; S: Pt; side: number; Llane: number; C: [Pt, Pt, Pt, Pt]; T: number[]; L: number; dur: number; tA: number };

const bez = (C: [Pt, Pt, Pt, Pt], u: number): Pt => {
  const v = 1 - u;
  const w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
  return [w[0] * C[0][0] + w[1] * C[1][0] + w[2] * C[2][0] + w[3] * C[3][0], w[0] * C[0][1] + w[1] * C[1][1] + w[2] * C[2][1] + w[3] * C[3][1]];
};
/** the curve's derivative (exact, so the tangent is smooth) */
const bezD = (C: [Pt, Pt, Pt, Pt], u: number): Pt => {
  const v = 1 - u;
  const w = [3 * v * v, 6 * v * u, 3 * u * u];
  return [
    w[0] * (C[1][0] - C[0][0]) + w[1] * (C[2][0] - C[1][0]) + w[2] * (C[3][0] - C[2][0]),
    w[0] * (C[1][1] - C[0][1]) + w[1] * (C[2][1] - C[1][1]) + w[2] * (C[3][1] - C[2][1]),
  ];
};
const N_LUT = 600;
/** cumulative arc length at u = j / N_LUT (Simpson-free: fine chords) */
const lut = (C: [Pt, Pt, Pt, Pt]) => {
  const out = [0];
  let prev = bez(C, 0);
  for (let j = 1; j <= N_LUT; j++) {
    const q = bez(C, j / N_LUT);
    out.push(out[j - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1]));
    prev = q;
  }
  return out;
};
const uAt = (T: number[], s: number) => {
  if (s <= 0) return 0;
  if (s >= T[N_LUT]) return 1;
  let lo = 0;
  let hi = N_LUT;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (T[m] < s) lo = m;
    else hi = m;
  }
  return (lo + (s - T[lo]) / (T[hi] - T[lo])) / N_LUT;
};
const smoother = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (6 * t - 15) + 10);
};
/** the speed profile's distance fraction E(u): the normalised integral of a smooth trapezoid v(u) = smoother(u /
 *  RAMP_IN) x smoother((1 - u) / RAMP_OUT) (a table, linearly read): peak speed ~1.6 x the mean, no plateau edges */
const N_E = 2000;
const E_TABLE: number[] = (() => {
  const out = [0];
  for (let j = 1; j <= N_E; j++) {
    const u = (j - 0.5) / N_E;
    out.push(out[j - 1] + smoother(u / RAMP_IN) * smoother((1 - u) / RAMP_OUT));
  }
  return out.map((x) => x / out[N_E]);
})();
const ease = (u: number) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const t = u * N_E;
  const j = Math.floor(t);
  return E_TABLE[j] + (E_TABLE[j + 1] - E_TABLE[j]) * (t - j);
};

const FLIGHTS: Flight[] = (() => {
  const raw = COVER_ROW.map((slot, i) => {
    const side = SIDE[i];
    // born hidden behind his brow at its launch: the brow point (every book is placed on the focus plane; its
    // depth only sets its size, so the screen path is the smooth world path, with no parallax lurch)
    const cam = camAt45(T0[i]);
    const t1 = depthTransform(cam, 1);
    const sb = t1.toScreen(NEAL.brow.x + side * BORN_DX, NEAL.brow.y);
    // never lower than its bottom edge 22 screen px above the first caption band
    const halfH = (COVER_H / 2) * (depthScale(cam.k, D0[i]) / D0[i]);
    const sy = Math.min(sb.y, CAPTION_BANDS[0][0] - 22 - halfH);
    const S: Pt = [(sb.x - t1.tx) / t1.k, (sy - t1.ty) / t1.k];
    const D: Pt = [slot.cx, slot.cy];
    const rise = S[1] - D[1];
    if (side === 0) {
      const C: [Pt, Pt, Pt, Pt] = [S, [S[0] + (D[0] - S[0]) / 3, S[1] - rise / 3], [S[0] + (2 * (D[0] - S[0])) / 3, S[1] - (2 * rise) / 3], D];
      const T = lut(C);
      return { i, S, side, Llane: 0, C, T, L: T[N_LUT] };
    }
    // left: no lane, one arc from S. Right: the lane, level from S to Q, then the turn from Q up into the slot
    const [HX, HY] = side < 0 ? [HX_L, HY_L] : [HX_R, HY_R];
    const qx = side < 0 ? S[0] : Math.max(S[0], D[0] - TURN_R * rise);
    const Q: Pt = [qx, S[1]];
    const C: [Pt, Pt, Pt, Pt] = [Q, [Q[0] + HX * (D[0] - Q[0]), Q[1]], [D[0], D[1] + HY * (Q[1] - D[1])], D];
    const T = lut(C);
    const Llane = Math.abs(qx - S[0]);
    return { i, S, side, Llane, C, T, L: Llane + T[N_LUT] };
  });
  return raw.map((r) => {
    const dur = DUR_BASE + DUR_PER_PX * r.L * Math.pow(camAt45(T0[r.i] + 15).k, DUR_K);
    return { ...r, t0: T0[r.i], dur, tA: T0[r.i] + dur };
  });
})();

type BookState = { x: number; y: number; d: number; scale: number; rot: number; tx: number; ty: number; speed: number; flying: boolean; landed: boolean };
const flownAt = (fl: Flight, f: number) => fl.L * ease((f - fl.t0) / fl.dur);
/** where book i is at frame f (rest px on the focus plane; d is its depth, which sets its size and paint order) */
const stateOf = (i: number, f: number): BookState => {
  const fl = FLIGHTS[i];
  const s = flownAt(fl, f);
  const onLane = s < fl.Llane;
  const u = onLane ? 0 : uAt(fl.T, s - fl.Llane);
  const [x, y] = onLane ? [fl.S[0] + fl.side * s, fl.S[1]] : bez(fl.C, u);
  const dv = onLane ? [fl.side, 0] : u < 1e-4 ? [fl.side, 0] : bezD(fl.C, u);
  const tl = Math.hypot(dv[0], dv[1]) || 1;
  const tx = dv[0] / tl;
  const ty = dv[1] / tl;
  // speed in rest px a frame (central difference of the smooth profile)
  const speed = Math.max(0, flownAt(fl, f + 0.5) - flownAt(fl, f - 0.5));
  // depth: holds D0, then eases to 1 by the landing (zero rate at both ends of the change)
  const d = 1 + (D0[i] - 1) * (1 - smoother(((f - fl.t0) / fl.dur - DEPTH_LAG) / (1 - DEPTH_LAG)));
  const landed = f >= fl.tA;
  // the bob crossfades in over ~8 frames after landing (bookBob's own ramp; 0 before)
  const bob = bookBob(i, f, f - fl.tA);
  // the lean: from the smooth sideways velocity, capped by tanh; back to 0 as the speed goes to 0
  const rot = LEAN_MAX * Math.tanh((tx * speed) / LEAN_V);
  // the size of a cover at depth d, drawn on the focus plane: its depth plane's screen scale over the focus plane's
  const k = camAt45(f).k;
  const scale = depthScale(k, d) / (d * k);
  return { x, y: y + bob, d, scale, rot, tx, ty, speed, flying: f >= fl.t0 && !landed, landed };
};

// ---------------------------------------------------------------------------
// REVIEW AIDS (not drawn): the schedule; per frame, the screen box of every book and any two that overlap.
// ---------------------------------------------------------------------------
export const FLIGHT_TABLE = FLIGHTS.map((fl) => ({ i: fl.i, t0: fl.t0, tA: fl.tA, dur: fl.dur, L: fl.L, start: fl.S }));
/** the chain step in screen px at a speed (rest px a frame): smooth in speed, no threshold */
const trailScreen = (speed: number) => TRAIL_SCREEN * smoother(speed / TRAIL_V);
type Box = { cx: number; cy: number; hw: number; hh: number; a: number };
/** book i's screen box at frame f (the whole silhouette, plus its trail when flying) */
export const bookBox = (i: number, f: number): Box => {
  const st = stateOf(i, f);
  const t = depthTransform(camAt45(f), 1);
  const c = t.toScreen(st.x, st.y);
  const k = t.k * st.scale;
  const trail = 1.5 * trailScreen(st.speed);
  // the cover box (+ thickness and shadow, ~12 px), the trail added along the travel axis
  const hw = (COVER_ROW[i].right - COVER_ROW[i].left + 24) * 0.5 * k;
  const hh = (290 + 16) * 0.5 * k;
  return { cx: c.x, cy: c.y, hw: hw + Math.abs(st.tx) * trail, hh: hh + Math.abs(st.ty) * trail, a: (st.rot * Math.PI) / 180 };
};
const overlaps = (p: Box, q: Box) => {
  const axes = [p.a, p.a + Math.PI / 2, q.a, q.a + Math.PI / 2];
  for (const ax of axes) {
    const ux = Math.cos(ax);
    const uy = Math.sin(ax);
    const proj = (b: Box) => Math.abs(b.hw * (Math.cos(b.a) * ux + Math.sin(b.a) * uy)) + Math.abs(b.hh * (-Math.sin(b.a) * ux + Math.cos(b.a) * uy));
    if (Math.abs((q.cx - p.cx) * ux + (q.cy - p.cy) * uy) > proj(p) + proj(q)) return false;
  }
  return true;
};
export const auditFrame = (f: number) => {
  const live = FLIGHTS.filter((fl) => f >= fl.t0).map((fl) => fl.i);
  const hits: string[] = [];
  for (let a = 0; a < live.length; a++)
    for (let b = a + 1; b < live.length; b++) if (overlaps(bookBox(live[a], f), bookBox(live[b], f))) hits.push(`${live[a]}x${live[b]}`);
  return { flying: live.filter((i) => stateOf(i, f).flying).length, hits };
};
export const bookStateAt = stateOf;

const TonsOfTVShows: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt45(frame);
  // paint order: farthest first (all of them behind Neal: they are born behind him)
  const order = FLIGHTS.filter((fl) => frame >= fl.t0)
    .map((fl) => ({ i: fl.i, st: stateOf(fl.i, frame) }))
    .sort((p, q) => q.st.d - p.st.d || p.i - q.i);
  return (
    <AbsoluteFill>
      <NealFilmLife frame={frame}>
        <NealPaper frame={frame} cam={cam} />
        {order.map(({ i, st }) => {
          // the trail opens and closes continuously with speed (it collapses into the cover as the book lands);
          // its step is in focus-plane world px
          const step = trailScreen(st.speed) / cam.k;
          return (
            <NealPlane key={i} cam={cam} d={1}>
              <BookCutOut i={i} x={st.x} y={st.y} scale={st.scale} rotate={st.rot} trail={step > 0.05 ? { dx: -st.tx, dy: -st.ty, step } : null} />
            </NealPlane>
          );
        })}
        <NealFigure cam={cam} />
      </NealFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default TonsOfTVShows;
