import {Composition} from 'remotion';
import MinusSixtyToPlusSixty, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-radar-map/MinusSixtyToPlusSixty';

// Private render entry for MinusSixtyToPlusSixty (scott-radar-map; Cheeky Pint style (stout)): NPS -60 for the plain delay text sinks below the apron edge, +60 for the radar picture rises as high above it.
// Opaque 1080x1920, 23.976 fps, 150 frames.
export const RemotionRoot = () => (
  <Composition
    id="MinusSixtyToPlusSixty"
    component={MinusSixtyToPlusSixty}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
