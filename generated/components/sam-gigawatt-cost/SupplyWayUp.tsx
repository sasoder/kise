// ---------------------------------------------------------------------------
// SupplyWayUp (sam-gigawatt-cost, cut 29). Cheeky Pint style, the Scott "air" look (styles/cheeky-pint.md; COMMON.md;
// the medium scott-aircraft-order/aircraftShared.tsx AirStage, read-only; the clip's world campusWorld.tsx).
// Opaque 1080x1920, 23.976 fps, 66 frames.
//
// CHECK LINE: "AI is worth so much that data centers have to multiply — far more of them, out to the horizon."
//
// THE LINE (Sam): "But for it to go down, given how much value there is in this, supply's got to go way up." This
// slot: "given how much value there is in this, supply's got to go way up."
// WORD -> FRAME (from f0, whisper, may run ~5 f early): down -8 · given -2 · how 7 · much 12 · value 16 · there 21 ·
// is 27 · in 31 · this 33 · supply's 41 · got 52 · to 54 · go 57 · way 58 · up 61 · (on camera) People 65.
// DURATION: the slot 29.154 -> 31.907 s (sequence frames 699-765) = 2.753 s x 24000/1001 = 66 frames (f0..f65).
//
// THE MOTION: one continuous move over the desert at golden hour. It opens high and oblique, close on ONE gigawatt
// campus (the Stargate-style block: eight lit cream halls, the substation), already drifting slowly right from f0.
// On "how much value there is in this" (f3-33) amber leaks from the halls' louvre bands, pools on the pad between
// them and gathers as a warm haze over the roofs. On "supply's got to go way up" new campuses rise out of the desert
// floor in EVERY direction from the first (a paving front sweeps each pad away from it, then its halls rise one after
// another out of slots): first the big near cells between the first campus and the camera, then outward to the
// horizon. From f22 the drift blends into one rise, tilt and pull-back that ends LOWER on a raking oblique (camera
// 560 m up), so the near rows stay large to the bottom edge and the grid recedes into the haze, the amber campus
// held at ~y 850-1050. It settles ~f62 into a living creep (dust, shimmer, cloud shadows).
// Cause before effect: the ripple starts at the amber campus; the first neighbour's pad begins on f41 ("supply's"),
// its first hall clears the ground ~f43.
// AMBER = the dollars (here: the value that pulls supply); the new campuses are cream things. Nothing else glows.
//
// SOURCES: no figures on screen. The campus is modelled on OpenAI / Oracle "Stargate" at Abilene, Texas (about
// 1.2 GW in eight two-storey buildings in two rows, on-site substation; public descriptions and aerial photos),
// drawn at plausible, not surveyed, dimensions (campusWorld.tsx header).
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, airCamAt, airProject, airTrack, type AirGlide, type SideCam } from "../scott-aircraft-order/aircraftShared";
import { CAMPUS, CampusField, CampusWarmth, DesertGround, GigawattCampus, type CampusItem } from "./campusWorld";

export const FPS = 24000 / 1001;
export const DURATION = 66;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};

// --- camera: close on the first campus, then rise, tilt up and pull back --------------------------------------------
const CAM_START: SideCam = { mode: "side", x: -320, y: 450, z: -900, f: 1150, pitch: 31, yaw: 16 };
/** the resolved raking oblique: the first campus ~y 850-1050, the near rows large down to the bottom edge */
const CAM_END = { x: -150, y: 560, z: -2050, f: 1000, pitch: 16, yaw: 4 };
/** the track starts PRE frames before f0, so the drift is already moving on f0 */
const PRE = 16;
const GLIDES: AirGlide[] = [
  // the opening drift: slowly right around the campus and a touch back while the amber gathers
  { f0: -PRE, f1: 40, to: { x: -290, yaw: 14.5, z: -960, y: 470 } },
  // the main move, blended into the drift: rise, tilt up, pull back
  { f0: 22, f1: 63, to: { ...CAM_END } },
  // the living hold: the drift carries on
  { f0: 56, f1: 110, to: { y: 590, z: -2130, x: -130, yaw: 3.4 } },
].map((g) => ({ ...g, f0: g.f0 + PRE, f1: g.f1 + PRE }));
const TRACK = airTrack(CAM_START, GLIDES, DURATION + PRE);
const camAt = (f: number) => airCamAt(TRACK, f + PRE);
const REST = camAt(0);

// --- the first campus and its amber ----------------------------------------------------------------------------------
const FIRST: [number, number] = [0, 0];
const glowAt = (f: number) => smooth((f - 3) / 22);
const warmthAt = (f: number) => smooth((f - 9) / 26);

// --- the field: one campus per grid cell, the ripple outward in every direction from the first ----------------------
type Cell = { at: [number, number]; t0: number; dur: number };
const REACH = 13000;
const [PX0, PZ0, PX1, PZ1] = CAMPUS.pad;
/** is any part of the cell's pad on screen (and in front of the camera) at some frame of the cut? */
const seen = (at: [number, number]) =>
  [0, 20, 36, 44, 50, 56, 65].some((f) => {
    const cam = camAt(f);
    const ps = [
      [PX0, PZ0],
      [PX1, PZ0],
      [PX0, PZ1],
      [PX1, PZ1],
    ].map(([x, z]) => airProject(cam, [at[0] + x, 0, at[1] + z]));
    if (ps.some((p) => p.d < 5)) return false;
    const xs = ps.map((p) => p.x);
    const ys = ps.map((p) => p.y);
    return Math.max(...xs) > -40 && Math.min(...xs) < 1120 && Math.max(...ys) > -40 && Math.min(...ys) < 1960;
  });
const FIELD: Cell[] = (() => {
  const out: Cell[] = [];
  for (let j = -5; j <= 26; j++) {
    for (let i = -11; i <= 11; i++) {
      if (i === 0 && j === 0) continue;
      const at: [number, number] = [i * CAMPUS.pitch[0], j * CAMPUS.pitch[1]];
      if (!seen(at)) continue;
      const d = Math.hypot(at[0], at[1]);
      const u = Math.pow(Math.min(1, d / REACH), 0.8);
      const t0 = 39.5 + 12.5 * u + (random(`sw${i}:${j}`) - 0.5) * 1.2;
      // the near campuses climb slower (their rise is the one that must read); far ones finish by ~f62
      const dur = 21 - 12 * Math.pow(u, 0.7);
      out.push({ at, t0, dur });
    }
  }
  return out;
})();

const SupplyWayUp: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  // every cell every frame (a fixed instance count; an unrisen campus draws nothing)
  const items: CampusItem[] = FIELD.map((c) => ({ at: c.at, rise: clamp01((f - c.t0) / c.dur) }));
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={REST}
      ground={null}
      world={
        <>
          <DesertGround S={f} />
          <CampusField items={items} from={FIRST} />
          <GigawattCampus at={FIRST} glow={glowAt(f)} />
          <CampusWarmth at={FIRST} glow={warmthAt(f)} />
        </>
      }
    />
  );
};

export default SupplyWayUp;
