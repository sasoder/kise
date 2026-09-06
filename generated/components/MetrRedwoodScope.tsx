import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  BG_OVERSIZE,
  CLEAR,
  GROUNDS,
  GROUND_HALF,
  SLOTS,
  SOC_H,
  THREADS,
  WORLD_H,
  WORLD_W,
  clamp,
  dotInSlot,
  hash,
  type P,
} from "./societiesWorld";

const fontFamily = "Sohne";
loadFont({ family: fontFamily, url: staticFile("Sohne-Kraftig.otf"), weight: "500" });

export const FPS = 24;
// Dwarkesh, "the investigation from METR and Redwood was limited in scope to
// how the second civilization of AIs breached Hugging Face, but its scope did
// not extend to this third civilization of AIs, which breached OpenAI itself,
// and this seems to me like the more concerning incident."
// SRT 23.339s -> 37.100s. round(13.761 * 24) = 330 frames, plus the same 16
// frame tail the other two cuts carry so the last move settles before the hold.
export const DURATION = 346;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  huggingFaceSrc: z.string(),
  openAiSrc: z.string(),
  logoSize: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  dotRadius: z.number(),
  lineWidth: z.number(),
  threadWidth: z.number(),
  tipRadius: z.number(),
  inkContext: z.number(),
  inkMark: z.number(),
  darkLevel: z.number(),
  liveOpacity: z.number(),
  readOpacity: z.number(),
  recededLevel: z.number(),
  dropRatio: z.number(),
  tagSize: z.number(),
  ambient: z.number(),
  beats: z.object({
    tag: z.number(), // "from METR and Redwood" — the label fades in
    scope: z.number(), // "was limited in scope to" — the box draws itself
    second: z.number(), // "the second civilization of AIs" — the crowd is named
    breach: z.number(), // "breached" — droplets leave for the Hugging Face mark
    huggingFace: z.number(), // "Hugging Face" — the mark takes the arrivals
    notExtend: z.number(), // "but its scope did not extend" — camera pulls up
    reach: z.number(), // the two side edges try to climb, and stop short
    third: z.number(), // "to this third civilization of AIs" — it lifts
    breach2: z.number(), // "which breached" — the same seep, up here
    openAi: z.number(), // "OpenAI itself"
    concerning: z.number(), // "the more concerning incident" — the swap
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#48D9FF",
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  // The grid's lines are darker than its field. Dim it, never invert it.
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  huggingFaceSrc: "hugging-face.webp",
  openAiSrc: "openai-logo.png",
  logoSize: 106,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotRadius: 8,
  // ONE stroke width for every line a hand draws in this piece: the box, its
  // two side edges, the floors, the ring. The only other stroke on the canvas
  // is the thread the agents make between themselves, which is their own
  // substance and carries over unchanged from `ThreeSecretSocieties`. The
  // agents and everything they send are filled shapes, so weight can never
  // disagree with itself. Ink ladder: context 0.45, a mark a human made 0.85,
  // and the tip on the end of anything being drawn is full white.
  lineWidth: 4.5,
  threadWidth: 3,
  tipRadius: 6.5,
  inkContext: 0.45,
  inkMark: 0.85,
  darkLevel: 0.16,
  liveOpacity: 0.72,
  readOpacity: 0.95,
  recededLevel: 0.4,
  dropRatio: 0.72,
  tagSize: 34,
  ambient: 0.38,
  beats: {
    tag: 24,
    scope: 52,
    second: 84,
    breach: 133,
    huggingFace: 144,
    notExtend: 162,
    reach: 174,
    third: 197,
    breach2: 244,
    openAi: 255,
    concerning: 276,
  },
});

const TAU = Math.PI * 2;

// The two societies this cut is about: the second (index 1) and the third
// (index 2), in their own slots from the shared world so the same dots stand in
// the same places they did in `ThreeSecretSocieties`.
const LOW = 1;
const HIGH = 2;

const bandTop = (g: number) => GROUNDS[g] - CLEAR - SOC_H[g];
const bandMid = (g: number) => bandTop(g) + SOC_H[g] / 2;

// The box DarkAboutTheScope drew six seconds ago, re-drawn around the second
// society: the crowd, and the floor it stands on. Wide enough that the floor's
// own ends sit inside it, so the boundary encloses a place rather than clipping
// a line.
const BOX = { x0: 110, x1: 970, y0: 1976, y1: 2292 };
const BOX_C = { x: (BOX.x0 + BOX.x1) / 2, y: (BOX.y0 + BOX.y1) / 2 };

// How far the side edges get before they stop. The third society's floor is at
// 1840; the reach ends at 1892 and strains a few pixels past that, so what is
// left over is a gap you can see rather than a join you have to take on trust.
const REACH = 84;

const TAG_Y = 1934;

// Each logo sits at the right-hand edge of its own crowd, inside that
// society's own footprint — the same offset from the same edge both times, so
// the second breach reads as a repeat of the first rather than a new idea.
const LOGOS = [
  { x: 878, y: bandMid(LOW) + 10 },
  { x: 852, y: bandMid(HIGH) + 6 },
];

// ---------------------------------------------------------------------------
// Liquid, lifted verbatim from `DarkAboutTheScope`
//
// An agent is a droplet, not a ball, and a breach is not a dot sliding along a
// wire. A droplet pinches off its sender — a neck stretches and breaks — and is
// absorbed by what it lands in, which visibly takes the volume. These helpers
// are private to that component; they are copied rather than re-derived so the
// two cuts draw the identical shape, and so this file cannot make that
// component render differently.
// ---------------------------------------------------------------------------
const ss = (x: number) => {
  const t = x <= 0 ? 0 : x >= 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};
const bell = (t: number, rise: number) => {
  if (t <= 0 || t >= 1) return 0;
  return t < rise ? ss(t / rise) : 1 - ss((t - rise) / (1 - rise));
};
const travel = Easing.inOut(Easing.cubic);

const fmt = (n: number) => n.toFixed(2);

const circlePath = (c: P, r: number) =>
  `M${fmt(c.x - r)} ${fmt(c.y)}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(c.x + r)} ${fmt(c.y)}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(c.x - r)} ${fmt(c.y)}Z`;

const bondPath = (a: P, ra: number, b: P, rb: number, strength: number) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-3 || strength <= 0.004) return "";
  const al = 0.2 + 0.62 * strength;
  const ca = Math.cos(al);
  const sa = Math.sin(al);
  const gap = d - ra * ca - rb * ca;
  const close = ss((gap - 1) / 9);
  if (close <= 0.001) return "";
  const ax = dx / d;
  const ay = dy / d;
  const nx = -ay;
  const ny = ax;
  const w = Math.min(0.46 * strength * close * Math.min(ra, rb), gap * 0.45);
  if (w < 0.12) return "";
  const h1 = 0.4 * gap;
  const h2 = 0.28 * gap;

  const pA1 = { x: a.x + ra * (ca * ax + sa * nx), y: a.y + ra * (ca * ay + sa * ny) };
  const pA2 = { x: a.x + ra * (ca * ax - sa * nx), y: a.y + ra * (ca * ay - sa * ny) };
  const tA1 = { x: sa * ax - ca * nx, y: sa * ay - ca * ny };
  const tA2 = { x: sa * ax + ca * nx, y: sa * ay + ca * ny };
  const pB1 = { x: b.x + rb * (-ca * ax + sa * nx), y: b.y + rb * (-ca * ay + sa * ny) };
  const pB2 = { x: b.x + rb * (-ca * ax - sa * nx), y: b.y + rb * (-ca * ay - sa * ny) };
  const tB1 = { x: -sa * ax - ca * nx, y: -sa * ay - ca * ny };
  const tB2 = { x: -sa * ax + ca * nx, y: -sa * ay + ca * ny };
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const m1 = { x: mx + w * nx, y: my + w * ny };
  const m2 = { x: mx - w * nx, y: my - w * ny };

  const c = (p: P, v: P, len: number) => `${fmt(p.x + v.x * len)} ${fmt(p.y + v.y * len)}`;
  const axv = { x: ax, y: ay };
  const negax = { x: -ax, y: -ay };

  let out = `M${fmt(pA1.x)} ${fmt(pA1.y)}C${c(pA1, tA1, h1)} ${c(m1, negax, h2)} ${fmt(m1.x)} ${fmt(m1.y)}`;
  out += `C${c(m1, axv, h2)} ${c(pB1, tB1, h1)} ${fmt(pB1.x)} ${fmt(pB1.y)}`;
  out += `L${fmt(pB2.x)} ${fmt(pB2.y)}`;
  out += `C${c(pB2, tB2, h1)} ${c(m2, axv, h2)} ${fmt(m2.x)} ${fmt(m2.y)}`;
  out += `C${c(m2, negax, h2)} ${c(pA2, tA2, h1)} ${fmt(pA2.x)} ${fmt(pA2.y)}Z`;
  return out;
};

// ---------------------------------------------------------------------------
// The breach
//
// A seep, not a volley: droplets leave the crowd's right-hand edge one at a
// time on their own shallow arcs, cross the mark's own boundary and are
// absorbed inside it, and the mark takes a small pulse as each one lands. Both
// breaches run the identical stream — same sources, same stagger, same flight,
// same droplet size — because the whole point of the second one is that it is
// the first one happening again outside the box.
// ---------------------------------------------------------------------------
const PINCH = 0.44; // how far into the flight the sender is still holding on
const FLIGHT = 22; // frames
const STAGGER = 5; // frames between departures
const BREACH_SRC = 5; // how many of the crowd's rightmost agents ever leave

// Five agents taken down the crowd's right-hand half at increasing distance
// from the mark, so the seep is a stream crossing open ground and converging —
// the five agents actually nearest the mark are so close to it that nothing
// reads as travelling at all.
const breachSlots = (g: number) => {
  const byX = SLOTS[g]
    .map((p, s) => ({ s, x: p.x }))
    .sort((a, b) => b.x - a.x)
    .map((e) => e.s);
  return [2, 5, 8, 11, 14].map((i) => byX[Math.min(i, byX.length - 1)]);
};
const SOURCES = [breachSlots(LOW), breachSlots(HIGH)];

const target = (m: number, logo: { x: number; y: number }, size: number): P => {
  const a = hash(m, 31) * TAU;
  const rr = 0.1 + 0.24 * hash(m, 33);
  return { x: logo.x + Math.cos(a) * size * rr, y: logo.y + Math.sin(a) * size * rr };
};

// A shallow arc with its own bow, so a stream never reads as a rank of dots on
// one rail. Same construction as the migrations in `ThreeSecretSocieties`.
const arcAt = (from: P, to: P, m: number, t: number): P => {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2 - (28 + hash(m, 65) * 62) * (hash(m, 67) < 0.4 ? -1 : 1);
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * mx + t * t * to.x,
    y: u * u * from.y + 2 * u * t * my + t * t * to.y,
  };
};

// ---------------------------------------------------------------------------
// Camera
//
// Same model and the same hand as the other two cuts: a shot is an anchor (the
// world point that sits in the caption-safe band at y 835) and a zoom, one
// damped progress walks the shot list, zoom is interpolated in log space so a
// constant rate there is a constant rate on screen, and the centre is solved
// rather than authored — for any two framings there is exactly one world point
// that lands on the same pixel in both, so that point is held still and only
// the scale changes. Every key ramp is short and lands ahead of the word it
// serves; between them the camera holds and only the subject moves. The slow
// creep is applied after the solve, as a pure zoom about the caption anchor, so
// a hold is never actually parked.
// ---------------------------------------------------------------------------
type Shot = { anchor: number; k: number };
const SHOTS: Shot[] = [
  { anchor: 2025, k: 1.12 }, // the second society, alive on its floor
  { anchor: 2055, k: 0.96 }, // room for the box that is about to be drawn
  { anchor: 1958, k: 0.88 }, // up and back: the third society is up there too
  { anchor: 1846, k: 0.9 }, // and it is the thing that is lit
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

const CAM_F = [0, 12, 32, 142, 158, 256, 270, DURATION];
const CAM_P = [0, 0, 1, 1, 2, 2, 3, 3];
const CAM_CREEP = 0.00045;
// Critically damped, as in `ThreeSecretSocieties`: an overshoot here would walk
// the progress back across a shot boundary and cross it three times.
const CAM_STIFF = 0.16;
const CAM_DAMP = 0.8;

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
  const kBase = Math.exp(
    Math.log(SHOTS[i].k) + (Math.log(SHOTS[i + 1].k) - Math.log(SHOTS[i].k)) * t,
  );
  const pv = PIVOTS[i];
  const cyBase = pv
    ? pv.w - (pv.sy - 960) / kBase
    : SHOT_CY[i] + (SHOT_CY[i + 1] - SHOT_CY[i]) * t;
  const k = kBase * (1 + CAM_CREEP * upto);
  return { cy: cyBase - 125 / kBase + 125 / k, k };
};

const MetrRedwoodScope: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  huggingFaceSrc,
  openAiSrc,
  logoSize,
  shadowY,
  shadowBlur,
  shadowOpacity,
  dotRadius,
  lineWidth,
  threadWidth,
  tipRadius,
  inkContext,
  inkMark,
  darkLevel,
  liveOpacity,
  readOpacity,
  recededLevel,
  dropRatio,
  tagSize,
  ambient,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { cy, k } = camera(frame);
  const tx = 540 - 540 * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - SHOT_CY[0]) * k * parallax - frame * 0.25;
  const bgScale = 1 + (k - 1) * 0.3;

  // -- the two levels --------------------------------------------------------
  // Everything in the piece hangs off these two numbers, so the last beat is
  // one exchange rather than a dozen separate fades.
  const swap = interpolate(frame, [beats.concerning, beats.concerning + 22], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const lifted = interpolate(frame, [beats.third, beats.third + 20], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const level = [
    readOpacity + (recededLevel - readOpacity) * swap,
    darkLevel + (liveOpacity - darkLevel) * lifted + (readOpacity - liveOpacity) * lifted * swap,
  ];
  const markLevel = [1 - (1 - recededLevel) * swap, darkLevel + (1 - darkLevel) * lifted];
  const boxInk = inkMark + (inkContext * 0.75 - inkMark) * swap;

  // -- the population --------------------------------------------------------
  type Dot = { x: number; y: number; r: number };
  const dotsOf = (g: number, swell: (p: P, id: number) => number): Dot[] =>
    SLOTS[g].map((base, s) => {
      const id = dotInSlot(g, s);
      const breath = 1 + 0.05 * Math.sin(frame * 0.11 + hash(id, 6) * TAU);
      return {
        x: base.x + 6 * Math.sin(frame * 0.055 + hash(id, 3) * TAU),
        y: base.y + 5 * Math.cos(frame * 0.047 + hash(id, 4) * TAU),
        r: dotRadius * (0.75 + 0.5 * hash(id, 7)) * breath * (1 + swell(base, id)),
      };
    });

  // "the second civilization of AIs" — the crowd is named, so a swell runs out
  // through it as a front 300px wide, read off the front's own radius rather
  // than off a parallel clock.
  const nameR = interpolate(frame, [beats.second, beats.second + 34], [-160, 820], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const lowSwellAt = (p: P) =>
    0.22 * bell((nameR - Math.hypot(p.x - BOX_C.x, p.y - BOX_C.y) + 150) / 300, 0.45);
  // The third crowd swells once as it lights, and again on the payoff.
  const highSwellAt = (_p: P, id: number) =>
    0.2 * bell((frame - beats.third - Math.floor(hash(id, 21) * 12)) / 22, 0.35) +
    0.16 * bell((frame - beats.concerning - 4 - Math.floor(hash(id, 22) * 14)) / 26, 0.4);

  const dots = [dotsOf(LOW, lowSwellAt), dotsOf(HIGH, highSwellAt)];

  // -- the breaches ----------------------------------------------------------
  type Body = { key: string; d: string; op: number };
  const bodies: Body[] = [];
  const pinched = [new Set<number>(), new Set<number>()];
  const pulses = [0, 0];

  const runBreach = (gi: number, start: number) => {
    const logo = LOGOS[gi];
    const op = level[gi];
    if (op < 0.02) return;
    const first = Math.ceil((frame - start - FLIGHT) / STAGGER);
    const last = Math.floor((frame - start) / STAGGER);
    for (let m = Math.max(0, first); m <= last; m++) {
      const launch = start + m * STAGGER;
      const t = (frame - launch) / FLIGHT;
      if (t < 0 || t > 1) continue;
      const slot = SOURCES[gi][m % BREACH_SRC];
      const src = dots[gi][slot];
      const from = { x: src.x, y: src.y };
      const to = target(m, logo, logoSize);
      const u = travel(t);
      const pos = arcAt(from, to, m, u);
      // Absorbed: it is inside the mark by now, so it gives up its volume there
      // instead of arriving as a dot that switches off.
      const soak = ss((u - 0.76) / 0.24);
      const dr = dropRatio * src.r * (1 - 0.55 * soak);
      if (u < PINCH) {
        pinched[gi].add(slot);
        bodies.push({
          key: `b${gi}-${m}`,
          d:
            circlePath(from, src.r) +
            bondPath(from, src.r, pos, dr, ss(1 - u / PINCH)) +
            circlePath(pos, dr),
          op,
        });
      } else {
        bodies.push({ key: `b${gi}-${m}`, d: circlePath(pos, dr), op: op * (1 - soak) });
      }
      pulses[gi] += bell((frame - (launch + FLIGHT * 0.86)) / 11, 0.28);
    }
  };
  runBreach(0, beats.breach);
  runBreach(1, beats.breach2);
  const markNamed = [beats.huggingFace, beats.openAi];

  // -- the floors ------------------------------------------------------------
  // Floors are context, and they stay context: a floor that outshines the crowd
  // standing on it steals the frame, which is exactly what the first pass did.
  const floorOp = [
    inkContext + (inkContext * 0.5 - inkContext) * swap,
    inkContext * 0.42 + (inkContext - inkContext * 0.42) * lifted,
  ];

  // -- the box ---------------------------------------------------------------
  const brDraw = interpolate(frame, [beats.scope, beats.scope + 30], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  // "but its scope" — the boundary is named again, so it answers before it
  // tries and fails to climb.
  const boxRefer =
    boxInk +
    (1 - boxInk) * bell((frame - beats.notExtend + 4) / 18, 0.35) * (1 - swap);
  const brSide = (BOX.x1 - BOX.x0) / 2;
  const brDown = BOX.y1 - BOX.y0;
  const brHalf = brSide * 2 + brDown;
  const brHead = (dir: -1 | 1): P => {
    const d = brDraw * brHalf;
    if (d <= brSide) return { x: BOX_C.x + dir * d, y: BOX.y0 };
    if (d <= brSide + brDown) return { x: BOX_C.x + dir * brSide, y: BOX.y0 + (d - brSide) };
    return { x: BOX_C.x + dir * (brHalf - d), y: BOX.y1 };
  };

  // The two side edges climb toward the third society and stop, then strain a
  // few pixels further and give it up. That last movement is the whole beat:
  // the gap it leaves is what "did not extend" looks like.
  const extBase = interpolate(frame, [beats.reach, beats.reach + 13], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const strain = interpolate(
    frame,
    [beats.reach + 13, beats.reach + 21, beats.reach + 32],
    [0, 7, -2],
    { ...clamp, easing: Easing.inOut(Easing.sin) },
  );
  const extTop = BOX.y0 - REACH * extBase - strain;
  const extTip = interpolate(
    frame,
    [beats.reach, beats.reach + 2, beats.reach + 30, beats.reach + 40],
    [0, 1, 1, 0],
    clamp,
  );

  // -- the ring, spent once --------------------------------------------------
  const ringDraw = interpolate(frame, [beats.concerning + 6, beats.concerning + 22], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const ringR =
    logoSize * 0.78 +
    6 * (1 - ss(interpolate(frame, [beats.concerning + 18, beats.concerning + 34], [0, 1], clamp)));
  const ringLen = TAU * ringR;
  const ringHeadA = -Math.PI / 2 + TAU * ringDraw;

  const tagOp =
    interpolate(frame, [beats.tag, beats.tag + 12], [0, 0.5], clamp) *
    (1 - 0.6 * swap);

  const logoFilter = [
    // The Hugging Face mark is the one thing on this canvas that is not line
    // work: flattening it to a white silhouette loses the eyes and the mouth,
    // which is all there is to recognise. Grayscale and lift it instead — the
    // face goes to near-white and the features stay as holes in it, so it sits
    // in the same monochrome as everything else without becoming a blob.
    "grayscale(1) brightness(1.02) contrast(1.32)",
    "brightness(0) invert(1)",
  ];
  const logoSrc = [huggingFaceSrc, openAiSrc];

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
          {[0, 1].map((gi) => {
            // The droplets leave on "breached" and the mark fades up where they
            // are headed, on its own name — so the destination is revealed by
            // the thing already travelling toward it.
            const show = interpolate(frame, [markNamed[gi] - 6, markNamed[gi] + 6], [0, 1], {
              ...clamp,
              easing: Easing.out(Easing.cubic),
            });
            if (show <= 0.001) return null;
            const s = logoSize * (0.86 + 0.14 * show) * (1 + 0.05 * Math.min(pulses[gi], 1.4));
            return (
              <Img
                key={`logo${gi}`}
                src={staticFile(logoSrc[gi])}
                style={{
                  position: "absolute",
                  left: LOGOS[gi].x - s / 2,
                  top: LOGOS[gi].y - s / 2,
                  width: s,
                  height: s,
                  filter: logoFilter[gi],
                  opacity: markLevel[gi] * show * (1 + 0.1 * Math.min(pulses[gi], 1.4)),
                }}
              />
            );
          })}

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {[LOW, HIGH].map((g, gi) => (
              <line
                key={`floor${g}`}
                x1={540 - GROUND_HALF}
                y1={GROUNDS[g]}
                x2={540 + GROUND_HALF}
                y2={GROUNDS[g]}
                stroke={ink}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                opacity={floorOp[gi]}
              />
            ))}

            {[LOW, HIGH].map((g, gi) =>
              THREADS[g].map((t, ti) => {
                const op = level[gi];
                if (op < 0.02) return null;
                // Society two's web is already there and knits itself in over
                // the first second; society three's arrives when it lights.
                const start =
                  gi === 0 ? -6 + t.k * 8 : beats.third + 3 + t.k * 18;
                const p = interpolate(frame, [start, start + 7], [0, 1], {
                  ...clamp,
                  easing: Easing.out(Easing.quad),
                });
                if (p <= 0) return null;
                const a = dots[gi][t.a];
                const b = dots[gi][t.b];
                const hx = a.x + (b.x - a.x) * p;
                const hy = a.y + (b.y - a.y) * p;
                const done = interpolate(frame, [start + 7, start + 12], [1, 0], clamp);
                const carries = ti % 5 === 0 && p >= 1;
                const u = (frame * 0.018 + t.k) % 1;
                return (
                  <g key={`t${g}-${ti}`}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={hx}
                      y2={hy}
                      stroke={accent}
                      strokeWidth={threadWidth}
                      strokeLinecap="round"
                      opacity={op * (0.36 + 0.26 * done)}
                    />
                    {p < 1 ? <circle cx={hx} cy={hy} r={4} fill={ink} opacity={op} /> : null}
                    {carries ? (
                      <circle
                        cx={a.x + (b.x - a.x) * u}
                        cy={a.y + (b.y - a.y) * u}
                        r={3.5}
                        fill={ink}
                        opacity={op * ambient}
                      />
                    ) : null}
                  </g>
                );
              }),
            )}

            {[0, 1].map((gi) =>
              dots[gi].map((d, s) =>
                pinched[gi].has(s) ? null : (
                  <circle
                    key={`d${gi}-${s}`}
                    cx={d.x}
                    cy={d.y}
                    r={d.r}
                    fill={accent}
                    opacity={level[gi]}
                  />
                ),
              ),
            )}

            {bodies.map((b) => (
              <path key={b.key} d={b.d} fill={accent} fillRule="nonzero" opacity={b.op} />
            ))}

            {extBase > 0 ? (
              <>
                {([BOX.x0, BOX.x1] as const).map((x) => (
                  <line
                    key={`ext${x}`}
                    x1={x}
                    y1={BOX.y0}
                    x2={x}
                    y2={extTop}
                    stroke={ink}
                    strokeWidth={lineWidth}
                    strokeLinecap="round"
                    opacity={boxRefer}
                  />
                ))}
                {extTip > 0.01
                  ? ([BOX.x0, BOX.x1] as const).map((x) => (
                      <circle
                        key={`extip${x}`}
                        cx={x}
                        cy={extTop}
                        r={tipRadius}
                        fill={ink}
                        opacity={extTip}
                      />
                    ))
                  : null}
              </>
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
                    strokeLinecap="butt"
                    strokeDasharray={`${(brDraw * brHalf).toFixed(1)} ${brHalf.toFixed(1)}`}
                    opacity={boxRefer}
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

            {ringDraw > 0 ? (
              <>
                <circle
                  cx={LOGOS[1].x}
                  cy={LOGOS[1].y}
                  r={ringR}
                  fill="none"
                  stroke={ink}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${(ringDraw * ringLen).toFixed(1)} ${ringLen.toFixed(1)}`}
                  transform={`rotate(-90 ${LOGOS[1].x} ${LOGOS[1].y})`}
                  opacity={inkMark}
                />
                {ringDraw < 0.995 ? (
                  <circle
                    cx={LOGOS[1].x + ringR * Math.cos(ringHeadA)}
                    cy={LOGOS[1].y + ringR * Math.sin(ringHeadA)}
                    r={tipRadius}
                    fill={ink}
                  />
                ) : null}
              </>
            ) : null}
          </svg>

          {tagOp > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: TAG_Y - tagSize * 0.72,
                width: WORLD_W,
                textAlign: "center",
                fontFamily,
                fontWeight: 500,
                fontSize: tagSize,
                lineHeight: 1.1,
                letterSpacing: "0.12em",
                marginRight: "-0.12em",
                color: ink,
                opacity: tagOp,
                whiteSpace: "nowrap",
              }}
            >
              METR · Redwood
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default MetrRedwoodScope;
