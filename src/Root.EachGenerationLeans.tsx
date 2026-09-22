import {Composition} from 'remotion';
import EachGenerationLeans, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/EachGenerationLeans';

// Private render entry for cut 3 of Noam_Alignment_Degradation v2,
// "EachGenerationLeans" (in at 0:15.300): the accelerating chain of births,
// gens 3-8, the tower curving off the plumb line. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="EachGenerationLeans"
        component={EachGenerationLeans}
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
