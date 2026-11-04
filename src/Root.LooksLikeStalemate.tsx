import {Composition} from 'remotion';
import LooksLikeStalemate, {DURATION, FPS, defaultProps, schema} from '../generated/components/kofman-vivaldi/LooksLikeStalemate';

// Private render entry for LooksLikeStalemate (kofman-vivaldi; ChinaTalk style (newsprint)): a red line written down the real Lyman front, then held still under a slow push.
// Opaque 1080x1920, 24 fps, 56 frames.
export const RemotionRoot = () => (
  <Composition
    id="LooksLikeStalemate"
    component={LooksLikeStalemate}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
