import {Composition} from 'remotion';
import LimitedObjectives, {DURATION, FPS, defaultProps, schema} from '../generated/components/LimitedObjectives';

// Private render entry for LimitedObjectives (cut A of the Sheppard Iraq clip), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style,
// 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LimitedObjectives"
        component={LimitedObjectives}
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
