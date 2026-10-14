import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";
import type { Cam } from "./outgrowShared";
import {
  ALPHA,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_LABEL,
  StoutStage,
  TRACK,
  clamp01,
  lerp,
  rectPath,
  smoothstep,
} from "./stoutShared";
import { AFRAME, CUT1_CAM, CUT1_DURATION, SHIP, SHIP_STATION, Sea, SurveyShip, Wake, cut1CamAt, shipToWorld } from "./droneShipShared";

// ===========================================================================
// SameBigShip — cut 1 of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone" (Will O'Brien,
// Ulysses), in the stout system (stoutShared.tsx) with the clip's ship (droneShipShared.tsx). 1080x1920,
// 23.976 fps, opaque, palette B1. Delivered as 1_SameBigShip.mov.
//
// CHECK LINE: "The Navy, ocean-conservation groups and offshore energy companies all do their ocean work the
// same way: from one big crewed surface ship."
//
// THE LINE: "the same way maritime operations are done for the Navy, for the ocean conservation, for the
// energy folks, is all pretty much the same." (sequence 1.543-7.382; right after it, on camera: "Big,
// expensive surface ship.")
// DURATION: slot 140 f + a 16-frame living tail = 156.
// ONSETS (f): same 0 · way 8 · maritime 18 · operations 27 · are 38 · done 42 · for the 45 · Navy 49 · for
// the 58 · ocean 65 · conservation 68 · for the 86 · energy 92 · folks 98 · is 107 · all 111 · pretty 114 ·
// much 122 · the same 127-130 · (Big 137, after the cut).
//
// ONE MOTION: a big survey ship cruises in from the right, bow first, and comes to station at the middle of
// the frame while the camera eases out from close and low. Three customers arrive on their words (the NAVY
// anchor from the left edge, the CONSERVATION whale tail from the top, the ENERGY offshore turbine from the
// right), each a cream card carrying its glyph and its name, lifted while it travels and settling on landing;
// once each has landed a cream line runs from it down onto the ship's body (Navy -> the bridge roof,
// Conservation -> the funnel top, Energy -> the stern A-frame), so all three end on the one ship: each of
// them uses this ship. On "all" the ship gets the cut's one light sweep; the camera creeps in toward the
// ship through the tail.
//
//   f 0-42    the ship cruises in at a constant speed and slows to a stop (bow wave, wake streaks)
//   f -6-75   the camera eases out from close/low (k 1.3) onto the settled framing (k 1)
//   f 36-51   NAVY from the left edge (lands on "Navy" 49 + 2); its line from f 55 (once landed)
//   f 55-76   CONSERVATION from the top edge (lands by 78); its line from f 80
//   f 82-97   ENERGY from the right edge; its line from f 101 (it reaches the A-frame ~f 112)
//   f 111-125 THE ONE CLICK: the light sweep across the ship on "all"
//   f 104-    the creep in toward the ship (still moving on f 155); bob, pool drift, grain
// No amber (amber = money in this clip), no numbers.
// LOCAL TOKEN: the connector lines are LINE_W = 3.25 screen px (the kit's STROKE tops out at RULE 2, which
// almost disappeared at phone size; director's note, round 1).
// ROUND 2 (blind phone-width review): the names live INSIDE the cards (ink Kräftig caps at CARD.labelPx, world
// px, so each name arrives whole with its card); the settled composition sits 65 px higher (droneShipShared
// CUT1_* framings: waterline at screen y ~1015 settled, ~1018 at the end of the creep).
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 140;
export const TAIL = 16;
export const DURATION = CUT1_DURATION; // 156 = 140 + 16
if (DURATION !== SLOT_FRAMES + TAIL) throw new Error("SameBigShip: DURATION != slot + tail");

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `sb${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- the ship's arrival ----------------------------------------------------------------------------------
const WL = SHIP_STATION.wl;
const STATION = SHIP_STATION.x;
/** It cruises at a constant speed to CRUISE_END, then slows evenly to a stop on STOP (rest to rest at the
 *  end only: a ship comes to station, it does not start from one). On f0 the bow is ~180 px inside the frame. */
const ARRIVE = { cruiseEnd: 16, stop: 42, bow0Screen: 700 } as const;
const BOW0 = (() => {
  const c = cut1CamAt(0);
  return c.x + (ARRIVE.bow0Screen - 540) / c.k;
})();
const V_CRUISE = (BOW0 - STATION) / (ARRIVE.cruiseEnd + (ARRIVE.stop - ARRIVE.cruiseEnd) / 2);
export const bowAt = (f: number) => {
  if (f >= ARRIVE.stop) return STATION;
  const decel = ARRIVE.stop - ARRIVE.cruiseEnd;
  if (f >= ARRIVE.cruiseEnd) return STATION + (V_CRUISE * Math.pow(ARRIVE.stop - f, 2)) / (2 * decel);
  return STATION + (V_CRUISE * decel) / 2 + V_CRUISE * (ARRIVE.cruiseEnd - f);
};
/** The bob grows in as the ship stops (under way it rides steady; at station it bobs). */
const bobAmount = (f: number) => lerp(0.35, 1, smoothstep((f - 30) / 30));

// --- the customers -----------------------------------------------------------------------------------------
/** A customer card (WORLD px; = screen px + (0, 65) at the settled framing): the glyph in its upper part, its
 *  name in ink caps at the foot. 304 wide so CONSERVATION (276 px at 33 px, the kit's +0.06 em) keeps a
 *  14 px margin; three cards + two 32 px gaps leave 52 px each side of the frame. */
const CARD = { w: 304, h: 230, gap: 32, glyph: 150, glyphTop: 20, labelPx: 33, labelFoot: 28 } as const;
const ROW_Y = 445; // the cards' centre line (bottom edge at 560)
const CARD_BOTTOM = ROW_Y + CARD.h / 2;
const GLYPH_STROKE = 2.4; // in the glyph's 24 units (Lucide 2, the kit's sport glyphs 2.6)
type Kind = "navy" | "ocean" | "energy";
type Customer = { kind: Kind; label: string; x: number; from: "left" | "top" | "right"; t0: number; land: number };
const PITCH = CARD.w + CARD.gap;
const CUSTOMERS: Customer[] = [
  { kind: "navy", label: "Navy", x: 540 - PITCH, from: "left", t0: 36, land: 51 },
  { kind: "ocean", label: "Conservation", x: 540, from: "top", t0: 55, land: 76 },
  { kind: "energy", label: "Energy", x: 540 + PITCH, from: "right", t0: 82, land: 97 },
];
/** Where a card enters: just outside the frame edge it comes from, with the camera of its first frame. */
const startOf = (c: Customer) => {
  const cam = cut1CamAt(c.t0);
  if (c.from === "left") return { x: cam.x - 540 / cam.k - CARD.w / 2 - 12 / cam.k, y: ROW_Y };
  if (c.from === "right") return { x: cam.x + 540 / cam.k + CARD.w / 2 + 12 / cam.k, y: ROW_Y };
  return { x: c.x, y: cam.y - 960 / cam.k - CARD.h / 2 - 12 / cam.k };
};
/** A card at frame f: it enters already moving (from off the frame) and slows to land (an even
 *  deceleration: velocity falls linearly to zero); lifted while it travels, settling over its last frames
 *  (settled on land + 3). */
const tileAt = (c: Customer, f: number) => {
  const s = startOf(c);
  const u = clamp01((f - c.t0) / (c.land - c.t0));
  const e = 1 - (1 - u) * (1 - u);
  const settle = smoothstep((f - (c.land - 5)) / 8);
  return { x: lerp(s.x, c.x, e), y: lerp(s.y, ROW_Y, e), lift: 1 - settle, on: f >= c.t0 };
};

// --- the lines: card -> a point on the ship's body, at one steady speed ------------------------------------------
const LINE_V = 28; // world px per frame
/** The connector lines' weight (SCREEN px). The kit has no token this heavy (STROKE.HAIRLINE 1.5, RULE 2):
 *  at RULE the lines all but vanished at 270 px wide (director's note, round 1), so a local constant. */
const LINE_W = 3.25;
/** Where each line lands on the ship (SHIP-LOCAL px), spread bow to stern along its top: Navy on the bridge
 *  roof's fore end, Conservation on the funnel's top, Energy on the stern A-frame's head beam. Each point is
 *  2 px inside the surface: the lines are drawn under the ship, so each one meets its surface cleanly. */
const TARGET: Record<Kind, { x: number; y: number }> = {
  navy: { x: SHIP.BRIDGE.x0t + 10, y: SHIP.BRIDGE.top - 6 + 2 },
  ocean: { x: (SHIP.STACK.x0t + SHIP.STACK.x1t) / 2, y: SHIP.STACK.top + 2 },
  energy: { x: (AFRAME.beam.x0 + AFRAME.beam.x1) / 2, y: AFRAME.beam.y0 + 1 + 2 },
};
/** A line starts under its card's bottom edge (hidden by the card) at its centre. */
const lineStart = (c: Customer) => ({ x: c.x, y: CARD_BOTTOM - 2 });
/** The line's end: its point on the ship (riding the bob). */
const lineEnd = (c: Customer, f: number) => {
  const m = shipToWorld(STATION, WL, f, TARGET[c.kind].x, TARGET[c.kind].y, bobAmount(f));
  const s = lineStart(c);
  return { x: m.x, y: m.y, len: Math.hypot(m.x - s.x, m.y - s.y) };
};
/** A line starts once its card has landed and settled (land + 3) — never a stub under a card in flight. */
const LINE_T0 = (c: Customer) => c.land + 4;
/** For the build's checks (scripts only). */
export const TILE_TRACK = (i: number, f: number) => tileAt(CUSTOMERS[i], f);
export const LINE_DONE = CUSTOMERS.map((c) => LINE_T0(c) + lineEnd(c, 0).len / LINE_V);

// --- the click ----------------------------------------------------------------------------------------------
const SWEEP_F: [number, number] = [111, 125];

// --- the light pool: follows the subject (the ship, then the group's heart) with the camera's damper -----------
const poolTarget = (f: number) => {
  const shipMid = { x: bowAt(f) + SHIP.L / 2, y: WL - 170 };
  const g = smoothstep((f - 46) / 60); // as the customers come, the pool widens its look up toward them
  return { x: lerp(shipMid.x, 540, g), y: lerp(shipMid.y, WL - 300, g) };
};
const POOL: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  let p = poolTarget(-30);
  let v = { x: 0, y: 0 };
  for (let f = -30; f < DURATION + 2; f++) {
    const t = poolTarget(f);
    v = { x: v.x + (t.x - p.x) * CAM_STIFF - v.x * CAM_DAMP, y: v.y + (t.y - p.y) * CAM_STIFF - v.y * CAM_DAMP };
    p = { x: p.x + v.x, y: p.y + v.y };
    if (f >= 0) out.push({ ...p });
  }
  return out;
})();

// ===========================================================================
// THE GLYPHS (24-unit Lucide grammar, ink on cream)
// ===========================================================================
/** Lucide "anchor". */
const Anchor: React.FC = () => (
  <g fill="none">
    <path d="M12 22V8" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    <circle cx="12" cy="5" r="3" />
  </g>
);
/** A whale's tail (flukes) rising out of the water, in Lucide grammar: the flukes a solid ink silhouette. */
const WhaleTail: React.FC = () => (
  <g fill="none">
    <path
      d="M10.8 19.4C11.2 17 11.1 15.2 10.5 13.6C8 12.8 4.4 10.8 2.6 6.2C5.6 7.1 9.1 7.5 12 9.8C14.9 7.5 18.4 7.1 21.4 6.2C19.6 10.8 16 12.8 13.5 13.6C12.9 15.2 12.8 17 13.2 19.4Z"
      fill="currentColor"
    />
    <path d="M2 21.4c1.1 0 1.7-.9 3-.9s1.9.9 3 .9 1.6-.9 2.4-.9" />
    <path d="M13.6 20.5c.8 0 1.3.9 2.4.9s1.7-.9 3-.9 1.9.9 3 .9" />
  </g>
);
/** An offshore wind turbine on a monopile: THE canonical icon, static (round 3: any turn kept landing on
 *  angles that read as an aeroplane or a cross). The hub on top of the tower; three equal, long, thick,
 *  round-capped blades exactly 120 deg apart, one straight UP (the others down-left and down-right); the
 *  tower tapering down into the wave line as its monopile. At the anchor's weight. */
const Turbine: React.FC = () => {
  const H = { x: 12, y: 7.4 };
  const R = 7.1;
  return (
    <g fill="none">
      <path d={`M${H.x - 0.75} ${H.y + 1.2}L${H.x - 1.9} 23.4H${H.x + 1.9}L${H.x + 0.75} ${H.y + 1.2}Z`} fill="currentColor" stroke="none" />
      <path d="M1.4 21.4c1.2 0 1.8-1 3.1-1s1.9 1 3.1 1c.9 0 1.5-.5 2-.8" />
      <path d="M14.4 20.6c.5.3 1.1.8 2 .8 1.2 0 1.8-1 3.1-1s1.9 1 3.1 1" />
      <g strokeWidth={2.5}>
        {[0, 120, 240].map((a) => (
          <path key={a} d={`M${H.x} ${H.y}V${H.y - R}`} transform={`rotate(${a} ${H.x} ${H.y})`} />
        ))}
      </g>
      <circle cx={H.x} cy={H.y} r="2.4" fill="currentColor" stroke="none" />
    </g>
  );
};

/** A customer: a cream card (the stout card: one gradient, the lit top edge, one shadow at its elevation)
 *  carrying its ink glyph and, at its foot, its name in ink Kräftig caps (world px: the name is printed on
 *  the card and arrives with it). (x, y) is the centre, world px. */
const CustomerCard: React.FC<{ c: Customer; x: number; y: number; k: number; lift: number }> = ({ c, x, y, k, lift }) => {
  const uid = uidOf(useId());
  const x0 = x - CARD.w / 2;
  const y0 = y - CARD.h / 2;
  const d = rectPath(x0, y0, CARD.w, CARD.h);
  const g = CARD.glyph;
  const sc = g / 24;
  const fs = CARD.labelPx;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y0 + CARD.h)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={[{ d }]} elevation="rest" lift={lift} contact={{ x, y: y0 + CARD.h, w: CARD.w * 0.86 }} />
      <path d={d} fill={`url(#${uid}c)`} />
      <path d={`M${f2(x0 + 4)} ${f2(y0 + EDGE.CREAM / k / 2)}H${f2(x0 + CARD.w - 4)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
      <g
        transform={`translate(${fx(x - g / 2)} ${fx(y0 + CARD.glyphTop)}) scale(${fx(sc)})`}
        stroke={COLOR.inkDark}
        color={COLOR.inkDark}
        strokeWidth={GLYPH_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {c.kind === "navy" ? <Anchor /> : c.kind === "ocean" ? <WhaleTail /> : <Turbine />}
      </g>
      <text
        x={f2(x + (TRACK.label * fs) / 2)}
        y={f2(y0 + CARD.h - CARD.labelFoot)}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={fs}
        letterSpacing={`${TRACK.label}em`}
        textAnchor="middle"
        fill={COLOR.inkDark}
        style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
      >
        {c.label.toUpperCase()}
      </text>
    </g>
  );
};

const SameBigShip: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam: Cam = cut1CamAt(f);
  const k = cam.k;
  const bow = bowAt(f);
  const pool = POOL[Math.max(0, Math.min(POOL.length - 1, f))];
  return (
    <AbsoluteFill>
      <StoutStage S={f} cam={cam} rest={CUT1_CAM[0]} pool={{ ...pool, strength: lerp(1, 1.5, smoothstep((f - 40) / 70)) }}>
        <Sea wl={WL} k={k} S={f} />
        <Wake f={f} wl={WL} k={k} bowAt={bowAt} vMax={V_CRUISE} />

        {/* the three lines, card -> the ship's body, drawn at one steady speed (under the ship and the cards) */}
        <g stroke={COLOR.inkCream} strokeWidth={f2(LINE_W / k)} strokeLinecap="butt" fill="none">
          {CUSTOMERS.map((c) => {
            const s = lineStart(c);
            const e = lineEnd(c, f);
            const drawn = Math.min(e.len, Math.max(0, (f - LINE_T0(c)) * LINE_V));
            if (drawn <= 0.01) return null;
            const t = drawn / e.len;
            return <line key={c.kind} x1={f2(s.x)} y1={f2(s.y)} x2={f2(lerp(s.x, e.x, t))} y2={f2(lerp(s.y, e.y, t))} />;
          })}
        </g>

        <SurveyShip x={bow} wl={WL} k={k} S={f} bob={bobAmount(f)} sweep={(f - SWEEP_F[0]) / (SWEEP_F[1] - SWEEP_F[0])} />

        {/* the customers: each card carries its glyph and its name */}
        {CUSTOMERS.map((c) => {
          const t = tileAt(c, f);
          if (!t.on) return null;
          return <CustomerCard key={c.kind} c={c} x={t.x} y={t.y} k={k} lift={t.lift} />;
        })}
      </StoutStage>
    </AbsoluteFill>
  );
};

export default SameBigShip;
