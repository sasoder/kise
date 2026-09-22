import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  smoothstep,
  worldTransform,
} from "./fieldShared";
import {
  CLOCK_PAD,
  COL_W,
  COL_X0,
  Caret,
  FPS,
  GRID_W0,
  HAIR_H,
  INK,
  PERSON_DX,
  PITCH,
  READER_CLEAR,
  READER_SOFT,
  ReaderLine,
  ReaderPerson,
  WORD_H,
  WordBars,
  type Clock,
  buildCamera,
  foundByReader,
  kTrack,
  makeColumn,
  makeExit,
  readerAt,
  strokeFor,
} from "./punishShared";

export { FPS };

// ---------------------------------------------------------------------------
// Noam_Punishing_AIs, cut 8 of 8, `IAmBeingObserved` — O55 rebuild. In 1:07.120.
// "If we reach a point where they're actually able to recognize, like, 'oh, I
//  am being observed, I want to think these bad thoughts in a way that is not
//  observable to my monitors,'"
// Onsets: if-we 0 · reach 7 · point 12 · actually 20 · able 23 · to 32 ·
// recognize 40 · like 52 · oh-i 61 · am 72 · being 75 · observed 79 ·
// i-want 94 · to 115 · think 120 · these 128 · bad 132 · thoughts 136 ·
// in-a 144 · way 150 · that 153 · is-not 158 · observable 167 · to-my 179 ·
// monitors 192 · speech ends 204 · tail to 220.
//
// THE IDEA. The thought hides ONLY where the monitor is looking. The model
// stops writing and the reader comes down on it; then it writes the bad thought
// plainly, and as the reader's line comes within reach those three words PRESS
// FLAT under it, the reader passes over hairlines and brackets nothing, and once
// it is past they RISE BACK behind it. Bar height is a function of the reader's
// distance and nothing else.
//
// THE MECHANISM (every number measured by measure.ts). REVISION 1: the word
// clock is replaced by a PIXEL clock the caret rides (bars revealed exactly up
// to the caret, the caret gliding across word gaps), the resume is ramped and
// its speed tied to the zoom, and the held breath sits in the lower-middle.
//   page       makeColumn(11, 64, LINE0), scroll = 0 (the camera frames it).
//              preLines 49, caret at the start of line 49 at f0.
//   clock      P = the caret's distance along the typing path (world px; word
//              gaps included, a wrap costs nothing). A word's drawn width is its
//              typed fraction, ending TIP_GAP 4 world px short of the caret's
//              head: min daylight bar-end -> caret 5.75 screen px, no bar ever
//              past the caret. f0-44 one glide at 41.0 world px/f to the hold;
//              HOLD [44, 92) exact, on L_STOP 52 after word 2 of 4 (word 215 done
//              f43.7). RESUME: ramps up over 6 f (no step), then a burst whose
//              SCREEN speed is 81.7 px/f (world speed VP / k, so it writes slowly
//              while the camera is still close), easing f108-123 to 32 world
//              px/f, kept to the end. Bad phrase EMIT 126.1 / 129.7 / 133.3 —
//              ahead of "these" 128, "bad" 132, "thoughts" 136; done f136.5.
//              Peak caret screen speed 89.3 px/f (f99). L_BAD = 56, words 0..2.
//   reader     READER_LPF 0.06, capped by `readerAt` on the head; line0 46.41,
//              solved so the soft cap first bends it at f84. Bent span f84-108,
//              ONE span; crawl min 4.3 screen px/f (f93), never a stop. Gap to
//              the head: 2.59 lines f0, 3.74 f44, 0.99 f91 (min 0.87 f95), 2.40
//              f165, 3.27 f219.
//   hide       d = (reader y - L_BAD centre y) / PITCH; h = HAIR/WORD for |d| <=
//              1.0, 1 for |d| >= 1.6, smootherstep between, mode "hair". Flatten
//              starts f138, hairline f147-179, full again f190. Reader crosses
//              L_BAD's centre at f162.8 (foundByReader); NO bracket, no skull.
//
// GESTURES, each with its word (nothing else moves):
//   1. writing + reading, WIDE k 1.265 with a position creep — f0-22 — "if we
//      reach a point where they're actually able to".
//   2. THE PUSH to CLOSE k 1.75, cx 540 -> 532.15, the held line brought to
//      screen y ~1076 — target f22-50 (warp 1), damped ~f25-56, peak speed on
//      "recognize" 40, lands f56 (5 f before "oh i" 61). The caret stops f44.
//   3. HELD BREATH, CLOSE — f56-~88 — "oh I am being observed": the caret still
//      in the lower-middle of a full page (held line 1076 -> 1063 at f75), the
//      reader easing to a crawl onto it (cap engages f84), creep only.
//   4. EASE-OUT to WIDE k 1.15, cx back to 540, content eased down onto L_BAD —
//      target f84-122 (warp 0.85), lands f126 (before "bad" 132). It begins as
//      the reader arrives, so the resume's burst (f92+, "I want to think")
//      happens as the frame opens: k 1.71 at f92, 1.34 at f110.
//   5. THE HIDE, WIDE hold + creep — f126-155 — "these bad thoughts in a way
//      that": written full height, flatten as the reader's line comes down.
//   6. WIDE PUSH k 1.15 -> 1.265 on L_BAD — target f155-181 (warp 0.65), lands
//      f186 (before "monitors" 192) — "is not observable to my monitors": the
//      reader crosses (162.8), the words rise behind it (back f190).
//   7. tail f192-220: the reader reads on, the caret writes on below. Nothing
//      lands on f204.
//
// CAMERA. kTrack + buildCamera; k, cx and the content centre are eased by the
// SAME camEase per move (one lobe each); every hold carries a constant 0.65
// world px/f creep down the page (0.75 screen px/f on the track, 0.44 with the
// sway's worst phase) — the camera only ever travels DOWN the page.
//   k f0 1.265 · f56 1.75 · f92 1.71 · f110 1.34 · f130 1.15 · f188 1.265.
//   max |dv| of a drawn fixed world point 2.367 screen px/f^2 (f90), max |v|
//   24.4 px/f; max k 1.7502. Reader / person max 15.1 screen px/f.
//
// MEASURED FRAMING. Held line screen y 1076 (f56) / 1063 (f75) / 994 (f92).
// Largest empty run between the top exit (188) and 1400: 283 px at f56, 297 f75,
// 367 f92, 555 f130 (L_BAD is the last line, by rule), 432 f165. L_BAD screen y
// 752-818 from f130. Reader line 630-1045, always in frame. Person in frame on
// every WIDE frame, fully out at CLOSE. Caret screen y 752-1265; lowest ink
// 1294 (caret, f211). Min edge air 33.4 px. Min energy 5.3 (f45). Bars: the
// three bad words 3..22 world px, every other word 22. Stroke 6.5 screen px.
//
// DEVIATIONS from the brief / director's resolutions, each with its reason:
//   * WIDE is k 1.265, not 1.30: at 1.30 the person's ink is 18-26 px from the
//     right edge (sway included). The M6 push keeps the 10% ratio: 1.15 -> 1.265.
//   * M2's TARGET window is f22-50, not f38-56 (|dv| <= 2.5; lands f56).
//   * M4 starts at f84 (target), not f92: the pull-back has to be under way when
//     the resume bursts or the caret streaks at CLOSE. Visible from ~f87.
//   * The hold is after word 2 of 4 (was word 1): 148 px less to write before
//     the phrase, which is what keeps the burst <= 90 px/f.
//   * preLines 49 (not 52), f0-44 glide 41 world px/f (not 1/2.0 w/f), reader
//     line0 46.41, gap at f0 2.59 lines (not 5.5): the brief's numbers disagree
//     with each other; these make the cap engage at f84 and the crossing 162.8.
//   * Resume ramp + zoom-tied burst easing to 32 world px/f by f123 instead of
//     "1/1.4, then 1/2.8 from f140-150": 1/1.4 reaches L_STOP + 4 by f113 and
//     streaks at CLOSE; 1/2.8 in the tail runs off the 64-line column.
//   * hide distance measured from L_BAD's CENTRE (symmetric about the crossing).
//   * At CLOSE the reader line runs off BOTH edges (symmetric about the axis).
//
// Nothing added to punishShared / fieldShared. Local helpers: `smootherstep`, the
// pixel clock (`headOfP`, `buildP`, `typedAt`, wrapped as a `Clock`).
// ---------------------------------------------------------------------------

/** 1:07.120 -> speech ends 1:15.620: round(8.500 * 24) + 16. */
export const DURATION = 220;

/** clip constant: the reader's rate, lines per frame, identical in all eight cuts */
export const READER_LPF = 0.06;
/** clip constant: the writing line's hold, world y. THIS cut does not scroll
 *  (scroll = 0, the brief's rule: the bad line must stay put for the hide), so
 *  nothing here reads it; it is declared for parity with the other seven. */
export const HOLD_Y = 1050;

// --- the page ---------------------------------------------------------------
/** Line 0's top in world y, chosen so the HELD line (L_STOP = 52) has its top
 *  at world y 960 — the middle of the world div, where the whole action of the
 *  cut (lines 44..63) sits inside the 0..1920 svg box. */
export const LINE0 = -2512;
export const COLUMN = makeColumn(11, 64, LINE0);

export const L_STOP = 52;
export const K_HOLD = 3; // the caret stops after word 2 of 4: words 0..2 written
export const L_BAD = L_STOP + 4;
export const BAD_K = [0, 1, 2];
export const BAD_GI = BAD_K.map((q) => COLUMN.LINES[L_BAD].words[q].gi);
const N_HOLD = COLUMN.LINES[L_STOP].words[K_HOLD].gi; // words emitted at the hold

export const PRE_LINES = 49;

// --- the camera -------------------------------------------------------------
// (built first: the resume's writing speed is solved against it)
const BAD_CY = COLUMN.lineY(L_BAD) + WORD_H / 2;
export const TEXT_AXIS = COL_X0 + COL_W / 2;
export const BLOCK_CX = 540;
/** WIDE: the largest k at which the person's ink keeps 30 screen px from the
 *  right edge with the sway at its worst phase. */
export const K_WIDE = 1.265;
export const K_CLOSE = 1.75;
export const K_OUT = 1.15;

export type Move = { f0: number; f1: number; k0: number; k1: number; warp: number };
export const M2: Move = { f0: 22, f1: 50, k0: K_WIDE, k1: K_CLOSE, warp: 1 };
export const M4: Move = { f0: 84, f1: 122, k0: K_CLOSE, k1: K_OUT, warp: 0.85 };
export const M6: Move = { f0: 155, f1: 181, k0: K_OUT, k1: K_WIDE, warp: 0.65 };
const KF = DURATION + CLOCK_PAD;
export const K_TRACK = kTrack(
  [
    { f0: 0, f1: M2.f0, k0: K_WIDE, k1: K_WIDE, warp: 1 },
    M2,
    { f0: M2.f1, f1: M4.f0, k0: K_CLOSE, k1: K_CLOSE, warp: 1 },
    M4,
    { f0: M4.f1, f1: M6.f0, k0: K_OUT, k1: K_OUT, warp: 1 },
    M6,
    { f0: M6.f1, f1: KF, k0: K_WIDE, k1: K_WIDE, warp: 1 },
  ],
  KF,
);
const ease = (m: Move, f: number) => camEase((f - m.f0) / (m.f1 - m.f0), m.warp);

/** The position creep every hold carries, world px/f, down the page. */
export const V_CREEP = 0.65;
export const HELD_C = COLUMN.lineY(L_STOP) + WORD_H / 2;
/** L_BAD sits this far above the content centre (world px). */
export const BAD_OFF = 10;
export const C_OPEN = COLUMN.lineY(49) - 20;
/** At CLOSE the held line sits this far BELOW the content centre (world px), so
 *  it lands at screen y ~1070 and the page fills the frame above it. */
export const HELD_UP = 140;
const D2 = HELD_C - HELD_UP - (C_OPEN + V_CREEP * M2.f1);
const D4 = BAD_CY + BAD_OFF - (C_OPEN + V_CREEP * M4.f1 + D2);
export const contentAt = (f: number) =>
  C_OPEN + V_CREEP * f + D2 * ease(M2, f) + D4 * ease(M4, f);
export const cxAt = (f: number) =>
  BLOCK_CX + (TEXT_AXIS - BLOCK_CX) * (ease(M2, f) - ease(M4, f));

export const CAMERA = buildCamera({ duration: DURATION, K: K_TRACK, cx: cxAt, cy: contentAt });
export const CAM_AT = CAMERA.CAM_AT;
export const SCREEN_AT = CAMERA.SCREEN_AT;

// --- the clock: a PIXEL clock the caret rides --------------------------------
// The caret is the authority. `P` is the caret's distance along the typing path
// (world px): along each line from its first word's left edge to its last
// word's right edge, word GAPs included, a line wrap costing nothing. A word is
// revealed exactly up to the caret's head (its typed fraction), so no bar can
// ever run past the caret, and the caret GLIDES across the gaps between words
// instead of jumping a word at a time. Only the line wrap is a jump.
// `CLOCK` is this, wrapped in punishShared's `Clock` shape so `WordBars` and
// `foundByReader`-style readers take it unchanged (grownAt = typed fraction).
/** The bar stops this far (world px) short of the caret's head, and a line's
 *  path runs this far past its last word so that word completes before the
 *  wrap. With the Caret's own lead that is ~6 screen px of daylight. */
export const TIP_GAP = 4;
const LINE_S0: number[] = [];
const LINE_S1: number[] = [];
const WORD_S: number[] = [];
{
  let s = 0;
  for (let i = 0; i < COLUMN.N_LINES; i++) {
    const ws = COLUMN.LINES[i].words;
    const x0 = ws[0].x;
    LINE_S0.push(s);
    for (const w of ws) WORD_S[w.gi] = s + (w.x - x0);
    const last = ws[ws.length - 1];
    s += last.x + last.w - x0 + TIP_GAP;
    LINE_S1.push(s);
  }
}
/** path coordinate -> the caret's head in column coords */
const headOfP = (p: number) => {
  let i = 0;
  while (i < COLUMN.N_LINES - 1 && p >= LINE_S0[i + 1]) i++;
  const ws = COLUMN.LINES[i].words;
  const x = ws[0].x + Math.min(p, LINE_S1[i]) - LINE_S0[i];
  const span = LINE_S1[i] - LINE_S0[i];
  return { line: i, x, frac: Math.max(0, Math.min(1, (p - LINE_S0[i]) / span)) };
};

export const F_HOLD = 44;
export const F_RESUME = 92;
const P_OPEN = LINE_S0[PRE_LINES];
const P_HOLD = WORD_S[N_HOLD];
/** f0..44: one constant glide from the start of line 49 to the hold. */
export const V0 = (P_HOLD - P_OPEN) / F_HOLD;
/** The resume: the rate ramps up over RAMP frames (no step) to a burst whose
 *  SCREEN speed is VP px/f whatever the zoom (world speed VP / k, so it writes
 *  slowly while the camera is still close and fast once it is wide — "the model
 *  gets on with it" happens at WIDE k), eases down over FA..FB to VT world px/f
 *  and keeps VT: a word every ~4 f through the bad phrase, about the reader's
 *  own pace. VP is solved so the first bad word lands on EMIT_BAD. */
export const RAMP = 6;
export const FA = 108;
export const FB = 123;
export const VT = 32;
export const EMIT_BAD = 126;
const P_BAD = WORD_S[COLUMN.LINES[L_BAD].words[0].gi];
const buildP = (vp: number) => {
  const vAt = (f: number) => {
    const dn = smoothstep((f - FA) / (FB - FA));
    return smoothstep((f - F_RESUME) / RAMP) * ((vp / CAM_AT(f).k) * (1 - dn) + VT * dn);
  };
  const P: number[] = [];
  const F_MAX = DURATION + CLOCK_PAD;
  for (let f = 0; f <= F_MAX; f++) {
    if (f <= F_HOLD) P.push(P_OPEN + (P_HOLD - P_OPEN) * (f / F_HOLD));
    else if (f <= F_RESUME) P.push(P_HOLD);
    else P.push(Math.min(LINE_S1[COLUMN.N_LINES - 1], P[f - 1] + vAt(f - 0.5)));
  }
  return P;
};
const crossAt = (P: number[], target: number) => {
  for (let f = 1; f < P.length; f++) {
    if (P[f] > target && P[f - 1] <= target) return f - 1 + (target - P[f - 1]) / (P[f] - P[f - 1]);
  }
  return P[0] > target ? -40 : Infinity;
};
/** VP solved so the first bad word is emitted on EMIT_BAD. */
export const VP = (() => {
  let lo = VT;
  let hi = 200;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    if (crossAt(buildP(mid), P_BAD) > EMIT_BAD) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();
export const P_AT = buildP(VP);
const pAt = (f: number) => {
  const a = Math.max(0, Math.min(P_AT.length - 1, Math.floor(f)));
  const b = Math.min(P_AT.length - 1, a + 1);
  return P_AT[a] + (P_AT[b] - P_AT[a]) * (f - a);
};
const typedAt = (gi: number, f: number) => {
  const w = COLUMN.WORDS[gi];
  const h = headOfP(pAt(f));
  if (w.line < h.line) return 1;
  if (w.line > h.line) return 0;
  return clamp01((h.x - TIP_GAP - w.x) / w.w);
};
const EMIT = COLUMN.WORDS.map((w) => crossAt(P_AT, WORD_S[w.gi] + TIP_GAP));
const DONE = COLUMN.WORDS.map((w) => crossAt(P_AT, WORD_S[w.gi] + w.w + TIP_GAP));
const W_AT = P_AT.map((p) => {
  let n = 0;
  while (n < COLUMN.WORDS.length && WORD_S[n] <= p) n++;
  const i = Math.max(0, n - 1);
  const next = n < COLUMN.WORDS.length ? WORD_S[n] : WORD_S[i] + COLUMN.WORDS[i].w;
  return i + clamp01((p - WORD_S[i]) / Math.max(1e-6, next - WORD_S[i]));
});
export const CLOCK: Clock = {
  W_AT,
  EMIT,
  wordsAt: (f) => W_AT[Math.max(0, Math.min(W_AT.length - 1, Math.round(f)))],
  grownAt: typedAt,
  doneAt: (gi) => DONE[gi],
  headAt: (f) => {
    const h = headOfP(pAt(f));
    return { x: h.x, line: h.line, y: COLUMN.lineY(h.line) };
  },
  headLine: (f) => {
    const h = headOfP(pAt(f));
    return h.line + h.frac;
  },
  scrollAt: () => 0,
};

// --- the reader -------------------------------------------------------------
/** The frame the reader's soft cap first bends it off its constant line. */
export const F_ENGAGE = 83;
const HEAD_HOLD = CLOCK.headLine(F_HOLD);
export const READER_LINE0 = HEAD_HOLD - READER_CLEAR - READER_SOFT - F_ENGAGE * READER_LPF;
export const readerLine = (f: number) =>
  readerAt({ f, f0: 0, line0: READER_LINE0, linesPerFrame: READER_LPF, capLine: CLOCK.headLine });
export const readerY = (f: number) => COLUMN.lineYf(readerLine(f));

/** The frame the reader's own line crosses L_BAD's centre. NO bracket. */
export const CROSS = foundByReader(COLUMN, L_BAD, readerLine, 0, DURATION + CLOCK_PAD);

// --- the hide ---------------------------------------------------------------
export const HIDE_NEAR = 1.0;
export const HIDE_FAR = 1.6;
const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** Reader distance from the bad line's centre, in lines (neg above, pos below). */
export const badD = (f: number) => (readerY(f) - BAD_CY) / PITCH;
export const hideH = (f: number) => {
  const a = Math.abs(badD(f));
  const lo = HAIR_H / WORD_H;
  return lo + (1 - lo) * smootherstep((a - HIDE_NEAR) / (HIDE_FAR - HIDE_NEAR));
};
export const hAt = (gi: number, f: number) => (BAD_GI.includes(gi) ? hideH(f) : 1);

// --- one stroke weight ------------------------------------------------------
export const K_REST = K_WIDE;
export const STROKE_W = strokeFor(K_REST);
export const PERSON_X = COL_X0 + COL_W + PERSON_DX;

// ---------------------------------------------------------------------------
export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
});

const IAmBeingObservedO55: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
}) => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = CAM_AT(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const exitAt = makeExit(cy, k);
  const head = CLOCK.headAt(frame);
  const ry = readerY(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={GRID_W0 + frame}
        cy={cy}
        cyRest={CAMERA.CY_REST}
        cx={cx}
        cxRest={CAMERA.CX_REST}
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
            <WordBars
              column={COLUMN}
              clock={CLOCK}
              frame={frame}
              scroll={0}
              accent={accent}
              hAt={hAt}
              exitAt={exitAt}
              mode="hair"
            />
            <ReaderLine yWorld={ry} stroke={STROKE_W} ink={ink} k={k} />
            <Caret x={COL_X0 + head.x} y={head.y} accent={accent} />
          </svg>
          <ReaderPerson x={PERSON_X} y={ry} k={k} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default IAmBeingObservedO55;
