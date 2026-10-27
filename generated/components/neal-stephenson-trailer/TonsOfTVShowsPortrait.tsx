// ---------------------------------------------------------------------------
// TonsOfTVShowsPortrait (neal-stephenson-trailer, cut 45, 9:16). Core Memory podcast style, the clip's ARCHIVE COLLAGE
// at 9:16 (./nealShared; the books: ./booksWorld; the portrait shelf, Neal, camera, paper: ./booksWorldPortrait).
// Opaque 1080x1920, 23.976 fps, 105 frames. The portrait twin of TonsOfTVShows (rev 2, the smooth flights).
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
// THE MOTION: one continuous dolly pull-back from a close-up of Neal's face (camAtP: one acceleration, one long
// deceleration landing f88, then a creep). His seven books, in publication order, come up out of his head every 6
// frames from f3 (Snow Crash first): each is born hidden behind his brow, small (farther off), rises over his crown,
// swings out to its column and comes up into its slot, coming forward to full size and leaning into its sideways
// travel; a chain trail rides behind it and collapses into the cover as it lands. They land as a two-row shelf above
// his head (booksWorldPortrait P_SLOTS: 4 + 3, reading left to right then top to bottom), all seven down by ~f68,
// the frame complete on "it's you" (78-95): Neal below, his body of work above. To f104: the shelf bobbing <= 1.4 px,
// the camera creeping, film life. Nothing overlaps in flight; no visible cover enters the caption bands.
// CHAIN = NEAL'S OWN (the clip's one meaning): his work, as the trail of every flying book. Never on Neal himself.
// No text: the titles are on the covers, the captions carry the words.
//
// THE FLIGHTS (rev 2's rules). Each book flies ONE cubic path (world px, on the focus plane) from behind his brow to
// its slot: it leaves straight up (the first handle vertical, so it clears his crown) and arrives straight up into
// the slot (the last handle vertical), the sideways swing in between; the tangent is the curve's exact derivative.
// ONE speed profile per flight, v(u) ~ smoother(u / RAMP_IN) x smoother((1 - u) / RAMP_OUT): from rest with zero
// acceleration, one smooth peak, into the slot with zero speed and zero acceleration (no snap, no bounce). Durations
// one family: DUR_BASE + DUR_PER_PX x length x (camera k 15 frames after launch). Depth only sets size (drawn on the
// focus plane: no parallax lurch): D0 for the first DEPTH_LAG of the flight's time, then smoothly to 1 by the
// landing. Lean: tanh of the sideways speed, <= LEAN_MAX, 0 at rest. Trail: opens and closes continuously with
// speed. Bob: crossfades in over ~8 frames after landing.
//
// SOURCES (details: <working>/animation_source/refs/ASSETS_READY.md): Neal Stephenson, 2008, photo Bob Lee, CC BY 2.0
// (Wikimedia Commons, Neal_Stephenson_2008.jpg). Covers: the US first-edition hardcover jackets (fair use, book
// covers), as in TonsOfTVShows.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { BookCutOut, COVER_H, bookBob } from "./booksWorld";
import { NEAL_P, NealFigureP, PCaptionBands, P_SCALE, P_SLOTS, PortraitFilmLife, PortraitPaper, PortraitPlane, camAtP, pTransform } from "./booksWorldPortrait";
import { depthScale } from "./nealShared";

export const FPS = 24000 / 1001;
export const DURATION = 105;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// ---------------------------------------------------------------------------
// THE FLIGHTS
// ---------------------------------------------------------------------------
/** depth at birth (behind his head): the top row's books, the lower row's (born later, closer to the bands: smaller) */
const D0_0 = 2.2;
const D0_1 = 3;
const D0 = P_SLOTS.map((s) => (s.row === 0 ? D0_0 : D0_1));
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
const LEAN_V = 22; // world px a frame sideways at which the lean is ~3/4 of LEAN_MAX (tanh)
const TRAIL_SCREEN = 8; // chain step, screen px at full speed
const TRAIL_V = 18; // world px a frame at which the trail is fully open (it opens and closes smoothly with speed)
/** where it is born: behind his brow, shifted this fraction of the way toward its column */
const BORN_SPREAD = 0.12;
const BORN_SPREAD_1 = 0.12; // the lower row's
/** ...and this far below the top of his head (world px; his brow is ~124 down) */
const BORN_DY = 124;
/** the handles: leaving straight up (LEAVE x the rise), arriving straight up (ARRIVE x the rise) */
const LEAVE = 0.6;
const ARRIVE = 0.45;

type Pt = [number, number];
type Bez = [Pt, Pt, Pt, Pt];
type Flight = { i: number; t0: number; S: Pt; C: Bez; T: number[]; L: number; dur: number; tA: number };

const bez = (C: Bez, u: number): Pt => {
  const v = 1 - u;
  const w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
  return [w[0] * C[0][0] + w[1] * C[1][0] + w[2] * C[2][0] + w[3] * C[3][0], w[0] * C[0][1] + w[1] * C[1][1] + w[2] * C[2][1] + w[3] * C[3][1]];
};
/** the curve's derivative (exact, so the tangent is smooth) */
const bezD = (C: Bez, u: number): Pt => {
  const v = 1 - u;
  const w = [3 * v * v, 6 * v * u, 3 * u * u];
  return [
    w[0] * (C[1][0] - C[0][0]) + w[1] * (C[2][0] - C[1][0]) + w[2] * (C[3][0] - C[2][0]),
    w[0] * (C[1][1] - C[0][1]) + w[1] * (C[2][1] - C[1][1]) + w[2] * (C[3][1] - C[2][1]),
  ];
};
const N_LUT = 600;
/** cumulative arc length at u = j / N_LUT (fine chords) */
const lut = (C: Bez) => {
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
/** the speed profile's distance fraction E(u): the normalised integral of v(u) (a table, linearly read) */
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

const FLIGHTS: Flight[] = P_SLOTS.map((slot, i) => {
  const S: Pt = [NEAL_P.brow.x + (slot.row === 0 ? BORN_SPREAD : BORN_SPREAD_1) * (slot.cx - NEAL_P.brow.x), NEAL_P.headTop + BORN_DY];
  const D: Pt = [slot.cx, slot.cy];
  const rise = S[1] - D[1];
  const C: Bez = [S, [S[0], S[1] - LEAVE * rise], [D[0], D[1] + ARRIVE * rise], D];
  const T = lut(C);
  const L = T[N_LUT];
  const dur = DUR_BASE + DUR_PER_PX * L * Math.pow(camAtP(T0[i] + 15).k, DUR_K);
  return { i, t0: T0[i], S, C, T, L, dur, tA: T0[i] + dur };
});

type BookState = { x: number; y: number; d: number; scale: number; rot: number; tx: number; ty: number; speed: number; flying: boolean; landed: boolean };
const flownAt = (fl: Flight, f: number) => fl.L * ease((f - fl.t0) / fl.dur);
/** where book i is at frame f (world px on the focus plane; d is its depth, which sets its size and paint order) */
const stateOf = (i: number, f: number): BookState => {
  const fl = FLIGHTS[i];
  const s = flownAt(fl, f);
  const u = uAt(fl.T, s);
  const [x, y] = bez(fl.C, u);
  const dv = bezD(fl.C, Math.min(1 - 1e-4, Math.max(1e-4, u)));
  const tl = Math.hypot(dv[0], dv[1]) || 1;
  const tx = dv[0] / tl;
  const ty = dv[1] / tl;
  // speed in world px a frame (central difference of the smooth profile)
  const speed = Math.max(0, flownAt(fl, f + 0.5) - flownAt(fl, f - 0.5));
  // depth: holds D0, then eases to 1 by the landing (zero rate at both ends of the change)
  const d = 1 + (D0[i] - 1) * (1 - smoother(((f - fl.t0) / fl.dur - DEPTH_LAG) / (1 - DEPTH_LAG)));
  const landed = f >= fl.tA;
  // the bob crossfades in over ~8 frames after landing (bookBob's own ramp; 0 before)
  const bob = bookBob(i, f, f - fl.tA);
  // the lean: from the smooth sideways velocity, capped by tanh; back to 0 as the speed goes to 0
  const rot = LEAN_MAX * Math.tanh((tx * speed) / LEAN_V);
  // the size at depth d, drawn on the focus plane (x the shelf's book scale)
  const k = camAtP(f).k;
  const scale = (P_SCALE * depthScale(k, d)) / (d * k);
  return { x, y: y + bob, d, scale, rot, tx, ty, speed, flying: f >= fl.t0 && !landed, landed };
};

// ---------------------------------------------------------------------------
// REVIEW AIDS (not drawn): the schedule; per frame, the screen box of every book.
// ---------------------------------------------------------------------------
export const FLIGHT_TABLE = FLIGHTS.map((fl) => ({ i: fl.i, t0: fl.t0, tA: fl.tA, dur: fl.dur, L: fl.L, start: fl.S }));
/** the chain step in screen px at a speed (world px a frame): smooth in speed, no threshold */
const trailScreen = (speed: number) => TRAIL_SCREEN * smoother(speed / TRAIL_V);
type Box = { cx: number; cy: number; hw: number; hh: number; a: number };
/** book i's screen box at frame f (the whole silhouette, plus its trail when flying) */
export const bookBox = (i: number, f: number): Box => {
  const st = stateOf(i, f);
  const t = pTransform(camAtP(f));
  const c = t.toScreen(st.x, st.y);
  const k = (t.k * st.scale) / P_SCALE; // screen px per 16:9 rest px of the book
  const trail = 1.5 * trailScreen(st.speed);
  const hw = (P_SLOTS[i].right - P_SLOTS[i].left) / P_SCALE + 24;
  return {
    cx: c.x,
    cy: c.y,
    hw: hw * 0.5 * k * P_SCALE + Math.abs(st.tx) * trail,
    hh: (COVER_H + 16) * 0.5 * k * P_SCALE + Math.abs(st.ty) * trail,
    a: (st.rot * Math.PI) / 180,
  };
};
export const bookStateAt = stateOf;

const TonsOfTVShowsPortrait: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAtP(frame);
  // paint order: farthest first (all of them behind Neal: they are born behind him)
  const order = FLIGHTS.filter((fl) => frame >= fl.t0)
    .map((fl) => ({ i: fl.i, st: stateOf(fl.i, frame) }))
    .sort((p, q) => q.st.d - p.st.d || p.i - q.i);
  return (
    <AbsoluteFill>
      <PortraitFilmLife frame={frame}>
        <PortraitPaper frame={frame} cam={cam} />
        <PortraitPlane cam={cam}>
          {order.map(({ i, st }) => {
            // the trail opens and closes continuously with speed; its step is in focus-plane world px
            const step = trailScreen(st.speed) / cam.k;
            return (
              <BookCutOut key={i} i={i} x={st.x} y={st.y} scale={st.scale} rotate={st.rot} trail={step > 0.05 ? { dx: -st.tx, dy: -st.ty, step } : null} />
            );
          })}
        </PortraitPlane>
        <NealFigureP cam={cam} />
      </PortraitFilmLife>
      <PCaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default TonsOfTVShowsPortrait;
