import {Composition} from 'remotion';
import Improvisation, {DURATION, FPS, defaultProps, schema} from '../generated/components/sheppard-capture-not-kill/Improvisation';

// Private render entry for Improvisation (Si Sheppard, "Capture, not kill"):
// one tall Americas map, the two orange empires still, and two engraved insets
// in which Cortés's 1519 and Pizarro's 1532 marches are drawn turn by turn.
// Opaque, 1080x1920, 23.976 fps, 179 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Improvisation"
        component={Improvisation}
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
