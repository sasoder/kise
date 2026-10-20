import {Composition} from 'remotion';
import HugeLandscapesV3, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/HugeLandscapesV3';

// Private render entry for HugeLandscapesV3 (kyle-first-farmers; Dwarkesh map style): V1 with the farm's own rough range: on 'whereas farmers' the camera moves in and a small dashed area closes round the farm (field, longhouse, people), its twin on the forest inside the foragers' huge range.
// Opaque 1080x1920, 29.97 fps, 334 frames.
export const RemotionRoot = () => (
  <Composition
    id="HugeLandscapesV3"
    component={HugeLandscapesV3}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
