import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";

/**
 * HuCrowdPan — a whip pan across a newspaper-halftone panorama, from Hu Jintao's
 * portrait onto the crowd. ONE OPAQUE baked clip, 1080x1920, 24 fps, 74 frames.
 *
 * Check line: "The camera leaves Hu Jintao and the crowd he has to find jobs for
 * just keeps going."
 *
 * Line: "(Hu Jintao goes,) making 25 million new jobs every year."
 *   making f3 · 25 f7 · million f20 · new f33 · jobs f41 · every f51 · year f60-66 · cut f74
 *
 * Framing: the panorama is 4526x1920, drawn at NATIVE size, so its top and
 * bottom edges are the frame's. startX / endX are the x of the LEFT edge of the
 * 1080-wide window in those pixels:
 *   A  jordanhu/hu_crowd_a.jpg   306 -> 3350  (3044 px; the paper margin starts at x 4449)
 *   B  jordanhu/hu_crowd_b.jpg   284 -> 3350  (3066 px; the paper margin starts at x 4445)
 * The window's right edge ends on x 4430: crowd, never the margin.
 *
 * Motion: ONE move from the first frame to the last, no keyframe in between: a
 * whip with a constant drift blended in (6 % of the way, 2.5 px/frame), so the
 * window already creeps on Hu from frame 0 (the shot before is footage of him),
 * lets go on "25" and whips at about 208 px/frame on f17-18, between "25" and
 * "million" (5x the average), with 87 % of the way behind it by f30. From there
 * it only decelerates, so the crowd is readable on "new jobs" (11 px/frame on
 * f41) and then just keeps sliding right, 5.8 px/frame on f49 down to 2.9 at the
 * cut, never slower. The image carries a horizontal-only motion blur, sigma
 * 0.22 x the px travelled that frame, and none at all under 5.8 px/frame, so
 * f0-6 and f49-73 are the untouched halftone (f0 and f73 pixel for pixel).
 *
 * The time curve is a closed form, not a cubic-bezier: with its speed peak on
 * f16-18 a cubic-bezier already moves 10 px/frame or more at f5 and gets at
 * most 79 % of the way by f30 (see progress() below).
 */

export const FPS = 24;
export const DURATION = 74;

const FRAME_W = 1080;
// both panoramas, at native size
const PLANE_W = 4526;
const PLANE_H = 1920;
const PAPER = "#FCF4EA"; // the panorama's own paper; never seen, the plane always covers the frame

export const schema = z.object({
  src: z.string().default("jordanhu/hu_crowd_a.jpg"),
  startX: z
    .number()
    .min(0)
    .max(PLANE_W - FRAME_W)
    .default(306),
  endX: z
    .number()
    .min(0)
    .max(PLANE_W - FRAME_W)
    .default(3350),
});
export type HuCrowdPanProps = z.infer<typeof schema>;
export const defaultProps = schema.parse({});

// ---- the time curve ----
const LAST = DURATION - 1;
// The whip: curve(f) = (1 + (TURN / f)^TAIL)^-LAUNCH, scaled to reach 1 on the last frame.
// Its speed graph is one early peak: it starts as f^(TAIL x LAUNCH), flat on Hu,
// and the distance still to go falls off as f^-TAIL.
const TURN = 16.5; // frames: puts the speed peak on f17
const TAIL = 4.5; // how fast the tail decays: 0.4 px/frame of its own at the cut
const LAUNCH = 1.6; // how late and how sharply it lets go of Hu
// The drift: this share of the way is covered at constant speed over the whole clip
// (2.5 px/frame), so the window creeps on Hu from frame 0 and never slows below that.
const DRIFT = 0.06;
const curve = (f: number) => (f <= 0 ? 0 : Math.pow(1 + Math.pow(TURN / f, TAIL), -LAUNCH));
const CURVE_END = curve(LAST);
// progress = (1 - DRIFT) x whip + DRIFT x f / LAST, exactly 0 on f0 and 1 on the last frame
const progress = (frame: number) => {
  const f = Math.min(LAST, Math.max(0, frame));
  const whip = curve(f) / CURVE_END;
  return whip + DRIFT * (f / LAST - whip);
};

// ---- the whip blur ----
const MOTION_BLUR = 0.22; // sigma per px travelled in a frame
// Below this sigma (5.8 px/frame) the picture is left sharp: the drift alone and the frames
// that only creep on top of it, f0-6 and f49-73. Chrome's Gaussian does nothing under 0.8 px
// sigma anyway (its box window rounds to 1 px) and is one coarse step from there to 1.33, so
// the last blurred frame on either side (f7, f48) still carries the smallest blur there is.
const MOTION_BLUR_MIN = 1.27;

/** x of the window's left edge in the panorama's pixels. */
export const windowX = (frame: number, startX: number, endX: number) => startX + (endX - startX) * progress(frame);

/** Horizontal blur sigma for a frame: the px travelled during it (centred), 0 while it creeps. */
export const whipSigma = (frame: number, startX: number, endX: number) => {
  const travelled = Math.abs(windowX(frame + 0.5, startX, endX) - windowX(frame - 0.5, startX, endX));
  const sigma = MOTION_BLUR * travelled;
  if (sigma < MOTION_BLUR_MIN) return 0;
  // the blur reaches 3 sigma to each side: it must find picture there, never the plane's end
  const x = windowX(frame, startX, endX);
  const room = Math.max(0, Math.min(x, PLANE_W - FRAME_W - x));
  return Math.min(sigma, room / 3);
};

const HuCrowdPan: React.FC<HuCrowdPanProps> = ({ src, startX, endX }) => {
  const frame = useCurrentFrame();
  const x = windowX(frame, startX, endX);
  const sigma = whipSigma(frame, startX, endX);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          {/* the region is the whole plane, so the blur samples picture well past the frame's edges */}
          <filter id="hcp-whip" colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`${sigma} 0`} />
          </filter>
        </defs>
      </svg>
      {/* the image plane: wider than the frame at all times, never clipped before the blur */}
      <div style={{ position: "absolute", left: 0, top: 0, width: PLANE_W, height: PLANE_H, transform: `translateX(${-x}px)` }}>
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: PLANE_W,
            height: PLANE_H,
            filter: sigma > 0 ? "url(#hcp-whip)" : undefined,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default HuCrowdPan;
