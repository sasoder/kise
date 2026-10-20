import {Composition} from 'remotion';
import LondonToNewYork, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-shore-trailer/LondonToNewYork';

// Private render entry for LondonToNewYork (zach-shore-trailer; Core memory podcast style): <one line on the picture>.
// Opaque 2048x1080, 23.976 fps, 90 frames.
export const RemotionRoot = () => (
  <Composition
    id="LondonToNewYork"
    component={LondonToNewYork}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
