// ---------------------------------------------------------------------------
// PotentialInTheKart (toto-champion-eight, cut 11). Cheeky Pint style (stout, the "air" warmth) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 139 frames. World: trackWorld.tsx (the kart circuit), champShared.tsx (kart, kid, F1).
// REVISION 1 (user: "a bit too static"): the kid races along a kart circuit, the camera trucking alongside him,
// the track streaming past in parallax; the camera pulls out and the F1 draws round him as he drives.
//
// CHECK LINE: "In a kid racing his kart you can already see the F1 driver they could become": the little kart sits
// exactly where an F1 driver sits, and the F1 car around it lights up as the potential.
//
// THE LINE: "...you can judge pretty early on in | a kid's karting performance whether that kid has the potential to
// be a professional racing driver." (the cut returns to Toto at 17.16, "Even with the tiny ones...")
// WORD -> FRAME (from the composition start, words_cutA.md): a 1 · kid's 4 · karting 16 · performance 34 · whether 41 ·
// that 64 · kid 68 · has 71 · the 75 · potential 79 · to 88 · be 102 · a 105 · professional 108 · racing 118 ·
// driver 124 (ends 132) · Even 138.
// DURATION: the slot 11.600 -> 17.160 s = 5.56 s x 25 = 139 frames (f0..f138).
//
// THE MOTION: hard cut in at speed. f0-f40 ("a kid's karting performance") CLOSE on the kid racing in his cream kart,
// the driver centred, the camera trucking with him (the kart ~680 px wide), the circuit streaming past in parallax
// (the near kerb and verge fastest, the tyre wall and fence slower, the trees and grandstand slowest, the sky barely
// moving), the hubs spinning, a little road vibration. f41 ("whether") the camera begins to pull out (a dolly back and
// a zoom, dolly share 0.4, the eye rising 1.5 -> 2.2 m) while the truck continues: one continuous move that lands by f94 with the whole
// F1 in frame. On "potential" (f80-f106) the approved amber line drawing of a modern F1 car draws itself round him from
// the cockpit outward, every stroke growing out of a drawn line, riding with the kart (review 2: a bolder, faster
// opening, the line clearly there by f82). On "professional" (f109-f122) the
// amber fills it from the floor up; the one LightSweep crosses it on "driver" (f124-f135). f94-f138 a slow creep in
// (F1 960 -> 971 px, >= 50 px clear each side), still racing, the world still streaming (the truck eases 150 -> 132 px/f from f112).
// AMBER = the potential you can see in a kid: only the F1 outline and fill glow; the world has none.
//
// SOURCES: none on screen (no text, no numbers, no logo). F1 proportions: 2022+ rules (5.6 m class length, 3.6 m
// wheelbase, 18-inch wheels ~0.72 m tyres, 0.95 m height), drawn from memory of the Mercedes W15/W16 side view.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { amberBandFor, clamp01, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { F1Outline, KartWithKid, M } from "./champShared";
import { LANES, OnLane, TRACK_RIG, TrackStage, kartJitter, planeCam, pullOut, truck, type TrackCam } from "./trackWorld";

export const FPS = 25;
export const DURATION = 139;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- beats ---------------------------------------------------------------------------------------------
export const BEAT = {
  pullFrom: 41, // whether f41
  pullTo: 94,
  drawFrom: 80, // potential f79
  drawTo: 106,
  fillFrom: 109, // professional f108
  fillTo: 122,
  sweepFrom: 124, // driver f124
  sweepTo: 135,
} as const;

// --- the truck: the kart's (and the camera's) speed along the track, world px / frame -----------------------
const V0 = 150;
const V1 = 132;
export const speedAt = (f: number) => V0 + (V1 - V0) * smoothstep((f - 112) / 30);
export const kartX = (f: number) => truck(f, speedAt);

// --- the camera: close on the driver, the pull-out to the whole F1, a slow creep in --------------------------
const K0 = 0.95;
// the end: the F1 ~960 -> 971 px wide (>= 50 px clear each side; review 2)
const K1 = 0.427;
const K_END = 0.432;
/** the pull's ease: a gentle start on "whether", landing by f94 */
export const pullAt = (f: number) => {
  const u = clamp01((f - BEAT.pullFrom) / (BEAT.pullTo - BEAT.pullFrom));
  return u * u * u * (u * (6 * u - 15) + 10);
};
export const camAt = (f: number): TrackCam => {
  const p = pullAt(f);
  const creep = smoothstep((f - BEAT.pullTo) / (DURATION - 1 - BEAT.pullTo));
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * p) * (1 + (K_END / K1 - 1) * creep);
  const D = pullOut(K0, TRACK_RIG.D, Math.min(K0, k), 0.4).D;
  // aim: the helmet centred close, the F1's middle (0.4 m ahead of the cockpit) wide; the kart surges a little
  const aim = (0.17 + 0.23 * p) * M;
  const surge = 9 * Math.sin(f / 37) * (1 - 0.7 * p);
  return {
    x: kartX(f) + aim + surge,
    k,
    D,
    eye: (1.5 + 0.7 * p) * M,
    groundY: 1040 - 40 * p,
    dx: 1.4 * Math.sin(f / 9.3) + 0.6 * Math.sin(f * 1.7),
    dy: 1.1 * Math.sin(f / 7.1) + 0.7 * Math.sin(f * 2.3),
  };
};

// --- life ------------------------------------------------------------------------------------------------
const blinkAt = (f: number) => {
  for (const b of [57, 116]) {
    const u = f - b;
    if (u >= 0 && u < 5) return [0.5, 1, 1, 0.6, 0.2][Math.floor(u)];
  }
  return 0;
};
// a smoothstep with a quarter of it linear, so the first strand shows on f80 itself (not 3 frames later), plus an early
// boost (review 2: the opening read faint) that lifts the first frames round the cockpit and halo (~15 % drawn by f82)
// and hands back to the approved curve by f96 (monotone: the boost never falls faster than the curve rises)
export const drawAt = (f: number) => {
  const u = clamp01((f - BEAT.drawFrom + 1) / (BEAT.drawTo - BEAT.drawFrom + 1));
  const t = clamp01(u / 0.6);
  return clamp01(0.25 * u + 0.75 * smoothstep(u) + 0.12 * 6.75 * t * (1 - t) * (1 - t));
};
/** the line's width (screen px): a bolder leading stroke (9 px) through f84, easing back to the approved 6 px by f96 */
export const lineAt = (f: number) => 6 + 3 * (1 - smoothstep((f - 84) / 12));
export const fillAt = (f: number) => clamp01((f - BEAT.fillFrom) / (BEAT.fillTo - BEAT.fillFrom));
export const sweepAt = (f: number) => clamp01((f - BEAT.sweepFrom) / (BEAT.sweepTo - BEAT.sweepFrom));

const PotentialInTheKart: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const band = amberBandFor(planeCam(cam, 0));
  const x = kartX(S);
  const v = speedAt(S);
  const draw = drawAt(S);
  const fill = fillAt(S);
  const sweep = sweepAt(S);
  const j = kartJitter(S, 0.7, 1);
  const kart = { x, y: 0, k, wheelSpin: x, wheelSpeed: v, lean: -0.8 + j.lean, bob: j.bob, blink: blinkAt(S) };
  const showF1 = draw > 0;
  return (
    <TrackStage S={S} cam={cam} v={v}>
      <OnLane cam={cam} z={LANES.subject}>
        {showF1 ? <F1Outline x={x} y={0} k={k} draw={draw} fill={fill} sweep={sweep} amberBand={band} line={lineAt(S)} /> : null}
        <KartWithKid {...kart} />
        {showF1 ? <F1Outline x={x} y={0} k={k} draw={draw} fill={fill} amberBand={band} layer="halo" line={lineAt(S)} /> : null}
      </OnLane>
    </TrackStage>
  );
};

export default PotentialInTheKart;
