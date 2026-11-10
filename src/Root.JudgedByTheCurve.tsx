import {Composition} from 'remotion';
import JudgedByTheCurve, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-fall-of-gods/JudgedByTheCurve';

// Private render entry for JudgedByTheCurve (rsi-fall-of-gods; Dwarkesh style): a code card drops into a loss plot under three lab marks and the orange run beats the baseline curve.
// Opaque 1080x1920, 23.976 fps, 191 frames.
export const RemotionRoot = () => (
  <Composition
    id="JudgedByTheCurve"
    component={JudgedByTheCurve}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
