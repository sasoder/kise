import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
import { camEase, clamp, clamp01, smoothstep, sway } from "./fieldShared";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// InterestRatesGoDown V2: the 9:16, pared-back take on V1 (the user found the
// 16:9 chart "a little overwhelming"; every graphic in this clip is 9:16).
//
// Sarah Paine, Russo-Japanese War clip "War runs on credit":
//   "…but because Japan had battlefield successes, THE INTEREST RATES GO DOWN
//    AND IT GETS CHEAPER FOR THEM."   ("them" = Japan, borrowing in London/NY)
//
// IN-POINT 7.86 s = f0. 24 fps, f = round((t - 7.86) * 24):
//   the 7.86 f0 · interest 8.30 f11 · rates 8.64 f19 · go 8.93 f26 ·
//   down 9.17 f31 · and it 9.69 f44 · gets 10.14 f55 · cheaper 10.32 f59 ·
//   for 10.72 f69 · them 10.93 f74 · next line "still" 11.46 f86
// DURATION = 86 (the next line) + 16 (tail) = 102 frames = 4.25 s.
//
// THE DATA (coupon rates; the rate is a step that exists only at each loan):
//   1. 10 May 1904 £10m at 6%      2. Nov 1904 £12m at 6%
//   3. 25 Mar 1905 £30m at 4½%     4. Jul 1905 £30m at 4½%     (total £82m)
//   Sources: A.J. Sherman, Leo Baeck Institute Yearbook 28 (1983) 68-69;
//   G.D. Best, Am. Jewish Hist. Quarterly 61 (1972) 313-19; R. Smethurst,
//   Rothschild Archive Review 2006, 20-25 (dates the 2nd loan late Oct 1904
//   and the 1905 issues "April and July").
//
// STYLE: the Dwarkesh map style's ink and accent on the user's umber land
// backdrop. Cream #E9DDBF for all type and lines; orange #FFB000 / #D98A0C
// means one thing: the saving. One centred column, phone first.
//
// THE GESTURES, each with its word (everything else is fixed):
//   1. f0 ESTABLISHED: title, readout "6%", the step at 6% May -> Nov 1904
//      with its two dots, the baseline with 1904 / 1905.          — "the" f0
//   2. THE DROP: the step runs on from Nov 1904, drops to 4½ at Mar 1905
//      (bottom of the drop on f31) and runs on to Jul 1905 (f40); the 1905
//      dots arrive as the tip reaches them. The readout rolls 6% -> 4½%
//      (6% leaves from f24, 4½% rises from f25, full f30, settled f33).
//                                          — "interest rates go down" f8-40
//   3. THE SAVING: the old 6% level remains as a dashed cream ghost (f30-42);
//      one front fills the gap to the 4½ line with the orange hatch, its top
//      edge turning dashed orange, ~2/3 on "cheaper" (f59), complete ~f72.
//                                                — "it gets cheaper" f44-72
//   4. HOLD: a faint highlight travels the band's dashed edge. — f76-101
//   Camera: no glide; one slow eased creep in, k 1.0 -> 1.04 over the piece,
//   pivoting on the baseline (540, 1089) so nothing creeps below y1150,
//   plus the house sway.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 102;
export const W = 1080;
export const H = 1920;

export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const SHADE = "#140F0A";

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backdropSrc: z.string(),
  vignette: z.number(),
  labels: z.object({
    title: z.string(),
    y1904: z.string(),
    y1905: z.string(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  vignette: 0.32,
  labels: { title: "JAPAN'S WAR LOANS", y1904: "1904", y1905: "1905" },
});

// ---------------------------------------------------------------------------
// The column, in world units (== screen px at k 1). Time is linear in months
// from 1 May 1904, the step spans 820 px centred on x 540.
// ---------------------------------------------------------------------------
const M_MAY = 9 / 31; // 10 May 1904
const M_NOV = 6.0; // Nov 1904
const M_MAR = 10 + 24 / 31; // 25 Mar 1905
const M_JUL = 14 + 10 / 31; // 11 Jul 1905
const STEP_W = 820;
const SX = STEP_W / (M_JUL - M_MAY);
const X_LEFT = (W - STEP_W) / 2;
const xOfMonth = (m: number) => X_LEFT + (m - M_MAY) * SX;
const Y6 = 915;
const Y45 = 1055;

const X_MAY = xOfMonth(M_MAY);
const X_NOV = xOfMonth(M_NOV);
const X_MAR = xOfMonth(M_MAR);
const X_JUL = xOfMonth(M_JUL);
const X_1905 = xOfMonth(8); // 1 Jan 1905
const LOANS = [
  { x: X_MAY, y: Y6 },
  { x: X_NOV, y: Y6 },
  { x: X_MAR, y: Y45 },
  { x: X_JUL, y: Y45 },
];

const BASE = 1089;
const BASE_L = X_LEFT - 24;
const BASE_R = X_LEFT + STEP_W + 24;
const YEAR_Y = 1137;

const TITLE_Y = 525;
const READOUT_Y = 767; // baseline; the glyphs sit ~615-770, centred ~695

const STEP_D = `M${X_MAY},${Y6}H${X_MAR}V${Y45}H${X_JUL}`;
const S_NOV = X_NOV - X_MAY;
const S_CORNER = X_MAR - X_MAY;
const S_MAR = S_CORNER + (Y45 - Y6);
export const STEP_LEN = S_MAR + (X_JUL - X_MAR);

// ---------------------------------------------------------------------------
// Timing.
// ---------------------------------------------------------------------------
export const T = {
  draw: [8, 40] as const,
  drawWarp: 1.4, // bottom of the drop on f31 ("down")
  roll: 24, // 6% leaves f24-31, 4½% rises from f25, full f30, settled f33
  ghost: [30, 42] as const,
  band: [44, 72] as const,
  bandWarp: 0.9, // ~2/3 on f59 ("cheaper")
  shimmer: [76, 102] as const,
};
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

export const tipS = (f: number) => {
  const u = clamp01((f - T.draw[0]) / (T.draw[1] - T.draw[0]));
  return S_NOV + camEase(u, T.drawWarp) * (STEP_LEN - S_NOV);
};
const firstFrameAt = (s: number) => {
  for (let f = T.draw[0]; f <= T.draw[1]; f++) if (tipS(f) >= s - 0.5) return f;
  return T.draw[1];
};
export const F_DROP_START = firstFrameAt(S_CORNER);
export const F_DROP_LAND = firstFrameAt(S_MAR);
export const F_JUL = firstFrameAt(STEP_LEN);

const BAND_OVER = 22; // the 18 px soft front runs past July (clipped) to leave a crisp edge
export const bandX = (f: number) => {
  const u = clamp01((f - T.band[0]) / (T.band[1] - T.band[0]));
  return X_MAR + camEase(u, T.bandWarp) * (X_JUL + BAND_OVER - X_MAR);
};
export const BAND = { xm: X_MAR, xj: X_JUL };

// The camera: one eased creep in about the column, already moving on f0.
const PIVOT = { x: 540, y: 1089 }; // the baseline: the creep grows the column upward, years stay above y1150
const CREEP_K = 1.04;
export const camK = (f: number) => {
  const u = clamp01((f + 12) / (DURATION + 12));
  return Math.pow(CREEP_K, smoothstep(u));
};

// ---------------------------------------------------------------------------
const InterestRatesGoDownV2: React.FC<Props> = ({ ink, accent, accentDeep, backdropSrc, vignette, labels }) => {
  const frame = useCurrentFrame();

  const k = camK(frame);
  const drift = sway(frame);
  const tx = PIVOT.x - PIVOT.x * k + drift.dx * 0.6;
  const ty = PIVOT.y - PIVOT.y * k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;

  const s = tipS(frame);
  const ghostOp = 0.5 * smoothstep((frame - T.ghost[0]) / (T.ghost[1] - T.ghost[0]));
  const fx = bandX(frame);
  const bandOn = frame >= T.band[0] && fx - X_MAR > 0.5;

  const dotIn = (sAt: number) => {
    const fAt = firstFrameAt(sAt) - 2;
    return {
      op: interpolate(frame, [fAt, fAt + 7], [0, 1], clamp),
      dy: interpolate(frame, [fAt, fAt + 11], [14, 0], { easing: EASE_LAND, ...clamp }),
    };
  };
  const still = { op: 1, dy: 0 };
  const dotAnims = [still, still, dotIn(S_MAR), dotIn(STEP_LEN)];

  // readout roll, identical to the fixed V1
  const R0 = T.roll;
  const outDy = interpolate(frame, [R0, R0 + 8], [0, -24], { easing: Easing.bezier(0.5, 0, 0.75, 0), ...clamp });
  const outOp = interpolate(frame, [R0 + 2, R0 + 7], [1, 0], clamp);
  const inDy = interpolate(frame, [R0 + 1, R0 + 9], [24, 0], { easing: EASE_LAND, ...clamp });
  const inOp = interpolate(frame, [R0 + 1, R0 + 6], [0, 1], clamp);

  const shT = clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0]));
  const shX = X_MAR + (X_JUL - X_MAR) * smoothstep(shT);
  const shOp = Math.sin(Math.PI * shT) * 0.55;

  const halo = { stroke: SHADE, strokeOpacity: 0.5, paintOrder: "stroke" as const };
  const DASH = "12 8";

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* backdrop, world space, oversized 10% */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
        }}
      >
        <Img
          src={staticFile(backdropSrc)}
          style={{ position: "absolute", left: -W * 0.05, top: -H * 0.05, width: W * 1.1, height: H * 1.1 }}
        />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <pattern id="ir2Hatch" patternUnits="userSpaceOnUse" width={16} height={16} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={16} stroke={accent} strokeWidth={3.8} />
          </pattern>
          <linearGradient id="ir2FrontGrad" gradientUnits="userSpaceOnUse" x1={fx - 18} y1={0} x2={fx} y2={0}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="ir2Front" maskUnits="userSpaceOnUse" x={X_MAR - 40} y={Y6 - 40} width={X_JUL - X_MAR + 80} height={Y45 - Y6 + 80}>
            <rect x={X_MAR - 40} y={Y6 - 40} width={X_JUL - X_MAR + 80} height={Y45 - Y6 + 80} fill="url(#ir2FrontGrad)" />
          </mask>
          <clipPath id="ir2Gap">
            <rect x={X_MAR} y={Y6} width={X_JUL - X_MAR} height={Y45 - Y6} />
          </clipPath>
        </defs>
        <g transform={camT}>
          {/* title */}
          <text
            x={W / 2}
            y={TITLE_Y}
            textAnchor="middle"
            fill={ink}
            opacity={0.9}
            {...halo}
            strokeWidth={4}
            style={{ fontFamily: fellSC, fontSize: 40, letterSpacing: 40 * 0.3 }}
          >
            {labels.title}
          </text>

          {/* the readout */}
          <g style={{ fontFamily: fell, fontSize: 230 }} fill={ink} {...halo} strokeWidth={7} textAnchor="middle">
            {outOp > 0 ? (
              <text x={W / 2} y={READOUT_Y + outDy} opacity={outOp}>
                6%
              </text>
            ) : null}
            {inOp > 0 ? (
              <text x={W / 2} y={READOUT_Y + inDy} opacity={inOp}>
                4½%
              </text>
            ) : null}
          </g>

          {/* baseline: 1904 | 1905 */}
          <line x1={BASE_L} y1={BASE} x2={BASE_R} y2={BASE} stroke={SHADE} strokeOpacity={0.45} strokeWidth={5} />
          <line x1={BASE_L} y1={BASE} x2={BASE_R} y2={BASE} stroke={ink} strokeOpacity={0.8} strokeWidth={2.2} />
          <line x1={X_1905} y1={BASE} x2={X_1905} y2={BASE + 14} stroke={ink} strokeOpacity={0.8} strokeWidth={2.4} />
          {[
            [(BASE_L + X_1905) / 2, labels.y1904],
            [(X_1905 + BASE_R) / 2, labels.y1905],
          ].map(([x, t]) => (
            <text
              key={`y-${t}`}
              x={x}
              y={YEAR_Y}
              textAnchor="middle"
              fill={ink}
              opacity={0.88}
              {...halo}
              strokeWidth={4}
              style={{ fontFamily: fell, fontSize: 34, letterSpacing: 34 * 0.06 }}
            >
              {t}
            </text>
          ))}

          {/* the saving: orange hatch, one front Mar -> Jul */}
          {bandOn ? (
            <g mask="url(#ir2Front)">
              <g clipPath="url(#ir2Gap)">
                <rect x={X_MAR} y={Y6} width={X_JUL - X_MAR} height={Y45 - Y6} fill={accentDeep} fillOpacity={0.26} />
                <rect x={X_MAR} y={Y6} width={X_JUL - X_MAR} height={Y45 - Y6} fill="url(#ir2Hatch)" opacity={0.7} />
              </g>
            </g>
          ) : null}

          {/* the old 6% level remains, dashed cream; the front turns it orange */}
          {ghostOp > 0 ? (
            <line x1={X_MAR} y1={Y6} x2={X_JUL} y2={Y6} stroke={ink} strokeOpacity={ghostOp} strokeWidth={3} strokeDasharray={DASH} />
          ) : null}
          {bandOn ? (
            <g mask="url(#ir2Front)">
              <line x1={X_MAR} y1={Y6} x2={X_JUL} y2={Y6} stroke={SHADE} strokeOpacity={0.4} strokeWidth={6.5} strokeDasharray={DASH} />
              <line x1={X_MAR} y1={Y6} x2={X_JUL} y2={Y6} stroke={accent} strokeWidth={3.8} strokeDasharray={DASH} />
            </g>
          ) : null}
          {shOp > 0.01
            ? [
                [90, 0.3],
                [44, 0.5],
                [16, 0.75],
              ].map(([len, o]) => (
                <line
                  key={`sh-${len}`}
                  x1={Math.max(X_MAR, shX - len / 2)}
                  y1={Y6}
                  x2={Math.min(X_JUL, shX + len / 2)}
                  y2={Y6}
                  stroke="#FFE3A6"
                  strokeOpacity={o * shOp}
                  strokeWidth={4.2}
                  strokeLinecap="round"
                />
              ))
            : null}

          {/* the rate: one cream step, drawn on */}
          <path d={STEP_D} fill="none" stroke={SHADE} strokeOpacity={0.5} strokeWidth={8.5} strokeLinejoin="round" strokeDasharray={`${s} ${STEP_LEN + 20}`} />
          <path d={STEP_D} fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round" strokeDasharray={`${s} ${STEP_LEN + 20}`} />

          {/* the loans */}
          {LOANS.map((d, i) =>
            dotAnims[i].op > 0 ? (
              <circle
                key={`d-${i}`}
                cx={d.x}
                cy={d.y + dotAnims[i].dy}
                r={11}
                fill={ink}
                stroke={SHADE}
                strokeWidth={3}
                opacity={dotAnims[i].op}
              />
            ) : null,
          )}
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 46%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(vignette * 0.5).toFixed(
            3,
          )}) 82%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default InterestRatesGoDownV2;
