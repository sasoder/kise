import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { z } from "zod";

/**
 * NineHundredReal — Brent Underwood, "five days in the mine" (Cerro Gordo).
 * The older flat "900 ft" graphic redone in the world and look of DownTheShaft.
 *
 * CHECK LINE: "He hangs at the top of a drop that is three Statues of Liberty deep."
 *
 * 1080x1920, 24000/1001 fps, 126 frames (118 in the slot, 8 of handle).
 *
 * Words (Brent), local frame of the onset:
 *   So f1 · the idea of f6 · dangling f16 · on a rope f28-40 · with f41 · 900 f47 ·
 *   foot f53 · of exposure f59 · below f72 · you f78 · is not one f84 ·
 *   that my mind f100-112 · still, like f113 · (the edit cuts away at f118)
 *
 * The move: it opens close (2.9x DownTheShaft's scale) on a man sitting in a
 * harness on a rope under the timbered collar, swaying, the dusk spilling a
 * short way down the shaft on him. From f28 to f88 the camera pulls back in ONE
 * move, smooth in log-zoom, until the whole cut-away is in frame at 0.164x:
 * the 9000 px from the lip to the 900 ft station floor are 1480 px on screen,
 * the five station lamps coming into view one after another. Then it holds,
 * creeping in 1.5 %.
 *
 * World = DownTheShaft's: y 0 the cut lip, 10 px = 1 ft, plate x (the shaft's
 * centre is x 530). The camera is given by the zoom and by where the lip at
 * the shaft sits on screen:
 *
 *   frame   zoom     shaft x   lip y   the man
 *   f0      2.900    540       440     191 px tall, centred at y 770
 *   f28     2.900    540       440     the pull-back starts
 *   f47     1.701    495       405     112 px; the dimension line starts at the lip
 *   f60     0.577    405       333     38 px: his marker ring fades in
 *   f72     0.233    329       273     15 px; the first statue starts to rise
 *   f88     0.164    300       250     11 px; home: station floor at y 1730
 *   f106    0.165    300       250     the third statue is home; the hold
 *   f118    0.166    300       250     (the cut)
 *
 * Levels of detail, cross-faded on zoom (scripts/bake-nine-hundred-real.py):
 *   nh_close.jpg   3x, the top 57 ft: full above zoom 2.6, gone below 2.05
 *   nh_collar.jpg  2x, the top 148 ft: full above zoom 1.6, gone below 1.15
 *   DownTheShaft's own 1x plate and cap, always, over the middle
 *   nh_wide.jpg    1/3 res, 700 ft wide: the flanks and the dusk surface (the
 *                  hoist house cut out of the clip's frame, on plain dusk sky and land)
 * A screen-space blur keeps the softness the same at every zoom (a reduced
 * plate is sharper than the clip), plus a little for the speed of the zoom.
 *
 * The man is the subject: once he is under 40 px (f60) a thin white ring,
 * 34 px, rides his sway, with his headlamp twinkling inside it.
 *
 * Overlays, all in the readout's language (white, soft shadow, no lighting):
 *   f47-f88   a vertical dimension line grows from the lip to the station
 *             floor beside the shaft; the readout counts with it to 900 FT
 *   f72-f106  three Statue of Liberty silhouettes rise beside the shaft from
 *             the station floor, each 305/900 of the depth (305 ft with
 *             pedestal and base, National Park Service): three make 915 ft, so
 *             the top torch stands 15 ft above the lip
 *   one "305 FT" tag on the bottom statue
 */

export const FPS = 24000 / 1001;
export const DURATION = 126;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const { fontFamily } = loadFont("normal", { weights: ["500", "600"], subsets: ["latin"] });

const W = 1080;
const H = 1920;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// ---- the world (DownTheShaft's) ----
const SHAFT_PX = 530;
const SHAFT_HALF = 37;
const FLOOR_Y = 9000;
const COLLAR_Y = -30;
const PLATE = { x: 0, y: 28, w: 1400, h: 10132 };
const CAP = { x: 0, y: -208, w: 1400, h: 328 };
const REF = { x: 136, y: -1944, w: 1080, h: 1920 };
const COLLAR = { x: 136, y: -224, w: 920, h: 1704 };
const WIDE = { x: -1500, y: -1960, w: 7000, h: 13700 };
const STATION_LIGHT = { x: 110, y: 8840, w: 1020, h: 230 };
const LAMPS = [
  { x: 601, y: 1937 },
  { x: 459, y: 3936 },
  { x: 601, y: 5440 },
  { x: 459, y: 6939 },
  { x: 619, y: 8918 },
];

// ---- the camera ----
const ZOOM_OPEN = 2.9;
const ZOOM_REST = 1480 / FLOOR_Y;
const F_PULL0 = 28;
const F_PULL1 = 88;
const LIP_OPEN_Y = 440; // the lip on screen at the open: the collar in the upper third, the man around y 770
const LIP_REST_Y = 250;
const SHAFT_X_OPEN = 540;
const SHAFT_X_REST = 300;
/** 0..1 along the pull-back: smootherstep, so the zoom has no lurch at either end. */
const pull = (f: number) => {
  const t = clamp01((f - F_PULL0) / (F_PULL1 - F_PULL0));
  return t * t * t * (t * (6 * t - 15) + 10);
};
export const zoomAt = (f: number) => Math.exp(Math.log(ZOOM_OPEN) + (Math.log(ZOOM_REST) - Math.log(ZOOM_OPEN)) * pull(f)) * (1 + 0.015 * smooth(98, 126, f));
export const shaftXAt = (f: number) => SHAFT_X_OPEN + (SHAFT_X_REST - SHAFT_X_OPEN) * pull(f);
export const lipYAt = (f: number) => LIP_OPEN_Y + (LIP_REST_Y - LIP_OPEN_Y) * pull(f);

// ---- the man on the rope ----
const ROPE_X = 541;
const ROPE_TOP = COLLAR_Y - 8;
const MAN_SCALE = 1.18; // the drawing's 46 x 72 box, in world px
const MAN_TOP = 72;
const MAN_H = 56 * MAN_SCALE;
const MAN_CENTRE = MAN_TOP + 36 * MAN_SCALE; // world y of his middle
// once he is under 40 px he gets a marker in the readout's language: a thin white ring that rides his sway
const F_RING = (() => {
  for (let f = F_PULL0; f < F_PULL1; f++) if (MAN_H * zoomAt(f) < 40) return f;
  return F_PULL1;
})();
const CLOSE = { x: 300, y: -160, w: 460, h: 730 };
const HEADLAMP = { x: ROPE_X + 4.2 * MAN_SCALE, y: MAN_TOP + 13.4 * MAN_SCALE };

// ---- the overlays ----
const WHITE = "rgba(255,255,255,0.92)";
const SHADOW = "0 2px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.5)";
const DIM_X = SHAFT_PX + SHAFT_HALF + 115; // world x of the dimension line
const F_DIM0 = 47;
const F_DIM1 = 86;
const READ_LEFT = 742;
const READ_LINE_Y = 742;
const DIGIT_W = 78;
const LIB_H = (305 / 900) * FLOOR_Y; // 3050 world px
const LIB_W = (LIB_H * 1131) / 2098;
const LIB_CX = SHAFT_PX + (560 - SHAFT_X_REST) / ZOOM_REST; // the column is centred at screen x 560 at rest
const LIB_START = [72, 82, 92];
const LIB_RISE = 14;

const flicker = (f: number, k: number) => {
  const t = f / FPS;
  const n0 = random(`nh-fl-${k}-${Math.floor(f)}`) - 0.5;
  const n1 = random(`nh-fl-${k}-${Math.floor(f) - 1}`) - 0.5;
  return 1 + 0.05 * Math.sin(2 * Math.PI * (1.5 + 0.23 * k) * t + k * 1.7) + 0.03 * Math.sin(2 * Math.PI * (3.9 + 0.4 * k) * t + k) + 0.07 * (0.65 * n0 + 0.35 * n1);
};

const SIDE_FEATHER = "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 9%, rgba(0,0,0,1) 91%, rgba(0,0,0,0) 100%)";
// at the wide view the wide plate carries the clip's whole 16:9 frame; the sharp 9:16 rectangle the close plates
// show above the lip hands over to it between zoom 1.15 and 0.8
const GLOW = "radial-gradient(circle closest-side, rgba(255,232,184,1) 0%, rgba(255,204,132,0.72) 9%, rgba(255,170,90,0.36) 26%, rgba(255,146,66,0.13) 52%, rgba(255,130,50,0) 100%)";
const COOL = "radial-gradient(circle closest-side, rgba(236,246,255,1) 0%, rgba(206,230,255,0.7) 16%, rgba(170,208,255,0.22) 45%, rgba(160,200,255,0) 100%)";

const NineHundredReal: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const zoom = zoomAt(frame);
  const p = pull(frame);
  const shaftX = shaftXAt(frame);
  const tx = shaftX - SHAFT_PX * zoom;
  const lipY = lipYAt(frame);
  const ty = lipY;
  const sx = (wx: number) => tx + wx * zoom;
  const sy = (wy: number) => ty + wy * zoom;
  const img = (r: { x: number; y: number; w: number; h: number }): React.CSSProperties => ({ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, maxWidth: "none" });

  // one softness at every zoom, and a little more while the zoom is fast
  const zoomSpeed = Math.abs(Math.log(zoomAt(frame + 0.5)) - Math.log(zoomAt(frame - 0.5)));
  const collarOpacity = smooth(1.15, 1.6, zoom);
  const rectOpacity = smooth(0.8, 1.15, zoom);
  const closeOpacity = smooth(2.05, 2.6, zoom);
  const blur =
    1.15 * Math.sqrt(Math.max(0, 1 - Math.min(1, zoom) ** 2)) * 0.9 +
    (1 - closeOpacity) * collarOpacity * Math.sqrt(Math.max(0, 1 - (zoom / 2) ** 2)) +
    0.8 * closeOpacity * Math.sqrt(Math.max(0, 1 - (zoom / 3) ** 2)) +
    26 * zoomSpeed;

  // the man sways on the rope the whole cut
  const t = frame / FPS;
  const sway = 0.046 * Math.sin(2 * Math.PI * 0.42 * t - 0.5) + 0.009 * Math.sin(2 * Math.PI * 1.13 * t + 1.1);
  const ropeW = Math.max(0.9, 1.3 / zoom);
  const twinkle = 0.82 + 0.18 * Math.sin(2 * Math.PI * 1.9 * t + 0.6) + 0.12 * (random(`nh-tw-${frame}`) - 0.5);
  const glint = Math.max(16, 17 / zoom) * twinkle;
  const ringIn = smooth(F_RING, F_RING + 8, frame);
  const manLen = MAN_CENTRE - ROPE_TOP;
  const ringX = sx(ROPE_X - manLen * Math.sin(sway));
  const ringY = sy(ROPE_TOP + manLen * Math.cos(sway));

  // the dimension line and its readout
  const dimP = clamp01((frame - F_DIM0) / (F_DIM1 - F_DIM0));
  const dimEndScreen = lipY + (1730 - lipY) * (dimP * dimP * (3 - 2 * dimP));
  const depth = frame >= F_PULL1 ? FLOOR_Y : Math.min(FLOOR_Y, (dimEndScreen - lipY) / zoom);
  const dimIn = smooth(F_DIM0, F_DIM0 + 5, frame);
  const readIn = smooth(60, 130, depth); // the number comes in once there is a depth to read (never "0 FT")
  const shown = Math.min(900, Math.round(depth / 100) * 10);
  const digits = String(shown).padStart(3, " ").split("");
  const dimX = sx(DIM_X);

  // darkness below ground, cut open by our own lamp's pool (wider at the wide view)
  const dark = "5,8,12";
  const pool = `radial-gradient(ellipse ${780 + 60 * p}px ${1040 + 150 * p}px at ${shaftX + 26 + 170 * p}px ${860 + 150 * p}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 24%, rgba(0,0,0,0.14) 50%, rgba(0,0,0,0.38) 74%, rgba(0,0,0,0.64) 92%, rgba(0,0,0,${0.8 - 0.06 * p}) 100%)`;
  const lipS = lipY;

  const gx = Math.floor(random(`nh-grain-x-${frame}`) * (1216 - W));
  const gy = Math.floor(random(`nh-grain-y-${frame}`) * (2048 - H));
  const grainMask = `linear-gradient(to bottom, rgba(0,0,0,0) ${lipS - 14}px, rgba(0,0,0,1) ${lipS + 44}px)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05080c", overflow: "hidden" }}>
      {/* 1. the world */}
      <AbsoluteFill style={{ overflow: "hidden", ...(blur > 0.08 ? { filter: `blur(${blur}px)` } : {}) }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${zoom})` }}>
          <Img src={staticFile("cerro/shaft/nh_wide.jpg")} style={img(WIDE)} />
          {rectOpacity > 0 ? (
            <Img src={staticFile("cerro/shaft/ref_frame0.png")} style={{ ...img(REF), opacity: rectOpacity, WebkitMaskImage: SIDE_FEATHER, maskImage: SIDE_FEATHER }} />
          ) : null}
          <Img src={staticFile("cerro/shaft/underground_plate.jpg")} style={{ ...img(PLATE), WebkitMaskImage: SIDE_FEATHER, maskImage: SIDE_FEATHER }} />
          <Img src={staticFile("cerro/shaft/underground_cap.png")} style={{ ...img(CAP), WebkitMaskImage: SIDE_FEATHER, maskImage: SIDE_FEATHER }} />
          <Img src={staticFile("cerro/shaft/station_light.png")} style={{ ...img(STATION_LIGHT), mixBlendMode: "screen", opacity: clamp01(0.1 + 1.1 * (flicker(frame, 4) - 1)) }} />
          {collarOpacity > 0 ? (
            <Img src={staticFile("cerro/shaft/nh_collar.jpg")} style={{ ...img(COLLAR), opacity: collarOpacity, WebkitMaskImage: SIDE_FEATHER, maskImage: SIDE_FEATHER }} />
          ) : null}
          {closeOpacity > 0 ? (
            <Img src={staticFile("cerro/shaft/nh_close.jpg")} style={{ ...img(CLOSE), opacity: closeOpacity, WebkitMaskImage: SIDE_FEATHER, maskImage: SIDE_FEATHER }} />
          ) : null}
          {/* the dusk spilling a short way down the shaft, on the collar timbers and the upper walls: gone by 40 ft */}
          <div
            style={{
              position: "absolute",
              left: SHAFT_PX - SHAFT_HALF - 7,
              top: COLLAR_Y + 4,
              width: SHAFT_HALF * 2 + 14,
              height: 420,
              background: "linear-gradient(to bottom, rgba(84,100,114,0) 0%, rgba(84,100,114,0.85) 4%, rgba(84,100,114,0.6) 30%, rgba(84,100,114,0.25) 62%, rgba(84,100,114,0) 100%)",
              mixBlendMode: "color-dodge",
              WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)",
              maskImage: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)",
            }}
          />
          {/* the station lamps */}
          {LAMPS.map((l, i) => {
            const size = Math.max(330, 54 / zoom);
            const fl = flicker(frame, i);
            return (
              <div
                key={i}
                style={{ position: "absolute", left: l.x - size / 2, top: l.y - size / 2, width: size, height: size, background: GLOW, mixBlendMode: "screen", opacity: Math.min(1, 0.92 * (1 + 1.3 * (fl - 1))), transform: `scale(${1 + 0.6 * (fl - 1)})` }}
              />
            );
          })}
          {/* the man: rope, body and headlamp swing as one about the collar timber */}
          <div style={{ position: "absolute", left: ROPE_X, top: ROPE_TOP, width: 0, height: 0, transformOrigin: "0 0", transform: `rotate(${sway}rad)` }}>
            <Img
              src={staticFile("cerro/shaft/nh_man.png")}
              style={{ position: "absolute", left: -23 * MAN_SCALE, top: MAN_TOP - ROPE_TOP, width: 46 * MAN_SCALE, height: 72 * MAN_SCALE, maxWidth: "none", transform: `rotate(${-0.4 * sway}rad)`, transformOrigin: "50% 20%" }}
            />
            <div style={{ position: "absolute", left: -ropeW / 2, top: 0, width: ropeW, height: MAN_TOP - ROPE_TOP + 39 * MAN_SCALE, background: "linear-gradient(to bottom, rgba(206,212,210,0.95) 0%, rgba(186,186,176,0.9) 45%, rgba(152,148,136,0.86) 100%)", borderRadius: ropeW }} />
            <div style={{ position: "absolute", left: HEADLAMP.x - ROPE_X - glint / 2, top: HEADLAMP.y - ROPE_TOP - glint / 2, width: glint, height: glint, background: COOL, mixBlendMode: "screen" }} />
          </div>
        </div>
      </AbsoluteFill>

      {/* 2. below ground it gets dark over the first 150 ft, except in the pool of our own lamp */}
      <AbsoluteFill style={{ WebkitMaskImage: pool, maskImage: pool }}>
        <AbsoluteFill
          style={{
            background: `linear-gradient(to bottom, rgba(${dark},0) ${lipS + 120 * zoom}px, rgba(${dark},0.34) ${lipS + 620 * zoom}px, rgba(${dark},0.76) ${lipS + 1150 * zoom}px, rgba(${dark},1) ${lipS + 1600 * zoom}px)`,
          }}
        />
      </AbsoluteFill>

      {/* 3. grain over the cut face */}
      <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: 0.05, WebkitMaskImage: grainMask, maskImage: grainMask }}>
        <Img src={staticFile("cerro/shaft/grain_tile.png")} style={{ position: "absolute", left: -gx, top: -gy, width: 1216, height: 2048, maxWidth: "none" }} />
      </AbsoluteFill>

      {/* the man's marker, once he is small: a thin white ring riding his sway */}
      {ringIn > 0 ? (
        <div
          style={{ position: "absolute", left: ringX - 17, top: ringY - 17, width: 34, height: 34, boxSizing: "border-box", borderRadius: "50%", border: `2px solid ${WHITE}`, boxShadow: "0 1px 7px rgba(0,0,0,0.55), inset 0 1px 6px rgba(0,0,0,0.4)", opacity: ringIn }}
        />
      ) : null}

      {/* 4. the statues: a measuring overlay, each rising out of the head of the one below */}
      {LIB_START.map((f0, k) => {
        const u = clamp01((frame - f0) / LIB_RISE);
        if (u <= 0) return null;
        const e = 1 - Math.pow(1 - u, 3);
        const hS = LIB_H * zoom;
        const wS = LIB_W * zoom;
        return (
          <div key={k} style={{ position: "absolute", left: sx(LIB_CX) - wS / 2, top: sy(FLOOR_Y - LIB_H * (k + 1)), width: wS, height: hS, overflow: "hidden" }}>
            <Img
              src={staticFile("cerro/shaft/nh_liberty.png")}
              style={{ position: "absolute", left: 0, top: 0, width: wS, height: hS, maxWidth: "none", transform: `translateY(${(1 - e) * hS}px)`, opacity: Math.min(1, u * 3), filter: "drop-shadow(0 2px 9px rgba(0,0,0,0.5))" }}
            />
          </div>
        );
      })}
      {frame > LIB_START[0] + 4 ? (
        <div style={{ position: "absolute", inset: 0, opacity: smooth(LIB_START[0] + 4, LIB_START[0] + 12, frame) }}>
          {(() => {
            const x = sx(LIB_CX + LIB_W / 2) + 14;
            const y0 = sy(FLOOR_Y - LIB_H);
            const y1 = sy(FLOOR_Y);
            const line: React.CSSProperties = { position: "absolute", backgroundColor: WHITE, boxShadow: "0 1px 6px rgba(0,0,0,0.55)" };
            return (
              <>
                <div style={{ ...line, left: x, top: y0, width: 2, height: y1 - y0 }} />
                <div style={{ ...line, left: x - 7, top: y0, width: 16, height: 2 }} />
                <div style={{ ...line, left: x - 7, top: y1 - 2, width: 16, height: 2 }} />
                <div style={{ position: "absolute", left: x + 16, top: Math.max(1290, (y0 + y1) / 2 - 30), fontFamily, fontWeight: 600, fontSize: 58, lineHeight: 1, color: WHITE, textShadow: SHADOW, whiteSpace: "nowrap" }}>
                  305<span style={{ fontSize: 30, fontWeight: 500, letterSpacing: "0.05em", marginLeft: 6 }}>FT</span>
                </div>
              </>
            );
          })()}
        </div>
      ) : null}

      {/* 5. the dimension line beside the shaft and the readout that counts with it */}
      {dimIn > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: dimIn }}>
          <div style={{ position: "absolute", left: dimX - 1.25, top: lipY, width: 2.5, height: Math.max(0, sy(depth) - lipY), backgroundColor: WHITE, boxShadow: "0 1px 7px rgba(0,0,0,0.55)" }} />
          <div style={{ position: "absolute", left: dimX - 9, top: lipY - 1.25, width: 18, height: 2.5, backgroundColor: WHITE }} />
          <div style={{ position: "absolute", left: dimX - 9, top: sy(depth) - 1.25, width: 18, height: 2.5, backgroundColor: WHITE }} />
          <div style={{ position: "absolute", left: READ_LEFT - 22, top: READ_LINE_Y, width: DIGIT_W * 3 + 98, height: 2.5, backgroundColor: WHITE, boxShadow: "0 1px 7px rgba(0,0,0,0.55)", opacity: readIn }} />
          <div
            style={{ position: "absolute", left: READ_LEFT, top: READ_LINE_Y - 172 + (1 - readIn) * 24, opacity: readIn, height: 160, display: "flex", alignItems: "baseline", fontFamily, color: WHITE, textShadow: SHADOW, fontVariantNumeric: "tabular-nums lining-nums", lineHeight: 1 }}
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

export default NineHundredReal;
