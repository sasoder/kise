// ---------------------------------------------------------------------------
// FerrariOneOfTen (toto-twenty-person, cut 3). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps. Palette B1. The shared world: orgWorld.tsx (the team principals' line).
//
// CHECK LINE: "at Ferrari the team principal is just one of ten people who report to the CEO": one cream
// principal in a row of ten equal pegs, all hanging off one amber CEO under the Ferrari mark.
//
// THE LINE: "you look at Ferrari, the team principal is one of 10 direct reports to the CEO. So"
// WORD -> FRAME: you 2 · look 4 · at 7 · Ferrari 10 · the 19 · team 24 · principal 28 · is 37 · one 43 · of 46 ·
// 10 50 · direct 58 · reports 65 · to 74 · the 82 · CEO 84 (ends 91) · So 96
// DURATION: slot 3.840 -> 7.720 s = (7.720 - 3.840) x 25 = 97 frames exactly. S = frame + 96.
//
// THE MOTION: one crane down then out. The camera opens close and high on the Ferrari horse tile as it rises
// out of its slot (settled f8), cranes down past the empty spot above the row to the ledge (one eased crane,
// fastest ~f12, the ledge up to y ~1100 by f18), where the principal rises out of his slot in cream with his
// headset (f20-30, "team principal") and his TEAM
// PRINCIPAL card slides in (f32-44). On "one of 10" the camera pulls back as the nine kraft others rise out
// of their slots in a wave outward from him (f43-72; the outer two wait until the pull-back has them wholly in
// frame). His own line climbs to the bus height (f55-59), the bus draws out from it to both ends at one speed
// (f59-72) and drops down to each head once its peg is up (to f78); the stem climbs (f66-76) to the CEO card
// rising out of its slot (f70-78); the CEO rises on it and warms to amber, "CEO" lands on the card (f78-90, "to the CEO").
// The camera lands on HOME.ferrari at f82. From f90 a living hold exactly at HOME.ferrari with FERRARI_DONE
// (cut B opens on it).
// Contacts: the stem's tip reaches the CEO card's slot line at f76, the card is rising out of it from f70.
// AMBER = the power to decide over the principal (here the CEO); cream = the principal; kraft = anyone.
//
// SOURCES: logos from assets-src/toto-twenty-person/logos (LOGOS_READY.md): the prancing horse = Simple Icons
// "ferrari" (CC0 path data). Ferrari N.V.'s executive-officers page lists 15 officers under the CEO (Vasseur
// one of them); "10" is Toto's round number: no number on screen, the row of ten is his picture.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import {
  FERRARI,
  FERRARI_DONE,
  HOME,
  OrgStage,
  OrgWorld,
  POOL_AT,
  PRINCIPAL_SIZE,
  REDBULL_START,
  AUDI_EMPTY,
  type FerrariState,
  type WorldState,
} from "./orgWorld";

export const FPS = 25;
export const DURATION = 97;
export const SLOT_START = 96; // the slot's first frame in the sequence (story clock S = frame + 96)
export const schema = z.object({});
export const defaultProps = schema.parse({});

const win = (f: number, f0: number, f1: number) => smoothstep((f - f0) / (f1 - f0));
const lin = (f: number, f0: number, f1: number) => clamp01((f - f0) / (f1 - f0));

// --- the camera: two overlapping glides on the look point and ln k, landing EXACTLY on HOME.ferrari -------------
/** f0: close and high on the tile (its centre at screen y 780). */
const K0 = 2.3;
const CAM0: Cam = { x: 0, y: FERRARI.tile.y + (960 - 780) / K0, k: K0 };
/** the crane's end: the principal's ledge at screen y 880, a little left of centre, toward him. */
const K1 = 1.8;
const CAM1: Cam = { x: -24, y: (960 - 880) / K1, k: K1 };
const CAM2: Cam = HOME.ferrari;
const CRANE: [number, number] = [-6, 30];
const PULL: [number, number] = [30, 82];
export const camAt = (f: number): Cam => {
  const a = win(f, CRANE[0], CRANE[1]);
  const b = win(f, PULL[0], PULL[1]);
  return {
    x: CAM0.x + (CAM1.x - CAM0.x) * a + (CAM2.x - CAM1.x) * b,
    y: CAM0.y + (CAM1.y - CAM0.y) * a + (CAM2.y - CAM1.y) * b,
    k: Math.exp(Math.log(CAM0.k) + (Math.log(CAM1.k) - Math.log(CAM0.k)) * a + (Math.log(CAM2.k) - Math.log(CAM1.k)) * b),
  };
};

// --- the pool: tile -> principal -> the whole structure, landing exactly on POOL_AT.ferrari; it breathes ------------
const poolAt = (f: number, S: number) => {
  const a = win(f, -2, 28);
  const b = win(f, 36, 82);
  const p0 = { x: 0, y: FERRARI.tile.y };
  const p1 = { x: FERRARI.px, y: -60 };
  const p2 = POOL_AT.ferrari;
  return {
    x: p0.x + (p1.x - p0.x) * a + (p2.x - p1.x) * b,
    y: p0.y + (p1.y - p0.y) * a + (p2.y - p1.y) * b,
    strength: p2.strength * (1 + 0.05 * Math.sin(S / 11)),
  };
};

// --- the beats ---------------------------------------------------------------------------------------------------
const TILE_RISE: [number, number] = [-10, 8]; // settled f8 ("Ferrari" f10)
const P_RISE: [number, number] = [20, 30]; // "team principal" f24 / f28
const P_LABEL: [number, number] = [32, 44]; // the stout entrance, linear over 12 f
/** the nine: a wave outward from him, one pitch every WAVE_STEP frames, each rising over WAVE_F */
const WAVE0 = 43;
const WAVE_STEP = 4.5;
const WAVE_F = 9;
const steps = (x: number) => Math.round(Math.abs(x - FERRARI.px) / FERRARI.pitch); // 1..5
/** The frame a peg is first wholly inside the frame (16 px clear of each side) under the pull-back: an outer
 *  peg rises no earlier, so nothing rises half off the edge (the wave is revealed by the camera). */
const firstInside = (x: number) => {
  for (let f = WAVE0; f < DURATION; f++) {
    const c = camAt(f);
    if (540 + (x - 36 - c.x) * c.k >= 16 && 540 + (x + 36 - c.x) * c.k <= 1064) return f;
  }
  return DURATION;
};
const WAVE_T0 = new Map<number, number>(FERRARI.otherXs.map((x) => [x, Math.max(WAVE0 + (steps(x) - 1) * WAVE_STEP, firstInside(x))]));
export const riseWindow = (x: number): [number, number] => {
  const t0 = WAVE_T0.get(x) ?? WAVE0;
  return [t0, t0 + WAVE_F];
};
const DROP_F = 6; // a head's line up to the bus, from the frame its peg lands
const P_DROP: [number, number] = [55, 59]; // his own line goes up first
const BUS: [number, number] = [59, 72]; // out from his line at one speed to both ends
const BUS_REACH = Math.max(FERRARI.px - FERRARI.xs[0], FERRARI.xs[9] - FERRARI.px);
const STEM: [number, number] = [66, 76];
const CEO_CARD: [number, number] = [70, 78];
const CEO_RISE: [number, number] = [78, 86];
const CEO_AMBER: [number, number] = [80, 90];
const CEO_LABEL: [number, number] = [80, 90];

export const ferrariAt = (f: number): FerrariState => ({
  tile: win(f, ...TILE_RISE),
  principal: { rise: win(f, ...P_RISE), warm: 1, headset: 1, label: lin(f, ...P_LABEL) },
  row: FERRARI.otherXs.map((x) => win(f, ...riseWindow(x))),
  drops: 0,
  dropEach: FERRARI.xs.map((x, i) => {
    if (i === FERRARI.pIndex) return win(f, ...P_DROP);
    // down from the bus to his head once the bus's tip has passed over him and he is up
    const pass = BUS[0] + (Math.abs(x - FERRARI.px) / BUS_REACH) * (BUS[1] - BUS[0]);
    const t0 = Math.max(pass, riseWindow(x)[1] - 1);
    return win(f, t0, t0 + DROP_F);
  }),
  dropsDown: true,
  bus: lin(f, ...BUS),
  busFrom: FERRARI.px,
  stem: win(f, ...STEM),
  ceoCard: win(f, ...CEO_CARD),
  ceo: win(f, ...CEO_RISE),
  ceoAmber: win(f, ...CEO_AMBER),
  ceoLabel: lin(f, ...CEO_LABEL),
  bright: 0,
  dim: 0,
});

export const worldAt = (f: number): WorldState => ({ ferrari: ferrariAt(f), redbull: REDBULL_START, audi: AUDI_EMPTY });

const FerrariOneOfTen: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const S = frame + SLOT_START;
  const cam = camAt(frame);
  return (
    <OrgStage S={S} cam={cam} rest={camAt(0)} pool={poolAt(frame, S)}>
      <OrgWorld cam={cam} w={worldAt(frame)} />
    </OrgStage>
  );
};

export default FerrariOneOfTen;

// --- load-time checks ------------------------------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`FerrariOneOfTen: ${m}`);
  };
  // the end state is FERRARI_DONE and the camera HOME.ferrari, exactly, from f90 to the last frame
  for (let f = 90; f < DURATION; f++) {
    const c = camAt(f);
    if (Math.abs(c.x - HOME.ferrari.x) > 1e-9 || Math.abs(c.y - HOME.ferrari.y) > 1e-9 || Math.abs(c.k - HOME.ferrari.k) > 1e-12) fail(`camera off HOME at f${f}`);
    const s = ferrariAt(f);
    const flat = (o: FerrariState) => [o.tile, o.principal.rise, o.principal.warm, o.principal.headset, o.principal.label, ...o.row, o.bus, o.stem, o.ceoCard, o.ceo, o.ceoAmber, o.ceoLabel];
    const a = flat(s);
    const b = flat(FERRARI_DONE);
    if (a.some((v, i) => Math.abs(v - b[i]) > 1e-9) || (s.dropEach ?? []).some((v) => v !== 1)) fail(`state not FERRARI_DONE at f${f}`);
  }
  // nothing that must be read in the caption band: the principal's label card bottom on every frame it shows
  for (let f = P_LABEL[0]; f < DURATION; f++) {
    const c = camAt(f);
    const bottom = 960 + (0 + 10 + 6 + 56 - c.y) * c.k;
    if (bottom > 1068) fail(`label in the caption band at f${f} (y ${bottom.toFixed(0)})`);
  }
  // each of the nine is fully inside the frame when it starts to rise
  for (const x of FERRARI.otherXs) {
    const [t0] = riseWindow(x);
    const c = camAt(t0);
    const l = 540 + (x - 36 - c.x) * c.k;
    const r = 540 + (x + 36 - c.x) * c.k;
    if (l < 0 || r > 1080) fail(`peg at x ${x} rises off frame (screen ${l.toFixed(0)}..${r.toFixed(0)} at f${t0})`);
  }
  if (lerp(0, 1, 1) !== 1 || PRINCIPAL_SIZE !== 90) fail("orgWorld changed under this cut");
}
