import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { makeTrack, smoothstep, smootherstep, type Bump, type Cam } from "./incaShared";
import { CAM_E1, E1, Label, N_NOBLES, POSE_OPEN, POSE_UPRIGHT, StringsPage, TONE, Tableau, camOf, lerpPose, outsideRank, type Scene, type StringState } from "./stringsShared";

// ---------------------------------------------------------------------------
// PitilessAutocrat (cut A of the "strings" set). Dwarkesh Patel with Si
// Sheppard, "Why captured emperors cooperated". In-point 9.635 s on the edit
// timeline; local frame = round((t - 9.635) * 24). Opaque 1080x1920, 24 fps,
// 96 frames. World, figures, strings and the named states: stringsShared.tsx.
//
// THE LINE: "(The records of Moctezuma reflect that) he was a pitiless
//   autocrat. He centralized all power on the aristocracy."
//   [reflect -3 · that 8] · he 13 · was 16 · a 20 · PITILESS 27 · AUTOCRAT 38-49
//   · He 51 · CENTRALIZED 53 · ALL 62 · POWER 69 · on 75 · the 77 ·
//   ARISTOCRACY 79-91 · the cut ends f94 (f94-95 = safety tail, still alive).
//
// THE GESTURES (each traced to its word; nothing else):
//   1. f0  Moctezuma alone, large (k 1.55, head-top y ~520, feet y ~1045), his
//      hands raised and half open; the last of his line settles in (tone
//      0.9 -> 1 by f5). Label "MOCTEZUMA" (IM Fell English SC, 44 px) under
//      his feet from f0, to the 0.55 rung by f44, gone f48-58 (the strings
//      rise through its place).
//   2. "pitiless autocrat" f18-f50: the camera eases back and down to the E1
//      framing; the seven nobles come into the picture beneath him as it
//      opens (f17-f30), bowed (bow 1) and dim (0.55). He does not
//      move.
//   3. "He centralized all power" f48-f73: a string rises from each noble's
//      head, head-led, into his hands: outside nobles first, working inward
//      (starts f48.5 + 1.9 f per rank, 7 f of travel), slack and cream while
//      it travels; the moment it lands it turns ORANGE FROM HIS FIST DOWNWARD
//      (a crisp front, 6 f). "all" f62: the inner strings are arriving (the
//      last lands f67). "power" f69: his fists close and lift 14 px (f65-71)
//      and the strings pull taut, the pull travelling down each one (the fist
//      end straightens f67-72, the nobles' ends f72-87, outside-in).
//   4. "aristocracy" f79-f91: as each string's pull reaches its noble he is
//      drawn up from his bow (bow 1 -> 0) and brightens to 1.0 (6 f each,
//      outside-in, f78-f92).
//   5. hold f92-f95 = exactly E1 on the last frame, alive: the highlights
//      travelling down the taut orange strings (fist -> noble), the camera
//      creeping in 2 % (to E1's k 1.18 exactly on f95, still moving).
// ORANGE = THE LIVE HOLD (a string he is pulling), nothing else.
// CAMERA: velocity bumps (C1), one glide (k 1.55 -> E1's 1.18).
// Seven nobles is a number for the picture, not a claim. The diadem
//   (xiuhuitzolli) and the knotted cloak (tilmatli) are the Aztec ruler's dress.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 96;
const LAST = DURATION - 1;

export const schema = z.object({
  vignette: z.number(),
  label: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, label: "MOCTEZUMA" });

// ---- the camera: the world y held at screen y 835, and ln k ---------------
const K_OPEN = 1.55;
/** the opening: the middle of his figure (world y 590) at screen y 780 */
const Y_OPEN = 590 + (835 - 780) / K_OPEN;
const GLIDE: [number, number] = [18, 50];
const track = (bumps: Bump[], v0: number) => makeTrack(bumps, v0, -60, 200, 8);
/** the bump's area that brings the channel to `target` on frame f */
const solve = (fixed: Bump[], b: Bump, v0: number, f: number, target: number): Bump => {
  const base = track(fixed, v0)(f);
  const unit = track([[b[0], b[1], 1, b[3]]], 0)(f);
  return [b[0], b[1], (target - base) / unit, b[3]];
};
const PRE: Bump = [-60, 24, Math.log(0.985), 1];
const PULL = solve([PRE], [GLIDE[0], GLIDE[1], 1, 0.9], Math.log(K_OPEN), GLIDE[1], Math.log(0.98 * CAM_E1.k));
const CREEP = solve([PRE, PULL], [44, 150, 1, 1], Math.log(K_OPEN), LAST, Math.log(CAM_E1.k));
const LNK = track([PRE, PULL, CREEP], Math.log(K_OPEN));
const FY = track([solve([], [GLIDE[0] + 1, GLIDE[1] + 2, 1, 0.9], Y_OPEN, GLIDE[1] + 2, CAM_E1.focus[1])], Y_OPEN);
const camAt = (f: number): Cam => camOf({ focus: [CAM_E1.focus[0], FY(f)], k: Math.exp(LNK(f)) });

// ---- the timeline ----------------------------------------------------------
const RISE = { f0: 48.5, per: 1.9, travel: 7, turn: 6 };
const PULL_T = { fist: 67, fistPer: 0.4, noble: 72, noblePer: 1.3 };
const riseStart = (i: number) => RISE.f0 + RISE.per * outsideRank(i);
/** the frame noble i's string is taut at his head: he starts to rise */
const drawnUp = (i: number) => PULL_T.noble + 6 + PULL_T.noblePer * outsideRank(i);

const sceneAt = (f: number): Scene => {
  const grip = smootherstep((f - 65) / 6);
  const nobles = Array.from({ length: N_NOBLES }, (_, i) => {
    const seen = smoothstep((f - 17) / 13);
    const up = smootherstep((f - drawnUp(i)) / 6);
    return { bow: 1 - up, tone: seen * (TONE.second + (1 - TONE.second) * up) };
  });
  const stringsM = Array.from({ length: N_NOBLES }, (_, i): StringState => {
    const r = outsideRank(i);
    const t0 = riseStart(i);
    const p = smoothstep((f - t0) / RISE.travel);
    const q = smoothstep((f - t0 - RISE.travel) / RISE.turn);
    const sFrom = 1 - smootherstep((f - PULL_T.fist - PULL_T.fistPer * r) / 5);
    const sTo = 1 - smootherstep((f - PULL_T.noble - PULL_T.noblePer * r) / 6);
    return { slack: [sFrom, sTo], base: 1, live: q > 0.001 ? [0, q] : null, drawn: [1 - p, 1] };
  });
  return {
    ...E1,
    emperor: lerpPose(POSE_OPEN, POSE_UPRIGHT, grip),
    emperorTone: 0.9 + 0.1 * smoothstep(f / 5),
    nobles,
    stringsM,
  };
};

const PitilessAutocrat: React.FC<Props> = ({ vignette, label }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const labelOp = (1 - (1 - TONE.second) * smoothstep((frame - 20) / 24)) * (1 - smoothstep((frame - 48) / 10));
  return (
    <StringsPage cam={cam} vignette={vignette}>
      <Tableau scene={sceneAt(frame)} cam={cam} frame={frame} uid="pa" />
      <Label text={label} x={540} y={760} dy={62} cam={cam} frame={frame} f0={-30} opacity={labelOp} />
    </StringsPage>
  );
};

export default PitilessAutocrat;
