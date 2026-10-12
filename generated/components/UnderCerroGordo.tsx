import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";

/**
 * UnderCerroGordo — cut X of the Core Memory short "brent - the mine death
 * count". ONE OPAQUE, silent, PHOTOGRAPHIC graphic, 1080x1920, 24000/1001 fps,
 * 115 frames (sequence frames 26-141). Not in the core-memory look: everything
 * here belongs to the photograph.
 *
 * CHECK LINE (what the viewer can say afterwards): "Under this town, about 200
 * feet down, is a level of the mine, and that is where the accident in the old
 * newspaper happened."
 *
 * The motion in three sentences. Frame 0 is the editor's still of Cerro Gordo
 * (2005) at the editor's framing; ONE peaked pan takes the eye about 1560 px
 * down while the photo turns into its own X-ray: a dark, quiet ground in which
 * the mine's workings show as soft light, the chamber on the 200 level arriving
 * at the true middle of the frame, and from there the camera never stops: it
 * keeps sinking half a pixel a frame to the end. The chamber warms once, and the
 * real 1897 newspaper item grows out of it, solid paper from its first frame,
 * while the picture behind dims and softens. A yellow highlighter is drawn
 * across its printed headline, and the clipping eases a little closer.
 *
 * Words (local frames; f0 = sequence frame 26):
 *   there's            0        the most           44-51
 *   the 200 level      7-19     infamous           51-62
 *   of the mine        19-28    accident           62-79
 *   And that's where   31-44    happened           79-87
 *   in Cerro Gordo's   87-99    mining history     99-112     END 115
 *
 * Beats:
 *   f0       exactly the editor's still (the photo at 2880x1920, left -39;
 *            public/minedeath/ucg_photo.png is that framing resampled once).
 *   f0-32    THE PAN: 1553 px on cubic-bezier(0.8, 0, 0.2, 1), running out into
 *            the slow sink (below): world y 0 -> 1556 at f32. First frame f0,
 *            last frame of the bezier f32, peak 236 px/frame at f16 (4.9x its
 *            average of 48.5): 74 px by f8, 404 by f14, 1323 by f20, 1556 at
 *            f32. Vertical-only motion blur, sigma 0.22 x px/frame (52 px at
 *            the peak), none below sigma 0.3, so f0 and everything from f32 on
 *            is sharp.
 *   f20-114  THE SLOW SINK: the camera keeps going down at 0.5 px/frame. Its
 *            speed eases in under the settling pan (f20-f32), so the pan's
 *            speed falls smoothly to 0.5 and stays there: no rest, no kink, no
 *            blur. The 200 level passes screen y 960 at f40; 41 px of travel
 *            between f32 and f114.
 *   f0-20    the X-ray rises from the bottom edge of the photo up to world
 *            y 1350 (a rising, feathered mask on the baked world: at f0 nothing
 *            of it is inside the frame).
 *   f33-44   the chamber on the 200 level warms once: its interior about 28 %
 *            brighter at f39 (highlights rolled off in the bake, so its rough
 *            edge stays readable) inside one clean soft glow on the ground,
 *            settling a little brighter than before.
 *   f46-56   the clipping grows out of the chamber, opaque throughout: its
 *            centre travels from the chamber to (540, 890) by f53 while it
 *            scales 0.6 -> 1.04 (f53) -> 1.0 (f56) about its own centre; at
 *            rest 940 px wide, tilted 1.5 deg (at the overshoot 39 px from
 *            each frame edge). The picture behind dims to 0.72 with a warm-dark
 *            wash and softens by 5 px over the same frames.
 *   f62-74   the highlighter is drawn left to right across the printed
 *            headline, in the clipping's own coordinates, multiplied on the
 *            paper so the type stays black.
 *   f74-115  the clipping eases 4 % closer about its headline; with the sink
 *            everything is still moving on the last frame.
 *
 * The world (px; depth 3.1 px per foot, surface = world y 1900):
 *   y 0-1920      the photo, untouched, at the editor's framing (ucg_photo.png)
 *   y 1200-3700   public/minedeath/ucg_world.jpg: the photo turning into its
 *                 X-ray (world y 1350-1800), the dark ground and the workings,
 *                 baked as ONE image by scripts/bake-under-cerro-gordo.py (see
 *                 its header). The frame shows world y 1556-3476 at f32,
 *                 1560-3480 at f40 and 1597-3517 at f114.
 *   shaft x 330 (thin, plumb, the dimmest). Every junction on it is a T on one
 *   side, never a crossbar: the 200 level (y ~2520) leaves it to the right and
 *   runs into the chamber (a wide, low, rough-edged room, x 630-969, its roof
 *   95-142 px above the drift's floor, no peaks, no pillar) and dies in a
 *   short stub past it; a mid drift (y ~2900) leaves it to the
 *   left; the 400 level (y ~3140) reaches it from the right, from the foot of
 *   the ore chimney that steps down-left from the chamber.
 *
 * Blur without a fringe: the world is drawn into a box 180 px taller than the
 * frame at top and bottom and 36 px wider at each side (the baked world has
 * that margin), with a mirrored copy of the photo above its top edge, so the
 * Gaussian samples picture, never transparency. One SVG Gaussian carries both
 * blurs (sigma x = soft, sigma y = hypot(soft, motion)).
 */

export const FPS = 24000 / 1001;
export const DURATION = 115;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const FRAME_W = 1080;
const FRAME_H = 1920;

// ---- the baked rasters (scripts/bake-under-cerro-gordo.py) ----
// ucg_photo.png is the photo AT THE EDITOR'S FRAMING (2580 x 1720 drawn at
// 2880 x 1920 = 111.6279 %, left -39, top 0), resampled once with Lanczos and
// cropped to world x -36..1116, so the browser draws it 1:1.
const WORLD_MX = 36;
const PHOTO_W = 1152;
const PHOTO_H = 1920;
const WORLD_TOP = 1200;
const WORLD_W = 1152;
const WORLD_H = 2500;
const HOT_X = 420;
const HOT_Y = 2130;
const HOT_W = 696;
const HOT_H = 660;
const LEVEL_200 = 2520;
const ROOM_X = 800;
const ROOM_Y = 2472;

// ---- the slow sink: the camera never stops. Its speed eases in under the settling pan (f20-f32, so there
// is no kink) and is then constant to the last frame ----
const SINK_SPEED = 0.5; // px per frame
const SINK_IN = 20;
const SINK_FULL = 32;
const MID_FRAME = 40; // the 200 level passes the true middle of the frame here

/** px the slow sink has added by `frame`: the integral of SINK_SPEED x smoothstep(SINK_IN..SINK_FULL). */
const sinkPx = (frame: number) => {
  const n = SINK_FULL - SINK_IN;
  const t = Math.min(1, Math.max(0, (frame - SINK_IN) / n));
  return SINK_SPEED * (n * (t * t * t - (t * t * t * t) / 2) + Math.max(0, frame - SINK_FULL));
};

// ---- the pan ----
// 1553.25 px on the bezier. With the sink the camera is at 1556.25 at f32 and 1560.25 at f40 (the 200
// level on screen y 960) and 1597.25 at f114. The .25 keeps every frame after the landing on a quarter
// pixel (x.25, x.75, x.25 ...), so the half-pixel steps are all resampled alike and the grain does not
// flicker between a sharp and a soft frame.
const PAN_PX = LEVEL_200 - FRAME_H / 2 + 0.25 - sinkPx(MID_FRAME);
const PAN_END = 32;
const PAN_EASE = Easing.bezier(0.8, 0, 0.2, 1);
const MOTION_BLUR = 0.22; // sigma per px travelled in a frame
const MOTION_BLUR_MIN = 0.3; // below this sigma the picture is left sharp
const BLUR_PAD = 180; // > 3 sigma of the fastest frame (52 px); at f114 the box ends at world y 3697, inside the raster (3700)

// ---- the X-ray rising into the photo ----
const GRADE_END = 20;
const GRADE_TOP = WORLD_TOP; // where the mask ends up
const GRADE_FEATHER = 420; // as tall as the baked ramp, so the rising edge is never a line
const PHOTO_END = PHOTO_H;

// ---- the chamber's swell ----
const SWELL_START = 33;
const SWELL_PEAK = 39;
const SWELL_END = 44;
const SWELL_REST = 0.25;

// ---- the clipping ----
const POP_START = 46;
const POP_PEAK = 53;
const POP_END = 56;
const WASH = "#1B1510";
const WASH_ALPHA = 0.31; // about 0.72 brightness
const BLUR_PX = 5;
const PAPER_W = 676; // scan px: the 662 x 634 scan plus 9/5/6/6 px of blank paper
const PAPER_H = 646;
const CLIP_PAD = 60; // transparent pad of the png round the paper (its shadow), scan px
const CLIP_W = 940; // at the 1.04 overshoot its tilted box is 1002 px wide: 39 px to each frame edge, 40+ to the cut paper
const CLIP_K = CLIP_W / PAPER_W;
const CLIP_CX = 540;
const CLIP_CY = 890;
const TILT = -1.5;

// ---- the highlight, in paper px (headline measured in the scan: x 112-536, caps 20 px,
// baseline y 63 at its left end and y 60 at its right end; + the 9/6 px paper pad) ----
const HL_START = 62;
const HL_END = 74;
const HL_X0 = 114;
const HL_X1 = 552;
const HL_CY0 = 59.2; // centre of the line at its left end
const HL_CY1 = 56.4; // and at its right end
const HL_H = 26; // 1.3 x the capitals
const HL_YELLOW = "#FFEC3A";

// ---- the hold ----
const HOLD_START = 74;
const HOLD_SPAN = 56; // the ease runs past the last frame, so nothing has stopped at f114
const PUSH = 0.05; // x 0.81 reached at f114 = 4 %

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Camera top edge in world px: the one bezier move, running out into the slow sink. */
const camY = (frame: number) => {
  const u = Math.min(1, Math.max(0, frame / PAN_END));
  return PAN_PX * PAN_EASE(u) + sinkPx(frame);
};

/** A smoothstep ramp as gradient stops (a linear ramp would show its two ends). */
const maskGradient = (a: number, b: number) => {
  const stops = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((p) => {
    const alpha = p * p * (3 - 2 * p);
    return `rgba(0,0,0,${alpha.toFixed(4)}) ${(a + (b - a) * p).toFixed(2)}px`;
  });
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
};

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

  // ---- camera, motion blur, dim + soft blur ----
  const cam = camY(frame);
  const speed = Math.abs(camY(frame + 0.5) - camY(frame - 0.5));
  const whip = MOTION_BLUR * speed >= MOTION_BLUR_MIN ? MOTION_BLUR * speed : 0;
  const soft = interpolate(frame, [POP_START, POP_END], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const softBlur = BLUR_PX * soft;
  const blurX = softBlur;
  const blurY = Math.hypot(softBlur, whip);
  const blurred = blurY > 0;

  // ---- the X-ray rises from the photo's bottom edge ----
  const rise = interpolate(frame, [0, GRADE_END], [0, PHOTO_END - GRADE_TOP], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const maskA = PHOTO_END - rise; // world y where the graded world starts to show
  const maskB = Math.min(PHOTO_END, maskA + Math.min(GRADE_FEATHER, 0.85 * rise)); // and where it is fully there
  const mask = maskGradient(maskA - WORLD_TOP, maskB - WORLD_TOP);

  // ---- the chamber warms once ----
  const swell =
    frame <= SWELL_PEAK
      ? interpolate(frame, [SWELL_START, SWELL_PEAK], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
      : interpolate(frame, [SWELL_PEAK, SWELL_END], [1, SWELL_REST], { ...clamp, easing: Easing.inOut(Easing.quad) });

  // ---- the clipping ----
  const pop =
    frame <= POP_PEAK
      ? interpolate(frame, [POP_START, POP_PEAK], [0.6, 1.04], { ...clamp, easing: Easing.out(Easing.cubic) })
      : interpolate(frame, [POP_PEAK, POP_END], [1.04, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  // its centre travels from the chamber to its rest place over the same frames, without overshooting, so the
  // 1.04 overshoot is in size only and symmetric: the paper stays clear of both frame edges
  const arrive = interpolate(frame, [POP_START, POP_PEAK], [0.6, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const hold = interpolate(frame, [HOLD_START, HOLD_START + HOLD_SPAN], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const push = 1 + PUSH * hold;
  // the tip touches the paper one frame before HL_START, so the stroke is visibly under way on it
  const drawn = interpolate(frame, [HL_START - 1, HL_END], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const hlLead = HL_X0 - 3 + (HL_X1 - HL_X0 + 11) * drawn;

  const photo = staticFile("minedeath/ucg_photo.png");
  const photoStyle: React.CSSProperties = { position: "absolute", left: -WORLD_MX, width: PHOTO_W, height: PHOTO_H, maxWidth: "none" };
  const paperW = PAPER_W * CLIP_K;
  const paperH = PAPER_H * CLIP_K;
  const hlCx = ((HL_X0 + HL_X1) / 2) * CLIP_K;
  const hlCy = ((HL_CY0 + HL_CY1) / 2) * CLIP_K;

  return (
    <AbsoluteFill style={{ backgroundColor: "#2A1F17", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="ucg-blur" colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`${blurX} ${blurY}`} />
          </filter>
        </defs>
      </svg>

      {/* the picture: one box a little larger than the frame, blurred as a whole */}
      <div
        style={{
          position: "absolute",
          left: -WORLD_MX,
          top: -BLUR_PAD,
          width: FRAME_W + 2 * WORLD_MX,
          height: FRAME_H + 2 * BLUR_PAD,
          overflow: "hidden",
          filter: blurred ? "url(#ucg-blur)" : undefined,
        }}
      >
        {/* the world plane: everything in it rides with the camera */}
        <div style={{ position: "absolute", left: WORLD_MX, top: BLUR_PAD, width: FRAME_W, height: 0, transform: `translateY(${-cam}px)` }}>
          {cam < BLUR_PAD ? <Img src={photo} style={{ ...photoStyle, top: -PHOTO_H, transform: "scaleY(-1)" }} /> : null}
          <Img src={photo} style={{ ...photoStyle, top: 0 }} />
          <Img
            src={staticFile("minedeath/ucg_world.jpg")}
            style={{
              position: "absolute",
              left: -WORLD_MX,
              top: WORLD_TOP,
              width: WORLD_W,
              height: WORLD_H,
              maxWidth: "none",
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
          />
          {swell > 0 ? (
            <Img
              src={staticFile("minedeath/ucg_room_hot.png")}
              style={{ position: "absolute", left: HOT_X, top: HOT_Y, width: HOT_W, height: HOT_H, maxWidth: "none", opacity: swell }}
            />
          ) : null}
        </div>
      </div>

      {/* warm-dark wash while the clipping is up */}
      {soft > 0 ? <AbsoluteFill style={{ backgroundColor: WASH, opacity: WASH_ALPHA * soft }} /> : null}

      {/* the clipping: solid paper from its first frame; grows out of the chamber, then eases closer about its headline */}
      {frame >= POP_START ? (
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              left: CLIP_CX - paperW / 2,
              top: CLIP_CY - paperH / 2,
              width: paperW,
              height: paperH,
              transform: `translate(${(1 - arrive) * (ROOM_X - CLIP_CX)}px, ${(1 - arrive) * (ROOM_Y - cam - CLIP_CY)}px) scale(${pop}) rotate(${TILT}deg)`,
            }}
          >
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
                src={staticFile("minedeath/ucg_clipping.png")}
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
                <svg
                  width={paperW}
                  height={paperH}
                  viewBox={`0 0 ${PAPER_W} ${PAPER_H}`}
                  style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "multiply" }}
                >
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
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export default UnderCerroGordo;
