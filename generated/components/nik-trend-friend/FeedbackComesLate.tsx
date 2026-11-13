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
// one at a time on the track's centreline and crawl clockwise at a constant 14 world px/f (1/8 of E's speed),
// cooling from cream 42% of the way toward board (the answer going stale). None turns amber, nothing comes home.
// CAMERA: f0-48 close on the tile (k 1.42, its top at screen y 1468, as E opened) while the eight leave; f48-87
// it rises and pulls back with the crawl (k ~1.15), all eight strung up the left leg into the top bend with the
// tile still at the bottom; f87-110 it comes back down and pushes in on the tile (one eased blend, no hold) to a
// close frame: k 1.82, the tile ~74% of the width and wholly above the upper caption band (foot at y 1060), the
// manager glyph ~300 px tall, the world's empty slot pocket and both track ends at the tile in frame, the return one
// empty, the chips gone out of the top; then a slow creep in to f145. The light pool follows the leading chips up
// the left and over the top, then comes down with the camera onto the tile (between the empty slot and the peg).
// THE SWAP happens in the close frame (WORLD REV 3, the client's note: the two icons on the tile must be one set):
// the managers are the world's flat outline ManagerGlyph, the office mark's grammar, scale and stroke, standing on
// an ink ground line that mirrors the office mark's. The old manager ("first": a round head over a shoulder block)
// slides straight down behind that line and a visibly different person ("second": a smaller face in a bob that
// falls to the jaw, narrower shoulders) rises out of the same line.
//   f0     close on the tile and its manager; chip 1 already just out of the tile's left edge
//   f36    chip 7 shows on "seven"; f43 chip 8 shows on "eight"; then no more
//   f98    "delayed": the leader has barely reached the top; the camera is already heading back to the tile
//   f110   the close frame settles (still creeping)
//   f145   the new manager over an empty slot and an empty return track
// DEPARTURES (leading edge shows past the tile's left edge -> trailing edge clears it), frames:
//   chip 1 -4.6 -> -0.3 · 2 2.2 -> 6.5 · 3 9.0 -> 13.3 · 4 15.8 -> 20.1 · 5 22.6 -> 26.9 · 6 29.4 -> 33.7 ·
//   7 36.2 -> 40.5 · 8 43.0 -> 47.3
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
  Chips,
  CompanyShadow,
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
/** The crawl: constant speed, world px per frame (E runs 110). */
export const SPEED = 14;
export const LAP = LOOP_LEN / SPEED;
/** The beat between departures (frames). */
export const EVERY = 6.8;
/** The frame each chip's leading edge first shows past the tile's left edge (chip 8 on "eight"). */
export const DEPART = Array.from({ length: 8 }, (_, i) => 43 - (7 - i) * EVERY);
/** The emission frame (s 0, wholly under the tile): the leading edge shows 30 px of track later. */
export const EMITS = DEPART.map((t) => t - 30 / SPEED);
/** A chip cools from cream part of the way toward board as it crawls (the answer going stale); it stays a
 *  warm card grey, clearly the lightest thing in the upper frame. */
const dimOf = (s: number) => 0.42 * smoothstep((s - 200) / 1300);

// --- the manager swap -------------------------------------------------------------------------------------------
export const SINK0 = 108;
export const SINK_F = 10;
export const RISE0 = 118;
export const RISE_F = 12;
// --- the camera: one slow pull-back and rise, the tile's top anchored near the bottom ---------------------------
const K0 = 1.42;
const K1 = 1.08;
const A0 = 1468; // the tile's top on screen at f0 (as E opened: below the lower caption band)
const A1 = 1598; // ... at the end (the tile's foot ~ y 1890)
const camP = (f: number) => 0.92 * smoothstep((f + 10) / 140) + 0.08 * clamp01((f + 10) / 155);
/** The lean left while the chips climb the left leg: the world's x 540 sits right of centre, then returns. */
const leanX = (f: number) => 50 * (1 - smoothstep((f - 55) / 75)) + 10 * (1 - clamp01(f / 40));
/** Out with the chips: the pull-back and rise (as wide as all eight up the left leg + the tile, by ~f96). */
const camOut = (f: number): Cam => {
  const p = camP(f);
  const k = Math.exp(lerp(Math.log(K0), Math.log(K1), p));
  return camAnchored(k, lerp(A0, A1, p), 540 + leanX(f));
};
/** Back on the tile: the close frame (the tile ~75% of the width, wholly above the upper caption band, its
 *  foot at screen y CLOSE_FOOT), creeping in to the end. */
export const K_CLOSE = 1.82;
const CLOSE_FOOT = 1060;
const CLOSE_X = 548; // world x at the frame centre: both track ends at the tile show as stubs (the return one empty)
const camClose = (f: number): Cam => camAnchored(K_CLOSE * Math.exp(0.0016 * (f - BACK1)), CLOSE_FOOT, 540, CLOSE_X, 1770);
/** The move back: one eased blend from the moving out-camera into the close frame, f BACK0 -> BACK1. */
export const BACK0 = 87;
export const BACK1 = 110;
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
  const tilePt = { x: 600, y: 1610 };
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
