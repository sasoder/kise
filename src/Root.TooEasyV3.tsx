import {Composition} from 'remotion';
import TooEasyV3, {DURATION, FPS, defaultProps, schema} from '../generated/components/TooEasyV3';

// Private render entry for TooEasyV3 (Noam_Challenge_The_Model V3), so this cut renders
// while other sessions own src/Root.tsx. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => (
  <Composition
    id="TooEasyV3"
    component={TooEasyV3}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
