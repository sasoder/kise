// ---------------------------------------------------------------------------
// RisingTide (nik-detecting-bullshit, cut 20). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 90 frames. World: harbourWorld.tsx (the harbour, the boats, the sleeping crew).
//
// CHECK LINE: with the sound off the viewer can say "the boat reached the target mark, but only because the tide
// lifted every boat — not because of anything its crew did."
//
// THE LINE: Nik: "...Because KPI | can be met because of external factors and because of luck, | and then you dive
// deep..." (the slot opens on the tail of a long "KPI", 19.70-20.70 s)
// WORD -> FRAME (from the composition start): can 9 · be 13 · met 17 · because 24 · of 35 · external 43 · factors 55 ·
// and 63 · because 70 · of 74 · luck 78 (ends ~83) · and 85. Cut back to Nik at f90.
// DURATION: the slot 20.395 -> 24.149 s = 3.754 s x 23.976 = 90 frames (f0..f89).
//
// THE MOTION: one continuous motion, the tide rises and never stops. f0 CLOSE on our cream rowing boat moored at a
// stone harbour wall, its two-man crew asleep (one reclined, feet up on the gunwale, his hand trailing over the side;
// one slumped at the bow in a beanie; no oars, no engine). The dull tan painted level line and its bullseye sit on the
// open wall ~90 px above the gunwale, the wet band below. The water rises FAST from f0 (~7 px/f): the boat climbs the
// wall, bobbing gently. CAUSE -> EFFECT: the lowest point of our gunwale reaches the line's height on F_CROSS (f12.5,
// solved from the tide: the contact frame); the line lights from that frame (the first reaction frame), outward from
// the boat along the wall as a front, settled at the boat by f16.5 and on the bullseye by ~f17 ("met"). The tide then
// blends (f11-f20) into a slower STEADY rise that never stops (~1 px/f on screen in the pull-back and the wide).
// f18-f72 ("because of external factors") the camera pulls back (zoom + a little dolly) and tilts up with the water:
// the whole row of boats along the wall (board = context) is seen still rising together on the same water, every
// gunwale above the same lit line. f72-f89 ("because of luck") a slow creep in; the water still rises, the boats bob;
// on f89 every gunwale is ~60-70 px clear of the lit line, the line ~25 px above the water.
// AMBER = the KPI being met: only the painted mark glows (dull ochre paint until lit). The water is never amber.
// cream = our boat (the subject); board = the other boats (context).
//
// SOURCES: none on screen (no text, no numbers, no logo).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { BOATS, HarbourStage, bobAt, gunwaleLow, hyForLine, waterAt, type HarbourCam } from "./harbourWorld";

export const FPS = 24000 / 1001;
export const DURATION = 90;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- beats ---------------------------------------------------------------------------------------------
/** the frame our gunwale's lowest point reaches the painted line (water y - freeboard = 0), solved from the tide */
export const F_CROSS = (() => {
  // bisection on the gunwale's height above the line (the water only ever rises)
  let a = 0;
  let b = 89;
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2;
    if (waterAt(m) - gunwaleLow(BOATS[0]) > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
})();
export const BEAT = {
  pullFrom: 18,
  pullTo: 72,
  /** the light: each stretch of line ramps over LIGHT_F frames, the front travelling WAVE_V m / frame from our boat */
  lightF: 4,
  waveV: 0.6,
} as const;

/** lit 0..1 of the painted mark at world x: from the crossing, outward from our boat's ends */
export const litAt = (f: number, x: number) => {
  const dist = Math.max(0, Math.abs(x - BOATS[0].x) - 2.3);
  return smoothstep((f - F_CROSS - dist / BEAT.waveV) / BEAT.lightF);
};

// --- the camera: close on our boat, the pull-back along the wall to the whole row, a slow creep in -----------
const K0 = 140; // our boat ~700 px wide (65 %)
const K1 = 72; // our boat ~360 px wide (33 %), two neighbours + slivers
const D0 = 30;
const EYE = -1.8;
const smoother = (u: number) => {
  const t = clamp01(u);
  return t * t * t * (t * (6 * t - 15) + 10);
};
export const pullAt = (f: number) => smoother((f - BEAT.pullFrom) / (BEAT.pullTo - BEAT.pullFrom));
export const camAt = (f: number): HarbourCam => {
  const p = pullAt(f);
  const creep = smoothstep((f - BEAT.pullTo) / (DURATION - 1 - BEAT.pullTo));
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * p) * (1 + 0.014 * creep);
  const D = D0 * Math.pow(K0 / k, 0.4);
  const x = 0.3 + 0.1 * smoothstep(f / 26) + 0.05 * p + 0.03 * creep;
  const lineY = 680 + 120 * p + 6 * creep; // the tilt: the camera rises with the water
  return { x, k, D, eye: EYE, hy: hyForLine(k, D, EYE, lineY) };
};

const RisingTide: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const water = waterAt(S);
  const breath = 0.5 + 0.5 * Math.sin((S * 2 * Math.PI) / 44);
  const boats = BOATS.map((b, i) => {
    const bob = bobAt(b, S);
    return { b, heave: bob.heave, roll: bob.roll, breath: i === 0 ? breath : 0 };
  });
  return <HarbourStage S={S} cam={cam} water={water} litAt={(x) => litAt(S, x)} boats={boats} />;
};

export default RisingTide;
