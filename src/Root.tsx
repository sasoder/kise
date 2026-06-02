import { Composition } from "remotion";
import { TimelineComposition } from "./lib/timeline/TimelineComposition";
import { defaultMotionPlan } from "./lib/timeline/default-plan";

export const RemotionRoot = () => {
  return (
    <Composition
      id={defaultMotionPlan.id}
      component={TimelineComposition}
      durationInFrames={defaultMotionPlan.format.durationInFrames}
      fps={defaultMotionPlan.format.fps}
      width={defaultMotionPlan.format.width}
      height={defaultMotionPlan.format.height}
      defaultProps={{ plan: defaultMotionPlan }}
    />
  );
};
