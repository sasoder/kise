// ---------------------------------------------------------------------------
// Complete180 (file 20_Complete180; round 2 of the "strings" set; Dwarkesh
// Patel with Si Sheppard, "Why captured emperors cooperated"). Dwarkesh map
// style, "beyond maps" umber page; the world is stringsShared (frozen, used
// as-is). Opaque 1080x1920, 24 fps, 61 frames (f0..f60). Sequence in 20.771 s.
// It sits back to back between PsychologicalBreak and CortessPuppet:
//   f0  = PsychologicalBreak's last frame (state E2 + "CORTÉS" beside the cuff)
//   f60 = CortessPuppet's f0 (state E2, no label, his seven strings BEHIND him)
//
// THE LINE: "(because once Cortés had hold of him,) he seems to have pulled a
// complete 180 switch (and become...)"
//
// WORD -> LOCAL FRAME: he 1 · SEEMS 3 · to 9 · have 12 · PULLED 17 · a 26 ·
//   COMPLETE 30 · 180 41 · SWITCH 48-55 · [and 55] · ends f59 (+2 safety).
//
// THE GESTURES (each with the word it serves; nothing else)
//   1. "he seems to have" f0-f16: E2 holding, alive: the highlight travels down
//      the one orange string, the slack dead strings sway (PsychologicalBreak's
//      sway carried on). "CORTÉS" slides down 24 px and fades out f6-f22.
//   2. "pulled a complete 180 switch" f17-f52: hanging from the one orange
//      string he TURNS half a turn on it, a marionette twisting on its string:
//      one eased rotation about the vertical under the grip (x 540), drawn as
//      the figure's width = |cos(angle)| (1 -> 0.06 -> 1), edge-on f39-f40
//      ("180" f41), frontal again f52 ("switch"). While narrow he is shaded
//      (down to 0.8); his hanging arms swing out with the turn, lag, and settle
//      by f59; the string twists just above his head (a two-ply wrap growing
//      from f22, relaxing f46-f58); the head string's lower end follows the top
//      of his head in to the axis and out again; the dead strings follow his
//      hands. At edge-on his seven strings pass from in front of him
//      (PsychologicalBreak's order) to behind him (CortessPuppet's order). He
//      ends in exactly E2's pose: frontal, NOT mirrored.
//   3. "complete 180 switch" f30-f56: the nobles watch him turn: each lifts its
//      bowed head a little and sinks back (bow 0.35 -> 0.2 -> 0.35, 16 f each),
//      staggered outside-in 1.6 f apart.
//   CAMERA: CAM_E2 (the preset) with a 1.3 % creep in and back; f0 and f60 are
//      CAM_E2 exactly.
// NOT DONE: the hem does not swing (the figure's cloak is not articulated and
//   the shared module is frozen); only the arms do.
// SOURCES: none needed (no figures or dates; the name was set the cut before).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, DARK, pchip, smootherstep, smoothstep } from "./incaShared";
import {
  CAM_E2,
  CaptorHand,
  E2,
  Emperor,
  Label,
  N_NOBLES,
  Noble,
  POSE_SLUMP,
  PuppetString,
  STRING_W,
  StringsPage,
  TONE,
  WorldSvg,
  camOf,
  outsideRank,
  sceneStrings,
  type EmperorPose,
  type P2,
  type Scene,
  type StringGeom,
} from "./stringsShared";
import { defaultProps as PB_PROPS, DURATION as PB_DURATION } from "./PsychologicalBreak";

export const FPS = 24;
export const DURATION = 61;
const LAST = DURATION - 1;

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---- timing -----------------------------------------------------------------
const T = {
  label: [6, 22] as const,
  turn: [17, 52] as const,
  edge: 39.5,
  nobles: 30,
  nobleStep: 1.6,
  noble: 16,
};
/** the vertical he turns about: under the grip */
const AXIS = 540;
const MIN_W = 0.06;

/** his angle (rad): 0 -> pi, weighty off the mark, edge-on at T.edge, no overshoot */
const ANGLE = pchip([
  [0, 0],
  [T.turn[0], 0],
  [27, 0.5],
  [T.edge, Math.PI / 2],
  [47, 2.82],
  [T.turn[1], Math.PI],
  [LAST, Math.PI],
]);
const turnAt = (f: number) => {
  if (f <= T.turn[0]) return { w: 1, shade: 1, a: 0 };
  if (f >= T.turn[1]) return { w: 1, shade: 1, a: Math.PI };
  const a = ANGLE(f);
  const c = Math.abs(Math.cos(a));
  return { w: Math.max(MIN_W, c), shade: 1 - 0.2 * Math.pow(Math.sin(a), 2), a };
};
/** the arms' swing outward (world px): grows with the turn, lags, settles by f59 */
const swingAt = (f: number) => 15 * smoothstep((f - 23) / 19) * (1 - smootherstep((f - 46) / 13));
/** the string's twist above his head: 0..1 */
const twistAt = (f: number) => smoothstep((f - 22) / 17) * (1 - smootherstep((f - 46) / 12));

// ---- the joins --------------------------------------------------------------
// the head string's highlight: PsychologicalBreak leaves it at glintAt(90, 7),
// CortessPuppet takes it up at glintAt(0, 7); one more lap in between
const frac = (v: number) => v - Math.floor(v);
const G0 = frac((PB_DURATION - 1 + 7 * 13.7) / 46);
const G1 = frac((7 * 13.7) / 46) + 1;
const glint = (f: number) => frac(G0 + ((G1 - G0) * f) / LAST) * 1.5 - 0.25;
/** the dead strings' sway: PsychologicalBreak's periods, eased so each crosses zero on f60 too */
const swayAt = (f: number, i: number) => {
  const period = 31 + 5.3 * ((i * 3) % 7);
  const laps = LAST / period;
  const target = Math.round(laps * 2) / 2;
  return Math.sin(2 * Math.PI * (f / period + (target - laps) * smoothstep(f / LAST)));
};

const sq = (p: P2, w: number): P2 => [AXIS + (p[0] - AXIS) * w, p[1]];
const pathOf = (pts: P2[]) => `M${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}`;

/** the twisted stretch of the head string: two plies wound round each other */
const TWIST_S: [number, number] = [0.7, 0.97];
const Twist: React.FC<{ g: StringGeom; tw: number; k: number }> = ({ g, tw, k }) => {
  const [a, b] = TWIST_S;
  const A: P2 = [g.from[0] + (g.to[0] - g.from[0]) * a, g.from[1] + (g.to[1] - g.from[1]) * a];
  const B: P2 = [g.from[0] + (g.to[0] - g.from[0]) * b, g.from[1] + (g.to[1] - g.from[1]) * b];
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
  const n: P2 = [-(B[1] - A[1]) / len, (B[0] - A[0]) / len];
  const wraps = 1.2 + 1.5 * tw;
  const amp = 6.5 * tw;
  const ply = (sgn: number): P2[] =>
    Array.from({ length: 49 }, (_, j) => {
      const v = j / 48;
      const o = sgn * amp * Math.sin(Math.PI * v) * Math.sin(2 * Math.PI * wraps * v);
      return [A[0] + (B[0] - A[0]) * v + n[0] * o, A[1] + (B[1] - A[1]) * v + n[1] * o] as P2;
    });
  const w = STRING_W / k;
  const back = pathOf(ply(-1));
  const front = pathOf(ply(1));
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="butt">
      <path d={back} stroke={DARK} strokeOpacity={0.5} strokeWidth={w + 2.6 / k} />
      <path d={back} stroke={ACCENT_DEEP} strokeWidth={w * 1.2} />
      <path d={front} stroke={DARK} strokeOpacity={0.5} strokeWidth={w + 2.6 / k} />
      <path d={front} stroke={ACCENT_DEEP} strokeWidth={w * 1.5} />
      <path d={front} stroke={ACCENT} strokeWidth={w * 0.92} />
    </g>
  );
};

const Complete180: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const f = frame;

  // ---- camera: CAM_E2, a 1.3 % creep in and back ----
  const cam = camOf({ focus: CAM_E2.focus, k: CAM_E2.k * (1 + 0.013 * Math.pow(Math.sin((Math.PI * f) / LAST), 2)) });
  const k = cam.k;

  // ---- him ----
  const { w, shade } = turnAt(f);
  const sw = swingAt(f);
  const pose: EmperorPose =
    sw > 0
      ? {
          ...POSE_SLUMP,
          wristL: [POSE_SLUMP.wristL[0] - sw, POSE_SLUMP.wristL[1] - 0.3 * sw],
          wristR: [POSE_SLUMP.wristR[0] + sw, POSE_SLUMP.wristR[1] - 0.3 * sw],
        }
      : POSE_SLUMP;

  // ---- the nobles watch him turn ----
  const nobles = E2.nobles.map((n, i) => {
    const t = (f - T.nobles - T.nobleStep * outsideRank(i)) / T.noble;
    const lift = t <= 0 || t >= 1 ? 0 : Math.pow(Math.sin(Math.PI * smoothstep(t)), 2);
    return { bow: n.bow - 0.15 * lift, tone: n.tone };
  });

  const scene: Scene = {
    ...E2,
    emperor: pose,
    nobles,
    stringsM: E2.stringsM.map((s, i) => ({ ...s, slack: 1, sag: 0.17 * (1 + 0.045 * swayAt(f, i)), base: TONE.dead, live: null })),
  };
  const st = sceneStrings(scene);
  // the strings' ends on him follow the turn
  const m = st.m.map((g) => ({ ...g, from: sq(g.from, w) }));
  const head: StringGeom | null = st.c.head ? { ...st.c.head, to: sq(st.c.head.to, w) } : null;
  const tw = twistAt(f);

  const stringsM = Array.from({ length: N_NOBLES }, (_, i) => <PuppetString key={i} {...m[i]} base={TONE.dead} live={null} highlight={null} k={k} />);
  const behind = f >= T.edge;

  const labelOut = smoothstep((f - T.label[0]) / (T.label[1] - T.label[0]));

  return (
    <StringsPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        {nobles.map((n, i) => (
          <Noble key={i} i={i} bow={n.bow} tone={n.tone} uid={`c180-n${i}`} />
        ))}
        {behind ? stringsM : null}
        {w < 1 ? (
          <g style={{ filter: `brightness(${shade.toFixed(3)})` }}>
            <g transform={`translate(${AXIS} 0) scale(${w.toFixed(4)} 1) translate(${-AXIS} 0)`}>
              <Emperor pose={pose} variant="aztec" tone={1} uid="c180-e" />
            </g>
          </g>
        ) : (
          <Emperor pose={pose} variant="aztec" tone={1} uid="c180-e" />
        )}
        {behind ? null : stringsM}
        {head ? (
          tw > 0.001 ? (
            <>
              <PuppetString {...head} base={1} live={[0, 1]} drawn={[0, TWIST_S[0]]} highlight={glint(f)} k={k} />
              <PuppetString {...head} base={1} live={[0, 1]} drawn={[TWIST_S[1], 1]} highlight={glint(f)} k={k} />
              <Twist g={head} tw={tw} k={k} />
            </>
          ) : (
            <PuppetString {...head} base={1} live={[0, 1]} highlight={glint(f)} k={k} />
          )
        ) : null}
        <CaptorHand bar={0} tilt={0} at={st.handAt} tone={1} uid="c180-h" />
      </WorldSvg>
      {labelOut < 1 ? (
        <Label text="CORTÉS" x={PB_PROPS.labelX} y={PB_PROPS.labelY} cam={cam} frame={1000} f0={0} size={44} opacity={1 - labelOut} dy={24 * labelOut} />
      ) : null}
    </StringsPage>
  );
};

export default Complete180;
