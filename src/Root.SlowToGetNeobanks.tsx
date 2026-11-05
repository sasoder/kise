import {Composition} from 'remotion';
import SlowToGetNeobanks, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-neobanks-us/SlowToGetNeobanks';

// Private render entry for SlowToGetNeobanks (nik-neobanks-us; Cheeky Pint style (stout)): a push-in over the lower 48 crowded with cream banks to one amber phone barely out of its slot.
// Opaque 1080x1920, 23.976 fps, 62 frames.
export const RemotionRoot = () => (
  <Composition
    id="SlowToGetNeobanks"
    component={SlowToGetNeobanks}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
