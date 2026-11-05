// ---------------------------------------------------------------------------
// OwnTheWholeStack (nik-neobanks-us, cut 44). Cheeky Pint style (stout) in real 3D (nuclearWorld.tsx). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 169 frames.
//
// CHECK LINE: "To do it properly you own the whole stack down to the bank license, and in the US that license is a mountain of
// paperwork."
//
// THE LINE: John: "(So you think you have to be willing to own) the stack end-to-end, including all the licensing?"
//           Nik: "Including the licensing. Which was tricky in the U.S. because it was such a stern licensing regime."
// WORD -> FRAME: the 4 · stack 8-13 · end 14 · to 23 · end 27-31 · including 32 · all 41 · the 48 · licensing? 51-55 |
//   Including 56 · the 64 · licensing. 65-72 · Which 73 · was 79 · tricky 81-87 · in 88 · the 92 · U.S. 95-102 · because 103 ·
//   it 111 · was 122 · such 125 · a 129 · stern 134-145 · licensing 146-155 · regime. 156-168
// DURATION: the slot 44.211 -> 51.260 s = 7.049 s x 23.976 = 169 frames (f0..f168).
//
// THE MOTION: one continuous camera that never comes to rest. It opens close on the neobank phone at the top of one amber column
// (already craning) and cranes down past TECH and COMPLIANCE to the column's foot, which stands in a dark slot in the board (~f48),
// creeping in. On "licensing" the BANK LICENSE slab rises out of the slot under the column and lifts the whole column by its own
// height, seating as the base (f51-f67), its print sliding in on its face (f62-f76). From ~f48 the camera already eases back and
// right, so the pile's spot beside the stack is in shot as the paperwork starts: bundles of cream paper reams (sheet edges, printed
// top sheets, loose sheets fanned out) are dealt down from above the frame onto the board, thick and quick at first, single
// reams and slower as the pile gets tall (lands f86-f131.5), the eye rising over the pile's top; by "stern" (f134) the pile stands
// clearly taller than the whole amber stack. The last ream, an embossed seal on its printed top sheet, lands on "regime"
// (f155). Then a slow creep.
// CAUSE: the license's top meets the column's foot at f51 (contact) and the column moves from f52 (first lift). A falling bundle's
// soft shade grows on the pile's top before it lands.
// AMBER = the neobank and what it owns: the phone and the three layers (one company, one stack). Paper is cream clay.
//
// SOURCES: no figures on screen. Real proportions: a ream of letter paper (500 sheets) 8.5 x 11 x ~2 in. Revolut's US
// charter application (2021, withdrawn 2023) is context only; no dates or names on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { NuclearStage, SHADOW_LEN, SoftShadows, nuclearProject, nuclearTrack, type NuclearCam, type ShadowItem, type V3 } from "../scott-nolan-uranium/nuclearWorld";
import { NeobankPhone, PHONE } from "./bankWorld";
import { PaperReams, REAM_REAL, SLAB, SlotPlate, StackSlabs, type ReamDrop, type ReamItem, type SlabItem } from "./stackParts";

export const FPS = 24000 / 1001;
export const DURATION = 169;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const glide = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// --- the stack: one column at the origin; under it a slot the license comes out of ------------------------------------
const STACK_AT: [number, number] = [0, 0];
const LIFT_F0 = 51; // contact: the license's top meets the column's foot
const LIFT_F1 = 67; // seated
const liftOf = (f: number) => SLAB.H * glide(LIFT_F0, LIFT_F1, f);
const SLOT_GAP = 7;
const SLOT_W = SLAB.W + 2 * SLOT_GAP;
const SLOT_D = SLAB.D + 2 * SLOT_GAP;
const SLOT_RIM = 3.2;

// the neobank's phone (bankWorld), scaled so the slabs are a little wider than it
const PHONE_SCALE = 68 / PHONE.W;
const PHONE_H = PHONE.H * PHONE_SCALE;

const columnY = (f: number) => liftOf(f);
const slabItems = (f: number): SlabItem[] => {
  const y = columnY(f);
  return [
    { kind: "license", at: STACK_AT, y: y - SLAB.H, print: smooth(62, 76, f) },
    { kind: "compliance", at: STACK_AT, y },
    { kind: "tech", at: STACK_AT, y: y + SLAB.H },
  ];
};
const stackTopY = (f: number) => columnY(f) + 2 * SLAB.H + PHONE_H;

// --- the paperwork: bundles of letter-paper reams dealt down onto a pile right of the stack, in shot -------------------
const REAM_L = 120;
const REAM = { W: (REAM_L * REAM_REAL.W) / REAM_REAL.L, L: REAM_L, H: 20 };
const PILE_AT: [number, number] = [SLAB.W / 2 + 22 + REAM.W / 2, 22];
/** reams per dealt bundle: thick bundles early (the pile climbs fast past the slabs), single reams as it gets tall */
const BUNDLE_REAMS = [2, 2, 2, 2, 1, 1, 1, 1, 1, 1];
/** landing frames: a quick, weighty rhythm that eases as the pile grows; the last (sealed) ream lands on "regime" */
const LAND = [86, 90.5, 95, 100, 105.5, 111, 117.5, 124.5, 131.5, 155];
const BUNDLE_N = BUNDLE_REAMS.length;
type Ream = { bundle: number; dx: number; dz: number; yaw: number; y0: number; seed: number; seal: number };
const BUNDLES = BUNDLE_REAMS.map((_, b) => ({
  x: PILE_AT[0] + (random(`own-bx${b}`) - 0.5) * 7,
  z: PILE_AT[1] + (random(`own-bz${b}`) - 0.5) * 6,
  yaw: (random(`own-by${b}`) - 0.5) * 8,
}));
const REAMS: Ream[] = [];
const BUNDLE_Y: number[] = [];
const BUNDLE_H: number[] = [];
(() => {
  let y = 0;
  BUNDLE_REAMS.forEach((n, b) => {
    BUNDLE_Y.push(y);
    BUNDLE_H.push(n * REAM.H);
    for (let k = 0; k < n; k++) {
      const i = REAMS.length;
      REAMS.push({
        bundle: b,
        dx: (random(`own-rx${i}`) - 0.5) * 4,
        dz: (random(`own-rz${i}`) - 0.5) * 4,
        yaw: (random(`own-ry${i}`) - 0.5) * 4,
        y0: k * REAM.H,
        seed: random(`own-rs${i}`),
        seal: b === BUNDLE_N - 1 ? 1 : 0,
      });
    }
    y += n * REAM.H;
  });
})();
export const PILE_TOP = BUNDLE_Y[BUNDLE_N - 1] + BUNDLE_H[BUNDLE_N - 1];
/** loose sheets fanned out of the pile at different heights (out the front or the right side), each riding inside its ream */
const LOOSE = Array.from({ length: 12 }, (_, j) => {
  const front = random(`own-lf${j}`) < 0.55;
  const out = 3 + 6 * random(`own-lo${j}`);
  return {
    ream: Math.min(REAMS.length - 1, Math.floor((j * REAMS.length) / 12 + random(`own-lr${j}`) * 0.9)),
    y: REAM.H * (0.12 + 0.76 * random(`own-ly${j}`)),
    ox: front ? (random(`own-lx${j}`) - 0.5) * 10 : out,
    oz: front ? -out : (random(`own-lz${j}`) - 0.5) * 12,
    yaw: (random(`own-lw${j}`) - 0.5) * 12,
  };
});

// --- the camera: one damped track, built from before f0 so the crane is already moving on the first frame. No move ever
// comes to rest: the crane's settle, the push during the lift and the pull-back overlap -----------------------------------
const PRE = 24;
const TRACK = nuclearTrack(
  { tx: -5, ty: 128, tz: 0, d: 390, yaw: 0, pitch: 4, f: 2200, cy: 960, cx: 540 },
  [
    // the crane down the column: from the phone to the foot and the slot
    { f0: PRE - 26, f1: PRE + 50, to: { ty: -14, d: 318, pitch: 18 } },
    // a slow push while the license comes up
    { f0: PRE + 26, f1: PRE + 76, to: { d: 298 } },
    // the pan to the pile's spot (in shot by ~f80) and the pull back and rise
    { f0: PRE + 44, f1: PRE + 108, to: { tx: 64 } },
    { f0: PRE + 48, f1: PRE + 146, to: { d: 655, pitch: 24, yaw: -6 }, warp: 0.5 },
    // the eye rises over the pile's top as it climbs, so its top sheet (text, seal) stays in view
    { f0: PRE + 74, f1: PRE + 150, to: { ty: 165 } },
    { f0: PRE + 140, f1: PRE + 230, to: { d: 694, yaw: -7.4 } },
  ],
  DURATION + PRE,
);
const trackAt = (f: number): NuclearCam => TRACK[Math.max(0, Math.min(TRACK.length - 1, Math.round(f) + PRE))];
// from the pull-back on, the stack's near foot is held on a line just above caption band 1: the vertical framing is solved from
// the zoom, so no pull-back can carry the bases into a band
const FOOT_NEAR: V3 = [STACK_AT[0], 0, STACK_AT[1] - SLOT_D / 2 - SLOT_RIM];
const FOOT_LINE = 1048;
const camAt = (f: number): NuclearCam => {
  const c = trackAt(f);
  const foot = nuclearProject({ ...c, cy: 960 }, FOOT_NEAR).y;
  const w = smooth(36, 84, f);
  return { ...c, cy: 960 + w * (FOOT_LINE - foot) + (1 - w) * (c.cy - 960) };
};

// a bundle is dealt from above the frame's top edge: its start height is solved from the camera at the frame it starts, and its
// descent (an ease-out: quick high up, weighty and slowing into the landing) is long enough that it never smears
const aboveFrameY = (b: number, f: number) => {
  const B = BUNDLES[b];
  const c = camAt(Math.max(0, f));
  const yl = BUNDLE_Y[b];
  let y = yl + BUNDLE_H[b] + 60;
  for (; y < yl + 3000; y += 4) {
    let ok = true;
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const p = nuclearProject(c, [B.x + (sx * REAM.W) / 2, y, B.z + (sz * REAM.L) / 2]);
        if (p.y > -30) ok = false;
      }
    if (ok) break;
  }
  return y;
};
const FALLS = BUNDLES.map((_, b) => {
  let F = 18;
  let y0 = aboveFrameY(b, LAND[b] - F);
  for (let it = 0; it < 3; it++) {
    const k = nuclearProject(camAt(LAND[b]), [BUNDLES[b].x, BUNDLE_Y[b], BUNDLES[b].z]).s;
    F = Math.max(12, Math.min(28, (2 * (y0 - BUNDLE_Y[b]) * k) / 120));
    y0 = aboveFrameY(b, LAND[b] - F);
  }
  return { F, y0 };
});
/** each bundle's foot height at frame f (null before it is dealt); a bundle never passes into the one under it */
const bundleYs = (f: number): (number | null)[] => {
  const out: (number | null)[] = [];
  let floorTop = 0;
  for (let b = 0; b < BUNDLE_N; b++) {
    const { F, y0 } = FALLS[b];
    const t = (f - (LAND[b] - F)) / F;
    let y: number | null = null;
    if (t >= 1) y = BUNDLE_Y[b];
    else if (t >= 0) y = BUNDLE_Y[b] + (y0 - BUNDLE_Y[b]) * Math.pow(1 - t, 2);
    if (y !== null) {
      y = Math.max(y, floorTop);
      floorTop = y + BUNDLE_H[b];
    }
    out.push(y);
  }
  return out;
};
const HIDDEN = -900;
const reamWorld = (r: Ream, by: number | null) => {
  const B = BUNDLES[r.bundle];
  return { x: B.x + r.dx, z: B.z + r.dz, y: by === null ? HIDDEN : by + r.y0, yaw: B.yaw + r.yaw };
};
const reamItems = (f: number): ReamItem[] => {
  const ys = bundleYs(f);
  const out: ReamItem[] = REAMS.map((r) => {
    const w = reamWorld(r, ys[r.bundle]);
    return { at: [w.x, w.y, w.z] as V3, yaw: w.yaw, seed: r.seed, h: REAM.H, seal: r.seal, text: 1 };
  });
  for (const L of LOOSE) {
    const r = REAMS[L.ream];
    const w = reamWorld(r, ys[r.bundle]);
    const a = (w.yaw * Math.PI) / 180;
    // the ream's local x -> world (cos a, -sin a); local z (world-away) -> (sin a, cos a)
    const x = w.x + Math.cos(a) * L.ox + Math.sin(a) * L.oz;
    const z = w.z - Math.sin(a) * L.ox + Math.cos(a) * L.oz;
    out.push({ at: [x, w.y + L.y, z] as V3, yaw: w.yaw + L.yaw, seed: r.seed, h: 0.35, text: 0 });
  }
  return out;
};
const reamDrop = (f: number): ReamDrop | undefined => {
  const ys = bundleYs(f);
  for (let b = 0; b < BUNDLE_N; b++) {
    const y = ys[b];
    if (y !== null && f < LAND[b]) {
      const B = BUNDLES[b];
      const t = (f - (LAND[b] - FALLS[b].F)) / FALLS[b].F;
      return { x: B.x, z: B.z, y, yaw: B.yaw, alpha: smooth(0, 0.35, t) };
    }
  }
  return undefined;
};
const pileTop = (f: number) => {
  let t = 0;
  for (let b = 0; b < BUNDLE_N; b++) t += BUNDLE_H[b] * smooth(LAND[b] - 3, LAND[b] + 1, f);
  return t;
};

// --- shadows: one for the stack, one for the pile, each from its union silhouette --------------------------------------
const shadowsAt = (f: number): ShadowItem[] => {
  const top = stackTopY(f);
  const out: ShadowItem[] = [
    { x: STACK_AT[0] - SLAB.W / 2 + SLAB.D / 2, z: STACK_AT[1], len: SLAB.W - SLAB.D, r: SLAB.D / 2, soft: 2.5, alpha: 1, dirX: 1, dirZ: 0 },
    { x: STACK_AT[0], z: STACK_AT[1], len: top * SHADOW_LEN, r: SLAB.D * 0.55, soft: 9, alpha: 0.85 },
  ];
  const pt = pileTop(f);
  if (pt > 0.5) {
    const a = smooth(0, REAM.H, pt);
    out.push({ x: PILE_AT[0], z: PILE_AT[1] - REAM.L / 2 + REAM.W / 2, len: REAM.L - REAM.W, r: REAM.W / 2, soft: 2.5, alpha: a, dirX: 0, dirZ: 1 });
    out.push({ x: PILE_AT[0], z: PILE_AT[1], len: pt * SHADOW_LEN, r: REAM.W * 0.6, soft: 10, alpha: 0.85 * a });
  }
  return out;
};

const OwnTheWholeStack: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 400;
  const cam = camAt(f);
  return (
    <NuclearStage
      cam={cam}
      S={S}
      fog={[2.2, 9]}
      boardUnits={300}
      pool={{ x: 470, y: 720, strength: 1 }}
      world={
        <>
          <SoftShadows items={shadowsAt(f)} />
          <SlotPlate at={STACK_AT} w={SLOT_W} d={SLOT_D} rim={SLOT_RIM} />
          <StackSlabs items={slabItems(f)} />
          <NeobankPhone at={STACK_AT} y={columnY(f) + 2 * SLAB.H} scale={PHONE_SCALE} shadow={0} slot={false} />
          <PaperReams items={reamItems(f)} size={{ W: REAM.W, L: REAM.L }} drop={reamDrop(f)} />
        </>
      }
    />
  );
};

export default OwnTheWholeStack;
