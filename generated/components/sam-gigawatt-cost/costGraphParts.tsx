// ---------------------------------------------------------------------------
// costGraphParts — THE LINE GRAPH's pieces (sam-gigawatt-cost cuts 1-2; plan: costGraphPlan.ts). One call draws the
// graph at any look: <CostGraph look drawn coin label ... /> inside an SVG whose group carries graphTransform(look).
// World px = the wide at k 1. Hairlines stay screen px; the line thins a little as the camera closes in.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { COLOR, FONT_LABEL, FONT_NUM, bloomFilter } from "../kits/cheeky-pint/stoutShared";
import { LabMark } from "./costChartParts";
import { COIN_R, GRID_M, PLOT, POINTS, PX_PER_M, S_TOTAL, TITLE, TYPE, Y0, YEAR_BASE, YEARS, pointAt, xOf, type Look, type Point, type PointLabel } from "./costGraphPlan";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const uidOf = (raw: string) => `cg${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
export const graphTransform = (c: Look) => `translate(540 960) scale(${c.k}) translate(${-c.x} ${-c.y})`;
const easeOut = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);

// --- type metrics (approximate Söhne advances, em) -----------------------------------------------------------------
const capsEm = (s: string) =>
  [...s].reduce((a, ch) => a + (ch === " " ? 0.28 : ch === "." ? 0.3 : ch === "-" ? 0.42 : /[0-9]/.test(ch) ? 0.6 : ch === "I" ? 0.3 : ch === "M" || ch === "W" ? 0.86 : 0.68) + 0.06, 0);
const numEm = (s: string) => [...s].reduce((a, ch) => a + (ch === "$" ? 0.6 : ch === "M" ? 0.86 : 0.6), 0);
const pxOf = (kind: "name" | "value" | "callout") => (kind === "name" ? TYPE.name : kind === "value" ? TYPE.value : TYPE.callout);
const widthOf = (text: string, kind: "name" | "value" | "callout") => (kind === "name" ? capsEm(text) : numEm(text)) * pxOf(kind);
/** a $ tick label's width, a year's width, the title's width (world px; for the layout checks) */
export const TICK_W = (m: number) => numEm(m === 0 ? "$0" : `$${m}M`) * TYPE.tick;
export const YEAR_W = numEm("2020") * TYPE.year;
export const TITLE_W = capsEm(TITLE.text) * TYPE.title;
/** a label's box (world px) for the gridline knockout */
export const labelBox = (L: PointLabel) => {
  let top = Infinity;
  let bot = -Infinity;
  let w = 0;
  let base = L.base;
  L.lines.forEach((ln, j) => {
    if (j > 0) base += L.gap[j - 1];
    const px = pxOf(ln.kind);
    top = Math.min(top, base - px * 0.74);
    bot = Math.max(bot, base);
    w = Math.max(w, widthOf(ln.text, ln.kind));
  });
  const x0 = L.align === "start" ? L.x : L.align === "end" ? L.x - w : L.x - w / 2;
  return { x0, x1: x0 + w, y0: top, y1: bot };
};

/** the house text entrance in world space: slide up 24 screen px + fade + blur */
export const Rise: React.FC<{ e: number; k: number; children: React.ReactNode }> = ({ e, k, children }) => {
  const a = easeOut(e);
  if (a <= 0.001) return null;
  return (
    <g opacity={f3(a)} transform={a < 1 ? `translate(0 ${f3(((1 - a) * 24) / k)})` : undefined} style={{ filter: a < 1 ? `blur(${f3((6 * (1 - a)) / k)}px)` : undefined }}>
      {children}
    </g>
  );
};

/** One point's label: names in Kräftig caps (+0.06 em), values in Dreiviertelfett, cream. */
export const PointText: React.FC<{ p: Point }> = ({ p }) => {
  const L = p.label;
  let base = L.base;
  return (
    <g fill={COLOR.inkCream}>
      {L.lines.map((ln, j) => {
        if (j > 0) base += L.gap[j - 1];
        const isName = ln.kind === "name";
        return (
          <text
            key={j}
            x={f3(L.x)}
            y={f3(base)}
            textAnchor={L.align}
            fontFamily={isName ? FONT_LABEL : FONT_NUM}
            fontWeight={isName ? 500 : 700}
            fontSize={f3(pxOf(ln.kind))}
            letterSpacing={isName ? "0.06em" : "-0.015em"}
            style={isName ? undefined : { fontFeatureSettings: '"lnum" 1' }}
          >
            {ln.text}
          </text>
        );
      })}
    </g>
  );
};

/** One coin: a cream disc on the line carrying the lab's mark in ink, one soft shadow down-right. `open` 0..1: it
 *  opens out of the line (from the line's width to full) as the tip draws it. */
export const Coin: React.FC<{ p: Point; open: number; k: number; lw: number }> = ({ p, open, k, lw }) => {
  const a = easeOut(open);
  if (a <= 0.001) return null;
  const r = lw / 2 + (COIN_R - lw / 2) * a;
  return (
    <g>
      <circle cx={f3(p.x + 3)} cy={f3(p.y + 5)} r={f3(r)} fill={COLOR.shadow} opacity={0.4} style={{ filter: `blur(${f3(Math.max(4, 2 / k))}px)` }} />
      <circle cx={f3(p.x)} cy={f3(p.y)} r={f3(r)} fill={COLOR.cream} />
      <path d={`M${f3(p.x - r)} ${f3(p.y)}A${f3(r)} ${f3(r)} 0 0 0 ${f3(p.x + r)} ${f3(p.y)}Z`} fill={COLOR.creamFoot} opacity={0.6} />
      {p.lab && a > 0.5 ? (
        <g opacity={f3(clamp01((a - 0.5) / 0.5))}>
          <LabMark lab={p.lab} cx={p.x} cy={p.y} size={r * 1.12} max={r * 1.32} />
        </g>
      ) : null}
    </g>
  );
};

/**
 * CostGraph — the whole graph at a look. `drawn` = the line's drawn arc length (S_TOTAL = all), `coin(i)` 0..1,
 * `label(i)` 0..1 (each point's label entrance), `grid` 0..1 the gridlines and axis lines (they are there from the
 * start; 1), `axes` 0..1 the $ labels, `years` 0..1 the year row, `title` 0..1.
 */
export const CostGraph: React.FC<{
  look: Look;
  drawn: number;
  coin: (i: number) => number;
  label: (i: number) => number;
  axes: number;
  years: number;
  title: number;
}> = ({ look, drawn, coin, label, axes, years, title }) => {
  const uid = uidOf(useId());
  const k = look.k;
  const hair = 1.6 / k;
  const lw = 6 * Math.pow(k, -0.4);
  // the drawn polyline
  const tip = pointAt(drawn);
  const pts: string[] = [];
  for (let i = 0; i <= tip.j; i++) pts.push(`${f3(POINTS[i].x)} ${f3(POINTS[i].y)}`);
  pts.push(`${f3(tip.x)} ${f3(tip.y)}`);
  const drawing = drawn < S_TOTAL - 0.5;
  // labels whose boxes knock out the gridlines (only while shown)
  const knock = POINTS.filter((p) => label(p.i) > 0.01).map((p) => labelBox(p.label));
  return (
    <g>
      <defs>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={9000} height={9000}>
          <rect x={-4000} y={-4000} width={9000} height={9000} fill="#fff" />
          {knock.map((b, j) => (
            <rect key={j} x={f3(b.x0 - 10)} y={f3(b.y0 - 8)} width={f3(b.x1 - b.x0 + 20)} height={f3(b.y1 - b.y0 + 16)} rx={6} fill="#000" />
          ))}
        </mask>
      </defs>
      {/* gridlines every $100M and the $0 axis (cream tones, screen hairlines), the year ticks */}
      <g mask={`url(#${uid}m)`}>
        {GRID_M.map((m) => (
          <line key={m} x1={PLOT.x0} x2={PLOT.x1} y1={f3(Y0 - m * PX_PER_M)} y2={f3(Y0 - m * PX_PER_M)} stroke={COLOR.inkCreamLo} strokeOpacity={0.42} strokeWidth={f3(hair)} />
        ))}
      </g>
      <line x1={PLOT.x0} x2={PLOT.x1} y1={Y0} y2={Y0} stroke={COLOR.inkCream} strokeOpacity={0.7} strokeWidth={f3(2.4 / k)} />
      {YEARS.map((y) => (
        <line key={y} x1={f3(xOf(y))} x2={f3(xOf(y))} y1={Y0} y2={f3(Y0 + 12)} stroke={COLOR.inkCream} strokeOpacity={0.7} strokeWidth={f3(2.4 / k)} />
      ))}
      {/* the $ labels on the left, sitting on their gridlines */}
      <Rise e={axes} k={k}>
        <g fontFamily={FONT_NUM} fontWeight={700} fontSize={TYPE.tick} fill={COLOR.inkCream} style={{ fontFeatureSettings: '"lnum" 1' }}>
          {[0, ...GRID_M].map((m) => (
            <text key={m} x={PLOT.labelX} y={f3(Y0 - m * PX_PER_M - 10)} letterSpacing="-0.015em">
              {`$${m}M`.replace("$0M", "$0")}
            </text>
          ))}
        </g>
      </Rise>
      {/* the years under the axis */}
      <Rise e={years} k={k}>
        <g fontFamily={FONT_NUM} fontWeight={700} fontSize={TYPE.year} fill={COLOR.inkCream} style={{ fontFeatureSettings: '"lnum" 1' }}>
          {YEARS.map((y) => (
            <text key={y} x={f3(xOf(y))} y={f3(YEAR_BASE)} textAnchor="middle" letterSpacing="-0.015em">
              {y}
            </text>
          ))}
        </g>
      </Rise>
      {/* the line (amber = the dollars) and its tip */}
      <g style={{ filter: bloomFilter(k) }}>
        <polyline points={pts.join(" ")} fill="none" stroke={COLOR.amberTop} strokeWidth={f3(lw)} strokeLinejoin="round" strokeLinecap="round" />
        {drawing ? <circle cx={f3(tip.x)} cy={f3(tip.y)} r={f3(lw * 0.9)} fill={COLOR.amberHot} /> : null}
      </g>
      {/* the coins, then the labels */}
      {POINTS.map((p) => (
        <Coin key={`c${p.i}`} p={p} open={coin(p.i)} k={k} lw={lw} />
      ))}
      {POINTS.map((p) => (
        <Rise key={`l${p.i}`} e={label(p.i)} k={k}>
          <PointText p={p} />
        </Rise>
      ))}
      <Rise e={title} k={k}>
        <g fontFamily={FONT_LABEL} fill={COLOR.inkCream}>
          <text x={TITLE.x} y={TITLE.y} fontSize={TYPE.title} letterSpacing="0.06em">
            {TITLE.text}
          </text>
          <text x={TITLE.x} y={TITLE.subY} fontSize={TYPE.sub} letterSpacing="0.06em" fill={COLOR.inkCreamLo}>
            {TITLE.sub}
          </text>
        </g>
      </Rise>
    </g>
  );
};
