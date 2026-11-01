// ---------------------------------------------------------------------------
// burdenWorld: THE TROOPS-AND-CASH LEDGER of the clip sarah-gulf-war (cuts 69 SmallPotatoes, 74, 80). Owner: the cut 69
// builder. Read-only for everyone else; additions keep the old exports and are logged in the clip's
// animation_source/notes/SHARED_CHANGES.md. Marker: animation_source/notes/BURDEN_READY.md.
// Dwarkesh 3D style (styles/dwarkesh-3d.md) carried to a FLAT 2D isotype ledger (the user, after cut 26: "more of a 2d
// graphic vibe ... mostly graphs and stuff"): flat gouache icons and type on soft plates INSIDE the style's teal air
// (<AirStage>: graded air, shafts, motes, grain, vignette, a faint bloom on orange). No 3D volumes, no axes.
// The type and the plates are the clip's chart family (gulfChart.tsx: FONT, TYPE, the radial plate, the casing),
// copied here so this world does not move when that module does.
//
// UNITS: world px of a 2D camera (kits/maps/incaShared Cam {k, cx, cy}; screen = 540 + (X - cx) k, 960 + (Y - cy) k).
// X across (0 = the ledger's centre), Y down, the feet line of the bottom rank Y = 0. Icons and bundles are baked once
// to sprites (the gouache paint, kyle-pandemics/pandemicFolkPaint) and blitted on a canvas under the same camera; the
// plates are SVG inside <WorldSvg cam>.
//
// API
//   FPS_BURDEN (24), CUT69_LEN (87): the clip's rate and cut 69's length. A JOINED CUT RUNS ON WORLD TIME:
//     wf = WF_74 + frame (cut 74 opens on cut 69's last frame f86, so WF_74 = 86) and passes wf to every call below
//     (breathing, motes, grain and the camera sway continue without a jump).
//   ICON_H, PITCH_X, PITCH_Y, BLOCK_GAP, ROWS, PER_ICON, ALLIES, US   the grid (rev 2): 1 icon = 25,000 troops; ALLIES
//     2 cols x 4 ranks = 8 (200,000+), US 7 x 4 = 28 (700,000); { cols, x0 (first column's centre X), x1 (last), cx (the
//     block's VISUAL centre X: plates centre on it), left / right (outer silhouette edges X), top (helmet tops Y) }
//   iconAt(block, i) -> { X, Y }   the feet of icon i (row-major from the top-left, row 0 = the top rank)
//   US_MARCH { enter, halt, decel, v, stride }; usOffset(wf) -> world dX of the US block (0 once halted, f34 on)
//   marchPhase(wf) -> the gait phase (0 = standing; the march ends exactly on 0)
//   PLATE_TOP, PLATE_BOTTOM   the Y under the blocks where the plates sit (top of the name line / bottom of the halo)
//   camAt(wf) -> Cam   cut 69's camera (before swayCam); END_CAM = camAt(86); END_K, END_ANCHOR (the plate bottom's
//     screen y, 1062 + LEDGER_DROP on every frame); CAM_SLOPE_END (d ln k / df and d cx / df at f86) for a continuing camera
//   burdenAirOf(cam, rest, wf) -> AirWorld-like { v }   the medium: the horizon held at screen y HORIZON_SY (a far
//     backdrop does not zoom), motes parallax the dolly AND the rise of the pull-back; REST_CAM = swayCam(camAt(0), 0)
//   drainAt(wf) / veilAt(wf)   cut 69's drain of the troops toward DEAD (0 -> 0.15) and their air veil (0.04 -> 0.10)
//   SPRITE_REQS, useBurdenSprites() -> get   bake the soldier (20 gait phases) and the bundle once per render tab
//   drawTroops(ctx, get, cam, wf, o?)   paint both blocks: o = { usOff, phase, drain, veil, air (RGB of the veil),
//     only?: "allies" | "us", alpha? }  (defaults: cut 69's state at wf)
//   <TroopCanvas cam wf get o?>   the same as a full-frame canvas layer
//   CASH: BUNDLE_W, BUNDLE_H (world px of one banknote bundle seen from the side, ACCENT orange, a darker paper strap)
//     planCash(spec, wf) -> BundleDraw[]   spec { cx, baseY, cols, n, landAt(i) (the frame bundle i touches down),
//       fall? (frames, default 8), fromY (world Y it falls from: above the frame top), gapX? }: bundles fill layer by
//       layer from the bottom, each falling in an accelerating drop onto the one below (cause before effect: the
//       landing bundle touches the stack on landAt), a 4-frame squash on landing, a hair of hand-placed jitter
//     drawCash(ctx, get, cam, bundles, o?)  /  <CashCanvas cam get bundles />
//     stackTop(spec, n) -> the world Y of the stack's top after n bundles
//   <BurdenDefs uid />   put once inside a <WorldSvg> before any plate
//   <BurdenPlate uid x y name num o lift tone? size?>   a two-line label on its soft plate, centred at x, its name line's
//     top at y: name (Libre Caslon, title case, TYPE.name) over number (Caslon, TYPE.num); tone "troops" (cream) | "cash" (the number
//     in the pale accent, for "$50B+" / "+$14B"); o / lift from enterText()
//   enterText(wf, f0, dur?) -> { o, lift }   text slides up while fading in (dur 10 f)
//   FONT, TYPE, COL
//
// THE SOLDIER (rev 2): one isotype icon, a stocky 1991 US / coalition infantryman (~3.7 heads) in profile facing LEFT
// (the march travels left, CRAFT: a drawn thing travels the way it points): khaki-tan desert uniform, a darker
// olive-khaki PASGT helmet (clear front brim, flared back skirt), a warm face under it, an olive pack, a web belt, dark
// brown boots, an M16 in dark umber held across the chest with both hands; the gouache crescent shadow and texture, no
// outline. 20 gait phases (legs scissor +-18 deg about the hip; the figure drops so the lower foot stays on the
// ground); phase 0 is the standing pose. (Rev 1's thin cream figure read as bones at phone size.)
//
// SOURCES (COMMON.md, verified for the clip):
//   US troops in theater 1990-91: 694,550 (CRS RL32492, Table 8: 584,342 active + 110,208 recalled) -> "700,000",
//     drawn as 70 icons. Non-US coalition troops: well over 200,000 (UK 53,462, Saudi Arabia 60,000, Egypt 40,000,
//     France 18,000, Syria 14,500 ...) -> "200,000+", drawn as 20 icons.
//   Cash (cuts 74, 80): Congress (Apr 1992) put the US cost at $61.1B, about $52-54B paid by other countries ->
//     "$50B+"; the Gulf Crisis Financial Co-ordination Group's $14B to frontline states -> "+$14B".
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { ACCENT, ACCENT_DEEP, AIR, AIR_SCENE_EYE, DEAD, Paint, c01, makeAirView, mixHex, rgbHex, swayCam, type AirView, type Cam, type RGB } from "../kits/dwarkesh-3d/dwarkesh3d";

// ---- clip constants -----------------------------------------------------------------------------------------------
export const FPS_BURDEN = 24;
export const CUT69_LEN = 87;
/** cut 74 opens on cut 69's last frame: its world frame is WF_74 + frame */
export const WF_74 = CUT69_LEN - 1;

// ---- fonts, type, colours (the clip's chart family, gulfChart.tsx) ------------------------------------------------
const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: caslon } = loadCaslon("normal", { weights: ["400"], subsets: ["latin"] });
/** rev 2: names in Libre Caslon like the clip's charts (gulfChart rev 2 FONT.label); Fell SC kept for any title */
export const FONT = { sc: fellSC, num: caslon, label: caslon };
/** world px (rev 2): sized so the END camera (k 0.625) still shows names at 44 px and numbers at 64 px (>= the cut-6
 *  chart labels at phone size: ~11 / ~16 px when the frame is 270 px wide) */
export const TYPE = { name: 70, num: 102 };
const PAL = AIR.A;
export const COL = {
  cream: PAL.cream,
  creamLo: PAL.creamLo,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  accentPale: "#FFD27A",
  dead: DEAD,
  shadow: PAL.shadow,
  line: PAL.line,
};

// ---- small helpers ------------------------------------------------------------------------------------------------
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const sst = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
const out3 = (u: number) => 1 - Math.pow(1 - c01(u), 3);
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
type Pt = [number, number];
/** screen point of a world point */
export const toScreen = (cam: Cam, X: number, Y: number): Pt => [540 + (X - cam.cx) * cam.k, 960 + (Y - cam.cy) * cam.k];

// ===================================================================================================================
// THE GRID (rev 2: 1 icon = 25,000 troops; bigger icons, fewer)
// ===================================================================================================================
/** an icon's height (world px, helmet top to soles): ~125 px on screen at f0, 112 at f40, 70 at f86 */
export const ICON_H = 112;
/** column and rank pitch */
export const PITCH_X = 80;
export const PITCH_Y = 126;
/** centre to centre from the allies' last column to the US first column: the allies' plate is far wider than its
 *  two columns, so the blocks stand apart enough for a clear gap between the two numbers (~107 world px) */
export const BLOCK_GAP = 260;
export const ROWS = 4;
/** troops per icon */
export const PER_ICON = 25000;
/** the icon's silhouette reach from its column centre (world px): the muzzle forward (left), the pack behind */
export const ICON_REACH = { front: 35, back: 25 };
/** the first column's centre: the whole ledger WITH the allies' plate (wider than its block) centred on X 0 */
const X_FIRST = -328;
const blockOf = (cols: number, x0: number) => {
  const x1 = x0 + (cols - 1) * PITCH_X;
  const left = x0 - ICON_REACH.front;
  const right = x1 + ICON_REACH.back;
  // cx: the VISUAL centre of the block (its silhouettes' extent): plates centre on it
  return { cols, rows: ROWS, n: cols * ROWS, x0, x1, cx: (left + right) / 2, left, right, top: -(ROWS - 1) * PITCH_Y - ICON_H };
};
/** 2 x 4 = 8 icons (200,000+) */
export const ALLIES = blockOf(2, X_FIRST);
/** 7 x 4 = 28 icons (700,000) */
export const US = blockOf(7, X_FIRST + PITCH_X + BLOCK_GAP);
export type Block = typeof ALLIES;
/** the feet of icon i of a block (row-major from the top-left; row 0 = the top rank) */
export const iconAt = (b: Block, i: number) => {
  const r = Math.floor(i / b.cols);
  const c = i % b.cols;
  return { X: b.x0 + c * PITCH_X, Y: -(ROWS - 1 - r) * PITCH_Y, r, c };
};

// ===================================================================================================================
// THE PLATES' PLACE AND THE CAMERA
// ===================================================================================================================
export const PLATE_TOP = 26;
/** the bottom of the plates' soft halo (the text ends ~16 above it) */
export const PLATE_BOTTOM = 222;
/** screen px every piece of the troops-and-cash ledger (cuts 69, 74, 80) sits lower than first delivered (user's note);
 *  it lives in the vertical solve (END_ANCHOR), and burdenAirOf takes it back out, so the air stays put */
export const LEDGER_DROP = 80;
/** the plate bottom's screen y on every frame of cut 69 (the user allows the plates into the old 1080 caption band) */
export const END_ANCHOR = 1062 + LEDGER_DROP;
/** the camera's channels, each C1 (no kinks), in ln k: MOVE 1 (f0-40) eases out of a moving start (truck right and
 *  widen as the US block arrives); a DRIFT out runs under everything, slow (d0) through the first half and ramping
 *  (f62-80) to a visible creep (d1) that carries the tail f76-86 and on into cut 74; MOVE 2, the pull-back on
 *  "small potatoes" (f58-80), one smootherstep lobe sized so k = kEnd at f86 */
export const CAM = { k0: 1.12, k1: 1.0, m1: 40, d0: -0.0008, d1: -0.005, dr0: 62, dr1: 80, p0: 58, p1: 80, kEnd: 0.625, cx0: 0, cxEnd: 38 };
const easeOut2 = (u: number) => 1 - (1 - c01(u)) * (1 - c01(u));
const smoother = (u: number) => {
  const v = c01(u);
  return v * v * v * (v * (6 * v - 15) + 10);
};
/** the integral of a smoothstep 0 -> 1 over [0, u] */
const sstInt = (u: number) => (u <= 0 ? 0 : u >= 1 ? 0.5 + (u - 1) : u * u * u - (u * u * u * u) / 2);
const driftInt = (f: number) => CAM.d0 * f + (CAM.d1 - CAM.d0) * (CAM.dr1 - CAM.dr0) * sstInt((f - CAM.dr0) / (CAM.dr1 - CAM.dr0));
const LK0 = (f: number) => Math.log(CAM.k0) + (Math.log(CAM.k1) - Math.log(CAM.k0)) * easeOut2(f / CAM.m1) + driftInt(f);
const PULL = Math.log(CAM.kEnd) - LK0(CUT69_LEN - 1);
const LK = (f: number) => LK0(f) + PULL * smoother((f - CAM.p0) / (CAM.p1 - CAM.p0));
/** f0: the allies' block (and its plate) left of centre, x 430 */
const CX0 = ALLIES.cx - (430 - 540) / CAM.k0;
const CX = (f: number) => CX0 * (1 - easeOut2(f / CAM.cxEnd));
/** cut 69's camera (apply swayCam(cam, wf) on top): the zoom and the pan are keyed, the vertical is SOLVED so the plates'
 *  bottom (world PLATE_BOTTOM) sits at screen y END_ANCHOR on every frame: the pull-back gathers the ledger down onto
 *  that line and opens the air above it */
export const camAt = (wf: number): Cam => {
  const k = Math.exp(LK(wf));
  return { k, cx: CX(wf), cy: PLATE_BOTTOM - (END_ANCHOR - 960) / k };
};
export const END_CAM = camAt(CUT69_LEN - 1);
export const END_K = END_CAM.k;
/** the camera the motes and shafts parallax against (cut 69 f0, swayed) */
export const REST_CAM = swayCam(camAt(0), 0);
export const CAM_SLOPE_END = { dlnk: LK(CUT69_LEN - 0.5) - LK(CUT69_LEN - 1.5), dcx: CX(CUT69_LEN - 0.5) - CX(CUT69_LEN - 1.5) };

// ===================================================================================================================
// THE MARCH (cut 69): the US block, one rigid block, at constant speed from beyond the right frame edge (its front
// column cut by the edge as it marches in from f3), a halting step over the last 7 frames (a cosine fall of the
// speed), still from f34.
// ===================================================================================================================
const MARCH_IN = 3;
const HALT = 34;
const DECEL = 7;
/** the speed that brings the front's muzzles to the right frame edge on MARCH_IN */
const V_MARCH = (camAt(MARCH_IN).cx + 540 / camAt(MARCH_IN).k + 4 - US.left) / (HALT - DECEL - MARCH_IN + DECEL / 2);
/** stride: the gait advances exactly 0.1 cycle (2 of the 20 baked phases) per frame at full speed */
export const US_MARCH = { enter: MARCH_IN, halt: HALT, decel: DECEL, v: V_MARCH, stride: V_MARCH / 0.2 };
/** world dX of the US block from its halted place */
export const usOffset = (wf: number) => {
  const { halt, decel, v } = US_MARCH;
  const f1 = halt - decel;
  if (wf >= halt) return 0;
  if (wf <= f1) return v * (f1 - wf) + (v * decel) / 2;
  // the speed falls as a half cosine over the decel: distance left = integral of v (1 + cos(pi s / decel)) / 2
  const s = wf - f1;
  return (v / 2) * (decel - s - (decel / Math.PI) * Math.sin((Math.PI * s) / decel));
};
/** the gait phase: distance marched / (2 strides), ending exactly at 0 (standing) on the halt */
export const marchPhase = (wf: number) => -usOffset(wf) / (2 * US_MARCH.stride);

// ===================================================================================================================
// THE AIR
// ===================================================================================================================
/** the horizon's screen row, held (a far backdrop does not zoom with a dolly): the ledger sits in mid-petrol air and the
 *  lower frame sinks into the dense espresso air, as in the clip's charts */
export const HORIZON_SY = 240;
const D_REF = 1800;
/** the eye's distance: half of a zoom is a dolly (as gulfChart / airWorldOf) */
const dcOf = (k: number) => D_REF * Math.pow(1 / k, 0.5);
const worldYAt = (cam: Cam, sy: number) => cam.cy + (sy - 960) / cam.k;
export const burdenAirOf = (cam: Cam, rest: Cam, wf: number): { v: AirView } => {
  const Dc = dcOf(cam.k);
  const v = makeAirView({
    scene: { ...AIR_SCENE_EYE, F: Dc * cam.k },
    frame: wf,
    horizon: HORIZON_SY,
    // the eye rides the horizon row: as the pull-back rises the motes sink past it. Read at the row LEDGER_DROP lower:
    // the same world Y as before the drop, on any camera solved with it, so the air stays exactly where it was
    cam: { x: cam.cx, y: -worldYAt(cam, HORIZON_SY + LEDGER_DROP), z: -Dc },
    rest: { x: rest.cx, y: -worldYAt(rest, HORIZON_SY + LEDGER_DROP), z: -dcOf(rest.k) },
  });
  return { v };
};

/** cut 69's drain of the troops toward the dim tone on "small potatoes", and their veil of air */
export const drainAt = (wf: number) => 0.15 * sst((wf - 62) / 20);
export const veilAt = (wf: number) => 0.04 + 0.06 * sst((wf - 62) / 20);

// ===================================================================================================================
// THE SOLDIER (rev 2; figure units: 512 tall, feet y 0, facing -x). A stocky 1991 desert infantryman, ~3.7 heads
// tall: khaki-tan desert uniform, a darker olive-khaki PASGT helmet with a clear front brim and a flared back skirt,
// a warm face under the brim, an olive field pack, a web belt, dark brown boots, an M16 (dark umber) held across the
// chest at the low ready, its muzzle out past the chest, both mitten hands on it.
// ===================================================================================================================
const INK = {
  body: "#A8936A",
  bodyLit: "#AE9A71",
  far: Paint.mixC("#A8936A", "#2C3433", 0.26),
  pack: "#857C55",
  belt: "#7E6C4A",
  helmet: "#7A724E",
  boot: "#4E3C2C",
  bootFar: "#3F3024",
  rifle: "#30261E",
  skin: "#D8A47C",
};
const HIP: Pt = [0, -196];
// a trouser leg in local units (y down from the hip; x - = forward), to the boot top
const LEG: (string | Pt)[] = ["M", [-40, -14], "Q", [-43, 48], [-35, 96], "Q", [-31, 124], [-29, 152], "L", [29, 152], "Q", [31, 124], [35, 96], "Q", [43, 42], [41, -14], "Z"];
// the boot: a high desert boot, the toe forward
const BOOT: (string | Pt)[] = ["M", [-31, 142], "L", [29, 142], "L", [31, 176], "Q", [33, 196], [18, 196], "L", [-58, 196], "Q", [-72, 196], [-68, 182], "Q", [-63, 166], [-31, 158], "Z"];
const SOLE: Pt[] = [
  [-62, 196],
  [22, 196],
];
const pathOf = (cmds: (string | Pt)[], tf: (p: Pt) => Pt) => cmds.map((c) => (typeof c === "string" ? c : tf(c).map(n2).join(","))).join(" ");
const rotAbout = (th: number, o: Pt, dy: number) => (p: Pt): Pt => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  return [o[0] + p[0] * c - p[1] * s, o[1] + p[0] * s + p[1] * c + dy];
};
const shift = (dy: number) => (p: Pt): Pt => [p[0], p[1] + dy];
/** a limb along a centreline with a width per point, round-capped: a filled path */
const limb = (pts: Pt[], w: number[]) => {
  const nrm = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l] as Pt;
  });
  const L = pts.map((p, i) => [p[0] + (nrm[i][0] * w[i]) / 2, p[1] + (nrm[i][1] * w[i]) / 2] as Pt);
  const R = pts.map((p, i) => [p[0] - (nrm[i][0] * w[i]) / 2, p[1] - (nrm[i][1] * w[i]) / 2] as Pt);
  const P = (q: Pt) => q.map(n2).join(",");
  const rE = w[w.length - 1] / 2;
  const r0 = w[0] / 2;
  return `M${P(L[0])} ${L.slice(1).map((q) => `L${P(q)}`).join(" ")} A${n2(rE)},${n2(rE)} 0 0 1 ${P(R[R.length - 1])} ${R.slice(0, -1)
    .reverse()
    .map((q) => `L${P(q)}`)
    .join(" ")} A${n2(r0)},${n2(r0)} 0 0 1 ${P(L[0])} Z`;
};
// a stocky torso in a desert field jacket: a deep chest forward, a straight back, the shoulders under the helmet skirt
const TORSO: (string | Pt)[] = ["M", [-40, -380], "C", [-74, -376], [-92, -348], [-92, -304], "C", [-92, -262], [-84, -226], [-74, -186], "L", [64, -186], "C", [72, -228], [76, -300], [70, -340], "C", [64, -370], [32, -384], [-40, -380], "Z"];
const BELT: (string | Pt)[] = ["M", [-80, -222], "L", [68, -222], "L", [66, -198], "L", [-76, -198], "Z"];
const PACK: (string | Pt)[] = ["M", [52, -372], "C", [96, -378], [118, -362], [118, -330], "L", [118, -258], "C", [118, -238], [104, -228], [82, -228], "L", [56, -230], "Z"];
// the face in profile under the brim: brow, nose, lips, chin, jaw (a warm patch: no features but the profile)
const FACE: (string | Pt)[] = ["M", [-62, -426], "L", [-66, -412], "L", [-80, -398], "Q", [-83, -390], [-70, -388], "L", [-68, -380], "Q", [-62, -366], [-44, -364], "L", [-12, -366], "L", [14, -380], "L", [26, -424], "Z"];
// the PASGT helmet in profile: the front brim over the brow, the high dome, the deep back skirt flaring at the nape
const HELMET: (string | Pt)[] = [
  "M", [-96, -420],
  "C", [-100, -442], [-86, -490], [-48, -507],
  "C", [-16, -520], [36, -518], [64, -497],
  "C", [86, -478], [90, -448], [88, -426],
  "L", [98, -390],
  "C", [82, -379], [60, -381], [46, -390],
  "L", [22, -410],
  "C", [-14, -414], [-56, -417], [-96, -420],
  "Z",
];
// the rifle (an M16A2, simplified) along its axis: u from the butt (0) to the muzzle (208), v across (+ = the side the
// magazine and grip hang); held across the chest at the low ready, the muzzle out past the chest, a little up
const R_B: Pt = [62, -236];
const R_M: Pt = [-164, -338];
const R_V = 1.35;
const rifleTf = (dy: number) => {
  const L = Math.hypot(R_M[0] - R_B[0], R_M[1] - R_B[1]);
  const d: Pt = [(R_M[0] - R_B[0]) / L, (R_M[1] - R_B[1]) / L];
  const nrm: Pt = [d[1], -d[0]];
  const flip = nrm[1] < 0 ? -1 : 1;
  return (p: Pt): Pt => {
    const u = (p[0] / 208) * L;
    const v = p[1] * flip * R_V;
    return [R_B[0] + u * d[0] + v * nrm[0], R_B[1] + u * d[1] + v * nrm[1] + dy];
  };
};
const RIFLE: (string | Pt)[] = [
  // stock
  "M", [0, -12], "L", [0, 15], "L", [54, 7], "L", [54, -8], "Z",
  // receiver, carry handle
  "M", [50, -10], "L", [112, -9], "L", [112, 8], "L", [50, 9], "Z",
  "M", [62, -10], "L", [64, -20], "L", [98, -20], "L", [100, -10], "Z",
  // magazine (curving forward), pistol grip (raked back)
  "M", [86, 7], "L", [100, 7], "L", [104, 40], "L", [91, 41], "Z",
  "M", [60, 7], "L", [71, 7], "L", [65, 29], "L", [53, 27], "Z",
  // handguard, barrel, front sight
  "M", [110, -8], "L", [162, -7], "L", [162, 7], "L", [110, 8], "Z",
  "M", [160, -3.5], "L", [208, -3], "L", [208, 3], "L", [160, 3.5], "Z",
  "M", [174, -3], "L", [176, -15], "L", [182, -15], "L", [183, -3], "Z",
];
const FAR_HAND_U = 138;
const AMP = (18 * Math.PI) / 180;
export const GAIT_PHASES = 20;
/** the soldier's shapes at gait phase p (0..1; 0 = standing, legs together) */
export const soldierShapes = (p: number): Paint.Shape[] => {
  const s = Math.sin(2 * Math.PI * p);
  const thN = AMP * s;
  const thF = -AMP * s;
  // drop the figure so the lower foot stays on the ground
  const lowY = Math.max(...[thN, thF].flatMap((th) => SOLE.map((q) => rotAbout(th, HIP, 0)(q)[1])));
  const dy = 0 - lowY;
  const sh = 2.4;
  const rt = rifleTf(dy);
  const hand = rt([64, 13]);
  const farHand = rt([FAR_HAND_U, 10]);
  const S = shift(dy);
  // the arms: the far one reaches the handguard in front of the chest, the near one bends from the shoulder down
  // and forward to the pistol grip
  const farArm = limb([S([-24, -352]), S([-52, -300]), farHand], [44, 40, 34]);
  const nearArm = limb([S([14, -356]), S([30, -296]), S([10, -262]), hand], [52, 48, 42, 36]);
  return [
    { d: pathOf(LEG, rotAbout(thF, HIP, dy)), fill: INK.far, sh },
    { d: pathOf(BOOT, rotAbout(thF, HIP, dy)), fill: INK.bootFar, sh: 1 },
    { d: pathOf(PACK, S), fill: INK.pack, sh },
    { d: pathOf(LEG, rotAbout(thN, HIP, dy)), fill: INK.body, sh },
    { d: pathOf(BOOT, rotAbout(thN, HIP, dy)), fill: INK.boot, sh: 1 },
    { d: pathOf(TORSO, S), fill: INK.body, sh },
    { d: pathOf(BELT, S), fill: INK.belt, sh: 0.8 },
    { d: farArm, fill: INK.far, sh: 1.2 },
    { d: pathOf(FACE, S), fill: INK.skin, sh: 1.2 },
    { d: pathOf(HELMET, S), fill: INK.helmet, sh },
    { d: pathOf(RIFLE, rt), fill: INK.rifle, sh: 0 },
    { d: `M${n2(farHand[0] - 15)},${n2(farHand[1])} a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0 Z`, fill: INK.skin, sh: 1 },
    { d: nearArm, fill: INK.bodyLit, sh: 1.6 },
    { d: `M${n2(hand[0] - 17)},${n2(hand[1])} a17,17 0 1,0 34,0 a17,17 0 1,0 -34,0 Z`, fill: INK.skin, sh: 1 },
  ];
};
/** the sprite's bake height (px for the 512-unit figure): drawn at 70-125 px in cut 69 */
const SOLDIER_BAKE = 200;
const soldierKey = (i: number) => `burden-soldier-v5-p${i}`;

// ===================================================================================================================
// THE BUNDLE (figure units: 300 x 80, bottom centre at 0)
// ===================================================================================================================
/** rev 2: x1.5 with the bigger icons (rev 1: 92 x 24.5) */
export const BUNDLE_W = 138;
export const BUNDLE_H = 36.75;
const B_W = 300;
const B_H = 80;
const STRAP = "#B5690A";
const bundleShapes = (): Paint.Shape[] => {
  // a brick of banknotes seen from the side: crisp corners, the notes' ends a little ragged (each note sits a hair off
  // its neighbours), many thin note edges, the paper strap round its middle
  const N = 9;
  const hN = B_H / N;
  const off = [0, 3, -2, 4, 1, -3, 2, -1, 3, 0];
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const y = -B_H + i * hN;
    left.push([-B_W / 2 + off[i], y]);
    right.push([B_W / 2 + off[(i + 4) % 10] * 0.8, y]);
  }
  const stepped = (pts: Pt[]) => pts.flatMap((q, i) => (i === 0 ? [q] : [[pts[i - 1][0], q[1]] as Pt, q]));
  const L = stepped(left);
  const R = stepped(right).reverse();
  const body = `M${[...L, ...R].map((q) => q.map(n2).join(",")).join(" L")} Z`;
  const edges = Array.from({ length: N - 1 }, (_, i) => {
    const y = -B_H + (i + 1) * hN;
    return { d: `M${-B_W / 2 + 6},${n2(y)} L${B_W / 2 - 6},${n2(y + (i % 2 ? 0.8 : -0.8))}`, fill: i % 2 ? "#B8730A" : "#C98410", det: 1.3, keep: true, op: 0.7 };
  });
  return [
    { d: body, fill: ACCENT, sh: 1.4 },
    { d: `M${-B_W / 2 + 4},${-B_H} L${B_W / 2 - 4},${-B_H} L${B_W / 2 - 4},${-B_H + hN * 0.8} L${-B_W / 2 + 4},${-B_H + hN * 0.8} Z`, fill: mixHex(ACCENT, "#FFE7A8", 0.5), sh: 0, op: 0.9 },
    ...edges,
    { d: `M-24,${-B_H - 1.5} L24,${-B_H - 1.5} L24,1.5 L-24,1.5 Z`, fill: STRAP, sh: 1 },
    { d: `M-24,${-B_H - 1.5} L24,${-B_H - 1.5} L24,${-B_H + 7} L-24,${-B_H + 7} Z`, fill: mixHex(STRAP, "#FFE7A8", 0.3), sh: 0, op: 0.85 },
  ];
};
const BUNDLE_BAKE = 96;
const BUNDLE_KEY = "burden-bundle-v3";

// ===================================================================================================================
// SPRITES
// ===================================================================================================================
export const SPRITE_REQS: Paint.SpriteReq[] = [
  ...Array.from({ length: GAIT_PHASES }, (_, i) => ({ key: soldierKey(i), shapes: soldierShapes(i / GAIT_PHASES), hPx: SOLDIER_BAKE, hUnits: 512, wUnits: 180 })),
  { key: BUNDLE_KEY, shapes: bundleShapes(), hPx: BUNDLE_BAKE, hUnits: B_H, wUnits: B_W / 2 + 10 },
];
export type SpriteGet = (key: string) => Paint.Sprite | undefined;
export const useBurdenSprites = (): SpriteGet => Paint.useFolkSprites(SPRITE_REQS);
const phaseKey = (p: number) => soldierKey(((Math.round((((p % 1) + 1) % 1) * GAIT_PHASES) % GAIT_PHASES) + GAIT_PHASES) % GAIT_PHASES);

// ===================================================================================================================
// DRAWING
// ===================================================================================================================
export type TroopOpts = { usOff: number; phase: number; drain: number; veil: number; air: RGB; only?: "allies" | "us"; alpha?: number };
export const troopOptsAt = (wf: number, v: AirView): TroopOpts => ({ usOff: usOffset(wf), phase: marchPhase(wf), drain: drainAt(wf), veil: veilAt(wf), air: v.airAtScreen(760) });
/** breathing: a hair of stretch and rock per icon, out of phase; ramps in once the block stands */
const breathe = (wf: number, seed: number, on: number) => ({
  sy: 1 + on * 0.016 * Math.sin(wf * 0.14 + hash(seed) * 6.283),
  rot: on * 0.7 * Math.sin(wf * 0.083 + hash(seed + 0.37) * 6.283),
});
export const drawTroops = (ctx: CanvasRenderingContext2D, get: SpriteGet, cam: Cam, wf: number, o: TroopOpts) => {
  const hPx = ICON_H * cam.k;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const stand = get(soldierKey(0));
  const walk = get(phaseKey(o.phase));
  const usOn = sst((wf - US_MARCH.halt) / 10);
  const draw = (b: Block, dx: number, sp: Paint.Sprite | undefined, on: number, seed0: number) => {
    for (let i = 0; i < b.n; i++) {
      const q = iconAt(b, i);
      const [x, y] = toScreen(cam, q.X + dx, q.Y);
      if (x < -60 || x > 1140) continue;
      const br = breathe(wf, seed0 + i * 1.913, on);
      Paint.blitFolk(ctx, sp, x, y, hPx, { sy: br.sy, rot: br.rot, alpha: o.alpha ?? 1 });
    }
  };
  if (o.only !== "us") draw(ALLIES, 0, stand, 1, 11);
  if (o.only !== "allies") draw(US, o.usOff, o.usOff > 0 ? walk : stand, usOn, 211);
  // drain toward the dim tone, then a veil of the air, on the icons' own pixels only
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  if (o.drain > 0.002) {
    ctx.globalAlpha = c01(o.drain);
    ctx.fillStyle = COL.dead;
    ctx.fillRect(0, 0, 1080, 1920);
  }
  if (o.veil > 0.002) {
    ctx.globalAlpha = c01(o.veil);
    ctx.fillStyle = rgbHex(o.air);
    ctx.fillRect(0, 0, 1080, 1920);
  }
  ctx.restore();
};
export const TroopCanvas: React.FC<{ cam: Cam; wf: number; get: SpriteGet; o: TroopOpts }> = ({ cam, wf, get, o }) => <Paint.FolkCanvas draw={(ctx) => drawTroops(ctx, get, cam, wf, o)} />;

// ---- cash ---------------------------------------------------------------------------------------------------------
export type CashSpec = { cx: number; baseY: number; cols: number; n: number; landAt: (i: number) => number; fall?: number; fromY: number; gapX?: number };
export type BundleDraw = { X: number; Y: number; rot: number; sy: number };
const cashSlot = (s: CashSpec, i: number) => {
  const layer = Math.floor(i / s.cols);
  const col = i % s.cols;
  const gx = s.gapX ?? 4;
  const X = s.cx + (col - (s.cols - 1) / 2) * (BUNDLE_W + gx) + (hash(i * 3.1 + 0.4) - 0.5) * 10;
  return { X, Y: s.baseY - layer * BUNDLE_H, rot: (hash(i * 7.7 + 1.3) - 0.5) * 3, layer };
};
export const stackTop = (s: CashSpec, n: number) => s.baseY - Math.ceil(n / s.cols) * BUNDLE_H;
export const planCash = (s: CashSpec, wf: number): BundleDraw[] => {
  const fall = s.fall ?? 8;
  const out: BundleDraw[] = [];
  for (let i = 0; i < s.n; i++) {
    const L = s.landAt(i);
    const u = (wf - (L - fall)) / fall;
    if (u < 0) continue;
    const slot = cashSlot(s, i);
    // an accelerating drop (rest at fromY, fastest on touch-down at L), then a 4-frame squash
    const y = u >= 1 ? slot.Y : s.fromY + (slot.Y - s.fromY) * u * u;
    const t = wf - L;
    const sy = t >= 0 && t < 4 ? 1 - 0.13 * Math.sin((Math.PI * (t + 1)) / 5) : 1;
    out.push({ X: slot.X, Y: y, rot: u >= 1 ? slot.rot : slot.rot * u, sy });
  }
  return out;
};
export const drawCash = (ctx: CanvasRenderingContext2D, get: SpriteGet, cam: Cam, bundles: BundleDraw[], o: { alpha?: number } = {}) => {
  const sp = get(BUNDLE_KEY);
  const hPx = BUNDLE_H * cam.k;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  bundles.forEach((b) => {
    const [x, y] = toScreen(cam, b.X, b.Y);
    Paint.blitFolk(ctx, sp, x, y, hPx, { rot: b.rot, sy: b.sy, alpha: o.alpha ?? 1 });
  });
};
export const CashCanvas: React.FC<{ cam: Cam; get: SpriteGet; bundles: BundleDraw[]; alpha?: number }> = ({ cam, get, bundles, alpha }) => <Paint.FolkCanvas draw={(ctx) => drawCash(ctx, get, cam, bundles, { alpha })} />;

// ---- plates -------------------------------------------------------------------------------------------------------
export const enterText = (wf: number, f0: number, dur = 10) => {
  const u = c01((wf - f0) / dur);
  return { o: sst(u), lift: 0.55 * (1 - out3(u)) };
};
export const BurdenDefs: React.FC<{ uid: string }> = ({ uid }) => (
  <defs>
    <radialGradient id={`${uid}-plate`}>
      <stop offset="0" stopColor={COL.shadow} stopOpacity={0.6} />
      <stop offset="0.55" stopColor={COL.shadow} stopOpacity={0.42} />
      <stop offset="1" stopColor={COL.shadow} stopOpacity={0} />
    </radialGradient>
  </defs>
);
const PlateText: React.FC<{ x: number; y: number; size: number; font: string; text: string; fill: string; spacing?: number }> = ({ x, y, size, font, text, fill, spacing = 0 }) => (
  <text
    x={x + spacing * size * 0.5}
    y={y}
    textAnchor="middle"
    fill={fill}
    stroke={COL.shadow}
    strokeOpacity={0.9}
    strokeWidth={size * 0.2}
    strokeLinejoin="round"
    paintOrder="stroke"
    style={{ fontFamily: font, fontSize: size, letterSpacing: spacing * size, fontVariantNumeric: "lining-nums tabular-nums" }}
  >
    {text}
  </text>
);
/** a two-line label on its soft plate; y = the top of the name line */
export const BurdenPlate: React.FC<{ uid: string; x: number; y: number; name: string; num: string; o: number; lift: number; tone?: "troops" | "cash"; size?: number; dim?: number }> = ({
  uid,
  x,
  y,
  name,
  num,
  o,
  lift,
  tone = "troops",
  size = 1,
  dim = 0,
}) => {
  if (o <= 0) return null;
  const sN = TYPE.name * size;
  const sU = TYPE.num * size;
  const yN = y + sN * 0.72;
  const yU = yN + sU * 1.02;
  const w = Math.max(name.length * sN * 0.62, num.length * sU * 0.56);
  const nameFill = mixHex(COL.cream, COL.creamLo, 0.15 + dim);
  const numFill = tone === "cash" ? COL.accentPale : mixHex(COL.cream, COL.creamLo, dim);
  return (
    <g opacity={o} transform={`translate(0 ${n2(lift * sN)})`}>
      <ellipse cx={x} cy={(y + yU) / 2 + 2 * size} rx={w * 0.5 + 58 * size} ry={(yU - y) * 0.5 + 34 * size} fill={`url(#${uid}-plate)`} opacity={0.88} />
      <PlateText x={x} y={yN} size={sN} font={FONT.label} text={name} fill={nameFill} spacing={0.02} />
      <PlateText x={x} y={yU} size={sU} font={FONT.num} text={num} fill={numFill} spacing={0.01} />
    </g>
  );
};
