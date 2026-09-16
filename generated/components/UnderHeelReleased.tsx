import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
// THE WORLD. `ImpossibleTasks.tsx` is the sandbox this piece is set in, and
// every constant and every piece of geometry it stands on is IMPORTED from it,
// never restated: the 900 x 700 ink box, its crowd, the mark above, the dashed
// gate, the camera's endpoints, LINE_SPEED, TONE_DUR.
//
// NOT the internet ring. In cut 1 the ring is only ever drawn as the word is
// said; nothing in this line is about the internet, so the world at rest here
// is box, crowd, dashed gate, mark, and nothing else above the wall.
import {
  BOX_H,
  BOX_PATH,
  BOX_W,
  BOX_X0,
  BOX_Y0,
  CENTRE_X,
  COLS,
  CONTENT_FINAL,
  CONTENT_OPEN,
  GATE_DASH,
  GATE_GAP,
  GATE_X0,
  GATE_X1,
  IN_Y0,
  IN_Y1,
  K_FINAL,
  K_OPEN,
  LINE_SPEED,
  LINE_TIP_Y,
  MARK,
  NSEAT,
  ROWS,
  SEATS,
  SEAT_AT,
  STROKE,
  TONE_DUR,
  WORLD_H,
  WORLD_W,
  clamp01,
  clampi,
  smooth,
} from "./ImpossibleTasks";

export const FPS = 24;
// Dwarkesh clip `Ajeya_DC_Way`, Ajeya Cotra quoting the instinct people in DC
// say out loud: "Why don't you punish the model for doing these bad things?
// Like, why don't you, like, bring it under heel and, like, you know, show it
// who's boss?"
//
// SRT span 0:04.059 -> 0:09.640 at 24fps.
// round((9.640 - 4.059) * 24) = round(5.581 * 24) = round(133.944) = 134
// frames of speech, plus a 48 frame tail so the resolved state holds = 182.
export const DURATION = 182;

// ---------------------------------------------------------------------------
// "Under heel" — VERSION B, the lid RELEASES into the tail.
//
// Orange Dwarkesh style: opaque grid cutaway, 1080x1920, 24fps, two-tone warm
// yellow dots fully opaque, per-icon shadows, one eased camera move, one
// gesture per word.
//
// The concept is the DC instinct as a physical act. The sandbox box with the
// model inside it, the mark above at rest, the gate dashed — cut 1's world at
// rest, and nothing in it that this line does not say. Punish it (a signal from
// above drops onto the lid and the whole crowd darkens under it), it did bad
// things (five agents light up and press straight against their ceiling), so
// push the lid down on it (the top wall descends and the crowd is squeezed
// under it) and sit on the lid (the mark drops out of the sky and perches on
// it). Then, in the tail, the weight comes off again and the mark rides the lid
// back up, still sitting on it.
//
// NO INTERNET RING. Cut 1 draws the ring on the word; this line never mentions
// the internet, so the ring and its wifi glyph are not in this piece at all.
// The air between the mark and the lid is therefore empty and the mark's drop
// on "who's boss" is a clear fall through it.
//
// THE REST TONE IS RIPE HERE. In `ImpossibleTasks` an agent at rest is DEEP and
// only a task lights it. This piece needs the opposite opening, because the
// punishment IS the darkening: the crowd opens RIPE at f0 and goes deep under
// the bead. The deep tone is therefore the punished state for the rest of the
// piece, and the five that misbehave are the only ones that come back up.
// The dot's SIZE bump (1 + 0.35 * lit) is kept off the rest tone and driven
// only by a thread or by one of those five, so the crowd at f0 is cut 1's field
// at cut 1's density, in the ripe tone.
//
// Every gesture is one word. Nothing else happens.
//   THE ONE CAMERA MOVE: open at k 1.50 inside the
//     box (crowd bleeding off both sides, the mark
//     above the frame, content centre 140) and pull
//     back to k 0.95 / content centre -102, which is
//     `ImpossibleTasks`' own resolved framing — the
//     mark and the whole box in frame,
//     content centre at screen y 835 under the
//     captions. Keyed f0-14, warp 0.72; the damper
//     has it within 0.8% of the wide at f22 and
//     drifting 0.32% a frame, a third of the speed
//     at which a zoom reads as moving at all. No
//     other camera move in the piece   — "why don't you"       f0-22
//   PUNISH: one ink bead (r 4) drops from the bottom
//     of the mark straight down at one speed and
//     stops dead on the OUTSIDE face of the lid. No
//     flash on contact; it fades over 4 frames.
//     On contact the whole crowd goes ripe -> deep
//     in a wave from the top row down (smoothstep on
//     row over f16-24, each dot's own 6-frame ramp,
//     the last dot deep at f30)        — "punish the model"     f7-30
//   BAD THINGS: five agents, spread across the box's
//     width, no two in a column and none within two
//     rows of another, go deep -> ripe over TONE_DUR
//     at f33 / 36 / 39 / 42 / 45 and each sends a
//     reach STRAIGHT UP at LINE_SPEED, head-led,
//     that stops dead on the inside face of the lid.
//     Nothing answers. The five are dealt
//     longest-reach-first, so all five run at one
//     speed and the last is against the lid on
//     "things"                         — "doing these bad things" f33-49
//   UNDER HEEL: the lid DESCENDS. The top wall, gate
//     and all, moves down 160 world px over f77-93
//     on Easing.inOut(cubic); the box is rebuilt
//     every frame at height 700 - drop so it stays one
//     closed squircle and its floor never moves. The
//     five reaches shorten with it (their tips ride
//     the lid's inside face all the way down) and are
//     erased from the foot up over f87-93, so the tip
//     never leaves the wall. The crowd COMPACTS: the
//     inset top edge follows the lid and every seat
//     is re-spaced
//     linearly between it and the unchanged floor,
//     so the row pitch goes 23.71 -> 0.759 * 23.71 =
//     18.00 world px — a quarter out of the crowd's
//     height. The mark does not move
//                                      — "bring it under heel" f77-93
//   WHO'S BOSS: the OpenAI mark drops from its rest
//     height and sits on the lowered lid, its bottom
//     edge 14 world px above the lid's outside face,
//     f112-121, a 360.5 px fall through empty air,
//     eased out with a 7.9 px back overshoot, landing
//     on "boss"                        — "show it who's boss"   f112-122
//   RELEASE (this version): the lid rises back to
//     its rest height over f126-150 on one
//     Easing.inOut(cubic), carrying the mark with it
//     — the mark keeps its 14 px seat the whole way,
//     so lid and mark move as one — while the crowd
//     relaxes back onto its original seats. By f150
//     the box is exactly at rest as at f0, with two
//     differences: the crowd stays DEEP, because it
//     was punished, and the mark sits on the lid
//     rather than floating at its old height
//                                      — the tail               f126-150
//   HOLD. THE RESOLVED FRAME, for the editor: the box
//     back at its rest height, the crowd DEEP and
//     back on its own seats, and THE MARK SEATED ON
//     THE LID — bottom edge 14 world px above the
//     wall's outside face, at world y -359.5, dead
//     centre over the dashed gate. Nothing is above
//     it. It never fades, so the frame can be held
//     for as long as is wanted after 0:09.640
//                                      — tail                   f150-182
//
// ambient, throughout and not a gesture: `breath` on every dot, `sway` on the
// camera, the grid's own drift, and idle thread traffic across the crowd at the
// shared rate — its endpoints read the LIVE seat positions, so the traffic
// compacts and relaxes with the crowd instead of hanging in the old seats.
//
// Two things are derived rather than hand-set and both are noted where they are
// computed: the five bad agents' rungs are capped by the LINE_SPEED budget
// (the last one dealt has four frames to reach the lid, so it has to be near
// it), and the mark's landing overshoot uses Easing.back(0.775) rather than
// back(1.6), because back(1.6) over the 360.5 px drop overshoots 32.4 px and
// the brief caps the overshoot at 8; 0.775 puts it at 7.9, the same absolute
// overshoot the shallower 120 px press landed with.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and the rest tone in this piece
  accentDeep: z.string(), // deep: a punished dot
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotUnread: z.number(), // the dot body's opacity; the state ladder is colour
  idleThreadCount: z.number(),
  markSrc: z.string(), // the OpenAI mark, tinted white
  markSize: z.number(), // world px, square
  beats: z.object({
    why: z.number(), // "why"
    dont: z.number(), // "don't"
    you: z.number(), // "you"
    punish: z.number(), // "punish"
    the: z.number(), // "the"
    model: z.number(), // "model"
    forW: z.number(), // "for"
    doing: z.number(), // "doing"
    these: z.number(), // "these"
    bad: z.number(), // "bad"
    things: z.number(), // "things"
    like1: z.number(), // "like"
    why2: z.number(), // "why"
    dont2: z.number(), // "don't"
    you2: z.number(), // "you"
    like2: z.number(), // "like"
    bring: z.number(), // "bring"
    it: z.number(), // "it"
    under: z.number(), // "under"
    heel: z.number(), // "heel"
    and: z.number(), // "and"
    like3: z.number(), // "like"
    you3: z.number(), // "you"
    know: z.number(), // "know"
    show: z.number(), // "show"
    it2: z.number(), // "it"
    whos: z.number(), // "who's"
    boss: z.number(), // "boss"
    end: z.number(), // speech ends; tail to 182
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is the whole of "why don't you": cut 1's own
// pull-back, from k 1.50 inside the box to k 0.95 on the resolved framing, with
// cut 1's endpoints (CONTENT_OPEN 140 -> CONTENT_FINAL -102) so the two pieces
// sit at the same size in the edit. Keyed f0-14 at warp 0.72.
// ---------------------------------------------------------------------------
export const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL;
export const CAM = camMove({
  f0: 0,
  f1: 14,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_OPEN,
  c1: CONTENT_FINAL,
  warp: 0.72,
});
export const CAM_F = [...CAM.F, DURATION];
export const CAM_K = [...CAM.K, K_FINAL];
export const CAM_CY = [...CAM.CY, CY_FINAL];

// ---------------------------------------------------------------------------
// PUNISH. A bead falls from the mark's bottom edge to the lid's outside face at
// one speed and stops dead there; the crowd darkens from the top row down from
// the moment it lands.
// ---------------------------------------------------------------------------
export const BEAD_R = 4;
export const BEAD_F0 = 7; // "punish"
export const BEAD_HIT = 16; // it is on the wall here, and the wave starts
export const BEAD_FADE = 4;
export const WAVE_SPREAD = 8; // the top row starts at BEAD_HIT, the bottom at +8
export const WAVE_END = BEAD_HIT + WAVE_SPREAD + TONE_DUR; // 30: the last dot is deep

// ---------------------------------------------------------------------------
// BAD THINGS. Five agents spread across the box: five x anchors 140 px apart,
// a five-rung ladder permuted onto them by hash so height is not a function of
// x, each snapped to a real seat that is in nobody else's column and at least
// two rows off everybody else's row.
//
// The ladder sits in the upper half of the box and that is not a taste
// decision: all five reaches run at the imported LINE_SPEED and the last one
// leaves at f45 and has to be against the lid by f49 on "things", so it has
// four frames and therefore at most 4 * LINE_SPEED of reach. The rungs below
// are each rung's own budget, with roughly a frame of slack, and the deal is
// longest-reach-first so the long ones get the long slots.
// ---------------------------------------------------------------------------
export const BAD_LIFT = 12; // world px from a dot's centre up to its reach's foot
export const BAD_LAUNCH = [33, 36, 39, 42, 45]; // "doing" / "these" / "bad"
export const BAD_DEADLINE = 49; // "things"
const BAD_ANCHOR_X = [250, 390, 540, 690, 830];
const BAD_LADDER_Y = [150, 60, -25, -105, -185];
export const BAD_ROW_GAP = 2; // no two of the five within this many grid rows

export type Bad = {
  seat: number; // index into SEATS
  launch: number;
  len: number; // the reach's length at the lid's rest height
};

export const BADS: Bad[] = (() => {
  // the ladder, permuted onto the anchors by hash: height is not a function of x
  const perm = BAD_ANCHOR_X.map((_, i) => i).sort((a, b) => hash(a, 33) - hash(b, 33));
  const out: Bad[] = [];
  const usedCol = new Set<number>();
  const usedRow: number[] = [];
  BAD_LADDER_Y.forEach((rung, i) => {
    const wx = BAD_ANCHOR_X[perm[i]] + (hash(i, 34) - 0.5) * 24;
    const wy = rung + (hash(i, 35) - 0.5) * 24;
    // this rung's own budget: the frames it has before the deadline, at one speed
    const maxLen = LINE_SPEED * (BAD_DEADLINE - BAD_LAUNCH[i]);
    const maxY = LINE_TIP_Y + BAD_LIFT + maxLen;
    const order = SEATS.map((_, si) => si).sort(
      (a, b) =>
        Math.hypot(SEATS[a].x - wx, SEATS[a].y - wy) - Math.hypot(SEATS[b].x - wx, SEATS[b].y - wy),
    );
    const pick = order.find((si) => {
      const s = SEATS[si];
      if (s.y > maxY) return false;
      if (usedCol.has(s.gc)) return false;
      return usedRow.every((r) => Math.abs(r - s.gr) >= BAD_ROW_GAP);
    });
    if (pick === undefined) throw new Error(`UnderHeelReleased: no seat for bad agent ${i}`);
    const s = SEATS[pick];
    usedCol.add(s.gc);
    usedRow.push(s.gr);
    out.push({ seat: pick, launch: BAD_LAUNCH[i], len: s.y - BAD_LIFT - LINE_TIP_Y });
  });
  return out;
})();

// ---------------------------------------------------------------------------
// UNDER HEEL. DIRECTOR PASS: a DEEPER press. The lid drops 160 world px, not
// 120, on the same f77-93 and the same easing, and the crowd is squeezed under
// it; the box's floor never moves. The crowd's own span is IN_Y1 - IN_Y0 = 664,
// not the box's 700, so the compaction factor is (664 - 160) / 664 = 0.75904
// and the row pitch goes 23.714 -> 18.000 world px: a quarter out of the
// crowd's height, where 120 took a fifth.
//
// Every VERTICAL gap in the field scales by that one number and the horizontal
// ones do not move at all, so the squeeze cannot pull a dot through its
// neighbour — only closer to it. Counted over all 869 dots at f93 with each
// dot's own breath: cut 1's field ALREADY has 92 touching pairs at rest, which
// is what jitter 0.9 * STEP at these radii looks like and is the crowd's own
// texture, not a fault; 120 px of press took that to 116 and 160 takes it to
// 127 — 35 new touches, 4% of the field — and the deepest overlap in the whole
// crowd goes 8.74 -> 9.50 px on a pair that was already touching at rest. No
// dot is swallowed and no new clump forms; checked in `v2_f0093.png`.
// ---------------------------------------------------------------------------
export const LID_MAX = 160;
export const LID_F0 = 77; // "bring"
export const LID_F1 = 93; // settled before "and" at f95
export const REACH_ERASE_F0 = 87; // "heel"
export const REACH_ERASE_F1 = 93;
export const CROWD_SPAN = IN_Y1 - IN_Y0; // 664

// WHO'S BOSS. The mark drops onto the lowered lid and lands on "boss".
export const MARK_F0 = 112; // "show"
export const MARK_DUR = 9; // landed at f121, one frame before "boss"
export const MARK_SEAT = 14; // world px from the mark's bottom edge to the lid
// Easing.back(s) out overshoots by 4s^3 / (27 (s+1)^2) of the travel. With the
// lid 160 down the drop is 360.5 px (-560 -> -199.5), not 320.5, so back(1.6)
// would overshoot 32.4 px and the previous s = 0.82 would overshoot 8.89 —
// over the brief's cap of 8. s = 0.775 gives 2.189% = 7.89 px, which is the
// same absolute overshoot the shallower press landed with, so the landing
// reads identically and only the fall is longer.
export const MARK_BACK = 0.775;

// RELEASE. The weight comes off: the lid rises back to rest carrying the mark,
// and the crowd relaxes onto its own seats, all on one curve.
export const REL_F0 = 126; // four frames after "boss" lands
export const REL_F1 = 150;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotUnread: OP_UNREAD_DOT,
  idleThreadCount: idleThreads(NSEAT),
  markSrc: "openai-chatgpt-logo.png",
  markSize: 108,
  beats: {
    why: 0,
    dont: 2,
    you: 5,
    punish: 7,
    the: 14,
    model: 18,
    forW: 24,
    doing: 33,
    these: 40,
    bad: 45,
    things: 49,
    like1: 60,
    why2: 64,
    dont2: 65,
    you2: 69,
    like2: 71,
    bring: 77,
    it: 81,
    under: 84,
    heel: 87,
    and: 95,
    like3: 103,
    you3: 108,
    know: 110,
    show: 112,
    it2: 116,
    whos: 118,
    boss: 122,
    end: 134,
  },
});

const easeInOut = Easing.inOut(Easing.cubic);
const easeBackOut = Easing.out(Easing.back(MARK_BACK));

const UnderHeelReleased: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotRadius,
  dotUnread,
  idleThreadCount,
  markSrc,
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = punished (deep), 1 = ripe. Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- the lid ---------------------------------------------------------------
  // One number drives the whole of "under heel" and the whole of the release:
  // how far the top wall is from its rest height. The descent is a full
  // in-then-out cubic; the release takes the same number back to zero on
  // another one, which is what carries the crowd and the mark back with it.
  const descend = easeInOut(clamp01((frame - LID_F0) / (LID_F1 - LID_F0)));
  const release = easeInOut(clamp01((frame - REL_F0) / (REL_F1 - REL_F0)));
  const lidDrop = LID_MAX * descend * (1 - release);
  const lidY = BOX_Y0 + lidDrop; // the wall's centre line
  const lidOuter = lidY - STROKE / 2;
  const tipY = LINE_TIP_Y + lidDrop; // where a round cap sits on the inside face
  const boxPath = lidDrop === 0 ? BOX_PATH : squirclePath(BOX_W, BOX_H - lidDrop);

  // -- the crowd, squeezed ---------------------------------------------------
  // The inset top edge follows the lid and the floor does not move, so every
  // seat is re-spaced linearly between the two. Jitter rides the same scale, so
  // the field keeps its shape and only gets denser.
  const squeeze = (CROWD_SPAN - lidDrop) / CROWD_SPAN;
  const SX = new Float64Array(NSEAT);
  const SY = new Float64Array(NSEAT);
  for (let i = 0; i < NSEAT; i++) {
    SX[i] = SEATS[i].x;
    SY[i] = IN_Y1 - (IN_Y1 - SEATS[i].y) * squeeze;
  }

  // -- the crowd's tone ------------------------------------------------------
  // The rest tone is RIPE and the punishment is the darkening: a wave from the
  // top row down, each dot on its own TONE_DUR ramp. The five that did bad
  // things come back up, and they are the only ones that do.
  const rest = new Float32Array(NSEAT);
  for (let i = 0; i < NSEAT; i++) {
    const start = BEAD_HIT + WAVE_SPREAD * smooth(SEATS[i].gr / (ROWS - 1));
    rest[i] = 1 - smooth((frame - start) / TONE_DUR);
  }
  const badTone = new Float32Array(NSEAT);
  BADS.forEach((b) => {
    badTone[b.seat] = smooth((frame - b.launch) / TONE_DUR);
  });

  // -- idle traffic ----------------------------------------------------------
  // Cut 1's ambient, verbatim in behaviour, but reading the LIVE seat positions
  // so a thread compacts and relaxes with the crowd under it.
  const lit = new Float32Array(NSEAT);
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: number };
  const threadEls: Th[] = [];

  const reach = 5;
  for (let j = 0; j < idleThreadCount; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const sa = SEATS[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = SEAT_AT[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    threadEls.push({
      key: `i${j}`,
      x1: SX[a],
      y1: SY[a],
      x2: SX[a] + (SX[b] - SX[a]) * dn,
      y2: SY[a] + (SY[b] - SY[a]) * dn,
      op: 0.4 * fade,
      head: dn,
    });
  }

  // -- punish: the bead ------------------------------------------------------
  const markBottom = MARK.y + markSize / 2;
  const beadEnd = BOX_Y0 - STROKE / 2 - BEAD_R; // resting ON the lid's outside face
  const beadT = clamp01((frame - BEAD_F0) / (BEAD_HIT - BEAD_F0)); // one speed, no easing
  const beadY = markBottom + (beadEnd - markBottom) * beadT;
  const beadOp =
    frame < BEAD_F0 ? 0 : interpolate(frame, [BEAD_HIT, BEAD_HIT + BEAD_FADE], [1, 0], clamp);

  // -- bad things: five reaches ----------------------------------------------
  // Each rises straight up from its agent at one speed and stops dead on the
  // inside face of the lid. As the lid comes down the tip rides it; from f87
  // the line is erased from its top end and is gone by f93.
  const erase = clamp01((frame - REACH_ERASE_F0) / (REACH_ERASE_F1 - REACH_ERASE_F0));
  const reaches = BADS.map((b, i) => {
    if (frame < b.launch || erase >= 1) return null;
    const drawn = clamp01(((frame - b.launch) * LINE_SPEED) / b.len);
    if (drawn <= 0) return null;
    const x = SX[b.seat];
    const foot = SY[b.seat] - BAD_LIFT;
    // the erase runs from the FOOT up, so the tip never leaves the lid's inside
    // face: the reach is scraped off the field rather than let go of the wall
    return { key: i, x, y1: foot + (tipY - foot) * erase, y2: foot + (tipY - foot) * drawn };
  });

  // -- who's boss: the mark drops onto the lid -------------------------------
  // The landing height is read off the LID, not off a number of its own, so
  // once it is down the mark rides every later frame of the lid: the release
  // carries it back up with a 14 px seat the whole way.
  const markLand = lidOuter - MARK_SEAT - markSize / 2;
  const markDrop = easeBackOut(clamp01((frame - MARK_F0) / MARK_DUR));
  const markY = MARK.y + (markLand - MARK.y) * markDrop;

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              {/* cut 1's gate: the wall's own segment is masked away and the
                  dashed one stands in its place. Both ride the lid. */}
              <mask id="uhr-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
                <rect x={-400} y={-900} width={1900} height={1900} fill="#fff" />
                <rect x={GATE_X0} y={lidY - 6} width={GATE_X1 - GATE_X0} height={12} fill="#000" />
              </mask>
            </defs>

            {/* the crowd */}
            {SEATS.map((s, i) => {
              const l = Math.max(lit[i], rest[i], badTone[i]);
              // the size bump is a LIT dot's, not the rest tone's: at f0 the
              // whole crowd is ripe and it is still cut 1's field at cut 1's
              // density
              const bump = 1 + 0.35 * Math.max(lit[i], badTone[i]);
              const r = dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * bump;
              return <circle key={i} cx={SX[i]} cy={SY[i]} r={r} fill={tone(l)} opacity={dotUnread} />;
            })}

            {/* idle traffic, head-led */}
            {threadEls.map((t) => (
              <g key={t.key}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={t.op}
                />
                {t.head < 1 ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
              </g>
            ))}

            {/* the sandbox, rebuilt at the lid's height, with the gate masked
                out of its own wall */}
            <g style={{ filter: icon }}>
              <g mask="url(#uhr-gate)">
                <path
                  d={boxPath}
                  transform={`translate(${BOX_X0} ${lidY})`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  opacity={OP_READ}
                />
              </g>
              <line
                x1={GATE_X0}
                y1={lidY}
                x2={GATE_X1}
                y2={lidY}
                stroke={ink}
                strokeWidth={STROKE}
                strokeDasharray={`${GATE_DASH} ${GATE_GAP}`}
                opacity={OP_READ}
              />
            </g>

            {/* NO internet ring and no wifi glyph: the air between the mark and
                the lid is empty, so the mark's drop on "who's boss" is a clear
                fall and the release can carry it all the way home */}

            {/* the five reaches */}
            <g style={{ filter: icon }}>
              {reaches.map((l) =>
                l ? (
                  <line
                    key={l.key}
                    x1={l.x}
                    y1={l.y1}
                    x2={l.x}
                    y2={l.y2}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={OP_READ}
                  />
                ) : null,
              )}
            </g>

            {/* the punishment, on its way down and dead on the wall */}
            {beadOp > 0.01 ? (
              <circle cx={MARK.x} cy={beadY} r={BEAD_R} fill={ink} opacity={beadOp} style={{ filter: icon }} />
            ) : null}
          </svg>

          {/* the OpenAI mark, tinted white: at rest until "show", then sitting
              on the lid and riding it back up in the tail */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: markY - markSize / 2,
              width: markSize,
              height: markSize,
              filter: `brightness(0) invert(1) ${icon}`,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default UnderHeelReleased;
