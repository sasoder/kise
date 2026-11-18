// FANS_READY
import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { COLOR, GRAIN, GROUND, VIGNETTE, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { TRACK_COLOR } from "../toto-champion-eight/trackWorld";
import { CLOTH, HAIR, SKIN, type HairStyle } from "../scott-free-wifi/cabinCast";

// ===========================================================================
// fansWorld — THE GRANDSTAND of the Cheeky Pint S4E01 clip "toto - 42 percent of f1 fans are women" (cut 44
// BiggerThanTheStands, cut 55 FortyTwoPercent). One world, the same objects and seeds in both cuts. (Revision 2.)
//
// The circuit of trackWorld (toto-champion-eight), seen from the infield across the track: a golden-hour sky, a tall
// steep grass bank with trees on its crest, ONE hero grandstand in front of it, the circuit's big screen on two posts
// above the stand's roof, then a walkway, a boarded railing at the track, a tyre wall, the asphalt.
//
// THE GRANDSTAND (r2: a real stand, not a frame round a block of people). Five seat tiers stepping up and back, seen
// from the front and a little above: each tier a riser face with a lit tread on top, each tier narrower than the one
// in front (it is farther back), so the open sides show the stepped rake against the bank. Three aisles of stairs
// (both ends and the middle), a low cream front wall with the concourse mouths under the aisles, a dark back wall
// under the roof, and a cantilever roof (a cream fascia and its lit top) on thin posts standing on the back tier.
// 10 seats a tier in two blocks of 5; the fans sit on the tiers, each tier's heads and scarves above the row in front.
//
// Picture-book card fans (the cabinCast grammar: a big round head with a nose bump, a dot eye, blush, a bean torso,
// flat matte fills, in profile). EVERY fan wears an amber scarf: amber = F1's fans. Some men wear a cap (cloth tone).
// Women read by hair: bob, bun, pony, curly, or short with a hair clip and an earring.
//
//   FansStage   the whole frame. Props: S (the story clock: sway, flags, clouds, grain, the race on the screen), T (the
//               CROWD clock: who has arrived; a big number = everyone is in), cam, the screen's state (0 = the race
//               live on a dark screen, 1 = lit cream with an overlay), wave(x) 0..1 (cut 55: women raise an amber
//               flag, men's scarves turn to board), fenceRow, hillT (each bank row's stop frame).
//   FanCam      { x, k, gy, dx?, dy? }: the world x on the frame's centre column, the scale on the stand's plane
//               (screen px per world px), and the screen y of the ground line under the stand.
//
//   screen      (default true) the big screen on its posts; false = no screen, and the bank behind it is drawn.
//   onTrack     (c) => nodes drawn over the track's asphalt (TRACK_Z: far -650 .. near -1500), e.g. cut 44 rev 1's cars.
//
// UNITS. World px, M = 100 px per metre. x runs right (0 = the stand's centre), y is DOWN (0 = the ground; heights are
// negative y), z is the depth from the stand's front plane (0) away from the camera (+ = farther). A level pinhole
// camera D = 25 m in front of the stand: a plane at depth z scales by k * D / (D + z) about the frame's centre.
// The stand and the bank are drawn on the z = 0 plane (the tiers' recession is drawn into the stand itself).
//
// THE CROWD (deterministic, `hash` seeds; cut 55 reuses every seed):
//  - The stand: 50 seats (tiers 0..4, 0 = front). Exactly 21 hold women (SEAT_WOMEN: 4, 4, 5, 4, 4 a tier, picked by
//    a seeded score, so they fall naturally through the stand). Tiers 0..2 are seated before f0 of cut 44; tiers 3
//    and 4 fill from the side aisles (a file climbs the stairs out of the concourse behind the front wall, turns into
//    its half-tier and the block sits down together). The aisles then stay clear (the stairs read).
//  - The bank: rows of standing fans stepping up the bank beside and behind the stand, each a file walking in from
//    beyond the frame edge at one constant pace (BANK_V) that stops as one block (hillT). Rows level with the stand
//    stop tucked against its stepped side (a ragged edge, no gap); rows above the roof meet in the middle.
//  - The fence: one row along the boarded railing at the track (waist up over the boards), meeting in the middle.
//  Women are ~42 % of the bank and the fence (hash < 0.42).
// ===========================================================================

export const M = 100;
/** the camera's distance to the stand's plane (world px) */
export const D_CAM = 25 * M;

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `fw${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
type P2 = [number, number];

// --- the camera ------------------------------------------------------------------------------------------------
export type FanCam = { x: number; k: number; gy: number; dx?: number; dy?: number };
/** the scale of a plane at depth z */
export const kAt = (c: FanCam, z: number) => (c.k * D_CAM) / (D_CAM + z);
/** world y on the frame's middle row (the camera's height, negative = above the ground) */
export const camY = (c: FanCam) => -(c.gy - 960) / c.k;
/** a world point (x, y down, depth z) -> screen px */
export const project = (c: FanCam, wx: number, wy: number, z = 0): P2 => {
  const kz = kAt(c, z);
  return [540 + (wx - c.x) * kz + (c.dx ?? 0), 960 + (wy - camY(c)) * kz + (c.dy ?? 0)];
};
/** the SVG transform that maps depth z's world px to the screen */
export const layerTransform = (c: FanCam, z = 0) => {
  const kz = kAt(c, z);
  return `matrix(${fx(kz)} 0 0 ${fx(kz)} ${fx(540 - c.x * kz + (c.dx ?? 0))} ${fx(960 - camY(c) * kz + (c.dy ?? 0))})`;
};
/** the world x range visible at depth z (+ a screen-px margin) */
export const xRange = (c: FanCam, z: number, margin = 80): [number, number] => {
  const kz = kAt(c, z);
  const half = (540 + margin + Math.abs(c.dx ?? 0)) / kz;
  return [c.x - half, c.x + half];
};

// --- the stand (world px; heights UP from the ground; x from the centre) ----------------------------------------
export const STAND = {
  /** seat pitch, aisle width, the margin beyond each side aisle */
  SP: 66,
  AW: 64,
  END: 18,
  TIERS: 5,
  /** tier 0's floor (the front edge of its tread), the rise per tier, the tread's drawn depth */
  FL0: 40,
  STEP: 76,
  TREAD: 22,
  /** the per-tier recession: each tier back is this much smaller (x and figures) */
  RECEDE: 0.055,
  /** the low front wall's top */
  FRONT: 105,
  /** the roof: the fascia's underside and top, the lit roof top's back edge, the overhang beyond tier 0 */
  ROOF_F: 506,
  ROOF_FT: 526,
  ROOF_TOP: 566,
} as const;
/** tier 0's half width: middle aisle, 5 seats, side aisle, end */
export const HW0 = STAND.AW / 2 + 5 * STAND.SP + STAND.AW + STAND.END; // 444
export const floorOf = (r: number) => STAND.FL0 + r * STAND.STEP;
/** a tier's recession scale */
export const recedeOf = (r: number) => 1 - STAND.RECEDE * r;
/** the recession at a feet height (between tiers, for the stair climbers) */
export const recedeAtH = (h: number) => 1 - STAND.RECEDE * Math.max(0, Math.min(STAND.TIERS - 1, (h - STAND.FL0 - STAND.TREAD / 2) / STAND.STEP));
export const tierHW = (r: number) => HW0 * recedeOf(r);
/** the feet height of a fan on tier r (the middle of the tread) */
export const feetOf = (r: number) => floorOf(r) + STAND.TREAD / 2;
/** the roof's half width: the fascia (over tier 2) and the back edge (over tier 4, seen from above) */
export const ROOF_HW = HW0 * (1 - 2 * STAND.RECEDE) + 22;
export const ROOF_HW_BACK = HW0 * (1 - 4 * STAND.RECEDE) + 22;
/** aisle centres on tier 0 (scale by recedeOf for tier r) */
export const AISLE_X = { L: -(HW0 - STAND.END - STAND.AW / 2), MID: 0, R: HW0 - STAND.END - STAND.AW / 2 } as const;
/** the stand's silhouette half width at a height (what hides the bank behind it) */
export const standHW = (y: number) => {
  if (y <= STAND.FRONT) return HW0;
  for (let r = 1; r < STAND.TIERS; r++) if (y <= floorOf(r) + STAND.TREAD) return tierHW(r);
  if (y <= STAND.ROOF_F) return tierHW(STAND.TIERS - 1);
  if (y <= STAND.ROOF_TOP) return lerp(ROOF_HW, ROOF_HW_BACK, (y - STAND.ROOF_F) / (STAND.ROOF_TOP - STAND.ROOF_F));
  return 0;
};
/** the seat backs: sage card, clearly lighter than the tiers so an empty row reads as empty */
export const SEAT_COL = "#9DA676";

/** the screen: on two posts behind the roof (world px; y down) */
export const SCREEN = { x0: -280, x1: 280, top: -818, bottom: -596, post: 150, postW: 14, border: 12 } as const;

// --- the fans --------------------------------------------------------------------------------------------------------
export type FanHair = HairStyle | "short";
export type FanSpec = {
  woman: boolean;
  hair: FanHair;
  hairCol: string;
  skin: string;
  top: string;
  pants: string;
  /** a cap (men; a cloth tone), or null */
  cap: string | null;
  /** 1 = facing left (the cabinCast profile), -1 = facing right */
  face: 1 | -1;
  /** a little flag held up (a cloth tone, never amber), or null */
  flag: string | null;
  glasses: boolean;
  earring: boolean;
  /** a hair clip's colour (short-haired women), or null */
  clip: string | null;
  phase: number;
  /** a size jitter (1 +- 4 %) */
  size: number;
};
const TOPS = [CLOTH.sage, CLOTH.oat, CLOTH.slate, CLOTH.plum, CLOTH.denim, CLOTH.moss, CLOTH.cream, CLOTH.brown, "#6F8486", "#8E7C9A"];
const PANTS = [CLOTH.denim, CLOTH.brown, CLOTH.slate, "#5E5A52", CLOTH.moss];
export const SKINS = [SKIN.cream, SKIN.light, SKIN.tan, SKIN.board, SKIN.deep, SKIN.deeper];
const HAIRS = [HAIR.ink, HAIR.chestnut, HAIR.sandy, HAIR.auburn, HAIR.ink, HAIR.chestnut, HAIR.grey];
const FLAGS = [COLOR.cream, CLOTH.sage, CLOTH.plum, "#7E9AA0"];
const CAPS = [CLOTH.denim, CLOTH.sage, CLOTH.cream, CLOTH.slate, "#7E9AA0", CLOTH.plum];
export const WOMAN_HAIR: FanHair[] = ["bob", "bun", "pony", "curly", "short"];
const EARRING = "#EBD9B0";
export const fanSpec = (seed: number, woman: boolean, flagRate = 0.05): FanSpec => {
  const h = (n: number) => hash(seed * 1.37 + n * 17.13);
  const hair: FanHair = woman ? WOMAN_HAIR[Math.floor(h(1) * 5) % 5] : h(1) < 0.3 ? "cap" : h(1) < 0.84 ? "crop" : "bald";
  return {
    woman,
    hair,
    hairCol: hair === "bald" ? HAIR.grey : HAIRS[Math.floor(h(2) * HAIRS.length) % HAIRS.length],
    skin: SKINS[Math.floor(h(3) * SKINS.length) % SKINS.length],
    top: TOPS[Math.floor(h(4) * TOPS.length) % TOPS.length],
    pants: PANTS[Math.floor(h(5) * PANTS.length) % PANTS.length],
    cap: hair === "cap" ? CAPS[Math.floor(h(12) * CAPS.length) % CAPS.length] : null,
    face: h(6) < 0.62 ? 1 : -1,
    // the ambient (non-amber) flags are the men's: the women's flag is the amber one of cut 55
    flag: !woman && h(7) < flagRate ? FLAGS[Math.floor(h(8) * FLAGS.length) % FLAGS.length] : null,
    glasses: h(9) < 0.12,
    earring: woman && (hair === "short" || h(13) < 0.3),
    clip: woman && hair === "short" ? CLOTH.plum : null,
    phase: h(10) * Math.PI * 2,
    size: 0.96 + 0.08 * h(11),
  };
};

// --- the stand's crowd ----------------------------------------------------------------------------------------------
export type Seat = { id: number; r: number; side: -1 | 1; q: number; x: number; spec: FanSpec };
/** women a tier (21 of 50 = 42 %) */
const TIER_WOMEN = [4, 4, 5, 4, 4];
/** the 21 seats (of 50) that hold women: in each tier the seats with the lowest seeded scores */
export const SEAT_WOMEN: ReadonlySet<number> = (() => {
  const out = new Set<number>();
  for (let r = 0; r < STAND.TIERS; r++) {
    const ids = Array.from({ length: 10 }, (_, i) => r * 10 + i).sort((a, b) => hash(a * 7.31 + 3.3) - hash(b * 7.31 + 3.3));
    for (const id of ids.slice(0, TIER_WOMEN[r])) out.add(id);
  }
  return out;
})();
export const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  let wi = 0;
  let mi = 0;
  for (let r = 0; r < STAND.TIERS; r++)
    for (const side of [-1, 1] as const)
      for (let q = 0; q < 5; q++) {
        const id = r * 10 + (side < 0 ? 0 : 5) + q;
        const stagger = r % 2 ? 9 : -9;
        const jit = (hash(id * 3.7 + 1.1) - 0.5) * 6;
        const x0 = side * (STAND.AW / 2 + STAND.SP / 2 + STAND.SP * q) + stagger + jit;
        const woman = SEAT_WOMEN.has(id);
        const base = fanSpec(1000 + id, woman, 0);
        // the stand's women run through every hair and every skin tone; the men through every skin tone
        const spec: FanSpec = woman
          ? (() => {
              const hair = WOMAN_HAIR[(wi * 2 + r) % 5];
              const s = { ...base, hair, skin: SKINS[(wi * 5 + 1) % 6], cap: null, earring: hair === "short" || base.earring, clip: hair === "short" ? CLOTH.plum : null };
              wi++;
              return s;
            })()
          : (() => {
              const s = { ...base, skin: SKINS[(mi * 5 + 3) % 6] };
              mi++;
              return s;
            })();
        out.push({ id, r, side, q, x: x0 * recedeOf(r), spec });
      }
  return out;
})();

// The aisle files (cut 44's crowd clock T): a fan climbs the stairs at AISLE_V world px per frame out of the concourse
// behind the front wall, then walks along its tier to its seat and sits (SIT_F frames). A half-tier's block arrives
// together at its frame; the next block follows one seat pitch behind the last of the previous one.
export const ROW_V = 32;
/** the bank's files: a brisk walk, so a row reaches the middle before the next rows stack up beside it */
export const BANK_V = 46;
export const AISLE_V = 40;
export const STOP_F = 4;
export const SIT_F = 7;
/** the first tier that fills during cut 44 (tiers below it are seated before f0) */
export const SEATED_BEFORE = 3;
type Walker = {
  key: string;
  aisleX: number;
  r: number;
  seatX: number;
  arrive: number;
  spec: FanSpec;
  /** the path's total length: the climb, then along the tier */
  L: number;
  climb: number;
  seat: number;
  side: -1 | 1;
};
export const WALKERS: Walker[] = (() => {
  const out: Walker[] = [];
  for (const side of [-1, 1] as const) {
    const aisle0 = side < 0 ? AISLE_X.L : AISLE_X.R;
    // the left file leads by a frame
    let lastLaunch = side < 0 ? -6.2 : -5.2;
    let first = true;
    for (let r = SEATED_BEFORE; r < STAND.TIERS; r++) {
      const ax = aisle0 * recedeOf(r);
      const climb = feetOf(r);
      // the block: the seat farthest from the aisle leads the file
      const seats = SEATS.filter((s) => s.r === r && s.side === side).sort((a, b) => a.q - b.q);
      const Ls = seats.map((s) => climb + Math.abs(s.x - ax));
      const gap = (STAND.SP * recedeOf(r)) / AISLE_V;
      const launch0 = first ? lastLaunch : lastLaunch + gap;
      first = false;
      const T = launch0 + Ls[0] / AISLE_V + STOP_F / 2;
      seats.forEach((s, i) => {
        out.push({ key: `w${s.id}`, aisleX: ax, r, seatX: s.x, arrive: T, spec: s.spec, L: Ls[i], climb, seat: s.id, side });
        lastLaunch = Math.max(lastLaunch, T - Ls[i] / AISLE_V - STOP_F / 2);
      });
    }
  }
  return out;
})();
const SEAT_WALKER = new Map(WALKERS.map((w) => [w.seat, w] as const));
/** when each half-tier has sat down (for the header comment / checks) */
export const TIER_DONE = WALKERS.reduce<Record<string, number>>((m, w) => ({ ...m, [`${w.r}${w.side < 0 ? "L" : "R"}`]: w.arrive + SIT_F }), {});

/** distance still to walk at time t for a path that ends at `arrive` (constant pace, an eased stop) */
export const remaining = (t: number, arrive: number, v = ROW_V, tau = STOP_F) => {
  const dt = arrive - t;
  if (dt <= 0) return 0;
  if (dt < tau) return (v * dt * dt) / (2 * tau);
  return v * dt - (v * tau) / 2;
};
/** speed (0..1 of full pace) at time t */
const paceAt = (t: number, arrive: number, tau = STOP_F) => {
  const dt = arrive - t;
  if (dt <= 0) return 0;
  return Math.min(1, dt / tau);
};

// --- the bank: rows of standing fans stepping up behind and beside the stand ------------------------------------------
export const CREST = (x: number) => 1960 - 3.0e-5 * x * x; // the crest's height (world px) at x
/** a standing fan's height (feet to head top) at figure scale 1 */
export const FAN_H = 190;
export type Terrace = {
  j: number;
  /** feet height (world px) */
  h: number;
  /** figure scale (recedes up the bank) */
  s: number;
  pitch: number;
  /** the head top's height */
  H: number;
  /** level with the stand: stops at its stepped side; else meets in the middle (behind the stand / screen) */
  split: boolean;
  /** this row's inner stop, a fraction of a pitch (a ragged edge) */
  ragged: number;
  /** haze toward the sky (0..1) */
  haze: number;
};
export const TERRACES: Terrace[] = (() => {
  const out: Terrace[] = [];
  let h = 30;
  let j = 0;
  for (;;) {
    const s = 1 - 0.0002 * h;
    const H = h + FAN_H * s;
    if (H > CREST(0) - 24) break;
    const split = h + 0.86 * FAN_H * s < STAND.ROOF_F;
    out.push({ j, h, s, pitch: 64 * s, H, split, ragged: 0.15 + 0.4 * hash(j * 9.7 + 2.2), haze: 0.03 + 0.3 * clamp01(h / 1800) });
    h += 96 * s;
    j++;
  }
  return out;
})();
/** the default stop frame of a bank row (cut 44 passes its own, timed to its camera) */
export const defaultHillT = (t: Terrace) => 22 + 3.4 * t.j;
/** the fence row: along the boarded railing at the track */
export const FENCE = { z: -300, railZ: -330, railH: 112, boardH: 82, pitch: 68, T: 98 } as const;

// --- the fan drawing (units: the cabinCast rig, head R 60, facing LEFT; y down; origin = the FEET) -----------------
/** a fan's figure unit: world px per rig unit (a 23 px head radius) */
export const FAN_U = 0.38;
const R = 60;
const D2R = Math.PI / 180;
const polar = (r: number, deg: number): P2 => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
const arcPts = (r: number, a0: number, a1: number, n = 16) => {
  const o: P2[] = [];
  for (let i = 0; i <= n; i++) o.push(polar(r, lerp(a0, a1, i / n)));
  return o;
};
const ptsD = (pts: P2[]) => pts.map((p, i) => `${i ? "L" : "M"}${f3(p[0])} ${f3(p[1])}`).join("");
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;
// hair (head-local, from cabinCast's shapes)
const cropD =
  ptsD(arcPts(R * 1.07, 212, 402)) +
  `C${f3(0.62 * R)} ${f3(0.42 * R)} ${f3(0.3 * R)} ${f3(0.3 * R)} ${f3(0.22 * R)} ${f3(0.05 * R)}` +
  `C${f3(0.12 * R)} ${f3(-0.28 * R)} ${f3(-0.3 * R)} ${f3(-0.42 * R)} ${f3(-0.66 * R)} ${f3(-0.5 * R)}Z`;
// the women's short cut: the crop, a little fuller at the nape and with a side fringe
const shortD =
  ptsD(arcPts(R * 1.09, 205, 410)) +
  `C${f3(0.78 * R)} ${f3(0.62 * R)} ${f3(0.36 * R)} ${f3(0.5 * R)} ${f3(0.26 * R)} ${f3(0.14 * R)}` +
  `C${f3(0.1 * R)} ${f3(-0.3 * R)} ${f3(-0.36 * R)} ${f3(-0.36 * R)} ${f3(-0.92 * R)} ${f3(-0.24 * R)}Z`;
const bobD =
  ptsD(arcPts(R * 1.12, 196, 432)) +
  `C${f3(0.9 * R)} ${f3(1.06 * R)} ${f3(0.5 * R)} ${f3(1.04 * R)} ${f3(0.22 * R)} ${f3(0.86 * R)}` +
  `C${f3(0.08 * R)} ${f3(0.5 * R)} ${f3(0.06 * R)} ${f3(0.0 * R)} ${f3(-0.12 * R)} ${f3(-0.34 * R)}` +
  `C${f3(-0.4 * R)} ${f3(-0.46 * R)} ${f3(-0.7 * R)} ${f3(-0.4 * R)} ${f3(-0.98 * R)} ${f3(-0.3 * R)}Z`;
const bunD = circleD(0.62 * R, -0.9 * R, 0.42 * R);
const curlyD = [214, 238, 262, 286, 310, 334, 358, 382].map((a) => circleD(...polar(1.0 * R, a), 0.29 * R)).join("");
const ponyD =
  `M${f3(0.74 * R)} ${f3(-0.66 * R)}C${f3(1.6 * R)} ${f3(-0.56 * R)} ${f3(1.74 * R)} ${f3(0.3 * R)} ${f3(1.4 * R)} ${f3(0.98 * R)}` +
  `C${f3(1.3 * R)} ${f3(0.46 * R)} ${f3(1.14 * R)} ${f3(-0.06 * R)} ${f3(0.84 * R)} ${f3(-0.16 * R)}Z`;
const capTuftD = ptsD(arcPts(R * 1.05, 300, 400)) + `C${f3(0.6 * R)} ${f3(0.3 * R)} ${f3(0.4 * R)} ${f3(0.1 * R)} ${f3(0.42 * R)} ${f3(-0.3 * R)}Z`;
const capCrownD = ptsD(arcPts(R * 1.09, 196, 352)) + `C${f3(0.4 * R)} ${f3(-0.22 * R)} ${f3(-0.5 * R)} ${f3(-0.36 * R)} ${f3(-1.05 * R)} ${f3(-0.3 * R)}Z`;
const capBrimD =
  `M${f3(-0.7 * R)} ${f3(-0.42 * R)}L${f3(-1.62 * R)} ${f3(-0.36 * R)}C${f3(-1.72 * R)} ${f3(-0.35 * R)} ${f3(-1.72 * R)} ${f3(-0.2 * R)} ${f3(-1.6 * R)} ${f3(-0.2 * R)}` +
  `L${f3(-0.7 * R)} ${f3(-0.22 * R)}Z`;
const HEAD_D = circleD(0, 0, R) + circleD(-0.97 * R, 0.1 * R, 0.19 * R);
// the upper body, hip-local (hip at 0, as the cabinCast rig)
const HC: P2 = [-40, -270];
const TORSO_D = "M14 6C22 -56 22 -132 6 -176C-4 -204 -50 -212 -74 -196C-98 -178 -100 -126 -94 -76C-90 -34 -80 -2 -58 6Z";
const SCARF_WRAP_D = "M-96 -222C-64 -232 -14 -230 14 -218L16 -184C-12 -194 -60 -196 -96 -182Z";
const SCARF_TAIL_D = "M-92 -204L-58 -200L-70 -94L-116 -100Z";
const SCARF_HOT_D = "M-96 -222C-64 -232 -14 -230 14 -218L14 -211C-14 -222 -64 -224 -96 -214Z";
const MOUTH_D = `M${f3(-0.88 * R)} ${f3(0.44 * R - 1)}Q${f3(-0.75 * R)} ${f3(0.44 * R + 5)} ${f3(-0.6 * R)} ${f3(0.44 * R - 4)}`;
/** the legs: thigh and shin; the hip's height above the feet follows the thigh's angle (standing 90 deg, seated 14) */
const THIGH = 88;
const SHIN = 82;
const SIT_DEG = 14;
const hipOf = (sit: number) => THIGH * Math.sin(lerp(90, SIT_DEG, sit) * D2R) + SHIN;
/** a standing fan's hip above the feet (world px at figure scale 1) */
export const STAND_HIP = hipOf(0) * FAN_U;

export type FanState = {
  /** 0 standing .. 1 seated */
  sit: number;
  /** distance walked (world px) for the gait, and the pace 0..1 */
  walk: number;
  pace: number;
  /** body sway (deg) */
  sway: number;
  /** the scarf: amber -> board (0..1); a man's, cut 55 */
  drain: number;
  /** the amber flag raised (0..1); a woman's, cut 55 */
  raise: number;
  /** haze toward the sky (0..1) */
  haze: number;
  /** screen px per unit (for the level of detail) */
  px: number;
  /** the story clock (flag wave) */
  S: number;
  /** draw the legs (only where they can show) */
  legs: boolean;
};
const SKIN_SHADE = (c: string) => mixHex(c, COLOR.shadow, 0.1);
const STICK = "#6E5140";
/**
 * One fan, in a <g> placed at the FEET (world px x, y), scaled by `scale` (world px per unit), facing spec.face.
 */
export const fanNode = (key: string, x: number, y: number, scale: number, spec: FanSpec, st: FanState, glowId: string): React.ReactNode => {
  const hz = (c: string) => (st.haze > 0.004 ? mixHex(c, SKY.haze, st.haze) : c);
  const lod = st.px * R; // the head's screen radius
  const dr = clamp01(st.drain);
  const amberTop = mixHex(COLOR.amberTop, COLOR.board, dr);
  const amberFoot = mixHex(COLOR.amberFoot, COLOR.boardFoot, dr);
  const amberHot = mixHex(COLOR.amberHot, COLOR.board, dr);
  const glow = (1 - dr) * (1 - 0.5 * st.haze);
  // the gait: a bob and a leg scissor from the distance walked, both scaled by the pace (a stop never freezes mid-step)
  const stride = 60;
  const ph = (st.walk / stride) * Math.PI;
  const bob = -Math.abs(Math.sin(ph)) * 7 * st.pace;
  const swing = Math.sin(ph) * 24 * st.pace * (1 - st.sit);
  const sit = clamp01(st.sit);
  const hipY = -hipOf(sit);
  const sway = st.sway;
  const flagUp = !!spec.flag && st.pace < 0.05 && st.raise <= 0;
  const parts: React.ReactNode[] = [];
  // legs: a thigh from the hip and a shin straight down to the foot; walking swings each whole leg about the hip
  if (st.legs) {
    const th = lerp(90, SIT_DEG, sit) * D2R;
    const leg = (a: number, col: string, dx: number, k2: string) => {
      const hx = -41 + dx;
      const knee: P2 = [hx - THIGH * Math.cos(th), hipY + THIGH * Math.sin(th)];
      const foot: P2 = [knee[0], knee[1] + SHIN - 6];
      return (
        <g key={k2} transform={a !== 0 ? `rotate(${f3(a)} ${f3(hx)} ${f3(hipY)})` : undefined}>
          <path d={`M${f3(hx)} ${f3(hipY)}L${f3(knee[0])} ${f3(knee[1])}L${f3(foot[0])} ${f3(foot[1])}`} stroke={hz(col)} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {lod > 3 ? <rect x={f3(foot[0] - 34)} y={f3(foot[1] - 4)} width={46} height={18} rx={8} fill={hz("#4A3326")} /> : null}
        </g>
      );
    };
    parts.push(leg(-swing, mixHex(spec.pants, COLOR.shadow, 0.18), 14, "lf"));
    parts.push(leg(swing, spec.pants, 0, "ln"));
  }
  // the upper body sways about the hip (hip-local coordinates)
  const up: React.ReactNode[] = [];
  // an ambient held flag (men, cut 44 bank): the stick behind the head, the cloth waving
  if (flagUp && lod > 3) {
    const w = Math.sin(st.S * 0.32 + spec.phase);
    const fxp = -96;
    const fy = -520;
    up.push(<rect key="fs" x={fxp - 4} y={fy} width={8} height={250} rx={3} fill={hz(STICK)} />);
    up.push(
      <path
        key="fc"
        d={`M${fxp + 3} ${fy}C${fxp + 40} ${f3(fy - 10 * w)} ${fxp + 80} ${f3(fy + 12 * w)} ${fxp + 120} ${f3(fy + 4 * w)}L${fxp + 120} ${f3(fy + 74 + 4 * w)}C${fxp + 80} ${f3(fy + 86 + 12 * w)} ${fxp + 40} ${f3(fy + 64 - 10 * w)} ${fxp + 3} ${fy + 74}Z`}
        fill={hz(spec.flag as string)}
      />,
    );
  }
  up.push(<path key="t" d={TORSO_D} fill={hz(spec.top)} />);
  if (glow > 0.02 && lod > 2.5) up.push(<ellipse key="g" cx={-40} cy={-190} rx={132} ry={100} fill={`url(#${glowId})`} opacity={f3(glow)} />);
  up.push(<path key="st" d={SCARF_TAIL_D} fill={hz(amberFoot)} />);
  up.push(<path key="sw" d={SCARF_WRAP_D} fill={hz(amberTop)} />);
  if (lod > 6) up.push(<path key="sh" d={SCARF_HOT_D} fill={hz(amberHot)} />);
  // the head
  const hd: React.ReactNode[] = [];
  if (spec.hair === "pony") hd.push(<path key="pb" d={ponyD} fill={hz(spec.hairCol)} />);
  hd.push(<path key="hd" d={lod > 4 ? HEAD_D : circleD(0, 0, R)} fill={hz(spec.skin)} />);
  if (lod > 9) {
    hd.push(<circle key="er" cx={9.6} cy={6} r={9} fill={hz(SKIN_SHADE(spec.skin))} />);
    hd.push(<circle key="bl" cx={-25.2} cy={18} r={8.4} fill="#D9846E" opacity={0.3} />);
    hd.push(<path key="m" d={MOUTH_D} stroke={hz(mixHex(COLOR.inkDark, spec.skin, 0.25))} strokeWidth={4} strokeLinecap="round" fill="none" />);
  }
  if (lod > 6) hd.push(<circle key="ey" cx={-30} cy={-4.8} r={6.2} fill={hz(COLOR.inkDark)} />);
  const hairD =
    spec.hair === "bob"
      ? bobD
      : spec.hair === "crop" || spec.hair === "pony"
        ? cropD
        : spec.hair === "short"
          ? shortD
          : spec.hair === "bun"
            ? cropD + bunD
            : spec.hair === "curly"
              ? cropD + curlyD
              : spec.hair === "cap"
                ? capTuftD
                : "";
  if (hairD) hd.push(<path key="hr" d={hairD} fill={hz(spec.hairCol)} />);
  if (spec.clip && lod > 4) hd.push(<rect key="cl" x={6} y={-58} width={30} height={13} rx={6} transform="rotate(-28 21 -51)" fill={hz(spec.clip)} />);
  if (spec.earring && lod > 5) {
    hd.push(<circle key="ea" cx={10} cy={30} r={8.5} fill={hz(EARRING)} />);
    hd.push(<rect key="eh" x={8.5} y={16} width={3} height={10} fill={hz(EARRING)} />);
  }
  if (spec.cap) {
    hd.push(<path key="cc" d={capCrownD} fill={hz(spec.cap)} />);
    hd.push(<path key="cb" d={capBrimD} fill={hz(mixHex(spec.cap, COLOR.shadow, 0.18))} />);
  }
  if (spec.glasses && lod > 9)
    hd.push(
      <g key="gl" stroke={hz(COLOR.inkDark)} strokeWidth={3.6} fill="none">
        <circle cx={-31.8} cy={-3.6} r={14.4} />
        <path d="M-17.4 -6L1.2 -1.2" />
      </g>,
    );
  up.push(
    <g key="hg" transform={`translate(${HC[0]} ${HC[1]})`}>
      {hd}
    </g>,
  );
  // the near arm: hanging, swinging, resting on the lap, holding an ambient flag up, or raising the amber flag
  const rz = clamp01(st.raise);
  const S0: P2 = [-40, -178];
  const restHand: P2 = flagUp ? [-92, -300] : sit > 0.5 ? [-100, -34] : [-52 - swing * 1.2, -40];
  const restElbow: P2 = flagUp ? [-74, -232] : sit > 0.5 ? [-50, -96] : [-46 - swing * 0.5, -104];
  // the raise: the hand reaches down beside the seat (behind the row in front), then lifts the flag up past the head
  const a = smoothstep(rz / 0.28);
  const b = smoothstep((rz - 0.28) / 0.72);
  const lowHand: P2 = [-74, 4];
  const lowElbow: P2 = [-66, -88];
  const upHand: P2 = [-90, -312];
  const upElbow: P2 = [-108, -232];
  const hand: P2 = rz <= 0 ? restHand : b > 0 ? [lerp(lowHand[0], upHand[0], b), lerp(lowHand[1], upHand[1], b)] : [lerp(restHand[0], lowHand[0], a), lerp(restHand[1], lowHand[1], a)];
  const elbow: P2 = rz <= 0 ? restElbow : b > 0 ? [lerp(lowElbow[0], upElbow[0], b), lerp(lowElbow[1], upElbow[1], b)] : [lerp(restElbow[0], lowElbow[0], a), lerp(restElbow[1], lowElbow[1], a)];
  if (lod > 4 || rz > 0) {
    up.push(<path key="a" d={`M${S0[0]} ${S0[1]}L${f3(elbow[0])} ${f3(elbow[1])}L${f3(hand[0])} ${f3(hand[1])}`} stroke={hz(mixHex(spec.top, COLOR.shadow, 0.08))} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" />);
  }
  // the amber flag: the stick comes up out of the hand's grip as it lifts (pulled up from the floor), the cloth
  // unfurls once it clears the head, then waves
  if (b > 0) {
    const stickL = 150 * smoothstep(b / 0.55);
    const tilt = (8 * Math.sin(st.S * 0.3 + spec.phase) + 10) * smoothstep((b - 0.6) / 0.4);
    const unf = smoothstep((b - 0.5) / 0.45);
    const w = Math.sin(st.S * 0.36 + spec.phase) * unf;
    const top: P2 = [hand[0], hand[1] - stickL];
    const cw = 14 + 92 * unf;
    const ch = 62;
    const cloth = `M${f3(top[0] + 2)} ${f3(top[1])}C${f3(top[0] + cw * 0.33)} ${f3(top[1] - 10 * w)} ${f3(top[0] + cw * 0.66)} ${f3(top[1] + 12 * w)} ${f3(top[0] + cw)} ${f3(top[1] + 4 * w)}L${f3(top[0] + cw)} ${f3(top[1] + ch + 4 * w)}C${f3(top[0] + cw * 0.66)} ${f3(top[1] + ch + 12 * w)} ${f3(top[0] + cw * 0.33)} ${f3(top[1] + ch - 10 * w)} ${f3(top[0] + 2)} ${f3(top[1] + ch)}Z`;
    const fold = `M${f3(top[0] + 2)} ${f3(top[1] + ch * 0.62)}C${f3(top[0] + cw * 0.33)} ${f3(top[1] + ch * 0.62 - 10 * w)} ${f3(top[0] + cw * 0.66)} ${f3(top[1] + ch * 0.62 + 12 * w)} ${f3(top[0] + cw)} ${f3(top[1] + ch * 0.62 + 4 * w)}L${f3(top[0] + cw)} ${f3(top[1] + ch + 4 * w)}C${f3(top[0] + cw * 0.66)} ${f3(top[1] + ch + 12 * w)} ${f3(top[0] + cw * 0.33)} ${f3(top[1] + ch - 10 * w)} ${f3(top[0] + 2)} ${f3(top[1] + ch)}Z`;
    up.push(
      <g key="af" transform={`rotate(${f3(-tilt)} ${f3(hand[0])} ${f3(hand[1])})`}>
        <rect x={f3(top[0] - 4.5)} y={f3(top[1] - 6)} width={9} height={f3(stickL + 26)} rx={4} fill={hz(STICK)} />
        {unf > 0.01 && lod > 2.5 ? <ellipse cx={f3(top[0] + cw / 2)} cy={f3(top[1] + ch / 2)} rx={f3(cw * 0.9)} ry={70} fill={`url(#${glowId})`} opacity={f3(0.8 * unf)} /> : null}
        <path d={cloth} fill={hz(COLOR.amberTop)} />
        <path d={fold} fill={hz(COLOR.amberFoot)} />
        <rect x={f3(top[0] + 2)} y={f3(top[1] - 1 + 4 * w * 0)} width={f3(cw - 2)} height={6} fill={hz(COLOR.amberHot)} opacity={f3(unf)} />
      </g>,
    );
  }
  if (lod > 4 || rz > 0) up.push(<circle key="h" cx={f3(hand[0])} cy={f3(hand[1])} r={14} fill={hz(SKIN_SHADE(spec.skin))} />);
  const sc = scale * spec.size;
  return (
    <g key={key} transform={`translate(${fx(x)} ${fx(y + bob * scale)}) scale(${fx(sc * spec.face)} ${fx(sc)})`}>
      {parts}
      <g transform={`translate(0 ${f3(hipY)}) rotate(${f3(sway * spec.face)})`}>{up}</g>
    </g>
  );
};

// --- the race on the screen (world px on the screen's face) -----------------------------------------------------------
/** one side-view F1 car, facing right, length 1 (y up negative, the ground at 0) */
const CAR_BODY =
  "M-0.41 -0.05L-0.41 -0.135C-0.3 -0.15 -0.2 -0.16 -0.14 -0.17L-0.11 -0.262L-0.03 -0.262L-0.005 -0.185L0.1 -0.17" +
  "C0.24 -0.14 0.37 -0.1 0.47 -0.075L0.47 -0.05Z";
export const RACE = { carL: 175, period: 44, lap: 1.35 } as const;
const raceNode = (S: number, x0: number, y0: number, w: number, h: number, faceOff: string, uid: string) => {
  const grass = mixHex(faceOff, TRACK_COLOR.grass, 0.42);
  const asph = mixHex(faceOff, "#B9AE9F", 0.3);
  const yT = y0 + 0.6 * h;
  const yB = y0 + 0.9 * h;
  const L = RACE.carL;
  const kerbs: React.ReactNode[] = [];
  const kw = 26;
  for (let i = 0; i * kw < w; i++)
    kerbs.push(<rect key={i} x={f3(x0 + i * kw)} y={f3(yT - 7)} width={kw} height={7} fill={i % 2 ? mixHex(COLOR.cream, faceOff, 0.25) : mixHex(TRACK_COLOR.kerbRed, faceOff, 0.2)} />);
  // a car crosses every `period` frames at one constant pace, entering and leaving through the screen's edges
  const cars: React.ReactNode[] = [];
  const span = w + 2 * L;
  for (const n of [Math.floor(S / RACE.period) - 1, Math.floor(S / RACE.period)]) {
    const u = (S - n * RACE.period) / (RACE.period * RACE.lap);
    if (u < 0 || u > 1) continue;
    const cx = x0 - L * 0.55 + u * span;
    const gy = y0 + 0.82 * h;
    const P = (px: number, py: number) => `${f3(cx + px * L)} ${f3(gy + py * L)}`;
    const body = CAR_BODY.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_m, a, b) => P(parseFloat(a), parseFloat(b)));
    const wr = 0.095 * L;
    cars.push(
      <g key={n}>
        {/* the rear wing, the floor, the front wing */}
        <rect x={f3(cx - 0.52 * L)} y={f3(gy - 0.31 * L)} width={f3(0.13 * L)} height={f3(0.05 * L)} fill={COLOR.cream} />
        <rect x={f3(cx - 0.47 * L)} y={f3(gy - 0.28 * L)} width={f3(0.04 * L)} height={f3(0.16 * L)} fill={COLOR.cream} />
        <rect x={f3(cx - 0.44 * L)} y={f3(gy - 0.07 * L)} width={f3(0.88 * L)} height={f3(0.035 * L)} fill={COLOR.cream} />
        <rect x={f3(cx + 0.38 * L)} y={f3(gy - 0.055 * L)} width={f3(0.14 * L)} height={f3(0.03 * L)} fill={COLOR.cream} />
        <path d={`M${body}`} fill={COLOR.cream} />
        <circle cx={f3(cx - 0.065 * L)} cy={f3(gy - 0.215 * L)} r={f3(0.038 * L)} fill={mixHex(faceOff, COLOR.inkDark, 0.4)} />
        {[-0.31, 0.31].map((wx) => (
          <g key={wx}>
            <circle cx={f3(cx + wx * L)} cy={f3(gy - wr)} r={f3(wr)} fill={mixHex(COLOR.inkDark, faceOff, 0.2)} />
            <circle cx={f3(cx + wx * L)} cy={f3(gy - wr)} r={f3(wr * 0.38)} fill={mixHex(COLOR.cream, faceOff, 0.2)} />
          </g>
        ))}
      </g>,
    );
  }
  return (
    <g key="race">
      <defs>
        <clipPath id={`${uid}face`}>
          <rect x={f3(x0)} y={f3(y0)} width={f3(w)} height={f3(h)} rx={3} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}face)`}>
        <rect x={f3(x0)} y={f3(y0 + 0.42 * h)} width={f3(w)} height={f3(0.58 * h)} fill={grass} />
        <rect x={f3(x0)} y={f3(yT)} width={f3(w)} height={f3(yB - yT)} fill={asph} />
        {kerbs}
        {cars}
      </g>
    </g>
  );
};

// --- the stage -------------------------------------------------------------------------------------------------------
export type FansStageProps = {
  /** the story clock (sway, flags, clouds, grain, the race) */
  S: number;
  /** the crowd clock (cut 44 frames): who has arrived. Cut 55 passes a large number. */
  T: number;
  cam: FanCam;
  /** the screen: 0 = the race live on the dark screen .. 1 = lit cream */
  screenLit?: number;
  /** drawn in world px over the lit screen face, with the stand plane's scale */
  screenOverlay?: (kz: number) => React.ReactNode;
  /** cut 55's payoff at world x (0..1): a woman raises her amber flag, a man's scarf turns to board */
  wave?: (x: number) => number;
  /** the row at the railing (cut 44); cut 55 frames it out */
  fenceRow?: boolean;
  /** each bank row's stop frame on the crowd clock */
  hillT?: (t: Terrace) => number;
  /** the big screen on its posts above the roof (default true; cut 44 rev 1 passes false: no screen, no posts, and the
   *  bank's fans behind where it stood are drawn) */
  screen?: boolean;
  /** drawn over the track's asphalt (screen space, after the near verge): cut 44 rev 1's cars racing past. Use
   *  `layerTransform(c, z)` for a depth's transform. */
  onTrack?: (c: FanCam) => React.ReactNode;
};
/** the track's asphalt: its far edge (by the tyre wall) and its near edge (world depth z) */
export const TRACK_Z = { far: -650, near: -1500 } as const;

const CLOUDS = [
  { x: 150, h: 2300, w: 420, t: 26, a: 0.3, v: 0.16 },
  { x: 880, h: 2500, w: 520, t: 22, a: 0.26, v: 0.12 },
  { x: 520, h: 2800, w: 640, t: 18, a: 0.28, v: 0.1 },
  { x: 1300, h: 3150, w: 480, t: 14, a: 0.24, v: 0.08 },
];

export const FansStage: React.FC<FansStageProps> = ({ S, T, cam, screenLit = 0, screenOverlay, wave, fenceRow = true, hillT = defaultHillT, screen: withScreen = true, onTrack }) => {
  const uid = uidOf(useId());
  const c = cam;
  const k0 = kAt(c, 0);
  const glowId = `${uid}glow`;
  const P = (wx: number, wy: number, z = 0) => project(c, wx, wy, z);
  const wv = (x: number) => (wave ? clamp01(wave(x)) : 0);
  const pay = (x: number, woman: boolean) => {
    const u = wv(x);
    return woman ? { raise: u, drain: 0 } : { raise: 0, drain: u };
  };
  /** the bank and the fence: the men's scarves turn too, but only the stand's women lift flags */
  const payBank = (x: number, woman: boolean) => (woman ? { raise: 0, drain: 0 } : { raise: 0, drain: wv(x) });
  const swayOf = (spec: FanSpec, amp: number) => amp * Math.sin(S * 0.075 + spec.phase) + 0.4 * amp * Math.sin(S * 0.19 + spec.phase * 2.3);

  // --- the sky (screen space, anchored to the crest's screen height) --------------------------------------------
  const crestY = P(0, -CREST(0))[1];
  const skyTop = crestY - 1500 * Math.sqrt(k0);
  const sky = (
    <g key="sky">
      <rect x={-60} y={-60} width={1200} height={f3(Math.max(0, crestY + 200))} fill={`url(#${uid}sky)`} />
      <rect x={-60} y={-60} width={1200} height={f3(Math.max(0, crestY + 200))} fill={`url(#${uid}sun)`} />
      <g style={{ filter: "blur(16px)" }}>
        {CLOUDS.map((q, i) => {
          const cx = ((q.x + S * q.v - c.x * 0.02 * k0) % 1700 + 1700) % 1700 - 300;
          return <ellipse key={i} cx={f3(cx)} cy={f3(crestY - (q.h - 1960) * k0 * 0.55 - 60)} rx={q.w} ry={q.t} fill={q.h > 2700 ? SKY.cloudHi : SKY.cloudLo} opacity={q.a} />;
        })}
      </g>
    </g>
  );

  // --- the bank: trees on the crest, the grass, its terraces ------------------------------------------------------
  const [hx0, hx1] = xRange(c, 0, 200);
  const crestPts: P2[] = [];
  const nC = 48;
  for (let i = 0; i <= nC; i++) {
    const wx = lerp(hx0, hx1, i / nC);
    crestPts.push([wx, -CREST(wx)]);
  }
  const hillD = `M${f3(hx0)} 40` + crestPts.map((p) => `L${f3(p[0])} ${f3(p[1])}`).join("") + `L${f3(hx1)} 40Z`;
  const TREE_L = 900;
  const trees: React.ReactNode[] = [];
  for (let n = Math.floor(hx0 / TREE_L) - 1; n <= Math.floor(hx1 / TREE_L) + 1; n++)
    for (let i = 0; i < 5; i++) {
      const sd = n * 5 + i;
      const wx = n * TREE_L + ((i + 0.2 + 0.6 * hash(sd * 3.1)) / 5) * TREE_L;
      const r = 70 + 70 * hash(sd * 5.7);
      const hgt = 180 + 160 * hash(sd * 9.3);
      const base = -CREST(wx) + 30;
      const tone = Math.floor(hash(sd * 2.2) * 4) % 4;
      const col = mixHex(TRACK_COLOR.tree[tone], SKY.haze, 0.42);
      const lit = mixHex(TRACK_COLOR.treeLit[tone], SKY.haze, 0.42);
      const cy = base - hgt;
      trees.push(
        <g key={`t${sd}`}>
          <rect x={f3(wx - 9)} y={f3(cy)} width={18} height={f3(hgt)} fill={mixHex(TRACK_COLOR.trunk, SKY.haze, 0.42)} />
          <circle cx={f3(wx)} cy={f3(cy)} r={f3(r)} fill={col} />
          <circle cx={f3(wx + r * 0.62)} cy={f3(cy + r * 0.28)} r={f3(r * 0.68)} fill={col} />
          <circle cx={f3(wx - r * 0.66)} cy={f3(cy + r * 0.3)} r={f3(r * 0.6)} fill={col} />
          <circle cx={f3(wx - r * 0.22)} cy={f3(cy - r * 0.2)} r={f3(r * 0.7)} fill={lit} />
        </g>,
      );
    }
  const terraceLines = TERRACES.map((t) => (
    <rect key={`tl${t.j}`} x={f3(hx0)} y={f3(-t.h - 3)} width={f3(hx1 - hx0)} height={f3(Math.max(2, 5 * t.s))} fill={mixHex(TRACK_COLOR.grassLit, SKY.haze, t.haze)} opacity={0.5} />
  ));

  // --- the bank's crowd: each row a file walking in from beyond the frame edge ---------------------------------------
  const hillRows: React.ReactNode[] = [];
  const [xa, xb] = xRange(c, 0, 70);
  for (let ti = TERRACES.length - 1; ti >= 0; ti--) {
    const t = TERRACES[ti];
    const tT = hillT(t);
    const off = remaining(T, tT, BANK_V);
    const pace = paceAt(T, tT);
    const sc = FAN_U * t.s;
    const px = sc * k0;
    const halfW = 34 * t.s;
    const nodes: React.ReactNode[] = [];
    // a split row stops with its lead's head tucked against the stand's stepped side
    const innerX = t.split ? standHW(t.h + 0.8 * FAN_H * t.s) + t.ragged * t.pitch : t.ragged * t.pitch;
    for (const side of [-1, 1] as const) {
      const lead = side * innerX;
      const iA = side < 0 ? Math.ceil((lead - off - xb) / t.pitch) : Math.ceil((xa - lead - off) / t.pitch);
      const iB = side < 0 ? Math.floor((lead - off - xa) / t.pitch) : Math.floor((xb - lead - off) / t.pitch);
      for (let i = Math.max(0, iA - 1); i <= iB + 1; i++) {
        const sd = 20000 + t.j * 1000 + (side < 0 ? 0 : 500) + i;
        const jx = (hash(sd * 1.9) - 0.5) * 0.16 * t.pitch;
        const xr = lead + side * (i * t.pitch + off) + jx;
        const feet = t.h + (hash(sd * 2.7) - 0.5) * 5;
        const headTop = feet + FAN_H * t.s;
        if (headTop > CREST(xr) - 8) continue;
        // hidden behind the stand or the screen
        if (headTop < STAND.ROOF_TOP && Math.abs(xr) + halfW < standHW(headTop)) continue;
        if (withScreen && feet > -SCREEN.bottom + 10 && headTop < -SCREEN.top && Math.abs(xr) + halfW < SCREEN.x1) continue;
        const woman = hash(sd * 4.3) < 0.42;
        const spec = fanSpec(sd, woman, 0.05);
        // a file faces where it walked in, before and after it stops (no flip on the stop)
        const sp: FanSpec = { ...spec, face: side < 0 ? -1 : 1 };
        nodes.push(
          fanNode(`h${sd}`, xr, -feet, sc, sp, {
            sit: 0,
            walk: off + i * 13,
            pace,
            sway: pace > 0 ? 0 : swayOf(spec, 1.4),
            ...payBank(xr, woman),
            haze: t.haze,
            px,
            S,
            legs: true,
          }, glowId),
        );
      }
    }
    hillRows.push(<g key={`hr${t.j}`}>{nodes}</g>);
  }

  // --- the screen on its posts --------------------------------------------------------------------------------------
  const SC = SCREEN;
  const lit = clamp01(screenLit);
  const faceOff = mixHex(COLOR.board, COLOR.shadow, 0.42);
  const face = mixHex(faceOff, COLOR.cream, smoothstep(lit));
  const fX = SC.x0 + SC.border;
  const fY = SC.top + SC.border;
  const fW = SC.x1 - SC.x0 - 2 * SC.border;
  const fH = SC.bottom - SC.top - 2 * SC.border;
  const screen = (
    <g key="screen">
      {[-SC.post, SC.post].map((px0, i) => (
        <g key={i}>
          <rect x={px0 - SC.postW / 2} y={SC.bottom - 10} width={SC.postW} height={-SC.bottom - STAND.ROOF_F + 20} fill={mixHex(TRACK_COLOR.fence, SKY.haze, 0.1)} />
          <rect x={px0 - SC.postW / 2} y={SC.bottom - 10} width={5} height={-SC.bottom - STAND.ROOF_F + 20} fill={TRACK_COLOR.fenceLit} />
        </g>
      ))}
      <rect x={SC.x0 + 14} y={SC.top + 16} width={SC.x1 - SC.x0} height={SC.bottom - SC.top} rx={8} fill={COLOR.shadow} opacity={0.16} />
      <rect x={SC.x0} y={SC.top} width={SC.x1 - SC.x0} height={SC.bottom - SC.top} rx={8} fill={mixHex(COLOR.board, COLOR.shadow, 0.2)} />
      <rect x={SC.x0} y={SC.top} width={SC.x1 - SC.x0} height={3} rx={1.5} fill={mixHex(COLOR.board, "#FFF4E2", 0.35)} />
      <rect x={fX} y={fY} width={fW} height={fH} rx={3} fill={face} />
      {lit < 0.999 ? <g opacity={f3(1 - smoothstep(lit))}>{raceNode(S, fX, fY, fW, fH, faceOff, uid)}</g> : null}
      {screenOverlay ? screenOverlay(k0) : null}
    </g>
  );

  // --- the stand -------------------------------------------------------------------------------------------------------
  const NT = STAND.TIERS;
  const top = NT - 1;
  const riser = (r: number) => mixHex(TRACK_COLOR.standShade, COLOR.shadow, 0.06 + 0.03 * (top - r));
  const treadCol = mixHex(TRACK_COLOR.stand, "#FFF4E2", 0.12);
  const aisleRiser = mixHex(TRACK_COLOR.stand, COLOR.shadow, 0.08);
  const backWallTop = STAND.ROOF_F;
  const hwTop = tierHW(top);
  const postX = hwTop - 8;
  const standBack = (
    <g key="sb">
      {/* its one shadow on the bank behind (down and right of the key light) */}
      <path d={`M${f3(-HW0 + 26)} 0L${f3(-ROOF_HW + 26)} ${f3(-STAND.ROOF_F + 16)}L${f3(-ROOF_HW_BACK + 26)} ${f3(-STAND.ROOF_TOP + 16)}L${f3(ROOF_HW_BACK + 26)} ${f3(-STAND.ROOF_TOP + 16)}L${f3(ROOF_HW + 26)} ${f3(-STAND.ROOF_F + 16)}L${f3(HW0 + 26)} 0Z`} fill={COLOR.shadow} opacity={0.16} />
      {/* the back wall behind the top tier, in the roof's shade */}
      <rect x={f3(-hwTop)} y={f3(-backWallTop)} width={f3(2 * hwTop)} height={f3(backWallTop - feetOf(top) + 4)} fill={mixHex(TRACK_COLOR.standShade, COLOR.shadow, 0.38)} />
    </g>
  );
  const postCol = mixHex(TRACK_COLOR.stand, COLOR.shadow, 0.1);
  const roof = (
    <g key="roof">
      {/* the roof's two thin posts at the back corners, and their raked struts out to the fascia's ends */}
      {[-1, 1].map((sd) => (
        <g key={`rp${sd}`}>
          <rect x={f3(sd * postX - 5)} y={f3(-backWallTop)} width={10} height={f3(backWallTop - feetOf(top))} fill={postCol} />
          <path d={`M${f3(sd * postX)} ${f3(-backWallTop + 90)}L${f3(sd * (ROOF_HW - 8))} ${f3(-STAND.ROOF_F + 2)}`} stroke={postCol} strokeWidth={9} strokeLinecap="round" />
        </g>
      ))}
      {/* the lit roof top, receding to the back */}
      <path d={`M${f3(-ROOF_HW)} ${f3(-STAND.ROOF_FT)}L${f3(-ROOF_HW_BACK)} ${f3(-STAND.ROOF_TOP)}L${f3(ROOF_HW_BACK)} ${f3(-STAND.ROOF_TOP)}L${f3(ROOF_HW)} ${f3(-STAND.ROOF_FT)}Z`} fill={TRACK_COLOR.standRoof} />
      <rect x={f3(-ROOF_HW_BACK)} y={f3(-STAND.ROOF_TOP)} width={f3(2 * ROOF_HW_BACK)} height={4} fill={mixHex(TRACK_COLOR.standRoof, "#FFF4E2", 0.3)} />
      {/* the cream fascia, and its underside's shadow line */}
      <rect x={f3(-ROOF_HW)} y={f3(-STAND.ROOF_FT)} width={f3(2 * ROOF_HW)} height={f3(STAND.ROOF_FT - STAND.ROOF_F)} fill={COLOR.cream} />
      <rect x={f3(-ROOF_HW)} y={f3(-STAND.ROOF_FT)} width={f3(2 * ROOF_HW)} height={4} fill="#FFF8EC" />
      <rect x={f3(-ROOF_HW)} y={f3(-STAND.ROOF_F - 4)} width={f3(2 * ROOF_HW)} height={4} fill={COLOR.creamFoot} />
    </g>
  );
  /** a tier's block: the riser from the ground up, the lit tread on top, the stairs in its aisles */
  const tierBlock = (r: number) => {
    const hw = tierHW(r);
    const rc = recedeOf(r);
    const fl = floorOf(r);
    const tTop = fl + STAND.TREAD;
    const lowTop = r > 0 ? floorOf(r - 1) + STAND.TREAD : 0;
    const out: React.ReactNode[] = [];
    out.push(<rect key="rs" x={f3(-hw)} y={f3(-tTop)} width={f3(2 * hw)} height={f3(tTop)} fill={riser(r)} />);
    out.push(<rect key="tr" x={f3(-hw)} y={f3(-tTop)} width={f3(2 * hw)} height={f3(STAND.TREAD)} fill={treadCol} />);
    out.push(<rect key="nz" x={f3(-hw)} y={f3(-fl - 3)} width={f3(2 * hw)} height={4} fill={COLOR.creamFoot} />);
    // the stairs: two steps a tier, a lighter concrete with a nosing on each
    for (const ax0 of [AISLE_X.L, AISLE_X.MID, AISLE_X.R]) {
      const ax = ax0 * rc;
      const aw = STAND.AW * rc;
      out.push(<rect key={`a${ax0}`} x={f3(ax - aw / 2)} y={f3(-tTop)} width={f3(aw)} height={f3(tTop - lowTop)} fill={aisleRiser} />);
      for (const u of [0, 0.5]) {
        const yS = lerp(lowTop, tTop, u + 0.5) - 0;
        const tH = (tTop - lowTop) * 0.22;
        out.push(<rect key={`as${ax0}${u}`} x={f3(ax - aw / 2)} y={f3(-yS)} width={f3(aw)} height={f3(tH)} fill={treadCol} />);
        out.push(<rect key={`an${ax0}${u}`} x={f3(ax - aw / 2)} y={f3(-yS + tH - 3)} width={f3(aw)} height={3} fill={COLOR.creamFoot} />);
      }
    }
    // the tier's end: a sliver of its side face (the step reads in profile at the open sides)
    for (const sd of [-1, 1]) out.push(<rect key={`e${sd}`} x={f3(sd < 0 ? -hw : hw - 6)} y={f3(-tTop)} width={6} height={f3(tTop - lowTop)} fill={mixHex(riser(r), COLOR.shadow, 0.2)} />);
    return out;
  };
  // the people climbing the stairs, by the tier in front of them
  const climbers: Record<number, React.ReactNode[]> = {};
  const rows: React.ReactNode[] = [];
  for (const w of WALKERS) {
    const rem = remaining(T, w.arrive, AISLE_V);
    const d = w.L - rem;
    if (d <= 0 || d > w.climb) continue;
    const feet = d;
    const rc = recedeAtH(feet);
    if (feet + FAN_H * rc < STAND.FRONT - 2) continue; // still hidden behind the front wall
    const pace = paceAt(T, w.arrive);
    const spec: FanSpec = { ...w.spec, face: (w.side < 0 ? -1 : 1) as 1 | -1 };
    // on the stair just in front of tier `band` (so the hand-over into the tier's own layer keeps the same order)
    const band = Math.max(0, Math.min(top, Math.ceil((feet - feetOf(0)) / STAND.STEP - 1e-6)));
    (climbers[band] ??= []).push(
      fanNode(w.key, (w.aisleX / recedeOf(w.r)) * rc, -feet, FAN_U * rc, spec, {
        sit: 0,
        walk: d,
        pace,
        sway: 0,
        ...pay(w.aisleX, w.spec.woman),
        haze: 0,
        px: FAN_U * rc * k0,
        S,
        legs: true,
      }, glowId),
    );
  }
  for (let r = top; r >= 0; r--) {
    const rc = recedeOf(r);
    const nodes: React.ReactNode[] = [];
    nodes.push(<g key="blk">{tierBlock(r)}</g>);
    const feet = feetOf(r);
    const seatHip = feet + hipOf(1) * FAN_U * rc;
    // the seats: a back and a pan in sage
    for (const s of SEATS.filter((q) => q.r === r)) {
      nodes.push(<rect key={`sb${s.id}`} x={f3(s.x - 23 * rc)} y={f3(-seatHip - 44 * rc)} width={f3(46 * rc)} height={f3(50 * rc)} rx={7} fill={SEAT_COL} />);
      nodes.push(<rect key={`sp${s.id}`} x={f3(s.x - 25 * rc)} y={f3(-seatHip - 2)} width={f3(50 * rc)} height={f3(9 * rc)} rx={4} fill={mixHex(SEAT_COL, COLOR.shadow, 0.18)} />);
    }
    for (const s of SEATS.filter((q) => q.r === r)) {
      const w = SEAT_WALKER.get(s.id);
      let x = s.x;
      let sit = 1;
      let pace = 0;
      let walk = 0;
      let spec = s.spec;
      if (w && r >= SEATED_BEFORE) {
        const rem = remaining(T, w.arrive, AISLE_V);
        const d = w.L - rem;
        if (d <= w.climb) continue; // still on the stairs (or not here yet)
        pace = paceAt(T, w.arrive);
        walk = d;
        sit = smoothstep((T - w.arrive) / SIT_F);
        x = w.aisleX + Math.sign(s.x - w.aisleX) * (d - w.climb);
        // a fan that walked in keeps facing the way it walked, seated too
        spec = { ...s.spec, face: (s.side < 0 ? -1 : 1) as 1 | -1 };
      }
      nodes.push(
        fanNode(`s${s.id}`, x, -feet, FAN_U * rc, spec, {
          sit,
          walk,
          pace,
          sway: pace > 0 ? 0 : swayOf(s.spec, 1.3),
          ...pay(s.x, s.spec.woman),
          haze: 0,
          px: FAN_U * rc * k0,
          S,
          legs: true,
        }, glowId),
      );
    }
    rows.push(<g key={`r${r}`}>{nodes}</g>);
    if (climbers[r]) rows.push(<g key={`c${r}`}>{climbers[r]}</g>);
  }
  const standFront = (
    <g key="sf">
      <rect x={-HW0} y={-STAND.FRONT} width={2 * HW0} height={STAND.FRONT} fill={COLOR.cream} />
      <rect x={-HW0} y={-STAND.FRONT} width={2 * HW0} height={6} fill="#FFF8EC" />
      <rect x={-HW0} y={-STAND.FRONT + 30} width={2 * HW0} height={6} fill={COLOR.creamFoot} />
      <rect x={-HW0} y={-28} width={2 * HW0} height={28} fill={mixHex(COLOR.creamFoot, COLOR.shadow, 0.06)} />
      {/* the concourse mouths under the aisles (the fans come up out of these) */}
      {[AISLE_X.L, AISLE_X.MID, AISLE_X.R].map((ax, i) => (
        <path key={`go${i}`} d={`M${ax - 26} -28L${ax - 26} -66A26 26 0 0 1 ${ax + 26} -66L${ax + 26} -28Z`} fill={mixHex(TRACK_COLOR.standShade, COLOR.shadow, 0.45)} />
      ))}
    </g>
  );

  // --- the foreground: the walkway, the fence row, the boarded railing, the tyre wall, the track ----------------------
  const yG = (z: number) => P(0, 0, z)[1];
  const band = (zNear: number, zFar: number, fill: string, key: string, op = 1) => (
    <rect key={key} x={-60} y={f3(yG(zFar))} width={1200} height={f3(Math.max(0, Math.min(2100, yG(zNear)) - yG(zFar)))} fill={fill} opacity={op} />
  );
  const fz = FENCE.z;
  const kf = kAt(c, fz);
  const fenceFans: React.ReactNode[] = [];
  if (fenceRow) {
    const off = remaining(T, FENCE.T);
    const pace = paceAt(T, FENCE.T);
    const [fa, fb] = xRange(c, fz, 70);
    for (const side of [-1, 1] as const) {
      const lead = side * FENCE.pitch * 0.5;
      const iA = side < 0 ? Math.ceil((lead - off - fb) / FENCE.pitch) : Math.ceil((fa - lead - off) / FENCE.pitch);
      const iB = side < 0 ? Math.floor((lead - off - fa) / FENCE.pitch) : Math.floor((fb - lead - off) / FENCE.pitch);
      for (let i = Math.max(0, iA - 1); i <= iB + 1; i++) {
        const sd = 90000 + (side < 0 ? 0 : 500) + i;
        const xr = lead + side * (i * FENCE.pitch + off) + (hash(sd * 1.9) - 0.5) * 8;
        const woman = hash(sd * 4.3) < 0.42;
        const spec = fanSpec(sd, woman, 0.08);
        const sp: FanSpec = { ...spec, face: side < 0 ? -1 : 1 };
        // waist up over the boards: the legs never show
        fenceFans.push(
          fanNode(`f${sd}`, xr, 0, FAN_U, sp, { sit: 0, walk: off + i * 11, pace, sway: pace > 0 ? 0 : swayOf(spec, 1.2), ...payBank(xr, woman), haze: 0, px: FAN_U * kf, S, legs: false }, glowId),
        );
      }
    }
  }
  const railZ = FENCE.railZ;
  const kr = kAt(c, railZ);
  const railTop = P(0, -FENCE.railH, railZ)[1];
  const boardTop = P(0, -FENCE.boardH, railZ)[1];
  const railBase = yG(railZ);
  const [rxa, rxb] = xRange(c, railZ, 100);
  const posts: React.ReactNode[] = [];
  for (let n = Math.floor(rxa / 200); n <= Math.ceil(rxb / 200); n++) {
    const [x0] = P(n * 200, 0, railZ);
    posts.push(<rect key={`p${n}`} x={f3(x0 - 5 * kr)} y={f3(railTop - 4 * kr)} width={f3(10 * kr)} height={f3(boardTop - railTop + 4 * kr)} fill={TRACK_COLOR.fence} />);
    posts.push(<rect key={`pl${n}`} x={f3(x0 - 5 * kr)} y={f3(railTop - 4 * kr)} width={f3(3.5 * kr)} height={f3(boardTop - railTop + 4 * kr)} fill={TRACK_COLOR.fenceLit} />);
  }
  const boards: React.ReactNode[] = [];
  for (let n = Math.floor(rxa / 300); n <= Math.ceil(rxb / 300); n++) {
    const [x0] = P(n * 300, 0, railZ);
    const [x1] = P((n + 1) * 300, 0, railZ);
    boards.push(<rect key={`bd${n}`} x={f3(x0 + 1.5 * kr)} y={f3(boardTop)} width={f3(x1 - x0 - 3 * kr)} height={f3(railBase - boardTop)} fill={n % 2 ? COLOR.cream : mixHex(COLOR.cream, TRACK_COLOR.stand, 0.35)} />);
  }
  const rail = (
    <g key="rail">
      {posts}
      <rect x={-60} y={f3(railTop - 3 * kr)} width={1200} height={f3(Math.max(1.5, 8 * kr))} fill={TRACK_COLOR.fence} />
      <rect x={-60} y={f3(railTop - 3 * kr)} width={1200} height={f3(Math.max(0.8, 2.5 * kr))} fill={TRACK_COLOR.fenceLit} />
      <rect x={-60} y={f3(boardTop - 2 * kr)} width={1200} height={f3(railBase - boardTop + 2 * kr)} fill={COLOR.creamFoot} />
      {boards}
      <rect x={-60} y={f3(boardTop)} width={1200} height={f3(Math.max(1, 4 * kr))} fill="#FFF8EC" />
      <rect x={-60} y={f3(railBase - 10 * kr)} width={1200} height={f3(10 * kr)} fill={COLOR.creamFoot} />
    </g>
  );
  // the tyre wall: two rows of tyres, the faces painted red and cream in blocks
  const tz = -520;
  const kt = kAt(c, tz);
  const tBase = yG(tz);
  const th = 26 * kt;
  const [txa, txb] = xRange(c, tz, 100);
  const tyres: React.ReactNode[] = [];
  for (let r = 0; r < 2; r++) {
    const y1 = tBase - r * th;
    tyres.push(<rect key={`tb${r}`} x={-60} y={f3(y1 - th * 0.97)} width={1200} height={f3(th * 0.97)} rx={f3(th * 0.4)} fill={TRACK_COLOR.tyre} />);
    tyres.push(<rect key={`tt${r}`} x={-60} y={f3(y1 - th * 0.92)} width={1200} height={f3(Math.max(0.8, th * 0.16))} fill={TRACK_COLOR.tyreLit} />);
  }
  for (let n = Math.floor(txa / 248); n <= Math.ceil(txb / 248); n++) {
    const x0 = P(n * 248, 0, tz)[0];
    const w = 124 * kt;
    const y1 = tBase - th;
    tyres.push(<rect key={`tp${n}`} x={f3(x0 + w * 0.02)} y={f3(y1 - th * 0.97)} width={f3(w * 0.96)} height={f3(th * 0.97)} rx={f3(th * 0.35)} fill={n % 2 ? TRACK_COLOR.tyreCream : TRACK_COLOR.tyreRed} />);
  }
  const tyreWall = <g key="tyre">{tyres}</g>;
  const kerb = (zN: number, zF: number, key: string) => {
    const [ka, kb] = xRange(c, zN, 100);
    const BL = 100;
    const out: React.ReactNode[] = [];
    const yF = yG(zF);
    const yN = yG(zN);
    for (let n = Math.floor(ka / BL) - 1; n <= Math.ceil(kb / BL) + 1; n++) {
      const a = P(n * BL, 0, zF)[0];
      const b = P((n + 1) * BL, 0, zF)[0];
      const a2 = P(n * BL, 0, zN)[0];
      const b2 = P((n + 1) * BL, 0, zN)[0];
      out.push(<path key={`${key}${n}`} d={`M${f3(a)} ${f3(yF)}L${f3(b)} ${f3(yF)}L${f3(b2)} ${f3(yN)}L${f3(a2)} ${f3(yN)}Z`} fill={n % 2 ? TRACK_COLOR.kerbCream : TRACK_COLOR.kerbRed} />);
    }
    return <g key={key}>{out}</g>;
  };
  const asphaltFar = TRACK_Z.far;
  const asphaltNear = TRACK_Z.near;
  const fore = (
    <g key="fore">
      {band(-110, 0, mixHex(TRACK_COLOR.asphaltLight, COLOR.cream, 0.45), "walk")}
      {band(railZ, -110, TRACK_COLOR.grass, "g1")}
    </g>
  );
  const fore2 = (
    <g key="fore2">
      {band(tz, railZ, mixHex(TRACK_COLOR.grass, TRACK_COLOR.grassDark, 0.3), "g2")}
      {band(tz - 8, tz, TRACK_COLOR.grassDark, "g2s", 0.6)}
    </g>
  );
  const track = (
    <g key="track">
      {band(asphaltFar, tz, TRACK_COLOR.grass, "g3")}
      {kerb(asphaltFar, asphaltFar + 50, "kf")}
      <rect x={-60} y={f3(yG(asphaltFar))} width={1200} height={f3(Math.max(0, Math.min(2100, yG(asphaltNear)) - yG(asphaltFar)))} fill={`url(#${uid}asp)`} />
      {band(asphaltFar - 22, asphaltFar - 12, TRACK_COLOR.line, "lf", 0.85)}
      {band(asphaltNear + 12, asphaltNear + 22, TRACK_COLOR.line, "ln", 0.85)}
      {kerb(asphaltNear - 70, asphaltNear, "kn")}
      {band(-2380, asphaltNear - 70, `url(#${uid}near)`, "verge")}
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: SKY.haze, overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id={`${uid}sky`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(skyTop)} x2="0" y2={f3(crestY + 60)}>
            <stop offset="0" stopColor={SKY.top} />
            <stop offset="0.24" stopColor={SKY.upper} />
            <stop offset="0.46" stopColor={SKY.amber} />
            <stop offset="0.66" stopColor={SKY.mid} />
            <stop offset="0.83" stopColor={SKY.low} />
            <stop offset="0.93" stopColor={SKY.glow} />
            <stop offset="1" stopColor={SKY.haze} />
          </linearGradient>
          <radialGradient id={`${uid}sun`} gradientUnits="userSpaceOnUse" cx={f3(200 - c.x * 0.02 * k0)} cy={f3(crestY - 260)} r={760}>
            <stop offset="0" stopColor={SKY.sun} stopOpacity="0.7" />
            <stop offset="0.35" stopColor={SKY.sun} stopOpacity="0.24" />
            <stop offset="1" stopColor={SKY.sun} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}hill`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-CREST(0))} x2="0" y2="0">
            <stop offset="0" stopColor={mixHex(TRACK_COLOR.grassFar, SKY.haze, 0.4)} />
            <stop offset="0.5" stopColor={mixHex(TRACK_COLOR.grassFar, SKY.haze, 0.15)} />
            <stop offset="1" stopColor={TRACK_COLOR.grass} />
          </linearGradient>
          <linearGradient id={`${uid}asp`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yG(asphaltFar))} x2="0" y2={f3(yG(asphaltNear))}>
            <stop offset="0" stopColor={TRACK_COLOR.asphaltFar} />
            <stop offset="1" stopColor={TRACK_COLOR.asphaltNear} />
          </linearGradient>
          <linearGradient id={`${uid}near`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yG(asphaltNear - 70))} x2="0" y2="1920">
            <stop offset="0" stopColor={TRACK_COLOR.grass} />
            <stop offset="1" stopColor={mixHex(TRACK_COLOR.grassDark, COLOR.shadow, 0.2)} />
          </linearGradient>
          <radialGradient id={glowId}>
            <stop offset="0" stopColor={COLOR.amberTop} stopOpacity="0.5" />
            <stop offset="0.45" stopColor={COLOR.amberTop} stopOpacity="0.2" />
            <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
          </radialGradient>
        </defs>
        {sky}
        <g transform={layerTransform(c, 0)}>
          {trees}
          <path d={hillD} fill={`url(#${uid}hill)`} />
          {terraceLines}
          {hillRows}
          {withScreen ? screen : null}
          {standBack}
          {roof}
          {rows}
          {standFront}
        </g>
        {fore}
        <g transform={layerTransform(c, fz)}>{fenceFans}</g>
        {rail}
        {fore2}
        {tyreWall}
        {track}
        {onTrack ? onTrack(c) : null}
      </svg>
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <FansGrain S={S} />
    </AbsoluteFill>
  );
};

/** the kit's grain on twos (as StoutStage / TrackStage) */
const FansGrain: React.FC<{ S: number }> = ({ S }) => {
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash(g2 + 7) * 2 - 1) * GRAIN.travel;
  return (
    <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
      <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
    </AbsoluteFill>
  );
};
export { clamp01, lerp, smoothstep };
