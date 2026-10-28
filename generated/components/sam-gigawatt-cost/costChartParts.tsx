// ---------------------------------------------------------------------------
// costChartParts — THE CHART's pieces (sam-gigawatt-cost; owned by cut 1, FrontierCostClimbs; others import it
// read-only). One call draws the whole chart at any camera: <CostChart look f rise open />, inside an SVG whose
// group carries chartTransform(look). Geometry and data: costChartPlan.ts. The slab, the earth under it, the slots
// and their lips are scott-radar-map/npsColumnsParts.tsx (imported read-only); the glass column is that file's
// UpColumn COPIED and adapted (exact real fill at every height, a rung every $100M, an empty glass stub for the
// near-zero early decade). All geometry in world px; `k` = the camera zoom (hairlines, edges and bloom stay screen px).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { ALPHA, COLOR, EDGE, FONT_LABEL, FONT_NUM, STROKE, bloomFilter, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { fogAmount } from "../scott-aircraft-order/aircraftShared";
import { EarthSection, Slot, SlotLip, earthTones } from "../scott-radar-map/npsColumnsParts";
import { ROWS } from "./frontierCostData";
import { LAB_MARKS, type LabId } from "./labMarks";
import { COL_W, GROUND, N, ROW_X0, ROW_X1, RUNG, SCALE_STEPS, PX_PER_M, TILE, TITLE, ZC, colX, fillAt, glassLen } from "./costChartPlan";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `cc${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const RADIUS = 6;
export type Look = { x: number; y: number; k: number };
/** the overlay group's transform for a look (world px -> screen px) */
export const chartTransform = (c: Look) => `translate(540 960) scale(${c.k}) translate(${-c.x} ${-c.y})`;
/** the chart plane's fog (aircraftShared's distance fog at the cut edge) */
export const CHART_FOG = fogAmount(ZC);

/** The hot top edge of an amber body (SCREEN px: 2 px line + a 12 px falloff); stoutShared's recipe. */
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; id: string }> = ({ x, y, w, k, id }) => {
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, fall, 0, false, false)} fill={`url(#${id})`} />
      <path d={`M${f3(x)} ${f3(y + EDGE.HOT / k / 2)}H${f3(x + w)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
    </g>
  );
};

/** the glass hairline: two sides and the closed top, open at the slot (`base`) */
const glassPath = (x0: number, w: number, base: number, top: number, r: number, hw: number) => {
  const xl = x0 + hw;
  const xr = x0 + w - hw;
  const e = top + hw;
  return `M${f3(xl)} ${f3(base)}V${f3(e + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(xl + r)} ${f3(e)}H${f3(xr - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(xr)} ${f3(e + r)}V${f3(base)}`;
};

/**
 * CostColumn — row i's glass column risen `h` out of its slot at GROUND: a cream glass body and hairline, the amber
 * fill inside to the row's real value (fillAt: the headroom closes as it leaves the slot), band gradient, fixed bloom,
 * the 2 px hot top edge, a rung every $100M, the key light's streak down the left of the glass, foot occlusion.
 */
export const CostColumn: React.FC<{ i: number; h: number; k: number; band: [number, number] }> = ({ i, h, k, band }) => {
  const uid = uidOf(useId());
  if (h <= 2 / k) return null;
  const T = earthTones(CHART_FOG);
  const w = COL_W;
  const x0 = colX(i) - w / 2;
  const base = GROUND;
  const top = base - h;
  const fh = fillAt(i, h);
  const fy = base - fh;
  const r = Math.min(RADIUS, w / 2, h / 2);
  const hair = Math.max(STROKE.HAIRLINE, 2) / k;
  const rungs: number[] = [];
  for (let j = 1; j * RUNG < fh; j++) {
    const y = base - j * RUNG;
    if (y > fy + (EDGE.HOT + 4) / k) rungs.push(y);
  }
  const sx = x0 + w * 0.13;
  const sw = Math.max(w * 0.09, 3 / k);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
          <stop offset="0" stopColor={T.amberTop} />
          <stop offset="1" stopColor={T.amberFoot} />
        </linearGradient>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <linearGradient id={`${uid}fs`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.16" />
          <stop offset="0.3" stopColor={COLOR.amberHot} stopOpacity="0" />
          <stop offset="0.62" stopColor={COLOR.amberFoot} stopOpacity="0" />
          <stop offset="1" stopColor={mixHex(COLOR.amberFoot, COLOR.inkDark, 0.3)} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* contact shadow on the apron, away from the key light */}
      <ellipse cx={f3(x0 + w / 2 + 6)} cy={f3(base - 1)} rx={f3(w * 0.62)} ry={f3(4)} fill={COLOR.shadow} opacity={0.5} style={{ filter: `blur(${f3(3 / k)}px)` }} />
      <path d={rectPath(x0, top, w, h, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
      {fh > 0.05 ? (
        <g style={{ filter: bloomFilter(k) }}>
          <path d={rectPath(x0, fy, w, fh, 0, false, false)} fill={`url(#${uid}a)`} />
          <path d={rectPath(x0, fy, w, fh, 0, false, false)} fill={`url(#${uid}fs)`} />
        </g>
      ) : null}
      {rungs.length ? (
        <g stroke={T.rung} strokeWidth={f3(STROKE.HAIRLINE / k)}>
          {rungs.map((y) => (
            <line key={y} x1={f3(x0)} x2={f3(x0 + w)} y1={f3(y)} y2={f3(y)} />
          ))}
        </g>
      ) : null}
      {fh > 0.05 ? <HotEdge x={x0} y={fy} w={w} k={k} id={`${uid}h`} /> : null}
      <rect x={f3(x0)} y={f3(base - Math.min(h, EDGE.FOOT_AO / k))} width={f3(w)} height={f3(Math.min(h, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
      {h > r + 6 / k ? <rect x={f3(sx)} y={f3(top + r + 2 / k)} width={f3(sw)} height={f3(Math.max(0, h - r - 4 / k))} rx={f3(sw / 2)} fill={COLOR.glass} fillOpacity={0.12} /> : null}
      <path d={glassPath(x0, w, base, top, r, hair / 2)} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair)} />
    </g>
  );
};

// --- the tiles ----------------------------------------------------------------------------------------------
/** approximate Söhne advance (em) for fitting a caps line into the tile (Kräftig caps + 0.06 em tracking) */
const capsEm = (s: string) =>
  [...s].reduce((a, ch) => a + (ch === " " ? 0.28 : ch === "." ? 0.3 : ch === "-" ? 0.42 : /[0-9]/.test(ch) ? 0.6 : ch === "I" ? 0.3 : ch === "M" || ch === "W" ? 0.86 : 0.68) + 0.06, 0);
/** the tile's layout (world px, from the tile's top-left) */
export const TILE_LAYOUT = { pad: 12, markBox: 50, markCy: 40, famPx: 24, famBase: 90, verPx: 40, verBase: 130, markOnlyBox: 66 } as const;

/** One lab mark as a one-colour ink stamp, centred on (cx, cy), its geometric mean `size` (max side `max`). */
export const LabMark: React.FC<{ lab: LabId; cx: number; cy: number; size: number; max: number; color?: string }> = ({ lab, cx, cy, size, max, color = COLOR.inkDark }) => {
  const m = LAB_MARKS[lab];
  const [vx, vy, vw, vh] = m.vb;
  let sc = size / Math.sqrt(vw * vh);
  sc = Math.min(sc, max / vw, max / vh);
  const tx = cx - (vx + vw / 2) * sc;
  const ty = cy - (vy + vh / 2) * sc;
  return (
    <g transform={`translate(${f3(tx)} ${f3(ty)}) scale(${f3(sc)})`} fill={color} fillRule={m.evenodd ? "evenodd" : "nonzero"}>
      {m.d.map((d, j) => (
        <path key={j} d={d} />
      ))}
    </g>
  );
};

/**
 * LabTile — row i's cream nameplate on the slab's cut face under its column: the lab's mark in ink (top) and, for
 * the named models, the family in Kräftig caps and the version in Dreiviertelfett (the plate carries its text in
 * ink, styles/cheeky-pint.md). One soft shadow down-right (the key light is above-left); the lit top edge.
 */
export const LabTile: React.FC<{ i: number; k: number }> = ({ i, k }) => {
  const row = ROWS[i];
  const L = TILE_LAYOUT;
  const x = colX(i) - TILE.w / 2;
  const y = TILE.top;
  const cx = colX(i);
  const inner = TILE.w - 2 * L.pad;
  const fam = row.name ? row.name[0] : null;
  const ver = row.name ? row.name[1] : null;
  const famPx = fam ? Math.min(L.famPx, inner / capsEm(fam)) : 0;
  const verIsNum = ver ? /^[0-9.]+$/.test(ver) : false;
  const verPx = ver ? (verIsNum ? L.verPx : Math.min(L.famPx * 1.15, inner / capsEm(ver))) : 0;
  const d = rectPath(x, y, TILE.w, TILE.h, TILE.r);
  return (
    <g>
      {/* one shadow: ambient + key, offset down-right */}
      <path d={d} transform={`translate(${f3(5)} ${f3(8)})`} fill={COLOR.shadow} opacity={0.42} style={{ filter: `blur(${f3(Math.max(7, 2.5 / k))}px)` }} />
      <path d={d} fill={COLOR.cream} />
      <rect x={f3(x)} y={f3(y + TILE.h * 0.55)} width={f3(TILE.w)} height={f3(TILE.h * 0.45)} fill={COLOR.creamFoot} opacity={0.55} />
      <rect x={f3(x + TILE.r)} y={f3(y)} width={f3(TILE.w - 2 * TILE.r)} height={f3(EDGE.CREAM / k)} fill={COLOR.edge} opacity={ALPHA.edge} />
      {row.lab ? (
        fam ? (
          <LabMark lab={row.lab} cx={cx} cy={y + L.markCy} size={L.markBox * 0.86} max={L.markBox} />
        ) : (
          <LabMark lab={row.lab} cx={cx} cy={y + TILE.h / 2} size={L.markOnlyBox * 0.86} max={L.markOnlyBox} />
        )
      ) : null}
      {fam ? (
        <text x={f3(cx)} y={f3(y + L.famBase)} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={f3(famPx)} letterSpacing="0.06em" fill={COLOR.inkDark}>
          {fam}
        </text>
      ) : null}
      {ver ? (
        <text
          x={f3(cx)}
          y={f3(y + L.verBase)}
          textAnchor="middle"
          fontFamily={verIsNum ? FONT_NUM : FONT_LABEL}
          fontWeight={verIsNum ? 700 : 500}
          fontSize={f3(verPx)}
          letterSpacing={verIsNum ? "-0.015em" : "0.06em"}
          fill={COLOR.inkDark}
          style={{ fontFeatureSettings: '"lnum" 1' }}
        >
          {ver}
        </text>
      ) : null}
    </g>
  );
};

// --- the whole chart ------------------------------------------------------------------------------------------
/** the columns (and tiles) whose x is within the frame at this look (+ a margin in world px) */
export const visibleRows = (look: Look, margin = 200) => {
  const half = 540 / look.k + margin;
  const out: number[] = [];
  for (let i = 0; i < N; i++) if (Math.abs(colX(i) - look.x) <= half) out.push(i);
  return out;
};
/** the earth section's fixed extent (fixed so its pebbles and strata never move with the camera) */
export const EARTH = { x0: ROW_X0 - 6000, x1: ROW_X1 + 6000, depth: 9000 } as const;

/**
 * CostChart — the whole chart at a look: the slab and earth, the tiles on the slab face, each column's slot,
 * column and slot lip. `rise(i)` = row i's risen glass height (world px; glassLen(i) when standing), `open(i)` =
 * its slot's opening 0..1. Draw inside <g transform={chartTransform(look)}>. `band` = amberBandFor(look).
 */
export const CostChart: React.FC<{ look: Look; band: [number, number]; rise: (i: number) => number; open: (i: number) => number }> = ({ look, band, rise, open }) => {
  const k = look.k;
  const rows = visibleRows(look);
  return (
    <g>
      <EarthSection x0={EARTH.x0} x1={EARTH.x1} top={GROUND} depth={EARTH.depth} k={k} fog={CHART_FOG} />
      {rows.map((i) => (
        <LabTile key={`t${i}`} i={i} k={k} />
      ))}
      {rows.map((i) => (
        <Slot key={`s${i}`} x={colX(i)} top={GROUND} w={COL_W} k={k} open={open(i)} />
      ))}
      {rows.map((i) => (
        <g key={`c${i}`}>
          <CostColumn i={i} h={rise(i)} k={k} band={band} />
          <SlotLip x={colX(i)} top={GROUND} w={COL_W} k={k} />
        </g>
      ))}
    </g>
  );
};

// --- for the wide (cut 2) --------------------------------------------------------------------------------------
/** The chart's small title in world space (TITLE in costChartPlan): Kräftig caps, cream; the source line in
 *  cream-lo under it. `enter` 0..1 = the house text entrance (slide up 24 screen px + fade + blur). */
export const ChartTitle: React.FC<{ k: number; enter?: number }> = ({ k, enter = 1 }) => {
  const e = clamp01(enter);
  if (e <= 0.001) return null;
  const a = 1 - Math.pow(1 - e, 3);
  const dy = ((1 - a) * 24) / k;
  return (
    <g opacity={f3(a)} style={{ filter: a < 1 ? `blur(${f3((6 * (1 - a)) / k)}px)` : undefined }}>
      <text x={f3(TITLE.x)} y={f3(TITLE.y + dy)} fontFamily={FONT_LABEL} fontSize={f3(TITLE.px)} letterSpacing="0.06em" fill={COLOR.inkCream}>
        {TITLE.text}
      </text>
      <text x={f3(TITLE.x)} y={f3(TITLE.subY + dy)} fontFamily={FONT_LABEL} fontSize={f3(TITLE.subPx)} letterSpacing="0.06em" fill={COLOR.inkCreamLo}>
        {TITLE.sub}
      </text>
    </g>
  );
};
/** Optional sparse scale: a short cream tick and "$100M" … "$400M" at the row's left end (world space, screen-px
 *  type `px`), no gridlines. Cut 2 decides whether to use it (and its tone: cream-lo washes out on the haze). */
export const ScaleTicks: React.FC<{ k: number; px?: number; enter?: number; color?: string; tick?: string }> = ({ k, px = 28, enter = 1, color = COLOR.inkCreamLo, tick = COLOR.edge }) => {
  const a = 1 - Math.pow(1 - clamp01(enter), 3);
  if (a <= 0.001) return null;
  const x = ROW_X0;
  return (
    <g opacity={f3(a)}>
      {SCALE_STEPS.map((m) => {
        const y = GROUND - m * PX_PER_M;
        return (
          <g key={m}>
            <rect x={f3(x)} y={f3(y - 1 / k)} width={f3(28 / k)} height={f3(2 / k)} fill={tick} opacity={0.7} />
            <text x={f3(x + 36 / k)} y={f3(y + (px * 0.36) / k)} fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(px / k)} fill={color} style={{ fontFeatureSettings: '"lnum" 1' }}>
              {`$${m}M`}
            </text>
          </g>
        );
      })}
    </g>
  );
};
/** the far right end of the row (for framing checks) */
export const ROW_END = { x0: ROW_X0, x1: ROW_X1, glassMax: glassLen(N - 1) } as const;
