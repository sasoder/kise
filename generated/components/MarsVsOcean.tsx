import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";
import { camEase } from "./outgrowShared";
import { StoutStage, clamp01, lerp } from "./stoutShared";
import { ATMO, GRID, GlobeGrid, GlobeLines, LitGlobe, MVO_TEX, meridianLine, parallelLine, type GlobeLine, type GlobeView } from "./marsOceanShared";

// ---------------------------------------------------------------------------
// MarsVsOcean — Cheeky Pint S4E02 (Will O'Brien, Ulysses), sequence 00:00:00:19 -> 00:00:03:14.
// THE LINE: "[we've mapped more of the] surface of Mars than we have the depths of our ocean"
// CHECK LINE: "Mars, a whole planet, is completely mapped — while Earth, which is far bigger, has its oceans
//   (most of its surface) still unseen beneath the water."
// THE MOTION (round 3): one continuous pull-back. Tight on a lit Mars filling the frame, the amber survey graticule
//   (GRID: 10 deg, the ONE "mapped" material) races over it (meridians pole to pole, parallels west to east, short
//   hot heads) and closes by "Mars" (f11). From "than" the camera pulls back and travels down: Mars shrinks to the
//   top, fully gridded, and Earth rises in below, centred under it, at TRUE relative size (1.88 x), turned to the
//   Pacific; its land carries the same graticule (all land but small islands, clipped at coasts, a lower limb fade so
//   it holds at phone size), its ocean an ordinary blue surface. On "depths" (44 -> 60) the ocean sinks: basin
//   middles first, coasts last, into a heavy petrol volume that is darkest in the middle of the basin, with a teal
//   continental-shelf rim and faint marine snow sinking in it. From ~56 the camera pushes slowly in on the dark
//   Pacific (pivot = Earth's centre), still moving on the last frame, Mars whole in frame.
// CAMERA: Mars's screen position and ln k glide on one eased clock (f6-54, warp 0.8) + a push x1.22 about Earth's
//   centre (f50-100, eased; ~x1.09 by f78) + the house damped follower; measured |dv| max 2.20 px/f^2, v max
//   33.3 px/f; f56-78 min speed 1.8 px/f. At f60: Mars 451 px wide, 150 px gap, Earth 850 px; f78: Mars top y ~135.
// DURATION: 2.795 s x 23.976 = 67 frames + 12 hold frames of handle at the end = 79.
// ONSETS (f, Whisper, may run 3-6 f early): surface -2 · of 5 · Mars 11 · than 15 · we 30 · have 34 · the 39 ·
//   depths 44 · of 49 · our 52 · ocean 53-60.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 79; // 67 + 12 handle

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// THE WORLD = the final frame's screen px (camera k = 1 at rest). True ratio: Earth 6371 km / Mars 3389.5 km.
const RATIO = 6371 / 3389.5;
const MARS = { x: 540, y: 460, r: 226 };
const GAP = 150; // Mars's bottom to Earth's top, at rest
const EARTH = { x: 540, y: MARS.y + MARS.r + GAP + MARS.r * RATIO, r: MARS.r * RATIO };
const K0 = 2.89; // Mars 1306 px wide at the open

// --- camera: Mars's screen position and the zoom travel together on one eased clock, then the house follower
type Cam = { x: number; y: number; k: number };
const PRE = 40;
const PUSH = { f0: 50, f1: 100, k: 1.22 };
const targetAt = (f: number): Cam => {
  const e = camEase((f - 6) / (54 - 6), 0.8); // the pull-back, "than" -> "depths"
  const creep = lerp(1.035, 1, camEase((f + 24) / 40)); // the open is already easing back
  const kMain = Math.exp(lerp(Math.log(K0), 0, e)) * creep;
  const sxMain = lerp(540, MARS.x, e);
  const syMain = lerp(960, MARS.y, e);
  // the tail: a slow continuous push in toward the dark Pacific (Earth's centre is the pivot), still moving at the
  // last frame; Mars stays whole in frame
  const push = lerp(1, PUSH.k, camEase((f - PUSH.f0) / (PUSH.f1 - PUSH.f0)));
  const k = kMain * push;
  const px = sxMain + (EARTH.x - MARS.x) * kMain;
  const py = syMain + (EARTH.y - MARS.y) * kMain;
  const sx = px + (sxMain - px) * push;
  const sy = py + (syMain - py) * push;
  return { x: MARS.x - (sx - 540) / k, y: MARS.y - (sy - 960) / k, k };
};
const TRACK: Cam[] = (() => {
  const out: Cam[] = [];
  let c = targetAt(-PRE);
  let v = { x: 0, y: 0, k: 0 };
  for (let f = -PRE; f <= DURATION + 4; f++) {
    const t = targetAt(f);
    v = {
      x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
      y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
      k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
    };
    c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    if (f >= 0) out.push({ ...c });
  }
  return out;
})();
export const camAt = (f: number): Cam => {
  const a = Math.max(0, Math.min(TRACK.length - 2, Math.floor(f)));
  const t = clamp01(f - a);
  return { x: lerp(TRACK[a].x, TRACK[a + 1].x, t), y: lerp(TRACK[a].y, TRACK[a + 1].y, t), k: lerp(TRACK[a].k, TRACK[a + 1].k, t) };
};

// --- the globes' turn (slow, prograde: the surface moves left -> right)
const MARS_LON = (f: number) => -64 - 0.085 * f;
const MARS_LAT = 0; // both poles on the limb: the meridians converge there and fade (no polar cap in view)
const EARTH_LON = (f: number) => -155 - 0.05 * f; // the Pacific: the disc is mostly water
const EARTH_LAT = 10;
// "depths" (44) -> "ocean" (53-60): the ocean sinks from a surface into the murk, basin middles first
const SINK = { f0: 44, f1: 60 };

// --- the survey graticule (GRID: 10 deg, the one "mapped" material): meridians north -> south, staggered west ->
// east; parallels west -> east
const STEP = GRID.step;
const MER_DUR = 8; // pole to pole
const PAR_DUR = 16; // a full circle; the visible half in ~8 f
const lonW = MARS_LON(0) - 92; // the western limb at the open
const graticule = (f: number): GlobeLine[] => {
  const lines: GlobeLine[] = [];
  for (let lon = -180; lon < 180; lon += STEP) {
    let rel = (((lon - lonW) % 360) + 360) % 360;
    if (rel > 300) rel -= 360; // just west of the limb: turns into view later, drawn first
    const start = -7 + (Math.min(184, rel) / 184) * 10; // the far side finishes with the eastern limb
    lines.push({ pts: meridianLine(lon, 90, -90), p: (f - start) / MER_DUR });
  }
  for (let j = 0, lat = GRID.maxLat; lat >= -GRID.maxLat; lat -= STEP, j++) {
    const start = -6 + j * 0.3;
    lines.push({ pts: parallelLine(lat, lonW, lonW + 360), p: (f - start) / PAR_DUR });
  }
  return lines;
};

const MarsVsOcean: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const rest = camAt(0);
  const S = frame;
  const sw = { dx: 3 * Math.sin(S / 23), dy: 5 * Math.sin(S / 19) }; // StoutStage's house sway
  const scr = (x: number, y: number) => ({ x: 540 + (x - cam.x) * cam.k + sw.dx, y: 960 + (y - cam.y) * cam.k + sw.dy });
  const m = scr(MARS.x, MARS.y);
  const e = scr(EARTH.x, EARTH.y);
  const marsView: GlobeView = { cx: m.x, cy: m.y, r: MARS.r * cam.k, lon: MARS_LON(frame), lat: MARS_LAT };
  const earthR = EARTH.r * cam.k;
  const earthOn = e.y - earthR - 40 < 1920;
  const lineW = GRID.width(cam.k);
  const reveal = 1 - clamp01((frame - SINK.f0) / (SINK.f1 - SINK.f0));
  // the pool follows the subject: Mars, then the pair
  const pe = camEase((frame - 18) / 40);
  const pool = { x: lerp(MARS.x, (MARS.x + EARTH.x) / 2, pe), y: lerp(MARS.y, (MARS.y + EARTH.y) / 2, pe), strength: 1 };
  return (
    <AbsoluteFill>
      <StoutStage
        S={S}
        cam={cam}
        rest={rest}
        pool={pool}
        overlay={
          <>
            {earthOn ? (
              <LitGlobe
                texture={MVO_TEX.earth}
                cx={e.x}
                cy={e.y}
                r={earthR}
                lon={EARTH_LON(frame)}
                lat={EARTH_LAT}
                ocean={{ mask: MVO_TEX.earthOcean, time: frame, reveal, motes: 0.3 }}
                atmosphere={ATMO.earth}
                grade={{ exposure: 1.05, sat: 0.85, warm: 0.05, ambient: 0.05, limb: 0.12, highlight: 0.75 }}
              />
            ) : null}
            {earthOn ? (
              <GlobeGrid
                texture={MVO_TEX.earth}
                cx={e.x}
                cy={e.y}
                r={earthR}
                lon={EARTH_LON(frame)}
                lat={EARTH_LAT}
                ocean={{ mask: MVO_TEX.earthOcean }}
                landOnly
                limbFade={0.3}
                lineWidth={lineW}
              />
            ) : null}
            <LitGlobe
              texture={MVO_TEX.mars}
              cx={marsView.cx}
              cy={marsView.cy}
              r={marsView.r}
              lon={marsView.lon}
              lat={marsView.lat}
              atmosphere={ATMO.mars}
              grade={{ exposure: 1.18, sat: 0.95, warm: 0.03, ambient: 0.05, limb: 0.18, highlight: 0.5 }}
            />
            <GlobeLines view={marsView} lines={graticule(frame)} width={lineW} opacity={GRID.opacity} poleFade={GRID.poleFade} heads />
          </>
        }
      />
    </AbsoluteFill>
  );
};

export default MarsVsOcean;
