import {Composition} from 'remotion';
import ExtractNotCreate, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-slavery/ExtractNotCreate';

// Private render entry for ExtractNotCreate (kyle-rome-slavery; Dwarkesh map style): a reclining master beside his coin heap fed by a line of slaves (fast rise, then a plateau), while a dashed orange mill and village that could have been built compound past it.
// Opaque 1080x1920, 29.97 fps, 186 frames.
export const RemotionRoot = () => (
  <Composition
    id="ExtractNotCreate"
    component={ExtractNotCreate}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
