import { Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
import {
  ACCENT,
  ACCENT_DEEP,
  clamp01,
  iconShadow,
  makeTone,
  smoothstep,
  squirclePath,
} from "./fieldShared";

// ---------------------------------------------------------------------------
// THE WORLD of `Noam_Alignment_Degradation` v2 — five cuts, ONE tower.
//
//   "we make them, we make them, we think what we think is aligned, and then we
//    use these models to help us with the next generation of models ... each
//    subsequent generation actually we see an increasing degradation in
//    alignment ... in the long run they end up going in a direction of
//    increasing misalignment from humans. ... every generation of models we're
//    able to make more and more aligned."
//
// What things MEAN (every cut, no exceptions):
//   * ORANGE = THE MODELS. One generation = one SLAB, a solid orange squircle
//     slab. Two tones, never transparency: ACCENT (ripe) = the slab the
//     mechanism is acting on right now, ACCENT_DEEP = a slab at rest. The ripe
//     tone is a BATON: it passes from parent to child as the child lands
//     (`toneBaton`).
//   * WHITE = US. Three `person.png` glyphs on a short ground line (`Humans`),
//     and the PLUMB LINE rising straight up out of the middle person's head —
//     our idea of "aligned" (`PlumbLine`). Ink ladder INK_HI / INK_LO.
//   * THE ONE MECHANISM. Every generation is born the same way: a copy slides up
//     OUT of its parent (starts coincident, drawn behind it) and settles on the
//     parent's top face, inheriting the parent's tilt and adding its own small
//     error (`ERR`). The error compounds, so the tower curves away from the
//     plumb line. Every pose is forward kinematics off its parent
//     (`childPose` / `towerPoses`); nothing is placed by a timer.
//
// Coordinates are WORLD px (= screen px at k = 1), y down. A pose is the slab's
// BOTTOM-CENTRE point plus an angle θ in DEGREES, clockwise positive — so a
// positive θ leans the tower to the RIGHT.
//
// Layering inside a cut's world <div> (translate(tx,ty) scale(k)):
//   <Tower .../>   = slab <svg>  ->  Humans (DOM <Img>)  ->  plumb-line <svg>
//   then a cut's own <svg> for Measure / anything else, then Labels (DOM).
// person.png is a Remotion <Img> (DOM), never an SVG <image> on staticFile —
// that races frame capture and flashes. So Humans and Label are DOM siblings
// of the svgs, never children of one.
//
// Numbers verified by $S/towerShared/verify.ts (2026-09-22):
//   after gen 2 : top θ 1.50°,  top-slab centre +6.8 px right of LINE_X
//   after gen 8 : top θ 19.49°, top-slab centre +124.2 px
//   after gen 16: top θ 50.64°, top-slab centre +531.8 px
//   landed wedge (left gap / right gap): gen 2 19.9/12, gen 4 26.3/12,
//     gen 8 29.9/12, gen 16 34.0/12 — no interpenetration anywhere, and none
//     during any birth once the child's error comes in (min clearance 5.9 px)
//   bent 16 bounds x 390..1189, y 204..1384; straight 16 x 390..690, y 276..1384
//   sway: 0.0025° at gen 2, 0.57° summed at the top of the bent 16 tower
//     (top-slab excursion 3.7 px, ≤ 0.28 px/f), exactly 0 when straight.
// ---------------------------------------------------------------------------

export const FPS = 24;

// The grid backdrop's settings for this set (fieldShared's GridBackground takes
// them as props). One set of values so five cuts cannot drift apart.
export const BG_SRC = "grid-background.jpg";
export const BG_BLUR = 13;
export const BG_PARALLAX = 0.15;

// ---------------------------------------------------------------------------
// INK. White, two rungs. INK_HI = the subject (people, plumb line, measure, a
// label being said). INK_LO = context (ground line, a label already said).
// ---------------------------------------------------------------------------
export const INK = "#FFFFFF";
export const INK_HI = 1;
export const INK_LO = 0.55;
/** ONE stroke weight for the whole piece, world px: plumb line, ground, measure. */
export const STROKE = 5;

// ---------------------------------------------------------------------------
// GEOMETRY.
// ---------------------------------------------------------------------------
export const LINE_X = 540;
export const GROUND_Y = 1500;
export const GROUND_W = 440;

/** person.png's BOX, world px (the house size; its ink is 432/512 = 0.84 of
 *  the box, inset 40/512 on every side). */
export const PERSON_H = 118;
const PERSON_INSET = (PERSON_H * 40) / 512;
/** The glyph's INK height (head top to shoulder base). */
export const PERSON_INK = PERSON_H - 2 * PERSON_INSET;
/** The three people's centre x. */
export const PERSON_XS = [LINE_X - 112, LINE_X, LINE_X + 112] as const;
/** The people's ink stands ON the ground line (its top edge). */
export const PERSON_FOOT_Y = GROUND_Y - STROKE / 2;
/** The top of the middle person's head (ink), world y. */
export const HEAD_TOP_Y = PERSON_FOOT_Y - PERSON_INK;

export const SLAB_W = 300;
export const SLAB_H = 58;
export const GAP = 12;
export const PITCH = SLAB_H + GAP; // 70
/** Corner radius ≈ 12 world px, as squirclePath's ratio of the shorter side. */
export const SLAB_RADIUS = 12;
const SLAB_PATH = squirclePath(SLAB_W, SLAB_H, SLAB_RADIUS / SLAB_H);

/** Generation 1's bottom edge: 14 px of air above the heads. (The brief's
 *  GROUND_Y - PERSON_H - 14 assumed the box's top is the head; the glyph's ink
 *  starts 9 px lower, so this keeps the brief's 14 px of air instead.) */
export const SEAT_Y = Math.round(HEAD_TOP_Y - 14); // 1384
/** The plumb line: from just inside the middle head, straight up to here. */
export const PLUMB_Y0 = HEAD_TOP_Y + 6;
export const LINE_TOP_Y = SEAT_Y - 19 * PITCH; // 54

export const N_GEN = 16;

// ---------------------------------------------------------------------------
// POSES.
// ---------------------------------------------------------------------------
export type Pose = {
  /** bottom-centre x, world px */
  x: number;
  /** bottom-centre y, world px */
  y: number;
  /** degrees, clockwise positive (leans right) */
  theta: number;
};

const rad = (d: number) => (d * Math.PI) / 180;
/** The slab's up-axis (unit), screen coords. */
export const upAxis = (theta: number) => ({ x: Math.sin(rad(theta)), y: -Math.cos(rad(theta)) });
/** The slab's right-axis (unit), screen coords. */
export const rightAxis = (theta: number) => ({ x: Math.cos(rad(theta)), y: Math.sin(rad(theta)) });

/** Generation 1, seated and exactly aligned. */
export const GEN1_POSE: Pose = { x: LINE_X, y: SEAT_Y, theta: 0 };
/** The "parent" of generation 1: the row of humans. A slab here sits behind
 *  the people's torsos; generation 1 rises out of it above their heads. */
export const HUMANS_POSE: Pose = { x: LINE_X, y: GROUND_Y - 40, theta: 0 };

/** The centre of a slab (the point a Measure or a label should use). */
export const slabCentre = (p: Pose) => {
  const u = upAxis(p.theta);
  return { x: p.x + (SLAB_H / 2) * u.x, y: p.y + (SLAB_H / 2) * u.y };
};

/** The four corners: bottom-left, bottom-right, top-right, top-left. */
export const slabCorners = (p: Pose) => {
  const u = upAxis(p.theta);
  const r = rightAxis(p.theta);
  const at = (a: number, b: number) => ({
    x: p.x + a * r.x + b * u.x,
    y: p.y + a * r.y + b * u.y,
  });
  return [at(-SLAB_W / 2, 0), at(SLAB_W / 2, 0), at(SLAB_W / 2, SLAB_H), at(-SLAB_W / 2, SLAB_H)];
};

/** World-space bounds of a set of slabs (their corners). */
export const towerBounds = (poses: Pose[]) => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of poses) {
    for (const c of slabCorners(p)) {
      minX = Math.min(minX, c.x);
      maxX = Math.max(maxX, c.x);
      minY = Math.min(minY, c.y);
      maxY = Math.max(maxY, c.y);
    }
  }
  return { minX, maxX, minY, maxY };
};

/** A slab seated on the parent's top face with GAP, no error of its own:
 *  the parent's tilt, its bottom-centre PITCH up the parent's up-axis. */
export const seatOn = (parent: Pose): Pose => {
  const u = upAxis(parent.theta);
  return { x: parent.x + PITCH * u.x, y: parent.y + PITCH * u.y, theta: parent.theta };
};

/** Apply an error to an un-erred pose: slide `slip` px right along its own
 *  right-axis, then rotate by `rot` degrees about its BOTTOM-RIGHT corner (the
 *  low side), so the left edge lifts and a WEDGE opens on the left. Nothing
 *  interpenetrates the slab below for rot ≥ 0. */
export const applyError = (base: Pose, rot: number, slip: number): Pose => {
  const r0 = rightAxis(base.theta);
  const bx = base.x + slip * r0.x;
  const by = base.y + slip * r0.y;
  const cx = bx + (SLAB_W / 2) * r0.x;
  const cy = by + (SLAB_W / 2) * r0.y;
  const theta = base.theta + rot;
  const r1 = rightAxis(theta);
  return { x: cx - (SLAB_W / 2) * r1.x, y: cy - (SLAB_W / 2) * r1.y, theta };
};

// ---------------------------------------------------------------------------
// ERR — each generation's own error, index 1..16 (ERR[0] unused, ERR[1] = the
// aligned first generation). Strictly increasing in both rot and slip from
// i = 2, so the error COMPOUNDS twice over: each child adds a bigger error, on
// top of every error it inherited.
//   rot_i  = 1.5 + 0.94 · (i − 2)^0.4   degrees
//   slip_i = 6 + 0.15 · (i − 2)         world px
// Solved (verify.ts) to: gen 2 θ 1.5° / +6.8 px ("99.8 %", close-up only),
// gen 8 θ 19.5° / +124 px, gen 16 θ 50.6° / +532 px.
// ---------------------------------------------------------------------------
export type Err = { rot: number; slip: number };
export const ERR: Err[] = Array.from({ length: N_GEN + 1 }, (_, i) =>
  i < 2
    ? { rot: 0, slip: 0 }
    : {
        rot: Number((1.5 + 0.94 * Math.pow(i - 2, 0.4)).toFixed(4)),
        slip: Number((6 + 0.15 * (i - 2)).toFixed(4)),
      },
);

/** Generation i's landed pose on its parent. `e` scales its own error (1 =
 *  full, 0 = straight); `extraRot` adds a rotation about the same corner (the
 *  sway). */
export const childPose = (parent: Pose, i: number, e: number = 1, extraRot: number = 0): Pose =>
  applyError(seatOn(parent), (ERR[i]?.rot ?? 0) * e + extraRot, (ERR[i]?.slip ?? 0) * e);

// ---------------------------------------------------------------------------
// SWAY — the hold motion, and it is motivated: a misaligned tower is unstable.
// A tiny extra rotation per slab about the same bottom-right corner, amplitude
// ∝ the slab's own lean (so it grows with height AND with the tower's bend, and
// is exactly zero when the tower is straight), phase lagging up the tower so it
// flexes rather than rocking as one board. Deterministic in `frame`.
// ≤ 0.12° at gen 2 (it is 0.0025°), 0.57° summed at the top of the bent tower.
// ---------------------------------------------------------------------------
export const SWAY_PERIOD = 84;
export const SWAY_GAIN = 0.00165; // degrees of sway per degree of lean
export const SWAY_LAG = 1.2; // frames of phase lag per generation

export const swayRot = (i: number, frame: number, lean: number) =>
  SWAY_GAIN * lean * Math.sin((2 * Math.PI * (frame - i * SWAY_LAG)) / SWAY_PERIOD);

/** Poses of generations 1..n, fully landed (index 0 = generation 1).
 *  `e(i)` = generation i's error scale (default 1; cut 5 drives it to 0).
 *  `swayFrame` = add the sway at this frame (omit for none). */
export const towerPoses = (
  n: number,
  opts: { e?: (i: number) => number; swayFrame?: number } = {},
): Pose[] => {
  const out: Pose[] = [];
  if (n < 1) return out;
  let p = GEN1_POSE;
  let lean = 0; // the un-swayed tilt, which sets the sway's amplitude
  out.push(p);
  for (let i = 2; i <= n; i++) {
    const e = opts.e ? opts.e(i) : 1;
    lean += (ERR[i]?.rot ?? 0) * e;
    const s = opts.swayFrame === undefined ? 0 : swayRot(i, opts.swayFrame, lean);
    p = childPose(p, i, e, s);
    out.push(p);
  }
  return out;
};

// ---------------------------------------------------------------------------
// BIRTH. The child starts COINCIDENT with its parent (callers draw it behind
// the parent, which `Tower` does), rises along the parent's up-axis on an
// ARRIVE ease, and its own error comes in over the last BIRTH_ERR_SPAN of the
// birth, so it visibly lands off.
// ---------------------------------------------------------------------------
/** Arrive ease: 1 − (1−u)^4 (1+4u). Zero velocity at both ends, peak speed at
 *  u = 0.25 (most of the travel early), a long soft cubic deceleration into
 *  the seat. Monotonic — no overshoot, no spring. */
export const birthEase = (u: number) => {
  const x = clamp01(u);
  return 1 - Math.pow(1 - x, 4) * (1 + 4 * x);
};
export const BIRTH_ERR_SPAN = 0.4;
/** How much of the child's own error is in at birth progress u. */
export const birthErrorIn = (u: number) => smoothstep((u - (1 - BIRTH_ERR_SPAN)) / BIRTH_ERR_SPAN);

/** The child's pose at birth progress u ∈ [0,1]. `parentPose` is where the
 *  parent is now (HUMANS_POSE for generation 1); `childFinalPose` is where the
 *  child lands (from `childPose` / `towerPoses`, sway and all). The rise
 *  distance, the slip and the extra rotation are all recovered from those two
 *  poses, so birthPose(…, 1) === childFinalPose exactly. */
export const birthPose = (parentPose: Pose, childFinalPose: Pose, u: number): Pose => {
  const rot = childFinalPose.theta - parentPose.theta;
  const up = upAxis(parentPose.theta);
  const rp = rightAxis(parentPose.theta);
  const rc = rightAxis(childFinalPose.theta);
  // undo the rotation about the final bottom-right corner
  const cx = childFinalPose.x + (SLAB_W / 2) * rc.x;
  const cy = childFinalPose.y + (SLAB_W / 2) * rc.y;
  const b0x = cx - (SLAB_W / 2) * rp.x - parentPose.x;
  const b0y = cy - (SLAB_W / 2) * rp.y - parentPose.y;
  const rise = b0x * up.x + b0y * up.y;
  const slip = b0x * rp.x + b0y * rp.y;
  const s = birthEase(u);
  const g = birthErrorIn(u);
  const base: Pose = {
    x: parentPose.x + s * rise * up.x,
    y: parentPose.y + s * rise * up.y,
    theta: parentPose.theta,
  };
  return applyError(base, g * rot, g * slip);
};

/** LANDING SETTLE: a downward offset (world px, ≥ 0) for the whole stack of
 *  slabs (not the humans) after a child lands. Peaks at 3 px on frame ~2.7
 *  and recovers smoothly over 8 f, no bounce. 0 before the landing and after. */
export const SETTLE_MAX = 3;
export const SETTLE_FRAMES = 8;
export const settleDip = (framesSinceLanding: number) => {
  const x = framesSinceLanding / SETTLE_FRAMES;
  if (x <= 0 || x >= 1) return 0;
  return SETTLE_MAX * (27 / 4) * x * (1 - x) * (1 - x);
};

/** TONE BATON: tone t for the parent and the child around a landing (1 =
 *  ripe ACCENT, 0 = ACCENT_DEEP). The child is ripe while it rises and stays
 *  ripe; the parent is ripe until the landing and ramps to deep over 8 f. */
export const BATON_FRAMES = 8;
export const toneBaton = (framesSinceLanding: number) => ({
  parent: 1 - smoothstep(framesSinceLanding / BATON_FRAMES),
  child: 1,
});

export const tone = makeTone(ACCENT_DEEP, ACCENT);

// ---------------------------------------------------------------------------
// COMPONENTS. Slab / PlumbLine / Measure are SVG (go inside a world <svg>);
// Humans / Label are DOM (siblings of the svgs in the world <div>); Tower
// composes slab svg -> Humans -> plumb svg.
// ---------------------------------------------------------------------------

/** A full-frame world <svg> (overflow visible) to put SVG pieces in. */
export const WorldSvg: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <svg
    width={1080}
    height={1920}
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
  >
    {children}
  </svg>
);

/** One generation. `pose` = bottom-centre + θ; `t` = tone (1 ripe, 0 deep);
 *  `dy` = extra downward offset (settleDip); `occlude` 0..1 = the contact
 *  shadow this slab casts UP its own axis onto a child emerging from behind it
 *  (`Tower` computes it — see `occlusionOf`). Solid, no stroke. The iconShadow
 *  sits on an UN-rotated group so the light is the same screen-down for every
 *  slab whatever its tilt. */
export const OCCLUDE_Y = 2; // screen px, up the parent's axis
export const OCCLUDE_BLUR = 4; // screen px
export const OCCLUDE_OPACITY = 0.45;
export const Slab: React.FC<{ pose: Pose; t: number; k: number; dy?: number; occlude?: number }> = ({
  pose,
  t,
  k,
  dy = 0,
  occlude = 0,
}) => (
  <g style={{ filter: iconShadow(k) }}>
    <g
      transform={`translate(${pose.x.toFixed(3)} ${(pose.y + dy).toFixed(3)}) rotate(${pose.theta.toFixed(
        4,
      )}) translate(${-SLAB_W / 2} ${-SLAB_H})`}
      style={
        occlude > 0.001
          ? {
              filter: `drop-shadow(0 ${(-OCCLUDE_Y / k).toFixed(3)}px ${(OCCLUDE_BLUR / k).toFixed(
                3,
              )}px rgba(0,0,0,${(OCCLUDE_OPACITY * clamp01(occlude)).toFixed(3)}))`,
            }
          : undefined
      }
    >
      <path d={SLAB_PATH} fill={tone(t)} />
    </g>
  </g>
);

/** How much contact shadow a parent casts onto a child rising out of it: 0
 *  when coincident (nothing of the child shows yet), 1 while the child is
 *  part-way out, back to 0 before the child's bottom clears the parent's top
 *  face (so it never darkens the field in the gap). Pure, from the two poses. */
export const occlusionOf = (parent: Pose, child: Pose) => {
  const u = upAxis(parent.theta);
  const d = (child.x - parent.x) * u.x + (child.y - parent.y) * u.y;
  return smoothstep(d / 8) * smoothstep((SLAB_H - d) / 10);
};

/** The plumb line: our idea of "aligned". From just inside the middle head
 *  (PLUMB_Y0) straight up to LINE_TOP_Y, growing upward with `draw` 0..1. */
export const PlumbLine: React.FC<{ k: number; draw?: number; opacity?: number }> = ({
  k,
  draw = 1,
  opacity = INK_HI,
}) => {
  const d = clamp01(draw);
  if (d <= 0) return null;
  const y1 = PLUMB_Y0 + (LINE_TOP_Y - PLUMB_Y0) * d;
  return (
    <line
      x1={LINE_X}
      y1={PLUMB_Y0}
      x2={LINE_X}
      y2={y1}
      stroke={INK}
      strokeWidth={STROKE}
      strokeLinecap="round"
      opacity={opacity}
      style={{ filter: iconShadow(k) }}
    />
  );
};

/** The measure: a horizontal white line at world `y` from the plumb line
 *  (LINE_X) to `x2`, with TICK-px end ticks. Draws on from the plumb-line end:
 *  start tick, then the line, then the end tick. */
export const MEASURE_TICK = 22;
export const Measure: React.FC<{
  k: number;
  y: number;
  x2: number;
  draw?: number;
  opacity?: number;
}> = ({ k, y, x2, draw = 1, opacity = INK_HI }) => {
  const d = clamp01(draw);
  if (d <= 0) return null;
  const t0 = smoothstep(d / 0.15);
  const run = smoothstep((d - 0.1) / 0.78);
  const t1 = smoothstep((d - 0.85) / 0.15);
  const xe = LINE_X + (x2 - LINE_X) * run;
  const h = MEASURE_TICK / 2;
  return (
    <g
      stroke={INK}
      strokeWidth={STROKE}
      strokeLinecap="round"
      opacity={opacity}
      style={{ filter: iconShadow(k) }}
    >
      {t0 > 0 ? <line x1={LINE_X} y1={y - h * t0} x2={LINE_X} y2={y + h * t0} /> : null}
      {run > 0 ? <line x1={LINE_X} y1={y} x2={xe} y2={y} /> : null}
      {t1 > 0 ? <line x1={x2} y1={y - h * t1} x2={x2} y2={y + h * t1} /> : null}
    </g>
  );
};

/** US: three white person.png glyphs standing on a short ground line.
 *  DOM (Remotion <Img>) — a sibling of the svgs in the world div.
 *  `opacity` = the people (INK_HI), `groundOpacity` = the line (INK_LO),
 *  `groundDraw` 0..1 grows the ground line out from its centre. */
export const Humans: React.FC<{
  k: number;
  opacity?: number;
  groundOpacity?: number;
  groundDraw?: number;
}> = ({ k, opacity = INK_HI, groundOpacity = INK_LO, groundDraw = 1 }) => {
  const g = clamp01(groundDraw);
  const half = (GROUND_W / 2) * g;
  const boxTop = PERSON_FOOT_Y + PERSON_INSET - PERSON_H;
  return (
    <>
      {g > 0 ? (
        <svg
          width={1080}
          height={1920}
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          <line
            x1={LINE_X - half}
            y1={GROUND_Y}
            x2={LINE_X + half}
            y2={GROUND_Y}
            stroke={INK}
            strokeWidth={STROKE}
            strokeLinecap="round"
            opacity={groundOpacity}
            style={{ filter: iconShadow(k) }}
          />
        </svg>
      ) : null}
      {PERSON_XS.map((x) => (
        <Img
          key={x}
          src={staticFile("person.png")}
          style={{
            position: "absolute",
            left: x - PERSON_H / 2,
            top: boxTop,
            width: PERSON_H,
            height: PERSON_H,
            opacity,
            filter: `brightness(0) invert(1) ${iconShadow(k)}`,
          }}
        />
      ))}
    </>
  );
};

/** The tower, in the right z-order: higher generations BEHIND lower ones (so a
 *  child being born emerges from behind its parent), generation 1 behind the
 *  humans (it rises out from behind their torsos), the plumb line above all.
 *  `slabs[0]` = generation 1: { pose, t } per slab. `dy` = settleDip for the
 *  whole stack. `showHumans` false to draw Humans yourself. */
export const Tower: React.FC<{
  k: number;
  slabs: { pose: Pose; t: number }[];
  plumbDraw?: number;
  plumbOpacity?: number;
  dy?: number;
  showHumans?: boolean;
  humansOpacity?: number;
  groundOpacity?: number;
  groundDraw?: number;
}> = ({
  k,
  slabs,
  plumbDraw = 1,
  plumbOpacity = INK_HI,
  dy = 0,
  showHumans = true,
  humansOpacity = INK_HI,
  groundOpacity = INK_LO,
  groundDraw = 1,
}) => (
  <>
    <WorldSvg>
      {slabs
        .map((s, i) => (
          <Slab
            key={i}
            pose={s.pose}
            t={s.t}
            k={k}
            dy={dy}
            occlude={i + 1 < slabs.length ? occlusionOf(s.pose, slabs[i + 1].pose) : 0}
          />
        ))
        .reverse()}
    </WorldSvg>
    {showHumans ? (
      <Humans k={k} opacity={humansOpacity} groundOpacity={groundOpacity} groundDraw={groundDraw} />
    ) : null}
    <WorldSvg>
      <PlumbLine k={k} draw={plumbDraw} opacity={plumbOpacity} />
    </WorldSvg>
  </>
);

// ---------------------------------------------------------------------------
// TYPE. Roboto Condensed Bold, ALL CAPS, tracked 0.04 em, white — loaded at
// module scope so a font failure surfaces before a frame is drawn. The size is
// SCREEN px (default 40): pass k and it is divided out, so a label stays
// legible when the camera is wide. Never pops: slides up LABEL_RISE screen px
// while fading in over LABEL_IN frames from `inFrame`; with `outFrame` it does
// the reverse (slides down 24 while fading out). DOM — goes in the world div.
// ---------------------------------------------------------------------------
const LABEL_FONT = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
export const FONT_LABEL = LABEL_FONT.fontFamily;
export const LABEL_PX = 40;
export const LABEL_RISE = 24;
export const LABEL_IN = 10;

/** 0..1 visibility of a label at `frame` (the same curve Label uses). */
export const labelT = (frame: number, inFrame: number, outFrame?: number) => {
  const a = smoothstep((frame - inFrame) / LABEL_IN);
  const b = outFrame === undefined ? 1 : 1 - smoothstep((frame - outFrame) / LABEL_IN);
  return Math.min(a, b);
};

export const Label: React.FC<{
  k: number;
  frame: number;
  text: string;
  /** anchor point, world px; y is the text's vertical centre */
  x: number;
  y: number;
  inFrame: number;
  outFrame?: number;
  /** screen px */
  size?: number;
  opacity?: number;
  anchor?: "left" | "right" | "centre";
}> = ({ k, frame, text, x, y, inFrame, outFrame, size = LABEL_PX, opacity = INK_HI, anchor = "centre" }) => {
  const a = smoothstep((frame - inFrame) / LABEL_IN);
  const leaving = outFrame !== undefined && frame > outFrame;
  const b = leaving ? 1 - smoothstep((frame - outFrame) / LABEL_IN) : 1;
  const t = Math.min(a, b);
  if (t <= 0) return null;
  // entering: comes up from +24 below; leaving: goes down to +24 below
  const off = (leaving ? 1 - b : 1 - a) * (LABEL_RISE / k);
  const tx = anchor === "left" ? "0%" : anchor === "right" ? "-100%" : "-50%";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + off,
        transform: `translate(${tx}, -50%)`,
        fontFamily: FONT_LABEL,
        fontWeight: 700,
        fontSize: size / k,
        lineHeight: 1,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: INK,
        opacity: opacity * t,
        whiteSpace: "nowrap",
        filter: iconShadow(k),
      }}
    >
      {text}
    </div>
  );
};
