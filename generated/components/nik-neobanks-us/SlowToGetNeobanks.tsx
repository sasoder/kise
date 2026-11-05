// ---------------------------------------------------------------------------
// SlowToGetNeobanks (nik-neobanks-us, cut 8). Cheeky Pint style (stout) in real 3D (bankWorld.tsx on nuclearWorld's stage).
// RENDER --gl=angle. Opaque 1080x1920, 23.976 fps, 62 frames.
//
// CHECK LINE: "America is wall-to-wall old banks, and the neobanks are barely getting off the ground."
//
// THE LINE (John, asking): "Why is the U.S. so slow to get neobanks?"
// WORD -> FRAME: Why -3 · is 2 · the 6 · U.S. 10-20 · so 27 · slow 30 · to 40 · get 44 · neobanks? 47-61 (Nik's "Well," at f62)
// DURATION: the slot 8.008 -> 10.594 s = 2.586 s x 23.976 = 62 frames (f0..f61).
//
// THE MOTION: one eased push-in, already moving at f0, fastest around f21, landing on "neobanks" (f47), then a slow creep. It opens high over the south on the lower 48,
// the whole silhouette read by "U.S." (f10), crowded edge to edge with ~200 small cream classic banks, all facing the camera;
// among them stand four amber phones (0.66x scale) in slots in the board, a third out. The camera pushes in about 12.5x (distance, log-even) toward the phone
// in the middle of the country (Kansas), the pitch lowering from 46 to 38 degrees so the banks around it turn from dots into
// buildings; by "neobanks" (f47) that phone sits at the frame's middle, a portrait phone about 220 px tall, its card readable, among banks to the top of frame.
// All four phones rise at one constant, visible speed the whole cut (about 35 % -> 68 % of their height, about bank height by
// f61, ~255 px tall): moving, never arriving; the rise is the mover in f47-61 while the distance creeps about 0.2 % a frame.
// AMBER = the neobank (the phone); the banks are cream clay, the slab board-toned. No text but the banks' own engraved BANK.
//
// SOURCES: no figures. Map: us-atlas states-10m (us48Data.ts). Phone positions are places, not data: the middle of the country
// (the target), San Francisco, New York, Atlanta.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { NuclearStage, nuclearProject, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { BankField, NeobankPhone, PHONE, UsSlab, usBankSites, usProject, usSlabTop, type FieldBank } from "./bankWorld";

export const FPS = 24000 / 1001;
export const DURATION = 62;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const T = usSlabTop();

// --- the field: a staggered jittered grid; each phone takes the place of the bank site nearest its city ---------------------
const CITIES: [number, number][] = [usProject(-97.0, 38.7), usProject(-121.9, 37.6), usProject(-74.9, 40.6), usProject(-84.6, 33.9)];
const RAW = usBankSites({ pitchX: 43, pitchZ: 39, jitter: 5, north: 4, foot: [20, 14], small: 0.62, fill: true, seed: "slow" });
const PHONE_SITES: [number, number][] = CITIES.map((c) => {
  let best = RAW[0];
  for (const s of RAW) if (Math.hypot(s.at[0] - c[0], s.at[1] - c[1]) < Math.hypot(best.at[0] - c[0], best.at[1] - c[1])) best = s;
  return best.at;
});
const TARGET = PHONE_SITES[0];
// the two banks of the row just in front of the target stand a step wider apart, so their roofs never cover the phone's foot
const FRONT_NUDGE = 7;
const nudge = (at: [number, number]): [number, number] => {
  const dz = TARGET[1] - at[1];
  const dx = at[0] - TARGET[0];
  return dz > 25 && dz < 55 && Math.abs(dx) < 32 ? [at[0] + Math.sign(dx) * FRONT_NUDGE, at[1]] : at;
};
const BANKS: FieldBank[] = RAW.filter((s) => !PHONE_SITES.some((p) => p[0] === s.at[0] && p[1] === s.at[1])).map((s, i) => ({
  at: nudge(s.at),
  scale: s.scale * (0.95 + (0.1 * ((i * 7919) % 11)) / 10),
}));
// every phone rises at one constant, clearly visible speed from about a third out to about two thirds out by f61, so the
// visible part turns from a slice into a portrait phone (top edge, earpiece slot, the card on its screen); the target a hair
// ahead. The phones stand at PHONE_SCALE so that two thirds out the target is about as tall as the banks round it.
const PHONE_SCALE = 0.66;
const RISE0 = [0.36, 0.35, 0.355, 0.345];
const RISE_RATE = 0.33 / 62;
const riseOf = (i: number, f: number) => RISE0[i] + RISE_RATE * f;

// --- the camera: one push that LANDS on "neobanks" (f47), then a living creep. Its progress m(f) integrates a speed profile:
// already moving at f0 (a small start speed), peak speed around f21, decelerating to zero at f47. Every field follows m; the
// distance in log space, so the dive is even. Under the landing the distance starts a creep (from f39, entering at zero speed, then constant) that runs on to f61. ----
const WIDE: NuclearCam = { tx: -30, ty: 0, tz: 4, d: 2370, yaw: 6, pitch: 46, f: 2400, cy: 812, cx: 540 };
const LAND: NuclearCam = { tx: TARGET[0], ty: T + 10, tz: TARGET[1], d: 190, yaw: 3.3, pitch: 38.4, f: 2400, cy: 900, cx: 540 };
const LAND_F = 47;
const speedAt = (f: number) => {
  const u = c01(f / LAND_F);
  return 0.03 * (1 - u) * (1 - u) + Math.pow(Math.sin(Math.PI * Math.pow(u, 0.88)), 2);
};
const PROG: number[] = (() => {
  // cumulative speed at quarter-frame steps, normalised to 1 at LAND_F
  const out = [0];
  let acc = 0;
  for (let i = 1; i <= LAND_F * 4; i++) {
    acc += (speedAt((i - 1) / 4) + speedAt(i / 4)) / 8;
    out.push(acc);
  }
  return out.map((v) => v / acc);
})();
const progress = (f: number) => {
  const q = c01(f / LAND_F) * LAND_F * 4;
  const i = Math.min(PROG.length - 2, Math.floor(q));
  return lerp(PROG[i], PROG[i + 1], q - i);
};
const CREEP = 0.002; // log-distance per frame (about 0.2 % closer each frame)
const CREEP_IN = 8; // frames for the creep to reach its speed
const CREEP_F = 39; // the creep enters under the end of the push, so the landing never stalls
const creepAt = (f: number) => {
  const x = Math.max(0, f - CREEP_F);
  return CREEP * (x < CREEP_IN ? (x * x) / (2 * CREEP_IN) : x - CREEP_IN / 2);
};
const camAt = (f: number): NuclearCam => {
  const m = progress(f);
  // the look point travels to the target a little ahead of the zoom, so the phone is centred before it is big
  const tl = 1 - Math.pow(1 - c01(m * 1.06), 1.5);
  return {
    tx: lerp(WIDE.tx, LAND.tx, tl),
    ty: lerp(WIDE.ty, LAND.ty, tl),
    tz: lerp(WIDE.tz, LAND.tz, tl),
    d: Math.exp(lerp(Math.log(WIDE.d), Math.log(LAND.d), m) - creepAt(f)),
    f: WIDE.f,
    yaw: lerp(WIDE.yaw, LAND.yaw, m),
    pitch: lerp(WIDE.pitch, LAND.pitch, m),
    cy: lerp(WIDE.cy, LAND.cy, tl),
    cx: 540,
  };
};
/** where the target phone's visible part sits on screen (for the framing checks) */
export const targetOnScreen = (f: number) => {
  const cam = camAt(f);
  const top = T + PHONE.H * PHONE_SCALE * riseOf(0, f);
  const a = nuclearProject(cam, [TARGET[0], T, TARGET[1]]);
  const b = nuclearProject(cam, [TARGET[0], top, TARGET[1]]);
  return { foot: a.y, top: b.y, k: a.s };
};

const SlowToGetNeobanks: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  return (
    <NuclearStage
      cam={cam}
      S={f + 400}
      boardUnits={1000}
      fog={[1.3, 3.8]}
      pool={{ x: 520, y: 860, strength: 1 }}
      world={
        <>
          <UsSlab />
          <BankField items={BANKS} y={T} frieze />
          {PHONE_SITES.map((at, i) => (
            <NeobankPhone key={i} at={at} y={T} scale={PHONE_SCALE} rise={riseOf(i, f)} />
          ))}
        </>
      }
    />
  );
};

export default SlowToGetNeobanks;
