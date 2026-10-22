// ---------------------------------------------------------------------------
// rodentFolkMarmot: the picture-book marmot of RodentFromCentralAsia (kyle-pandemics, cut 1; V3 cast take 2): the
// gouache drawing of pandemicFolkAnimals (folkMarmot) standing on its burrow in the cut's one camera. It is drawn in
// 2D at the screen point of its feet (toScreen), at the camera's scale there (~39.5 world px tall), over the 3D
// burrow layer (rodentSteppe3D), with a soft contact shadow on the mound. Its life is the cut's (headAt, unchanged):
// it sniffs, turns its head to the camera (f22-36), blinks (f47), nods, turns away west again (f56-70); it breathes,
// leans a hair, flicks its tail; its belly and arms slide a little with the camera's arc round it. Once it is smaller
// than ~24 px it hands over to the cream mark (markAt), as before.
// ---------------------------------------------------------------------------
import React from "react";
import { FolkLayer, MARMOT_H, folkMarmot, type MarmotPose } from "./pandemicFolkAnimals";
import { AWAY, MARMOT, RIGHT, moundY, toScreen, type Cam } from "./rodentCamera";
import { headAt, markAt } from "./rodentSteppe3D";

/** its height in world px (the V2/V3 marmot's, so the framing and the mark hold) */
const H_WORLD = 39.5;
/** the way it faces (horizontal, map axes): toward the f0 camera and the west, as before */
const FWD: [number, number] = (() => {
  const v = [-0.75 * AWAY[0] - 0.66 * RIGHT[0], -0.75 * AWAY[1] - 0.66 * RIGHT[1]];
  const l = Math.hypot(v[0], v[1]);
  return [v[0] / l, v[1] / l];
})();
const WEST: [number, number] = [-RIGHT[0], -RIGHT[1]];
/** the screen yaw of a horizontal direction d (map x, map y) seen from the camera: 0 = toward the camera, - = to
 *  screen left */
const screenYaw = (cam: Cam, d: [number, number]) => {
  const right = d[0] * cam.r[0] + d[1] * cam.r[2];
  const toward = -(d[0] * cam.f[0] + d[1] * cam.f[2]);
  return Math.atan2(right, toward);
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** where its feet stand (world: map x, height, map y): on its seat on the heap. The 3D burrow layer is split by a
 *  vertical plane through here facing the camera (rodentSteppe3D part far / near), so the earth in front of it
 *  (the heap's crest) covers its feet and what lies behind stays behind it. */
export const MARMOT_FEET: [number, number, number] = [MARMOT.at[0] + FWD[0] * 2, moundY(MARMOT.at[0] + FWD[0] * 2, MARMOT.at[1] + FWD[1] * 2) - 0.6, MARMOT.at[1] + FWD[1] * 2];

export const marmotPoseAt = (cam: Cam, frame: number): MarmotPose => {
  const hd = headAt(frame);
  const bodyYaw = screenYaw(cam, FWD);
  const westYaw = clamp(screenYaw(cam, WEST), -1.35, 1.35);
  const yaw = westYaw + (0 - westYaw) * hd.turn;
  const flick = (f0: number) => Math.max(0, Math.sin(Math.max(0, Math.min(1, (frame - f0) / 10)) * Math.PI));
  return {
    turn: clamp(yaw / 1.25, -1, 1),
    body: clamp(bodyYaw / 1.25, -1, 1) * 0.7,
    nod: hd.nod,
    sniff: hd.sniff,
    sniffPh: frame * 2.3,
    blink: hd.blink,
    breath: 1 + 0.012 * Math.sin(frame / 6.5),
    lean: ((1.2 * Math.sin(frame / 21) + 0.5 * Math.sin(frame / 9.3)) * Math.PI) / 180,
    tail: (9 * flick(14) + 7 * flick(62)) * (Math.PI / 180) * 1.6,
  };
};

export const FolkMarmot: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const op = 1 - markAt(cam);
  if (op <= 0.002) return null;
  const feet = toScreen(cam, MARMOT_FEET[0], MARMOT_FEET[1], MARMOT_FEET[2]);
  const s = (feet.s * H_WORLD) / MARMOT_H;
  const pose = marmotPoseAt(cam, frame);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id="rfm-cs">
          <stop offset="0" stopColor="#22180F" stopOpacity={0.42} />
          <stop offset="0.6" stopColor="#22180F" stopOpacity={0.24} />
          <stop offset="1" stopColor="#22180F" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g opacity={op}>
        <ellipse cx={feet.x + 14 * s} cy={feet.y + 4 * s} rx={82 * s} ry={20 * s} fill="url(#rfm-cs)" />
        {/* the drawing's feet sit ~14 units above its origin: set it down so they rest on (a hair into) the earth */}
        <FolkLayer uid="rfm" parts={folkMarmot(pose)} pxPerUnit={s} frame={{ x: feet.x, y: feet.y + 14 * s, a: 0, s }} />
      </g>
    </svg>
  );
};
