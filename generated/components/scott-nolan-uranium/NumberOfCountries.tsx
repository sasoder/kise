// ---------------------------------------------------------------------------
// NumberOfCountries (scott-nolan-uranium, cut 25). Cheeky Pint style (stout) in real 3D (nuclearWorld.tsx). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 65 frames.
//
// CHECK LINE: "Separating uranium is an old trick: lots of countries already do it."
//
// THE LINE: "enrichment's been done before. A number of countries do it."
// WORD -> FRAME: enrichment's before f0 · been 12 · done 17 · before 23 · A 35 · number 38 · of 42 · countries 45 · do 52 · it 57
// DURATION: the slot 25.025 -> 27.736 s = 2.711 s x 23.976 = 65 frames (f0..f64).
//
// THE MOTION: one continuous log-space pull-back, no cuts. A glass cutaway centrifuge fills the frame already spinning,
// amber gathering on its axis. The camera climbs: it is one of a row, then a hall on a cream floor, and that floor is the
// US on the slab as the coast comes into shot. Settled on the map, a wave crosses west to east: each country warms to amber
// as its machines rise out of slots in its land, the last on "it". A slow creep and the spin keep the end frame alive.
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
import { Centrifuge, CentrifugeField, NuclearStage, WorldSlab, mapProjectTall, nuclearTrack, slabTop, type FieldMachine, type NuclearCam } from "./nuclearWorld";

export const FPS = 24000 / 1001;
export const DURATION = 65;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const glog = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));

// --- the camera: log-distance, pitch and frame row on one damped track. The target follows the distance, so the pan is
// proportional to the zoom and the machine never slides out faster than the camera leaves it.
const ORNL = mapProjectTall(-84.3, 36);
const MAP_TZ = 27;
const MAP_TX = 8;
const D0 = 92;
const D1 = 2120;
const TRACK = nuclearTrack(
  { tx: 0, ty: 0, tz: 0, d: D0, yaw: 0, pitch: -18, f: 2200, cy: 960, cx: 540 },
  [
    { f0: -6, f1: 34, to: { d: D1, cy: 700 }, warp: 0.9 },
    { f0: 34, f1: 90, to: { d: D1 * 0.93, yaw: 1 } },
  ],
  DURATION,
);
const camAt = (f: number): NuclearCam => {
  const c = TRACK[Math.max(0, Math.min(TRACK.length - 1, f))];
  // the fraction of the way Oak Ridge has moved from the frame's focus to its map position, in screen terms
  const g = smooth(Math.log(340), Math.log(D1), Math.log(c.d)) * (c.d / D1);
  // the climb comes with the distance, quickly at first: the eye rises before it could sink through the floor
  const u = c01((Math.log(c.d) - Math.log(D0)) / (Math.log(D1) - Math.log(D0)) / 0.82);
  // after f30 the settled map tips toward straight-down, so it fills the frame's height
  const pitch = lerp(-18, 50, 1 - (1 - u) * (1 - u)) + 18 * smooth(30, 48, f);
  return { ...c, pitch, tx: lerp(ORNL[0], MAP_TX, g), ty: 40 * (1 - smooth(Math.log(110), Math.log(520), Math.log(c.d))), tz: lerp(ORNL[1], MAP_TZ, g) };
};

// --- the hall: everything scales with the camera's height while the bare floor gives no scale to compare it with
const HALL_H1 = 62;
const COLS = [-4, -3, -2, -1, 0, 1];
const ROWS = [0, 1, 2];
const hallAt = (d: number, f: number) => {
  const t = smooth(Math.log(115), Math.log(760), Math.log(d));
  // the end tilt foreshortens uprights: the block grows with it so its apparent height holds
  const g = 1 + 0.3 * smooth(30, 48, f);
  return { h: glog(80, HALL_H1, t) * g, px: glog(36, 9.6, t) * g, pz: glog(46, 10.5, t) * g, land: glog(16, 1, smooth(Math.log(150), Math.log(1250), Math.log(d))), fogT: smooth(Math.log(100), Math.log(420), Math.log(d)) };
};

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
const WAVE_F0 = 33;
const WAVE_F1 = 45;
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
  const hall = hallAt(cam.d, f);
  const hi = highlightAt(f);
  const usTop = slabTop(hi.US ?? 0);
  const items: FieldMachine[] = [];
  for (const j of ROWS) for (const i of COLS) if (!(i === 0 && j === 0)) items.push({ at: [ORNL[0] + i * hall.px, ORNL[1] + j * hall.pz], h: hall.h, y: usTop });
  for (const c of CLUSTERS) items.push({ at: c.at, h: c.h, y: slabTop(hi[c.iso] ?? 0), rise: smooth(0, 1, (f - c.t0) / RISE_LEN) });
  return (
    <NuclearStage
      cam={cam}
      S={S}
      fog={[lerp(1.02, 1.9, hall.fogT), lerp(1.55, 7, hall.fogT)]}
      pool={{ x: lerp(470, 430, hall.fogT), y: lerp(760, 640, hall.fogT), strength: 1 }}
      world={
        <>
          <WorldSlab projection="tall" highlight={hi} zoomAbout={{ x: ORNL[0], z: ORNL[1], m: hall.land }} />
          <CentrifugeField items={items} S={S} y={slabTop()} />
          <Centrifuge at={ORNL} y={usTop} h={hall.h} mode="cutaway" S={S} />
        </>
      }
    />
  );
};

export default NumberOfCountries;
