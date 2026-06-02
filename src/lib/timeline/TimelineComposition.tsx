import { AbsoluteFill, Sequence } from "remotion";
import { MediaPrimitive } from "../motion/MediaPrimitive";
import { ShapePrimitive } from "../motion/ShapePrimitive";
import { TextPrimitive } from "../motion/TextPrimitive";
import { motionPlanSchema, type MotionPlan, type TimelineTrack } from "./schema";

const renderTrack = (track: TimelineTrack) => {
  if (track.type === "text") {
    return <TextPrimitive track={{ ...track, start: 0 }} />;
  }

  if (track.type === "shape") {
    return <ShapePrimitive track={{ ...track, start: 0 }} />;
  }

  return <MediaPrimitive track={{ ...track, start: 0 }} />;
};

export const TimelineComposition = ({ plan }: { plan: MotionPlan }) => {
  const parsed = motionPlanSchema.parse(plan);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: parsed.format.transparent ? undefined : "#000000",
        overflow: "hidden",
      }}
    >
      {parsed.tracks.map((track) => (
        <Sequence key={track.id} from={track.start} durationInFrames={track.duration}>
          {renderTrack(track)}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
