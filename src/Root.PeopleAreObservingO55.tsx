import { Composition } from "remotion";
import PeopleAreObservingO55, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from "../generated/components/PeopleAreObservingO55";

// Private render entry for PeopleAreObservingO55 (Noam_Punishing_AIs cut 7 of 8,
// O55 rebuild): the model draws our instruments in its own colour — an orange
// bracket round "chain of thought", then an orange reader line under its own
// last line. Opaque 1080x1920 at 24 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PeopleAreObservingO55"
        component={PeopleAreObservingO55}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
