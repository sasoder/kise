import {Composition} from 'remotion';
import TerminalsAcrossUkraine, {DURATION, FPS, defaultProps, schema} from '../generated/components/kofman-starlink/TerminalsAcrossUkraine';

// Private render entry for TerminalsAcrossUkraine (kofman-starlink; ChinaTalk style (newsprint)): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 143 frames.
export const RemotionRoot = () => (
  <Composition
    id="TerminalsAcrossUkraine"
    component={TerminalsAcrossUkraine}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
