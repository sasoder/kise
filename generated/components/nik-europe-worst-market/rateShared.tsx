// ---------------------------------------------------------------------------
// rateShared (nik-europe-worst-market, cut 20 RateIcons): the matched pair of Cheeky Pint rate icons.
// ONE tile (cream card, the kit's lit top edge, its one rest shadow with the soft contact ellipse, the kit's grain
// on twos clipped to the card), ONE glyph frame (Lucide grammar in a 24-unit box at the kit's GLYPH_STROKE world
// weight), ONE percent mark drawn here and shared by both icons (same size, same place in the tile), ONE ink label.
// Ink + cream only: amber means what the bank keeps in this clip, and this beat only names the two rates.
//
// UNITS: a tile is TILE (96) world px seen at k = size / TILE screen px per world px. Shadows and the glyph are in
// world px (they scale with the tile, as under a camera); the lit edge is SCREEN px (EDGE.CREAM / k).
// LOOP: everything is driven by loop frame lf (0..RATE_LOOP-1) through u = lf / RATE_LOOP; every periodic part does
// whole cycles; event envelopes are zero at both ends of the loop, so frame RATE_LOOP-1 -> 0 has no seam.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { Img, staticFile } from "remotion";
import { ALPHA, COLOR, EDGE, FONT_LABEL, GEO, GRAIN, GROUND, TRACK, clamp01, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { GLYPH_STROKE, TILE, UnionShadow, restToRest } from "../kits/cheeky-pint/museShared";

/** One loop = styles/icon-loops.md's LOOP_FRAMES (96 frames, ~4 s at 23.976). */
export const RATE_LOOP = 96;

export const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
export const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `rt${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
/** The stable scatter hash of styles/icon-loops.md. */
const hash = (i: number, kk: number) => {
  const s = Math.sin(i * 12.9898 + kk * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
export const mod = (a: number, n: number) => ((a % n) + n) % n;

// --- the glyph frame ----------------------------------------------------------------------------------------------
// Both glyphs are drawn in one 24-unit box and share this placement, so the percent mark lands on the same tile
// spot in both. NOMINAL = the pair's ink box centre (units). With a label the glyph sits higher and a little smaller.
const NOMINAL = { x: 12.3, y: 13.0 } as const;
export type GlyphFrame = { sc: number; cx: number; cy: number; sw: number };
export const glyphFrame = (label: boolean): GlyphFrame => {
  const sc = label ? 2.7 : 2.95; // world px per glyph unit
  return { sc, cx: TILE / 2, cy: label ? 39.5 : 48.5, sw: GLYPH_STROKE / sc };
};
export const glyphTransform = (g: GlyphFrame) => `translate(${fx(g.cx - NOMINAL.x * g.sc)} ${fx(g.cy - NOMINAL.y * g.sc)}) scale(${fx(g.sc)})`;

// --- the label (ink, inside the card) ---------------------------------------------------------------------------
/** Söhne Kräftig caps in ink, a size up from TYPE.LABEL: 9.6 world px = 34 px on RateIcons' 344 px tile, 58 px on a 576 loop master. */
export const LABEL_SIZE = 9.6;
export const LABEL_BASE = 85;

// --- the percent mark (glyph units) ----------------------------------------------------------------------------
// Lucide "percent" grammar (two rings and the slash), proportioned for the heavy stroke: rings big enough that
// their holes stay open on a phone. It overlaps the object's lower-right corner, cut out of it by a gap of the card.
export const PCT = { x: 20.2, y: 18.0, off: 2.9, r: 2.05, slash: 4.6, gap: 1.35 } as const;
const pctEls = (sw: number) => ({
  rings: [
    [PCT.x - PCT.off, PCT.y - PCT.off],
    [PCT.x + PCT.off, PCT.y + PCT.off],
  ] as const,
  slash: `M${f3(PCT.x + PCT.slash)} ${f3(PCT.y - PCT.slash)}L${f3(PCT.x - PCT.slash)} ${f3(PCT.y + PCT.slash)}`,
  sw,
});
/** The percent's pose: lift (units, up) and a turn (deg) about its own centre. */
export type PctPose = { lift: number; rot: number; sx?: number; sy?: number };
export const pctTransform = (p: PctPose) =>
  `translate(${fx(PCT.x)} ${fx(PCT.y - p.lift)}) rotate(${f3(p.rot)}) scale(${fx(p.sx ?? 1)} ${fx(p.sy ?? 1)}) translate(${fx(-PCT.x)} ${fx(-PCT.y)})`;
/** The percent mark itself, in ink (draw inside glyphTransform). */
export const PercentMark: React.FC<{ sw: number; pose: PctPose }> = ({ sw, pose }) => {
  const e = pctEls(sw);
  return (
    <g transform={pctTransform(pose)} fill="none" stroke={COLOR.inkDark} strokeWidth={f3(sw)} strokeLinecap="round" strokeLinejoin="round">
      <path d={e.slash} />
      {e.rings.map(([x, y], i) => (
        <circle key={i} cx={f3(x)} cy={f3(y)} r={f3(PCT.r)} />
      ))}
    </g>
  );
};
/** The percent's knock-out (black in a mask): its strokes widened by the gap, rings filled. */
const PercentKnock: React.FC<{ sw: number; pose: PctPose }> = ({ sw, pose }) => {
  const e = pctEls(sw);
  const w = sw + 2 * PCT.gap;
  return (
    <g transform={pctTransform(pose)} fill="#000" stroke="#000" strokeWidth={f3(w)} strokeLinecap="round" strokeLinejoin="round">
      <path d={e.slash} fill="none" />
      {e.rings.map(([x, y], i) => (
        <circle key={i} cx={f3(x)} cy={f3(y)} r={f3(PCT.r)} />
      ))}
    </g>
  );
};
/** The object (card, coin stack) with the percent cut out of it, then the percent on top. Glyph units. */
export const WithPercent: React.FC<{ sw: number; pose: PctPose; children: React.ReactNode }> = ({ sw, pose, children }) => {
  const id = uidOf(useId());
  return (
    <g>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-12} y={-12} width={48} height={48}>
          <rect x={-12} y={-12} width={48} height={48} fill="#fff" />
          <PercentKnock sw={sw} pose={pose} />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>{children}</g>
      <PercentMark sw={sw} pose={pose} />
    </g>
  );
};

// --- motion helpers (loop frames) ------------------------------------------------------------------------------
/** A soft event: 0 before f0, eases up to 1 by f0 + up (ease-out), holds `hold`, then lands back to 0 over `down`
 *  (rest to rest, no overshoot). Zero outside [f0, f0 + up + hold + down]. */
export const pulseAt = (lf: number, f0: number, up: number, hold: number, down: number) => {
  const d = lf - f0;
  if (d <= 0) return 0;
  if (d < up) return 1 - Math.pow(1 - d / up, 3);
  if (d < up + hold) return 1;
  return 1 - restToRest((d - up - hold) / down, 2.2);
};
/** The percent's pose, one shape for both icons: its response to its object's action (it ticks up and turns a hair,
 *  fast in, 3 f, then settles over 16 f, from the contact frame f0) on top of a slow volume-preserving breath
 *  (x up while y goes down, +-2.5 %, one whole cycle per loop). `amp` = liveliness. */
export const percentTick = (lf: number, f0: number, amp: number): PctPose => {
  const p = pulseAt(lf, f0, 3, 1, 16);
  const b = 0.025 * amp * Math.sin(2 * Math.PI * (lf / RATE_LOOP));
  return { lift: 0.75 * p * amp, rot: -7 * p * amp, sx: 1 + b, sy: 1 - b };
};
/** The idle breath of a glyph part: whole cycles per loop. */
export const breath = (lf: number, cycles = 1, phase = 0) => Math.sin(2 * Math.PI * (cycles * (lf / RATE_LOOP) + phase));

// --- the tile ---------------------------------------------------------------------------------------------------
export type Enter = { dy: number; scale: number; opacity: number };
export const REST: Enter = { dy: 0, scale: 1, opacity: 1 };
/** The kit's entrance for a tile: slide up + scale from 0.96 + a quick fade, ease-out, no bounce (t 0..1 linear). */
export const tileEnter = (t: number, slide = 28): Enter => {
  const e = 1 - Math.pow(1 - clamp01(t), 3);
  // the fade is done in the first ~40 % of the move, so no see-through card lingers over the photo below
  return { dy: (1 - e) * slide, scale: 0.96 + 0.04 * e, opacity: 1 - Math.pow(1 - clamp01(t / 0.4), 2) };
};

/**
 * RateTile — one rate icon: the cream card centred on (cx, cy) SCREEN px, `size` px square, its one rest shadow
 * with the contact ellipse, the lit top edge, the grain on twos clipped to the card, the glyph (children, drawn in
 * tile-local world px 0..TILE) and the ink label. `lf` = the loop frame (the grain's clock). `enter` = the entrance.
 */
export const RateTile: React.FC<{
  size: number;
  cx: number;
  cy: number;
  lf: number;
  label?: string | null;
  enter?: Enter;
  children: React.ReactNode;
}> = ({ size, cx, cy, lf, label = null, enter = REST, children }) => {
  const id = uidOf(useId());
  const k = size / TILE;
  const m = size * 0.8; // room for the shadow around the card
  const W = size + 2 * m;
  const r = GEO.RADIUS;
  const d = rectPath(0, 0, TILE, TILE, r);
  const ey = EDGE.CREAM / k / 2;
  const g2 = Math.floor(mod(lf, RATE_LOOP) / 2);
  const grx = (hash(g2, 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash(g2, 7) * 2 - 1) * GRAIN.travel;
  if (enter.opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - W / 2,
        top: cy - W / 2,
        width: W,
        height: W,
        opacity: enter.opacity < 1 ? enter.opacity : undefined,
        transform: enter.dy !== 0 || enter.scale !== 1 ? `translateY(${fx(enter.dy)}px) scale(${fx(enter.scale)})` : undefined,
        transformOrigin: "50% 50%",
        isolation: "isolate",
      }}
    >
      <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`${id}c`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={TILE}>
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
        </defs>
        <g transform={`translate(${fx(m)} ${fx(m)}) scale(${fx(k)})`}>
          <UnionShadow sil={[{ d }]} elevation="rest" contact={{ x: TILE / 2, y: TILE, w: TILE }} />
          <path d={d} fill={`url(#${id}c)`} />
          <path d={`M${f3(r)} ${f3(ey)}H${f3(TILE - r)}`} stroke={COLOR.edge} strokeOpacity={f3(ALPHA.edge)} strokeWidth={f3(EDGE.CREAM / k)} />
          {children}
          {label ? (
            <text
              x={f3(TILE / 2 + (TRACK.label * LABEL_SIZE) / 2)}
              y={LABEL_BASE}
              fontFamily={FONT_LABEL}
              fontWeight={500}
              fontSize={LABEL_SIZE}
              letterSpacing={`${TRACK.label}em`}
              textAnchor="middle"
              fill={COLOR.inkDark}
              style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
            >
              {label.toUpperCase()}
            </text>
          ) : null}
        </g>
      </svg>
      {/* the kit's grain (overlay, on twos), on the card only */}
      <div style={{ position: "absolute", left: m, top: m, width: size, height: size, borderRadius: r * k, overflow: "hidden", mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
        <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (size - GROUND.W) / 2 + grx, top: (size - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
      </div>
    </div>
  );
};

/** A loop master: the 1080 x 1080 transparent square with one tile, optically centred (the shadow hangs below). */
export const SQUARE = 1080;
export const squareCentre = (size: number) => ({ cx: SQUARE / 2, cy: SQUARE / 2 - size * 0.06 });

export { smoothstep };
