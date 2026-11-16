import {Composition} from 'remotion';
import SkyrootNewsPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-portrait/SkyrootNewsPortrait';

// Private render entry for SkyrootNewsPortrait (skyroot-portrait; Core memory podcast style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 44 frames.
export const RemotionRoot = () => (
  <Composition
    id="SkyrootNewsPortrait"
    component={SkyrootNewsPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
