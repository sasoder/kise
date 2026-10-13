import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AgentTile,
  BigBust,
  BustSilo,
  CAPTION_Y0,
  CUTS,
  FPS,
  LIFT_DY,
  MuseStage,
  RADIUS,
  ServiceBase,
  TILE,
  UnionShadow,
  amberBandM,
  bigBustPath,
  bustStrip,
  camCheck,
  liftAt,
  makeClockCam,
  makePoolTrack,
  restToRest,
  toScreenM,
  travel,
  winU,
  type Glide,
  type GlyphName,
  type SilItem,
} from "./museShared";
import { ALPHA, COLOR, EDGE, SWEEP, lerp, rectPath, smoothstep } from "./stoutShared";

// ---------------------------------------------------------------------------
// SiloedToWhole — cut 7 (the last shot) of Alexandr Wang, "Alex on agentic commerce" (Cheeky Pint S4E03),
// Cheeky Pint S4 style on the clip's world (museShared.tsx; brief out/musecommerce/briefs/BRIEF.md).
// 1080x1920 (9:16), 23.976 fps, opaque.
//
// CHECK LINE: Each recommendation system only ever sees a slice of you; Muse sees the whole person.
//
// THE LINE (heard just before: "historically a lot of these recommendation systems are quite…"):
// "siloed and quite isolated. And so they're sort of like they don't see like a holistic view of you as a
// person. And Muse has an opportunity to offer much greater levels of personalization."
// ONSETS (f): quite -6 · siloed 5 · and 21 · quite 24 · isolated. 27 · And 58 · so 71 · they're 74 · sort 78 ·
// of 82 · like 84 · they 88 · don't 95 · see 100 · like 107 · a 115 · holistic 118 · view 130 · of 142 ·
// you 162 · as 175 · a 179 · person. 181 · And 191 · Muse 204 · has 211 · an 224 · opportunity 232 · to 243 ·
// offer 250 · much 258 · greater 267 · levels 274 · of 280 · personalization. 284 · slot ends 302.
//
// WINDOW: seq 104.438 -> 117.034, span 12.596 s. DURATION = round(12.596 x 23.976) = 302, + 16-frame tail = 318.
//
// ONE MOTION: one person, cut into four strips, comes apart and each strip is shut in its own glass silo on
// a service's tile; the camera travels along them and none of them is a person. The amber agent comes up
// and DOCKS under the row; on its contact the glass sinks back into the slots, the four tiles and strips
// slide together onto it and seal into the one whole person on one base.
//
// REVISION (director + blind reviewer):
//   * the glass is this cut's own heavier variant of the stout glass (Tube below): a cream rim 4 screen px
//     in every framing, a solid cream cap, a stronger tint and streak, a hair wider than the strip so the rim
//     stands on the ground and not on the cream. It RISES out of the tile's slot as a rigid tube clipped at
//     the slot (the slot opens first) and SINKS back the same way. No opacity anywhere.
//   * the travel (f76-185) is one continuous lateral move at k 3.4 that always shows THREE whole silos, tile
//     and cap in frame: it dwells (creeping) on 1-2-3, crosses once, decisively (f114-144: silo 1 out at the
//     left while silo 4 comes in at the right), and dwells on 2-3-4. The pool visits the four in turn.
//   * the ending: the row sits higher (base line on screen y 940); the agent (64 world, ~160 px) comes up
//     from the bottom edge on "Muse" f204 and its top edge meets the two inner tiles' bottom edges on f222
//     (CONTACT; it is 64 wide, the inner gap 44: it laps each inner tile by 10 world px). First reaction f223:
//     the outer silos start sinking, the inner two 4 f later; all down by f244; the tiles and strips slide
//     together along the agent's top f242-268 and seal on f268 ("greater" f267); the ONE sweep f264-281.
//   * the "second copy of a silo" seen at the left edge f127-141 was not in the render: the review sheets
//     were tiled without gutters, so the silo cropped at one frame's right edge butted against the silo
//     cropped at the next frame's left edge. (Full frames f60-210 are clean; the sheets now have gutters.)
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = CUTS.SiloedToWhole.duration; // 318

export const schema = z.object({
  /** draws the caption strip's bounds (measurement only) */
  strip: z.boolean().default(false),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the world (world px; the strips stand on y = 0, the tiles' top edge) ---------------------------------
const BUST_H = 224; // the whole bust: 224 x 224
const N = 4;
const W = BUST_H / N; // a strip = a tile = 56
const S_TILE = W / TILE;
const TOP = 0; // the tiles' top edge
const FLOOR = TOP + W; // the tiles' bottom edge = the row's base line
const GLYPHS: readonly GlyphName[] = ["music", "play", "bag", "pin"];
const GAP_OPEN = 44; // between two tiles when apart (108 px at the wide)
const PITCH = W + GAP_OPEN; // 100
/** The agent: 64 world px (157 px at the end), docked under the row's centre, its top edge ON the base line. */
const AGENT_SIZE = 64;
const AGENT_FLOOR = FLOOR + AGENT_SIZE;
const AGENT_FROM = AGENT_FLOOR + 365; // its top edge ON the frame's bottom edge at f204: in frame from f205

// --- the glass (this cut's variant of the stout glass: it must read as a silo at 270 px wide) -------------
const TUBE = {
  w: W + 8, // a hair wider than the strip: the rim stands on the ground on both sides of the cream
  h: BUST_H + 16, // clears the head
  r: 7,
  rimPx: 4, // SCREEN px, every framing
  rimA: 0.94,
  cap: 5, // the solid cap's height (world px)
  tint: 0.13,
  streak: 0.17,
} as const;

// --- the clock (frames) -------------------------------------------------------------------------------
const T = {
  // the strips come apart: already moving at f0, open by f44 ("siloed and quite isolated")
  part: [-12, 44],
  // the tubes rise out of the slots, left to right 3 f apart; the last one is up on f44
  rise: [6, 35],
  riseStep: 3,
  // the agent comes up from the bottom edge on "Muse"; CONTACT with the inner tiles on f222
  agent: [204, 222],
  // the tubes sink back: the outer two from the contact, the inner two 4 f later
  sinkOut: [222, 240],
  sinkIn: [226, 244],
  // the tiles and strips slide together along the agent's top; sealed on f268 ("greater" f267)
  close: [242, 268],
  // THE ONE CLICK: the sweep over the whole figure as it seals
  sweep: [264, 281],
} as const;
const CONTACT = T.agent[1];
const SEAL = T.close[1];

const gapAt = (f: number) => {
  if (f < 120) return lerp(9.2, GAP_OPEN, smoothstep(winU(f, T.part[0], T.part[1])));
  return GAP_OPEN * (1 - restToRest(winU(f, T.close[0], T.close[1]), 2.2));
};
const siloX = (i: number, gap: number) => (i - (N - 1) / 2) * (W + gap);
const sinkWin = (i: number) => (i === 0 || i === N - 1 ? T.sinkOut : T.sinkIn);
/** How far the tube stands out of its slot (world px): 0 = wholly inside the tile. */
const tubeAt = (f: number, i: number) => {
  const up = restToRest(winU(f, T.rise[0] + i * T.riseStep, T.rise[1] + i * T.riseStep), 2.2);
  const w = sinkWin(i);
  return TUBE.h * up * (1 - smoothstep(winU(f, w[0], w[1])));
};
/** The slot in the tile's top edge: opens 4 f before the tube leaves it, closes 4 f after it is back in. */
const slotAt = (f: number, i: number) => {
  const r0 = T.rise[0] + i * T.riseStep;
  const w = sinkWin(i);
  return smoothstep(winU(f, r0 - 5, r0 - 1)) * (1 - smoothstep(winU(f, w[1] - 1, w[1] + 3)));
};
/** The strips lift one elevation while they close, and settle as they seal. */
const closeLift = (f: number) => liftAt(f, T.close[0] - 3, SEAL - 8, 7, 8);
const agentAt = (f: number) => travel({ x: 0, y: AGENT_FROM }, { x: 0, y: AGENT_FLOOR }, f, T.agent[0], T.agent[1], { p: 2, settleFrom: 0.55 });

// --- the camera (look = the world point on the frame's middle) -------------------------------------------
/** The look y that puts the row's base line on screen y `sy` at scale k. */
const lookFor = (sy: number) => (k: number) => FLOOR - (sy - 960) / k;
const lookA = lookFor(CAPTION_Y0 - 4); // f0-185: the tiles stand just above the caption strip
const lookB = lookFor(940); // f185-end: the base line on y 940, the agent docked under it
const K0 = 2.98;
const K_WIDE = 2.45; // all four: 364 world = 892 px
const K_CLOSE = 3.4; // three whole silos: 264 world = 898 px, tube top on y 88
const K_TAIL = 2.64;
const X_L = -57; // the first dwell (silos 1-2-3 whole, 4 out)
const CREEP = 22; // the slow part of the one lateral move
const STEP = 92; // the decisive part: silo 1 out, silo 4 in
const GLIDES: Glide[] = [
  // f0-52: already easing back at f0, to hold all four ("siloed and quite isolated")
  { f0: -16, f1: 52, k: K_WIDE, dy: lookA(K_WIDE) - lookA(K0) },
  // f44-80: in and left, onto the first three ("And so they're sort of like")
  { f0: 44, f1: 80, k: K_CLOSE, dx: X_L, dy: lookA(K_CLOSE) - lookA(K_WIDE) },
  // f66-192: ONE lateral move ("they don't see like a holistic view of you as a person"): a creep …
  { f0: 66, f1: 192, dx: CREEP },
  // … and its one decisive crossing, f114-143
  { f0: 114, f1: 143, dx: STEP },
  // f176-210: back out to the row's centre, the base line up to y 940 ("And Muse")
  { f0: 176, f1: 210, k: K_WIDE, dx: -(X_L + CREEP + STEP), dy: lookB(K_WIDE) - lookA(K_CLOSE) },
  // f206-end: the slow push on the figure, to the end of the clip
  { f0: 206, f1: 372, k: K_TAIL, dy: lookB(K_TAIL) - lookB(K_WIDE) },
];
const CAM = makeClockCam({ x: 0, y: lookA(K0), k: K0 }, GLIDES, DURATION + 2);
export const SILOED_CAM_CHECK = camCheck(CAM.at, 0, DURATION - 1);

// --- the light pool: on the figure, then each silo in turn on the travel, then back on the whole person ---
const POOL_Y = -118;
const xOpen = (i: number) => siloX(i, GAP_OPEN);
const POOL = makePoolTrack(
  { x: 0, y: POOL_Y },
  [
    { f0: 48, f1: 78, x: xOpen(0), y: POOL_Y },
    { f0: 90, f1: 112, x: xOpen(1), y: POOL_Y },
    { f0: 122, f1: 146, x: xOpen(2), y: POOL_Y },
    { f0: 154, f1: 178, x: xOpen(3), y: POOL_Y },
    { f0: 186, f1: 224, x: 0, y: POOL_Y + 70 },
    { f0: 240, f1: 272, x: 0, y: POOL_Y + 10 },
    { f0: 276, f1: 350, x: 22, y: POOL_Y - 16 },
  ],
  DURATION + 2,
);

// --- the tube: a rigid glass column that rises out of the slot (clipped at the tile's top edge) ------------
const Tube: React.FC<{ x: number; top: number; out: number; k: number; part: "back" | "front" }> = ({ x, top, out, k, part }) => {
  const uid = `tb${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (out <= 0.02) return null;
  const x0 = x - TUBE.w / 2;
  const y0 = top - out; // its cap's top edge; the tube is always TUBE.h long, the rest is inside the tile
  const yb = y0 + TUBE.h + 2;
  const rim = TUBE.rimPx / k;
  const hw = rim / 2;
  const r = TUBE.r;
  const sw = Math.max(TUBE.w * 0.085, 3 / k);
  return (
    <g>
      <defs>
        <clipPath id={uid}>
          <rect x={f3(x - 2000)} y={f3(top - 4000)} width={4000} height={4000} />
        </clipPath>
        <clipPath id={`${uid}k`}>
          <rect x={f3(x0 - 1)} y={f3(y0 - 1)} width={f3(TUBE.w + 2)} height={f3(TUBE.cap + 1)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid})`}>
        {part === "back" ? (
          <path d={rectPath(x0, y0, TUBE.w, TUBE.h + 2, r, true, false)} fill={COLOR.glass} fillOpacity={TUBE.tint} />
        ) : (
          <>
            <rect x={f3(x0 + TUBE.w * 0.14)} y={f3(y0 + TUBE.cap + 5)} width={f3(sw)} height={f3(TUBE.h - TUBE.cap - 8)} rx={f3(sw / 2)} fill={COLOR.glass} fillOpacity={TUBE.streak} />
            <path
              d={`M${f3(x0 + hw)} ${f3(yb)}V${f3(y0 + hw + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x0 + hw + r)} ${f3(y0 + hw)}H${f3(x0 + TUBE.w - hw - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x0 + TUBE.w - hw)} ${f3(
                y0 + hw + r,
              )}V${f3(yb)}`}
              fill="none"
              stroke={COLOR.glass}
              strokeOpacity={TUBE.rimA}
              strokeWidth={f3(rim)}
            />
            <g clipPath={`url(#${uid}k)`}>
              <path d={rectPath(x0, y0, TUBE.w, TUBE.cap + 3 * r, r, true, false)} fill={COLOR.glass} />
            </g>
          </>
        )}
      </g>
    </g>
  );
};

// --- the sweep over the whole figure (LightSweep's recipe, clipped to the figure, not to a rect) ----------
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const FIGURE_D = bigBustPath(0, TOP, BUST_H) + rectPath(-BUST_H / 2, TOP, BUST_H, W, RADIUS * S_TILE);
const FigureSweep: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  const uid = `sw${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (t <= 0 || t >= 1) return null;
  const x = -BUST_H / 2;
  const y = TOP - BUST_H;
  const h = BUST_H + W;
  const band = SWEEP.band / k;
  const skew = Math.tan((SWEEP.angle * Math.PI) / 180) * h;
  const cx = lerp(x - band - skew, x + BUST_H + band, t);
  return (
    <g>
      <defs>
        <clipPath id={uid}>
          <path d={FIGURE_D} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid})`}>
        <path
          d={`M${f3(cx - band / 2)} ${f3(y + h)}L${f3(cx - band / 2 + skew)} ${f3(y)}L${f3(cx + band / 2 + skew)} ${f3(y)}L${f3(cx + band / 2)} ${f3(y + h)}Z`}
          fill="#FFFFFF"
          fillOpacity={SWEEP.alpha}
          style={{ filter: `blur(${f3(SWEEP.soft / k)}px)` }}
        />
      </g>
    </g>
  );
};

const SiloedToWhole: React.FC<Props> = ({ strip }) => {
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const k = cam.k;
  const band = amberBandM(cam);
  const pool = POOL(f);
  const gap = gapAt(f);
  const sealed = f >= SEAL;
  const lift = sealed ? 0 : closeLift(f);
  const dy = LIFT_DY * S_TILE * smoothstep(lift);
  const agent = agentAt(f);
  const top = TOP - dy;

  // the four silos: ONE union silhouette for their shadow (so no silo's shadow falls on its neighbour)
  const silos = GLYPHS.map((glyph, i) => ({ glyph, i, x: siloX(i, gap), out: tubeAt(f, i), slot: slotAt(f, i) }));
  const sil: SilItem[] = [];
  if (sealed) sil.push({ d: bigBustPath(0, TOP, BUST_H) });
  else
    for (const s of silos) {
      sil.push({ d: rectPath(s.x - W / 2, top, W, W, RADIUS * S_TILE) });
      sil.push({ d: bustStrip(s.x - ((s.i + 0.5) / N - 0.5) * BUST_H, top, BUST_H, s.i, N).d });
      if (s.out > 0.05) sil.push({ d: rectPath(s.x - TUBE.w / 2, top - s.out, TUBE.w, s.out, Math.min(TUBE.r, s.out), true, false), a: 0.32 });
    }
  const slotH = Math.max(EDGE.SLOT / k, 2 * S_TILE);

  return (
    <AbsoluteFill>
      <MuseStage S={f} cam={cam} rest={CAM.rest} pool={{ x: pool.x, y: pool.y, strength: pool.strength }}>
        {/* the agent: comes up from the bottom edge and docks under the row, its top edge on the base line */}
        {f >= T.agent[0] ? <AgentTile x={agent.x} floor={agent.y} k={k} size={AGENT_SIZE} band={band} slot={false} lift={agent.lift} /> : null}
        {sealed ? (
          <>
            <UnionShadow sil={sil} />
            <ServiceBase x={0} floor={FLOOR} k={k} size={W} glyphs={GLYPHS} />
            <BigBust cx={0} bottom={TOP} h={BUST_H} k={k} shadow={0} />
          </>
        ) : (
          <>
            {silos.map((s) => (
              <UnionShadow key={`c${s.i}`} sil={[]} lift={lift} contact={{ x: s.x, y: FLOOR, w: W }} />
            ))}
            <UnionShadow sil={sil} lift={lift} />
            {silos.map((s) => (
              <React.Fragment key={s.i}>
                <Tube x={s.x} top={top} out={s.out} k={k} part="back" />
                <BustSilo x={s.x} floor={FLOOR} k={k} size={W} glyph={s.glyph} i={s.i} n={N} bustH={BUST_H} glass={0} lift={lift} shadow={0} />
                {s.slot > 0.01 ? (
                  <rect x={f3(s.x - TUBE.w / 2)} y={f3(top - slotH * 0.25)} width={f3(TUBE.w)} height={f3(slotH * s.slot)} rx={f3(Math.min((slotH * s.slot) / 2, 1.2 * S_TILE))} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
                ) : null}
                <Tube x={s.x} top={top} out={s.out} k={k} part="front" />
              </React.Fragment>
            ))}
          </>
        )}
        <FigureSweep k={k} t={winU(f, T.sweep[0], T.sweep[1])} />
      </MuseStage>
      {strip ? (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1080, height: 170, border: "2px dashed rgba(243,235,221,0.5)" }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** Numbers for the builder's report (bun -e): the camera, and where things are on screen. */
export const SILOED_PROBE = (f: number) => {
  const c = CAM.at(f);
  const gap = gapAt(f);
  const a = agentAt(f);
  const edges = [0, 1, 2, 3].map((i) => [Math.round(toScreenM(c, siloX(i, gap) - TUBE.w / 2, 0).x), Math.round(toScreenM(c, siloX(i, gap) + TUBE.w / 2, 0).x)]);
  return {
    k: +c.k.toFixed(3),
    gap: +gap.toFixed(2),
    floorY: Math.round(toScreenM(c, 0, FLOOR).y),
    tubeTopY: Math.round(toScreenM(c, 0, TOP - TUBE.h).y),
    bustTopY: Math.round(toScreenM(c, 0, TOP - BUST_H).y),
    edges,
    agentTop: +toScreenM(c, 0, a.y - AGENT_SIZE).y.toFixed(1),
    agentBottom: Math.round(toScreenM(c, 0, a.y).y),
    agentGapWorld: +(a.y - AGENT_SIZE - FLOOR).toFixed(2),
    tubes: [0, 1, 2, 3].map((i) => Math.round(tubeAt(f, i))),
    pitch: PITCH,
    contact: CONTACT,
  };
};

export default SiloedToWhole;
