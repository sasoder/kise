import React, { useId } from "react";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_NUM,
  GEO,
  LightSweep,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  type Silhouette,
} from "./stoutShared";
import { FLOOR, bayX, personPath, restToRest, type SceneCam, type ScenePool, type SceneProps } from "./fourThingsShared";

// ===========================================================================
// fourThingsScene1 — FourThings1, "standing up MSL is the verdict" (META4 set, out/meta4/BRIEF.md).
// CHECK LINE: by building a new lab next to the old teams, Mark told them they had failed, without
// saying it.
//
// ONE MOTION: a new amber block (MSL) rises out of a slot in the floor beside the old cream block of
// people (the Meta infinity knocked out of its tile), and as it rises the old block loses the light.
//
// FRAMES (t = local frames of clip 1, which starts at 7.966 s):
//   0-12    the rail is the hero; amber into station 1 on "One" (shell / rail)
//   12-42   the rail glides to the header; the camera travels right into bay 1, the old block
//           (people on the Meta tile, lit cream) arrives from the right
//   30-315  the camera: one slow push (k 0.97 -> 1.08), the pair centred
//   278-290 MSL blurs in (ink) on the block's face, whole, before the word (295)
//   30-38   the slot opens in the floor beside it
//   38-208  the amber block creeps out of the slot (to 28 %) -> "called the recent prior efforts ...
//           a failure and not good enough ... more diplomatic"; the camera drifts right with it
//   188-296 the main rise, on the long pause after "the act of" (16.0-19.9 s), a long soft landing:
//           it stands on "standing up MSL" (285-300); its face blank until the label
//   38-296  the old block dims by tone to kraft board in step with the rise; the light pool moves
//           onto MSL
//   296-308 the one light sweep across the amber block
//   315-    settled: the camera constant (so clip 2 leaves from it); sway, drift, grain from g
// ===========================================================================

const X = bayX(1);
// the old block: one long tile, five people on it
const OLD = { x0: X - 470, w: 580, h: 150, bust: 108, pitch: 112 } as const;
const OLD_CX = OLD.x0 + OLD.w / 2;
const OLD_TOP = FLOOR - OLD.h;
// the new block
const NEW = { x0: X + 158, w: 280, h: 520 } as const;
const NEW_CX = NEW.x0 + NEW.w / 2;
const T = { slot: [30, 38], creep: [38, 208], rise: [188, 296], sweep: [296, 308], settled: 315 } as const;
const CREEP = 0.28;
const LABEL: [number, number] = [278, 290]; // MSL blurs in on the standing block, whole, before the word (f 295)

/** The amber block's height, 0..1. */
export const riseAt = (t: number) =>
  CREEP * smoothstep((t - T.creep[0]) / (T.creep[1] - T.creep[0])) + (1 - CREEP) * restToRest((t - T.rise[0]) / (T.rise[1] - T.rise[0]), 3);
/** The old block's tone: 0 cream .. 1 kraft board, in step with the rise. */
const dimAt = (t: number) => smoothstep((riseAt(t) - 0.04) / 0.9);

/** The settled camera (constant from f 315): the pair centred, floor at screen y 1110. */
const K_START = 0.97;
const K_END = 1.08; // the pair 981 px wide at rest: 49 px side margins
export const sceneCam1 = (t: number): SceneCam => {
  // ONE slow continuous push across the whole clip, the pair centred in x all the way
  const u = smoothstep((t - 30) / 285);
  const k = Math.exp(lerp(Math.log(K_START), Math.log(K_END), u));
  const floorY = lerp(1090, 1110, u); // where the floor stands on screen
  return { dx: -16, dy: FLOOR - 960 - (floorY - 960) / k, k };
};
export const scenePool1 = (t: number): ScenePool => {
  const d = dimAt(t);
  return { dx: lerp(OLD_CX - X, NEW_CX - X, d), dy: lerp(FLOOR - 150 - 960, FLOOR - 270 - 960, d) };
};

// The Meta infinity (Wikimedia "Meta Platforms Inc. logo (cropped)", 287.56 x 191): its three shapes,
// drawn as one silhouette and knocked out of the tile.
const META_D = [
  "m31.06,125.96c0,10.98 2.41,19.41 5.56,24.51 4.13,6.68 10.29,9.51 16.57,9.51 8.1,0 15.51-2.01 29.79-21.76 11.44-15.83 24.92-38.05 33.99-51.98l15.36-23.6c10.67-16.39 23.02-34.61 37.18-46.96 11.56-10.08 24.03-15.68 36.58-15.68 21.07,0 41.14,12.21 56.5,35.11 16.81,25.08 24.97,56.67 24.97,89.27 0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75l0-31.02c17.63,0 22.03-16.2 22.03-34.74 0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16.05c-18.2,32.27-22.81,39.62-31.91,51.75-15.95,21.24-29.57,29.29-47.5,29.29-21.27,0-34.72-9.21-43.05-23.09-6.8-11.31-10.14-26.15-10.14-43.06z",
  "m24.49,37.3c14.24-21.95 34.79-37.3 58.36-37.3 13.65,0 27.22,4.04 41.39,15.61 15.5,12.65 32.02,33.48 52.63,67.81l7.39,12.32c17.84,29.72 27.99,45.01 33.93,52.22 7.64,9.26 12.99,12.02 19.94,12.02 17.63,0 22.03-16.2 22.03-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71l-25.79-43.08c-12.94-21.62-24.81-37.74-31.68-45.04-7.39-7.85-16.89-17.33-32.05-17.33-12.27,0-22.69,8.61-31.41,21.78z",
  "m82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78-12.33,18.61-19.88,46.33-19.88,72.95 0,10.98 2.41,19.41 5.56,24.51l-26.48,17.44c-6.8-11.31-10.14-26.15-10.14-43.06 0-30.75 8.44-62.8 24.49-87.55 14.24-21.95 34.79-37.3 58.36-37.3z",
];
const META_BOX = { w: 287.56, h: 191 };
const LOGO_H = 84;

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `f1${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

export const Scene1: React.FC<SceneProps> = ({ t, cam, k }) => {
  const uid = uidOf(useId());
  const r = GEO.RADIUS;
  const rise = riseAt(t);
  const dim = dimAt(t);
  const band = amberBandFor(cam);
  // --- the old block
  const busts = [0, 1, 2, 3, 4].map((i) => OLD_CX + (i - 2) * OLD.pitch);
  const tileD = rectPath(OLD.x0, OLD_TOP, OLD.w, OLD.h, r);
  const bustD = busts.map((bx) => personPath(bx, OLD_TOP, OLD.bust));
  const oldSil: Silhouette = [{ d: tileD }, ...bustD.map((d) => ({ d }))];
  const ls = LOGO_H / META_BOX.h;
  const lx = OLD_CX - (META_BOX.w * ls) / 2;
  const ly = OLD_TOP + (OLD.h - LOGO_H) / 2;
  // --- the new block
  const top = FLOOR - NEW.h * rise;
  const vis = FLOOR - top;
  const slot = smoothstep((t - T.slot[0]) / (T.slot[1] - T.slot[0]));
  const slotW = (NEW.w + (2 * EDGE.SLOT_LIP) / k) * slot;
  const newD = rectPath(NEW.x0, top, NEW.w, vis, r, true, false);
  const fall = EDGE.HOT_FALL / k;
  const sweep = (t - T.sweep[0]) / (T.sweep[1] - T.sweep[0]);
  const fs = 104;
  const la = 1 - Math.pow(1 - clamp01((t - LABEL[0]) / (LABEL[1] - LABEL[0])), 3);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(OLD_TOP - OLD.bust)} x2="0" y2={f2(FLOOR)}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dim)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dim)} />
        </linearGradient>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={OLD.x0} y={OLD_TOP} width={OLD.w} height={OLD.h}>
          <rect x={OLD.x0} y={OLD_TOP} width={OLD.w} height={OLD.h} fill="#fff" />
          <g transform={`translate(${f2(lx)} ${f2(ly)}) scale(${f2(ls)})`} fill="#000">
            {META_D.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </mask>
        <clipPath id={`${uid}f`}>
          <rect x={NEW.x0 - 40} y={FLOOR - NEW.h - 80} width={NEW.w + 80} height={NEW.h + 80} />
        </clipPath>
      </defs>

      {/* THE OLD BLOCK: people on one long tile, one shadow, one tone */}
      <ElevationShadow silhouette={oldSil} elevation="rest" contact={{ x: OLD_CX, y: FLOOR, w: OLD.w * 0.86 }} />
      {bustD.map((d, i) => (
        <path key={i} d={d} fill={`url(#${uid}c)`} />
      ))}
      <path d={tileD} fill={`url(#${uid}c)`} mask={`url(#${uid}k)`} />
      {/* where each person meets the tile: a short occlusion; then the tile's lit top edge */}
      {busts.map((bx, i) => (
        <rect key={i} x={f2(bx - OLD.bust / 2 + 2)} y={f2(OLD_TOP - EDGE.FOOT_AO / k)} width={OLD.bust - 4} height={f2(EDGE.FOOT_AO / k)} fill={`url(#${uid}ao)`} />
      ))}
      <path
        d={`M${f2(OLD.x0 + r)} ${f2(OLD_TOP + EDGE.CREAM / k / 2)}H${f2(OLD.x0 + OLD.w - r)}`}
        stroke={COLOR.edge}
        strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim)}
        strokeWidth={f2(EDGE.CREAM / k)}
      />

      {/* THE NEW BLOCK: amber, rising out of its slot */}
      {vis > 0.3 ? (
        <>
          <ElevationShadow silhouette={[{ d: newD }]} elevation="rest" contact={{ x: NEW_CX, y: FLOOR, w: NEW.w * 0.86 }} strength={clamp01(vis / 12)} />
          <g style={{ filter: bloomFilter(k) }}>
            <path d={newD} fill={`url(#${uid}a)`} />
          </g>
          <g clipPath={`url(#${uid}f)`}>
            <path d={rectPath(NEW.x0, top, NEW.w, Math.min(fall, vis), r, true, false)} fill={`url(#${uid}hf)`} />
            <path d={`M${f2(NEW.x0 + r)} ${f2(top + EDGE.HOT / k / 2)}H${f2(NEW.x0 + NEW.w - r)}`} stroke={COLOR.amberHot} strokeWidth={f2(EDGE.HOT / k)} />
            {/* MSL, in ink on the block's face: the house entrance (blur-in + 24 px slide-up), whole */}
            {la > 0.002 ? (
              <text
                x={f2(NEW_CX)}
                y={f2(top + 72 + fs * 0.718 + ((1 - la) * 24) / k)}
                fontFamily={FONT_NUM}
                fontWeight={700}
                fontSize={fs}
                letterSpacing="0.01em"
                textAnchor="middle"
                fill={COLOR.inkDark}
                opacity={f2(la)}
                style={{ filter: la < 0.99 ? `blur(${f2((6 * (1 - la)) / k)}px)` : undefined }}
              >
                MSL
              </text>
            ) : null}
            <rect x={NEW.x0} y={f2(FLOOR - Math.min(vis, EDGE.FOOT_AO / k))} width={NEW.w} height={f2(Math.min(vis, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
          </g>
          <LightSweep x={NEW.x0} y={top} w={NEW.w} h={vis} k={k} t={sweep} on="amber" />
        </>
      ) : null}
      {slot > 0.001 ? (
        <rect x={f2(NEW_CX - slotW / 2)} y={f2(FLOOR - EDGE.SLOT / k / 2)} width={f2(slotW)} height={f2(EDGE.SLOT / k)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
      ) : null}
    </g>
  );
};
