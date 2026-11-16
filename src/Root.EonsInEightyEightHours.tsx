import { Composition } from "remotion";
import EonsInEightyEightHours, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from "../generated/components/rsi-since-writing/EonsInEightyEightHours";

// Private render entry for EonsInEightyEightHours (rsi-since-writing; Dwarkesh 3D style): the robot types through 88 hours (the window turns day to night four times, the clock races) while its sheets pile up as paper strata that lift its desk onto a pillar of paper falling away into the haze.
// Opaque 1080x1920, 23.976 fps, 143 frames.
export const RemotionRoot = () => (
  <Composition
    id="EonsInEightyEightHours"
    component={EonsInEightyEightHours}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
