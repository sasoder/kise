import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
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
  OP_UNREAD,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  clamp,
  clamp01,
  hash,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Ajeya: "And through this whole process, humans did not more or less understand
// the coordination that was happening between these agents and the
// intentionality behind these attacks."
// SRT `Ajeya_The_Hack_c10_p0.5.srt`. The composition starts on the onset of
// "and", t = 28.059s; speech ends at t = 36.539s.
//   round((36.539 - 28.059) * 24) = round(8.480 * 24) = round(203.5) = 204
// frames of speech, + 16 frame tail so the resolved state holds = 220.
export const DURATION = 220;

// Word onsets, at 24fps, measured from composition start: f = round((t-28.059)*24)
//     f0    "and through"        f108  "that was"
//     f7    "this whole"         f120  "happening"
//     f18   "process"            f126  "between these"
//     f31   "humans did"         f136  "agents and the"
//     f51   "not more"           f152  "intentionality"
//     f65   "or less"            f168  "behind these"
//     f75   "understand the"     f190  "attacks"
//     f99   "coordination"       f204  speech ends
//
// Five gestures, and each one is a word:
//   G1 the field and its coordination threads, already running at a steady rate
//      — established and busy at frame 0, nothing arriving, nothing announced.
//      The one move: open inside the crowd at k 1.40 and one damped pull-back to
//      k 1.15 on keys f2-f13, dead still from f25.
//                              — "and through this whole process"      f0-31
//   G2 three ink person glyphs fade up, low and centred, staggered f31/f36/f41.
//      They are the only ink in the piece. Nothing else changes, and they never
//      move again.                                    — "humans did"   f31-51
//   G3 a white reading band, stroke 3, sweeps upward from just above the humans
//      (world 2050) to above the top of the field (1225) across f55-92, and its
//      wake is bare: a thread dies as the band crosses its centre, so behind the
//      band the field is unconnected dots. That is what the humans got. Threads
//      keep being born below the band — below the humans, at 0.55 of the rate —
//      so the bottom of the frame is never still while the top empties. The band
//      fades in f51-55 at rest and out f92-99.
//                     — "did not more or less understand the"          f51-99
//      NOTE for the director: the brief's two sentences ("where it passes, the
//      threads vanish" / "every thread above the band is gone") point opposite
//      ways for a band that starts low and rises. This is built on the first —
//      the wake, which for an upward sweep is BELOW the band, is what is stripped
//      — because that is the only reading in which the sweep does work on screen
//      and in which the field is empty when it is over.
//   G4 the threads come back and come back harder: the rate climbs from f99 and
//      from f99 a finished thread stops fading and holds, so the field builds a
//      legible web by ~f145 instead of clearing itself. Persistence is full by
//      f120, so the web's oldest lines are its brightest.
//        — "the coordination that was happening between these agents"  f99-152
//   G5 the web resolves into a purpose. Every thread swings about its own anchor
//      until it points at one convergence point among the agents (world 540,
//      1865 — above and behind the humans), each on its own arc: its swing opens
//      somewhere in f152-166 and takes 14-23 frames, so no two travel together
//      and all of them have landed by f190. A thread whose reach is longer than
//      its distance to the focus ends ON the focus, so the middle of the web is a
//      star and the rest of the field is spokes aimed into it.
//                       — "the intentionality behind these attacks"   f152-204
//   Resolve f204-220: the converged web, the three ink humans below it, and
//      nothing moving but the field's breathing and the residual traffic.
// Nothing else. No spring, no flash, no ripple, no rim, no pulse; stroke weight
// is 3 on every line without exception, and there is no text.
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
  markSrc: z.string(), // the OpenAI mark, white on alpha
  markSize: z.number(), // world px, square
  markOpacity: z.number(), // how far the mark sits back
  markBlur: z.number(), // world px of blur, so it reads as depth not as a layer
  humanSrc: z.string(),
  humanSize: z.number(), // world px, square box; the figure fills ~84% of it
  rateScale: z.number(), // one dial over the whole thread tempo
  beats: z.object({
    andThrough: z.number(), // "and through"
    thisWhole: z.number(), // "this whole"
    process: z.number(), // "process"
    humansDid: z.number(), // "humans did"
    notMore: z.number(), // "not more"
    orLess: z.number(), // "or less"
    understandThe: z.number(), // "understand the"
    coordination: z.number(), // "coordination"
    thatWas: z.number(), // "that was"
    happening: z.number(), // "happening"
    betweenThese: z.number(), // "between these"
    agentsAndThe: z.number(), // "agents and the"
    intentionality: z.number(), // "intentionality"
    behindThese: z.number(), // "behind these"
    attacks: z.number(), // "attacks"
    speechEnds: z.number(), // speech ends
  }),
});

export type Props = z.infer<typeof schema>;

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 3000;

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
// The field. Copied from `SecretMessageBoards` unchanged — the same step, the
// same counts, the same salts, the same jitter and radius law, about the same
// centre — because these are cuts of one clip and it has to be the same crowd.
//
// The bleed is verified numerically, not assumed. The camera below was run frame
// by frame with the damper and `sway` included and the union of every visible
// world rectangle taken over all 220 frames: x 67.4..1012.6, y 1244.2..2924.0,
// the widest frames being the k 1.15 hold rather than the k 1.40 open. Against
// the field's GUARANTEED extent — every seat jittered the full 45% of a step
// inward, x -39.7..1119.7, y 984.7..3019.3 — the closest the field's edge ever
// comes to a frame edge is:
//     left   107.1 world px  @ f108      top     259.5 world px  @ f209
//     right  107.1 world px  @ f34       bottom   95.3 world px  @ f30
// so on every frame of the piece the field runs past all four edges and there is
// no boundary anywhere in frame, in any corner, at any camera state.
//     open k 1.400 cy 2064 sees x 154.5..925.7, y 1378.3..2749.7
//     hold k 1.150 cy 2084 sees x  67.4..1012.6, y 1244.2..2924.0
// (The svg overflows its 1080x3000 box — the box is only the transform anchor —
// but nothing outside it is ever in frame.)
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39; // 24.10 — the field's step, identical across cuts
const STEP_Y = 440 / 29; // 15.17
const COLS = 50;
const ROWS = 136;
const N = COLS * ROWS;
const CROWD = { cx: 540, top: 2002 - ((ROWS - 1) * STEP_Y) / 2 }; // rows 978..3026
const COL0 = CROWD.cx - ((COLS - 1) / 2) * STEP_X;
const CROWD_POS = Array.from({ length: N }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {
    x: COL0 + c * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9,
    y: CROWD.top + r * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9,
    r: 0.75 + 0.5 * hash(i, 13),
  };
});

// The three humans. In a row, low and centred, over the field: at the hold their
// centres sit on screen y 1019 and their boxes run 941..1097 of 1920, inside the
// caption-safe band and clear of the burned-in captions. 175 world px apart, so
// at k 1.15 there are 59 screen px of field between one box and the next and they
// count as three at a glance. They arrive and then they are furniture.
const HUMAN_Y = 2135;
const HUMANS: { x: number; in: number }[] = [
  { x: 365, in: 31 },
  { x: 540, in: 36 },
  { x: 715, in: 41 },
];
const HUMAN_FADE = 9;

// Where the web ends up pointing. Among the agents, 270 world px above the
// humans and behind them — screen y 708 at the hold, on the frame's centre line
// and inside the caption-safe band.
const FOCUS: P = { x: 540, y: 1865 };

// The reading band. Starts 26 world px above the humans' boxes (which top out
// at 2076, screen 941) and ends above the visible top of the field at the hold
// (1244), so it leaves the frame rather than stopping inside it.
const BAND_Y0 = 2050;
const BAND_Y1 = 1225;
const BAND_SOFT = 22; // world px the band takes to take a thread out
// Below this line the band never reads, and traffic continues through G3 at
// LOW_RATE of the going rate. It is below the humans, so the field they are
// standing in front of is bare and the talking is happening past them.
const LOW_LINE = 2210;
const LOW_RATE = 0.55;

// The mark. Static, drawn before the svg, so everything in the piece is in front
// of it. 520 square centred at (540, 1720) runs x 280..800 and y 1460..1980. The
// intersection of every visible world rectangle over all 220 frames is
// x 154.5..925.7, y 1378.8..2749.7, so the mark clears every frame edge on every
// frame by 125 world px at the sides and 81/770 top and bottom: it is never
// half-cropped, and it sits behind the crowd, behind the convergence and above
// the humans.
const MARK: P = { x: 540, y: 1720 };

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
  markSrc: "openai-chatgpt-logo.png",
  markSize: 520,
  markOpacity: 0.3,
  markBlur: 7,
  humanSrc: "person.png",
  humanSize: 118,
  rateScale: 1,
  beats: {
    andThrough: 0,
    thisWhole: 7,
    process: 18,
    humansDid: 31,
    notMore: 51,
    orLess: 65,
    understandThe: 75,
    coordination: 99,
    thatWas: 108,
    happening: 120,
    betweenThese: 126,
    agentsAndThe: 136,
    intentionality: 152,
    behindThese: 168,
    attacks: 190,
    speechEnds: 204,
  },
});

// ---------------------------------------------------------------------------
// The tempo. Threads per frame, sampled on the words, so retiming a beat retimes
// the traffic with it. It is flat and busy under G1, dips while the band is
// emptying the field, climbs hard from "coordination" to "agents and the" — the
// steepest stretch in the piece, and the one the viewer is meant to read as more
// than they can follow — then eases back once the web is built and the swing is
// what carries the frame. PRE is a pre-roll: the accumulator starts 60 frames
// before the composition so the field is at its steady state at frame 0 rather
// than filling up on camera.
// ---------------------------------------------------------------------------
const PRE = -60;
const RATE_V = [3.5, 3.5, 3.5, 3.2, 3.5, 7.0, 9.5, 5.5, 1.4, 0.9, 0.9];

const DRAW = 6; // frames a thread takes to draw
const REACH_MIN = 70; // world px — just under three columns
const REACH_MAX = 165;

// A thread's two endpoints depend only on its serial number, so they resolve
// once and are kept. The far end is the seat nearest a point thrown out of the
// anchor at `d` in a random direction: under a jitter of at most 0.45 of a step
// the seat whose cell contains that point IS the nearest one, so the lattice
// index is the answer and there is nothing to search.
const PAIR_CACHE = new Map<number, { a: number; c: number }>();
const pickPair = (n: number) => {
  const hit = PAIR_CACHE.get(n);
  if (hit) return hit;
  const s = n * 7 + 1013;
  const a = Math.floor(hash(s, 31) * N) % N;
  const A = CROWD_POS[a];
  const th = hash(s, 32) * Math.PI * 2;
  const d = REACH_MIN + (REACH_MAX - REACH_MIN) * hash(s, 33);
  const tx = A.x + d * Math.cos(th);
  const ty = A.y + d * Math.sin(th);
  let cc = Math.round((tx - COL0) / STEP_X);
  let cr = Math.round((ty - CROWD.top) / STEP_Y);
  cc = Math.max(0, Math.min(COLS - 1, cc));
  cr = Math.max(0, Math.min(ROWS - 1, cr));
  let c = cr * COLS + cc;
  if (c === a) c = cc + 1 < COLS ? c + 1 : c - 1;
  const out = { a, c };
  PAIR_CACHE.set(n, out);
  return out;
};

// The camera: one damped pull-back, then dead still. cx never moves — the whole
// piece is on world x 540. Derived off the content centre 1975 (the crowd's own
// 2002, pulled up toward the focus at 1865) with the house rule
// cy = contentCentre + 125/k, which lands that centre on screen y 835:
//   open k 1.40 -> cy 2064, inside the crowd, field bleeding off all four edges
//   hold k 1.15 -> cy 2084, the widest the piece goes, and still no field edge
// Keys f2-f13 rather than f1-f8: the damper adds about ten frames of settle, so
// this lands within 0.06% of the hold by f25 and is dead still from f28 — well
// before the humans arrive at f31, which is the first thing that must land on a
// still frame.
const CAM_F = [0, 2, 13, DURATION];
const CAM_CY = [2064, 2064, 2084, 2084];
const CAM_K = [1.4, 1.4, 1.15, 1.15];

const HumansDidNotUnderstand: React.FC<Props> = ({
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
  markSrc,
  markSize,
  markOpacity,
  markBlur,
  humanSrc,
  humanSize,
  rateScale,
  beats,
}) => {
  const frame = useCurrentFrame();
  // The ladder, as a colour: OP_DARK -> ACCENT_SHADE, OP_UNREAD -> ACCENT_DEEP,
  // OP_READ + 0.1 -> ACCENT. Built once per frame, read per dot.
  const rung = makeRung(accentDeep, accent, backgroundBase);

  const RATE_F = [
    PRE,
    beats.andThrough,
    beats.notMore,
    beats.understandThe,
    beats.coordination,
    beats.happening,
    beats.agentsAndThe,
    beats.intentionality,
    beats.attacks,
    beats.speechEnds,
    DURATION,
  ];
  const rateAt = (f: number) => interpolate(f, RATE_F, RATE_V, clamp) * rateScale;
  // Whether a finished thread stays. Zero until "coordination", full by
  // "happening": from there the field accumulates instead of clearing, which is
  // the whole of G4 in one number.
  const persistAt = (f: number) =>
    interpolate(f, [beats.coordination, beats.happening], [0, 1], clamp);

  // -- G3: the band ----------------------------------------------------------
  const bandStart = beats.notMore + 4; // 55
  const bandEnd = beats.coordination - 7; // 92
  const bandY = interpolate(frame, [bandStart, bandEnd], [BAND_Y0, BAND_Y1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const bandOp =
    frame < bandStart
      ? interpolate(frame, [beats.notMore, bandStart], [0, 1], clamp)
      : interpolate(frame, [bandEnd, beats.coordination], [1, 0], clamp);
  // What the band leaves behind. Derived from the band's own y against the
  // thread's, never from a clock: 1 where the band has not been, 0 in its wake,
  // and it only ever applies between the line it started on and wherever it has
  // got to. Threads born after the sweep is over are not its business — that is
  // G4 coming back.
  const bandSurvival = (yc: number, birth: number) => {
    if (birth >= bandEnd) return 1;
    if (yc > BAND_Y0) return 1; // below the line the band started on
    return 1 - smoothstep((yc - bandY) / BAND_SOFT);
  };
  // Where a new thread is allowed to be born while the band is reading.
  const birthAllowed = (yc: number, f: number) => {
    if (f < bandStart || f >= beats.coordination) return 1;
    if (yc > LOW_LINE) return LOW_RATE; // below the humans, out of their reading
    if (yc > BAND_Y0) return 0; // the strip the humans are standing in
    return yc < bandY ? 1 : 0; // above the band: not read yet
  };

  // -- the threads -----------------------------------------------------------
  // A thread is born on the frame the running integral of the rate crosses the
  // next whole number, and its whole life — draw, hold, fall, and whether it
  // stays at all — is fixed by the tempo at the moment it was made. Nothing is
  // on a parallel clock.
  type Thread = {
    key: number;
    a: number;
    c: number;
    drawn: number;
    op: number;
    lit: number;
    sw: number;
  };
  const threads: Thread[] = [];
  const lit = new Float32Array(N);
  let acc = 0;
  let n = 0;
  for (let f = PRE; f <= frame; f++) {
    acc += rateAt(f);
    while (acc >= n + 1) {
      n += 1;
      const key = n;
      const { a, c } = pickPair(key);
      const A = CROWD_POS[a];
      const C = CROWD_POS[c];
      const yc = (A.y + C.y) / 2;
      if (hash(key, 44) >= birthAllowed(yc, f)) continue;
      const floor = OP_READ * persistAt(f);
      const age = frame - f;
      const drawn = interpolate(age, [0, DRAW], [0, 1], {
        ...clamp,
        easing: Easing.out(Easing.cubic),
      });
      const t = age - DRAW;
      const hold = 8 + 8 * hash(key, 41);
      const decay = 14 + 10 * hash(key, 42);
      const fall = t <= hold ? 0 : smoothstep((t - hold) / decay);
      let op = (OP_READ + (floor - OP_READ) * fall) * bandSurvival(yc, f);
      if (op <= 0.02) continue;
      // the swing. Each thread on its own arc: opens somewhere in the sixteen
      // frames after "intentionality" and takes 14-23 to land, so all of them
      // are home by "attacks" and none of them travel together. A thread born
      // after the word is born already aimed.
      const s0 = beats.intentionality + 14 * hash(key, 51);
      const s1 = s0 + 14 + 9 * hash(key, 52);
      const sw =
        f >= beats.intentionality
          ? 1
          : interpolate(frame, [s0, s1], [0, 1], {
              ...clamp,
              easing: Easing.inOut(Easing.cubic),
            });
      const norm = clamp01((op - floor) / Math.max(0.001, OP_READ - floor));
      const l = norm + 0.2 * (1 - norm) * (floor > 0.02 ? 1 : 0);
      lit[a] = Math.max(lit[a], l);
      lit[c] = Math.max(lit[c], l * drawn);
      threads.push({ key, a, c, drawn, op, lit: l, sw });
    }
  }
  // Dimmest first, so the newest lines sit on top of the web.
  threads.sort((x, y) => x.op - y.op);

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
          {/* whose agents these are. Static, behind everything, never animated. */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: MARK.y - markSize / 2,
              width: markSize,
              height: markSize,
              filter: `brightness(0) invert(1) blur(${markBlur}px)`,
              opacity: markOpacity,
            }}
          />

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the coordination. Every line runs from one agent to another; from
                "intentionality" each one swings about its own anchor until it is
                aimed at the focus, keeping its length unless the focus is nearer
                than that, in which case it ends on it. */}
            {threads.map((p) => {
              const A = CROWD_POS[p.a];
              const C = CROWD_POS[p.c];
              const th0 = Math.atan2(C.y - A.y, C.x - A.x);
              const l0 = Math.hypot(C.x - A.x, C.y - A.y);
              let th = th0;
              let l = l0;
              if (p.sw > 0) {
                const dfx = FOCUS.x - A.x;
                const dfy = FOCUS.y - A.y;
                const thF = Math.atan2(dfy, dfx);
                let d = thF - th0;
                while (d > Math.PI) d -= Math.PI * 2;
                while (d < -Math.PI) d += Math.PI * 2;
                const lF = Math.max(26, Math.min(l0, Math.hypot(dfx, dfy)));
                th = th0 + d * p.sw;
                l = l0 + (lF - l0) * p.sw;
              }
              const ex = A.x + l * Math.cos(th) * p.drawn;
              const ey = A.y + l * Math.sin(th) * p.drawn;
              return (
                <g key={p.key}>
                  <line
                    x1={A.x}
                    y1={A.y}
                    x2={ex}
                    y2={ey}
                    stroke={accent}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={p.op}
                  />
                  {p.drawn < 1 ? <circle cx={ex} cy={ey} r={4} fill={ink} /> : null}
                </g>
              );
            })}

            {/* the agents. One rung the whole way through — they are never the
                thing that changes — lifting only where a thread is on them.
                That rung is OP_READ, just under ripe, so a thread landing on a
                dot still takes it the last step to ACCENT; the radius carries
                the rest of the lift, as it always did. */}
            {CROWD_POS.map((p, i) => {
              const l = lit[i];
              const bre = breath(frame, hash(i, 9));
              const r = dotRadius * p.r * bre * (1 + 0.35 * l);
              const op = OP_READ + (OP_LIT - OP_READ) * l;
              return <circle key={i} cx={p.x} cy={p.y} r={r} fill={rung(op)} opacity={OP_DOT} />;
            })}

            {/* the reading band. Runs past both edges of the field, so it is a
                sweep across a population and not a rule drawn on a rectangle. */}
            {bandOp > 0.002 ? (
              <line
                x1={-90}
                y1={bandY}
                x2={1170}
                y2={bandY}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={bandOp}
              />
            ) : null}
          </svg>

          {/* the humans. The only ink in the piece. They arrive, and then they
              are still for the remaining 179 frames. */}
          {HUMANS.map((h) => (
            <Img
              key={h.x}
              src={staticFile(humanSrc)}
              style={{
                position: "absolute",
                left: h.x - humanSize / 2,
                top: HUMAN_Y - humanSize / 2,
                width: humanSize,
                height: humanSize,
                filter: "brightness(0) invert(1)",
                opacity: interpolate(frame, [h.in, h.in + HUMAN_FADE], [0, 1], clamp),
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      <Vignette strength={vignette} />
    </AbsoluteFill>
  );
};

export default HumansDidNotUnderstand;
