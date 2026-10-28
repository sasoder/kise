// ---------------------------------------------------------------------------
// IAgreeTwice (sam-hold-my-beer, cut 36). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 129 frames. Palette B1 (the stoutShared default). Render with --gl=angle (LitGlobe).
//
// CHECK LINE: "Sam signs off on it twice: it's right for the world, and it's coming whether anyone likes it or not."
//
// THE LINE: "Again, I agree this is the right thing on behalf of the world, and also I agree that this is just,
// like, | the shape of reality and nothing that anyone can stop or should stop." (the cut back lands on "the shape")
// WORD -> FRAME (from the composition start, 23.976 fps): Again -2 · I 5 · agree 10 · this 18 · is 27 · the 30 ·
// right 33 · thing 37 · on 44 · behalf 51 · of 57 · the 64 · world 74 · and 81 · also 85 · I 95 · agree 102 ·
// that 107 · this 111 · is 116 · just 118 · like 123 · the 128 (· shape 130, after the cut).
// DURATION: the slot 36.662 -> 42.042 s = 5.380 s x 23.976 = 129 frames (f0..f128).
//
// THE MOTION: one cream consent card on the board, two rows, each an ink checkbox + "I agree" + its picture: row 1
// the Earth (LitGlobe, real colours, turning), row 2 an amber curve. The camera opens close on row 1 and ticks its
// box on "agree"; it drifts in on the Earth while the pool warms it ("the right thing on behalf of the world"), then
// glides down (k 1.8 -> 1.16, the card ~94 % of the width) on "and also" to frame both rows as the light reaches
// row 2 and lifts it from a greyed (disabled) board row to cream. Row 2's box ticks on the second "agree" while the
// amber curve, lifted above the card on its own shadow, grows from row 2's own line (just right of its "I agree"),
// climbs through the space right of the Earth, steepens, leaves the card past its top-right edge and keeps going
// toward the top of the frame: nothing stops it. The last frame lives on the curve's growth and the globe's turn.
// CONTACT FRAMES: tick 1: the pen tip touches the box f8, short stroke done f9, long stroke rising on f10 ("agree"), the check lands f13.
// tick 2: tip touches f98, short stroke done f99, lands f103 (agree f102: the long stroke is near its end on f102).
// The amber curve's tip starts drawing at f85 ("also"); first reaction of row 2 (tone) f85, cream by f97.
// AMBER = the model / AI progress (the clip's amber); cream = the subject (the card), board = context.
//
// SOURCES: Earth = marsOceanShared MVO_TEX (public/marsocean/mvo_earth_color_4k.jpg, Solar System Scope daymap,
// + mvo_earth_ocean_4k.png shelf mask). No figures; the curve is an unlabelled shape (no data, no axis).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  COLOR,
  ALPHA,
  EDGE,
  ElevationShadow,
  FONT_LABEL,
  GEO,
  AmberGradient,
  StoutStage,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  subWidth,
} from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack, toneFoot, toneTop } from "../kits/cheeky-pint/museShared";
import { ATMO, LitGlobe, MVO_TEX } from "../kits/cheeky-pint/marsOceanShared";

export const FPS = 24000 / 1001;
export const DURATION = 129;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===========================================================================
// THE WORLD (world px = screen px at the final framing: k 1, look (540, 960))
// ===========================================================================
export const CARD = { x: 100, y: 525, w: 880, h: 540 };
export const ROW_H = CARD.h / 2;
export const ROW1 = CARD.y + ROW_H / 2; // 660
export const ROW2 = CARD.y + ROW_H * 1.5; // 930
export const BOX = 74; // checkbox side
export const BOX_X = CARD.x + 36; // checkbox left edge
export const BOX_SW = 6.5; // checkbox outline (world)
export const CHECK_SW = 13; // the check's stroke (world): thick ink, round caps
export const TEXT_PX = 54; // "I agree" (world px; cap 0.718 em = 38.8)
export const TEXT = "I agree";
export const TEXT_X = BOX_X + BOX + 30;
export const TEXT_W = subWidth(TEXT, TEXT_PX);
export const CAP = 0.718 * TEXT_PX;
export const EARTH_R = 108;
export const EARTH_X = TEXT_X + TEXT_W + 46 + EARTH_R;
export const CURVE_W = 23.5; // the amber band (world; ~27 px on screen at the final k 1.15)

// ===========================================================================
// TIMING (frames)
// ===========================================================================
export const T = {
  tick1: [8, 13] as const,
  pushF0: 14,
  pushF1: 70,
  also: 85,
  glideF0: 64,
  glideF1: 100,
  row2Tone: [85, 97] as const,
  tick2: [98, 103] as const,
  curveF0: 85,
  curveF1: 128,
};

// ===========================================================================
// CAMERA: look at row 1 (raised so the Earth stays above the caption band), a slow push onto the Earth, one
// glide down and a little out to both rows on "and also" (k 1.8 -> 1.16, so the payoff stays big), then a creep.
// ===========================================================================
const K0 = 1.7;
const K1 = 1.8;
const LOOK0 = { x: CARD.x + (540 + 12) / K0, y: ROW1 + (960 - 880) / K0 }; // the card's left edge just off frame
const LOOK1 = { x: 410, y: ROW1 + (960 - 868) / K1 };
const KF = 1.16; // the glide's landing: the card fills ~94 % of the width
const LOOKF = { x: 540, y: 990 };
export const CAM = makeClockCam(
  { x: LOOK0.x, y: LOOK0.y, k: K0 },
  [
    { f0: -10, f1: T.pushF1, dx: LOOK1.x - LOOK0.x, dy: LOOK1.y - LOOK0.y, k: K1 },
    { f0: T.glideF0, f1: T.glideF1, dx: LOOKF.x - LOOK1.x, dy: LOOKF.y - LOOK1.y, k: KF },
    { f0: T.glideF1, f1: DURATION + 30, dy: -10 },
  ],
  DURATION,
);
const POOL = makePoolTrack(
  { x: 420, y: ROW1, strength: 1.6 },
  [
    { f0: 12, f1: 70, x: EARTH_X, y: ROW1, strength: 2.6 },
    { f0: 76, f1: 100, x: 600, y: (ROW1 + ROW2) / 2 + 40, strength: 2.0 },
  ],
  DURATION,
);

// ===========================================================================
// THE CHECK: a thick ink tick drawn by a moving tip (short stroke down, long stroke up), round caps
// ===========================================================================
const checkPts = (x0: number, y0: number): [number, number][] => [
  [x0 + BOX * 0.2, y0 + BOX * 0.5],
  [x0 + BOX * 0.42, y0 + BOX * 0.73],
  [x0 + BOX * 0.84, y0 + BOX * 0.2],
];
const segLen = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
/** the drawn part of the check at progress u 0..1 (by arc length; the short leg first) */
const checkPath = (x0: number, y0: number, u: number) => {
  const p = checkPts(x0, y0);
  const l1 = segLen(p[0], p[1]);
  const l2 = segLen(p[1], p[2]);
  const d = clamp01(u) * (l1 + l2);
  if (d <= 0) return "";
  if (d <= l1) {
    const t = d / l1;
    return `M${f3(p[0][0])} ${f3(p[0][1])}L${f3(lerp(p[0][0], p[1][0], t))} ${f3(lerp(p[0][1], p[1][1], t))}`;
  }
  const t = (d - l1) / l2;
  return `M${f3(p[0][0])} ${f3(p[0][1])}L${f3(p[1][0])} ${f3(p[1][1])}L${f3(lerp(p[1][0], p[2][0], t))} ${f3(lerp(p[1][1], p[2][1], t))}`;
};
/** pen progress: the tip touches at f0, the short leg by f0 + 2 (its share of the length), lands at f1 */
const tickU = (f: number, f0: number, f1: number) => {
  const u = clamp01((f - f0) / (f1 - f0));
  // ease in quickly, ease out into the landing (a hand's tick: fast through the corner, settles at the end)
  return u <= 0 ? 0 : 1 - Math.pow(1 - u, 1.8);
};

// ===========================================================================
// THE CURVE: an exponential climb (one shape, no data): flat and low in row 2, then steepening, up past the
// card's top-right edge and off the top of the frame. Sampled by arc length.
// ===========================================================================
const CX0 = TEXT_X + TEXT_W + 40; // on row 2's own line, just right of its "I agree"
const CY0 = ROW2;
const CB = 0.012;
const CA = 2.31; // crosses the card top at x ~876, tip on f128 at x ~920 (screen ~990)
const curveY = (x: number) => CY0 - CA * (Math.exp(CB * (x - CX0)) - 1);
const CURVE = (() => {
  const pts: [number, number][] = [[CX0, CY0]];
  const cum: number[] = [0];
  let x = CX0;
  while (curveY(x) > -600) {
    const slope = CA * CB * Math.exp(CB * (x - CX0));
    x += 1.5 / Math.sqrt(1 + slope * slope);
    const p: [number, number] = [x, curveY(x)];
    const q = pts[pts.length - 1];
    cum.push(cum[cum.length - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]));
    pts.push(p);
  }
  return { pts, cum, len: cum[cum.length - 1] };
})();
const lenToY = (yTarget: number) => {
  for (let i = 0; i < CURVE.pts.length; i++) if (CURVE.pts[i][1] <= yTarget) return CURVE.cum[i];
  return CURVE.len;
};
/** the curve's drawn length at frame f: starts on "also", accelerating, still growing on the last frame */
export const CURVE_END_Y = 215; // world y of the tip on f128 (screen ~y 75 at the final framing)
const L_END = lenToY(CURVE_END_Y);
const curveLen = (f: number) => {
  const u = (f - T.curveF0) / (T.curveF1 - T.curveF0);
  if (u <= 0) return 0;
  // a quicker start (the climb reads by ~f100), then accelerating with the steepening shape
  return L_END * (0.8 * u + 0.2 * u * u * u);
};
/** polyline of the curve from 0 to length d, optionally offset along the upper (lit) normal */
const curvePath = (d: number, off = 0) => {
  if (d <= 0) return "";
  const out: string[] = [];
  const P = CURVE.pts;
  const n = P.length;
  const nrm = (i: number) => {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [ty / l, -tx / l]; // the upper-left side (toward the key light)
  };
  let i = 0;
  for (; i < n && CURVE.cum[i] <= d; i += i < 40 ? 1 : 2) {
    const m = nrm(i);
    out.push(`${out.length ? "L" : "M"}${f3(P[i][0] + m[0] * off)} ${f3(P[i][1] + m[1] * off)}`);
  }
  // the exact tip
  let j = 1;
  while (j < n - 1 && CURVE.cum[j] < d) j++;
  const t = (d - CURVE.cum[j - 1]) / Math.max(1e-6, CURVE.cum[j] - CURVE.cum[j - 1]);
  const m = nrm(j);
  out.push(`L${f3(lerp(P[j - 1][0], P[j][0], t) + m[0] * off)} ${f3(lerp(P[j - 1][1], P[j][1], t) + m[1] * off)}`);
  return out.join("");
};

// ===========================================================================
// PIECES
// ===========================================================================
const Checkbox: React.FC<{ y: number; u: number; ink: string }> = ({ y, u, ink }) => {
  const y0 = y - BOX / 2;
  const inset = BOX_SW / 2;
  const d = checkPath(BOX_X, y0, u);
  return (
    <g>
      <path d={rectPath(BOX_X + inset, y0 + inset, BOX - BOX_SW, BOX - BOX_SW, 7)} fill="none" stroke={ink} strokeWidth={BOX_SW} />
      {d ? <path d={d} fill="none" stroke={ink} strokeWidth={CHECK_SW} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </g>
  );
};

const AgreeText: React.FC<{ y: number; ink: string }> = ({ y, ink }) => (
  <text x={f3(TEXT_X)} y={f3(y + CAP / 2)} fontFamily={FONT_LABEL} fontWeight={500} fontSize={TEXT_PX} fill={ink} style={{ fontFeatureSettings: '"lnum" 1' }}>
    {TEXT}
  </text>
);

const IAgreeTwice: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const pool = POOL(S);
  const band = amberBandFor(cam);

  // row 2: greyed (disabled, board tone, faint ink) -> lit cream with full ink, by tone on "also"
  const dim2 = 1 - smoothstep((S - T.row2Tone[0]) / (T.row2Tone[1] - T.row2Tone[0]));
  const ink2 = mixHex(COLOR.inkDark, toneTop(dim2), 0.9 * dim2);

  // the Earth (screen px: the overlay is not swayed by the stage, so add the same sway)
  const sw = { dx: 3 * Math.sin(S / 23), dy: 5 * Math.sin(S / 19) };
  const ex = 540 + (EARTH_X - cam.x) * k + sw.dx;
  const ey = 960 + (ROW1 - cam.y) * k + sw.dy;
  const lon = 52 - 0.5 * S;

  const L = curveLen(S);
  const cPath = curvePath(L);
  const hot = curvePath(L, CURVE_W / 2 - EDGE.HOT / k / 2);

  const cardSil = [{ d: rectPath(CARD.x, CARD.y, CARD.w, CARD.h, GEO.RADIUS) }];
  const sep = mixHex(COLOR.creamFoot, COLOR.board, 0.55);

  return (
    <StoutStage
      S={S}
      cam={cam}
      rest={CAM.rest}
      pool={pool}
      overlay={
        <LitGlobe
          texture={MVO_TEX.earth}
          ocean={{ mask: MVO_TEX.earthOcean, reveal: 1, glint: 0.35 }}
          cx={ex}
          cy={ey}
          r={EARTH_R * k}
          lon={lon}
          lat={16}
          roll={-12}
          atmosphere={{ ...ATMO.earth, width: ATMO.earth.width * (k / 1.6) }}
          grade={{ exposure: 1.25, sat: 1.08, warm: 0.03, ambient: 0.1, highlight: 0.5 }}
        />
      }
    >
      <defs>
        <linearGradient id="iat-card1" gradientUnits="userSpaceOnUse" x1="0" y1={CARD.y} x2="0" y2={CARD.y + ROW_H}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={mixHex(COLOR.cream, COLOR.creamFoot, 0.5)} />
        </linearGradient>
        <linearGradient id="iat-card2" gradientUnits="userSpaceOnUse" x1="0" y1={CARD.y + ROW_H} x2="0" y2={CARD.y + CARD.h}>
          <stop offset="0" stopColor={mixHex(mixHex(COLOR.cream, COLOR.creamFoot, 0.5), COLOR.board, dim2)} />
          <stop offset="1" stopColor={toneFoot(dim2)} />
        </linearGradient>
        <AmberGradient id="iat-amber" y0={band[0]} y1={band[1]} />
        <radialGradient id="iat-earthsh">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0.5" />
          <stop offset="0.6" stopColor={COLOR.shadow} stopOpacity="0.22" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the card: one object, one shadow */}
      <ElevationShadow silhouette={cardSil} elevation="rest" />
      <path d={rectPath(CARD.x, CARD.y, CARD.w, ROW_H, GEO.RADIUS, true, false)} fill="url(#iat-card1)" />
      <path d={rectPath(CARD.x, CARD.y + ROW_H, CARD.w, ROW_H, GEO.RADIUS, false, true)} fill="url(#iat-card2)" />
      <path d={`M${f3(CARD.x + GEO.RADIUS)} ${f3(CARD.y + EDGE.CREAM / k / 2)}H${f3(CARD.x + CARD.w - GEO.RADIUS)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f3(EDGE.CREAM / k)} />
      <path d={`M${f3(CARD.x + 28)} ${f3(CARD.y + ROW_H)}H${f3(CARD.x + CARD.w - 28)}`} stroke={sep} strokeWidth={f3(2 / k)} />

      {/* the Earth's soft shadow on the card (the sphere itself is the overlay) */}
      <ellipse cx={f3(EARTH_X + 7)} cy={f3(ROW1 + 12)} rx={f3(EARTH_R * 1.08)} ry={f3(EARTH_R * 1.06)} fill="url(#iat-earthsh)" />

      {/* row 1 */}
      <Checkbox y={ROW1} u={tickU(S, T.tick1[0], T.tick1[1])} ink={COLOR.inkDark} />
      <AgreeText y={ROW1} ink={COLOR.inkDark} />

      {/* row 2 */}
      <Checkbox y={ROW2} u={tickU(S, T.tick2[0], T.tick2[1])} ink={ink2} />
      <AgreeText y={ROW2} ink={ink2} />

      {/* the amber curve: lifted above the card on its own shadow, drawn by its tip */}
      {cPath ? (
        <g>
          <UnionShadow sil={[{ d: cPath, stroke: CURVE_W }]} elevation="lifted" />
          <g style={{ filter: bloomFilter(k) }}>
            <path d={cPath} fill="none" stroke="url(#iat-amber)" strokeWidth={CURVE_W} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <path d={hot} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
    </StoutStage>
  );
};

export default IAgreeTwice;
