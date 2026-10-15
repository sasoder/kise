// SEA_V2 (improvement-loop copy of droneSeaShared.tsx for SameBigShipV2 only; cut 2 imports the original)
import React, { useId } from "react";
import { trackCentred } from "./droneShipShared";
import {
  GodRays,
  InFog,
  OCEAN,
  OceanStage,
  clamp01,
  fogAt,
  hash01,
  lerp,
  makeView,
  smoothstep,
  type Cam,
  type Glide,
  type OceanView,
  type Scene,
} from "./oceanShared";
import { LightSweep } from "./stoutShared";

// ===========================================================================
// droneSeaSharedV2 — a copy of droneSeaShared (the original stays as delivered; cut 2 imports it). V2 adds
// ResearchShip `glint`: a deliberate low-sun glint travelling the whole ship (round 1 of the V2 loop).
// Round 2: the glint is CRISP (no band, no halo: it never lowers the ship's contrast): a warm rim running along
// the top edges and rails, specular streaks on the glass, a spot on the domes. The big radome moves forward onto
// a pedestal on the bridge roof's front, so the mast top (MASTHEAD) is the ship's clear highest point: cut 1's
// three lines gather there.
// Round 3: a livelier float (BOB: ~3.5 px heave, ~0.45 deg pitch, full from f20); `glintRing`: the glint spreads
// OUT from a point (the mast) fore and aft, fading as it goes (the result of the pulse down cut 1's rope);
// WashLine: foam lapping along the hull's waterline, always moving; SeaStage `drift`: the god rays and the marine
// snow drift slowly sideways (the parallax origin travels).
//
// droneSeaShared — THE SEA AND THE SHIP of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone"
// (Will O'Brien, Ulysses), in the REALISTIC ocean look of the sibling Ulysses clips (oceanShared.tsx: the
// warm split-tone water, god rays, marine snow, stout grain + brown vignette; GhostLines' over/under
// opening). Cut 1 (SameBigShip) and cut 2 (ShipDayRate) show THE SAME ship.
//
// THE FRAME: an over/under split at the waterline. Above it a warm hazy sky, a thin band of sea out to the
// horizon, and the ship sitting IN the water; below it the realistic underwater (oceanShared's OceanStage:
// the water graded by depth and viewing angle, god rays from the surface, marine snow), with the ship's
// hull, keel, sonar gondola, rudder and propeller seen through the water. The underwater half is where the
// user's captions sit: nothing readable goes there.
//
//   SeaStage        the whole stage: OceanStage (underwater, world `below` children) + the above-water overlay
//                   (sky, sun, far sea band with glints, world `above` children clipped above the waterline,
//                   the meniscus). One camera (Cam: centre x, y, zoom k; world y 0 = the waterline).
//   ResearchShip    the survey ship (USNS Pathfinder / NOAA Okeanos Explorer, drawn realistically, bow LEFT):
//                   `part="above"` inside SeaStage's `above`, `part="below"` inside its `below` (fogged).
//                   Lit by the scene's one key light (the sun, upper left): white paint shading from lit top
//                   to the waterline, lit top edges, window glass, rails, boot-top, antifouling under water.
//   SurfaceWake     foam on the surface (bow wave + streaks astern) for a ship under way  (above)
//   BubbleTrail     the propeller's bubbles astern, rising and dissipating               (below)
//   shipToWorld     a ship-local point -> world (with the bob); SHIP_PTS: the line targets, the deck slot.
//   seaView         the OceanView of a frame (for anything that must project like the stage)
//   CUT1_SEA_*      cut 1's camera (start, settled, creep, the track and its last frame for cut 2).
//
// UNITS. WORLD px; 1 m = SEA_SCENE.pxPerM (12) world px; the waterline is world y 0, up is negative. The
// ship is drawn in SHIP-LOCAL px (x from the bow tip 0 to the stern SHIP_L 900, y 0 on the waterline,
// negative up, positive under water) and placed by its bow tip x (`x`) at y 0.
// No amber in the ship or the sea (amber = money in this clip; cut 2 brings it).
// ===========================================================================

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `dsea${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
type P2 = { x: number; y: number };
const P = (pts: [number, number][]) => `M${pts.map(([a, b]) => `${f3(a)} ${f3(b)}`).join("L")}Z`;

// --- the scene --------------------------------------------------------------------------------------
/** The water under the split: the eye at the surface; the gradient deepens fast below the waterline (angle
 *  gain), so the caption band sits in mid water and the frame's foot in the warm deep, never black. */
export const SEA_SCENE: Scene = {
  label: "drone sea (over/under at the waterline)",
  pxPerM: 12,
  focusM: 22,
  fogNearM: 6,
  fogVisM: 34,
  fogMax: 0.95,
  surfaceY: 0,
  angleGainM: 118,
  seabedTileM: 5,
  surfaceTileM: 12,
  caustics: 0,
  seabedLight: 0.4,
  seabedFogBoost: 1,
};
/** OceanStage's own sway (the GhostLines convention): the overlay uses the same. */
export const seaSway = (S: number) => ({ x: 3 * Math.sin(S / 23), y: 5 * Math.sin(S / 19) });
/** The screen y of the waterline under a camera (no sway). */
export const waterlineScreenY = (cam: Cam) => 960 - cam.y * cam.k;
/** The view of a frame: the vanishing point at the waterline (the camera sits at the surface). */
export const seaView = (S: number, cam: Cam, sway = true): OceanView =>
  makeView({ frame: S, cam, scene: SEA_SCENE, horizon: waterlineScreenY(cam) + (sway ? seaSway(S).y : 0), sway: sway ? seaSway(S) : { x: 0, y: 0 } });

/** The above-water look (screen colours): a warm hazy sky (the GhostLines sky warmed toward golden hour, a
 *  touch deeper at the top so cream cards read on it), the far sea band, glints, the meniscus. */
export const SKY = {
  // round 2 (contrast): golden hour deepening to a stout-espresso dusk at the top of the frame, so the cream
  // cards read as lit objects against it; still bright and hazy at the horizon behind the ship; never grey/black
  top: "#3D291C",
  upper: "#5A3B26",
  amber: "#875B36",
  mid: "#B6824F",
  low: "#DCAE76",
  glow: "#ECCB98",
  haze: "#F3DEB6",
  sun: "#FBE9C4",
  /** cloud banks: lit warm high up (in the dusk), pale low (in the glow) */
  cloudHi: "#A87347",
  cloudLo: "#F1D9AE",
} as const;
export const SEA_UP = { far: "#C9BFA6", mid: "#9DA596", near: "#6C8279", glint: OCEAN.cream } as const;
/** The far sea band's height (screen px) between the horizon and the waterline at k 1. */
export const SEA_BAND = 30;
/** soft cloud banks: x, height above the horizon, half-width, half-thickness, alpha, drift (px / f) */
const CLOUDS = [
  { x: 120, h: 560, w: 420, t: 26, a: 0.32, v: 0.18 },
  { x: 900, h: 470, w: 520, t: 22, a: 0.28, v: 0.14 },
  { x: 520, h: 330, w: 640, t: 18, a: 0.3, v: 0.11 },
  { x: 1400, h: 250, w: 480, t: 14, a: 0.26, v: 0.09 },
  { x: 300, h: 160, w: 700, t: 12, a: 0.3, v: 0.07 },
  { x: 1100, h: 760, w: 380, t: 30, a: 0.22, v: 0.22 },
] as const;
const wave = (x: number, S: number) => 2.4 * Math.sin(x / 74 + S * 0.21) + 1.2 * Math.sin(x / 29 - S * 0.37 + 1.3);

// --- the ship's geometry (SHIP-LOCAL px) -------------------------------------------------------------------
export const SHIP_L = 900;
export const SHIP_GEO = {
  STEM_WL: 56,
  STERN_WL: 882,
  DRAFT: 84, // keel depth (7 m)
  DECK: -112,
  AFT_DECK: -68,
  BOW_DECK: -146,
  LEVEL1: { x0: 262, x0t: 270, x1: 620, top: -162 },
  LEVEL2: { x0: 290, x0t: 298, x1: 574, top: -210 },
  BRIDGE: { x0: 318, x0t: 306, x1: 482, top: -258 },
  ROOF: { x0: 298, x1: 490, y0: -265, y1: -257 },
  MAST: { x: 450, top: -322 },
  RADOME: { x: 336, y: -300, r: 24 },
  /** V2: the masthead fitting at the mast's top (the attach point of cut 1's rope) */
  MASTHEAD: { x: 450, y: -334 },
  DOME2: { x: 392, y: -276, r: 11 },
  STACK: { x0: 512, x0t: 520, x1: 558, x1t: 562, top: -276 },
  STEP: { x0: 660, x1: 640 },
  AFRAME: { feet: [826, 874] as const, lean: 22, top: -206, leg: 11, beam: { x0: 836, x1: 910, y0: -220, y1: -205 } },
  GONDOLA: { x0: 270, x1: 372, depth: 22 },
} as const;
const G = SHIP_GEO;
/** Points on the ship (SHIP-LOCAL px) other cuts aim at. `deckSlot`: the open work deck aft, clear of the
 *  A-frame and the step (cut 2's amber column stands here: its foot on y, centred on x, at most w wide). */
export const SHIP_PTS = {
  bridgeRoofFront: { x: G.ROOF.x0 + 14, y: G.ROOF.y0 + 1 },
  funnelTop: { x: (G.STACK.x0t + G.STACK.x1t) / 2, y: G.STACK.top + 1 },
  aframeTop: { x: (G.AFRAME.beam.x0 + G.AFRAME.beam.x1) / 2, y: G.AFRAME.beam.y0 + 1.5 },
  radome: { x: G.RADOME.x, y: G.RADOME.y },
  deckSlot: { x: 748, y: G.AFT_DECK, w: 80 },
  /** the top of the superstructure (bridge roof), mid */
  deckTop: { x: 400, y: G.ROOF.y0 },
} as const;
export const MIDSHIP = SHIP_L / 2;

// --- the bob -----------------------------------------------------------------------------------------
/** A believable float: a slow heave and a slower roll/pitch out of phase (world px / degrees). */
export const BOB = { heave: 3.5, pitch: 0.45, period: 62 } as const;
export const bobAt = (S: number, amount = 1) => ({
  dy: amount * (BOB.heave * Math.sin((2 * Math.PI * S) / BOB.period) + 0.6 * Math.sin((2 * Math.PI * S) / 31 + 0.7)),
  rot: amount * BOB.pitch * Math.sin((2 * Math.PI * S) / (BOB.period * 1.37) + 1.3),
});
export const shipTransform = (x: number, S: number, amount = 1) => {
  const b = bobAt(S, amount);
  return `translate(${fx(x + MIDSHIP)} ${fx(b.dy)}) rotate(${fx(b.rot)}) translate(${fx(-MIDSHIP)} 0)`;
};
/** A ship-local point in world px for a ship with its bow tip at world x, with the bob of S applied. */
export const shipToWorld = (x: number, S: number, lx: number, ly: number, amount = 1): P2 => {
  const b = bobAt(S, amount);
  const a = (b.rot * Math.PI) / 180;
  const dx = lx - MIDSHIP;
  return { x: x + MIDSHIP + dx * Math.cos(a) - ly * Math.sin(a), y: b.dy + dx * Math.sin(a) + ly * Math.cos(a) };
};

// --- paths --------------------------------------------------------------------------------------------
const bar = (x1: number, y1: number, x2: number, y2: number, w: number) => {
  const l = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / l) * (w / 2);
  const ny = ((x2 - x1) / l) * (w / 2);
  return P([
    [x1 - nx, y1 - ny],
    [x2 - nx, y2 - ny],
    [x2 + nx, y2 + ny],
    [x1 + nx, y1 + ny],
  ]);
};
const circ = (cx: number, cy: number, r: number) => `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 0 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 0 ${f3(cx + r)} ${f3(cy)}Z`;
/** The hull: bow deck tip, the raked stem down to the forefoot, the keel, the skeg up to the transom, the aft
 *  work deck, the step and the sheer forward to the bow. */
export const HULL_PATH =
  `M0 ${G.BOW_DECK}C16 -84 36 -28 ${G.STEM_WL} 0C70 34 86 ${G.DRAFT - 6} 120 ${G.DRAFT}L770 ${G.DRAFT}` +
  `C800 ${G.DRAFT} 818 ${G.DRAFT - 12} 836 40C852 18 870 6 ${G.STERN_WL} 0L900 ${G.AFT_DECK}` +
  `L${G.STEP.x0} ${G.AFT_DECK}C${G.STEP.x0 - 10} ${G.AFT_DECK} ${G.STEP.x1 + 4} ${G.AFT_DECK - 12} ${G.STEP.x1} ${G.DECK}` +
  `L250 ${G.DECK}C150 ${G.DECK} 70 ${G.DECK - 10} 0 ${G.BOW_DECK}Z`;
const block = (l: { x0: number; x0t: number; x1: number; top: number }, base: number) =>
  P([
    [l.x0, base + 1],
    [l.x0t, l.top],
    [l.x1, l.top],
    [l.x1, base + 1],
  ]);
const L1 = block(G.LEVEL1, G.DECK);
const L2 = block(G.LEVEL2, G.LEVEL1.top);
const BR = block(G.BRIDGE, G.LEVEL2.top);
const ROOF = P([
  [G.ROOF.x0, G.ROOF.y0],
  [G.ROOF.x1, G.ROOF.y0],
  [G.ROOF.x1, G.ROOF.y1],
  [G.ROOF.x0, G.ROOF.y1],
]);
const STACK = P([
  [G.STACK.x0, G.LEVEL2.top + 1],
  [G.STACK.x0t, G.STACK.top],
  [G.STACK.x1t, G.STACK.top],
  [G.STACK.x1, G.LEVEL2.top + 1],
]);
const MAST = P([
  [G.MAST.x - 5, G.ROOF.y0 + 1],
  [G.MAST.x - 3, G.MAST.top],
  [G.MAST.x + 3, G.MAST.top],
  [G.MAST.x + 5, G.ROOF.y0 + 1],
]);
const RADOME = circ(G.RADOME.x, G.RADOME.y, G.RADOME.r);
const DOME2 = circ(G.DOME2.x, G.DOME2.y, G.DOME2.r);
const legX = (foot: number, y: number) => foot + (G.AFRAME.lean * (G.AFT_DECK - y)) / (G.AFT_DECK - G.AFRAME.top);
const AFRAME_LEGS = G.AFRAME.feet.map((x) => bar(x, G.AFT_DECK + 1, x + G.AFRAME.lean, G.AFRAME.top + 2, G.AFRAME.leg));
const AFRAME_BEAM = P([
  [G.AFRAME.beam.x0, G.AFRAME.beam.y0],
  [G.AFRAME.beam.x1, G.AFRAME.beam.y0 + 2],
  [G.AFRAME.beam.x1, G.AFRAME.beam.y1],
  [G.AFRAME.beam.x0, G.AFRAME.beam.y1],
]);
const AFRAME_FEET = G.AFRAME.feet.map((x) =>
  P([
    [x - 15, G.AFT_DECK + 1],
    [x - 8, G.AFT_DECK - 12],
    [x + 10, G.AFT_DECK - 12],
    [x + 15, G.AFT_DECK + 1],
  ]),
);
/** a white enclosed lifeboat on its davits, hung on level 2's side */
const LIFEBOAT = `M478 -192C478 -201 486 -205 500 -205L556 -205C568 -205 574 -199 574 -192C574 -182 566 -176 552 -176L500 -176C486 -176 478 -182 478 -192Z`;
/** the superstructure + masts + A-frame (white paint above the deck) */
const UPPER_PARTS = [L1, L2, BR, ROOF, STACK, MAST, ...AFRAME_LEGS, AFRAME_BEAM, ...AFRAME_FEET];
/** the union outline of the above-water ship (the sweep's clip) */
export const SHIP_ABOVE_SILHOUETTE = [HULL_PATH, ...UPPER_PARTS, RADOME, DOME2].join("");

// the lit top edges (local): every upward face
const LIT_EDGES = [
  `M2 ${G.BOW_DECK + 0.8}C70 ${G.DECK - 9.2} 150 ${G.DECK + 0.8} 250 ${G.DECK + 0.8}L${G.LEVEL1.x0} ${G.DECK + 0.8}`,
  `M${G.LEVEL1.x1} ${G.DECK + 0.8}L${G.STEP.x1} ${G.DECK + 0.8}`,
  `M${G.STEP.x0} ${G.AFT_DECK + 0.8}L${G.AFRAME.feet[0] - 15} ${G.AFT_DECK + 0.8}M${G.AFRAME.feet[0] + 15} ${G.AFT_DECK + 0.8}L${G.AFRAME.feet[1] - 15} ${G.AFT_DECK + 0.8}M${G.AFRAME.feet[1] + 15} ${G.AFT_DECK + 0.8}L899 ${G.AFT_DECK + 0.8}`,
  `M${G.LEVEL1.x0t + 1} ${G.LEVEL1.top + 0.8}L${G.LEVEL2.x0} ${G.LEVEL1.top + 0.8}M${G.LEVEL2.x1} ${G.LEVEL1.top + 0.8}L${G.LEVEL1.x1 - 1} ${G.LEVEL1.top + 0.8}`,
  `M${G.LEVEL2.x0t + 1} ${G.LEVEL2.top + 0.8}L${G.BRIDGE.x0} ${G.LEVEL2.top + 0.8}M${G.BRIDGE.x1} ${G.LEVEL2.top + 0.8}L${G.STACK.x0} ${G.LEVEL2.top + 0.8}M${G.STACK.x1} ${G.LEVEL2.top + 0.8}L${G.LEVEL2.x1 - 1} ${G.LEVEL2.top + 0.8}`,
  `M${G.ROOF.x0 + 1} ${G.ROOF.y0 + 0.8}L${G.MAST.x - 5} ${G.ROOF.y0 + 0.8}M${G.MAST.x + 5} ${G.ROOF.y0 + 0.8}L${G.ROOF.x1 - 1} ${G.ROOF.y0 + 0.8}`,
  `M${G.STACK.x0t + 1} ${G.STACK.top + 0.8}L${G.STACK.x1t - 1} ${G.STACK.top + 0.8}`,
  `M${G.AFRAME.beam.x0 + 1} ${G.AFRAME.beam.y0 + 0.8}L${G.AFRAME.beam.x1 - 1} ${G.AFRAME.beam.y0 + 2.8}`,
];
/** deck rails (a top rail and posts) along the open decks */
const railPath = (x0: number, x1: number, yAt: (x: number) => number, h = 11, pitch = 16) => {
  let d = "";
  for (let x = x0; x <= x1; x += 4) d += `${x === x0 ? "M" : "L"}${f3(x)} ${f3(yAt(x) - h)}`;
  for (let x = x0; x <= x1; x += pitch) d += `M${f3(x)} ${f3(yAt(x))}V${f3(yAt(x) - h)}`;
  return d;
};
const sheerAt = (x: number) => {
  // the bow deck's sheer (matches HULL_PATH's cubic from (250, DECK) to (0, BOW_DECK))
  if (x >= 250) return G.DECK;
  const t = 1 - x / 250;
  return G.DECK + (G.BOW_DECK - G.DECK) * Math.pow(t, 2.2);
};
const RAILS = [
  railPath(14, G.LEVEL1.x0 - 6, sheerAt),
  railPath(G.STEP.x0 + 8, 892, () => G.AFT_DECK, 10, 18),
  railPath(G.LEVEL1.x0t + 4, G.LEVEL2.x0 - 4, () => G.LEVEL1.top, 9, 12),
  railPath(G.LEVEL2.x1 + 4, G.LEVEL1.x1 - 4, () => G.LEVEL1.top, 9, 12),
  railPath(G.ROOF.x0 + 6, G.ROOF.x1 - 6, () => G.ROOF.y0, 8, 14),
].join("");
const PORTHOLES = Array.from({ length: 18 }, (_, i) => 112 + i * 32).filter((x) => x < 625);
const L1_WINDOWS = Array.from({ length: 13 }, (_, i) => 300 + i * 25).filter((x) => x < 604);
const L2_WINDOWS = Array.from({ length: 9 }, (_, i) => 316 + i * 25).filter((x) => x < 500);
const bridgeFrontAt = (y: number) => lerp(G.BRIDGE.x0, G.BRIDGE.x0t, (G.LEVEL2.top - y) / (G.LEVEL2.top - G.BRIDGE.top));
const WIN = { y0: -248, y1: -228 } as const;
const BRIDGE_GLASS = P([
  [bridgeFrontAt(WIN.y0) + 5, WIN.y0],
  [G.BRIDGE.x1 - 8, WIN.y0],
  [G.BRIDGE.x1 - 8, WIN.y1],
  [bridgeFrontAt(WIN.y1) + 5, WIN.y1],
]);
const MULLIONS = Array.from({ length: 9 }, (_, i) => bridgeFrontAt(WIN.y1) + 5 + 17 * (i + 1)).filter((x) => x < G.BRIDGE.x1 - 12);

/** Paint (white ship in warm low sun). */
export const PAINT = {
  hi: "#F6F0E3",
  mid: "#E3DBCB",
  lo: "#BDB4A3",
  deep: "#8F877A",
  line: "#9A9282",
  glassHi: "#7C7365",
  glass: "#3A332C",
  glassLo: "#28231E",
  boot: "#2B241F",
  antifoul: "#7C3F2C",
  antifoulLo: "#3F241B",
  rail: "#8B8476",
  steel: "#B8B1A3",
} as const;

export type ShipProps = {
  /** world x of the bow tip (the ship floats on world y 0) */
  x: number;
  /** story clock (the bob) */
  S: number;
  /** 0 = still on the water .. 1 = the full bob */
  bob?: number;
  /** "above": the ship over the waterline (SeaStage `above`); "below": the hull under water (SeaStage `below`) */
  part: "above" | "below";
  /** 0..1 the slot cut into the aft work deck (cut 2) */
  deckSlot?: number;
  /** current camera zoom (hairlines are SCREEN px) */
  k: number;
  /** drawn in SHIP-LOCAL px inside the bob transform, over the ship (above part only): cut 2's column */
  front?: React.ReactNode;
  /** 0..1 a light sweep (the click) across the above-water ship */
  sweep?: number;
  /** V2: the low sun's glint travelling the ship, its centre at ship-local x (outside -300..1200: none); a broad
   *  soft warm band on the paint (stronger on the upper works), catching each window, the rails, the lit edges
   *  and the domes as it passes */
  glint?: number;
  /** V2 r3: a glint spreading out from ship-local x `origin`, its two fronts at origin +- r, strength a */
  glintRing?: { origin: number; r: number; a: number } | null;
};

/**
 * ResearchShip — the clip's survey ship. Above: hull (white, a darker band at the boot-top), superstructure
 * (three levels, bridge with its window band, wings), the mast with its radome and a second dome, the funnel
 * with its band, a lifeboat on davits, rails, portholes and windows, the stern A-frame (two legs on the deck,
 * head beam, block and wire); lit from the upper left (paint gradients + lit top edges + a soft shadow under
 * every overhang). Below: the hull under water in antifouling red-brown, its keel, sonar gondola, skeg,
 * rudder and propeller, fogged into the water (InFog), the light falling off with depth.
 */
export const ResearchShip: React.FC<ShipProps> = ({ x, S, bob = 1, part, deckSlot = 0, k, front, sweep = -1, glint = -9999, glintRing = null }) => {
  const uid = uidOf(useId());
  const tr = shipTransform(x, S, bob);
  const px = 1 / k;
  if (part === "below") {
    return (
      <InFog amount={(y) => clamp01(0.08 + 0.42 * smoothstep(y / 130))}>
        <g transform={tr}>
          <defs>
            <clipPath id={`${uid}u`}>
              <rect x={-60} y={-8} width={SHIP_L + 120} height={400} />
            </clipPath>
            <linearGradient id={`${uid}af`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={G.DRAFT + 24}>
              <stop offset="0" stopColor={PAINT.antifoul} />
              <stop offset="1" stopColor={PAINT.antifoulLo} />
            </linearGradient>
            <linearGradient id={`${uid}cau`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="60">
              <stop offset="0" stopColor={OCEAN.cream} stopOpacity="0.32" />
              <stop offset="1" stopColor={OCEAN.cream} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${uid}bilge`} gradientUnits="userSpaceOnUse" x1="0" y1={G.DRAFT - 30} x2="0" y2={G.DRAFT + 2}>
              <stop offset="0" stopColor="#1E140F" stopOpacity="0" />
              <stop offset="1" stopColor="#1E140F" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id={`${uid}shadow`} gradientUnits="userSpaceOnUse" x1="0" y1={G.DRAFT} x2="0" y2={G.DRAFT + 420}>
              <stop offset="0" stopColor="#14201D" stopOpacity="0.38" />
              <stop offset="1" stopColor="#14201D" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* the ship's shadow in the water: a darker column under the hull, fading with depth */}
          <path d={`M110 ${G.DRAFT - 10}L790 ${G.DRAFT - 10}L940 ${G.DRAFT + 420}L250 ${G.DRAFT + 420}Z`} fill={`url(#${uid}shadow)`} style={{ filter: "blur(22px)" }} />
          <g clipPath={`url(#${uid}u)`}>
            <path d={HULL_PATH} fill={`url(#${uid}af)`} />
            <path d={HULL_PATH} fill={`url(#${uid}bilge)`} />
            {/* the boot-top at and just under the waterline */}
            <g clipPath={`url(#${uid}h)`}>
              <rect x={0} y={-8} width={SHIP_L} height={20} fill={PAINT.boot} />
            </g>
            {/* light from the surface on the upper hull (rippling) */}
            <path d={HULL_PATH} fill={`url(#${uid}cau)`} opacity={f3(0.75 + 0.25 * Math.sin(S / 9))} />
            {/* the sonar gondola under the keel */}
            <path
              d={`M${G.GONDOLA.x0} ${G.DRAFT - 2}C${G.GONDOLA.x0 + 6} ${G.DRAFT + G.GONDOLA.depth} ${G.GONDOLA.x0 + 24} ${G.DRAFT + G.GONDOLA.depth} ${G.GONDOLA.x0 + 40} ${G.DRAFT + G.GONDOLA.depth}L${G.GONDOLA.x1} ${G.DRAFT + G.GONDOLA.depth - 4}L${G.GONDOLA.x1 + 10} ${G.DRAFT - 2}Z`}
              fill={PAINT.antifoulLo}
            />
            <path d={`M${G.GONDOLA.x0 + 20} ${G.DRAFT}L${G.GONDOLA.x0 + 34} ${G.DRAFT + G.GONDOLA.depth - 2}`} stroke={PAINT.antifoul} strokeWidth={3} />
            {/* the skeg, rudder and propeller */}
            <path d={`M836 40L846 92L874 92L878 36Z`} fill={PAINT.antifoulLo} />
            <ellipse cx={828} cy={58} rx={5} ry={24} fill="#5C4A38" />
            <ellipse cx={828} cy={58} rx={2} ry={22} fill="#8A735A" opacity={0.6} />
            <path d={`M818 58H836`} stroke="#3E2F24" strokeWidth={4} />
          </g>
          <defs>
            <clipPath id={`${uid}h`}>
              <path d={HULL_PATH} />
            </clipPath>
          </defs>
        </g>
      </InFog>
    );
  }
  const slotW = (SHIP_PTS.deckSlot.w + 4 * px) * clamp01(deckSlot);
  return (
    <g transform={tr}>
      <defs>
        <linearGradient id={`${uid}hull`} gradientUnits="userSpaceOnUse" x1="0" y1={G.BOW_DECK} x2="0" y2="0">
          <stop offset="0" stopColor={PAINT.hi} />
          <stop offset="0.55" stopColor={PAINT.mid} />
          <stop offset="1" stopColor={PAINT.lo} />
        </linearGradient>
        <linearGradient id={`${uid}side`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={SHIP_L} y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#5A4A38" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${uid}sup`} gradientUnits="userSpaceOnUse" x1="0" y1={G.RADOME.y - G.RADOME.r} x2="0" y2={G.DECK}>
          <stop offset="0" stopColor={PAINT.hi} />
          <stop offset="0.7" stopColor={PAINT.mid} />
          <stop offset="1" stopColor={PAINT.lo} />
        </linearGradient>
        <linearGradient id={`${uid}glass`} gradientUnits="userSpaceOnUse" x1="0" y1={WIN.y0} x2="0" y2={WIN.y1}>
          <stop offset="0" stopColor={PAINT.glassHi} />
          <stop offset="0.45" stopColor={PAINT.glass} />
          <stop offset="1" stopColor={PAINT.glassLo} />
        </linearGradient>
        <radialGradient id={`${uid}dome`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor={PAINT.hi} />
          <stop offset="0.85" stopColor={PAINT.lo} />
          <stop offset="1" stopColor={PAINT.deep} />
        </radialGradient>
        <linearGradient id={`${uid}boat`} gradientUnits="userSpaceOnUse" x1="0" y1="-205" x2="0" y2="-176">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={PAINT.lo} />
        </linearGradient>
        <clipPath id={`${uid}hc`}>
          <path d={HULL_PATH} />
        </clipPath>
        <clipPath id={`${uid}all`}>
          <path d={SHIP_ABOVE_SILHOUETTE} />
        </clipPath>
        <filter id={`${uid}soft`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* the far A-frame wire and the masts' whips (behind) */}
      <path d={`M${G.ROOF.x1 - 18} ${G.ROOF.y0}V-300M${G.ROOF.x0 + 30} ${G.ROOF.y0}V-292`} stroke={PAINT.rail} strokeWidth={f3(1.6 * Math.max(1, px))} />

      {/* the superstructure, masts, A-frame: white paint, lit from above */}
      <path d={UPPER_PARTS.join("")} fill={`url(#${uid}sup)`} />
      {/* the hull */}
      <path d={HULL_PATH} fill={`url(#${uid}hull)`} />
      <path d={HULL_PATH} fill={`url(#${uid}side)`} />
      {/* the boot-top band at the waterline */}
      <g clipPath={`url(#${uid}hc)`}>
        <rect x={0} y={-13} width={SHIP_L} height={20} fill={PAINT.boot} />
        <rect x={0} y={-14.5} width={SHIP_L} height={1.6} fill={PAINT.hi} opacity={0.5} />
        {/* the shadow under the deck edge (the bulwark's overhang) */}
        <path d={`M0 ${G.BOW_DECK + 3}C70 ${G.DECK - 7} 150 ${G.DECK + 3} 250 ${G.DECK + 3}L${G.STEP.x1} ${G.DECK + 3}L${G.STEP.x0} ${G.AFT_DECK + 3}L900 ${G.AFT_DECK + 3}`} fill="none" stroke={PAINT.deep} strokeWidth={7} opacity={0.35} filter={`url(#${uid}soft)`} />
      </g>
      {/* the hull's rubbing strake */}
      <path
        d={`M6 ${G.BOW_DECK + 18}C70 ${G.DECK + 6} 150 ${G.DECK + 15} 250 ${G.DECK + 15}L${G.STEP.x1 - 4} ${G.DECK + 15}C${G.STEP.x1 + 6} ${G.DECK + 27} ${G.STEP.x1 + 10} ${G.AFT_DECK + 15} ${G.STEP.x0 + 6} ${G.AFT_DECK + 15}L897 ${G.AFT_DECK + 15}`}
        fill="none"
        stroke={PAINT.lo}
        strokeWidth={3}
      />
      {/* the hawse at the bow and a little honest weathering: rust weeping from the hawse and the scuppers */}
      <g clipPath={`url(#${uid}hc)`}>
        <g opacity={0.32} filter={`url(#${uid}soft)`}>
          <path d="M66 -84C66 -60 70 -40 74 -20" stroke="#8A5A3C" strokeWidth={5} fill="none" />
          {[180, 330, 470, 590].map((xx) => (
            <path key={xx} d={`M${xx} -90V${-90 + 30 + (xx % 3) * 8}`} stroke="#8A6A4E" strokeWidth={3} />
          ))}
        </g>
        {/* the hawse pipe (its anchor housed flush: no anchor shape, which would echo the Navy card) */}
        <ellipse cx={68} cy={-92} rx={9} ry={7} fill={PAINT.lo} />
        <ellipse cx={68} cy={-91} rx={6.5} ry={5} fill={PAINT.glassLo} />
      </g>
      {/* shadows under each level's overhang onto the level below (soft) */}
      <g filter={`url(#${uid}soft)`} opacity={0.42}>
        <rect x={G.LEVEL1.x0} y={G.DECK - 4} width={G.LEVEL1.x1 - G.LEVEL1.x0} height={6} fill={PAINT.deep} />
        <rect x={G.LEVEL2.x0} y={G.LEVEL1.top - 4} width={G.LEVEL2.x1 - G.LEVEL2.x0} height={6} fill={PAINT.deep} />
        <rect x={G.BRIDGE.x0} y={G.LEVEL2.top - 4} width={G.STACK.x1 - G.BRIDGE.x0} height={6} fill={PAINT.deep} />
        <rect x={G.ROOF.x0} y={G.ROOF.y1} width={G.ROOF.x1 - G.ROOF.x0} height={7} fill={PAINT.deep} />
      </g>
      {/* windows and portholes */}
      <g fill={PAINT.glass}>
        {PORTHOLES.map((p) => (
          <circle key={p} cx={p} cy={-56} r={3.8} />
        ))}
        {L1_WINDOWS.map((p) => (
          <rect key={p} x={p} y={-146} width={13} height={10} rx={1.5} />
        ))}
        {L2_WINDOWS.map((p) => (
          <rect key={p} x={p} y={-194} width={13} height={10} rx={1.5} />
        ))}
      </g>
      <g fill={PAINT.glassHi} opacity={0.6}>
        {L1_WINDOWS.map((p) => (
          <rect key={p} x={p + 1} y={-146} width={11} height={3} rx={1} />
        ))}
        {L2_WINDOWS.map((p) => (
          <rect key={p} x={p + 1} y={-194} width={11} height={3} rx={1} />
        ))}
      </g>
      <path d={BRIDGE_GLASS} fill={`url(#${uid}glass)`} />
      <g stroke={PAINT.mid} strokeWidth={2.2}>
        {MULLIONS.map((m) => (
          <line key={m} x1={f3(m)} x2={f3(m)} y1={WIN.y0} y2={WIN.y1} />
        ))}
      </g>
      {/* the funnel's bands */}
      <path d={P([[G.STACK.x0t + 0.2, G.STACK.top + 1], [G.STACK.x1t, G.STACK.top + 1], [G.STACK.x1t - 0.3, G.STACK.top + 11], [G.STACK.x0t + 0.6, G.STACK.top + 11]])} fill={PAINT.boot} />
      <path d={P([[G.STACK.x0t + 0.8, G.STACK.top + 15], [G.STACK.x1t - 0.4, G.STACK.top + 15], [G.STACK.x1t - 0.6, G.STACK.top + 20], [G.STACK.x0t + 1, G.STACK.top + 20]])} fill={PAINT.line} />
      {/* the lifeboat on its davits */}
      <path d={`M488 -210V-198M562 -210V-198`} stroke={PAINT.rail} strokeWidth={3} />
      <path d={LIFEBOAT} fill={`url(#${uid}boat)`} />
      <path d={`M484 -186H570`} stroke={PAINT.lo} strokeWidth={2} />
      {/* the mast's yard and platform, the radome, the second dome */}
      <path d={bar(G.MAST.x - 22, -292, G.MAST.x + 22, -292, 3.5)} fill={PAINT.steel} />
      {/* the radar scanner: a long thin bar on its pedestal */}
      <path d={P([[G.MAST.x - 30, -305], [G.MAST.x + 30, -305], [G.MAST.x + 28, -300], [G.MAST.x - 28, -300]])} fill={PAINT.lo} />
      <path d={P([[G.MAST.x - 3, -300], [G.MAST.x + 3, -300], [G.MAST.x + 3, -296], [G.MAST.x - 3, -296]])} fill={PAINT.deep} />
      <path d={P([[G.MAST.x - 14, G.MAST.top + 3], [G.MAST.x + 14, G.MAST.top + 3], [G.MAST.x + 14, G.MAST.top - 2], [G.MAST.x - 14, G.MAST.top - 2]])} fill={PAINT.mid} />
      {/* V2: the masthead fitting (a short pole and a cap) */}
      <path d={P([[G.MAST.x - 2.5, G.MAST.top - 2], [G.MAST.x + 2.5, G.MAST.top - 2], [G.MAST.x + 2.5, G.MASTHEAD.y + 4], [G.MAST.x - 2.5, G.MASTHEAD.y + 4]])} fill={PAINT.lo} />
      <path d={P([[G.MAST.x - 6, G.MASTHEAD.y + 4], [G.MAST.x + 6, G.MASTHEAD.y + 4], [G.MAST.x + 5, G.MASTHEAD.y - 2], [G.MAST.x - 5, G.MASTHEAD.y - 2]])} fill={PAINT.mid} />
      {/* V2: the big radome on its pedestal at the bridge roof's front */}
      <path d={P([[G.RADOME.x - 7, G.ROOF.y0 + 1], [G.RADOME.x + 7, G.ROOF.y0 + 1], [G.RADOME.x + 5, G.RADOME.y + G.RADOME.r - 3], [G.RADOME.x - 5, G.RADOME.y + G.RADOME.r - 3]])} fill={PAINT.mid} />
      <path d={RADOME} fill={`url(#${uid}dome)`} />
      <path d={DOME2} fill={`url(#${uid}dome)`} />
      <path d={`M${G.DOME2.x - 6} ${G.ROOF.y0 + 1}V${G.DOME2.y + G.DOME2.r - 2}H${G.DOME2.x + 6}V${G.ROOF.y0 + 1}`} fill={PAINT.mid} />
      {/* the A-frame's block and its wire down to the water line */}
      <path d={P([[G.AFRAME.beam.x1 - 13, G.AFRAME.beam.y1 - 1], [G.AFRAME.beam.x1 - 2, G.AFRAME.beam.y1 - 1], [G.AFRAME.beam.x1 - 3, G.AFRAME.beam.y1 + 15], [G.AFRAME.beam.x1 - 12, G.AFRAME.beam.y1 + 15]])} fill={PAINT.deep} />
      <path d={`M${G.AFRAME.beam.x1 - 7.5} ${G.AFRAME.beam.y1 + 15}V${G.AFT_DECK - 30}`} stroke={PAINT.rail} strokeWidth={1.5} />
      <path d={bar(legX(G.AFRAME.feet[0], -140), -140, legX(G.AFRAME.feet[1], -140), -140, 4)} fill={PAINT.lo} />
      {/* rails */}
      <path d={RAILS} fill="none" stroke={PAINT.rail} strokeWidth={1.6} opacity={0.85} />
      {/* the lit top edges (the sun, upper left) */}
      <g fill="none" stroke="#FFFBF0" strokeWidth={f3(Math.max(1.4, 1.6 * px))} opacity={0.9}>
        {LIT_EDGES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* the deck slot (cut 2) */}
      {slotW > 0.01 ? (
        <rect x={f3(SHIP_PTS.deckSlot.x - slotW / 2)} y={f3(G.AFT_DECK - 2.5)} width={f3(slotW)} height={5} fill={PAINT.boot} opacity={0.85} />
      ) : null}
      {/* the click: one light sweep across the ship */}
      {sweep > 0 && sweep < 1 ? (
        <g clipPath={`url(#${uid}all)`}>
          <LightSweep x={-10} y={-380} w={SHIP_L + 20} h={366} k={k} t={sweep} on="cream" r={0} />
        </g>
      ) : null}
      {glint > -300 && glint < SHIP_L + 300 ? <Glint uid={uid} prof={(xx) => glintAt(xx, glint)} px={px} /> : null}
      {glintRing && glintRing.a > 0.01 ? (
        <Glint uid={`${uid}r`} prof={(xx) => glintRing.a * Math.exp(-Math.pow((Math.abs(xx - glintRing.origin) - glintRing.r) / GLINT.w, 2))} px={px} />
      ) : null}
      {front ?? null}
    </g>
  );
};

/** The glint's profile across the ship: a soft gaussian of half-width GLINT.w (ship-local px). */
export const GLINT = { w: 120, win: 1, rail: 1, dome: 1 } as const;
const glintAt = (x: number, gx: number) => Math.exp(-Math.pow((x - gx) / GLINT.w, 2));
const Glint: React.FC<{ uid: string; prof: (x: number) => number; px: number }> = ({ uid, prof, px }) => {
  const stops = Array.from({ length: 57 }, (_, i) => {
    const xx = -400 + ((SHIP_L + 800) * i) / 56;
    return { off: i / 56, a: clamp01(prof(xx)) };
  });
  const wins: { x: number; y: number; w: number; h: number }[] = [
    ...L1_WINDOWS.map((p) => ({ x: p, y: -146, w: 13, h: 10 })),
    ...L2_WINDOWS.map((p) => ({ x: p, y: -194, w: 13, h: 10 })),
  ];
  return (
    <g style={{ pointerEvents: "none" }}>
      <defs>
        <linearGradient id={`${uid}gl`} gradientUnits="userSpaceOnUse" x1={-400} y1="0" x2={SHIP_L + 400} y2="0">
          {stops.map((s, i) => (
            <stop key={i} offset={f3(clamp01(s.off))} stopColor="#FFFFFF" stopOpacity={f3(s.a)} />
          ))}
        </linearGradient>
        <mask id={`${uid}gm`} maskUnits="userSpaceOnUse" x={-400} y={-420} width={SHIP_L + 800} height={460}>
          <rect x={-400} y={-420} width={SHIP_L + 800} height={460} fill={`url(#${uid}gl)`} />
        </mask>
      </defs>
      {/* a warm rim running along every lit top edge and rail as the light passes (no band, no halo) */}
      <g mask={`url(#${uid}gm)`} fill="none" stroke="#FFF2CF" opacity={GLINT.rail}>
        <path d={RAILS} strokeWidth={3.2} />
        {LIT_EDGES.map((d, i) => (
          <path key={i} d={d} strokeWidth={f3(Math.max(3.6, 4.4 * px))} />
        ))}
      </g>
      {/* the glass catches the sun: a crisp diagonal specular streak across each pane (the dark glass stays) */}
      <g fill="#FFF6DE">
        {wins.map((w, i) => {
          const a = prof(w.x) * GLINT.win;
          return a > 0.03 ? <path key={i} d={P([[w.x + 1.5, w.y + w.h], [w.x + 5.5, w.y], [w.x + 11.5, w.y], [w.x + 7.5, w.y + w.h]])} opacity={f3(a)} /> : null;
        })}
        {MULLIONS.map((m, i) => {
          const a = prof(m) * GLINT.win;
          return a > 0.03 ? <path key={`m${i}`} d={P([[m - 15, WIN.y1 - 1], [m - 8, WIN.y0 + 1], [m - 1.5, WIN.y0 + 1], [m - 8.5, WIN.y1 - 1]])} opacity={f3(a)} /> : null;
        })}
        {PORTHOLES.map((p) => {
          const a = prof(p) * GLINT.win;
          return a > 0.03 ? <circle key={p} cx={p - 1.2} cy={-57.2} r={1.5} opacity={f3(a)} /> : null;
        })}
      </g>
      {/* the domes: a specular spot */}
      {[G.RADOME, G.DOME2].map((d, i) => {
        const a = prof(d.x) * GLINT.dome;
        return a > 0.02 ? <circle key={i} cx={d.x - d.r * 0.35} cy={d.y - d.r * 0.4} r={d.r * 0.42} fill="#FFFFFF" opacity={f3(a)} style={{ filter: `blur(${f3(d.r * 0.18)}px)` }} /> : null;
      })}
    </g>
  );
};

// --- V2 r3: the wash along the waterline -----------------------------------------------------------------
/** WashLine (above, world): foam lapping along the hull's waterline, always moving: broken cream wavelets that
 *  ride the waterline (y 0) between the stem and the stern, sliding aft and rising and falling with the swell. */
export const WashLine: React.FC<{ x: number; S: number; k: number }> = ({ x, S, k }) => {
  const px = 1 / k;
  const segs: React.ReactNode[] = [];
  const x0 = x + SHIP_GEO.STEM_WL - 14;
  const x1 = x + SHIP_GEO.STERN_WL + 18;
  const n = 34;
  for (let i = 0; i < n; i++) {
    const h = hash01(i * 3.13 + 0.7);
    const span = x1 - x0;
    const u = (((i / n) * span + S * (0.9 + 0.5 * h)) % span + span) % span;
    const xx = x0 + u;
    const len = 14 + 26 * hash01(i * 1.77 + 2);
    const y = -2.2 + 1.6 * Math.sin(S * 0.19 + i * 1.3) + 1.2 * Math.sin(xx / 37 + S * 0.11);
    const a = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(S * 0.23 + i * 2.1));
    segs.push(
      <path key={i} d={`M${f3(xx)} ${f3(y)}q${f3(len / 2)} ${f3(-2.4)} ${f3(len)} 0`} stroke={OCEAN.cream} strokeOpacity={f3(a)} strokeWidth={f3(Math.max(2, 2.6 * px))} fill="none" strokeLinecap="round" />,
    );
  }
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={f3(x0)} y={-4.5} width={f3(x1 - x0)} height={4.5} fill={OCEAN.cream} opacity={0.18 + 0.06 * Math.sin(S * 0.17)} style={{ filter: "blur(1.5px)" }} />
      {segs}
    </g>
  );
};

// --- wake ----------------------------------------------------------------------------------------------
/** SurfaceWake (above, world): the bow wave climbing the stem and foam streaks laid astern on the surface,
 *  spreading and dissipating. `bowAt(f)` = the bow tip's world x at frame f; vMax its cruise speed. */
export const SurfaceWake: React.FC<{ f: number; bowAt: (f: number) => number; vMax: number; k: number; span?: number }> = ({ f, bowAt, vMax, k, span = 46 }) => {
  const px = 1 / k;
  const speed = (p: number) => Math.max(0, bowAt(p - 1) - bowAt(p)) / vMax;
  const segs: React.ReactNode[] = [];
  for (let p = Math.floor(f); p > f - span; p--) {
    const s = speed(p);
    if (s < 0.02) continue;
    const age = f - p;
    const a = s * Math.pow(1 - age / span, 1.6);
    const x0 = bowAt(p) + SHIP_GEO.STERN_WL - 6;
    const x1 = bowAt(p - 1) + SHIP_GEO.STERN_WL - 6;
    const spread = 1 + age * 0.2;
    // churned foam on the surface astern: a thick band at the waterline, lumpy, thinning as it spreads
    const lump = 0.7 + 0.6 * hash01(p * 1.37);
    segs.push(
      <g key={p} opacity={f3(clamp01(a * 0.95))}>
        <path d={`M${f3(x0)} ${f3(-3 * lump - spread)}L${f3(x1)} ${f3(-3 * lump - spread)}`} stroke={OCEAN.cream} strokeWidth={f3(Math.max(3, 9 * lump - age * 0.12))} strokeLinecap="round" />
        <path d={`M${f3(x0)} ${f3(-1)}L${f3(x1)} ${f3(-1)}`} stroke="#FFFFFF" strokeWidth={f3(2.2 * Math.max(1, px))} strokeLinecap="round" opacity={0.8} />
      </g>,
    );
  }
  const sNow = speed(f);
  const stem = bowAt(f) + SHIP_GEO.STEM_WL;
  return (
    <g style={{ pointerEvents: "none" }}>
      {segs}
      {sNow > 0.02 ? (
        <g opacity={f3(clamp01(sNow * 1.1))} fill={OCEAN.cream} style={{ filter: "blur(1.2px)" }}>
          {/* the bow wave: a foam roll pushed ahead of the stem, climbing it */}
          <path d={`M${f3(stem - 90 * sNow)} 1Q${f3(stem - 36 * sNow)} ${f3(-10 * sNow)} ${f3(stem + 2)} ${f3(-30 * sNow)}L${f3(stem + 12)} ${f3(-22 * sNow)}L${f3(stem + 16)} 1Z`} />
          <ellipse cx={f3(stem - 14)} cy={-2} rx={f3(56 * sNow + 8)} ry={f3(4 + 3 * sNow)} opacity={0.85} />
          {/* the bow wave rolling aft along the hull, and foam all along its waterline */}
          <path d={`M${f3(stem + 10)} -2Q${f3(stem + 120)} ${f3(-14 * sNow)} ${f3(stem + 260)} -3Z`} opacity={0.6} />
          <rect x={f3(stem)} y={-5} width={f3(SHIP_GEO.STERN_WL - SHIP_GEO.STEM_WL)} height={5} opacity={0.45 * sNow} />
        </g>
      ) : null}
    </g>
  );
};
/** BubbleTrail (below, world): the propeller's bubbles astern, rising and spreading as they dissipate. */
const j0 = (p: number) => p % 2 === 0;
export const BubbleTrail: React.FC<{ f: number; bowAt: (f: number) => number; vMax: number; span?: number }> = ({ f, bowAt, vMax, span = 56 }) => {
  const speed = (p: number) => Math.max(0, bowAt(p - 1) - bowAt(p)) / vMax;
  const dots: React.ReactNode[] = [];
  for (let p = Math.floor(f); p > f - span; p--) {
    const s = speed(p);
    if (s < 0.02) continue;
    const age = f - p;
    const base = bowAt(p) + 828;
    // the churn: a pale turbulent cloud of fine bubbles behind the propeller, spreading and thinning
    if (j0(p)) {
      const cx = base + 8 + age * 1.4;
      dots.push(
        <ellipse key={`c${p}`} cx={f3(cx)} cy={f3(54 - age * 0.35)} rx={f3(10 + age * 1.6)} ry={f3(8 + age * 0.7)} fill={OCEAN.cream} opacity={f3(clamp01(s * 0.16 * (1 - age / span)))} style={{ filter: "blur(6px)" }} />,
      );
    }
    for (let j = 0; j < 7; j++) {
      const h = hash01(p * 7.3 + j * 13.1);
      const h2 = hash01(p * 3.1 + j * 5.7 + 2);
      const x = base + (h - 0.3) * (16 + age * 2.4);
      const y = 56 + (h2 - 0.5) * (22 + age * 1.3) - age * 0.6;
      if (y < 4) continue;
      const r = 1.5 + 3.2 * hash01(p + j * 1.7) * (1 - age / span) + age * 0.03;
      const a = s * (0.8 - 0.65 * (age / span)) * (0.45 + 0.55 * h2);
      dots.push(<circle key={`${p}-${j}`} cx={f3(x)} cy={f3(y)} r={f3(r)} fill={OCEAN.cream} opacity={f3(clamp01(a))} />);
    }
  }
  return <g style={{ pointerEvents: "none" }}>{dots}</g>;
};

// --- the stage ---------------------------------------------------------------------------------------
export type SeaStageProps = {
  /** story clock */
  S: number;
  cam: Cam;
  /** the cut's opening camera (parallax origin for snow and rays) */
  rest: Cam;
  /** world children UNDER the water (z = 0, fogged by oceanShared) */
  below?: React.ReactNode;
  /** world children ABOVE the water (clipped above the waterline) */
  above?: React.ReactNode;
  /** world children drawn above everything above the water (cards, lines), not clipped */
  top?: React.ReactNode;
  sway?: boolean;
  /** V2 r3: px / frame the rays' and snow's parallax origin travels (a slow sideways drift under water) */
  drift?: number;
  /** god rays under the surface (0..1) */
  rays?: number;
  snow?: number;
};
/**
 * SeaStage — the over/under frame. OceanStage draws the underwater (water by depth and angle, marine snow,
 * the grade, vignette, grain); its overlay draws the rays from the surface, then the above-water half in
 * WORLD coordinates under the same camera and sway: the sky (screen-fixed: it is at infinity), the sun, the
 * horizon haze, the far sea band and its glints, `above` (clipped above the rippling waterline), the
 * meniscus and the lit underside of the surface, and finally `top`.
 */
export const SeaStage: React.FC<SeaStageProps> = ({ S, cam, rest: rest0, below, above, top, sway = true, rays = 1, snow = 1, drift = 0 }) => {
  const rest = { ...rest0, x: rest0.x - S * drift };
  const uid = uidOf(useId());
  const sw = sway ? seaSway(S) : { x: 0, y: 0 };
  const v = seaView(S, cam, sway);
  const split = v.root.a * SEA_SCENE.surfaceY + v.root.by; // the waterline's screen y (with sway)
  const hor = split - SEA_BAND * Math.sqrt(cam.k);
  const pts: string[] = [];
  for (let xx = -40; xx <= 1120; xx += 20) pts.push(`${f3(xx)} ${f3(split + wave(xx + cam.x * cam.k * 0.0, S))}`);
  const clipD = `M-40 -60H1120V${f3(split + wave(1120, S))}L${[...pts].reverse().join("L")}Z`;
  const line = `M${pts.join("L")}`;
  const glints = Array.from({ length: 52 }, (_, i) => {
    const h1 = hash01(i * 3.7 + 1);
    const h2 = hash01(i * 5.1 + 2);
    const h3 = hash01(i * 7.9 + 3);
    const yy = hor + (split - hor) * Math.pow(h2, 0.75);
    const depthT = (yy - hor) / Math.max(1, split - hor);
    const len = 4 + 24 * h3 * (0.4 + depthT);
    const xx = ((h1 * 1300 + S * (0.5 + 0.7 * h3) - (cam.x - rest.x) * cam.k * (0.2 + depthT)) % 1300 + 1300) % 1300 - 110;
    return <path key={i} d={`M${f3(xx)} ${f3(yy)}h${f3(len)}`} stroke={SEA_UP.glint} strokeOpacity={f3(0.18 + 0.36 * h1 * (1 - depthT * 0.4))} strokeWidth={f3(0.8 + 1.3 * depthT)} strokeLinecap="round" />;
  });
  const world = `matrix(${fx(v.root.a)} 0 0 ${fx(v.root.a)} ${fx(v.root.bx)} ${fx(v.root.by)})`;
  const overlay = (
    <>
      {rays > 0 ? <GodRays v={v} rest={rest} strength={rays} top={split} /> : null}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <clipPath id={`${uid}a`}>
            <path d={clipD} />
          </clipPath>
          <linearGradient id={`${uid}sky`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor - 1250)} x2="0" y2={f3(hor)}>
            <stop offset="0" stopColor={SKY.top} />
            <stop offset="0.24" stopColor={SKY.upper} />
            <stop offset="0.46" stopColor={SKY.amber} />
            <stop offset="0.66" stopColor={SKY.mid} />
            <stop offset="0.83" stopColor={SKY.low} />
            <stop offset="0.93" stopColor={SKY.glow} />
            <stop offset="1" stopColor={SKY.haze} />
          </linearGradient>
          <radialGradient id={`${uid}sun`} gradientUnits="userSpaceOnUse" cx={f3(230 + sw.x)} cy={f3(hor - 300)} r={760}>
            <stop offset="0" stopColor={SKY.sun} stopOpacity="0.7" />
            <stop offset="0.35" stopColor={SKY.sun} stopOpacity="0.24" />
            <stop offset="1" stopColor={SKY.sun} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}sea`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor)} x2="0" y2={f3(split + 6)}>
            <stop offset="0" stopColor={SEA_UP.far} />
            <stop offset="0.35" stopColor={SEA_UP.mid} />
            <stop offset="1" stopColor={SEA_UP.near} />
          </linearGradient>
          <linearGradient id={`${uid}under`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(split)} x2="0" y2={f3(split + 40)}>
            <stop offset="0" stopColor={OCEAN.sky} stopOpacity="0.5" />
            <stop offset="1" stopColor={OCEAN.sky} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${uid}a)`}>
          <rect x={-40} y={-60} width={1160} height={Math.max(0, hor + 61)} fill={`url(#${uid}sky)`} />
          <rect x={-40} y={-60} width={1160} height={Math.max(0, hor + 61)} fill={`url(#${uid}sun)`} />
          {/* a few long, soft cloud banks drifting slowly (at a great distance: little parallax) */}
          <g style={{ filter: "blur(16px)" }}>
            {CLOUDS.map((c, i) => {
              const cx = ((c.x + S * c.v - (cam.x - rest.x) * cam.k * 0.06) % 1700 + 1700) % 1700 - 300;
              return <ellipse key={i} cx={f3(cx)} cy={f3(hor - c.h)} rx={c.w} ry={c.t} fill={c.h > 380 ? SKY.cloudHi : SKY.cloudLo} opacity={c.a} />;
            })}
          </g>
          <rect x={-40} y={f3(hor - 80)} width={1160} height={80} fill={SKY.haze} opacity={0.5} style={{ filter: "blur(18px)" }} />
          <rect x={-40} y={f3(hor)} width={1160} height={Math.max(0, split - hor + 14)} fill={`url(#${uid}sea)`} />
          {glints}
          <g transform={world}>{above}</g>
        </g>
        {/* the waterline: the lit underside of the surface, a dark edge, the bright meniscus */}
        <rect x={-40} y={f3(split - 4)} width={1160} height={44} fill={`url(#${uid}under)`} />
        <path d={line} fill="none" stroke="#38524C" strokeOpacity={0.5} strokeWidth={3.5} transform="translate(0 -1.8)" />
        <path d={line} fill="none" stroke={OCEAN.sky} strokeOpacity={0.88} strokeWidth={2} transform="translate(0 1.2)" />
        {top ? <g transform={world}>{top}</g> : null}
      </svg>
    </>
  );
  return (
    <OceanStage frame={S} cam={cam} scene={SEA_SCENE} horizon={v.horizon} rest={rest} sway={sway} rays={0} snow={snow} overlay={overlay}>
      {below}
    </OceanStage>
  );
};
/** The fog the stage applies at z = 0 (for checks). */
export const SEA_FOG_Z0 = fogAt(SEA_SCENE, SEA_SCENE.focusM);

// --- cut 1's camera (world: the waterline is y 0; the ship's bow at x 90 at station) ------------------------
export const SEA_STATION = { x: 90 } as const;
export const CUT1_SEA_DURATION = 156;
/** f0: close and low on the hull as the bow cruises in from the right. */
export const CUT1_SEA_START_CAM: Cam = { x: 640, y: -15, k: 1.55 };
/** settled (~f75-104): three cards over one ship; the waterline on screen y 1015. */
export const CUT1_SEA_SETTLED_CAM: Cam = { x: 540, y: -55, k: 1 };
/** the creep's anchor (world): the ship's hull just above the waterline, still on screen while k grows */
export const CUT1_SEA_CREEP_ANCHOR = { x: 540, y: -80 } as const;
export const CUT1_SEA_CREEP_K = 1.075;
export const CUT1_SEA_GLIDES: Glide[] = [
  { f0: -6, f1: 52, dx: CUT1_SEA_SETTLED_CAM.x - CUT1_SEA_START_CAM.x, dy: CUT1_SEA_SETTLED_CAM.y - CUT1_SEA_START_CAM.y, k: CUT1_SEA_SETTLED_CAM.k, warp: 0.8 },
  {
    f0: 104,
    f1: 190,
    dy: CUT1_SEA_CREEP_ANCHOR.y + (CUT1_SEA_SETTLED_CAM.y - CUT1_SEA_CREEP_ANCHOR.y) / CUT1_SEA_CREEP_K - CUT1_SEA_SETTLED_CAM.y,
    k: CUT1_SEA_CREEP_K,
    warp: 1,
  },
];
/** the track: droneShipShared's damped camera (same rig and feel as the delivered cut 1) */
export const CUT1_SEA_CAM: Cam[] = trackCentred(CUT1_SEA_START_CAM, CUT1_SEA_GLIDES, CUT1_SEA_DURATION, 30);
export const cut1SeaCamAt = (f: number): Cam => CUT1_SEA_CAM[Math.max(0, Math.min(CUT1_SEA_CAM.length - 1, Math.round(f)))];
/** cut 1's last frame (f155): cut 2 can open here */
export const CUT1_SEA_END_CAM: Cam = cut1SeaCamAt(CUT1_SEA_DURATION - 1);

// --- a still for review --------------------------------------------------------------------------------
export const SeaShipStyleFrame: React.FC = () => {
  const cam = CUT1_SEA_SETTLED_CAM;
  return (
    <SeaStage
      S={0}
      cam={cam}
      rest={cam}
      sway={false}
      below={<ResearchShip x={SEA_STATION.x} S={0} bob={0} part="below" k={cam.k} />}
      above={<ResearchShip x={SEA_STATION.x} S={0} bob={0} part="above" k={cam.k} />}
    />
  );
};
export { lerp, smoothstep };
