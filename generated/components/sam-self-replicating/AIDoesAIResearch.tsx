// ---------------------------------------------------------------------------
// AIDoesAIResearch (sam-self-replicating, cut 41). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 61 frames.
//
// CHECK LINE: "The AI writes the research, and the research is a better AI, which writes the next one."
//
// THE LINE: "RSI as an AI that does AI research."
// WORD -> FRAME: as 6 · an 12 · AI 16 · that 29 · does 33 · AI 39 · research 46 · There's 59
// DURATION: the slot 41.124 -> 43.669 s = 2.545 s x 23.976 = 61 frames (f0..f60).
//
// THE MOTION: one log-space pull-back through a chain of generations. A cream OpenAI tile feeds a paper sheet of
// printed bars out of its amber-lit slot; the sheet clears the slot, lifts, slides right, curls forward and grows
// 1.4x, then flips about its vertical axis in the air (f22-30): the back IS the next tile, with the OpenAI mark,
// an amber link trailing behind it from the slot. That tile prints the next sheet on "AI research", which is already resolving into a third tile
// as the slot ends. The camera never stops: one eased zoom about a fixed screen point, so each new tile arrives at
// about the same screen size while the earlier ones recede to the lower left.
// CONTACT / REACTION: sheet 1 clears the slot at f15 (first slide f15); tile 2 lands f34, its slot opens from f30
// as the link reaches it, and it feeds from f34. Sheet 2 clears at f47; it flips f50-58; it is still
// settling at f60.
// AMBER = compute: the slot light and the link (the research running). Cream = the subject; the older tiles recede
// by tone toward board.
//
// SOURCES: the OpenAI mark from pricingShared/macintoshShared (Commons "OpenAI logo 2025 (symbol).svg"). No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  StoutStage,
  amberBandFor,
  bloomFilter,
  camFor,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import { Glyph, OpenAISlotTile, SHADOW_S, StoutShadow, TILE, type Cam } from "../sam-pricing-tokens/pricingShared";

export const FPS = 24000 / 1001;
export const DURATION = 61;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ===========================================================================
// THE WORLD: three tiles, each 1.4x the last, placed from the last frame's layout
// ===========================================================================
const GROWTH = 1.4;
const SIZE = [400, 400 * GROWTH, 400 * GROWTH * GROWTH];
const K0 = 1.3; // T1 = 520 px on screen at f0
const K1 = 0.57; // T1 = 228, T2 = 319, T3 = 447 at f60
const OPEN = { x: 540, y: 870 }; // T1's screen centre at f0: its mark clears the caption band
const LAST = [
  { x: 174, y: 983 },
  { x: 418, y: 865 },
  { x: 790, y: 750 },
];
const T1_W = { x: 540, y: 960 }; // T1's world centre
const END_CAM = camFor(T1_W.x, T1_W.y, LAST[0].x, LAST[0].y, K1);
const TILES = LAST.map((p, i) => ({
  x: END_CAM.x + (p.x - 540) / K1,
  y: END_CAM.y + (p.y - 960) / K1,
  size: SIZE[i],
}));
const topOf = (t: { y: number; size: number }) => t.y - t.size / 2;
const shadowS = (size: number) => (SHADOW_S * size) / TILE.size;

// ===========================================================================
// THE CAMERA: one eased log-space zoom about a fixed screen point (no separate pan), never quite at rest
// ===========================================================================
const camU = (f: number) => smoothstep(f / 68) / smoothstep(60 / 68);
const FIX = {
  x: (LAST[0].x - (OPEN.x * K1) / K0) / (1 - K1 / K0),
  y: (LAST[0].y - (OPEN.y * K1) / K0) / (1 - K1 / K0),
};
const camAt = (f: number): Cam => {
  const k = K0 * Math.pow(K1 / K0, camU(f));
  const sx = FIX.x + ((OPEN.x - FIX.x) * k) / K0;
  const sy = FIX.y + ((OPEN.y - FIX.y) * k) / K0;
  return camFor(T1_W.x, T1_W.y, sx, sy, k);
};
const REST = camAt(0);

// ===========================================================================
// THE SHEETS: each comes out of parent's slot, and becomes child
// ===========================================================================
type Chain = {
  parent: number;
  fFeed: number; // the sheet's top is at the slot's mouth
  fClear: number; // its foot leaves the mouth
  fLand: number; // it is the next tile
  flip: [number, number]; // the card flip about its vertical axis: front = lines + dog-ear, back = tile + mark
  slit: [number, number]; // the new tile's slot opens (dark), its amber runs along it right after
};
const CHAINS: Chain[] = [
  { parent: 0, fFeed: -3, fClear: 15, fLand: 34, flip: [22, 30], slit: [30, 34] },
  { parent: 1, fFeed: 34, fClear: 47, fLand: 62, flip: [50, 58], slit: [56, 60] },
];
const SHEET = { w: 0.72, h: 0.94, r: 0.03 };
/** The printed page in sheet shares: title bar and five lines. */
const PRINT = [
  { y: 0.12, w: 0.5, h: 0.062 },
  { y: 0.3, w: 0.78, h: 0.038 },
  { y: 0.415, w: 0.78, h: 0.038 },
  { y: 0.53, w: 0.7, h: 0.038 },
  { y: 0.645, w: 0.78, h: 0.038 },
  { y: 0.76, w: 0.46, h: 0.038 },
];
const hermite = (t: number, p0: number, p1: number, m0: number, m1: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1;
};
/** One family of ease for every travel: a real ease-in, a long ease-out. */
const travelEase = (t: number) => {
  const x = clamp01(t);
  const a = x * x * (3 - 2 * x);
  return lerp(a, 1 - Math.pow(1 - x, 3), 0.45);
};
const sheetAt = (c: Chain, f: number) => {
  const P = TILES[c.parent];
  const C = TILES[c.parent + 1];
  const top = topOf(P);
  const w0 = SHEET.w * P.size;
  const h0 = SHEET.h * P.size;
  const yStart = top + h0 / 2;
  const yClear = top - h0 / 2;
  const vClear = (1.2 * (yClear - yStart)) / (c.fClear - c.fFeed);
  const tr = clamp01((f - c.fClear) / (c.fLand - c.fClear));
  const g = travelEase(tr);
  let y: number;
  if (f <= c.fFeed) y = yStart;
  else if (f < c.fClear) y = hermite((f - c.fFeed) / (c.fClear - c.fFeed), yStart, yClear, 0, vClear * (c.fClear - c.fFeed));
  else y = hermite(tr, yClear, C.y, vClear * (c.fLand - c.fClear), 0);
  const x = lerp(P.x, C.x, g);
  const w = w0 * Math.pow(C.size / w0, g);
  const h = h0 * Math.pow(C.size / h0, g);
  const r = lerp(SHEET.r * P.size, TILE.radius * C.size, g);
  // one ease: foreshorten to edge-on, then open on the back (a card's thickness remains at edge-on)
  const turn = Math.cos(Math.PI * smoothstep((f - c.flip[0]) / (c.flip[1] - c.flip[0])));
  const back = turn <= 0;
  const sx = Math.max(0.03, Math.abs(turn));
  const slitT = smoothstep((f - c.slit[0]) / (c.slit[1] - c.slit[0]));
  // the lift: leaves the slot as it clears, sets down over the last third of the travel
  const lift = smoothstep((f - (c.fClear - 5)) / 7) * (1 - smoothstep((tr - 0.62) / 0.38));
  // the dog-ear: rises as it slides, on the front face only
  const curl = back ? 0 : 0.36 * Math.min(w, h) * smoothstep((f - c.fClear) / (c.flip[0] + 2 - c.fClear));
  const angle = 7 * Math.sin(Math.PI * Math.pow(tr, 0.8)) * (1 - tr);
  const s = lerp(shadowS(P.size), shadowS(C.size), g);
  return { x, y, w, h, r, back, sx, slitT, lift, curl, angle, s, tr, g, childSize: C.size };
};
type SheetState = ReturnType<typeof sheetAt>;

// The outline: a rounded rect whose top right corner folds away along a chord (curl 0 = a true round corner).
const KAPPA = 0.5523;
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const sheetPath = (st: SheetState) => {
  const { x, y, w, h, r, curl } = st;
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const y0 = y - h / 2;
  const y1 = y + h / 2;
  const C = r + curl;
  const straight = clamp01(curl / (0.5 * r + 1));
  // the corner's cubic handles run from an arc's to the chord's
  const cx1 = lerp(x1 - C * (1 - KAPPA), x1 - C * (1 - 1 / 3), straight);
  const cy2 = lerp(y0 + C * (1 - KAPPA), y0 + C * (1 - 1 / 3), straight);
  const c1y = lerp(y0, y0 + C / 3, straight);
  const c2x = lerp(x1, x1 - C / 3, straight);
  return (
    `M${f3(x0 + r)} ${f3(y0)}H${f3(x1 - C)}` +
    `C${f3(cx1)} ${f3(c1y)} ${f3(c2x)} ${f3(cy2)} ${f3(x1)} ${f3(y0 + C)}` +
    `V${f3(y1 - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x1 - r)} ${f3(y1)}H${f3(x0 + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x0)} ${f3(y1 - r)}V${f3(y0 + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x0 + r)} ${f3(y0)}Z`
  );
};
const sheetTf = (st: SheetState) => {
  const parts: string[] = [];
  if (st.angle) parts.push(`rotate(${fx(st.angle)} ${fx(st.x)} ${fx(st.y)})`);
  if (st.sx < 1) parts.push(`translate(${fx(st.x)} 0) scale(${fx(st.sx)} 1) translate(${fx(-st.x)} 0)`);
  return parts.length ? parts.join(" ") : undefined;
};

/** The ink: the printed lines on the sheet's front, the mark on its back. Never both. */
const SheetInk: React.FC<{ st: SheetState }> = ({ st }) => {
  const { x, y, w, h, back } = st;
  if (back) return <Glyph id="chatgpt" x={x} y={y + 0.03 * w} size={w} color={COLOR.inkDark} />;
  const left = x - w / 2 + 0.11 * w;
  const y0 = y - h / 2;
  return (
    <g>
      {PRINT.map((b, i) => {
        const bh = b.h * h;
        return <path key={i} d={rectPath(left, y0 + b.y * h, b.w * w, bh, bh / 2)} fill={COLOR.inkDark} />;
      })}
    </g>
  );
};

/** The sheet / the tile it becomes, face only (its shadow is drawn by the caller). */
const SheetBody: React.FC<{ id: string; st: SheetState; k: number }> = ({ id, st, k }) => {
  const { x, y, w, h, r, curl } = st;
  const x1 = x + w / 2;
  const y0 = y - h / 2;
  const d = sheetPath(st);
  const C = r + curl;
  const size = st.childSize;
  const slitW = Math.min(TILE.slotW * w * st.slitT, Math.max(0, w - 2 * C));
  const slitH = TILE.slotH * size;
  const sw = EDGE.CREAM / k;
  const edgeY = y0 + sw / 2;
  // the curled corner: the chord's midpoint, then in along the diagonal
  const mx = x1 - C / 2;
  const my = y0 + C / 2;
  const tipX = mx - curl * 0.62;
  const tipY = my + curl * 0.62;
  return (
    <g transform={sheetTf(st)}>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + h)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${id}f`} gradientUnits="userSpaceOnUse" x1={f3(mx)} y1={f3(my)} x2={f3(tipX)} y2={f3(tipY)}>
          <stop offset="0" stopColor={mixHex(COLOR.creamFoot, COLOR.board, 0.62)} />
          <stop offset="0.55" stopColor={mixHex(COLOR.creamFoot, COLOR.board, 0.18)} />
          <stop offset="1" stopColor={COLOR.cream} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id}g)`} />
      <path
        d={
          slitW > 0.5
            ? `M${f3(x - w / 2 + r)} ${f3(edgeY)}H${f3(x - slitW / 2)}M${f3(x + slitW / 2)} ${f3(edgeY)}H${f3(x1 - C)}`
            : `M${f3(x - w / 2 + r)} ${f3(edgeY)}H${f3(x1 - C)}`
        }
        stroke={COLOR.edge}
        strokeOpacity={ALPHA.edge}
        strokeWidth={f3(sw)}
      />
      {st.sx > 0.03 ? <SheetInk st={st} /> : null}
      {/* the card's own turn away from the key light, by tone */}
      {st.sx < 1 ? <path d={d} fill={COLOR.shadow} opacity={f3(0.22 * (1 - st.sx))} /> : null}
      {slitW > 0.5 ? (
        <g>
          <path d={rectPath(x - slitW / 2, y0, slitW, slitH, slitH / 2)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot + 0.2} />
          <path d={`M${f3(x - slitW / 2 + slitH)} ${f3(y0 + slitH + sw / 2)}H${f3(x + slitW / 2 - slitH)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge * 0.5} strokeWidth={f3(sw)} />
        </g>
      ) : null}
      {curl > 0.5 && st.sx > 0.03 ? (
        <g>
          {/* the curled corner's own soft shadow on the page, then the corner, its underside lit toward the tip */}
          <path
            d={`M${f3(x1 - C)} ${f3(y0)}L${f3(x1)} ${f3(y0 + C)}L${f3(tipX + 0.08 * curl)} ${f3(tipY + 0.16 * curl)}Z`}
            fill={COLOR.shadow}
            opacity={0.3}
            style={{ filter: `blur(${f3(0.05 * w)}px)` }}
          />
          <path d={`M${f3(x1 - C)} ${f3(y0)}L${f3(x1)} ${f3(y0 + C)}Q${f3(tipX + curl * 0.36)} ${f3(tipY + curl * 0.1)} ${f3(tipX)} ${f3(tipY)}Q${f3(tipX - curl * 0.1)} ${f3(tipY - curl * 0.36)} ${f3(x1 - C)} ${f3(y0)}Z`} fill={`url(#${id}f)`} />
        </g>
      ) : null}
    </g>
  );
};

/** The amber link: from the parent's slot mouth to a point behind the sheet (it is hidden until the sheet moves off). */
const Link: React.FC<{ id: string; parent: number; st: SheetState; k: number; band: [number, number] }> = ({ id, parent, st, k, band }) => {
  const P = TILES[parent];
  const top = topOf(P);
  const ex = st.x;
  const ey = st.y - 0.24 * st.h;
  const rise = top - ey;
  if (rise <= 0) return null;
  const run = ex - P.x;
  const d = `M${f3(P.x)} ${f3(top + 2)}C${f3(P.x)} ${f3(top - 0.72 * rise)} ${f3(ex - 0.72 * run)} ${f3(ey)} ${f3(ex)} ${f3(ey)}`;
  const W = 0.085 * P.size;
  const hot = EDGE.HOT / k;
  return (
    <g style={{ filter: bloomFilter(k) }}>
      <defs>
        <AmberGradient id={`${id}a`} y0={band[0]} y1={band[1]} />
        <clipPath id={`${id}c`}>
          <rect x={f3(P.x - 6000)} y={f3(top - 6000)} width={12000} height={6000} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <path d={d} fill="none" stroke={`url(#${id}a)`} strokeWidth={f3(W)} />
        <path d={d} fill="none" stroke={COLOR.amberHot} strokeOpacity={0.9} strokeWidth={f3(hot)} transform={`translate(${f3(-0.34 * W)} ${f3(-0.34 * W)})`} />
      </g>
    </g>
  );
};

/** The amber light in a slot: runs out from the slot's centre, a fixed bloom. */
const SlotLight: React.FC<{ id: string; x: number; top: number; size: number; t: number; k: number; band: [number, number]; angle?: number; cx?: number; cy?: number }> = ({ id, x, top, size, t, k, band, angle = 0, cx = 0, cy = 0 }) => {
  if (t <= 0.002) return null;
  const w = TILE.slotW * size * t;
  const h = TILE.slotH * size;
  return (
    <g style={{ filter: bloomFilter(k) }} transform={angle ? `rotate(${fx(angle)} ${fx(cx)} ${fx(cy)})` : undefined}>
      <defs>
        <AmberGradient id={`${id}a`} y0={band[0]} y1={band[1]} />
      </defs>
      <path d={rectPath(x - w / 2, top, w, h, h / 2)} fill={`url(#${id}a)`} />
      <path d={`M${f3(x - w / 2 + h / 2)} ${f3(top + EDGE.HOT / k / 2)}H${f3(x + w / 2 - h / 2)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
    </g>
  );
};

const AIDoesAIResearch: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const band = amberBandFor(cam);
  const k = cam.k;
  const u = camU(f);
  // the light pool follows the newest tile
  const pool = {
    x: u < 0.5 ? lerp(TILES[0].x, TILES[1].x, u * 2) : lerp(TILES[1].x, TILES[2].x, u * 2 - 1),
    y: u < 0.5 ? lerp(TILES[0].y, TILES[1].y, u * 2) : lerp(TILES[1].y, TILES[2].y, u * 2 - 1),
  };
  const sheets = CHAINS.map((c) => sheetAt(c, f));

  /** One sheet's layers under its parent's face: the link, its ground shadow, and (in the slot) its clipped body. */
  const under = (i: number) => {
    const c = CHAINS[i];
    const st = sheets[i];
    if (f < c.fFeed) return null;
    const P = TILES[c.parent];
    const landed = f >= c.fLand;
    const inSlot = f < c.fClear;
    const top = topOf(P);
    return (
      <g>
        <Link id={`l${i}`} parent={c.parent} st={st} k={k} band={band} />
        {landed ? null : (
          <>
            <g transform={sheetTf(st)}>
              <StoutShadow parts={[{ d: sheetPath(st) }]} s={st.s} lift={st.lift} contact={st.lift < 0.999 && !inSlot ? { x: st.x, y: st.y + st.h / 2, w: st.w } : null} />
            </g>
            {inSlot ? (
              <g>
                <defs>
                  <clipPath id={`m${i}`}>
                    <rect x={f3(P.x - P.size)} y={f3(top - 2 * P.size)} width={f3(2 * P.size)} height={f3(2 * P.size)} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#m${i})`}>
                  <SheetBody id={`s${i}`} st={st} k={k} />
                </g>
              </g>
            ) : null}
          </>
        )}
      </g>
    );
  };
  /** A travelling sheet's layers over its parent's face: its shadow on that face (ramped in as it leaves), its body. */
  const over = (i: number) => {
    const c = CHAINS[i];
    const st = sheets[i];
    if (f < c.fClear || f >= c.fLand) return null;
    const P = TILES[c.parent];
    const onFace = smoothstep((f - c.fClear) / 6);
    return (
      <g>
        <defs>
          <clipPath id={`fc${i}`}>
            <path d={rectPath(P.x - P.size / 2, topOf(P), P.size, P.size, TILE.radius * P.size)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#fc${i})`}>
          <g transform={sheetTf(st)}>
            <StoutShadow parts={[{ d: sheetPath(st) }]} s={st.s} lift={st.lift} strength={onFace} />
          </g>
        </g>
        <SheetBody id={`s${i}`} st={st} k={k} />
      </g>
    );
  };
  const tileLight = (i: number) => {
    // T1's slot is lit from f0; a new tile's slot lights once the link has reached it
    if (i === 0) return 1;
    const c = CHAINS[i - 1];
    return smoothstep((f - (c.slit[0] + 3)) / (c.slit[1] + 2 - c.slit[0]));
  };
  const dim1 = 0.42 * smoothstep((f - 30) / 28);
  const dim2 = 0.14 * smoothstep((f - 50) / 14);
  const t2Landed = f >= CHAINS[0].fLand;
  const light1 = tileLight(1);
  const light2 = tileLight(2);
  const st1 = sheets[0];
  const st2 = sheets[1];
  return (
    <StoutStage S={f} cam={cam} rest={REST} pool={pool}>
      {/* T1 */}
      <OpenAISlotTile x={TILES[0].x} floor={TILES[0].y + SIZE[0] / 2} k={k} size={SIZE[0]} s={shadowS(SIZE[0])} dim={dim1}>
        {under(0)}
      </OpenAISlotTile>
      <SlotLight id="sl0" x={TILES[0].x} top={topOf(TILES[0])} size={SIZE[0]} t={1} k={k} band={band} />
      {over(0)}
      {!t2Landed ? <SlotLight id="sl1m" x={st1.x} top={st1.y - st1.h / 2} size={st1.childSize} t={light1 * (st1.w / st1.childSize)} k={k} band={band} angle={st1.angle} cx={st1.x} cy={st1.y} /> : null}
      {/* T2 */}
      {t2Landed ? (
        <>
          <OpenAISlotTile x={TILES[1].x} floor={TILES[1].y + SIZE[1] / 2} k={k} size={SIZE[1]} s={shadowS(SIZE[1])} dim={dim2}>
            {under(1)}
          </OpenAISlotTile>
          <SlotLight id="sl1" x={TILES[1].x} top={topOf(TILES[1])} size={SIZE[1]} t={light1} k={k} band={band} />
        </>
      ) : null}
      {over(1)}
      {/* T3's slot begins to light as the slot ends */}
      {f >= CHAINS[1].fClear ? <SlotLight id="sl2m" x={st2.x} top={st2.y - st2.h / 2} size={st2.childSize} t={light2 * (st2.w / st2.childSize)} k={k} band={band} angle={st2.angle} cx={st2.x} cy={st2.y} /> : null}
    </StoutStage>
  );
};

export default AIDoesAIResearch;
