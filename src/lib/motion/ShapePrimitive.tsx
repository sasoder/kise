import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clipProgress, presence } from "./easing";
import type { ShapeTrack } from "../timeline/schema";

export const ShapePrimitive = ({ track }: { track: ShapeTrack }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = clipProgress({
    frame,
    start: track.start,
    duration: track.duration,
    easing: track.easing,
    fps,
  });
  const alpha =
    track.opacity *
    presence({
      frame,
      start: track.start,
      duration: track.duration,
    });

  const scale = track.preset === "pulse" ? interpolate(progress, [0, 0.6, 1], [0.92, 1.08, 1]) : progress;
  const drift = track.preset === "drift" ? interpolate(progress, [0, 1], [-32, 32]) : 0;
  const wipeWidth = track.preset === "wipe" ? track.width * progress : track.width;
  const isCircle = track.shape === "circle";
  const isLine = track.shape === "line";

  return (
    <div
      style={{
        position: "absolute",
        left: track.x - wipeWidth / 2 + drift,
        top: track.y - track.height / 2,
        width: isLine ? wipeWidth : wipeWidth,
        height: isLine ? Math.max(2, track.height) : track.height,
        borderRadius: isCircle ? "50%" : track.radius,
        backgroundColor: track.color,
        opacity: alpha,
        transform: `scale(${track.preset === "wipe" ? 1 : scale})`,
        transformOrigin: "center",
      }}
    />
  );
};
