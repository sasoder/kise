import { Composition } from "remotion";
import HumansDidNotUnderstand, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from "../generated/components/HumansDidNotUnderstand";

// The field, its coordination, a white reading band that leaves it bare, the web
// coming back denser, and every thread swinging round to point at one place.
// Ajeya, 0:28.059 -> 0:36.539 (+16 frame tail).
export const RemotionRoot = () => {
  return (
    <Composition
      id="HumansDidNotUnderstand"
      component={HumansDidNotUnderstand}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
