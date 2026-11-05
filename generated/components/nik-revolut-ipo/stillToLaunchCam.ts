// StillToLaunch's camera and wave timing (pure: no React, no three, no fonts), so the bun probe can import it.
// The house damped follower over superposed eased glides (nuclearWorld's nuclearTrack, restated: nuclearWorld loads
// fonts at module scope), with d in log space. The follower runs from F_PRE so f0 is already moving.
import type { NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { mapProjectTall } from "./revolutGeo";

export const DURATION = 118;

const CAM_STIFF = 0.145;
const CAM_DAMP = 0.59;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const camEase = (u: number, warp = 1) => smoothstep(Math.pow(c01(u), warp));

type Glide = { f0: number; f1: number; to: Partial<NuclearCam>; warp?: number };
/** an arc: an additive offset (d: in log space) under a sin^2 window f0..f1, before the follower */
type Bump = { f0: number; f1: number; by: Partial<NuclearCam> };
const LOG = ["d", "f"];
const F_PRE = -24;

const track = (start: NuclearCam, glides: Glide[], bumps: Bump[], frames: number): NuclearCam[] => {
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
      for (const b of bumps) {
        const by = b.by[k];
        if (by === undefined) continue;
        const u = c01((f - b.f0) / (b.f1 - b.f0));
        v += by * Math.pow(Math.sin(Math.PI * u), 2);
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
const EU = mapProjectTall(3, 50.5); // Europe's middle, a little west of its centroid so the Atlantic opens on the left
const US = mapProjectTall(-96.5, 38.5);
const WORLD = mapProjectTall(-16, 3);

const ARC_NORTH = 48;
const ARC_UP = Math.log(1.3);
export const CAM_KEYS = {
  start: { tx: EU[0] + 95, ty: 0, tz: EU[1], d: 405, yaw: -7, pitch: 47, f: 2200, cx: 540, cy: 820 } as NuclearCam,
  us: { tx: US[0], tz: US[1], d: 650, yaw: 0, pitch: 53, cy: 850 } as Partial<NuclearCam>,
  world: { tx: WORLD[0], tz: WORLD[1], d: 1650, yaw: 1.5, pitch: 61, cy: 920 } as Partial<NuclearCam>,
};

export const CAM_TRACK = track(
  CAM_KEYS.start,
  [
    { f0: -20, f1: 48, to: CAM_KEYS.us },
    { f0: 38, f1: 94, to: CAM_KEYS.world, warp: 1.25 },
    { f0: 86, f1: 150, to: { d: 1830, pitch: 63, tx: WORLD[0] + 6 } },
  ],
  // the Atlantic crossing arcs north and up a little (Greenland, Iceland, Labrador under the camera, both coasts in view)
  [{ f0: -6, f1: 50, by: { tz: ARC_NORTH, d: ARC_UP } }],
  DURATION,
);
export const camAt = (f: number): NuclearCam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, Math.round(f)))];

// --- the warm-ups ----------------------------------------------------------------------------------------------------
/** the US: cream -> amber and a slight rise, onset on "US" (f51), settled by ~f60 */
export const US_ON = 50;
export const US_LEN = 10;
/** the expansion wave: board -> amber, onset on "launch" (f69), roughly west -> east, the last settled on "markets" (f100) */
export const WAVE: Record<string, number> = { CO: 69, PE: 72, AR: 75, ZA: 82, AE: 86, IN: 88 };
export const WAVE_LEN = 11;
