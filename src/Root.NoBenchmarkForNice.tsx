import {Composition} from 'remotion';
import NoBenchmarkForNice, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-benchmaxxing/NoBenchmarkForNice';

// Private render entry for NoBenchmarkForNice (sam-benchmaxxing; Cheeky Pint style (stout)): SWE-bench and AIME rise amber columns; the "nice to work with" tile gets only an empty dashed outline and a "?".
// Opaque 1080x1920, 23.976 fps, 100 frames.
export const RemotionRoot = () => (
  <Composition
    id="NoBenchmarkForNice"
    component={NoBenchmarkForNice}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
