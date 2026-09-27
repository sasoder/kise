import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF, camEase, clamp, clamp01, smoothstep, sway } from "./fieldShared";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
loadFell("italic", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
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
//   1. 10 May 1904   £10m at 6%
//   2.  Nov 1904     £12m at 6%   (on sale 26 Oct 1904 per Smethurst; Nov per Best)
//   3. 25 Mar 1905   £30m at 4½%  (after Mukden, taken 10 Mar 1905)
//   4.  Jul 1905     £30m at 4½%
//   Total £82m, which matches Smethurst's "£82 million of Japanese war bonds".
//   Sources: A.J. Sherman, "German-Jewish Bankers in World Politics: The
//   Financing of the Russo-Japanese War", Leo Baeck Institute Yearbook 28
//   (1983) 68-69; G.D. Best, "Financing a Foreign War: Jacob H. Schiff and
//   Japan, 1904-05", Am. Jewish Hist. Quarterly 61 (1972) 313-19; R. Smethurst,
//   "Takahashi Korekiyo, the Rothschilds and the Russo-Japanese War",
//   Rothschild Archive Review 2006, 20-25 (both 1904 issues at 6%; the 1905
//   issues dated "April and July"; Sherman / The Economist 25 Mar 1905 date the
//   first 4½% issue to 25 March).
//
// THE DWARKESH MAP STYLE, as a chart (not a map): the user's umber land
// backdrop, cream ink #E9DDBF for every line and all type, IM Fell English SC
// for the title, IM Fell English roman for ticks / readout, italic for notes.
// Orange #FFB000 / #D98A0C means ONE thing: the saving.
//
// THE GESTURES, each with its word:
//   1. f0 ESTABLISHED: axes, scale, title, Mukden marker, both 1904 loans on a
//      cream step at 6%, readout "6%". Camera k 1.08 in on 1904, already
//      creeping right.                                         — "the"      f0
//   2. THE DROP: the step runs on from NOV 1904 past Mukden, drops to 4½ at
//      MAR 1905 (lands f31) and runs on to JUL 1905 (f40); the 1905 dots
//      arrive as the tip reaches them. Camera glides right and out to k 1.0
//      (lands ~f36). Readout rolls 6% -> 4½% (overlapped slide-up-fade,
//      f24-33, 4½% full on f30).
//                                          — "interest rates go down" f8-40
//   3. THE SAVING: the old 6% level remains as a dashed cream ghost (f30-42);
//      one front fills the gap between it and the 4½ line with the orange
//      hatch, its top edge converting to dashed orange, Mar -> Jul, ~2/3 on
//      "cheaper" and complete by f72. The italic note "1½ points less" slides
//      up under the band.                        — "it gets cheaper"  f44-72
//   4. HOLD: ~3% creep and a faint highlight travelling the band's dashed
//      edge. Nothing new.                              — "for them"  f74-101
// Nothing else: no flags, bonds, coins, arrows, flashes, pulses, glows.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 102;
export const W = 1920;
export const H = 1080;

export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const SHADE = "#140F0A"; // under-strokes and type halos

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backdropSrc: z.string(),
  vignette: z.number(),
  labels: z.object({
    title: z.string(),
    may04: z.string(),
    nov04: z.string(),
    mar05: z.string(),
    jul05: z.string(),
    mukden: z.string(),
    saving: z.string(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backdropSrc: "ww1credit/LandBackdrop_3840x2160_flat.png",
  vignette: 0.32,
  labels: {
    title: "JAPAN'S WAR LOANS",
    may04: "MAY 1904",
    nov04: "NOV 1904",
    mar05: "MAR 1905",
    jul05: "JUL 1905",
    mukden: "Mukden",
    saving: "1½ points less",
  },
});

// ---------------------------------------------------------------------------
// The chart, in world units (== screen px at k 1, camera at 960, 540).
// Time is linear in months from 1 May 1904; rate is linear in points.
// ---------------------------------------------------------------------------
const X0 = 300;
const SX = 72; // px per month
const xOfMonth = (m: number) => X0 + m * SX;
const Y6 = 340;
const PT = 150; // px per percentage point
const yOfRate = (r: number) => Y6 + (6 - r) * PT;
const Y45 = yOfRate(4.5);
const BASE = 690; // the time axis
const AXIS_L = 262;
const AXIS_R = 1392;

export const LOANS = [
  { m: 9 / 31, rate: 6 }, // 10 May 1904
  { m: 6.0, rate: 6 }, // Nov 1904
  { m: 10 + 24 / 31, rate: 4.5 }, // 25 Mar 1905
  { m: 14 + 10 / 31, rate: 4.5 }, // 11 Jul 1905
].map((l) => ({ ...l, x: xOfMonth(l.m), y: yOfRate(l.rate) }));
const X_MAY = LOANS[0].x;
const X_NOV = LOANS[1].x;
const X_MAR = LOANS[2].x;
const X_JUL = LOANS[3].x;
const X_MUKDEN = xOfMonth(10 + 9 / 31); // Mukden taken 10 Mar 1905

// The step line as one path, May -> Jul, with its arclength stations.
const STEP_D = `M${X_MAY},${Y6}H${X_MAR}V${Y45}H${X_JUL}`;
const S_NOV = X_NOV - X_MAY;
const S_CORNER = X_MAR - X_MAY;
const S_MAR = S_CORNER + (Y45 - Y6);
export const STEP_LEN = S_MAR + (X_JUL - X_MAR);

// ---------------------------------------------------------------------------
// Timing.
// ---------------------------------------------------------------------------
export const T = {
  draw: [8, 40] as const, // the tip Nov -> Jul
  drawWarp: 1.34, // puts the bottom of the drop on f31 ("down")
  roll: 24, // readout roll: 6% leaves f24-31, 4½% rises f25, full f30, settled f33
  ghost: [30, 42] as const, // the old 6% level remains, dashed
  band: [44, 72] as const, // the orange front, Mar -> Jul
  bandWarp: 0.88, // ~2/3 of the way on f59 ("cheaper")
  saving: 60, // the italic note
  shimmer: [76, 102] as const,
};
const LABEL_TRAVEL = 24;
const LABEL_FRAMES = 14;
const LABEL_FADE = 9;
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

export const bandX = (f: number) => {
  const u = clamp01((f - T.band[0]) / (T.band[1] - T.band[0]));
  // runs 22 px past July (clipped) so the 18 px soft front leaves a crisp edge
  return X_MAR + camEase(u, T.bandWarp) * (X_JUL + 22 - X_MAR);
};

// ---------------------------------------------------------------------------
// The camera: a keyed target track damped by the house spring. The track is
// started 14 frames before f0 so the camera is already moving on the first
// frame. It glides right with the tip and out to k 1.0, landing ~f36; the
// hold creeps k x1.03 toward the band, still moving on the last frame.
// ---------------------------------------------------------------------------
export const CAM = {
  pre: 14,
  from: { k: 1.10, cx: 860, cy: 504 },
  to: { k: 1.0, cx: 960, cy: 540 },
  move: [-14, 27] as const,
  creep: [66, 102] as const,
  creepK: 1.04,
  creepTo: { cx: 1000, cy: 520 },
};
const camTarget = (f: number) => {
  const u = camEase((f - CAM.move[0]) / (CAM.move[1] - CAM.move[0]), 1);
  const uc = clamp01((f - CAM.creep[0]) / (CAM.creep[1] - CAM.creep[0]));
  const creep = uc * uc * (1.5 - 0.5 * uc);
  const { from: A, to: B } = CAM;
  return {
    k: A.k * Math.pow(B.k / A.k, u) * Math.pow(CAM.creepK, creep),
    cx: A.cx + (B.cx - A.cx) * u + (CAM.creepTo.cx - B.cx) * creep,
    cy: A.cy + (B.cy - A.cy) * u + (CAM.creepTo.cy - B.cy) * creep,
  };
};
export const runCam = (upto: number) => {
  let { k, cx, cy } = camTarget(-CAM.pre);
  let vk = 0;
  let vx = 0;
  let vy = 0;
  for (let f = -CAM.pre + 1; f <= upto; f++) {
    const t = camTarget(f);
    const lk = Math.log(k);
    vk += (Math.log(t.k) - lk) * CAM_STIFF - vk * CAM_DAMP;
    k = Math.exp(lk + vk);
    vx += (t.cx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (t.cy - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
  }
  return { k, cx, cy };
};

const slide = (frame: number, f0: number, travel = LABEL_TRAVEL) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [travel, 0], { easing: EASE_LAND, ...clamp }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], clamp),
});

// ---------------------------------------------------------------------------
const InterestRatesGoDown: React.FC<Props> = ({ ink, accent, accentDeep, backdropSrc, vignette, labels }) => {
  const frame = useCurrentFrame();

  // -- camera --------------------------------------------------------------
  const cam = runCam(frame);
  const drift = sway(frame);
  const k = cam.k;
  const tx = W / 2 - cam.cx * k + drift.dx * 0.6;
  const ty = H / 2 - cam.cy * k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;

  // -- gestures ------------------------------------------------------------
  const s = tipS(frame);
  const ghostOp = 0.5 * smoothstep((frame - T.ghost[0]) / (T.ghost[1] - T.ghost[0]));
  const fx = bandX(frame);
  const bandOn = frame >= T.band[0];
  const savingSl = slide(frame, T.saving);

  // a loan dot arrives as the tip reaches it: a short rise and fade
  const dotIn = (sAt: number) => {
    const fAt = firstFrameAt(sAt) - 2;
    return {
      op: interpolate(frame, [fAt, fAt + 7], [0, 1], clamp),
      dy: interpolate(frame, [fAt, fAt + 11], [14, 0], { easing: EASE_LAND, ...clamp }),
    };
  };
  const dots = [
    { ...LOANS[0], a: { op: 1, dy: 0 } },
    { ...LOANS[1], a: { op: 1, dy: 0 } },
    { ...LOANS[2], a: dotIn(S_MAR) },
    { ...LOANS[3], a: dotIn(STEP_LEN) },
  ];

  // readout roll, overlapped so the pair never goes soft: 6% starts leaving on
  // f24 (fades f26-31), 4½% starts rising on f25 (full by f30, settled by f33).
  const R0 = T.roll;
  const outDy = interpolate(frame, [R0, R0 + 8], [0, -24], { easing: Easing.bezier(0.5, 0, 0.75, 0), ...clamp });
  const outOp = interpolate(frame, [R0 + 2, R0 + 7], [1, 0], clamp);
  const inSl = {
    dy: interpolate(frame, [R0 + 1, R0 + 9], [24, 0], { easing: EASE_LAND, ...clamp }),
    op: interpolate(frame, [R0 + 1, R0 + 6], [0, 1], clamp),
  };

  // the hold's travelling highlight along the band's top edge
  const shT = clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0]));
  const shX = X_MAR + (X_JUL - X_MAR) * smoothstep(shT);
  const shOp = Math.sin(Math.PI * shT) * 0.55;

  // -- type helpers --------------------------------------------------------
  const halo = { stroke: SHADE, strokeOpacity: 0.5, paintOrder: "stroke" as const };
  const tick = (x: number, text: string) => (
    <text
      key={`t-${text}`}
      x={x}
      y={BASE + 50}
      textAnchor="middle"
      fill={ink}
      opacity={0.88}
      {...halo}
      strokeWidth={4}
      style={{ fontFamily: fell, fontSize: 34, letterSpacing: 34 * 0.08 }}
    >
      {text}
    </text>
  );
  const scaleLabel = (r: number) => (
    <text
      key={`sc-${r}`}
      x={AXIS_L - 16}
      y={yOfRate(r) + 11}
      textAnchor="end"
      fill={ink}
      opacity={0.5}
      style={{ fontFamily: fell, fontSize: 32 }}
    >
      {`${r}%`}
    </text>
  );

  // month ticks along the axis, May 1904 .. Jul 1905
  const monthTicks: React.ReactNode[] = [];
  for (let m = 0; m <= 15; m++) {
    const x = xOfMonth(m);
    if (x > AXIS_R) break;
    monthTicks.push(
      <line key={`mt-${m}`} x1={x} y1={BASE} x2={x} y2={BASE + (m === 8 ? 14 : 8)} stroke={ink} strokeOpacity={0.4} strokeWidth={2} />,
    );
  }

  const DASH = "12 8";
  const bandW = Math.max(0, fx - X_MAR);

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* ---------------- BACKDROP, world space (oversized 10%) ---------------- */}
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

      {/* ---------------- THE CHART ---------------- */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <pattern id="irHatch" patternUnits="userSpaceOnUse" width={16} height={16} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={16} stroke={accent} strokeWidth={3.8} />
          </pattern>
          <linearGradient id="irFrontGrad" gradientUnits="userSpaceOnUse" x1={fx - 18} y1={0} x2={fx} y2={0}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="irFront" maskUnits="userSpaceOnUse" x={X_MAR - 40} y={Y6 - 40} width={X_JUL - X_MAR + 80} height={Y45 - Y6 + 80}>
            <rect x={X_MAR - 40} y={Y6 - 40} width={X_JUL - X_MAR + 80} height={Y45 - Y6 + 80} fill="url(#irFrontGrad)" />
          </mask>
          <clipPath id="irGap">
            <rect x={X_MAR} y={Y6} width={X_JUL - X_MAR} height={Y45 - Y6} />
          </clipPath>
        </defs>
        <g transform={camT}>
          {/* title */}
          <text
            x={AXIS_L - 60}
            y={232}
            fill={ink}
            opacity={0.9}
            {...halo}
            strokeWidth={4}
            style={{ fontFamily: fellSC, fontSize: 46, letterSpacing: 46 * 0.3 }}
          >
            {labels.title}
          </text>

          {/* faint rate scale: rules at 6 / 5 / 4, like the graticule */}
          {[6, 5, 4].map((r) => (
            <line key={`g-${r}`} x1={AXIS_L} y1={yOfRate(r)} x2={AXIS_R} y2={yOfRate(r)} stroke={ink} strokeOpacity={0.12} strokeWidth={1.6} />
          ))}
          {[6, 5, 4].map(scaleLabel)}

          {/* time axis */}
          <line x1={AXIS_L} y1={BASE} x2={AXIS_R} y2={BASE} stroke={SHADE} strokeOpacity={0.45} strokeWidth={5} />
          <line x1={AXIS_L} y1={BASE} x2={AXIS_R} y2={BASE} stroke={ink} strokeOpacity={0.8} strokeWidth={2.2} />
          {monthTicks}
          {LOANS.map((l, i) => (
            <line key={`lt-${i}`} x1={l.x} y1={BASE} x2={l.x} y2={BASE + 16} stroke={ink} strokeOpacity={0.85} strokeWidth={2.6} />
          ))}
          {tick(X_MAY, labels.may04)}
          {tick(X_NOV, labels.nov04)}
          {tick(X_MAR, labels.mar05)}
          {tick(X_JUL, labels.jul05)}

          {/* Mukden: a thin dashed vertical and an italic note */}
          <line x1={X_MUKDEN} y1={BASE} x2={X_MUKDEN} y2={Y6 - 50} stroke={ink} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 7" />
          <text
            x={X_MUKDEN - 8}
            y={BASE + 96}
            textAnchor="middle"
            fill={ink}
            opacity={0.72}
            {...halo}
            strokeWidth={4}
            style={{ fontFamily: fell, fontStyle: "italic", fontSize: 34 }}
          >
            {labels.mukden}
          </text>

          {/* THE SAVING: orange hatch in the gap, one front Mar -> Jul */}
          {bandOn && bandW > 0.5 ? (
            <g mask="url(#irFront)">
              <g clipPath="url(#irGap)">
                <rect x={X_MAR} y={Y6} width={X_JUL - X_MAR} height={Y45 - Y6} fill={accentDeep} fillOpacity={0.26} />
                <rect x={X_MAR} y={Y6} width={X_JUL - X_MAR} height={Y45 - Y6} fill="url(#irHatch)" opacity={0.7} />
              </g>
            </g>
          ) : null}

          {/* the old 6% level remains, dashed cream; the front turns it orange */}
          {ghostOp > 0 ? (
            <line x1={X_MAR} y1={Y6} x2={X_JUL} y2={Y6} stroke={ink} strokeOpacity={ghostOp} strokeWidth={3} strokeDasharray={DASH} />
          ) : null}
          {bandOn && bandW > 0.5 ? (
            <g mask="url(#irFront)">
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

          {/* the rate: one cream step line, drawn on */}
          <path
            d={STEP_D}
            fill="none"
            stroke={SHADE}
            strokeOpacity={0.5}
            strokeWidth={8.5}
            strokeLinejoin="round"
            strokeDasharray={`${s} ${STEP_LEN + 20}`}
          />
          <path
            d={STEP_D}
            fill="none"
            stroke={ink}
            strokeWidth={5}
            strokeLinejoin="round"
            strokeDasharray={`${s} ${STEP_LEN + 20}`}
          />

          {/* the loans */}
          {dots.map((d, i) =>
            d.a.op > 0 ? (
              <circle
                key={`d-${i}`}
                cx={d.x}
                cy={d.y + d.a.dy}
                r={11}
                fill={ink}
                stroke={SHADE}
                strokeWidth={3}
                opacity={d.a.op}
              />
            ) : null,
          )}

          {/* the note under the band */}
          {savingSl.op > 0 ? (
            <text
              x={(X_MAR + X_JUL) / 2}
              y={Y45 + 60 + savingSl.dy}
              textAnchor="middle"
              fill={ink}
              opacity={savingSl.op * 0.92}
              {...halo}
              strokeWidth={5}
              style={{ fontFamily: fell, fontStyle: "italic", fontSize: 42 }}
            >
              {labels.saving}
            </text>
          ) : null}

          {/* THE READOUT */}
          <g style={{ fontFamily: fell, fontSize: 178 }} fill={ink} {...halo} strokeWidth={6}>
            {outOp > 0 ? (
              <text x={1452} y={512 + outDy} opacity={outOp}>
                6%
              </text>
            ) : null}
            {inSl.op > 0 ? (
              <text x={1452} y={512 + inSl.dy} opacity={inSl.op}>
                4½%
              </text>
            ) : null}
          </g>
        </g>
      </svg>

      {/* ---------------- a soft vignette, screen space ---------------- */}
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

export default InterestRatesGoDown;
