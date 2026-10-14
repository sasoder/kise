// SHIP_READY
import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";
import { camEase, type Cam, type Glide } from "./outgrowShared";
import {
  ALPHA,
  COLOR,
  EDGE,
  ElevationShadow,
  LightSweep,
  STROKE,
  StoutStage,
  clamp01,
  lerp,
  mixHex,
  type Silhouette,
} from "./stoutShared";

// ===========================================================================
// droneShipShared — THE SHIP of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone" (Will
// O'Brien, Ulysses), in the stout system (stoutShared.tsx: every colour, edge, shadow and stroke below is
// one of its tokens). Cut 1 (SameBigShip) and cut 2 (ShipDayRate) show THE SAME ship; cut 2 opens on cut 1's
// end framing (CUT1_END_CAM) or its settled framing (CUT1_SETTLED_CAM).
//
//   SurveyShip   a big oceanographic survey ship (USNS Pathfinder / NOAA Okeanos Explorer) in side profile,
//                BOW LEFT: raised bow, superstructure forward of midships with the bridge's window band, a
//                mast with a radome, a funnel, an open work deck aft with an A-frame at the stern. Hull +
//                superstructure + mast + radome + the stern A-frame (legs on the deck, head beam) are ONE cream
//                object with ONE union shadow; the mast yard and the A-frame's brace and sheave block are kraft
//                accents; window band, portholes, boot-top and funnel band are ink.
//                It sits IN the water: everything is clipped at the waterline `wl` (world, fixed) while the
//                ship bobs (bobAt) very gently. Its own waterline contact shadow lies on the sea.
//   Sea          the stout ground continued as a TONAL band below the waterline (the deep brown shadow
//                tone laid over the kraft, never blue, never black), a cream hairline at the surface and
//                three fainter swell hairlines drifting under it. Draw it BEFORE the ship.
//   Wake         a bow wave + the dissipating wake streaks of a ship cruising in (cut 1's arrival).
//   bobAt(S)     the ship's bob on the story clock: { dy, rot } (world px, degrees about MIDSHIP at wl).
//   shipToWorld  a ship-local point (x from the bow tip, y up from the waterline = negative) in world px,
//                with the bob applied: use it to pin anything to the ship (cut 1's lines end on the radome).
//   trackCentred the house damped camera (glides superposed on x / y / ln k, then the CAM_STIFF / CAM_DAMP
//                follower, pre-rolled so it opens moving) with `look` = the frame's TRUE centre (no CAM_LIFT).
//
// SHIP-LOCAL UNITS: world px at the size the ship is drawn (L = 900: ~900 screen px at k 1). x runs from the
// bow tip (0) to the stern (L); y is 0 on the waterline and negative upward. A SurveyShip at `x` (world x of
// the bow tip) and `wl` (world y of the waterline) maps local (lx, ly) to world (x + lx, wl + ly) before bob.
//
// CUT 2's AMBER COLUMN: DECK_SLOT is a slot in the open work deck aft (local x 742, deck y -58, 80 wide:
// between the deck step and the A-frame, clear of every other part). Pass `deckSlot` 0..1 to cut the slot
// line into the deck (its lit edge stops at the slot, the stout joint); draw the column in `front` in SHIP-LOCAL
// px (it is drawn inside the ship's bob transform, so it rides the ship) with its foot exactly on DECK_SLOT.y,
// and pass its silhouette (ship-local) as `extraSilhouette` so ship + column stay ONE object with ONE shadow.
// The world position of any ship-local point (for the camera, the light pool): shipToWorld / deckSlotWorld.
// ===========================================================================

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `ds${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- geometry (SHIP-LOCAL px) ------------------------------------------------------------------------
export const SHIP = {
  L: 900, // bow tip to stern
  /** where the stem meets the waterline (local x) */
  STEM_WL: 56,
  /** where the transom meets the waterline */
  STERN_WL: 882,
  /** main deck at the superstructure / the aft work deck / the bow deck tip */
  DECK: -112,
  AFT_DECK: -68,
  BOW_DECK: -146,
  /** the superstructure's levels: [forward x at base, forward x at top, aft x, top y] */
  LEVEL1: { x0: 262, x0t: 270, x1: 620, top: -162 },
  LEVEL2: { x0: 290, x0t: 298, x1: 574, top: -210 },
  BRIDGE: { x0: 318, x0t: 306, x1: 482, top: -258 },
  /** the mast (rising from the bridge roof) and its radome */
  MAST: { x: 450, w: 10, top: -322 },
  RADOME: { x: 450, y: -344, r: 24 },
  /** the funnel aft of the bridge */
  STACK: { x0: 512, x0t: 520, x1: 558, x1t: 562, top: -276, band: 12 },
  /** the deck step down to the aft work deck */
  STEP: { x0: 660, x1: 640 },
} as const;
/** The mid-ship pivot (local x) the bob rolls about, on the waterline. */
export const MIDSHIP = SHIP.L / 2;
/** Cut 2's slot in the open work deck aft (local): its centre x, the deck's y, its width. */
export const DECK_SLOT = { x: 748, y: SHIP.AFT_DECK, w: 80 } as const;
/** The radome's centre (local): the point cut 1's three lines converge on. */
export const MAST_POINT = { x: SHIP.RADOME.x, y: SHIP.RADOME.y } as const;
/** The ship's top (local y): the radome's top. */
export const SHIP_TOP = SHIP.RADOME.y - SHIP.RADOME.r;

// --- cut 1's placement (WORLD px) and framings -------------------------------------------------------
/** Where the ship stands at station in cut 1 (and cut 2): bow tip x, waterline y (world). The ship spans
 *  world x 90 .. 990 (centred on 540), the radome stands over x 540. */
export const SHIP_STATION = { x: 90, wl: 1080 } as const;

// --- the bob -----------------------------------------------------------------------------------------
/** The bob: very small and slow (a 2.7 s heave of +-1.8 px and a roll of +-0.22 deg, out of phase). */
export const BOB = { heave: 1.8, roll: 0.22, period: 64 } as const;
export const bobAt = (S: number, amount = 1) => ({
  dy: amount * BOB.heave * Math.sin((2 * Math.PI * S) / BOB.period),
  rot: amount * BOB.roll * Math.sin((2 * Math.PI * S) / BOB.period + 1.3),
});
/** A ship-local point in WORLD px for a ship at (x, wl), with the bob of story clock S applied. */
export const shipToWorld = (x: number, wl: number, S: number, lx: number, ly: number, bobAmount = 1) => {
  const b = bobAt(S, bobAmount);
  const a = (b.rot * Math.PI) / 180;
  const px = x + MIDSHIP;
  const dx = x + lx - px;
  const dy = ly;
  return { x: px + dx * Math.cos(a) - dy * Math.sin(a), y: wl + b.dy + dx * Math.sin(a) + dy * Math.cos(a) };
};
/** The deck slot's centre (on the deck line) in world px, bobbing. */
export const deckSlotWorld = (x: number, wl: number, S: number, bobAmount = 1) => shipToWorld(x, wl, S, DECK_SLOT.x, DECK_SLOT.y, bobAmount);

// --- paths (ship-local; the ship group translates them) ----------------------------------------------
const P = (pts: [number, number][]) => `M${pts.map(([a, b]) => `${f2(a)} ${f2(b)}`).join("L")}Z`;
/** A thick straight member (A-frame leg, mast) as a quad, for fills and silhouettes. */
const bar = (x1: number, y1: number, x2: number, y2: number, w: number) => {
  const l = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / l) * (w / 2);
  const ny = ((x2 - x1) / l) * (w / 2);
  // wound like every other part (the nonzero union never cancels where members overlap)
  return P([
    [x1 - nx, y1 - ny],
    [x2 - nx, y2 - ny],
    [x2 + nx, y2 + ny],
    [x1 + nx, y1 + ny],
  ]);
};
const circle = (cx: number, cy: number, r: number) =>
  `M${f2(cx + r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 0 ${f2(cx - r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 0 ${f2(cx + r)} ${f2(cy)}Z`;

const S_ = SHIP;
/** The hull, from the bow's deck tip down the raked stem, under the water (hidden: the sea clips it), up
 *  the transom, along the aft work deck, up the step and forward along the main deck's sheer to the bow. */
const HULL =
  `M0 ${S_.BOW_DECK}C16 -84 36 -28 ${S_.STEM_WL} 0L72 60L874 60L${S_.STERN_WL} 0L900 ${S_.AFT_DECK}` +
  `L${S_.STEP.x0} ${S_.AFT_DECK}C${S_.STEP.x0 - 10} ${S_.AFT_DECK} ${S_.STEP.x1 + 4} ${S_.AFT_DECK - 12} ${S_.STEP.x1} ${S_.DECK}` +
  `L250 ${S_.DECK}C150 ${S_.DECK} 70 ${S_.DECK - 10} 0 ${S_.BOW_DECK}Z`;
const LEVEL = (l: { x0: number; x0t: number; x1: number; top: number }, base: number) =>
  P([
    [l.x0, base + 1],
    [l.x0t, l.top],
    [l.x1, l.top],
    [l.x1, base + 1],
  ]);
const L1 = LEVEL(S_.LEVEL1, S_.DECK);
const L2 = LEVEL(S_.LEVEL2, S_.LEVEL1.top);
const BR = LEVEL(S_.BRIDGE, S_.LEVEL2.top);
/** the bridge roof: a thin plate overhanging the bridge a little at both ends */
const BR_ROOF = P([
  [S_.BRIDGE.x0t - 5, S_.BRIDGE.top - 6],
  [S_.BRIDGE.x1 + 6, S_.BRIDGE.top - 6],
  [S_.BRIDGE.x1 + 6, S_.BRIDGE.top + 1],
  [S_.BRIDGE.x0t - 5, S_.BRIDGE.top + 1],
]);
const STACK = P([
  [S_.STACK.x0, S_.LEVEL2.top + 1],
  [S_.STACK.x0t, S_.STACK.top],
  [S_.STACK.x1t, S_.STACK.top],
  [S_.STACK.x1, S_.LEVEL2.top + 1],
]);
const MAST = P([
  [S_.MAST.x - S_.MAST.w / 2, S_.BRIDGE.top - 5],
  [S_.MAST.x - S_.MAST.w / 2 + 1.5, S_.MAST.top],
  [S_.MAST.x + S_.MAST.w / 2 - 1.5, S_.MAST.top],
  [S_.MAST.x + S_.MAST.w / 2, S_.BRIDGE.top - 5],
]);
/** the radome's platform and the radome */
const RADOME_SEAT = P([
  [S_.RADOME.x - 16, S_.MAST.top + 3],
  [S_.RADOME.x - 16, S_.MAST.top - 3],
  [S_.RADOME.x + 16, S_.MAST.top - 3],
  [S_.RADOME.x + 16, S_.MAST.top + 3],
]);
const RADOME = circle(S_.RADOME.x, S_.RADOME.y, S_.RADOME.r);
/** THE STERN A-FRAME, built into the ship (director's note, round 1: the earlier kraft goalpost read as
 *  detached). Seen from the side: a fore and an aft leg, both standing ON the aft work deck on cream foot
 *  pedestals, leaning a little aft, joined at the top by one head beam; legs, pedestals and beam are cream,
 *  one material with the hull (in its body, its gradient and its one shadow). The kraft accents follow the
 *  mast's grammar (cream member, kraft yard): a cross-brace between the legs and the sheave block hanging
 *  from the beam's aft end. */
export const AFRAME = {
  feet: [826, 874] as const, // the legs' feet on the deck (local x)
  lean: 22, // how far aft each leg's top sits from its foot
  top: -206, // the legs' tops (under the beam)
  leg: 12, // leg width
  pedestal: { base: 30, top: 18, h: 14 },
  beam: { x0: 836, x1: 910, y0: -220, y1: -204 },
  brace: -140,
} as const;
const legX = (foot: number, y: number) => foot + (AFRAME.lean * (S_.AFT_DECK - y)) / (S_.AFT_DECK - AFRAME.top);
const AFRAME_LEGS = AFRAME.feet.map((x) => bar(x, S_.AFT_DECK + 1, x + AFRAME.lean, AFRAME.top + 2, AFRAME.leg));
const AFRAME_PEDESTALS = AFRAME.feet.map((x) =>
  P([
    [x - AFRAME.pedestal.base / 2, S_.AFT_DECK + 1],
    [x - AFRAME.pedestal.top / 2 + legX(0, S_.AFT_DECK - AFRAME.pedestal.h), S_.AFT_DECK - AFRAME.pedestal.h],
    [x + AFRAME.pedestal.top / 2 + legX(0, S_.AFT_DECK - AFRAME.pedestal.h), S_.AFT_DECK - AFRAME.pedestal.h],
    [x + AFRAME.pedestal.base / 2, S_.AFT_DECK + 1],
  ]),
);
const AFRAME_BEAM = P([
  [AFRAME.beam.x0, AFRAME.beam.y0],
  [AFRAME.beam.x1, AFRAME.beam.y0 + 2],
  [AFRAME.beam.x1, AFRAME.beam.y1],
  [AFRAME.beam.x0, AFRAME.beam.y1],
]);
const AFRAME_BRACE = bar(legX(AFRAME.feet[0], AFRAME.brace), AFRAME.brace, legX(AFRAME.feet[1], AFRAME.brace), AFRAME.brace, 5);
const AFRAME_BLOCK = P([
  [AFRAME.beam.x1 - 13, AFRAME.beam.y1 - 1],
  [AFRAME.beam.x1 - 2, AFRAME.beam.y1 - 1],
  [AFRAME.beam.x1 - 3, AFRAME.beam.y1 + 17],
  [AFRAME.beam.x1 - 12, AFRAME.beam.y1 + 17],
]);
/** the cream body: every part, one fill, one gradient */
const CREAM_PARTS = [HULL, L1, L2, BR, BR_ROOF, STACK, MAST, RADOME_SEAT, RADOME, ...AFRAME_LEGS, ...AFRAME_PEDESTALS, AFRAME_BEAM];
/** kraft board accents: the mast's yard, the A-frame's cross-brace and sheave block */
const MAST_YARD = bar(S_.MAST.x - 24, -292, S_.MAST.x + 24, -292, 4);
const KRAFT_NEAR = [MAST_YARD, AFRAME_BRACE, AFRAME_BLOCK];
/** The whole ship's union silhouette (local): the one shadow. */
export const SHIP_SILHOUETTE: string[] = [...CREAM_PARTS, ...KRAFT_NEAR];

// --- the ink details on the cream --------------------------------------------------------------------
const PORTHOLES = Array.from({ length: 18 }, (_, i) => 112 + i * 32).filter((x) => x < 625);
const L1_WINDOWS = Array.from({ length: 13 }, (_, i) => 300 + i * 26).filter((x) => x < 600);
/** the bridge window band: follows the raked front */
const bridgeFrontAt = (y: number) => lerp(S_.BRIDGE.x0, S_.BRIDGE.x0t, (S_.LEVEL2.top - y) / (S_.LEVEL2.top - S_.BRIDGE.top));
const WIN = { y0: -248, y1: -229 } as const;
const WINDOW_BAND = P([
  [bridgeFrontAt(WIN.y0) + 5, WIN.y0],
  [S_.BRIDGE.x1 - 9, WIN.y0],
  [S_.BRIDGE.x1 - 9, WIN.y1],
  [bridgeFrontAt(WIN.y1) + 5, WIN.y1],
]);
const MULLIONS = Array.from({ length: 7 }, (_, i) => bridgeFrontAt(WIN.y1) + 5 + 20 * (i + 1)).filter((x) => x < S_.BRIDGE.x1 - 14);
/** the hull line: a rub rail 14 px under the deck edge, bow to stern (follows the sheer and the step) */
const RUB_RAIL =
  `M4 ${S_.BOW_DECK + 16}C70 ${S_.DECK + 6} 150 ${S_.DECK + 14} 250 ${S_.DECK + 14}L${S_.STEP.x1 - 4} ${S_.DECK + 14}` +
  `C${S_.STEP.x1 + 6} ${S_.DECK + 26} ${S_.STEP.x1 + 10} ${S_.AFT_DECK + 14} ${S_.STEP.x0 + 6} ${S_.AFT_DECK + 14}L897 ${S_.AFT_DECK + 14}`;

// --- the sea ----------------------------------------------------------------------------------------
/** The sea: the shadow tone laid over the ground below the waterline (a TONE: the kraft stays visible), the
 *  surface hairline and three swell hairlines (tones of cream on the ground, dimmer with depth). */
export const SEA = {
  tint: 0.3,
  surface: 0.62, // the surface hairline's tone: ground -> cream
  /** swells: depth under the surface, tone, wavelength / amplitude (world px), drift (px / f), broken into
   *  long irregular runs (never an even dash: an even dash reads as road markings) */
  swells: [
    { dy: 50, tone: 0.3, wave: 260, amp: 3, drift: 0.6, dash: "340 60 180 110 260 80" },
    { dy: 118, tone: 0.21, wave: 340, amp: 4, drift: 0.45, dash: "420 140 220 90 300 170" },
    { dy: 212, tone: 0.15, wave: 420, amp: 5, drift: 0.32, dash: "520 180 280 120" },
    { dy: 340, tone: 0.11, wave: 520, amp: 6, drift: 0.24, dash: "640 220 360 200" },
    { dy: 510, tone: 0.08, wave: 640, amp: 7, drift: 0.18, dash: "780 260 420 240" },
  ],
} as const;
const swellPath = (x0: number, x1: number, y: number, wave: number, amp: number, phase: number) => {
  const step = 20;
  let d = "";
  for (let x = x0; x <= x1; x += step) {
    const yy = y + amp * Math.sin(((x + phase) / wave) * 2 * Math.PI);
    d += `${x === x0 ? "M" : "L"}${f2(x)} ${f2(yy)}`;
  }
  return d;
};
export const Sea: React.FC<{ wl: number; k: number; S: number; x0?: number; x1?: number }> = ({ wl, k, S, x0 = -1600, x1 = 2700 }) => {
  const hair = STROKE.HAIRLINE / k;
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={x0 - 2000} y={f2(wl)} width={x1 - x0 + 4000} height={4000} fill={COLOR.shadow} fillOpacity={SEA.tint} />
      <line x1={x0 - 2000} x2={x1 + 2000} y1={f2(wl)} y2={f2(wl)} stroke={mixHex(COLOR.ground, COLOR.inkCream, SEA.surface)} strokeWidth={f2(hair)} />
      {SEA.swells.map((w, i) => (
        <path
          key={i}
          d={swellPath(x0, x1, wl + w.dy, w.wave, w.amp, S * w.drift + i * 131)}
          fill="none"
          stroke={mixHex(COLOR.ground, COLOR.inkCream, w.tone)}
          strokeWidth={f2(hair)}
          strokeDasharray={w.dash}
          strokeDashoffset={f2(-S * w.drift * 0.6 + i * 97)}
        />
      ))}
    </g>
  );
};

// --- the ship -----------------------------------------------------------------------------------------
export type SurveyShipProps = {
  /** world x of the bow tip */
  x: number;
  /** world y of the waterline (the sea's surface: the ship is clipped here) */
  wl: number;
  /** current camera zoom (edges, lines and slot are SCREEN px) */
  k: number;
  /** story clock (drives the bob) */
  S: number;
  /** 0 = still on the water .. 1 = the full bob (default 1) */
  bob?: number;
  /** 0..1: the deck slot is cut into the aft work deck (cut 2) */
  deckSlot?: number;
  /** drawn in SHIP-LOCAL px inside the bob transform, behind the body */
  behind?: React.ReactNode;
  /** drawn in SHIP-LOCAL px inside the bob transform, in front of the body: cut 2's column */
  front?: React.ReactNode;
  /** extra SHIP-LOCAL silhouettes joined to the ship's ONE shadow (cut 2's column) */
  extraSilhouette?: Silhouette;
  /** 0..1 the one LightSweep across the ship (cut 1's click); outside 0..1 nothing */
  sweep?: number;
  /** 0..1 strength of the waterline contact shadow on the sea */
  contact?: number;
};

/**
 * SurveyShip — the clip's ship. One cream body (hull + superstructure + funnel + mast + radome) lit from
 * above (one gradient from the radome's top to the waterline), its lit top edges, kraft members, ink details,
 * ONE union shadow (the stout rest elevation) and a waterline contact on the sea; clipped at `wl`.
 */
export const SurveyShip: React.FC<SurveyShipProps> = ({ x, wl, k, S, bob = 1, deckSlot = 0, behind, front, extraSilhouette, sweep = -1, contact = 1 }) => {
  const uid = uidOf(useId());
  const b = bobAt(S, bob);
  const r = S_.RADOME.r;
  const e = EDGE.CREAM / k;
  const lit = (d: string, key: string) => <path key={key} d={d} fill="none" stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(e)} strokeLinecap="butt" />;
  const ink = COLOR.inkDark;
  const deckLine = mixHex(COLOR.creamFoot, COLOR.board, 0.62);
  const slotW = (DECK_SLOT.w + (2 * EDGE.SLOT_LIP) / k) * clamp01(deckSlot);
  const s0 = DECK_SLOT.x - slotW / 2;
  const s1 = DECK_SLOT.x + slotW / 2;
  const aftEdgeY = S_.AFT_DECK + e / 2;
  // the lit top edges: every exposed upward face (local)
  const edges: string[] = [
    // bow deck to the superstructure
    `M2 ${f2(S_.BOW_DECK + e / 2)}C70 ${f2(S_.DECK - 10 + e / 2)} 150 ${f2(S_.DECK + e / 2)} 250 ${f2(S_.DECK + e / 2)}L${S_.LEVEL1.x0} ${f2(S_.DECK + e / 2)}`,
    `M${S_.LEVEL1.x1} ${f2(S_.DECK + e / 2)}L${S_.STEP.x1} ${f2(S_.DECK + e / 2)}`,
    // level 1 roof (exposed fore and aft of level 2)
    `M${S_.LEVEL1.x0t + 2} ${f2(S_.LEVEL1.top + e / 2)}L${S_.LEVEL2.x0} ${f2(S_.LEVEL1.top + e / 2)}`,
    `M${S_.LEVEL2.x1} ${f2(S_.LEVEL1.top + e / 2)}L${S_.LEVEL1.x1 - 2} ${f2(S_.LEVEL1.top + e / 2)}`,
    // level 2 roof (fore of the bridge, between bridge and funnel, aft of the funnel)
    `M${S_.LEVEL2.x0t + 2} ${f2(S_.LEVEL2.top + e / 2)}L${S_.BRIDGE.x0} ${f2(S_.LEVEL2.top + e / 2)}`,
    `M${S_.BRIDGE.x1 + 6} ${f2(S_.LEVEL2.top + e / 2)}L${S_.STACK.x0} ${f2(S_.LEVEL2.top + e / 2)}`,
    `M${S_.STACK.x1} ${f2(S_.LEVEL2.top + e / 2)}L${S_.LEVEL2.x1 - 2} ${f2(S_.LEVEL2.top + e / 2)}`,
    // bridge roof (either side of the mast) and the funnel's top
    `M${S_.BRIDGE.x0t - 3} ${f2(S_.BRIDGE.top - 6 + e / 2)}L${S_.MAST.x - S_.MAST.w / 2} ${f2(S_.BRIDGE.top - 6 + e / 2)}`,
    `M${S_.MAST.x + S_.MAST.w / 2} ${f2(S_.BRIDGE.top - 6 + e / 2)}L${S_.BRIDGE.x1 + 4} ${f2(S_.BRIDGE.top - 6 + e / 2)}`,
    `M${S_.STACK.x0t + 2} ${f2(S_.STACK.top + e / 2)}L${S_.STACK.x1t - 2} ${f2(S_.STACK.top + e / 2)}`,
    // the radome's platform
    `M${S_.RADOME.x - 15} ${f2(S_.MAST.top - 3 + e / 2)}L${S_.RADOME.x - r * 0.7} ${f2(S_.MAST.top - 3 + e / 2)}`,
  ];
  // the aft work deck's lit edge stops at the slot (the stout joint) and at the A-frame's pedestals; the
  // pedestals and the A-frame's head beam carry their own lit tops
  const gaps: [number, number][] = AFRAME.feet.map((fx0) => [fx0 - AFRAME.pedestal.base / 2, fx0 + AFRAME.pedestal.base / 2] as [number, number]);
  if (slotW > 0.01) gaps.push([s0, s1]);
  gaps.sort((p, q) => p[0] - q[0]);
  let ax = S_.STEP.x0 as number;
  let aft = "";
  for (const [g0, g1] of gaps) {
    if (g0 > ax) aft += `M${f2(ax)} ${f2(aftEdgeY)}L${f2(g0)} ${f2(aftEdgeY)}`;
    ax = Math.max(ax, g1);
  }
  if (ax < 898) aft += `M${f2(ax)} ${f2(aftEdgeY)}L898 ${f2(aftEdgeY)}`;
  edges.push(aft);
  const pedY = S_.AFT_DECK - AFRAME.pedestal.h + e / 2;
  for (const fx0 of AFRAME.feet) {
    const c = fx0 + legX(0, S_.AFT_DECK - AFRAME.pedestal.h);
    edges.push(`M${f2(c - AFRAME.pedestal.top / 2 + 1)} ${f2(pedY)}L${f2(c - AFRAME.leg / 2)} ${f2(pedY)}M${f2(c + AFRAME.leg / 2)} ${f2(pedY)}L${f2(c + AFRAME.pedestal.top / 2 - 1)} ${f2(pedY)}`);
  }
  edges.push(`M${AFRAME.beam.x0 + 1} ${f2(AFRAME.beam.y0 + e / 2)}L${AFRAME.beam.x1 - 1} ${f2(AFRAME.beam.y0 + 2 + e / 2)}`);
  const top = SHIP_TOP;
  const transform = `translate(${fx(x + MIDSHIP)} ${fx(wl + b.dy)}) rotate(${fx(b.rot)}) translate(${fx(-MIDSHIP)} 0)`;
  return (
    <g>
      <defs>
        {/* the sea's surface: nothing of the ship below it */}
        <clipPath id={`${uid}w`}>
          <rect x={f2(x - 400)} y={f2(wl - 2000)} width={f2(SHIP.L + 800)} height={2000} />
        </clipPath>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2="0">
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}k`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(-230)} x2="0" y2={f2(S_.AFT_DECK)}>
          <stop offset="0" stopColor={COLOR.board} />
          <stop offset="1" stopColor={COLOR.boardFoot} />
        </linearGradient>
        <radialGradient id={`${uid}r`} gradientUnits="userSpaceOnUse" cx={f2(S_.RADOME.x - r * 0.35)} cy={f2(S_.RADOME.y - r * 0.45)} r={f2(r * 1.5)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="0.62" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.board, 0.35)} />
        </radialGradient>
        <clipPath id={`${uid}h`}>
          <path d={HULL} />
        </clipPath>
        <clipPath id={`${uid}s`}>
          <path d={SHIP_SILHOUETTE.join("")} />
        </clipPath>
      </defs>

      {/* the waterline contact: the hull's shadow on the sea, just under the surface */}
      {contact > 0.001 ? (
        <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
          <ellipse
            cx={f2(x + (S_.STEM_WL + S_.STERN_WL) / 2 + 4)}
            cy={f2(wl + 3)}
            rx={f2((S_.STERN_WL - S_.STEM_WL) * 0.52)}
            ry={5}
            opacity={f2(0.55 * contact)}
            style={{ filter: "blur(3.5px)" }}
          />
        </g>
      ) : null}

      <g clipPath={`url(#${uid}w)`}>
        <g transform={transform}>
          {/* 1. the one shadow: the whole ship's union silhouette (+ anything joined to it) */}
          <ElevationShadow
            silhouette={[...SHIP_SILHOUETTE.map((d) => ({ d })), ...(extraSilhouette ?? [])]}
            elevation="rest"
          />
          {behind ?? null}

          {/* 2. the cream body (hull, superstructure, mast, radome, A-frame), then the kraft accents */}
          <path d={CREAM_PARTS.join("")} fill={`url(#${uid}c)`} />
          <path d={RADOME} fill={`url(#${uid}r)`} />
          <path d={KRAFT_NEAR.join("")} fill={`url(#${uid}k)`} />

          {/* 3. ink and tone details on the cream */}
          <g clipPath={`url(#${uid}h)`}>
            {/* the boot-top: the ink band at the waterline */}
            <rect x={0} y={-15} width={SHIP.L} height={80} fill={ink} />
          </g>
          <path d={RUB_RAIL} fill="none" stroke={deckLine} strokeWidth={3} />
          {/* the deck lines where each level stands on the one below */}
          <path
            d={`M${S_.LEVEL1.x0} ${S_.DECK}L${S_.LEVEL1.x1} ${S_.DECK}M${S_.LEVEL2.x0} ${S_.LEVEL1.top}L${S_.LEVEL2.x1} ${S_.LEVEL1.top}M${S_.BRIDGE.x0} ${S_.LEVEL2.top}L${S_.STACK.x1} ${S_.LEVEL2.top}`}
            fill="none"
            stroke={deckLine}
            strokeWidth={2.5}
          />
          <g fill={ink}>
            {PORTHOLES.map((px) => (
              <circle key={px} cx={px} cy={-56} r={3.8} />
            ))}
            {L1_WINDOWS.map((px) => (
              <rect key={px} x={px} y={-144} width={12} height={10} rx={1.5} />
            ))}
            <path d={WINDOW_BAND} />
            {/* the funnel's band */}
            <path
              d={P([
                [S_.STACK.x0t + 0.1, S_.STACK.top + 1],
                [S_.STACK.x1t, S_.STACK.top + 1],
                [S_.STACK.x1t - 0.3, S_.STACK.top + S_.STACK.band],
                [S_.STACK.x0t + 0.6, S_.STACK.top + S_.STACK.band],
              ])}
            />
          </g>
          {/* the window band's mullions */}
          <g stroke={COLOR.cream} strokeWidth={2.4}>
            {MULLIONS.map((mx) => (
              <line key={mx} x1={f2(mx)} x2={f2(mx)} y1={WIN.y0} y2={WIN.y1} />
            ))}
          </g>

          {/* 4. the lit top edges */}
          {edges.map((d, i) => lit(d, `e${i}`))}
          <path
            d={`M${f2(S_.RADOME.x - r * 0.82)} ${f2(S_.RADOME.y - r * 0.57)}A${r} ${r} 0 0 1 ${f2(S_.RADOME.x + r * 0.82)} ${f2(S_.RADOME.y - r * 0.57)}`}
            fill="none"
            stroke={COLOR.edge}
            strokeOpacity={ALPHA.edge}
            strokeWidth={f2(e)}
          />

          {/* 5. the deck slot (cut 2): the slot line across the joint */}
          {slotW > 0.01 ? (
            <rect x={f2(s0)} y={f2(S_.AFT_DECK - EDGE.SLOT / k / 2)} width={f2(slotW)} height={f2(EDGE.SLOT / k)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
          ) : null}

          {/* 6. the one click: a light sweep across the whole ship, clipped to it (it stops above the boot-top) */}
          {sweep > 0 && sweep < 1 ? (
            <g clipPath={`url(#${uid}s)`}>
              <LightSweep x={-10} y={top - 10} w={SHIP.L + 20} h={-top - 6} k={k} t={sweep} on="cream" r={0} />
            </g>
          ) : null}

          {front ?? null}
        </g>
      </g>
    </g>
  );
};

// --- the arrival: bow wave and wake ---------------------------------------------------------------------
/**
 * Wake — a ship cruising in leaves foam on the surface: a bow wave climbing the stem (its size follows the
 * speed) and two streaks laid down behind the transom that drift apart and dissipate. `bowAt(f)` = the bow
 * tip's world x at frame f (the cut's own track); `vMax` = its cruise speed (world px / f).
 */
export const Wake: React.FC<{ f: number; wl: number; k: number; bowAt: (f: number) => number; vMax: number; span?: number }> = ({ f, wl, k, bowAt, vMax, span = 40 }) => {
  const hair = STROKE.HAIRLINE / k;
  const col = mixHex(COLOR.ground, COLOR.inkCream, 0.7);
  const speed = (p: number) => Math.max(0, bowAt(p - 1) - bowAt(p)) / vMax;
  const segs: { x0: number; x1: number; age: number; s: number }[] = [];
  for (let p = Math.floor(f); p > f - span; p--) {
    const s = speed(p);
    if (s < 0.02) continue;
    const a = bowAt(p) + SHIP.STERN_WL;
    const b = bowAt(p - 1) + SHIP.STERN_WL;
    segs.push({ x0: a, x1: b, age: f - p, s });
  }
  const sNow = speed(f);
  const stem = bowAt(f) + SHIP.STEM_WL;
  return (
    <g fill="none" stroke={col} strokeWidth={f2(hair)} strokeLinecap="round" style={{ pointerEvents: "none" }}>
      {segs.map((g, i) => {
        const fade = g.s * Math.pow(1 - g.age / span, 2);
        return (
          <g key={i} opacity={f2(clamp01(fade))}>
            <line x1={f2(g.x0)} x2={f2(g.x1)} y1={f2(wl + 4 + g.age * 0.32)} y2={f2(wl + 4 + (g.age + 1) * 0.32)} />
            <line x1={f2(g.x0 + 6)} x2={f2(g.x1 + 6)} y1={f2(wl + 10 + g.age * 0.75)} y2={f2(wl + 10 + (g.age + 1) * 0.75)} />
          </g>
        );
      })}
      {sNow > 0.02 ? (
        <g opacity={f2(clamp01(sNow * 1.2))}>
          <path d={`M${f2(stem - 34 * sNow)} ${f2(wl + 2)}Q${f2(stem - 12 * sNow)} ${f2(wl + 1)} ${f2(stem - 2)} ${f2(wl - 12 * sNow)}`} />
          <path d={`M${f2(stem - 20 * sNow)} ${f2(wl + 7)}Q${f2(stem + 10)} ${f2(wl + 7)} ${f2(stem + 40 * sNow)} ${f2(wl + 4)}`} />
        </g>
      ) : null}
    </g>
  );
};

// --- the camera ---------------------------------------------------------------------------------------
/** The house damped camera (outgrowShared.cameraTrack / MostSponsorship.cameraTrackPre: glides superposed on
 *  x, y and ln k, then the CAM_STIFF / CAM_DAMP follower), PRE-ROLLED from f -pre so the cut opens moving.
 *  Here (x, y) is the frame's TRUE centre (no CAM_LIFT): this clip frames its focus at the middle. */
export const trackCentred = (start: Cam, glides: Glide[], frames: number, pre = 30): Cam[] => {
  const T: Cam[] = [];
  for (let f = -pre; f <= frames + 2; f++) {
    let x = start.x;
    let y = start.y;
    let lk = Math.log(start.k);
    let kPrev = start.k;
    for (const g of glides) {
      const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    T.push({ x, y, k: Math.exp(lk) });
  }
  const out: Cam[] = [];
  let c = { ...T[0] };
  let v = { x: 0, y: 0, k: 0 };
  for (let i = 0; i < T.length; i++) {
    if (i > 0) {
      const t = T[i];
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    if (i >= pre) out.push({ ...c });
  }
  return out;
};

// --- cut 1's camera (SameBigShip): exported so cut 2 can open on a matching picture -------------------
export const CUT1_DURATION = 156;
/** f0: closer and lower, on the hull as the bow cruises in from the right (round 2: 65 px higher on screen). */
export const CUT1_START_CAM: Cam = { x: 640, y: 1065, k: 1.55 };
/** The settled framing (reached ~f75, held through ~f104): three cards over one ship; screen = world - (0, 65)
 *  (round 2: the composition sits 65 px higher than world = screen, clear of the caption band: the waterline on
 *  screen y 1015). */
export const CUT1_SETTLED_CAM: Cam = { x: 540, y: 1025, k: 1 };
/** The creep's zoom anchor: the ship's hull (world; screen y 935 settled), which stays put on screen while the
 *  camera creeps in (the waterline ends near screen y 1018). */
export const CUT1_CREEP_ANCHOR = { x: 540, y: 1000 } as const;
export const CUT1_CREEP_K = 1.075;
export const CUT1_GLIDES: Glide[] = [
  // ease out as the ship arrives: back and up to the settled framing
  {
    f0: -6,
    f1: 52,
    dx: CUT1_SETTLED_CAM.x - CUT1_START_CAM.x,
    dy: CUT1_SETTLED_CAM.y - CUT1_START_CAM.y,
    k: CUT1_SETTLED_CAM.k,
    warp: 0.8,
  },
  // the slow creep in toward the ship (still moving on the last frame): a zoom about the ship's middle
  {
    f0: 104,
    f1: 190,
    dy: CUT1_CREEP_ANCHOR.y + (CUT1_SETTLED_CAM.y - CUT1_CREEP_ANCHOR.y) / CUT1_CREEP_K - CUT1_SETTLED_CAM.y,
    k: CUT1_CREEP_K,
    warp: 1,
  },
];
export const CUT1_CAM: Cam[] = trackCentred(CUT1_START_CAM, CUT1_GLIDES, CUT1_DURATION, 30);
export const cut1CamAt = (f: number): Cam => CUT1_CAM[Math.max(0, Math.min(CUT1_CAM.length - 1, Math.round(f)))];
/** Cut 1's last frame's camera (f155): where cut 2 can open. */
export const CUT1_END_CAM: Cam = cut1CamAt(CUT1_DURATION - 1);

// ===========================================================================
// THE STYLE FRAME — the ship alone on the sea at cut 1's settled framing (registered by
// src/Root.SameBigShip.tsx as "SurveyShipStyleFrame")
// ===========================================================================
export const SurveyShipStyleFrame: React.FC = () => {
  const cam = CUT1_SETTLED_CAM;
  return (
    <AbsoluteFill>
      <StoutStage S={0} cam={cam} pool={{ x: 540, y: SHIP_STATION.wl - 180 }} sway={false}>
        <Sea wl={SHIP_STATION.wl} k={cam.k} S={0} />
        <SurveyShip x={SHIP_STATION.x} wl={SHIP_STATION.wl} k={cam.k} S={0} bob={0} />
      </StoutStage>
    </AbsoluteFill>
  );
};
