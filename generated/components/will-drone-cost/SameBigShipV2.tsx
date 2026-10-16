import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { COLOR, FONT_LABEL, TRACK, clamp01, lerp, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { trackCentred } from "../kits/cheeky-pint/droneShipShared";
import {
  BubbleTrail,
  CUT1_SEA_DURATION,
  CUT1_SEA_GLIDES,
  CUT1_SEA_SETTLED_CAM,
  CUT1_SEA_START_CAM,
  ResearchShip,
  SEA_STATION,
  SHIP_GEO,
  SeaStage,
  SurfaceWake,
  WashLine,
  shipToWorld,
} from "./droneSeaSharedV2";

// ===========================================================================
// SameBigShipV2 — improvement-loop copy of SameBigShip (the delivered cut stays byte-identical in SameBigShip.tsx). Cut 1 of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone" (Will O'Brien,
// Ulysses). 1080x1920, 23.976 fps, opaque. Delivered as 1_SameBigShip.mov.
// RESTYLE (2026-10-15, the user: "pretty good job, however i really like the look we did on the 'hunting
// mines' & 'we've mapped more of mars' videos"): the same idea and timing in the REALISTIC ocean look of the
// sibling Ulysses clips — an over/under split at the waterline (droneSeaShared.tsx on oceanShared.tsx): a
// warm hazy sky and a realistic survey ship above the water, the realistic underwater below it (the hull and
// keel seen through the water, god rays, marine snow, the warm split-tone water grade). The delivered stout
// version is in git (and droneShipShared.tsx, untouched).
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
// ONE MOTION: a big survey ship cruises in from the right, bow first (bow wave, foam astern, the propeller's
// bubbles under water), and comes to station at the middle of the frame, floating on a slow heave and pitch,
// while the camera eases out from close and low. Three customers arrive on their words — cream cards lit by
// the same sun (upper left), with a soft real shadow and a little thickness: the NAVY anchor from the left
// edge, the CONSERVATION whale tail from the top, the ENERGY offshore turbine from the right — each lifted
// while it travels, settling on landing; once each has landed a cream line runs from it down onto the ship
// (Navy -> the bridge roof, Conservation -> the funnel top, Energy -> the stern A-frame): each of them uses
// this ship. On "all" the ship gets the cut's one light sweep; the camera creeps in through the tail.
//
//   f 0-42    the ship cruises in at a constant speed and slows to a stop
//   f -6-75   the camera eases out from close/low (k 1.55) onto the settled framing (k 1, waterline y 1015)
//   f 33-51   NAVY from the left edge; its line from f 55 (once landed)
//   f 52-76   CONSERVATION from the top edge; its line from f 80
//   f 79-97   ENERGY from the right edge; its line from f 101 (it reaches the A-frame ~f 112)
//   f 111-125 THE ONE CLICK: the light sweep across the ship on "all"
//   f 104-    the creep in toward the ship (still moving on f 155); bob, snow, rays, glints, grain
// The underwater half (the caption band) carries nothing readable. No amber (amber = money in this clip).
// V2 ROUND 1 (cold review 6/10: "nothing shows the SAME part"; sync 5): every card is LOWERED from above the
// frame top and lands ON its word (Navy 49, conservation 68, energy 92); each line starts 3 f after its card
// lands and draws in 10 f; the lines are heavier dark ink with a thin cream edge; on "all" (111) the three line
// ends slide along the ship and meet at ONE point, the mast foot on the bridge roof, pulling taut as they come
// and settling on "same" (130); the light sweep is replaced by the low sun's glint travelling the whole ship
// (f118-142, mid-ship on "same"); a slow push-in from f98 so the ship grows toward "Big, expensive surface ship".
// V2 ROUND 2 (cold review 6/10; both reviewers: lines vanish at phone size, the glow reads as an error):
// each line runs STRAIGHT from its card to the masthead from the start (no landing elsewhere and sliding); the
// lines are 7 px dark ink with a cream edge; THE "SAME" BEAT: from f120 the three converging lines pinch into ONE
// thick rope just above the masthead, a small taut overshoot and settle landing on "same" (130); the glint is
// crisp (a warm rim on the top edges and rails, specular streaks on the glass; never a wash); the big radome
// moved forward (droneSeaSharedV2) so the masthead is the ship's clear top; cards narrower and the whole frame
// centred on the ship, the push-in kept to k ~1.09 so cards and stern keep >= 40 px margins; the drops cruise
// and then brake in their last 6 frames, so each card visibly lands ON its word.
// V2 ROUND 3 (6.5/10: the ship looked frozen; the junction read as a stray tick; "same" needed a phone-size
// beat): a livelier float (~3.5 px heave, ~0.45 deg pitch, full from f20), foam lapping along the waterline, the
// rays and snow drifting; the rope is TIED to the ship: a shackle on the masthead, the rope's eye through it, the
// three lines gathered higher up in a banded collar; on "same" a warm light pulse runs down the rope into the
// masthead (f126-130) and the crisp glint spreads out from the mast, fore and aft, as its result (f130-146), with a
// small extra push (~5 %, f118-140); each line starts ON its card's landing frame and draws in 6 frames.
// V2 ROUND 5 (finish pass on r3; r4's towfish routine reverted): the turbine glyph from r4 (nacelle, tapered
// blades); the shackle and eye ride in WITH the ship from its first frame, and the rope + collar extend up out of
// the masthead as the first line arrives (f49-53); card drops of 11 frames braking in the last 3, a small dip and
// settle, light motion blur, a soft contact shadow tightening as each card arrives; a thicker, brighter pulse
// down the rope and a stronger crisp glint on "same".
// (Superseded below: the round-0/1/2 notes on timing/entrances, the cream line, the slide and the sweep/glow.)
// LOCAL TOKEN: the connector lines are LINE_W = 3.25 screen px (the kit's STROKE tops out at RULE 2), cream on
// a thin dark warm casing (LINE_CASE) so they read on the dusk sky and on the bright haze alike.
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 140;
export const TAIL = 16;
export const DURATION = CUT1_SEA_DURATION; // 156 = 140 + 16
if (DURATION !== SLOT_FRAMES + TAIL) throw new Error("SameBigShipV2: DURATION != slot + tail");

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `sb${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- the camera: the delivered ease-out, then (V2) a slow push-in toward the ship from f98 --------------------
/** round 2: centred on the ship (world x 90..1000, centre 545) and a gentler push (k ~1.09 on f155) so the stern
 *  and the cards keep >= 40 px margins */
const CENTRE_X = 545;
const PUSH = { f0: 98, f1: 160, k: 1.04, anchor: { x: CENTRE_X, y: -170 } } as const;
/** round 3: the small extra push on "same" (x1.05 over f118-140), about the ship's upper works */
const PUSH2 = { f0: 118, f1: 140, k: 1.04 * 1.05, anchor: { x: CENTRE_X, y: -210 } } as const;
const CAM_V2 = trackCentred(
  CUT1_SEA_START_CAM,
  [
    CUT1_SEA_GLIDES[0],
    { f0: CUT1_SEA_GLIDES[0].f0, f1: CUT1_SEA_GLIDES[0].f1, dx: CENTRE_X - CUT1_SEA_SETTLED_CAM.x, warp: CUT1_SEA_GLIDES[0].warp },
    { f0: PUSH.f0, f1: PUSH.f1, dy: PUSH.anchor.y + (CUT1_SEA_SETTLED_CAM.y - PUSH.anchor.y) / PUSH.k - CUT1_SEA_SETTLED_CAM.y, k: PUSH.k, warp: 1 },
    { f0: PUSH2.f0, f1: PUSH2.f1, dy: (PUSH2.anchor.y - CUT1_SEA_SETTLED_CAM.y) * (1 - PUSH.k / PUSH2.k), k: PUSH2.k, warp: 1 },
  ],
  CUT1_SEA_DURATION,
  30,
);
export const camAtV2 = (f: number): Cam => CAM_V2[Math.max(0, Math.min(CAM_V2.length - 1, Math.round(f)))];

// --- the ship's arrival (world: the waterline is y 0) -------------------------------------------------------
const STATION = SEA_STATION.x;
/** It cruises at a constant speed to CRUISE_END, then slows evenly to a stop on STOP. On f0 the bow is at
 *  screen x 700. */
const ARRIVE = { cruiseEnd: 16, stop: 42, bow0Screen: 700 } as const;
const BOW0 = (() => {
  const c = camAtV2(0);
  return c.x + (ARRIVE.bow0Screen - 540) / c.k;
})();
const V_CRUISE = (BOW0 - STATION) / (ARRIVE.cruiseEnd + (ARRIVE.stop - ARRIVE.cruiseEnd) / 2);
export const bowAt = (f: number) => {
  if (f >= ARRIVE.stop) return STATION;
  const decel = ARRIVE.stop - ARRIVE.cruiseEnd;
  if (f >= ARRIVE.cruiseEnd) return STATION + (V_CRUISE * Math.pow(ARRIVE.stop - f, 2)) / (2 * decel);
  return STATION + (V_CRUISE * decel) / 2 + V_CRUISE * (ARRIVE.cruiseEnd - f);
};
/** The float grows in as the ship comes off its way (under way it rides steadier). */
const bobAmount = (f: number) => lerp(0.5, 1, smoothstep((f - 8) / 18));

// --- the customers (world px; the settled framing puts screen = world + (-5, 1080)) -------------------------
/** round 2: narrower cards (284) so three of them and their gaps fit inside the pushed-in frame; CONSERVATION
 *  at 31 px is 260 px wide, a 12 px margin each side */
const CARD = { w: 284, h: 230, gap: 22, glyph: 150, glyphTop: 20, labelPx: 31, labelFoot: 29, thick: 5 } as const;
const ROW_Y = -635; // the cards' centre line (bottom edge at -520)
const CARD_BOTTOM = ROW_Y + CARD.h / 2;
const GLYPH_STROKE = 2.4;
type Kind = "navy" | "ocean" | "energy";
type Customer = { kind: Kind; label: string; x: number; t0: number; land: number };
const PITCH = CARD.w + CARD.gap;
/** every card is lowered from above the frame top and lands ON its word: it cruises down and brakes only in
 *  its last BRAKE frames, so the landing reads on the word (not early) */
/** round 5: 11-frame drops braking in the last 3 frames, a small dip and settle, light motion blur */
const DROP = { f: 11, brake: 3, settle: 5, blur: 0.21 } as const;
const CUSTOMERS: Customer[] = [
  { kind: "navy", label: "Navy", x: CENTRE_X - PITCH, t0: 49 - DROP.f, land: 49 },
  { kind: "ocean", label: "Conservation", x: CENTRE_X, t0: 68 - DROP.f, land: 68 },
  { kind: "energy", label: "Energy", x: CENTRE_X + PITCH, t0: 92 - DROP.f, land: 92 },
];
/** just above the frame's top edge (its shadow too), with the camera of its first frame */
const startOf = (c: Customer) => {
  const cam = camAtV2(c.t0);
  return { x: c.x, y: cam.y - 960 / cam.k - CARD.h / 2 - 40 / cam.k };
};
/** distance covered 0..1: a constant speed, then an even brake over the last DROP.brake frames to rest */
const dropE = (tau: number) => {
  const T = DROP.f;
  const B = DROP.brake;
  const v = 1 / (T - B / 2);
  if (tau <= 0) return 0;
  if (tau >= T) return 1;
  if (tau <= T - B) return v * tau;
  const r = T - tau;
  return 1 - (v * r * r) / (2 * B);
};
/** A card at frame f: lowered in at a steady speed, braking hard just before it lands on its word; lifted while
 *  it travels, settled on land + 2. */
const tileAt = (c: Customer, f: number) => {
  const s = startOf(c);
  const e = dropE(f - c.t0);
  const settle = smoothstep((f - (c.land - 2)) / 4);
  const after = f - c.land;
  const dip = after > 0 && after < 4 ? DROP.settle * Math.sin((Math.PI * after) / 4) : 0;
  const y = lerp(s.y, ROW_Y, e) + dip;
  const yPrev = lerp(s.y, ROW_Y, dropE(f - 1 - c.t0));
  return { x: c.x, y, lift: 1 - settle, on: f >= c.t0, speed: Math.abs(y - yPrev), arrive: e };
};

// --- the lines: card -> the masthead, then (on "same") pinched into one rope ---------------------------------
/** round 2: 7 px dark ink with a cream edge (~2 px at 270 wide). SCREEN px; a local token. */
const LINE = { w: 7, edge: 1.4, ink: COLOR.inkDark, cream: COLOR.inkCream, draw: 6, after: 0 } as const;
/** the rope the three gather into: thicker, the same ink and edge */
const ROPE = { w: 13, edge: 1.6, rise: 70, gap: 12 } as const;
/** the hardware (SCREEN px): the shackle on the masthead, the rope's eye through it, the collar gathering the
 *  three lines into the rope */
const HW = { shackle: { w: 18, h: 20, t: 4.5 }, eye: { r: 7.5, t: 4 }, collar: { w: 24, h: 32, band: 1.6 } } as const;
/** the pulse down the rope on "same": collar -> eye f126-130, then a flash at the masthead f130-133 */
const PULSE = { f0: 126, f1: 130, flash: 6, r: 14, trail: 60 } as const;
/** the glint the pulse sets off: spreading fore and aft from the mast, f130-146 */
const GLINT_RING = { f0: 130, f1: 146, v: 52 } as const;
const glintRingAt = (f: number) =>
  f < GLINT_RING.f0 || f > GLINT_RING.f1 ? null : { origin: G.MASTHEAD.x, r: (f - GLINT_RING.f0) * GLINT_RING.v, a: 1 - smoothstep((f - (GLINT_RING.f0 + 4)) / (GLINT_RING.f1 - GLINT_RING.f0 - 4)) };
const G = SHIP_GEO;
/** THE SAME POINT (ship-local): the masthead fitting at the mast's top */
const MAST_PT = { x: G.MASTHEAD.x, y: G.MASTHEAD.y - 2 } as const;
/** the pinch 0..1(+): rises from the masthead from f120, a small taut overshoot at f126, at rest on "same" (130) */
const PINCH = { f0: 120, fOver: 126, f1: 130, over: 1.12 } as const;
const pinchAt = (f: number) => {
  if (f <= PINCH.f0) return 0;
  if (f <= PINCH.fOver) {
    const u = (f - PINCH.f0) / (PINCH.fOver - PINCH.f0);
    return PINCH.over * (1 - Math.pow(1 - u, 2.2));
  }
  if (f <= PINCH.f1) return lerp(PINCH.over, 1, smoothstep((f - PINCH.fOver) / (PINCH.f1 - PINCH.fOver)));
  return 1;
};
const lineStart = (c: Customer) => ({ x: c.x, y: CARD_BOTTOM - 2 });
/** the masthead and the pinch point (world, riding the bob) */
const mastWorld = (f: number) => shipToWorld(bowAt(f), f, MAST_PT.x, MAST_PT.y, bobAmount(f));
/** the rope + collar extend up out of the masthead as the first line arrives (Navy lands f49) */
const ropeGrow = (f: number) => smoothstep((f - CUSTOMERS[0].land) / 4);
/** the junction at frame f (world): the shackle's foot M on the masthead, its bow top, the eye's centre, the
 *  rope from the eye up to the collar, the collar's centre and its top (where the three lines arrive) */
const junctionAt = (f: number, k: number) => {
  const M = mastWorld(f);
  const bowTop = M.y - HW.shackle.h / k;
  const eye = { x: M.x, y: bowTop };
  const ropeBottom = eye.y - HW.eye.r / k;
  const collarC = { x: M.x, y: ropeBottom - ropeGrow(f) * (ROPE.gap / k + HW.collar.h / 2 / k) - ROPE.rise * pinchAt(f) };
  return { M, bowTop, eye, ropeBottom, collarC, collarTop: collarC.y - HW.collar.h / 2 / k, collarBottom: collarC.y + HW.collar.h / 2 / k };
};
/** a line starts LINE.after frames after its card lands and draws in LINE.draw frames (ease-out) */
const LINE_T0 = (c: Customer) => c.land + LINE.after;
const drawnAt = (c: Customer, f: number) => {
  const u = clamp01((f - LINE_T0(c)) / LINE.draw);
  return 1 - Math.pow(1 - u, 2) * (1 - 0.35 * u);
};
/** For the build's checks (scripts only). */
export const TILE_TRACK = (i: number, f: number) => tileAt(CUSTOMERS[i], f);
export const LINE_DONE = CUSTOMERS.map((c) => LINE_T0(c) + LINE.draw);
export const PINCH_TRACK = pinchAt;


// ===========================================================================
// THE GLYPHS (24-unit Lucide grammar, ink on cream)
// ===========================================================================
const Anchor: React.FC = () => (
  <g fill="none">
    <path d="M12 22V8" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    <circle cx="12" cy="5" r="3" />
  </g>
);
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
/** round 4: the canonical static pose with a NACELLE behind the hub and TAPERED (teardrop) blades, so it can't
 *  read as an aeroplane at phone size. */
const Turbine: React.FC = () => {
  const H = { x: 11.4, y: 7.6 };
  const R = 7.8;
  // a blade pointing straight up from the hub: wide at the root, tapering to a point
  const blade = `M${H.x - 1.25} ${H.y - 1.4}C${H.x - 1.5} ${H.y - 4.2} ${H.x - 0.55} ${H.y - 6.6} ${H.x} ${H.y - R}C${H.x + 0.45} ${H.y - 6.8} ${H.x + 1.0} ${H.y - 4.6} ${H.x + 1.25} ${H.y - 1.4}Z`;
  return (
    <g fill="none">
      <path d={`M${H.x - 0.8} ${H.y + 1.2}L${H.x - 1.8} 23.4H${H.x + 1.8}L${H.x + 0.8} ${H.y + 1.2}Z`} fill="currentColor" stroke="none" />
      {/* the nacelle: a box behind the hub, its long side toward us */}
      <path d={`M${H.x} ${H.y - 1.7}H${H.x + 5.4}Q${H.x + 6.6} ${H.y - 1.7} ${H.x + 6.6} ${H.y - 0.5}V${H.y + 0.6}Q${H.x + 6.6} ${H.y + 1.8} ${H.x + 5.4} ${H.y + 1.8}H${H.x}Z`} fill="currentColor" stroke="none" />
      <path d="M1.4 21.4c1.2 0 1.8-1 3.1-1s1.9 1 3.1 1c.9 0 1.5-.5 2-.8" />
      <path d="M13.8 20.6c.5.3 1.1.8 2 .8 1.2 0 1.8-1 3.1-1s1.9 1 3.1 1" />
      <g fill="currentColor" stroke="none">
        {[0, 120, 240].map((a) => (
          <path key={a} d={blade} transform={`rotate(${a} ${H.x} ${H.y})`} />
        ))}
      </g>
      <circle cx={H.x} cy={H.y} r="2.2" fill="currentColor" stroke="none" />
    </g>
  );
};

/** The cards' light: the scene's sun (upper left). A soft real shadow cast down-right onto the sky (it lifts
 *  while the card travels), a little thickness on the shaded edges, the lit top-left. */
const CARD_SHADOW = { rest: { dx: 9, dy: 15, blur: 11, a: 0.34 }, lifted: { dx: 16, dy: 28, blur: 20, a: 0.26 } } as const;
const CustomerCard: React.FC<{ c: Customer; x: number; y: number; k: number; lift: number; blur?: number; arrive?: number }> = ({ c, x, y, k, lift, blur = 0, arrive = 1 }) => {
  const uid = uidOf(useId());
  const x0 = x - CARD.w / 2;
  const y0 = y - CARD.h / 2;
  const d = rectPath(x0, y0, CARD.w, CARD.h, 6);
  const g = CARD.glyph;
  const sc = g / 24;
  const fs = CARD.labelPx;
  const L = clamp01(lift);
  const sh = {
    dx: lerp(CARD_SHADOW.rest.dx, CARD_SHADOW.lifted.dx, L),
    dy: lerp(CARD_SHADOW.rest.dy, CARD_SHADOW.lifted.dy, L),
    blur: lerp(CARD_SHADOW.rest.blur, CARD_SHADOW.lifted.blur, L),
    // the contact shadow grows (darkens and tightens) as the card arrives
    a: lerp(CARD_SHADOW.rest.a, CARD_SHADOW.lifted.a, L) * lerp(0.25, 1, clamp01(arrive)),
  };
  const t = CARD.thick;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1={f2(x0)} y1={f2(y0)} x2={f2(x0 + CARD.w * 0.35)} y2={f2(y0 + CARD.h)}>
          <stop offset="0" stopColor="#FBF6EC" />
          <stop offset="0.55" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      {/* the soft shadow on the sky (the sun is upper left) */}
      <path d={d} fill="#3B2A1C" opacity={f2(sh.a)} transform={`translate(${fx(sh.dx)} ${fx(sh.dy)})`} style={{ filter: `blur(${f2(sh.blur)}px)` }} />
      {blur > 0.3 ? (
        <defs>
          <filter id={`${uid}mb`} x="-5%" y="-40%" width="110%" height="180%">
            <feGaussianBlur stdDeviation={`0 ${f2(blur)}`} />
          </filter>
        </defs>
      ) : null}
      <g filter={blur > 0.3 ? `url(#${uid}mb)` : undefined}>
      {/* the card's thickness: its shaded bottom and right edges */}
      <path d={rectPath(x0 + t * 0.6, y0 + t, CARD.w, CARD.h, 6)} fill="#B8A98F" />
      <path d={d} fill={`url(#${uid}c)`} />
      {/* the lit top edge */}
      <path d={`M${f2(x0 + 6)} ${f2(y0 + 0.9 / k)}H${f2(x0 + CARD.w - 6)}`} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={f2(1.6 / k)} />
      <g transform={`translate(${fx(x - g / 2)} ${fx(y0 + CARD.glyphTop)}) scale(${fx(sc)})`} stroke={COLOR.inkDark} color={COLOR.inkDark} strokeWidth={GLYPH_STROKE} strokeLinecap="round" strokeLinejoin="round">
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
    </g>
  );
};

const SameBigShipV2: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam: Cam = camAtV2(f);
  const k = cam.k;
  const bow = bowAt(f);
  const bob = bobAmount(f);
  const J = junctionAt(f, k);
  const segs = CUSTOMERS.map((c) => {
    const t = drawnAt(c, f);
    if (t <= 0.002) return null;
    const s0 = lineStart(c);
    return { id: c.kind, d: `M${f2(s0.x)} ${f2(s0.y)}L${f2(lerp(s0.x, J.collarC.x, t))} ${f2(lerp(s0.y, J.collarTop + 2 / k, t))}` };
  });
  const grown = ropeGrow(f) > 0.02;
  const rope = `M${f2(J.eye.x)} ${f2(J.ropeBottom)}L${f2(J.collarC.x)} ${f2(J.collarBottom)}`;
  const sw = (v: number) => f2(v / k);
  const sh = HW.shackle;
  const shackle = `M${f2(J.M.x - sh.w / 2 / k)} ${f2(J.M.y)}V${f2(J.bowTop + sh.w / 2 / k)}A${sw(sh.w / 2)} ${sw(sh.w / 2)} 0 0 1 ${f2(J.M.x + sh.w / 2 / k)} ${f2(J.bowTop + sh.w / 2 / k)}V${f2(J.M.y)}`;
  const pin = `M${f2(J.M.x - (sh.w / 2 + 4) / k)} ${f2(J.M.y)}H${f2(J.M.x + (sh.w / 2 + 4) / k)}`;
  // the pulse: from the collar down the rope into the eye, then a flash at the masthead
  const pu = (f - PULSE.f0) / (PULSE.f1 - PULSE.f0);
  const pulse =
    pu >= 0 && pu <= 1 ? { x: J.collarC.x, y: lerp(J.collarBottom, J.eye.y, pu * pu), a: 1 } : f > PULSE.f1 && f < PULSE.f1 + PULSE.flash ? { x: J.M.x, y: J.M.y, a: 1 - (f - PULSE.f1) / PULSE.flash } : null;
  const cw = HW.collar.w / k;
  const ch = HW.collar.h / k;
  const lines = (
    <g strokeLinecap="round" fill="none">
      {/* the cream edges (under), then the ink: the three lines, the rope, the shackle, the eye */}
      <g stroke={LINE.cream} strokeOpacity={0.92}>
        {segs.map((g) => (g ? <path key={g.id} d={g.d} strokeWidth={sw(LINE.w + 2 * LINE.edge)} /> : null))}
        {grown ? <path d={rope} strokeWidth={sw(ROPE.w + 2 * ROPE.edge)} strokeLinecap="butt" /> : null}
        <path d={shackle} strokeWidth={sw(sh.t + 2 * LINE.edge)} />
        <path d={pin} strokeWidth={sw(3.2 + 2 * LINE.edge)} />
        <circle cx={f2(J.eye.x)} cy={f2(J.eye.y)} r={sw(HW.eye.r)} strokeWidth={sw(HW.eye.t + 2 * LINE.edge)} />
      </g>
      <g stroke={LINE.ink}>
        {segs.map((g) => (g ? <path key={g.id} d={g.d} strokeWidth={sw(LINE.w)} /> : null))}
        {grown ? <path d={rope} strokeWidth={sw(ROPE.w)} strokeLinecap="butt" /> : null}
        <path d={shackle} strokeWidth={sw(sh.t)} />
        <path d={pin} strokeWidth={sw(3.2)} />
        <circle cx={f2(J.eye.x)} cy={f2(J.eye.y)} r={sw(HW.eye.r)} strokeWidth={sw(HW.eye.t)} />
      </g>
      {/* the collar: a banded sleeve gathering the three into the rope */}
      {grown ? <rect x={f2(J.collarC.x - cw / 2)} y={f2(J.collarTop)} width={f2(cw)} height={f2(ch)} rx={sw(4)} fill={LINE.ink} stroke={LINE.cream} strokeWidth={sw(LINE.edge)} /> : null}
      {(grown ? [0.3, 0.7] : []).map((u) => (
        <path key={u} d={`M${f2(J.collarC.x - cw / 2 + 2 / k)} ${f2(J.collarTop + ch * u)}H${f2(J.collarC.x + cw / 2 - 2 / k)}`} stroke={LINE.cream} strokeOpacity={0.8} strokeWidth={sw(HW.collar.band)} />
      ))}
      {/* the pulse on "same": warm light running down the rope into the ship */}
      {/* its light along the rope behind it (a short bright streak, visible at phone size) */}
      {pu >= 0 && pu <= 1 ? (
        <path
          d={`M${f2(J.collarC.x)} ${f2(Math.max(J.collarBottom, lerp(J.collarBottom, J.eye.y, pu * pu) - PULSE.trail / k))}L${f2(J.collarC.x)} ${f2(lerp(J.collarBottom, J.eye.y, pu * pu))}`}
          stroke="#FFF1CF"
          strokeWidth={sw(ROPE.w * 0.85)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 ${f2(10 / k)}px rgba(255,236,190,1)) drop-shadow(0 0 ${f2(22 / k)}px rgba(255,226,175,0.8))` }}
        />
      ) : null}
      {pulse ? (
        <circle
          cx={f2(pulse.x)}
          cy={f2(pulse.y)}
          r={sw(PULSE.r * (pulse.a < 1 ? 1 + 1.2 * (1 - pulse.a) : 1))}
          fill="#FFF5DC"
          opacity={f2(pulse.a)}
          style={{ filter: `drop-shadow(0 0 ${f2(9 / k)}px rgba(255,240,205,1)) drop-shadow(0 0 ${f2(26 / k)}px rgba(255,226,175,0.9))` }}
        />
      ) : null}
    </g>
  );
  return (
    <AbsoluteFill>
      <SeaStage
        S={f}
        cam={cam}
        rest={CAM_V2[0]}
        drift={0.7}
        below={
          <>
            <BubbleTrail f={f} bowAt={bowAt} vMax={V_CRUISE} />
            <ResearchShip x={bow} S={f} bob={bob} part="below" k={k} />
          </>
        }
        above={
          <>
            <ResearchShip x={bow} S={f} bob={bob} part="above" k={k} glintRing={glintRingAt(f)} />
            <WashLine x={bow} S={f} k={k} />
            <SurfaceWake f={f} bowAt={bowAt} vMax={V_CRUISE} k={k} />
            {lines}
          </>
        }
        top={CUSTOMERS.map((c) => {
          const t = tileAt(c, f);
          if (!t.on) return null;
          return <CustomerCard key={c.kind} c={c} x={t.x} y={t.y} k={k} lift={t.lift} blur={t.speed * DROP.blur} arrive={t.arrive} />;
        })}
      />
    </AbsoluteFill>
  );
};

export default SameBigShipV2;
