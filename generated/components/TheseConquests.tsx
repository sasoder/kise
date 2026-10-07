import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUZCO, EMPIRE_BORDER_D, EMPIRE_BOX, EMPIRE_D, REALM_BORDER_D, REALM_BOX, REALM_D, TENOCHTITLAN } from "./americasMapData";
import { DARK, FRAME_H, FRAME_W, INK, Mottle, PaperTop, SEA, camFor, camTransform, clamp01, screenOf, smoothstep, worldOf, type Cam, type P2 } from "./incaShared";
import { CaptorHand, Emperor, HAND_S, POSE_UPRIGHT, PuppetString, emperorAnchors, glintAt, lerpPose, type EmperorPose, type Variant } from "./stringsShared";

// ---------------------------------------------------------------------------
// TheseConquests (cut J, THE OPENING of the Sheppard "strings" set: "Why
// captured emperors cooperated"). Dwarkesh map style: the Americas world of
// HierarchicalNatureV2 (north-up Mercator, Natural Earth land, no modern
// borders) with the clip's cast (stringsShared: the engraved emperors, the
// captor's gauntlet, PuppetString) standing on it. Opaque 1080x1920, 24 fps.
//
// THE LINE (sequence 0.751-4.129 s; local f = round((t - 0.751) * 24)):
//   "(What I find interesting) about these conquests is that once the emperors
//    captured (...)"
//   about f8 · these f13 · CONQUESTS f17-28 · is f28 · that f34 · once f40 ·
//   the f52 · EMPERORS f57 · CAPTURED f68-78 · ends f81.
//   DURATION = ceil(3.378 * 24) + 2 = 84 frames.
//
// THE PICTURE: two empires, two emperors, and the hand that takes each by a
// string. ONE ACCENT: orange = THE LIVE HOLD (a string being pulled), nothing
// else. No labels (the names are spoken after the cut, over the speaker).
//
// GESTURES (the only ones)
//   1. f0-f83   the map from Mexico to Peru, the Aztec empire upper left,
//               Tawantinsuyu lower right, both in faint cream hatch (0.28) with
//               their capitals as cream dots; ONE continuous 4 % push
//               (k 0.788 -> 0.82) with a slight drift, never at rest.
//               (Director's reframe: Tenochtitlan (335, 626), Cuzco (758, 1148)
//               at the end; the largest scale that keeps Atahualpa's feet above
//               the caption line and leaves Moctezuma a gauntlet overhead.)
//   2. "about these conquests" f6-f30: a crisp front spreads from each capital
//               (Tenochtitlan f6-f16, Cuzco f14-f28) raising the empire's hatch
//               and border to 0.8; on each capital its emperor slides up 24 px
//               while fading in (Moctezuma f10-f24, Atahualpa f16-f30): the
//               clip's own figures, ~330 / 310 px tall, a contact shade under
//               the feet and a dark casing so they stand ON the map.
//   3. "once the emperors captured" f37-f74: a gauntlet comes down from the top
//               edge over each emperor (Moctezuma's f42-f56; Atahualpa's
//               f36-f64, further down the frame, ~24 px / frame at most), each
//               trailing one string whose end lands on the emperor's head
//               (f55, f59: "emperors" f57). On "captured" each string lights
//               ORANGE from the hand downward (f65-f69, f66-f70) and goes taut;
//               the hand lifts and the emperor comes ~14 px off his capital
//               (f67-f73, f68-f74): head tips, arms hang. As he is lifted his
//               empire's hatch dims to 0.45 as a front from the capital
//               outward (f67-f73, f68-f74).
//   4. f74-f83  living hold: both hang on taut orange strings, a slight swing
//               (each on his own clock), highlights travelling down the
//               strings, the push continuing.
//
// SOURCES / WHAT IS SCHEMATIC
//   Map + empire outlines + capitals: americasMapData (Natural Earth 10m;
//   Aztec empire 1519 after the Commons "Aztec Empire 1519 map-fr.svg";
//   Tawantinsuyu 1532 after the Commons "Inca Expansion.svg"); the wide raster
//   is public/conquests/wide.png (scripts/bake-conquests-raster.mjs: the same
//   stack as the americas levels, drawn for k 0.82; the americas base level
//   only fills the frame down to k 0.885).
//   The emperors are far larger than map scale (chess kings on a board); the
//   gauntlet is the clip's captor (Cortés / Pizarro), no bar yet.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 84;

export const schema = z.object({
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---- the camera: one continuous push ----------------------------------------
const K_END = 0.82;
const PUSH = 1.04;
/** the end frame: Tenochtitlan at screen (335, 626); Cuzco then stands at (758, 1148) */
const CAM_END: Cam = camFor(TENOCHTITLAN, K_END, 335, 626);
/** the push grows from the top edge (the land is baked only up to lat 57: the frame's top never rises) */
const PIVOT_S: P2 = [540, 0];
const PIVOT_W = worldOf(PIVOT_S, CAM_END);
const cameraAt = (f: number): Cam => {
  const u = (f - (DURATION - 1)) / (DURATION - 1); // -1 .. 0
  const k = K_END * Math.pow(PUSH, u);
  return camFor(PIVOT_W, k, PIVOT_S[0] + 5 * u, PIVOT_S[1] + 6 * u);
};

// ---- the wide raster ----------------------------------------------------------
const WIDE = { src: "conquests/wide.png", x0: -210, y0: -360, W: 1898, H: 3276, s: 1.3 };

// ---- easing ---------------------------------------------------------------------
const ss = (f: number, a: number, b: number) => smoothstep((f - a) / (b - a));
/** 0..1 over [a, b]: full speed for the first `flat` of the time, then a cosine run-out (it arrives from off-frame already moving) */
const glide = (f: number, a: number, b: number, flat: number) => {
  const t = clamp01((f - a) / (b - a));
  const total = flat + (1 - flat) / 2;
  if (t <= flat) return t / total;
  const x = (t - flat) / (1 - flat);
  return (flat + (1 - flat) * (x / 2 + Math.sin(Math.PI * x) / (2 * Math.PI))) / total;
};

// ---- an empire: cream hatch + dashed border, its level set by two fronts --------
const HATCH_GAP = 9 / K_END; // world px
const HATCH_W = 1.9 / K_END;
const LVL = { faint: 0.28, full: 0.8, headless: 0.45 };
const gray = (v: number) => {
  const g = Math.round(255 * clamp01(v));
  return `rgb(${g},${g},${g})`;
};
const Empire: React.FC<{
  id: string;
  d: string;
  borderD: string;
  box: { x0: number; x1: number; y0: number; y1: number };
  capital: P2;
  /** world radius of the front that raises it, and of the one that dims it */
  rise: number;
  dim: number;
}> = ({ id, d, borderD, box, capital, rise, dim }) => {
  const M = 24;
  const r = { x: box.x0 - M, y: box.y0 - M, width: box.x1 - box.x0 + 2 * M, height: box.y1 - box.y0 + 2 * M };
  return (
    <g>
      <defs>
        <pattern id={`${id}-hatch`} patternUnits="userSpaceOnUse" width={HATCH_GAP} height={HATCH_GAP} patternTransform="rotate(45)">
          <line x1={HATCH_GAP / 2} y1={-1} x2={HATCH_GAP / 2} y2={HATCH_GAP + 1} stroke={INK} strokeWidth={HATCH_W} />
        </pattern>
        <mask id={`${id}-lvl`} maskUnits="userSpaceOnUse" {...r}>
          <rect {...r} fill={gray(LVL.faint / LVL.full)} />
          {rise > 0.01 ? <circle cx={capital[0]} cy={capital[1]} r={rise} fill="#fff" /> : null}
          {dim > 0.01 ? <circle cx={capital[0]} cy={capital[1]} r={dim} fill={gray(LVL.headless / LVL.full)} /> : null}
        </mask>
      </defs>
      <g mask={`url(#${id}-lvl)`} opacity={LVL.full}>
        <path d={d} fillRule="evenodd" fill={`url(#${id}-hatch)`} />
        <path d={d} fillRule="evenodd" fill={INK} fillOpacity={0.13} />
        <path d={borderD} fill="none" stroke={INK} strokeWidth={2.4 / K_END} strokeDasharray={`${7 / K_END} ${5 / K_END}`} strokeLinejoin="round" />
      </g>
    </g>
  );
};

// ---- the cast -------------------------------------------------------------------
/** a king on his square: the clip's ruling pose (E1: upright, fists raised at the chest) */
const POSE_STAND: EmperorPose = POSE_UPRIGHT;
/** taken by the head string: lifted off his feet, head tipped and bowed, arms hanging */
const POSE_TAKEN = (side: number, lift: number): EmperorPose => ({
  head: 13 * side,
  nod: 0.7,
  slump: 0.42,
  lean: 0,
  wristL: [-55, -108],
  wristR: [58, -106],
  fistL: 0,
  fistR: 0,
  hang: lift,
  limp: 1,
});
/** figures are drawn at this many screen px per figure px at the END frame (they ride the push) */
const FIG_S = 0.98;
const HAND_SCALE = 0.9;
const LIFT = 14.5; // figure px (~14 screen px)

type Actor = {
  id: string;
  variant: Variant;
  capital: P2;
  side: number;
  /** slide-up + fade */
  enter: [number, number];
  /** the string's end: leaves the top edge, lands on his head */
  tip: [number, number];
  /** the gauntlet's descent and where its grip ends (screen y at the end frame) */
  hand: [number, number];
  handY: number;
  /** orange front, lift */
  light: [number, number];
  lift: [number, number];
  swingPeriod: number;
  swingAmp: number;
};
const ACTORS: Actor[] = [
  { id: "moc", variant: "aztec", capital: TENOCHTITLAN, side: 1, enter: [10, 24], tip: [39, 55], hand: [42, 56], handY: 175, light: [65, 69], lift: [67, 73], swingPeriod: 34, swingAmp: 1.1 },
  { id: "ata", variant: "inca", capital: CUZCO, side: -1, enter: [16, 30], tip: [34, 59], hand: [36, 64], handY: 494, light: [66, 70], lift: [68, 74], swingPeriod: 42, swingAmp: -0.95 },
];
const HAND_START_Y = -62;

const ActorLayer: React.FC<{ a: Actor; cam: Cam; frame: number }> = ({ a, cam, frame }) => {
  const zoom = cam.k / K_END;
  const e = FIG_S * zoom;
  const hs = HAND_SCALE * zoom;
  const [cx, cy] = screenOf(a.capital, cam);

  // the emperor
  const inT = ss(frame, a.enter[0], a.enter[1]);
  const taken = ss(frame, a.lift[0], a.lift[1]);
  // the arms let go as the string lights, the body follows the lift
  const arms = ss(frame, a.light[0], a.lift[1]);
  const body = lerpPose(POSE_STAND, POSE_TAKEN(a.side, LIFT), taken);
  const limbs = lerpPose(POSE_STAND, POSE_TAKEN(a.side, LIFT), arms);
  const pose: EmperorPose = { ...body, wristL: limbs.wristL, wristR: limbs.wristR, fistL: limbs.fistL, fistR: limbs.fistR, limp: limbs.limp };
  const riseDy = 24 * (1 - inT);
  const anchors = emperorAnchors(pose, a.variant, [0, 0]);
  // lifted, he hangs with the top of his head under the grip
  const fx = cx - anchors.headTop[0] * e * taken;
  const head: P2 = [fx + anchors.headTop[0] * e, cy + riseDy + anchors.headTop[1] * e];

  // the hand: down from the top edge, then up by the lift
  const down = glide(frame, a.hand[0], a.hand[1], 0.65);
  const handY = HAND_START_Y + (a.handY - HAND_START_Y) * down - LIFT * e * taken;
  const grip: P2 = [cx, handY + 30 * HAND_S * hs];

  // the string: its end falls from the top edge to his head, lies loose, then the pull
  const fall = glide(frame, a.tip[0], a.tip[1], 0.7);
  const landed = frame >= a.tip[1];
  const tipY = Math.max(grip[1] + 4, -14 + (head[1] + 14) * fall);
  const to: P2 = landed ? head : [cx + 5 * Math.sin(frame / 2.6 + a.side) * (1 - fall), tipY];
  const loose = landed ? 0.2 + 0.34 * ss(frame, a.tip[1], a.tip[1] + 5) : 0.2;
  const tautFrom = 1 - ss(frame, a.light[0] - 1, a.light[0] + 2);
  const tautTo = 1 - ss(frame, a.light[0], a.light[1] + 1);
  const lit = clamp01((frame - a.light[0]) / (a.light[1] - a.light[0]));
  const showString = frame >= a.tip[0] && to[1] > grip[1] + 2;
  const isTaut = tautTo < 0.05 && lit >= 1;

  // the swing: he hangs from the grip
  const swing = a.swingAmp * ss(frame, a.lift[0] + 1, a.lift[1] + 4) * Math.sin(((frame - a.lift[0] - 1) / a.swingPeriod) * 2 * Math.PI);

  const shade = inT * (1 - 0.4 * taken);
  return (
    <g>
      <defs>
        <radialGradient id={`${a.id}-shade`}>
          <stop offset="0" stopColor={DARK} stopOpacity={0.78} />
          <stop offset="0.55" stopColor={DARK} stopOpacity={0.42} />
          <stop offset="1" stopColor={DARK} stopOpacity={0} />
        </radialGradient>
        <filter id={`${a.id}-case`} filterUnits="userSpaceOnUse" x={-230} y={-440} width={460} height={520}>
          <feMorphology in="SourceAlpha" operator="dilate" radius={22} result="wide" />
          <feGaussianBlur in="wide" stdDeviation={11} result="margin" />
          <feFlood floodColor={DARK} floodOpacity={0.34} />
          <feComposite in2="margin" operator="in" result="dimmed" />
          <feMorphology in="SourceAlpha" operator="dilate" radius={4.2} result="near" />
          <feGaussianBlur in="near" stdDeviation={0.6} result="edge" />
          <feFlood floodColor={DARK} floodOpacity={0.9} />
          <feComposite in2="edge" operator="in" result="casing" />
          <feMerge>
            <feMergeNode in="dimmed" />
            <feMergeNode in="casing" />
          </feMerge>
        </filter>
      </defs>
      {/* the contact shade on his capital */}
      {shade > 0.003 ? (
        <ellipse cx={cx} cy={cy + 3 * e} rx={(78 - 14 * taken) * e} ry={(17 - 3 * taken) * e} fill={`url(#${a.id}-shade)`} opacity={shade} />
      ) : null}
      {/* the capital, between his feet */}
      <circle cx={cx} cy={cy} r={8.4 * zoom} fill={DARK} fillOpacity={0.7} />
      <circle cx={cx} cy={cy} r={6 * zoom} fill={INK} />
      <g transform={`rotate(${swing.toFixed(3)} ${grip[0].toFixed(2)} ${grip[1].toFixed(2)})`}>
        {inT > 0.003 ? (
          <g transform={`translate(${fx.toFixed(2)} ${(cy + riseDy).toFixed(2)}) scale(${e.toFixed(5)})`} opacity={inT}>
            <g filter={`url(#${a.id}-case)`}>
              <Emperor pose={pose} variant={a.variant} at={[0, 0]} uid={`${a.id}-c`} />
            </g>
            <Emperor pose={pose} variant={a.variant} at={[0, 0]} uid={`${a.id}-e`} />
          </g>
        ) : null}
        {showString ? (
          <PuppetString
            from={grip}
            to={to}
            slack={[loose * tautFrom, loose * tautTo]}
            sag={0.2}
            side={a.side}
            base={1}
            live={lit > 0.001 ? [0, lit] : null}
            highlight={isTaut ? glintAt(frame, a.side > 0 ? 0 : 1, 26) : null}
            k={1}
            width={3.8 * zoom}
          />
        ) : null}
      </g>
      {down > 0 || frame >= a.hand[0] - 4 ? (
        <g transform={`translate(${cx.toFixed(2)} ${handY.toFixed(2)}) scale(${hs.toFixed(5)})`}>
          <CaptorHand bar={0} at={[0, 0]} uid={`${a.id}-h`} />
        </g>
      ) : null}
    </g>
  );
};

const TheseConquests: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  // fronts (world px): the Aztec empire reaches ~95 px from Tenochtitlan, the realm ~480 px from Cuzco
  const fr = (a: number, b: number, R: number) => {
    const t = clamp01((frame - a) / (b - a));
    return R * (1 - (1 - t) * (1 - t) * (1 - 0.35 * t));
  };
  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <Img
        src={staticFile(WIDE.src)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: WIDE.W,
          height: WIDE.H,
          transformOrigin: "0 0",
          transform: `translate(${(tx + WIDE.x0 * k).toFixed(3)}px, ${(ty + WIDE.y0 * k).toFixed(3)}px) scale(${(k / WIDE.s).toFixed(6)})`,
        }}
      />
      <Mottle cam={cam} opacity={0.9} />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={camTransform(cam).svg}>
          <Empire id="tc-az" d={EMPIRE_D} borderD={EMPIRE_BORDER_D} box={EMPIRE_BOX} capital={TENOCHTITLAN} rise={fr(6, 16, 100)} dim={fr(67, 73, 100)} />
          <Empire id="tc-in" d={REALM_D} borderD={REALM_BORDER_D} box={REALM_BOX} capital={CUZCO} rise={fr(14, 28, 500)} dim={fr(68, 74, 500)} />
        </g>
        {/* the far one first: Moctezuma (upper left), then Atahualpa in front */}
        {ACTORS.map((a) => (
          <ActorLayer key={a.id} a={a} cam={cam} frame={frame} />
        ))}
      </svg>
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default TheseConquests;
