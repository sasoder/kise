// ---------------------------------------------------------------------------
// NoosphereOmegaPoint (wip-biblical, cut 73). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx). The globe comes from ./globeShared (cut 43's), the red
// point from ./ProphetsPointedHere (cut 86's).
// Opaque 1080x1920, 24 fps, 139 frames.
//
// CHECK LINE: "Teilhard's idea: one layer of minds wraps the whole Earth and draws together into a single point, Omega."
// With no sound: the wired globe from cut 43 grows a continuous red skin, the skin's lines rise and meet in one point
// marked Omega, and Teilhard looks up at it.
//
// THE LINE: "(Teilhard de Chardin ... predicted the noosphere,) a single layer of human consciousness wrapping all around
// the globe, converging on what he called the omega point."
// WORD -> FRAME: single 1 · layer 13 · of 20 · human 26 · consciousness 32 · wrapping 45 · all 53 · around 64 · the 71 ·
// globe 74 · converging 84 · on 97 · what 101 · he 106 · called 109 · the 114 · omega 119 · point 125 · (cut to speaker
// f139) (Whisper onsets, may run 2-6 frames early)
// DURATION: the slot 73.958 -> 79.750 s = 5.792 s x 24 = 139 frames (f0..f138).
//
// THE MOTION: one rise of the camera (cut 43's settled camera held to f12, then the view lifts and eases back to k 0.889,
// landing ~f100, then a creep in about the point), so the globe sinks a little and the space above opens. Cut 43's people
// slip back behind the limb (f0-22) and a red skin starts where their wires met the rim (f3-9): a band of fine contour
// lines on a translucent red wash between the limb and 43's ring, spreading both ways from each seed; the upper half is one
// layer by ~f26, and the two outer fronts run round the sides and meet under the globe at the lower left (f68, the ring
// takes in the last of it by ~f76), 43's ring thinning into the band's outermost line as the skin reaches it. On
// "converging" (f84) the top of every contour line lifts off and draws straight into one point above the globe (each line
// leaves the band further round than the one inside it, so they fan; outer lines first, the last arrives f124); the ink
// pools into cut 86's red point from f106 (full by "omega" f119), the Omega slides up beside it (f108-122), and Teilhard is
// dealt in from the right edge, travelling up and left the way he faces (f96-116), looking up at it. Settled from ~f125:
// the creep and the grain.
// Contact frames: lead lines meet P from ~f106 (the point starts there); Teilhard lands f116; the skin closes f68 (inner)
// to f76 (ring).
// SHAPE CHECK: tried "curve" (lines leave the band along its tangent and curve in to arrive from below: reads as a water
// drop / onion dome) and "fan" (straight lines from staggered departures: reads as lines converging on a point, the way
// Teilhard's own cone diagrams draw it). Default "fan"; the globe stays the larger mass (radius 240 vs a fan ~200 tall).
// SPOT INK: red = the bond: cut 43's wires, the noosphere skin (which takes in 43's ring) and the omega point. Indigo =
// the printed graticule and limb. Deep ink: the Omega.
//
// SOURCES: the globe, wires and ring are cut 43's (globeShared.tsx: NASA Blue Marble NG 2004, the 1901 Eastern Telegraph
// cables). Teilhard: Pierre Teilhard de Chardin, portrait 1947, Archives des jesuites de France (Commons
// File:TeilhardP_1947.jpg, CC BY-SA 3.0; credit "Archives des jesuites de France, CC BY-SA 3.0"), mirrored so he looks up to
// frame-left (no lettering in it); matte Apple Vision (person) plus a hand-cut bust line through the dark cassock; grade
// scripts/clips/wip-anthropic/bake-photo.py --mid 0.5 -> public/wip-biblical/w73_teilhard.png.
// The point: SingularityPoint / SINGULARITY_POINT from ./ProphetsPointedHere (cut 86): on the last frame exactly screen
// (540, 150), radius 24.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  CutOut,
  INDIGO,
  InkPrint,
  PaperGround,
  RED,
  SERIF,
  SERIF_WEIGHT,
  THEMES,
  WipCam,
  WipFilmLife,
  WipPlane,
  depthTransform,
  paperEase,
  runWipCamera,
  slide,
  textRise,
} from "../kits/works-in-progress/wipShared";
import {
  EarthPrint,
  GLOBE_R,
  GLOBE_X,
  GLOBE_Y,
  GRATICULE,
  InkLines,
  RING_R,
  RING_W,
  WIRE_W,
  CITIES,
  geoD,
  globePoint,
  globeProjection,
  globeRotate,
  routeById,
  routeExit,
  wireLength,
  wirePartial,
} from "./globeShared";
import { SingularityPoint, SINGULARITY_POINT } from "./ProphetsPointedHere";
import { LISTENERS, OPERATOR, camAt as camAt43 } from "./WiredIntoOneTribe";

export const FPS = 24;
export const DURATION = 139;
export const schema = z.object({ bands: z.boolean(), shape: z.enum(["fan", "curve"]), mask: z.boolean() });
export const defaultProps = schema.parse({ bands: false, shape: "fan", mask: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
};
const D2R = Math.PI / 180;

// -- joined to cut 43 ---------------------------------------------------------------------------------------------------
/** cut 43's last frame; this cut's f0 continues its world: the same camera, the globe's turn and the grain go on */
const F43 = 184;
const CAM43 = camAt43(F43);
const rotAt = (frame: number) => globeRotate(F43 + 1 + frame);

// -- the camera: one rise. The view lifts and eases back, so the globe sinks a little and the space above opens --------
// Keys hold cut 43's settled camera to f12, then one eased move to the settled frame (k 0.889: the globe's radius 240 on
// screen, its centre at y 630), landing ~f100; then a slow creep in about the point. The kit's rest camera (x0, y0) stays
// cut 43's, so the paper continues pixel for pixel.
const K_END = 240 / GLOBE_R;
const GLOBE_SY = 630;
const P_SX = SINGULARITY_POINT.x;
const P_SY = SINGULARITY_POINT.y;
/** a d = 1 camera key holding world (wx, wy) at screen (sx, sy) at zoom k */
const key = (f: number, wx: number, wy: number, sx: number, sy: number, k: number, ease?: "inout" | "linear") => ({
  f,
  x: wx - (sx - 540) / k,
  y: wy - (sy - 960) / k,
  k,
  ease,
});
const endKey = key(90, GLOBE_X, GLOBE_Y, 540, GLOBE_SY, K_END);
/** the world point at screen (P_SX, P_SY) on the settled key: the point the layer draws into */
const P_KEY = { x: endKey.x + (P_SX - 540) / K_END, y: endKey.y + (P_SY - 960) / K_END };
const track = runWipCamera(
  [
    { f: -24, x: CAM43.x, y: CAM43.y, k: CAM43.k },
    { f: 12, x: CAM43.x, y: CAM43.y, k: CAM43.k },
    endKey,
    key(DURATION + 40, P_KEY.x, P_KEY.y, P_SX, P_SY, K_END * 1.035, "linear"),
  ],
  DURATION,
);
const camAt = (frame: number): WipCam => ({ ...track(frame), x0: CAM43.x0, y0: CAM43.y0 });

// The point: wherever screen (540, 150) falls on the last frame, so it lands exactly on cut 86's opening point.
const CAM_LAST = camAt(DURATION - 1);
const T_LAST = depthTransform(CAM_LAST, 1);
const P = { x: (P_SX - T_LAST.tx) / T_LAST.k, y: (P_SY - T_LAST.ty) / T_LAST.k };
/** SingularityPoint's scale on the d = 1 plane so it is SINGULARITY_POINT.r on screen on the last frame */
const P_SCALE = 1 / T_LAST.k;

// -- the people of cut 43 slip back behind the limb (f0-20) as the skin starts where their wires met the rim -----------
type Person = (typeof LISTENERS)[number];
const SINK = 16;
const HIDE = 170;
const SINK_AT: Record<string, number> = { operator: 0, newYork: 2, bombay: 4, east: 6 };
const personAt = (p: Person, frame: number) => {
  const t = slide(frame, SINK_AT[p.id] ?? 0, SINK);
  const a = p.theta * D2R;
  return { x: p.x - Math.cos(a) * HIDE * t, y: p.y + Math.sin(a) * HIDE * t };
};
const plugAt = (p: Person, at: { x: number; y: number }) => {
  const h = p.w / p.aspect;
  let lx = (p.plug[0] - 0.5) * p.w;
  const ly = (p.plug[1] - 0.5) * h;
  if (p.flipX) lx = -lx;
  const t = (p.rotate * Math.PI) / 180;
  return { x: at.x + lx * Math.cos(t) - ly * Math.sin(t), y: at.y + lx * Math.sin(t) + ly * Math.cos(t) };
};
const DISC_CLIP = `path(evenodd, "M-4000 -4000H5000V5000H-4000Z M${GLOBE_X + GLOBE_R} ${GLOBE_Y}A${GLOBE_R} ${GLOBE_R} 0 1 0 ${GLOBE_X - GLOBE_R} ${GLOBE_Y}A${GLOBE_R} ${GLOBE_R} 0 1 0 ${GLOBE_X + GLOBE_R} ${GLOBE_Y}Z")`;
const insideDisc = (q: { x: number; y: number }) => Math.hypot(q.x - GLOBE_X, q.y - GLOBE_Y) <= GLOBE_R * 0.994;
/** math degrees (y up) of a world point about the globe's centre, 0..360 */
const thetaOf = (q: { x: number; y: number }) => ((Math.atan2(-(q.y - GLOBE_Y), q.x - GLOBE_X) / D2R) % 360 + 360) % 360;

// -- the skin: a band of fine red contour lines on a translucent red wash, from the limb out to cut 43's ring ------------
const R_IN = GLOBE_R + 3;
const LINES = 6; // contour lines; the outermost is 43's ring, thinned to their weight
const LINE_W = 2.1;
const lineR = (i: number) => R_IN + 3 + ((RING_R - R_IN - 3) * i) / (LINES - 1); // i = LINES - 1 is the ring
const WASH = 0.3;

// Seeds: where cut 43's wires met the rim (the operator's lead, then each listener's tail), and when each starts.
const KEY43 = plugAt(OPERATOR as Person, { x: OPERATOR.x, y: OPERATOR.y });
/** where cut 43's lead (his key -> London) crosses the limb */
const LEAD_X = (() => {
  const L = globePoint(CITIES.london as [number, number], rotAt(0));
  const dx = L.x - KEY43.x;
  const dy = L.y - KEY43.y;
  const fx = KEY43.x - GLOBE_X;
  const fy = KEY43.y - GLOBE_Y;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - GLOBE_R * GLOBE_R;
  const t = (-b - Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
  return { x: KEY43.x + dx * t, y: KEY43.y + dy * t };
})();
const SEEDS = [
  { id: "operator", theta: thetaOf(LEAD_X), start: 3 },
  ...LISTENERS.map((p) => ({ id: p.id, theta: thetaOf(plugAt(p, { x: p.x, y: p.y })), start: 3 + (SINK_AT[p.id] ?? 0) })),
].sort((a, b) => a.theta - b.theta);
/** the skin closes round the bottom here, on "globe": left of the presenter's head */
const CLOSE_THETA = 234;
const CLOSE_AT = 68;
/** the two outer fronts start slowly (the top forms first), run round the sides and under on "wrapping all around", and ease as they meet */
const WRAP_EASE = Easing.bezier(0.6, 0, 0.7, 1);
/** each contour line trails the one inside it by a frame and a half, so a front is a slanted, spreading edge */
const LINE_LAG = 1.5;
const INNER_SPEED = 1.9; // deg / frame for fronts that meet a neighbour
/** covered arcs [a, b] in degrees (a < b, may run past 360) */
const covered = (frame: number): [number, number][] => {
  const n = SEEDS.length;
  const arcs: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const s = SEEDS[i];
    if (frame <= s.start) continue;
    const prev = SEEDS[(i - 1 + n) % n];
    const next = SEEDS[(i + 1) % n];
    const age = frame - s.start;
    // going up in theta (counter-clockwise)
    let up: number;
    if (i === n - 1) {
      up = interpolate(frame, [s.start, CLOSE_AT], [0, CLOSE_THETA - s.theta], { ...clamp, easing: WRAP_EASE });
    } else {
      up = Math.min(age * INNER_SPEED, (next.theta - s.theta) / 2);
    }
    let down: number;
    if (i === 0) {
      down = interpolate(frame, [s.start, CLOSE_AT], [0, s.theta + 360 - CLOSE_THETA], { ...clamp, easing: WRAP_EASE });
    } else {
      down = Math.min(age * INNER_SPEED, (s.theta - prev.theta) / 2);
    }
    arcs.push([s.theta - down, s.theta + up]);
  }
  // union on the circle
  const norm = arcs.map(([a, b]) => [a, b] as [number, number]).sort((p, q) => p[0] - q[0]);
  const out: [number, number][] = [];
  for (const a of norm) {
    const last = out[out.length - 1];
    if (last && a[0] <= last[1] + 0.05) last[1] = Math.max(last[1], a[1]);
    else out.push([...a]);
  }
  if (out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (last[1] >= first[0] + 360 - 0.05) {
      first[0] = last[0] - 360;
      first[1] = Math.max(first[1], last[1] - 360);
      out.pop();
    }
  }
  if (out.length === 1 && out[0][1] - out[0][0] >= 359.9) return [[0, 360]];
  return out;
};
const coverDepth = (arcs: [number, number][], th: number) => {
  // degrees from th to the nearest uncovered angle (0 if uncovered)
  for (const [a, b] of arcs) {
    if (b - a >= 359.9) return 999;
    for (const k of [-360, 0, 360]) {
      const t = th + k;
      if (t >= a && t <= b) return Math.min(t - a, b - t);
    }
  }
  return 0;
};

// -- the lift: the top of every contour line rises off the globe and draws into the point (f84-125) --------------------
const LIFT_START = 84;
const LIFT_DUR = 30; // each line's lift
const LIFT_STAGGER = 2; // outer lines first
/** where each line leaves the band, degrees from the top */
const departFrom = (i: number, shape: "fan" | "curve") => {
  if (shape === "fan") return 16 + (i / (LINES - 1)) * 42; // inner lines leave near the top, the ring furthest round
  return 34 + (i / (LINES - 1)) * 24;
};
const liftT = (frame: number, i: number) => slide(frame, LIFT_START + (LINES - 1 - i) * LIFT_STAGGER, LIFT_DUR);

const pt = (r: number, th: number) => ({ x: GLOBE_X + r * Math.cos(th * D2R), y: GLOBE_Y - r * Math.sin(th * D2R) });
/** one side of a lifted line, as points from its departure (u 0) to the top (u 1), at lift t */
const liftSide = (i: number, side: 1 | -1, t: number, shape: "fan" | "curve") => {
  const r = lineR(i);
  const phi = departFrom(i, shape);
  const th0 = 90 - side * phi; // side 1: the right side
  const S = pt(r, th0);
  const n = 40;
  const out: { x: number; y: number }[] = [];
  // the target: straight to P, or leaving along the circle's tangent and curving in to arrive at P from below.
  // The circle's tangent at th0, heading toward the top:
  const tangent = side === 1 ? { x: -Math.sin(th0 * D2R), y: -Math.cos(th0 * D2R) } : { x: Math.sin(th0 * D2R), y: Math.cos(th0 * D2R) };
  // make sure it points upward (screen y negative)
  const up = tangent.y > 0 ? { x: -tangent.x, y: -tangent.y } : tangent;
  const L = Math.hypot(P.x - S.x, P.y - S.y);
  const c1 = { x: S.x + up.x * L * 0.45, y: S.y + up.y * L * 0.45 };
  const c2 = { x: P.x, y: P.y + L * 0.38 };
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const a = pt(r, th0 + side * phi * u);
    let b: { x: number; y: number };
    if (shape === "fan") b = { x: S.x + (P.x - S.x) * u, y: S.y + (P.y - S.y) * u };
    else {
      const v = 1 - u;
      b = {
        x: v * v * v * S.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * P.x,
        y: v * v * v * S.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * P.y,
      };
    }
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
};

// -- Teilhard is dealt in from the right edge on "what he called" (f101), into the right strip, looking up at the point --
// Laid out in settled screen px (the end key), converted to world. He travels up and left, the way he faces, from wholly
// off the right edge to his place beside the globe (eased, one paper slide).
const toWorld = (sx: number, sy: number) => ({ x: endKey.x + (sx - 540) / K_END, y: endKey.y + (sy - 960) / K_END });
const TEIL = { src: "wip-biblical/w73_teilhard.png", aspect: 0.745, w: 212 / K_END, rotate: -4, start: 96, dur: 20 };
const TEIL_END = toWorld(874, 566);
const TEIL_FROM = toWorld(874 + 345 * Math.cos(20 * D2R), 566 + 345 * Math.sin(20 * D2R));
const teilAt = (frame: number) => {
  const t = slide(frame, TEIL.start, TEIL.dur);
  return { x: TEIL_FROM.x + (TEIL_END.x - TEIL_FROM.x) * t, y: TEIL_FROM.y + (TEIL_END.y - TEIL_FROM.y) * t };
};

// -- ink box (world px) ---------------------------------------------------------------------------------------------------
const BX = -200;
const BY = -400;
const BW = 1480;
const BH = 1500;
const bx = (q: { x: number; y: number }, ox = BX, oy = BY) => `${(q.x - ox).toFixed(2)} ${(q.y - oy).toFixed(2)}`;
const poly = (ps: { x: number; y: number }[], ox = BX, oy = BY) => ps.map((q, i) => `${i ? "L" : "M"}${bx(q, ox, oy)}`).join("");
// cut 43's own ink box for the graticule, wires and ring: the same box gives the same ink grain at every world point, so
// f0 joins its last frame
const B43 = { x: GLOBE_X - RING_R - 200, y: GLOBE_Y - RING_R - 200, w: 2 * (RING_R + 200) };
const b43 = (q: { x: number; y: number }) => bx(q, B43.x, B43.y);
const arcD = (r: number, a: number, b: number) => {
  const n = Math.max(2, Math.ceil((b - a) / 1.5));
  const ps = Array.from({ length: n + 1 }, (_, i) => pt(r, a + ((b - a) * i) / n));
  return poly(ps);
};
const annulusD = (r0: number, r1: number, a: number, b: number) => {
  if (b - a >= 359.9) {
    const c = { x: GLOBE_X - BX, y: GLOBE_Y - BY };
    const ring = (r: number) => `M${c.x + r} ${c.y}A${r} ${r} 0 1 0 ${c.x - r} ${c.y}A${r} ${r} 0 1 0 ${c.x + r} ${c.y}Z`;
    return `${ring(r1)} ${ring(r0)}`;
  }
  const n = Math.max(2, Math.ceil((b - a) / 1.5));
  const outer = Array.from({ length: n + 1 }, (_, i) => pt(r1, a + ((b - a) * i) / n));
  const inner = Array.from({ length: n + 1 }, (_, i) => pt(r0, b - ((b - a) * i) / n));
  return `${poly([...outer, ...inner])}Z`;
};

const NoosphereOmegaPoint: React.FC<z.infer<typeof schema>> = ({ bands, shape, mask }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const rot = rotAt(frame);
  const proj = globeProjection(rot, GLOBE_X - B43.x, GLOBE_Y - B43.y, GLOBE_R);
  const world = globeProjection(rot);
  const london = globePoint(CITIES.london as [number, number], rot);

  // -- the wires, full length as cut 43 left them; the tails off the rim shorten as the people sink
  const wireW = interpolate(frame, [1, 30], [WIRE_W, WIRE_W * 1.3], { ...clamp, easing: paperEase });
  const wirePaths: string[] = [];
  const opKey = plugAt(OPERATOR as Person, personAt(OPERATOR as Person, frame));
  for (const id of ["atlantic", "suez", "westafrica", "eastern", "southamerica"]) wirePaths.push(geoD(proj, wirePartial(routeById(id).path, 1e6).line));
  // the operator's lead: London to where it crossed the limb, then on to his key while the key is still outside the disc
  wirePaths.push(`M${b43(LEAD_X)}L${b43(london)}`);
  if (!insideDisc(opKey)) wirePaths.push(`M${b43(opKey)}L${b43(LEAD_X)}`);
  for (const p of LISTENERS) {
    const start = routeExit(routeById(p.route ?? "").path, rot).lonlat;
    const plug0 = plugAt(p, { x: p.x, y: p.y });
    const plug = plugAt(p, personAt(p, frame));
    const d = Math.hypot(plug0.x - GLOBE_X, plug0.y - GLOBE_Y);
    const rimXY = { x: GLOBE_X + ((plug0.x - GLOBE_X) / d) * GLOBE_R * 0.994, y: GLOBE_Y + ((plug0.y - GLOBE_Y) / d) * GLOBE_R * 0.994 };
    const rimLL = world.invert([rimXY.x, rimXY.y]) as [number, number];
    const leg: [number, number][] = [start, rimLL];
    wirePaths.push(geoD(proj, wirePartial(leg, wireLength(leg) + 10).line));
    if (!insideDisc(plug)) wirePaths.push(`M${b43(rimXY)}L${b43(plug)}`);
  }

  // -- the skin
  const arcs = covered(frame);
  const full = arcs.length === 1 && arcs[0][1] - arcs[0][0] >= 359.9;
  const lifts = Array.from({ length: LINES }, (_, i) => liftT(frame, i));
  const anyLift = lifts.some((t) => t > 0);
  // the wash goes with the lines: a gap opens from the top as far round as the lifting lines have left
  const washGap = Math.max(0, ...lifts.map((t, i) => departFrom(i, shape) * smooth(t * 1.4)));
  const washArcs: [number, number][] = [];
  for (const [a, b] of full ? ([[0, 360]] as [number, number][]) : arcs) {
    if (washGap <= 0) {
      washArcs.push([a, b]);
      continue;
    }
    // keep [a, b] minus (90 - gap, 90 + gap) (and the same window a turn on)
    const cuts: [number, number][] = [[90 - washGap, 90 + washGap], [450 - washGap, 450 + washGap]];
    let pieces: [number, number][] = [[a, b]];
    for (const [c0, c1] of cuts) {
      const next: [number, number][] = [];
      for (const [p0, p1] of pieces) {
        if (c1 <= p0 || c0 >= p1) next.push([p0, p1]);
        else {
          if (c0 > p0) next.push([p0, c0]);
          if (c1 < p1) next.push([c1, p1]);
        }
      }
      pieces = next;
    }
    washArcs.push(...pieces);
  }
  // contour lines: covered arcs, minus each line's lifted top span once its lift has begun
  const linePaths: string[] = [];
  for (let i = 0; i < LINES - 1; i++) {
    const phi = departFrom(i, shape);
    const lifted = lifts[i] > 0;
    for (const [a, b] of covered(frame - i * LINE_LAG)) {
      if (!lifted) {
        linePaths.push(arcD(lineR(i), a, b));
        continue;
      }
      // the top span [90 - phi, 90 + phi] is replaced by the lifted curve
      const segs: [number, number][] = [];
      const lo = 90 + phi;
      const hi = 90 - phi + 360;
      const ka = Math.max(a, lo);
      const kb = Math.min(b, hi);
      if (kb > ka) segs.push([ka, kb]);
      const ka2 = Math.max(a, lo - 360);
      const kb2 = Math.min(b, hi - 360);
      if (kb2 > ka2) segs.push([ka2, kb2]);
      for (const [s0, s1] of segs) linePaths.push(arcD(lineR(i), s0, s1));
    }
  }
  const liftPaths: string[] = [];
  if (anyLift) {
    for (let i = 0; i < LINES; i++) {
      if (lifts[i] <= 0) continue;
      const right = liftSide(i, 1, lifts[i], shape);
      const left = liftSide(i, -1, lifts[i], shape);
      liftPaths.push(poly([...right, ...left.slice(0, -1).reverse()]));
    }
  }
  // 43's ring: its own weight where the skin has not reached it, thinning to a contour line's weight behind the front
  const ringArcs = covered(frame - (LINES - 1) * LINE_LAG);
  const ringOuter: { x: number; y: number }[] = [];
  const ringInner: { x: number; y: number }[] = [];
  const ringPhi = departFrom(LINES - 1, shape);
  const ringLifted = lifts[LINES - 1] > 0;
  const ringSegs: { x: number; y: number }[][] = [];
  for (let k = 0; k <= 720; k++) {
    const th = k * 0.5;
    const inTop = ringLifted && th > 90 - ringPhi && th < 90 + ringPhi;
    if (inTop) {
      if (ringOuter.length) {
        ringSegs.push([...ringOuter, ...ringInner.reverse()]);
        ringOuter.length = 0;
        ringInner.length = 0;
      }
      continue;
    }
    const depth = coverDepth(ringArcs, th);
    const w = RING_W - (RING_W - LINE_W) * smooth(depth / 16);
    ringOuter.push(pt(RING_R + w / 2, th));
    ringInner.push(pt(RING_R - w / 2, th));
  }
  if (ringOuter.length) ringSegs.push([...ringOuter, ...ringInner.reverse()]);
  const ringD = ringSegs.map((s) => `${poly(s, B43.x, B43.y)}Z`).join(" ");

  // -- the point: the lifted lines' ink pools where they meet
  const pointGrow = interpolate(frame, [LIFT_START + LIFT_DUR - 8, 119], [0.12, 1], { ...clamp, easing: paperEase });
  const showPoint = lifts[0] > 0.97 || frame >= LIFT_START + LIFT_DUR - 8;

  const teil = teilAt(frame);

  return (
    <>
      <WipFilmLife frame={F43 + 1 + frame}>
        <PaperGround cam={cam} />
        {/* the skin's wash and lines, and 43's ring: under the people, who stand behind the globe */}
        <WipPlane cam={cam} ink>
          {arcs.length > 0 ? (
            <div style={{ position: "absolute", left: 0, top: 0, opacity: WASH }}>
              <InkPrint x={BX} y={BY} w={BW} h={BH} ink={RED} seed="skin73" rough={1.2} wear={0.45} misregister={0}>
                <svg width={BW} height={BH} style={{ position: "absolute", left: 0, top: 0 }}>
                  {washArcs.map(([a, b], i) => (
                    <path key={i} d={annulusD(R_IN, RING_R, a, b)} fill="currentColor" fillRule="evenodd" />
                  ))}
                </svg>
              </InkPrint>
            </div>
          ) : null}
          <InkLines x={BX} y={BY} w={BW} h={BH} ink={RED} seed="skinlines73" rough={0.7} misregister={0.6}>
            {linePaths.length ? <path d={linePaths.join(" ")} fill="none" stroke="currentColor" strokeWidth={LINE_W} strokeLinejoin="round" /> : null}
            {liftPaths.length ? <path d={liftPaths.join(" ")} fill="none" stroke="currentColor" strokeWidth={LINE_W} strokeLinejoin="round" /> : null}
          </InkLines>
          <InkLines x={B43.x} y={B43.y} w={B43.w} h={B43.w} ink={RED} seed="ring43" rough={1}>
            <path d={ringD} fill="currentColor" />
          </InkLines>
          {showPoint ? <SingularityPoint x={P.x} y={P.y} scale={P_SCALE * pointGrow} /> : null}
        </WipPlane>
        <WipPlane cam={cam} style={{ clipPath: DISC_CLIP }}>
          {[OPERATOR as Person, ...LISTENERS].map((p) => {
            if (slide(frame, SINK_AT[p.id] ?? 0, SINK) >= 1) return null;
            const at = personAt(p, frame);
            return <CutOut key={p.id} src={p.src} x={at.x} y={at.y} w={p.w} aspect={p.aspect} rotate={p.rotate} flipX={p.flipX} border={5} seed={p.id} />;
          })}
          {frame >= TEIL.start ? (
            <CutOut src={TEIL.src} x={teil.x} y={teil.y} w={TEIL.w} aspect={TEIL.aspect} rotate={TEIL.rotate} flipX border={6} seed="teilhard" />
          ) : null}
        </WipPlane>
        <EarthPrint cam={cam} rotate={rot} />
        <WipPlane cam={cam} ink>
          <InkPrint x={B43.x} y={B43.y} w={B43.w} h={B43.w} ink={INDIGO} seed="grat43" rough={0.8} wear={0.3} misregister={0}>
            <svg width={B43.w} height={B43.w} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <path d={geoD(proj, GRATICULE)} fill="none" stroke="currentColor" strokeWidth={1.1} opacity={0.55} />
              <circle cx={GLOBE_X - B43.x} cy={GLOBE_Y - B43.y} r={GLOBE_R} fill="none" stroke="currentColor" strokeWidth={1.6} />
            </svg>
          </InkPrint>
          <InkLines x={B43.x} y={B43.y} w={B43.w} h={B43.w} ink={RED} seed="wires43" rough={0.9}>
            <path d={wirePaths.join(" ")} fill="none" stroke="currentColor" strokeWidth={wireW} strokeLinecap="round" strokeLinejoin="round" />
          </InkLines>
        </WipPlane>
        {/* the Omega, beside the point, in the page's deep ink */}
        <WipPlane cam={cam}>
          <div
            style={{
              position: "absolute",
              left: P.x - 92 / K_END - 60,
              top: P.y - 60 - 10,
              width: 120,
              height: 120,
              textAlign: "center",
              lineHeight: "120px",
              fontFamily: SERIF,
              fontWeight: SERIF_WEIGHT,
              fontSize: 84,
              color: THEMES.mint.ink,
              ...textRise(frame, 108, 14, 18),
            }}
          >
            Ω
          </div>
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
      {mask ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <ellipse cx={540} cy={925} rx={120} ry={135} fill="rgba(90,90,90,0.88)" />
          <rect x={480} y={1000} width={120} height={120} fill="rgba(90,90,90,0.88)" />
          <rect x={115} y={1080} width={885} height={900} rx={160} fill="rgba(90,90,90,0.88)" />
        </svg>
      ) : null}
    </>
  );
};

export default NoosphereOmegaPoint;
