// ---------------------------------------------------------------------------
// MilitiasEverywhere (sarah-insurgency, cut 66). The clip's one-off "Dwarkesh 3D map" hybrid (COMMON.md): the 1783
// thirteen states laid as the floor (MapGround3D "atlantic") inside the misty air, wooden wargame pieces on it.
// Opaque 1080x1920, 24 fps, 126 frames. RENDER WITH --gl=angle (the ground is WebGL2).
//
// CHECK LINE: "Washington's army forced the British to mass in one place, while armed locals rose up everywhere else
// in the country."
//
// THE LINE: "So you have the Continental Army forces the British army to concentrate, but you have all these militias
// all over the country."
// WORD -> FRAME (f0 = 66.500 s): So -5 · you 1 · have 5 · the 8 · CONTINENTAL 10 · ARMY 20 · forces 29 · the 42 ·
//   BRITISH 50 · Army 55 · to 62 · CONCENTRATE 67 · but 80 · you 82 · have 84 · all 86 · these 90 · MILITIAS 94 ·
//   ALL 105 · OVER 108 · the 112 · COUNTRY 115
// DURATION: the slot 66.500 -> 71.750 s = 5.25 s x 24 = 126 frames (f0..f125). Speaker after.
//
// THE MOTION: one continuous camera, close through the merge, then one pull-back under the pawn wave.
// f0-64 close, looking north-east up the coast on a long lens (F 2400; blocks ~180-230 px tall): the orange
// Continental block (the 1777 Flag Resolution sticker, stars1777) in the left half, the four cream British blocks
// (pre-1801 Union sticker) spread on a diagonal to its right at their posts - Philadelphia nearest, New York, Long
// Island, Newport farthest - under a slow creep (target drifting south-west, a little zoom out). f22-58 "forces the
// British army to concentrate": the four slide (constant speed, eased only at start and stop) into exact contact as
// the four tiles of ONE wide block over New York harbour (the last touches on f58); f58-63 the one body stands under
// them and their outlines (the seams) and small stickers fade off it; f61-66 the one Union sticker comes up on its face
// ("CONCENTRATE" 67). f64-112 the one pull-back (zoom F 2400 -> 1300, target swinging south-west, yaw 57 -> 40) to
// the whole seaboard (Maine y ~190, the last pawns y ~1040, Georgia's border ~y 1300, most of Florida off the bottom).
// (The pan peak, ~33 px/frame at the image centre around f84 at full res, is one smooth lobe: accepted by the director.)
// f74-112 "all these militias all over the country": orange pawns RISE out of the map (the kit's tear) in a wave
// spreading north and south from New Jersey by distance; a pawn waits until the pull-back has brought its site above
// y 1065 and inside the frame (state derived from the visible frame), and a late one rises faster (PAWN_RISE) so every
// pawn stands by f112, holes closed by ~f115 ("COUNTRY" 115). f112-125 settled living wide (camera creep, shafts,
// motes). The fog thins with the pull-back so New England and the two armies stay readable. No labels, no numbers.
// CONTACT: each British block's slide starts on BRIT_POSTS.t0 and touches its tile on t1. Each pawn's tear opens on
// its PAWN_START and its head breaks the surface about a frame later (the kit's rise).
// Orange = the Americans (Continental block, militia pawns); cream = the British. Nothing else is orange.
//
// DEPTH: the kit's one projection (insurgencyCamera); fogFor(cam) with its distances scaled up to 1.45x over the
// pull-back (the same fog to the ground and the pieces). Keys: f0 F 2400 D 960 pitch 38 yaw 60 -> f64 F 1950 D 960
// pitch 39 yaw 54 -> f112 F 1300 D 870 pitch 44 yaw 40. Pieces are oversized against the map (a wargame on a map):
// the Continental block stands ~65 km north of Morristown (Pompton / the Ramapo hills, between Morristown and the
// Hudson Highlands) and the British block (160 wide) spans New York's Lower Bay, so the two stand apart in the wide;
// no pawn within 115 / 130 km of them (a clear field round the two armies).
//
// SOURCES (COMMON.md facts): the British main base New York City 1776-83; Philadelphia held 1777-78; Newport RI
//   held 1776-79; Long Island held 1776-83 (British posts on its north shore); the Continental Army wintered at
//   Morristown NJ 1777 and 1779-80 and Middlebrook NJ 1778-79. Militia sites (real actions or musters, one pawn
//   each; positions are the towns' coordinates): Lexington & Concord MA 1775, Machias (Maine, then MA) 1775, Saratoga
//   NY 1777, Oriskany NY 1777, Bennington region / Green Mountains (NH grants, VT) 1777, Groton CT 1781, Wyoming
//   Valley PA 1778, Fort Pitt PA, Great Bridge VA 1775, Moore's Creek Bridge NC 1776, Guilford Courthouse NC 1781,
//   Kings Mountain / Cowpens SC 1780-81, Ninety Six SC 1775/81, Snow's Island SC (Marion) 1780-81, Kettle Creek GA
//   1779; the rest are county militias in each state's settled countryside (approximate town positions). The 1783
//   states are the kit's ATLANTIC.STATES (modern outlines grouped by successor state, western claims not shown).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ATLANTIC,
  Block,
  HorizonHaze,
  InsurgencyStage,
  MapGround3D,
  Pawn,
  WorldLayer,
  blockSpec,
  camTrack,
  fogFor,
  insWorld,
  lerpBlock,
  sortFarToNear,
  splitBlock,
  toScreen,
  type BlockSpec,
  type CamKey,
  type Fog,
  type InsWorld,
  type P2,
} from "./insurgencyShared";

export const FPS = 24;
export const DURATION = 126;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const pj = ATLANTIC.project;
const PL = ATLANTIC.PLACES;

// ---- the camera (one keyed track through the kit's damped follow) ---------------------------------------------------
export const KEYS: CamKey[] = [
  { f: 0, x: -90, z: 20, D: 960, pitch: 38, yaw: 60, F: 2400 },
  { f: 22, x: -104, z: 32, D: 972, pitch: 38.3, yaw: 59, F: 2360 },
  { f: 64, x: -240, z: 135, D: 960, pitch: 39, yaw: 54, F: 1950 },
  { f: 112, x: -885, z: 545, D: 870, pitch: 44, yaw: 40, F: 1300 },
  { f: 170, x: -893, z: 550, D: 893, pitch: 44.3, yaw: 40.3, F: 1300 },
];
export const track = camTrack(KEYS, 200);

// ---- the pieces ----------------------------------------------------------------------------------------------------
/** the Continental Army: one orange block in the New Jersey hills west of Morristown, turned toward New York */
/** the Continental block's sticker: the 1777 Flag Resolution flag (the Grand Union's British canton read British next to the Union block) */
const CONT_FLAG = "stars1777" as const;
export const CONT: BlockSpec = blockSpec(-35, -90, 88, 262, 88);
/** the British army concentrated: one wide cream block over New York harbour, turned toward the Continental block */
export const BRIT: BlockSpec = blockSpec(55, 55, 160, 258, 84, 36);
const TILES = splitBlock(BRIT, 4, 1);
/** the four British posts (each slides to its tile): t0 the slide starts, t1 it touches its tile */
export const BRIT_POSTS: { name: string; at: P2; tile: number; t0: number; t1: number }[] = [
  { name: "Philadelphia", at: PL.philadelphia, tile: 0, t0: 24, t1: 56 },
  { name: "New York", at: PL.newYork, tile: 1, t0: 30, t1: 48 },
  { name: "Long Island", at: pj(-73.15, 40.88), tile: 2, t0: 26, t1: 52 },
  { name: "Newport", at: pj(-71.31, 41.49), tile: 3, t0: 22, t1: 58 },
];
/** the seams close (the tiles' outlines and small stickers fade off the one body), then the one sticker comes up */
const FUSE: [number, number] = [58, 63];
const STICK: [number, number] = [61, 66];
const postSpec = (i: number): BlockSpec => {
  const p = BRIT_POSTS[i];
  const t = TILES[p.tile];
  return { ...t, x: p.at[0], z: p.at[1] };
};
/** a slide at constant speed, eased only at its start and stop */
const slide = (frame: number, t0: number, t1: number) => {
  const u = Math.max(0, Math.min(1, (frame - t0) / (t1 - t0)));
  const e = 0.22;
  // trapezoid velocity: accelerate over e, cruise, decelerate over e
  const vmax = 1 / (1 - e);
  if (u < e) return (vmax * u * u) / (2 * e);
  if (u > 1 - e) return 1 - (vmax * (1 - u) * (1 - u)) / (2 * e);
  return vmax * (u - e / 2);
};

// ---- the militias: one pawn per site, every state, rising in a wave out from New Jersey -----------------------------
const SITES_LL: [number, number][] = [
  // New Jersey
  [-74.66, 40.35],
  [-74.95, 39.6],
  // New York
  [-73.64, 42.99],
  [-75.37, 43.17],
  [-74.05, 41.93],
  // New Hampshire (and the Green Mountain grants)
  [-71.54, 43.21],
  [-72.75, 44.0],
  [-71.45, 44.35],
  // Massachusetts (and Maine)
  [-71.27, 42.45],
  [-72.59, 42.1],
  [-70.26, 43.66],
  [-67.46, 44.71],
  [-69.4, 44.55],
  // Rhode Island, Connecticut
  [-71.45, 41.84],
  [-72.68, 41.76],
  [-72.08, 41.36],
  // Pennsylvania
  [-76.3, 40.04],
  [-77.19, 40.2],
  [-75.88, 41.25],
  [-80.0, 40.44],
  [-78.5, 40.02],
  [-77.0, 41.25],
  // Delaware, Maryland
  [-75.52, 39.16],
  [-77.41, 39.41],
  [-76.49, 38.98],
  [-75.6, 38.36],
  // Virginia
  [-76.27, 36.72],
  [-77.43, 37.54],
  [-78.16, 39.18],
  [-78.48, 38.03],
  [-81.0, 36.9],
  [-79.4, 37.3],
  // North Carolina
  [-79.84, 36.13],
  [-78.11, 34.46],
  [-80.84, 35.23],
  [-77.59, 36.33],
  [-77.04, 35.1],
  [-82.3, 35.75],
  // South Carolina
  [-81.6, 35.1],
  [-82.02, 34.15],
  [-79.4, 33.85],
  [-80.6, 34.25],
  [-80.15, 32.95],
  // Georgia
  [-82.85, 33.68],
  [-81.75, 32.95],
  [-83.6, 33.5],
];
export const PAWN_SIZE = 64;
const MIN_GAP = 74;
/** the sites kept (a greedy minimum spacing on the map, in list order) */
export const PAWNS: P2[] = (() => {
  const out: P2[] = [];
  for (const ll of SITES_LL) {
    const p = pj(ll[0], ll[1]);
    // keep a clear field round the two armies (the blocks read as blocks, not one more piece in a crowd)
    if (Math.hypot(p[0] - CONT.x, p[1] - CONT.z) < 115 || Math.hypot(p[0] - BRIT.x, p[1] - BRIT.z) < 130) continue;
    if (out.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) >= MIN_GAP)) out.push(p);
  }
  return out;
})();
const WAVE_FROM: P2 = [PL.morristown[0] - 40, PL.morristown[1] + 30];
const RISE = 24;
const DMAX = Math.max(...PAWNS.map((p) => Math.hypot(p[0] - WAVE_FROM[0], p[1] - WAVE_FROM[1])));
/** each pawn's rise start: the wave spreading north and south from New Jersey (f72 near -> f87 farthest) */
const WAVE = PAWNS.map((p) => 72 + 15 * Math.pow(Math.hypot(p[0] - WAVE_FROM[0], p[1] - WAVE_FROM[1]) / DMAX, 0.85));
/** a pawn rises only once the pull-back has brought its site into the frame above the caption bands (screen y <
 *  SHOW_Y): the wave, delayed where the camera has not reached yet (derived from the visible frame, sub-frame) */
const SHOW_Y = 1065;
const onScreenFrom = (p: P2) => {
  for (let f = 60; f <= 125; f += 0.25) {
    const s = toScreen(track(f), p[0], 0, p[1]);
    if (s.y < SHOW_Y && s.x > 40 && s.x < 1040) return f;
  }
  return 125;
};
export const PAWN_START = PAWNS.map((p, i) => Math.max(WAVE[i], onScreenFrom(p)));
/** each pawn's rise length: RISE, shortened for a late site so every pawn stands by UP_BY (riseState: up at ~0.84) */
const UP_BY = 112;
export const PAWN_RISE = PAWN_START.map((s) => Math.max(12, Math.min(RISE, (UP_BY - s) / 0.84)));

type Item = { at: P2; el: (A: InsWorld) => React.ReactNode };

const MilitiasEverywhere: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = track(frame);
  // the wide reaches far up the coast relative to D: thin the fog with the pull-back so New England and the two
  // armies at New York stay readable (the same fog goes to the ground and the pieces)
  const thin = interpolate(frame, [64, 112], [1, 1.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const f0 = fogFor(cam);
  const fog: Fog = { ...f0, a0: f0.a0 * thin, a1: f0.a1 * thin, b0: f0.b0 * thin, b1: f0.b1 * thin, c0: f0.c0 * thin, c1: f0.c1 * thin };
  const A = insWorld({ cam, rest: track(0), frame, fog });

  const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) } as const;
  const fuse = interpolate(frame, FUSE, [0, 1], ease);
  const stick = interpolate(frame, STICK, [0, 1], ease);
  const items: Item[] = [{ at: [CONT.x, CONT.z], el: (A) => <Block A={A} spec={CONT} color="orange" sticker={CONT_FLAG} uid="cont" /> }];
  // the British: four post blocks slide into exact contact (their tiles of BRIT); from FUSE[0] the one body stands
  // underneath and the four tiles over it fade, so only their outlines (the seams) and small stickers fade off the
  // same cream (identical geometry: nothing shows through); then the one block's sticker comes up on its face
  if (fuse <= 0)
    BRIT_POSTS.forEach((p, i) => {
      const s = lerpBlock(postSpec(i), TILES[p.tile], slide(frame, p.t0, p.t1));
      items.push({ at: [s.x, s.z], el: (A) => <Block A={A} spec={s} color="cream" sticker="union1606" uid={`bp${i}`} /> });
    });
  else
    items.push({
      at: [BRIT.x, BRIT.z],
      el: (A) => (
        <g>
          <Block A={A} spec={BRIT} color="cream" sticker={null} uid="brit" />
          {fuse < 1
            ? sortFarToNear(A, TILES, (t) => [t.x, t.z]).map((t, i) => (
                <g key={i} opacity={1 - fuse}>
                  <Block A={A} spec={t} color="cream" sticker="union1606" uid={`bt${i}`} shadow={0} dust={false} />
                </g>
              ))
            : null}
          {stick > 0 ? (
            <g opacity={stick}>
              <Block A={A} spec={BRIT} color="cream" sticker="union1606" uid="britS" shadow={0} />
            </g>
          ) : null}
        </g>
      ),
    });
  PAWNS.forEach((p, i) => {
    const r = (frame - PAWN_START[i]) / PAWN_RISE[i];
    if (r <= 0) return;
    items.push({ at: p, el: (A) => <Pawn A={A} x={p[0]} z={p[1]} size={PAWN_SIZE} rise={Math.min(1, r)} uid={`pw${i}`} seed={i + 3} /> });
  });

  return (
    <AbsoluteFill>
      <InsurgencyStage A={A}>
        <MapGround3D world="atlantic" cam={cam} air={A.ground} fog={A.fog} />
        <HorizonHaze A={A} id="hz66" />
        <WorldLayer>
          {sortFarToNear(A, items, (it) => it.at).map((it, i) => (
            <React.Fragment key={i}>{it.el(A)}</React.Fragment>
          ))}
        </WorldLayer>
      </InsurgencyStage>
    </AbsoluteFill>
  );
};

export default MilitiasEverywhere;
