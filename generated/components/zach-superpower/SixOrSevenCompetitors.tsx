// ---------------------------------------------------------------------------
// SixOrSevenCompetitors (zach-superpower, cut 11). Core memory podcast style (styles/core-memory.md).
// Opaque 1080x1920, 23.976 fps, 86 frames.
// The graphic standard: flat white glyphs on their hard black shadow on squared paper. Chain echo once, at the
// payoff (ChainEcho). Core Memory edits carry burned-in captions: no label for what the speaker says.
//
// CHECK LINE: "SpaceX built the rocket; China answered with six or seven rockets of its own, each a different
// company, lined up beside it."
//
// THE LINE: "They've got like six or seven SpaceX competitors, you know," (host, Ashlee Vance, about China).
// WORD -> FRAME (local, Whisper, may run ~0.2 s early): They've f-1 · got f3 · like f4 · six f8-17 · or f17 ·
//   seven f19-28 · SpaceX f28-38 · competitors f38-59 · you know f69-77 · END f86.
// DURATION: the slot 11.0944 -> 14.6813 s (sequence frames 266 -> 352) = 3.587 s x 23.976 = 86 frames (f0..f85).
//
// THE MOTION. One world: a row rule with the Falcon 9 standing on it (the original: SPACEX wordmark, black
// interstage and legs). f0 is close on it (k 2.23, the rocket ~1250 px tall, centred) and the camera is already
// moving (its damped track is pre-rolled): it pulls back and pans right, and just behind the frame's right edge
// seven Chinese rockets rise one after another from behind the same rule, left to right, each a CHAIN ECHO rise
// (COPIES): the three colour copies ride a few crown steps ahead of the nose as a ripple and close up under the
// white core as it lands, so at rest each is white + print + shadow only. Tianlong-3, Ceres-1, Zhuque-2,
// Hyperbola-1, Gravity-1, Kinetica-1 solid, then the seventh, Nebula-1, HOLLOW (the "or seven" of the range).
// From ~f30 the resolved row (the Falcon 9 at the left end, seven different rockets to its right, all on one
// rule) holds alive under a slow continuing pull-back and the hand's sway; nothing fades.
// THE BEATS: f0 the lone Falcon 9, already moving · rises start f1/2.5/4.5/6.5/10.5/13 (each as its column comes
// into shot; 17-frame rises, home ~9 frames after the start: the sixth ~f21) · f19 the hollow seventh starts
// ("seven" f19), home ~f27, settled f36 · camera's main move settles ~f30 · f30-f85 the creep.
// The rise timing is tied to the reveal: the pull-back cannot uncover the row's right half sooner without a whip,
// so the sixth lands ~f21 and the seventh ~f27, a few frames after the brief's ~f17 / ~f26 (Whisper's onsets
// run early; the director accepted this).
// CHAIN = COPIES (the clip's legend): only on China's competitors, never on the Falcon 9.
//
// SOURCES: rocket heights and outlines: see superpowerRockets.tsx's header.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { TallPaper, WorldTall, runCamera2, sway } from "../kits/core-memory/deathCountShared";
import {
  ROW_HOLLOW,
  ROW_ORDER,
  ROW_RULE_X0,
  ROW_RULE_X1,
  ROW_RULE_Y,
  ROW_X,
  ECHO_TRAVEL,
  RisingRocket,
  Rocket,
  RowRule,
  RuleClip,
  type RocketKind,
} from "./superpowerRockets";

export const FPS = 24000 / 1001;
export const DURATION = 86;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// -- the rises ---------------------------------------------------------------------------
/** start frame of each competitor's rise (colours lead; the core starts 3 later) */
export const RISE_START: Partial<Record<RocketKind, number>> = {
  tianlong3: 1,
  ceres1: 2.5,
  zhuque2: 4.5,
  hyperbola1: 6.5,
  gravity1: 10.5,
  kinetica1: 13,
  nebula1: 19,
};
export const RISE_TRAVEL_F = ECHO_TRAVEL;
const COMPETITORS = ROW_ORDER.filter((k) => k !== "falcon9");

// -- the camera --------------------------------------------------------------------------
// One keyed track through runCamera2, PRE-ROLLED: the key track starts PRE frames before f0, so at f0 the damped
// camera already has its velocity (it moves from the first frame). The key: log k eases out from K0 to K1 over
// MAIN_F frames (quick off the mark, a long settle), times a slow creep K1 -> K2 so the end never stops; the pan
// eases out a little faster than the zoom (it leads, so the frame's right edge stays just ahead of the rises);
// cy keeps the rule's SCREEN y on its own eased path, RULE_SY0 -> 985.
// Damped numbers (no sway; Falcon 9 screen x / rule screen y): f0 k 2.226, F9 557, rule 1316 · f4 1.922 320 1247 ·
//   f8 1.601 150 1165 · f13 1.307 78 1080 · f20 1.095 84 1010 · f30 ~1.02 ~102 985 · f85 ~0.99.
const PRE = 3;
const K0 = 2.32;
const K1 = 1.04;
const K2 = 0.99;
const MAIN_F = 26;
const RULE_SY0 = 1335;
const RULE_SY1 = 985;
const X_START = ROW_X.falcon9 - 45;
const X_END = 540;
const easeOut = (u: number, p: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), p);
const CAM_F: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let t = 0; t <= DURATION + PRE; t++) {
  const e = easeOut(t / MAIN_F, 2.2);
  const ex = easeOut(t / MAIN_F, 3.4);
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * e) * Math.pow(K2 / K1, t / (DURATION + PRE - 1));
  const ruleSy = RULE_SY0 + (RULE_SY1 - RULE_SY0) * e;
  CAM_F.push(t);
  CAM_K.push(k);
  CAM_CX.push(X_START + (X_END - X_START) * ex);
  CAM_CY.push(ROW_RULE_Y - (ruleSy - 960) / k);
}
export const cameraAt = (frame: number) => runCamera2(frame + PRE, CAM_F, CAM_CY, CAM_CX, CAM_K);
const CX_REST = (X_START + X_END) / 2;
const CY_REST = 900;

const CLIP_ID = "s7c-rule";

const SixOrSevenCompetitors: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const s = sway(frame);
  const cx = cam.cx + s.dx / cam.k;
  const cy = cam.cy + s.dy / cam.k;
  const k = cam.k;
  return (
    <AbsoluteFill>
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={CX_REST} cyRest={CY_REST} />
      <WorldTall cx={cx} cy={cy} k={k} id="s7c">
        <defs>
          <RuleClip id={CLIP_ID} x0={ROW_RULE_X0 - 400} x1={ROW_RULE_X1 + 400} y={ROW_RULE_Y} />
        </defs>
        {/* the original, standing on the rule from f0 */}
        <Rocket kind="falcon9" x={ROW_X.falcon9} y={ROW_RULE_Y} id="s7c-f9" />
        {/* China's competitors, rising from behind the same rule, left to right */}
        {COMPETITORS.map((kind) => (
          <RisingRocket
            key={kind}
            frame={frame}
            start={RISE_START[kind] ?? 0}
            kind={kind}
            x={ROW_X[kind]}
            y={ROW_RULE_Y}
            clipId={CLIP_ID}
            id={`s7c-${kind}`}
            hollow={kind === ROW_HOLLOW}
            travel={RISE_TRAVEL_F}
          />
        ))}
        {/* the rule they all stand on: the occluder */}
        <RowRule x0={ROW_RULE_X0} x1={ROW_RULE_X1} y={ROW_RULE_Y} />
      </WorldTall>
    </AbsoluteFill>
  );
};

export default SixOrSevenCompetitors;
