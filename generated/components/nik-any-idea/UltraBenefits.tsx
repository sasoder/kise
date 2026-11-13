// ---------------------------------------------------------------------------
// UltraBenefits (nik-any-idea, cut 30). Cheeky Pint style, the stout board (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 61 frames. Palette B1 (the stoutShared default; never pass palette "stout").
//
// CHECK LINE: "Ultra comes loaded with lots of extra perks: lounges, insurance, subscriptions, travel data and more."
//
// THE LINE (Nik Storonsky): "then it gives you additional, a lot of additional benefits."
// WORD -> FRAME: then 3 · it 6 · gives 9 · you 14 · additional 16 · a 29 · lot 34 · of 37 · additional 40 · benefits 47.
// DURATION: the slot 30.405 -> 32.950 s = 2.545 s x 23.976 = 61 frames (f0..f60).
//
// THE MOTION: the platinum Ultra card of cut 21 (ultraCards.tsx, ULTRA_B_END: same card, size, tilt and amber edge
// glow) sits large and centred. On "gives" (f9) cream perk tiles (~124 px, each turned a few degrees outward as if
// on a ray from below the card, so the arch radiates from it) slide OUT FROM BEHIND it: the first wave of six
// (lounge, flights, insurance, subscriptions, travel data, points) goes up out of the card's top edge to the top
// row of an arch, centre first; its two end tiles slip out of the card's sides and curve up (landing f26-36). On
// "a lot of" a second, larger wave of seven (out f24-33.5) fills the arch's inner row (its ends out of the card's
// sides) and one leg beside each of the card's sides, the far row filled first so nothing passes over a seated
// tile; all landed by "benefits" (f47). The camera eases back from the card (k 2.66 -> 2.09 by ~f36, then a creep
// to ~2.07) to take the arch in while the card stays the hero (~650 px wide, centre ~y 818). Room: >= 60 px from
// the frame's sides, >= 27 px between seated tiles, >= 21 px to the card. To f60 the tiles bob gently, the card's
// tilt and sheen creep. No click: the amber glow is already on (cut 21's payoff).
//   Cause chain: each tile is wholly hidden behind the card until it departs (checked against the card's outline),
//   and it emerges across the card's edge; the outer row lands before the inner tile under it leaves the card.
// AMBER = what makes an idea work / gets backed: the Ultra card's edge glow. Cream = the perks; ink = their icons.
//
// SOURCES: Revolut's Ultra plan pages (revolut.com, Ultra): unlimited airport lounge access, travel insurance
// incl. cancel-for-any-reason cover, partner subscriptions bundled in, a global data eSIM allowance, points on
// spending, the platinum-plated card. Icons are generic (no partner logos), Lucide geometry (ISC) inlined below,
// stroked at the kit's GLYPH_STROKE weight (museShared). No prices, no numbers on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, EDGE, ALPHA, StoutStage, clamp01, lerp, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { GLYPH_FILL, GLYPH_STROKE, TILE, UnionShadow, makeClockCam, restToRest, toneFoot, toneTop, travel } from "../kits/cheeky-pint/museShared";
import { ULTRA_B_END, UltraCard, cardH, type Tilt } from "./ultraCards";

export const FPS = 24000 / 1001;
export const DURATION = 61;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();

// --- the card (world px) -----------------------------------------------------------------------------------
export const CARD_X = 540;
export const CARD_Y = 960;
export const CARD_W = ULTRA_B_END.card.w; // 320
const CARD_HH = cardH(CARD_W) / 2; // 100.9
/** Cut 21's last tilt, creeping a little flatter (the sheen slides with it). */
export const tiltAt = (f: number): Tilt => {
  const e = smoothstep((f + 10) / 90);
  const b = ULTRA_B_END.card.tilt;
  return { rx: lerp(b.rx, 0.12, e), ry: lerp(b.ry, -0.2, e), rz: b.rz };
};

// --- the camera (look = the frame's centre) --------------------------------------------------------------------
// Opens at cut 21's last scale (the card ~836 px wide, centred ~y 780); eases back about the card (whose screen
// centre drifts to ~y 818) so the arch's legs are in frame by the time the outer tiles reach them; then a creep.
export const K0 = ULTRA_B_END.cam.k; // 2.7027
const K1 = 2.09;
const K_END = 2.03;
/** The scale the arch is designed at (the camera's k near the end): the card ~660 px wide. */
export const K_DESIGN = 2.07;
const LOOK = { x: CARD_X, y: CARD_Y + (960 - 780) / K0 };
const LOOK1_Y = CARD_Y + (960 - 818) / K1;
export const CAM = makeClockCam(
  { ...LOOK, k: K0 },
  [
    { f0: -10, f1: 32, dy: LOOK1_Y - LOOK.y, k: K1 },
    { f0: 30, f1: 96, dy: 2, k: K_END },
  ],
  DURATION,
);

// --- the arch of perk tiles --------------------------------------------------------------------------------------
// Designed in SCREEN px at K_DESIGN, relative to the card's centre (card ~660 x 416 px, top edge ~-208), then
// stored in world px. Two rows over the card's top edge, each bowed up in the middle (TOP = the first wave, six;
// INNER under it, five, on the gaps of the row above) and one tile beside each of the card's sides (the legs).
// >= 60 px from the frame's sides, >= 20 px between seated tiles and from the card. Every tile turns a few degrees
// outward, as if on a ray from a point below the card (FAN), so the arch radiates from the card.
const TILE_PX = 124;
export const T = TILE_PX / K_DESIGN; // ~59.9 world
const FAN = { oy: 600, share: 0.3 } as const; // the rays' origin (px below the card's centre); the share of a ray's angle a tile takes
// capped: the legs stand beside the card's sides, where a bigger turn would push a corner toward the frame edge
const FAN_MAX = (4.5 * Math.PI) / 180;
const fanRot = (x: number, y: number) => Math.max(-FAN_MAX, Math.min(FAN_MAX, FAN.share * Math.atan2(x, FAN.oy - y)));

export type GlyphId =
  | "lounge"
  | "plane"
  | "shield"
  | "subs"
  | "globe"
  | "star"
  | "headphones"
  | "ticket"
  | "luggage"
  | "gift"
  | "gem"
  | "lock"
  | "briefcase";

type Slot = {
  x: number;
  y: number;
  rot: number;
  glyph: GlyphId;
  depart: number;
  dur: number;
  start: { x: number; y: number };
  lead: number;
};
// the interior a hidden tile may wait in (its whole square inside the card, a margin for the tilt)
const IN_X = (CARD_W / 2) * 0.95 - T / 2 - 6;
const IN_Y = CARD_HH * 0.95 - T / 2 - 6;
const clampIn = (v: number, m: number) => Math.max(-m, Math.min(m, v));
const CORNER_Y = -20;
const CORNER_LEAD = 0.45;
// "top": out of the card's top edge, straight up its column; "corner": out of the card's side, then curving up
// to an outer column (the horizontal runs ahead, so it clears the next column's lane); "side": out of the side.
const slot = (px: number, py: number, glyph: GlyphId, depart: number, dur: number, from: "top" | "corner" | "side"): Slot => {
  const x = px / K_DESIGN;
  const y = py / K_DESIGN;
  return {
    x,
    y,
    // the legs stand right beside the card's sides: a smaller turn keeps their corners off the card and the frame edge
    rot: from === "side" ? Math.sign(px) * Math.min(Math.abs(fanRot(px, py)), LEG_ROT) : fanRot(px, py),
    glyph,
    depart,
    dur,
    start:
      from === "top"
        ? { x: clampIn(x * 0.9, IN_X), y: -IN_Y }
        : from === "corner"
          ? { x: Math.sign(x) * IN_X, y: CORNER_Y }
          : { x: Math.sign(x) * IN_X, y: clampIn(y, IN_Y) },
    lead: from === "corner" ? CORNER_LEAD : 0,
  };
};
// the first wave (the top row), centre out: departs on "gives" (f9)
const TOP = { x: [-385, -231, -77, 77, 231, 385], y: [-462, -480, -490, -490, -480, -462] };
const TOP_GLYPHS: GlyphId[] = ["lounge", "plane", "shield", "subs", "globe", "star"];
const TOP_DEPART = [18, 12.5, 9, 10, 13.5, 19];
// the second wave (the inner row, then the legs): "a lot of" (f29-40)
const INNER = { x: [-308, -154, 0, 154, 308], y: [-312, -326, -332, -326, -312] };
const INNER_GLYPHS: GlyphId[] = ["headphones", "ticket", "luggage", "gift", "gem"];
const INNER_DEPART = [28, 26, 24, 25, 27];
const LEG = { x: 410, y: -110 };
const LEG_ROT = (3 * Math.PI) / 180;
export const SLOTS: Slot[] = [
  ...TOP.x.map((x, i) => slot(x, TOP.y[i], TOP_GLYPHS[i], TOP_DEPART[i], 17, i === 0 || i === 5 ? "corner" : "top")),
  ...INNER.x.map((x, i) => slot(x, INNER.y[i], INNER_GLYPHS[i], INNER_DEPART[i], 13, i === 0 || i === 4 ? "corner" : "top")),
  slot(-LEG.x, LEG.y, "lock", 33, 13.5, "side"),
  slot(LEG.x, LEG.y, "briefcase", 33.5, 13.5, "side"),
];

// --- a tile's state at frame f ----------------------------------------------------------------------------------
const HOVER = 0.3; // a seated tile hovers a little (the bob reads as a hover, not a slide)
const BOB = { amp: 1.3, period: 46, ramp: 12 } as const;
export const tileAt = (s: Slot, i: number, f: number) => {
  const a = { x: CARD_X + s.start.x, y: CARD_Y + s.start.y };
  const b = { x: CARD_X + s.x, y: CARD_Y + s.y };
  const m0 = travel(a, b, f, s.depart, s.depart + s.dur, {
    p: 2.5,
    settleFrom: 0.62,
  });
  // a corner tile's horizontal runs ahead of its vertical (the same rest-to-rest curve, compressed)
  const m =
    s.lead > 0
      ? {
          ...m0,
          x: lerp(a.x, b.x, restToRest(clamp01(m0.u * (1 + s.lead)), 2.5)),
        }
      : m0;
  const land = s.depart + s.dur;
  const since = f - land;
  // the bob starts at its rest phase on landing and grows in; each tile its own phase direction
  const bob = since > 0 ? BOB.amp * smoothstep(since / BOB.ramp) * Math.sin((2 * Math.PI * since) / BOB.period) * (i % 2 ? 1 : -1) : 0;
  // the outward turn grows with the travel (square while hidden behind the card, turned when seated)
  const rot = s.rot * restToRest(m0.u, 2.5);
  return {
    x: m.x,
    y: m.y + bob,
    rot,
    lift: lerp(HOVER, 1, m.lift) - 0.08 * (bob / BOB.amp),
    out: f >= s.depart,
    landed: f >= land,
    u: m.u,
  };
};

// --- icons: Lucide geometry (24 box), stroked at the kit's one weight -------------------------------------------
type GEl = { d: string; fill?: boolean } | { c: [number, number, number]; fill?: boolean };
const RECT = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1-${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1-${r}-${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r}-${r}Z`;
const GLYPHS: Record<GlyphId, { els: GEl[]; dx?: number; dy?: number }> = {
  // Lucide "armchair": the airport lounge
  lounge: {
    els: [
      { d: "M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" },
      {
        d: "M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z",
      },
      { d: "M5 18v2" },
      { d: "M19 18v2" },
    ],
  },
  // Lucide "plane"
  plane: {
    els: [
      {
        d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
      },
    ],
  },
  // Lucide "shield-check": insurance
  shield: {
    els: [
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      },
      { d: "m9 12 2 2 4-4" },
    ],
  },
  // Lucide "gallery-vertical-end" with a play mark: stacked subscriptions
  subs: {
    els: [{ d: "M7 2h10" }, { d: "M5 6h14" }, { d: RECT(3, 10, 18, 12, 2) }, { d: "M10.2 13.4v5.2l4.3-2.6Z", fill: true }],
  },
  // Lucide "globe": data anywhere (the eSIM)
  globe: {
    els: [{ c: [12, 12, 10] }, { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }, { d: "M2 12h20" }],
  },
  // Lucide "star", solid: points
  star: {
    els: [
      {
        d: "M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95Z",
        fill: true,
      },
    ],
  },
  // Lucide "headphones"
  headphones: {
    els: [
      {
        d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3",
      },
    ],
  },
  // Lucide "ticket"
  ticket: {
    els: [
      {
        d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",
      },
      { d: "M13 5v2" },
      { d: "M13 17v2" },
      { d: "M13 11v2" },
    ],
  },
  // Lucide "luggage"
  luggage: {
    els: [
      {
        d: "M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2",
      },
      { d: "M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" },
      { d: "M10 20h4" },
      { c: [16, 20, 2] },
      { c: [8, 20, 2] },
    ],
  },
  // Lucide "gift"
  gift: {
    els: [
      {
        d: "M4 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z",
      },
      { d: "M12 8v13" },
      { d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" },
      {
        d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",
      },
    ],
  },
  // Lucide "gem"
  gem: {
    els: [{ d: "M6 3h12l4 6-10 13L2 9Z" }, { d: "M11 3 8 9l4 13 4-13-3-6" }, { d: "M2 9h20" }],
  },
  // Lucide "lock"
  lock: {
    els: [{ d: RECT(3, 11, 18, 11, 2) }, { d: "M7 11V7a5 5 0 0 1 10 0v4" }],
  },
  // Lucide "briefcase": co-working
  briefcase: {
    els: [{ d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" }, { d: RECT(2, 6, 20, 14, 2) }],
  },
};
/** A glyph centred on (cx, cy) in a tile of `size` (GlyphMark's optical size and stroke rule). */
const Glyph: React.FC<{
  id: GlyphId;
  cx: number;
  cy: number;
  size: number;
}> = ({ id, cx, cy, size }) => {
  const g = GLYPHS[id];
  const sc = (size * GLYPH_FILL) / 20;
  const sw = f3((GLYPH_STROKE * size) / TILE / sc);
  return (
    <g
      transform={`translate(${fx(cx - (12 - (g.dx ?? 0)) * sc)} ${fx(cy - (12 - (g.dy ?? 0)) * sc)}) scale(${fx(sc)})`}
      fill="none"
      stroke={COLOR.inkDark}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {g.els.map((e, i) =>
        "c" in e ? (
          <circle key={i} cx={e.c[0]} cy={e.c[1]} r={e.c[2]} fill={e.fill ? COLOR.inkDark : "none"} />
        ) : (
          <path key={i} d={e.d} fill={e.fill ? COLOR.inkDark : "none"} />
        ),
      )}
    </g>
  );
};

/** One perk tile: a cream card square (the kit's tile: tone gradient, lit top edge), its icon, its ONE shadow.
 *  `rot` (radians) turns the tile about its centre; its shadow turns with it and keeps the light's offset. */
const PerkTile: React.FC<{
  x: number;
  y: number;
  rot: number;
  k: number;
  glyph: GlyphId;
  lift: number;
  id: string;
}> = ({ x, y, rot, k, glyph, lift, id }) => {
  const tf = `rotate(${f3((rot * 180) / Math.PI)} ${fx(x)} ${fx(y)})`;
  const s = T / TILE;
  const x0 = x - T / 2;
  const y0 = y - T / 2;
  const r = 4 * s;
  const d = rectPath(x0, y0, T, T, r);
  const ey = y0 + EDGE.CREAM / k / 2;
  return (
    <g>
      <UnionShadow sil={[{ d, tf }]} s={s} elevation="rest" lift={clamp01(lift)} />
      <g transform={tf}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + T)}>
            <stop offset="0" stopColor={toneTop(0)} />
            <stop offset="1" stopColor={toneFoot(0)} />
          </linearGradient>
        </defs>
        <path d={d} fill={`url(#${id})`} />
        <path d={`M${f3(x0 + r)} ${f3(ey)}H${f3(x0 + T - r)}`} stroke={COLOR.edge} strokeOpacity={f3(ALPHA.edge)} strokeWidth={f3(EDGE.CREAM / k)} />
        <Glyph id={glyph} cx={x} cy={y} size={T} />
      </g>
    </g>
  );
};

const UltraBenefits: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const tiles = SLOTS.map((s, i) => ({ s, i, st: tileAt(s, i, S) }));
  // seated first, then those in flight (the later departures on top); all of them under the card
  const order = [...tiles].sort((a, b) => Number(a.st.landed === false) - Number(b.st.landed === false) || a.s.depart - b.s.depart);
  const fan = smoothstep((S - 8) / 40);
  const pool = {
    x: CARD_X,
    y: lerp(CARD_Y, CARD_Y - 70, fan),
    strength: lerp(ULTRA_B_END.pool.strength, 1.6, fan),
  };
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={pool}>
      {order.map(({ s, i, st }) => (
        <PerkTile key={i} x={st.x} y={st.y} rot={st.rot} k={k} glyph={s.glyph} lift={st.lift} id={`ub-t${i}`} />
      ))}
      <UltraCard
        x={CARD_X}
        y={CARD_Y}
        w={CARD_W}
        k={k}
        tilt={tiltAt(S)}
        glow={ULTRA_B_END.card.glow}
        elevation={ULTRA_B_END.card.elevation}
        lift={ULTRA_B_END.card.lift}
        sheen={ULTRA_B_END.card.sheen + 0.0035 * S}
      />
    </StoutStage>
  );
};

export default UltraBenefits;
