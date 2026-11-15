import {Composition} from 'remotion';
import ElevenTimesFaster, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/ElevenTimesFaster';

// Private render entry for ElevenTimesFaster (rsi-since-writing; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 183 frames.
export const RemotionRoot = () => (
  <Composition
    id="ElevenTimesFaster"
    component={ElevenTimesFaster}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
