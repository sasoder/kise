import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Carrack,
  MapStack,
  PaperTop,
  SEA,
  SITES,
  WorldSvg,
  clamp01,
  makeCamera,
  makeTrack,
  pchip,
  screenOf,
  smootherstep,
  swayCam,
  type Cam,
  type P2,
} from "./cortesShared";
import { BORDER_SOCONUSCO_D, BORDER_OUTER_D, EMPIRE_T_D, EMPIRE_T_POLYS, ENCLAVES, EnemyBorder, EnemyHatch, TENOCH } from "./tlaxShared";
import { POSES, Warrior, type FigPose } from "./captureFigures";
import { lerpFig } from "./texcocoFigures";
import { idle } from "./texcocoShared";

// ---------------------------------------------------------------------------
// ArrivedAtTheDoorstep (20_ArrivedAtTheDoorstep.mov): Si Sheppard on Dwarkesh,
// clip "Capture, not kill". A MAP cut in Dwarkesh map style on the Cortes world
// (cortesShared.tsx) with the 1519 empire of tlaxShared.tsx.
//
// CHECK LINE: "The shore the Spaniards landed on was the edge of a huge empire
// armed to the teeth, not an empty coast."
//
// THE MOTION (one): three cream carracks sail west onto the anchorage off San
// Juan de Ulua and stop (f0-62; the camera only eases back while they close on
// the coast), then ONE damped camera move pulls back and glides inland
// (k 8.2 -> 3.96, never at rest). From f72 a crisp front out of Tenochtitlan
// raises the empire's real 1519 extent in orange hatch with a firm orange
// border; as it passes, 16 orange warriors (captureFigures Warrior: shield and
// macuahuitl) in staggered ranks are uncovered crouching and stand up facing
// the coast, and behind the front the hatch recedes to 0.35 so the men carry
// the orange. The front reaches the coast at the ships at ~f107; by "war."
// (f135) the whole empire stands armed.
//
// DURATION: sequence 20.896-27.152 s at 24000/1001 fps:
//   round(27.152 * 23.976) - round(20.896 * 23.976) = 651 - 501 = 150 frames.
// Words (local frames): conquistadors f30 · arrived f48 · doorsteps f76 ·
//   peace f98 · hippies f108 · anything f126 · war f135.
//
// COLOUR (clip rule): ORANGE = the Aztec side (the empire, its arms); CREAM =
// the outsiders (the ships). No labels: no place name is spoken.
//
// SOURCES: the empire is the georeferenced Commons "Aztec Empire 1519 map-fr"
// outline of tlaxMapData (smoothed, clipped to land); the landing place is
// SITES.sanJuanDeUlua. The glyphs are a symbolic density on an even lattice,
// not garrisons. Ships and glyphs live in world space (fixed world size).
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 150;
export const LAST = DURATION - 1;

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

export const T = {
  shipsStop: 62,
  front: 72, // the front leaves the capital (it enters the frame on "doorsteps")
  frontFar: 127, // its edge passes the main body's farthest border
  rise: 12, // frames a man takes to stand up
};

// -- the camera: one damped move, never at rest ------------------------------------------
const CAM_KEYS: { f: number; k: number; cx: number; cy: number }[] = [
  { f: 0, k: 8.2, cx: 217.6, cy: 882 },
  { f: 30, k: 7.85, cx: 212.5, cy: 882.5 },
  { f: 52, k: 7.58, cx: 207.5, cy: 883.2 },
  { f: 66, k: 7.1, cx: 197, cy: 884.8 },
  { f: 80, k: 6.1, cx: 170, cy: 889 },
  { f: 100, k: 4.95, cx: 126, cy: 902 },
  { f: 120, k: 4.22, cx: 95, cy: 913.2 },
  { f: 132, k: 4.07, cx: 86, cy: 917.4 },
  { f: LAST, k: 3.96, cx: 84, cy: 918.5 },
];
const CAM = makeCamera(CAM_KEYS.map((q) => ({ f: q.f, k: q.k, wx: q.cx, wy: q.cy, sx: 540, sy: 960 })));
export const camAt = (f: number): Cam => CAM(f);
export const camShown = (f: number): Cam => swayCam(camAt(f), f);

// -- the ships: world-sized cream carracks, sailing due west at constant speed ---------------
export const SHIP_W = 18; // world px (the glyph's 100-unit frame): 148 px at k 8.2, 71 px at k 3.96
const ULUA: P2 = [SITES.sanJuanDeUlua.x, SITES.sanJuanDeUlua.y];
/** the anchorage: the lead ship's bow ~5 world px off the island, the others astern in a wedge */
export const SHIP_REST: P2[] = [
  [ULUA[0] + 27, ULUA[1] - 14], // B, astern to the north (drawn first)
  [ULUA[0] + 15.4, ULUA[1] + 0.5], // A, the lead
  [ULUA[0] + 33, ULUA[1] + 8.5], // C, astern to the south
];
export const SHIP_TRAVEL = 48; // world px sailed inside the cut (~125 km)
const SAIL = makeTrack([[-40, T.shipsStop, 1, 0.26]], 0, -80, 200);
const SAIL_END = SAIL(T.shipsStop);
/** world px still to sail at frame f (0 from f62) */
export const shipRemaining = (f: number) => SHIP_TRAVEL * (1 - Math.min(SAIL(f), SAIL_END) / SAIL_END);
const SAIL_V0 = shipRemaining(10) - shipRemaining(11);
export const shipSpeed01 = (f: number) => clamp01((shipRemaining(f - 0.5) - shipRemaining(f + 0.5)) / SAIL_V0);
export const shipAt = (i: number, f: number): P2 => [SHIP_REST[i][0] + shipRemaining(f), SHIP_REST[i][1]];

// -- the empire -------------------------------------------------------------------------
const BORDERS_D = [
  BORDER_OUTER_D,
  BORDER_SOCONUSCO_D,
  ENCLAVES.tlaxcala.border,
  ENCLAVES.teotitlan.border,
  ENCLAVES.metztitlan.border,
  ENCLAVES.yopitzinco.border,
].join("");
const inRing = (r: P2[], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i];
    const b = r[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
};
const POLYS = EMPIRE_T_POLYS as P2[][][];
export const inEmpire = (x: number, y: number) => POLYS.some((p) => inRing(p[0], x, y) && !p.slice(1).some((h) => inRing(h, x, y)));
const mainPoly = POLYS.reduce((a, p) => (p[0].length > a[0].length ? p : a));
const D_MAIN = Math.max(...mainPoly[0].map((p) => Math.hypot(p[0] - TENOCH[0], p[1] - TENOCH[1])));

// the front: out of the capital at f76, its edge past the main body's far border at f127,
// then on at the same speed (Soconusco lies off frame)
const FRONT_R = pchip([
  [T.front, 0],
  [T.front + 5, 10],
  [T.frontFar, D_MAIN + 2],
]);
export const frontR = (f: number) => (f <= T.front ? 0 : FRONT_R(f));
/** the frame on which the front's edge reaches distance d from the capital */
export const frontFrameAt = (d: number) => {
  let lo = T.front;
  let hi = T.front + 400;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (frontR(mid) < d) lo = mid;
    else hi = mid;
  }
  return hi;
};
const FRONT_FEATHER_PX = 8; // screen px

// -- the warriors: captureFigures' Warrior (orange, shield + macuahuitl), 16 men in staggered
// ranks facing the coast: a brick lattice 28 x 29 world px whose phase seats the most of them
// inside the border (searched offline against EMPIRE_T_POLYS; their feet are re-checked below).
export const MAN_S = 0.106; // world px per figure unit: a man ~310 units = 32.9 world px (130 px at k 3.96)
const RANK_PTS: P2[] = [
  [40.8, 846.2],
  [68.8, 846.2],
  [124.8, 846.2],
  [26.8, 875.2],
  [138.8, 875.2],
  [12.8, 904.2],
  [40.8, 904.2],
  [68.8, 904.2],
  [152.8, 904.2],
  [26.8, 933.2],
  [54.8, 933.2],
  [82.8, 933.2],
  [166.8, 933.2],
  [194.8, 933.2],
  [68.8, 962.2],
  [124.8, 962.2],
];
for (const [x, y] of RANK_PTS) {
  for (const [dx, dy] of [
    [0, 0],
    [-6.5, -2],
    [6.5, -2],
  ])
    if (!inEmpire(x + dx, y + dy)) throw new Error(`glyph at ${x},${y} leaves the empire`);
}
export type Rank = { x: number; y: number; t0: number };
/** t0: the front passes its ground point (the middle of its base) */
export const RANKS: Rank[] = RANK_PTS.map(([x, y]) => ({ x, y, t0: frontFrameAt(Math.hypot(x - TENOCH[0], y - TENOCH[1])) }));

// he is uncovered crouching behind his shield as the front's line passes over him, then stands
const lowOf = (q: FigPose): FigPose => ({ ...q, lean: 34, crouch: 58, pitch: 6 });
const MAN_POSES = [POSES.clubLow(1), POSES.clubRaised(1)].map((up) => ({ up, low: lowOf(POSES.clubLow(1)) }));
const Man: React.FC<{ r: Rank; i: number; frame: number }> = ({ r, i, frame }) => {
  const { up, low } = MAN_POSES[i % 2];
  const pose = idle(lerpFig(low, up, riseOf(r, frame)), frame, i * 1.7 + 1);
  return <Warrior pose={pose} at={[r.x, r.y]} scale={MAN_S} uid={`doorMan${i}`} />;
};

export const riseOf = (r: Rank, f: number) => smootherstep((f - r.t0) / T.rise);

const MASK = { x: -90, y: 720, w: 470, h: 400 };
// behind the front the hatch recedes to HATCH_REST of its strength over HATCH_BAND world px
const HATCH_REST = 0.35;
const HATCH_BAND = 46;

const ArrivedAtTheDoorstep: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = camShown(frame);
  const R = frontR(frame);
  const fw = Math.min(FRONT_FEATHER_PX / cam.k, R * 0.9);
  const frontOn = R > 0.01;

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        {frontOn ? (
          <>
            <defs>
              <radialGradient id="doorFront" gradientUnits="userSpaceOnUse" cx={TENOCH[0]} cy={TENOCH[1]} r={R}>
                <stop offset={0} stopColor="#fff" />
                <stop offset={(R - fw) / R} stopColor="#fff" />
                <stop offset={1} stopColor="#000" />
              </radialGradient>
              <radialGradient id="doorBandG" gradientUnits="userSpaceOnUse" cx={TENOCH[0]} cy={TENOCH[1]} r={R}>
                <stop offset={0} stopColor="#000" />
                <stop offset={Math.max(0, (R - HATCH_BAND) / R)} stopColor="#000" />
                <stop offset={(R - fw) / R} stopColor="#fff" />
                <stop offset={1} stopColor="#000" />
              </radialGradient>
              <mask id="doorBand" maskUnits="userSpaceOnUse" x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h}>
                <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} fill="url(#doorBandG)" />
              </mask>
              <mask id="doorMask" maskUnits="userSpaceOnUse" x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h}>
                <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} fill="url(#doorFront)" />
              </mask>
            </defs>
            <g mask="url(#doorMask)">
              <EnemyHatch d={EMPIRE_T_D} cam={cam} opacity={HATCH_REST} />
            </g>
            <g mask="url(#doorBand)">
              <EnemyHatch d={EMPIRE_T_D} cam={cam} opacity={1 - HATCH_REST} />
            </g>
            <g mask="url(#doorMask)">
              <EnemyBorder d={BORDERS_D} cam={cam} width={3.2} />
              {RANKS.map((r, i) => (frame > r.t0 - 8 ? <Man key={`man${i}`} r={r} i={i} frame={frame} /> : null))}
            </g>
          </>
        ) : null}
        {SHIP_REST.map((_, i) => {
          const [x, y] = shipAt(i, frame);
          return <Carrack key={`sh${i}`} x={x} y={y} cam={cam} frame={frame} size={SHIP_W * cam.k} seed={11 + i * 7} wake={shipSpeed01(frame)} rock={1.2} />;
        })}
      </WorldSvg>
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

/** for checks: a ship's screen box centre at frame f */
export const shipScreen = (i: number, f: number) => screenOf(shipAt(i, f), camShown(f));

export default ArrivedAtTheDoorstep;
