import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, clamp01, rectPath } from "./stoutShared";
import {
  DARK,
  DTS,
  FPS,
  FRAME_P,
  SAFE_P,
  DtsStage,
  GLYPH_STROKE,
  ObjectShadow,
  Person,
  Screen,
  camJerk,
  dtsAmberBandP,
  dtsCameraTrackP,
  reachFrame,
  screenBox,
  screenLight,
  toScreenP,
  toneAt,
  hash01,
} from "./dtsShared";

// ---------------------------------------------------------------------------
// FormatWorks — cut B of Toto Wolff, "why Drive to Survive worked" (Cheeky Pint S4E01), on the DTS world
// (dtsShared.tsx; briefs out/dts/briefs/BRIEF.md + BRIEF_9x16.md). Cheeky Pint S4 stout system, palette B1.
// PASS 3: 9:16, 1080x1920, 24 fps, opaque (portrait stage). The 16:9 version (delivered) is kept in
// out/dts/P/landscape/. Replaces the picture at seq 16.200-19.240 (the host's question).
//
// THE LINE: "Why does the format work particularly well for F1?"
// DURATION = ceil((19.240 - 16.200) x 24) = ceil(72.96) = 73 f, no tail (the graphic fits the interval).
// ONSETS (f): why 0 · does 4 · the 9 · format 13 · work 23 · particularly 31 · well 44 · for 53 · f1 60 ·
//   speech ends 68.
//
// THE ACCENT RULE: amber = Drive to Survive's light, the show's screen and whatever its light reaches.
// Only F1's screen is on; its light is the only amber, and only the people standing in it are amber. The
// two copies of the format (cycling above, tennis below) are the identical bezel with a board face: no
// light, and their few people stay DARK.
//
// ONE MOTION: one pull-out from the lit F1 screen to ONE centred column of three identical screens: the same
// format three times, and only F1's has the light (and the audience).
// GESTURES (gesture -> word -> frames)
//   1. f0: close on THE SCREEN (DTS.SCREEN, outer 720 world px = 1044 px on screen, 97 % of the width,
//      centred on y 640), the show on, its light pool on the ground under it, six amber people standing in it
//      -> "why does" -> f0. The portrait frame is tall: the cycling copy above shows only its bezel's foot
//      (glyph off frame); the racket copy's top shows below y 1230, in the caption band. Hiding both would
//      need the column pitch ~1.4x, i.e. a wide of ~32 % width.
//   2. ONE pull-out (k 1.2 -> K_WIDE, glide f-4..f38, already moving on f0; the follower lands it ~f46)
//      reveals the column: the cycling copy ABOVE, F1 in the middle, the racket copy BELOW (same bezel,
//      size, pitch), board faces with a bicycle / a tennis racket + ball knocked out: the format copied
//      -> "the format" (f13) -> f0..f46. The column's box is centred on y 835 inside y 200-1400.
//   3. The walkers trickle only toward the F1 screen along its front row, each a smooth glide at its own
//      speed, passing in front of no one (asserted), decelerating into the crowd's fringe; each crossfades
//      DARK -> amber (13 f) as it crosses the light's front (|x| 450 - a hashed 0..30): W3 enters from the
//      right, W1 from the left; W2, the slowest, is still DARK and still walking toward the light at the
//      cut -> the motion layer under "work particularly well".
//   4. The pull-out settles into a slow creep-in (glide f40..f96) -> "particularly well for F1" -> f46..f72.
//      F1's screen the only lit thing, its light on its audience the answer. No "?".
//   The DARK people at the copies never change. CLICK: none (no LightSweep: nothing in the line clicks).
// Nothing else (no logos, no type).
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 73;
export const BEATS = { why: 0, does: 4, the: 9, format: 13, work: 23, particularly: 31, well: 44, for: 53, f1: 60, ends: 68 } as const;

// -- the layout (world px): one centred column -------------------------------------------------------------
const SCR = DTS.SCREEN; // THE SCREEN (centre 0, 0, outer 720)
const BOX = screenBox(SCR.x, SCR.y, SCR.w);
/** This cut's one person size (world px): >= 72 px tall at the wide. */
export const PERSON_B = 110;
/** The audience rows' feet, under each screen's bottom (F1: two rows; a copy: one). */
export const ROW = { back: BOX.bottom + 118, front: BOX.bottom + 166 } as const;
/** The column's pitch: F1's front row clears the racket copy's top by 34 px (the minimum: the wide is set by it). */
export const PITCH = ROW.front + 34 - BOX.top; // 624
export const COPIES = [
  { y: -PITCH, glyph: "BICYCLE" as const },
  { y: PITCH, glyph: "RACKET" as const },
];
/** The column's world box: the top copy's top .. the bottom copy's audience feet (+ shadow). */
export const COLUMN = { top: -PITCH + BOX.top, bottom: PITCH + ROW.back + 6 } as const;

// -- the tennis copy's glyph (cut-local; pass 2: the plain ball read as a baseball) ------------------------
// A tennis racket and its ball in Lucide grammar on the 24 box, the bicycle's stroke (GLYPH_STROKE 2.6,
// square caps, mitre joins). Drawn upright about the head's centre (0, 0) and turned 35 deg: an oval head
// (rx 9.2, ry 10.2), 3 x 3 strings (ending one half-stroke inside the rim so their square caps meet it), the
// throat's V and a short handle; the ball (r 2.2) by the head's lower right. The head is as large as the
// hatching needs to stay open at this stroke (string gaps 2.1-2.4 units = 0.8-0.9 of the stroke; at 1.4
// units the head read as a perforated paddle). Ink box ~24.0 x 26.7 units: optically matched to the
// bicycle's 22.6 x 18.6 (the racket's head is open, the bike's two wheels are ink).
export const RACKET_GLYPH =
  `<g transform="translate(10.92 9.84)">` +
  `<g transform="rotate(35)">` +
  `<ellipse cx="0" cy="0" rx="9.2" ry="10.2"/>` +
  `<path d="M-4.7 -7.47V7.47M0 -8.9V8.9M4.7 -7.47V7.47"/>` +
  `<path d="M-6.72 -5H6.72M-7.9 0H7.9M-6.72 5H6.72"/>` +
  `<path d="M-4.95 8.6L0 13.2L4.95 8.6M0 13.2V16.8"/>` +
  `</g>` +
  `<circle cx="9.6" cy="12" r="2.2"/>` +
  `</g>`;

/**
 * RacketCopy — dtsShared's COPY screen, value for value (Screen with `glyph`: the same screenBox, one
 * ObjectShadow from the bezel's silhouette, the cream bezel gradient + its lit top edge, the board face, the
 * glyph knocked out through it at 0.66 of the face's height, centred on the face), with the racket glyph,
 * which dtsShared's GlyphName does not offer. Never lit.
 */
const RacketCopy: React.FC<{ x: number; y: number; w: number; k: number }> = ({ x, y, w, k }) => {
  const uid = `fw${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const s = screenBox(x, y, w);
  const o = s.outer;
  const F = s.face;
  const g = F.h * 0.66;
  const r3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={r3(o.y)} x2="0" y2={r3(o.y + o.h)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={r3(F.y)} x2="0" y2={r3(F.y + F.h)}>
          <stop offset="0" stopColor={COLOR.board} />
          <stop offset="1" stopColor={COLOR.boardFoot} />
        </linearGradient>
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={r3(o.x - 4)} y={r3(o.y - 4)} width={r3(o.w + 8)} height={r3(o.h + 8)}>
          <rect x={r3(o.x - 4)} y={r3(o.y - 4)} width={r3(o.w + 8)} height={r3(o.h + 8)} fill="#fff" />
          <g
            transform={`translate(${r3(x - g / 2)} ${r3(F.y + F.h / 2 - g / 2)}) scale(${r3(g / 24)})`}
            fill="none"
            stroke="#000"
            strokeWidth={GLYPH_STROKE}
            strokeLinecap="square"
            strokeLinejoin="miter"
            dangerouslySetInnerHTML={{ __html: RACKET_GLYPH }}
          />
        </mask>
      </defs>
      <ObjectShadow paths={[rectPath(o.x, o.y, o.w, o.h, s.r)]} size={Math.sqrt(o.w * o.h)} elevation="rest" />
      <g mask={`url(#${uid}k)`}>
        <path d={rectPath(o.x, o.y, o.w, o.h, s.r)} fill={`url(#${uid}c)`} />
        <path
          d={`M${r3(o.x + s.r)} ${r3(o.y + EDGE.CREAM / k / 2)}H${r3(o.x + o.w - s.r)}`}
          stroke={COLOR.edge}
          strokeOpacity={ALPHA.edge}
          strokeWidth={r3(EDGE.CREAM / k)}
        />
        <path d={rectPath(F.x, F.y, F.w, F.h, s.rFace)} fill={`url(#${uid}b)`} />
      </g>
    </g>
  );
};

/** The show's light under F1's screen, and where its front reads on the walkers' row. */
const LIGHT = screenLight(SCR.x, SCR.y, SCR.w);
export const FRONT_X = 450;

type Standing = { x: number; y: number };
/** F1's audience, already in the light (amber) on f0: an organic back row and two in front. */
const AUDIENCE: Standing[] = [
  { x: -300, y: ROW.back - 4 },
  { x: -95, y: ROW.back },
  { x: 115, y: ROW.back - 5 },
  { x: 300, y: ROW.back - 2 },
  { x: -200, y: ROW.front - 2 },
  { x: 10, y: ROW.front + 2 },
];
/** The copies' few: DARK, one row each, and they stay DARK (no light reaches them). */
const COPY_CROWD: Standing[] = COPIES.flatMap((c) => [
  { x: -160, y: c.y + ROW.back - 3 },
  { x: 5, y: c.y + ROW.back + 2 },
  { x: 165, y: c.y + ROW.back - 1 },
]);

// -- the walkers: a smooth glide at a hashed speed, decelerating (smoothstep of speed) into its place -----
// Each walks in F1's front row to the crowd's fringe, passing in front of no one.
type Walker = { x0: number; to: number; y: number; v: number; T: number; start: number; arrives: boolean };
const WALKERS: Walker[] = [
  // W3: from the right edge, walks into the light and takes the right fringe
  { x0: 640, to: 418, y: ROW.front, v: 6.6 + 0.5 * hash01(3, 21), T: 24, start: 0, arrives: true },
  // W1: from the left, revealed by the pull-out, takes the left fringe
  { x0: -820, to: -418, y: ROW.front - 3, v: 9.0 + 0.6 * hash01(1, 21), T: 26, start: 2, arrives: true },
  // W2: from the right, the slowest: still DARK and still walking toward the light at the cut
  { x0: 900, to: 560, y: ROW.front + 3, v: 5.0 + 0.4 * hash01(2, 21), T: 30, start: 0, arrives: false },
];
export const walkerX = (w: Walker, f: number) => {
  const dir = Math.sign(w.to - w.x0);
  const dist = Math.abs(w.to - w.x0);
  const decel = (w.v * w.T) / 2; // distance covered while slowing
  const cruise = Math.max(0, dist - decel) / w.v; // frames at speed
  const t = f - w.start;
  if (t <= 0) return w.x0 + dir * w.v * t; // already walking before its start (off frame or entering)
  if (t <= cruise) return w.x0 + dir * w.v * t;
  const u = clamp01((t - cruise) / w.T);
  const s = w.v * cruise + w.v * w.T * (u - u * u * u + (u * u * u * u) / 2);
  return w.x0 + dir * s;
};
/** Reach: the frame each walker crosses the light's front (+ a hashed offset inside it). */
export const WALK_REACH = WALKERS.map((w, i) => reachFrame((f) => FRONT_X - 30 * hash01(i, 7) - Math.abs(walkerX(w, f)), -60, 200, 0.5));

// -- the camera: one pull-out, then the creep (dtsShared's portrait rig: the look lands on y 835) -------------
export const K0 = 1.45; // F1's bezel 1044 px (97 % of the width)
/** The wide: the column fills y 200-1400 less the sway and 4 px of air. */
export const K_WIDE = (SAFE_P.bottom - SAFE_P.top - 2 * 5 - 8) / (COLUMN.bottom - COLUMN.top);
export const K_CREEP = K_WIDE * 1.012;
/** The look: F1's screen + audience at f0; the column's centre at the wide (its box centred on y 835 is
 *  inside 200-1400 since 835 sits 35 px above the band's centre: the look is offset so the box centres on 800). */
/** f0: F1's screen centre on y 640 (high), so the cycling copy above shows only a sliver of its bezel's foot
 *  (its glyph off frame) and its audience is out of frame; the racket copy's top shows under y 1230. */
export const F0_SCREEN_Y = 640;
const LOOK0 = SCR.y + (835 - F0_SCREEN_Y) / K0;
const LOOK_WIDE = (COLUMN.top + COLUMN.bottom) / 2 + (835 - (SAFE_P.top + SAFE_P.bottom) / 2) / K_WIDE;
export const CAM = dtsCameraTrackP(
  { x: 0, y: LOOK0, k: K0 },
  [
    { f0: -4, f1: 38, k: K_WIDE, dy: LOOK_WIDE - LOOK0, warp: 0.95 },
    { f0: 40, f1: 96, k: K_CREEP },
  ],
  DURATION,
  12,
);
export const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const FormatWorks: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = dtsAmberBandP(cam);
  const people: { key: string; x: number; y: number; amber: number }[] = [
    ...AUDIENCE.map((p, i) => ({ key: `a${i}`, x: p.x, y: p.y, amber: 1 })),
    ...COPY_CROWD.map((p, i) => ({ key: `c${i}`, x: p.x, y: p.y, amber: 0 })),
    ...WALKERS.map((w, i) => ({ key: `w${i}`, x: walkerX(w, f), y: w.y, amber: toneAt(WALK_REACH[i], f) })),
  ].sort((a, b) => a.y - b.y);
  const half = FRAME_P.W / 2 / k + PERSON_B;
  return (
    <AbsoluteFill>
      <DtsStage orientation="portrait" S={f} cam={cam} rest={CAM[0]} pool={{ x: SCR.x, y: 60 }} lights={[LIGHT]}>
        {COPIES.map((c) =>
          c.glyph === "RACKET" ? (
            <RacketCopy key={c.glyph} x={SCR.x} y={c.y} w={SCR.w} k={k} />
          ) : (
            <Screen key={c.glyph} x={SCR.x} y={c.y} w={SCR.w} k={k} band={band} glyph={c.glyph} />
          ),
        )}
        <Screen x={SCR.x} y={SCR.y} w={SCR.w} k={k} band={band} on={1} />
        {people.map((p) =>
          Math.abs(p.x - cam.x) > half ? null : <Person key={p.key} x={p.x} y={p.y} h={PERSON_B} k={k} base={DARK} amber={p.amber} />,
        )}
      </DtsStage>
    </AbsoluteFill>
  );
};

export default FormatWorks;

// ---------------------------------------------------------------------------
// Load-time checks: the rules the cut rests on.
// ---------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`FormatWorks: ${m}`);
  };
  const SWAY = 5;
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  if (PERSON_B * K_WIDE < 72) fail(`people ${(PERSON_B * K_WIDE).toFixed(1)} px tall at the wide (< 72)`);
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    // f0 on: F1's screen and its audience inside y 200-1400 on every frame
    const top = toScreenP(c, 0, BOX.top).y - SWAY;
    const bottom = toScreenP(c, 0, ROW.front + 4).y + SWAY;
    if (top < SAFE_P.top - 0.5) fail(`F1's screen top at y ${top.toFixed(0)} on f${f}`);
    if (bottom > SAFE_P.bottom) fail(`F1's crowd at y ${bottom.toFixed(0)} on f${f}`);
    // from the settle on: the whole column inside y 200-1400 and the side margins
    if (f >= 46) {
      const t = toScreenP(c, 0, COLUMN.top).y - SWAY;
      const b = toScreenP(c, 0, COLUMN.bottom).y + SWAY;
      if (t < SAFE_P.top || b > SAFE_P.bottom) fail(`the column breaks y 200-1400 on f${f} (${t.toFixed(0)}..${b.toFixed(0)})`);
      const l = toScreenP(c, -SCR.w / 2, 0).x;
      if (l < SAFE_P.side) fail(`the column breaks the side margin on f${f}`);
    }
  }
  // the walkers: under 45 screen px/f, amber done before the end, never crossing anyone
  WALKERS.forEach((w, i) => {
    for (let f = 1; f < DURATION; f++) {
      const a = toScreenP(camAt(f - 1), walkerX(w, f - 1), w.y).x;
      const b = toScreenP(camAt(f), walkerX(w, f), w.y).x;
      if (Math.abs(b - a) > 45) fail(`walker ${i} moves ${Math.abs(b - a).toFixed(1)} px on f${f}`);
      AUDIENCE.forEach((p, q) => {
        if (Math.abs(walkerX(w, f) - p.x) < PERSON_B - 4 && Math.abs(w.y - p.y) < PERSON_B) fail(`walker ${i} crosses person ${q} on f${f}`);
      });
    }
    if (w.arrives) {
      if (!(WALK_REACH[i] + 13 <= DURATION - 1)) fail(`walker ${i} is still turning on the last frame (reach f${WALK_REACH[i].toFixed(1)})`);
      if (Math.abs(w.to) > FRONT_X - 30) fail(`walker ${i} rests outside the light`);
    } else if (Number.isFinite(WALK_REACH[i]) && WALK_REACH[i] < DURATION) fail(`walker ${i} reaches the light inside the cut`);
  });
  void clamp01;
}
