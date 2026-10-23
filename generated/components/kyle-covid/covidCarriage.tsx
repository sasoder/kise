// ---------------------------------------------------------------------------
// covidCarriage — THE METRO CARRIAGE set of the Kyle Harper clip "Why COVID was impossible to contain" (kyle-covid),
// shared by cuts 3 (COVID-19) and 12 (SARS-1): one modern metro / subway carriage seen down its aisle in ONE-POINT
// PERSPECTIVE (the depth kit's perspective through the kit's airWorldOf), air-lit (AirFloor / AirBox / AirCyl /
// AirShadow, the medium's `interior` mood: the air sits INSIDE the carriage), lit from the ceiling's light strip.
// Long bench seats along both sides (dusty teal), vertical stainless poles (iron, cream rim), a horizontal grab rail
// over each bench with hanging straps, windows above the seats onto the dark tunnel (soft cream lights sliding past,
// slow: the train is moving), two door bays per side, the ceiling light strip, the far end door with its window.
// Muted local colours; nothing near orange (orange is the virus: covidFolk's glows and breath only).
//
// UNITS: the cast's rig units (a man ~312 = 1.75 m; U = 178 per metre). X across (the aisle's centre X = 0, the
// walls at X = +-CAR.halfW), Y height (the floor Y = 0, up is -Y), Z depth behind the front plane (Z = 0; the camera
// stands CARRIAGE_DEPTH.dRef in front of it at the default zoom). Draw inside <WorldSvg cam> of the cut.
//
// API
//   CAR                       the carriage's dimensions (halfW, ceilY, z0, z1, seat, window, rail, door bays)
//   CARRIAGE_DEPTH, CARRIAGE_CAM, CARRIAGE_SCENE   the default camera for a 1080x1920 frame down the aisle (eye 1.35 m,
//                             k 2.3, the vanishing point at screen (540, 840)): standing faces near y 740-800, seated
//                             faces near 830-880; every face and chest glow stays above y 1080 for Z >= 0, a seated
//                             figure's hands in the lap only from Z >= 200
//   carriageCam(k?, horizonRow?, cx?)  a camera at zoom k with the horizon kept on a screen row (push-ins, pans)
//   carriageAir(cam, frame, rest?)  -> the kit's AirWorld for this set (mood interior, fog by the eye's distance)
//   SEATS: Seat[]             { side "L" | "R", i, X (the hips), Z, dir (the way a sitter faces: L bench +1, R -1),
//                             seatH } every seat along both benches (door bays excluded); seatAt(side, n) = the n-th
//   POLES: Pole[]             { i, side, X, Z, R } vertical poles floor -> ceiling (CAR.ceilY): side poles at X +-78 by the
//                             bench ends (Z 140, 510, 790, 1040, 1350, 1630, 1880) and two aisle-centre poles (side "C",
//                             X 0, Z 330 and 1240); polesOf("L" | "R" | "C") lists one row near -> far
//   STRAPS: Strap[]           { side, i, X, Z, id } hanging straps on the rails (rail at Y = CAR.rail.y, handle
//                             ~CAR.strapLen); NEAR_POLES = { L: 0, R: 1 } the ids of the near side poles
//   polePlace(pole, dir, kind?, variant?) -> { X, Z }  the feet of a figure holding that pole with its near hand
//                             (POSES.standHold(dir, "pole")); polePoint(pole) the grip point (world 3D) for `grip`
//   poleSeat(pole, kind?, variant?) -> { seat, dir, feet, grip }  a passenger at a SIDE pole with the bench seat right
//                             behind him (hold, then POSES.sicken back onto the seat: cut 12)
//   strapHandle(strap, frame) -> [X, Y, Z]  the strap's handle (with the sway): a standing hand on a strap
//   carriageSway(frame)       { lean (deg, the people's bodies), strap (deg, the straps' swing), bob (px, camera) }:
//                             a slow roll (~3.7 s) with a small jiggle, very subtle; swayPose(q, frame, amount, seed)
//                             lays it over any cast pose (standing amount 1, seated ~0.5)
//   <CarriageStage A frame items? lights? hidePoles? hideStraps? />  the whole set; hidePoles / hideStraps leave poles
//                             or straps out: ids (Pole.i; Strap.id) or a predicate, e.g. hidePoles={[NEAR_POLES.L,
//                             NEAR_POLES.R]} (ids 0 and 1: the near left and right side poles, Z 140) or
//                             hidePoles={(p) => p.Z < 300 && p.side !== "C"}; `items` = [{ Z, node }] (people, props: anything with a
//                             depth) are sorted with the poles and straps into the painter's order (far first). Draw
//                             a person's AirShadow inside its own node.
//   placeAt(A, X, Z)          { at, scale } for a figure standing at (X, Z) (A.P.at)
// Probe: covidCarriageProbe.tsx (src/Root.CovidCarriage.tsx).
// ---------------------------------------------------------------------------
import React from "react";
import { AirCyl, AirFloor, MAT, airWorldOf, fogHex, lineOf, mixHex, type AirScene, type AirWorld, type Cam, type DepthOpts, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { HOLD, MAN, lookOf, seatFootX, type CovidKind, type CovidPose } from "./covidFolk";

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

// ===================================================================================================================
// DIMENSIONS
// ===================================================================================================================
export const U = 178;
export const CAR = {
  halfW: 235,
  ceilY: -400,
  /** the carriage runs from z0 (behind the camera) to the far end wall z1 */
  z0: -700,
  z1: 2080,
  /** the bench: seat top seatH, the seat front edge at X = +-frontX, the back cushion against the wall up to backY */
  seat: { h: 82, frontX: 156, backY: -176, pitch: 92 },
  /** the windows over the benches */
  window: { y0: -336, y1: -186 },
  /** the grab rail over each bench, the straps' length (rail -> handle bottom) */
  rail: { x: 150, y: -352 },
  strapLen: 52,
  /** the door bays (no bench, a pair of doors in each side wall) */
  doors: [
    [560, 740],
    [1400, 1580],
  ] as [number, number][],
  /** the far end door */
  endDoor: { x: 50, y: -352, win: [-34, 34, -318, -176] as [number, number, number, number] },
};
/** materials (local colours before fog) */
export const CAR_MAT = {
  floor: { lit: "#7A6550", mid: "#6A5745", dark: "#3E3329" } as Mat,
  wall: { lit: "#C2B8A2", mid: "#A89E88", dark: "#6E6656" } as Mat,
  ceiling: { lit: "#BDB4A1", mid: "#A9A08D", dark: "#77705F" } as Mat,
  seat: { lit: "#6F8E88", mid: "#58756F", dark: "#33443F" } as Mat,
  seatBase: { lit: "#7E8587", mid: "#646B6D", dark: "#3A4042" } as Mat,
  iron: MAT.iron,
  steel: { lit: "#B9BFC0", mid: "#8A9396", dark: "#4E5659" } as Mat,
  door: { lit: "#9AA3A3", mid: "#7D8686", dark: "#454D4E" } as Mat,
  strap: "#4D5356",
  handle: "#D9CDB4",
  tunnel: "#2E322E",
  tunnelLight: "#F3EBDD",
  lightStrip: "#F1E9D8",
};

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
/** the eye 1.35 m up (a little under a standing head: standing faces just above the horizon, seated faces just
 *  below), the camera 700 units in front of the front plane at k 2; a zoom is half dolly, half lens */
export const CARRIAGE_DEPTH: DepthOpts = { eyeY: -240, dRef: 700, kRef: 2, dolly: 0.5 };
/** the default 2D camera: the aisle's centre at screen x 540, the horizon (the VP row) at screen y 840, k 2.3 (the
 *  walls just out of frame at the front plane) */
export const CARRIAGE_CAM: Cam = { k: 2.3, cx: 0, cy: -240 + 120 / 2.3 };
/** a camera down the aisle at zoom k with the horizon (the VP's row) kept at screen row `horizonRow`; cx shifts the
 *  eye sideways (the VP stays at screen x 540: the set slides with parallax). A push-in = raise k on the same row. */
export const carriageCam = (k = 2.3, horizonRow = 840, cx = 0): Cam => ({ k, cx, cy: CARRIAGE_DEPTH.eyeY + (960 - horizonRow) / k });
/** the interior medium: denser, darker air; fog by the eye's distance (Dc + Z) */
export const CARRIAGE_SCENE: Partial<AirScene> = { mood: "interior", fogNear: 0, fogVis: 1900, fogMax: 0.82 };
export const carriageAir = (cam: Cam, frame: number, rest: Cam = CARRIAGE_CAM): AirWorld => airWorldOf({ cam, rest, depth: CARRIAGE_DEPTH, frame, scene: CARRIAGE_SCENE });
export const placeAt = (A: AirWorld, X: number, Z: number) => A.P.at(X, Z);

// ===================================================================================================================
// SEATS, POLES, STRAPS
// ===================================================================================================================
export type Side = "L" | "R";
export type Seat = { side: Side; i: number; X: number; Z: number; dir: 1 | -1; seatH: number };
export type Pole = { i: number; side: Side | "C"; X: number; Z: number; R: number };
export type Strap = { side: Side; i: number; X: number; Z: number; id: number };
const inDoor = (Z: number, pad = 0) => CAR.doors.some(([a, b]) => Z > a - pad && Z < b + pad);
/** the hips of a sitter sit 30 units in from the seat's front edge */
const SEAT_HIP_X = CAR.seat.frontX + 30;
export const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (const side of ["L", "R"] as Side[]) {
    let i = 0;
    for (let Z = -560; Z < CAR.z1 - 80; Z += CAR.seat.pitch) {
      if (inDoor(Z, 60)) continue;
      out.push({ side, i: i++, X: side === "L" ? -SEAT_HIP_X : SEAT_HIP_X, Z, dir: side === "L" ? 1 : -1, seatH: CAR.seat.h });
    }
  }
  return out;
})();
/** the n-th seat of a side counted from the camera (n 0 = the nearest, Z -560) */
export const seatAt = (side: Side, n: number) => SEATS.filter((s) => s.side === side)[n];
/** the first seat at or behind depth Z on a side */
export const seatNear = (side: Side, Z: number) => SEATS.filter((s) => s.side === side).reduce((m, s) => (Math.abs(s.Z - Z) < Math.abs(m.Z - Z) ? s : m));
/** the side poles stand this far from the aisle's centre: ~0.45 m in front of the seat edge, so a passenger standing
 *  in front of the bench (his back to it) holds one at arm's length and can sink straight back onto the seat */
export const POLE_X = 78;
/** vertical poles at the bench ends beside the door bays and mid-bench */
export const POLES: Pole[] = (() => {
  const zs = [140, CAR.doors[0][0] - 50, CAR.doors[0][1] + 50, 1040, CAR.doors[1][0] - 50, CAR.doors[1][1] + 50, 1880];
  const out: Pole[] = [];
  let i = 0;
  for (const Z of zs) for (const side of ["L", "R"] as Side[]) out.push({ i: i++, side, X: side === "L" ? -POLE_X : POLE_X, Z, R: 6.5 });
  // two poles in the middle of the aisle (a standing passenger's place between the benches)
  for (const Z of [330, 1240]) out.push({ i: i++, side: "C", X: 0, Z, R: 6.5 });
  return out;
})();
/** the poles of one side ("C" = the aisle's centre), near to far */
export const polesOf = (side: Side | "C") => POLES.filter((p) => p.side === side);
export const STRAPS: Strap[] = (() => {
  const out: Strap[] = [];
  for (const side of ["L", "R"] as Side[]) {
    let i = 0;
    for (let Z = -520; Z < CAR.z1 - 120; Z += 124) {
      if (POLES.some((p) => p.side !== "C" && Math.abs(p.Z - Z) < 50)) continue;
      out.push({ side, i: i++, X: side === "L" ? -CAR.rail.x : CAR.rail.x, Z, id: out.length });
    }
  }
  return out;
})();
/** the feet of a figure (facing dir) holding pole `pole` with its near hand (POSES.standHold(dir, "pole")), at the
 *  pole's depth; the build's hold reach is scaled like its pose (a woman / child stands closer) */
export const polePlace = (pole: Pole, dir: 1 | -1, kind: CovidKind = "commuter", variant = 0) => {
  const sg = -lookOf(kind, variant).spec.hipY / -MAN.hipY;
  return { X: pole.X - dir * HOLD.poleDX * sg, Z: pole.Z };
};
/** the grip point on a pole (world 3D) at a build's hold height */
export const polePoint = (pole: Pole, kind: CovidKind = "commuter", variant = 0): [number, number, number] => {
  const sg = -lookOf(kind, variant).spec.hipY / -MAN.hipY;
  return [pole.X, HOLD.pole[1] * sg + 4, pole.Z];
};

/** a standing passenger at a SIDE pole with the bench seat right behind him (cut 12's grammar: hold the pole, then
 *  POSES.sicken onto that seat): the seat (its hips), his facing dir (toward the aisle), his standing feet in front of
 *  the seat (hips over the feet: sicken moves `at` back sickenBack(t) units to the seat's X) and the pole's grip point
 *  (world 3D at the build's hold height; project it with A.P.p and pass it as grip { L } facing right / { R } facing
 *  left while he holds on) */
export const poleSeat = (pole: Pole, kind: CovidKind = "officer", variant = 0) => {
  const side: Side = pole.side === "C" ? "L" : pole.side;
  const dir: 1 | -1 = side === "L" ? 1 : -1;
  // the bench is one long cushion: he sits at the pole's own depth (the seat seams are only drawn)
  const seat: Seat = { side, i: -1, X: side === "L" ? -SEAT_HIP_X : SEAT_HIP_X, Z: pole.Z, dir, seatH: CAR.seat.h };
  return { seat, dir, feet: { X: seat.X + dir * seatFootX(kind, variant), Z: seat.Z }, grip: polePoint(pole, kind, variant) };
};

// ===================================================================================================================
// THE TRAIN'S SWAY
// ===================================================================================================================
/** the train's slow roll: lean (deg) the people's bodies share, the straps' swing (deg, lagging), a camera bob (px) */
export const carriageSway = (frame: number) => {
  const t = frame / 29.97;
  const roll = 0.75 * Math.sin((t / 3.7) * 2 * Math.PI) + 0.22 * Math.sin((t / 1.35) * 2 * Math.PI + 1.1);
  const lag = 0.75 * Math.sin(((t - 0.35) / 3.7) * 2 * Math.PI) + 0.22 * Math.sin(((t - 0.2) / 1.35) * 2 * Math.PI + 1.1);
  return { lean: roll, strap: -lag * 4.2, bob: 0.9 * Math.sin((t / 0.9) * 2 * Math.PI) + 0.5 * Math.sin((t / 0.47) * 2 * Math.PI + 0.7) };
};
/** lay the sway over a cast pose (amount: standing 1, seated ~0.5; seed varies the phase a little) */
export const swayPose = (q: CovidPose, frame: number, amount = 1, seed = 0): CovidPose => {
  const s = carriageSway(frame - seed * 3);
  return { ...q, lean: q.lean + amount * s.lean, roll: q.roll + amount * 0.6 * s.lean, hem: q.hem + amount * 1.5 * s.lean };
};
/** a strap's handle bottom (world 3D) with the sway */
export const strapHandle = (st: Strap, frame: number): [number, number, number] => {
  const a = ((carriageSway(frame + st.Z * 0.02).strap + 2 * Math.sin(frame * 0.05 + st.i)) * Math.PI) / 180;
  return [st.X + Math.sin(a) * CAR.strapLen, CAR.rail.y + Math.cos(a) * CAR.strapLen, st.Z];
};

// ===================================================================================================================
// PLANES (fogged by depth in bands)
// ===================================================================================================================
const N_BANDS = 26;
/** depth bands from z0 to z1 (denser near) */
const zBands = (A: AirWorld, z0: number, z1: number, n = N_BANDS) => {
  const zA = Math.max(z0, A.P.zNear);
  return Array.from({ length: n }, (_, i) => [mix(zA, z1, Math.pow(i / n, 1.5)), mix(zA, z1, Math.pow((i + 1) / n, 1.5))] as [number, number]);
};
/** a side wall plane at X (facing the aisle), from Y0 (top) to Y1, over Z0..Z1, tones lit -> mid by height */
const WallX: React.FC<{ A: AirWorld; X: number; Y0: number; Y1: number; Z0: number; Z1: number; top: string; bot: string; rows?: number }> = ({ A, X, Y0, Y1, Z0, Z1, top, bot, rows = 3 }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  zBands(A, Z0, Z1).forEach(([za, zb], i) => {
    const zb2 = zb + (zb - za) * 0.12;
    for (let j = 0; j < rows; j++) {
      const ya = mix(Y0, Y1, j / rows);
      const yb = mix(Y0, Y1, (j + 1) / rows) + (j < rows - 1 ? (Y1 - Y0) * 0.02 : 0);
      const c = A.tone(mixHex(top, bot, (j + 0.5) / rows), (za + zb) / 2, -(ya + yb) / 2);
      els.push(<path key={`${i}-${j}`} d={poly([P.p(X, ya, za), P.p(X, ya, zb2), P.p(X, yb, zb2), P.p(X, yb, za)])} fill={c} />);
    }
  });
  return <g>{els}</g>;
};
/** a horizontal plane at height Y (the ceiling), X0..X1 over Z0..Z1 */
const PlaneY: React.FC<{ A: AirWorld; Y: number; X0: number; X1: number; Z0: number; Z1: number; col: string }> = ({ A, Y, X0, X1, Z0, Z1, col }) => {
  const P = A.P;
  return (
    <g>
      {zBands(A, Z0, Z1).map(([za, zb], i) => {
        const zb2 = zb + (zb - za) * 0.12;
        return <path key={i} d={poly([P.p(X0, Y, za), P.p(X1, Y, za), P.p(X1, Y, zb2), P.p(X0, Y, zb2)])} fill={A.tone(col, (za + zb) / 2, -Y)} />;
      })}
    </g>
  );
};
/** a quad in the plane Z (facing the camera) */
const QuadZ: React.FC<{ A: AirWorld; X0: number; X1: number; Y0: number; Y1: number; Z: number; fill: string; stroke?: string; sw?: number }> = ({ A, X0, X1, Y0, Y1, Z, fill, stroke, sw }) => {
  const P = A.P;
  return <path d={poly([P.p(X0, Y0, Z), P.p(X1, Y0, Z), P.p(X1, Y1, Z), P.p(X0, Y1, Z)])} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
};
/** a quad in the plane X (a side wall's window, a door) */
const quadX = (A: AirWorld, X: number, Y0: number, Y1: number, Z0: number, Z1: number): P2[] => [A.P.p(X, Y0, Z0), A.P.p(X, Y0, Z1), A.P.p(X, Y1, Z1), A.P.p(X, Y1, Z0)];

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
/** the window openings of one side (Z ranges between the pillars, door bays excluded) */
const windowsOf = (): [number, number][] => {
  const out: [number, number][] = [];
  let Z = -640;
  const len = 300;
  const gap = 56;
  while (Z < CAR.z1 - 60) {
    const a = Z;
    const b = Math.min(Z + len, CAR.z1 - 60);
    // split around the door bays
    let segs: [number, number][] = [[a, b]];
    for (const [d0, d1] of CAR.doors) segs = segs.flatMap(([s0, s1]) => (s1 <= d0 - 30 || s0 >= d1 + 30 ? [[s0, s1]] : ([[s0, d0 - 30], [d1 + 30, s1]] as [number, number][]).filter(([x0, x1]) => x1 - x0 > 60)));
    out.push(...segs);
    Z += len + gap;
  }
  return out;
};
const WINDOWS = windowsOf();
/** the tunnel lights outside (world Z at a frame): cream lamps passing the windows toward the camera, slow */
const TUNNEL_SPACING = 760;
const TUNNEL_SPEED = 9;
export const tunnelLightZ = (frame: number, k: number) => {
  const base = (((k * TUNNEL_SPACING - frame * TUNNEL_SPEED) % (TUNNEL_SPACING * 5)) + TUNNEL_SPACING * 5) % (TUNNEL_SPACING * 5);
  return CAR.z0 + base - 200;
};

export type StageItem = { Z: number; node: React.ReactNode; key?: string };
/** which poles / straps to leave out: ids (Pole.i, Strap.id) or a predicate */
export type HideSpec<T> = number[] | ((x: T) => boolean);
const hidden = <T extends { i: number } | { id: number }>(spec: HideSpec<T> | undefined, x: T) => {
  if (!spec) return false;
  if (typeof spec === "function") return spec(x);
  return spec.includes("id" in x ? x.id : x.i);
};
/** the poles nearest the camera on each side (the ones a cut most often leaves out) */
export const NEAR_POLES = { L: 0, R: 1 };
export const CarriageStage: React.FC<{ A: AirWorld; frame: number; items?: StageItem[]; uid?: string; lights?: number; hidePoles?: HideSpec<Pole>; hideStraps?: HideSpec<Strap> }> = ({
  A,
  frame,
  items = [],
  uid = "car",
  lights = 1,
  hidePoles,
  hideStraps,
}) => {
  const P = A.P;
  const W = CAR.halfW;
  const { z0, z1, ceilY } = CAR;
  const lw = A.lw(1);
  const els: React.ReactNode[] = [];
  // ---- the far end wall and its door (facing us) ---------------------------------------------------------------------
  const ez = z1;
  const endWall = A.tone(CAR_MAT.wall.mid, ez, 200);
  els.push(<QuadZ key="endw" A={A} X0={-W} X1={W} Y0={ceilY} Y1={0} Z={ez} fill={endWall} />);
  const ed = CAR.endDoor;
  els.push(<QuadZ key="endd" A={A} X0={-ed.x} X1={ed.x} Y0={ed.y} Y1={0} Z={ez - 1} fill={A.tone(CAR_MAT.door.mid, ez, 160)} stroke={A.tone(lineOf(CAR_MAT.door), ez, 160)} sw={lw} />);
  const [wx0, wx1, wy0, wy1] = ed.win;
  // through the door's window: the next carriage, deeper in the air
  els.push(<QuadZ key="endwin" A={A} X0={wx0} X1={wx1} Y0={wy0} Y1={wy1} Z={ez - 2} fill={mixHex(A.airHex(ez + 900, 240), CAR_MAT.lightStrip, 0.1)} stroke={A.tone(CAR_MAT.steel.mid, ez, 240)} sw={lw * 1.4} />);
  // ---- the ceiling, its light strip ----------------------------------------------------------------------------
  els.push(<PlaneY key="ceil" A={A} Y={ceilY} X0={-W} X1={W} Z0={z0} Z1={ez} col={CAR_MAT.ceiling.mid} />);
  // the coves between the ceiling and the window heads (ad panels), each wall
  for (const sgn of [-1, 1]) {
    els.push(<WallX key={`cove${sgn}`} A={A} X={sgn * W} Y0={ceilY} Y1={CAR.window.y0} Z0={z0} Z1={ez} top={CAR_MAT.ceiling.mid} bot={CAR_MAT.wall.lit} rows={2} />);
  }
  // ---- the side walls (window band and the panels below), the windows, the doors --------------------------------------
  for (const sgn of [-1, 1]) {
    const X = sgn * W;
    els.push(<WallX key={`wall${sgn}`} A={A} X={X} Y0={CAR.window.y0} Y1={0} Z0={z0} Z1={ez} top={CAR_MAT.wall.lit} bot={CAR_MAT.wall.mid} rows={4} />);
    // windows: the dark tunnel, the lights passing, a soft reflection, a steel frame
    const clipId = `${uid}win${sgn}`;
    const winPolys = WINDOWS.map(([a, b]) => quadX(A, X, CAR.window.y0, CAR.window.y1, a, b));
    els.push(
      <defs key={`wd${sgn}`}>
        <clipPath id={clipId}>
          <path d={winPolys.map(poly).join(" ")} />
        </clipPath>
        <radialGradient id={`${uid}tl`}>
          <stop offset="0" stopColor={CAR_MAT.tunnelLight} stopOpacity={0.9} />
          <stop offset="0.35" stopColor={CAR_MAT.tunnelLight} stopOpacity={0.35} />
          <stop offset="1" stopColor={CAR_MAT.tunnelLight} stopOpacity={0} />
        </radialGradient>
      </defs>,
    );
    WINDOWS.forEach(([a, b], i) => {
      const zm = (a + b) / 2;
      els.push(<path key={`wg${sgn}${i}`} d={poly(winPolys[i])} fill={A.tone(CAR_MAT.tunnel, zm, 250)} />);
    });
    // the tunnel lights (outside, a little beyond the wall), clipped to the glass
    const lightsEls: React.ReactNode[] = [];
    if (lights > 0)
      for (let k = 0; k < 5; k++) {
        const Zl = tunnelLightZ(frame, k + (sgn > 0 ? 0.5 : 0));
        if (Zl < P.zNear + 40 || Zl > ez) continue;
        const c = P.p(X + sgn * 70, -262, Zl);
        const r = P.r(Zl);
        const len = 150 * r;
        const a = lights * (1 - A.fog(Zl)) * 0.85;
        lightsEls.push(<ellipse key={k} cx={c[0]} cy={c[1]} rx={len} ry={22 * r} fill={`url(#${uid}tl)`} opacity={a} />);
        // a second, dimmer cable-light row lower down
        const c2 = P.p(X + sgn * 70, -206, Zl + 380);
        const r2 = P.r(Zl + 380);
        lightsEls.push(<ellipse key={`b${k}`} cx={c2[0]} cy={c2[1]} rx={70 * r2} ry={9 * r2} fill={`url(#${uid}tl)`} opacity={a * 0.45} />);
      }
    els.push(
      <g key={`wl${sgn}`} clipPath={`url(#${clipId})`} style={{ mixBlendMode: "screen" }}>
        {lightsEls}
      </g>,
    );
    // the reflection: a soft diagonal sheen on the glass
    WINDOWS.forEach(([a, b], i) => {
      const zm = (a + b) / 2;
      const q = quadX(A, X, CAR.window.y0 + 18, CAR.window.y1 - 30, mix(a, b, 0.15), mix(a, b, 0.4));
      els.push(<path key={`wr${sgn}${i}`} d={poly(q)} fill={CAR_MAT.tunnelLight} opacity={0.05 * (1 - A.fog(zm))} />);
      els.push(<path key={`wf${sgn}${i}`} d={poly(winPolys[i])} fill="none" stroke={A.tone(CAR_MAT.steel.mid, zm, 250)} strokeWidth={lw * 1.6} strokeLinejoin="round" />);
    });
    // the doors: two leaves, each with a tall window, a rubber seam between them, a step line at the floor
    CAR.doors.forEach(([d0, d1], i) => {
      const zm = (d0 + d1) / 2;
      const dq = quadX(A, X, -352, 0, d0, d1);
      els.push(<path key={`dr${sgn}${i}`} d={poly(dq)} fill={A.tone(CAR_MAT.door.mid, zm, 160)} stroke={A.tone(lineOf(CAR_MAT.door), zm, 160)} strokeWidth={lw} />);
      for (const [wa, wb] of [
        [d0 + 18, zm - 10],
        [zm + 10, d1 - 18],
      ]) {
        const wq = quadX(A, X, -322, -150, wa, wb);
        els.push(<path key={`dw${sgn}${i}${wa}`} d={poly(wq)} fill={A.tone(CAR_MAT.tunnel, zm, 230)} stroke={A.tone(CAR_MAT.steel.lit, zm, 230)} strokeWidth={lw * 1.2} />);
      }
      els.push(<path key={`ds${sgn}${i}`} d={`M${Pt(P.p(X, -352, zm))}L${Pt(P.p(X, 0, zm))}`} stroke={A.tone(CAR_MAT.strap, zm, 160)} strokeWidth={lw * 1.4} />);
    });
  }
  // ---- the floor -------------------------------------------------------------------------------------------------
  els.push(<AirFloor key="floor" A={A} x0={-W} x1={W} z0={z0} z1={ez} mat={CAR_MAT.floor} course={260} plank={4000} jointAmt={0.6} melt={0.05} />);
  // a darker strip down each side under the benches (their shadow on the floor)
  for (const sgn of [-1, 1]) {
    els.push(
      <g key={`fs${sgn}`}>
        {zBands(A, z0, ez).map(([za, zb], i) => (
          <path key={i} d={poly([P.p(sgn * W, 0, za), P.p(sgn * (CAR.seat.frontX - 14), 0, za), P.p(sgn * (CAR.seat.frontX - 14), 0, zb + (zb - za) * 0.12), P.p(sgn * W, 0, zb + (zb - za) * 0.12)])} fill={A.tone(mixHex(CAR_MAT.floor.dark, "#22180F", 0.3), (za + zb) / 2, 0)} opacity={0.55} />
        ))}
      </g>,
    );
  }
  // ---- the benches (base, cushion, back) between the door bays ---------------------------------------------------------
  const benchRuns: [number, number][] = [];
  {
    let a = z0;
    for (const [d0, d1] of CAR.doors) {
      benchRuns.push([a, d0 - 40]);
      a = d1 + 40;
    }
    benchRuns.push([a, ez - 30]);
  }
  // each bench: the riser facing the aisle, the cushion's top and front lip, the back cushion against the wall (planes
  // fogged by depth; the same light both sides: the light is the ceiling's)
  const PlaneXq = (key: string, X: number, Y0: number, Y1: number, Za: number, Zb: number, col: string) => <WallX key={key} A={A} X={X} Y0={Y0} Y1={Y1} Z0={Za} Z1={Zb} top={col} bot={col} rows={1} />;
  for (const sgn of [-1, 1]) {
    benchRuns.forEach(([a, b], i) => {
      const xIn = sgn * CAR.seat.frontX;
      const xOut = sgn * W;
      // the back cushion (a slab standing 22 in front of the wall), its top edge lit
      els.push(PlaneXq(`bk${sgn}${i}`, xOut - sgn * 22, CAR.seat.backY, -CAR.seat.h, a, b, mixHex(CAR_MAT.seat.lit, CAR_MAT.seat.mid, 0.45)));
      els.push(
        <g key={`bkt${sgn}${i}`}>
          {zBands(A, a, b, 14).map(([za, zb], j) => (
            <path key={j} d={poly([P.p(xOut, CAR.seat.backY, za), P.p(xOut - sgn * 22, CAR.seat.backY, za), P.p(xOut - sgn * 22, CAR.seat.backY, zb), P.p(xOut, CAR.seat.backY, zb)])} fill={A.tone(CAR_MAT.seat.lit, (za + zb) / 2, 176)} />
          ))}
        </g>,
      );
      // the riser under the seat
      els.push(PlaneXq(`br${sgn}${i}`, xIn + sgn * 6, -68, 0, a, b, CAR_MAT.seatBase.mid));
      // the cushion's top (seen from above: lit) and its rounded front lip
      els.push(
        <g key={`bc${sgn}${i}`}>
          {zBands(A, a, b, 18).map(([za, zb], j) => (
            <path key={j} d={poly([P.p(xIn, -CAR.seat.h, za), P.p(xOut - sgn * 22, -CAR.seat.h, za), P.p(xOut - sgn * 22, -CAR.seat.h, zb + (zb - za) * 0.1), P.p(xIn, -CAR.seat.h, zb + (zb - za) * 0.1)])} fill={A.tone(CAR_MAT.seat.lit, (za + zb) / 2, 82)} />
          ))}
        </g>,
      );
      els.push(PlaneXq(`bl${sgn}${i}`, xIn, -CAR.seat.h, -64, a, b, CAR_MAT.seat.mid));
      // the cushion's front edge: a cream rim fading with the fog
      els.push(<path key={`bcr${sgn}${i}`} d={`M${Pt(P.p(xIn, -CAR.seat.h, Math.max(a, P.zNear + 30)))}L${Pt(P.p(xIn, -CAR.seat.h, b))}`} stroke="#F3EBDD" strokeOpacity={0.35} strokeWidth={lw * 1.1} />);
      // the seat divisions: soft seams across the cushion (few, fading with distance)
      let d = "";
      for (const st of SEATS) {
        if (st.side !== (sgn < 0 ? "L" : "R") || st.Z - CAR.seat.pitch / 2 <= a || st.Z - CAR.seat.pitch / 2 >= b) continue;
        const z = st.Z - CAR.seat.pitch / 2;
        d += `M${Pt(P.p(xIn, -CAR.seat.h, z))}L${Pt(P.p(xOut - sgn * 22, -CAR.seat.h, z))}L${Pt(P.p(xOut - sgn * 22, CAR.seat.backY, z))}`;
      }
      if (d) els.push(<path key={`bs${sgn}${i}`} d={d} fill="none" stroke={A.tone(CAR_MAT.seat.dark, (a + b) / 2, 80)} strokeWidth={lw * 0.9} strokeOpacity={0.4} />);
    });
  }
  // ---- the grab rails (along each side over the bench fronts) ----------------------------------------------------------
  for (const sgn of [-1, 1]) {
    const X = sgn * CAR.rail.x;
    const R = 4;
    const top: P2[] = [];
    const bot: P2[] = [];
    const zs = zBands(A, z0, ez, 40).map((b) => b[0]).concat([ez - 20]);
    for (const z of zs) {
      top.push(P.p(X, CAR.rail.y - R, z));
      bot.push(P.p(X, CAR.rail.y + R, z));
    }
    // tone by depth: split in a few pieces
    const pieces = 8;
    for (let i = 0; i < pieces; i++) {
      const s0 = Math.floor((i * (zs.length - 1)) / pieces);
      const s1 = Math.floor(((i + 1) * (zs.length - 1)) / pieces);
      const zm = (zs[s0] + zs[s1]) / 2;
      const q = [...top.slice(s0, s1 + 1), ...bot.slice(s0, s1 + 1).reverse()];
      els.push(<path key={`rl${sgn}${i}`} d={poly(q)} fill={A.tone(CAR_MAT.steel.mid, zm, 352)} />);
      els.push(<path key={`rr${sgn}${i}`} d={`M${top.slice(s0, s1 + 1).map(Pt).join("L")}`} fill="none" stroke="#F3EBDD" strokeOpacity={0.5 * (1 - A.fog(zm))} strokeWidth={lw * 0.9} />);
    }
    // brackets up to the ceiling every bay
    for (const Zb of [-300, 300, 900, 1250, 1750]) {
      els.push(<path key={`br${sgn}${Zb}`} d={`M${Pt(P.p(X, CAR.rail.y, Zb))}L${Pt(P.p(X + sgn * 30, ceilY, Zb))}`} stroke={A.tone(CAR_MAT.steel.mid, Zb, 370)} strokeWidth={Math.max(0.6, 5 * P.r(Zb))} strokeLinecap="round" />);
    }
  }
  // ---- the ceiling light strip (emissive) with its glow -------------------------------------------------------------
  const lightPanels: [number, number][] = [];
  for (let z = -640; z < ez - 80; z += 330) lightPanels.push([z, Math.min(z + 290, ez - 80)]);
  els.push(
    <defs key="lgd">
      <filter id={`${uid}lg`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={9} />
      </filter>
    </defs>,
  );
  // soft light falling from each panel into the air (screen blend, blurred): the carriage's shafts
  els.push(
    <defs key="lcd">
      <linearGradient id={`${uid}lc`} gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={CAR_MAT.lightStrip} stopOpacity={0.3} />
        <stop offset="0.5" stopColor={CAR_MAT.lightStrip} stopOpacity={0.1} />
        <stop offset="1" stopColor={CAR_MAT.lightStrip} stopOpacity={0} />
      </linearGradient>
      <filter id={`${uid}lcb`} x="-30%" y="-10%" width="160%" height="120%">
        <feGaussianBlur stdDeviation={14} />
      </filter>
    </defs>,
  );
  lightPanels.forEach(([a, b], i) => {
    const zm = (a + b) / 2;
    if (zm < P.zNear + 120) return;
    const cone = [P.p(-26, ceilY + 2, zm), P.p(26, ceilY + 2, zm), P.p(150, -40, zm), P.p(-150, -40, zm)];
    els.push(<path key={`lc${i}`} d={poly(cone)} fill={`url(#${uid}lc)`} opacity={0.75 * (1 - A.fog(zm))} filter={`url(#${uid}lcb)`} style={{ mixBlendMode: "screen" }} />);
  });
  lightPanels.forEach(([a, b], i) => {
    const zm = (a + b) / 2;
    const q = [P.p(-24, ceilY + 2, a), P.p(24, ceilY + 2, a), P.p(24, ceilY + 2, b), P.p(-24, ceilY + 2, b)];
    const lit = mixHex(CAR_MAT.lightStrip, A.airHex(zm, 400), 0.6 * A.fog(zm));
    const qg = [P.p(-46, ceilY + 2, a - 20), P.p(46, ceilY + 2, a - 20), P.p(46, ceilY + 2, b + 20), P.p(-46, ceilY + 2, b + 20)];
    els.push(<path key={`lgg${i}`} d={poly(qg)} fill={lit} opacity={0.35} filter={`url(#${uid}lg)`} />);
    els.push(<path key={`lgp${i}`} d={poly(q)} fill={lit} opacity={0.92} stroke={A.tone(CAR_MAT.steel.mid, zm, 400)} strokeWidth={lw * 0.8} />);
  });
  // ---- the medium near the lens: the near floor sinks into the dense low air, the near ceiling into the high air
  // (screen-space veils in world units, under the people and the poles)
  {
    const cam = A.cam;
    const wx0 = cam.cx - 560 / cam.k;
    const wy = (sy: number) => cam.cy + (sy - 960) / cam.k;
    const lowA = A.screenAir(wy(1900));
    const highA = A.screenAir(wy(0));
    els.push(
      <g key="veils">
        <defs>
          <linearGradient id={`${uid}vl`} gradientUnits="userSpaceOnUse" x1="0" y1={wy(1240).toFixed(2)} x2="0" y2={wy(1920).toFixed(2)}>
            <stop offset="0" stopColor={lowA} stopOpacity={0} />
            <stop offset="0.55" stopColor={lowA} stopOpacity={0.32} />
            <stop offset="1" stopColor={lowA} stopOpacity={0.62} />
          </linearGradient>
          <linearGradient id={`${uid}vh`} gradientUnits="userSpaceOnUse" x1="0" y1={wy(0).toFixed(2)} x2="0" y2={wy(560).toFixed(2)}>
            <stop offset="0" stopColor={highA} stopOpacity={0.66} />
            <stop offset="0.55" stopColor={highA} stopOpacity={0.3} />
            <stop offset="1" stopColor={highA} stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={wx0} y={wy(1240)} width={1120 / cam.k} height={700 / cam.k} fill={`url(#${uid}vl)`} />
        <rect x={wx0} y={wy(0)} width={1120 / cam.k} height={560 / cam.k} fill={`url(#${uid}vh)`} />
      </g>,
    );
  }
  // ---- depth-sorted: poles, straps, the cut's items (people) ----------------------------------------------------------
  const sorted: StageItem[] = [];
  for (const p of POLES) {
    if (hidden(hidePoles, p)) continue;
    sorted.push({
      Z: p.Z,
      key: `pole${p.i}`,
      node: <AirCyl A={A} X={p.X} Z={p.Z} R={p.R} Y0={ceilY} Y1={0} mat={CAR_MAT.steel} uid={`${uid}p${p.i}`} />,
    });
  }
  for (const st of STRAPS) {
    if (st.Z < P.zNear + 60 || hidden(hideStraps, st)) continue;
    const h = strapHandle(st, frame);
    const top = P.p(st.X, CAR.rail.y, st.Z);
    const bt = P.p(h[0], h[1], h[2]);
    const r = P.r(st.Z);
    const ax = bt[0] - top[0];
    const ay = bt[1] - top[1];
    const L = Math.hypot(ax, ay) || 1;
    const ux = ax / L;
    const uy = ay / L;
    // the handle: a soft triangle under the strap
    const hw = 9 * r;
    const hh = 14 * r;
    const hp: P2[] = [
      [bt[0] - uy * 0 - ux * 0, bt[1]],
      [bt[0] + uy * hw + ux * hh, bt[1] - ux * hw + uy * hh],
      [bt[0] - uy * hw + ux * hh, bt[1] + ux * hw + uy * hh],
    ];
    const fogA = 1 - A.fog(st.Z);
    sorted.push({
      Z: st.Z + 0.5,
      key: `strap${st.side}${st.i}`,
      node: (
        <g>
          <path d={`M${Pt(top)}L${Pt(bt)}`} stroke={A.tone(CAR_MAT.strap, st.Z, 330)} strokeWidth={Math.max(0.6, 4.5 * r)} strokeLinecap="round" />
          <path d={poly(hp)} fill="none" stroke={A.tone(CAR_MAT.handle, st.Z, 300)} strokeWidth={Math.max(0.6, 3.2 * r)} strokeLinejoin="round" opacity={0.6 + 0.4 * fogA} />
        </g>
      ),
    });
  }
  items.forEach((it, i) => sorted.push({ ...it, key: it.key ?? `it${i}` }));
  sorted.sort((a, b) => b.Z - a.Z);
  return (
    <g>
      {els}
      {sorted.map((s) => (
        <g key={s.key}>{s.node}</g>
      ))}
    </g>
  );
};
/** a colour of the set fogged at depth Z (for the cuts' own props) */
export const carTone = (A: AirWorld, hex: string, Z: number, h = 100) => A.tone(hex, Z, h);
export { fogHex };
