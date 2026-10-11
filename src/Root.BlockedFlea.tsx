import {Composition} from 'remotion';
import BlockedFlea, {DURATION, FPS, defaultProps, schema} from '../generated/components/BlockedFlea';

// Private render entry for BlockedFlea (plague clip, the blocked-flea centrepiece; 1080x1920, 29.97 fps, 311 f).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BlockedFlea"
        component={BlockedFlea}
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
