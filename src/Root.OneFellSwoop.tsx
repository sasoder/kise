import {Composition} from 'remotion';
import OneFellSwoop, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OneFellSwoop';

// Private render entry for OneFellSwoop, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard: "...the Spanish couldn't take out the
// Maya in one fell swoop. They couldn't do to the Maya what they'd done to the
// Aztecs." Dwarkesh map style, 1080x1920, 24fps, 143 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OneFellSwoop"
        component={OneFellSwoop}
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
