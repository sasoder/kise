import {Composition} from 'remotion';
import OneFellSwoopV3, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OneFellSwoopV3';

// Private render entry for OneFellSwoopV3 (walled-states rebuild of V2), so this cut renders while other
// builders own src/Root.tsx. Si Sheppard: "...the Spanish couldn't take out the
// Maya in one fell swoop. They couldn't do to the Maya what they'd done to the
// Aztecs." Dwarkesh map style, 1080x1920, 24fps, 313 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OneFellSwoopV3"
        component={OneFellSwoopV3}
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
