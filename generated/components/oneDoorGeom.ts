import { CAM_LIFT, FRAME_H, FRAME_W, camFromTrack, glideTargetAt, runFollower, smoothstep } from "./chinatalkShared";
import type { Cam, Glide } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// oneDoorGeom -- the world, the clocks and the camera of OneDoor (Jordan
// Schneider "Hu Jintao's 25 million jobs", graphic B take 2). Pure maths, no
// React. World px, y grows down. The wall's centre line is y = 0, the door's
// column is x = 0. S is the cut's local frame (edit frame - IN).
// ---------------------------------------------------------------------------

export const FPS = 24;
/** edit frame of the slot's first frame (words.tsv: "you" 1175 -> local 7) */
export const IN = 1168;
/** the slot exactly; the edit cuts back to the speaker at 144 */
export const DURATION = 144;

// --- the world (sizes are WORLD px = screen px in the final k = 1 frame) -------
/** lane pitch = row pitch (WORD_PX, = 3 dot radii) */
export const PITCH = 36;
/** a person: as wide as the wall is thick (the kit's DOT_R 11.5, a size up) */
export const R_DOT = 13;
/** the wall: 7.5 x INK_W (26.25), to the whole px */
export const WALL_T = 26;
/** the door: one lane pitch, so a dot passes with 5 px of air each side */
export const DOOR_W = PITCH;
/** the two posts on the far side: as thick as the wall, 2.5 pitches tall */
export const POST_T = WALL_T;
export const POST_H = 90;
/** the first dot of every standing lane touches the wall (at the surge's press) */
export const ROW0_Y = WALL_T / 2 + R_DOT;

// --- the one line that moves ---------------------------------------------------
/** frames per dot through the door (2 dots a second) */
export const DOT_PERIOD = 12;
/** the queue's constant shuffle below the wall, world px / frame */
export const QUEUE_V = PITCH / DOT_PERIOD;
/** past the wall a dot is free: twice the queue's speed */
export const FREE_V = 2 * QUEUE_V;
/** frames of the acceleration from QUEUE_V to FREE_V (a smoothstep in speed); the
 *  dot covers ACC_F x the mean speed = one lane pitch meanwhile */
export const ACC_F = (2 * PITCH) / (QUEUE_V + FREE_V);
/** the frame on which door-lane dot j's centre is on the wall's centre line (j
 *  grows down the lane, any integer; dot 0 is on the line on frame 0) */
export const crossF = (j: number) => j * DOT_PERIOD;
/** speed of a door-lane dot t frames after its centre crossed the line */
export const fileSpeed = (t: number) => QUEUE_V + (FREE_V - QUEUE_V) * smoothstep(t / ACC_F);
/** how far past the line its centre is t frames after crossing (negative before):
 *  the integral of fileSpeed */
export const pastLine = (t: number) => {
  if (t <= 0) return QUEUE_V * t;
  if (t >= ACC_F) return PITCH + FREE_V * (t - ACC_F);
  const u = t / ACC_F;
  return QUEUE_V * t + (FREE_V - QUEUE_V) * ACC_F * (u * u * u - (u * u * u * u) / 2);
};
/** centre y of door-lane dot j on frame S */
export const fileY = (j: number, S: number) => -pastLine(S - crossF(j));
/** the door-lane dots whose discs can touch the world span [yTop, yBot] on frame S */
export const fileRange = (yTop: number, yBot: number, S: number) => {
  const tMax = ACC_F + Math.max(0, R_DOT - yTop - PITCH) / FREE_V;
  return {
    jTop: Math.floor((S - tMax) / DOT_PERIOD),
    jBot: Math.ceil((S + Math.max(0, yBot + R_DOT) / QUEUE_V) / DOT_PERIOD),
  };
};

// --- the standing crowd presses: one slow surge along the lanes -----------------
/** A travelling wave that rolls from the back of the crowd to the wall: every
 *  dot of row j moves along its lane only, the whole row together, between its
 *  pressed place (0) and SURGE_A behind it. Row 0 touches the wall at the press
 *  (frames 0, 48, 96, 144) and never enters it. */
export const SURGE_A = 3;
export const SURGE_PERIOD = 48;
export const SURGE_ROWS = 10;
export const surgeY = (j: number, S: number) =>
  (SURGE_A / 2) * (1 - Math.cos(2 * Math.PI * (S / SURGE_PERIOD + j / SURGE_ROWS)));

// --- the camera: ONE pull-back, centred on the door's column -------------------
/** A straight pull-back is a zoom about one fixed screen point. The wall sits at
 *  mid-frame (y 960) at k 3.4 and at y 480 at k 1, so its screen y is linear in
 *  k: 280 + 200 k (the fixed point is screen y 280, on the file above the door). */
export const K_OPEN = 3.4;
export const K_END = 1;
export const WALL_Y_OPEN = FRAME_H / 2;
export const WALL_Y_END = 480;
const WALL_SLOPE = (WALL_Y_OPEN - WALL_Y_END) / (K_OPEN - K_END);
export const wallScreenY = (k: number) => WALL_Y_END + WALL_SLOPE * (k - K_END);
/** the LOOK (kit convention: it lands at screen y 835) that puts the wall there */
const lookAtK = (k: number): Cam => ({ x: 0, y: (FRAME_H / 2 - wallScreenY(k)) / k - CAM_LIFT / k, k });

/** the keyed track is ln k only: one long eased glide that is already under way
 *  on frame 0 (K_START is solved so the follower reads k 3.400 there), then a
 *  slow creep that takes over before the glide has stopped (k 1.000 at f143) */
const K_START = 3.7142;
export const GLIDES: Glide[] = [
  { f0: -28, f1: 122, k: 1.018 },
  { f0: 104, f1: 184, k: 0.975 },
];
export const kTargetAt = (f: number) => glideTargetAt({ x: 0, y: 0, k: K_START }, GLIDES, f).k;
export const camTargetAt = (f: number): Cam => lookAtK(kTargetAt(f));
const CAM_F0 = -60;
const TRACK = runFollower(camTargetAt, CAM_F0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
/** the camera the paper's parallax is measured against (the final framing) */
export const REST_CAM: Cam = camAt(DURATION - 1);

/** The world box on screen under `cam`, grown by `pad` SCREEN px (the house sway
 *  is +-5 px, the paper shadow reaches 12 px): what has to be drawn. */
export const viewBounds = (cam: Cam, pad = 48) => ({
  x0: cam.x - (FRAME_W / 2 + pad) / cam.k,
  x1: cam.x + (FRAME_W / 2 + pad) / cam.k,
  y0: cam.y - (FRAME_H / 2 + pad) / cam.k,
  y1: cam.y + (FRAME_H / 2 + pad) / cam.k,
});
