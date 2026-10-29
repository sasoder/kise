// ---------------------------------------------------------------------------
// insurgencyShared: THE WORLD of sarah-insurgency (one import for every cut: ./insurgencyShared).
// CHECK LINE: every cut reads as ONE world: an old printed map laid as a floor inside the Dwarkesh 3D misty air,
// with wooden wargame pieces standing on it. Vintage, tactile, no people. Orange = the side fighting on its own
// ground; cream = the occupier / the intervener. No numbers on screen.
//
// FRAME: 1080 x 1920, 24 fps (FPS). Caption bands: y 1080-1250 and 1360-1460 (keep labels and key pieces out).
//
// UNITS: 1 world unit = 1 map px of the world's map (~1 km in both maps). X = map x (east), Y = height (up +),
// Z = map y (south +). The page world (PageGround3D) has no map: same units, any origin.
//
// ---- THE CAMERA (insurgencyCamera.ts: one projection for the WebGL ground and every SVG overlay) ----------------
//   CamKey { f, x, z, ty?, D, pitch, yaw, F? }    target on the ground (x, z), distance D, pitch down (deg), yaw (deg:
//       0 = map north, 90 = east, clockwise), focal F px (default F_DEFAULT 1300). pitch < ~36 shows the horizon.
//   camTrack(KEYS)(frame) -> Cam     pchip through the keys, then the house damped follow (CAM_STIFF / CAM_DAMP),
//       pre-rolled 60 f, LEAD 5 f; KEYS must be a module-level array (cached). camOfKey(key) for a still.
//   toScreen(cam, X, Y, Z) -> { x, y, z (depth), s (px per world unit) }; groundToScreen, groundAt(cam, sx, sy),
//   horizonY(cam), eyeDist, groundJacobian, northYaw(project, lon, lat), yawToward(a, b), lightOf(cam)
//   fogFor(cam) / FOG_DEFAULT / FOG_HORIZON / hazeOf / airMixOf   the ONE distance fog, relative to D (crisp near at
//       every zoom). fogFor(cam) is THE DEFAULT (insWorld and the ground use it): FOG_DEFAULT looking down, blending to
//       the denser FOG_HORIZON as the horizon enters the frame (no hard sea / land line at the horizon).
//
// ---- THE AIR AND THE GRADE (insurgencyAir.tsx) -------------------------------------------------------------------
//   GRADE: "A" | "B"   THE clip grade (one constant): "A" (the director's pick) = the 3D air palette A as-is; "B" =
//       "aged" (warm sepia air, cream shafts, petrol-teal only far near the horizon), still selectable. Both carry the
//       map style's paper mottle + screen grain over the whole frame at low strength (InsurgencyStage paper).
//   const A = insWorld({ cam, rest, frame, grade?, fog?, scene? })   the frame's world: A.v (AirView), A.L (the
//       light), A.D, A.dist(X,Y,Z), A.hazeAt(dist), A.airAt(dist), A.tone(hex, dist), A.toneO(hex, dist) (orange
//       takes half the fog), A.ground (the ground shader's air). rest = the cut's f0 camera (motes / shafts parallax).
//   <InsurgencyStage A bloom? shafts? motes? paper? front? overlay?>  the kit's AirStage + the paper (A 0.75, B 1)
//   <HorizonHaze A below? strength? id />   the horizon as a soft zone over the ground only (after the ground; the
//       sky's own colour at the horizon row, 420 px deep)
//
// ---- THE FLOOR (insurgencyGround.tsx, WebGL2, render with --gl=angle) ---------------------------------------------
//   <MapGround3D world="china"|"atlantic" cam={A.cam} air={A.ground} fog={A.fog} territory? mottle? debug? />
//   <PageGround3D cam air graticule? mottle? />     the umber page, no map (laid-line engraving, mottle)
//   territory: up to 2 TerritoryLayer { d (a region's d, e.g. OCCUPIED_1939.d), color "cream"|"orange", amount 0..1,
//       wash?, hatch?, angle?, px?, front? (radial {at, reach, rough?} | linear {at, dir, reach}: monotone, drive
//       `reach` up only), edge? }   a world-space hatch + wash; the front has a crisp bright edge.
//
// ---- ON THE FLOOR (insurgencyOverlays.tsx; inside <WorldLayer>, before the pieces) ---------------------------------
//   <GroundLabel A text at size yaw? t? font? color? />  a name LYING on the ground (IM Fell English SC; "caslon" =
//       Libre Caslon for figures). size = cap height (world). yaw = the map direction its top points to: pass the
//       cut's camera yaw (a constant, so it stays fixed to the map). t = frames since it lands (slide 26 px + fade).
//   <GroundLine A pts w kind? ("solid"|"dash"|"rail") color? from? to? dash? />  a world-space ribbon (w world units)
//       that thins and fogs with distance; dashes are world-length (no crawl); from / to draw it (monotone).
//   <CityDot A at r />   <SoftPatch A c r rot? color? amount? />  OPTIONAL, subtle (default 0.6): a glow lying on the
//       ground, e.g. BASE_AREAS (c, r, rot) round rising pawns
//   LABELS: a cut labels only the places its line SPEAKS (the probe's region names are probe-only).
//   pointAlong(pts, t), polyLength(pts)
//
// ---- THE PIECES (insurgencyPieces.tsx; SVG, air-lit, fogged by own distance; draw far -> near) --------------------
//   <WorldLayer>...</WorldLayer>    the full-frame SVG for overlays and pieces
//   sortFarToNear(A, items, (it) => [x, z])  painter's order
//   <Block A spec color sticker? topple? toppleDir? uid shadow? dust? />
//       spec: BlockSpec { x, z, w, h, d, face (yaw the sticker faces; 180 = south, toward a north-looking lens), lift? }
//       blockSpec(x, z, w, face?, h?, d?) the default (square face, 0.42 w thick). color "orange"|"cream".
//       sticker: FlagKind "japan"|"union1606"|"roc"|"grandUnion" (two-tone period flags, read at ~40 px).
//       topple 0..1: falls flat with weight (toppleAngle: slow off the vertical, fast down, a small rebound at 0.78,
//       a dust puff); the sticker goes with the face. toppleDir "forward" (face down) | "back" (face up).
//       Its top face is one value step lighter than its sides (WOOD_TOP).
//   splitBlock(spec, cols, rows?) -> BlockSpec[]  sub-blocks tiling the parent exactly; lerpBlock(a, b, t) animates
//       each to its target (merge = the reverse); clusterSpots(x, z, n, spacing) ground spots for the men it splits into
//   <Pawn A x z size color? rise? uid seed? />   a turned wooden pawn (size = its height). rise 0..1: the map surface
//       parts (a torn dark slit, its earth wall, a dust lip) and the pawn comes UP out of the ground, the hole closes
//       under it (riseState(u) gives the schedule). Never fade or scale it in.
//   <Garrison A x z size uid face? topple? />   a small cream block at a town
//   <ValueColumn A x z r height color? uid />   a TURNED column (plinth ring, shaft, bead, capital ring; height = the
//       whole), orange glows faintly via the stage bloom; cream dull
//   <Farmhouse A x z size face? warm? uid />   a gabled colonial farmhouse, a warm window (cut 91)
//   <ContactShadow A x z a b amt? uid />, dirOfYaw(yaw), WOOD, HOUSE_MAT, SHADOW
//
// ---- THE MAPS (data; places / lines APPROXIMATE where said) --------------------------------------------------------
//   China (insChinaMapData, LCC 28/42 N, 116 E; 1939): project(lon, lat), PLACES (+ PLACES_LL), LABEL_AT,
//     OCCUPIED_1939 / MANCHUKUO / FREE_CHINA / KOREA / JAPAN_HOME (Region {d, edge, box}), *_POLY, FRONT_1938_PTS,
//     WALL_PTS, RAIL_* (RouteData {pts, len, stations}), RAIL_HELD, RIVER_YANGTZE, RIVER_YELLOW (1938 flood course),
//     BASE_AREAS (soft regions), LAKES_D. Imported as CHINA.
//   Atlantic (insAtlanticMapData, LCC 33/52 N, 38 W; 1783 states): project, PLACES (incl. london, farm), LABEL_AT,
//     THIRTEEN, STATES (key -> {name, d, box, at}), STATES_POLY, BRITAIN, RIVER_HUDSON, LAKES_D, BOSTON_LONDON_KM.
//     Imported as ATLANTIC.
//   VIEWS: tested cameras for the clip's main looks (copy and key from them).
// ---------------------------------------------------------------------------
export * from "./insurgencyCamera";
export * from "./insurgencyAir";
export * from "./insurgencyGround";
export * from "./insurgencyFlags";
export * from "./insurgencyPieces";
export * from "./insurgencyOverlays";
export * as CHINA from "./insChinaMapData";
export * as ATLANTIC from "./insAtlanticMapData";
import type { CamKey } from "./insurgencyCamera";

/** tested cameras (f: 0; copy and re-key). */
export const VIEWS: Record<"chinaPlain" | "thirteenStates" | "farm" | "atlanticEast" | "page", Omit<CamKey, "f">> = {
  /** the North China plain from Shanxi looking EAST: the plain below, Korea and Japan far up in the haze */
  chinaPlain: { x: 420, z: -120, D: 1100, pitch: 34, yaw: 78 },
  /** the thirteen states looking north-east up the seaboard (Georgia bottom left, New Hampshire up the haze) */
  thirteenStates: { x: -180, z: 160, D: 1350, pitch: 38, yaw: 38 },
  /** close and low on the Massachusetts farm (PLACES.farm), looking north-east from inland (the coast far) */
  farm: { x: 271, z: -96, D: 150, pitch: 17, yaw: 40 },
  /** from the American coast looking EAST across the Atlantic: Britain far in the haze near the horizon */
  atlanticEast: { x: 1300, z: -280, D: 1600, pitch: 20, yaw: 78 },
  /** the plain umber page */
  page: { x: 0, z: 0, D: 520, pitch: 34, yaw: 0 },
};
