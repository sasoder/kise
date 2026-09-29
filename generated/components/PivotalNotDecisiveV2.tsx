import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
import {
  BORDERS_D,
  GRATICULE_D,
  LAND_D,
  RAIL_MAIN_D,
  RAIL_NORTH_D,
  RAIL_SOUTH_PTS,
  RAIL_SPUR_PTS,
} from "./manchuriaMapData";
import { T, dotScreen, dotsAt, smoothstep } from "./pivotalMotion";
import { AXIS_Y, GLYPH, K_WIDE, X_MID } from "./NotConveyingAnything";
import {
  CAP_AT,
  DURATION,
  END_CAP_LIT,
  FPS,
  INK_AT,
  INK_HALF,
  LIGHT_AT,
  OTHERS,
  PA_ROW,
  T2,
  X_END,
  X_START,
  axisTips,
  emphX,
  glyphAt,
  mapOpacity,
  mapXform,
  rowCam,
  rowXform,
  sway,
} from "./pivotalV2Motion";

const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// PivotalNotDecisiveV2: the fortress falls, and the war runs on past it.
//
// Sarah Paine, Russo-Japanese War: "Another alternative would be 'pivotal
// battle.' Port Arthur is not a decisive battle."
// IN-POINT 36.90 s = f0. 24 fps, f = round((t - 36.90) * 24):
//   another f0 · alternative f10 · would f36 · be f41 · pivotal f44 ·
//   battle f54 · Port f74 · Arthur f79 · is not f89 · a f116 ·
//   decisive f123 · battle f137 (ends f161 = 43.62 s)
// DURATION = 161 + 16 (tail) = 177 frames.
//
// In this clip "decisive" was defined as WAR-WINNING (cut 1,
// NotConveyingAnything). So "not decisive" is shown as: the fortress falls
// (orange), then lands on the war's own timeline, and the war visibly runs on
// past it (Sandepu, Mukden, Tsushima) to the Treaty of Portsmouth, 5 Sep 1905,
// eight months later.
//
// THE GESTURES, each with its word:
//   1. THE SIEGE — "Another alternative would be pivotal battle. Port Arthur"
//      f0-79: V1 (PivotalNotDecisive) unchanged: the crescent creeping on the
//      fortress, closing over the garrison on "pivotal", the swords turning
//      orange f48-62, the garrison fading one by one, the label landing on
//      "Port" f74. Same motion module (pivotalMotion); V1's travel north is
//      switched off (it starts f78, so f0-78 are V1's frames exactly and f79
//      is within half a pixel).                                        f0-79
//   2. THE MATCH CUT — f80-112, one continuous move. The map camera pulls
//      back (k x0.5, f80-106) while every map layer (sea, coast, water-lines,
//      rail, dots, mottling, grain, V1 vignette) fades to cut 1's bare umber
//      page (f80-100) and the row world pulls back too (k 1.3 x 0.645 ->
//      0.645, f80-112). The orange swords never leave: in screen space they
//      glide and scale from their map position (75 px at k 13.5, k^0.35) into
//      their slot on cut 1's row, the fall of Port Arthur, 2 Jan 1905, land
//      tier 1 (f80-102). "Port Arthur" rides with them and re-anchors under
//      the glyph, below the axis, at 36 px. The time axis draws out from under
//      the glyph both ways (f88-108), each battle inks in at 0.5 as the axis
//      reaches its date, and each cap draws as its tip arrives (f108-114). The
//      resolved frame (f112-114) is cut 1's settled wide shot: same row, tiers,
//      stems, k 0.645, centre; only the Port Arthur glyph is orange with its
//      label, and there is no IMPORTANT.                            f80-114
//   3. THE WAR RUNS ON — "is not a decisive battle" f116-152: a full-cream
//      emphasis (cut 1's emphasis look, ONE direction) travels the axis from
//      Port Arthur rightward only, reaching the end cap (the Treaty of
//      Portsmouth) f137 on "battle"; Sandepu, Mukden and Tsushima lift
//      0.5 -> 1.0 on contact (1 -> 1.06 -> 1 settle) and stay lit; the end cap
//      lifts to full. Port Arthur stays orange; everything before it stays at
//      0.5.                                                        f116-152
//   4. TAIL f150-177: 2% creep on the row and the house sway. Nothing new.
//
// The only text is "Port Arthur". Orange is on the Port Arthur glyph only
// (and, through f100, on V1's Third Army dots as they fade with the map).
// SOURCES: as V1 (siege: en.wikipedia.org/wiki/Siege_of_Port_Arthur; Shaho:
// en.wikipedia.org/wiki/Battle_of_Shaho); battle dates as cut 1's header.
// ---------------------------------------------------------------------------

const W = 1080;
const H = 1920;
export const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
const CORE = "#15120E";
const DARK = "#0B0907";
const SHADE = "#140F0A"; // cut 1's halo

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  grainSrc: z.string(),
  mottleSrc: z.string(),
  backdropSrc: z.string(),
  mapVignette: z.number(),
  pageVignette: z.number(),
  portArthur: z.string(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  grainSrc: "manchuria/grain.png",
  mottleSrc: "manchuria/mottle.png",
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  mapVignette: 0.55,
  pageVignette: 0.32,
  portArthur: "Port Arthur",
});

const LABEL_TRAVEL = 24;
const LABEL_FRAMES = 14;
const LABEL_FADE = 9;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const clampX = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// cut 1's strokes, screen px (non-scaling)
const SW_GLYPH = 2.6;
const SW_AXIS = 2.2;
const SW_STEM = 1.4;
const SW_EMPH = SW_AXIS * 1.6;
const HALO = 3;
const HALO_GLYPH = 2;
const HALO_OP = 0.45;
const DIM = 0.5;
const CAP_HALF = 14;

type P2 = [number, number];
const dOf = (pts: P2[]) => `M${pts.map(([x, y]) => `${x},${y}`).join("L")}`;
const SOUTH_REV_D = dOf([...(RAIL_SOUTH_PTS as P2[])].reverse());
const SPUR_D = dOf(RAIL_SPUR_PTS as P2[]);

// Lucide `swords` (lucide-static, ISC), as in NotConveyingAnything
const SWORDS = [
  "m13 19 6-6",
  "M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5",
  "m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586",
  "m16 16 4 4",
  "m19 21 2-2",
  "m5 14 4 4",
  "m5 21-2-2",
  "M7.5 16.5 4 20",
];
const ns = { vectorEffect: "non-scaling-stroke" as const };

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

const Swords: React.FC<{ color: string; haloColor: string }> = ({ color, haloColor }) => (
  <>
    {SWORDS.map((d) => (
      <path key={`h-${d}`} d={d} fill="none" stroke={haloColor} strokeOpacity={HALO_OP} strokeWidth={SW_GLYPH + HALO_GLYPH} strokeLinecap="round" strokeLinejoin="round" {...ns} />
    ))}
    {SWORDS.map((d) => (
      <path key={`i-${d}`} d={d} fill="none" stroke={color} strokeWidth={SW_GLYPH} strokeLinecap="round" strokeLinejoin="round" {...ns} />
    ))}
  </>
);

const PivotalNotDecisiveV2: React.FC<Props> = ({
  ink,
  accent,
  grainSrc,
  mottleSrc,
  backdropSrc,
  mapVignette,
  pageVignette,
  portArthur,
}) => {
  const frame = useCurrentFrame();
  const drift = sway(frame);

  // ======================= THE MAP (V1), fading out ========================
  const mOp = mapOpacity(frame);
  const m = mapXform(frame);
  const k = m.k;
  const camT = `translate(${m.tx.toFixed(3)} ${m.ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const px = (v: number) => v / k;
  const RW = 6.5;
  const DASH = 9;
  const railCream = (d: string, key: string) => (
    <g key={key} fill="none" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.55} strokeWidth={px(RW + 3.5)} />
      <path d={d} stroke={ink} strokeWidth={px(RW)} />
      <path d={d} stroke={CORE} strokeWidth={px(RW - 3)} />
      <path d={d} stroke={ink} strokeWidth={px(RW - 3)} strokeDasharray={`${px(DASH)} ${px(DASH)}`} />
    </g>
  );
  const wlGap = 6.5 * Math.pow(k, 0.45);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  const waterLines: React.ReactNode[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = wlGap * (i + 1);
    waterLines.push(
      <path key={`wl-a-${i}`} d={LAND_D} fill="none" stroke={mixHex(SEA, ink, wlOp[i])} strokeWidth={px(2 * d + 1.15)} strokeLinejoin="round" />,
      <path key={`wl-b-${i}`} d={LAND_D} fill="none" stroke={SEA} strokeWidth={px(2 * d - 1.15)} strokeLinejoin="round" />,
    );
  }
  const dots = mOp > 0.001 ? dotsAt(frame, k) : [];
  const rDot = px(dotScreen(k) / 2);
  const TILE = 640;
  const tiles: { x: number; y: number }[] = [];
  for (let y = -320; y < 2240; y += TILE) for (let x = -320; x < 1400; x += TILE) tiles.push({ x, y });

  // ======================= THE ROW (cut 1's page) ==========================
  const r = rowXform(frame);
  const rowT = `translate(${r.tx.toFixed(3)} ${r.ty.toFixed(3)}) scale(${r.k.toFixed(5)})`;
  // the page: <= 5% parallax scale with the row's zoom and cut 1's 5% pan parallax
  const rc = rowCam(frame);
  const bgScale = 1 + 0.05 * Math.max(0, Math.min(1, (rc.k / K_WIDE - 1) / 0.8));
  const bgX = 0.05 * (X_MID - rc.cx) * rc.k + drift.dx * 0.3;
  const tips = axisTips(frame);
  const axisOn = frame >= T2.axis[0];
  const capU = smoothstep((frame - CAP_AT) / T2.caps);
  const ex = emphX(frame);
  const emphOn = frame >= T2.emph[0] && ex > PA_ROW.x + 0.5;
  const tip = Math.min(18 / r.k, (ex - PA_ROW.x) * 0.45) * Math.min(1, (X_END - ex) / (40 / r.k));
  const tipOff = ex - PA_ROW.x > 0.5 ? tip / (ex - PA_ROW.x) : 0;
  const endLit = 1 - Math.pow(1 - Math.max(0, Math.min(1, (frame - END_CAP_LIT) / T2.light)), 3);

  // ======================= THE GLYPH + LABEL (screen) =======================
  const g = glyphAt(frame);
  const fallT = smoothstep((frame - T.glyph[0]) / (T.glyph[1] - T.glyph[0]));
  const glyphCol = mixHex(ink, accent, fallT);
  const labDy = interpolate(frame, [T.label, T.label + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...clampX });
  const labOp = interpolate(frame, [T.label, T.label + LABEL_FADE], [0, 1], clampX);
  const labHalo = mixHex(SEA, SHADE, g.e);

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* ---------------- cut 1's page, under everything ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: `540px 835px`,
          transform: `translate(${bgX.toFixed(3)}px, ${(drift.dy * 0.25).toFixed(3)}px) scale(${bgScale.toFixed(5)})`,
        }}
      >
        <Img src={staticFile(backdropSrc)} style={{ position: "absolute", left: -W * 0.05, top: -H * 0.05, width: W * 1.1, height: H * 1.1 }} />
      </div>
      <AbsoluteFill
        style={{
          opacity: 1 - mOp,
          background: `radial-gradient(ellipse 85% 85% at 50% 46%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(pageVignette * 0.5).toFixed(3)}) 82%, rgba(8,6,4,${pageVignette.toFixed(3)}) 100%)`,
        }}
      />

      {/* ---------------- THE MAP (V1), fading to the page ----------------
          V1's layer order: map, mottling, rail, fortress glyph, dots, label,
          grain, vignette. Every map layer carries the map's opacity; the
          glyph and its label never fade. */}
      {mOp > 0.001 ? (
        <AbsoluteFill style={{ opacity: mOp }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
            <defs>
              <clipPath id="pnd2LandClip">
                <path d={LAND_D} clipRule="evenodd" />
              </clipPath>
            </defs>
            <g transform={camT}>
              <rect x={-400} y={-400} width={1880} height={2720} fill={SEA} />
              {waterLines}
              <path d={GRATICULE_D} fill="none" stroke={ink} strokeOpacity={0.12} strokeWidth={px(1.2)} />
              <path d={LAND_D} fill={LAND} fillRule="evenodd" />
              <g clipPath="url(#pnd2LandClip)">
                <path d={LAND_D} fill="none" stroke={LAND_RIM} strokeOpacity={0.2} strokeWidth={px(28)} strokeLinejoin="round" />
                <path d={LAND_D} fill="none" stroke={LAND_RIM} strokeOpacity={0.28} strokeWidth={px(10)} strokeLinejoin="round" />
                <path d={GRATICULE_D} fill="none" stroke={ink} strokeOpacity={0.07} strokeWidth={px(1.2)} />
              </g>
              <path d={BORDERS_D} fill="none" stroke={ink} strokeOpacity={0.5} strokeWidth={px(1.7)} strokeDasharray={`${px(8)} ${px(5)}`} strokeLinecap="round" />
              <path d={LAND_D} fill="none" stroke={ink} strokeOpacity={0.82} strokeWidth={px(1.5)} strokeLinejoin="round" />
            </g>
          </svg>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              transformOrigin: "0 0",
              transform: `translate(${m.tx}px, ${m.ty}px) scale(${k})`,
              opacity: 0.9,
            }}
          >
            {tiles.map((t, i) => (
              <Img key={`m-${i}`} src={staticFile(mottleSrc)} style={{ position: "absolute", left: t.x, top: t.y, width: TILE + 1, height: TILE + 1 }} />
            ))}
          </div>
        </AbsoluteFill>
      ) : null}
      {mOp > 0.001 ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", opacity: mOp }}>
          <g transform={camT}>
            {railCream(RAIL_MAIN_D, "main")}
            {railCream(RAIL_NORTH_D, "north")}
            {railCream(SOUTH_REV_D, "south")}
            {railCream(SPUR_D, "spur")}
          </g>
        </svg>
      ) : null}

      {/* ---------------- THE ROW: the war on its time axis ---------------- */}
      {axisOn ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="pnd2Emph" gradientUnits="userSpaceOnUse" x1={PA_ROW.x} y1={0} x2={ex} y2={0}>
              <stop offset={0} stopColor={ink} stopOpacity={1} />
              <stop offset={Math.max(0, 1 - tipOff)} stopColor={ink} stopOpacity={1} />
              <stop offset={1} stopColor={ink} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pnd2EmphHalo" gradientUnits="userSpaceOnUse" x1={PA_ROW.x} y1={0} x2={ex} y2={0}>
              <stop offset={0} stopColor={SHADE} stopOpacity={HALO_OP} />
              <stop offset={Math.max(0, 1 - tipOff)} stopColor={SHADE} stopOpacity={HALO_OP} />
              <stop offset={1} stopColor={SHADE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <g transform={rowT}>
            {/* the axis, drawing out both ways from under Port Arthur, at 0.5 */}
            <g opacity={DIM}>
              {[
                [SHADE, HALO_OP, SW_AXIS + HALO],
                [ink, 1, SW_AXIS],
              ].map(([c, o, w]) => (
                <g key={`ax-${c}`}>
                  <path
                    d={`M${tips.xl},${AXIS_Y}H${tips.xr}`}
                    fill="none"
                    stroke={c as string}
                    strokeOpacity={o as number}
                    strokeWidth={w as number}
                    strokeLinecap="round"
                    {...ns}
                  />
                  {capU > 0.001 ? (
                    <path
                      d={`M${X_START},${AXIS_Y - CAP_HALF * capU}V${AXIS_Y + CAP_HALF * capU}M${X_END},${AXIS_Y - CAP_HALF * capU}V${AXIS_Y + CAP_HALF * capU}`}
                      fill="none"
                      stroke={c as string}
                      strokeOpacity={o as number}
                      strokeWidth={w as number}
                      strokeLinecap="round"
                      {...ns}
                    />
                  ) : null}
                </g>
              ))}
            </g>

            {/* the war runs on: Port Arthur -> the end cap, one direction */}
            {emphOn ? (
              <g>
                <path d={`M${PA_ROW.x},${AXIS_Y}H${ex}`} fill="none" stroke="url(#pnd2EmphHalo)" strokeWidth={SW_EMPH + HALO} {...ns} />
                <path d={`M${PA_ROW.x},${AXIS_Y}H${ex}`} fill="none" stroke="url(#pnd2Emph)" strokeWidth={SW_EMPH} {...ns} />
              </g>
            ) : null}
            {endLit > 0.001 ? (
              <g opacity={endLit}>
                {[
                  [SHADE, HALO_OP, SW_EMPH + HALO],
                  [ink, 1, SW_EMPH],
                ].map(([c, o, w]) => (
                  <path
                    key={`cap-${c}`}
                    d={`M${X_END},${AXIS_Y - CAP_HALF}V${AXIS_Y + CAP_HALF}`}
                    fill="none"
                    stroke={c as string}
                    strokeOpacity={o as number}
                    strokeWidth={w as number}
                    strokeLinecap="round"
                    {...ns}
                  />
                ))}
              </g>
            ) : null}

            {/* the other ten battles: ink in at 0.5 as the axis reaches them;
                those after Port Arthur lift to 1.0 as the war runs on */}
            {OTHERS.map((b) => {
              const inkU = smoothstep((frame - (INK_AT.get(b.name) ?? 999)) / T2.ink);
              if (inkU <= 0.001) return null;
              const lf = LIGHT_AT.get(b.name);
              const u = lf === undefined ? 0 : Math.max(0, Math.min(1, (frame - lf) / T2.light));
              const lit = 1 - Math.pow(1 - u, 3);
              const op = DIM * inkU + (1 - DIM) * lit;
              const s = 1 + 0.06 * Math.sin(Math.PI * smoothstep(u));
              const gs = (GLYPH / 24) * s;
              return (
                <g key={b.name} opacity={op}>
                  {b.stem
                    ? [
                        [SHADE, HALO_OP, SW_STEM + HALO_GLYPH],
                        [ink, 1, SW_STEM],
                      ].map(([c, o, w]) => (
                        <path
                          key={`st-${c}`}
                          d={`M${b.x.toFixed(3)},${b.stem![0]}V${b.stem![1]}`}
                          fill="none"
                          stroke={c as string}
                          strokeOpacity={o as number}
                          strokeWidth={w as number}
                          {...ns}
                        />
                      ))
                    : null}
                  <g transform={`translate(${b.x.toFixed(3)} ${b.y}) scale(${gs.toFixed(5)}) translate(-12 -12)`}>
                    <Swords color={ink} haloColor={SHADE} />
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      ) : null}

      {/* ---------------- PORT ARTHUR: the glyph that never leaves ---------------- */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        {/* V1's dark seat under the swords, fading with the map */}
        <circle cx={g.x} cy={g.y} r={g.size * 0.47} fill="#17120D" fillOpacity={0.78 * mOp} />
        <g transform={`translate(${g.x.toFixed(3)} ${g.y.toFixed(3)}) scale(${(g.size / 24).toFixed(5)}) translate(-12 -12)`}>
          <Swords color={glyphCol} haloColor={mixHex(DARK, SHADE, g.e)} />
        </g>
      </svg>

      {/* the armies (V1), fading with the map */}
      {mOp > 0.001 ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", opacity: mOp }}>
          <g transform={camT}>
            {dots.map((d) => (
              <circle
                key={d.id}
                cx={d.x}
                cy={d.y}
                r={rDot * d.scale}
                fill={d.orange ? accent : ink}
                fillOpacity={d.op}
                stroke={DARK}
                strokeOpacity={0.6 * d.op}
                strokeWidth={px(1.6)}
              />
            ))}
          </g>
        </svg>
      ) : null}

      {/* the label, riding with the glyph */}
      {labOp > 0 ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
          <text
            x={g.x}
            y={g.y + g.labOff + labDy}
            textAnchor="middle"
            opacity={labOp}
            fill={ink}
            stroke={labHalo}
            strokeOpacity={0.55}
            strokeWidth={g.labSize * 0.12}
            paintOrder="stroke"
            style={{ fontFamily: fell, fontSize: g.labSize }}
          >
            {portArthur}
          </text>
        </svg>
      ) : null}

      {/* V1's paper: grain and vignette, fading with the map */}
      {mOp > 0.001 ? (
        <>
          <Img src={staticFile(grainSrc)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: mOp }} />
          <AbsoluteFill
            style={{
              opacity: mOp,
              background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(mapVignette * 0.45).toFixed(3)}) 75%, rgba(8,6,4,${mapVignette.toFixed(3)}) 100%)`,
            }}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// the INK_HALF import documents where contact is measured (the glyph's ink)
void INK_HALF;

export default PivotalNotDecisiveV2;
