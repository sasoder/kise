import {Composition} from 'remotion';
import DripFeed, {DURATION, FPS, defaultProps, schema} from '../generated/components/DripFeed';

// Private render entry for DripFeed (cut E of Sheppard_Vikings), so this cut
// renders while other builders own src/Root.tsx. Si Sheppard: "drip feed
// European technology, European beasts of burden, and above all, European
// diseases slowly into the Americas." Dwarkesh map style on the North Atlantic
// world, opaque, 1080x1920, 24 fps, 154 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DripFeed"
        component={DripFeed}
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
