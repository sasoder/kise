// ---------------------------------------------------------------------------
// OutOfHand (sam-self-replicating, cut 3). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 89 frames. Palette B1.
//
// CHECK LINE: "There's a curve going up, it stumbles at points along the way, and in the end it literally breaks out
// of its chart."
//
// THE LINE: "things, at various times along the curve, are gonna get somewhat out of hand."
// WORD -> FRAME: things 7 · at 17 · various 23 · times 30 · along 36 · the 42 · curve 47 · are 54 · gonna 56 · get 59 ·
// somewhat 63 · out 70 · of 75 · hand 77 · speech ends ~85.
// DURATION: the slot 3.629 -> 7.341 s = 3.712 s x 23.976 = 89 frames (f0..f88).
//
// THE MOTION: one amber line drawing up a cream chart card, with the camera riding its hot tip from f0 at a close zoom.
// It stumbles as the tip passes through frame: stumble 1 f14-27 ("at various times"), stumble 2 f37-47 ("along the curve"), a
// small crouch at f56 ("gonna get"). On "somewhat out of hand" it takes one steep overshoot: the tip reaches the card's top
// edge on f71 (CONTACT), the card first reacts on f72 (it tips back on its shadow, peak f78, settling to the last frame),
// and the line carries on over the bare board while the camera lifts and eases back to hold the edge and the escaped line.
// Last frame: card ~1040 px wide, top edge y ~1040, tip y ~514, still creeping up.
// AMBER = compute (the demand for it); cream = the chart, the subject; the board = the world outside the chart.
//
// SOURCES: none. The curve is an unlabelled proxy shape: no data, no numbers.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack } from "../kits/cheeky-pint/museShared";
import { AmberCurve, CURVE_LEN, ChartCard, KINK } from "./computeCurve";

export const FPS = 24000 / 1001;
export const DURATION = 89;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the tip: arc length (world px) against the frame. A monotone cubic through the beats, slopes in world px per frame.
const TIP_KEYS: readonly [number, number][] = [
  [0, 225], // the line's young end, already drawn a little
  [14, KINK.k1Foot], // "at": the first jump starts
  [22, KINK.k1Top], // "various": stumble 1 well under way
  [37, KINK.k2Foot], // "along"
  [56, KINK.crouch], // "gonna": the crouch
  [71, KINK.topEdge], // "out": CONTACT, the tip on the card's top edge
  [84, CURVE_LEN - 114],
  [88, CURVE_LEN - 80],
];
const TIP_M0 = 6; // the real ease-in on f0
const TIP_MN = 8; // the living creep at the end
export const CONTACT_F = 71;
const tipSlopes = (() => {
  const n = TIP_KEYS.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((TIP_KEYS[i + 1][1] - TIP_KEYS[i][1]) / (TIP_KEYS[i + 1][0] - TIP_KEYS[i][0]));
  const m: number[] = [TIP_M0];
  for (let i = 1; i < n - 1; i++) m.push((2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  m.push(TIP_MN);
  return m;
})();
export const tipArc = (f: number) => {
  const K = TIP_KEYS;
  const hit = K.findIndex((q, j) => j < K.length - 1 && f < K[j + 1][0]);
  const i = hit < 0 ? K.length - 2 : hit;
  const h = K[i + 1][0] - K[i][0];
  const t = (f - K[i][0]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * tipSlopes[i] + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * tipSlopes[i + 1]
  );
};

// --- the camera: one ride that hands over to one lift and ease-back, the two glides overlapping so nothing holds.
export const CAM = makeClockCam(
  { x: 270, y: 1800, k: 2.7 },
  [
    { f0: -16, f1: 60, dx: 286, dy: -480 },
    { f0: -16, f1: 60, k: 2.05 },
    { f0: 42, f1: 85, dx: -22, dy: -405, k: 1.0 },
  ],
  DURATION,
);

// --- the rock: contact f71, first reaction f72, one damped lobe (peak f78) from rest, decaying to the last frame.
const ROCK_TAU = 7;
const rockAt = (f: number) => {
  if (f <= CONTACT_F) return 0;
  const t = (f - CONTACT_F) / ROCK_TAU;
  return t * t * Math.exp(2 * (1 - t));
};

const POOL = makePoolTrack({ x: 300, y: 1752, strength: 1 }, [{ f0: -10, f1: 90, x: 720, y: 760, strength: 1.6 }], DURATION);

const OutOfHand: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const arc = tipArc(S);
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <ChartCard k={cam.k} rock={rockAt(S)} />
      <AmberCurve s={arc / CURVE_LEN} k={cam.k} band={amberBandFor(cam)} rock={rockAt(S)} />
    </StoutStage>
  );
};

export default OutOfHand;
