// ---------------------------------------------------------------------------
// DefenseFirstThenOffense (kofman-vivaldi, cut 28). ChinaTalk style (newsprint) (styles/chinatalk.md; kit API in
// generated/components/kits/chinatalk/chinatalkVintage.md).
// Opaque 1080x1920, 24 fps, 248 frames.
//
// CHECK LINE: "the new technology (a drone) first goes to the side that is dug in and makes its defense hold; later
// the very same side uses that same drone to attack forward."
//
// THE LINE: "It's easiest to apply technology to the defense first, and it's easier to do defense on land than
// offense. And then usually that technology then gets adapted over time by the same force to enable offensive
// operations."
// WORD -> FRAME: easiest 4 · apply 17 · technology 23 · to the 35-41 · defense 44 · first 53 · and 65 · easier 70 ·
// to do 74-77 · defense 80 · on land 89-93 · than 98 · offense 101 · And then 105-116 · usually 119 ·
// that technology 129-134 · then 146 · gets 153 · adapted 160 · over 171 · time 189 · by 199 · the same 204-207 ·
// force 211 · to enable 218-221 · offensive 227 · operations 235 · (cut back to the speaker at 248).
// DURATION: the slot 28.833 -> 39.167 s = 10.333 s x 24 = 248 frames (f0..f247).
//
// THE PICTURE: a plain newspaper battle figure seen from above. Two held sides with a field between: our ground
// fills the frame below our trench and theirs the frame above their trench, each the house ink wash under a fine
// hatch (as the clip's map draws held ground); bare paper between is the field. Both trenches are heavy crenellated
// lines at the red-line weight with teeth 48 wide and 44 deep: ours INK_HI (teeth tops world y 960), theirs INK_LO
// (teeth bottoms world y 380), teeth facing each other. One big solid red drone (Phosphor "drone", DRONE_D, 300 world
// px) is the technology.
//
// THE MOTION: the drone flies in from the left frame edge, low over our trench (heading the way it travels,
// decelerating; in view from f4), and touches the top of one tooth at f44 ("defense"). From that contact the trench
// floods red outward along its length (frame edges red by ~f54), and right behind its front a red wash under a fine
// red hatch soaks out into the 280-px strip of field in front of the trench: the ground the drone covers. On "and ...
// easier" a dashed ink attack arrow marches straight down out of the enemy tooth above the drone (f65-86), dies on
// the edge of that red strip and bleeds away head-first (f88-101): the defense holds. From "And then" the strip and
// the trench's red drain back together into the point under the drone (f106-142), so only the drone is red, while
// the drone lifts off (60 world px) and slowly turns from the + to the X, nose up-field (f112-188); through "over
// time" the camera opens up-field (k 1.28 -> 1.05, f150-204). On "by the same force" the drone flies up the field
// (f194-232) and a solid red arrow is written out of our tooth behind it (head out at f199), the drone always just
// ahead of the arrow's head (the head is a filled red point, wet while it travels, instead of a round bead). The head
// touches the enemy trench at f230 and the enemy segment it hits floods red from that point (first red f230, settled
// f244). The drone settles hovering just beyond the enemy line (f232) and holds alive (a slow hover bob, the camera's
// creep) to f247; end framing: their trench at screen y ~363, ours ~1000, both washes in shot.
// CONTACTS: drone -> our trench f44, flood visible f44, kill zone from f46. Dashed arrow stops on the zone's edge
// f86 (it never reaches the drone). Red arrow head -> enemy trench f230, flood visible f230.
// RED = the technology (the drone) and what it does. Nothing else is red.
//
// SOURCES: none (no figures). Drone silhouette: Phosphor "drone" fill, MIT (vivaldiPictos.ts).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DashedPath,
  HatchFill,
  INK_HI,
  INK_LO,
  InkDiffuse,
  LINE,
  Pictogram,
  RED,
  RED_LINE,
  RED_WET,
  RedGroup,
  V_INK,
  VStage,
  WET_DRY_F,
  WetLine,
  clamp01,
  cumLen,
  easeInOutCubic,
  inkDiffuse,
  mixHex,
  pointAtLen,
  runVCamera,
  smoothstep,
  wpx,
} from "../kits/chinatalk/chinatalkVintage";
import type { DashMod, Pt } from "../kits/chinatalk/chinatalkVintage";
import { DRONE_D } from "./vivaldiPictos";

export const FPS = 24;
export const DURATION = 248;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ID = "dfo";

// --- the two trenches: crenellated (square-wave) lines, world px ------------------------------------------
/** tooth lattice: teeth 48 wide and 44 deep, centred on 540 + PERIOD * n; both lines run on past the frame edges on
 *  every camera state */
const PERIOD = 96;
const TOOTH_HALF = 24;
const TOOTH_D = 44;
const TEETH_N = 9;
const X_START = 540 - PERIOD * TEETH_N - TOOTH_HALF - 52;
const X_END = 540 + PERIOD * TEETH_N + TOOTH_HALF + 52;
/** ours: baseline at the rear, teeth facing up-field */
const OUR_TOOTH = 960;
const OUR_BASE = OUR_TOOTH + TOOTH_D;
/** theirs: baseline at their rear (top), teeth facing down toward us */
const THEIR_BASE = 336;
const THEIR_TOOTH = THEIR_BASE + TOOTH_D;
/** the tooth the drone defends, the one the enemy attack comes out of and the one it later attacks: one column */
const HOLD_X = 540 - PERIOD;
/** each side's held ground: the house ink wash under a fine hatch, from its trench to past the frame edge */
const SIDE_FAR = 2400;
const OUR_SIDE: Pt[] = [];
const THEIR_SIDE: Pt[] = [];
/** the kill zone: the strip of field in front of our trench that the drone covers, world px deep */
const STRIP_D = 280;
const STRIP_TOP = OUR_TOOTH - STRIP_D;
const STRIP: Pt[] = [];
/** house values for held ground (styles/chinatalk.md "Areas"; as the clip's map draws it), locked to the world */
const SIDE_HATCH = { fill: 0.1, lineOpacity: 0.35, angleDeg: 45, anchor: { x: 0, y: 0 } } as const;
/** the kill zone: the same hatch in red, a little stronger so it holds against the red trench */
const ZONE_HATCH = { fill: 0.16, lineOpacity: 0.5, angleDeg: 45, anchor: { x: 0, y: 0 } } as const;

const trenchPts = (base: number, tooth: number): Pt[] => {
  const pts: Pt[] = [{ x: X_START, y: base }];
  for (let n = -TEETH_N; n <= TEETH_N; n++) {
    const c = 540 + PERIOD * n;
    pts.push({ x: c - TOOTH_HALF, y: base }, { x: c - TOOTH_HALF, y: tooth }, { x: c, y: tooth }, { x: c + TOOTH_HALF, y: tooth }, { x: c + TOOTH_HALF, y: base });
  }
  pts.push({ x: X_END, y: base });
  return pts;
};
const OURS = trenchPts(OUR_BASE, OUR_TOOTH);
const THEIRS = trenchPts(THEIR_BASE, THEIR_TOOTH);
OUR_SIDE.push(...OURS, { x: X_END, y: OUR_BASE + SIDE_FAR }, { x: X_START, y: OUR_BASE + SIDE_FAR });
THEIR_SIDE.push(...THEIRS, { x: X_END, y: THEIR_BASE - SIDE_FAR }, { x: X_START, y: THEIR_BASE - SIDE_FAR });
STRIP.push(...OURS, { x: X_END, y: STRIP_TOP }, { x: X_START, y: STRIP_TOP });
/** a trench's arc length per world px across */
const ARC_PER_X = (PERIOD + 2 * TOOTH_D) / PERIOD;

/** split a polyline at the vertex (x, y): the two halves both start at that vertex and run outward */
const splitAt = (pts: Pt[], x: number, y: number) => {
  const i = pts.findIndex((p) => Math.abs(p.x - x) < 0.01 && Math.abs(p.y - y) < 0.01);
  return { right: pts.slice(i), left: pts.slice(0, i + 1).reverse() };
};
const OURS_SPLIT = splitAt(OURS, HOLD_X, OUR_TOOTH);
const THEIRS_SPLIT = splitAt(THEIRS, HOLD_X, THEIR_TOOTH);
const lenOf = (pts: Pt[]) => {
  const c = cumLen(pts);
  return c[c.length - 1];
};
const OURS_R = Math.max(lenOf(OURS_SPLIT.right), lenOf(OURS_SPLIT.left));

// --- the flood (red soaking along a trench from the point of contact) ---------------------------------------
const SOAK_P = 1.6;
const soak = (u: number) => 1 - Math.pow(1 - clamp01(u), SOAK_P);
const soakInv = (e: number) => 1 - Math.pow(1 - clamp01(e), 1 / SOAK_P);
/** ours: from the drone's touch to both ends of the trench */
const OUR_FLOOD_F0 = 44;
const OUR_FLOOD_F = 30;
/** the kill zone soaks out behind the trench's front, a soft-edged disc from the contact */
const ZONE_LAG = 2;
const ZONE_FEATHER = 140;
/** ...and back: drained into the point under the drone */
const DRAIN_F0 = 106;
const DRAIN_F = 36;
/** theirs: the segment the arrow hits, about two and a half teeth each way */
const HIT_F0 = 230;
const HIT_F = 14;
const HIT_R = 2.4 * (PERIOD + 2 * TOOTH_D);

// --- the drone ------------------------------------------------------------------------------------------------
const DRONE_SIZE = 300;
/** half its extent across the arms (rotate 0, the X) and along an arm (rotate 45, the +), world px */
const HALF_X = (82 / 256) * DRONE_SIZE;
const HALF_PLUS = (97.7 / 256) * DRONE_SIZE;
/** hover on our tooth: its lower rotor rests on the tooth's top line */
const HOVER: Pt = { x: HOLD_X, y: OUR_TOOTH - HALF_PLUS + 2 };
/** the way in: a curve from off the left edge, low behind our trench, rising into the hover heading 45 deg up-right */
const ENTRY_P0: Pt = { x: -170, y: 800 };
const ENTRY_C: Pt = { x: HOVER.x - 40, y: HOVER.y + 40 };
const ENTRY_F0 = -1;
const ENTRY_F1 = OUR_FLOOD_F0;
const ENTRY_PTS: Pt[] = Array.from({ length: 121 }, (_, i) => {
  const t = i / 120;
  const a = (1 - t) * (1 - t);
  const b = 2 * t * (1 - t);
  const c = t * t;
  return { x: a * ENTRY_P0.x + b * ENTRY_C.x + c * HOVER.x, y: a * ENTRY_P0.y + b * ENTRY_C.y + c * HOVER.y };
});
const ENTRY_CUM = cumLen(ENTRY_PTS);
const ENTRY_LEN = ENTRY_CUM[ENTRY_CUM.length - 1];
/** decelerating into the hover (a quadratic ease-out: arrives at rest on the touch) */
const entryEase = (u: number) => 1 - Math.pow(1 - clamp01(u), 2);
/** lift and turn: up off the tooth, from the + (heading up-right) to the X (heading up-field) */
const LIFT_F0 = 112;
const LIFT_F = 76;
const LIFT_Y = HOVER.y - 60;
/** the attack: up the field to hover just beyond the enemy line */
const GO_F0 = 194;
const GO_F = 38;
const FINAL_Y = THEIR_BASE - RED_LINE / 2 - HALF_X - 16;
/** the hover's life: a slow bob, world px */
const BOB_A = 3;
const BOB_T = 46;

/** heading in screen degrees (-90 = up the page): the X-config drone's nose lies between its two front arms */
const headingAt = (s: number) => {
  const a = pointAtLen(ENTRY_PTS, ENTRY_CUM, Math.max(0, s - 2));
  const b = pointAtLen(ENTRY_PTS, ENTRY_CUM, Math.min(ENTRY_LEN, s + 2));
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
};
/** eased out of the hover and into the next one (a sine in-out: no burst of speed) */
const goEase = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(u));
const goY = (S: number) => LIFT_Y + (FINAL_Y - LIFT_Y) * goEase((S - GO_F0) / GO_F);
export const droneAt = (S: number): { x: number; y: number; rot: number } => {
  if (S < ENTRY_F1) {
    const s = ENTRY_LEN * entryEase((S - ENTRY_F0) / (ENTRY_F1 - ENTRY_F0));
    const p = pointAtLen(ENTRY_PTS, ENTRY_CUM, s);
    return { x: p.x, y: p.y, rot: headingAt(s) + 90 };
  }
  const bobOn = smoothstep((S - ENTRY_F1) / 12) * (1 - smoothstep((S - GO_F0 + 4) / 10)) + smoothstep((S - (GO_F0 + GO_F - 4)) / 10);
  const bob = BOB_A * Math.sin((2 * Math.PI * (S - ENTRY_F1)) / BOB_T) * bobOn;
  const lift = goEase((S - LIFT_F0) / LIFT_F);
  const rot0 = headingAt(ENTRY_LEN) + 90;
  const rot = rot0 * (1 - lift);
  const y = S < GO_F0 ? HOVER.y + (LIFT_Y - HOVER.y) * lift : goY(S);
  return { x: HOVER.x, y: y + bob, rot };
};

// --- the enemy attack: a dashed ink arrow that stops short of the drone and bleeds away --------------------------
/** straight down out of their tooth at the drone; its head dies on the kill zone's edge */
const ATK_FROM: Pt = { x: HOLD_X, y: THEIR_TOOTH - 30 };
const ATK_DIR = { x: 0, y: 1 };
const ATK_TIP: Pt = { x: HOLD_X, y: STRIP_TOP };
const ATK_LEN = Math.hypot(ATK_TIP.x - ATK_FROM.x, ATK_TIP.y - ATK_FROM.y);
const ATK_F0 = 65;
const ATK_F = 21;
const ATK_BLEED_F0 = 88;
const ATK_BLEED_RUN = 4;
const ATK_BLEED_F = 9;
/** marching down at an even pace that slows into the stop */
const atkEase = (u: number) => {
  const x = clamp01(u);
  return x < 0.55 ? x / 0.775 : 0.55 / 0.775 + ((1 - 0.55 / 0.775) * (1 - Math.pow(1 - (x - 0.55) / 0.45, 2)));
};

// --- the red arrow: written up the field behind the drone ------------------------------------------------------------
const ARROW_FROM_Y = OUR_BASE;
/** the gap between the drone's centre and the arrow head's point: from its emergence out of our tooth to the touch */
const ARROW_OUT_F = 199;
const G0 = OUR_TOOTH - goY(ARROW_OUT_F);
const G1 = THEIR_TOOTH - goY(HIT_F0);
const apexAt = (S: number) => {
  const g = G0 + (G1 - G0) * clamp01((S - ARROW_OUT_F) / (HIT_F0 - ARROW_OUT_F));
  return Math.max(THEIR_TOOTH, goY(S) + g);
};
/** the frame the head's point passed world y (inverse of apexAt over the flight) */
const frameAtApex = (y: number) => {
  let lo = ARROW_OUT_F - 12;
  let hi = HIT_F0;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (apexAt(mid) > y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
/** arrow head, SCREEN px at k = 1 */
const HEAD_LEN = 50;
const HEAD_W = 54;
const DASH_HEAD_LEN = 38;
const DASH_HEAD_W = 38;

// --- the camera: close on our trench (just above the caption bands) and the drone's way in, a gentle push as the
// trench floods, then through "over time" it opens up-field, our trench held where it is, to the whole field with
// both trenches and the full arrow, and creeps in to the end -------------------------------------------------------
/** the camera at zoom k with our trench's baseline at screen y `sy` */
const onOurs = (f: number, x: number, k: number, sy: number, ease?: "linear") => ({ f, x, y: OUR_TOOTH - (sy - 960) / k, k, ease });
export const camAt = runVCamera(
  [onOurs(-24, 520, 1.26, 1040), onOurs(50, 516, 1.3, 1040), onOurs(150, 520, 1.28, 1040), onOurs(204, 524, 1.05, 994), onOurs(DURATION - 1, 524, 1.065, 1004, "linear")],
  DURATION,
);

/** a filled arrow head, point at `tip`, pointing along unit `dir` */
const headD = (tip: Pt, dir: Pt, len: number, w: number) => {
  const bx = tip.x - dir.x * len;
  const by = tip.y - dir.y * len;
  const nx = -dir.y;
  const ny = dir.x;
  return `M${tip.x.toFixed(2)} ${tip.y.toFixed(2)}L${(bx + (nx * w) / 2).toFixed(2)} ${(by + (ny * w) / 2).toFixed(2)}L${(bx - (nx * w) / 2).toFixed(2)} ${(by - (ny * w) / 2).toFixed(2)}Z`;
};

/** red soaked along both halves of a trench out to radius r (arc length from the contact) */
const TrenchRed: React.FC<{ id: string; halves: { right: Pt[]; left: Pt[] }; r: number; k: number; ageAt?: (s: number) => number }> = ({
  id,
  halves,
  r,
  k,
  ageAt,
}) =>
  r > 0.5 ? (
    <>
      <WetLine id={`${id}-r`} points={halves.right} len={r} k={k} ageAt={ageAt} shadow={false} />
      <WetLine id={`${id}-l`} points={halves.left} len={r} k={k} ageAt={ageAt} shadow={false} />
    </>
  ) : null;

const DefenseFirstThenOffense: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;

  // our trench's red: soaks out from the touch, later drains back into it
  const ourR: number =
    S < DRAIN_F0 ? OURS_R * soak((S - OUR_FLOOD_F0 + 0.5) / OUR_FLOOD_F) : OURS_R * (1 - easeInOutCubic((S - DRAIN_F0) / DRAIN_F));
  const ourAge = S < DRAIN_F0 ? (s: number) => S - (OUR_FLOOD_F0 + OUR_FLOOD_F * soakInv(s / OURS_R)) : undefined;
  // the kill zone: a disc from the contact that follows the trench's front across (and drains back with it)
  const zoneR = (S < DRAIN_F0 ? OURS_R * soak((S - OUR_FLOOD_F0 - ZONE_LAG) / OUR_FLOOD_F) : ourR) / ARC_PER_X;
  // their trench's red, at the hit
  const hitR = HIT_R * soak((S - HIT_F0 + 0.5) / HIT_F);
  const hitAge = (s: number) => S - (HIT_F0 + HIT_F * soakInv(s / HIT_R));

  // the enemy attack
  const atkD = ATK_LEN * atkEase((S - ATK_F0) / ATK_F);
  const atkTip: Pt = { x: ATK_FROM.x + ATK_DIR.x * atkD, y: ATK_FROM.y + ATK_DIR.y * atkD };
  const dHeadLen = wpx(DASH_HEAD_LEN, k);
  const atkShaftTo: Pt = { x: atkTip.x - ATK_DIR.x * (dHeadLen - 2), y: atkTip.y - ATK_DIR.y * (dHeadLen - 2) };
  const atkMod = (_i: number, sMid: number, total: number): DashMod => {
    const u = clamp01((S - ATK_BLEED_F0 - (1 - sMid / total) * ATK_BLEED_RUN) / ATK_BLEED_F);
    if (u <= 0) return null;
    const d = inkDiffuse(u);
    return { opacity: d.opacity, blur: d.blur, spread: d.spread };
  };
  const atkOn = S >= ATK_F0 && S < ATK_BLEED_F0 + ATK_BLEED_RUN + ATK_BLEED_F + 1;

  // the red arrow
  const apex = apexAt(S);
  const headLen = wpx(HEAD_LEN, k);
  const shaftTop = apex + headLen - 3;
  const arrowOn = S >= ARROW_OUT_F - 12;
  const headWet = S < HIT_F0 ? 1 : 1 - smoothstep((S - HIT_F0) / WET_DRY_F);

  const drone = droneAt(S);

  return (
    <VStage S={S} cam={cam}>
      <defs>
        <clipPath id={`${ID}-above-ours`}>
          <rect x={-2000} y={-2000} width={5000} height={2000 + OUR_TOOTH} />
        </clipPath>
        <clipPath id={`${ID}-below-theirs`}>
          <rect x={-2000} y={THEIR_TOOTH} width={5000} height={4000} />
        </clipPath>
        {zoneR > 0.5 ? (
          <>
            <radialGradient id={`${ID}-zone-g`} gradientUnits="userSpaceOnUse" cx={HOLD_X} cy={OUR_TOOTH} r={(zoneR + ZONE_FEATHER).toFixed(2)}>
              <stop offset={0} stopColor="#FFFFFF" />
              <stop offset={(zoneR / (zoneR + ZONE_FEATHER)).toFixed(4)} stopColor="#FFFFFF" />
              <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
            <mask id={`${ID}-zone-m`} maskUnits="userSpaceOnUse" x={X_START} y={STRIP_TOP - 10} width={X_END - X_START} height={OUR_BASE - STRIP_TOP + 20}>
              <rect x={X_START} y={STRIP_TOP - 10} width={X_END - X_START} height={OUR_BASE - STRIP_TOP + 20} fill={`url(#${ID}-zone-g)`} />
            </mask>
          </>
        ) : null}
      </defs>

      {/* the two held sides, and the kill zone the drone covers in front of ours */}
      <HatchFill id={`${ID}-their-side`} region={THEIR_SIDE} k={k} {...SIDE_HATCH} />
      <HatchFill id={`${ID}-our-side`} region={OUR_SIDE} k={k} {...SIDE_HATCH} />
      {zoneR > 0.5 ? (
        <g mask={`url(#${ID}-zone-m)`}>
          <HatchFill id={`${ID}-zone`} region={STRIP} k={k} color={RED} {...ZONE_HATCH} />
        </g>
      ) : null}

      {/* the enemy attack: out of their tooth, down at the drone; stops short and bleeds away */}
      {atkOn ? (
        <g clipPath={`url(#${ID}-below-theirs)`}>
          <DashedPath points={[ATK_FROM, atkShaftTo]} k={k} S={S} dashMod={atkMod} width={LINE} />
          <InkDiffuse u={(S - ATK_BLEED_F0) / ATK_BLEED_F} k={k} cx={atkTip.x} cy={atkTip.y}>
            <path d={headD(atkTip, ATK_DIR, dHeadLen, wpx(DASH_HEAD_W, k))} fill={V_INK} opacity={INK_HI} />
          </InkDiffuse>
        </g>
      ) : null}

      {/* the red arrow: out of our tooth, up the field behind the drone */}
      {arrowOn ? (
        <g clipPath={`url(#${ID}-above-ours)`}>
          <RedGroup k={k}>
            <WetLine
              id={`${ID}-arrow`}
              points={[
                { x: HOLD_X, y: ARROW_FROM_Y },
                { x: HOLD_X, y: Math.min(ARROW_FROM_Y, shaftTop) },
              ]}
              len={Math.max(0, ARROW_FROM_Y - shaftTop)}
              k={k}
              ageAt={(s) => S - frameAtApex(ARROW_FROM_Y - s - headLen)}
              shadow={false}
            />
            <path d={headD({ x: HOLD_X, y: apex }, { x: 0, y: -1 }, headLen, wpx(HEAD_W, k))} fill={mixHex(RED, RED_WET, headWet)} />
          </RedGroup>
        </g>
      ) : null}

      {/* their trench, and the segment the arrow takes */}
      <WetLine id={`${ID}-theirs`} points={THEIRS} k={k} ink rung={INK_LO} width={RED_LINE} />
      <RedGroup k={k}>
        <TrenchRed id={`${ID}-hit`} halves={THEIRS_SPLIT} r={hitR} k={k} ageAt={hitAge} />
      </RedGroup>

      {/* our trench, flooded by the drone's defense and drained back into it */}
      <WetLine id={`${ID}-ours`} points={OURS} k={k} ink rung={INK_HI} width={RED_LINE} />
      <RedGroup k={k}>
        <TrenchRed id={`${ID}-hold`} halves={OURS_SPLIT} r={ourR} k={k} ageAt={ourAge} />
      </RedGroup>

      {/* the technology */}
      <RedGroup k={k}>
        <Pictogram d={DRONE_D} x={drone.x} y={drone.y} size={DRONE_SIZE} color={RED} rung={1} rotate={drone.rot} />
      </RedGroup>
    </VStage>
  );
};

export default DefenseFirstThenOffense;
