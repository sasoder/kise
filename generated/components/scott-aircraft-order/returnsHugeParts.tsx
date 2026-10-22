// ---------------------------------------------------------------------------
// returnsHugeParts — cut 6's own pieces (ReturnsHugeDownsideSmall, scott-aircraft-order), on the stout kit's
// vocabulary: the apron slab's cut front face with the earth under it (the break-even line and what lies below
// it), the two slots in the slab's edge, the UP column (glass, amber fill, rungs, fixed bloom, hot top edge)
// and the DOWN column (a short glass column hanging into a neat pocket in the earth, its fill drained board).
// All geometry in the cut's world px (returnsHugePlan.ts); `k` = the camera zoom (hairlines stay screen px).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { ALPHA, COLOR, EDGE, STROKE, bloomFilter, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR } from "./aircraftShared";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `rh${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** The slab and the earth, as tones of the world's palette (the apron's concrete, the desert's sand, the stout
 *  ground and shadow), each mixed toward the haze by the chart plane's own fog (`fog` = aircraftShared fogAmount). */
export const earthTones = (fog: number) => {
  const a = (c: string) => mixHex(c, AIR_COLOR.haze, fog);
  return {
    slabTop: a(mixHex(AIR_COLOR.concrete, COLOR.cream, 0.3)),
    slabFoot: a(AIR_COLOR.concreteLo),
    course: a(mixHex(AIR_COLOR.concreteLo, COLOR.ground, 0.45)),
    // the soil sits a clear step darker than the downside's umber fill, so the dip reads as a filled vessel
    soilTop: a(mixHex(COLOR.ground, COLOR.shadow, 0.26)),
    soilMid: a(mixHex(COLOR.ground, COLOR.shadow, 0.32)),
    soilDeep: a(mixHex(COLOR.ground, COLOR.shadow, 0.5)),
    pocket: a(mixHex(COLOR.ground, COLOR.shadow, 0.55)),
    pebble: a(AIR_COLOR.desertLo),
    // the downside's fill: a drained deep umber (director's tones), clearly darker than the slab and warmer and
    // lighter than the soil around its pocket; its rungs and leading edge in a deeper umber
    fillTop: a("#7A5638"),
    fillFoot: a("#5E4029"),
    fillEdge: a(mixHex("#5E4029", COLOR.inkDark, 0.5)),
    rungDim: a(mixHex("#5E4029", COLOR.inkDark, 0.55)),
    // amber is the one glow: it is not fogged (the jet's United fin glows the same way through the air)
    amberTop: COLOR.amberTop,
    amberFoot: COLOR.amberFoot,
    rung: COLOR.rung,
  };
};
export const EARTH_GEO = { slabH: 26, courseH: 30 } as const;
/** Detail in the earth stays out of the caption bands (world px = the payoff frame's screen px; the camera is at
 *  rest from f60, and before that the detail is in motion with everything else). */
const BANDS = { clearAbove: 1072, clearBelow: 1466 } as const;
const RADIUS = 4;

/**
 * EarthSection — the apron slab's cut front face from x0 to x1 (world px), its top edge on `top` (the ground
 * line): a concrete slab lit along its top edge, a darker base course, then warm soil deepening toward the
 * espresso ground, with a few soft strata and sparse pebbles fixed in world space. `pockets` are cut out of
 * it (the down column's slot into the earth), drawn as a darker back wall with the slab's shadow at its top.
 */
export const EarthSection: React.FC<{ x0: number; x1: number; top: number; depth: number; k: number; fog: number; pockets?: { x: number; w: number; d: number }[] }> = ({
  x0,
  x1,
  top,
  depth,
  k,
  fog,
  pockets = [],
}) => {
  const uid = uidOf(useId());
  const S = { ...earthTones(fog), ...EARTH_GEO };
  const yC = top + S.slabH;
  const yS = yC + S.courseH;
  // a few faint strata (world rows, payoff screen px), only where the captions never sit: just under the base
  // course, and below the second caption band; each a soft lit line over a soft shade, gently undulating
  const strata = [{ y: top + 96, a: 1 }, { y: BANDS.clearBelow + 24, a: 0.8 }, { y: BANDS.clearBelow + 214, a: 0.65 }];
  const wave = (y: number, i: number) => {
    const n = 14;
    const pts = Array.from({ length: n + 1 }, (_, j) => {
      const x = x0 + ((x1 - x0) * j) / n;
      return `${j ? "L" : "M"}${f3(x)} ${f3(y + 5 * Math.sin(j * 1.7 + i * 2.3) + 3 * Math.sin(j * 0.6 + i))}`;
    });
    return pts.join("");
  };
  const clearOfBands = (y: number) => (y < BANDS.clearAbove || y > BANDS.clearBelow) && y < top + 900;
  const pebbles = Array.from({ length: 160 }, (_, i) => ({
    x: x0 + hash01(i * 3.1 + 1) * (x1 - x0),
    y: yS + 8 + Math.pow(hash01(i * 5.7 + 2), 1.3) * 840,
    r: 1.4 + hash01(i * 7.3 + 3) * 2.8,
    a: 0.14 + hash01(i * 9.1 + 4) * 0.16,
  })).filter((p) => clearOfBands(p.y));
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}slab`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(yC)}>
          <stop offset="0" stopColor={S.slabTop} />
          <stop offset="1" stopColor={S.slabFoot} />
        </linearGradient>
        <linearGradient id={`${uid}soil`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yS)} x2="0" y2={f3(top + 1000)}>
          <stop offset="0" stopColor={S.soilTop} />
          <stop offset="0.3" stopColor={S.soilMid} />
          <stop offset="1" stopColor={S.soilDeep} />
        </linearGradient>
        <linearGradient id={`${uid}pk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0.55" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* soil, course, slab */}
      <rect x={f3(x0)} y={f3(yS)} width={f3(x1 - x0)} height={f3(top + depth - yS)} fill={`url(#${uid}soil)`} />
      <rect x={f3(x0)} y={f3(yC)} width={f3(x1 - x0)} height={f3(S.courseH)} fill={S.course} />
      <g fill="none" strokeLinecap="round">
        {strata.map((st, i) => (
          <g key={i}>
            <path d={wave(st.y + 4, i)} stroke={COLOR.shadow} strokeOpacity={0.22 * st.a} strokeWidth={f3(9)} style={{ filter: `blur(${f3(5)}px)` }} />
            <path d={wave(st.y, i)} stroke={S.pebble} strokeOpacity={0.26 * st.a} strokeWidth={f3(5)} style={{ filter: `blur(${f3(2.5)}px)` }} />
          </g>
        ))}
      </g>
      <g fill={S.pebble}>
        {pebbles.map((p, i) => (
          <ellipse key={i} cx={f3(p.x)} cy={f3(p.y)} rx={f3(p.r * 1.3)} ry={f3(p.r)} opacity={f3(p.a * (1 - (p.y - yS) / 1100))} />
        ))}
      </g>
      <rect x={f3(x0)} y={f3(top)} width={f3(x1 - x0)} height={f3(S.slabH)} fill={`url(#${uid}slab)`} />
      {/* the slab's shadow on the course (the slab's lip overhangs a hair) */}
      <rect x={f3(x0)} y={f3(yC)} width={f3(x1 - x0)} height={f3(10)} fill={`url(#${uid}pk)`} opacity={0.6} />
      {/* the cut edge catches the key light: one cream rim */}
      <rect x={f3(x0)} y={f3(top)} width={f3(x1 - x0)} height={f3(EDGE.CREAM / k)} fill={COLOR.edge} opacity={ALPHA.edge} />
      {/* pockets: the down column's slot into the earth */}
      {pockets.map((p, i) =>
        p.d > 0.05 ? (
          <g key={i}>
            <path d={rectPath(p.x - p.w / 2, top, p.w, p.d, Math.min(RADIUS, p.d / 2), false, true)} fill={S.pocket} />
            <rect x={f3(p.x - p.w / 2)} y={f3(top)} width={f3(p.w)} height={f3(Math.min(p.d, 22))} fill={`url(#${uid}pk)`} />
          </g>
        ) : null,
      )}
    </g>
  );
};

/** A slot in the apron's top surface just behind the cut edge (what a column comes out of): a dark recess the
 *  column's width, deepest at its front, its far lip catching the key light. `open` 0..1 widens it from a closed
 *  seam to the column's full mouth (cause before effect). Draw it before the column. */
export const Slot: React.FC<{ x: number; top: number; w: number; k: number; open?: number }> = ({ x, top, w, k, open = 1 }) => {
  const uid = uidOf(useId());
  const lip = (2 * EDGE.SLOT_LIP) / k;
  const o = clamp01(open);
  const ww = (w + lip) * (0.86 + 0.14 * o);
  const h = 2 + 5 * o;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.inkDark} stopOpacity={0.12} />
          <stop offset="1" stopColor={COLOR.inkDark} stopOpacity={ALPHA.slot} />
        </linearGradient>
      </defs>
      <path d={rectPath(x - ww / 2, top - h, ww, h, Math.min(2, h / 2), true, false)} fill={`url(#${uid}r)`} />
      <rect x={f3(x - ww / 2 + 2)} y={f3(top - h - 1 / k)} width={f3(Math.max(0, ww - 4))} height={f3(1.2 / k)} fill={COLOR.edge} opacity={0.35} />
    </g>
  );
};
/** The slab's lit front lip across a slot, drawn AFTER the column so the column comes out from behind it. */
export const SlotLip: React.FC<{ x: number; top: number; w: number; k: number }> = ({ x, top, w, k }) => {
  const lip = (2 * EDGE.SLOT_LIP) / k;
  return <rect x={f3(x - (w + lip) / 2)} y={f3(top)} width={f3(w + lip)} height={f3(EDGE.CREAM / k)} fill={COLOR.edge} opacity={ALPHA.edge} />;
};

/** The hot top edge of an amber body (SCREEN px: 2 px line + a 12 px falloff); stoutShared's recipe. */
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; r: number; id: string }> = ({ x, y, w, k, r, id }) => {
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, fall, r, true, false)} fill={`url(#${id})`} />
      <path d={`M${f3(x + r)} ${f3(y + EDGE.HOT / k / 2)}H${f3(x + w - r)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
    </g>
  );
};

/** The glass hairline: sides and the closed end, open at `openY` (the slot). `down` = hangs below it. */
const glassPath = (x0: number, w: number, openY: number, endY: number, r: number, hw: number) => {
  const xl = x0 + hw;
  const xr = x0 + w - hw;
  const down = endY > openY;
  const e = down ? endY - hw : endY + hw;
  const s = down ? 1 : -1;
  const sweep = down ? 0 : 1;
  return `M${f3(xl)} ${f3(openY)}V${f3(e - s * r)}A${f3(r)} ${f3(r)} 0 0 ${sweep} ${f3(xl + r)} ${f3(e)}H${f3(xr - r)}A${f3(r)} ${f3(r)} 0 0 ${sweep} ${f3(xr)} ${f3(e - s * r)}V${f3(openY)}`;
};

/**
 * UpColumn — the returns: a glass column risen `h` out of its slot at `base`, an amber fill inside it to
 * `h - headroom` (band gradient, fixed bloom, the hot top edge), rungs every `rung` from the base, a soft streak
 * of the key light down the glass's left side, the bar's foot occlusion and the slot line at the joint.
 */
export const UpColumn: React.FC<{ x: number; base: number; w: number; h: number; headroom: number; rung: number; k: number; band: [number, number]; fog: number }> = ({
  x,
  base,
  w,
  h,
  headroom,
  rung,
  k,
  band,
  fog,
}) => {
  const uid = uidOf(useId());
  const T = earthTones(fog);
  // hidden behind the slab's lip until its glass top clears it (no sliver on the seam)
  if (h <= 3 / k) return null;
  const x0 = x - w / 2;
  const top = base - h;
  const fh = Math.max(0, h - headroom * Math.min(1, h / (headroom * 4)));
  const fy = base - fh;
  const r = Math.min(RADIUS * 2, w / 2, h);
  const hair = Math.max(STROKE.HAIRLINE, 2) / k;
  const rungs: number[] = [];
  for (let i = 1; i * rung < fh; i++) {
    const y = base - i * rung;
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
        {/* form: lit from the upper left, the right third turns away from the key light */}
        <linearGradient id={`${uid}fs`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.16" />
          <stop offset="0.3" stopColor={COLOR.amberHot} stopOpacity="0" />
          <stop offset="0.62" stopColor={COLOR.amberFoot} stopOpacity="0" />
          <stop offset="1" stopColor={mixHex(COLOR.amberFoot, COLOR.inkDark, 0.3)} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* contact shadow on the slab's top, offset away from the key light */}
      <ellipse cx={f3(x + 6)} cy={f3(base - 1)} rx={f3(w * 0.62)} ry={f3(4)} fill={COLOR.shadow} opacity={0.5} style={{ filter: `blur(${f3(3 / k)}px)` }} />
      {/* glass body */}
      <path d={rectPath(x0, top, w, h, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
      {/* amber fill: one glow pass */}
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
      {fh > 0.05 ? <HotEdge x={x0} y={fy} w={w} k={k} r={0} id={`${uid}h`} /> : null}
      {/* the joint: foot occlusion and the slot line */}
      <rect x={f3(x0)} y={f3(base - Math.min(h, EDGE.FOOT_AO / k))} width={f3(w)} height={f3(Math.min(h, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
      {/* glass streak and hairline */}
      {h > r + 6 / k ? <rect x={f3(sx)} y={f3(top + r + 2 / k)} width={f3(sw)} height={f3(Math.max(0, h - r - 4 / k))} rx={f3(sw / 2)} fill={COLOR.glass} fillOpacity={0.12} /> : null}
      <path d={glassPath(x0, w, base, top, r, hair / 2)} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair)} />
    </g>
  );
};

/**
 * DownColumn — the downside: a glass column hanging `d` below `base` into its pocket in the earth, open at the top
 * (the slot), closed at its foot, the hairline bright cream so the vessel reads against the dark soil. Inside it a
 * drained umber fill sinks with it, `gap` short of the glass's foot (the mirror of the up column's headroom), its
 * leading edge a deeper line; rungs every `rung` from the top, the up column's pitch.
 */
export const DownColumn: React.FC<{ x: number; base: number; w: number; d: number; gap: number; rung: number; k: number; fog: number }> = ({ x, base, w, d, gap, rung, k, fog }) => {
  const uid = uidOf(useId());
  const T = earthTones(fog);
  if (d <= 0.05) return null;
  const x0 = x - w / 2;
  const end = base + d;
  const fd = Math.max(0, d - gap * Math.min(1, d / (gap * 4)));
  const r = Math.min(RADIUS * 2, w / 2, d);
  const hair = 2.5 / k;
  const rungs: number[] = [];
  for (let i = 1; i * rung < fd - 4 / k; i++) rungs.push(base + i * rung);
  const sx = x0 + w * 0.13;
  const sw = Math.max(w * 0.09, 3 / k);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}f`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(base)} x2="0" y2={f3(base + 130)}>
          <stop offset="0" stopColor={T.fillTop} />
          <stop offset="1" stopColor={T.fillFoot} />
        </linearGradient>
        <linearGradient id={`${uid}fs`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLOR.cream} stopOpacity="0.1" />
          <stop offset="0.35" stopColor={COLOR.cream} stopOpacity="0" />
          <stop offset="0.65" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0.38" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the glass body (a faint tint over the pocket's back wall) */}
      <path d={rectPath(x0, base, w, d, r, false, true)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint * 1.6} />
      {fd > 0.05 ? (
        <g>
          <path d={rectPath(x0, base, w, fd, 0, false, false)} fill={`url(#${uid}f)`} />
          <path d={rectPath(x0, base, w, fd, 0, false, false)} fill={`url(#${uid}fs)`} />
          {/* the slab's shadow over the top of the fill */}
          <rect x={f3(x0)} y={f3(base)} width={f3(w)} height={f3(Math.min(fd, 18))} fill={`url(#${uid}s)`} />
          {rungs.length ? (
            <g stroke={T.rungDim} strokeWidth={f3(STROKE.HAIRLINE / k)}>
              {rungs.map((y) => (
                <line key={y} x1={f3(x0)} x2={f3(x0 + w)} y1={f3(y)} y2={f3(y)} />
              ))}
            </g>
          ) : null}
          {/* the leading edge */}
          <rect x={f3(x0)} y={f3(base + fd - 2 / k)} width={f3(w)} height={f3(2 / k)} fill={T.fillEdge} />
        </g>
      ) : null}
      {d > r + 6 / k ? <rect x={f3(sx)} y={f3(base + 2 / k)} width={f3(sw)} height={f3(Math.max(0, d - r - 4 / k))} rx={f3(sw / 2)} fill={COLOR.glass} fillOpacity={0.14} /> : null}
      <path d={glassPath(x0, w, base, end, r, hair / 2)} fill="none" stroke={COLOR.glass} strokeOpacity={1} strokeWidth={f3(hair)} />
    </g>
  );
};

/**
 * Sign — a tiny identifier ("+" on the up column's cap, "−" on the down column's foot) in Söhne Kräftig, the
 * house text entrance (slide up 24 screen px + fade + 6 px blur over `enter` 0..1). (x, y) = its centre, world px;
 * `px` = screen size.
 */
export const Sign: React.FC<{ x: number; y: number; k: number; text: string; px: number; color: string; enter: number; font: string; disc?: { d: number; color: string } }> = ({
  x,
  y,
  k,
  text,
  px,
  color,
  enter,
  font,
  disc,
}) => {
  const e = clamp01(enter);
  if (e <= 0.001) return null;
  const a = 1 - Math.pow(1 - e, 3);
  const dy = ((1 - a) * 24) / k;
  return (
    <g opacity={f3(a)} style={{ filter: a < 1 ? `blur(${f3((6 * (1 - a)) / k)}px)` : undefined }}>
      {disc ? <circle cx={f3(x)} cy={f3(y + dy)} r={f3(disc.d / 2 / k)} fill={disc.color} /> : null}
      <text
        x={f3(x)}
        y={f3(y + dy)}
        fontFamily={font}
        fontSize={f3(px / k)}
        fill={color}
        stroke={color}
        strokeWidth={f3(1.6 / k)}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text}
      </text>
    </g>
  );
};
