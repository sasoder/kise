import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLUE,
  CaptionStripDebug,
  EASE_LAND,
  FPS as SET_FPS,
  INK,
  PAPER_BASE,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  TallPaper,
  WorldTall,
  camEase,
  clamp,
  runCamera2,
  sway,
  textRise,
  type,
} from "../kits/core-memory/deathCountShared";

// ---------------------------------------------------------------------------
// "ONE IN FOUR LONELY" — cut 1 of the CM_EARLY_JS trailer (Core Memory, Andrew
// Kiguel). 1080 x 1920, 24000/1001 fps, 93 frames, opaque, the core memory
// graphic standard (deathCountShared).
//
// CHECK LINE: "A quarter of the whole world is lonely: one person in every
// four stands apart with nobody linked to them."
//
// THE PICTURE: the world as a round crowd, a disc of 100 white people-dots
// (46 px, hard shadow) tied to their neighbours by short white links, turning
// slowly as one body. One in four (25, scattered evenly through the disc, one
// per cluster of four) lets go: its links retract into its neighbours, it
// turns BLUE and goes out to stand alone somewhere on the open paper. The 75
// that stay close ranks into a smaller, still-linked disc. Resolved: a linked
// white world in the middle and 25 separate blue dots SCATTERED over the whole
// frame around it (corners and the band under the disc included), each at its
// own distance, never two close together.
// Fact: Meta-Gallup "Global State of Social Connections" 2023, 142 countries,
// 24 % feel very or fairly lonely.
//
// THE WORDS (local frame; f0 = sequence 5.589 s):
//   you 1 · think 3 · about 6 · loneliness 11-33 · (pause) · something 36 ·
//   like 40 · 25 44 · percent 51 · of 59 · the 62 · world 64 ·
//   identifies 69 · as 76 · lonely 84 · END 93
//
// THE MOTION (one move; the words are its inflections):
//   f0       the full linked disc, 85 % of the frame width, on the true
//            middle, turning (0.126 deg per frame, all the way through). ONE
//            dot at the centre-top, two rows in, is already blue, its links
//            half let go, and it has begun to move. Nobody slides over
//            anybody: the crowd parts for each leaver and closes behind it
//   f0-32    that first dot slides out through the top of the crowd, alone,
//            and comes to rest above it                     — "loneliness"
//   f27-40   the others let go in a wave that rolls clockwise round the disc
//            from the top: each one's links retract into its neighbours while
//            blue fills it from its middle, then it goes out on
//            EASE_LAND (18 frames) to its own place. All have left the disc by
//            f45 and are settled by f58            — "something like 25"
//   f38-50   "1 IN 4" (the 1 blue) slides up above the crowd — done by "percent"
//   f44-66   the 75 close ranks (the same dots travel in; nothing dissolves): the disc draws in to 0.87 of its size and
//            new links grow across the closed gaps          — "of the world"
//   f66-92   settled and alive: the linked disc keeps turning together, each
//            blue dot bobs on its own clock and drifts very slowly further
//            out, the camera creeps back                    — "lonely" (84)
//
// THE CAMERA — keyed per frame, damped by runCamera2, pre-rolled so it is
// already moving on f0. ONE move, k only, about the disc's centre (540, 960 =
// the true middle of the frame): it eases back from 1.114 to 0.93 (most of it
// f2-50) and runs on as a slow creep to the last frame. The closed disc is
// 62 % of the frame width at the end; the blue dots are 15 % larger than the
// white ones. Damped k values: see the build report (cameraAt).
//
// The chain-colour echo is NOT used.
// ---------------------------------------------------------------------------

export const FPS = SET_FPS;
export const DURATION = 93;

export const schema = z.object({
  debugCaptions: z.boolean(),
  /** the label, in two inks: the "1" is blue (a lonely person) */
  labelOne: z.string(),
  labelRest: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  debugCaptions: false,
  labelOne: "1",
  labelRest: " IN 4",
});

// -- the crowd, world px -------------------------------------------------------
const CX = 540;
const CY = 960;
const N = 100;
const N_LEAVE = 25;
const PITCH = 74; // neighbour spacing in the packed disc
const R_A = 389; // the full disc (dot centres)
const SHRINK = Math.sqrt((N - N_LEAVE) / N); // 0.866: same density, 75 dots
const R_B = R_A * SHRINK;
const DOT_R = 23;
const LINK_W = 2 * STROKE; // the links, heavy enough to read as ties on a phone
const LINK_MAX = 1.45 * PITCH; // neighbours are linked, second neighbours are not
const OMEGA = 0.0022; // rad per frame, clockwise on screen
const BLUE_GROW = 3.5; // a lonely dot ends 15 % larger than a white one
const K_END = 0.93; // the camera's last k: the scatter is laid out on that frame

type Pt = { x: number; y: number };
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const sunflower = (n: number, radius: number): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const r = radius * Math.sqrt((i + 0.5) / n);
    return { x: r * Math.cos(i * GOLDEN), y: r * Math.sin(i * GOLDEN) };
  });

/** Pack points evenly into a disc: soft repulsion between near neighbours
 *  against a hard round wall. Deterministic. */
const relax = (start: Pt[], wall: number, iters: number): Pt[] => {
  const p = start.map((q) => ({ ...q }));
  const rest = 1.3 * PITCH;
  for (let it = 0; it < iters; it++) {
    const fx = new Array<number>(p.length).fill(0);
    const fy = new Array<number>(p.length).fill(0);
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const dx = p[j].x - p[i].x;
        const dy = p[j].y - p[i].y;
        const d = Math.hypot(dx, dy) || 1e-6;
        if (d < rest) {
          const f = ((rest - d) * 0.1) / d;
          fx[i] -= dx * f;
          fy[i] -= dy * f;
          fx[j] += dx * f;
          fy[j] += dy * f;
        }
      }
    }
    for (let i = 0; i < p.length; i++) {
      p[i].x += fx[i];
      p[i].y += fy[i];
      const r = Math.hypot(p[i].x, p[i].y);
      if (r > wall) {
        p[i].x *= wall / r;
        p[i].y *= wall / r;
      }
    }
  }
  return p;
};

/** One in four, scattered evenly: 25 clusters of about four dots (k-means),
 *  and the dot nearest each cluster's middle is the one that lets go. */
const pickLeavers = (p: Pt[]): number[] => {
  let c = sunflower(N_LEAVE, R_A * 0.92);
  let owner = p.map(() => 0);
  for (let it = 0; it < 40; it++) {
    owner = p.map((q) => {
      let best = 0;
      let bd = Infinity;
      c.forEach((m, k) => {
        const d = (q.x - m.x) ** 2 + (q.y - m.y) ** 2;
        if (d < bd) {
          bd = d;
          best = k;
        }
      });
      return best;
    });
    c = c.map((m, k) => {
      const mine = p.filter((_, i) => owner[i] === k);
      if (mine.length === 0) return m;
      return {
        x: mine.reduce((s, q) => s + q.x, 0) / mine.length,
        y: mine.reduce((s, q) => s + q.y, 0) / mine.length,
      };
    });
  }
  const out: number[] = [];
  c.forEach((m, k) => {
    let best = -1;
    let bd = Infinity;
    p.forEach((q, i) => {
      if (owner[i] !== k) return;
      const d = (q.x - m.x) ** 2 + (q.y - m.y) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) out.push(best);
  });
  return out;
};

// -- the layout, built once ----------------------------------------------------
const build = () => {
  const raw = relax(sunflower(N, R_A), R_A, 1500);
  const leaversRaw = pickLeavers(raw);
  // the first one: the leaver nearest two rows in from the rim; the whole disc
  // is turned so that it sits at the centre-top on f0
  let first = leaversRaw[0];
  let fd = Infinity;
  leaversRaw.forEach((i) => {
    const d = Math.abs(Math.hypot(raw[i].x, raw[i].y) - (R_A - 1.75 * PITCH));
    if (d < fd) {
      fd = d;
      first = i;
    }
  });
  const turn = -Math.PI / 2 - Math.atan2(raw[first].y, raw[first].x);
  const A = raw.map((q) => ({
    x: q.x * Math.cos(turn) - q.y * Math.sin(turn),
    y: q.x * Math.sin(turn) + q.y * Math.cos(turn),
  }));
  const isLeaver = A.map((_, i) => leaversRaw.includes(i));
  const stay = A.map((_, i) => i).filter((i) => !isLeaver[i]);
  // the closed ranks: the 75, drawn in and packed again
  const packed = relax(
    stay.map((i) => ({ x: A[i].x * SHRINK, y: A[i].y * SHRINK })),
    R_B,
    1500,
  );
  const B: (Pt | null)[] = A.map(() => null);
  stay.forEach((i, n) => {
    B[i] = packed[n];
  });
  const near = (p: Pt | null, q: Pt | null) => !!p && !!q && Math.hypot(p.x - q.x, p.y - q.y) < LINK_MAX;
  type Link = { i: number; j: number; kind: "both" | "old" | "new" | "leaver" };
  const links: Link[] = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const a = near(A[i], A[j]);
      if (isLeaver[i] || isLeaver[j]) {
        if (a) links.push({ i, j, kind: "leaver" });
        continue;
      }
      const b = near(B[i], B[j]);
      if (a && b) links.push({ i, j, kind: "both" });
      else if (a) links.push({ i, j, kind: "old" });
      else if (b) links.push({ i, j, kind: "new" });
    }
  }
  // nobody who stays is ever left unlinked while the gaps are open: a staying
  // dot whose near neighbours all leave keeps a tie to the nearest one who stays
  stay.forEach((i) => {
    if (links.some((l) => l.kind !== "leaver" && l.kind !== "new" && (l.i === i || l.j === i))) return;
    let best = -1;
    let bd = Infinity;
    stay.forEach((j) => {
      const d = Math.hypot(A[i].x - A[j].x, A[i].y - A[j].y);
      if (j !== i && d < bd) {
        bd = d;
        best = j;
      }
    });
    const at = links.findIndex((l) => (l.i === i && l.j === best) || (l.i === best && l.j === i));
    if (at >= 0) links[at].kind = "both";
    else links.push({ i: Math.min(i, best), j: Math.max(i, best), kind: "both" });
  });
  return { A, B, isLeaver, leavers: leaversRaw, first, links };
};
const WORLD = build();

// -- timing ----------------------------------------------------------------------
export const T = {
  first: { start: -4, travel: 36, let: [-9, 8] as const },
  wave: { start: 27, span: 13, travel: 18, letLead: 5, letTail: 1 },
  close: [44, 66] as const,
  label: 38,
} as const;

type Leaver = {
  i: number;
  start: number;
  travel: number;
  let0: number;
  let1: number;
  first: boolean;
  /** where it ends up standing, world px */
  slot: Pt;
};
const TAU = Math.PI * 2;
const mod = (v: number, m: number) => ((v % m) + m) % m;
const phaseOf = (x: number, y: number) => mod(Math.atan2(y, x) + Math.PI / 2, TAU) / TAU;

// -- where the lonely stand -------------------------------------------------------
// Laid out in SCREEN px on the last frame (k = K_END), then taken to the world:
// anywhere in the frame outside the disc, never two close together, none at
// the frame edge, on the label, or with its centre in the caption strip.
const SLOT_MIN = 150; // screen px between any two
const SLOT_EDGE = 125; // screen px from the frame edge (>= 90 after the slow drift)
const slotOk = (p: Pt) => {
  if (p.x < SLOT_EDGE || p.x > 1080 - SLOT_EDGE || p.y < SLOT_EDGE || p.y > 1920 - SLOT_EDGE) return false;
  if (Math.hypot(p.x - CX, p.y - CY) < (R_B + DOT_R) * K_END + 80) return false;
  if (p.x > 215 && p.x < 865 && p.y < 365) return false; // the label
  if (p.y > 1060 && p.y < 1270) return false; // the caption strip
  return true;
};
const SLOTS_SCREEN: Pt[] = (() => {
  const out: Pt[] = [{ x: 545, y: 440 }]; // the first one: straight up, under the label
  for (let t = 0; t < 20000 && out.length < N_LEAVE; t++) {
    const p = {
      x: SLOT_EDGE + (1080 - 2 * SLOT_EDGE) * hash(t, 21),
      y: SLOT_EDGE + (1920 - 2 * SLOT_EDGE) * hash(t, 22),
    };
    if (!slotOk(p)) continue;
    if (out.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < SLOT_MIN)) continue;
    out.push(p);
  }
  return out;
})();
const toWorld = (p: Pt): Pt => ({ x: CX + (p.x - CX) / K_END, y: CY + (p.y - CY) / K_END });

const LEAVERS: Leaver[] = (() => {
  const base = WORLD.leavers.map((i) => {
    const isFirst = i === WORLD.first;
    // the wave rolls clockwise from the top
    const phase = isFirst ? 0 : phaseOf(WORLD.A[i].x, WORLD.A[i].y);
    const start = isFirst ? T.first.start : T.wave.start + T.wave.span * phase;
    return { i, isFirst, phase, start };
  });
  if (SLOTS_SCREEN.length < base.length) throw new Error("OneInFourLonely: not enough places for the lonely");
  // each goes to a place on its own side of the disc: both lists in the order
  // they stand round the centre, the first one keeping the place straight above
  const sorted = [...base].sort((p, q) => (p.isFirst ? -1 : q.isFirst ? 1 : p.phase - q.phase));
  const rest = SLOTS_SCREEN.slice(1, base.length).sort(
    (p, q) => phaseOf(p.x - CX, p.y - CY) - phaseOf(q.x - CX, q.y - CY),
  );
  const slots = [SLOTS_SCREEN[0], ...rest];
  return sorted.map((b, j) => ({
    i: b.i,
    first: b.isFirst,
    start: b.start,
    travel: b.isFirst ? T.first.travel : T.wave.travel,
    let0: b.isFirst ? T.first.let[0] : b.start - T.wave.letLead,
    let1: b.isFirst ? T.first.let[1] : b.start + T.wave.letTail,
    slot: toWorld(slots[j]),
  }));
})();
const LEAVER_OF = new Map<number, Leaver>(LEAVERS.map((l) => [l.i, l]));

const IN_OUT = Easing.inOut(Easing.cubic);
const rot = (p: Pt, f: number): Pt => {
  const c = Math.cos(OMEGA * f);
  const s = Math.sin(OMEGA * f);
  return { x: CX + p.x * c - p.y * s, y: CY + p.x * s + p.y * c };
};
/** how far the ranks have closed, 0..1 */
const closed = (f: number) =>
  interpolate(f, [T.close[0], T.close[1]], [0, 1], { easing: Easing.inOut(Easing.sin), ...clamp });
/** how far a leaver has gone, 0 (in the crowd) .. 1 (on the ring) */
const gone = (l: Leaver, f: number) =>
  l.first
    ? camEase((f - l.start) / l.travel, 1)
    : interpolate(f, [l.start, l.start + l.travel], [0, 1], { easing: EASE_LAND, ...clamp });
/** how far it has let go of its links (and, for the wave, filled with blue) */
const letGo = (l: Leaver, f: number) => interpolate(f, [l.let0, l.let1], [0, 1], { easing: IN_OUT, ...clamp });

const DRIFT_F0 = 52; // the drift is under way before the last one settles
const leaverPos = (l: Leaver, f: number, shift: Pt): Pt => {
  const a = WORLD.A[l.i];
  const home = rot({ x: a.x + shift.x, y: a.y + shift.y }, f);
  const e = gone(l, f);
  if (e <= 0) return home;
  // where it stands it keeps drifting, slowly, on its own heading (outward,
  // up to 60 deg to either side: 10-18 px over the hold) and bobs on its own clock
  const since = Math.max(0, f - DRIFT_F0);
  const head = Math.atan2(l.slot.y - CY, l.slot.x - CX) + (hash(l.i, 11) - 0.5) * (TAU / 3);
  const speed = 0.38 + 0.3 * hash(l.i, 12);
  const bx = 7 * Math.sin(f / (6 + 3 * hash(l.i, 7)) + TAU * hash(l.i, 8));
  const by = 7 * Math.cos(f / (7 + 3 * hash(l.i, 9)) + TAU * hash(l.i, 10));
  const slot = {
    x: l.slot.x + Math.cos(head) * speed * since + bx,
    y: l.slot.y + Math.sin(head) * speed * since + by,
  };
  return { x: home.x + (slot.x - home.x) * e, y: home.y + (slot.y - home.y) * e };
};

// -- the crowd parts ---------------------------------------------------------------
// Nobody slides over anybody: the crowd gives way to a leaver on its way out
// and closes behind it. Worked out once, frame by frame, in the disc's own
// (unturned) frame: each dot carries a shift off its place that springs back;
// every frame the dots are moved clear of each moving blue dot (where it is
// now, and a little for where it will be in one and two frames, so they start
// to part before it arrives) and clear of one another.
const SIM_F0 = -14;
const PART_GAP = 6; // paper between a passing blue dot and a white one
const PART_AHEAD = [1, 0.6, 0.3] as const;
const SPRING_BACK = 0.78;
const SHIFTS: Pt[][] = (() => {
  const frames: Pt[][] = [];
  let d: Pt[] = WORLD.A.map(() => ({ x: 0, y: 0 }));
  for (let f = SIM_F0; f < DURATION; f++) {
    const c = closed(f);
    const rest = WORLD.A.map((a, i) => {
      const b = WORLD.B[i];
      return b ? { x: a.x + (b.x - a.x) * c, y: a.y + (b.y - a.y) * c } : a;
    });
    const inCrowd = WORLD.A.map((_, i) => {
      const l = LEAVER_OF.get(i);
      return !l || gone(l, f) <= 0;
    });
    // the blue dots on the move, in the disc's frame
    const blues: { x: number; y: number; need: number; w: number }[] = [];
    LEAVERS.forEach((l) => {
      PART_AHEAD.forEach((w, look) => {
        const e = gone(l, f + look);
        if (e <= 0) return;
        const p = leaverPos(l, f + look, d[l.i]);
        const t = -OMEGA * (f + look);
        const x = (p.x - CX) * Math.cos(t) - (p.y - CY) * Math.sin(t);
        const y = (p.x - CX) * Math.sin(t) + (p.y - CY) * Math.cos(t);
        if (Math.hypot(x, y) > R_A + 4 * DOT_R) return;
        blues.push({ x, y, need: 2 * DOT_R + BLUE_GROW * e + PART_GAP, w });
      });
    });
    d = d.map((q) => ({ x: q.x * SPRING_BACK, y: q.y * SPRING_BACK }));
    for (let it = 0; it < 8; it++) {
      const p = rest.map((r, i) => ({ x: r.x + d[i].x, y: r.y + d[i].y }));
      const mx = p.map(() => 0);
      const my = p.map(() => 0);
      for (let i = 0; i < N; i++) {
        if (!inCrowd[i]) continue;
        blues.forEach((b) => {
          const dx = p[i].x - b.x;
          const dy = p[i].y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist >= b.need) return;
          const ux = dist > 1e-3 ? dx / dist : 1;
          const uy = dist > 1e-3 ? dy / dist : 0;
          mx[i] += ux * (b.need - dist) * b.w;
          my[i] += uy * (b.need - dist) * b.w;
        });
        for (let j = i + 1; j < N; j++) {
          if (!inCrowd[j]) continue;
          const dx = p[j].x - p[i].x;
          const dy = p[j].y - p[i].y;
          const dist = Math.hypot(dx, dy) || 1e-3;
          const need = 2 * DOT_R + 4;
          if (dist >= need) continue;
          const m = ((need - dist) * 0.5) / dist;
          mx[i] -= dx * m;
          my[i] -= dy * m;
          mx[j] += dx * m;
          my[j] += dy * m;
        }
      }
      d = d.map((q, i) => ({ x: q.x + mx[i] * 0.7, y: q.y + my[i] * 0.7 }));
    }
    frames.push(d);
  }
  return frames;
})();
/** every dot's shift (disc frame) at a local frame */
const laneShift = (f: number): Pt[] => SHIFTS[Math.max(0, Math.min(SHIFTS.length - 1, Math.round(f) - SIM_F0))];

/** a staying dot: its place in the full disc easing to its place in the closed
 *  one, moved aside by any open lane, turning with the disc */
const stayPos = (i: number, f: number, c: number, shift: Pt): Pt => {
  const a = WORLD.A[i];
  const b = WORLD.B[i] as Pt;
  return rot({ x: a.x + (b.x - a.x) * c + shift.x, y: a.y + (b.y - a.y) * c + shift.y }, f);
};

// -- the camera --------------------------------------------------------------------
const PRE = 30;
const LAG = 4.2;
export const CAM = {
  k0: (0.85 * 1080) / (2 * (R_A + DOT_R)), // the disc is 85 % of the width on f0
  kEnd: K_END,
  back: [2, 50] as const,
  creep: 0.3, // the share of the ease back that is a steady creep to the last frame
} as const;
const desiredK = (f: number) => {
  const main = camEase((f - CAM.back[0]) / (CAM.back[1] - CAM.back[0]), 0.8);
  const creep = f / (DURATION - 1);
  return CAM.k0 * Math.pow(CAM.kEnd / CAM.k0, (1 - CAM.creep) * main + CAM.creep * creep);
};
const CAM_F: number[] = [];
const CAM_K: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
for (let g = 0; g <= DURATION + PRE; g++) {
  CAM_F.push(g);
  CAM_K.push(desiredK(g - PRE + LAG));
  CAM_CX.push(CX);
  CAM_CY.push(CY);
}
/** the damped camera at a local frame (no sway) */
export const cameraAt = (frame: number) => runCamera2(frame + PRE, CAM_F, CAM_CY, CAM_CX, CAM_K);

// -- the label ---------------------------------------------------------------------
const LABEL_SIZE = 200;
const LABEL_BASE = 223; // world y of the baseline: screen y 275 on the last frame

const seg = (key: string, p: Pt, q: Pt, off: number, stroke: string) => (
  <line
    key={key}
    x1={(p.x + off).toFixed(2)}
    y1={(p.y + off).toFixed(2)}
    x2={(q.x + off).toFixed(2)}
    y2={(q.y + off).toFixed(2)}
    stroke={stroke}
    strokeWidth={LINK_W}
    strokeLinecap="butt"
  />
);
const lerp = (p: Pt, q: Pt, t: number): Pt => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });

const OneInFourLonely: React.FC<Props> = ({ debugCaptions, labelOne, labelRest }) => {
  const frame = useCurrentFrame();

  const cam = cameraAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;

  // -- where everyone is -------------------------------------------------------------
  const c = closed(frame);
  const shift = laneShift(frame);
  const pos: Pt[] = WORLD.A.map((_, i) => {
    const l = LEAVER_OF.get(i);
    return l ? leaverPos(l, frame, shift[i]) : stayPos(i, frame, c, shift[i]);
  });

  // -- the links, as segments ---------------------------------------------------------
  const segs: { key: string; p: Pt; q: Pt }[] = [];
  // The same 75 dots travel inward; the few ties that no longer reach are
  // drawn back first, and the new ties are drawn across the closed gaps once
  // the dots are nearly there (one line growing from one dot to the other).
  const oldV = 1 - interpolate(c, [0, 0.4], [0, 1], clamp);
  // the new ties are drawn one after another, clockwise from the top
  const newV = (i: number) =>
    interpolate(c, [0.5 + 0.38 * phaseOf(WORLD.A[i].x, WORLD.A[i].y), 0.62 + 0.38 * phaseOf(WORLD.A[i].x, WORLD.A[i].y)], [0, 1], clamp);
  WORLD.links.forEach(({ i, j, kind }) => {
    const key = `${i}-${j}`;
    if (kind === "both") {
      segs.push({ key, p: pos[i], q: pos[j] });
      return;
    }
    if (kind === "old" || kind === "new") {
      const v = kind === "old" ? oldV : newV(i);
      if (v <= 0) return;
      segs.push({ key, p: pos[i], q: v >= 1 ? pos[j] : lerp(pos[i], pos[j], v) });
      return;
    }
    // a leaver's link retracts INTO the neighbour it was tied to
    const li = LEAVER_OF.get(i);
    const lj = LEAVER_OF.get(j);
    const gi = li ? letGo(li, frame) : 0;
    const gj = lj ? letGo(lj, frame) : 0;
    const v = 1 - Math.max(gi, gj);
    if (v <= 0) return;
    // the anchor is the one that stays (or, of two leavers, the later one)
    const anchorIsI = li && lj ? li.start >= lj.start : !li;
    const anchor = anchorIsI ? pos[i] : pos[j];
    const other = anchorIsI ? pos[j] : pos[i];
    segs.push({ key, p: anchor, q: lerp(anchor, other, v) });
  });

  // -- the dots -----------------------------------------------------------------------
  const inCrowd: number[] = [];
  const apart: { l: Leaver; fill: number; r: number }[] = [];
  WORLD.A.forEach((_, i) => {
    const l = LEAVER_OF.get(i);
    if (!l) {
      inCrowd.push(i);
      return;
    }
    const fill = l.first ? 1 : letGo(l, frame);
    if (fill <= 0) inCrowd.push(i);
    else apart.push({ l, fill, r: DOT_R + BLUE_GROW * gone(l, frame) });
  });

  const rise = textRise(frame, T.label, k);
  const labelText = (one: string, others: string, off: number) => (
    <text
      x={CX + off}
      y={LABEL_BASE + rise.dy + off}
      textAnchor="middle"
      style={{ ...type(LABEL_SIZE, 900, 0.02), whiteSpace: "pre" }}
    >
      <tspan fill={one}>{labelOne}</tspan>
      <tspan fill={others}>{labelRest}</tspan>
    </text>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} />
      <WorldTall cx={cx} cy={cy} k={k} id="oifl-world">
        {/* the crowd: every hard shadow first, then the links, then the dots */}
        {segs.map((s) => seg(`s${s.key}`, s.p, s.q, SHADOW_OFF, SHADOW))}
        {inCrowd.map((i) => (
          <circle
            key={`ds${i}`}
            cx={(pos[i].x + SHADOW_OFF).toFixed(2)}
            cy={(pos[i].y + SHADOW_OFF).toFixed(2)}
            r={DOT_R}
            fill={SHADOW}
          />
        ))}
        {segs.map((s) => seg(`l${s.key}`, s.p, s.q, 0, INK))}
        {inCrowd.map((i) => (
          <circle key={`d${i}`} cx={pos[i].x.toFixed(2)} cy={pos[i].y.toFixed(2)} r={DOT_R} fill={INK} />
        ))}

        {/* the lonely: blue fills each from its middle as it lets go */}
        {apart.map(({ l, fill, r }) => {
          const p = pos[l.i];
          return (
            <g key={`b${l.i}`}>
              <circle cx={(p.x + SHADOW_OFF).toFixed(2)} cy={(p.y + SHADOW_OFF).toFixed(2)} r={r.toFixed(2)} fill={SHADOW} />
              {fill < 1 ? <circle cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={r.toFixed(2)} fill={INK} /> : null}
              <circle cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={(r * Math.min(1, fill)).toFixed(2)} fill={BLUE} />
            </g>
          );
        })}

        {/* the label: the 1 is one of the blue ones */}
        {rise.opacity > 0 ? (
          <g opacity={rise.opacity >= 1 ? undefined : rise.opacity}>
            {labelText(SHADOW, SHADOW, SHADOW_OFF)}
            {labelText(BLUE, INK, 0)}
          </g>
        ) : null}
      </WorldTall>
      <CaptionStripDebug on={debugCaptions} />
    </AbsoluteFill>
  );
};

export default OneInFourLonely;
