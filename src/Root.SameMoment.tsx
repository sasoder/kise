import {Composition} from 'remotion';
import SameMoment, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/SameMoment';

// Private render entry for SameMoment (Sarah Paine, Pearl Harbor clip, cut F):
// close on Oahu as the carrier strike lands on Pearl Harbor, then one pull-back
// west across the Pacific reveals that seven other strikes landed on the same
// frame. Dwarkesh map style, PACIFIC world of the Pearl kit. Opaque, 1080x1920,
// 24 fps, 268 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SameMoment"
        component={SameMoment}
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
