import {Composition} from 'remotion';
import LibraryOfCulturalEvolution, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-vaccine/LibraryOfCulturalEvolution';

// Private render entry for LibraryOfCulturalEvolution (kyle-vaccine; Dwarkesh 3D style): one crane pull-back from Jenner's glowing book to the whole library, people of every era shelving books.
// Opaque 1080x1920, 29.97 fps, 166 frames.
export const RemotionRoot = () => (
  <Composition
    id="LibraryOfCulturalEvolution"
    component={LibraryOfCulturalEvolution}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
