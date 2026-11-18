// ---------------------------------------------------------------------------
// NetflixFactor (toto-female-fans, cut 1). Cheeky Pint style, picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 65 frames. World: livingRoom.tsx (the room, the TV show, the family).
//
// CHECK LINE: "Netflix's Drive to Survive pulled new people into F1 from their sofas."
//
// THE LINE: "...I | think it's not only because of the Netflix factor. | It's also because we entertain."
// WORD -> FRAME (from the composition start): think 1 · it's 10 · not 18 · only 22 · because 29 · of 35 · the 39 ·
// Netflix 42 · factor 48 (ends ~54) · It's 56.
// DURATION: the slot 1.920 -> 4.520 s = 2.6 s x 25 = 65 frames (f0..f64). Back to Toto at 4.52.
//
// THE MOTION: f0 close on a TV screen (~918 px wide): a cream card F1 races along the picture-book circuit (the
// trackWorld sky, tyre wall, kerbs, streaming in parallax), the Netflix "N" stamped as the show's bug in its top-left
// corner. One eased dolly back from f0 (visible from ~f6), landing f56: the TV's bezel and the wall enter, then the
// sideboard, the lamp and the plant, then the cream sofa and a family of three rise in from the bottom edge, seen
// from behind three-quarter, leaning in, glued to the race. The screen's light turns them and the room AMBER, rising
// with the pull to full by "factor" (f50): soft gradient light, no strokes, on the wall round the TV, the sideboard
// top, the screen-facing side of each head (the cheek of the faces in profile) and shoulders, and the sofa back's top.
// On "Netflix" (f42) the daughter bounces up onto her knees and leans toward the screen: one eased hop (rise from
// f37, the peak f43, a small dip and settle by ~f54), her shoulders rising ~0.08 m and moving 0.12 m toward the TV,
// her pigtails flicking. No arm or hand is ever drawn: her hands stay below the sofa back the whole cut (rev 1: the
// raised pointing arm read as a rude gesture and was cut). f56-64 a slow creep in: the race still running.
// AMBER = F1's fans: the screen's light on the family and on the room (one bloom, fixed); nothing else glows. The
// race in the screen carries no grain of its own: the room's grain is the one grain layer.
//
// SOURCES: the Netflix "N" ribbon symbol, redrawn as a one-colour ink stamp on a cream tile from the Simple Icons
// "netflix" path (CC0; the N 13.2 x 24 units, stems 4.7 wide). The F1 outline: champShared's F1Outline geometry
// (toto-champion-eight). No text, no numbers.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, clamp01, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { CLOTH, HAIR, SKIN, ROOM, RoomBack, RoomFinish, RoomFront, TvGlass, TvShow, type Member, type RoomCam } from "./livingRoom";

export const FPS = 25;
export const DURATION = 65;
export const schema = z.object({});
export const defaultProps = schema.parse({});

export const BEAT = {
  pullFrom: 0,
  pullTo: 50,
  amberFrom: 10,
  amberTo: 50, // full by "factor" f48
  hopFrom: 37, // the daughter's bounce onto her knees: rising from f37, up by "Netflix" f42, settled ~f54
} as const;

// --- the camera: one pull back from f0, part dolly (the camera backs away over the family's heads: true parallax),
// part zoom, and a crane down (so the family rises up into frame under the TV). Rest framing (rev 2): the screen ~700 px
// wide, its centre at y 675 (485 + the 190 px shift), the three heads in a row just under it (y ~900-1115), the top of
// the sofa back at y ~1310. The pull runs visibly from f0 and lands f50; a slow creep in runs on under the landing. ----
const DY = 190;
const TV_W_0 = 918; // the screen's width at f0 (85 % of the frame)
const TV_W_1 = 700; // at rest
const K0 = TV_W_0 / ROOM.tv.w;
const K1 = TV_W_1 / ROOM.tv.w;
/** the camera's distance to the screen (m) at f0 and at rest, and its eye height */
const D0 = 7;
const D1 = 10;
const EYE0 = 4.5;
const EYE1 = 2.97;
const Y_TV0 = 700 + DY;
const Y_TV1 = 485 + DY;
/** a cubic bezier ease (CSS-style): moving from f0, one deceleration into the landing */
const bezier = (x1: number, y1: number, x2: number, y2: number) => (u: number) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const t = (lo + hi) / 2;
    const x = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
    if (x < u) lo = t;
    else hi = t;
  }
  const t = (lo + hi) / 2;
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
};
const ease = bezier(0.15, 0.3, 0.25, 1);
export const pullAt = (f: number) => ease((f - BEAT.pullFrom) / (BEAT.pullTo - BEAT.pullFrom));
export const camAt = (f: number): RoomCam => {
  const p = pullAt(f);
  // the creep in starts under the landing (zero speed at f30, an ease-in), so the move never holds: the screen grows ~3 %
  const cu = clamp01((f - 30) / (DURATION - 1 - 30));
  const creep = 0.03 * cu * cu;
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * p) * (1 + creep);
  const d = Math.exp(Math.log(D0) + (Math.log(D1) - Math.log(D0)) * p);
  const F = k * d;
  const eye = EYE0 + (EYE1 - EYE0) * p;
  const ytv = Y_TV0 + (Y_TV1 - Y_TV0) * p;
  return { x: 0.03 * Math.sin(f / 23), z: ROOM.tv.z - d, eye, F, hor: ytv - (eye - ROOM.tv.cy) * k };
};

// --- the family -----------------------------------------------------------------------------------------------
const lean = (f: number) => smoothstep(f / 60);
const blink = (f: number, at: number[]) => {
  for (const b of at) {
    const u = f - b;
    if (u >= 0 && u < 5) return [0.5, 1, 1, 0.6, 0.2][Math.floor(u)];
  }
  return 0;
};
/** the daughter's bounce: a spring from 0 (seated) to 1 (up on her knees) with one small overshoot (the hop) and a
 *  settle; `lean` toward the screen follows a softer spring so the body rises first, then reaches forward */
export const hopAt = (f: number) =>
  f <= BEAT.hopFrom ? 0 : spring({ frame: f - BEAT.hopFrom, fps: FPS, config: { damping: 11, stiffness: 170, mass: 0.9 } });
export const reachAt = (f: number) =>
  f <= BEAT.hopFrom ? 0 : spring({ frame: f - BEAT.hopFrom - 2, fps: FPS, config: { damping: 16, stiffness: 90 } });
const familyAt = (f: number): Member[] => {
  const l = lean(f);
  const hu = hopAt(f);
  const ru = reachAt(f);
  const breathe = (s: number) => 0.004 * Math.sin(f / 9 + s);
  return [
    {
      x: -0.56,
      z: -2.56 + 0.06 * l,
      shoulder: 0.98 - 0.03 * l + breathe(0),
      R: 0.15,
      hw: 0.22,
      skin: SKIN.light,
      hair: HAIR.chestnut,
      style: "crop",
      top: CLOTH.sage,
      turn: 0.55,
      tilt: 4 + 1.5 * Math.sin(f / 17),
      blink: blink(f, [30]),
    },
    {
      x: 0.02,
      z: -2.5 + 0.05 * l + 0.12 * ru,
      shoulder: 0.92 - 0.02 * l + breathe(2) + 0.08 * hu,
      R: 0.14,
      hw: 0.16,
      skin: SKIN.light,
      hair: HAIR.auburn,
      style: "pony",
      top: CLOTH.terracotta,
      turn: 0,
      tilt: -2 * Math.min(1, ru),
      blink: 0,
      point: null,
      // the pigtails: the old idle swing, then a flick that follows the hop's vertical speed (they lag the head)
      ponySwing:
        5 * Math.sin(f / 6) * Math.exp(-Math.max(0, f - 40) / 18) * (f > 36 ? 1 : 0.3) +
        60 * (hopAt(f - 1) - hopAt(f - 2)),
    },
    {
      x: 0.57,
      z: -2.56 + 0.06 * l,
      shoulder: 0.97 - 0.03 * l + breathe(4),
      R: 0.15,
      hw: 0.21,
      skin: SKIN.tan,
      hair: HAIR.ink,
      style: "bob",
      top: CLOTH.denim,
      turn: -0.55,
      tilt: -4 + 1.2 * Math.sin(f / 19 + 1),
      blink: blink(f, [58]),
    },
  ];
};

const NetflixFactor: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const amber = smoothstep((S - BEAT.amberFrom) / (BEAT.amberTo - BEAT.amberFrom));
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.ground, overflow: "hidden" }}>
      <RoomBack c={cam} amber={amber} S={S} />
      <TvShow c={cam} S={S} />
      <TvGlass c={cam} />
      <RoomFront c={cam} family={familyAt(S)} amber={amber} />
      <RoomFinish S={S} />
    </AbsoluteFill>
  );
};

export default NetflixFactor;
