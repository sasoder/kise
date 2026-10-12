import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { z } from "zod";

/**
 * DownTheShaft — Brent Underwood, "five days in the mine" (Cerro Gordo).
 *
 * CHECK LINE: "That building sits on a hole that drops 900 feet straight down,
 * about thirty times the building's own height."
 *
 * NOT a house style: a photoreal-leaning composite. The editor's drone clip of
 * the hoist house on top, a believable cut-away of the ground under it, one
 * camera move down. 1080x1920, 24000/1001 fps, 74 frames (66 in the slot at
 * sequence 0.584-3.337 s, 8 of trim handle).
 *
 * Words (interviewer), local frame of the onset:
 *   mine shaft   f0-14
 *   over here    f14-26
 *   so           f27
 *   it           f30
 *   goes         f33
 *   down         f37
 *   900          f41
 *   feet         f51
 *   I think      f65      (cut back to the speaker at f66)
 *
 * The move: the clip plays untouched for 12 frames, then the camera tilts down,
 * slow at first: the footage slides up and the ground in front of it turns out
 * to be SLICED, with the shaft collar under the building. From f27 it falls
 * through the rock (up to 581 px a frame at f40, motion blur), four level
 * stations going by as warm streaks. It brakes through the last 100 ft and
 * lands at f58 on the 900 ft station, then creeps 3 px a frame.
 *
 * World: y 0 = the cut lip, 10 px = 1 ft, so the station floor at 900 ft is
 * y 9000. "Camera y" is the world y of the frame's TOP edge. The readout is the
 * depth at screen y 856, (camera y + 856) / 10 ft: that is where the station
 * floor comes to rest, with the station's roof just under the hairline.
 *
 *   frame   camera y   speed px/f   readout
 *   f0      -2054         0          (footage only)
 *   f12     -2054         0          (footage only; the move starts)
 *   f27     -1274        84          lip at screen y 1274 (no readout yet)
 *   f38      2081       552          290 ft
 *   f48      7114       303          800 ft
 *   f58      8144         3.1        900 ft  (landed)
 *   f66      8168         3          900 ft  (the cut back to the speaker)
 *
 * The cut edge is the nearest thing in the picture, so it comes into frame a
 * little faster than the footage moves: at rest the whole underground sits 110
 * px too low, entirely below the frame (the clip is untouched for as long as it
 * is alone), and over the first 500 px of travel (to f23) it closes up, fastest
 * while it is still below the frame. From then on clip and plate move down as
 * one, the cap's ground lying over the clip's last ~85 rows with a soft, uneven
 * edge.
 *
 * Sideways: the drone orbits the building, so the ground at the clip's bottom
 * edge moves right about 4.8 px a frame (in an uneven cadence of repeated and
 * blended frames) while the cupola hardly moves (x 391-392). The plate follows
 * the measured motion of the bottom 80 rows frame by frame (DRIFT), but only
 * 0.55 of it (LOCK_K): that keeps the shaft within 20 px of the cupola from its
 * first visible frame (x 372 at f15) until the building has left (x 411 at
 * f29), at the price of about 2 px a frame of slip between the cap's ground and
 * the clip's. The shaft settles at screen x 432.
 *
 * The hold (f58-f73) is alive: the 3 px creep, the station lamp flickering
 * about +-9 % (its glow, and its light on the station through a separately
 * baked light map), dust drifting through the light, the hoist cable swaying
 * 2 px, and the readout riding up with the level it landed on.
 *
 * Layers, back to front:
 *   1. the WORLD, one window: the clip, then the baked plate with its cap
 *      (ground, lip, brush), the station's light map and the live cable; clip
 *      and plate each carry the move's motion blur (the clip with more sideways
 *      blur, so its compression blocks do not turn into columns as it leaves)
 *   2. darkness below ground, cut open by the pool of our own lamp (screen space)
 *   3. the station lamps' glow and the dust, world space, streaked by the move
 *   4. fine grain over the cut face, new every frame
 *   5. the depth readout, never blurred; it enters when the lip has passed it,
 *      already counting
 */

export const FPS = 24000 / 1001;
export const DURATION = 74;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const { fontFamily } = loadFont("normal", { weights: ["500", "600"], subsets: ["latin"] });

// ---- frame and world ----
const W = 1080;
const H = 1920;
const GROUND = 24; // world px between the clip's last row and the lip, once the two are locked
const SLIDE = 110; // at rest the underground sits this much lower, out of frame
const SLIDE_LOCK = 500; // px of camera travel over which it closes up
const REST_Y = -(H + GROUND + SLIDE); // camera y at rest
const UNDERLAY_H = SLIDE + 24;
const UNDERLAY_STRETCH = 2.0;
const PLATE_W = 1400;
const PLATE_H = 10132;
const PLATE_Y0 = 28; // world y of the plate's first row
const CAP_Y0 = -208; // world y of the cap's first row
const CAP_H = 328;
const PLATE_PX0 = 192; // plate x at screen x 0 before any drift
const LOCK_K = 0.55; // how much of the near ground's sideways drift the plate takes (see the header)
const SHAFT_PX = 530; // plate x of the shaft centre
const SHAFT_HALF = 37;
const LAND_CAM_Y = 8144; // camera y at the landing: the 900 ft station's roof comes to rest just under the hairline
const READ_REF = 9000 - LAND_CAM_Y; // the readout is the depth at this screen y, where the station floor comes to rest

// ---- timing ----
const F_START = 12;
const F_DROP = 27;
const F_BRAKE = 48;
const F_LAND = 58;
const T_EASE = 780; // px travelled by f27
const P_EASE = 1.6;
const BRAKE_DIST = 1000; // the last 100 ft
const CREEP = 3; // px per frame after the landing
const T_TOTAL = LAND_CAM_Y - REST_Y;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
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
  return T_TOTAL + CREEP * (f - F_LAND);
};

/** World y of the frame's top edge. */
export const cameraY = (f: number) => REST_Y + travel(f);

/** Px the clip itself has moved up: the underground's travel minus what it has closed up. */
const videoTravel = (f: number) => {
  const t = travel(f);
  const s = 1 - clamp01(t / SLIDE_LOCK);
  return t - SLIDE * (1 - s * s); // fastest at the start, while the edge is still below the frame
};

// Px the ground in the clip's bottom 80 rows has moved right since f0, measured
// frame by frame (phase correlation). The cadence is the footage's own.
const DRIFT = [
  0.0, 6.2, 12.3, 15.9, 15.9, 22.0, 28.2, 31.9, 31.9, 38.0, 44.1, 44.1, 47.9, 54.0, 61.7, 61.7, 65.5, 73.2, 80.9, 80.9, 84.7,
  92.5, 100.4, 100.4, 104.3, 112.2, 116.2, 120.2, 124.2, 132.2, 136.1, 140.2, 144.0, 152.1, 156.2,
];
const DRIFT_LOCK = DRIFT.length - 1; // f34: the clip has left the frame
const DRIFT_TAIL = 7; // frames over which the sideways drift eases out
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

// ---- motion blur ----
const BLUR_PAD = 400; // the blurred window is this much taller than the frame, top and bottom
const GLOW_PAD = 760; // the lamps' window: their streaks are longer
const blurSigma = (speed: number) => {
  // nearly none while the lip is the subject (under ~110 px a frame), a long shutter for the fall
  const sigma = (0.035 + 0.125 * smooth(110, 380, speed)) * speed;
  return sigma < 0.6 ? 0 : sigma;
};

// ---- lamps (plate x, world y), as baked ----
const GLOW_PASS =
  "radial-gradient(ellipse closest-side, rgba(255,236,196,1) 0%, rgba(255,214,150,0.92) 14%, rgba(255,184,106,0.60) 30%, rgba(255,156,76,0.28) 52%, rgba(255,136,56,0.08) 78%, rgba(255,130,50,0) 100%)";
const GLOW_REST =
  "radial-gradient(circle closest-side, rgba(255,226,170,0.95) 0%, rgba(255,190,110,0.55) 5%, rgba(255,160,80,0.26) 16%, rgba(255,140,60,0.10) 40%, rgba(255,130,50,0.03) 70%, rgba(255,130,50,0) 100%)";
const LAMPS = [
  { x: 601, y: 1937, w: 300, h: 900, k: 1.0, glow: GLOW_PASS },
  { x: 459, y: 3936, w: 300, h: 900, k: 1.0, glow: GLOW_PASS },
  { x: 601, y: 5440, w: 300, h: 900, k: 1.0, glow: GLOW_PASS },
  { x: 459, y: 6939, w: 300, h: 900, k: 1.0, glow: GLOW_PASS },
  { x: 619, y: 8918, w: 420, h: 420, k: 0.9, glow: GLOW_REST }, // the 900 ft station
];
const BOTTOM_LAMP = LAMPS[LAMPS.length - 1];

// ---- darkness and our lamp ----
const DARK = "5,8,12";
const POOL =
  "radial-gradient(ellipse 780px 1040px at 458px 860px, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 22%, rgba(0,0,0,0.15) 46%, rgba(0,0,0,0.40) 70%, rgba(0,0,0,0.68) 90%, rgba(0,0,0,0.80) 100%)";

// ---- readout ----
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

// ---- life in the hold ----
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
// the last 1000 px of the hoist cable are drawn live, so it can sway (the plate carries it down to CABLE_Y0)
const CABLE_X = 525.65;
const CABLE_Y0 = 7900;
const CABLE_Y1 = 8936;
// the lamp's own light on the 900 ft station, baked apart from the plate so it can flicker
const STATION_LIGHT_X = 110;
const STATION_LIGHT_Y = 8840;
const STATION_LIGHT_W = 1020;
const STATION_LIGHT_H = 230;

const VIDEO = staticFile("cerro/shaft/hoist_9x16.mp4");
const PLATE = staticFile("cerro/shaft/underground_plate.jpg");
const CAP = staticFile("cerro/shaft/underground_cap.png");
const GRAIN = staticFile("cerro/shaft/grain_tile.png");
const STATION_LIGHT = staticFile("cerro/shaft/station_light.png");
const GRAIN_W = 1216;
const GRAIN_H = 2048;

const DownTheShaft: React.FC<Props> = () => {
  const frame = useCurrentFrame();

  const camY = cameraY(frame);
  const speed = Math.abs(cameraY(frame + 0.5) - cameraY(frame - 0.5));
  const sigma = blurSigma(speed);
  // the lamps are the brightest things down there: they streak about twice as long as the rock blurs
  const glowSigma = sigma + 0.14 * smooth(110, 380, speed) * speed;
  const dx = drift(frame);
  const plateLeft = -PLATE_PX0 + LOCK_K * dx;
  const shaftX = SHAFT_PX + plateLeft;
  const lipY = -camY; // screen y of the cut lip
  const videoTop = -videoTravel(frame); // screen y of the clip's first row
  const gap = lipY - GROUND - (videoTop + H); // how far the underground still has to close up
  const videoInWindow = videoTop + H > -BLUR_PAD;
  const underground = lipY < H + 60;

  // world -> window: the window starts BLUR_PAD above the frame
  const worldShift = BLUR_PAD - camY;
  const blurStyle: React.CSSProperties = sigma > 0 ? { filter: "url(#dts-blur)" } : {};
  const windowStyle: React.CSSProperties = { position: "absolute", left: 0, top: -BLUR_PAD, width: W, height: H + 2 * BLUR_PAD, overflow: "hidden" };

  // readout
  const depth = (camY + READ_REF) / 10;
  const shown = Math.min(900, Math.max(0, Math.round(depth / 10) * 10));
  const digits = String(shown).padStart(3, " ").split("");
  const readIn = smooth(F_READ, F_READ + READ_FADE, frame);
  const lineX0 = shaftX + SHAFT_HALF + 2;
  const lineX1 = READ_LEFT + DIGIT_W * 3 + 76;

  // the hold: the lamp flickers, the cable sways, the readout rides with the level it has landed on
  const fl = flicker(frame);
  const sHold = Math.max(0, frame - F_LAND);
  const ride = -CREEP * Math.max(0, sHold - 2 * (1 - Math.exp(-sHold / 2)));
  const tSec = frame / FPS;
  const swayA = 2.2 * Math.sin(2 * Math.PI * 0.62 * tSec + 0.4);
  const swayB = 0.9 * Math.sin(2 * Math.PI * 1.45 * tSec + 1.9);
  const cablePts = Array.from({ length: 25 }, (_, i) => {
    const u = i / 24;
    return `${12 + swayA * Math.sin(Math.PI * u) + swayB * Math.sin(2 * Math.PI * u)},${u * (CABLE_Y1 - CABLE_Y0)}`;
  }).join(" ");

  const grainMask = `linear-gradient(to bottom, rgba(0,0,0,0) ${lipY - 14}px, rgba(0,0,0,1) ${lipY + 44}px)`;
  const gx = Math.floor(random(`grain-x-${frame}`) * (GRAIN_W - W));
  const gy = Math.floor(random(`grain-y-${frame}`) * (GRAIN_H - H));
  const gFlipX = random(`grain-fx-${frame}`) < 0.5 ? -1 : 1;
  const gFlipY = random(`grain-fy-${frame}`) < 0.5 ? -1 : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05080c", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="dts-blur" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`${Math.min(3, 0.2 * sigma)} ${sigma}`} />
          </filter>
          {/* the clip gets more sideways blur than the plate: a vertical-only blur turns its compression blocks
              into columns of stretched pixels as it leaves */}
          <filter id="dts-blur-video" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`${Math.min(7, 0.55 * sigma)} ${sigma}`} />
          </filter>
          <filter id="dts-blur-glow" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`0 ${glowSigma}`} />
          </filter>
        </defs>
      </svg>

      {/* 1. the world: one window, the clip and the plate each with the move's motion blur */}
      <div style={windowStyle}>
        {videoInWindow ? (
          <div style={{ position: "absolute", inset: 0, ...(sigma > 0 ? { filter: "url(#dts-blur-video)" } : {}) }}>
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
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 0, transform: `translateY(${worldShift}px)` }}>
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
                <polyline points={cablePts} fill="none" stroke="rgb(80,77,73)" strokeWidth={2.1} />
              </svg>
            </>
          ) : null}
        </div>
        </div>
      </div>

      {/* 2. below ground it gets dark over the first 150 ft, except in the pool of our own lamp */}
      {underground ? (
        <AbsoluteFill style={{ WebkitMaskImage: POOL, maskImage: POOL }}>
          <AbsoluteFill
            style={{
              background: `linear-gradient(to bottom, rgba(${DARK},0) ${lipY + 120}px, rgba(${DARK},0.34) ${lipY + 620}px, rgba(${DARK},0.76) ${lipY + 1150}px, rgba(${DARK},1) ${lipY + 1600}px)`,
            }}
          />
        </AbsoluteFill>
      ) : null}

      {/* 3. the station lamps: world space, streaked by the move */}
      {underground ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -GLOW_PAD,
            width: W,
            height: H + 2 * GLOW_PAD,
            overflow: "hidden",
            mixBlendMode: "screen",
            ...(glowSigma > 0 ? { filter: "url(#dts-blur-glow)" } : {}),
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 0, transform: `translateY(${GLOW_PAD - camY}px)` }}>
            {LAMPS.map((l, i) => {
              const sy = l.y - camY;
              if (sy < -GLOW_PAD - l.h || sy > H + GLOW_PAD + l.h) return null;
              const b = l === BOTTOM_LAMP ? fl : 1;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: l.x + plateLeft - l.w / 2,
                    top: l.y - l.h / 2,
                    width: l.w,
                    height: l.h,
                    background: l.glow,
                    opacity: Math.min(1, l.k * (1 + 1.3 * (b - 1))),
                    transform: `scale(${1 + 0.7 * (b - 1)})`,
                  }}
                />
              );
            })}
            {BOTTOM_LAMP.y - camY < H + 200
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
                        left: BOTTOM_LAMP.x + plateLeft + x - d.r,
                        top: BOTTOM_LAMP.y + y - d.r,
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
        <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: 0.05, WebkitMaskImage: grainMask, maskImage: grainMask }}>
          <Img
            src={GRAIN}
            style={{ position: "absolute", left: -gx, top: -gy, width: GRAIN_W, height: GRAIN_H, maxWidth: "none", transform: `scale(${gFlipX}, ${gFlipY})` }}
          />
        </AbsoluteFill>
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
    </AbsoluteFill>
  );
};

export default DownTheShaft;
