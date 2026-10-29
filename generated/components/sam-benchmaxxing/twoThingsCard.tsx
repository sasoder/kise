// ---------------------------------------------------------------------------
// twoThingsCard — cut 9's own card (TwoThingsToCareAbout, sam-benchmaxxing, REV 1). A COPY of benchShared's ThingCard
// (its geometry, tile body, turn and slot, from THING_LAYOUT; benchShared's ThingCard itself is untouched: cut 18 and
// cut 3 use it) with three changes for this cut:
//   * the front has NO flat glyph: a slot runs across the face (OBJ_SLOT) and the card's 3D object rises out of it
//     (twoThings3d.tsx, drawn in a WebGL layer above the chart); the two-line ink label stays below the slot;
//   * the back's amber numeral is lifted a step toward amberHot over one soft cast shadow (amber and the board sit at
//     nearly the same luminance, 1.04:1 measured; the radar-map CastNumeral recipe), so the numerals read in value;
//   * the card's slot in the apron parts (`slotOpen`) before the card pops, and `rise` may overshoot 1 (the pop: the
//     card hops a little clear of its slot and drops back).
// Also EdgeLight (the soft key light catching a sealed back's edges) and ObjectShadow (the 3D object's one soft cast
// shadow on the card face, down-right of it: the key light is above-left and a little in front).
// All geometry in chart px (benchShared's chart plane); `k` = the look's zoom, so hairlines stay screen px.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { ALPHA, COLOR, EDGE, FONT_LABEL, FONT_NUM, bloomFilter, clamp01, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { ContactShadow, Slot, SlotLip, THING, THING_LAYOUT, thingH, type ThingId } from "./benchShared";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string, p: string) => `${p}${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

/** benchShared's TileBody, copied: a card body, top -> foot gradient, cream rim along the top edge; dim 1 = board */
const Body: React.FC<{ x: number; y0: number; w: number; h: number; r: number; k: number; dim: number }> = ({ x, y0, w, h, r, k, dim }) => {
  const uid = uidOf(useId(), "tb");
  const topC = mixHex(COLOR.cream, COLOR.board, dim);
  const footC = mixHex(COLOR.creamFoot, COLOR.boardFoot, dim);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + h)}>
          <stop offset="0" stopColor={topC} />
          <stop offset="1" stopColor={footC} />
        </linearGradient>
      </defs>
      <path d={rectPath(x - w / 2, y0, w, h, r)} fill={`url(#${uid}g)`} />
      <path d={`M${f3(x - w / 2 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x + w / 2 - r)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim)} strokeWidth={f3(EDGE.CREAM / k)} />
    </g>
  );
};

/** the front: cream, the slot across the face (the object's mouth), the two-line ink label */
const Front: React.FC<{ id: ThingId; x: number; y0: number; w: number; h: number; k: number }> = ({ id, x, y0, w, h, k }) => {
  const L = THING_LAYOUT;
  const px = L.labelPx * w;
  const sy = y0 + OBJ_SLOT_Y * h;
  return (
    <g>
      <Body x={x} y0={y0} w={w} h={h} r={L.radius * w} k={k} dim={0} />
      <Slot x={x} top={sy} w={OBJ_SLOT_W * w} k={k} />
      <SlotLip x={x} top={sy} w={OBJ_SLOT_W * w} k={k} />
      {THING[id].lines.map((s, i) => (
        <text key={i} x={f3(x)} y={f3(y0 + L.line1 * h + i * L.lineGap * px)} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={f3(px)} letterSpacing="0.06em" fill={COLOR.inkDark}>
          {s}
        </text>
      ))}
    </g>
  );
};

/** the back: board, the amber numeral lifted toward amberHot over one soft cast shadow down-right */
const Back: React.FC<{ id: ThingId; x: number; y0: number; w: number; h: number; k: number }> = ({ id, x, y0, w, h, k }) => {
  const uid = uidOf(useId(), "tk");
  const L = THING_LAYOUT;
  const px = L.numeralPx * w;
  const cap = 0.729 * px;
  const base = y0 + L.numeralCy * h + cap * 0.5;
  const numeral = (fill: string, style?: React.CSSProperties) => (
    <text x={f3(x)} y={f3(base)} textAnchor="middle" fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(px)} fill={fill} style={{ fontFeatureSettings: '"lnum" 1', ...style }}>
      {THING[id].numeral}
    </text>
  );
  return (
    <g>
      <Body x={x} y0={y0} w={w} h={h} r={L.radius * w} k={k} dim={1} />
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(base - cap)} x2="0" y2={f3(base)}>
          <stop offset="0" stopColor={mixHex(COLOR.amberTop, COLOR.amberHot, 0.42)} />
          <stop offset="1" stopColor={COLOR.amberTop} />
        </linearGradient>
      </defs>
      <g transform={`translate(${f3(5 / k)} ${f3(8 / k)})`} opacity={0.42} style={{ filter: `blur(${f3(7 / k)}px)` }}>
        {numeral(COLOR.shadow)}
      </g>
      {numeral(`url(#${uid}a)`, { filter: bloomFilter(k) })}
    </g>
  );
};

/** the slot across the front, as fractions (kept here so the card copy needs nothing from the plan at module load) */
export const OBJ_SLOT_Y = 0.585;
export const OBJ_SLOT_W = 0.62;

/**
 * ThingCardOpen — ThingCard's copy (see the file header). flip 0 = back to us .. 1 = front; rise 0..~1.04 out of
 * its slot on the apron (`floor`); slotOpen 0..1 parts the apron slot first.
 */
export const ThingCardOpen: React.FC<{ id: ThingId; x: number; floor: number; w: number; k: number; flip: number; rise: number; slotOpen: number }> = ({ id, x, floor, w, k, flip, rise, slotOpen }) => {
  const uid = uidOf(useId(), "tc");
  const L = THING_LAYOUT;
  const h = thingH(w);
  const y0 = floor - h * Math.max(0, rise);
  const th = Math.PI * ss(flip);
  const c = Math.cos(th);
  const s = Math.abs(Math.sin(th));
  const faceW = Math.max(0.001, w * Math.abs(c));
  const e = L.edge * w * s;
  const left = x - (faceW + e) / 2;
  const firstHalf = c >= 0;
  const faceX = firstHalf ? left + faceW / 2 : left + e + faceW / 2;
  const edgeX = firstHalf ? left + faceW : left;
  const sx = faceW / w;
  const turnShade = (1 - Math.abs(c)) * 0.42;
  const visible = rise > 0.002;
  // the hop: clear of the slot by (rise - 1) h; the contact shadow lifts and softens with it
  const hop = clamp01(((rise - 1) * h) / 40);
  return (
    <g>
      <Slot x={x} top={floor} w={w * 0.9} k={k} open={slotOpen} />
      {visible ? (
        <g clipPath={`url(#${uid}c)`}>
          <defs>
            <clipPath id={`${uid}c`}>
              <rect x={f3(x - w)} y={f3(floor - h * 2.2)} width={f3(w * 2)} height={f3(h * 2.2)} />
            </clipPath>
          </defs>
          {rise > 0.97 ? <ContactShadow x={x} y={floor} w={Math.max(faceW + e, w * 0.08)} k={k} lift={hop} /> : null}
          {e > 0.05 ? (
            <path d={rectPath(edgeX, y0, e, h, Math.min(e / 2, L.radius * w * 0.5))} fill={firstHalf ? mixHex(COLOR.boardFoot, COLOR.inkDark, 0.18) : mixHex(COLOR.creamFoot, COLOR.board, 0.25)} />
          ) : null}
          <g transform={`translate(${f3(faceX)} 0) scale(${f3(sx)} 1) translate(${f3(-x)} 0)`}>
            {firstHalf ? <Back id={id} x={x} y0={y0} w={w} h={h} k={k} /> : <Front id={id} x={x} y0={y0} w={w} h={h} k={k} />}
            {turnShade > 0.002 ? <path d={rectPath(x - w / 2, y0, w, h, L.radius * w)} fill={COLOR.shadow} opacity={f3(turnShade)} /> : null}
          </g>
        </g>
      ) : null}
      <SlotLip x={x} top={floor} w={w * 0.9} k={k} />
    </g>
  );
};

/**
 * The soft key light catching a sealed card's edges (the light is above-left): its top rim at full cream and a soft
 * warm sheen inside the left edge. Only on the back, before the card turns (`a` 0..1), clipped to the card above
 * the ground.
 */
export const EdgeLight: React.FC<{ x: number; floor: number; w: number; rise: number; a: number; k: number }> = ({ x, floor, w, rise, a, k }) => {
  const uid = uidOf(useId(), "el");
  if (a <= 0.002 || rise <= 0.002) return null;
  const h = thingH(w);
  const r = THING_LAYOUT.radius * w;
  const y0 = floor - h * rise;
  const sheen = w * 0.16;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={f3(x - w / 2)} y={f3(y0)} width={f3(w)} height={f3(Math.max(0, Math.min(h, floor - y0)))} />
        </clipPath>
        <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1={f3(x - w / 2)} y1="0" x2={f3(x - w / 2 + sheen)} y2="0">
          <stop offset="0" stopColor={COLOR.cream} stopOpacity={0.3} />
          <stop offset="1" stopColor={COLOR.cream} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${uid}v`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + h)}>
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.75" stopColor="#fff" stopOpacity={0.15} />
        </linearGradient>
        <mask id={`${uid}m`}>
          <rect x={f3(x - w / 2)} y={f3(y0)} width={f3(w)} height={f3(h)} fill={`url(#${uid}v)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${uid}c)`} opacity={f3(a)}>
        <path d={rectPath(x - w / 2, y0, w, h, r)} fill={`url(#${uid}s)`} mask={`url(#${uid}m)`} />
        <path d={`M${f3(x - w / 2 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x + w / 2 - r)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f3(EDGE.CREAM / k)} />
      </g>
    </g>
  );
};

/**
 * ObjectShadow — the 3D object's one soft shadow on the card face behind it, cast down-right (key light above-left,
 * a little in front). `shape` "flask" = a soft cone (wide foot, narrow neck), "round" = a soft disc. Drawn only for
 * the part of the object already out of the slot (`out` 0..1 of its height above the slot line `slotY`), clipped to
 * the card face.
 */
export const ObjectShadow: React.FC<{
  shape: "flask" | "round";
  x: number;
  slotY: number;
  objH: number;
  objW: number;
  lift: number;
  out: number;
  k: number;
  card: { x: number; y0: number; w: number; h: number };
  strength?: number;
}> = ({ shape, x, slotY, objH, objW, lift, out, k, card, strength = 1 }) => {
  const uid = uidOf(useId(), "os");
  const o = clamp01(out);
  if (o <= 0.01 || strength <= 0.002) return null;
  const dx = objW * 0.1;
  const dy = objH * 0.05;
  const top = slotY - lift - objH * o;
  const bot = slotY - lift;
  const d =
    shape === "flask"
      ? `M${f3(x - objW * 0.46 + dx)} ${f3(bot + dy)}L${f3(x - objW * 0.15 + dx)} ${f3(top + objH * 0.36 + dy)}L${f3(x - objW * 0.15 + dx)} ${f3(top + dy)}L${f3(x + objW * 0.15 + dx)} ${f3(top + dy)}L${f3(x + objW * 0.15 + dx)} ${f3(top + objH * 0.36 + dy)}L${f3(x + objW * 0.46 + dx)} ${f3(bot + dy)}Z`
      : `M${f3(x - objW / 2 + dx)} ${f3((top + bot) / 2 + dy)}a${f3(objW / 2)} ${f3((bot - top) / 2)} 0 1 0 ${f3(objW)} 0a${f3(objW / 2)} ${f3((bot - top) / 2)} 0 1 0 ${f3(-objW)} 0Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={rectPath(card.x - card.w / 2, card.y0, card.w, card.h, THING_LAYOUT.radius * card.w)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <path d={d} fill={COLOR.shadow} opacity={f3(0.2 * strength)} style={{ filter: `blur(${f3(16 / Math.max(0.4, k))}px)` }} />
        {/* the contact where it stands in the slot: a short dark seam under its foot */}
        {/* a hovering round body: a soft contact pool on the card under it, tighter and darker the lower it floats */}
        {shape === "round" ? (
          <ellipse
            cx={f3(x + dx * 0.2)}
            cy={f3(slotY + 3)}
            rx={f3(objW * (0.36 + 0.0016 * lift))}
            ry={f3(10 + 0.12 * lift)}
            fill={COLOR.shadow}
            opacity={f3((0.42 * strength * o) / (1 + lift / 40))}
            style={{ filter: `blur(${f3((6 + 0.25 * lift) / Math.max(0.4, k))}px)` }}
          />
        ) : null}
        {shape !== "round" && lift < 4 ? <ellipse cx={f3(x + dx * 0.3)} cy={f3(slotY + 2)} rx={f3(objW * 0.42)} ry={f3(7)} fill={COLOR.shadow} opacity={f3(0.28 * strength * o)} style={{ filter: `blur(${f3(5 / Math.max(0.4, k))}px)` }} /> : null}
      </g>
    </g>
  );
};
