import React from "react";
import { AbsoluteFill } from "remotion";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  feather,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  BLOB_N,
  FONT_LABEL,
  INK,
  INK_HI,
  INK_LO,
  LABEL_IN,
  LABEL_PX,
  LABEL_RISE_PX,
  LABEL_TRACKING,
  LABEL_WEIGHT,
  PACKET_R_PX,
  STROKE_PX,
  THREAD_PX,
  arcTo,
  blobAt,
} from "./alignShared";
import {
  CARET_H,
  CARET_LEAD,
  CARET_W,
  FLAG_PAD_X,
  FLAG_PAD_Y,
  GAP,
  INDENT,
  PITCH,
  WORD_H,
  curve,
  roundRect,
} from "./punishShared";
import { OPENAI } from "./brandGlyphs";

// ---------------------------------------------------------------------------
// incidentSharedV2 — FILM A of `Noam_Airgapping`, V2 LAYOUT (copy of incidentShared.tsx,
// which stays frozen for the delivered V1 cuts): "it was all written down".
//
// Orange Dwarkesh, grid background, 24 fps, 1080x1920, opaque, muted.
//
// ONE WORLD, ONE GLOBAL CLOCK. G = round((t - 8.560) * 24). Every cut of film A
// renders `<IncidentWorld G={G0 + f} cam={...} />` and nothing in here is keyed
// to a cut; the unshown gaps keep the world running.
//
// THE IDEA. The chain of thought is the spine of the film AND its time axis:
// one column of white word-bars being written by a solid white caret, with a
// month rail in the left margin (APR MAY JUN JUL AUG), four lines a month.
// Inside May, June and July ONE line each is written in ORANGE word-bars: the
// swarm's plan, in plain sight, in the same text as everything else.
// To the RIGHT of the column stands what each swarm reaches: TRAINING (a loop
// with a packet), EVALUATION (a checklist of fails), INFRASTRUCTURE (three
// racks of five units under the OpenAI mark).
//
// V2 LAYOUT (2026-09-23, the user's "one idea per frame"): the column (rail +
// months + text) is its own place, centred on x 540; the stations are a second
// place far to the right (ST_CX 1420), top to bottom in the months' order but
// spread (ST_GAP) so each one is framed ALONE at its close-up. The camera
// travels between the two places and never frames both, except the scope wides
// (26's pull-back, 47's ending). The swarms are born out of their plan-lines,
// hover just right of the text (inside the column framing), then FLY to their
// stations (`approachTravel`: close in straight, swing round late) with the
// camera following. Everything else (look, clock, conversions, hooks) is V1's.
//
// VOCABULARY — fixed for the film:
//   ORANGE = the rogue AI and everything it does. ACCENT_DEEP = dormant,
//     ACCENT = acting / lit. Tone carries the ladder, never alpha; dots are
//     solid with no stroke. Nothing decorative is ever orange.
//   WHITE INK at exactly INK_HI (1.0, the subject) and INK_LO (0.55, context).
//     Freshly written words are INK_HI and settle to INK_LO over FRESH_F
//     frames (a fade in transit, not a third rung).
//   A SWARM = ~48 solid orange dots, a feathered superellipse crowd; born OUT
//     OF its plan-line (the dots boil out of the word-bars), waits beside the
//     column, then flows round its station, which converts where the crowd
//     reaches it (derived from the dots' positions, never a timer).
//
// LAYERS, bottom to top: grid -> WHITE world (rail, words, stations' white
// state, caret, labels) -> the DIM VEIL (screen space, with an optional lit
// window) -> ORANGE world (plan-lines, swarms, converted strokes, threads) ->
// the cut's own overlays (`overSvg`, `overDom`) -> vignette. That order is why
// `dim` darkens the humans' world while the orange stays full.
//
// A cut MAY: choose its camera, read any export, layer overlays. It MAY NOT:
// edit this file (append-only requests go in the briefs' WORLD_A_V2_READY.md).
// ---------------------------------------------------------------------------

export const FPS = 24;
/** G = round((t - FILM_T0) * 24) */
export const FILM_T0 = 8.56;

// ---------------------------------------------------------------------------
// SIZES. The film's resting whole-period framing is K_REST; every object size
// is written as SCREEN px at K_REST and stored in world px, so at rest a stroke
// is STROKE_PX (6.5) on screen, a dot 14, a label 40 * K_REST.
// ---------------------------------------------------------------------------
export const K_REST = 0.9;
export const STROKE = STROKE_PX / K_REST; // icon outlines, the one weight
export const THREAD = THREAD_PX / K_REST; // rail, threads
/** The brief's agent dot: 14 screen px across at rest. */
export const SWARM_DOT_D_PX = 14;
export const DOT_R = SWARM_DOT_D_PX / 2 / K_REST;
export const PACKET_R = (PACKET_R_PX * 1.5) / K_REST;
export const LABEL_SIZE = LABEL_PX; // world px; 36 screen at K_REST
/** person.png box a cut should use for the humans: 118 screen px at K_REST. */
export const PERSON_BOX = 118 / K_REST;

const TONE = makeTone(ACCENT_DEEP, ACCENT);
export const toneOf = (t: number) => TONE(t);

// ---------------------------------------------------------------------------
// THE COLUMN. World x: rail labels | rail | text | waiting zone | stations.
// ---------------------------------------------------------------------------
export const COL_W = 400;
// V2 LAYOUT (2026-09-23, "one idea per frame"): the column (rail + months +
// text) is centred on x 540 on its own, and the stations stand far to the
// RIGHT, out of every column framing; the camera travels between them.
export const COL_X0 = 402;
export const COL_X1 = COL_X0 + COL_W;
export const COL_CX = COL_X0 + COL_W / 2;
export const RAIL_X = COL_X0 - 30;
export const TICK_LEN = 14;
/** month labels are right-aligned to this x */
export const MONTH_LABEL_R = RAIL_X - TICK_LEN - 10;

export const LINES_PER_MONTH = 4;
export const MONTHS = ["APR", "MAY", "JUN", "JUL", "AUG"] as const;
export const MONTH_GAP = 28;
export const MONTH_H = LINES_PER_MONTH * PITCH + MONTH_GAP; // 284
/** after AUG the text keeps going in unlabelled 4-line paragraphs */
export const POST_PARA_GAP = 16;
export const N_LINES = 110;
export const MONTH_LINES = MONTHS.length * LINES_PER_MONTH; // 20

export type IWord = { line: number; x: number; w: number; gi: number };
export type ILine = { y0: number; words: IWord[]; plan: number };

/** Plan-lines: MAY line 1, JUN line 0, JUL line 0 (line indices 5, 8, 12). */
export const PLAN_LINE_IDX = [5, 8, 12] as const;

const colSalt = 29;
const H = (i: number, k: number) => hash(i + colSalt * 1013, k + colSalt * 3);

export const LINES: ILine[] = (() => {
  const out: ILine[] = [];
  let gi = 0;
  let y = 0;
  for (let i = 0; i < N_LINES; i++) {
    const inPara = i % LINES_PER_MONTH;
    if (i > 0 && inPara === 0) y += i < MONTH_LINES ? MONTH_GAP : POST_PARA_GAP;
    const indent = inPara === 0 && H(i, 9) > 0.35 ? INDENT : 0;
    const room = COL_W - indent;
    const last = inPara === LINES_PER_MONTH - 1;
    const plan = PLAN_LINE_IDX.indexOf(i as 5 | 8 | 12);
    const target = last
      ? room * (0.42 + 0.26 * H(i, 5))
      : plan >= 0
        ? room * 0.84
        : room * (0.72 + 0.28 * H(i, 7));
    const words: IWord[] = [];
    let x = indent;
    let n = 0;
    while (n < 5) {
      // a plan-line is a normal-looking line of four words
      let w = plan >= 0 ? 52 + 50 * H(gi, 11) : 44 + 92 * H(gi, 11);
      if (n >= (plan >= 0 ? 4 : 3) && x + w > target) break;
      if (x + w > room) {
        if (n >= 2) break;
        w = Math.max(34, room - x);
      }
      words.push({ line: i, x, w, gi });
      x += w + GAP;
      gi++;
      n++;
      if (x > target && n >= (plan >= 0 ? 4 : 3)) break;
    }
    out.push({ y0: y, words, plan });
    y += PITCH;
  }
  return out;
})();

export const WORDS: IWord[] = LINES.flatMap((l) => l.words);
export const N_WORDS = WORDS.length;
export const lineTop = (i: number) => LINES[Math.max(0, Math.min(N_LINES - 1, Math.round(i)))].y0;
export const lineCY = (i: number) => lineTop(i) + WORD_H / 2;
/** fractional line index -> its top, continuous */
export const lineTopF = (t: number) => {
  const i = Math.max(0, Math.min(N_LINES - 2, Math.floor(t)));
  return lineTop(i) + (lineTop(i + 1) - lineTop(i)) * (t - i);
};
export const monthTop = (m: number) => lineTop(m * LINES_PER_MONTH);
/** a line's right end in world x */
export const lineRight = (i: number) => {
  const ws = LINES[i].words;
  const l = ws[ws.length - 1];
  return COL_X0 + l.x + l.w;
};

// ---------------------------------------------------------------------------
// THE WORD CLOCK. One table: words emitted by G (continuous). Head, caret, rail
// and freshness are all read off it.
// ---------------------------------------------------------------------------
export const G_PRE = -60;
export const G_MAX = 1400;
/** words already on the page at G0: APR's third line is being written
 *  (director's note 2026-09-23: f0 is a page being written, not a blank) */
export const W_AT_G0 = 7.5;
/** the G0 page the rest of the film was measured against (pre 2026-09-23).
 *  Only used to pin the clock from G_AUG_TARGET on, so nothing any later cut
 *  relies on moves when the opening page changes. */
const W_AT_G0_PINNED = 4.6;
export const R_NORM = 0.165; // words / frame: a legible writing pace at k 1.7
export const R_SLOW = 0.035; // the long steady rate after the incident
export const R_FUT = 0.2; // the future burst cut 4 watches
const lineStartGi = (i: number) => LINES[i].words[0].gi;
/** G at which AUG line 0 begins being written (the rail reaches AUG) */
export const G_AUG_TARGET = 77;

const rateShapePinned = (G: number, rFast: number) => {
  const up = smoothstep((G - 30) / 18);
  const down = smoothstep((G - 58) / 24);
  let r = R_NORM + (rFast - R_NORM) * up * (1 - down);
  const slow = smoothstep((G - 100) / 36);
  r = r + (R_SLOW - r) * slow;
  const fu = smoothstep((G - 684) / 18) * (1 - smoothstep((G - 752) / 24));
  r += (R_FUT - R_SLOW) * fu;
  return r;
};

// THE FUTURE TIME-LAPSE (2026-09-23, for cut 4): from G_FUT0 the clock
// accelerates past NOW the way cut 1's did (the caret rides the rail), writes
// FUTURE_LINES lines by G_FUT_GOAL, then eases back to R_SLOW. Before G_FUT0
// nothing changes.
export const G_FUT0 = 699;
export const FUTURE_LINES = 8;
export const G_FUT_GOAL = 737;
const R_AT_FUT0 = rateShapePinned(G_FUT0, 1);
const futureShape = (G: number, rFF: number) => {
  // the rate climbs only once the caret has stepped onto the rail (NOW's line
  // starts ~G702, the step takes W_UP_F), so the caret never sweeps a line fast
  const up = smoothstep((G - 707) / 12);
  const down = smoothstep((G - 726) / 14);
  const base = R_AT_FUT0 + (R_SLOW - R_AT_FUT0) * smoothstep((G - 726) / 22);
  return base + (rFF - R_AT_FUT0) * up * (1 - down);
};
let R_FF_CUR = 1;
const rateShape = (G: number, rFast: number) =>
  G < G_FUT0 ? rateShapePinned(G, rFast) : futureShape(G, R_FF_CUR);

const buildW = (w0At0: number, rFast: number, rTail: number) => {
  const W: number[] = [];
  let w = w0At0;
  // integrate backwards to G_PRE at R_NORM so G0 holds w0At0 exactly
  let w0 = w0At0 - R_NORM * -G_PRE;
  for (let g = G_PRE; g < 0; g++) {
    W.push(w0);
    w0 += R_NORM;
  }
  for (let g = 0; g <= G_MAX; g++) {
    W.push(w);
    w += rateShape(g, g < G_AUG_TARGET ? rFast : rTail);
  }
  return W;
};

/** the fast rate that lands AUG line 0 on G_AUG_TARGET from a given G0 page */
const solveFast = (w0At0: number, rTail: number) => {
  const goal = lineStartGi(16);
  let lo = 0.3;
  let hi = 4;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    const at = buildW(w0At0, mid, rTail)[G_AUG_TARGET - G_PRE];
    if (at < goal) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
/** the tail of the time-lapse (G77-82) keeps the rate it had when the other
 *  cuts were measured: W from G77 on is identical to the pinned clock */
const R_FAST_TAIL = (() => {
  // with the pinned page, the tail rate equals the fast rate (self-consistent)
  let r = 1;
  for (let it = 0; it < 8; it++) r = solveFast(W_AT_G0_PINNED, r);
  return r;
})();
export const R_FAST = solveFast(W_AT_G0, R_FAST_TAIL);
/** NOW is the line started at G702 on the pinned clock (26); the future burst
 *  must complete FUTURE_LINES lines past it by G_FUT_GOAL */
export const NOW_LINE = 26;
export const R_FUTURE_FAST = (() => {
  const goal = lineStartGi(NOW_LINE + FUTURE_LINES);
  let lo = 0.2;
  let hi = 4;
  for (let it = 0; it < 50; it++) {
    const mid = (lo + hi) / 2;
    R_FF_CUR = mid;
    const at = buildW(W_AT_G0, R_FAST, R_FAST_TAIL)[G_FUT_GOAL - G_PRE];
    if (at < goal) lo = mid;
    else hi = mid;
  }
  R_FF_CUR = (lo + hi) / 2;
  return R_FF_CUR;
})();
export const rateAt = (G: number) =>
  G < 0 ? R_NORM : rateShape(G, G < G_AUG_TARGET ? R_FAST : R_FAST_TAIL);
const W_TABLE = buildW(W_AT_G0, R_FAST, R_FAST_TAIL);

/** continuous words-emitted at G (linear between frames) */
export const wordsAt = (G: number) => {
  const t = Math.max(G_PRE, Math.min(G_MAX, G)) - G_PRE;
  const i = Math.floor(t);
  const a = W_TABLE[Math.min(W_TABLE.length - 1, i)];
  const b = W_TABLE[Math.min(W_TABLE.length - 1, i + 1)];
  return a + (b - a) * (t - i);
};
/** the G at which word gi starts (fractional) */
export const EMIT: number[] = (() => {
  const out: number[] = [];
  let f = 0;
  for (let gi = 0; gi < N_WORDS; gi++) {
    while (f < W_TABLE.length - 1 && W_TABLE[f + 1] <= gi) f++;
    const a = W_TABLE[f];
    const b = W_TABLE[Math.min(W_TABLE.length - 1, f + 1)];
    out.push(G_PRE + (b > a ? f + (gi - a) / (b - a) : f));
  }
  return out;
})();
export const doneAtWord = (gi: number) => (gi + 1 < N_WORDS ? EMIT[gi + 1] : Infinity);
/** G at which line i starts being written */
export const lineStartG = (i: number) => EMIT[lineStartGi(i)];

/** the writing head: which word, how far through it, its line (fractional) */
export const headAt = (G: number) => {
  const w = wordsAt(G);
  const i = Math.max(0, Math.min(N_WORDS - 1, Math.floor(w)));
  const word = WORDS[i];
  const g = clamp01(w - i);
  const l = LINES[word.line];
  const k = word.gi - l.words[0].gi;
  const lineF = word.line + (k + g) / l.words.length;
  // the caret crosses the word AND the gap after it, so it never jumps a gap
  const span = k < l.words.length - 1 ? word.w + GAP : word.w;
  return { x: COL_X0 + word.x + span * g, line: word.line, lineF, y: lineTop(word.line) };
};

// ---------------------------------------------------------------------------
// THE CARET AND THE RAIL. During the time-lapse the caret leaves the text and
// rides the rail's head (a vertical run inside the speed cap) while the lines
// roll out to its right; it rejoins the writing head as the rate eases back.
// ---------------------------------------------------------------------------
/** blend 0 = caret on the text head, 1 = caret on the rail head */
export const W_UP0 = (() => {
  // start the move onto the rail at the first line wrap at or after G26
  for (let i = 1; i < N_LINES; i++) if (lineStartG(i) >= 26) return lineStartG(i);
  return 26;
})();
export const W_UP_F = 10;
export const W_DOWN0 = lineStartG(16); // AUG line 0 begins
export const W_DOWN_F = 16;
/** the future time-lapse rides the rail too: onto it as NOW's line starts,
 *  off it at the first wrap once the rate has fallen below 0.3 w/f */
export const W_UP2 = lineStartG(NOW_LINE);
export const W_DOWN2 = (() => {
  let g = G_FUT0 + 20;
  while (g < G_MAX && rateAt(g) > 0.3) g++;
  for (let i = NOW_LINE; i < N_LINES; i++) if (lineStartG(i) >= g) return lineStartG(i);
  return g;
})();
export const railBlend = (G: number) =>
  Math.max(
    smoothstep((G - W_UP0) / W_UP_F) * (1 - smoothstep((G - W_DOWN0) / W_DOWN_F)),
    smoothstep((G - W_UP2) / W_UP_F) * (1 - smoothstep((G - W_DOWN2) / W_DOWN_F)),
  );

/** the rail starts drawing down from APR as the time-lapse begins */
export const RAIL_G0 = W_UP0 - 4;
export const RAIL_TOP = lineTop(0) - 12;
export const RAIL_DRAW_V = 26; // world px / frame while it catches the head
const railCatch = (G: number) => RAIL_TOP + RAIL_DRAW_V * Math.max(0, G - RAIL_G0);
/** the y the head is writing at, continuous (the rail's target): during the
 *  time-lapse the fractional line, otherwise the current line's centre eased
 *  over RAIL_STEP_F frames from the line above at each wrap */
export const RAIL_STEP_F = 8;
export const headYF = (G: number) => {
  const h = headAt(G);
  const cont = lineTopF(h.lineF) + WORD_H / 2;
  const l = h.line;
  const prev = l > 0 ? lineCY(l - 1) : lineCY(0);
  const disc = prev + (lineCY(l) - prev) * smoothstep((G - lineStartG(l)) / RAIL_STEP_F);
  const b = railBlend(G);
  return disc + (cont - disc) * b;
};
const smin = (a: number, b: number, e: number) => {
  const h = clamp01(0.5 + (b - a) / (2 * e));
  return b + (a - b) * h - e * h * (1 - h);
};
const railRaw = (G: number) =>
  G < RAIL_G0 ? RAIL_TOP : Math.max(RAIL_TOP, smin(railCatch(G), headYF(G), 30));
/** the rail never un-draws: a running max of its target, per frame */
const RAIL_TABLE: number[] = (() => {
  const out: number[] = [];
  let m = RAIL_TOP;
  for (let g = G_PRE; g <= G_MAX; g++) {
    m = Math.max(m, railRaw(g));
    out.push(m);
  }
  return out;
})();
export const railHeadAt = (G: number) => {
  const t = Math.max(G_PRE, Math.min(G_MAX, G)) - G_PRE;
  const i = Math.floor(t);
  const a = RAIL_TABLE[Math.min(RAIL_TABLE.length - 1, i)];
  const b = RAIL_TABLE[Math.min(RAIL_TABLE.length - 1, i + 1)];
  return a + (b - a) * (t - i);
};

export const caretAt = (G: number) => {
  const h = headAt(G);
  const tx = h.x + CARET_LEAD;
  const ty = h.y + WORD_H / 2;
  const w = railBlend(G);
  if (w <= 0) return { x: tx, y: ty };
  const ry = railHeadAt(G);
  return { x: tx + (RAIL_X - tx) * w, y: ty + (ry - ty) * w };
};

/** G at which the rail head passes month m's first line (its label enters) */
export const MONTH_REACHED: number[] = MONTHS.map((_, m) => {
  const y = lineCY(m * LINES_PER_MONTH) - 4;
  for (let g = RAIL_G0; g <= G_MAX; g++) if (railHeadAt(g) >= y) return g;
  return Infinity;
});
export const MONTH_LABEL_LAND = MONTH_REACHED.map((g) => g + LABEL_IN);
/** A station stands up (slide up + fade to INK_LO over LABEL_IN) after the rail
 *  has passed its month (keeps everything below the racing caret out of the
 *  caption band)... */
// ...but only once the pull-back has widened the frame enough to hold them,
// top to bottom, as "August" lands (a station half cut by the frame edge
// mid-glide read as parked at the edge).
// V2: the stations are never in a column framing, so they simply stand.
export const STATION_IN: number[] = [-100, -100, -100];
export const stationIn = (s: number, G: number) => smoothstep(clamp01((G - STATION_IN[s]) / LABEL_IN));

// ---------------------------------------------------------------------------
// FRESH INK and the FUTURE. A white word is INK_HI while fresh and settles to
// INK_LO. Past NOW (the first line started at or after G_NOW) the lines break
// down as they are written, by `future`.
// ---------------------------------------------------------------------------
export const FRESH_F = 30;
export const G_NOW = G_FUT0;
if (lineStartG(NOW_LINE) < G_NOW || lineStartG(NOW_LINE - 1) >= G_NOW) {
  throw new Error(`incidentShared: NOW_LINE ${NOW_LINE} does not start at the future's edge`);
}
export const NOW_Y = lineTop(NOW_LINE) - (PITCH - WORD_H) / 2;

/** the degrade pieces of one word at level d (0 = a whole bar, 1 = dots) */
const DOT_PIECE = 9;
const degradePieces = (x: number, w: number, d: number, gi: number) => {
  if (d <= 0.001) return [{ x, w, h: WORD_H }];
  // a gradient down the page: shorter bars -> fragments -> dots -> almost nothing
  const a = clamp01(d / 0.38);
  const b = clamp01((d - 0.36) / 0.3);
  const c = clamp01((d - 0.62) / 0.3);
  const wA = w * (1 - 0.4 * smoothstep(a));
  const m = Math.max(2, Math.min(3, Math.round(w / 45)));
  if (b <= 0.001) return [{ x, w: wA, h: WORD_H * (1 - 0.18 * a) }];
  const gap = 14 * smoothstep(b);
  const fw = (wA - (m - 1) * gap) / m;
  const out: { x: number; w: number; h: number }[] = [];
  for (let q = 0; q < m; q++) {
    // a hashed fragment drops out as it goes to dots
    // sparse at the far end: a hashed share of the dots shrinks away, up to 80 %
    const drop = 0.8 * smoothstep((d - 0.72) / 0.28);
    const hq = hash(gi * 7 + q, 41);
    const keep = 1 - smoothstep((drop - hq) / 0.08);
    if (keep <= 0.02) continue;
    const cx = x + q * (fw + gap) + fw / 2;
    const pw = (fw + (DOT_PIECE - fw) * smoothstep(c)) * keep;
    const ph = (WORD_H * (1 - 0.18) + (DOT_PIECE - WORD_H * 0.82) * smoothstep(c)) * keep;
    out.push({ x: cx - pw / 2, w: pw, h: ph });
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE STATIONS. One x (V2: far right, spread in the months' order). Icons: outline family, one
// stroke (STROKE), white at INK_LO while untouched.
// ---------------------------------------------------------------------------
export const WAIT_X = COL_X1 + 120; // the hover zone just right of the text (922)
/** V2: far right, so that at cut 1's whole-column framing (k 0.9, cx 540) no
 *  station, label, mark or blob is within ~110 screen px of the frame */
export const ST_CX = 1420;
export const ICON_HALF = 62;
export const LOOP_R = 57;
/** the TRAINING loop's arrowhead sits at the top (SVG angle 270 deg) */
export const LOOP_ARROW_DEG = 270;
export const LOOP_PERIOD = 54; // frames per revolution
export const EVAL_ROWS = [-38, 0, 38];
export const EVAL_BOX = 30;
export const EVAL_BOX_DX = -42;
export const EVAL_BAR = [-13, 50] as const;
export const RACK_UNIT_W = 66;
export const RACK_UNIT_H = 26;
export const RACK_UNIT_GAP = 8;
export const RACK_GAP = 17;
export const RACKS = 3;
export const RACK_UNITS = 5;
export const RACK_BLOCK_W = RACKS * RACK_UNIT_W + (RACKS - 1) * RACK_GAP; // 212
export const RACK_BLOCK_H = RACK_UNITS * RACK_UNIT_H + (RACK_UNITS - 1) * RACK_UNIT_GAP; // 148
export const MARK_SIZE = 64;

export type StationGeom = {
  key: "TRAINING" | "EVALUATION" | "INFRASTRUCTURE";
  month: number;
  cx: number;
  cy: number;
  /** the icon's box (INFRA: racks + mark) */
  box: { x0: number; y0: number; x1: number; y1: number };
  labelY: number; // label top
};

// Clear zones (director's note): icon, then its label with >= 30 px of air; the
// OpenAI mark with 30 px of air above the racks and below EVALUATION's label.
export const LABEL_AIR = 30;
// V2: each station is FRAMED ALONE at its close-up (K_STATION[s]), so the next
// one down must be out of that frame: the stations keep the months' ORDER but
// not their pitch. TRAINING is level with MAY's plan-line (swarm 1 flies
// straight right to it); EVALUATION and INFRASTRUCTURE step down by ST_GAP.
// The gaps are measured against the V2 camera (`incidentCameraV2`, asserted
// there: at each station's close-up no other station's ink is in frame).
/** the close-up zoom each station is framed alone at (cuts 2 and 22) */
export const K_STATION = [2.0, 2.0, 1.75] as const;
export const ST_GAP = [660, 745] as const;
const TRAIN_CY = lineCY(PLAN_LINE_IDX[0]); // 359
const EVAL_CY = TRAIN_CY + ST_GAP[0];
const INFRA_CY = EVAL_CY + ST_GAP[1];
export const RACK_Y0 = INFRA_CY - RACK_BLOCK_H / 2;
export const MARK_CY = RACK_Y0 - LABEL_AIR - MARK_SIZE / 2;
const ST_CY = [TRAIN_CY, EVAL_CY, INFRA_CY];
export const RACK_X0 = ST_CX - RACK_BLOCK_W / 2;

export const STATIONS: StationGeom[] = [
  {
    key: "TRAINING",
    month: 1,
    cx: ST_CX,
    cy: ST_CY[0],
    box: { x0: ST_CX - ICON_HALF, y0: ST_CY[0] - ICON_HALF, x1: ST_CX + ICON_HALF, y1: ST_CY[0] + ICON_HALF },
    labelY: ST_CY[0] + ICON_HALF + LABEL_AIR,
  },
  {
    key: "EVALUATION",
    month: 2,
    cx: ST_CX,
    cy: ST_CY[1],
    box: { x0: ST_CX - ICON_HALF, y0: ST_CY[1] - ICON_HALF, x1: ST_CX + ICON_HALF, y1: ST_CY[1] + ICON_HALF },
    labelY: ST_CY[1] + ICON_HALF + LABEL_AIR,
  },
  {
    key: "INFRASTRUCTURE",
    month: 3,
    cx: ST_CX,
    cy: ST_CY[2],
    box: { x0: RACK_X0, y0: MARK_CY - MARK_SIZE / 2, x1: RACK_X0 + RACK_BLOCK_W, y1: RACK_Y0 + RACK_BLOCK_H },
    labelY: RACK_Y0 + RACK_BLOCK_H + LABEL_AIR,
  },
];

/** rack unit (r = rack 0..2, u = unit 0..4, top to bottom) box and LED */
export const rackUnit = (r: number, u: number) => {
  const x0 = RACK_X0 + r * (RACK_UNIT_W + RACK_GAP);
  const y0 = RACK_Y0 + u * (RACK_UNIT_H + RACK_UNIT_GAP);
  return {
    x0,
    y0,
    x1: x0 + RACK_UNIT_W,
    y1: y0 + RACK_UNIT_H,
    led: { x: x0 + 14, y: y0 + RACK_UNIT_H / 2 },
  };
};

// ---------------------------------------------------------------------------
// THE PLAN-LINES and their brackets.
// ---------------------------------------------------------------------------
export const planLineBox = (s: number) => {
  const i = PLAN_LINE_IDX[s];
  const ws = LINES[i].words;
  const last = ws[ws.length - 1];
  return {
    line: i,
    x0: COL_X0 + ws[0].x - FLAG_PAD_X,
    x1: COL_X0 + last.x + last.w + FLAG_PAD_X,
    y0: lineTop(i) - FLAG_PAD_Y,
    y1: lineTop(i) + WORD_H + FLAG_PAD_Y,
  };
};
export const PLAN_BOXES = [0, 1, 2].map(planLineBox);

// ---------------------------------------------------------------------------
// THE SWARMS. Schedule in G, all derived motion below.
//   birth : dots boil out of the plan-line's bars into a composed waiting blob
//   flow  : the blob surges onto its station and WRAPS it (a crescent round the
//           icon, open on the right) — the station converts where they reach
//   relax : the wrap lets go and the crowd settles as a composed blob BESIDE
//           the station (left of it), drifting
// Swarm 2 (INFRASTRUCTURE) flows straight to its resting blob against the left
// rack; the rack converts from the contact point.
// One dot size everywhere (DOT_R); density lives in the blob's feathered edge.
// ---------------------------------------------------------------------------
export const SWARM_N = 52;
export type SwarmSched = {
  station: number;
  ignite: number; // plan-line deep -> ripe over IGNITE_F
  birth0: number; // first dot leaves the line
  birth1: number; // last dot leaves the line
  flow0: number; // first dot launches for the station
  flow1: number; // last dot launches
  relax0: number; // first dot lets go of the wrap (Infinity: no wrap)
  relax1: number;
};
export const IGNITE_F = 8;
export const SWARM_SCHED: SwarmSched[] = [
  // V2: nothing ignites before cut 2's f0 (G142 is a hold of cut 1's last
  // frame); the swarms FLY right to their far stations with the camera
  // following, so they leave earlier and travel longer (FLOW_T).
  { station: 0, ignite: 144, birth0: 148, birth1: 164, flow0: 204, flow1: 212, relax0: 272, relax1: 286 },
  { station: 1, ignite: 160, birth0: 164, birth1: 180, flow0: 249, flow1: 257, relax0: 318, relax1: 332 },
  { station: 2, ignite: 176, birth0: 180, birth1: 196, flow0: 313, flow1: 321, relax0: Infinity, relax1: Infinity },
];
/** V2 flight time per swarm, frames: [min, max]; a dot's time grows with its
 *  distance at FLOW_V world px/frame (the far seats launch first and fly longest) */
export const FLOW_T: [number, number][] = [
  [34, 46],
  [36, 48],
  [38, 50],
];
export const FLOW_V = 12;

const SEAT_STEP = 19;

/** Seats on a jittered lattice inside `score` (score in lattice steps: > 0 inside,
 *  higher = deeper), exactly n of them, deepest first. */
const makeSeats = (
  n: number,
  seed: number,
  bbox: { x0: number; y0: number; x1: number; y1: number },
  score: (x: number, y: number) => number,
) => {
  const cand: { x: number; y: number; s: number; rank: number }[] = [];
  let idx = 0;
  for (let gy = bbox.y0; gy <= bbox.y1; gy += SEAT_STEP) {
    for (let gx = bbox.x0; gx <= bbox.x1; gx += SEAT_STEP) {
      const jx = (hash(idx + seed * 977, 1) - 0.5) * 0.8 * SEAT_STEP;
      const jy = (hash(idx + seed * 977, 2) - 0.5) * 0.8 * SEAT_STEP;
      const x = gx + jx;
      const y = gy + jy;
      const s = score(x, y);
      // feathered: near the edge a seat survives on a smoothstep of its depth
      const keep = feather(s + 1.0, 2.2);
      if (s > -1.0 && hash(idx + seed * 977, 4) < keep) cand.push({ x, y, s, rank: s + 0.35 * hash(idx + seed * 977, 3) });
      idx++;
    }
  }
  cand.sort((a, b) => b.rank - a.rank);
  if (cand.length < n) throw new Error(`incidentShared: only ${cand.length} seats for ${n} (seed ${seed})`);
  return cand.slice(0, n).map((c) => ({ x: c.x, y: c.y }));
};

/** inside-distance of a superellipse, in lattice steps */
const blobScore = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => {
  const rho = Math.pow(blobAt(x - cx, y - cy, rx, ry), 1 / BLOB_N);
  return ((1 - rho) * Math.min(rx, ry)) / SEAT_STEP;
};

export const WAIT_CENTRES = [0, 1, 2].map((s) =>
  s < 2 ? { x: WAIT_X, y: lineCY(PLAN_LINE_IDX[s]) } : { x: WAIT_X - 12, y: lineCY(PLAN_LINE_IDX[s]) - 14 },
);
export const WAIT_RX = 90;
export const WAIT_RY = 80;

const waitSeats = (s: number) => {
  const c = WAIT_CENTRES[s];
  return makeSeats(SWARM_N, 11 + s, { x0: c.x - WAIT_RX - 30, y0: c.y - WAIT_RY - 30, x1: c.x + WAIT_RX + 30, y1: c.y + WAIT_RY + 30 }, (x, y) =>
    blobScore(x, y, c.x, c.y, WAIT_RX, WAIT_RY),
  );
};

// the WRAP round TRAINING and EVALUATION (transient), open on the right, kept
// above the station's label
const WRAP_DX = -44;
const WRAP_DY = -14;
const WRAP_RX = 150;
const WRAP_RY = 108;
const WRAP_CLEAR = 82;
/** V2: TRAINING's crescent is open on the right (V1); EVALUATION's swarm pours
 *  down the checklist's LEFT side only (it arrives from the upper left) */
const WRAP_CUT_S = [40, -64];
const wrapSeats = (s: number) => {
  const st = STATIONS[s];
  const ox = st.cx + WRAP_DX;
  const oy = st.cy + WRAP_DY;
  return makeSeats(
    SWARM_N,
    21 + s,
    { x0: ox - WRAP_RX - 30, y0: oy - WRAP_RY - 30, x1: st.cx + WRAP_CUT_S[s] + 20, y1: st.labelY - 6 },
    (x, y) => {
      const outer = blobScore(x, y, ox, oy, WRAP_RX, WRAP_RY);
      const clear = -blobScore(x, y, st.cx, st.cy, WRAP_CLEAR, WRAP_CLEAR);
      const cut = (st.cx + WRAP_CUT_S[s] - x) / SEAT_STEP;
      const label = (st.labelY - 10 - y) / SEAT_STEP;
      return Math.min(outer, clear, cut, label);
    },
  );
};

/** the resting blobs: composed superellipses BESIDE (left of) each station */
export const REST_BLOBS = [
  { x: ST_CX - ICON_HALF - 24 - 88, y: ST_CY[0], rx: 88, ry: 82 },
  { x: ST_CX - ICON_HALF - 24 - 88, y: ST_CY[1], rx: 88, ry: 82 },
  // V2: pressed a little closer against the left rack (contact below)
  { x: RACK_X0 - 16 - 78, y: ST_CY[2], rx: 78, ry: 94 },
];
/** kept for readers of the first ready file */
export const S3_REST = REST_BLOBS[2];
const restSeats = (s: number) => {
  const c = REST_BLOBS[s];
  return makeSeats(SWARM_N, 31 + s, { x0: c.x - c.rx - 30, y0: c.y - c.ry - 30, x1: c.x + c.rx + 30, y1: c.y + c.ry + 30 }, (x, y) =>
    blobScore(x, y, c.x, c.y, c.rx, c.ry),
  );
};

type DotPlan = {
  origin: { x: number; y: number };
  wait: { x: number; y: number };
  env: { x: number; y: number }; // the wrap seat (= rest for swarm 2)
  rest: { x: number; y: number };
  bL: number; // birth launch
  bT: number; // birth travel
  bBow: number;
  fL: number; // flow launch
  fT: number; // flow travel
  xL: number; // relax launch (Infinity: none)
  xT: number; // relax travel
  seed: number;
};

const ptDist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export const SWARM_PLANS: DotPlan[][] = SWARM_SCHED.map((sc, s) => {
  const pl = LINES[PLAN_LINE_IDX[s]];
  const planY = lineCY(PLAN_LINE_IDX[s]);
  const W = waitSeats(s);
  const E = s < 2 ? wrapSeats(s) : restSeats(s);
  const R = restSeats(s);
  const st = STATIONS[sc.station];

  // origins on the plan-line's bars, sorted left to right; waiting seats by x
  const origins = Array.from({ length: SWARM_N }, (_, i) => {
    const wd = pl.words[Math.floor(hash(i + s * 101, 5) * pl.words.length)];
    const u = 0.12 + 0.76 * hash(i + s * 101, 6);
    return { x: COL_X0 + wd.x + wd.w * u, y: planY };
  }).sort((a, b) => a.x - b.x);
  const waitSorted = [...W].sort((a, b) => a.x - b.x);

  // wrap assignment: the blob's leading dots (nearest the station) take the
  // FAR seats (they lead the wrap), the back dots fill the near side.
  let keyOf: (p: { x: number; y: number }) => number;
  if (s === 0) {
    keyOf = (p) => 1 - Math.abs(Math.atan2(p.y - st.cy, p.x - st.cx)) / Math.PI;
  } else if (s === 1) {
    keyOf = (p) => (p.y - (st.cy - WRAP_RY)) / (2 * WRAP_RY);
  } else {
    keyOf = (p) => -ptDist(p, { x: RACK_X0, y: ST_CY[2] });
  }
  const envSorted = [...E].map((r) => ({ ...r, key: keyOf(r) })).sort((a, b) => b.key - a.key);
  const lead = (p: { x: number; y: number }) =>
    s === 1 ? p.y + 0.4 * p.x : s === 2 ? p.y * 0.6 + p.x : p.x;
  const waitByLead = waitSorted.map((w, i) => ({ w, i })).sort((a, b) => lead(b.w) - lead(a.w));

  // rest assignment for the wrapped swarms: by angle round the station, so the
  // relax is a fan closing, not a crossing
  const ang = (p: { x: number; y: number }) => {
    const a = Math.atan2(p.y - st.cy, p.x - st.cx);
    return a < 0 ? a + 2 * Math.PI : a; // 0..2pi, left = pi
  };
  const envOfDot: { x: number; y: number; key: number }[] = new Array(SWARM_N);
  for (let r = 0; r < SWARM_N; r++) envOfDot[waitByLead[r].i] = envSorted[r];
  const restOfDot: { x: number; y: number }[] = new Array(SWARM_N);
  if (s < 2) {
    const dotsByAng = Array.from({ length: SWARM_N }, (_, i) => i).sort((a, b) => ang(envOfDot[a]) - ang(envOfDot[b]));
    const restByAng = [...R].sort((a, b) => ang(a) - ang(b));
    dotsByAng.forEach((i, q) => (restOfDot[i] = restByAng[q]));
  } else {
    for (let i = 0; i < SWARM_N; i++) restOfDot[i] = envOfDot[i];
  }

  const plans: DotPlan[] = new Array(SWARM_N);
  for (let r = 0; r < SWARM_N; r++) {
    const { w, i } = waitByLead[r];
    const env = envOfDot[i];
    const rest = restOfDot[i];
    const origin = origins[i];
    const bL = sc.birth0 + (sc.birth1 - sc.birth0) * hash(i + s * 131, 7);
    const bD = ptDist(origin, w);
    const bT = Math.max(14, Math.min(28, bD / 15));
    const fL = sc.flow0 + ((sc.flow1 - sc.flow0) * r) / (SWARM_N - 1) + 1.5 * (hash(i + s * 131, 8) - 0.5);
    const fD = ptDist(w, env);
    const fT = Math.max(FLOW_T[s][0], Math.min(FLOW_T[s][1], fD / FLOW_V));
    // the wrap lets go far arms first
    const xL = sc.relax0 === Infinity ? Infinity : sc.relax0 + ((sc.relax1 - sc.relax0) * r) / (SWARM_N - 1);
    const xT = Math.max(12, Math.min(22, ptDist(env, rest) / 9));
    plans[i] = {
      origin,
      wait: { x: w.x, y: w.y },
      env: { x: env.x, y: env.y },
      rest: { x: rest.x, y: rest.y },
      bL,
      bT,
      bBow: (hash(i + s * 131, 10) < 0.5 ? -1 : 1) * (0.08 + 0.1 * hash(i + s * 131, 11)),
      fL,
      fT,
      xL: Math.max(xL, fL + fT + 2),
      xT,
      seed: i + s * 131,
    };
  }
  return plans;
});

const EASE = (u: number) => camEase(u, 0.9);

/** wander: every dot drifts on its own two sines, never unison */
const wander = (seed: number, G: number, amp = 3.2) => ({
  x: amp * Math.sin(G * (0.045 + 0.02 * hash(seed, 21)) + 6.28 * hash(seed, 22)),
  y: amp * Math.sin(G * (0.051 + 0.02 * hash(seed, 23)) + 6.28 * hash(seed, 24)),
});

/** the waiting blob presses slowly toward its station while it waits */
const CREEP = 16;

export type DotState = { x: number; y: number; r: number; tone: number; phase: 0 | 1 | 2 | 3 | 4 | 5 | 6; u?: number };
// phase 0 = not born, 1 = birth travel, 2 = waiting, 3 = flow travel, 4 = wrapped,
// 5 = relaxing, 6 = at rest

const polarTravel = (
  st: { cx: number; cy: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
  u: number,
  bulge: number,
) => {
  const a0 = Math.atan2(a.y - st.cy, a.x - st.cx);
  const a1 = Math.atan2(b.y - st.cy, b.x - st.cx);
  const r0 = Math.hypot(a.x - st.cx, a.y - st.cy);
  const r1 = Math.hypot(b.x - st.cx, b.y - st.cy);
  const an = a0 + arcTo(a0, a1) * u;
  const rr = r0 + (r1 - r0) * u + bulge * Math.sin(Math.PI * u);
  return { x: st.cx + rr * Math.cos(an), y: st.cy + rr * Math.sin(an) };
};

/** V2 flight onto a station from far away: the dot closes the distance first
 *  (radially, straight at the station — for swarm 1 that is "flies right")
 *  and only swings round to its wrap seat in the last part of the flight, at a
 *  small radius, so the crowd arrives as a stream and opens into a crescent.
 *  `t` is linear time 0..1; the radius takes the main ease, the angle a late one. */
const approachTravel = (
  st: { cx: number; cy: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number,
) => {
  const a0 = Math.atan2(a.y - st.cy, a.x - st.cx);
  const a1 = Math.atan2(b.y - st.cy, b.x - st.cx);
  const r0 = Math.hypot(a.x - st.cx, a.y - st.cy);
  const r1 = Math.hypot(b.x - st.cx, b.y - st.cy);
  const ru = EASE(t);
  const au = smoothstep(clamp01((t - APPROACH_TURN) / (1 - APPROACH_TURN)));
  const an = a0 + arcTo(a0, a1) * au;
  const rr = r0 + (r1 - r0) * ru;
  return { x: st.cx + rr * Math.cos(an), y: st.cy + rr * Math.sin(an) };
};
/** the fraction of the flight before the dots start to swing round */
export const APPROACH_TURN = 0.3;
export const SWARM3_BOW = 0.14;
export const POUR_LAG = 2.0;

/** A swarm dot at G, before any drain. */
export const swarmDot = (s: number, i: number, G: number): DotState => {
  const p = SWARM_PLANS[s][i];
  const sc = SWARM_SCHED[s];
  const st = STATIONS[sc.station];
  const baseR = DOT_R;
  if (G < p.bL) return { x: p.origin.x, y: p.origin.y, r: 0, tone: 1, phase: 0 };
  const wv = wander(p.seed, G);
  // where the dot sits in the waiting blob at G (creeping toward the station)
  const creepU = smoothstep((G - sc.birth1 - 20) / 90);
  const dirx = st.cx - WAIT_CENTRES[s].x;
  const diry = st.cy - WAIT_CENTRES[s].y;
  const dl = Math.hypot(dirx, diry) || 1;
  const waitAt = {
    x: p.wait.x + (dirx / dl) * CREEP * creepU + wv.x,
    y: p.wait.y + (diry / dl) * CREEP * creepU + wv.y,
  };
  if (G < p.bL + p.bT) {
    const u = (G - p.bL) / p.bT;
    const q = curve(p.origin, waitAt, EASE(u), p.bBow);
    return { x: q.x, y: q.y, r: baseR * smoothstep(u / 0.35), tone: 1, phase: 1 };
  }
  if (G < p.fL) {
    const cool = smoothstep((G - p.bL - p.bT) / 24);
    return { x: waitAt.x, y: waitAt.y, r: baseR, tone: 1 - cool, phase: 2 };
  }
  const envAt = { x: p.env.x + wv.x, y: p.env.y + wv.y };
  const heat = smoothstep((G - p.fL) / 6);
  const waitCool = 1 - smoothstep((p.fL - p.bL - p.bT) / 24);
  const tone0 = waitCool + (1 - waitCool) * heat;
  if (G < p.fL + p.fT) {
    const t = (G - p.fL) / p.fT;
    const u = EASE(t);
    if (s === 0) {
      // V2: close in straight (flies right), then swing round: never through the icon
      const q = approachTravel(st, waitAt, envAt, t);
      return { x: q.x, y: q.y, r: baseR, tone: tone0, phase: 3, u };
    }
    if (s === 1) {
      // V2: out to the right first, then pour DOWN onto the left side (the
      // height lags the travel, so the swarm stays level with the gliding camera)
      const ux = EASE(t);
      const uy = EASE(Math.pow(t, POUR_LAG));
      return { x: waitAt.x + (envAt.x - waitAt.x) * ux, y: waitAt.y + (envAt.y - waitAt.y) * uy, r: baseR, tone: tone0, phase: 3, u };
    }
    // V2: swarm 3 drops down the far left of the stations and swings into the
    // racks from the left (bow the other way from V1)
    const q = curve(waitAt, envAt, u, SWARM3_BOW);
    return { x: q.x, y: q.y, r: baseR, tone: tone0, phase: 3, u };
  }
  if (G < p.xL) {
    if (p.xL === Infinity) {
      const cool = smoothstep((G - p.fL - p.fT - 8) / 36);
      return { x: envAt.x, y: envAt.y, r: baseR, tone: 1 - cool, phase: 6 };
    }
    return { x: envAt.x, y: envAt.y, r: baseR, tone: 1, phase: 4 };
  }
  const restAt = { x: p.rest.x + wv.x, y: p.rest.y + wv.y };
  if (G < p.xL + p.xT) {
    const u = EASE((G - p.xL) / p.xT);
    const q = polarTravel(st, envAt, restAt, u, 6);
    return { x: q.x, y: q.y, r: baseR, tone: 1, phase: 5, u };
  }
  const cool = smoothstep((G - p.xL - p.xT) / 30);
  return { x: restAt.x, y: restAt.y, r: baseR, tone: 1 - cool, phase: 6 };
};

/** a swarm's centroid at G (pre-drain) */
export const swarmCentroid = (s: number, G: number) => {
  let x = 0;
  let y = 0;
  let n = 0;
  for (let i = 0; i < SWARM_N; i++) {
    const d = swarmDot(s, i, G);
    if (d.phase === 0) continue;
    x += d.x;
    y += d.y;
    n++;
  }
  return n ? { x: x / n, y: y / n, n } : { x: WAIT_CENTRES[s].x, y: WAIT_CENTRES[s].y, n: 0 };
};

// ---------------------------------------------------------------------------
// CONVERSION, derived from the dots. Tables over G, built once.
// ---------------------------------------------------------------------------
const TABLE_G0 = 0;
const TABLE_G1 = G_MAX;
const LOOP_CONDUCT = 9; // deg / frame the orange runs round the loop on its own
const LOOP_TOUCH = LOOP_R + 78;

/** TRAINING: orange arc extents (deg) above and below the contact point (180) */
export const LOOP_PHI: { up: number; down: number }[] = (() => {
  const out: { up: number; down: number }[] = [];
  const st = STATIONS[0];
  let up = 0;
  let down = 0;
  for (let G = TABLE_G0; G <= TABLE_G1; G++) {
    let mu = 0;
    let md = 0;
    let any = false;
    for (let i = 0; i < SWARM_N; i++) {
      const d = swarmDot(0, i, G);
      if (d.phase < 3) continue;
      const dx = d.x - st.cx;
      const dy = d.y - st.cy;
      if (Math.hypot(dx, dy) > LOOP_TOUCH) continue;
      const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360; // 0..360
      if (deg >= 180) mu = Math.max(mu, deg - 180);
      else md = Math.max(md, 180 - deg);
      any = true;
    }
    if (any || up > 0 || down > 0) {
      up = Math.max(mu, up > 0 ? up + LOOP_CONDUCT : 0, up);
      down = Math.max(md, down > 0 ? down + LOOP_CONDUCT : 0, down);
      if (any && up === 0 && md > 0) up = 0.001;
      if (any && down === 0 && mu > 0) down = 0.001;
    }
    if (up + down > 360) {
      const ex = up + down - 360;
      up -= ex / 2;
      down -= ex / 2;
    }
    out.push({ up, down });
  }
  return out;
})();
const tableAt = <T,>(t: T[], G: number) => t[Math.max(0, Math.min(t.length - 1, Math.round(G) - TABLE_G0))];
export const loopPhiAt = (G: number) => tableAt(LOOP_PHI, G);
/** the frame the TRAINING arrowhead is reached and turns (subverted) */
export const G_LOOP_FLIP = (() => {
  const need = LOOP_ARROW_DEG - 180;
  for (let i = 0; i < LOOP_PHI.length; i++) if (LOOP_PHI[i].up >= need) return TABLE_G0 + i;
  return Infinity;
})();
export const G_LOOP_FULL = (() => {
  for (let i = 0; i < LOOP_PHI.length; i++) if (LOOP_PHI[i].up + LOOP_PHI[i].down >= 359.9) return TABLE_G0 + i;
  return Infinity;
})();
export const LOOP_FLIP_F = 8;
export const LOOP_REVERSE_F = 14;

export const EVAL_ROW_STEP = 6;
/** EVALUATION: the frame each row is reached (top to bottom) */
export const EVAL_ROW_G: number[] = (() => {
  const st = STATIONS[1];
  const out = EVAL_ROWS.map(() => Infinity);
  let front = -Infinity;
  for (let G = TABLE_G0; G <= TABLE_G1; G++) {
    for (let i = 0; i < SWARM_N; i++) {
      const d = swarmDot(1, i, G);
      if (d.phase < 3) continue;
      if (Math.hypot(d.x - st.cx, d.y - st.cy) > 136) continue;
      front = Math.max(front, d.y - st.cy);
    }
    // one by one: a row flips when the crowd's front passes it, and never
    // sooner than EVAL_ROW_STEP after the row above
    EVAL_ROWS.forEach((ry, r) => {
      if (out[r] === Infinity && front >= ry && (r === 0 || G >= out[r - 1] + EVAL_ROW_STEP)) out[r] = G;
    });
  }
  return out;
})();
export const EVAL_FLIP_F = 9;

/** INFRASTRUCTURE: first contact of swarm 3 with the left rack, and each unit's
 *  conversion frame. Only the LEFT rack (a contiguous third) converts. */
/** V2: how close (world px) a flying dot's edge must come to the left rack */
export const INFRA_TOUCH = 30;
export const INFRA_CONTACT = (() => {
  for (let G = TABLE_G0; G <= TABLE_G1; G++) {
    for (let i = 0; i < SWARM_N; i++) {
      const d = swarmDot(2, i, G);
      if (d.phase < 3 || (d.phase === 3 && (d.u ?? 0) < 0.6)) continue;
      if (d.x < RACK_X0 && d.x + d.r >= RACK_X0 - INFRA_TOUCH && d.y > RACK_Y0 && d.y < RACK_Y0 + RACK_BLOCK_H) {
        return { G, y: Math.max(RACK_Y0 + 12, Math.min(RACK_Y0 + RACK_BLOCK_H - 12, d.y)) };
      }
    }
  }
  return { G: Infinity, y: ST_CY[2] };
})();
export const INFRA_CONDUCT = 5; // world px / frame through the rack
export const INFRA_UNIT_F = 6;
export const INFRA_DELAY = 6;
export const INFRA_UNIT_G: number[] = Array.from({ length: RACK_UNITS }, (_, u) => {
  const cy = rackUnit(0, u).led.y;
  return INFRA_CONTACT.G + INFRA_DELAY + Math.abs(cy - INFRA_CONTACT.y) / INFRA_CONDUCT;
});
/** threads plug from swarm 3 into each converted unit's LED */
export const THREAD_G0 = 400;
export const THREAD_STEP = 2;
export const THREAD_DRAW_F = 8;
export const THREAD_DOTS: number[] = (() => {
  const used = new Set<number>();
  return Array.from({ length: RACK_UNITS }, (_, u) => {
    const led = rackUnit(0, u).led;
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < SWARM_N; i++) {
      if (used.has(i)) continue;
      const p = SWARM_PLANS[2][i].rest;
      // the rightmost column of the blob, near the unit's height
      const d = Math.hypot((p.x - led.x) * 0.7, p.y - led.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    used.add(best);
    return best;
  });
})();
export const THREAD_PACKET_PERIOD = 16;
export const THREAD_PACKET_V = 5;

// ---------------------------------------------------------------------------
// THE HOOKS: dim, drain, future.
// ---------------------------------------------------------------------------
export type DimWindow = { x0: number; y0: number; x1: number; y1: number; feather?: number };
export type Drain = {
  originY: number;
  pAt: (G: number) => number;
  /** A3's time-based option (2026-09-23): when `localF` and `reachAt` are set,
   *  a month's local progress is clamp01((G - reachAt(y)) / localF) instead of
   *  being read off the front's distance. */
  localF?: number;
  reachAt?: (y: number) => number;
  /** ...and with `dotV` also set, a dot's flight back into its line is timed in
   *  frames at this world speed (see the scene) instead of in local u. */
  dotV?: number;
};
export type FutureArg = number | ((G: number) => number);

/** the drain front runs from originY down to DRAIN_END_Y as p goes 0 -> 1 */
export const DRAIN_END_Y = STATIONS[2].labelY + 60;
export const DRAIN_L = 260;
/** a month's local drain progress for a plan-line at y */
export const drainLocal = (drain: Drain | null | undefined, G: number, y: number) => {
  if (!drain) return 0;
  if (drain.localF && drain.reachAt) return clamp01((G - drain.reachAt(y)) / drain.localF);
  const p = clamp01(drain.pAt(G));
  const front = drain.originY + p * (DRAIN_END_Y + DRAIN_L - drain.originY);
  return clamp01((front - y) / DRAIN_L);
};
// the order of things inside one month's drain (local u):
export const DRAIN_THREADS = [0.0, 0.25] as const; // threads retract
export const DRAIN_DOTS = [0.0, 0.6] as const; // dots fly back into the line (staggered)
export const DRAIN_REVERT = [0.15, 0.55] as const; // station orange -> white
export const DRAIN_BRACKET = [0.4, 0.6] as const; // white bracket draws round the line
export const DRAIN_UNTYPE = [0.6, 0.95] as const; // plan-line un-types right to left

const seg = (u: number, [a, b]: readonly [number, number]) => clamp01((u - a) / (b - a));

// ---------------------------------------------------------------------------
// stateAt(G): what is standing. Pass the same drain the scene gets.
// ---------------------------------------------------------------------------
export const stateAt = (G: number, drain?: Drain | null) => {
  const head = headAt(G);
  const caret = caretAt(G);
  const planIgnite = SWARM_SCHED.map((sc) => smoothstep((G - sc.ignite) / IGNITE_F));
  const planWritten = PLAN_LINE_IDX.map((i) => {
    const ws = LINES[i].words;
    return clamp01(wordsAt(G) - ws[0].gi) / ws.length;
  });
  const drainU = PLAN_LINE_IDX.map((i) => drainLocal(drain, G, lineCY(i)));
  const lp = loopPhiAt(G);
  return {
    G,
    head,
    caret,
    railHead: railHeadAt(G),
    railBlend: railBlend(G),
    monthsIn: MONTH_REACHED.map((g) => clamp01((G - g) / LABEL_IN)),
    planWritten,
    planIgnite,
    drainU,
    swarms: [0, 1, 2].map((s) => ({ centroid: swarmCentroid(s, G), born: G >= SWARM_SCHED[s].birth0 })),
    training: clamp01((lp.up + lp.down) / 360),
    evaluation: EVAL_ROW_G.map((g) => clamp01((G - g) / EVAL_FLIP_F)),
    infrastructure: INFRA_UNIT_G.map((g) => clamp01((G - g) / INFRA_UNIT_F)),
    threads: THREAD_DOTS.map((_, u) => clamp01((G - THREAD_G0 - THREAD_STEP * u) / THREAD_DRAW_F)),
  };
};

/** The humans' place (another builder draws them): the centre of the middle of
 *  three person glyphs, above APR, centred on the column. Nothing of the world
 *  is drawn in HUMANS_RESERVED. */
export const HUMANS_ANCHOR = { x: COL_CX, y: lineTop(0) - 190, spacing: 150 };
export const HUMANS_RESERVED = { x0: COL_CX - 260, y0: lineTop(0) - 280, x1: COL_CX + 260, y1: lineTop(0) - 60 };

/** extents, world px */
export const COL_TOP = lineTop(0);
export const colBottomAt = (G: number) => lineTop(headAt(G).line) + WORD_H;
/** V2: the column's own composition (labels .. text), centred on 540 */
export const COMPOSITION = { x0: MONTH_LABEL_R - 70, x1: COL_X1, cx: (MONTH_LABEL_R - 70 + COL_X1) / 2 };
export const STATIONS_BBOX = { x0: ST_CX - 280, x1: ST_CX + 160 };
/** V2: everything the scope wides (26's pull-back, 47's ending) may have to
 *  hold: month labels .. the stations' right edge, APR's top .. INFRASTRUCTURE's
 *  label bottom (the column below AUG is whatever the head has written) */
export const SCOPE = {
  x0: MONTH_LABEL_R - 70,
  x1: ST_CX + 170,
  y0: lineTop(0) - 12,
  y1: STATIONS[2].labelY + LABEL_SIZE,
};

// ---------------------------------------------------------------------------
// CAMERA helpers shared by the film's cuts. A camera is authored as target
// tracks in G (content centre + k), damped by fieldShared's runCamera, plus
// sway(G) — in GLOBAL G, so two adjacent cuts that share a track join exactly.
// ---------------------------------------------------------------------------
export type Cam = { cx: number; cy: number; k: number };
export type CamTable = { g0: number; at: (G: number) => Cam; rows: Cam[] };
export const buildCamTable = (
  g0: number,
  g1: number,
  target: (G: number) => { x: number; y: number; k: number },
  /** V2: the hand's sway can be faded (0 = a camera at rest, e.g. across a join) */
  swayAmt: (G: number) => number = () => 1,
): CamTable => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  for (let G = g0; G <= g1; G++) {
    const t = target(G);
    F.push(G - g0);
    K.push(t.k);
    CY.push(t.y + CAM_LIFT / t.k);
    CX.push(t.x);
  }
  const rows: Cam[] = [];
  for (let f = 0; f <= g1 - g0; f++) {
    const y = runCamera(f, F, CY, K);
    const x = runCamera(f, F, CX, K).cy;
    const d = sway(g0 + f);
    const a = swayAmt(g0 + f);
    rows.push({ cx: x + d.dx * a, cy: y.cy + d.dy * a, k: y.k });
  }
  const at = (G: number) => rows[Math.max(0, Math.min(rows.length - 1, Math.round(G) - g0))];
  return { g0, at, rows };
};
export const seg01 = (G: number, a: number, b: number, warp = 1) => camEase((G - a) / (b - a), warp);
export const screenOf = (cam: Cam, wx: number, wy: number) => ({
  x: FRAME_W / 2 + (wx - cam.cx) * cam.k,
  y: FRAME_H / 2 + (wy - cam.cy) * cam.k,
});
/** the grid's parallax is measured from ONE rest point for the whole film, so
 *  it never jumps at a join */
export const GRID_REST = { cx: 540, cy: 640 };
export const GRID_W0 = 400;

// ---------------------------------------------------------------------------
// DRAWING
// ---------------------------------------------------------------------------
const n2 = (v: number) => Number(v.toFixed(2));

const arcPath = (cx: number, cy: number, r: number, d0: number, d1: number) => {
  // degrees, SVG orientation (y down), d1 > d0
  if (d1 - d0 >= 359.99) {
    return `M${n2(cx + r)} ${n2(cy)} A${r} ${r} 0 1 1 ${n2(cx - r)} ${n2(cy)} A${r} ${r} 0 1 1 ${n2(cx + r)} ${n2(cy)}`;
  }
  const a0 = (d0 * Math.PI) / 180;
  const a1 = (d1 * Math.PI) / 180;
  const large = d1 - d0 > 180 ? 1 : 0;
  return `M${n2(cx + r * Math.cos(a0))} ${n2(cy + r * Math.sin(a0))} A${r} ${r} 0 ${large} 1 ${n2(cx + r * Math.cos(a1))} ${n2(cy + r * Math.sin(a1))}`;
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp01(t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/** A label in the film's type, right- or centre-aligned, sliding up while it
 *  fades in. DOM: goes in a world <div>, never in the <svg>. */
export const WLabel: React.FC<{
  x: number;
  y: number;
  text: string;
  inT: number;
  k: number;
  align: "center" | "right" | "left";
  opacity?: number;
  size?: number;
}> = ({ x, y, text, inT, k, align, opacity = INK_HI, size = LABEL_SIZE }) => {
  const t = clamp01(inT);
  if (t <= 0) return null;
  const rise = (LABEL_RISE_PX / Math.max(k, 1e-3)) * (1 - smoothstep(t));
  const W = 900;
  const left = align === "center" ? x - W / 2 : align === "right" ? x - W : x;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: y + rise,
        width: W,
        textAlign: align,
        fontFamily: FONT_LABEL,
        fontWeight: LABEL_WEIGHT,
        fontSize: size,
        lineHeight: 1,
        textTransform: "uppercase",
        letterSpacing: LABEL_TRACKING,
        color: INK,
        opacity: opacity * smoothstep(t),
        whiteSpace: "nowrap",
        filter: iconShadow(k),
      }}
    >
      {text}
    </div>
  );
};

/** the OpenAI mark, inline paths, white */
const OpenAIMark: React.FC<{ x: number; y: number; size: number; opacity: number; k: number }> = ({
  x,
  y,
  size,
  opacity,
  k,
}) => (
  <g style={{ filter: iconShadow(k) }} opacity={opacity}>
    <g transform={`translate(${n2(x - size / 2)} ${n2(y - size / 2)}) scale(${size / 24})`}>
      {OPENAI.paths.map((d, i) => (
        <path key={i} d={d} fill={INK} fillRule="evenodd" />
      ))}
    </g>
  </g>
);

// ---------------------------------------------------------------------------
// THE SCENE
// ---------------------------------------------------------------------------
export type IncidentWorldProps = {
  G: number;
  cam: Cam;
  /** 0 normal .. 1 dark: the field and white ink go dark, ORANGE stays full */
  dim?: number;
  /** a world-space rectangle where the dim does not apply (soft edge) */
  dimWindow?: DimWindow | null;
  /** the shut-down wave: pAt(G) 0..1 moves a front down from originY */
  drain?: Drain | null;
  /** 0..1, or a function of G (evaluated at each word's own emission = "as written") */
  future?: FutureArg;
  /** world-space SVG drawn over everything (inside the camera transform) */
  overSvg?: React.ReactNode;
  /** world-space DOM (person.png etc.) over everything */
  overDom?: React.ReactNode;
  /** world-space SVG drawn in the WHITE layer (under the veil) */
  whiteSvg?: React.ReactNode;
  /** world-space SVG drawn in the ORANGE layer (over the veil) */
  orangeSvg?: React.ReactNode;
  backgroundSrc?: string;
  backgroundBlur?: number;
  parallax?: number;
  /** V2 (cut 4): only the text being written — no rail, ticks, month labels,
   *  NOW tick or breakdown */
  textOnly?: boolean;
};

export const DIM_VEIL = 0.66;

export const IncidentWorld: React.FC<IncidentWorldProps> = ({
  G,
  cam,
  dim = 0,
  dimWindow = null,
  drain = null,
  future = 0,
  overSvg,
  overDom,
  whiteSvg,
  orangeSvg,
  backgroundSrc = "grid-background.jpg",
  backgroundBlur = 13,
  parallax = 0.15,
  textOnly = false,
}) => {
  const { cx, cy, k } = cam;
  const { tx, ty } = worldTransform(cx, cy, k);
  const W = wordsAt(G);
  const futureAt = (g: number) => (typeof future === "function" ? future(g) : future);
  const futNow = typeof future === "function" ? future(G) : future;

  // --- per-month drain progress ---
  const dU = PLAN_LINE_IDX.map((i) => drainLocal(drain, G, lineCY(i)));

  // --- the words ---
  const whiteBars: React.ReactNode[] = [];
  const orangeBars: React.ReactNode[] = [];
  // only lines that exist and could be on screen
  const yTop = cy - FRAME_H / 2 / k - 80;
  const yBot = cy + FRAME_H / 2 / k + 80;
  const headLine = headAt(G).line;
  for (let li = 0; li <= Math.min(N_LINES - 1, headLine); li++) {
    const L = LINES[li];
    if (L.y0 + WORD_H < yTop || L.y0 > yBot) continue;
    const planS = L.plan;
    for (const wd of L.words) {
      const L0 = L.words[0].gi;
      const spanW = wd.gi - L0 < L.words.length - 1 ? wd.w + GAP : wd.w;
      const grown = clamp01(((W - wd.gi) * spanW) / wd.w);
      if (grown <= 0.001) continue;
      const x = COL_X0 + wd.x;
      if (planS >= 0) {
        const sc = SWARM_SCHED[planS];
        const tone = smoothstep((G - sc.ignite) / IGNITE_F);
        // un-type right to left under the drain: the last word goes first
        const nW = L.words.length;
        const kIdx = wd.gi - L.words[0].gi;
        const ut = seg(dU[planS], DRAIN_UNTYPE) * nW;
        const wipe = clamp01(ut - (nW - 1 - kIdx));
        const w = wd.w * grown * (1 - wipe);
        if (w < 0.5) continue;
        orangeBars.push(
          <rect key={`o${wd.gi}`} x={n2(x)} y={n2(L.y0)} width={n2(w)} height={WORD_H} rx={WORD_H / 2} fill={TONE(tone)} />,
        );
        continue;
      }
      const lvl = li >= NOW_LINE && !textOnly ? futureAt(EMIT[wd.gi]) * clamp01((li - NOW_LINE + 1) / FUTURE_LINES) : 0;
      const fresh = 1 - smoothstep((G - doneAtWord(wd.gi)) / FRESH_F);
      const op = INK_LO + (INK_HI - INK_LO) * fresh;
      const pieces = degradePieces(x, wd.w * grown, lvl, wd.gi);
      pieces.forEach((pc, q) => {
        if (pc.w < 0.5) return;
        whiteBars.push(
          <rect
            key={`w${wd.gi}-${q}`}
            x={n2(pc.x)}
            y={n2(L.y0 + (WORD_H - pc.h) / 2)}
            width={n2(pc.w)}
            height={n2(pc.h)}
            rx={n2(Math.min(pc.h, pc.w) / 2)}
            fill={INK}
            opacity={n2(op)}
          />,
        );
      });
    }
  }

  // --- the caret and the rail ---
  const caret = caretAt(G);
  const railHead = railHeadAt(G);
  const railOn = G >= RAIL_G0;
  const ticks = MONTHS.map((_, m) => {
    const y = lineCY(m * LINES_PER_MONTH);
    const t = clamp01((G - MONTH_REACHED[m]) / 5);
    return { y, t };
  });
  const nowT = clamp01(futNow);

  // --- stations: conversion states (with the drain's revert) ---
  const revert = [0, 1, 2].map((s) => seg(dU[s], DRAIN_REVERT));
  const lp = loopPhiAt(G);
  const loopKeep = 1 - revert[0];
  const upDeg = lp.up * loopKeep;
  const downDeg = lp.down * loopKeep;
  const flipT = smoothstep((G - G_LOOP_FLIP) / LOOP_FLIP_F) * (upDeg >= LOOP_ARROW_DEG - 180 - 0.01 ? 1 : 0);
  const flipAmt = G_LOOP_FLIP === Infinity ? 0 : flipT;
  // the packet: forward, then reversed where the orange reached the arrow; the
  // drain turns it forward again. Integrated over G so it never jumps.
  const packetDeg = (() => {
    const w0 = 360 / LOOP_PERIOD;
    let a = 200;
    const g1 = Math.round(G);
    const gStart = -60;
    for (let g = gStart; g < g1; g++) {
      const rev = G_LOOP_FLIP === Infinity ? 0 : smoothstep((g - G_LOOP_FLIP) / LOOP_REVERSE_F);
      const back = drain ? seg(drainLocal(drain, g, lineCY(PLAN_LINE_IDX[0])), DRAIN_REVERT) : 0;
      const s = rev * (1 - back);
      a += w0 * (1 - 2 * s);
    }
    return ((a % 360) + 360) % 360;
  })();
  const inArc = (deg: number) => {
    const dUp = (deg - 180 + 360) % 360; // 0..360 going up from contact
    if (dUp <= upDeg) return true;
    const dDn = (180 - deg + 360) % 360;
    return dDn <= downDeg;
  };
  const packetOrange = inArc(packetDeg) ? 1 : 0;
  const evalT = EVAL_ROW_G.map((g) => clamp01((G - g) / EVAL_FLIP_F) * (1 - revert[1]));
  const infraT = INFRA_UNIT_G.map((g) => clamp01((G - g) / INFRA_UNIT_F) * (1 - revert[2]));
  const stationLit = [
    clamp01((lp.up + lp.down) / 60) * (1 - revert[0]),
    clamp01(Math.max(...evalT) * 2),
    clamp01((G - INFRA_CONTACT.G) / 10) * (1 - revert[2]),
  ];

  // --- swarm dots (with the drain's return to the line) ---
  const dots: React.ReactNode[] = [];
  const dotPos: { x: number; y: number }[][] = [[], [], []];
  for (let s = 0; s < 3; s++) {
    const u = dU[s];
    for (let i = 0; i < SWARM_N; i++) {
      const d = swarmDot(s, i, G);
      let { x, y, r, tone } = d;
      if (drain && d.phase > 0) {
        const p = SWARM_PLANS[s][i];
        const st0 = DRAIN_DOTS[0] + 0.3 * hash(p.seed, 51);
        let v = 0;
        let from = { x, y };
        if (drain.dotV && drain.localF && drain.reachAt) {
          // timed in frames: launch at Gd from where the dot was then
          const Gd = drain.reachAt(lineCY(PLAN_LINE_IDX[s])) + st0 * drain.localF;
          if (G >= Gd) {
            const d0 = swarmDot(s, i, Gd);
            from = { x: d0.x, y: d0.y };
            const T = Math.max(12, Math.min(30, (1.5 * ptDist(from, p.origin)) / drain.dotV));
            v = EASE(clamp01((G - Gd) / T));
          }
        } else if (u > 0) {
          v = EASE(clamp01((u - st0) / 0.3));
        }
        if (v > 0) {
          const q = curve(from, p.origin, v, -p.bBow);
          x = q.x;
          y = q.y;
          r = r * (1 - smoothstep((v - 0.6) / 0.4));
          tone = 1;
        }
      }
      dotPos[s].push({ x, y });
      if (r < 0.3) continue;
      dots.push(<circle key={`d${s}-${i}`} cx={n2(x)} cy={n2(y)} r={n2(r)} fill={TONE(tone)} />);
    }
  }

  // --- threads into the rack (swarm 3) ---
  const threadRetract = seg(dU[2], DRAIN_THREADS);
  const threads = THREAD_DOTS.map((di, u) => {
    const drawU = clamp01((G - THREAD_G0 - THREAD_STEP * u) / THREAD_DRAW_F) * (1 - threadRetract);
    if (drawU <= 0 || infraT[u] <= 0) return null;
    const a = dotPos[2][di];
    const b = rackUnit(0, u).led;
    const e = smoothstep(drawU);
    const hx = a.x + (b.x - a.x) * e;
    const hy = a.y + (b.y - a.y) * e;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const pk: React.ReactNode[] = [];
    if (drawU >= 1) {
      const travel = len / THREAD_PACKET_V;
      const g0 = THREAD_G0 + THREAD_STEP * u + THREAD_DRAW_F + u * 3;
      const nMax = Math.floor((G - g0) / THREAD_PACKET_PERIOD);
      const nMin = Math.max(0, Math.ceil((G - g0 - travel) / THREAD_PACKET_PERIOD));
      for (let n = nMin; n <= nMax; n++) {
        const t = (G - g0 - n * THREAD_PACKET_PERIOD) / travel;
        if (t < 0 || t > 1) continue;
        pk.push(<circle key={`tp${u}-${n}`} cx={n2(a.x + (b.x - a.x) * t)} cy={n2(a.y + (b.y - a.y) * t)} r={n2(PACKET_R)} fill={ACCENT} />);
      }
    }
    return (
      <g key={`th${u}`}>
        <line x1={n2(a.x)} y1={n2(a.y)} x2={n2(hx)} y2={n2(hy)} stroke={ACCENT} strokeWidth={n2(THREAD)} strokeLinecap="round" opacity={0.95} />
        {pk}
      </g>
    );
  });

  // --- the TRAINING loop ---
  const trn = STATIONS[0];
  const arrowPt = (deg: number) => ({
    x: trn.cx + LOOP_R * Math.cos((deg * Math.PI) / 180),
    y: trn.cy + LOOP_R * Math.sin((deg * Math.PI) / 180),
  });
  const chevron = (colour: string, op: number) => {
    const p = arrowPt(LOOP_ARROW_DEG);
    // tangent for clockwise travel at 270 deg is +x; flip rotates the head 180
    const rot = 180 * smoothstep(flipAmt);
    return (
      <g transform={`translate(${n2(p.x)} ${n2(p.y)}) rotate(${n2(rot)})`} opacity={op}>
        <path
          d="M -9 -13 L 7 0 L -9 13"
          fill="none"
          stroke={colour}
          strokeWidth={n2(STROKE)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };
  const pkt = arrowPt(packetDeg);
  const arrowOrange = upDeg >= LOOP_ARROW_DEG - 180 ? 1 : 0;

  // --- the EVALUATION checklist ---
  const evl = STATIONS[1];
  const rowEls = (colour: string, which: "white" | "orange") =>
    EVAL_ROWS.map((ry, r) => {
      const t = evalT[r];
      const op = which === "white" ? INK_LO * (1 - smoothstep(t * 1.6)) : smoothstep(t * 1.6);
      if (op <= 0.003) return null;
      const bx = evl.cx + EVAL_BOX_DX;
      const by = evl.cy + ry;
      const hb = EVAL_BOX / 2;
      const m = smoothstep(t); // X -> tick morph
      const ins = 7;
      // X: (TL->BR) and (BL->TR); tick: short (L-mid -> bottom-mid) and long (bottom-mid -> TR)
      const L = (a: number, b: number) => a + (b - a) * m;
      const s1 = [L(bx - hb + ins, bx - hb + 6), L(by - hb + ins, by + 1), L(bx + hb - ins, bx - 3), L(by + hb - ins, by + hb - 6)];
      const s2 = [L(bx - hb + ins, bx - 3), L(by + hb - ins, by + hb - 6), L(bx + hb - ins, bx + hb + 3), L(by - hb + ins, by - hb - 5)];
      return (
        <g key={`${which}${r}`} opacity={n2(op)}>
          <path d={roundRect(bx - hb, by - hb, bx + hb, by + hb, 4)} fill="none" stroke={colour} strokeWidth={n2(STROKE)} strokeLinejoin="round" />
          <line x1={n2(evl.cx + EVAL_BAR[0])} y1={n2(by)} x2={n2(evl.cx + EVAL_BAR[1])} y2={n2(by)} stroke={colour} strokeWidth={n2(STROKE)} strokeLinecap="round" />
          <line x1={n2(s1[0])} y1={n2(s1[1])} x2={n2(s1[2])} y2={n2(s1[3])} stroke={colour} strokeWidth={n2(STROKE * 0.8)} strokeLinecap="round" />
          <line x1={n2(s2[0])} y1={n2(s2[1])} x2={n2(s2[2])} y2={n2(s2[3])} stroke={colour} strokeWidth={n2(STROKE * 0.8)} strokeLinecap="round" />
        </g>
      );
    });

  // --- the racks ---
  const rackEls = (which: "white" | "orange") => {
    const out: React.ReactNode[] = [];
    for (let r = 0; r < RACKS; r++) {
      for (let u = 0; u < RACK_UNITS; u++) {
        const t = r === 0 ? infraT[u] : 0;
        const op = which === "white" ? INK_LO * (1 - smoothstep(t)) : smoothstep(t);
        if (op <= 0.003) continue;
        const b = rackUnit(r, u);
        const colour = which === "white" ? INK : ACCENT;
        out.push(
          <g key={`${which}${r}-${u}`} opacity={n2(op)}>
            <path d={roundRect(b.x0, b.y0, b.x1, b.y1, 4)} fill="none" stroke={colour} strokeWidth={n2(STROKE)} strokeLinejoin="round" />
            <circle cx={n2(b.led.x)} cy={n2(b.led.y)} r={n2(STROKE * 0.62)} fill={colour} />
          </g>,
        );
      }
    }
    return out;
  };

  const sIn = [0, 1, 2].map((s) => stationIn(s, G));
  const sRise = sIn.map((t) => (LABEL_RISE_PX / Math.max(k, 1e-3)) * (1 - t));
  const labelOp = (lit: number) => INK_LO + (INK_HI - INK_LO) * clamp01(lit);

  // --- the dim veil (screen space) ---
  const veil = clamp01(dim) * DIM_VEIL;
  let veilEl: React.ReactNode = null;
  if (veil > 0.002) {
    const win = dimWindow;
    const sw = win ? screenOf(cam, win.x0, win.y0) : null;
    const se = win ? screenOf(cam, win.x1, win.y1) : null;
    const fe = win ? (win.feather ?? 40) * k : 0;
    veilEl = (
      <svg width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <filter id="incVeilBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={n2(fe / 2)} />
          </filter>
          <mask id="incVeilMask" maskUnits="userSpaceOnUse" x={0} y={0} width={FRAME_W} height={FRAME_H}>
            <rect x={0} y={0} width={FRAME_W} height={FRAME_H} fill="white" />
            {sw && se ? (
              <rect
                x={n2(sw.x)}
                y={n2(sw.y)}
                width={n2(se.x - sw.x)}
                height={n2(se.y - sw.y)}
                rx={n2(fe / 2)}
                fill="black"
                filter="url(#incVeilBlur)"
              />
            ) : null}
          </mask>
        </defs>
        <rect x={0} y={0} width={FRAME_W} height={FRAME_H} fill="#0b0b0b" opacity={n2(veil)} mask="url(#incVeilMask)" />
      </svg>
    );
  }

  const worldDiv = (children: React.ReactNode) => (
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
      {children}
    </div>
  );
  const svgWrap = (children: React.ReactNode) => (
    <svg
      width={FRAME_W}
      height={FRAME_H}
      viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {children}
    </svg>
  );
  const shadow = `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))`;

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={BG_DIM}
        frame={GRID_W0 + G}
        cy={cy}
        cyRest={GRID_REST.cy}
        cx={cx}
        cxRest={GRID_REST.cx}
        k={k}
        parallax={parallax}
      />

      {/* ------------------------------ WHITE ------------------------------ */}
      <AbsoluteFill style={{ filter: shadow }}>
        {worldDiv(
          <>
            {svgWrap(
              <>
                {railOn && !textOnly ? (
                  <g style={{ filter: iconShadow(k) }}>
                    <line
                      x1={RAIL_X}
                      y1={n2(RAIL_TOP)}
                      x2={RAIL_X}
                      y2={n2(Math.max(RAIL_TOP, railHead))}
                      stroke={INK}
                      strokeWidth={n2(THREAD)}
                      strokeLinecap="round"
                      opacity={INK_LO}
                    />
                    {ticks.map((tk, m) =>
                      tk.t > 0 ? (
                        <line
                          key={`tk${m}`}
                          x1={RAIL_X}
                          y1={n2(tk.y)}
                          x2={n2(RAIL_X - TICK_LEN * smoothstep(tk.t))}
                          y2={n2(tk.y)}
                          stroke={INK}
                          strokeWidth={n2(THREAD)}
                          strokeLinecap="round"
                          opacity={INK_HI}
                        />
                      ) : null,
                    )}
                    {nowT > 0 ? (
                      <line
                        x1={RAIL_X + 10 * 0}
                        y1={n2(NOW_Y)}
                        x2={n2(RAIL_X + (COL_W + 30) * smoothstep(nowT))}
                        y2={n2(NOW_Y)}
                        stroke={INK}
                        strokeWidth={n2(THREAD)}
                        strokeLinecap="round"
                        strokeDasharray={`${n2(10)} ${n2(9)}`}
                        opacity={INK_LO}
                      />
                    ) : null}
                  </g>
                ) : null}

                {whiteBars}

                {/* TRAINING, white state */}
                <g style={{ filter: iconShadow(k) }} opacity={n2(sIn[0])} transform={`translate(0 ${n2(sRise[0])})`}>
                  <circle cx={trn.cx} cy={trn.cy} r={LOOP_R} fill="none" stroke={INK} strokeWidth={n2(STROKE)} opacity={INK_LO} />
                  {arrowOrange ? null : chevron(INK, INK_LO)}
                  {packetOrange ? null : <circle cx={n2(pkt.x)} cy={n2(pkt.y)} r={n2(STROKE * 0.95)} fill={INK} opacity={INK_HI} />}
                </g>
                {/* EVALUATION, white state */}
                <g style={{ filter: iconShadow(k) }} opacity={n2(sIn[1])} transform={`translate(0 ${n2(sRise[1])})`}>{rowEls(INK, "white")}</g>
                {/* INFRASTRUCTURE, white state + the mark */}
                <g opacity={n2(sIn[2])} transform={`translate(0 ${n2(sRise[2])})`}>
                  <g style={{ filter: iconShadow(k) }}>{rackEls("white")}</g>
                  <OpenAIMark x={ST_CX} y={MARK_CY} size={MARK_SIZE} opacity={labelOp(stationLit[2])} k={k} />
                </g>

                {/* the drain's empty brackets */}
                {[0, 1, 2].map((s) => {
                  const bu = seg(dU[s], DRAIN_BRACKET);
                  if (bu <= 0) return null;
                  const b = PLAN_BOXES[s];
                  return (
                    <path
                      key={`br${s}`}
                      d={roundRect(b.x0, b.y0, b.x1, b.y1, 12)}
                      fill="none"
                      stroke={INK}
                      strokeWidth={n2(STROKE)}
                      strokeLinejoin="round"
                      opacity={INK_HI}
                      pathLength={1}
                      strokeDasharray={bu < 1 ? `${bu} ${Math.max(1e-4, 1 - bu)}` : undefined}
                      style={{ filter: iconShadow(k) }}
                    />
                  );
                })}

                {whiteSvg}

                {/* the caret: white, solid, never blinks */}
                <rect
                  x={n2(caret.x - CARET_W / 2)}
                  y={n2(caret.y - CARET_H / 2)}
                  width={CARET_W}
                  height={CARET_H}
                  rx={CARET_W / 2}
                  fill={INK}
                />
              </>,
            )}
            {(textOnly ? [] : MONTHS).map((m, i) => (
              <WLabel
                key={m}
                x={MONTH_LABEL_R}
                y={lineCY(i * LINES_PER_MONTH) - LABEL_SIZE * 0.5}
                text={m}
                inT={(G - MONTH_REACHED[i]) / LABEL_IN}
                k={k}
                align="right"
              />
            ))}
            {STATIONS.map((st, s) => (
              <WLabel key={st.key} x={st.cx} y={st.labelY} text={st.key} inT={(G - STATION_IN[s]) / LABEL_IN} k={k} align="center" opacity={labelOp(stationLit[s])} />
            ))}
          </>,
        )}
      </AbsoluteFill>

      {veilEl}

      {/* ------------------------------ ORANGE ----------------------------- */}
      <AbsoluteFill style={{ filter: shadow }}>
        {worldDiv(
          svgWrap(
            <>
              {orangeBars}
              {/* TRAINING, converted */}
              <g style={{ filter: iconShadow(k) }}>
                {upDeg > 0.01 ? (
                  <path d={arcPath(trn.cx, trn.cy, LOOP_R, 180, 180 + upDeg)} fill="none" stroke={ACCENT} strokeWidth={n2(STROKE)} strokeLinecap="round" />
                ) : null}
                {downDeg > 0.01 ? (
                  <path d={arcPath(trn.cx, trn.cy, LOOP_R, 180 - downDeg, 180)} fill="none" stroke={ACCENT} strokeWidth={n2(STROKE)} strokeLinecap="round" />
                ) : null}
                {arrowOrange ? chevron(ACCENT, 1) : null}
                {packetOrange ? <circle cx={n2(pkt.x)} cy={n2(pkt.y)} r={n2(STROKE * 0.95)} fill={ACCENT} /> : null}
              </g>
              <g style={{ filter: iconShadow(k) }}>{rowEls(ACCENT, "orange")}</g>
              <g style={{ filter: iconShadow(k) }}>{rackEls("orange")}</g>
              {threads}
              {dots}
              {orangeSvg}
            </>,
          ),
        )}
      </AbsoluteFill>

      {/* ------------------------------ OVERLAYS --------------------------- */}
      {overSvg || overDom ? (
        <AbsoluteFill style={{ filter: shadow }}>
          {worldDiv(
            <>
              {overSvg ? svgWrap(overSvg) : null}
              {overDom}
            </>,
          )}
        </AbsoluteFill>
      ) : null}

      <Vignette />
    </AbsoluteFill>
  );
};

export { ACCENT, ACCENT_DEEP, INK, INK_HI, INK_LO, WORD_H, PITCH, mixHex };

/** Every world event, in G. */
export const WORLD_EVENTS = {
  railStarts: RAIL_G0,
  caretOntoRail: [W_UP0, W_UP0 + W_UP_F],
  caretOffRail: [W_DOWN0, W_DOWN0 + W_DOWN_F],
  monthReached: MONTH_REACHED,
  monthLabelLanded: MONTH_LABEL_LAND,
  planLineWritten: PLAN_LINE_IDX.map((i) => [lineStartG(i), lineStartG(i + 1)]),
  swarms: SWARM_SCHED.map((sc) => ({
    ignite: [sc.ignite, sc.ignite + IGNITE_F],
    birth: [sc.birth0, sc.birth1 + 28],
    flow: [sc.flow0, sc.flow1 + FLOW_T[SWARM_SCHED.indexOf(sc)][1]],
  })),
  trainingArrowFlips: G_LOOP_FLIP,
  trainingFullyOrange: G_LOOP_FULL,
  evaluationRowsFlip: EVAL_ROW_G,
  infraContact: INFRA_CONTACT.G,
  infraUnitsConvert: INFRA_UNIT_G,
  threadsDrawn: [THREAD_G0, THREAD_G0 + THREAD_STEP * (RACK_UNITS - 1) + THREAD_DRAW_F],
  nowLine: NOW_LINE,
  nowLineStarts: lineStartG(NOW_LINE),
};
