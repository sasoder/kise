import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, Carrack, CityDot, DARK, FRAME_H, FRAME_W, INK, Mottle, PaperTop, SEA, camFor, camTransform, clamp01, pchip, screenOf, smoothstep, type Cam, type P2 } from "./incaShared";
import { K0, LEVELS, PIVOT, RING_C, RING_R, ROUTE, ROUTE_LEN, SEVILLE } from "./texcocoAtlanticMapData";

// ---------------------------------------------------------------------------
// ClosedWorlds (cut D of the Si Sheppard "Texcoco" clip; delivered as
// 38_ClosedWorlds.mov). Dwarkesh map style, opaque 1080x1920, 23.976 fps,
// 85 frames.
//
// CHECK LINE: "Everything these peoples knew fit inside one small ring; the
// newcomers set out from far outside it, a whole ocean away."
//
// THE MOTION (one): a single long pull-back. It opens tight on central Mexico
// inside a hand-drawn ORANGE ring (their horizon; Tenochtitlan and its lakes at
// the centre), everything outside it unknown: the dark page. The camera pulls
// back nine-fold about one fixed point while the unknown lifts in an expanding
// front (the Gulf, the Caribbean, the open Atlantic, Iberia) and the ring
// shrinks to a small coin lower left. Out of the far edge the dashed Carrera
// track from Seville comes in, a cream ship rises at its head and rides it at
// one steady screen speed until its bow meets the ring on "vast distances"; two more ships follow down the track as the frame
// holds, still creeping out.
//
// THE LINE (frames from the cut's first frame):
//   closed 4 · worlds 12 · didn't 18 · allow 25 · them 29 · to 32 · think 35 ·
//   about 42 · people 48 · from 54 · such 58 · vast 63 · distances 70-81 · cut 85.
//
// ONE ACCENT: orange = Texcoco's own world (the ring). The ships, the track and
// everything else are cream ink. No labels: no place is named in the line.
//
// THE MAP: scripts/build-texcoco-atlantic-map.mjs (north-up Mercator, Natural
// Earth 10m land, no borders, the Valley of Mexico lakes of 1519, engraved
// hills on the real ranges at the close levels), baked to a six-level raster
// pyramid in public/texcoco-atlantic/. The ring is a 5.1 deg circle round
// Tenochtitlan (SCHEMATIC: "their world", about the reach of the Triple
// Alliance, sea to sea). The track is the New Spain flota's route.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 85;

export const schema = z.object({
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.5 });

const FOG = "#0F0C09";

// ---- the camera: ONE pull-back, eased in log-zoom, about a fixed point --------
// velocity (d ln k / d frame) = a slow creep that never stops + one long bump:
// in over f2-f16, steady, out over f57-f74. Integrated on a 1/8-frame grid.
const CREEP = 0.0034;
const BUMP = { a0: 2, a1: 16, b0: 57, b1: 74 };
const K_LAST = 0.972; // k on the last frame (k ~1.0 at f76: the 3 % creep)
const bump = (f: number) => {
  if (f <= BUMP.a0 || f >= BUMP.b1) return 0;
  if (f < BUMP.a1) return 0.5 - 0.5 * Math.cos((Math.PI * (f - BUMP.a0)) / (BUMP.a1 - BUMP.a0));
  if (f <= BUMP.b0) return 1;
  return 0.5 + 0.5 * Math.cos((Math.PI * (f - BUMP.b0)) / (BUMP.b1 - BUMP.b0));
};
const SUB = 8;
const LNK: number[] = (() => {
  const area = (BUMP.a1 - BUMP.a0) / 2 + (BUMP.b0 - BUMP.a1) + (BUMP.b1 - BUMP.b0) / 2;
  const main = (Math.log(K0 / K_LAST) - CREEP * (DURATION - 1)) / area;
  const out = [Math.log(K0)];
  for (let i = 1; i <= (DURATION + 2) * SUB; i++) {
    const f = (i - 0.5) / SUB;
    out.push(out[i - 1] - (CREEP + main * bump(f)) / SUB);
  }
  return out;
})();
const kAt = (f: number) => {
  const x = Math.max(0, Math.min(LNK.length - 1.001, f * SUB));
  const i = Math.floor(x);
  return Math.exp(LNK[i] + (LNK[i + 1] - LNK[i]) * (x - i));
};
const cameraAt = (f: number): Cam => camFor(PIVOT, kAt(f), PIVOT[0], PIVOT[1]);

// ---- the fog front: screen px from the ring's centre ---------------------------
// It sits on the ring, leaves it as the pull-back starts, clears the frame's far
// edge before the track comes in (f ~43) and the whole frame by f ~78.
const R_OPEN = RING_R * K0; // 414
const fogR = pchip(
  [
    [0, R_OPEN + 7],
    [6, R_OPEN + 11],
    [20, 560],
    [40, 900],
    [60, 1200],
    [78, 1450],
    [84, 1520],
  ],
  false,
);
const fogFeather = (f: number) => 5 + 29 * smoothstep((f - 5) / 22);

// ---- the track and its ships ------------------------------------------------------
const routeAt = (s: number): P2 => {
  const x = Math.max(0, Math.min(ROUTE_LEN, s));
  const i = Math.min(ROUTE_LEN - 1, Math.floor(x));
  const t = x - i;
  return [ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * t, ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * t];
};
/** screen position of the track's point s on frame f */
const routeScreen = (s: number, f: number): P2 => screenOf(routeAt(s), cameraAt(f));
// THE LEAD. Nothing may cross the screen faster than ~22 px / frame, and during
// the pull-back the zoom alone moves the far side of the frame faster than that.
// So the dashed track leads (its head comes in from the right edge, f32-f51) and
// the ship rises at the head once it can ride it at <= SHIP_V screen px / frame:
// its schedule is solved backwards from the ring (bow on the rim at f76) so its
// SCREEN speed is one steady SHIP_V that eases to rest over the last 9 frames.
const SHIP_V = 20.5;
const LEAD = { line0: 32, join: 51, f1: 76, rise0: 49, rise1: 58 };
const LEAD_S: number[] = (() => {
  const out: number[] = [];
  out[LEAD.f1] = ROUTE_LEN - 1.5;
  for (let f = LEAD.f1 - 1; f >= LEAD.join; f--) {
    const v = SHIP_V * smoothstep((LEAD.f1 - f - 0.5) / 9);
    const q = routeScreen(out[f + 1], f + 1);
    let lo = 0;
    let hi = out[f + 1];
    for (let i = 0; i < 44; i++) {
      const mid = (lo + hi) / 2;
      const p = routeScreen(mid, f);
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) > v) lo = mid;
      else hi = mid;
    }
    out[f] = hi;
  }
  return out;
})();
const leadS = (f: number) => {
  if (f >= LEAD.f1) return LEAD_S[LEAD.f1] + 1.5 * clamp01((f - LEAD.f1) / 10);
  if (f >= LEAD.join) {
    const i = Math.floor(f);
    return LEAD_S[i] + (LEAD_S[Math.min(LEAD.f1, i + 1)] - LEAD_S[i]) * (f - i);
  }
  // the line alone: out of Seville, decelerating to rest where the ship takes it up
  const t = clamp01((f - LEAD.line0) / (LEAD.join - LEAD.line0));
  return LEAD_S[LEAD.join] * (1 - (1 - t) * (1 - t));
};
/** the two that follow: out of Seville as Iberia comes into frame, at a calm steady pace (the zoom has slowed by then) */
const FOLLOW = [
  { f0: 66.5, v: 7.5, seed: 7 },
  { f0: 75, v: 7.5, seed: 12 },
];
const followS = (f: number, q: (typeof FOLLOW)[number]) => {
  const t = f - q.f0;
  if (t <= 0) return 0;
  // eases off the quay over its first 5 frames
  return q.v * (t < 5 ? (t * t) / 10 : t - 2.5);
};
const SHIP_LEAD = 80;
const SHIP_FOLLOW = 60;

const trackD = (s: number) => {
  if (s <= 0.5) return "";
  const n = Math.floor(s);
  let d = `M${ROUTE[0][0]},${ROUTE[0][1]}`;
  for (let i = 2; i <= n; i += 2) d += `L${ROUTE[i][0]},${ROUTE[i][1]}`;
  const [hx, hy] = routeAt(s);
  return `${d}L${hx.toFixed(2)},${hy.toFixed(2)}`;
};

// ---- the ring: a hand-drawn engraved double line, hatch inside the rim -----------
const RING_N = 220;
/** start of the stroke (the pen closes the ring here over the first frames), radians, clockwise on screen */
const RING_A0 = (-38 * Math.PI) / 180;
const wobble = (a: number, seed: number) =>
  0.0048 * Math.sin(3 * a + 1.1 + seed) + 0.003 * Math.sin(5 * a + 0.4 + 2.3 * seed) + 0.0016 * Math.sin(11 * a + 2.0 + 1.7 * seed);
/** a closed ring path on screen: radius rs (screen px) with the hand's wobble (a fraction of the radius) */
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
  const t = Math.pow(clamp01((rs - RING_R) / (R_OPEN - RING_R)), 0.6); // 1 at the open, 0 at the settled wide
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
  // the hatch is world-anchored (it shrinks with the land) and hands over to a plain wash as it gets too fine
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
        <pattern id="cw-hatch" patternUnits="userSpaceOnUse" width={hg} height={hg} patternTransform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${cam.k.toFixed(6)}) rotate(-45)`}>
          <line x1={hg / 2} y1={-0.2} x2={hg / 2} y2={hg + 0.2} stroke={ACCENT} strokeWidth={0.24} />
        </pattern>
        <radialGradient id="cw-lit" gradientUnits="userSpaceOnUse" cx={c[0]} cy={c[1]} r={rs}>
          <stop offset="0" stopColor={ACCENT} stopOpacity={0.05 + 0.17 * small} />
          <stop offset="0.7" stopColor={ACCENT} stopOpacity={0.03 + 0.15 * small} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0.02 + 0.24 * small} />
        </radialGradient>
      </defs>
      {/* their world is lit: a faint warm lift inside the ring, stronger once it is small */}
      <path d={dO} fill="url(#cw-lit)" />
      {/* the steady glow round the rim (plain stacked strokes, no blur) */}
      <path d={dO} stroke={ACCENT} strokeOpacity={0.09 * glow} strokeWidth={wO + 30 - 8 * small} pathLength={1} strokeDasharray={dash(pO)} />
      <path d={dO} stroke={ACCENT} strokeOpacity={0.17 * glow} strokeWidth={wO + 15 - 3 * small} pathLength={1} strokeDasharray={dash(pO)} />
      {/* the hatch band just inside the rim */}
      <path d={dB} stroke={ACCENT_DEEP} strokeOpacity={washOp} strokeWidth={band} pathLength={1} strokeDasharray={dash(pI)} />
      {hatchOp > 0.004 ? <path d={dB} stroke="url(#cw-hatch)" strokeOpacity={hatchOp} strokeWidth={band} pathLength={1} strokeDasharray={dash(pI)} /> : null}
      {/* the double line, cased dark so it holds on land and sea */}
      <path d={dO} stroke={DARK} strokeOpacity={0.55} strokeWidth={wO + 3.4} pathLength={1} strokeDasharray={dash(pO)} />
      <path d={dI} stroke={DARK} strokeOpacity={0.4} strokeWidth={wI + 2.2} pathLength={1} strokeDasharray={dash(pI)} />
      <path d={dI} stroke={ACCENT} strokeWidth={wI} pathLength={1} strokeDasharray={dash(pI)} strokeLinecap="round" />
      <path d={dO} stroke={ACCENT} strokeWidth={wO} pathLength={1} strokeDasharray={dash(pO)} strokeLinecap="round" />
    </g>
  );
};

// ---- the raster pyramid ----------------------------------------------------------
const MapLevels: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const op = LEVELS.map((L, i) => (i === 0 ? 1 : smoothstep((k - L.kIn) / (L.kFull - L.kIn))));
  return (
    <>
      {LEVELS.map((L, i) => {
        // drawn while it shows and the next level does not yet cover it
        if (op[i] <= 0.001 || (i + 1 < LEVELS.length && op[i + 1] >= 0.999)) return null;
        return (
          <Img
            key={L.name}
            src={staticFile(`texcoco-atlantic/${L.name}.png`)}
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

const ClosedWorlds: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const { k } = cam;
  const ringS = screenOf(RING_C, cam);

  // the fog front
  const fr = fogR(frame);
  const ff = fogFeather(frame);
  const fogBg = `radial-gradient(circle at ${ringS[0].toFixed(2)}px ${ringS[1].toFixed(2)}px, rgba(15,12,9,0) ${(fr - ff).toFixed(2)}px, ${FOG} ${fr.toFixed(2)}px)`;

  // the track
  const sLead = leadS(frame);
  const lead = routeAt(sLead);
  const w = (v: number) => v / k;
  const d = frame >= LEAD.line0 ? trackD(sLead) : "";
  const rise = smoothstep((frame - LEAD.rise0) / (LEAD.rise1 - LEAD.rise0));
  const dashOn = 9.5;
  const dashOff = 7;

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapLevels cam={cam} />
      <Mottle cam={cam} opacity={0.9} />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={camTransform(cam).svg}>
          {d ? (
            <>
              <path d={d} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={w(7.2)} strokeLinejoin="round" />
              <path d={d} fill="none" stroke={INK} strokeOpacity={0.95} strokeWidth={w(3.7)} strokeDasharray={`${dashOn} ${dashOff}`} strokeLinejoin="round" />
              <CityDot x={SEVILLE[0]} y={SEVILLE[1]} cam={cam} r={6.5} />
            </>
          ) : null}
          {FOLLOW.map((q, i) => {
            const s = followS(frame, q);
            if (s <= 0) return null;
            const p = routeAt(s);
            return <Carrack key={i} x={p[0]} y={p[1]} cam={cam} frame={frame} size={SHIP_FOLLOW} seed={q.seed} opacity={smoothstep(s / 26)} rock={1.1} wake={0.8} />;
          })}
          {rise > 0.002 ? <Carrack x={lead[0]} y={lead[1] + (24 * (1 - rise)) / k} cam={cam} frame={frame} size={SHIP_LEAD} seed={3} opacity={rise} rock={1.2} wake={rise * (1 - 0.6 * smoothstep((frame - LEAD.f1 + 6) / 8))} /> : null}
        </g>
      </svg>
      {/* the unknown: the dark page outside the front */}
      <AbsoluteFill style={{ background: fogBg }} />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <Ring cam={cam} frame={frame} />
      </svg>
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default ClosedWorlds;
