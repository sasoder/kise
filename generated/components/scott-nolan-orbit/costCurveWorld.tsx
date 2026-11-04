// COST_CURVE_WORLD
// ===================================================================================================================
// costCurveWorld: the shared chart sculpture of scott-nolan-orbit (Cheeky Pint S4E04, Scott Nolan, "nuclear's real rival
// is solar in orbit"), used by cut A (BothComingDown) and cut B (BelieveTheSolarCurve). Built on nuclearWorld's stage and
// energyWorld's clay (scott-nolan-uranium / scott-nolan-wind): the espresso board is the floor, the two price curves are
// cream clay tubes standing in one upright plane above a thin baseline on the board, beaded at each data row, each casting
// one soft shadow on the board; a small clay SOLAR PANEL and a BATTERY ride beside the two tips. RENDER WITH --gl=angle.
//
// WORLD UNITS: X right, Y up (board = 0), Z away from the camera (three's z = -Z; energyCore's flipZ handles geometry).
// THE CHART PLANE: X = (year - 2010) x CHART.YEAR_U, Y = CHART.FLOOR + (log10(index) - LOG_MIN) x CHART.DEC_U, where index =
// price / that series' own 2010 price (both curves start at one point in 2010). LOG_MIN is solar's 2025 index (the lowest
// point of either series); LOG_MAX solar's 1975 index (cut B's top). No y numbers or gridlines anywhere: the scale is unlabelled.
//
// API (see COST_WORLD_READY.md in the clip's notes folder):
//   CHART, LOG_MIN, LOG_MAX, LINE_Z, chartX(year), chartY(index), pointAt(series, year) -> V3, rowsOf(series)
//   <CostLine series from to dim? amber? shadow?>        the tube from year `from` to year `to` (fractional = a moving tip)
//   curveShadowItems(series, from, to)                    its board shadow, for your own SoftShadows layer
//   <SolarMark at dim? glint? shadow?> <BatteryMark at dim? shadow?>, MARK, marksAt(solarTip, batteryTip), markAt, markShadowItems
//   <Baseline from to dim?>                               the thin axis rail on the board
//   <YearLabel year t? dim? cap?>, YEAR_LABEL             a year standing on the board in front of the rail (PlantLabels grammar)
//   <ChartCard ... />                                     the upright card of the probe's second option (not used by A)
//   <CostChart S solar battery marks? baseline years dim amber variant?>   all of the above in one call
// ===================================================================================================================
import React, { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { continueRender, delayRender } from "remotion";
import { COLOR, FONT_LABEL, METRIC, TRACK, mixHex } from "../kits/cheeky-pint/stoutShared";
import { SHADOW_LEN, SoftShadows, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { COMMON_GLSL, EW_COLOR, THREE, c01, energyClay, flipZ, merge, paint, rbox, sharedUniforms, vec3Of, type Any, type V3 } from "../scott-nolan-wind/energyWorld";
import { INDEXED, SPAN, type Series } from "./costData";

export type { Series } from "./costData";

// ===================================================================================================================
// THE CHART'S SCALE (cut B continues A pixel for pixel: never change these once A is final)
// ===================================================================================================================
export const CHART = {
  /** world units per year along X; 2010 is X = 0 (rev 1: 34, the axis shrunk so the objects could grow) */
  YEAR_U: 34,
  /** world units per decade (factor 10) of price, up Y */
  DEC_U: 360,
  /** height of the lowest point of either curve above the board (room for the panel under solar's 2025 end) */
  FLOOR: 195,
  X0_YEAR: 2010,
  /** tube and bead radii */
  TUBE_R: 10,
  BEAD_R: 12.5,
} as const;
const log10 = (v: number) => Math.log(v) / Math.LN10;
const allIdx = [...INDEXED.solar, ...INDEXED.battery].map((r) => r[1]);
/** log10 of the lowest index on the chart (solar 2025) */
export const LOG_MIN = log10(Math.min(...allIdx));
/** log10 of the highest index on the chart (solar 1975, about 53x its 2010 price) */
export const LOG_MAX = log10(Math.max(...allIdx));
/** the two tubes sit a little apart in depth so they never cut into each other where they cross; solar in front */
export const LINE_Z: Record<Series, number> = { solar: -28, battery: 28 };
/**
 * THE TONE LADDER (rev 1), one number per curve and its object: 0 = cream (the lit subject), 1 = board (COLOR.board ->
 * boardFoot), 2 = dark (the ground mixed toward the board: receded). A curve's `tone` sets where it sits; `dim` steps it
 * further down from there (tone + dim, clamped to 0..2). Cut A: solar 0, batteries 1.
 */
export const TONE = { cream: 0, board: 1, dark: 2 } as const;
export const DARK_TONE = mixHex(COLOR.ground, COLOR.board, 0.4);
export const DEFAULT_TONE: Record<Series, number> = { solar: TONE.cream, battery: TONE.board };
const LADDER_GLSL = /* glsl */ `
uniform vec3 uBoardFoot;
uniform vec3 uDark;
// up: 0 foot .. 1 top (from the normal), lv: 0 cream, 1 board, 2 dark
vec3 ladder(float lv, float up) {
  // rev 2: the cream rung brightened (less foot, over the card cream) so solar and the board-tone battery read as two materials
  vec3 cream = min(mix(uCreamFoot, uCream, 0.45 + 0.55 * up) * 1.12, vec3(1.0));
  // rev 2: exactly COLOR.board -> boardFoot (no lift), weighted toward the board end so it clears ~3:1 on the lit ground
  vec3 board = mix(uBoardFoot, uBoardTone, 0.4 + 0.6 * up);
  return lv < 1.0 ? mix(cream, board, lv) : mix(board, uDark, clamp(lv - 1.0, 0.0, 1.0));
}
`;
const ladderUniforms = () => ({ uBoardFoot: { value: vec3Of(COLOR.boardFoot) }, uDark: { value: vec3Of(DARK_TONE) } });
export const chartX = (year: number) => (year - CHART.X0_YEAR) * CHART.YEAR_U;
export const chartY = (index: number) => CHART.FLOOR + (log10(index) - LOG_MIN) * CHART.DEC_U;
/** the series' data rows as world points [X, Y, Z] with their year */
export const rowsOf = (s: Series): { year: number; p: V3 }[] => INDEXED[s].map(([y, v]) => ({ year: y, p: [chartX(y), chartY(v), LINE_Z[s]] as V3 }));
const ROWS: Record<Series, { year: number; p: V3 }[]> = { solar: rowsOf("solar"), battery: rowsOf("battery") };
/** a point on the series' polyline at a fractional year (straight segments between data rows; clamped to the data) */
export const pointAt = (s: Series, year: number): V3 => {
  const r = ROWS[s];
  const y = Math.max(r[0].year, Math.min(r[r.length - 1].year, year));
  let i = 0;
  while (i < r.length - 2 && r[i + 1].year <= y) i++;
  const a = r[i];
  const b = r[i + 1];
  const t = c01((y - a.year) / (b.year - a.year));
  return [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t, a.p[2]];
};
/** the drawn polyline between two fractional years: the end points plus every data row strictly between them */
const polyline = (s: Series, from: number, to: number): V3[] => {
  const out: V3[] = [pointAt(s, from)];
  for (const r of ROWS[s]) if (r.year > from + 1e-6 && r.year < to - 1e-6) out.push(r.p);
  out.push(pointAt(s, to));
  return out;
};
/**
 * rev 1: the chart's own shadow light. The stage key (SHADOW_DIR, mostly sideways) piled the floating curves' shadows into
 * one smear by the rail end at the 3/4 view, so the chart's shadows fall mostly AWAY from the camera and a little left (as if
 * the key were round in front): each curve lays a squashed copy of itself on the board between it and the rail.
 * `dir` is the board direction (X right, Z away), `len` the throw per unit of height. Used by every shadow in this world.
 */
export const CHART_SHADOW = (() => {
  const x = -0.25;
  const z = 1;
  const l = Math.hypot(x, z);
  return { dir: [x / l, z / l] as [number, number], len: 0.32 };
})();
/** a floating point's shadow on the board: offset along CHART_SHADOW by its height */
const dropOf = (p: V3): [number, number] => [p[0] + CHART_SHADOW.dir[0] * p[1] * CHART_SHADOW.len, p[2] + CHART_SHADOW.dir[1] * p[1] * CHART_SHADOW.len];

// ===================================================================================================================
// THE CURVE: cream clay tube + beads (own shader on the world's light: clay, dim toward the board, an amber wave for B)
// ===================================================================================================================
const LINE_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LINE_FRAG = /* glsl */ `
${COMMON_GLSL}
${LADDER_GLSL}
uniform float uLevel;
uniform float uAmberX;
uniform float uAmberSoft;
varying vec3 vW;
varying vec3 vN;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  vec3 base = ladder(uLevel, 0.5 + 0.5 * n.y);
  vec3 col = clayShade(base, n, V);
  // amber (cut B): everything left of the wave front, a soft front; band gradient by the key, a hot top edge
  float a = 1.0 - smoothstep(uAmberX - uAmberSoft, uAmberX, vW.x);
  float lit = smoothstep(-0.5, 0.9, dot(n, uL));
  vec3 amb = mix(uAmberFoot, uAmberTop, lit);
  amb = mix(amb, uAmberHot, 0.55 * pow(max(n.y, 0.0), 5.0));
  col = mix(col, amb, a);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
const lineMaterial = () =>
  new THREE.ShaderMaterial({
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    side: THREE.FrontSide,
    uniforms: { ...sharedUniforms(), ...ladderUniforms(), uLevel: { value: 0 }, uAmberX: { value: -1e6 }, uAmberSoft: { value: 30 } },
  });
let unitTube: Any = null;
let unitBead: Any = null;
const tubeGeo = () => {
  if (!unitTube) {
    unitTube = new THREE.CylinderGeometry(1, 1, 1, 28, 1, true);
    unitTube.translate(0, 0.5, 0);
  }
  return unitTube;
};
const beadGeo = () => {
  if (!unitBead) unitBead = new THREE.SphereGeometry(1, 32, 20);
  return unitBead;
};
const Y_AXIS = new THREE.Vector3(0, 1, 0);

export type CostLineProps = {
  series: Series;
  /** the drawn span in fractional years (clamped to the series' data); a fractional end is a moving tip with its own bead */
  from: number;
  to: number;
  /** steps the curve down the tone ladder from its `tone` (0..1; cream -> board, board -> dark): cut B's battery */
  dim?: number;
  /** rev 1: the curve's tone on the ladder (0 cream, 1 board; see TONE). Default 0 (cream) */
  tone?: number;
  /** rev 1: a thin post from each data bead down to the board (default false) */
  posts?: boolean;
  /** the amber wave's front, as a YEAR: the tube is amber left of it (cut B's solar: run it 1975 -> past 2025). Default none. */
  amber?: number;
  /** draw its board shadow here (default true); false if you gather curveShadowItems into your own layer */
  shadow?: boolean;
};
/** one price curve as a clay tube, beaded at each data row, drawn between two fractional years */
export const CostLine: React.FC<CostLineProps> = ({ series, from, to, dim = 0, tone = 0, posts = false, amber, shadow = true }) => {
  const [y0, y1] = SPAN[series];
  const a = Math.max(y0, Math.min(from, to));
  const b = Math.min(y1, Math.max(from, to));
  const o = useMemo(() => {
    const mat = lineMaterial();
    const n = ROWS[series].length;
    const group = new THREE.Group();
    const tubes: Any[] = [];
    const beads: Any[] = [];
    for (let i = 0; i < n; i++) {
      const t = new THREE.Mesh(tubeGeo(), mat);
      t.frustumCulled = false;
      t.renderOrder = 1;
      tubes.push(t);
      group.add(t);
    }
    for (let i = 0; i < n + 2; i++) {
      const s = new THREE.Mesh(beadGeo(), mat);
      s.frustumCulled = false;
      s.renderOrder = 1;
      beads.push(s);
      group.add(s);
    }
    const stems: Any[] = [];
    for (let i = 0; i < n; i++) {
      const t = new THREE.Mesh(tubeGeo(), mat);
      t.frustumCulled = false;
      t.renderOrder = 1;
      stems.push(t);
      group.add(t);
    }
    return { mat, group, tubes, beads, stems };
  }, [series]);
  const pts = b - a > 1e-4 ? polyline(series, a, b) : [];
  // segments
  for (let i = 0; i < o.tubes.length; i++) {
    const t = o.tubes[i];
    if (i >= pts.length - 1) {
      t.visible = false;
      continue;
    }
    const p = pts[i];
    const q = pts[i + 1];
    const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], -(q[2] - p[2]));
    const len = d.length();
    t.visible = len > 0.01;
    if (!t.visible) continue;
    t.position.set(p[0], p[1], -p[2]);
    t.quaternion.setFromUnitVectors(Y_AXIS, d.normalize());
    t.scale.set(CHART.TUBE_R, len, CHART.TUBE_R);
  }
  // beads: on every data row in [a, b] and on both ends (an end on a data row is that row's bead)
  const beadAt: V3[] = [];
  for (const r of ROWS[series]) if (r.year >= a - 1e-6 && r.year <= b + 1e-6) beadAt.push(r.p);
  if (pts.length) {
    if (Math.abs(a - Math.round(a)) > 1e-6) beadAt.push(pts[0]);
    if (Math.abs(b - Math.round(b)) > 1e-6) beadAt.push(pts[pts.length - 1]);
  }
  for (let i = 0; i < o.beads.length; i++) {
    const s = o.beads[i];
    const p = beadAt[i];
    s.visible = !!p && pts.length > 0;
    if (!s.visible) continue;
    s.position.set(p[0], p[1], -p[2]);
    s.scale.setScalar(CHART.BEAD_R);
  }
  // posts (opt-in): from each data bead straight down to the board
  const stemAt = posts ? ROWS[series].filter((r) => r.year >= a - 1e-6 && r.year <= b + 1e-6).map((r) => r.p) : [];
  for (let i = 0; i < o.stems.length; i++) {
    const t = o.stems[i];
    const p = stemAt[i];
    t.visible = !!p;
    if (!p) continue;
    t.position.set(p[0], 0, -p[2]);
    t.quaternion.identity();
    t.scale.set(POST_R, p[1], POST_R);
  }
  o.mat.uniforms.uLevel.value = Math.max(0, Math.min(2, tone + c01(dim)));
  o.mat.uniforms.uAmberX.value = amber === undefined ? -1e6 : chartX(amber);
  return (
    <>
      {shadow && pts.length ? <SoftShadows items={[...curveShadowItems(series, a, b, dim), ...(posts ? postShadowItems(stemAt) : [])]} /> : null}
      <primitive object={o.group} />
    </>
  );
};
/**
 * The curve's soft shadow on the board: the polyline dropped along the key by each point's height, as a chain of soft
 * dots (one MAX-blended layer: a band with no doubling). Higher parts throw a softer, fainter shadow.
 */
export const curveShadowItems = (series: Series, from: number, to: number, dim = 0): ShadowItem[] => {
  const pts = polyline(series, from, to);
  const out: ShadowItem[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    const A = dropOf(p);
    const B = dropOf(q);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const n = Math.max(1, Math.ceil(L / 8));
    for (let j = 0; j <= n; j++) {
      const t = j / n;
      const h = p[1] + (q[1] - p[1]) * t;
      // rev 2: a diffuse contact darkening on the board, not a crisp copy of the line (it read as a third line): short,
      // wide and very soft, fading with height
      const r = CHART.TUBE_R * 2.2 + h * 0.05;
      out.push({ x: A[0] + (B[0] - A[0]) * t, z: A[1] + (B[1] - A[1]) * t, len: 0.01, r, soft: 26 + h * 0.12, alpha: 0.5 * (1 - 0.55 * c01(h / 900)) * (1 - 0.35 * dim) });
    }
  }
  return out;
};
/** the posts' thin vertical shadows (opt-in posts) */
export const POST_R = 2.6;
const postShadowItems = (feet: V3[]): ShadowItem[] => feet.map((p) => ({ x: p[0], z: p[2], len: p[1] * CHART_SHADOW.len, r: POST_R * 1.3, soft: 2.5, alpha: 0.7, dirX: CHART_SHADOW.dir[0], dirZ: CHART_SHADOW.dir[1] }));

// ===================================================================================================================
// THE TWO OBJECTS: a solar panel and a battery cell in the clip's clay, riding beside their curves' tips
// ===================================================================================================================
/**
 * Sizes (world units) and where each rides relative to its tip: the battery above-ahead of the battery tip, the panel
 * below-ahead of the solar tip. The tips cross (solar runs above batteries 2016-2023), so the pair is also held at least
 * GAP apart vertically, pushed apart symmetrically and smoothly (their order never swaps: battery above, panel below,
 * as at both ends of the chart). Both stand a little in front of the tubes' plane (Z) so a tube never cuts into them.
 */
export const MARK = {
  /** rev 1: a real ground-mount panel: slab W x D tilted TILT deg from flat toward the camera, on four legs on a slim base */
  PANEL: { W: 108, D: 64, T: 4.5, TILT: 32, LEG: 9, BASE_H: 4.5 },
  CELL: { R: 25, L: 102, NUB_R: 9.5, NUB_L: 8, BAND: 0.5 },
  /** rev 2: each object sits ON its own tip, its left edge touching the tip's bead, centred on the tip's height, in its
   * own line's depth lane (LINE_Z). dx = tip -> object centre along X. */
  solar: { dx: 12.5 * 0.4 + 108 / 2 + 2, dy: 0 },
  battery: { dx: 12.5 * 0.4 + 102 / 2, dy: 0 },
  /** the least centre-to-centre height between the two objects (their half-heights plus a hair); they are pushed apart only
   * while closer than this (the tips cross 2016-2023), and sit exactly on their tips otherwise (as at 2025) */
  GAP: 56,
  /** rev 2: unused (objects ride in their lines' lanes, LINE_Z); kept for the export */
  Z: -50,
  /** the objects follow a smoothed tip: the mean of the tip's height over this many years behind it (weight, no jitter) */
  LAG: 0.15,
} as const;
const smoothTip = (series: Series, tip: number): [number, number] => {
  const [y0] = SPAN[series];
  const n = 8;
  let y = 0;
  for (let i = 0; i < n; i++) y += pointAt(series, Math.max(y0, tip - (MARK.LAG * i) / (n - 1)))[1] / n;
  return [pointAt(series, tip)[0], y];
};
/**
 * where the two objects are centred when the solar tip is at year `solarTip` and the battery tip at `batteryTip`.
 * `scale` (opt-in, default 1: unchanged) = the objects' size factor (CostChart `markScale`): their reach from the tip and
 * the GAP grow with them, so a bigger object still sits on its tip.
 */
export const marksAt = (solarTip: number, batteryTip: number, scale = 1): Record<Series, V3> => {
  const s = smoothTip("solar", solarTip);
  const b = smoothTip("battery", batteryTip);
  let ys = s[1] + MARK.solar.dy;
  let yb = b[1] + MARK.battery.dy;
  // push apart only inside GAP: zero when clear by e or more, C1 smooth through the knee (battery stays above, panel below)
  const d = MARK.GAP * scale - (yb - ys);
  const e = 12 * scale;
  const push = d <= -e ? 0 : d >= e ? d : ((d + e) * (d + e)) / (4 * e);
  yb += push / 2;
  ys -= push / 2;
  const reach = (dx: number) => (scale === 1 ? dx : CHART.BEAD_R * 0.4 + (dx - CHART.BEAD_R * 0.4) * scale);
  return { solar: [s[0] + reach(MARK.solar.dx), ys, LINE_Z.solar], battery: [b[0] + reach(MARK.battery.dx), yb, LINE_Z.battery] };
};
/** one object's place, both tips at the same year (cut A); see marksAt for different tips */
export const markAt = (series: Series, tip: number): V3 => marksAt(tip, tip)[series];
// the objects' clay: per-vertex colour; the light parts follow the tone ladder (cream / board / dark), dark parts darken a step
const MARK_VERT = /* glsl */ `
attribute vec3 aCol;
varying vec3 vW; varying vec3 vN; varying vec3 vC;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = aCol;
  gl_Position = projectionMatrix * viewMatrix * wp; }`;
const MARK_FRAG = /* glsl */ `
${COMMON_GLSL}
${LADDER_GLSL}
uniform float uLevel;
varying vec3 vW; varying vec3 vN; varying vec3 vC;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  float light = step(0.55, dot(vC, vec3(0.333)));
  vec3 lit = mix(vC, ladder(uLevel, 0.5 + 0.5 * n.y), step(0.001, uLevel));
  vec3 dark = mix(vC * mix(1.0, 0.86, min(uLevel, 1.0)), uDark * 0.8, 0.5 * clamp(uLevel - 1.0, 0.0, 1.0));
  vec3 col = clayShade(mix(dark, lit, light), n, V);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
const markClay = () =>
  new THREE.ShaderMaterial({ vertexShader: MARK_VERT, fragmentShader: MARK_FRAG, side: THREE.DoubleSide, uniforms: { ...sharedUniforms(), ...ladderUniforms(), uLevel: { value: 0 } } });
// the panel's cells: modules and cell lines on a dark brown face (energyPlants' look), one slow glint
const CELL_VERT = /* glsl */ `
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vU = uv;
  gl_Position = projectionMatrix * viewMatrix * wp; }`;
const CELL_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform vec3 uCell; uniform vec3 uFrame; uniform vec3 uGlintC; uniform float uGlint; uniform float uDim;
varying vec3 vW; varying vec3 vN; varying vec2 vU;
float lineAt(float v, float n, float w) { float f = abs(fract(v * n + 0.5) - 0.5) / n; return 1.0 - smoothstep(w * 0.5, w * 0.5 + fwidth(v) * 1.2, f); }
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 cell = uCell * mix(0.86, 1.0, smoothstep(-0.2, 0.9, dot(n, uL)));
  // modules: 4 along the panel, 2 up its slope; cells 4 x 3 per module (energyPlants' grammar)
  float mod1 = max(lineAt(vU.x, 4.0, 0.012), lineAt(vU.y, 2.0, 0.03));
  float cellL = max(lineAt(vU.x, 16.0, 0.004), lineAt(vU.y, 6.0, 0.01));
  vec3 col = mix(cell, mix(cell, uFrame, 0.26), cellL);
  col = mix(col, uFrame * 0.94, mod1);
  col += vec3(0.05, 0.04, 0.03) * pow(1.0 - abs(dot(n, V)), 2.0);
  float x = vU.x + 0.45 * vU.y;
  float g = exp(-pow((x - uGlint) / 0.14, 2.0));
  col = mix(col, uGlintC, 0.5 * g * (1.0 - mod1 * 0.5));
  col = mix(col, uBoardTone * 0.62, uDim * 0.5);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
const D2R = Math.PI / 180;
let panelGeos: { frame: Any; cells: Any; h: number } | null = null;
/**
 * The panel (rev 1), centred on the origin: a slim base, two short front legs and two taller back legs, and the cream-framed
 * slab tilted TILT deg from flat, its low edge toward the camera (-Z), so the dark cell face looks up at the camera and the sun.
 */
const panelParts = () => {
  if (panelGeos) return panelGeos;
  const P = MARK.PANEL;
  const t = P.TILT * D2R;
  const dz = (P.D / 2) * Math.cos(t);
  const dy = (P.D / 2) * Math.sin(t);
  const yc = P.BASE_H + P.LEG + dy;
  const h = yc + dy + P.T;
  const base = rbox(P.W + 10, P.BASE_H, dz * 2 + 18, 0, 0, 0, 2.2, EW_COLOR.creamFoot, 2);
  const legs: Any[] = [];
  for (const lx of [-P.W / 2 + 14, P.W / 2 - 14]) {
    legs.push(rbox(5, P.LEG + 3, 5, lx, P.BASE_H - 1, -dz + 7, 2, EW_COLOR.creamFoot, 2));
    legs.push(rbox(5, P.LEG + dy * 2 - 4, 5, lx, P.BASE_H - 1, dz - 9, 2, EW_COLOR.creamFoot, 2));
  }
  const slab = rbox(P.W, P.T, P.D, 0, -P.T / 2, 0, 2, EW_COLOR.cream, 2);
  slab.rotateX(-t);
  slab.translate(0, yc, 0);
  const cells = new THREE.PlaneGeometry(P.W - 7, P.D - 7);
  cells.rotateX(-Math.PI / 2);
  cells.translate(0, P.T / 2 + 0.35, 0);
  cells.rotateX(-t);
  cells.translate(0, yc, 0);
  paint(cells, EW_COLOR.cell);
  const all = [base, ...legs, slab];
  const fr = merge(all);
  fr.translate(0, -h / 2, 0);
  cells.translate(0, -h / 2, 0);
  panelGeos = { frame: flipZ(fr), cells: flipZ(cells), h };
  return panelGeos;
};
let cellGeo: Any = null;
/** the battery: an AA-style cell lying along X, + end (the nub) to the right, the travel direction; a dark sleeve on the - half */
const batteryGeo = () => {
  if (cellGeo) return cellGeo;
  const C = MARK.CELL;
  const r = C.R;
  const L = C.L;
  const e = 4.5;
  const arc = (y0: number, up: boolean): [number, number][] => {
    const out: [number, number][] = [];
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2);
      out.push(up ? [r - e + e * Math.cos(a), y0 - e + e * Math.sin(a)] : [r - e + e * Math.cos(a), y0 + e - e * Math.sin(a)]);
    }
    return out;
  };
  // lathe axis = Y, from -L/2 (the - end) to +L/2 (the + end), turned onto X below
  const split = -L / 2 + L * C.BAND;
  const minusPts: [number, number][] = [[0.0001, -L / 2]];
  for (const p of arc(-L / 2, false).reverse()) minusPts.push(p);
  minusPts.push([r, split]);
  const plusPts: [number, number][] = [[r, split]];
  for (const p of arc(L / 2, true)) plusPts.push(p);
  plusPts.push([C.NUB_R + 3, L / 2]);
  plusPts.push([C.NUB_R, L / 2 + 0.4]);
  // the nub: a short boss with a rounded top
  plusPts.push([C.NUB_R, L / 2 + C.NUB_L - 2.5]);
  plusPts.push([C.NUB_R - 2.5, L / 2 + C.NUB_L]);
  plusPts.push([0.0001, L / 2 + C.NUB_L]);
  const lathe = (pts: [number, number][], hex: string) => paint(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(0.0001, p[0]), p[1])), 56), hex);
  const sleeve = lathe(minusPts, EW_COLOR.cell);
  const body = lathe(plusPts, EW_COLOR.cream);
  // a + in ink on the light half, raised a hair, facing the camera
  const px = split + (L / 2 - split) * 0.5;
  const pl = [new THREE.BoxGeometry(17, 4.6, 3), new THREE.BoxGeometry(4.6, 17, 3)].map((g) => {
    g.rotateZ(Math.PI / 2);
    g.translate(0, px, -r - 0.2);
    return paint(g, EW_COLOR.well);
  });
  const g = merge([sleeve, body, ...pl]);
  // axis Y -> X: + end to the right
  g.rotateZ(-Math.PI / 2);
  cellGeo = flipZ(g);
  return cellGeo;
};

const markMesh = (geo: Any, mat: Any) => {
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  m.renderOrder = 2;
  return m;
};
/** the board shadow of an object floating at `at` (as strong as the curves' own) */
export const markShadowItems = (kind: Series, at: V3, alpha = 0.95, scale = 1): ShadowItem[] => {
  const [x, z] = dropOf(at);
  const w = (kind === "battery" ? MARK.CELL.L * 0.46 : MARK.PANEL.W * 0.4) * scale;
  const r = (kind === "battery" ? MARK.CELL.R * 0.95 : MARK.PANEL.D * 0.42) * scale;
  const out: ShadowItem[] = [];
  for (let i = 0; i < 11; i++) out.push({ x: x - w + (i * 2 * w) / 10, z, len: 0.01, r: r * 1.3, soft: 26 + at[1] * 0.1, alpha: 0.6 * alpha * (1 - 0.45 * c01(at[1] / 900)) });
  return out;
};
export type MarkProps = {
  at: V3;
  /** steps the object down the tone ladder from its `tone` (as CostLine) */
  dim?: number;
  shadow?: boolean;
  glint?: number;
  /** rev 1: the object's tone on the ladder (0 cream, 1 board), matching its curve. Default 0 */
  tone?: number;
  /** opt-in size factor (default 1); place it with marksAt(..., scale) */
  scale?: number;
};
/** the solar panel, centred at `at` (world) */
export const SolarMark: React.FC<MarkProps> = ({ at, dim = 0, tone = 0, shadow = true, glint = -0.5, scale = 1 }) => {
  const o = useMemo(() => {
    const p = panelParts();
    const mat = markClay();
    const cellMat = new THREE.ShaderMaterial({
      vertexShader: CELL_VERT,
      fragmentShader: CELL_FRAG,
      extensions: { derivatives: true },
      side: THREE.DoubleSide,
      uniforms: {
        ...sharedUniforms(),
        uCell: { value: vec3Of(EW_COLOR.cell) },
        uFrame: { value: vec3Of(EW_COLOR.cream) },
        uGlintC: { value: vec3Of("#E8D9BF") },
        uGlint: { value: 0 },
        uDim: { value: 0 },
      },
    });
    const g = new THREE.Group();
    g.add(markMesh(p.frame, mat));
    g.add(markMesh(p.cells, cellMat));
    return { g, mat, cellMat };
  }, []);
  o.g.position.set(at[0], at[1], -at[2]);
  o.g.scale.setScalar(scale);
  const lv = Math.max(0, Math.min(2, tone + c01(dim)));
  o.mat.uniforms.uLevel.value = lv;
  o.cellMat.uniforms.uDim.value = c01(lv - tone);
  o.cellMat.uniforms.uGlint.value = glint;
  return (
    <>
      {shadow ? <SoftShadows items={markShadowItems("solar", at, 0.95, scale)} /> : null}
      <primitive object={o.g} />
    </>
  );
};
/** the battery cell, centred at `at` (world), + end to the right */
export const BatteryMark: React.FC<MarkProps> = ({ at, dim = 0, tone = 0, shadow = true, scale = 1 }) => {
  const o = useMemo(() => {
    const mat = markClay();
    const m = markMesh(batteryGeo(), mat);
    return { m, mat };
  }, []);
  o.m.position.set(at[0], at[1], -at[2]);
  o.m.scale.setScalar(scale);
  o.mat.uniforms.uLevel.value = Math.max(0, Math.min(2, tone + c01(dim)));
  return (
    <>
      {shadow ? <SoftShadows items={markShadowItems("battery", at, 0.95, scale)} /> : null}
      <primitive object={o.m} />
    </>
  );
};

// ===================================================================================================================
// THE AXIS: a thin cream rail lying on the board under the curves, and the years standing in front of it
// ===================================================================================================================
export const RAIL = { R: 3.6, Z: 0, PAD: 26 } as const;
let railGeos: { rod: Any; cap: Any } | null = null;
/** the baseline rail from year `from` to year `to` (a little past each end): a thin round rod lying on the board */
export const Baseline: React.FC<{ from: number; to: number; dim?: number }> = ({ from, to, dim = 0 }) => {
  const o = useMemo(() => {
    if (!railGeos) {
      const rod = paint(new THREE.CylinderGeometry(RAIL.R, RAIL.R, 1, 20, 1, true), EW_COLOR.cream);
      rod.rotateZ(-Math.PI / 2);
      rod.translate(0.5, 0, 0);
      railGeos = { rod, cap: paint(new THREE.SphereGeometry(RAIL.R, 20, 12), EW_COLOR.cream) };
    }
    const mat = energyClay();
    const mk = (g: Any) => {
      const m = new THREE.Mesh(g, mat);
      m.frustumCulled = false;
      m.renderOrder = 1;
      return m;
    };
    return { rod: mk(railGeos.rod), c0: mk(railGeos.cap), c1: mk(railGeos.cap), mat };
  }, []);
  const x0 = chartX(from) - RAIL.PAD;
  const x1 = chartX(to) + RAIL.PAD;
  o.rod.scale.set(Math.max(0.01, x1 - x0), 1, 1);
  o.rod.position.set(x0, RAIL.R, -RAIL.Z);
  o.c0.position.set(x0, RAIL.R, -RAIL.Z);
  o.c1.position.set(x1, RAIL.R, -RAIL.Z);
  o.mat.uniforms.uDim.value = c01(dim);
  return (
    <>
      <SoftShadows items={railShadow(x0, x1)} />
      <primitive object={o.rod} />
      <primitive object={o.c0} />
      <primitive object={o.c1} />
    </>
  );
};
const railShadow = (x0: number, x1: number): ShadowItem[] => {
  const out: ShadowItem[] = [];
  const n = Math.max(2, Math.ceil((x1 - x0) / 10));
  for (let i = 0; i <= n; i++) out.push({ x: x0 + ((x1 - x0) * i) / n, z: RAIL.Z + 1, len: RAIL.R * 2 * CHART_SHADOW.len * 1.5, r: RAIL.R * 1.1, soft: 2.5, alpha: 0.6, dirX: CHART_SHADOW.dir[0], dirZ: CHART_SHADOW.dir[1] });
  return out;
};

/** the year labels: Söhne Kräftig, inkCream, standing on the board in front of the rail, leaning back toward the camera */
export const YEAR_LABEL = { CAP: 36, GAP: 88, LEAN: 30 } as const;
export const yearFootOf = (year: number, gap: number = YEAR_LABEL.GAP): V3 => [chartX(year), 0.6, RAIL.Z - RAIL.R - gap];
const PX = 220;
const PAD = 28;
const FONT_CSS = `500 ${PX}px ${FONT_LABEL}`;
type Glyphs = { tex: Any; w: number; h: number; base: number };
const wordCache = new Map<string, Glyphs>();
const drawWord = (text: string): Glyphs => {
  const have = wordCache.get(text);
  if (have) return have;
  const c = document.createElement("canvas");
  const probe = c.getContext("2d") as CanvasRenderingContext2D;
  probe.font = FONT_CSS;
  const track = TRACK.label * PX;
  const adv = [...text].map((ch) => probe.measureText(ch).width);
  const width = adv.reduce((a, b) => a + b, 0) + track * (text.length - 1);
  const cap = METRIC.cap * PX;
  c.width = Math.ceil(width + PAD * 2);
  c.height = Math.ceil(cap + PAD * 2);
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.font = FONT_CSS;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  let x = PAD;
  const base = PAD + cap;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, base);
    x += adv[i] + track;
  });
  const tex = new THREE.CanvasTexture(c);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  const g = { tex, w: c.width, h: c.height, base };
  wordCache.set(text, g);
  return g;
};
const LB_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
varying vec2 vUv;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LB_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D uMap;
uniform vec3 uInk;
uniform float uDim;
uniform float uAlpha;
varying vec3 vW;
varying vec3 vN;
varying vec2 vUv;
void main() {
  float a = texture2D(uMap, vUv).a * uAlpha;
  if (a < 0.004) discard;
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  vec3 base = mix(uInk, uBoardTone, uDim);
  vec3 col = clayShade(base, n, V);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), a);
}`;
// ThreeCanvas renders with frameloop "never": once the font is in and the words drawn, draw the frame again before release
const useFontReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("costCurveWorld: label font"));
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    if (!ready) return;
    advance(performance.now());
    requestAnimationFrame(() => continueRender(handle));
  }, [ready, advance, handle]);
  useEffect(() => {
    let live = true;
    document.fonts
      .load(FONT_CSS, "0123456789COST")
      .then(() => {
        if (live) setReady(true);
      })
      .catch(() => continueRender(handle));
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
};
const WordMesh: React.FC<{ text: string; foot: V3; cap: number; lean: number; t: number; dim: number; ink?: string }> = ({ text, foot, cap, lean, t, dim, ink = COLOR.inkCream }) => {
  const o = useMemo(() => {
    const g = drawWord(text);
    const k = 1 / (METRIC.cap * PX);
    const w = g.w * k;
    const h = g.h * k;
    const geo = new THREE.PlaneGeometry(w, h);
    // the plane's own frame: baseline at local y 0, centred in x, cap height 1
    geo.translate(0, h / 2 - (g.h - g.base) * k, 0);
    const mat = new THREE.ShaderMaterial({
      vertexShader: LB_VERT,
      fragmentShader: LB_FRAG,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: { ...sharedUniforms(), uMap: { value: g.tex }, uInk: { value: vec3Of(ink) }, uDim: { value: 0 }, uAlpha: { value: 1 } },
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 5;
    return { m, mat };
  }, [text, ink]);
  const e = 1 - (1 - c01(t)) * (1 - c01(t));
  // the stout entrance: slide up (out of the board) while fading in
  const rise = (1 - e) * cap * 1.1;
  o.m.scale.setScalar(cap);
  o.m.rotation.set((-lean * Math.PI) / 180, 0, 0);
  o.m.position.set(foot[0], foot[1] - rise * Math.cos((lean * Math.PI) / 180), -(foot[2] - rise * Math.sin((lean * Math.PI) / 180)));
  o.mat.uniforms.uAlpha.value = e;
  o.mat.uniforms.uDim.value = c01(dim);
  o.m.visible = e > 0.001;
  return <primitive object={o.m} />;
};
/** a year on the board under its point of the axis. t 0..1 = its entrance (slide up out of the board, fading in); default in. */
// cut B: `gap` (board between the rail and the label's foot, default YEAR_LABEL.GAP) grows with `cap` so a bigger word still clears the rail
export const YearLabel: React.FC<{ year: number; t?: number; dim?: number; cap?: number; gap?: number }> = ({ year, t = 1, dim = 0, cap = YEAR_LABEL.CAP, gap = YEAR_LABEL.GAP }) => {
  const ready = useFontReady();
  if (!ready) return null;
  return <WordMesh text={String(year)} foot={yearFootOf(year, gap)} cap={cap} lean={YEAR_LABEL.LEAN} t={t} dim={dim} />;
};

// ===================================================================================================================
// THE COST AXIS (rev 2): a thin upright rod in the rail's clay, rising from the rail's left end (an L with the baseline) to
// just above the curves' shared 2010 start, with the word COST standing at its top. No numbers, no ticks.
// ===================================================================================================================
/** OVER: rod top above the 2010 point; CAP/GAP: COST's cap height and its baseline above the rod top (world units) */
export const COST_AXIS = { OVER: 44, CAP: 26, GAP: 16 } as const;
/** the axis' X: the rail's left end at `year` */
export const axisXOf = (year: number) => chartX(year) - RAIL.PAD;
/** the rod's full height: just above the shared 2010 start (both series' index 1) */
export const AXIS_TOP = chartY(1) + COST_AXIS.OVER;
/** where COST's baseline sits (centred on the axis) */
export const costFootOf = (year: number, top: number = AXIS_TOP): V3 => [axisXOf(year), top + COST_AXIS.GAP, RAIL.Z];
export type CostAxisProps = {
  /** the year whose rail end the axis rises from (default 2010) */
  year?: number;
  /** 0..1: how much of the rod is drawn, up from the rail (default 1) */
  grow?: number;
  /** 0..1: COST's entrance (rises a little while fading in; default 1) */
  t?: number;
  /** rod height (world Y); default AXIS_TOP */
  top?: number;
  /** tone toward the board, as Baseline */
  dim?: number;
  /** cut B: COST's cap height (world units; default COST_AXIS.CAP), its gap above the rod scaled with it */
  cap?: number;
};
let axisGeos: { rod: Any; cap: Any } | null = null;
export const CostAxis: React.FC<CostAxisProps> = ({ year = 2010, grow = 1, t = 1, top = AXIS_TOP, dim = 0, cap = COST_AXIS.CAP }) => {
  const ready = useFontReady();
  const o = useMemo(() => {
    if (!axisGeos) {
      const rod = paint(new THREE.CylinderGeometry(RAIL.R, RAIL.R, 1, 20, 1, true), EW_COLOR.cream);
      rod.translate(0, 0.5, 0);
      axisGeos = { rod, cap: paint(new THREE.SphereGeometry(RAIL.R, 20, 12), EW_COLOR.cream) };
    }
    const mat = energyClay();
    const mk = (g: Any) => {
      const m = new THREE.Mesh(g, mat);
      m.frustumCulled = false;
      m.renderOrder = 1;
      return m;
    };
    return { rod: mk(axisGeos.rod), cap: mk(axisGeos.cap), mat };
  }, []);
  const g = c01(grow);
  const e = g * g * (3 - 2 * g);
  const x = axisXOf(year);
  const h = Math.max(0.01, e * top);
  o.rod.scale.set(1, h, 1);
  o.rod.position.set(x, RAIL.R, -RAIL.Z);
  o.cap.position.set(x, RAIL.R + h, -RAIL.Z);
  o.rod.visible = o.cap.visible = g > 0.001;
  o.mat.uniforms.uDim.value = c01(dim);
  // a soft, short contact shadow at the foot (the rod stands on the board)
  const sh: ShadowItem[] = g > 0.001 ? [{ x, z: RAIL.Z, len: Math.min(h, 200) * CHART_SHADOW.len, r: RAIL.R * 2.2, soft: 10, alpha: 0.45, dirX: CHART_SHADOW.dir[0], dirZ: CHART_SHADOW.dir[1] }] : [];
  return (
    <>
      <SoftShadows items={sh} />
      <primitive object={o.rod} />
      <primitive object={o.cap} />
      {ready ? <WordMesh text="COST" foot={costFootOf(year, top + COST_AXIS.GAP * (cap / COST_AXIS.CAP - 1))} cap={cap} lean={0} t={t} dim={dim} ink={COLOR.inkCreamLo} /> : null}
    </>
  );
};

// ===================================================================================================================
// OPTION B OF THE PROBE: an upright board-tone card behind the curves, the tubes raised on its face with contact shadows.
// Kept for the record (COST_WORLD_READY.md); cut A uses the free-standing sculpture.
// ===================================================================================================================
const MAXP = 56;
const CARD_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform vec3 uPts[${MAXP}];
uniform float uN;
uniform vec2 uOff;
uniform vec3 uShadowCol;
varying vec3 vW;
varying vec3 vN;
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0); return length(pa - ba * h); }
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  vec3 col = clayShade(uBoardTone, n, V);
  if (n.z > 0.7) {
    vec2 p = vW.xy - uOff;
    float d = 1e5;
    for (int i = 0; i < ${MAXP - 1}; i++) {
      if (float(i) < uN - 1.0 && uPts[i].z == uPts[i + 1].z) d = min(d, segD(p, uPts[i].xy, uPts[i + 1].xy));
    }
    float a = 1.0 - smoothstep(4.0, 16.0, d);
    col = mix(col, uShadowCol, 0.42 * a);
  }
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
export const CARD = { Z: 22, T: 10, PAD_X: 60, PAD_TOP: 120 } as const;
/** the upright card spanning years [from, to], tall enough for the highest drawn point; `lines` = the drawn spans per series */
export const ChartCard: React.FC<{ from: number; to: number; top: number; lines: { series: Series; from: number; to: number }[] }> = ({ from, to, top, lines }) => {
  const o = useMemo(() => {
    const geo = flipZ(rbox(1, 1, CARD.T, 0.5, 0, CARD.Z + CARD.T / 2, 0.02, EW_COLOR.board, 2));
    const arr = [];
    for (let i = 0; i < MAXP; i++) arr.push(new THREE.Vector3());
    const mat = new THREE.ShaderMaterial({
      vertexShader: LINE_VERT,
      fragmentShader: CARD_FRAG,
      uniforms: { ...sharedUniforms(), uPts: { value: arr }, uN: { value: 0 }, uOff: { value: new THREE.Vector2(9, -13) }, uShadowCol: { value: vec3Of(COLOR.shadow) } },
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 0;
    return { m, mat };
  }, []);
  const x0 = chartX(from) - CARD.PAD_X;
  const x1 = chartX(to) + CARD.PAD_X;
  o.m.scale.set(x1 - x0, top, 1);
  o.m.position.set(x0, 0, 0);
  let k = 0;
  lines.forEach((l, li) => {
    for (const p of polyline(l.series, l.from, l.to)) if (k < MAXP) o.mat.uniforms.uPts.value[k++].set(p[0], p[1], li);
  });
  o.mat.uniforms.uN.value = k;
  const items: ShadowItem[] = [];
  const n = Math.ceil((x1 - x0) / 20);
  for (let i = 0; i <= n; i++) items.push({ x: x0 + ((x1 - x0) * i) / n, z: CARD.Z + CARD.T / 2, len: Math.min(top, 160) * SHADOW_LEN, r: 10, soft: 8, alpha: 0.8 });
  return (
    <>
      <SoftShadows items={items} />
      <primitive object={o.m} />
    </>
  );
};

// ===================================================================================================================
// THE WHOLE CHART IN ONE CALL
// ===================================================================================================================
export type Span = { from: number; to: number };
export type CostChartProps = {
  /** story clock (frames): the panel's glint */
  S: number;
  solar: Span;
  battery: Span;
  /** the objects ride the tips (`to`) of their curves; false hides them */
  marks?: boolean;
  /** the baseline rail's span in years */
  baseline: Span;
  /** year -> entrance 0..1 of its label */
  years?: Record<number, number>;
  /** per-series tone toward the board (curve, object together) */
  dim?: Partial<Record<Series, number>>;
  /** per-series amber wave front, as a year (cut B's solar) */
  amber?: Partial<Record<Series, number>>;
  /** rev 1: per-series tone on the ladder (curve and object together); default DEFAULT_TONE (solar cream, batteries board) */
  tone?: Partial<Record<Series, number>>;
  /** rev 1: posts from the beads down to the board (default false) */
  posts?: boolean;
  /** year-label cap height (world units); default YEAR_LABEL.CAP */
  cap?: number;
  /** cut B: year-label gap from the rail (world units); default YEAR_LABEL.GAP */
  yearGap?: number;
  /** the probe's second option: an upright card behind the curves */
  variant?: "free" | "card";
  /** rev 2: the cost axis (upright rod + COST) at the rail's left end; omitted = none */
  axis?: CostAxisProps;
  /** opt-in (cut A rev 3, the user's reframe): the two objects' size factor, default 1; they still sit on their tips */
  markScale?: number;
};
/** the panel's glint, a pure function of the story clock: one slow pass every 150 frames */
export const glintAt = (S: number) => -0.6 + ((S % 150) / 150) * 2.4;
export const CostChart: React.FC<CostChartProps> = ({ S, solar, battery, marks = true, baseline, years = {}, dim = {}, amber = {}, tone = {}, posts = false, cap, yearGap, variant = "free", axis, markScale = 1 }) => {
  const ts = tone.solar ?? DEFAULT_TONE.solar;
  const tb = tone.battery ?? DEFAULT_TONE.battery;
  const at = marksAt(solar.to, battery.to, markScale);
  const sAt = at.solar;
  const bAt = at.battery;
  const top = Math.max(pointAt("solar", solar.from)[1], pointAt("battery", battery.from)[1]) + CARD.PAD_TOP;
  return (
    <>
      {variant === "card" ? (
        <ChartCard from={baseline.from} to={baseline.to} top={top} lines={[{ series: "battery", ...battery }, { series: "solar", ...solar }]} />
      ) : null}
      <Baseline from={baseline.from} to={baseline.to} />
      {axis ? <CostAxis {...axis} /> : null}
      <CostLine series="battery" from={battery.from} to={battery.to} dim={dim.battery} tone={tb} posts={posts} amber={amber.battery} />
      <CostLine series="solar" from={solar.from} to={solar.to} dim={dim.solar} tone={ts} posts={posts} amber={amber.solar} />
      {marks ? <BatteryMark at={bAt} dim={dim.battery} tone={tb} scale={markScale} /> : null}
      {marks ? <SolarMark at={sAt} dim={dim.solar} tone={ts} glint={glintAt(S)} scale={markScale} /> : null}
      {Object.entries(years).map(([y, t]) => (
        <YearLabel key={y} year={Number(y)} t={t} cap={cap} gap={yearGap} />
      ))}
    </>
  );
};
