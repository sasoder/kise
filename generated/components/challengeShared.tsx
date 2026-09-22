import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  clamp01,
  hash,
  iconShadow,
  smoothstep,
} from "./fieldShared";
import { INK, INK_HI, INK_LO, MODEL_SHADOW_OPACITY, TWO_PI, lerp } from "./trapShared";
import { OPENAI } from "./brandGlyphs";

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
