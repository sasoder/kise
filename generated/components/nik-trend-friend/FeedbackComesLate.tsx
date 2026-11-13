// ---------------------------------------------------------------------------
// FeedbackComesLate (nik-trend-friend, cut 56). Cheeky Pint style (stout) (styles/cheeky-pint.md), the stout board.
// Opaque 1080x1920, 23.976 fps, 146 frames. Palette B1 (the stoutShared default).
// World: betLoop.tsx (owned by cut E LotOfBets; imported, never edited): the same loop, geometry and tones as E,
// on another company's tile (the world's generic office-block mark, tile dim 0.3): the same machine run badly.
//
// CHECK LINE: "Another company places only a handful of bets, they take so long to come back that nothing has
// returned yet, and by then a different manager is standing there."
//
// THE LINE (Nik Storonsky): "Other companies, okay, they do probably seven, eight bets, and feedback loop is delayed,
// plus management changes."
// WORD -> FRAME: Other 0 · companies 4 · okay 17 · they 23 · do 25 · probably 28 · seven 36 · eight 44 · bets 48 ·
// and 56 · feedback 79 · loop 87 · is 93 · delayed 98 · plus 108 · management 116 · changes 122
// DURATION: the slot 56.974 -> 63.063 s = 6.089 s x 23.976 = 146 frames (f0..f145).
//
// THE MOTION: one continuous motion: out with the chips, then back to the tile. Eight chips (bets) leave the tile
// one at a time on the track's centreline and crawl clockwise at a constant 10 world px/f (WORLD REV 4: the lap is
// 1810, was 3308 at 14 px/f), cooling from cream 42% of the way toward board (the answer going stale). None turns
// amber, nothing comes home (the leader is at the start of the right flank at f145).
// CAMERA (WORLD REV 4, safe zones): the tile's FOOT anchored at screen y 1062, the foot of the keep-in box, so the
// tile and its manager stay inside x 65-955 / y 290-1070 on every frame. f0-48 close on the tile (k 1.42, leaning
// right so the chips leaving to the left stay in shot) while the eight leave; f48-94 it pulls back with the crawl
// to the whole arch (k ~0.99), all eight strung up the left of the arch and over the top; f94-114 one eased blend
// pushes in on the tile to the close frame: k 1.82, the tile ~74% of the width, foot at y 1060, the manager glyph
// ~320 px tall, the chips gone out of the top; then a slow creep in to f145. The light pool follows the leading
// chips, then comes down with the camera onto the tile.
// THE SWAP happens in the close frame: the managers are the world's flat outline ManagerGlyph standing on an ink
// ground line that mirrors the office mark's. The old manager ("first") slides straight down behind that line and
// the new one rises out of it: the SAME outline person wearing a solid ink fedora (WORLD REV 4, the user's note:
// "the changed person is like wearing a hat").
//   f0     close on the tile and its manager; chip 1 already just out of the tile's left edge
//   f36    chip 7 shows on "seven"; f43 chip 8 shows on "eight"; then no more
//   f98    "delayed": the leader is just past the top of the arch, inside the box; the camera starts back
//   f114   the close frame settles (still creeping)
//   f145   the new manager over an empty slot and an empty return track
// DEPARTURES (leading edge shows past the tile's left edge -> trailing edge clears it), frames:
//   chip 1 -4.6 -> 1.4 · 2 2.2 -> 8.2 · 3 9.0 -> 15.0 · 4 15.8 -> 21.8 · 5 22.6 -> 28.6 · 6 29.4 -> 35.4 ·
//   7 36.2 -> 42.2 · 8 43.0 -> 49.0 (REV 4: 60 px at 10 px/f)
// THE SWAP (cause -> effect at the slot line): FIRST SINK f108 ("plus"; the old manager goes down behind the slot's ink line, cut at the
// ground line, never fading; fully down f118); FIRST RISE f118 ("management"; the new person comes out from behind
// the same line; fully up f130, a few frames after "changes" f122).
// AMBER = the signal that a bet is working (a result that came back). None in this cut by design: nothing comes
// back. Cream = the bets going out; board = the stale chips, the dimmed company tile (anyone); ink = the managers.
//
// SOURCES: no real figures. "Seven, eight bets" is Nik's own estimate; eight chips are shown, no numeral on screen.
// The company is the world's generic office-block mark (betLoop mark "office"), not a real logo.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor, clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { SEAT } from "../kits/cheeky-pint/talentShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import {
  CHIP_R,
  Chips,
  CompanyShadow,
  HIDE,
  TILE_BOX,
  CompanyTile,
  LOOP_LEN,
  LoopTrack,
  ManagerGlyph,
  camAnchored,
  chipAt,
  trackAt,
  type ChipDraw,
} from "./betLoop";

export const FPS = 24000 / 1001;
export const DURATION = 146;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the eight bets ---------------------------------------------------------------------------------------------
/** The crawl: constant speed, world px per frame (E runs ~58 on the REV 4 lap). REV 4: 10 (was 14 on the old,
 *  1.83x longer lap): slow enough that the leader is only at the top bend by "delayed" and nothing is home by
 *  f145, fast enough that chips leaving 6.8 f apart never touch (68 px apart, 60 wide). */
export const SPEED = 10;
export const LAP = LOOP_LEN / SPEED;
/** The beat between departures (frames). */
export const EVERY = 6.8;
/** The frame each chip's leading edge first shows past the tile's left edge (chip 8 on "eight"). */
export const DEPART = Array.from({ length: 8 }, (_, i) => 43 - (7 - i) * EVERY);
/** The emission frame (s 0, wholly under the tile): the leading edge shows HIDE - CHIP_R of track later. */
export const EMITS = DEPART.map((t) => t - (HIDE - CHIP_R) / SPEED);
/** A chip cools from cream part of the way toward board as it crawls (the answer going stale); it stays a
 *  warm card grey, clearly the lightest thing in the upper frame. */
const dimOf = (s: number) => 0.42 * smoothstep((s - 200) / 1300);

// --- the manager swap -------------------------------------------------------------------------------------------
export const SINK0 = 108;
export const SINK_F = 10;
export const RISE0 = 118;
export const RISE_F = 12;
// --- the camera (WORLD REV 4, safe zones): one pull-back with the chips, the tile's FOOT anchored at the foot of
// the keep-in box, so the tile and its manager stay inside x 65-955 / y 290-1070 on every frame ------------------
export const K0 = 1.42;
export const K1 = 0.985;
const A0 = 1062; // the tile's foot on screen (held: the world opens upward into the box)
const FOOT_Y = TILE_BOX.y + TILE_BOX.h;
const camP = (f: number) => 0.94 * smoothstep((f + 6) / 106) + 0.06 * clamp01((f + 6) / 110);
/** The lean while the chips climb the left of the arch: the world's x 540 sits right of centre, then returns. */
const leanX = (f: number) => 72 * (1 - smoothstep((f - 30) / 60));
/** Out with the chips: the pull-back (the whole arch with all eight on it and the tile, by ~f80). */
const camOut = (f: number): Cam => {
  const p = camP(f);
  const k = Math.exp(lerp(Math.log(K0), Math.log(K1), p));
  return camAnchored(k, A0, 540 + leanX(f), 540, FOOT_Y);
};
/** Back on the tile: the close frame (the tile ~75% of the width, its foot at screen y CLOSE_FOOT), creeping in
 *  to the end. */
export const K_CLOSE = 1.82;
const CLOSE_FOOT = 1060;
const CLOSE_X = 548; // world x at the frame centre: both track ends at the tile show as stubs (the return one empty)
const camClose = (f: number): Cam => camAnchored(K_CLOSE * Math.exp(0.0016 * (f - BACK1)), CLOSE_FOOT, 540, CLOSE_X, FOOT_Y);
/** The move back: one eased blend from the moving out-camera into the close frame, f BACK0 -> BACK1. REV 4: a few
 *  frames later (was 87 -> 110), so the leader at the top bend is still inside the box on "delayed" (f98). */
export const BACK0 = 94;
export const BACK1 = 114;
export const camAt = (f: number): Cam => {
  const w = smoothstep((f - BACK0) / (BACK1 - BACK0));
  if (w <= 0) return camOut(f);
  const a = camOut(f);
  const b = camClose(f);
  return { x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), w)) };
};

const FeedbackComesLate: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const band = amberBandFor(cam);
  const chips: ChipDraw[] = [];
  for (const t of EMITS) {
    const c = chipAt(f, t, LAP, 0);
    if (c.onTrack) chips.push({ x: c.x, y: c.y, amber: 0, dim: dimOf(c.s) });
  }
  // the light pool, the eye's guide: just behind the leading chips, up the left side and over the top; with the
  // move back (f92-115) down onto the tile, resting between the empty slot and the manager
  const lead = trackAt(Math.max(0, (f - EMITS[0]) * SPEED - 90));
  const toTile = smoothstep((f - BACK0 + 4) / (BACK1 - BACK0));
  const tilePt = { x: 600, y: TILE_BOX.y + 110 };
  const pool = { x: lerp(lead.x, tilePt.x, toTile), y: lerp(lead.y, tilePt.y, toTile) };
  // the managers: the old one sinks into the slot, then a different one rises out of it
  const sink1 = lerp(SEAT, 1, smoothstep((f - SINK0) / SINK_F));
  const sink2 = lerp(1, SEAT, smoothstep((f - RISE0) / RISE_F));
  return (
    <StoutStage S={f} cam={cam} rest={camAt(0)} pool={pool}>
      <LoopTrack k={cam.k} />
      <CompanyShadow count={0} />
      <Chips chips={chips} k={cam.k} band={band} />
      <CompanyTile k={cam.k} band={band} mark="office" managers={[]} dim={0.3} />
      <ManagerGlyph k={cam.k} sink={sink1} who="first" slot={false} />
      <ManagerGlyph k={cam.k} sink={sink2} who="second" slot ground />
    </StoutStage>
  );
};

export default FeedbackComesLate;
