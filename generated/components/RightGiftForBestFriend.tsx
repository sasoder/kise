import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, METRIC, SWEEP, TRACK, clamp01, lerp, mixHex, rectPath, smoothstep } from "./stoutShared";
import {
  AgentTile,
  AmberThread,
  CUTS,
  FPS,
  GIFT,
  LIFT_DY,
  MuseStage,
  PersonTile,
  Piece,
  Slotted,
  TILE,
  amberBandM,
  liftAt,
  makeClockCam,
  makePoolTrack,
  makeThread,
  restToRest,
  tone,
  winU,
  type Glide,
  type PersonVariant,
  type PieceDef,
  type Thread,
} from "./museShared";

// ---------------------------------------------------------------------------
// RightGiftForBestFriend — cut 6 of Alexandr Wang, "Alex on agentic commerce" (Cheeky Pint S4E03), Cheeky
// Pint S4 style on the clip's shared module (museShared.tsx; brief out/musecommerce/briefs/BRIEF.md).
// 1080x1920 (9:16), 23.976 fps, opaque.
//
// CHECK LINE: The agent draws on what it knows about your family, your coworkers and your friends at once to
// pick the one right gift for your best friend.
//
// THE LINE (heard just before: "Muse has this holistic context into you as a person ... So it…"), onsets in
// frames at 23.976:
//   can -4 · holistically 5 · understand 16 · things 30 · about 43 · your 48 · family 51 · or 60 · things 65 ·
//   about 70 · your 74 · coworkers 77 · or 86 · things 90 · about 94 · your 98 · friends 101 · and 108 ·
//   then 116 · like 120 · help 125 · you 131 · co 134 · -optimize 141 · across 153 · all 160 · those 166 ·
//   to 170 · get 174 · you 178 · the 184 · exact 194 · right 201 · gift 206 · for 213 · your 222 · best 238 ·
//   friend 250 · in 257 · the 265 · context 268 · of 278 · your 285 · friend 288 · group 293 · based 298 ·
//   on 303 · what 306 · it 308 · knows 310 · about 313 · your 316 · friend 319 · group. 322 · (slot ends 325)
// WINDOW: seq 81.206 -> 94.761, span 13.555 s. DURATION = round(13.555 x 23.976) = 325, + 16-frame tail = 341.
//
// ONE MOTION: amber threads reach out of the agent to three circles of people, and each person a thread
// touches lights up; what they know runs back along the threads as beads into the agent; out of the agent's
// slot rises one gift, which rides the friends thread down to one friend. The camera travels with the reach
// (you -> family -> coworkers -> friends), opens to the whole picture, closes on the gift and follows it.
//
// LAYOUT (9:16, scaled up): one compact vertical stack on the pair's centre line. FAMILY and COWORKERS stand
//   side by side in one band 90 px over the pair (just room for the caption strip between), their names OVER
//   them (the threads come up from below); the FRIENDS ring is below, its name under it. The band and the pair
//   are whole in frame from f0 until the camera leaves with the gift; the ring crosses the bottom edge only.
//   Between crossings every tile and name is wholly in (>= 50 px) or wholly out.
//   The best friend is the centre of the ring, a size up (82 vs 72), one silhouette ("plain") from first frame.
//   Names: a constant 52 screen px (cap height 37 px) at every scale; never in the caption strip.
//   Group tiles on screen: 143 -> 166 px in the opening, 124-126 px in the whole picture, 174 px on the slot,
//   187 -> 194 px at the end.
//
// GESTURES (gesture -> words -> frames)
//   f0: the band (board tone) over you + the amber agent, the pair under the caption strip; the family thread
//     is already out of the agent's top-left corner and the camera is already pushing in.
//   the family thread runs up-left at 7 px/f; its tip touches the child f16, then f28, f39, f51: each tile
//     turns cream from the frame it is touched (12 f) -> "things about your family" -> f0-55
//   the coworkers thread leaves the agent f51 at 11 px/f; touches f66, 73, 81, 89, 96 ->
//     "things about your coworkers" -> f51-98
//   the friends thread leaves the agent f67 at 16 px/f; touches the best friend f102, then the ring f111,
//     122, 136, 147 (each stretch grows out from under the tile just lit) -> "your friends and then" -> f67-149
//   beads (22 px, a hot wake behind each, 84 world px apart) come out from under the lit tiles from f96 and run
//     inward at 12 px/f into the agent (first arrivals f110-154), and keep running to the end ->
//     "help you co-optimize across all those" -> f96 on
//   the camera: one slow push on the band + pair, leaning from the family to the coworkers (k 1.99 -> 2.3,
//     f0-82) -> down and back, the ring in over the bottom edge f97-116 (f74-114) -> the whole picture, one
//     slow push k 1.72 -> 1.74 (f106-180) -> in on the agent's slot with the band, the pair lifted over the
//     caption strip, the ring out over the bottom edge f171-192 (k 2.42, f166-194) -> with the gift down to
//     the best friend, band and pair out over the top f213-243 (f200-254) -> one slow push on the ring, still
//     running on the last frame (k 2.6 -> 2.7).
//   the gift rises out of the agent's slot, decelerating -> "to get you the exact right gift" -> f178-205
//   the gift lifts off the agent and rides the friends thread down; the best friend lifts to meet it f237-245;
//     the gift's foot meets the friend's top edge on f250 (contact) and both settle f250-259 -> "for your
//     best friend" -> f211-259
//   THE ONE CLICK: one light band across the gift AND the friend's tile, on the gift from the contact frame ->
//     "friend" -> f250-262
//   settled and alive: the best friend with the gift at the frame's middle (gift foot y 860, tile to y 1075),
//     two friends beside them, two below the caption strip, FRIENDS under them, the thread coming down from the
//     top with beads still running up it, the pool drifting, the slow push -> f262-340
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = CUTS.RightGiftForBestFriend.duration; // 341
const F_END = DURATION - 1;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

type P = [number, number];

// ===========================================================================
// THE WORLD (world px). Laid out for 9:16 as one compact vertical stack on a centre line: the two upper groups
// side by side in one band, you + the agent under them, the friends ring below. Every group crosses the frame
// through its TOP or BOTTOM edge only (a label is 37 px tall: it crosses in a frame or two), never sideways.
// Written relative to the pair: x from the pair's centre line, y from its floor.
// ===========================================================================
const OX = 1000;
const OY = 1058;
const YOU = { x: OX - 52, floor: OY, size: 116 };
const AGENT = { x: OX + 62, floor: OY, size: TILE };
const AGENT_C: P = [AGENT.x, AGENT.floor - AGENT.size / 2];
const AGENT_TOP = AGENT.floor - AGENT.size;

type Member = { x: number; y: number; size: number; variant: PersonVariant };
const m = (x: number, y: number, variant: PersonVariant, size = 72): Member => ({ x: OX + x, y: OY + y, size, variant });
/** The bottom edge of the upper band (both groups stand on it; their names sit over it, clear of the threads
 *  that come up from the agent). The band is 90 px over the pair: just room for the caption strip between. */
const BAND = -206;
const PITCH = 77;
const BAND_TOP = BAND - PITCH - 72;
const ROW_LO = BAND - 36;
const ROW_HI = ROW_LO - PITCH;
const FAM_X = -127;
const COW_X = 88.5;
// each group's members in the order its thread touches them (x, y = the tile's centre)
const FAMILY: Member[] = [m(FAM_X + PITCH / 2, BAND - 28, "child", 56), m(FAM_X - PITCH / 2, ROW_LO, "bun"), m(FAM_X - PITCH / 2, ROW_HI, "long"), m(FAM_X + PITCH / 2, ROW_HI, "plain")];
const COWORKERS: Member[] = [m(COW_X - PITCH / 2, ROW_LO, "cap"), m(COW_X + PITCH / 2, ROW_LO, "long"), m(COW_X + PITCH, ROW_HI, "plain"), m(COW_X, ROW_HI, "curly"), m(COW_X - PITCH, ROW_HI, "bun")];
// The best friend: the centre of the ring and a size up from the other four; ONE silhouette, always.
const BF_Y = 430;
const BF = { x: OX, y: OY + BF_Y, size: 82 };
const RING_HI = BF_Y - 5;
const RING_LO = BF_Y + 154;
const FRIENDS: Member[] = [m(0, BF_Y, "plain", BF.size), m(142, RING_HI, "cap"), m(112, RING_LO, "long"), m(-112, RING_LO, "bun"), m(-142, RING_HI, "curly")];
const GROUPS = [
  { name: "FAMILY", members: FAMILY, label: { x: OX + FAM_X, y: OY + BAND_TOP, above: true } },
  { name: "COWORKERS", members: COWORKERS, label: { x: OX + COW_X, y: OY + BAND_TOP, above: true } },
  { name: "FRIENDS", members: FRIENDS, label: { x: OX, y: OY + RING_LO + 36, above: false } },
] as const;

const pts = (ms: Member[]): P[] => ms.map((q) => [q.x, q.y]);
const w = (x: number, y: number): P => [OX + x, OY + y];
// the three threads: out of the agent (from under its tile), through every member's tile, ending under the last.
// The friends thread comes down the left of the best friend (clear of the gift that will stand on them) and
// goes in under their left edge.
const THREADS: Thread[] = [
  makeThread([AGENT_C, w(16, -122), w(-40, -176), ...pts(FAMILY)]),
  makeThread([AGENT_C, w(86, -124), w(70, -176), ...pts(COWORKERS)]),
  makeThread([AGENT_C, w(72, 30), w(96, 130), w(46, 238), w(-52, BF_Y - 104), w(-73, BF_Y - 18), ...pts(FRIENDS)]),
];

/** The distance along a thread at which its tip first touches a tile (its edge), and at which it is under its centre. */
const reach = (th: Thread, q: Member) => {
  const h = q.size / 2;
  let dTouch = th.len;
  let dCentre = th.len;
  let best = Infinity;
  for (let d = 0; d <= th.len; d += 0.5) {
    const [x, y] = th.at(d);
    const inside = Math.abs(x - q.x) <= h && Math.abs(y - q.y) <= h;
    if (inside && dTouch === th.len) dTouch = d;
    const r = Math.hypot(x - q.x, y - q.y);
    if (r < best) {
      best = r;
      dCentre = d;
    }
  }
  return { dTouch, dCentre };
};

// ===========================================================================
// THE CLOCK
// ===========================================================================
/** Each thread's tip runs at a constant speed (world px / f): the farther the group, the faster the reach. */
const V_TIP = [7, 11, 16];
/** The frame each thread's tip touches its first tile. */
const FIRST_TOUCH = [16, 66, 102];
/** Beads: constant speed inward, one every BEAD_T frames (84 world px apart); released from under lit tiles from BEAD_F0. */
const V_BEAD = 12;
const BEAD_T = 7;
const BEAD_F0 = 96;
const GIFT_RISE: [number, number] = [178, 205];
const GIFT_GO: [number, number] = [211, 250];
/** THE ONE CLICK: 12 frames across the gift + the friend's tile, from the contact frame. */
const SWEEP_F: [number, number] = [GIFT_GO[1], GIFT_GO[1] + 12];

const PLAN = THREADS.map((th, g) => {
  const R = GROUPS[g].members.map((q) => reach(th, q));
  const fStart = FIRST_TOUCH[g] - R[0].dTouch / V_TIP[g]; // the frame the tip leaves the agent's centre
  return {
    th,
    fStart,
    head: (f: number) => Math.max(0, Math.min(th.len, (f - fStart) * V_TIP[g])),
    touch: R.map((r) => fStart + r.dTouch / V_TIP[g]),
    centre: R.map((r) => r.dCentre),
  };
});

/**
 * The beads on thread g at frame f, as distances from the agent. A bead is one of a steady stream (arriving
 * in the agent every BEAD_T frames); it comes out from under the farthest tile that was already lit when it
 * would have passed under it, and never before BEAD_F0: nothing appears on open ground.
 */
const beadsOf = (g: number, f: number) => {
  const p = PLAN[g];
  const out: number[] = [];
  const n0 = Math.ceil(f / BEAD_T);
  for (let n = n0; n <= n0 + Math.ceil(p.th.len / V_BEAD / BEAD_T) + 1; n++) {
    const d = (n * BEAD_T + g * 2 - f) * V_BEAD; // its distance now
    if (d <= 0) continue;
    let src = -1;
    for (let i = 0; i < p.centre.length; i++) {
      const tAt = f - (p.centre[i] - d) / V_BEAD; // when it was under tile i
      if (p.centre[i] >= d && tAt >= Math.max(p.touch[i] + 3, BEAD_F0)) src = Math.max(src, p.centre[i]);
    }
    if (src >= 0) out.push(d);
  }
  return out;
};

// --- the gift ---------------------------------------------------------------------------------------------
/** The gift's size: the tile it scales with (so it stands on the friend's tile as it does in the agent's slot). */
const GIFT_SIZE = 84;
const GS = GIFT_SIZE / TILE;
/** GIFT at the gift's own size, as a piece of a tile `tileSize` wide. */
const giftIn = (tileSize: number): PieceDef => {
  const g = GIFT_SIZE / tileSize;
  return { name: "gift", w: GIFT.w * g, h: GIFT.h * g, render: (o) => GIFT.render({ ...o, s: o.s * g }) };
};
const GIFT_IN_AGENT = giftIn(AGENT.size);
const GIFT_IN_BF = giftIn(BF.size);
const BF_TOP = BF.y - BF.size / 2;
const BF_LIFT = (LIFT_DY * BF.size) / TILE;
// its way: off the agent's top, round its right shoulder onto the friends thread, down it, onto the friend's top edge
const GIFT_PATH = makeThread([[AGENT.x, AGENT_TOP], w(132, -44), w(108, 50), w(96, 130), w(46, 238), [BF.x, BF_TOP - BF_LIFT]]);
const giftAt = (f: number) => {
  const u = clamp01(winU(f, GIFT_GO[0], GIFT_GO[1]));
  const [x, y] = GIFT_PATH.at(GIFT_PATH.len * restToRest(u, 2.1));
  const lift = u <= 0 || u >= 1 ? 0 : smoothstep(u / 0.18) * (1 - smoothstep((u - 0.72) / 0.28));
  return { x, y, lift, u };
};

// --- camera: one travelling look (the frame's middle), keys relative to the pair -----------------------------
type Key = { f0: number; f1: number; x: number; y: number; k: number; warp?: number };
const K_OPEN = 2.3; // the band + the pair: FAMILY + COWORKERS span 927 px, group tiles 166 px
const K_WIDE = 1.74; // the whole network: group tiles 125 px
const K_SLOT = 2.42; // the band + the pair again, the pair above the caption strip: tiles 174 px
const K_END = 2.6;
/** The look y that puts the pair's top edge on screen y `sy` at scale k (the pair under the caption strip). */
const lookPairTop = (sy: number, k: number) => -YOU.size - (sy - 960) / k;
/** The resolved frame: the best friend's top edge (= the gift's foot) on screen y 860, the tile clear of the caption strip. */
const END_Y = BF_Y - BF.size / 2 + (960 - 860) / K_END;
const START = { x: OX - 4, y: OY + lookPairTop(1256, 1.9), k: 1.9 };
const KEYS: Key[] = [
  { f0: -30, f1: 38, x: -14, y: lookPairTop(1256, 2.18), k: 2.18 }, // already pushing in at f0, leaning to the family
  { f0: 30, f1: 82, x: 10, y: lookPairTop(1256, K_OPEN), k: K_OPEN }, // still pushing, leaning over to the coworkers
  { f0: 74, f1: 114, x: 0, y: 131, k: 1.72 }, // down and back: the friends come in over the bottom edge
  { f0: 106, f1: 180, x: 0, y: 133, k: K_WIDE }, // the whole picture, one slow push
  { f0: 166, f1: 194, x: 0, y: -(1076 - 960) / K_SLOT, k: K_SLOT }, // in on the agent's slot, the pair lifted over the caption strip; the ring leaves over the bottom edge
  { f0: 200, f1: 248, x: 0, y: END_Y, k: K_SLOT }, // with the gift, down to the best friend; band and pair leave over the top
  { f0: 226, f1: 254, x: 0, y: END_Y, k: K_END }, // closing on the ring as it arrives
  { f0: 250, f1: F_END + 44, x: 0, y: END_Y + 3, k: 2.74 }, // one slow push, still running at the last frame
];
const GLIDES: Glide[] = (() => {
  const out: Glide[] = [];
  let prev = { x: START.x - OX, y: START.y - OY };
  for (const q of KEYS) {
    out.push({ f0: q.f0, f1: q.f1, dx: q.x - prev.x, dy: q.y - prev.y, k: q.k, warp: q.warp });
    prev = q;
  }
  return out;
})();
export const CAM = makeClockCam(START, GLIDES, F_END);
const POOL = makePoolTrack(
  { x: OX + 10, y: OY - 120 },
  [
    { f0: 0, f1: 34, x: OX + FAM_X, y: OY + ROW_LO - 30 },
    { f0: 46, f1: 80, x: OX + COW_X, y: OY + ROW_LO - 30 },
    { f0: 84, f1: 116, x: OX, y: OY + BF_Y + 20 },
    { f0: 120, f1: 168, x: OX + 40, y: OY + 60 },
    { f0: 168, f1: 204, x: OX + 62, y: OY - 110 },
    { f0: 210, f1: 252, x: OX, y: OY + BF_Y - 50 },
    // breathing: the pool keeps drifting round the best friend to the last frame
    { f0: 256, f1: 300, x: OX + 46, y: OY + BF_Y - 80 },
    { f0: 296, f1: F_END + 20, x: OX - 40, y: OY + BF_Y - 20 },
  ],
  F_END,
);

// --- for the builder's checks: every tile and label as a box, the frames of every touch ----------------------
const LABEL_PX = 52;
const LABEL_DROP = 16;
/** The labels' widths in screen px, measured on the render (+ 4). */
const LABEL_W: Record<string, number> = { FAMILY: 190, COWORKERS: 344, FRIENDS: 230 };
type Box = { name: string; group: string; x0: number; y0: number; x1: number; y1: number };
const tileBox = (name: string, group: string, x: number, y: number, size: number): Box => ({ name, group, x0: x - size / 2, y0: y - size / 2, x1: x + size / 2, y1: y + size / 2 });
const BOXES: Box[] = [
  tileBox("you", "pair", YOU.x, YOU.floor - YOU.size / 2, YOU.size),
  tileBox("agent", "pair", AGENT.x, AGENT.floor - AGENT.size / 2, AGENT.size),
  ...GROUPS.flatMap((G) => G.members.map((q, i) => tileBox(`${G.name}${i}`, G.name, q.x, q.y, q.size))),
];
const LABEL_CAP = LABEL_PX * METRIC.cap;
const LABELS = GROUPS.map((G) => ({
  name: G.name,
  x: G.label.x,
  y: G.label.y,
  w: LABEL_W[G.name],
  top: G.label.above ? -LABEL_DROP - LABEL_CAP : LABEL_DROP,
  bottom: G.label.above ? -LABEL_DROP : LABEL_DROP + LABEL_CAP,
}));
export const DEBUG = { PLAN, GIFT_PATH, beadsOf, giftAt, BOXES, LABELS, BF, BF_TOP, GIFT_H: GIFT.h * GS, V_BEAD, BEAD_T };

// ===========================================================================
// PIECES OF THE PICTURE
// ===========================================================================
/** A group's name, over it (`above`) or under it: Söhne Kräftig caps at a constant 52 screen px (cap height
 *  37 px: 9 px on a 270 px phone, at every scale of the camera), lo tone while the group is context, cream once lit. */
const GroupLabel: React.FC<{ x: number; y: number; k: number; text: string; lit: number; above: boolean }> = ({ x, y, k, text, lit, above }) => {
  const fs = LABEL_PX / k;
  return (
    <text
      x={x + (TRACK.label * fs) / 2}
      y={y + (above ? -LABEL_DROP : LABEL_DROP + LABEL_CAP) / k}
      fontFamily={FONT_LABEL}
      fontWeight={500}
      fontSize={fs}
      letterSpacing={`${TRACK.label}em`}
      textAnchor="middle"
      fill={mixHex(COLOR.inkCreamLo, COLOR.inkCream, clamp01(lit))}
      style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
    >
      {text}
    </text>
  );
};

/** A bead's radius in world px: never under 11 screen px (a 22 px bead = 5.5 px on a 270 px phone). */
const beadR = (k: number) => Math.max(6.75, 11 / k);
/**
 * The beads of one thread, drawn on it (under the tiles): each a hot head with a short hot wake behind it on
 * the thread, so a still frame already says which way it runs (into the agent). `head` = how far the thread
 * is drawn: a wake never runs past it.
 */
const Beads: React.FC<{ thread: Thread; beads: number[]; head: number; k: number }> = ({ thread, beads, head, k }) => {
  const r = beadR(k);
  return (
    <g>
      {beads
        .filter((d) => d <= head)
        .map((d, i) => {
          const [x, y] = thread.at(d);
          const wake = thread.path(d, Math.min(head, d + r * 3.4));
          const wake2 = thread.path(d, Math.min(head, d + r * 2));
          return (
            <g key={i}>
              <circle cx={x + 1.5} cy={y + 3} r={r} fill={COLOR.shadow} fillOpacity={0.28} />
              {wake ? <path d={wake} fill="none" stroke={COLOR.amberHot} strokeWidth={r * 0.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
              {wake2 ? <path d={wake2} fill="none" stroke={COLOR.amberHot} strokeWidth={r * 0.95} strokeLinecap="round" strokeLinejoin="round" /> : null}
              <circle cx={x} cy={y} r={r} fill={COLOR.amberTop} />
              <circle cx={x} cy={y} r={r * 0.62} fill={COLOR.amberHot} />
            </g>
          );
        })}
    </g>
  );
};

/** THE ONE CLICK: LightSweep's recipe (band, angle, softness, strength), clipped to the gift standing on the
 *  friend's tile instead of to one rect, so one band crosses both. `top` = the tile's top edge now. */
const GiftSweep: React.FC<{ top: number; k: number; t: number }> = ({ top, k, t }) => {
  const uid = `gs${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (t <= 0 || t >= 1) return null;
  const x = BF.x - BF.size / 2;
  const bw = 56 * GS;
  const bh = 40 * GS;
  const lw = 66 * GS;
  const lh = 15 * GS;
  const y = top - bh - lh;
  const h = BF.size + bh + lh;
  const band = SWEEP.band / k;
  const skew = Math.tan((SWEEP.angle * Math.PI) / 180) * h;
  // the band is already on the gift on the contact frame and leaves the tile on the last one: no dead run-in
  const cx = lerp(x - skew - band / 2 + (BF.size - lw) / 2, x + BF.size + band / 2, t);
  return (
    <g>
      <defs>
        <clipPath id={uid}>
          <path d={rectPath(x, top, BF.size, BF.size, (4 * BF.size) / TILE)} />
          <rect x={BF.x - bw / 2} y={top - bh} width={bw} height={bh} />
          <path d={rectPath(BF.x - lw / 2, y, lw, lh, 3 * GS)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid})`}>
        <path
          d={`M${cx - band / 2} ${y + h}L${cx - band / 2 + skew} ${y}L${cx + band / 2 + skew} ${y}L${cx + band / 2} ${y + h}Z`}
          fill="#FFFFFF"
          fillOpacity={SWEEP.alpha}
          style={{ filter: `blur(${SWEEP.soft / k}px)` }}
        />
      </g>
    </g>
  );
};

const RightGiftForBestFriend: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const k = cam.k;
  const band = amberBandM(cam);

  const landed = f >= GIFT_GO[1];
  const flying = f >= GIFT_GO[0] && !landed;
  const gift = giftAt(f);
  const giftOut = restToRest(winU(f, GIFT_RISE[0], GIFT_RISE[1]), 2.2);
  // the best friend lifts to meet the gift and settles with it on landing
  const bfLift = liftAt(f, GIFT_GO[1] - 13, GIFT_GO[1], 8, 9);
  const bfTopNow = BF_TOP - BF_LIFT * smoothstep(clamp01(bfLift));

  return (
    <AbsoluteFill>
      <MuseStage S={f} cam={cam} rest={CAM.rest} pool={POOL(f)}>
        {/* the threads lie on the ground, under every tile; the beads run on them */}
        {PLAN.map((p, g) => (
          <AmberThread key={g} thread={p.th} k={k} head={p.head(f)} band={band} />
        ))}
        {PLAN.map((p, g) => (
          <Beads key={g} thread={p.th} beads={beadsOf(g, f)} head={p.head(f)} k={k} />
        ))}
        {GROUPS.map((G, g) => (
          <GroupLabel key={G.name} x={G.label.x} y={G.label.y} above={G.label.above} k={k} text={G.name} lit={1 - tone(f, PLAN[g].touch[0])} />
        ))}
        {GROUPS.map((G, g) =>
          G.members.map((q, i) => {
            const dim = tone(f, PLAN[g].touch[i]);
            const floor = q.y + q.size / 2;
            if (g === 2 && i === 0) {
              return (
                <Slotted
                  key={`${g}-${i}`}
                  x={q.x}
                  floor={floor}
                  k={k}
                  size={q.size}
                  face={{ kind: "person", variant: q.variant }}
                  dim={dim}
                  lift={bfLift}
                  piece={landed ? GIFT_IN_BF : null}
                  out={landed ? 1 : 0}
                />
              );
            }
            return <PersonTile key={`${g}-${i}`} x={q.x} floor={floor} k={k} size={q.size} variant={q.variant} dim={dim} />;
          }),
        )}
        <PersonTile x={YOU.x} floor={YOU.floor} k={k} size={YOU.size} variant="plain" />
        <AgentTile x={AGENT.x} floor={AGENT.floor} k={k} band={band} slot={GIFT_IN_AGENT.w} piece={!flying && !landed && giftOut > 0 ? GIFT_IN_AGENT : null} out={giftOut} />
        {landed ? <GiftSweep top={bfTopNow} k={k} t={winU(f, SWEEP_F[0], SWEEP_F[1])} /> : null}
        {flying ? <Piece def={GIFT} x={gift.x} bottom={gift.y} k={k} size={GIFT_SIZE} lift={gift.lift} /> : null}
      </MuseStage>
    </AbsoluteFill>
  );
};

export default RightGiftForBestFriend;
export { GS as GIFT_SCALE };
