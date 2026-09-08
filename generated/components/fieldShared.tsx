import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";

// ---------------------------------------------------------------------------
// What the three "secret AI societies" cuts share. They are cut into one edit
// seconds apart, so everything that decides how the field LOOKS lives here:
// the ladder, the idle traffic, the camera's damping, the background, the
// vignette. A piece decides what happens; this file decides what it is made of.
// ---------------------------------------------------------------------------

export const FRAME_W = 1080;
export const FRAME_H = 1920;
export const BG_OVERSIZE = 1.8;

// Mono plus one accent, and the accent comes in two tones of the same hue.
// Every piece takes both as props and defaults to these, so the three cuts
// cannot drift apart in the edit.
//
// Ripe pass, on the director's note that the yellow looked "pale from being out
// in the sun too long" and that the transparency was part of it: an agent dot
// is now SOLID, and its state is carried by colour alone — deep for an unread
// dot, ripe for a lit one. Everything that is a line (threads, tips, converted
// rings and edges, provenance) takes the ripe tone at its own line opacity.
export const ACCENT = "#FFB000"; // ripe: a lit dot, and every accent line
export const ACCENT_DEEP = "#D98A0C"; // deep: an unread dot, the same hue a shade down

// The opacity ladder. Every agent, ash line, floor or mark sits on one rung.
export const OP_UNREAD = 0.45; // present, not the subject
// The dot rungs. An agent dot no longer carries its state as transparency: a
// dot is opaque whatever it knows, because the accent over the grid at any
// opacity below 1 desaturates into the field and reads as a wash. Both rungs
// are 1.0 and the unread -> lit ladder is ACCENT_DEEP -> ACCENT instead. They
// stay named because a piece still multiplies the dot body by its own arrival
// fade, and that fade starts from this rung.
export const OP_UNREAD_DOT = 1.0; // an unread dot is solid, in the deep tone
export const OP_READ_DOT = 1.0; // a lit dot is solid, in the ripe tone
export const OP_READ = 0.9; // the subject; +0.1 when a thread is on it
export const OP_RECEDE = 0.3; // was the subject, is not any more
export const OP_DARK = 0.16; // wiped, or unlooked-at

// The grid backdrop's exposure. Shared, because the three cuts are seconds
// apart in one edit and a field that moves between them reads as a mistake.
// Brightened from 0.32 to 0.42 on the director's note that the dots had too
// little contrast against the background. Measured on cut 1 f156: the field
// goes #525252 -> #6B6B6B (L* 34.9 -> 45.2) and the grid's own lines, which
// were nearly gone at 0.32, come back (line contrast 1.127 -> 1.163). It is
// the brightest step that still keeps white line-work above 4:1 against the
// field and still leaves the accent dots a real lightness step above it. That
// margin was measured back when a dot was part-transparent and therefore part
// field. It is not any more: a dot is opaque, so it is exactly ACCENT_DEEP or
// ACCENT over this field whatever the field is doing, and the separation is
// fixed by the palette rather than by this number.
//
// Lifted again from 0.42 to 0.45 on the director's note that the background
// wanted to be brighter by "an ever so slight tad". 0.44, 0.45 and 0.46 were
// rendered side by side on cut 1 f156: 0.44 is at the threshold of visible
// (field 106.3 -> 111.1 of 255, dL* +1.96) and 0.45 is the smallest step that
// reads as a step in the full frames (field #6A6A6A -> #727272, L* 44.9 ->
// 48.0). White ink against the field stays at 4.82:1, comfortably over 4:1
// (0.46 is 4.68). The ripe dot #FFB000 loses a little against the lifting
// field as expected — 2.94:1 -> 2.63:1, a 10% drop — and still carries the
// crowd because a dot is opaque and its own colour.
export const BG_BASE = "#232323";
export const BG_DIM = 0.45;

// The one soft drop shadow, for separation from the grid. Shared for the same
// reason BG_DIM is: three cuts seconds apart in one edit. Each piece still
// takes y / blur / opacity as props and defaults to these.
//
// Softened from 2 / 9 / 0.22 on the director's note that the shadows should be
// "a bit more subtle". Measured on cut 2 f90 against a shadow-free render of
// the same frame: the mean darkening in the 6px ring outside the white marks
// falls from 7.3 and 6.6 (of 255) to 3.7 and 3.4 — half the current halo — and
// the shadow's reach shortens from ~13px to ~9px. 2 / 8 / 0.14 only took a
// third off; 1 / 6 / 0.10 took 60% and the marks start reading as pasted flat
// onto the grid. This is where a dot or a line still lifts off the field at
// 1:1 with no dark halo around it at 3x.
export const SHADOW_Y = 2;
export const SHADOW_BLUR = 7;
export const SHADOW_OPACITY = 0.12;

// The per-icon shadow, on the director's note asking for "small shadows like in
// Tailwind" on the icons — the person glyphs, the structure's rings, lines and
// packets, and the two model marks. Not the dots, not the threads, not the seat
// rings: those are the field, and a shadow on ten thousand of them is a haze.
//
// It sits OVER the global shadow above, which is untouched: that one is one
// soft shadow cast by the whole graphic for separation from the grid, this one
// is the small lift that makes an icon read as a thing lying on the field.
//
// Tailwind's own values (`shadow-sm`, 5-10% black) are tuned for a white page
// and vanish on this #727272 field, so the offset and blur are Tailwind's shape
// and the opacity is scaled up until it survives the grey. Every length is
// SCREEN px: an icon lives under the camera's scale(k), so `iconShadow` divides
// by k and the shadow is the same size at every zoom.
export const ICON_SHADOW_Y = 2;
export const ICON_SHADOW_BLUR = 3;
export const ICON_SHADOW_OPACITY = 0.38;

export const iconShadow = (
  k: number,
  y: number = ICON_SHADOW_Y,
  blur: number = ICON_SHADOW_BLUR,
  opacity: number = ICON_SHADOW_OPACITY,
) => `drop-shadow(0 ${(y / k).toFixed(3)}px ${(blur / k).toFixed(3)}px rgba(0,0,0,${opacity}))`;

// Idle thread traffic, per 1,200 agents. A field of a different size scales it.
export const IDLE_THREADS_PER_1200 = 180;
export const idleThreads = (agents: number) => Math.round((IDLE_THREADS_PER_1200 * agents) / 1200);

export const DOT_RADIUS = 5.5;
export const breath = (frame: number, seed: number) => 1 + 0.05 * Math.sin(frame * 0.11 + seed * 6.28);

// No rim. A white outline on every agent dot was tried at 1px and 1.5px and
// removed on the director's note: at field density the rims join up into a pale
// mesh laid over the crowd, which is most of what made the colour look washed
// out. A dot is a disc of one flat colour and nothing else.

export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// The dot ladder, as a colour. `makeTone(deep, ripe)` returns t -> a fill, 0 =
// unread, 1 = lit, quantised to 64 steps and built once per render: a field is
// ten thousand dots and every one of them asks for its colour every frame.
// The mix is in plain sRGB — the two tones are the same hue, so the path
// between them is a lightness ramp and there is nothing for a fancier space to
// fix.
const hexToRgb = (h: string): [number, number, number] => {
  const s = h.replace("#", "");
  const n = parseInt(
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const TONE_STEPS = 64;
export const makeTone = (deep: string, ripe: string) => {
  const a = hexToRgb(deep);
  const b = hexToRgb(ripe);
  const ramp: string[] = [];
  for (let i = 0; i <= TONE_STEPS; i++) {
    const t = i / TONE_STEPS;
    ramp.push(
      `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(
        a[1] + (b[1] - a[1]) * t,
      )},${Math.round(a[2] + (b[2] - a[2]) * t)})`,
    );
  }
  return (t: number) => ramp[Math.round(clamp01(t) * TONE_STEPS)];
};

// ---------------------------------------------------------------------------
// A crowd's edge. A population of agents never ends on a ruled line — that
// reads as a box of agents someone drew — so every crowd boundary in these
// pieces is (a) undulating and (b) feathered: density falls off toward it and
// the dots that do survive out there are smaller.
//
// `feather(insideSteps)` takes a seat's signed distance to the crowd's nominal
// boundary, measured in grid steps (negative = outside), and returns 0..1: the
// chance the seat exists, and the scale of its radius. A seat exists if
// hash(i, 71) < feather(d); its radius is scaled by 0.7 + 0.3 * feather(d).
//
// `wobble(along, seed)` offsets that nominal boundary, in steps, as a function
// of position ALONG it (world px — x for a straight edge, theta * 100 for a
// closed one, which keeps both harmonics whole around the loop so there is no
// seam at theta = pi).
// ---------------------------------------------------------------------------
export const FEATHER_STEPS = 4;
export const feather = (insideSteps: number, width: number = FEATHER_STEPS) =>
  clamp01(smoothstep(insideSteps / width));
export const wobble = (along: number, seed: number) =>
  1.2 * Math.sin(along * 0.05 + seed) + 0.7 * Math.sin(along * 0.13 + seed * 2.1);
// For a closed boundary: the `along` that makes wobble periodic in theta.
export const WOBBLE_R = 100;

// The camera: authored keys, followed by a damped second-order tracker so a
// move is a short ramp that settles ahead of its word. Same constants in every
// piece, so a pull-back feels the same weight everywhere.
export const CAM_STIFF = 0.09;
export const CAM_DAMP = 0.468;

export const runCamera = (upto: number, F: number[], CY: number[], K: number[]) => {
  let cy = CY[0];
  let k = K[0];
  let vy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tk = interpolate(f, F, K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

// Authoring a move for that camera. The damper is only ever as smooth as the
// target it is handed, and a coarse key track hands it a bad one: a segment
// longer than ~20 frames interpolated linearly is a corner at each key with a
// straight line in between, so the move lurches in, then crawls at a constant
// speed, then stops. Measured on the three cuts of this clip before this pass:
// cut 1's zoom fell to 18% of its own peak speed mid-move and then held one
// speed dead flat for 14 frames; cut 3 held one speed dead flat for 14.
//
// `camMove` writes the move as an eased curve instead. `warp` shapes it: 1 is
// a plain smoothstep, and below 1 it puts the hand's speed earlier in the move
// without giving the profile a corner — the slope is still zero at both ends
// for warp > 0.5, so the damper never sees a step in velocity.
//
// It evaluates that curve at EVERY integer frame from f0 to f1 and emits a key
// for each. Sampling it into a handful of keys and letting `interpolate` join
// them with straight lines puts a corner back into the damper's target at each
// key: the target's own acceleration is a delta at the key and zero between,
// and the damper rings on every one. At 6-8 keys that showed up as five extra
// bumps in the zoom acceleration across each move, ~15% of the peak, spaced
// about seven frames apart — small, but a visible ripple in a slow pull-back.
// A key per frame makes the linear interpolation exact: the target the damper
// sees IS the eased curve, and d2k is a single smooth lobe pair.
//
// It also takes cy from the EASED k rather than interpolating cy between the
// endpoints, which is the other half of the problem: cy = contentCentre +
// CAM_LIFT / k is not linear in k, so a cy keyed only at the ends drifts away
// from its own zoom while the move runs and the whole composition sags and
// recovers. Measured against a content centre put through this same damper —
// the only fair reference, since the whole camera lags — that sag was 6.4px on
// cut 1, 4.8px on cut 2 and 20.7px on cut 3. Taking cy off the eased k takes
// all three under 1.5px.
//
// CAM_LIFT is the framing constant the whole set is built on: a content centre
// at cy - CAM_LIFT / k lands at screen y 960 - 125 = 835, under the captions.
export const CAM_LIFT = 125;

export const camEase = (u: number, warp: number) => smoothstep(Math.pow(clamp01(u), warp));

export const camMove = ({
  f0,
  f1,
  k0,
  k1,
  c0,
  c1,
  warp = 1,
}: {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  warp?: number;
}) => {
  // One key per frame, so `interpolate` never has to guess between two of them.
  // `runCamera` needs a strictly increasing input range, which f0..f1 is by
  // construction as long as the move actually lasts a frame.
  if (f1 <= f0) {
    throw new Error(`camMove: f${f0}-${f1} is not a forward move`);
  }
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const span = f1 - f0;
  for (let i = 0; i <= span; i++) {
    const g = camEase(i / span, warp);
    const k = k0 + (k1 - k0) * g;
    F.push(f0 + i);
    K.push(k);
    CY.push(c0 + (c1 - c0) * g + CAM_LIFT / k);
  }
  return { F, K, CY };
};

// The hand on the camera: the same slow drift in every piece.
export const sway = (frame: number) => ({
  dy: 5 * Math.sin(frame / 19),
  dx: 3 * Math.sin(frame / 23),
});

// Where the world sits on screen for a camera at (cx, cy, k).
export const worldTransform = (cx: number, cy: number, k: number) => ({
  tx: FRAME_W / 2 - cx * k,
  ty: FRAME_H / 2 - cy * k,
});

// The grid, blurred and dimmed, with parallax against the camera and a slow
// drift of its own. `cyRest` is the camera's opening cy; parallax is measured
// from there so the background never jumps at frame 0.
//
// `cx`/`cxRest` are the same thing sideways, and both are OPTIONAL: a piece
// whose camera only tilts passes neither and gets exactly the transform it got
// before they existed, down to the string. A piece that pans passes both and
// the grid travels with it at the same parallax factor, so a lateral move reads
// as depth instead of a locked layer. The element is 1.8x the frame with
// objectFit cover, which at the parallax offsets these pieces reach leaves
// hundreds of px of slack on every side — check it per piece, and only raise
// BG_OVERSIZE if a camera can actually pull an edge in.
export const GridBackground: React.FC<{
  src: string;
  blur: number;
  dim: number;
  frame: number;
  cy: number;
  cyRest: number;
  cx?: number;
  cxRest?: number;
  k: number;
  parallax: number;
}> = ({ src, blur, dim, frame, cy, cyRest, cx, cxRest, k, parallax }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgX = cx === undefined || cxRest === undefined ? 0 : -(cx - cxRest) * k * parallax;
  const shift =
    bgX === 0
      ? `translateY(${bgY.toFixed(2)}px)`
      : `translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px)`;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_W * BG_OVERSIZE,
          height: FRAME_H * BG_OVERSIZE,
          objectFit: "cover",
          transform: `translate(-50%, -50%) ${shift} scale(${bgScale.toFixed(4)})`,
          filter: `blur(${blur}px) brightness(${dim})`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// THE SQUIRCLE. On the client's note: "I want to move away from rounded
// rectangles and use squircles instead. Consistent rounding relative to the
// shapes. Corner smoothing 60% like Apple's guidelines."
//
// Two rules come out of that and they are both here rather than in the pieces:
//   * RELATIVE ROUNDING. A corner's radius is always SQUIRCLE_RATIO of the
//     shape's SHORTER side, so a 32 px tool, a 240 x 160 flag and a 320 px card
//     are all rounded by the same fraction of themselves and read as one family
//     at any zoom. No piece writes an `rx` down any more.
//     CLIENT PASS, on "way too intense — a nice, minimal but still visible
//     radius, not one, two or three pixels, something stylish": the ratio came
//     down 0.2 -> 0.11, and a SQUIRCLE_MIN floor of 5 world px keeps the small
//     shapes from rounding away to nothing.
//     CLIENT PASS 2, on "the corners are still way too rounded": 0.11 -> 0.06.
//     The floor stays at 5 and the smoothing stays at 0.6, so the small shapes
//     do not move at all and the big ones lose roughly half their corner again
//     — 240 x 160 flag 17.6 -> 9.6, 320 card 35.2 -> 19.2, cut 1's 384 x 256
//     flag 28.2 -> 15.4.
//     CLIENT PASS 3, on "it should be really minimal — almost look like it
//     isn't rounded, high taste, harmonious with the rest": 0.06 -> 0.025 and
//     the floor 5 -> 3. The smoothing is still 0.6 and the rule is unchanged,
//     so every shape in all three cuts comes down by the same fraction at once
//     — 240 x 160 flag 9.6 -> 4.0, 320 card 19.2 -> 8.0, cut 1's 384 x 256
//     flag 15.4 -> 6.4, and the two shapes already sitting on the floor (the
//     32 px tools, cut 1's 29 px slot) go 5 -> 3 with it. At the resolved
//     zooms that is ~5 screen px on a flag and 3-4 on a tool: the corner is
//     softened rather than drawn. So the rule is
//       r = min(short / 2, max(ratio * short, SQUIRCLE_MIN))
//     — proportional everywhere it can be, 3 px wherever proportional would be
//     invisible (the 32 px tools, cut 1's 29 px slot), and never more than half
//     the shorter side.
//   * CORNER SMOOTHING 0.6. Apple's continuous corner, which is what Figma's
//     "corner smoothing" slider produces at 60%: instead of an arc meeting the
//     straight edges at a curvature step, most of the corner is a pair of cubic
//     segments that ease the curvature in and out, and only the middle
//     `90 * (1 - s)` degrees of it is still a circular arc.
//
// `squirclePath(w, h)` returns that outline as an SVG path with its origin at
// the shape's TOP-LEFT, drawn clockwise from the top edge, closed. Use it as a
// `<path d=...>` for a filled shape, as a `<clipPath>` for an image, and as a
// stroked path (dashes and all) for an outline.
//
// The construction, per corner, is the `figma-squircle` package's:
//   p                = how far along each edge the corner reaches, capped at
//                      half the shorter side so a corner can never overrun the
//                      opposite one
//   arcMeasure       = the sweep left to the true circular arc
//   arcSectionLength = the chord of that arc
//   a, b, c, d       = the control-point offsets of the two cubics either side
//                      of it, solved so the tangents match at both joins
// ---------------------------------------------------------------------------
export const SQUIRCLE_RATIO = 0.025; // corner radius = 2.5% of the shape's shorter side
export const SQUIRCLE_MIN = 3; // world px floor, so a 32 px tool is still off the sharp corner
export const SQUIRCLE_SMOOTH = 0.6; // Figma-style corner smoothing; 0.6 is Apple's continuous corner

const rad = (deg: number) => (deg * Math.PI) / 180;

export const squirclePath = (
  w: number,
  h: number,
  ratio: number = SQUIRCLE_RATIO,
  smooth: number = SQUIRCLE_SMOOTH,
): string => {
  if (w <= 0 || h <= 0) return "";
  const short = Math.min(w, h);
  // Proportional, floored at SQUIRCLE_MIN, capped at half the shorter side.
  const r = Math.min(short / 2, Math.max(Math.max(0, ratio) * short, SQUIRCLE_MIN));
  if (r <= 0) return `M0 0 L${w} 0 L${w} ${h} L0 ${h} Z`;

  const s = clamp01(smooth);
  // The corner may not eat more than half the shorter side.
  const p = Math.min(short / 2, (1 + s) * r);
  const arcMeasure = 90 * (1 - s); // degrees still drawn as a true arc
  const arcSectionLength = Math.sin(rad(arcMeasure / 2)) * r * Math.SQRT2;
  const angleAlpha = (90 - arcMeasure) / 2;
  const p3ToP4 = r * Math.tan(rad(angleAlpha / 2));
  const angleBeta = 45 * s;
  const c = p3ToP4 * Math.cos(rad(angleBeta));
  const d = c * Math.tan(rad(angleBeta));
  const b = (p - arcSectionLength - c - d) / 3;
  const a = 2 * b;

  const n = (v: number) => Number(v.toFixed(4));
  const abc = n(a + b + c);
  const bc = n(b + c);
  const ab = n(a + b);
  const A = n(a);
  const D = n(d);
  const C = n(c);
  const L = n(arcSectionLength);
  const R = n(r);
  const P = n(p);

  return [
    `M${n(w - p)} 0`,
    `c${A} 0 ${ab} 0 ${abc} ${D}`,
    `a${R} ${R} 0 0 1 ${L} ${L}`,
    `c${D} ${C} ${D} ${bc} ${D} ${abc}`,
    `L${n(w)} ${n(h - p)}`,
    `c0 ${A} 0 ${ab} ${n(-d)} ${abc}`,
    `a${R} ${R} 0 0 1 ${n(-arcSectionLength)} ${L}`,
    `c${n(-c)} ${D} ${n(-(b + c))} ${D} ${n(-(a + b + c))} ${D}`,
    `L${P} ${n(h)}`,
    `c${n(-a)} 0 ${n(-(a + b))} 0 ${n(-(a + b + c))} ${n(-d)}`,
    `a${R} ${R} 0 0 1 ${n(-arcSectionLength)} ${n(-arcSectionLength)}`,
    `c${n(-d)} ${n(-c)} ${n(-d)} ${n(-(b + c))} ${n(-d)} ${n(-(a + b + c))}`,
    `L0 ${P}`,
    `c0 ${n(-a)} 0 ${n(-(a + b))} ${D} ${n(-(a + b + c))}`,
    `a${R} ${R} 0 0 1 ${L} ${n(-arcSectionLength)}`,
    `c${C} ${n(-d)} ${bc} ${n(-d)} ${abc} ${n(-d)}`,
    "Z",
  ].join(" ");
};

// The outline's origin is the shape's top-left, so a shape somewhere in the
// world is the same `d` under a `transform="translate(x y)"` — and an HTML
// element clipped by CSS `clip-path: path(...)` needs no translation at all,
// because that box's own origin is already its top-left corner.
//
// A quiet vignette over everything, for depth. Untouched out to ~30% of the
// way to the corners, then falling to `strength` at the corners. Tested on
// real frames at 0.35 / 0.5 / 0.65; 0.45 is where it reads as depth and not
// as a frame. Goes LAST in the tree.
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.45 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,${(
        strength * 0.35
      ).toFixed(3)}) 62%, rgba(0,0,0,${strength.toFixed(3)}) 100%)`,
    }}
  />
);
