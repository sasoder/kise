import {Composition} from 'remotion';
import DefenseFirstThenOffense, {DURATION, FPS, defaultProps, schema} from '../generated/components/kofman-vivaldi/DefenseFirstThenOffense';

// Private render entry for DefenseFirstThenOffense (kofman-vivaldi; ChinaTalk style (newsprint)): a red drone defends our trench, then leads the attack on theirs.
// Opaque 1080x1920, 24 fps, 248 frames.
export const RemotionRoot = () => (
  <Composition
    id="DefenseFirstThenOffense"
    component={DefenseFirstThenOffense}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
