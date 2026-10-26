// ---------------------------------------------------------------------------
// KidsDieOfSmallpox (kyle-vaccine, cut 41). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 136 frames.
//
// CHECK LINE: "Out of a row of ten children, smallpox took one, then two."
//
// THE LINE: "But in a world where like 10, 20 percent of kids die of smallpox, it's [this horrible decision]"
// WORD -> FRAME (f0 = 41.909 s): in 2 · a 12 · WORLD 15 · where 23 · like 27 · TEN 34 · TWENTY 46 · PERCENT 56 · of 67 ·
// KIDS 81 · DIE 100 · of 110 · SMALLPOX 113 · it's 132 · end 136.
// DURATION: the slot 41.909 -> 46.446 s = 4.538 s x 29.97 = 136 frames (f0..f135).
//
// THE MOTION (round 2, the director's restage): ten Georgian children (vaccineFolk Child v0..v9, every one distinct)
// sit in two rows of five at the front of a schoolroom: a low form at the front (feet on the floor) and a bench on the
// gallery step behind (feet dangling, swinging), the back row staggered so no face hides; the plaster end wall with
// two tall sash windows and a door close behind them. One continuous camera: f0 close on three front faces (~600 px
// children), already pulling back in one lobe so both rows are in frame by ~f45 and settled at the counting frame (front
// row ~340 px, back ~255 px; 5 + 5). The pox comes up on a front-row child on "ten" (f22-34) and on a back-row child on
// "twenty" (f34-46). From "kids" the two drain and sink into the air (f80-112 and f86-118), leaving their places empty;
// their row neighbours turn their heads toward the gaps. A gentle creep in to the last frame: eight children, two
// gaps, still living. No numbers and no text: the speaker's 10-20 % stays spoken.
// Orange = the vaccine only: none in this cut. POX #8E4552 (the cast's `pox`) is the disease; the deaths are the cast's
// `drain` (to 0.6) + a fog toward the air (soft, low contrast, the pox fading first) + a fade out of the place, never a
// body. The floor in front of the front form falls into the dense low air (LowAir), so the bottom third is air.
//
// DEPTH: eye 1.4 m up (eyeY -250); dRef 880 at kRef 2, dolly 0.5 (a close, wide lens: the back row ~0.77 the front's
// size); fog by the eye's distance. Front form seat 55 at Z 0, the step 118 high (Z 215..), the back bench seat 84 on it
// at Z 300, the wall at Z 470 (fogged as if further back so the children separate from it). CAMERA: one pull-back
// lobe from f0 (k 3.05 -> 1.85, speed peak ~f12, rest by f84) with a quintic creep in (k -> 1.9) from f56.
//
// SOURCES: none (no figures on screen; the 10-20 % is the speaker's, spoken only).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirFloor, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, c01, lerp, mixHex, rgbHex, swayCam, type AirWorld, type Cam, type DepthOpts, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Child, POSES, breathe, type VPose } from "./vaccineFolk";

export const FPS = 30000 / 1001;
export const DURATION = 136;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** the eye 1.4 m up (a little over the seated children's heads), a close, wide lens: the back row is ~0.77 the front's
 *  size at the counting frame */
const DEPTH: DepthOpts = { eyeY: -250, dRef: 880, kRef: 2, dolly: 0.5 };

const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const smoother = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

// ===================================================================================================================
// THE TWO ROWS: a low form at the front (feet on the floor), a bench on the gallery step behind (feet dangling)
// ===================================================================================================================
/** the front form's seat (below dangleSeat: the feet stand on the floor) and the back bench's seat on the step */
export const FRONT_SEAT = 55;
export const BACK_SEAT = 84;
/** the gallery step under the back bench: its height and its front / back edges (Z) */
export const STEP = { h: 118, z0: 215, z1: 390 };
/** the hips' depth of the two rows; the wall close behind */
export const ROW_Z = [0, 300];
export const WALL_Z = 470;
const S = 98;
/** the counting frame's zoom: the camera rests here (f56) */
const K_COUNT = 1.85;
const R_BACK = (() => {
  const Dc = DEPTH.dRef * Math.pow(DEPTH.kRef / K_COUNT, DEPTH.dolly);
  return Dc / (Dc + ROW_Z[1]);
})();
type Kid = { v: number; row: 0 | 1; slot: number; X: number; Z: number; seat: number; feetH: number; yaw: number; head: number; arms: "lap" | "bench" | "knee"; swing: number; seed: number };
const FRONT = [5, 6, 3, 8, 0];
const BACK = [7, 4, 9, 1, 2];
const ARMS_F: Kid["arms"][] = ["knee", "lap", "bench", "lap", "bench"];
const ARMS_B: Kid["arms"][] = ["lap", "bench", "lap", "lap", "knee"];
export const KIDS: Kid[] = [
  ...FRONT.map((v, i): Kid => ({
    v,
    row: 0,
    slot: i,
    // staggered against the back row on screen
    X: (i - 2) * S - S / 4,
    Z: ROW_Z[0],
    seat: FRONT_SEAT,
    feetH: 0,
    yaw: [0.12, 0.05, -0.08, 0.1, -0.12][i],
    head: [0.3, 0.12, -0.15, 0.2, -0.32][i],
    arms: ARMS_F[i],
    swing: 0,
    seed: i * 1.37 + 0.4,
  })),
  ...BACK.map((v, j): Kid => ({
    v,
    row: 1,
    slot: j,
    X: ((j - 2) * S + S / 4) / R_BACK,
    Z: ROW_Z[1],
    seat: BACK_SEAT,
    feetH: STEP.h,
    yaw: [0.1, -0.06, 0.12, -0.1, 0.08][j],
    head: [0.28, -0.1, 0.18, -0.2, 0.05][j],
    arms: ARMS_B[j],
    swing: [1, 0.6, 0, 0.8, 1][j],
    seed: j * 1.91 + 2.2,
  })),
];
/** the two children smallpox takes: one in the front row (on "ten"), one in the back row (on "twenty") */
export const SICK = [
  { i: 1, poxAt: 34 - 12, drainAt: 80, drainLen: 32 },
  { i: 8, poxAt: 46 - 12, drainAt: 86, drainLen: 32 },
];

// ===================================================================================================================
// THE CAMERA: one pull-back lobe from f0 (k 3.05, three front faces, -> K_COUNT by ~f56), then a gentle creep in
// toward the front-row gap
// ===================================================================================================================
/** the pull-back's progress: a speed profile already moving at f0 (half its peak), peaking ~f12, a soft tail to rest at
 *  f84 (one acceleration, one deceleration lobe), integrated once */
const PULL_END = 84;
const PULL: number[] = (() => {
  const v = (f: number) => (0.5 + 0.5 * sst(0, 12, f)) * Math.pow(1 - c01(f / PULL_END), 2.1);
  const acc = [0];
  for (let f = 0; f < 160; f++) acc.push(acc[f] + (v(f) + v(f + 1)) / 2);
  const tot = acc[PULL_END];
  return acc.map((a) => Math.min(1, a / tot));
})();
const pullP = (f: number) => {
  const i = Math.max(0, Math.min(158, Math.floor(f)));
  return lerp(PULL[i], PULL[i + 1], f - i);
};
/** the creep in: starts under the pull's tail, still moving on the last frame */
const creepP = (f: number) => smoother(56, 190, f) / smoother(56, 190, 135);
type Focus = { X: number; Y: number; Z: number; sx: number; sy: number; k: number };
/** the focus: the front row's head tops (Y -196) at a screen point */
const F0: Focus = { X: KIDS[1].X + S * 0.45, Y: -196, Z: 0, sx: 540, sy: 620, k: 3.05 };
const F1: Focus = { X: 0, Y: -196, Z: 0, sx: 540, sy: 788, k: K_COUNT };
const F2: Focus = { X: -12, Y: -196, Z: 0, sx: 540, sy: 778, k: 1.9 };
export const focusAt = (f: number): Focus => {
  const p = pullP(f);
  const c = creepP(f);
  const m = (a: number, b: number, d: number) => lerp(a, b, p) + (d - b) * c;
  const lk = m(Math.log(F0.k), Math.log(F1.k), Math.log(F2.k));
  return { X: m(F0.X, F1.X, F2.X), Y: m(F0.Y, F1.Y, F2.Y), Z: m(F0.Z, F1.Z, F2.Z), sx: m(F0.sx, F1.sx, F2.sx), sy: m(F0.sy, F1.sy, F2.sy), k: Math.exp(lk) };
};
/** the 2D camera that puts the 3D focus point at its screen point */
export const camAt = (f: number): Cam => {
  const F = focusAt(f);
  const Dc = DEPTH.dRef * Math.pow(DEPTH.kRef / F.k, DEPTH.dolly);
  const r = Dc / (Dc + F.Z);
  const wy = DEPTH.eyeY + (F.Y - DEPTH.eyeY) * r;
  return { k: F.k, cx: F.X - (F.sx - 540) / (r * F.k), cy: wy - (F.sy - 960) / F.k };
};
const REST = swayCam(camAt(0), 0);

// ===================================================================================================================
// THE SET: the schoolroom's gallery against its end wall (plaster over a stone base, two tall sash windows, a door)
// ===================================================================================================================
const TIMBER = { lit: "#9C7E5C", mid: "#6E5640", dark: "#3A2C20" };
const STEP_MAT = { lit: "#8E7A62", mid: "#6A5A48", dark: "#3A3028" };
const PLASTER = { lit: "#8E8270", mid: "#6F6555", dark: "#4A4238" };
const BenchAt: React.FC<{ A: AirWorld; Zc: number; seat: number; floor: number; x0: number; x1: number; uid: string; part: "legs" | "seat" }> = ({ A, Zc, seat, floor, x0, x1, uid, part }) => {
  const legs = [x0 + 14, (2 * x0 + x1) / 3, (x0 + 2 * x1) / 3, x1 - 14];
  const y0 = -(floor + seat);
  if (part === "legs") {
    return (
      <g>
        {legs.map((x, i) => (
          <AirBox key={i} A={A} X0={x - 5} X1={x + 5} Y0={y0 + 8} Y1={-floor} Z0={Zc + 18} Z1={Zc + 26} mat={TIMBER} uid={`${uid}lb${i}`} rim={0.3} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <AirShadow key={`s${i}`} A={A} X={lerp(x0, x1, i / 11) + 8} Z={Zc - 4} Y={-floor} w={64} d={34} uid={`${uid}sh${i}`} amt={0.45} />
        ))}
      </g>
    );
  }
  return (
    <g>
      {legs.map((x, i) => (
        <AirBox key={i} A={A} X0={x - 5} X1={x + 5} Y0={y0 + 8} Y1={-floor} Z0={Zc - 26} Z1={Zc - 18} mat={TIMBER} uid={`${uid}lf${i}`} rim={0.3} />
      ))}
      <AirBox A={A} X0={x0} X1={x1} Y0={y0} Y1={y0 + 9} Z0={Zc - 30} Z1={Zc + 32} mat={TIMBER} uid={`${uid}st`} rim={1} />
    </g>
  );
};

const Room: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const Z = WALL_Z;
  // the wall sits deep in the air (fogged as if further back), so the children separate from it in value
  const t = (hex: string, h = 300) => A.tone(hex, Z + 1100, h);
  const rect = (x0: number, y0: number, x1: number, y1: number): P2[] => [P.p(x0, -y1, Z), P.p(x1, -y1, Z), P.p(x1, -y0, Z), P.p(x0, -y0, Z)];
  const win = (x: number) => {
    const w = 150;
    const y0 = 380;
    const y1 = 700;
    return (
      <g key={x}>
        <path d={poly(rect(x - w / 2 - 14, y0 - 14, x + w / 2 + 14, y1 + 10))} fill={t("#CFC3AA", 540)} />
        <path d={poly(rect(x - w / 2, y0, x + w / 2, y1))} fill={t("#7E9A90", 540)} />
        <path d={poly(rect(x - 4, y0, x + 4, y1))} fill={t("#CFC3AA", 540)} />
        <path d={poly(rect(x - w / 2, (y0 + y1) / 2 - 4, x + w / 2, (y0 + y1) / 2 + 4))} fill={t("#CFC3AA", 540)} />
        <path d={poly(rect(x - w / 2 - 20, y0 - 22, x + w / 2 + 20, y0 - 10))} fill={t("#B7AA90", 380)} />
      </g>
    );
  };
  return (
    <g>
      {/* the plaster wall up past the frame, a stone base, the skirting */}
      <path d={poly(rect(-2600, 0, 2600, 1400))} fill={t(PLASTER.mid, 500)} />
      <path d={poly(rect(-2600, 0, 2600, 150))} fill={t("#6E6152", 80)} />
      <path d={poly(rect(-2600, 146, 2600, 160))} fill={t("#857760", 150)} />
      {[-330, 330].map(win)}
      {/* the door at the side (umber boards, a cream frame) */}
      <path d={poly(rect(-1010, 0, -790, 440))} fill={t("#BFB298", 220)} />
      <path d={poly(rect(-990, 0, -810, 420))} fill={t("#5E4A38", 210)} />
      {/* a high picture rail */}
      <path d={poly(rect(-2600, 780, 2600, 794))} fill={t("#B7AA90", 780)} />
    </g>
  );
};

/** the gallery step: its top and its riser, the full width of the room */
const Step: React.FC<{ A: AirWorld }> = ({ A }) => <AirBox A={A} X0={-2400} X1={2400} Y0={-STEP.h} Y1={0} Z0={STEP.z0} Z1={STEP.z1 + 400} mat={STEP_MAT} uid="step" rim={0.8} />;

// ===================================================================================================================
// THE CHILDREN
// ===================================================================================================================
export const kidPose = (k: Kid, f: number, sick: number, look: number): VPose => {
  const base = POSES.sit(1, k.seat);
  const ht =
    k.arms === "lap"
      ? { L: { to: "lap" as const, amt: 1 }, R: { to: "lap" as const, amt: 1 } }
      : k.arms === "knee"
        ? { L: { to: "knee" as const, amt: 1 }, R: { to: "lap" as const, amt: 1 } }
        : undefined;
  // a glance: a slow drift of the head
  const g = Math.sin(f * 0.045 + k.seed * 2.1) * 0.1 + Math.sin(f * 0.021 + k.seed) * 0.07;
  // dangling feet swing (the back row); a smooth lift (no kink)
  const sw = k.swing * Math.sin(f * 0.16 + k.seed * 3);
  const sw2 = k.swing * Math.sin(f * 0.16 + k.seed * 3 + 2.4);
  const lift = (w: number) => -6.5 * k.swing * (1 + w / Math.max(0.01, k.swing)) ** 2;
  let q: VPose = {
    ...base,
    yaw: k.yaw,
    headYaw: k.head + g * (1 - Math.min(1, Math.abs(look))) + look,
    handTo: ht,
    footL: k.swing > 0 ? [10 * sw, lift(sw)] : [-4, 0],
    footR: k.swing > 0 ? [10 * sw2, lift(sw2)] : [6, 0],
    look: [c01(Math.abs(look)) * Math.sign(look) * 0.7, 0.1],
    pitch: 2 + 10 * sick,
    hunch: 0.35 * sick,
    worry: 0.45 * c01(Math.abs(look) * 1.5),
  };
  if (k.arms === "bench") {
    q = { ...q, armL: { w: [-48, -112], elbow: [-0.3, 1], fist: 0.25, hand: -10 }, armR: { w: [48, -112], elbow: [0.3, 1], fist: 0.25, hand: 10 } };
  }
  return breathe(q, f, 1, k.seed);
};

/** a child's pose, pox and drain (0..1) on frame f: the pox ramp, the drain, and its row neighbours' heads turning
 *  toward an empty place (from the middle of its drain) */
export const kidState = (i: number, f: number) => {
  const k = KIDS[i];
  const S0 = SICK.find((s) => s.i === i);
  const pox = S0 ? sst(S0.poxAt, S0.poxAt + 12, f) : 0;
  const dr = S0 ? c01((f - S0.drainAt) / S0.drainLen) : 0;
  const de = dr * dr * (3 - 2 * dr);
  let look = 0;
  for (const s of SICK) {
    const g = KIDS[s.i];
    if (g.row !== k.row) continue;
    // the head yaw that points it at the gap: + = toward screen right
    if (g.slot === k.slot + 1) look += 0.75 - k.head * 0.5;
    else if (g.slot === k.slot - 1) look += -0.75 - k.head * 0.5;
    else continue;
    look *= sst(s.drainAt + 10, s.drainAt + 34 + (k.slot % 2) * 3, f);
  }
  return { pose: kidPose(k, f, pox * (1 - de), look), pox, dr };
};

const KidFig: React.FC<{ A: AirWorld; i: number; f: number }> = ({ A, i, f }) => {
  const k = KIDS[i];
  const { pose, pox, dr } = kidState(i, f);
  const { at, scale } = A.P.at(k.X, k.Z);
  const atH: P2 = A.P.p(k.X, -k.feetH, k.Z);
  const ff = A.folkFog(k.Z, k.feetH);
  // the drain: cloth and skin a little toward DEAD, the figure takes the air (soft, low contrast, the pox fading first),
  // and fades out of its place (no ghost, never a body)
  // what is behind it: the wall (back row) or the step's riser (front row), so the child dissolves into its own
  // backdrop instead of darkening into a silhouette; the dot eyes go with the face, never last
  const behind = k.row === 1 ? A.tone(PLASTER.mid, WALL_Z + 1100, 500) : A.tone(mixHex(STEP_MAT.lit, STEP_MAT.mid, 0.5), STEP.z0, 60);
  const fog = { rgb: mixHex(ff.rgb as string, behind, sst(0, 0.4, dr)), amount: lerp(ff.amount, 0.86, sst(0.03, 0.5, dr)) };
  const tone = 1 - sst(0.3, 1, dr);
  if (tone <= 0.001) return null;
  return (
    <g>
      {k.feetH > 0 ? null : <AirShadow A={A} X={k.X + 10} Z={k.Z - 34} w={36} d={22} uid={`ks${i}`} amt={0.55 * tone} />}
      <Child variant={k.v} pose={pose} at={k.feetH > 0 ? atH : at} scale={scale} uid={`k${i}`} frame={f} pox={pox * (1 - sst(0, 0.45, dr))} drain={0.6 * sst(0.1, 0.7, dr)} fog={fog} tone={tone} unitPx={A.k} />
    </g>
  );
};

// ===================================================================================================================
// THE LOW AIR: the near ground sinks into the dense air at the foot of the frame (no big empty floor)
// ===================================================================================================================
const LowAir: React.FC<{ A: AirWorld; cam: Cam }> = ({ A, cam }) => {
  const foot = A.P.p(0, 0, ROW_Z[0] - 40);
  const sy0 = Math.max(1120, 960 + (foot[1] - cam.cy) * cam.k + 20);
  const toW = (sy: number) => cam.cy + (sy - 960) / cam.k;
  const stops = [0, 0.15, 0.3, 0.5, 0.75, 1].map((s) => {
    const sy = lerp(sy0, 1920, s);
    return { s, c: rgbHex(A.v.airAtScreen(sy)), a: Math.min(1, 1.25 * Math.pow(s, 0.55)) };
  });
  const x0 = cam.cx - 600 / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id="lowair" gradientUnits="userSpaceOnUse" x1="0" y1={toW(sy0).toFixed(2)} x2="0" y2={toW(1920).toFixed(2)}>
          {stops.map((q) => (
            <stop key={q.s} offset={q.s} stopColor={q.c} stopOpacity={q.a.toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={toW(sy0).toFixed(2)} width={(1200 / cam.k).toFixed(2)} height={((1920 - sy0 + 10) / cam.k).toFixed(2)} fill="url(#lowair)" />
    </g>
  );
};

const KidsDieOfSmallpox: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame });
  const BX = [-2.75 * S - 50, 1.75 * S + 50];
  const BXb = [(-1.75 * S) / R_BACK - 50, (2.25 * S) / R_BACK + 50];
  return (
    <AirStage v={A.v}>
      <WorldSvg cam={cam}>
        <Room A={A} />
        <AirFloor A={A} x0={-2600} x1={2600} z0={-4000} z1={WALL_Z} mat={MAT.ground} course={150} melt={0} />
        <LowAir A={A} cam={cam} />
        <Step A={A} />
        <BenchAt A={A} Zc={ROW_Z[1]} seat={BACK_SEAT} floor={STEP.h} x0={BXb[0]} x1={BXb[1]} uid="bb" part="legs" />
        <BenchAt A={A} Zc={ROW_Z[1]} seat={BACK_SEAT} floor={STEP.h} x0={BXb[0]} x1={BXb[1]} uid="bb" part="seat" />
        {[5, 6, 7, 8, 9].map((i) => (
          <KidFig key={i} A={A} i={i} f={frame} />
        ))}
        <BenchAt A={A} Zc={ROW_Z[0]} seat={FRONT_SEAT} floor={0} x0={BX[0]} x1={BX[1]} uid="fb" part="legs" />
        <BenchAt A={A} Zc={ROW_Z[0]} seat={FRONT_SEAT} floor={0} x0={BX[0]} x1={BX[1]} uid="fb" part="seat" />
        {[0, 1, 2, 3, 4].map((i) => (
          <KidFig key={i} A={A} i={i} f={frame} />
        ))}
      </WorldSvg>
    </AirStage>
  );
};

export default KidsDieOfSmallpox;
