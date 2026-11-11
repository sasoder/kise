import {Composition} from 'remotion';
import HyperSpecific, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-taylor-swift/HyperSpecific';

// Private render entry for HyperSpecific (wip-taylor-swift; Works in Progress style): a b&w record turns on the page and a red scarf, a cardigan and a polaroid are dealt out from under it.
// Opaque 1080x1920, 24 fps, 84 frames.
export const RemotionRoot = () => (
  <Composition
    id="HyperSpecific"
    component={HyperSpecific}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
