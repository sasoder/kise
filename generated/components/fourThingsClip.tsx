import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Cam } from "./outgrowShared";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_NUM,
  GEO,
  METRIC,
  StoutStage,
  bloomFilter,
  mixHex,
  rectPath,
  smoothstep,
} from "./stoutShared";
import {
  BAY_CY,
  Rail,
  SEQ,
  bayCam,
  bayX,
  mixCam,
  restToRest,
  stageSway,
  travelEase,
  TRAVEL,
  type ClipN,
  type SceneCam,
  type SceneN,
  type ScenePool,
  type SceneProps,
} from "./fourThingsShared";
import * as M1 from "./fourThingsScene1";
import * as M2 from "./fourThingsScene2";
import * as M3 from "./fourThingsScene3";
import * as M4 from "./fourThingsScene4";

// ===========================================================================
// fourThingsClip — THE SHELL of the META4 set (out/meta4/BRIEF.md, out/meta4/SHARED_READY.md).
// FourThingsClip({ n }) is clip n: the stout stage on the sequence clock g = SEQ[n].start + frame,
// the camera (bay n-1's settled sceneCam -> bay n's sceneCam, see TRAVEL), the light pool, scene n-1
// at t = len(n-1) + frame and scene n at t = frame, and the rail (a function of g) above the world.
// It lives outside fourThingsShared.tsx so the scene files can import that module without a cycle.
// ===========================================================================

type SceneModule = { Scene: React.FC<SceneProps>; cam: (t: number) => SceneCam; pool?: (t: number) => ScenePool };
const opt = (m: object, name: string) => (m as Record<string, unknown>)[name] as ((t: number) => ScenePool) | undefined;
const SCENES: Record<SceneN, SceneModule> = {
  1: { Scene: M1.Scene1, cam: M1.sceneCam1, pool: opt(M1, "scenePool1") },
  2: { Scene: M2.Scene2, cam: M2.sceneCam2, pool: opt(M2, "scenePool2") },
  3: { Scene: M3.Scene3, cam: M3.sceneCam3, pool: opt(M3, "scenePool3") },
  4: { Scene: M4.Scene4, cam: M4.sceneCam4, pool: opt(M4, "scenePool4") },
};
/** The stage's parallax origin: one camera for the whole set (so the ground joins across clips). */
const REST: Cam = { x: bayX(1), y: BAY_CY, k: 1 };
const EMPTY: SceneCam = { dx: 0, dy: 0, k: 1 };
const isScene = (n: number): n is SceneN => n >= 1 && n <= 4;

/** Clip n's camera and light pool at local frame f. */
export const clipCamera = (n: ClipN, f: number) => {
  const p = n - 1;
  const tPrev = isScene(p) ? SEQ[p].len + f : 0;
  const a = isScene(p) ? bayCam(p, SCENES[p].cam(tPrev)) : bayCam(p, EMPTY);
  const b = isScene(n) ? bayCam(n, SCENES[n].cam(f)) : bayCam(n, EMPTY);
  const e = travelEase(n, f);
  const cam = mixCam(a, b, e);
  const poolOf = (m: number, t: number) => {
    const q = isScene(m) ? SCENES[m].pool?.(t) : undefined;
    return { x: bayX(m) + (q?.dx ?? 0), y: BAY_CY + (q?.dy ?? 0), s: q?.strength ?? 1 };
  };
  const pa = poolOf(p, tPrev);
  const pb = poolOf(n, f);
  const drift = 0;
  const pool = { x: pa.x + (pb.x - pa.x) * e + drift, y: pa.y + (pb.y - pa.y) * e, strength: pa.s + (pb.s - pa.s) * e };
  return { cam, pool, arrived: f >= TRAVEL[n][1] + 2 };
};

// ===========================================================================
// CLIP 5 — THE RECAP: the four settled scenes themselves as miniatures, a 2 x 2 under the rail
// (row 1 above the caption strip, row 2 below it). Each miniature is the real Scene<N> mounted at a
// settled t (and the current g) under its own settled camera, scaled into a cell plate and clipped to
// it; an amber number tile (the stations' material) on the plate's top-left corner. The plates rise
// out of slots at their foot, in rail order.
// ===========================================================================
const CELL = { w: 480, h: 530, x: [48, 552], y: [520, 1270], tile: 68, inset: 14 } as const;
/** Each miniature: its scale and the point of the scene's settled SCREEN frame at the cell's centre. */
const MINI: Record<SceneN, { m: number; sx: number; sy: number }> = {
  1: { m: 0.46, sx: 540, sy: 835 },
  2: { m: 0.405, sx: 540, sy: 1025 },
  3: { m: 0.45, sx: 540, sy: 905 },
  4: { m: 0.43, sx: 540, sy: 1050 },
};
/** Local frames of clip 5: plate i's slot opens at RECAP.slot + i x step, it rises from RECAP.rise + i x step. */
export const RECAP = { slot: 20, rise: 24, step: 8, dur: 30 } as const;
const fr = (v: number) => (Math.round(v * 1000) / 1000).toString();
const PLATE = mixHex(COLOR.ground, COLOR.board, 0.16);

const Recap: React.FC<{ f: number; g: number }> = ({ f, g }) => {
  const uid = `rc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const sw = stageSway(g);
  const r = GEO.RADIUS;
  return (
    <g transform={`translate(${fr(sw.dx)} ${fr(sw.dy)})`}>
      <defs>
        <AmberGradient id={`${uid}a`} y0={300} y1={1368} />
      </defs>
      {([1, 2, 3, 4] as SceneN[]).map((sn, i) => {
        const x = CELL.x[i % 2];
        const y = CELL.y[Math.floor(i / 2)];
        const up = restToRest((f - RECAP.rise - i * RECAP.step) / RECAP.dur, 3);
        const slot = smoothstep((f - RECAP.slot - i * RECAP.step) / 4);
        if (slot <= 0.001) return null;
        const off = (1 - up) * CELL.h; // the plate's travel still to go (it rises out of the slot at its foot)
        const vis = CELL.h - off;
        const M = MINI[sn];
        const t = SEQ[sn].len + 40; // settled
        const sc = bayCam(sn, SCENES[sn].cam(t));
        const S = SCENES[sn].Scene;
        const T = CELL.tile;
        const tx = x + CELL.inset;
        const ty = y + CELL.inset;
        const fs = 0.62 * T;
        const slotW = (CELL.w + 2 * EDGE.SLOT_LIP) * slot;
        return (
          <g key={sn}>
            <defs>
              <clipPath id={`${uid}c${sn}`}>
                <path d={rectPath(x, y, CELL.w, CELL.h, r, true, false)} />
              </clipPath>
              <linearGradient id={`${uid}h${sn}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
                <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
              </linearGradient>
            </defs>
            {vis > 1 ? (
              <>
                <ElevationShadow silhouette={[{ d: rectPath(x, y + off, CELL.w, vis, r, true, false) }]} elevation="rest" contact={{ x: x + CELL.w / 2, y: y + CELL.h, w: CELL.w * 0.86 }} />
                <g clipPath={`url(#${uid}c${sn})`}>
                  <g transform={`translate(0 ${fr(off)})`}>
                    {/* the plate */}
                    <path d={rectPath(x, y, CELL.w, CELL.h, r, true, false)} fill={PLATE} />
                    {/* the scene, settled, under its own camera, scaled into the cell */}
                    <g transform={`translate(${fr(x + CELL.w / 2)} ${fr(y + CELL.h / 2)}) scale(${M.m}) translate(${-M.sx} ${-M.sy})`}>
                      <g transform={`translate(${(540 - sc.x * sc.k).toFixed(4)} ${(960 - sc.y * sc.k).toFixed(4)}) scale(${sc.k.toFixed(6)})`}>
                        <S t={t} g={g} cam={sc} k={sc.k} />
                      </g>
                    </g>
                    {/* the plate's lit top edge and its hairline */}
                    <path d={rectPath(x + 0.75, y + 0.75, CELL.w - 1.5, CELL.h, r, true, false)} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassLo} strokeWidth={1.5} />
                    {/* the number tile: a station */}
                    <ElevationShadow silhouette={[{ d: rectPath(tx, ty, T, T, r) }]} elevation="rest" />
                    <g style={{ filter: bloomFilter(1) }}>
                      <path d={rectPath(tx, ty, T, T, r)} fill={`url(#${uid}a)`} />
                    </g>
                    <path d={rectPath(tx, ty, T, EDGE.HOT_FALL, r, true, false)} fill={`url(#${uid}h${sn})`} />
                    <path d={`M${tx + r} ${ty + EDGE.HOT / 2}H${tx + T - r}`} stroke={COLOR.amberHot} strokeWidth={EDGE.HOT} />
                    <text x={tx + T / 2} y={fr(ty + T / 2 + (METRIC.fig * fs) / 2)} fontFamily={FONT_NUM} fontWeight={700} fontSize={fr(fs)} textAnchor="middle" fill={COLOR.inkDark} style={{ fontFeatureSettings: '"lnum" 1' }}>
                      {sn}
                    </text>
                  </g>
                </g>
              </>
            ) : null}
            {/* the slot at the plate's foot (opens from its centre before the plate rises) */}
            <rect x={fr(x + CELL.w / 2 - slotW / 2)} y={y + CELL.h - EDGE.SLOT / 2} width={fr(slotW)} height={EDGE.SLOT} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
          </g>
        );
      })}
    </g>
  );
};

export const FourThingsClip: React.FC<{ n: ClipN }> = ({ n }) => {
  const frame = useCurrentFrame();
  const g = SEQ[n].start + frame;
  const { cam, pool, arrived } = clipCamera(n, frame);
  const p = n - 1;
  const Prev = isScene(p) && !arrived ? SCENES[p].Scene : null;
  const Cur = isScene(n) ? SCENES[n].Scene : null;
  return (
    <AbsoluteFill>
      <StoutStage S={g} cam={cam} rest={REST} pool={pool} overlay={
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <Rail g={g} />
            {n === 5 ? <Recap f={frame} g={g} /> : null}
          </svg>
        }
      >
        {Prev && isScene(p) ? <Prev t={SEQ[p].len + frame} g={g} cam={cam} k={cam.k} /> : null}
        {Cur ? <Cur t={frame} g={g} cam={cam} k={cam.k} /> : null}
      </StoutStage>
    </AbsoluteFill>
  );
};
