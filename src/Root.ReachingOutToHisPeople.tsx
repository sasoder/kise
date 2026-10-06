import {Composition} from 'remotion';
import ReachingOutToHisPeople, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ReachingOutToHisPeople';

// Private render entry for ReachingOutToHisPeople (cut E of the Sheppard
// "strings" set), so this cut renders while other builders own src/Root.tsx.
// Atahualpa under Pizarro's three orange strings sends his quipu cords out to
// six dormant hosts; orange starts along them and does not arrive. Opaque
// 1080x1920, 24 fps, 154 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ReachingOutToHisPeople"
        component={ReachingOutToHisPeople}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
