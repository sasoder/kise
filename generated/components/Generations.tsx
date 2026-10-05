import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BLOOM_LAYERS, COLOR, ELEVATION, GEO, clamp01, smoothstep } from "./stoutShared";
import {
  DARK,
  DTS,
  DtsStage,
  FPS,
  SAFE,
  Screen,
  camJerk,
  dtsAmberBand,
  dtsCameraTrack,
  lightSpan,
  reachFrame,
  screenBox,
  screenLight,
  toScreenL,
  toneAt,
  type Front,
  type LightPool,
} from "./dtsShared";
import type { Glide } from "./outgrowShared";

// ---------------------------------------------------------------------------
// Generations — cut E of Toto Wolff, "why Drive to Survive worked" (Cheeky Pint S4E01), on the DTS world
// (dtsShared.tsx, Builder W; brief out/dts/briefs/BRIEF.md). Cheeky Pint S4 stout system, palette B1.
// 1920x1080, 24 fps, opaque.
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
// THE FAMILY (cut-local glyphs, FamilyPerson below: dtsShared's Person draws only the plain bust, so the
// age cues that change the base silhouette — a child's narrow shoulders, a stooped back, a head carried
// forward — are drawn here in the same recipe: one fill, one shadow (the rest elevation scaled to the glyph),
// the amber crossfade with the fixed bloom). In profile facing the screen (left), one cue each:
//   granddaughter  small (0.64), a child's narrow shoulders, a high ponytail
//   mother         hair falling behind to the shoulder
//   father         the plain bust, a touch broader
//   grandparent    a flat cap, a rounded upper back, the head carried forward and lower
// They stand at increasing distances from the screen, placed BY THE FRONT: each member's leading edge sits
// where the decelerating front is at that member's reach frame (so the light arrives on the words).
//
// ONE MOTION: the screen comes on and its light spreads right along the floor through the family, nearest
// to furthest; the camera follows the front in, ending on the whole lit family.
// GESTURES (gesture -> word -> frames)
//   1. the family in the DARK facing an OFF screen (board face), the camera creeping in -> "generations"
//      -> f0-36 (creep k 0.95 -> 1.0)
//   2. the screen comes on: ONE eased left->right wipe of its face, board -> amber + the DTS card
//      -> "watched Drive to Survive" -> f30-44 (lands ahead of "drive" f38 … "survive" f53)
//   3. its light spreads right along the floor (one front, smoothstep f32 -> f118, slowing as it goes)
//      -> "watched … from the granddaughter to the grandparent" -> f32-118
//   4. the front reaches each member; each crossfades DARK -> amber over 13 f:
//      granddaughter f71 (amber f71-84) -> "granddaughter" f75
//      mother f81, father f91 (amber to f94 / f104) -> "to the"
//      grandparent f105 (amber f105-118) -> "grandparent" f110
//   5. ONE camera glide follows the front right and in (k 1.0 -> 1.55), landing f108, ahead of
//      "grandparent"; then the tail creep (k 1.55 -> 1.6) to f131 on the whole lit family
// CLICK: none (no single click deserves the LightSweep: the payoff is the front reaching the grandparent).
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 131; // ceil((63.240 - 57.800) x 24)
export const BEATS = { generations: 0, watched: 19, drive: 38, survive: 53, from: 62, granddaughter: 75, to: 95, grandparent: 110, ends: 127 } as const;

// ===========================================================================
// THE FAMILY GLYPHS (512-unit box, the bust's ink 41..470; -x is the face)
// ===========================================================================
export type Member = "granddaughter" | "mother" | "father" | "grandparent";
const U = 429; // the bust's ink height in box units
const HEAD = { cx: 255.5, cy: 143, r: 102 };
const KAPPA = 0.5522847498;
const circle = (cx: number, cy: number, r: number) => {
  const c = r * KAPPA;
  return (
    `M${cx + r} ${cy}C${cx + r} ${cy + c} ${cx + c} ${cy + r} ${cx} ${cy + r}` +
    `C${cx - c} ${cy + r} ${cx - r} ${cy + c} ${cx - r} ${cy}` +
    `C${cx - r} ${cy - c} ${cx - c} ${cy - r} ${cx} ${cy - r}` +
    `C${cx + c} ${cy - r} ${cx + r} ${cy - c} ${cx + r} ${cy}Z`
  );
};
/** The shoulder dome (person.png's), its width scaled by `w` about the axis. */
const dome = (w: number) => {
  const X = (x: number) => +(255.5 + (x - 255.5) * w).toFixed(2);
  return `M${X(41)} 458C${X(41)} 352 ${X(126)} 266 ${X(232)} 266L${X(279)} 266C${X(385)} 266 ${X(470)} 352 ${X(470)} 458L${X(470)} 462Q${X(470)} 470 ${X(462)} 470L${X(49)} 470Q${X(41)} 470 ${X(41)} 462Z`;
};
/** A small nose on the head's front: the profile cue every member shares. */
const nose = (dx: number, dy: number) =>
  `M${162 + dx} ${104 + dy}C${150 + dx} ${122 + dy} ${138 + dx} ${140 + dy} ${136 + dx} ${152 + dy}C${136 + dx} ${160 + dy} ${146 + dx} ${166 + dy} ${158 + dx} ${168 + dy}Z`;
const PONYTAIL = "M318 70C350 50 388 52 404 72C452 96 470 168 452 232C442 266 420 290 396 304C412 252 410 196 384 160C370 140 352 132 340 128Z";
const LONG_HAIR = "M204.5 54.7C250 28 384 64 386 160C388 216 398 262 424 312C404 322 352 322 318 310C322 284 316 252 300 232Z";
const GP_HEAD = { cx: HEAD.cx - 34, cy: HEAD.cy + 26 };
const FLAT_CAP = "M321 150C334 112 334 74 304 60C268 44 198 54 158 86L102 108C93 112 95 121 106 121L160 122L318 160Z";
const STOOPED_BODY = "M50 470L50 444C50 362 118 302 212 298L268 292C384 262 470 330 470 444L470 470Z";

/** Each member: its scale (of an adult's height), its silhouette parts, its ink extents (box units). */
export const MEMBER: Record<Member, { scale: number; parts: string[]; l: number; r: number; top: number }> = {
  granddaughter: { scale: 0.64, parts: [circle(HEAD.cx, HEAD.cy, HEAD.r), dome(0.78), nose(0, 0), PONYTAIL], l: 88, r: 458, top: 41 },
  mother: { scale: 0.94, parts: [circle(HEAD.cx, HEAD.cy, HEAD.r), dome(0.96), nose(0, 0), LONG_HAIR], l: 50, r: 461, top: 38 },
  father: { scale: 1.0, parts: [circle(HEAD.cx, HEAD.cy, HEAD.r), dome(1.06), nose(0, 0)], l: 28, r: 483, top: 41 },
  grandparent: { scale: 0.95, parts: [circle(GP_HEAD.cx, GP_HEAD.cy, HEAD.r), STOOPED_BODY, nose(-34, 26), FLAT_CAP], l: 50, r: 470, top: 50 },
};
/** A member's world extents for an adult height H: left / right of the axis, height. */
export const extentOf = (m: Member, H: number) => {
  const M = MEMBER[m];
  const s = (H * M.scale) / U;
  return { left: (255.5 - M.l) * s, right: (M.r - 255.5) * s, height: (470 - M.top) * s, s };
};

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const f4 = (v: number) => (Math.round(v * 1e4) / 1e4).toString();
/**
 * FamilyPerson — one member, standing on (x, y) (the axis, the body's foot), adult height H world px; dtsShared
 * Person's recipe: `base` fill (DARK = not reached), one shadow (the rest elevation scaled to the glyph), the
 * amber crossfade 0..1 with the fixed bloom.
 */
export const FamilyPerson: React.FC<{ member: Member; x: number; y: number; H: number; k: number; amber: number; base?: string }> = ({
  member,
  x,
  y,
  H,
  k,
  amber,
  base = DARK,
}) => {
  const M = MEMBER[member];
  const h = H * M.scale; // world px per U box units
  const unit = h / U; // world px per box unit
  const E = ELEVATION.rest;
  const sh = U / GEO.TILE; // the recipe is per TILE of glyph height
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
// THE LAYOUT (world px)
// ===========================================================================
/** The screen at the left (the A/B screen's size), centre (0, 60), facing right; OFF until f30. */
export const SCREEN = { x: 0, y: 60, w: DTS.SCREEN.w } as const;
const SB = screenBox(SCREEN.x, SCREEN.y, SCREEN.w);
/** The family's floor (the A walkers' ground) and an adult's height. */
export const FLOOR = DTS.PATH_Y;
export const H_ADULT = 150;
/** The wipe: board -> amber over 14 f, landing f44. */
export const WIPE = { f0: 30, f1: 44 } as const;
export const screenOn = (f: number) => smoothstep((f - WIPE.f0) / (WIPE.f1 - WIPE.f0));

// THE FRONT: the x the show's light has reached along the floor. It leaves the screen's face (x 200) as the
// wipe passes there, and spreads right on ONE smoothstep, f32 -> f118, slowing through the family.
export const FRONT = { f0: 32, f1: 118, x0: 200, D: 1100 } as const;
export const front: Front = (f) => FRONT.x0 + FRONT.D * smoothstep((f - FRONT.f0) / (FRONT.f1 - FRONT.f0));
/** The designed reach frames (granddaughter ≈ f71-84 amber, grandparent ≈ f105-118). */
export const REACH_PLAN: Record<Member, number> = { granddaughter: 71, mother: 81, father: 91, grandparent: 105 };
export const ORDER: Member[] = ["granddaughter", "mother", "father", "grandparent"];
/** Each member stands with its LEADING edge where the front is on its reach frame. */
export const FAMILY = ORDER.map((m) => {
  const e = extentOf(m, H_ADULT);
  const lead = front(REACH_PLAN[m]);
  return { m, x: lead + e.left, e };
});
/** The reach frames, measured back off the front (= the plan, to bisection precision). */
export const REACH: number[] = FAMILY.map((p) => reachFrame((f) => front(f) - (p.x - p.e.left), 0, DURATION));

// THE LIGHT on the floor: the screen's own pool (strength = the wipe), and the spreading pool whose right end
// runs LEAD ahead of the front (so the glow is visibly there when a member turns) and whose left end trails.
const LEAD = 220;
const TRAIL = 900;
const RY = 78;
export const lightsAt = (f: number): LightPool[] => {
  const on = screenOn(f);
  const x1 = front(f) + LEAD;
  const x0 = Math.max(SB.outer.x + 120, x1 - TRAIL);
  const spread = smoothstep((f - FRONT.f0) / 10);
  return [screenLight(SCREEN.x, SCREEN.y, SCREEN.w, on), lightSpan(x0, x1, FLOOR + 6, RY, spread)];
};

// ===========================================================================
// THE CAMERA (the house rig, re-solved: dtsShared dtsCameraTrack; look lands on screen y 480)
// ===========================================================================
const FAM_X0 = FAMILY[0].x - FAMILY[0].e.left;
const FAM_X1 = FAMILY[3].x + FAMILY[3].e.right;
export const CAM_START = { x: (SB.outer.x + FAM_X1) / 2, y: (SB.top + FLOOR) / 2, k: 0.95 };
export const CAM_END = { x: (FAM_X0 + FAM_X1) / 2 + 10, y: FLOOR - 82, k: 1.55 };
export const GLIDES: Glide[] = [
  // 1. the creep in the dark
  { f0: -10, f1: 44, k: 1.0 },
  // 5. follow the front right and in, landing ahead of "grandparent"
  { f0: 34, f1: 108, dx: CAM_END.x - CAM_START.x, dy: CAM_END.y - CAM_START.y, k: CAM_END.k, warp: 1.1 },
  // the tail creep on the lit family
  { f0: 100, f1: 140, k: 1.6 },
];
export const CAM = dtsCameraTrack(CAM_START, GLIDES, DURATION, 12);
export const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];

// THE SUBJECT POOL (cream): follows the front's light over the floor, lagged by the house damper.
const POOL_Y: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  let x = 260;
  let v = 0;
  for (let f = 0; f < DURATION + 2; f++) {
    const target = Math.max(260, Math.min(FAM_X1 - 200, front(f) - 120));
    v = v + (target - x) * 0.09 - v * 0.468;
    x += v;
    out.push({ x, y: FLOOR - 120 });
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
  const band = dtsAmberBand(cam);
  return (
    <DtsStage S={f} cam={cam} rest={CAM[0]} pool={POOL_Y[Math.min(POOL_Y.length - 1, f)]} lights={lightsAt(f)}>
      <Screen x={SCREEN.x} y={SCREEN.y} w={SCREEN.w} k={k} band={band} on={screenOn(f)} />
      {FAMILY.map((p, i) => (
        <FamilyPerson key={p.m} member={p.m} x={p.x} y={FLOOR} H={H_ADULT} k={k} amber={toneAt(REACH[i], f)} />
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
  // the light arrives on the words
  FAMILY.forEach((p, i) => {
    if (Math.abs(REACH[i] - REACH_PLAN[p.m]) > 0.05) fail(`${p.m} reached f${REACH[i].toFixed(2)}, planned f${REACH_PLAN[p.m]}`);
  });
  if (REACH[0] < 70 || REACH[0] > 74) fail("the granddaughter is not reached f70-74");
  if (REACH[3] < 103 || REACH[3] > 106) fail("the grandparent is not reached f103-106");
  // nearest to furthest, never touching (>= 24 world px apart)
  for (let i = 1; i < FAMILY.length; i++) {
    const a = FAMILY[i - 1];
    const b = FAMILY[i];
    const gap = b.x - b.e.left - (a.x + a.e.right);
    if (gap < 24) fail(`${a.m} and ${b.m} are ${gap.toFixed(1)} px apart`);
  }
  if (FAM_X0 - SB.outer.x - SB.outer.w < 120) fail("the granddaughter stands against the screen");
  // the camera: |dv| <= 2.5, <= 45 px/f
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} at f${j.at}`);
  if (j.maxV > 45) fail(`camera speed ${j.maxV.toFixed(1)} px/f`);
  // framing: the family's ink inside y 90-880 and the side margins on every frame from f0 (the whole family
  // is in the frame from the start); the screen's ink inside the band while it is in frame
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    for (const p of FAMILY) {
      const top = toScreenL(c, p.x, FLOOR - p.e.height).y;
      const bot = toScreenL(c, p.x, FLOOR).y;
      const l = toScreenL(c, p.x - p.e.left, 0).x;
      const r = toScreenL(c, p.x + p.e.right, 0).x;
      if (top < SAFE.top || bot > SAFE.bottom) fail(`${p.m} leaves the band at f${f} (${top.toFixed(0)}..${bot.toFixed(0)})`);
      if (l < SAFE.side || r > 1920 - SAFE.side) fail(`${p.m} crosses the side margin at f${f} (${l.toFixed(0)}..${r.toFixed(0)})`);
    }
    // the screen (the source, not the subject) keeps inside the band while it is wholly in frame; once its
    // left edge leaves the frame it is on its way out (the camera has turned to the family)
    if (toScreenL(c, SB.outer.x, 0).x >= 0) {
      const st = toScreenL(c, 0, SB.top).y;
      const sb = toScreenL(c, 0, SB.bottom).y;
      if (st < SAFE.top - 1 || sb > SAFE.bottom) fail(`the screen leaves the band at f${f}`);
    }
  }
}
