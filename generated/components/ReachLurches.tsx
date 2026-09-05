import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  FLASH,
  GLIDE,
  LAND,
  RISE,
  backdropStyle,
  clamp01,
  runCamera,
} from "./cheekyPintSystem";

export const FPS = 24;
// "it's very hard to tell, even harder to tell, what's going to catch on,
// because a new model may have come out. and, you know, a new model may
// suddenly be good at something that makes a product possible."
// SRT 21.260s -> 32.780s at 24fps.
export const DURATION = 276;

// ---------------------------------------------------------------------------
// How far the models reach, and where it lurches
//
// His claim is causal, not descriptive: you cannot tell what will catch on
// *because* a new model may have come out. So the piece is not a picture of
// uncertainty, it is a picture of the thing that causes it — a frontier. The
// models sit at the centre and their combined reach is drawn around them.
// Products inside the reach are buildable and can be read; products outside it
// are barely visible. A read runs the buildable ones twice looking for the one
// that catches on and fails, because the answer is not in that set yet.
//
// The fourth model widens the reach evenly. The fifth does not: it lurches out
// in one direction, and the lobe swallows a product a long way out in the dark
// that nothing had been reading. "Suddenly good at something" is one
// direction, not a bigger circle — that is the whole distinction.
//
// The other two cutaways in this edit are both vertical: one is a narrow ink
// column on a wide amber floor with the camera pulling back, the other is
// accent falling onto an ink mass with the camera pushing in. This one is
// planar and radial, the colour roles are inverted — accent at the centre, ink
// scattered around it — and the camera drifts laterally to follow the lurch.
// Same 22px module, same palette, a third geometry.
// ---------------------------------------------------------------------------
const G = 22;
const RX = 11; // G / 2, on every corner in the scene

const WORLD_W = 2400;
const WORLD_H = 2600;
const X0 = 1200;
const Y0 = 1300;

// The models: a stack of squares at the centre, newest on top, re-centring on
// the origin as it grows so the reach stays concentric with what casts it.
const MODEL_W = 3 * G; // 66
const MODEL_PITCH = 4 * G; // 88
const MODELS0 = 3;
const MODEL_IN = [128, 196]; // "new model" · "model may"
const MODEL_LAND_T = 12;

// The reach. An ellipse rather than a circle because the frame is 9:16 and a
// circle wide enough to matter leaves the top and bottom of it empty.
const RX0 = 14 * G; // 308
const RY0 = 20 * G; // 440
const RX1 = 19 * G; // 418
const RY1 = 27 * G; // 594
const EXPAND_AT = 134;
const EXPAND_T = 24;

// The lurch. Not a second circle stuck onto the first — that reads as two
// shapes — but the one frontier deforming: its radius is scaled by a bump
// centred on the direction of the product it is going to reach, so what the
// viewer sees is the reach itself going out in one direction.
const LOBE_AT = 206;
const LOBE_T = 26;
// Narrow and long rather than wide and shallow. A broad 34% swelling reads as
// the ellipse simply getting bigger, which is the one thing this must not say:
// "suddenly good at something" is one direction, not a better model overall.
const LURCH_T = -0.744; // the parametric angle facing the product it catches
const LURCH_AMT = 0.46;
const LURCH_SIG = 0.24;
const FRONTIER_N = 160;

const bump = (t: number) => {
  let d = t - LURCH_T;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.exp(-(d * d) / (2 * LURCH_SIG * LURCH_SIG));
};

// The products you could build. Positions are authored, not scattered: which
// ones the fourth model brings in has to be countable (three), and the one the
// lurch reaches has to be somewhere nothing was looking. Heights are all 2G;
// only the widths vary, in whole modules.
const CAND_H = 2 * G;
type Cand = { x: number; y: number; w: number };
const CANDS: Cand[] = [
  // Eleven are already buildable when he starts talking, which is the point:
  // there is no shortage of things you could make.
  { x: -165, y: -150, w: 5 * G },
  { x: 130, y: -230, w: 4 * G },
  { x: -52, y: 300, w: 3 * G },
  { x: 232, y: 170, w: 6 * G },
  { x: -215, y: 60, w: 4 * G },
  { x: 35, y: -400, w: 3 * G },
  { x: -120, y: 340, w: 5 * G },
  { x: 130, y: 90, w: 4 * G },
  { x: -78, y: -330, w: 3 * G },
  { x: 172, y: -60, w: 5 * G },
  { x: -172, y: 200, w: 4 * G },
  // Exactly three more when the fourth model widens the reach.
  { x: -302, y: -210, w: 4 * G },
  { x: 258, y: 330, w: 3 * G },
  { x: -103, y: -490, w: 5 * G },
  // Four that are never reached at all.
  { x: -404, y: 440, w: 4 * G },
  { x: 344, y: 500, w: 3 * G },
  { x: -447, y: -380, w: 5 * G },
  { x: 103, y: 620, w: 3 * G },
  // And the one the lurch catches, out in the dark the whole time.
  { x: 344, y: -450, w: 5 * G },
];
const THE_ONE = 18;
const RESOLVE_AT = 247;
const RESOLVE_T = 16;

// The read. It goes through everything the models can currently do, twice —
// the second pass faster and fainter — and a third time that dies halfway,
// which is "what's going to catch on" left unanswered.
type Pass = { from: number; to: number; x0: number; x1: number; o: number };
const PASSES: Pass[] = [
  { from: 8, to: 48, x0: -370, x1: 370, o: 1 },
  { from: 52, to: 72, x0: 370, x1: -370, o: 0.6 },
  { from: 76, to: 90, x0: -370, x1: -90, o: 0.34 },
];
const SCAN_REACH = 120;

const ez = (e: (t: number) => number, x: number) => e(clamp01(x));

const frontierAt = (f: number) => {
  const g = ez(GLIDE, (f - EXPAND_AT) / EXPAND_T);
  return { rx: RX0 + (RX1 - RX0) * g, ry: RY0 + (RY1 - RY0) * g };
};
const lurchAt = (f: number) => ez(RISE, (f - LOBE_AT) / LOBE_T) * LURCH_AMT;

const frontierPath = (f: number) => {
  const { rx, ry } = frontierAt(f);
  const b = lurchAt(f);
  let d = "";
  for (let i = 0; i < FRONTIER_N; i++) {
    const t = (i / FRONTIER_N) * Math.PI * 2 - Math.PI;
    const s = 1 + b * bump(t);
    d += `${i === 0 ? "M" : "L"}${(X0 + rx * Math.cos(t) * s).toFixed(1)} ${(
      Y0 +
      ry * Math.sin(t) * s
    ).toFixed(1)}`;
  }
  return `${d}Z`;
};

// How covered a product is by the reach, as 0..1 across a narrow band, so the
// frontier passing over one is a transition rather than a switch.
const covAt = (i: number, f: number) => {
  const { rx, ry } = frontierAt(f);
  const b = lurchAt(f);
  const c = CANDS[i];
  const s = 1 + b * bump(Math.atan2(c.y / ry, c.x / rx));
  return clamp01((1 - Math.hypot(c.x / (rx * s), c.y / (ry * s))) / 0.06);
};

const scanAt = (f: number) => {
  for (const p of PASSES) {
    if (f >= p.from && f <= p.to) {
      const t = ez(GLIDE, (f - p.from) / (p.to - p.from));
      const fade = p === PASSES[2] ? 1 - t * 0.9 : 1;
      return { x: p.x0 + (p.x1 - p.x0) * t, o: p.o * fade };
    }
  }
  return null;
};

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
  darkOpacity: z.number(),
  readOpacity: z.number(),
  fieldFill: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "it's very" · 17 "hard to" · 32 "tell even" · 48 "harder to tell"
  //   66 "what's going to" · 78 "catch on" · 92 "because a" · 128 "new model"
  //   148 "come out" · 177 "know a new" · 196 "model may" · 206 "suddenly"
  //   215 "be good at" · 235 "that makes" · 247 "a product" · 257 "possible"
  //   276 end
  beats: z.object({
    harderToTell: z.number().int(),
    catchOn: z.number().int(),
    newModel: z.number().int(),
    cameOut: z.number().int(),
    suddenly: z.number().int(),
    possible: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  backgroundBase: "#2B2118",
  backgroundSrc: "brown-paper-backdrop.jpg",
  backgroundBlur: 16,
  backgroundDim: 0.68,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  darkOpacity: 0.2,
  readOpacity: 0.82,
  fieldFill: 0.04,
  beats: {
    harderToTell: 48,
    catchOn: 78,
    newModel: 128,
    cameOut: 148,
    suddenly: 206,
    possible: 257,
  },
});

const ReachLurches: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  darkOpacity,
  readOpacity,
  fieldFill,
  beats,
}) => {
  const frame = useCurrentFrame();

  // Two runs of the same damped hand: one for the zoom and the vertical, one
  // for the lateral. The lateral track is what makes this the third geometry
  // in the edit — it follows the lurch out and then reframes on the answer.
  const CAM_F = [0, 46, 90, 134, 180, 212, 248, DURATION];
  const CAM_K = [1.18, 1.22, 1.2, 1.12, 1.0, 0.96, 0.93, 0.92];
  const CAM_CX = [1181, 1178, 1183, 1180, 1176, 1222, 1215, 1200];
  const CAM_CY = [1404, 1400, 1404, 1420, 1435, 1392, 1424, 1411];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );
  const { cy: cx } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CX),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );

  const tx = 540 - cx * k;
  const ty = 960 - cy * k;

  const { rx, ry } = frontierAt(frame);
  const path = frontierPath(frame);
  const scan = scanAt(frame);
  // The read hugs the field: a bar the height of the reach at that x, so it
  // looks like the region is being gone through rather than the frame.
  const scanH = scan
    ? 2 * ry * Math.sqrt(Math.max(0, 1 - (scan.x / rx) * (scan.x / rx)))
    : 0;

  const models =
    MODELS0 +
    MODEL_IN.reduce((a, t) => a + ez(LAND, (frame - t) / MODEL_LAND_T), 0);
  const modelCount = Math.ceil(models - 0.0001);

  // Once the answer is on screen, everything that is not the answer steps back.
  // Only a half-step back. Taking the rest of the field down far enough to
  // "focus" turns eighteen white products into eighteen grey ones, and grey on
  // kraft is mud. The answer separates by being wider, whiter and alone out in
  // the finger — it does not need the others put out.
  const others = interpolate(frame, [beats.possible - 5, beats.possible + 12], [1, 0.86], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const resolve = ez(LAND, (frame - RESOLVE_AT) / RESOLVE_T);

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
            {/* One frontier. The dashes drift the whole way through, so the
                reach is never still even while nothing is being decided. */}
            <path d={path} fill={accent} fillOpacity={fieldFill} />
            <path
              d={path}
              fill="none"
              stroke={accent}
              strokeWidth={5}
              strokeDasharray={`${G} ${G}`}
              strokeDashoffset={-frame * 0.9}
              opacity={0.78}
            />

            {scan && scanH > 0 ? (
              <rect
                x={X0 + scan.x - 4}
                y={Y0 - scanH / 2}
                width={8}
                height={scanH}
                fill={ink}
                opacity={0.45 * scan.o}
              />
            ) : null}

            {CANDS.map((c, i) => {
              const cov = covAt(i, frame);
              // A pulse when the frontier crosses, taken from the change in
              // coverage rather than a stored crossing time.
              const pulse = clamp01((cov - covAt(i, frame - FLASH)) * 6);
              const read =
                scan && cov > 0.5
                  ? clamp01(1 - Math.abs(c.x - scan.x) / SCAN_REACH) * scan.o
                  : 0;

              const one = i === THE_ONE;
              const w = one ? c.w + G * resolve : c.w;
              // Outside the reach a product is line-work; inside it is solid.
              // That is the state ladder here — buildable things have mass,
              // unbuildable ones are the outline of an idea.
              //
              // So the read does not brighten what it touches, it un-solidifies
              // it: each product the bar crosses drops back to an outline and
              // recovers. Brightening an already-white tile is invisible, and
              // the point is not that the read finds things, it is that
              // nothing it touches holds up. The first pass interrogates hard,
              // the second barely disturbs them, the third gives up halfway.
              const q = 1 - read * 0.85;
              const fillO = Math.max(
                readOpacity * cov * q,
                0.98 * pulse,
                one ? 0.96 * resolve : 0,
              );
              const strokeO = Math.max(darkOpacity * (1 - cov), read * 0.55);

              return (
                <rect
                  key={`c-${i}`}
                  x={X0 + c.x - w / 2}
                  y={Y0 + c.y - CAND_H / 2}
                  width={w}
                  height={CAND_H}
                  rx={RX}
                  fill={ink}
                  fillOpacity={fillO * (one ? 1 : others)}
                  stroke={ink}
                  strokeWidth={3}
                  strokeOpacity={strokeO * (one ? 1 : others)}
                />
              );
            })}

            {Array.from({ length: modelCount }, (_, i) => {
              // i counts from the bottom; the stack re-centres as it grows.
              const top = ((models - 1) / 2) * MODEL_PITCH;
              const y = Y0 + top - i * MODEL_PITCH;
              const arriving = i === modelCount - 1 && modelCount > MODELS0;
              const g = arriving ? clamp01(models - (modelCount - 1)) : 1;
              return (
                <rect
                  key={`m-${i}`}
                  x={X0 - (MODEL_W * (arriving ? g : 1)) / 2}
                  y={y - MODEL_W / 2}
                  width={MODEL_W * (arriving ? g : 1)}
                  height={MODEL_W}
                  rx={RX}
                  fill={accent}
                  opacity={0.95}
                />
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ReachLurches;
