// ---------------------------------------------------------------------------
// SixOrSevenTools (kyle-vaccine, cut 1). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 400 frames. Camera and layout: ./sixToolsPlan.ts; the six icons: ./sixToolsIcons.tsx.
//
// CHECK LINE: "Public health is a row of six tools — water, washing, medicine, care, rehab — each one with people doing
// it, and the camera travels along them to the one that glows: vaccines."
//
// THE LINE: "(…system) of like six or seven really critical tools that involve clean water, personal hygiene, vaccines,
// antibiotics, different kinds of therapeutic interventions or rehabilitation therapy. Vaccination is like the most
// important one."
// WORD -> FRAME: of 12 · like 22 · six 27 · or 36 · seven 39 · really 48 · critical 58 · tools 73 · that 94 · involve 107
// · clean 114 · water 135 · personal 152 · hygiene 164 · vaccines 188 · antibiotics 217 · different 242 · kinds 252 ·
// therapeutic 270 · interventions 284 · or 300 · rehabilitation 309 · therapy 318 · Vaccination 339 · is 350 · like 356
// · the most 359-362 · important 369 · one 378 · (And 395)
// DURATION: the slot 1.7351 -> 15.0817 s = 13.347 s x 29.97 = 400 frames (f0..f399).
//
// THE MOTION: one continuous camera. f0-76 the six icon signs as one row (each a cream plate on a post and bracket,
// umber icons; the vaccine's syringe already orange), a slow creep in and down. f76-146 the camera swoops in and down
// to the left end of the row (pure dolly, ~27 m -> ~6.7 m) and, without stopping, turns into one constant glide right
// (10 units/frame, ~15.5 px/frame on the people, f168-322) along six stations, each passing the frame's middle on
// its words: clean water (a man fills a bucket at a standpipe, his other hand on the tap, f135), hygiene (a mother and
// her daughter wash their hands at a basin, soap bubbles, f166), antibiotics (a pharmacist hands a pill bottle across
// the counter, contact f212, f216), therapeutic care (a nurse checks the drip of a patient sitting up in bed, f266),
// rehabilitation (an old man steps between parallel bars, his physio's hand coming to his elbow, ~f304-316). f322-396 the glide eases out (one
// deceleration lobe, with a small push in) on the sixth: a health worker vaccinates a boy's upper arm.
// CAUSE BEFORE EFFECT: the water falls only from an open tap whose lever the man holds; the bottle changes hands while
// both hands are on it (f212-220); the syringe's needle reaches the boy's arm on f369 (contact) and the small orange
// glow on the arm starts on that same frame, then brightens a step on "one" (f378) as the plunger goes home (f370-380).
// Orange = THE VACCINE only (the clip's ORANGE RULE): the syringe icon, the syringe's charge and the glow on the arm.
// Everything else in muted earthy local colours; people never orange; no text on screen.
//
// DEPTH: eye 2 m up (eyeY -356), a pure dolly (DEPTH.dolly 1: Dc = 1920 / k, 4987 at f0, 1038 on the glide, 784 at the
// end), fog by world depth (fogBy "depth", so the opening's far eye does not bury the row). The stations' people stand
// at Z 150-400, the signs hang at Z 700 behind them (so in the close they read ~400 px wide over each station, and ~125 px
// as a row at f0; plates centred 3.1 m up), the floor runs to Z 6000 and melts into the air.
// CAST: covidFolk (kyle-covid; import only). Water: Parent v1. Hygiene: Parent v0 + Child v1 (on a step). Antibiotics:
// Officer v3 (shirtsleeves = the pharmacist) + Elder v1 (the customer, handbag in her far hand). Therapy: Youth v1 in
// a pale gown (inks) sitting up in bed + Youth v2 as the nurse in teal-grey scrubs (inks). Rehab: Elder v0 walking +
// Youth v0 as the physio. Vaccine: Child v0 (seated) + Commuter v2 as the health worker in a white coat (inks) with a
// face mask (inks.mask).
// SOURCES: none (no figures, places or dates on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, AirBox, AirCyl, AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, ORANGE_LINE, WorldSvg, airWorldOf, mixHex, swayCam, type AirWorld, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CovidFigure, POSES, breathe, covidAnchors, walkAdvance, type CovidInks, type CovidKind, type CovidPose, type HandProp } from "../kyle-covid/covidFolk";
import { ICON_CRUTCH, SignPlate } from "./sixToolsIcons";
import { DEPTH, DURATION, FPS, SIGN_H, SIGN_W, SIGN_X, SIGN_Y, SIGN_Z, STATION_X, camAt } from "./sixToolsPlan";

export { DURATION, FPS };
/** rehabIcon: the walking frame (default) or a single crutch (kept for comparison stills) */
export const schema = z.object({ rehabIcon: z.enum(["frame", "crutch"]).default("frame") });
export const defaultProps = schema.parse({});

const REST = swayCam(camAt(0), 0);

// ---- small helpers ------------------------------------------------------------------------------------------------
type V3 = [number, number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;

const CREAM = "#F3EBDD";
const CREAM_LO = "#D9CDB4";
const UMBER_INK = "#4A3828";
const WATER = "#CFE1DB";
const WATER_HI = "#F4F7F1";
const STEEL: Mat = { lit: "#A7AEAE", mid: "#7C8485", dark: "#454B4D" };
const CERAMIC: Mat = { lit: "#ECE6D8", mid: "#CFC7B4", dark: "#8F8775" };
const MATTRESS: Mat = { lit: "#E3DCCB", mid: "#C6BCA5", dark: "#867C68" };
const BLANKET: Mat = { lit: "#A9B5AE", mid: "#8D9A93", dark: "#56625C" };
const MAT_SLATE: Mat = { lit: "#7D8A8E", mid: "#5F6B70", dark: "#353D41" };

/** is the world span [x0, x1] at depth Z on screen (with a margin in px)? */
const onScreen = (A: AirWorld, x0: number, x1: number, Z: number, m = 60) => {
  const k = A.k * A.P.r(Z);
  const a = 540 + (x0 - A.cam.cx) * k;
  const b = 540 + (x1 - A.cam.cx) * k;
  return b > -m && a < 1080 + m;
};

type FigSpec = {
  kind: CovidKind;
  v: number;
  pose: CovidPose;
  X: number;
  Z: number;
  Y?: number;
  uid: string;
  /** grips: a 3D point (X, Y, Z) or a 2D world point */
  grip?: { L?: V3 | P2; R?: V3 | P2 };
  inks?: Partial<CovidInks>;
  hold?: { L?: HandProp; R?: HandProp };
  shadow?: { w: number; d: number; amt?: number };
};
const g2 = (A: AirWorld, v?: V3 | P2): P2 | undefined => (!v ? undefined : v.length === 3 ? A.P.p(v[0], v[1], v[2]) : v);
const gp = (A: AirWorld, g?: { L?: V3 | P2; R?: V3 | P2 }) => (g ? { L: g2(A, g.L), R: g2(A, g.R) } : undefined);
const Fig: React.FC<{ A: AirWorld; s: FigSpec; frame: number }> = ({ A, s, frame }) => {
  const Y = s.Y ?? 0;
  const at = A.P.p(s.X, Y, s.Z);
  const scale = A.P.r(s.Z);
  const sh = s.shadow ?? { w: 58, d: 30, amt: 0.75 };
  return (
    <g>
      <AirShadow A={A} X={s.X} Z={s.Z} Y={Y} w={sh.w} d={sh.d} amt={sh.amt ?? 0.75} uid={`${s.uid}-sh`} />
      <CovidFigure kind={s.kind} variant={s.v} pose={s.pose} at={at} scale={scale} uid={s.uid} fog={A.folkFog(s.Z, -Y)} unitPx={A.k} frame={frame} grip={gp(A, s.grip)} inks={s.inks} hold={s.hold} carry="none" />
    </g>
  );
};
const anchorsOf = (A: AirWorld, s: FigSpec) => covidAnchors(s.kind, s.pose, A.P.p(s.X, s.Y ?? 0, s.Z), A.P.r(s.Z), { variant: s.v, grip: gp(A, s.grip) });

/** a falling stream of water from a to b (2D world), width w (2D), its highlights running down */
const Stream: React.FC<{ a: P2; b: P2; w: number; frame: number; uid: string; amt?: number; seed?: number }> = ({ a, b, w, frame, uid, amt = 1, seed = 0 }) => {
  if (amt <= 0.01) return null;
  const n = 10;
  const L: P2[] = [];
  const R: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = lerp(a[0], b[0], t) + w * 0.12 * Math.sin(frame * 0.9 + t * 7 + seed) * t;
    const y = lerp(a[1], b[1], t);
    const hw = (w / 2) * lerp(1, 0.72, t) * (0.92 + 0.08 * Math.sin(frame * 1.3 + t * 11 + seed));
    L.push([x - hw, y]);
    R.push([x + hw, y]);
  }
  const body = `M${L.map(Pt).join("L")}L${R.reverse().map(Pt).join("L")}Z`;
  const len = b[1] - a[1];
  const dash = Math.max(2, len * 0.16);
  return (
    <g opacity={amt}>
      <path d={body} fill={WATER} fillOpacity={0.72} />
      <path
        d={`M${Pt([a[0] - w * 0.12, a[1]])}L${Pt([b[0] - w * 0.1, b[1]])}`}
        stroke={WATER_HI}
        strokeOpacity={0.85}
        strokeWidth={w * 0.22}
        strokeLinecap="round"
        strokeDasharray={`${f2(dash)} ${f2(dash * 0.8)}`}
        strokeDashoffset={f2(-frame * dash * 0.45)}
        key={uid}
      />
    </g>
  );
};

/** soap bubbles rising off the hands at c (2D), scale s (2D units per world unit) */
const Bubbles: React.FC<{ c: P2; s: number; frame: number; seed: number; on: number }> = ({ c, s, frame, seed, on }) => {
  const out: React.ReactNode[] = [];
  const life = 46;
  for (let b = Math.floor((frame - life) / 5); b <= Math.floor(frame / 5); b++) {
    const born = b * 5;
    const age = frame - born;
    if (age < 0 || age > life) continue;
    const h = Math.sin(b * 12.9898 + seed * 78.233) * 43758.5453;
    const u = h - Math.floor(h);
    const h2 = Math.sin(b * 4.1414 + seed * 9.17) * 9631.77;
    const u2 = h2 - Math.floor(h2);
    if (on < u2 * 0.9) continue;
    const t = age / life;
    const r = (3 + 4.5 * u) * s * (0.55 + 0.45 * Math.min(1, age / 8)) * (age > life - 4 ? (life - age) / 4 : 1);
    const x = c[0] + (u - 0.5) * 34 * s + Math.sin(age * 0.18 + u * 6) * 5 * s;
    const y = c[1] - 4 * s - age * (0.9 + 0.6 * u2) * s;
    if (r <= 0.05) continue;
    out.push(
      <g key={b} opacity={0.9 * (1 - t * 0.35)}>
        <circle cx={x} cy={y} r={r} fill="#F6F3EA" fillOpacity={0.55} stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={0.18 * r} />
        <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.22} fill="#FFFFFF" fillOpacity={0.9} />
      </g>,
    );
  }
  return <g>{out}</g>;
};

// ===================================================================================================================
// THE SIGNS
// ===================================================================================================================
/** the plates' turn: edge-on (90 deg) until each swings round to face us, left -> right across "six or seven really
 *  critical tools", each an underdamped step (zero start slope, ~7 % overshoot) that faces us first on T_FACE[i] */
export const T_FACE = [22, 32.6, 43.2, 53.8, 64.4, 75];
const TURN_W = 0.22;
const TURN_TAU = 5.5;
const TURN_LEAD = (Math.PI - Math.atan(TURN_W * TURN_TAU)) / TURN_W;
export const signTurn = (i: number, frame: number) => {
  const t = frame - (T_FACE[i] - TURN_LEAD);
  if (t <= 0) return Math.PI / 2;
  const s = 1 - Math.exp(-t / TURN_TAU) * (Math.cos(TURN_W * t) + Math.sin(TURN_W * t) / (TURN_W * TURN_TAU));
  return (Math.PI / 2) * (1 - s);
};
const SignPost: React.FC<{ A: AirWorld; i: number; frame: number; icon?: number }> = ({ A, i, frame, icon }) => {
  const X = SIGN_X[i];
  const Z = SIGN_Z;
  const postX = X - SIGN_W / 2 - 34;
  const armY = SIGN_Y - SIGN_H / 2 - 42;
  const c = A.P.p(X, SIGN_Y, Z);
  const r = A.P.r(Z);
  const orange = i === 5;
  const h = -SIGN_Y;
  const th = signTurn(i, frame);
  const cs = Math.cos(th);
  const sn = Math.sin(th);
  const fill = A.tone(CREAM, Z, h);
  const fillLo = A.tone(CREAM_LO, Z, h);
  const edge = A.tone("#A89A7E", Z, h);
  const side = A.tone("#C9BC9F", Z, h);
  const ink = orange ? A.toneO(ACCENT, Z, h) : A.tone(UMBER_INK, Z, h);
  const ink2 = orange ? A.toneO(ACCENT_DEEP, Z, h) : A.tone("#8A7461", Z, h);
  const half = SIGN_W / 2 - 46;
  const hang = [X - half * cs, X + half * cs];
  const armR = X + half + 14;
  const T = 22;
  const edgeW = T * Math.abs(sn);
  const edgeX = sn >= 0 ? (SIGN_W / 2) * cs : -(SIGN_W / 2) * cs - edgeW;
  return (
    <g>
      <AirShadow A={A} X={postX} Z={Z} w={22} d={14} amt={0.6} uid={`sp${i}-sh`} />
      <AirCyl A={A} X={postX} Z={Z} R={8} Y0={armY - 14} Y1={0} mat={MAT.iron} uid={`sp${i}`} />
      <AirBox A={A} X0={postX - 4} X1={armR} Y0={armY - 6} Y1={armY + 6} Z0={Z - 6} Z1={Z + 6} mat={MAT.iron} uid={`sa${i}`} />
      {hang.map((hx, j) => {
        const a = A.P.p(hx, armY + 6, Z);
        const b = A.P.p(hx, SIGN_Y - SIGN_H / 2 + 4, Z);
        return <path key={j} d={`M${Pt(a)}L${Pt(b)}`} stroke={A.tone(MAT.iron.dark, Z, h)} strokeWidth={3.2 * r} strokeLinecap="round" />;
      })}
      <g transform={`translate(${f2(c[0])} ${f2(c[1])}) scale(${r.toFixed(5)})`}>
        {edgeW > 0.05 ? <rect x={edgeX} y={-SIGN_H / 2 + SIGN_H * 0.03} width={edgeW} height={SIGN_H * 0.94} rx={Math.min(edgeW / 2, 4)} fill={side} stroke={edge} strokeWidth={1.2} /> : null}
        {cs > 0.004 ? (
          <g transform={`scale(${cs.toFixed(5)} 1)`}>
            <SignPlate w={SIGN_W} h={SIGN_H} fill={fill} fillLo={fillLo} edge={edge} rim={CREAM} rimA={0.7} ink={ink} ink2={ink2} icon={icon ?? i} iconBox={218} uid={`sg${i}`} glow={orange ? { color: ACCENT, amount: 0.55 * cs * cs } : undefined} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

// ===================================================================================================================
// 1 CLEAN WATER: a man fills a bucket at a standpipe, his far hand holding the tap's lever open
// ===================================================================================================================
const WaterStation: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const cX = STATION_X.water;
  const pipeX = cX - 62;
  const pZ = 170;
  const spoutX = cX - 14;
  const bucket = { X: cX - 8, Z: 178, R: 30, rim: -112, bot: -40 };
  const sway = 2.2 * Math.sin(frame * 0.06);
  const bX = bucket.X + sway;
  const man: FigSpec = {
    kind: "parent",
    v: 1,
    pose: breathe({ ...POSES.stand(-1), headYaw: -0.5, pitch: 6, look: [-0.4, 0.5] }, frame, 1, 1),
    X: cX + 74,
    Z: 205,
    uid: "w-man",
    grip: { R: [bX + 22, -156, bucket.Z], L: [pipeX - 2, -236, pZ] },
  };
  const rimC = A.P.p(bX, bucket.rim, bucket.Z);
  const rimRx = bucket.R * A.P.r(bucket.Z);
  const rimRy = Math.abs(A.P.p(bX, bucket.rim, bucket.Z - bucket.R)[1] - A.P.p(bX, bucket.rim, bucket.Z + bucket.R)[1]) / 2;
  const surfY = lerp(bucket.bot, bucket.rim, 0.7);
  const spout = A.P.p(spoutX, -190, pZ);
  const into = A.P.p(spoutX, surfY, bucket.Z);
  const handle = A.P.p(bX + 22, -156, bucket.Z);
  const s = A.P.r(pZ);
  const zinc: Mat = { lit: "#B9BDB6", mid: "#8F948E", dark: "#555A56" };
  return (
    <g>
      {/* the standpipe, its spout and the lever */}
      <AirShadow A={A} X={pipeX} Z={pZ} w={24} d={16} uid="w-ps" />
      <AirBox A={A} X0={pipeX - 22} X1={pipeX + 22} Y0={-14} Y1={0} Z0={pZ - 22} Z1={pZ + 22} mat={MAT.stone} uid="w-base" />
      <AirCyl A={A} X={pipeX} Z={pZ} R={9} Y0={-226} Y1={-14} mat={STEEL} uid="w-pipe" joints={[-120]} />
      <AirBox A={A} X0={pipeX} X1={spoutX + 6} Y0={-214} Y1={-202} Z0={pZ - 6} Z1={pZ + 6} mat={STEEL} uid="w-arm" />
      <AirBox A={A} X0={spoutX - 6} X1={spoutX + 6} Y0={-204} Y1={-188} Z0={pZ - 6} Z1={pZ + 6} mat={STEEL} uid="w-noz" />
      <AirBox A={A} X0={pipeX - 4} X1={pipeX + 4} Y0={-244} Y1={-226} Z0={pZ - 4} Z1={pZ + 4} mat={STEEL} uid="w-stem" />
      <AirBox A={A} X0={pipeX - 24} X1={pipeX + 18} Y0={-250} Y1={-242} Z0={pZ - 5} Z1={pZ + 5} mat={MAT.timber} uid="w-lever" />
      {/* the bucket: body, its dark inside, the water rising, the stream, the bail */}
      <AirCyl A={A} X={bX} Z={bucket.Z} R={bucket.R} Y0={bucket.rim} Y1={bucket.bot} mat={zinc} uid="w-bk" joints={[-60, -96]} />
      <ellipse cx={rimC[0]} cy={rimC[1]} rx={rimRx * 0.94} ry={rimRy * 0.9} fill={A.tone("#4A4E4A", bucket.Z, 100)} />
      <ellipse cx={rimC[0]} cy={rimC[1] + rimRy * 0.25} rx={rimRx * 0.8} ry={rimRy * 0.55} fill={A.tone("#A9C2BB", bucket.Z, 90)} opacity={0.9} />
      <Stream a={spout} b={[into[0], rimC[1] + rimRy * 0.2]} w={9 * s} frame={frame} uid="w-st" seed={1} />
      {/* splash rings where the stream meets the water */}
      {[0, 1].map((j) => {
        const t = ((frame * 0.07 + j * 0.5) % 1 + 1) % 1;
        return <ellipse key={j} cx={into[0]} cy={rimC[1] + rimRy * 0.25} rx={rimRx * (0.2 + 0.5 * t)} ry={rimRy * (0.12 + 0.3 * t)} fill="none" stroke={WATER_HI} strokeOpacity={0.7 * (1 - t)} strokeWidth={1.4 * s} />;
      })}
      <Fig A={A} s={man} frame={frame} />
      <path
        d={`M${Pt([rimC[0] - rimRx, rimC[1]])}Q${Pt([rimC[0] - rimRx * 0.2, handle[1] - 26 * s])} ${Pt(handle)}Q${Pt([rimC[0] + rimRx * 1.25, handle[1] + 6 * s])} ${Pt([rimC[0] + rimRx, rimC[1]])}`}
        fill="none"
        stroke={A.tone("#5A5F5B", bucket.Z, 120)}
        strokeWidth={2.6 * s}
        strokeLinecap="round"
      />
    </g>
  );
};

// ===================================================================================================================
// 2 HYGIENE: a mother and her daughter wash their hands at a basin, soap bubbles rising
// ===================================================================================================================
const HygieneStation: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const cX = STATION_X.hygiene;
  const vZ0 = 96;
  const vZ1 = 176;
  const topY = -140;
  const taps = [cX - 62, cX + 66];
  const mom = { X: cX - 62, Z: 222 };
  const girl = { X: cX + 66, Z: 214, Y: -52 };
  const rub = (c: V3, ph: number, amp: number): { L: V3; R: V3 } => {
    const a = frame * 0.34 + ph;
    return {
      L: [c[0] - 9 + amp * Math.sin(a), c[1] + amp * 0.6 * Math.cos(a), c[2]],
      R: [c[0] + 9 - amp * Math.sin(a), c[1] - amp * 0.6 * Math.cos(a), c[2]],
    };
  };
  const momS: FigSpec = {
    kind: "parent",
    v: 0,
    pose: breathe({ ...POSES.turnTo(0.12), headYaw: 0.2, pitch: 14, look: [0.1, 0.8], mouth: 0.25 }, frame, 1, 2),
    X: mom.X,
    Z: mom.Z,
    uid: "h-mom",
    grip: rub([mom.X + 2, -172, mom.Z], 0, 6),
  };
  const girlS: FigSpec = {
    kind: "child",
    v: 1,
    pose: breathe({ ...POSES.turnTo(-0.15), headYaw: -0.35, pitch: 8, look: [-0.5, 0.5], mouth: 0.4 }, frame, 1, 3),
    X: girl.X,
    Y: girl.Y,
    Z: girl.Z,
    uid: "h-girl",
    grip: rub([girl.X - 2, -174, girl.Z], 1.7, 5),
    shadow: { w: 40, d: 22, amt: 0.6 },
  };
  const s = A.P.r(150);
  const handsM = A.P.p(mom.X + 2, -174, mom.Z);
  const handsG = A.P.p(girl.X - 2, -176, girl.Z);
  const basin = (x: number, i: number) => {
    const c = A.P.p(x, topY, 136);
    const rx = 46 * A.P.r(136);
    const ry = Math.abs(A.P.p(x, topY, 136 - 26)[1] - A.P.p(x, topY, 136 + 26)[1]) / 2;
    return (
      <g key={i}>
        <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={A.tone(CERAMIC.dark, 136, 158)} />
        <ellipse cx={c[0]} cy={c[1] + ry * 0.18} rx={rx * 0.84} ry={ry * 0.72} fill={A.tone("#B7C6BF", 136, 150)} />
      </g>
    );
  };
  const tap = (x: number, i: number) => {
    const Z = vZ1 - 8;
    const base = A.P.p(x, topY, Z);
    const top = A.P.p(x, -210, Z);
    const tip = A.P.p(x, -198, 146);
    const sw = 7 * A.P.r(Z);
    return (
      <g key={i}>
        <path d={`M${Pt(base)}L${Pt(top)}Q${Pt(A.P.p(x, -222, 150))} ${Pt(tip)}`} fill="none" stroke={A.tone(STEEL.dark, Z, 220)} strokeWidth={sw * 1.25} strokeLinecap="round" />
        <path d={`M${Pt(base)}L${Pt(top)}Q${Pt(A.P.p(x, -222, 150))} ${Pt(tip)}`} fill="none" stroke={A.tone(STEEL.mid, Z, 220)} strokeWidth={sw} strokeLinecap="round" />
        <path d={`M${Pt([base[0] - sw * 0.25, base[1]])}L${Pt([top[0] - sw * 0.25, top[1]])}`} stroke={CREAM} strokeOpacity={0.5} strokeWidth={sw * 0.3} strokeLinecap="round" />
      </g>
    );
  };
  return (
    <g>
      <AirBox A={A} X0={girl.X - 40} X1={girl.X + 40} Y0={girl.Y} Y1={0} Z0={190} Z1={250} mat={MAT.timber} uid="h-step" />
      <Fig A={A} s={momS} frame={frame} />
      <Fig A={A} s={girlS} frame={frame} />
      <AirShadow A={A} X={cX} Z={vZ0 + 30} w={190} d={60} amt={0.6} uid="h-vs" />
      <AirBox A={A} X0={cX - 160} X1={cX + 160} Y0={topY + 12} Y1={0} Z0={vZ0 + 6} Z1={vZ1} mat={MAT.timber} uid="h-cab" />
      <AirBox A={A} X0={cX - 172} X1={cX + 172} Y0={topY} Y1={topY + 12} Z0={vZ0} Z1={vZ1 + 6} mat={CERAMIC} uid="h-top" />
      {taps.map(basin)}
      {taps.map(tap)}
      <Stream a={A.P.p(taps[0], -196, 146)} b={handsM} w={7 * s} frame={frame} uid="h-s1" seed={2} />
      <Stream a={[handsM[0], handsM[1] + 8 * s]} b={A.P.p(taps[0], topY, 140)} w={8 * s} frame={frame} uid="h-s1b" seed={3} amt={0.8} />
      <Stream a={A.P.p(taps[1], -196, 146)} b={handsG} w={6 * s} frame={frame} uid="h-s2" seed={4} />
      <Stream a={[handsG[0], handsG[1] + 8 * s]} b={A.P.p(taps[1], topY, 140)} w={7 * s} frame={frame} uid="h-s2b" seed={5} amt={0.8} />
      <Bubbles c={handsM} s={s} frame={frame} seed={1} on={1} />
      <Bubbles c={handsG} s={s} frame={frame} seed={2} on={0.8} />
    </g>
  );
};

// ===================================================================================================================
// 3 ANTIBIOTICS: a pharmacist hands a pill bottle across the counter
// ===================================================================================================================
const PillBottle: React.FC<{ c: P2; s: number; A: AirWorld; Z: number }> = ({ c, s, A, Z }) => {
  const w = 17 * s;
  const h = 26 * s;
  return (
    <g>
      <rect x={c[0] - w / 2} y={c[1] - h / 2} width={w} height={h} rx={3 * s} fill={A.tone("#ECE7DC", Z, 220)} stroke={A.tone("#A79E8B", Z, 220)} strokeWidth={0.9 * s} />
      <rect x={c[0] - w / 2} y={c[1] - h * 0.12} width={w} height={h * 0.38} fill={A.tone("#7D9A95", Z, 220)} />
      <rect x={c[0] - w * 0.58} y={c[1] - h / 2 - 6 * s} width={w * 1.16} height={7 * s} rx={1.6 * s} fill={A.tone("#4F5A60", Z, 220)} />
      <path d={`M${Pt([c[0] - w * 0.3, c[1] - h * 0.42])}L${Pt([c[0] - w * 0.3, c[1] + h * 0.4])}`} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={2 * s} strokeLinecap="round" />
    </g>
  );
};
const PharmacyStation: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const cX = STATION_X.antibiotics;
  const ph = { X: cX + 52, Z: 300 };
  const cu = { X: cX - 122, Z: 196 };
  const topY = -186;
  // the hand-over: pharmacist out f172-196, customer reaches f194-212 (contact f212), both f212-220, she draws it back
  const H: V3 = [cX - 34, -214, 240];
  const phRest: V3 = [cX + 14, -198, 262];
  const cuRest: V3 = [cu.X + 34, -142, cu.Z];
  const cuKeep: V3 = [cu.X + 30, -212, cu.Z];
  const out = sst(172, 196, frame) * (1 - sst(222, 248, frame));
  const reach = sst(194, 212, frame);
  const back = sst(220, 246, frame);
  const phHand: V3 = [lerp(phRest[0], H[0], out), lerp(phRest[1], H[1], out) - 8 * Math.sin(Math.PI * out), lerp(phRest[2], H[2], out)];
  const cuHand: V3 = back > 0 ? [lerp(H[0], cuKeep[0], back), lerp(H[1], cuKeep[1], back) - 6 * Math.sin(Math.PI * back), lerp(H[2], cuKeep[2], back)] : [lerp(cuRest[0], H[0], reach), lerp(cuRest[1], H[1], reach), lerp(cuRest[2], H[2], reach)];
  const pharm: FigSpec = {
    kind: "officer",
    v: 3,
    pose: breathe({ ...POSES.stand(-1), headYaw: -0.55, pitch: 6 + 4 * out, look: [-0.5, 0.3], mouth: 0.3 }, frame, 1, 4),
    X: ph.X,
    Z: ph.Z,
    uid: "p-ph",
    grip: { R: phHand },
  };
  const cust: FigSpec = {
    kind: "elder",
    v: 1,
    pose: breathe({ ...POSES.stand(1), headYaw: 0.58, pitch: 2, look: [0.5, 0.1 + 0.3 * reach], mouth: 0.35 }, frame, 1, 5),
    X: cu.X,
    Z: cu.Z,
    uid: "p-cu",
    grip: { L: cuHand },
    hold: { L: "none", R: "handbag" },
  };
  const holder = frame < 216 ? phHand : cuHand;
  const bZ = frame < 216 ? ph.Z : cu.Z;
  const bs = A.P.r(bZ);
  const bc = A.P.p(holder[0], holder[1] - 4, holder[2]);
  const shelfZ = 430;
  const boxes: [number, number, number, number, string][] = [
    [cX + 30, cX + 66, -236, -196, "#D9D0BD"],
    [cX + 74, cX + 98, -230, -196, "#7D9A95"],
    [cX + 108, cX + 150, -240, -196, "#C9BDA3"],
    [cX + 160, cX + 186, -226, -196, "#8E7F6A"],
    [cX + 40, cX + 72, -334, -300, "#7D9A95"],
    [cX + 84, cX + 124, -340, -300, "#D9D0BD"],
    [cX + 136, cX + 160, -330, -300, "#6E7C80"],
  ];
  return (
    <g>
      {/* the shelves behind him */}
      <AirBox A={A} X0={cX + 14} X1={cX + 206} Y0={-372} Y1={0} Z0={shelfZ} Z1={shelfZ + 34} mat={MAT.timber} uid="p-back" />
      {[-196, -300].map((y, j) => (
        <AirBox key={j} A={A} X0={cX + 14} X1={cX + 206} Y0={y} Y1={y + 8} Z0={shelfZ - 30} Z1={shelfZ} mat={MAT.timber} uid={`p-sh${j}`} />
      ))}
      {boxes.map(([x0, x1, y0, y1, col], j) => (
        <AirBox key={j} A={A} X0={x0} X1={x1} Y0={y0} Y1={y1} Z0={shelfZ - 26} Z1={shelfZ - 6} mat={{ lit: col, mid: mixHex(col, "#3A3128", 0.18), dark: mixHex(col, "#22180F", 0.5) }} uid={`p-b${j}`} />
      ))}
      <Fig A={A} s={pharm} frame={frame} />
      {/* the counter */}
      <AirShadow A={A} X={cX + 40} Z={170} w={150} d={50} amt={0.6} uid="p-cs" />
      <AirBox A={A} X0={cX - 62} X1={cX + 170} Y0={topY + 10} Y1={0} Z0={156} Z1={226} mat={MAT.timber} uid="p-cnt" />
      <AirBox A={A} X0={cX - 70} X1={cX + 178} Y0={topY} Y1={topY + 10} Z0={150} Z1={232} mat={CERAMIC} uid="p-ctop" />
      <Fig A={A} s={cust} frame={frame} />
      <PillBottle c={bc} s={bs} A={A} Z={bZ} />
    </g>
  );
};

// ===================================================================================================================
// 4 THERAPEUTIC CARE: a nurse checks the drip of a patient sitting up in bed
// ===================================================================================================================
const TherapyStation: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const cX = STATION_X.therapy;
  const bed = { x0: cX - 150, x1: cX + 150, z0: 186, z1: 316, top: -100 };
  const pat = { X: cX - 96, Z: 250 };
  const pole = { X: cX - 14, Z: 356 };
  const bag = { X: cX + 30, top: -418, bot: -344 };
  const chamber = { y0: -334, y1: -306 };
  const nurse = { X: cX + 92, Z: 410 };
  const adjust = 0.5 + 0.5 * Math.sin(frame * 0.05);
  const patS: FigSpec = {
    kind: "youth",
    v: 1,
    pose: breathe({ ...POSES.sit(1, 60), headYaw: 0.1, pitch: 4, look: [0.3, -0.6], mouth: 0.3, armL: { w: [40, -110], elbow: [0.2, 1], fist: 0.2, hand: 20 } }, frame, 1, 6),
    X: pat.X,
    Y: -40,
    Z: pat.Z,
    uid: "t-pat",
    inks: { top: "#C3CEC8", top2: "#AEBAB4" },
    hold: { L: "none", R: "none" },
    shadow: { w: 1, d: 1, amt: 0 },
  };
  const pa = anchorsOf(A, patS);
  const clamp: V3 = [bag.X + 1, chamber.y1 + 14 + 2 * adjust, pole.Z];
  const nurseS: FigSpec = {
    kind: "youth",
    v: 2,
    pose: breathe({ ...POSES.stand(-1), headYaw: -0.6, pitch: -14, look: [-0.4, -0.9] }, frame, 1, 7),
    X: nurse.X,
    Z: nurse.Z,
    uid: "t-nur",
    grip: { R: clamp },
    inks: { top: "#7E9C98", top2: "#6E8A86", lower: "#6E8A86", shoe: "#E4DED2" },
    hold: { L: "none", R: "none" },
  };
  // the drip: one drop every 26 frames falls through the chamber
  const dt = ((frame % 26) + 26) % 26;
  const cc = A.P.p(bag.X, (chamber.y0 + chamber.y1) / 2, pole.Z);
  const s = A.P.r(pole.Z);
  const dropY = lerp(chamber.y0 + 6, chamber.y1 - 6, sst(8, 20, dt));
  const drop = A.P.p(bag.X, dropY, pole.Z);
  const bagTop = A.P.p(bag.X, bag.top, pole.Z);
  const bagBot = A.P.p(bag.X, bag.bot, pole.Z);
  const bw = 46 * s;
  const tubeA = A.P.p(bag.X, chamber.y1, pole.Z);
  const wrist = pa.wristL;
  const tube = `M${Pt(tubeA)}C${Pt([tubeA[0] - 6 * s, tubeA[1] + 110 * s])} ${Pt([wrist[0] + 50 * s, wrist[1] + 10 * s])} ${Pt(wrist)}`;
  const legs = [
    [bed.x0 + 12, bed.z0 + 10],
    [bed.x1 - 12, bed.z0 + 10],
    [bed.x0 + 12, bed.z1 - 10],
    [bed.x1 - 12, bed.z1 - 10],
  ];
  return (
    <g>
      <Fig A={A} s={nurseS} frame={frame} />
      {/* the drip stand, its arm, the bag and its chamber */}
      <AirShadow A={A} X={pole.X} Z={pole.Z} w={34} d={20} uid="t-ps" />
      <AirCyl A={A} X={pole.X} Z={pole.Z} R={5} Y0={-430} Y1={0} mat={STEEL} uid="t-pole" />
      <AirBox A={A} X0={pole.X} X1={bag.X + 4} Y0={-434} Y1={-428} Z0={pole.Z - 3} Z1={pole.Z + 3} mat={STEEL} uid="t-parm" />
      <path d={`M${Pt(A.P.p(bag.X, -428, pole.Z))}L${Pt(bagTop)}`} stroke={A.tone(STEEL.dark, pole.Z, 400)} strokeWidth={2 * s} />
      <rect x={bagTop[0] - bw / 2} y={bagTop[1]} width={bw} height={bagBot[1] - bagTop[1]} rx={9 * s} fill={A.tone("#E6E8E0", pole.Z, 380)} fillOpacity={0.88} stroke={A.tone("#A8ADA6", pole.Z, 380)} strokeWidth={1.2 * s} />
      <rect x={bagTop[0] - bw / 2 + 4 * s} y={lerp(bagTop[1], bagBot[1], 0.38)} width={bw - 8 * s} height={(bagBot[1] - bagTop[1]) * 0.56} rx={6 * s} fill={A.tone("#C9D8D3", pole.Z, 380)} />
      <rect x={cc[0] - 7 * s} y={A.P.p(0, chamber.y0, pole.Z)[1]} width={14 * s} height={(chamber.y1 - chamber.y0) * s} rx={4 * s} fill={A.tone("#E6E8E0", pole.Z, 330)} fillOpacity={0.9} stroke={A.tone("#A8ADA6", pole.Z, 330)} strokeWidth={1 * s} />
      {dt >= 8 && dt < 21 ? <circle cx={drop[0]} cy={drop[1]} r={2.4 * s} fill={A.tone("#B9CEC8", pole.Z, 320)} /> : null}
      <rect x={cc[0] - 7 * s} y={A.P.p(0, chamber.y1 - 7, pole.Z)[1]} width={14 * s} height={6 * s} fill={A.tone("#C9D8D3", pole.Z, 320)} />
      {/* the bed: headboard, pillow, patient, mattress, blanket, footboard */}
      <AirShadow A={A} X={cX} Z={bed.z0 + 60} w={200} d={70} amt={0.6} uid="t-bs" />
      {legs.slice(2).map(([x, zz], j) => (
        <AirCyl key={j} A={A} X={x} Z={zz} R={5} Y0={-44} Y1={0} mat={STEEL} uid={`t-lg${j}`} />
      ))}
      <AirBox A={A} X0={bed.x0 - 14} X1={bed.x0} Y0={-214} Y1={-36} Z0={bed.z0} Z1={bed.z1} mat={STEEL} uid="t-head" />
      <AirBox A={A} X0={bed.x0} X1={bed.x0 + 44} Y0={-188} Y1={bed.top} Z0={bed.z0 + 14} Z1={bed.z1 - 14} mat={CERAMIC} uid="t-pil" />
      <Fig A={A} s={patS} frame={frame} />
      <AirBox A={A} X0={bed.x0} X1={bed.x1} Y0={-64} Y1={-40} Z0={bed.z0 + 4} Z1={bed.z1 - 4} mat={STEEL} uid="t-base" />
      <AirBox A={A} X0={bed.x0} X1={bed.x1} Y0={bed.top} Y1={-64} Z0={bed.z0} Z1={bed.z1} mat={MATTRESS} uid="t-mat" />
      <AirBox A={A} X0={pat.X + 22} X1={bed.x1 + 6} Y0={bed.top - 16} Y1={bed.top + 18} Z0={bed.z0 - 6} Z1={bed.z1 + 2} mat={BLANKET} uid="t-blk" />
      {legs.slice(0, 2).map(([x, zz], j) => (
        <AirCyl key={j} A={A} X={x} Z={zz} R={5} Y0={-40} Y1={0} mat={STEEL} uid={`t-lf${j}`} />
      ))}
      <AirBox A={A} X0={bed.x1} X1={bed.x1 + 14} Y0={-160} Y1={-36} Z0={bed.z0} Z1={bed.z1} mat={STEEL} uid="t-foot" />
      <path d={tube} fill="none" stroke={A.tone("#D8DCD3", 250, 250)} strokeWidth={2.4 * s} strokeOpacity={0.9} strokeLinecap="round" />
      <circle cx={wrist[0]} cy={wrist[1]} r={4 * s} fill={A.tone("#E8E4DA", 250, 150)} />
    </g>
  );
};

// ===================================================================================================================
// 5 REHABILITATION: an old man steps between parallel bars toward his physio
// ===================================================================================================================
const RehabStation: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const cX = STATION_X.rehab;
  const bx0 = cX - 150;
  const bx1 = cX + 62;
  const zN = 112;
  const zF = 232;
  const railY = -176;
  const CYC = 58;
  const f0 = 236;
  const x0 = cX + 44;
  const adv = walkAdvance(1, CYC);
  // he starts from a stand (the walk eases in over f226-246): travel and phase both integrate the ease
  let I = 0;
  for (let g = f0 - 10; g < frame; g += 0.5) I += 0.5 * sst(f0 - 10, f0 + 10, g + 0.25);
  const ex = x0 - adv * I;
  const phase = I / CYC;
  const eZ = 172;
  const walk = POSES.walk(-1, phase, sst(f0 - 10, f0 + 10, frame));
  const elder: FigSpec = {
    kind: "elder",
    v: 0,
    pose: { ...walk, pitch: 8, lean: -4, crouch: 4, look: [-0.5, 0.2] },
    X: ex,
    Z: eZ,
    uid: "r-eld",
    grip: { R: [ex - 26, railY - 4, zN], L: [ex - 22, railY - 4, zF] },
  };
  const ea = anchorsOf(A, elder);
  const elbow2: P2 = lerp2(ea.shoulderR, ea.wristR, 0.5);
  const reach = sst(286, 338, frame);
  const phy = { X: cX - 205, Z: 158 };
  const phyRest: P2 = A.P.p(phy.X + 64, -196, phy.Z);
  const phyS: FigSpec = {
    kind: "youth",
    v: 0,
    pose: breathe({ ...POSES.stand(1), headYaw: 0.5, pitch: 6, look: [0.5, 0.2], mouth: 0.25 + 0.15 * Math.sin(frame * 0.2) }, frame, 1, 8),
    X: phy.X,
    Z: phy.Z,
    uid: "r-phy",
    hold: { L: "none", R: "none" },
  };
  const target = lerp2(phyRest, [elbow2[0] - 6, elbow2[1] + 4], reach);
  const posts = [bx0, bx1];
  return (
    <g>
      <AirBox A={A} X0={bx0 - 30} X1={bx1 + 30} Y0={-5} Y1={0} Z0={zN - 34} Z1={zF + 30} mat={MAT_SLATE} uid="r-mat" />
      {posts.map((x, j) => (
        <AirCyl key={j} A={A} X={x} Z={zF} R={6} Y0={railY} Y1={-5} mat={STEEL} uid={`r-pf${j}`} />
      ))}
      <AirBox A={A} X0={bx0 - 8} X1={bx1 + 8} Y0={railY - 8} Y1={railY} Z0={zF - 5} Z1={zF + 5} mat={MAT.timber} uid="r-rf" />
      <Fig A={A} s={elder} frame={frame} />
      <Fig A={A} s={{ ...phyS, grip: { L: target } }} frame={frame} />
      {posts.map((x, j) => (
        <AirCyl key={j} A={A} X={x} Z={zN} R={6} Y0={railY} Y1={-5} mat={STEEL} uid={`r-pn${j}`} />
      ))}
      <AirBox A={A} X0={bx0 - 8} X1={bx1 + 8} Y0={railY - 8} Y1={railY} Z0={zN - 5} Z1={zN + 5} mat={MAT.timber} uid="r-rn" />
    </g>
  );
};

// ===================================================================================================================
// 6 VACCINES: a health worker vaccinates a boy's upper arm; the charge and the spot glow orange
// ===================================================================================================================
export const T_CONTACT = 369;
export const T_STEP = 378;
const vaccineChild = (frame: number): CovidPose => {
  const flinch = sst(T_CONTACT - 1, T_CONTACT + 3, frame) * (1 - sst(T_CONTACT + 6, T_CONTACT + 22, frame));
  const relief = sst(T_STEP, T_STEP + 14, frame);
  const base = POSES.sit(-1, 84);
  return breathe(
    {
      ...base,
      yaw: -0.42,
      headYaw: -0.62 + 0.12 * relief,
      pitch: 2 - 3 * flinch,
      look: [-0.7 + 0.5 * relief, -0.1],
      worry: 0.45 * (1 - relief),
      lids: 0.35 * flinch,
      mouth: 0.1 + 0.35 * relief,
      armR: { w: [-10, -116], elbow: [0.4, 1], fist: 0.25, hand: 20 },
      armL: { w: [-26, -112], elbow: [-0.3, 1], fist: 0.25, hand: 20 },
    },
    frame,
    1.3,
    9,
  );
};
const VaccineStation: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const cX = STATION_X.vaccine;
  const ch = { X: cX - 74, Z: 206 };
  const wk = { X: cX + 64, Z: 176 };
  const seat = { x0: ch.X - 36, x1: ch.X + 40, z0: ch.Z - 34, z1: ch.Z + 34, y: -84 };
  const childS: FigSpec = { kind: "child", v: 0, pose: vaccineChild(frame), X: ch.X, Z: ch.Z, uid: "v-ch", shadow: { w: 1, d: 1, amt: 0 } };
  const ca = anchorsOf(A, childS);
  // the jab point: the near upper arm's outer face (a third down from the shoulder)
  const sc = A.P.r(ch.Z);
  const up = lerp2(ca.shoulderR, ca.wristR, 0.3);
  const jab: P2 = [up[0] + 9 * sc, up[1] + 2 * sc];
  // the syringe: tip and direction keyed; the hand grips the barrel's back
  const ws = A.P.r(wk.Z);
  const ready: P2 = A.P.p(wk.X - 34, -232, wk.Z);
  const dReady = Math.atan2(-1, 0.2);
  const dJab = Math.atan2(0.3, -0.95);
  const swing = sst(328, 360, frame);
  const ang = lerp(dReady, dJab, swing) + 0.06 * Math.sin(frame * 0.07) * (1 - swing);
  const dv: P2 = [Math.cos(ang), Math.sin(ang)];
  const GRIP = 50;
  const readyTip: P2 = [ready[0] + dv[0] * GRIP * ws, ready[1] + dv[1] * GRIP * ws];
  const pre: P2 = [jab[0] - Math.cos(dJab) * 16 * ws, jab[1] - Math.sin(dJab) * 16 * ws];
  const toPre = sst(330, 362, frame);
  const toJab = c01((frame - 362) / (T_CONTACT - 362));
  const inT = 1 - (1 - toJab) * (1 - toJab);
  let tip = lerp2(readyTip, pre, toPre);
  if (frame >= 362) tip = lerp2(pre, jab, inT);
  if (frame >= T_CONTACT) tip = [jab[0] + Math.cos(dJab) * 3 * ws * sst(T_CONTACT, T_CONTACT + 4, frame), jab[1] + Math.sin(dJab) * 3 * ws * sst(T_CONTACT, T_CONTACT + 4, frame)];
  const hand2: P2 = [tip[0] - dv[0] * GRIP * ws, tip[1] - dv[1] * GRIP * ws];
  const push = sst(T_CONTACT + 1, T_STEP + 2, frame);
  const worker: FigSpec = {
    kind: "commuter",
    v: 2,
    pose: breathe({ ...POSES.stand(-1), yaw: -0.7, headYaw: -0.62, pitch: 10 + 6 * swing, look: [-0.5, 0.4 + 0.3 * swing], mouth: 0.45, brow: -0.2 }, frame, 1, 10),
    X: wk.X,
    Z: wk.Z,
    uid: "v-wk",
    grip: { R: hand2 },
    inks: { top: "#ECE8DE", top2: "#D8D3C6", lower: "#6E7C80" },
    hold: { L: "none", R: "none" },
  };
  const glowA = frame < T_CONTACT ? 0 : 0.45 + 0.1 * sst(T_CONTACT, T_CONTACT + 4, frame) + 0.45 * sst(T_STEP, T_STEP + 5, frame);
  const pulse = 1 + 0.05 * Math.sin(frame * 0.21);
  const legs: P2[] = [
    [seat.x0 + 6, seat.z0 + 6],
    [seat.x1 - 6, seat.z0 + 6],
    [seat.x0 + 6, seat.z1 - 6],
    [seat.x1 - 6, seat.z1 - 6],
  ];
  return (
    <g>
      <AirShadow A={A} X={ch.X} Z={ch.Z} w={56} d={36} amt={0.7} uid="v-ss" />
      {legs.slice(2).map(([x, zz], j) => (
        <AirCyl key={j} A={A} X={x} Z={zz} R={4} Y0={seat.y + 8} Y1={0} mat={MAT.timber} uid={`v-lb${j}`} />
      ))}
      {legs.slice(0, 2).map(([x, zz], j) => (
        <AirCyl key={j} A={A} X={x} Z={zz} R={4} Y0={seat.y + 8} Y1={0} mat={MAT.timber} uid={`v-lf${j}`} />
      ))}
      <AirBox A={A} X0={seat.x0} X1={seat.x1} Y0={seat.y} Y1={seat.y + 9} Z0={seat.z0} Z1={seat.z1} mat={MAT.timber} uid="v-seat" />
      <Fig A={A} s={childS} frame={frame} />
      {/* the pushed-up sleeve's bare patch and its glow */}
      <ellipse cx={jab[0] - 2 * sc} cy={jab[1]} rx={6.5 * sc} ry={9 * sc} fill={A.tone("#E9C3A6", ch.Z, 150)} />
      {glowA > 0 ? (
        <g>
          <circle cx={jab[0]} cy={jab[1]} r={16 * sc * pulse} fill={ACCENT} opacity={0.22 * glowA} />
          <circle cx={jab[0]} cy={jab[1]} r={8 * sc * pulse} fill={ACCENT} opacity={0.45 * glowA} />
          <circle cx={jab[0]} cy={jab[1]} r={3.6 * sc} fill="#FFE7A8" opacity={0.95 * glowA} />
        </g>
      ) : null}
      <Fig A={A} s={worker} frame={frame} />
      <Syringe tip={tip} ang={ang} s={ws} push={push} />
    </g>
  );
};

/** a syringe: tip at `tip`, pointing along `ang` (rad), scale s; push 0..1 drives the plunger home */
const Syringe: React.FC<{ tip: P2; ang: number; s: number; push: number }> = ({ tip, ang, s, push }) => {
  const deg = (ang * 180) / Math.PI + 180;
  const fluid = lerp(30, 3, push);
  const B0 = 20;
  const B1 = 58;
  const stop = B0 + fluid;
  return (
    <g transform={`translate(${f2(tip[0])} ${f2(tip[1])}) rotate(${deg.toFixed(3)}) scale(${s.toFixed(5)})`}>
      <path d="M0 0L17 0" stroke="#8C9496" strokeWidth={1.5} strokeLinecap="round" />
      <rect x={15} y={-3.2} width={6} height={6.4} rx={1} fill="#C9CCC4" />
      <rect x={B0} y={-6} width={B1 - B0} height={12} rx={2} fill="#ECE9DE" fillOpacity={0.7} stroke="#9EA39B" strokeWidth={0.9} />
      <rect x={B0 + 1} y={-4.4} width={fluid} height={8.8} rx={1.4} fill={ACCENT} />
      <rect x={B0 + 1} y={-4.4} width={fluid} height={2.6} rx={1} fill="#FFE7A8" opacity={0.7} />
      <rect x={stop} y={-5} width={4} height={10} rx={1} fill="#4F5A60" />
      <rect x={stop + 4} y={-1.6} width={B1 + 14 - stop - 4 + (1 - push) * 0} height={3.2} fill="#D6D2C6" stroke="#9EA39B" strokeWidth={0.6} />
      <rect x={B1 - 1} y={-11} width={3.4} height={22} rx={1.2} fill="#D6D2C6" stroke="#9EA39B" strokeWidth={0.6} />
      <rect x={stop + B1 + 14 - stop - 1} y={-8} width={3.4} height={16} rx={1.2} fill="#D6D2C6" stroke="#9EA39B" strokeWidth={0.6} />
      {[28, 36, 44].map((x) => (
        <path key={x} d={`M${x} -6V-2.6`} stroke={ORANGE_LINE} strokeOpacity={0.5} strokeWidth={0.7} />
      ))}
    </g>
  );
};

/** the floor nearer than the depth kit draws it (its zNear): the near floor's own tone down to the frame's bottom */
const NearFloor: React.FC<{ A: AirWorld }> = ({ A }) => {
  const y0 = A.P.p(0, 0, A.P.zNear)[1] - 4 / A.k;
  const col = mixHex(mixHex(MAT.stone.lit, MAT.stone.mid, 0.3), MAT.stone.dark, 0.2);
  return <rect x={A.cam.cx - 800 / A.k} y={y0} width={1600 / A.k} height={1200 / A.k} fill={A.tone(col, 0, 0)} />;
};
/** the floor below the stations' feet falls off into the dense low air (the style's "Lower frame" rule): a gradient over
 *  the GROUND only (drawn before every object), from ~40 px under the feet row to opaque ~300 px further down */
const FloorSink: React.FC<{ A: AirWorld }> = ({ A }) => {
  const k = A.k;
  const feet = A.P.p(0, 0, 120)[1];
  const y0 = feet + 40 / k;
  const y1 = y0 + 300 / k;
  // the air ramp's petrol into espresso: a calm brown-teal mid tone (L* ~25), never a black void
  const low = "#454B42";
  const mid = "#43605B";
  const x = A.cam.cx - 800 / k;
  return (
    <g>
      <defs>
        <linearGradient id="fsink" gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y1)}>
          <stop offset="0" stopColor={mid} stopOpacity={0} />
          <stop offset="0.45" stopColor={mid} stopOpacity={0.55} />
          <stop offset="1" stopColor={low} stopOpacity={0.94} />
        </linearGradient>
      </defs>
      <rect x={f2(x)} y={f2(y0)} width={f2(1600 / k)} height={f2(y1 - y0)} fill="url(#fsink)" />
      <rect x={f2(x)} y={f2(y1 - 0.5 / k)} width={f2(1600 / k)} height={f2(2400 / k)} fill={low} fillOpacity={0.94} />
    </g>
  );
};

// ===================================================================================================================
const SixOrSevenTools: React.FC<z.infer<typeof schema>> = ({ rehabIcon }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, fogBy: "depth" });
  const S = STATION_X;
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <NearFloor A={A} />
        <AirFloor A={A} x0={-3600} x1={5600} z0={-6000} z1={6500} mat={MAT.stone} course={260} lw={0.55} jointAmt={0.45} />
        <FloorSink A={A} />
        <AirHorizonHazeW A={A} id="haze" />
        {SIGN_X.map((x, i) => (onScreen(A, x - SIGN_W / 2 - 60, x + SIGN_W / 2, SIGN_Z) ? <SignPost key={i} A={A} i={i} frame={frame} icon={i === 4 && rehabIcon === "crutch" ? ICON_CRUTCH : i} /> : null))}
        {onScreen(A, S.water - 120, S.water + 130, 180) ? <WaterStation A={A} frame={frame} /> : null}
        {onScreen(A, S.hygiene - 180, S.hygiene + 180, 150) ? <HygieneStation A={A} frame={frame} /> : null}
        {onScreen(A, S.antibiotics - 200, S.antibiotics + 210, 200) ? <PharmacyStation A={A} frame={frame} /> : null}
        {onScreen(A, S.therapy - 170, S.therapy + 170, 250) ? <TherapyStation A={A} frame={frame} /> : null}
        {onScreen(A, S.rehab - 230, S.rehab + 130, 170) ? <RehabStation A={A} frame={frame} /> : null}
        {onScreen(A, S.vaccine - 130, S.vaccine + 140, 190) ? <VaccineStation A={A} frame={frame} /> : null}
      </WorldSvg>
    </AirStage>
  );
};

export default SixOrSevenTools;
