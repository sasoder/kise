// ---------------------------------------------------------------------------
// AllRetiredButUnited (scott-aircraft-order, cut 7). Cheeky Pint "at sea" look carried into the air (aircraftShared:
// the yard at golden hour). Opaque 1080x1920, 23.976 fps, 146 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: with the sound off, a viewer says "all the big airlines (I recognise Qantas, BA, Delta, KLM...) parked
// their jumbo jets for good, but United's jet stayed in service."
//
// THE LINE: "literally every global long haul airline in the world, except for United, permanently retired part of
// their wide body fleets. We looked at that and said,"
// WORD -> FRAME: literally f-3 · every f6 · global f16 · long f24 · haul f31 · airline f34 · in f41 · the f47 ·
// world f51-58 · except f59 · for f64 · United f68-76 · permanently f78 · retired f87-99 · part f99 · of f105 ·
// their f108 · wide f110 · body f114 · fleets f119-124 · We f126 · looked f129 · at f132 · that f134 · and f137 ·
// said f140-146 (notes/word_frames.txt, S1).
// DURATION: the slot 7.049 -> 13.138 s = 6.089 s x 23.976 = 146 frames (f0..f145).
//
// THE MOTION: one long-lens camera (f 3300 -> 2900 -> 3250 px) at tail-top height (30 -> 34 m) glides BACK along a
// packed storage line of the world's long-haul jets, 35 m to the side of the fin line: it opens tight on Delta,
// KLM and Singapore with American and Virgin beyond, then Qantas (in from f12), Air France (f27) and BA (f41) come in
// from the left edge at 130-200 px marks and recede into the haze, each the type it retired; the camera eases in
// toward the line (d 35 -> 16 m) and United's 787-10 slides in last (amber fin from its first frame), nearest
// and biggest, in from f55, settled by "United" f68. "Permanently retired" (f78-122): one continuous front runs down the row from
// BA to Virgin (each jet drains by tone into the haze over ~12 f, the next one already going, white storage covers
// wiping on after it); United stays lit. "We looked at that and said" (f90-145): a slow crane up and push in on
// United's fin, the stored row in the haze behind it; the last frame is still creeping, shimmer and dust running.
// Every field glides on its own camEase keys through the house damped follower (oceanShared CAM_STIFF/CAM_DAMP);
// s (along the row) and f never reverse, so there is no stall.
// AMBER = UNITED (its fin, the bet); the other airlines' fins are cream with their real mark in ink.
//
// THE ROW: the world's YARD row re-placed tighter (ROW_STEP [46, 56] m instead of [46, 122]): United stays at
// YARD.united, the eight slots keep the world's airlines, types and order (BA 747, AF A380, QF 747, DL 777, KLM 747,
// SQ A380, AA A330, VS A340-600) and the nose-left heading. Every wingtip clears the next nose by >= 12 m. The hangar
// and lane are the world's, unchanged. FOR CUT 2: import ALL_RETIRED_ROW (positions), ALL_RETIRED_END_CAM (f145
// camera), ALL_RETIRED_END_STATE (drain/stored 1 on every slot, United 0) and ALL_RETIRED_END_S (story clock 145).
//
// SOURCES: the row is the director's final list (COMMON.md, FACTS.md: all retired widebody types or groups in 2020;
// United retired none). Tail marks: the world's airlineMarks.ts (assets-src/scott-aircraft-order/logos/SOURCES.md).
// No numbers, no text.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF, camEase } from "../kits/cheeky-pint/oceanShared";
import { AirStage, JET_POINTS, Jet, TaxiLine, YARD, Yard, jetPoint, type SideCam } from "./aircraftShared";

export const FPS = 24000 / 1001;
export const DURATION = 146;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE ROW — the world's yard row, re-placed tighter (a packed storage line): United stays at YARD.united, the eight
// slots follow it at ROW_STEP (the world's [46, 122] made [46, 56]: wingtips clear the next nose by >= 12 m)
// ---------------------------------------------------------------------------
export const ROW_STEP: [number, number] = [46, 56];
type RowSlot = { airline: (typeof YARD.slots)[number]["airline"]; type: (typeof YARD.slots)[number]["type"]; at: [number, number]; heading: number };
export const ALL_RETIRED_ROW: { united: RowSlot; slots: RowSlot[] } = {
  united: { ...YARD.united },
  slots: YARD.slots.map((sl, i) => ({ ...sl, at: [YARD.united.at[0] + ROW_STEP[0] * (i + 1), YARD.united.at[1] + ROW_STEP[1] * (i + 1)] as [number, number] })),
};
const ALL_JETS = [ALL_RETIRED_ROW.united, ...ALL_RETIRED_ROW.slots];
const ROW_LEN = Math.hypot(ROW_STEP[0], ROW_STEP[1]);
const U: [number, number] = [ROW_STEP[0] / ROW_LEN, ROW_STEP[1] / ROW_LEN];
/** to the right of the row line (the camera's side) */
const N: [number, number] = [U[1], -U[0]];
const finOf = (s: RowSlot) => jetPoint(s.type, s.at, s.heading, JET_POINTS[s.type].finMark);
const FIN0 = finOf(ALL_RETIRED_ROW.united);
/** along-row distance (m) of slot i's fin from United's fin (0 = United, 1..8) */
export const SLOT_S = ALL_JETS.map((s) => {
  const p = finOf(s);
  return (p[0] - FIN0[0]) * U[0] + (p[2] - FIN0[2]) * U[1];
});
const ROW_YAW = (Math.atan2(U[0], U[1]) * 180) / Math.PI;

/** a camera in row coordinates: s along the row from United's fin, d to its right, y eye height, f, horizon, yaw offset */
type RowKey = { s: number; d: number; y: number; f: number; horizon: number; dyaw: number };
const rowCam = (k: RowKey) => ({
  x: FIN0[0] + k.s * U[0] + k.d * N[0],
  z: FIN0[2] + k.s * U[1] + k.d * N[1],
  y: k.y,
  f: k.f,
  horizon: k.horizon,
  yaw: ROW_YAW + k.dyaw,
});

// ---------------------------------------------------------------------------
// CAMERA — one track in row coordinates; each field glides on its own keys (camEase), then the house damped follower
// ---------------------------------------------------------------------------
type Glide1 = [f0: number, f1: number, to: number];
const ROW_TRACK: Record<keyof RowKey, { start: number; glides: Glide1[] }> = {
  s: { start: 196, glides: [[-20, 38, 50], [12, 68, -110], [90, 210, -96]] },
  d: { start: 35, glides: [[34, 84, 16], [90, 210, 14]] },
  y: { start: 30, glides: [[56, 140, 34]] },
  f: { start: 3300, glides: [[34, 84, 2900], [90, 210, 3250]] },
  horizon: { start: 500, glides: [[34, 84, 390], [80, 190, 150]] },
  dyaw: { start: -10, glides: [[34, 84, -8], [90, 210, -8.3]] },
};
const followField = (start: number, glides: Glide1[], log: boolean) => {
  const tr = (v: number) => (log ? Math.log(v) : v);
  const out: number[] = [];
  let c = 0;
  let vel = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    let v = tr(start);
    let prev = v;
    for (const [f0, f1, to] of glides) {
      v += (tr(to) - prev) * camEase((f - f0) / (f1 - f0));
      prev = tr(to);
    }
    if (f === 0) c = v;
    else {
      vel = vel + (v - c) * CAM_STIFF - vel * CAM_DAMP;
      c += vel;
    }
    out.push(log ? Math.exp(c) : c);
  }
  return out;
};
const FIELDS = Object.keys(ROW_TRACK) as (keyof RowKey)[];
const FIELD_TRACKS = FIELDS.map((k) => followField(ROW_TRACK[k].start, ROW_TRACK[k].glides, k === "f"));
const rowKeyAt = (f: number): RowKey => {
  const o = {} as RowKey;
  FIELDS.forEach((k, i) => (o[k] = FIELD_TRACKS[i][f]));
  return o;
};
const TRACK: SideCam[] = Array.from({ length: DURATION + 2 }, (_, f) => ({ mode: "side", ...rowCam(rowKeyAt(f)) }));
const START = TRACK[0];
/** cut 2 opens on these */
export const ALL_RETIRED_END_CAM: SideCam = TRACK[DURATION - 1];
export const ALL_RETIRED_END_S = DURATION - 1;
export const ALL_RETIRED_END_STATE = { drain: 1, stored: 1, unitedDrain: 0, unitedStored: 0 } as const;

// ---------------------------------------------------------------------------
// THE STORAGE WAVE — one front along the row (m from United's fin), BA at f78 to past Virgin at f122; a jet drains as
// the front's 200 m ramp crosses its fin, its covers follow once it is a quarter drained (derived from the front)
// ---------------------------------------------------------------------------
const WAVE = { f0: 78, f1: 122, width: 200 };
const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};
const waveFront = (f: number) => {
  const t = (f - WAVE.f0) / (WAVE.f1 - WAVE.f0);
  return SLOT_S[1] - WAVE.width * 0.5 + t * (SLOT_S[8] - SLOT_S[1] + WAVE.width);
};
const drainAt = (f: number, slot: number) => smooth((waveFront(f) - SLOT_S[slot]) / WAVE.width + 0.5);

/** the yard: the hangar from the world, the lane, the stand lead-in lines, the row and United */
const RowWorld: React.FC<{ drain: (slot: number) => number; stored: (slot: number) => number }> = ({ drain, stored }) => (
  <>
    <Yard hide={["row", "lines", "united"]} />
    <TaxiLine pts={[YARD.lane.at(140), YARD.lane.at(1250)]} width={0.6} />
    {ALL_JETS.map((s, i) => {
      const nose = jetPoint(s.type, s.at, s.heading, JET_POINTS[s.type].nose);
      const tail = jetPoint(s.type, s.at, s.heading, JET_POINTS[s.type].tail);
      return <TaxiLine key={`l${i}`} pts={[[nose[0] - 14, nose[2]], [tail[0] + 6, tail[2]]]} width={0.4} />;
    })}
    {ALL_RETIRED_ROW.slots.map((s, i) => (
      <Jet key={i} type={s.type} airline={s.airline} at={s.at} heading={s.heading} drain={drain(i + 1)} stored={stored(i + 1)} />
    ))}
    <Jet type={ALL_RETIRED_ROW.united.type} airline="united" at={ALL_RETIRED_ROW.united.at} heading={ALL_RETIRED_ROW.united.heading} />
  </>
);

const AllRetiredButUnited: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = TRACK[S];
  const dr = (i: number) => drainAt(S, i);
  const st = (i: number) => smooth((drainAt(S, i) - 0.25) / 0.75);
  // the row and United (never drained) on the world's stage: sky, haze, dust, shimmer, grade, grain on the clip clock
  return <AirStage cam={cam} S={S} rest={START} world={<RowWorld drain={dr} stored={st} />} />;
};

export default AllRetiredButUnited;
