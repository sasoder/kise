import {Composition} from 'remotion';
import FreeStreetNoEngine, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-slavery/FreeStreetNoEngine';

// Private render entry for FreeStreetNoEngine (kyle-rome-slavery; Dwarkesh map style): one dolly down a Pompeii street of free workshops, the dashed engine far off at its end.
// Opaque 1080x1920, 29.97 fps, 288 frames.
export const RemotionRoot = () => (
  <Composition
    id="FreeStreetNoEngine"
    component={FreeStreetNoEngine}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
