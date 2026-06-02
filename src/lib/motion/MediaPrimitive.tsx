import { Img, interpolate, useCurrentFrame, useVideoConfig, Video } from "remotion";
import { clipProgress, presence } from "./easing";
import type { ImageTrack, VideoTrack } from "../timeline/schema";

type MediaTrack = ImageTrack | VideoTrack;

export const MediaPrimitive = ({ track }: { track: MediaTrack }) => {
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

  const parallax = track.preset === "parallax" ? interpolate(progress, [0, 1], [24, -24]) : 0;
  const scale = track.preset === "pop" ? interpolate(progress, [0, 1], [0.92, 1]) : 1;

  const commonStyle = {
    width: "100%",
    height: "100%",
    objectFit: track.fit,
    display: "block",
  } as const;

  return (
    <div
      style={{
        position: "absolute",
        left: track.x - track.width / 2,
        top: track.y - track.height / 2,
        width: track.width,
        height: track.height,
        opacity: alpha,
        overflow: "hidden",
        transform: `translateY(${parallax}px) scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      {track.type === "video" ? (
        <Video src={track.src} muted={track.muted} style={commonStyle} />
      ) : (
        <Img src={track.src} style={commonStyle} />
      )}
    </div>
  );
};
