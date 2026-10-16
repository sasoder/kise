import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  CAM_LIFT,
  clamp01,
  hash,
  iconShadow,
  smoothstep,
} from "./fieldShared";
import { INK, INK_HI, INK_LO, MODEL_SHADOW_OPACITY, TWO_PI, lerp } from "./trapShared";
import { DEEPMIND, OPENAI } from "./brandGlyphs";

// ---------------------------------------------------------------------------
// challengeShared — the WORLD of the Noam Brown "challenge the model" clip.
//
// THE ONE IDEA: **HEIGHT IS LEVEL. The model climbs by what challenges it. A
// question BELOW the model's line is too easy and lifts nothing.**
//
// Every cut of this clip stands in the same picture: one centred column of
// questions, hardest at the top, easiest at the bottom, with a clear shaft up
// the middle that the model rises through. A cut decides what HAPPENS; this
// file decides what it is MADE OF. Import it, never restate a value.
//
// THE VOCABULARY (fixed — the same object means the same thing in every cut):
//   the model        = the OpenAI mark, FILLED `ACCENT`, MODEL_MARK_PX = 72
//                      screen px across its em box at K_REF (this is an
//                      interview with someone from OpenAI). Per-icon shadow on a
//                      wrapper OUTSIDE the scale group. Never rotated, never
//                      scaled as a gesture, no ring or disc behind it.
//                      ORANGE MEANS THE MODEL AND ITS LEVEL, NOTHING ELSE.
//   the model's level= ONE thin horizontal ACCENT line through the mark, at HALF
//                      the set's stroke, running out both sides to
//                      LEVEL_HALF_LEN and fading to nothing over its outer
//                      quarter. It MOVES ONLY BECAUSE THE MARK MOVES: a cut
//                      passes one y to both.
//   a question       = a white station ring with lucide `circle-help`'s `?`
//                      inside it. Its HEIGHT IN THE WORLD IS ITS DIFFICULTY.
//                      Unanswered = INK_HI.
//   answered         = the `?` un-draws and lucide `circle-check`'s tick draws in
//                      its place (pathLength dash), and the ring falls to INK_LO.
//                      THIS HAPPENS ONLY WHEN THE LEVEL LINE REACHES THE RING'S
//                      CENTRE — `solvedAt(lineY, q)` — computed from the line's y
//                      every frame, NEVER from a frame number.
//
// The ring and its glyph are drawn so that the 24-unit icon box maps to
// GLYPH_BOX x the ring's radius: a ring with a `?` in it IS lucide `circle-help`
// at the set's own stroke, and a solved one IS `circle-check`. That is why there
// is no third mark to invent.
//
// White ink at EXACTLY TWO opacities, INK_HI 1.0 and INK_LO 0.5. No third rung,
// no other colours, no text, no boxes. One stroke weight family: STROKE_PX_CLOSE
// on screen at CAM_CLOSE, easing to STROKE_PX_WIDE at CAM_WIDE (partial zoom
// compensation, `strokeScreen`), and the level line is half of it.
//
// SIZES. This clip's reference camera is CAM_WIDE (k = 1.0), so WORLD PX ARE
// SCREEN PX IN THE WIDE SHOT and every size below can be read straight off the
// resolved frame. `worldPx(px, k)` is here for anything solved at another zoom.
// ---------------------------------------------------------------------------

export const FPS = 24;

export { ACCENT, ACCENT_DEEP, INK, INK_HI, INK_LO, lerp, TWO_PI };

/** The camera every screen-px size below is solved at: CAM_WIDE's k, so world
 *  px = screen px on the resolved frame. */
export const K_REF = 1.0;
/** A screen-px size in world px at camera zoom `k` (K_REF by default). */
export const worldPx = (px: number, k: number = K_REF) => px / k;

/** The set's speed ceiling, screen px per frame. */
export const SPEED_CAP_SCREEN = 45;

// --- stroke ------------------------------------------------------------------
// PARTIAL ZOOM COMPENSATION. A stroke fixed in WORLD px would be 6 screen px in
// the close-up and 3.33 in the wide, where a ring is only 72 px across and the
// tick inside it starts to disappear; a stroke fixed in SCREEN px would make the
// line-work swell as the camera pulls back, which reads as the drawing changing
// rather than the camera moving. So the screen weight is interpolated between
// the two framings on a power of k: 6 px at CAM_CLOSE, 4.5 at CAM_WIDE.
//   STROKE_EXP solves 6 * (K_REF / CAM_CLOSE.k)^e = 4.5, i.e. e = ln(0.75) / ln(1/1.8).
export const STROKE_PX_CLOSE = 6;
export const STROKE_PX_WIDE = 4.5;
export const STROKE_EXP = 0.489;
/** The stroke's weight on SCREEN at camera zoom `k`. */
export const strokeScreen = (k: number) =>
  STROKE_PX_CLOSE * Math.pow(Math.max(k, 1e-4) / 1.8, STROKE_EXP);
/** ...and the world width to draw so it lands at that screen weight. */
export const strokeW = (k: number) => strokeScreen(k) / Math.max(k, 1e-4);
/** The level line is half the stroke — a thread, not a rule. */
export const levelW = (k: number) => strokeW(k) / 2;

// --- the nouns ---------------------------------------------------------------
/** A question ring's radius, world px, before the rim feather. */
export const RING_R = 36;
/** ...and the fraction of it a ring out on the silhouette's rim keeps, so the
 *  edge of the column dissolves instead of ending on a ruled line. */
export const RING_RIM = 0.89;
/** The 24-unit icon box, as a multiple of the RING's radius. 2.4 is what makes
 *  the ring plus its glyph exactly lucide `circle-help` / `circle-check`: those
 *  icons draw their own circle at r 10 on the 24 box, so 24 / 10 = 2.4. */
export const GLYPH_BOX = 2.4;

/** THE MODEL: the OpenAI mark's em box, 72 screen px across at K_REF — the same
 *  number the previous clip with this speaker used (`trapShared.MODEL_MARK_PX`),
 *  so the model is the same size on screen in both. Against this clip's 72 px
 *  ring it reads as one of the objects rather than as a label on them. */
export const MODEL_MARK_PX = 72;
export const MODEL_MARK = worldPx(MODEL_MARK_PX);
/** The mark's own half-box: what anything else has to stay outside of. */
export const MODEL_EDGE = MODEL_MARK / 2;

/** THE LEVEL LINE's half-length, and the fraction of each half that is the fade.
 *  470 puts its ends at world x 70 / 1010, i.e. 70 px inside the frame at
 *  CAM_WIDE, and its SOLID part reaches to 352 — past the outermost ring the
 *  lens can seat (|dx| <= 372 minus the rim feather), so the fade happens
 *  outside the column rather than across it. */
export const LEVEL_HALF_LEN = 470;
export const LEVEL_FADE = 0.25;

// --- the column --------------------------------------------------------------
// THE SILHOUETTE IS A LENS, never a box and never a lattice: narrow at the top
// (1-2 across), swelling through the middle, tapering again at the bottom
// (3 across), with a clear SHAFT up the centre that the model rises through.
//
// `hw(y)` is the half-width of the lens at height y — the largest |x - 540| a
// ring's CENTRE may have. The band a ring may stand in is
// [SHAFT_HALF + its r, hw(y)], so nothing ever crosses the shaft.
//
// yTop / yBottom are 210 / 1300 rather than the 170 / 1340 the concept sketch
// asked for, and the arithmetic is the frame's: at CAM_WIDE (k 1.0, cy 960) the
// world IS the screen, so the column's ink runs from yTop - RING_R - stroke/2 to
// yBottom + RING_R + stroke/2. At 170 / 1340 that is 133..1378, which is 1245 px
// of ink inside a 1200 px band (top ink >= 150, lowest ink <= 1350) — it does not
// fit at k 1.0, and dropping k to make it fit costs the whole wide shot its
// scale. At 210 / 1300 the ink is 176..1334, which clears both edges by ~25 px
// with the camera's own 5 px sway spent.
export const COLUMN = {
  x: 540,
  yTop: 222,
  yBottom: 1298,
  /** the clear shaft's half-width: no ring INK inside this. 84, not the concept
   *  sketch's 110: at 110 the two wings of the lens are 220 px apart with only
   *  ~190 px of band each to stand in, and the resolved frame reads as two
   *  separate chains of beads rather than as one column with a channel up it —
   *  measured off the f131 still. 84 still leaves the 72 px mark 48 px of air on
   *  each side and a ring's nearest ink 49 px off its edge. */
  shaftHalf: 84,
};

/** The lens's half-width at height y. Two smoothsteps: the swell up from the
 *  narrow top, and the taper back in toward the bottom.
 *
 *  THE FATTEST BAND SITS ACROSS y 500..790 (it used to be 660..940). It is where
 *  it is because of what has to happen THERE: the third swell of cut 1's climb
 *  runs y 740 -> 480 across f100-128, and that stretch has to be the thickest run
 *  of ticks in the whole cut, so the lens is widest and fullest exactly where the
 *  line spends "a lot of them are too easy". */
export const hw = (y: number) =>
  HW_MIN +
  220 * smoothstep(clamp01((y - 250) / 230)) -
  130 * smoothstep(clamp01((y - 790) / 420));

/** The narrowest the lens ever is. It is not the shaft's own edge: a ring's
 *  CENTRE may never be closer in than `shaftHalf + RING_R` (= 146, which is what
 *  guarantees the shaft stays clear of ink at every ring's full radius), so a
 *  lens that narrowed to that would have no band left to stand a ring in at all
 *  and the column would simply stop short of its own top. 152 leaves a 31 px
 *  band up there: a single file, one side at a time. The belly opens to 372,
 *  i.e. 251 px of band a side — three rings across per wing, six or seven across
 *  the whole lens — and the foot closes back to 242, which is one a side. */
export const HW_MIN = 152;

/** How thickly the column is populated at height y, 0..1 — a SEPARATE profile
 *  from `hw`, because width and count are two different things: the lens is
 *  WIDEST through its fat band and FULLEST there too, but its narrow top is a
 *  thin single file rather than an empty stretch, and its narrow bottom still
 *  holds the two or three easiest questions the model starts above.
 *
 *  SOLVED, not chosen, against three counts that have to come out right on cut
 *  1: ~6 rings still bright above the line where it rests (y ~ 475), 14-18 rings
 *  inside y 480..740 so the third swell has that many to turn over, and 2 below
 *  the model's opening height of 1250. */
export const dens = (y: number) =>
  0.28 +
  0.78 * smoothstep(clamp01((y - 360) / 170)) -
  0.3 * smoothstep(clamp01((y - 780) / 340));

/** How many questions the column holds — the dart-thrower seats as many of these
 *  as the spacing allows. */
export const QUESTION_COUNT = 54;
/** Centre-to-centre floor between two rings, and the floor on the difference of
 *  their HEIGHTS: no two questions share a height, so the level line reaches
 *  them one after another and the column answers as a ripple, never as a row
 *  flipping in unison. */
export const MIN_SEP = 78;
export const MIN_DY = 12;

export type Question = { x: number; y: number; r: number; seed: number };

/** THE QUESTION FIELD.
 *
 *  HEIGHTS are STRATIFIED through `dens`'s own CDF — the i-th ring is drawn from
 *  the i-th fortieth of the column's weight, jittered by up to 0.45 of a stratum.
 *  Plain rejection sampling was tried first and left an 89 px hole at the bottom
 *  of the column and nothing at all above y 320: with 40 draws the gaps are the
 *  whole shape of the thing. Stratifying bounds them without laying the rings
 *  out, because the stratum is in WEIGHT, the jitter is a stable hash, and every
 *  ring's x, side and radius are still scattered.
 *
 *  X is uniform in the band the lens leaves at that height — never inside the
 *  shaft, never outside the silhouette — with the side chosen by hash and only
 *  overruled when one side gets two rings ahead, so the column is balanced but
 *  never mirrored. A candidate is kept only if it clears every ring already
 *  standing by MIN_SEP and differs in HEIGHT from all of them by MIN_DY; up to
 *  40 candidates are tried per stratum, walking the height a little further from
 *  the stratum's centre each time.
 *
 *  The rim feather is the last step: a ring out toward the silhouette's edge
 *  keeps only RING_RIM of its radius, so the edge dissolves instead of ending on
 *  a ruled line. */
export const QUESTIONS: Question[] = (() => {
  // the height CDF of `dens`
  const STEPS = 1024;
  const ys: number[] = [];
  const cdf: number[] = [];
  let acc = 0;
  for (let i = 0; i <= STEPS; i++) {
    const y = COLUMN.yTop + ((COLUMN.yBottom - COLUMN.yTop) * i) / STEPS;
    ys.push(y);
    if (i > 0) acc += dens((y + ys[i - 1]) / 2);
    cdf.push(acc);
  }
  const total = cdf[STEPS];
  const yAt = (u: number) => {
    const t = clamp01(u) * total;
    let lo = 0;
    let hi = STEPS;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < t) lo = mid;
      else hi = mid;
    }
    const span = cdf[hi] - cdf[lo] || 1;
    return lerp(ys[lo], ys[hi], (t - cdf[lo]) / span);
  };

  // A ring's centre may never come inside this, which is what keeps the shaft
  // clear of ink at a ring's FULL radius however much the rim feather takes off.
  const inner = COLUMN.shaftHalf + RING_R * 1.03;

  const out: Question[] = [];
  let balance = 0; // + = one more on the right
  for (let i = 0; i < QUESTION_COUNT; i++) {
    const u = clamp01((i + 0.5 + 0.45 * (hash(i, 3) * 2 - 1)) / QUESTION_COUNT);
    const y0 = yAt(u);
    for (let a = 0; a < 40; a++) {
      const n = i * 97 + a;
      // walk a little further from the stratum's own height on each retry
      const y =
        a === 0 ? y0 : y0 + (hash(n, 5) * 2 - 1) * (6 + 1.4 * a);
      if (y < COLUMN.yTop || y > COLUMN.yBottom) continue;
      const outer = hw(y);
      if (outer <= inner + 4) continue;
      const dx = lerp(inner, outer, hash(n, 11));
      // roughly balanced left/right, never mirrored: the hash chooses, and the
      // running balance only overrules it once one side is two rings ahead.
      const coin = hash(n, 7) < 0.5 ? -1 : 1;
      const side = Math.abs(balance) >= 2 ? (balance > 0 ? -1 : 1) : coin;
      const x = COLUMN.x + side * dx;
      let ok = true;
      for (const q of out) {
        if (Math.abs(q.y - y) < MIN_DY || Math.hypot(q.x - x, q.y - y) < MIN_SEP) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      // the rim feather: 1 at the shaft's edge, 0 out on the silhouette
      const inward = clamp01((outer - dx) / Math.max(outer - inner, 1e-6));
      const r =
        RING_R * lerp(RING_RIM, 1, Math.pow(inward, 0.6)) * (0.97 + 0.06 * hash(n, 23));
      out.push({ x, y, r, seed: hash(n, 41) });
      balance += side;
      break;
    }
  }
  out.sort((a, b) => a.y - b.y);
  return out;
})();

if (QUESTIONS.length < 32) {
  throw new Error(
    `challengeShared: the column only seated ${QUESTIONS.length} questions of ${QUESTION_COUNT}.`,
  );
}

/** THE MECHANISM, in one line: a question is answered WHEN THE LEVEL LINE HAS
 *  REACHED ITS CENTRE. Every cut derives the flip from this and never from a
 *  frame number, so the ripple can never drift from the line that causes it. */
export const solvedAt = (lineY: number, q: { y: number }) => lineY <= q.y;

/** How many frames a ring takes to go from `?` at INK_HI to tick at INK_LO. */
export const SOLVE_F = 10;

// ---------------------------------------------------------------------------
// THE GATHERED MASS. A question that has been REACHED is released: it is not a
// question any more, it is part of what the model has already climbed past. So
// it eases inward toward the column's axis and closes the shaft behind the
// model, and what is left is ONE centred body of ticks with the few remaining
// `?` standing in the open channel above it — instead of two chains with a dead
// stripe down the middle, which is what the column resolved to before this.
//
// THE HEIGHTS NEVER MOVE. Height is difficulty; that is the clip's one idea, and
// a ring that slid up or down would be a question changing its answer. The
// gather is x ONLY.
//
// `GATHERED[i]` is where ring i ends up, and it is SOLVED, not authored:
//   * the target maps each ring's band position inward — the innermost aims at
//     GATHER_INNER (so it travels ~100 px, right across the old shaft) and the
//     outermost comes in only GATHER_OUTER, which keeps the lens's own
//     silhouette and feathered rim instead of squashing the whole thing;
//   * then a min-separation relaxation runs in x alone, so nothing overlaps and
//     nothing crosses the axis onto the other side.
// A cut animates each ring from `QUESTIONS[i].x` to `GATHERED[i]` on its own
// ease, started by the LINE'S ARRIVAL (never a shared frame), and clamps the
// result out of the model mark's own disc so the mark can never overlap a ring.
// ---------------------------------------------------------------------------
/** Where the innermost ring aims, as |x - 540|. */
export const GATHER_INNER = 20;
/** ...and how far in the outermost one comes. */
export const GATHER_OUTER = 30;
/** Rim-to-rim air the relaxation leaves between two gathered rings. */
export const GATHER_GAP = 7;
/** Frames after the line reaches a ring before it starts to move: the flip is
 *  finished first, so answering and being released are two events, not one. */
export const GATHER_DELAY = SOLVE_F;
/** The ease's length, per ring, from its own seed. */
export const GATHER_DUR = [30, 40] as const;
export const gatherDur = (seed: number) => lerp(GATHER_DUR[0], GATHER_DUR[1], seed);
/** Air between the model mark's box and a ring's rim that a cut must keep. */
export const GATHER_MARK_PAD = 8;

export const GATHERED: number[] = (() => {
  const inner = COLUMN.shaftHalf + RING_R * 1.03;
  const sideOf = (q: Question) => (q.x < COLUMN.x ? -1 : 1);
  const tgt = QUESTIONS.map((q) => {
    const outer = hw(q.y);
    const t = clamp01((Math.abs(q.x - COLUMN.x) - inner) / Math.max(outer - inner, 1e-6));
    const g = lerp(GATHER_INNER, Math.max(GATHER_INNER, outer - GATHER_OUTER), t);
    return COLUMN.x + sideOf(q) * g;
  });
  const n = QUESTIONS.length;
  for (let it = 0; it < 400; it++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dy = QUESTIONS[i].y - QUESTIONS[j].y;
        const need = QUESTIONS[i].r + QUESTIONS[j].r + GATHER_GAP;
        if (Math.abs(dy) >= need) continue;
        const dx = tgt[i] - tgt[j];
        if (Math.hypot(dx, dy) >= need) continue;
        const want = Math.sqrt(need * need - dy * dy);
        const push = ((want - Math.abs(dx)) / 2) * 0.55;
        const s = dx >= 0 ? 1 : -1;
        tgt[i] += s * push;
        tgt[j] -= s * push;
      }
    }
    for (let i = 0; i < n; i++) {
      const s = sideOf(QUESTIONS[i]);
      const d = (tgt[i] - COLUMN.x) * s;
      tgt[i] =
        COLUMN.x + s * Math.max(GATHER_INNER, Math.min(hw(QUESTIONS[i].y) + 30, d));
    }
  }
  return tgt;
})();

/** Where ring `i` ends up once it has been reached and released. */
export const gatheredX = (i: number) => GATHERED[i];


/** The flip, as ONE 0..1 per ring per frame, solved off the line's own curve:
 *  the exact (sub-frame) crossing is found by walking the monotone line, so a
 *  ring's flip starts the instant the line passes its centre however fast the
 *  line is travelling, and the flip itself always takes SOLVE_F frames.
 *
 *  `lineY` must be non-increasing in f, which is what the climb is. */
export const makeSolver = (lineY: (f: number) => number, first: number, last: number) => {
  const cross = QUESTIONS.map((q) => {
    let prev = lineY(first);
    if (prev <= q.y) return first;
    for (let f = first + 1; f <= last; f++) {
      const cur = lineY(f);
      if (cur <= q.y) {
        const span = prev - cur;
        return span > 1e-9 ? f - 1 + (prev - q.y) / span : f;
      }
      prev = cur;
    }
    return Infinity;
  });
  const solved = (f: number, i: number) => clamp01((f - cross[i]) / SOLVE_F);
  return { cross, solved };
};

/** Ambient: each ring's own drift, <= 3 world px, on its own two periods, so the
 *  column is never still and never moves in unison. It is PURELY VISUAL — every
 *  solve is computed against the ring's nominal y.
 *
 *  THE PERIODS ARE WHAT MATTER, not the amplitude. A 2.2 px drift on a 100-frame
 *  cycle moves a ring 0.14 px in a frame, which is nothing: measured as
 *  frame-to-frame image energy, the tail of cut 1 sat at a third of its own
 *  opening. These cycles are 19 and 24 frames (the `sin` argument is
 *  frame / P, so the cycle is 2*pi*P), which at the same amplitude is 0.93 and
 *  0.50 px a frame — a slow float rather than a jitter, and enough that no part
 *  of the column is ever still even when the climb has slowed to a creep. */
export const ringSway = (frame: number, seed: number) => ({
  dx: 2.8 * Math.sin(frame / (3.0 + seed * 1.1) + seed * TWO_PI),
  dy: 1.9 * Math.sin(frame / (3.8 + seed * 0.9) + seed * 3.1),
});

// ---------------------------------------------------------------------------
// THE ICONS. lucide-static (ISC), inlined verbatim on the 24 grid with
// `pathLength="1"` added, so one inherited `stroke-dasharray` draws every
// sub-path by the same fraction of ITS OWN length.
//
// The `?` is `circle-help` WITHOUT its circle — the station ring IS that circle
// — and the tick is `circle-check`'s, on the same terms.
// ---------------------------------------------------------------------------
export const ICON_QUESTION = `<path pathLength="1" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path pathLength="1" d="M12 17h.01"/>`;
export const ICON_CHECK = `<path pathLength="1" d="m9 12 2 2 4-4"/>`;

// ---------------------------------------------------------------------------
// A QUESTION — the ring and what is in it. `solved` is ONE 0..1 and everything
// the ring does is read off it, so the three things that change (the `?` going,
// the tick arriving, the ink dropping) cannot come apart:
//   s 0 .. 0.5   the `?` un-draws, from its tail
//   s 0.35 .. 1  the tick draws in its place
//   s 0 .. 1     the ring eases INK_HI -> INK_LO
// ---------------------------------------------------------------------------
export const QuestionRing: React.FC<{
  x: number;
  y: number;
  r: number;
  solved: number;
  k: number;
  opacity?: number;
}> = ({ x, y, r, solved, k, opacity = 1 }) => {
  const s = clamp01(solved);
  const sw = strokeW(k);
  // The two overlap on purpose. With the `?` gone by s 0.5 and the tick not
  // starting until 0.35 there is a frame near s 0.4 where both are down to a
  // tenth of their ink and the ring reads as EMPTY — measured on the contact
  // strip, two rings of 42 at any one time. Running the `?` out to 0.55 and
  // starting the tick at 0.24 leaves the trough at ~0.13 of full ink for about
  // one frame, which reads as one mark turning into another.
  const qDraw = 1 - smoothstep(clamp01(s / 0.55));
  const ckDraw = smoothstep(clamp01((s - 0.24) / 0.76));
  const ink = lerp(INK_HI, INK_LO, smoothstep(s)) * opacity;
  const box = GLYPH_BOX * r;
  // THE ENDS OF A DASHED DRAW POP, and both glyphs here have an end that shows.
  // A round-capped dash renders a FULL DOT for any length above zero, so the
  // `?`'s own dot (`M12 17h.01`, which is a zero-length path) sits there at full
  // size all the way down and then vanishes between two frames, and the tick's
  // first cap appears at full width on the frame it starts. Each glyph therefore
  // fades over the end of its own draw — `fade` frames' worth of it — so nothing
  // arrives or leaves on a single frame.
  const glyph = (icon: string, draw: number, fade: number) =>
    draw <= 0 ? null : (
      <g
        transform={`translate(${(x - box / 2).toFixed(3)} ${(y - box / 2).toFixed(3)}) scale(${(
          box / 24
        ).toFixed(5)})`}
        fill="none"
        stroke={INK}
        color={INK}
        strokeWidth={(sw * 24) / box}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${draw.toFixed(4)} 1`}
        opacity={smoothstep(clamp01(draw / fade)).toFixed(4)}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  return (
    <g style={{ filter: iconShadow(k) }} opacity={ink}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={INK} strokeWidth={sw} />
      {glyph(ICON_QUESTION, qDraw, 0.34)}
      {glyph(ICON_CHECK, ckDraw, 0.26)}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE MODEL — the OpenAI mark, filled ACCENT, upright, never rotated and never
// scaled as a gesture. The shadow sits on a WRAPPER OUTSIDE the scale group:
// inside it the filter would be authored in the glyph's own 24-unit space and
// come out em/24 times too heavy. Its opacity is the set's `MODEL_SHADOW_OPACITY`
// (0.27, lower than the 0.38 on a stroke) because this is a FILLED shape and an
// identical filter lays down contiguous blocks of shadow under it.
// ---------------------------------------------------------------------------
export const ModelMark: React.FC<{
  k: number;
  x?: number;
  y: number;
  em?: number;
  fill?: string;
  opacity?: number;
}> = ({ k, x = COLUMN.x, y, em = MODEL_MARK, fill = ACCENT, opacity = 1 }) => {
  if (!(em > 0) || opacity <= 0) return null;
  return (
    <g
      style={{ filter: iconShadow(k, undefined, undefined, MODEL_SHADOW_OPACITY) }}
      opacity={opacity}
    >
      <g
        transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${(em / 24).toFixed(
          6,
        )}) translate(-12 -12)`}
      >
        {OPENAI.paths.map((d) => (
          <path key={d.length} d={d} fill={fill} fillRule="evenodd" />
        ))}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE LEVEL LINE — the model's level, and the ONLY other thing in the clip that
// is accent. Half stroke, out both sides to LEVEL_HALF_LEN, fading to nothing
// over the outer LEVEL_FADE of each half so it has no ends to read as a bar.
// It takes the SAME y the mark does: it moves only because the mark moves.
// ---------------------------------------------------------------------------
export const LEVEL_GRAD_ID = "chLevelFade";

export const LevelLine: React.FC<{
  k: number;
  x?: number;
  y: number;
  half?: number;
  opacity?: number;
}> = ({ k, x = COLUMN.x, y, half = LEVEL_HALF_LEN, opacity = 1 }) => {
  if (half <= 0 || opacity <= 0) return null;
  const f = LEVEL_FADE / 2; // the fade as a fraction of the WHOLE line
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <defs>
        <linearGradient
          id={LEVEL_GRAD_ID}
          gradientUnits="userSpaceOnUse"
          x1={x - half}
          y1={y}
          x2={x + half}
          y2={y}
        >
          <stop offset="0" stopColor={ACCENT} stopOpacity="0" />
          <stop offset={f.toFixed(4)} stopColor={ACCENT} stopOpacity="1" />
          <stop offset={(1 - f).toFixed(4)} stopColor={ACCENT} stopOpacity="1" />
          <stop offset="1" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1={x - half}
        y1={y}
        x2={x + half}
        y2={y}
        stroke={`url(#${LEVEL_GRAD_ID})`}
        strokeWidth={levelW(k)}
        strokeLinecap="butt"
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CAMERAS. `k`, and the world point that sits at screen (540, 835).
//
// CAM_CLOSE is inside the column: the model fills the shaft, the rings bleed off
// both edges and stream DOWN past the line as it climbs. Its `y` is the OPENING
// one — a cut that tracks the model hands the camera the model's own curve.
// CAM_WIDE is the resolved framing: k 1.0, so world px = screen px, the whole
// column in frame with its ink inside 150..1350.
// ---------------------------------------------------------------------------
export type Cam = { k: number; x: number; y: number };
export const CAM_CLOSE: Cam = { k: 1.8, x: COLUMN.x, y: 1250 };
export const CAM_WIDE: Cam = { k: 1.0, x: COLUMN.x, y: 835 };

/** `runCamera`'s cy for a camera: CAM_LIFT puts (x, y) on screen y 835. */
export const camCy = (c: Cam) => c.y + CAM_LIFT / c.k;

// ===========================================================================
// THE OTHER KIND OF PATH — added by cut 2 (`SamePath`), untouched above.
//
// Cut 2's line is "why you might not see LLMs go the same path as AlphaGo and
// AlphaZero and all these kinds of, like, game-playing AIs", and the word is
// PATH. The clip already owns one path: the column, which the model climbs and
// which RUNS OUT — what is above the line is thinning to nothing. A game-playing
// AI's path is the other kind: it LAYS ITS OWN RUNGS and never ends.
//
// So a CLIMBER is built out of exactly the pieces this clip already has, and
// nothing is invented for it:
//   * the climber itself = a solid WHITE dot, CLIMBER_R * 2 across (0.55 of the
//     model's mark). WHITE, NOT ORANGE: orange is our model and its level, and
//     nothing else, in every cut of this clip.
//   * its rungs           = the SAME `QuestionRing`. A `?` fades in ahead of the
//     dot on its own path, the dot reaches it, it flips `?` -> tick on the same
//     `SOLVE_F` mechanics and falls to INK_LO, and the climber goes on. The flip
//     is keyed on the DOT'S POSITION reaching the ring — distance along the path
//     — exactly as the column's is keyed on the level line's y, and never on a
//     frame number.
//   * a TRAIL             = a white line at INK_LO and the level line's half
//     stroke, drawn behind a mover through what it has passed. The model has one
//     too (straight down its own shaft, ending at the bottom of the gathered
//     mass: that is what FINITE looks like); a climber's runs from where it came
//     into the world up to the dot, and has no end at the top because the dot is
//     still going.
// ===========================================================================

/** The climber dot's radius, world px. 20 -> 40 across, 0.55 of MODEL_MARK: a
 *  peer of the model, plainly not the model. */
export const CLIMBER_R = 20;
/** World px per frame. Twenty-odd times the model's creep in this cut, which is
 *  the whole comparison. */
export const CLIMBER_SPEED = 8.6;
/** Centre-to-centre along the path between two rungs, jittered per rung. */
export const RUNG_GAP: readonly [number, number] = [95, 115];
/** How far ahead of the dot a rung is fully lit, and over how many frames it
 *  got there. With the gap above, the last rung flips at about the moment the
 *  next one finishes arriving: the ladder is always exactly one ahead. */
export const RUNG_LEAD = 100;
export const RUNG_FADE_F = 10;
/** How much of the path behind a climber's birth already carries rungs, so a
 *  climber is discovered mid-climb rather than starting from nothing. */
export const RUNG_BEHIND = 210;

export type ClimberPath = {
  id: string;
  /** the frame at which the dot is exactly at (x, y) */
  fRef: number;
  x: number;
  y: number;
  /** degrees from horizontal (69-78 in this clip: steep, never vertical) */
  angle: number;
  /** which way the path leans as it RISES: +1 right, -1 toward frame centre */
  lean: 1 | -1;
  speed: number;
  /** the frame the climber comes into the world: its trail starts here, and it
   *  must be off screen on this frame (each cut asserts that). */
  born: number;
  seed: number;
};

/** The unit vector of a path: up, and leaning `lean`. */
export const climberDir = (c: ClimberPath) => {
  const a = (c.angle * Math.PI) / 180;
  return { dx: c.lean * Math.cos(a), dy: -Math.sin(a) };
};

/** Arc length travelled since `fRef` — signed, so it is negative before it. */
export const climberArc = (c: ClimberPath, f: number) => c.speed * (f - c.fRef);

/** Where the dot is at frame `f`. Linear: a climb that lays its own rungs has
 *  no reason to speed up or slow down, and a steady rise beside a creep is the
 *  comparison the line is making. */
export const climberAt = (c: ClimberPath, f: number) => {
  const d = climberDir(c);
  const s = climberArc(c, f);
  return { x: c.x + d.dx * s, y: c.y + d.dy * s };
};

export type Rung = {
  /** arc position along the path, measured from the path's (x, y) */
  s: number;
  x: number;
  y: number;
  r: number;
  /** the frame the dot REACHES this rung — when its leading edge touches the
   *  rim, not when it arrives at the centre. It matters: a 40 px dot crosses a
   *  72 px ring in eight frames, which is the whole flip, so a flip keyed on
   *  the CENTRE happens entirely underneath the dot and is never seen. Keyed on
   *  the rim, the `?` starts going as the dot arrives and the tick is finished
   *  and uncovered as it leaves. Solved from the dot's own position either way. */
  cross: number;
  /** the frame this rung has finished fading in */
  lit: number;
};

/** THE RUNGS OF ONE PATH, over the frames a cut needs. Spacing is seeded, so no
 *  two climbers lay their rungs on the same beat and nothing flips in unison.
 *  `cross` is solved from the DOT'S POSITION (s / speed), which is the same
 *  statement as "the dot reached it" — a cut asserts the two agree. */
export const climberRungs = (c: ClimberPath, fFirst: number, fLast: number): Rung[] => {
  const d = climberDir(c);
  const sStart = climberArc(c, c.born) - RUNG_BEHIND;
  const sEnd = climberArc(c, fLast) + RUNG_LEAD + RUNG_GAP[1] * 2;
  const out: Rung[] = [];
  // walk the path on the seeded gaps from a stable origin, so the ladder does
  // not shift when a cut asks for a different window of it
  let s = Math.floor(sStart / RUNG_GAP[1]) * RUNG_GAP[1];
  for (let j = 0; j < 400 && s < sEnd; j++) {
    const n = Math.round(s / 10) + Math.round(c.seed * 1000);
    s += lerp(RUNG_GAP[0], RUNG_GAP[1], hash(n, 13));
    if (s < sStart) continue;
    const r = RING_R * (0.95 + 0.05 * hash(n, 29));
    const cross = c.fRef + (s - (r + CLIMBER_R)) / c.speed;
    if (cross < fFirst - SOLVE_F * 4) continue;
    out.push({
      s,
      x: c.x + d.dx * s,
      y: c.y + d.dy * s,
      r,
      cross,
      lit: c.fRef + (s - RUNG_LEAD) / c.speed,
    });
  }
  return out;
};

/** A TRAIL: `a` -> `b` at INK_LO on the level line's half stroke. `draw` grows
 *  the line from `a`; `fade` dissolves it over that fraction at the `a` end (a
 *  climber came from somewhere off frame and its trail should not start on a
 *  drawn full stop; the model's own trail sets fade 0 on purpose, because its
 *  path HAVING a bottom end is the point). */
export const Trail: React.FC<{
  id: string;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  k: number;
  draw?: number;
  fade?: number;
  opacity?: number;
}> = ({ id, ax, ay, bx, by, k, draw = 1, fade = 0, opacity = INK_LO }) => {
  const dr = clamp01(draw);
  if (dr <= 0 || opacity <= 0) return null;
  if (Math.hypot(bx - ax, by - ay) < 0.5) return null;
  const f = clamp01(fade);
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      {f > 0 ? (
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={ax} y1={ay} x2={bx} y2={by}>
            <stop offset="0" stopColor={INK} stopOpacity="0" />
            <stop offset={f.toFixed(4)} stopColor={INK} stopOpacity="1" />
            <stop offset="1" stopColor={INK} stopOpacity="1" />
          </linearGradient>
        </defs>
      ) : null}
      <line
        x1={ax}
        y1={ay}
        x2={bx}
        y2={by}
        pathLength={1}
        stroke={f > 0 ? `url(#${id})` : INK}
        strokeWidth={levelW(k)}
        strokeLinecap="butt"
        strokeDasharray={`${dr.toFixed(4)} 1`}
      />
    </g>
  );
};

/** ONE CLIMBER: its trail, its rungs, its dot. Nothing else — no label, no logo,
 *  no glow. The dot goes on top, so a rung it is passing reads as being passed
 *  THROUGH, the same way the model's mark sits over the level line. */
export const Climber: React.FC<{
  c: ClimberPath;
  rungs: Rung[];
  frame: number;
  k: number;
  /** the whole climber, for a cut that wants it absent before its birth */
  opacity?: number;
}> = ({ c, rungs, frame, k, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const p = climberAt(c, frame);
  const b = climberAt(c, c.born);
  return (
    <g opacity={opacity}>
      {frame > c.born ? (
        <Trail id={`trail-${c.id}`} ax={b.x} ay={b.y} bx={p.x} by={p.y} k={k} fade={0.28} />
      ) : null}
      {rungs.map((g, j) => {
        const lit = smoothstep(clamp01((frame - (g.lit - RUNG_FADE_F)) / RUNG_FADE_F));
        if (lit <= 0) return null;
        return (
          <QuestionRing
            key={`${c.id}r${j}`}
            x={g.x}
            y={g.y}
            r={g.r}
            solved={clamp01((frame - g.cross) / SOLVE_F)}
            k={k}
            opacity={lit}
          />
        );
      })}
      <g style={{ filter: iconShadow(k) }}>
        <circle cx={p.x} cy={p.y} r={CLIMBER_R} fill={INK} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE THREE PATHS OF CUT 2 — A FAN THAT NEVER CROSSES.
//
// World coordinates, so a later cut can stand in the same place and mean the
// same thing. Three, not four: the resolved frame is 1,271 world px wide at
// k 0.85, the gathered mass takes 742 of them, and three paths at the set's
// 170 px minimum separation plus their own 72 px rings plus the air either side
// is the most that fits beside it. Four tangled — their rung chains crossed and
// the outermost ran off the right edge — and three that read cleanly beat four
// that do not.
//
// THE FAN. Every path LEANS TOWARD FRAME CENTRE as it rises (`lean: -1`), which
// is what lets a climber hide: further back down its own line is further RIGHT,
// and the opening frame ends at world x 1,067. The STEEPER a path is the INNER
// it sits — 78 degrees at x 735, 76 at 930, 74 at 1,125, all measured at world
// y = -119, the top of the resolved frame — so the three of them OPEN DOWNWARD
// from a 195 px separation at that top edge to 278 px at the bottom of the same
// frame. They therefore never meet anywhere on screen at any frame, and the
// horizontal gap between two neighbours is never under 195 world px, which is
// 123 px rim to rim at the largest ring this clip draws.
//
// The climber on the OUTERMOST path is the one that climbs highest (it leaves
// the top of the frame), and the innermost is the last and lowest. That is what
// keeps every rung inside the frame's right margin: with this lean a path runs
// further right the lower you look, so the path that is used low is the one
// that sits furthest left.
//
// `fRef`/`x`/`y` are where the dot is on that frame, which is how the cut aligns
// each entrance with a word; `born` is the frame the climber comes into the
// world, always while it is still off screen.
// ---------------------------------------------------------------------------
export const CLIMBERS: ClimberPath[] = [
  // AlphaGo: the outermost and shallowest path, found out to the right by the
  // glide and gone off the top while the pull-back is still running.
  { id: "c1", fRef: 84, x: 1146, y: -45, angle: 74, lean: -1, speed: 8.6, born: 54, seed: 0.17 },
  // AlphaZero: the middle path, rising past the lower edge of the held shot.
  { id: "c2", fRef: 84, x: 1281, y: 1372, angle: 76, lean: -1, speed: 8.4, born: 68, seed: 0.61 },
  // ...and all these kinds of game-playing AIs: the steepest and innermost, up
  // into the widening frame from underneath as the camera comes back down.
  { id: "c3", fRef: 104, x: 1069, y: 1450, angle: 78, lean: -1, speed: 8.8, born: 90, seed: 0.39 },
];


// ===========================================================================
// THE OPPONENT — added by cut 3 (`EquallyStrong`), APPEND ONLY. Nothing above
// this line is changed; cut 1 and cut 2 render exactly as they did.
//
// Cut 2 said a climber lays its own rungs. Cut 3's line — "you're always
// playing against an AI that's equally strong" — says HOW: it plays against a
// twin exactly as strong, and each rung is MADE BETWEEN THEM.
//
// THE PAIR. The climber's dot splits: a second dot slides out from behind it
// until the two sit symmetric either side of the path, the path staying the
// midline. A CONNECTOR is drawn between them — white, INK_LO, half stroke, the
// same weight and ink as a trail — and the rungs still arrive on the path
// ahead, now passing BETWEEN the pair rather than under a single dot.
//
// THE SPLIT IS HORIZONTAL, NOT PERPENDICULAR TO THE PATH (director-approved
// departure from the cut brief). HEIGHT IS LEVEL is the clip's one idea, so
// "equally strong" has to be literally true in the clip's own grammar: the two
// dots must stand at THE SAME HEIGHT, which a perpendicular split does not give
// on a path 78 degrees off horizontal — it leaves 29 world px between them, 55
// screen px in the close-up, plainly one above the other, which is the opposite
// of what the line says. Offsetting HORIZONTALLY by PAIR_DX instead puts both
// dots on the same y AND keeps the brief's PAIR_HALF of perpendicular clearance
// from the path, because
//   PAIR_DX = PAIR_HALF / sin(angle)
// and the twin simply climbs its own parallel copy of the path. The connector
// is then HORIZONTAL — the same kind of line as the model's own level line,
// white instead of accent — and the pair's rung flip is not a new mechanism at
// all but `solvedAt`, the column's own rule, applied to the connector's y.
// ===========================================================================

/** Perpendicular clearance between each dot and the path it straddles. */
export const PAIR_HALF = 70;
/** ...as a HORIZONTAL offset, so the two dots share a height. */
export const pairDx = (c: ClimberPath) => PAIR_HALF / Math.sin((c.angle * Math.PI) / 180);
/** Which side the ORIGINAL dot takes (-1 = left); the twin takes the other, so
 *  the connector draws left -> right, from the original toward the twin. */
export const PAIR_ORIGIN_SIDE = -1;

/** The two dots at frame `f`, `split` 0..1 apart. Both sit on the path's own y:
 *  the midpoint between them is exactly the climber's position, so the path
 *  stays the midline and every rung still arrives on it. */
export const pairDots = (c: ClimberPath, f: number, split: number) => {
  const p = climberAt(c, f);
  const dx = pairDx(c) * clamp01(split);
  return {
    mid: p,
    a: { x: p.x + PAIR_ORIGIN_SIDE * dx, y: p.y },
    b: { x: p.x - PAIR_ORIGIN_SIDE * dx, y: p.y },
  };
};

/** THE PAIR'S REACH LINE, as a world y — the one statement that covers the cut
 *  either side of the split, so there is no frame on which the rule changes.
 *
 *  Before the split the leading ink is a DOT of radius CLIMBER_R sitting on the
 *  path, and cut 2's rule is that a rung flips when that dot's leading edge
 *  touches the ring's RIM (a flip keyed on the centre happens underneath the
 *  dot and is never seen). After it, the leading ink is the CONNECTOR, a line
 *  with no extent along the path, and the rule is the column's own: it reaches
 *  the ring's CENTRE. Sliding the lead off as the pair opens gives both:
 *
 *    reachY(f) = pathY(f) - (r + CLIMBER_R) * sin(angle) * (1 - split(f))
 *
 *  which is cut 2's `Rung.cross` exactly at split 0 and `solvedAt` exactly at
 *  split 1 — VERIFIED against cut 2's own rule: every rung flipping before the
 *  split matches its `Rung.cross` to the digit, and every rung after it
 *  diverges to the later centre-keyed instant. It is monotone decreasing for
 *  any split that only opens (the path climbs ~8.6 world py/f and the lead
 *  retracts at most ~3.4), so a rung's crossing is a single well-defined
 *  instant, solved from the DOT'S OWN POSITION every frame, never a frame
 *  number. */
export const pairReachY = (c: ClimberPath, f: number, split: number, ringR: number) =>
  climberAt(c, f).y -
  (ringR + CLIMBER_R) * Math.sin((c.angle * Math.PI) / 180) * (1 - clamp01(split));

/** Each rung's crossing frame, solved off `pairReachY` by walking it — the same
 *  construction `makeSolver` uses on the level line, and for the same reason. */
export const makePairSolver = (
  c: ClimberPath,
  rungs: Rung[],
  split: (f: number) => number,
  first: number,
  last: number,
) => {
  const cross = rungs.map((g) => {
    let prev = pairReachY(c, first, split(first), g.r);
    if (prev <= g.y) return first;
    for (let f = first + 1; f <= last; f++) {
      const cur = pairReachY(c, f, split(f), g.r);
      if (cur <= g.y) {
        const span = prev - cur;
        return span > 1e-9 ? f - 1 + (prev - g.y) / span : f;
      }
      prev = cur;
    }
    return Infinity;
  });
  return { cross, solved: (f: number, j: number) => clamp01((f - cross[j]) / SOLVE_F) };
};

/** A RAIL: where one of the pair has actually been, sampled per frame from the
 *  frame the split began. It is not a straight line from the split point — the
 *  dot slides outward while it climbs, so its track is a bend that straightens
 *  into a line parallel to the path, and drawing the bend is what makes the two
 *  rails read as ONE ladder rather than two separate climbers. */
export const pairRailPath = (
  c: ClimberPath,
  fFrom: number,
  fTo: number,
  split: (f: number) => number,
  which: "a" | "b",
) => {
  const pts: string[] = [];
  const n = Math.max(1, Math.ceil(fTo - fFrom));
  for (let i = 0; i <= n; i++) {
    const f = fFrom + ((fTo - fFrom) * i) / n;
    const d = pairDots(c, f, split(f))[which];
    pts.push(`${i === 0 ? "M" : "L"}${d.x.toFixed(2)} ${d.y.toFixed(2)}`);
  }
  return pts.join(" ");
};

/** THE PAIR, drawn: the shared trail up to the split, the two rails out of it,
 *  the connector between the dots, the rungs on the path, and the dots on top.
 *  The connector goes UNDER the rungs, exactly as the level line goes under the
 *  column, so it is SEEN to pass through the question it is answering. */
export const RungPair: React.FC<{
  c: ClimberPath;
  rungs: Rung[];
  /** the climber's own clock */
  frame: number;
  split: number;
  splitFrom: number;
  splitOf: (f: number) => number;
  /** 0..1, the connector's draw from the original dot toward the twin */
  connector: number;
  solved: (j: number) => number;
  k: number;
}> = ({ c, rungs, frame, split, splitFrom, splitOf, connector, solved, k }) => {
  const d = pairDots(c, frame, split);
  const born = climberAt(c, c.born);
  const sharedTo = climberAt(c, Math.min(frame, splitFrom));
  const conn = clamp01(connector);
  const sw = levelW(k);
  return (
    <g>
      {frame > c.born ? (
        <Trail
          id={`trail-${c.id}`}
          ax={born.x}
          ay={born.y}
          bx={sharedTo.x}
          by={sharedTo.y}
          k={k}
          fade={0.28}
        />
      ) : null}
      {frame > splitFrom ? (
        <g style={{ filter: iconShadow(k) }} opacity={INK_LO}>
          <path
            d={pairRailPath(c, splitFrom, frame, splitOf, "a")}
            fill="none"
            stroke={INK}
            strokeWidth={sw}
            strokeLinecap="butt"
          />
          <path
            d={pairRailPath(c, splitFrom, frame, splitOf, "b")}
            fill="none"
            stroke={INK}
            strokeWidth={sw}
            strokeLinecap="butt"
          />
        </g>
      ) : null}
      {conn > 0 ? (
        <g style={{ filter: iconShadow(k) }} opacity={INK_LO}>
          <line
            x1={d.a.x}
            y1={d.a.y}
            x2={d.b.x}
            y2={d.b.y}
            pathLength={1}
            stroke={INK}
            strokeWidth={sw}
            strokeLinecap="butt"
            strokeDasharray={`${conn.toFixed(4)} 1`}
          />
        </g>
      ) : null}
      {rungs.map((g, j) => {
        const lit = smoothstep(clamp01((frame - (g.lit - RUNG_FADE_F)) / RUNG_FADE_F));
        if (lit <= 0) return null;
        return (
          <QuestionRing
            key={`${c.id}p${j}`}
            x={g.x}
            y={g.y}
            r={g.r}
            solved={solved(j)}
            k={k}
            opacity={lit}
          />
        );
      })}
      <g style={{ filter: iconShadow(k) }}>
        <circle cx={d.a.x} cy={d.a.y} r={CLIMBER_R} fill={INK} />
        <circle cx={d.b.x} cy={d.b.y} r={CLIMBER_R} fill={INK} />
      </g>
    </g>
  );
};

// ===========================================================================
// THE GAME — added by cut 2 V2 (`SamePathV2`), APPEND ONLY. Nothing above this
// line is changed; cuts 1, 2, 3, 4 and 5 render exactly as they did.
//
// The director's note on cut 2 V1: "I don't like how AlphaGo is visualized.
// Utilize logos here, and the camera should pan completely to the right so that
// the OpenAI logo together with the questions/answers are not visible. Make the
// part with AlphaGo look more like an actual Go game."
//
// So the other kind of path is not an abstract climber any more. It is A GO
// BOARD WITH A REAL GAME RUNNING ON IT, under the mark of the lab that built
// the player. The board is not a new material either: the clip's background IS
// a grid, and a Go board is that grid MADE PRECISE — same white line at the
// level line's own half stroke, same two opacities.
//
// THE TWO STONES, inside the clip's white-at-two-opacities system:
//   white stone = a disc FILLED at INK_HI. It is the only filled white disc in
//                 the clip besides cut 2 V1's climber dot, which this cut does
//                 not use.
//   black stone = a disc FILLED WITH THE SCENE'S OWN DARK: `BG_BASE` composited
//                 at GO_BLACK_ALPHA over the dimmed field and drawn FLAT (a
//                 part-transparent fill let the board's lines ghost through the
//                 last tenth of the stone, which a real stone does not do; a
//                 white stone's INK is flat for the same reason), with a
//                 HAIRLINE INK_LO outline
//                 at a third of the stone stroke so the edge stays crisp where a
//                 stone sits on a board line. Director's note on the first
//                 build: filled with the field's own tone and outlined at
//                 INK_HI, the black stone read as a hollow marker rather than as
//                 the other player. It is not a new colour — BG_BASE is the
//                 base the dimmed grid is composited over in every cut of this
//                 style — and it is the only dark shape in the clip, which is
//                 exactly what a black stone should be. Both stones are the same
//                 disc of radius r, carry the same `iconShadow`, and meet on the
//                 cell the way real stones do.
// A stone LANDS (GO_LAND_F frames, scale 1.12 -> 1 and opacity 0 -> 1). It is a
// placement, not a pop, and nothing bounces.
//
// ONE STROKE FAMILY, AT DEPTH. A crowd board is drawn at `scale` < 1, which is
// what "further away" means, so its line weight is the set's own weight at the
// camera zoom it is effectively seen at — `strokeScreen(k * scale)` — rather
// than the near board's weight shrunk or held. That is the same partial zoom
// compensation `strokeScreen` already does for the camera, applied to depth.
// ===========================================================================

/** Lines a side. 19, the board AlphaGo and Lee Sedol played on. */
export const GO_N = 19;
/** World px between two lines at scale 1: 18 * 46 = 828 px of board, which is
 *  the ~830 px square the cut is composed around. */
export const GO_CELL = 46;
/** A stone's radius: 0.9 of a cell across, the real ratio. */
export const GO_STONE_R = GO_CELL * 0.45;
/** A star point's radius. */
export const GO_STAR_R = GO_CELL * 0.085;
/** Frames a stone takes to land, and frames a captured stone takes to go. */
export const GO_LAND_F = 4;
export const GO_CAPTURE_F = 6;
/** The dimmed field's own flat tone — `grid-background.jpg` at BG_DIM over
 *  BG_BASE — sampled off a rendered frame (#707070 by the boards, #686868 down
 *  in the vignette). */
export const GO_FIELD_TONE = "#707070";
/** A BLACK STONE'S fill: the scene's own dark base, BG_BASE, at this alpha over
 *  that field. 0.9 rather than 1 so the stone sits IN the field's light instead
 *  of punching a hole in it. */
export const GO_BLACK_ALPHA = 0.9;
/** ...composited to a FLAT colour, exactly as a white stone's INK is flat, so
 *  the board's lines VANISH under a stone instead of ghosting through the last
 *  tenth of it. Derived from BG_BASE and the field, never picked. */
export const GO_BLACK = (() => {
  const hex = (h: string) => {
    const n = parseInt(h.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const a = hex(GO_FIELD_TONE);
  const b = hex(BG_BASE);
  const m = (i: number) => Math.round(a[i] + (b[i] - a[i]) * GO_BLACK_ALPHA);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
})();
/** ...and its outline: a hairline at INK_LO, a third of the stone stroke, which
 *  is what keeps the rim crisp where the stone crosses a board line. */
export const GO_BLACK_EDGE = 1 / 3;

/** The board's line weight and a stone's outline weight, in WORLD px, for a
 *  board at `scale` seen at camera zoom `k`. Both come off the set's own
 *  `strokeScreen`, evaluated at the zoom the board is effectively seen at. */
export const goLineW = (k: number, scale = 1) =>
  strokeScreen(Math.max(k * scale, 1e-4)) / 2 / Math.max(k, 1e-4);
export const goStoneW = (k: number, scale = 1) =>
  strokeScreen(Math.max(k * scale, 1e-4)) / Math.max(k, 1e-4);

// ---------------------------------------------------------------------------
// THE RECORD. AlphaGo (black) vs Lee Sedol (white), game 2 of the Google
// DeepMind Challenge Match, Seoul, 2016-03-10, B+R in 211 moves — the game
// whose 37th move (B[oj], the fifth-line shoulder hit, `GO_MOVES[36]` =
// [14, 9]) is the one everybody means when they say AlphaGo played a move no
// human would.
//
// SOURCE: `https://homepages.cwi.nl/~aeb/go/games/games/AlphaGo/LeeSedol/2.sgf`
// (Andries Brouwer's AlphaGo archive), fetched 2026-09-22 and converted with
// `scratchpad/samepath2/sgf.mjs`: SGF letters a..s -> 0..18, column first, row
// from the top. The first 120 moves are kept — more than any board here shows —
// and they are the record's own, in order, with no move re-ordered or invented.
// The conversion is checked three ways: strict B/W alternation (0 breaks), no
// move onto an occupied point, and no suicide.
// ---------------------------------------------------------------------------
export const GO_MOVES: readonly (readonly [number, number])[] = [
  [15, 3], [3, 15], [2, 3], [16, 15], [14, 15], [14, 16], [13, 16], [15, 16],
  [2, 13], [5, 16], [12, 15], [16, 13], [8, 2], [3, 9], [15, 14], [16, 14],
  [2, 15], [2, 16], [1, 16], [2, 14], [1, 15], [1, 14], [3, 14], [1, 13],
  [3, 16], [4, 15], [3, 17], [2, 12], [9, 15], [2, 6], [4, 3], [16, 5],
  [16, 4], [15, 5], [13, 3], [15, 8], [14, 9], [14, 8], [13, 9], [12, 7],
  [6, 15], [6, 16], [3, 13], [3, 12], [5, 14], [7, 15], [7, 14], [4, 14],
  [4, 13], [5, 13], [4, 12], [4, 11], [5, 12], [6, 13], [5, 11], [6, 14],
  [4, 10], [3, 10], [3, 11], [2, 11], [4, 7], [3, 8], [15, 9], [16, 8],
  [17, 5], [17, 6], [10, 3], [7, 13], [14, 12], [17, 4], [17, 3], [18, 5],
  [5, 8], [6, 10], [7, 12], [8, 13], [7, 11], [10, 14], [10, 15], [6, 2],
  [3, 5], [8, 3], [9, 2], [6, 4], [3, 6], [2, 5], [2, 7], [1, 7], [3, 7],
  [1, 8], [7, 3], [7, 4], [6, 3], [5, 3], [7, 2], [5, 4], [4, 2], [6, 7],
  [5, 2], [6, 8], [8, 8], [7, 10], [8, 10], [8, 11], [8, 12], [8, 9],
  [9, 11], [9, 9], [8, 5], [10, 12], [10, 11], [11, 9], [11, 10], [11, 14],
  [11, 8], [10, 9], [2, 8], [2, 9], [12, 9], [13, 17],
] as const;

/** Black plays the odd-numbered moves, so `moves[i]` is black iff i is even —
 *  the record's own order, never an invented alternation. */
export const goIsBlack = (i: number) => i % 2 === 0;

// ---------------------------------------------------------------------------
// THE SECOND RECORD. Board 1 is ALPHAGO, so it plays AlphaGo's own game. Board 2
// is ALPHAZERO, and giving it the same record would have been the same game
// twice on screen at two different stages — which a viewer who knows Go would
// read as one board copying the other, and which is not what "AlphaZero" means
// anyway. It gets a real AlphaGo Zero SELF-PLAY game instead: the 40-block
// version playing itself, which is literally the thing the line is about.
//
// SOURCE: `https://homepages.cwi.nl/~aeb/go/games/games/AlphaGo/Nature2017/
// AlphaGo_Zero_40_block_self-play_games/02.sgf` (the 83 SGFs published with
// Silver et al., "Mastering the game of Go without human knowledge", Nature 550
// (2017) 354-359), fetched 2026-09-22 and converted by the same script, checked
// the same three ways. 298 moves in the record; the first 120 are kept.
// ---------------------------------------------------------------------------
export const GO_MOVES_ZERO: readonly (readonly [number, number])[] = [
  [15, 15], [15, 3], [3, 16], [2, 3], [16, 2], [16, 3], [15, 2], [13, 2],
  [14, 2], [14, 3], [13, 1], [2, 14], [4, 2], [3, 2], [4, 3], [2, 5],
  [12, 2], [13, 3], [17, 3], [17, 4], [17, 2], [16, 16], [16, 15], [15, 16],
  [14, 16], [14, 17], [13, 17], [13, 16], [14, 15], [12, 17], [15, 17], [13, 18],
  [16, 17], [6, 16], [5, 15], [6, 15], [5, 14], [3, 15], [4, 16], [2, 16],
  [2, 17], [1, 16], [4, 11], [7, 13], [2, 12], [1, 17], [12, 3], [16, 8],
  [6, 12], [7, 12], [6, 11], [16, 5], [12, 14], [10, 15], [2, 7], [8, 3],
  [4, 1], [3, 1], [8, 5], [10, 4], [3, 4], [2, 4], [11, 4], [3, 6],
  [3, 7], [6, 4], [5, 4], [7, 5], [4, 6], [8, 6], [16, 10], [5, 6],
  [4, 7], [5, 5], [4, 5], [15, 10], [15, 11], [15, 9], [9, 5], [7, 7],
  [10, 5], [6, 2], [17, 9], [17, 13], [16, 13], [16, 14], [17, 15], [16, 11],
  [17, 11], [16, 12], [17, 12], [15, 13], [15, 12], [16, 13], [14, 13], [17, 8],
  [1, 13], [11, 1], [12, 1], [1, 14], [13, 11], [1, 6], [1, 7], [12, 5],
  [11, 5], [9, 1], [15, 14], [10, 13], [13, 9], [5, 3], [3, 3], [0, 7],
  [0, 8], [0, 6], [1, 9], [3, 12], [3, 11], [12, 7], [6, 17], [7, 17],
] as const;

/** A record, with the rules already run over it. `capturedAt[i]` is the move at
 *  which the stone played by move `i` was taken off the board (Infinity if it is
 *  still there), so a board can render "which stones are on it at frame f"
 *  without replaying anything per frame. */
export type GoRecord = {
  id: string;
  source: string;
  moves: readonly (readonly [number, number])[];
  capturedAt: number[];
  captures: number[];
};

/** THE RULES: place, remove any enemy group left without a liberty, and refuse a
 *  suicide. Run once per record at module scope, which is also what proves the
 *  conversion — a mis-parsed SGF plays onto an occupied point within a dozen
 *  moves. */
const playOut = (id: string, source: string, moves: GoRecord["moves"]): GoRecord => {
  const idx = (c: number, r: number) => r * GO_N + c;
  const board = new Int8Array(GO_N * GO_N); // 0 empty, 1 black, 2 white
  const owner = new Int32Array(GO_N * GO_N).fill(-1); // which move put it there
  const capturedAt: number[] = moves.map(() => Infinity);
  const captures: number[] = [];
  const NB = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  const group = (sc: number, sr: number) => {
    const colour = board[idx(sc, sr)];
    const seen = new Set<number>();
    const stack: [number, number][] = [[sc, sr]];
    const stones: number[] = [];
    let libs = 0;
    while (stack.length) {
      const [x, y] = stack.pop() as [number, number];
      const k = idx(x, y);
      if (seen.has(k)) continue;
      seen.add(k);
      stones.push(k);
      for (const [dx, dy] of NB) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GO_N || ny >= GO_N) continue;
        const v = board[idx(nx, ny)];
        if (v === 0) libs += 1;
        else if (v === colour) stack.push([nx, ny]);
      }
    }
    return { stones, libs };
  };
  for (let i = 0; i < moves.length; i++) {
    const [c, r] = moves[i];
    const me = goIsBlack(i) ? 1 : 2;
    const op = 3 - me;
    if (board[idx(c, r)] !== 0) {
      throw new Error(`challengeShared: ${id} move ${i + 1} plays onto an occupied point.`);
    }
    board[idx(c, r)] = me;
    owner[idx(c, r)] = i;
    let taken = 0;
    for (const [dx, dy] of NB) {
      const nx = c + dx;
      const ny = r + dy;
      if (nx < 0 || ny < 0 || nx >= GO_N || ny >= GO_N) continue;
      if (board[idx(nx, ny)] !== op) continue;
      const g = group(nx, ny);
      if (g.libs > 0) continue;
      for (const k of g.stones) {
        capturedAt[owner[k]] = i;
        owner[k] = -1;
        board[k] = 0;
        taken += 1;
      }
    }
    if (group(c, r).libs === 0) {
      throw new Error(`challengeShared: ${id} move ${i + 1} is a suicide.`);
    }
    captures.push(taken);
  }
  return { id, source, moves, capturedAt, captures };
};

export const GO_RECORDS: GoRecord[] = [
  playOut(
    "sedol2",
    "https://homepages.cwi.nl/~aeb/go/games/games/AlphaGo/LeeSedol/2.sgf",
    GO_MOVES,
  ),
  playOut(
    "zero-selfplay",
    "https://homepages.cwi.nl/~aeb/go/games/games/AlphaGo/Nature2017/" +
      "AlphaGo_Zero_40_block_self-play_games/02.sgf",
    GO_MOVES_ZERO,
  ),
];

// ---------------------------------------------------------------------------
// THE BOARDS. World coordinates, so a later cut can stand in the same place and
// mean the same thing.
//
//   board 1  AlphaGo    full size, the one the pan lands on, playing AlphaGo's
//                       own game against Lee Sedol from move 1
//   board 2  AlphaZero  1,220 px directly below it in the same column, playing
//                       an AlphaGo Zero SELF-PLAY game already 41 moves in when
//                       it is found — it was there, out of frame
//   boards 3-6          "all these kinds of game-playing AIs": the two records
//                       again at smaller scales and other phases, in a ragged
//                       file to the right, never a grid and never in unison
//
// THE 1,220 px BETWEEN BOARDS 1 AND 2 IS SOLVED, not chosen. At the landing the
// camera is at k ~0.84 and the frame reaches 1,146 world px below its centre,
// so board 2 cannot be hidden at any zoom this cut can afford; what it CAN do is
// keep board 2's own nameplate — the thing that would give the "AlphaZero" beat
// away sixteen frames early — below screen y 1350, where the captions live.
// 1,220 puts that plate at screen 1451 on the landing frame and board 2's top
// line at 1510, so the landing reads as one board with something beginning
// under it, and the pull-back is what delivers the second game.
//
// `start` is the frame the board's FIRST move lands (it may be negative: a
// board whose game was already running before the cut opened), and `pace` is
// the frames between moves. NO TWO BOARDS SHARE A (pace, start mod pace) PAIR,
// which is what keeps them off each other's beat: two boards on the same pace
// and the same phase would place every stone in unison for the whole cut. Six
// boards cannot all be on pace 3 for that reason — there are only three phases
// — so the two NAMED boards keep the brief's 3 and the four in the crowd run at
// 4, 5 and 6, which is also what makes them read as other games rather than as
// copies of this one. Their move counts are spread too (42 / 25 / 54 / 18 on the
// last frame against board 1's 32 and board 2's 65), so no two boards in the
// wide shot are showing the same position.
// ---------------------------------------------------------------------------
export type GoBoardSpec = {
  id: string;
  /** the board's centre, world px */
  x: number;
  y: number;
  /** 1 = the full 828 px board; below 1 is the same board further away */
  scale: number;
  /** the frame its first stone lands (may be negative) */
  start: number;
  /** frames between stones */
  pace: number;
  /** does it carry the DeepMind nameplate? boards 1 and 2 only */
  mark: boolean;
  /** which of `GO_RECORDS` this board is playing */
  record: number;
};

export const BOARDS: GoBoardSpec[] = [
  { id: "b1", x: 1720, y: 640, scale: 1.0, start: 60, pace: 3, mark: true, record: 0 },
  { id: "b2", x: 1720, y: 1860, scale: 1.0, start: -38, pace: 3, mark: true, record: 1 },
  { id: "b3", x: 2565, y: 405, scale: 0.6, start: -6, pace: 4, mark: false, record: 1 },
  { id: "b4", x: 2470, y: 955, scale: 0.5, start: 30, pace: 5, mark: false, record: 0 },
  { id: "b5", x: 2560, y: 1480, scale: 0.58, start: -60, pace: 4, mark: false, record: 0 },
  { id: "b6", x: 2455, y: 2010, scale: 0.46, start: 52, pace: 6, mark: false, record: 1 },
];

/** The record a board is playing. */
export const goRecordOf = (b: GoBoardSpec) => GO_RECORDS[b.record];


(() => {
  const seen = new Map<string, string>();
  for (const b of BOARDS) {
    const key = `${b.pace}:${((b.start % b.pace) + b.pace) % b.pace}`;
    const other = seen.get(key);
    if (other) {
      throw new Error(
        `challengeShared: boards ${other} and ${b.id} are in lockstep (pace ${b.pace}, phase ${key}).`,
      );
    }
    seen.set(key, b.id);
  }
})();

/** Half the board's line span, world px — its own edge, since the outer lines
 *  ARE the edge and there is no frame drawn around it. */
export const goHalf = (b: { scale: number }) => ((GO_N - 1) / 2) * GO_CELL * b.scale;

/** Where line (col, row) sits in the world. Row 0 is the TOP line, which is how
 *  the SGF reads its own coordinates. */
export const goStoneAt = (
  b: { x: number; y: number; scale: number },
  col: number,
  row: number,
) => ({
  x: b.x + (col - (GO_N - 1) / 2) * GO_CELL * b.scale,
  y: b.y + (row - (GO_N - 1) / 2) * GO_CELL * b.scale,
});

/** The frame move `i` lands on this board. */
export const goMoveFrame = (b: GoBoardSpec, i: number) => b.start + i * b.pace;

/** HOW MANY MOVES ARE ON THE BOARD AT FRAME `f` — the one statement the cut
 *  reads its stone counts off, capped at the record's length. */
export const boardMovesAt = (b: GoBoardSpec, f: number) => {
  if (f < b.start) return 0;
  return Math.min(goRecordOf(b).moves.length, Math.floor((f - b.start) / b.pace) + 1);
};

/** THE STAR POINTS, the nine marked intersections of a 19x19 board. */
export const GO_STARS: readonly (readonly [number, number])[] = (() => {
  const p = [3, 9, 15];
  const out: [number, number][] = [];
  for (const r of p) for (const c of p) out.push([c, r]);
  return out;
})();

// ---------------------------------------------------------------------------
// ONE STONE. `land` 0..1 is its placement ease, `gone` 0..1 is its capture.
// ---------------------------------------------------------------------------
export const Stone: React.FC<{
  x: number;
  y: number;
  r: number;
  black: boolean;
  land: number;
  gone?: number;
  k: number;
  scale?: number;
}> = ({ x, y, r, black, land, gone = 0, k, scale = 1 }) => {
  const a = clamp01(land);
  const g = clamp01(gone);
  const op = a * (1 - g);
  if (op <= 0.002) return null;
  // The placement: it arrives a little large and settles. Never below 1, so
  // nothing bounces.
  const s = lerp(1.12, 1, smoothstep(a));
  const sw = goStoneW(k, scale);
  return (
    <g style={{ filter: iconShadow(k) }} opacity={op.toFixed(4)}>
      {black ? (
        <circle
          cx={x}
          cy={y}
          r={r * s}
          fill={GO_BLACK}
          stroke={INK}
          strokeOpacity={INK_LO}
          strokeWidth={sw * GO_BLACK_EDGE}
        />
      ) : (
        <circle cx={x} cy={y} r={r * s} fill={INK} />
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// ONE BOARD — its lines, its star points, its nameplate and the stones that are
// on it at `frame`. Nothing else: no frame box, no label, no coordinates.
//
// `draw` 0..1 rules the board IN, from its top-left: every line is drawn from
// its own start, verticals downward and horizontals rightward, each one
// starting a little later than the last. A board that was already in the world
// when the cut opened simply passes draw = 1.
// ---------------------------------------------------------------------------
export const GO_DRAW_STAGGER = 0.55;

export const GoBoard: React.FC<{
  b: GoBoardSpec;
  frame: number;
  k: number;
  draw?: number;
  opacity?: number;
}> = ({ b, frame, k, draw = 1, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const d = clamp01(draw);
  const half = goHalf(b);
  const cell = GO_CELL * b.scale;
  const lw = goLineW(k, b.scale);
  const sr = GO_STONE_R * b.scale;
  const lines: React.ReactNode[] = [];
  const S = GO_DRAW_STAGGER;
  for (let i = 0; i < GO_N; i++) {
    const t = i / (GO_N - 1);
    const u = clamp01((d - t * S) / (1 - S));
    if (u <= 0) continue;
    const g = smoothstep(u);
    const off = -half + i * cell;
    lines.push(
      <line
        key={`v${i}`}
        x1={b.x + off}
        y1={b.y - half}
        x2={b.x + off}
        y2={b.y + half}
        pathLength={1}
        stroke={INK}
        strokeWidth={lw}
        strokeLinecap="butt"
        strokeDasharray={`${g.toFixed(4)} 1`}
      />,
      <line
        key={`h${i}`}
        x1={b.x - half}
        y1={b.y + off}
        x2={b.x + half}
        y2={b.y + off}
        pathLength={1}
        stroke={INK}
        strokeWidth={lw}
        strokeLinecap="butt"
        strokeDasharray={`${g.toFixed(4)} 1`}
      />,
    );
  }
  const rec = goRecordOf(b);
  const placed = boardMovesAt(b, frame);
  const stones: React.ReactNode[] = [];
  for (let i = 0; i < placed; i++) {
    const cap = rec.capturedAt[i];
    const gone =
      cap === Infinity ? 0 : clamp01((frame - goMoveFrame(b, cap)) / GO_CAPTURE_F);
    if (gone >= 1) continue;
    const [c, r] = rec.moves[i];
    const p = goStoneAt(b, c, r);
    stones.push(
      <Stone
        key={`${b.id}s${i}`}
        x={p.x}
        y={p.y}
        r={sr}
        black={goIsBlack(i)}
        land={clamp01((frame - goMoveFrame(b, i)) / GO_LAND_F)}
        gone={gone}
        k={k}
        scale={b.scale}
      />,
    );
  }
  return (
    <g opacity={opacity}>
      <g style={{ filter: iconShadow(k) }} opacity={INK_LO}>
        {lines}
        {d >= 1
          ? GO_STARS.map(([c, r]) => {
              const p = goStoneAt(b, c, r);
              return (
                <circle
                  key={`st${c}_${r}`}
                  cx={p.x}
                  cy={p.y}
                  r={GO_STAR_R * b.scale}
                  fill={INK}
                />
              );
            })
          : null}
      </g>
      {b.mark ? <DeepMindMark k={k} x={b.x} y={b.y - half - GO_MARK_GAP} /> : null}
      {stones}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE NAMEPLATE — the Google DeepMind mark, WHITE and filled, on the same terms
// as `ModelMark`: the shadow sits on a wrapper OUTSIDE the scale group, because
// inside it the filter would be authored in the glyph's own 24-unit space.
// ORANGE IS NEVER USED ON THIS SIDE OF THE WORLD: accent is our model and its
// level, in every cut of this clip.
// ---------------------------------------------------------------------------
/** The mark's em box, world px, and how far above the board's top line it sits. */
export const GO_MARK_PX = 90;
export const GO_MARK_GAP = 70;

export const DeepMindMark: React.FC<{
  k: number;
  x: number;
  y: number;
  em?: number;
  opacity?: number;
}> = ({ k, x, y, em = GO_MARK_PX, opacity = 1 }) => {
  if (!(em > 0) || opacity <= 0) return null;
  return (
    <g style={{ filter: iconShadow(k, undefined, undefined, MODEL_SHADOW_OPACITY) }} opacity={opacity}>
      <g
        transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${(em / 24).toFixed(
          6,
        )}) translate(-12 -12)`}
      >
        {DEEPMIND.paths.map((d) => (
          <path key={d.length} d={d} fill={INK} fillRule="evenodd" />
        ))}
      </g>
    </g>
  );
};

/** THE BOARDS DO NOT TOUCH, and a nameplate stands CLEAR of the board above it.
 *  The 1,020 world px between the two full boards is not decoration: the plate
 *  sits GO_MARK_GAP under board 2's top line and its own box is GO_MARK_PX, so
 *  anything under ~980 px of separation puts the AlphaZero mark through the
 *  AlphaGo board's foot. Run last, so every value it reads is initialised. */
export const GO_BOARD_BOXES = (() => {
  const boxes = BOARDS.map((b) => {
    const h = goHalf(b);
    return {
      id: b.id,
      x0: b.x - h,
      x1: b.x + h,
      y0: b.y - h - (b.mark ? GO_MARK_GAP + GO_MARK_PX / 2 : 0),
      y1: b.y + h,
    };
  });
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) {
        throw new Error(`challengeShared: boards ${a.id} and ${b.id} overlap.`);
      }
    }
  }
  return boxes;
})();
