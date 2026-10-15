// ---------------------------------------------------------------------------
// hundredShared: THE DEAD LOOK of the clip "Sheppard_Cajamarca_infinite_KD"
// (Si Sheppard with Dwarkesh Patel, Cajamarca 16 Nov 1532), shared by
// HundredAgainstHundredThousand (the slaughter) and any later cut that shows
// the dead (e.g. KdRatioOfInfinity's heap). Tiny on purpose: no world, no
// motion, so importing it costs nothing. Values are frozen.
//
// THE TWO STATES OF A CREAM MAN.
//   living  the worlds' existing looks (the plaza crowd at the full rung with
//           its dark casing; the plain army as the mid-tone stipple)
//   dead    cream INK at opacity DEAD_OP, radius DEAD_R_SCALE x the living
//           radius, NO casing
// A man dies when the mechanism reaches him: he eases from the living look to
// the dead look over DEAD_EASE_F frames (deathQ) and settles DEAD_FALL_M
// metres (a fall), then never moves again.
// ---------------------------------------------------------------------------

/** a dead man's opacity (cream INK) */
export const DEAD_OP = 0.26;
/** a dead man's radius as a share of his living radius */
export const DEAD_R_SCALE = 0.85;
/** frames a man takes to go from living to dead */
export const DEAD_EASE_F = 6;
/** metres he settles as he falls */
export const DEAD_FALL_M = 0.6;

/** how dead a man is at frame f (0 living .. 1 dead; smoothstep over
 *  DEAD_EASE_F frames from tD, the frame the mechanism reaches him) */
export const deathQ = (f: number, tD: number) => {
  const x = (f - tD) / DEAD_EASE_F;
  return x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
};

/** the look of a man q of the way to dead, from his living look (radius r,
 *  opacity op, casing cs; any units): radius, opacity and casing at q */
export const deadLook = (q: number, r: number, op: number, cs = 0) => ({
  r: r + (r * DEAD_R_SCALE - r) * q,
  op: op + (DEAD_OP - op) * q,
  casing: cs * (1 - q),
});
