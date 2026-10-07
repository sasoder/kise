import {Composition} from 'remotion';
import DripFeedLong, {DURATION, FPS, defaultProps, schema} from '../generated/components/DripFeedLong';

// Private render entry for DripFeedLong (cut E of Sheppard_Vikings extended
// backwards by 100 frames: 47_DripFeed.mov), so this cut renders while other
// builders own src/Root.tsx. Si Sheppard: "a long-term presence in the new
// world, they may have been able to drip feed European technology, European
// beasts of burden, and above all, European diseases slowly into the
// Americas." Dwarkesh map style on the North Atlantic world, opaque,
// 1080x1920, 24 fps, 254 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DripFeedLong"
        component={DripFeedLong}
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
