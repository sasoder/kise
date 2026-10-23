// ---------------------------------------------------------------------------
// DiophantusPopsUp (kyle-greek-math, cut 4). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 186 frames. The world: ./greekStairWorld.tsx (the Stair of Greek mathematics, shared
// with cuts C and D; read only; contract <notes>/STAIR_READY.md). Camera, rises and walks: ./diophantusPopsUpPlan.ts.
//
// CHECK LINE: "After Euclid the trail goes foggy, but lone brilliant mathematicians still pop up, centuries later —
// Diophantus, already in the Roman world."
//
// THE LINE: "[what happens after Euclid, because it's] very hard to say. But you get like these really interesting
// people like pop up like Diophantus, who's later is in the Roman, early Roman Empire. [Like there's still...]"
// WORD -> FRAME: very hard to say 4-26 · But you get like 28-42 · these really 43-53 · interesting 53-61 · people 61-73 ·
// like 73 · pop up 80-91 · like 91 · Diophantus 95-114 · who's later 114-132 · is in the 132-143 · Roman 143-149 ·
// early 150-160 · Roman Empire 160-178 · Like 183 ("Euclid" is said at f-34, on camera, before the cut)
// DURATION: the slot 4.738 -> 10.944 s = sequence frames 142 -> 328 at 29.97 = 186 frames (f0..f185).
//
// THE MOTION (V3, Revision 1: "rushed; the pillars are too far from each other" -> the scale and the smoothness of
// kyle-rome-slavery FreeStreetNoEngine's street; the style unchanged). One calm glide down an avenue of lone columns.
// f0 ("very hard to say"): as delivered, the eye just above and behind Euclid's right shoulder on his landing (EUCLID
// carved in the riser), the frame leaning left into the fog. f0-34: the glide eases out of f0 and up over Euclid (he
// sinks out of the lower left by ~f14) into the fog while the look begins its one slow turn right. f34-140: one
// near-constant glide (~0.36 m a frame) straight down the avenue (heading 15 deg right of the world's depth), the look
// settling onto the glide's heading by f84, so the avenue opens from the frame's middle. Four lone columns, the cut's
// own, alternate left / right ~3 m off the glide and ~6 m apart along it, each rising out of the low air and settled
// before the glide passes it, ~230-420 px (scholar) as it slides out of the frame, the next one already standing behind
// it in the haze: Archimedes (sphere in the cylinder; left; settled f44, out of the frame f63), Apollonius (the cone;
// right; f58 / f86), Eratosthenes (the Earth's measure; left; f72 / f100), Hipparchus (a chord; right; settled f86 on
// "pop up", out f111). Diophantus closes the avenue: his column rises dead ahead and settles on his name (~f105).
// f90-140: the glide bends softly right toward him while the look moves onto him (f100-168); the Roman aqueduct comes
// out of the haze behind him (clear by "Roman", f143), a dominus and a freeman stroll out along the terrace (~f128 on).
// f140-185: a soft ease into V2's end camera (blended over f168-185): the end composition exactly as delivered.
// Diophantus ~320 px (head ~y 470) before the aqueduct's arches, DIOPHANTUS on his band at y ~1000-1020, the Romans
// small on the terrace (faces ~y 920-975), all above the caption bands; below them the column and the terrace sink
// into the dense low air.
// Orange = Greek mathematical knowledge (the Elements, the works on the columns, Diophantus's Arithmetica); the
// Romans, the aqueduct and everything else in muted earth tones, people never orange. No text but the world's carved
// EUCLID and DIOPHANTUS.
//
// DEPTH: greekStairWorld's level pinhole (StairCam: eye X, height E, depth Zc, focal F, horizon row hy) plus this
// cut's horizontal lens shift `sh` (the world has no yaw; the shift turns the frame without bending a vertical).
// Units U = 178 per metre. f0: eye (1.98, 11.7, 2.1) m, F 1000, Euclid 4.4 m ahead; the glide (diophantusPopsUpPlan
// V3: heading + speed integrated per frame, the late heading and the cruise solved to land on V2's end eye) rises
// ~1 m over him by f24 and comes down to 10.6 m; the end: eye (19.6, 10.6, 53.6) m, F 2500, Diophantus 14.4 m ahead
// (Z 68 m), the aqueduct at Z 82 m. The avenue (diophantusPopsUpPlan AVENUE / LONE): each column placed by the frame
// the glide passes it (12 m ahead, 3 m to the side of the look), capital tops 9.0-9.9 m; the world's COLUMNS are
// untouched (its Archimedes / Apollonius / Ptolemy stay sunk in A). The world in three depth passes (back Z >= 76 m,
// columns Z 24-68 m, near Z <= 9 m) with this cut's own air between them: a fog bank of camera-facing veils (Z 9.6-16 m) and wisps (Z 10-23 m) that thin as the
// eye nears them, and one far-haze veil (Z 72 m) that keeps the Roman background hidden until the approach. The
// backdrop rows are re-read 50 m ahead of the eye (see sceneOf: the world's stairAirOf reads them at the absolute
// Z = 50 m, which inverts once the eye passes Z ~50 m). The columns rise via the world's opts.rise on a surfacing
// profile (the world clamps rise at 1: the settle approaches from below, no overshoot); the avenue's columns on their
// own profile (gathering speed inside the low air, one soft deceleration once visible). The generations are hidden
// (behind and below the eye; no slivers); the third Roman (roman2) is hidden; roman0/roman1 are drawn by this cut.
//
// SOURCES: the world's (greekStairWorld header): Archimedes' sphere in the cylinder (On the Sphere and Cylinder;
// Cicero, Tusc. V.64), Apollonius' Conics, Ptolemy's astrolabe (Planisphaerium), Diophantus's Arithmetica (c. AD
// 250, Alexandria, under Rome); the Romans are RomeFolk. No dates or figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirStage, RomeFolk, WorldSvg, airRamp, lineOf, mixHex, rgbHex, smoothstep, type AirView, type Cam, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import * as GF from "./greekFolk";
import { CAPITAL, COLUMNS, GENERATIONS, GreekStairWorld, NEAR, TERRACE, U, WORK_DIAGRAMS, lowAirAt, riseOffset, stairAirOf, tOfHeight, type StairAir, type WorldOpts } from "./greekStairWorld";
import { DURATION as PLAN_DURATION, LONE, OFF_JOIN, REST_A, WALKERS, cameraA, loneDrop, loneRise, riseA, type ACam, type LoneCol } from "./diophantusPopsUpPlan";

export const FPS = 30000 / 1001;
export const DURATION = 186;
if (DURATION !== PLAN_DURATION) throw new Error("DiophantusPopsUp: DURATION != plan DURATION");
export const schema = z.object({
  /** probe only (stills): JSON { f?, cam?: {X, E, Zc (m), F, hy, sh (px)}, rise?: number[] } */
  probe: z.string().default(""),
});
export const defaultProps = schema.parse({});

const PAL = AIR.A;

// ---- Euclid from behind: his three-quarter back, looking out past the landing's edge into the fog ---------------
/** greekFolk yaw: 0 front .. PI back; ~2.45 = his three-quarter back (the dividers show beside him) */
export const EUCLID_BACK_YAW = 2.45;
export const euclidBack = (t: number): GF.GPose => {
  const q = GF.POSES.holdScroll(-1, EUCLID_BACK_YAW);
  const b = GF.idle({ ...q, pitch: q.pitch - 2 + 1.2 * Math.sin(t / 26), crouch: q.crouch + 0.8 * Math.sin(t / 26) }, t, 11, 1.2);
  return { ...b, dz: q.dz };
};

// ---- the fog bank beyond the landing: what comes after Euclid is hidden; the glide passes through it --------------
/** camera-facing veils at these depths (m); each thins as the eye nears it (never a sheet crossing the lens) */
export const FOG_BANK = { Z: [9.6, 11.2, 12.8, 14.4, 16.0], a: 0.21, milk: 0.16, near: 0.9, clear: 6.5 };
type Item = { z: number; el: React.ReactNode };
/** the fog bank's gradient (by screen row: the backdrop's air, milkier) and its sheets as depth items */
const fogBankItems = (v: AirView, cam: Cam, c: ACam): { defs: React.ReactNode; items: Item[] } => {
  const w = (sx: number) => cam.cx + (sx - 540) / cam.k;
  const h = (sy: number) => cam.cy + (sy - 960) / cam.k;
  const stops = Array.from({ length: 25 }, (_, i) => {
    const sy = -80 + (2080 * i) / 24;
    const air = rgbHex(v.airAtScreen(sy));
    return [i / 24, mixHex(air, PAL.cream, FOG_BANK.milk)] as [number, string];
  });
  const items: Item[] = [];
  FOG_BANK.Z.forEach((Zm, k) => {
    const D = Zm - c.Zc / U;
    const a = FOG_BANK.a * smoothstep(FOG_BANK.near, FOG_BANK.clear, D);
    if (a > 0.002) items.push({ z: Zm * U, el: <rect key={`fb${k}`} x={w(-80)} y={h(-80)} width={1240 / cam.k} height={2080 / cam.k} fill="url(#fogbank)" opacity={a} /> });
  });
  const defs = (
    <linearGradient id="fogbank" gradientUnits="userSpaceOnUse" x1="0" y1={h(-80)} x2="0" y2={h(2000)}>
      {stops.map(([o, col], i) => (
        <stop key={i} offset={o.toFixed(3)} stopColor={col} />
      ))}
    </linearGradient>
  );
  return { defs, items };
};

// ---- the wisps: soft lit streaks of fog in world space between the landing and the first columns; the glide
// streams through them (each thins as the eye nears it, so none crosses the lens) and they thin out ahead --------------
type Wisp = { X: number; H: number; Z: number; rx: number; ry: number; vx: number; a: number };
const h01 = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const WISPS: Wisp[] = Array.from({ length: 46 }, (_, i) => {
  const Z = 10 + 13 * Math.pow(h01(i * 3.1 + 1), 1.25);
  return {
    X: -15 + 33 * h01(i * 5.7 + 2),
    H: 6 + 9 * h01(i * 7.3 + 3),
    Z,
    rx: 3.2 + 4.5 * h01(i * 2.9 + 4),
    ry: 0.3 + 0.45 * h01(i * 6.1 + 5),
    vx: (0.008 + 0.018 * h01(i * 4.3 + 6)) * (h01(i * 9.7 + 7) > 0.5 ? 1 : -1),
    // fewer and fainter further ahead: the air thins
    a: (0.32 + 0.3 * h01(i * 8.9 + 8)) * (1 - 0.5 * (Z - 10) / 13),
  };
});
export const WISP_FADE = { near: 1.2, clear: 6.0 };
const wispItems = (S: StairAir, c: ACam, t: number): Item[] => {
  const out: Item[] = [];
  WISPS.forEach((w, i) => {
    const D = w.Z - c.Zc / U;
    const fade = smoothstep(WISP_FADE.near, WISP_FADE.clear, D);
    const a = w.a * fade;
    if (a < 0.004) return;
    const X = (w.X + w.vx * t) * U;
    const p = S.q(X, w.H * U, w.Z * U);
    const r = S.P.r(w.Z * U);
    const col = mixHex(S.air(w.H * U), PAL.cream, 0.3);
    out.push({
      z: w.Z * U,
      el: (
        <g key={`w${i}`}>
          <defs>
            <radialGradient id={`wsp${i}`}>
              <stop offset="0" stopColor={col} stopOpacity={a} />
              <stop offset="0.5" stopColor={col} stopOpacity={a * 0.55} />
              <stop offset="1" stopColor={col} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={p[0]} cy={p[1]} rx={w.rx * U * r} ry={w.ry * U * r} fill={`url(#wsp${i})`} />
        </g>
      ),
    });
  });
  return out;
};

// ---- V2: the cut's own two lone columns, drawn exactly like the world's (greekStairWorld ColumnEl / ColumnScholar,
// whose components are not exported: mirrored here line for line), at positions placed for this flight ------------
const MARBLE: Mat = { lit: "#F3EAD6", mid: "#D2C2A2", dark: "#8E8470" };
/** the capital's top height (m) over which a lone column comes out of the dense low air (opacity 0 -> 1) */
export const LONE_EMERGE = { h0: -2.6, h1: -0.6 };
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const LoneColumnEl: React.FC<{ S: StairAir; col: LoneCol; drop: number; uid: string }> = ({ S, col, drop, uid }) => {
  const X = col.X * U;
  const Z = col.Z * U;
  const R = col.R * U;
  if (!(Z - S.c.Zc > NEAR + R * 2)) return null;
  const top = col.top * U - drop;
  const capTop = top;
  const abH = CAPITAL.abacusH;
  const echH = CAPITAL.echinusH;
  const shaftTop = capTop - abH - echH;
  const bottom = Math.min(-2 * U, shaftTop - 1);
  const r = S.P.r(Z);
  const xL = S.q(X - R, 0, Z)[0];
  const xR = S.q(X + R, 0, Z)[0];
  const yT = S.q(X, shaftTop, Z)[1];
  const yB = S.q(X, bottom, Z)[1];
  const mat = MARBLE;
  const tH = (hex: string, H: number) => S.tone(hex, Z, H);
  const midH = (shaftTop + Math.max(0, bottom)) / 2;
  const N = 7;
  const veil: [number, string][] = [];
  const veilA: number[] = [];
  for (let k = 0; k <= N; k++) {
    const H = shaftTop + ((bottom - shaftTop) * k) / N;
    veil.push([k / N, S.air(H)]);
    veilA.push(S.fogAmt(Z, H));
  }
  const fl: string[] = [];
  for (let k = 0; k < 9; k++) {
    const a = ((-72 + (144 * k) / 8) * Math.PI) / 180;
    const x = S.q(X + R * 0.97 * Math.sin(a), 0, Z)[0];
    fl.push(`M${n3(x)},${n3(yT + 2 * r)}L${n3(x)},${n3(yB)}`);
  }
  const lw = S.lw(1.0);
  const capW = R * CAPITAL.abacusW;
  const echD = (() => {
    const y0 = S.q(X, shaftTop, Z)[1];
    const y1 = S.q(X, shaftTop + echH, Z)[1];
    const a0 = S.q(X - R * 1.02, 0, Z)[0];
    const a1 = S.q(X + R * 1.02, 0, Z)[0];
    const b0 = S.q(X - capW * 0.92, 0, Z)[0];
    const b1 = S.q(X + capW * 0.92, 0, Z)[0];
    return `M${n3(a0)},${n3(y0)}Q${n3(b0)},${n3((y0 + y1) / 2 + (y0 - y1) * 0.1)} ${n3(b0)},${n3(y1)}L${n3(b1)},${n3(y1)}Q${n3(b1)},${n3((y0 + y1) / 2 + (y0 - y1) * 0.1)} ${n3(a1)},${n3(y0)}Z`;
  })();
  const abY0 = S.q(X, capTop, Z)[1];
  const abY1 = S.q(X, capTop - abH, Z)[1];
  const abX0 = S.q(X - capW, 0, Z)[0];
  const abX1 = S.q(X + capW, 0, Z)[0];
  const capHm = capTop - abH / 2;
  // deep in the dense low air the column is hidden: it comes out of it as its top nears the surface (the world's air
  // colours a sunk column a little darker than the backdrop row behind it, which would read as a dark notch)
  const emerge = smoothstep(LONE_EMERGE.h0 * U, LONE_EMERGE.h1 * U, capTop);
  if (emerge < 0.002) return null;
  return (
    <g opacity={emerge}>
      <defs>
        <linearGradient id={`${uid}-g`} gradientUnits="userSpaceOnUse" x1={n3(xL)} y1="0" x2={n3(xR)} y2="0">
          <stop offset="0" stopColor={tH(mat.mid, midH)} />
          <stop offset="0.24" stopColor={tH(mat.lit, midH)} />
          <stop offset="0.55" stopColor={tH(mixHex(mat.lit, mat.mid, 0.6), midH)} />
          <stop offset="0.86" stopColor={tH(mixHex(mat.dark, SHADE, 0.15), midH)} />
          <stop offset="1" stopColor={tH(mixHex(mat.mid, S.air(midH), 0.4), midH)} />
        </linearGradient>
        <linearGradient id={`${uid}-v`} gradientUnits="userSpaceOnUse" x1="0" y1={n3(yT)} x2="0" y2={n3(yB)}>
          {veil.map(([o, cc], k) => (
            <stop key={k} offset={o.toFixed(3)} stopColor={cc} stopOpacity={veilA[k].toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={n3(xL)} y={n3(yT)} width={n3(xR - xL)} height={n3(Math.max(0, yB - yT))} fill={`url(#${uid}-g)`} />
      <path d={fl.join("")} stroke={tH(mat.dark, midH)} strokeWidth={lw * 0.8} strokeOpacity={0.24} />
      <path d={echD} fill={tH(mixHex(mat.lit, mat.mid, 0.4), shaftTop + echH / 2)} stroke={tH(lineOf(mat), capHm)} strokeWidth={lw} />
      <rect x={n3(abX0)} y={n3(abY0)} width={n3(abX1 - abX0)} height={n3(abY1 - abY0)} fill={tH(mat.mid, capHm)} stroke={tH(lineOf(mat), capHm)} strokeWidth={lw} />
      <path d={`M${n3(abX0)},${n3(abY0)}L${n3(abX1)},${n3(abY0)}`} stroke={PAL.cream} strokeWidth={lw * 1.2} strokeOpacity={0.5 * (1 - S.fogAmt(Z, capTop))} />
      <rect x={n3(xL)} y={n3(yT)} width={n3(xR - xL)} height={n3(Math.max(0, yB - yT))} fill={`url(#${uid}-v)`} />
    </g>
  );
};
/** the figure's veil (the world's figVeil, its visibility gate a little softer: he surfaces from the low air over more
 *  frames instead of appearing at a near-full fog in one or two) */
export const LONE_GATE = 0.74;
const loneVeil = (S: StairAir, Z: number, feetH: number) => {
  const h = feetH + 0.9 * U;
  const fd = 1 - (1 - 0.82 * S.fog(Z)) * (1 - lowAirAt(h));
  return { fog: { rgb: S.air(h), amount: Math.min(0.86, fd) }, tone: 1 - smoothstep(LONE_GATE, 1, fd) };
};
/** the avenue's works (orange line diagrams on the tablets): the world's two, plus Eratosthenes' measure of the Earth
 *  (the circle, the two radii to Syene and Alexandria, the parallel sun rays) and Hipparchus' chords */
const circ = (cx: number, cy: number, r: number, n = 40): [number, number][] => Array.from({ length: n + 1 }, (_, k) => [cx + r * Math.cos((2 * Math.PI * k) / n), cy + r * Math.sin((2 * Math.PI * k) / n)] as [number, number]);
export const LONE_WORKS: Record<string, GF.DiagramSpec> = {
  sphereCylinder: WORK_DIAGRAMS.sphereCylinder,
  cone: WORK_DIAGRAMS.cone,
  eratosthenes: {
    lines: [
      circ(0, 0.12, 0.58),
      [
        [0, 0.12],
        [0, -0.46],
      ],
      [
        [0, 0.12],
        [0.2, -0.43],
      ],
      [
        [-0.08, -0.95],
        [-0.08, -0.5],
      ],
      [
        [0.3, -0.95],
        [0.3, -0.5],
      ],
    ],
  },
  hipparchus: {
    lines: [
      circ(0, 0, 0.66),
      [
        [-0.66, 0],
        [0.66, 0],
      ],
      [
        [-0.66, 0],
        [0.33, -0.57],
        [0.66, 0],
      ],
      [
        [0.33, -0.57],
        [0.33, 0],
      ],
    ],
  },
};
export const loneScholarPose = (col: LoneCol, i: number, t: number) => GF.idle(GF.POSES.holdTablet(col.dir), t, 21 + i * 2.3);
const LoneScholar: React.FC<{ S: StairAir; col: LoneCol; i: number; drop: number; t: number }> = ({ S, col, i, drop, t }) => {
  const X = col.X * U;
  const Z = col.Z * U;
  const H = col.top * U - drop;
  if (!(Z - S.c.Zc > NEAR + 0.3 * U)) return null;
  const veil = loneVeil(S, Z, H);
  if (veil.tone < 0.01) return null;
  const at = S.q(X, H, Z);
  const scale = S.P.r(Z);
  return (
    <g>
      <Contact S={S} X={X} H={H} Z={Z} w={60} uid={`lc-${col.id}`} />
      <GF.GreekFigure kind="scholar" variant={col.variant} pose={loneScholarPose(col, i, t)} at={at} scale={scale} uid={`lf-${col.id}`} fog={veil.fog} tone={veil.tone} unitPx={S.k} held={{ two: "tablet", diagram: LONE_WORKS[col.work] }} />
    </g>
  );
};
/** a lone column is drawn only between the approved opening and ending and only while any of it is on screen (it is
 *  then not on the page at all at f0-14 and from f101 on, so those frames render exactly as V1) */
const loneOnScreen = (S: StairAir, cam: Cam, col: LoneCol, drop: number) => {
  const X = col.X * U;
  const Z = col.Z * U;
  if (Z - S.c.Zc <= NEAR) return false;
  const top = col.top * U - drop;
  const toS = (p: [number, number]) => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
  const a = toS(S.q(X - 0.8 * U, top + 2.1 * U, Z));
  const b = toS(S.q(X + 0.8 * U, Math.min(-2 * U, top - 1), Z));
  return b[0] > 0 && a[0] < 1080 && b[1] > 0 && a[1] < 1920;
};
const loneItems = (S: StairAir, cam: Cam, f: number): Item[] => {
  const out: Item[] = [];
  if (f <= OFF_JOIN.f0) return out;
  LONE.forEach((col, i) => {
    const drop = loneDrop(col, loneRise(col, f));
    if (!loneOnScreen(S, cam, col, drop)) return;
    out.push({ z: (col.Z + col.R) * U, el: <LoneColumnEl key={`lcol${i}`} S={S} col={col} drop={drop} uid={`lcol${i}`} /> });
    out.push({ z: (col.Z - col.R * 0.2) * U, el: <LoneScholar key={`lsch${i}`} S={S} col={col} i={i} drop={drop} t={f} /> });
  });
  return out;
};

// ---- the far haze: Diophantus's Roman background (aqueduct, terrace, Romans) stays in the haze until the approach --
/** one camera-facing veil between Diophantus's column (Z 68 m) and the terrace (Z 76 m): dense while the eye is far,
 *  gone by the time it is near (D = the eye's distance to it, m) */
export const FAR_HAZE = { Z: 72, a: 0.93, d0: 24, d1: 42, milk: 0.05 };
const FarHaze: React.FC<{ v: AirView; cam: Cam; c: ACam }> = ({ v, cam, c }) => {
  const D = FAR_HAZE.Z - c.Zc / U;
  const a = FAR_HAZE.a * smoothstep(FAR_HAZE.d0, FAR_HAZE.d1, D);
  if (a < 0.002) return null;
  const w = (sx: number) => cam.cx + (sx - 540) / cam.k;
  const h = (sy: number) => cam.cy + (sy - 960) / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id="farhaze" gradientUnits="userSpaceOnUse" x1="0" y1={h(-80)} x2="0" y2={h(2000)}>
          {Array.from({ length: 25 }, (_, i) => {
            const sy = -80 + (2080 * i) / 24;
            return <stop key={i} offset={(i / 24).toFixed(3)} stopColor={mixHex(rgbHex(v.airAtScreen(sy)), PAL.cream, FAR_HAZE.milk)} />;
          })}
        </linearGradient>
      </defs>
      <rect x={w(-80)} y={h(-80)} width={1240 / cam.k} height={2080 / cam.k} fill="url(#farhaze)" opacity={a} />
    </g>
  );
};

// ---- the Romans: strolling along the terrace at the column's foot (RomeFolk, no orange) ------------------------------
const SHADE = PAL.shadow;
export const WALKERS_AT = (w: (typeof WALKERS)[number], f: number) => {
  const step = RomeFolk.walkAdvance(1);
  return { X: w.endX * U + step * (DURATION - 1 - f), phase: w.phase0 + f / RomeFolk.WALK_CYCLE };
};
/** a soft contact shadow on the terrace (the world's Contact, for a figure this cut draws itself) */
const Contact: React.FC<{ S: StairAir; X: number; H: number; Z: number; uid: string; w?: number; d?: number; amt?: number }> = ({ S, X, H, Z, uid, w = 70, d = 34, amt = 0.8 }) => {
  if (S.c.E < H) return null;
  const Xc = X + 0.18 * w;
  const Zc = Z - 0.2 * d;
  const c = S.q(Xc, H, Zc);
  const rx = w * S.P.r(Zc);
  const ry = Math.max(0.5, Math.abs(S.q(Xc, H, Zc - d)[1] - S.q(Xc, H, Zc + d)[1]) / 2);
  const a = amt * (1 - S.fogAmt(Z, H));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-cs`}>
          <stop offset="0" stopColor={SHADE} stopOpacity={0.62 * a} />
          <stop offset="0.6" stopColor={SHADE} stopOpacity={0.3 * a} />
          <stop offset="1" stopColor={SHADE} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-cs)`} />
    </g>
  );
};
const walkerEl = (id: string, S: StairAir, f: number): React.ReactNode | undefined => {
  const w = WALKERS.find((k) => k.id === id);
  if (!w) return undefined;
  const { X, phase } = WALKERS_AT(w, f);
  const H = TERRACE.H;
  const at = S.q(X, H, w.Z * U);
  const scale = S.P.r(w.Z * U);
  const veil = S.figVeil(w.Z * U, H);
  if (veil.tone < 0.01) return null;
  const pose = RomeFolk.POSES.walk(-1, phase);
  const common = { pose, at, scale, uid: `wk-${id}`, fog: veil.fog, tone: veil.tone, unitPx: S.k, variant: w.variant };
  return (
    <g>
      <Contact S={S} X={X} H={H} Z={w.Z * U} uid={`wc-${id}`} />
      {w.kind === "dominus" ? <RomeFolk.Dominus {...common} /> : <RomeFolk.Freeman {...common} pilleus={false} apron={false} />}
    </g>
  );
};

// ---- the frame ---------------------------------------------------------------------------------------------------
type Probe = { f?: number; cam?: ACam; rise?: number[] };
/** how far ahead of the eye the backdrop's air is read (the world's contract: 50 m out) */
export const BACKDROP_D = 50 * U;
/** the generations stand on the steps below and behind the eye: A never shows them (no slivers at the frame's foot) */
const GEN_IDS = GENERATIONS.map((g) => g.id);
/** the world in three depth passes (their items never interleave in depth): the back (the light, the aqueduct, the
 *  terrace, the Romans: Z >= 76 m), the columns (Z 24-68 m), the near (the landing and Euclid: Z <= 9 m) */
const HIDE_BACK = ["columns", "stair", "euclid", "roman2", ...GEN_IDS];
const HIDE_COLS = ["aqueduct", "light", "stair", "euclid", ...GEN_IDS];
const HIDE_NEAR = ["columns", "aqueduct", "light", ...GEN_IDS];

export const sceneOf = (f: number, probe?: Probe) => {
  const c0 = cameraA(probe?.f ?? f);
  const c: ACam = probe?.cam ? { ...probe.cam, X: probe.cam.X * U, E: probe.cam.E * U, Zc: probe.cam.Zc * U } : c0;
  const t = f;
  const opts: WorldOpts = {
    rise: probe?.rise ?? riseA(probe?.f ?? f),
    poseOf: (id, tt, def) => (id === "euclid" ? euclidBack(tt) : def),
    renderFigure: (id, S) => walkerEl(id, S, f),
  };
  const Sback = stairAirOf(c, t, REST_A, { ...opts, hide: HIDE_BACK });
  const Scols = stairAirOf(c, t, REST_A, { ...opts, hide: HIDE_COLS });
  const Snear = stairAirOf(c, t, REST_A, { ...opts, hide: HIDE_NEAR });
  // the horizontal lens shift: the world drawn under a camera whose centre is moved by sh screen px
  const cam: Cam = { ...Sback.cam, cx: Sback.cam.cx - c.sh / Sback.cam.k };
  // the backdrop: the air at the height each row sees BACKDROP_D ahead of the eye (STAIR_READY's "50 m out"). The
  // world's stairAirOf takes that depth from the absolute Z = 50 m (RAMP.ZB - Zc), right for C's eye at Z <= 6 m but
  // flattening and then inverting the backdrop as this cut's eye flies to Z ~54 m; the rows are recomputed here.
  const hyS = 960 + (-c.E - Sback.cam.cy) * Sback.cam.k;
  const v: AirView = { ...Sback.v, airAtScreen: (sy: number) => airRamp("A", tOfHeight(c.E + ((hyS - sy) / c.F) * BACKDROP_D)) };
  return { c, t, Sback, Scols, Snear, cam, v };
};

/** the world's column pass (in A only Diophantus rises there; the world's other lone columns stay sunk) comes out of
 *  the dense low air the way the avenue's columns do (LONE_EMERGE, by his capital's height): while his column is sunk
 *  the world tints its top a little darker than the haze behind it, which would read as a dark speck (~f54-76) */
const DIO_I = COLUMNS.findIndex((col) => col.id === "diophantus");
export const colsPassOpacity = (rise: number[]) => smoothstep(LONE_EMERGE.h0 * U, LONE_EMERGE.h1 * U, COLUMNS[DIO_I].top - riseOffset(DIO_I, rise[DIO_I] ?? 1));

const DiophantusPopsUp: React.FC<z.infer<typeof schema>> = ({ probe }) => {
  const frame = useCurrentFrame();
  const pr: Probe | undefined = probe ? (JSON.parse(probe) as Probe) : undefined;
  const { c, Sback, Scols, Snear, cam, v } = sceneOf(frame, pr);
  // the cut's own air and lone columns between the world's column pass (only Diophantus stands there in A) and its
  // near pass, in one painter's order far -> near
  const fb = fogBankItems(v, cam, c);
  const colsOp = colsPassOpacity(Scols.opts.rise ?? []);
  // (the fog-bank sheets first, in V1's order, so the approved opening renders bit for bit as V1; then the wisps and
  // the lone columns in one depth order: the columns stand beyond the bank's last sheet, Z 16 m, when they surface)
  const mid = { defs: <defs>{fb.defs}</defs>, items: [...fb.items, ...[...wispItems(Sback, c, frame), ...loneItems(Scols, cam, frame)].sort((a, b) => b.z - a.z)] };
  return (
    <AirStage v={v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <GreekStairWorld S={Sback} />
        <FarHaze v={v} cam={cam} c={c} />
        {colsOp >= 1 ? <GreekStairWorld S={Scols} /> : colsOp > 0.002 ? <g opacity={colsOp}><GreekStairWorld S={Scols} /></g> : null}
        {mid.defs}
        {mid.items.map((it) => it.el)}
        <GreekStairWorld S={Snear} />
      </WorldSvg>
    </AirStage>
  );
};

export default DiophantusPopsUp;
