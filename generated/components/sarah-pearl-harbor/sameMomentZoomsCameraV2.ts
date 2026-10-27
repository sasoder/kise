// SameMomentZoomsV2 — the camera, the strike schedule and the labels (pure maths,
// no React, so check scripts read exactly what the component draws).
// Cold-review V2 of 88_SameMoment_Zooms_SP. Starts from the smooth-pass snapshot
// (sameMomentZoomsCamera_SP.ts); the repo's sameMomentCamera.ts (markers) and
// pearlPacificMapData.ts are imported read-only.
//
// THE CAMERA (round 2): the kit's runCamera (pchip keys, log-k, damped follow ~5 f
// behind the keys, pre-rolled). Keys are written as "put world point P at screen
// point S at zoom k" (`put`), each framing solved against the caption bands
// (y 1080-1250, 1360-1460): lit marks sit above ~1060.
//   f0-34    THE PACIFIC -> OAHU: open on Japan and Hawaii, ease in onto Pearl
//            Harbor (k 1.25 -> 2.35) as the strike arc from Japan crosses (lands 32).
//   f36-70   one zoom out through the theatre wide and in again onto Malaya (64).
//   f70-104  SOUTH CHINA SEA: gentle leans to Luzon (Philippines 87) and Singapore (104).
//   f110-150 ONE PACIFIC FRAMING holds Luzon, Guam and Wake (128, 150), no hops.
//   f150-170 a drift west to Thailand (Singora, 168).
//   f170-199 THE SAME MOMENT: one pull to the wide (Malaya to Hawaii, Japan in it);
//            every place's own strike re-lands together (FLARE, f196).
//   f203-234 one push into Shanghai (struck 203 "international", named 237),
//            solved on Singapore so the southern marks never drop into a band.
//   f238-267 a living creep in, Shanghai with its neighbours' marks lit.
// Peak camera speed ~31 px/frame (f113, f164); bands and plate edges checked per frame.
import { MARKS, type MarkId } from "./sameMomentCamera";
import type { CamKey } from "./pearlShared";

export const FPS = 24;
export const SLOT = 256; // seq 2131..2386
export const DURATION = SLOT + 12; // 268: frames 256..267 are the hold handle

/** word onsets, local frames (S/notes/word_tables.md, automated alignment, ±2 f) */
export const W = {
  that: 3,
  the: 6,
  japanese: 10,
  attack: 22,
  pearl: 33,
  harbor: 38,
  they: 45,
  also: 50,
  attack2: 56,
  malaya: 64,
  philippines: 87,
  singapore: 104,
  wake: 128,
  island: 139,
  guam: 150,
  thailand: 168,
  international: 203,
  settlement: 215,
  in: 230,
  shanghai: 237,
  because: 256,
};

/** a key: world point (wx, wy) lands on screen (sx, sy) at zoom k */
const put = (f: number, k: number, [wx, wy]: [number, number], sx: number, sy: number): CamKey => ({
  f,
  k,
  x: wx - (sx - 540) / k,
  y: wy - (sy - 960) / k,
});
const M = MARKS;
/** the theatre wide: Singora (west) to Pearl Harbor (east) centred, Singapore at y 1040 */
const WIDE_K = 1.0; // Singora and Pearl Harbor ~80 px in from the edges, room for the flare
// centred south enough that the plate's top edge (world y 131) never enters: top = 140
const WIDE_C: [number, number] = [(M.singora[0] + M.pearlHarbor[0]) / 2, 140 + 960 / WIDE_K];

export const CAM_KEYS: CamKey[] = [
  // the Pacific (Japan at left, Hawaii at right) -> ease in onto Oahu as the strike
  // arc from Japan flies across; tilted north (Pearl low, at y ~1000)
  put(0, 1.25, M.pearlHarbor, 880, 960),
  put(14, 1.5, M.pearlHarbor, 840, 985),
  put(31, 2.15, M.pearlHarbor, 800, 1000),
  // out through the theatre wide and in onto Malaya: a soft, spread move
  put(53, WIDE_K, WIDE_C, 540, 960),
  put(71, 1.75, M.kotaBharu, 370, 1000), // (plate's west edge stays out of frame)
  // lean to Luzon (its label east of it, over the sea), then Singapore
  put(85, 2.3, M.clarkField, 500, 830),
  put(99, 2.3, M.singapore, 310, 1030),
  // east first (the southern marks leave by the left edge, never through a
  // caption band), then up into one Pacific framing: Luzon, Guam, Wake
  put(115, 2.15, M.singapore, -70, 1030),
  put(126, 2.0, M.guam, 561, 1040),
  put(147, 2.05, M.guam, 561, 1036),
  // down first, then a drift west to Thailand (Guam and Luzon stay in frame)
  put(157, 1.95, M.singapore, -60, 1028),
  put(166, 1.7, M.singora, 210, 930),
  // the same moment: the wide; Japan's strikes re-land on every mark at once (FLARE)
  put(188, WIDE_K, WIDE_C, 540, 960),
  put(199, WIDE_K * 1.006, WIDE_C, 540, 960),
  // the push into Shanghai travels through "international settlement" (moving
  // from ~203, decelerating into Shanghai by ~234), then a living creep
  put(229, 2.0, M.singapore, 204, 1040),
  put(300, 2.12, M.singapore, 212, 1040),
];

/** THE SAME MOMENT: each lit place's own strike arc (same real origin as its first
 *  strike) re-flies over FAN_FLY frames, all landing on one frame; rings snap out */
export const FLARE = 196;
export const FLARE_LEN = 14;
export const FAN_FLY = 10;

// ---------------------------------------------------------------------------
// The Malaya peninsula marks (Singora = Thailand, Kota Bharu = Malaya, Singapore)
// are ~25-40 km-px apart in the world; at wide zooms they would clump into one
// blob. Below k ~2.1 each is displaced by a screen offset (a cartographic
// offset, fading in as the camera widens) so the three read as three marks.
// ---------------------------------------------------------------------------
const SPREAD: Partial<Record<MarkId, [number, number]>> = {
  singora: [-16, -34],
  kotaBharu: [12, -8],
  singapore: [34, 2],
};
const spreadAmt = (k: number) => {
  const t = Math.max(0, Math.min(1, (2.1 - k) / 0.9));
  return t * t * (3 - 2 * t);
};
/** where a mark is DRAWN (world px) at zoom k */
export const markAt = (id: MarkId, k: number): [number, number] => {
  const o = SPREAD[id];
  const m = MARKS[id];
  if (!o) return m;
  const a = spreadAmt(k) / k;
  return [m[0] + o[0] * a, m[1] + o[1] * a];
};

// ---------------------------------------------------------------------------
// STRIKES: one mark per struck place, landing on its word and staying lit to
// the last frame. The arc from its origin draws at constant speed over `fly`
// frames and touches the target on `land` (a frame before the word); the ring
// is drawn round from the side the strike came from, then holds. The spent arc
// drains away (no web of arcs in the wide).
// ---------------------------------------------------------------------------
export type Strike = { id: MarkId; land: number; fly: number };
export const STRIKES: Strike[] = [
  // from Japan (the carriers' base, Hitokappu Bay) across the opening pan
  { id: "pearlHarbor", land: W.pearl - 1, fly: 24 },
  { id: "kotaBharu", land: W.malaya - 1, fly: 16 },
  { id: "clarkField", land: W.philippines - 1, fly: 14 },
  { id: "singapore", land: W.singapore - 1, fly: 14 },
  { id: "wake", land: W.wake - 1, fly: 14 },
  { id: "guam", land: W.guam - 1, fly: 10 },
  { id: "singora", land: W.thailand - 1, fly: 16 },
  // struck on "international" (Settlement), named on "Shanghai"
  { id: "shanghai", land: W.international, fly: 0 },
];
/** ring radius in screen px at k 1 (grows k^0.2); Pearl Harbor a little larger */
export const RING_SIZE = 22;
export const RING_PEARL = 27;

// ---------------------------------------------------------------------------
// LABELS: only the spoken names, each landing on its word (fully in a frame
// before it). One out window per label (6 frames), and an edge fade so a label
// leaving the frame clears with its marker (never clamped away from it).
// (dx, dy): baseline anchor in SCREEN px from the marker.
// ---------------------------------------------------------------------------
export const CAP = 34;
export const SPACING = 0.12;
export const LABEL_LEAD = 10;
export const LABEL_OUT = 6;
export type LabelKey = "pearl" | "malaya" | "philippines" | "singapore" | "wake" | "guam" | "thailand" | "shanghai";
export type LabelSpec = {
  key: LabelKey;
  at: MarkId;
  word: number;
  anchor: "start" | "middle" | "end";
  dx: number;
  dy: number;
  /** frames before the word the slide starts (default LABEL_LEAD) */
  lead?: number;
  /** first frame of the 6-frame fade out */
  out?: number;
};
export const LABELS: LabelSpec[] = [
  { key: "pearl", at: "pearlHarbor", word: W.pearl, anchor: "end", dx: -44, dy: -16, lead: 11, out: 40 },
  { key: "malaya", at: "kotaBharu", word: W.malaya, anchor: "start", dx: 44, dy: 12, out: 79 },
  { key: "philippines", at: "clarkField", word: W.philippines, anchor: "start", dx: 44, dy: 12, out: 93 },
  { key: "singapore", at: "singapore", word: W.singapore, anchor: "start", dx: 44, dy: 14, lead: 9, out: 112 },
  { key: "wake", at: "wake", word: W.wake, anchor: "end", dx: -44, dy: 12, out: 146 },
  { key: "guam", at: "guam", word: W.guam, anchor: "start", dx: 44, dy: 14, lead: 11, out: 158 },
  { key: "thailand", at: "singora", word: W.thailand, anchor: "start", dx: 10, dy: -42, out: 180 },
  { key: "shanghai", at: "shanghai", word: W.shanghai, anchor: "middle", dx: 0, dy: -48 },
];
