// ---------------------------------------------------------------------------
// RedBullShareholders (toto-twenty-person, cut 11). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 85 frames. Palette B1. The shared world: orgWorld.tsx v2 (REVISION_1: no ledge, no
// labels, no cards; people stand free on the board; decision-makers amber at 1.3x; every team symmetric about
// the frame's centre at its HOME, the principal's feet at screen (540, 1030)).
//
// CHECK LINE: "Red Bull's team principal sits under a group of shareholders, not a CEO": the camera leaves
// Ferrari's hub and finds the next principal at the same bottom-centre spot, alone, with a group of amber owners
// above him under the Red Bull mark, his reporting line fanning into all four.
//
// THE LINE: "Then you have other much shareholder-led organizations like Red Bull, where"
// WORD -> FRAME: you 4 · have 11 · other/much 16 · shareholder 27 · -led 43 · organizations 47 · like 58 ·
// Red 70 · Bull 75 (ends 81) · where 84
// DURATION: slot 11.920 -> 15.320 s = 3.400 s x 25 = 85 frames (f0..f84). S = frame + 298.
//
// THE MOTION: one truck right, from HOME.ferrari (cut A's last frame: the finished hub) to HOME.redbull, a pure
// x move of 1020 px at k 1 (the v1 truck the user kept: the cut opens already gliding at ~10 px/f, eases up to
// ~30 px/f by f12, then a long soft landing exactly on HOME.redbull at f80, no overshoot). Ferrari slides off
// left; the light pool travels with the camera. Red Bull's principal already stands at his spot (off frame at
// f0, kraft, headset on) and warms to cream as he comes into the light (~f22-32, derived from his screen x, not
// a timer), landing where Ferrari's principal stood (540, 1030). On "shareholder-led" the four owners appear
// together, amber, in their symmetric arc (stout entrance f30-42; the right pair is still coming into frame with
// the camera and the right owner is wholly in by f44). On "organizations" his reporting line rises from his head and fans into
// the four: one tip, eased over f47-62, up the stem to the fork and on along all four branches at one speed (the
// inner pair reaches its owners ~f57, the outer pair f62). On "like" the bulls-and-sun tile appears centred
// above the owners (f58-68, settled and readable before "Red" f70). f80-84: a living hold exactly at
// HOME.redbull with REDBULL_DONE (sway, drift, grain and the pool's breath on the story clock); cut C opens on it.
// AMBER = the power to decide over the principal (here the owners); cream = the principal; kraft = anyone.
//
// JOIN WITH CUT A: f0 = FerrariOneOfTen's last frame in camera, Ferrari's state, pool point and the ground's
// parallax origin (asserted at load); Red Bull's principal already stands at his spot but is wholly off frame
// (asserted). Only the story-clock ambience differs (S 298 vs A's 192: sway, ground drift, grain, the pool's
// breath), as the clip's clock asks; the cuts are not adjacent in time.
//
// SOURCES: the bulls-and-sun mark is orgLogos.ts (from en.wikipedia File:RedBullEnergyDrink.svg, LOGOS_READY.md).
// No figures or text on screen. Red Bull GmbH is owned by the Yoovidhya family (51 %) and the Mateschitz side
// (49 %) (vienna.at, 4 Jun 2025); the four owners are the director's "group of shareholders", no names.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { clamp01, smoothstep } from "../kits/cheeky-pint/stoutShared";
import {
  AUDI_EMPTY,
  BOSS_SIZE,
  FERRARI,
  FERRARI_DONE,
  FEET_SY,
  HOME,
  OrgStage,
  OrgWorld,
  POOL_AT,
  PRINCIPAL_SIZE,
  REDBULL,
  REDBULL_DONE,
  TEAM_BOX,
  polylineLength,
  type FerrariState,
  type RedBullState,
  type WorldState,
} from "./orgWorld";
import { DURATION as A_DURATION, SLOT_START as A_SLOT_START, camAt as camA, poolAt as poolA, worldAt as worldA } from "./FerrariOneOfTen";

export const FPS = 25;
export const DURATION = 85;
export const SLOT_START = 298; // the slot's first frame in the sequence (story clock S = frame + 298)
export const schema = z.object({});
export const defaultProps = schema.parse({});

const win = (f: number, f0: number, f1: number) => smoothstep((f - f0) / (f1 - f0));
const lin = (f: number, f0: number, f1: number) => clamp01((f - f0) / (f1 - f0));

// --- the camera: one truck right, HOME.ferrari -> HOME.redbull (same k, same height) -----------------------------
// Its speed (in units of the peak): the cut opens already gliding at V0 (we come from the speaker, so f0 holds A's
// last picture but not its stillness), eases up to the peak over RAMP frames (smoothstep: no kink, |dv| <= ~2.5
// px/f^2), then falls as (1 - t)^Q to rest at LAND (velocity and acceleration both reach 0 there: a long soft
// landing, no overshoot). Integrated in closed form, so f0 is exactly HOME.ferrari and every frame from LAND
// exactly HOME.redbull.
const V0 = 0.35;
const RAMP = 12;
const LAND = 80;
const Q = 1.6;
const DECAY = LAND - RAMP;
const TOTAL = V0 * RAMP + ((1 - V0) * RAMP) / 2 + DECAY / (Q + 1);
const cum = (f: number) => {
  if (f <= 0) return 0;
  if (f < RAMP) {
    const s = f / RAMP;
    return V0 * f + (1 - V0) * RAMP * (s * s * s - (s * s * s * s) / 2); // V0 + the integral of smoothstep
  }
  if (f < LAND) return V0 * RAMP + ((1 - V0) * RAMP) / 2 + (DECAY / (Q + 1)) * (1 - Math.pow(1 - (f - RAMP) / DECAY, Q + 1));
  return TOTAL;
};
/** The truck's progress 0..1. */
export const truckAt = (f: number) => (f >= LAND ? 1 : cum(f) / TOTAL);
const CAM0: Cam = HOME.ferrari;
const CAM1: Cam = HOME.redbull;
export const camAt = (f: number): Cam => {
  if (f >= LAND) return CAM1;
  const u = truckAt(f);
  return { x: CAM0.x + (CAM1.x - CAM0.x) * u, y: CAM0.y + (CAM1.y - CAM0.y) * u, k: CAM0.k };
};
/** The ground's parallax origin: cut A's opening camera, so the board carries on from A's last frame. */
const REST: Cam = camA(0);

// --- the pool travels with the camera (POOL_AT.ferrari -> POOL_AT.redbull) and breathes as in cut A -------------
export const poolAt = (f: number, S: number) => {
  const u = truckAt(f);
  const a = POOL_AT.ferrari;
  const b = POOL_AT.redbull;
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, strength: (a.strength + (b.strength - a.strength) * u) * (1 + 0.05 * Math.sin(S / 11)) };
};

// --- the beats ---------------------------------------------------------------------------------------------------
/** the principal warms as he comes into the light: his screen x from WARM_SX[0] to WARM_SX[1] (the pool travels
 *  with the camera). With this truck: ~f22 -> ~f32. */
const WARM_SX: [number, number] = [1070, 860];
const principalSx = (f: number) => 540 + (REDBULL.px - camAt(f).x) * camAt(f).k;
const OWNERS: [number, number] = [30, 42]; // "shareholder" f27 .. "-led" f43: one group, one window, amber
/** the reporting line: one tip, eased over LINE, up the stem and on along all four branches at one speed */
const LINE: [number, number] = [47, 62]; // "organizations" f47-58
const STEM_LEN = polylineLength(REDBULL.stem);
const BRANCH_LEN = REDBULL.branches.map((b) => polylineLength(b));
const REACH = STEM_LEN + Math.max(...BRANCH_LEN);
const TILE: [number, number] = [58, 68]; // "like" f58 -> settled f68, before "Red" f70

export const redbullAt = (f: number): RedBullState => {
  const tip = win(f, ...LINE) * REACH; // world px travelled by the tip from his head
  return {
    tile: lin(f, ...TILE),
    principal: { appear: 1, warm: smoothstep((WARM_SX[0] - principalSx(f)) / (WARM_SX[0] - WARM_SX[1])), headset: 1 },
    stem: clamp01(tip / STEM_LEN),
    branches: BRANCH_LEN.map((L) => clamp01((tip - STEM_LEN) / L)),
    owners: REDBULL.owners.map(() => lin(f, ...OWNERS)),
    amber: 1,
    bright: 0,
    dim: 0,
  };
};

export const worldAt = (f: number): WorldState => ({ ferrari: FERRARI_DONE, redbull: redbullAt(f), audi: AUDI_EMPTY });

const RedBullShareholders: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const S = frame + SLOT_START;
  const cam = camAt(frame);
  return (
    <OrgStage S={S} cam={cam} rest={REST} pool={poolAt(frame, S)}>
      <OrgWorld cam={cam} w={worldAt(frame)} />
    </OrgStage>
  );
};

export default RedBullShareholders;

// --- load-time checks ------------------------------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`RedBullShareholders: ${m}`);
  };
  const close = (a: number, b: number, e = 1e-9) => Math.abs(a - b) <= e;
  const sameCam = (a: Cam, b: Cam) => close(a.x, b.x) && close(a.y, b.y) && close(a.k, b.k, 1e-12);
  const flatR = (o: RedBullState) => [o.tile, o.principal.appear, o.principal.warm, o.principal.headset, o.stem, ...o.branches, ...o.owners, o.amber, o.bright, o.dim];
  const flatF = (o: FerrariState) => [o.tile, o.principal.appear, o.principal.warm, o.principal.headset, ...o.others, ...o.spokes, o.ceo, o.ceoAmber, o.bright, o.dim];
  const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => close(v, b[i]));
  const sx = (f: number, x: number) => 540 + (x - camAt(f).x) * camAt(f).k;
  const sy = (f: number, y: number) => 960 + (y - camAt(f).y) * camAt(f).k;
  // the join: f0 is cut A's last frame (camera, Ferrari, pool point); A's clock is S = frame + its slot start
  const aLast = A_DURATION - 1;
  if (!sameCam(camAt(0), camA(aLast)) || !sameCam(camAt(0), HOME.ferrari)) fail("f0 camera is not cut A's last frame");
  const wA = worldA(aLast);
  if (!same(flatF(worldAt(0).ferrari), flatF(wA.ferrari))) fail("f0 Ferrari is not cut A's last frame");
  if (JSON.stringify(worldAt(0).audi) !== JSON.stringify(wA.audi)) fail("f0 Audi is not cut A's last frame");
  const pA = poolA(aLast, 0);
  const pB = poolAt(0, 0);
  if (!close(pA.x, pB.x) || !close(pA.y, pB.y) || !close(pA.strength, pB.strength)) fail("f0 pool point is not cut A's");
  if (A_SLOT_START + aLast >= SLOT_START) fail("cut A must end before this slot");
  // Red Bull differs from A's (empty) only off frame: at f0 his whole team box is right of the frame (+ his shadow)
  if (sx(0, TEAM_BOX.redbull.x0) < 1080 + 24 || sx(0, REDBULL.px - PRINCIPAL_SIZE) < 1080 + 24) fail("Red Bull shows at f0");
  // the end: a living hold exactly at HOME.redbull with REDBULL_DONE from LAND to the last frame
  for (let f = LAND; f < DURATION; f++) {
    if (!sameCam(camAt(f), HOME.redbull)) fail(`camera off HOME.redbull at f${f}`);
    if (!same(flatR(redbullAt(f)), flatR(REDBULL_DONE))) fail(`state not REDBULL_DONE at f${f}`);
  }
  // the principal lands where Ferrari's stood
  if (!close(sx(LAND, REDBULL.px), 540) || !close(sy(LAND, 0), FEET_SY)) fail("principal not at (540, FEET_SY)");
  // the truck: monotone, one speed lobe, never faster than 31 px/f on screen, |dv| under the house 2.5 px/f^2
  let vPrev = (camAt(1).x - camAt(0).x) * CAM0.k;
  let peaked = false;
  for (let f = 2; f <= LAND + 1; f++) {
    const v = (camAt(f).x - camAt(f - 1).x) * CAM0.k;
    if (v < -1e-9) fail(`truck reverses at f${f}`);
    if (v > 31) fail(`truck at ${v.toFixed(1)} px/f at f${f}`);
    if (Math.abs(v - vPrev) > 2.6) fail(`truck jerks ${(v - vPrev).toFixed(2)} px/f^2 at f${f}`);
    if (v < vPrev - 1e-9) peaked = true;
    else if (peaked && v > vPrev + 1e-9) fail(`second speed lobe at f${f}`);
    vPrev = v;
  }
  // the warm-up runs ~f21-33
  if (redbullAt(20).principal.warm > 0.02 || redbullAt(33).principal.warm < 0.98) fail("warm-up outside ~f21-33");
  // the owners: wholly in frame by the end of their entrance; the tile wholly in frame when it starts
  const right = REDBULL.owners[3].x + BOSS_SIZE / 2;
  if (sx(OWNERS[1] + 2, right) > 1080) fail(`the right owner is off frame at f${OWNERS[1] + 2} (${sx(OWNERS[1] + 2, right).toFixed(0)})`);
  if (sx(OWNERS[0], REDBULL.owners[0].x - BOSS_SIZE / 2) < 0) fail("the left owner is off frame left");
  const t = REDBULL.tile;
  if (sx(TILE[0], t.x + t.w / 2) > 1080 || sx(TILE[0], t.x - t.w / 2) < 0) fail("tile appears off frame");
  // the frame: the whole team inside y 260..1070 (out of the caption bands) on every frame (the camera is level)
  for (let f = 0; f < DURATION; f++) {
    if (sy(f, TEAM_BOX.redbull.y0) < 260 || sy(f, TEAM_BOX.redbull.y1) > 1070) fail(`Red Bull leaves y 260..1070 at f${f}`);
  }
  // no collisions: owners' heads under the tile's foot; the fork under the inner owners' feet and over his head
  const ownerTop = Math.min(...REDBULL.owners.map((o) => o.feet - o.size));
  if (t.y + t.h / 2 > ownerTop - 16) fail("tile on the owners' heads");
  if (REDBULL.fork[1] > -PRINCIPAL_SIZE - 40 || REDBULL.fork[1] < Math.max(...REDBULL.owners.map((o) => o.feet)) + 40) fail("fork crowds a body");
  if (FERRARI.x !== 0) fail("orgWorld changed under this cut");
}
