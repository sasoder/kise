import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { z } from "zod";

/**
 * UnderCerroGordo V2 — cut X of the Core Memory short "brent - the mine death
 * count". ONE OPAQUE, silent graphic, 1080x1920, 24000/1001 fps, 115 frames
 * (sequence frames 26-141).
 *
 * CHECK LINE: "That building sits on a shaft; 200 feet down it is a level of
 * the mine, and that is where the accident in the old newspaper happened."
 *
 * V2 IS THE APPROVED "DOWN THE SHAFT" GRAPHIC (DownTheShaft.tsx), stopping at
 * the 200 ft level, followed by the newspaper beat of V1, smaller. Everything
 * down to the landing is DownTheShaft's machinery, copied: the same drone clip,
 * the same sliced ground and lip (the original cap file), the same rock and
 * timbered shaft (the plate is the original plate's pixels down to the station,
 * see scripts/bake-under-cerro-gordo-shaft.py), the same camera curve, motion
 * blur, darkness and lamp pool, lamp glow, dust, swaying cable, grain and
 * readout. The X-ray look of V1 is gone; only its clipping, its pop, its
 * dim/blur and its highlighter are kept.
 *
 * Words (local frames; f0 = sequence frame 26):
 *   there's            0        the most           44-51
 *   the 200 level      7-19     infamous           51-62
 *   of the mine        19-28    accident           62-79
 *   And that's where   31-44    happened           79-87
 *   in Cerro Gordo's   87-99    mining history     99-112     END 115
 *
 * Beats:
 *   f0-2     the drone clip, untouched, from its first frame.
 *   f3-29    THE MOVE, one C2 curve (DownTheShaft's, retimed: 3198 px of travel
 *            instead of 10198). f3-13 the slow tilt (520 px, t^1.6): the
 *            footage slides up and the sliced ground with the shaft collar
 *            comes up under the building (the lip enters the frame at f8).
 *            f13-22 the fall (a quintic that matches position, speed and
 *            acceleration at both ends: no hitch where the tilt becomes the
 *            fall), peak 331 px a frame at f20. f22-29 the brake over the last
 *            64 ft (cubic), landing at f29 on the 200 ft station.
 *   f18.7    the readout comes in once the lip has passed the top of its
 *            numerals, already counting, over 4 frames (70 ft at f20 is the
 *            first that reads); 200 FT from f27.
 *   f29-46   the living hold: the 3 px creep, the lamp flickering, dust in its
 *            light, the cable swaying, the readout riding with the level.
 *            f33-38 the lamp lifts a little brighter and stays there.
 *   f46-56   the clipping POPS out of the lit station: scaled about the lit
 *            room 0.6 -> 1.04 (f53) -> 1.0 (f56), solid paper from its first
 *            frame, at rest centred on (540, 880), 760 px wide (160 px to each
 *            frame edge; 790 px and 144 px for the one frame of the overshoot),
 *            tilted 1.5 deg. Over the same frames everything behind it dims to
 *            72 % (toward the plate's own cool black) and softens by 5 px, and
 *            the creep slows to 0.6 px a frame. The paper covers the readout
 *            entirely from f50; the readout is taken away under it (f51-54), so
 *            the creep cannot carry its numerals out above the paper later.
 *   f62-74   the highlighter is drawn left to right across the printed
 *            headline, in the clipping's own coordinates, multiplied on the
 *            paper so the type stays black.
 *   f74-115  the clipping eases 2.6 % closer about its headline (780 px wide at
 *            f114, still moving); behind it the creep and the flicker go on.
 *
 * World: y 0 = the cut lip, 10 px = 1 ft, so the 200 ft station's floor is
 * y 2000. "Camera y" is the world y of the frame's TOP edge. The readout is the
 * depth at screen y 856, (camera y + 856) / 10 ft: that is where the station
 * floor comes to rest, with the station's roof just under the hairline, exactly
 * as DownTheShaft lands on 900.
 *
 *   frame   camera y   speed px/f   readout
 *   f0      -2054         0          (footage only)
 *   f3      -2054         4          (footage only; the move starts)
 *   f8      -1883        55          the lip enters the frame (screen y 1883)
 *   f13     -1534        84          lip at screen y 1534 (the tilt becomes the fall)
 *   f16     -1193       165          lip at screen y 1193
 *   f18      -766       264          10 ft (not yet shown)
 *   f20      -157       331          70 ft   (the fastest frame)
 *   f22       483       276          130 ft  (the brake begins)
 *   f24       896       143          180 ft
 *   f26      1085        54          190 ft
 *   f28      1139         9          200 ft
 *   f29      1144         3.2        200 ft  (landed)
 *   f46      1195         3          200 ft  (the clipping's first frame)
 *   f56      1213         0.6        (covered)
 *   f114     1248         0.6        (covered)
 *
 *   speed, px a frame, f3..f29:
 *   4, 21, 32, 40, 48, 55, 61, 67, 73, 78, 84, 97, 125, 165, 214, 264, 306,
 *   331, 326, 276, 205, 143, 93, 54, 26, 9, 3.2
 *
 * The cap slide and the sideways lock are DownTheShaft's (SLIDE, SLIDE_LOCK,
 * LOCK_K, and the clip's own measured drift, frame by frame, for as long as the
 * clip is in the frame: here to f20, easing out by f27). PLATE_PX0 is chosen so
 * that the shaft settles at screen x 432.2, where DownTheShaft's does; with the
 * shorter move that puts it at x 395 (f8, its first frame) to 418 (f17) while
 * the building is in the frame (the cupola is at x 391; DownTheShaft's shaft
 * runs from 372 to 411 there).
 *
 * Layers, back to front:
 *   A. THE SCENE (one group; from f46 it is softened as a whole)
 *      1. the world, one window: the clip, then the baked plate with its cap,
 *         the station's light map and the live cable; clip and plate each
 *         carry the move's motion blur
 *      2. darkness below ground, cut open by the pool of our own lamp
 *      3. the station lamp's glow and the dust, world space, streaked by the move
 *      4. fine grain over the cut face, new every frame
 *      5. the depth readout
 *   B. the dim (a cool black wash), from f46
 *   C. the clipping and its highlight
 */

export const FPS = 24000 / 1001;
export const DURATION = 115;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const { fontFamily } = loadFont("normal", { weights: ["500", "600"], subsets: ["latin"] });

// ---- frame and world (DownTheShaft's) ----
const W = 1080;
const H = 1920;
const GROUND = 24; // world px between the clip's last row and the lip, once the two are locked
const SLIDE = 110; // at rest the underground sits this much lower, out of frame
const SLIDE_LOCK = 500; // px of camera travel over which it closes up
const REST_Y = -(H + GROUND + SLIDE); // camera y at rest
const UNDERLAY_H = SLIDE + 24;
const UNDERLAY_STRETCH = 2.0;
const PLATE_W = 1400;
const PLATE_H = 3572;
const PLATE_Y0 = 28; // world y of the plate's first row
const CAP_Y0 = -208; // world y of the cap's first row
const CAP_H = 328;
const PLATE_PX0 = 152.67; // plate x at screen x 0 before any drift: the shaft settles at screen x 432.2, as in DownTheShaft
const LOCK_K = 0.55; // how much of the near ground's sideways drift the plate takes
const SHAFT_PX = 530; // plate x of the shaft centre
const SHAFT_HALF = 37;
const LEVEL_Y = 2000; // world y of the 200 ft station's floor
const LEVEL_FT = 200;
const LAND_CAM_Y = 1144; // camera y at the landing: the station's roof comes to rest just under the hairline
const READ_REF = LEVEL_Y - LAND_CAM_Y; // 856: the readout is the depth at this screen y, where the station floor comes to rest

// ---- timing of the move ----
const F_START = 3;
const F_DROP = 13;
const F_BRAKE = 22;
const F_LAND = 29;
const T_EASE = 520; // px travelled by f13
const P_EASE = 1.6;
const BRAKE_DIST = 640; // the last 64 ft
const CREEP = 3; // px per frame after the landing
const CREEP_SLOW = 0.6; // and once the clipping is up
const T_TOTAL = LAND_CAM_Y - REST_Y;

// ---- the newspaper beat ----
const POP_START = 46;
const POP_PEAK = 53;
const POP_END = 56;
const HL_START = 62;
const HL_END = 74;
const HOLD_START = 74;
const HOLD_SPAN = 56; // the ease runs past the last frame, so nothing has stopped at f114

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Px the creep has lost by (fractional) frame f: its speed eases from CREEP to CREEP_SLOW while the clipping pops. */
const slowed = (f: number) => {
  const n = POP_END - POP_START;
  const t = clamp01((f - POP_START) / n);
  return (CREEP - CREEP_SLOW) * (n * (t * t * t - (t * t * t * t) / 2) + Math.max(0, f - POP_END));
};

/** Px the camera has travelled down at (fractional) frame f: one C2 curve. */
const travel = (f: number) => {
  if (f <= F_START) return 0;
  if (f <= F_DROP) return T_EASE * Math.pow((f - F_START) / (F_DROP - F_START), P_EASE);
  const brake = F_LAND - F_BRAKE;
  if (f <= F_BRAKE) {
    // quintic Hermite between the ease-in and the brake: position, speed and acceleration match at both ends
    const d = F_BRAKE - F_DROP;
    const ease = F_DROP - F_START;
    const p0 = T_EASE;
    const v0 = (P_EASE * T_EASE) / ease;
    const a0 = (P_EASE * (P_EASE - 1) * T_EASE) / (ease * ease);
    const p1 = T_TOTAL + CREEP * (F_BRAKE - F_LAND) - BRAKE_DIST;
    const v1 = CREEP + (3 * BRAKE_DIST) / brake;
    const a1 = (-6 * BRAKE_DIST) / (brake * brake);
    const s = (f - F_DROP) / d;
    const s2 = s * s;
    const s3 = s2 * s;
    const s4 = s3 * s;
    const s5 = s4 * s;
    return (
      (1 - 10 * s3 + 15 * s4 - 6 * s5) * p0 +
      (s - 6 * s3 + 8 * s4 - 3 * s5) * d * v0 +
      (0.5 * s2 - 1.5 * s3 + 1.5 * s4 - 0.5 * s5) * d * d * a0 +
      (10 * s3 - 15 * s4 + 6 * s5) * p1 +
      (-4 * s3 + 7 * s4 - 3 * s5) * d * v1 +
      (0.5 * s3 - s4 + 0.5 * s5) * d * d * a1
    );
  }
  if (f <= F_LAND) return T_TOTAL + CREEP * (f - F_LAND) - BRAKE_DIST * Math.pow((F_LAND - f) / brake, 3);
  return T_TOTAL + CREEP * (f - F_LAND) - slowed(f);
};

/** World y of the frame's top edge. */
const cameraY = (f: number) => REST_Y + travel(f);

/** Px the clip itself has moved up: the underground's travel minus what it has closed up. */
const videoTravel = (f: number) => {
  const t = travel(f);
  const s = 1 - clamp01(t / SLIDE_LOCK);
  return t - SLIDE * (1 - s * s); // fastest at the start, while the edge is still below the frame
};

// Px the ground in the clip's bottom 80 rows has moved right since f0, measured
// frame by frame (phase correlation) for DownTheShaft. The cadence is the footage's own.
const DRIFT = [
  0.0, 6.2, 12.3, 15.9, 15.9, 22.0, 28.2, 31.9, 31.9, 38.0, 44.1, 44.1, 47.9, 54.0, 61.7, 61.7, 65.5, 73.2, 80.9, 80.9, 84.7,
];
const DRIFT_LOCK = DRIFT.length - 1; // f20: the clip has left the frame at f21
const DRIFT_TAIL = 7; // frames over which the sideways drift eases out (still by f27, two frames before the landing)
const DRIFT_SPEED = 4.3;

const drift = (f: number) => {
  if (f <= DRIFT_LOCK) {
    const i = Math.floor(Math.max(0, f));
    const t = Math.max(0, f) - i;
    return DRIFT[i] + (DRIFT[Math.min(DRIFT_LOCK, i + 1)] - DRIFT[i]) * t;
  }
  const s = clamp01((f - DRIFT_LOCK) / DRIFT_TAIL);
  return DRIFT[DRIFT_LOCK] + DRIFT_SPEED * DRIFT_TAIL * (s - (s * s * s - (s * s * s * s) / 2));
};

// ---- motion blur (DownTheShaft's) ----
const BLUR_PAD = 400; // the blurred window is this much taller than the frame, top and bottom
const GLOW_PAD = 760; // the lamp's window: its streak is longer
const blurSigma = (speed: number) => {
  // nearly none while the lip is the subject (under ~110 px a frame), a long shutter for the fall
  const sigma = (0.035 + 0.125 * smooth(110, 380, speed)) * speed;
  return sigma < 0.6 ? 0 : sigma;
};

// ---- the station lamp (plate x, world y), as baked ----
const GLOW_REST =
  "radial-gradient(circle closest-side, rgba(255,226,170,0.95) 0%, rgba(255,190,110,0.55) 5%, rgba(255,160,80,0.26) 16%, rgba(255,140,60,0.10) 40%, rgba(255,130,50,0.03) 70%, rgba(255,130,50,0) 100%)";
const LAMP = { x: 619, y: 1921, w: 420, h: 420, k: 0.9 };
const LAMP_LIFT = 0.26; // on "that's where" the lamp's flicker lifts by this much, and stays (the lit room ends up about 9 % brighter)
const LIFT_START = 33;
const LIFT_END = 38;

// ---- darkness and our lamp ----
const DARK = "5,8,12";
const pool = (e: number) =>
  `radial-gradient(ellipse 780px 1040px at ${458 + e}px ${860 + e}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 22%, rgba(0,0,0,0.15) 46%, rgba(0,0,0,0.40) 70%, rgba(0,0,0,0.68) 90%, rgba(0,0,0,0.80) 100%)`;

// ---- readout (DownTheShaft's) ----
const READ_LINE_Y = 742;
const READ_TOP = READ_LINE_Y - 176;
const READ_LEFT = 566;
const DIGIT_W = 78;
const WHITE = "rgba(255,255,255,0.92)";
// the (fractional) frame at which the lip has passed the top of the numerals: nothing of the readout shows before it
const F_READ = (() => {
  let lo = F_START;
  let hi = F_LAND;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (-cameraY(mid) > READ_TOP) lo = mid;
    else hi = mid;
  }
  return hi;
})();
const READ_FADE = 4;

// ---- life in the hold (DownTheShaft's) ----
// dust drifting through the lamp's light, in a box under the lamp (it wraps, so it never runs out)
const DUST_W = 380;
const DUST_H = 62;
const DUST = Array.from({ length: 26 }, (_, i) => ({
  x: random(`dust-x-${i}`) * DUST_W,
  y: random(`dust-y-${i}`) * DUST_H,
  vx: (random(`dust-vx-${i}`) - 0.5) * 2.6,
  vy: (random(`dust-vy-${i}`) - 0.6) * 0.8,
  r: 2.4 + random(`dust-r-${i}`) * 2.6,
  ph: random(`dust-ph-${i}`) * Math.PI * 2,
}));
/** The lamp's brightness, frame by frame: two slow swings and an irregular flutter, about +-9 %. */
const flicker = (f: number) => {
  const t = f / FPS;
  const n0 = random(`flick-${Math.floor(f)}`) - 0.5;
  const n1 = random(`flick-${Math.floor(f) - 1}`) - 0.5;
  return 1 + 0.045 * Math.sin(2 * Math.PI * 1.7 * t + 0.7) + 0.03 * Math.sin(2 * Math.PI * 4.1 * t + 2.1) + 0.07 * (0.65 * n0 + 0.35 * n1);
};
// the last 1036 px of the hoist cable, down to the bucket's bail, are drawn live, so it can sway (the plate carries
// it down to CABLE_Y0). Its colour runs from the cool grey the baked cable has at 90 ft to the warmer grey it has
// by 190 ft (measured on the original plate, lamp light apart, and scaled as DownTheShaft's stroke is)
const CABLE_X = 525.65;
const CABLE_Y0 = 900;
const CABLE_Y1 = LEVEL_Y - 64;
const CABLE_TOP = "rgb(68,74,74)";
const CABLE_BOTTOM = "rgb(76,75,73)";
// the lamp's own light on the 200 ft station, baked apart from the plate so it can flicker
const STATION_LIGHT_X = 110;
const STATION_LIGHT_Y = 1840;
const STATION_LIGHT_W = 1020;
const STATION_LIGHT_H = 230;

const VIDEO = staticFile("cerro/shaft/hoist_9x16.mp4");
const PLATE = staticFile("minedeath/ucg2_plate.jpg");
const CAP = staticFile("cerro/shaft/underground_cap.png");
const GRAIN = staticFile("cerro/shaft/grain_tile.png");
const STATION_LIGHT = staticFile("minedeath/ucg2_station_light.png");
const CLIPPING = staticFile("minedeath/ucg_clipping.png");
const GRAIN_W = 1216;
const GRAIN_H = 2048;

// ---- the scene behind the clipping ----
const BG = "#05080c";
const DIM_ALPHA = 0.28; // a wash of the plate's own cool black: about 72 % brightness
const SOFT_PX = 5;
const EDGE = 24; // while the scene is softened its layers reach this far past the frame, so the blur has picture to sample

// ---- the clipping (public/minedeath/ucg_clipping.png, as in V1) ----
const PAPER_W = 676; // scan px: the 662 x 634 scan plus 9/5/6/6 px of blank paper
const PAPER_H = 646;
const CLIP_PAD = 60; // transparent pad of the png round the paper (its shadow), scan px
const CLIP_W = 760; // at rest: 160 px to each frame edge
const CLIP_K = CLIP_W / PAPER_W;
const CLIP_CX = 540;
const CLIP_CY = 880;
const TILT = -1.5;
const ROOM_DY = -48; // the pop's origin: the lit room, at the lamp's x, half way up the station
const PUSH = 0.032; // x 0.81 reached at f114 = 2.6 %

// ---- the highlight, in paper px (headline measured in the scan: x 112-536, caps 20 px,
// baseline y 63 at its left end and y 60 at its right end; + the 9/6 px paper pad) ----
const HL_X0 = 114;
const HL_X1 = 552;
const HL_CY0 = 59.2; // centre of the line at its left end
const HL_CY1 = 56.4; // and at its right end
const HL_H = 26; // 1.3 x the capitals
const HL_YELLOW = "#FFEC3A";

// the marker stroke: slightly uneven top and bottom edges, soft slanted ends
const HL_PATH = (() => {
  let seed = 1897;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296 - 0.5;
  };
  const cy = (x: number) => HL_CY0 + ((HL_CY1 - HL_CY0) * (x - HL_X0)) / (HL_X1 - HL_X0);
  const n = 22;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = HL_X0 + ((HL_X1 - HL_X0) * i) / n;
    top.push(`${x.toFixed(1)},${(cy(x) - HL_H / 2 + rnd() * 1.5).toFixed(2)}`);
    bottom.push(`${x.toFixed(1)},${(cy(x) + HL_H / 2 + rnd() * 1.5).toFixed(2)}`);
  }
  const l = `Q ${(HL_X0 - 3.5).toFixed(1)},${cy(HL_X0).toFixed(2)} ${top[0]}`;
  const r = `Q ${(HL_X1 + 3.5).toFixed(1)},${(cy(HL_X1) + 1).toFixed(2)} ${bottom[n]}`;
  return `M ${top.join(" L ")} ${r} L ${bottom.slice(0, n).reverse().join(" L ")} ${l} Z`;
})();

const UnderCerroGordo: React.FC<Props> = () => {
  const frame = useCurrentFrame();

  const camY = cameraY(frame);
  const speed = Math.abs(cameraY(frame + 0.5) - cameraY(frame - 0.5));
  const sigma = blurSigma(speed);
  // the lamp is the brightest thing down there: it streaks about twice as long as the rock blurs
  const glowSigma = sigma + 0.14 * smooth(110, 380, speed) * speed;
  const dx = drift(frame);
  const plateLeft = -PLATE_PX0 + LOCK_K * dx;
  const shaftX = SHAFT_PX + plateLeft;
  const lipY = -camY; // screen y of the cut lip
  const videoTop = -videoTravel(frame); // screen y of the clip's first row
  const gap = lipY - GROUND - (videoTop + H); // how far the underground still has to close up
  const videoInWindow = videoTop + H > -BLUR_PAD;
  const underground = lipY < H + 60;

  // the scene softens and dims as the clipping lands; only then do its layers reach past the frame
  const soft = interpolate(frame, [POP_START, POP_END], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const e = soft > 0 ? EDGE : 0;
  const bleed: React.CSSProperties = { position: "absolute", left: -e, top: -e, width: W + 2 * e, height: H + 2 * e };

  // world -> window: the window starts BLUR_PAD above the frame
  const worldShift = BLUR_PAD - camY;
  const blurStyle: React.CSSProperties = sigma > 0 ? { filter: "url(#ucg-blur)" } : {};
  const windowStyle: React.CSSProperties = { position: "absolute", left: -e, top: -BLUR_PAD, width: W + 2 * e, height: H + 2 * BLUR_PAD, overflow: "hidden" };

  // readout
  const depth = (camY + READ_REF) / 10;
  const shown = Math.min(LEVEL_FT, Math.max(0, Math.round(depth / 10) * 10));
  const digits = String(shown).padStart(3, " ").split("");
  // it comes in over the cut face; once the clipping covers it entirely (from f50) it goes, so that the creep
  // cannot carry its numerals out above the paper's top edge later
  const readIn = smooth(F_READ, F_READ + READ_FADE, frame) * (1 - smooth(POP_PEAK - 2, POP_PEAK + 1, frame));
  const lineX0 = shaftX + SHAFT_HALF + 2;
  const lineX1 = READ_LEFT + DIGIT_W * 3 + 76;

  // the hold: the lamp flickers (and lifts once), the cable sways, the readout rides with the level it has landed on
  const fl = flicker(frame) + LAMP_LIFT * smooth(LIFT_START, LIFT_END, frame);
  const sHold = Math.max(0, frame - F_LAND);
  const ride = -Math.max(0, travel(Math.max(F_LAND, frame)) - T_TOTAL - 2 * CREEP * (1 - Math.exp(-sHold / 2)));
  const tSec = frame / FPS;
  const swayA = 2.2 * Math.sin(2 * Math.PI * 0.62 * tSec + 0.4);
  const swayB = 0.9 * Math.sin(2 * Math.PI * 1.45 * tSec + 1.9);
  const cablePts = Array.from({ length: 25 }, (_, i) => {
    const u = i / 24;
    return `${12 + swayA * Math.sin(Math.PI * u) + swayB * Math.sin(2 * Math.PI * u)},${u * (CABLE_Y1 - CABLE_Y0)}`;
  }).join(" ");

  const grainMask = `linear-gradient(to bottom, rgba(0,0,0,0) ${lipY - 14 + e}px, rgba(0,0,0,1) ${lipY + 44 + e}px)`;
  const gx = Math.floor(random(`grain-x-${frame}`) * (GRAIN_W - W));
  const gy = Math.floor(random(`grain-y-${frame}`) * (GRAIN_H - H));
  const gFlipX = random(`grain-fx-${frame}`) < 0.5 ? -1 : 1;
  const gFlipY = random(`grain-fy-${frame}`) < 0.5 ? -1 : 1;

  // ---- the clipping ----
  const pop =
    frame <= POP_PEAK
      ? interpolate(frame, [POP_START, POP_PEAK], [0.6, 1.04], { ...clamp, easing: Easing.out(Easing.cubic) })
      : interpolate(frame, [POP_PEAK, POP_END], [1.04, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const hold = interpolate(frame, [HOLD_START, HOLD_START + HOLD_SPAN], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const push = 1 + PUSH * hold;
  // the tip touches the paper one frame before HL_START, so the stroke is visibly under way on it
  const drawn = interpolate(frame, [HL_START - 1, HL_END], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const hlLead = HL_X0 - 3 + (HL_X1 - HL_X0 + 11) * drawn;
  const paperW = PAPER_W * CLIP_K;
  const paperH = PAPER_H * CLIP_K;
  const paperLeft = CLIP_CX - paperW / 2;
  const paperTop = CLIP_CY - paperH / 2;
  const hlCx = ((HL_X0 + HL_X1) / 2) * CLIP_K;
  const hlCy = ((HL_CY0 + HL_CY1) / 2) * CLIP_K;
  // the lit room on screen: the paper is scaled about it, so it comes out of the station
  const roomX = LAMP.x + plateLeft;
  const roomY = LEVEL_Y + ROOM_DY - camY;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="ucg-blur" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`${Math.min(3, 0.2 * sigma)} ${sigma}`} />
          </filter>
          {/* the clip gets more sideways blur than the plate: a vertical-only blur turns its compression blocks
              into columns of stretched pixels as it leaves */}
          <filter id="ucg-blur-video" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`${Math.min(7, 0.55 * sigma)} ${sigma}`} />
          </filter>
          <filter id="ucg-blur-glow" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`0 ${glowSigma}`} />
          </filter>
        </defs>
      </svg>

      {/* A. the scene: one group, softened as a whole once the clipping is up */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, ...(soft > 0 ? { filter: `blur(${SOFT_PX * soft}px)` } : {}) }}>
        {e > 0 ? <div style={{ ...bleed, backgroundColor: BG }} /> : null}

        {/* 1. the world: one window, the clip and the plate each with the move's motion blur */}
        <div style={windowStyle}>
          {videoInWindow ? (
            <div style={{ position: "absolute", left: e, top: 0, width: W, height: H + 2 * BLUR_PAD, ...(sigma > 0 ? { filter: "url(#ucg-blur-video)" } : {}) }}>
              {/* for the three or four frames in which the underground is still closing up, slivers under the clip's
                  last row would be empty: the clip's own last rows, pulled long, lie there (it starts 2 px under the clip) */}
              {gap > 46 ? (
                <div style={{ position: "absolute", left: 0, top: BLUR_PAD + videoTop + H - 2, width: W, height: UNDERLAY_H, overflow: "hidden" }}>
                  <OffthreadVideo
                    muted
                    src={VIDEO}
                    style={{ position: "absolute", left: 0, top: -H, width: W, height: H, transformOrigin: "50% 100%", transform: `scaleY(${-UNDERLAY_STRETCH})` }}
                  />
                </div>
              ) : null}
              <OffthreadVideo muted src={VIDEO} style={{ position: "absolute", left: 0, top: BLUR_PAD + videoTop, width: W, height: H }} />
            </div>
          ) : null}
          <div style={{ position: "absolute", inset: 0, ...blurStyle }}>
            <div style={{ position: "absolute", left: e, top: 0, width: W, height: 0, transform: `translateY(${worldShift}px)` }}>
              <Img src={PLATE} style={{ position: "absolute", left: plateLeft, top: PLATE_Y0, width: PLATE_W, height: PLATE_H, maxWidth: "none" }} />
              <Img src={CAP} style={{ position: "absolute", left: plateLeft, top: CAP_Y0, width: PLATE_W, height: CAP_H, maxWidth: "none" }} />
              {CABLE_Y1 - camY > -BLUR_PAD && CABLE_Y0 - camY < H + BLUR_PAD ? (
                <>
                  <Img
                    src={STATION_LIGHT}
                    style={{
                      position: "absolute",
                      left: plateLeft + STATION_LIGHT_X,
                      top: STATION_LIGHT_Y,
                      width: STATION_LIGHT_W,
                      height: STATION_LIGHT_H,
                      maxWidth: "none",
                      mixBlendMode: "screen",
                      opacity: clamp01(0.1 + 1.1 * (fl - 1)),
                    }}
                  />
                  <svg
                    style={{ position: "absolute", left: plateLeft + CABLE_X - 12, top: CABLE_Y0, width: 24, height: CABLE_Y1 - CABLE_Y0, overflow: "visible", filter: "blur(0.7px)" }}
                    viewBox={`0 0 24 ${CABLE_Y1 - CABLE_Y0}`}
                  >
                    <defs>
                      <linearGradient id="ucg-cable" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={CABLE_Y1 - CABLE_Y0}>
                        <stop offset={0} stopColor={CABLE_TOP} />
                        <stop offset={1} stopColor={CABLE_BOTTOM} />
                      </linearGradient>
                    </defs>
                    <polyline points={cablePts} fill="none" stroke="url(#ucg-cable)" strokeWidth={2.1} />
                  </svg>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* 2. below ground it gets dark over the first 150 ft, except in the pool of our own lamp */}
        {underground ? (
          <div style={{ ...bleed, WebkitMaskImage: pool(e), maskImage: pool(e) }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to bottom, rgba(${DARK},0) ${lipY + 120 + e}px, rgba(${DARK},0.34) ${lipY + 620 + e}px, rgba(${DARK},0.76) ${lipY + 1150 + e}px, rgba(${DARK},1) ${lipY + 1600 + e}px)`,
              }}
            />
          </div>
        ) : null}

        {/* 3. the station lamp: world space, streaked by the move */}
        {underground ? (
          <div
            style={{
              position: "absolute",
              left: -e,
              top: -GLOW_PAD,
              width: W + 2 * e,
              height: H + 2 * GLOW_PAD,
              overflow: "hidden",
              mixBlendMode: "screen",
              ...(glowSigma > 0 ? { filter: "url(#ucg-blur-glow)" } : {}),
            }}
          >
            <div style={{ position: "absolute", left: e, top: 0, width: W, height: 0, transform: `translateY(${GLOW_PAD - camY}px)` }}>
              {LAMP.y - camY > -GLOW_PAD - LAMP.h && LAMP.y - camY < H + GLOW_PAD + LAMP.h ? (
                <div
                  style={{
                    position: "absolute",
                    left: LAMP.x + plateLeft - LAMP.w / 2,
                    top: LAMP.y - LAMP.h / 2,
                    width: LAMP.w,
                    height: LAMP.h,
                    background: GLOW_REST,
                    opacity: Math.min(1, LAMP.k * (1 + 1.3 * (fl - 1))),
                    transform: `scale(${1 + 0.7 * (fl - 1)})`,
                  }}
                />
              ) : null}
              {LAMP.y - camY < H + 200
                ? DUST.map((d, i) => {
                    const wrap = (v: number, m: number) => ((v % m) + m) % m;
                    const px = wrap(d.x + d.vx * frame, DUST_W);
                    const x = px - 160;
                    const y = wrap(d.y + d.vy * frame + 4 * Math.sin(d.ph + frame * 0.2), DUST_H) + 10;
                    const fall = Math.pow(1 / (1 + (x * x + 4 * y * y) / (95 * 95)), 0.7);
                    const edge = Math.sqrt(Math.sin((Math.PI * px) / DUST_W));
                    const tw = 0.65 + 0.35 * Math.sin(d.ph * 3 + frame * 0.45);
                    return (
                      <div
                        key={`d${i}`}
                        style={{
                          position: "absolute",
                          left: LAMP.x + plateLeft + x - d.r,
                          top: LAMP.y + y - d.r,
                          width: d.r * 2,
                          height: d.r * 2,
                          borderRadius: "50%",
                          background: "radial-gradient(circle, rgba(255,236,200,1) 0%, rgba(255,224,176,0.55) 45%, rgba(255,220,170,0) 100%)",
                          opacity: Math.min(1, 1.15 * fall * edge * tw * fl),
                        }}
                      />
                    );
                  })
                : null}
            </div>
          </div>
        ) : null}

        {/* 4. grain over the cut face (the footage keeps its own), at the footage's level */}
        {underground ? (
          <div style={{ ...bleed, overflow: "hidden", mixBlendMode: "overlay", opacity: 0.05, WebkitMaskImage: grainMask, maskImage: grainMask }}>
            <Img
              src={GRAIN}
              style={{ position: "absolute", left: e - gx, top: e - gy, width: GRAIN_W, height: GRAIN_H, maxWidth: "none", transform: `scale(${gFlipX}, ${gFlipY})` }}
            />
          </div>
        ) : null}

        {/* 5. the one readout: it comes in over the cut face, already counting */}
        {readIn > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: readIn, transform: `translateY(${(1 - readIn) * 34 + ride}px)` }}>
            <div
              style={{
                position: "absolute",
                left: lineX0,
                top: READ_LINE_Y,
                width: Math.max(0, lineX1 - lineX0),
                height: 2.5,
                backgroundColor: WHITE,
                boxShadow: "0 1px 7px rgba(0,0,0,0.55)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: READ_LEFT,
                top: READ_LINE_Y - 172,
                height: 160,
                display: "flex",
                alignItems: "baseline",
                fontFamily,
                color: WHITE,
                textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.5)",
                fontVariantNumeric: "tabular-nums lining-nums",
                lineHeight: 1,
              }}
            >
              {digits.map((ch, i) => (
                <span key={i} style={{ display: "inline-block", width: DIGIT_W, textAlign: "center", fontSize: 172, fontWeight: 600 }}>
                  {ch === " " ? " " : ch}
                </span>
              ))}
              <span style={{ fontSize: 60, fontWeight: 500, letterSpacing: "0.05em", marginLeft: 14 }}>FT</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* B. the dim: a wash of the plate's own cool black while the clipping is up */}
      {soft > 0 ? <AbsoluteFill style={{ backgroundColor: `rgb(${DARK})`, opacity: DIM_ALPHA * soft }} /> : null}

      {/* C. the clipping: solid paper from its first frame; it grows out of the lit room, then eases closer about its headline */}
      {frame >= POP_START ? (
        <div
          style={{
            position: "absolute",
            left: paperLeft,
            top: paperTop,
            width: paperW,
            height: paperH,
            transformOrigin: `${roomX - paperLeft}px ${roomY - paperTop}px`,
            transform: `scale(${pop})`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, transform: `rotate(${TILT}deg)` }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                transformOrigin: `${hlCx}px ${hlCy}px`,
                transform: `scale(${push})`,
                isolation: "isolate",
              }}
            >
              <Img
                src={CLIPPING}
                style={{
                  position: "absolute",
                  left: -CLIP_PAD * CLIP_K,
                  top: -CLIP_PAD * CLIP_K,
                  width: (PAPER_W + 2 * CLIP_PAD) * CLIP_K,
                  height: (PAPER_H + 2 * CLIP_PAD) * CLIP_K,
                  maxWidth: "none",
                }}
              />
              {drawn > 0 ? (
                <svg width={paperW} height={paperH} viewBox={`0 0 ${PAPER_W} ${PAPER_H}`} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "multiply" }}>
                  <defs>
                    <clipPath id="ucg-hl-clip">
                      <rect x={hlLead - 2000} y={HL_CY1 - HL_H / 2 - 2.5} width={2000} height={HL_CY0 - HL_CY1 + HL_H + 5} rx={9} />
                    </clipPath>
                    <filter id="ucg-hl-soft" x="-5%" y="-40%" width="110%" height="180%">
                      <feGaussianBlur stdDeviation={0.75} />
                    </filter>
                    <linearGradient id="ucg-hl-ink" gradientUnits="userSpaceOnUse" x1={HL_X0} y1={0} x2={HL_X1} y2={0}>
                      <stop offset={0} stopColor={HL_YELLOW} stopOpacity={0.98} />
                      <stop offset={0.035} stopColor={HL_YELLOW} stopOpacity={0.86} />
                      <stop offset={0.965} stopColor={HL_YELLOW} stopOpacity={0.86} />
                      <stop offset={1} stopColor={HL_YELLOW} stopOpacity={0.98} />
                    </linearGradient>
                  </defs>
                  <g filter="url(#ucg-hl-soft)">
                    <g clipPath="url(#ucg-hl-clip)">
                      <path d={HL_PATH} fill="url(#ucg-hl-ink)" />
                    </g>
                  </g>
                </svg>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default UnderCerroGordo;
