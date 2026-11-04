import {Composition} from 'remotion';
import SpaceReopened, {DURATION, FPS, defaultProps, schema} from '../generated/components/kofman-vivaldi/SpaceReopened';

// Private render entry for SpaceReopened (kofman-vivaldi; ChinaTalk style (newsprint)): the red front line bleeds away into the real grey zone of 3 Nov 2026, then a push in on its broken stretch around Lyman.
// Opaque 1080x1920, 24 fps, 80 frames.
export const RemotionRoot = () => (
  <Composition
    id="SpaceReopened"
    component={SpaceReopened}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
