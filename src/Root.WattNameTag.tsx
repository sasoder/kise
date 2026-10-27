import {Composition} from 'remotion';
import WattNameTag, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/WattNameTag';

// Private render entry for WattNameTag (kyle-rome-industrial; Name tag): "James Watt / Invented the efficient steam engine, 1769" over the Lauder still at 114.5 s.
// Transparent overlay 1080x1920, 29.97 fps, 113 frames.
export const RemotionRoot = () => (
  <Composition
    id="WattNameTag"
    component={WattNameTag}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
