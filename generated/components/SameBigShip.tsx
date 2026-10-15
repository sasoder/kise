import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "./outgrowShared";
import { COLOR, FONT_LABEL, TRACK, clamp01, lerp, rectPath, smoothstep } from "./stoutShared";
import {
  BubbleTrail,
  CUT1_SEA_CAM,
  CUT1_SEA_DURATION,
  ResearchShip,
  SEA_STATION,
  SHIP_PTS,
  SeaStage,
  SurfaceWake,
  cut1SeaCamAt,
  shipToWorld,
} from "./droneSeaShared";

// ===========================================================================
// SameBigShip — cut 1 of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone" (Will O'Brien,
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
// LOCAL TOKEN: the connector lines are LINE_W = 3.25 screen px (the kit's STROKE tops out at RULE 2), cream on
// a thin dark warm casing (LINE_CASE) so they read on the dusk sky and on the bright haze alike.
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 140;
export const TAIL = 16;
export const DURATION = CUT1_SEA_DURATION; // 156 = 140 + 16
if (DURATION !== SLOT_FRAMES + TAIL) throw new Error("SameBigShip: DURATION != slot + tail");

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `sb${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- the ship's arrival (world: the waterline is y 0) -------------------------------------------------------
const STATION = SEA_STATION.x;
/** It cruises at a constant speed to CRUISE_END, then slows evenly to a stop on STOP. On f0 the bow is at
 *  screen x 700. */
const ARRIVE = { cruiseEnd: 16, stop: 42, bow0Screen: 700 } as const;
const BOW0 = (() => {
  const c = cut1SeaCamAt(0);
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
const bobAmount = (f: number) => lerp(0.4, 1, smoothstep((f - 28) / 34));

// --- the customers (world px; the settled framing puts screen = world + (0, 1015)) --------------------------
const CARD = { w: 304, h: 230, gap: 32, glyph: 150, glyphTop: 20, labelPx: 33, labelFoot: 28, thick: 5 } as const;
const ROW_Y = -635; // the cards' centre line (bottom edge at -520: screen y 495 settled)
const CARD_BOTTOM = ROW_Y + CARD.h / 2;
const GLYPH_STROKE = 2.4;
type Kind = "navy" | "ocean" | "energy";
type Customer = { kind: Kind; label: string; x: number; from: "left" | "top" | "right"; t0: number; land: number };
const PITCH = CARD.w + CARD.gap;
const CUSTOMERS: Customer[] = [
  { kind: "navy", label: "Navy", x: 540 - PITCH, from: "left", t0: 33, land: 51 },
  { kind: "ocean", label: "Conservation", x: 540, from: "top", t0: 52, land: 76 },
  { kind: "energy", label: "Energy", x: 540 + PITCH, from: "right", t0: 79, land: 97 },
];
const startOf = (c: Customer) => {
  const cam = cut1SeaCamAt(c.t0);
  if (c.from === "left") return { x: cam.x - 540 / cam.k - CARD.w / 2 - 30 / cam.k, y: ROW_Y };
  if (c.from === "right") return { x: cam.x + 540 / cam.k + CARD.w / 2 + 30 / cam.k, y: ROW_Y };
  return { x: c.x, y: cam.y - 960 / cam.k - CARD.h / 2 - 30 / cam.k };
};
/** A card at frame f: it enters already moving (from off the frame) and slows to land (velocity falling
 *  linearly to zero); lifted while it travels, settled on land + 3. */
const tileAt = (c: Customer, f: number) => {
  const s = startOf(c);
  const u = clamp01((f - c.t0) / (c.land - c.t0));
  const e = 1 - (1 - u) * (1 - u);
  const settle = smoothstep((f - (c.land - 5)) / 8);
  return { x: lerp(s.x, c.x, e), y: lerp(s.y, ROW_Y, e), lift: 1 - settle, on: f >= c.t0 };
};

// --- the lines: card -> a point on the ship, at one steady speed --------------------------------------------
const LINE_V = 28; // world px per frame
const LINE_W = 3.25; // SCREEN px (local token: the kit has no stroke this heavy)
/** a thin dark warm casing under each cream line, so it reads on the dusk above and the bright haze below */
const LINE_CASE = { w: 1.4, color: "#2E1E14", a: 0.7 } as const;
const TARGET: Record<Kind, { x: number; y: number }> = {
  navy: SHIP_PTS.bridgeRoofFront,
  ocean: SHIP_PTS.funnelTop,
  energy: SHIP_PTS.aframeTop,
};
const lineStart = (c: Customer) => ({ x: c.x, y: CARD_BOTTOM - 2 });
const lineEnd = (c: Customer, f: number) => {
  const m = shipToWorld(STATION, f, TARGET[c.kind].x, TARGET[c.kind].y, bobAmount(f));
  const s = lineStart(c);
  return { x: m.x, y: m.y, len: Math.hypot(m.x - s.x, m.y - s.y) };
};
/** A line starts once its card has landed and settled (land + 3): never a stub under a card in flight. */
const LINE_T0 = (c: Customer) => c.land + 4;
/** For the build's checks (scripts only). */
export const TILE_TRACK = (i: number, f: number) => tileAt(CUSTOMERS[i], f);
export const LINE_DONE = CUSTOMERS.map((c) => LINE_T0(c) + lineEnd(c, 0).len / LINE_V);

// --- the click ----------------------------------------------------------------------------------------------
const SWEEP_F: [number, number] = [111, 125];

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
/** The canonical wind-turbine icon, static: the hub on top of a tapered tower that runs down into the wave
 *  line as its monopile; three equal, long, thick, round-capped blades 120 deg apart, one straight up. */
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

/** The cards' light: the scene's sun (upper left). A soft real shadow cast down-right onto the sky (it lifts
 *  while the card travels), a little thickness on the shaded edges, the lit top-left. */
const CARD_SHADOW = { rest: { dx: 9, dy: 15, blur: 11, a: 0.34 }, lifted: { dx: 16, dy: 28, blur: 20, a: 0.26 } } as const;
const CustomerCard: React.FC<{ c: Customer; x: number; y: number; k: number; lift: number }> = ({ c, x, y, k, lift }) => {
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
    a: lerp(CARD_SHADOW.rest.a, CARD_SHADOW.lifted.a, L),
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
  );
};

const SameBigShip: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam: Cam = cut1SeaCamAt(f);
  const k = cam.k;
  const bow = bowAt(f);
  const bob = bobAmount(f);
  const segs = CUSTOMERS.map((c) => {
    const s = lineStart(c);
    const e = lineEnd(c, f);
    const drawn = Math.min(e.len, Math.max(0, (f - LINE_T0(c)) * LINE_V));
    if (drawn <= 0.01) return null;
    const t = drawn / e.len;
    return { id: c.kind, x1: f2(s.x), y1: f2(s.y), x2: f2(lerp(s.x, e.x, t)), y2: f2(lerp(s.y, e.y, t)) };
  });
  const lines = (
    <g strokeLinecap="butt" fill="none">
      <g stroke={LINE_CASE.color} strokeOpacity={LINE_CASE.a} strokeWidth={f2((LINE_W + 2 * LINE_CASE.w) / k)}>
        {segs.map((g) => (g ? <line key={g.id} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} /> : null))}
      </g>
      <g stroke={COLOR.inkCream} strokeWidth={f2(LINE_W / k)}>
        {segs.map((g) => (g ? <line key={g.id} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} /> : null))}
      </g>
    </g>
  );
  return (
    <AbsoluteFill>
      <SeaStage
        S={f}
        cam={cam}
        rest={CUT1_SEA_CAM[0]}
        below={
          <>
            <BubbleTrail f={f} bowAt={bowAt} vMax={V_CRUISE} />
            <ResearchShip x={bow} S={f} bob={bob} part="below" k={k} />
          </>
        }
        above={
          <>
            {lines}
            <ResearchShip x={bow} S={f} bob={bob} part="above" k={k} sweep={(f - SWEEP_F[0]) / (SWEEP_F[1] - SWEEP_F[0])} />
            <SurfaceWake f={f} bowAt={bowAt} vMax={V_CRUISE} k={k} />
          </>
        }
        top={CUSTOMERS.map((c) => {
          const t = tileAt(c, f);
          if (!t.on) return null;
          return <CustomerCard key={c.kind} c={c} x={t.x} y={t.y} k={k} lift={t.lift} />;
        })}
      />
    </AbsoluteFill>
  );
};

export default SameBigShip;
