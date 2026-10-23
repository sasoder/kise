// ---------------------------------------------------------------------------
// SatellitesAndRockets (zach-superpower, cut 6). Core memory podcast style (styles/core-memory.md).
// Opaque 1080x1920, 23.976 fps, 43 frames.
// The graphic standard: flat white glyphs on their hard black shadow on squared paper. No chain echo here (the
// clip's chain = COPIES; SpaceX is the original). Core Memory edits carry burned-in captions: no labels.
//
// CHECK LINE: "SpaceX is ahead on both fronts: its satellites string across the sky, and its rocket is climbing
// up to them."  (v2, director review: the rocket climbs TOWARD the train; no satellite ever crosses its body.)
//
// THE LINE (host, Ashlee Vance): "...and then SpaceX has lapped the entire world in many ways, both in satellites
// and rockets."
// WORD -> FRAME (local, Whisper, may run ~0.2 s early): both f-3 · in f2 · satellites f6-f14 · and f14 ·
// rockets f24-f33 · (speaker back on camera at f43: "Now China's spending...").
// DURATION: the slot 6.0477 -> 7.8412 s (sequence frames 145 -> 188) = 1.793 s x 23.976 = 43 frames (f0..f42).
//
// THE MOTION (v2): it opens CLOSE on a STARLINK TRAIN gliding across the middle of the frame (k 1.55: 3-4
// satellites ~250 px across, the arc's apex at screen y 780), each one a flat bus leading and ONE long solar
// array with a black cell grid, seen three-quarter from above, all moving at a constant 7 world px/f along one
// arc (R 2600, apex left of centre) that curves gently off. The camera eases back in one lobe (k 1.55 -> 1.03, mostly spent by
// f32, creeping on to f42) while its centre slides down the world, so the train rises to the upper third (apex
// 480 at f42), more of it comes into shot (5-6 satellites) and the frame makes room below. The Falcon 9 (616 px
// at scale 1.1) rises into shot from below the frame edge (nose in at f3) at a steady 51.7 screen px/f on a
// chunky white flame tongue shedding a short trail of puffs; from f22 it eases (screen terms) into the centre:
// the whole SPACEX print is clear of the caption bands from f32 (its lowest point 1077 there) and it keeps
// climbing to the last frame (2.5 screen px/f) toward the train, its nose (550 at f42, print bottom 1040, base
// 1185) under the middle of a gap in the train, never level with its body.
// CAUSE: the flame comes out of the engine bells and sheds the puffs; nothing else is touched.
//
// SOURCES: the glyphs come from superpowerRockets.tsx (Falcon 9 70 m, SpaceX wordmark from refs/spacex_logo.svg;
// the Starlink glyph is drawn here (three-quarter view) after refs/starlink_satellite_render.png: a flat
// rectangular bus and one long array; the train look from refs/starlink_train_photo.jpg). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { BLACK, INK, PAPER_BASE, SHADOW, SHADOW_OFF, TallPaper, WorldTall } from "../kits/core-memory/deathCountShared";
import { Falcon9, PX_PER_M, rocketHeightPx } from "./superpowerRockets";

export const FPS = 24000 / 1001;
export const DURATION = 43;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const W = 1080;
const H = 1920;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (u: number) => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};
// the integral of smoothstep from 0 to u (u in 0..1)
const smoothInt = (u: number) => {
  const t = clamp01(u);
  return t * t * t - (t * t * t * t) / 2;
};

// -- the camera: one eased pull-back --------------------------------------------------
// It opens close on the train (k 1.55: 3-4 satellites across the middle, the arc's apex at screen y 780) and
// eases back to k 1.03 in ONE lobe (already moving at f0, mostly spent by f32, still creeping at f42), its centre sliding down the world as it widens, so the train rises to the upper third (apex at
// screen y 480 at f42) and the frame makes room for the rocket coming up from below.
const TRAIN_APEX = 700; // world y of the arc's apex (x 540)
const K0 = 1.55;
const K1 = 1.03;
const APEX_SY0 = 780;
const APEX_SY1 = 480;
const CY0 = TRAIN_APEX + (H / 2 - APEX_SY0) / K0;
const CY1 = TRAIN_APEX + (H / 2 - APEX_SY1) / K1;
// most of the lobe is spent by f32 (so the rocket is at its resting size when its print clears the bands);
// a slow linear creep (8 %) carries it on to the last frame
const camU = (f: number) => 0.92 * smoothstep((f + 2) / 38) + 0.08 * (f / (DURATION - 1));
const camG = (f: number) => (camU(f) - camU(0)) / (camU(DURATION - 1) - camU(0));
export const cameraAt = (f: number) => {
  const g = camG(f);
  return { cx: W / 2, cy: CY0 + (CY1 - CY0) * g, k: K0 * Math.pow(K1 / K0, g) };
};
const CAM_MID = cameraAt(21);

/** screen y of a world y at frame f */
const toScreenY = (wy: number, f: number) => {
  const c = cameraAt(f);
  return (wy - c.cy) * c.k + H / 2;
};
/** world y of a screen y at frame f */
const toWorldY = (sy: number, f: number) => {
  const c = cameraAt(f);
  return c.cy + (sy - H / 2) / c.k;
};

// -- the Starlink satellite, three-quarter view from above ----------------------------
// Drawn in its own plane: u along the direction of travel, v across it (depth). The plane is seen from above at
// an angle, so v runs up and to the right on screen, foreshortened (DEPTH). The bus LEADS: a flat rectangular
// slab (its top face, and its thickness hanging below it as a side face, split from the top by a black seam),
// then a short mast, then the ONE long solar array trailing, printed with a black cell grid. Solid white on one
// hard +4/+4 shadow; the print is black, no shadow. World px; about 160 long.
const DEPTH = { x: 0.34, y: -0.62 };
const SAT = {
  panel: { u0: -80, u1: 30, v: 28 },
  mast: { u0: 29, u1: 41, v: 5 },
  bus: { u0: 40, u1: 80, v: 30, t: 12 },
  cells: 5,
};
type P2 = [number, number];
const proj = (u: number, v: number, c: number, sn: number): P2 => [c * u + DEPTH.x * v, sn * u + DEPTH.y * v];
const quad = (u0: number, u1: number, v0: number, v1: number, c: number, sn: number): P2[] => [
  proj(u0, v0, c, sn),
  proj(u1, v0, c, sn),
  proj(u1, v1, c, sn),
  proj(u0, v1, c, sn),
];
const poly = (pts: P2[]) => `M${pts.map((q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join(" L")} Z`;
/** the convex hull (monotone chain) of a few points */
const hull = (pts: P2[]): P2[] => {
  const ps = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of ps) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = ps.length - 1; i >= 0; i--) {
    const q = ps[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

const StarlinkTop: React.FC<{ x: number; y: number; deg: number }> = ({ x, y, deg }) => {
  const c = Math.cos((deg * Math.PI) / 180);
  const sn = Math.sin((deg * Math.PI) / 180);
  const B = SAT.bus;
  const busTop = quad(B.u0, B.u1, -B.v, B.v, c, sn);
  const busSlab = hull([...busTop, ...busTop.map((q) => [q[0], q[1] + B.t] as P2)]);
  const silhouette = [
    poly(quad(SAT.panel.u0, SAT.panel.u1, -SAT.panel.v, SAT.panel.v, c, sn)),
    poly(quad(SAT.mast.u0, SAT.mast.u1, -SAT.mast.v, SAT.mast.v, c, sn)),
    poly(busSlab),
  ].join(" ");
  // print: the array's cell grid (five lines across it, one along it) and the bus's near-edge seam
  const P = SAT.panel;
  const across = Array.from({ length: SAT.cells - 1 }, (_, j) => {
    const u = P.u0 + ((j + 1) * (P.u1 - P.u0)) / SAT.cells;
    return poly(quad(u - 2, u + 2, -P.v, P.v, c, sn));
  });
  const along = poly(quad(P.u0, P.u1, -3.5, 3.5, c, sn));
  const near = busTop[0]; // (u0, -v)
  const nearR = busTop[1]; // (u1, -v)
  const seam = poly([near, nearR, [nearR[0], nearR[1] + 3], [near[0], near[1] + 3]]);
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={silhouette} fill={SHADOW} transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`} />
      <path d={silhouette} fill={INK} />
      <path d={[...across, along, seam].join(" ")} fill={BLACK} />
    </g>
  );
};

// -- the Starlink train --------------------------------------------------------------
// One circle arc (R 2600), apex at x 360, convex up like an orbit over the horizon. Satellite i sits at arc
// length s from the apex (positive to the right) and glides +x at a constant 7 world px per frame. Phased so
// that at f42 the rocket's nose stands under the middle of a gap in the train.
const TRAIN_R = 2600;
// the apex sits LEFT of the rocket, so the train slopes gently down across it (centred on the rocket, an arc
// over a stick reads as an umbrella)
const APEX_X = 360;
const SAT_N = 9;
const SAT_SPACING = 215; // 160 long: 55 px gaps
const SAT_SPEED = 7;
// phase: at f42 the middle of the gap behind satellite 3 sits at the rocket's x (arc length S_ROCKET)
const S_ROCKET = TRAIN_R * Math.asin((W / 2 - APEX_X) / TRAIN_R);
const SAT_HEAD_S0 = S_ROCKET + SAT_SPACING / 2 - SAT_SPEED * (DURATION - 1) + 3 * SAT_SPACING;
const satPos = (i: number, f: number) => {
  const s = SAT_HEAD_S0 - i * SAT_SPACING + SAT_SPEED * f;
  const th = s / TRAIN_R;
  return {
    x: APEX_X + TRAIN_R * Math.sin(th),
    y: TRAIN_APEX + TRAIN_R * (1 - Math.cos(th)),
    deg: (th * 180) / Math.PI,
  };
};

// -- the Falcon 9 ---------------------------------------------------------------------
const F9_SCALE = 1.1;
const F9_H = rocketHeightPx("falcon9", F9_SCALE); // 616 world px
const F9_X = W / 2;
// the nose's SCREEN y: off the bottom edge until f2, then a steady climb at V_FAST, an S-eased slow-down
// f22-f34 to a gentle V_END, which it keeps to the end (it never lands: it is still climbing).
const NOSE_IN_F = 2;
const NOSE_IN_Y = 1930;
const EASE_F0 = 22;
const EASE_F1 = 34;
const NOSE_AT_EASE_END = 570;
const V_END = 2.5;
const EASE_LEN = EASE_F1 - EASE_F0;
const V_FAST = (NOSE_IN_Y - NOSE_AT_EASE_END - V_END * EASE_LEN * 0.5) /
  (EASE_F0 - NOSE_IN_F + EASE_LEN * 0.5); // ~51.7 screen px per frame
const noseScreenY = (f: number) => {
  if (f <= EASE_F0) return NOSE_IN_Y - V_FAST * (f - NOSE_IN_F);
  const y0 = NOSE_IN_Y - V_FAST * (EASE_F0 - NOSE_IN_F);
  if (f <= EASE_F1) {
    const u = (f - EASE_F0) / EASE_LEN;
    // v = V_END + (V_FAST - V_END) * (1 - smoothstep(u))
    return y0 - EASE_LEN * (V_END * u + (V_FAST - V_END) * (u - smoothInt(u)));
  }
  return NOSE_AT_EASE_END - V_END * (f - EASE_F1);
};
/** the nose's climb on screen this frame, px per frame */
const noseSpeed = (f: number) => noseScreenY(f - 0.5) - noseScreenY(f + 0.5);
/** the rocket's BASE in world y at frame f (fractional f allowed) */
const baseWorldY = (f: number) => toWorldY(noseScreenY(f), f) + F9_H;

/** screen y of the nose, the SPACEX print's lowest point and the base at frame f (for the band audit) */
export const rocketScreen = (f: number) => {
  const base = toScreenY(baseWorldY(f), f);
  const k = cameraAt(f).k;
  return { nose: noseScreenY(f), printBottom: base - 16 * PX_PER_M * F9_SCALE * k, base };
};

// -- the thrust ------------------------------------------------------------------------
// A chunky white FLAME TONGUE flaring out of the engine bells (27 -> 60 px half-width over its first 26 %)
// and tapering to a point; longer while the rocket climbs fast (FLAME_LEN0 + FLAME_PER_V x its screen speed:
// ~265 px at launch speed, ~155 at the end). Its outline flickers a little every frame (two low waves per side
// with random(seed) phases, up to 8 % of the width, and the length up to +-6 %): a living edge, not a strobe.
// Behind it, a short trail of smaller PUFFS shed from the flame's tail, left behind in the world and thinning
// away over PUFF_LIFE frames. Shadows first, then white; the rocket on top.
const FLAME_LEN0 = 150;
const FLAME_PER_V = 2.2;
const flameLen = (f: number) => FLAME_LEN0 + FLAME_PER_V * noseSpeed(f);
const flamePath = (f: number, baseY: number) => {
  const len = flameLen(f) * (1 + 0.06 * (random(`fl-len-${f}`) - 0.5) * 2);
  const tipDx = 5 * (random(`fl-tip-${f}`) - 0.5) * 2;
  const N = 22;
  const side = (sgn: number) => {
    const a = random(`fl-a-${f}-${sgn}`) * Math.PI * 2;
    const b = random(`fl-b-${f}-${sgn}`) * Math.PI * 2;
    const pts: P2[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const w = t < 0.26 ? 27 + 33 * Math.sin(((t / 0.26) * Math.PI) / 2) : 60 * Math.pow(1 - (t - 0.26) / 0.74, 0.75);
      const amp = 0.08 * Math.min(1, t / 0.15);
      const wob = 1 + amp * (0.6 * Math.sin(t * 9 + a) + 0.4 * Math.sin(t * 17 + b));
      pts.push([F9_X + tipDx * t * t + sgn * w * wob, baseY - 3 + len * t]);
    }
    return pts;
  };
  const left = side(-1);
  const right = side(1).reverse();
  return poly([...left, ...right]);
};
const PUFF_LIFE = 8;
const PUFF_STEP = 0.5;
type Puff = { x: number; y: number; r: number };
const puffsAt = (f: number): Puff[] => {
  const out: Puff[] = [];
  for (let n = Math.ceil((f - PUFF_LIFE) / PUFF_STEP); n <= Math.floor(f / PUFF_STEP); n++) {
    const b = n * PUFF_STEP;
    const a = f - b;
    // a puff holds most of its size and thins quickly at the very end (no trail of specks)
    const r = (21 + 10 * random(`pf-r-${n}`)) * Math.sqrt(1 - Math.pow(a / PUFF_LIFE, 3)) * Math.min(1, 0.7 + a / 3);
    if (r < 3) continue;
    out.push({
      x: F9_X + 18 * (random(`pf-x-${n}`) - 0.5) * 2,
      y: baseWorldY(b) + 0.9 * flameLen(b) + 7 * a,
      r,
    });
  }
  return out;
};

const SatellitesAndRockets: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = cameraAt(frame);
  const baseY = baseWorldY(frame);
  const rocketOn = toScreenY(baseY - F9_H, frame) < H + 20;
  const puffs = puffsAt(frame);
  const flame = flamePath(frame, baseY);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={CAM_MID.cx} cyRest={CAM_MID.cy} />
      <WorldTall cx={cx} cy={cy} k={k} id="sar">
        {/* the train, behind the rocket */}
        {Array.from({ length: SAT_N }, (_, i) => {
          const p = satPos(i, frame);
          if (p.x < -200 || p.x > W + 200) return null;
          return <StarlinkTop key={i} x={p.x} y={p.y} deg={p.deg} />;
        })}
        {/* the thrust: trail puffs and the flame tongue on one hard shadow */}
        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`} fill={SHADOW}>
          {puffs.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} />
          ))}
          <path d={flame} />
        </g>
        <g fill={INK}>
          {puffs.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} />
          ))}
          <path d={flame} />
        </g>
        {rocketOn ? <Falcon9 x={F9_X} y={baseY} scale={F9_SCALE} /> : null}
      </WorldTall>
    </AbsoluteFill>
  );
};

export default SatellitesAndRockets;
