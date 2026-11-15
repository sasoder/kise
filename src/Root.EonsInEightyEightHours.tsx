import { Composition } from "remotion";
import EonsInEightyEightHours, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from "../generated/components/rsi-since-writing/EonsInEightyEightHours";

// Private render entry for EonsInEightyEightHours (rsi-since-writing; Dwarkesh 3D style): the orange line of the AIs' 88 hours runs back down a road of milestones to 3200 BC.
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
