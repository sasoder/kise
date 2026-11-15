import {Composition} from 'remotion';
import TimelineToTheDataCenter, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/TimelineToTheDataCenter';

// Private render entry for TimelineToTheDataCenter (rsi-ten-earths; Dwarkesh 3D style): one forward dolly down a road past sinking 2026/2027/2028 year plates to a building whose front wall drops away on "a country of geniuses" to a lit hall of orange Geniuses typing and walking.
// Opaque 1080x1920, 23.976 fps, 173 frames.
export const RemotionRoot = () => (
  <Composition
    id="TimelineToTheDataCenter"
    component={TimelineToTheDataCenter}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
