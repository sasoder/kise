// ---------------------------------------------------------------------------
// hugeLandscapesArt: cut E's (43_HugeLandscapes) drawing helpers.
// TREES AND RIVER: cut D's (AllAboutEnergy.tsx) treeGlyph / TreeArt / River,
// copied VERBATIM (they are private to D's final file): E draws its own forest
// outside D's frame with the same generator and the same pen, so along the seam
// with D's world the two are identical pixel for pixel. Do not restyle them here.
// ---------------------------------------------------------------------------
import React from "react";
import { hash } from "../kits/maps/incaShared";
import { DARK, INK, LAND, SEA, inkPath, mixColor, type P2 } from "./firstFarmersShared";
import { riverW, riverY, type Tree } from "./allAboutEnergyState";

const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
export const PLANE = "#2B2219";
/** a tree's canopy plane: a shade under the page, so the forest stays a drawing and the page shows between */
export const CANOPY = mixColor(LAND, DARK, 0.34);
export const CTX = mixColor(LAND, INK, 0.56); // cream as context (the wild)

// ---------------------------------------------------------------------------
// THE FOREST: engraved trees in elevation, dark umber canopy planes in cream
// context line, hatched on the shaded (lower right) side; scrub; stumps
// ---------------------------------------------------------------------------
type Glyph = { outline: string; hatch: string; trunk: string; trunkLine: string; lit: string };
const glyphCache = new Map<string, Glyph>();
const treeGlyph = (kind: 0 | 1 | 2, v: number): Glyph => {
  const key = `${kind}-${v}`;
  const hit = glyphCache.get(key);
  if (hit) return hit;
  const spec = kind === 0 ? { cy: -360, rx: 172, ry: 172, lobes: 11, tr: 205 } : kind === 1 ? { cy: -440, rx: 118, ry: 236, lobes: 13, tr: 230 } : { cy: -175, rx: 158, ry: 150, lobes: 9, tr: 0 };
  const pts: P2[] = [];
  const N = 72;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const lobe = Math.abs(Math.sin((spec.lobes * th) / 2 + v * 0.7));
    const r = 1 - 0.09 * (1 - lobe) + 0.025 * Math.sin(5 * th + v);
    pts.push([Math.cos(th) * spec.rx * r, spec.cy + Math.sin(th) * spec.ry * r * (th > 0 && th < Math.PI ? 0.94 : 1)]);
  }
  const outline = inkPath(pts, true);
  // hatching: lines at 45 deg (down-left to up-right) across the canopy, kept on the shaded lower-right side
  let hatch = "";
  const gap = 17;
  for (let c = -spec.rx - spec.ry; c < spec.rx + spec.ry; c += gap) {
    // line: x - (y - cy) = c  ->  points (x, y) with x = c + (y - cy)
    const segs: P2[] = [];
    for (let k = 0; k <= 24; k++) {
      const yy = -spec.ry + (2 * spec.ry * k) / 24;
      const xx = c + yy;
      const inside = (xx / spec.rx) ** 2 + (yy / spec.ry) ** 2 < 0.86;
      const shade = xx / spec.rx + yy / spec.ry > 0.15 + 0.25 * hash(Math.round(c), 7 + v);
      if (inside && shade) segs.push([xx, spec.cy - yy]);
      else if (segs.length) break;
    }
    if (segs.length > 1) hatch += `M${P(segs[0])}L${P(segs[segs.length - 1])}`;
  }
  // lit scallops on the upper left
  let lit = "";
  for (let k = 0; k < 3; k++) {
    const th = Math.PI * (1.12 + 0.16 * k) + 0.08 * (hash(k, v) - 0.5);
    const p0: P2 = [Math.cos(th) * spec.rx * 0.72, spec.cy + Math.sin(th) * spec.ry * 0.72];
    lit += `M${P(p0)}q${(spec.rx * 0.12).toFixed(1)},${(-spec.ry * 0.1).toFixed(1)} ${(spec.rx * 0.26).toFixed(1)},${(-spec.ry * 0.04).toFixed(1)}`;
  }
  const tw = kind === 1 ? 20 : 26;
  const trunk = spec.tr ? `M${-tw},0Q${-tw * 0.6},${-spec.tr * 0.5} ${-tw * 0.5},${-spec.tr}L${tw * 0.5},${-spec.tr}Q${tw * 0.6},${-spec.tr * 0.5} ${tw},0Z` : "";
  const trunkLine = spec.tr ? `M${(tw * 0.2).toFixed(1)},-8L${(tw * 0.15).toFixed(1)},${(-spec.tr * 0.8).toFixed(1)}` : "";
  const g = { outline, hatch, trunk, trunkLine, lit };
  glyphCache.set(key, g);
  return g;
};
/** a tree / bush at its base point; s = its size (1 = a broadleaf ~540 world px tall) */
export const TreeArt: React.FC<{ t: Tree; scale?: number; squash?: number; k: number }> = ({ t, scale = 1, squash = 1, k }) => {
  const g = treeGlyph(t.kind, Math.floor(hash(t.seed, 9) * 6));
  const s = t.s * scale;
  const lw = (px: number) => Math.max(px / k, 1.2) / s; // a line weight in screen px, at least 1.2 world px
  return (
    <g transform={`translate(${t.x.toFixed(1)} ${t.y.toFixed(1)}) scale(${s.toFixed(3)} ${(s * squash).toFixed(3)})`}>
      <ellipse cx={0} cy={2} rx={150} ry={22} fill={DARK} fillOpacity={0.28} />
      {g.trunk ? <path d={g.trunk} fill={PLANE} stroke={DARK} strokeWidth={lw(2.4)} /> : null}
      {g.trunk ? <path d={g.trunk + g.trunkLine} fill="none" stroke={CTX} strokeWidth={lw(1.1)} strokeOpacity={0.8} /> : null}
      <path d={g.outline} fill={CANOPY} stroke={DARK} strokeWidth={lw(3.4)} strokeOpacity={0.8} />
      <path d={g.hatch} fill="none" stroke={CTX} strokeWidth={lw(1)} strokeOpacity={0.6} />
      <path d={g.lit} fill="none" stroke={CTX} strokeWidth={lw(1.1)} strokeOpacity={0.8} strokeLinecap="round" />
      <path d={g.outline} fill="none" stroke={CTX} strokeWidth={lw(1.6)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE RIVER (plan view): dark water between cream banks, two engraved water-lines
// ---------------------------------------------------------------------------
export const River: React.FC<{ x0: number; x1: number; k: number }> = ({ x0, x1, k }) => {
  const step = Math.max(40, 6 / k);
  const top: P2[] = [];
  const bot: P2[] = [];
  const l1: P2[] = [];
  const l2: P2[] = [];
  for (let x = x0 - step; x <= x1 + step; x += step) {
    const y = riverY(x);
    const w = riverW(x);
    top.push([x, y - w / 2]);
    bot.push([x, y + w / 2]);
    l1.push([x, y - w * 0.18]);
    l2.push([x, y + w * 0.2]);
  }
  const water = `${inkPath(top)}L${P(bot[bot.length - 1])}${inkPath([...bot].reverse()).replace(/^M/, "L")}Z`;
  const lw = Math.max(1.4 / k, 2);
  return (
    <g fill="none" strokeLinecap="round">
      <path d={water} fill={SEA} fillOpacity={0.9} />
      <path d={inkPath(l1)} stroke={CTX} strokeWidth={lw * 0.6} strokeOpacity={0.35} strokeDasharray={`${70} ${45}`} />
      <path d={inkPath(l2)} stroke={CTX} strokeWidth={lw * 0.6} strokeOpacity={0.3} strokeDasharray={`${50} ${60}`} />
      <path d={inkPath(top)} stroke={DARK} strokeWidth={lw * 2.2} strokeOpacity={0.6} />
      <path d={inkPath(bot)} stroke={DARK} strokeWidth={lw * 2.2} strokeOpacity={0.6} />
      <path d={inkPath(top)} stroke={CTX} strokeWidth={lw} />
      <path d={inkPath(bot)} stroke={CTX} strokeWidth={lw} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// E's own props
// ---------------------------------------------------------------------------
/** a gathering basket (side view), its rim centred on `at` (world), tilted `angle` deg (+ = clockwise), `full` 0..1
 *  how much of its load (cream nuts and roots) still shows above the rim. scale = px per figure unit. */
export const Basket: React.FC<{ at: P2; scale: number; angle?: number; full?: number }> = ({ at, scale, angle = 0, full = 1 }) => {
  const w = 46;
  const h = 52;
  const body = `M${-w},0Q${-w * 1.02},${h * 0.7} ${-w * 0.55},${h}L${w * 0.55},${h}Q${w * 1.02},${h * 0.7} ${w},0Z`;
  let weave = "";
  for (let i = 1; i < 5; i++) {
    const y = (h * i) / 5;
    const hw = w * (1 - 0.42 * (y / h) ** 2);
    weave += `M${(-hw + 3).toFixed(1)},${y.toFixed(1)}Q0,${(y + 5).toFixed(1)} ${(hw - 3).toFixed(1)},${y.toFixed(1)}`;
  }
  for (let i = -3; i <= 3; i++) weave += `M${(i * 12).toFixed(1)},2L${(i * 8.4).toFixed(1)},${(h - 2).toFixed(1)}`;
  const load = full > 0.02 ? `M${-w + 4},1Q${-w * 0.4},${(-22 * full - 4).toFixed(1)} 0,${(-26 * full).toFixed(1)}Q${w * 0.4},${(-22 * full - 4).toFixed(1)} ${w - 4},1Z` : "";
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${scale.toFixed(4)})`}>
      {load ? <path d={load} fill={mixColor(INK, "#B9AD8D", 0.35)} stroke={DARK} strokeWidth={2.4} strokeLinejoin="round" /> : null}
      <path d={body} fill={PLANE} stroke={DARK} strokeWidth={6} strokeLinejoin="round" />
      <path d={weave} fill="none" stroke={INK} strokeWidth={2} strokeOpacity={0.75} strokeLinecap="round" />
      <path d={body} fill="none" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d={`M${-w - 4},0L${w + 4},0`} stroke={DARK} strokeWidth={7} strokeLinecap="round" />
      <path d={`M${-w - 4},0L${w + 4},0`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};
/** the carrying pole: a dark-cased cream stave between two world points, sagging a little in the middle */
export const Pole: React.FC<{ a: P2; b: P2; sag?: number; scale: number }> = ({ a, b, sag = 10, scale }) => {
  const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag * scale];
  const d = `M${P(a)}Q${P(m)} ${P(b)}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={DARK} strokeWidth={15 * scale} />
      <path d={d} stroke={mixColor(INK, "#B9AD8D", 0.4)} strokeWidth={8 * scale} />
      <path d={d} stroke={INK} strokeWidth={2.4 * scale} strokeOpacity={0.8} transform={`translate(0 ${(-1.6 * scale).toFixed(2)})`} />
    </g>
  );
};
