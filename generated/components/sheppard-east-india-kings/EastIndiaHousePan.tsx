import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

/**
 * EastIndiaHousePan — Thomas Malton's East India House with the Company's mark
 * stamped on it ("And the East India Trading Company"), then the editor's pan
 * across the painting. ONE OPAQUE graphic, 1080x1920, 24000/1001 fps, 52 frames:
 * it replaces the still and its Premiere keyframes, so the framing below is the
 * editor's own and must not be changed.
 *
 * Framing (from the Premiere keyframes): the painting at 141.80207824707 % of
 * its 1920x1354 pixels (2722.6 x 1920.0, the frame's height), centre y = 960;
 * centre x = 1263 at the START, 599 at the END (664 px to the left).
 *
 *   f0-51   ONE move from the START (f0) to the END (f51) on the time curve
 *           cubic-bezier(0.8, 0, 0.2, 1): the keyframes are dragged fully apart
 *           and the speed graph is one tall peak. The picture creeps a few px
 *           over the first 12 frames, whips across at about 65 px/frame around
 *           f25-26 (5x the average) and creeps the last px onto the END
 *   f0-14   the painting is DIMMED (a #1B1510 wash at 0.3, about 0.74
 *           brightness) and softly BLURRED (5 px) from the first frame
 *   f0-7    the mark pops in: scale 0.6 -> 1.04 (f5) -> 1.0 (f7), opacity 0.35 -> 1 (f0-4)
 *   f14-23  the mark leaves as the speed rises, riding with the picture:
 *           scale -> 0.88, opacity -> 0; gone before the fast part
 *   f14-25  dim and soft blur clear
 *   whip    a horizontal-only motion blur on the painting, sigma 0.22 x the
 *           px travelled per frame, none while it creeps: the burst reads as a
 *           smooth whip, not a strobe. The last frame is the untouched painting
 *
 * The mark is ANCHORED TO THE PAINTING: the painting, the wash and the seal are
 * children of one translated plane, so the seal drifts and pans exactly with
 * the picture. Its centre is at screen (540, 900) at the START framing. The
 * seal itself is never dimmed or blurred.
 *
 * Blur without a fringe: the painting's top and bottom edges are the frame's
 * edges, so the blurred layer carries a mirrored copy above and below it; the
 * blur then samples picture, never transparency. One SVG Gaussian carries both
 * blurs (sigma x = hypot(soft, whip), sigma y = soft).
 */

export const FPS = 24000 / 1001;
export const DURATION = 52;

const FRAME_H = 1920;

// ---- the editor's framing ----
const SRC_W = 1920;
const SRC_H = 1354;
const IMG_SCALE = 1.4180207824707;
const IMG_W = SRC_W * IMG_SCALE;
const IMG_H = SRC_H * IMG_SCALE;
const START_CX = 1263;
const END_CX = 599;
const IMG_TOP = FRAME_H / 2 - IMG_H / 2;

// ---- timing ----
const LAST = DURATION - 1;
const PAN_EASE = Easing.bezier(0.8, 0, 0.2, 1);
const POP_PEAK = 5;
const POP_END = 7;
const LEAVE_START = 14;
const MARK_GONE = 23;
const CLEAR_END = 25;
const MOTION_BLUR = 0.22; // sigma per px travelled in a frame
const MOTION_BLUR_MIN = 0.3; // below this sigma the picture is left sharp

// ---- dim + blur ----
const WASH = "#1B1510";
const WASH_ALPHA = 0.3;
const BLUR_PX = 5;

// ---- the seal (Dwarkesh map style) ----
const SEAL = 640;
const SEAL_SCREEN_X = 540; // at the START framing
const SEAL_SCREEN_Y = 900;
const RING = 5;
const RING_INSET = 11;
const MARK_W = 490;
// the mark's source image and the centre of its smallest enclosing circle in it
const MARK_SRC_W = 1400;
const MARK_SRC_H = 1362;
const MARK_SRC_CX = 700;
const MARK_SRC_CY = 780;
const MARK_SCALE = MARK_W / MARK_SRC_W;
const UMBER = "rgba(42,34,26,0.92)"; // #2A221A
const ORANGE = "#FFB000";
// #E9DDBF as the constant column of the colour matrix
const CREAM_MATRIX = `0 0 0 0 ${233 / 255}  0 0 0 0 ${221 / 255}  0 0 0 0 ${191 / 255}  0 0 0 1 0`;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The painting's centre x: one bezier-eased move over the whole clip. */
const centreX = (frame: number) => {
  const u = Math.min(1, Math.max(0, frame / LAST));
  return START_CX + (END_CX - START_CX) * PAN_EASE(u);
};

const EastIndiaHousePan: React.FC = () => {
  const frame = useCurrentFrame();

  const left = centreX(frame) - IMG_W / 2;
  const soft = 1 - interpolate(frame, [LEAVE_START, CLEAR_END], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const softBlur = BLUR_PX * soft;
  // px travelled during this frame (centred), as a horizontal blur
  const speed = Math.abs(centreX(frame + 0.5) - centreX(frame - 0.5));
  const whip = MOTION_BLUR * speed >= MOTION_BLUR_MIN ? MOTION_BLUR * speed : 0;
  const blurX = Math.hypot(softBlur, whip);
  const blurY = softBlur;
  const blurred = blurX > 0;

  const pop =
    frame <= POP_PEAK
      ? interpolate(frame, [0, POP_PEAK], [0.6, 1.04], { ...clamp, easing: Easing.out(Easing.cubic) })
      : interpolate(frame, [POP_PEAK, POP_END], [1.04, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const leave = interpolate(frame, [LEAVE_START, MARK_GONE], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const sealScale = pop * (1 - 0.12 * leave);
  const sealOpacity = interpolate(frame, [0, 4], [0.35, 1], clamp) * (1 - leave);

  const painting = staticFile("eastindia/east-india-house-malton.jpg");
  const imgStyle: React.CSSProperties = { position: "absolute", left: 0, width: IMG_W, height: IMG_H };

  return (
    <AbsoluteFill style={{ backgroundColor: WASH, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="eihp-cream" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={CREAM_MATRIX} />
          </filter>
          <filter id="eihp-blur" colorInterpolationFilters="sRGB" x="-2%" y="0%" width="104%" height="100%">
            <feGaussianBlur stdDeviation={`${blurX} ${blurY}`} />
          </filter>
        </defs>
      </svg>
      {/* the image plane: everything in it rides with the painting */}
      <div style={{ position: "absolute", left: 0, top: IMG_TOP, width: IMG_W, height: IMG_H, transform: `translateX(${left}px)` }}>
        {blurred ? (
          <div style={{ position: "absolute", left: 0, top: -IMG_H, width: IMG_W, height: IMG_H * 3, filter: "url(#eihp-blur)" }}>
            <Img src={painting} style={{ ...imgStyle, top: 0, transform: "scaleY(-1)" }} />
            <Img src={painting} style={{ ...imgStyle, top: IMG_H }} />
            <Img src={painting} style={{ ...imgStyle, top: IMG_H * 2, transform: "scaleY(-1)" }} />
          </div>
        ) : (
          <Img src={painting} style={{ ...imgStyle, top: 0 }} />
        )}
        {soft > 0 ? <div style={{ position: "absolute", inset: 0, backgroundColor: WASH, opacity: WASH_ALPHA * soft }} /> : null}
        {sealOpacity > 0 ? (
          <div
            style={{
              position: "absolute",
              left: SEAL_SCREEN_X - (START_CX - IMG_W / 2) - SEAL / 2,
              top: SEAL_SCREEN_Y - IMG_TOP - SEAL / 2,
              width: SEAL,
              height: SEAL,
              opacity: sealOpacity,
              transform: `scale(${sealScale})`,
            }}
          >
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: UMBER }} />
            <div
              style={{
                position: "absolute",
                inset: RING_INSET,
                borderRadius: "50%",
                border: `${RING}px solid ${ORANGE}`,
                boxSizing: "border-box",
              }}
            />
            <Img
              src={staticFile("eastindia/eic-mark.png")}
              style={{
                position: "absolute",
                left: SEAL / 2 - MARK_SRC_CX * MARK_SCALE,
                top: SEAL / 2 - MARK_SRC_CY * MARK_SCALE,
                width: MARK_W,
                height: MARK_SRC_H * MARK_SCALE,
                filter: "url(#eihp-cream)",
              }}
            />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default EastIndiaHousePan;
