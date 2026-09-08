import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  OP_DARK,
  OP_READ,
  OP_READ_DOT,
  OP_RECEDE,
  OP_UNREAD,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  clamp,
  hash,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Ajeya: "...multiple secret message boards were started that contained tens of
// thousands of messages,"
// SRT `Ajeya_The_Hack_c10_p0.5.srt`. The composition starts on the onset of
// "multiple", t = 16.120s; speech ends at t = 20.140s.
//   round((20.140 - 16.120) * 24) = round(4.020 * 24) = round(96.5) = 96
// frames of speech, + 16 frame tail so the resolved state holds = 112.
export const DURATION = 112;

// Word onsets, at 24fps, measured from composition start: f = round((t-16.120)*24)
//     f0   "multiple secret"     f66  "tens of"
//     f19  "message boards"      f77  "thousands of"
//     f36  "were started"        f88  "messages"
//     f48  "that contained"      f96  speech ends
//
// Four seconds, seven word groups. Three gestures and a resolve, and each one
// is a word:
//   G1 the crowd opens AS the subject, whole, at read — nothing else is on
//      screen — and three regions of it fall from read to dark, staggered so
//      they read as three separate events and not one wipe. Read to dark is the
//      full height of the ladder, so "secret" is three parts of a bright field
//      going out. Nothing else happens.  — "multiple secret"          f0-18
//   G2 threads start inside the pockets: a line one agent posts to another
//      agent of the SAME board, drawn head-first with a white tip, then held.
//      Board one opens at f17, two frames ahead of its word and while the third
//      pocket is still darkening, so the piece never stalls between the two
//      gestures; boards two and three join at f22 and f26, and by f36 each of
//      the three carries a cluster of its own — about 19 / 8 / 4 threads, which
//      is what makes three regions countable while "were started" is on screen.
//      Endpoints brighten from the thread itself. Under it the surrounding
//      field recedes from read to UNREAD across f19-36 — not to receded: the
//      pockets sit at dark 0.16, and 0.45 over 0.16 is a step you can see at
//      this zoom where 0.30 over 0.16 dissolved and the threads read as
//      scattered across the whole crowd.
//                                  — "message boards were started" f19-48
//   G3 one escalation curve carries tempo, reach and persistence together. Its
//      FLOOR is lifted (0.07 at f19, 0.25 at f48) so the middle is never thin,
//      and its top is untouched, so f66-88 still adds ~210 threads in 22 frames
//      — the steepest stretch in the piece by a distance. Two things encode the
//      quantity: the RATE climbs, so posts land faster and faster; and the
//      threads stop fading and ACCUMULATE — from "contained" a completed thread
//      drops to the receded rung and stays, so each pocket fills with a mat of
//      held lines and is packed solid by f88. Newest brightest, the mat low.
//                              — "that contained tens of thousands of messages"
//                                                                    f48-96
//   Resolve f96-112: three packed boards roaring inside a field that is
//      otherwise still. Nothing moves but the boards' own traffic and the
//      crowd's breathing. No fade out.
//   There is NO OpenAI mark in this cut. It was tried twice: parked above the
//      crowd it read as a logo bug with nothing in front of it, and moved behind
//      the crowd — 520 square on the crowd's own centre, which is where it
//      belongs if it is there at all — it turned into a soft grey blob that
//      swallowed the third pocket during G1 and never resolved as the mark until
//      f88. G1 is the piece's first and most important gesture and the mark cost
//      it a whole board, so the mark goes. The neighbouring cut carries it.
//   The camera: ONE move. Opens inside the crowd at k 1.40 — the field bleeding
//      off all four edges — and pulls back to k 1.15 on keys f1-f8. It does NOT
//      pull back to the crowd's edges: this cut is about a population that hides
//      pockets, so the field runs past every edge at the hold too, and there is
//      no frame in the piece on which you can see where the crowd stops. That is
//      what makes it read as more of it than the frame can show rather than as a
//      rectangle of dots. The damped tracker adds about ten frames of settle to any
//      key ramp, so keys that ENDED at f14 would still be moving at f19 when the
//      first thread posts; f1-f8 lands it at f19 within a quarter of a percent
//      and dead still after. Then it holds: the traffic is the motion.
// Nothing else. There is no ring, no box, no spring and no bounce in this
// piece; stroke weight is 3 on every line without exception.
//
// ORANGE PASS — a grade, and nothing else. The accent is fieldShared's two-tone
// orange (ACCENT #FFB000 ripe, ACCENT_DEEP #D98A0C deep) instead of the old
// cyan, an agent dot is SOLID and carries its state as colour rather than as
// transparency, the background sits at BG_DIM 0.45 and the drop shadow at
// 2 / 7 / 0.12 — every one of them taken from fieldShared so a future re-grade
// propagates. The ladder is extended below ACCENT_DEEP for the dark rungs: see
// THE GRADE'S LOW END below. Not one beat, camera key, world coordinate, count,
// stroke weight or curve moved; only what a number means at the end of it.

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every accent line
  accentDeep: z.string(), // deep: an unread dot
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  vignette: z.number(),
  dotRadius: z.number(),
  postRate: z.number(), // posts per frame across all three boards at full escalation
  beats: z.object({
    multipleSecret: z.number(), // "multiple secret"
    messageBoards: z.number(), // "message boards"
    wereStarted: z.number(), // "were started"
    thatContained: z.number(), // "that contained"
    tensOf: z.number(), // "tens of"
    thousandsOf: z.number(), // "thousands of"
    messages: z.number(), // "messages"
    speechEnds: z.number(), // speech ends
  }),
});

export type Props = z.infer<typeof schema>;

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 3000;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// ---------------------------------------------------------------------------
// THE GRADE'S LOW END. Identical in all five cuts of this clip, and in nothing
// else: `fieldShared` is owned elsewhere and is only consumed here.
//
// fieldShared's ladder for an agent dot is ACCENT_DEEP -> ACCENT: a dot is
// SOLID and carries its state as COLOUR, because the accent over the grid at
// any opacity below 1 desaturates into the field and reads as a wash. Both of
// those tones are bright oranges, so that ladder as shipped can say "unread"
// but it cannot say "wiped" or "hidden" — and the darkenings are the strongest
// images in these five cuts (three dark pockets in a lit field; an ink front
// dropping a whole crowd as it passes; nodes receding out of the subject).
//
// So the ladder is extended DOWNWARD by one more tone: ACCENT_SHADE, the deep
// tone carried SHADE_MIX of the way to BG_BASE. Same hue, one shade further
// down, and — the point — darker than the grid itself, so a dark agent is a
// HOLE in the field rather than a faded copy of it. Measured as relative luma
// over the grid at BG_DIM 0.45 (field #727272, 114 of 255):
//     ACCENT       180   lit        ACCENT_SHADE           77   dark, solid
//     ACCENT_DEEP  146   unread     ACCENT at OP_DARK     124   dark, by alpha
// The cyan pass over its darker field (0.32, field 82) had read -> dark = 79
// and unread -> dark = 41. Solid ACCENT_SHADE gives 103 and 69. Keeping
// OPACITY for the dark rungs would have given 49 and 21 — under a third of the
// old gesture — which is what the 32-point brighter field costs, and why the
// low end had to become colour rather than alpha.
//
// `rung(op)` maps the OLD opacity ladder onto that colour ladder, so every
// interpolation, curve, stagger and beat in this file is untouched: only what
// the number MEANS at the end of it has changed. The anchors are fieldShared's
// own rungs — OP_DARK -> ACCENT_SHADE, OP_UNREAD -> ACCENT_DEEP, OP_RECEDE
// between those two, and OP_READ + 0.1 -> ACCENT ("the subject; +0.1 when a
// thread is on it"), which leaves OP_READ itself just under ripe so a thread
// landing on a dot still has somewhere to go. The dot is then drawn at
// OP_UNREAD_DOT / OP_READ_DOT, which are 1: solid, whatever it knows. An
// ARRIVAL fade stays an opacity — a dot fading in is not a dot in a state.
//
// LINES are untouched and stay on fieldShared's own rule: a thread, a probe, a
// ring, a mesh edge, a box wall is ripe ACCENT at its own line opacity. Only
// dots take the colour ladder.
// ---------------------------------------------------------------------------
const SHADE_MIX = 0.62; // how far ACCENT_DEEP is carried toward BG_BASE
const OP_LIT = OP_READ + 0.1; // the top of the ladder: a dot with a thread on it
const OP_DOT = Math.max(OP_UNREAD_DOT, OP_READ_DOT); // fieldShared holds both dot
// rungs at 1 — a dot is opaque whatever it knows, and the state is in the tone.
// Taken off both rather than assumed, so a future re-grade that parts them shows
// up here rather than silently on one rung.
const hexMix = (a: string, b: string, t: number) => {
  const A = parseInt(a.replace("#", ""), 16);
  const B = parseInt(b.replace("#", ""), 16);
  const ch = (sh: number) =>
    Math.round(((A >> sh) & 255) + ((((B >> sh) & 255) - ((A >> sh) & 255)) * t))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
// Built once per render: a field is thousands of dots and every one of them
// asks for its colour every frame. `makeTone` quantises each half to 64 steps.
const makeRung = (deep: string, ripe: string, base: string) => {
  const hi = makeTone(deep, ripe);
  const lo = makeTone(hexMix(deep, base, SHADE_MIX), deep);
  return (op: number) =>
    op >= OP_UNREAD
      ? hi((op - OP_UNREAD) / (OP_LIT - OP_UNREAD))
      : lo((op - OP_DARK) / (OP_UNREAD - OP_DARK));
};

// ---------------------------------------------------------------------------
// The field. Same construction as the previous cut — the SAME step, the same
// jitter, the same salts — grown outwards about the same centre (2002) so the
// boards keep their place in it. Keeping the step is what makes it the same
// crowd and not a different one; only the count changes.
//
// It is 50x136 rather than 48x88 because the field has to FILL THE FRAME on
// every frame of the piece — no edge on any side, ever. 48x88 did not: it ran
// off the sides, but at the hold its bottom row landed on screen y 1625 and its
// top row on y 93, so a hard horizontal edge with bare grid under it sat in the
// lower fifth of the frame for three quarters of the cut. A crowd that ends on
// a ruled line reads as a rectangle of dots someone drew, which is the opposite
// of a population you are standing inside.
//
// The count is DERIVED, not guessed. The camera below was run frame by frame
// with the damper and `sway` included and the union of every visible world
// rectangle taken: x 67..1013, y 1244..2924 — the widest frames being the hold
// (k 1.150, the piece's minimum) rather than the open. The rule is 80 world px
// of overrun past every edge on every frame, so the field must reach x -13..1093
// and y 1164..3004. 50 x 136 seats on the same step, centred on (540, 2002),
// give a nominal lattice of x -51..1131 and y 978..3026, and even where a seat
// is jittered the full 45% of a step INWARD the field still reaches x -40..1120
// and y 985..3019. Measured over all 112 frames the closest the field's edge
// ever comes to a frame edge is 95 world px, at f28 under the bottom; the sides
// clear by 107 and the top by 259. So there is no field edge on any side or in
// any corner on any frame.
//   open k 1.400  sees x 154..926, y 1378..2750 — margins 194 / 194 / 393 / 269
//   hold k 1.150  sees x  67..1013, y 1254..2924 — margins 107 / 107 / 269 / 95
// 6,800 seats against 4,224. (The svg overflows its box — the box is only the
// transform anchor — but nothing outside it is ever in frame: the visible world
// rectangle stays inside 0..1080 x 0..3000 the whole way through.)
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39; // 24.10 — the field's step, identical across cuts
const STEP_Y = 440 / 29; // 15.17
const COLS = 50;
const ROWS = 136;
const N = COLS * ROWS;
// Centred on (540, 2002), the same centre the 48x88 field had, so the boards
// keep their world positions and the camera derivation below is untouched.
const CROWD = { cx: 540, top: 2002 - ((ROWS - 1) * STEP_Y) / 2 }; // rows 978..3026
const CROWD_POS = Array.from({ length: N }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {
    x: CROWD.cx + (c - (COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9,
    y: CROWD.top + r * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9,
    r: 0.75 + 0.5 * hash(i, 13),
  };
});

// ---------------------------------------------------------------------------
// The three boards. They are REGIONS of the crowd, not objects added to it:
// nothing is drawn round them, and what makes one a board is that its agents
// are on a different rung and its interior carries traffic. An agent belongs to
// a board if it falls inside that region.
//
// Three, so "multiple" is countable at a glance. Their areas run 3.3 : 1.7 : 1
// and each is a different shape at a different angle, placed off any row or
// rhythm — a big flat one high on the left, a rounder middle one on the right,
// a small upright one low and between them, so the three sit on a triangle and
// never on a row. In the deeper field all three clear the crowd's own edges by
// 210 world px or more, so each one is surrounded on every side by population
// and no camera position can put a board and a field edge in the same frame; at
// the hold they sit on screen y 425..1123 of 1920, well above the burned-in
// captions.
// ---------------------------------------------------------------------------
type Board = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number; // degrees
  start: number; // the frame its first thread posts
  dark: [number, number]; // the frames its agents fall from read to dark
};
// The big board opens at f17 and the small one is still going dark until f18,
// so the darkening and the first post overlap and there is no static gap
// between G1 and G2. Two and three follow at f22 and f26 — still staggered, so
// they read as three separate openings, but early enough that the small board
// has ten frames of its own traffic before "were started".
const BOARDS: Board[] = [
  { cx: 368, cy: 1740, rx: 180, ry: 118, rot: -12, start: 17, dark: [0, 11] },
  { cx: 796, cy: 1848, rx: 116, ry: 94, rot: 18, start: 22, dark: [3, 15] },
  { cx: 600, cy: 2140, rx: 74, ry: 88, rot: -25, start: 26, dark: [6, 18] },
];
const inBoard = (b: Board, p: P) => {
  const a = (b.rot * Math.PI) / 180;
  const dx = p.x - b.cx;
  const dy = p.y - b.cy;
  const u = dx * Math.cos(a) + dy * Math.sin(a);
  const v = -dx * Math.sin(a) + dy * Math.cos(a);
  return (u / b.rx) ** 2 + (v / b.ry) ** 2 <= 1;
};
const BOARD_OF = CROWD_POS.map((p) => BOARDS.findIndex((b) => inBoard(b, p)));
const BOARD_MEMBERS = BOARDS.map((_, bi) =>
  BOARD_OF.reduce<number[]>((acc, v, i) => {
    if (v === bi) acc.push(i);
    return acc;
  }, []),
);
// How the traffic is shared out: by area, so the big board is the loud one.
const BOARD_W = (() => {
  const a = BOARDS.map((b) => Math.PI * b.rx * b.ry);
  const t = a.reduce((x, y) => x + y, 0);
  return a.map((v) => v / t);
})();

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
  vignette: 0.45,
  dotRadius: DOT_RADIUS,
  postRate: 16,
  beats: {
    multipleSecret: 0,
    messageBoards: 19,
    wereStarted: 36,
    thatContained: 48,
    tensOf: 66,
    thousandsOf: 77,
    messages: 88,
    speechEnds: 96,
  },
});

// ---------------------------------------------------------------------------
// The escalation curve. One curve; tempo, reach and persistence all come off
// it, so retiming the beats retimes all three together. It is shaped so the
// slope across "tens of" -> "messages" is the steepest thing in the piece.
// ---------------------------------------------------------------------------
// Sampled on the six word onsets f19, f36, f48, f66, f77, f88 — the beats prop
// supplies the frames, this supplies the shape.
//
// The floor is lifted against the previous pass ([0.01, 0.035, 0.1, ...]) so the
// middle is never thin: three boards cannot read as three busy regions on a
// dozen threads between them. The TOP is untouched at 1 and the slope from
// "tens of" on is unchanged in absolute terms — f66 -> f88 still adds ~210
// threads, more than everything before it put together — so the surge still
// escalates, now from something already lively rather than from nearly nothing.
const ESC_V = [0.07, 0.15, 0.25, 0.45, 0.73, 1];
// Where the mat starts: the value the curve has at "that contained", so the
// accumulation onset is tied to the word and moves with the beat, not to a
// constant left over from an older floor.
const ESC_PERSIST = 0.25;

// A post's two endpoints depend only on which board it is and how many posts
// that board had already made — both of which come off the count, never off a
// clock — so they can be resolved once and kept.
const PAIR_CACHE = new Map<number, { a: number; c: number }>();
const pickPair = (bi: number, n: number, reach: number) => {
  const key = bi * 100000 + n;
  const hit = PAIR_CACHE.get(key);
  if (hit) return hit;
  const mem = BOARD_MEMBERS[bi];
  const s = n * 7 + bi * 313;
  const a = mem[Math.floor(hash(s, 31) * mem.length) % mem.length];
  const A = CROWD_POS[a];
  const th = hash(s, 32) * Math.PI * 2;
  const d = reach * (0.45 + 0.55 * hash(s, 33));
  const tx = A.x + d * Math.cos(th);
  const ty = A.y + d * Math.sin(th);
  let c = a;
  let best = Infinity;
  for (const j of mem) {
    if (j === a) continue;
    const dd = (CROWD_POS[j].x - tx) ** 2 + (CROWD_POS[j].y - ty) ** 2;
    if (dd < best) {
      best = dd;
      c = j;
    }
  }
  const out = { a, c };
  PAIR_CACHE.set(key, out);
  return out;
};

// The camera: one damped pull-back, then dead still. cx never moves — the whole
// piece is on world x 540. Derived off the content centre 1975 (between the
// crowd's own centre 2002 and the three boards' centroid 1909) with the house
// rule cy = contentCentre + 125/k, which lands that centre on screen y 835:
//   open   k 1.40 -> cy 2064: the field bleeding off all four edges — 194 world
//          px past each side, 393 above and 269 below — with all three pockets
//          inside the frame so "multiple" is countable from f0.
//   hold   k 1.15 -> cy 2084: the widest the piece ever goes, and the field
//          still runs 107 world px past each side, 269 past the top and 95 past
//          the bottom, so it fills the frame here too. The 60px side-margin rule
//          does not apply here — a crowd that carries hidden pockets should read
//          as bigger than the frame, so it bleeds on every side rather than
//          resolving to its own edges. The lowest board's underside sits on
//          screen 1123, clear of the burned-in captions.
const CAM_F = [0, 1, 8, DURATION];
const CAM_CY = [2064, 2064, 2084, 2084];
const CAM_K = [1.4, 1.4, 1.15, 1.15];

const DRAW = 6; // frames a post takes to draw

const SecretMessageBoards: React.FC<Props> = ({
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
  vignette,
  dotRadius,
  postRate,
  beats,
}) => {
  const frame = useCurrentFrame();
  // The ladder, as a colour: OP_DARK -> ACCENT_SHADE, OP_UNREAD -> ACCENT_DEEP,
  // OP_READ + 0.1 -> ACCENT. Built once per frame, read per dot.
  const rung = makeRung(accentDeep, accent, backgroundBase);

  // -- the one escalation curve ----------------------------------------------
  const escAt = (f: number) =>
    interpolate(
      f,
      [
        beats.messageBoards,
        beats.wereStarted,
        beats.thatContained,
        beats.tensOf,
        beats.thousandsOf,
        beats.messages,
      ],
      ESC_V,
      clamp,
    );
  // Whether a finished post stays. It comes off the escalation itself, so
  // "contained" is the moment threads start to pile up rather than clear.
  const persistAt = (f: number) => smooth((escAt(f) - ESC_PERSIST) / 0.3);
  // Reach rides the same curve, scaled to each board so the small one never
  // posts across its own width.
  const reachAt = (bi: number, f: number) =>
    (0.28 + 0.22 * escAt(f)) * (BOARDS[bi].rx + BOARDS[bi].ry);

  // -- G1: the three regions go dark ----------------------------------------
  // The crowd opens at READ, because at f0 it is the only thing on screen and
  // so it is the subject. The pockets fall the whole height of the ladder,
  // read -> dark, which is what makes "secret" visible at this zoom.
  const boardDark = BOARDS.map((b) =>
    interpolate(frame, b.dark, [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }),
  );
  // ...and then the field around them stops being the subject, because the
  // boards are: read -> UNREAD, across "message boards were started". It stops
  // one rung short of receded on purpose. The pockets are at dark 0.16, and the
  // whole point of the cut is that you can see three of them the entire time the
  // messages are arriving: 0.45 over 0.16 is a step that survives the vignette
  // at this zoom, 0.30 over 0.16 is not.
  const fieldRecede = interpolate(frame, [beats.messageBoards, beats.wereStarted], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  // -- G2/G3: the posts ------------------------------------------------------
  // A board's post count is the running integral of its own rate, and a post is
  // born on the frame that count crosses the next whole number. Its whole life
  // — how long it holds, how fast it drops, and whether it stays at all — is
  // fixed by the escalation at the moment it was made. Nothing here is on a
  // parallel clock, so retiming a beat retimes every thread with it.
  type Post = {
    key: number;
    a: number;
    c: number;
    drawn: number;
    op: number;
    lit: number;
  };
  const posts: Post[] = [];
  const lit = new Float32Array(N);
  BOARDS.forEach((b, bi) => {
    let acc = 0;
    let n = 0;
    for (let f = 1; f <= frame; f++) {
      if (f < b.start) continue;
      if (f === b.start) acc += 1; // the board opens on its word
      acc += postRate * BOARD_W[bi] * escAt(f);
      while (acc >= n + 1) {
        n += 1;
        const e = escAt(f);
        const floor = OP_RECEDE * persistAt(f);
        const hold = 10 - 8 * e;
        const decay = 16 - 8 * e;
        const age = frame - f;
        const drawn = interpolate(age, [0, DRAW], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        const t = age - DRAW;
        const fall = t <= hold ? 0 : smooth((t - hold) / decay);
        const op = OP_READ + (floor - OP_READ) * fall;
        if (op <= 0.02) continue;
        const { a, c } = pickPair(bi, n, reachAt(bi, f));
        // Alive threads own their endpoints; a thread that has settled into the
        // mat leaves only a trace of light on them, so a board's untouched
        // ground stays dark under the traffic.
        const norm = clamp01((op - floor) / Math.max(0.001, OP_READ - floor));
        const l = norm + 0.15 * (floor / OP_RECEDE) * (1 - norm);
        lit[a] = Math.max(lit[a], l);
        lit[c] = Math.max(lit[c], l * drawn);
        posts.push({ key: bi * 100000 + n, a, c, drawn, op, lit: l });
      }
    }
  });
  // Oldest and lowest first, so the newest posts sit on top of the mat.
  posts.sort((x, y) => x.op - y.op);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = 540 + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

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
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
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
            {/* the boards' traffic: every thread runs between two agents of the
                same board, so nothing ever crosses from one to another */}
            {posts.map((p) => {
              const A = CROWD_POS[p.a];
              const C = CROWD_POS[p.c];
              const x2 = A.x + (C.x - A.x) * p.drawn;
              const y2 = A.y + (C.y - A.y) * p.drawn;
              return (
                <g key={p.key}>
                  <line
                    x1={A.x}
                    y1={A.y}
                    x2={x2}
                    y2={y2}
                    stroke={accent}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={p.op}
                  />
                  {p.drawn < 1 ? <circle cx={x2} cy={y2} r={4} fill={ink} /> : null}
                </g>
              );
            })}

            {/* the agents. They all start at read; outside the boards they
                recede once the boards take over, and inside one they fall to
                dark and come back up only where a thread has landed. The rung
                is the same number it always was — it is now a colour on a solid
                dot rather than an alpha, so a pocket is a hole in a lit field
                and not a wash of it. */}
            {CROWD_POS.map((p, i) => {
              const bi = BOARD_OF[i];
              const base =
                bi < 0
                  ? OP_READ + (OP_UNREAD - OP_READ) * fieldRecede
                  : OP_READ + (OP_DARK - OP_READ) * boardDark[bi];
              const l = lit[i];
              const bre = breath(frame, hash(i, 9));
              const r = dotRadius * p.r * bre * (1 + 0.35 * l);
              const op = base + (OP_LIT - base) * l;
              return <circle key={i} cx={p.x} cy={p.y} r={r} fill={rung(op)} opacity={OP_DOT} />;
            })}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={vignette} />
    </AbsoluteFill>
  );
};

export default SecretMessageBoards;
