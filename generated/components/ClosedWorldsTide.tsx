import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, Carrack, CityDot, DARK, FRAME_H, FRAME_W, INK, Mottle, PaperTop, SEA, camTransform, clamp01, fellSC, pchip, screenOf, smoothstep, type Cam, type P2 } from "./incaShared";
import { LEVELS, ROUTE, SPLIT } from "./texcocoTideMapData";
import { DURATION as CAM_DURATION, cameraAt } from "./tideCamera";
import { K0, P, RING_C, RING_R } from "./tideGeo";
import { DOTS, FOLLOW, LEAD, SHIPS, TRUNK_LEN, carreraAt, drawRadius, edgeScale, followS, leadS, placeDot, placeShip, routePathD, shipSize } from "./tideMotion";

// ---------------------------------------------------------------------------
// ClosedWorldsTide (Si Sheppard, "Texcoco"; delivered as 38_ClosedWorlds.mov).
// ONE graphic through two lines and the gap between them; it replaces
// ClosedWorlds and MinorityInOwnCountry. Dwarkesh map style, opaque
// 1080x1920, 23.976 fps, 235 frames.
//
// CHECK LINE: "Their world was one small ring; people poured out of far-off
// Europe in numbers they could not imagine — and where that tide ran its
// course, in Australia and New Zealand, the original peoples ended up a small
// minority in their own land."
//
// THE MOTION (one camera journey, one language: the map, ORANGE = the native
// world and its peoples, CREAM = the newcomers; ships bring them, dots are the
// people). It opens tight on central Mexico inside the orange ring, everything
// outside it unknown; the long pull-back lifts the fog across the Atlantic and
// a cream ship rides a dashed track from Spain to the ring, two more behind
// it. The track fills: cream dots follow in a file that thickens to a flood,
// land and crowd the ring. The camera never stops: it keeps easing out, and as
// a convoy of carracks leaves the Channel in line astern and runs down the
// African coast it goes with it, round the Cape and east across the Indian
// Ocean, and comes down on Australia (19 orange dots). The lead ship anchors
// off Sydney, the second off the south coast (a small one off Perth), and the
// dots come off the ships in short files to the ports and fill the land; the
// third sails on across the Tasman with the camera, anchors off New Zealand
// (18 orange dots) and fills it the same way. Hold.
//
// THE LINE (frames from the cut's first frame):
//   closed 4 · worlds 12 · didn't 18 · allow 25 · them 29 · to 32 · think 35 ·
//   about 42 · people 48 · from 54 · such 58 · vast 63 · distances 70 · could 81 ·
//   come 87 · in 94 · such 96 · huge 101 · numbers 107 · And 115 · in 118 · the 120 ·
//   end 123 · as 129 · happened 133 · in 139 · for 150 · example 152 ·
//   AUSTRALIA 163 · and 172 · NEW 176 · ZEALAND 179 · that 188 · we'll 190 ·
//   become 196 · the 202 · minority 205 · in 214 · our 219 · own 222 ·
//   country 226 · cut 235.
//
// THE NUMBERS (final state; each country shows its own share, the two are NOT
// on one common scale of people per dot):
//   Australia    19 orange among 500 dots = 3.8 %  (ABS estimate, 30 June
//                2021: 983,700 Aboriginal and Torres Strait Islander people)
//   New Zealand  18 orange among 101 dots = 17.8 % (Stats NZ, 2023 Census:
//                887,493 Maori)
//   scripts/check-tide-dots.ts counts them.
// WHAT IS SCHEMATIC: the ring (a 5.1 deg circle round Tenochtitlan: "their
// world"); the dots in Mexico (ILLUSTRATIVE, no ratio is claimed: no orange
// dots are drawn there); where the cream dots stand in Australia (a softened
// picture of real settlement, not a census map). The routes are real in kind:
// the Carrera de Indias from Seville, and the emigrant route out of the
// Channel, round the Cape of Good Hope and along 40 S, drawn down the African
// coast. The convoy is four ships for a century of sailings. The ports are
// real; Auckland is reached from its Tasman side and the South Island through
// Nelson (its Tasman port), so no file crosses open ocean.
//
// THE MAP: scripts/build-texcoco-tide-map.mjs (north-up Mercator, Natural
// Earth 10m, no borders, the Valley of Mexico lakes of 1519), baked to raster
// tiles in public/texcoco-tide/ for exactly this camera.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = CAM_DURATION;

export const schema = z.object({
  vignette: z.number().min(0).max(1),
  labels: z.object({ australia: z.string(), newZealand: z.string() }),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.5, labels: { australia: "AUSTRALIA", newZealand: "NEW ZEALAND" } });

const FOG = "#0F0C09";
/** the newcomers: cream at ~0.8 over the land tone, mixed once so overlaps do not stack */
const CREAM_DIM = "#C6BA9F";

// ---- the fog front: screen px from the ring's centre (ClosedWorlds'), gone by f90 -----
const R_OPEN = RING_R * K0;
const fogR = pchip(
  [
    [0, R_OPEN + 7],
    [6, R_OPEN + 11],
    [20, 560],
    [40, 900],
    [60, 1200],
    [78, 1450],
    [90, 1640],
  ],
  false,
);
const fogFeather = (f: number) => 5 + 29 * smoothstep((f - 5) / 22);
const FOG_END = 90;

const trackD = (s: number) => {
  if (s <= 0.5) return "";
  const n = Math.floor(s);
  let d = `M${ROUTE[0][0]},${ROUTE[0][1]}`;
  for (let i = 2; i <= n; i += 2) d += `L${ROUTE[i][0]},${ROUTE[i][1]}`;
  const [hx, hy] = carreraAt(s);
  return `${d}L${hx.toFixed(2)},${hy.toFixed(2)}`;
};
const SEVILLE = ROUTE[0];
const SHIP_LEAD = 80;

// ---- the ring: a hand-drawn engraved double line, hatch inside the rim (ClosedWorlds') ----
const RING_N = 220;
const RING_A0 = (-38 * Math.PI) / 180;
const wobble = (a: number, seed: number) =>
  0.0048 * Math.sin(3 * a + 1.1 + seed) + 0.003 * Math.sin(5 * a + 0.4 + 2.3 * seed) + 0.0016 * Math.sin(11 * a + 2.0 + 1.7 * seed);
const ringPath = (c: P2, rs: number, seed: number, amp = 1) => {
  let d = "";
  for (let i = 0; i < RING_N; i++) {
    const a = RING_A0 + (i / RING_N) * 2 * Math.PI;
    const r = rs * (1 + amp * wobble(a, seed));
    d += `${i === 0 ? "M" : "L"}${(c[0] + r * Math.cos(a)).toFixed(2)},${(c[1] + r * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
};

const Ring: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const c = screenOf(RING_C, cam);
  const rs = RING_R * cam.k;
  const t = Math.pow(clamp01((rs - RING_R) / (R_OPEN - RING_R)), 0.6); // 1 at the open, 0 at the wide
  const wO = 4.2 + 2.2 * t;
  const wI = 1.5 + 0.9 * t;
  const gap = 4.6 + 8 * t;
  const band = 3 + 0.082 * rs * t;
  const rI = rs - gap;
  const rB = rI - wI / 2 - band / 2 - 1.5 * t;
  // the pen closes the ring: outer line f0-f9, inner line and hatch a beat behind
  const pO = 0.988 + 0.012 * smoothstep(frame / 7);
  const pI = 0.98 + 0.02 * smoothstep(frame / 9);
  const dO = ringPath(c, rs, 0);
  const dI = ringPath(c, rI, 0.5, 0.9);
  const dB = ringPath(c, rB, 0.5, 0.9);
  const hatchOp = 0.5 * smoothstep((cam.k - 2.6) / 3.2);
  const washOp = 0.1 + 0.22 * (1 - smoothstep((cam.k - 2.2) / 3.4));
  const small = 1 - smoothstep((rs - 60) / 240); // 1 once it is a small coin
  const glow = 0.5 + 0.5 * small;
  const hg = 1.05; // hatch pitch, world px
  const { tx, ty } = camTransform(cam);
  const dash = (p: number) => (p >= 0.9995 ? undefined : `${p.toFixed(4)} 1`);
  return (
    <g fill="none" strokeLinejoin="round">
      <defs>
        <pattern id="cwt-hatch" patternUnits="userSpaceOnUse" width={hg} height={hg} patternTransform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${cam.k.toFixed(6)}) rotate(-45)`}>
          <line x1={hg / 2} y1={-0.2} x2={hg / 2} y2={hg + 0.2} stroke={ACCENT} strokeWidth={0.24} />
        </pattern>
        <radialGradient id="cwt-lit" gradientUnits="userSpaceOnUse" cx={c[0]} cy={c[1]} r={rs}>
          <stop offset="0" stopColor={ACCENT} stopOpacity={0.05 + 0.17 * small} />
          <stop offset="0.7" stopColor={ACCENT} stopOpacity={0.03 + 0.15 * small} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0.02 + 0.24 * small} />
        </radialGradient>
      </defs>
      <path d={dO} fill="url(#cwt-lit)" />
      <path d={dO} stroke={ACCENT} strokeOpacity={0.09 * glow} strokeWidth={wO + 30 - 8 * small} pathLength={1} strokeDasharray={dash(pO)} />
      <path d={dO} stroke={ACCENT} strokeOpacity={0.17 * glow} strokeWidth={wO + 15 - 3 * small} pathLength={1} strokeDasharray={dash(pO)} />
      <path d={dB} stroke={ACCENT_DEEP} strokeOpacity={washOp} strokeWidth={band} pathLength={1} strokeDasharray={dash(pI)} />
      {hatchOp > 0.004 ? <path d={dB} stroke="url(#cwt-hatch)" strokeOpacity={hatchOp} strokeWidth={band} pathLength={1} strokeDasharray={dash(pI)} /> : null}
      <path d={dO} stroke={DARK} strokeOpacity={0.55} strokeWidth={wO + 3.4} pathLength={1} strokeDasharray={dash(pO)} />
      <path d={dI} stroke={DARK} strokeOpacity={0.4} strokeWidth={wI + 2.2} pathLength={1} strokeDasharray={dash(pI)} />
      <path d={dI} stroke={ACCENT} strokeWidth={wI} pathLength={1} strokeDasharray={dash(pI)} strokeLinecap="round" />
      <path d={dO} stroke={ACCENT} strokeWidth={wO} pathLength={1} strokeDasharray={dash(pO)} strokeLinecap="round" />
    </g>
  );
};

// ---- the raster tiles ---------------------------------------------------------------
const MapLevels: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const cluster = frame < SPLIT ? "mex" : "oce";
  const tiles = LEVELS.filter((L) => L.cluster === "all" || L.cluster === cluster);
  const op = tiles.map((L, i) => (i === 0 ? 1 : smoothstep((k - L.kIn) / (L.kFull - L.kIn))));
  return (
    <>
      {tiles.map((L, i) => {
        // drawn while it shows and the next tile does not yet cover it
        if (op[i] <= 0.001 || (i + 1 < tiles.length && op[i + 1] >= 0.999)) return null;
        return (
          <Img
            key={L.name}
            src={staticFile(`texcoco-tide/${L.name}.png`)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: L.W,
              height: L.H,
              opacity: op[i],
              transformOrigin: "0 0",
              transform: `translate(${tx + L.x0 * k}px, ${ty + L.y0 * k}px) scale(${k / L.s})`,
            }}
          />
        );
      })}
    </>
  );
};

// ---- labels: ride the map, slide up 24 px while fading in, landing on the word --------
const LABEL_FRAMES = 14;
const slide = (frame: number, land: number) => {
  const u = clamp01((frame - (land - LABEL_FRAMES)) / LABEL_FRAMES);
  return { dy: 24 * Math.pow(1 - u, 3), op: clamp01((frame - (land - LABEL_FRAMES)) / 9) };
};
const LAND_AUSTRALIA = 163;
const LAND_NEW_ZEALAND = 180;
/** it waits for the Tasman to open: a shorter rise than AUSTRALIA's */
const NZ_FRAMES = 9;
/** AUSTRALIA: the Southern Ocean under the continent, clear of the stream and below the caption strip when the word lands */
const AU_AT: P2 = P(134.2, -56);
/** it leaves with the west of the continent: faded before the frame edge would cut it */
const AU_OUT: [number, number] = [178, 189];
/** NEW ZEALAND: the Tasman, north-west of the North Island (the middle of the line) */
const NZ_AT: P2 = P(166.0, -30.6);
/** type sizes in world px (the labels grow with the map as the camera comes down) */
const S_AU = 29;
const S_NZ = 15.6;

const ClosedWorldsTide: React.FC<Props> = ({ vignette, labels }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const { k } = cam;
  const ringS = screenOf(RING_C, cam);
  const ringOn = ringS[0] > -RING_R * k - 60;

  // the fog front
  const fogOn = frame < FOG_END;
  const fr = fogR(frame);
  const ff = fogFeather(frame);
  const fogBg = `radial-gradient(circle at ${ringS[0].toFixed(2)}px ${ringS[1].toFixed(2)}px, rgba(15,12,9,0) ${(fr - ff).toFixed(2)}px, ${FOG} ${fr.toFixed(2)}px)`;

  // the Carrera track and its ship (while they are in frame)
  const atlantic = screenOf(SEVILLE, cam)[0] > -80;
  const sLead = leadS(frame);
  const lead = carreraAt(sLead);
  const w = (v: number) => v / k;
  const d = atlantic && frame >= LEAD.line0 ? trackD(sLead) : "";
  const rise = smoothstep((frame - LEAD.rise0) / (LEAD.rise1 - LEAD.rise0));

  // every dot, in three layers: movers under the standing crowd, orange on top
  const moving: React.ReactNode[] = [];
  const standing: React.ReactNode[] = [];
  const orange: React.ReactNode[] = [];
  const p = [0, 0, 1];
  const mx = (FRAME_W / 2 + 30) / k;
  const my = (FRAME_H / 2 + 30) / k;
  for (let i = 0; i < DOTS.length; i++) {
    const dot = DOTS[i];
    const st = placeDot(i, frame, p);
    if (st < 0 || Math.abs(p[0] - cam.cx) > mx || Math.abs(p[1] - cam.cy) > my) continue;
    const x = p[0].toFixed(2);
    const y = p[1].toFixed(2);
    const edge = edgeScale(dot, FRAME_W / 2 + (p[0] - cam.cx) * k, frame);
    if (edge <= 0.01) continue;
    const R = drawRadius(dot, k);
    const g = R / dot.r; // how much the far-off size lifts it
    if (dot.orange) {
      orange.push(
        <g key={i}>
          <circle cx={x} cy={y} r={(R + dot.halo * g + 1.8 / k).toFixed(3)} fill={DARK} fillOpacity={0.38} />
          <circle cx={x} cy={y} r={(R + dot.halo * g).toFixed(3)} fill={DARK} />
          <circle cx={x} cy={y} r={R.toFixed(3)} fill={ACCENT} />
        </g>,
      );
      continue;
    }
    const r = R * p[2] * edge;
    const node = (
      <g key={i}>
        <circle cx={x} cy={y} r={(r + dot.casing * g * Math.min(1, p[2] * edge * 1.5)).toFixed(3)} fill={DARK} />
        <circle cx={x} cy={y} r={r.toFixed(3)} fill={CREAM_DIM} />
      </g>
    );
    if (st === 2) standing.push(node);
    else moving.push(node);
  }

  // the convoy: its dashed wake (the trunk once, then each ship's own course) and the ships
  const convoy: React.ReactNode[] = [];
  const wakes: string[] = [];
  const q = [0, 0];
  let sHead = 0;
  SHIPS.forEach((sh) => {
    const st = placeShip(sh, frame, q);
    sHead = Math.max(sHead, Math.min(st.s, TRUNK_LEN));
    if (st.s > TRUNK_LEN) wakes.push(routePathD(sh.route, TRUNK_LEN, st.s));
    if (st.rise <= 0.002 || Math.abs(q[0] - cam.cx) > mx + 120 / k || Math.abs(q[1] - cam.cy) > my + 120 / k) return;
    convoy.push(
      <Carrack
        key={sh.key}
        x={q[0]}
        y={q[1] + (20 * (1 - st.rise)) / k}
        cam={cam}
        frame={frame}
        size={shipSize(sh, k)}
        seed={sh.seed}
        facing="east"
        opacity={st.rise}
        rock={0.45 + 0.6 * st.way}
        wake={st.rise * st.way}
      />,
    );
  });
  if (sHead > 1 && frame < 200) wakes.unshift(routePathD(SHIPS[0].route, 0, sHead));
  const wakeD = wakes.join("");

  const au = slide(frame, LAND_AUSTRALIA);
  const nzU = clamp01((frame - (LAND_NEW_ZEALAND - NZ_FRAMES)) / NZ_FRAMES);
  const nz = { dy: 24 * Math.pow(1 - nzU, 3), op: clamp01((frame - (LAND_NEW_ZEALAND - NZ_FRAMES)) / 6) };
  const haloOf = (size: number) => ({ stroke: SEA, strokeOpacity: 0.6, strokeWidth: size * 0.14, paintOrder: "stroke" as const });

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapLevels cam={cam} frame={frame} />
      <Mottle cam={cam} opacity={0.9} />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={camTransform(cam).svg}>
          {d ? (
            <>
              <path d={d} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={w(7.2)} strokeLinejoin="round" />
              <path d={d} fill="none" stroke={INK} strokeOpacity={0.95} strokeWidth={w(3.7)} strokeDasharray="9.5 7" strokeLinejoin="round" />
              <CityDot x={SEVILLE[0]} y={SEVILLE[1]} cam={cam} r={6.5} />
            </>
          ) : null}
          {wakeD ? (
            <>
              <path d={wakeD} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={w(6.4)} strokeLinejoin="round" />
              <path d={wakeD} fill="none" stroke={INK} strokeOpacity={0.9} strokeWidth={w(3.2)} strokeDasharray="7.5 5.5" strokeLinejoin="round" />
            </>
          ) : null}
          {moving}
          {standing}
          {orange}
          {atlantic
            ? FOLLOW.map((fq, i) => {
                const fs = followS(frame, fq);
                if (fs <= 0) return null;
                const fp = carreraAt(fs);
                return <Carrack key={i} x={fp[0]} y={fp[1]} cam={cam} frame={frame} size={60} seed={fq.seed} opacity={smoothstep(fs / 26)} rock={1.1} wake={0.8} />;
              })
            : null}
          {convoy}
          {atlantic && rise > 0.002 ? (
            <Carrack x={lead[0]} y={lead[1] + (24 * (1 - rise)) / k} cam={cam} frame={frame} size={SHIP_LEAD} seed={3} opacity={rise} rock={1.2} wake={rise * (1 - 0.6 * smoothstep((frame - LEAD.f1 + 6) / 8))} />
          ) : null}
          {au.op > 0 && frame < AU_OUT[1] ? (
            <text
              x={AU_AT[0]}
              y={AU_AT[1] + au.dy / k}
              textAnchor="middle"
              opacity={au.op * 0.94 * (1 - clamp01((frame - AU_OUT[0]) / (AU_OUT[1] - AU_OUT[0])))}
              fill={INK}
              {...haloOf(S_AU)}
              style={{ fontFamily: fellSC, fontSize: S_AU, letterSpacing: S_AU * 0.28 }}
            >
              {labels.australia}
            </text>
          ) : null}
          {nz.op > 0 ? (
            <text x={NZ_AT[0]} y={NZ_AT[1] + nz.dy / k} textAnchor="middle" opacity={nz.op * 0.94} fill={INK} {...haloOf(S_NZ)} style={{ fontFamily: fellSC, fontSize: S_NZ, letterSpacing: S_NZ * 0.2 }}>
              {labels.newZealand}
            </text>
          ) : null}
        </g>
      </svg>
      {/* the unknown: the dark page outside the front */}
      {fogOn ? <AbsoluteFill style={{ background: fogBg }} /> : null}
      {ringOn ? (
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <Ring cam={cam} frame={frame} />
        </svg>
      ) : null}
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default ClosedWorldsTide;
