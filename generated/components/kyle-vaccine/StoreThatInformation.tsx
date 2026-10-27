// ---------------------------------------------------------------------------
// StoreThatInformation (kyle-vaccine, cut 68). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 131 frames.
// The first cut in the LIBRARY OF CULTURAL EVOLUTION (libraryWorld.tsx, the shared world of cuts 68 + 76; its header
// is the API). Cut 76 opens on this cut's last frame and pulls back through the hall.
//
// CHECK LINE: "The hard-won discovery doesn't die with its discoverer: Jenner writes it into a book and the book goes
// onto the shelf with everything else we know."
//
// THE LINE: "But then the beauty of cultural evolution is that we can store that information. [And]"
// WORD -> FRAME (REV1 re-cut clock, f0 = 67.100 s): But -4 · then 2 · the 6 · BEAUTY 10 · of 25 · CULTURAL 29 ·
// EVOLUTION 38 · is 49 · that 74 · we 77 · can 80 · STORE 83 · that 95 · INFORMATION 101 · and 114 · end 131
// DURATION: the slot (first cut 68.001 -> 72.372 s; same 131 f in the re-cut) = 4.371 s x 29.97 = 131 frames (f0..f130).
//
// THE MOTION: near the front of the library, beside the first bookcase, Jenner holds his book open toward us, its pages
// glowing orange with the discovery (their light on his face and hands). On "beauty of cultural evolution" (f8-42) he
// closes it: the light squeezes into a bright seam round the boards. REV1 ("a lot of glitching as he's doing the movement"): he no longer turns through profile (the
// cast swaps waistcoat front / coat back there); he eases from three-quarter front to a three-quarter toward the case
// (yaw -0.72 -> -1.12, f36-74), stands closer to the slot (X -344) so his arm bends, his far hand leaves the cover
// in behind the closed book and on behind his body (f40-61, hidden), the near hand slides under the book's tail
// (f40-54) and the book turns spine-out on it in one slow continuous turn (f44-82) while it rises, lifts it to the
// free slot at shoulder height (f50-82) and on STORE slides it home: the hand moves onto the spine's lower third
// (f70-80; contact f80), the spine moves from f82 (first reaction), home f99 by INFORMATION; a soft shadow on the
// spines to its right, as wide as the depth still to go, shows the push. His hand lets go (f100-108) and comes back to
// his chest (f104-128, above the caption band) while he steps back half a pace to the right (f104-126, out of
// shot by f130: the last frame is the book alone in its row); the spine (a warm orange binding lit from within, two thin darker bands, the light leaking at
// its head and tail onto its neighbours) glows at the frame's centre among dozens of others (f100-130, a living frame: the glow breathing, motes, a slow creep). The far hand lets go of the book at
// f44-58 and hangs behind his body. The camera is ONE move (libraryWorld STORE_CAM: one even tapered-cosine lobe f14-122, plateau f47-89, a creep
// at both ends): a medium shot on Jenner (~670 px tall) and the open book (k 2.05), pushing in and panning left with the
// book onto the shelf (k 5.0, the spine ~50 px wide, centred at x ~545, y ~905). Cut 76's first frame = f130 (STORE_END).
// The book is drawn in front of Jenner while he shows it and behind his hand once it travels to the shelf. REV2 ("his
// hand still glitches a bit", f33): each hand's grip is a point in the book's own frame and moves with it; the far
// hand's elbow keeps one side (ELBOW_HINT: its arm no longer flips round as the closing book comes under his shoulder);
// the near hand slides from behind the cover out under the tail. REV2b (the book "levitating" over his palm, f58-72): the
// hand sits under the book's lowest point (the tail's corner at the spine) and is raised, frame by frame, until its
// outline touches the book's (REST_GAP 0), so the book rests on his palm all the way; the order changes over f63-67
// where front and back order renders are identical bar the book's soft light (a crossfade of that light only), before
// the hand comes up onto the spine in front.
// Orange = the vaccine knowledge only: the pages' light, the seam's leak, the shelved book's glow. Everything else in
// muted earthy local colours; Jenner never orange.
//
// DEPTH: the world's (eye 1.69 m, dRef 1800 at kRef 2, dolly 0.5; fog by the eye). Stack 0's front face Z 0; Jenner at
// X -322, Z -66; the slot VACCINE_SLOT (X -416, shelf surface Y -236, Z 0).
//
// SOURCES: Edward Jenner, An Inquiry into the Causes and Effects of the Variolae Vaccinae (London, 1798), a quarto
// (the book's shape only; no title or text on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirShadow, AirStage, WorldSvg, c01, lerp } from "../kits/dwarkesh-3d/dwarkesh3d";
import { LIB_BLOOM, LibraryStage, ShelfGlow, STORE_LAST, VACCINE_SLOT, VB, VaccineBook, bookGrips, libraryAir, storeCamAt, vec3, type BookPose, type LibItem, type V3 } from "./libraryWorld";
import { Jenner, breathe, standAt, vaccineAnchors, walkPose, type VPose } from "./vaccineFolk";

export const FPS = 30000 / 1001;
export const DURATION = 131;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (STORE_LAST !== DURATION - 1) throw new Error("STORE_LAST must be the cut's last frame");

const smooth = (v: number) => {
  const x = c01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};
const { add3, mul3, norm3, cross3 } = vec3;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS
// ---------------------------------------------------------------------------------------------------------------------
export const BEAT = {
  close: [8, 42] as const, // the book closes (beauty .. evolution)
  turn: [36, 74] as const, // the body eases a little further toward the case (three-quarter, never through profile)
  carry: [40, 66] as const, // the closed book comes to his left front
  spin: [44, 82] as const, // the book turns spine-out in his hand
  lift: [50, 82] as const, // up to the slot, sticking out by its depth
  contact: 80, // the hand on the spine
  slide: [82, 99] as const, // STORE 83: the push, home by INFORMATION 102
  release: [100, 108] as const,
  lower: [99, 112] as const, // the arm down to his side, elbow first
};
/** Jenner's feet */
export const JENNER = { X: -344, Z: -66 };
/** his queue's ribbon in a muted slate (the cast's near-black bow reads as a moustache from behind at this size) */
const JENNER_INKS = { ribbon: "#56606C" };

// the book's frame from yaw psi (the fore-edge direction about the vertical: 0 = +Z into the hall, PI = toward us,
// + toward +X) and tilt tau (the fore-edge lifted toward up)
const frameOf = (psi: number, tau: number): Omit<BookPose, "c"> => {
  const ez: V3 = norm3([Math.sin(psi) * Math.cos(tau), -Math.sin(tau), Math.cos(psi) * Math.cos(tau)]);
  // the head: up, orthogonal to ez
  const up: V3 = [0, -1, 0];
  const ey = norm3(vec3.sub3(up, mul3(ez, vec3.dot3(up, ez))));
  const ex = cross3(ez, ey);
  return { ex, ey, ez };
};
/** the book over the cut: pose, open, glow */
export const bookAt = (f: number) => {
  const cl = smooth((f - BEAT.close[0]) / (BEAT.close[1] - BEAT.close[0]));
  const open = 1 - cl;
  const tn = smooth((f - BEAT.turn[0]) / (BEAT.turn[1] - BEAT.turn[0]));
  const lf = smooth((f - BEAT.lift[0]) / (BEAT.lift[1] - BEAT.lift[0]));
  const sl = smooth((f - BEAT.slide[0]) / (BEAT.slide[1] - BEAT.slide[0]));
  // orientation: shown open toward us, tipped back (psi ~ PI + 0.25: a little to screen left, tau 0.62) -> spine-out,
  // upright (psi 2 PI: the fore-edge into the shelf), turning the way his body turns
  const sp = smooth((f - BEAT.spin[0]) / (BEAT.spin[1] - BEAT.spin[0]));
  const psi = lerp(Math.PI + 0.22, 2 * Math.PI, sp);
  const tau = lerp(0.66, 0, sp);
  const fr = frameOf(psi, tau);
  // the spine's centre: in front of him at waist-chest height, then to his left front, then up to the slot
  const S = VACCINE_SLOT;
  const pHold: V3 = [-374, -212, -128];
  const pSide: V3 = [-398, -228, -104];
  const pSlot: V3 = [S.X, S.Y - VB.h / 2, S.Z - VB.d];
  const pHome: V3 = [S.X, S.Y - VB.h / 2, S.Z];
  const cr = smooth((f - BEAT.carry[0]) / (BEAT.carry[1] - BEAT.carry[0]));
  let c: V3 = add3(mul3(pHold, 1 - cr), mul3(pSide, cr));
  // the lift arcs a little up before it settles in front of the slot
  const arc = Math.sin(Math.PI * lf) * 8;
  c = add3(mul3(c, 1 - lf), mul3(pSlot, lf));
  c = [c[0], c[1] - arc, c[2]];
  c = add3(mul3(c, 1 - sl), mul3(pHome, sl));
  // the glow: full in the open pages; the closing squeezes it into the edges (0.55); home it settles to a soft 0.8
  const glow = lerp(1, 0.72, cl) + 0.2 * smooth((f - BEAT.slide[1] + 4) / 14) + 0.04 * Math.sin(f * 0.11) * smooth((f - 100) / 10);
  return { pose: { c, ...fr } as BookPose, open, glow, home: sl, lift: lf, turn: tn };
};

// ---------------------------------------------------------------------------------------------------------------------
// JENNER: standing beside the case; one continuous turn from three-quarter front (facing screen left) to three-quarter
// back (facing the case), his head leading; both hands on the open book, then the near hand (his left = the rig's armR)
// carries it, pushes the spine home and lowers.
// ---------------------------------------------------------------------------------------------------------------------
const P2of = (A: ReturnType<typeof libraryAir>, p: V3): [number, number] => A.P.p(p[0], p[1], p[2]);
/** REV2: the far arm's elbow hint (figure space) and the frames it blends in and back out over */
const ELBOW_HINT = { v: [1, 0.3] as [number, number], in: [12, 26] as const, out: [72, 86] as const };
/** REV2b: the near hand's outline keeps this clearance (world units) from the book's outline while the book rides on
 *  it: touching, never overlapping (so the change of order there shows nothing) */
const REST_GAP = 0;
type P2 = [number, number];
/** the book's screen outline (world px): the hull of its eight corners */
export const bookOutline = (A: ReturnType<typeof libraryAir>, pose: BookPose): P2[] => {
  const pts: P2[] = [];
  for (const sx of [-VB.w / 2, VB.w / 2]) for (const sy of [-VB.h / 2, VB.h / 2]) for (const sz of [0, VB.d]) pts.push(P2of(A, add3(add3(add3(pose.c, mul3(pose.ex, sx)), mul3(pose.ey, sy)), mul3(pose.ez, sz))));
  const ps = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  const up: P2[] = [];
  for (const q of ps) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (const q of [...ps].reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
/** signed distance of q to a convex outline: + inside (depth), - outside (the true distance) */
export const sdPoly = (H: P2[], q: P2) => {
  let inside = true;
  let dmin = Infinity;
  for (let i = 0; i < H.length; i++) {
    const a = H[i];
    const b = H[(i + 1) % H.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const l2 = ex * ex + ey * ey || 1;
    if (ex * (q[1] - a[1]) - ey * (q[0] - a[0]) < 0) inside = false;
    const t = c01(((q[0] - a[0]) * ex + (q[1] - a[1]) * ey) / l2);
    dmin = Math.min(dmin, Math.hypot(q[0] - a[0] - t * ex, q[1] - a[1] - t * ey));
  }
  return inside ? dmin : -dmin;
};
/** the near hand's drawn outline (world px), sampled: the cast's mitten (vaccineFolkBody mitten: an ellipse of
 *  len 0.56 x wid 0.5 along the hand, the thumb), the shirt cuff and the coat's turned-back cuff at the wrist */
export const nearHandPoints = (an: ReturnType<typeof vaccineAnchors>): P2[] => {
  const W = an.wristR as P2;
  const k = Math.hypot(an.handR[0] - W[0], an.handR[1] - W[1]) / 11;
  const dd = [an.mittenR[0] - W[0], an.mittenR[1] - W[1]];
  const dl = Math.hypot(dd[0], dd[1]) || 1;
  const d: P2 = [dd[0] / dl, dd[1] / dl];
  const n: P2 = [-d[1], d[0]];
  const fist = c01(an.pose.armR.fist);
  const len = lerp(21, 18, fist) * k;
  const wid = lerp(16.5, 17.5, fist) * k;
  const out: P2[] = [];
  const ell = (c: P2, u: P2, rx: number, ry: number) => {
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * 2 * Math.PI;
      out.push([c[0] + u[0] * Math.cos(t) * rx - u[1] * Math.sin(t) * ry, c[1] + u[1] * Math.cos(t) * rx + u[0] * Math.sin(t) * ry]);
    }
  };
  ell(an.mittenR as P2, d, len * 0.56, wid * 0.5);
  // the thumb (both sides: the outline must not reach the book whichever side it is on)
  for (const ts of [-1, 1]) {
    const tb: P2 = [W[0] + d[0] * 6 * k + n[0] * ts * 7 * k, W[1] + d[1] * 6 * k + n[1] * ts * 7 * k];
    const a = (-ts * lerp(28, 70, fist) * Math.PI) / 180;
    const u: P2 = [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a)];
    ell([tb[0] + u[0] * 4 * k, tb[1] + u[1] * 4 * k], u, 5.4 * k, 4.2 * k);
  }
  // the cuffs: capsules along the forearm at the wrist
  const fe = [W[0] - an.elbowR[0], W[1] - an.elbowR[1]];
  const fl = Math.hypot(fe[0], fe[1]) || 1;
  const cu: P2 = [fe[0] / fl, fe[1] / fl];
  const cap = (s0: number, s1: number, r: number) => {
    for (let j = 0; j <= 6; j++) {
      const s = lerp(s0, s1, j / 6);
      const c: P2 = [W[0] + cu[0] * s, W[1] + cu[1] * s];
      for (let i = 0; i < 16; i++) out.push([c[0] + Math.cos((i / 16) * 2 * Math.PI) * r, c[1] + Math.sin((i / 16) * 2 * Math.PI) * r]);
    }
  };
  cap(-k, 3 * k, 8.25 * k);
  cap(-9 * k, 1.5 * k, 10.2 * k);
  return out;
};
export const jennerPose = (f: number): VPose => {
  const tn = smooth((f - BEAT.turn[0]) / (BEAT.turn[1] - BEAT.turn[0]));
  // REV1: a small, slow turn that stays three-quarter (the cast swaps the waistcoat front and the coat back as a figure
  // passes profile, |yaw| ~1.3; so he never gets there)
  const yaw = lerp(-0.72, -1.12, tn);
  // the head: down to the pages, up a little as the book closes, leading the turn, then up to the slot
  const lead = -0.12 * Math.sin(Math.PI * smooth((f - BEAT.turn[0] + 6) / (BEAT.turn[1] - BEAT.turn[0])));
  const pitch = lerp(16, 4, smooth((f - 24) / 22)) - 8 * smooth((f - 58) / 24) + 4 * smooth((f - 104) / 20);
  const q0: VPose = { ...standAt(yaw), headYaw: yaw + lead - 0.06, pitch, look: [0, lerp(0.5, 0, smooth((f - 22) / 20))] };
  // REV2: the far hand (the rig's armL, on the book's screen-left cover) keeps its elbow on ONE side all through the
  // closing and the tuck behind his body. The stand pose's elbow hint points down; as the closing book brings that grip
  // in right under his shoulder the arm's direction passes the hint, the elbow flipped sides and the hand swung round
  // (the jump the user saw at f33-55). The hint here points across his chest (the side the elbow is already on), so the
  // solve never reaches the flip; it blends in and out where the old hint already put the elbow at full bend on that
  // side, so f0 and the last frame are unchanged.
  const eh = smooth((f - ELBOW_HINT.in[0]) / (ELBOW_HINT.in[1] - ELBOW_HINT.in[0])) * (1 - smooth((f - ELBOW_HINT.out[0]) / (ELBOW_HINT.out[1] - ELBOW_HINT.out[0])));
  const q: VPose = eh > 0 ? { ...q0, armL: { ...q0.armL, elbow: [lerp(q0.armL.elbow[0], ELBOW_HINT.v[0], eh), lerp(q0.armL.elbow[1], ELBOW_HINT.v[1], eh)] } } : q0;
  // REV1b: the step back is a real step: the cast's walk cycle run backwards (one cycle = two planted steps of
  // WALK_STRIDE), his feet advancing exactly with `at` (jennerPos), the weight shifting with the cycle's own bob and a
  // small lean back against the direction of travel
  const p = stepP(f);
  const amt = smooth(p / 0.2) * smooth((1 - p) / 0.2);
  const qq = amt > 0.001 ? walkPose(q, 1 - p, amt) : q;
  return breathe({ ...qq, lean: qq.lean + 2 * amt }, f, 0.8, 2);
};
/** after letting go he steps back to the right (f102-126): one walk cycle backwards = 2 x 44 units, out of shot */
export const STEP = { f: [102, 126] as const, dX: 88, dZ: 0 };
/** the step's progress: an even pace with short soft ends (the feet stay planted: x follows it exactly) */
const stepP = (f: number) => {
  const [a, b] = STEP.f;
  const x = c01((f - a) / (b - a));
  const r = 0.16;
  // trapezoid velocity (ramps of r at each end), integrated and normalised
  const area = 1 - r;
  const pos = x < r ? (x * x) / (2 * r) : x > 1 - r ? 1 - r - ((1 - x) * (1 - x)) / (2 * r) : x - r / 2;
  return c01(pos / area);
};
export const jennerPos = (f: number) => ({ X: JENNER.X + STEP.dX * stepP(f), Z: JENNER.Z + STEP.dZ * stepP(f) });
export const jennerAt = (A: ReturnType<typeof libraryAir>, f: number) => {
  const p = jennerPos(f);
  return A.P.at(p.X, p.Z);
};
/** the hands' grip points (world px) and which hands grip, per frame */
export const jennerGrips = (A: ReturnType<typeof libraryAir>, f: number, B: ReturnType<typeof bookAt>) => {
  const { at, scale } = jennerAt(A, f);
  const q = jennerPose(f);
  const rest = vaccineAnchors("jenner", q, at, scale, { hold: { L: "none", R: "none" } });
  const g = bookGrips(B.pose, B.open);
  const mixP = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  // his right (armL, the far hand): on the +ex cover until the book is closed, then back to his side
  // REV1: it goes back behind his body (hidden by the torso: his back is to the screen right) instead of hanging at the
  // front edge of the waistcoat, where it would cross the caption bands as the camera pushes in
  const behind: [number, number] = [rest.hip[0] + 20 * scale, rest.hip[1] - 14 * scale];
  // the path: off the cover in behind the closed book (it hides the hand), then on behind his body
  // (REV2: the on-the-book part in the book's own frame, so the hand moves with it)
  const bookMid: V3 = vec3.add3(B.pose.c, vec3.mul3(B.pose.ez, VB.d * 0.5));
  const Lg = mixP(P2of(A, vec3.add3(vec3.mul3(g.R, 1 - smooth((f - 40) / 10)), vec3.mul3(bookMid, smooth((f - 40) / 10)))), behind, smooth((f - 49) / 12));
  // his left (armR, the near hand): the book's -ex cover all the way, moving onto the spine for the push
  // the push lands on the spine's lower third, so the glowing head of the spine stays in view
  const spineFront: V3 = vec3.add3(vec3.add3(B.pose.c, vec3.mul3(B.pose.ez, -1.5)), vec3.mul3(B.pose.ey, -VB.h * 0.3));
  // carrying: from the cover's edge to under the book's tail (the book rides on his fingers, its spine and the glowing
  // head in view above the hand), then onto the spine's lower third for the push
  // REV2: every target is a point in the BOOK's own frame and the hand's point moves between them in 3D, so the hand
  // rides with the book. REV2b: under the tail the book RESTS on his fingers on every frame: the hand's point sits below
  // the tail by exactly the drop that brings the hand's outline up against the book's (REST_GAP, solved per frame), so
  // they touch and never overlap; the book goes behind him there (the order change) with nothing of him overlapping it
  const toTail = smooth((f - 40) / 14);
  const onSpine = smooth((f - 70) / (BEAT.contact - 70));
  const mix3 = (a: V3, b: V3, t: number): V3 => vec3.add3(vec3.mul3(a, 1 - t), vec3.mul3(b, t));
  // under the book's lowest point: the tail's corner at the spine on this cover's side (the turning, tipped book's
  // lowest point all through f44-80), so the book's weight sits on his palm
  const tailAt = (drop: number): V3 => vec3.add3(vec3.add3(B.pose.c, vec3.mul3(B.pose.ey, -VB.h * 0.5 - drop)), vec3.mul3(B.pose.ex, -VB.w * 0.5));
  let tail = tailAt(0);
  if (toTail > 0 && onSpine < 1) {
    const H = bookOutline(A, B.pose);
    // the hand's outline at a drop: its deepest point into the book (+ = overlap, - = gap)
    const reach = (drop: number) => {
      const an = vaccineAnchors("jenner", q, at, scale, { grip: { L: Lg, R: P2of(A, tailAt(drop)) }, hold: { L: "none", R: "none" } });
      return Math.max(...nearHandPoints(an).map((p) => sdPoly(H, p)));
    };
    let lo = 0;
    let hi = 30;
    for (let it = 0; it < 22; it++) {
      const mid = (lo + hi) / 2;
      if (reach(mid) > -REST_GAP) lo = mid;
      else hi = mid;
    }
    tail = tailAt(hi);
  }
  const R = P2of(A, mix3(mix3(g.L, tail, toTail), spineFront, onSpine));
  // REV1b, the release: the hand lifts off the spine and the arm comes down to his side in one eased arc, elbow first
  // (the hand first draws back toward his body, then drops), f99-112; after that the arm hangs free (no grip)
  const low = smooth((f - BEAT.lower[0]) / (BEAT.lower[1] - BEAT.lower[0]));
  let Rg: [number, number] | undefined = R;
  if (low > 0) {
    const P0 = R;
    const T = rest.handR;
    const C: [number, number] = [lerp(P0[0], T[0], 0.72), lerp(P0[1], T[1], 0.22)];
    const u = low;
    Rg = [(1 - u) * (1 - u) * P0[0] + 2 * u * (1 - u) * C[0] + u * u * T[0], (1 - u) * (1 - u) * P0[1] + 2 * u * (1 - u) * C[1] + u * u * T[1]];
    if (low >= 0.999) Rg = undefined;
  }
  return { L: Lg, R: Rg };
};

/** this cut's own items (Jenner, his shadow, the book, its glow and shadow, the pages' light) at cut frame `frame`,
 *  for any camera's AirWorld A: cut 76 draws storeItems(A76, STORE_LAST) to hold Jenner and the shelved book exactly */
export const storeItems = (A: ReturnType<typeof libraryAir>, frame: number): LibItem[] => {
  const cam = A.cam;
  const B = bookAt(frame);
  const S = VACCINE_SLOT;
  const { at, scale } = jennerAt(A, frame);
  const grip = jennerGrips(A, frame, B);
  const items: LibItem[] = [];
  // the book: in front of Jenner while he shows it, behind him once it travels to the shelf. REV2: the order changes
  // only while nothing of him overlaps the book (f63-67, the hand touching under the tail); the crossfade only eases the
  // book's own soft light on him
  const SW = [63, 67] as const;
  const front = 1 - smooth((frame - SW[0]) / (SW[1] - SW[0]));
  const bookNode = (k: string, op = 1) => (
    <g key={k} opacity={op}>
      {B.home > 0.4 ? <ShelfGlow A={A} X={S.X} Y={S.Y} Z={S.Z} amt={1.25 * c01((B.home - 0.4) / 0.6) * B.glow} spread={1.3} uid={`${k}sg`} /> : null}
      <VaccineBook A={A} pose={B.pose} open={B.open} glow={B.glow} uid={`${k}vb`} />
    </g>
  );
  if (front < 1) items.push({ Z: JENNER.Z + 4, key: "bookB", node: () => bookNode("bkB") });
  if (front > 0) items.push({ Z: JENNER.Z - 4, key: "bookF", node: () => bookNode("bkF", front) });
  // the book's soft shadow on the spines to its right while it sticks out (light from the upper left and in front):
  // its width is the depth still to go, so the push reads even in this frontal view
  const outBy = S.Z - B.pose.c[2];
  const shA = smooth((frame - 70) / 10) * c01(outBy / 6);
  if (shA > 0.01) {
    const top = S.Y - VB.h;
    const xa = S.X + VB.w / 2;
    const q = [A.P.p(xa, top + 0.25 * outBy, S.Z), A.P.p(xa + 0.5 * outBy, top + 0.45 * outBy, S.Z), A.P.p(xa + 0.5 * outBy, S.Y, S.Z), A.P.p(xa, S.Y, S.Z)];
    items.push({
      Z: S.Z - 0.2,
      key: "bshadow",
      node: () => (
        <g key="bsh">
          <defs>
            <filter id="bsh-b" x="-50%" y="-20%" width="200%" height="140%">
              <feGaussianBlur stdDeviation={(1.4 * A.P.r(0)).toFixed(3)} />
            </filter>
          </defs>
          <path d={`M${q.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}Z`} fill="#22180F" opacity={0.42 * shA} filter="url(#bsh-b)" />
        </g>
      ),
    });
  }
  const jp = jennerPos(frame);
  items.push({ Z: jp.Z + 1, key: "jshadow", node: () => <AirShadow key="js" A={A} X={jp.X} Z={jp.Z} w={62} d={30} uid="jsh" amt={0.8} /> });
  items.push({
    Z: jp.Z,
    key: "jenner",
    node: () => <Jenner key="jen" pose={jennerPose(frame)} at={at} scale={scale} uid="jen" fog={A.folkFog(jp.Z)} unitPx={cam.k} grip={grip} hold={{ L: "none", R: "none" }} frame={frame} inks={JENNER_INKS} />,
  });
  // the pages' light on his face and hands, from below (screen), while the book is open
  const lightAmt = 0.3 * B.open * B.glow;
  if (lightAmt > 0.005) {
    const an = vaccineAnchors("jenner", jennerPose(frame), at, scale, { grip, hold: { L: "none", R: "none" } });
    const fc: [number, number] = [an.headC[0], an.headC[1] + an.headR * 0.45];
    items.push({
      Z: JENNER.Z - 6,
      key: "facelight",
      node: () => (
        <g key="fl" style={{ mixBlendMode: "screen" }}>
          <defs>
            <radialGradient id="fl-g">
              <stop offset="0" stopColor="#FFB000" stopOpacity={lightAmt} />
              <stop offset="0.5" stopColor="#FFB000" stopOpacity={lightAmt * 0.35} />
              <stop offset="1" stopColor="#FFB000" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={fc[0]} cy={fc[1]} rx={an.headR * 1.5} ry={an.headR * 1.3} fill="url(#fl-g)" />
        </g>
      ),
    });
  }
  return items;
};

const StoreThatInformation: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = storeCamAt(frame);
  const A = libraryAir(cam, frame);
  const items = storeItems(A, frame);
  return (
    <AirStage v={A.v} shafts={0} bloom={LIB_BLOOM}>
      <WorldSvg cam={cam}>
        <LibraryStage A={A} frame={frame} extra={items} />
      </WorldSvg>
    </AirStage>
  );
};

export default StoreThatInformation;
