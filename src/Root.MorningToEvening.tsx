import {Composition} from 'remotion';
import MorningToEvening, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/MorningToEvening';

// Private render entry for MorningToEvening (rsi-since-writing; Dwarkesh 3D style): you hand the Genius one sheet in the morning light; while the sun crosses the window to dusk, a bookcase beside him fills with year binders 1-12.
// Opaque 1080x1920, 23.976 fps, 152 frames.
export const RemotionRoot = () => (
  <Composition
    id="MorningToEvening"
    component={MorningToEvening}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
