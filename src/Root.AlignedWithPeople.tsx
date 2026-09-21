import { Composition } from "remotion";
import AlignedWithPeople, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from "../generated/components/AlignedWithPeople";

// Private render entry for AlignedWithPeople — cut 1 of `Noam_Alignment` — so
// this cut renders while other builders own src/Root.tsx and their own cuts.
// Orange Dwarkesh on the grid background: a formation of orange agent comets
// turns as one through the links between its members, then the same links
// reach down in white from a person above it and the flock starts, loosely, to
// turn the person's way. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AlignedWithPeople"
        component={AlignedWithPeople}
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
