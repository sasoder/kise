// ---------------------------------------------------------------------------
// RedBullShareholders (toto-twenty-person, cut 11). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 85 frames. Palette B1. The shared world: orgWorld.tsx (the team principals' line).
//
// CHECK LINE: "Red Bull's team principal sits under a group of shareholders, not a CEO": the camera leaves
// Ferrari's row of ten and finds the next principal on the same line, alone, with a cluster of amber owners
// above him under the Red Bull mark.
//
// THE LINE: "Then you have other much shareholder-led organizations like Red Bull, where"
// WORD -> FRAME: you 4 · have 11 · other/much 16 · shareholder 27 · -led 43 · organizations 47 · like 58 ·
// Red 70 · Bull 75 (ends 81) · where 84
// DURATION: slot 11.920 -> 15.320 s = 3.400 s x 25 = 85 frames (f0..f84). S = frame + 298.
//
// THE MOTION: one truck right along the ledge, from HOME.ferrari (cut A's last frame) to HOME.redbull. The
// cut opens already gliding (~10 px/f), eases up to ~29 px/f by f12, then a long soft landing on HOME.redbull at
// f80, no overshoot; Ferrari slides off left, the light pool travels with the camera, and Red Bull's principal
// (already standing, kraft, headset on) warms to cream as he comes into the pool (~f22-32: derived from his
// screen x, not a timer), his TEAM PRINCIPAL card sliding in f30-42. On "shareholder-led" the platform card
// rises out of its slot above him (f28-37) and the four shareholders rise out of it as one group (f31-43) and
// warm to amber together (f35-47); the card carries its SHAREHOLDERS ink up out of the slot with it (the
// ink is printed on the card: clipped at the slot line, readable as the card lands f37; the director's call over
// the style's blank-face rule). On "organizations" the reporting
// rule draws from his head up to the platform (f47-62; contact with the card's bottom edge f62, the card has
// stood there since f37). From "like" the bulls-and-sun tile rises out of its slot above the owners
// (f58-68, settled and readable before "Red" f70). f80-84: a living hold exactly at HOME.redbull with REDBULL_DONE
// (sway, drift, grain and the pool's breath on the story clock); cut C opens on it.
// AMBER = the power to decide over the principal (here the shareholders); cream = the principal; kraft = anyone.
//
// JOIN WITH CUT A: f0 = FerrariOneOfTen's last frame in camera, world state, pool point and ground parallax
// origin (asserted at load). Only the story-clock ambience differs (S 298 vs A's 192: sway, ground drift,
// grain, the pool's breath), as COMMON.md's clock asks; the cuts are not adjacent in time.
//
// SOURCES: the bulls-and-sun mark is orgLogos.ts (from en.wikipedia File:RedBullEnergyDrink.svg, LOGOS_READY.md).
// No figures on screen. Red Bull GmbH is owned by the Yoovidhya family (51 %) and the Mateschitz side (49 %)
// (vienna.at, 4 Jun 2025); the four pegs are "a group of shareholders", no names or percentages by the brief.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { Label, clamp01, labelWidth, smoothstep } from "../kits/cheeky-pint/stoutShared";
import {
  AUDI,
  AUDI_EMPTY,
  FERRARI,
  FERRARI_DONE,
  HOME,
  LEDGE,
  OrgStage,
  OrgWorld,
  PEG_SIZE,
  PLABEL,
  POOL_AT,
  PRINCIPAL_SIZE,
  REDBULL,
  REDBULL_DONE,
  REDBULL_START,
  principalLabelRect,
  type RedBullState,
  type WorldState,
} from "./orgWorld";
import { DURATION as A_DURATION, SLOT_START as A_SLOT_START, camAt as camA, worldAt as worldA } from "./FerrariOneOfTen";

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
const poolAt = (f: number, S: number) => {
  const u = truckAt(f);
  const a = POOL_AT.ferrari;
  const b = POOL_AT.redbull;
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, strength: (a.strength + (b.strength - a.strength) * u) * (1 + 0.05 * Math.sin(S / 11)) };
};

// --- the beats ---------------------------------------------------------------------------------------------------
/** the principal warms as he comes into the pool: his screen x from WARM_SX[0] to WARM_SX[1] (the pool centre
 *  is the frame's middle all along). With this truck: ~f22 -> ~f32. */
const WARM_SX: [number, number] = [1070, 860];
const principalSx = (f: number) => 540 + (REDBULL.px - camAt(f).x) * CAM0.k;
const P_LABEL: [number, number] = [30, 42]; // the stout entrance, linear over 12 f (as in cut A)
const CARD: [number, number] = [28, 37]; // "shareholder" f27
const HOLDERS: [number, number] = [31, 43]; // one group, one window (no stagger, no click)
const AMBER: [number, number] = [35, 47]; // together, by -led f43-47
const STEM: [number, number] = [47, 62]; // "organizations" f47-58
const TILE: [number, number] = [58, 68]; // "like" f58 -> settled f68, before "Red" f70

export const redbullAt = (f: number): RedBullState => ({
  tile: win(f, ...TILE),
  principal: {
    rise: 1,
    warm: smoothstep((WARM_SX[0] - principalSx(f)) / (WARM_SX[0] - WARM_SX[1])),
    headset: 1,
    label: lin(f, ...P_LABEL),
  },
  stem: win(f, ...STEM),
  card: win(f, ...CARD),
  holders: REDBULL.holderXs.map(() => win(f, ...HOLDERS)),
  amber: win(f, ...AMBER),
  // the ink rides on the card (ShareholdersInk) while it rises; the world's own card text takes over on the frame
  // the card has landed (the same Label at the same place: no change of pixels)
  cardLabel: win(f, ...CARD) >= 1 ? 1 : 0,
  bright: 0,
  dim: 0,
});

export const worldAt = (f: number): WorldState => ({ ferrari: FERRARI_DONE, redbull: redbullAt(f), audi: AUDI_EMPTY });

/** The SHAREHOLDERS ink printed on the platform card while it rises out of its slot: orgWorld's card text (stout
 *  Label, ink, world px, centred in the card) drawn at the card's risen place and clipped at the slot line, so it
 *  comes up with the card instead of arriving after it. Drawn only while 0 < rise < 1; at rise 1 the world's
 *  cardLabel (= 1) draws the same text. */
const ShareholdersInk: React.FC<{ k: number; rise: number }> = ({ k, rise }) => {
  if (rise <= 0.001 || rise >= 1) return null;
  const C = REDBULL.card;
  const bottom = C.top + C.h;
  const y0 = C.top + (1 - clamp01(rise)) * (C.h + 2); // orgWorld's risen(): the card's top at this rise
  const cy = y0 + C.h / 2;
  const id = "rbShareholdersInk";
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={C.x - C.w / 2} y={y0} width={C.w} height={Math.max(0, bottom - y0)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <Label x={C.x} y={cy + (C.px * 0.718) / 2} k={k} text={C.text} px={C.px * k} tone="dark" />
      </g>
    </g>
  );
};

const RedBullShareholders: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const S = frame + SLOT_START;
  const cam = camAt(frame);
  return (
    <OrgStage S={S} cam={cam} rest={REST} pool={poolAt(frame, S)}>
      <OrgWorld cam={cam} w={worldAt(frame)}>
        <ShareholdersInk k={cam.k} rise={win(frame, ...CARD)} />
      </OrgWorld>
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
  const flatR = (o: RedBullState) => [o.tile, o.principal.rise, o.principal.warm, o.principal.headset, o.principal.label, o.stem, o.card, ...o.holders, o.amber, o.cardLabel, o.bright, o.dim];
  const sameR = (a: RedBullState, b: RedBullState) => flatR(a).every((v, i) => close(v, flatR(b)[i]));
  // the join: f0 is cut A's last frame (camera, world, pool point); A's clock is S = frame + its slot start
  const aLast = A_DURATION - 1;
  if (!sameCam(camAt(0), camA(aLast)) || !sameCam(camAt(0), HOME.ferrari)) fail("f0 camera is not cut A's last frame");
  const wA = worldA(aLast);
  const w0 = worldAt(0);
  if (!sameR(w0.redbull, wA.redbull) || !sameR(w0.redbull, REDBULL_START)) fail("f0 Red Bull is not cut A's last frame");
  // Ferrari: A ends on FERRARI_DONE drawn per head (dropEach all 1, the bus whole from its own start): the same picture
  const F = wA.ferrari;
  const flatF = (o: typeof F) => [o.tile, o.principal.rise, o.principal.warm, o.principal.headset, o.principal.label, ...o.row, o.bus, o.stem, o.ceoCard, o.ceo, o.ceoAmber, o.ceoLabel, o.bright, o.dim];
  if (!flatF(F).every((v, i) => close(v, flatF(w0.ferrari)[i])) || !(F.dropEach ?? Array(10).fill(F.drops)).every((v) => v === 1)) fail("f0 Ferrari is not cut A's last frame");
  if (JSON.stringify(w0.audi) !== JSON.stringify(wA.audi)) fail("f0 Audi is not cut A's last frame");
  if (A_SLOT_START + aLast >= SLOT_START) fail("cut A must end before this slot");
  // the end: a living hold exactly at HOME.redbull with REDBULL_DONE from LAND to the last frame
  for (let f = LAND; f < DURATION; f++) {
    if (!sameCam(camAt(f), HOME.redbull)) fail(`camera off HOME.redbull at f${f}`);
    if (!sameR(redbullAt(f), REDBULL_DONE)) fail(`state not REDBULL_DONE at f${f}`);
  }
  // the truck: monotone, one speed lobe, never faster than 30 px/f on screen, |dv| under the house 2.5 px/f^2
  let vPrev = (camAt(1).x - camAt(0).x) * CAM0.k;
  let peaked = false;
  for (let f = 2; f <= LAND + 1; f++) {
    const v = (camAt(f).x - camAt(f - 1).x) * CAM0.k;
    if (v < -1e-9) fail(`truck reverses at f${f}`);
    if (v > 30) fail(`truck at ${v.toFixed(1)} px/f at f${f}`);
    if (Math.abs(v - vPrev) > 2.5) fail(`truck jerks ${(v - vPrev).toFixed(2)} px/f^2 at f${f}`);
    if (v < vPrev - 1e-9) peaked = true;
    else if (peaked && v > vPrev + 1e-9) fail(`second speed lobe at f${f}`);
    vPrev = v;
  }
  // the principal is warm before his label lands; the warm-up runs ~f20-32
  if (redbullAt(20).principal.warm > 0.02 || redbullAt(33).principal.warm < 0.98) fail("warm-up outside ~f21-33");
  // everything that enters is inside the frame on the frame it starts, and the camera is level (y fixed): the
  // TEAM PRINCIPAL card stays above the caption band on every frame
  const sx = (f: number, x: number) => 540 + (x - camAt(f).x) * CAM0.k;
  const sy = (y: number) => 960 + (y - CAM0.y) * CAM0.k;
  const lab = principalLabelRect(REDBULL.px);
  if (sy(lab.y + lab.h) > 1065) fail(`label bottom at y ${sy(lab.y + lab.h).toFixed(0)}`);
  if (sx(P_LABEL[0], lab.x + lab.w) > 1080) fail(`label starts off frame (${sx(P_LABEL[0], lab.x + lab.w).toFixed(0)})`);
  const lastHolder = REDBULL.holderXs[3] + PEG_SIZE / 2;
  if (sx(HOLDERS[0], lastHolder) > 1080) fail(`a shareholder rises off frame (${sx(HOLDERS[0], lastHolder).toFixed(0)})`);
  if (sx(TILE[0], REDBULL.tile.x + REDBULL.tile.w / 2) > 1080) fail("tile rises off frame");
  if (sy(REDBULL.tile.y - REDBULL.tile.h / 2) < 260) fail("tile top too high");
  // no collisions: owners' heads under the tile's foot, the stem's tip under the card, the card over the principal
  const holderTop = REDBULL.card.top - PEG_SIZE;
  if (REDBULL.tile.y + REDBULL.tile.h / 2 > holderTop - 24) fail("tile on the owners' heads");
  if (REDBULL.card.top + REDBULL.card.h > -PRINCIPAL_SIZE - 40) fail("card on the principal's head");
  if (labelWidth(PLABEL.text, PLABEL.px) <= 0 || LEDGE.h <= 0 || AUDI.px <= REDBULL.px || FERRARI.x !== 0) fail("orgWorld changed under this cut");
}
