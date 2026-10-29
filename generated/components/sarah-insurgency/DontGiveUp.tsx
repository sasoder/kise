// ---------------------------------------------------------------------------
// DontGiveUp (sarah-insurgency, cut 1). Dwarkesh 3D style (styles/dwarkesh-3d.md) in the clip's one-off hybrid
// "Dwarkesh 3D map" look (animation_source/notes/COMMON.md): the umber map PAGE as the 3D floor inside the misty air,
// vintage wooden wargame pieces standing on it. Opaque 1080x1920, 24 fps, 91 frames.
// RENDER WITH --gl=angle (the floor is WebGL2) and --concurrency=4.
//
// CHECK LINE: "beating a country's army does not end the war: the beaten army breaks up into many small fighters who
// stand back up all around the victor."
//
// THE LINE: "You've defeated another country conventionally, but they don't give up."
// WORD -> FRAME (f0 = 1.750 s): You've -4 · defeated 3 · another 13 · country 29 · conventionally 43 · but 66 ·
//   they 68 · don't 71 · give 77 · up 79 · (They 87, the speaker's next line, not ours)
// DURATION: the slot 1.750 -> 5.542 s = 3.792 s x 24 = 91 frames (f0..f90).
//
// THE MOTION: one continuous camera looking well down on the page (pitch 43.5 -> 46 deg), creeping in and arcing
// round the action (yaw -12 -> +18, the arc front-loaded so the fall reads in depth). f0: two armies already face
// each other on the page (cream invader left, the orange army right, nearly as big: same height class, a little
// narrower), the cream block already marching at constant speed. CONTACT f30 (cream face meets orange face); FIRST
// REACTION f31 (the orange block starts to tip away from the push, slow off the vertical, then fast); it LANDS flat
// f42.5 in a low puff of page dust (the cut's own, split behind / in front of the block) with a small rebound;
// the cream block stops where it struck, upright.
// f49-64 the fallen block sinks into the page (kit Block sink: a tear round its footprint, a soft umber opening, the
// tear closes over it). From that spot outward a wave of orange PAWNS rises out of the page (kit Pawn.rise), 10 in a
// loose ring round the cream block, staggered by their distance from the first one, which stands inside the fallen
// block's old footprint (first starts f61, last standing f79.6, "up" 79). f80-90 settled: the pawns stand (a breath of
// sway), the lone cream block encircled, the camera's creep continuing. Nothing fades out; no arrows, no text, no
// flags (the countries are generic).
// Orange = the side fighting on its own ground (the beaten country's army, then its fighters); cream = the invader.
//
// DEPTH: the clip camera (insurgencyCamera: pinhole F 1300, target on the page, distance D, pitch, yaw); three keys,
// pchip + the house damped follow. Page world units, origin = the contact point. D 340 -> 333. Blocks 86 / 80 units
// tall (cream / orange), pawns 25 units tall in a ring of radius 74 round the cream block's stop. Fog: the kit's
// default (by eye distance relative to D). Framing: the pair ~61 % of the width at f0, its centre y ~834 (the cream
// block's near foot ~1071, just above the 1080 caption band); the final ring y ~610-1040.
//
// SOURCES: none (generic countries; no figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Block,
  HorizonHaze,
  InsurgencyStage,
  PageGround3D,
  Pawn,
  WorldLayer,
  camTrack,
  dirOfYaw,
  insWorld,
  sortFarToNear,
  toScreen,
  type BlockSpec,
  type CamKey,
  type InsWorld,
  type P2,
  type V3,
} from "./insurgencyShared";

export const FPS = 24;
export const DURATION = 91;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- the stage geometry (page world units; origin = the contact point) ---------------------------------------------
/** the confrontation's axis: the bearing (deg, 0 north, 90 east) the cream block marches along */
const BEARING = 70;
const AX = dirOfYaw(BEARING); // the push direction
const PX: V3 = [-AX[2], 0, AX[0]]; // its perpendicular (to the right of the march)
const along = (s: number, t = 0): P2 => [AX[0] * s + PX[0] * t, AX[2] * s + PX[2] * t];

/** the cream block (the invader): w across its face, d along the march, h tall */
const CREAM = { w: 66, d: 46, h: 86 };
/** the orange block (the defending army) */
const ORANGE = { w: 60, d: 42, h: 80 };
/** contact frame and the march */
export const CONTACT = 30;
const SPEED = 1.5; // world units per frame, constant (a march)
/** the cream block's centre along the axis at a frame: constant speed until it strikes, then a small give and stop */
const creamS = (f: number) => {
  const base = -CREAM.d / 2;
  if (f <= CONTACT) return base - SPEED * (CONTACT - f);
  return base + 1.1 * (1 - Math.exp(-(f - CONTACT) / 1.1));
};
const creamSpec = (f: number): BlockSpec => {
  const [x, zz] = along(creamS(f));
  return { x, z: zz, w: CREAM.w, h: CREAM.h, d: CREAM.d, face: BEARING };
};
const ORANGE_AT = along(ORANGE.d / 2);
/** the topple's drive: from contact, landing (0.78) at f42.5 */
const TOPPLE_T = 16;
const toppleU = (f: number) => Math.max(0, Math.min(1, (f - CONTACT) / TOPPLE_T));
/** the fallen block lies from the pivot (its far bottom edge, along d) out to d + h along the axis */
const LIE_S0 = ORANGE.d;
const LIE_S1 = ORANGE.d + ORANGE.h;
const FALLEN_C = along((LIE_S0 + LIE_S1) / 2);

/** THE SINK (kit Block sink, drive 0..1 over f49-64): tear f49-52, down ~f51-61, the tear closes ~f60-64 */
const SINK_F: [number, number] = [49, 64];
const sinkU = (f: number) => Math.max(0, Math.min(1, (f - SINK_F[0]) / (SINK_F[1] - SINK_F[0])));

// ---- the ring of pawns ---------------------------------------------------------------------------------------------
const STOP: P2 = along(creamS(90));
const RING_R = 74;
const PAWN_SIZE = 25;
/** angles from the push direction (deg): a loose ring; the first (0) stands inside the fallen block's old footprint,
 *  the wave runs round both sides and closes on the near side (180) */
const RING_ANG = [0, -34, 33, -72, 74, -113, 110, -150, 147, 181];
const RING_JIT = [2, 4, -3, 6, -5, 3, -6, 5, -2, 0];
const PAWNS = RING_ANG.map((a, i) => {
  const r = (a * Math.PI) / 180;
  const R = RING_R + RING_JIT[i];
  const at: P2 = [STOP[0] + (AX[0] * Math.cos(r) + PX[0] * Math.sin(r)) * R, STOP[1] + (AX[2] * Math.cos(r) + PX[2] * Math.sin(r)) * R];
  return { at, seed: i + 3 };
});
const SPOT: P2 = PAWNS[0].at;
const distOf = (at: P2) => Math.hypot(at[0] - SPOT[0], at[1] - SPOT[1]);
const DMAX = Math.max(...PAWNS.map((p) => distOf(p.at)));
/** rise: staggered by distance from the first, which starts f61 as the sink's tear closes; the last starts f67; 15
 *  frames each (standing at 0.84: first f73.6, last f79.6) */
const RISE_T = 15;
const riseStart = (at: P2) => 61 + 6 * (distOf(at) / DMAX);

/** for the framing checks (scratch scripts) */
export const GEO = { creamSpec, ORANGE_AT, ORANGE, BEARING, PAWNS, PAWN_SIZE, FALLEN_C };

// ---- the camera ----------------------------------------------------------------------------------------------------
export const KEYS: CamKey[] = [
  { f: 0, x: -6, z: 8, D: 340, pitch: 43.5, yaw: -12 },
  { f: 45, x: -8, z: 36, D: 337, pitch: 44.8, yaw: 7 },
  { f: 90, x: -22, z: 60, D: 333, pitch: 46, yaw: 18 },
];
export const track = camTrack(KEYS, 200);
const REST = track(0);

const f2 = (v: number) => v.toFixed(2);
const hashN = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** THE PAGE DUST of the landing (the cut's own, in place of the kit's specks): a low cloud and specks thrown out from
 *  the lying block's edges, split so the dust behind it is drawn before it and the dust in front after it. Cause: the
 *  block lands flat at topple 0.78 (f42.5); it lasts 13 frames. */
const LAND_F = CONTACT + 0.78 * TOPPLE_T;
const PUFF_T = 13;
const PUFF = Array.from({ length: 22 }, (_, i) => {
  // a point on the footprint edge (s along the push, t across), pushed out along its edge normal
  const side = i % 4; // 0 far end, 1 / 2 the long sides, 3 the near (pivot) end
  const u = hashN(i * 7.3 + 1) * 2 - 1;
  const hs = (LIE_S1 - LIE_S0) / 2;
  const ht = ORANGE.w / 2;
  const cs = (LIE_S0 + LIE_S1) / 2;
  const [s0, t0, ns, nt] = side === 0 ? [cs + hs, u * ht, 1, 0] : side === 1 ? [cs + u * hs, ht, 0, 1] : side === 2 ? [cs + u * hs, -ht, 0, -1] : [cs - hs, u * ht, -1, 0];
  return { s0, t0, ns, nt, out: 5 + 11 * hashN(i * 3.1 + 2), up: 3 + 7 * hashN(i * 5.7 + 3), r: 1.3 + 1.7 * hashN(i * 9.1 + 4), light: i % 3 !== 0, cloud: i % 3 === 0 };
});
const Dust: React.FC<{ A: InsWorld; frame: number; front: boolean }> = ({ A, frame, front }) => {
  const t = (frame - LAND_F) / PUFF_T;
  if (t <= 0 || t >= 1) return null;
  const fh = dirOfYaw(A.cam.yaw);
  const dist = A.dist(FALLEN_C[0], 0, FALLEN_C[1]);
  const spread = 1 - Math.pow(1 - t, 2.4);
  const els: React.ReactNode[] = [];
  PUFF.forEach((q, i) => {
    const [gx, gz] = along(q.s0 + q.ns * q.out * spread, q.t0 + q.nt * q.out * spread);
    const isFront = (gx - FALLEN_C[0]) * fh[0] + (gz - FALLEN_C[1]) * fh[2] < 0;
    if (isFront !== front) return;
    const y = q.up * Math.sin(Math.PI * Math.min(1, t * 1.3)) * (1 - 0.3 * t);
    const p = toScreen(A.cam, gx, y, gz);
    if (q.cloud) {
      const rr = (7 + 14 * spread) * p.s;
      els.push(<ellipse key={`c${i}`} cx={f2(p.x)} cy={f2(p.y)} rx={f2(rr)} ry={f2(rr * 0.55)} fill="url(#dgu-dust)" opacity={0.8 * Math.pow(1 - t, 1.2)} />);
    }
    els.push(<circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2(Math.max(1, q.r * p.s * 0.6))} fill={A.tone(q.light ? "#D9CDB4" : "#8F7D62", dist)} opacity={0.8 * Math.pow(1 - t, 1.6)} />);
  });
  return <g>{els}</g>;
};

type Item = { at: P2; el: React.ReactNode };

const DontGiveUp: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = track(frame);
  const A = insWorld({ cam, rest: REST, frame });

  const tu = toppleU(frame);
  const su = sinkU(frame);
  const items: Item[] = [{ at: along(creamS(frame)), el: <Block key="cream" A={A} spec={creamSpec(frame)} color="cream" uid="cr" /> }];
  if (su < 1) {
    const oSpec: BlockSpec = { x: ORANGE_AT[0], z: ORANGE_AT[1], w: ORANGE.w, h: ORANGE.h, d: ORANGE.d, face: BEARING + 180 };
    // the sink runs only once the block lies still (topple 1): the kit's sink is not driven together with the topple
    items.push({
      at: tu >= 0.78 ? FALLEN_C : ORANGE_AT,
      el: (
        <g key="orange">
          <Dust A={A} frame={frame} front={false} />
          <Block A={A} spec={oSpec} color="orange" topple={tu} toppleDir="back" sink={su} uid="or" dust={false} />
          <Dust A={A} frame={frame} front />
        </g>
      ),
    });
  }
  PAWNS.forEach((p, i) => {
    const u = (frame - riseStart(p.at)) / RISE_T;
    if (u <= 0) return;
    // a breath of sway once standing (screen rotation about the base, under a degree)
    const stand = Math.max(0, Math.min(1, (u - 1) * 3));
    const g = toScreen(cam, p.at[0], 0, p.at[1]);
    const rot = 0.7 * stand * Math.sin((frame / 24) * Math.PI * 2 * 0.55 + p.seed * 1.7);
    items.push({
      at: p.at,
      el: (
        <g key={`p${i}`} transform={`rotate(${rot.toFixed(3)} ${f2(g.x)} ${f2(g.y)})`}>
          <Pawn A={A} x={p.at[0]} z={p.at[1]} size={PAWN_SIZE} rise={Math.min(1, u)} uid={`pw${i}`} seed={p.seed} />
        </g>
      ),
    });
  });

  return (
    <AbsoluteFill>
      <InsurgencyStage A={A}>
        <PageGround3D cam={cam} air={A.ground} fog={A.fog} />
        <HorizonHaze A={A} id="dgu-hz" />
        <WorldLayer>
          <defs>
            <radialGradient id="dgu-dust">
              <stop offset="0" stopColor={A.tone("#C9B992", A.dist(FALLEN_C[0], 0, FALLEN_C[1]))} stopOpacity={0.75} />
              <stop offset="1" stopColor={A.tone("#C9B992", A.dist(FALLEN_C[0], 0, FALLEN_C[1]))} stopOpacity={0} />
            </radialGradient>
          </defs>
          {sortFarToNear(A, items, (it) => it.at).map((it) => it.el)}
        </WorldLayer>
      </InsurgencyStage>
    </AbsoluteFill>
  );
};

export default DontGiveUp;
