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
// THE MOTION (KellysProductionRun's, at 16:9): one continuous dolly pull-back from a close-up of Neal's face (already
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
import { CAPTION_BANDS, CaptionBands, NealFilmLife, NealPaper, NealPlane, depthTransform } from "./nealShared";

export const FPS = 24000 / 1001;
export const DURATION = 105;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// ---------------------------------------------------------------------------
// THE FLIGHTS. Path points are REST px (booksWorld); the book is drawn on a plane of depth d that runs from D0
// (behind his head) to 1 (the row) over the arc, at 1/d of its row size.
// ---------------------------------------------------------------------------
const D0 = 1.8;
const T0 = [3, 9, 15, 21, 27, 33, 39]; // one every 6 frames, Snow Crash first
const TD = 16; // frames of deceleration into the slot
/** each flight's length in frames (launch -> landed); its cruise speed follows from its path length */
const DUR = [40, 38, 34, 16, 16, 23, 36];
const LEAN = 8; // deg of lean at 30 rest px a frame sideways
const TRAIL_SCREEN = 8; // chain step, screen px at speed (full from 17 rest px a frame)
const SETTLING = 3; // rest px a frame: slower than this a book is settling, not flying
/** the side each book leaves his head by: -1 left, 0 straight up, +1 right */
const SIDE = [-1, -1, -1, 0, 1, 1, 1];
/** where it is born, relative to his brow (rest px on the focus plane) */
const BORN_DX = 18;

type Pt = [number, number];
type Flight = { i: number; t0: number; P: Pt[]; T: number[]; L: number; Llane: number; V: number; Tc: number; Td: number; tA: number };

const N_LUT = 240;
const at = (P: Pt[], u: number): Pt => {
  const t = Math.min(1, Math.max(0, u)) * (P.length - 1);
  const i = Math.min(P.length - 2, Math.floor(t));
  const k = t - i;
  return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k];
};
const lut = (P: Pt[]) => {
  const out = [0];
  let prev = at(P, 0);
  for (let i = 1; i <= N_LUT; i++) {
    const q = at(P, i / N_LUT);
    out.push(out[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1]));
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
const cubic = (A: Pt, B: Pt, C: Pt, D: Pt, n: number): Pt[] =>
  Array.from({ length: n + 1 }, (_, j): Pt => {
    const u = j / n;
    const v = 1 - u;
    const w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
    return [w[0] * A[0] + w[1] * B[0] + w[2] * C[0] + w[3] * D[0], w[0] * A[1] + w[1] * B[1] + w[2] * C[1] + w[3] * D[1]];
  });
const line = (A: Pt, D: Pt, n: number): Pt[] => Array.from({ length: n + 1 }, (_, j): Pt => [A[0] + ((D[0] - A[0]) * j) / n, A[1] + ((D[1] - A[1]) * j) / n]);
/** distance flown at frame f: cruise V, then v = V (1-u)^2 to rest over Td */
const flownAt = (fl: Flight, f: number) => {
  const t = f - fl.t0;
  if (t <= 0) return 0;
  if (t <= fl.Tc) return fl.V * t;
  const u = Math.min(1, (t - fl.Tc) / fl.Td);
  return fl.V * fl.Tc + (fl.V * fl.Td * (1 - Math.pow(1 - u, 3))) / 3;
};
const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

const FLIGHTS: Flight[] = COVER_ROW.map((slot, i) => {
  const t0 = T0[i];
  const side = SIDE[i];
  // born hidden behind his brow at t0: the brow's screen point, as rest px on the plane D0
  const cam = camAt45(t0);
  const sb = depthTransform(cam, 1).toScreen(NEAL.brow.x + side * BORN_DX, NEAL.brow.y);
  const td = depthTransform(cam, D0);
  // never lower than its bottom edge 22 screen px above the first caption band
  const halfH = (COVER_H / D0 / 2) * td.k;
  const sy = Math.min(sb.y, CAPTION_BANDS[0][0] - 22 - halfH);
  const S: Pt = [(sb.x - td.tx) / td.k, (sy - td.ty) / td.k];
  const D: Pt = [slot.cx, slot.cy];
  let P: Pt[];
  let Llane = 0;
  if (side === 0) {
    P = line(S, D, 120);
  } else {
    const rise = S[1] - D[1];
    const rad = 0.3 * rise; // the turn's horizontal reach
    const qx = side < 0 ? Math.min(S[0], D[0] + rad) : Math.max(S[0], D[0] - rad);
    const Q: Pt = [qx, S[1]];
    Llane = Math.abs(qx - S[0]);
    const dx = Math.abs(D[0] - qx);
    const arc = cubic(Q, [Q[0] + side * 0.6 * dx, Q[1]], [D[0], D[1] + 0.5 * rise], D, 120);
    P = Llane > 1 ? [...line(S, Q, 60).slice(0, -1), ...arc] : arc;
  }
  const T = lut(P);
  const L = T[N_LUT];
  const Td = Math.min(TD, DUR[i]);
  const Tc = DUR[i] - Td;
  const V = L / (Tc + Td / 3);
  return { i, t0, P, T, L, Llane: Math.min(Llane, L), V, Tc, Td, tA: t0 + Tc + Td };
});

type BookState = { x: number; y: number; d: number; scale: number; rot: number; tx: number; ty: number; speed: number; flying: boolean; landed: boolean };
/** where book i is at frame f (rest px on its plane d) */
const stateOf = (i: number, f: number): BookState => {
  const fl = FLIGHTS[i];
  const s = Math.min(fl.L, flownAt(fl, f));
  const u = uAt(fl.T, s);
  const [x, y] = at(fl.P, u);
  const a = at(fl.P, Math.max(0, u - 0.003));
  const b = at(fl.P, Math.min(1, u + 0.003));
  const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const tx = (b[0] - a[0]) / tl;
  const ty = (b[1] - a[1]) / tl;
  const speed = Math.max(0, flownAt(fl, f + 0.5) - flownAt(fl, f - 0.5));
  const d = s <= fl.Llane ? D0 : D0 + (1 - D0) * smooth((s - fl.Llane) / Math.max(1, fl.L - fl.Llane));
  const landed = f >= fl.tA;
  const bob = bookBob(i, f, f - fl.tA);
  return { x, y: y + (landed || speed < SETTLING ? bob : 0), d, scale: 1 / d, rot: (LEAN * tx * speed) / 30, tx, ty, speed, flying: f >= fl.t0 && speed > SETTLING, landed };
};

// ---------------------------------------------------------------------------
// REVIEW AIDS (not drawn): the schedule; per frame, the screen box of every book and any two that overlap.
// ---------------------------------------------------------------------------
export const FLIGHT_TABLE = FLIGHTS.map((fl) => ({ i: fl.i, t0: fl.t0, tA: fl.tA, L: fl.L, Llane: fl.Llane, start: fl.P[0] }));
type Box = { cx: number; cy: number; hw: number; hh: number; a: number };
/** book i's screen box at frame f (the whole silhouette, plus its trail when flying) */
export const bookBox = (i: number, f: number): Box => {
  const st = stateOf(i, f);
  const t = depthTransform(camAt45(f), st.d);
  const c = t.toScreen(st.x, st.y);
  const k = t.k * st.scale;
  const trail = st.flying ? 1.5 * TRAIL_SCREEN : 0;
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
          const kd = depthTransform(cam, st.d).k;
          // the trail opens with speed and is gone below ~3 rest px a frame (it collapses into the cover as it lands)
          const step = st.flying ? (TRAIL_SCREEN * smooth((st.speed - SETTLING) / 14)) / kd : 0;
          return (
            <NealPlane key={i} cam={cam} d={st.d}>
              <BookCutOut i={i} x={st.x} y={st.y} scale={st.scale} rotate={st.rot} trail={step > 0 ? { dx: -st.tx, dy: -st.ty, step } : null} />
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
