import {Composition} from 'remotion';
import HaveToBeNuclear, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-wind/HaveToBeNuclear';

// Private render entry for HaveToBeNuclear (scott-nolan-wind; Cheeky Pint style (stout) in 3D): the plug seats in nuclear, then cash stacks show nuclear costs most.
// Opaque 1080x1920, 23.976 fps, 129 frames.
export const RemotionRoot = () => (
  <Composition
    id="HaveToBeNuclear"
    component={HaveToBeNuclear}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
