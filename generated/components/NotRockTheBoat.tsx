import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { DARK, camScan, clamp01, makeTrack, pchip, screenOf, smoothstep, swayCam } from "./incaShared";
import {
  CAM_E3,
  CaptorHand,
  EMPEROR_AT,
  Emperor,
  HAND_AT,
  Label,
  NOBLES,
  Noble,
  POSE_HANG,
  PuppetString,
  STRING_W,
  StringsPage,
  WorldSvg,
  add,
  camOf,
  emperorAnchors,
  fistOf,
  nobleRig,
  rot,
  stringPts,
  sub,
  vlen,
  type Cam,
  type P2,
  type StringGeom,
} from "./stringsShared";

// ---------------------------------------------------------------------------
// NotRockTheBoat (31_NotRockTheBoat). Dwarkesh Patel with Si Sheppard, clip
// "Why captured emperors cooperated", cut D of the strings set (stringsShared).
//   "(He was always trying to do what Cortés wanted in a way that would still
//   be) beneficial for his people, but would not rock the boat so much in
//   terms of Cortés's authority."
// Dwarkesh map style, "beyond maps" page. Opaque 1080x1920, 24 fps, 113 f.
// In-point 31.490 s; local frame = round((t - 31.490) * 24):
//   beneficial -2..9 · for 9 · his 14 · PEOPLE 18-24 · BUT 25 · would 31 ·
//   NOT 44 · ROCK 51 · the 59 · BOAT 62-67 · so 67 · much 72 · in 77 ·
//   terms 80 · of 84 · CORTÉS'S 87 · AUTHORITY 98-107; the cut ends f111
//   (f111-f112 = safety tail).
//
// Opens on state E3 (the whole chain: Cortés's hand + bar, three taut orange
// strings to Moctezuma hanging as the puppet, his seven taut orange strings to
// the upright nobles at cream 0.8). THE MECHANISM: strings transmit both ways.
// When the puppet works his own people's strings, the motion goes up his wrist
// strings and rocks the bar above; he learns to move so the bar stays level.
//
// THE GESTURES (each with the words it serves; nothing else):
//   1. "beneficial for his people" f0-f26: opens EXACTLY on E3's framing
//      (CAM_E3) and eases over f0-f17 a little lower and closer (focus
//      (540, 785), k 1.08). His two hands make one slow alternating lift
//      (16 px, period 22 f: left up f5.5, right up f16.5); a soft highlight
//      runs down each of his seven strings (10 f each, staggered, the left
//      hand's four then the right hand's three) and as it lands (f14, 16, 18,
//      20, 22, 24, 26; "people" f18) that noble stands 6 % taller and
//      brightens 0.7 -> 1.0.
//   2. "but would" f17-f46: one glide up to the upper half (focus (540, 405),
//      k 1.15: his wrists, the three orange strings, the bar and the hand in
//      one frame, the bar at screen y ~585). The consequence: his arms' motion
//      has gone up the wrist strings (a highlight rising wrist -> bar on each
//      pull) and the bar ROCKS like a boat on a swell: it pivots through the
//      gauntlet's fixed fist, period 22 f, 3 f behind his wrists, growing to
//      12 deg at f30.5. He feels it: his wrists ride the bar's ends and his
//      whole body swings from the head string with it (0.3 x the tilt, his
//      feet ~20 px).
//   3. "not rock the boat" f31-f64: he stills it. His wrists hold half a beat
//      and then move against the swing, smaller each time (16 px -> 0 by
//      f64), giving a little slack where the bar would have been pulled; the
//      rocking damps swing by swing: 12 deg f30.5, 7 deg f41.5, 3 deg f52.5,
//      dead level from f62 ("boat" f62-67). The strings hang straight.
//   4. "in terms of Cortés's authority" f74-f112: a slow push toward the hand
//      and the level bar (k -> 1.30, focus (540, 300), creeping on to the last
//      frame); one bright highlight goes slowly DOWN each of the three orange
//      strings from the hand (starts f78 / 80.5 / 83, 20 f each: arrives
//      f98-f103 on "authority", and sets off again). "CORTÉS" (IM Fell SC,
//      44 px) slides up beside the gauntlet's cuff from f78, in by f87.
// Built locally (stringsShared untouched): the cross-bar (ROCK_BAR: the
// shared CaptorHand turns fist and bar together; here the hand is drawn with
// bar 0 over a bar that pivots inside the still fist), the body's swing (the
// Emperor in a group rotated about his head-top), the bright highlight.
// Camera: its own C1 track (velocity bumps, incaShared makeTrack) + the house
// sway x min(1, f / 12) (so f0 is CAM_E3 to the pixel); the focus is the world
// point held at screen (540, 835).
// Sources: none on screen (no numbers); the reading of Moctezuma as Cortés's
// willing puppet is the speaker's.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 113;

export const schema = z.object({
  vignette: z.number(),
  /** the bar's rocking at its largest swing, deg */
  rock: z.number(),
  /** his hands' alternating lift, world px */
  lift: z.number(),
  /** how much of the bar's tilt his hanging body swings with */
  swing: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, rock: 12, lift: 16, swing: 0.3 });

// ---- the timeline ----------------------------------------------------------
const W = (2 * Math.PI) / 22;
const LAG = 3;
/** f42 -> f64: his own hands settle */
const STILL: [number, number] = [42, 64];
const settle = (f: number) => 1 - smoothstep((f - STILL[0]) / (STILL[1] - STILL[0]));
/** his hands' alternation (> 0: the left wrist up, the right wrist down), in units of `lift` */
const wristWave = (f: number) => settle(f) * Math.sin(W * f - Math.PI * smoothstep((f - STILL[0]) / 16));
/** the rocking's envelope: grows through gesture 1 to the full swing at f30.5,
 *  then swing by swing 1 -> 7/12 -> 3/12 -> 0 (peaks f41.5, f52.5; level from f62) */
const DAMP = pchip(
  [
    [30.5, 1],
    [41.5, 7 / 12],
    [52.5, 3 / 12],
    [62, 0],
    [64, 0],
  ],
  true,
);
const rockEnv = (f: number) => (f <= 30.5 ? smoothstep((f - 4) / 26.5) : f >= 62 ? 0 : DAMP(f));
/** the bar's tilt in units of `rock` (> 0: its right end down) */
const barWave = (f: number) => rockEnv(f) * Math.sin(W * (f - LAG));

/** gesture 1: the frame the wave lands on noble i (the left hand's four, nearest first, then the right hand's three) */
const LAND = [20, 18, 16, 14, 22, 24, 26];
const WAVE_F = 10;
const mGlint = (i: number, f: number): number => {
  const u = (f - (LAND[i] - WAVE_F)) / WAVE_F;
  if (u <= 1.2) return u;
  const t1 = LAND[i] + 5 + ((i * 5) % 7) * 3;
  return f < t1 ? -1 : ((((f - t1) / 46) % 1) * 1.5 - 0.25);
};
const nobleUp = (i: number, f: number) => smoothstep((f - (LAND[i] - 3)) / 8);

/** gestures 2-3: a pull goes UP a wrist string each time that wrist comes down */
const UP_F = 8;
const UP_R = [1, 22, 44];
const UP_L = [11, 33];
const upGlint = (launches: number[], f: number): number | null => {
  for (const t of launches) if (f >= t && f <= t + UP_F) return 1 - (f - t) / UP_F;
  return null;
};
/** gesture 4: one bright highlight DOWN each of the three strings (head, left wrist, right wrist) */
const DOWN_T0 = [78, 80.5, 83];
const DOWN_F = 20;
const DOWN_EVERY = 27;
const downGlint = (j: number, f: number): number | null => {
  if (f < DOWN_T0[j]) return null;
  const u = ((f - DOWN_T0[j]) % DOWN_EVERY) / DOWN_F;
  return u <= 1.1 ? u : null;
};

// ---- the camera (focus = the world point at screen (540, 835)) --------------
const G1 = { wy: 785, k: 1.08 };
const WY = makeTrack(
  [
    [0, 17, G1.wy - CAM_E3.focus[1], 0.9],
    [17, 46, 405 - G1.wy, 0.8],
    [40, 82, -8, 1],
    [74, 104, -97, 0.8],
    [96, 150, -12, 1],
  ],
  CAM_E3.focus[1],
  -40,
  160,
);
const LNK = makeTrack(
  [
    [0, 17, Math.log(G1.k / CAM_E3.k), 0.9],
    [8, 30, Math.log(1.1 / G1.k), 1],
    [17, 46, Math.log(1.15 / 1.1), 0.8],
    [40, 82, Math.log(1.175 / 1.15), 1],
    [74, 104, Math.log(1.3 / 1.175), 0.8],
    [96, 150, 0.06, 1],
  ],
  Math.log(CAM_E3.k),
  -40,
  160,
);
export const camAt = (f: number): Cam => camOf({ focus: [540, WY(f)], k: Math.exp(LNK(f)) });
export const scanD = () => camScan(camAt, 0, DURATION - 1, [[540, 184]]);

// ---- the scene --------------------------------------------------------------
/** the cross-bar (world px about its pivot, the middle of the fist's grip): E3's bar, drawn here so it can turn inside a still fist */
const BAR = { half: 180, y0: -12, y1: 12, tie: 168, pivot: [HAND_AT[0], HAND_AT[1] + 14] as P2 };
const BAR_FILL = "#D3C5A2";
const GROW = 0.06;
const TONE0 = 0.7;
const CROWN = nobleRig(0).crown[1];
const GLINT = "#FFF3D2";

/** the pose, the body's swing and every anchor (WORLD px) at frame f */
const rigAt = (f: number, rock: number, lift: number, swing: number) => {
  const tilt = rock * barWave(f);
  const sway = swing * rock * barWave(f - 1.5);
  const barEnd = (sg: number): P2 => add(BAR.pivot, rot([sg * BAR.tie, BAR.y1 - 1], tilt));
  // his wrists ride the bar's ends (0.85 of their rise and fall) + his own alternating lift
  const own = lift * wristWave(f);
  const ride = (sg: number) => 0.85 * (barEnd(sg)[1] - (BAR.pivot[1] + BAR.y1 - 1));
  const pose = {
    ...POSE_HANG,
    wristL: [POSE_HANG.wristL[0], POSE_HANG.wristL[1] - own + ride(-1)] as P2,
    wristR: [POSE_HANG.wristR[0], POSE_HANG.wristR[1] + own + ride(1)] as P2,
  };
  const a = emperorAnchors(pose, "aztec");
  // he hangs from the head string: the whole body swings about his head-top
  const pivot = a.headTop;
  const sw = (p: P2): P2 => add(pivot, rot(sub(p, pivot), sway));
  return { tilt, sway, pose, pivot, barL: barEnd(-1), barR: barEnd(1), wristL: sw(a.wristL), wristR: sw(a.wristR), fistL: a.fistL, fistR: a.fistR, sw, feet: sw(EMPEROR_AT) };
};
const REST = rigAt(0, 0, 0, 0);
const L0 = { L: vlen(sub(REST.wristL, REST.barL)), R: vlen(sub(REST.wristR, REST.barR)) };

const Glint: React.FC<{ g: StringGeom; u: number | null; k: number; half: number; op: number }> = ({ g, u, k, half, op }) => {
  if (u === null) return null;
  const a = Math.max(0, u - half);
  const b = Math.min(1, u + half);
  if (b - a < 0.004) return null;
  const d = `M${stringPts(g, a, b)
    .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join("L")}`;
  return <path d={d} fill="none" stroke={GLINT} strokeOpacity={op} strokeWidth={(STRING_W / k) * 0.95} strokeLinecap="butt" />;
};

/** the engraved wooden cross-bar, turning about its pivot */
const RockBar: React.FC<{ tilt: number }> = ({ tilt }) => {
  const h = BAR.half;
  const L = { fill: "none", stroke: DARK, strokeLinecap: "round" as const };
  return (
    <g transform={`translate(${BAR.pivot[0]} ${BAR.pivot[1]}) rotate(${tilt.toFixed(3)})`}>
      <path d={`M${-h},-12L${h},-12L${h + 3},0L${h},12L${-h},12L${-h - 3},0Z`} fill={BAR_FILL} stroke={DARK} strokeWidth={2.3} strokeLinejoin="round" />
      <path d={`M${-h + 8},-6Q${-h * 0.4},-8.5 0,-6T${h - 8},-6.5M${-h + 14},-0.5Q${-h * 0.5},2 ${-h * 0.1},-1T${h - 10},0M${-h + 6},5Q0,7 ${h - 6},5`} {...L} strokeWidth={0.95} strokeOpacity={0.6} />
      <path d={`M${-h + 4},8.5L${h - 4},8.5`} {...L} strokeWidth={2.2} strokeOpacity={0.22} />
      {[-1, 1].map((sg) => (
        <path key={sg} d={[-3.4, 0, 3.4].map((o) => `M${sg * (h - 12) + o},-13L${sg * (h - 12) + o},13`).join("")} {...L} strokeWidth={1.5} strokeOpacity={0.9} />
      ))}
    </g>
  );
};

/** where things are on screen (for the checks and the report) */
export const framing = (f: number) => {
  const cam = camAt(f);
  const r = rigAt(f, defaultProps.rock, defaultProps.lift, defaultProps.swing);
  return { k: +cam.k.toFixed(3), bar: Math.round(screenOf([540, 184], cam)[1]), tilt: +r.tilt.toFixed(2), sway: +r.sway.toFixed(2), wristL: Math.round(screenOf(r.wristL, cam)[1]), wristR: Math.round(screenOf(r.wristR, cam)[1]), feetX: Math.round(screenOf(r.feet, cam)[0]) };
};

const NotRockTheBoat: React.FC<Props> = ({ vignette, rock, lift, swing }) => {
  const frame = useCurrentFrame();
  const base = camAt(frame);
  const swayed = swayCam(base, frame);
  const hw = Math.min(1, frame / 12);
  const cam: Cam = { k: base.k, cx: base.cx + (swayed.cx - base.cx) * hw, cy: base.cy + (swayed.cy - base.cy) * hw };
  const k = cam.k;

  const r = rigAt(frame, rock, lift, swing);
  const up = NOBLES.map((_, i) => nobleUp(i, frame));
  const mGeom: StringGeom[] = NOBLES.map((n, i) => {
    const L = fistOf(i) === "L";
    const j = L ? i - 1.5 : i - 5;
    const fist = L ? r.fistL : r.fistR;
    return { from: r.sw([fist[0] + j * 2.4, fist[1] + 8]), to: [n.x, n.y + CROWN * n.s * (1 + GROW * up[i])] as P2, slack: 0, side: i <= 3 ? -1 : 1 };
  });

  // a wrist string gives a little slack when its ends come nearer than at rest
  const slackOf = (a: P2, b: P2, l0: number) => clamp01((l0 - vlen(sub(b, a)) - 4) / 45);
  const head: StringGeom = { from: [HAND_AT[0], HAND_AT[1] + 25], to: r.pivot, slack: 0 };
  const wl: StringGeom = { from: r.barL, to: r.wristL, slack: slackOf(r.barL, r.wristL, L0.L), side: -1 };
  const wr: StringGeom = { from: r.barR, to: r.wristR, slack: slackOf(r.barR, r.wristR, L0.R), side: 1 };

  const dn = [0, 1, 2].map((j) => downGlint(j, frame));
  const upL = upGlint(UP_L, frame);
  const upR = upGlint(UP_R, frame);
  const cStrings: { g: StringGeom; soft: number | null; bright: number | null; faint: number | null }[] = [
    { g: head, soft: dn[0], bright: dn[0], faint: null },
    { g: wl, soft: dn[1] ?? upL, bright: dn[1], faint: upL },
    { g: wr, soft: dn[2] ?? upR, bright: dn[2], faint: upR },
  ];

  return (
    <StringsPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        {NOBLES.map((n, i) => (
          <Noble key={i} i={i} bow={0} tone={TONE0 + (1 - TONE0) * up[i]} scale={n.s * (1 + GROW * up[i])} uid={`nrb-n${i}`} />
        ))}
        <g transform={`rotate(${r.sway.toFixed(3)} ${r.pivot[0].toFixed(2)} ${r.pivot[1].toFixed(2)})`}>
          <Emperor pose={r.pose} variant="aztec" tone={1} uid="nrb-e" />
        </g>
        {mGeom.map((g, i) => {
          const u = mGlint(i, frame);
          return (
            <g key={i}>
              <PuppetString {...g} base={1} live={[0, 1]} highlight={u} k={k} />
              {frame <= LAND[i] + 2 ? <Glint g={g} u={u} k={k} half={0.05} op={0.45} /> : null}
            </g>
          );
        })}
        {cStrings.map((s, i) => (
          <g key={i}>
            <PuppetString {...s.g} base={1} live={[0, 1]} highlight={s.soft} k={k} />
            <Glint g={s.g} u={s.faint} k={k} half={0.06} op={0.4} />
            <Glint g={s.g} u={s.bright} k={k} half={0.07} op={0.9} />
          </g>
        ))}
        {/* the bar turns inside the fist; the gauntlet (drawn over it, without its own bar) never moves */}
        <RockBar tilt={r.tilt} />
        <CaptorHand bar={0} tilt={0} at={HAND_AT} tone={1} uid="nrb-h" />
      </WorldSvg>
      <Label text="CORTÉS" x={770} y={22} cam={cam} frame={frame} f0={78} size={44} />
    </StringsPage>
  );
};

export default NotRockTheBoat;
