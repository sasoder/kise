// ---------------------------------------------------------------------------
// PasteurSystematizes (kyle-vaccine, cut 59). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 106 frames.
// Pasteur's laboratory (mood interior, a tall window's light from the upper left) on a londonDepth one-point
// perspective, from the kit kits/dwarkesh-3d/dwarkesh3d; Pasteur from the clip's cast ./vaccineFolk (import only).
//
// CHECK LINE: "Jenner's single vaccine sat alone for decades; then Pasteur turned it into a method — rack after rack
// of vaccines made the same way."
//
// THE LINE: "[And then even after Jenner, it's like another] 60 years, 70 years before Pasteur kind of systematizes it. [So]"
// WORD -> FRAME (f0 = 59.626 s): sixty -13 · YEARS 4 · seventy 17 · YEARS 23 · before 28 · PASTEUR 36 · kind 55 · of 64 ·
// SYSTEMATIZES 69 · it 96 · (So 105) · end 106
// DURATION: the slot 59.626 -> 63.163 s = 3.537 s x 29.97 = 106 frames (f0..f105).
//
// THE MOTION: one continuous pull-back. It opens close on ONE small flask glowing orange on a side bench in the
// foreground (Jenner's vaccine), alone in front of an empty rack of cream flasks; the camera drifts, then pulls back
// and trucks right (one lobe, smootherstep f-5..f78, a slow creep under it to the end) to reveal Pasteur at the long
// bench: his flask enters at the frame's edge ~f17, he lifts it to the light (examineFlask, raised f18-f36, held on
// PASTEUR f36, his face in by ~f36). He sets it into the rack's first slot (placeFlask f50-: the base lands f67 =
// contact; the hand lets go f67-f75 and comes back f75-f101, re-timed by arc length so it never swings) and from that
// flask the orange runs on, flask after flask in strict serpentine order through the rack's three tiers (tier 0
// right -> left from his slot, tier 1 left -> right, tier 2 right -> left; first reaction f69 on SYSTEMATIZES, 1.5 f
// apart, each flask filling over 6 f from the front reaching it; the last full by f96). The last frames hold the
// living picture: Pasteur at the bench, three tiers glowing in order, the first lonely flask still in the foreground.
// Orange = the vaccine only (the lone flask, Pasteur's flask, the filled rack). Everything else in muted earthy
// local colours; Pasteur never orange.
//
// DEPTH: eye 1.69 m (eyeY -300), dRef 1800 at kRef 2, dolly 0.5, fog by the eye. The long bench Z 140..300 (top Y
// -165); the rack's tiers at Z 165 / 201 / 237, Y -205 / -285 / -365; Pasteur's feet X 92, Z 105; the side bench
// Z -420..-240, the lone flask at X -130, Z -330; the back wall Z 640 with the window.
//
// SOURCES: Pasteur's attenuated vaccines: chicken cholera (1879-80), anthrax (1881), rabies (1885); Jenner 1796. No
// years or numbers on screen (the speaker's "60, 70 years" is ~85 in fact). Pasteur's glass culture flasks drawn as
// simple cream-glass flasks (the cast's Flask).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  AirBox,
  AirFloor,
  AirShadow,
  AirStage,
  MAT,
  WorldSvg,
  airWorldOf,
  c01,
  lerp,
  mixHex,
  swayCam,
  type AirScene,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type Mat,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { Flask, POSES, Pasteur, breathe, lerpPose, vaccineAnchors, type P2, type VPose } from "./vaccineFolk";

export const FPS = 30000 / 1001;
export const DURATION = 106;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const smooth = (v: number) => {
  const x = c01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};
const ease = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
/** piecewise-linear through [x, y] keys */
const pw = (keys: [number, number][], x: number) => {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (x - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
  return keys[keys.length - 1][1];
};

// ---------------------------------------------------------------------------------------------------------------------
// THE WORLD (cast units, a man ~312 = 1.75 m; X across, Y up -, Z depth)
// ---------------------------------------------------------------------------------------------------------------------
export const DEPTH: DepthOpts = { eyeY: -300, dRef: 1800, kRef: 2, dolly: 0.5 };
const SCENE: Partial<AirScene> = { mood: "interior", fogNear: 700, fogVis: 2600, fogMax: 0.92, hHigh: 1500, eyeT: 0.1 };
export const BENCH = { X0: -1100, X1: 1700, Z0: 140, Z1: 300, top: -165, slab: 8 };
export const SIDE = { X0: -200, X1: -60, Z0: -420, Z1: -240, top: -165 };
export const WALL_Z = 640;
export const WINDOW = { X0: -470, X1: -170, Y0: -1000, Y1: -430 };
/** the rack: three tiers stepping up and back, five columns; column 0 (screen right) is Pasteur's slot */
export const RACK = { cols: 5, pitch: 42, X0: 0, tiers: 3, tierY0: -205, tierDY: 80, tierZ0: 165, tierDZ: 36, board: 7 };
export const slotOf = (t: number, c: number) => ({ X: RACK.X0 - RACK.pitch * c, Y: RACK.tierY0 - RACK.tierDY * t, Z: RACK.tierZ0 + RACK.tierDZ * t });
export const PASTEUR = { X: 92, Z: 105 };
export const LONE = { X: -130, Z: -330 };
export const FLASK_FILL = 0.55;

// the order the orange runs in: serpentine, tier 0 right -> left (from Pasteur's slot), tier 1 left -> right, tier 2 right -> left
export const ORDER: { t: number; c: number }[] = [];
for (let t = 0; t < RACK.tiers; t++) for (let i = 0; i < RACK.cols; i++) ORDER.push({ t, c: t % 2 === 0 ? i : RACK.cols - 1 - i });
/** contact: the base of Pasteur's flask lands in slot 0 */
export const CONTACT = 67;
/** the frame each flask in ORDER starts to fill (n = 0 is Pasteur's own, already full) */
export const fillStart = (n: number) => (n === 0 ? -1 : CONTACT + 2 + 1.5 * (n - 1) + (ORDER[n].t - ORDER[1].t) * 0.8);
const FILL_LEN = 6;
export const fillOf = (n: number, f: number) => (n === 0 ? FLASK_FILL : FLASK_FILL * Math.pow(c01((f - fillStart(n)) / FILL_LEN), 0.8));

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERA: one lobe (smootherstep f-6..f86) from close on the lone flask to the landing, with a slow creep under it
// ---------------------------------------------------------------------------------------------------------------------
const DcOf = (k: number) => DEPTH.dRef * Math.pow(DEPTH.kRef / k, DEPTH.dolly);
const rOf = (k: number, Z: number) => {
  const Dc = DcOf(k);
  return Dc / (Dc + Z);
};
/** the camera that puts the 3D point (X, Y, Z) at screen (sx, sy) at zoom k */
const camAt3 = (k: number, X: number, Y: number, Z: number, sx: number, sy: number): Cam => {
  const r = rOf(k, Z);
  return { k, cx: X - (sx - 540) / (r * k), cy: DEPTH.eyeY + (Y - DEPTH.eyeY) * r - (sy - 960) / k };
};
export const CAM0 = { k: 4.2, X: LONE.X, Y: -190, Z: LONE.Z, sx: 560, sy: 820 };
export const CAM1 = { k: 2.5, X: PASTEUR.X - 40, Y: -240, Z: PASTEUR.Z, sx: 650, sy: 780 };
export const camU = (f: number) => smooth((f + 5) / 83);
export const camOf = (f: number): Cam => {
  const u = camU(f);
  const creep = Math.exp(-0.0006 * f);
  const k = Math.exp(lerp(Math.log(CAM0.k), Math.log(CAM1.k), u)) * creep;
  return camAt3(k, lerp(CAM0.X, CAM1.X, u), lerp(CAM0.Y, CAM1.Y, u), lerp(CAM0.Z, CAM1.Z, u), lerp(CAM0.sx, CAM1.sx, u), lerp(CAM0.sy, CAM1.sy, u));
};
const REST = swayCam(camOf(0), 0);

// ---------------------------------------------------------------------------------------------------------------------
// PASTEUR'S PERFORMANCE (facing screen left; the flask in his far hand)
// ---------------------------------------------------------------------------------------------------------------------
export const EXAM = { raise0: 18, raise1: 36, hold1: 50 };
export const PLACE = { start: 50, keys: [[50, 0], [CONTACT, 0.55], [75, 0.76]] as [number, number][], ret: [75, 101] as const };
// the hand's way back (phase 0.76 -> 1) re-timed by arc length, so it travels at an even, eased pace instead of the
// pose's own quick swing: a table of the hand's cumulative distance against phase (rig units, a typical set-down point)
const RET_TABLE = (() => {
  const out: [number, number][] = [];
  let s = 0;
  let prev: P2 | null = null;
  for (let i = 0; i <= 96; i++) {
    const ph = 0.76 + (0.24 * i) / 96;
    const h = vaccineAnchors("pasteur", POSES.placeFlask(-1, ph), [0, 0], 1, { hold: { L: "flask" }, reachTo: [-80, -178] }).handL;
    if (prev) s += Math.hypot(h[0] - prev[0], h[1] - prev[1]);
    prev = h;
    out.push([s, ph]);
  }
  return out;
})();
const retPhase = (f: number) => {
  const total = RET_TABLE[RET_TABLE.length - 1][0];
  const target = total * ease((f - PLACE.ret[0]) / (PLACE.ret[1] - PLACE.ret[0]));
  return pw(RET_TABLE, target);
};
const examPh = (f: number) => (f <= EXAM.raise0 ? 0 : f <= EXAM.raise1 ? (0.45 * (f - EXAM.raise0)) / (EXAM.raise1 - EXAM.raise0) : 0.45 + 0.2 * c01((f - EXAM.raise1) / (EXAM.hold1 - EXAM.raise1)));
export const pasteurPose = (f: number): VPose => {
  const ex = POSES.examineFlask(-1, examPh(f));
  let q: VPose;
  if (f < 42) q = ex;
  else if (f < PLACE.start) q = lerpPose(ex, POSES.placeFlask(-1, 0), ease((f - 42) / (PLACE.start - 42)));
  else q = POSES.placeFlask(-1, f <= PLACE.ret[0] ? pw(PLACE.keys, f) : retPhase(f));
  return breathe(q, f, 0.8);
};

// ---------------------------------------------------------------------------------------------------------------------
// DRAWING
// ---------------------------------------------------------------------------------------------------------------------
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const PLASTER: Mat = { lit: "#B9B8A2", mid: "#97998A", dark: "#5E6258" };
const SLAB: Mat = MAT.marble;
const RACKWOOD: Mat = { lit: "#9C7A55", mid: "#6E5438", dark: "#3A2B1D" };
const RACKBACK: Mat = { lit: "#6A5038", mid: "#4A3726", dark: "#2A1F15" };

/** the back wall: plaster toned by height, a dark skirting, the tall window */
const BackWall: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const Z = WALL_Z;
  const bands: React.ReactNode[] = [];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const ya = lerp(-1500, 0, i / N);
    const yb = lerp(-1500, 0, (i + 1) / N) + 2;
    bands.push(<path key={i} d={poly([P.p(-2400, ya, Z), P.p(2600, ya, Z), P.p(2600, yb, Z), P.p(-2400, yb, Z)])} fill={A.tone(mixHex(PLASTER.mid, PLASTER.dark, 0.25 + 0.25 * (i / N)), Z, -(ya + yb) / 2)} />);
  }
  const w = WINDOW;
  const arch = (inset: number) => {
    const x0 = w.X0 + inset;
    const x1 = w.X1 - inset;
    const yS = w.Y0 + (w.X1 - w.X0) / 2;
    const pts: P2[] = [P.p(x0, w.Y1 - inset, Z), P.p(x1, w.Y1 - inset, Z)];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      const rx = (x1 - x0) / 2;
      pts.push(P.p((x0 + x1) / 2 + rx * Math.cos(a), yS - rx * Math.sin(a) + inset * 0.2, Z));
    }
    return poly(pts);
  };
  const glass = A.tone("#E8E6D2", Z, 600);
  const frameC = A.tone("#5C4A36", Z, 600);
  const mull: React.ReactNode[] = [];
  const mx = (w.X0 + w.X1) / 2;
  const lw = 7 * P.r(Z);
  mull.push(<path key="v" d={`M${Pt(P.p(mx, w.Y0 + 10, Z))}L${Pt(P.p(mx, w.Y1, Z))}`} stroke={frameC} strokeWidth={lw} />);
  for (let i = 1; i < 5; i++) {
    const y = lerp(w.Y0 + (w.X1 - w.X0) / 2, w.Y1, i / 5);
    mull.push(<path key={`h${i}`} d={`M${Pt(P.p(w.X0, y, Z))}L${Pt(P.p(w.X1, y, Z))}`} stroke={frameC} strokeWidth={lw * 0.8} />);
  }
  return (
    <g>
      {bands}
      <path d={poly([P.p(-2400, -40, Z), P.p(2600, -40, Z), P.p(2600, 2, Z), P.p(-2400, 2, Z)])} fill={A.tone("#4A3A2A", Z, 20)} />
      <path d={arch(-14)} fill={A.tone("#6A5640", Z, 600)} />
      <path d={arch(0)} fill={glass} />
      {mull}
      {/* the deep sill */}
      <path d={poly([P.p(w.X0 - 20, w.Y1, Z), P.p(w.X1 + 20, w.Y1, Z), P.p(w.X1 + 20, w.Y1 + 14, Z), P.p(w.X0 - 20, w.Y1 + 14, Z)])} fill={A.tone("#8C7A62", Z, 330)} />
    </g>
  );
};

/** the long bench: a timber body under a pale slab top */
/** cupboard doors on a front face at depth Z: inset panels (a darker local line, a cream bevel on the top and left
 *  edges) and a small knob each, so the bench fronts are never one big flat face */
const Doors: React.FC<{ A: AirWorld; X0: number; X1: number; Y0: number; Y1: number; Z: number; n: number; uid: string }> = ({ A, X0, X1, Y0, Y1, Z, n }) => {
  const P = A.P;
  const h = -(Y0 + Y1) / 2;
  const line = A.tone(mixHex(MAT.timber.dark, "#22180F", 0.3), Z, h);
  const bev = A.tone(MAT.timber.lit, Z, h);
  const knob = A.tone("#C9B58E", Z, h);
  const w = (X1 - X0) / n;
  const els: React.ReactNode[] = [];
  const lw = 2.2 * P.r(Z);
  for (let i = 0; i < n; i++) {
    const a = X0 + i * w + 12;
    const b = X0 + (i + 1) * w - 12;
    const q: P2[] = [P.p(a, Y0 + 14, Z), P.p(b, Y0 + 14, Z), P.p(b, Y1 - 16, Z), P.p(a, Y1 - 16, Z)];
    els.push(<path key={`d${i}`} d={poly(q)} fill="none" stroke={line} strokeWidth={lw} strokeOpacity={0.55} strokeLinejoin="round" />);
    els.push(<path key={`b${i}`} d={`M${Pt(P.p(a + 3, Y1 - 19, Z))}L${Pt(P.p(a + 3, Y0 + 17, Z))}L${Pt(P.p(b - 3, Y0 + 17, Z))}`} fill="none" stroke={bev} strokeWidth={lw * 0.8} strokeOpacity={0.35} />);
    const kc = P.p(i % 2 === 0 ? b - 14 : a + 14, Y0 + 40, Z);
    els.push(<circle key={`k${i}`} cx={kc[0]} cy={kc[1]} r={3.2 * P.r(Z)} fill={knob} />);
  }
  return <g>{els}</g>;
};
const LongBench: React.FC<{ A: AirWorld }> = ({ A }) => (
  <g>
    <AirBox A={A} X0={BENCH.X0} X1={BENCH.X1} Y0={BENCH.top + BENCH.slab} Y1={0} Z0={BENCH.Z0 + 10} Z1={BENCH.Z1 - 6} mat={MAT.timber} uid="lbB" />
    <Doors A={A} X0={-660} X1={1380} Y0={BENCH.top + BENCH.slab} Y1={-6} Z={BENCH.Z0 + 10} n={12} uid="lbD" />
    <AirBox A={A} X0={BENCH.X0} X1={BENCH.X1} Y0={BENCH.top} Y1={BENCH.top + BENCH.slab} Z0={BENCH.Z0} Z1={BENCH.Z1} mat={SLAB} uid="lbT" />
  </g>
);
const SideBench: React.FC<{ A: AirWorld }> = ({ A }) => (
  <g>
    <AirBox A={A} X0={SIDE.X0 + 8} X1={SIDE.X1 - 8} Y0={SIDE.top + BENCH.slab} Y1={0} Z0={SIDE.Z0 + 8} Z1={SIDE.Z1} mat={MAT.timber} uid="sbB" />
    <Doors A={A} X0={SIDE.X0 + 8} X1={SIDE.X1 - 8} Y0={SIDE.top + BENCH.slab} Y1={-6} Z={SIDE.Z0 + 8} n={1} uid="sbD" />
    <AirBox A={A} X0={SIDE.X0} X1={SIDE.X1} Y0={SIDE.top} Y1={SIDE.top + BENCH.slab} Z0={SIDE.Z0} Z1={SIDE.Z1} mat={SLAB} uid="sbT" />
  </g>
);

/** a flask's warm light from inside: a soft radial glow in the bulb and a faint spill round it (screen px follow the world) */
const FlaskLight: React.FC<{ base: P2; s: number; amt: number; uid: string }> = ({ base, s, amt, uid }) => {
  if (amt <= 0.004) return null;
  const R = 14 * s;
  const c: P2 = [base[0], base[1] - R * 0.9];
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={`${uid}fl`}>
          <stop offset="0" stopColor="#FFD27A" stopOpacity={0.55 * amt} />
          <stop offset="0.35" stopColor={ACCENT} stopOpacity={0.28 * amt} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={R * 3.2} ry={R * 2.9} fill={`url(#${uid}fl)`} />
    </g>
  );
};

/** one tier of the rack: the board, a front lip, then its flasks */
const RackTier: React.FC<{ A: AirWorld; t: number; frame: number; skip0: boolean }> = ({ A, t, frame, skip0 }) => {
  const s0 = slotOf(t, 0);
  const xL = slotOf(t, RACK.cols - 1).X - 30;
  const xR = s0.X + 30;
  const els: React.ReactNode[] = [];
  els.push(<AirBox key="b" A={A} X0={xL} X1={xR} Y0={s0.Y} Y1={s0.Y + RACK.board} Z0={s0.Z - 18} Z1={s0.Z + 18} mat={RACKWOOD} uid={`rb${t}`} />);
  for (let c = 0; c < RACK.cols; c++) {
    if (skip0 && t === 0 && c === 0) continue;
    const sl = slotOf(t, c);
    const n = ORDER.findIndex((o) => o.t === t && o.c === c);
    const fill = fillOf(n, frame);
    const base = A.P.p(sl.X, sl.Y, sl.Z);
    const s = A.P.r(sl.Z);
    els.push(<AirShadow key={`s${c}`} A={A} X={sl.X} Z={sl.Z} Y={sl.Y} w={15} d={9} uid={`rs${t}${c}`} amt={0.55} />);
    els.push(<Flask key={`f${c}`} at={base} scale={s} fill={fill} uid={`rf${t}${c}`} fog={A.folkFog(sl.Z, -sl.Y)} unitPx={A.k} />);
    els.push(<FlaskLight key={`l${c}`} base={base} s={s} amt={fill / FLASK_FILL} uid={`rl${t}${c}`} />);
  }
  return <g>{els}</g>;
};
/** the rack's two side boards (stepped), behind the tiers */
const RackSides: React.FC<{ A: AirWorld }> = ({ A }) => {
  const top = slotOf(RACK.tiers - 1, 0);
  const xs = [slotOf(0, RACK.cols - 1).X - 36, slotOf(0, 0).X + 30];
  return (
    <g>
      <AirBox A={A} X0={xs[0]} X1={xs[1] + 6} Y0={top.Y - 6} Y1={BENCH.top} Z0={top.Z + 18} Z1={top.Z + 24} mat={RACKBACK} uid="rbk" />
      {xs.map((x, i) => (
        <AirBox key={i} A={A} X0={x} X1={x + 6} Y0={top.Y - 6} Y1={BENCH.top} Z0={RACK.tierZ0 - 18} Z1={top.Z + 18} mat={RACKWOOD} uid={`rsd${i}`} />
      ))}
    </g>
  );
};

const LowAir: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="psLowAir" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3D342B" stopOpacity={0} />
        <stop offset="0.25" stopColor="#3D342B" stopOpacity={0.4} />
        <stop offset="0.6" stopColor="#3A332A" stopOpacity={0.72} />
        <stop offset="1" stopColor="#33302A" stopOpacity={0.9} />
      </linearGradient>
    </defs>
    <rect x={0} y={1330} width={1080} height={590} fill="url(#psLowAir)" />
  </svg>
);

const PasteurSystematizes: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camOf(frame), frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, scene: SCENE });
  const P = A.P;
  const k = cam.k;
  const toS = (p: P2): P2 => [540 + (p[0] - cam.cx) * k, 960 + (p[1] - cam.cy) * k];
  const wTop = toS(P.p(WINDOW.X1, WINDOW.Y0, WALL_Z));
  const wBot = toS(P.p(WINDOW.X1, WINDOW.Y1, WALL_Z));
  const win = { x: wTop[0], y0: wTop[1], y1: wBot[1], beams: 3 };
  // Pasteur
  const pf = P.at(PASTEUR.X, PASTEUR.Z);
  const q = pasteurPose(frame);
  const s0 = slotOf(0, 0);
  const flaskTo = P.p(s0.X, s0.Y, s0.Z);
  const pAn = vaccineAnchors("pasteur", q, pf.at, pf.scale, { hold: { L: "flask" }, reachTo: flaskTo });
  // the lone flask
  const lb = P.p(LONE.X, SIDE.top, LONE.Z);
  const ls = P.r(LONE.Z);
  return (
    <AirStage v={A.v} window={win} shafts={0.55} bloom={0.22} front={<LowAir />}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-2400} x1={2600} z0={-1600} z1={WALL_Z} mat={MAT.ground} course={150} melt={0} />
        <BackWall A={A} />
        <LongBench A={A} />
        <RackSides A={A} />
        {[2, 1, 0].map((t) => (
          <RackTier key={t} A={A} t={t} frame={frame} skip0 />
        ))}
        <AirShadow A={A} X={PASTEUR.X} Z={PASTEUR.Z} w={62} d={30} uid="pS" amt={0.8} />
        <Pasteur pose={q} at={pf.at} scale={pf.scale} uid="pas" holdFar="flask" flaskTo={flaskTo} flaskFill={FLASK_FILL} frame={frame} fog={A.folkFog(PASTEUR.Z)} unitPx={k} />
        <FlaskLight base={pAn.placed ?? pAn.keyL} s={pf.scale} amt={1} uid="pl" />
        <SideBench A={A} />
        <AirShadow A={A} X={LONE.X} Z={LONE.Z} Y={SIDE.top} w={16} d={10} uid="lS" amt={0.6} />
        <Flask at={lb} scale={ls} fill={FLASK_FILL} uid="lone" fog={A.folkFog(LONE.Z, 165)} unitPx={k} />
        <FlaskLight base={lb} s={ls} amt={1} uid="lL" />
      </WorldSvg>
    </AirStage>
  );
};

export default PasteurSystematizes;
