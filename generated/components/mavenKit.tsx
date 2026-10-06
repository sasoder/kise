import React from "react";
import {
  Bead,
  DashedPath,
  FeatherWipe,
  HatchFill,
  INK,
  INK_HI,
  INK_LO,
  Label,
  PAPER,
  RED,
  RED_DEEP,
  RED_WET,
  WASH_FILL,
  WASH_HATCH,
  clamp01,
  cumLen,
  enterFrom,
  enterU,
  labelPx,
  labelWidth,
  mixHex,
  pointAtLen,
  polyD,
  shootEase,
  smoothstep,
  subPathD,
  sz,
  worldBlur,
} from "./chinatalkShared";
import type { Anchor, Pt } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// mavenKit -- THE kit of the Bharat "Project Maven's data problem" clip, V3
// (ChinaTalk style, 1080x1920, 24 fps). Every cut of the clip (DataFoundation,
// TonOfData, KeepCollecting, EnoughRelevantData) is built ONLY from this file,
// so the four cuts read as one family: one stroke weight, one hair weight, one
// label size, one grow ease. Nothing here is clip geometry.
//
// ACCENT (one meaning for the whole clip): VERMILION = RELEVANT DATA.
//   kind "red"      solid RED + warm paper shadow (+ RED_WET tip while growing)
//   kind "deep"     solid RED_DEEP, no shadow: relevant data missing / too little
//   kind "needed"   dashed RED outline, marching, no fill: the relevant data NEEDED
//   kind "ink"      INK wash 0.10 + hatch 0.35 + LINE_W ink outline at 0.90
//   kind "expected" dashed INK outline, marching, no fill: an ink thing that is
//                   expected but not there (not red: it is not relevant data)
//
// CONVENTIONS (as chinatalkShared): WORLD px, y grows down; `k` = camera zoom;
// `S` = the cut's local frame clock (never useCurrentFrame in here). Progress
// props (`draw`, `grow`) are ALREADY EASED 0..1 values: ease them with GROW_EASE
// / growAt in the cut. `rung` is an absolute ink opacity (INK_HI / INK_LO).
// ---------------------------------------------------------------------------

export * from "./chinatalkShared";

// --- fixed tokens (never override locally) ------------------------------------
/** every drawn line and outline: 9 screen px at k 1 */
export const LINE_W = 9;
/** baselines, level lines, ticks only: 3.5 screen px at k 1 */
export const HAIR_W = 3.5;
/** slab corner radius, world px */
export const SLAB_R = 22;
/** the standard bar width, world px (bars have fully round tops: PILL_R = w / 2) */
export const BAR_W = 170;
/** word labels: Source Sans 3 SemiBold caps, screen px at k 1. ONE size. */
export const WORD = 46;
/** numbers: Source Serif 4 Bold, screen px at k 1 */
export const NUM = 72;
/** a state change / settle, frames */
export const SETTLE_F = 14;
/** the ONE ease of everything that grows (launches, then decelerates into place; zero velocity at both ends) */
export const GROW_EASE = shootEase;
/** eased grow progress of something that grows over [s0, s0 + dur] */
export const growAt = (S: number, s0: number, dur: number) => GROW_EASE((S - s0) / dur);
/** dashed LINE_W outlines: dash + gap of chinatalkShared x 2 (a 9 px stroke needs the longer dash) */
export const KDASH = 32;
export const KDASH_GAP = 24;
/** dashes march, world px per frame at k 1 */
export const KMARCH = 1.1;
/** the red wet tip reaches this far behind a growing edge, world px */
export const WET_REACH = 90;

/** The size law, normalised to k 1: a world size s * kw(k) is s * k^0.75 px on screen. */
export const kw = (k: number) => sz(k) / sz(1);
/** world width of a LINE_W stroke at camera k (8.0 px on screen at k 0.86, 9 at 1, 10.6 at 1.25) */
export const lineW = (k: number) => LINE_W * kw(k);
/** world width of a HAIR_W stroke at camera k */
export const hairW = (k: number) => HAIR_W * kw(k);
/** SCREEN font size of the two label classes at camera k (k^0.75 law, 90 % floor in wide shots) */
export const labelScreenPx = (kind: KLabelKind, k: number) => (kind === "num" ? NUM : WORD) * Math.max(Math.pow(k, 0.75), 0.9);
/** WORLD font size of a label class at k */
export const labelWorldPx = (kind: KLabelKind, k: number) => labelScreenPx(kind, k) / k;
/** WORLD distance between the caps centres of two stacked label lines */
export const labelStep = (k: number, kind: KLabelKind = "word") => 1.28 * labelWorldPx(kind, k);
/** WORLD drop from a baseline (or a shape's edge) to the caps centre of the first label line under it */
export const labelDrop = (k: number, kind: KLabelKind = "word") => 1.3 * labelWorldPx(kind, k);
/** WORLD advance width of a kit label */
export const kLabelWidth = (text: string, k: number, kind: KLabelKind = "word") => {
  const size = kind === "num" ? "value" : "word";
  return (labelWidth(text, size, k) * labelWorldPx(kind, k)) / labelPx(size, k);
};

/** warm paper shadow under RED shapes only (alpha scalable for a deep -> red crossfade) */
const redShadow = (k: number, a = 1) =>
  a <= 0.01 ? undefined : `drop-shadow(0 ${(4 / k).toFixed(3)}px ${(8 / k).toFixed(3)}px rgba(70,35,15,${(0.16 * a).toFixed(3)}))`;

// ---------------------------------------------------------------------------
// LABELS: the two fixed styles. Always through KLabel.
// ---------------------------------------------------------------------------
export type KLabelKind = "word" | "num";
/** A kit label. (x, y) = anchor of the capitals' box (y = caps' vertical centre)
 *  of line 0; `line` stacks further lines below it (labelStep). `appear` is RAW
 *  linear progress 0..1 (use landOn / startAt): slide-up 24 px + fade + blur-in
 *  over ENTER_F. Ink only: rung INK_HI (default) or INK_LO for context. */
export const KLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  k: number;
  kind?: KLabelKind;
  rung?: number;
  appear?: number;
  exit?: number;
  diffuse?: number;
  anchor?: Anchor;
  line?: number;
}> = ({ text, x, y, k, kind = "word", rung = INK_HI, appear = 1, exit = 0, diffuse = 0, anchor = "middle", line = 0 }) => (
  <Label
    text={text}
    x={x}
    y={y + line * labelStep(k, kind)}
    k={k}
    size={kind === "num" ? "value" : "word"}
    rung={rung}
    appear={appear}
    exit={exit}
    diffuse={diffuse}
    anchor={anchor}
    minPx={labelScreenPx(kind, k)}
  />
);
/** raw `appear` of a label that LANDS on the word at local frame `wordS` */
export const landOn = (S: number, wordS: number) => enterU(S, wordS);
/** raw `appear` of a label that STARTS entering at `startS` */
export const startAt = (S: number, startS: number) => enterFrom(S, startS);

// ---------------------------------------------------------------------------
// SHAPES
// ---------------------------------------------------------------------------
const ARC_N = 16;
/** The outline of a bar standing on baseline y at centre x: left foot -> over the
 *  top -> right foot (open at the foot). Top corners radius min(w/2, h/2): a tall
 *  bar is a pill with a fully round top, a stub is a low block with soft corners.
 *  `inset` shrinks it (for a stroke that stays inside the shape). */
export const barPts = (x: number, y: number, w: number, h: number, inset = 0): Pt[] => {
  const hw = w / 2 - inset;
  const hh = h - inset;
  if (hw <= 0.5 || hh <= 0.5) return [];
  const r = Math.min(hw, hh / 2);
  const top = y - hh;
  const pts: Pt[] = [{ x: x - hw, y }];
  for (let i = 0; i <= ARC_N; i++) {
    const a = Math.PI + (Math.PI / 2) * (i / ARC_N);
    pts.push({ x: x - hw + r + r * Math.cos(a), y: top + r + r * Math.sin(a) });
  }
  for (let i = 0; i <= ARC_N; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / ARC_N);
    pts.push({ x: x + hw - r + r * Math.cos(a), y: top + r + r * Math.sin(a) });
  }
  pts.push({ x: x + hw, y });
  return pts;
};
/** The outline of a slab centred on (x, y), clockwise from the middle of its top edge (closed). */
export const slabPts = (x: number, y: number, w: number, h: number, inset = 0): Pt[] => {
  const hw = w / 2 - inset;
  const hh = h / 2 - inset;
  if (hw <= 0.5 || hh <= 0.5) return [];
  const r = Math.max(0.5, Math.min(SLAB_R - inset, hw, hh));
  const pts: Pt[] = [{ x, y: y - hh }];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= ARC_N; i++) {
      const a = a0 + (Math.PI / 2) * (i / ARC_N);
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  };
  corner(x + hw - r, y - hh + r, -Math.PI / 2);
  corner(x + hw - r, y + hh - r, 0);
  corner(x - hw + r, y + hh - r, Math.PI / 2);
  corner(x - hw + r, y - hh + r, Math.PI);
  pts.push({ x, y: y - hh });
  return pts;
};
/** Keep the part of a closed polygon with y >= yMin (Sutherland-Hodgman on one edge). */
const clipBelow = (pts: Pt[], yMin: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const ain = a.y >= yMin;
    const bin = b.y >= yMin;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (yMin - a.y) / (b.y - a.y);
      out.push({ x: a.x + (b.x - a.x) * t, y: yMin });
    }
  }
  return out;
};
const reversed = (pts: Pt[]) => [...pts].reverse();

/** Wash 0.10 + hatch 0.35 over a closed region (the ink "area" material). */
const InkBody: React.FC<{ id: string; region: Pt[]; k: number; rung: number; anchor: Pt }> = ({ id, region, k, rung, anchor }) => {
  if (region.length < 3) return null;
  return (
    <HatchFill
      id={id}
      region={region}
      k={k}
      color={INK}
      opacity={Math.min(1, rung / INK_HI)}
      fill={WASH_FILL}
      lineOpacity={WASH_HATCH}
      anchor={anchor}
    />
  );
};

/** A LINE_W dashed stroke along a polyline, drawn [0, draw], dashes marching toward the head. */
const DashStroke: React.FC<{ points: Pt[]; k: number; S: number; draw?: number; color: string; opacity?: number; fromEnd?: boolean }> = ({
  points,
  k,
  S,
  draw = 1,
  color,
  opacity = 1,
  fromEnd = false,
}) => {
  const d = clamp01(draw);
  if (points.length < 2 || d <= 0.0005 || opacity <= 0.002) return null;
  const cum = cumLen(points);
  const total = cum[cum.length - 1];
  const L = total * d;
  const s = kw(k);
  const w = LINE_W * s;
  const P = (KDASH + KDASH_GAP) * s;
  const core = Math.max(0.1, KDASH * s - w);
  // the pattern stays anchored to the path's start whichever end the stroke is written from
  const a = fromEnd ? total - L : 0;
  const off = (-(((KMARCH * s * S) % P) + P) % P) + a;
  return (
    <path
      d={subPathD(points, cum, a, a + L)}
      fill="none"
      stroke={color}
      strokeOpacity={opacity < 1 ? opacity.toFixed(4) : undefined}
      strokeWidth={w.toFixed(3)}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={`${core.toFixed(3)} ${(P - core).toFixed(3)}`}
      strokeDashoffset={off.toFixed(3)}
    />
  );
};

export type BarKind = "ink" | "red" | "deep" | "needed" | "expected";
/** A BAR: a vertical pill standing on a baseline.
 *  - x = its centre, y = the baseline (default 0), w (default BAR_W), h = its
 *    CURRENT height in world px (grow it with H * growAt(S, s0, dur)).
 *  - kind "ink": hatched wash + LINE_W outline (inside the shape). `level`
 *    (world px above the baseline, optional) fills the body only up to that
 *    height, flat-topped with a hair edge (a fill rising inside an outline), and
 *    `outline` (0..1, default 1) is how much of the solid outline is written,
 *    from the apex down both sides.
 *  - kind "red": solid vermilion + paper shadow; `wet` 0..1 lights the RED_WET
 *    tip (use it while the bar grows, let it dry over ~18 f); `deep` 0..1 mixes
 *    it toward RED_DEEP (1 = deep, shadow gone) for an eased state change.
 *  - kind "deep": solid RED_DEEP, no shadow.
 *  - kind "needed" (dashed red) / "expected" (dashed ink): `h` is the full
 *    height, `draw` 0..1 writes the outline up from both feet to the apex
 *    (`from="apex"`: down from the apex to both feet); dashes march upward on S.
 *  - rung: ink opacity of the ink kinds (INK_HI / INK_LO). */
export const Bar: React.FC<{
  id: string;
  x: number;
  y?: number;
  w?: number;
  h: number;
  kind: BarKind;
  k: number;
  S: number;
  rung?: number;
  wet?: number;
  deep?: number;
  draw?: number;
  level?: number;
  outline?: number;
  from?: "feet" | "apex";
}> = ({ id, x, y = 0, w = BAR_W, h, kind, k, S, rung = INK_HI, wet = 0, deep = 0, draw = 1, level, outline = 1, from = "feet" }) => {
  if (h <= 0.6) return null;
  const lw = lineW(k);
  if (kind === "needed" || kind === "expected") {
    const pts = barPts(x, y, w, h, lw / 2);
    if (pts.length < 2) return null;
    const cum = cumLen(pts);
    const half = cum[cum.length - 1] / 2;
    const mid = pointAtLen(pts, cum, half);
    const left: Pt[] = [];
    const right: Pt[] = [];
    pts.forEach((p, i) => {
      if (cum[i] < half) left.push(p);
      else right.push(p);
    });
    left.push(mid);
    right.unshift(mid);
    const color = kind === "needed" ? RED : INK;
    const op = kind === "needed" ? 1 : rung;
    return (
      <g>
        <DashStroke points={left} k={k} S={S} draw={draw} color={color} opacity={op} fromEnd={from === "apex"} />
        <DashStroke points={reversed(right)} k={k} S={S} draw={draw} color={color} opacity={op} fromEnd={from === "apex"} />
      </g>
    );
  }
  const outer = barPts(x, y, w, h);
  if (outer.length < 3) return null;
  if (kind === "red" || kind === "deep") {
    const dp = kind === "deep" ? 1 : clamp01(deep);
    const fill = dp >= 1 ? RED_DEEP : dp <= 0 ? RED : mixHex(RED, RED_DEEP, dp);
    const top = y - h;
    const reach = Math.min(WET_REACH, h);
    const wt = clamp01(wet) * (1 - dp);
    const d = polyD(outer, true);
    return (
      <g style={{ filter: redShadow(k, 1 - dp) }}>
        <path d={d} fill={fill} />
        {wt > 0.01 ? (
          <>
            <defs>
              <linearGradient id={`${id}-wet`} gradientUnits="userSpaceOnUse" x1={0} y1={top.toFixed(2)} x2={0} y2={(top + reach).toFixed(2)}>
                <stop offset={0} stopColor={RED_WET} stopOpacity={wt.toFixed(4)} />
                <stop offset={0.45} stopColor={RED_WET} stopOpacity={(0.55 * wt).toFixed(4)} />
                <stop offset={1} stopColor={RED_WET} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#${id}-wet)`} />
          </>
        ) : null}
      </g>
    );
  }
  // ink
  const lv = level === undefined ? h : Math.max(0, Math.min(h, level));
  const region = level === undefined ? outer : clipBelow(outer, y - lv);
  const ol = clamp01(outline);
  const inner = barPts(x, y, w, h, lw / 2);
  let outlineEl: React.ReactNode = null;
  if (ol >= 0.999) {
    outlineEl = <path d={polyD(inner)} />;
  } else if (ol > 0.001 && inner.length > 1) {
    const cum = cumLen(inner);
    const total = cum[cum.length - 1];
    outlineEl = <path d={subPathD(inner, cum, (total / 2) * (1 - ol), (total / 2) * (1 + ol))} />;
  }
  let edge: React.ReactNode = null;
  if (level !== undefined && lv > 0.6 && lv < h - 0.3) {
    let x0 = Infinity;
    let x1 = -Infinity;
    for (const p of region) {
      if (Math.abs(p.y - (y - lv)) < 0.01) {
        x0 = Math.min(x0, p.x);
        x1 = Math.max(x1, p.x);
      }
    }
    if (x1 - x0 > 1) {
      const hw = hairW(k);
      edge = (
        <path
          d={`M${x0.toFixed(2)} ${(y - lv + hw / 2).toFixed(2)}L${x1.toFixed(2)} ${(y - lv + hw / 2).toFixed(2)}`}
          stroke={INK}
          strokeOpacity={rung.toFixed(4)}
          strokeWidth={hw.toFixed(3)}
          fill="none"
        />
      );
    }
  }
  return (
    <g>
      {lv > 0.6 ? <InkBody id={`${id}-h`} region={region} k={k} rung={rung} anchor={{ x: x - w / 2, y }} /> : null}
      {edge}
      {outlineEl ? (
        <g fill="none" stroke={INK} strokeOpacity={rung.toFixed(4)} strokeWidth={lw.toFixed(3)} strokeLinecap="butt" strokeLinejoin="round">
          {outlineEl}
        </g>
      ) : null}
    </g>
  );
};

export type SlabKind = "ink" | "red" | "deep" | "needed";
/** A SLAB: a wide rounded block (corner SLAB_R) centred on (x, y), w x h world px.
 *  - kind "ink": hatched wash + LINE_W outline. `draw` 0..1 writes the outline
 *    clockwise from the middle of the top edge (a wet bead leads while
 *    0 < draw < 1); `grow` 0..1 soaks the body in left -> right.
 *  - kind "red" / "deep": solid; `grow` 0..1 grows it from its left edge with a
 *    RED_WET leading end (`wet` 0..1); `deep` 0..1 mixes red toward RED_DEEP.
 *  - kind "needed": dashed red outline, marching; `draw` writes it.
 *  - label (optional): ONE word label centred inside, ink (never white), with a
 *    feathered clear patch under it on hatched slabs. `labelAppear` is raw
 *    progress (landOn / startAt), `labelRung` its ink rung.
 *  Wrap it in your own <g transform> to move / tilt it. */
export const Slab: React.FC<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: SlabKind;
  k: number;
  S: number;
  rung?: number;
  draw?: number;
  grow?: number;
  wet?: number;
  deep?: number;
  label?: string;
  labelAppear?: number;
  labelRung?: number;
}> = ({ id, x, y, w, h, kind, k, S, rung = INK_HI, draw = 1, grow = 1, wet = 0, deep = 0, label, labelAppear = 1, labelRung = INK_HI }) => {
  const lw = lineW(k);
  const g = clamp01(grow);
  const dr = clamp01(draw);
  let body: React.ReactNode = null;
  if (kind === "needed") {
    const pts = slabPts(x, y, w, h, lw / 2);
    body = <DashStroke points={pts} k={k} S={S} draw={dr} color={RED} />;
  } else if (kind === "ink") {
    const outer = slabPts(x, y, w, h);
    const inner = slabPts(x, y, w, h, lw / 2);
    const cum = cumLen(inner);
    const L = cum[cum.length - 1] * dr;
    const tip = pointAtLen(inner, cum, L);
    const lblW = label ? kLabelWidth(label, k) : 0;
    const fs = labelWorldPx("word", k);
    body = (
      <g>
        <FeatherWipe id={`${id}-soak`} box={{ x0: x - w / 2 - 2, y0: y - h / 2 - 2, x1: x + w / 2 + 2, y1: y + h / 2 + 2 }} u={g} feather={Math.min(120, w * 0.3)} dir="right">
          <InkBody id={`${id}-h`} region={outer} k={k} rung={rung} anchor={{ x: x - w / 2, y: y - h / 2 }} />
        </FeatherWipe>
        {label && labelAppear > 0.01 ? (
          <rect
            x={(x - lblW / 2 - 0.3 * fs).toFixed(2)}
            y={(y - 0.5 * fs).toFixed(2)}
            width={(lblW + 0.6 * fs).toFixed(2)}
            height={(1.0 * fs).toFixed(2)}
            rx={(0.5 * fs).toFixed(2)}
            fill={PAPER}
            opacity={(0.7 * smoothstep(labelAppear) * g).toFixed(4)}
            style={{ filter: worldBlur(14, k) }}
          />
        ) : null}
        {dr > 0.0005 ? (
          <path
            d={subPathD(inner, cum, 0, L)}
            fill="none"
            stroke={INK}
            strokeOpacity={rung.toFixed(4)}
            strokeWidth={lw.toFixed(3)}
            strokeLinecap={dr >= 0.999 ? "butt" : "round"}
            strokeLinejoin="round"
          />
        ) : null}
        {dr > 0.0005 && dr < 0.999 ? (
          <Bead id={`${id}-tip`} x={tip.x} y={tip.y} r={1.28 * lw} color={INK} opacity={Math.min(1, rung / INK_HI) * smoothstep((1 - dr) / 0.06)} />
        ) : null}
      </g>
    );
  } else {
    const dp = kind === "deep" ? 1 : clamp01(deep);
    const fill = dp >= 1 ? RED_DEEP : dp <= 0 ? RED : mixHex(RED, RED_DEEP, dp);
    const gw = Math.max(0, w * g);
    if (gw > 1) {
      const cx = x - w / 2 + gw / 2;
      const d = polyD(slabPts(cx, y, gw, h), true);
      const wt = clamp01(wet) * (1 - dp);
      const x1 = x - w / 2 + gw;
      body = (
        <g style={{ filter: redShadow(k, 1 - dp) }}>
          <path d={d} fill={fill} />
          {wt > 0.01 ? (
            <>
              <defs>
                <linearGradient id={`${id}-wet`} gradientUnits="userSpaceOnUse" x1={x1.toFixed(2)} y1={0} x2={(x1 - Math.min(WET_REACH, gw)).toFixed(2)} y2={0}>
                  <stop offset={0} stopColor={RED_WET} stopOpacity={wt.toFixed(4)} />
                  <stop offset={0.45} stopColor={RED_WET} stopOpacity={(0.55 * wt).toFixed(4)} />
                  <stop offset={1} stopColor={RED_WET} stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={d} fill={`url(#${id}-wet)`} />
            </>
          ) : null}
        </g>
      );
    }
  }
  return (
    <g>
      {body}
      {label ? <KLabel text={label} x={x} y={y} k={k} rung={labelRung} appear={labelAppear} /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// LINES
// ---------------------------------------------------------------------------
/** The BASELINE: a HAIR_W ink line from x0 to x1 at y. `draw` 0..1 writes it
 *  ("left" -> right, or out from the "centre"). */
export const Baseline: React.FC<{ x0: number; x1: number; y?: number; k: number; draw?: number; rung?: number; from?: "left" | "centre" }> = ({
  x0,
  x1,
  y = 0,
  k,
  draw = 1,
  rung = INK_HI,
  from = "left",
}) => {
  const d = clamp01(draw);
  if (d <= 0.0005) return null;
  const a = from === "left" ? x0 : (x0 + x1) / 2 - ((x1 - x0) / 2) * d;
  const b = from === "left" ? x0 + (x1 - x0) * d : (x0 + x1) / 2 + ((x1 - x0) / 2) * d;
  return (
    <path
      d={`M${a.toFixed(2)} ${y.toFixed(2)}L${b.toFixed(2)} ${y.toFixed(2)}`}
      fill="none"
      stroke={INK}
      strokeOpacity={rung.toFixed(4)}
      strokeWidth={hairW(k).toFixed(3)}
      strokeLinecap="round"
    />
  );
};

/** hair bead radius, world px at k */
export const hairBeadR = (k: number) => 9 * kw(k);
/** A LEVEL LINE: a HAIR_W ink line from (x0, y) to (x1, y), written head-first
 *  over `draw` 0..1 with a bead tip (`bead` 0..1 = the tip bead's opacity; fade
 *  it out when the line has landed). `dashed` = the expected / reference variant
 *  (marching). `runner` (0..1, optional) = a slow bead travelling along the
 *  finished line, for holds. */
export const LevelLine: React.FC<{
  id: string;
  x0: number;
  x1: number;
  y: number;
  k: number;
  S: number;
  draw?: number;
  rung?: number;
  dashed?: boolean;
  bead?: number;
  runner?: number | null;
  runnerOpacity?: number;
}> = ({ id, x0, x1, y, k, S, draw = 1, rung = INK_HI, dashed = false, bead = 0, runner = null, runnerOpacity = 1 }) => {
  const d = clamp01(draw);
  if (d <= 0.0005) return null;
  const xt = x0 + (x1 - x0) * d;
  const pts = [
    { x: x0, y },
    { x: xt, y },
  ];
  const r = hairBeadR(k);
  const vis = Math.min(1, rung / INK_HI);
  return (
    <g>
      {dashed ? (
        <DashedPath points={pts} k={k} S={S} rung={rung} width={HAIR_W / sz(1)} />
      ) : (
        <path
          d={`M${x0.toFixed(2)} ${y.toFixed(2)}L${xt.toFixed(2)} ${y.toFixed(2)}`}
          fill="none"
          stroke={INK}
          strokeOpacity={rung.toFixed(4)}
          strokeWidth={hairW(k).toFixed(3)}
          strokeLinecap="round"
        />
      )}
      {bead > 0.002 ? <Bead id={`${id}-tip`} x={xt} y={y} r={r} color={INK} opacity={bead * vis} /> : null}
      {runner !== null && runnerOpacity > 0.002 ? (
        <Bead id={`${id}-run`} x={x0 + (x1 - x0) * clamp01(runner)} y={y} r={r * 0.85} color={INK} opacity={runnerOpacity * vis} />
      ) : null}
    </g>
  );
};

/** A WET STROKE: a LINE_W path written in wet ink along a polyline over `draw`
 *  0..1, bead at the tip (`bead` 0..1), the freshest stretch behind the tip wet
 *  (`wet` 0..1: 15 % thicker; red goes RED_WET). color "ink" (default) or "red"
 *  (red carries the paper shadow). */
export const WetStroke: React.FC<{
  id: string;
  points: Pt[];
  k: number;
  draw?: number;
  color?: "ink" | "red";
  rung?: number;
  wet?: number;
  bead?: number;
}> = ({ id, points, k, draw = 1, color = "ink", rung = INK_HI, wet = 0, bead = 0 }) => {
  const d = clamp01(draw);
  if (points.length < 2 || d <= 0.0005) return null;
  const cum = cumLen(points);
  const L = cum[cum.length - 1] * d;
  const w = lineW(k);
  const red = color === "red";
  const tip = pointAtLen(points, cum, L);
  const wt = clamp01(wet);
  const wetLen = Math.min(L, 70);
  const vis = red ? 1 : Math.min(1, rung / INK_HI);
  return (
    <g style={red ? { filter: redShadow(k) } : undefined}>
      <path
        d={subPathD(points, cum, 0, L)}
        fill="none"
        stroke={red ? RED : INK}
        strokeOpacity={red ? undefined : rung.toFixed(4)}
        strokeWidth={w.toFixed(3)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {wt > 0.02 && wetLen > 1 ? (
        <path
          d={subPathD(points, cum, L - wetLen, L)}
          fill="none"
          stroke={red ? RED_WET : INK}
          strokeOpacity={(wt * vis).toFixed(4)}
          strokeWidth={(w * (1 + 0.15 * wt)).toFixed(3)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {bead > 0.002 ? <Bead id={`${id}-bead`} x={tip.x} y={tip.y} r={1.28 * w} color={red ? RED_WET : INK} opacity={bead * vis} /> : null}
    </g>
  );
};

/** A short HAIR tick (for a label's pointer / a mark on a bar). */
export const Tick: React.FC<{ x0: number; y0: number; x1: number; y1: number; k: number; draw?: number; rung?: number }> = ({
  x0,
  y0,
  x1,
  y1,
  k,
  draw = 1,
  rung = INK_HI,
}) => {
  const d = clamp01(draw);
  if (d <= 0.0005) return null;
  return (
    <path
      d={`M${x0.toFixed(2)} ${y0.toFixed(2)}L${(x0 + (x1 - x0) * d).toFixed(2)} ${(y0 + (y1 - y0) * d).toFixed(2)}`}
      fill="none"
      stroke={INK}
      strokeOpacity={rung.toFixed(4)}
      strokeWidth={hairW(k).toFixed(3)}
      strokeLinecap="round"
    />
  );
};

export { INK_LO };
