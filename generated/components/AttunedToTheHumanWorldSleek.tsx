import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";

export const FPS = 30;
// Ajeya, "but then future ai agents, for a number of reasons, will probably be
// much more attuned to the human world" — SRT 27.100s -> 33.259s.
//
// Sleek variant of AttunedToTheHumanWorld, built at the user's request for
// faint borders and gradients: a vignette on the grid, a hairline double frame
// and glass fill on the box, a luminous body trailing the wavefront, tethers
// that fade toward the humans, and a soft plate under the logo. Same beats,
// same geometry, same camera.
export const DURATION = 185;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  population: z.number(),
  logoSrc: z.string(),
  sheen: z.number(),
  unknownInk: z.number(),
  readInk: z.number(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundInvert: z.boolean(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  beats: z.object({
    establish: z.number(), // "future ai"
    agents: z.number(), // "agents for"
    reason1: z.number(), // "a number"
    reason2: z.number(), // "of reasons will"
    reason3: z.number(),
    reason4: z.number(), // "probably"
    unbox: z.number(), // "be much more"
    release: z.number(), // "attuned to"
    wide: z.number(), // "the human world"
    settled: z.number(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#48D9FF",
  population: 260,
  logoSrc: "openai-chatgpt-logo.png",
  // 0 = the flat original, 1 = as approved. Multiplies every gradient alpha.
  sheen: 1,
  // Three states on the grid's lighter field: unknown, then read. The unknown
  // floor is above the 0.10 used over footage — 0.10 disappears on this field.
  unknownInk: 0.18,
  readInk: 0.9,
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  // The grid's lines are darker than its field; inverting turns it into a
  // glowing grid, which reads as a different asset. Dim only.
  backgroundInvert: false,
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  beats: {
    establish: 14,
    agents: 36,
    reason1: 62,
    reason2: 71,
    reason3: 82,
    reason4: 91,
    unbox: 103,
    release: 136,
    wide: 162,
    settled: 176,
  },
});

const WORLD_W = 3240;
const WORLD_H = 5760;
const CX = 1620;
const CY = 2880;

// The scatter is sized to the widest camera (k 0.36 sees 1500 x 2667 either
// side of centre), so the pull-back lands on a full frame with a little margin
// and no wasted marks outside it.
const FIELD_X = 1560;
const FIELD_Y = 2790;
const CLEAR_R = 292;

const BOX = 360;
const LOGO = 186;
const HUB_R = 122;
const TETHER_D = 850;
const RESOLVE_SPAN = 260;

// Force the logo's RGB to the accent and keep its alpha, driven off the same
// accent prop as everything else — so the mark is unmistakably the AI rather
// than another white thing in a field of white humans.
const TINT_ID = "attuned-sleek-accent-tint";
const hexRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const full = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

type Mark = {
  x: number;
  y: number;
  d: number;
  ux: number;
  uy: number;
  scale: number;
  phase: number;
  wob: number;
  tether: boolean;
  frag: { x: number; y: number }[];
};

// A handful of seats close in, so the opening frame shows the agent already
// surrounded — the whole point is that they were there the entire time.
const NEAR_SEEDS = [
  { a: 34, r: 352 },
  { a: 118, r: 430 },
  { a: 196, r: 336 },
  { a: 262, r: 470 },
  { a: 312, r: 392 },
  { a: 72, r: 560 },
  { a: 232, r: 604 },
];

// Uniform in area (uniform in the rectangle), so density is even and the
// pull-back reveals more of the same world rather than a thinning cloud.
const buildField = (count: number): Mark[] => {
  const out: Mark[] = [];
  for (let i = 1; out.length < count && i < count * 8; i++) {
    const seed = NEAR_SEEDS[i - 1];
    const dx = seed
      ? Math.cos((seed.a * Math.PI) / 180) * seed.r
      : (hash(i, 1) * 2 - 1) * FIELD_X;
    const dy = seed
      ? Math.sin((seed.a * Math.PI) / 180) * seed.r
      : (hash(i, 2) * 2 - 1) * FIELD_Y;
    const d = Math.hypot(dx, dy);
    if (d < CLEAR_R) continue;
    const frag = [0, 1, 2].map((j) => {
      const a = hash(i, 11 + j) * Math.PI * 2;
      const r = 19 + hash(i, 21 + j) * 20;
      return { x: Math.cos(a) * r * 0.78, y: Math.sin(a) * r * 1.18 };
    });
    out.push({
      x: CX + dx,
      y: CY + dy,
      d,
      ux: dx / d,
      uy: dy / d,
      scale: 0.95 + hash(i, 3) * 0.32,
      phase: hash(i, 4) * Math.PI * 2,
      wob: 3.5 + hash(i, 5) * 4,
      tether: d < TETHER_D,
      frag,
    });
  }
  return out;
};

// ---------------------------------------------------------------------------
// Camera
//
// One move: a creeping widen through the setup, then the pull-back on
// "attuned to". Authored as a coarse key track and run through a damped follow
// so the corner into the pull-back is rounded off instead of snapping. The
// wavefront is sized in SCREEN pixels and divided by k (see waveWorld below) —
// that is what keeps the ring growing on screen throughout. Driving the wave in
// world units instead made it appear to shrink while the camera opened faster
// than it travelled, which read as a mistake.
// ---------------------------------------------------------------------------
const CAM_F = [0, 100, 128, 134, 146, 156, DURATION];
const CAM_CY = [2812, 2828, 2840, 2845, 2864, 2880, 2880];
const CAM_K = [1.24, 1.17, 1.14, 1.11, 0.74, 0.36, 0.36];
const CAM_STIFF = 0.115;
const CAM_DAMP = 0.52;

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vcy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const tcy = interpolate(f, CAM_F, CAM_CY, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const tk = interpolate(f, CAM_F, CAM_K, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    vcy += (tcy - cy) * CAM_STIFF - vcy * CAM_DAMP;
    cy += vcy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

const BG_OVERSIZE = 1.8;
const WAVE_S0 = 166;
const WAVE_S1 = 1310;

const eo3 = (t: number) => 1 - Math.pow(1 - t, 3);
const eo5 = (t: number) => 1 - Math.pow(1 - t, 5);

const REASONS = [
  { deg: 205, beat: "reason1" as const },
  { deg: 24, beat: "reason2" as const },
  { deg: 156, beat: "reason3" as const },
  { deg: 334, beat: "reason4" as const },
];
const REASON_TRAVEL = 12;
const REASON_START_R = 860;

const AttunedToTheHumanWorldSleek: React.FC<Props> = ({
  ink,
  accent,
  population,
  logoSrc,
  sheen,
  unknownInk,
  readInk,
  backgroundBase,
  backgroundSrc,
  backgroundInvert,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const marks = useMemo(() => buildField(population), [population]);
  const tint = useMemo(() => hexRgb(accent), [accent]);
  const tint255 = tint.map((c) => Math.round(c * 255)).join(",");
  const a = (v: number) => Math.max(0, Math.min(1, v * sheen));

  const { cy, k } = camera(frame);
  const tx = 540 - CX * k;
  const ty = 960 - cy * k;

  // Screen-referenced line weights, so nothing thins to a shimmer as the camera
  // pulls back three and a bit stops.
  const px = (screen: number) => screen / k;

  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.32;
  const bgScale = 1 + (k - 1) * 0.3;

  const boxIn = interpolate(frame, [0, beats.establish], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // The box swells as it unlatches, then draws itself in tight just before it
  // goes — the wind-up that makes the release land.
  const swell = interpolate(frame, [beats.unbox, beats.unbox + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const wind = interpolate(frame, [beats.unbox + 15, beats.release], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const side = BOX + 48 * swell - 104 * wind;
  const cornerT = interpolate(frame, [beats.unbox, beats.unbox + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // rx is clamped to half the side, so the square becomes an exact circle and
  // the released ring starts at precisely the radius the box ended on.
  const rx = Math.min(interpolate(cornerT, [0, 1], [34, 150]), side / 2);

  const released = frame >= beats.release;
  const waveT = interpolate(frame, [beats.release, beats.settled], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const waveScreen =
    WAVE_S0 + (WAVE_S1 - WAVE_S0) * (0.46 * eo5(waveT) + 0.54 * Math.pow(waveT, 1.5));
  const waveWorld = Math.max(side / 2, waveScreen / k);

  // Everything downstream reads off waveWorld — the same number the ring is
  // drawn at — so the cascade can never drift from the front that causes it.
  const resolveAt = released ? waveWorld : 0;

  const boxPulse = REASONS.reduce((acc, r) => {
    const age = frame - beats[r.beat];
    if (age < 0 || age > 26) return acc;
    return acc + Math.exp(-age / 8) * Math.cos(age * 0.55) * 0.04;
  }, 0);

  const flash = interpolate(frame, [beats.agents, beats.agents + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const closing = interpolate(frame, [beats.unbox, beats.unbox + 23], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const pulses = [
    beats.establish,
    beats.agents,
    beats.reason1,
    beats.reason2,
    beats.reason3,
    beats.reason4,
  ].map((f0) => {
    const age = frame - f0;
    if (age < 0 || age > 15) return null;
    const t = age / 15;
    return {
      r: LOGO / 2 + 10 + (side / 2 - 14 - LOGO / 2 - 10) * eo3(t),
      o: 0.5 * (1 - t) * Math.min(1, t * 6),
    };
  });

  // Two rings collapse into the ring during the wind-up. Charging reads as
  // inward; an outward pulse here just looked like a doubled outline.
  const echoes = [beats.unbox + 6, beats.unbox + 19].map((f0) => {
    const age = frame - f0;
    if (age < 0 || age > 14) return null;
    const t = age / 14;
    return {
      r: side / 2 + 430 * (1 - Math.pow(t, 2)),
      o: 0.34 * Math.min(1, t * 3) * (1 - Math.pow(t, 4)),
    };
  });
  const charge = [beats.unbox + 20, beats.unbox + 33].reduce((acc, f0) => {
    const age = frame - f0;
    if (age < 0 || age > 9) return acc;
    return acc + 0.5 * Math.pow(1 - age / 9, 2);
  }, 0);

  const boxOpacity = released ? 0 : Math.min(1, 0.38 + 0.2 * flash + 0.42 * closing + charge);

  // The comet running the perimeter is the agent working inside its own box.
  // It does not stop at the unbox beat — it lengthens until it IS the ring,
  // which is then what flies out.
  const lap = interpolate(
    frame,
    [beats.establish, beats.agents, beats.unbox, beats.release],
    [0, 1, 2.5, 3.9],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cometIn = interpolate(frame, [beats.establish, beats.establish + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const dashLen = interpolate(closing, [0, 1], [150, 1000]);

  const coreScale =
    1 +
    0.022 * Math.sin(frame / 21) +
    boxPulse * 0.9 +
    (released ? 0.14 * Math.exp(-(frame - beats.release) / 6) : 0);


  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 1080 * BG_OVERSIZE,
            height: 1920 * BG_OVERSIZE,
            objectFit: "cover",
            transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
            filter: `${
              backgroundInvert ? "invert(1) " : ""
            }blur(${backgroundBlur}px) brightness(${backgroundDim})`,
          }}
        />
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 78% 62% at 50% 47%, rgba(0,0,0,0) 30%, rgba(0,0,0,${(
              0.5 * sheen
            ).toFixed(3)}) 100%)`,
          }}
        />
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 47%, rgba(${tint255}, ${(
              0.075 * sheen
            ).toFixed(3)}) 0%, rgba(${tint255}, 0) 42%)`,
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
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {marks.map((m, i) => {
              const p =
                resolveAt <= 0
                  ? 0
                  : Math.max(0, Math.min(1, (resolveAt - m.d) / RESOLVE_SPAN));
              const e = eo3(p);
              const wob = m.wob * (1 - e);
              const wx = m.x + Math.sin(frame / 34 + m.phase) * wob;
              const wy = m.y + Math.cos(frame / 41 + m.phase * 1.3) * wob * 0.7;

              const tp = Math.max(0, Math.min(1, (p - 0.3) / 0.7));
              const hubX = CX + m.ux * HUB_R;
              const hubY = CY + m.uy * HUB_R;

              return (
                <g key={i}>
                  {m.tether && tp > 0 ? (
                    <line
                      x1={hubX}
                      y1={hubY}
                      x2={hubX + (wx - hubX) * tp}
                      y2={hubY + (wy - hubY) * tp}
                      stroke="url(#attuned-sleek-tether)"
                      strokeWidth={px(3)}
                      opacity={0.62 * tp}
                    />
                  ) : null}

                  {p < 1
                    ? m.frag.map((f, j) => (
                        <circle
                          key={j}
                          cx={wx + f.x * (1 - e)}
                          cy={wy + f.y * (1 - e)}
                          r={11 * (1 - p * 0.55)}
                          fill={ink}
                          opacity={unknownInk * (1 - p)}
                        />
                      ))
                    : null}

                  {p > 0 && p < 1 ? (
                    <circle
                      cx={wx}
                      cy={wy}
                      r={26 + 66 * e}
                      fill="none"
                      stroke={ink}
                      strokeWidth={px(4)}
                      opacity={0.5 * (1 - p)}
                    />
                  ) : null}

                  {p > 0 ? (
                    <g
                      transform={`translate(${wx} ${wy}) scale(${
                        (0.5 + 0.5 * e) * (1 + 0.2 * Math.sin(Math.PI * p)) * m.scale
                      })`}
                      fill={ink}
                      opacity={readInk * e}
                    >
                      <circle cx={0} cy={-25} r={12.5} />
                      <rect x={-15} y={-9} width={30} height={45} rx={13.5} />
                    </g>
                  ) : null}
                </g>
              );
            })}

            {echoes.map((e, i) =>
              e ? (
                <circle
                  key={i}
                  cx={CX}
                  cy={CY}
                  r={e.r}
                  fill="none"
                  stroke={accent}
                  strokeWidth={px(6)}
                  opacity={e.o}
                />
              ) : null,
            )}

            {released ? (
              <>
                <circle cx={CX} cy={CY} r={waveWorld} fill="url(#attuned-sleek-wave)" />
                <circle
                  cx={CX}
                  cy={CY}
                  r={waveWorld}
                  fill="none"
                  stroke={accent}
                  strokeWidth={px(26)}
                  opacity={a(0.09)}
                />
                <circle
                  cx={CX}
                  cy={CY}
                  r={waveWorld * 0.86}
                  fill="none"
                  stroke={accent}
                  strokeWidth={px(5)}
                  opacity={0.16}
                />
                <circle
                  cx={CX}
                  cy={CY}
                  r={waveWorld}
                  fill="none"
                  stroke={accent}
                  strokeWidth={px(interpolate(waveT, [0, 1], [13, 7]))}
                  opacity={interpolate(waveT, [0, 0.85], [1, 0.72], {
                    extrapolateRight: "clamp",
                  })}
                />
              </>
            ) : null}

            {REASONS.map((r, i) => {
              const b = beats[r.beat];
              const q = interpolate(frame, [b - REASON_TRAVEL, b], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              });
              const out = interpolate(frame, [b, b + 6], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              if (q <= 0 || out <= 0) return null;
              const a = (r.deg * Math.PI) / 180;
              const ux = Math.cos(a);
              const uy = Math.sin(a);
              const land = side / 2 + 14;
              const rr = REASON_START_R + (land - REASON_START_R) * q;
              const tail = rr + (300 * (1 - q) + 96);
              const hit = interpolate(frame, [b, b + 13], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              });
              return (
                <g key={i} opacity={out}>
                  <line
                    x1={CX + ux * tail}
                    y1={CY + uy * tail}
                    x2={CX + ux * rr}
                    y2={CY + uy * rr}
                    stroke={accent}
                    strokeWidth={px(9)}
                    strokeLinecap="round"
                    opacity={0.8}
                  />
                  <circle cx={CX + ux * rr} cy={CY + uy * rr} r={px(13)} fill={accent} />
                  {hit > 0 && hit < 1 ? (
                    <circle
                      cx={CX + ux * land}
                      cy={CY + uy * land}
                      r={16 + 74 * hit}
                      fill="none"
                      stroke={accent}
                      strokeWidth={px(6)}
                      opacity={0.6 * (1 - hit)}
                    />
                  ) : null}
                </g>
              );
            })}

            {!released
              ? pulses.map((p, i) =>
                  p ? (
                    <circle
                      key={i}
                      cx={CX}
                      cy={CY}
                      r={p.r}
                      fill="none"
                      stroke={accent}
                      strokeWidth={px(6)}
                      opacity={p.o}
                    />
                  ) : null,
                )
              : null}

            {!released ? (
              <g
                transform={`translate(${CX} ${CY}) scale(${boxIn * (1 + boxPulse + 0.006 * Math.sin(frame / 17))}) translate(${-CX} ${-CY})`}
              >
                <rect
                  x={CX - side / 2}
                  y={CY - side / 2}
                  width={side}
                  height={side}
                  rx={rx}
                  fill="url(#attuned-sleek-box)"
                />
                <rect
                  x={CX - side / 2 - 30}
                  y={CY - side / 2 - 30}
                  width={side + 60}
                  height={side + 60}
                  rx={rx + 30}
                  fill="none"
                  stroke={accent}
                  strokeWidth={px(2)}
                  opacity={a(0.16) * (1 - closing * 0.6)}
                />
                <rect
                  x={CX - side / 2 + 24}
                  y={CY - side / 2 + 24}
                  width={side - 48}
                  height={side - 48}
                  rx={Math.max(6, rx - 24)}
                  fill="none"
                  stroke={accent}
                  strokeWidth={px(1.5)}
                  opacity={a(0.22) * (1 - closing)}
                />
                <rect
                  x={CX - side / 2}
                  y={CY - side / 2}
                  width={side}
                  height={side}
                  rx={rx}
                  fill="none"
                  stroke={accent}
                  strokeWidth={px(13)}
                  opacity={boxOpacity}
                />
                <rect
                  x={CX - side / 2}
                  y={CY - side / 2}
                  width={side}
                  height={side}
                  rx={rx}
                  fill="none"
                  stroke={accent}
                  strokeWidth={px(13)}
                  strokeLinecap="round"
                  pathLength={1000}
                  strokeDasharray={`${dashLen} 1000`}
                  strokeDashoffset={-lap * 1000}
                  opacity={cometIn}
                />
              </g>
            ) : null}

            <circle
              cx={CX}
              cy={CY}
              r={LOGO * 0.78 * coreScale}
              fill="url(#attuned-sleek-plate)"
            />
            <defs>
              <radialGradient
                id="attuned-sleek-tether"
                gradientUnits="userSpaceOnUse"
                cx={CX}
                cy={CY}
                r={TETHER_D}
              >
                <stop offset="0.1" stopColor={accent} stopOpacity={a(0.6)} />
                <stop offset="1" stopColor={accent} stopOpacity={a(0.06)} />
              </radialGradient>
              <radialGradient
                id="attuned-sleek-wave"
                gradientUnits="userSpaceOnUse"
                cx={CX}
                cy={CY}
                r={Math.max(1, waveWorld)}
              >
                <stop offset="0.55" stopColor={accent} stopOpacity={0} />
                <stop offset="0.9" stopColor={accent} stopOpacity={a(0.07)} />
                <stop offset="1" stopColor={accent} stopOpacity={a(0.2)} />
              </radialGradient>
              <linearGradient id="attuned-sleek-box" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={accent} stopOpacity={a(0.13)} />
                <stop offset="1" stopColor={accent} stopOpacity={a(0.02)} />
              </linearGradient>
              <radialGradient id="attuned-sleek-plate" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor={accent} stopOpacity={a(0.2)} />
                <stop offset="0.7" stopColor={accent} stopOpacity={a(0.06)} />
                <stop offset="1" stopColor={accent} stopOpacity={0} />
              </radialGradient>
              <filter id={TINT_ID} colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values={`0 0 0 0 ${tint[0]} 0 0 0 0 ${tint[1]} 0 0 0 0 ${tint[2]} 0 0 0 1 0`}
                />
              </filter>
            </defs>
          </svg>

          <Img
            src={staticFile(logoSrc)}
            style={{
              position: "absolute",
              left: CX - LOGO / 2,
              top: CY - LOGO / 2,
              width: LOGO,
              height: LOGO,
              filter: `url(#${TINT_ID})`,
              transform: `scale(${coreScale})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default AttunedToTheHumanWorldSleek;
