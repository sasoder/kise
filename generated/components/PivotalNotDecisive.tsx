import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
// The baked map: Natural Earth 10m on the SouthManchuriaRailway projection
// (north-up Lambert conformal conic, parallels 35/50, centre meridian 125 E).
// Read-only here; the armies' slots come from scripts/build-pivotal-map.mjs.
import {
  BORDERS_D,
  CITIES,
  GRATICULE_D,
  LAND_D,
  RAIL_MAIN_D,
  RAIL_NORTH_D,
  RAIL_SOUTH_PTS,
  RAIL_SPUR_PTS,
} from "./manchuriaMapData";
import { DURATION, FPS, T, camAt, dotScreen, dotsAt, smoothstep } from "./pivotalMotion";
import { K_CLOSE } from "./pivotalMapData";

const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// PivotalNotDecisive: the fortress falls, the army turns north, the war still
// stands.
//
// Sarah Paine, Russo-Japanese War: "Another alternative would be 'pivotal
// battle.' Port Arthur is not a decisive battle."
// IN-POINT 36.90 s = f0. 24 fps, f = round((t - 36.90) * 24):
//   another f0 · alternative f10 · would f36 · be f41 · pivotal f44 ·
//   battle f54 · Port f74 · Arthur f79 · is not f89 · a f116 ·
//   decisive f123 · battle f137 (ends f161 = 43.62 s)
// DURATION = 161 + 16 (tail) = 177 frames.
//
// "Port Arthur" is the siege and fall of the fortress: Nogi's Third Army
// besieged it from 1 Aug 1904; the garrison surrendered 2 Jan 1905. Freed,
// Third Army went north to join the armies on the Shaho, where both sides had
// stood entrenched south of Mukden since the Battle of Shaho (Oct 1904). The
// war went on (Sandepu, Mukden, Tsushima). Pivotal, not decisive.
//
// ONE DOT = 3,000 MEN (numbers never on screen):
//   Port Arthur garrison at the surrender   ~24,000  ->  8 cream dots
//   Nogi's Third Army round the fortress    ~90,000  -> 30 orange dots
//   Shaho line, Russian                    ~210,000  -> 70 cream dots
//   Shaho line, Japanese                   ~170,000  -> 57 orange dots
//   (Shaho figures are the Battle of Shaho strengths, used as the standing
//   strengths through the winter.)
// SOURCES (checked 2026-09-28):
//   en.wikipedia.org/wiki/Siege_of_Port_Arthur: siege from 1 Aug 1904,
//     surrender 2 Jan 1905 (signed 5 Jan); "878 army officers and 23,491
//     other ranks" taken prisoner (= ~24,000 -> 8 dots); Nogi then "led the
//     surviving bulk of his army ... north to join Marshal Oyama".
//   en.wikipedia.org/wiki/Battle_of_Shaho: 5-17 Oct 1904, Russian
//     210,000-220,000, Japanese 120,000-170,000; afterwards both sides dug in
//     for the winter, "in some places only a few meters apart".
//   Third Army ~90,000 is the director's figure (its strength at the opening
//     of the siege). NB the same Wikipedia article gives ~150,000 over the
//     siege and ~120,000 marching north (40 dots at 3,000).
//
// COLOUR: orange (#FFB000) = Japan, its army and its gain; the one accent.
// Russia's army is cream. The swords glyph at Port Arthur starts cream
// (Russian-held) and turns orange when it falls.
//
// THE GESTURES, each with its word (one gesture per word, nothing else):
//   1. THE SIEGE, CLOSE — "Another alternative would be" f0-44. The camera is
//      already gliding (from f-30, k 12 up the peninsula on the railway) onto
//      the siege, landing f36 at k 13.5 with the group (fortress, garrison,
//      crescent) centred on (540, 835), then a 2.5% creep. The tip of the
//      peninsula fills the middle of the frame (~450 px). The 8 cream garrison
//      dots stand packed round the 75 px cream swords glyph at the very tip.
//      Third Army's 30 orange dots stand in ONE organic crescent-shaped
//      crowd, 11-19 world px (~17-29 km) north-east of the fortress, across
//      the peninsula from coast to coast (bearings 12-68 deg; the land there
//      spans ~5-73 deg), ~3-4 dots deep, placed as blue noise and relaxed
//      apart (closest pair 27.8 px = 1.64 dots), with ~75 px of empty land
//      between it and the garrison. The creep is the crowd moving as one body:
//      a gentle contraction toward a point well past the fortress (spacing
//      x0.96), each dot's window within ~3 f of its neighbours', the gap
//      narrowing to ~33 px by f44; every dot jitters on its own (~1.3 px,
//      easing to 1.1 by f76).                                        f-30..44
//   2. THE FALL — "pivotal battle" f44-60. The crescent closes over the
//      garrison's position: each dot moves straight to its closed slot (slots
//      1.4 dots apart round the glyph; crescent -> slot by optimal assignment,
//      so paths never cross; one path bends round a north-shore inlet), all on
//      one ease f44-55, the inner edge on the glyph ~f48-49; the glyph
//      crossfades cream -> orange f48-62 (14 f); the garrison, drawn over the
//      crescent, fades out one by one f48-~57, 7 f each, shrinking 18%: they
//      surrender, they don't explode.                                 f44-62
//   3. "Port Arthur" slides up 24 px while fading in (IM Fell English
//      roman), f66, landed on "Port" f74. The camera is creeping.     f66-74
//   4. THE PIVOT — f60-78: the ring peels off in order of angular distance
//      to the railway's bearing out of Port Arthur (so it unwinds onto the
//      line), each dot on one cubic arc onto the railway, then up the line in
//      its own hashed lane, clamped to a land corridor (single file through
//      the Jinzhou isthmus) and smoothed. March pace: slow at the close-up
//      (0.55), quick on the run north when the camera moves with the column
//      (1.5, f76-98), slow again as the camera pushes in (0.7, f110-126).
//   5. THE CAMERA FOLLOWS THE COLUMN NORTH — "is not a decisive battle"
//      f72-130: pull-back on the siege (k 13.8 -> 4.6, f72-86, the front still
//      off-frame), one travel along a cubic that leaves on the railway's
//      heading up the peninsula and arrives on its heading into the front
//      (velocity up f78-94, held, down f104-124), and a push-in on the front
//      (k 4.6 -> 13, f100-130): position at rest f124, k 11.9 at "decisive"
//      f123 and 13.0 by f130. The front is first in frame at f85.  f72-130
//   6. THE COLUMN ARRIVES, THE FRONT STILL STANDS — "battle" f133-161: the
//      column comes up the line, leaves it just behind the Japanese band and
//      runs along a back lane one band-spacing behind its backmost dots, then
//      steps up into its slots, spreading along the band (a slot fills before
//      any slot just behind it; otherwise the furthest along the lane goes
//      first), landing f133-156. The front: two WIDE, SHALLOW blue-noise
//      bands along the Shaho line (~41.58 N, 122.97-123.97 E, ~83 km, a slight
//      natural bow), ~700 px wide at k 13; Russians (cream, ~75 px deep)
//      north, Japanese (orange, ~64 px, ~91 px once Third Army is in) south,
//      a thin empty strip between them that is the front itself (no line
//      drawn), centred on y835. The front does not move; every dot breathes
//      (~1.1 px hashed wobble).
//   7. TAIL f161-177: the camera's 2% creep (from f118, still moving on the
//      last frame) and the house sway. Nothing new.
//
// SIZES: dots are one screen size law, diameter 17 px at k 13.5 scaled
// k^0.35 (16.8 px at k 13, 11.7 at the k 4.6 run). The swords glyph 75 px at
// k 13.5, same law. Dots have a thin dark rim so they separate from the
// railway symbol. Band dots (and landed arrivals) never grow past what keeps
// 1.4 diameters to their neighbours at the current zoom: full size from the
// landing on, smaller while the bands are far off during the run north.
// SPACING (no two dots touch; checked every frame, centre spacing in dot
// diameters): crescent >= 1.41 through the creep f0-43; the fall >= 1.05;
// both bands >= 1.43 on every frame they are in shot; arriving dots vs the
// band >= 1.46. (Column dots in transit on the railway are not spaced.)
// CHECKS: every visible dot <= ~41 screen px/frame (joint camera x march
// search); camera velocity continuous (smoothstep velocity profiles,
// smootherstep zooms); the garrison and the crescent on land through the
// creep and the close; the column's centre strays <= 2.8 screen px off the
// 10m coast, at the Jinzhou isthmus during the k 4.6 run; nothing important
// below y1150 after the landing.
// ---------------------------------------------------------------------------

export const SEA = "#1B2226";
export const LAND = "#3F3428";
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
const CORE = "#15120E"; // the dark core of the railway symbol
const DARK = "#0B0907";

export const schema = z.object({
  sea: z.string(),
  land: z.string(),
  ink: z.string(),
  accent: z.string(),
  grainSrc: z.string(),
  mottleSrc: z.string(),
  vignette: z.number(),
  portArthur: z.string(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  sea: SEA,
  land: LAND,
  ink: INK,
  accent: ACCENT,
  grainSrc: "manchuria/grain.png",
  mottleSrc: "manchuria/mottle.png",
  vignette: 0.55,
  portArthur: "Port Arthur",
});

const W = 1080;
const H = 1920;
const LABEL_TRAVEL = 24;
const LABEL_FRAMES = 14;
const LABEL_FADE = 9;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const clampX = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const sway = (f: number) => ({ dy: 5 * Math.sin(f / 19), dx: 3 * Math.sin(f / 23) });

type P2 = [number, number];
const dOf = (pts: P2[]) => `M${pts.map(([x, y]) => `${x},${y}`).join("L")}`;
// Reversed so the chequer's dash origin is Port Arthur, as in the reference.
const SOUTH_REV_D = dOf([...(RAIL_SOUTH_PTS as P2[])].reverse());
const SPUR_D = dOf(RAIL_SPUR_PTS as P2[]);

// --- Lucide `swords` (lucide-static, ISC), as in NotConveyingAnything --------
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
const SW_GLYPH = 2.6; // screen px, non-scaling
const GLYPH_CLOSE = 75; // screen px box at K_CLOSE: the anchor of the siege frame

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

const PivotalNotDecisive: React.FC<Props> = ({ sea, land, ink, accent, grainSrc, mottleSrc, vignette, portArthur }) => {
  const frame = useCurrentFrame();

  // -- camera: world (cx, c) on screen (540, 835), plus the house sway -------
  const cam = camAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx / k;
  const cy = cam.cy + drift.dy / k;
  const tx = W / 2 - cx * k;
  const ty = H / 2 - cy * k;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const px = (v: number) => v / k;
  const law = Math.pow(k / K_CLOSE, 0.35); // the dot / glyph size law

  // -- the railway symbol (reference weights) --------------------------------
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

  // -- water lines: offset contours of the coast, fading outward -------------
  const wlGap = 6.5 * Math.pow(k, 0.45);
  const wlW = 1.15;
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  const waterLines: React.ReactNode[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = wlGap * (i + 1);
    waterLines.push(
      <path key={`wl-a-${i}`} d={LAND_D} fill="none" stroke={mixHex(sea, ink, wlOp[i])} strokeWidth={px(2 * d + wlW)} strokeLinejoin="round" />,
      <path key={`wl-b-${i}`} d={LAND_D} fill="none" stroke={sea} strokeWidth={px(2 * d - wlW)} strokeLinejoin="round" />,
    );
  }

  // -- the fortress glyph: cream -> orange as it falls ----------------------
  const pa = CITIES.portArthur;
  const fallT = smoothstep((frame - T.glyph[0]) / (T.glyph[1] - T.glyph[0]));
  const glyphCol = mixHex(ink, accent, fallT);
  const gBox = GLYPH_CLOSE * law; // screen px
  const gScale = px(gBox) / 24;

  // -- the label ------------------------------------------------------------
  const labDy = interpolate(frame, [T.label, T.label + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...clampX });
  const labOp = interpolate(frame, [T.label, T.label + LABEL_FADE], [0, 1], clampX);
  const labSize = 50 * Math.pow(k / K_CLOSE, 0.18); // screen px

  // -- the armies -------------------------------------------------------------
  const dots = dotsAt(frame, k);
  const rDot = px(dotScreen(k) / 2);

  // mottle tiles, world space
  const TILE = 640;
  const tiles: { x: number; y: number }[] = [];
  for (let y = -320; y < 2240; y += TILE) for (let x = -320; x < 1400; x += TILE) tiles.push({ x, y });

  return (
    <AbsoluteFill style={{ backgroundColor: sea }}>
      {/* ---------------- THE MAP: sea, water-lines, land, ink ---------------- */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="pndLandClip">
            <path d={LAND_D} clipRule="evenodd" />
          </clipPath>
        </defs>
        <g transform={camT}>
          <rect x={-400} y={-400} width={1880} height={2720} fill={sea} />
          {waterLines}
          <path d={GRATICULE_D} fill="none" stroke={ink} strokeOpacity={0.12} strokeWidth={px(1.2)} />
          <path d={LAND_D} fill={land} fillRule="evenodd" />
          <g clipPath="url(#pndLandClip)">
            <path d={LAND_D} fill="none" stroke={LAND_RIM} strokeOpacity={0.2} strokeWidth={px(28)} strokeLinejoin="round" />
            <path d={LAND_D} fill="none" stroke={LAND_RIM} strokeOpacity={0.28} strokeWidth={px(10)} strokeLinejoin="round" />
            <path d={GRATICULE_D} fill="none" stroke={ink} strokeOpacity={0.07} strokeWidth={px(1.2)} />
          </g>
          <path d={BORDERS_D} fill="none" stroke={ink} strokeOpacity={0.5} strokeWidth={px(1.7)} strokeDasharray={`${px(8)} ${px(5)}`} strokeLinecap="round" />
          <path d={LAND_D} fill="none" stroke={ink} strokeOpacity={0.82} strokeWidth={px(1.5)} strokeLinejoin="round" />
        </g>
      </svg>

      {/* ---------------- PAPER MOTTLING, world space ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: 0.9,
        }}
      >
        {tiles.map((t, i) => (
          <Img key={`m-${i}`} src={staticFile(mottleSrc)} style={{ position: "absolute", left: t.x, top: t.y, width: TILE + 1, height: TILE + 1 }} />
        ))}
      </div>

      {/* ---------------- RAILWAY, FORTRESS, ARMIES, LABEL ---------------- */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <g transform={camT}>
          {railCream(RAIL_MAIN_D, "main")}
          {railCream(RAIL_NORTH_D, "north")}
          {railCream(SOUTH_REV_D, "south")}
          {railCream(SPUR_D, "spur")}

          {/* the fortress: a dark seat under the swords, so they read over the line */}
          <circle cx={pa.x} cy={pa.y} r={px(gBox * 0.47)} fill="#17120D" fillOpacity={0.78} />
          <g transform={`translate(${pa.x} ${pa.y}) scale(${gScale.toFixed(6)}) translate(-12 -12)`}>
            {SWORDS.map((d) => (
              <path key={`h-${d}`} d={d} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={SW_GLYPH + 2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ))}
            {SWORDS.map((d) => (
              <path key={`i-${d}`} d={d} fill="none" stroke={glyphCol} strokeWidth={SW_GLYPH} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ))}
          </g>

          {/* the armies: solid dots, one per 3,000 men */}
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

          {/* PORT ARTHUR: the only word */}
          {labOp > 0 ? (
            <text
              x={pa.x}
              y={pa.y + px(gBox * 0.5 + 62) + px(labDy)}
              textAnchor="middle"
              opacity={labOp}
              fill={ink}
              stroke={sea}
              strokeOpacity={0.55}
              strokeWidth={px(labSize * 0.12)}
              paintOrder="stroke"
              style={{ fontFamily: fell, fontSize: px(labSize) }}
            >
              {portArthur}
            </text>
          ) : null}
        </g>
      </svg>

      {/* ---------------- PAPER: grain and vignette, screen space ---------------- */}
      <Img src={staticFile(grainSrc)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(3)}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default PivotalNotDecisive;
