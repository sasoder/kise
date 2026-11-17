import React from "react";
import { ACCENT, clamp01, hash, iconShadow, smoothstep } from "../kits/dwarkesh/fieldShared";
import { FONT_LABEL, INK } from "../kits/dwarkesh/alignShared";
import { HIGHLIGHT } from "../kits/dwarkesh/levelUp";
import { AiFigure, EYE_TONE, EYE_UNITS, FACE_UNITS, HEAD_MARK, eyePath, figurePose } from "../rsi-another-jump/timelineWorld";
import { HEAD_OUTER } from "../rsi-another-jump/jumpWorld";

// ---------------------------------------------------------------------------
// replicateWorld — the small gallery of cut 23 (`ReplicateOrExceed`, rsi-years-in-days).
// World px = screen px at the resolved camera (k 1, cx 540, cy 960); the cut ends on a slow creep from there.
//   * two white marble BUSTS in profile facing right, each on a white plinth with its name cut into the face:
//     Napoleon (bicorne with cockade, high collar, epaulette) and the young Rockefeller (top hat, wing collar,
//     dark bow cravat). Flat white cut-paper shapes with a few board-colour interior lines, like the white
//     HumanFigure.
//   * inside each head a brain-shaped window (board colour) holds a clean drawn white BRAIN (the side-view brain of
//     rsi-derpy-interns/BottleneckedWeights, its outline, cerebellum and folds, copied here without the stem);
//     bright pulses run along its strokes.
//   * the orange intern (AiFigure, age 1, drawn 1.1x) stands right of them facing LEFT: its body is mirrored, its
//     OpenAI-mark head is never mirrored (the mirrored head is masked away and the real mark drawn on top).
//   * the copy: the same brain drawing in orange over the same board-colour window, above the intern's head, tied
//     to it by three orange thought dots.
// ---------------------------------------------------------------------------

export type P = { x: number; y: number };
const f2 = (v: number) => v.toFixed(2);
export const linePath = (pts: P[]) => (pts.length ? `M${pts.map((p) => `${f2(p.x)} ${f2(p.y)}`).join(" L")}` : "");

export const BOARD = "#383838"; // the window / engraving tone: the grid's own dark
export const INTERIOR_W = 3.6; // a cut line inside a white shape

// --- the room --------------------------------------------------------------------
export const FLOOR = 1230; // the floor line's top: plinths and the intern's feet stand here
export const FLOOR_SW = 8;
export const SOCLE_Y = 905; // a bust's truncation (its local origin)
export const PLINTH = { capTop: 930, capH: 26, gap: 6, w: 290, capW: 312, baseH: 24, baseW: 316 };
export const NAME_SIZE = 44;
export const NAME_Y = 1010; // the names' centre line
export const NAP_X = 215;
export const ROCK_X = 545;

// --- the brain (local units, centre 0,0, front to the right) -----------------------
// From BottleneckedWeights (rsi-derpy-interns, read-only): the user's accepted clean icon. Stem dropped (inside a
// head it means nothing). Local box: x -122..126, y -88..78.
type Seg = [number, number, number, number, number, number];
const BRAIN_START: [number, number] = [96, 44];
const BRAIN_SEGS: Seg[] = [
  [120, 30, 126, -12, 108, -38],
  [96, -62, 70, -76, 44, -74],
  [30, -84, 0, -88, -18, -80],
  [-38, -86, -74, -80, -94, -60],
  [-122, -36, -122, 14, -100, 30],
  [-84, 42, -58, 40, -40, 36],
  [-20, 34, 0, 40, 18, 50],
  [40, 62, 80, 62, 96, 44],
];
export const BRAIN_D = `M${BRAIN_START.join(" ")} ${BRAIN_SEGS.map((c) => `C${c.join(" ")}`).join(" ")} Z`;
export const BRAIN_BACK = "M-30 40 C-26 64 -46 80 -68 78 C-92 76 -106 58 -98 34";
const BRAIN_FOLDS = [
  "M100 18 C72 6 38 8 10 26",
  "M8 -84 C-2 -68 14 -56 6 -40 C0 -28 -8 -22 -4 -12",
  "M72 -66 C60 -54 74 -42 66 -30 C62 -24 60 -20 62 -14",
  "M-52 -80 C-60 -64 -44 -54 -52 -40 C-56 -32 -60 -28 -58 -20",
  "M-106 -12 C-88 -18 -80 2 -92 20",
  "M74 50 C58 38 40 38 28 44",
  "M-50 50 C-64 57 -78 57 -90 50",
  "M-48 63 C-58 68 -70 68 -80 63",
];
/** folds only the grown copy has: they draw at its rim and between the old ones as it swells */
const EXTRA_FOLDS = [
  "M38 -78 C30 -64 44 -54 36 -40 C32 -32 30 -28 32 -22",
  "M-22 -86 C-30 -72 -16 -62 -24 -48 C-28 -40 -30 -36 -28 -30",
  "M-86 -58 C-74 -48 -86 -34 -74 -24",
  "M104 -30 C90 -26 90 -12 106 -6",
  "M-30 4 C-16 -6 4 2 -8 16",
  "M-72 22 C-58 12 -42 20 -48 32",
  "M50 -10 C40 -4 30 -12 22 -4",
  "M-106 8 C-98 2 -88 8 -84 -2",
];
export const BRAIN_SCALE = 0.58; // world px per brain unit in a head (~144 px across)
/** where a thread touches a brain (its front, under the brow), local units */
export const BRAIN_CONTACT: P = { x: 120, y: 8 };
/** the copy's anchor (the bottom of the brain, over the dots), local units */
export const BRAIN_ANCHOR: P = { x: 30, y: 58 };

// --- path sampling -------------------------------------------------------------------
type Poly = { pts: P[]; cum: number[]; len: number };
const parsePath = (d: string): P[][] => {
  const toks = d.match(/[MCZ]|-?\d*\.?\d+/g) ?? [];
  const subs: P[][] = [];
  let cur: P[] = [];
  let i = 0;
  let cmd = "";
  let start: P = { x: 0, y: 0 };
  while (i < toks.length) {
    const t = toks[i];
    if (t === "M" || t === "C" || t === "Z") {
      cmd = t;
      i++;
      if (t === "Z") {
        cur.push({ ...start });
      }
      continue;
    }
    if (cmd === "M") {
      if (cur.length) subs.push(cur);
      start = { x: +toks[i], y: +toks[i + 1] };
      cur = [start];
      i += 2;
    } else if (cmd === "C") {
      const p0 = cur[cur.length - 1];
      const c1 = { x: +toks[i], y: +toks[i + 1] };
      const c2 = { x: +toks[i + 2], y: +toks[i + 3] };
      const p3 = { x: +toks[i + 4], y: +toks[i + 5] };
      for (let s = 1; s <= 24; s++) {
        const t2 = s / 24;
        const u = 1 - t2;
        cur.push({
          x: u * u * u * p0.x + 3 * u * u * t2 * c1.x + 3 * u * t2 * t2 * c2.x + t2 * t2 * t2 * p3.x,
          y: u * u * u * p0.y + 3 * u * u * t2 * c1.y + 3 * u * t2 * t2 * c2.y + t2 * t2 * t2 * p3.y,
        });
      }
      i += 6;
    } else {
      i++;
    }
  }
  if (cur.length) subs.push(cur);
  return subs;
};
export const makePoly = (pts: P[]): Poly => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
};
export const polyAt = (p: Poly, d: number): P => {
  const dd = Math.max(0, Math.min(p.len, d));
  let i = 1;
  while (i < p.pts.length - 1 && p.cum[i] < dd) i++;
  const w = (dd - p.cum[i - 1]) / Math.max(1e-6, p.cum[i] - p.cum[i - 1]);
  return { x: p.pts[i - 1].x + (p.pts[i].x - p.pts[i - 1].x) * w, y: p.pts[i - 1].y + (p.pts[i].y - p.pts[i - 1].y) * w };
};
/** the piece of a polyline between arc lengths a and b */
export const polySlice = (p: Poly, a: number, b: number): P[] => {
  const s0 = Math.max(0, a);
  const s1 = Math.min(p.len, b);
  if (s1 <= s0) return [];
  const out: P[] = [polyAt(p, s0)];
  for (let i = 0; i < p.pts.length; i++) if (p.cum[i] > s0 && p.cum[i] < s1) out.push(p.pts[i]);
  out.push(polyAt(p, s1));
  return out;
};

const OUTLINE_POLY = makePoly(parsePath(BRAIN_D)[0]);
const BACK_POLY = makePoly(parsePath(BRAIN_BACK)[0]);
const FOLD_POLYS = BRAIN_FOLDS.map((d) => makePoly(parsePath(d)[0]));
const EXTRA_POLYS = EXTRA_FOLDS.map((d) => makePoly(parsePath(d)[0]));
/** every stroke a pulse can run along: the outline, the cerebellum, the folds */
const PULSE_PATHS = [OUTLINE_POLY, BACK_POLY, ...FOLD_POLYS];

// --- pulses ---------------------------------------------------------------------------
/** A brain's traffic. Pulses are discrete events: on stroke i, event n leaves the stroke's start at
 *  t = n * period + phase and runs its length at `speed` (local units / frame); it exists only if a hash is
 *  under the density at its emission time, so a change of density never pops a pulse mid-stroke. */
export type Traffic = {
  seed: number;
  period: (f: number) => number; // frames between events on one stroke (integrated into the emission clock)
  density: (f: number) => number; // 0..1 (read at emission)
  speed: number;
  len: number; // the pulse's length, local units
};
// the emission clock: events per stroke counted by integrating 1 / period frame by frame, so a change of period
// changes the rate of new pulses and never moves one already on its way
const CLOCK_F0 = -200;
const CLOCK_F1 = 260;
const clocks = new WeakMap<Traffic, number[]>();
const clockOf = (tr: Traffic) => {
  let c = clocks.get(tr);
  if (!c) {
    c = [0];
    for (let f = CLOCK_F0 + 1; f <= CLOCK_F1; f++) c.push(c[c.length - 1] + 1 / tr.period(f));
    clocks.set(tr, c);
  }
  return c;
};
const clockAt = (c: number[], f: number) => {
  const x = Math.max(0, Math.min(c.length - 1.001, f - CLOCK_F0));
  const i = Math.floor(x);
  return c[i] + (c[i + 1] - c[i]) * (x - i);
};
/** the frame the clock reads v (monotone) */
const clockInv = (c: number[], v: number) => {
  let lo = 0;
  let hi = c.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c[m] < v) lo = m;
    else hi = m;
  }
  const w = (v - c[lo]) / Math.max(1e-9, c[hi] - c[lo]);
  return CLOCK_F0 + lo + w;
};
const pulsesOn = (paths: Poly[], tr: Traffic, frame: number, from = -1e9) => {
  const out: { seg: P[]; flare: P[] }[] = [];
  const c = clockOf(tr);
  const now = clockAt(c, frame);
  paths.forEach((p, i) => {
    const life = (p.len + tr.len) / tr.speed;
    const ph = hash(i * 13 + tr.seed * 101, 3);
    const early = clockAt(c, frame - life - 2);
    for (let n = Math.floor(early - ph) - 1; n <= Math.floor(now - ph) + 1; n++) {
      const t0 = clockInv(c, n + ph + (hash(n * 7 + i * 31, tr.seed + 5) - 0.5) * 0.6);
      if (t0 < from) continue;
      const age = frame - t0;
      if (age < 0 || age > life) continue;
      if (hash(n * 17 + i * 53 + tr.seed * 7, 11) > tr.density(t0)) continue;
      // every other pulse runs the stroke backwards: traffic both ways
      const back = hash(n * 3 + i * 5, tr.seed + 21) < 0.5;
      const head = age * tr.speed;
      const a = back ? p.len - head : head - tr.len;
      const seg = polySlice(p, a, a + tr.len);
      // the stretch of stroke the pulse is on flares with it
      const flare = polySlice(p, a - tr.len * FLARE_EXT, a + tr.len * (1 + FLARE_EXT));
      if (seg.length > 1) out.push({ seg, flare });
    }
  });
  return out;
};

export const FLARE_EXT = 1.1; // a pulse's flare runs this many pulse lengths beyond it on each side
export const BRAIN_SW = 5.2; // the outline, world px at k 1 (a head)
export const FOLD_SW = 4.4;
export const PULSE_SW = 7.5;

/**
 * One brain, drawn at the origin of its own local frame (units). `unit` = world px per local unit (the strokes
 * keep their world width whatever the scale). White in a head, orange as the copy.
 *  - `scanR`: the scan front's radius from BRAIN_CONTACT (local units): folds inside a band behind it brighten.
 *  - `reveal`: the copy is drawn only inside this radius from BRAIN_CONTACT (the front, cause and effect).
 *  - `extra`: 0..1, the copy's new folds drawing in, one after another.
 */
export const Brain: React.FC<{
  id: string;
  frame: number;
  unit: number;
  kind: "white" | "orange";
  traffic: Traffic;
  trafficFrom?: number;
  scanR?: number;
  reveal?: number;
  extra?: number;
  extraFrom?: number; // pulses on the new folds leave from this frame on
  /** the orange scan line's radius from BRAIN_CONTACT (local units), drawn inside the brain's window */
  scanLine?: number;
}> = ({ id, frame, unit, kind, traffic, trafficFrom, scanR, reveal, extra = 0, extraFrom, scanLine }) => {
  const sw = BRAIN_SW / unit;
  const fw = FOLD_SW / unit;
  const pw = PULSE_SW / unit;
  const pad = 9 / unit; // the window's margin round the brain
  const ink = kind === "white" ? INK : ACCENT;
  const foldOp = kind === "white" ? 0.36 : 1;
  const pulseC = kind === "white" ? INK : HIGHLIGHT;
  const pulses = pulsesOn(PULSE_PATHS, traffic, frame, trafficFrom);
  const extraN = EXTRA_POLYS.length;
  const extraDrawn = EXTRA_POLYS.map((p, i) => {
    const u = clamp01(extra * (extraN * 0.55 + 1) - i * 0.55);
    return { p, u: smoothstep(u) };
  });
  const extraPulses = extraFrom !== undefined ? pulsesOn(EXTRA_POLYS, traffic, frame, extraFrom) : [];
  const window = (
    <g fill={BOARD} stroke={BOARD} strokeWidth={pad * 2} strokeLinejoin="round">
      <path d={BRAIN_D} />
      <path d={`${BRAIN_BACK} Z`} />
    </g>
  );
  const body = (
    <>
      {window}
      <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
        <path d={BRAIN_BACK} strokeWidth={sw} />
        <path d={BRAIN_D} strokeWidth={sw} />
        <g strokeWidth={fw} opacity={foldOp}>
          {BRAIN_FOLDS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {extraDrawn.map(({ p, u }, i) =>
          u > 0 ? <path key={`e${i}`} d={linePath(polySlice(p, 0, p.len * u))} strokeWidth={fw} /> : null,
        )}
      </g>
      {scanR !== undefined && scanR > 0 ? (
        <g mask={`url(#${id}-band)`} fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
          <path d={BRAIN_BACK} strokeWidth={sw * 1.35} />
          <path d={BRAIN_D} strokeWidth={sw * 1.35} />
          <g strokeWidth={fw * 1.9}>
            {BRAIN_FOLDS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </g>
      ) : null}
      {kind === "white" ? (
        <g fill="none" stroke={INK} strokeWidth={fw * 1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}>
          {pulses.map((q, i) => (
            <path key={i} d={linePath(q.flare)} />
          ))}
        </g>
      ) : null}
      <g fill="none" stroke={pulseC} strokeWidth={pw} strokeLinecap="round" strokeLinejoin="round">
        {[...pulses, ...extraPulses].map((q, i) => (
          <path key={i} d={linePath(q.seg)} />
        ))}
      </g>
      {scanLine !== undefined && scanLine > 0 ? (
        <g mask={`url(#${id}-win)`}>
          <circle
            cx={BRAIN_CONTACT.x}
            cy={BRAIN_CONTACT.y}
            r={scanLine}
            fill="none"
            stroke={ACCENT}
            strokeWidth={SCAN_LINE_W / unit}
          />
        </g>
      ) : null}
    </>
  );
  const C = BRAIN_CONTACT;
  return (
    <g>
      <defs>
        {scanR !== undefined && scanR > 0 ? (
          <mask id={`${id}-band`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
            <circle cx={C.x} cy={C.y} r={Math.max(0.1, scanR - SCAN_BAND / 2)} fill="none" stroke="white" strokeWidth={SCAN_BAND} />
          </mask>
        ) : null}
        {scanLine !== undefined && scanLine > 0 ? (
          <mask id={`${id}-win`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
            <g fill="white" stroke="white" strokeWidth={pad * 2 - 2 / unit} strokeLinejoin="round">
              <path d={BRAIN_D} />
              <path d={`${BRAIN_BACK} Z`} />
            </g>
          </mask>
        ) : null}
        {reveal !== undefined ? (
          <clipPath id={`${id}-rv`} clipPathUnits="userSpaceOnUse">
            <circle cx={C.x} cy={C.y} r={Math.max(0, reveal)} />
          </clipPath>
        ) : null}
      </defs>
      {reveal !== undefined ? reveal > 0 ? <g clipPath={`url(#${id}-rv)`}>{body}</g> : null : body}
    </g>
  );
};
export const SCAN_LINE_W = 4.5; // world px: the orange scan line
export const SCAN_BAND = 46; // local units: the band of folds that brightens behind the front
/** the farthest brain point from the contact (local units): the front is done here */
export const SCAN_R_MAX = (() => {
  let m = 0;
  [OUTLINE_POLY, BACK_POLY].forEach((p) => p.pts.forEach((q) => (m = Math.max(m, Math.hypot(q.x - BRAIN_CONTACT.x, q.y - BRAIN_CONTACT.y)))));
  return m + 8;
})();

// --- the busts (local: origin = the truncation's centre, facing right, y down) --------
/** where a bust's brain sits in its head (local) */
export const BRAIN_IN_HEAD: P = { x: -14, y: -205 };

const HEAD_NAP =
  "M-50 -100 C-75 -120 -97 -150 -97 -205 C-97 -258 -55 -297 -5 -297 C45 -297 82 -268 86 -232 " +
  "C88 -222 86 -214 90 -208 C98 -198 110 -188 114 -182 C116 -178 106 -175 96 -175 " +
  "C100 -170 101 -166 97 -163 C101 -160 101 -154 96 -151 C100 -145 102 -132 92 -124 " +
  "C80 -116 50 -118 30 -114 C26 -108 26 -100 28 -92 L-50 -92 Z";
const HEAD_ROCK =
  "M-50 -100 C-75 -122 -97 -152 -97 -207 C-97 -260 -55 -298 -5 -298 C45 -298 80 -270 85 -236 " +
  "C87 -224 85 -216 89 -210 C97 -200 107 -191 109 -185 C110 -180 103 -177 95 -177 " +
  "C99 -172 99 -168 96 -165 C99 -162 99 -157 95 -154 C98 -148 98 -136 90 -129 " +
  "C78 -121 50 -120 30 -116 C26 -110 26 -102 28 -94 L-50 -94 Z";
// the truncated chest with the collar standing up the neck
const CHEST_NAP =
  "M-104 -16 C-50 6 50 6 98 -16 C110 -42 106 -70 90 -86 C78 -98 60 -104 46 -108 L44 -126 " +
  "C10 -134 -30 -142 -60 -146 C-66 -128 -74 -110 -80 -102 C-98 -96 -110 -80 -113 -56 C-115 -40 -111 -28 -104 -16 Z";
const CHEST_ROCK =
  "M-104 -16 C-50 6 50 6 98 -16 C110 -42 106 -70 90 -86 C80 -96 66 -101 54 -104 L50 -122 " +
  "C20 -126 -20 -132 -54 -136 C-62 -120 -72 -106 -80 -102 C-98 -96 -110 -80 -113 -56 C-115 -40 -111 -28 -104 -16 Z";
// Napoleon's bicorne: a broad crescent riding across the head, points fore and aft
const BICORNE = "M-156 -252 C-150 -384 126 -392 138 -252 C92 -266 40 -272 -10 -272 C-60 -272 -112 -266 -156 -252 Z";
const BICORNE_TRIM = "M-136 -262 C-130 -362 108 -370 118 -262";
const EPAULETTE = "M-114 -78 C-110 -104 -66 -116 -46 -106 C-46 -96 -62 -90 -82 -86 C-96 -84 -106 -76 -114 -78 Z";
const EPAULETTE_FRINGE = [-108, -98, -88, -78].map((x, i) => `M${x} ${-80 - i * 1.5} L${x - 2} ${-58 - i}`);
// Rockefeller's top hat: crown (a little flared) and a brim curled up at both ends
const TOPHAT_CROWN = "M-66 -282 L-74 -424 C-36 -432 52 -432 90 -424 L80 -282 Z";
const TOPHAT_BRIM = "M-114 -270 C-104 -290 -84 -288 -70 -284 L84 -284 C98 -288 112 -292 122 -272 C88 -264 -78 -262 -114 -270 Z";
const TOPHAT_BAND = "M-68 -306 L82 -306";
// Rockefeller's dark bow cravat at the throat, and the frock coat's lapel
const CRAVAT = "M52 -110 L66 -120 L67 -98 Z M52 -110 L40 -121 L39 -99 Z";

const Interior: React.FC<{ d: string | string[] }> = ({ d }) => (
  <g fill="none" stroke={BOARD} strokeWidth={INTERIOR_W} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((q, i) => (
      <path key={i} d={q} />
    ))}
  </g>
);

/** The socle (the small foot under the truncation) and the plinth with the name cut into its face. World px. */
const Plinth: React.FC<{ x: number; name: string }> = ({ x, name }) => {
  const P0 = PLINTH;
  const shaftTop = P0.capTop + P0.capH + P0.gap;
  const baseTop = FLOOR - P0.baseH;
  const shaftBot = baseTop - P0.gap;
  return (
    <g>
      {/* socle */}
      <path
        d={`M${f2(x - 44)} ${SOCLE_Y + 4} L${f2(x + 44)} ${SOCLE_Y + 4} L${f2(x + 62)} ${P0.capTop} L${f2(x - 62)} ${P0.capTop} Z`}
        fill={INK}
      />
      <rect x={x - P0.capW / 2} y={P0.capTop} width={P0.capW} height={P0.capH} fill={INK} />
      <rect x={x - P0.w / 2} y={shaftTop} width={P0.w} height={shaftBot - shaftTop} fill={INK} />
      <rect x={x - P0.baseW / 2} y={baseTop} width={P0.baseW} height={P0.baseH} fill={INK} />
      <text
        x={x}
        y={NAME_Y}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FONT_LABEL}
        fontWeight={700}
        fontSize={NAME_SIZE}
        letterSpacing="0.04em"
        fill={BOARD}
      >
        {name}
      </text>
    </g>
  );
};

/** A bust and its plinth. The brain goes in by `children`, drawn in the head's local frame at BRAIN_IN_HEAD. */
export const Bust: React.FC<{ k: number; who: "napoleon" | "rockefeller"; children?: React.ReactNode }> = ({ k, who, children }) => {
  const nap = who === "napoleon";
  const x = nap ? NAP_X : ROCK_X;
  return (
    <g style={{ filter: iconShadow(k) }}>
      <Plinth x={x} name={nap ? "NAPOLEON" : "ROCKEFELLER"} />
      <g transform={`translate(${x} ${SOCLE_Y})`}>
        <path d={nap ? HEAD_NAP : HEAD_ROCK} fill={INK} />
        {children}
        <path d={nap ? CHEST_NAP : CHEST_ROCK} fill={INK} />
        {nap ? (
          <>
            <Interior d={["M46 -108 C10 -114 -40 -116 -82 -104", "M46 -108 C52 -80 58 -50 64 -18"]} />
            <path d={EPAULETTE} fill={INK} stroke={BOARD} strokeWidth={INTERIOR_W} strokeLinejoin="round" />
            <Interior d={EPAULETTE_FRINGE} />
            <path d={BICORNE} fill={INK} />
            <Interior d={BICORNE_TRIM} />
          </>
        ) : (
          <>
            <Interior d={["M54 -104 C20 -108 -30 -112 -80 -103", "M56 -100 C60 -76 54 -48 44 -18", "M76 -94 C68 -70 62 -48 56 -30"]} />
            <path d={CRAVAT} fill={BOARD} stroke={BOARD} strokeWidth={2} strokeLinejoin="round" />
            <path d={TOPHAT_CROWN} fill={INK} />
            <path d={TOPHAT_BRIM} fill={INK} />
            <Interior d={TOPHAT_BAND} />
            <Interior d="M-66 -282 L80 -282" />
          </>
        )}
      </g>
    </g>
  );
};
/** a bust's brain centre, world */
export const brainCentre = (who: "napoleon" | "rockefeller"): P => ({
  x: (who === "napoleon" ? NAP_X : ROCK_X) + BRAIN_IN_HEAD.x,
  y: SOCLE_Y + BRAIN_IN_HEAD.y,
});
export const contactOf = (who: "napoleon" | "rockefeller"): P => {
  const c = brainCentre(who);
  return { x: c.x + BRAIN_CONTACT.x * BRAIN_SCALE, y: c.y + BRAIN_CONTACT.y * BRAIN_SCALE };
};

// --- the intern, facing left --------------------------------------------------------
export const INTERN_X = 884; // hip / ground centre
export const INTERN_S = 1.1; // drawn 1.1x (539 world px tall)
const POSE = figurePose({ x: INTERN_X, groundY: FLOOR, age: 1 });
/** mirror x about the intern's hip, then scale about its feet: figure coords -> world */
export const internToWorld = (q: P): P => ({
  x: INTERN_X - (q.x - INTERN_X) * INTERN_S,
  y: FLOOR + (q.y - FLOOR) * INTERN_S,
});
const MARK_W = POSE.mark.size * INTERN_S;
/** the head mark's box in world (never mirrored) */
export const HEAD_BOX = (() => {
  const c = internToWorld({ x: POSE.mark.x + POSE.mark.size / 2, y: POSE.mark.y + POSE.mark.size / 2 });
  return { x: c.x - MARK_W / 2, y: c.y - MARK_W / 2, size: MARK_W, cx: c.x, cy: c.y };
})();

export const InternLeft: React.FC<{ k: number; breathT: number }> = ({ k, breathT }) => {
  const g = figurePose({ x: INTERN_X, groundY: FLOOR, age: 1, breathT });
  const S = INTERN_S;
  // the mark follows the breath: its box from this frame's pose
  const c = internToWorld({ x: g.mark.x + g.mark.size / 2, y: g.mark.y + g.mark.size / 2 });
  const size = g.mark.size * S;
  const mx = c.x - size / 2;
  const my = c.y - size / 2;
  const u = size / 24;
  // eyes on the unmirrored mark: the figure looks left, so the front eye is the left one
  const eFront = { x: mx + (24 - EYE_UNITS.front.x) * u, y: my + EYE_UNITS.front.y * u };
  const eBack = { x: mx + (24 - EYE_UNITS.back.x) * u, y: my + EYE_UNITS.back.y * u };
  const near = ACCENT;
  return (
    <g>
      <defs>
        <mask id="ro-nohead" maskUnits="userSpaceOnUse" x={-5000} y={-5000} width={10000} height={10000}>
          <rect x={-5000} y={-5000} width={10000} height={10000} fill="white" />
          <path
            d={HEAD_OUTER}
            transform={`translate(${f2(g.mark.x)} ${f2(g.mark.y)}) scale(${(g.mark.size / 24).toFixed(5)})`}
            fill="black"
            stroke="black"
            strokeWidth={1.6}
          />
        </mask>
      </defs>
      <g
        transform={`translate(${INTERN_X} ${FLOOR}) scale(${-S} ${S}) translate(${-INTERN_X} ${-FLOOR})`}
        mask="url(#ro-nohead)"
      >
        <AiFigure id="ro-intern" k={k * S} x={INTERN_X} groundY={FLOOR} age={1} breathT={breathT} eyes={false} />
      </g>
      <g style={{ filter: iconShadow(k) }}>
        <g transform={`translate(${f2(mx)} ${f2(my)}) scale(${(size / 24).toFixed(5)})`}>
          <circle cx={FACE_UNITS.x} cy={FACE_UNITS.y} r={FACE_UNITS.r} fill={near} />
          {HEAD_MARK.paths.map((d, i) => (
            <path key={i} d={d} fill={near} fillRule="evenodd" />
          ))}
        </g>
        <path d={eyePath(eBack.x, eBack.y, EYE_UNITS.r * u, 0)} fill={EYE_TONE} />
        <path d={eyePath(eFront.x, eFront.y, EYE_UNITS.r * u, 0)} fill={EYE_TONE} />
      </g>
    </g>
  );
};
