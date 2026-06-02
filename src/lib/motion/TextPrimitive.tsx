import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clipProgress, presence } from "./easing";
import type { TextTrack } from "../timeline/schema";

export const TextPrimitive = ({ track }: { track: TextTrack }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = clipProgress({
    frame,
    start: track.start,
    duration: track.duration,
    easing: track.easing,
    fps,
  });
  const alpha = presence({
    frame,
    start: track.start,
    duration: track.duration,
  });

  const lift = interpolate(progress, [0, 1], [36, 0]);
  const scale = track.preset === "slam" ? interpolate(progress, [0, 1], [1.18, 1]) : 1;
  const reveal = track.preset === "mask-reveal" ? `${progress * 100}%` : "100%";
  const tickerOffset =
    track.preset === "ticker" ? interpolate(progress, [0, 1], [track.width, 0]) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: track.x - track.width / 2,
        top: track.y - track.fontSize * 0.72,
        width: track.width,
        opacity: alpha,
        overflow: "hidden",
        clipPath: `inset(0 ${track.preset === "mask-reveal" ? 100 - progress * 100 : 0}% 0 0)`,
      }}
    >
      <div
        style={{
          width: reveal,
          color: track.color,
          fontFamily: track.fontFamily,
          fontSize: track.fontSize,
          fontWeight: track.fontWeight,
          lineHeight: 0.92,
          letterSpacing: 0,
          textAlign: track.align,
          transform: `translateY(${lift}px) translateX(${tickerOffset}px) scale(${scale})`,
          transformOrigin: "center",
          whiteSpace: "pre-wrap",
        }}
      >
        {track.text}
      </div>
    </div>
  );
};
