// ---------------------------------------------------------------------------
// LotOfBets (nik-trend-friend, cut 48). Cheeky Pint style (stout) (styles/cheeky-pint.md), the stout board.
// Opaque 1080x1920, 23.976 fps, 106 frames. Palette B1 (the stoutShared default).
// World: betLoop.tsx (the loop world this cut owns; cut F FeedbackComesLate returns to it).
//
// CHECK LINE: "At Revolut the bets go out and come straight back with their result, again and again, so what
// they have learned piles up fast."
//
// THE LINE (Nik Storonsky): "because we've done a lot of bets and we had feedback loop a lot as well"
// WORD -> FRAME: because 0 · we've 6 · done 11 · a lot 18 · of 21 · bets 24 · and 31 · we 46 · had 66 ·
// feedback 71 · loop 78 · a 85 · lot 99
// DURATION: the slot 48.799 -> 53.220 s = 4.421 s x 23.976 (24000/1001) = 106.0 -> 106 frames (f0..f105).
//
// THE MOTION: one continuous loop. Chips (bets) stream out from under the Revolut tile's left edge in pairs,
// one pair every 3 f, ride the stadium track clockwise at constant speed (a lap in 31 f), turn amber down
// the right leg (the result is in) and go back under the tile's right edge; every chip that comes home
// pushes its own lane's amber stack one chip up out of the slot in the tile's top: two stacks of poker chips
// side by side, each one chip wide, UNIT 26 per chip (stackCount over each lane's arrivals). The
// camera opens close on the tile (k 1.37, the tile below the lower caption band) and pulls back, the tile's
// top anchored near screen y 1468 -> 1500, so the eye climbs with the stacks' tops while the loop opens out:
// the whole circuit is in frame from f57 (on "feedback loop" f71-78: cream out on the left, amber home on
// the right), and the camera settles into a slow creep to the end; the stream and the rise never stop.
//   f0     already running: 20 chips on the track, a pair at the home corner, the stacks 5.5 chips each
//          (11 in all; top y 1273). Counts below are chips in all (both stacks); each stack holds half.
//   f24    "bets": both legs beaded (a pair every ~320 world px per lane); 16 chips home in the cut, 27 in all
//   f46    "we": the top arc entering, 42 in all (top y 857)
//   f71-78 "feedback loop": the full circuit in frame, 58 -> 63 in all (top y 705 -> 662)
//   f99    resolved: the whole loop, 77 in all (top y 508), still rising; f105: 81 chips home in the two
//          stacks (40.5 each, top y 458; 70 of them came home during the cut). No numeral, no label.
// CAUSE -> EFFECT (a chip coming home): CONTACT = the first frame a home-coming chip overlaps the tile's right
// edge; FIRST REACTION = the first frame of its push (it is wholly under the tile 0.56 f after contact; the
// push eases over PUSH_F 4 f; each chip pushes its own lane's stack). First pair home in the cut: contact f1
// (s 0.46), home 1.02 -> both stacks' push shows from f2. Every pair after: + 3 f (contact f4 / push f5,
// f7 / f8, ...). The pair before it (home f-1.98) is still pushing at f0, so the stacks already rise on f0.
// Each stack rises 1/3 chip per frame: its seams flow upward (every-frame sheet of the stack tops, f60-75).
// STROBING: per-frame travel 107 world px vs same-lane spacing 320 (ratio 1/3): the beads flow forward
// (every-frame strip of the left leg, f30-41). The pairs ride abreast, so no cross-lane match.
// CAPTION BANDS: the tile (R, peg) stays below y 1468 throughout; only the track, chips in motion and the
// stacks' shafts cross the bands. The stacks' TOP crosses the upper band (1250 -> 1080) on f2 -> f18 while
// it rises at ~11 px/f: the steady rise cannot pass it faster.
// AMBER = the signal that a bet is working (the result came back): chips turn amber on the right leg, the
// stacks of results are amber. Cream = the bets going out; board = the manager peg (context; it never moves).
//
// SOURCES: the Revolut "R" (revolutMark.ts, from https://commons.wikimedia.org/wiki/File:Revolut_logo.svg,
// public domain text logo). "About 100 bets" (historical data on ~100 bets): Nik, same episode, ~19:00
// (COMMON.md); the cut ends on 81 chips home, no numeral on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor, clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { BetLoopWorld, TILE_BOX, arrivalOf, camAnchored, chipAt, pairStream, stackCount, stackTopOf, type ChipDraw } from "./betLoop";

export const FPS = 24000 / 1001;
export const DURATION = 106;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the stream ---------------------------------------------------------------------------------------------
/** A lap (emission under the tile -> wholly back under it) in frames: constant speed LOOP_LEN / LAP. */
export const LAP = 31;
/** One pair (both lanes abreast) leaves every EVERY frames. */
export const EVERY = 3;
/** The first emission: early enough that the track is full at f0 and 5-6 pairs are already home. */
export const T0 = -47.7;
export const EMITS = pairStream(T0, EVERY, Math.ceil((DURATION + 2 - T0) / EVERY));
export const ARRIVALS = EMITS.map((t) => arrivalOf(t, LAP));

// --- the camera: a pull-back from the tile, its top anchored near the bottom of the frame -------------------
const K0 = 1.38;
const K1 = 0.99;
const A0 = 1468; // the tile's top on screen at f0 (below the lower caption band)
const A1 = 1500; // ... at rest
/** Progress of the one move: an eased pull-back (f -8 .. 96) plus a slow creep that never stops. */
const camP = (f: number) => 0.94 * smoothstep((f + 8) / 104) + 0.06 * clamp01((f + 8) / 113);
export const camAt = (f: number): Cam => {
  const p = camP(f);
  const k = Math.exp(lerp(Math.log(K0), Math.log(K1), p));
  return camAnchored(k, lerp(A0, A1, p));
};

const LotOfBets: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const band = amberBandFor(cam);
  const chips: ChipDraw[] = [];
  for (const t of EMITS) {
    for (const lane of [-1, 1]) {
      const c = chipAt(f, t, LAP, lane);
      if (c.onTrack) chips.push({ x: c.x, y: c.y, amber: c.amber });
    }
  }
  // one stack per lane: each chip that comes home pushes its own lane's stack (the pairs ride abreast, so
  // both lanes arrive on the same frame and the two stacks rise together)
  const perLane = stackCount(f, ARRIVALS, 0, 1);
  const counts: [number, number] = [perLane, perLane];
  // the light pool rides between the tile and the stacks' top
  const pool = { x: 540, y: lerp(TILE_BOX.y, stackTopOf(perLane), 0.45) };
  return (
    <StoutStage S={f} cam={cam} rest={camAt(0)} pool={pool}>
      <BetLoopWorld k={cam.k} band={band} chips={chips} counts={counts} mark="revolut" />
    </StoutStage>
  );
};

export default LotOfBets;
