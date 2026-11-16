import {Composition} from 'remotion';
import SkyrootTeamPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-portrait/SkyrootTeamPortrait';

// Private render entry for SkyrootTeamPortrait (skyroot-portrait; Core memory podcast style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 141 frames.
export const RemotionRoot = () => (
  <Composition
    id="SkyrootTeamPortrait"
    component={SkyrootTeamPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
