// crossSellParts — the world of CrossSellTheCustomer (nik-trend-friend, cut 34): one customer tile at the hub,
// eight Revolut products seated round it on cream stems. Cheeky Pint stout board, palette B1 (stoutShared),
// museShared shadows and motion helpers. Only this cut reads it.
//
// THE WORLD (world px = screen px at the resolved camera k ~1; up is negative y). The ring is a tall ellipse
// with a hole where the captions sit: three products across the top arc, one each side at the customer's
// height, three across the bottom arc; every seated tile wholly above screen y 1070 or wholly below 1470.
// Amber = traction: the revenue a product brings in from this one customer (COMMON.md).
import React, { useId } from "react";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { ALPHA, AmberGradient, COLOR, EDGE, LightSweep, bloomFilter, clamp01, lerp, mixHex, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { GLYPH_FILL, GLYPH_STROKE, KNOCK, LIFT_DY, TILE, UnionShadow, bustPaths, makeClockCam, travel, type SilItem } from "../kits/cheeky-pint/museShared";
import { REVOLUT_R_BOX, REVOLUT_R_D } from "./revolutMark";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `cs${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
type Rect = { x0: number; y0: number; x1: number; y1: number };

// ===========================================================================
// LAYOUT (world px)
// ===========================================================================
/** The customer: a square cream card, the hub. */
export const HUB = { x: 540, y: 900, T: 300 } as const;
export const HUB_RECT: Rect = { x0: HUB.x - HUB.T / 2, y0: HUB.y - HUB.T / 2, x1: HUB.x + HUB.T / 2, y1: HUB.y + HUB.T / 2 };
/** The ink bust's height as a share of the hub tile (a touch over PersonTile's optical 0.706: the hub is the subject). */
export const HUB_BUST = 0.72;
/** A product tile (square). */
export const PT = 210;
/** The Revolut card: bank-card proportions (85.6 x 54). */
export const CARD_W = 260;
export const CARD_H = (CARD_W * 54) / 85.6; // 164.0
/** The amber band at a product's foot (share of its height). */
export const BAND = 0.2;
/** The cream stem: world width. */
export const STEM_W = 7;

export type GlyphId = "exchange" | "stocks" | "crypto" | "savings" | "insurance" | "esim" | "stays";
export type Kind = "card" | GlyphId;
export type Seat = {
  kind: Kind;
  /** seat centre */
  x: number;
  y: number;
  w: number;
  h: number;
  /** start centre: wholly behind the hub */
  sx: number;
  sy: number;
  /** travel window: leaves f0, seats (contact) f1 */
  f0: number;
  f1: number;
  /** museShared travel's riseLead: the vertical runs ahead, so a diagonal mover clears the side seats' corners */
  lead: number;
  /** optional waypoints for a path that must thread between seated tiles (rounded, walked by arc length) */
  via?: [number, number][];
};
/** How far a start may sit off the hub's centre and stay wholly under it (minus a margin for the lift). */
const startFor = (x: number, y: number, w: number, h: number) => {
  const dx = x - HUB.x;
  const dy = y - HUB.y;
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const sxMax = (HUB.T - w) / 2 - 6;
  const syMax = (HUB.T - h) / 2 - 18;
  const t = Math.min(Math.abs(ux) > 1e-9 ? sxMax / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-9 ? syMax / Math.abs(uy) : Infinity);
  return { sx: HUB.x + ux * t, sy: HUB.y + uy * t };
};
const seat = (kind: Kind, x: number, y: number, f0: number, f1: number, lead = 0, via?: [number, number][]): Seat => {
  const w = kind === "card" ? CARD_W : PT;
  const h = kind === "card" ? CARD_H : PT;
  return { kind, x, y, w, h, ...startFor(x, y, w, h), f0, f1, lead, via };
};
/** Counter-clockwise from the card (REV 1: the lower half fills first), at an even seating cadence of 11
 *  frames after the card. The product order is unchanged; the seats are the same eight positions. */
export const SEATS: Seat[] = [
  seat("card", 205, 900, -16, 40), // 1 the Revolut card, left, seated before "Revolut" (f42)
  seat("exchange", 245, 1590, 26, 72, 0.15), // 2 bottom-left
  seat("stocks", 540, 1640, 38, 83), // 3 bottom
  seat("crypto", 835, 1590, 54, 94), // 4 bottom-right
  seat("savings", 875, 900, 76, 105), // 5 right
  seat("insurance", 835, 565, 94, 116, 0.4), // 6 top-right
  seat("esim", 540, 450, 101, 127), // 7 top
  seat("stays", 245, 565, 112, 138, 0, [[505, 686], [330, 686]]), // 8 top-left
];
export const seatRect = (s: Seat, x = s.x, y = s.y): Rect => ({ x0: x - s.w / 2, y0: y - s.h / 2, x1: x + s.w / 2, y1: y + s.h / 2 });

/** Chaikin-rounded polyline start -> waypoints -> seat (cached per seat), and the point at arc fraction e. */
const PATHS = new Map<Seat, { pts: [number, number][]; cum: number[] }>();
const pathPoint = (s: Seat, e: number): [number, number] => {
  let c = PATHS.get(s);
  if (!c) {
    let pts: [number, number][] = [[s.sx, s.sy], ...(s.via ?? []), [s.x, s.y]];
    for (let it = 0; it < 3; it++) {
      const n: [number, number][] = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [a, b] = [pts[i], pts[i + 1]];
        n.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
      }
      n.push(pts[pts.length - 1]);
      pts = n;
    }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    c = { pts, cum };
    PATHS.set(s, c);
  }
  const L = c.cum[c.cum.length - 1] * clamp01(e);
  let i = 1;
  while (i < c.cum.length - 1 && c.cum[i] < L) i++;
  const u = (L - c.cum[i - 1]) / Math.max(1e-9, c.cum[i] - c.cum[i - 1]);
  return [lerp(c.pts[i - 1][0], c.pts[i][0], u), lerp(c.pts[i - 1][1], c.pts[i][1], u)];
};
/** Frames an amber step takes (a tone change, eased). */
export const AMBER_F = 10;
/** A product's state on frame f: its centre, its lift, its seat progress, its amber, its share outside the hub. */
export const productAt = (s: Seat, f: number) => {
  const t = travel({ x: s.sx, y: s.sy }, { x: s.x, y: s.y }, f, s.f0, s.f1, { p: 2.5, settleFrom: 0.7, riseLead: s.lead });
  if (s.via) {
    // a threaded path: the same eased progress, walked by arc length along the rounded polyline
    const q = pathPoint(s, (t.x - s.sx) / (s.x - s.sx));
    t.x = q[0];
    t.y = q[1];
  }
  const r = seatRect(s, t.x, t.y);
  // the share of its area outside the hub (its shadow grows with it: a hidden tile casts nothing)
  const ix = Math.max(0, Math.min(r.x1, HUB_RECT.x1) - Math.max(r.x0, HUB_RECT.x0));
  const iy = Math.max(0, Math.min(r.y1, HUB_RECT.y1) - Math.max(r.y0, HUB_RECT.y0));
  const out = 1 - (ix * iy) / (s.w * s.h);
  // amber: from the contact frame f1, derived from the seat (lit when it lands)
  const amber = smoothstep((f - s.f1) / AMBER_F);
  return { x: t.x, y: t.y, lift: t.lift, u: t.u, out, amber, seated: f >= s.f1 };
};
/** The customer's warmth: one step of 1/8 toward amber per seated product. */
export const warmthAt = (f: number) => SEATS.reduce((a, s) => a + smoothstep((f - s.f1) / AMBER_F), 0) / SEATS.length;
/** The one click: a LightSweep across the amber customer. */
export const SWEEP_F = { f0: 148, f1: 162 } as const;

// ===========================================================================
// CAMERA — x and k on the house clock; y derived from k so the hub's lower edge sits at screen y footAt(f, k)
// <= 1060 in every frame (above the caption band 1080). From f20 a tilt comes in: wherever the zoom would push
// the bottom arc's foot past the frame (screen y 1887), the camera tilts down by just that much (the hub rises),
// so the bottom tiles land wholly between 1470 and the frame's foot while the camera is still close in.
// ===========================================================================
export const HUB_FOOT_SY = 1060;
/** The bottom arc's lowest edge below the hub's lower edge (world px): the bottom seat's foot. */
const ARC_FOOT = 1640 + PT / 2 - (HUB.y + HUB.T / 2);
export const footAt = (f: number, k: number) => HUB_FOOT_SY - smoothstep((f - 20) / 40) * Math.max(0, HUB_FOOT_SY - (1887 - ARC_FOOT * k));
const K0 = 2.2;
const CAMXK = makeClockCam(
  { x: 480, y: 0, k: K0 },
  [
    { f0: -24, f1: 150, k: 0.975, warp: 0.72 }, // the one long pull-back
    { f0: -16, f1: 36, dx: -96 }, // lean left with the card
    { f0: 30, f1: 118, dx: 156 }, // then centre the ring as it closes round the right
  ],
  166,
);
export const camAt = (f: number): Cam => {
  const c = CAMXK.at(f);
  return { x: c.x, y: HUB_RECT.y1 - (footAt(f, c.k) - 960) / c.k, k: c.k };
};
export const CAM_REST: Cam = camAt(0);
/** The pool: on the hub, widening its strength a little as the ring grows. */
export const poolAt = (f: number) => ({ x: HUB.x, y: HUB.y + 120 * smoothstep((f - 40) / 100), strength: 1.6 });

// ===========================================================================
// GLYPHS — Lucide grammar (24 box, ink 2..22, round caps and joins), museShared's one weight (GLYPH_STROKE)
// and optical size (GLYPH_FILL). { d, fill } = a solid shape; { c } = a circle.
// ===========================================================================
type GEl = string | { d: string; fill: true } | { c: [number, number, number]; fill?: boolean };
const GLYPHS: Record<GlyphId, { els: GEl[]; dx?: number; dy?: number }> = {
  // Lucide "arrow-left-right": two opposed arrows (currency exchange)
  exchange: { els: ["M8 3 4 7l4 4", "M4 7h16", "m16 21 4-4-4-4", "M20 17H4"] },
  // a candlestick chart (Lucide "chart-candlestick" grammar): the axis, two candles with solid bodies
  stocks: {
    els: [
      "M3 3v16a2 2 0 0 0 2 2h16",
      "M10 6.2v11",
      { d: "M7.6 9.2h4.8v5H7.6Z", fill: true },
      "M17.2 3.4v9.2",
      { d: "M14.8 5.4h4.8v5h-4.8Z", fill: true },
    ],
  },
  // a coin with the bitcoin B: rim, stem, two bowls, the two ticks through top and foot
  crypto: {
    els: [
      { c: [12, 12, 9.7] },
      "M9.4 7.4v9.2",
      "M9.4 7.4h3.4a2.3 2.3 0 0 1 0 4.6H9.4",
      "M9.4 12h3.9a2.3 2.3 0 0 1 0 4.6H9.4",
      "M11.2 5.6v1.8",
      "M11.2 16.6v1.8",
    ],
  },
  // Lucide "piggy-bank" (v0.2xx): body, legs, snout, tail, eye
  savings: {
    els: [
      "M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z",
      "M2 9v1c0 1.1.9 2 2 2h1",
      { c: [16, 10.6, 0.9], fill: true },
    ],
    dx: 0.4,
  },
  // Lucide "shield-check"
  insurance: {
    els: [
      "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      "m8.8 12.2 2.3 2.3 4.3-4.3",
    ],
  },
  // a SIM card: the clipped corner, the contact chip (eSIM / mobile data)
  esim: {
    els: ["M7 2.5h7.2L19 7.3V19.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Z", { d: "M8.6 11h6.8v7H8.6Z", fill: true }],
  },
  // Lucide "bed-double" (stays)
  stays: { els: ["M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8", "M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4", "M12 4v6", "M2 18h20"] },
};
/** A glyph in a square of `size` centred on (cx, cy), at the set's one weight. */
export const ProductGlyph: React.FC<{ id: GlyphId; cx: number; cy: number; size: number; color?: string }> = ({ id, cx, cy, size, color = KNOCK }) => {
  const g = GLYPHS[id];
  const sc = (size * GLYPH_FILL) / 20;
  const sw = f3((GLYPH_STROKE * size) / TILE / sc);
  return (
    <g
      transform={`translate(${fx(cx - (12 - (g.dx ?? 0)) * sc)} ${fx(cy - (12 - (g.dy ?? 0)) * sc)}) scale(${fx(sc)})`}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {g.els.map((e, i) =>
        typeof e === "string" ? (
          <path key={i} d={e} />
        ) : "c" in e ? (
          <circle key={i} cx={e.c[0]} cy={e.c[1]} r={e.c[2]} fill={e.fill ? color : "none"} stroke={e.fill ? "none" : color} />
        ) : (
          <path key={i} d={e.d} fill={color} stroke={color} strokeWidth={f3(Number(sw) * 0.5)} />
        ),
      )}
    </g>
  );
};

// ===========================================================================
// PARTS
// ===========================================================================
/** The hot top edge of an amber body (SCREEN px: 2 px + a 12 px falloff), at opacity `a`. */
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; r: number; id: string; a?: number }> = ({ x, y, w, k, r, id, a = 1 }) => {
  if (a <= 0.002) return null;
  const fall = EDGE.HOT_FALL / k;
  return (
    <g opacity={a < 0.999 ? f3(a) : undefined}>
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

/** The cream stem from the hub's centre to a product's centre (printed on the board: no shadow; under both). */
export const Stem: React.FC<{ x: number; y: number; k: number }> = ({ x, y }) => {
  const L = Math.hypot(x - HUB.x, y - HUB.y);
  if (L < 1) return null;
  return <path d={`M${f3(HUB.x)} ${f3(HUB.y)}L${f3(x)} ${f3(y)}`} stroke={mixHex(COLOR.inkCreamLo, COLOR.inkCream, 0.35)} strokeWidth={STEM_W} strokeLinecap="round" fill="none" />;
};

/**
 * Product — a product tile (or the Revolut card) at centre (x, y): cream card, its glyph (or the R and a chip)
 * in ink, the amber band at its foot lit by `amber` (tone, bloom and hot edge eased together), its one shadow
 * (lifted by `lift`; strength `shadow`). `band` = the frame's amber band (amberBandFor(cam)).
 */
export const Product: React.FC<{ s: Seat; x: number; y: number; k: number; lift: number; amber: number; shadow: number; band: [number, number] }> = ({ s, x, y, k, lift, amber, shadow, band }) => {
  const uid = uidOf(useId());
  const sc = s.h / TILE;
  const dy = LIFT_DY * sc * smoothstep(lift);
  const x0 = x - s.w / 2;
  const y0 = y - s.h / 2 - dy;
  const r = Math.min(4 * (PT / TILE), 10);
  const d = rectPath(x0, y0, s.w, s.h, r);
  const bh = s.h * BAND;
  const by = y0 + s.h - bh;
  const a = clamp01(amber);
  const sil: SilItem[] = [{ d }];
  const eA = ALPHA.edge;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + s.h)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <clipPath id={`${uid}k`}>
          <path d={d} />
        </clipPath>
      </defs>
      <UnionShadow sil={sil} s={sc} elevation="rest" lift={lift} strength={shadow} />
      <path d={d} fill={`url(#${uid}c)`} />
      <path d={`M${f3(x0 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x0 + s.w - r)}`} stroke={COLOR.edge} strokeOpacity={f3(eA)} strokeWidth={f3(EDGE.CREAM / k)} />
      {/* the amber band: a tone change of the card's foot, lit on the contact frame */}
      {a > 0.002 ? (
        <g clipPath={`url(#${uid}k)`}>
          <g opacity={f3(a)} style={{ filter: bloomFilter(k) }}>
            <rect x={f3(x0)} y={f3(by)} width={f3(s.w)} height={f3(bh)} fill={`url(#${uid}a)`} />
          </g>
          <HotEdge x={x0} y={by} w={s.w} k={k} r={0} id={`${uid}h`} a={a} />
        </g>
      ) : null}
      {/* the face, in ink, centred in the card above the band */}
      {s.kind === "card" ? (
        <CardFace x0={x0} y0={y0} w={s.w} h={s.h - bh} />
      ) : (
        <ProductGlyph id={s.kind} cx={x} cy={y0 + (s.h - bh) / 2 + 2} size={s.h * 0.9} />
      )}
    </g>
  );
};

/** The Revolut card's face: the chip at the left, the real R stamped large at the right (ink). */
export const R_H = 104; // the R's height (world px)
const CardFace: React.FC<{ x0: number; y0: number; w: number; h: number }> = ({ x0, y0, w, h }) => {
  const rs = R_H / REVOLUT_R_BOX.h;
  const rw = REVOLUT_R_BOX.w * rs;
  const rx = x0 + w * 0.69 - rw / 2;
  const ry = y0 + h / 2 - R_H / 2 + 2;
  const cw = 46;
  const ch = 36;
  const cx = x0 + 34;
  const cy = y0 + h / 2 - ch / 2 + 2;
  return (
    <g>
      <rect x={f3(cx)} y={f3(cy)} width={cw} height={ch} rx={7} fill={KNOCK} />
      {/* the chip's contact lines, knocked out in cream */}
      <path d={`M${f3(cx + cw * 0.36)} ${f3(cy + 5)}V${f3(cy + ch - 5)}M${f3(cx + 5)} ${f3(cy + ch / 2)}H${f3(cx + cw - 5)}`} stroke={COLOR.cream} strokeWidth={3.2} strokeLinecap="round" />
      <path d={REVOLUT_R_D} fillRule="evenodd" fill={KNOCK} transform={`translate(${fx(rx)} ${fx(ry)}) scale(${fx(rs)})`} />
    </g>
  );
};

/**
 * Customer — the hub: a square card with the ink bust, warming one step toward amber per seated product
 * (`warm` 0..1): its tone runs cream -> the amber band gradient, its bloom and hot edge come up with it.
 */
export const Customer: React.FC<{ k: number; warm: number; band: [number, number]; sweep?: number }> = ({ k, warm, band, sweep = 0 }) => {
  const uid = uidOf(useId());
  const w = clamp01(warm);
  const { x, y, T } = HUB;
  const x0 = x - T / 2;
  const y0 = y - T / 2;
  const r = 10;
  const d = rectPath(x0, y0, T, T, r);
  const bust = bustPaths(x, y + 0.012 * T + 6, HUB_BUST * T, "plain");
  // band colour at the tile's top and foot (world -> the frame's amber band)
  const at = (yy: number) => clamp01((yy - band[0]) / (band[1] - band[0]));
  const top = mixHex(COLOR.cream, mixHex(COLOR.amberTop, COLOR.amberFoot, at(y0)), w);
  const foot = mixHex(COLOR.creamFoot, mixHex(COLOR.amberTop, COLOR.amberFoot, at(y0 + T)), w);
  const bloomA = Math.pow(w, 1.4);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + T)}>
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={foot} />
        </linearGradient>
      </defs>
      <UnionShadow sil={[{ d }]} s={T / TILE} elevation="rest" />
      {bloomA > 0.002 ? (
        <g opacity={f3(bloomA)} style={{ filter: bloomFilter(k) }}>
          <path d={d} fill={top} />
        </g>
      ) : null}
      <path d={d} fill={`url(#${uid}g)`} />
      <path d={`M${f3(x0 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x0 + T - r)}`} stroke={COLOR.edge} strokeOpacity={f3(ALPHA.edge * (1 - w))} strokeWidth={f3(EDGE.CREAM / k)} />
      <HotEdge x={x0} y={y0} w={T} k={k} r={r} id={`${uid}h`} a={smoothstep((w - 0.5) / 0.5)} />
      {/* the click crosses the amber card, under the ink bust (a sweep over ink greys it) */}
      <LightSweep x={x0} y={y0} w={T} h={T} k={k} t={sweep} on="amber" r={r} />
      <g fill={KNOCK}>
        {bust.map((p, i) => (
          <path key={i} d={p} />
        ))}
      </g>
    </g>
  );
};

/** Lerp helper re-exported for the cut. */
export { lerp };
