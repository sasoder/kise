import { interpolate, spring } from "remotion";
import type { Easing } from "../timeline/schema";

export const clipProgress = ({
  frame,
  start,
  duration,
  easing,
  fps,
}: {
  frame: number;
  start: number;
  duration: number;
  easing: Easing;
  fps: number;
}) => {
  const localFrame = frame - start;

  if (easing === "spring") {
    return spring({
      frame: localFrame,
      fps,
      config: {
        damping: 18,
        stiffness: 160,
        mass: 0.9,
      },
      durationInFrames: Math.min(duration, 34),
    });
  }

  return interpolate(localFrame, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const presence = ({
  frame,
  start,
  duration,
}: {
  frame: number;
  start: number;
  duration: number;
}) =>
  interpolate(
    frame,
    [start, start + 8, start + duration - 8, start + duration],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
