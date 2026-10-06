import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AZTEC_REALM,
  AztecRealm,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  INK_FULL,
  IncaRealm,
  LABEL_TRAVEL,
  MapPage,
  PlaybookChain,
  TIE_INCA,
  WorldSvg,
  clamp01,
  fellSC,
  makeCamera,
  makeRoute,
  project,
  screenOf,
  smoothstep,
  swayCam,
  type Cam,
  type CamKey,
  type P2,
} from "./vikAmericasShared";

// ---------------------------------------------------------------------------
// IncasEvenKnewTheAztecs — cut B of the clip "Sheppard_Vikings" (Dwarkesh Patel
// with Si Sheppard), Dwarkesh map style, on the shared Americas world
// (vikAmericasShared.tsx, read-only here; cut A = LearningFromEachOther).
//
// THE LINE (sequence 17.351 s -> 20.562 s): "It's not clear to me that the
// Incas even knew the Aztecs existed." Just before it, on camera: Pizarro
// followed Cortes's playbook a decade later.
// DURATION = 77 interval frames (sequence f416 -> f493) + 2 tail frames = 79,
// 24 fps, 1080 x 1920, opaque.
//
// MECHANISM. From the Inca world nothing reaches the Aztec world; the only
// thing that links the two is the orange line the Spaniards carried.
// ACCENT: orange = what is passed on (the playbook chain). Everything native
// and all context is cream. Two labels (both spoken), no numbers.
//
// GESTURES (local frames; nothing else moves)
//   f0        opening state: cut A's finished picture, seen close on the Inca
//             realm (k 2.4, about 2x cut A's wide): the Andes heartland
//             (Cajamarca - Cuzco) centred near y 835, the orange chain's
//             second bow coming in over the open Pacific to its node on
//             Cajamarca, beads arriving. The camera is already drifting.
//   f0-79     beads keep travelling the orange chain, one direction (Mexico ->
//             Peru): the only live connection in the frame.    [the whole line]
//   f8-56     THE CAMERA, one eased pull-back drifting north-west from the Inca
//             heartland to the whole picture (Aztec realm top-left, Inca realm
//             lower-right; cut A's wide, k 1.22, raised 65 px so Cuzco stays
//             above the caption band); it lands on f56, 6 f before "existed" (f62), then
//             creeps in ~3 % to the end.      ["that the Incas even knew the
//             Aztecs" f19-62]
//   f22-30    label INCAS slides up 24 px and fades in over the realm, landing
//             on f30                                              ["Incas" f30]
//   f34-58    a cream dashed tie sets out from the Inca realm's northern tip
//             toward the north-west and thins and fades to nothing far short of
//             the Aztec realm: the shared Inca tie's route, carried on here
//             through the Darien and Panama to about the Costa Rica border,
//             in DeadTie's dash style, fading over its last 40 %
//                                                       ["even knew" f38-48]
//   f46-54    label AZTECS lands on f54 as that realm comes into frame; the
//             Aztec realm is drawn at the lower cream rung (0.7): present, but
//             unknown from where we started                      ["Aztecs" f54]
//   f56-79    handoff: slow creep, beads flowing, the cream gap stays empty
//                                                               ["existed" f62]
//
// SOURCES (CLIP_SPEC verified facts): Tenochtitlan 19.43 N 99.13 W; Panama
// 8.95 N 79.53 W; Tumbes 3.57 S 80.45 W; Cajamarca 7.16 S 78.51 W (16 Nov
// 1532); Cuzco 13.53 S 71.97 W. Aztec Empire c. 1519 after the Commons "Aztec
// Empire 1519 map-fr.svg"; Tawantinsuyu c. 1532 after the Commons "Inca
// Expansion.svg"; Natural Earth 10m coastlines. No known contact between the
// Aztec and Inca states (standard scholarship; the speaker says "not clear").
// ---------------------------------------------------------------------------
export const FPS = 24;
export const DURATION = 79;

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// -- the camera: one keyed, eased track (pchip, open ends: moving at f0) -------
export const CAM_KEYS: CamKey[] = [
  { f: 0, k: 2.4, wx: 715, wy: 1045, sx: 540, sy: 835 },
  { f: 8, k: 2.36, wx: 711, wy: 1039, sx: 540, sy: 835 },
  { f: 56, k: 1.22, wx: 525.5, wy: 813.6, sx: 540, sy: 770 },
  { f: 79, k: 1.255, wx: 525.5, wy: 813.6, sx: 540, sy: 770 },
];
export const camAt = makeCamera(CAM_KEYS);

/** cut A ends on its bead clock 142; any constant keeps the same flow */
const BEAD_CLOCK = 143;
/** the lower cream rung for the realm the Incas never knew (group opacity -> edge 0.7; 0.5 vanished on a phone) */
const AZTEC_RUNG = 0.7 / INK_FULL;

const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const span = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// -- the dead tie, carried further (the shared TIE_INCA route, then on along the
// isthmus: Darien -> Panama -> about the Costa Rica border, 8.75 N 82.8 W). The
// shared DeadTie's dash style (28 px octave dashes, 60 % on, 8 px at the root),
// thinning along the route and fading to nothing over its last 40 %.
const TIE_EXT: P2[] = [project(-78.6, 8.95), project(-79.6, 9.1), project(-80.6, 8.62), project(-81.6, 8.5), project(-82.8, 8.75)];
export const LONG_TIE = (() => {
  const base = TIE_INCA.pts;
  const ctl: P2[] = [base[base.length - 40], base[base.length - 1], ...TIE_EXT];
  const last = ctl[ctl.length - 1];
  const prev = ctl[ctl.length - 2];
  ctl.push([2 * last[0] - prev[0], 2 * last[1] - prev[1]]);
  const pts: P2[] = [...base];
  for (let i = 1; i < ctl.length - 2; i++) {
    const [p0, p1, p2, p3] = [ctl[i - 1], ctl[i], ctl[i + 1], ctl[i + 2]];
    for (let j = 1; j <= 16; j++) {
      const t = j / 16;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 * (2 * b + (cc - a) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (3 * b - a - 3 * cc + d) * t * t * t);
      pts.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return makeRoute({ pts, wpS: [0, len], len });
})();
const TIE_DASH = 28;
const TIE_SEGS = 24;
const LongTie: React.FC<{ cam: Cam; progress: number }> = ({ cam, progress }) => {
  const route = LONG_TIE;
  const head = clamp01(progress) * route.len;
  if (head < 0.05) return null;
  const L2 = Math.log2(cam.k);
  const o = Math.floor(L2);
  const tt = smoothstep((L2 - o - 0.25) / 0.5);
  const a0 = TIE_DASH / Math.pow(2, o);
  const dashes = [
    { p: a0, op: 1 - tt },
    { p: a0 / 2, op: tt },
  ].filter((x) => x.op > 0.001);
  const els: React.ReactNode[] = [];
  for (let i = 0; i < TIE_SEGS; i++) {
    const a = (route.len * i) / TIE_SEGS;
    const b = Math.min(head, (route.len * (i + 1)) / TIE_SEGS);
    if (b - a < 0.01) break;
    const t = (i + 0.5) / TIE_SEGS; // the taper belongs to the route, not to the head
    const op = INK_FULL * (1 - Math.pow(clamp01((t - 0.6) / 0.4), 1.7)); // holds its ink longer than a smoothstep, so the run through Panama reads
    if (op <= 0.01) continue;
    const d = route.partialD(a, b);
    dashes.forEach((q) =>
      els.push(
        <path
          key={`t-${i}-${q.p}`}
          d={d}
          stroke={INK}
          strokeOpacity={op * q.op}
          strokeWidth={(8 * (1 - 0.38 * t)) / cam.k}
          strokeDasharray={`${(q.p * 0.6).toFixed(4)} ${(q.p * 0.4).toFixed(4)}`}
          strokeDashoffset={a.toFixed(4)}
        />,
      ),
    );
  }
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {els}
    </g>
  );
};

// -- labels (world anchors; screen-sized type) --------------------------------
export const LABEL_SIZE = 62;
const LABEL_SPACING = 0.3;
/** INCAS: over the realm, between Cajamarca and Cuzco, clear of the chain's end */
export const INCAS_AT: P2 = [760, 1076];
/** AZTECS: on the land north of the realm, clear of both orange bows (leg 1 leaves
 *  Tenochtitlan to the north-east, leg 2 to the south) */
export const AZTECS_AT: P2 = [AZTEC_REALM.capital[0] + 30, AZTEC_REALM.box.y0 - 50];

/** IM Fell English SC spaced caps on a dark halo, anchored to a world point; slides up
 *  24 px while fading in, landing on f1 (the house entrance, on this cut's frames) */
const Label: React.FC<{ text: string; at: P2; cam: Cam; frame: number; f0: number; f1: number }> = ({ text, at, cam, frame, f0, f1 }) => {
  const op = interpolate(frame, [f0, f0 + (f1 - f0) * 0.75], [0, 1], CLAMP) * INK_FULL;
  if (op <= 0.002) return null;
  const dy = interpolate(frame, [f0, f1], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...CLAMP });
  const [sx, sy] = screenOf(at, cam);
  const trail = LABEL_SIZE * LABEL_SPACING; // letter-spacing trails the last glyph
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx + trail / 2}
        y={sy + dy}
        textAnchor="middle"
        opacity={op}
        fill={INK}
        stroke={DARK}
        strokeOpacity={0.78}
        strokeWidth={LABEL_SIZE * 0.2}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: LABEL_SIZE, letterSpacing: trail }}
      >
        {text}
      </text>
    </svg>
  );
};

const IncasEvenKnewTheAztecs: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam: Cam = swayCam(camAt(frame), frame + BEAD_CLOCK);
  return (
    <MapPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <AztecRealm cam={cam} opacity={AZTEC_RUNG} />
        <IncaRealm cam={cam} />
        <LongTie cam={cam} progress={easeOut(span(frame, 34, 58))} />
        <PlaybookChain cam={cam} frame={frame + BEAD_CLOCK} />
      </WorldSvg>
      <Label text="INCAS" at={INCAS_AT} cam={cam} frame={frame} f0={22} f1={30} />
      <Label text="AZTECS" at={AZTECS_AT} cam={cam} frame={frame} f0={46} f1={54} />
    </MapPage>
  );
};

export default IncasEvenKnewTheAztecs;
