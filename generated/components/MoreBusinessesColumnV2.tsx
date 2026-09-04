import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import {
  AMBIENT_O,
  FLASH_DENSE,
  FLASH_DENSE_INK,
  GAP,
  GROUND_LIFT,
  GROUND_O,
  GROUND_W,
  LAND,
  backdropStyle,
  clamp01,
  hash,
  qbez,
  runCamera,
  sgnRand as sgn,
} from "./cheekyPintSystem";

export const FPS = 24;
// V2 — sleek pass on the shared Cheeky Pint system.
// Tobi, "i think the meta shopify alley-oop has created more businesses than
// any government policy in history" — SRT 0.000s -> 5.620s at 24fps.
export const DURATION = 135;

// ---------------------------------------------------------------------------
// World
//
// Wider than the frame so the final pull-back can reveal a ridge of policy
// heaps running off both edges, and tall enough for the column of businesses
// to climb out of frame while the camera travels with it.
// ---------------------------------------------------------------------------
const WORLD_W = 2600;
const WORLD_H = 5300;
const X0 = 1300; // the frame's centre axis in world space
const FLOOR_Y = 4760;

const DOT_R = 21;
const COLS = 8;
const COL_STEP = 52;
const ROW_STEP = 46;
const N = 304; // businesses; 38 rows -> a 1748px column

// Rows fill from the middle outward, so a part-filled row reads as a crown on
// the pile rather than a shelf growing off one side.
const ORDER = [3, 4, 2, 5, 1, 6, 0, 7];

// The line is delivered in one continuous run with no pause anywhere in it, so
// both legs of the alley-oop are short: the lob lands on "alley-oop" and the
// business it drops lands on "has created".
const PASS = 9; // frames Meta -> Shopify
const FLIGHT = 9; // frames Shopify -> its slot on the pile


export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // "marks": one mark per near heap, the second stepped down — the ridge reads
  // as a series. "watermark": one large faint mark behind the whole base,
  // occluded by the tower and the heaps.
  govMode: z.enum(["marks", "watermark"]),
  govOpacity: z.number(),
  govSize: z.number(),
  govWatermarkOpacity: z.number(),
  govWatermarkSize: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "i think" · 7 "the meta" · 23 "shopify alley-oop" · 50 "has created"
  //   69 "more businesses" · 84 "than any" · 102 "government"
  //   110 "policy in" · 125 "history" · 135 end
  beats: z.object({
    meta: z.number().int(),
    shopify: z.number().int(),
    lob: z.number().int(),
    slam: z.number().int(),
    created: z.number().int(),
    businesses: z.number().int(),
    government: z.number().int(),
    policy: z.number().int(),
    history: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  backgroundBase: "#2B2118",
  backgroundSrc: "brown-paper-backdrop.jpg",
  // Kraft paper is already a midtone, so it wants far less dimming than the
  // grid does: at 0.68 the field lands near #67553B, which holds white
  // line-work near 8:1 and keeps the amber clear of the paper's own hue,
  // with the sheet's vignette and mottle still reading through.
  backgroundBlur: 16,
  backgroundDim: 0.68,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  // A caption, not a character: dim enough that the two platform marks stay
  // the subject, and small enough to read as subordinate to them.
  govMode: "marks",
  govOpacity: 0.5,
  govSize: 138,
  govWatermarkOpacity: 0.16,
  govWatermarkSize: 1166,
  beats: {
    meta: 7,
    shopify: 23,
    lob: 27,
    slam: 41,
    created: 50,
    businesses: 69,
    government: 102,
    policy: 110,
    history: 125,
  },
});

type Beats = Props["beats"];

// ---------------------------------------------------------------------------
// Growth
//
// One curve owns how many businesses exist at a given frame; the pile height,
// the camera, the emission rate, the pass tempo and the hover of the marks are
// all read off it, so nothing can drift out of step when the timing changes.
// The first four are single, countable events on their own passes; from
// "more businesses" it opens into a pour that is still running at the cut.
// ---------------------------------------------------------------------------
const growthF = (b: Beats) => [
  b.created,
  b.created + 5,
  b.created + 10,
  b.created + 15,
  b.businesses + 4,
  b.businesses + 11,
  b.businesses + 19,
  b.businesses + 28,
  b.businesses + 37,
  b.businesses + 46,
  b.businesses + 55,
  b.history + 7,
  DURATION,
];
const GROWTH_V = [1, 2, 3, 4, 12, 30, 62, 110, 165, 222, 268, 296, N];

const landedAt = (f: number, b: Beats) =>
  interpolate(f, growthF(b), GROWTH_V, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Invert the same piecewise-linear curve so a business's arrival frame and the
// pile's height can never disagree about when it showed up.
const arrivals = (b: Beats): number[] => {
  const fs = growthF(b);
  const out: number[] = [];
  let seg = 0;
  for (let i = 0; i < N; i++) {
    const target = i + 1;
    while (seg < GROWTH_V.length - 2 && GROWTH_V[seg + 1] < target) seg++;
    const v0 = GROWTH_V[seg];
    const v1 = GROWTH_V[seg + 1];
    const t = v1 === v0 ? 0 : (target - v0) / (v1 - v0);
    out.push(fs[seg] + t * (fs[seg + 1] - fs[seg]));
  }
  return out;
};

const slotX = (i: number) => {
  const col = ORDER[i % COLS];
  return X0 + (col - (COLS - 1) / 2) * COL_STEP + sgn(i * 3 + 1) * COL_STEP * 0.32;
};
const slotY = (i: number) => {
  const row = Math.floor(i / COLS);
  return FLOOR_Y - row * ROW_STEP - ROW_STEP / 2 + sgn(i * 7 + 5) * ROW_STEP * 0.26;
};
const slotR = (i: number) => DOT_R * (0.84 + hash(i * 11 + 3) * 0.34);

// ---------------------------------------------------------------------------
// Policy heaps
//
// Same unit as the column — one dot is one business — so the comparison is
// countable rather than asserted. Ink, not accent: these are the human-made
// thing, and they sit on the floor the column has been growing from all along.
//
// V2: the ridge is now derived rather than placed by eye. Heap n is n dots
// wide and n dots tall, so the four of them hold 16, 9, 4 and 1 businesses —
// squares descending — and each sits exactly two system gaps clear of the
// last. The tower's own edge sets where the first one starts, so the whole
// ridge is a consequence of the column's width instead of a set of numbers
// that happened to look right. Three of them is what the final zoom holds; the
// last is half-cut by the frame edge, which is the "and on through history"
// read the ridge wanted from the start.
// ---------------------------------------------------------------------------
const TOWER_HALF = ((COLS - 1) / 2) * COL_STEP + COL_STEP * 0.32 + DOT_R * 1.18;
const HEAP_AIR = GAP * 2;
const heapHalf = (n: number) => ((n - 1) * COL_STEP) / 2 + DOT_R * 1.18;

type Heap = {
  x: number;
  count: number;
  cols: number;
  opacity: number;
  at: keyof Beats;
  lag: number;
};
const HEAP_SPEC: { n: number; at: keyof Beats; lag: number; opacity: number }[] = [
  { n: 4, at: "government", lag: 0, opacity: 0.85 },
  { n: 3, at: "policy", lag: 0, opacity: 0.66 },
  { n: 2, at: "history", lag: -6, opacity: 0.5 },
];

const HEAPS: Heap[] = [];
{
  let edge = TOWER_HALF;
  for (const spec of HEAP_SPEC) {
    const half = heapHalf(spec.n);
    const cx = edge + HEAP_AIR + half;
    for (const side of [-1, 1]) {
      HEAPS.push({
        x: X0 + side * cx,
        count: spec.n * spec.n,
        cols: spec.n,
        opacity: spec.opacity,
        at: spec.at,
        // The far side of each pair lands a few frames behind the near one, so
        // the ridge reads as spreading outward rather than snapping on.
        lag: spec.lag + (side > 0 ? 4 : 0),
      });
    }
    edge = cx + half;
  }
}

const HEAP_RISE = 8;

type HeapDot = { x: number; y: number; r: number; delay: number; opacity: number; at: keyof Beats };
const HEAP_DOTS: HeapDot[] = HEAPS.flatMap((h, hi) =>
  Array.from({ length: h.count }, (_, i) => {
    const seed = hi * 977 + i;
    const row = Math.floor(i / h.cols);
    const col = i % h.cols;
    return {
      x: h.x + (col - (h.cols - 1) / 2) * COL_STEP + sgn(seed * 3 + 1) * COL_STEP * 0.3,
      y: FLOOR_Y - row * ROW_STEP - ROW_STEP / 2 + sgn(seed * 7 + 5) * ROW_STEP * 0.24,
      r: DOT_R * (0.84 + hash(seed * 11 + 3) * 0.34),
      delay: h.lag + row * 2 + Math.abs(col - (h.cols - 1) / 2) * 1.3 + hash(seed) * 2,
      opacity: h.opacity,
      at: h.at,
    };
  }),
);

// The floor before anything is built on it: latent makers, never bright enough
// to compete, and moving the whole time so the open is not a still.
const AMBIENT = Array.from({ length: 44 }, (_, i) => ({
  x: X0 + ((i + 0.5) / 44) * 1960 - 980 + sgn(i * 13 + 2) * 22,
  y: FLOOR_Y - 14 - hash(i * 5 + 9) * 214,
  r: 12 + hash(i * 17 + 4) * 11,
  phase: hash(i * 23 + 7) * Math.PI * 2,
  drift: 0.7 + hash(i * 41 + 6) * 0.9,
}));

// ---------------------------------------------------------------------------
// Camera
//
// Authored as its own coarse key track, not read off the top of the pile. In
// five and a half seconds there is no room for a hold, a climb and a separate
// pull-back, so it is one continuous move: a slow widening while the marks
// establish and the first businesses land, then a decisive rise-and-pull from
// "than any" that arrives at the final framing before "history" does. The keys
// run through a damped follow, which rounds every corner and leaves the camera
// trailing the action slightly. Values were read off the growth curve so the
// pile's crown stays in the upper half without the camera ever chasing it.
// ---------------------------------------------------------------------------
const CAM_F = [0, 30, 66, 96, 122, DURATION];
const CAM_CY = [4496, 4493, 4477, 4400, 3992, 3992];
const CAM_K = [1.25, 1.245, 1.19, 0.97, 0.636, 0.636];

// Simple Icons, both on a 24x24 box centred on (12,12). Shopify inks a lot more
// of that box than Meta does, so it is drawn at 0.82x to match by ink area.
const META_D =
  "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z";
const SHOPIFY_D =
  "M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z";

// Drawn to the same rules as the two brand marks above — solid monochrome fill
// on a 24x24 box centred on (12,12) — so it belongs to the same lockup family
// rather than arriving as an imported illustration. It names the third actor
// the way the other two marks name theirs; the piece has already established
// that a mark is how an actor gets named here.
const GOV_D =
  "M12 3.1 L22.3 10.3 H1.7 Z M2.5 11.5 H21.5 V13.3 H2.5 Z M4.5 13.9 H6.9 V19.4 H4.5 Z M8.7 13.9 H11.1 V19.4 H8.7 Z M12.9 13.9 H15.3 V19.4 H12.9 Z M17.1 13.9 H19.5 V19.4 H17.1 Z M2.1 19.9 H21.9 V21.7 H2.1 Z";

// Sits on the tallest heap's own axis, in the air directly above it, so it
// reads as that heap's label and not as a satellite parked in empty frame.
const GOV_X = HEAPS[0].x;
const GOV_Y =
  FLOOR_Y - HEAP_SPEC[0].n * ROW_STEP - 26 - ((21.7 - 12) / 24) * 138;

// The second mark is the same mark on the same beat structure, one word later.
const GOV2_X = HEAPS[1].x;

// How far the glyph's ink reaches below the centre of its 24-box, used to stand
// the watermark's base on the floor line.
const GOV_INK_BOTTOM = (21.7 - 12) / 24;

const META_SIZE = 194;
const SHOPIFY_SIZE = META_SIZE * 0.82;
const MARK_DX = 175;

const MoreBusinessesColumnV2: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  govMode,
  govOpacity,
  govSize,
  govWatermarkOpacity,
  govWatermarkSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const arrival = React.useMemo(() => arrivals(beats), [beats]);

  const landed = landedAt(frame, beats);
  const rate = Math.max(0, landedAt(frame + 0.5, beats) - landedAt(frame - 0.5, beats));
  const rateNorm = clamp01(rate / 6.3);

  // The pile's crown, and the marks that ride above it. The two platforms sit
  // on top of what they have made and climb as it grows; the gap opens up as
  // the pour thickens so the stream has room to read, then closes again for the
  // final frame.
  const tipY = FLOOR_Y - (landed / COLS) * ROW_STEP;
  const pullIn = interpolate(frame, [beats.government - 16, beats.government + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const hoverBase = interpolate(frame, [beats.slam, beats.businesses + 24], [300, 150], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const hover = hoverBase - 20 * pullIn + 150 * rateNorm * (1 - 0.55 * pullIn);
  const markY = tipY - hover;
  const metaX = interpolate(frame, [beats.shopify - 6, beats.shopify + 7], [X0, X0 - MARK_DX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const shopifyX = X0 + MARK_DX;

  const { cy, k } = React.useMemo(() => runCamera(frame, CAM_F, CAM_K, CAM_CY), [frame]);
  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;

  // The sheet sits on its own plane at a fraction of the camera, so the move
  // reads as travel through a space instead of a layer sliding about, with a
  // slow constant drift so it is never still.

  // Both marks have to be established inside a second, so they settle fast.
  const metaIn = spring({
    frame: frame - beats.meta,
    fps,
    config: { damping: 15, stiffness: 180, mass: 0.7 },
  });
  const shopifyIn = spring({
    frame: frame - beats.shopify,
    fps,
    config: { damping: 15, stiffness: 180, mass: 0.7 },
  });

  // The route the pass runs on. It draws itself once, on the lob, then stays as
  // a faint standing line for everything that follows to travel along.
  const arcY0 = markY - META_SIZE * 0.42;
  const arcCY = arcY0 - 190;
  const arcDraw = interpolate(frame, [beats.lob - 4, beats.lob + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const arcPath = `M ${metaX} ${arcY0} Q ${X0} ${arcCY} ${shopifyX} ${arcY0}`;
  const arcLen = 430;

  const onWire: number[] = [];
  let lastDepart = -999;
  let lastLand = -999;
  const scanFrom = Math.max(0, Math.floor(landed) - 60);
  const upto = Math.min(N, Math.ceil(landed) + 90);
  for (let i = scanFrom; i < upto; i++) {
    const land = arrival[i] - FLIGHT;
    const depart = land - PASS;
    if (depart <= frame && depart > lastDepart) lastDepart = depart;
    if (land <= frame && land > lastLand) lastLand = land;
    if (frame >= depart && frame <= land) onWire.push(depart);
  }

  // Thin whatever is on the wire down to a couple of heads, so the arc stays a
  // readable route rather than a solid amber bar once the pour opens up.
  const pulseStep = Math.max(1, Math.ceil(onWire.length / 2.6));
  const pulses = onWire
    .filter((_, n) => n % pulseStep === 0)
    .map((depart) => {
      const t = clamp01((frame - depart) / PASS);
      return { x: qbez(metaX, X0, shopifyX, t), y: qbez(arcY0, arcCY, arcY0, t), t };
    });

  const departAge = frame - lastDepart;
  const landAge = frame - lastLand;
  const hitDamp = 1 / (1 + rate * 0.55);
  const metaPop =
    1 - 0.07 * hitDamp * interpolate(departAge, [0, 3, 9], [1, 0.35, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const shopifyPop =
    1 + 0.11 * hitDamp * interpolate(landAge, [0, 3, 10], [1, 0.4, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // Lands a few frames behind its heap, so the dots arrive first and the label
  // settles onto them rather than the two appearing as one event.
  const govIn = interpolate(frame, [beats.government + 6, beats.government + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const govY = GOV_Y + 26 * (1 - govIn);
  // The second lands on "policy in", so the series builds with the words: one
  // mark on "government", another on "policy".
  const gov2In = interpolate(frame, [beats.policy + 6, beats.policy + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const gov2Y = GOV_Y + 22 * (1 - gov2In);

  const wmIn = interpolate(frame, [beats.government + 4, beats.government + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const wmY = FLOOR_Y - GOV_INK_BOTTOM * govWatermarkSize + 24 * (1 - wmIn);
  const marks = govMode === "marks";

  const ambientDim = interpolate(frame, [beats.slam, beats.businesses], [AMBIENT_O, 0.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const floorOpacity = interpolate(
    frame,
    [0, 8, beats.government - 8, beats.government + 6],
    [0, GROUND_O, GROUND_O, GROUND_LIFT],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(frame, cy, k, CAM_CY[0], backgroundBlur, backgroundDim)}
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
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <rect x={60} y={FLOOR_Y} width={2480} height={GROUND_W} fill={ink} opacity={floorOpacity} />

            {!marks && wmIn > 0 ? (
              <g
                transform={`translate(${X0} ${wmY}) scale(${govWatermarkSize / 24}) translate(-12 -12)`}
                opacity={govWatermarkOpacity * wmIn}
              >
                <path d={GOV_D} fill={ink} />
              </g>
            ) : null}

            {AMBIENT.map((a, i) => (
              <circle
                key={`amb-${i}`}
                cx={a.x}
                cy={a.y + Math.sin(frame / 37 + a.phase) * 7 * a.drift}
                r={a.r}
                fill={ink}
                opacity={ambientDim * (0.65 + 0.35 * Math.sin(frame / 29 + a.phase))}
              />
            ))}

            {HEAP_DOTS.map((d, i) => {
              const age = frame - beats[d.at] - d.delay;
              if (age < 0) return null;
              const rise = interpolate(age, [0, HEAP_RISE], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: LAND,
              });
              return (
                <circle
                  key={`heap-${i}`}
                  cx={d.x}
                  cy={FLOOR_Y - 8 + (d.y - FLOOR_Y + 8) * rise}
                  r={d.r}
                  fill={ink}
                  opacity={d.opacity * clamp01(age / 5)}
                />
              );
            })}

            {marks && govIn > 0 ? (
              <g
                transform={`translate(${GOV_X} ${govY}) scale(${govSize / 24}) translate(-12 -12)`}
                opacity={govOpacity * govIn}
              >
                <path d={GOV_D} fill={ink} />
              </g>
            ) : null}

            {marks && gov2In > 0 ? (
              <g
                transform={`translate(${GOV2_X} ${gov2Y}) scale(${govSize / 24}) translate(-12 -12)`}
                opacity={govOpacity * gov2In}
              >
                <path d={GOV_D} fill={ink} />
              </g>
            ) : null}

            {arcDraw > 0 ? (
              <path
                d={arcPath}
                fill="none"
                stroke={accent}
                strokeWidth={5}
                strokeLinecap="round"
                opacity={0.34}
                strokeDasharray={arcLen}
                strokeDashoffset={arcLen * (1 - arcDraw)}
              />
            ) : null}

            {Array.from({ length: upto }, (_, i) => {
              const a = arrival[i];
              if (frame < a - FLIGHT) return null;
              const sx = slotX(i);
              const sy = slotY(i);
              const r = slotR(i);
              const age = frame - a;

              if (age < 0) {
                // In flight: each one falls on its own shallow arc, so a pour
                // never reads as a bundle of parallel lines.
                const t = clamp01((frame - (a - FLIGHT)) / FLIGHT);
                const e = Easing.out(Easing.cubic)(t);
                const mx = (shopifyX + sx) / 2 + sgn(i * 5 + 3) * 90;
                const my = (markY + sy) / 2 + 40 + hash(i * 9 + 2) * 60;
                return (
                  <circle
                    key={`b-${i}`}
                    cx={qbez(shopifyX, mx, sx, e)}
                    cy={qbez(markY, my, sy, e)}
                    r={r * (0.7 + 0.3 * e)}
                    fill={accent}
                    opacity={clamp01(t * 4)}
                  />
                );
              }

              // A short click-bright as each one lands, barely off the accent —
              // enough to keep a working crown on the pile, not enough to lay a
              // pale band through it.
              const pop = interpolate(age, [0, 4, 10], [1.28, 0.95, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              });
              return (
                <circle
                  key={`b-${i}`}
                  cx={sx}
                  cy={sy}
                  r={r * pop}
                  fill={interpolateColors(Math.min(age, FLASH_DENSE), [0, FLASH_DENSE], [FLASH_DENSE_INK, accent])}
                />
              );
            })}

            {pulses.map((p, i) => (
              <circle
                key={`p-${i}`}
                cx={p.x}
                cy={p.y}
                r={9.5}
                fill={ink}
                opacity={clamp01(Math.min(p.t, 1 - p.t) * 7)}
              />
            ))}

            <g
              transform={`translate(${metaX} ${markY}) scale(${(metaIn * metaPop * META_SIZE) / 24}) translate(-12 -12)`}
              opacity={clamp01((frame - beats.meta) / 5)}
            >
              <path d={META_D} fill={ink} />
            </g>
            <g
              transform={`translate(${shopifyX} ${markY}) scale(${(shopifyIn * shopifyPop * SHOPIFY_SIZE) / 24}) translate(-12 -12)`}
              opacity={clamp01((frame - beats.shopify) / 5)}
            >
              <path d={SHOPIFY_D} fill={ink} />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default MoreBusinessesColumnV2;
