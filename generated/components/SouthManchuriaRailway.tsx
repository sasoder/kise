import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camEase,
  clamp,
  clamp01,
  smoothstep,
  sway,
} from "./fieldShared";
// The baked map: Natural Earth 10m on a north-up Lambert conformal conic,
// parallels 35/50, centre meridian 125 E. Written by
// `scripts/build-manchuria-map.mjs`; nothing here re-derives it.
import {
  BORDERS_D,
  CITIES,
  GRATICULE_D,
  JAPAN_D,
  KWANTUNG_D,
  KWANTUNG_NORTH_D,
  LAND_D,
  MANCHURIA_ARC_D,
  PLACES,
  RAIL_MAIN_D,
  RAIL_NORTH_D,
  RAIL_SOUTH_PTS,
  RAIL_SPUR_PTS,
  RUSSIA_ARC_D,
  STATION_S,
} from "./manchuriaMapData";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
loadFell("italic", { weights: ["400"], subsets: ["latin"] });

export const FPS = 24;
export const DURATION = 132; // 5.5 s

// ---------------------------------------------------------------------------
// "…but they also get the southern half of the Russians' railway concessions
// in Manchuria, and the naval base." Russo-Japanese War, the 1905 Treaty of
// Portsmouth. "They" is Japan.
//
// A ONE-OFF LOOK: a realistic, slightly vintage map, dark with the house orange
// as the only accent. Not the Dwarkesh grid, no grid background. Opaque,
// 1080x1920, 24 fps.
//   sea    #1B2226 with 4 engraved water-lines following the coast, fading out
//   land   #3A3127 with a lighter hand-coloured rim inside the coast
//   ink    #E9DDBF cream: coast, graticule (5 deg, 0.12), 1905 borders (dashed
//          0.5: Russia-China incl. the then-Qing Mongolia line, Korea-China /
//          Korea-Russia; Korea one country, no DMZ), all type
//   accent #FFB000 / #D98A0C = Japan, and nothing else
//   paper  world-space mottling (public/manchuria/mottle.png) + screen-space
//          grain (grain.png), both baked once, plus a soft vignette
//   type   IM Fell English SC for regions (spaced caps), IM Fell English roman
//          for cities, italic for seas. Every label slides up 24 px while it
//          fades in; nothing pops.
//   rail   the chequered railway symbol: cream casing, dark core, cream dashes.
//          Japan's section is the same symbol in orange, a little heavier.
//
// THE GESTURES, each with its word (frames at 24 fps, even speech pacing):
//   1. WIDE ESTABLISHING SHOT, k 1: the whole T, Manzhouli -> Vladivostok and
//      Harbin -> Port Arthur, already drawn in cream (Russia's). Korea, the Sea
//      of Japan and western Honshu / northern Kyushu bottom right. Region
//      names slide up in a light stagger          — "but they also get"   f0-14
//      Harbin and Vladivostok, Russia's two ends, slide up        f6-20
//   2. JAPAN TURNS ORANGE: one eased crossfade of the islands' fill toward
//      the deep tone, an orange coast, JAPAN label to orange — "they also get" f4-18
//   3. THE CUT POINT: an orange tick grows across the line at Changchun, and
//      "Changchun" slides up                       — "the southern half"   f20-34
//   4. THE FRONT: Changchun -> Port Arthur converts cream -> orange as ONE
//      travelling front running south (the Dalny spur converts off the
//      junction as the front passes it). The camera follows it: one long
//      eased push-in that tilts south, wide -> Mukden..Liaodong tip. Russia's
//      northern line stays cream and slides off the top. Mukden and Dalny
//      slide up as the front reaches them
//                                   — "of the Russians' railway concessions" f28-72
//   5. MANCHURIA is re-seen large behind the line as the push settles (it is
//      set on the 42.45 N parallel across the stem, and scales at k^0.35 so it
//      is still whole in the tighter frame). No new gesture — "in Manchuria" f70-86
//   6. THE NAVAL BASE: the camera eases on to Port Arthur (landing ~f104, Port
//      Arthur at 540, 835, k 5.0); the Kwantung leased territory takes an
//      orange hatch (one crossfade, clipped to the coast, its northern lease
//      line dashed over land only); an orange ring draws round Port Arthur and a Lucide
//      anchor slides up inside it; PORT ARTHUR slides up in spaced caps
//                                               — "and the naval base"   f86-114
//   7. HOLD: a slow camera creep (k x1.03) and one low-contrast highlight
//      travelling down the orange line into Port Arthur, plus the house sway.
//      Never static                                              — tail  f110-131
// Nothing else: no arrows, no treaty text, no flags, no ships.
// ---------------------------------------------------------------------------

export const SEA = "#1B2226";
export const LAND = "#3F3428";
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const CORE = "#15120E"; // the dark core of the railway symbol
const CORE_ORANGE = "#2B1B06";

export const schema = z.object({
  sea: z.string(),
  land: z.string(),
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  grainSrc: z.string(),
  mottleSrc: z.string(),
  vignette: z.number(),
  labels: z.object({
    manchuria: z.string(),
    russia: z.string(),
    korea: z.string(),
    japan: z.string(),
    yellowSea: z.string(),
    seaOfJapan: z.string(),
    harbin: z.string(),
    changchun: z.string(),
    mukden: z.string(),
    vladivostok: z.string(),
    dalny: z.string(),
    portArthur: z.string(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  sea: SEA,
  land: LAND,
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  grainSrc: "manchuria/grain.png",
  mottleSrc: "manchuria/mottle.png",
  vignette: 0.55,
  labels: {
    manchuria: "MANCHURIA",
    russia: "RUSSIAN EMPIRE",
    korea: "KOREA",
    japan: "JAPAN",
    yellowSea: "Yellow Sea",
    seaOfJapan: "Sea of Japan",
    harbin: "Harbin",
    changchun: "Changchun",
    mukden: "Mukden",
    vladivostok: "Vladivostok",
    dalny: "Dalny",
    portArthur: "PORT ARTHUR",
  },
});

// ---------------------------------------------------------------------------
// The railway, as polylines with arclength, so the front, the tick and the
// shimmer are all read off one table.
// ---------------------------------------------------------------------------
type P2 = [number, number];
const cumOf = (pts: P2[]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) {
    c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return c;
};
const SOUTH = RAIL_SOUTH_PTS as P2[];
const SOUTH_CUM = cumOf(SOUTH);
export const SOUTH_LEN = SOUTH_CUM[SOUTH_CUM.length - 1];
const SPUR = RAIL_SPUR_PTS as P2[];
const SPUR_LEN = cumOf(SPUR)[SPUR.length - 1];
const dOf = (pts: P2[]) => `M${pts.map(([x, y]) => `${x},${y}`).join("L")}`;
const SOUTH_D = dOf(SOUTH);
// Reversed so the chequer's dash origin is Port Arthur, the point the camera
// closes on: screen-constant dashes then stay put on screen around it.
const SOUTH_REV_D = dOf([...SOUTH].reverse());
const SPUR_D = dOf(SPUR);

export const southAt = (s: number) => {
  const t = Math.max(0, Math.min(SOUTH_LEN, s));
  let lo = 0;
  let hi = SOUTH_CUM.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (SOUTH_CUM[mid] <= t) lo = mid;
    else hi = mid;
  }
  const u = (t - SOUTH_CUM[lo]) / (SOUTH_CUM[hi] - SOUTH_CUM[lo] || 1);
  return {
    x: SOUTH[lo][0] + (SOUTH[hi][0] - SOUTH[lo][0]) * u,
    y: SOUTH[lo][1] + (SOUTH[hi][1] - SOUTH[lo][1]) * u,
  };
};

// ---------------------------------------------------------------------------
// Timing.
// ---------------------------------------------------------------------------
export const T = {
  regionsIn: 0, // region names, light stagger
  japanTint: [4, 18] as const,
  russiaCities: 6, // Harbin, Vladivostok
  tick: 20, // the cut point at Changchun
  changchun: 22,
  front: [28, 72] as const,
  kwantung: [94, 108] as const,
  ring: 99,
  anchor: 101,
  portArthur: 104,
  shimmer: [100, 132] as const,
};
const LABEL_TRAVEL = 24; // screen px
const LABEL_FRAMES = 14;
const LABEL_FADE = 9;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

// The front: one eased sweep, a touch front-loaded so it leaves Changchun on
// the word and decelerates into Port Arthur.
export const frontS = (f: number) => {
  const u = clamp01((f - T.front[0]) / (T.front[1] - T.front[0]));
  return camEase(u, 0.85) * SOUTH_LEN;
};
const firstFrameAt = (s: number) => {
  for (let f = T.front[0]; f <= T.front[1]; f++) if (frontS(f) >= s) return f;
  return T.front[1];
};
export const F_MUKDEN = firstFrameAt(STATION_S.mukden) - 2;
export const F_DALNY = firstFrameAt(STATION_S.junction);

// ---------------------------------------------------------------------------
// The camera. For a content centre c, cy = c + CAM_LIFT / k puts c on screen y
// 835 (above the captions); cx lands on screen x 540.
//   WIDE   k 1.00, cx 540, c 835   world == screen: the baked canvas itself
//   MID    k 3.60, cx 355, c 1005  Mukden .. the Liaodong tip
//   FINAL  k 5.00, cx/c = Port Arthur
// Move A (wide -> mid) f22-78 and move B (mid -> final) f76-96 overlap, so the
// camera never stops between them; the house spring (CAM_STIFF / CAM_DAMP)
// damps all three channels, which lands B at ~f104. A creep (k x1.03) eases
// in from f96 and is still moving on the last frame.
// ---------------------------------------------------------------------------
export const CAM = {
  wide: { k: 1, cx: 540, c: 835 },
  mid: { k: 3.6, cx: 355, c: 1005 },
  final: { k: 5.0, cx: CITIES.portArthur.x, c: CITIES.portArthur.y },
  a: [22, 78] as const,
  b: [76, 96] as const,
  creep: [96, 132] as const,
  creepK: 1.03,
};
export const camTarget = (f: number) => {
  const uA = camEase((f - CAM.a[0]) / (CAM.a[1] - CAM.a[0]), 0.9);
  const uB = camEase((f - CAM.b[0]) / (CAM.b[1] - CAM.b[0]), 1);
  const uc = clamp01((f - CAM.creep[0]) / (CAM.creep[1] - CAM.creep[0]));
  const creep = uc * uc * (1.5 - 0.5 * uc); // eases in, still moving at the end
  const { wide: W, mid: M, final: F } = CAM;
  const k = W.k * Math.pow(M.k / W.k, uA) * Math.pow(F.k / M.k, uB) * Math.pow(CAM.creepK, creep);
  const cx = W.cx + (M.cx - W.cx) * uA + (F.cx - M.cx) * uB;
  const c = W.c + (M.c - W.c) * uA + (F.c - M.c) * uB;
  return { k, cx, cy: c + CAM_LIFT / k };
};
export const runCam = (upto: number) => {
  let { k, cx, cy } = camTarget(0);
  let vk = 0;
  let vx = 0;
  let vy = 0;
  for (let f = 1; f <= upto; f++) {
    const t = camTarget(f);
    // k is damped in log space, so a 5x push has the same feel at both ends.
    const lk = Math.log(k);
    const vlk = vk;
    const nvk = vlk + (Math.log(t.k) - lk) * CAM_STIFF - vlk * CAM_DAMP;
    k = Math.exp(lk + nvk);
    vk = nvk;
    vx += (t.cx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (t.cy - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
  }
  return { k, cx, cy };
};

// ---------------------------------------------------------------------------
// A label that slides up 24 screen px while it fades in.
// ---------------------------------------------------------------------------
const slide = (frame: number, f0: number) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...clamp }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], clamp),
});

// Lucide `anchor`, 24-unit box, stroke 2, round caps.
const AnchorGlyph: React.FC<{ color: string }> = ({ color }) => (
  <g fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V8" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    <circle cx={12} cy={5} r={3} />
  </g>
);

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

// ---------------------------------------------------------------------------
const SouthManchuriaRailway: React.FC<Props> = ({
  sea,
  land,
  ink,
  accent,
  accentDeep,
  grainSrc,
  mottleSrc,
  vignette,
  labels,
}) => {
  const frame = useCurrentFrame();

  // -- camera --------------------------------------------------------------
  const cam = runCam(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx / k;
  const cy = cam.cy + drift.dy / k;
  const tx = FRAME_W / 2 - cx * k;
  const ty = FRAME_H / 2 - cy * k;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  /** screen px -> world units at this frame */
  const px = (v: number) => v / k;
  /** type and marks grow gently with the zoom, never as fast as the map */
  const grow = (v: number, e = 0.18) => (v * Math.pow(k, e)) / k;

  // -- gestures ------------------------------------------------------------
  const japanT = smoothstep((frame - T.japanTint[0]) / (T.japanTint[1] - T.japanTint[0]));
  const tickT = interpolate(frame, [T.tick, T.tick + 9], [0, 1], { easing: EASE_LAND, ...clamp });
  const s = frontS(frame);
  const frontOn = frame >= T.front[0];
  const frontLive = frame >= T.front[0] && frame <= T.front[1] + 4;
  const head = southAt(s);
  const headOp =
    smoothstep((frame - T.front[0]) / 4) * (1 - smoothstep((frame - (T.front[1] - 4)) / 8));
  const spurS =
    s <= STATION_S.junction
      ? 0
      : ((s - STATION_S.junction) / (SOUTH_LEN - STATION_S.junction)) * SPUR_LEN;
  const kwT = smoothstep((frame - T.kwantung[0]) / (T.kwantung[1] - T.kwantung[0]));
  const ringT = interpolate(frame, [T.ring, T.ring + 12], [0, 1], { easing: EASE_LAND, ...clamp });

  // the hold's travelling highlight: Dashiqiao -> Port Arthur
  const shT = clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0]));
  const shS = STATION_S.dashiqiao + (SOUTH_LEN - STATION_S.dashiqiao) * smoothstep(shT);
  const shOp = Math.sin(Math.PI * shT) * 0.55;

  // -- the Changchun tick, perpendicular to the line --------------------------
  const cc = SOUTH[0];
  const cc2 = SOUTH[4];
  const tang = Math.atan2(cc2[1] - cc[1], cc2[0] - cc[0]);
  const nx = -Math.sin(tang);
  const ny = Math.cos(tang);
  const tickHalf = px(22) * tickT;

  // -- the railway symbol ----------------------------------------------------
  const RW = 6.5; // screen px, cream
  const RW_J = 8; // Japan's, a touch heavier
  const DASH = 9;
  const railCream = (d: string, key: string) => (
    <g key={key} fill="none" strokeLinejoin="round">
      <path d={d} stroke="#0B0907" strokeOpacity={0.55} strokeWidth={px(RW + 3.5)} />
      <path d={d} stroke={ink} strokeWidth={px(RW)} />
      <path d={d} stroke={CORE} strokeWidth={px(RW - 3)} />
      <path
        d={d}
        stroke={ink}
        strokeWidth={px(RW - 3)}
        strokeDasharray={`${px(DASH)} ${px(DASH)}`}
      />
    </g>
  );
  const railOrange = (d: string, key: string) => (
    <g key={key} fill="none" strokeLinejoin="round">
      <path d={d} stroke="#0B0907" strokeOpacity={0.6} strokeWidth={px(RW_J + 4)} />
      <path d={d} stroke={accent} strokeWidth={px(RW_J)} />
      <path d={d} stroke={CORE_ORANGE} strokeWidth={px(RW_J - 3.6)} />
      <path
        d={d}
        stroke={accent}
        strokeWidth={px(RW_J - 3.6)}
        strokeDasharray={`${px(DASH)} ${px(DASH)}`}
      />
    </g>
  );

  // -- water lines: offset contours of the coast, fading outward --------------
  const WL_N = 4;
  const wlGap = 6.5 * Math.pow(k, 0.45); // screen px between lines
  const wlW = 1.15; // screen px line weight
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  const waterLines: React.ReactNode[] = [];
  for (let i = WL_N - 1; i >= 0; i--) {
    const d = wlGap * (i + 1);
    waterLines.push(
      <path
        key={`wl-a-${i}`}
        d={LAND_D}
        fill="none"
        stroke={mixHex(sea, ink, wlOp[i])}
        strokeWidth={px(2 * d + wlW)}
        strokeLinejoin="round"
      />,
      <path
        key={`wl-b-${i}`}
        d={LAND_D}
        fill="none"
        stroke={sea}
        strokeWidth={px(2 * d - wlW)}
        strokeLinejoin="round"
      />,
    );
  }

  // -- type ------------------------------------------------------------------
  const regionIn = (i: number) => slide(frame, T.regionsIn + i * 1.5);
  const cityLabel = (
    key: keyof typeof CITIES,
    text: string,
    f0: number,
    dx: number,
    dy: number,
    anchor: "start" | "end" | "middle",
  ) => {
    const sl = slide(frame, f0);
    if (sl.op <= 0) return null;
    const c = CITIES[key];
    const size = grow(38);
    return (
      <text
        key={`lab-${key}`}
        x={c.x + grow(dx)}
        y={c.y + grow(dy) + px(sl.dy)}
        textAnchor={anchor}
        opacity={sl.op}
        fill={ink}
        style={{ fontFamily: fell, fontSize: size }}
        stroke={sea}
        strokeOpacity={0.55}
        strokeWidth={size * 0.12}
        paintOrder="stroke"
      >
        {text}
      </text>
    );
  };
  const cityDot = (key: keyof typeof CITIES, op = 1) => {
    const c = CITIES[key];
    return (
      <circle
        key={`dot-${key}`}
        cx={c.x}
        cy={c.y}
        r={grow(6.5)}
        fill={ink}
        stroke="#0B0907"
        strokeWidth={grow(2.2)}
        opacity={op}
      />
    );
  };

  const regionText = (
    text: string,
    x: number,
    y: number,
    size: number,
    spacing: number,
    i: number,
    color: string = ink,
    opacity = 0.9,
    family: string = fellSC,
    italic = false,
  ) => {
    const sl = regionIn(i);
    const sz = grow(size, 0.35);
    return (
      <text
        x={x}
        y={y + px(sl.dy)}
        textAnchor="middle"
        opacity={sl.op * opacity}
        fill={color}
        style={{
          fontFamily: family,
          fontStyle: italic ? "italic" : "normal",
          fontSize: sz,
          letterSpacing: sz * spacing,
        }}
      >
        {text}
      </text>
    );
  };
  const arcText = (text: string, href: string, size: number, spacing: number, i: number, opacity = 0.9) => {
    const sl = regionIn(i);
    const sz = grow(size, 0.35);
    return (
      <g transform={`translate(0 ${px(sl.dy)})`} opacity={sl.op * opacity}>
        <text
          fill={ink}
          style={{ fontFamily: fellSC, fontSize: sz, letterSpacing: sz * spacing }}
        >
          <textPath href={href} startOffset="50%" textAnchor="middle">
            {text}
          </textPath>
        </text>
      </g>
    );
  };

  // The PA ring and glyph, in screen px about the city.
  const pa = CITIES.portArthur;
  const ringR = 44;
  const anchorSl = slide(frame, T.anchor);
  const paSl = slide(frame, T.portArthur);

  // mottle tiles, world space
  const TILE = 640;
  const tiles: { x: number; y: number }[] = [];
  for (let y = -320; y < 2240; y += TILE) for (let x = -320; x < 1400; x += TILE) tiles.push({ x, y });

  return (
    <AbsoluteFill style={{ backgroundColor: sea }}>
      {/* ---------------- THE MAP: sea, water-lines, land, ink ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="landClip">
            <path d={LAND_D} clipRule="evenodd" />
          </clipPath>
        </defs>
        <g transform={camT}>
          <rect x={-400} y={-400} width={1880} height={2720} fill={sea} />
          {waterLines}
          <path d={GRATICULE_D} fill="none" stroke={ink} strokeOpacity={0.12} strokeWidth={px(1.2)} />
          <path d={LAND_D} fill={land} fillRule="evenodd" />
          {/* the hand-coloured rim: a lighter wash inside the coast */}
          <g clipPath="url(#landClip)">
            <path d={LAND_D} fill="none" stroke={LAND_RIM} strokeOpacity={0.2} strokeWidth={px(28)} strokeLinejoin="round" />
            <path d={LAND_D} fill="none" stroke={LAND_RIM} strokeOpacity={0.28} strokeWidth={px(10)} strokeLinejoin="round" />
            {/* the graticule reads on land too, fainter */}
            <path d={GRATICULE_D} fill="none" stroke={ink} strokeOpacity={0.07} strokeWidth={px(1.2)} />
          </g>
          {/* JAPAN: one eased crossfade toward the deep tone */}
          <path d={JAPAN_D} fill={accentDeep} fillOpacity={0.42 * japanT} fillRule="evenodd" />
          <path d={BORDERS_D} fill="none" stroke={ink} strokeOpacity={0.5} strokeWidth={px(1.7)} strokeDasharray={`${px(8)} ${px(5)}`} strokeLinecap="round" />
          <path d={LAND_D} fill="none" stroke={ink} strokeOpacity={0.82} strokeWidth={px(1.5)} strokeLinejoin="round" />
          <path d={JAPAN_D} fill="none" stroke={accent} strokeOpacity={japanT} strokeWidth={px(2)} strokeLinejoin="round" />
        </g>
      </svg>

      {/* ---------------- PAPER MOTTLING, world space ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: 0.9,
        }}
      >
        {tiles.map((t, i) => (
          <Img
            key={`m-${i}`}
            src={staticFile(mottleSrc)}
            style={{ position: "absolute", left: t.x, top: t.y, width: TILE + 1, height: TILE + 1 }}
          />
        ))}
      </div>

      {/* ---------------- THE RAILWAY, TYPE AND MARKS ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          <path id="manchuriaArc" d={MANCHURIA_ARC_D} />
          <path id="russiaArc" d={RUSSIA_ARC_D} />
          <clipPath id="landClip2">
            <path d={LAND_D} clipRule="evenodd" />
          </clipPath>
          <pattern
            id="kwHatch"
            patternUnits="userSpaceOnUse"
            width={9 / CAM.final.k}
            height={9 / CAM.final.k}
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={9 / CAM.final.k} stroke={accent} strokeWidth={2.2 / CAM.final.k} />
          </pattern>
          <mask id="frontMask" maskUnits="userSpaceOnUse" x={-400} y={-400} width={1880} height={2720}>
            <path
              d={SOUTH_D}
              fill="none"
              stroke="#fff"
              strokeWidth={px(40)}
              strokeLinecap="butt"
              strokeDasharray={`${Math.max(0.001, s)} ${SOUTH_LEN + 10}`}
            />
            {spurS > 0 ? (
              <path
                d={SPUR_D}
                fill="none"
                stroke="#fff"
                strokeWidth={px(40)}
                strokeLinecap="butt"
                strokeDasharray={`${spurS} ${SPUR_LEN + 10}`}
              />
            ) : null}
          </mask>
          <radialGradient id="headGlow2">
            <stop offset="0%" stopColor={accent} stopOpacity={0.7} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={camT}>
          {/* the Kwantung leased territory */}
          {kwT > 0 ? (
            <g clipPath="url(#landClip2)" opacity={kwT}>
              <path d={KWANTUNG_D} fill={accentDeep} fillOpacity={0.2} />
              <path d={KWANTUNG_D} fill="url(#kwHatch)" opacity={0.7} />
              <path
                d={KWANTUNG_NORTH_D}
                fill="none"
                stroke={accent}
                strokeWidth={px(2.2)}
                strokeDasharray={`${px(7)} ${px(5)}`}
              />
            </g>
          ) : null}

          {/* region names */}
          {arcText(labels.manchuria, "#manchuriaArc", 50, 0.42, 0, 0.85)}
          {arcText(labels.russia, "#russiaArc", 34, 0.24, 1, 0.8)}
          {regionText(labels.korea, PLACES.korea.x, PLACES.korea.y, 40, 0.4, 2, ink, 0.8)}
          {regionText(labels.japan, PLACES.japan.x, PLACES.japan.y, 34, 0.34, 3, mixHex(ink, accent, japanT), 0.9)}
          {regionText(labels.yellowSea, PLACES.yellowSea.x, PLACES.yellowSea.y, 36, 0.06, 4, ink, 0.62, fell, true)}
          {regionText(labels.seaOfJapan, PLACES.seaOfJapan.x, PLACES.seaOfJapan.y, 36, 0.06, 5, ink, 0.62, fell, true)}

          {/* Russia's railway, cream */}
          {railCream(RAIL_MAIN_D, "main")}
          {railCream(RAIL_NORTH_D, "north")}
          {railCream(SOUTH_REV_D, "south")}
          {railCream(SPUR_D, "spur")}

          {/* Japan's section, converted by one travelling front */}
          {frontOn && s > 0.5 ? (
            <g mask="url(#frontMask)">
              {railOrange(SOUTH_REV_D, "south-j")}
              {railOrange(SPUR_D, "spur-j")}
            </g>
          ) : null}
          {frontLive && headOp > 0 ? (
            <circle cx={head.x} cy={head.y} r={px(26)} fill="url(#headGlow2)" opacity={headOp} />
          ) : null}
          {/* the hold's low-contrast travelling highlight */}
          {shOp > 0.01
            ? [
                [70, 0.35],
                [36, 0.5],
                [14, 0.7],
              ].map(([len, o]) => (
                <path
                  key={`sh-${len}`}
                  d={SOUTH_D}
                  fill="none"
                  stroke="#FFE3A6"
                  strokeOpacity={o * shOp}
                  strokeWidth={px(RW_J - 1)}
                  strokeLinecap="round"
                  strokeDasharray={`${px(len)} ${SOUTH_LEN * 2}`}
                  strokeDashoffset={-(shS - px(len) / 2)}
                />
              ))
            : null}

          {/* the cut point at Changchun */}
          {tickT > 0 ? (
            <g>
              <line
                x1={cc[0] - nx * tickHalf}
                y1={cc[1] - ny * tickHalf}
                x2={cc[0] + nx * tickHalf}
                y2={cc[1] + ny * tickHalf}
                stroke="#0B0907"
                strokeOpacity={0.6}
                strokeWidth={px(8)}
                strokeLinecap="round"
              />
              <line
                x1={cc[0] - nx * tickHalf}
                y1={cc[1] - ny * tickHalf}
                x2={cc[0] + nx * tickHalf}
                y2={cc[1] + ny * tickHalf}
                stroke={accent}
                strokeWidth={px(4.5)}
                strokeLinecap="round"
              />
            </g>
          ) : null}

          {/* cities */}
          {cityDot("harbin")}
          {cityDot("vladivostok")}
          {cityDot("changchun")}
          {cityDot("mukden")}
          {cityDot("dalny")}
          {cityDot("portArthur", 1 - ringT)}
          {cityLabel("harbin", labels.harbin, T.russiaCities, 16, -14, "start")}
          {cityLabel("vladivostok", labels.vladivostok, T.russiaCities + 2, -8, 44, "end")}
          {cityLabel("changchun", labels.changchun, T.changchun, 22, 13, "start")}
          {cityLabel("mukden", labels.mukden, F_MUKDEN, 20, 13, "start")}
          {cityLabel("dalny", labels.dalny, F_DALNY, 18, 16, "start")}

          {/* THE NAVAL BASE: ring, anchor, name */}
          {ringT > 0 ? (
            <g>
              <circle cx={pa.x} cy={pa.y} r={px(ringR)} fill="#17120D" fillOpacity={0.78 * ringT} />
              <circle
                cx={pa.x}
                cy={pa.y}
                r={px(ringR)}
                fill="none"
                stroke={accent}
                strokeWidth={px(3)}
                pathLength={100}
                strokeDasharray={`${100 * ringT} 101`}
                transform={`rotate(-90 ${pa.x} ${pa.y})`}
              />
            </g>
          ) : null}
          {anchorSl.op > 0 ? (
            <g
              opacity={anchorSl.op}
              transform={`translate(${pa.x} ${pa.y + px(anchorSl.dy)}) scale(${px(2)}) translate(-12 -12.5)`}
            >
              <AnchorGlyph color={accent} />
            </g>
          ) : null}
          {paSl.op > 0 ? (
            <text
              x={pa.x}
              y={pa.y + px(ringR + 62) + px(paSl.dy)}
              textAnchor="middle"
              opacity={paSl.op}
              fill={ink}
              stroke={sea}
              strokeOpacity={0.55}
              strokeWidth={px(5)}
              paintOrder="stroke"
              style={{ fontFamily: fellSC, fontSize: px(52), letterSpacing: px(52 * 0.22) }}
            >
              {labels.portArthur}
            </text>
          ) : null}
        </g>
      </svg>

      {/* ---------------- PAPER: grain and vignette, screen space ---------------- */}
      <Img
        src={staticFile(grainSrc)}
        style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(
            vignette * 0.45
          ).toFixed(3)}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default SouthManchuriaRailway;
