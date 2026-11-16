// survivedGeo: ThreeOrFourSurvived's pure data (no React, no three, no fonts), so a bun probe can import it.
// The bank tiles (city, lon/lat, world X/Z on nik-revolut-ipo's tall Miller map), their size, the sinking front and the
// camera track (the house damped follower over eased glides, restated from nik-revolut-ipo/europeAlreadyTheirsCam.ts,
// whose track is private; d and f in log space; it runs from F_PRE so f0 is already moving).
import type { NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { mapProjectTall } from "../nik-revolut-ipo/revolutGeo";

export const DURATION = 223;
const c01 = (v: number) => Math.max(0, Math.min(1, v));

// --- the bank tile (world units; the slab is 3.4 thick, Europe ~135 wide) --------------------------------------------
/** a phone (portrait ~1:2.5 in the world, so it still reads ~1:1.6 under the wide's 50 deg pitch and ~1:2 at f0; one
 *  small corner radius on all four corners): W wide, H tall, D deep, corner radius R; its front a darker screen inset by
 *  a thin bezel (BEZEL), with a small camera pill (NOTCH_W x NOTCH_H) just under the screen's top edge */
export const TILE = { W: 5.0, H: 12.6, D: 1.1, R: 0.55, BEZEL: 0.4, SCREEN_R: 0.32, NOTCH_W: 1.7, NOTCH_H: 0.5 } as const;
/** the slab top (WORLD_SLAB.T): the tiles stand on it */
export const SLAB_TOP = 3.4;

// --- the banks: capitals and big cities, one tile each (London, Paris, Berlin get a few); no names, no logos -------
export type Bank = { id: string; lon: number; lat: number; dx?: number; dz?: number; survivor?: boolean; revolut?: boolean };
// coastal cities are nudged a little inland so every footprint stands wholly on the land (probe: footprint check)
export const BANKS: Bank[] = [
  { id: "london-revolut", lon: -0.12, lat: 51.51, dx: -1.0, dz: 0.4, revolut: true, survivor: true },
  { id: "london-2", lon: -0.12, lat: 51.51, dx: -7.1, dz: 1.8, survivor: true },
  { id: "london-3", lon: -0.12, lat: 51.51, dx: -3.6, dz: 4.9 },
  { id: "manchester", lon: -2.24, lat: 53.48, dx: 0.8, dz: 0.0 },
  { id: "edinburgh", lon: -3.3, lat: 55.9, dx: -2.2, dz: -2.2 },
  { id: "dublin", lon: -6.6, lat: 53.35, dx: -4.9, dz: -0.7 },
  { id: "paris", lon: 2.35, lat: 48.86, survivor: true },
  { id: "paris-2", lon: 2.35, lat: 48.86, dx: 6.1, dz: 1.8 },
  { id: "lyon", lon: 4.84, lat: 45.76 },
  { id: "marseille", lon: 5.6, lat: 43.75, dx: -0.4, dz: 1.0 },
  { id: "bordeaux", lon: -0.4, lat: 44.84, dx: 0.8, dz: 0.0 },
  { id: "toulouse", lon: 1.44, lat: 43.6 },
  { id: "amsterdam", lon: 5.1, lat: 52.2, dx: 1.8, dz: 0.0, survivor: true },
  { id: "brussels", lon: 4.35, lat: 50.85, dx: 0.4 },
  { id: "luxembourg", lon: 6.13, lat: 49.61 },
  { id: "berlin", lon: 13.4, lat: 52.52 },
  { id: "berlin-2", lon: 13.4, lat: 52.52, dx: 6.5, dz: 1.2 },
  { id: "hamburg", lon: 10.0, lat: 53.55 },
  { id: "munich", lon: 11.58, lat: 48.14 },
  { id: "frankfurt", lon: 8.68, lat: 50.11 },
  { id: "cologne", lon: 6.96, lat: 51.2 },
  { id: "zurich", lon: 8.54, lat: 47.37 },
  { id: "vienna", lon: 16.37, lat: 48.21 },
  { id: "copenhagen", lon: 12.3, lat: 55.6, dx: 4.3, dz: 4.3 },
  { id: "stockholm", lon: 17.6, lat: 59.4, dx: -2.7, dz: 1.1 },
  { id: "oslo", lon: 10.75, lat: 60.1 },
  { id: "gothenburg", lon: 12.4, lat: 57.75, dx: 1.8, dz: 0.0 },
  { id: "helsinki", lon: 25.0, lat: 60.6, dx: 0.2, dz: 0.5 },
  { id: "tallinn", lon: 25.0, lat: 59.0, dx: 0.3, dz: -0.1 },
  { id: "riga", lon: 24.4, lat: 56.8, dx: -0.8, dz: -0.8 },
  { id: "vilnius", lon: 25.28, lat: 54.69 },
  { id: "warsaw", lon: 21.01, lat: 52.23 },
  { id: "gdansk", lon: 18.4, lat: 54.1, dx: -0.4, dz: -0.4 },
  { id: "krakow", lon: 19.94, lat: 50.06 },
  { id: "prague", lon: 14.42, lat: 50.08 },
  { id: "budapest", lon: 19.04, lat: 47.5 },
  { id: "zagreb", lon: 15.98, lat: 45.81 },
  { id: "belgrade", lon: 20.46, lat: 44.79 },
  { id: "bucharest", lon: 26.1, lat: 44.6 },
  { id: "sofia", lon: 23.32, lat: 42.7 },
  { id: "athens-thessaly", lon: 22.6, lat: 38.6, dx: -3.1, dz: 7.0 },
  { id: "milan", lon: 9.19, lat: 45.46 },
  { id: "rome", lon: 12.8, lat: 42.1, dx: -3.7, dz: 4.2 },
  { id: "bologna", lon: 11.3, lat: 44.5, dx: -2.3, dz: -0.3 },
  { id: "madrid", lon: -3.7, lat: 40.42 },
  { id: "barcelona", lon: 1.6, lat: 41.8, dx: -1.2, dz: 1.8 },
  { id: "valencia", lon: -1.0, lat: 39.5, dx: -4.0, dz: 0.3 },
  { id: "seville", lon: -5.6, lat: 37.6 },
  { id: "lisbon", lon: -8.6, lat: 39.1, dx: 1.7, dz: 0.3 },
  { id: "porto", lon: -8.0, lat: 41.2, dx: 1.1, dz: 0.0 },
];
export type PlacedBank = Bank & { x: number; z: number; i: number };
export const PLACED: PlacedBank[] = BANKS.map((b, i) => {
  const [x, z] = mapProjectTall(b.lon, b.lat);
  return { ...b, x: x + (b.dx ?? 0), z: z + (b.dz ?? 0), i };
});
export const REVOLUT = PLACED.find((b) => b.revolut) as PlacedBank;

// --- the sinking front: one contracting ring from the edges of the continent in toward the survivors ---------------
/** the ring's centre: the survivors' middle (London, Paris, Amsterdam) */
export const FRONT_C: [number, number] = (() => {
  const s = PLACED.filter((b) => b.survivor);
  return [s.reduce((a, b) => a + b.x, 0) / s.length, s.reduce((a, b) => a + b.z, 0) / s.length];
})();
const distC = (b: PlacedBank) => Math.hypot(b.x - FRONT_C[0], (b.z - FRONT_C[1]) * 1.15);
const SINKERS = PLACED.filter((b) => !b.survivor);
const D_MAX = Math.max(...SINKERS.map(distC));
const D_MIN = Math.min(...SINKERS.map(distC));
/** the front reaches the outermost bank on FRONT_ON and the innermost on FRONT_OFF; each sinks over SINK_LEN */
export const FRONT_ON = 116;
export const FRONT_OFF = 139;
export const SINK_LEN = 9;
/** the frame each bank starts down (survivors: never) */
export const SINK_AT: Record<string, number> = Object.fromEntries(
  SINKERS.map((b) => [b.id, FRONT_ON + (FRONT_OFF - FRONT_ON) * Math.pow((D_MAX - distC(b)) / (D_MAX - D_MIN), 0.85)]),
);
/** 0 standing .. 1 gone: an ease-in drop (it starts slowly, then falls through the slot) */
export const sinkAt = (id: string, f: number) => {
  const s = SINK_AT[id];
  if (s === undefined) return 0;
  const u = c01((f - s) / SINK_LEN);
  return u * u * (3 - 2 * u) * 0.35 + u * u * 0.65;
};
/** a sinking tile travels TILE.H + SINK_DEPTH down; its top passes below the slab surface at sink = SINK_GONE, the
 *  frame its slot closes and it stops drawing (nothing is left on the map after a tile's last visible frame) */
export const SINK_DEPTH = 0.4;
export const SINK_GONE = TILE.H / (TILE.H + SINK_DEPTH);
/** the survivors warm board -> cream while the field empties (f124 -> f146, settled before "survived" ends ~151) */
export const WARM: [number, number] = [124, 146];

// --- the Revolut payoff: lift one level and turn amber on "really survived" (f163 -> landed f176), one sweep --------
export const LIFT_ON = 162;
export const LIFT_OFF = 175;
export const LIFT_H = 2.0;
export const SWEEP_ON = 175;
export const SWEEP_LEN = 16;

// --- the camera ------------------------------------------------------------------------------------------------------
const CAM_STIFF = 0.145;
const CAM_DAMP = 0.59;
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const camEase = (u: number, warp = 1) => smoothstep(Math.pow(c01(u), warp));
type Glide = { f0: number; f1: number; to: Partial<NuclearCam>; warp?: number };
const LOG = ["d", "f"];
const F_PRE = -24;
const track = (start: NuclearCam, glides: Glide[], frames: number): NuclearCam[] => {
  const keys = Object.keys(start) as (keyof NuclearCam)[];
  const tr = (k: string, v: number) => (LOG.includes(k) ? Math.log(v) : v);
  const pos: Record<string, number> = {};
  const vel: Record<string, number> = {};
  for (const k of keys) {
    pos[k] = tr(k, start[k]);
    vel[k] = 0;
  }
  const out: NuclearCam[] = [];
  for (let f = F_PRE; f <= frames + 2; f++) {
    const o: Record<string, number> = {};
    for (const k of keys) {
      let v = tr(k, start[k]);
      let prev = v;
      for (const g of glides) {
        const t = g.to[k];
        if (t === undefined) continue;
        v += (tr(k, t) - prev) * camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
        prev = tr(k, t);
      }
      if (f > F_PRE) {
        vel[k] = vel[k] + (v - pos[k]) * CAM_STIFF - vel[k] * CAM_DAMP;
        pos[k] += vel[k];
      }
      o[k] = LOG.includes(k) ? Math.exp(pos[k]) : pos[k];
    }
    if (f >= 0) out.push(o as NuclearCam);
  }
  return out;
};

const at = (lon: number, lat: number, dx = 0, dz = 0) => {
  const p = mapProjectTall(lon, lat);
  return { tx: p[0] + dx, tz: p[1] + dz };
};
export const CAM_KEYS = {
  /** close on London, low and oblique; Britain's coast in shot */
  start: { ...at(-0.12, 51.51, 0.6, 2.0), ty: 3.4, d: 122, yaw: -9, pitch: 38, f: 3000, cx: 540, cy: 850 } as NuclearCam,
  /** the whole field: Europe as a tabletop filling the keep-in box */
  wide: { ...at(8.2, 48.9), ty: 0, d: 452, yaw: -3, pitch: 50, cy: 796 } as Partial<NuclearCam>,
  /** the slow drift over the full field while it empties (a turn and a small rise; it runs into the push) */
  drift: { yaw: 2, d: 462, tx: at(7.8, 48.9).tx } as Partial<NuclearCam>,
  /** the push back in on London: the survivors in shot, Revolut lower middle */
  end: { ...at(0.7, 50.9), ty: 3.4, d: 140, yaw: 14, pitch: 33, cy: 905 } as Partial<NuclearCam>,
  /** the living hold: a slow creep on past the last frame (a little closer, a little more yaw) */
  creep: { d: 130, yaw: 16.5 } as Partial<NuclearCam>,
};
export const CAM_TRACK = track(
  CAM_KEYS.start,
  [
    { f0: -16, f1: 108, to: CAM_KEYS.wide, warp: 0.9 },
    { f0: 84, f1: 150, to: CAM_KEYS.drift },
    { f0: 122, f1: 192, to: CAM_KEYS.end },
    { f0: 180, f1: 300, to: CAM_KEYS.creep },
  ],
  DURATION,
);
export const camAt = (f: number): NuclearCam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, Math.round(f)))];
