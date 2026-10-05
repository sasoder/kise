import {Composition} from 'remotion';
import WhoAreTheNeighbors, {DURATION, FPS, defaultProps, schema} from '../generated/components/WhoAreTheNeighbors';

// Private render entry for WhoAreTheNeighbors (cut F of the Sheppard Iraq clip, builder N), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style, 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="WhoAreTheNeighbors"
        component={WhoAreTheNeighbors}
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
