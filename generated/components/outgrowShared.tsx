import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  sway,
} from "./fieldShared";
import { DEEPMIND, OPENAI } from "./brandGlyphs";
import { GO_BLACK, GO_RECORDS, GO_N, GO_STARS, goIsBlack } from "./challengeShared";

// ---------------------------------------------------------------------------
// outgrowShared — the WORLD of Noam_Challenge_The_Model, V3.
//
// THE ONE IDEA: **SIZE IS STRENGTH, and you only grow on something your own
// size.** The model is the OpenAI mark; the bigger it is, the smarter. A
// question is a white `?` ring; the bigger it is, the harder. The model grows
// ONLY by taking in a question that is big against it — area adds, so
// R' = sqrt(R^2 + GAIN r^2) — and a question under EASY_RATIO of its radius
// is solved on contact and dropped: it teaches nothing. People can only write
// questions about their own size, so the model outgrows them. Game-playing AIs
// never run out, because their opponent is themselves: two identical marks
// across a real board, growing in lockstep.
//
// THE VOCABULARY (fixed; the same object means the same thing in all five):
//   the model     = OPENAI mark, filled ACCENT. Its em box is its size. Orange
//                   means the model and what it has hold of, NOTHING ELSE.
//   a question    = white ring with lucide circle-help's `?`. Radius = how hard.
//   working on it = an ACCENT arc sweeping round the ring from 12 o'clock. The
//                   sweep's length in frames is the time it takes:
//                   workFrames(r, R). Hard = a long sweep, easy = a snap.
//   solved        = the `?` un-draws, lucide's tick draws (in the ring's tone).
//   learned       = the solved ring pours into the mark and the mark grows by
//                   the law. Too easy = it is let go: tone back to white, ink
//                   down to INK_LO, and it drifts down and away.
//   a person      = person.png as a vector, white, PERSON_H.
//   a game AI     = the Google DeepMind mark, white, beside a REAL board playing
//                   a REAL record (AlphaGo-Lee Sedol game 2; AlphaGo Zero
//                   self-play; AlphaZero-Stockfish 2017 game 10).
// White ink at exactly two opacities, INK_HI 1.0 and INK_LO 0.5.
//
// Every component takes WORLD coordinates and is drawn inside `Stage`'s world
// group, which is one full-frame SVG under the camera's translate/scale. An
// icon's shadow is `iconShadow(k)` on a wrapper group.
// ---------------------------------------------------------------------------

export const FPS = 24;
export { ACCENT, ACCENT_DEEP };
export const INK = "#FFFFFF";
export const INK_HI = 1.0;
export const INK_LO = 0.5;
export const TWO_PI = Math.PI * 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clampF = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
/** Ease a 0..1 through a window [a, b]. */
export const win = (v: number, a: number, b: number) => smoothstep((v - a) / (b - a));
export const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
export const easeIn = (v: number) => Math.pow(clamp01(v), 2.2);

const INK_TONE = makeTone(INK, ACCENT);
/** White -> ripe accent, 0..1. */
export const inkTone = (t: number) => INK_TONE(t);

// --- sizes (WORLD px; the reference camera is k = 1) ---------------------------
export const PERSON_H = 118;
/** A question one person can write: radius range. The biggest a person writes is
 *  about their own size. */
export const Q_R_MIN = 40;
export const Q_R_MAX = 62;
export const Q_R = 48;
/** The set's stroke: 6 screen px on a person-sized ring at k 1, with PARTIAL zoom
 *  compensation (screen weight grows as sqrt(k)), and a ring's stroke grows as
 *  (r / Q_R)^0.4 so a big question reads heavier without turning into a tyre. */
export const STROKE_REF = 6;
export const strokeW = (k: number) => STROKE_REF / Math.sqrt(Math.max(k, 0.05));
export const ringStroke = (r: number, k: number) => strokeW(k) * Math.pow(r / Q_R, 0.4);
/** A thread (board lines, paths) is half the stroke. */
export const threadW = (k: number) => strokeW(k) / 2;

// --- the law ---------------------------------------------------------------------
/** The mark's working radius is this fraction of its em box (the knot's ink
 *  reaches ~0.48 of the box from centre; its lobes dip to ~0.40). */
export const MARK_R_OF_EM = 0.46;
export const markR = (em: number) => em * MARK_R_OF_EM;
export const emOfR = (R: number) => R / MARK_R_OF_EM;
/** Area gain when a question is taken in. */
export const GAIN = 6;
export const grow = (R: number, r: number) => Math.sqrt(R * R + GAIN * r * r);
/** Below this r / R a question is too easy: solved, dropped, nothing learned. */
export const EASY_RATIO = 0.15;
export const isEasy = (r: number, R: number) => r / R < EASY_RATIO;
/** Frames the accent arc takes to go round: the time the question takes. */
export const workFrames = (r: number, R: number) =>
  Math.max(4, Math.min(40, Math.round(68 * (r / R))));
/** The model's final size in the film: what cut 1 grows it to and what cuts 4
 *  and 5 stand it at. A person's biggest question (Q_R_MAX) is under
 *  EASY_RATIO of it, which is the whole point. */
export const MODEL_EM_FULL = 970;
/** Frames for the tick, and for a learned ring to pour in. */
export const TICK_F = 8;
export const POUR_F = 12;
/** Where a ring touches the mark: centre distance at contact. */
export const contactDist = (R: number, r: number) => R * 0.92 + r;

// ---------------------------------------------------------------------------
// CAMERA. A camera is its own keyed track: a list of GLIDES, each an eased
// delta of (look x, look y, ln k) over [f0, f1]. Glides SUPERPOSE, so two that
// overlap blend into one continuous move with no stop between them, and each
// one's velocity is zero at both ends (smoothstep^warp), so the sum is C1. Then
// the same damped follower as every approved piece (CAM_STIFF / CAM_DAMP).
// `look` is the content centre; the camera centre is look + CAM_LIFT / k, so
// the content lands at screen y 835 above the captions.
// ---------------------------------------------------------------------------
export type Glide = { f0: number; f1: number; dx?: number; dy?: number; k?: number; warp?: number };
export type Cam = { x: number; y: number; k: number };
export const camEase = (u: number, warp = 1) => smoothstep(Math.pow(clamp01(u), warp));

export const cameraTrack = (start: { x: number; y: number; k: number }, glides: Glide[], frames: number) => {
  // target per frame
  const T: Cam[] = [];
  for (let f = 0; f <= frames + 2; f++) {
    let x = start.x;
    let y = start.y;
    let lk = Math.log(start.k);
    let kPrev = start.k;
    for (const g of glides) {
      const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    const k = Math.exp(lk);
    T.push({ x, y: y + CAM_LIFT / k, k });
  }
  // damped follower
  const out: Cam[] = [];
  let c = { ...T[0] };
  let v = { x: 0, y: 0, k: 0 };
  for (let f = 0; f < T.length; f++) {
    if (f > 0) {
      const t = T[f];
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    out.push({ ...c });
  }
  return out;
};

/** Where a world point lands on screen under camera c (no sway). */
export const toScreen = (c: Cam, x: number, y: number) => ({
  x: FRAME_W / 2 + (x - c.x) * c.k,
  y: FRAME_H / 2 + (y - c.y) * c.k,
});

/** Camera smoothness, measured the way the brief asks: the screen velocity of
 *  fixed world points, and the largest change of it between frames. */
export const camJerk = (track: Cam[], frames: number) => {
  let maxA = 0;
  let at = 0;
  let maxV = 0;
  const pts = [
    [-200, -300],
    [200, 300],
    [0, 0],
  ];
  for (let f = 1; f < frames - 1; f++) {
    for (const [ox, oy] of pts) {
      const wx = track[f].x + ox / track[f].k;
      const wy = track[f].y + oy / track[f].k;
      const s0 = toScreen(track[f - 1], wx, wy);
      const s1 = toScreen(track[f], wx, wy);
      const s2 = toScreen(track[f + 1], wx, wy);
      const v1 = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      const ax = s2.x - 2 * s1.x + s0.x;
      const ay = s2.y - 2 * s1.y + s0.y;
      const a = Math.hypot(ax, ay);
      if (a > maxA) {
        maxA = a;
        at = f;
      }
      maxV = Math.max(maxV, v1);
    }
  }
  return { maxA, at, maxV };
};

// ---------------------------------------------------------------------------
// STAGE: background, the world under the camera, vignette. One full-frame SVG
// with a world group, so every noun is in one coordinate system and one shadow.
// ---------------------------------------------------------------------------
export const Stage: React.FC<{
  frame: number;
  cam: Cam;
  rest: Cam;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ frame, cam, rest, children, overlay }) => {
  const sw = sway(frame);
  const k = cam.k;
  const tx = FRAME_W / 2 - cam.x * k + sw.dx;
  const ty = FRAME_H / 2 - cam.y * k + sw.dy;
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cam.y}
        cyRest={rest.y}
        cx={cam.x}
        cxRest={rest.x}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))`,
        }}
      >
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
          <g transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(6)})`}>{children}</g>
        </svg>
      </AbsoluteFill>
      {overlay}
      <Vignette />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// THE MODEL — the OpenAI mark, filled accent, em box `em` centred on (x, y).
// ---------------------------------------------------------------------------
export const MODEL_SHADOW = 0.27;
export const ModelMark: React.FC<{ k: number; x: number; y: number; em: number; opacity?: number }> = ({
  k,
  x,
  y,
  em,
  opacity = 1,
}) => {
  if (!(em > 0) || opacity <= 0) return null;
  return (
    <g style={{ filter: iconShadow(k, undefined, undefined, MODEL_SHADOW) }} opacity={opacity}>
      <g transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${(em / 24).toFixed(6)}) translate(-12 -12)`}>
        {OPENAI.paths.map((d) => (
          <path key={d.length} d={d} fill={ACCENT} fillRule="evenodd" />
        ))}
      </g>
    </g>
  );
};

/** THE GAME AI — the Google DeepMind mark, white, filled. `rot` in degrees
 *  (the player across the board sits rotated 180). */
export const DeepMindMark: React.FC<{
  k: number;
  x: number;
  y: number;
  em: number;
  rot?: number;
  opacity?: number;
}> = ({ k, x, y, em, rot = 0, opacity = 1 }) => {
  if (!(em > 0) || opacity <= 0) return null;
  return (
    <g style={{ filter: iconShadow(k, undefined, undefined, MODEL_SHADOW) }} opacity={opacity}>
      <g
        transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${rot.toFixed(3)}) scale(${(em / 24).toFixed(
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

// ---------------------------------------------------------------------------
// A PERSON — person.png redrawn as vector (head circle + shoulder dome, on its
// own 512 box, ink 41..470), so it scales with the camera and never races frame
// capture. `h` is the 512 box's size in world px; (x, y) is the box centre.
// ---------------------------------------------------------------------------
const PERSON_BODY =
  "M41 458 C41 352 126 266 232 266 L279 266 C385 266 470 352 470 458 L470 462 Q470 470 462 470 L49 470 Q41 470 41 462 Z";
export const Person: React.FC<{ k: number; x: number; y: number; h?: number; opacity?: number }> = ({
  k,
  x,
  y,
  h = PERSON_H,
  opacity = 1,
}) => {
  if (opacity <= 0) return null;
  const s = h / 512;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <g transform={`translate(${(x - h / 2).toFixed(3)} ${(y - h / 2).toFixed(3)}) scale(${s.toFixed(6)})`}>
        <circle cx={255.5} cy={143} r={102} fill={INK} />
        <path d={PERSON_BODY} fill={INK} />
      </g>
    </g>
  );
};
/** A person's head top and hands height, relative to the box centre. */
export const PERSON_TOP = (h: number = PERSON_H) => -h / 2 + (41 / 512) * h;

// ---------------------------------------------------------------------------
// A QUESTION. One ring, everything read off four numbers:
//   work 0..1   the accent arc round the ring (the model working on it)
//   done 0..1   `?` un-draws, tick draws
//   tone 0..1   the whole ring's colour, white -> accent (what the model holds)
//   opacity     INK_HI normally; INK_LO when it is let go
// lucide circle-help: ring r 10 on the 24 box, so the glyph box is 2.4 r.
// ---------------------------------------------------------------------------
const Q_PATH = "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3";
const Q_DOT = "M12 17h.01";
const TICK = "m9 12 2 2 4-4";

export const QRing: React.FC<{
  x: number;
  y: number;
  r: number;
  k: number;
  work?: number;
  done?: number;
  tone?: number;
  opacity?: number;
}> = ({ x, y, r, k, work = 0, done = 0, tone = 0, opacity = 1 }) => {
  if (opacity <= 0.002 || r <= 0.5) return null;
  const sw = ringStroke(r, k);
  const d = clamp01(done);
  const qDraw = 1 - smoothstep(clamp01(d / 0.55));
  const ck = smoothstep(clamp01((d - 0.24) / 0.76));
  const col = inkTone(tone);
  const box = 2.4 * r;
  const gs = box / 24;
  const gsw = sw / gs;
  const w = clamp01(work);
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity.toFixed(4)}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={col} strokeWidth={sw} />
      {w > 0 && w < 1 ? (
        <circle
          cx={x}
          cy={y}
          r={r}
          fill="none"
          stroke={ACCENT}
          strokeWidth={sw * 1.04}
          pathLength={1}
          strokeDasharray={`${w.toFixed(4)} 1`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${x.toFixed(2)} ${y.toFixed(2)})`}
        />
      ) : null}
      <g
        transform={`translate(${(x - box / 2).toFixed(3)} ${(y - box / 2).toFixed(3)}) scale(${gs.toFixed(5)})`}
        fill="none"
        stroke={col}
        strokeWidth={gsw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {qDraw > 0.004 ? (
          <>
            <path d={Q_PATH} pathLength={1} strokeDasharray={`${qDraw.toFixed(4)} 1`} />
            <path d={Q_DOT} opacity={qDraw > 0.5 ? 1 : qDraw * 2} />
          </>
        ) : null}
        {ck > 0.004 ? <path d={TICK} pathLength={1} strokeDasharray={`${ck.toFixed(4)} 1`} /> : null}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// LABELS — Roboto Condensed Bold, all caps, tracked 0.04em; they slide up
// ~24 screen px while fading in, never pop.
// ---------------------------------------------------------------------------
const LABEL_FONT = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
export const FONT_LABEL = LABEL_FONT.fontFamily;
export const Label: React.FC<{
  x: number;
  y: number;
  size: number;
  k: number;
  text: string;
  appear?: number;
  opacity?: number;
  anchor?: "start" | "middle" | "end";
}> = ({ x, y, size, k, text, appear = 1, opacity = INK_HI, anchor = "middle" }) => {
  const a = clamp01(appear);
  if (a <= 0) return null;
  const lift = (1 - easeOut(a)) * (24 / k);
  return (
    <g style={{ filter: iconShadow(k) }} opacity={(a * opacity).toFixed(4)}>
      <text
        x={x}
        y={y + lift}
        fontFamily={FONT_LABEL}
        fontWeight={700}
        fontSize={size}
        letterSpacing="0.04em"
        textAnchor={anchor}
        fill={INK}
        dominantBaseline="middle"
      >
        {text}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// A GO BOARD, 19x19, playing one of GO_RECORDS. `movesF` is how many moves have
// been played, fractional: move i lands over (i, i + 0.75) of it. Lines are
// threads at INK_LO; white stones INK, black stones GO_BLACK with a hairline.
// ---------------------------------------------------------------------------
export const GO_CELL = 46;
export const goHalf = (cell: number) => ((GO_N - 1) / 2) * cell;
export const goPoint = (x: number, y: number, cell: number, c: number, r: number) => ({
  x: x + (c - (GO_N - 1) / 2) * cell,
  y: y + (r - (GO_N - 1) / 2) * cell,
});

export const GoBoard: React.FC<{
  x: number;
  y: number;
  cell: number;
  k: number;
  record: number;
  movesF: number;
  draw?: number;
  opacity?: number;
  /** a stone's ownership tint: the move index whose stone is "just played" */
}> = ({ x, y, cell, k, record, movesF, draw = 1, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const half = goHalf(cell);
  const lw = threadW(k) * Math.min(1, Math.max(0.55, cell / GO_CELL));
  const rec = GO_RECORDS[record];
  const n = Math.min(rec.moves.length, Math.max(0, Math.ceil(movesF)));
  const lines: React.ReactNode[] = [];
  const dd = clamp01(draw);
  for (let i = 0; i < GO_N; i++) {
    const u = smoothstep(clamp01((dd - (i / (GO_N - 1)) * 0.5) / 0.5));
    if (u <= 0) continue;
    const off = -half + i * cell;
    lines.push(
      <line key={`v${i}`} x1={x + off} y1={y - half} x2={x + off} y2={y - half + 2 * half * u} />,
      <line key={`h${i}`} x1={x - half} y1={y + off} x2={x - half + 2 * half * u} y2={y + off} />,
    );
  }
  const sr = cell * 0.46;
  const stones: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const land = clamp01((movesF - i) / 0.75);
    const cap = rec.capturedAt[i];
    const gone = cap === Infinity ? 0 : clamp01((movesF - cap) / 1.2);
    const op = smoothstep(land) * (1 - smoothstep(gone));
    if (op <= 0.003) continue;
    const [c, r] = rec.moves[i];
    const p = goPoint(x, y, cell, c, r);
    const s = lerp(1.1, 1, smoothstep(land));
    stones.push(
      goIsBlack(i) ? (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={sr * s}
          fill={GO_BLACK}
          stroke={INK}
          strokeOpacity={INK_LO}
          strokeWidth={lw * 0.6}
          opacity={op}
        />
      ) : (
        <circle key={i} cx={p.x} cy={p.y} r={sr * s} fill={INK} opacity={op} />
      ),
    );
  }
  return (
    <g opacity={opacity}>
      <g stroke={INK} strokeOpacity={INK_LO} strokeWidth={lw} style={{ filter: iconShadow(k) }}>
        {lines}
        {dd >= 1
          ? GO_STARS.map(([c, r]) => {
              const p = goPoint(x, y, cell, c, r);
              return <circle key={`s${c}${r}`} cx={p.x} cy={p.y} r={cell * 0.09} fill={INK} fillOpacity={INK_LO} stroke="none" />;
            })
          : null}
      </g>
      <g style={{ filter: iconShadow(k) }}>{stones}</g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// A CHESS BOARD playing AlphaZero (white) vs Stockfish, 2017, game 10 — the
// Nh6+ knight-sacrifice game. Source: chessgames.com gid 1899423 / the lichess
// "AlphaZero vs Stockfish Games" study; the first 80 plies were run through
// python-chess (every move legal) and converted to piece ids and target squares
// by scratchpad/chess_conv.py. Row 0 = rank 8 (black's back rank at the top).
// Pieces are lucide's chess outlines: white side INK, black side GO_BLACK.
// ---------------------------------------------------------------------------
export const CHESS_PIECES: readonly [string, number, number][] = [
  ["R", 0, 7], ["N", 1, 7], ["B", 2, 7], ["Q", 3, 7], ["K", 4, 7], ["B", 5, 7], ["N", 6, 7], ["R", 7, 7],
  ["P", 0, 6], ["P", 1, 6], ["P", 2, 6], ["P", 3, 6], ["P", 4, 6], ["P", 5, 6], ["P", 6, 6], ["P", 7, 6],
  ["p", 0, 1], ["p", 1, 1], ["p", 2, 1], ["p", 3, 1], ["p", 4, 1], ["p", 5, 1], ["p", 6, 1], ["p", 7, 1],
  ["r", 0, 0], ["n", 1, 0], ["b", 2, 0], ["q", 3, 0], ["k", 4, 0], ["b", 5, 0], ["n", 6, 0], ["r", 7, 0],
];
/** [pieceId, toFile, toRow, capturedId | -1, (rookId, rookFile, rookRow) on castling] */
export const CHESS_PLIES: readonly number[][] = [
  [6, 5, 5, -1], [30, 5, 2, -1], [11, 3, 4, -1], [20, 4, 2, -1], [10, 2, 4, -1], [17, 1, 2, -1],
  [14, 6, 5, -1], [26, 1, 1, -1], [5, 6, 6, -1], [29, 4, 1, -1], [4, 6, 7, -1, 7, 5, 7], [28, 6, 0, -1, 31, 5, 0],
  [11, 3, 3, -1], [20, 3, 3, 11], [6, 7, 4, -1], [18, 2, 2, -1], [10, 3, 3, 20], [30, 3, 3, 10],
  [6, 5, 3, -1], [30, 2, 1, -1], [12, 4, 4, -1], [19, 3, 3, -1], [12, 3, 3, 19], [30, 3, 3, 12],
  [1, 2, 5, -1], [30, 2, 5, 1], [3, 6, 4, -1], [22, 6, 2, -1], [6, 7, 2, -1], [28, 6, 1, -1],
  [9, 2, 5, 30], [26, 2, 0, -1], [3, 5, 4, -1], [27, 3, 2, -1], [3, 0, 4, -1], [22, 6, 3, -1],
  [7, 4, 7, -1], [28, 7, 2, 6], [15, 7, 4, -1], [21, 5, 2, -1], [2, 4, 5, -1], [26, 5, 3, -1],
  [0, 3, 7, -1], [27, 0, 5, -1], [3, 2, 4, -1], [17, 1, 3, -1], [15, 6, 3, 22], [21, 6, 3, 15],
  [3, 7, 4, -1], [28, 6, 2, -1], [3, 7, 7, -1], [28, 6, 1, -1], [5, 4, 4, -1], [26, 6, 2, -1],
  [5, 6, 2, 26], [23, 6, 2, 5], [3, 7, 5, -1], [29, 5, 2, -1], [4, 6, 6, -1], [27, 0, 6, 8],
  [7, 7, 7, -1], [27, 6, 0, -1], [9, 2, 4, -1], [31, 4, 0, -1], [2, 3, 4, -1], [29, 3, 4, 2],
  [0, 3, 4, 29], [31, 3, 0, -1], [0, 3, 0, 31], [27, 3, 0, 0], [3, 4, 2, -1], [25, 3, 1, -1],
  [7, 3, 7, -1], [25, 2, 3, -1], [7, 3, 0, 27], [25, 4, 2, 3], [7, 0, 0, 24], [28, 5, 2, -1],
  [9, 1, 3, 17], [18, 1, 3, 9],
];
const CHESS_ICON: Record<string, string[]> = {
  k: [
    "M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z",
    "m6.7 18-1-1C4.35 15.682 3 14.09 3 12a5 5 0 0 1 4.95-5c1.584 0 2.7.455 4.05 1.818C13.35 7.455 14.466 7 16.05 7A5 5 0 0 1 21 12c0 2.082-1.359 3.673-2.7 5l-1 1",
    "M10 4h4",
    "M12 2v6.818",
  ],
  q: [
    "M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z",
    "m12.474 5.943 1.567 5.34a1 1 0 0 0 1.75.328l2.616-3.402",
    "m20 9-3 9",
    "m5.594 8.209 2.615 3.403a1 1 0 0 0 1.75-.329l1.567-5.34",
    "M7 18 4 9",
    "M14 4a2 2 0 1 1-4 0a2 2 0 1 1 4 0",
    "M22 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0",
    "M6 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0",
  ],
  r: [
    "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z",
    "M10 2v2",
    "M14 2v2",
    "m17 18-1-9",
    "M6 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2",
    "M6 4h12",
    "m7 18 1-9",
  ],
  b: [
    "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z",
    "M15 18c1.5-.615 3-2.461 3-4.923C18 8.769 14.5 4.462 12 2 9.5 4.462 6 8.77 6 13.077 6 15.539 7.5 17.385 9 18",
    "m16 7-2.5 2.5",
    "M9 2h6",
  ],
  n: [
    "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z",
    "M16.5 18c1-2 2.5-5 2.5-9a7 7 0 0 0-7-7H6.635a1 1 0 0 0-.768 1.64L7 5l-2.32 5.802a2 2 0 0 0 .95 2.526l2.87 1.456",
    "m15 5 1.425-1.425",
    "m17 8 1.53-1.53",
    "M9.713 12.185 7 18",
  ],
  p: [
    "M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z",
    "m14.5 10 1.5 8",
    "M7 10h10",
    "m8 18 1.5-8",
    "M16 6a4 4 0 1 1-8 0a4 4 0 1 1 8 0",
  ],
};

/** Piece squares after `ply` whole plies, plus each piece's capture ply. */
const CHESS_STATES = (() => {
  const pos = CHESS_PIECES.map(([, c, r]) => [c, r] as [number, number]);
  const states: [number, number][][] = [pos.map((p) => [...p] as [number, number])];
  const capturedAt: number[] = CHESS_PIECES.map(() => Infinity);
  CHESS_PLIES.forEach((m, i) => {
    const [id, c, r, cap] = m;
    if (cap >= 0) capturedAt[cap] = i;
    pos[id] = [c, r];
    if (m.length > 4) pos[m[4]] = [m[5], m[6]];
    states.push(pos.map((p) => [...p] as [number, number]));
  });
  return { states, capturedAt };
})();
export const CHESS_PLY_COUNT = CHESS_PLIES.length;

export const ChessBoard: React.FC<{
  x: number;
  y: number;
  cell: number;
  k: number;
  plyF: number;
  opacity?: number;
}> = ({ x, y, cell, k, plyF, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const half = cell * 4;
  const lw = threadW(k) * Math.min(1, Math.max(0.55, cell / 100));
  const pf = Math.max(0, Math.min(CHESS_PLY_COUNT, plyF));
  const whole = Math.floor(pf);
  const frac = pf - whole;
  const A = CHESS_STATES.states[whole];
  const B = CHESS_STATES.states[Math.min(CHESS_PLY_COUNT, whole + 1)];
  const slide = smoothstep(clamp01(frac / 0.7));
  const squares: React.ReactNode[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1)
        squares.push(
          <rect key={`q${r}${c}`} x={x - half + c * cell} y={y - half + r * cell} width={cell} height={cell} />,
        );
  const pieces: React.ReactNode[] = [];
  const pw = strokeW(k) * Math.min(1.1, Math.max(0.5, cell / 100));
  CHESS_PIECES.forEach(([sym, ,], id) => {
    const cap = CHESS_STATES.capturedAt[id];
    const goneT = cap === Infinity ? 0 : clamp01(pf - cap - 0.55) / 0.45;
    if (goneT >= 1) return;
    const a = A[id];
    const b = B[id];
    const cx = x - half + (lerp(a[0], b[0], slide) + 0.5) * cell;
    const cy = y - half + (lerp(a[1], b[1], slide) + 0.5) * cell;
    const white = sym === sym.toUpperCase();
    const box = cell * 0.78;
    const gs = box / 24;
    pieces.push(
      <g
        key={id}
        opacity={1 - smoothstep(goneT)}
        transform={`translate(${(cx - box / 2).toFixed(2)} ${(cy - box / 2).toFixed(2)}) scale(${gs.toFixed(5)})`}
        fill="none"
        stroke={white ? INK : GO_BLACK}
        strokeWidth={pw / gs}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {CHESS_ICON[sym.toLowerCase()].map((d) => (
          <path key={d} d={d} />
        ))}
      </g>,
    );
  });
  return (
    <g opacity={opacity}>
      <g fill={BG_BASE} fillOpacity={0.22}>{squares}</g>
      <rect
        x={x - half}
        y={y - half}
        width={half * 2}
        height={half * 2}
        fill="none"
        stroke={INK}
        strokeOpacity={INK_LO}
        strokeWidth={lw}
        style={{ filter: iconShadow(k) }}
      />
      <g style={{ filter: iconShadow(k) }}>{pieces}</g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// A dashed would-be route: a straight thread at INK_LO from (x0, y0) toward
// (x1, y1), drawn head-first by `draw` 0..1 with a white tip at the head; the
// dashes march so it is never static.
// ---------------------------------------------------------------------------
export const DashedPath: React.FC<{
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  k: number;
  draw: number;
  frame: number;
  opacity?: number;
}> = ({ x0, y0, x1, y1, k, draw, frame, opacity = INK_LO }) => {
  const dr = clamp01(draw);
  if (dr <= 0) return null;
  const hx = x0 + (x1 - x0) * dr;
  const hy = y0 + (y1 - y0) * dr;
  const w = threadW(k) * 1.5;
  return (
    <g style={{ filter: iconShadow(k) }}>
      <line
        x1={x0}
        y1={y0}
        x2={hx}
        y2={hy}
        stroke={INK}
        strokeOpacity={opacity}
        strokeWidth={w}
        strokeLinecap="round"
        strokeDasharray={`${(22).toFixed(1)} ${(18).toFixed(1)}`}
        strokeDashoffset={-frame * 0.9}
      />
      {dr < 1 ? <circle cx={hx} cy={hy} r={w * 1.3} fill={INK} /> : null}
    </g>
  );
};

/** Deterministic hash re-export, so cuts need not import fieldShared for it. */
export { hash, clamp01, smoothstep };

// ---------------------------------------------------------------------------
// THE FEED — the law, run forward one frame at a time. Every question is
// authored as (where it is born, when it TOUCHES the model, at what angle);
// everything after the touch is the mechanism's:
//   work   the arc goes round in workFrames(r, R at the touch) frames, the ring
//          riding the rim outward as the model grows under it
//   tick   TICK_F frames: `?` -> tick
//   then   LEARNED (r >= EASY_RATIO * R at the touch): the ring pours into the
//          model over POUR_F and R^2 grows by GAIN r^2 on the same ease; or
//          TOO EASY: tone back to white, peel off the rim sideways and fall,
//          INK_HI -> INK_LO, then out.
// R(f) is therefore a function of which rings have poured by frame f, and
// nothing else — no timer decides when the model grows.
// ---------------------------------------------------------------------------
export type FeedRing = {
  r: number;
  /** birth: the ring appears here (above a person's head) */
  bx: number;
  by: number;
  bornF: number;
  /** frame it touches the model, and the contact angle (deg, 90 = straight below) */
  touchF: number;
  angle: number;
  /** sideways bow of the flight, world px */
  bow?: number;
  /** force the verdict (for a cut that stages one ring) */
  easy?: boolean;
};
export type RingState = {
  x: number;
  y: number;
  r: number;
  work: number;
  done: number;
  tone: number;
  op: number;
  /** 0 flying, 1 working, 2 pouring, 3 released, -1 not yet / gone */
  phase: number;
};
export const RELEASE_F = 40;

export const runFeed = (
  M: { x: number; y: number },
  R0: number,
  rings: FeedRing[],
  f0: number,
  f1: number,
  workOf: (r: number, R: number) => number = workFrames,
) => {
  const Rs: number[] = [];
  const states: RingState[][] = [];
  const verdict: { easy: boolean; W: number; Rtouch: number }[] = rings.map(() => ({
    easy: false,
    W: 0,
    Rtouch: 0,
  }));
  const decided = rings.map(() => false);
  for (let f = f0; f <= f1; f++) {
    // R from pours so far (a pour's contribution eases in over POUR_F)
    let R2 = R0 * R0;
    rings.forEach((g, i) => {
      if (!decided[i] || verdict[i].easy) return;
      const pourStart = g.touchF + verdict[i].W + TICK_F;
      R2 += GAIN * g.r * g.r * smoothstep((f - pourStart) / POUR_F);
    });
    const R = Math.sqrt(R2);
    // decide verdicts at the touch, with the R of that frame
    rings.forEach((g, i) => {
      if (!decided[i] && f >= g.touchF) {
        decided[i] = true;
        const easy = g.easy ?? isEasy(g.r, R);
        verdict[i] = { easy, W: workOf(g.r, R), Rtouch: R };
      }
    });
    Rs.push(R);
    const row: RingState[] = rings.map((g, i) => {
      const th = (g.angle * Math.PI) / 180;
      const dir = { x: Math.cos(th), y: Math.sin(th) };
      const rim = (Rn: number) => ({ x: M.x + dir.x * contactDist(Rn, g.r), y: M.y + dir.y * contactDist(Rn, g.r) });
      if (f < g.bornF) return { x: g.bx, y: g.by, r: g.r, work: 0, done: 0, tone: 0, op: 0, phase: -1 };
      if (f < g.touchF) {
        // flight: born (grow in over 8 f), then an eased glide to where the rim will be
        const u = (f - g.bornF) / (g.touchF - g.bornF);
        const e = 0.5 - 0.5 * Math.cos(Math.PI * clamp01(u));
        const end = rim(R);
        const px = g.bx + (end.x - g.bx) * e;
        const py = g.by + (end.y - g.by) * e;
        // bow perpendicular to the chord
        const cx = end.x - g.bx;
        const cy = end.y - g.by;
        const L = Math.hypot(cx, cy) || 1;
        const b = (g.bow ?? 0) * Math.sin(Math.PI * clamp01(u));
        const born = smoothstep((f - g.bornF) / 8);
        return {
          x: px + (-cy / L) * b,
          y: py + (cx / L) * b,
          r: g.r * (0.7 + 0.3 * born),
          work: 0,
          done: 0,
          tone: 0,
          op: born,
          phase: 0,
        };
      }
      const v = verdict[i];
      const tw = f - g.touchF;
      const p = rim(R);
      if (tw < v.W + TICK_F) {
        return {
          ...p,
          r: g.r,
          work: clamp01(tw / v.W),
          done: clamp01((tw - v.W) / TICK_F),
          tone: smoothstep((tw - v.W * 0.85) / (v.W * 0.15 + 3)),
          op: 1,
          phase: 1,
        };
      }
      const ta = tw - v.W - TICK_F;
      if (!v.easy) {
        if (ta >= POUR_F) return { ...p, r: g.r, work: 1, done: 1, tone: 1, op: 0, phase: -1 };
        const e = Math.pow(clamp01(ta / POUR_F), 1.6);
        return {
          x: lerp(p.x, M.x, e * 0.85),
          y: lerp(p.y, M.y, e * 0.85),
          r: g.r * (1 - 0.65 * e),
          work: 1,
          done: 1,
          tone: 1,
          op: 1 - smoothstep((ta - POUR_F * 0.35) / (POUR_F * 0.65)),
          phase: 2,
        };
      }
      if (ta >= RELEASE_F) return { ...p, r: g.r, work: 0, done: 1, tone: 0, op: 0, phase: -1 };
      // released: peel off sideways, then fall; the rim point is frozen at release
      const Rr = v.Rtouch;
      const q = { x: M.x + dir.x * contactDist(Rr, g.r), y: M.y + dir.y * contactDist(Rr, g.r) };
      const side = Math.abs(dir.x) < 0.12 ? (hash(i, 41) < 0.5 ? -1 : 1) : Math.sign(dir.x);
      const s = ta / RELEASE_F;
      const out = easeOut(s);
      return {
        x: q.x + side * 150 * out + dir.x * 30 * out,
        y: q.y + dir.y * 40 * out + 170 * s * s,
        r: g.r,
        work: 0,
        done: 1,
        tone: 1 - smoothstep(ta / 8),
        op: lerp(1, INK_LO, smoothstep(ta / 10)) * (1 - smoothstep((ta - RELEASE_F + 16) / 16)),
        phase: 3,
      };
    });
    states.push(row);
  }
  return {
    f0,
    R: (f: number) => Rs[Math.max(0, Math.min(Rs.length - 1, Math.round(f) - f0))],
    at: (f: number) => states[Math.max(0, Math.min(states.length - 1, Math.round(f) - f0))],
    verdict,
  };
};
