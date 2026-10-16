// FOURTHINGS_SHARED_READY
import React, { useId } from "react";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_NUM,
  GEO,
  METRIC,
  STROKE,
  bloomFilter,
  clamp01,
  lerp,
  rectPath,
  smoothstep,
  type Silhouette,
} from "../kits/cheeky-pint/stoutShared";

// ===========================================================================
// fourThingsShared — the world of the META4 set ("Four things Mark did", Cheeky Pint S4E03),
// in the stout system (stoutShared.tsx; brief out/meta4/BRIEF.md, API notes out/meta4/SHARED_READY.md).
//
// Five clips, contiguous on ONE sequence clock g (the global sequence frame, 23.976 fps):
//   FourThings1 191-550 · FourThings2 550-831 · FourThings3 831-1183 · FourThings4 1183-1463 ·
//   FourThings5 1463-1607.
//
// THE WORLD. Four scenes stand side by side, scene n in BAY n, centred on world x = bayX(n) = n x BAY,
// on the stout floor (world y FLOOR). The camera of a bay is given RELATIVE to the bay centre
// (bayX(n), BAY_CY): sceneCam<N>(t) = { dx, dy, k }. At { dx: 0, dy: 0, k: 1 } world y == screen y
// and world x == screen x + bayX(n) - 540.
//
// THE RAIL (the user's "timeline") is drawn in SCREEN px above the world and is a pure function
// of g: four numbered stations joined by a glass tube; amber fills the tube like a liquid and a
// reached station turns amber. It is the hero at the start of clip 1, a header (y 300) in clips 1-4,
// and the counter over the four miniatures in clip 5. See railAt(g).
//
// THE SHELL (FourThingsClip) lives in fourThingsClip.tsx — a separate file, so the scene files can
// import this module without an import cycle. Nothing here imports a scene.
// ===========================================================================

export const FPS = 24000 / 1001;
export type ClipN = 1 | 2 | 3 | 4 | 5;
export type SceneN = 1 | 2 | 3 | 4;
/** The sequence table: clip n runs on global frames [start, end), `len` frames. */
export const SEQ: Record<ClipN, { id: string; start: number; end: number; len: number }> = {
  1: { id: "FourThings1", start: 191, end: 550, len: 359 },
  2: { id: "FourThings2", start: 550, end: 831, len: 281 },
  3: { id: "FourThings3", start: 831, end: 1183, len: 352 },
  4: { id: "FourThings4", start: 1183, end: 1463, len: 280 },
  5: { id: "FourThings5", start: 1463, end: 1607, len: 144 },
};
/** Which clip a global frame belongs to (clamped to 1..5). */
export const clipOf = (g: number): ClipN => (g < SEQ[2].start ? 1 : g < SEQ[3].start ? 2 : g < SEQ[4].start ? 3 : g < SEQ[5].start ? 4 : 5);

// --- the bays (WORLD px) -------------------------------------------------------------------------
// 1280: at mid-travel the outgoing scene's edge and the incoming scene's edge share the frame, and no
// neighbour shows at any scene's rest or during its own camera moves (widest: scene 3, k 1.05, dx -45).
export const BAY = 1280;
export const bayX = (n: number) => n * BAY;
/** The world y a bay camera with dy = 0 puts at the middle of the frame (screen y 960). */
export const BAY_CY = 960;
/** The stout floor: where tiles stand (= GEO.FLOOR, Pillar's default). */
export const FLOOR = GEO.FLOOR; // 1296

// --- the scene contract --------------------------------------------------------------------------
/** The camera a scene wants, relative to its bay centre (world px; k = zoom). */
export type SceneCam = { dx: number; dy: number; k: number };
/** t = frames since THIS scene's clip started (keeps counting into the next clip);
 *  g = global sequence frame (every idle motion is driven by g);
 *  cam = the frame's actual camera (absolute world centre + k); k = cam.k. */
export type SceneProps = { t: number; g: number; cam: Cam; k: number };
/** Optional: where the light pool should stand, relative to the bay centre (world px). */
export type ScenePool = { dx: number; dy: number; strength?: number };
/** A bay camera as an absolute stout Cam. */
export const bayCam = (n: number, c: SceneCam): Cam => ({ x: bayX(n) + c.dx, y: BAY_CY + c.dy, k: c.k });

// --- the travel between bays (local frames of clip n) ----------------------------------------------
/** Clip n's camera leaves bay n-1's settled camera at TRAVEL[n][0] and IS sceneCam<n>(frame) from
 *  TRAVEL[n][1] on. Clip 1 leaves an empty bay 0 (the rail is the hero there); clip 5 goes to an
 *  empty bay 5. */
export const TRAVEL: Record<ClipN, [number, number]> = { 1: [12, 42], 2: [0, 30], 3: [0, 30], 4: [0, 30], 5: [0, 30] };
/** The travel's progress 0..1 at local frame f of clip n (zero speed at both ends, peaked). */
export const travelEase = (n: ClipN, f: number) => smoothstep((f - TRAVEL[n][0]) / (TRAVEL[n][1] - TRAVEL[n][0]));
/** Mix two cameras (x, y linear; k in log). */
export const mixCam = (a: Cam, b: Cam, e: number): Cam => ({
  x: lerp(a.x, b.x, e),
  y: lerp(a.y, b.y, e),
  k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), e)),
});

// --- small helpers shared by the scenes --------------------------------------------------------------
const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `ft${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
/** Rest to rest with a long soft landing (velocity ∝ t (1 - t)^(p - 1)). */
export const restToRest = (t: number, p = 3) => {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, p) * (1 + p * u);
};
/** The house sway of StoutStage at story clock S (= g): the world's screen offset. The rail rides it. */
export const stageSway = (g: number) => ({ dx: 3 * Math.sin(g / 23), dy: 5 * Math.sin(g / 19) });

/** The person bust (the house figure: head + shoulder dome, person.png's outline) `h` world px tall,
 *  standing with its feet on (x, feetY). One path. Its ink box is h wide. */
export const personPath = (x: number, feetY: number, h: number) => {
  const s = h / 429;
  const X = (u: number) => f2(x + (u - 255.5) * s);
  const Y = (v: number) => f2(feetY + (v - 470) * s);
  const r = 102;
  const c = r * 0.5522847498;
  const cx = 255.5;
  const cy = 143;
  return (
    `M${X(cx + r)} ${Y(cy)}C${X(cx + r)} ${Y(cy + c)} ${X(cx + c)} ${Y(cy + r)} ${X(cx)} ${Y(cy + r)}` +
    `C${X(cx - c)} ${Y(cy + r)} ${X(cx - r)} ${Y(cy + c)} ${X(cx - r)} ${Y(cy)}` +
    `C${X(cx - r)} ${Y(cy - c)} ${X(cx - c)} ${Y(cy - r)} ${X(cx)} ${Y(cy - r)}` +
    `C${X(cx + c)} ${Y(cy - r)} ${X(cx + r)} ${Y(cy - c)} ${X(cx + r)} ${Y(cy)}Z` +
    `M${X(41)} ${Y(458)}C${X(41)} ${Y(352)} ${X(126)} ${Y(266)} ${X(232)} ${Y(266)}L${X(279)} ${Y(266)}` +
    `C${X(385)} ${Y(266)} ${X(470)} ${Y(352)} ${X(470)} ${Y(458)}L${X(470)} ${Y(462)}Q${X(470)} ${Y(470)} ${X(462)} ${Y(470)}` +
    `L${X(49)} ${Y(470)}Q${X(41)} ${Y(470)} ${X(41)} ${Y(462)}Z`
  );
};
/** The bust's head for a bust h tall standing on (x, feetY): centre and radius. */
export const personHead = (x: number, feetY: number, h: number) => ({ x, y: feetY + ((143 - 470) * h) / 429, r: (102 * h) / 429 });

// ===========================================================================
// THE RAIL (SCREEN px)
// ===========================================================================
/** The rail's two places: the header of clips 1-4 and the hero of clip 1's opening and clip 5.
 *  `w` = the span of the four stations (first tile's left edge to the last tile's right edge). */
export const RAIL = {
  header: { cx: 540, cy: 300, w: 760 },
  hero: { cx: 540, cy: 900, w: 880 },
  recap: { cx: 540, cy: 384, w: 840 }, // clip 5: the counter over the four miniatures
  GAP: 1.25, // the tube between two stations, in tiles
  INLET: 0.5, // the inlet stub left of station 1, in tiles
  TUBE: 0.26, // the tube's height, in tiles
  NUM: 0.62, // the numeral's size, in tiles
} as const;
/** When the amber flows into station n (local frames of clip n): it lands a few frames before the
 *  number word ends ("One" / "Thing two" / "Thing three" / "fourth"). */
export const FLOW: Record<SceneN, [number, number]> = { 1: [2, 12], 2: [0, 22], 3: [0, 16], 4: [0, 18] };
/** The glides (local frames): clip 1 hero -> header, clip 5 header -> the recap place. */
export const GLIDE = { c1: [12, 42] as [number, number], c5: [4, 34] as [number, number] };

/** The rail's state at global frame g: `hero` 0 (header) .. 1 (hero); `p` the amber front in
 *  stations (0 = the inlet's start, n = station n's right edge); `speed` = dp/dg; `recap` 0..1 = clip 5's place (RAIL.recap). */
export const railAt = (g: number) => {
  const pAt = (gg: number) => {
    const n = clipOf(gg);
    if (n === 5) return 4;
    const f = gg - SEQ[n].start;
    return n - 1 + smoothstep((f - FLOW[n][0]) / (FLOW[n][1] - FLOW[n][0]));
  };
  const n = clipOf(g);
  const f = g - SEQ[n].start;
  const hero = n === 1 ? 1 - smoothstep((f - GLIDE.c1[0]) / (GLIDE.c1[1] - GLIDE.c1[0])) : 0;
  const recap = n === 5 ? smoothstep((f - GLIDE.c5[0]) / (GLIDE.c5[1] - GLIDE.c5[0])) : 0;
  return { hero, recap, p: pAt(g), speed: pAt(g + 0.5) - pAt(g - 0.5) };
};
/** The rail's geometry (SCREEN px, before sway) for a hero amount 0..1. */
export const railLayout = (hero: number, recap = 0) => {
  const cx = lerp(lerp(RAIL.header.cx, RAIL.hero.cx, hero), RAIL.recap.cx, recap);
  const cy = lerp(lerp(RAIL.header.cy, RAIL.hero.cy, hero), RAIL.recap.cy, recap);
  const w = lerp(lerp(RAIL.header.w, RAIL.hero.w, hero), RAIL.recap.w, recap);
  const T = w / (4 + 3 * RAIL.GAP);
  const x0 = cx - w / 2;
  const stations = [0, 1, 2, 3].map((i) => {
    const left = x0 + i * T * (1 + RAIL.GAP);
    return { left, right: left + T, x: left + T / 2, top: cy - T / 2, bottom: cy + T / 2 };
  });
  const inlet = x0 - RAIL.INLET * T;
  /** x of the amber front for p in 0..4 */
  const frontX = (p: number) => {
    const F = [inlet, ...stations.map((s) => s.right)];
    const i = Math.max(0, Math.min(3, Math.floor(p)));
    return lerp(F[i], F[i + 1], clamp01(p - i));
  };
  const tubeH = RAIL.TUBE * T;
  // the tube's segments: the inlet, then one between each pair of stations (never behind a tile:
  // a numeral is knocked out to the ground)
  const tubes = [
    { x0: inlet, x1: stations[0].left, cap: true },
    ...[0, 1, 2].map((i) => ({ x0: stations[i].right, x1: stations[i + 1].left, cap: false })),
  ];
  return { cx, cy, w, T, stations, inlet, frontX, tubeH, tubes };
};
/** Where the header rail ends on screen (its tiles' bottom edge + shadow): scenes keep below this. */
export const HEADER_BOTTOM = 360;
/** The SCREEN box a scene may use under the header (camera at rest). Labels, numerals and faces also
 *  stay out of CAPTION_STRIP (tile bodies and bars may cross it). */
export const SCENE_BOX = { x0: 60, x1: 1020, y0: 420, y1: 1700 } as const;
export const CAPTION_STRIP = { y0: 1080, y1: 1250 } as const;

/**
 * Rail — the numbered timeline, drawn in SCREEN px (pass it as StoutStage's `overlay` inside an svg, or
 * use <RailOverlay />). A pure function of the global frame g: place (header / hero / recap) and amber front. ONE union shadow (lifted: it floats above the world); amber = the band gradient
 * + the fixed bloom + a hot top edge, a hot leading edge while the front moves.
 */
export const Rail: React.FC<{ g: number }> = ({ g }) => {
  const uid = uidOf(useId());
  const st = railAt(g);
  const L = railLayout(st.hero, st.recap);
  const sw = stageSway(g);
  const r = GEO.RADIUS;
  const front = L.frontX(st.p);
  const { T, cy, tubeH } = L;
  const tubeY = cy - tubeH / 2;
  const inset = 3; // the liquid's inset inside the glass
  const fs = RAIL.NUM * T;
  const numY = cy + (METRIC.fig * fs) / 2;
  const moving = clamp01(Math.abs(st.speed) / 0.04);
  // --- the union silhouette: tiles + tube (glass faint where it is empty) + icon tiles
  const sil: Silhouette = [];
  L.stations.forEach((s) => sil.push({ d: rectPath(s.left, s.top, T, T, r) }));
  L.tubes.forEach((t) => {
    const fx1 = Math.max(t.x0, Math.min(t.x1, front));
    if (fx1 > t.x0 + 0.5) sil.push({ d: rectPath(t.x0, tubeY, fx1 - t.x0, tubeH, 0) });
    if (fx1 < t.x1 - 0.5) sil.push({ d: rectPath(fx1, tubeY, t.x1 - fx1, tubeH, 0), a: 0.3 });
  });
  const hair = STROKE.HAIRLINE;
  return (
    <g transform={`translate(${f2(sw.dx)} ${f2(sw.dy)})`}>
      <defs>
        <AmberGradient id={`${uid}a`} y0={300} y1={1368} />
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(cy - T / 2)} x2="0" y2={f2(cy + T / 2)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}lead`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.9" />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        {/* left / right of the amber front */}
        <clipPath id={`${uid}L`}>
          <rect x={-200} y={0} width={f2(front + 200)} height={1920} />
        </clipPath>
        <clipPath id={`${uid}R`}>
          <rect x={f2(front)} y={0} width={1400} height={1920} />
        </clipPath>
        {/* the numerals, knocked out of the cream tiles to the ground */}
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={0} y={f2(cy - T)} width={1080} height={f2(2 * T)}>
          <rect x={0} y={f2(cy - T)} width={1080} height={f2(2 * T)} fill="#fff" />
          {L.stations.map((s, i) => (
            <text key={i} x={f2(s.x)} y={f2(numY)} fontFamily={FONT_NUM} fontWeight={700} fontSize={f2(fs)} textAnchor="middle" fill="#000" style={{ fontFeatureSettings: '"lnum" 1' }}>
              {i + 1}
            </text>
          ))}
        </mask>
      </defs>

      {/* 1. the one shadow of the rail */}
      <ElevationShadow silhouette={sil} elevation="lifted" />

      {/* 2. the glass tube: tint, then the hairline (top and bottom; the inlet's end closed) */}
      {L.tubes.map((t, i) => (
        <g key={i}>
          <path d={rectPath(t.x0, tubeY, t.x1 - t.x0, tubeH, t.cap ? r : 0)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
          <path
            d={
              t.cap
                ? `M${f2(t.x1)} ${f2(tubeY + hair / 2)}H${f2(t.x0 + r)}A${r} ${r} 0 0 0 ${f2(t.x0 + hair / 2)} ${f2(tubeY + r)}V${f2(tubeY + tubeH - r)}A${r} ${r} 0 0 0 ${f2(t.x0 + r)} ${f2(tubeY + tubeH - hair / 2)}H${f2(t.x1)}`
                : `M${f2(t.x0)} ${f2(tubeY + hair / 2)}H${f2(t.x1)}M${f2(t.x0)} ${f2(tubeY + tubeH - hair / 2)}H${f2(t.x1)}`
            }
            fill="none"
            stroke={COLOR.glass}
            strokeOpacity={ALPHA.glassHi}
            strokeWidth={hair}
          />
        </g>
      ))}

      {/* 3. the cream stations right of the front (numerals knocked out) */}
      <g clipPath={`url(#${uid}R)`}>
        <g mask={`url(#${uid}k)`}>
          {L.stations.map((s, i) => (
            <path key={i} d={rectPath(s.left, s.top, T, T, r)} fill={`url(#${uid}c)`} />
          ))}
        </g>
        {L.stations.map((s, i) => (
          <path key={i} d={`M${f2(s.left + r)} ${f2(s.top + EDGE.CREAM / 2)}H${f2(s.right - r)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={EDGE.CREAM} />
        ))}
      </g>

      {/* 4. amber left of the front: the liquid in the tube and the reached stations — one glow pass */}
      <g style={{ filter: bloomFilter(1) }}>
        <g clipPath={`url(#${uid}L)`}>
          {L.tubes.map((t, i) => (
            <path key={i} d={rectPath(t.x0 + (t.cap ? inset : 0), tubeY + inset, t.x1 - t.x0 - (t.cap ? inset : 0), tubeH - 2 * inset, t.cap ? r - 1 : 0)} fill={`url(#${uid}a)`} />
          ))}
          {L.stations.map((s, i) => (
            <path key={i} d={rectPath(s.left, s.top, T, T, r)} fill={`url(#${uid}a)`} />
          ))}
        </g>
      </g>
      <g clipPath={`url(#${uid}L)`}>
        {/* hot top edges (true top surfaces), then the ink numerals */}
        {L.stations.map((s, i) => (
          <g key={i}>
            <path d={rectPath(s.left, s.top, T, EDGE.HOT_FALL, r, true, false)} fill={`url(#${uid}hf)`} />
            <path d={`M${f2(s.left + r)} ${f2(s.top + EDGE.HOT / 2)}H${f2(s.right - r)}`} stroke={COLOR.amberHot} strokeWidth={EDGE.HOT} />
            <text x={f2(s.x)} y={f2(numY)} fontFamily={FONT_NUM} fontWeight={700} fontSize={f2(fs)} textAnchor="middle" fill={COLOR.inkDark} style={{ fontFeatureSettings: '"lnum" 1' }}>
              {i + 1}
            </text>
          </g>
        ))}
        {L.tubes.map((t, i) => (
          <path key={i} d={`M${f2(t.x0 + (t.cap ? inset + r : 0))} ${f2(tubeY + inset + 0.75)}H${f2(t.x1)}`} stroke={COLOR.amberHot} strokeOpacity={0.7} strokeWidth={1.5} />
        ))}
        {/* the hot leading edge, only while the front moves */}
        {moving > 0.01
          ? (() => {
              const inTile = L.stations.find((s) => front > s.left && front <= s.right + 0.01);
              const y0 = inTile ? inTile.top : tubeY + inset;
              const h = inTile ? T : tubeH - 2 * inset;
              return (
                <g opacity={f2(moving)}>
                  <rect x={f2(front - 18)} y={f2(y0)} width={18} height={f2(h)} fill={`url(#${uid}lead)`} />
                  <rect x={f2(front - EDGE.HOT)} y={f2(y0)} width={EDGE.HOT} height={f2(h)} fill={COLOR.amberHot} />
                </g>
              );
            })()
          : null}
      </g>

    </g>
  );
};

/** The rail as a full-frame svg in SCREEN px: StoutStage's `overlay`. */
export const RailOverlay: React.FC<{ g: number }> = ({ g }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <Rail g={g} />
  </svg>
);

/** A stub scene's tile (used by the scene stubs until a builder replaces them). */
export const StubTile: React.FC<{ n: number; k: number }> = ({ n, k }) => {
  const S = 320;
  const x = bayX(n) - S / 2;
  const y = FLOOR - S;
  return (
    <g>
      <ElevationShadow silhouette={[{ d: rectPath(x, y, S, S) }]} elevation="rest" contact={{ x: bayX(n), y: FLOOR, w: S }} />
      <path d={rectPath(x, y, S, S)} fill={COLOR.cream} />
      <path d={`M${x + GEO.RADIUS} ${y + EDGE.CREAM / k / 2}H${x + S - GEO.RADIUS}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={EDGE.CREAM / k} />
      <text x={bayX(n)} y={y + S / 2 + 70} fontFamily={FONT_NUM} fontWeight={700} fontSize={200} textAnchor="middle" fill={COLOR.inkDark}>
        {n}
      </text>
    </g>
  );
};
