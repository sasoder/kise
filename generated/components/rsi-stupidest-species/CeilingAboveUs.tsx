// ---------------------------------------------------------------------------
// CeilingAboveUs (rsi-stupidest-species, cut 2). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 69 frames. Built on the shared world W1 THE SPECIES TOWER (speciesTower.tsx, read-only;
// TOWER_READY.md is its API): this cut adds only its camera track and the human's glance.
//
// CHECK LINE: "Human intelligence sits low on a tower whose ceiling is far, far above us."
//
// THE LINE: "I think the ceiling here is probably way above human level."
// WORD -> FRAME: I -2 · think 2 · the 8 · ceiling 13 · here 18 · is 23 · probably 33 · way 37 · above 48 · human 55 ·
//   level 62 (Whisper onsets from the composition start; may run ~0.2-0.4 s early)
// DURATION: the slot 2.336 -> 5.214 s (sequence frames 56-125) = 2.878 s x 23.976 = 69 frames (f0..f68).
//
// THE MOTION: one continuous camera. f0 opens close on the human (~300 px) in his lit niche low on the tower, the cornice
// under his sill, the camera already rising; on "think the ceiling" (f2-16) he lifts his face to look up, and the
// camera follows his gaze in ONE eased pull-back and crane-up along the face: the empty niches and the grand niche pass,
// the stone capital, then the dashed orange continuation rising into the bright high air, the dashed ceiling entering at
// the top (~f24) and landing near y 320 as the move settles (~f44, before "above" f48). f44-68 ("above human level"):
// the living hold on the whole tower in one 9:16 frame, the lit niche small and low (sill y ~1040), a slow creep in,
// the dashes breathing, the motes drifting. Its one job: the distance between human level and the ceiling.
// Orange = intelligence (the clip's rule); DASHED orange = the superintelligence that does not exist yet. Everything
// else in the style's earthy stone and air; the human is never orange. No labels, no numbers.
//
// CAMERA: one designed lobe (see camTrack): the progress integrates a skewed bump started at f -8 (so f0 already moves
// at about half its peak speed; peak ~f16, settled f46); ln k runs linearly from TOWER_CAM.A_open (f0) to A_resolved
// (f46) and the human's sill point is held on a straight screen path from y ~1004 to y 1040, so he never leaves the
// keep-in box; then a 2 % creep in on the same anchor (smootherstep) to the end, plus the house swayCam.
// Measured (camcheck in the builder's scratch): human 300 px at f0, ~120 px at f16, 41 px from f44; dashes enter the
// top at ~f17, the ceiling band at ~f28, its top at y 320 at f46 and y ~310 at f68 (orange glow y >= 296 from f42).
// DASHES (director, after a blind review read the rings as a birdcage / lampshade): no intermediate course rings;
// only the two vertical dashed edges (fading to 45 % as they rise into the bright air) and the ceiling band.
// OCCLUSION: the dashed part is drawn here, clipped outside the stone's projected silhouette (StoneCutDashes), because
// the shared scene paints it over the stone (the back halves of the low rings showed on the cap at f12-16).
// DEPTH: the tower's own depth camera (towerPersp: eye at 0.85 x the frame centre's height + 0.6 m, dRef 30000,
// kRef 0.058, dolly 0.6), fog by world depth (towerAirOf); the human on HUMAN_SPOT (Z ~ the niche floor).
// The chimp's niche stays empty: at f0 it sits in the lower frame and the pull-back would carry its face through
// caption band 1 (cut B introduces it).
//
// SOURCES: none (no real figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, AirStage, ORANGE_LINE, WorldSvg, mixHex, swayCam, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import * as Covid from "../kyle-covid/covidFolk";
import { HUMAN_SPOT, Rm, TOWER, TOWER_CAM, TowerScene, ZC, frameAt, hy, m, screenOf3, towerAirOf, towerPt, zFrontAt } from "./speciesTower";
import type { AirWorld, P2 } from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 24000 / 1001;
export const DURATION = 69;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const sst = (a: number, b: number, f: number) => {
  const u = Math.max(0, Math.min(1, (f - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

// ---- the camera ---------------------------------------------------------------------------------------------------
// One eased lobe, already moving at f0: the progress s(f) integrates a skewed bump t^A (1 - t)^B over [F0, F1] (F0 < 0,
// so the move started before the cut), renormalised so s(0) = 0 (= TOWER_CAM.A_open) and s(F1) = 1 (= A_resolved).
// The framing is anchored on the human's sill point (HUMAN_SPOT): ln k runs linearly in s, and the sill's screen y runs
// from its A_open place to its A_resolved place, so he stays low and inside the keep-in box on every frame. After F1
// the living hold creeps in by CREEP (2 %) on the same anchor (a smootherstep, continuous with the stop).
export const CAM = { A: 1.5, B: 2.0, F0: -8, F1: 46, CREEP: 1.02 };
const N_INT = 1200;
const S_TAB = (() => {
  const tab = [0];
  const v = (i: number) => {
    const t = i / N_INT;
    return Math.pow(t, CAM.A) * Math.pow(1 - t, CAM.B);
  };
  for (let i = 0; i < N_INT; i++) tab.push(tab[i] + (v(i) + v(i + 1)) / 2);
  return tab.map((q) => q / tab[N_INT]);
})();
const sRaw = (f: number) => {
  const x = ((f - CAM.F0) / (CAM.F1 - CAM.F0)) * N_INT;
  if (x <= 0) return 0;
  if (x >= N_INT) return 1;
  const i = Math.floor(x);
  return S_TAB[i] + (S_TAB[i + 1] - S_TAB[i]) * (x - i);
};
const S0 = sRaw(0);
export const moveS = (f: number) => (sRaw(f) - S0) / (1 - S0);
const smoother = (u: number) => {
  const x = Math.max(0, Math.min(1, u));
  return x * x * x * (x * (6 * x - 15) + 10);
};
const SILL_OPEN = screenOf3(TOWER_CAM.A_open, HUMAN_SPOT.X, HUMAN_SPOT.Y, HUMAN_SPOT.Z);
const SILL_RES = screenOf3(TOWER_CAM.A_resolved, HUMAN_SPOT.X, HUMAN_SPOT.Y, HUMAN_SPOT.Z);
const LNK_OPEN = Math.log(TOWER_CAM.A_open.k);
const LNK_RES = Math.log(TOWER_CAM.A_resolved.k);
export const camTrack = (f: number): Cam => {
  const s = moveS(f);
  const creep = Math.log(CAM.CREEP) * smoother((f - CAM.F1) / (DURATION - 1 - CAM.F1 + 10));
  const k = Math.exp(LNK_OPEN + (LNK_RES - LNK_OPEN) * s + creep);
  const sx = SILL_OPEN[0] + (SILL_RES[0] - SILL_OPEN[0]) * s;
  const sy = SILL_OPEN[1] + (SILL_RES[1] - SILL_OPEN[1]) * s;
  return frameAt(k, HUMAN_SPOT.X, HUMAN_SPOT.Y, HUMAN_SPOT.Z, sx, sy);
};
const REST = swayCam(camTrack(0), 0);

// ---- the human: he lifts his face to the ceiling on "think the ceiling" -----------------------------------------------
const humanPoseAt = (frame: number): Covid.CovidPose => {
  const q = Covid.POSES.front();
  const up = sst(0, 10, frame);
  return Covid.breathe({ ...q, pitch: (q.pitch ?? 0) - 16 * up, look: [0.05 * up, -0.05 - 0.9 * up] }, frame);
};

// ---- the dashed part, occluded by the stone ---------------------------------------------------------------------------
// The shared TowerScene paints the dashed continuation after the stone with no occlusion, so while the camera rises past
// the capital (f12-f16) the faint back halves of the lowest course rings showed through the stone cap. Here the tower is
// drawn with show.dashed 0 and the dashed part (GhostDashes, above) is drawn here, clipped (evenodd) outside the stone's silhouette: the convex
// hull of every drum's outer circle projected under this frame's camera (the eye stays below the capital throughout).
const SIL_RINGS: [number, number][] = [
  [0, 1.1], [0.35, 1.1], [0.35, 0.6], [0.95, 0.6], [3.75, 0.35], [3.95, 0.8], [4.5, 0.8], [12.6, 0.4], [13.0, 1.15],
  [15.0, 1.45], [15.6, 1.45],
];
const hull = (pts: P2[]): P2[] => {
  const q = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const p of q) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: P2[] = [];
  for (const p of [...q].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
// ---- the ghost continuation (director's note after the blind review) ------------------------------------------------
// The shared DashedTower stacks three dashed course rings (20.0 / 24.4 / 28.8 m) between the capital and the ceiling; a
// fresh viewer read them as a birdcage / wire lampshade. Here only the two vertical dashed edges (fading from full at the
// capital to EDGE_TOP_A just under the ceiling) and the ceiling band (exactly as the shared module draws it at progress 1:
// its lower ring, the band's top and bottom rings, the two band verticals) are drawn. DashStroke is a copy of the shared
// module's (not exported): glow underlay, deep-orange edge, dash.
const EDGE_TOP_A = 0.45;
const DASH = { len: 1.5, gap: 0.95 };
const DashStroke: React.FC<{ A: AirWorld; d: string; Z: number; h: number; px?: number; a?: number; dash?: [number, number] }> = ({ A, d, Z, h, px = 3.4, a = 1, dash }) => {
  const wpx = px * Math.pow(A.k / 0.058, 0.3);
  const w = wpx / A.k;
  const da = dash ?? [m(DASH.len), m(DASH.gap)];
  const col = A.toneO(ACCENT, Z, h);
  const edge = A.toneO(ACCENT_DEEP, Z, h);
  const dash2 = `${da[0].toFixed(1)} ${da[1].toFixed(1)}`;
  return (
    <g>
      <path d={d} fill="none" stroke={col} strokeWidth={w * 3.4} strokeOpacity={0.14 * a} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={mixHex(edge, ORANGE_LINE, 0.4)} strokeWidth={w * 1.55} strokeOpacity={0.55 * a} strokeDasharray={dash2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeOpacity={a} strokeDasharray={dash2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
const polyD = (q: P2[]) => `M${q.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}`;
const GhostDashes: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const br = 0.86 + 0.14 * Math.sin((2 * Math.PI * frame) / 64);
  const h0 = TOWER.capitalY;
  const C = TOWER.ceil;
  const edge = (side: -1 | 1): P2[] => Array.from({ length: 11 }, (_, i) => {
    const h = h0 + ((C.h0 - h0) * i) / 10;
    return P.p(side * m(Rm(h)), hy(h), ZC);
  });
  const ring = (h: number, out: number) => {
    const N = 24;
    const arc = (a0: number, a1: number) => polyD(Array.from({ length: N + 1 }, (_, i) => {
      const v = towerPt(a0 + ((a1 - a0) * i) / N, h, out);
      return P.p(v[0], v[1], v[2]);
    }));
    return { front: arc(Math.PI, Math.PI / 2) + arc(0, Math.PI / 2), back: arc(Math.PI, 1.5 * Math.PI) + arc(0, -Math.PI / 2) };
  };
  const eL = edge(-1);
  const eR = edge(1);
  const yFoot = eL[0][1];
  const yTop = eL[eL.length - 1][1];
  const r0 = ring(C.h0, 0);
  const r1 = ring(C.h0, C.out);
  const r2 = ring(C.h1, C.out);
  return (
    <g>
      <defs>
        <linearGradient id="caEdgeFadeG" gradientUnits="userSpaceOnUse" x1={0} y1={yFoot} x2={0} y2={yTop}>
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={EDGE_TOP_A} />
        </linearGradient>
        <mask id="caEdgeFade" maskUnits="userSpaceOnUse" x={-1e6} y={-1e6} width={2e6} height={2e6}>
          <rect x={-1e6} y={-1e6} width={2e6} height={2e6} fill="url(#caEdgeFadeG)" />
        </mask>
      </defs>
      <g mask="url(#caEdgeFade)">
        <DashStroke A={A} d={polyD(eL)} Z={ZC} h={m((h0 + C.h0) / 2)} a={br} />
        <DashStroke A={A} d={polyD(eR)} Z={ZC} h={m((h0 + C.h0) / 2)} a={br} />
      </g>
      <DashStroke A={A} d={r0.back} Z={ZC + m(Rm(C.h0))} h={m(C.h0)} a={0.38 * br} px={2.6} />
      <DashStroke A={A} d={r1.back} Z={ZC + m(Rm(C.h0) + C.out)} h={m(C.h0)} a={0.38 * br} px={2.6} />
      <DashStroke A={A} d={r2.back} Z={ZC + m(Rm(C.h1) + C.out)} h={m(C.h1)} a={0.45 * br} px={2.8} />
      <DashStroke A={A} d={r0.front} Z={zFrontAt(C.h0)} h={m(C.h0)} a={br} />
      <DashStroke A={A} d={r1.front} Z={zFrontAt(C.h0) - m(C.out)} h={m(C.h0)} a={br} px={3.8} />
      <DashStroke A={A} d={r2.front} Z={zFrontAt(C.h1) - m(C.out)} h={m(C.h1)} a={br} px={3.8} />
      {([-1, 1] as const).map((sd) => (
        <DashStroke
          key={sd}
          A={A}
          d={`M${P.p(sd * m(Rm(C.h0) + C.out), hy(C.h0), ZC).map((v) => v.toFixed(2)).join(",")}L${P.p(sd * m(Rm(C.h1) + C.out), hy(C.h1), ZC).map((v) => v.toFixed(2)).join(",")}`}
          Z={ZC}
          h={m(C.h1)}
          a={br}
          px={3.8}
          dash={[m(0.7), m(0.45)]}
        />
      ))}
    </g>
  );
};

const StoneCutDashes: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const pts: P2[] = [];
  for (const [h, out] of SIL_RINGS) {
    if (h > TOWER.capitalY) continue;
    for (let i = 0; i < 96; i++) {
      const v = towerPt((2 * Math.PI * i) / 96, h, out);
      pts.push(A.P.p(v[0], v[1], v[2]));
    }
  }
  const H = hull(pts);
  const B = 1e6;
  const d = `M${-B},${-B}L${B},${-B}L${B},${B}L${-B},${B}Z M${H.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}Z`;
  return (
    <g>
      <defs>
        <clipPath id="caStoneCut" clipPathUnits="userSpaceOnUse">
          <path d={d} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g clipPath="url(#caStoneCut)">
        <GhostDashes A={A} frame={frame} />
      </g>
    </g>
  );
};

const CeilingAboveUs: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camTrack(frame), frame);
  const A = towerAirOf({ cam, rest: REST, frame });
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <TowerScene A={A} frame={frame} show={{ dashed: 0 }} human={{ pose: humanPoseAt(frame) }} occupants={{}} />
        <StoneCutDashes A={A} frame={frame} />
      </WorldSvg>
    </AirStage>
  );
};

export default CeilingAboveUs;
