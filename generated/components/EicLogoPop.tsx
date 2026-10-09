import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

/**
 * EicLogoPop — the East India Company's mark pops up over a painting of East
 * India House ("And the East India Trading Company"), then gets out of the way
 * of the editor's pan. Transparent 1080x1920 overlay, 24000/1001 fps, 34 frames.
 *
 * Dwarkesh map style: the real Company mark (public/eastindia/eic-mark.png,
 * white on alpha, recoloured to cream #E9DDBF by a colour matrix) 520 px wide
 * on a solid dark-umber seal (#2A221A at 0.92, 680 px) with a 5 px house-orange
 * ring just inside its edge. The mark is three-armed, so it is centred by its
 * smallest enclosing circle (not its bounding box): the three crosses end at
 * the same distance from the ring. Seal centre (540, 800), above the captions.
 *
 *   f0-7    pop: scale 0.6 -> 1.04 (f5) -> 1.0 (f7), opacity 0 -> 1 (f0-4)
 *   f7-22   hold, with a slow creep (2 % over the hold, carried through the exit)
 *   f22-31  leave: scale x 0.86, opacity -> 0 (ease-in); gone at f31
 *   f31-33  fully transparent
 */

export const FPS = 24000 / 1001;
export const DURATION = 34;

const CX = 540;
const CY = 800;
const SEAL = 680;
const RING = 5;
const RING_INSET = 12;
const MARK_W = 520;
// the source image and the centre of the mark's smallest enclosing circle in it
const SRC_W = 1400;
const SRC_H = 1362;
const SRC_CX = 700;
const SRC_CY = 780;
const MARK_SCALE = MARK_W / SRC_W;

const UMBER = "rgba(42,34,26,0.92)"; // #2A221A
const ORANGE = "#FFB000";
// #E9DDBF as the constant column of the colour matrix
const CREAM_MATRIX = `0 0 0 0 ${233 / 255}  0 0 0 0 ${221 / 255}  0 0 0 0 ${191 / 255}  0 0 0 1 0`;

const POP_PEAK = 5;
const POP_END = 7;
const LEAVE_START = 22;
const LEAVE_END = 31;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const EicLogoPop: React.FC = () => {
  const frame = useCurrentFrame();

  const pop =
    frame <= POP_PEAK
      ? interpolate(frame, [0, POP_PEAK], [0.6, 1.04], { ...clamp, easing: Easing.out(Easing.cubic) })
      : interpolate(frame, [POP_PEAK, POP_END], [1.04, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const creep = interpolate(frame, [POP_END, LEAVE_START], [1, 1.02], { extrapolateLeft: "clamp", extrapolateRight: "extend" });
  const leave = interpolate(frame, [LEAVE_START, LEAVE_END], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const scale = pop * creep * (1 - 0.14 * leave);
  const opacity = interpolate(frame, [0, 4], [0, 1], clamp) * (1 - leave);

  if (opacity <= 0) return <AbsoluteFill />;

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="eic-cream" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={CREAM_MATRIX} />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          left: CX - SEAL / 2,
          top: CY - SEAL / 2,
          width: SEAL,
          height: SEAL,
          opacity,
          transform: `scale(${scale.toFixed(5)})`,
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
            left: SEAL / 2 - SRC_CX * MARK_SCALE,
            top: SEAL / 2 - SRC_CY * MARK_SCALE,
            width: MARK_W,
            height: SRC_H * MARK_SCALE,
            filter: "url(#eic-cream)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default EicLogoPop;
