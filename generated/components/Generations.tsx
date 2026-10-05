import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BLOOM_LAYERS, COLOR, ELEVATION, GEO, clamp01, lerp, rectPath, smoothstep } from "./stoutShared";
import {
  DARK,
  DTS_LIGHT,
  DtsStage,
  FPS,
  SAFE_P,
  Screen,
  camForP,
  camJerk,
  dtsAmberBandP,
  dtsCameraTrackP,
  lookOfP,
  reachFrame,
  screenBox,
  toScreenP,
  toneAt,
  type Front,
} from "./dtsShared";
import type { Glide } from "./outgrowShared";

// ---------------------------------------------------------------------------
// Generations — cut E of Toto Wolff, "why Drive to Survive worked" (Cheeky Pint S4E01), on the DTS world
// (dtsShared.tsx, Builder W; briefs out/dts/briefs/BRIEF.md + BRIEF_9x16.md). Cheeky Pint S4 stout system,
// palette B1. PASS 3: 9:16, 1080x1920, 24 fps, opaque (the 16:9 pass-1 source is kept in out/dts/Q/landscape/).
//
// THE LINE: "…generations watched Drive to Survive, from the granddaughter to the grandparent."
// WINDOW: seq 57.800-63.240 = 5.440 s. DURATION = ceil(5.440 x 24) = ceil(130.56) = 131, no tail.
// ONSETS (f, ±2): generations 0 (began 6 f before the cut) · watched 19 · drive 38 · to 49 · survive 53 ·
//   from 62 · the 69 · granddaughter 75 · to 95 · the 106 · grandparent 110 · ends 127.
//
// ACCENT RULE: amber = Drive to Survive's light — the screen's face and whoever its light reaches. The family
// starts in the DARK; each member turns amber only when the light's front reaches them (toneAt, 13 f eased
// crossfade). Nothing else is amber; no type.
//
// THE ROOM, seen from BEHIND the family: THE SCREEN at the top (centred, 70 % of the frame), the family below
// it as BACK-VIEW busts at increasing distance from the screen, so nearer us = lower and larger:
//   granddaughter  nearest the screen (highest, smallest): a high ponytail swinging out, its tie on the crown
//   mother, father side by side in the middle: her long hair falling past the shoulders, his plain bust
//   grandparent    nearest us (lowest, largest): a flat cap, the head sunk between rounded shoulders
// (cut-local FamilyPerson: dtsShared Person's recipe — one fill, one shadow scaled to the glyph, the amber
// crossfade with the fixed bloom — on back-view silhouettes Person cannot draw.) Each member stands where the
// falling front is on its reach frame (its head's top = the front then), so the light arrives on the words.
//
// ONE MOTION: the screen comes on and its light falls down the room through the family, nearest the screen
// to nearest us; the camera pulls back and tilts down with it, ending on the whole lit family.
// GESTURES (gesture -> word -> frames)
//   1. the family in the DARK under an OFF screen (board face), a slow creep -> "generations" -> f0-30
//   2. the screen comes on: ONE eased left->right wipe, board -> amber + the DTS card -> "watched Drive to
//      Survive" -> f30-44 (lands ahead of "drive" f38)
//   3. its light falls from the screen's foot down the room (cut C's GroundLight language re-aimed as a
//      falling band: A's amber, a soft rounded front; one smoothstep f32 -> f118, slowing as it goes)
//      -> "watched … from the granddaughter to the grandparent" -> f32-118
//   4. the front reaches each member; each crossfades DARK -> amber over 13 f:
//      granddaughter f71 (amber f71-84) -> "granddaughter" f75; mother f81, father f91 -> "to the";
//      grandparent f105 (amber f105-118) -> "grandparent" f110
//   5. ONE camera move: a slow pull-back and tilt down (k 1.1 -> 1.0) following the light, landing f108
//      ahead of "grandparent"; a last breath of creep to f131 on the whole lit family
// CLICK: none (the payoff is the light reaching the grandparent).
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 131; // ceil((63.240 - 57.800) x 24)
export const BEATS = { generations: 0, watched: 19, drive: 38, survive: 53, from: 62, granddaughter: 75, to: 95, grandparent: 110, ends: 127 } as const;

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const f4 = (v: number) => (Math.round(v * 1e4) / 1e4).toString();

// ===========================================================================
// THE FAMILY FROM BEHIND (512-unit box like person.png, ink to y 470, symmetric about x 255.5)
// ===========================================================================
export type Member = "granddaughter" | "mother" | "father" | "grandparent";
const KAPPA = 0.5522847498;
const circle = (cx: number, cy: number, r: number) => {
  const c = r * KAPPA;
  return `M${cx + r} ${cy}C${cx + r} ${cy + c} ${cx + c} ${cy + r} ${cx} ${cy + r}C${cx - c} ${cy + r} ${cx - r} ${cy + c} ${cx - r} ${cy}C${cx - r} ${cy - c} ${cx - c} ${cy - r} ${cx} ${cy - r}C${cx + c} ${cy - r} ${cx + r} ${cy - c} ${cx + r} ${cy}Z`;
};
/** person.png's shoulder dome, its width scaled by `w` about the axis. */
const dome = (w: number) => {
  const X = (x: number) => +(255.5 + (x - 255.5) * w).toFixed(2);
  return `M${X(41)} 470L${X(41)} 458C${X(41)} 352 ${X(126)} 266 ${X(232)} 266L${X(279)} 266C${X(385)} 266 ${X(470)} 352 ${X(470)} 458L${X(470)} 470Z`;
};
/** Each member: its silhouette parts, its ink top and half-width (box units; for layout and checks). */
export const MEMBER: Record<Member, { parts: string[]; top: number; half: number }> = {
  granddaughter: {
    parts: [
      circle(255.5, 143, 102),
      dome(0.78),
      "M286 46C340 20 410 40 430 100C446 150 438 210 414 252C404 214 392 172 360 140C336 116 310 96 286 84Z",
      circle(298, 50, 26),
    ],
    top: 22,
    half: 182,
  },
  mother: {
    parts: [
      circle(255.5, 143, 102),
      dome(0.96),
      "M153.5 150C150 60 200 38 255.5 38C311 38 361 60 357.5 150C360 220 374 280 392 318L119 318C137 280 151 220 153.5 150Z",
    ],
    top: 38,
    half: 207,
  },
  father: { parts: [circle(255.5, 143, 102), dome(1.08)], top: 41, half: 232 },
  grandparent: {
    parts: [
      circle(255.5, 176, 100),
      "M46 470L46 440C46 330 120 252 208 246C236 270 275 270 303 246C391 252 465 330 465 440L465 470Z",
      "M142 140C142 92 190 66 255.5 66C321 66 369 92 369 140L374 150Q374 158 366 158L145 158Q137 158 137 150Z",
    ],
    top: 66,
    half: 210,
  },
};
/** box units -> world px for a member drawn `h` world px tall (its ink top to its foot) */
const unitOf = (m: Member, h: number) => h / (470 - MEMBER[m].top);

/**
 * FamilyPerson — one member from behind, its foot centred on (x, y), `h` world px tall; dtsShared Person's
 * recipe: `base` fill (DARK = not reached), one shadow (the rest elevation scaled to the glyph), the amber
 * crossfade 0..1 with the fixed bloom.
 */
export const FamilyPerson: React.FC<{ member: Member; x: number; y: number; h: number; k: number; amber: number; base?: string }> = ({
  member,
  x,
  y,
  h,
  k,
  amber,
  base = DARK,
}) => {
  const M = MEMBER[member];
  const unit = unitOf(member, h);
  const E = ELEVATION.rest;
  const sh = (h / GEO.TILE) / unit; // the recipe is per TILE of glyph height, in box units
  const a = clamp01(amber);
  const shapes = (fill?: string) => M.parts.map((d, i) => <path key={i} d={d} fill={fill} />);
  return (
    <g transform={`translate(${f3(x)} ${f3(y)}) scale(${f4(unit)}) translate(-255.5 -470)`}>
      {[E.amb, E.key].map((l, i) => (
        <g key={i} fill={COLOR.shadow} opacity={f3(l.a)} transform={`translate(${f3(l.dx * sh)} ${f3(l.dy * sh)})`} style={{ filter: `blur(${f3(l.blur * sh)}px)` }}>
          {shapes()}
        </g>
      ))}
      <g fill={base}>{shapes()}</g>
      {a > 0.002 ? (
        <g opacity={a < 1 ? f3(a) : undefined} style={{ filter: BLOOM_LAYERS.map((b) => `drop-shadow(0 0 ${f4(b.blur / (k * unit))}px ${b.color})`).join(" ") }}>
          {shapes(COLOR.amberTop)}
        </g>
      ) : null}
    </g>
  );
};

// ===========================================================================
// THE LAYOUT (world px; at the end camera, k 1, world ≈ screen px with x 0 on the frame's axis)
// ===========================================================================
/** THE SCREEN at the top, centred, 70 % of the frame. OFF until f30. */
export const SCREEN = { x: 0, y: 442, w: 756 } as const;
const SB = screenBox(SCREEN.x, SCREEN.y, SCREEN.w);
export const WIPE = { f0: 30, f1: 44 } as const;
export const screenOn = (f: number) => smoothstep((f - WIPE.f0) / (WIPE.f1 - WIPE.f0));

// THE FRONT: the y the show's light has reached, falling from the screen's foot down the room on ONE
// smoothstep, f32 -> f118 (slowing through the family).
export const FRONT = { f0: 32, f1: 118, y0: SB.bottom, D: 490 } as const;
export const front: Front = (f) => FRONT.y0 + FRONT.D * smoothstep((f - FRONT.f0) / (FRONT.f1 - FRONT.f0));
/** The designed reach frames (granddaughter ≈ f71-84 amber, grandparent ≈ f105-118). */
export const REACH_PLAN: Record<Member, number> = { granddaughter: 71, mother: 81, father: 91, grandparent: 105 };
export const ORDER: Member[] = ["granddaughter", "mother", "father", "grandparent"];
/** nearer us = lower and larger: each member's height and place across the room */
const PLACE: Record<Member, { x: number; h: number }> = {
  granddaughter: { x: 0, h: 120 },
  mother: { x: -205, h: 190 },
  father: { x: 207, h: 200 },
  grandparent: { x: 0, h: 240 },
};
/** Each member's head top sits where the falling front is on its reach frame; its foot h below. */
export const FAMILY = ORDER.map((m) => {
  const top = front(REACH_PLAN[m]);
  const { x, h } = PLACE[m];
  return { m, x, h, top, foot: top + h, half: MEMBER[m].half * unitOf(m, h) };
});
export const REACH: number[] = FAMILY.map((p) => reachFrame((f) => front(f) - p.top, 0, DURATION));

// THE LIGHT (cut C's GroundLight, AreWeDoingThis.tsx, re-aimed as a FALLING band): A's DTS_LIGHT amber
// screen-blended on the floor under the world, from under the screen (fading in from its centre to its foot)
// down to a crisp, softly rounded front (edge blur EDGE_SOFT screen px), A's falloff a0 -> toward a1 along it.
const BAND_X = { x0: -410, x1: 410, fade: 110 } as const;
const EDGE_SOFT = 9;
const FallingLight: React.FC<{ y1: number; k: number; strength: number }> = ({ y1, k, strength }) => {
  const uid = `fl${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const yl = SCREEN.y;
  const yr = SB.bottom;
  if (y1 - yr < 2 || strength <= 0.002) return null;
  const pad = (4 * EDGE_SOFT) / k;
  const w = BAND_X.x1 - BAND_X.x0;
  const fx = BAND_X.fade / w;
  const rr = Math.min(150, (y1 - yl) / 2);
  const at = (y: number) => f3(clamp01((y - yl) / (y1 - yl)));
  const c = `rgb(${DTS_LIGHT.color})`;
  const s = strength;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}v`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yl)} x2="0" y2={f3(y1)}>
          <stop offset="0" stopColor={c} stopOpacity="0" />
          <stop offset={at(yr)} stopColor={c} stopOpacity={f3(DTS_LIGHT.a0 * s)} />
          <stop offset={at(lerp(yr, y1, 0.65))} stopColor={c} stopOpacity={f3(lerp(DTS_LIGHT.a0, DTS_LIGHT.a1, 0.3) * s)} />
          <stop offset="1" stopColor={c} stopOpacity={f3(((DTS_LIGHT.a0 + DTS_LIGHT.a1) / 2) * s)} />
        </linearGradient>
        <linearGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" x1={f3(BAND_X.x0)} y1="0" x2={f3(BAND_X.x1)} y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset={f3(fx)} stopColor="#fff" />
          <stop offset={f3(1 - fx)} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(BAND_X.x0 - pad)} y={f3(yl - pad)} width={f3(w + 2 * pad)} height={f3(y1 - yl + 2 * pad)}>
          <path d={rectPath(BAND_X.x0, yl - 200, w, y1 - yl + 200, rr)} fill={`url(#${uid}h)`} style={{ filter: `blur(${f3(EDGE_SOFT / k)}px)` }} />
        </mask>
      </defs>
      <rect x={f3(BAND_X.x0 - pad)} y={f3(yl)} width={f3(w + 2 * pad)} height={f3(y1 - yl + pad)} fill={`url(#${uid}v)`} mask={`url(#${uid}m)`} />
    </g>
  );
};

// ===========================================================================
// THE CAMERA (dtsShared dtsCameraTrackP: look lands on screen y 835)
// ===========================================================================
/** The end: k 1, the room as laid out (screen top ≈ y 220, the grandparent's foot ≈ y 1380). */
const CAM_END = camForP(0, 960, 540, 960, 1.0);
/** f0: in a little closer and higher, on the screen and the family in the dark. */
const K0 = 1.1;
const CAM_0 = camForP(0, SB.top - 18, 540, 220, K0);
export const CAM_START = { x: 0, y: lookOfP(CAM_0), k: K0 };
export const GLIDES: Glide[] = [
  // 1. the creep in the dark
  { f0: -10, f1: 40, k: K0 * 1.02 },
  // 5. the pull-back and tilt down with the falling light, landing ahead of "grandparent"
  { f0: 34, f1: 108, dy: lookOfP(CAM_END) - CAM_START.y, k: 0.985, warp: 1.1 },
  // the tail: a last breath of creep on the lit family
  { f0: 100, f1: 140, k: 1.0 },
];
export const CAM = dtsCameraTrackP(CAM_START, GLIDES, DURATION, 12);
export const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];

// THE SUBJECT POOL (cream): follows the falling light down the room, lagged by the house damper.
const POOL: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  let y = SB.bottom;
  let v = 0;
  for (let f = 0; f < DURATION + 2; f++) {
    v = v + (Math.max(SB.bottom, front(f) - 60) - y) * 0.09 - v * 0.468;
    y += v;
    out.push({ x: 0, y });
  }
  return out;
})();

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const Generations: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = dtsAmberBandP(cam);
  return (
    <DtsStage orientation="portrait" S={f} cam={cam} rest={CAM[0]} pool={POOL[Math.min(POOL.length - 1, f)]}>
      <FallingLight y1={front(f)} k={k} strength={screenOn(f)} />
      <Screen x={SCREEN.x} y={SCREEN.y} w={SCREEN.w} k={k} band={band} on={screenOn(f)} />
      {FAMILY.map((p, i) => (
        <FamilyPerson key={p.m} member={p.m} x={p.x} y={p.foot} h={p.h} k={k} amber={toneAt(REACH[i], f)} />
      ))}
    </DtsStage>
  );
};

export default Generations;

// ===========================================================================
// LOAD-TIME CHECKS: the rules the cut rests on
// ===========================================================================
{
  const fail = (m: string) => {
    throw new Error(`Generations: ${m}`);
  };
  FAMILY.forEach((p, i) => {
    if (Math.abs(REACH[i] - REACH_PLAN[p.m]) > 0.05) fail(`${p.m} reached f${REACH[i].toFixed(2)}, planned f${REACH_PLAN[p.m]}`);
  });
  // nearer us = lower and larger
  for (let i = 1; i < FAMILY.length; i++) if (FAMILY[i].top <= FAMILY[i - 1].top) fail("the family is not ordered by distance");
  if (!(FAMILY[0].h < FAMILY[1].h && FAMILY[2].h < FAMILY[3].h)) fail("the nearer members are not larger");
  // the light stays inside the band the family stands in
  for (const p of FAMILY) if (p.x - p.half < BAND_X.x0 + BAND_X.fade * 0.5 || p.x + p.half > BAND_X.x1 - BAND_X.fade * 0.5) fail(`${p.m} stands outside the light's band`);
  // the camera
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} at f${j.at}`);
  if (j.maxV > 45) fail(`camera speed ${j.maxV.toFixed(1)} px/f`);
  // framing: the screen inside the band from f0; the whole family inside y 200-1400 and the side margins
  // from the grandparent's light on (f100); the centre of mass on the axis
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    if (toScreenP(c, 0, SB.top).y < SAFE_P.top - 1) fail(`the screen's top leaves the band at f${f}`);
    if (toScreenP(c, SB.outer.x, 0).x < SAFE_P.side) fail(`the screen crosses the side margin at f${f}`);
    if (f < 100) continue;
    for (const p of FAMILY) {
      const bot = toScreenP(c, p.x, p.foot).y;
      const l = toScreenP(c, p.x - p.half, 0).x;
      const r = toScreenP(c, p.x + p.half, 0).x;
      if (bot > SAFE_P.bottom) fail(`${p.m} below y 1400 at f${f} (${bot.toFixed(0)})`);
      if (l < SAFE_P.side || r > 1080 - SAFE_P.side) fail(`${p.m} crosses the side margin at f${f}`);
    }
  }
}
