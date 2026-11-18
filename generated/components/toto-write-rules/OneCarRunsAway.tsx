// ---------------------------------------------------------------------------
// OneCarRunsAway (toto-write-rules, cut 22). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 128 frames. World: toto-champion-eight/trackWorld.tsx (the side-view circuit, golden-hour
// sky, parallax), imported, never edited. Cars: rulesShared.tsx (builder A's WildCar and CardCar), imported.
//
// CHECK LINE: "With free rules, the richest team's car runs away and leaves the rest of the field far behind."
//
// THE LINE: "...in terms of infrastructure, will | come out with a car that is much superior than some of the other
// teams. And it would create a field | where the leading car could be five seconds quicker than the next one."
// WORD -> FRAME: come 7 · out 17 · with 21 · a 26 · car 29 · that 33 · is 38 · much 42 · superior 61 · than 72 ·
// some 79 · of 82 · the 86 · other 88 · teams 92 · And 100 · it 103 · would 104 · create 106 · a 116 · field 124.
// DURATION: the slot 22.680 -> 27.800 s = 5.12 s x 25 = 128 frames (f0..f127).
//
// THE MOTION (one continuous truck alongside the WildCar, then one pull-out): hard cut in on cut 3's free-reign car
// (stilt wing, second plank, rear fan, extra front wheels, all amber, at 1) rolling out of its garage's open end on the
// far side of the track (review 3: a pit box open to the track, a dark bay under a cream fascia with a door frame at
// its right end; the car rolls out of it f0-10; 4.4 m tall with a 3.7 m lintel for the revised 3.4 m stilt wing). It steers across
// onto the near racing lane (f8-25, the camera easing back so it holds ~650-690 px) while the three plain cars run up
// from behind on the lane beside it, so on "car" (f29) the leader runs tucked in under its fan. From
// "that" it pulls clear with ease (it runs up to 200 world px/f; the plain cars fall back and leave the left edge one
// by one). From f72 one eased pull-out (linear in 1/scale, so the camera's lag behind the
// WildCar grows at a steady rate and the world's flow on screen falls smoothly, no stall) while it cranes up a little
// (eye 4.8 -> 5.8 m) and trucks on. The plain cars run as a tight nose-to-tail train on the lane right beside the
// WildCar's (review 3: the same baseline, ~24 px above its ground line at the wide), so "behind" reads along the track.
// Review 4: the gap opening is the message. The leader leaves the left edge ~f62-76 and comes back in from the left
// during the pull-out; from f74-90 the train drops to 155 world px/f against the WildCar's 200, so the empty track
// grows on screen every frame f86-127 (289 -> 426 px; checked at load). Resolved f120-127: WildCar ~340 px (nose at
// x ~1007), the leader ~260 px in frame from the left edge with the second car's nose behind it, the gap 387 -> 426 px.
// BACKDROP (reviews 1-2): a long card grandstand close behind the catch fence, three rows of big picture-book fans
// (head, hair, shoulders; a few waving scarves), hazed toward the stand's own colour (more in the close); the roof
// edge and sky above.
// PLAIN CARS: drawn in their card tone, then recoloured to deep tones (denim, terracotta, deep green) masked off the
// tyres and helmet, so rims and helmets keep their own colours (rulesShared has no dark tones; no silhouette edge yet).
// AMBER = engineering freedom: the WildCar's radical parts (cut 3's car); the plain cars and the world carry none.
// CAUSE -> EFFECT: each car moves only under its own drive (the hubs turn by the distance rolled, the fan spins, a
// small bob); the camera is a truck that follows the WildCar. Depth order flips (the WildCar crossing a lane, leaving
// the garage) only while the cars are clear of each other along the track (checked at load, below).
// FRAMING: composed in the keep-in box, then the whole picture 190 px lower (SHIFT_Y). The WildCar's ground line sits
// at y 1010 in the close and 1050 at the wide, every car above caption band 1; the near kerb (y ~1160-1250 at the
// wide, after the dolly in) and the verge below are moving context.
// SPEED NOTE: the truck reaches 200 world px/f (trackWorld's comment sizes its patterns for 170; at 200 the finest
// period, the far kerb, is still 4x the per-frame step; checked against 3.5x at load).
//
// SOURCES: none (no figures, no logos, no text). Car proportions: champShared F1 via rulesShared.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, amberBandFor, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { CAR, CardCar, M, WildCar, type CarTone } from "./rulesShared";
import { OnLane, TRACK, TRACK_COLOR, TrackStage, kartJitter, laneGroundY, laneK, planeCam, project, type TrackCam } from "../toto-champion-eight/trackWorld";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";

export const FPS = 25;
export const DURATION = 128;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** the whole picture sits 190 px lower than its keep-in-box composition (COMMON.md, styles/cheeky-pint.md) */
export const SHIFT_Y = 190;

const ss = (a: number, b: number, f: number) => smoothstep((f - a) / (b - a));
const ss5 = (a: number, b: number, f: number) => {
  const u = clamp01((f - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};

// --- the cars' extent (metres from the cockpit's ground point; rulesShared CAR): the WildCar's fan reaches 0.45 m past
// the tail (CAR.fan.to.x - r); the plain cars end at the rear wing --------------------------------------------------
export const WILD_EXT = { rear: CAR.fan.to[0] - CAR.fan.r, nose: CAR.nose } as const;
export const CARD_EXT = { rear: CAR.tail, nose: CAR.nose } as const;
const carLen = (WILD_EXT.nose - WILD_EXT.rear) * M;

// --- lanes (depth from the subject plane, world px; + = farther) ------------------------------------------------------
/** the pit lane in front of the garage, beyond the far kerb */
export const PIT_Z = 6.3 * M;
/** the WildCar's racing lane: nearest the camera, so it passes in front of the field */
export const WILD_Z = -2.4 * M;
/** the merge across the track (f6-28) */
const MERGE = [8, 25] as const;
export const wildZ = (f: number) => lerp(PIT_Z, WILD_Z, ss5(MERGE[0], MERGE[1], f));

// --- speeds (world px / frame). The field runs at a steady VP; the WildCar rolls out slow and runs up to VW_MAX. -----
const VP0 = 112;
const VP1 = 199;
/** review 4: from f84 the field drops to VP_LATE, so the gap visibly opens through the pull-out */
const VP_LATE = 155;
const LATE = [74, 90] as const;
const BURST = 118;
/** the field: a steady pace, a burst once the WildCar is across the track (so it runs up alongside by "car"), then a
 *  pace just under the WildCar's from f54-78, so the gap keeps opening slowly (never closing) through the wide */
export const vField = (f: number) => VP0 + BURST * ss(13, 22, f) * (1 - ss(28, 40, f)) + (VP1 - VP0) * ss(50, 68, f) - (VP1 - VP_LATE) * ss(LATE[0], LATE[1], f);
const VW0 = 70;
const VW_MAX = 200;
export const vWild = (f: number) => VW0 + (VW_MAX - VW0) * ss(0, 52, f);
const SUB = 4;
const integ = (v: (f: number) => number) => {
  const out: number[] = [0];
  let d = 0;
  for (let f = -2; f < DURATION + 4; f++) {
    for (let s = 0; s < SUB; s++) d += v(f + (s + 0.5) / SUB) / SUB;
    out.push(d);
  }
  return (f: number) => {
    const g = f + 2;
    const i = Math.max(0, Math.min(out.length - 2, Math.floor(g)));
    return lerp(out[i], out[i + 1], g - i);
  };
};
const XW = integ(vWild);
export const wildX = (f: number) => XW(f) - XW(0);

// --- the field: three plain cars as a nose-to-tail train on the lane right beside the WildCar's (review 3: the same
// baseline, so "behind" reads purely along the track) -----------------------------------------------------------------
export const FIELD_Z = -1.35 * M;
/** the middle car of the train runs a touch nearer (a car's width offset in the same pack), so it can tuck its nose
 *  under the leader's gearbox without the two sharing a plane */
const FIELD_Z2 = -1.7 * M;
type FieldCar = { z: number; o: number; tone: CarTone; driver: string; seed: number };
/** o: cockpit x relative to the field's reference point (metres): a tight train (4.4 m apart, so each nose tucks ~1 m
 *  under the car ahead), leaving the left edge one by one and coming back as a train that runs on off frame */
export const FIELD: FieldCar[] = [
  { z: FIELD_Z, o: -0.25, tone: "terracotta", driver: "#737D8A", seed: 2.9 },
  { z: FIELD_Z2, o: -4.65, tone: "denim", driver: "#E2CFAA", seed: 2.9 + (2 * Math.PI) / 2.1 },
  { z: FIELD_Z, o: -9.05, tone: "sage", driver: "#C47B5A", seed: 2.9 + (4 * Math.PI) / 2.1 },
];
/** the field's reference point relative to the WildCar's cockpit at f0 (world px) */
const FIELD0 = -10.0 * M;
const XF = integ(vField);
export const fieldX = (c: FieldCar, f: number) => FIELD0 + XF(f) - XF(0) + c.o * M + 0.08 * M * Math.sin(f / 13 + c.seed * 2.1);

// --- the camera -------------------------------------------------------------------------------------------------------
// The pull-out runs linear in 1 / scale (eased at both ends): the camera's lag behind the WildCar, which puts it on the
// right third at the end, grows at a steady world rate, so the world's flow on screen falls smoothly (no stall).
const PULL = [72, 124] as const;
const L_END = 340;
const HX_END = 840;
const pullU = (f: number) => ss(PULL[0], PULL[1], f);
/** before the pull: ~650 px at f0, held through the merge, a gentle drift back as it pulls clear */
const lenPre = (f: number) => lerp(650, 690, ss(0, 30, f)) * lerp(1, 0.88, ss(28, 92, f));
/** before the pull: a touch left of centre at the garage, centred, then a little forward as it pulls clear */
const sxPre = (f: number) => 480 + 70 * ss(0, 40, f) + 50 * ss(44, 84, f);
/** the WildCar's length on screen (px) and its cockpit's lead over the frame's centre column (world px) */
const frameAt = (f: number) => {
  const u = pullU(f);
  const creep = 1;
  const inv = lerp(1 / lenPre(f), 1 / L_END, u);
  const lag = lerp((sxPre(f) - 540) / lenPre(f), (HX_END - 540) / L_END, u) * carLen;
  return { len: creep / inv, lag };
};
/** the WildCar's ground line on screen before the 190 px shift */
const heroGyAt = (f: number) => lerp(820, 860, pullU(f));
const D0 = 14 * M;
const K_REF = 0.38;
const DOLLY = 0.3;
const eyeAt = (f: number) => (lerp(4.2, 5.2, pullU(f)) + 0.6 * ss(0, 40, f)) * M;

export const camAt = (f: number): TrackCam => {
  const zW = wildZ(f);
  const fr = frameAt(f);
  const want = fr.len / carLen; // laneK at the WildCar's lane
  // k and D together: laneK(zW) = k D / (D + zW), D = D0 (K_REF / k)^DOLLY (fixed point)
  let k = want;
  let D = D0;
  for (let i = 0; i < 30; i++) {
    D = D0 * Math.pow(K_REF / k, DOLLY);
    k = (want * (D + zW)) / D;
  }
  const eye = eyeAt(f);
  const kz = (k * D) / (D + zW);
  const hor = heroGyAt(f) - eye * kz;
  const groundY = hor + eye * k + SHIFT_Y;
  const x = wildX(f) - fr.lag;
  return { x, k, D, eye, groundY };
};

// --- the garage the WildCar rolls out of: a cream card box on the far verge, its right end open -----------------------
export const GARAGE = { zNear: 5.75 * M, zFar: 7.6 * M, x1: -2.0 * M, len: 9 * M, h: 4.4 * M, door: 3.7 * M, post: 0.3 * M } as const;
const G = {
  wall: COLOR.cream,
  wallFoot: "#E7DCC8",
  roof: "#BFAE8F",
  inside: "#6E5442",
  insideDeep: "#4A3A30",
  floor: "#9C8470",
  trim: "#B65A41",
};
const quad = (pts: [number, number][]) => `M${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("L")}Z`;

const GarageBack: React.FC<{ cam: TrackCam }> = ({ cam }) => {
  const P = (x: number, y: number, zz: number) => project(cam, x, y, zz);
  const { zNear, zFar, x1, len, h, door } = GARAGE;
  const x0 = x1 - len;
  // the inside: back wall, floor, the far side of the doorway (seen through the open end)
  return (
    <g>
      <path d={quad([P(x0, -h, zFar), P(x1, -h, zFar), P(x1, 0, zFar), P(x0, 0, zFar)])} fill={G.insideDeep} />
      <path d={quad([P(x0, 0, zFar), P(x1, 0, zFar), P(x1, 0, zNear), P(x0, 0, zNear)])} fill={G.floor} />
      {/* review 3: the bay reads as a garage: a lit strip under the roof, the left end wall, a stack of spare tyres */}
      <path d={quad([P(x0, -h, zFar), P(x1, -h, zFar), P(x1, -h + 0.5 * M, zFar), P(x0, -h + 0.5 * M, zFar)])} fill={G.inside} />
      <path d={quad([P(x0 + 0.6 * M, -h + 0.32 * M, zFar), P(x1 - 0.6 * M, -h + 0.32 * M, zFar), P(x1 - 0.6 * M, -h + 0.2 * M, zFar), P(x0 + 0.6 * M, -h + 0.2 * M, zFar)])} fill={COLOR.cream} opacity={0.8} />
      <path d={quad([P(x0, -h, zNear), P(x0, -h, zFar), P(x0, 0, zFar), P(x0, 0, zNear)])} fill={G.inside} />
      {[0, 1, 2].map((i) => {
        const [cx, cy] = P(x0 + 1.4 * M, -(0.16 + i * 0.3) * M, zFar - 0.5 * M);
        const kz = laneK(cam, zFar - 0.5 * M);
        return <rect key={i} x={cx - 0.36 * M * kz} y={cy - 0.15 * M * kz} width={0.72 * M * kz} height={0.28 * M * kz} rx={0.1 * M * kz} fill="#3A312B" />;
      })}
      {/* the end wall's far post and lintel (behind the car) */}
      <path d={quad([P(x1, -h, zFar), P(x1, -h, zNear), P(x1, -door, zNear), P(x1, -door, zFar)])} fill={G.wallFoot} />
      <path d={quad([P(x1, -h, zFar), P(x1, -h, zFar - GARAGE.post), P(x1, 0, zFar - GARAGE.post), P(x1, 0, zFar)])} fill={G.wallFoot} />
    </g>
  );
};
const GarageFront: React.FC<{ cam: TrackCam }> = ({ cam }) => {
  const P = (x: number, y: number, zz: number) => project(cam, x, y, zz);
  const { zNear, zFar, x1, len, h, door, post } = GARAGE;
  const x0 = x1 - len;
  const jamb = 0.4 * M;
  const lintel = door + 0.08 * M;
  return (
    <g>
      {/* review 3: a pit box open to the track (the car is seen inside, in the dark bay, and rolls out of its right
          end): the cream fascia over the opening with the team stripe, the door frame posts at both ends (the right one
          the exit), the rolled-up door's drum over the exit, the roof slab with its lit front edge */}
      <path d={quad([P(x0, -h, zNear), P(x1, -h, zNear), P(x1, -lintel, zNear), P(x0, -lintel, zNear)])} fill={G.wall} />
      <path d={quad([P(x0, -lintel - 0.12 * M, zNear), P(x1 - jamb, -lintel - 0.12 * M, zNear), P(x1 - jamb, -lintel, zNear), P(x0, -lintel, zNear)])} fill={G.trim} />
      <path d={quad([P(x0, -h, zNear), P(x0 + jamb, -h, zNear), P(x0 + jamb, 0, zNear), P(x0, 0, zNear)])} fill={G.wall} />
      <path d={quad([P(x1 - jamb, -h, zNear), P(x1, -h, zNear), P(x1, 0, zNear), P(x1 - jamb, 0, zNear)])} fill={G.wall} />
      <path d={quad([P(x1 - jamb, -h, zNear), P(x1 - jamb * 0.78, -h, zNear), P(x1 - jamb * 0.78, 0, zNear), P(x1 - jamb, 0, zNear)])} fill={G.wallFoot} />
      <path d={quad([P(x1, -h, zNear), P(x1, -h, zNear + post), P(x1, 0, zNear + post), P(x1, 0, zNear)])} fill={mixHex(G.wallFoot, G.inside, 0.35)} />
      <path d={quad([P(x1, -door - 0.32 * M, zNear + post), P(x1, -door - 0.32 * M, zFar - post), P(x1, -door, zFar - post), P(x1, -door, zNear + post)])} fill={G.roof} />
      <path d={quad([P(x0 - 0.25 * M, -h - 0.22 * M, zNear - 0.35 * M), P(x1 + 0.35 * M, -h - 0.22 * M, zNear - 0.35 * M), P(x1 + 0.35 * M, -h - 0.22 * M, zFar), P(x0 - 0.25 * M, -h - 0.22 * M, zFar)])} fill={G.roof} />
      <path d={quad([P(x0 - 0.25 * M, -h - 0.22 * M, zNear - 0.35 * M), P(x1 + 0.35 * M, -h - 0.22 * M, zNear - 0.35 * M), P(x1 + 0.35 * M, -h, zNear - 0.35 * M), P(x0 - 0.25 * M, -h, zNear - 0.35 * M)])} fill={mixHex(G.roof, G.wall, 0.45)} />
    </g>
  );
};
/** the pit-exit lane: an asphalt strip from the garage that tapers into the far kerb (the blend) */
const PIT = { a: GARAGE.x1 - GARAGE.len - 2 * M, b: GARAGE.x1 + 10 * M, taper: 9 * M, zFar: 6.9 * M } as const;
const PitLane: React.FC<{ cam: TrackCam }> = ({ cam }) => {
  const P = (x: number, y: number, zz: number) => project(cam, x, y, zz);
  const z0 = TRACK.farKerb[1];
  return (
    <g>
      <path d={quad([P(PIT.a, 0, PIT.zFar), P(PIT.b, 0, PIT.zFar), P(PIT.b + PIT.taper, 0, z0), P(PIT.a, 0, z0)])} fill={mixHex(TRACK_COLOR.asphaltFar, TRACK_COLOR.grassFar, 0.12)} />
      {/* the warm light spilling out of the open end onto the lane */}
      <path d={quad([P(GARAGE.x1, 0, GARAGE.zFar - 0.4 * M), P(GARAGE.x1 + 3.2 * M, 0, GARAGE.zFar - 0.6 * M), P(GARAGE.x1 + 3.2 * M, 0, z0 + 0.1 * M), P(GARAGE.x1, 0, z0 + 0.1 * M)])} fill={COLOR.cream} opacity={0.22} />
    </g>
  );
};
/** the garage pieces' motion blur (the stage's recipe at the garage's depth); drawn only while on screen */
const useBlur = (cam: TrackCam, v: number) => {
  const id = `ocrg${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const sx = Math.min(44, 0.15 * Math.abs(v) * laneK(cam, GARAGE.zNear)) + (3.2 * cam.k * GARAGE.zNear) / (cam.D + GARAGE.zNear);
  const def = (
    <filter id={id} filterUnits="userSpaceOnUse" x={-500} y={-300} width={2080} height={2600} colorInterpolationFilters="sRGB">
      <feGaussianBlur stdDeviation={`${sx.toFixed(3)} ${(0.4 * sx).toFixed(3)}`} />
    </filter>
  );
  return { def, url: `url(#${id})` };
};

// --- the grandstand close behind the far fence (director review 1: "the top is a crowd watching, not empty sky") ----
// One long card stand at STAND.z, just past the catch fence: a parapet, three rows of picture-book fans (a head, a body
// in a crowd tone, a few waving a scarf), the roof on pillars. Drawn over the stage (it is a child), so it is clipped
// below at the tyre wall's top line, and the stage's fence and marshal posts (both nearer) are drawn again over it
// with the stage's own recipe (colours, haze by depth, blur). Every fan is seeded by its seat (world x, row): a truck
// moves them, nothing re-deals. Pillars every 8 m: >= 3x the truck's step at that depth.
const STAND = { z: 11.8 * M, parapet: 1.4 * M, row: 1.75 * M, rows: 3, seat: 1.1 * M, fan: 1.65, roofY: 7.0 * M, roofT: 0.6 * M, pillar: 16 * M } as const;
const SKIN = ["#EBCDAE", "#D2A27F", "#A8775A", "#7E5640", "#F1DCC4"];
const HAIR = ["#5A4436", "#3F332C", "#8A6446", "#C9A37A", "#2F2925"];
const hash = (n: number) => {
  const s0 = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s0 - Math.floor(s0);
};
const fogOf = (zz: number) => (zz > 0 ? 0.62 * (1 - Math.exp(-zz / (26 * M))) : 0);
const hzOf = (col: string, zz: number) => mixHex(col, SKY.haze, fogOf(zz));
/** the stage's blur recipe at depth z (motion blur from the truck + depth of field off the subject lane) */
const stageBlur = (cam: TrackCam, v: number, zz: number) => {
  const mb = Math.min(44, 0.15 * Math.abs(v) * laneK(cam, zz));
  const dof = (3.2 * cam.k * Math.abs(zz)) / (cam.D + zz);
  return { sx: mb + dof, sy: dof };
};
const f2 = (n: number) => n.toFixed(2);

const Grandstand: React.FC<{ cam: TrackCam; v: number; S: number; quiet: number }> = ({ cam, v, S, quiet }) => {
  const uid = `ocrs${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const Z = STAND.z;
  const s = laneK(cam, Z);
  const P = (x: number, h: number, zz = Z) => project(cam, x, -h, zz);
  // review 2: hazed toward the stand's own colour (more in the close, `quiet` 1 -> 0 over the pull-out) so it sits back
  const hz = (col: string) => mixHex(mixHex(hzOf(col, Z), SKY.haze, 0.15), TRACK_COLOR.stand, lerp(0.38, 0.62, quiet));
  // visible world x at the stand's depth (+ margin)
  const half = (540 + 120) / s;
  const xa = cam.x - half;
  const xb = cam.x + half;
  // the clip: everything above the tyre wall's top line
  const tz = TRACK.tyreWall;
  const tyreTop = laneGroundY(cam, tz) - TRACK.tyreRows * TRACK.tyreH * laneK(cam, tz);
  const b = stageBlur(cam, v, Z);
  const yTop = P(0, STAND.roofY + STAND.roofT)[1];
  const yFoot = P(0, 0)[1];
  const X = (x: number) => P(x, 0)[0];
  const Y = (h: number) => P(0, h)[1];
  // rows of fans, back row first (each row's bodies overlap the bench behind)
  const fans: React.ReactNode[] = [];
  for (let r = STAND.rows - 1; r >= 0; r--) {
    const base = STAND.parapet + r * STAND.row;
    const i0 = Math.floor(xa / STAND.seat) - 1;
    const i1 = Math.ceil(xb / STAND.seat) + 1;
    for (let i = i0; i <= i1; i++) {
      const h1 = hash(i * 1.37 + r * 91.3);
      if (h1 < 0.14) continue; // an empty seat
      const h2 = hash(i * 2.71 + r * 57.1);
      const h3 = hash(i * 4.13 + r * 33.7);
      const wx = (i + 0.5 + (h2 - 0.5) * 0.36) * STAND.seat;
      const cx = X(wx);
      const tall = (0.9 + 0.2 * h3) * STAND.fan;
      const bw = 0.52 * STAND.fan * M * s;
      const bodyTop = Y(base + 0.5 * M * tall);
      const bodyBot = Y(base);
      const hr = 0.22 * STAND.fan * M * s;
      const sway = Math.sin(S * 0.21 + h2 * 40) * 0.05 * M * s;
      const hy = Y(base + 0.5 * M * tall + 0.2 * STAND.fan * M);
      const shirt = TRACK_COLOR.crowd[Math.floor(h2 * 6) % 6];
      const skin = SKIN[Math.floor(h3 * 5) % 5];
      const hair = HAIR[Math.floor(h1 * 5) % 5];
      const waving = h3 > 0.92;
      const wave = Math.sin(S * 0.42 + h1 * 30);
      fans.push(
        <g key={`${r}_${i}`}>
          <rect x={f2(cx - bw / 2 + sway * 0.5)} y={f2(bodyTop)} width={f2(bw)} height={f2(bodyBot - bodyTop + 0.1 * M * s)} rx={f2(bw * 0.42)} fill={hz(shirt)} />
          {waving ? (
            <path
              d={`M${f2(cx + bw * 0.35)} ${f2(bodyTop + hr * 0.4)}L${f2(cx + bw * 0.55 + wave * hr * 0.9)} ${f2(hy - hr * 2.4)}`}
              stroke={hz(skin)}
              strokeWidth={f2(Math.max(1, 0.1 * M * s))}
              strokeLinecap="round"
            />
          ) : null}
          {waving ? (
            <path
              d={`M${f2(cx + bw * 0.55 + wave * hr * 0.9)} ${f2(hy - hr * 2.4)}l${f2(hr * 2.2)} ${f2(hr * (0.3 + 0.4 * wave))}l${f2(-hr * 0.1)} ${f2(hr * 0.9)}l${f2(-hr * 2.1)} ${f2(-hr * (0.2 + 0.4 * wave))}Z`}
              fill={hz([TRACK_COLOR.tyreRed, COLOR.cream, TRACK_COLOR.boothRoof][Math.floor(h1 * 3) % 3])}
            />
          ) : null}
          <circle cx={f2(cx + sway)} cy={f2(hy)} r={f2(hr)} fill={hz(skin)} />
          <path d={`M${f2(cx + sway - hr)} ${f2(hy - hr * 0.05)}A${f2(hr)} ${f2(hr)} 0 0 1 ${f2(cx + sway + hr)} ${f2(hy - hr * 0.05)}Z`} fill={hz(hair)} />
        </g>,
      );
    }
  }
  const rowBands = Array.from({ length: STAND.rows }, (_, r) => {
    const base = STAND.parapet + r * STAND.row;
    return <rect key={`b${r}`} x={-100} y={f2(Y(base + STAND.row))} width={1280} height={f2(Y(base) - Y(base + STAND.row))} fill={hz(r % 2 ? TRACK_COLOR.seatsB : TRACK_COLOR.seatsA)} />;
  });
  const pillars: React.ReactNode[] = [];
  for (let n = Math.floor(xa / STAND.pillar) - 1; n <= Math.ceil(xb / STAND.pillar) + 1; n++) {
    const px = X(n * STAND.pillar + 3 * M);
    pillars.push(<rect key={`p${n}`} x={f2(px)} y={f2(yTop)} width={f2(0.32 * M * s)} height={f2(Y(STAND.parapet) - yTop)} fill={hz(TRACK_COLOR.standShade)} />);
  }
  // the stage's catch fence and marshal posts, again over the stand (same recipe as trackWorld's)
  const fz = TRACK.fence;
  const fs = laneK(cam, fz);
  const fTop = P(0, TRACK.fenceH, fz)[1];
  const fBase = laneGroundY(cam, fz);
  const fb = stageBlur(cam, v, fz);
  const fencePosts: React.ReactNode[] = [];
  {
    const h0 = (540 + 300) / fs;
    for (let n = Math.floor((cam.x - h0) / TRACK.fencePost) - 1; n <= Math.ceil((cam.x + h0) / TRACK.fencePost) + 1; n++) {
      const x0 = P(n * TRACK.fencePost, 0, fz)[0];
      const w = 0.1 * M * fs;
      fencePosts.push(
        <g key={`fp${n}`}>
          <rect x={f2(x0)} y={f2(fTop - 0.1 * M * fs)} width={f2(w)} height={f2(fBase - fTop + 0.1 * M * fs)} fill={hzOf(TRACK_COLOR.fence, fz)} />
          <rect x={f2(x0)} y={f2(fTop - 0.1 * M * fs)} width={f2(Math.max(0.8, w * 0.35))} height={f2(fBase - fTop + 0.1 * M * fs)} fill={hzOf(TRACK_COLOR.fenceLit, fz)} />
        </g>,
      );
    }
  }
  const mz = TRACK.marshal;
  const ms = laneK(cam, mz);
  const mb = stageBlur(cam, v, mz);
  const marshals: React.ReactNode[] = [];
  {
    const L = 46 * M;
    const h0 = (540 + 300) / ms;
    for (let n = Math.floor((cam.x - h0) / L) - 1; n <= Math.ceil((cam.x + h0) / L) + 1; n++) {
      const wx = n * L + 20 * M;
      const [x0, y0] = P(wx, 0, mz);
      const bw = 1.5 * M * ms;
      const bh = 2.1 * M * ms;
      const pole = 3.4 * M * ms;
      const wave = Math.sin(S * 0.45 + wx * 0.001);
      const fy = y0 - pole;
      const fl = 0.9 * M * ms;
      const ax = x0 + bw * 1.27;
      marshals.push(
        <g key={`m${n}`}>
          <rect x={f2(x0)} y={f2(y0 - bh)} width={f2(bw)} height={f2(bh)} fill={hzOf(TRACK_COLOR.booth, mz)} />
          <rect x={f2(x0 + bw * 0.2)} y={f2(y0 - bh * 0.78)} width={f2(bw * 0.6)} height={f2(bh * 0.3)} fill={hzOf(TRACK_COLOR.standShade, mz)} />
          <rect x={f2(x0 - bw * 0.08)} y={f2(y0 - bh - 0.18 * M * ms)} width={f2(bw * 1.16)} height={f2(0.2 * M * ms)} fill={hzOf(TRACK_COLOR.boothRoof, mz)} />
          <rect x={f2(x0 + bw * 1.25)} y={f2(fy)} width={f2(Math.max(1, 0.05 * M * ms))} height={f2(pole)} fill={hzOf(TRACK_COLOR.fence, mz)} />
          <path
            d={`M${f2(ax)} ${f2(fy)} C${f2(ax + fl * 0.4)} ${f2(fy - fl * 0.12 * wave)} ${f2(ax + fl * 0.7)} ${f2(fy + fl * 0.12 * wave)} ${f2(ax + fl)} ${f2(fy + fl * 0.04 * wave)} L${f2(ax + fl)} ${f2(fy + fl * 0.6 + fl * 0.04 * wave)} C${f2(ax + fl * 0.7)} ${f2(fy + fl * 0.6 + fl * 0.12 * wave)} ${f2(ax + fl * 0.4)} ${f2(fy + fl * 0.6 - fl * 0.12 * wave)} ${f2(ax)} ${f2(fy + fl * 0.6)} Z`}
            fill={hzOf(TRACK_COLOR.boothRoof, mz)}
          />
        </g>,
      );
    }
  }
  const filt = (id: string, bb: { sx: number; sy: number }) => (
    <filter id={id} filterUnits="userSpaceOnUse" x={-500} y={-300} width={2080} height={2600} colorInterpolationFilters="sRGB">
      <feGaussianBlur stdDeviation={`${bb.sx.toFixed(3)} ${bb.sy.toFixed(3)}`} />
    </filter>
  );
  if (yFoot < -50) return null;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={-100} y={-400} width={1280} height={f2(tyreTop + 400)} />
        </clipPath>
        {filt(`${uid}s`, b)}
        {filt(`${uid}f`, fb)}
        {filt(`${uid}m`, mb)}
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <g filter={`url(#${uid}s)`}>
          {/* the back wall in shade, the benches, the fans, the parapet with its red trim, pillars, the roof */}
          <rect x={-100} y={f2(yTop)} width={1280} height={f2(yFoot - yTop)} fill={hz(TRACK_COLOR.standShade)} />
          {rowBands}
          {fans}
          <rect x={-100} y={f2(Y(STAND.parapet))} width={1280} height={f2(yFoot - Y(STAND.parapet) + 2)} fill={hz(TRACK_COLOR.stand)} />
          <rect x={-100} y={f2(Y(STAND.parapet * 0.78))} width={1280} height={f2(Y(STAND.parapet * 0.62) - Y(STAND.parapet * 0.78))} fill={hz(TRACK_COLOR.kerbRed)} />
          {pillars}
          <rect x={-100} y={f2(yTop)} width={1280} height={f2(Y(STAND.roofY) - yTop)} fill={hz(TRACK_COLOR.standRoof)} />
          <rect x={-100} y={f2(yTop)} width={1280} height={f2(Math.max(1, 0.12 * M * s))} fill={hz(TRACK_COLOR.checkCream)} />
          <rect x={-100} y={f2(Y(STAND.roofY))} width={1280} height={f2(Math.max(1, 0.25 * M * s))} fill={hz(mixHex(TRACK_COLOR.standShade, COLOR.shadow, 0.3))} opacity={0.6} />
        </g>
        <g filter={`url(#${uid}f)`}>
          <rect x={-100} y={f2(fTop)} width={1280} height={f2(fBase - fTop)} fill={hzOf(TRACK_COLOR.mesh, fz)} opacity={0.3} />
          {[1, 0.55, 0.08].map((h, i) => (
            <rect key={i} x={-100} y={f2(P(0, TRACK.fenceH * h, fz)[1])} width={1280} height={f2(Math.max(1, 0.045 * M * fs))} fill={hzOf(TRACK_COLOR.fence, fz)} />
          ))}
          {fencePosts}
        </g>
        <g filter={`url(#${uid}m)`}>{marshals}</g>
      </g>
    </g>
  );
};

// --- life ---------------------------------------------------------------------------------------------------------
/** the plain cars: full card tones (dimming toward board sank them into the asphalt, ~1.1:1); the cream body and amber keep the WildCar the subject */
const FIELD_DIM = 0;
/** review 2: local dark BODY tones (rulesShared's CAR_TONES has none and its tone prop takes only its keys): each plain
 *  car is drawn in its card tone, then again recoloured to a deep tone (a per-channel gain, base tone -> deep tone),
 *  masked off its tyres and helmet so the rims and the driver's helmet keep their own colours. */
const DEEP_TONE: Partial<Record<CarTone, string>> = { denim: "#4C586C", terracotta: "#94523B", sage: "#4D5E3F" };
const BASE_TONE: Record<string, string> = { denim: "#8C94A0", terracotta: "#C98A6C", sage: "#A3A77A" };
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const gainOf = (t: CarTone) => {
  const a = rgb(BASE_TONE[t]);
  const b = rgb(DEEP_TONE[t] as string);
  return a.map((v, i) => Math.min(1, b[i] / v));
};
/** the WildCar's driver helmet; the fan's turn (deg / frame: fast enough that the kit blurs its blades) */
const WILD_DRIVER = "#C47B5A";
const FAN_SPEED = 34;
/** a car at speed: a small fast bob of the body on its tyres (world px), seeded per car */
const bobAt = (f: number, seed: number) => 0.012 * M * (0.5 + 0.5 * kartJitter(f, seed, 1).bob / 2.6);

const OneCarRunsAway: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const vCam = camAt(f + 0.5).x - camAt(f - 0.5).x;
  const xw = wildX(f);
  const zw = wildZ(f);
  const garageOn = project(cam, GARAGE.x1 + 0.4 * M, 0, GARAGE.zNear)[0] > -40;
  const pitOn = project(cam, PIT.b + PIT.taper, 0, TRACK.farKerb[1])[0] > -40;
  const blur = useBlur(cam, vCam);
  const deepId = `ocrd${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  return (
    <TrackStage S={f} cam={cam} v={vCam}>
      <defs>
        {blur.def}
        {(Object.keys(DEEP_TONE) as CarTone[]).map((t) => {
          const g = gainOf(t);
          return (
            <filter key={t} id={`${deepId}${t}`} colorInterpolationFilters="sRGB">
              <feComponentTransfer>
                <feFuncR type="linear" slope={g[0]} />
                <feFuncG type="linear" slope={g[1]} />
                <feFuncB type="linear" slope={g[2]} />
              </feComponentTransfer>
            </filter>
          );
        })}
      </defs>
      <Grandstand cam={cam} v={vCam} S={f} quiet={1 - ss(PULL[0], PULL[1], f)} />
      {pitOn ? <PitLane cam={cam} /> : null}
      {garageOn ? <g filter={blur.url}><GarageBack cam={cam} /></g> : null}
      {/* far to near: the cars sorted by depth */}
      {[
        ...FIELD.map((c, i) => {
          const x = fieldX(c, f);
          const v = fieldX(c, f + 0.5) - fieldX(c, f - 0.5);
          const kz = laneK(cam, c.z);
          const bob = bobAt(f, c.seed);
          const car = (shadow: boolean) => <CardCar x={x} y={0} k={kz} tone={c.tone} dim={FIELD_DIM} driver={c.driver} wheelSpin={x} wheelSpeed={v} bob={bob} shadow={shadow} />;
          const mid = `${deepId}m${i}`;
          const tr = CAR.tyreR * M * 1.04;
          return { z: c.z, node: (
            <OnLane key={`f${i}`} cam={cam} z={c.z}>
              {car(true)}
              <mask id={mid} maskUnits="userSpaceOnUse" x={x - 5 * M} y={-5 * M} width={10 * M} height={6 * M}>
                <rect x={x - 5 * M} y={-5 * M} width={10 * M} height={6 * M} fill="white" />
                <circle cx={x + CAR.rearAxle * M} cy={-CAR.tyreR * M} r={tr} fill="black" />
                <circle cx={x + CAR.frontAxle * M} cy={-CAR.tyreR * M} r={tr} fill="black" />
                <circle cx={x + CAR.helmet[0] * M} cy={-CAR.helmet[1] * M - bob} r={CAR.helmetR * M * 1.08} fill="black" />
              </mask>
              <g mask={`url(#${mid})`}>
                <g filter={`url(#${deepId}${c.tone})`}>{car(false)}</g>
              </g>
            </OnLane>
          ) };
        }),
        { z: zw, node: (
          <OnLane key="w" cam={cam} z={zw}>
            <WildCar x={xw} y={0} k={laneK(cam, zw)} amberBand={amberBandFor(planeCam(cam, zw))} tone="cream" driver={WILD_DRIVER} wing={1} wing2={1} fan={1} wheels={1} fanSpin={FAN_SPEED * f} fanSpeed={FAN_SPEED} wheelSpin={xw} wheelSpeed={vWild(f)} bob={bobAt(f, 0.4)} />
          </OnLane>
        ) },
        ...(garageOn ? [{ z: GARAGE.zNear, node: <g key="gf" filter={blur.url}><GarageFront cam={cam} /></g> }] : []),
      ]
        .sort((a, b) => b.z - a.z)
        .map((e) => e.node)}
    </TrackStage>
  );
};

export default OneCarRunsAway;

/** for the probe scripts */
export const debugAt = (f: number) => {
  const cam = camAt(f);
  const box = (x: number, zz: number, e: { rear: number; nose: number }) => {
    const kz = laneK(cam, zz);
    const [rx] = project(cam, x + e.rear * M, 0, zz);
    const [nx] = project(cam, x + e.nose * M, 0, zz);
    return { rx, nx, gy: laneGroundY(cam, zz), len: nx - rx, kz };
  };
  return { cam, wild: box(wildX(f), wildZ(f), WILD_EXT), field: FIELD.map((c) => box(fieldX(c, f), c.z, CARD_EXT)), v: vWild(f) };
};

// --- load-time checks (the self-audit: throw on a regression) ---------------------------------------------------------
const CHECKS = true;
(() => {
  if (!CHECKS) return;
  const fail = (m: string) => {
    throw new Error(`OneCarRunsAway: ${m}`);
  };
  const ext = (x: number, e: { rear: number; nose: number }) => [x + e.rear * M, x + e.nose * M] as const;
  for (let f = 0; f < DURATION; f += 0.25) {
    // the depth order of the WildCar and a plain car flips only while they are clear of each other along the track
    for (const c of FIELD) {
      if (Math.sign(wildZ(f) - c.z) !== Math.sign(wildZ(f + 0.25) - c.z)) {
        const [w0, w1] = ext(wildX(f), WILD_EXT);
        const [c0, c1] = ext(fieldX(c, f), CARD_EXT);
        if (w0 < c1 + 0.3 * M && c0 < w1 + 0.3 * M) fail(`the WildCar crosses a plain car's lane while beside it at f${f}`);
      }
    }
    // it steers out in front of the garage's near wall only once its tail is out of the door
    if (wildZ(f) > GARAGE.zNear && wildZ(f + 0.25) <= GARAGE.zNear && ext(wildX(f), WILD_EXT)[0] < GARAGE.x1 + 0.3 * M) fail(`the tail is still in the garage at f${f}`);
  }
  for (let f = 0; f < DURATION; f++) {
    const d = debugAt(f);
    // every car rolls forward; the camera's truck stays where trackWorld's patterns read (period >= 3x the step)
    if (vWild(f) <= 0 || FIELD.some((c) => fieldX(c, f + 0.5) - fieldX(c, f - 0.5) <= 0)) fail(`a car rolls backward at f${f}`);
    const vc = camAt(f + 0.5).x - camAt(f - 0.5).x;
    if (vc > 2 * TRACK.kerbBlock / 3.5) fail(`the truck is ${vc.toFixed(0)} world px/f at f${f}`);
    // the WildCar whole and inside the keep-in box's sides once it is out of the garage
    if (f >= 12 && (d.wild.rx < 65 || d.wild.nx > 1015)) fail(`the WildCar leaves the keep-in box at f${f}`);
  }
  // same-lane plain cars never touch
  for (let f = 0; f < DURATION; f += 0.5)
    for (const c of FIELD)
      for (const d of FIELD)
        if (c !== d && c.z === d.z && fieldX(c, f) > fieldX(d, f) && fieldX(c, f) + CARD_EXT.rear * M < fieldX(d, f) + CARD_EXT.nose * M + 0.1 * M) fail(`two plain cars touch at f${f}`);
  // the WildCar's lead over the field's front car never shrinks once the pack is back in frame (f86 on; the bunching
  // reshuffle, nearest car to the front, happens off frame f58-84)
  for (let f = 86; f < DURATION; f++) {
    const lead = (g: number) => wildX(g) - Math.max(...FIELD.map((c) => fieldX(c, g)));
    if (lead(f + 1) < lead(f) - 0.25 * M) fail(`the field closes the gap at f${f}`);
  }
  // review 4: the empty track grows on screen every frame from f86; the resolved wide (f120 on): WildCar >= 330 px,
  // its nose >= 60 px inside the right edge, >= 200 px of the lead plain car in frame, the gap >= 380 px
  const gapAt = (f: number) => {
    const d = debugAt(f);
    return d.wild.rx - d.field[0].nx;
  };
  for (let f = 87; f < DURATION; f++) if (gapAt(f) <= gapAt(f - 1)) fail(`the gap stops growing at f${f}`);
  for (let f = 120; f < DURATION; f++) {
    const d = debugAt(f);
    if (d.wild.len < 330) fail(`the WildCar is ${d.wild.len.toFixed(0)} px at f${f}`);
    if (d.wild.nx > 1020) fail(`the WildCar's nose is at x ${d.wild.nx.toFixed(0)} at f${f}`);
    if (d.field[0].nx < 200) fail(`under 200 px of the lead plain car in frame at f${f}`);
    if (gapAt(f) < 380) fail(`the gap is under 380 px at f${f}`);
  }
})();
