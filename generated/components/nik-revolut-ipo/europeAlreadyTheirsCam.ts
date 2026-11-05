// EuropeAlreadyTheirs' camera and wave timing (pure: no React, no three, no fonts), so a bun probe can import it.
// The house damped follower over eased glides (stillToLaunchCam's track, restated: that file is StillToLaunch's and its
// track is private), with d in log space. The follower runs from F_PRE so f0 is already moving.
import type { NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { mapProjectTall } from "./revolutGeo";

export const DURATION = 61;

const CAM_STIFF = 0.145;
const CAM_DAMP = 0.59;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
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

// --- keys (world units; see revolutGeo.mapProjectTall) ---------------------------------------------------------------
const START = mapProjectTall(10.7, 53);
const HOLD = mapProjectTall(9.7, 52);
export const CAM_KEYS = {
  start: { tx: START[0], ty: 0, tz: START[1], d: 500, yaw: -6, pitch: 31, f: 2200, cx: 540, cy: 820 } as NuclearCam,
  hold: { tx: HOLD[0], tz: HOLD[1], d: 413, yaw: -10, pitch: 25 } as Partial<NuclearCam>,
};
/** one eased push-in and crane down over the whole cut; its slow tail runs past the last frame (a living hold) */
export const CAM_TRACK = track(CAM_KEYS.start, [{ f0: -22, f1: 76, to: CAM_KEYS.hold }], DURATION);
export const camAt = (f: number): NuclearCam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, Math.round(f)))];

// --- the cream wave: out from London across the served European markets ----------------------------------------------
/** London, Revolut's home: the wave's source */
export const LONDON: [number, number] = [-0.13, 51.51];
/** each served market's rough centre of land (lon, lat), for its distance from London (EEA + GB + CH) */
export const EU_CENTRES: Record<string, [number, number]> = {
  GB: [-0.13, 51.51], IE: [-8, 53.2], IS: [-18.6, 64.9], NO: [9.5, 61], SE: [15.5, 60], FI: [26, 63], DK: [9.5, 56],
  NL: [5.3, 52.2], BE: [4.5, 50.6], LU: [6.1, 49.8], FR: [2.5, 46.5], DE: [10.4, 51.1], CH: [8.2, 46.8], LI: [9.55, 47.15],
  AT: [14.5, 47.5], IT: [12.5, 42.8], MT: [14.4, 35.9], ES: [-3.7, 40.2], PT: [-8.2, 39.6], PL: [19.4, 52], CZ: [15.5, 49.8],
  SK: [19.7, 48.7], HU: [19.5, 47.2], SI: [14.9, 46.1], HR: [16.4, 45.1], RO: [25, 45.9], BG: [25.5, 42.7], GR: [22, 39.3],
  CY: [33.2, 35], EE: [25.5, 58.7], LV: [24.9, 56.9], LT: [23.9, 55.3],
};
const D2R = Math.PI / 180;
const kmFrom = (a: [number, number], b: [number, number]) => {
  const s = Math.sin(((b[1] - a[1]) * D2R) / 2) ** 2 + Math.cos(a[1] * D2R) * Math.cos(b[1] * D2R) * Math.sin(((b[0] - a[0]) * D2R) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
};
const FAR = Math.max(...Object.values(EU_CENTRES).map((c) => kmFrom(LONDON, c)));
/** the front leaves London on f2 and reaches the farthest market (Cyprus) on f16; each country warms over WAVE_LEN */
export const WAVE_ON = 2;
export const WAVE_SPAN = 14;
export const WAVE_LEN = 9;
export const WAVE: Record<string, number> = Object.fromEntries(
  Object.entries(EU_CENTRES).map(([k, c]) => [k, WAVE_ON + WAVE_SPAN * Math.pow(kmFrom(LONDON, c) / FAR, 0.9)]),
);
