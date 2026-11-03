// ---------------------------------------------------------------------------
// lbjDeskWorld (robert-lbj-money): THE SHARED WORLD of the clip's two graphics (cut 40 OkFifteenHundred, cut 47
// NoNever). Dwarkesh 3D style (styles/dwarkesh-3d.md), mood night: Lyndon Johnson's desk at dusk, 1940, one brass-and-
// slate lamp at the upper left as the key light, inside the misty teal air (the kit's AirStage, palette A).
// Owner: builder 1 (OkFifteenHundred). Cut 2 imports it read-only; after DESK_READY.md the exports below stay stable
// (changes get NEW names, logged in animation_source/notes/SHARED_CHANGES.md).
//
// UNITS: centimetres. X right, Y up (the desk top Y = 0), Z away from the writer's side (the desk's front edge Z = 0,
// its back edge Z = 85). Everything is drawn in ONE full-frame SVG in screen px (<DeskSvg>): every point goes through
// the pinhole camera (V.p), every flat thing on the desk is a projected polygon, typed text gets a per-word affine
// from the local Jacobian of its surface (exact for these small words), ink ribbons are projected point by point.
//
// API
//   DeskCam {tx, ty, tz, dist, pitch°(down +), yaw°(+ = looking to the right), f (focal px), sx, sy (where the target
//     lands on screen)}; DESK_CAM_REST = cut 1's LAST frame camera (f114): cut 2 opens on it.
//   deskView(cam, frame, rest?) -> DeskView V: V.p(q) screen [x, y]; V.s(q) px per cm at q; V.zc(q) depth; V.tone(hex,
//     q, h?) fogged by distance; V.v the AirView; V.lamp (screen Lamp for AirStage); V.jac(fn, u, v) an SVG matrix.
//   <DeskStage V bloom? front?>{world}</DeskStage>   AirStage + one <svg>; children are SVG in screen px.
//   <DeskScene V />            the room, the desk, the light pool, the blotter, inkwell + pen tray, the lamp (no tray)
//   <DoneTray V items uid />   the wooden tray for finished requests at TRAY, with `items` (DoneItem[]) stacked in it
//   <Telegram V pose strips notation? dim? uid />   a 1940 Western Union blank on the desk (pose = TelegramPose:
//     {X, Z, rot° in the desk plane, lift cm}); strips = Strip[] (typed tape); notation = Notation | Notation[] (the
//     handwritten verdict, written up to its own progress); dim 0..1 = the paper goes dead (toward DEAD and the air,
//     the strips fading toward unreadable). Soft contact shadow, a slight curl, the lamp's falloff across it.
//   telegramPoint(pose, u, v, h?) -> V3   paper point (u 0..TG_W left to right, v 0..TG_H top to bottom) in the world
//   Notation {text, colour 'grant' | 'refuse', progress 0..1, weight? (pressure: width x, default 1), at? [u, v]
//     baseline start, size? (cap height cm), slant?, rise?, underline? 0 | 1 | 2, glow? 0..1 (grant only)}
//   layoutNotation(n) -> {strokes, glyphs: [{ch, p0, p1}] progress marks per glyph, underline marks}
//   writeNotation(n, progress?) -> {ink: Ribbon[] (paper uv + widths, written so far), tip [u, v], down, h (cm above
//     the paper while travelling)}  the stroke front for the pen
//   <PenHand V nib grip uid ink? />  the gouache right hand (mitten, thumb lobe), white shirt cuff, dark suit sleeve and
//     a fountain pen whose nib sits on `nib` (V3); `grip` (V3) is the lagging hand anchor (handGrip below), the elbow
//     fixed off frame right at ELBOW. Its soft shadow falls on the paper from the lamp (LAMP_BULB).
//   handGrip(nibAt, f, lag?) -> V3       the hand anchor: the nib's recent path smoothed (the wrist lags the fingers)
//   nibOnPaper(pose, n, progress) -> V3  the pen tip in the world for a notation at a progress
//   TELEGRAM_REST {X, Z, rot, lift}: the spot square in the light (cut 1's telegram at rest)
//   CUT1_STRIPS, CUT1_NOTATION (progress 1): cut 1's telegram; DONE_STACK_CUT1: DoneItem[] = it lying in the tray
//   TRAY {X0, X1, Z0, Z1, H}; trayPose(i) -> TelegramPose for the i-th item in the stack (cut 2 slides into trayPose)
//   INK_GRANT / INK_REFUSE colours, TG_W / TG_H paper size, LAMP_BULB, POOL
//
// V2 (rev 2, 2026-11-03; additive, every name above unchanged): DESK_CAM_REST_V2 (cut 1's last frame from rev 2),
//   CUT1_STRIPS_V2 (the ask ~2.15x larger in two lines), Notation.hand = "pen" (the joined fountain-pen scrawl,
//   GLYPHS_PEN, defaults NOTATION_PEN_DEFAULT; also layoutNotationPen / writeNotationPen / nibOnPaperPen),
//   CUT1_NOTATION_V2, DONE_STACK_CUT1_V2, ELBOW_V2 + PEN_REST_DIR_V2 + PEN_LEN_V2 (PenHand's new optional props elbow,
//   restDir, penLen: the arm from the lower right), handGripV2 (the hand's lag offset capped).
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont as loadElite } from "@remotion/google-fonts/SpecialElite";
import { loadFont as loadBarlowC } from "@remotion/google-fonts/BarlowCondensed";
import { AIR, AirStage, ACCENT, DEAD, Paint, c01, fogHex, lerp, makeAirView, mixHex, smoothstep, type AirScene, type AirView } from "../kits/dwarkesh-3d/dwarkesh3d";

const { fontFamily: ELITE } = loadElite("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: BARLOW_C } = loadBarlowC("normal", { weights: ["700"], subsets: ["latin"] });

export type V3 = [number, number, number];
export type P2 = [number, number];
const PAL = AIR.A;
const n2 = (v: number) => v.toFixed(2);
const Pt = (q: P2) => `${n2(q[0])},${n2(q[1])}`;
const polyD = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const lineD = (q: P2[]) => `M${q.map(Pt).join("L")}`;
const D2R = Math.PI / 180;
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm3 = (a: V3): V3 => mul3(a, 1 / Math.max(1e-9, len3(a)));
const ease = (u: number) => {
  const t = c01(u);
  return t * t * (3 - 2 * t);
};

// ===================================================================================================================
// COLOURS AND MATERIALS (muted: nothing near the orange hue but the grant's ink)
// ===================================================================================================================
export const INK_GRANT = ACCENT;
export const INK_GRANT_HOT = "#FFE2A0";
export const INK_REFUSE = "#2B241D";
const WOOD = { lit: "#5E4C3B", mid: "#463829", dark: "#2A2119" };
const LEATHER = { lit: "#68725F", mid: "#525B4B", dark: "#323A2F" };
const LEATHER_END = { lit: "#4A4136", mid: "#3A3229", dark: "#251F19" };
const BRASS = { lit: "#B8AE8C", mid: "#8E8566", dark: "#55503D" };
const SLATE = { lit: "#6A7477", mid: "#4C5458", dark: "#2B3134" };
const BRASS_DK = { lit: "#8C8466", mid: "#6A644C", dark: "#3F3B2D" };
const CREAM = "#F3EBDD";
const CREAM_LO = "#D9CDB4";
const TYPE_INK = "#2B241D";

// ===================================================================================================================
// THE CAMERA (a pinhole: pitch looks down, yaw turns right; the target T lands at screen (sx, sy))
// ===================================================================================================================
export type DeskCam = { tx: number; ty: number; tz: number; dist: number; pitch: number; yaw: number; f: number; sx: number; sy: number };
/** cut 1's last frame (f114): cut 2 opens on this framing (OkFifteenHundred asserts camAt(114) equals it) */
export const DESK_CAM_REST: DeskCam = { tx: 1.6, ty: 0, tz: 27.6, dist: 45, pitch: 59, yaw: -3.2, f: 1900, sx: 540, sy: 760 };
/** V2 (director rev 1): closer and lower. Cut 1's last frame from rev 2 on: the telegram spans x ~20-1060 (~96 % of
 *  the width with its tilt), y ~405-1071; with CUT1_STRIPS_V2 the ask sits at y ~580-800, a NOTATION_PEN_DEFAULT
 *  notation at y ~820-990 (its underline ~985). */
export const DESK_CAM_REST_V2: DeskCam = { tx: 0.6, ty: 0, tz: 27.4, dist: 42.5, pitch: 54, yaw: -3.2, f: 1900, sx: 540, sy: 730 };

/** the lamp (world): the bulb inside the shade, and the centre of its pool on the desk */
export const LAMP_BASE: V3 = [-44, 0, 80];
export const LAMP_BULB: V3 = [-27, 35, 63];
export const POOL = { X: 0, Z: 30, rx: 24, rz: 17 };

/** the scene of the air (units cm; fog by the eye's distance; night: one lamp) */
const SCENE: AirScene = { look: "A", mood: "night", F: 1900, fogNear: 70, fogVis: 300, fogMax: 0.85, hLow: -76, hHigh: 160, moteUnit: 100, eyeT: 0.3 };

export type DeskView = {
  cam: DeskCam;
  frame: number;
  C: V3;
  fwd: V3;
  right: V3;
  up: V3;
  p: (q: V3) => P2;
  zc: (q: V3) => number;
  s: (q: V3) => number;
  v: AirView;
  /** distance from the eye */
  dist: (q: V3) => number;
  tone: (hex: string, q: V3, h?: number) => string;
  fog: (q: V3) => number;
  lamp: { x: number; y: number; angle: number; spread: number; reach: number };
  /** the SVG matrix that maps a flat local frame (1 unit = 1 cm along a / b from origin o, all world) to the screen */
  jac: (o: V3, a: V3, b: V3) => string;
};

export const camBasis = (cam: DeskCam) => {
  const yw = cam.yaw * D2R;
  const pt = cam.pitch * D2R;
  const fwd: V3 = [Math.sin(yw) * Math.cos(pt), -Math.sin(pt), Math.cos(yw) * Math.cos(pt)];
  const right: V3 = [Math.cos(yw), 0, -Math.sin(yw)];
  const up: V3 = [fwd[1] * right[2] - fwd[2] * right[1], fwd[2] * right[0] - fwd[0] * right[2], fwd[0] * right[1] - fwd[1] * right[0]];
  const C = sub3([cam.tx, cam.ty, cam.tz], mul3(fwd, cam.dist));
  return { fwd, right, up, C };
};

export const deskView = (cam: DeskCam, frame: number, rest: DeskCam = DESK_CAM_REST): DeskView => {
  const { fwd, right, up, C } = camBasis(cam);
  const zc = (q: V3) => Math.max(0.5, dot3(sub3(q, C), fwd));
  const p = (q: V3): P2 => {
    const d = sub3(q, C);
    const z = Math.max(0.5, dot3(d, fwd));
    return [cam.sx + (cam.f * dot3(d, right)) / z, cam.sy - (cam.f * dot3(d, up)) / z];
  };
  const s = (q: V3) => cam.f / zc(q);
  // the horizon row: a far point straight ahead at the eye's height
  const horizon = cam.sy - cam.f * Math.tan(cam.pitch * D2R);
  const R = camBasis(rest);
  const v = makeAirView({ scene: { ...SCENE, F: cam.f }, frame, horizon, cam: { x: C[0], y: C[1], z: C[2] }, rest: { x: R.C[0], y: R.C[1], z: R.C[2] } });
  const dist = (q: V3) => len3(sub3(q, C));
  const tone = (hex: string, q: V3, h?: number) => fogHex(v, hex, dist(q), h ?? q[1]);
  const fog = (q: V3) => c01(v.fogAt(dist(q)));
  const lb = p(LAMP_BULB);
  const pc = p([POOL.X, 0, POOL.Z]);
  const lamp = { x: lb[0], y: lb[1], angle: Math.atan2(pc[1] - lb[1], pc[0] - lb[0]), spread: 0.36, reach: 1.5 * Math.hypot(pc[0] - lb[0], pc[1] - lb[1]) + 200 };
  const jac = (o: V3, a: V3, b: V3) => {
    const e = 0.05;
    const p0 = p(o);
    const pa = p(add3(o, mul3(a, e)));
    const pb = p(add3(o, mul3(b, e)));
    return `matrix(${((pa[0] - p0[0]) / e).toFixed(4)} ${((pa[1] - p0[1]) / e).toFixed(4)} ${((pb[0] - p0[0]) / e).toFixed(4)} ${((pb[1] - p0[1]) / e).toFixed(4)} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
  };
  return { cam, frame, C, fwd, right, up, p, zc, s, v, dist, tone, fog, lamp, jac };
};

/** the light of the lamp on the desk plane at (X, Z): 0..1 */
export const poolLight = (X: number, Z: number) => Math.exp(-(((X - POOL.X) / POOL.rx) ** 2 + ((Z - POOL.Z) / POOL.rz) ** 2));

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
export const DeskStage: React.FC<{ V: DeskView; bloom?: number; children?: React.ReactNode; shafts?: number; motes?: number }> = ({ V, bloom = 0.2, children, shafts = 0.75, motes = 0.8 }) => (
  <AirStage v={V.v} bloom={bloom} lamp={V.lamp} shafts={shafts} motes={motes} vignette={1.1}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      {children}
    </svg>
  </AirStage>
);

// a flat quad on the plane Y = y, sampled along its edges (perspective-exact polygon)
const quadY = (V: DeskView, x0: number, x1: number, z0: number, z1: number, y = 0, n = 6): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) out.push(V.p([lerp(x0, x1, i / n), y, z0]));
  for (let i = 0; i <= n; i++) out.push(V.p([x1, y, lerp(z0, z1, i / n)]));
  for (let i = 0; i <= n; i++) out.push(V.p([lerp(x1, x0, i / n), y, z1]));
  for (let i = 0; i <= n; i++) out.push(V.p([x0, y, lerp(z1, z0, i / n)]));
  return out;
};
/** a radial gradient on the desk plane (an ellipse rx x rz at (X, y, Z)), as gradientTransform */
const planeEllipse = (V: DeskView, X: number, Z: number, rx: number, rz: number, y = 0) => V.jac([X, y, Z], [rx, 0, 0], [0, 0, rz]);

/** a soft shadow on the plane Y = y: an ellipse in world units, blurred */
export const PlaneShadow: React.FC<{ V: DeskView; X: number; Z: number; rx: number; rz: number; y?: number; amt?: number; uid: string }> = ({ V, X, Z, rx, rz, y = 0, amt = 0.5, uid }) => (
  <g>
    <defs>
      <radialGradient id={`${uid}-ps`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={planeEllipse(V, X, Z, rx, rz, y)}>
        <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.8 * amt} />
        <stop offset="0.55" stopColor={PAL.shadow} stopOpacity={0.45 * amt} />
        <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
      </radialGradient>
    </defs>
    <path d={polyD(quadY(V, X - rx, X + rx, Z - rz, Z + rz, y, 4))} fill={`url(#${uid}-ps)`} />
  </g>
);

// a box (desk furniture): faces drawn back to front by the camera's side; light from the upper left
type BoxMat = { lit: string; mid: string; dark: string };
export const DeskBox: React.FC<{ V: DeskView; X0: number; X1: number; Y0: number; Y1: number; Z0: number; Z1: number; mat: BoxMat; uid: string; rim?: number; lw?: number }> = ({ V, X0, X1, Y0, Y1, Z0, Z1, mat, rim = 1, lw = 1.1 }) => {
  const c: V3 = [(X0 + X1) / 2, (Y0 + Y1) / 2, (Z0 + Z1) / 2];
  const t = (hex: string) => V.tone(hex, c);
  const ln = t(mixHex(mat.dark, PAL.shadow, 0.4));
  const P = (x: number, y: number, z: number) => V.p([x, y, z]);
  const C = V.C;
  const faces: React.ReactNode[] = [];
  const face = (q: P2[], fill: string, k: string) => faces.push(<path key={k} d={polyD(q)} fill={fill} stroke={ln} strokeWidth={lw} strokeLinejoin="round" />);
  // Y1 = top (larger y up). Visible faces by the camera's position.
  if (C[2] < Z0) face([P(X0, Y1, Z0), P(X1, Y1, Z0), P(X1, Y0, Z0), P(X0, Y0, Z0)], t(mat.mid), "fr");
  if (C[0] > X1) face([P(X1, Y1, Z0), P(X1, Y1, Z1), P(X1, Y0, Z1), P(X1, Y0, Z0)], t(mixHex(mat.mid, mat.dark, 0.55)), "rt");
  if (C[0] < X0) face([P(X0, Y1, Z0), P(X0, Y1, Z1), P(X0, Y0, Z1), P(X0, Y0, Z0)], t(mixHex(mat.lit, mat.mid, 0.4)), "lf");
  if (C[1] > Y1) face([P(X0, Y1, Z0), P(X1, Y1, Z0), P(X1, Y1, Z1), P(X0, Y1, Z1)], t(mat.lit), "tp");
  const ra = 0.55 * rim * (1 - V.fog(c));
  const rimD = `M${Pt(P(X0, Y1, Z0))}L${Pt(P(X1, Y1, Z0))}M${Pt(P(X0, Y1, Z0))}L${Pt(P(X0, Y1, Z1))}`;
  return (
    <g>
      {faces}
      {ra > 0.01 ? <path d={rimD} fill="none" stroke={CREAM} strokeOpacity={ra} strokeWidth={lw * 1.3} strokeLinecap="round" /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE SCENE: the room, the desk, the light pool, the blotter, inkwell + pen tray, the lamp
// ===================================================================================================================
export const DESK = { X0: -95, X1: 95, Z0: 0, Z1: 85, T: 3.5 };
export const BLOTTER = { X0: -16, X1: 34, Z0: 9, Z1: 51, end: 4.2 };
export const TRAY = { X0: -34.5, X1: -10.5, Z0: 37.5, Z1: 57, H: 3.2, floor: 0.6 };
const INKWELL = { X: 27, Z: 62, w: 6, d: 6, h: 4.6 };
const PENTRAY = { X0: 12, X1: 30, Z0: 55, Z1: 59 };

const Room: React.FC<{ V: DeskView }> = ({ V }) => {
  // the back wall at Z 330 and the floor at Y -76: drawn only as dim shapes sinking into the air
  const WZ = 330;
  const FY = -76;
  const wall = (hex: string, q: V3) => V.tone(hex, q);
  const els: React.ReactNode[] = [];
  const quadZ = (x0: number, x1: number, y0: number, y1: number, z: number) => [V.p([x0, y0, z]), V.p([x1, y0, z]), V.p([x1, y1, z]), V.p([x0, y1, z])];
  els.push(<path key="wall" d={polyD(quadZ(-400, 400, FY, 260, WZ))} fill={wall("#4A4338", [0, 40, WZ])} />);
  // the window: dusk light (pale teal), two sashes, mullions
  const wx0 = -95;
  const wx1 = 5;
  const wy0 = -8;
  const wy1 = 150;
  els.push(<path key="wf" d={polyD(quadZ(wx0 - 6, wx1 + 6, wy0 - 6, wy1 + 6, WZ - 1))} fill={wall("#3A3128", [wx0, 60, WZ])} />);
  els.push(<path key="wg" d={polyD(quadZ(wx0, wx1, wy0, wy1, WZ - 1.5))} fill={wall("#9DBBAA", [wx0, 60, WZ])} />);
  const mull = wall("#3A3128", [wx0, 60, WZ]);
  els.push(<path key="wm1" d={polyD(quadZ((wx0 + wx1) / 2 - 2, (wx0 + wx1) / 2 + 2, wy0, wy1, WZ - 2))} fill={mull} />);
  els.push(<path key="wm2" d={polyD(quadZ(wx0, wx1, (wy0 + wy1) / 2 - 2, (wy0 + wy1) / 2 + 2, WZ - 2))} fill={mull} />);
  // a bookcase at the right
  const bx0 = 60;
  const bx1 = 170;
  els.push(<path key="bc" d={polyD(quadZ(bx0, bx1, FY, 140, WZ - 30))} fill={wall("#3B3027", [bx0, 30, WZ - 30])} />);
  for (let i = 0; i < 5; i++) {
    const y = FY + 12 + i * 42;
    els.push(<path key={`sh${i}`} d={polyD(quadZ(bx0 + 5, bx1 - 5, y, y + 3, WZ - 31))} fill={wall("#2E251D", [bx0, y, WZ - 30])} />);
    for (let j = 0; j < 14; j++) {
      const x = bx0 + 7 + j * 7.4;
      const hgt = 26 + 8 * Math.sin(i * 3.1 + j * 1.7);
      const col = ["#5B4A3C", "#4D4A40", "#5E4F42", "#46413A"][(i + j) % 4];
      els.push(<path key={`bk${i}-${j}`} d={polyD(quadZ(x, x + 5.6, y + 3, y + 3 + hgt, WZ - 31))} fill={wall(col, [x, y, WZ - 30])} />);
    }
  }
  // the floor
  const fl: P2[] = [V.p([-400, FY, 40]), V.p([400, FY, 40]), V.p([400, FY, WZ]), V.p([-400, FY, WZ])];
  els.push(<path key="fl" d={polyD(fl)} fill={wall("#3A3027", [0, FY, 200])} />);
  return <g>{els}</g>;
};

export const DeskScene: React.FC<{ V: DeskView; uid?: string }> = ({ V, uid = "ds" }) => {
  const P = V.p;
  const T = DESK.T;
  // the desk top: one continuous umber, a little darker toward the far edge and the sides (the lamp's pool lifts it)
  const top = quadY(V, DESK.X0, DESK.X1, DESK.Z0, DESK.Z1, 0, 10);
  const wood = V.tone(WOOD.mid, [0, 0, 40]);
  const grain: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const z = 1.5 + i * 3.25 + 0.8 * Math.sin(i * 2.3);
    const pts: P2[] = [];
    for (let k = 0; k <= 24; k++) {
      const x = lerp(DESK.X0, DESK.X1, k / 24);
      pts.push(P([x, 0, z + 0.35 * Math.sin(x * 0.05 + i)]));
    }
    grain.push(<path key={i} d={lineD(pts)} fill="none" stroke={V.tone(WOOD.dark, [0, 0, z])} strokeOpacity={0.22 + 0.1 * Math.sin(i * 1.3)} strokeWidth={0.9} />);
  }
  // the front face of the desk top (and the dark knee hole under it)
  const front: P2[] = [P([DESK.X0, 0, 0]), P([DESK.X1, 0, 0]), P([DESK.X1, -T, 0]), P([DESK.X0, -T, 0])];
  const under: P2[] = [P([DESK.X0, -T, 0]), P([DESK.X1, -T, 0]), P([DESK.X1, -76, 0]), P([DESK.X0, -76, 0])];
  // the blotter: leather pad, the two end pieces, a cream rim on the near edge
  const B = BLOTTER;
  const pad = quadY(V, B.X0, B.X1, B.Z0, B.Z1, 0.15, 8);
  const endL = quadY(V, B.X0 - 0.4, B.X0 + B.end, B.Z0 - 0.4, B.Z1 + 0.4, 0.35, 6);
  const endR = quadY(V, B.X1 - B.end, B.X1 + 0.4, B.Z0 - 0.4, B.Z1 + 0.4, 0.35, 6);
  const leather = V.tone(LEATHER.mid, [8, 0, 30]);
  const lEnd = V.tone(LEATHER_END.mid, [8, 0, 30]);
  // the pool of light: one radial lift on the desk (screen blend in the medium's cream)
  const pool = planeEllipse(V, POOL.X, POOL.Z, POOL.rx * 1.25, POOL.rz * 1.25, 0.4);
  // inkwell + pen tray
  const I = INKWELL;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-pool`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={pool}>
          <stop offset="0" stopColor="#F1E2C6" stopOpacity="0.62" />
          <stop offset="0.35" stopColor="#E8D6B4" stopOpacity="0.36" />
          <stop offset="0.7" stopColor="#D9C6A2" stopOpacity="0.1" />
          <stop offset="1" stopColor="#D9C6A2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-far`} gradientUnits="userSpaceOnUse" x1="0" y1={n2(P([0, 0, 85])[1])} x2="0" y2={n2(P([0, 0, 20])[1])}>
          <stop offset="0" stopColor={PAL.shadow} stopOpacity="0.45" />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity="0" />
        </linearGradient>
      </defs>
      <Room V={V} />
      <path d={polyD(under)} fill={V.tone("#241C15", [0, -40, 0])} />
      <path d={polyD(front)} fill={V.tone(WOOD.dark, [0, 0, 0])} />
      <path d={polyD(top)} fill={wood} />
      {grain}
      <path d={polyD(top)} fill={`url(#${uid}-far)`} />
      <path d={`M${Pt(P([DESK.X0, 0, 0]))}L${Pt(P([DESK.X1, 0, 0]))}`} stroke={CREAM} strokeOpacity={0.35} strokeWidth={1.4} />
      {/* the blotter */}
      <PlaneShadow V={V} X={(B.X0 + B.X1) / 2 + 0.6} Z={(B.Z0 + B.Z1) / 2 - 0.6} rx={(B.X1 - B.X0) / 2 + 1.2} rz={(B.Z1 - B.Z0) / 2 + 1.2} amt={0.35} uid={`${uid}-bs`} />
      <path d={polyD(pad)} fill={leather} stroke={V.tone(LEATHER.dark, [8, 0, 30])} strokeWidth={1} />
      <path d={polyD(endL)} fill={lEnd} stroke={V.tone(LEATHER_END.dark, [8, 0, 30])} strokeWidth={1} />
      <path d={polyD(endR)} fill={mixHex(lEnd, PAL.shadow, 0.15)} stroke={V.tone(LEATHER_END.dark, [8, 0, 30])} strokeWidth={1} />
      <path d={`M${Pt(P([B.X0 - 0.4, 0.35, B.Z0 - 0.4]))}L${Pt(P([B.X0 + B.end, 0.35, B.Z0 - 0.4]))}M${Pt(P([B.X1 - B.end, 0.35, B.Z0 - 0.4]))}L${Pt(P([B.X1 + 0.4, 0.35, B.Z0 - 0.4]))}`} stroke={CREAM} strokeOpacity={0.3} strokeWidth={1.1} />
      {/* the pool of light over desk and blotter */}
      <path d={polyD(top)} fill={`url(#${uid}-pool)`} style={{ mixBlendMode: "screen" }} />
      {/* pen tray and inkwell at the back right */}
      <PlaneShadow V={V} X={(PENTRAY.X0 + PENTRAY.X1) / 2 + 1} Z={(PENTRAY.Z0 + PENTRAY.Z1) / 2 - 0.8} rx={11} rz={3.2} amt={0.5} uid={`${uid}-pts`} />
      <DeskBox V={V} X0={PENTRAY.X0} X1={PENTRAY.X1} Y0={0} Y1={1.2} Z0={PENTRAY.Z0} Z1={PENTRAY.Z1} mat={BRASS_DK} uid={`${uid}-pt`} />
      <path d={polyD(quadY(V, PENTRAY.X0 + 0.7, PENTRAY.X1 - 0.7, PENTRAY.Z0 + 0.7, PENTRAY.Z1 - 0.7, 1.21, 3))} fill={V.tone(BRASS_DK.dark, [20, 1, 57])} />
      <PlaneShadow V={V} X={I.X + 2} Z={I.Z - 1.5} rx={5.2} rz={4.6} amt={0.6} uid={`${uid}-iws`} />
      <DeskBox V={V} X0={I.X - I.w / 2} X1={I.X + I.w / 2} Y0={0} Y1={I.h} Z0={I.Z - I.d / 2} Z1={I.Z + I.d / 2} mat={SLATE} uid={`${uid}-iw`} />
      <DeskBox V={V} X0={I.X - 1.6} X1={I.X + 1.6} Y0={I.h} Y1={I.h + 1.4} Z0={I.Z - 1.6} Z1={I.Z + 1.6} mat={BRASS} uid={`${uid}-iwc`} />
      <Lamp V={V} uid={`${uid}-lamp`} />
    </g>
  );
};

/** the dark beyond the lamp's pool: a desk-plane falloff laid over everything on the desk (place it after the
 *  telegrams and the hand: a paper or a hand coming in from the dark is lit as it enters the pool) */
export const DeskDark: React.FC<{ V: DeskView; uid: string; amt?: number }> = ({ V, uid, amt = 1 }) => (
  <g>
    <defs>
      <radialGradient id={`${uid}-dk`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={planeEllipse(V, POOL.X, POOL.Z, POOL.rx * 1.5, POOL.rz * 1.5, 0.5)}>
        <stop offset="0" stopColor={PAL.shadow} stopOpacity="0" />
        <stop offset="0.38" stopColor={PAL.shadow} stopOpacity="0" />
        <stop offset="0.7" stopColor={PAL.shadow} stopOpacity={n2(0.4 * amt)} />
        <stop offset="1" stopColor={PAL.shadow} stopOpacity={n2(0.68 * amt)} />
      </radialGradient>
    </defs>
    <path d={polyD(quadY(V, -260, 260, -2, DESK.Z1, 0.5, 12))} fill={`url(#${uid}-dk)`} />
  </g>
);

// the brass-and-slate lamp: a round brass base, a stem, an arm, a slate cone shade over the blotter; the bulb's glow
const Lamp: React.FC<{ V: DeskView; uid: string }> = ({ V, uid }) => {
  const P = V.p;
  const B = LAMP_BASE;
  const ring = (c: V3, r: number, ax: V3, bx: V3, n = 28): P2[] => {
    const out: P2[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push(P(add3(c, add3(mul3(ax, r * Math.cos(a)), mul3(bx, r * Math.sin(a))))));
    }
    return out;
  };
  const X: V3 = [1, 0, 0];
  const Zv: V3 = [0, 0, 1];
  const base = ring(add3(B, [0, 1.8, 0]), 6.2, X, Zv);
  const baseLo = ring(B, 6.6, X, Zv);
  const stemTop: V3 = add3(B, [0, 33, 0]);
  const elbow: V3 = add3(B, [4, 40, -4]);
  // the shade: a cone from its crown (near the elbow) opening toward the pool
  const aim = norm3(sub3([POOL.X, 0, POOL.Z], LAMP_BULB));
  const crown = add3(LAMP_BULB, mul3(aim, -7.5));
  const mouth = add3(LAMP_BULB, mul3(aim, 6));
  const u1 = norm3([aim[2], 0, -aim[0]]);
  const u2 = norm3([aim[1] * u1[2] - aim[2] * u1[1], aim[2] * u1[0] - aim[0] * u1[2], aim[0] * u1[1] - aim[1] * u1[0]]);
  const rimPts = ring(mouth, 7, u1, u2, 36);
  const crownPts = ring(crown, 2.2, u1, u2, 16);
  // convex hull of crown + mouth points = the shade's silhouette
  const hull = (pts: P2[]) => {
    const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo: P2[] = [];
    for (const q of s) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
      lo.push(q);
    }
    const hi: P2[] = [];
    for (let i = s.length - 1; i >= 0; i--) {
      const q = s[i];
      while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
      hi.push(q);
    }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  };
  const shade = hull([...rimPts, ...crownPts]);
  const sc = V.s(LAMP_BULB);
  const t = (hex: string, q: V3) => V.tone(hex, q);
  const pb = P(LAMP_BULB);
  const pm = P(mouth);
  const pcn = P(crown);
  // is the mouth facing the eye? (we see into the shade)
  const facing = dot3(aim, sub3(V.C, mouth)) > 0;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-sh`} gradientUnits="userSpaceOnUse" x1={n2(pcn[0])} y1={n2(pcn[1])} x2={n2(pm[0])} y2={n2(pm[1])}>
          <stop offset="0" stopColor={t(SLATE.lit, crown)} />
          <stop offset="0.6" stopColor={t(SLATE.mid, mouth)} />
          <stop offset="1" stopColor={t(SLATE.dark, mouth)} />
        </linearGradient>
        <radialGradient id={`${uid}-in`} cx={n2(pb[0])} cy={n2(pb[1])} r={n2(sc * 8)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF8EA" />
          <stop offset="0.28" stopColor="#EADBBE" />
          <stop offset="0.7" stopColor="#7A715E" />
          <stop offset="1" stopColor="#4A463C" />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx={n2(pm[0])} cy={n2(pm[1])} r={n2(sc * 9)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF6E4" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#F3EBDD" stopOpacity="0.45" />
          <stop offset="1" stopColor="#F3EBDD" stopOpacity="0" />
        </radialGradient>
      </defs>
      <PlaneShadow V={V} X={B[0] + 1.5} Z={B[2] - 1} rx={11} rz={10} amt={0.55} uid={`${uid}-bs`} />
      <path d={polyD(baseLo)} fill={t(BRASS.dark, B)} />
      <path d={polyD(base)} fill={t(BRASS.mid, B)} stroke={t(BRASS.dark, B)} strokeWidth={1} />
      <path d={`M${Pt(P(add3(B, [0, 1.6, 0])))}L${Pt(P(stemTop))}L${Pt(P(elbow))}L${Pt(P(crown))}`} fill="none" stroke={t(BRASS.mid, stemTop)} strokeWidth={Math.max(2, 1.3 * V.s(stemTop))} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${Pt(P(add3(B, [0, 1.6, 0])))}L${Pt(P(stemTop))}L${Pt(P(elbow))}`} fill="none" stroke={CREAM} strokeOpacity={0.35} strokeWidth={Math.max(1, 0.35 * V.s(stemTop))} strokeLinecap="round" transform="translate(-1.5 -1)" />
      <path d={polyD(shade)} fill={`url(#${uid}-sh)`} stroke={t(SLATE.dark, mouth)} strokeWidth={1.2} strokeLinejoin="round" />
      {facing ? <path d={polyD(rimPts)} fill={t("#2C2A26", mouth)} /> : null}
      {facing ? <path d={polyD(rimPts)} fill={`url(#${uid}-in)`} /> : null}
      <path d={polyD(rimPts)} fill="none" stroke={t(BRASS.lit, mouth)} strokeWidth={Math.max(1.2, 0.5 * sc)} strokeOpacity={0.9} />
      <circle cx={pm[0]} cy={pm[1]} r={sc * 9} fill={`url(#${uid}-glow)`} style={{ mixBlendMode: "screen" }} opacity={facing ? 1 : 0.6} />
    </g>
  );
};

// ===================================================================================================================
// THE TELEGRAM
// ===================================================================================================================
export const TG_W = 21;
export const TG_H = 16.6;
export type TelegramPose = { X: number; Z: number; rot: number; lift: number; curl?: number };
/** the spot square in the light (cut 1's telegram at rest) */
export const TELEGRAM_REST: TelegramPose = { X: 1.2, Z: 28.4, rot: -2.5, lift: 0, curl: 1 };
export type Strip = { text: string; u: number; v: number; size?: number; smudge?: boolean; rot?: number; bold?: string };

/** the paper's surface: (u, v) on the sheet (cm, from its top-left corner), h above it -> world */
export const telegramPoint = (pose: TelegramPose, u: number, v: number, h = 0): V3 => {
  const lx = u - TG_W / 2;
  const lz = -(v - TG_H / 2);
  const r = pose.rot * D2R;
  const X = pose.X + lx * Math.cos(r) - lz * Math.sin(r);
  const Z = pose.Z + lx * Math.sin(r) + lz * Math.cos(r);
  const cu = pose.curl ?? 1;
  // a slight curl: the right edge and the top edge lift a few mm
  const curl = cu * (0.55 * Math.pow(c01((u - 0.78 * TG_W) / (0.22 * TG_W)), 2) + 0.35 * Math.pow(c01((0.14 * TG_H - v) / (0.14 * TG_H)), 2));
  return [X, pose.lift + 0.06 + curl + h, Z];
};
/** the SVG matrix of a text frame on the paper at (u, v), turned by rr (rad) in the sheet, 1 unit = 1/K cm (x along
 *  the line, y down the page), from the surface's local derivatives (the curl included) */
export const paperMatrix = (pose: TelegramPose, V: DeskView, u: number, v: number, rr: number, K: number) => {
  const e = 0.05;
  const c = Math.cos(rr);
  const s = Math.sin(rr);
  const p0 = V.p(telegramPoint(pose, u, v, 0.02));
  const px = V.p(telegramPoint(pose, u + e * c, v + e * s, 0.02));
  const py = V.p(telegramPoint(pose, u - e * s, v + e * c, 0.02));
  const k = 1 / (e * K);
  return `matrix(${((px[0] - p0[0]) * k).toFixed(4)} ${((px[1] - p0[1]) * k).toFixed(4)} ${((py[0] - p0[0]) * k).toFixed(4)} ${((py[1] - p0[1]) * k).toFixed(4)} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
};

/** cut 1's telegram */
export const CUT1_STRIPS: Strip[] = [
  { text: "1940 OCT", u: 15.2, v: 3.95, size: 0.62 },
  { text: "HON LYNDON B JOHNSON WASHINGTON DC", u: 1.3, v: 4.85, size: 0.62 },
  { text: "NEED $1500 FOR CAMPAIGN STOP", u: 1.1, v: 6.35, size: 1.02, bold: "$1500", rot: -0.3 },
  { text: "CAN YOU HELP", u: 1.1, v: 7.85, size: 1.02, rot: 0.25 },
  { text: "RVMQT LXEDNS KW", u: 9.4, v: 7.85, size: 0.55, smudge: true, rot: 0.2 },
];

/** V2: the ask typed ~2.15x larger in two lines (NEED $1500 FOR / CAMPAIGN STOP; "$1500" ~5.6 cm wide, ~262 px
 *  at DESK_CAM_REST_V2), CAN YOU HELP small under it; the date and addressee share one line above */
export const CUT1_STRIPS_V2: Strip[] = [
  { text: "1940 OCT", u: 15.4, v: 4.15, size: 0.62 },
  { text: "HON LYNDON B JOHNSON WASHINGTON DC", u: 1.3, v: 4.15, size: 0.62 },
  { text: "NEED $1500 FOR", u: 0.7, v: 6.7, size: 2.2, bold: "$1500", rot: -0.3 },
  { text: "CAMPAIGN STOP", u: 0.7, v: 9.69, size: 2.2, rot: 0.2 },
  { text: "CAN YOU HELP", u: 0.85, v: 11.43, size: 1.02, rot: 0.25 },
  { text: "RVMQT LXEDNS KW", u: 9.3, v: 11.43, size: 0.55, smudge: true, rot: 0.2 },
];

// ---- handwriting --------------------------------------------------------------------------------------------------
// Each glyph: strokes of cubic segments [x0, y0, c1x, c1y, c2x, c2y, x1, y1, (c1x, c1y, c2x, c2y, x1, y1)...] in a
// box with the baseline at y 0, the cap height 1 (y up); w = advance. Lowercase letters join (the pen stays down).
type Glyph = { w: number; s: number[][]; join?: boolean };
const GLYPHS: Record<string, Glyph> = {
  O: { w: 0.86, s: [[0.6, 0.93, 0.42, 1.03, 0.1, 0.92, 0.05, 0.55, 0.0, 0.2, 0.2, -0.02, 0.42, 0.0, 0.68, 0.02, 0.83, 0.28, 0.8, 0.56, 0.78, 0.86, 0.55, 1.0, 0.33, 0.96]] },
  K: {
    w: 0.86,
    s: [
      [0.13, 1.0, 0.12, 0.66, 0.1, 0.33, 0.08, 0.0],
      [0.68, 0.98, 0.5, 0.8, 0.3, 0.58, 0.15, 0.47, 0.32, 0.36, 0.52, 0.16, 0.72, 0.0, 0.76, -0.03, 0.8, -0.02, 0.86, 0.04],
    ],
  },
  $: {
    w: 0.8,
    s: [
      [0.68, 0.84, 0.6, 0.98, 0.2, 0.98, 0.19, 0.74, 0.17, 0.5, 0.67, 0.53, 0.69, 0.28, 0.71, 0.02, 0.29, -0.04, 0.12, 0.12],
      [0.45, 1.12, 0.44, 0.7, 0.43, 0.3, 0.42, -0.14],
    ],
  },
  "1": { w: 0.55, s: [[0.12, 0.76, 0.22, 0.84, 0.32, 0.92, 0.43, 1.0, 0.41, 0.66, 0.39, 0.33, 0.37, 0.0]] },
  "5": {
    w: 0.8,
    s: [
      [0.25, 0.98, 0.23, 0.84, 0.21, 0.7, 0.19, 0.56, 0.4, 0.66, 0.72, 0.6, 0.72, 0.32, 0.72, 0.04, 0.36, -0.06, 0.1, 0.1],
      [0.25, 0.98, 0.41, 0.99, 0.57, 1.0, 0.76, 1.02],
    ],
  },
  "0": { w: 0.78, s: [[0.47, 0.98, 0.19, 1.0, 0.06, 0.66, 0.06, 0.46, 0.06, 0.18, 0.22, 0.0, 0.4, 0.0, 0.62, 0.0, 0.72, 0.26, 0.72, 0.52, 0.72, 0.8, 0.6, 0.99, 0.41, 0.98]] },
  N: { w: 0.88, s: [[0.08, 0.0, 0.08, 0.33, 0.09, 0.66, 0.1, 1.0, 0.3, 0.66, 0.5, 0.33, 0.7, 0.0, 0.71, 0.33, 0.72, 0.66, 0.74, 1.0]] },
  o: { w: 0.66, join: true, s: [[0.42, 0.53, 0.17, 0.57, 0.04, 0.36, 0.06, 0.22, 0.08, 0.04, 0.24, -0.02, 0.36, 0.0, 0.52, 0.02, 0.6, 0.16, 0.6, 0.3, 0.6, 0.46, 0.5, 0.57, 0.36, 0.54]] },
  ",": { w: 0.32, s: [[0.14, 0.07, 0.16, 0.02, 0.14, -0.1, 0.03, -0.2]] },
  n: { w: 0.66, join: true, s: [[0.06, 0.55, 0.06, 0.36, 0.06, 0.18, 0.05, 0.0, 0.08, 0.3, 0.2, 0.55, 0.36, 0.55, 0.52, 0.55, 0.56, 0.4, 0.56, 0.26, 0.56, 0.14, 0.56, 0.06, 0.62, 0.0]] },
  e: { w: 0.58, join: true, s: [[0.06, 0.24, 0.24, 0.24, 0.5, 0.3, 0.5, 0.44, 0.5, 0.56, 0.36, 0.6, 0.24, 0.54, 0.08, 0.46, 0.02, 0.24, 0.12, 0.08, 0.22, -0.04, 0.42, -0.02, 0.54, 0.08]] },
  v: { w: 0.58, join: true, s: [[0.02, 0.54, 0.1, 0.36, 0.18, 0.18, 0.28, 0.0, 0.36, 0.18, 0.44, 0.36, 0.56, 0.55]] },
  r: { w: 0.52, join: true, s: [[0.06, 0.55, 0.06, 0.36, 0.06, 0.18, 0.05, 0.0, 0.07, 0.26, 0.16, 0.48, 0.32, 0.54, 0.38, 0.56, 0.44, 0.54, 0.5, 0.5]] },
  " ": { w: 0.36, s: [] },
};

// V2 "pen" hand (Notation.hand = "pen"): a fast fountain-pen scrawl. Same box (baseline y 0, cap 1, y up). jin: its
// first stroke joins the previous glyph's last stroke with the pen down (a hairline link) when that glyph has jout;
// fl: strokes whose end is a flick (the pen lifts while moving: a long thinning tail).
type PenGlyph = { w: number; s: number[][]; jin?: boolean; jout?: boolean; fl?: number[] };
const GLYPHS_PEN: Record<string, PenGlyph> = {
  O: {
    w: 0.9,
    jout: true,
    s: [[0.64, 0.9, 0.52, 1.03, 0.18, 1.04, 0.06, 0.74, -0.04, 0.46, 0.04, 0.04, 0.34, -0.01, 0.62, -0.05, 0.85, 0.24, 0.84, 0.55, 0.83, 0.86, 0.6, 1.03, 0.38, 0.98, 0.26, 0.95, 0.3, 0.86, 0.42, 0.88, 0.56, 0.9, 0.74, 0.96, 0.92, 0.94]],
  },
  K: {
    w: 0.9,
    jin: true,
    fl: [1],
    s: [
      [0.16, 1.0, 0.15, 0.66, 0.12, 0.32, 0.09, -0.02],
      [0.76, 1.0, 0.6, 0.86, 0.36, 0.62, 0.18, 0.47, 0.13, 0.43, 0.19, 0.38, 0.28, 0.41, 0.44, 0.3, 0.54, 0.06, 0.74, 0.0, 0.84, -0.02, 0.93, 0.04, 1.0, 0.12],
    ],
  },
  $: {
    w: 0.8,
    fl: [1],
    s: [
      [0.68, 0.84, 0.64, 0.98, 0.26, 1.03, 0.18, 0.78, 0.1, 0.55, 0.64, 0.56, 0.7, 0.3, 0.76, 0.03, 0.32, -0.07, 0.07, 0.12],
      [0.5, 1.2, 0.47, 0.76, 0.43, 0.3, 0.38, -0.2],
    ],
  },
  "1": { w: 0.5, s: [[0.06, 0.74, 0.18, 0.82, 0.3, 0.92, 0.42, 1.02, 0.4, 0.67, 0.37, 0.33, 0.33, -0.01]] },
  "5": {
    w: 0.78,
    jout: true,
    fl: [1],
    s: [
      [0.26, 1.0, 0.24, 0.84, 0.21, 0.69, 0.18, 0.55, 0.4, 0.67, 0.76, 0.62, 0.76, 0.32, 0.76, 0.03, 0.38, -0.08, 0.07, 0.1],
      [0.24, 1.0, 0.42, 1.02, 0.62, 1.04, 0.86, 1.08],
    ],
  },
  "0": {
    w: 0.74,
    jin: true,
    jout: true,
    fl: [0],
    s: [[0.5, 0.98, 0.22, 1.0, 0.06, 0.68, 0.06, 0.46, 0.06, 0.16, 0.22, -0.02, 0.4, -0.01, 0.6, 0.0, 0.74, 0.26, 0.74, 0.52, 0.74, 0.8, 0.64, 0.99, 0.46, 1.0, 0.36, 1.0, 0.36, 0.92, 0.46, 0.92, 0.58, 0.92, 0.7, 0.96, 0.82, 0.98]],
  },
  N: { w: 0.86, s: [[0.04, 0.02, 0.06, 0.36, 0.08, 0.7, 0.1, 1.0, 0.3, 0.66, 0.5, 0.33, 0.68, 0.0, 0.7, 0.33, 0.72, 0.68, 0.76, 1.0]] },
  o: { w: 0.62, jin: true, s: [[0.44, 0.52, 0.2, 0.58, 0.04, 0.38, 0.06, 0.2, 0.08, 0.02, 0.26, -0.02, 0.38, 0.0, 0.54, 0.03, 0.6, 0.18, 0.58, 0.34, 0.56, 0.5, 0.48, 0.56, 0.4, 0.52]] },
  ",": { w: 0.34, fl: [0], s: [[0.12, 0.08, 0.17, 0.04, 0.15, -0.1, 0.02, -0.24]] },
  n: { w: 0.64, jin: true, jout: true, s: [[0.02, 0.42, 0.05, 0.5, 0.07, 0.55, 0.08, 0.55, 0.07, 0.36, 0.06, 0.18, 0.05, 0.0, 0.08, 0.3, 0.2, 0.55, 0.36, 0.55, 0.52, 0.55, 0.56, 0.4, 0.56, 0.26, 0.56, 0.14, 0.56, 0.05, 0.64, 0.0]] },
  e: { w: 0.56, jin: true, jout: true, s: [[0.04, 0.22, 0.24, 0.22, 0.5, 0.3, 0.5, 0.44, 0.5, 0.56, 0.36, 0.6, 0.24, 0.54, 0.08, 0.46, 0.02, 0.24, 0.12, 0.08, 0.22, -0.04, 0.42, -0.02, 0.56, 0.08]] },
  v: { w: 0.58, jin: true, jout: true, s: [[0.02, 0.54, 0.1, 0.36, 0.18, 0.18, 0.28, 0.0, 0.36, 0.18, 0.44, 0.36, 0.54, 0.55, 0.58, 0.58, 0.62, 0.56, 0.66, 0.52]] },
  r: { w: 0.52, jin: true, fl: [0], s: [[0.04, 0.55, 0.05, 0.36, 0.05, 0.18, 0.04, 0.0, 0.07, 0.26, 0.16, 0.48, 0.32, 0.54, 0.38, 0.56, 0.44, 0.54, 0.52, 0.5]] },
  " ": { w: 0.34, s: [] },
};

export type Notation = {
  text: string;
  colour: "grant" | "refuse";
  progress: number;
  weight?: number;
  /** baseline start on the paper (u, v), cm */
  at?: [number, number];
  /** cap height, cm */
  size?: number;
  slant?: number;
  /** baseline rise per cm of advance (+ = climbs) */
  rise?: number;
  underline?: 0 | 1 | 2;
  /** where the underline starts, as a fraction of the notation's width (default 0.05: under the whole notation) */
  ulFrom?: number;
  glow?: number;
  /** grant ink: the span of progress over which fresh ink is hotter (default 0.05; 0 = none, for a settled hold) */
  fresh?: number;
  /** V2: "pen" = the fountain-pen scrawl (GLYPHS_PEN, joined, thick-thin by nib angle and pressure, a wobbling
   *  baseline; defaults NOTATION_PEN_DEFAULT). Omitted = the original hand, unchanged. */
  hand?: "pen";
};
export const NOTATION_DEFAULT = { at: [1.9, 14.5] as [number, number], size: 2.95, slant: 0.2, rise: 0.03, weight: 1.15 };
/** V2: the pen hand's defaults: big and climbing, low on the sheet (under CUT1_STRIPS_V2's ask) */
export const NOTATION_PEN_DEFAULT = { at: [1.3, 15.1] as [number, number], size: 2.8, slant: 0.3, rise: 0.04, weight: 1.1 };
const defsOf = (n: Notation) => (n.hand === "pen" ? NOTATION_PEN_DEFAULT : NOTATION_DEFAULT);

type Seg = { pts: P2[]; ink: boolean; len: number; glyph: number; join?: boolean; flick?: boolean; contIn?: boolean; contOut?: boolean };
export type NotationLayout = { segs: Seg[]; total: number; glyphs: { ch: string; p0: number; p1: number }[]; underline: { p0: number; p1: number }[]; width: number };
const TRAVEL_COST = 0.45;

const bez = (a: P2, b: P2, c: P2, d: P2, t: number): P2 => {
  const m = 1 - t;
  return [m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0], m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]];
};
const sampleStroke = (s: number[], n = 14): P2[] => {
  const out: P2[] = [[s[0], s[1]]];
  for (let i = 2; i + 5 < s.length; i += 6) {
    const a: P2 = [s[i - 2], s[i - 1]];
    const b: P2 = [s[i], s[i + 1]];
    const c: P2 = [s[i + 2], s[i + 3]];
    const d: P2 = [s[i + 4], s[i + 5]];
    for (let k = 1; k <= n; k++) out.push(bez(a, b, c, d, k / n));
  }
  return out;
};
const plen = (q: P2[]) => {
  let L = 0;
  for (let i = 1; i < q.length; i++) L += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
  return L;
};

const LAYOUTS = new Map<string, NotationLayout>();
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return 2 * (x - Math.floor(x)) - 1;
};
const tangent = (q: P2[], atEnd: boolean): P2 => {
  const a = atEnd ? q[q.length - 2] : q[0];
  const b = atEnd ? q[q.length - 1] : q[1];
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
};
// the V2 pen layout: each glyph a touch bigger or smaller, turned and lifted off the line (a deterministic jitter),
// the baseline wobbling and climbing; links between joined glyphs are cubic hairlines leaving along the last stroke's
// exit and arriving along the next stroke's entry
const layoutPen = (n: Notation): NotationLayout => {
  const D = NOTATION_PEN_DEFAULT;
  const at = n.at ?? D.at;
  const H = n.size ?? D.size;
  const slant = n.slant ?? D.slant;
  const rise = n.rise ?? D.rise;
  const key = `pen|${n.text}|${at}|${H}|${slant}|${rise}|${n.underline ?? 0}|${n.ulFrom ?? 0.05}`;
  const hit = LAYOUTS.get(key);
  if (hit) return hit;
  const segs: Seg[] = [];
  const glyphMarks: { ch: string; s0: number; s1: number }[] = [];
  let x0 = 0;
  let prev: { end: P2; dir: P2; jout: boolean } | null = null;
  let gi = 0;
  const wob = (X: number) => 0.022 * Math.sin(1.7 * X + 0.6) + 0.012 * Math.sin(4.1 * X + 1.3);
  for (const ch of n.text) {
    const g = GLYPHS_PEN[ch] ?? GLYPHS_PEN[" "];
    const sg = 1 + 0.05 * hash(gi, 1);
    const rg = 2.6 * D2R * hash(gi, 2);
    const dy = 0.03 * hash(gi, 3);
    const cr = Math.cos(rg);
    const sr = Math.sin(rg);
    const toPaper = (gx: number, gy: number): P2 => {
      const lx = gx * sg - 0.4;
      const ly = gy * sg - 0.4;
      const rx = 0.4 + lx * cr - ly * sr;
      const ry = 0.4 + lx * sr + ly * cr;
      const X = x0 + (rx + slant * ry) * H;
      return [at[0] + X, at[1] - (ry + dy + wob(X / H)) * H - rise * X];
    };
    const s0 = segs.length;
    g.s.forEach((st, si) => {
      const pts = sampleStroke(st, 16).map((q) => toPaper(q[0], q[1]));
      if (prev) {
        const joined = si === 0 && !!g.jin && prev.jout;
        if (joined) {
          const a = prev.end;
          const b = pts[0];
          const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const tb = tangent(pts, false);
          const k = 0.4 * d;
          const link = sampleStroke([a[0], a[1], a[0] + prev.dir[0] * k, a[1] + prev.dir[1] * k, b[0] - tb[0] * k, b[1] - tb[1] * k, b[0], b[1]], 12);
          segs.push({ pts: link, ink: true, len: plen(link), glyph: gi, join: true });
        } else segs.push({ pts: [prev.end, pts[0]], ink: false, len: Math.hypot(pts[0][0] - prev.end[0], pts[0][1] - prev.end[1]), glyph: gi });
      }
      segs.push({ pts, ink: true, len: plen(pts), glyph: gi, flick: (g.fl ?? []).includes(si) });
      prev = { end: pts[pts.length - 1], dir: tangent(pts, true), jout: si === g.s.length - 1 && !!g.jout };
    });
    if (!g.s.length && prev) (prev as { jout: boolean }).jout = false;
    glyphMarks.push({ ch, s0, s1: segs.length });
    x0 += g.w * H * sg;
    gi++;
  }
  const width = x0;
  const ulMarks: { s0: number; s1: number }[] = [];
  for (let k = 0; k < (n.underline ?? 0); k++) {
    const y = -0.2 - 0.16 * k;
    const xs = (n.ulFrom ?? 0.05) * (width / H) + 0.1 * k;
    const xe = width / H + 0.02 - 0.3 * k;
    const st = [xs - 0.04, y + 0.1, xs - 0.02, y + 0.02, xs + 0.04, y - 0.02, xs + 0.14, y - 0.02, xs + 0.4, y - 0.02, xe - 0.5, y, xe, y + 0.12];
    const pts = sampleStroke(st, 30).map((q): P2 => [at[0] + q[0] * H, at[1] - q[1] * H - rise * q[0] * H]);
    const s0 = segs.length;
    if (prev) {
      const pe = (prev as { end: P2 }).end;
      segs.push({ pts: [pe, pts[0]], ink: false, len: Math.hypot(pts[0][0] - pe[0], pts[0][1] - pe[1]), glyph: -1 });
    }
    segs.push({ pts, ink: true, len: plen(pts), glyph: -1, flick: true });
    prev = { end: pts[pts.length - 1], dir: tangent(pts, true), jout: false };
    ulMarks.push({ s0, s1: segs.length });
  }
  segs.forEach((s, i) => {
    s.contIn = s.ink && i > 0 && segs[i - 1].ink;
    s.contOut = s.ink && i < segs.length - 1 && segs[i + 1].ink;
  });
  const cost = segs.map((s) => (s.ink ? s.len : TRAVEL_COST * s.len));
  const total = cost.reduce((a, b) => a + b, 0);
  const cum = [0];
  for (const c of cost) cum.push(cum[cum.length - 1] + c);
  const prog = (i: number) => cum[i] / total;
  const firstInk = (a: number, b: number) => {
    for (let i = a; i < b; i++) if (segs[i].ink && segs[i].pts.length > 2) return i;
    return a;
  };
  const out: NotationLayout = {
    segs,
    total,
    glyphs: glyphMarks.map((m) => ({ ch: m.ch, p0: prog(firstInk(m.s0, m.s1)), p1: prog(m.s1) })),
    underline: ulMarks.map((m) => ({ p0: prog(firstInk(m.s0, m.s1)), p1: prog(m.s1) })),
    width,
  };
  LAYOUTS.set(key, out);
  return out;
};
export const layoutNotation = (n: Notation): NotationLayout => {
  if (n.hand === "pen") return layoutPen(n);
  const at = n.at ?? NOTATION_DEFAULT.at;
  const H = n.size ?? NOTATION_DEFAULT.size;
  const slant = n.slant ?? NOTATION_DEFAULT.slant;
  const rise = n.rise ?? NOTATION_DEFAULT.rise;
  const key = `${n.text}|${at}|${H}|${slant}|${rise}|${n.underline ?? 0}|${n.ulFrom ?? 0.05}`;
  const hit = LAYOUTS.get(key);
  if (hit) return hit;
  const toPaper = (gx: number, gy: number, x0: number): P2 => {
    const x = x0 + (gx + slant * gy) * H;
    return [at[0] + x, at[1] - gy * H - rise * x];
  };
  const segs: Seg[] = [];
  const glyphMarks: { ch: string; s0: number; s1: number }[] = [];
  let x0 = 0;
  let prevEnd: P2 | null = null;
  let prevJoin = false;
  let gi = 0;
  for (const ch of n.text) {
    const g = GLYPHS[ch] ?? GLYPHS[" "];
    const s0 = segs.length;
    g.s.forEach((st, si) => {
      const pts = sampleStroke(st).map((q) => toPaper(q[0], q[1], x0));
      if (prevEnd) {
        // a join (lowercase letter after a lowercase letter, first stroke): the pen stays down and inks the link
        const joined = si === 0 && g.join && prevJoin;
        segs.push({ pts: [prevEnd, pts[0]], ink: !!joined, len: Math.hypot(pts[0][0] - prevEnd[0], pts[0][1] - prevEnd[1]), glyph: gi });
      }
      segs.push({ pts, ink: true, len: plen(pts), glyph: gi });
      prevEnd = pts[pts.length - 1];
    });
    if (g.s.length) prevJoin = !!g.join;
    else prevJoin = false;
    glyphMarks.push({ ch, s0, s1: segs.length });
    x0 += g.w * H;
    gi++;
  }
  const width = x0;
  const ulMarks: { s0: number; s1: number }[] = [];
  for (let k = 0; k < (n.underline ?? 0); k++) {
    const y = -0.2 - 0.17 * k;
    const xs = (n.ulFrom ?? 0.05) * (width / H) + 0.06 * k;
    const xe = width / H - 0.05 - 0.25 * k;
    const st = [xs, y, xs + (xe - xs) * 0.35, y - 0.05, xe - 0.3, y - 0.04, xe, y + 0.09 - 0.03 * k];
    const pts = sampleStroke(st, 30).map((q) => toPaper(q[0] - slant * q[1], q[1], 0));
    const s0 = segs.length;
    if (prevEnd) segs.push({ pts: [prevEnd, pts[0]], ink: false, len: Math.hypot(pts[0][0] - (prevEnd as P2)[0], pts[0][1] - (prevEnd as P2)[1]), glyph: -1 });
    segs.push({ pts, ink: true, len: plen(pts), glyph: -1 });
    prevEnd = pts[pts.length - 1];
    ulMarks.push({ s0, s1: segs.length });
  }
  // the "time" of each segment: ink at its length, travel cheaper
  const cost = segs.map((s) => (s.ink ? s.len : TRAVEL_COST * s.len));
  const total = cost.reduce((a, b) => a + b, 0);
  const cum = [0];
  for (const c of cost) cum.push(cum[cum.length - 1] + c);
  const prog = (i: number) => cum[i] / total;
  // a glyph's marks: its first INK segment's start .. its last segment's end (the travel to it belongs before it)
  const firstInk = (a: number, b: number) => {
    for (let i = a; i < b; i++) if (segs[i].ink && segs[i].pts.length > 2) return i;
    return a;
  };
  const out: NotationLayout = {
    segs,
    total,
    glyphs: glyphMarks.map((m) => ({ ch: m.ch, p0: prog(firstInk(m.s0, m.s1)), p1: prog(m.s1) })),
    underline: ulMarks.map((m) => ({ p0: prog(firstInk(m.s0, m.s1)), p1: prog(m.s1) })),
    width,
  };
  LAYOUTS.set(key, out);
  return out;
};

export type Ribbon = { pts: P2[]; w: number[]; age: number[] };
/** the notation written up to `progress`: inked ribbons (paper uv, width cm per point, age = progress since laid),
 *  the stroke front (tip), whether the pen is down, and its height while it travels */
export const writeNotation = (n: Notation, progress = n.progress) => {
  const L = layoutNotation(n);
  const pen = n.hand === "pen";
  const H = n.size ?? defsOf(n).size;
  const wt = n.weight ?? (pen ? NOTATION_PEN_DEFAULT.weight : 1);
  const target = c01(progress) * L.total;
  const ink: Ribbon[] = [];
  let acc = 0;
  let tip: P2 = L.segs[0]?.pts[0] ?? [0, 0];
  let down = false;
  let h = 0.5;
  const nib = 35 * D2R;
  const widthAt = (a: P2, b: P2) => {
    const th = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
    return wt * H * (0.074 + 0.05 * Math.abs(Math.sin(th - nib)));
  };
  // the pen hand: a broad-ish nib held at 32° (hairlines up-right, full width across it) plus pressure on the
  // downstrokes; links thin in their middle
  const penNib = 32 * D2R;
  const penWidth = (a: P2, b: P2) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    const th = Math.atan2(-dy, dx);
    return wt * H * (0.024 + 0.096 * Math.abs(Math.sin(th - penNib)) + 0.032 * c01(dy / d));
  };
  let cur: Ribbon | null = null;
  if (target <= 0) return { ink, tip, down: false, h };
  for (let si = 0; si < L.segs.length; si++) {
    const s = L.segs[si];
    const c = s.ink ? s.len : TRAVEL_COST * s.len;
    if (acc >= target && si > 0) break;
    const local = c > 0 ? c01((target - acc) / c) : 1;
    // walk the polyline to `local` of its length
    const want = local * s.len;
    let run = 0;
    const pts: P2[] = [s.pts[0]];
    const ws: number[] = [];
    const ages: number[] = [];
    for (let i = 1; i < s.pts.length; i++) {
      const a = s.pts[i - 1];
      const b = s.pts[i];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (run + d >= want) {
        const t = d > 0 ? (want - run) / d : 1;
        pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
        run = want;
        break;
      }
      pts.push(b);
      run += d;
    }
    tip = pts[pts.length - 1];
    if (s.ink) {
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(pts.length - 1, i + 1)];
        // taper the very start and end of a stroke a little (the nib's touch and lift)
        const along = i / Math.max(1, pts.length - 1);
        const fullLen = s.len;
        const dist0 = along * run;
        const dist1 = fullLen - dist0;
        if (pen) {
          // tapers from the whole stroke (not the drawn part), so nothing changes width when a stroke completes
          const tIn = s.contIn ? 1 : 0.72 + 0.28 * smoothstep(0, 0.3, dist0);
          const tOut = s.contOut ? 1 : s.flick ? 0.2 + 0.8 * smoothstep(0, 1.1, dist1) : 0.6 + 0.4 * smoothstep(0, 0.3, dist1);
          const tj = s.join ? 1 - 0.5 * Math.sin(Math.PI * c01(dist0 / Math.max(0.01, fullLen))) : 1;
          ws.push(penWidth(a, b) * tIn * tOut * tj);
        } else {
          const taper = 0.62 + 0.38 * smoothstep(0, 0.45, Math.min(dist0, dist1 + (local < 1 ? 9 : 0)));
          ws.push(widthAt(a, b) * taper);
        }
        const laid = (acc + (s.ink ? dist0 : 0)) / L.total;
        ages.push(c01(progress) - laid);
      }
      if (cur && pts.length > 1) {
        // continue the previous ribbon (a joined stroke)
        cur.pts.push(...pts.slice(1));
        cur.w.push(...ws.slice(1));
        cur.age.push(...ages.slice(1));
      } else {
        cur = { pts, w: ws, age: ages };
        ink.push(cur);
      }
      down = local < 1 || si === L.segs.length - 1 ? true : !!L.segs[si + 1]?.ink;
      h = 0;
    } else {
      cur = null;
      down = false;
      // the pen arcs up between strokes
      h = 0.25 + 0.6 * Math.sin(Math.PI * local) * Math.min(1, s.len / 4);
    }
    acc += c;
    if (local < 1) break;
  }
  if (c01(progress) >= 1) {
    down = false;
    h = 0;
  }
  return { ink, tip, down, h };
};

/** the pen tip in the world for a notation on a telegram at a progress */
export const nibOnPaper = (pose: TelegramPose, n: Notation, progress = n.progress): V3 => {
  const w = writeNotation(n, progress);
  return telegramPoint(pose, w.tip[0], w.tip[1], w.h);
};

/** cut 1's verdict, finished */
export const CUT1_NOTATION: Notation = { text: "OK $1500", colour: "grant", progress: 1, underline: 1, ulFrom: 0.36, glow: 1, fresh: 0 };
/** V2: cut 1's verdict in the pen hand, finished */
export const CUT1_NOTATION_V2: Notation = { text: "OK $1500", colour: "grant", progress: 1, underline: 1, ulFrom: 0.4, glow: 1, fresh: 0, hand: "pen" };
/** V2 names for the pen hand (the same functions; they force hand "pen") */
export const layoutNotationPen = (n: Notation) => layoutNotation({ ...n, hand: "pen" });
export const writeNotationPen = (n: Notation, progress = n.progress) => writeNotation({ ...n, hand: "pen" }, progress);
export const nibOnPaperPen = (pose: TelegramPose, n: Notation, progress = n.progress) => nibOnPaper(pose, { ...n, hand: "pen" }, progress);

// ribbons -> one filled outline per ribbon (screen), the width offset on the paper surface
const ribbonPath = (pose: TelegramPose, r: Ribbon, P: (q: V3) => P2) => {
  const n = r.pts.length;
  if (n < 2) return "";
  const L: P2[] = [];
  const R: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = r.pts[Math.max(0, i - 1)];
    const b = r.pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const hw = r.w[i] / 2;
    const q = r.pts[i];
    L.push(P(telegramPoint(pose, q[0] - dy * hw, q[1] + dx * hw)));
    R.push(P(telegramPoint(pose, q[0] + dy * hw, q[1] - dx * hw)));
  }
  // round caps: a few points around each end
  const cap = (q: P2, hw: number, dir: P2, sgn: number) => {
    const out: P2[] = [];
    for (let k = 1; k < 6; k++) {
      const a = (k / 6) * Math.PI;
      const nx = -dir[1];
      const ny = dir[0];
      const cx = Math.cos(a);
      const sx = Math.sin(a);
      out.push(P(telegramPoint(pose, q[0] + (nx * cx + dir[0] * sx * sgn) * hw, q[1] + (ny * cx + dir[1] * sx * sgn) * hw)));
    }
    return out;
  };
  const dirOf = (i: number, j: number): P2 => {
    const dx = r.pts[j][0] - r.pts[i][0];
    const dy = r.pts[j][1] - r.pts[i][1];
    const d = Math.hypot(dx, dy) || 1;
    return [dx / d, dy / d];
  };
  const endCap = cap(r.pts[n - 1], r.w[n - 1] / 2, dirOf(n - 2, n - 1), 1);
  const startCap = cap(r.pts[0], r.w[0] / 2, dirOf(1, 0), 1);
  // L runs forward, the end cap from L's side round to R's side, R backward, the start cap round back to L
  const outline = [...L, ...endCap, ...R.reverse(), ...startCap];
  return polyD(outline);
};

export const NotationInk: React.FC<{ V: DeskView; pose: TelegramPose; n: Notation; uid: string; dim?: number }> = ({ V, pose, n, uid, dim = 0 }) => {
  const w = writeNotation(n);
  if (!w.ink.length) return null;
  const grant = n.colour === "grant";
  const glow = grant ? (n.glow ?? 1) * (1 - dim) : 0;
  const base = grant ? INK_GRANT : mixHex(INK_REFUSE, DEAD, 0.25 * dim);
  const paths = w.ink.map((r) => ribbonPath(pose, r, V.p)).join("");
  // the freshly laid ink is hotter for a moment (age in progress units, ~6 frames of a cut's writing)
  const hot: React.ReactNode[] = [];
  const fresh = n.fresh ?? 0.05;
  if (grant && fresh > 0.001) {
    w.ink.forEach((r, ri) => {
      const idx = r.age.findIndex((a) => a < fresh);
      if (idx < 0) return;
      const sub: Ribbon = { pts: r.pts.slice(Math.max(0, idx - 1)), w: r.w.slice(Math.max(0, idx - 1)).map((x) => x * 0.8), age: r.age.slice(Math.max(0, idx - 1)) };
      if (sub.pts.length > 1) hot.push(<path key={ri} d={ribbonPath(pose, sub, V.p)} fill={INK_GRANT_HOT} opacity={0.55 * Math.min(1, fresh / 0.05)} />);
    });
  }
  const sc = V.s(telegramPoint(pose, TG_W / 2, 12));
  return (
    <g>
      {glow > 0 ? (
        <>
          <defs>
            <filter id={`${uid}-gl`} x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation={n2(0.32 * sc)} />
            </filter>
          </defs>
          <path d={paths} fill={INK_GRANT} opacity={0.42 * glow} filter={`url(#${uid}-gl)`} />
        </>
      ) : null}
      {/* a darker edge under the ink (it soaked into the paper) */}
      <path d={paths} fill="none" stroke={grant ? "#C77F0A" : INK_REFUSE} strokeWidth={grant ? 0.9 : 0.5} strokeOpacity={grant ? 0.5 : 0.4} strokeLinejoin="round" />
      <path d={paths} fill={base} />
      {hot}
    </g>
  );
};

/** the telegram: a 1940 Western Union blank on the desk */
export const Telegram: React.FC<{ V: DeskView; pose: TelegramPose; strips: Strip[]; notation?: Notation | Notation[]; dim?: number; uid: string; shadow?: number }> = ({
  V,
  pose,
  strips,
  notation,
  dim = 0,
  uid,
  shadow = 1,
}) => {
  const P = V.p;
  const N = 14;
  const edge: P2[] = [];
  for (let i = 0; i <= N; i++) edge.push(P(telegramPoint(pose, (TG_W * i) / N, 0)));
  for (let i = 1; i <= N; i++) edge.push(P(telegramPoint(pose, TG_W, (TG_H * i) / N)));
  for (let i = 1; i <= N; i++) edge.push(P(telegramPoint(pose, TG_W - (TG_W * i) / N, TG_H)));
  for (let i = 1; i < N; i++) edge.push(P(telegramPoint(pose, 0, TG_H - (TG_H * i) / N)));
  const outline = polyD(edge);
  const centre = telegramPoint(pose, TG_W / 2, TG_H / 2);
  // the lamp's falloff across the sheet: the pool's light at the paper, plus a lit-to-shade gradient (upper left lit)
  const light = poolLight(centre[0], centre[2]);
  const deadMix = 0.75 * dim;
  const paperLit = mixHex(mixHex(CREAM, "#FFF7E8", 0.25), DEAD, deadMix);
  const paperLo = mixHex(mixHex(CREAM_LO, "#A99B80", 0.35), mixHex(DEAD, PAL.shadow, 0.25), deadMix);
  const pool = planeEllipse(V, POOL.X, POOL.Z, POOL.rx * 0.95, POOL.rz * 0.95, pose.lift);
  const pUL = P(telegramPoint(pose, 0, 0));
  const pLR = P(telegramPoint(pose, TG_W, TG_H));
  // its contact shadow on the desk: offset away from the lamp, softer and further as it lifts
  const sh = shadow * (0.85 - 0.35 * c01(pose.lift / 0.8));
  const shOff = 0.5 + 1.6 * pose.lift;
  const shC: V3 = [centre[0] + shOff * 0.9, 0.2, centre[2] - shOff * 0.55];
  const shadowQuad: P2[] = [];
  const r = pose.rot * D2R;
  const sx = (TG_W / 2 + 0.3 + pose.lift) * 1;
  const sz = (TG_H / 2 + 0.3 + pose.lift) * 1;
  for (const [cx, cz] of [
    [-sx, -sz],
    [sx, -sz],
    [sx, sz],
    [-sx, sz],
  ] as const) {
    shadowQuad.push(P([shC[0] + cx * Math.cos(r) - cz * Math.sin(r), 0.2, shC[2] + cx * Math.sin(r) + cz * Math.cos(r)]));
  }
  const scC = V.s(centre);
  const typeInk = mixHex(TYPE_INK, mixHex(DEAD, PAL.shadow, 0.2), 0.6 * dim);
  const typeOp = 1 - 0.72 * dim;
  // per-word text: each word an affine from the surface's local frame (font in hundredths of a cm)
  const K = 100;
  const words: React.ReactNode[] = [];
  const stripEls: React.ReactNode[] = [];
  strips.forEach((s, si) => {
    const size = s.size ?? 0.9;
    const adv = 0.6 * size; // Special Elite's advance ~0.6 em
    const sw = s.text.length * adv + 0.5 * size;
    const sh2 = size * 1.35;
    const rr = (s.rot ?? 0) * D2R;
    const su = s.u - 0.25 * size;
    const sv = s.v - sh2 * 0.78;
    // the strip (gummed tape): slightly whiter, a hairline edge, a hint of a lifted shadow
    const corner = (du: number, dv: number): P2 => {
      const cu = su + du * Math.cos(rr) - dv * Math.sin(rr);
      const cv = sv + du * Math.sin(rr) + dv * Math.cos(rr);
      return P(telegramPoint(pose, cu, cv, 0.01));
    };
    const q: P2[] = [corner(0, 0), corner(sw, 0), corner(sw, sh2), corner(0, sh2)];
    const qs: P2[] = q.map((p) => [p[0] + 0.05 * scC, p[1] + 0.06 * scC]);
    stripEls.push(<path key={`ss${si}`} d={polyD(qs)} fill={PAL.shadow} opacity={0.12 * (1 - dim)} />);
    stripEls.push(<path key={`s${si}`} d={polyD(q)} fill={mixHex("#F8F2E6", DEAD, deadMix)} stroke={mixHex("#CDBFA4", DEAD, deadMix)} strokeWidth={0.6} opacity={0.95} />);
    // the words
    let col = 0;
    s.text.split(" ").forEach((wd, wi) => {
      if (wd.length) {
        const dc = col * adv;
        const m = paperMatrix(pose, V, s.u + dc * Math.cos(rr), s.v + dc * Math.sin(rr), rr, K);
        const isBold = s.bold === wd;
        if (s.smudge) {
          words.push(
            <text key={`w${si}-${wi}`} transform={m} fontFamily={ELITE} fontSize={size * K} fill={typeInk} opacity={0.3 * typeOp} style={{ filter: `blur(${n2(0.07 * scC)}px)` }} letterSpacing={-0.04 * size * K}>
              {wd}
            </text>,
          );
        } else {
          words.push(
            <text key={`w${si}-${wi}`} transform={m} fontFamily={ELITE} fontSize={size * K} fill={typeInk} opacity={(isBold ? 1 : 0.88) * typeOp} stroke={isBold ? typeInk : "none"} strokeWidth={isBold ? 0.045 * size * K : 0} strokeOpacity={typeOp}>
              {wd}
            </text>,
          );
        }
      }
      col += wd.length + 1;
    });
  });
  // the Western Union header: the name in heavy condensed type, fine print as illegible lines, a rule
  const hm = paperMatrix(pose, V, 1.1, 2.15, 0, K);
  const fine: React.ReactNode[] = [];
  const fineLine = (u0: number, u1: number, v: number, k: string, wgt = 0.11) => {
    fine.push(<path key={k} d={lineD([P(telegramPoint(pose, u0, v)), P(telegramPoint(pose, u1, v))])} stroke={typeInk} strokeOpacity={0.32 * typeOp} strokeWidth={wgt * scC} strokeDasharray={`${n2(0.5 * scC)} ${n2(0.09 * scC)} ${n2(0.28 * scC)} ${n2(0.09 * scC)}`} />);
  };
  for (let i = 0; i < 4; i++) fineLine(12.6, 19.9 - (i === 3 ? 2.4 : 0), 0.9 + i * 0.42, `f${i}`);
  fineLine(1.1, 7.6, 2.75, "fs", 0.09);
  const rule = (v: number, wgt: number, k: string) =>
    fine.push(<path key={k} d={lineD([P(telegramPoint(pose, 0.8, v)), P(telegramPoint(pose, TG_W - 0.8, v))])} stroke={typeInk} strokeOpacity={0.7 * typeOp} strokeWidth={wgt * scC} />);
  rule(3.05, 0.06, "r1");
  rule(3.18, 0.025, "r2");
  // the form's printed bottom line
  rule(TG_H - 0.75, 0.02, "r3");
  fineLine(1.2, 12.5, TG_H - 0.42, "fb", 0.07);
  const notes = notation ? (Array.isArray(notation) ? notation : [notation]) : [];
  return (
    <g>
      <defs>
        <filter id={`${uid}-shf`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={n2((0.35 + 0.9 * pose.lift) * V.s(shC))} />
        </filter>
        <linearGradient id={`${uid}-lit`} gradientUnits="userSpaceOnUse" x1={n2(pUL[0])} y1={n2(pUL[1])} x2={n2(pLR[0])} y2={n2(pLR[1])}>
          <stop offset="0" stopColor={paperLit} />
          <stop offset="0.55" stopColor={mixHex(paperLit, paperLo, 0.35)} />
          <stop offset="1" stopColor={paperLo} />
        </linearGradient>
        <radialGradient id={`${uid}-pool`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={pool}>
          <stop offset="0" stopColor="#FFF8EA" stopOpacity={0.55 * (1 - dim)} />
          <stop offset="0.5" stopColor="#FFF8EA" stopOpacity={0.2 * (1 - dim)} />
          <stop offset="1" stopColor="#FFF8EA" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <path d={outline} />
        </clipPath>
      </defs>
      {sh > 0.01 ? <path d={polyD(shadowQuad)} fill={PAL.shadow} opacity={sh} filter={`url(#${uid}-shf)`} /> : null}
      <path d={outline} fill={`url(#${uid}-lit)`} />
      <path d={outline} fill={`url(#${uid}-pool)`} />
      {/* the far air takes a paper out of the light a little (fog by distance, rarely visible at the desk) */}
      <path d={outline} fill={V.tone(PAL.shadow, centre)} opacity={0.25 * (1 - light) * (1 - dim)} />
      <g clipPath={`url(#${uid}-clip)`}>
        <text transform={hm} fontFamily={BARLOW_C} fontWeight={700} fontSize={1.45 * K} fill={typeInk} opacity={0.86 * typeOp} letterSpacing={0.06 * K}>
          WESTERN UNION
        </text>
        {fine}
        {stripEls}
        {words}
        {notes.map((n, i) => (
          <NotationInk key={i} V={V} pose={pose} n={n} uid={`${uid}-n${i}`} dim={dim} />
        ))}
      </g>
      {/* the edge: a hairline in a darker cream, a faint cream rim on the lit (top / left) edges */}
      <path d={outline} fill="none" stroke={mixHex(CREAM_LO, PAL.shadow, 0.35)} strokeWidth={0.8} strokeOpacity={0.7} />
      <path d={lineD(edge.slice(0, N + 1))} fill="none" stroke="#FFFBF2" strokeWidth={1.1} strokeOpacity={0.5 * (1 - dim)} />
      {dim > 0 ? <path d={outline} fill={V.tone(mixHex(DEAD, PAL.shadow, 0.3), centre)} opacity={0.35 * dim} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE DONE TRAY
// ===================================================================================================================
export type DoneItem = { strips: Strip[]; notation: Notation; du?: number; dv?: number; rot?: number };
/** the pose of the i-th paper lying in the tray (0 = the bottom) */
export const trayPose = (i: number, du = 0, dv = 0, rot = 0): TelegramPose => ({
  X: (TRAY.X0 + TRAY.X1) / 2 + 0.4 + du + 0.5 * Math.sin(i * 2.1),
  Z: (TRAY.Z0 + TRAY.Z1) / 2 + dv + 0.3 * Math.cos(i * 1.7),
  rot: -1.5 + rot + 2.2 * Math.sin(i * 1.3 + 0.4),
  lift: TRAY.floor + 0.1 * i,
  curl: 0.4,
});
/** cut 1's granted telegram lying in the tray (cut 2 opens with it there) */
export const DONE_STACK_CUT1: DoneItem[] = [{ strips: CUT1_STRIPS, notation: CUT1_NOTATION }];
/** V2: cut 1's telegram as rev 2 leaves it (V2 strips, the pen notation) */
export const DONE_STACK_CUT1_V2: DoneItem[] = [{ strips: CUT1_STRIPS_V2, notation: CUT1_NOTATION_V2 }];

export const DoneTray: React.FC<{ V: DeskView; items?: DoneItem[]; uid: string; extra?: React.ReactNode }> = ({ V, items = [], uid, extra }) => {
  const T = TRAY;
  const w = 1.1;
  const mat = WOOD;
  return (
    <g>
      <PlaneShadow V={V} X={(T.X0 + T.X1) / 2 + 1.2} Z={(T.Z0 + T.Z1) / 2 - 1} rx={(T.X1 - T.X0) / 2 + 1.5} rz={(T.Z1 - T.Z0) / 2 + 1.5} amt={0.55} uid={`${uid}-s`} />
      {/* the floor, the back and left walls (their inner faces), the papers, then the right and front walls over them */}
      <path d={polyD(quadY(V, T.X0, T.X1, T.Z0, T.Z1, T.floor, 4))} fill={V.tone(mixHex(WOOD.mid, WOOD.dark, 0.3), [T.X0, 0, T.Z0])} />
      <DeskBox V={V} X0={T.X0} X1={T.X1} Y0={0} Y1={T.H} Z0={T.Z1 - w} Z1={T.Z1} mat={mat} uid={`${uid}-bw`} lw={0.8} />
      <DeskBox V={V} X0={T.X0} X1={T.X0 + w} Y0={0} Y1={T.H} Z0={T.Z0} Z1={T.Z1} mat={mat} uid={`${uid}-lw`} lw={0.8} />
      {items.map((it, i) => (
        <Telegram key={i} V={V} pose={trayPose(i, it.du, it.dv, it.rot)} strips={it.strips} notation={it.notation} uid={`${uid}-t${i}`} shadow={0.5} />
      ))}
      {extra}
      {/* the front and right walls over the contents */}
      <DeskBox V={V} X0={T.X1 - w} X1={T.X1} Y0={0} Y1={T.H} Z0={T.Z0} Z1={T.Z1} mat={mat} uid={`${uid}-rw`} lw={0.8} />
      <DeskBox V={V} X0={T.X0} X1={T.X1} Y0={0} Y1={T.H} Z0={T.Z0} Z1={T.Z0 + w} mat={mat} uid={`${uid}-fw`} lw={0.8} />
    </g>
  );
};

// ===================================================================================================================
// THE PEN HAND (gouache: the folk cast's paint; a mitten with a thumb lobe, a white shirt cuff, a dark suit sleeve)
// ===================================================================================================================
/** the writer's elbow (world): off frame right, a little behind the paper (the arm comes in from the right) */
export const ELBOW: V3 = [44, 9, 22];
const PEN_LEN = 12.5;
/** the pen's direction from the nib up to the hand when the hand is still (up, to the right, a little away) */
export const PEN_REST_DIR: V3 = norm3([2.7, 2.1, -0.2]);
/** V2: the arm comes from the lower right (the writer sits on the near side): the elbow near the desk's front edge,
 *  the pen near level on screen, just above the arm's line (on the thumb's side, so it never pokes out under the
 *  cuff), the hand and sleeve low, under the typed lines */
export const ELBOW_V2: V3 = [38, 6, 4];
export const PEN_REST_DIR_V2: V3 = norm3([2.3, 2.3, -1.6]);
/** V2: a shorter pen (its top end clears the typed lines) */
export const PEN_LEN_V2 = 10.5;
const GRIP_DIST = 3.1;
/** the hand at a picture-book size (1 = real) */
const HAND_SCALE = 0.82;
const SKIN = "#EDC29B";
const SKIN_LO = "#C99572";
const CUFF = "#F4EEE2";
const SUIT = "#3A3D46";
const PEN_BODY = "#3A332E";
const PEN_BAND = BRASS.mid;
const NIB = "#CFC8B6";

/** the hand anchor: the nib's recent path smoothed (the hand lags the fingers by `lag` frames; ~0 while it travels
 *  with the pen, ~2 while writing) */
export const handGrip = (nibAt: (f: number) => V3, f: number, lag = 2): V3 => {
  let acc: V3 = [0, 0, 0];
  let wsum = 0;
  for (let k = 0; k <= 16; k++) {
    const tau = (k / 16) * lag * 2.2;
    const w = Math.exp(-tau / lag);
    acc = add3(acc, mul3(nibAt(f - tau), w));
    wsum += w;
  }
  return mul3(acc, 1 / wsum);
};

/** V2: handGrip with the hand's lag offset capped at `maxOff` cm (default 0.9): the pen stays within ~16° of its rest
 *  angle through fast pen-up travels between glyphs (handGrip alone lets it swing under the cuff) */
export const handGripV2 = (nibAt: (f: number) => V3, f: number, lag = 1, maxOff = 0.9): V3 => {
  const n = nibAt(f);
  const g = handGrip(nibAt, f, lag);
  const d = sub3(g, n);
  const L = len3(d);
  return L > maxOff ? add3(n, mul3(d, maxOff / L)) : g;
};

// the hand in its own frame (cm): origin at the fingertips' pinch on the pen, +x toward the wrist, +y the hand's
// near side (screen down); the pen leaves the pinch toward -x / +y (to the nib) and its top end runs out over the
// thumb's web toward +x / -y
const handShapes = (ink?: { skin: string; skinLo: string; cuff: string; suit: string }) => {
  const k = ink ?? { skin: SKIN, skinLo: SKIN_LO, cuff: CUFF, suit: SUIT };
  // millimetres (the paint's crescent offset and blur suit figure units of this size)
  const sh: Paint.Shape[] = [
    // the dark suit sleeve, widening toward the elbow off frame
    { d: "M70,-23 C140,-28 260,-33 420,-38 L420,50 C260,45 140,38 72,31 C66,12 66,-6 70,-23 Z", fill: k.suit, sh: 1 },
    { d: "M96,18 C150,22 230,26 410,30", fill: k.suit, det: 1.3, op: 0.45 },
    { d: "M74,-21 C150,-26 260,-31 410,-36", fill: mixHex(k.suit, CREAM, 0.35), det: 1.4, keep: true, op: 0.5 },
    // the white shirt cuff and its link
    { d: "M59,-19 C65,-21.5 73,-21.5 77,-19.5 C79.5,-6 79.5,14 77,28.5 C72,30.5 64,30.5 59,28.5 C56,14 56,-6 59,-19 Z", fill: k.cuff, sh: 0.8 },
    { d: "M65.5,4 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0", fill: "#7A7464", sh: 0 },
    // the back of the hand (a mitten over the curled fingers), narrowing into the wrist
    { d: "M-3,5 C-5,-5 1,-13 13,-14.5 C27,-16 45,-14 61,-11 C63.5,0 63.5,12 61,21 C46,24 28,27.5 13,26.5 C3,25.5 -2,16 -3,5 Z", fill: k.skin, sh: 1 },
    // the curl of the fingers under it (a soft fold) and a knuckle crease
    { d: "M5,23 C1,17 0,9 2,2", fill: k.skinLo, det: 1.3, keep: true, op: 0.6 },
    { d: "M20,-9 C21,0 21,10 19,20", fill: k.skinLo, det: 1.1, keep: true, op: 0.35 },
    // the index finger curled over the pen to the pinch
    { d: "M-4,1 C-5,-4 -2,-8 4,-9 C12,-10.5 20,-10 27,-8 C28,-5 27,-2 25,-1 C17,-1 8,0 1,3.5 C-2,4.5 -3.5,3.5 -4,1 Z", fill: k.skin, sh: 0.7 },
    // the thumb on the far side, pressing the pen (a notch between it and the hand)
    { d: "M3,-7 C6,-14 16,-21 30,-24 C40,-26 48,-22 47,-15 C46,-12 40,-11.5 30,-11 C20,-10 10,-6.5 6,-4 C3.5,-3 2,-5 3,-7 Z", fill: k.skin, sh: 0.8 },
  ];
  return sh;
};

export const PenHand: React.FC<{ V: DeskView; nib: V3; grip: V3; uid: string; ink?: "grant" | "refuse"; opacity?: number; elbow?: V3; restDir?: V3; penLen?: number }> = ({
  V,
  nib,
  grip,
  uid,
  ink = "grant",
  opacity = 1,
  elbow = ELBOW,
  restDir = PEN_REST_DIR,
  penLen = PEN_LEN,
}) => {
  const P = V.p;
  // the hand sits at the lagging anchor `grip`: its pinch is GRIP_DIST up the pen's rest direction from it; the pen
  // runs from the real nib through the pinch (so the pen tilts as the fingers draw the letters, the hand stays calm)
  const pinch = add3(grip, mul3(restDir, GRIP_DIST));
  const dir = norm3(sub3(pinch, nib));
  const top = add3(nib, mul3(dir, penLen));
  const pn = P(nib);
  const pp = P(pinch);
  const pt = P(top);
  const sc = V.s(pinch);
  // the hand's frame on screen: +x toward the elbow's projection
  const pe = P(elbow);
  const ang = Math.atan2(pe[1] - pp[1], pe[0] - pp[0]);
  const angD = (ang * 180) / Math.PI;
  // the pen barrel as a tapered quad (screen), the nib a small tapered tip
  const barrel = (a: P2, b: P2, w0: number, w1: number) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d;
    const ny = dx / d;
    return polyD([
      [a[0] + nx * w0, a[1] + ny * w0],
      [b[0] + nx * w1, b[1] + ny * w1],
      [b[0] - nx * w1, b[1] - ny * w1],
      [a[0] - nx * w0, a[1] - ny * w0],
    ]);
  };
  const along = (t: number): P2 => {
    const q = P(add3(nib, mul3(dir, t)));
    return q;
  };
  const nibEnd = along(1.7);
  const bandA = along(9.3);
  const bandB = along(9.9);
  // shadows from the lamp onto the paper plane (Y ~ 0.1): the pen's line and the hand's blob
  const shadowOf = (q: V3): V3 => {
    const L = LAMP_BULB;
    const t = (L[1] - 0.1) / Math.max(0.01, L[1] - q[1]);
    return [L[0] + (q[0] - L[0]) * t, 0.1, L[2] + (q[2] - L[2]) * t];
  };
  const sN = P(shadowOf(nib));
  const sT = P(shadowOf(top));
  const handC: V3 = add3(pinch, [3.2, -0.6, -0.9]);
  const sH = shadowOf(handC);
  const shAmt = 0.5;
  const tipLift = c01(nib[1] / 1.5);
  const wet = ink === "grant" ? INK_GRANT : INK_REFUSE;
  const k = sc;
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={`${uid}-hs`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={n2(0.55 * k)} />
        </filter>
      </defs>
      {/* the shadows on the paper */}
      <path d={`M${Pt(sN)}L${Pt(sT)}`} stroke={PAL.shadow} strokeOpacity={shAmt * (0.9 - 0.4 * tipLift)} strokeWidth={0.7 * k} strokeLinecap="round" filter={`url(#${uid}-hs)`} />
      <PlaneShadow V={V} X={sH[0] + 1} Z={sH[2] - 0.6} rx={5.2 + 0.25 * handC[1]} rz={3.4 + 0.2 * handC[1]} y={0.1} amt={0.42 * (1 - 0.55 * c01(handC[1] / 9))} uid={`${uid}-hb`} />
      {/* the pen */}
      <path d={barrel(nibEnd, pt, 0.42 * k, 0.5 * k)} fill={PEN_BODY} />
      <path d={barrel(bandA, bandB, 0.52 * k, 0.52 * k)} fill={PEN_BAND} />
      <path d={`M${Pt(nibEnd)}L${Pt(pt)}`} stroke={CREAM} strokeOpacity={0.35} strokeWidth={0.1 * k} transform={`translate(${n2(-0.16 * k)} ${n2(-0.2 * k)})`} />
      <path d={barrel(pn, nibEnd, 0.06 * k, 0.4 * k)} fill={NIB} />
      <path d={`M${Pt(pn)}L${Pt(nibEnd)}`} stroke={mixHex(NIB, PAL.shadow, 0.5)} strokeWidth={0.05 * k} />
      {tipLift < 0.5 ? <circle cx={pn[0]} cy={pn[1]} r={0.1 * k} fill={wet} opacity={0.9 * (1 - 2 * tipLift)} /> : null}
      {/* the hand (gouache), rotated into the arm's direction about the pinch */}
      <g transform={`rotate(${angD.toFixed(3)} ${n2(pp[0])} ${n2(pp[1])})`}>
        <Paint.FolkPaint shapes={handShapes()} x={pp[0]} y={pp[1]} scale={(k * HAND_SCALE) / 10} uid={`${uid}-hp`} px={(k * HAND_SCALE * 9) / 860} />
      </g>
    </g>
  );
};

// ===================================================================================================================
// CONVENIENCE: a whole desk frame (scene + tray + telegrams + hand), for probes and simple cuts
// ===================================================================================================================
export const ease01 = ease;
export const camLerp = (a: DeskCam, b: DeskCam, t: number): DeskCam => ({
  tx: lerp(a.tx, b.tx, t),
  ty: lerp(a.ty, b.ty, t),
  tz: lerp(a.tz, b.tz, t),
  dist: Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), t)),
  pitch: lerp(a.pitch, b.pitch, t),
  yaw: lerp(a.yaw, b.yaw, t),
  f: Math.exp(lerp(Math.log(a.f), Math.log(b.f), t)),
  sx: lerp(a.sx, b.sx, t),
  sy: lerp(a.sy, b.sy, t),
});
