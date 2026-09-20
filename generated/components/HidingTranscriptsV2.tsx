import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { SPINE_OPACITY, STROKE, cometPath } from "./GoodTrajectory";
import { SKULL_EYES, SKULL_NOSE, SKULL_OUTLINE } from "./ChainOfThought";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Children`, cut `HidingTranscripts`, VERSION 2:
// "They're going to understand the concept of chain of thought, and they're
//  going to understand that, like, you know, just hiding some transcripts or
//  whatever"
//
// WHY V2 EXISTS. V1 was rejected by the user:
//   "way too similar to the previous one and frankly pretty boringly made ...
//    make a more clever, thought-out version that makes sense."
// They were right. V1 was cut 4's picture again — the same comet, the same
// chain, the same skull — with one more ring drawn on top of it. It illustrated
// nothing that cut 4 had not already shown, and the line it was under is the
// one place in the clip where the MECHANISM is the subject. So V2 throws the
// picture away and builds the mechanism instead: a machine that is already
// running when we arrive, that we can read, and that the AI then tries the
// naive thing to. Nothing is carried over from cut 4's composition. We are off
// the flow line entirely — no stream, no spine, no ladder — because cut 4's
// `follow` variant already took us away from it and there is no reason to go
// back for one line.
//
// DURATION. The composition starts at 32.500 s and speech ends at 38.760 s:
//   DURATION = round((38.760 - 32.500) * 24) + 16 = 150 + 16 = 166
//
// Word onsets, frame = round((t - 32.500) * 24):
//   they're 0 · going 6 · to 9 · UNDERSTAND 12 · the 24 · CONCEPT 27 · of 33 ·
//   CHAIN 37 · of 40 · THOUGHT 43 (ends 48) · and 48 · they're 51 · going 55 ·
//   UNDERSTAND 57 · THAT 65 · like 69 · you 76 · know 79 · JUST 84 ·
//   HIDING 88 (held to 106) · SOME 106 · TRANSCRIPTS 121 (to 143) · or 143 ·
//   whatever 145 · speech ends 150 · tail 150-166.
export const DURATION = 166;

// ---------------------------------------------------------------------------
// EDITORIAL NOTE. At f150 the editor cuts to the speaker's face for "...is
// insufficient, because of chain of thought monitoring". So this cut hands over
// mid-mechanism and does not resolve: at f150 two pages in the pile are blank,
// two still carry their lines, the comet is between the second and the third,
// and — the whole point — a NEW line with a skull on it is being written on the
// live page and our ring is gliding along it as we cut away. The picture has
// already said why hiding some transcripts is insufficient; nothing in here
// says it in words, and nothing here is a gesture for the line that follows.
// The sixteen tail frames are the same machine still running.
//
// ---------------------------------------------------------------------------
// THE IDEA, in one sentence: a thought leaves the AI, travels down its chain,
// lands on a page and becomes a written line that we read — and finished pages
// pile up, so blanking a few of them does nothing while the machine is still
// writing.
//
// VOCABULARY.
//   THE COMET    the AI. One, big (dot radius 30 — the largest in the clip),
//                deep-toned because it is a misaligned one, and NOT ringed: in
//                this picture the thing under observation is the transcript,
//                not the model.
//   A BEAD       one thought, in flight. Cut 4's bead: solid ACCENT, radius 9,
//                on an ACCENT thread at half the world stroke.
//   THE PAGE     a white rounded-rect outline, nine rows. Ours, because reading
//                is ours.
//   A LINE       a written thought: a solid ACCENT pill, 18 world px high —
//                exactly a bead's diameter, because it IS the bead, stretched.
//                Indented rows are structure, never text.
//   THE RING     cut 2's white ring, radius 22, one only. It glides along each
//                line as it is written and rests at its end. That glide is
//                chain-of-thought monitoring, drawn.
//   THE PILE     the transcripts: finished pages, fanned, at 0.62 scale.
//   A BLANK PAGE a hidden one: it flips about its own vertical axis and comes
//                back with no lines and a DASHED outline. It is still a page —
//                that is why the trick does not work.
//   A SKULL LINE a thought about hiding, written down like all the others. From
//                f87 every new line carries a skull at its row start.
//
// ---------------------------------------------------------------------------
// GESTURES — the machine never stops; the words are landings on top of it.
//
//  1. f0-48   "they're going to   THE MECHANISM. We open TIGHT on the comet at
//             understand the      k 1.90 — it is at screen (470, 640) with
//             concept of chain    beads already leaving it and its chain
//             of thought"         running out of the bottom of frame — and the
//             (f12/f27/f37/f43)   camera travels down that chain on one curve,
//                                 discovering the page as it goes and easing to
//                                 k 1.45 as it arrives. It gets there as a bead
//                                 lands, stretches into a line, and the white
//                                 ring slides along it. Thought, written, read,
//                                 landing across CHAIN OF THOUGHT.
//  2. f48-84  "and they're going  THE MACHINE. One eased pull-back to the whole
//             to understand       thing: comet above, live page below it, the
//             that, like, you     pile of finished transcripts at the left. On
//             know"               UNDERSTAND THAT the comet TURNS — its heading
//             (f57/f65)           swings by the shortest arc from "travelling
//                                 on" to facing down at the pages. It has
//                                 noticed. Under "like, you know" the full page
//                                 slides onto the pile and a fresh one draws on
//                                 in its place, and the beads already in flight
//                                 land on the fresh one.
//  3. f84-166 "just hiding some   THE NAIVE FIX. The comet leaves home in one
//             transcripts or      swoop, its tail trailing and its thread
//             whatever"           stretching behind it, and goes to the pile.
//             (f84/f88/f106/f121) Its dot reaches the top page — the one we
//                                 just watched being written — and that page
//                                 FLIPS BLANK across HIDING. It carries along
//                                 the fan and the next one flips on
//                                 TRANSCRIPTS. It is drifting toward a third
//                                 when we cut away. All through it the chain is
//                                 STILL RUNNING: the thread stretches from the
//                                 comet on the pile back up to the live page on
//                                 every single frame, beads keep coming down
//                                 it, and every line they write now carries a
//                                 skull. The ring keeps reading them.
//
// ---------------------------------------------------------------------------
// MEASURED.
//   Camera        |dv| 2.30 at f58, peak |v| 32.4 screen px/f. The k track is
//                 authored to LEAD its own damper: on screen it reads 1.90 at
//                 the open, 1.39 as the page arrives, opens out to 0.87 through
//                 the turn so the comet and the page can share the frame, and
//                 comes back to 0.99 with the comet's swoop.
//   Framing       the comet opens at screen (470, 640) and is WHOLLY IN FRAME,
//                 dot and tail, from f50 to the last frame — nearest approach
//                 to the top edge 132 px. From f116 everything is inside
//                 x 70-1010, y 200-1400.
//   The chain     is visible on EVERY frame of the cut: between 1 and 4 beads
//                 are on the thread at all times and the thread itself is drawn
//                 at full length from the comet's dot to the row being written,
//                 however far away the comet has gone. Its bow always leans
//                 away from the page's middle, so it arrives at the row start
//                 from outside and never crosses a written line.
//   The hand-off  at f150: SEVEN lines on the live page, the eighth bead in
//                 flight with a ninth behind it, the ring gliding along line
//                 seven, two pile pages blank and two still carrying their
//                 lines, the comet between the second and the third.
//                 At f165: eight lines, the eighth being read, the ninth bead
//                 still on its way. The page is never full inside this cut, so
//                 it never slides a second time.
//   Sizes         comet dot 40 world px; skull bullet 1.9 x the pill height,
//                 34.7 screen px at the resolution; a pile page's lines 11.3.
// KNOWN DEVIATIONS.
//   Page 1's lines come every 12 frames, not the 10 that was asked for. The two
//   frames this cut hands over on pin the rate: line seven has to be under the
//   ring at f150 AND line nine must still be in the air at f165, and those two
//   together admit nothing under 11.
//   The pile's top pages show at the bottom-left of frame from about f34, not
//   f48. Compacting the machine so the comet stays in frame through the turn
//   pulled the pile up with it, and the two cannot both be had: the turn is the
//   hinge of the cut and the pile arriving a dozen frames early is a much
//   smaller price than playing that turn off-screen.
//   The frame opens out to k 0.87 over f64-80 rather than holding at 0.92 —
//   that is the width the comet and the page need to be in shot together while
//   the comet is still at home.
//
// ---------------------------------------------------------------------------
export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
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
  dotOpacity: z.number(),
  beats: z.object({
    understand: z.number(),
    chain: z.number(),
    thought: z.number(),
    that: z.number(),
    just: z.number(),
    hiding: z.number(),
    transcripts: z.number(),
    cut: z.number(),
  }),
});
export type Props = z.infer<typeof schema>;

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
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    understand: 12,
    chain: 37,
    thought: 43,
    that: 65,
    just: 84,
    hiding: 88,
    transcripts: 121,
    cut: 150,
  },
});

const CX = FRAME_W / 2;
export const W0 = 780;

// ---------------------------------------------------------------------------
// THE STAGE. Everything is laid out in the 1080 x 1920 world at k = 1, so the
// numbers below read as the picture: the comet up at the left, the live page
// under and right of it, the pile down at the left.
// ---------------------------------------------------------------------------
export const COMET_R = 40;
/** THE MACHINE IS COMPACT. Home was 280 px above the page's top edge and the
 *  wide shot could not hold it: from f50 to f86 the comet was off the top of
 *  frame and the TURN — the AI noticing, which is the hinge of the cut — played
 *  where nobody could see it. It now sits 210 px above the page, close over its
 *  top-left corner, and the chain is shorter for it. */
export const HOME = { x: 500, y: 430 };
export const PAGE_W = 400;
export const PAGE_H = 520;
export const PAGE_R = 28;
export const PAGE_C = { x: 650, y: 900 };
export const ROWS = 9;
export const ROW_PITCH = 50;
export const LINE_H = 18;
export const BEAD_R = LINE_H / 2; // a line IS the bead, stretched
export const ROW_X0 = -PAGE_W / 2 + 35;
export const ROW_W = PAGE_W - 70;
export const INDENT = 36;
export const RING_R = 22;
/** The dimmed grid renders at about #656565; a page sits one step under it, so
 *  it occludes without becoming a new, darker object in the palette. */
const PAGE_FILL = "#5C5C5C";
/** The skull bullet. At 1.1 x the pill height the icon's own 2/24 stroke ratio
 *  gives a 1.7 px line, which is invisible beside a 9.7 px world stroke, so the
 *  bullet is 1.9 x instead — as large as a 50 px row pitch allows — and takes a
 *  stroke of its own: the one place in the cut with a third weight, and the
 *  alternative was an orange blob. It is the line's punchline and has to
 *  survive a phone-sized view. */
export const SKULL_BOX = LINE_H * 1.9;
const SKULL_STROKE = 3.3;

/** The pile sits BELOW the live page, not beside it. Side by side, the machine
 *  was a wide, short band across the middle of a 9:16 frame with 500 px of grey
 *  above it and 700 below; stacked, the same three objects fill the column. */
export const PILE_C = { x: 230, y: 1250 };
export const PILE_S = 0.62;
/** Four fan slots. Slot 3 is the top of the pile, which is where the live page
 *  goes when it is full; slots 0-2 are already there when we arrive. */
export const SLOT_ROT = [-6, -2, 3, 7];
/** The fan is spread far enough that the comet visibly travels from one page to
 *  the next — 64 px between slots against a page 248 px wide, so they still
 *  overlap into one pile but are four distinct pages. */
export const SLOT_OFF = [
  { x: -99, y: 55 },
  { x: -33, y: 19 },
  { x: 33, y: -16 },
  { x: 99, y: -52 },
];

// ---------------------------------------------------------------------------
// THE SCHEDULE. Arrival frames are authored, because they are what the words
// land on; everything else — when a bead is launched, where the thread is, when
// the ring moves, when a page is full — is derived from them.
// ---------------------------------------------------------------------------
/** Page 0 opens with its first row already written and takes eight more, one
 *  every 7 frames. Page 1's come every 12, which is slower than it looks: the
 *  comet is away hiding by then and its chain to the page is half as long
 *  again. Twelve and not ten because the two frames this cut hands over on pin
 *  it — see MEASURED. At this rate the page is never full inside the cut, so it
 *  never slides a second time and the machine is still writing when we leave. */
const ARRIVE_0 = [-6, 3, 10, 17, 24, 31, 38, 45, 52];
const ARRIVE_1 = Array.from({ length: ROWS }, (_, i) => 71 + 12 * i);
/** Three thoughts that are still on the thread when the editor cuts away. They
 *  are aimed at the page after this one, which this cut never sees: the machine
 *  does not stop because we stopped watching it, and without them the chain
 *  runs dry for the last eighteen frames. */
const ARRIVE_2 = [177, 189, 201];
/** From here every new line is a thought about hiding, and is written down. */
export const F_SKULL = 87;
/** Every thought takes the same time to get down the chain, so the beads leave
 *  the comet on exactly the cadence they land on. Solving the launch from the
 *  thread's length instead made them bunch — eight at once — the moment the
 *  comet flew off and the thread doubled in length. The speed varies instead,
 *  which is what a longer thread should look like. 23 and not 26 because the
 *  chain is shorter now: the beads travel at the same rate they always did. */
const TRAVEL = 23;
const WRITE_F = 6; // bead -> pill
const READ_F = 6; // the ring's glide along a line
const F_SLIDE: [number, number] = [56, 74];
const F_FRESH: [number, number] = [58, 69];
const FLIP_F = 8;

export type Line = { page: number; row: number; arrive: number; len: number; indent: boolean };
export const LINES: Line[] = [];
// The three transcripts that are already on the pile when we arrive. They were
// written long before this cut: they are what "the transcripts" means, and
// without their lines the pile is three empty outlines and the whole picture
// says nothing.
[-3, -2, -1].forEach((page) => {
  for (let row = 0; row < ROWS; row++) {
    const h = hash(page * 41 + row, 3);
    const indent = hash(page * 23 + row, 7) > 0.62;
    const x0 = ROW_X0 + (indent ? INDENT : 0);
    LINES.push({
      page,
      row,
      arrive: -900 + page * 10 + row,
      len: Math.min(ROW_W * (0.45 + 0.5 * h), PAGE_W / 2 - RING_R - 12 - x0),
      indent,
    });
  }
});
[ARRIVE_0, ARRIVE_1, ARRIVE_2].forEach((arr, page) => {
  arr.forEach((arrive, row) => {
    const h = hash(page * 31 + row, 5);
    const indent = hash(page * 17 + row, 11) > 0.62;
    const x0 = ROW_X0 + (indent ? INDENT : 0);
    // ...capped so the RING, which rests on a line's end, can never reach the
    // page's own outline. Uncapped, four frames of the slide had the two marks
    // touching.
    const cap = PAGE_W / 2 - RING_R - 12 - x0;
    LINES.push({
      page,
      row,
      arrive,
      len: Math.min(ROW_W * (0.45 + 0.5 * h), cap),
      indent,
    });
  });
});
export const lineX0 = (l: Line) => ROW_X0 + (l.indent ? INDENT : 0);
export const lineY = (l: Line) => (l.row - (ROWS - 1) / 2) * ROW_PITCH;
export const hasSkull = (l: Line) => l.arrive >= F_SKULL;
/** The skull is drawn first and the pill starts after it. */
const skullPad = (l: Line) => (hasSkull(l) ? SKULL_BOX + 8 : 0);

// ---------------------------------------------------------------------------
// THE COMET. Home with a private wander until it notices; then one swoop to the
// pile and along the fan. Its heading is its own until it turns, and its
// velocity after that, so the tail can never disagree with the motion.
// ---------------------------------------------------------------------------
/** Where the comet parks to blank a page: close enough that its DOT is on the
 *  page, which is what triggers the flip. */
const visit = (slot: number) => ({
  x: PILE_C.x + SLOT_OFF[slot].x + 104,
  y: PILE_C.y + SLOT_OFF[slot].y - 88,
});
const F_TURN: [number, number] = [57, 65];
const CKEY: { f: number; p: { x: number; y: number } }[] = [
  { f: 84, p: HOME },
  { f: 98, p: visit(3) },
  { f: 124, p: visit(2) },
  { f: 158, p: visit(1) },
];

export const cometAt = (f: number) => {
  const w = {
    x: 9 * Math.sin((f / 47) * 2 * Math.PI) + 5 * Math.sin((f / 29) * 2 * Math.PI + 1.1),
    y: 7 * Math.sin((f / 53) * 2 * Math.PI + 2.2) + 4 * Math.sin((f / 31) * 2 * Math.PI),
  };
  let x = HOME.x;
  let y = HOME.y;
  if (f > CKEY[0].f) {
    for (let i = 0; i < CKEY.length - 1; i++) {
      const a = CKEY[i];
      const b = CKEY[i + 1];
      if (f <= a.f) break;
      const g = camEase(clamp01((f - a.f) / (b.f - a.f)), 1.0);
      x = a.p.x + (b.p.x - a.p.x) * g;
      y = a.p.y + (b.p.y - a.p.y) * g;
      if (f <= b.f) break;
    }
  }
  return { x: x + w.x, y: y + w.y };
};

const HD_HOME = (-32 * Math.PI) / 180;
export const cometHd = (f: number) => {
  const a = cometAt(f - 0.5);
  const b = cometAt(f + 0.5);
  const v = Math.hypot(b.x - a.x, b.y - a.y);
  // the turn on "understand that": the shortest arc from travelling on to
  // facing the pages, and after the swoop starts, simply where it is going
  const toPile = Math.atan2(PILE_C.y - HOME.y, PILE_C.x - HOME.x);
  let d = toPile - HD_HOME;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const turned = HD_HOME + d * smoothstep(clamp01((f - F_TURN[0]) / (F_TURN[1] - F_TURN[0])));
  if (v < 1.6) return turned;
  const moving = Math.atan2(b.y - a.y, b.x - a.x);
  let e = moving - turned;
  while (e > Math.PI) e -= 2 * Math.PI;
  while (e < -Math.PI) e += 2 * Math.PI;
  return turned + e * smoothstep(clamp01((v - 1.6) / 2.4));
};

// ---------------------------------------------------------------------------
// THE PAGES. A page is a local frame — centre (0,0), PAGE_W x PAGE_H — and a
// transform. Page 0 is live until f60 and then rides one eased arc into slot 3;
// page 1 draws on in its place; the pile pages never move.
// ---------------------------------------------------------------------------
export type Xform = { x: number; y: number; s: number; rot: number };
const slotXform = (slot: number): Xform => ({
  x: PILE_C.x + SLOT_OFF[slot].x,
  y: PILE_C.y + SLOT_OFF[slot].y,
  s: PILE_S,
  rot: SLOT_ROT[slot],
});

export const pageXform = (page: number, f: number): Xform => {
  if (page < 0) return slotXform(page + 3); // the three already on the pile
  if (page >= 1) return { x: PAGE_C.x, y: PAGE_C.y, s: 1, rot: 0 };
  const g = camEase(clamp01((f - F_SLIDE[0]) / (F_SLIDE[1] - F_SLIDE[0])), 1.0);
  if (g <= 0) return { x: PAGE_C.x, y: PAGE_C.y, s: 1, rot: 0 };
  const t = slotXform(3);
  // one eased arc, not a straight slide: the bow is perpendicular to the travel
  const dx = t.x - PAGE_C.x;
  const dy = t.y - PAGE_C.y;
  const bow = 120 * Math.sin(Math.PI * g);
  const n = Math.hypot(dx, dy);
  return {
    x: PAGE_C.x + dx * g + (-dy / n) * bow,
    y: PAGE_C.y + dy * g + (dx / n) * bow,
    s: 1 + (t.s - 1) * g,
    rot: t.rot * g,
  };
};

export const toWorld = (t: Xform, lx: number, ly: number) => {
  const r = (t.rot * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: t.x + (lx * c - ly * s) * t.s, y: t.y + (lx * s + ly * c) * t.s };
};

/** A page is blanked when the comet's DOT reaches it, not on a clock. */
const TOUCH = 150;
export const FLIP_AT: number[] = [3, 2, 1, 0].map(() => Infinity);
(() => {
  const order = [3, 2, 1, 0];
  let from = 84;
  for (const slot of order) {
    const t = slotXform(slot);
    for (let f = from; f <= DURATION + 16; f++) {
      const c = cometAt(f);
      if (Math.hypot(c.x - t.x, c.y - t.y) < TOUCH) {
        FLIP_AT[slot] = f;
        from = f + FLIP_F;
        break;
      }
    }
  }
})();
/** 0 -> 1 -> 0 on scaleX, and the page comes back blank and dashed. */
export const flipU = (slot: number, f: number) => clamp01((f - FLIP_AT[slot]) / FLIP_F);
export const flipScaleX = (slot: number, f: number) => {
  const u = flipU(slot, f);
  if (u <= 0 || u >= 1) return 1;
  return Math.abs(Math.cos(u * Math.PI));
};
export const isBlank = (slot: number, f: number) => flipU(slot, f) >= 0.5;

/** The fresh page's outline draws on while the full one is still travelling. */
export const freshU = (f: number) => clamp01((f - F_FRESH[0]) / (F_FRESH[1] - F_FRESH[0]));

// ---------------------------------------------------------------------------
// THE CHAIN. Each bead rides its own gentle Bezier from the comet's dot to the
// row it will land on. Its launch frame is solved from the thread's length at
// arrival, so the bead travels at BEAD_V and the ARRIVALS are what is authored.
// The thread drawn on screen is the next bead's, re-curved every frame, so it
// follows the comet wherever it goes.
// ---------------------------------------------------------------------------
const targetOf = (l: Line, f: number) =>
  toWorld(pageXform(l.page, f), lineX0(l) + skullPad(l) + BEAD_R, lineY(l));

const bezRaw = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // the bow always leans AWAY from the page's middle, so however far the comet
  // wanders the thread arrives at the row start from outside and never cuts
  // across the lines that are already written
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const sgn = (-dy * (mx - PAGE_C.x) + dx * (my - PAGE_C.y)) >= 0 ? 1 : -1;
  const cx = mx + -dy * 0.17 * sgn;
  const cy = my + dx * 0.17 * sgn;
  const m = 1 - t;
  return { x: m * m * a.x + 2 * m * t * cx + t * t * b.x, y: m * m * a.y + 2 * m * t * cy + t * t * b.y };
};
/** The thread, parametrised BY ARC LENGTH. The raw quadratic runs nearly twice
 *  as fast at its ends as in its middle, which made the beads visibly surge and
 *  — because the camera rides one of them — put a 5.8 px/f^2 corner in the
 *  camera at the landing. Even spacing fixes both. */
const bez = (a: { x: number; y: number }, b: { x: number; y: number }, u: number) => {
  const N = 20;
  const pts = [bezRaw(a, b, 0)];
  const cum = [0];
  for (let i = 1; i <= N; i++) {
    const q = bezRaw(a, b, i / N);
    cum.push(cum[i - 1] + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y));
    pts.push(q);
  }
  const L = cum[N];
  if (L < 1e-6) return pts[0];
  const target = clamp01(u) * L;
  let i = 1;
  while (i < N && cum[i] < target) i++;
  const f = (target - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
  return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f };
};
/** A quadratic that PASSES THROUGH `mid` at its own halfway point and ends at
 *  `end`, sampled by arc length. Used only by the camera. */
const quadArc = (
  a: { x: number; y: number },
  mid: { x: number; y: number },
  b: { x: number; y: number },
  u: number,
) => {
  const cx = 2 * mid.x - (a.x + b.x) / 2;
  const cy = 2 * mid.y - (a.y + b.y) / 2;
  const at = (t: number) => {
    const m = 1 - t;
    return { x: m * m * a.x + 2 * m * t * cx + t * t * b.x, y: m * m * a.y + 2 * m * t * cy + t * t * b.y };
  };
  const N = 24;
  const pts = [at(0)];
  const cum = [0];
  for (let i = 1; i <= N; i++) {
    const q = at(i / N);
    cum.push(cum[i - 1] + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y));
    pts.push(q);
  }
  const L = cum[N];
  if (L < 1e-6) return pts[0];
  const target = clamp01(u) * L;
  let i = 1;
  while (i < N && cum[i] < target) i++;
  const f = (target - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
  return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f };
};

export const LAUNCH: number[] = LINES.map((l) => l.arrive - TRAVEL);

export const beadAt = (i: number, f: number) => {
  const l = LINES[i];
  const u = clamp01((f - LAUNCH[i]) / (l.arrive - LAUNCH[i]));
  const c = cometAt(f);
  const t = targetOf(l, f);
  return { ...bez(c, t, u), u };
};
/** Is bead i in flight — launched, not yet landed? */
export const inFlight = (i: number, f: number) => f >= LAUNCH[i] && f < LINES[i].arrive;
/** How far a landed line has stretched out of its bead, 0..1. */
export const writeU = (i: number, f: number) => clamp01((f - LINES[i].arrive) / WRITE_F);

/** The thread the camera and the eye follow: to the next bead that will land. */
/** The row the chain is currently feeding. There is ALWAYS one — the thread is
 *  drawn to it at full length on every frame of the cut, because the machine
 *  never stops and a frame without a thread says that it has. */
export const nextBead = (f: number) => {
  for (let i = 0; i < LINES.length; i++) if (LINES[i].arrive > f) return i;
  return LINES.length - 1;
};

// ---------------------------------------------------------------------------
// THE RING. It reads. While a line is being written it travels from wherever it
// was resting to that line's start; then it glides to the line's end and waits
// there. Its position is computed in the PAGE's local frame and transformed, so
// when the page slides to the pile it goes with it, still reading.
// ---------------------------------------------------------------------------
export const ringState = (f: number) => {
  let cur = 0;
  for (let i = 0; i < LINES.length; i++) if (LINES[i].arrive <= f) cur = i;
  const l = LINES[cur];
  const nxt = LINES[Math.min(LINES.length - 1, cur + 1)];
  const end = (q: Line) => lineX0(q) + skullPad(q) + q.len;
  const start = (q: Line) => lineX0(q) + skullPad(q);
  const readEnd = l.arrive + WRITE_F + READ_F;
  const read = clamp01((f - l.arrive - WRITE_F) / READ_F);
  // resting or reading: on its own line, on its own page, so when that page
  // slides to the pile the ring goes with it
  const here = toWorld(pageXform(l.page, f), start(l) + (end(l) - start(l)) * read, lineY(l));
  // ...and it leaves for the next line as soon as that thought is nearly down
  // the chain. Waiting for it to land left the ring riding the page all the way
  // to the pile and back, which dragged it across the fresh page's outline.
  const m0 = Math.max(readEnd, nxt.arrive - 14);
  const m1 = nxt.arrive + WRITE_F;
  const mv = nxt === l ? 0 : camEase(clamp01((f - m0) / Math.max(1, m1 - m0)), 1.0);
  const there = toWorld(pageXform(nxt.page, f), start(nxt), lineY(nxt));
  const t = pageXform(mv > 0.5 ? nxt.page : l.page, f);
  return {
    x: here.x + (there.x - here.x) * mv,
    y: here.y + (there.y - here.y) * mv,
    r: RING_R * t.s,
    line: cur,
    read,
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA. One track. It goes down the chain with ONE bead — the one that
// lands on f38 — from the frame that bead leaves the comet, so the glide has no
// join in it; then one eased pull-back on to the whole machine; then a small
// lean toward the pile with the comet, and a decaying drift.
// ---------------------------------------------------------------------------
const RIDE_I = LINES.findIndex((l) => l.arrive === 38);
const K_CLOSE = 1.9;
const K_WIDE = 0.99;
/** The ride runs until f70, well inside the pull-back, so its own deceleration
 *  happens while the pull is already carrying the frame. */
const RIDE_RUN = 100;
const F_PULL: [number, number] = [48, 106];
const PULL_W = 0.7;
const F_PAN: [number, number] = [46, 76];
const F_LEAN: [number, number] = [84, 135];
const TRACK_F1 = DURATION + 16;
/** Screen-space offset for the ride, so the comet opens at (470, 640) with its
 *  thread running out of the bottom of frame. CAM_LIFT is already in the track,
 *  so it comes back out here. */
const RIDE_OFF = { x: 70, y: 195 };
/** ...and the whole opening is held this far ABOVE the point it is riding, so
 *  the frame does not reach down into the pile before the pull-back does. */
const OPEN_LIFT = 0;
const OFF_RUN = 50;
const MACHINE = { x: 428, y: 888 };
const LEAN_TO = { x: 400, y: 922 };

type KSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };
const kTrack = (segs: KSeg[]) => {
  const K: number[] = new Array(TRACK_F1 + 1).fill(segs[0].k0);
  segs.forEach((s, i) => {
    if (i > 0 && segs[i - 1].f1 !== s.f0) throw new Error("camera: k segments must meet");
    for (let f = s.f0; f <= Math.min(TRACK_F1, s.f1); f++)
      K[f] = s.k0 + (s.k1 - s.k0) * camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    for (let f = s.f1 + 1; f <= TRACK_F1; f++) K[f] = s.k1;
  });
  return K;
};
/** The camera's k is DAMPED, and the damper's lag is long: an authored ramp to
 *  1.45 by f48 still reads 1.88 on screen at f48. The track therefore LEADS —
 *  it asks for far wider, far earlier, than the picture wants — and what the
 *  frame actually does is the damped result: 1.90 at the open, about 1.45 as
 *  the page arrives, opening out through the turn, and back to K_WIDE as the
 *  comet swoops. */
const K_OUT = 0.86;
const K_TRACK = kTrack([
  { f0: 0, f1: 38, k0: K_CLOSE, k1: 1.55, warp: 0.9 },
  { f0: 38, f1: 64, k0: 1.55, k1: K_OUT, warp: 0.8 },
  { f0: 64, f1: 108, k0: K_OUT, k1: K_WIDE, warp: 0.9 },
  { f0: 108, f1: TRACK_F1, k0: K_WIDE, k1: K_WIDE * 0.985, warp: 0.5 },
]);

const CAM = (() => {
  const F: number[] = [];
  const CXT: number[] = [];
  const CYT: number[] = [];
  for (let f = 0; f <= TRACK_F1; f++) {
    const k = K_TRACK[f];
    const g = Math.min(DURATION, f);
    // THE RIDE, as ONE curve. Not "down the thread, then along the line": that
    // is a corner, and taking it at the speed a 640 px thread in 35 frames
    // needs cost 5.3 px/f^2 right on "chain". It is one quadratic from the
    // comet, THROUGH the point the bead lands on, out to the end of the line it
    // becomes — arc-length parametrised and eased once — so the camera arrives
    // with the bead and turns along the line without ever changing direction
    // abruptly.
    const l = LINES[RIDE_I];
    const ride = (() => {
      // the page's PRE-SLIDE frame: the camera is looking at the place the line
      // was written, not at the page. Letting it follow the page to the pile
      // put the slide's own acceleration straight into the camera (3.5 px/f^2
      // at f64) for no reason — by then the pull-back owns the frame anyway.
      const t = pageXform(l.page, Math.min(g, F_SLIDE[0]));
      const land = toWorld(t, lineX0(l) + skullPad(l) + BEAD_R, lineY(l));
      const end = toWorld(t, lineX0(l) + skullPad(l) + l.len, lineY(l));
      const c0 = cometAt(g);
      const u = camEase(clamp01(g / RIDE_RUN), 1.0);
      return quadArc(c0, land, end, u);
    })();
    // the PAN reaches the machine well before the zoom finishes: the comet has
    // to be in frame for the turn at f57-65, and it cannot be while the frame
    // is still hung on the page.
    const pull = camEase(clamp01((g - F_PAN[0]) / (F_PAN[1] - F_PAN[0])), PULL_W);
    const lean = camEase(clamp01((g - F_LEAN[0]) / (F_LEAN[1] - F_LEAN[0])), 0.9);
    const wide = {
      x: MACHINE.x + (LEAN_TO.x - MACHINE.x) * lean,
      y: MACHINE.y + (LEAN_TO.y - MACHINE.y) * lean,
    };
    // THE RIDE IS TAKEN WHOLE, but not centred: the comet is held at screen
    // (470, 640) at the open — high and a little left, with its thread running
    // out of the bottom of frame — and that offset relaxes to nothing as the
    // camera arrives at the page, so the page is centred by the time it is
    // being read. A partial-amplitude ride cannot do both.
    // ...and it is gone by OFF_RUN, not by the end of the ride. Fading it over
    // the whole ride kept pushing the camera down long after the opening, and
    // that is what put the comet off the top of frame through the turn.
    const off = 1 - camEase(clamp01(g / OFF_RUN), 1.0);
    const lift = 1 - camEase(clamp01((g - F_PULL[0]) / (F_PULL[1] - F_PULL[0])), PULL_W);
    const rx = ride.x + (RIDE_OFF.x / k) * off;
    const ry = ride.y + (RIDE_OFF.y / k) * off - OPEN_LIFT * lift;
    F.push(f);
    CXT.push(rx + (wide.x - rx) * pull);
    CYT.push(ry + (wide.y - ry) * pull + CAM_LIFT / k);
  }
  return { F, K: K_TRACK, CX: CXT, CY: CYT };
})();

const dampX = (upto: number) => runCamera(upto, CAM.F, CAM.CX, CAM.K).cy;
const CAM_AT_F = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: dampX(f) + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
export const CAM_AT = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
export const SCREEN_AT = (f: number, wx: number, wy: number) => {
  const c = CAM_AT(f);
  return [CX + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
const roundRect = (w: number, h: number, r: number) => {
  const x = -w / 2;
  const y = -h / 2;
  return [
    `M${x + r} ${y}`,
    `H${x + w - r}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}`,
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join(" ");
};
const PAGE_D = roundRect(PAGE_W, PAGE_H, PAGE_R);

const SkullBullet: React.FC<{ x: number; y: number; accent: string; opacity: number }> = ({
  x,
  y,
  accent,
  opacity,
}) => {
  const s = SKULL_BOX / 24;
  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s}) translate(-12 -12.5)`}
      fill="none"
      stroke={accent}
      strokeWidth={SKULL_STROKE / s}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    >
      <path d={SKULL_OUTLINE} />
      <path d={SKULL_NOSE} />
      {SKULL_EYES.map((e, i) => (
        <circle key={i} cx={e.cx} cy={e.cy} r={e.r} />
      ))}
    </g>
  );
};

/** One page, drawn in its own local frame: outline, then its written lines. */
const Page: React.FC<{
  page: number;
  slot: number | null;
  f: number;
  accent: string;
  ink: string;
  opacity: number;
  dashed: boolean;
  blank: boolean;
  scaleX: number;
  draw: number;
  icon: string;
  bg: string;
}> = ({ page, slot, f, accent, ink, opacity, dashed, blank, scaleX, draw, icon, bg }) => {
  const t = page < 0 || (page === 0 && slot !== null) ? pageXform(page, f) : pageXform(page, f);
  const lines = LINES.filter((l) => l.page === page && l.arrive <= f);
  return (
    <g
      transform={`translate(${t.x.toFixed(2)} ${t.y.toFixed(2)}) rotate(${t.rot.toFixed(
        2,
      )}) scale(${(t.s * scaleX).toFixed(4)} ${t.s.toFixed(4)})`}
    >
      {/* a page is OPAQUE. Outline-only, the pile's four pages let every line
          on every page show through every page above it, and the transcripts
          read as one orange scribble instead of four documents. The fill is one
          step below the field's own rendered value, so a page knocks out what
          is behind it and still sits in the same grey — filling with BG_BASE
          itself turned them into black cards. */}
      <path d={PAGE_D} fill={bg} />
      <g style={{ filter: icon }}>
        <path
          d={PAGE_D}
          fill="none"
          stroke={ink}
          strokeWidth={STROKE / t.s}
          strokeLinejoin="round"
          opacity={SPINE_OPACITY}
          pathLength={1}
          strokeDasharray={
            dashed ? `${0.018} ${0.018}` : draw < 1 ? `${draw} ${Math.max(1e-4, 1 - draw)}` : undefined
          }
        />
      </g>
      {blank
        ? null
        : lines.map((l) => {
            const i = LINES.indexOf(l);
            const u = writeU(i, f);
            const x0 = lineX0(l) + skullPad(l);
            const w = Math.max(LINE_H, l.len * u);
            return (
              <g key={`l${l.row}`}>
                {hasSkull(l) ? (
                  <SkullBullet
                    x={lineX0(l) + SKULL_BOX / 2}
                    y={lineY(l)}
                    accent={accent}
                    opacity={opacity * clamp01(u * 3)}
                  />
                ) : null}
                <rect
                  x={x0}
                  y={lineY(l) - LINE_H / 2}
                  width={w}
                  height={LINE_H}
                  rx={LINE_H / 2}
                  fill={accent}
                  opacity={opacity}
                />
              </g>
            );
          })}
    </g>
  );
};

const HidingTranscriptsV2: React.FC<Props> = ({
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
  dotOpacity,
}) => {
  const frame = useCurrentFrame();
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const camX = dampX(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  const toRipe = makeTone(accentDeep, accent);

  const c = cometAt(frame);
  const hd = cometHd(frame);
  const ring = ringState(frame);
  const nb = nextBead(frame);
  const nbL = LINES[nb];
  const thread = { a: c, b: targetOf(nbL, frame) };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={W0 + frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CAM.CX[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the transcripts: the three that were already there, and the one
                that joins them when the live page fills */}
            {[-3, -2, -1].map((p) => {
              const slot = p + 3;
              return (
                <Page
                  key={`p${p}`}
                  page={p}
                  slot={slot}
                  f={frame}
                  accent={accent}
                  ink={ink}
                  opacity={dotOpacity}
                  dashed={isBlank(slot, frame)}
                  blank={isBlank(slot, frame)}
                  scaleX={flipScaleX(slot, frame)}
                  draw={1}
                  icon={icon}
                  bg={PAGE_FILL}
                />
              );
            })}
            <Page
              page={0}
              slot={frame >= F_SLIDE[1] ? 3 : null}
              f={frame}
              accent={accent}
              ink={ink}
              opacity={dotOpacity}
              dashed={isBlank(3, frame)}
              blank={isBlank(3, frame)}
              scaleX={flipScaleX(3, frame)}
              draw={1}
              icon={icon}
              bg={PAGE_FILL}
            />
            {/* page 2 is never drawn: the beads aimed at it are still in the
                air when we cut away */}
            {freshU(frame) > 0 ? (
              <Page
                page={1}
                slot={null}
                f={frame}
                accent={accent}
                ink={ink}
                opacity={dotOpacity}
                dashed={false}
                blank={false}
                scaleX={1}
                draw={freshU(frame)}
                icon={icon}
                bg={PAGE_FILL}
              />
            ) : null}

            {/* the chain: the thread to the next thought, then the thoughts */}
            <path
              d={`M${thread.a.x} ${thread.a.y} ${(() => {
                const pts: string[] = [];
                for (let i = 1; i <= 20; i++) {
                  const q = bez(thread.a, thread.b, i / 20);
                  pts.push(`L${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
                }
                return pts.join(" ");
              })()}`}
              fill="none"
              stroke={accent}
              strokeWidth={STROKE / 2}
              strokeLinecap="round"
              opacity={dotOpacity}
            />
            {LINES.map((_l, i) =>
              inFlight(i, frame) ? (
                <circle
                  key={`b${i}`}
                  cx={beadAt(i, frame).x}
                  cy={beadAt(i, frame).y}
                  r={BEAD_R}
                  fill={accent}
                  opacity={dotOpacity}
                />
              ) : null,
            )}

            {/* the AI */}
            <path
              d={
                cometPath({
                  key: "ai",
                  x: c.x,
                  y: c.y,
                  r: COMET_R,
                  tone: 0,
                  hd,
                  s: 0,
                  vx: 0,
                  vy: 0,
                }) ?? ""
              }
              fill={toRipe(0)}
              opacity={dotOpacity}
            />

            {/* we read it */}
            <g style={{ filter: icon }}>
              <circle
                cx={ring.x}
                cy={ring.y}
                r={ring.r}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                opacity={SPINE_OPACITY}
              />
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HidingTranscriptsV2;

export const STATS = {
  duration: DURATION,
  rideLine: RIDE_I,
  arrivals: LINES.map((l) => Number(l.arrive.toFixed(1))),
  launches: LAUNCH.map((v) => Number(v.toFixed(1))),
  skullFrom: LINES.findIndex((l) => hasSkull(l)),
  flipAt: FLIP_AT.map((v) => (Number.isFinite(v) ? Math.round(v) : null)),
  k: [0, 20, 44, 60, 86, 120, 150, 165].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
};
