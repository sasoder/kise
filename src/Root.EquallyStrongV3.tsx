import {Composition} from 'remotion';
import EquallyStrongV3, {DURATION, FPS, defaultProps, schema} from '../generated/components/EquallyStrongV3';

// Private render entry for EquallyStrongV3 (Noam_Challenge_The_Model V3), so this cut renders
// while other sessions own src/Root.tsx. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => (
  <Composition
    id="EquallyStrongV3"
    component={EquallyStrongV3}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
