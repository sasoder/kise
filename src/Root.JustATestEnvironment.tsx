import {Composition} from 'remotion';
import JustATestEnvironment, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/JustATestEnvironment';

// Private render entry for JustATestEnvironment (Noam_Trap, cut 5 of 5), so this
// cut renders while other builders own src/Root.tsx. Orange Dwarkesh on the grid
// background: the model traces a sly dashed plot round the back of the test
// environment, drops it, and then looks all the way round the dashed ring it is
// standing in. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="JustATestEnvironment"
        component={JustATestEnvironment}
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
