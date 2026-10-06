import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, pchip, smootherstep, smoothstep } from "./incaShared";
import {
  CaptorHand,
  CAM_E1,
  CAM_E2,
  E2,
  Emperor,
  Label,
  N_NOBLES,
  Noble,
  POSE_SLUMP,
  POSE_UPRIGHT,
  PuppetString,
  StringsPage,
  TONE,
  WorldSvg,
  glintAt,
  lerpPose,
  mix,
  mix2,
  sceneStrings,
  type Cam,
  type EmperorPose,
  type Scene,
  type StringState,
} from "./stringsShared";

// ---------------------------------------------------------------------------
// PsychologicalBreak (cut 2 of 5, file 17_PsychologicalBreak). Dwarkesh Patel
// with Si Sheppard, "Why captured emperors cooperated".
//   "(...for the first time in his life being told what to do) just led to a
//    complete psychological break because once Cortés had hold of him,"
// Dwarkesh map style, "beyond maps" umber page; the world is stringsShared
// (builder A; used as-is). Opaque 1080x1920, 24 fps, 91 frames (f0..f90).
// OPENS on state E1 (+ one thin dead string from his head up out of frame),
// ENDS exactly on state E2 (scene E2 under CAM_E2 on f90).
//
// WORD -> LOCAL FRAME (in-point 17.059 s; f = round((t - in) * 24)):
//   [just -3] led 6 · to 8 · a 11 · COMPLETE 12 · PSYCHOLOGICAL 24 ·
//   BREAK 38-47 · because 48 · once 54 · CORTÉS 62 · had 71 · HOLD 75 ·
//   of 80 · HIM 84-87 · the cut ends f89 (f88-f90 = safety tail).
//
// THE GESTURES (each with the word it serves; nothing else):
//   1. "led to a complete" f0-f22: E1 holding (CAM_E1, k 1.18). The seven taut
//      orange strings carry their travelling highlight; the camera creeps in
//      toward him (k -> ~1.23, the focus rising 760 -> 737). He is still: no
//      tremor. From f0 a thin (2.2 px) dead cream string (0.28) runs from the
//      top of his head straight up out of the frame.
//   2. "psychological break" f23-f47 (the body lands f41-f45): his fists open
//      (left f24-f33, right f31-f39) and the seven strings leave his grip in a
//      wave across, left to right, 1.6 f apart (f25 .. f34.6). Each string
//      goes slack under its own weight (14 f) and DEAD from his hand downward
//      (a crisp front, 8 f down the string). His head bows (to 25 deg + the
//      deeper sag below), torso slumps, arms fall to hang (left f26-f43, right
//      f31-f45); no bounce. When a string's dead front reaches its noble
//      (release + 7 f) that noble sags (bow 0 -> 0.35) and dims (1 -> 0.55)
//      over 8 f; the last is done by f50. The head string loosens as his head
//      drops.
//   3. "because once Cortés" f43-f66: the camera glides UP the head string to
//      the E2 framing, easing OUT as it rises (k ~1.22 -> 1.12, peak ~17 px/f
//      at f48, then slowing all the way in). The gauntleted hand that holds
//      that string comes down into the frame on ONE eased screen track
//      (f32-f64, <= 20 px/f; it crosses the top edge ~f37 and is in place by
//      f62). "CORTÉS" (IM Fell English SC, 44 px) slides up + fades in beside
//      the cuff from f53, landed on f62; it stands at its final screen place
//      while the hand arrives beside it, then rides the world.
//   4. "had hold of him" f68-f84: the head string lights ORANGE from the hand
//      downward (front f68 -> f75, at his head on "hold"), straightening from
//      the hand end first (taut by f78); from f74.5 it lifts his bowed head
//      and body ~12 px (f74.5-f84) into the E2 pose: he hangs from that string.
//   5. Hold to f90 = E2, alive: the highlight travelling down the orange
//      string, the slack dead strings swaying +-4.5 % (each on its own period,
//      all crossing zero on f90), the camera still easing the last ~0.4 % into
//      CAM_E2.
//
// NOTES
//   - "Lifted ~10 px" and "ends exactly on E2" together: the break lands in a
//     pose ~12 px DEEPER than E2 (POSE_DEEP, local), and the pull raises him
//     into E2's POSE_SLUMP.
//   - The hand's place (HAND_AT) is inside the E1 frame, so the hand is held
//     14 px above the frame's top (scene.hand.dy) until it comes down.
//   - Camera: one keyed C1 track (pchip): creep in, ONE glide, settle. No sway
//     (the cut must sit on CAM_E1 and CAM_E2 exactly, taken from the presets).
// SOURCES: none on screen but the name. Moctezuma II held by Cortés in
//   Tenochtitlan from 14 Nov 1519 (Díaz del Castillo; Cortés, 2nd letter).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 91;
const LAST = DURATION - 1;

export const schema = z.object({
  vignette: z.number(),
  /** the label's world anchor (baseline middle) beside the cuff */
  labelX: z.number(),
  labelY: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, labelX: 806, labelY: 31 });

// ---- timing -----------------------------------------------------------------
const T = {
  release0: 25, // the first string leaves his grip
  releaseStep: 1.6,
  slack: 14, // a released string's fall
  front: 8, // the dead front's run down a string
  nobleLag: 7, // the front reaches the noble
  noble: 8, // his sag
  glide: [43, 66] as [number, number],
  hand: [32, 64] as [number, number], // the hand's way down into the frame
  label: 53,
  light: [68, 75] as [number, number], // the orange front down the head string
  lift: [74.5, 84] as [number, number],
};
const release = (i: number) => T.release0 + T.releaseStep * i;
/** a weighty fall: slow off the mark, firm landing, no overshoot */
const fall = (t: number) => smootherstep(Math.pow(clamp01(t), 1.25));

// ---- camera: focus held at screen (540, 835) -------------------------------
// f0 = CAM_E1 exactly, f90 = CAM_E2 exactly (the presets, never literals)
const K_IN = CAM_E1.k * 1.042; // the creep-in's top (~1.23: the outer nobles keep ~30 px of margin)
const FOCUS_Y = pchip([
  [0, CAM_E1.focus[1]],
  [22, 737],
  [43, 729],
  [50, 650],
  [57, 590],
  [66, CAM_E2.focus[1] + 3],
  [LAST, CAM_E2.focus[1]],
]);
const LOG_K = pchip([
  [0, Math.log(CAM_E1.k)],
  [23, Math.log(K_IN)],
  [43, Math.log(K_IN * 0.994)],
  [50, Math.log(mix(K_IN, CAM_E2.k, 0.48))],
  [57, Math.log(mix(K_IN, CAM_E2.k, 0.84))],
  [66, Math.log(CAM_E2.k * 1.004)],
  [LAST, Math.log(CAM_E2.k)],
]);
export const camAt = (f: number): Cam => {
  const k = Math.exp(LOG_K(f));
  return { k, cx: 540, cy: FOCUS_Y(f) - (835 - 960) / k };
};

// ---- the emperor ------------------------------------------------------------
/** where the break lands: ~12 px deeper than E2, so the string can lift him into E2 */
const POSE_DEEP: EmperorPose = { ...POSE_SLUMP, head: 31, slump: 1.5, lean: 4.5, wristL: [-56, -111], wristR: [68, -109] };
const poseAt = (f: number): EmperorPose => {
  const tH = fall((f - 23) / 18);
  const tS = fall((f - 25) / 19);
  const tL = fall((f - 26) / 17);
  const tR = fall((f - 31) / 14);
  const a = POSE_UPRIGHT;
  const b = POSE_DEEP;
  const broken: EmperorPose = {
    head: mix(a.head, b.head, tH),
    nod: mix(a.nod, b.nod, tH),
    slump: mix(a.slump, b.slump, tS),
    lean: mix(a.lean, b.lean, tS),
    wristL: mix2(a.wristL, b.wristL, tL),
    wristR: mix2(a.wristR, b.wristR, tR),
    fistL: 1 - smoothstep((f - 24) / 9),
    fistR: 1 - smoothstep((f - 31) / 8),
    hang: 0,
    limp: mix(a.limp, b.limp, Math.min(tL, tR)),
  };
  const lift = smootherstep((f - T.lift[0]) / (T.lift[1] - T.lift[0]));
  return lift <= 0 ? broken : lerpPose(broken, POSE_SLUMP, lift);
};

// ---- the hand: just above the frame until the glide, then down to its place --
const FIST_BOTTOM = 212; // world y of the fist's lowest point at dy 0
/** a trapezoid-speed ease (cosine shoulders, 28 % each): peak speed 1.39x the mean */
const trap = (t: number) => {
  const a = 0.28;
  const u = clamp01(t);
  const h = 1 / (1 - a);
  if (u < a) return h * (u / 2 - (a / (2 * Math.PI)) * Math.sin((Math.PI * u) / a));
  if (u > 1 - a) return 1 - h * ((1 - u) / 2 - (a / (2 * Math.PI)) * Math.sin((Math.PI * (1 - u)) / a));
  return h * (u - a / 2);
};
/** the hand's dy: its fist's bottom follows ONE eased screen track from 14 px
 *  above the frame to its E2 place (peak ~21 px/f), whatever the camera does */
export const handDy = (f: number, cam: Cam) => {
  if (f >= T.hand[1]) return 0;
  const end = camAt(T.hand[1]);
  const sEnd = 960 + (FIST_BOTTOM - end.cy) * end.k;
  const s = mix(-14, sEnd, trap((f - T.hand[0]) / (T.hand[1] - T.hand[0])));
  return (s - 960) / cam.k + cam.cy - FIST_BOTTOM;
};

const THIN = 2.2;

const PsychologicalBreak: React.FC<Props> = ({ vignette, labelX, labelY }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;

  // the seven strings and their nobles
  const stringsM: StringState[] = [];
  const nobles: { bow: number; tone: number }[] = [];
  for (let i = 0; i < N_NOBLES; i++) {
    const r = release(i);
    const sl = smootherstep((frame - r) / T.slack);
    const p = clamp01((frame - r) / T.front);
    const period = 31 + 5.3 * ((i * 3) % 7);
    stringsM.push({
      slack: sl,
      sag: 0.17 * (1 + 0.045 * sl * Math.sin((2 * Math.PI * (frame - LAST)) / period)),
      base: TONE.dead,
      live: p < 1 ? [p, 1] : null,
      highlight: p < 1 ? glintAt(frame, i) : null,
    });
    const n = smoothstep((frame - r - T.nobleLag) / T.noble);
    nobles.push({ bow: 0.35 * n, tone: mix(1, TONE.second, n) });
  }

  // the head string: thin and dead, loosening as his head drops; then the pull
  const pLight = clamp01((frame - T.light[0]) / (T.light[1] - T.light[0]));
  const loose = 0.06 + 0.44 * fall((frame - 24) / 18);
  const slackFrom = loose * (1 - smoothstep((frame - 68) / 6));
  const slackTo = loose * (1 - smoothstep((frame - 71) / 7));

  const scene: Scene = {
    ...E2,
    emperor: poseAt(frame),
    nobles,
    stringsM,
    hand: { show: 1, bar: 0, tilt: 0, dy: handDy(frame, cam) },
    stringsC: { head: { slack: [slackFrom, slackTo], base: 1, live: [0, pLight] }, wristL: null, wristR: null },
  };
  const st = sceneStrings(scene);
  const head = st.c.head;

  // the label stands at its final screen place while the glide brings the hand beside it
  const labelCam = frame < T.glide[1] ? camAt(T.glide[1]) : cam;

  return (
    <StringsPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        {nobles.map((n, i) => (
          <Noble key={i} i={i} bow={n.bow} tone={n.tone} uid={`pb-n${i}`} />
        ))}
        <Emperor pose={scene.emperor} variant="aztec" tone={1} uid="pb-e" />
        {stringsM.map((s, i) => (
          <PuppetString key={i} {...st.m[i]} base={s.base} live={s.live} highlight={s.highlight} k={k} />
        ))}
        {head ? (
          <>
            {pLight < 1 ? <PuppetString {...head} base={TONE.dead} live={null} drawn={[pLight, 1]} k={k} width={THIN} /> : null}
            {pLight > 0 ? <PuppetString {...head} base={1} live={[0, pLight]} drawn={[0, pLight]} highlight={glintAt(frame, 7)} k={k} /> : null}
          </>
        ) : null}
        <CaptorHand bar={0} tilt={0} at={st.handAt} tone={1} uid="pb-h" />
      </WorldSvg>
      <Label text="CORTÉS" x={labelX} y={labelY} cam={labelCam} frame={frame} f0={T.label} size={44} />
    </StringsPage>
  );
};

export default PsychologicalBreak;
