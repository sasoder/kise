import {Composition} from 'remotion';
import SoCentralized, {DURATION, FPS, defaultProps, schema} from '../generated/components/SoCentralized';

// Private render entry for SoCentralized (the first graphic of the Sheppard
// "Centralized empires fell fast" set): the tree builds, one stroke takes the
// emperor, the whole thing falls, the camera glides to the dispersed bands.
// Opaque engraved page, 1080x1920, 24 fps, 166 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SoCentralized"
        component={SoCentralized}
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
