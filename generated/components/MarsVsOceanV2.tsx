import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";
import { camEase } from "./outgrowShared";
import { StoutStage, clamp01, lerp, mixHex, smoothstep } from "./stoutShared";
import {
  AMBER,
  ATMO,
  GRID_OUTLINE,
  GRID,
  GRID_BLOOM,
  GlobeLines,
  LitGlobe,
  MVO_TEX,
  globeBasis,
  meridianLine,
  parallelLine,
  type GlobeLine,
  type GlobeView,
} from "./marsOceanSharedV2";
import { MERID, NET_SAMPLE, NET_STEP, PAR } from "./marsOceanV2Net";

// ---------------------------------------------------------------------------
// MarsVsOceanV2 — improvement loop copy of MarsVsOcean (delivered v1 stays untouched). Cheeky Pint S4E02 (Will O'Brien, Ulysses), sequence 00:00:00:19 -> 00:00:03:14.
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

// THE WORLD = the resolved two-body frame's screen px (camera k = 1). True ratio: Earth 6371 km / Mars 3389.5 km.
const RATIO = 6371 / 3389.5;
const MARS = { x: 540, y: 300, r: 190 }; // 380 px wide, top at y 110
const GAP = 120; // Mars's bottom to Earth's top (Earth's centre lands at y ~967, the ocean above the captions)
const EARTH = { x: 540, y: MARS.y + MARS.r + GAP + MARS.r * RATIO, r: MARS.r * RATIO };
const K0 = 2.98; // Mars ~1130 px wide once the open's push-in lands
const OPEN_Y = 1085; // Mars's centre at the open, a touch low so Earth's limb stays below the frame

// --- THE CAMERA: a gentle push-in on Mars (f0-14), then the pull-back down to the pair ("than" -> "depths"),
//   all on one target + the house damped follower. The dive into the Pacific is the DOLLY below (Earth only, with
//   Mars further off: parallax), so Mars stays whole at the top as the yardstick.
type Cam = { x: number; y: number; k: number };
const PRE = 40;
const OPEN_PUSH = { from: 0.93, f0: -2, f1: 18 };
const targetAt = (f: number): Cam => {
  const e = camEase((f - 8) / (48 - 8), 0.8); // the pull-back
  const push = Math.exp(lerp(Math.log(OPEN_PUSH.from), 0, camEase((f - OPEN_PUSH.f0) / (OPEN_PUSH.f1 - OPEN_PUSH.f0))));
  const k = Math.exp(lerp(Math.log(K0), 0, e)) * push;
  const sx = 540;
  const sy = lerp(OPEN_Y, MARS.y, e);
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
// THE DOLLY ("depths" -> the end): about the camera axis at screen y axisY; Earth scales by D, Mars (further off)
// by D^marsParallax; still moving on the last frame.
const DOLLY = { f0: 40, f1: 92, to: 1.38, axisY: 424, marsParallax: 0.28, warp: 0.8 };
const DOLLY_TRACK: number[] = (() => {
  const out: number[] = [];
  let c = 1;
  let vel = 0;
  for (let f = -PRE; f <= DURATION + 4; f++) {
    const t = lerp(1, DOLLY.to, camEase((f - DOLLY.f0) / (DOLLY.f1 - DOLLY.f0), DOLLY.warp));
    vel = vel + (t - c) * CAM_STIFF - vel * CAM_DAMP;
    c += vel;
    if (f >= 0) out.push(c);
  }
  return out;
})();
export const dollyAt = (f: number) => DOLLY_TRACK[Math.max(0, Math.min(DOLLY_TRACK.length - 1, Math.round(f)))];

// --- the globes' turn (slow, prograde: the surface moves left -> right)
const MARS_LON = (f: number) => -64 - 0.085 * f;
const MARS_LAT = -8; // a little from the south: parallels curve; the south pole sits right at the limb
const MARS_ROLL = -10; // the axis leans a touch
const EARTH_LON = (f: number) => -155 - 0.05 * f; // the Pacific: the disc is mostly water
const EARTH_LAT = 10;
// THE EARTH NET. "we have" (30-40): the same net sweeps over Earth (a front from the north, constant speed).
// "depths" (44): the ocean's lines lose the surface and sink (basin middles first); the water deepens to the
// murk 2 f behind them (cause before effect), full dark by ~58; the last fragments still drift down at the end.
// The front is a LATITUDE sweeping north -> south (a curve on the sphere, constant speed): meridians draw down
// with it, and each parallel draws out both ways from the view's centre longitude once the front reaches it.
// THE LAND SWEEP (as on Mars: meridians draw north -> south, parallels west -> east, staggered west -> east): a place
// (lon, lat) is drawn at tDraw = SWEEP.t0 + dtLon * rel(lon - lon0) + dtLat * (90 - lat) (rel in -60..184 deg from
// the western limb); the land grid lands by ~f41, and the land's texture sharpens + takes its colour behind the
// same front over SWEEP.soft frames (the shader's KNOWN uses the identical formula).
const SWEEP = (() => {
  const A = 5.5; // frames across the visible land's longitude span (~130 deg from rel 20)
  const B = 5; // frames down its latitude span (~115 deg from 75 N)
  const dtLon = A / 130;
  const dtLat = B / 115;
  const T0 = 30.5; // the first land (Kamchatka / the Arctic coast) on "we have"
  return { lon0: -155 - 0.05 * 30 - 90, dtLon, dtLat, t0: T0 - dtLon * 20 - dtLat * 15, soft: 7, head: 1.1 };
})();
const sweepRel = (lon: number) => ((((lon - SWEEP.lon0 + 60) % 360) + 360) % 360) - 60;
const tDraw = (lon: number, lat: number) => SWEEP.t0 + SWEEP.dtLon * Math.max(-60, Math.min(184, sweepRel(lon))) + SWEEP.dtLat * (90 - lat);
// Earth's meridians fade out well before the pole: no starburst on the polar cap
const EARTH_POLE = { full: 56, gone: 74 };
// Over water the net never draws: every line stops dead at the shore, capped by a tiny bright tick ("stopped here").
// "depths" (44): the camera falls toward the water (a dolly, damped; Mars is further away so it moves less);
// the seafloor recedes in two steps, the second landing on "ocean" (53-59).
// the seafloor recedes as the camera dives: a first step on "depths", a second landing on "ocean"
// (the floor also keeps drifting deeper to the end: DEPTH_TAIL)
const DEPTH = [
  { f0: 44, f1: 51, to: 0.45 },
  { f0: 53, f1: 59, to: 0.85 },
];
const DEPTH_TAIL = { f0: 58, f1: 100, to: 1 };
const depthAt = (f: number) =>
  lerp(DEPTH.reduce((d, st) => lerp(d, st.to, smoothstep((f - st.f0) / (st.f1 - st.f0))), 0), DEPTH_TAIL.to, smoothstep((f - DEPTH_TAIL.f0) / (DEPTH_TAIL.f1 - DEPTH_TAIL.f0)));
// the deep water on the globe: a petrol close in value to the brown ground, still water (gloss + dim floor)
const DEEP = { shelf: "#1C3A42", deep: "#10232A", coast: "#24505A" };
// KNOWN: the surface is soft until the net's front passes, then crisp (Mars on its meridians' draw, Earth's land on
// the latitude front)
const SHARP = { soft: 3, blur: 3.7, lag: 0.5 };

// --- the survey graticule (GRID: 10 deg, the one "mapped" material): meridians north -> south, staggered west ->
// east; parallels west -> east
const STEP = GRID.step;
const MER_DUR = 6; // pole to pole
const PAR_DUR = 14; // a full circle; the visible half in ~7 f
const lonW = MARS_LON(0) - 95; // the western limb at the open
const graticule = (f: number): GlobeLine[] => {
  const lines: GlobeLine[] = [];
  for (let lon = -180; lon < 180; lon += STEP) {
    let rel = (((lon - lonW) % 360) + 360) % 360;
    if (rel > 300) rel -= 360; // just west of the limb: turns into view later, drawn first
    const start = -1.5 + (Math.min(184, rel) / 184) * 5; // just beginning at f0, west -> east; done by f11
    lines.push({ pts: meridianLine(lon, 90, -90), p: (f - start) / MER_DUR });
  }
  for (let j = 0, lat = GRID.maxLat; lat >= -GRID.maxLat; lat -= STEP, j++) {
    const start = -2.5 + j * 0.2; // the first lines are just emerging over the western limb at f0
    lines.push({ pts: parallelLine(lat, lonW, lonW + 360), p: (f - start) / PAR_DUR });
  }
  return lines;
};

// --- the Earth net: baked land/ocean per 0.5-deg sample (marsOceanV2Net.ts) ---------------------------------
type NetLine = { P: number[][]; lat: number[]; cls: number[]; id: number; mer: boolean };
const D2R = Math.PI / 180;
const unit = (lon: number, lat: number) => [Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)];
const parseCls = (str: string) => [...str].map((c) => (c === "#" ? -1 : (Number(c) + 0.5) / 10));
const NET: NetLine[] = [
  ...MERID.map((str, i) => {
    const lon = -180 + NET_STEP * i;
    const lat = [...str].map((_, j) => 90 - j * NET_SAMPLE);
    return { P: lat.map((la) => unit(lon, la)), lat, cls: parseCls(str), id: i, mer: true };
  }),
  ...PAR.map((str, i) => {
    const la = -80 + NET_STEP * i;
    const lons = [...str].map((_, j) => -180 + j * NET_SAMPLE);
    return { P: lons.map((lo) => unit(lo, la)), lat: lons.map(() => la), cls: parseCls(str), id: 100 + i, mer: false };
  }),
];
const LIMB_BINS = 8;
const HEAD = mixHex(AMBER.top, AMBER.hot, 0.45); // the scanner's tip: a hotter amber, never white
const COAST_FADE = 3; // samples (1.5 deg): a line fades out over its last stretch of land before the shore
type NetFrame = { surf: string[]; heads: string };
// per line, each sample's distance (in samples) to the nearest water sample along the line
const SHORE: number[][] = NET.map((ln) => {
  const n = ln.cls.length;
  const d: number[] = ln.cls.map((c) => (c >= 0 ? 0 : 1e9));
  for (let i = 1; i < n; i++) d[i] = Math.min(d[i], d[i - 1] + 1);
  for (let i = n - 2; i >= 0; i--) d[i] = Math.min(d[i], d[i + 1] + 1);
  return d;
});
/** One frame of the Earth net: LAND ONLY, in limb bins; the drawing front's heads; a short cap across each line where it
 *  meets the shore (screen px). Nothing is ever drawn over water. */
const earthNet = (v: GlobeView, f: number): NetFrame => {
  const M = globeBasis(v);
  const out: NetFrame = { surf: Array(LIMB_BINS).fill(""), heads: "" };
  if (f < SWEEP.t0 - 1) return out;
  const q = (x: number) => (Math.round(x * 100) / 100).toString();
  const lf = GRID.limbFade;
  const X = (n: number[]) => v.cx + v.r * n[0];
  const Y = (n: number[]) => v.cy - v.r * n[1];
  NET.forEach((ln, li) => {
    if (!ln.mer && Math.abs(ln.lat[0]) > 75) return; // no ring round the poles on Earth
    const N = ln.P.map((P) => [
      M[0][0] * P[0] + M[1][0] * P[1] + M[2][0] * P[2],
      M[0][1] * P[0] + M[1][1] * P[1] + M[2][1] * P[2],
      M[0][2] * P[0] + M[1][2] * P[1] + M[2][2] * P[2],
    ]);
    const drawn = (i: number) => {
      const latS = (ln.lat[i] + ln.lat[i + 1]) / 2;
      const lonS = ln.mer ? -180 + NET_STEP * ln.id : -180 + (i + 0.5) * NET_SAMPLE;
      const t = tDraw(lonS, latS);
      return { ok: f >= t, head: f - t < SWEEP.head };
    };
    for (let i = 0; i < N.length - 1; i++) {
      const land = ln.cls[i] < 0 && ln.cls[i + 1] < 0;
      if (!land) continue; // never over water
      let a = N[i];
      let b = N[i + 1];
      if (a[2] <= 0 && b[2] <= 0) continue;
      if (a[2] < 0 || b[2] < 0) {
        const s2 = a[2] / (a[2] - b[2]);
        const c = [a[0] + (b[0] - a[0]) * s2, a[1] + (b[1] - a[1]) * s2, 0];
        if (a[2] < 0) a = c;
        else b = c;
      }
      const d = drawn(i);
      if (!d.ok) continue;
      const z = (a[2] + b[2]) / 2;
      const latM = Math.abs((ln.lat[i] + ln.lat[i + 1]) / 2);
      const poleW = ln.mer ? smoothstep((EARTH_POLE.gone - latM) / (EARTH_POLE.gone - EARTH_POLE.full)) : 1;
      const shore = Math.min(1, (Math.min(SHORE[li][i], SHORE[li][i + 1]) - 0.5) / COAST_FADE + 0.15);
      const w = (1 - lf + lf * Math.pow(Math.max(0, z), 0.4)) * poleW * shore * smoothstep((z - 0.17) / 0.17); // muted within ~12 deg of the limb: no amber crescents on the edge
      if (w <= 0.02) continue;
      const seg = `M${q(X(a))} ${q(Y(a))}L${q(X(b))} ${q(Y(b))}`;
      if (d.head && poleW >= 0.6 && w > 0.5) out.heads += seg;
      else out.surf[Math.min(LIMB_BINS - 1, Math.floor(w * LIMB_BINS))] += seg;
    }
  });
  return out;
};

const EarthNet: React.FC<{ view: GlobeView; frame: number; width: number }> = ({ view, frame, width }) => {
  const net = earthNet(view, frame);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: GRID_BLOOM }}>
      {/* the dark outline follows each line's own weight (a faded line carries a faded outline) */}
      {net.surf.map((d, i) =>
        d ? <path key={`o${i}`} d={d} fill="none" stroke={GRID_OUTLINE.color} strokeOpacity={GRID_OUTLINE.opacity * ((i + 0.5) / LIMB_BINS)} strokeWidth={width + GRID_OUTLINE.extra} strokeLinecap="round" /> : null,
      )}
      {net.heads ? <path d={net.heads} fill="none" stroke={GRID_OUTLINE.color} strokeOpacity={GRID_OUTLINE.opacity} strokeWidth={width + GRID_OUTLINE.extra} strokeLinecap="round" /> : null}
      <g fill="none" stroke={AMBER.top} strokeWidth={width} strokeLinecap="round">
        {net.surf.map((d, i) => (d ? <path key={i} d={d} strokeOpacity={GRID.opacity * ((i + 0.5) / LIMB_BINS)} /> : null))}
      </g>
      {net.heads ? <path d={net.heads} fill="none" stroke={HEAD} strokeWidth={width * 1.15} strokeLinecap="round" strokeOpacity={0.9} /> : null}
    </svg>
  );
};

const MarsVsOceanV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const rest = camAt(0);
  const S = frame;
  const sw = { dx: 3 * Math.sin(S / 23), dy: 5 * Math.sin(S / 19) }; // StoutStage's house sway
  const scr = (x: number, y: number) => ({ x: 540 + (x - cam.x) * cam.k + sw.dx, y: 960 + (y - cam.y) * cam.k + sw.dy });
  // the dolly: each body scales about the camera axis by its own factor (Mars is further off: parallax)
  const D = dollyAt(frame);
  const Dm = Math.pow(D, DOLLY.marsParallax);
  const dolly = (p: { x: number; y: number }, k: number) => ({ x: 540 + (p.x - 540) * k, y: DOLLY.axisY + (p.y - DOLLY.axisY) * k });
  const m = dolly(scr(MARS.x, MARS.y), Dm);
  const e = dolly(scr(EARTH.x, EARTH.y), D);
  const marsView: GlobeView = { cx: m.x, cy: m.y, r: MARS.r * cam.k * Dm, lon: MARS_LON(frame), lat: MARS_LAT, roll: MARS_ROLL };
  const marsOn = true;
  const earthR = EARTH.r * cam.k * D;
  const earthView: GlobeView = { cx: e.x, cy: e.y, r: earthR, lon: EARTH_LON(frame), lat: EARTH_LAT };
  const earthOn = e.y - earthR - 40 < 1920;
  const lineW = GRID.width(cam.k);
  // the pool follows the subject: Mars, then the pair
  const pe = camEase((frame - 18) / 40);
  const pool = { x: 540, y: lerp(MARS.y, (MARS.y + EARTH.y) / 2, pe), strength: 1 };
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
                ocean={{
                  mask: MVO_TEX.earthOcean,
                  land: MVO_TEX.earthGridLand,
                  shelf: DEEP.shelf, // the floor's highs, seen through the water
                  deep: DEEP.deep,
                  coast: DEEP.coast,
                  water: {
                    floor: MVO_TEX.earthFloor,
                    depth: depthAt(frame),
                    time: frame,
                    sheen: 0.2,
                    tracks: MVO_TEX.earthTracks,
                    trackStrength: 0.07,
                  },
                }}
                known={{ t0: SWEEP.t0 - 1, lon0: SWEEP.lon0, dtLon: SWEEP.dtLon, dtLat: SWEEP.dtLat, frame, soft: SWEEP.soft, blur: SHARP.blur }}
                atmosphere={{ ...ATMO.earth, strength: 0.28 }}
                grade={{ exposure: 1.05, sat: 0.85, warm: 0.05, ambient: 0.05, limb: 0.12, highlight: 1.6, wrap: 0.3 }}
              />
            ) : null}
            {earthOn ? <EarthNet view={earthView} frame={frame} width={lineW} /> : null}
            {marsOn ? (
              <>
            <LitGlobe
                texture={MVO_TEX.mars}
                cx={marsView.cx}
                cy={marsView.cy}
                r={marsView.r}
                lon={marsView.lon}
                lat={marsView.lat}
                roll={marsView.roll}
                known={{ t0: -1.5 + SHARP.lag, lon0: lonW, dtLon: 5 / 184, dtLat: MER_DUR / 180, frame, soft: SHARP.soft, blur: SHARP.blur }}
                atmosphere={ATMO.mars}
                grade={{ exposure: 1.18, sat: 0.95, warm: 0.03, ambient: 0.05, limb: 0.18, highlight: 0.5 }}
              />
              <GlobeLines view={marsView} lines={graticule(frame)} width={lineW} opacity={GRID.opacity} poleFade={GRID.poleFade} heads headColor={HEAD} outline />
              </>
            ) : null}
          </>
        }
      />
    </AbsoluteFill>
  );
};

export default MarsVsOceanV2;
