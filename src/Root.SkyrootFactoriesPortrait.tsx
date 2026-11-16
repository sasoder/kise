import {Composition} from 'remotion';
import SkyrootFactoriesPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-portrait/SkyrootFactoriesPortrait';

// Private render entry for SkyrootFactoriesPortrait (skyroot-portrait; Core memory podcast style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 97 frames.
export const RemotionRoot = () => (
  <Composition
    id="SkyrootFactoriesPortrait"
    component={SkyrootFactoriesPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
