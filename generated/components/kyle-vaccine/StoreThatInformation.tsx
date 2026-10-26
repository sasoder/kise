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
// WORD -> FRAME (f0 = 68.001 s): then 2 · the 6 · BEAUTY 10 · of 23 · CULTURAL 29 · EVOLUTION 38 · is 50 · that 73 ·
// we 77 · can 80 · STORE 83 · that 95 · INFORMATION 102 · (And 121) · end 131
// DURATION: the slot 68.001 -> 72.372 s = 4.371 s x 29.97 = 131 frames (f0..f130).
//
// THE MOTION: near the front of the library, beside the first bookcase, Jenner holds his book open toward us, its pages
// glowing orange with the discovery (their light on his face and hands). On "beauty of cultural evolution" (f8-42) he
// closes it: the light squeezes into a bright seam round the boards. He turns in place to the bookcase (yaw -0.72 ->
// -2.32, f34-70, his head leading), the book turning spine-out on the fingers of his near (left) hand, lifts it to the
// free slot at shoulder height (f50-82) and on STORE slides it home: the hand moves onto the spine's lower third
// (f70-80; contact f80), the spine moves from f82 (first reaction), home f99 by INFORMATION; a soft shadow on the
// spines to its right, as wide as the depth still to go, shows the push. His hand lets go (f100-108) and comes back to
// his chest (f104-128, above the caption band) while he steps back half a pace to the right (f106-124, out of
// shot but a coat edge); the spine (a warm orange binding lit from within, two thin darker bands, the light leaking at
// its head and tail onto its neighbours) glows at the frame's centre among dozens of others (f100-130, a living frame: the glow breathing, motes, a slow creep). The far hand lets go of the book at
// f44-58 and hangs behind his body. The camera is ONE move (libraryWorld STORE_CAM: one even tapered-cosine lobe f14-122, plateau f47-89, a creep
// at both ends): a medium shot on Jenner (~670 px tall) and the open book (k 2.05), pushing in and panning left with the
// book onto the shelf (k 5.0, the spine ~50 px wide, centred at x ~545, y ~905). Cut 76's first frame = f130 (STORE_END).
// The book is drawn in front of Jenner while he shows it and behind his hand once it travels to the shelf: the front
// copy crossfades out over f58-66 so the change of order never pops.
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
import { Jenner, breathe, standAt, vaccineAnchors, type VPose } from "./vaccineFolk";

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
  turn: [34, 70] as const, // the body turns to the case; the book turns spine-out
  lift: [50, 82] as const, // up to the slot, sticking out by its depth
  contact: 80, // the hand on the spine
  slide: [82, 99] as const, // STORE 83: the push, home by INFORMATION 102
  release: [100, 108] as const,
  lower: [104, 128] as const,
};
/** Jenner's feet */
export const JENNER = { X: -322, Z: -66 };
/** his queue's ribbon in a muted slate (the cast's near-black bow reads as a moustache from behind at this size) */
const JENNER_INKS = { ribbon: "#56606C" };
/** where his left hand comes to rest after shelving: at his chest, his own left lapel */
const LAPEL: V3 = [-342, -236, -84];

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
  const psi = lerp(Math.PI + 0.22, 2 * Math.PI, tn);
  const tau = lerp(0.66, 0, smooth((f - BEAT.turn[0] - 4) / (BEAT.turn[1] - BEAT.turn[0] - 4)));
  const fr = frameOf(psi, tau);
  // the spine's centre: in front of him at waist-chest height, then to his left front, then up to the slot
  const S = VACCINE_SLOT;
  const pHold: V3 = [-352, -212, -128];
  const pSide: V3 = [-382, -228, -104];
  const pSlot: V3 = [S.X, S.Y - VB.h / 2, S.Z - VB.d];
  const pHome: V3 = [S.X, S.Y - VB.h / 2, S.Z];
  let c: V3 = add3(mul3(pHold, 1 - tn), mul3(pSide, tn));
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
export const jennerPose = (f: number): VPose => {
  const tn = smooth((f - BEAT.turn[0]) / (BEAT.turn[1] - BEAT.turn[0]));
  const yaw = lerp(-0.72, -2.32, tn);
  // the head: down to the pages, up a little as the book closes, leading the turn, then up to the slot
  const lead = -0.34 * Math.sin(Math.PI * smooth((f - BEAT.turn[0] + 6) / (BEAT.turn[1] - BEAT.turn[0])));
  const pitch = lerp(16, 4, smooth((f - 24) / 22)) - 8 * smooth((f - 58) / 24) + 4 * smooth((f - 104) / 20);
  const q: VPose = { ...standAt(yaw), headYaw: yaw + lead - 0.06, pitch, look: [0, lerp(0.5, 0, smooth((f - 22) / 20))] };
  const st = stepT(f);
  const dip = 3.2 * Math.sin(Math.PI * st);
  return breathe({ ...q, crouch: q.crouch + dip, lean: q.lean - 2.5 * Math.sin(Math.PI * st) }, f, 0.8, 2);
};
/** after letting go he steps back half a pace to the right (f106-124), out of the book's way */
export const STEP = { f: [106, 124] as const, dX: 44, dZ: -12 };
const stepT = (f: number) => smooth((f - STEP.f[0]) / (STEP.f[1] - STEP.f[0]));
export const jennerPos = (f: number) => ({ X: JENNER.X + STEP.dX * stepT(f), Z: JENNER.Z + STEP.dZ * stepT(f) });
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
  // his left (armR, the near hand): the book's -ex cover all the way, moving onto the spine for the push
  // the push lands on the spine's lower third, so the glowing head of the spine stays in view
  const spineFront: V3 = vec3.add3(vec3.add3(B.pose.c, vec3.mul3(B.pose.ez, -1.5)), vec3.mul3(B.pose.ey, -VB.h * 0.3));
  // carrying: from the cover's edge to under the book's tail (the book rides on his fingers, its spine and the glowing
  // head in view above the hand), then onto the spine's lower third for the push
  const tail: V3 = vec3.add3(vec3.add3(B.pose.c, vec3.mul3(B.pose.ey, -VB.h * 0.5)), vec3.mul3(B.pose.ez, VB.d * 0.22));
  const toTail = smooth((f - 46) / 16);
  const onSpine = smooth((f - 70) / (BEAT.contact - 70));
  let R = mixP(mixP(P2of(A, g.L), P2of(A, tail), toTail), P2of(A, spineFront), onSpine);
  // the release: off the spine toward us and down, then back to his side
  const rel = smooth((f - BEAT.release[0]) / (BEAT.release[1] - BEAT.release[0]));
  const low = smooth((f - BEAT.lower[0]) / (BEAT.lower[1] - BEAT.lower[0]));
  const off: [number, number] = [8 * scale, 10 * scale];
  R = mixP(R, [R[0] + off[0], R[1] + off[1]], rel);
  // then the hand comes back to his chest (his own left lapel), staying above the caption band, leaving the frame right
  // (a fixed world point in front of his left breast, high enough to stay above the y 1080 caption band at the end)
  const lapel = P2of(A, [LAPEL[0] + STEP.dX * stepT(f), LAPEL[1], LAPEL[2] + STEP.dZ * stepT(f)]);
  R = [lerp(R[0], lapel[0], smooth(low * 1.25)), lerp(R[1], lapel[1], low)];
  // his right (armL, the far hand): on the +ex cover until the book is closed, then back to his side
  const letGo = smooth((f - 44) / 14);
  const L = mixP(P2of(A, g.R), rest.handL, letGo);
  return { L: letGo < 0.999 ? L : undefined, R };
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
  // the book: in front of Jenner while he shows it, behind his hand once it travels to the shelf (a short crossfade of
  // the front copy hides the change of order where the hand overlaps it)
  const SW = [58, 66] as const;
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
