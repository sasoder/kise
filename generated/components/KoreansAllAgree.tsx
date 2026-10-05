import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  MapLabel,
  SCREEN_CX,
  SCREEN_CY,
  SEA,
  WorldSvg,
  armySlots,
  camTransform,
  dotScreen,
  hash,
  landAt,
  makeTrack,
  projectLine,
  smoothstep,
  type Cam,
  type P2,
} from "./koreaShared";
import { LEVELS, type Level } from "./koreaLevels";
import { DMZ_LEVEL } from "./koreansAgreeLevel";
import { MDL_LL, OUTLINE, OUTLINE_LEN, OUTLINE_PACE } from "./koreansAgreeData";

// ---------------------------------------------------------------------------
// KoreansAllAgree: Si Sheppard (Dwarkesh), "Regime change in Iraq was the easy
// part", cut D (delivered as 53_KoreansAllAgree.mov). Dwarkesh map style on
// the shared Korea world (koreaShared.tsx, read only; one extra close raster
// level of the same static map baked by scripts/bake-koreans-agree-raster.mjs).
//   "In Korea, Koreans do not have an issue about national identity. They all
//    agree they're Koreans. The fight is over state institutions."
// IN global f1282 (53.417 s), OUT f1542: 260 frames, 24 fps, 1080x1920, opaque.
// local = global - 1282. Word onsets (global): Korea 1296 · Koreans 1328 ·
//   national 1382 · identity 1394 · They 1411 · Koreans 1438 · The 1457 ·
//   fight 1464 · state 1484 · institutions 1496.
//
// The contrast with Iraq's mosaic (cut C): ONE people, the fight is about which
// STATE. Present tense, today's Korea: the dividing line is the 1953 Military
// Demarcation Line (NOT the 38th). No orange: the clip's orange means "what
// America takes on"; everything here is cream on the 1.0 / 0.45 / 0.2 ladder.
//
// THE GESTURES, each with its word (nothing else):
//   D1 "In" g1282: the peninsula close (k 1.39: its width 670 px = 62 % of the
//      frame), the south coast pinned on y1146 so the crowd stays above the
//      captions (the Tumen tip runs off the top), a slow creep in from frame 0
//      (k 1.43 by g1442) pivoting on that coast.
//   D2 "Korea" g1296: KOREA (IM Fell English SC spaced caps, 64 px) lands across
//      the middle of the peninsula (38.65 N), sliding up from g1288; once landed
//      it fades fully out over the dots' ink-in (g1328 -> g1360): the word has
//      done its job, and no letters sit under the crowd.
//   D3 "Koreans" g1328 -> g1360: ONE people: one blue-noise crowd of cream dots
//      (armySlots, one tone, one size, feathered thinner toward every coast)
//      inks in over the whole peninsula as a sweep from the south coast to the
//      Tumen (g1324 -> g1362).
//   D4 "national identity" g1380 -> g1422: one continuous cream line, a pen,
//      traces the peninsula's whole outline (coast + Yalu-Tumen border) from the
//      middle of the south coast round clockwise, closing by g1422. One nation,
//      one outline. Paced on a 10 px simplification so it does not crawl the
//      south-west archipelago.
//   D5 "They all agree they're Koreans" g1411 -> g1458: hold; every dot breathes
//      (~1.1 px, two hashed incommensurate sines, never in unison); the camera
//      creeps.
//   D6 "The fight is over state institutions" g1462 -> g1496: the MDL draws
//      west coast -> east coast (the heaviest line on the page: 11 px cream on
//      a 15 px dark casing, vs the 3 px outline), finishing on
//      "institutions" g1496. Behind its pen a thin daylight gap opens in the
//      crowd: the dots within 44 world px of the line step aside, the band
//      squeezed into [G, 44] (G 16 world px = 18 km a side: the 4 km DMZ
//      exaggerated ~9x, the least that reads against the crowd's ~18 world px
//      spacing at k 5), so the people press up to both edges, the same people on
//      both sides. The camera glides in on the line (g1442 -> g1490, one cosine-
//      tapered ln k bump, landing 6 f before "institutions") to k 5.0, the line's middle on (540, 835).
//   D7 to g1541: hold with creep (k 5.0 -> 5.08); one faint highlight travels
//      the line west -> east (g1500 -> g1541).
//
// FRAMING NOTE: at k 5.0 the line spans 670 px (62 % of the width; approved).
// Dive k 1.43 -> 5.0: camStats max 32.6 px/f (f174), |dv| 3.6 px/f^2 (f167).
//
// SOURCES: Natural Earth 10m (world-atlas countries-10m): the North Korea /
//   South Korea boundary arc = the 1953 Military Demarcation Line (Korean
//   Armistice Agreement, 27 Jul 1953, art. I); the merged mainland ring = the
//   coast + the Yalu-Tumen border with China and Russia (unchanged since 1953).
//   DMZ: 2 km either side of the MDL (Armistice Agreement art. I, para 1).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 260;
export const G_IN = 1282;

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const L = (g: number) => g - G_IN; // global -> local frame
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ---------------------------------------------------------------------------
// The camera: the MDL's middle M sits on screen (sx, sy) at zoom k.
// ---------------------------------------------------------------------------
const MDL: P2[] = projectLine(MDL_LL);
const M: P2 = (() => {
  const xs = MDL.map((p) => p[0]);
  const ys = MDL.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
})();
const K_OPEN = 1.39;
const K_CREEP = 1.43;
const K_LAND = 5.0;
const F_GLIDE0 = L(1442);
const F_LAND = L(1490);
// ln k = an always-on creep (constant velocity, 0.04 % per frame: k 0.985 ->
// 1.05 by the glide, 5.0 -> 5.1 after it) + one glide bump (cosine-tapered
// velocity, taper 0.6) whose ramps are C1 at both ends (koreaShared makeTrack)
const CREEP_V = Math.log(K_CREEP / K_OPEN) / F_GLIDE0;
const lnK = makeTrack(
  [
    [-60, 420, CREEP_V * 480, 0.02],
    [F_GLIDE0, F_LAND, Math.log(K_LAND / K_CREEP) - CREEP_V * (F_LAND - F_GLIDE0), 0.6],
  ],
  Math.log(K_OPEN),
);
const GLIDE_LN = Math.log(K_LAND / K_CREEP) - CREEP_V * (F_LAND - F_GLIDE0);
/** the glide's progress 0..1 (the bump's integral alone) */
const glideU = (f: number) => (lnK(f) - Math.log(K_OPEN) - CREEP_V * f) / GLIDE_LN;
// M's screen y: the creep pivots on the south coast (world y 1138 held on
// screen y1146, so it never crosses y1150), then the glide brings M down to the
// frame's subject line y835
const Y_SOUTH = 1138;
const SY_COAST = 1146;
const SY = (f: number) => {
  const k = Math.exp(lnK(f));
  const u = glideU(f);
  const creepSy = SY_COAST - (Y_SOUTH - M[1]) * k;
  // before the glide: exactly the coast pivot; through it: blend to y835
  const k0 = Math.exp(lnK(F_GLIDE0));
  const syAtGlide = SY_COAST - (Y_SOUTH - M[1]) * k0;
  return f <= F_GLIDE0 ? creepSy : syAtGlide + (SCREEN_CY - syAtGlide) * u;
};
export const camAt = (f: number): Cam => {
  const k = Math.exp(lnK(f));
  const sy = SY(f);
  return { cx: M[0], cy: M[1] - (sy - SCREEN_CY) / k, k };
};

// ---------------------------------------------------------------------------
// The page: koreaShared's KoreaPage (copied) with one extra close level on top
// of the shared pyramid, so the k 5 close-up stays sharp.
// ---------------------------------------------------------------------------
type Lvl = Level & { src: string };
const PAGE_LEVELS: Lvl[] = [
  ...LEVELS.map((l) => ({ ...l, src: `korea/lod-${l.name}.png` })),
  { ...DMZ_LEVEL, src: "koreansagree/lod-dmz.png" },
];
const covers = (l: Lvl, v: { x0: number; x1: number; y0: number; y1: number }) =>
  v.x0 >= l.x0 && v.y0 >= l.y0 && v.x1 <= l.x0 + l.w && v.y1 <= l.y0 + l.h;
const Page: React.FC<{ cam: Cam; vignette: number; children?: React.ReactNode }> = ({ cam, vignette, children }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const ops = PAGE_LEVELS.map((l) => (l.band ? smoothstep(Math.log(k / l.band[0]) / Math.log(l.band[1] / l.band[0])) : 1));
  const view = {
    x0: cam.cx - SCREEN_CX / k - 20,
    x1: cam.cx + (FRAME_W - SCREEN_CX) / k + 20,
    y0: cam.cy - SCREEN_CY / k - 20,
    y1: cam.cy + (FRAME_H - SCREEN_CY) / k + 20,
  };
  const levelImgs = PAGE_LEVELS.map((l, li) => {
    const above = PAGE_LEVELS[li + 1];
    const drawn = ops[li] > 0.001 && (!above || ops[li + 1] < 0.999 || !covers(above, view));
    if (!drawn) return null;
    return (
      <Img
        key={l.name}
        src={staticFile(l.src)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: l.W,
          height: l.H,
          transformOrigin: "0 0",
          transform: `translate(${(tx + l.x0 * k).toFixed(3)}px, ${(ty + l.y0 * k).toFixed(3)}px) scale(${(k / l.s).toFixed(6)})`,
          opacity: ops[li],
        }}
      />
    );
  });
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const tiles: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((view.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((view.y0 - oy) / S) * S + oy;
    for (let y = y0; y < view.y1; y += S) for (let x = x0; x < view.x1; x += S) tiles.push({ x, y, s: S, o: op });
  });
  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      {levelImgs}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: 0.9,
        }}
      >
        {tiles.map((t, i) => (
          <Img
            key={`m-${i}`}
            src={staticFile("korea/mottle.png")}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
          />
        ))}
      </div>
      {children}
      <Img src={staticFile("korea/grain.png")} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(
            3,
          )}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// The MDL: the drawn line (raw Natural Earth vertices) and a smoothed copy for
// the gap's normals.
// ---------------------------------------------------------------------------
const chaikin = (pts: P2[], n: number): P2[] => {
  let p = pts;
  for (let it = 0; it < n; it++) {
    const q: P2[] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, ay] = p[i];
      const [bx, by] = p[i + 1];
      q.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
};
const MDL_SMOOTH = chaikin(MDL, 3);
const cumOf = (pts: P2[]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
const SM_CUM = cumOf(MDL_SMOOTH);
const SM_LEN = SM_CUM[SM_CUM.length - 1];
const dPath = (pts: P2[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
const MDL_D = dPath(MDL);
const OUTLINE_D = dPath(OUTLINE as P2[]);
const OUT_TOTAL = OUTLINE_LEN[OUTLINE_LEN.length - 1];

// pen timings (local frames)
const F_OUT0 = L(1380);
const F_OUT1 = L(1422);
const F_MDL0 = L(1462);
const F_MDL1 = L(1496);
const F_HL0 = L(1500);
const F_HL1 = L(1541);
const PEN_EASE = Easing.inOut(Easing.sin);
/** the outline pen: true visible fraction 0..1 */
const outlineDrawn = (f: number) => {
  const pace = interpolate(f, [F_OUT0, F_OUT1], [0, 1], { easing: PEN_EASE, ...CLAMP });
  if (pace <= 0) return 0;
  if (pace >= 1) return 1;
  let lo = 0;
  let hi = OUTLINE_PACE.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (OUTLINE_PACE[m] < pace) lo = m;
    else hi = m;
  }
  const t = (pace - OUTLINE_PACE[lo]) / Math.max(1e-9, OUTLINE_PACE[hi] - OUTLINE_PACE[lo]);
  return (OUTLINE_LEN[lo] + t * (OUTLINE_LEN[hi] - OUTLINE_LEN[lo])) / OUT_TOTAL;
};
const mdlDrawn = (f: number) => interpolate(f, [F_MDL0, F_MDL1], [0, 1], { easing: PEN_EASE, ...CLAMP });

// ---------------------------------------------------------------------------
// The crowd: one people. armySlots blue noise over the peninsula's box, kept on
// Korean land, thinned toward every coast (organic edge), mainland only.
// ---------------------------------------------------------------------------
const BOX = { x0: 290, y0: 255, x1: 790, y1: 1145 };
const SLOTS_N = 1500;
const SEED = 7;
const G_GAP = 16; // world px half-gap at the line (~18 km a side)
const G_BAND = 44; // world px: the band of the crowd that steps aside
type Base = { x: number; y: number; id: number; t0: number; s: number; nx: number; ny: number; push: number };
const coastDist = (x: number, y: number) => {
  for (let r = 3; r <= 36; r += 3)
    for (let a = 0; a < 12; a++) {
      const th = (a / 12) * Math.PI * 2 + r * 0.37;
      if (landAt(x + r * Math.cos(th), y + r * Math.sin(th)) < 0.5) return r;
    }
  return 40;
};
const nearestSmooth = (x: number, y: number) => {
  let best = { d: Infinity, s: 0, qx: 0, qy: 0, end: false };
  for (let i = 1; i < MDL_SMOOTH.length; i++) {
    const [ax, ay] = MDL_SMOOTH[i - 1];
    const [bx, by] = MDL_SMOOTH[i];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-9;
    const tr = ((x - ax) * dx + (y - ay) * dy) / l2;
    const t = Math.max(0, Math.min(1, tr));
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    const d = Math.hypot(x - qx, y - qy);
    if (d < best.d) best = { d, s: SM_CUM[i - 1] + t * Math.sqrt(l2), qx, qy, end: (i === 1 && tr < 0) || (i === MDL_SMOOTH.length - 1 && tr > 1) };
  }
  return best;
};
let BASE: Base[] | null = null;
const crowd = (): Base[] => {
  if (BASE) return BASE;
  const W = BOX.x1 - BOX.x0;
  const H = BOX.y1 - BOX.y0;
  const slots = armySlots(SLOTS_N, SEED, W / H);
  const out: Base[] = [];
  slots.forEach(([u, v], i) => {
    const x = BOX.x0 + u * W;
    const y = BOX.y0 + v * H;
    if (landAt(x, y) < 0.6) return;
    const cd = coastDist(x, y);
    if (cd < 6) return;
    const keep = 0.2 + 0.8 * smoothstep((cd - 6) / 21);
    if (hash(SEED * 131 + i, 21) > keep) return;
    // south coast (y 1138) first, the Tumen (y 262) last
    const sweep = (1138 - y) / 876;
    const t0 = L(1324) + 28 * sweep + 4 * hash(SEED * 131 + i, 22);
    // the gap: step aside from the MDL, along the line's normal
    const nb = nearestSmooth(x, y);
    let nx = 0;
    let ny = 0;
    let push = 0;
    if (!nb.end && nb.d < G_BAND) {
      const len = nb.d || 1e-6;
      nx = (x - nb.qx) / len;
      ny = (y - nb.qy) / len;
      // the band [0, G_BAND] squeezes into [G_GAP, G_BAND]: a clear corridor
      // with the people pressed up to its edges on both sides
      push = G_GAP * (1 - nb.d / G_BAND);
    }
    out.push({ x, y, id: i, t0, s: nb.s / SM_LEN, nx, ny, push });
  });
  BASE = out;
  return out;
};
export const crowdCount = () => crowd().length;

export const dotsAt = (f: number, k: number) => {
  const pen = mdlDrawn(f);
  return crowd().map((b) => {
    const op = smoothstep((f - b.t0) / 8);
    let x = b.x;
    let y = b.y;
    if (b.push > 0 && pen > 0) {
      const a = smoothstep((pen - b.s) / 0.16);
      x += b.nx * b.push * a;
      y += b.ny * b.push * a;
    }
    const id = SEED * 1000 + b.id;
    const w1 = 0.045 + 0.04 * hash(id, 11);
    const w2 = 0.04 + 0.045 * hash(id, 12);
    const amp = 1.1 / k;
    x += amp * Math.sin(f * w1 + 6.283 * hash(id, 13));
    y += amp * Math.sin(f * w2 + 6.283 * hash(id, 14));
    return { x, y, id: b.id, op };
  });
};

// ---------------------------------------------------------------------------
// The scene.
// ---------------------------------------------------------------------------
const KoreansAllAgree: React.FC<Props> = ({ vignette }) => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const r0 = dotScreen(k) / 2 / k;
  const dots = dotsAt(f, k);
  const labelOp = interpolate(f, [L(1328), L(1360)], [1, 0], { easing: Easing.inOut(Easing.sin), ...CLAMP });
  const outU = outlineDrawn(f);
  const mdlU = mdlDrawn(f);
  // D7: a faint highlight travelling the line, west -> east
  const hc = interpolate(f, [F_HL0, F_HL1], [-0.15, 1.15], { easing: Easing.inOut(Easing.sin), ...CLAMP });
  const HL_N = 14;
  const HL_W = 0.13;
  const hl: React.ReactNode[] = [];
  if (f >= F_HL0 && f <= F_HL1) {
    for (let j = 0; j < HL_N; j++) {
      const a = hc - HL_W + (2 * HL_W * j) / HL_N;
      const b = a + (2 * HL_W) / HL_N;
      const lo = Math.max(0, a);
      const hi = Math.min(1, b);
      if (hi <= lo) continue;
      const mid = (a + b) / 2;
      const w = 0.5 * (1 + Math.cos((Math.PI * (mid - hc)) / HL_W));
      hl.push(
        <path
          key={`hl-${j}`}
          d={MDL_D}
          pathLength={1}
          fill="none"
          stroke="#FFF8EA"
          strokeOpacity={0.55 * w}
          strokeWidth={11 / k}
          strokeLinecap="butt"
          strokeLinejoin="round"
          strokeDasharray={`0 ${lo} ${hi - lo} 3`}
        />,
      );
    }
  }
  return (
    <Page cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <g>
          {dots.map((d) => {
            if (d.op <= 0.002) return null;
            const r = r0 * (0.72 + 0.28 * d.op);
            return (
              <circle
                key={d.id}
                cx={d.x}
                cy={d.y}
                r={r}
                fill={INK}
                fillOpacity={d.op}
                stroke={DARK}
                strokeOpacity={0.6 * d.op}
                strokeWidth={1.6 / k}
              />
            );
          })}
        </g>
        <MapLabel text="KOREA" lon={126.7} lat={38.65} frame={f} f0={L(1288)} cam={cam} size={64} spacing={0.24} opacity={labelOp} />
        {outU > 0 ? (
          <path
            d={OUTLINE_D}
            pathLength={1}
            fill="none"
            stroke={INK}
            strokeWidth={3 / k}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={outU >= 1 ? undefined : `${outU} 3`}
          />
        ) : null}
        {mdlU > 0 ? (
          <g>
            <path
              d={MDL_D}
              pathLength={1}
              fill="none"
              stroke={DARK}
              strokeOpacity={0.55}
              strokeWidth={15 / k}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={mdlU >= 1 ? undefined : `${mdlU} 3`}
            />
            <path
              d={MDL_D}
              pathLength={1}
              fill="none"
              stroke={INK}
              strokeWidth={11 / k}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={mdlU >= 1 ? undefined : `${mdlU} 3`}
            />
            {hl}
          </g>
        ) : null}
      </WorldSvg>
    </Page>
  );
};

export default KoreansAllAgree;
