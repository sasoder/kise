import {Composition} from 'remotion';
import FreedComputeRunsCopies, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/FreedComputeRunsCopies';

// Private render entry for FreedComputeRunsCopies (rsi-ten-earths; Dwarkesh 3D style): from cut 6's last frame the freed racks of BLOCK_27 light 1 -> 3 -> 9 -> 27 and a new orange Genius steps out beside each one, his own line of light running to a pool at his feet.
// Opaque 1080x1920, 23.976 fps, 262 frames.
export const RemotionRoot = () => (
  <Composition
    id="FreedComputeRunsCopies"
    component={FreedComputeRunsCopies}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
