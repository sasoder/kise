// ---------------------------------------------------------------------------
// NumberOfCountries (scott-nolan-uranium, cut 25). Cheeky Pint style (stout) in real 3D (nuclearWorld.tsx). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 82 frames. V2: the user lengthened the slot and asked for a calmer, wider start.
//
// CHECK LINE: "Separating uranium is an old trick: lots of countries already do it."
//
// THE LINE: "enrichment's been done before. A number of countries do it."
// WORD -> FRAME (words.json, f = round((t - 24.316) x 24000/1001)): For -2 · us 3 · enrichment's 15 · been 29 · done 34 ·
//   before 39 · A 51 · number 54 · of 59 · countries 62 · do 69 · it 74 · But 79
// DURATION: the slot 24.316 -> 27.736 s = 3.420 s x 23.976 = 82 frames (f0..f81).
//
// THE MOTION: one calm crane over all 82 frames, an even log rate eased in and out. f0 is already a small group of machines
// standing on the US, the hero in front a glass cutaway, spinning, amber gathering on its axis, with the coast and the
// board in view. The camera rises and tilts until the whole map is in frame. From "A" (f51) a wave crosses west to east:
// each country warms to amber as its machines rise out of slots in its land, the last settling on "it" (f74). The crane's
// slow tail and the spin keep the end frame alive.
// AMBER = uranium fuel, and a country that enriches it; cream = the subject, board = the sea.
//
// SOURCES: the country list is ENRICHMENT_COUNTRIES in nuclearFacts.ts only. Land: world-atlas countries-50m (Natural Earth),
// Miller projection (mapProjectTall): Equal Earth flattens the Arctic into a false straight coast and shears Alaska.
// Machine sites are real-ish places inside each country, spread for legibility: no site is a claim.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ENRICHMENT_COUNTRIES } from "./nuclearFacts";
import { Centrifuge, CentrifugeField, NuclearStage, WorldSlab, mapProjectTall, slabTop, type FieldMachine, type NuclearCam } from "./nuclearWorld";

export const FPS = 24000 / 1001;
export const DURATION = 82;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const glog = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));

// --- the camera: one calm crane over the whole slot. Its speed is a trapezoid in log-distance: it eases in over the first
// 12 frames, holds an even log rate (no mid-move whoosh), then eases out over the second half and never quite stops, so
// the end frame creeps. Pitch and the pan ride the same progress. The pan is in screen terms (w = p * d / D_END), so Oak
// Ridge drifts evenly from the frame's focus to its place on the map instead of sliding off early.
const ORNL = mapProjectTall(-84.3, 36);
const MAP_TZ = 27;
const MAP_TX = 8;
const D_START = 215;
const D_END = 2000;
const PITCH_START = 30;
const PITCH_END = 68;
const RAMP_IN = 12;
const HOLD_TO = 30;
const TAIL = 0.07; // the creep's share of the cruising speed at the last frame
const PROGRESS = (() => {
  const v: number[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const up = smooth(-2, RAMP_IN, f);
    const down = f <= HOLD_TO ? 1 : lerp(TAIL, 1, 0.5 + 0.5 * Math.cos(Math.PI * c01((f - HOLD_TO) / (DURATION - 1 - HOLD_TO))));
    v.push(up * down);
  }
  const acc = [0];
  for (let f = 1; f < v.length; f++) acc.push(acc[f - 1] + (v[f - 1] + v[f]) / 2);
  const total = acc[DURATION - 1];
  return acc.map((x) => x / total);
})();
const camAt = (f: number): NuclearCam => {
  const p = PROGRESS[Math.max(0, Math.min(PROGRESS.length - 1, f))];
  const d = glog(D_START, D_END, p);
  const w = p * (d / D_END);
  return {
    d,
    f: 2200,
    cx: 540,
    cy: lerp(980, 700, p),
    yaw: lerp(-2, 1, p),
    pitch: lerp(PITCH_START, PITCH_END, Math.pow(p, 0.85)),
    tx: lerp(ORNL[0], MAP_TX, w),
    ty: lerp(32, 0, p),
    tz: lerp(ORNL[1], MAP_TZ, w),
  };
};

// --- the group on Oak Ridge: the hero cutaway in front, five solid machines behind it
const HALL_H = 80;
const HALL = [
  [-1.05, 0.85], [1.05, 0.85], [-2.1, 1.7], [0, 1.75], [2.1, 1.7],
].map(([i, j]) => [ORNL[0] + i * 12, ORNL[1] + j * 13] as [number, number]);

// --- the wave. Sites are inside each country; counts and spacing are for reading at phone size (Europe is spread).
const SITES: Record<string, { at: [number, number]; n: number; northSouth?: boolean; h?: number }> = {
  RU: { at: [78, 57], n: 4 },
  CN: { at: [104, 34], n: 4 },
  JP: { at: [139, 37], n: 2 },
  KP: { at: [126.6, 40], n: 2 },
  IN: { at: [78, 20], n: 3 },
  PK: { at: [70, 29], n: 2 },
  IR: { at: [54, 33], n: 3 },
  GB: { at: [-2.2, 53.2], n: 2, northSouth: true, h: 66 },
  NL: { at: [5.7, 52.2], n: 1, h: 66 },
  DE: { at: [11, 50.4], n: 2, h: 66 },
  FR: { at: [1.5, 46.2], n: 2, h: 66 },
  BR: { at: [-50, -13], n: 3 },
  AR: { at: [-66, -35], n: 2 },
  ZA: { at: [24, -29], n: 3 },
};
const CL_H = 90;
const CL_PITCH = 12;
const WAVE_F0 = 50;
const WAVE_F1 = 62;
const RISE_LEN = 11;
const TONE_LEN = 12;
const XS = ENRICHMENT_COUNTRIES.map((c) => (c === "US" ? ORNL[0] : SITES[c] ? mapProjectTall(SITES[c].at[0], SITES[c].at[1])[0] : 0));
const XMIN = Math.min(...XS);
const XMAX = Math.max(...XS);
const startOf = (x: number) => lerp(WAVE_F0, WAVE_F1, (x - XMIN) / (XMAX - XMIN));
const CLUSTERS = ENRICHMENT_COUNTRIES.filter((c) => SITES[c]).flatMap((c) => {
  const s = SITES[c];
  const o = mapProjectTall(s.at[0], s.at[1]);
  return Array.from({ length: s.n }, (_, i) => ({
    iso: c,
    at: (s.northSouth ? [o[0] + (i ? 4 : -4), o[1] + (i - 0.5) * CL_PITCH] : [o[0] + (i - (s.n - 1) / 2) * CL_PITCH, o[1] + (i % 2 ? 4 : -2)]) as [number, number],
    t0: startOf(o[0]) + i * 2,
    h: s.h ?? CL_H,
  }));
});
const highlightAt = (f: number) => {
  const h: Record<string, number> = {};
  ENRICHMENT_COUNTRIES.forEach((c, i) => {
    h[c] = smooth(0, 1, (f - startOf(XS[i])) / TONE_LEN);
  });
  return h;
};

const NumberOfCountries: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 300;
  const cam = camAt(f);
  const hi = highlightAt(f);
  const usTop = slabTop(hi.US ?? 0);
  const items: FieldMachine[] = [];
  for (const at of HALL) items.push({ at, h: HALL_H, y: usTop });
  for (const c of CLUSTERS) items.push({ at: c.at, h: c.h, y: slabTop(hi[c.iso] ?? 0), rise: smooth(0, 1, (f - c.t0) / RISE_LEN) });
  return (
    <NuclearStage
      cam={cam}
      S={S}
      fog={[1.9, 7]}
      boardUnits={680}
      pool={{ x: 430, y: 640, strength: 1 }}
      world={
        <>
          <WorldSlab projection="tall" islandMin={1.2} highlight={hi} />
          <CentrifugeField items={items} S={S} y={slabTop()} />
          <Centrifuge at={ORNL} y={usTop} h={HALL_H} mode="cutaway" glow={2.3} S={S} />
        </>
      }
    />
  );
};

export default NumberOfCountries;
