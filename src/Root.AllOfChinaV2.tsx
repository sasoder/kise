import {Composition} from 'remotion';
import AllOfChinaV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/AllOfChinaV2';

// Private render entry for AllOfChinaV2 (Sarah Paine, Pearl Harbor clip, cut C,
// cold-review V2): Japan's dashed-orange plan grows out of Manchukuo over all of
// China, the solid conquest stops dead on the 1938 front, and the un-taken claim
// cracks and drains to a dashed cream outline. Dwarkesh map style on the PearlKit
// ASIA world; opaque 1080x1920, 24 fps, 124 frames.
export const RemotionRoot = () => {
  return (
    <Composition
      id="AllOfChinaV2"
      component={AllOfChinaV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
