import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";

export const FPS = 24;
// Dwarkesh, "all of this happened while humans remained more or less in the
// dark about the scope of the conspiracy." SRT 13.000s -> 17.899s.
// round(4.899 * 24) = 118 frames, plus a 16 frame tail so the last pull-back
// settles before the hold. Trim the tail if a graphic lands on the next line.
export const DURATION = 134;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  humanSrc: z.string(),
  humanSize: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  lineWidth: z.number(),
  tipRadius: z.number(),
  inkContext: z.number(),
  inkMark: z.number(),
  liveOpacity: z.number(),
  readOpacity: z.number(),
  darkLevel: z.number(),
  revealLevel: z.number(),
  edgeDensity: z.number(),
  swellGain: z.number(),
  driftScale: z.number(),
  beats: z.object({
    arrive: z.number(), // "happened while" — the ring closes, the human fills in
    bracket: z.number(), // the box they looked through is drawn
    scanStart: z.number(), // the sweep that reads the ones inside it
    scanEnd: z.number(),
    more: z.number(), // "more" — first pull-back, and the dark starts falling
    dark: z.number(), // "the dark" — everything unlooked-at is gone
    scope: z.number(), // "scope of the" — the long pull, and the wave out
    conspiracy: z.number(), // "conspiracy" — the whole field draws into one body
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#48D9FF",
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  humanSrc: "person.png",
  humanSize: 100,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  // ONE stroke width for every line in the piece — the ring, the box, the
  // sweep, the tether. There is nothing else drawn with a stroke: the agents
  // and everything they do are filled shapes, so weight can never disagree
  // with itself. Two ink values: context 0.45, a mark a human made 0.85, and
  // the tip on the end of anything being drawn is full white.
  lineWidth: 4.5,
  tipRadius: 6.5,
  inkContext: 0.45,
  inkMark: 0.85,
  liveOpacity: 0.72,
  readOpacity: 0.95,
  darkLevel: 0.16,
  revealLevel: 0.8,
  edgeDensity: 0.5,
  swellGain: 1,
  driftScale: 1,
  beats: {
    arrive: 12,
    bracket: 30,
    scanStart: 38,
    scanEnd: 52,
    more: 48,
    dark: 70,
    scope: 84,
    conspiracy: 101,
  },
});

type P = { x: number; y: number };

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const WORLD_W = 1080;
const WORLD_H = 3400;
const BG_OVERSIZE = 1.8;
const TAU = Math.PI * 2;

const STEP = 88;
const DOT_R = 10;
const DOT_R_MAX = DOT_R * 1.25 * 1.42; // times the most an agent can ever swell
const BLOB = { cx: 540, cy: 1980, w: 2200, h: 2100 };
const FIELD_TOP = 960;
const I_MIN = Math.floor((BLOB.cx - BLOB.w / 2) / STEP) - 1;
const I_MAX = Math.ceil((BLOB.cx + BLOB.w / 2) / STEP) + 1;
const J_MIN = Math.floor((BLOB.cy - BLOB.h / 2) / STEP) - 1;
const J_MAX = Math.ceil((BLOB.cy + BLOB.h / 2) / STEP) + 1;

// The human floats above the crowd inside a ring, with no line ruled across the
// frame. The ring is the approved way of marking a subject in this language,
// and it leaves the human as a thing hanging out there rather than a figure
// standing on a horizon.
const RING = { x: 540, y: 790, r: 78 };
const BOX = { x0: 392, x1: 688, y0: 1042, y1: 1258 };
const BOX_C = { x: (BOX.x0 + BOX.x1) / 2, y: (BOX.y0 + BOX.y1) / 2 };

// ---------------------------------------------------------------------------
// The motion system
//
// Every agent drifts on its own slow ellipse, amplitude, period and phase all
// off the same hash, so the crowd reads as one substance rather than as a lot
// of separately animated dots.
// ---------------------------------------------------------------------------
const driftAmp = (s: number) => 7 + 9 * hash(s, 9);
const driftRate = (s: number) => 0.016 + 0.014 * hash(s, 10);
const driftOf = (s: number, frame: number, scale: number): P => {
  const a = driftAmp(s) * scale;
  const w = driftRate(s);
  const ph = hash(s, 11) * TAU;
  return {
    x: a * Math.sin(frame * w + ph),
    y: a * 0.68 * Math.cos(frame * w * 0.83 + ph * 1.7),
  };
};

const envelopeOf = (s: number) => {
  const a = driftAmp(s);
  return { x: DOT_R_MAX + a + 9, y: DOT_R_MAX + a * 0.68 + 9 };
};

const rawAgent = (i: number, j: number) => {
  const s = i * 73 + j * 31;
  return {
    s,
    x: i * STEP + (hash(s, 1) - 0.5) * STEP,
    y: j * STEP + (hash(s, 2) - 0.5) * STEP,
    rr: 0.75 + 0.5 * hash(s, 3),
  };
};

// The box is a statement about a specific set of agents, so no agent may sit
// half in it. Whichever side of the edge an agent's rest position falls on, it
// is settled far enough onto that side that its whole drift envelope — at its
// fattest swell — stays there.
const settle = <T extends { s: number; x: number; y: number }>(p: T): T => {
  const e = envelopeOf(p.s);
  const inside = p.x > BOX.x0 && p.x < BOX.x1 && p.y > BOX.y0 && p.y < BOX.y1;
  if (inside) {
    return {
      ...p,
      x: Math.min(Math.max(p.x, BOX.x0 + e.x), BOX.x1 - e.x),
      y: Math.min(Math.max(p.y, BOX.y0 + e.y), BOX.y1 - e.y),
    };
  }
  const ox = Math.min(p.x + e.x - BOX.x0, BOX.x1 - (p.x - e.x));
  const oy = Math.min(p.y + e.y - BOX.y0, BOX.y1 - (p.y - e.y));
  if (ox <= 0 || oy <= 0) return p;
  const nudge = 3 + 7 * hash(p.s, 12);
  if (ox < oy) {
    return { ...p, x: p.x < BOX_C.x ? BOX.x0 - e.x - nudge : BOX.x1 + e.x + nudge };
  }
  return { ...p, y: p.y < BOX_C.y ? BOX.y0 - e.y - nudge : BOX.y1 + e.y + nudge };
};

const inField = (p: { x: number; y: number; s: number }) => {
  if (p.y < FIELD_TOP) return false;
  const dx = (p.x - BLOB.cx) / (BLOB.w / 2);
  const dy = (p.y - BLOB.cy) / (BLOB.h / 2);
  return dx * dx + dy * dy <= 1 + (hash(p.s, 4) - 0.5) * 0.34;
};

const inBox = (p: P) => p.x > BOX.x0 && p.x < BOX.x1 && p.y > BOX.y0 && p.y < BOX.y1;

// ---------------------------------------------------------------------------
// Signals as liquid
//
// An agent is a droplet, not a ball, and a signal is not a dot sliding along a
// wire. A droplet pinches off its sender — a neck stretches and breaks — and
// merges into its receiver, which visibly takes on the volume and then relaxes.
// The sender dips as it lets go. On the last beat every pair grows a filament
// at once and the whole field draws into one connected body, which is what
// surface tension actually does and is a far better picture of a conspiracy
// than six hundred straight lines.
//
// Each edge runs on its own clock: flight, then rest.
// ---------------------------------------------------------------------------
const EDGE_RATE = 0.011;
const FLIGHT = 0.5; // of the cycle an edge spends carrying
const PINCH = 0.45; // how far into the flight the sender is still holding on
const MERGE = 0.55; // and where the receiver starts reaching for it
const DROP_R = 0.46; // droplet radius, as a fraction of its sender

const edgeCycle = (ownerS: number, kk: number, frame: number) =>
  (frame * EDGE_RATE + hash(ownerS, kk + 4)) % 1;

const edgeLive = (ownerS: number, kk: number, density: number) =>
  hash(ownerS, kk) <= density;

// What a receiver gains, and what a sender gives up, both read off the same
// clock as the droplet itself so they can never disagree with what is on screen.
const arrivalPulse = (ownerS: number, kk: number, frame: number, density: number) => {
  if (!edgeLive(ownerS, kk, density)) return 0;
  const c = edgeCycle(ownerS, kk, frame);
  const d = c - FLIGHT;
  return interpolate(d < 0 ? d + 1 : d, [0, 0.04, 0.22], [1, 1, 0], clamp);
};
const departPulse = (ownerS: number, kk: number, frame: number, density: number) => {
  if (!edgeLive(ownerS, kk, density)) return 0;
  return interpolate(edgeCycle(ownerS, kk, frame), [0, 0.06, 0.18], [1, 1, 0], clamp);
};

const fmt = (n: number) => n.toFixed(2);

// Counter-clockwise on screen, to match the winding of every bond below so a
// nonzero fill unions them instead of punching holes in them.
const circlePath = (c: P, r: number) =>
  `M${fmt(c.x - r)} ${fmt(c.y)}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(c.x + r)} ${fmt(c.y)}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(c.x - r)} ${fmt(c.y)}Z`;

// A bond leaves each surface tangentially and necks in toward the axis, the way
// a bridge of liquid does. `strength` is how much of each surface it grabs and
// how fat its waist is, so it can be grown and pinched off continuously.
// `half` stops it at the midline, so two agents at different opacities can each
// own their side of the same filament and the two halves abut exactly.
const bondPath = (a: P, ra: number, b: P, rb: number, strength: number, half: boolean) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-3 || strength <= 0.004) return "";
  const al = 0.34 + 0.54 * strength;
  const ca = Math.cos(al);
  const sa = Math.sin(al);
  // Everything is scaled off the clear span between the two surfaces, never off
  // the centre distance. Handles sized from the centres overshoot whenever the
  // two are close, and the curve folds back through its own circle — which is
  // what was cutting notches out of the agents.
  const reach = half ? d / 2 : d;
  const gap = reach - ra * ca - (half ? 0 : rb * ca);
  if (gap <= 2) return ""; // already merged: the filled circles union on their own
  const ax = dx / d;
  const ay = dy / d;
  const nx = -ay;
  const ny = ax;
  const w = Math.min((0.18 + 0.34 * strength) * Math.min(ra, rb), gap * 0.5);
  const h1 = 0.4 * gap;
  const h2 = 0.28 * gap;

  const pA1 = { x: a.x + ra * (ca * ax + sa * nx), y: a.y + ra * (ca * ay + sa * ny) };
  const pA2 = { x: a.x + ra * (ca * ax - sa * nx), y: a.y + ra * (ca * ay - sa * ny) };
  const tA1 = { x: sa * ax - ca * nx, y: sa * ay - ca * ny };
  const tA2 = { x: sa * ax + ca * nx, y: sa * ay + ca * ny };
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const m1 = { x: mx + w * nx, y: my + w * ny };
  const m2 = { x: mx - w * nx, y: my - w * ny };

  const c = (p: P, v: P, len: number) => `${fmt(p.x + v.x * len)} ${fmt(p.y + v.y * len)}`;
  const axv = { x: ax, y: ay };
  const negax = { x: -ax, y: -ay };

  let out = `M${fmt(pA1.x)} ${fmt(pA1.y)}C${c(pA1, tA1, h1)} ${c(m1, negax, h2)} ${fmt(m1.x)} ${fmt(m1.y)}`;
  if (half) {
    out += `L${fmt(m2.x)} ${fmt(m2.y)}`;
  } else {
    const pB1 = { x: b.x + rb * (-ca * ax + sa * nx), y: b.y + rb * (-ca * ay + sa * ny) };
    const pB2 = { x: b.x + rb * (-ca * ax - sa * nx), y: b.y + rb * (-ca * ay - sa * ny) };
    const tB1 = { x: -sa * ax - ca * nx, y: -sa * ay - ca * ny };
    const tB2 = { x: -sa * ax + ca * nx, y: -sa * ay + ca * ny };
    out += `C${c(m1, axv, h2)} ${c(pB1, tB1, h1)} ${fmt(pB1.x)} ${fmt(pB1.y)}`;
    out += `L${fmt(pB2.x)} ${fmt(pB2.y)}`;
    out += `C${c(pB2, tB2, h1)} ${c(m2, axv, h2)} ${fmt(m2.x)} ${fmt(m2.y)}`;
  }
  out += `C${c(m2, negax, h2)} ${c(pA2, tA2, h1)} ${fmt(pA2.x)} ${fmt(pA2.y)}Z`;
  return out;
};

// ---------------------------------------------------------------------------
// Camera
//
// A shot is an anchor (the world point that sits in the caption-safe band) and
// a zoom. One damped progress walks the shot list, zoom is interpolated in log
// space so a constant rate there is a constant rate on screen, and the centre
// is solved rather than authored — for any two framings there is exactly one
// world point that lands on the same pixel in both, so that point is held still
// and only the scale changes.
//
// The slow push that keeps the holds from freezing is applied AFTER that solve,
// as a pure zoom about the caption anchor. Folding it into the solve, which is
// what the previous cut did, made the two segments scale their own pivots
// differently and put a 7px jump in the frame the moment the segment index
// flipped, at 3.3 seconds.
// ---------------------------------------------------------------------------
type Shot = { anchor: number; k: number };
const SHOTS: Shot[] = [
  { anchor: 985, k: 2.0 }, // the group, the human, and the box they drew
  { anchor: 1150, k: 1.05 }, // and how much of it nobody looked at
  { anchor: 1871, k: 0.4 }, // all of it
];
const SHOT_CY = SHOTS.map((s) => s.anchor + 125 / s.k);

const PIVOTS = SHOTS.slice(0, -1).map((_, i) => {
  const ka = SHOTS[i].k;
  const kb = SHOTS[i + 1].k;
  const ca = SHOT_CY[i];
  const cb = SHOT_CY[i + 1];
  if (Math.abs(ka - kb) < 1e-6) return null;
  const w = (ca * ka - cb * kb) / (ka - kb);
  return { w, sy: (w - ca) * ka + 960 };
});

const CAM_F = [0, 46, 64, 84, 100, 112, DURATION];
const CAM_P = [0, 0, 1, 1, 1.45, 2, 2];
const CAM_CREEP = 0.00045;
const CAM_STIFF = 0.13;
const CAM_DAMP = 0.56;

const camera = (upto: number) => {
  let p = CAM_P[0];
  let v = 0;
  for (let f = 1; f <= upto; f++) {
    const tp = interpolate(f, CAM_F, CAM_P, clamp);
    v += (tp - p) * CAM_STIFF - v * CAM_DAMP;
    p += v;
  }
  const i = Math.max(0, Math.min(SHOTS.length - 2, Math.floor(p)));
  const t = Math.max(0, Math.min(1, p - i));
  const k0 = Math.exp(
    Math.log(SHOTS[i].k) + (Math.log(SHOTS[i + 1].k) - Math.log(SHOTS[i].k)) * t,
  );
  const pv = PIVOTS[i];
  const cy0 = pv ? pv.w - (pv.sy - 960) / k0 : SHOT_CY[i] + (SHOT_CY[i + 1] - SHOT_CY[i]) * t;
  const anchor = cy0 - 125 / k0; // the world point sitting at y 835
  const k = k0 * (1 + CAM_CREEP * upto);
  return { cy: anchor + 125 / k, k };
};

const DarkAboutTheScope: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  humanSrc,
  humanSize,
  shadowY,
  shadowBlur,
  shadowOpacity,
  lineWidth,
  tipRadius,
  inkContext,
  inkMark,
  liveOpacity,
  readOpacity,
  darkLevel,
  revealLevel,
  edgeDensity,
  swellGain,
  driftScale,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { cy, k } = camera(frame);
  const tx = 540 - 540 * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - SHOT_CY[0]) * k * parallax - frame * 0.25;
  const bgScale = 1 + (k - 1) * 0.3;

  const scanY = interpolate(frame, [beats.scanStart, beats.scanEnd], [BOX.y0 - 24, BOX.y1 + 24], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const scanFade = interpolate(
    frame,
    [beats.scanStart - 3, beats.scanStart, beats.scanEnd, beats.scanEnd + 7],
    [0, 1, 1, 0],
    clamp,
  );
  const dkT = interpolate(frame, [beats.more + 4, beats.dark], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const waveR = interpolate(frame, [beats.scope, beats.scope + 34], [0, 2400], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const surge = interpolate(frame, [beats.conspiracy, beats.conspiracy + 14], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  const vis = (x: number, y: number) => {
    const rv = interpolate(waveR - Math.hypot(x - BOX_C.x, y - BOX_C.y), [0, 170], [0, 1], clamp);
    let v = 1 + (darkLevel - 1) * dkT;
    v += (revealLevel - v) * rv;
    return v;
  };

  // Everything about an agent for this frame, cached because neighbours are
  // asked for it repeatedly when bonds are built.
  type Live = { s: number; c: P; r: number; op: number } | null;
  const cache = new Map<number, Live>();
  const liveAt = (i: number, j: number): Live => {
    const key = i * 10007 + j;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const p = settle(rawAgent(i, j));
    if (!inField(p)) {
      cache.set(key, null);
      return null;
    }
    const d = driftOf(p.s, frame, driftScale);
    const c = { x: p.x + d.x, y: p.y + d.y };
    const swell =
      arrivalPulse(rawAgent(i - 1, j).s, 7, frame, edgeDensity) +
      arrivalPulse(rawAgent(i, j - 1).s, 8, frame, edgeDensity);
    const dip =
      departPulse(p.s, 7, frame, edgeDensity) + departPulse(p.s, 8, frame, edgeDensity);
    const breath = 1 + 0.05 * Math.sin(frame * driftRate(p.s) * 1.6 + hash(p.s, 6) * TAU);
    const sampled = inBox(p);
    const read = sampled ? interpolate(scanY - p.y, [0, 5], [0, 1], clamp) : 0;
    const base = liveOpacity + (readOpacity - liveOpacity) * read;
    const out: Live = {
      s: p.s,
      c,
      r:
        DOT_R *
        p.rr *
        breath *
        (1 + 0.34 * swellGain * Math.min(swell, 1.5) - 0.13 * Math.min(dip, 1.4)),
      op: base * (sampled ? 1 : vis(c.x, c.y)),
    };
    cache.set(key, out);
    return out;
  };

  const halfW = 540 / k;
  const halfH = 960 / k;
  const i0 = Math.max(I_MIN, Math.floor((540 - halfW) / STEP) - 1);
  const i1 = Math.min(I_MAX, Math.ceil((540 + halfW) / STEP) + 1);
  const j0 = Math.max(J_MIN, Math.floor((cy - halfH) / STEP) - 1);
  const j1 = Math.min(J_MAX, Math.ceil((cy + halfH) / STEP) + 1);

  const bodies: { key: number; d: string; op: number }[] = [];

  // One edge, seen from whichever end currently owns the droplet.
  const edgeParts = (
    src: NonNullable<Live>,
    dst: NonNullable<Live>,
    ownerS: number,
    kk: number,
    mine: "src" | "dst",
  ): string => {
    if (!edgeLive(ownerS, kk, edgeDensity)) return "";
    const cyc = edgeCycle(ownerS, kk, frame);
    let out = "";
    if (cyc < FLIGHT) {
      const u = cyc / FLIGHT;
      const holder = u < 0.5 ? "src" : "dst";
      if (holder === mine) {
        const dr = DROP_R * src.r;
        const dp = { x: src.c.x + (dst.c.x - src.c.x) * u, y: src.c.y + (dst.c.y - src.c.y) * u };
        out += circlePath(dp, dr);
        if (mine === "src" && u < PINCH) {
          out += bondPath(src.c, src.r, dp, dr, 1 - u / PINCH, false);
        }
        if (mine === "dst" && u > MERGE) {
          out += bondPath(dp, dr, dst.c, dst.r, (u - MERGE) / (1 - MERGE), false);
        }
      }
    }
    // On the last beat every pair reaches for the other and holds.
    if (surge > 0.01) {
      const a = mine === "src" ? src : dst;
      const b = mine === "src" ? dst : src;
      out += bondPath(a.c, a.r, b.c, b.r, surge * 0.5, true);
    }
    return out;
  };

  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const me = liveAt(i, j);
      if (!me) continue;
      let d = circlePath(me.c, me.r);

      const right = liveAt(i + 1, j);
      if (right) d += edgeParts(me, right, me.s, 7, "src");
      const down = liveAt(i, j + 1);
      if (down) d += edgeParts(me, down, me.s, 8, "src");
      const left = liveAt(i - 1, j);
      if (left) d += edgeParts(left, me, left.s, 7, "dst");
      const up = liveAt(i, j - 1);
      if (up) d += edgeParts(up, me, up.s, 8, "dst");

      if (me.op < 0.006) continue;
      bodies.push({ key: me.s, d, op: me.op });
    }
  }

  // The ring closes and the human fills in behind it — one gesture, no fade.
  const ringDraw = interpolate(frame, [beats.arrive, beats.arrive + 16], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const rise = interpolate(frame, [beats.arrive + 3, beats.arrive + 19], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.15)),
  });
  const ringLen = TAU * RING.r;
  const ringHeadA = -Math.PI / 2 + TAU * ringDraw;

  const brDraw = interpolate(frame, [beats.bracket, beats.bracket + 14], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const brSide = (BOX.x1 - BOX.x0) / 2;
  const brDown = BOX.y1 - BOX.y0;
  const brHalf = brSide * 2 + brDown;
  const brHead = (dir: -1 | 1): P => {
    const d = brDraw * brHalf;
    if (d <= brSide) return { x: BOX_C.x + dir * d, y: BOX.y0 };
    if (d <= brSide + brDown) return { x: BOX_C.x + dir * brSide, y: BOX.y0 + (d - brSide) };
    return { x: BOX_C.x + dir * (brHalf - d), y: BOX.y1 };
  };
  const tether = interpolate(frame, [beats.bracket + 2, beats.bracket + 12], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const tetherTop = RING.y + RING.r;

  const glyphBottom = RING.y + 52;
  const glyphTop = glyphBottom - humanSize;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: WORLD_W * BG_OVERSIZE,
            height: 1920 * BG_OVERSIZE,
            objectFit: "cover",
            transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
            filter: `blur(${backgroundBlur}px) brightness(${backgroundDim})`,
          }}
        />
      </AbsoluteFill>

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
          <div
            style={{
              position: "absolute",
              left: 540 - humanSize / 2,
              top: glyphTop - 30,
              width: humanSize,
              height: humanSize + 30,
              overflow: "hidden",
            }}
          >
            <Img
              src={staticFile(humanSrc)}
              style={{
                position: "absolute",
                left: 0,
                top: 30 + humanSize * (1 - rise),
                width: humanSize,
                height: humanSize,
                filter: "brightness(0) invert(1)",
              }}
            />
          </div>

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {bodies.map((b) => (
              <path key={b.key} d={b.d} fill={accent} fillRule="nonzero" opacity={b.op} />
            ))}

            {ringDraw > 0 ? (
              <>
                <circle
                  cx={RING.x}
                  cy={RING.y}
                  r={RING.r}
                  fill="none"
                  stroke={ink}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${(ringDraw * ringLen).toFixed(1)} ${ringLen.toFixed(1)}`}
                  transform={`rotate(-90 ${RING.x} ${RING.y})`}
                  opacity={inkMark}
                />
                {ringDraw < 0.995 ? (
                  <circle
                    cx={RING.x + RING.r * Math.cos(ringHeadA)}
                    cy={RING.y + RING.r * Math.sin(ringHeadA)}
                    r={tipRadius}
                    fill={ink}
                  />
                ) : null}
              </>
            ) : null}

            {tether > 0 ? (
              <line
                x1={540}
                y1={tetherTop}
                x2={540}
                y2={tetherTop + (BOX.y0 - tetherTop) * tether}
                stroke={ink}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                opacity={inkContext}
              />
            ) : null}

            {brDraw > 0 ? (
              <>
                {([-1, 1] as const).map((dir) => (
                  <path
                    key={`br${dir}`}
                    d={`M ${BOX_C.x} ${BOX.y0} L ${dir === -1 ? BOX.x0 : BOX.x1} ${BOX.y0} L ${dir === -1 ? BOX.x0 : BOX.x1} ${BOX.y1} L ${BOX_C.x} ${BOX.y1}`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={lineWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={`${(brDraw * brHalf).toFixed(1)} ${brHalf.toFixed(1)}`}
                    opacity={inkMark}
                  />
                ))}
                {brDraw < 0.995
                  ? ([-1, 1] as const).map((dir) => {
                      const h = brHead(dir);
                      return <circle key={`bt${dir}`} cx={h.x} cy={h.y} r={tipRadius} fill={ink} />;
                    })
                  : null}
              </>
            ) : null}

            {scanFade > 0.01 ? (
              <g opacity={scanFade}>
                <line
                  x1={BOX.x0 + 12}
                  y1={scanY}
                  x2={BOX.x1 - 12}
                  y2={scanY}
                  stroke={ink}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  opacity={inkMark}
                />
                <circle cx={BOX.x0 + 12} cy={scanY} r={tipRadius} fill={ink} />
                <circle cx={BOX.x1 - 12} cy={scanY} r={tipRadius} fill={ink} />
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default DarkAboutTheScope;
