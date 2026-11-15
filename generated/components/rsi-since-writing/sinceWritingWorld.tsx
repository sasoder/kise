// ---------------------------------------------------------------------------
// sinceWritingWorld — THE OFFICE AND THE PAPER, the shared world module of rsi-since-writing (world builder W1;
// COMMON.md). Dwarkesh 3D (styles/dwarkesh-3d.md) on the kit kits/dwarkesh-3d/dwarkesh3d: every part is a pure,
// frame-driven component drawn air-lit on the londonDepth one-point perspective and fogged by its own depth through
// the cut's AirWorld `A`. Read-only for cut builders after WORLD_READY.md (changes keep the old names and are logged in
// animation_source/notes/SHARED_CHANGES.md). The cast is sinceWritingFolk.tsx (the human) + the sister clip's Genius.
// Shares the sister clip's office look (rsi-ten-earths/tenEarthsHall: materials, PLATE_FONT, YearPlate; read-only).
// Probe: sinceWritingProbe.tsx (src/Root.SinceWritingProbe.tsx).
//
// UNITS: the cast's. U = 178 per metre (a man 312 = 1.75 m). X across, Y height (floor Y = 0, up is -Y), Z depth
//   behind the front plane (toward the camera is -Z). Draw inside the cut's <WorldSvg cam>; every part takes A.
// COLOUR RULE: nothing in this file is orange. Cream = work (one WorkSheet = one workday); DEAD #8A7B62 = wasted work.
//
// ---- THE ROOM ------------------------------------------------------------------------------------------------------
//   OFFICE = { x0 -1100, x1 1100, back 700 (the back wall's face), z0 -1600 (the floor's near end), wallH 1800,
//     wallT 34, win: { x0 -380, x1 380, sill -150, head -520, cols 3, rows 2 } } (a 4.3 m window, sill 0.84 m).
//   <OfficeRoom A sunT uid room? sides? clock? />   the floor (warm timber planks, AirFloor), the back wall (oatmeal
//     plaster melting into the air toward its top: no ceiling line, never a letterbox), a skirting board, ONE BIG WINDOW
//     (reveals, a sill, slate mullions and a transom) with the SKY beyond it, a pale SUN DISC and a far roofline in the
//     haze, and the SUN PATCHES the panes throw on the floor. clock = { X, Y, secondT } hangs a WallClock on the wall.
//   sunT 0..1 = morning (sun low LEFT, cool pale-sage light, long patches thrown to the right) -> noon (sun high, out of
//     the window's top, short patches under the window) -> evening (sun low RIGHT, warm umber-rose dusk, patches to the
//     left). Never black, never an orange sky: dusk is a low-saturation umber-rose, the disc stays pale.
//   0..0.7 the room sits in the style's misty teal air (sage-teal high, petrol lower) over the oatmeal plaster; only
//     0.7..1 warms to the dusk: officeDusk(sunT) = 0 by day, 0 -> 1 over 0.7..1.
//   officeSun(sunT) -> { elev, dx, skyTop, skyLow, light, disc, patch }   the sun of the moment (shared by all parts)
//   officeScene(sunT) -> Partial<AirScene>   pass as airWorldOf({ ..., scene: officeScene(sunT) }): the interior
//     mood, the air a little denser at dusk.   <OfficeTint sunT />   the air's colour shift: pass it as AirStage's
//     `overlay` (a soft-light veil: a faint cool sage in the morning, nothing from noon to 0.7, warm umber-rose at dusk).
//     The stage: <AirStage v={A.v} shafts={0} bloom={0.22} overlay={<OfficeTint sunT={s} />}> (shafts 0: the room
//     draws its own window light, the medium's shafts cannot turn with the sun).
//   <OfficeShafts A sunT uid room? strength? />   the window's light through the air: one soft shaft per pane from
//     the glass to its floor patch (screen blend). Draw it AFTER the furniture and the figures (volumetric).
//
// ---- THE DESKS (the Genius desk contract, GENIUS_DESK / HUMAN_DESK: seat 84, desk top 132, hands on the keys) ----
//   <OfficeDesk A X Z dir uid layer? monitor? keyboard? laptop? screen? shadow? />   a present-day office desk in
//     PROFILE to its sitter, mirror-able: (X, Z) = the sitter's `at` (the floor under the hips); dir 1 = he faces +X
//     (the desk on his right on screen), -1 = he faces -X. The desk: a pale laminate top (Y -132) on a light steel leg frame,
//     its near edge 48 units in front of his hips (x 48..173 along dir), from Z - 30 to Z + 220 (1.4 m: it runs back
//     from him, so its near edge barely covers his lap); the chair (dusty-teal seat at 84 and back at x -30, gas column,
//     five-star base); monitor (default true: a screen at [dir*160, -216] facing him, turned MON_TURN 28 deg toward the camera so its
//     cream screen reads; screen 0..1 = off..lit, its glow on his face), keyboard
//     (default = monitor: under his hands at x 56..76), laptop (instead of the monitor). layer: "back" (the desk, chair,
//     monitor, keyboard: draw it, then the sitter) and "front" (the desk's near edge and near leg panel, over his lap
//     and shins), or "all". Things the cut sets on the desk (a mug, a sheet, a stack) go after "back", before the
//     figure. THE GENIUS: GENIUS_POSES.typeAtDesk(dir, frame) at (X, Z). THE HUMAN: HUMAN_POSES.seatedWrite /
//     seatedSip / handOver(dir, ...) at (X, Z) (HUMAN_DESK has the mug's rest and the sheet's place, units from at).
//   officeDeskTop(X, Z, dir, x) -> { X, Y, Z }   a point on the desk top x units along dir from the hips (in his plane)
//
// ---- THE CLOCK AND THE BIN -----------------------------------------------------------------------------------------
//   <WallClock A X Y Z secondT uid R? tick? />   a round office wall clock on a wall at depth Z (its face parallel to
//     the image plane): a slate rim, a cream face, 12 marks, hour and minute hands and a thin muted red-brown second
//     hand; secondT = the clock's time in seconds (9 * 3600 = 9:00); tick (default true) = the second hand steps once
//     a second with a short ease, false = it sweeps. R = the radius (default 34 units = 38 cm across).
//   <WireBin A X Z uid R? H? layer? />   a wire waste-paper basket (R 30, H 62): layer "back" = its inside (the back
//     half of the mesh, the floor) and "front" = the front half of the mesh and the rim: draw back, the balls, front.
//     binMouth(X, Z, R?, H?) -> { X, Y, Z, R }: the opening (drop crumpled balls into it).
//
// ---- COFFEE ---------------------------------------------------------------------------------------------------------
//   <CoffeeMug A X Y Z uid level? steam? frame? handle? tilt? fog? />   a dusty-teal mug standing at (X, Y, Z) (Y = the
//     surface: -132 on a desk) in the cast's gouache paint, with steam wisps (steam 0..1). A HELD mug rides in the
//     figure's pose (HUMAN_POSES.seatedSip / pour): draw only <MugSteam> over it, at the mug's mouth.
//   <MugSteam at scale frame amount uid />   steam rising from a mouth at world px `at` (scale = world px per unit).
//   <CoffeePot A X Y Z uid tilt? level? sx? />   the glass carafe standing at (X, Y, Z) (its base centre; it tilts about
//     its grip). coffeePotSpout(A, X, Y, Z, tilt?, sx?) / coffeeMugMouth(A, X, Y, Z, tilt?) -> world px (stream ends);
//     coffeePotForSpout(sX, sY, tilt, sx?) -> { X, Y }: where to put the pot so its spout tip is at (sX, sY) (units).
//   <CoffeeStream from to scale frame uid freeze? amount? fog? />   the hanging stream from a spout to a mouth (world px;
//     scale = world px per unit): a tapering coffee ribbon with a lit edge, ripples running down it, a few droplets
//     beside it and a small crown where it lands. freeze 0 = running, 1 = nearly still (cut 11: the moment frozen).
//
// ---- THE PAPER (one WorkSheet = one workday) ------------------------------------------------------------------------
//   SHEET = { w 38, l 53 (A4, 21 x 29.7 cm), t 2.5 }: t is the STACK thickness per sheet (stylised): 100 sheets stand
//     250 units = 1.4 m, about as tall as a seated person (head top ~265); 260 (a work year) = 650; 300 = 750.
//   SheetPose = { X, Y, Z, yaw, pitch, roll, curl }   degrees; flat = pitch 0 roll 0 curl 0, lying on a surface at Y
//     (the sheet's long side along Z); yaw turns it about the vertical.
//   <WorkSheet A pose uid drain? ink? shadowY? />   a cream sheet with a few faint ink lines and a small corner mark
//     on its face (the back is plain creamLo), curled softly when curl > 0 (in flight), fogged by its depth; drain 0..1
//     -> DEAD; shadowY: a soft shadow on the surface at that Y under it (fades with the height).
//   <SheetStack A X Z n uid Y? yaw? seed? drain? />   n sheets as a neat, hand-stacked pile (seeded jitter per sheet:
//     +-2 units, +-2.5 deg) on a surface at Y (default the floor); the top sheet is drawn as a WorkSheet at exactly
//     stackTop(...). Every sheet's jitter depends only on its index: growing n never moves the sheets below.
//   stackTop(X, Z, n, Y?, yaw?, seed?) -> SheetPose   the top sheet of an n-stack (n >= 1).  stackHeight(n) = n * SHEET.t
//   sheetFlight(from, to, t, seed?) -> SheetPose   an arc with a little curl and flutter, from a pose to a pose; at t = 1
//     it is EXACTLY `to` (flat, no flutter). To land as sheet n + 1: to = stackTop(X, Z, n + 1, ...) and switch the
//     stack from n to n + 1 on the landing frame (stop drawing the flyer). It leaves fast and settles (ease-out).
//   <CrumpledSheet A X Y Z uid seed? crumple? drain? size? rot? />   a crumpled ball (Y = its centre; radius 13 * size)
//     in the image plane: crumple 0 = the flat sheet facing us, 1 = the ball (creases and facets come in with it);
//     drain 0..1 cream -> DEAD. heapLayout(n, seed?, R?) -> [{ dx, dy, dz }] a mound of n balls (dy = centre height,
//     up -): add to a heap's foot point.
//   <Shelf A X0 X1 Y Z uid D? />   a timber wall shelf (top surface at Y, front edge at Z, D deep) on two iron brackets.
//   <YearBinder A X Y Z text uid color? pull? />   a ring binder standing on a surface at Y with its spine at Z
//     (22 x 62 x 54 units), a cream spine label with `text` (2 characters across, longer ones up the spine) and a
//     finger hole; color 0..4 = slate, umber, dusty teal, muted red-brown, khaki; pull = units it stands out toward the
//     camera (slide it in by easing pull to 0). shelfSlots(X0, X1, n, gap?) -> X centres from the left end.
//   <Plate> = the sister clip's YearPlate (cream Caslon on a soft plate in world space, slide-up-and-fade entrance;
//     props A X Y Z text t uid size? weight? plate?), plateT(frame, f0, dur?) = yearPlateT, PLATE_FONT.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { AIR, AirBox, AirFloor, AirShadow, MAT, c01, lineOf, mixHex, type AirScene, type AirWorld, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CovidPaint, type FolkFog } from "../kyle-covid/covidFolk";
import { MAT_FABRIC, MAT_KEYS, MAT_LAMINATE, MAT_MONITOR, MAT_OATMEAL, PLATE_FONT, YearPlate, yearPlateT } from "../rsi-ten-earths/tenEarthsHall";
import { MUG, mugMouth, mugShapes, potGripForSpout, potShapes, potSpout, type MugState, type PotState } from "./sinceWritingProps";

export { PLATE_FONT, YearPlate as Plate, yearPlateT as plateT };
export { MUG };

const PAL = AIR.A;
export const U = 178;
export const CREAM = PAL.cream;
export const CREAM_LO = PAL.creamLo;
export const DEAD = "#8A7B62";
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const frac = (v: number) => v - Math.floor(v);
const h01 = (s: string) => random(`sw-${s}`);

// ---- materials (local colours before fog; none near the orange hue) ---------------------------------------------------
export const MAT_PLASTER: Mat = MAT_OATMEAL;
export const MAT_FLOORWOOD: Mat = { lit: "#837B6C", mid: "#666052", dark: "#37332B" };
export const MAT_FRAME: Mat = { lit: "#7E878A", mid: "#596266", dark: "#30373A" };
export const MAT_LEG: Mat = { lit: "#9AA2A2", mid: "#737C7D", dark: "#3E4546" };
export const MAT_SKIRT: Mat = { lit: "#B9AB8C", mid: "#93856A", dark: "#544A3B" };
export const MAT_SHELF: Mat = MAT.timber;
export const BINDER_MATS: Mat[] = [
  { lit: "#7A878D", mid: "#5E6A70", dark: "#343C40" },
  { lit: "#86705A", mid: "#6B5440", dark: "#3A2D22" },
  { lit: "#7C9A95", mid: "#5F7F7A", dark: "#334543" },
  { lit: "#9A685D", mid: "#7E4E44", dark: "#45291F" },
  { lit: "#A39C7E", mid: "#8E8668", dark: "#4E4936" },
];

// ===================================================================================================================
// THE SUN AND THE AIR OF THE DAY
// ===================================================================================================================
// keys at sunT 0 (morning), 0.5 (noon), 0.7 (still the day's teal medium) and 1 (dusk): the warm turn starts at 0.7
const KT = [0, 0.5, 0.7, 1];
const seg = (t: number): [number, number] => {
  const i = t < KT[1] ? 0 : t < KT[2] ? 1 : 2;
  return [i, c01((t - KT[i]) / (KT[i + 1] - KT[i]))];
};
const key4 = (t: number, k: [string, string, string, string]) => {
  const [i, u] = seg(t);
  return mixHex(k[i], k[i + 1], u);
};
const num4 = (t: number, k: [number, number, number, number]) => {
  const [i, u] = seg(t);
  return lerp(k[i], k[i + 1], u);
};
/** 0 through the day, rising 0 -> 1 from sunT 0.7 to 1 (the umber-rose dusk) */
export const officeDusk = (sunT: number) => sst(0.7, 1, c01(sunT));
export type OfficeSun = { elev: number; dx: number; skyTop: string; skyLow: string; light: string; disc: string; patch: number; tintA: number };
export const officeSun = (sunT: number): OfficeSun => {
  const t = c01(sunT);
  const s = Math.sin(Math.PI * t);
  return {
    elev: lerp(13, 54, s),
    dx: 0.85 * Math.cos(Math.PI * t),
    // the window: a cool pale sage through the day (the medium's own high end), umber-rose only at dusk
    skyTop: key4(t, ["#9FC0AE", "#A7C6B6", "#A5C2B2", "#8C7A7D"]),
    skyLow: key4(t, ["#D2E3D5", "#D9E6DB", "#D6E2D6", "#CBA99D"]),
    light: key4(t, ["#E2EEE2", "#ECF1E6", "#EAEFE3", "#F0D9CB"]),
    disc: key4(t, ["#F4F9F0", "#F8FBF4", "#F7FAF2", "#F7EADF"]),
    patch: num4(t, [0.5, 0.4, 0.42, 0.55]),
    tintA: num4(t, [0.32, 0, 0, 0.75]),
  };
};
/** the AirScene overrides of the office at sunT: the interior mood with the style's teal air dense enough to sit between
 *  the camera and the back wall (sage-teal high, petrol lower) through the day; thinner and warmer (OfficeTint) at dusk */
export const officeScene = (sunT: number): Partial<AirScene> => {
  const t = c01(sunT);
  const e = officeDusk(t);
  return { mood: "interior", eyeT: num4(t, [0.15, 0.14, 0.15, 0.2]), fogNear: lerp(420, 650, e), fogVis: lerp(1900, 3200, e), fogMax: 0.92 };
};
/** the air's colour shift through the day: AirStage overlay (morning: a faint cool sage veil from the window's side;
 *  noon to 0.7: nothing, the plain teal medium; dusk: a soft-light umber-rose veil from the right) */
export const OfficeTint: React.FC<{ sunT: number }> = ({ sunT }) => {
  const t = c01(sunT);
  const sun = officeSun(t);
  if (sun.tintA <= 0.005) return null;
  const eve = officeDusk(t);
  const col = eve > 0 ? "182,128,120" : "176,206,188";
  const side = eve > 0 ? "100% 30%" : "0% 30%";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ mixBlendMode: "soft-light", background: `radial-gradient(ellipse 140% 110% at ${side}, rgba(${col},${(0.9 * sun.tintA).toFixed(3)}) 0%, rgba(${col},${(0.45 * sun.tintA).toFixed(3)}) 60%, rgba(${col},${(0.25 * sun.tintA).toFixed(3)}) 100%)` }} />
      {eve > 0 ? <AbsoluteFill style={{ mixBlendMode: "multiply", background: `rgba(214,184,178,${(0.22 * eve).toFixed(3)})` }} /> : null}
    </AbsoluteFill>
  );
};

// ===================================================================================================================
// THE ROOM
// ===================================================================================================================
export type OfficeGeom = { x0: number; x1: number; back: number; z0: number; wallH: number; wallT: number; win: { x0: number; x1: number; sill: number; head: number; cols: number; rows: number } };
export const OFFICE: OfficeGeom = { x0: -1100, x1: 1100, back: 700, z0: -1600, wallH: 1800, wallT: 34, win: { x0: -380, x1: 380, sill: -150, head: -520, cols: 3, rows: 2 } };
const FRAME_W = 9;
/** the panes (inner rects of the frame) of a window: [x0, x1, yTop, yBottom] */
const panesOf = (g: OfficeGeom): [number, number, number, number][] => {
  const w = g.win;
  const out: [number, number, number, number][] = [];
  const cw = (w.x1 - w.x0) / w.cols;
  // the transom sits at 62 % of the height from the sill (a tall lower light, a short upper one)
  const rowsY = w.rows === 2 ? [w.head, lerp(w.sill, w.head, 0.62), w.sill] : Array.from({ length: w.rows + 1 }, (_, i) => lerp(w.head, w.sill, i / w.rows));
  for (let r = 0; r < w.rows; r++)
    for (let c = 0; c < w.cols; c++) out.push([w.x0 + c * cw + FRAME_W / 2 + (c === 0 ? FRAME_W / 2 : 0), w.x0 + (c + 1) * cw - FRAME_W / 2 - (c === w.cols - 1 ? FRAME_W / 2 : 0), rowsY[r] + FRAME_W / 2 + (r === 0 ? FRAME_W / 2 : 0), rowsY[r + 1] - FRAME_W / 2 - (r === w.rows - 1 ? FRAME_W / 2 : 0)]);
  return out;
};
/** where the sun's ray through (X, Y) on the window lands on the floor (X, Z) */
const sunHit = (sun: OfficeSun, X: number, Y: number, Zw: number): [number, number] => {
  const L = Math.hypot(sun.dx, 1);
  const sy = Math.tan((sun.elev * Math.PI) / 180) * L;
  const t = -Y / sy;
  return [X + sun.dx * t, Zw - t];
};

export const OfficeRoom: React.FC<{ A: AirWorld; sunT: number; uid: string; room?: OfficeGeom; sides?: boolean; clock?: { X: number; Y: number; secondT: number; R?: number } }> = ({ A, sunT, uid, room = OFFICE, sides = true, clock }) => {
  const P = A.P;
  const g = room;
  const w = g.win;
  const sun = officeSun(sunT);
  const Zb = g.back;
  const els: React.ReactNode[] = [];
  // ---- the floor ----
  els.push(<AirFloor key="fl" A={A} x0={g.x0} x1={g.x1} z0={g.z0} z1={Zb} mat={MAT_FLOORWOOD} course={260} plank={44} jointAmt={0.7} melt={0.05} />);
  // ---- the side walls (inner faces, seen when the eye is inside the room) ----
  if (sides) {
    for (const sx of [g.x0, g.x1]) {
      const seen = sx < P.vp[0] ? true : sx > P.vp[0];
      if (!seen) continue;
      const q: P2[] = [P.p(sx, 0, g.z0), P.p(sx, 0, Zb), P.p(sx, -g.wallH, Zb), P.p(sx, -g.wallH, g.z0)];
      els.push(<path key={`sw${sx}`} d={poly(q)} fill={A.tone(mixHex(MAT_PLASTER.mid, MAT_PLASTER.dark, 0.25), (g.z0 + Zb) / 2, 250)} />);
    }
  }
  // ---- the sky through the window (drawn first; the wall with its hole goes over it) ----
  const o0 = P.p(w.x0, w.head, Zb + g.wallT);
  const o1 = P.p(w.x1, w.sill, Zb + g.wallT);
  const skyFar = Zb + 2600;
  const sk0 = P.p(w.x0 - 400, w.head - 300, skyFar);
  const sk1 = P.p(w.x1 + 400, w.sill + 60, skyFar);
  const glass = poly([P.p(w.x0, w.head, Zb + g.wallT), P.p(w.x1, w.head, Zb + g.wallT), P.p(w.x1, w.sill, Zb + g.wallT), P.p(w.x0, w.sill, Zb + g.wallT)]);
  const skyAir = (hex: string) => mixHex(hex, A.airHex(skyFar, 300), lerp(0.28, 0.15, officeDusk(sunT)));
  // the sun's disc on the sky: low left -> high (above the window head) -> low right
  const sT = c01(sunT);
  const discX = lerp(w.x0 + 70, w.x1 - 70, sT);
  const discY = lerp(w.sill + 10, w.head - 260, Math.sin(Math.PI * sT));
  const dc = P.p(discX, discY, Zb + g.wallT + 40);
  const dr = 34 * P.r(Zb + g.wallT + 40);
  // a far roofline in the haze along the window's foot
  let roof = "";
  {
    let x = w.x0 - 40;
    let i = 0;
    while (x < w.x1 + 40) {
      const bw = 50 + 90 * h01(`rw${i}`);
      const bh = 22 + 70 * Math.pow(h01(`rh${i}`), 1.6);
      const a = P.p(x, w.sill + 4, Zb + g.wallT + 6);
      const b = P.p(x + bw, w.sill - bh, Zb + g.wallT + 6);
      roof += `M${f2(a[0])},${f2(a[1])}L${f2(a[0])},${f2(b[1])}L${f2(b[0])},${f2(b[1])}L${f2(b[0])},${f2(a[1])}Z`;
      x += bw + 6 + 30 * h01(`rg${i}`);
      i++;
    }
  }
  els.push(
    <g key="sky">
      <defs>
        <linearGradient id={`${uid}-sky`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(sk0[1])} x2="0" y2={f2(sk1[1])}>
          <stop offset="0" stopColor={skyAir(sun.skyTop)} />
          <stop offset="0.75" stopColor={skyAir(mixHex(sun.skyTop, sun.skyLow, 0.75))} />
          <stop offset="1" stopColor={skyAir(sun.skyLow)} />
        </linearGradient>
        <radialGradient id={`${uid}-halo`}>
          <stop offset="0" stopColor={sun.disc} stopOpacity={0.75} />
          <stop offset="0.3" stopColor={sun.disc} stopOpacity={0.28} />
          <stop offset="1" stopColor={sun.disc} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${uid}-gl`}>
          <path d={glass} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-gl)`}>
        <rect x={f2(Math.min(o0[0], sk0[0]))} y={f2(Math.min(o0[1], sk0[1]))} width={f2(Math.abs(sk1[0] - sk0[0]) + 400)} height={f2(Math.abs(sk1[1] - sk0[1]) + Math.abs(o1[1] - o0[1]))} fill={`url(#${uid}-sky)`} />
        <circle cx={f2(dc[0])} cy={f2(dc[1])} r={f2(dr * 5)} fill={`url(#${uid}-halo)`} />
        <circle cx={f2(dc[0])} cy={f2(dc[1])} r={f2(dr)} fill={sun.disc} opacity={0.95} />
        <path d={roof} fill={mixHex(sun.skyLow, mixHex(A.airHex(skyFar, 80), "#5F6A66", 0.3), 0.32)} opacity={0.75} />
      </g>
    </g>,
  );
  // ---- the back wall with the window hole ----
  const wq = poly([P.p(g.x0, 0, Zb), P.p(g.x1, 0, Zb), P.p(g.x1, -g.wallH, Zb), P.p(g.x0, -g.wallH, Zb)]);
  const hole = poly([P.p(w.x0, w.sill, Zb), P.p(w.x0, w.head, Zb), P.p(w.x1, w.head, Zb), P.p(w.x1, w.sill, Zb)]);
  const wy0 = P.p(0, 0, Zb)[1];
  const wy1 = P.p(0, -g.wallH, Zb)[1];
  // the air between the camera and the wall: the medium's light (sage-teal) end over the oatmeal plaster at every
  // height by day (the teal room of the style), thinning toward dusk, where OfficeTint warms it
  const veil = lerp(0.34, 0.12, officeDusk(sunT));
  const wallAt = (h: number) => {
    const base = mixHex(A.tone(mixHex(MAT_PLASTER.mid, MAT_PLASTER.lit, 0.25), Zb, h), A.airHex(Zb, Math.max(h, 520)), veil);
    return mixHex(base, A.airHex(Zb, h), 0.92 * sst(0.3, 0.75, h / g.wallH));
  };
  els.push(
    <g key="wall">
      <defs>
        <linearGradient id={`${uid}-wall`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(wy0)} x2="0" y2={f2(wy1)}>
          {[0, 0.15, 0.3, 0.42, 0.55, 0.68, 0.8, 1].map((s) => (
            <stop key={s} offset={s} stopColor={wallAt(s * g.wallH)} />
          ))}
        </linearGradient>
        <radialGradient id={`${uid}-bounce`}>
          <stop offset="0" stopColor={sun.light} stopOpacity={0.22} />
          <stop offset="1" stopColor={sun.light} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={`${wq}${hole}`} fill={`url(#${uid}-wall)`} fillRule="evenodd" />
      <ellipse cx={f2((P.p(w.x0, 0, Zb)[0] + P.p(w.x1, 0, Zb)[0]) / 2)} cy={f2(P.p(0, (w.sill + w.head) / 2, Zb)[1])} rx={f2((w.x1 - w.x0) * 0.95 * P.r(Zb))} ry={f2((w.sill - w.head) * 1.05 * P.r(Zb))} fill={`url(#${uid}-bounce)`} />
    </g>,
  );
  // ---- the reveals: jambs, soffit, the inner sill ----
  const Zi = Zb + g.wallT;
  const rev = (q: P2[], hex: string, key: string) => els.push(<path key={key} d={poly(q)} fill={A.tone(hex, Zb + g.wallT / 2, 250)} />);
  if (w.x0 < P.vp[0]) rev([P.p(w.x0, w.sill, Zb), P.p(w.x0, w.head, Zb), P.p(w.x0, w.head, Zi), P.p(w.x0, w.sill, Zi)], mixHex(MAT_PLASTER.lit, sun.light, 0.15), "rvL");
  if (w.x1 > P.vp[0]) rev([P.p(w.x1, w.sill, Zb), P.p(w.x1, w.head, Zb), P.p(w.x1, w.head, Zi), P.p(w.x1, w.sill, Zi)], MAT_PLASTER.mid, "rvR");
  if (w.head < P.horizonY) rev([P.p(w.x0, w.head, Zb), P.p(w.x1, w.head, Zb), P.p(w.x1, w.head, Zi), P.p(w.x0, w.head, Zi)], mixHex(MAT_PLASTER.mid, MAT_PLASTER.dark, 0.3), "rvT");
  // ---- the frame: outer border, mullions, transom (slate) ----
  const Zf = Zi - 4;
  const fb = (x0: number, x1: number, y0: number, y1: number, k: string) => els.push(<AirBox key={k} A={A} X0={x0} X1={x1} Y0={y0} Y1={y1} Z0={Zf} Z1={Zf + 5} mat={MAT_FRAME} uid={`${uid}-${k}`} rim={0.5} />);
  fb(w.x0, w.x1, w.head, w.head + FRAME_W, "fT");
  fb(w.x0, w.x1, w.sill - FRAME_W, w.sill, "fB");
  fb(w.x0, w.x0 + FRAME_W, w.head, w.sill, "fL");
  fb(w.x1 - FRAME_W, w.x1, w.head, w.sill, "fR");
  const cw = (w.x1 - w.x0) / w.cols;
  for (let c = 1; c < w.cols; c++) fb(w.x0 + c * cw - FRAME_W / 2, w.x0 + c * cw + FRAME_W / 2, w.head, w.sill, `fm${c}`);
  if (w.rows === 2) {
    const ty = lerp(w.sill, w.head, 0.62);
    fb(w.x0, w.x1, ty - FRAME_W / 2, ty + FRAME_W / 2, "ftr");
  }
  // the sill ledge
  els.push(<AirBox key="sill" A={A} X0={w.x0 - 16} X1={w.x1 + 16} Y0={w.sill} Y1={w.sill + 9} Z0={Zb - 22} Z1={Zi} mat={MAT_SKIRT} uid={`${uid}-sill`} />);
  // the skirting
  els.push(<AirBox key="sk" A={A} X0={g.x0} X1={g.x1} Y0={-20} Y1={0} Z0={Zb - 4} Z1={Zb} mat={MAT_SKIRT} uid={`${uid}-sk`} rim={0.4} />);
  // ---- the sun patches on the floor (each pane thrown along the sun) ----
  const panes = panesOf(g);
  const patches = panes
    .map(([x0, x1, yT, yB]) => {
      const c = [sunHit(sun, x0, yB, Zi), sunHit(sun, x1, yB, Zi), sunHit(sun, x1, yT, Zi), sunHit(sun, x0, yT, Zi)];
      const cz = c.map(([X, Z]): [number, number] => [X, Math.max(Z, g.z0)]);
      return poly(cz.map(([X, Z]) => P.p(X, 0, Math.min(Z, Zb))));
    })
    .join("");
  const pFar = P.p(0, 0, Zb)[1];
  const nearHit = sunHit(sun, 0, w.head, Zi);
  const pNear = P.p(0, 0, Math.max(g.z0, nearHit[1]))[1];
  els.push(
    <g key="patch">
      <defs>
        <linearGradient id={`${uid}-pg`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(pFar)} x2="0" y2={f2(Math.max(pNear, pFar + 1))}>
          <stop offset="0" stopColor={sun.light} stopOpacity={sun.patch * (1 - A.fog(Zb))} />
          <stop offset="1" stopColor={sun.light} stopOpacity={sun.patch * 0.55} />
        </linearGradient>
        <filter id={`${uid}-pb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={f2(3 / A.k)} />
        </filter>
      </defs>
      <path d={patches} fill={`url(#${uid}-pg)`} filter={`url(#${uid}-pb)`} style={{ mixBlendMode: "screen" }} />
    </g>,
  );
  if (clock) els.push(<WallClock key="clk" A={A} X={clock.X} Y={clock.Y} Z={Zb} secondT={clock.secondT} R={clock.R} uid={`${uid}-clk`} />);
  return <g>{els}</g>;
};

/** the window's light through the air: a soft shaft per pane from the glass to its patch on the floor */
export const OfficeShafts: React.FC<{ A: AirWorld; sunT: number; uid: string; room?: OfficeGeom; strength?: number }> = ({ A, sunT, uid, room = OFFICE, strength = 1 }) => {
  const P = A.P;
  const g = room;
  const sun = officeSun(sunT);
  const Zi = g.back + g.wallT;
  const hull = (pts: P2[]): P2[] => {
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo: P2[] = [];
    for (const q of p) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
      lo.push(q);
    }
    const up: P2[] = [];
    for (let i = p.length - 1; i >= 0; i--) {
      const q = p[i];
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
      up.push(q);
    }
    return [...lo.slice(0, -1), ...up.slice(0, -1)];
  };
  const shafts = panesOf(g).map(([x0, x1, yT, yB], i) => {
    const win: P2[] = [P.p(x0, yT, Zi), P.p(x1, yT, Zi), P.p(x1, yB, Zi), P.p(x0, yB, Zi)];
    const fl: P2[] = [sunHit(sun, x0, yB, Zi), sunHit(sun, x1, yB, Zi), sunHit(sun, x1, yT, Zi), sunHit(sun, x0, yT, Zi)].map(([X, Z]) => P.p(X, 0, Math.max(Z, g.z0 + 1)));
    const h = hull([...win, ...fl]);
    const wc: P2 = [(win[0][0] + win[2][0]) / 2, (win[0][1] + win[2][1]) / 2];
    const fc: P2 = [(fl[0][0] + fl[2][0]) / 2, (fl[0][1] + fl[2][1]) / 2];
    const a = 0.3 * strength * (0.8 + 0.2 * Math.sin(i * 1.7));
    return (
      <g key={i}>
        <defs>
          <linearGradient id={`${uid}-s${i}`} gradientUnits="userSpaceOnUse" x1={f2(wc[0])} y1={f2(wc[1])} x2={f2(fc[0])} y2={f2(fc[1])}>
            <stop offset="0" stopColor={sun.light} stopOpacity={a} />
            <stop offset="0.6" stopColor={sun.light} stopOpacity={a * 0.35} />
            <stop offset="1" stopColor={sun.light} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={poly(h)} fill={`url(#${uid}-s${i})`} />
      </g>
    );
  });
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <filter id={`${uid}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={f2(9 / A.k)} />
        </filter>
      </defs>
      <g filter={`url(#${uid}-blur)`}>{shafts}</g>
    </g>
  );
};

// ===================================================================================================================
// THE DESK (profile to its sitter; the Genius desk contract)
// ===================================================================================================================
/** how far the desk monitor turns from facing its sitter toward the camera (degrees) */
export const MON_TURN = 28;
export const OFFICE_DESK = { seatH: 84, deskH: 132, top: 6, front: 48, depth: 125, zNear: -30, zFar: 220 } as const;
export const officeDeskTop = (X: number, Z: number, dir: 1 | -1, x: number) => ({ X: X + dir * x, Y: -OFFICE_DESK.deskH, Z });
const xr = (X: number, dir: 1 | -1, a: number, b: number): [number, number] => {
  const p = X + dir * a;
  const q = X + dir * b;
  return p < q ? [p, q] : [q, p];
};
export const OfficeDesk: React.FC<{ A: AirWorld; X: number; Z: number; dir: 1 | -1; uid: string; layer?: "back" | "front" | "all"; monitor?: boolean; keyboard?: boolean; laptop?: boolean; screen?: number; shadow?: boolean }> = ({
  A,
  X,
  Z,
  dir,
  uid,
  layer = "all",
  monitor = true,
  keyboard,
  laptop = false,
  screen = 1,
  shadow = true,
}) => {
  const P = A.P;
  const D = OFFICE_DESK;
  const kb = keyboard ?? monitor;
  const DH = D.deskH;
  const [dx0, dx1] = xr(X, dir, D.front, D.front + D.depth);
  const z0 = Z + D.zNear;
  const z1 = Z + D.zFar;
  const iron = MAT.iron;
  const back: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  // shadows on the floor
  if (shadow) {
    back.push(<path key="dsh" d={poly([P.p(dx0 - 6, 0, z0 - 6), P.p(dx1 + 30, 0, z0 - 6), P.p(dx1 + 30, 0, z1 + 8), P.p(dx0 - 6, 0, z1 + 8)])} fill={PAL.shadow} fillOpacity={0.15 * (1 - A.fog(Z))} />);
    back.push(<AirShadow key="csh" A={A} X={X - dir * 4} Z={Z} w={58} d={34} uid={`${uid}-cs`} amt={0.7} />);
  }
  // ---- the chair (seat top 84, back at x -30) ----
  const [sx0, sx1] = xr(X, dir, -30, 26);
  const sxc = (sx0 + sx1) / 2;
  back.push(<AirBox key="b1" A={A} X0={sxc - 50} X1={sxc + 50} Y0={-15} Y1={-10} Z0={Z - 4} Z1={Z + 4} mat={iron} uid={`${uid}-b1`} rim={0.4} />);
  back.push(<AirBox key="b2" A={A} X0={sxc - 4} X1={sxc + 4} Y0={-15} Y1={-10} Z0={Z - 50} Z1={Z + 50} mat={iron} uid={`${uid}-b2`} rim={0.4} />);
  for (const [cx, cz] of [
    [sxc - 48, Z],
    [sxc + 48, Z],
    [sxc, Z - 48],
    [sxc, Z + 48],
  ]) {
    const c = P.p(cx, -5, cz);
    back.push(<ellipse key={`c${cx}${cz}`} cx={c[0]} cy={c[1]} rx={6 * P.r(cz)} ry={5 * P.r(cz)} fill={A.tone(iron.dark, cz, 5)} />);
  }
  back.push(<AirBox key="col" A={A} X0={sxc - 4} X1={sxc + 4} Y0={-D.seatH + 10} Y1={-15} Z0={Z - 4} Z1={Z + 4} mat={iron} uid={`${uid}-col`} rim={0.4} />);
  const [bx0, bx1] = xr(X, dir, -38, -30);
  back.push(<AirBox key="post" A={A} X0={(bx0 + bx1) / 2 - 3} X1={(bx0 + bx1) / 2 + 3} Y0={-124} Y1={-D.seatH} Z0={Z - 3} Z1={Z + 3} mat={iron} uid={`${uid}-po`} rim={0.4} />);
  back.push(<AirBox key="bk" A={A} X0={bx0} X1={bx1} Y0={-226} Y1={-116} Z0={Z - 30} Z1={Z + 30} mat={MAT_FABRIC} uid={`${uid}-bk`} />);
  back.push(<AirBox key="seat" A={A} X0={sx0} X1={sx1} Y0={-D.seatH} Y1={-D.seatH + 10} Z0={Z - 30} Z1={Z + 30} mat={MAT_FABRIC} uid={`${uid}-st`} />);
  // ---- the desk: far leg panel, modesty panel, the top ----
  const legs = (zA: number, k: string, out: React.ReactNode[]) => {
    out.push(<AirBox key={`${k}a`} A={A} X0={dx0 + 6} X1={dx0 + 12} Y0={-DH + D.top} Y1={0} Z0={zA} Z1={zA + 6} mat={MAT_LEG} uid={`${uid}-${k}a`} rim={0.4} />);
    out.push(<AirBox key={`${k}b`} A={A} X0={dx1 - 12} X1={dx1 - 6} Y0={-DH + D.top} Y1={0} Z0={zA} Z1={zA + 6} mat={MAT_LEG} uid={`${uid}-${k}b`} rim={0.4} />);
    out.push(<AirBox key={`${k}f`} A={A} X0={dx0 + 2} X1={dx1 - 2} Y0={-5} Y1={0} Z0={zA - 1} Z1={zA + 7} mat={MAT_LEG} uid={`${uid}-${k}f`} rim={0.4} />);
    out.push(<AirBox key={`${k}r`} A={A} X0={dx0 + 6} X1={dx1 - 6} Y0={-DH + D.top} Y1={-DH + D.top + 10} Z0={zA} Z1={zA + 4} mat={MAT_LEG} uid={`${uid}-${k}r`} rim={0.3} />);
  };
  legs(z1 - 12, "lgF", back);
  const [mx0, mx1] = xr(X, dir, D.front + D.depth - 16, D.front + D.depth - 12);
  back.push(<AirBox key="mod" A={A} X0={mx0} X1={mx1} Y0={-DH + D.top} Y1={-DH + 62} Z0={z0 + 10} Z1={z1 - 12} mat={MAT_LAMINATE} uid={`${uid}-mod`} rim={0.3} />);
  back.push(<AirBox key="top" A={A} X0={dx0} X1={dx1} Y0={-DH} Y1={-DH + D.top} Z0={z0} Z1={z1} mat={MAT_LAMINATE} uid={`${uid}-top`} />);
  // ---- the monitor / laptop, the keyboard ----
  const scr = c01(screen);
  const SCREEN = "#EFE6D2";
  const screenCol = mixHex(mixHex(MAT_MONITOR.mid, PAL.shadow, 0.2), SCREEN, scr);
  if (monitor && !laptop) {
    const mxC = X + dir * 160;
    // the panel faces the sitter, turned MON_TURN degrees toward the camera so its screen reads (a slim trapezoid)
    const th = (MON_TURN * Math.PI) / 180;
    const n: [number, number] = [-dir * Math.cos(th), -Math.sin(th)];
    const ax: [number, number] = [dir * Math.sin(th), -Math.cos(th)];
    const pc: [number, number] = [mxC, Z];
    const pt = (s: number, t: number, Y: number) => P.p(pc[0] + ax[0] * s + n[0] * t, Y, pc[1] + ax[1] * s + n[1] * t);
    back.push(<AirBox key="ft" A={A} X0={mxC - 14} X1={mxC + 14} Y0={-DH - 2} Y1={-DH} Z0={Z - 22} Z1={Z + 22} mat={MAT_MONITOR} uid={`${uid}-ft`} rim={0.3} />);
    back.push(<AirBox key="nk" A={A} X0={mxC + dir * 4 - 3} X1={mxC + dir * 4 + 3} Y0={-188} Y1={-DH - 2} Z0={Z - 5} Z1={Z + 5} mat={MAT_MONITOR} uid={`${uid}-nk`} rim={0.3} />);
    const T = 5;
    const yT = -250;
    const yB = -182;
    const HW = 54;
    const lineC = A.tone(lineOf(MAT_MONITOR), Z, 215);
    // the back shell, the near side edge, the top edge, then the face (bezel + screen)
    back.push(<path key="pb" d={poly([pt(-HW, -T, yT), pt(HW, -T, yT), pt(HW, -T, yB), pt(-HW, -T, yB)])} fill={A.tone(MAT_MONITOR.dark, Z, 215)} />);
    back.push(<path key="pe" d={poly([pt(-HW, -T, yT), pt(-HW, 0, yT), pt(-HW, 0, yB), pt(-HW, -T, yB)])} fill={A.tone(MAT_MONITOR.mid, Z, 215)} stroke={lineC} strokeWidth={A.lw()} />);
    back.push(<path key="pt" d={poly([pt(-HW, -T, yT), pt(HW, -T, yT), pt(HW, 0, yT), pt(-HW, 0, yT)])} fill={A.tone(MAT_MONITOR.lit, Z, 215)} />);
    const camSide = n[0] * (P.vp[0] - pc[0]) + n[1] * (-P.Dc - pc[1]);
    if (camSide > 0) {
      back.push(<path key="pf" d={poly([pt(-HW, 0, yT), pt(HW, 0, yT), pt(HW, 0, yB), pt(-HW, 0, yB)])} fill={A.tone(MAT_MONITOR.mid, Z, 215)} stroke={lineC} strokeWidth={A.lw()} />);
      back.push(<path key="sc" d={poly([pt(-HW + 4, 0.5, yT + 4), pt(HW - 4, 0.5, yT + 4), pt(HW - 4, 0.5, yB - 5), pt(-HW + 4, 0.5, yB - 5)])} fill={A.tone(screenCol, Z, 215)} />);
      if (scr > 0.01) {
        let ln = "";
        for (let i = 0; i < 5; i++) {
          const yy = yT + 13 + i * 9;
          const len = 0.4 + 0.45 * h01(`${uid}ml${i}`);
          ln += `M${Pt(pt(-HW + 12, 1, yy))}L${Pt(pt(-HW + 12 + (2 * HW - 24) * len, 1, yy))}`;
        }
        back.push(<path key="sl" d={ln} stroke={A.tone("#6E6254", Z, 215)} strokeOpacity={0.35 * scr} strokeWidth={A.lw(1.4)} fill="none" strokeLinecap="round" />);
      }
    }
    // its glow in the air between the screen and his face
    if (scr > 0.01) {
      const gc = P.p(X + dir * 120, -218, Z);
      const gr = 120 * P.r(Z);
      const ga = 0.22 * scr * (1 - A.fog(Z));
      back.push(
        <g key="gl">
          <defs>
            <radialGradient id={`${uid}-glow`}>
              <stop offset="0" stopColor={CREAM} stopOpacity={ga} />
              <stop offset="0.5" stopColor={CREAM} stopOpacity={ga * 0.35} />
              <stop offset="1" stopColor={CREAM} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={gc[0]} cy={gc[1]} rx={gr} ry={gr * 0.8} fill={`url(#${uid}-glow)`} style={{ mixBlendMode: "screen" }} />
        </g>,
      );
    }
  }
  if (laptop) {
    const [lx0, lx1] = xr(X, dir, 66, 112);
    back.push(<AirBox key="lb" A={A} X0={lx0} X1={lx1} Y0={-DH - 3} Y1={-DH} Z0={Z - 34} Z1={Z + 34} mat={MAT_MONITOR} uid={`${uid}-lb`} rim={0.4} />);
    const hx = X + dir * 112;
    const tx = X + dir * 124;
    const lid = [P.p(hx, -DH - 3, Z - 34), P.p(hx, -DH - 3, Z + 34), P.p(tx, -DH - 52, Z + 34), P.p(tx, -DH - 52, Z - 34)];
    back.push(<path key="lid" d={poly(lid)} fill={A.tone(MAT_MONITOR.mid, Z, 160)} stroke={A.tone(lineOf(MAT_MONITOR), Z, 160)} strokeWidth={A.lw()} />);
    const faceSeen = dir === 1 ? hx > P.vp[0] : hx < P.vp[0];
    if (faceSeen) back.push(<path key="lsc" d={poly([P.p(hx + dir * 1.5, -DH - 7, Z - 30), P.p(hx + dir * 1.5, -DH - 7, Z + 30), P.p(tx + dir * 0.5, -DH - 48, Z + 30), P.p(tx + dir * 0.5, -DH - 48, Z - 30)])} fill={A.tone(screenCol, Z, 160)} />);
  }
  if (kb) {
    const [kx0, kx1] = xr(X, dir, 54, 78);
    back.push(<AirBox key="kb" A={A} X0={kx0} X1={kx1} Y0={-DH - 4} Y1={-DH} Z0={Z - 38} Z1={Z + 38} mat={MAT_KEYS} uid={`${uid}-kb`} rim={0.4} />);
  }
  // ---- in front of the sitter: the desk top's near edge and the near leg panel ----
  legs(z0 + 4, "lgN", front);
  const edge: P2[] = [P.p(dx0, -DH, z0), P.p(dx1, -DH, z0), P.p(dx1, -DH + D.top, z0), P.p(dx0, -DH + D.top, z0)];
  front.push(<path key="edge" d={poly(edge)} fill={A.tone(MAT_LAMINATE.mid, z0, DH)} stroke={A.tone(lineOf(MAT_LAMINATE), z0, DH)} strokeWidth={A.lw()} />);
  front.push(<path key="edgeR" d={`M${Pt(edge[0])}L${Pt(edge[1])}`} stroke={CREAM} strokeOpacity={0.55 * (1 - A.fog(z0))} strokeWidth={A.lw() * 1.1} strokeLinecap="round" />);
  return <g>{layer === "back" ? back : layer === "front" ? front : [...back, ...front]}</g>;
};

// ===================================================================================================================
// THE WALL CLOCK
// ===================================================================================================================
export const WallClock: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; secondT: number; uid: string; R?: number; tick?: boolean }> = ({ A, X, Y, Z, secondT, uid, R = 34, tick = true }) => {
  const P = A.P;
  const c = P.p(X, Y, Z);
  const r = R * P.r(Z);
  const h = -Y;
  const t = (hex: string) => A.tone(hex, Z, h);
  const sec = tick ? Math.floor(secondT) + sst(0, 0.16, frac(secondT)) : secondT;
  const aS = (sec / 60) * 360;
  const aM = (secondT / 3600) * 360;
  const aH = (secondT / 43200) * 360;
  const hand = (deg: number, len: number, back: number, w: number, col: string, key: string) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    return <line key={key} x1={f2(c[0] - ux * back * r)} y1={f2(c[1] - uy * back * r)} x2={f2(c[0] + ux * len * r)} y2={f2(c[1] + uy * len * r)} stroke={col} strokeWidth={f2(w * r)} strokeLinecap="round" />;
  };
  const marks: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 0.72 : 0.78;
    marks.push(<line key={i} x1={f2(c[0] + Math.sin(a) * r0 * r)} y1={f2(c[1] - Math.cos(a) * r0 * r)} x2={f2(c[0] + Math.sin(a) * 0.86 * r)} y2={f2(c[1] - Math.cos(a) * 0.86 * r)} stroke={t("#3A3430")} strokeWidth={f2((i % 3 === 0 ? 0.075 : 0.045) * r)} strokeLinecap="round" />);
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-sh`}>
          <stop offset="0.7" stopColor={PAL.shadow} stopOpacity={0.35 * (1 - A.fog(Z))} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={f2(c[0] + 0.12 * r)} cy={f2(c[1] + 0.14 * r)} r={f2(r * 1.12)} fill={`url(#${uid}-sh)`} />
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r)} fill={t(MAT_FRAME.mid)} />
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r * 0.9)} fill={t("#EFE7D6")} />
      <path d={`M${f2(c[0] - 0.9 * r)},${f2(c[1])}A${f2(0.9 * r)},${f2(0.9 * r)} 0 0 1 ${f2(c[0] + 0.9 * r)},${f2(c[1])}`} fill="none" stroke={t("#C9BEA5")} strokeWidth={f2(0.05 * r)} strokeOpacity={0.6} />
      <path d={`M${f2(c[0] - 0.97 * r)},${f2(c[1] - 0.15 * r)}A${f2(0.97 * r)},${f2(0.97 * r)} 0 0 1 ${f2(c[0] + 0.15 * r)},${f2(c[1] - 0.97 * r)}`} fill="none" stroke={CREAM} strokeOpacity={0.5 * (1 - A.fog(Z))} strokeWidth={f2(0.05 * r)} strokeLinecap="round" />
      {marks}
      {hand(aH, 0.45, 0.08, 0.075, t("#2E2A27"), "h")}
      {hand(aM, 0.68, 0.1, 0.055, t("#2E2A27"), "m")}
      {hand(aS, 0.76, 0.2, 0.022, t("#8C5A4C"), "s")}
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(0.06 * r)} fill={t("#2E2A27")} />
    </g>
  );
};

// ===================================================================================================================
// THE WIRE BIN
// ===================================================================================================================
export const binMouth = (X: number, Z: number, R = 30, H = 62) => ({ X, Y: -H, Z, R });
export const WireBin: React.FC<{ A: AirWorld; X: number; Z: number; uid: string; R?: number; H?: number; layer?: "back" | "front" | "all" }> = ({ A, X, Z, uid, R = 30, H = 62, layer = "all" }) => {
  const P = A.P;
  const t = (hex: string, z: number) => A.tone(hex, z, H / 2);
  const wire = MAT_FRAME;
  const lw = 1.3 * P.r(Z);
  const ring = (Y: number, rr: number, half: "back" | "front") => {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = half === "back" ? (Math.PI * i) / 24 : Math.PI + (Math.PI * i) / 24;
      pts.push(P.p(X + rr * Math.cos(a), Y, Z + rr * Math.sin(a)));
    }
    return `M${pts.map(Pt).join("L")}`;
  };
  const rAt = (Y: number) => lerp(R * 0.84, R, -Y / H);
  const verts = (half: "back" | "front") => {
    let d = "";
    const n = 22;
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * Math.PI * 2;
      const back = Math.sin(a) > 0;
      if ((half === "back") !== back) continue;
      d += `M${Pt(P.p(X + rAt(0) * Math.cos(a), 0, Z + rAt(0) * Math.sin(a)))}L${Pt(P.p(X + R * Math.cos(a), -H, Z + R * Math.sin(a)))}`;
    }
    return d;
  };
  const backL = (
    <g key="bk">
      <AirShadow A={A} X={X} Z={Z} w={R * 1.2} d={R * 0.8} uid={`${uid}-sh`} amt={0.55} />
      <path d={`${ring(-1, rAt(0), "back")}${ring(-1, rAt(0), "front").replace("M", "L")}Z`} fill={t(mixHex(wire.dark, PAL.shadow, 0.3), Z)} fillOpacity={0.55} />
      <path d={verts("back")} stroke={t(wire.mid, Z + R)} strokeWidth={lw} strokeOpacity={0.75} fill="none" />
      {[-H * 0.33, -H * 0.66].map((Y, i) => (
        <path key={i} d={ring(Y, rAt(Y), "back")} stroke={t(wire.mid, Z + R)} strokeWidth={lw} strokeOpacity={0.75} fill="none" />
      ))}
      <path d={ring(-H, R, "back")} stroke={t(wire.lit, Z + R)} strokeWidth={lw * 1.8} fill="none" />
    </g>
  );
  const frontL = (
    <g key="fr">
      <path d={verts("front")} stroke={t(wire.mid, Z - R)} strokeWidth={lw} fill="none" />
      {[-H * 0.33, -H * 0.66].map((Y, i) => (
        <path key={i} d={ring(Y, rAt(Y), "front")} stroke={t(wire.mid, Z - R)} strokeWidth={lw} fill="none" />
      ))}
      <path d={ring(-2, rAt(0), "front")} stroke={t(wire.dark, Z - R)} strokeWidth={lw * 1.8} fill="none" />
      <path d={ring(-H, R, "front")} stroke={t(wire.lit, Z - R)} strokeWidth={lw * 1.9} fill="none" />
      <path d={ring(-H - 0.8, R, "front")} stroke={CREAM} strokeOpacity={0.35 * (1 - A.fog(Z))} strokeWidth={lw * 0.7} fill="none" />
    </g>
  );
  return <g>{layer === "back" ? backL : layer === "front" ? frontL : [backL, frontL]}</g>;
};

// ===================================================================================================================
// COFFEE
// ===================================================================================================================
/** steam rising from a mouth at world px `at`; scale = world px per unit */
export const MugSteam: React.FC<{ at: P2; scale: number; frame: number; amount?: number; uid: string }> = ({ at, scale, frame, amount = 1, uid }) => {
  const a = c01(amount);
  if (a <= 0.01) return null;
  const Hs = 46 * scale;
  const wisps = [-1, 0, 1].map((k) => {
    const pts: P2[] = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      const y = -u * Hs * (0.85 + 0.15 * Math.sin(k * 2.1));
      const x = k * 3 * scale + Math.sin(u * 5.2 + frame * 0.07 + k * 1.9) * 4.5 * scale * (0.3 + u) + Math.sin(frame * 0.031 + k) * 2 * scale * u;
      pts.push([at[0] + x, at[1] - 2 * scale + y]);
    }
    return `M${pts.map(Pt).join("L")}`;
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-st`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(at[1])} x2="0" y2={f2(at[1] - Hs)}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0} />
          <stop offset="0.18" stopColor={CREAM} stopOpacity={0.5 * a} />
          <stop offset="0.6" stopColor={CREAM} stopOpacity={0.22 * a} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </linearGradient>
        <filter id={`${uid}-sb`} x="-80%" y="-20%" width="260%" height="140%">
          <feGaussianBlur stdDeviation={f2(1.3 * scale)} />
        </filter>
      </defs>
      <g filter={`url(#${uid}-sb)`}>
        {wisps.map((d, i) => (
          <path key={i} d={d} stroke={`url(#${uid}-st)`} strokeWidth={f2((i === 1 ? 3.2 : 2.4) * scale)} fill="none" strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
};
const fogOf = (A: AirWorld, Z: number, h: number): FolkFog => ({ rgb: A.airHex(Z, h), amount: A.fog(Z) * 0.85 });
export const CoffeeMug: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; uid: string; level?: number; steam?: number; frame?: number; handle?: -1 | 1; tilt?: number }> = ({ A, X, Y, Z, uid, level = 0.8, steam = 0, frame = 0, handle = 1, tilt = 0 }) => {
  const at = A.P.p(X, Y, Z);
  const s = A.P.r(Z);
  const m: MugState = { base: [0, 0], tilt, level, handle };
  const mo = mugMouth(m).c;
  return (
    <g>
      <CovidPaint shapes={mugShapes(m)} at={at} scale={s} uid={uid} fog={fogOf(A, Z, -Y)} unitPx={A.k} />
      {steam > 0 ? <MugSteam at={[at[0] + mo[0] * s, at[1] + mo[1] * s]} scale={s} frame={frame} amount={steam * (1 - A.fog(Z))} uid={`${uid}-st`} /> : null}
    </g>
  );
};
/** the standalone pot's state: (X, Y, Z) is its base centre when upright; it tilts about its grip */
const potStateAt = (tilt: number, level: number, sx: 1 | -1): PotState => ({ grip: [-24.6 * sx, -26], tilt, level, sx });
export const CoffeePot: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; uid: string; tilt?: number; level?: number; sx?: 1 | -1 }> = ({ A, X, Y, Z, uid, tilt = 0, level = 0.6, sx = 1 }) => {
  const at = A.P.p(X, Y, Z);
  const s = A.P.r(Z);
  return <CovidPaint shapes={potShapes(potStateAt(tilt, level, sx))} at={at} scale={s} uid={uid} fog={fogOf(A, Z, -Y)} unitPx={A.k} />;
};
/** the standalone pot's spout tip in world px (where a CoffeeStream starts) */
export const coffeePotSpout = (A: AirWorld, X: number, Y: number, Z: number, tilt = 0, sx: 1 | -1 = 1): P2 => {
  const at = A.P.p(X, Y, Z);
  const s = A.P.r(Z);
  const q = potSpout(potStateAt(tilt, 0, sx));
  return [at[0] + q[0] * s, at[1] + q[1] * s];
};
/** where to stand a standalone pot (its base X, Y at depth Z) so that, tilted, its spout tip is at (sX, sY) (units) */
export const coffeePotForSpout = (sX: number, sY: number, tilt: number, sx: 1 | -1 = 1): { X: number; Y: number } => {
  const g = potGripForSpout([sX, sY], tilt, sx);
  return { X: g[0] + 24.6 * sx, Y: g[1] + 26 };
};
/** a standalone mug's mouth centre in world px (where a stream lands, where the steam rises) */
export const coffeeMugMouth = (A: AirWorld, X: number, Y: number, Z: number, tilt = 0): P2 => {
  const at = A.P.p(X, Y, Z);
  const s = A.P.r(Z);
  const q = mugMouth({ base: [0, 0], tilt, level: 0, handle: 1 }).c;
  return [at[0] + q[0] * s, at[1] + q[1] * s];
};
/** the hanging stream from a spout to a mug's mouth (world px), scale = world px per unit */
export const CoffeeStream: React.FC<{ from: P2; to: P2; scale: number; frame: number; uid: string; freeze?: number; amount?: number; fog?: FolkFog }> = ({ from, to, scale, frame, freeze = 0, amount = 1, fog }) => {
  const a = c01(amount);
  if (a <= 0.01) return null;
  const fz = c01(freeze);
  const run = frame * (1 - 0.97 * fz);
  const ink = (hex: string) => (fog ? mixHex(hex, typeof fog.rgb === "string" ? fog.rgb : `#${fog.rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`, c01(fog.amount)) : hex);
  const d: P2 = [to[0] - from[0], to[1] - from[1]];
  const ctl: P2 = [from[0] + d[0] * 0.55, from[1] + d[1] * 0.06];
  const B = (s: number): P2 => [(1 - s) * (1 - s) * from[0] + 2 * (1 - s) * s * ctl[0] + s * s * to[0], (1 - s) * (1 - s) * from[1] + 2 * (1 - s) * s * ctl[1] + s * s * to[1]];
  const N = 26;
  const L: P2[] = [];
  const R: P2[] = [];
  const hi: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const p = B(s);
    const q = B(Math.min(1, s + 0.01));
    const p0 = B(Math.max(0, s - 0.01));
    const tx = q[0] - p0[0];
    const ty = q[1] - p0[1];
    const tl = Math.hypot(tx, ty) || 1;
    const n: P2 = [-ty / tl, tx / tl];
    const w = (lerp(5.2, 3, Math.sqrt(s)) * (0.45 + 0.55 * a) * (1 + 0.13 * Math.sin(s * 22 - run * 0.9))) * scale * 0.5;
    L.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    R.push([p[0] - n[0] * w, p[1] - n[1] * w]);
    hi.push([p[0] + n[0] * w * 0.45, p[1] + n[1] * w * 0.45]);
  }
  const body = `M${L.map(Pt).join("L")}L${[...R].reverse().map(Pt).join("L")}Z`;
  const drops: React.ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const s = frac(h01(`cd${i}`) + run * (0.012 + 0.006 * h01(`cv${i}`)));
    const p = B(0.15 + 0.8 * s);
    const side = h01(`cs${i}`) > 0.5 ? 1 : -1;
    const off = (3 + 5 * h01(`co${i}`)) * scale * side;
    const rr = (0.7 + 0.9 * h01(`cr${i}`)) * scale;
    drops.push(<ellipse key={i} cx={f2(p[0] + off)} cy={f2(p[1])} rx={f2(rr * 0.85)} ry={f2(rr * 1.15)} fill={ink("#4A3426")} opacity={a * sst(0, 0.12, s) * (1 - sst(0.85, 1, s))} />);
  }
  // the crown where it lands
  for (let i = 0; i < 4; i++) {
    const sgn = i % 2 === 0 ? -1 : 1;
    const ph = frac(h01(`cc${i}`) + run * 0.05);
    const up = Math.sin(Math.PI * ph);
    const x = to[0] + sgn * (2.5 + 2.2 * (i >> 1) + 3 * ph) * scale;
    const y = to[1] - (2 + 5 * up) * scale;
    drops.push(<circle key={`k${i}`} cx={f2(x)} cy={f2(y)} r={f2((0.65 + 0.25 * (i >> 1)) * scale)} fill={ink("#5A4030")} opacity={a * 0.9} />);
  }
  return (
    <g>
      <path d={body} fill={ink("#4A3426")} opacity={0.96} />
      <path d={`M${hi.slice(1, -2).map(Pt).join("L")}`} stroke={ink("#C9AE8E")} strokeOpacity={0.45 * a} strokeWidth={f2(0.55 * scale)} fill="none" strokeLinecap="round" />
      {drops}
      <ellipse cx={f2(to[0])} cy={f2(to[1])} rx={f2(4 * scale)} ry={f2(1.1 * scale)} fill={ink("#6B5038")} opacity={0.7 * a} />
    </g>
  );
};

// ===================================================================================================================
// THE PAPER
// ===================================================================================================================
export const SHEET = { w: 38, l: 53, t: 2.5 } as const;
export type SheetPose = { X: number; Y: number; Z: number; yaw: number; pitch: number; roll: number; curl: number };
export const stackHeight = (n: number) => n * SHEET.t;
const D2R = Math.PI / 180;
type V3 = [number, number, number];
/** a sheet-local point (u, v in -1..1) in world units */
const sheetPt = (q: SheetPose, u: number, v: number): V3 => {
  let x = (u * SHEET.w) / 2;
  let y = -c01(q.curl) * 9 * u * u + c01(q.curl) * 3 * v * v;
  let z = (v * SHEET.l) / 2;
  // roll (about the long axis z), pitch (about x), yaw (about the vertical)
  const cr = Math.cos(q.roll * D2R);
  const sr = Math.sin(q.roll * D2R);
  [x, y] = [x * cr - y * sr, x * sr + y * cr];
  const cp = Math.cos(q.pitch * D2R);
  const sp = Math.sin(q.pitch * D2R);
  [y, z] = [y * cp - z * sp, y * sp + z * cp];
  const cy = Math.cos(q.yaw * D2R);
  const sy = Math.sin(q.yaw * D2R);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  return [q.X + x, q.Y + y, q.Z + z];
};
const sheetInk = "#6E6254";
export const WorkSheet: React.FC<{ A: AirWorld; pose: SheetPose; uid: string; drain?: number; ink?: number; shadowY?: number }> = ({ A, pose, uid, drain = 0, ink = 1, shadowY }) => {
  const P = A.P;
  const pr = (p: V3) => P.p(p[0], p[1], p[2]);
  const N = 6;
  const edge: V3[] = [];
  for (let i = 0; i < N; i++) edge.push(sheetPt(pose, -1 + (2 * i) / N, -1));
  for (let i = 0; i < N; i++) edge.push(sheetPt(pose, 1, -1 + (2 * i) / N));
  for (let i = 0; i < N; i++) edge.push(sheetPt(pose, 1 - (2 * i) / N, 1));
  for (let i = 0; i < N; i++) edge.push(sheetPt(pose, -1, 1 - (2 * i) / N));
  const scr = edge.map(pr);
  // which face is toward us: the signed area of the corners (negative = the inked face, as when lying below the eye)
  const cn = [sheetPt(pose, -1, -1), sheetPt(pose, 1, -1), sheetPt(pose, 1, 1), sheetPt(pose, -1, 1)].map(pr);
  let ar = 0;
  for (let i = 0; i < 4; i++) ar += cn[i][0] * cn[(i + 1) % 4][1] - cn[(i + 1) % 4][0] * cn[i][1];
  const frontFace = ar < 0;
  const h = -pose.Y;
  const dr = c01(drain);
  const col = (hex: string) => A.tone(mixHex(hex, DEAD, dr), pose.Z, h);
  // light: the face's normal against the upper-left light (a little darker as it tips)
  const nUp = Math.cos(pose.pitch * D2R) * Math.cos(pose.roll * D2R);
  const base = frontFace ? mixHex(CREAM, "#D9CDB4", 0.35 * (1 - Math.abs(nUp))) : mixHex(CREAM_LO, "#B9AA8C", 0.3);
  const els: React.ReactNode[] = [];
  if (shadowY !== undefined) {
    const lift = Math.max(0, shadowY - pose.Y);
    const a = 0.5 * (1 - sst(0, 220, lift)) * (1 - A.fog(pose.Z));
    if (a > 0.01) {
      const c = P.p(pose.X + 6 + lift * 0.15, shadowY, pose.Z + 4);
      els.push(
        <g key="sh">
          <defs>
            <radialGradient id={`${uid}-sh`}>
              <stop offset="0" stopColor={PAL.shadow} stopOpacity={a} />
              <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={c[0]} cy={c[1]} rx={(SHEET.w * 0.75 + lift * 0.1) * P.r(pose.Z)} ry={(SHEET.l * 0.28 + lift * 0.03) * P.r(pose.Z)} fill={`url(#${uid}-sh)`} />
        </g>,
      );
    }
  }
  els.push(<path key="b" d={poly(scr)} fill={col(base)} stroke={col("#B5A68A")} strokeWidth={f2(0.6 * P.r(pose.Z))} strokeOpacity={0.7} strokeLinejoin="round" />);
  if (frontFace && ink > 0.01) {
    let d = "";
    for (let j = 0; j < 6; j++) {
      const v = -0.62 + j * 0.21;
      const len = 0.9 + 0.55 * h01(`sl${j}`);
      const u0 = -0.72;
      const pts: P2[] = [];
      for (let k = 0; k <= 4; k++) pts.push(pr(sheetPt(pose, u0 + (len * k) / 4, v)));
      d += `M${pts.map(Pt).join("L")}`;
    }
    els.push(<path key="l" d={d} stroke={col(sheetInk)} strokeOpacity={0.42 * ink} strokeWidth={f2(1.25 * P.r(pose.Z))} fill="none" strokeLinecap="round" />);
    // the small corner mark: a tick in the far right corner
    const m = [pr(sheetPt(pose, 0.5, 0.74)), pr(sheetPt(pose, 0.6, 0.84)), pr(sheetPt(pose, 0.8, 0.62))];
    els.push(<path key="m" d={`M${m.map(Pt).join("L")}`} stroke={col("#4E5A57")} strokeOpacity={0.7 * ink} strokeWidth={f2(1.5 * P.r(pose.Z))} fill="none" strokeLinecap="round" strokeLinejoin="round" />);
  }
  return <g>{els}</g>;
};

/** a sheet's jitter in a stack (depends only on its index and the seed) */
const stackJitter = (i: number, seed: number) => ({ dx: (h01(`jx${seed}-${i}`) - 0.5) * 4, dz: (h01(`jz${seed}-${i}`) - 0.5) * 4, dyaw: (h01(`jy${seed}-${i}`) - 0.5) * 5 });
export const stackTop = (X: number, Z: number, n: number, Y = 0, yaw = 0, seed = 0): SheetPose => {
  const i = Math.max(0, Math.round(n) - 1);
  const j = stackJitter(i, seed);
  return { X: X + j.dx, Y: Y - (i + 1) * SHEET.t, Z: Z + j.dz, yaw: yaw + j.dyaw, pitch: 0, roll: 0, curl: 0 };
};
export const SheetStack: React.FC<{ A: AirWorld; X: number; Z: number; n: number; uid: string; Y?: number; yaw?: number; seed?: number; drain?: number }> = ({ A, X, Z, n, uid, Y = 0, yaw = 0, seed = 0, drain = 0 }) => {
  const P = A.P;
  const N = Math.max(0, Math.round(n));
  if (N <= 0) return null;
  const camX = P.vp[0];
  const camZ = -P.Dc;
  const dr = c01(drain);
  const els: React.ReactNode[] = [];
  const hw = SHEET.w / 2;
  const hl = SHEET.l / 2;
  const L = [-0.6, -0.8];
  const lw = 0.45 * P.r(Z);
  // shadow at the foot
  els.push(<AirShadow key="sh" A={A} X={X} Z={Z} w={SHEET.w * 0.95} d={SHEET.l * 0.6} Y={Y} uid={`${uid}-sh`} amt={0.75} />);
  const sides: string[] = ["", "", "", ""];
  const sideCol: string[] = [];
  for (let i = 0; i < N - 1; i++) {
    const j = stackJitter(i, seed);
    const cx = X + j.dx;
    const cz = Z + j.dz;
    const a = (yaw + j.dyaw) * D2R;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const corner = (u: number, v: number): [number, number] => [cx + u * hw * ca + v * hl * sa, cz - u * hw * sa + v * hl * ca];
    const cs = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    const yT = Y - (i + 1) * SHEET.t;
    const yB = Y - i * SHEET.t;
    for (let k = 0; k < 4; k++) {
      const p = cs[k];
      const q = cs[(k + 1) % 4];
      // outward normal of this side (corners run counter-clockwise seen from above)
      const nx = q[1] - p[1];
      const nz = -(q[0] - p[0]);
      const mx = (p[0] + q[0]) / 2;
      const mz = (p[1] + q[1]) / 2;
      const facing = nx * (camX - mx) + nz * (camZ - mz);
      if (facing * -1 <= 0) continue;
      sides[k] += poly([P.p(p[0], yB, p[1]), P.p(q[0], yB, q[1]), P.p(q[0], yT, q[1]), P.p(p[0], yT, p[1])]);
      if (!sideCol[k]) {
        const nl = Math.hypot(nx, nz) || 1;
        const ndl = -((nx / nl) * L[0] + (nz / nl) * L[1]);
        sideCol[k] = mixHex("#CDBFA4", "#EEE5D2", c01(0.5 + 0.5 * ndl));
      }
    }
  }
  const zM = Z;
  const hM = -(Y - (N * SHEET.t) / 2);
  const tone = (hex: string) => A.tone(mixHex(hex, DEAD, dr), zM, hM);
  sides.forEach((d, k) => {
    if (d) els.push(<path key={`s${k}`} d={d} fill={tone(sideCol[k] ?? "#E2D8C4")} stroke={tone("#A4957A")} strokeWidth={f2(lw)} strokeOpacity={0.55} strokeLinejoin="round" />);
  });
  // the top sheet: a WorkSheet at exactly stackTop (its own edge thickness drawn as one side band)
  const top = stackTop(X, Z, N, Y, yaw, seed);
  const tb: SheetPose = { ...top, Y: top.Y + SHEET.t };
  const ring = [sheetPt(tb, -1, -1), sheetPt(tb, 1, -1), sheetPt(tb, 1, 1), sheetPt(tb, -1, 1)];
  const ringT = [sheetPt(top, -1, -1), sheetPt(top, 1, -1), sheetPt(top, 1, 1), sheetPt(top, -1, 1)];
  let band = "";
  for (let k = 0; k < 4; k++) {
    const p = ring[k];
    const q = ring[(k + 1) % 4];
    const nx = q[2] - p[2];
    const nz = -(q[0] - p[0]);
    if (-(nx * (camX - (p[0] + q[0]) / 2) + nz * (camZ - (p[2] + q[2]) / 2)) <= 0) continue;
    band += poly([P.p(p[0], p[1], p[2]), P.p(q[0], q[1], q[2]), P.p(ringT[(k + 1) % 4][0], ringT[(k + 1) % 4][1], ringT[(k + 1) % 4][2]), P.p(ringT[k][0], ringT[k][1], ringT[k][2])]);
  }
  if (band) els.push(<path key="tb" d={band} fill={tone("#E2D8C4")} stroke={tone("#A4957A")} strokeWidth={f2(lw)} strokeOpacity={0.55} />);
  if (top.Y > P.horizonY) els.push(<WorkSheet key="top" A={A} pose={top} uid={`${uid}-top`} drain={dr} />);
  return <g>{els}</g>;
};

/** an arc from a pose to a pose with a little curl and flutter; exactly `to` at t = 1 */
export const sheetFlight = (from: { X: number; Y: number; Z: number; yaw?: number }, to: SheetPose, t: number, seed = 0): SheetPose => {
  const u = c01(t);
  const s = 1 - Math.pow(1 - u, 1.7);
  const dist = Math.hypot(to.X - from.X, to.Z - from.Z, to.Y - from.Y);
  const apex = 30 + 0.32 * dist;
  const rest = Math.pow(1 - s, 1.3);
  const ph = seed * 1.7;
  const yaw0 = from.yaw ?? to.yaw;
  return {
    X: lerp(from.X, to.X, s) + 10 * Math.sin(Math.PI * s) * Math.sin(ph + 1),
    Y: lerp(from.Y, to.Y, s) - apex * 4 * s * (1 - s),
    Z: lerp(from.Z, to.Z, s) + 8 * Math.sin(Math.PI * s) * Math.cos(ph),
    yaw: lerp(yaw0, to.yaw, s) + 24 * Math.sin(Math.PI * s) * Math.sin(ph),
    pitch: 16 * Math.sin(2 * Math.PI * 1.6 * u + ph) * rest,
    roll: 22 * Math.sin(2 * Math.PI * 1.1 * u + ph + 0.8) * rest,
    curl: 0.75 * Math.sin(Math.PI * Math.min(1, s * 1.15)) * rest,
  };
};

/** a crumpled ball (crumple 0 = the flat sheet facing us, 1 = the ball) in the image plane at (X, Y, Z) = its centre */
export const CrumpledSheet: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; uid: string; seed?: number; crumple?: number; drain?: number; size?: number; rot?: number }> = ({ A, X, Y, Z, uid, seed = 0, crumple = 1, drain = 0, size = 1, rot = 0 }) => {
  const P = A.P;
  const c = P.p(X, Y, Z);
  const r = P.r(Z);
  const e = sst(0, 1, c01(crumple));
  const RB = 13 * size;
  const n = 26;
  const rr = (k: string) => h01(`${k}${seed}`);
  const rotA = (rot + 40 * rr("ro")) * D2R;
  const pts: P2[] = [];
  const sw = (SHEET.w / 2) * size;
  const sl = (SHEET.l / 2) * size;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    // the flat sheet's outline along this ray, and the ball's lumpy radius
    const tr = Math.min(sw / Math.max(1e-6, Math.abs(ca)), sl / Math.max(1e-6, Math.abs(sa)));
    const lump = RB * (1 + 0.22 * (rr(`l${i}`) - 0.5) * 2 + 0.08 * Math.sin(a * 3 + seed));
    const R0 = lerp(tr, lump, e);
    const a2 = a + (e * (rr(`a${i}`) - 0.5) * 0.12);
    pts.push([c[0] + R0 * r * Math.cos(a2 + rotA * e), c[1] + R0 * r * Math.sin(a2 + rotA * e)]);
  }
  const d = poly(pts);
  const dr = c01(drain);
  const col = (hex: string) => A.tone(mixHex(hex, DEAD, dr), Z, -Y);
  const els: React.ReactNode[] = [];
  els.push(
    <defs key="df">
      <clipPath id={`${uid}-cl`}>
        <path d={d} />
      </clipPath>
      <radialGradient id={`${uid}-lt`} cx="0.32" cy="0.3" r="0.85">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.25 * e} />
        <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
        <stop offset="0.75" stopColor={PAL.shadow} stopOpacity={0.12 * e} />
        <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.4 * e} />
      </radialGradient>
    </defs>,
  );
  els.push(<path key="b" d={d} fill={col(e > 0.5 ? mixHex(CREAM, "#E2D7C2", 0.4) : CREAM)} stroke={col("#B5A68A")} strokeWidth={f2(0.6 * r)} strokeOpacity={0.6} strokeLinejoin="round" />);
  const inner: React.ReactNode[] = [];
  // the ink lines while it is still a sheet
  if (e < 0.98) {
    let ld = "";
    for (let j = 0; j < 6; j++) {
      const y = (-0.62 + j * 0.21) * sl;
      const len = (0.9 + 0.55 * h01(`sl${j}`)) * sw;
      ld += `M${f2(c[0] - 0.72 * sw * r)},${f2(c[1] + y * r)}l${f2(len * r)},0`;
    }
    inner.push(<path key="ln" d={ld} stroke={col(sheetInk)} strokeOpacity={0.42 * (1 - e)} strokeWidth={f2(1.25 * r)} fill="none" />);
  }
  // facets and creases come in with the crumple
  if (e > 0.02) {
    for (let k = 0; k < 5; k++) {
      const i0 = Math.floor(rr(`f${k}`) * n);
      const q0 = pts[i0];
      const q1 = pts[(i0 + 3 + Math.floor(rr(`g${k}`) * 4)) % n];
      const m: P2 = [c[0] + (rr(`m${k}`) - 0.5) * RB * r, c[1] + (rr(`n${k}`) - 0.5) * RB * r];
      inner.push(<path key={`f${k}`} d={poly([q0, m, q1])} fill={col(k % 2 ? "#BFB196" : "#FFF9EC")} opacity={(k % 2 ? 0.32 : 0.28) * e} />);
    }
    let cr = "";
    for (let k = 0; k < 7; k++) {
      const a = rr(`c${k}`) * Math.PI * 2;
      const r0 = rr(`d${k}`) * 0.5 * RB;
      const r1 = RB * 1.1;
      const bend = (rr(`e${k}`) - 0.5) * 0.9;
      cr += `M${f2(c[0] + Math.cos(a) * r0 * r)},${f2(c[1] + Math.sin(a) * r0 * r)}L${f2(c[0] + Math.cos(a + bend * 0.5) * (r0 + r1) * 0.5 * r)},${f2(c[1] + Math.sin(a + bend * 0.5) * (r0 + r1) * 0.5 * r)}L${f2(c[0] + Math.cos(a + bend) * r1 * r)},${f2(c[1] + Math.sin(a + bend) * r1 * r)}`;
    }
    inner.push(<path key="cr" d={cr} stroke={col("#9C8D72")} strokeOpacity={0.55 * e} strokeWidth={f2(0.8 * r)} fill="none" strokeLinejoin="round" strokeLinecap="round" />);
    inner.push(<rect key="lt" x={f2(c[0] - RB * 1.4 * r)} y={f2(c[1] - RB * 1.4 * r)} width={f2(RB * 2.8 * r)} height={f2(RB * 2.8 * r)} fill={`url(#${uid}-lt)`} />);
  }
  els.push(
    <g key="in" clipPath={`url(#${uid}-cl)`}>
      {inner}
    </g>,
  );
  return <g>{els}</g>;
};
/** a mound of n balls: offsets from the heap's foot (dy = the ball's centre height, up -) */
export const heapLayout = (n: number, seed = 0, R = 13): { dx: number; dy: number; dz: number }[] => {
  const out: { dx: number; dy: number; dz: number }[] = [];
  const base = Math.max(1, Math.ceil(Math.sqrt(2 * n)));
  let layer = 0;
  while (out.length < n) {
    const cnt = Math.max(1, base - layer);
    for (let i = 0; i < cnt && out.length < n; i++) {
      const jx = (h01(`hx${seed}-${layer}-${i}`) - 0.5) * R * 0.5;
      const jz = (h01(`hz${seed}-${layer}-${i}`) - 0.5) * R * 1.4;
      out.push({ dx: (i - (cnt - 1) / 2) * R * 1.75 + jx, dy: -(R * 0.92 + layer * R * 1.45), dz: jz });
    }
    layer++;
  }
  return out;
};

// ===================================================================================================================
// THE SHELF AND THE YEAR BINDERS
// ===================================================================================================================
export const Shelf: React.FC<{ A: AirWorld; X0: number; X1: number; Y: number; Z: number; uid: string; D?: number }> = ({ A, X0, X1, Y, Z, uid, D = 62 }) => (
  <g>
    {[X0 + 34, X1 - 34].map((bx, i) => (
      <g key={i}>
        <AirBox A={A} X0={bx - 3} X1={bx + 3} Y0={Y + 8} Y1={Y + 44} Z0={Z + D - 8} Z1={Z + D - 2} mat={MAT.iron} uid={`${uid}-bv${i}`} rim={0.3} />
        <AirBox A={A} X0={bx - 3} X1={bx + 3} Y0={Y + 8} Y1={Y + 13} Z0={Z + 12} Z1={Z + D - 2} mat={MAT.iron} uid={`${uid}-bh${i}`} rim={0.3} />
      </g>
    ))}
    <AirBox A={A} X0={X0} X1={X1} Y0={Y} Y1={Y + 8} Z0={Z} Z1={Z + D} mat={MAT_SHELF} uid={`${uid}-pl`} />
  </g>
);
export const BINDER = { w: 22, h: 62, d: 54 } as const;
export const shelfSlots = (X0: number, X1: number, n: number, gap = 2.5): number[] => Array.from({ length: n }, (_, i) => X0 + 14 + BINDER.w / 2 + i * (BINDER.w + gap)).filter((x) => x + BINDER.w / 2 <= X1 - 6);
export const YearBinder: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; text: string; uid: string; color?: number; pull?: number }> = ({ A, X, Y, Z, text, uid, color = 0, pull = 0 }) => {
  const P = A.P;
  const m = BINDER_MATS[((Math.round(color) % BINDER_MATS.length) + BINDER_MATS.length) % BINDER_MATS.length];
  const Z0 = Z - pull;
  const { w, h, d } = BINDER;
  const r = P.r(Z0);
  const t = (hex: string) => A.tone(hex, Z0, -Y + h / 2);
  const lab = [P.p(X - w / 2 + 3.5, Y - h + 9, Z0), P.p(X + w / 2 - 3.5, Y - h + 36, Z0)];
  const lc: P2 = [(lab[0][0] + lab[1][0]) / 2, (lab[0][1] + lab[1][1]) / 2];
  const vertical = text.length > 2;
  const fs = (vertical ? 9.5 : 12.5) * r;
  const hole = P.p(X, Y - 13, Z0);
  return (
    <g>
      <AirBox A={A} X0={X - w / 2} X1={X + w / 2} Y0={Y - h} Y1={Y} Z0={Z0} Z1={Z0 + d} mat={m} uid={`${uid}-b`} />
      <rect x={f2(lab[0][0])} y={f2(lab[0][1])} width={f2(lab[1][0] - lab[0][0])} height={f2(lab[1][1] - lab[0][1])} rx={f2(1.2 * r)} fill={t("#EDE4D1")} />
      <text
        x={f2(lc[0])}
        y={f2(lc[1])}
        fill={t("#3A2D25")}
        textAnchor="middle"
        dominantBaseline="central"
        transform={vertical ? `rotate(-90 ${f2(lc[0])} ${f2(lc[1])})` : undefined}
        style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: fs, fontVariantNumeric: "lining-nums" }}
      >
        {text}
      </text>
      <circle cx={f2(hole[0])} cy={f2(hole[1])} r={f2(4.2 * r)} fill={t(mixHex(m.dark, PAL.shadow, 0.3))} stroke={t(m.lit)} strokeWidth={f2(1 * r)} />
    </g>
  );
};
