// ---------------------------------------------------------------------------
// FerrariOneOfTen (toto-twenty-person, cut 3), rev 3 (REVISION_1: the hub). Cheeky Pint style (stout)
// (styles/cheeky-pint.md). Opaque 1080x1920, 25 fps. Palette B1. The shared world: orgWorld.tsx v2.
//
// CHECK LINE: "at Ferrari the team principal is just one of ten people who report to the CEO": one cream
// principal at the bottom of a ring of ten equal pegs, every one with a line in to the one amber CEO at the
// centre, under the Ferrari mark. No words on screen.
//
// THE LINE: "you look at Ferrari, the team principal is one of 10 direct reports to the CEO. So"
// WORD -> FRAME: you 2 · look 4 · at 7 · Ferrari 10 · the 19 · team 24 · principal 28 · is 37 · one 43 · of 46 ·
// 10 50 · direct 58 · reports 65 · to 74 · the 82 · CEO 84 (ends 91) · So 96
// DURATION: slot 3.840 -> 7.720 s = (7.720 - 3.840) x 25 = 97 frames exactly. S = frame + 96.
//
// THE MOTION: one continuous camera move, straight down the frame's centre line (x never moves). It opens
// close (k 2) on the prancing-horse tile as it appears (the stout entrance, f0-12, readable from f10), then
// cranes down and pulls back in one eased move: the crane lands at f32 while the pull-back runs on, slowing,
// to land exactly on HOME.ferrari at f90 (fastest ~f12, the tile never leaves the frame). The principal appears
// at the bottom of the ring in cream with his headset (f20-30, "the team principal"); on "one of 10" the nine kraft
// others appear in a symmetric wave outward from him both ways round the ellipse (pairs at f43, 47, 51, 55,
// the top at f59; all in by f68); on "direct reports" the ten spokes draw from each report in toward the
// empty centre (f58-78, his first, then pair by pair); on "to the CEO" the amber CEO appears in the hub,
// 1.3x, with his bloom (f81-90). From f90 a living hold exactly at HOME.ferrari with FERRARI_DONE (cut B
// opens on it). AMBER = the power to decide over the principal (here the CEO); cream = the principal.
//
// SOURCES: logos from assets-src/toto-twenty-person/logos (LOGOS_READY.md): the prancing horse = Simple Icons
// "ferrari" (CC0 path data). Ferrari N.V.'s executive-officers page lists 15 officers under the CEO (Vasseur
// one of them); "10" is Toto's round number: no number on screen, the ring of ten is his picture.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { clamp01, smoothstep, toScreen } from "../kits/cheeky-pint/stoutShared";
import { AUDI_EMPTY, FERRARI, FERRARI_DONE, HOME, OrgStage, OrgWorld, POOL_AT, REDBULL_START, type FerrariState, type WorldState } from "./orgWorld";

export const FPS = 25;
export const DURATION = 97;
export const SLOT_START = 96; // the slot's first frame in the sequence (story clock S = frame + 96)
export const schema = z.object({});
export const defaultProps = schema.parse({});

const win = (f: number, f0: number, f1: number) => smoothstep((f - f0) / (f1 - f0));
/** cubic-bezier(x1, y1, x2, y2) easing of u in 0..1 (CSS semantics). */
const bezier = (x1: number, y1: number, x2: number, y2: number) => (u: number) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const B = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (B(m, x1, x2) < u) lo = m;
    else hi = m;
  }
  return B((lo + hi) / 2, y1, y2);
};

// --- the camera: one move. The zoom eases out from K0 to HOME's over f0-90 (a long, slowing pull-back); the
// look point cranes down from the tile to HOME's height over CRANE. Both land exactly on HOME.ferrari. ----------
const K0 = 2;
/** f0's look point: the tile's centre at screen y 690 at k K0 (before the crane starts). */
const Y0 = FERRARI.tile.y - (690 - 960) / K0;
const CRANE: [number, number] = [-4, 32];
const PULL_END = 90;
const PULL = bezier(0.25, 0, 0.15, 1);
export const camAt = (f: number): Cam => {
  const H = HOME.ferrari;
  const k = Math.exp(Math.log(K0) + (Math.log(H.k) - Math.log(K0)) * PULL(f / PULL_END));
  return { x: H.x, y: Y0 + (H.y - Y0) * win(f, ...CRANE), k };
};

// --- the pool: from the tile down to the hub's centre, landing on POOL_AT.ferrari; it breathes ------------------
export const poolAt = (f: number, S: number) => {
  const a = win(f, 0, 40);
  const p0 = { x: FERRARI.x, y: FERRARI.tile.y };
  const p1 = POOL_AT.ferrari;
  return { x: p0.x + (p1.x - p0.x) * a, y: p0.y + (p1.y - p0.y) * a, strength: p1.strength * (1 + 0.05 * Math.sin(S / 11)) };
};

// --- the beats (stout entrances are linear in t; stoutEntrance eases them) ---------------------------------------
const lin = (f: number, f0: number, f1: number) => clamp01((f - f0) / (f1 - f0));
const TILE: [number, number] = [0, 12]; // "Ferrari" f10
const PRINCIPAL: [number, number] = [20, 30]; // "the" f19, "team" f24, "principal" f28 (in and readable by ~f27)
/** the nine: pairs [k, 10-k] outward from him (FERRARI.wave), one pair every WAVE_STEP frames, each over WAVE_F */
const WAVE0 = 43; // "one"
const WAVE_STEP = 4;
const WAVE_F = 9;
/** the spokes: his first, then pair by pair, each drawn in toward the centre over SPOKE_F */
const SPOKE0 = 58; // "direct"
const SPOKE_STEP = 2;
const SPOKE_F = 10;
const CEO: [number, number] = [81, 90]; // "the" f82, "CEO" f84-91

/** wave step of ring index k (1..9): 0 for k 1 / 9 .. 4 for the top */
const stepOf = (k: number) => FERRARI.wave.findIndex((pair) => pair.includes(k));
export const appearWindow = (k: number): [number, number] => {
  const t0 = WAVE0 + stepOf(k) * WAVE_STEP;
  return [t0, t0 + WAVE_F];
};
export const spokeWindow = (k: number): [number, number] => {
  const t0 = SPOKE0 + (k === 0 ? 0 : (stepOf(k) + 1) * SPOKE_STEP);
  return [t0, t0 + SPOKE_F];
};

export const ferrariAt = (f: number): FerrariState => ({
  tile: lin(f, ...TILE),
  principal: { appear: lin(f, ...PRINCIPAL), warm: 1, headset: 1 },
  others: FERRARI.others.map((_, i) => lin(f, ...appearWindow(i + 1))),
  spokes: FERRARI.ring.map((_, k) => win(f, ...spokeWindow(k))),
  ceo: lin(f, ...CEO),
  ceoAmber: 1,
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
  const H = HOME.ferrari;
  // the end state is FERRARI_DONE and the camera HOME.ferrari, exactly, from f90 to the last frame
  for (let f = 90; f < DURATION; f++) {
    const c = camAt(f);
    if (Math.abs(c.x - H.x) > 1e-9 || Math.abs(c.y - H.y) > 1e-9 || Math.abs(c.k - H.k) > 1e-12) fail(`camera off HOME at f${f}`);
    const s = ferrariAt(f);
    const flat = (o: FerrariState) => [o.tile, o.principal.appear, o.principal.warm, o.principal.headset, ...o.others, ...o.spokes, o.ceo, o.ceoAmber];
    const a = flat(s);
    const b = flat(FERRARI_DONE);
    if (a.some((v, i) => Math.abs(v - b[i]) > 1e-9)) fail(`state not FERRARI_DONE at f${f}`);
  }
  // the camera never moves sideways (the hub stays mirror-symmetric on screen)
  for (let f = 0; f < DURATION; f++) if (camAt(f).x !== H.x) fail(`camera x moves at f${f}`);
  // the tile never leaves the frame; the principal's feet are clear of the caption band from f30
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    const top = toScreen(c, 0, FERRARI.tile.y - FERRARI.tile.h / 2).y;
    if (top < 40) fail(`tile top at y ${top.toFixed(0)} at f${f}`);
    if (f >= 30 && toScreen(c, 0, 0).y > 1062) fail(`principal's feet at y ${toScreen(c, 0, 0).y.toFixed(0)} at f${f}`);
  }
  // each of the nine is wholly inside the frame (16 px clear) when it starts to appear
  FERRARI.others.forEach((o, i) => {
    const [t0] = appearWindow(i + 1);
    const c = camAt(t0);
    const l = toScreen(c, o.x - o.size / 2, 0).x;
    const r = toScreen(c, o.x + o.size / 2, 0).x;
    const t = toScreen(c, 0, o.feet - o.size).y;
    if (l < 16 || r > 1064 || t < 16) fail(`ring ${i + 1} appears off frame at f${t0}`);
  });
  // every spoke starts once its report is (nearly) in, and all are drawn by f78
  FERRARI.ring.forEach((_, k) => {
    const [s0, s1] = spokeWindow(k);
    const ready = k === 0 ? PRINCIPAL[1] : appearWindow(k)[1] - 1;
    if (s0 < ready || s1 > 78) fail(`spoke ${k} at f${s0}-${s1} (report in at f${ready})`);
  });
}
