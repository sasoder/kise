// ---------------------------------------------------------------------------
// CortessPuppet (cut C of the "strings" set; Dwarkesh Patel with Si Sheppard,
// "Why captured emperors cooperated"). Dwarkesh map style, "beyond maps" page.
// 1080x1920, 24 fps, 69 frames, opaque. Sequence in-point 23.232 s.
//
// THE LINE: "(he seems to have pulled a complete 180 switch) and become
// essentially, willingly, Cortés's puppet."
//
// WORD -> LOCAL FRAME (24 fps; words.json, in 23.232 s)
//   [and -4]  become 3   essentially 11-29   willingly 37-44   Cortés's 48
//   puppet 59-65   (cut ends f67; f67-68 = safety tail)
//
// OPENS EXACTLY ON E2 (stringsShared): Moctezuma slumped, hanging from ONE taut
// orange string in Cortés's gauntleted hand; his own seven strings slack and
// dead; the nobles dim. Orange = the live hold, and nothing else.
//
// GESTURES (three, overlapping; nothing else moves but the camera)
//   1 "become essentially"  f0-30   the marionette cross-bar draws out of the
//       grip (f0-14); from its two ends two orange strings pay out, head-led,
//       toward his hanging wrists (f8-30) and wait short of them, swaying.
//   2 "willingly"           f33-46  HE raises his own wrists to the waiting
//       string ends (wrists lead f33-42, landing on the word; the head lifts
//       from the bow f34-46, the shoulders f35-47); his hands close on them.
//   3 "Cortés's puppet"     f48-end the bar tilts (+9 deg at f55, back through
//       level ~f63 toward -4) and he moves with it exactly: the wrist under the
//       raised end goes up, the other down, the torso straightens and he hangs
//       from three taut orange strings (the E3 pose by f60). From f56 the
//       orange travels THROUGH him, hand -> noble, down his own seven dead
//       strings (staggered ~1.2 f), which begin to pull taut from his end. The
//       cut ends with the fronts a quarter to half way down: the nobles have
//       not reacted. It is left travelling.
//   CAMERA: one glide, the E2 framing -> the E3 framing (f0-56), then a ~1 %
//       creep out. No label ("CORTÉS" was established in the previous cut).
//
// LOCAL TO THIS FILE (the shared module is used as-is): the draw replicates
// stringsShared's Tableau (nobles, strings M BEHIND the emperor, strings C, hand)
// because the two WAITING wrist strings end in the air, not on his wrists.
// SOURCES: none needed (no figures, dates or text on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { smootherstep, smoothstep } from "./incaShared";
import {
  CAM_E2,
  CAM_E3,
  CaptorHand,
  E2,
  Emperor,
  EMPEROR_AT,
  Noble,
  POSE_HANG,
  POSE_SLUMP,
  PuppetString,
  StringsPage,
  TONE,
  WorldSvg,
  add,
  camOf,
  emperorAnchors,
  glintAt,
  handAnchors,
  lerpCam,
  lerpPose,
  mix,
  mix2,
  mul,
  norm,
  sceneStrings,
  sub,
  type EmperorPose,
  type P2,
  type Scene,
  type StringGeom,
} from "./stringsShared";

export const FPS = 24;
export const DURATION = 69;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// ---------------------------------------------------------------------------
// THE TIMELINE (local frames)
// ---------------------------------------------------------------------------
const T = {
  bar: [0, 14] as const, // the bar draws out of the grip
  pay: [8, 30] as const, // the two strings pay out
  wrist: [33, 42] as const, // he raises his wrists (lands on "willingly")
  head: [34, 46] as const,
  torso: [35, 47] as const,
  close: [40, 46] as const, // his hands close on the strings
  hang: [48, 60] as const, // the pull: toward the E3 pose
  through: 56, // the orange starts down his own strings
  cam: [0, 56] as const,
};
/** how far short of his hanging wrists the strings wait (world px) */
const GAP = 88;
const span = (f: number, r: readonly [number, number]) => (f - r[0]) / (r[1] - r[0]);

/** the bar's tilt (deg, + = its screen-left end UP): up to 9 at f55, back through level ~f63, -4 at the end */
const tiltAt = (f: number) => 9 * smoothstep((f - 48) / 7) - 13 * smoothstep((f - 55) / 13);

// where the two strings wait: on the line from the bar's end to his hanging wrist, GAP short of it
const BAR0 = handAnchors({ bar: 1, tilt: 0 });
const SLUMP_AT = emperorAnchors(POSE_SLUMP);
const waitPoint = (bar: P2, wrist: P2): P2 => add(wrist, mul(norm(sub(bar, wrist)), GAP));
const WAIT_L = waitPoint(BAR0.barL, SLUMP_AT.wristL);
const WAIT_R = waitPoint(BAR0.barR, SLUMP_AT.wristR);
/** a figure-local wrist target that puts the wrist's string anchor at world point p (hang 0) */
const targetFor = (p: P2): P2 => [p[0] - EMPEROR_AT[0], p[1] - EMPEROR_AT[1] + 7];
const REACH_L = targetFor(WAIT_L);
const REACH_R = targetFor(WAIT_R);

/** his pose at frame f, and how far the bar's tilt has hold of him */
const poseAt = (f: number, tilt: number): EmperorPose => {
  const w = smootherstep(span(f, T.wrist));
  const h = smootherstep(span(f, T.head));
  const t = smootherstep(span(f, T.torso));
  const c = smootherstep(span(f, T.close));
  // gesture 2: his own doing
  const own: EmperorPose = {
    head: mix(POSE_SLUMP.head, 8, h),
    nod: mix(POSE_SLUMP.nod, 0.28, h),
    slump: mix(POSE_SLUMP.slump, 0.55, t),
    lean: mix(POSE_SLUMP.lean, 1, t),
    wristL: mix2(POSE_SLUMP.wristL, REACH_L, w),
    wristR: mix2(POSE_SLUMP.wristR, REACH_R, w),
    fistL: mix(0, 0.6, c),
    fistR: mix(0, 0.6, c),
    hang: 0,
    limp: mix(POSE_SLUMP.limp, 0.12, w),
  };
  // gesture 3: the strings take him to the E3 pose, and the bar's tilt moves his wrists exactly
  const g = smootherstep(span(f, T.hang));
  const q = lerpPose(own, POSE_HANG, g);
  const hold = smoothstep((f - 48) / 4);
  const tilted = handAnchors({ bar: 1, tilt });
  const dL = mul(sub(tilted.barL, BAR0.barL), hold);
  const dR = mul(sub(tilted.barR, BAR0.barR), hold);
  return {
    ...q,
    wristL: add(q.wristL, dL),
    wristR: add(q.wristR, dR),
    lean: q.lean - 0.42 * tilt * hold,
    head: q.head + 0.3 * tilt * hold,
  };
};

/** the order the orange enters his seven strings (never in unison, never a sweep) */
const THROUGH_ORDER = [1, 5, 3, 0, 6, 2, 4];
const throughStart = (i: number) => T.through + 1.2 * THROUGH_ORDER.indexOf(i);
/** the front's position down string i (0 = his hand) */
const frontAt = (f: number, i: number) => {
  const t = f - throughStart(i);
  if (t <= 0) return 0;
  return Math.min(1, 0.05 * t * smoothstep(t / 3.5));
};

const CortessPuppet: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const f = frame;

  // ---- camera: one glide E2 -> E3, then a creep ----
  const glide = smootherstep(span(f, T.cam));
  const preset = lerpCam(CAM_E2, CAM_E3, glide);
  const cam = camOf({ focus: preset.focus, k: preset.k * (1 - 0.012 * smoothstep((f - 50) / 30)) });
  const k = cam.k;

  // ---- the hand, the bar ----
  const bar = smootherstep(span(f, T.bar));
  const tilt = tiltAt(f);

  // ---- him ----
  const pose = poseAt(f, tilt);
  const lifted = smootherstep(span(f, T.hang));
  const scene: Scene = {
    ...E2,
    emperor: pose,
    hand: { show: 1, bar, tilt, dy: 0 },
    stringsM: E2.stringsM.map((s, i) => {
      const p = frontAt(f, i);
      const t = f - throughStart(i);
      // the pull tightens the string from his end first
      const loose = 1 - 0.1 * lifted;
      const atFrom = loose - 0.72 * smoothstep((t - 2) / 9);
      const atTo = loose - 0.2 * smoothstep((t - 6) / 12);
      return { ...s, slack: [atFrom, atTo] as [number, number], base: TONE.dead, live: p > 0.002 ? ([0, p] as [number, number]) : null };
    }),
  };
  const st = sceneStrings(scene);
  const hand = st.hand;

  // ---- the two wrist strings ----
  const pay = smootherstep(span(f, T.pay));
  const fasten = smoothstep((f - 39.5) / 2.5);
  const taut = smoothstep((f - 46) / 8);
  const wristString = (side: -1 | 1): { g: StringGeom; drawn: [number, number] } | null => {
    if (pay <= 0.002) return null;
    const from = side < 0 ? hand.barL : hand.barR;
    const wait = side < 0 ? WAIT_L : WAIT_R;
    const wrist = side < 0 ? st.emperor.wristL : st.emperor.wristR;
    const ph = side < 0 ? 0.6 : 2.9;
    const sway: P2 = [7 * pay * Math.sin(0.23 * f + ph), 1.5 * Math.sin(0.31 * f + ph)];
    const to = mix2(add(wait, mul(sway, 1 - fasten)), wrist, fasten);
    const slack = (0.34 + 0.08 * Math.sin(0.19 * f + ph * 2)) * (1 - 0.35 * fasten) * (1 - taut);
    return { g: { from, to, slack, sag: 0.1, side: -side }, drawn: [0, pay] };
  };
  const wL = wristString(-1);
  const wR = wristString(1);
  const head = st.c.head;

  return (
    <StringsPage cam={cam}>
      <WorldSvg cam={cam}>
        {scene.nobles.map((n, i) => (
          <Noble key={i} i={i} bow={n.bow} tone={n.tone} uid={`cp-n${i}`} />
        ))}
        {/* his own seven strings pass BEHIND him (director's note): nothing cuts across the figure */}
        {scene.stringsM.map((s, i) => (
          <PuppetString key={i} {...st.m[i]} base={s.base} live={s.live} highlight={null} k={k} />
        ))}
        <Emperor pose={pose} variant="aztec" tone={1} uid="cp-e" />
        {head ? <PuppetString {...head} base={1} live={[0, 1]} highlight={glintAt(frame, 7)} k={k} /> : null}
        {wL ? <PuppetString {...wL.g} drawn={wL.drawn} base={1} live={[0, 1]} highlight={taut > 0.9 ? glintAt(frame, 8) : null} k={k} /> : null}
        {wR ? <PuppetString {...wR.g} drawn={wR.drawn} base={1} live={[0, 1]} highlight={taut > 0.9 ? glintAt(frame, 9) : null} k={k} /> : null}
        <CaptorHand bar={bar} tilt={tilt} at={st.handAt} tone={1} uid="cp-h" />
      </WorldSvg>
    </StringsPage>
  );
};

export default CortessPuppet;
