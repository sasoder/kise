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
 *   f0-14   START framing with a 5 px drift to the left; the painting is
 *           DIMMED (a #1B1510 wash at 0.3, about 0.74 brightness) and BLURRED
 *           (5 px) from the first frame
 *   f0-7    the mark pops in: scale 0.6 -> 1.04 (f5) -> 1.0 (f7), opacity 0.35 -> 1 (f0-4)
 *   f14-51  the pan to the END framing, one cubic ease-in-out that takes over
 *           the drift's speed (no hitch at f14) and stops exactly on the END
 *   f14-26  the mark leaves, riding with the picture: scale -> 0.88, opacity -> 0
 *   f14-30  dim and blur clear; from f30 the frame is the untouched painting
 *
 * The mark is ANCHORED TO THE PAINTING: the painting, the wash and the seal are
 * children of one translated plane, so the seal drifts and pans exactly with
 * the picture. Its centre is at screen (540, 900) at the START framing. The
 * seal itself is never dimmed or blurred.
 *
 * Blur without a fringe: the painting's top and bottom edges are the frame's
 * edges, so the blurred layer carries a mirrored copy above and below it; the
 * blur then samples picture, never transparency.
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
const PAN_START = 14;
const PAN_END = DURATION - 1;
const DRIFT_PX = 5;
const POP_PEAK = 5;
const POP_END = 7;
const MARK_GONE = 26;
const CLEAR_END = 30;

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

/** The painting's centre x. A linear drift to f14, then a cubic Hermite to the
 *  END that starts at the drift's speed and arrives with none. */
const centreX = (frame: number) => {
  if (frame <= PAN_START) return START_CX - (DRIFT_PX * frame) / PAN_START;
  const from = START_CX - DRIFT_PX;
  const span = PAN_END - PAN_START;
  const dist = END_CX - from;
  const u = Math.min(1, (frame - PAN_START) / span);
  const m0 = ((-DRIFT_PX / PAN_START) * span) / dist; // the drift's speed in curve units
  const p = m0 * (u * u * u - 2 * u * u + u) + (-2 * u * u * u + 3 * u * u);
  return from + dist * p;
};

const EastIndiaHousePan: React.FC = () => {
  const frame = useCurrentFrame();

  const left = centreX(frame) - IMG_W / 2;
  const soft = 1 - interpolate(frame, [PAN_START, CLEAR_END], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const blur = BLUR_PX * soft;

  const pop =
    frame <= POP_PEAK
      ? interpolate(frame, [0, POP_PEAK], [0.6, 1.04], { ...clamp, easing: Easing.out(Easing.cubic) })
      : interpolate(frame, [POP_PEAK, POP_END], [1.04, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const leave = interpolate(frame, [PAN_START, MARK_GONE], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
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
        </defs>
      </svg>
      {/* the image plane: everything in it rides with the painting */}
      <div style={{ position: "absolute", left: 0, top: IMG_TOP, width: IMG_W, height: IMG_H, transform: `translateX(${left}px)` }}>
        {blur > 0 ? (
          <div style={{ position: "absolute", left: 0, top: -IMG_H, width: IMG_W, height: IMG_H * 3, filter: `blur(${blur}px)` }}>
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
