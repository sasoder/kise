// ---------------------------------------------------------------------------------------------------------------
// StormMovingIn (scott-weather-fired, cut 15 "15_StormMovingIn"). Cheeky Pint style, the realistic "at sea" variant
// carried into the air (styles/cheeky-pint.md § Realistic ocean variant; the shared world denverWorld.tsx, read-only).
// Opaque 1080x1920, 23.976 fps, 85 frames.
//
// CHECK LINE: "a storm west of Denver's airport is heading straight for it, lightning hits inside the ring, and the
// airport closes — fair enough."
//
// THE LINE: "[if a] storm is moving from the west to the east, and it happens west to the airport,"
// (then on camera: "you should probably close it.")
// WORD -> FRAME: storm 7 · is 13 · moving 18 · from 25 · (From 34) · the 35 · west 39 · to 43 · the 46 · east 48 ·
//                and 49 · it 58 · happens 60 · west 67 · to 72 · the 75 · airport 77
// DURATION: slot 15.849 -> 19.394 s = 3.545 s x 23.976 = 85 frames (f0..f84).
//
// THE MOTION: cut 2's ring view (DEN_CAM_RING x1.08, target 0.35 mi E / 0.5 mi S; ring ~870 px wide, a clear cream
// line), the real airfield inside it, the ramp busy. ONE mature thunderstorm (size 0.72: dark slate base and rain to
// the ground, sunlit upper turrets, world round 6) enters from the left edge, 7.5 mi west and 4.4 mi north of the
// terminal at f0 with its trailing part off frame, and sails toward the airport (bearing ~112) at a constant
// 0.065 mi/f (a timelapse): its leading edge travels ~365 px and it grows as it comes. It boils the whole way
// (world storm life at boil 1.5, the maximum: turrets rising and rolling, a churning base, a streaming anvil) and
// lights from inside three times (in-cloud flickers f14, f32, f50; none near the strike). Its dark ground shadow
// and rain lead it onto the ring's north-west part. The camera only creeps.
// DIRECTION CUE (cut 4 imports it): a soft cream arrow on the ground ahead of the storm, along its drift, its tip at
// the ring, wiped out from its tail f6 -> f18 ("moving"); the storm's shadow and rain roll over it and it drains into
// the ground after the strike (f66-f80). "W" and "E" slide up just inside the ring's west and east points, landed on
// "west" f39 and "east" f48 (FONT_LABEL 48 px, halo).
// On "it happens west" one bolt leaves the storm's leading side (out of the low body, ~240 px tall at full res) and
// strikes the ground INSIDE the ring's north-west edge: strike start f61, CONTACT f64 (= the first reaction frame:
// the ground glow, the cell's base lit from inside, the amber starting out of the strike's bearing). The closure
// spreads both ways round the ring (cut 2's construction) and closes on the east side at f78 ("airport" f77); the
// ramp vehicles slow from f64 and stand still by f78. f78 -> f84: the storm arrives over the ring's north-west, the
// ring AMBER (closed): a settled, living frame.
// AMBER = the weather's reach: the bolt, the ground strike, the closed ring. Nothing else is amber. No text.
//
// EXPORTS FOR CUT 4 (StormMovingAway, the mirror; never rename): STORM_IN_S0 (story clock at f0), STORM_IN_CAM_START,
// STORM_IN_CAM_GLIDES, STORM_IN_CAM (.at(f)), STORM_IN_CAM_END, STORM_IN_LOOK (the cell's seed / size / anvilDir /
// growth), STORM_IN_DRIFT (miles / frame), STORM_IN_CELL_F0 (ground position at f0), stormInCellAt(f),
// STORM_IN_STRIKE (start / contact / spread end / ground point / seed / bolt origin offset), STORM_IN_RAMP
// (the ramp's stop window), rampInActive(f).
//
// SOURCES: DEN layout per denverAirfield.ts (LAYOUT_SOURCE); the 3-mile ramp-closure radius is the speaker's (the
// clip's earlier line). No figures on screen.
// ---------------------------------------------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import {
  AirStage,
  CLOUD,
  DEN_CAM_RING,
  LightningStrike,
  RING_MI,
  TERMINAL,
  STRIKE,
  ThreeMileRing,
  cellPos,
  flickerAt,
  projectLine,
  projectPoly,
  WorldLabel,
  fogAt,
  fogRgb,
  hash01,
  rgbCss,
  type DenView,
  clamp01,
  makeDenClock,
  makeView,
  rampTravelAt,
  smooth,
  strikeGlow,
  type DenCam,
  type DenGlide,
  type StormSpec,
  type StormState,
} from "./denverWorld";

export const FPS = 24000 / 1001;
export const DURATION = 85;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ===================================================================================================================
// THE SHARED CONSTANTS (cut 4 imports these; never rename)
// ===================================================================================================================
/** Story clock at this cut's f0: the sequence frame of 15.849 s (380) minus cut 1's in (2.252 s = frame 54). */
export const STORM_IN_S0 = 326;

/** The camera at f0: cut 2's ring framing (LightningThreeMiles CUT2_CAM_GOAL: DEN_CAM_RING pulled back x1.08, the
 *  target 0.35 mi east and 0.5 mi south; ring ~870 px wide, clear of the caption band), so cuts 2-4 share one view.
 *  Restated from DEN_CAM_RING rather than imported: importing another builder's cut file couples this render to their
 *  in-progress edits. */
export const STORM_IN_CAM_START: DenCam = { ...DEN_CAM_RING, tx: DEN_CAM_RING.tx + 0.35, ty: DEN_CAM_RING.ty - 0.5, dist: DEN_CAM_RING.dist * 1.08 };
/** The camera stays calm: one slight creep east with the storm and a touch of push-in, pre-rolled (f0 already moving),
 *  so the storm's own travel against the ring is what reads. */
export const STORM_IN_CAM_GLIDES: DenGlide[] = [{ f0: -40, f1: 150, dtx: 0.18, dist: DEN_CAM_RING.dist * 1.08 * 0.96 }];
export const STORM_IN_CAM = makeDenClock(STORM_IN_CAM_START, STORM_IN_CAM_GLIDES, DURATION + 20, 60);
export const STORM_IN_CAM_END: DenCam = STORM_IN_CAM.at(DURATION - 1);

/** The one storm: a mature cumulonimbus, anvil sheared east (downwind). */
export const STORM_IN_LOOK = { id: "IN", seed: 23, size: 0.72, anvilDir: 84, growth: 1, shadowStrength: 1.3, rainStrength: 1.4, boil: 1.5 } as const;
/** Its drift (miles per frame): a timelapse of the westerlies, constant speed, from the west-north-west toward the
 *  airport (bearing ~112; on screen left -> right and a little toward the camera). */
export const STORM_IN_DRIFT = { vx: 0.06, vy: -0.024 } as const;
/** Its ground position at f0 (miles from the terminal): 7.5 mi west, 4.4 mi north, its trailing part off the left
 *  edge, its sunlit upper turrets in frame. */
export const STORM_IN_CELL_F0 = { x: -7.5, y: 4.4 } as const;
/** The spec on the world's story clock (cellPos(spec, S) = the ground position at S). */
export const STORM_IN_CELL: StormSpec = {
  id: STORM_IN_LOOK.id,
  seed: STORM_IN_LOOK.seed,
  size: STORM_IN_LOOK.size,
  anvilDir: STORM_IN_LOOK.anvilDir,
  vx: STORM_IN_DRIFT.vx,
  vy: STORM_IN_DRIFT.vy,
  x: STORM_IN_CELL_F0.x - STORM_IN_DRIFT.vx * STORM_IN_S0,
  y: STORM_IN_CELL_F0.y - STORM_IN_DRIFT.vy * STORM_IN_S0,
};

/** The strike: start f61, contact f64 (STRIKE.contact = 3), the amber closes round the ring by f78. The bolt leaves
 *  the storm's leading (east) side, `fromOffset` miles from the cell's centre, out of the low body at `baseZ` miles
 *  (above the flat base, so the bolt is ~230 px tall at full res), and hits `to`, inside the ring's west-north-west
 *  edge (bearing ~305 from the terminal, 2.7 mi out, toward the storm). */
export const STORM_IN_STRIKE = {
  start: 61,
  contact: 61 + STRIKE.contact,
  spreadEnd: 78,
  to: { x: -2.21, y: 1.55 },
  fromOffset: { x: 0.85, y: -0.6 },
  baseZ: CLOUD.baseZ * STORM_IN_LOOK.size * 1.9,
  seed: 5,
} as const;
/** bearing of the strike point from the terminal (degrees clockwise from north) */
export const STORM_IN_STRIKE_BEARING = (Math.atan2(STORM_IN_STRIKE.to.x, STORM_IN_STRIKE.to.y) * 180) / Math.PI + 360;

/** The ramp: busy until contact, stopped by the time the ring is closed. */
export const STORM_IN_RAMP = { f0: STORM_IN_STRIKE.contact, f1: STORM_IN_STRIKE.spreadEnd } as const;
export const rampInActive = (f: number) => 1 - smooth(STORM_IN_RAMP.f0, STORM_IN_RAMP.f1, f);

/** In-cloud lightning (cut frames): three soft events spaced across the cut, none within 6 frames of the strike
 *  (f61-f64), and none over the closing amber at the end. */
export const STORM_IN_FLICKERS = [14, 32, 50];

// ---- the direction cue (cuts 3 and 4 share it: import STORM_IN_ARROW / StormDriftArrow / STORM_IN_COMPASS /
// CompassLetters / CreamRing) -------------------------------------------------------------------------------------------
/** The drift arrow: one soft cream arrow on the ground ahead of the storm, along its drift, pointing at the airport.
 *  World miles; drawn out from its tail by a moving wipe over `draw` (cut frames, landed by "moving" f18). It stays
 *  where it is (a fixed mark the storm sails over: the storm's shadow and rain take it as they pass). */
export const STORM_IN_ARROW = {
  tail: { x: -4.6, y: 3.1 },
  /** unit direction (= the drift's direction) and length, miles */
  dir: (() => {
    const l = Math.hypot(0.06, -0.024);
    return { x: 0.06 / l, y: -0.024 / l };
  })(),
  len: 2.3,
  shaft: 0.22,
  headW: 0.72,
  headLen: 0.62,
  draw: { f0: 6, f1: 18 },
  /** spent once the strike has landed: it drains into the ground under the storm's shadow (cut frames) */
  drain: { f0: 66, f1: 80 },
  opacity: 0.9,
} as const;
type Pt = { x: number; y: number };
/** Clip a convex-or-not polygon (arrow-local u along the axis) to u <= uMax (Sutherland-Hodgman, one edge). */
const clipU = (poly: [number, number][], uMax: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ina = a[0] <= uMax;
    const inb = b[0] <= uMax;
    if (ina) out.push(a);
    if (ina !== inb) {
      const t = (uMax - a[0]) / (b[0] - a[0]);
      out.push([uMax, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
};
export const StormDriftArrow: React.FC<{ v: DenView; tail: Pt; dir: Pt; len: number; shaft: number; headW: number; headLen: number; draw: number; opacity?: number; drain?: unknown }> = ({
  v,
  tail,
  dir,
  len,
  shaft,
  headW,
  headLen,
  draw,
  opacity = 0.9,
}) => {
  const d = clamp01(draw);
  if (d <= 0.001 || opacity <= 0.001) return null;
  const sl = len - headLen;
  // arrow-local outline (u along, w across), a slightly rounded tail
  const local: [number, number][] = [
    [0, -shaft / 2],
    [sl, -shaft / 2],
    [sl, -headW / 2],
    [len, 0],
    [sl, headW / 2],
    [sl, shaft / 2],
    [0, shaft / 2],
  ];
  const poly = clipU(local, len * d);
  if (poly.length < 3) return null;
  const nx = -dir.y;
  const ny = dir.x;
  const pts = projectPoly(
    v,
    poly.map(([u, w]) => [tail.x + dir.x * u + nx * w, tail.y + dir.y * u + ny * w, 0] as [number, number, number]),
  );
  if (pts.length < 3) return null;
  const dPath = `M${pts.map((q) => `${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join("L")}Z`;
  return (
    <g>
      <path d={dPath} fill={COLOR.shadow} opacity={(0.35 * opacity).toFixed(3)} transform="translate(1.5 3)" style={{ filter: "blur(3px)" }} />
      <path d={dPath} fill={COLOR.cream} opacity={opacity.toFixed(3)} style={{ filter: "blur(0.6px)" }} />
    </g>
  );
};

/** Compass letters "W" and "E" on the ground just inside the ring's west and east points, FONT_LABEL at 48 px, sliding
 *  up (WorldLabel's stout entrance) and landed on "west" (f39) and "east" (f48). */
export const STORM_IN_COMPASS = {
  r: 2.45,
  px: 48,
  halo: 1,
  W: { f0: 31, f1: 39 },
  E: { f0: 40, f1: 48 },
} as const;
export const CompassLetters: React.FC<{ v: DenView; w: number; e: number; r?: number; px?: number; halo?: number }> = ({
  v,
  w,
  e,
  r = STORM_IN_COMPASS.r,
  px = STORM_IN_COMPASS.px,
  halo = STORM_IN_COMPASS.halo,
}) => (
  <>
    {w > 0 ? <WorldLabel v={v} x={TERMINAL.x - r} y={TERMINAL.y} text="W" enter={w} px={px} dy={px * 0.35} halo={halo} /> : null}
    {e > 0 ? <WorldLabel v={v} x={TERMINAL.x + r} y={TERMINAL.y} text="E" enter={e} px={px} dy={px * 0.35} halo={halo} /> : null}
  </>
);

/** The ring before it lights, made clearer than the world's 2 px hairline so it reads at 270 px: a 3.6 px cream line
 *  on a soft brown underlay (still thinner than the lit amber band). Draw it under the world ring. */
export const STORM_IN_RING_LINE = { width: 3.6, under: 7, underOpacity: 0.28 } as const;
export const CreamRing: React.FC<{ v: DenView; opacity?: number }> = ({ v, opacity = 1 }) => {
  if (opacity <= 0.001) return null;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    pts.push([TERMINAL.x + Math.sin(a) * RING_MI, TERMINAL.y + Math.cos(a) * RING_MI, 0]);
  }
  const runs = projectLine(v, pts);
  const d = runs.map((r) => `M${r.map((q) => `${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join("L")}`).join("");
  return (
    <g opacity={opacity.toFixed(3)}>
      <path d={d} fill="none" stroke={COLOR.shadow} strokeWidth={STORM_IN_RING_LINE.under} opacity={STORM_IN_RING_LINE.underOpacity} style={{ filter: "blur(2.5px)" }} />
      <path d={d} fill="none" stroke={COLOR.cream} strokeWidth={STORM_IN_RING_LINE.width} strokeLinecap="round" opacity={0.95} />
    </g>
  );
};

/** The storm's state at this cut's frame f (glow = the strike's light inside its base). */
export const stormInCellAt = (f: number): StormState => ({
  ...STORM_IN_CELL,
  growth: STORM_IN_LOOK.growth,
  shadowStrength: STORM_IN_LOOK.shadowStrength,
  rainStrength: STORM_IN_LOOK.rainStrength,
  boil: STORM_IN_LOOK.boil,
  glow: strikeGlow(f - STORM_IN_STRIKE.start),
  flicker: flickerAt(f, STORM_IN_FLICKERS),
});

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
/** The closure: amber spreading both ways round the ring from the strike's bearing (cut 2's construction: one lit arc
 *  from the counter-clockwise front, drawn clockwise through the strike to the clockwise front). Already started on the
 *  contact frame (the first reaction), fast out of the strike, decelerating into the meeting in the east at spreadEnd. */
export const stormInSpreadAt = (f: number) => {
  if (f < STORM_IN_STRIKE.contact) return 0;
  const u = clamp01((f - STORM_IN_STRIKE.contact + 1) / (STORM_IN_STRIKE.spreadEnd - STORM_IN_STRIKE.contact + 1));
  return Math.sin((u * Math.PI) / 2);
};
const ringPoint = (bearing: number) => {
  const a = (bearing * Math.PI) / 180;
  return { x: TERMINAL.x + Math.sin(a) * RING_MI, y: TERMINAL.y + Math.cos(a) * RING_MI };
};

// ---- the rain the ring camera can see (exported; cut 4 imports it). Since world round 6 (rain to the ground, darker,
// hanging from the base's near rim) cut 3 itself no longer draws it: the world's shaft reads at this framing. -------
// From the ring camera (~4.5 mi up, looking down 25 deg) the world's shaft sits almost wholly behind the cell's flat
// base (measured: a faint band right under the base). This adds the shaft's NEAR side, hanging from the base's front
// arc down to the ground as a soft veil with streaks, and the wet, darker ground under its foot. Both lean a little
// downwind (east) and ride the cell. No canvas blur (SVG only).
export const STORM_IN_RAIN = {
  /** shaft radius at the base and its spread on the ground, miles per unit of cell size */
  topR: 1.3,
  footR: 1.45,
  /** downwind lean of the foot (miles per unit of size, east) */
  lean: 0.7,
  /** veil opacity just under the base */
  alpha: 0.9,
  rgb: [128, 116, 106] as [number, number, number],
} as const;
export const StormInRain: React.FC<{ v: DenView; c: { x: number; y: number }; size: number; S: number; part: "ground" | "veil"; id: string; strength?: number }> = ({
  v,
  c,
  size,
  S,
  part,
  id,
  strength = 1,
}) => {
  const baseZ = CLOUD.baseZ * size;
  const toEye = Math.atan2(v.eye[0] - c.x, v.eye[1] - c.y);
  const col = rgbCss(fogRgb(v, STORM_IN_RAIN.rgb, c.x, c.y, 0.4), 1);
  const a0 = clamp01(STORM_IN_RAIN.alpha * strength * (1 - 0.5 * fogAt(v, c.x, c.y, 0.4)));
  const lean = STORM_IN_RAIN.lean * size;
  const N = 32;
  const arc = (cx: number, cy: number, r: number, z: number, a: number, b: number) =>
    Array.from({ length: N + 1 }, (_, i) => v.project(cx + Math.sin(a + ((b - a) * i) / N) * r, cy + Math.cos(a + ((b - a) * i) / N) * r, z));
  const pd = (pts: { x: number; y: number }[]) => `M${pts.map((q) => `${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join("L")}Z`;
  if (part === "ground") {
    const ring = arc(c.x + lean, c.y, STORM_IN_RAIN.footR * size, 0, 0, Math.PI * 2);
    if (ring.some((q) => !q)) return null;
    const sc = v.scaleAt(c.x, c.y, 0);
    return <path d={pd(ring as { x: number; y: number }[])} fill={col} opacity={(a0 * 0.5).toFixed(3)} style={{ filter: `blur(${(sc * 0.25 * size).toFixed(2)}px)` }} />;
  }
  const top = arc(c.x, c.y, STORM_IN_RAIN.topR * size, baseZ, toEye - Math.PI / 2, toEye + Math.PI / 2);
  const bot = arc(c.x + lean, c.y, STORM_IN_RAIN.footR * size, 0, toEye - Math.PI / 2, toEye + Math.PI / 2);
  if (top.some((q) => !q) || bot.some((q) => !q)) return null;
  const T = top as { x: number; y: number }[];
  const B = bot as { x: number; y: number }[];
  const all = [...T, ...B];
  const yTop = Math.min(...T.map((q) => q.y));
  const yBot = Math.max(...B.map((q) => q.y));
  const xL = Math.min(...all.map((q) => q.x));
  const xR = Math.max(...all.map((q) => q.x));
  const streaks = Array.from({ length: 18 }, (_, k) => {
    const u = 0.06 + 0.88 * hash01(k * 7.7 + 3.1);
    const i = Math.round(u * N);
    const sway = 0.8 * Math.sin(S * 0.05 + k * 1.7);
    const len = 0.55 + 0.45 * hash01(k * 5.1 + 9);
    const p = T[i];
    const q = B[i];
    return { x1: p.x, y1: p.y, x2: p.x + (q.x + sway - p.x) * len, y2: p.y + (q.y - p.y) * len, w: 1.4 + 2 * hash01(k * 2.3), a: 0.35 + 0.45 * hash01(k + 5) };
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${id}v`} gradientUnits="userSpaceOnUse" x1="0" y1={yTop.toFixed(2)} x2="0" y2={yBot.toFixed(2)}>
          <stop offset="0" stopColor={col} stopOpacity={a0.toFixed(3)} />
          <stop offset="0.6" stopColor={col} stopOpacity={(a0 * 0.6).toFixed(3)} />
          <stop offset="1" stopColor={col} stopOpacity={(a0 * 0.12).toFixed(3)} />
        </linearGradient>
        <linearGradient id={`${id}h`} gradientUnits="userSpaceOnUse" x1={xL.toFixed(2)} y1="0" x2={xR.toFixed(2)} y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.22" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.78" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={(xL - 20).toFixed(2)} y={(yTop - 20).toFixed(2)} width={(xR - xL + 40).toFixed(2)} height={(yBot - yTop + 40).toFixed(2)}>
          <rect x={(xL - 20).toFixed(2)} y={(yTop - 20).toFixed(2)} width={(xR - xL + 40).toFixed(2)} height={(yBot - yTop + 40).toFixed(2)} fill={`url(#${id}h)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`}>
        <path d={pd([...T, ...B.slice().reverse()])} fill={`url(#${id}v)`} style={{ filter: "blur(4px)" }} />
        {streaks.map((st, k) => (
          <line key={k} x1={st.x1.toFixed(2)} y1={st.y1.toFixed(2)} x2={st.x2.toFixed(2)} y2={st.y2.toFixed(2)} stroke={`url(#${id}v)`} strokeWidth={st.w.toFixed(2)} opacity={st.a.toFixed(3)} strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
};

const StormMovingIn: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = STORM_IN_S0 + f;
  const v = makeView(STORM_IN_CAM.at(f));
  const cell = stormInCellAt(f);
  const t = f - STORM_IN_STRIKE.start;
  const c = cellPos(cell, S);
  const from = { x: c.x + STORM_IN_STRIKE.fromOffset.x, y: c.y + STORM_IN_STRIKE.fromOffset.y };
  const sp = stormInSpreadAt(f);
  const arrowDraw = smooth(STORM_IN_ARROW.draw.f0, STORM_IN_ARROW.draw.f1, f);
  const back = STORM_IN_STRIKE_BEARING - 180 * sp; // the counter-clockwise front
  const bp = ringPoint(back);
  const backDot = sp > 0.001 && sp < 0.999 ? v.project(bp.x, bp.y, 0) : null;
  // ramp: the integral of its activity on the story clock, so nothing jumps back
  const rampTravel = rampTravelAt(S, (s) => rampInActive(s - STORM_IN_S0));
  return (
    <AirStage
      S={S}
      v={v}
      cells={[cell]}
      rampTravel={rampTravel}
      ground={
        <>
          <CreamRing v={v} />
          <ThreeMileRing v={v} draw={1} lit={0} />
          <StormDriftArrow v={v} {...STORM_IN_ARROW} draw={arrowDraw} opacity={STORM_IN_ARROW.opacity * (1 - smooth(STORM_IN_ARROW.drain.f0, STORM_IN_ARROW.drain.f1, f))} />
          {sp > 0 ? <ThreeMileRing v={v} draw={sp} lit={1} from={back} /> : null}
          {backDot ? <circle cx={backDot.x} cy={backDot.y} r={3.2} fill={COLOR.amberHot} /> : null}
        </>
      }
      over={
        <>
          <CompassLetters v={v} w={smooth(STORM_IN_COMPASS.W.f0, STORM_IN_COMPASS.W.f1, f)} e={smooth(STORM_IN_COMPASS.E.f0, STORM_IN_COMPASS.E.f1, f)} />
          <LightningStrike v={v} from={from} to={STORM_IN_STRIKE.to} t={t} seed={STORM_IN_STRIKE.seed} baseZ={STORM_IN_STRIKE.baseZ} />
        </>
      }
    />
  );
};

export default StormMovingIn;
