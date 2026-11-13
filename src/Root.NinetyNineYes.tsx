import {Composition} from 'remotion';
import NinetyNineYes, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-any-idea/NinetyNineYes';

// Private render entry for NinetyNineYes (nik-any-idea; Cheeky Pint style (stout)): a 10 x 10 grid of idea bulbs lights amber in one wave under a pull-back; one stays cream; the counter lands on 99%.
// Opaque 1080x1920, 23.976 fps, 95 frames.
export const RemotionRoot = () => (
  <Composition
    id="NinetyNineYes"
    component={NinetyNineYes}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
