import {Composition} from 'remotion';
import HairRippedForScience, {DURATION, FPS, defaultProps, schema} from '../generated/components/acorn-hair-ripped/HairRippedForScience';

// Private render entry for HairRippedForScience (acorn-hair-ripped; Core memory podcast style): "GETTING MY HAIR / RIPPED OUT / FOR SCIENCE" title sting.
// Transparent overlay 1080x1920, 23.976 fps, 120 frames.
export const RemotionRoot = () => (
  <Composition
    id="HairRippedForScience"
    component={HairRippedForScience}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
