import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  Vignette,
  camMove,
  clamp01,
  hash,
  iconShadow,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  CARD_GLYPH_CAP,
  CARD_GLYPH_JOIN,
  CARD_GLYPH_STROKE,
  CONTACT_SHADOW_OP,
  CONTACT_SHADOW_RX,
  CONTACT_SHADOW_RY,
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
  TILE_GRAD_BOTTOM,
  TILE_GRAD_TOP,
  TILE_SHADOW,
  V4,
} from "./d1Shared";
// The clip's one world. Cut 1's builder owns this module; nothing here edits it
// and nothing here restates a value from it: the field, its pitch, its coin, the
// "$" knockout, the breath and the strain all come from there, so a coin in this
// cut is the same object as a coin in cuts 1 and 2 down to its jitter.
import {
  CoinDefs,
  FIELD_COINS,
  FIELD_COIN_R,
  FIELD_PITCH,
  FIELD_ROW_PITCH,
  FieldCoin,
  coinBreath,
  strain,
} from "./rampShared";

// ---------------------------------------------------------------------------
// CUT 3 of the Eric Glyman / Ramp clip — "artisanal expense reports".
// Cheeky Pint style on kraft, opaque, 24fps, 1080x1920.
//
// THE LINE (Eric Glyman, Ramp, on Cheeky Pint):
//   "there's so much drudgery. Like I think people are doing artisanal expense
//    reports. You know, it's fun to be like a hipster and spend an hour making
//    coffee,"
//
// SRT span 26.859 -> 33.380.  round((33.380 - 26.859) * 24) = round(6.521 * 24)
// = round(156.5) = 157 frames of speech, plus a 16-frame tail so the resolved
// state holds = 173.  Delivered later as `26_ArtisanalExpenseReports.mov`.
//
// WORD ONSETS (frames from 26.859)
//   f0 there's · f5 so · f9 much · f13 drudgery (to f31) · f31 like · f36 I ·
//   f37 think · f40 people · f47 are · f49 doing · f54 artisanal (to f68) ·
//   f68 expense · f73 reports (to f90) · f90 you · f93 know · f96 it's ·
//   f99 fun · f102 to · f105 be · f107 like · f110 a · f112 hipster (to f119) ·
//   f119 and · f122 spend · f125 an · f128 hour · f132 making · f139 coffee
//   (to f157) · speech ends f157 · tail to f173.
//
// ---------------------------------------------------------------------------
// THE WORLD. The clip's one rule: a transaction is a coin, the United States is
// a field of coins, amber is what Ramp has touched. Cut 2 left every coin in
// the field WHITE — the 98% that is not on Ramp. This cut is what happens to
// one of those white coins off Ramp, so there is NO amber anywhere in it and no
// Ramp mark in frame: the amber patch and the mark are off-frame the whole cut.
// Everything is ink white and the tile gradient.
//
// Under the field's southern edge (roughly under Texas) stands a pour-over
// cone in ink line, and under its spout a white receipt tile. The coins slide
// down off the field into the cone, back up at its mouth, and drip out ONE AT A
// TIME onto the receipt, which grows a line each time. That is the whole cut:
// one continuous motion with the words as inflections.
//
// ---------------------------------------------------------------------------
// THE PHASES (one motion, one camera curve)
//
//   1. THE DULL PART                                              f0 -> f5
//      Tight on the field's southern edge (k 3.40, a 318 x 565 world window,
//      content centre 878): a screen of white "$" coins tapering to the coast
//      under Texas, and the cone's mouth rim just entering at the bottom
//      (screen y 1631). The camera creeps k 3.40 -> 3.33 while the content
//      centre walks 878 -> 890, so the frame is alive before anything happens;
//      every coin breathes on `coinBreath`.
//
//   2. "there's so much drudgery"  f5 -> f41   THE POUR
//      From f5 the coast directly above the mouth PEELS and runs down into it as
//      one stream. The 81 coins are taken from the column |x - 540| <= 75 — the
//      mouth's own width — nearest the mouth first, so what comes away is the
//      point of Texas and the notch it leaves is a clean arc. Each coin's path
//      is a near-vertical cubic that pulls in to a 68 px wide throat for the
//      middle of its flight and spreads to its slot only in the last quarter, so
//      the stream is never wider than the mouth (measured worst 72.2 against the
//      mouth's 75) and no coin crosses more than 45 px of lateral. A coin stops
//      where it meets the pile: the arrivals are assigned bottom-up to a
//      hex-packed slot list that fills the cone at the FIELD's own pitch —
//      nothing about a coin changed except where it is. The column is unbroken
//      from f5 to f26 (worst step along it 12.5 px against the field's own 9.53
//      row pitch); from f27 the coast is spent and the last of the pour falls
//      in, the last coin landing f40.7, so the pour tapers off under "Like I
//      think people are doing" instead of stopping dead on a word. Every arrival
//      NUDGES the coins it lands among. Nothing drips yet, and from here the
//      funnel stays full for the rest of the cut: the backlog is permanent.
//
//   3. THE CAMERA REACTS                                          f7 -> f50
//      Two frames after the slide starts — it reacts, it never leads — one
//      `camMove` k 3.33 -> 3.00 with the content centre walking 890 -> the
//      midpoint of the heap's crown and the receipt's foot (1197.54), warp 0.8,
//      keys f7-f46, LANDED f50: k within 0.09% and cy within 2.5 px, four frames
//      ahead of "artisanal". Its worst translation of a static point is 37.1
//      screen px/frame at f24, which is what the sliding coins' own speed had to
//      be solved against.
//
//   4. THE HELD BREATH                                           f50 -> f56
//      The cut's ONE authored held breath, six frames, and it is the beat before
//      the payoff: the camera is landed, the pour is spent (f40.7), the funnel
//      is full and nothing has come out of it yet. The heap still strains, the
//      coin in the spout still strains, the field still breathes — the quietest
//      frame of the cut measures 0.90 screen px/frame, against the 0.6 floor.
//
//   5. "artisanal ... an hour making coffee"   f54 -> f151   THE DRIPS
//      The lowest coin in the spout leaves at f54, f84, f114 and f144 — ONE COIN
//      PER 30 FRAMES, never faster, never slower: the interval IS the "hour",
//      and it is one constant, so there are no per-drip numbers anywhere.
//      Each falls the 44 px onto the receipt's top in 7 frames on u^1.7 — it
//      detaches from rest and arrives at speed, peaking 28.5-32.4 screen
//      px/frame — and then SINKS into the tile over 4 frames while it scales to
//      0, the sink's opening speed solved to equal the fall's closing speed so
//      the impact decelerates into the paper instead of stopping dead. A
//      knocked-out rule is revealed at the new foot as the tile grows 18 px
//      downward on a zero-sloped settle bump. Landings f61 / f91 / f121 / f151.
//      On every departure the cone's centre file (13 coins, the hex column down
//      its axis) steps down one slot, staggered 0.8 frames per row, and the rest
//      of the heap dips and returns by ROW_PITCH / (coins in that row) — 4.8 px
//      at the two-wide neck, 0.7 px at the thirteen-wide brim, which is exactly
//      the volume of one coin spread across the row it is missing from. A new
//      coin slides in from the field onto the top of the file in time to fill
//      the slot the step vacates, so the heap never shrinks.
//
//   6. THE HOLD                                                 f151 -> f173
//      Four lines on the receipt, a fifth coin straining in the spout, the heap
//      full and still pressing, the camera creeping k 3.00 -> 2.88 with its
//      centre following the receipt's foot down across f56-f157 so the slip
//      lengthens into a frame that is opening for it. Nothing fades.
//
// THE FRAME TABLE (what was actually built)
//   f0            k 3.40, content 878; the cone's mouth rim at screen y 1631
//   f5            the coast starts to peel; the first coin leaves the field
//   f7  -> f46    the camera's one react; landed f50
//   f5  -> f26    the column is unbroken, coast to cone: the stream is attached
//                 to the field it is coming off and there is no hole in it
//   f16.1         the last coin leaves the coast; the notch is complete
//   f17 -> f33    the receipt rises into frame from below the bottom edge
//   f23.25        the fastest thing in the cut that is not the camera's own
//                 translation: a sliding coin, 35.4 screen px/frame, vs 45
//   f27 -> f41    the last of the pour falls in: 20 of the 81 at rest by f35,
//                 73 by f40, all 81 by f41
//   f40.7         the last of the pour lands; the funnel is full
//   f50 -> f56    the held breath
//   f54 / f61     drip 1 leaves / lands · rule 1 · the cut's ONE ink click
//   f84 / f91     drip 2 · rule 2
//   f114 / f121   drip 3 · rule 3       ("hipster")
//   f144 / f151   drip 4 · rule 4       ("coffee") — the payoff lands in the
//                 last quarter of the words, then holds
//   f56 -> f157   the settle creep, k 3.00 -> 2.88
//   f151 -> f173  held: four rules, a fifth coin straining in the spout
//
// MEASURED (`<scratch>/aer-scan.ts`, which imports the functions below rather
// than a copy of them)
//   worst screen speed      39.38 px/frame at f24 (h = 1) · 39.50 (h = 1/4),
//                            and it is the RECEIPT's foot under the camera's own
//                            descent, not anything the cut moves
//   worst moving coin        35.24 px/frame at f24 (h = 1) · 35.36 (h = 1/4)
//   worst camera-only speed  37.13 px/frame at f24, at the cone's mouth
//   drip fall peaks          32.4 / 29.9 / 28.5 / 29.9 screen px/frame
//   worst discontinuity      ratio 1.03 between the h = 1 and h = 1/4 speed
//                            steps of any one object, on absolute steps of
//                            3.00 and 3.07 px/frame^2 — i.e. two ways of
//                            measuring the same small settle agreeing to within
//                            a pixel, not a jump. (The ratio is only meaningful
//                            against a large step; nothing in the cut has one.)
//   the pour's own width     72.2 px of half-width at f12, against the mouth's 75
//   the column's worst step  12.5 px at f24, against the field's 9.53 row pitch,
//                            over f5-f26; it opens deliberately from f27 as the
//                            last of the pour falls in
//   worst airborne gap       16.1 px at f17 between a coin in the stream and the
//                            nearest coin of any kind (field pitch 11)
//   quietest frame           0.90 screen px/frame at f167
//   band                     the CUT's content (cone, crown, heap, every coin
//                            the pour puts in the air, receipt + contact shadow)
//                            is inside x 60-1020 / y 200-1450 from f34 to the
//                            end. Two allowances, both deliberate and both in
//                            the first build: the receipt RISES INTO frame from
//                            under the bottom edge f16-f33 while the camera
//                            descends onto it, and each refill coin crosses the
//                            top edge on its way down out of the field (it is a
//                            field coin until it moves, and the field is
//                            full-bleed at this zoom in all three cuts)
//
// DEVIATIONS from the brief, and why (each is forced by the brief's own
// geometry or by the house rules):
//
//   * THE POUR IS A STREAM, NOT A SPRAY — the director's one note on this cut,
//     and the only thing changed in this pass. The first build sourced the 81
//     coins as a semicircle 192 px wide (wider than the mouth), flew each on a
//     quadratic that put 80% of the sideways early (up to 138 px of lateral per
//     coin), and staggered them 0.18 apart at 8 px/frame, which stretched 105 px
//     of coast over 261 px of air: in the stills the coins were scattered across
//     the whole gap with holes between them. It is now sourced from the mouth's
//     own column, paired row by row, pathed through a 68 px throat and staggered
//     0.14 at 6 px/frame — see THE POUR below for the derivation and the sweep.
//     Nothing else moved: the cone, the receipt and its growth, the drip frames
//     (leave f54/84/114/144, land f61/91/121/151), the refill timing, the camera
//     keys, the strain and the hold are all exactly as they were approved.
//
//   * THE HEAP IS 81 COINS, NOT ~40. The cone the brief specifies (mouth 150,
//     spout 18, 106 tall) holds 81 coins at the FIELD's own hex pitch (11 and
//     11*sqrt(3)/2), and a coin may not change size — a coin means the same
//     thing in every cut of this clip. 40 would leave the funnel two-thirds
//     empty, and "backed up in a funnel" is the whole read. The count is
//     derived from the cone and the pitch; it is not typed. The brief's "~40 by
//     f31" survives as the number DOWN by f31, which is 35.
//   * THE OPENING CONTENT CENTRE IS 878, NOT 1010. At 1010 the mouth rim sits at
//     screen y 1182 — the middle of the frame, not "just entering at the
//     bottom". 878 puts it at 1631 and the window at world y 632..1197, which is
//     the picture the brief describes.
//   * THE RESOLVED k IS 3.00 AND NOT 2.50, AND THE SETTLE CREEP IS 3.00 -> 2.88
//     AND NOT 2.50 -> 2.35. At 2.50 the funnel and the receipt together spanned
//     522 of the band's 1250 screen px and the frame read under-filled; at 3.00
//     they span 627 at f61 and 815 at f172, the receipt's foot lands at screen
//     1234 with its contact shadow at 1257, and the band still has 190 px of
//     slack. The creep is still a pull-back and still what gives the growing
//     slip its room — it is measured against the band rather than assumed.
//   * THE REACT'S KEYS END f46, NOT f56. The damper costs 4-6 frames on a move
//     this size, so keys to f56 would land at ~f62 — eight frames AFTER
//     "artisanal". Keys f7-f46 land f50, which is the landing the brief asks for
//     and the house's 4-10 frames ahead of the word.
//   * THE RECEIPT'S GLYPH IS 47% OF THE TILE WIDTH, NOT 60%. 60% of 72 is 43.2
//     and the tile starts 40 tall, so the briefed glyph does not fit the briefed
//     head band. The height arithmetic (40 + 18n) is the quantity and is kept
//     exact; the glyph is 34 world px, centred in the 40 px head with 3 px of
//     air. Stroke, caps and joins are `CompanyCard`'s to the value.
//   * THE SPOUT IS A SHORT TUBE WITH TWO OUTWARD LIP STUBS, not one horizontal
//     rim line: an 18-wide horizontal line at y 1218 would close the spout the
//     coins drip out of. The mouth rim is one line, 174 wide, 12 px proud of
//     each wall, exactly as briefed.
//   * THE BACKLOG IS JAMMED AND ONLY THE CENTRE FILE DRAINS. The brief allows
//     "a 1-D queue on the cone's centre line + two flanking lanes"; a flanking
//     lane has nowhere to drain to (the spout is one coin wide) and re-slotting
//     the whole heap by one index makes coins jump across a row, which is the
//     one thing a settling pile never does. So the centre file steps and the
//     rest dips and returns. A backlog that cannot move is also the content of
//     the line.
//   * THE RECEIPT IS BELOW THE BAND FROM f17 TO f33. It is not out of frame
//     composition — it is RISING INTO the frame from under the bottom edge while
//     the camera descends onto it, and it is fully inside from f34 to the end.
//     This is the allowance the approved hurricane cut makes for its tight
//     opening.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 173;

export const WORLD_W = 1080;
export const WORLD_H = 1450;

// Cut 2 left every coin in the field WHITE — the 98% of spend that is not on
// Ramp. Every coin in this cut, in the field and in the heap, is that state.
export const FIELD_STATE = "passed" as const;


// ---------------------------------------------------------------------------
// HARMONY: the cone and the receipt are this cut's only new geometry. Every
// number below is world px and is either briefed or solved from a briefed one,
// so the director can lift the whole block into `rampShared` unchanged.
// ---------------------------------------------------------------------------
export const CONE_CX = 540;
export const MOUTH_Y = 1112;
export const MOUTH_W = 150;
export const SPOUT_Y = 1218;
export const SPOUT_W = 18;
export const NECK_Y = 1206; // the walls stop here; below it the spout is a tube
export const RIM_PROUD = 12; // the mouth rim stands this far past each wall
export const LIP = 7; // the spout's outward lip stubs
export const CONE_W = V4.PRICE_W_STROKE; // 2.5 — the house's one line weight

// The cone's inner half-width at a height. Everything that has to fit inside
// the funnel is solved against this and nothing is placed by eye.
export const coneHalf = (y: number) =>
  y >= NECK_Y
    ? SPOUT_W / 2
    : SPOUT_W / 2 + ((MOUTH_W - SPOUT_W) / 2) * ((NECK_Y - y) / (NECK_Y - MOUTH_Y));

export const REC_X = CONE_CX;
export const REC_W = 72; // the house's `CARD_SIZE`
export const REC_TOP = 1262;
export const REC_H0 = 40;
export const REC_GROW = 18; // one line
export const REC_RULE_W = 40;
export const REC_RULE_H = CARD_GLYPH_STROKE; // 2.6 — the glyph's own weight
export const REC_GLYPH = 34; // 47% of the tile: see the deviations above
export const recHeightAt = (n: number) => REC_H0 + REC_GROW * n;
export const recFootAt = (n: number) => REC_TOP + recHeightAt(n);
// rule n (1-based) sits in the middle of the band that drip n added
export const ruleY = (n: number) => REC_TOP + REC_H0 + REC_GROW * n - REC_GROW / 2;

// Lucide `receipt` (ISC), fetched raw and inlined — never installed, never
// fetched at render time. Knocked out of the tile's head exactly as
// `CompanyCard` knocks out a sector glyph.
export const RECEIPT_GLYPH = `<path d="M12 17V7" /><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" /><path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />`;

// ---------------------------------------------------------------------------
// THE HEAP. A hex-packed slot list that fills the cone from the spout up, at
// the FIELD's own pitch, plus a small crown over the rim. Row parity carries
// the packing: an even row has a centre coin (odd count), an odd row does not.
// The spout is one coin wide, which is what "one at a time" is made of.
// ---------------------------------------------------------------------------
export const HEAP_ROW_PITCH = FIELD_ROW_PITCH; // the field's own row pitch
export const HEAP_Y0 = 1212; // the spout coin's centre; its foot is at 1216.6
export const MOUND_SLOPE = 4; // half-width lost per px of crown above the rim

export type Slot = { x: number; y: number; row: number };
export const SLOTS: Slot[] = [];
export const ROW_N: number[] = [];
(() => {
  for (let row = 0; row < 60; row++) {
    const y = HEAP_Y0 - HEAP_ROW_PITCH * row;
    const W =
      y >= MOUTH_Y
        ? coneHalf(y) - FIELD_COIN_R
        : MOUTH_W / 2 - FIELD_COIN_R - MOUND_SLOPE * (MOUTH_Y - y);
    if (W < 0) break;
    let n = Math.max(1, Math.floor((2 * W) / FIELD_PITCH) + 1);
    if (y >= NECK_Y) n = 1;
    if (n > 1 && n % 2 !== (row % 2 === 0 ? 1 : 0)) n -= 1;
    ROW_N.push(n);
    for (let i = 0; i < n; i++)
      SLOTS.push({ x: CONE_CX + (i - (n - 1) / 2) * FIELD_PITCH, y, row });
  }
})();
export const N_HEAP = SLOTS.length;
export const HEAP_TOP = Math.min(...SLOTS.map((s) => s.y)) - FIELD_COIN_R;

// The centre FILE: the hex column down the cone's axis, spout to crown. It is
// the queue that drains; everything else is the backlog, which is jammed —
// which is the content of the line.
export const FILE: number[] = ROW_N.map((_, r) => {
  const x = r % 2 === 0 ? CONE_CX : CONE_CX - FIELD_PITCH / 2;
  return SLOTS.findIndex((s) => s.row === r && Math.abs(s.x - x) < 0.01);
});

// ---------------------------------------------------------------------------
// THE EASES. `flow` and the settle lobe are `BackIntoItV5`'s, imported by copy
// because they are that file's private helpers: a travel with a flat middle and
// zero velocity at both ends, and a settle that is flat to SECOND order at both
// ends so a landing adds neither a step in speed nor a step in acceleration.
// ---------------------------------------------------------------------------
export const FLOW_A = 0.28;
export const flow = (u: number, a: number = FLOW_A) => {
  const x = clamp01(u);
  const area = 1 - a;
  if (x < a) {
    const g = x / a;
    return (a * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  if (x <= 1 - a) return (a * 0.5 + (x - a)) / area;
  const g = (1 - x) / a;
  return (area - a * (g * g * g - (g * g * g * g) / 2)) / area;
};
const SETTLE_U0 = 4 / 7;
export const overshoot = (u: number) => {
  const w = clamp01((clamp01(u) - SETTLE_U0) / (1 - SETTLE_U0));
  return 64 * w ** 3 * (1 - w) ** 3;
};
// a dip that returns: one lobe, flat to second order at both ends
export const lobe = (u: number) => {
  const w = clamp01(u);
  return 64 * w ** 3 * (1 - w) ** 3;
};

// ---------------------------------------------------------------------------
// THE POUR. (Director's revision. The first build took the N_HEAP field coins
// NEAREST the mouth — a semicircle 192 world px wide, wider than the mouth's
// 150 — and flew each one to its slot on a quadratic whose control point put
// 80% of the sideways early. Two things followed: a coin crossed up to 138 px
// of lateral, and the coins in the air were spread across the whole notch and
// the whole gap, ~3 per 9.5 px row band over 144 px, so they read as a SPRAY —
// scattered, gaps between them, a sneeze rather than a pour. What follows is
// the same 81 coins re-sourced and re-pathed so they read as a STREAM.)
//
// 1. THE COLUMN. The pour is drawn ONLY from the column |x - 540| <= 75, which
//    is the mouth's own width, directly above the mouth. Under the cone that
//    column is the tip of Texas, so the notch the pour leaves is the coast's
//    own point coming away, not a bite out of a straight edge.
// 2. THE ASSIGNMENT. The source SET is simply the 85 column coins nearest the
//    mouth, so the notch is a clean arc and the field is never left with a hole
//    in it. Which of them fills which slot is then decided one cone ROW at a
//    time: the row's n sources and its n slots are both sorted by x and paired
//    in order, which is the least-lateral pairing of those two sets and the only
//    one in which no two coins cross. Measured lateral: 138 px -> 45.
// 3. THE THROAT. Every path is a cubic whose two control points sit on one
//    vertical at `THROAT_HALF / COLUMN_HALF` of the coin's own offset from the
//    axis: the stream pulls in to a 68 px wide band for the middle of its
//    flight and only spreads to fill the cone in the last quarter. Bezier x
//    lies in the hull of its control x, and all four are inside the mouth, so
//    the lateral drift is inside the mouth's width at EVERY frame — asserted
//    at the foot of this file, and measured at 72.2 against the mouth's 75.
// 4. THE STAGGER, which is the whole of the density. A pour is coin-limited:
//    there are only 81 of them and the traverse is ~155 px, so the stream's
//    density is 81 / (its length x its width) and its length is the source
//    block's own height (104 px) plus SLIDE_STAG * N * SLIDE_V, the stretch
//    between the leaders arriving and the trailers leaving. That sets up the one
//    trade in this cut: a SHORT stagger packs the coins but empties the coast in
//    six frames, so the stream detaches and falls as a lump; a LONG one keeps
//    the stream attached to the coast for the whole pour but thins it until the
//    coins are 25 px apart, which is the spray again. (V, STAG, THROAT) was
//    therefore swept over 6..11 x 0.10..0.30 x 16..38 against two measures —
//    the worst nearest-neighbour of any airborne coin, and the first frame the
//    column opens a hole wider than two pitches — and 6 / 0.14 / 34 is the
//    corner of that surface: the column is unbroken f5 -> f26 (worst step 12.5
//    px against the field's own 9.53 row pitch) and no airborne coin is ever
//    more than 16.1 px from another. The frames were then looked at: 0.10 is
//    denser but off the coast by f20, 0.18 stays attached to f26 and is visibly
//    loose. Nothing here is typed from taste except which of three renders.
// 5. WHEN THE LAUNCH ORDER IS NOT THE SLOT ORDER. See `LAUNCH_RANK` below.
// 6. THE WINDOW. The pour runs f5 -> f40.7 rather than f5 -> f37.3 — three and
//    a half frames longer, which the note allows. The first drip at f54 does not
//    move and the held breath before it is unchanged.
//
// SLIDE_V is solved against the house's 45 screen px/frame, not chosen: the
// camera is at k 3.33 falling to 3.00 while this runs and its own worst screen
// speed on real content is 37.1 px/frame at f24, so a coin's own contribution
// has to stay small where the two add. The scan (`aer-scan.ts`) reports the
// measured worst; SLIDE_V is the value that keeps it under the cap.
// ---------------------------------------------------------------------------
export const SLIDE_F0 = 5; // "so" — the frame the field starts to move
export const SLIDE_STAG = 0.14; // frames between two coins leaving
export const SLIDE_V = 6; // world px/frame, average over a travel — along the ARC
export const SLIDE_MIN = 10; // no travel is shorter than this
// A slide's ease is flatter than the house `flow`: `flow`'s peak is 1/(1-a)
// times its average, and at a = 0.28 the fastest coin measured 56 screen
// px/frame against the camera's own 37 at f24 — over the house's 45. At 0.16
// the peak is 1.19x the average, the coin still leaves and arrives at zero
// velocity, and the measured worst falls under the cap. Everything else in the
// cut keeps the house FLOW_A.
export const SLIDE_FLOW_A = 0.16;
export const N_REFILL = 4; // one new coin per drip, so the backlog is permanent

export const MOUTH = { x: CONE_CX, y: MOUTH_Y };
export const COLUMN_HALF = MOUTH_W / 2; // 75 — the pour is never wider than the mouth
export const THROAT_HALF = 34; // the stream's own half-width through the middle
export const THROAT_SQUEEZE = THROAT_HALF / COLUMN_HALF; // 0.453
export const THROAT_U0 = 0.26; // the stream is pulled in by this much of the drop
export const THROAT_U1 = 0.74; // and only spreads to the cone after this much
export const SLIDE_BOW = 2; // px of individuality on the throat, per coin

export type P = { x: number; y: number };
export type Cubic = { p0: P; p1: P; p2: P; p3: P };

/** A pour path: near vertical, pulled into the throat early, spreading to the
 *  slot only at the end. `src` is the coin's own field index, so its bow is its
 *  own and does not change when the assignment does. */
export const slidePath = (a: P, b: P, src: number): Cubic => {
  const rel = (a.x - CONE_CX + (b.x - CONE_CX)) / 2;
  const tx = CONE_CX + rel * THROAT_SQUEEZE;
  const bow = (hash(src, 3) * 2 - 1) * SLIDE_BOW;
  const dy = b.y - a.y;
  return {
    p0: a,
    p1: { x: tx, y: a.y + THROAT_U0 * dy },
    p2: { x: tx + bow, y: a.y + THROAT_U1 * dy },
    p3: b,
  };
};
export const cubicAt = (c: Cubic, g: number): P => {
  const w = 1 - g;
  const A = w * w * w;
  const B = 3 * w * w * g;
  const C = 3 * w * g * g;
  const D = g * g * g;
  return {
    x: A * c.p0.x + B * c.p1.x + C * c.p2.x + D * c.p3.x,
    y: A * c.p0.y + B * c.p1.y + C * c.p2.y + D * c.p3.y,
  };
};
/** The path's own length, so the travel time is solved on what the coin
 *  actually flies rather than on the chord it does not. */
export const arcLen = (c: Cubic, n = 48) => {
  let L = 0;
  let p = cubicAt(c, 0);
  for (let i = 1; i <= n; i++) {
    const q = cubicAt(c, i / n);
    L += Math.hypot(q.x - p.x, q.y - p.y);
    p = q;
  }
  return L;
};

// The sources, already permuted so `SOURCES[i]` is the coin that fills
// `SLOTS[i]` (and the four after N_HEAP are the refills, which all go to the
// crown slot the file's step vacates).
export const SOURCES: number[] = (() => {
  const pool = FIELD_COINS.map((_, i) => i).filter(
    (i) => Math.abs(FIELD_COINS[i].x - CONE_CX) <= COLUMN_HALF,
  );
  pool.sort(
    (a, b) =>
      Math.hypot(FIELD_COINS[a].x - MOUTH.x, FIELD_COINS[a].y - MOUTH.y) -
      Math.hypot(FIELD_COINS[b].x - MOUTH.x, FIELD_COINS[b].y - MOUTH.y),
  );
  // the source SET is the nearest N of them, so the notch is an arc and the
  // field is never left with a hole in it. The pool is then consumed in that
  // same order, one cone ROW at a time: the row's n sources and its n slots are
  // both sorted by x and paired in order, which is the assignment with the
  // least lateral of any pairing of those two sets and the only one in which no
  // two coins cross. Nothing is placed by eye and nothing is taken out of turn.
  const rest = pool.slice(0, N_HEAP + N_REFILL);
  const out: number[] = [];
  let at = 0;
  for (const n of ROW_N) {
    out.push(...rest.slice(at, at + n).sort((a, b) => FIELD_COINS[a].x - FIELD_COINS[b].x));
    at += n;
  }
  out.push(...rest.slice(at)); // the refills, which all go to the crown slot
  return out;
})();

// WHEN each coin leaves, which is NOT the order it is slotted in. A cone row
// is filled from its own source row, and the pairing above is x-sorted so no
// two coins cross — but leaving in x order too makes each row a diagonal CHAIN
// of touching coins with 30 px of bare kraft between it and the next chain,
// which is the spray note in another form. The rank is therefore shuffled
// INSIDE each row: a row's coins still all leave before the row above it
// starts, so the pile still fills bottom-up and nothing lands on a slot that is
// not ready, but the coins arriving in any 3-frame window are spread across the
// throat instead of walking across it. Measured: the stream's mean
// nearest-neighbour goes from a chain-and-gap 4.4 / 30 px to an even ~10 px,
// which is the field's own pitch.
export const LAUNCH_RANK: number[] = (() => {
  const rank = new Array<number>(N_HEAP).fill(0);
  let at = 0;
  for (const n of ROW_N) {
    const idx = Array.from({ length: n }, (_, j) => at + j);
    idx.sort((a, b) => hash(a, 23) - hash(b, 23));
    idx.forEach((slot, j) => (rank[slot] = at + j));
    at += n;
  }
  return rank;
})();
export const IS_ACTOR = new Set(SOURCES);

// ---------------------------------------------------------------------------
// THE DRIPS. The interval is the quantity, so it is one constant and there are
// no per-drip numbers: ONE COIN PER DRIP_GAP frames, from DRIP_F0.
// ---------------------------------------------------------------------------
export const DRIP_F0 = 54; // "artisanal"
export const DRIP_GAP = 30; // the "hour"
export const N_DRIP = 4;
export const DRIP_LEAVE = Array.from({ length: N_DRIP }, (_, n) => DRIP_F0 + DRIP_GAP * n);
export const FALL_DUR = 7;
export const FALL_D = 44; // spout coin centre 1212 -> 1256, its foot on the tile
export const ABSORB = 4; // the coin scales to 0 while the rule draws
export const FALL_P = 1.7; // an accelerating fall: zero slope at the detach,
// fastest at the landing. Peak 10.1 world px/frame = 25.4 screen at k 2.5.
export const fallEase = (u: number) => Math.pow(clamp01(u), FALL_P);
// A fall on u^1.7 is fastest AT the landing — 10.69 world px/frame — so ending
// it there would stop the coin dead: the scan's h=1 / h=1/4 test read that as a
// 30 px/frame^2 step that did not shrink with h, the definition of a
// discontinuity. The coin does not stop, it SINKS into the tile while it scales
// away: ABSORB_D is solved so the sink's opening speed IS the fall's closing
// speed on a 1 - (1-t)^2 ease-out, and the impact therefore decelerates into
// the paper instead of hitting a wall. The energy goes where the picture says
// it goes — into the tile's growth bump, which starts on the same frame.
export const ABSORB_D = (FALL_D * FALL_P * ABSORB) / (2 * FALL_DUR); // 21.37 px
export const sinkEase = (u: number) => {
  const t = clamp01(u);
  return 1 - (1 - t) * (1 - t);
};

export const STEP_DUR = 12; // the file's step down one slot
export const STEP_STAG = 0.8; // frames per row up the file
export const GROW_DUR = 8; // the receipt's growth bump
export const NUDGE_DUR = 14; // the backlog's dip-and-return on a drip
// The backlog's dip when a coin leaves, as a fraction of ROW_PITCH / (coins in
// that row). 1 is the conservation value: the volume of one coin spread across
// the row it is missing from. The neck (2 coins wide) dips 4.8 px and the
// widest row (13) dips 0.7, which is what a pile losing one coin does and is
// why the funnel visibly sags at its throat and not at its brim.
export const NUDGE_FRAC = 1;
export const ARRIVE_NUDGE = 1.2; // px, what a landing coin does to its neighbours
export const ARRIVE_DUR = 7;
export const ARRIVE_R = 26; // a landing is felt this far into the pile
export const SPOUT_STRAIN = 1; // the held coin in the spout, +/- 1 px
export const HEAP_STRAIN = 0.35; // the backlog's share of the shared `strain`
export const SETTLE_IN = 6; // frames a landed coin takes to join the pile's life
export const SPOUT_WINDUP = 5; // the strain is damped out over these before it drops
export const STRAIN_PERIOD = 33; // the shared period, as `rampShared` uses it

// ---------------------------------------------------------------------------
// THE ACTORS. Every coin that leaves the field is one actor with a list of
// legs; there is no per-frame state anywhere. The legs are built once, at
// module scope, by walking the drips: the file is a strict queue, so who is
// where is arithmetic rather than simulation.
// ---------------------------------------------------------------------------
export type Leg = { f0: number; f1: number; a: P; b: P; kind: "slide" | "step" | "fall" | "sink" };
export type Actor = {
  src: number;
  slot: number; // the slot it first lands in
  row: number; // its row while it is in the backlog
  legs: Leg[];
  land: number; // the frame it first comes to rest
  dies: number; // absorbed into the receipt; Infinity if it never is
  inFile: boolean;
};

/** Along the ARC, not the chord: the throat makes the two differ by up to 9%
 *  and the speed cap is on what the coin actually flies. */
const slideDur = (a: P, b: P, src: number) =>
  Math.max(SLIDE_MIN, arcLen(slidePath(a, b, src)) / SLIDE_V);

export const ACTORS: Actor[] = (() => {
  const out: Actor[] = [];
  for (let i = 0; i < N_HEAP; i++) {
    const src = SOURCES[i];
    const a = FIELD_COINS[src];
    const b = SLOTS[i];
    const f0 = SLIDE_F0 + SLIDE_STAG * LAUNCH_RANK[i];
    const f1 = f0 + slideDur(a, b, src);
    out.push({
      src,
      slot: i,
      row: b.row,
      legs: [{ f0, f1, a, b, kind: "slide" }],
      land: f1,
      dies: Infinity,
      inFile: false,
    });
  }
  // who is in the file, bottom first
  const occupant = FILE.map((s) => s);
  occupant.forEach((s) => (out[s].inFile = true));
  for (let n = 0; n < N_DRIP; n++) {
    const leave = DRIP_LEAVE[n];
    const dripping = occupant[0];
    out[dripping].legs.push({
      f0: leave,
      f1: leave + FALL_DUR,
      a: SLOTS[FILE[0]],
      b: { x: CONE_CX, y: SLOTS[FILE[0]].y + FALL_D },
      kind: "fall",
    });
    out[dripping].legs.push({
      f0: leave + FALL_DUR,
      f1: leave + FALL_DUR + ABSORB,
      a: { x: CONE_CX, y: SLOTS[FILE[0]].y + FALL_D },
      b: { x: CONE_CX, y: SLOTS[FILE[0]].y + FALL_D + ABSORB_D },
      kind: "sink",
    });
    out[dripping].dies = leave + FALL_DUR + ABSORB;
    for (let r = 1; r < FILE.length; r++) {
      const t0 = leave + STEP_STAG * (r - 1);
      out[occupant[r]].legs.push({
        f0: t0,
        f1: t0 + STEP_DUR,
        a: SLOTS[FILE[r]],
        b: SLOTS[FILE[r - 1]],
        kind: "step",
      });
      out[occupant[r]].row = SLOTS[FILE[r - 1]].row;
      occupant[r - 1] = occupant[r];
    }
    // the refill: it has to be standing in the top slot the frame the step
    // that vacated it finishes, so its start is solved backwards from there.
    const top = FILE[FILE.length - 1];
    const arrive = leave + STEP_STAG * (FILE.length - 2) + STEP_DUR;
    const src = SOURCES[N_HEAP + n];
    const a = FIELD_COINS[src];
    const b = SLOTS[top];
    const dur = slideDur(a, b, src);
    out.push({
      src,
      slot: top,
      row: b.row,
      legs: [{ f0: arrive - dur, f1: arrive, a, b, kind: "slide" }],
      land: arrive,
      dies: Infinity,
      inFile: true,
    });
    occupant[FILE.length - 1] = out.length - 1;
  }
  return out;
})();

// The pile's neighbour lists, for the arrival nudge: a coin that lands is felt
// by the coins already at rest within ARRIVE_R of it.
export const NEIGHBOURS: number[][] = (() => {
  const out: number[][] = ACTORS.map(() => []);
  for (let i = 0; i < N_HEAP; i++) {
    for (let j = 0; j < N_HEAP; j++) {
      if (i === j) continue;
      if (ACTORS[j].land <= ACTORS[i].land) continue; // only later arrivals nudge
      const a = SLOTS[i];
      const b = SLOTS[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) <= ARRIVE_R) out[i].push(j);
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE RECEIPT'S TRACK. n(f) is not a counter: the tile's height is the sum of
// four growth bumps, each hung on the frame its coin landed, so the height and
// the rules are the same arithmetic and cannot drift apart.
// ---------------------------------------------------------------------------
export const DRIP_LAND = DRIP_LEAVE.map((l) => l + FALL_DUR);
export const grown = (f: number) => {
  let h = 0;
  for (let n = 0; n < N_DRIP; n++) {
    const u = clamp01((f - DRIP_LAND[n]) / GROW_DUR);
    h += REC_GROW * flow(u) + Math.min(3, 0.1 * REC_GROW) * overshoot(u);
  }
  return h;
};
export const recHeight = (f: number) => REC_H0 + grown(f);
export const ruleWidth = (n: number, f: number) =>
  REC_RULE_W * smoothstep((f - DRIP_LAND[n]) / ABSORB);
export const linesAt = (f: number) => DRIP_LAND.filter((l) => f >= l).length;

// The cut's ONE single-object ink click: the slip registers its first entry.
export const CLICK_F = DRIP_LAND[0];
export const CLICK_DUR = 4;
export const REC_OP = 0.9; // OP_READ

// ---------------------------------------------------------------------------
// THE CAMERA. Two moves and one long settle creep, all through one damped
// `runCamera`; `cy = c + CAM_LIFT / k` off the same eased k, so the content
// centre sits on screen y 835 at every zoom.
//
//   CREEP   f0-f7    k 3.40 -> 3.33, centre 878 -> 890   (the dull part, alive)
//   REACT   f7-f46   k 3.33 -> 3.00, centre 890 -> C_LAND, warp 0.8; landed f50
//   SETTLE  f56-f157 k 3.00 -> 2.88, centre C_LAND -> C_FINAL
//
// The two content centres are the midpoint of the two things the frame is about
// at that moment — the heap's crown and the receipt's foot — so the framing
// follows the receipt down as it lengthens instead of being keyed by hand.
// ---------------------------------------------------------------------------
export const K_OPEN = 3.4;
export const K_CREEP = 3.33;
export const K_LAND = 3.0;
export const K_FINAL = 2.88;
export const C_OPEN = 878;
export const C_CREEP = 890;
export const C_LAND = (HEAP_TOP + recFootAt(0)) / 2;
export const C_FINAL = (HEAP_TOP + recFootAt(N_DRIP)) / 2;
export const CAM_WARP = 0.8;

const CREEP = camMove({ f0: 0, f1: 7, k0: K_OPEN, k1: K_CREEP, c0: C_OPEN, c1: C_CREEP, warp: 1 });
const REACT = camMove({
  f0: 7,
  f1: 46,
  k0: K_CREEP,
  k1: K_LAND,
  c0: C_CREEP,
  c1: C_LAND,
  warp: CAM_WARP,
});
const SETTLE = camMove({
  f0: 56,
  f1: 157,
  k0: K_LAND,
  k1: K_FINAL,
  c0: C_LAND,
  c1: C_FINAL,
  warp: 1,
});
export const CY_FINAL = C_FINAL + CAM_LIFT / K_FINAL;
export const CAM_F = [...CREEP.F, ...REACT.F.slice(1), ...SETTLE.F, DURATION];
export const CAM_K = [...CREEP.K, ...REACT.K.slice(1), ...SETTLE.K, K_FINAL];
export const CAM_CY = [...CREEP.CY, ...REACT.CY.slice(1), ...SETTLE.CY, CY_FINAL];
export const camAt = (f: number) => runCamera(f, CAM_F, CAM_CY, CAM_K);

// ---------------------------------------------------------------------------
// WHERE A COIN IS. One function, no state: the actor's legs, plus the nudges
// that keep the pile from ever being still.
// ---------------------------------------------------------------------------
export const actorPos = (i: number, f: number): { x: number; y: number; scale: number } | null => {
  const A = ACTORS[i];
  if (f >= A.dies) return null;
  let x: number;
  let y: number;
  const first = A.legs[0];
  if (f <= first.f0) {
    x = first.a.x;
    y = first.a.y;
  } else {
    let leg = first;
    for (const L of A.legs) if (f >= L.f0) leg = L;
    if (f >= leg.f1) {
      x = leg.b.x;
      y = leg.b.y;
    } else if (leg.kind === "fall" || leg.kind === "sink") {
      const u = (f - leg.f0) / (leg.f1 - leg.f0);
      const g = leg.kind === "fall" ? fallEase(u) : sinkEase(u);
      x = leg.a.x + (leg.b.x - leg.a.x) * g;
      y = leg.a.y + (leg.b.y - leg.a.y) * g;
    } else {
      const u = (f - leg.f0) / (leg.f1 - leg.f0);
      const g = flow(u, leg.kind === "slide" ? SLIDE_FLOW_A : FLOW_A);
      if (leg.kind === "slide") {
        // the pour's own path: pulled into the throat early, near vertical
        // through the middle, spreading to the slot only at the end. Its four
        // control x are all inside the mouth, so the stream is too.
        const p = cubicAt(slidePath(leg.a, leg.b, A.src), g);
        x = p.x;
        y = p.y;
      } else {
        x = leg.a.x + (leg.b.x - leg.a.x) * g;
        y = leg.a.y + (leg.b.y - leg.a.y) * g;
      }
    }
  }
  // At rest in the pile: the nudges and the shared strain. They are gated on a
  // 6-frame ramp from the coin's own landing rather than switched on at it —
  // `strain` is a sine and is not zero at an arbitrary frame, so switching it on
  // moved the coin by half a pixel in no time at all. The h = 1/4 pass caught
  // exactly that: 50 screen px/frame at f24.75, the frame actor0 lands, against
  // 41.6 at h = 1. With the ramp the two agree.
  const last = A.legs[A.legs.length - 1];
  const resting = last.kind === "slide" || last.kind === "step";
  const alive = resting ? smoothstep((f - A.land) / SETTLE_IN) : 0;
  if (alive > 0) {
    // every later arrival that landed near this coin pushes it down and it
    // comes back: the pile settles rather than freezing. The nudges take the
    // LARGEST of the neighbours and not their sum — summed, a coin with ten
    // later neighbours landing together moved 5 world px in one frame, which
    // measured 52 screen px/frame against the camera's own 36 at f29, over the
    // house's 45. Taking the max caps the displacement at ARRIVE_NUDGE and its
    // speed at 2 screen px/frame, and a pile does not visibly sink further for
    // two coins landing on it than for one.
    let push = 0;
    for (const j of NEIGHBOURS[A.slot] ?? []) {
      const t = (f - ACTORS[j].land) / ARRIVE_DUR;
      if (t > 0 && t < 1) push = Math.max(push, lobe(t));
    }
    let d = ARRIVE_NUDGE * push;
    if (!A.inFile) {
      // the backlog dips and returns on every departure, by
      // ROW_PITCH / (coins in that row): the neck sags, the wide rows do not.
      const amp = (HEAP_ROW_PITCH / ROW_N[A.row]) * NUDGE_FRAC;
      for (let n = 0; n < N_DRIP; n++) {
        const t = (f - (DRIP_LEAVE[n] + STEP_STAG * A.row)) / NUDGE_DUR;
        if (t > 0 && t < 1) d += amp * lobe(t);
      }
      d += HEAP_STRAIN * strain(f, A.slot);
    }
    y += d * alive;
  }
  // the coin in the spout strains against it, and the strain is damped to zero
  // over the five frames before it lets go, so the fall leaves from rest.
  const fallLeg = A.legs.find((L) => L.kind === "fall");
  if (fallLeg && f < fallLeg.f0 && f >= A.land) {
    const damp =
      smoothstep((f - A.land) / SETTLE_IN) *
      (1 - smoothstep((f - (fallLeg.f0 - SPOUT_WINDUP)) / SPOUT_WINDUP));
    y += SPOUT_STRAIN * damp * Math.sin((2 * Math.PI * (f - hash(i, 5) * STRAIN_PERIOD)) / STRAIN_PERIOD);
  }
  let scale = coinBreath(f, A.slot);
  if (fallLeg && f > fallLeg.f1) scale *= 1 - smoothstep((f - fallLeg.f1) / ABSORB);
  return { x, y, scale };
};

// ---------------------------------------------------------------------------
export const BEATS = {
  theres: 0,
  so: 5,
  much: 9,
  drudgery: 13,
  like1: 31,
  i: 36,
  think: 37,
  people: 40,
  are: 47,
  doing: 49,
  artisanal: 54,
  expense: 68,
  reports: 73,
  you: 90,
  know: 93,
  its: 96,
  fun: 99,
  to: 102,
  be: 105,
  like2: 107,
  a: 110,
  hipster: 112,
  and: 119,
  spend: 122,
  an: 125,
  hour: 128,
  making: 132,
  coffee: 139,
  end: 157,
} as const;

export const schema = z.object({
  ink: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  coinRadius: z.number(),
  beats: z.object({
    theres: z.number(),
    so: z.number(), // the field starts to slide
    much: z.number(),
    drudgery: z.number(),
    like1: z.number(), // the funnel is full
    i: z.number(),
    think: z.number(),
    people: z.number(),
    are: z.number(),
    doing: z.number(),
    artisanal: z.number(), // the first coin leaves the spout
    expense: z.number(),
    reports: z.number(),
    you: z.number(),
    know: z.number(),
    its: z.number(),
    fun: z.number(),
    to: z.number(),
    be: z.number(),
    like2: z.number(),
    a: z.number(),
    hipster: z.number(), // drip 3 leaves
    and: z.number(),
    spend: z.number(),
    an: z.number(),
    hour: z.number(),
    making: z.number(),
    coffee: z.number(), // drip 4 lands: the fourth line
    end: z.number(), // speech ends; tail to 173
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  coinRadius: FIELD_COIN_R,
  beats: BEATS,
});

// ---------------------------------------------------------------------------
const ArtisanalExpenseReports: React.FC<Props> = ({
  ink,
  backgroundBase,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  coinRadius,
}) => {
  const frame = useCurrentFrame();

  const cam = camAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CONE_CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the receipt ----------------------------------------------------------
  const h = recHeight(frame);
  const lines = linesAt(frame);
  const clicked = frame >= CLICK_F && frame < CLICK_F + CLICK_DUR;
  const tile = squirclePath(REC_W, h, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  const gs = REC_GLYPH / 24;
  const gx = (REC_W - REC_GLYPH) / 2;
  const gy = (REC_H0 - REC_GLYPH) / 2;
  const shadowRx = REC_W * CONTACT_SHADOW_RX * (1 + 0.1 * lines);

  // -- the coins ------------------------------------------------------------
  const moving: { i: number; x: number; y: number; s: number }[] = [];
  for (let i = 0; i < ACTORS.length; i++) {
    const p = actorPos(i, frame);
    if (p) moving.push({ i, x: p.x, y: p.y, s: p.scale });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CONE_CX}
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
            {/* the coin, once: `rampShared` owns the disc, the gradient and the
                "$" knockout, so a coin in this cut is the same object as a coin
                in cuts 1 and 2. ~2,500 of them a frame, every one a <use>. */}
            <CoinDefs k={k} r={coinRadius} />

            <defs>
              <linearGradient id="aer-rec-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TILE_GRAD_TOP} />
                <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
              </linearGradient>
              <mask id="aer-rec-m" maskUnits="userSpaceOnUse" x={0} y={0} width={REC_W} height={h}>
                <rect width={REC_W} height={h} fill="#fff" />
                <g
                  transform={`translate(${gx} ${gy}) scale(${gs})`}
                  fill="none"
                  stroke="#000"
                  strokeWidth={CARD_GLYPH_STROKE}
                  strokeLinecap={CARD_GLYPH_CAP}
                  strokeLinejoin={CARD_GLYPH_JOIN}
                  dangerouslySetInnerHTML={{ __html: RECEIPT_GLYPH }}
                />
                {DRIP_LAND.map((_, n) =>
                  frame >= DRIP_LAND[n] ? (
                    <rect
                      key={`r${n}`}
                      x={REC_W / 2 - ruleWidth(n, frame) / 2}
                      y={ruleY(n + 1) - REC_TOP - REC_RULE_H / 2}
                      width={ruleWidth(n, frame)}
                      height={REC_RULE_H}
                      fill="#000"
                    />
                  ) : null,
                )}
              </mask>
            </defs>

            {/* the field: every coin that is not an actor, drawn once as a
                <use> of the one symbol — this is texture, and a filter per coin
                at this count is a haze and a render time. */}
            <g>
              {FIELD_COINS.map((_, i) =>
                IS_ACTOR.has(i) ? null : (
                  <FieldCoin key={i} i={i} state={FIELD_STATE} scale={coinBreath(frame, i)} />
                ),
              )}
            </g>

            {/* the coins on the move and the coins in the heap, under the cone's
                line so a coin passes BEHIND the funnel's wall into it */}
            <g>
              {moving.map((m) => (
                <FieldCoin
                  key={`a${m.i}`}
                  i={ACTORS[m.i].src}
                  state={FIELD_STATE}
                  scale={m.s}
                  dx={m.x - FIELD_COINS[ACTORS[m.i].src].x}
                  dy={m.y - FIELD_COINS[ACTORS[m.i].src].y}
                />
              ))}
            </g>

            {/* the cone: a line drawing in the same material as a thread — one
                weight, square caps, nothing filled */}
            <g
              style={{ filter: icon }}
              stroke={ink}
              strokeWidth={CONE_W}
              strokeLinecap="square"
              fill="none"
            >
              <line
                x1={CONE_CX - MOUTH_W / 2 - RIM_PROUD}
                y1={MOUTH_Y}
                x2={CONE_CX + MOUTH_W / 2 + RIM_PROUD}
                y2={MOUTH_Y}
              />
              <line
                x1={CONE_CX - MOUTH_W / 2}
                y1={MOUTH_Y}
                x2={CONE_CX - SPOUT_W / 2}
                y2={NECK_Y}
              />
              <line
                x1={CONE_CX + MOUTH_W / 2}
                y1={MOUTH_Y}
                x2={CONE_CX + SPOUT_W / 2}
                y2={NECK_Y}
              />
              <line x1={CONE_CX - SPOUT_W / 2} y1={NECK_Y} x2={CONE_CX - SPOUT_W / 2} y2={SPOUT_Y} />
              <line x1={CONE_CX + SPOUT_W / 2} y1={NECK_Y} x2={CONE_CX + SPOUT_W / 2} y2={SPOUT_Y} />
              <line
                x1={CONE_CX - SPOUT_W / 2 - LIP}
                y1={SPOUT_Y}
                x2={CONE_CX - SPOUT_W / 2}
                y2={SPOUT_Y}
              />
              <line
                x1={CONE_CX + SPOUT_W / 2}
                y1={SPOUT_Y}
                x2={CONE_CX + SPOUT_W / 2 + LIP}
                y2={SPOUT_Y}
              />
            </g>

            {/* the receipt: the house tile, the glyph and every rule knocked
                out of it, growing one line per coin */}
            <g transform={`translate(${REC_X - REC_W / 2} ${REC_TOP})`} style={{ filter: TILE_SHADOW(k) }}>
              <ellipse
                cx={REC_W / 2}
                cy={h + 1}
                rx={shadowRx}
                ry={CONTACT_SHADOW_RY}
                fill="#000"
                opacity={CONTACT_SHADOW_OP}
                style={{ filter: "blur(3px)" }}
              />
              <path
                d={tile}
                fill="url(#aer-rec-g)"
                opacity={clicked ? 1 : REC_OP}
                mask="url(#aer-rec-m)"
              />
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default ArtisanalExpenseReports;

// The joins the cut rests on, asserted so a change to the cone, the pitch or
// the interval cannot quietly break the picture or slide a drip off its word.
if (FILE.some((i) => i < 0)) {
  throw new Error("ArtisanalExpenseReports: the cone's centre file has a gap");
}
SLOTS.forEach((s) => {
  const lim = s.y >= MOUTH_Y ? coneHalf(s.y) : Infinity;
  if (Math.abs(s.x - CONE_CX) + FIELD_COIN_R > lim + 0.01) {
    throw new Error(`ArtisanalExpenseReports: a heap slot at (${s.x}, ${s.y}) is outside the cone`);
  }
});
if (SOURCES.length < N_HEAP + N_REFILL || SOURCES.some((i) => i < 0)) {
  throw new Error("ArtisanalExpenseReports: not enough field coins near the mouth to fill the cone");
}
// THE POUR IS A STREAM, NOT A SPRAY. Every source is inside the column, and a
// cubic's x lies in the hull of its four control x, so checking the controls
// checks every frame of every path: the stream is never wider than the mouth.
ACTORS.forEach((A) => {
  const L = A.legs[0];
  const c = slidePath(L.a, L.b, A.src);
  for (const p of [c.p0, c.p1, c.p2, c.p3]) {
    if (Math.abs(p.x - CONE_CX) > MOUTH_W / 2 + 0.01) {
      throw new Error(
        `ArtisanalExpenseReports: a pour path leaves the mouth's width at x ${p.x.toFixed(1)}`,
      );
    }
  }
});
// the drips are one interval, and the last one lands in the last third of the
// words rather than halfway through them
if (DRIP_LAND[N_DRIP - 1] < BEATS.end - (BEATS.end - BEATS.artisanal) / 3) {
  throw new Error("ArtisanalExpenseReports: the last drip does not land in the last third");
}
if (DRIP_LEAVE.some((l, n) => n > 0 && l - DRIP_LEAVE[n - 1] !== DRIP_GAP)) {
  throw new Error("ArtisanalExpenseReports: the drip interval is not the one quantity");
}
// no drip may be in flight when the next one leaves: one at a time, always
if (FALL_DUR + ABSORB >= DRIP_GAP) {
  throw new Error("ArtisanalExpenseReports: two coins would be in the air at once");
}
