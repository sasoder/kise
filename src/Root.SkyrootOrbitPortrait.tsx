import {Composition} from 'remotion';
import SkyrootOrbitPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-portrait/SkyrootOrbitPortrait';

// Private render entry for SkyrootOrbitPortrait (skyroot-portrait; Core memory podcast style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 76 frames.
export const RemotionRoot = () => (
  <Composition
    id="SkyrootOrbitPortrait"
    component={SkyrootOrbitPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
